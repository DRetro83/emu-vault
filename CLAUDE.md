# Working on Emu Vault

- The owner writes Dutch: answer in Dutch. The app itself (UI, README, release notes) is in English.
- "niets doen", "vraag", "even bespreken": answer only, change nothing. "bouw maar", "doe maar": build.
- New features go in their own module (`ui/<name>.js` + `.css`, `src-tauri/src/<name>.rs`), so they can be taken out again.
- When asked for an example or mockup, make one first and build after the go-ahead.
- Be honest about what was and wasn't tested: real-app behaviour can't be tested here (no display, no user's PC).
- Never touch the owner's BIOS reference folder; read only.
- Every release: standalone `.sh`, lite `.sh`, `.deb` and the portable Windows `.exe`, built by GitHub Actions when the owner publishes a release (see `tools/README.md`). Releases on GitHub are made by the owner (this session can push code but can't create releases). The Windows build can't run here: check it with a push (Actions runs on main and on the `windows` branch).
- `ui/index.html`, `ui/style.css`, `ui/preview.js` are generated from `design/emu-kluis.html` by `tools/mk.sh`; edit the design file or a module, never those three.
- Personal data (the owner's paths, logins) never goes in the repo; settings live in `~/.config/emu-vault/` on the owner's PC.
