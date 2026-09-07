<div align="center">

  <h1><code>☩ Orthodox Calendar ☩</code></h1>

  <strong>The Liturgical calendar of Saints, Readings and Fasts for the `calendar` command.</strong>

</div>

## Install

Run the interactive installer (uses [`gum`](https://github.com/charmbracelet/gum)
pickers when a controlling terminal is present, falling back to text prompts):

```sh
./install.sh
```

The installer asks, in order:

1. **Summary or Detailed?** — Summary installs a one-line daily digest;
   Detailed installs the full channels.
2. **Which channels** (Detailed only) — space to toggle, enter to confirm.
3. **Bold the main commemoration?**
4. **Install directory** (default `~/.calendar`)

Non-interactive shortcut: `./install.sh --all --bold ~/.calendar`

> `gum` needs a real terminal. In a non-TTY context (CI, scripts, pipes) the
> installer falls back to plain text prompts or sensible defaults.

## Files

The calendar is split into channels so you can include only what you want:

| File | Contents |
|------|----------|
| `calendar.saints` | Daily saints & feast commemorations (one per line) |
| `calendar.fasts` | Fasting discipline (glyph + text) |
| `calendar.readings` | Daily Scriptural readings (one per line) |
| `calendar.vespers` | Great Feast Vigil Old-Testament readings |
| `calendar.summary` | One-line digest: lead feast + fast + Gospel |
| `calendar.orthodox` | Master file (`#include`s the selected channels) |

`calendar.summary` is an exclusive digest view — install it *instead of* the
detailed channels (`--all`/plain install excludes it), or view it directly with
`calendar -f calendar.summary`.

## Fasting

| Glyph | Discipline |
|-------|-----------|
| `☦️` | Strict fast (no allowance for oil) |
| `🍇` | Wine & oil allowed |
| `🐟` | Fish allowed |
| `🧀` | Dairy, eggs & fish allowed |
| *(none)* | No fast |

## Movable feasts

Lent, Pascha, and Pentecost are **Pascha-relative** (`Paskha±N`), so `calendar`
computes their dates correctly every year with no manual refresh. Fixed feasts
(Nativity, Theophany, Dormition, …) are plain `Month Day` lines. Moving lines
are marked `*` automatically.

## Example output

```
6 Jan   Matins Mark 1:9-11
        Epistle Titus 2:11-14; 3:4-7
        Gospel Matthew 3:13-17
14 Sep  The Elevation of the Venerable and Life-Giving Cross  ☦️
```

## Regenerating

The files are generated from a GOARCH Google-Calendar ICS export plus the
[orthocal.info](https://orthocal.info/api/) readings API by `scripts/generate.ts`:

```sh
deno run --allow-read --allow-net --allow-write scripts/generate.ts 2026-ics.ics .
```

The script derives the Pascha offset of every movable feast *and* every daily
reading automatically from the multi-year data, so dates stay correct for any
year without manual intervention.

## Data sources

- **Saints, feasts, fasts, daily readings** — the GOARCH online chapel calendar
  (the `2026-ics.ics` Google-Calendar export in this repo).
- **Vesperal Old-Testament readings** (Great Feast Vigils, e.g. Theophany's 13
  readings) — the [orthocal.info](https://orthocal.info/api/) API, since GOARCH's
  export omits Vespers propers.

## Credits

Feasts are from the Greek Orthodox Archdiocese of America's
[calendar](https://www.goarch.org/chapel/calendar); vesperal readings from
[orthocal.info](https://orthocal.info).
