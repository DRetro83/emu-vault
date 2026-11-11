#!/bin/sh
# Emu Vault VERSION (full) — runs on its own. Full: RetroArch (with your cores), ES-DE and Heroic are inside too, they go into your main folder on the first start.
#   sh emu-vault-full-VERSION.sh              start Emu Vault
#   sh emu-vault-full-VERSION.sh --install    also put it in your app menu
#   sh emu-vault-full-VERSION.sh --uninstall  take it out of the app menu again
# Settings stay in ~/.config/emu-vault, your files in the main folder you choose.
set -e
VER=VERSION-full
BASE="${XDG_DATA_HOME:-$HOME/.local/share}/emu-vault"
DIR="$BASE/$VER"
ME="$(readlink -f "$0")"

if [ "$1" = "--uninstall" ]; then
  rm -f "$HOME/.local/share/applications/emu-vault.desktop" "$HOME/.local/share/icons/hicolor/256x256/apps/emu-vault.png"
  rm -rf "$BASE"
  echo "Emu Vault is out of the app menu. Your settings (~/.config/emu-vault) and files are untouched."
  exit 0
fi

if [ ! -x "$DIR/AppRun" ]; then
  echo "Unpacking Emu Vault $VER (once)…"
  rm -rf "$DIR.tmp" && mkdir -p "$DIR.tmp"
  LINE=$(awk '/^__PAYLOAD__$/{print NR+1; exit}' "$ME")
  tail -n +"$LINE" "$ME" | tar -xJ -C "$DIR.tmp"
  rm -rf "$DIR" && mv "$DIR.tmp" "$DIR"
  # older versions unpacked next to this one
  for d in "$BASE"/*; do [ "$d" != "$DIR" ] && [ -d "$d" ] && rm -rf "$d"; done
fi

if [ "$1" = "--install" ]; then
  shift
  mkdir -p "$HOME/.local/share/applications" "$HOME/.local/share/icons/hicolor/256x256/apps"
  cp "$DIR/emu-vault.png" "$HOME/.local/share/icons/hicolor/256x256/apps/emu-vault.png"
  cat > "$HOME/.local/share/applications/emu-vault.desktop" <<DESK
[Desktop Entry]
Type=Application
Name=Emu Vault
Comment=Your emulators, BIOS files and games, kept on your own drive
Exec="$DIR/AppRun"
Icon=emu-vault
Categories=Game;Utility;
Terminal=false
DESK
  update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
  echo "Emu Vault is in your app menu now. Starting it…"
fi

exec "$DIR/AppRun" "$@"
exit 0
__PAYLOAD__
