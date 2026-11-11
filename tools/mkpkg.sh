#!/bin/sh
# Build the standalone .sh (AppImage contents + chdman) and copy the .deb.  usage: mkpkg.sh <version> <outdir>
set -e
V=$1; OUT=$(realpath -m "$2")
R="$(cd "$(dirname "$0")" && pwd)"
B="$R/../src-tauri/target/release/bundle"
rm -rf "$OUT" && mkdir -p "$OUT" && cd "$OUT"
cp "$B/appimage/Emu Vault_${V}_amd64.AppImage" ev.AppImage && chmod +x ev.AppImage && ./ev.AppImage --appimage-extract >/dev/null && rm ev.AppImage
cp squashfs-root/usr/share/icons/hicolor/256x256@2/apps/emu-vault.png squashfs-root/emu-vault.png 2>/dev/null || true
# chdman (MAME) and the libraries it needs that a desktop may not have
C=squashfs-root/usr/lib/emu-vault/chdman; mkdir -p $C
cp /usr/bin/chdman $C/
ldd /usr/bin/chdman | awk '/=> \//{print $1" "$3}' | while read so path; do
  case "$so" in libc.so*|libm.so*|libdl.so*|librt.so*|libpthread.so*|ld-linux*|libstdc++.so*|libgcc_s.so*) continue;; esac
  cp -L "$path" "$C/$so"
done
cp /usr/share/doc/mame-tools/copyright $C/COPYRIGHT-MAME.txt
# xdelta3, for .xdelta patches
X=squashfs-root/usr/lib/emu-vault/xdelta3; mkdir -p $X; cp /usr/bin/xdelta3 $X/; cp /usr/share/doc/xdelta3/copyright $X/COPYRIGHT-xdelta3.txt
sed "s/VER=[0-9.]*/VER=$V/; s/Emu Vault [0-9.]* —/Emu Vault $V —/; s/emu-vault-[0-9.]*\.sh/emu-vault-$V.sh/g" $R/head-template.sh > head.sh
sh -n head.sh
tar -cf - -C squashfs-root . | xz -T0 -6 > payload.txz
cat head.sh payload.txz > emu-vault-$V.sh && chmod +x emu-vault-$V.sh
rm -rf payload.txz
# lite: the same without chdman and xdelta3 (install mame-tools / xdelta3 yourself, or with the button in the app)
rm -rf squashfs-root/usr/lib/emu-vault
sed "s/emu-vault-$V.sh/emu-vault-lite-$V.sh/g; s/runs on its own\. Everything it needs (WebKitGTK included) is inside this file\./runs on its own (lite: chdman and xdelta3 not included)./" head.sh > head-lite.sh
tar -cf - -C squashfs-root . | xz -T0 -6 > payload.txz
cat head-lite.sh payload.txz > emu-vault-lite-$V.sh && chmod +x emu-vault-lite-$V.sh
rm -rf payload.txz head-lite.sh
cp "$B/deb/Emu Vault_${V}_amd64.deb" emu-vault_${V}_amd64.deb
ls -la *.sh *.deb
