<div align="center">

  <h1><code>☩ Orthodox Calendar ☩</code></h1>

  <strong>The Liturgical calendar of Saints, Readings and Fasts for the `calendar` command.</strong>

</div>

## Usage

The calendar is split into three channels so you can include only what you want:

| File | Contents |
|------|----------|
| `calendar.saints` | Daily saints & feast commemorations |
| `calendar.fasts` | Fasting discipline (emoji only) |
| `calendar.readings` | Daily Scriptural readings |
| `calendar.orthodox` | Master file (`#include`s all three) |

1. Download the files you want into `~/.calendar/`:
```sh
curl -LJO https://raw.githubusercontent.com/OliverBrotchie/orthodox-calendar/main/calendar.orthodox
curl -LJO https://raw.githubusercontent.com/OliverBrotchie/orthodox-calendar/main/calendar.saints
curl -LJO https://raw.githubusercontent.com/OliverBrotchie/orthodox-calendar/main/calendar.fasts
curl -LJO https://raw.githubusercontent.com/OliverBrotchie/orthodox-calendar/main/calendar.readings
```
2. Add the master file (or any subset) to your user calendar (`~/.calendar/calendar`):
```
#include <calendar.orthodox>
```
To omit readings, for example, put this instead:
```
#include <calendar.saints>
#include <calendar.fasts>
```

## Movable feasts

Lent, Pascha, and Pentecost are **Pascha-relative** (`Paskha±N`), so the `calendar`
command computes their dates correctly every year with no manual refresh. Fixed
feasts (Nativity, Theophany, Dormition, …) are plain `Month Day` lines.

Internally, `calendar` computes Orthodox Easter natively. For example:
```
Paskha-8	Lazarus Saturday
Paskha	Great and Holy Pascha
Paskha+49	Holy Pentecost
Paskha+56	Sunday of All Saints
```
Lines that move year-to-year are marked with `*` in the output automatically.

## Fasting

Fasting state is shown as a single glyph, no text:
- `✚` strict fast
- `🥂` wine & oil
- `🐟` fish
- `🧀` dairy
- *(no line)* no fast

## Example Output

```
12 Apr*	Great and Holy Pascha, Basil the Confessor, Bishop of Parium
12 Apr*	Matins Gospel Reading: Mark 16:1-8
25 Dec 	The Nativity of Our Lord and Savior, Jesus Christ
 5 Jan 	✚
```

## Regenerating

The calendar files are generated from a GOARCH Google-Calendar ICS export by
`scripts/generate.ts`:

```sh
deno run --allow-read --allow-write scripts/generate.ts 2026-ics.ics .
```

The script derives the Pascha offset of every movable feast *and* every daily
reading automatically from the multi-year data. Readings follow the lectionary
(which moves with the Paschal cycle), so they are emitted as `Paskha±N` lines
too; only fixed Great Feasts (Nativity, Theophany, …) keep a `Month Day` reading.
Thus both feast dates and their readings stay correct for any year without
manual intervention.

## Troubleshooting

 - If you have never used `calendar` before, create a calendar file at `~/.calendar/calendar` and add `~/.calendar` to `$CALENDAR_DIR`.
 - You may need to set your calendar file as the default: `calendar -f ~/.calendar/calendar`.

## Credits

Most feasts are from the Greek Orthodox Archdiocese of America's [calendar](https://www.goarch.org/chapel/calendar).
