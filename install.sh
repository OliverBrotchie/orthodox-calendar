#!/usr/bin/env bash
# install.sh — install the Orthodox calendar files for the BSD `calendar(1)`
# command (macOS / FreeBSD / OpenBSD). Copies the generated files into the
# tool's native location and wires up your master calendar file.
#
# Usage:  ./install.sh [--bold] [CALENDAR_DIR]
#   --bold          wrap the main commemoration in ANSI bold escapes
#   CALENDAR_DIR    defaults to ~/.calendar (the location `calendar(1)` searches)

set -euo pipefail

BOLD=0
CAL_DIR=""

for arg in "$@"; do
    case "$arg" in
        --bold) BOLD=1 ;;
        *) CAL_DIR="$arg" ;;
    esac
done

CAL_DIR="${CAL_DIR:-$HOME/.calendar}"
echo "==> Installing to $CAL_DIR$([ "$BOLD" = 1 ] && echo ' (bold)')"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
FILES=(calendar.orthodox calendar.saints calendar.fasts calendar.readings calendar.summary calendar.vespers)
mkdir -p "$CAL_DIR"

for f in "${FILES[@]}"; do
    if [ ! -f "$REPO_DIR/$f" ]; then
        echo "    MISSING $f (run the generator first)"
        continue
    fi
    if [ "$BOLD" = 1 ] && [ "$f" = "calendar.saints" ]; then
        # Bold the main commemoration: the text after the first tab on lines
        # that begin with a date (Month/Day or Paskha). Subordinate saints are
        # continuation lines (leading tab) and stay plain.
        awk -F '\t' '
            /^\t/   { print; next }
            /^\/\// { print; next }
            NF >= 2 { printf "%s\t\033[1m%s\033[0m\n", $1, $2; next }
            { print }
        ' "$REPO_DIR/$f" > "$CAL_DIR/$f"
        echo "    installed $f (bold)"
    else
        cp "$REPO_DIR/$f" "$CAL_DIR/$f"
        echo "    installed $f"
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
fi

echo
echo "Done. Try it:"
echo "  calendar                     # today"
echo "  calendar -A 7                # next 7 days"
echo "  calendar -f $CAL_DIR/calendar.summary    # one-line digest"
echo
[ "$BOLD" = 1 ] && echo "Bold enabled — the source repo stays plain text."
