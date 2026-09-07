#!/usr/bin/env bash
# install.sh — install the Orthodox calendar files for the BSD `calendar(1)`
# command (macOS / FreeBSD / OpenBSD). Copies the generated files into the
# tool's native location (~/.calendar) and wires up your master calendar file.
#
# Usage:  ./install.sh [CALENDAR_DIR]
#   CALENDAR_DIR defaults to ~/.calendar (the location `calendar(1)` searches).

set -euo pipefail

FILES=(calendar.orthodox calendar.saints calendar.fasts calendar.readings calendar.summary calendar.vespers)
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

FILES=(calendar.orthodox calendar.saints calendar.fasts calendar.readings calendar.summary)

echo "==> Installing to $CAL_DIR"
mkdir -p "$CAL_DIR"

for f in "${FILES[@]}"; do
    if [ -f "$REPO_DIR/$f" ]; then
        cp "$REPO_DIR/$f" "$CAL_DIR/$f"
        echo "    installed $f"
    else
        echo "    MISSING $f (run the generator first: deno run scripts/generate.ts 2026-ics.ics .)"
    fi
done

# Ensure the user's master calendar includes our master (idempotent).
MASTER="$CAL_DIR/calendar"
if [ ! -f "$MASTER" ]; then
    printf '#include <calendar.orthodox>\n' > "$MASTER"
    echo "    created $MASTER with #include <calendar.orthodox>"
else
    if ! grep -q 'calendar.orthodox' "$MASTER"; then
        printf '\n#include <calendar.orthodox>\n' >> "$MASTER"
        echo "    added #include <calendar.orthodox> to $MASTER"
    else
        echo "    $MASTER already includes calendar.orthodox"
    fi
done

echo
echo "Done. Try it:"
echo "  calendar                     # today (digest)"
echo "  calendar -A 7                # next 7 days"
echo "  calendar -f $CAL_DIR/calendar.saints     # full saints"
echo "  calendar -f $CAL_DIR/calendar.summary    # one-line digest"
echo
echo "Note: the summary file is optional — use -f to pick a view."
