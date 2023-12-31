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

## Example Output

```
11 July	☩ St. Sophrony the Athonite of Essex, St. Euphemia the Great Martyr ☩	☩ Mark 5:24-34, St. Paul's Second Letter to the Corinthians 6:1-10, Luke 7:36-50 ☩
12 July	☩ St. Paisios the Athonite ☩	☩ St. Paul's First Letter to the Corinthians 2:9-16; 3:1-8, Matthew 13:31-36 ☩
12 July	✚ Strict Fast ✚
```

## Troubleshooting 

 - If you have never used `calendar` before, you will need to create a calendar file for your user at `~/.calendar/calendar` and add `~/.calendar` to `$CALENDAR_DIR`.
 - You may need to set your newly created calendar file as the default one:

```sh
calendar -f ~/.calendar/calendar
```

## Credits

Most feasts are from the Greek Orthodox Archdiocese of America's [calendar](https://www.goarch.org/chapel/calendar).