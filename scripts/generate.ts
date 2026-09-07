// generate.ts — Deno script: parse a multi-year GOARCH Google-export ICS and
// emit `calendar`-command files.
//
// Movable (Pascha-relative) feasts are emitted as `Paskha±N` lines so the
// `calendar` command computes their dates correctly every year. Readings are
// keyed by (civil date, Pascha offset) so a Lenten weekday's pericope — which
// follows the Paschal cycle, not the civil calendar — resolves correctly for
// any year.
//
// Usage:  deno run --allow-read --allow-write scripts/generate.ts <input.ics> <out-dir>

const [inputPath, outDir] = Deno.args;
if (!inputPath || !outDir) {
  console.error("Usage: generate.ts <input.ics> <out-dir>");
  Deno.exit(1);
}

// ---------------------------------------------------------------------------
// ICS parsing (Google Calendar export: CRLF, folded lines, \, \; \\ \n escapes)
// ---------------------------------------------------------------------------

interface RawEvent {
  dtstart: string; // YYYYMMDD
  description: string;
}

function parseICS(text: string): RawEvent[] {
  const out: RawEvent[] = [];
  for (const b of text.split("BEGIN:VEVENT").slice(1)) {
    const raw = b.split("END:VEVENT")[0];
    const folded: string[] = [];
    for (const l of raw.split(/\r?\n/)) {
      if (/^[ \t]/.test(l)) folded[folded.length - 1] += l.slice(1);
      else folded.push(l);
    }
    const kv: Record<string, string> = {};
    for (const l of folded) {
      const m = l.match(/^([^;:]+)(?:;[^:]*)?:(.*)$/);
      if (m) kv[m[1]] = m[2];
    }
    if (kv.DTSTART) out.push({ dtstart: kv.DTSTART, description: kv.DESCRIPTION ?? "" });
  }
  return out;
}

const unesc = (s: string) =>
  s.replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\n/g, "\n").replace(/\\\\/g, "\\");

// ---------------------------------------------------------------------------
// Orthodox Easter (Paskha) on the Gregorian calendar — Meeus Julian computus
// + 13 days offset, valid 1900–2099.
// ---------------------------------------------------------------------------

function orthodoxEasterGreg(year: number): { m: number; d: number } {
  const a = year % 4, b = year % 7, c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const jul = new Date(Date.UTC(year, month - 1, day));
  const greg = new Date(jul.getTime() + 13 * 86400000);
  return { m: greg.getUTCMonth() + 1, d: greg.getUTCDate() };
}

const dayOfYear = (m: number, d: number) =>
  Math.floor((Date.UTC(2000, m - 1, d) - Date.UTC(2000, 0, 1)) / 86400000) + 1;

// ---------------------------------------------------------------------------
// Field extraction from a DESCRIPTION
// ---------------------------------------------------------------------------

const FAST_VALUES = new Set([
  "Strict Fast",
  "Fast Day (Wine and Oil Allowed)",
  "Fast Day (Fish Allowed)",
  "Fast Day (Dairy, Eggs, and Fish Allowed)",
  "Fast Free",
]);

interface DayData {
  year: number;
  month: number;
  day: number;
  feast: string;            // "Saints and Feasts:" value (; -joined), one line
  readings: ReadingSlot[];  // every reading slot present
  fast: string;             // fasting marker ("" if none)
}

interface ReadingSlot {
  type: string;  // "Old Testament" | "Matins Gospel" | "Epistle" | "Gospel"
  book: string;  // canonical book name (alias-normalized)
  verse: string; // "4:4-7" style reference
}

// Canonicalize a book name so alias variants collapse:
//   "St. Paul's Letter to the Galatians"  -> "Galatians"
//   "St. Paul's Second Letter to Timothy" -> "2 Timothy"
//   "II Corinthians" / "2 Corinthians"     -> "2 Corinthians"
//   "Acts of the Apostles" / "Acts"        -> "Acts"
//   "The Holy Gospel according to ..." stays untouched (Gospel slot carries book)
// Canonical short book name. The source uses several verbose forms; map them all.
function canonBook(raw: string): string {
  const s = raw.replace(/\s+/g, " ").trim();

  // "St. James' Universal Letter" / "St. Peter's Second Universal Letter" / etc.
  const catholic = s.match(/^St\.\s*(James'?s?|Peter'?s?|John'?s?|Jude'?s?)\s+(?:First|Second|Third|1st|2nd|3rd|I|II|III)?\s*Universal Letter$/i);
  if (catholic) {
    const ordinal = s.match(/\b(First|Second|Third|1st|2nd|3rd|I|II|III)\b/i);
    const o = ordinal ? ({ first: "1", second: "2", third: "3", "1st": "1", "2nd": "2", "3rd": "3", i: "1", ii: "2", iii: "3" }[ordinal[1].toLowerCase()] ?? "") : "";
    return `${o} ${catholic[1].replace(/'\w*$/, "")}`.trim();
  }

  // "St. Paul's [First/Second/Third] Letter to [the] <Book>"
  const paul = s.match(/^St\.\s*Paul'?s?\s+(First|Second|Third|1st|2nd|3rd|I|II|III)?\s*Letter\s+to\s+(?:the\s+)?(.+)$/i);
  if (paul) {
    const book = paul[2].replace(/\s+/g, " ").trim();
    const o = paul[1] ? ({ first: "1", second: "2", third: "3", "1st": "1", "2nd": "2", "3rd": "3", i: "1", ii: "2", iii: "3" }[paul[1].toLowerCase()] ?? "") : "";
    return o ? `${o} ${book}` : book;
  }

  return s
    .replace(/^Acts of the Apostles$/i, "Acts")
    .replace(/^Jud\.$/i, "Jude")
    .replace(/^I\b/, "1")
    .replace(/^II\b/, "2")
    .replace(/^III\b/, "3")
    .replace(/^IV\b/, "4")
    .replace(/^First\b/i, "1")
    .replace(/^Second\b/i, "2")
    .replace(/^Third\b/i, "3")
    .trim();
}
function extractReadings(desc: string): ReadingSlot[] {
  const out: ReadingSlot[] = [];
  for (const l of desc.split("\n")) {
    const m = l.trim().match(/^(Old Testament|Matins Gospel|Epistle|Gospel) Reading:\s*(.*)$/);
    if (!m) continue;
    // Book = everything before the first "N:N" verse ref; verse = the rest.
    const ref = m[2].trim();
    const iv = ref.search(/\d+\s*:\s*\d/);
    if (iv < 0) continue;
    const book = ref.slice(0, iv).trim();
    const verse = ref.slice(iv).replace(/\s+/g, "");
    out.push({ type: m[1], book: canonBook(book), verse });
  }
  return out;
}

function extractDay(e: RawEvent): DayData | null {
  const y = +e.dtstart.slice(0, 4);
  const m = +e.dtstart.slice(4, 6);
  const d = +e.dtstart.slice(6, 8);
  const desc = unesc(e.description);
  const feastM = desc.match(/Saints and Feasts[:\s]*([^\n]+)/);
  if (!feastM) return null;
  const feast = feastM[1].trim();
  let fast = "";
  for (const line of desc.split("\n")) {
    const t = line.trim();
    if (FAST_VALUES.has(t)) { fast = t; break; }
  }
  return { year: y, month: m, day: d, feast, readings: extractReadings(desc), fast };
}

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

const days = parseICS(await Deno.readTextFile(inputPath))
  .map(extractDay)
  .filter((x): x is DayData => x !== null);

const paskhaByYear: Record<number, { m: number; d: number }> = {};
for (const yd of days) {
  if (!paskhaByYear[yd.year]) paskhaByYear[yd.year] = orthodoxEasterGreg(yd.year);
}

// Classify movable vs fixed by whether a feast label's civil date drifts across
// years while its Pascha offset is constant.
const labelInfo: Record<string, { dates: Set<string>; offsets: Set<number> }> = {};
for (const yd of days) {
  const first = yd.feast.split(";")[0].trim();
  if (!labelInfo[first]) labelInfo[first] = { dates: new Set(), offsets: new Set() };
  labelInfo[first].dates.add(`${yd.month}-${yd.day}`);
  labelInfo[first].offsets.add(dayOfYear(yd.month, yd.day) - dayOfYear(paskhaByYear[yd.year].m, paskhaByYear[yd.year].d));
}

const movableOffset: Record<string, number> = {};
for (const [label, info] of Object.entries(labelInfo)) {
  if (info.offsets.size === 1 && info.dates.size > 1) movableOffset[label] = [...info.offsets][0];
}
const isMovable = (feastFirst: string) => feastFirst in movableOffset;

// ---------------------------------------------------------------------------
// Readings model: a reading belongs to a feast, keyed by (civil date) for fixed
// feasts or (Pascha offset) for movable ones. A reading "drifts" if the same
// civil date gets different readings in different Pascha years — those must be
// emitted on Paskha±N lines (like movable feasts) so `calendar` resolves them.
// ---------------------------------------------------------------------------

// A date's reading is "stable" iff, for every reading slot, the (book, verse)
// is identical in every year that includes that slot (early export years
// sometimes omit a slot; that's a gap, not drift).
const readingVerseByDate = new Map<string, Map<string, Set<string>>>();
for (const yd of days) {
  const md = `${yd.month}-${yd.day}`;
  if (!readingVerseByDate.has(md)) readingVerseByDate.set(md, new Map());
  for (const r of yd.readings) {
    const slot = `${r.type}::${r.book}`;
    if (!readingVerseByDate.get(md)!.has(slot)) readingVerseByDate.get(md)!.set(slot, new Set());
    readingVerseByDate.get(md)!.get(slot)!.add(r.verse);
  }
}
// Stable iff no slot carries more than one distinct verse across years.
function isStableReading(yd: DayData): boolean {
  const bySlot = readingVerseByDate.get(`${yd.month}-${yd.day}`);
  if (!bySlot || bySlot.size === 0) return false;
  for (const verses of bySlot.values()) if (verses.size > 1) return false;
  return true;
}

const MONTHS = ["January","February","March","April","May","June","July", "August","September","October","November","December"];

const FAST_EMOJI: Record<string, string> = {
  "Strict Fast": "☦️",
  "Fast Day (Wine and Oil Allowed)": "🍇",
  "Fast Day (Fish Allowed)": "🐟",
  "Fast Day (Dairy, Eggs, and Fish Allowed)": "🧀",
  "Fast Free": "",
};

const FAST_LABEL: Record<string, string> = {
  "Strict Fast": "Strict Fast (No Allowance for Oil)",
};

const offsetLine = (off: number) => (off === 0 ? "Paskha" : `Paskha${off > 0 ? "+" : ""}${off}`);

// canonical year = most recent full year (365+ events)
const yearCounts: Record<number, number> = {};
for (const d of days) yearCounts[d.year] = (yearCounts[d.year] || 0) + 1;
const canonicalYear = Object.entries(yearCounts)
  .filter(([, n]) => n >= 365)
  .map(([y]) => +y)
  .sort((a, b) => b - a)[0];
const src = days.filter((d) => d.year === canonicalYear);

const saints = new Map<string, { date: string; lines: string[] }>();
const fasts = new Map<string, { date: string; fast: string }>();
const readings = new Map<string, { date: string; lines: string[] }>();
const seenFixed = new Set<string>();
const seenMovable = new Set<string>();

// join reading slots into a single display string, OT readings merged with "; "
// Compact reading display: drop the repeated "Reading" word, use "·" as a
// field separator so references are scannable at a glance.
const READING_LABEL: Record<string, string> = {
  "Old Testament": "OT",
  "Matins Gospel": "Matins",
  "Epistle": "Epistle",
  "Gospel": "Gospel",
};

// Each reading gets its own line (Matins/Epistle/Gospel; each OT book separately).
function slotLines(slots: ReadingSlot[]): string[] {
  const lines: string[] = [];
  for (const s of slots) {
    const tag = s.type === "Old Testament" ? "OT" : (READING_LABEL[s.type] ?? s.type);
    lines.push(`${tag} ${s.book} ${s.verse}`);
  }
  return lines;
}

for (const yd of src) {
  const { label, all } = splitFeast(yd.feast);
  const pk = paskhaByYear[yd.year];
  const off = dayOfYear(yd.month, yd.day) - dayOfYear(pk.m, pk.d);
  const movable = isMovable(label);

  // Commemoration: lead feast first, each saint its own entry (rendered as a
  // separate continuation line).
  const commem = [label, ...all.slice(1)];

  const key = movable ? `off:${off}` : `${yd.month}-${yd.day}`;
  const dateStr = movable ? offsetLine(off) : `${MONTHS[yd.month - 1]} ${yd.day}`;

  if (movable ? !seenMovable.has(key) : !seenFixed.has(key)) {
    (movable ? seenMovable : seenFixed).add(key);
    saints.set(key, { date: dateStr, lines: commem });

    if (yd.readings.length) {
      // Reading is keyed by Pascha offset when it drifts (cycle-determined),
      if (isStableReading(yd)) {
        readings.set(key, { date: dateStr, lines: slotLines(yd.readings) });
      } else {
        readings.set(`off:${off}`, { date: offsetLine(off), lines: slotLines(yd.readings) });
      }
    }
    if (yd.fast) fasts.set(key, { date: dateStr, fast: yd.fast });
  }
}

// Fixed-date readings that drift with the Paschal cycle are attached to their
// day's Pascha-relative key when they are the *movable feast's* reading; the
// fixed Great Feasts (stable) keep their civil date. No separate pass needed.

const sortKey = (k: string) => {
  if (k.startsWith("off:")) return 10000 + parseInt(k.slice(4));
  const [m, d] = k.split("-").map(Number);
  return m * 100 + d;
};

function writeChannel(name: string, lines: string[]) {
  Deno.mkdirSync(outDir, { recursive: true });
  Deno.writeTextFileSync(`${outDir}/${name}`, lines.join("\n") + "\n");
}

function splitFeast(feast: string) {
  const parts = feast.split(";").map((s) => s.trim()).filter(Boolean);
  return { label: parts[0], all: parts };
}

// ---- saints ----
{
  const out = [
    "// Orthodox Calendar — Saints & Feasts",
    "// Movable feasts are Pascha-relative and auto-adjust every year.",
    "",
  ];
  const ks = [...saints.keys()].sort((a, b) => sortKey(a) - sortKey(b));
  for (const k of ks) {
    const { date, lines } = saints.get(k)!;
    out.push(`${date}\t${lines[0]}`);
    for (const extra of lines.slice(1)) out.push(`\t${extra}`);
  }
  writeChannel("calendar.saints", out);
}

// ---- fasts ----
{
  const out = [
    "// Orthodox Calendar — Fasting",
    "// ☦ strict fast · 🍇 wine & oil · 🐟 fish · 🧀 dairy; no line = no fast.",
    "",
  ];
  const ks = [...fasts.keys()].sort((a, b) => sortKey(a) - sortKey(b));
  for (const k of ks) {
    const { date, fast } = fasts.get(k)!;
    const emoji = FAST_EMOJI[fast];
    if (!emoji) continue;
    out.push(`${date}\t${emoji} ${FAST_LABEL[fast] ?? fast}`);
  }
  writeChannel("calendar.fasts", out);
}

// ---- readings ----
{
  const out = [
    "// Orthodox Calendar — Readings",
    "",
  ];
  const ks = [...readings.keys()].sort((a, b) => sortKey(a) - sortKey(b));
  for (const k of ks) {
    const { date, lines } = readings.get(k)!;
    out.push(`${date}\t${lines[0]}`);
    for (const extra of lines.slice(1)) out.push(`\t${extra}`);
  }
  writeChannel("calendar.readings", out);
}

// ---- summary ----
{
  // One line per day: lead feast + fast glyph + Gospel reference.
  const out = [
    "// Orthodox Calendar — Summary",
    "// Lead feast · fasting glyph · Gospel. One line per day.",
    "",
  ];
  const ks = [...saints.keys()].sort((a, b) => sortKey(a) - sortKey(b));
  for (const k of ks) {
    const s = saints.get(k)!;
    const fast = fasts.get(k)?.fast;
    const glyph = fast ? FAST_EMOJI[fast] ?? "" : "";
    const gospel = readings.get(k)?.lines.find((l) => l.startsWith("Gospel "))?.replace(/^Gospel /, "");
    const parts = [s.lines[0]];
    if (glyph) parts.push(glyph);
    if (gospel) parts.push(gospel);
    out.push(`${s.date}\t${parts.join("  ")}`);
  }
  writeChannel("calendar.summary", out);
}
// ---- master ----
{
  const out = [
    "// Orthodox Calendar — master",
    "// Include any subset; comment out a #include to hide a channel.",
    "#include <calendar.saints>",
    "#include <calendar.fasts>",
    "#include <calendar.readings>",
    "#include <calendar.vespers>",
  ];
  writeChannel("calendar.orthodox", out);
}

console.log(`Wrote to ${outDir}/`);
console.log(`  saints   ${saints.size}`);
console.log(`  fasts    ${fasts.size}`);
console.log(`  readings ${readings.size}`);
console.log(`  movable  ${seenMovable.size} labels`);
console.log(`  fixed    ${seenFixed.size} dates`);
