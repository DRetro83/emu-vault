# Building Emu Vault

Everything needed to build Emu Vault from this repository. Linux (x86_64).

## What's where

| Path | What it is |
| --- | --- |
| `design/emu-kluis.html` | The design file: all screens, styles and the base script in one page. It opens in a browser as a preview with sample data. |
| `ui/` | The app's screens. `index.html`, `style.css` and `preview.js` are **made from the design file**; every other file in `ui/` is a module you edit directly (`gog.js`, `selfupd.js`, `menu.js`, …). |
| `ui/data/` | Game lists (No-Intro, Redump, FinalBurn Neo). The master copy; edit it here. |
| `src-tauri/` | The Rust side (Tauri v2): files, downloads, GOG, BIOS checks, self-update. |
| `tools/` | Build scripts (this folder). |

## 1. Once: install what the build needs

```sh
sudo apt install build-essential curl libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev \
                 mame-tools xdelta3 python3 nodejs npm
curl https://sh.rustup.rs -sSf | sh
npm install
```

`mame-tools` (chdman) and `xdelta3` go into the standalone `.sh`; the lite `.sh` leaves them out.

## 2. After changing the design file: rebuild the screens

```sh
sh tools/mk.sh
```

This writes `ui/index.html`, `ui/style.css` and `ui/preview.js` from `design/emu-kluis.html` and adds the `<script>` and `<link>` tags for the modules, in the right order (`tools/mkui.py`). Don't edit those three files by hand: the next run overwrites them. A new module gets its tag in `tools/mkui.py`.

Changed only a module in `ui/` or something in `src-tauri/`? Skip this step.

## 3. Build the app

```sh
npx tauri build --bundles appimage,deb
```

## 4. Make the three release files

```sh
sh tools/mkpkg.sh 0.16.0 out
```

`out/` then has:

- `emu-vault-0.16.0.sh`: standalone, with chdman and xdelta3 (`tools/head-template.sh` is its start script)
- `emu-vault-lite-0.16.0.sh`: the same without chdman and xdelta3
- `emu-vault_0.16.0_amd64.deb`

## 5. Release

1. Set the version in `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` **before** step 3.
2. On GitHub: **Releases › Draft a new release**, tag `v<version>`, and attach the three files.
3. Lines starting with `- ` in the release notes show up in the app's update window under "What's new".

The app finds new versions by the release tag (`v0.16.0`) and picks its file by name, so keep the file names as `mkpkg.sh` makes them.
