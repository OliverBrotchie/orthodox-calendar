<div align="center">

  <h1><code>☩ Orthodox Calendar ☩</code></h1>

  <strong>The Liturgical calendar of Saints, Readings and Fasts for the `calendar` command.</strong>

</div>

## Install

Run the interactive installer — it asks three questions (which calendars,
bold or not, install location):

```sh
./install.sh
```

Non-interactive shortcut: `./install.sh --all --bold ~/.calendar`

## Files

The calendar is split into channels so you can include only what you want:

| File | Contents |
|------|----------|
| `calendar.saints` | Daily saints & feast commemorations (one per line) |
| `calendar.fasts` | Fasting discipline (glyph + text) |
| `calendar.readings` | Daily Scriptural readings (one per line) |
| `calendar.summary` | One-line digest: lead feast + fast + Gospel |
| `calendar.orthodox` | Master file (`#include`s saints, fasts, readings) |

`calendar.summary` is optional — point `calendar` at it with `-f` for a compact
daily glance, or `#include` it in your master instead of the detailed channels.

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
