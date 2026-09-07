// scrape-vespers.ts — Deno script: fetch the Vesperal Old-Testament readings for
// the fixed Great Feasts from orthocal.info and emit them as a `calendar.vespers`
// file. These readings (Vigil/Vespers OT prophecies) are absent from the GOARCH
// ICS export, so they are sourced here.
//
// Usage:  deno run --allow-net --allow-write scripts/scrape-vespers.ts <out-dir>

const outDir = Deno.args[0] ?? ".";

// Fixed Great Feasts and their Vigil/eve (Month, Day of the eve) + display name.
// The vesperal OT readings are celebrated on the EVE of the feast.
const FEASTS: { eve: [number, number]; feast: [number, number]; name: string }[] = [
  { eve: [1, 5], feast: [1, 6], name: "Theophany" },
  { eve: [12, 24], feast: [12, 25], name: "Nativity of Christ" },
  { eve: [3, 24], feast: [3, 25], name: "Annunciation" },
  { eve: [9, 13], feast: [9, 14], name: "Elevation of the Cross" },
];

const MONTHS = ["January","February","March","April","May","June","July",
  "August","September","October","November","December"];

interface OTReading { display: string; }

async function fetchDay(year: number, m: number, d: number): Promise<OTReading[]> {
  const url = `https://orthocal.info/api/greek/gregorian/${year}/${m}/${d}/`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.readings ?? [])
    .filter((r: any) => r.source?.trim() === "Vespers" && r.book === "OT")
    .map((r: any) => ({ display: r.display }));
}

// The readings are fixed-date (feasts are fixed), so use one canonical year.
const YEAR = 2026;

const MONTH_LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function normalizeEve(m: number, d: number): [number, number] {
  if (d > MONTH_LEN[m - 1]) return [m % 12 + 1, 1];
  return [m, d];
}

const out: string[] = [
  "// Orthodox Calendar — Vesperal Old-Testament readings",
  "// Great Feast Vigils; sourced from orthocal.info (not in the GOARCH ICS).",
  "",
];

for (const f of FEASTS) {
  const [em, ed] = normalizeEve(f.eve[0], f.eve[1]);
  const readings = await fetchDay(YEAR, em, ed);
  if (!readings.length) {
    console.error(`No vesperal OT readings for ${f.name} (eve ${em}/${ed})`);
    continue;
  }
  const dateStr = `${MONTHS[em - 1]} ${ed}`;
  out.push(`${dateStr}\t${f.name} — Vigil (Vespers)`);
  for (const r of readings) out.push(`\t${r.display}`);
  console.log(`${f.name}: ${readings.length} readings`);
}

Deno.mkdirSync(outDir, { recursive: true });
Deno.writeTextFileSync(`${outDir}/calendar.vespers`, out.join("\n") + "\n");
console.log(`Wrote ${outDir}/calendar.vespers`);
