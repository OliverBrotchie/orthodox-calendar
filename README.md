<div align="center">

  <h1><code>☩ Orthodox Calendar ☩</code></h1>

  <strong>The Liturgical calendar of Saints, Readings and Fasts for the `calendar` command.</strong>

</div>

## Usage

1. Download the calendar:
```sh
curl -LJO https://raw.githubusercontent.com/OliverBrotchie/orthodox-calendar/main/calendar.orthodox
```
2. Move the file to the calendar directory:
```sh
mv calendar.orthodox ~/.calendar/calendar.orthodox
```
3. Add the following line to the user's calendar:

```
#include <calendar.orthodox>
```

## Troubleshooting 

 - If you have never used `calendar` before, you will need to create a calendar file for your user at `~/.calendar/calendar` and add `~/.calendar` to `$CALENDAR_DIR`.
 - You may need to set your newly created calendar file as the default one:

```sh
calendar -f ~/.calendar/calendar
```

## Credits

Most of the dates and feasts listed here are from [the calendar](https://www.goarch.org/chapel/calendar) of the Greek Orthodox Archdiocese of America.
