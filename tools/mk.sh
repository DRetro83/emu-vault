#!/bin/sh
# Rebuild the app's screens in ui/ from design/emu-kluis.html. Needs python3 and node (npm install once for acorn).
set -e
R="$(cd "$(dirname "$0")" && pwd)"
python3 "$R/mkui.py" | tail -1
node "$R/strip.js" "$R/../ui/preview.js"
