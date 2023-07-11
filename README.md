<div align="center">

  <h1><code>☩ Orthodox Calendar ☩</code></h1>

  <strong>The Liturgical calendar of Saints, Readings and Fasts for the `calendar` command.</strong>

</div>

## Usage

1. Clone the repository.
2. Coppy `calendar.orthodox` to `~/.calendar` (or your desired location).
3. Add the following line to your calendar file:

```
#include <calendar.orthodox>
```

## Troubleshooting 

 - If you have never used `calendar` before, you will need to create a calendar file for your user at `~/.calendar/calendar` and add `~/.calendar` to `$CALENDAR_DIR`.
 - You may need to set your newly created calendar file as the default one:

```sh
calendar -f ~/.calendar/calendar
```
