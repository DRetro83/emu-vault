
const CATS={"Emulator": "Emulators", "PC Emulation": "PC emulation", "Frontend": "Frontends", "Streaming": "Streaming", "Utilities": "Utilities", "Track Only": "Track only"};
const APPS=[{"id": "aps3e", "name": "aPS3e", "cat": "Emulator", "sys": "PlayStation 3", "src": "GitHub", "source": "https://github.com/aenu1/aps3e", "dl": "https://github.com/aenu1/aps3e/releases/latest", "site": "https://github.com/aenu1/aps3e", "pkg": "aenu.aps3e", "linux": false, "on": true, "versions": [["v2.4.0", "2026-10-21"], ["v2.3.0", "2026-08-18"], ["v2.2.4", "2026-06-15"]], "latest": ["v2.4.0", "2026-10-21"], "mb": 110}, {"id": "azahar", "name": "Azahar", "cat": "Emulator", "sys": "Nintendo 3DS", "src": "GitHub", "source": "https://github.com/azahar-emu/azahar", "dl": "https://github.com/azahar-emu/azahar/releases/latest", "site": "https://github.com/azahar-emu/azahar", "pkg": "org.azahar_emu.azahar", "linux": true, "on": true, "versions": [["v1.16.0", "2026-10-02"], ["v1.15.3", "2026-08-01"]], "latest": ["v1.16.0", "2026-10-02"], "mb": 45}, {"id": "citra-mmj", "name": "Citra MMJ", "cat": "Emulator", "sys": "Nintendo 3DS (MMJ fork)", "src": "GitHub", "source": "https://github.com/weihuoya/citra", "dl": "https://github.com/weihuoya/citra/releases/latest", "site": "https://github.com/weihuoya/citra", "pkg": "org.citra.emu", "linux": false, "on": false, "versions": [], "latest": ["v1.17.3", "2026-10-02"], "mb": 190}, {"id": "dolphin-emulator", "name": "Dolphin Emulator", "cat": "Emulator", "sys": "GameCube and Wii", "src": "Website", "source": "https://dolphin-emu.org/download/?ref=btn", "dl": "https://dolphin-emu.org/download/", "site": "https://dolphin-emu.org", "pkg": "org.dolphinemu.dolphinemu", "linux": true, "on": true, "versions": [["v3.3.4", "2026-10-21"], ["v3.2.0", "2026-08-18"]], "latest": ["v3.3.4", "2026-10-21"], "mb": 80}, {"id": "duckstation", "name": "DuckStation", "cat": "Emulator", "sys": "PlayStation 1", "src": "Website", "source": "https://duckstation-mirror.rmacias.workers.dev", "dl": "https://duckstation-mirror.rmacias.workers.dev", "site": "https://www.duckstation.org", "pkg": "com.github.stenzek.duckstation", "linux": true, "on": true, "versions": [["v1.7.1", "2026-10-18"]], "latest": ["v1.7.1", "2026-10-18"], "mb": 45}, {"id": "eden", "name": "Eden", "cat": "Emulator", "sys": "Nintendo Switch", "src": "Website", "source": "https://stable.eden-emu.dev/latest/release.json", "dl": "https://eden-emu.dev", "site": "https://eden-emu.dev", "pkg": "dev.eden.eden_emulator", "linux": true, "on": true, "versions": [["v3.3.4", "2026-10-10"], ["v3.2.1", "2026-08-07"], ["v3.1.0", "2026-06-04"]], "latest": ["v3.3.4", "2026-10-10"], "mb": 140}, {"id": "flycast", "name": "Flycast", "cat": "Emulator", "sys": "Dreamcast, NAOMI, and Atomiswave", "src": "GitHub", "source": "https://github.com/flyinghead/flycast", "dl": "https://github.com/flyinghead/flycast/releases/latest", "site": "https://github.com/flyinghead/flycast", "pkg": "com.flycast.emulator", "linux": true, "on": true, "versions": [["v1.11.0", "2026-10-18"]], "latest": ["v1.11.0", "2026-10-18"], "mb": 110}, {"id": "melonds", "name": "MelonDS", "cat": "Emulator", "sys": "Nintendo DS", "src": "GitHub", "source": "https://github.com/rafaelvcaetano/melonDS-android", "dl": "https://github.com/rafaelvcaetano/melonDS-android/releases/latest", "site": "https://github.com/rafaelvcaetano/melonDS-android", "pkg": "me.magnum.melonds", "linux": true, "on": true, "versions": [["v1.15.2", "2026-10-14"], ["v1.14.3", "2026-08-11"], ["v1.13.4", "2026-06-08"]], "latest": ["v1.16.0", "2026-10-27"], "mb": 62}, {"id": "melonds-nightly", "name": "MelonDS (nightly)", "cat": "Emulator", "sys": "Nintendo DS (nightly builds)", "src": "GitHub", "source": "https://github.com/rafaelvcaetano/melonDS-android", "dl": "https://github.com/rafaelvcaetano/melonDS-android/releases", "site": "https://github.com/rafaelvcaetano/melonDS-android", "pkg": "me.magnum.melonds.nightly", "linux": false, "on": false, "versions": [], "latest": ["v3.7.1", "2026-10-23"], "mb": 190}, {"id": "play", "name": "Play!", "cat": "Emulator", "sys": "PlayStation 2", "src": "Website", "source": "https://purei.org/downloads/play/stable/", "dl": "https://purei.org/downloads/play/stable/", "site": "https://purei.org", "pkg": "com.virtualapplications.play", "linux": true, "on": false, "versions": [], "latest": ["v2.2.4", "2026-10-10"], "mb": 110}, {"id": "ppsspp", "name": "PPSSPP", "cat": "Emulator", "sys": "PlayStation Portable", "src": "Website", "source": "https://www.ppsspp.org/download/", "dl": "https://www.ppsspp.org/download/", "site": "https://www.ppsspp.org", "pkg": "org.ppsspp.ppsspp", "linux": true, "on": true, "versions": [["v2.10.4", "2026-10-10"], ["v2.9.0", "2026-08-07"], ["v2.8.0", "2026-06-04"]], "latest": ["v2.10.4", "2026-10-10"], "mb": 45}, {"id": "retroarch", "name": "RetroArch", "cat": "Emulator", "sys": "Multi-system (stable builds)", "src": "Website", "source": "https://buildbot.libretro.com/stable", "dl": "https://buildbot.libretro.com/stable", "site": "https://www.retroarch.com", "pkg": "487343354", "linux": true, "on": true, "versions": [["v2.4.0", "2026-10-14"], ["v2.3.0", "2026-08-11"], ["v2.2.4", "2026-06-08"]], "latest": ["v2.4.0", "2026-10-14"], "mb": 190}, {"id": "rpcsx", "name": "RPCSX", "cat": "Emulator", "sys": "PlayStation 4", "src": "GitHub", "source": "https://github.com/RPCSX/rpcsx-ui-android", "dl": "https://github.com/RPCSX/rpcsx-ui-android/releases/latest", "site": "https://github.com/RPCSX/rpcsx-ui-android", "pkg": "net.rpcsx", "linux": false, "on": false, "versions": [], "latest": ["v3.10.2", "2026-10-20"], "mb": 80}, {"id": "scummvm", "name": "ScummVM", "cat": "Emulator", "sys": "Classic adventure and RPG interpreter", "src": "Website", "source": "https://www.scummvm.org/downloads/", "dl": "https://www.scummvm.org/downloads/", "site": "https://www.scummvm.org", "pkg": "org.scummvm.scummvm", "linux": true, "on": false, "versions": [], "latest": ["v4.2.0", "2026-10-09"], "mb": 80}, {"id": "gamehub-lite", "name": "GameHub Lite", "cat": "PC Emulation", "sys": "Windows game launcher for Android", "src": "GitHub", "source": "https://github.com/Producdevity/gamehub-lite", "dl": "https://github.com/Producdevity/gamehub-lite/releases/latest", "site": "https://github.com/Producdevity/gamehub-lite", "pkg": "gamehub.lite", "linux": false, "on": false, "versions": [], "latest": ["v1.1.2", "2026-10-21"], "mb": 110}, {"id": "gamenative", "name": "GameNative", "cat": "PC Emulation", "sys": "Native Windows game compatibility layer", "src": "GitHub", "source": "https://github.com/utkarshdalal/GameNative", "dl": "https://github.com/utkarshdalal/GameNative/releases/latest", "site": "https://github.com/utkarshdalal/GameNative", "pkg": "app.gamenative", "linux": false, "on": false, "versions": [], "latest": ["v4.9.3", "2026-10-22"], "mb": 62}, {"id": "winlator", "name": "Winlator", "cat": "PC Emulation", "sys": "Windows app and game emulator for Android", "src": "GitHub", "source": "https://github.com/brunodev85/winlator", "dl": "https://github.com/brunodev85/winlator/releases/latest", "site": "https://github.com/brunodev85/winlator", "pkg": "com.winlator", "linux": false, "on": false, "versions": [], "latest": ["v1.14.2", "2026-10-06"], "mb": 110}, {"id": "winlator-cmod", "name": "Winlator Cmod", "cat": "PC Emulation", "sys": "Winlator community mod", "src": "GitHub", "source": "https://github.com/coffincolors/winlator", "dl": "https://github.com/coffincolors/winlator/releases/latest", "site": "https://github.com/coffincolors/winlator", "pkg": "com.winlator.cmod", "linux": false, "on": false, "versions": [], "latest": ["v1.15.0", "2026-10-07"], "mb": 190}, {"id": "winlator-ludashi", "name": "Winlator-Ludashi", "cat": "PC Emulation", "sys": "Winlator fork with Ludashi optimizations", "src": "GitHub", "source": "https://github.com/StevenMXZ/Winlator-Ludashi", "dl": "https://github.com/StevenMXZ/Winlator-Ludashi/releases/latest", "site": "https://github.com/StevenMXZ/Winlator-Ludashi", "pkg": "com.winlator.ludashi", "linux": false, "on": false, "versions": [], "latest": ["v3.4.1", "2026-10-13"], "mb": 80}, {"id": "nethersx2-patch", "name": "NetherSX2-Patch", "cat": "Emulator", "sys": "PlayStation 2 (AetherSX2 patch)", "src": "GitHub", "source": "https://github.com/Trixarian/NetherSX2-patch", "dl": "https://github.com/Trixarian/NetherSX2-patch/releases/latest", "site": "https://github.com/Trixarian/NetherSX2-patch", "pkg": "xyz.aethersx2.android", "linux": false, "on": true, "versions": [["v2.2.3", "2026-10-15"], ["v2.1.4", "2026-08-12"]], "latest": ["v2.2.3", "2026-10-15"], "mb": 45}, {"id": "artemis", "name": "Artemis", "cat": "Streaming", "sys": "Game streaming client (Moonlight fork)", "src": "GitHub", "source": "https://github.com/ClassicOldSong/moonlight-android", "dl": "https://github.com/ClassicOldSong/moonlight-android/releases", "site": "https://github.com/ClassicOldSong/moonlight-android", "pkg": "com.limelight.noir", "linux": true, "on": false, "versions": [], "latest": ["v4.17.2", "2026-10-23"], "mb": 80}, {"id": "moonlight", "name": "Moonlight", "cat": "Streaming", "sys": "Game streaming client for NVIDIA GameStream and Sunshine", "src": "GitHub", "source": "https://github.com/moonlight-stream/moonlight-android", "dl": "https://github.com/moonlight-stream/moonlight-android/releases/latest", "site": "https://github.com/moonlight-stream/moonlight-android", "pkg": "com.limelight", "linux": true, "on": false, "versions": [], "latest": ["v3.12.1", "2026-10-05"], "mb": 28}, {"id": "syncthing-fork", "name": "Syncthing-Fork", "cat": "Utilities", "sys": "Continuous file synchronization", "src": "GitHub", "source": "https://github.com/researchxxl/syncthing-android", "dl": "https://github.com/researchxxl/syncthing-android/releases/latest", "site": "https://github.com/researchxxl/syncthing-android", "pkg": "com.github.catfriend1.syncthingfork", "linux": true, "on": false, "versions": [], "latest": ["v2.4.1", "2026-10-22"], "mb": 45}, {"id": "es-de-android-apps", "name": "ES-DE Android Apps", "cat": "Utilities", "sys": "Android app importer for ES-DE", "src": "GitHub", "source": "https://github.com/BinaryQuantumSoul/esde_android_apps", "dl": "https://github.com/BinaryQuantumSoul/esde_android_apps/releases/latest", "site": "https://github.com/BinaryQuantumSoul/esde_android_apps", "pkg": "com.quantumsoul.esde_android", "linux": false, "on": true, "versions": [["v1.15.2", "2026-10-06"], ["v1.14.2", "2026-08-03"], ["v1.13.0", "2026-06-01"]], "latest": ["v1.15.2", "2026-10-06"], "mb": 110}, {"id": "adreno-tools-drivers", "name": "Adreno Tools Drivers", "cat": "Track Only", "sys": "Adreno GPU driver packages", "src": "GitHub", "source": "https://github.com/StevenMXZ/Adreno-Tools-Drivers", "dl": "https://github.com/StevenMXZ/Adreno-Tools-Drivers/releases/latest", "site": "https://github.com/StevenMXZ/Adreno-Tools-Drivers", "pkg": "476086958", "linux": false, "on": false, "versions": [], "latest": ["v3.19.4", "2026-10-11"], "mb": 45}, {"id": "mr-purple-turnip-drivers", "name": "Mr. Purple Turnip Drivers", "cat": "Track Only", "sys": "Custom Turnip GPU drivers", "src": "GitHub", "source": "https://github.com/MrPurple666/purple-turnip", "dl": "https://github.com/MrPurple666/purple-turnip/releases/latest", "site": "https://github.com/MrPurple666/purple-turnip", "pkg": "994078275", "linux": false, "on": false, "versions": [], "latest": ["v1.14.4", "2026-10-13"], "mb": 80}, {"id": "es-de-custom-systems", "name": "ES-DE Custom Systems", "cat": "Track Only", "sys": "Custom system definitions for ES-DE", "src": "GitHub", "source": "https://github.com/GlazedBelmont/es-de-android-custom-systems", "dl": "https://github.com/GlazedBelmont/es-de-android-custom-systems/releases/latest", "site": "https://github.com/GlazedBelmont/es-de-android-custom-systems", "pkg": "767644078", "linux": false, "on": false, "versions": [], "latest": ["v4.12.0", "2026-10-16"], "mb": 140}, {"id": "obtainium-emulation-pack", "name": "Obtainium Emulation Pack", "cat": "Track Only", "sys": "Curated emulator and handheld app configs", "src": "GitHub", "source": "https://github.com/RJNY/Obtainium-Emulation-Pack", "dl": "https://github.com/RJNY/Obtainium-Emulation-Pack/releases/latest", "site": "https://github.com/RJNY/Obtainium-Emulation-Pack", "pkg": "904332840", "linux": false, "on": false, "versions": [], "latest": ["v4.1.1", "2026-10-03"], "mb": 45}, {"id": "daijish", "name": "Daijishō", "cat": "Frontend", "sys": "Retro game launcher and organizer", "src": "GitHub", "source": "https://github.com/TapiocaFox/Daijishou", "dl": "https://github.com/TapiocaFox/Daijishou/releases/latest", "site": "https://github.com/TapiocaFox/Daijishou", "pkg": "com.magneticchen.daijishou", "linux": false, "on": true, "versions": [["v2.5.4", "2026-10-11"]], "latest": ["v2.5.4", "2026-10-11"], "mb": 28}, {"id": "pegasus", "name": "Pegasus", "cat": "Frontend", "sys": "Cross-platform graphical game launcher", "src": "GitHub", "source": "https://github.com/mmatyas/pegasus-frontend", "dl": "https://github.com/mmatyas/pegasus-frontend/releases/latest", "site": "https://github.com/mmatyas/pegasus-frontend", "pkg": "org.pegasus_frontend.android", "linux": true, "on": false, "versions": [], "latest": ["v2.17.0", "2026-10-12"], "mb": 110}, {"id": "starboard", "name": "Starboard", "cat": "PC Emulation", "sys": "PortMaster game runner for Android", "src": "GitHub", "source": "https://github.com/get-starboard/starboard", "dl": "https://github.com/get-starboard/starboard/releases/latest", "site": "https://get-starboard.app/", "pkg": "org.force9.starboard", "linux": false, "on": false, "versions": [], "latest": ["v1.2.1", "2026-10-20"], "mb": 80}, {"id": "odintools", "name": "OdinTools", "cat": "Utilities", "sys": "AYN Odin handheld system tweaks", "src": "GitHub", "source": "https://github.com/langerhans/OdinTools", "dl": "https://github.com/langerhans/OdinTools/releases/latest", "site": "https://github.com/langerhans/OdinTools", "pkg": "de.langerhans.odintools", "linux": false, "on": false, "versions": [], "latest": ["v2.20.2", "2026-10-12"], "mb": 110}, {"id": "watermelonds", "name": "WatermelonDS", "cat": "Emulator", "sys": "Nintendo DS (melonDS fork)", "src": "GitHub", "source": "https://github.com/SapphireRhodonite/WatermelonDS", "dl": "https://github.com/SapphireRhodonite/WatermelonDS/releases/latest", "site": "https://github.com/SapphireRhodonite/WatermelonDS", "pkg": "me.magnum.melondualds", "linux": false, "on": false, "versions": [], "latest": ["v3.15.0", "2026-10-04"], "mb": 190}, {"id": "cemu-ds", "name": "Cemu (DS)", "cat": "Emulator", "sys": "Wii U (dual-screen fork)", "src": "GitHub", "source": "https://github.com/sapphirerhodonite/cemu", "dl": "https://github.com/sapphirerhodonite/cemu/releases/latest", "site": "https://github.com/sapphirerhodonite/cemu", "pkg": "info.cemu.cemu", "linux": false, "on": false, "versions": [], "latest": ["v4.14.3", "2026-10-16"], "mb": 62}, {"id": "pico8-android", "name": "Pico8 Android", "cat": "Emulator", "sys": "PICO-8 fantasy console frontend", "src": "GitHub", "source": "https://github.com/Macs75/pico8-android", "dl": "https://github.com/Macs75/pico8-android/releases/latest", "site": "https://github.com/Macs75/pico8-android", "pkg": "io.wip.pico8", "linux": false, "on": false, "versions": [], "latest": ["v1.4.0", "2026-10-24"], "mb": 62}, {"id": "cocoon-fe", "name": "Cocoon FE", "cat": "Frontend", "sys": "Emulation frontend for handhelds", "src": "GitHub", "source": "https://github.com/inssekt/CocoonFE", "dl": "https://github.com/inssekt/CocoonFE/releases", "site": "https://github.com/inssekt/CocoonFE", "pkg": "rip.moth.cocoonshell", "linux": false, "on": false, "versions": [], "latest": ["v3.15.1", "2026-10-17"], "mb": 28}, {"id": "argosy", "name": "Argosy", "cat": "Frontend", "sys": "ROM manager frontend for RomM", "src": "GitHub", "source": "https://github.com/rommapp/argosy-launcher", "dl": "https://github.com/rommapp/argosy-launcher/releases", "site": "https://github.com/rommapp/argosy-launcher", "pkg": "com.nendo.argosy", "linux": false, "on": false, "versions": [], "latest": ["v2.16.2", "2026-10-05"], "mb": 140}, {"id": "bifrost", "name": "Bifrost", "cat": "Utilities", "sys": "System-level performance tweaks for Android handhelds", "src": "GitHub", "source": "https://github.com/Pollux-MoonBench/Bifrost", "dl": "https://github.com/Pollux-MoonBench/Bifrost/releases/latest", "site": "https://github.com/Pollux-MoonBench/Bifrost", "pkg": "com.moonbench.bifrost", "linux": false, "on": false, "versions": [], "latest": ["v1.16.2", "2026-10-21"], "mb": 190}, {"id": "pixel-guide-android", "name": "Pixel Guide Android", "cat": "Utilities", "sys": "Pixel art scaling and display guide", "src": "GitHub", "source": "https://github.com/rexmont/Pixel-Guide-Android", "dl": "https://github.com/rexmont/Pixel-Guide-Android/releases/latest", "site": "https://github.com/rexmont/Pixel-Guide-Android", "pkg": "app.nanostack.pixelguide", "linux": false, "on": false, "versions": [], "latest": ["v1.8.4", "2026-10-12"], "mb": 45}, {"id": "emuready-lite", "name": "EmuReady Lite", "cat": "Utilities", "sys": "Emulation compatibility database", "src": "GitHub", "source": "https://github.com/Producdevity/EmuReadyAppReleases", "dl": "https://github.com/Producdevity/EmuReadyAppReleases/releases/latest", "site": "https://github.com/Producdevity/EmuReadyAppReleases", "pkg": "com.producdevity.emureadylite", "linux": false, "on": false, "versions": [], "latest": ["v3.7.4", "2026-10-18"], "mb": 190}, {"id": "vita3k", "name": "Vita3K", "cat": "Emulator", "sys": "PlayStation Vita", "src": "GitHub", "source": "https://github.com/Vita3K/Vita3K-builds", "dl": "https://github.com/Vita3K/Vita3K-builds/releases/latest", "site": "https://vita3k.org", "pkg": "org.vita3k.emulator", "linux": true, "on": true, "versions": [["v3.10.1", "2026-10-20"], ["v3.9.1", "2026-08-17"]], "latest": ["v3.11.0", "2026-10-27"], "mb": 140}, {"id": "mjolnir", "name": "Mjolnir", "cat": "Utilities", "sys": "Home button router for dual-screen devices", "src": "GitHub", "source": "https://github.com/blacksheepmvp/mjolnir", "dl": "https://github.com/blacksheepmvp/mjolnir/releases/latest", "site": "https://github.com/blacksheepmvp/mjolnir", "pkg": "xyz.blacksheep.mjolnir", "linux": false, "on": false, "versions": [], "latest": ["v2.6.4", "2026-10-16"], "mb": 62}, {"id": "es-de-companion", "name": "ES-DE Companion", "cat": "Utilities", "sys": "ES-DE dual-screen companion", "src": "GitHub", "source": "https://github.com/RobZombie9043/es-de-companion", "dl": "https://github.com/RobZombie9043/es-de-companion/releases/latest", "site": "https://github.com/RobZombie9043/es-de-companion", "pkg": "com.esde.companion", "linux": false, "on": false, "versions": [], "latest": ["v1.0.2", "2026-10-16"], "mb": 62}, {"id": "jarngreipr", "name": "Jarngreipr", "cat": "Utilities", "sys": "Dual-screen Android launcher", "src": "GitHub", "source": "https://github.com/BrianJr03/Jarngreipr", "dl": "https://github.com/BrianJr03/Jarngreipr/releases", "site": "https://github.com/BrianJr03/Jarngreipr", "pkg": "jr.brian.home", "linux": false, "on": false, "versions": [], "latest": ["v2.19.2", "2026-10-15"], "mb": 190}, {"id": "iisu", "name": "iiSU", "cat": "Frontend", "sys": "Visuals-first emulation frontend", "src": "GitHub", "source": "https://github.com/iisu-network/iiSU", "dl": "https://github.com/iisu-network/iiSU/releases/latest", "site": "https://iisu.network", "pkg": "com.iisulauncher", "linux": false, "on": false, "versions": [], "latest": ["v3.11.0", "2026-10-08"], "mb": 28}, {"id": "chdroid", "name": "CHDroid", "cat": "Utilities", "sys": "CHD file converter for Android", "src": "GitHub", "source": "https://github.com/Ottavio97/CHDroid", "dl": "https://github.com/Ottavio97/CHDroid/releases/latest", "site": "https://github.com/Ottavio97/CHDroid", "pkg": "it.ottaviomiele.chd", "linux": false, "on": false, "versions": [], "latest": ["v2.15.1", "2026-10-11"], "mb": 45}, {"id": "x1-box-xemu", "name": "X1 BOX (xemu)", "cat": "Emulator", "sys": "Original Xbox", "src": "GitHub", "source": "https://github.com/izzy2lost/xemu", "dl": "https://github.com/izzy2lost/xemu/releases/latest", "site": "https://github.com/izzy2lost/xemu", "pkg": "com.izzy2lost.x1box", "linux": true, "on": true, "versions": [["v2.19.3", "2026-10-01"], ["v2.18.2", "2026-08-01"], ["v2.17.0", "2026-06-01"]], "latest": ["v2.20.0", "2026-10-27"], "mb": 28}, {"id": "hakux", "name": "Hakux", "cat": "Emulator", "sys": "Original Xbox (Adreno fork)", "src": "GitHub", "source": "https://github.com/rfandango/hakuX", "dl": "https://github.com/rfandango/hakuX/releases/latest", "site": "https://github.com/rfandango/hakuX", "pkg": "com.rfandango.haku_x", "linux": false, "on": false, "versions": [], "latest": ["v4.6.3", "2026-10-06"], "mb": 80}, {"id": "emulnk", "name": "Emulnk", "cat": "Utilities", "sys": "Live game dashboard for a second screen", "src": "GitHub", "source": "https://github.com/EmuLnk/emulnk", "dl": "https://github.com/EmuLnk/emulnk/releases", "site": "https://github.com/EmuLnk/emulnk", "pkg": "com.emulnk", "linux": false, "on": false, "versions": [], "latest": ["v3.2.3", "2026-10-15"], "mb": 80}, {"id": "cannoli", "name": "Cannoli", "cat": "Frontend", "sys": "Retro frontend with built-in cores", "src": "GitHub", "source": "https://github.com/CannoliHQ/cannoli", "dl": "https://github.com/CannoliHQ/cannoli/releases", "site": "https://github.com/CannoliHQ/cannoli", "pkg": "dev.cannoli.scorza", "linux": false, "on": false, "versions": [], "latest": ["v1.5.1", "2026-10-05"], "mb": 28}, {"id": "cluster-tune", "name": "Cluster Tune", "cat": "Utilities", "sys": "CPU and GPU frequency tuner for handhelds", "src": "GitHub", "source": "https://github.com/AurelioB/cluster-tune", "dl": "https://github.com/AurelioB/cluster-tune/releases/latest", "site": "https://github.com/AurelioB/cluster-tune", "pkg": "com.aure.clustertune", "linux": false, "on": false, "versions": [], "latest": ["v2.18.3", "2026-10-26"], "mb": 140}, {"id": "console-launcher", "name": "Console Launcher", "cat": "Frontend", "sys": "Console-style launcher and frontend", "src": "GitHub", "source": "https://github.com/likeich/console-launcher", "dl": "https://github.com/likeich/console-launcher/releases", "site": "https://github.com/likeich/console-launcher", "pkg": "com.k2.consolelauncher", "linux": false, "on": false, "versions": [], "latest": ["v2.19.4", "2026-10-16"], "mb": 140}, {"id": "neostation", "name": "NeoStation", "cat": "Frontend", "sys": "Multi-platform emulation frontend", "src": "GitHub", "source": "https://github.com/misobadev/neostation-frontend", "dl": "https://github.com/misobadev/neostation-frontend/releases", "site": "https://neostation.dev", "pkg": "com.neogamelab.neostation", "linux": false, "on": false, "versions": [], "latest": ["v3.4.4", "2026-10-18"], "mb": 45}, {"id": "retrohrai", "name": "RetroHrai", "cat": "Frontend", "sys": "Retro game launcher", "src": "GitHub", "source": "https://github.com/retrohrai/Releases", "dl": "https://github.com/retrohrai/Releases/releases/latest", "site": "https://github.com/retrohrai/Releases", "pkg": "com.retrohrai.launcher", "linux": false, "on": false, "versions": [], "latest": ["v1.0.0", "2026-10-17"], "mb": 140}, {"id": "nethersx2-turnip", "name": "NetherSX2-Turnip", "cat": "Emulator", "sys": "PlayStation 2 (Turnip driver build)", "src": "GitHub", "source": "https://github.com/nckstwrt/NetherSX2-Turnip", "dl": "https://github.com/nckstwrt/NetherSX2-Turnip/releases/latest", "site": "https://github.com/nckstwrt/NetherSX2-Turnip", "pkg": "xyz.aethersx2.tturnip", "linux": false, "on": false, "versions": [], "latest": ["v2.13.1", "2026-10-27"], "mb": 190}, {"id": "raofflineproxy", "name": "RAOfflineProxy", "cat": "Utilities", "sys": "Offline RetroAchievements proxy", "src": "GitHub", "source": "https://github.com/misantronic/RAOfflineProxy", "dl": "https://github.com/misantronic/RAOfflineProxy/releases/latest", "site": "https://github.com/misantronic/RAOfflineProxy", "pkg": "com.raofflineproxy", "linux": false, "on": false, "versions": [], "latest": ["v2.0.2", "2026-10-07"], "mb": 62}, {"id": "armsx2", "name": "ARMSX2", "cat": "Emulator", "sys": "PlayStation 2", "src": "GitHub", "source": "https://github.com/ARMSX2/ARMSX2", "dl": "https://github.com/ARMSX2/ARMSX2/releases/latest", "site": "https://github.com/ARMSX2/ARMSX2", "pkg": "com.armsx2", "linux": false, "on": true, "versions": [["v3.7.2", "2026-10-11"], ["v3.6.4", "2026-08-08"], ["v3.5.3", "2026-06-05"]], "latest": ["v3.8.0", "2026-10-27"], "mb": 28}, {"id": "citron-neo", "name": "Citron Neo", "cat": "Emulator", "sys": "Nintendo Switch", "src": "GitHub", "source": "https://github.com/citron-neo/emulator", "dl": "https://github.com/citron-neo/emulator/releases/latest", "site": "https://github.com/citron-neo/emulator", "pkg": "org.citron.citron_emu", "linux": true, "on": false, "versions": [], "latest": ["v3.14.4", "2026-10-27"], "mb": 110}, {"id": "mimir", "name": "Mimir", "cat": "Utilities", "sys": "On-device ROM library organizer", "src": "GitHub", "source": "https://github.com/ItsRetroPup/Mimir", "dl": "https://github.com/ItsRetroPup/Mimir/releases/latest", "site": "https://github.com/ItsRetroPup/Mimir", "pkg": "pup.app.mimir", "linux": false, "on": false, "versions": [], "latest": ["v4.16.1", "2026-10-18"], "mb": 45}, {"id": "swiff", "name": "Swiff", "cat": "Emulator", "sys": "Flash game player for Android", "src": "GitHub", "source": "https://github.com/NaviVani-dev/Swiff", "dl": "https://github.com/NaviVani-dev/Swiff/releases/latest", "site": "https://github.com/NaviVani-dev/Swiff", "pkg": "io.navivani.swiff", "linux": false, "on": false, "versions": [], "latest": ["v1.14.1", "2026-10-20"], "mb": 28}, {"id": "pulse", "name": "Pulse", "cat": "Utilities", "sys": "Performance tuner with frame-rate targeting", "src": "GitHub", "source": "https://github.com/keiretrogaming/pulse", "dl": "https://github.com/keiretrogaming/pulse/releases/latest", "site": "https://github.com/keiretrogaming/pulse", "pkg": "com.kei.pulse", "linux": false, "on": false, "versions": [], "latest": ["v2.5.1", "2026-10-16"], "mb": 110}, {"id": "xendroid", "name": "Xendroid", "cat": "Emulator", "sys": "Xbox 360", "src": "GitHub", "source": "https://github.com/rfandango/XenDroid", "dl": "https://github.com/rfandango/XenDroid/releases/latest", "site": "https://github.com/rfandango/XenDroid", "pkg": "xendroid.compose", "linux": false, "on": false, "versions": [], "latest": ["v1.17.0", "2026-10-11"], "mb": 140}, {"id": "armsx1", "name": "ARMSX1", "cat": "Emulator", "sys": "PlayStation 1", "src": "GitHub", "source": "https://github.com/ARMSX2/ARMSX1", "dl": "https://github.com/ARMSX2/ARMSX1/releases/latest", "site": "https://github.com/ARMSX2/ARMSX1", "pkg": "com.nanodata.armsx", "linux": false, "on": false, "versions": [], "latest": ["v4.3.4", "2026-10-02"], "mb": 45}, {"id": "armsx3", "name": "ARMSX3", "cat": "Emulator", "sys": "PlayStation 3 (RPCS3 port)", "src": "GitHub", "source": "https://github.com/ARMSX2/ARMSX3", "dl": "https://github.com/ARMSX2/ARMSX3/releases/latest", "site": "https://github.com/ARMSX2/ARMSX3", "pkg": "com.armsx3", "linux": false, "on": false, "versions": [], "latest": ["v2.8.0", "2026-10-25"], "mb": 28}, {"id": "x360-mobile", "name": "X360 Mobile", "cat": "Emulator", "sys": "Xbox 360 (experimental)", "src": "GitHub", "source": "https://github.com/Ashnar2602/X360-Mobile---OFFICIAL", "dl": "https://github.com/Ashnar2602/X360-Mobile---OFFICIAL/releases/latest", "site": "https://github.com/Ashnar2602/X360-Mobile---OFFICIAL", "pkg": "emu.x360mobile.com", "linux": false, "on": false, "versions": [], "latest": ["v4.17.0", "2026-10-25"], "mb": 28}, {"id": "gopher64", "name": "Gopher64", "cat": "Emulator", "sys": "Nintendo 64", "src": "GitHub", "source": "https://github.com/gopher64/gopher64", "dl": "https://github.com/gopher64/gopher64/releases/latest", "site": "https://github.com/gopher64/gopher64", "pkg": "io.github.gopher64.gopher64", "linux": true, "on": true, "versions": [["v2.10.4", "2026-10-17"], ["v2.9.4", "2026-08-14"], ["v2.8.1", "2026-06-11"]], "latest": ["v2.11.0", "2026-10-27"], "mb": 80}, {"id": "nova-display-calibration", "name": "Nova Display Calibration", "cat": "Utilities", "sys": "Display calibration for Retroid Pocket Nova", "src": "GitHub", "source": "https://github.com/pippopapera/nova-display-calibration", "dl": "https://github.com/pippopapera/nova-display-calibration/releases/latest", "site": "https://github.com/pippopapera/nova-display-calibration", "pkg": "local.nova.diagnostic", "linux": false, "on": false, "versions": [], "latest": ["v4.16.1", "2026-10-23"], "mb": 110}, {"id": "sleepmanager", "name": "Sleepmanager", "cat": "Utilities", "sys": "Sleep and wake manager for handhelds", "src": "GitHub", "source": "https://github.com/Baggio94/SleepManager", "dl": "https://github.com/Baggio94/SleepManager/releases/latest", "site": "https://github.com/Baggio94/SleepManager", "pkg": "com.med.sleepmanager", "linux": false, "on": false, "versions": [], "latest": ["v3.17.1", "2026-10-27"], "mb": 80}, {"id": "droiddeck", "name": "Droiddeck", "cat": "PC Emulation", "sys": "Steam client with Proton for Android", "src": "GitHub", "source": "https://github.com/Droid-Deck/DroidDeck", "dl": "https://github.com/Droid-Deck/DroidDeck/releases/latest", "site": "https://github.com/Droid-Deck/DroidDeck", "pkg": "com.droiddeck.launcher", "linux": false, "on": false, "versions": [], "latest": ["v2.13.0", "2026-10-13"], "mb": 80}];

const GAMEINDEX=[{"id":"arduboy-inc-arduboy","maker":"Arduboy Inc","name":"Arduboy","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[335,0,1],"m":{"8":334,"0":1}},{"id":"atari2600","maker":"Atari","name":"2600","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[562,27,98],"m":{"3":131,"2":100,"8":1,"1":312,"5":3,"17":2,"7":6,"19":4,"23":1,"0":1,"9":1}},{"id":"atari5200","maker":"Atari","name":"5200","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[73,3,27],"m":{"1":71,"3":2}},{"id":"atari7800","maker":"Atari","name":"7800","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[60,69,12],"m":{"3":48,"1":11,"2":1}},{"id":"atari800","maker":"Atari","name":"8-bit Family","src":"no-intro","kind":"pc","ver":"2026.10.07","n":[42,0,0],"m":{"1":25,"0":1,"3":12,"2":4}},{"id":"atarijaguar","maker":"Atari","name":"Jaguar","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[46,117,22],"m":{"8":36,"3":10}},{"id":"atarilynx","maker":"Atari","name":"Lynx","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[76,99,69],"m":{"3":48,"11":9,"8":18,"9":1}},{"id":"atarist","maker":"Atari","name":"ST","src":"no-intro","kind":"pc","ver":"2026.10.07","n":[398,0,0],"m":{"2":395,"1":3}},{"id":"wonderswancolor","maker":"Bandai","name":"WonderSwan Color","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[92,91,18],"m":{"4":90,"16":1,"20":1},"clones":0},{"id":"wonderswan","maker":"Bandai","name":"WonderSwan","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[112,77,12],"m":{"4":110,"20":2},"clones":1},{"id":"benesse-pocket-challenge-v2","maker":"Benesse","name":"Pocket Challenge V2","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[27,0,0],"m":{"4":27},"clones":0},{"id":"casio-loopy","maker":"Casio","name":"Loopy","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[10,0,0],"m":{"4":10}},{"id":"casio-pv-1000","maker":"Casio","name":"PV-1000","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[13,0,0],"m":{"4":13}},{"id":"colecovision","maker":"Coleco","name":"ColecoVision","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[140,1,22],"m":{"1":91,"3":44,"2":4,"19":1},"clones":0},{"id":"c64","maker":"Commodore","name":"64","src":"no-intro","kind":"pc","ver":"2026.10.07","n":[2654,17,11],"m":{"2":1510,"3":1018,"1":110,"7":3,"4":8,"12":1,"8":4}},{"id":"amiga","maker":"Commodore","name":"Amiga","src":"no-intro","kind":"pc","ver":"2026.10.07","n":[2469,2,17],"m":{"2":2259,"1":126,"3":84},"clones":0},{"id":"plus4","maker":"Commodore","name":"Plus-4","src":"no-intro","kind":"pc","ver":"2026.10.07","n":[5,0,0],"m":{"3":5}},{"id":"vic20","maker":"Commodore","name":"VIC-20","src":"no-intro","kind":"pc","ver":"2026.10.07","n":[172,0,1],"m":{"8":55,"7":19,"5":77,"2":21}},{"id":"emerson-arcadia-2001","maker":"Emerson","name":"Arcadia 2001","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[48,0,0],"m":{"3":22,"2":26}},{"id":"entex-adventure-vision","maker":"Entex","name":"Adventure Vision","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[4,0,0],"m":{"3":4}},{"id":"epoch-super-cassette-vision","maker":"Epoch","name":"Super Cassette Vision","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[30,0,0],"m":{"6":4,"4":26}},{"id":"channelf","maker":"Fairchild","name":"Channel F","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[29,0,0],"m":{"1":26,"3":2,"2":1},"clones":3},{"id":"funtech-super-acan","maker":"Funtech","name":"Super Acan","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[12,0,0],"m":{"16":12}},{"id":"vectrex","maker":"GCE","name":"Vectrex","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[30,0,7],"m":{"1":11,"8":14,"3":2,"9":1,"2":1,"10":1},"clones":2},{"id":"gamepark-gp32","maker":"GamePark","name":"GP32","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[21,0,0],"m":{"16":14,"2":1,"18":6},"clones":1},{"id":"hartung-game-master","maker":"Hartung","name":"Game Master","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[18,0,0],"m":{"2":18}},{"id":"interton-vc-4000","maker":"Interton","name":"VC 4000","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[46,0,0],"m":{"2":44,"0":2}},{"id":"konami-picno","maker":"Konami","name":"Picno","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[20,0,0],"m":{"4":20}},{"id":"leapfrog-leapster-learning-game-system","maker":"LeapFrog","name":"Leapster Learning Game System","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[93,0,3],"m":{"1":54,"2":34,"3":5}},{"id":"odyssey2","maker":"Magnavox","name":"Odyssey2","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[105,0,13],"m":{"2":43,"3":31,"1":19,"16":8,"18":4}},{"id":"intellivision","maker":"Mattel","name":"Intellivision","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[139,56,28],"m":{"8":22,"3":78,"1":38,"11":1},"clones":3},{"id":"msx","maker":"Microsoft","name":"MSX","src":"no-intro","kind":"pc","ver":"2026.10.07","n":[549,16,0],"m":{"4":495,"6":12,"2":38,"20":3,"16":1},"clones":11},{"id":"msx2","maker":"Microsoft","name":"MSX2","src":"no-intro","kind":"pc","ver":"2026.10.07","n":[149,2,0],"m":{"4":143,"2":2,"6":3,"20":1},"clones":2},{"id":"xbox360-dl","maker":"Microsoft","name":"Xbox 360 (Digital)","src":"no-intro","kind":"dl","ver":"2021.10.24","n":[5537,0,0],"m":{"0":5537}},{"id":"pcengine","maker":"NEC","name":"PC Engine / TurboGrafx 16","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[348,31,14],"m":{"4":243,"5":28,"3":11,"1":48,"20":5,"9":1,"7":5,"12":6,"17":1}},{"id":"supergrafx","maker":"NEC","name":"PC Engine SuperGrafx","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[5,0,0],"m":{"4":5}},{"id":"fds","maker":"Nintendo","name":"Family Computer Disk System","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[218,67,11],"m":{"4":215,"12":2,"5":1},"clones":0},{"id":"gba","maker":"Nintendo","name":"Game Boy Advance","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[1671,175,81],"m":{"7":209,"3":526,"2":146,"1":183,"19":1,"4":499,"6":23,"5":44,"14":1,"9":1,"23":15,"20":8,"11":7,"16":3,"22":1,"10":2,"8":2},"clones":372},{"id":"gbc","maker":"Nintendo","name":"Game Boy Color","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[953,583,85],"m":{"3":264,"1":62,"2":93,"7":88,"4":365,"11":13,"6":5,"5":21,"15":3,"16":1,"8":21,"18":2,"9":5,"20":1,"23":3,"19":1,"12":5},"clones":184},{"id":"gb","maker":"Nintendo","name":"Game Boy","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[1073,281,37],"m":{"4":471,"7":194,"3":176,"5":62,"6":19,"11":11,"1":45,"8":20,"15":11,"2":40,"14":3,"13":4,"12":5,"16":4,"20":3,"9":2,"23":2,"10":1},"clones":244},{"id":"n3ds-dl","maker":"Nintendo","name":"New Nintendo 3DS (Digital)","src":"no-intro","kind":"dl","ver":"2021.10.24","n":[115,0,0],"m":{"0":104,"4":9,"3":1,"8":1}},{"id":"n3ds","maker":"Nintendo","name":"New Nintendo 3DS","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[4,0,0],"m":{"7":2,"1":2},"clones":2},{"id":"3ds-dl","maker":"Nintendo","name":"Nintendo 3DS (Digital)","src":"no-intro","kind":"dl","ver":"2021.10.24","n":[652,0,0],"m":{"3":147,"1":116,"2":192,"7":23,"4":133,"5":3,"6":7,"18":2,"8":20,"19":4,"16":3,"20":1,"22":1}},{"id":"3ds","maker":"Nintendo","name":"Nintendo 3DS","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[958,0,2],"m":{"4":379,"2":120,"3":134,"7":146,"1":36,"6":22,"23":80,"5":15,"21":3,"20":12,"19":6,"16":2,"22":2,"0":1},"clones":311},{"id":"n64","maker":"Nintendo","name":"Nintendo 64","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[411,59,30],"m":{"3":139,"7":98,"4":89,"6":3,"1":49,"5":10,"16":15,"2":2,"18":1,"23":2,"19":2,"8":1},"clones":97},{"id":"n64dd","maker":"Nintendo","name":"Nintendo 64DD","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[7,0,2],"m":{"4":7},"clones":0},{"id":"nds","maker":"Nintendo","name":"Nintendo DS","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[3883,67,84],"m":{"4":1300,"3":939,"19":23,"2":687,"7":340,"1":319,"5":64,"20":33,"16":19,"23":101,"6":35,"22":10,"21":10,"18":1,"11":1,"15":1},"clones":1226},{"id":"dsi","maker":"Nintendo","name":"Nintendo DSi","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[111,0,0],"m":{"0":13,"1":34,"2":22,"4":27,"16":4,"3":10,"7":1},"clones":0},{"id":"nes","maker":"Nintendo","name":"NES","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[1404,1588,346],"m":{"4":572,"7":106,"5":146,"21":25,"1":160,"20":70,"15":13,"23":53,"19":37,"3":85,"12":12,"8":9,"2":13,"31":24,"9":12,"22":4,"29":6,"13":11,"11":6,"27":5,"6":7,"17":13,"25":5,"24":3,"10":1,"28":3,"18":2,"30":1},"clones":299},{"id":"pokemini","maker":"Nintendo","name":"Pokemon Mini","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[16,2,3],"m":{"4":5,"7":5,"2":2,"5":1,"3":1,"6":2},"clones":3},{"id":"satellaview","maker":"Nintendo","name":"Satellaview","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[352,1,0],"m":{"4":352}},{"id":"sufami","maker":"Nintendo","name":"Sufami Turbo","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[13,0,0],"m":{"4":13}},{"id":"snes","maker":"Nintendo","name":"Super NES","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[1765,122,74],"m":{"4":954,"1":101,"6":27,"7":281,"3":160,"5":134,"11":19,"15":32,"2":29,"9":2,"10":4,"22":1,"13":8,"16":1,"23":2,"14":1,"8":2,"12":4,"21":2,"20":1},"clones":402},{"id":"virtualboy","maker":"Nintendo","name":"Virtual Boy","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[24,16,4],"m":{"1":3,"5":13,"4":8},"clones":4},{"id":"wii-dl","maker":"Nintendo","name":"Wii (Digital)","src":"no-intro","kind":"dl","ver":"2026.10.07","n":[59,0,0],"m":{"0":59}},{"id":"nintendo-wii-u-dl","maker":"Nintendo","name":"Wii U (Digital)","src":"no-intro","kind":"dl","ver":"2026.10.07","n":[127,0,0],"m":{"0":127}},{"id":"nintendo-e-reader","maker":"Nintendo","name":"e-Reader","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[2938,0,247],"m":{"1":1074,"4":1864}},{"id":"videopac","maker":"Philips","name":"Videopac+","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[24,0,2],"m":{"2":24},"clones":3},{"id":"rca-studio-ii","maker":"RCA","name":"Studio II","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[17,0,1],"m":{"2":5,"1":8,"3":4},"clones":0},{"id":"ngpc","maker":"SNK","name":"Neo Geo Pocket Color","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[83,0,0],"m":{"4":42,"8":18,"7":4,"1":1,"6":6,"5":2,"3":7,"2":2,"12":1}},{"id":"ngp","maker":"SNK","name":"Neo Geo Pocket","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[9,0,0],"m":{"6":5,"4":4}},{"id":"sega32x","maker":"Sega","name":"32X","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[34,0,12],"m":{"7":13,"1":9,"2":2,"3":5,"8":3,"4":1,"5":1},"clones":1},{"id":"sega-beena","maker":"Sega","name":"Beena","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[55,0,0],"m":{"4":55}},{"id":"gamegear","maker":"Sega","name":"Game Gear","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[366,65,28],"m":{"1":57,"4":96,"8":28,"23":28,"7":22,"6":5,"2":26,"3":63,"19":17,"5":11,"17":3,"18":1,"22":3,"12":2,"13":2,"9":2},"clones":36},{"id":"mastersystem","maker":"Sega","name":"Master System / Mark III","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[340,259,115],"m":{"16":43,"18":120,"23":39,"19":39,"8":9,"31":2,"1":6,"2":37,"20":4,"21":1,"24":5,"4":15,"22":3,"3":4,"28":3,"7":4,"5":1,"6":1,"17":2,"10":1,"27":1},"clones":38},{"id":"megadrive","maker":"Sega","name":"Mega Drive / Genesis","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[965,402,153],"m":{"16":26,"4":120,"1":143,"3":218,"12":5,"20":13,"5":63,"7":110,"18":4,"15":17,"23":48,"19":24,"8":46,"13":16,"2":48,"6":7,"10":7,"17":5,"11":9,"21":16,"29":4,"27":4,"9":6,"24":3,"31":2,"14":1},"clones":216},{"id":"pico","maker":"Sega","name":"PICO","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[317,0,2],"m":{"4":223,"3":6,"1":12,"16":37,"2":35,"17":1,"20":1,"18":1,"5":1}},{"id":"sg-1000","maker":"Sega","name":"SG-1000","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[74,23,0],"m":{"20":30,"22":30,"6":3,"4":10,"2":1},"clones":0},{"id":"x1","maker":"Sharp","name":"X1","src":"no-intro","kind":"pc","ver":"2023.12.04","n":[8,0,0],"m":{"0":3,"4":5}},{"id":"zxspectrum","maker":"Sinclair","name":"ZX Spectrum +3","src":"no-intro","kind":"pc","ver":"2026.10.07","n":[128,0,0],"m":{"2":128}},{"id":"ps3-dl","maker":"Sony","name":"PlayStation 3 (PSN)","src":"no-intro","kind":"dl","ver":"2026.10.07","n":[5485,0,0],"m":{"0":5484,"1":1}},{"id":"psp-dl","maker":"Sony","name":"PlayStation Portable (PSN)","src":"no-intro","kind":"dl","ver":"2026.10.07","n":[1774,0,0],"m":{"4":470,"19":12,"3":204,"1":177,"2":113,"5":18,"16":24,"7":40,"0":699,"18":4,"23":9,"6":3,"20":1}},{"id":"psvita-dl","maker":"Sony","name":"PlayStation Vita (PSN)","src":"no-intro","kind":"dl","ver":"2026.10.07","n":[1384,0,0],"m":{"0":1348,"1":12,"2":11,"4":12,"3":1}},{"id":"psvita","maker":"Sony","name":"PlayStation Vita","src":"no-intro","kind":"cart","ver":"2021.10.24","n":[228,0,0],"m":{"1":117,"16":2,"2":96,"4":2,"3":10,"18":1}},{"id":"tiger-game-com","maker":"Tiger","name":"Game.com","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[22,0,1],"m":{"1":22}},{"id":"vtech-creativision","maker":"VTech","name":"CreatiVision","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[18,0,0],"m":{"18":18},"clones":0},{"id":"vtech-v-smile","maker":"VTech","name":"V.Smile","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[106,0,0],"m":{"3":54,"19":3,"2":32,"1":16,"8":1},"clones":180},{"id":"watara-supervision","maker":"Watara","name":"Supervision","src":"no-intro","kind":"cart","ver":"2026.10.07","n":[69,1,0],"m":{"3":68,"1":1},"clones":0},{"id":"atarijaguarcd","maker":"Atari","name":"Jaguar CD","src":"redump","kind":"disc","ver":"2026.10.07","n":[13,9,0],"m":{"1":13}},{"id":"amigacd32","maker":"Commodore","name":"CD32","src":"redump","kind":"disc","ver":"2026.10.07","n":[183,0,0],"m":{"2":180,"1":2,"3":1}},{"id":"cdtv","maker":"Commodore","name":"CDTV","src":"redump","kind":"disc","ver":"2026.10.07","n":[55,0,0],"m":{"2":39,"1":15,"3":1}},{"id":"xbox360","maker":"Microsoft","name":"Xbox 360","src":"redump","kind":"disc","ver":"2026.10.07","n":[1804,0,0],"m":{"20":5,"7":200,"23":102,"19":75,"4":141,"2":252,"1":241,"3":587,"11":5,"24":2,"8":82,"6":8,"12":20,"30":7,"14":16,"31":9,"16":10,"5":11,"17":3,"15":5,"9":8,"27":2,"10":5,"18":1,"13":2,"22":1,"26":3,"21":1},"clones":153},{"id":"xbox","maker":"Microsoft","name":"Xbox","src":"redump","kind":"disc","ver":"2026.10.07","n":[1246,0,4],"m":{"3":529,"19":85,"7":83,"1":196,"2":189,"23":47,"8":14,"4":65,"5":13,"20":1,"14":1,"10":5,"6":2,"9":2,"16":2,"18":1,"24":1,"21":2,"17":6,"12":1,"11":1},"clones":158},{"id":"pcenginecd","maker":"NEC","name":"PC Engine CD / TurboGrafx-CD","src":"redump","kind":"disc","ver":"2026.10.07","n":[430,25,0],"m":{"4":385,"1":28,"5":17}},{"id":"pc98","maker":"NEC","name":"PC-98","src":"redump","kind":"pc","ver":"2023.12.04","n":[106,0,0],"m":{"4":106}},{"id":"pcfx","maker":"NEC","name":"PC-FX","src":"redump","kind":"disc","ver":"2026.10.07","n":[68,0,0],"m":{"4":68}},{"id":"gc","maker":"Nintendo","name":"GameCube","src":"redump","kind":"disc","ver":"2026.10.07","n":[799,52,4],"m":{"3":260,"7":146,"23":21,"2":48,"1":138,"4":155,"5":22,"6":3,"19":5,"21":1},"clones":216},{"id":"wii","maker":"Nintendo","name":"Wii","src":"redump","kind":"disc","ver":"2026.10.07","n":[1685,1,1],"m":{"7":196,"3":734,"2":239,"23":73,"4":163,"1":219,"6":9,"5":19,"16":4,"19":20,"22":1,"18":2,"21":5,"8":1},"clones":462},{"id":"cdimono1","maker":"Philips","name":"CD-i","src":"redump","kind":"disc","ver":"2026.10.07","n":[1595,9,17],"m":{"1":187,"2":866,"3":131,"6":2,"7":17,"19":1,"4":336,"8":1,"16":47,"5":2,"23":2,"10":1,"11":2},"clones":143},{"id":"neogeocd","maker":"SNK","name":"Neo Geo CD","src":"redump","kind":"disc","ver":"2026.10.07","n":[97,5,0],"m":{"4":68,"8":26,"12":3}},{"id":"dreamcast","maker":"Sega","name":"Dreamcast","src":"redump","kind":"disc","ver":"2026.10.07","n":[781,67,2],"m":{"4":461,"7":101,"3":91,"1":43,"6":5,"2":50,"5":28,"18":1,"21":1},"clones":102},{"id":"segacd","maker":"Sega","name":"Mega-CD / Sega CD","src":"redump","kind":"disc","ver":"2026.10.07","n":[248,10,1],"m":{"1":62,"4":82,"7":26,"3":51,"2":15,"17":2,"5":5,"20":2,"19":1,"23":1,"6":1}},{"id":"naomi2","maker":"Sega","name":"Naomi 2","src":"redump","kind":"disc","ver":"2026.10.07","n":[9,0,0],"m":{"8":5,"4":3,"12":1}},{"id":"naomi","maker":"Sega","name":"Naomi","src":"redump","kind":"disc","ver":"2026.10.07","n":[29,0,0],"m":{"4":20,"8":8,"5":1}},{"id":"saturn","maker":"Sega","name":"Saturn","src":"redump","kind":"disc","ver":"2026.10.07","n":[1232,2,9],"m":{"4":928,"5":17,"6":23,"7":146,"1":25,"3":48,"2":26,"23":10,"19":1,"22":2,"16":2,"21":1,"20":2,"17":1},"clones":139},{"id":"ps2","maker":"Sony","name":"PlayStation 2","src":"redump","kind":"disc","ver":"2026.10.07","n":[5107,284,9],"m":{"4":1990,"19":91,"23":317,"7":356,"2":846,"6":157,"22":35,"3":708,"1":335,"5":91,"18":15,"20":94,"21":27,"16":35,"17":9,"8":1},"clones":1205},{"id":"ps3","maker":"Sony","name":"PlayStation 3","src":"redump","kind":"disc","ver":"2026.10.07","n":[1857,0,3],"m":{"4":316,"7":231,"23":333,"19":83,"1":129,"18":21,"2":240,"3":368,"21":5,"22":17,"16":24,"20":49,"5":15,"6":11,"14":2,"30":1,"17":9,"8":3},"clones":330},{"id":"psp","maker":"Sony","name":"PlayStation Portable","src":"redump","kind":"disc","ver":"2026.10.07","n":[1839,0,2],"m":{"4":988,"7":96,"1":67,"3":216,"2":98,"23":133,"17":13,"6":16,"20":68,"16":34,"21":13,"5":30,"19":54,"22":9,"18":4},"clones":323},{"id":"psx","maker":"Sony","name":"PlayStation","src":"redump","kind":"disc","ver":"2026.10.07","n":[5178,129,14],"m":{"4":2803,"3":500,"7":463,"2":667,"1":403,"5":93,"6":102,"20":49,"23":61,"16":4,"21":16,"19":8,"22":8,"18":1},"clones":1033},{"id":"3do","maker":"The 3DO Company","name":"3DO","src":"redump","kind":"disc","ver":"2026.10.07","n":[393,9,1],"m":{"1":82,"3":39,"4":190,"16":7,"7":18,"2":11,"8":1,"23":14,"5":16,"21":3,"22":1,"19":5,"6":2,"17":3,"13":1}},{"id":"neogeo","maker":"SNK","name":"Neo Geo (MVS/AES)","src":"fbneo","kind":"arcade","ver":"1.0.0.03","n":[220,6,31],"m":{"8":257}},{"id":"cps1","maker":"Capcom","name":"CP System I","src":"fbneo","kind":"arcade","ver":"1.0.0.03","n":[38,0,2],"m":{"8":40}},{"id":"cps2","maker":"Capcom","name":"CP System II","src":"fbneo","kind":"arcade","ver":"1.0.0.03","n":[40,2,0],"m":{"8":42}},{"id":"cps3","maker":"Capcom","name":"CP System III","src":"fbneo","kind":"arcade","ver":"1.0.0.03","n":[6,0,0],"m":{"8":6}},{"id":"arcade","maker":"Arcade","name":"Arcade (FinalBurn Neo)","src":"fbneo","kind":"arcade","ver":"1.0.0.03","n":[2467,33,88],"m":{"8":2588}}];
const BIOSDB=[{"id":"neogeo","st":"req","used":"FinalBurn Neo, MAME","why":"All Neo Geo games need the Neo Geo BIOS. Keep it next to your Neo Geo games.","files":[{"f":"neogeo.zip","req":true,"note":"put it in roms/neogeo/ too"},{"f":"aes.zip","req":false,"note":"Neo Geo home console mode"},{"f":"hiscore.dat","req":false,"note":"saves high scores","free":{"t":"High score list, free from the MAME/FBNeo community","u":"https://github.com/libretro/FBNeo"}}]},{"id":"psx","st":"req","used":"DuckStation, SwanStation, Beetle PSX","why":"Most PlayStation emulators won't start without one.","files":[{"f":"scph5501.bin","req":true,"note":"USA","one":"r","md5":"490f666e1afb15b7362b406ed1cea246"},{"f":"scph5502.bin","req":true,"note":"Europe","one":"r","md5":"32736f17079d0b2b7024407c39bd3050"},{"f":"scph5500.bin","req":true,"note":"Japan","one":"r","md5":"8dd7d5296a650fac7319bce665a6a53c"},{"f":"scph1001.bin","req":false,"note":"original USA BIOS, used by some cores","md5":"924e392ed05558ffdb115408c263dccf"},{"f":"scph7001.bin","req":false,"note":"later USA BIOS","md5":"1e68c231d0896b7eadcad1d7d8e76129"}],"tip":"One BIOS is enough. Best: one for the region of your games."},{"id":"ps2","st":"req","used":"PCSX2, AetherSX2, NetherSX2, ARMSX2","why":"A dump of your own PS2 is needed; any region works.","any":"\\.bin$","anyLabel":"PS2 BIOS","side":"\\.(mec|nvm|erom|rom1|rom2)$","sideLabel":"goes with a PS2 BIOS (clock and settings); PCSX2 makes it itself if it's missing","files":[{"f":"ps2-0230e-20080220.bin","req":true,"note":"Europe (example name)","one":"r","md5":"dc69f0643a3030aaa4797501b483d6c4"},{"f":"ps2-0230a-20080220.bin","req":true,"note":"USA (example name)","one":"r","md5":"21038400dc633070a78ad53090c53017"},{"f":"ps2-0230j-20080220.bin","req":true,"note":"Japan (example name)","one":"r","md5":"80ac46fa7e77b8ab4366e86948e54f83"}],"tip":"Any one PS2 BIOS works; the exact name doesn't matter for PCSX2."},{"id":"ps3","st":"req","used":"RPCS3, aPS3e, ARMSX3","why":"Needs the official PS3 system software.","files":[{"f":"PS3UPDAT.PUP","req":true,"note":"official firmware","free":{"t":"Free download from Sony","u":"https://www.playstation.com/en-us/support/hardware/ps3/system-software/"}}],"free":{"t":"Free download from Sony","u":"https://www.playstation.com/en-us/support/hardware/ps3/system-software/"}},{"id":"ps4","st":"opt","used":"shadPS4","why":"shadPS4 starts without them. For full accuracy it uses system modules and fonts from your own PS4: the 14 .sprx files in sys_modules/ and the basic fonts in fonts/font/. Only these are listed; fonts for other languages (Japanese, Chinese, Korean, Arabic, Thai, Vietnamese) can go in fonts/font/ or fonts/font2/ yourself if a game needs them.","files":[{"f":"sys_modules/libSceAudiodec.sprx","req":false,"note":"system module from your own PS4","md5":"8013477b612e63d96fcee2244c9fc2c6"},{"f":"sys_modules/libSceCesCs.sprx","req":false,"note":"system module from your own PS4","md5":"3a880f0c9dd5d330cf6a38641e34c29e"},{"f":"sys_modules/libSceFont.sprx","req":false,"note":"system module from your own PS4","md5":"a1d601cdfba502e0f29e32bfc43b8c36"},{"f":"sys_modules/libSceFontFt.sprx","req":false,"note":"system module from your own PS4","md5":"d5dd56462c76d91bac9ca0d8adc0319b"},{"f":"sys_modules/libSceFreeTypeOt.sprx","req":false,"note":"system module from your own PS4","md5":"6e05dfb31fb410d8dbe73d253cd61409"},{"f":"sys_modules/libSceJpegDec.sprx","req":false,"note":"system module from your own PS4","md5":"0489870b439ebd8e365c93d0ac8ce48e"},{"f":"sys_modules/libSceJpegEnc.sprx","req":false,"note":"system module from your own PS4","md5":"a9842b07cca16174b8662f7ab9d1c542"},{"f":"sys_modules/libSceJson.sprx","req":false,"note":"system module from your own PS4","md5":"5346d05e0e7542f9cd9478736fcb0b97"},{"f":"sys_modules/libSceJson2.sprx","req":false,"note":"system module from your own PS4","md5":"569107bf7a647f48469b20e7fea73ce9"},{"f":"sys_modules/libSceLibcInternal.sprx","req":false,"note":"system module from your own PS4","md5":"e6db0962fd1d45e3c519c313f9cd42d3"},{"f":"sys_modules/libSceNgs2.sprx","req":false,"note":"system module from your own PS4","md5":"79df75f0d23611eef6b54f4fd4233c82"},{"f":"sys_modules/libScePngEnc.sprx","req":false,"note":"system module from your own PS4","md5":"dc222e1082d699ab38ae3c287aaa75b5"},{"f":"sys_modules/libSceRtc.sprx","req":false,"note":"system module from your own PS4","md5":"0f2619aa588c533c7b8cba5004566e71"},{"f":"sys_modules/libSceUlt.sprx","req":false,"note":"system module from your own PS4","md5":"bfa06eb80bef5c08ccb2a96687fc515a"},{"f":"fonts/font2/PS4Icon.ttf","req":false,"note":"basic font (English and other Latin languages)","md5":"8e7736f4ed78c2c69741e3d7dace6c95"},{"f":"fonts/font/SST-Bold.otf","req":false,"note":"basic font (English and other Latin languages)","md5":"53eeb680cbc0908ee91456c80b29e263"},{"f":"fonts/font/SST-BoldItalic.otf","req":false,"note":"basic font (English and other Latin languages)","md5":"34c6d18d1967bac038aa27c44b46a49d"},{"f":"fonts/font/SST-Italic.otf","req":false,"note":"basic font (English and other Latin languages)","md5":"62f1498a31486f881be54c0d22ba7e79"},{"f":"fonts/font/SST-Light.otf","req":false,"note":"basic font (English and other Latin languages)","md5":"a7e5584f15c55982ca8abb4eb84dcbd1"},{"f":"fonts/font/SST-LightItalic.otf","req":false,"note":"basic font (English and other Latin languages)","md5":"8c453a6788c0f65d313672142c044352"},{"f":"fonts/font/SST-Medium.otf","req":false,"note":"basic font (English and other Latin languages)","md5":"f8f3fdecce546b8252b38213538e6f40"},{"f":"fonts/font/SST-MediumItalic.otf","req":false,"note":"basic font (English and other Latin languages)","md5":"4a5f9670dcf02a8f59ccdc1412bc1cf2"},{"f":"fonts/font/SST-Roman.otf","req":false,"note":"basic font (English and other Latin languages)","md5":"37d6ea9bc5956be1b853da826bc98a1f"},{"f":"fonts/font/SSTTypewriter-Bd.otf","req":false,"note":"basic font (English and other Latin languages)","md5":"84b4b1420f634fa49af069c93389e7f2"},{"f":"fonts/font/SSTTypewriter-Roman.otf","req":false,"note":"basic font (English and other Latin languages)","md5":"3604dbe2c904370ff23145974b6fc129"}],"tip":"In shadPS4 these go in its user/ folder: user/sys_modules/ and user/fonts/. Emu Vault keeps them in bios/ps4/ in the same layout."},{"id":"psvita","st":"req","used":"Vita3K","why":"Needs the official Vita system software.","files":[{"f":"PSVUPDAT.PUP","req":true,"note":"firmware","free":{"t":"Free download from Sony","u":"https://www.playstation.com/en-us/support/hardware/psvita/system-software/"}},{"f":"PSP2UPDAT.PUP","req":false,"note":"font package","free":{"t":"Free download from Sony","u":"https://www.playstation.com/en-us/support/hardware/psvita/system-software/"}}],"free":{"t":"Free download from Sony","u":"https://www.playstation.com/en-us/support/hardware/psvita/system-software/"}},{"id":"psp","st":"none","used":"PPSSPP","why":"PPSSPP has everything built in.","files":[{"f":"flash0/font/","req":false,"note":"real PSP fonts from your PSP (nicer Japanese text)"},{"f":"PPSSPP/","req":false,"note":"needed by the RetroArch PPSSPP core","free":{"t":"PPSSPP assets, free from the PPSSPP project","u":"https://github.com/hrydgard/ppsspp"}}]},{"id":"saturn","st":"req","used":"Beetle Saturn, Kronos, Yaba Sanshiro","why":"Beetle Saturn needs it; Yabause can run without but less well.","files":[{"f":"sega_101.bin","req":true,"note":"Japan","one":"r","md5":"85ec9ca47d8f6807718151cbcca8b964"},{"f":"mpr-17933.bin","req":true,"note":"USA and Europe","one":"r","md5":"3240872c70984b6cbfda1586cab68dbe"},{"f":"saturn_bios.bin","req":false,"note":"name used by the Kronos core","md5":"af5828fdff51384f99b3c4926be27762"},{"f":"stvbios.zip","req":false,"note":"for ST-V arcade games","md5":"0e92c1e02862dfeb4cdef7f4414b14a9"}]},{"id":"segacd","st":"req","used":"Genesis Plus GX, PicoDrive","why":"Needs the BIOS for the region of your games.","files":[{"f":"bios_CD_U.bin","req":true,"note":"USA","one":"r","md5":"2efd74e3232ff260e371b99f84024f7f"},{"f":"bios_CD_E.bin","req":true,"note":"Europe","one":"r","md5":"e66fa1dc5820d254611fdcdba0662372"},{"f":"bios_CD_J.bin","req":true,"note":"Japan","one":"r","md5":"278a9397d192149e84e820ac621a8edd"}]},{"id":"dreamcast","st":"opt","used":"Flycast, Redream","why":"Flycast has a built-in replacement. A real BIOS improves compatibility.","files":[{"f":"dc_boot.bin","req":false,"note":"","md5":"e10c53c2f8b90bab96ead2d368858623"},{"f":"dc_flash.bin","req":false,"note":""},{"f":"naomi.zip","req":false,"note":"for Naomi arcade games","md5":"526eda1e2a7920c92c88178789d71d84"},{"f":"awbios.zip","req":false,"note":"for Atomiswave arcade games","md5":"85254fbe320ca82a768ec2c26bb08def"}]},{"id":"naomi","st":"req","used":"Flycast","why":"Arcade board BIOS, kept with your arcade games.","files":[{"f":"naomi.zip","req":true,"note":"put it next to your Naomi games","md5":"526eda1e2a7920c92c88178789d71d84"}]},{"id":"naomi2","st":"req","used":"Flycast","why":"Arcade board BIOS, kept with your arcade games.","files":[{"f":"naomi2.zip","req":true,"note":"put it next to your Naomi 2 games","md5":"c50072cbab75673e1b1a6b94355e6fa8"}]},{"id":"megadrive","st":"none","used":"Genesis Plus GX, PicoDrive","why":"No BIOS needed.","files":[]},{"id":"mastersystem","st":"opt","used":"Genesis Plus GX","why":"Only for the startup screen.","files":[{"f":"bios_E.sms","req":false,"note":"Europe","md5":"840481177270d5642a14ca71ee72844c"},{"f":"bios_U.sms","req":false,"note":"USA","md5":"840481177270d5642a14ca71ee72844c"},{"f":"bios_J.sms","req":false,"note":"Japan","md5":"24a519c53f67b00640d0048ef7089105"}]},{"id":"gamegear","st":"opt","used":"Genesis Plus GX","why":"Only for the startup screen.","files":[{"f":"bios.gg","req":false,"note":"","md5":"672e104c3be3a238301aceffc3b23fd6"}]},{"id":"sg-1000","st":"none","used":"Genesis Plus GX, Gearsystem","why":"No BIOS needed.","files":[]},{"id":"sega32x","st":"none","used":"PicoDrive","why":"No BIOS needed.","files":[]},{"id":"pico","st":"none","used":"PicoDrive","why":"No BIOS needed.","files":[]},{"id":"nes","st":"none","used":"Mesen, FCEUmm, Nestopia","why":"No BIOS needed.","files":[]},{"id":"fds","st":"req","used":"Mesen, FCEUmm, Nestopia","why":"Famicom Disk System games need the disk system BIOS.","files":[{"f":"disksys.rom","req":true,"note":"","md5":"ca30b50f880eb660a320674ed365ef7a"},{"f":"gamegenie.nes","req":false,"note":"only for Game Genie cheats","md5":"7f98d77d7a094ad7d069b74bd553ec98"}]},{"id":"snes","st":"none","used":"Snes9x, bsnes","why":"No BIOS needed.","files":[]},{"id":"satellaview","st":"req","used":"Snes9x, bsnes","why":"Needs the BS-X cartridge BIOS.","files":[{"f":"BS-X.bin","req":true,"note":"","md5":"fed4d8242cfbed61343d53d48432aced"}]},{"id":"sufami","st":"req","used":"Snes9x, bsnes","why":"Needs the Sufami Turbo BIOS.","files":[{"f":"STBIOS.bin","req":true,"note":"","md5":"d3a44ba7d42a74d3ac58cb9c14c6a5ca"}]},{"id":"n64","st":"none","used":"Mupen64Plus, Gopher64","why":"No BIOS needed.","files":[]},{"id":"n64dd","st":"req","used":"Mupen64Plus, ares","why":"64DD disks need the IPL.","files":[{"f":"64DD_IPL.bin","req":true,"note":"Japan","md5":"8d3d9f294b6e174bc7b1d2fd1c727530"}]},{"id":"gb","st":"opt","used":"Gambatte, SameBoy, mGBA","why":"Only for the startup logo.","files":[{"f":"gb_bios.bin","req":false,"note":"","md5":"32fbbd84168d3482956eb3c5051637f5"},{"f":"dmg_boot.bin","req":false,"note":"alternative name used by some cores","md5":"32fbbd84168d3482956eb3c5051637f5"},{"f":"sgb_bios.bin","req":false,"note":"Super Game Boy, for SGB borders and colors","md5":"d574d4f9c12f305074798f54c091a8b4"},{"f":"SGB1.sfc","req":false,"note":"Super Game Boy cartridge, for bsnes","md5":"b15ddb15721c657d82c5bab6db982ee9"}]},{"id":"gbc","st":"opt","used":"Gambatte, SameBoy, mGBA","why":"Only for the startup logo.","files":[{"f":"gbc_bios.bin","req":false,"note":"","md5":"dbfce9db9deaa2567f6a84fde55f9680"},{"f":"cgb_boot.bin","req":false,"note":"alternative name used by some cores","md5":"dbfce9db9deaa2567f6a84fde55f9680"}]},{"id":"gba","st":"opt","used":"mGBA, gpSP","why":"Most games run without it; a few need it.","files":[{"f":"gba_bios.bin","req":false,"note":"mGBA and RetroArch want this name; packs sometimes call it GBA_bios.rom (same file, Import BIOS renames it)","md5":"a860e8c0b6d573d191e4ec7db1b1e4f6"}]},{"id":"nds","st":"opt","used":"melonDS, DeSmuME","why":"melonDS runs without, but the DS menu needs firmware.","files":[{"f":"bios7.bin","req":false,"note":"","md5":"df692a80a5b1bc90728bc3dfc76cd948"},{"f":"bios9.bin","req":false,"note":"","md5":"a392174eb3e572fed6447e956bde4b25"},{"f":"firmware.bin","req":false,"note":"needed for the DS menu","md5":"e45033d9b0fa6b0de071292bba7c9d13"}]},{"id":"dsi","st":"req","used":"melonDS","why":"DSi mode needs the DSi BIOS files and NAND.","files":[{"f":"dsi_bios7.bin","req":true,"note":"","md5":"559dae4ea78eb9d67702c56c1d791e81"},{"f":"dsi_bios9.bin","req":true,"note":"","md5":"87b665fce118f76251271c3732532777"},{"f":"dsi_firmware.bin","req":true,"note":""},{"f":"dsi_nand.bin","req":true,"note":""}]},{"id":"3ds","st":"none","used":"Azahar, Citra MMJ","why":"Most games run without system files. Put them loose in bios/3ds/: RetroArch gets them in citra/sysdata/.","files":[{"f":"aes_keys.txt","req":false,"note":"keys for encrypted games (Citra, RetroArch), from your own 3DS"},{"f":"keys.txt","req":false,"note":"the same keys under Azahar's name"},{"f":"seeddb.bin","req":false,"note":"keys for newer games (system 9.6 and up)"},{"f":"shared_font.bin","req":false,"note":"the 3DS font; without it Azahar uses an open one"}]},{"id":"n3ds","st":"none","used":"Azahar","why":"Most games run without system files.","files":[{"f":"aes_keys.txt","req":false,"note":"only for encrypted games, from your own 3DS"}]},{"id":"virtualboy","st":"none","used":"Beetle VB","why":"No BIOS needed.","files":[]},{"id":"pokemini","st":"opt","used":"PokeMini","why":"Only for the startup screen.","files":[{"f":"bios.min","req":false,"note":"","md5":"1e4fb124a3a886865acb574f388c803d"}]},{"id":"gc","st":"opt","used":"Dolphin","why":"Only needed to see the GameCube startup menu.","files":[{"f":"IPL.bin","req":false,"note":"one per region, in Dolphin's folder","md5":"db92574caab77a7ec99d4605fd6f2450"},{"f":"GC/USA/IPL.bin","req":false,"note":"startup menu, USA","md5":"db92574caab77a7ec99d4605fd6f2450"},{"f":"GC/EUR/IPL.bin","req":false,"note":"startup menu, Europe","md5":"db92574caab77a7ec99d4605fd6f2450"},{"f":"GC/JAP/IPL.bin","req":false,"note":"startup menu, Japan","md5":"db92574caab77a7ec99d4605fd6f2450"},{"f":"dolphin-emu/Sys/","req":false,"note":"needed by the RetroArch Dolphin core","free":{"t":"Dolphin Sys folder, free from the Dolphin project","u":"https://dolphin-emu.org"}}]},{"id":"wii","st":"none","used":"Dolphin","why":"No BIOS needed.","files":[{"f":"dolphin-emu/Sys/","req":false,"note":"needed by the RetroArch Dolphin core","free":{"t":"Dolphin Sys folder, free from the Dolphin project","u":"https://dolphin-emu.org"}}]},{"id":"xbox","st":"req","used":"xemu, X1 BOX, Hakux","why":"Needs three files from an original Xbox.","files":[{"f":"mcpx_1.0.bin","req":true,"note":"boot ROM"},{"f":"Complex_4627.bin","req":true,"note":"flash BIOS"},{"f":"xbox_hdd.qcow2","req":true,"note":"hard drive image","free":{"t":"The hard drive image is a free download from the xemu website","u":"https://xemu.app/docs/required-files/"}}],"free":{"t":"The hard drive image is a free download from the xemu website","u":"https://xemu.app/docs/required-files/"}},{"id":"xbox360","st":"none","used":"Xenia","why":"No BIOS needed.","files":[]},{"id":"atari2600","st":"none","used":"Stella","why":"No BIOS needed.","files":[]},{"id":"atari5200","st":"req","used":"Atari800, a5200","why":"Needs the 5200 BIOS.","files":[{"f":"5200.rom","req":true,"note":"","md5":"281f20ea4320404ec820fb7ec0693b38"}]},{"id":"atari7800","st":"opt","used":"ProSystem","why":"Only for the startup screen.","files":[{"f":"7800 BIOS (U).rom","req":false,"note":"USA","md5":"0763f1ffb006ddbe32e52d497ee848ae"},{"f":"7800 BIOS (E).rom","req":false,"note":"Europe","md5":"397bb566584be7b9764e7a68974c4263"}]},{"id":"atari800","st":"opt","used":"Atari800","why":"Has built-in replacements; the real OS improves compatibility.","files":[{"f":"ATARIXL.ROM","req":false,"note":"","md5":"06daac977823773a3eea3422fd26a703"},{"f":"ATARIBAS.ROM","req":false,"note":"","md5":"0bac0c6a50104045d902df4503a4c30b"},{"f":"ATARIOSB.ROM","req":false,"note":"","md5":"a3e8d617c95d08031fe1b20d541434b2"},{"f":"ATARIOSA.ROM","req":false,"note":"","md5":"eb1f32f5d9f382db1bbfb8d7f9cb343a"},{"f":"BB01R4_OS.ROM","req":false,"note":"","md5":"b7a2a04677d34f069eeb643d5238bf86"},{"f":"XEGAME.ROM","req":false,"note":"XE game system","md5":"d7eb37aec6960cba36bc500e0e5d00bc"}]},{"id":"atarilynx","st":"req","used":"Handy, Beetle Lynx","why":"Needs the Lynx boot ROM.","files":[{"f":"lynxboot.img","req":true,"note":"","md5":"fcd403db69f54290b51035d82f835e7b"}]},{"id":"atarijaguar","st":"none","used":"Virtual Jaguar, BigPEmu","why":"No BIOS needed.","files":[]},{"id":"atarijaguarcd","st":"game","used":"BigPEmu","why":"Depends on the emulator; BigPEmu needs none.","files":[]},{"id":"atarist","st":"req","used":"Hatari","why":"Needs a TOS image.","files":[{"f":"tos.img","req":true,"note":"","md5":"c1c57ce48e8ee4135885cee9e63a68a2"}]},{"id":"pcengine","st":"none","used":"Beetle PCE","why":"No BIOS needed.","files":[{"f":"syscard3.pce","req":false,"note":"needed when you play CD games on the same core","md5":"38179df8f4ac870017db21ebcbf53114"}]},{"id":"supergrafx","st":"none","used":"Beetle SuperGrafx","why":"No BIOS needed.","files":[]},{"id":"pcenginecd","st":"req","used":"Beetle PCE","why":"CD games need the System Card.","files":[{"f":"syscard3.pce","req":true,"note":"System Card 3","md5":"38179df8f4ac870017db21ebcbf53114"},{"f":"syscard1.pce","req":false,"note":"System Card 1, for the oldest CD games","md5":"2b7ccb3d86baa18f6402c176f3065082"},{"f":"syscard2.pce","req":false,"note":"System Card 2","md5":"3cdd6614a918616bfc41c862e889dd79"},{"f":"gexpress.pce","req":false,"note":"Game Express card, for a few unlicensed games","md5":"6d2cb14fc3e1f65ceb135633d1694122"}]},{"id":"pcfx","st":"req","used":"Beetle PC-FX","why":"Needs the PC-FX BIOS.","files":[{"f":"pcfx.rom","req":true,"note":"","md5":"08e36edbea28a017f79f8d4f7ff9b6d7"}]},{"id":"pc98","st":"req","used":"Neko Project II Kai","why":"Needs the PC-98 BIOS and font.","files":[{"f":"bios.rom","req":true,"note":"","md5":"cd237e16e7e77c06bb58540e9e9fca68"},{"f":"font.bmp","req":true,"note":"","md5":"7da1e5b7c482d4108d22a5b09631d967"},{"f":"itf.rom","req":true,"note":"","md5":"72ea51443070f0e9212bfc9b793ee28e"},{"f":"sound.rom","req":true,"note":"","md5":"524473c1a5a03b17e21d86a0408ff827"},{"f":"FONT.ROM","req":false,"note":"alternative font file","md5":"38d32748ae49d1815b0614970849fd40"},{"f":"2608_BD.WAV","req":false,"note":"drum samples for the sound card","md5":"d94546e70f17fd899be8df3544ab6cbb"},{"f":"2608_SD.WAV","req":false,"note":"","md5":"d71004351c8bbfdad53b18222c061d49"},{"f":"2608_TOP.WAV","req":false,"note":"","md5":"593cff6597ab9380d822b8f824fd2c28"},{"f":"2608_HH.WAV","req":false,"note":"","md5":"08c54a0c1f774a5538a848a6665a34b4"},{"f":"2608_TOM.WAV","req":false,"note":"","md5":"96a4ead13f364734f79b0c58af2f0e1f"},{"f":"2608_RIM.WAV","req":false,"note":"","md5":"465ea0768b27da404aec45dfc501404b"}]},{"id":"ngp","st":"none","used":"Beetle NeoPop, RACE","why":"No BIOS needed.","files":[]},{"id":"ngpc","st":"none","used":"Beetle NeoPop, RACE","why":"No BIOS needed.","files":[]},{"id":"neogeocd","st":"req","used":"NeoCD","why":"Needs a Neo Geo CD BIOS.","files":[{"f":"front-sp1.bin","req":true,"note":"front loader","one":"r","md5":"5c2366f25ff92d71788468ca492ebeca"},{"f":"top-sp1.bin","req":true,"note":"top loader","one":"r","md5":"122aee210324c72e8a11116e6ef9c0d0"},{"f":"uni-bioscd.rom","req":true,"note":"UniBIOS","one":"r","md5":"08ca8b2dba6662e8024f9e789711c6fc"},{"f":"neocd.bin","req":false,"note":"alternative BIOS","md5":"f39572af7584cb5b3f70ae8cc848aba2"},{"f":"000-lo.lo","req":false,"note":"zoom table, needed with some BIOS files","md5":"fc7599f3f871578fe9a0453662d1c966"},{"f":"ng-lo.rom","req":false,"note":"zoom table, other name","md5":"e255264d85d5765013b1b2fa8109dd53"}]},{"id":"arcade","st":"game","used":"FinalBurn Neo, MAME","why":"Depends on the game. Neo Geo games need neogeo.zip; other BIOS files come with the romset.","files":[{"f":"neogeo.zip","req":false,"note":"for all Neo Geo games","md5":"00dad01abdbf8ea9e79ad2fe11bdb182"},{"f":"pgm.zip","req":false,"note":"PGM games (IGS)","md5":"87cc944eef4c671aa2629a8ba48a08e0"},{"f":"skns.zip","req":false,"note":"Super Kaneko Nova games","md5":"3f956c4e7008804cb47cbde49bd5b908"},{"f":"decocass.zip","req":false,"note":"Data East cassette games","md5":"b7e1189b341bf6a8e270017c096d21b0"},{"f":"isgsm.zip","req":false,"note":"ISG Selection Master games","md5":"4a56d56e2219c5e2b006b66a4263c01c"},{"f":"cchip.zip","req":false,"note":"some Taito games","md5":"df6f8a3d83c028a5cb9f2f2be60773f3"},{"f":"nmk004.zip","req":false,"note":"some NMK games","md5":"bfacf1a68792d5348f93cf724d2f1dda"},{"f":"ym2608.zip","req":false,"note":"some sound chips","md5":"79ae0d2bb1901b7e606b6dc339b79a97"},{"f":"bubsys.zip","req":false,"note":"Bubble System games","md5":"f81298afd68a1a24a49a1a2d9f087964"},{"f":"midssio.zip","req":false,"note":"some Midway games","md5":"5904b0de768d1d506e766aa7e18994c1"},{"f":"hiscore.dat","req":false,"note":"saves high scores","free":{"t":"High score list, free from the MAME/FBNeo community","u":"https://github.com/libretro/FBNeo"},"md5":"37fc4e050b53a1ef2c2e7f3042553025"}]},{"id":"wonderswan","st":"none","used":"Beetle Cygne","why":"No BIOS needed.","files":[]},{"id":"wonderswancolor","st":"none","used":"Beetle Cygne","why":"No BIOS needed.","files":[]},{"id":"colecovision","st":"req","used":"blueMSX, Gearcoleco","why":"Needs the ColecoVision BIOS.","files":[{"f":"colecovision.rom","req":true,"note":"","md5":"2c66f5911e5b42b8ebe113403548eee7"}]},{"id":"intellivision","st":"req","used":"FreeIntv","why":"Needs two system ROMs.","files":[{"f":"exec.bin","req":true,"note":"","md5":"62e761035cb657903761800f4437b8af"},{"f":"grom.bin","req":true,"note":"","md5":"0cd5946c6473e42e8e4c2137785e427f"}]},{"id":"odyssey2","st":"req","used":"O2EM","why":"Needs the Odyssey² BIOS.","files":[{"f":"o2rom.bin","req":true,"note":"","md5":"562d5ebf9e030a40d6fabfc2f33139fd"},{"f":"c52.bin","req":false,"note":"French Videopac+","md5":"f1071cdb0b6b10dde94d3bc8a6146387"},{"f":"jopac.bin","req":false,"note":"Jopac","md5":"279008e4a0db2dc5f1c048853b033828"}]},{"id":"videopac","st":"req","used":"O2EM","why":"Needs the Videopac+ BIOS.","files":[{"f":"g7400.bin","req":true,"note":"","md5":"c500ff71236068e0dc0d0603d265ae76"}]},{"id":"channelf","st":"req","used":"FreeChaF","why":"Needs two system ROMs.","files":[{"f":"sl31253.bin","req":true,"note":"","md5":"ac9804d4c0e9d07e33472e3726ed15c3"},{"f":"sl31254.bin","req":true,"note":"","md5":"da98f4bb3242ab80d76629021bb27585"},{"f":"sl90025.bin","req":false,"note":"Channel F II BIOS","md5":"95d339631d867c8f1d15a5f2ec26069d"}]},{"id":"vectrex","st":"none","used":"vecx","why":"No BIOS needed.","files":[]},{"id":"epoch-super-cassette-vision","st":"req","used":"MAME","why":"Needs the system ROM.","files":[{"f":"upd7801g.s01","req":true,"note":"","md5":"635a978fd40db9a18ee44eff449fc126"}]},{"id":"msx","st":"req","used":"blueMSX, fMSX","why":"Needs the MSX system ROMs.","files":[{"f":"MSX.ROM","req":true,"note":"","md5":"aa95aea2563cd5ec0a0919b44cc17d47"},{"f":"DISK.ROM","req":false,"note":"for disk games","md5":"80dcd1ad1a4cf65d64b7ba10504e8190"},{"f":"FMPAC.ROM","req":false,"note":"FM sound for games that support it","md5":"6f69cc8b5ed761b03afd78000dfb0e19"},{"f":"KANJI.ROM","req":false,"note":"Japanese text","md5":"febe8782b466d7c3b16de6d104826b34"},{"f":"MSXDOS2.ROM","req":false,"note":"MSX-DOS 2","md5":"6418d091cd6907bbcf940324339e43bb"}]},{"id":"msx2","st":"req","used":"blueMSX, fMSX","why":"Needs the MSX2 system ROMs.","files":[{"f":"MSX2.ROM","req":true,"note":"","md5":"ec3a01c91f24fbddcbcab0ad301bc9ef"},{"f":"MSX2EXT.ROM","req":true,"note":"","md5":"2183c2aff17cf4297bdb496de78c2e8a"},{"f":"DISK.ROM","req":false,"note":"for disk games","md5":"80dcd1ad1a4cf65d64b7ba10504e8190"},{"f":"MSX2P.ROM","req":false,"note":"MSX2+ system","md5":"6d8c0ca64e726c82a4b726e9b01cdf1e"},{"f":"MSX2PEXT.ROM","req":false,"note":"MSX2+ extension","md5":"7c8243c71d8f143b2531f01afa6a05dc"},{"f":"FMPAC.ROM","req":false,"note":"FM sound","md5":"6f69cc8b5ed761b03afd78000dfb0e19"},{"f":"KANJI.ROM","req":false,"note":"Japanese text","md5":"febe8782b466d7c3b16de6d104826b34"}]},{"id":"c64","st":"none","used":"VICE","why":"VICE has everything built in.","files":[{"f":"JiffyDOS_C64.bin","req":false,"note":"faster disk loading","md5":"be09394f0576cf81fa8bacf634daf9a2"},{"f":"JiffyDOS_1541-II.bin","req":false,"note":"faster disk loading, drive ROM","md5":"1b1e985ea5325a1f46eb7fd9681707bf"}]},{"id":"plus4","st":"none","used":"VICE","why":"VICE has everything built in.","files":[]},{"id":"vic20","st":"none","used":"VICE","why":"VICE has everything built in.","files":[]},{"id":"amiga","st":"opt","used":"PUAE","why":"Has a free replacement built in; the real Kickstart works better.","files":[{"f":"kick34005.A500","req":false,"note":"Amiga 500","md5":"82a21c1890cae844b3df741f2762d48d"},{"f":"kick40068.A1200","req":false,"note":"Amiga 1200","md5":"646773759326fbac3b2311fd8c8793ee"},{"f":"kick37175.A500","req":false,"note":"Amiga 500+","md5":"dc10d7bdd1b6f450773dfb558477c230"},{"f":"kick40063.A600","req":false,"note":"Amiga 600","md5":"e40a5dfb3d017ba8779faba30cbd1c8e"},{"f":"kick40068.A4000","req":false,"note":"Amiga 4000","md5":"9bdedde6a4f33555b4a270c8ca53297d"}]},{"id":"amigacd32","st":"req","used":"PUAE","why":"Needs the CD32 Kickstart.","files":[{"f":"kick40060.CD32","req":true,"note":"","md5":"5f8924d013dd57a89cf349f4cdedc6b1"},{"f":"kick40060.CD32.ext","req":true,"note":"","md5":"bb72565701b1b6faece07d68ea5da639"}]},{"id":"cdtv","st":"req","used":"PUAE","why":"Needs the CDTV Kickstart.","files":[{"f":"kick34005.A500","req":true,"note":"","md5":"82a21c1890cae844b3df741f2762d48d"},{"f":"kick34005.CDTV","req":true,"note":"","md5":"89da1838a24460e4b93f4f0c5d92d48d"}]},{"id":"x68000","st":"req","used":"PX68k","why":"Needs the X68000 system ROMs.","files":[{"f":"iplrom.dat","req":true,"note":"","md5":"7fd4caabac1d9169e289f0f7bbf71d8e"},{"f":"cgrom.dat","req":true,"note":"","md5":"cb0a5cfcf7247a7eab74bb2716260269"},{"f":"iplromxv.dat","req":false,"note":"X68000 XVI","md5":"0617321daa182c3f3d6f41fd02fb3275"},{"f":"iplromco.dat","req":false,"note":"X68000 Compact","md5":"cc78d4f4900f622bd6de1aed7f52592f"},{"f":"iplrom30.dat","req":false,"note":"X68030","md5":"f373003710ab4322642f527f567e020a"}]},{"id":"x1","st":"req","used":"X Millennium","why":"Needs the X1 IPL ROM.","files":[{"f":"IPLROM.X1","req":true,"note":"","md5":"eeeea1cd29c6e0e8b094790ae969bfa7"}]},{"id":"zxspectrum","st":"none","used":"Fuse","why":"Fuse has everything built in.","files":[]},{"id":"3do","st":"req","used":"Opera","why":"Needs a 3DO BIOS.","files":[{"f":"panafz10.bin","req":true,"note":"Panasonic FZ-10","one":"r","md5":"51f2f43ae2f3508a14d9f56597e2d3ce"},{"f":"panafz1.bin","req":true,"note":"Panasonic FZ-1","one":"r","md5":"f47264dd47fe30f73ab3c010015c155b"},{"f":"goldstar.bin","req":true,"note":"GoldStar","one":"r","md5":"8639fd5e549bd6238cfee79e3e749114"},{"f":"sanyotry.bin","req":false,"note":"","md5":"35fa1a1ebaaeea286dc5cd15487c13ea"},{"f":"panafz1j.bin","req":false,"note":"Japan","md5":"a496cfdded3da562759be3561317b605"}]},{"id":"cdimono1","st":"req","used":"SAME CDi, MAME","why":"Needs the CD-i BIOS.","files":[{"f":"cdimono1.zip","req":true,"note":"","md5":"801c529739b83e1490b897f2d3ffbb3a"},{"f":"cdimono2.zip","req":false,"note":"CD-i model 2","md5":"97aa5f47030cd9fdb679d4fafbb0e332"},{"f":"cdibios.zip","req":false,"note":"","md5":"709acce6e9c4043b851ea7429b8e7eff"}]},{"id":"switch","st":"req","used":"Eden, Citron Neo","why":"Needs keys and firmware from your own Switch.","files":[{"f":"prod.keys","req":true,"note":"from your own console"},{"f":"title.keys","req":false,"note":""},{"f":"firmware/","req":true,"note":"folder with firmware files"}]},{"id":"wiiu","st":"opt","used":"Cemu","why":"Cemu runs unencrypted games without anything. Encrypted games and online play need files from your own Wii U.","files":[{"f":"keys.txt","req":false,"note":"only for encrypted games"},{"f":"otp.bin","req":false,"note":"for online play"},{"f":"seeprom.bin","req":false,"note":"for online play"}]}];


const S = {
  dir: "/media/drive/Emulators",
  platform: "beide",
  plats: ["linux","android"],
  keep: 3,
  autoCheck: true,
  variant: "standaard",
  packVersion: "v8.0.1", packDate: "2026-10-28",
  filter: "Emulator", onlyOn: false, q: "",
  emus: APPS.map(a=>({...a, plats: a.linux ? ["android","linux"] : ["android"]})),
  bios:[
    {id:"psx", name:"PlayStation 1", used:"DuckStation, ARMSX1, RetroArch", files:[
      {f:"scph5501.bin", req:true, note:"NTSC-U", have:true},
      {f:"scph5502.bin", req:true, note:"PAL (Europe)", have:true},
      {f:"scph5500.bin", req:false, note:"NTSC-J", have:false}]},
    {id:"ps2", name:"PlayStation 2", used:"NetherSX2, ARMSX2, Play!", files:[
      {f:"SCPH-70004.bin", req:true, note:"PAL, any dump of your own works", have:false}]},
    {id:"ps3", name:"PlayStation 3", used:"aPS3e, ARMSX3", files:[
      {f:"PS3UPDAT.PUP", req:true, note:"official firmware from Sony", have:false}]},
    {id:"psvita", name:"PlayStation Vita", used:"Vita3K", files:[
      {f:"PSVUPDAT.PUP", req:true, note:"firmware", have:false},
      {f:"PSP2UPDAT.PUP", req:false, note:"font package", have:false}]},
    {id:"switch", name:"Nintendo Switch", used:"Eden, Citron Neo", files:[
      {f:"prod.keys", req:true, note:"from your own console", have:false},
      {f:"title.keys", req:false, note:"", have:false},
      {f:"firmware/", req:true, note:"folder with firmware files", have:false}]},
    {id:"nds", name:"Nintendo DS", used:"MelonDS, WatermelonDS", files:[
      {f:"bios7.bin", req:false, note:"melonDS works without it", have:true},
      {f:"bios9.bin", req:false, note:"", have:true},
      {f:"firmware.bin", req:false, note:"needed for the DS menu", have:false}]},
    {id:"dc", name:"Dreamcast", used:"Flycast", files:[
      {f:"dc_boot.bin", req:false, note:"Flycast has a built-in replacement", have:false},
      {f:"dc_flash.bin", req:false, note:"", have:false}]},
    {id:"xbox", name:"Xbox", used:"X1 BOX (xemu), Hakux", files:[
      {f:"mcpx_1.0.bin", req:true, note:"boot ROM", have:false},
      {f:"Complex_4627.bin", req:true, note:"flash BIOS", have:false},
      {f:"xbox_hdd.qcow2", req:true, note:"hard drive image", have:false}]},
  ],
  roms:[
    {id:"nes", name:"NES", ext:".nes .zip", n:42, mb:7},
    {id:"snes", name:"SNES", ext:".sfc .smc .zip", n:118, mb:96},
    {id:"n64", name:"Nintendo 64", ext:".z64 .n64 .zip", n:31, mb:620},
    {id:"gba", name:"Game Boy Advance", ext:".gba .zip", n:64, mb:540},
    {id:"nds", name:"Nintendo DS", ext:".nds .zip", n:19, mb:1700},
    {id:"3ds", name:"Nintendo 3DS", ext:".3ds .cci", n:4, mb:3900},
    {id:"gc", name:"GameCube / Wii", ext:".rvz .iso", n:9, mb:11800},
    {id:"switch", name:"Switch", ext:".nsp .xci", n:2, mb:8400},
    {id:"psx", name:"PlayStation 1", ext:".chd .cue .bin", n:23, mb:9100},
    {id:"ps2", name:"PlayStation 2", ext:".chd .iso", n:6, mb:21400},
    {id:"psp", name:"PSP", ext:".iso .cso", n:11, mb:7900},
    {id:"ps3", name:"PlayStation 3", ext:".iso, folders", n:0, mb:0},
    {id:"dreamcast", name:"Dreamcast", ext:".chd .gdi", n:8, mb:4100},
    {id:"xbox", name:"Xbox", ext:".iso (xiso)", n:0, mb:0},
  ],
  log:[]
};

const $ = s => document.querySelector(s);
function setSkin(v){ if(v==="modern") document.documentElement.dataset.skin="modern"; else delete document.documentElement.dataset.skin; try{ localStorage.setItem("emuvault-skin", v); }catch(e){} if (typeof renderSet==="function" && document.getElementById("view-set")) renderSet(); }
try{ if(localStorage.getItem("emuvault-skin")==="modern") document.documentElement.dataset.skin="modern"; }catch(e){}
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const size = mb => mb >= 1024 ? (mb/1024).toFixed(1)+" GB" : mb+" MB";
const fmtDate = d => { const [y,m,dd] = d.split("-"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]} ${+dd}, ${y}`; };
const now = () => new Date().toTimeString().slice(0,8);
const wantPlats = e => e.plats.filter(p => S.platform==="beide" || S.platform===p);
const needsUpdate = e => e.on && wantPlats(e).length && e.versions[0]?.[0] !== e.latest[0];
let toastT;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,2800); }
function log(msg){ S.log.unshift([now(),msg]); S.log=S.log.slice(0,50); renderLog(); }

function renderStrip(){
  const n = S.emus.filter(needsUpdate).length;
  const on = S.emus.filter(e=>e.on);
  const mb = on.reduce((a,e)=>a+e.mb*e.versions.length*wantPlats(e).length,0);
  $("#strip").innerHTML =
    `<span>Folder <b class="mono">${esc(S.dir)}</b></span>
     <span>Platform <b>${S.platform==="beide"?"Android + Linux":S.platform==="linux"?"Linux":"Android"}</b></span>
     <span>Keep <b>${S.keep} versions</b></span>
     <span>On drive <b>${size(mb)}</b></span>
     <span>${n ? `<b>${n}</b> update${n>1?"s":""} available` : "All up to date"}</span>`;
  $("#n-emu").textContent = on.length;
  const miss = mySystemIds().filter(id=>biosState(id).k==="missing").length;
  $("#n-bios").textContent = miss ? `${miss} to collect` : (S.biosGoal==="all"?"complete":"ok");
  $("#n-roms").textContent = S.roms.reduce((a,r)=>a+r.n,0);
  const b=$("#upd-all"); b.disabled=!n; b.textContent = n ? `Update all (${n})` : "Update all";
}

// ---------------------------------------------------------------- Packs: Obtainium JSON lists
const OEP_META = {id:"oep", name:"Obtainium Emulation Pack", ver:"v8.0.1", date:"2026-10-28", src:"https://github.com/RJNY/Obtainium-Emulation-Pack", kind:"github", builtin:true};
const RECOMP_META={id:"recomp", name:"Obtainium Recomp & Decomp", ver:"V3.3", date:"2026-10-28", src:"https://codeberg.org/BBoi34/Obtainium-Recomp-Decomp", kind:"codeberg"};
const RECOMP_APPS=[{"pkg":"com.aure.banjorecomp","name":"Banjo-Kazooie Recomp","url":"https://github.com/AurelioB/BanjoRecomp-Android","cat":"Decomps/Recomps"},{"pkg":"com.sergiomanzur.sotnrecomp","name":"Castlevania: Symphony of the Night Recomp","url":"https://github.com/sergiomanzur/SymphonyRecomp","cat":"Decomps/Recomps"},{"pkg":"com.sergiomanzur.cvlodrecomp","name":"Castlevania: Legacy of Darkness Recomp","url":"https://github.com/sergiomanzur/cvlod_recomp","cat":"Decomps/Recomps"},{"pkg":"com.matteo842.crashbandicoot","name":"Crash Bandicoot","url":"https://github.com/Matteo842/CrashBandicoot-Launcher","cat":"Decomps/Recomps"},{"pkg":"com.simon358.ctrnative","name":"Crash Team Racing","url":"https://github.com/Simon358/ctr-native-android","cat":"Decomps/Recomps"},{"pkg":"com.ogdanimal.goemon64","name":"Goemon 64 Recomp","url":"https://github.com/ogdanimal/Goemon64Recomp-Android","cat":"Decomps/Recomps"},{"pkg":"com.jeffory.goldeneyerecomp","name":"GoldenEye 007 (XBLA) Recomp","url":"https://github.com/jeffory/GoldenEye-Recomp","cat":"Decomps/Recomps"},{"pkg":"com.igawa6.harvestmoon64","name":"Harvest Moon 64 Recomp","url":"https://github.com/igawa6/HarvestMoon64Recomp","cat":"Decomps/Recomps"},{"pkg":"com.izzy2lost.spaghettikart","name":"Mario Kart 64 (SpaghettiKart)","url":"https://github.com/izzy2lost/SpaghettiKart","cat":"Decomps/Recomps"},{"pkg":"com.chrissotraidis.kartpad","name":"Mario Kart Wii (KartPad)","url":"https://github.com/chrissotraidis/kartpad","cat":"Decomps/Recomps"},{"pkg":"com.izzy2lost.perfectdark","name":"Perfect Dark Recomp","url":"https://github.com/izzy2lost/perfect_dark","cat":"Decomps/Recomps"},{"pkg":"com.underdecoded.gen2recomped","name":"Pokémon Gen 2 Recomped","url":"https://github.com/UNDERdecoded/Gen2Recomped","cat":"Decomps/Recomps"},{"pkg":"com.bryanthaboi.pokemonredblue","name":"Pokémon Red/Blue Recomp","url":"https://github.com/bryanthaboi/pokemon-gen1-recomp-project","cat":"Decomps/Recomps"},{"pkg":"com.slickamogus.silenthill","name":"Silent Hill Decomp","url":"https://github.com/SlickAmogus/silent-hill-decomp","cat":"Decomps/Recomps"},{"pkg":"com.buku313.skate3mobile","name":"Skate 3 Mobile","url":"https://github.com/Buku313/Skate3-Mobile","cat":"Decomps/Recomps"},{"pkg":"com.sansnope.unleashedrecomp","name":"Sonic Unleashed Recomp","url":"https://github.com/SansNope/UnleashedRecomp-Android","cat":"Decomps/Recomps"},{"pkg":"com.izzy2lost.starship","name":"Star Fox 64 (Starship)","url":"https://github.com/izzy2lost/Starship","cat":"Decomps/Recomps"},{"pkg":"com.izzy2lost.ghostship","name":"Super Mario 64 (Ghostship)","url":"https://github.com/izzy2lost/Ghostship","cat":"Decomps/Recomps"},{"pkg":"com.raekwon1603.supermetroid","name":"Super Metroid Android","url":"https://github.com/Raekwon1603/super_metroid-android","cat":"Decomps/Recomps"},{"pkg":"com.jrickey.battleship","name":"Super Smash Bros. (BattleShip)","url":"https://github.com/JRickey/BattleShip","cat":"Decomps/Recomps"},{"pkg":"org.linkzenic.twoship","name":"Zelda: Majora's Mask (2 Ship)","url":"https://github.com/linkzenic/2ship2harkinian-Android","cat":"Decomps/Recomps"},{"pkg":"com.waterdish.shipwright","name":"Zelda: Ocarina of Time (Shipwright)","url":"https://github.com/Waterdish/Shipwright-Android","cat":"Decomps/Recomps"},{"pkg":"com.samyost1.zelda3android","name":"Zelda: A Link to the Past","url":"https://github.com/samyost1/zelda3-android","cat":"Decomps/Recomps"},{"pkg":"com.samyost1.tmcandroid","name":"Zelda: The Minish Cap","url":"https://github.com/samyost1/tmc-android","cat":"Decomps/Recomps"},{"pkg":"com.twilitrealm.dusklight","name":"Zelda: Twilight Princess (Dusklight)","url":"https://github.com/TwilitRealm/dusklight","cat":"Decomps/Recomps"},{"pkg":"com.carlox33.hitandrun","name":"Simpsons Hit and Run","url":"https://github.com/Carlox33/The-Simpsons-Hit-and-Run-Android","cat":"PC Ports"},{"pkg":"org.diasurgical.devilutionx","name":"Diablo 1 (DevilutionX)","url":"https://github.com/diasurgical/DevilutionX","cat":"PC Ports"},{"pkg":"com.xyzz.openmw","name":"Elder Scrolls 3 Morrowind (OpenMW)","url":"https://github.com/xyzz/openmw-android","cat":"PC Ports"}];
const GAME_NEEDS={"com.aure.banjorecomp":{"sys":"n64","titles":["Banjo-Kazooie"]},"com.sergiomanzur.sotnrecomp":{"sys":"psx","titles":["Castlevania - Symphony of the Night"]},"com.sergiomanzur.cvlodrecomp":{"sys":"n64","titles":["Castlevania - Legacy of Darkness"]},"com.matteo842.crashbandicoot":{"sys":"psx","titles":["Crash Bandicoot"]},"com.simon358.ctrnative":{"sys":"psx","titles":["CTR - Crash Team Racing"]},"com.ogdanimal.goemon64":{"sys":"n64","titles":["Mystical Ninja Starring Goemon"]},"com.jeffory.goldeneyerecomp":{"text":"the GoldenEye 007 files from the Xbox 360 (XBLA) release"},"com.igawa6.harvestmoon64":{"sys":"n64","titles":["Harvest Moon 64"]},"com.izzy2lost.spaghettikart":{"sys":"n64","titles":["Mario Kart 64"]},"com.chrissotraidis.kartpad":{"sys":"wii","titles":["Mario Kart Wii"]},"com.izzy2lost.perfectdark":{"sys":"n64","titles":["Perfect Dark"]},"com.underdecoded.gen2recomped":{"sys":"gbc","titles":["Pokemon - Gold Version","Pokemon - Silver Version"]},"com.bryanthaboi.pokemonredblue":{"sys":"gb","titles":["Pokemon - Red Version","Pokemon - Blue Version"]},"com.slickamogus.silenthill":{"sys":"psx","titles":["Silent Hill"]},"com.buku313.skate3mobile":{"sys":"xbox360","titles":["Skate 3"]},"com.sansnope.unleashedrecomp":{"sys":"xbox360","titles":["Sonic Unleashed"]},"com.izzy2lost.starship":{"sys":"n64","titles":["Star Fox 64"]},"com.izzy2lost.ghostship":{"sys":"n64","titles":["Super Mario 64"]},"com.raekwon1603.supermetroid":{"sys":"snes","titles":["Super Metroid"]},"com.jrickey.battleship":{"sys":"n64","titles":["Super Smash Bros."]},"org.linkzenic.twoship":{"sys":"n64","titles":["The Legend of Zelda - Majora's Mask"]},"com.waterdish.shipwright":{"sys":"n64","titles":["The Legend of Zelda - Ocarina of Time"]},"com.samyost1.zelda3android":{"sys":"snes","titles":["The Legend of Zelda - A Link to the Past"]},"com.samyost1.tmcandroid":{"sys":"gba","titles":["The Legend of Zelda - The Minish Cap"]},"com.twilitrealm.dusklight":{"sys":"gc","titles":["The Legend of Zelda - Twilight Princess"]},"com.carlox33.hitandrun":{"text":"the game files of the PC version"},"org.diasurgical.devilutionx":{"text":"DIABDAT.MPQ from your Diablo CD or GOG copy (the free shareware version also works)"},"com.xyzz.openmw":{"text":"the Data Files folder of your Morrowind PC copy"}};

CATS["Decomps/Recomps"]="Decomps & recomps"; CATS["PC Ports"]="PC ports";
function recompEmu(a, packId){ return {id:"rc-"+a.pkg.split(".").pop(), name:a.name, cat:a.cat, sys:a.cat==="PC Ports"?"PC port":"Native Android port", src:"GitHub", source:a.url, dl:a.url+"/releases/latest", site:a.url, pkg:a.pkg, linux:false, plats:["android"], on:false, versions:[], latest:["new","2026-10-28"], mb:120, packs:[packId]}; }
S.packs = [{...OEP_META}, {...RECOMP_META}];
S.emus.forEach(e=>e.packs=["oep"]);
RECOMP_APPS.forEach(a=>S.emus.push(recompEmu(a,"recomp")));
const PACK_SUGGEST = [
  {name:"Obtainium Emulation Pack", url:"https://github.com/RJNY/Obtainium-Emulation-Pack", note:"The standard pack with emulators, frontends and tools, by RJNY", restore:"oep"},
  {name:"Obtainium Recomp & Decomp", url:"https://codeberg.org/BBoi34/Obtainium-Recomp-Decomp", note:"Native Android versions of classic games, made from the original code", restore:"recomp"},
  {name:"Obtainium app configs", url:"https://apps.obtainium.imranr.dev", note:"Pick emulators one by one from the Obtainium developer's catalog", aoc:true},
];
const normUrl = u => String(u||"").trim().replace(/\/+$/,"").toLowerCase();
function parsePack(json){
  const apps = Array.isArray(json) ? json : json && Array.isArray(json.apps) ? json.apps : null;
  if (!apps) throw new Error("This file has no app list. Pick an Obtainium export (.json) with an \"apps\" list.");
  return apps.filter(a=>a && a.url).map(a=>{
    let s={}; try{ s = typeof a.additionalSettings==="string" ? JSON.parse(a.additionalSettings) : (a.additionalSettings||{}); }catch(e){}
    const cat=(a.categories&&a.categories[0])||"Other";
    const about=s.about||"";
    return {name:(s.appName||a.name||a.id||"App").trim(), url:a.url, cat, about, src:a.overrideSource==="GitHub"||/github\.com/.test(a.url)?"GitHub":"Website", pkg:a.id||""};
  });
}
function packDiff(apps){
  const known=new Map(S.emus.map(e=>[normUrl(e.source),e]));
  const fresh=apps.filter(a=>!known.has(normUrl(a.url))), have=apps.length-fresh.length;
  const cats={}; fresh.forEach(a=>cats[a.cat]=(cats[a.cat]||0)+1);
  return {fresh, have, cats};
}
function addPack(meta, apps){
  const id="p"+Date.now().toString(36);
  S.packs.push({id, ...meta, count:apps.length});
  const known=new Map(S.emus.map(e=>[normUrl(e.source),e]));
  let added=0;
  apps.forEach(a=>{
    const ex=known.get(normUrl(a.url));
    if (ex){ if(!ex.packs.includes(id)) ex.packs.push(id); return; }
    if (!CATS[a.cat]) CATS[a.cat]=a.cat;
    const gh=a.src==="GitHub";
    S.emus.push({id:slug(a.name)+"-"+id, name:a.name, cat:a.cat, sys:a.cat==="Emulator"?a.about.replace(/\s*emulator\b/i,"").trim()||"Emulator":a.about||a.cat, src:a.src, source:a.url, dl:gh?a.url.replace(/\/$/,"")+"/releases/latest":a.url, site:a.url, pkg:a.pkg, linux:false, plats:["android"], on:false, versions:[], latest:["new","2026-10-28"], mb:60, packs:[id]});
    known.set(normUrl(a.url), true); added++;
  });
  log(`Pack added: ${meta.name} · ${apps.length} apps, ${added} new`);
  return added;
}
function updatePack(id, apps, ver){
  const p=S.packs.find(x=>x.id===id); if(ver) p.ver=ver; p.date="2026-10-28";
  const known=new Map(S.emus.map(e=>[normUrl(e.source),e])); let added=0;
  apps.forEach(a=>{ const ex=known.get(normUrl(a.url)); if(ex){ if(!ex.packs.includes(id)) ex.packs.push(id); return; }
    if (!CATS[a.cat]) CATS[a.cat]=a.cat; const gh=a.src==="GitHub";
    S.emus.push({id:slug(a.name)+"-"+id+added, name:a.name, cat:a.cat, sys:a.about||a.cat, src:a.src, source:a.url, dl:gh?a.url.replace(/\/$/,"")+"/releases/latest":a.url, site:a.url, pkg:a.pkg, linux:false, plats:["android"], on:false, versions:[], latest:["new","2026-10-28"], mb:60, packs:[id]}); added++; });
  log(`Pack updated: ${p.name}${ver?` to ${ver}`:""} · ${added} new app(s)`);
  return added;
}
function removePack(id){
  const p=S.packs.find(x=>x.id===id); if(!p) return;
  let kept=0, gone=0;
  S.emus = S.emus.filter(e=>{
    if (!e.packs.includes(id)) return true;
    e.packs=e.packs.filter(x=>x!==id);
    if (e.packs.length) return true;
    if (e.on){ e.mine=true; kept++; return true; }
    gone++; return false;
  });
  S.packs=S.packs.filter(x=>x.id!==id);
  log(`Pack removed: ${p.name} · ${gone} apps removed${kept?`, ${kept} kept because they are backed up`:""}`);
  toast(`${p.name} removed`);
}

function restoreRecomp(){
  if (S.packs.some(p=>p.id==="recomp")) return 0;
  S.packs.push({...RECOMP_META}); let added=0;
  const known=new Map(S.emus.map(e=>[normUrl(e.source),e]));
  RECOMP_APPS.forEach(a=>{ const ex=known.get(normUrl(a.url)); if(ex){ if(!ex.packs.includes("recomp")) ex.packs.push("recomp"); ex.mine=false; return; } S.emus.push(recompEmu(a,"recomp")); added++; });
  log(`Pack added: ${RECOMP_META.name} ${RECOMP_META.ver} · ${RECOMP_APPS.length} apps, ${added} new`);
  return added;
}
function restoreOEP(){
  if (S.packs.some(p=>p.id==="oep")) return 0;
  S.packs.unshift({...OEP_META});
  const byId=new Map(S.emus.map(e=>[e.id,e])); let added=0;
  APPS.forEach(a=>{ const ex=byId.get(a.id); if(ex){ if(!ex.packs.includes("oep")) ex.packs.push("oep"); ex.mine=false; return; }
    S.emus.push({...a, plats:a.linux?["android","linux"]:["android"], packs:["oep"], on:false, versions:[]}); added++; });
  log(`Pack added: Obtainium Emulation Pack · ${APPS.length} apps, ${added} new`);
  return added;
}
S.packConfirm = null;
function renderPack(){
  const rows=S.packs.map(p=>{
    const n=S.emus.filter(e=>e.packs.includes(p.id)).length;
    return `<div class="packrow"><div style="min-width:0"><div class="t">${esc(p.name)}${p.builtin?` · ${S.variant==="standaard"?"standard":"dual-screen"}`:""}</div>
      <div class="s">${p.ver?`List <span class="mono">${esc(p.ver)}</span>`:"Your file"}${p.date?` from ${fmtDate(p.date)}`:""} · ${n} apps${p.src?` · <a href="${esc(p.src)}" target="_blank" rel="noopener">${esc(p.src.replace(/^https?:\/\//,"").replace(/\/$/,""))}</a>`:""}${p.waiting?` · <span class="pill warn">waiting for first download</span>`:""}</div></div>
      ${S.packConfirm===p.id?`<span class="gact"><button class="btn small danger" data-prm="${p.id}">Remove ${n} apps?</button><button class="linkbtn" data-pno="1">Cancel</button></span>`:`<button class="linkbtn" data-pask="${p.id}">Remove</button>`}</div>`;
  }).join("");
  $("#pack").innerHTML = `<details class="fold2" data-k="packs" ${isOpen("packs")?"open":""}><summary><span class="packsum"><b>Packs</b><span class="fs">${S.packs.length} pack${S.packs.length===1?"":"s"} · ${S.emus.length} apps · ${S.emus.filter(e=>e.on).length} backed up</span></span></summary><div class="packs">
      <div class="packhead"><div class="nums"><div><b>${S.emus.length}</b>apps in ${S.packs.length>1?`${S.packs.length} packs`:"list"}</div><div><b>${S.emus.filter(e=>e.on).length}</b>backed up</div></div>
        <div class="gact"><button class="btn small" id="packref">Refresh lists</button><button class="btn small primary" id="packadd">+ Add a pack</button></div></div>
      ${rows || `<p class="hint" style="margin:0">No packs yet. Add the standard Obtainium Emulation Pack or one of your own.</p>`}</div></details>`;
  $("#packref").onclick=()=>{ log("Fetching pack lists…"); setTimeout(()=>{ log(`Pack lists checked: no new apps`); toast("All lists are up to date"); },600); };
  $("#packadd").onclick=()=>openAdd("pack");
  document.querySelectorAll("[data-pask]").forEach(b=>b.onclick=()=>{ S.packConfirm=b.dataset.pask; renderPack(); });
  document.querySelectorAll("[data-pno]").forEach(b=>b.onclick=()=>{ S.packConfirm=null; renderPack(); });
  document.querySelectorAll("[data-prm]").forEach(b=>b.onclick=()=>{ S.packConfirm=null; removePack(b.dataset.prm); renderAll(); });
}

function renderChips(){
  const cats = Object.keys(CATS);
  const count = c => S.emus.filter(e=>c==="alle"||e.cat===c).length;
  let h = `<div class="toolbar"><label class="sr" for="catsel">Show</label><select id="catsel">${[["alle","All types"],...cats.map(c=>[c,CATS[c]])].map(([v,l])=>`<option value="${esc(v)}" ${S.filter===v?"selected":""}>${esc(l)} (${count(v)})</option>`).join("")}</select>`;
  h += `<button class="chip" id="onlyon" aria-pressed="${S.onlyOn}">Backed up only<span class="c">${S.emus.filter(e=>e.on).length}</span></button></div>`;
  $("#chips").innerHTML = h;
  $("#catsel").onchange=e=>{S.filter=e.target.value; renderChips(); renderEmus();};
  document.querySelectorAll("[data-f]").forEach(b=>b.addEventListener("click",()=>{S.filter=b.dataset.f; renderChips(); renderEmus();}));
  $("#onlyon").addEventListener("click",()=>{S.onlyOn=!S.onlyOn; renderChips(); renderEmus();});
}

function needsLine(e){
  const n=GAME_NEEDS[e.pkg]; if(!n) return "";
  if (n.text) return `<div class="needs"><span class="ck info">i</span><span>Needs ${esc(n.text)}.</span></div>`;
  const keys=n.titles.map(t=>ckey(t));
  const own=S.romFiles.filter(f=>f.sys===n.sys).map(f=>({f,p:parseFile(f)})).find(o=>keys.includes(o.p.key)&&!o.p.special.length&&!o.p.bad);
  const sysN=GI[n.sys]?sysLabel(GI[n.sys]):n.sys;
  return `<div class="needs"><span class="ck ${own?"ok":"warn"}">${own?"✓":"!"}</span><span>Needs your copy of <b>${n.titles.map(esc).join("</b> or <b>")}</b> (${esc(sysN)}). ${own?`You have it: <span class="mono">${esc(own.f.name)}</span>`:`Not in your collection yet.`}</span></div>`;
}
function emuRow(e){
  const upd = needsUpdate(e);
  const plats = e.plats.map(p=>`<span class="pill plat">${p}</span>`).join(" ");
  const status = !e.on ? "" : upd ? `<span class="pill warn">${esc(e.latest[0])} available</span>`
    : e.versions.length ? `<span class="pill ok">up-to-date</span>` : `<span class="pill warn">not downloaded yet</span>`;
  let slots = "";
  if (e.on){
    for (let i=0;i<S.keep;i++){
      const v = e.versions[i];
      slots += v ? `<div class="slot ${i===0?"new":""}" data-slot="${i}"><div class="v" title="${esc(v[0])}">${esc(v[0])}</div><div class="d">${fmtDate(v[1])}${i===0?" · newest":""}</div><div class="slotact"><button class="linkbtn" data-notes="${e.id}" data-v="${esc(v[0])}">What's new</button>${i>0?`<button class="linkbtn" data-roll="${e.id}" data-v="${esc(v[0])}">Install</button>`:""}</div></div>`
                 : `<div class="slot empty">free</div>`;
    }
    slots = `<div class="slots">${slots}</div>`;
  }
  return `<article class="emu ${e.on?"":"off"}" id="emu-${e.id}">
      <input type="checkbox" id="on-${e.id}" data-on="${e.id}" ${e.on?"checked":""} aria-label="${esc(e.name)} in backup">
      <div class="emu-head"><h3>${esc(e.name)} ${e.mine?`<span class="pill mine">custom</span>`:""} ${status}</h3>
        <div class="sys"><span>${esc(e.sys)}</span>${GAME_NEEDS[e.pkg]&&!GAME_NEEDS[e.pkg].text?` <span class="pill ${needsLine(e).includes('ck ok')?"ok":"warn"}">${needsLine(e).includes('ck ok')?"game ✓":"needs game"}</span>`:""}</div></div>
      <div class="emu-act">${e.on&&(upd||!e.versions.length)?`<button class="btn small ${upd?"primary":""}" data-upd="${e.id}">${e.versions.length?"Update":"Download"}</button>`:""}</div>
      <details class="more" data-k="emu-${e.id}" ${isOpen("emu-"+e.id)?"open":""}><summary>${e.on?`Versions & links`:`Details`}</summary><div class="moreinfo">
        <div class="sys">${plats} <span class="pill plat">${e.src}</span>${e.packs&&e.packs.length>1?` <span class="pill info">in ${e.packs.length} packs</span>`:e.packs&&e.packs[0]&&e.packs[0]!=="oep"?` <span class="pill info">${esc((S.packs.find(p=>p.id===e.packs[0])||{}).name||"")}</span>`:""}</div>
        ${needsLine(e)}
        <div class="links"><a href="${esc(e.dl)}" target="_blank" rel="noopener">Downloads</a>${e.site!==e.source?` · <a href="${esc(e.site)}" target="_blank" rel="noopener">Website</a>`:` · <a href="${esc(e.site)}" target="_blank" rel="noopener">GitHub</a>`}<span class="host mono">${esc(new URL(e.source).host+new URL(e.source).pathname.replace(/\/$/,""))}</span></div>
      ${slots}</div></details>
    </article>`;
}

function renderEmus(){
  const q = S.q.trim().toLowerCase();
  const list = S.emus.filter(e => (S.filter==="alle"||e.cat===S.filter) && (!S.onlyOn||e.on) && (!q || (e.name+" "+e.sys+" "+e.source).toLowerCase().includes(q)));
  let h = "";
  for (const c of Object.keys(CATS)){
    const items = list.filter(e=>e.cat===c).sort((a,b)=>(b.on-a.on)||a.name.localeCompare(b.name));
    if (!items.length) continue;
    h += `<div class="group"><h2>${CATS[c]} · ${items.length}</h2><div class="list" style="--keep:${S.keep}">${items.map(emuRow).join("")}</div></div>`;
  }
  $("#groups").innerHTML = h || `<div class="empty-state">Nothing found for “${esc(S.q)}”. Try a system name, like Switch or Dreamcast, or <button class="btn small" data-openadd="app">add the app yourself</button></div>`;
  document.querySelectorAll("[data-upd]").forEach(b=>b.addEventListener("click",()=>updateOne(b.dataset.upd)));
  document.querySelectorAll("[data-notes]").forEach(b=>b.onclick=()=>{ openAdd("notes", {app:b.dataset.notes, ver:b.dataset.v}); });
  document.querySelectorAll("[data-roll]").forEach(b=>b.onclick=()=>{ const e=S.emus.find(x=>x.id===b.dataset.roll); log(`${e.name}: going back to ${b.dataset.v}`); toast(`Installing ${e.name} ${b.dataset.v}. Confirm the install on your device. Your settings stay.`); });
  document.querySelectorAll("[data-on]").forEach(c=>c.addEventListener("change",()=>{
    const e=S.emus.find(x=>x.id===c.dataset.on); e.on=c.checked;
    log(`${e.name} ${e.on?"added to":"removed from"} backup`);
    renderStrip(); renderPack(); renderChips(); renderEmus();
  }));
  renderStrip();
}

// ---------------------------------------------------------------- BIOS: every system, with what it needs
const BIOS_MAP = Object.fromEntries(BIOSDB.map(e=>[e.id,e]));
S.biosHave = new Set(["psx/scph5501.bin","psx/scph5502.bin","nds/bios7.bin","nds/bios9.bin","gba/gba_bios.bin"]);
S.biosView = {filter:"mine", q:""};
const BIOS_EXTRA_NAMES = {switch:"Nintendo Switch", neogeo:"SNK Neo Geo", ps4:"Sony PlayStation 4"};
function biosFor(id){
  if (BIOS_MAP[id]) return BIOS_MAP[id];
  const base = id.replace(/-dl$/,"");
  if (BIOS_MAP[base]) return BIOS_MAP[base];
  return {id, st:"check", used:"MAME", why:"Usually played in MAME, which keeps any BIOS inside the romset.", files:[]};
}
function biosName(id){ return GI[id] ? sysLabel(GI[id]) : (BIOS_EXTRA_NAMES[id] || (BIOS_MAP[id]&&BIOS_MAP[id].name) || id); }
S.biosGoal = "all";   // "all" = collect everything · "needed" = only what emulators need
const isFree = f => !!f.free;
// a BIOS file you have; a folder on the list ("PPSSPP/", "dolphin-emu/Sys/") counts when anything is in it
function biosHas(id, f){
  if (f.endsWith("/")){
    // the folder itself, or the same folder one level deeper (PPSSPP/flash0/font/ counts for flash0/font/)
    const want=f.toLowerCase(), pre=(id+"/").toLowerCase();
    for (const h of S.biosHave){ const l=h.toLowerCase(); if (!l.startsWith(pre)) continue; const r=l.slice(pre.length);
      if (r.startsWith(want) || r.replace(/^[^/]+\//,"").startsWith(want)) return true; }
    return false;
  }
  if (S.biosHave.has(`${id}/${f}`)) return true;
  // a path on the list (GC/USA/IPL.bin): also where the emulator keeps it deeper (dolphin-emu/Sys/GC/USA/IPL.bin)
  if (f.includes("/")){ const want=("/"+f).toLowerCase(), pre=(id+"/").toLowerCase();
    for (const h of S.biosHave){ const l=h.toLowerCase(); if (l.startsWith(pre) && ("/"+l.slice(pre.length)).endsWith(want)) return true; } }
  return false;
}
// every file you have in bios/<system>/ that isn't one of the names on the list
function biosOther(id){ const e=biosFor(id), known=new Set(e.files.map(f=>f.f.toLowerCase())), pre=id+"/";
  return [...S.biosHave].filter(h=>h.startsWith(pre)).map(h=>h.slice(pre.length)).filter(n=>n&&!/\/./.test(n)&&!known.has(n.toLowerCase())&&!e.files.some(f=>f.f.includes("/")&&f.f.toLowerCase().startsWith(n.toLowerCase()))).sort((a,b)=>a.localeCompare(b)); }
// systems where any dump works (PS2: every console model has its own file name)
function biosAny(id){ const e=biosFor(id); if(!e.any) return []; const r=new RegExp(e.any,"i"); return biosOther(id).filter(n=>r.test(n)); }
function biosState(id){
  const e=biosFor(id), anyOk=biosAny(id).length>0||(biosFor(id).any&&biosFor(id).files.some(f=>f.one&&biosHas(id, f.f))), have=f=>biosHas(id, f.f)||(anyOk&&!!f.one);
  if (S.biosGoal==="all"){
    const dumps=e.files.filter(f=>!f.grp), frees=e.files.filter(f=>isFree(f)&&!have(f));
    if (!e.files.length) return e.st==="none" ? {k:"none", label:"No BIOS needed", cls:"ok"} : {k:"game", label:e.st==="game"?"Depends on the game":"Check the emulator", cls:"plat"};
    const missing=dumps.filter(f=>!have(f)).length, got=dumps.length-missing;
    if (missing) return {k:"missing", label:`${got} of ${dumps.length} · ${missing} to collect`, cls:e.st==="req"&&neededMissing(e,id)?"bad":"warn", missing, auto:frees.length};
    return {k:"ready", label:"Complete", cls:"ok", auto:frees.length};
  }
  if (e.st==="none") return {k:"none", label:"No BIOS needed", cls:"ok"};
  if (e.st==="game"||e.st==="check") return {k:"game", label:e.st==="game"?"Depends on the game":"Check the emulator", cls:"plat"};
  if (e.st==="opt"){ const base=e.files.filter(f=>!f.grp), n=base.filter(f=>!f.req&&have(f)).length; return {k:"opt", label:n?`Optional · ${n} of ${base.length}`:"Optional", cls:"info"}; }
  const m=neededMissing(e,id);
  return m ? {k:"missing", label:`Required · ${m} to collect`, cls:"bad", missing:m} : {k:"ready", label:"Required · ready", cls:"ok"};
}
function neededMissing(e,id){
  const anyOk=biosAny(id).length>0, have=f=>biosHas(id, f.f)||(anyOk&&!!f.one);
  const groups={}; let missing=0;
  e.files.forEach(f=>{ if(!f.req) return; if(f.one){ (groups[f.one] ||= []).push(f); } else if(!have(f)) missing++; });
  Object.values(groups).forEach(g=>{ if(!g.some(have)) missing++; });
  return missing;
}
const mySystemIds = () => [...new Set([...S.roms.map(r=>r.id), ...S.romFiles.map(f=>f.sys), ...BIOSDB.filter(e=>e.mine).map(e=>e.id)])];
function biosChip(id){ const s=biosState(id); if(s.k==="none") return `<span class="pill ok">no BIOS needed</span>`; if(s.k==="missing") return `<span class="pill ${s.cls}">BIOS: ${s.missing} to collect</span>`; if(s.k==="ready") return `<span class="pill ok">BIOS ${S.biosGoal==="all"?"complete":"ready"}</span>`; if(s.k==="opt") return `<span class="pill info">BIOS optional</span>`; return ""; }


function matchSystem(name){
  const n=name.trim().toLowerCase(); if(!n) return null;
  const pool=[...GAMEINDEX.filter(i=>!i.id.endsWith("-dl")).map(i=>({id:i.id, l:sysLabel(i).toLowerCase(), s:i.name.toLowerCase()})), ...Object.entries(BIOS_EXTRA_NAMES).map(([id,l])=>({id, l:l.toLowerCase(), s:l.toLowerCase()}))];
  const exact=pool.find(p=>p.id===n||p.s===n||p.l===n); if(exact) return exact.id;
  const hit=pool.filter(p=>p.l.includes(n)||n.includes(p.s)).sort((a,b)=>a.l.length-b.l.length)[0];
  return hit?hit.id:null;
}
function biosBoxHTML(id, label){
  if(!id) return "";
  const e=biosFor(id), s=biosState(id), nm=label||biosName(id);
  const req=e.files.filter(f=>f.req&&!f.one).map(f=>f.f), one=e.files.filter(f=>f.one).map(f=>f.f), opt=e.files.filter(f=>!f.req).map(f=>f.f);
  if (e.st==="none") return `<div class="verdict ok"><b>${esc(nm)}: no BIOS needed.</b> ${esc(e.why)}</div>`;
  if (e.st==="game"||e.st==="check") return `<div class="verdict maybe"><b>${esc(nm)}:</b> ${esc(e.why)}</div>`;
  if (e.st==="opt") return `<div class="verdict maybe"><b>${esc(nm)}: BIOS optional.</b> ${esc(e.why)} <span class="mono">${opt.map(esc).join(", ")}</span></div>`;
  return `<div class="verdict ${s.k==="ready"?"ok":"warn"}"><b>${esc(nm)} needs a BIOS${s.k==="ready"?", and you already have it.":"."}</b> ${req.length?`Required: <span class="mono">${req.map(esc).join(", ")}</span>. `:""}${one.length?`One of: <span class="mono">${one.map(esc).join(", ")}</span>. `:""}We create <span class="mono">bios/${esc(id)}/</span> for you${s.k==="ready"?"":" and add it to Still to collect"}.${e.free?` <a href="${esc(e.free.u)}" target="_blank" rel="noopener">${esc(e.free.t)}</a>.`:""}</div>`;
}

function renderBios(){
  const V=S.biosView, mine=mySystemIds();
  const allIds=[...new Set([...GAMEINDEX.map(i=>i.id).filter(id=>!id.endsWith("-dl")), ...BIOSDB.map(e=>e.id)])];
  const q=V.q.toLowerCase();
  let ids = V.filter==="mine" ? mine : V.filter==="todo" ? allIds.filter(id=>mine.includes(id) && biosState(id).k==="missing") : allIds;
  if (q) ids=ids.filter(id=>biosName(id).toLowerCase().includes(q));
  const mineMissing=mine.filter(id=>biosState(id).k==="missing"), mineReady=mine.filter(id=>biosState(id).k==="ready");
  const filesToCollect=mineMissing.reduce((a,id)=>a+biosState(id).missing,0);
  let h=`<div class="dupsum">
      <div class="nums"><div><b>${mineMissing.length}</b>${S.biosGoal==="all"?"not complete":"need a BIOS"}</div><div><b>${filesToCollect}</b>files to collect</div><div><b>${mineReady.length}</b>${S.biosGoal==="all"?"complete":"ready"}</div>${S.biosGoal==="all"?`<div><b>${mine.reduce((a,id)=>a+(biosState(id).auto||0),0)}</b>free to download</div>`:""}</div>
      <div class="prefs"><span style="font-weight:600">Collect:</span><div class="seg" role="group"><button data-bgoal="needed" aria-pressed="${S.biosGoal==="needed"}">Only what's needed</button><button data-bgoal="all" aria-pressed="${S.biosGoal==="all"}">Everything</button></div></div>
      <p class="hint" style="margin:0">${S.biosGoal==="all"?"Everything: every BIOS, firmware and extra file any emulator for that system can use, including other regions and optional extras. Free files (system software from Sony and others) you download yourself from the link; Emu Vault then checks them like the rest.":"Only what's needed: just the files without which the emulators won't start."}</p>
      <p class="hint">For every system we know which BIOS files the emulators expect, based on the list RetroArch uses. Put your own dumps in <span class="mono">${esc(S.dir)}/bios/&lt;system&gt;/</span>. The app checks each file by its fingerprint, so a file with a different name is still recognized.</p>
    </div>
    <div class="fbar" style="margin-top:12px">
      <input class="search" id="b-q" type="search" placeholder="Search a system" value="${esc(V.q)}" aria-label="Search a system">
      <div class="chips">${[["mine","Your systems",mine.length],["todo","Still to collect",mineMissing.length],["all","All systems",allIds.length]].map(([v,l,n])=>`<button class="chip" data-bf="${v}" aria-pressed="${V.filter===v}">${l}<span class="c">${n}</span></button>`).join("")}</div>
    </div>`;
  const order=[["missing","Still to collect"],["ready",S.biosGoal==="all"?"Complete":"Ready"],["opt","Optional"],["game","Depends on the game or emulator"],["none","No BIOS needed"]];
  if (!ids.length) h+=`<div class="empty-state" style="margin-top:10px">${V.filter==="todo"?"Nothing left to collect for your systems.":"No system found."}</div>`;
  for (const [k,title] of order){
    const list=ids.filter(id=>biosState(id).k===k).sort((a,b)=>biosName(a).localeCompare(biosName(b)));
    if (!list.length) continue;
    if (k==="none"||k==="game"){
      h+=`<div class="group" style="margin-top:14px"><h2>${title} · ${list.length}</h2><div class="sysgrid">${list.map(id=>{const e=biosFor(id); return `<div class="syscard"><span class="sn">${esc(biosName(id))}</span><span class="sc">${esc(e.why)}</span><span class="src">${esc(e.used)}</span></div>`;}).join("")}</div></div>`;
      continue;
    }
    h+=`<div class="group" style="margin-top:14px"><h2>${title} · ${list.length}</h2><div style="display:flex;flex-direction:column;gap:10px">`;
    for (const id of list){
      const e=biosFor(id), s=biosState(id), have=f=>biosHas(id, f.f);
      const other=biosOther(id), anyHits=new Set(biosAny(id)), sideRx=e.side?new RegExp(e.side,"i"):null;
      const otherBox=other.length?`<div class="onebox"><span class="lbl2">In this folder · ${other.length} other file${other.length===1?"":"s"}</span><div class="files">${other.map(n=>`<div class="frow"><span class="dot on" aria-label="present"></span><div><div class="fn">${esc(n)}</div><div class="note">${anyHits.has(n)?`${esc(e.anyLabel||"BIOS")}: counts, any one works`:sideRx&&sideRx.test(n)?esc(e.sideLabel):"kept here; not on the list, so not checked"}</div></div><span class="pill ${anyHits.has(n)?"ok":"plat"}">${anyHits.has(n)?"bios":sideRx&&sideRx.test(n)?"with bios":"other"}</span></div>`).join("")}</div></div>`:"";
      const oneGroups=[...new Set(e.files.filter(f=>f.one).map(f=>f.one))];
      const row=f=>`<div class="frow"><span class="dot ${have(f)?"on":""}" aria-label="${have(f)?"present":"missing"}"></span>
          <div><div class="fn">${esc(f.f)}</div>${f.note?`<div class="note">${esc(f.note)}</div>`:""}${f.md5?`<div class="note mono" title="MD5 fingerprint">md5 ${f.md5.slice(0,12)}…</div>`:""}</div>
          ${isFree(f)?`<span class="pill ${have(f)?"ok":"warn"}">${have(f)?"have it":"free download"}</span>`:`<span class="pill ${f.one?"warn":f.req?"warn":"plat"}">${f.one?(S.biosGoal==="all"?"region":"one of these"):f.req?"required":"extra"}</span>`}</div>`;
      h+=`<div class="sys-block" data-bios="${id}">
        <header><div><h3>${esc(biosName(id))} ${e.mine?`<span class="pill mine">custom</span>`:""}</h3><div class="used">For ${esc(e.used)}</div></div><span class="pill ${s.cls}">${s.label}</span></header>
        <p class="hint" style="margin:0">${esc(e.why)}${e.tip?` ${esc(e.tip)}`:""}</p>
        <div class="path">${esc(S.dir)}/bios/${id}/ ${locLink(`${S.dir}/bios/${id}/`)}</div>
        ${oneGroups.length?`<div class="onebox"><span class="lbl2">${e.any?"Example names · any one PS2 BIOS is enough, with any name":S.biosGoal==="all"?"One per region (one is enough to play)":"You need one of these"}</span><div class="files">${e.files.filter(f=>f.one).map(row).join("")}</div></div>`:""}
        ${e.files.some(f=>!f.one&&f.req&&!isFree(f))?`<div class="files">${e.files.filter(f=>!f.one&&f.req&&!isFree(f)).map(row).join("")}</div>`:""}
        ${e.files.some(f=>!f.req&&!isFree(f)&&!f.grp)?`<div class="onebox"><span class="lbl2">Extras</span><div class="files">${e.files.filter(f=>!f.req&&!isFree(f)&&!f.grp).map(row).join("")}</div></div>`:""}
        ${e.files.some(f=>f.grp==="lang")?(()=>{ const L=e.files.filter(f=>f.grp==="lang"), n=L.filter(have).length; return `<details class="onebox langbox" data-k="lang:${id}" ${S.ui.open.has("lang:"+id)?"open":""}><summary class="lbl2" style="cursor:pointer">Fonts for other languages · ${n?`${n} of ${L.length}`:L.length} · only for games in Japanese, Chinese, Korean, Arabic, Thai or Vietnamese</summary><div class="files">${L.map(row).join("")}</div></details>`; })():""}
        ${e.files.some(isFree)?`<div class="onebox"><span class="lbl2">Free download · get it yourself from the link, then drop it here</span><div class="files">${e.files.filter(isFree).map(row).join("")}</div><p class="hint" style="margin:0">${[...new Set(e.files.filter(isFree).map(f=>`<a href="${esc(f.free.u)}" target="_blank" rel="noopener">${esc(f.free.t)}</a>`))].join(" · ")}</p></div>`:""}
        ${otherBox}
        <div class="drop">Drop files here or <label for="bfi-${id}">choose files</label><input type="file" id="bfi-${id}" multiple hidden></div>
      </div>`;
    }
    h+=`</div></div>`;
  }
  $("#view-bios").innerHTML=h;
  document.querySelectorAll("[data-bf]").forEach(b=>b.onclick=()=>{V.filter=b.dataset.bf; renderBios();});
  document.querySelectorAll("[data-bgoal]").forEach(b=>b.onclick=()=>{S.biosGoal=b.dataset.bgoal; renderBios(); renderStrip(); renderRoms(); renderColl();});
  const qi=$("#b-q"); qi.oninput=()=>{V.q=qi.value; const p=qi.selectionStart; renderBios(); const n=$("#b-q"); n.focus(); n.setSelectionRange(p,p);};
  document.querySelectorAll("[data-bios]").forEach(el=>{
    const id=el.dataset.bios, e=biosFor(id), drop=el.querySelector(".drop");
    const take=files=>{
      let hit=0, miss=[];
      for (const file of files){ const nm=file.name.toLowerCase(), m=e.files.find(f=>f.f.toLowerCase()===nm) || e.files.find(f=>f.f.toLowerCase().endsWith("/"+nm) && !biosHas(id, f.f)) || e.files.find(f=>f.f.toLowerCase().endsWith("/"+nm)); if(m){ S.biosHave.add(`${id}/${m.f}`); if(file.path) EV.queue({kind:"copy", from:file.path, to:`${EV.root()}/bios/${id}/${m.f}`}); hit++; } else { miss.push(file.name); if(file.path){ S.biosHave.add(`${id}/${file.name}`); EV.queue({kind:"copy", from:file.path, to:`${EV.root()}/bios/${id}/${file.name}`}); } } }
      if (hit) log(`BIOS ${biosName(id)}: ${hit} file(s) added`);
      if (miss.length){ const any=biosAny(id); toast(`${miss.length} file${miss.length===1?"":"s"} put in bios/${id}/ with ${miss.length===1?"its":"their"} own name${e.any&&any.length?` · counts as ${e.anyLabel||"BIOS"}`:": not a name on the list, shown under In this folder"}`); log(`BIOS ${biosName(id)}: ${miss.join(", ")} put in bios/${id}/`); }
      else if (hit) toast(`${hit} file(s) added to ${biosName(id)}`);
      renderBios(); renderStrip(); renderRoms(); renderColl();
    };
    el.querySelector("input").addEventListener("change",ev=>take(ev.target.files));
    drop.addEventListener("dragover",ev=>{ev.preventDefault(); drop.classList.add("hover");});
    drop.addEventListener("dragleave",()=>drop.classList.remove("hover"));
    drop.addEventListener("drop",ev=>{ev.preventDefault(); drop.classList.remove("hover"); take(ev.dataTransfer.files);});
  });
}

// ---------------------------------------------------------------- ROMs: regio's, dubbels, bestanden
S.romView = "overzicht";
S.regions = ["US","EU","JP"];
S.dupIgnored = new Set();
S.dupKeep = {};
S.lastMove = null;
S.trash = [];
S.fb = {sys:"snes", filter:"alles", q:"", sel:new Set(), open:null, confirm:false};

// Regiocodes: [code, NL-naam, No-Intro/Redump voluit, GoodTools kort, TOSEC]
const CODE_TABLE = [
  ["US","USA","USA","U","US"],["EU","Europe","Europe","E","EU"],["JP","Japan","Japan","J","JP"],["W","World","World","W","—"],
  ["DE","Germany","Germany","G","DE"],["FR","France","France","F","FR"],["ES","Spain","Spain","S","ES"],["IT","Italy","Italy","I","IT"],
  ["NL","Netherlands","Netherlands","NL","NL"],["UK","United Kingdom","United Kingdom","UK","GB"],["AU","Australia","Australia","A","AU"],
  ["KR","Korea","Korea","K","KR"],["CN","China","China","C","CN"],["BR","Brazil","Brazil","B","BR"],["AS","Asia","Asia","As","AS"]];
const REG_NAMES = Object.fromEntries(CODE_TABLE.map(r=>[r[0],r[1]]));
const REG_MAP = {};
CODE_TABLE.forEach(([c,,full,short,tosec])=>{ REG_MAP[full.toLowerCase()]=[c]; REG_MAP[short.toLowerCase()]=[c]; if(tosec!=="—") REG_MAP[tosec.toLowerCase()]=[c]; });
Object.assign(REG_MAP, {ue:["US","EU"], ju:["JP","US"], je:["JP","EU"], jue:["JP","US","EU"], america:["US"], eur:["EU"], jpn:["JP"], "united kingdom":["UK"]});
const TAG_TABLE = [
  ["(USA), (Europe), (Japan)…","Region, full name (No-Intro and Redump)"],["(U), (E), (J), (UE), (JUE)","Region, short (GoodTools)"],
  ["(En,Fr,De)","Languages in the game"],["(Rev 1), (v1.1)","Revision: higher is newer"],["(Disc 1)","Disc of a multi-disc game"],
  ["[!]","Verified: good copy"],["[b], [b1]","Bad copy"],["[h], (Hack)","Modified version"],
  ["[T+Eng], [T-En]","Fan translation"],["(Beta), (Proto), (Demo)","Test version"],["(Unl)","Unofficial game"],["[a], [o], [t]","Alternate, overdump, with cheats"]];
const EXT_RANK = {".chd":0,".sfc":0,".md":0,".gba":0,".gb":0,".z64":0,".nds":0,".cue":1,".iso":1,".smc":2,".bin":2,".zip":3};

S.romFiles = [
  ["snes","Super Mario World (USA).sfc",0.5,"a1"],["snes","super mario world.smc",0.5,"a1"],["snes","Super Mario World (Europe) (Rev 1).sfc",0.5,"a2"],["snes","Super Mario World (Japan).sfc",0.5,"a3"],
  ["snes","The Legend of Zelda - A Link to the Past (USA).sfc",1,"b1"],["snes","Legend of Zelda, The - A Link to the Past (Europe).sfc",1,"b2"],["snes","Zelda - A Link to the Past (E) [!].smc",1,"b2"],
  ["snes","Donkey Kong Country (USA) (Rev 2).sfc",4,"c1"],["snes","Donkey Kong Country (USA) (Rev 1).sfc",4,"c2"],["snes","Donkey Kong Country (Europe).sfc",4,"c3"],
  ["snes","Chrono Trigger (USA).sfc",4,"d1"],["snes","Chrono Trigger (Japan) [T-En by Aeon Genesis].sfc",4,"d2"],
  ["snes","Super Mario All-Stars (Europe) (En,Fr,De).sfc",2,"o1"],["snes","Super Mario All-Stars (USA).sfc",2,"o2"],
  ["snes","Super Metroid (Japan, USA) (En,Ja).sfc",3,"e1"],["snes","rom1.sfc",1,"zz"],
  ["gb","Pokemon - Red Version (USA, Europe) (SGB Enhanced).gb",1,"f1"],["gb","Pokémon Red.gb",1,"f1"],["gb","Tetris (World) (Rev 1).gb",0.1,"g1"],
  ["gba","Metroid Fusion (USA).gba",8,"h1"],["gba","Metroid Fusion (Europe) (En,Fr,De,Es,It).gba",8,"h2"],["gba","Metroid Fusion (Japan).gba",8,"h3"],["gba","Metroid Fusion (U) [b1].gba",8,"h9"],
  ["gba","Pokemon - Emerald Version (USA, Europe).gba",16,"i1"],["gba","Advance Wars (Europe).gba",8,"aw1"],["gba","Mario Kart - Super Circuit (Europe).gba",8,"mk1"],["gba","Pokemon Emerald (Germany).gba",16,"i2"],
  ["megadrive","Sonic The Hedgehog (USA, Europe).md",0.5,"j1"],["megadrive","sonic_the_hedgehog.bin",0.5,"j1"],["megadrive","Sonic the Hedgehog (Japan, Korea).md",0.5,"j2"],["megadrive","streets of rage 2.bin",2,"n1"],
  ["psx","Final Fantasy VII (Europe) (Disc 1).chd",420,"k1"],["psx","Final Fantasy VII (Europe) (Disc 2).chd",410,"k2"],["psx","Final Fantasy VII (Europe) (Disc 3).chd",400,"k3"],
  ["psx","Final Fantasy VII (USA) (Disc 1).chd",418,"k4"],["psx","Final Fantasy VII (USA) (Disc 2).chd",408,"k5"],["psx","Final Fantasy VII (USA) (Disc 3).chd",399,"k6"],
  ["psx","Crash Bandicoot (Europe).chd",380,"l1"],["psx","Crash Bandicoot (USA).chd",378,"l2"],
  ["psx","Metal Gear Solid (Europe) (Disc 1).chd",470,"m1"],["ps2","Xenosaga Episode III - Also sprach Zarathustra (USA) (Disc 1).chd",3900,"x1"],["ps2","Xenosaga Episode III - Also sprach Zarathustra (USA) (Disc 2).chd",3800,"x2"],["psx","Metal Gear Solid - Integral (Japan) (Disc 1).chd",480,"m2"],
].map(([sys,name,mb,hash],i)=>({id:"f"+i, sys, name, mb, hash}));

// Nagebootste databank (zoals No-Intro/Redump): vingerafdruk -> officiële naam
const DAT = {n1:"Streets of Rage 2 (USA).md"};
S.romFiles.forEach(f=>{ if(!DAT[f.hash] && /\((USA|Europe|Japan|World|Germany)/.test(f.name) && !/\[/.test(f.name)) DAT[f.hash]=f.name; });
const sha1 = s => { let out=""; for(let k=0;k<5;k++){ let h=2166136261^(k*16777619); for(const c of s+":"+k){ h=Math.imul(h^c.charCodeAt(0),16777619); h^=h>>>13; h=Math.imul(h,0x5bd1e995); h^=h>>>15; } out+=(h>>>0).toString(16).padStart(8,"0"); } return out; };

function parseRom(name){
  const ext = (name.match(/\.[^.]+$/)||[""])[0].toLowerCase();
  let base = name.slice(0, name.length-ext.length);
  const round = [...base.matchAll(/\(([^)]*)\)/g)].map(m=>m[1].trim());
  const square = [...base.matchAll(/\[([^\]]*)\]/g)].map(m=>m[1].trim());
  base = base.replace(/\([^)]*\)|\[[^\]]*\]/g," ");
  let shortCode=false, regions=[], rev=0, disc=0, special=[], verified=false, bad=false, langs="";
  for (const t of round){
    const tl=t.toLowerCase(), parts=tl.split(/\s*,\s*/);
    let m;
    if (/^[A-Z][a-z](,[A-Z][a-z])*$/.test(t.replace(/\s/g,""))){ langs=t.replace(/\s/g,""); continue; }
    if (parts.every(p=>REG_MAP[p])){ parts.forEach(p=>regions.push(...REG_MAP[p])); if(parts.some(p=>p.length<=3 && p===p.toLowerCase() && t===t.toUpperCase() && p.length<3 && !["us","eu","jp"].includes(p))) shortCode=true; if(parts.some(p=>p.length===1)) shortCode=true; continue; }
    if ((m=tl.match(/^rev\s*([0-9a-z]+)$/))){ rev = isNaN(+m[1]) ? m[1].charCodeAt(0)-96 : +m[1]; continue; }
    if ((m=tl.match(/^v(\d+(?:\.\d+)?)$/))){ rev = +m[1]; continue; }
    if ((m=tl.match(/^(disc|disk|cd)\s*(\d+)/))){ disc=+m[2]; continue; }
    if (/^(hack|beta|proto|demo|sample|unl|pirate)/.test(tl)) special.push(t);
  }
  for (const t of square){
    const tl=t.toLowerCase();
    if (tl==="!") verified=true;
    else if (/^b\d*$/.test(tl)) bad=true;
    else if (/^(t[-+]|h\d*$|hack)/.test(tl)) special.push(t);
  }
  let title = base.replace(/_/g," ").replace(/\s+/g," ").trim();
  title = title.replace(/^(.*?),\s*(The|A|An|De|Het|Le|La|Les|Die|Der)\b(.*)$/i, "$2 $1$3");
  let key = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[&+]/g," and ").replace(/\bin one\b/g,"in 1")
    .replace(/[^a-z0-9]+/g," ").replace(/\b(the|version|edition)\b/g," ").replace(/\s+/g," ").trim();
  if (special.length) key += " #" + special.join("|").toLowerCase();
  return {shortCode, ext, title, key, regions:[...new Set(regions)], rev, disc, special, verified, bad, langs};
}
function parseFile(f){
  const p = parseRom(f.name), dat = DAT[f.hash];
  p.datName = dat || ""; p.fp = sha1(f.hash);
  if (dat && !p.regions.length){ const q=parseRom(dat); p.regions=q.regions; p.langs ||= q.langs; p.fromDat=true; if(!p.special.length) p.key=q.key; p.title=q.title; }
  return p;
}

function dice(a,b){
  const bg=s=>{const o=[];for(let i=0;i<s.length-1;i++)o.push(s.slice(i,i+2));return o;};
  const A=bg(a.replace(/ /g,"")), B=bg(b.replace(/ /g,"")); if(!A.length||!B.length) return 0;
  const m=new Map(); A.forEach(x=>m.set(x,(m.get(x)||0)+1)); let hit=0; B.forEach(x=>{if(m.get(x)>0){hit++;m.set(x,m.get(x)-1);}});
  return 2*hit/(A.length+B.length);
}
const REG_GROUP = {US:"US", EU:"EU", JP:"JP", W:"W", DE:"EU", FR:"EU", ES:"EU", IT:"EU", NL:"EU", UK:"EU", AU:"EU", KR:"OV", CN:"OV", AS:"OV", BR:"OV"};
const GROUP_NAMES = {US:"USA", EU:"Europe", JP:"Japan", W:"World", OV:"Other"};
function regionRank(regs){
  if (!regs.length) return 50;
  return Math.min(...regs.map(r=>{ const g=REG_GROUP[r]||"OV"; if(g==="W") return 0.5; const i=S.regions.indexOf(g); return (i>=0?i:10) + (g!==r?0.2:0); }));
}
let regionRule = () => S.regions.map((r,i)=>i===0?`${GROUP_NAMES[r]} first`:`then ${GROUP_NAMES[r]}`).join(", ");

function findDups(){
  const files = S.romFiles.map(f=>({...f, p:parseFile(f)}));
  const bySys = {}; files.forEach(f=>(bySys[f.sys] ||= []).push(f));
  const groups = [];
  for (const [sys, list] of Object.entries(bySys)){
    const byKey = {}; list.forEach(f=>(byKey[f.p.key] ||= []).push(f));
    const keys=Object.keys(byKey), parent=Object.fromEntries(keys.map(k=>[k,k])), fuzzy=new Set();
    const find=k=>parent[k]===k?k:(parent[k]=find(parent[k]));
    const hk={}; list.forEach(f=>{ if(hk[f.hash] && find(hk[f.hash])!==find(f.p.key)) parent[find(f.p.key)]=find(hk[f.hash]); hk[f.hash] ||= f.p.key; });
    for (let i=0;i<keys.length;i++) for (let j=i+1;j<keys.length;j++){
      const a=keys[i], b=keys[j];
      if (a.includes("#")||b.includes("#")||find(a)===find(b)) continue;
      if (a.split(" ").slice(0,2).join(" ")===b.split(" ").slice(0,2).join(" ") && dice(a,b)>=0.72){ const r=find(a); parent[find(b)]=r; fuzzy.add(r); }
    }
    const clusters={};
    keys.forEach(k=>{ const r=find(k); (clusters[r] ||= {files:[],fuzzy:false}); clusters[r].files.push(...byKey[k]); if(fuzzy.has(r)) clusters[r].fuzzy=true; });
    for (const [root,c] of Object.entries(clusters)){
      const vmap={};
      c.files.forEach(f=>{ const vk=f.name.toLowerCase().replace(/\s*\((disc|disk|cd)\s*\d+[^)]*\)/,""); (vmap[vk] ||= {id:vk, files:[], p:f.p}).files.push(f); });
      const variants=Object.values(vmap); if (variants.length<2) continue;
      const owner={}; variants.forEach(v=>v.files.forEach(f=>(owner[f.hash] ||= []).push(v)));
      const shared=v=>v.files.every(f=>owner[f.hash].length>1);
      const kind = c.fuzzy ? "maybe" : variants.every(shared) ? "same" : variants.some(shared) ? "mixed" : "region";
      variants.forEach(v=>{
        v.mb=v.files.reduce((a,f)=>a+f.mb,0); v.discs=v.files.filter(f=>f.p.disc).length;
        v.named=v.p.regions.length>0 && !v.p.fromDat;
        v.dupOf = shared(v) ? owner[v.files[0].hash].find(o=>o!==v) : null;
        v.score=[v.p.bad?1:0, v.named?0:1, regionRank(v.p.regions), -v.p.rev, v.p.shortCode?1:0, v.p.verified?0:1, Math.min(...v.files.map(f=>EXT_RANK[f.p.ext]??4)), v.files[0].name.length];
      });
      variants.sort((a,b)=>{for(let i=0;i<a.score.length;i++) if(a.score[i]!==b.score[i]) return a.score[i]-b.score[i]; return 0;});
      groups.push({key:sys+"::"+root, sys, title:variants[0].p.title, kind, variants});
    }
  }
  const order={same:0,mixed:0,region:1,maybe:2};
  groups.sort((a,b)=>order[a.kind]-order[b.kind]||a.title.localeCompare(b.title));
  return groups;
}
function keepSet(g){
  if (S.dupKeep[g.key]) return S.dupKeep[g.key];
  if (g.kind==="maybe") return new Set(g.variants.map(v=>v.id));
  return new Set([g.variants[0].id]);
}
const sysName = id => (S.roms.find(r=>r.id===id)||{name:(typeof GI!=="undefined"&&GI[id])?sysLabel(GI[id]):id}).name;
const flags = (regs, best) => regs.length ? regs.map(r=>`<span class="flag ${best?"best":""}" title="${REG_NAMES[r]||r}${REG_GROUP[r]&&REG_GROUP[r]!==r?` (counts as ${GROUP_NAMES[REG_GROUP[r]]})`:""}">${r}</span>`).join(" ") : `<span class="flag q" title="No region in the name">?</span>`;

// ---- regio-regel (gedeeld door Dubbels en Instellingen)
function regionRuleHTML(){
  const rows = S.regions.map((r,i)=>`<div class="rrow">
      <span class="rn">${i+1}</span><span class="flag">${r}</span><b>${GROUP_NAMES[r]}</b>
      <span class="muted rw">${i===0?"first choice":`if there is no ${S.regions.slice(0,i).map(x=>GROUP_NAMES[x]).join(" or ")} version`}</span>
      <span class="rbtn"><button data-rup="${i}" aria-label="Move ${GROUP_NAMES[r]} up" ${i===0?"disabled":""}>▲</button><button data-rdown="${i}" aria-label="Move ${GROUP_NAMES[r]} down" ${i===S.regions.length-1?"disabled":""}>▼</button></span></div>`).join("");
  return `<div class="rule">${rows}
    <div class="rrow fixed"><span class="rn">+</span><span class="flag">W</span><b>World</b><span class="muted rw">always counts as your first choice: one version for every country</span><span></span></div>
    <div class="rrow fixed"><span class="rn">+</span><span class="flag q">?</span><b>No region</b><span class="muted rw">we look the region up in the database; if that fails, it comes last</span><span></span></div>
    <p class="hint">In plain words: <b>${regionRule()}</b>.</p>
    <p class="hint">Versions for a single country, like Germany or France, count as Europe. A file marked <span class="mono">(USA, Europe)</span> counts for both. Korea, China and Brazil fall under Other and come after these three.</p></div>`;
}
function bindRegionRule(after){
  const go=()=>{ S.dupKeep={}; after(); };
  document.querySelectorAll("[data-rup]").forEach(b=>b.onclick=()=>{const i=+b.dataset.rup;[S.regions[i-1],S.regions[i]]=[S.regions[i],S.regions[i-1]];go();});
  document.querySelectorAll("[data-rdown]").forEach(b=>b.onclick=()=>{const i=+b.dataset.rdown;[S.regions[i+1],S.regions[i]]=[S.regions[i],S.regions[i+1]];go();});
}
function codesHTML(){
  const main = [["US","USA","(USA)","(U)","(US)"],["EU","Europe","(Europe)","(E)","(EU)"],["JP","Japan","(Japan)","(J)","(JP)"],["W","World","(World)","(W) (JUE)","—"]];
  return `<details class="codes"><summary>Which region codes do we recognize?</summary>
    <p class="hint">Really just four: the same as on Wikipedia (JP, NA, EU), plus World. In ROM names, NA is called <span class="mono">USA</span>. Each code can be written three ways, and we know all three.</p>
    <div class="tscroll"><table><thead><tr><th>Region</th><th>Full name</th><th>Short</th><th>Code</th></tr></thead>
    <tbody>${main.map(c=>`<tr><td><span class="flag">${c[0]}</span> ${c[1]}</td><td class="mono">${c[2]}</td><td class="mono">${c[3]}</td><td class="mono">${c[4]}</td></tr>`).join("")}</tbody></table></div>
    <p class="hint"><b>No region in the name?</b> Then we look the file up by its fingerprint in the No-Intro and Redump databases. They know the region of almost every game.</p>
    <details class="codes inner"><summary>All codes and tags</summary>
      <div class="tscroll"><table><thead><tr><th>Country</th><th>Full name</th><th>Short</th><th>Counts as</th></tr></thead>
      <tbody>${CODE_TABLE.filter(c=>!["US","EU","JP","W"].includes(c[0])).map(c=>`<tr><td>${c[1]}</td><td class="mono">(${c[2]})</td><td class="mono">(${c[3]})</td><td>${GROUP_NAMES[REG_GROUP[c[0]]]}</td></tr>`).join("")}</tbody></table></div>
      <div class="tscroll"><table><thead><tr><th>Tag</th><th>Meaning</th></tr></thead><tbody>${TAG_TABLE.map(t=>`<tr><td class="mono">${t[0]}</td><td>${t[1]}</td></tr>`).join("")}</tbody></table></div>
    </details>
  </details>`;
}

// ---- dubbels
function renderDups(){
  const groups=findDups(), active=groups.filter(g=>!S.dupIgnored.has(g.key));
  let moveFiles=0, moveMb=0;
  active.forEach(g=>{const k=keepSet(g); g.variants.forEach(v=>{if(!k.has(v.id)){moveFiles+=v.files.length; moveMb+=v.mb;}});});
  const cnt=k=>groups.filter(g=>g.kind===k||(k==="same"&&g.kind==="mixed")).length;
  let h=`<div class="dupsum">
    <div class="nums"><div><b>${groups.length}</b>games with duplicates</div><div><b>${moveFiles}</b>files to clean up</div><div><b>${size(Math.round(moveMb))}</b>to free up</div></div>
    <div class="prefs"><span><b>Rule:</b> ${regionRule()}.</span><button class="linkbtn" id="to-rule">Change</button></div>
    <div class="chips"><span class="kind same">Same file · ${cnt("same")}</span><span class="kind region">Different region or language · ${cnt("region")}</span><span class="kind maybe">Looks alike, check yourself · ${cnt("maybe")}</span></div>
    <p class="hint">Not sure? Open <b>Files</b>, tick two files and choose <b>Compare</b>. You will see whether they are really the same or have a different language.</p></div>`;
  if (!groups.length) h+=`<div class="empty-state" style="margin-top:10px">No duplicates found. Nice and tidy!</div>`;
  h+=`<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">`;
  for (const g of groups){
    const ign=S.dupIgnored.has(g.key), k=keepSet(g);
    const why={same:"Same content, different file name.",mixed:"Same content under another name, plus other regions.",region:"Same game, different region, language or version.",maybe:"The names look alike, but it may be a different game. We leave everything in place until you decide."}[g.kind];
    const kl={same:["same","Same file"],mixed:["same","Same file"],region:["region","Other region"],maybe:["maybe","Looks alike"]}[g.kind];
    h+=`<article class="dgroup ${ign?"ignored":""}">
      <header><div><h3>${esc(g.title)}</h3><div class="why">${esc(sysName(g.sys))} · ${why}</div></div><span class="kind ${kl[0]}">${kl[1]}</span></header>
      ${!ign&&typeof EV!=="undefined"&&EV.discHint?EV.discHint(g):""}
      ${ign?`<div class="gact"><span class="muted" style="font-size:13px">Ignored, these are not duplicates.</span><button class="linkbtn" data-unign="${esc(g.key)}">Review anyway</button></div>`:
      g.variants.map((v,i)=>{
        const keep=k.has(v.id);
        const tags=[flags(v.p.regions, i===0&&g.kind!=="maybe"), v.p.fromDat?`<span>region from database</span>`:"", v.p.langs?`<span>languages ${esc(v.p.langs)}</span>`:"", v.p.rev?`<span>Rev ${v.p.rev}</span>`:"", v.p.verified?`<span>[!] verified</span>`:"", v.p.bad?`<span class="badtxt">bad dump</span>`:"", v.discs>1?`<span>${v.discs} discs</span>`:"", `<span>${size(Math.max(1,Math.round(v.mb)))}</span>`, v.dupOf?`<span>same content as ${esc(v.dupOf.files[0].name)}</span>`:""].filter(Boolean).join(" ");
        const nm=v.discs>1?v.files[0].name.replace(/\(Disc 1\)/,`(Disc 1–${v.discs})`):v.files[0].name;
        return `<label class="vrow ${keep?"keep":""}"><input type="checkbox" data-g="${esc(g.key)}" data-v="${esc(v.id)}" ${keep?"checked":""}>
          <span><span class="fn">${esc(nm)}</span><span class="meta">${tags} ${locLink(romPath(g.sys, v.files[0].name))}</span></span><span class="dest ${keep?"stay":"go"}">${keep?"keep":"→ _duplicates"}</span></label>`;
      }).join("")+`<div class="gact">${g.kind!=="maybe"?`<button class="linkbtn" data-keepall="${esc(g.key)}">Keep all versions</button>`:`<button class="linkbtn" data-keepbest="${esc(g.key)}">Keep only the best</button>`}<button class="linkbtn" data-ign="${esc(g.key)}">Not duplicates</button><button class="linkbtn" data-cmp="${esc(g.key)}">Compare in Files</button></div>`}
    </article>`;
  }
  h+=`</div>`;
  if (moveFiles) h+=`<div class="sticky-act"><span>${moveFiles} files · ${size(Math.round(moveMb))} to <span class="mono">_duplicates</span></span><button class="btn primary" id="dup-go">Clean up</button></div>`;
  else if (S.lastMove) h+=`<div class="sticky-act"><span>${S.lastMove.length} files are in _duplicates.</span><button class="btn" id="dup-undo">Undo</button></div>`;
  return h;
}
function moveToTrash(files, why){
  files.forEach(f=>{ S.romFiles=S.romFiles.filter(x=>x.id!==f.id); S.trash.push({...f, why}); const r=S.roms.find(x=>x.id===f.sys); if(r){r.n=Math.max(0,r.n-1); r.mb=Math.max(0,Math.round(r.mb-f.mb));} });
}
function restore(ids){
  const back=S.trash.filter(f=>ids.includes(f.id));
  S.trash=S.trash.filter(f=>!ids.includes(f.id));
  back.forEach(({why,...f})=>{ S.romFiles.push(f); const r=S.roms.find(x=>x.id===f.sys); if(r){r.n++; r.mb=Math.round(r.mb+f.mb);} });
  return back.length;
}
function bindDups(){
  const groups=findDups(), G=Object.fromEntries(groups.map(g=>[g.key,g])), re=()=>renderRoms();
  $("#to-rule").onclick=()=>{ document.querySelector('.tab[data-tab="set"]').click(); setTimeout(()=>$("#rule-sec")?.scrollIntoView({block:"start"}),30); };
  document.querySelectorAll("[data-v]").forEach(c=>c.onchange=()=>{
    const g=G[c.dataset.g], k=new Set(keepSet(g)); c.checked?k.add(c.dataset.v):k.delete(c.dataset.v);
    if(!k.size){ toast("Keep at least one version of every game."); c.checked=true; return; }
    S.dupKeep[g.key]=k; re();
  });
  document.querySelectorAll("[data-keepall]").forEach(b=>b.onclick=()=>{const g=G[b.dataset.keepall]; S.dupKeep[g.key]=new Set(g.variants.map(v=>v.id)); re();});
  document.querySelectorAll("[data-keepbest]").forEach(b=>b.onclick=()=>{const g=G[b.dataset.keepbest]; S.dupKeep[g.key]=new Set([g.variants[0].id]); re();});
  document.querySelectorAll("[data-ign]").forEach(b=>b.onclick=()=>{S.dupIgnored.add(b.dataset.ign); log(`Not a duplicate: ${G[b.dataset.ign].title}`); re();});
  document.querySelectorAll("[data-unign]").forEach(b=>b.onclick=()=>{S.dupIgnored.delete(b.dataset.unign); re();});
  document.querySelectorAll("[data-cmp]").forEach(b=>b.onclick=()=>{
    const g=G[b.dataset.cmp]; S.fb.sys=g.sys; S.fb.filter="alles"; S.fb.q=""; S.fb.open=null; S.fb.confirm=false;
    S.fb.sel=new Set(g.variants.slice(0,2).map(v=>v.files[0].id)); S.romView="bestanden"; re();
  });
  const go=$("#dup-go"); if(go) go.onclick=()=>{
    const moved=[]; groups.filter(g=>!S.dupIgnored.has(g.key)).forEach(g=>{const k=keepSet(g); g.variants.forEach(v=>{if(!k.has(v.id)) moved.push(...v.files);});});
    moveToTrash(moved,"dubbel"); S.lastMove=moved.map(f=>f.id); S.dupKeep={};
    log(`${moved.length} duplicate ROM(s) moved to _duplicates`); toast(`${moved.length} files moved to _duplicates`); re(); renderStrip();
  };
  const un=$("#dup-undo"); if(un) un.onclick=()=>{ const n=restore(S.lastMove); S.lastMove=null; log(`${n} ROM(s) restored`); toast("Restored"); re(); renderStrip(); };
}

// ---- bestandsbeheer
function fileStatus(f, groups){
  if (f.p.bad) return ["bad","bad dump"];
  if (f.p.special.some(s=>/^t[-+]/i.test(s))) return ["info","translation"];
  if (f.p.special.length) return ["info","hack or test"];
  const g=groups.find(g=>g.variants.some(v=>v.files.some(x=>x.id===f.id)));
  if (g){ const v=g.variants.find(v=>v.files.some(x=>x.id===f.id)); if(v.dupOf) return ["same","same content"]; if(g.kind==="maybe") return ["maybe","looks alike"]; return ["region","other region"]; }
  if (!f.p.regions.length) return ["q","unknown"];
  return ["ok","unique"];
}
function compareHTML(a, b){
  const same=a.hash===b.hash, sameGame=a.p.key===b.p.key;
  const row=(l,x,y,eq)=>`<tr><th>${l}</th><td>${x}</td><td>${y}</td><td>${eq===undefined?"":eq?`<span class="eq">same</span>`:`<span class="ne">different</span>`}</td></tr>`;
  const reg=f=>f.p.regions.length?f.p.regions.map(r=>REG_NAMES[r]||r).join(", ")+(f.p.fromDat?" (database)":""):"unknown";
  const diffs=[]; if(reg(a)!==reg(b)) diffs.push(`region (${reg(a)} vs ${reg(b)})`); if((a.p.langs||"")!==(b.p.langs||"")) diffs.push(`languages (${a.p.langs||"not listed"} vs ${b.p.langs||"not listed"})`); if(a.p.rev!==b.p.rev) diffs.push(`revision (${a.p.rev||"none"} vs ${b.p.rev||"none"})`);
  const verdict = same ? `<div class="verdict ok"><b>Exactly the same file.</b> The fingerprint is identical; only the name differs. One of the two can go.</div>`
    : sameGame ? `<div class="verdict warn"><b>Same game, but a different version.</b> The difference is the ${diffs.join(" and ")||"content itself (a different dump)"}. Keep both if you want to keep that ${diffs.some(d=>d.startsWith("languages"))?"language":"version"}.</div>`
    : `<div class="verdict maybe"><b>Two different games.</b> The names look alike, but the database lists them as separate titles. These are not duplicates.</div>`;
  return `<div class="cmp"><h3>Compare</h3>${verdict}<div class="tscroll"><table>
    <thead><tr><th></th><th>File 1</th><th>File 2</th><th></th></tr></thead><tbody>
    ${row("Name",`<span class="mono">${esc(a.name)}</span>`,`<span class="mono">${esc(b.name)}</span>`,a.name===b.name)}
    ${row("Fingerprint",`<span class="mono fp">${a.p.fp.slice(0,12)}…</span>`,`<span class="mono fp">${b.p.fp.slice(0,12)}…</span>`,same)}
    ${row("Database",esc(a.p.datName||"not found"),esc(b.p.datName||"not found"),!!a.p.datName&&a.p.datName===b.p.datName)}
    ${row("Region",reg(a),reg(b),reg(a)===reg(b))}
    ${row("Languages",esc(a.p.langs||"not listed"),esc(b.p.langs||"not listed"),(a.p.langs||"")===(b.p.langs||""))}
    ${row("Revision",a.p.rev||"—",b.p.rev||"—",a.p.rev===b.p.rev)}
    ${row("Size",size(Math.max(1,Math.round(a.mb))),size(Math.max(1,Math.round(b.mb))),a.mb===b.mb)}
    </tbody></table></div><button class="linkbtn" id="cmp-close">Close</button></div>`;
}
function renderFiles(){
  const fb=S.fb, groups=findDups();
  const all=S.romFiles.map(f=>({...f,p:parseFile(f)}));
  const systems=[...new Set([...S.romFiles,...S.trash].map(f=>f.sys))];
  if (!systems.includes(fb.sys)) fb.sys=systems[0]||"";
  const inSys=all.filter(f=>f.sys===fb.sys), trash=S.trash.filter(f=>f.sys===fb.sys).map(f=>({...f,p:parseFile(f)}));
  const st=f=>fileStatus(f,groups)[0];
  const FILT=[["alles","All",inSys.length],["dubbel","Duplicates",inSys.filter(f=>["same","region","maybe"].includes(st(f))).length],["taal","Other language",inSys.filter(f=>f.p.langs&&groups.some(g=>g.variants.some(v=>v.files.some(x=>x.id===f.id)))).length],["onbekend","No region",inSys.filter(f=>!f.p.regions.length||f.p.fromDat).length],["speciaal","Translations, hacks, bad dumps",inSys.filter(f=>["info","bad"].includes(st(f))).length],["prullenbak","_duplicates",trash.length]];
  const q=fb.q.toLowerCase();
  let list = fb.filter==="prullenbak" ? trash : inSys.filter(f=>{
    const s=st(f);
    return fb.filter==="alles" || (fb.filter==="dubbel"&&["same","region","maybe"].includes(s)) || (fb.filter==="taal"&&f.p.langs&&groups.some(g=>g.variants.some(v=>v.files.some(x=>x.id===f.id)))) || (fb.filter==="onbekend"&&(!f.p.regions.length||f.p.fromDat)) || (fb.filter==="speciaal"&&["info","bad"].includes(s));
  });
  if (q) list=list.filter(f=>(f.name+" "+f.p.datName).toLowerCase().includes(q));
  list.sort((a,b)=>a.p.key.localeCompare(b.p.key)||a.name.localeCompare(b.name));
  S.cvFiles = fb.filter==="prullenbak" ? [] : list.map(f=>f.id);
  fb.sel=new Set([...fb.sel].filter(id=>list.some(f=>f.id===id)));
  const sel=list.filter(f=>fb.sel.has(f.id)), inTrash=fb.filter==="prullenbak";
  const renamable=sel.filter(f=>f.p.datName && f.p.datName!==f.name);
  let h=`<div class="fbar">
      <div class="sysrow">${systems.map(s=>`<button class="chip" data-fsys="${s}" aria-pressed="${fb.sys===s}">${esc(sysName(s))}<span class="c">${S.romFiles.filter(f=>f.sys===s).length}</span></button>`).join("")}</div>
      <div class="pathline"><span class="mono">${esc(S.dir)}/roms/${esc(fb.sys)}/${inTrash?"_duplicates/":""}</span> ${locLink(`${S.dir}/roms/${fb.sys}/${inTrash?"_duplicates/":""}`)}</div>
      <input class="search" id="fq" type="search" placeholder="Search this folder" value="${esc(fb.q)}" aria-label="Search this folder">
      <div class="chips">${FILT.map(([v,l,n])=>`<button class="chip" data-ff="${v}" aria-pressed="${fb.filter===v}">${l}<span class="c">${n}</span></button>`).join("")}</div>
    </div>`;
  if (fb.cmp){ const [a,b]=fb.cmp.map(id=>[...all,...trash].find(f=>f.id===id)); if(a&&b) h+=compareHTML(a,b); }
  h+=`<div class="ftable">`;
  if (!list.length) h+=`<div class="empty-state">${inTrash?"The _duplicates folder is empty.":"No files for this filter."}</div>`;
  for (const f of list){
    const [sk,sl]=inTrash?["info","in _duplicates"]:fileStatus(f,groups);
    const open=fb.open===f.id;
    const same=all.filter(x=>x.id!==f.id&&x.hash===f.hash), sameGame=all.filter(x=>x.id!==f.id&&x.hash!==f.hash&&x.p.key===f.p.key&&x.sys===f.sys);
    h+=`<div class="frow2 ${fb.sel.has(f.id)?"sel":""}">
      <input type="checkbox" data-fsel="${f.id}" ${fb.sel.has(f.id)?"checked":""} aria-label="Select ${esc(f.name)}">
      <div class="fmain ${S.art.show?"wc":""}">${S.art.show?`<button class="covbtn" data-cv="${f.id}" data-cvsrc="files" aria-label="View cover: ${esc(f.p.title)}">${hasCover(f)?(()=>{ const vars=coverVariants(f.sys,f.p.key,0,f.p.regions), ch=chosenVariant(f.sys,f.p.key,vars); return coverHTML(f.sys,f.p.title,{reg:ch, shift:REG_SHIFT[ch]}); })():coverHTML(f.sys,"",{none:true})}</button>`:""}<div><div class="fn">${esc(f.name)}</div>
        <div class="meta">${flags(f.p.regions)} ${f.p.fromDat?`<span>region from database</span>`:""} ${f.p.langs?`<span>languages ${esc(f.p.langs)}</span>`:""} ${f.p.rev?`<span>Rev ${f.p.rev}</span>`:""} <span>${size(Math.max(1,Math.round(f.mb)))}</span> <span class="st ${sk}">${sl}</span> ${locLink(romPath(f.sys,f.name,inTrash))}</div>${S.art.show?"</div>":""}</div>
      <span style="display:flex;gap:10px;align-items:center">${!inTrash?`<button class="linkbtn" data-play="${f.id}">▶ Play</button>`:""}<button class="linkbtn" data-fopen="${f.id}" aria-expanded="${open}">${open?"Less":"Details"}</button></span>
      ${open?`<div class="fdet">
        <dl><dt>Path</dt><dd><span class="mono">${esc(romPath(f.sys,f.name,inTrash))}</span>${locBtns(romPath(f.sys,f.name,inTrash))}</dd>
        <dt>Fingerprint</dt><dd class="mono fp">SHA-1 ${f.p.fp}</dd>
        <dt>Database</dt><dd>${f.p.datName?`Recognized as <span class="mono">${esc(f.p.datName)}</span>`:`Not found in No-Intro or Redump${f.p.special.length?" (normal for translations and hacks)":""}`}</dd>
        <dt>Region</dt><dd>${f.p.regions.length?f.p.regions.map(r=>REG_NAMES[r]||r).join(", "):"Unknown"}</dd>
        <dt>Languages</dt><dd>${esc(f.p.langs||"Not listed in the name")}</dd>
        ${same.length?`<dt>Same content</dt><dd>${same.map(x=>`<span class="mono">${esc(x.name)}</span>`).join("<br>")}</dd>`:""}
        ${sameGame.length?`<dt>Same game</dt><dd>${sameGame.map(x=>`<span class="mono">${esc(x.name)}</span>`).join("<br>")}</dd>`:""}</dl>
        ${!inTrash&&f.p.datName&&f.p.datName!==f.name?`<button class="btn small" data-fren="${f.id}">Rename to ${esc(f.p.datName)}</button>`:""}
      </div>`:""}
    </div>`;
  }
  h+=`</div>`;
  if (sel.length){
    h+=`<div class="sticky-act"><span>${sel.length} selected</span><span class="acts">
      ${sel.length===2?`<button class="btn" id="f-cmp">Compare</button>`:""}
      ${!inTrash&&renamable.length?`<button class="btn" id="f-ren">Proper name (${renamable.length})</button>`:""}
      ${inTrash?`<button class="btn" id="f-restore">Restore</button>`:`<button class="btn" id="f-move">Move to _duplicates</button>`}
      <button class="btn danger" id="f-del">${inTrash?"Delete permanently":"Delete"}</button></span></div>`;
    if (fb.confirm) h+=`<div class="confirm" role="alertdialog"><b>Really delete ${sel.length} file(s)?</b><p class="hint">This cannot be undone.${inTrash?"":" Move them to _duplicates first? Then you can still go back."}</p>
      <div class="acts"><button class="btn" id="f-no">Cancel</button><button class="btn danger" id="f-yes">Yes, delete</button></div></div>`;
  }
  return h;
}
function bindFiles(){
  const fb=S.fb, re=()=>renderRoms();
  document.querySelectorAll("[data-fsys]").forEach(b=>b.onclick=()=>{fb.sys=b.dataset.fsys; fb.sel.clear(); fb.open=null; fb.cmp=null; fb.confirm=false; re();});
  document.querySelectorAll("[data-ff]").forEach(b=>b.onclick=()=>{fb.filter=b.dataset.ff; fb.sel.clear(); fb.cmp=null; fb.confirm=false; re();});
  const q=$("#fq"); q.oninput=()=>{fb.q=q.value; const pos=q.selectionStart; re(); const n=$("#fq"); n.focus(); n.setSelectionRange(pos,pos);};
  document.querySelectorAll("[data-fsel]").forEach(c=>c.onchange=()=>{c.checked?fb.sel.add(c.dataset.fsel):fb.sel.delete(c.dataset.fsel); fb.confirm=false; re();});
  document.querySelectorAll("[data-fopen]").forEach(b=>b.onclick=()=>{fb.open=fb.open===b.dataset.fopen?null:b.dataset.fopen; re();});
  const ids=()=>[...fb.sel];
  const ren=list=>{ list.forEach(id=>{const f=S.romFiles.find(x=>x.id===id); const d=f&&DAT[f.hash]; if(d&&d!==f.name){ log(`Renamed: ${f.name} → ${d}`); f.name=d; }}); };
  document.querySelectorAll("[data-fren]").forEach(b=>b.onclick=()=>{ren([b.dataset.fren]); toast("Renamed to the official name"); re();});
  if($("#cmp-close")) $("#cmp-close").onclick=()=>{fb.cmp=null; re();};
  if($("#f-cmp")) $("#f-cmp").onclick=()=>{fb.cmp=ids(); re(); setTimeout(()=>$(".cmp")?.scrollIntoView({block:"nearest"}),20);};
  if($("#f-ren")) $("#f-ren").onclick=()=>{const n=ids().filter(id=>{const f=S.romFiles.find(x=>x.id===id); return f&&DAT[f.hash]&&DAT[f.hash]!==f.name;}).length; ren(ids()); toast(`${n} file(s) renamed`); re();};
  if($("#f-move")) $("#f-move").onclick=()=>{const files=S.romFiles.filter(f=>fb.sel.has(f.id)); moveToTrash(files,"zelf"); S.lastMove=files.map(f=>f.id); log(`${files.length} ROM(s) moved to _duplicates`); toast(`${files.length} moved to _duplicates`); fb.sel.clear(); fb.cmp=null; re(); renderStrip();};
  if($("#f-restore")) $("#f-restore").onclick=()=>{const n=restore(ids()); log(`${n} ROM(s) restored`); toast(`${n} restored`); fb.sel.clear(); re(); renderStrip();};
  if($("#f-del")) $("#f-del").onclick=()=>{fb.confirm=true; re(); $("#f-no")?.focus();};
  if($("#f-no")) $("#f-no").onclick=()=>{fb.confirm=false; re();};
  if($("#f-yes")) $("#f-yes").onclick=()=>{
    const del=ids();
    if (fb.filter==="prullenbak") S.trash=S.trash.filter(f=>!del.includes(f.id));
    else { S.romFiles.filter(f=>del.includes(f.id)).forEach(f=>{const r=S.roms.find(x=>x.id===f.sys); if(r){r.n=Math.max(0,r.n-1); r.mb=Math.max(0,Math.round(r.mb-f.mb));}}); S.romFiles=S.romFiles.filter(f=>!del.includes(f.id)); }
    log(`${del.length} ROM(s) deleted`); toast(`${del.length} file(s) deleted`); fb.sel.clear(); fb.confirm=false; fb.cmp=null; re(); renderStrip();
  };
}

// ---------------------------------------------------------------- Inbox: inbox/<system>/ like ES-DE, check list + collection, then sort
const EXT_SYS = {".gba":"gba",".gb":"gb",".gbc":"gbc",".sfc":"snes",".smc":"snes",".nes":"nes",".fds":"fds",".md":"megadrive",".gen":"megadrive",".smd":"megadrive",".n64":"n64",".z64":"n64",".v64":"n64",".nds":"nds",".gg":"gamegear",".sms":"mastersystem",".pce":"pcengine",".lnx":"atarilynx",".a26":"atari2600",".ngp":"ngp",".ngc":"ngpc",".ws":"wonderswan",".wsc":"wonderswancolor",".vb":"virtualboy",".32x":"sega32x",".3ds":"3ds"};
S.inboxMode = "ask";
S.inboxDone = [];
S.inbox = [
  {dir:"gba", name:"Golden Sun (USA, Europe).gba", mb:8},
  {dir:"gba", name:"golden sun 2.gba", mb:16, known:{sys:"gba", title:"Golden Sun - The Lost Age", regs:["US","EU"]}},
  {dir:"gba", name:"Advance Wars (USA).gba", mb:8},
  {dir:"gba", name:"zelda minish.gba", mb:16},
  {dir:"gba", name:"Metroid Fusion (USA).gba", mb:8, hash:"h1"},
  {dir:"snes", name:"Super Mario All-Stars (Europe) (En,Fr,De) (Rev 1).sfc", mb:2},
  {dir:"gba", name:"Pokemon - Emerald Version (Europe) (En,Fr,De,Es,It).gba", mb:16},
  {dir:"gba", name:"Pokemon Red.gb", mb:1},
  {dir:"gba", name:"My Homebrew Demo.gba", mb:1},
  {dir:"psx", name:"crash.chd", mb:376, known:{sys:"psx", title:"Crash Bandicoot", regs:["JP"]}},
  {dir:"megadrive", name:"sonic3.bin", mb:2, known:{sys:"megadrive", title:"Sonic The Hedgehog 3", regs:["US"]}},
  {dir:"snes", name:"Final Fantasy VI (Japan) [T-En by RPGe].sfc", mb:3},
  {dir:"", name:"game_backup_01.iso", mb:690},
].map((f,i)=>({...f, id:"in"+i}));

const regsOfMask = r => ["US","EU","JP","W","OV"].filter(x=>r&RB[x]);
function matchScore(q, t){
  const a=ckey(q), b=ckey(t); if(!a||!b) return 0;
  if (a===b) return 1;
  const ta=a.split(" "), tb=new Set(b.split(" "));
  return Math.max(dice(a,b), ta.every(x=>tb.has(x)) ? 0.72 + 0.2*ta.length/tb.size : 0);
}
async function identify(f){
  if (f.id_done) return f;
  const p=parseRom(f.name); f.p=p; f.ext=p.ext; f.special=p.special;
  // 1. system: folder first, then fingerprint, then extension
  f.sys = f.sys || f.dir || (f.known&&f.known.sys) || EXT_SYS[p.ext] || null;
  f.sysHow = f.dir ? "folder" : f.known ? "fingerprint" : EXT_SYS[p.ext] ? "extension" : "unknown";
  const other = (f.known && f.known.sys!==f.sys) ? f.known.sys : (EXT_SYS[p.ext] && EXT_SYS[p.ext]!==f.sys ? EXT_SYS[p.ext] : null);
  f.mismatch = f.dir && other && !f.mismatchOk ? other : null;
  if (!f.sys && !f.dir && typeof EV!=="undefined" && EV.guessByName){ try { const g=await EV.guessByName(p); if(g){ f.sys=g; f.sysHow="name"; } } catch(e){} }
  if (!f.sys){ f.conf="unknown"; f.id_done=true; return f; }
  if (f.known && f.known.sys===f.sys){ Object.assign(f,{title:f.known.title, regs:f.known.regs, conf:"sure"}); f.id_done=true; return f; }
  try { await loadList(f.sys); } catch(e){ f.conf="unknown"; f.id_done=true; return f; }
  const cands = EV.cands(f.sys, p);
  f.cands=cands;
  const regs = p.regions.length ? p.regions.map(r=>REG_GROUP[r]||r) : [];
  if (cands[0] && cands[0].s===1) Object.assign(f,{title:cands[0].t, regs:regs.length?regs:regsOfMask(cands[0].r).length===1?regsOfMask(cands[0].r):[], conf:"name"});
  else if (cands[0]) Object.assign(f,{title:cands[0].t, regs, conf:"maybe"});
  else Object.assign(f,{title:null, conf:"notinlist"});
  f.id_done=true; return f;
}
function ownedVersions(f){
  if (!f.sys || !f.title) return [];
  const k=ckey(f.title);
  return S.romFiles.filter(x=>x.sys===f.sys).map(x=>({x, p:parseFile(x)})).filter(o=>o.p.key===k && !o.p.special.length);
}
function newName(f){
  if (!f.title) return f.name;
  const W2={US:"USA",EU:"Europe",JP:"Japan",W:"World",OV:"Asia"};
  const reg=(f.regs||[]).length?` (${f.regs.map(r=>W2[r]||r).join(", ")})`:"";
  const extra=f.special.length?" "+f.special.map(s=>`[${s}]`).join(" "):"";
  const ext=f.ext&&f.ext!==".bin"?f.ext:({megadrive:".md"}[f.sys]||f.ext);
  const langs=f.p&&f.p.langs?` (${f.p.langs})`:"", rev=f.p&&f.p.rev?` (Rev ${f.p.rev})`:"";
  return `${f.title}${reg}${langs}${rev}${extra}${ext}`;
}
const better = f => { const o=ownedVersions(f); return o.length && regionRank(f.regs||[]) < Math.min(...o.map(v=>regionRank(v.p.regions))); };
function acceptInbox(f, opts={}){
  const name = f.title ? newName(f) : f.name, toDup=!!opts.toDup;
  const entry={id:"r"+Date.now()+Math.random().toString(36).slice(2,6), sys:f.sys, name, mb:f.mb, hash:"in-"+f.id};
  if (toDup) S.trash.push({...entry, why:"inbox"});
  else { S.romFiles.push(entry); const r=S.roms.find(x=>x.id===f.sys); if(r){r.n++; r.mb=Math.round(r.mb+f.mb);} }
  S.inbox=S.inbox.filter(x=>x!==f);
  const to=`roms/${f.sys}/${toDup?"_duplicates/":""}${name}`;
  S.inboxDone.unshift({name:`inbox/${f.dir?f.dir+"/":""}${f.name}`, to, auto:!!opts.auto});
  log(`Inbox: ${f.name} → ${to}`);
  if (!toDup && S.art.auto && artReady() && (f.conf==='sure'||f.conf==='name') && !f.special.length) S.art.got.add(entry.id);
}
function skipInbox(f){ S.inbox=S.inbox.filter(x=>x!==f); S.inboxDone.unshift({name:`inbox/${f.dir?f.dir+"/":""}${f.name}`, to:"left in the inbox (skipped)", skip:true}); log(`Inbox: ${f.name} skipped`); }
const isClear = f => (f.conf==="sure"||f.conf==="name") && !f.mismatch && !ownedVersions(f).length && !f.special.length;
async function runInboxAuto(){
  if (S.inboxMode!=="auto") return 0;
  let n=0; for (const f of [...S.inbox]){ await identify(f); if (f.conf==="sure" && isClear(f)){ acceptInbox(f,{auto:true}); n++; }
    else if (S.inboxDup!=="ask" && (f.conf==="sure"||f.conf==="name") && !f.mismatch && !f.special.length && ownedVersions(f).length){ const o=ownedVersions(f); doDup(f, S.inboxDup==="both"?"both":dupAdvice(f,o).rec, o); S.inboxDone[0].auto=true; n++; } }
  return n;
}

// ---- inbox: what to do when you already have the game
S.inboxDup = "ask";   // "ask" · "rule" (follow my region rule) · "both" (always keep both)
const DUP_OPTS = {
  replace:{t:"Keep the new one", d:"Your current copy moves to _duplicates."},
  keepold:{t:"Keep the one I have", d:"The new file moves to _duplicates."},
  both:{t:"Keep both", d:"Handy for a different language, region or revision."},
  delete:{t:"Delete the new file", d:"It is removed from the inbox for good."},
};
const reg2=rs=>(rs||[]).length?[...new Set(rs.map(r=>GROUP_NAMES[REG_GROUP[r]||r]||r))].join("/"):"unknown-region";
function dupAdvice(f, owned){
  const fp = f.hash || (f.known ? "k-"+f.known.title+(f.regs||[]).join() : null);
  const ident = owned.find(o=>f.hash && o.x.hash===f.hash);
  if (ident) return {rec:"delete", why:`It is exactly the same file as ${ident.x.name}: the fingerprints match.`, ident};
  const newRank=regionRank(f.regs||[]), oldBest=owned.slice().sort((a,b)=>regionRank(a.p.regions)-regionRank(b.p.regions))[0];
  const oldRank=regionRank(oldBest.p.regions);
  const newLangs=(f.p.langs||"").split(",").filter(Boolean), oldLangs=new Set(owned.flatMap(o=>(o.p.langs||"").split(",").filter(Boolean)));
  const extraLangs=newLangs.filter(l=>!oldLangs.has(l));
  if (owned.every(o=>o.p.bad)) return {rec:"replace", why:"The copy you have is damaged.", targets:owned};
  const grp=rs=>[...new Set((rs||[]).map(r=>REG_GROUP[r]||r))].sort().join();
  const sameReg=owned.filter(o=>grp(o.p.regions)===grp(f.regs));
  if (sameReg.length && (f.p.rev||0)>Math.max(...sameReg.map(o=>o.p.rev||0))){
    const others=owned.filter(o=>!sameReg.includes(o));
    return {rec:"replace", targets:sameReg, why:`Newer revision (Rev ${f.p.rev}) of your ${reg2(f.regs)} copy.${others.length?` Your other copies stay.`:""}`};
  }
  const bad=owned.filter(o=>o.p.bad); if (bad.length) return {rec:"replace", targets:bad, why:`Replaces your damaged copy ${bad[0].x.name}.`};
  if (newRank<oldRank) return {rec:"replace", targets:owned, why:`It fits your region rule better (${regionRule()}).`};
  if (extraLangs.length) return {rec:"both", why:`It has languages you don't have yet: ${extraLangs.join(", ")}.`};
  return {rec:"keepold", why:`Your region rule (${regionRule()}) prefers the copy you have.`};
}
function dupCompare(f, owned){
  const reg=rs=>(rs||[]).length?rs.map(r=>GROUP_NAMES[REG_GROUP[r]||r]||REG_NAMES[r]||r).join(", "):"unknown";
  const cols=[{h:"New file", name:f.name, reg:reg(f.regs), langs:f.p.langs||"—", rev:f.p.rev||"—", fmt:(f.ext||"").replace(".","").toUpperCase(), mb:f.mb, state:f.p.bad?"damaged":f.p.verified?"verified [!]":f.conf==="sure"?"matches database":"—"},
    ...owned.slice(0,3).map(o=>({h:"You have", name:o.x.name, reg:reg(o.p.regions), langs:o.p.langs||"—", rev:o.p.rev||"—", fmt:o.p.ext.replace(".","").toUpperCase(), mb:o.x.mb, state:o.p.bad?"damaged":f.hash&&o.x.hash===f.hash?"identical to the new file":o.p.verified?"verified [!]":o.p.datName?"matches database":"—"}))];
  const row=(l,k,fmt=x=>esc(String(x)))=>`<tr><th>${l}</th>${cols.map(c=>`<td>${fmt(c[k])}</td>`).join("")}</tr>`;
  return `<div class="tscroll"><table class="cmpt"><thead><tr><th></th>${cols.map(c=>`<th>${c.h}</th>`).join("")}</tr></thead><tbody>
    ${row("File","name",x=>`<span class="mono">${esc(x)}</span>`)}${row("Region","reg")}${row("Languages","langs")}${row("Revision","rev")}${row("Format","fmt")}${row("Size","mb",x=>size(Math.max(1,Math.round(x))))}${row("Check","state")}
  </tbody></table></div>`;
}
function doDup(f, choice, owned){
  const adv=dupAdvice(f, owned); const targets=(choice==="replace" && adv.targets) ? adv.targets : owned;
  if (choice==="delete"){ if(f.loc) EV.queue({kind:"delete", from:f.loc, to:""}); S.inbox=S.inbox.filter(x=>x!==f); S.inboxDone.unshift({name:`inbox/${f.dir?f.dir+"/":""}${f.name}`, to:"deleted (you already had it)"}); log(`Inbox: ${f.name} deleted`); return; }
  if (choice==="keepold") return acceptInbox(f,{toDup:true});
  if (choice==="replace"){ moveToTrash(targets.map(o=>o.x),"replaced"); targets.forEach(o=>log(`Moved to _duplicates: ${o.x.name}`)); }
  acceptInbox(f);
}

function inboxCard(f){
  const owned=ownedVersions(f), sysName2=f.sys&&GI[f.sys]?sysLabel(GI[f.sys]):(f.sys||"");
  const fl=regs=>(regs||[]).length?regs.map(r=>`<span class="flag">${r}</span>`).join(" "):`<span class="flag q">?</span>`;
  const path=`inbox/${f.dir?f.dir+"/":""}`;
  let body="";
  if (f.mismatch){
    const mName=GI[f.mismatch]?sysLabel(GI[f.mismatch]):f.mismatch;
    body+=`<div class="verdict warn"><b>Wrong folder?</b> This file is in <span class="mono">${esc(path)}</span>, but it looks like a <b>${esc(mName)}</b> game (${f.known?"fingerprint":`<span class="mono">${esc(f.ext)}</span> file`}).
      <div class="iact" style="margin-top:8px"><button class="btn small" data-imove="${f.id}" data-to="${f.mismatch}">Yes, it's ${esc(mName)}</button><button class="btn small" data-ikeep="${f.id}">No, it's ${esc(sysName2)}</button></div></div>`;
    return wrapCard(f, path, body, `<button class="linkbtn" data-iskip="${f.id}">Skip</button>`);
  }
  if (!f.sys || f.picking){
    const systems=GAMEINDEX.filter(i=>i.kind!=="dl").sort((a,b)=>sysLabel(a).localeCompare(sysLabel(b)));
    body+=`<div class="q"><label for="isys-${f.id}">${f.sys?"System":"Which system is this for?"}</label>
      ${!f.dir?`<p class="help">This file is directly in <span class="mono">inbox/</span>, so we can't tell the system from the folder, and <span class="mono">${esc(f.ext)}</span> files exist for many systems.</p>`:""}
      <select id="isys-${f.id}" data-isys="${f.id}"><option value="">Choose a system…</option>${systems.map(i=>`<option value="${i.id}" ${f.sys===i.id?"selected":""}>${esc(sysLabel(i))}</option>`).join("")}</select></div>`;
    if (f.sys) body+=`<div class="q"><label for="iq-${f.id}">Which game is it?</label><input class="search" id="iq-${f.id}" data-iq="${f.id}" type="search" placeholder="Type part of the title" value="${esc(f.q ?? f.p.title)}">
        <div class="rows">${(f.res||f.cands||[]).slice(0,6).map(c=>`<button class="opt pickg" data-pick="${f.id}" data-pt="${esc(c.t)}" data-pr="${c.r}"><span></span><span><b>${esc(c.t)}</b><br><span class="muted" style="font-size:12px">${fl(regsOfMask(c.r))}</span></span><span class="muted" style="font-size:12px">${Math.round((c.s||0)*100)}%</span></button>`).join("")||`<p class="hint">No matching titles. Try fewer words.</p>`}</div></div>`;
    return wrapCard(f, path, body, `${f.picking&&f.title?`<button class="btn" data-ipick="${f.id}">Back</button>`:""}<button class="linkbtn" data-iskip="${f.id}">Skip</button>`);
  }
  // the two questions you can't answer yourself
  const inList = f.conf==="sure"||f.conf==="name"
    ? `<span class="ck ok">✓</span><span><b>In the ${esc(sysName2)} list:</b> ${esc(f.title)} ${fl(f.regs)}${f.conf==="sure"?` <span class="muted">· matched by fingerprint</span>`:""}</span>`
    : f.conf==="maybe"
    ? `<span class="ck warn">?</span><span><b>Closest match in the list:</b> ${esc(f.title)}. Is that right?${f.cands?.length>1?` <span class="muted">Or: ${f.cands.slice(1,3).map(c=>`<button class="linkbtn" data-pick="${f.id}" data-pt="${esc(c.t)}" data-pr="${c.r}">${esc(c.t)}</button>`).join(" · ")}</span>`:""}</span>`
    : `<span class="ck bad">✗</span><span><b>Not in the ${esc(sysName2)} list.</b> It may be homebrew, a hack, or a file with a very different name. You can still keep it.</span>`;
  const coll = f.special.length
    ? `<span class="ck info">i</span><span><b>Fan translation or hack.</b> It is kept with ${esc(sysName2)}, but it doesn't count for your collection.</span>`
    : !f.title ? `<span class="ck info">i</span><span>Not counted in your collection, because it is not in the list.</span>`
    : owned.length
    ? `<span class="ck warn">!</span><span><b>You already have ${owned.length>1?`${owned.length} copies`:"it"}:</b> ${owned.map(o=>`<span class="mono">${esc(o.x.name)}</span>`).join(", ")}.</span>`
    : `<span class="ck ok">✓</span><span><b>New for your collection.</b> You don't have this game yet.</span>`;
  body+=`<div class="checks"><div class="crow2">${inList}</div><div class="crow2">${coll}</div></div>`;
  if (f.title && !(f.regs||[]).length && !f.regAsked && !f.special.length) body+=`<div class="q"><span class="lbl" style="font-size:13px">Which region is your copy? <span class="muted" style="font-weight:400">The file name doesn't say.</span></span>
      <div class="sugs">${[["US","USA"],["EU","Europe"],["JP","Japan"],["W","World"]].map(([c,l])=>`<button class="sug" data-ireg="${f.id}" data-r="${c}">${l}</button>`).join("")}<button class="sug" data-ireg="${f.id}" data-r="">Don't know</button></div></div>`;
  if (owned.length && f.title && !f.special.length){
    const adv=dupAdvice(f, owned); f.choice ||= (S.inboxDup==="both"?"both":adv.rec);
    body+=`<details class="codes" ${f.cmpOpen?"open":""} data-icmp="${f.id}"><summary>Compare with what you have</summary>${dupCompare(f, owned)}</details>
      <div class="q"><span class="lbl" style="font-size:14px">What should happen?</span>
      <div class="rows">${Object.entries(DUP_OPTS).map(([k,o])=>`<label class="opt ${f.choice===k?"":"dim"}" style="border-color:${f.choice===k?"var(--accent)":"var(--line)"}"><input type="radio" name="dup-${f.id}" data-ich="${f.id}" value="${k}" ${f.choice===k?"checked":""}>
        <span><b style="font-size:14px">${o.t}</b><br><span class="muted" style="font-size:12.5px">${k===adv.rec?esc(adv.why):k==="replace"&&adv.targets&&adv.targets.length<owned.length?`Moves ${adv.targets.map(x=>x.x.name).join(", ")} to _duplicates.`:o.d}</span></span>${k===adv.rec?`<span class="pill ok">recommended</span>`:"<span></span>"}</label>`).join("")}</div></div>
      ${S.inbox.filter(x=>x!==f && ownedVersions(x).length && !x.special.length).length?`<label class="inline-t"><input type="checkbox" data-iall="${f.id}" ${f.applyAll?"checked":""}> Do the recommended thing for the other ${S.inbox.filter(x=>x!==f && ownedVersions(x).length && !x.special.length).length} files I already have</label>`:""}`;
    const acts=`<button class="btn primary" data-ido="${f.id}">${DUP_OPTS[f.choice].t}</button><button class="btn" data-ipick="${f.id}">Choose another game</button><button class="linkbtn" data-iskip="${f.id}">Decide later</button>`;
    return wrapCard(f, path, body, acts);
  }
  body+=`<div class="preview">Goes to <span class="mono">roms/${esc(f.sys)}/${esc(f.title?newName(f):f.name)}</span></div>`;
  let acts = `<button class="btn primary" data-iacc="${f.id}">${f.conf==="maybe"?"Yes, that's it":f.title?"Add it":"Keep it anyway"}</button>`;
  acts += `<button class="btn" data-ipick="${f.id}">${f.title?"Choose another game":"Find it in the list"}</button><button class="linkbtn" data-iskip="${f.id}">Skip</button>`;
  return wrapCard(f, path, body, acts);
}
function wrapCard(f, path, body, acts){
  return `<article class="icard"><header><div style="min-width:0"><div class="fn mono">${esc(f.name)}</div><div class="muted" style="font-size:12px">${esc(path)} · ${size(Math.max(1,Math.round(f.mb)))} · ${locLink(`${S.dir}/${path}${f.name}`)}</div></div></header>${body}<div class="iact">${acts}</div></article>`;
}
async function renderInbox(el){
  const auto=await runInboxAuto();
  for (const f of S.inbox) await identify(f);
  const clear=S.inbox.filter(isClear);
  const help=S.inbox.length-clear.length;
  const folders=[...new Set(S.inbox.map(f=>f.dir))].sort((a,b)=>(a===""?1:b===""?-1:a.localeCompare(b)));
  let h=`<div class="dupsum">
      <div class="nums"><div><b>${S.inbox.length}</b>new files</div><div><b>${clear.length}</b>ready to add</div><div><b>${help}</b>need a look</div></div>
      <p class="hint">Put new games in <span class="mono">${esc(S.dir)}/inbox/&lt;system&gt;/</span>, with the same folder names as ES-DE: <span class="mono">gba</span>, <span class="mono">snes</span>, <span class="mono">psx</span>… The folder tells us the system. For each file we then check two things for you: <b>is it in the list</b>, and <b>do you already have it</b>.</p>
      ${clear.length?`<div class="gact"><button class="btn primary small" id="in-all">Add the ${clear.length} ready files</button></div>`:""}
      ${auto?`<p class="hint keep"><b>${auto} file(s) were sorted automatically</b> because they were recognized for sure. You can change this in Settings.</p>`:""}
      <details class="filt" data-k="inbox:more" ${isOpen("inbox:more")?"open":""}><summary>Folders and test files</summary>
        <label class="btn small" for="in-file" style="cursor:pointer;align-self:flex-start">Add files to inbox/${esc(S.fb.sys)}</label><input type="file" id="in-file" multiple hidden>
      <details class="codes"><summary>Inbox folder names</summary><p class="hint">The app creates these folders for you. Files you drop straight into <span class="mono">inbox/</span> also work, but then we have to guess the system.</p>
        <div class="tscroll"><table><thead><tr><th>Folder</th><th>System</th></tr></thead><tbody>${GAMEINDEX.filter(i=>i.kind!=="dl"&&!i.id.includes("-")).sort((a,b)=>a.id.localeCompare(b.id)).map(i=>`<tr><td class="mono">inbox/${i.id}/</td><td>${esc(sysLabel(i))}</td></tr>`).join("")}</tbody></table></div></details></details>
    </div>`;
  if (!S.inbox.length) h+=`<div class="empty-state" style="margin-top:10px">The inbox is empty. Everything is sorted.</div>`;
  for (const dir of folders){
    const files=S.inbox.filter(f=>f.dir===dir);
    h+=`<div class="group" style="margin-top:14px"><h2 class="mono" style="text-transform:none;letter-spacing:0">inbox/${dir?dir+"/":""} · ${dir&&GI[dir]?esc(sysLabel(GI[dir])):"unsorted"} · ${files.length}</h2><div class="ilist" style="margin-top:0">${files.map(inboxCard).join("")}</div></div>`;
  }
  if (S.inboxDone.length) h+=`<div class="group" style="margin-top:14px"><h2>Recently sorted</h2><div class="ftable">${S.inboxDone.slice(0,12).map(d=>`<div class="frow2" style="grid-template-columns:minmax(0,1fr)"><div class="fmain"><div class="fn">${esc(d.name)}</div><div class="meta"><span class="mono">→ ${esc(d.to)}</span>${d.auto?` <span class="st ok">automatic</span>`:""}</div></div></div>`).join("")}</div></div>`;
  el.innerHTML=h; bindInbox(el); updateInboxBadge();
}
function updateInboxBadge(){ const b=document.querySelector('[data-rv="inbox"] .n'); if(b) b.textContent=S.inbox.length||""; }
function bindInbox(el){
  const re=()=>renderRoms(), F=id=>S.inbox.find(x=>x.id===id), reid=f=>{ f.id_done=false; };
  el.querySelectorAll("[data-ich]").forEach(r=>r.onchange=()=>{ F(r.dataset.ich).choice=r.value; re(); });
  el.querySelectorAll("[data-icmp]").forEach(dt=>dt.ontoggle=()=>{ const f=F(dt.dataset.icmp); if(f) f.cmpOpen=dt.open; });
  el.querySelectorAll("[data-iall]").forEach(c=>c.onchange=()=>{ F(c.dataset.iall).applyAll=c.checked; re(); });
  el.querySelectorAll("[data-ido]").forEach(b=>b.onclick=()=>{
    const f=F(b.dataset.ido), owned=ownedVersions(f); doDup(f, f.choice, owned); let n=1;
    if (f.applyAll) S.inbox.filter(x=>x.title && ownedVersions(x).length && !x.special.length).forEach(x=>{ const o=ownedVersions(x); doDup(x, S.inboxDup==="both"?"both":dupAdvice(x,o).rec, o); n++; });
    toast(n>1?`${n} files handled`:DUP_OPTS[f.choice].t+": done"); re(); renderStrip(); });
  el.querySelectorAll("[data-iacc]").forEach(b=>b.onclick=()=>{ const f=F(b.dataset.iacc); acceptInbox(f,{toDup:!!b.dataset.dup}); toast(b.dataset.dup?"Moved to _duplicates":`Added: ${f.title||f.name}`); re(); renderStrip(); });
  el.querySelectorAll("[data-iskip]").forEach(b=>b.onclick=()=>{ skipInbox(F(b.dataset.iskip)); re(); });
  el.querySelectorAll("[data-ipick]").forEach(b=>b.onclick=()=>{ const f=F(b.dataset.ipick); f.picking=!f.picking; f.q=undefined; f.res=null; re(); });
  el.querySelectorAll("[data-ireg]").forEach(b=>b.onclick=()=>{ const f=F(b.dataset.ireg); f.regs=b.dataset.r?[b.dataset.r]:[]; f.regAsked=true; re(); });
  el.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{ const f=F(b.dataset.pick); f.title=b.dataset.pt; f.regs=f.p.regions.length?f.p.regions.map(r=>REG_GROUP[r]||r):[]; f.conf="name"; f.picking=false; re(); });
  el.querySelectorAll("[data-imove]").forEach(b=>b.onclick=()=>{ const f=F(b.dataset.imove); f.sys=b.dataset.to; f.dir=b.dataset.to; f.mismatchOk=true; reid(f); log(`Inbox: ${f.name} belongs to ${b.dataset.to}`); re(); });
  el.querySelectorAll("[data-ikeep]").forEach(b=>b.onclick=()=>{ const f=F(b.dataset.ikeep); f.mismatchOk=true; f.known=null; reid(f); re(); });
  el.querySelectorAll("[data-isys]").forEach(s=>s.onchange=async()=>{ const f=F(s.dataset.isys); f.sys=s.value||null; f.res=null; f.picking=!!f.sys; if(f.sys){ try{ await loadList(f.sys); }catch(e){} searchFor(f,f.p.title); } re(); });
  el.querySelectorAll("[data-iq]").forEach(i=>i.oninput=()=>{ const f=F(i.dataset.iq); f.q=i.value; searchFor(f,i.value); const pos=i.selectionStart; re(); setTimeout(()=>{ const n=document.getElementById("iq-"+f.id); if(n){ n.focus(); n.setSelectionRange(pos,pos);} },0); });
  const all=el.querySelector("#in-all"); if(all) all.onclick=()=>{ const list=S.inbox.filter(isClear); list.forEach(f=>acceptInbox(f)); toast(`${list.length} files sorted`); re(); renderStrip(); };
  const fi=el.querySelector("#in-file"); if(fi) fi.onchange=()=>{ [...fi.files].forEach((x,i)=>S.inbox.push({id:"u"+Date.now()+i, dir:S.fb.sys, name:x.name, mb:x.size/1048576})); log(`${fi.files.length} file(s) added to inbox/${S.fb.sys}/`); re(); };
}
function searchFor(f, q){
  const L=LISTS[f.sys]; if(!L){ f.res=[]; return; }
  const qk=ckey(q||"");
  f.res=!qk?[]:L.map(g=>({t:g[0], r:g[1], s:matchScore(q,g[0])||(ckey(g[0]).includes(qk)?0.6:0)})).filter(c=>c.s>0.4).sort((a,b)=>b.s-a.s).slice(0,6);
}

// ---------------------------------------------------------------- Backups: saves + settings per emulator
const SAVE_INFO = {
  retroarch:{saves:["RetroArch/saves/","RetroArch/states/"], cfg:["retroarch.cfg","config/ (remaps, per-game settings)","shaders/"], n:186, mb:64, cmb:9},
  duckstation:{saves:["memcards/","savestates/"], cfg:["settings.ini","inputprofiles/"], n:24, mb:41, cmb:1},
  ppsspp:{saves:["PSP/SAVEDATA/","PSP/PPSSPP_STATE/"], cfg:["PSP/SYSTEM/ppsspp.ini","PSP/SYSTEM/controls.ini"], n:31, mb:88, cmb:1},
  "dolphin-emulator":{saves:["GC/ (memory cards)","Wii/ (NAND saves)","StateSaves/"], cfg:["Config/"], n:17, mb:210, cmb:2},
  azahar:{saves:["sdmc/ (game saves)","states/"], cfg:["config/"], n:9, mb:120, cmb:1},
  melonds:{saves:["roms/nds/*.sav","states/"], cfg:["settings and layouts"], n:12, mb:6, cmb:1},
  flycast:{saves:["data/ (VMU saves)"], cfg:["emu.cfg","mappings/"], n:8, mb:3, cmb:1},
  "nethersx2-patch":{saves:["memcards/","sstates/"], cfg:["inis/"], n:6, mb:48, cmb:1},
  armsx2:{saves:["memcards/","sstates/"], cfg:["inis/"], n:3, mb:24, cmb:1},
  eden:{saves:["nand/user/save/"], cfg:["config/"], n:4, mb:150, cmb:1},
  aps3e:{saves:["dev_hdd0/home/00000001/savedata/"], cfg:["config/"], n:2, mb:35, cmb:1},
  vita3k:{saves:["ux0/user/00/savedata/"], cfg:["config.yml"], n:3, mb:12, cmb:1},
  "x1-box-xemu":{saves:["xbox_hdd.qcow2 (saves live inside the hard drive image)"], cfg:["xemu.toml"], n:1, mb:900, cmb:1},
  gopher64:{saves:["saves/"], cfg:["config/"], n:7, mb:2, cmb:1},
  daijish:{saves:[], cfg:["platforms, players and themes"], n:0, mb:0, cmb:4},
  "es-de-android-apps":{saves:[], cfg:["ES-DE settings, gamelists and collections"], n:0, mb:0, cmb:6},
};
S.bk = {when:"nightly", keep:3, sync:true, devices:[{name:"Phone (Android)", state:"in sync"},{name:"Linux PC", state:"in sync"}], snaps:{}, running:null};
const bkDays = ["2026-10-28","2026-10-27","2026-10-26","2026-10-25","2026-10-24"];
function bkSnaps(id){ return S.bk.snaps[id] ||= bkDays.slice(0, S.bk.keep).map(d=>({date:d, time:"03:00"})); }
function renderBackups(){
  const apps = S.emus.filter(e=>e.on && SAVE_INFO[e.id]);
  const tot = apps.reduce((a,e)=>a+SAVE_INFO[e.id].mb+SAVE_INFO[e.id].cmb,0);
  const saves = apps.reduce((a,e)=>a+SAVE_INFO[e.id].n,0);
  const seg=(name,opts,val)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-${name}="${v}" aria-pressed="${String(v)===String(val)}">${l}</button>`).join("")}</div>`;
  let h=`<div class="dupsum">
    <div class="nums"><div><b>${saves}</b>saves</div><div><b>${apps.length}</b>emulators</div><div><b>${size(tot)}</b>per backup</div></div>
    <p class="hint">Your saves are the one thing you can't download again. Each night the app copies the saves, save states and settings of every emulator you back up to <span class="mono">${esc(S.dir)}/saves/</span>, and keeps the last ${S.bk.keep} backups.</p>
    <div class="gact"><button class="btn primary small" id="bk-all">Back up everything now</button></div>
    <details class="filt" data-k="bk:sched" ${isOpen("bk:sched")?"open":""}><summary>Schedule <span class="fs">${{nightly:"every night",weekly:"every week",manual:"only when you ask"}[S.bk.when]} · keep ${S.bk.keep}</span></summary>
      <div class="prefs" style="gap:14px"><span style="font-weight:600">When:</span>${seg("bkw",[["nightly","Every night"],["weekly","Every week"],["manual","Only when I ask"]],S.bk.when)}</div>
      <div class="prefs" style="gap:14px"><span style="font-weight:600">Keep:</span>${seg("bkk",[[3,"3"],[5,"5"],[10,"10"]],S.bk.keep)}</div>
      <button class="linkbtn" id="bk-new" style="align-self:flex-start">Set up a new device</button>
    </details>
  </div>
  <div class="sys-block" style="margin-top:12px">
    <header><div><h3>Sync between your devices</h3><div class="used">With Syncthing, which is already in your pack</div></div><label class="inline-t"><input type="checkbox" id="bk-sync" ${S.bk.sync?"checked":""}> On</label></header>
    ${S.bk.sync?`<div class="files">${S.bk.devices.map(d=>`<div class="frow"><span class="dot on"></span><div><div class="fn">${esc(d.name)}</div><div class="note">saves and settings</div></div><span class="pill ok">${esc(d.state)}</span></div>`).join("")}</div>
      <p class="hint" style="margin:0">Play on your phone, continue on your Linux PC. When the same save changed on both devices, the app keeps both and asks which one you want.</p>`:`<p class="hint" style="margin:0">Turn this on to keep the same saves on your phone and your Linux PC.</p>`}
  </div>
  <div class="group" style="margin-top:14px"><h2>Per emulator · ${apps.length}</h2><div style="display:flex;flex-direction:column;gap:10px">`;
  for (const e of apps){
    const s=SAVE_INFO[e.id], snaps=bkSnaps(e.id), run=S.bk.running===e.id;
    h+=`<div class="sys-block" id="bk-${e.id}">
      <header><div><h3>${esc(e.name)}</h3><div class="used">${esc(e.sys)}</div></div><span class="pill ok">backed up ${fmtDate(snaps[0].date)}, ${snaps[0].time}</span></header>
      <div class="bkcols">
        <div><span class="lbl2">Saves${s.n?` · ${s.n} · ${size(s.mb)}`:""}</span>${s.saves.length?s.saves.map(p=>`<div class="mono note">${esc(p)}</div>`).join(""):`<div class="note">This app has no game saves.</div>`}</div>
        <div><span class="lbl2">Settings · ${size(s.cmb)}</span>${s.cfg.map(p=>`<div class="mono note">${esc(p)}</div>`).join("")}</div>
      </div>
      <div class="snaps">${snaps.map((sn,i)=>`<div class="snap"><span class="mono">${fmtDate(sn.date)} ${sn.time}</span>${i===0?`<span class="pill plat">newest</span>`:""}<button class="linkbtn" data-bkr="${e.id}" data-i="${i}">Restore</button></div>`).join("")}</div>
      ${run?`<div class="prog"><i style="width:60%"></i></div>`:""}
      <div class="gact"><button class="btn small" data-bkone="${e.id}" ${run?"disabled":""}>${run?"Backing up…":"Back up now"}</button></div>
    </div>`;
  }
  h+=`</div></div>`;
  if (S.bk.restore) h+=`<div class="confirm" role="alertdialog"><b>Restore ${esc(S.bk.restore.name)} to ${fmtDate(S.bk.restore.date)}?</b><p class="hint">Your current saves and settings of this emulator are backed up first, so you can go back.</p><div class="acts"><button class="btn" id="bkr-no">Cancel</button><button class="btn primary" id="bkr-yes">Restore</button></div></div>`;
  $("#view-bk").innerHTML=h;
  const re=()=>renderBackups();
  const snapNow=id=>{ const sn=bkSnaps(id); sn.unshift({date:"2026-10-28", time:now().slice(0,5)}); sn.splice(S.bk.keep); };
  $("#bk-all").onclick=()=>{ apps.forEach(e=>snapNow(e.id)); log(`Backup made of ${apps.length} emulators`); toast(`Backup made: ${saves} saves from ${apps.length} emulators`); re(); };
  document.querySelectorAll("[data-bkone]").forEach(b=>b.onclick=()=>{ const id=b.dataset.bkone; S.bk.running=id; re(); setTimeout(()=>{ S.bk.running=null; snapNow(id); log(`Backup made: ${S.emus.find(e=>e.id===id).name}`); re(); },800); });
  document.querySelectorAll("[data-bkr]").forEach(b=>b.onclick=()=>{ const e=S.emus.find(x=>x.id===b.dataset.bkr); S.bk.restore={id:e.id, name:e.name, date:bkSnaps(e.id)[+b.dataset.i].date}; re(); });
  if ($("#bkr-no")) $("#bkr-no").onclick=()=>{ S.bk.restore=null; re(); };
  if ($("#bkr-yes")) $("#bkr-yes").onclick=()=>{ const r=S.bk.restore; S.bk.restore=null; log(`Restored ${r.name} to ${r.date}`); toast(`${r.name} restored to ${fmtDate(r.date)}`); re(); };
  document.querySelectorAll("[data-bkw]").forEach(b=>b.onclick=()=>{ S.bk.when=b.dataset.bkw; re(); });
  document.querySelectorAll("[data-bkk]").forEach(b=>b.onclick=()=>{ S.bk.keep=+b.dataset.bkk; S.bk.snaps={}; re(); });
  $("#bk-sync").onchange=ev=>{ S.bk.sync=ev.target.checked; log(S.bk.sync?"Sync turned on":"Sync turned off"); re(); };
  $("#bk-new").onclick=()=>openAdd("newdevice");
}

// ---------------------------------------------------------------- ROM tools: storage, CHD, verify, frontends
S.tools = {chdDone:{}, chdRun:null, verify:null, fe:{ra:false, esde:false, art:null}};
const CHD_SYS = {psx:{from:".bin/.cue", save:0.38, to:"CHD"}, ps2:{from:".iso", save:0.3, to:"CHD"}, saturn:{from:".bin/.cue", save:0.4, to:"CHD"}, segacd:{from:".bin/.cue", save:0.45, to:"CHD"}, dreamcast:{from:".gdi", save:0.42, to:"CHD"}, pcenginecd:{from:".bin/.cue", save:0.45, to:"CHD"}, gc:{from:".iso", save:0.55, to:"RVZ"}, psp:{from:".iso", save:0.35, to:"CSO"}};
function verifyRun(){
  const files=S.romFiles.map(f=>({...f,p:parseFile(f)}));
  const r={good:[], bad:[], unknown:[], fan:[], incomplete:[]};
  const discs={};
  files.forEach(f=>{
    if (f.p.bad) r.bad.push(f);
    else if (f.p.special.length) r.fan.push(f);
    else if (!f.p.datName) r.unknown.push(f);
    else r.good.push(f);
    if (f.p.disc){ const k=f.sys+"|"+f.name.replace(/\s*\(Disc \d+\)/i,""); (discs[k] ||= []).push(f.p.disc); }
  });
  Object.entries(discs).forEach(([k,d])=>{ const max=Math.max(...d); if (d.length===1 && max===1) r.incomplete.push({name:k.split("|")[1], sys:k.split("|")[0], note:"Only Disc 1 found. This game may have more discs."}); else { const miss=[]; for(let i=1;i<=max;i++) if(!d.includes(i)) miss.push(i); if(miss.length) r.incomplete.push({name:k.split("|")[1], sys:k.split("|")[0], note:`Disc ${miss.join(", ")} missing.`}); } });
  return r;
}
function renderTools(){
  const T=S.tools, tot=S.roms.reduce((a,r)=>a+r.mb,0), max=Math.max(...S.roms.map(r=>r.mb),1);
  let h=`<div class="sys-block tool"><header><div><h3>Storage</h3><div class="used">${size(tot)} of ROMs on your drive</div></div></header>
    <div class="bars">${S.roms.filter(r=>r.mb).sort((a,b)=>b.mb-a.mb).map(r=>`<div class="barrow"><span class="bn">${esc(r.name)}</span><span class="bt"><i style="width:${r.mb/max*100}%"></i></span><span class="bv mono">${size(r.mb)}</span></div>`).join("")}</div></div>`;
  // CHD
  const cands=EV.convRoms().filter(r=>r.n&&!T.chdDone[r.id]);
  const saveTot=cands.reduce((a,r)=>a+r.mb*CHD_SYS[r.id].save,0);
  h+=`<div class="sys-block tool" style="margin-top:12px"><header><div><h3>Save space</h3><div class="used">Compress disc games without losing anything</div></div>${cands.length?`<span class="pill ok">save about ${size(Math.round(saveTot))}</span>`:`<span class="pill ok">all compressed</span>`}</header>
    <p class="hint" style="margin:0">Disc images can be packed smaller: CHD for PlayStation 1 and 2, PSP (PPSSPP 1.17 and newer), Saturn, Dreamcast and more, RVZ for GameCube and Wii. The emulators read these directly. The originals go to <span class="mono">_converted/</span> until you have checked that the games still start.</p>
    <div class="files">${EV.convRoms().map(r=>{ const c=CHD_SYS[r.id], done=T.chdDone[r.id]||(r.n?0:-1), run=T.chdRun===r.id;
      return `<div class="frow"><span class="dot ${done?"on":""}"></span><div><div class="fn">${esc(r.name)} · ${c.from} → ${c.to}</div><div class="note">${done<0?`Already ${c.to}: ${r.already} game${r.already===1?"":"s"}`:done?`Done, saved ${size(done)}`:`${r.already?`${r.already} already ${c.to} · `:""}${r.n} games · ${size(r.mb)} → about ${size(Math.round(r.mb*(1-c.save)))}`}</div>${run?`<div class="prog" style="margin-top:6px"><i style="width:${T.chdPct||3}%"></i></div><div class="note">${esc(T.chdNow||"")}</div>`:""}${!done&&!run&&r.need?`<div class="note" style="color:var(--warn)">${r.need}</div>`:""}</div>
        ${done?`<span class="pill ok">done</span>`:`<button class="btn small" data-chd="${r.id}" ${T.chdRun?"disabled":""}>${run?"Converting…":"Convert"}</button>`}</div>`; }).join("")}</div>${EV.convertedHTML()}</div>`;
  // Verify
  const v=T.verify;
  h+=`<div class="sys-block tool" style="margin-top:12px"><header><div><h3>Check your files</h3><div class="used">Compare every ROM with the No-Intro and Redump lists</div></div><button class="btn small ${v?"":"primary"}" id="tv-run">${v?"Check again":"Check all files"}</button></header>
    ${v?`<div class="nums vnums"><div><b>${v.good.length}</b>good</div><div><b>${v.bad.length}</b>damaged</div><div><b>${v.incomplete.length}</b>incomplete</div><div><b>${v.unknown.length}</b>unknown</div><div><b>${v.fan.length}</b>translations, hacks</div></div>
      <div class="files">${[...v.bad.map(f=>["bad",f.name,f.sys,"Damaged copy. Replace it with a good dump of your own game."]), ...v.incomplete.map(f=>["warn",f.name,f.sys,f.note]), ...v.unknown.map(f=>["q",f.name,f.sys,"Not found in the database. It can be homebrew, a hack, or a file that was changed."]), ...v.fan.map(f=>["info",f.name,f.sys,"Fan translation or hack. Not in the database, which is normal."])].map(([k,n,s,note])=>`<div class="frow"><span class="ck ${k==="q"?"warn":k}">${k==="bad"?"✗":k==="info"?"i":"!"}</span><div><div class="fn">${esc(n)}</div><div class="note">roms/${esc(s)}/ · ${esc(note)}</div></div><span></span></div>`).join("")}</div>`
      :`<p class="hint" style="margin:0">Finds damaged copies, games with missing discs and files the database doesn't know, before a game crashes halfway.</p>`}${typeof EV!=="undefined"&&EV.listsHTML?EV.listsHTML():""}</div>`;
  // Frontends
  const fe=T.fe;
  h+=`<div class="sys-block tool" id="esde-tool" style="margin-top:12px"><header><div><h3>ES-DE</h3><div class="used">Your games in one menu, with covers and videos</div></div>${typeof EV!=="undefined"&&EV.esdePill?EV.esdePill():""}</header>
    <div class="files">
      ${typeof EV!=="undefined"&&EV.esdeHTML?EV.esdeHTML():""}
    </div></div>`;
  h+=`<div class="sys-block tool" id="rarch-tool" style="margin-top:12px"><header><div><h3>RetroArch</h3><div class="used">Plays most retro systems, in the vault with its cores and saves</div></div>${typeof EV!=="undefined"&&EV.rarchPill?EV.rarchPill():""}</header>
    ${typeof EV!=="undefined"&&EV.rarchHTML?EV.rarchHTML():""}</div>`;
  h+=`<div class="sys-block tool" id="vemu-tool" style="margin-top:12px"><header><div><h3>Emulators in the vault</h3><div class="used">PCSX2, DuckStation, Cemu… standalone, with their settings in the vault</div></div>${typeof EV!=="undefined"&&EV.vemuPill?EV.vemuPill():""}</header>
    ${typeof EV!=="undefined"&&EV.vemuHTML?EV.vemuHTML():""}</div>`;
  h+=artToolHTML();
  return h;
}
function bindTools(){
  const T=S.tools, re=()=>renderRoms(); bindArtTool();
  document.querySelectorAll("[data-chd]").forEach(b=>b.onclick=()=>EV.convert(b.dataset.chd)); 
  $("#tv-run").onclick=()=>{ T.verify=verifyRun(); log(`Files checked: ${T.verify.good.length} good, ${T.verify.bad.length} damaged, ${T.verify.incomplete.length} incomplete`); re(); };
  document.querySelectorAll("[data-fe]").forEach(b=>b.onclick=()=>{ const k=b.dataset.fe; if(k!=="art") return EV.frontend(k, b);
    if (k==="ra"){ T.fe.ra=new Set(S.romFiles.map(f=>f.sys)).size; log(`RetroArch: ${T.fe.ra} playlists written`); }
    if (k==="esde"){ T.fe.esde=true; log("ES-DE: game lists written"); }
    if (k==="art"){ T.fe.art="run"; re(); setTimeout(()=>{ T.fe.art="done"; log(`Box art downloaded for ${S.romFiles.length} games`); re(); },1000); return; }
    re(); });
}

const AOC_EMU=[{"id":"org.citra.emu","name":"Citra MMJ","url":"https://github.com/weihuoya/citra","pre":false},{"id":"org.dolphinemu.dolphinemu","name":"Dolphin Emulator","url":"https://dolphin-emu.org/update/latest/beta","pre":false},{"id":"org.dolphinemu.dolphinemu","name":"Dolphin Emulator (Development version)","url":"https://dolphin-emu.org/update/latest/dev","pre":false},{"id":"org.dolphinemu.mmjr","name":"Dolphin |MMJR2| VBI","url":"https://github.com/Medard22/Dolphin-MMJR2-VBI","pre":false},{"id":"io.github.lime3ds.android","name":"Lime3DS","url":"https://GitHub.com/lime3ds/lime3ds","pre":false},{"id":"me.magnum.melonds","name":"melonDS","url":"https://github.com/rafaelvcaetano/melonDS-android","pre":false},{"id":"me.magnum.melonds.nightly","name":"melonDS Nightly","url":"https://github.com/rafaelvcaetano/melonDS-android","pre":true},{"id":"com.virtualapplications.play","name":"Play!","url":"https://purei.org/downloads/play/stable/","pre":false},{"id":"org.ppsspp.ppsspp","name":"PPSSPP","url":"https://www.ppsspp.org/download/","pre":false},{"id":"org.ppsspp.ppssppvr","name":"PPSSPP VR","url":"https://www.ppsspp.org/download/","pre":false},{"id":"com.retroarch","name":"RetroArch","url":"https://buildbot.libretro.com/stable/","pre":false},{"id":"com.retroarch","name":"RetroArch","url":"https://buildbot.libretro.com/nightly/android/","pre":false},{"id":"com.retroarch.ra32","name":"RetroArch (32-bit)","url":"https://buildbot.libretro.com/stable/","pre":false},{"id":"com.retroarch.ra32","name":"RetroArch (32-bit)","url":"https://buildbot.libretro.com/nightly/android","pre":false},{"id":"com.retroarch.aarch64","name":"RetroArch (AArch64)","url":"https://buildbot.libretro.com/stable/","pre":false},{"id":"com.retroarch.aarch64","name":"RetroArch (AArch64)","url":"https://buildbot.libretro.com/nightly/android","pre":false},{"id":"org.vita3k.emulator","name":"Vita3K","url":"https://github.com/Vita3K/Vita3K-Android","pre":false},{"id":"com.winlator","name":"Winlator","url":"https://github.com/brunodev85/winlator","pre":false}];

// ---------------------------------------------------------------- Drives: read another drive, compare, copy what you miss
const FOLDER_ALIAS = {gba:"gba", "game boy advance":"gba", gbc:"gbc", gb:"gb", sfc:"snes", snes:"snes", "super nintendo":"snes", n64:"n64", "nintendo 64":"n64", ps:"psx", psx:"psx", ps1:"psx", playstation:"psx", ps2:"ps2", md:"megadrive", megadrive:"megadrive", genesis:"megadrive", fc:"nes", nes:"nes", nds:"nds", psp:"psp", dc:"dreamcast", dreamcast:"dreamcast"};
const mkDrive = (files) => files.map(([dir,name,mb,hash],i)=>({id:"d"+i+Math.random().toString(36).slice(2,5), dir, name, mb, hash:hash||("x-"+name)}));
S.drives = [
  {id:"t7", name:"Samsung T7 SSD", path:"/media/you/T7/Emulators", size:"1 TB", free:612000, layout:"ES-DE", scanned:false, files:mkDrive([
    ["roms/snes","Super Mario World (USA).sfc",0.5,"a1"],["roms/snes","Super Mario World (Europe) (Rev 1).sfc",0.5,"a2"],["roms/snes","Chrono Trigger (USA).sfc",4,"d1"],
    ["roms/snes","EarthBound (USA).sfc",3],["roms/snes","Donkey Kong Country 2 - Diddy's Kong Quest (USA) (En,Fr).sfc",4],["roms/snes","Final Fantasy III (USA).sfc",3],["roms/snes","Super Mario Kart (Europe).sfc",0.5],
    ["roms/snes","Donkey Kong Country (Japan).sfc",4],
    ["roms/n64","Super Mario 64 (USA).z64",8],["roms/n64","The Legend of Zelda - Ocarina of Time (USA) (Rev 2).z64",32],["roms/n64","Mario Kart 64 (USA).z64",12],["roms/n64","Star Fox 64 (USA) (Rev 1).z64",12],["roms/n64","GoldenEye 007 (USA).z64",12],["roms/n64","Banjo-Kazooie (USA).z64",16],
    ["roms/psx","Crash Bandicoot (USA).chd",378,"l2"],["roms/psx","Silent Hill (USA).chd",310],["roms/psx","Castlevania - Symphony of the Night (USA).chd",420],["roms/psx","Metal Gear Solid (Europe) (Disc 2).chd",460],
    ["roms/gba","The Legend of Zelda - The Minish Cap (Europe) (En,Fr,De,Es,It).gba",16],["roms/gba","Metroid Fusion (U) [b1].gba",8,"h9"],["roms/gba","mystery_game.gba",4],
    ["bios/psx","scph5500.bin",0.5],["bios/segacd","bios_CD_E.bin",0.1],["bios/atarilynx","lynxboot.img",0.1],
  ])},
  {id:"sd", name:"SD card from your handheld", path:"/media/you/1234-ABCD/Roms", size:"256 GB", free:41000, layout:"handheld (muOS / Knulli style)", scanned:false, files:mkDrive([
    ["Roms/GBA","Golden Sun (USA, Europe).gba",8],["Roms/GBA","Advance Wars (USA).gba",8],["Roms/SFC","Super Mario World (USA).sfc",0.5,"a1"],["Roms/SFC","Kirby Super Star (USA).sfc",4],
    ["Roms/PS","Crash Bandicoot (USA).chd",378,"l2"],["Roms/PS","Spyro the Dragon (USA).chd",360],["Roms/MD","Sonic The Hedgehog 2 (World).md",1],
  ])},
];
S.drv = {sel:null, dir:"in", pick:new Set(), copying:null, done:null};
function driveSys(dir){
  const parts=dir.split("/"); const top=parts[0].toLowerCase(), sub=(parts[1]||"").toLowerCase();
  if (top==="bios") return {kind:"bios", sys:sub};
  return {kind:"rom", sys:FOLDER_ALIAS[sub]||matchSystem(sub)||sub};
}
function classifyDrive(drv){
  const out=[];
  for (const f of drv.files){
    const loc=driveSys(f.dir);
    if (loc.kind==="bios"){
      const e=biosFor(loc.sys), known=e.files.find(x=>x.f.toLowerCase()===f.name.toLowerCase());
      const have=S.biosHave.has(`${loc.sys}/${known?known.f:f.name}`);
      out.push({f, sys:loc.sys, kind:"bios", cat:have?"have":"bios", why:have?"You already have this BIOS file.":`BIOS for ${biosName(loc.sys)} that you are missing.`, check:!have});
      continue;
    }
    const p=parseRom(f.name), sys=loc.sys;
    const owned=S.romFiles.filter(x=>x.sys===sys).map(x=>({x,p:parseFile(x)})).filter(o=>o.p.key===p.key && !o.p.special.length);
    let cat, why, check;
    if (p.bad){ cat="check"; why="Damaged copy ([b] in the name). Better not to copy."; check=false; }
    else if (owned.some(o=>o.x.hash===f.hash)){ cat="have"; why="You already have exactly this file."; check=false; }
    else if (!GAMEINDEX.some(i=>i.id===sys) && !S.roms.some(r=>r.id===sys)){ cat="check"; why=`Folder ${f.dir}/ is not a known system.`; check=false; }
    else if (p.disc && owned.length && !owned.some(o=>o.p.disc===p.disc)){ cat="better"; why=`Completes your copy: you have ${owned.map(o=>`Disc ${o.p.disc||1}`).join(", ")}, this is Disc ${p.disc}.`; check=true; }
    else if (owned.length){
      const nr=regionRank(p.regions.map(r=>r)), or=Math.min(...owned.map(o=>regionRank(o.p.regions)));
      if (nr<or){ cat="better"; why=`Fits your region rule better than ${owned[0].x.name}.`; check=true; }
      else { cat="other"; why=`You already have ${owned.map(o=>o.x.name).join(", ")}.`; check=false; }
    }
    else if (!LISTS[sys] || !LISTS[sys].some(g=>ckey(g[0])===p.key)){ cat=LISTS[sys]?"check":"new"; why=LISTS[sys]?"Not in the game list for this system. Could be homebrew or a renamed file.":"New for your library."; check=!LISTS[sys]; }
    else { cat="new"; why="New for your library."; check=true; }
    out.push({f, sys, kind:"rom", cat, why, check, p});
  }
  return out;
}
function driveMissing(drv){
  // the other direction: games in your vault that the drive doesn't have
  const onDrive=new Set(drv.files.map(f=>{ const l=driveSys(f.dir); return l.sys+"|"+parseRom(f.name).key; }));
  return S.romFiles.filter(x=>!onDrive.has(x.sys+"|"+parseFile(x).key)).map(x=>({f:{id:"v-"+x.id, name:x.name, mb:x.mb, dir:`roms/${x.sys}`, path:x.loc}, sys:x.sys, kind:"rom", cat:"todrive", why:"Not on this drive yet.", check:!parseFile(x).special.length&&!parseFile(x).bad}));
}
async function scanDrive(drv){
  await EV.readDrive(drv);
  const syss=[...new Set(drv.files.map(f=>driveSys(f.dir)).filter(l=>l.kind==="rom").map(l=>l.sys))].filter(s=>GI[s]);
  for (const s of syss){ try{ await loadList(s); }catch(e){} }
  drv.scanned=true; drv.items=classifyDrive(drv);
  S.drv.pick=new Set(drv.items.filter(i=>i.check).map(i=>i.f.id));
  log(`Drive scanned: ${drv.name} · ${drv.files.length} files`);
}
function drvPath(drv, f, dir){
  if (dir==="out") return `${S.dir}/${f.dir}/${f.name}`;
  const top=f.dir.split("/")[0], root=drv.path.endsWith("/"+top)?drv.path.slice(0,-(top.length+1)):drv.path;
  return `${root}/${f.dir}/${f.name}`;
}
function renderDrives(el){
  const D=S.drv, drv=S.drives.find(d=>d.id===D.sel);
  let h=`<div class="dupsum"><div class="nums"><div><b>${S.drives.length}</b>drives found</div></div>
    <p class="hint">Plug in an external drive, SSD or SD card. The app reads its folders, also when they use other names than yours (like <span class="mono">Roms/GBA</span> or <span class="mono">Roms/SFC</span> on a handheld), and shows what you don't have yet. Nothing on the drive is changed or deleted.</p>
    <div class="gact"><button class="btn small" id="drv-pick">Choose another folder…</button></div></div>
    <div class="sysgrid" style="margin-top:12px">${S.drives.map(d=>`<button class="syscard ${D.sel===d.id?"selcard":""}" data-drv="${d.id}"><span class="sn">${esc(d.name)}</span><span class="sc mono" style="overflow-wrap:anywhere">${esc(d.path)}</span><span class="sc">${esc(d.size)} · ${size(d.free)} free</span><span class="src">${esc(d.layout)} · ${d.scanned?`${d.files.length} files read`:"not read yet"}</span></button>`).join("")}</div>`;
  if (drv){
    if (!drv.scanned){ h+=`<div class="empty-state" style="margin-top:12px">Reading ${esc(drv.name)}…</div>`; el.innerHTML=h; bindDrives(el); scanDrive(drv).then(()=>renderRoms()); return; }
    const items = D.dir==="in" ? drv.items : driveMissing(drv);
    const folders=[...new Set(drv.files.map(f=>f.dir))];
    h+=`<div class="sys-block" style="margin-top:12px"><header><div><h3>${esc(drv.name)}</h3><div class="used">${drv.files.length} files · ${esc(drv.layout)}</div></div>
        <div class="seg" role="group"><button data-ddir="in" aria-pressed="${D.dir==="in"}">Copy to my library</button><button data-ddir="out" aria-pressed="${D.dir==="out"}">Copy to this drive</button></div></header>
      <details class="codes"><summary>How the folders were read</summary><div class="tscroll"><table><thead><tr><th>Folder on the drive</th><th>Your library</th></tr></thead><tbody>${folders.map(f=>{const l=driveSys(f); return `<tr><td class="mono">${esc(f)}/</td><td>${l.kind==="bios"?`BIOS · ${esc(biosName(l.sys))}`:GI[l.sys]?`<span class="mono">roms/${esc(l.sys)}/</span> · ${esc(sysLabel(GI[l.sys]))}`:`<span class="pill warn">unknown</span>`}</td></tr>`;}).join("")}</tbody></table></div></details>`;
    const CATS2 = D.dir==="in" ? [["new","New for your library"],["better","Better than, or completes, what you have"],["bios","BIOS files you are missing"],["other","Other versions of games you have"],["check","Check first"],["have","Already in your library"]] : [["todrive","In your library, not on this drive"]];
    for (const [k,title] of CATS2){
      const list=items.filter(i=>i.cat===k); if(!list.length) continue;
      const bySys={}; list.forEach(i=>(bySys[i.sys] ||= []).push(i));
      const allOn=list.every(i=>D.pick.has(i.f.id));
      h+=`<div class="group" style="margin-top:12px"><h2 style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span>${title} · ${list.length}</span>${k!=="have"?`<button class="linkbtn" data-dall="${k}">${allOn?"Select none":"Select all"}</button>`:""}</h2><div class="ftable">`;
      for (const [s,arr] of Object.entries(bySys)){
        h+=`<div class="frow2" style="grid-template-columns:minmax(0,1fr);background:var(--bg)"><b style="font-size:13px">${esc(k==="bios"?biosName(s):GI[s]?sysLabel(GI[s]):s)}</b></div>`;
        h+=arr.map(i=>`<div class="frow2 ${D.pick.has(i.f.id)?"sel":""}"><input type="checkbox" data-dpick="${i.f.id}" ${D.pick.has(i.f.id)?"checked":""} ${k==="have"?"disabled":""} aria-label="Copy ${esc(i.f.name)}">
          <div class="fmain"><div class="fn">${esc(i.f.name)}</div><div class="meta">${i.p?flags(i.p.regions):""} <span>${size(Math.max(1,Math.round(i.f.mb)))}</span> <span>${esc(i.why)}</span> ${locLink(drvPath(drv, i.f, D.dir))}</div></div><span></span></div>`).join("");
      }
      h+=`</div></div>`;
    }
    const sel=items.filter(i=>D.pick.has(i.f.id)), mb=sel.reduce((a,i)=>a+i.f.mb,0);
    const room = D.dir==="out" ? drv.free : 999999;
    if (D.copying) h+=`<div class="sticky-act"><span>Copying ${D.copying.n} files…</span><div class="prog" style="flex:1;min-width:120px;background:var(--muted)"><i style="width:60%"></i></div></div>`;
    else if (sel.length) h+=`<div class="sticky-act"><span>${sel.length} files · ${size(Math.max(1,Math.round(mb)))}${D.dir==="out"&&mb>room?` · <b>not enough space on the drive</b>`:""}</span><button class="btn primary" id="drv-copy" ${D.dir==="out"&&mb>room?"disabled":""}>${D.dir==="in"?"Copy to my library":"Copy to the drive"}</button></div>`;
    if (D.done) h+=`<div class="verdict ok" style="margin-top:10px"><b>${D.done}</b></div>`;
  }
  el.innerHTML=h; bindDrives(el);
}
function bindDrives(el){
  const D=S.drv, re=()=>renderRoms();
  el.querySelectorAll("[data-drv]").forEach(b=>b.onclick=()=>{ D.sel=b.dataset.drv; D.dir="in"; D.done=null; const drv=S.drives.find(d=>d.id===D.sel); if(drv.scanned) D.pick=new Set(drv.items.filter(i=>i.check).map(i=>i.f.id)); re(); });
  el.querySelectorAll("[data-ddir]").forEach(b=>b.onclick=()=>{ D.dir=b.dataset.ddir; D.done=null; const drv=S.drives.find(d=>d.id===D.sel); D.pick=new Set((D.dir==="in"?drv.items:driveMissing(drv)).filter(i=>i.check).map(i=>i.f.id)); re(); });
  el.querySelectorAll("[data-dpick]").forEach(c=>c.onchange=()=>{ c.checked?D.pick.add(c.dataset.dpick):D.pick.delete(c.dataset.dpick); re(); });
  el.querySelectorAll("[data-dall]").forEach(b=>b.onclick=()=>{ const drv=S.drives.find(d=>d.id===D.sel); const list=(D.dir==="in"?drv.items:driveMissing(drv)).filter(i=>i.cat===b.dataset.dall); const allOn=list.every(i=>D.pick.has(i.f.id)); list.forEach(i=>allOn?D.pick.delete(i.f.id):D.pick.add(i.f.id)); re(); });
  const pk=el.querySelector("#drv-pick"); if(pk) pk.onclick=()=>EV.pickDrive();
  const cp=el.querySelector("#drv-copy"); if(cp) cp.onclick=()=>{
    const drv=S.drives.find(d=>d.id===D.sel), items=(D.dir==="in"?drv.items:driveMissing(drv)).filter(i=>D.pick.has(i.f.id));
    D.copying={n:items.length}; re();
    setTimeout(()=>{
      let roms=0, bios=0;
      if (D.dir==="in") items.forEach(i=>{
        if (i.kind==="bios"){ const e=biosFor(i.sys), k=e.files.find(x=>x.f.toLowerCase()===i.f.name.toLowerCase()); S.biosHave.add(`${i.sys}/${k?k.f:i.f.name}`); EV.queue({kind:"copy", from:i.f.path, to:`${EV.root()}/bios/${i.sys}/${k?k.f:i.f.name}`}); bios++; return; }
        S.romFiles.push({id:"c"+i.f.id, sys:i.sys, name:i.f.name, mb:i.f.mb, hash:i.f.hash, src:i.f.path, srcKind:"copy", origSys:i.sys, rel:""}); if (S.art.auto && artReady() && i.cat!=='check') S.art.got.add("c"+i.f.id); roms++;
        let r=S.roms.find(x=>x.id===i.sys); if(!r && GI[i.sys]){ r={id:i.sys, name:sysLabel(GI[i.sys]), ext:"", n:0, mb:0}; S.roms.push(r); } if(r){ r.n++; r.mb=Math.round(r.mb+i.f.mb); }
      });
      else items.forEach(i=>{ drv.files.push({id:"d"+i.f.id, dir:`roms/${i.sys}`, name:i.f.name, mb:i.f.mb, hash:i.f.hash, path:`${drv.path}/roms/${i.sys}/${i.f.name}`}); EV.queue({kind:"copy", from:i.f.path, to:`${drv.path}/roms/${i.sys}/${i.f.name}`}); drv.free-=i.f.mb; roms++; });
      if (D.dir==="in"){ drv.items=classifyDrive(drv); }
      D.copying=null; D.pick=new Set(); D.done = D.dir==="in" ? `Copied ${roms} game(s)${bios?` and ${bios} BIOS file(s)`:""} to your library. They are in your Collection now.` : `Copied ${roms} game(s) to ${drv.name}.`;
      log(D.done); toast(D.done); renderAll();
    },900);
  };
}

// ---------------------------------------------------------------- open file location
const romPath = (sys, name, trash) => `${S.dir}/roms/${sys}/${trash?"_duplicates/":""}${name}`;
const locBtns = (full, small) => `<span class="locbtns"><button class="${small?"linkbtn":"btn small"}" data-loc="${esc(full)}">Open folder</button><button class="${small?"linkbtn":"btn small"}" data-copy="${esc(full)}">Copy path</button></span>`;
const locLink = full => `<button class="linkbtn loclink" data-loc="${esc(full)}" title="Open the folder that holds this file">Open folder</button>`;
document.addEventListener("click", ev=>{
  const o=ev.target.closest("[data-loc]"), c=ev.target.closest("[data-copy]");
  if (!o && !c) return;
  ev.preventDefault(); ev.stopPropagation();
  if (o){
    const full=o.dataset.loc, isDir=full.endsWith("/"), folder=isDir?full:full.slice(0,full.lastIndexOf("/")+1), file=isDir?"":full.slice(full.lastIndexOf("/")+1);
    log(`Open folder: ${folder}`);
    toast(file?`Opens ${folder} in your file manager, with ${file} selected.`:`Opens ${folder} in your file manager.`);
  } else {
    const full=c.dataset.copy;
    const ok=()=>toast("Path copied"), fail=()=>toast(`Copy this path: ${full}`);
    try{ navigator.clipboard.writeText(full).then(ok).catch(fail); }catch(e){ fail(); }
  }
}, true);

// ---------------------------------------------------------------- Box art (ScreenScraper + libretro-thumbnails)
S.art = {show:true, source:"both", user:"", signedIn:false, threads:1, quota:50000, used:0,
  media:{front:true, back:false, box3d:false, ss:false, title:false, wheel:false, video:false, manual:false},
  size:"600", dest:{esde:true, ra:true, batocera:false, muos:false, pegasus:false}, auto:true, got:new Set(), run:null, last:null};
S.romFiles.forEach(f=>{ const p=parseFile(f); if(!p.special.length && !p.bad && f.name!=="rom1.sfc" && !["psx","megadrive"].includes(f.sys)) S.art.got.add(f.id); });
const ART_DEST = [
  ["esde","ES-DE","media/<system>/covers/<rom name>.png","Named after your ROM file. Point ES-DE's media folder here."],
  ["ra","RetroArch","thumbnails/<playlist>/Named_Boxarts/<game name>.png","Uses the official game name, with & * / : < > ? \\ | replaced by _ as RetroArch expects."],
  ["batocera","Batocera / Knulli","roms/<system>/images/<rom name>-image.png","The app also writes gamelist.xml with an <image> line per game."],
  ["muos","muOS","MUOS/info/catalogue/<system>/box/<rom name>.png","Copy the MUOS folder to the SD card of your handheld."],
  ["pegasus","Pegasus","media/<rom name>/boxFront.png","Next to your ROMs, in Pegasus's own media layout."],
];
const ART_MEDIA = [["front","Front cover","100–300 KB per game"],["back","Back cover","100–300 KB"],["box3d","3D box","200–500 KB"],["ss","Screenshot","50–150 KB"],["title","Title screen","50–150 KB"],["wheel","Logo (wheel)","20–80 KB"],["video","Video preview","1–5 MB"],["manual","Manual (PDF)","2–20 MB"]];
const SYS_SHORT = {snes:"SNES",nes:"NES",gb:"GB",gbc:"GBC",gba:"GBA",n64:"N64",nds:"DS","3ds":"3DS",gc:"GC",wii:"WII",psx:"PS1",ps2:"PS2",ps3:"PS3",psp:"PSP",megadrive:"MD",mastersystem:"SMS",gamegear:"GG",saturn:"SAT",dreamcast:"DC",segacd:"SCD",xbox:"XBOX",pcengine:"PCE",neogeo:"NEO",arcade:"ARC"};
const sysHue = s => { let h=0; for (const c of s) h=(h*31+c.charCodeAt(0))%360; return h; };
const hasCover = f => S.art.got.has(f.id);
function coverHTML(sys, title, opt={}){
  if (opt.none) return `<span class="cov ${opt.big?"big":""} none" aria-hidden="true">${opt.missing?(opt.big?"not in your collection":""):"no cover yet"}</span>`;
  const short=SYS_SHORT[sys]||String(sys).slice(0,4).toUpperCase();
  return `<span class="cov ${opt.big?"big":""}" style="--h:${sysHue(sys)+(opt.shift||0)}" aria-hidden="true"><b>${esc(short)}</b><i>${esc(title)}</i>${opt.reg?`<em>${esc(opt.reg)}</em>`:""}</span>`;
}
const artNeedsSS = () => S.art.source!=="libretro";
const artReady = () => !artNeedsSS() || S.art.signedIn;
function artTargets(){ return S.romFiles.filter(f=>{ const p=parseFile(f); return !p.special.length && !p.bad && !hasCover(f); }); }
function artCountable(){ return S.romFiles.filter(f=>{ const p=parseFile(f); return !p.special.length && !p.bad; }); }

function artSettingsHTML(){
  const A=S.art;
  const seg2=(name,opts,val)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-${name}="${v}" aria-pressed="${v===val}">${l}</button>`).join("")}</div>`;
  const acct = A.signedIn
    ? `<div class="verdict ok"><b>Signed in as ${esc(A.user)}.</b> Your account allows ${A.threads} downloads at the same time and ${nl(A.quota)} requests a day. Used today: ${nl(A.used)}. <button class="linkbtn" id="ss-out">Sign out</button></div>`
    : `<div class="q"><label for="ss-user">ScreenScraper user name</label><input type="text" id="ss-user" autocomplete="username" value="${esc(A.user)}"></div>
       <div class="q"><label for="ss-pass">Password</label><input type="password" id="ss-pass" autocomplete="current-password"></div>
       ${A.err?`<div class="err" role="alert">${esc(A.err)}</div>`:""}
       <div class="gact"><button class="btn primary small" id="ss-in">Sign in</button><a href="https://www.screenscraper.fr" target="_blank" rel="noopener" class="linkbtn" style="align-self:center">Make a free account</a></div>
       <p class="hint" style="margin:0">Your password stays on this device. With your own account you get your own daily limit and more downloads at the same time.</p>`;
  return `<div class="form set-sec" id="art-sec"><h2>Box art</h2>
    <div class="field"><label class="inline" for="art-show"><input type="checkbox" id="art-show" ${A.show?"checked":""}> Show covers in Emu Vault</label>
      <p class="hint">Shows the covers next to your games in Collection and Files, with a cover grid in Collection.</p></div>
    <div class="field"><span class="lbl">Where covers come from</span>${seg2("artsrc",[["ss","ScreenScraper"],["both","ScreenScraper, then libretro"],["libretro","libretro-thumbnails"]],A.source)}
      <p class="hint">ScreenScraper finds games by their fingerprint, so odd file names don't matter. libretro-thumbnails needs no account but matches by name.${A.source==="both"?" With both, what ScreenScraper can't find is looked up at libretro.":""}</p></div>
    ${artNeedsSS()?`<div class="field"><span class="lbl">ScreenScraper account</span>${acct}</div>`:""}
    <div class="field"><span class="lbl">What to download</span>
      <div class="toggles">${ART_MEDIA.map(([k,l,s])=>`<label><input type="checkbox" data-artm="${k}" ${A.media[k]?"checked":""}> ${l} <span class="muted" style="font-size:12px">${s}</span></label>`).join("")}</div>
      <p class="hint">Only the front cover is on: fast, small, and easy on your daily limit (about 2 requests per game).</p></div>
    ${typeof EV!=="undefined"&&EV.shapeSettingsHTML?EV.shapeSettingsHTML():""}
    <div class="field"><span class="lbl">Cover region</span><p class="hint" style="margin:0">Follows your region rule: <b>${esc(regionRule())}</b>, then World, then any region.</p></div>
    <div class="field"><span class="lbl">Size</span>${seg2("artsize",[["full","Original"],["600","600 px wide"],["300","300 px wide"]],A.size)}
      <p class="hint">${A.size==="full"?"Original scans: best quality, about 300 KB per cover.":A.size==="600"?"Sharp on phones and handhelds, about 80 KB per cover.":"Small and light, about 30 KB per cover. Fine for lists."}</p></div>
    <div class="field"><span class="lbl">Ready for these frontends</span>
      <div class="rows">${ART_DEST.map(([k,l,p,n])=>`<label class="opt ${A.dest[k]?"":"dim"}"><input type="checkbox" data-artd="${k}" ${A.dest[k]?"checked":""}><span><b style="font-size:14px">${l}</b><br><span class="mono" style="font-size:12px;overflow-wrap:anywhere">${esc(p)}</span><br><span class="muted" style="font-size:12px">${esc(n)}</span></span><span></span></label>`).join("")}</div>
      <p class="hint">Each cover is downloaded once into <span class="mono">${esc(S.dir)}/media/</span>. For the other frontends the app adds links to that file instead of copies, so it takes no extra space. On drives that don't support links (like FAT32 SD cards), it copies.</p></div>
    <div class="field"><label class="inline" for="art-auto"><input type="checkbox" id="art-auto" ${A.auto?"checked":""}> Download covers for new games automatically</label>
      <p class="hint">On: when games are added (from the inbox, a drive, or by hand), their covers come in the background. Covers that weren't found aren't asked for again; "Download missing covers" tries all of them again.</p></div>
    <div class="gact"><button class="btn small" id="art-go">Download missing covers</button></div>
  </div>`;
}
function bindArtSettings(){
  const A=S.art, re=()=>{ renderSet(); };
  const on=(sel,ev,fn)=>{ const el=$(sel); if(el) el[ev]=fn; };
  on("#art-show","onchange",e=>{ A.show=e.target.checked; log(A.show?"Covers shown in the app":"Covers hidden in the app"); renderRoms(); renderColl(); });
  document.querySelectorAll("[data-artsrc]").forEach(b=>b.onclick=()=>{ A.source=b.dataset.artsrc; re(); });
  document.querySelectorAll("[data-artsize]").forEach(b=>b.onclick=()=>{ A.size=b.dataset.artsize; re(); });
  document.querySelectorAll("[data-artd]").forEach(c=>c.onchange=()=>{ A.dest[c.dataset.artd]=c.checked; re(); });
  document.querySelectorAll("[data-artm]").forEach(c=>c.onchange=()=>{ A.media[c.dataset.artm]=c.checked; });
  on("#art-auto","onchange",e=>{ A.auto=e.target.checked; });
  on("#ss-user","oninput",e=>{ A.user=e.target.value; A.err=""; });
  on("#ss-in","onclick",()=>{ A.err="Signing in to ScreenScraper needs a developer key that Emu Vault doesn't have yet. Use libretro-thumbnails for now: it needs no account."; return re(); }); 
  on("#ss-out","onclick",()=>{ A.signedIn=false; A.threads=1; log("ScreenScraper: signed out"); re(); renderRoms(); });
  on("#art-go","onclick",()=>{ document.querySelector('.tab[data-tab="roms"]').click(); S.romView="tools"; renderRoms(); setTimeout(()=>{ const el=$("#art-tool"); if(el) el.scrollIntoView({block:"start"}); },30); });
}
function artToolHTML(){
  const A=S.art, all=artCountable(), miss=artTargets(), have=all.length-miss.length, R=A.run;
  const src = A.source==="ss"?"ScreenScraper":A.source==="libretro"?"libretro-thumbnails":"ScreenScraper, then libretro";
  const what = ART_MEDIA.filter(([k])=>A.media[k]).map(([,l])=>l.toLowerCase()).join(", ")||"nothing selected";
  let h=`<div class="sys-block tool" id="art-tool" style="margin-top:12px"><header><div><h3>Box art</h3><div class="used">${esc(what)} · from ${esc(src)} · for ${ART_DEST.filter(([k])=>A.dest[k]).map(([,l])=>l).join(", ")||"no frontend selected"}</div></div>${miss.length?`<span class="pill warn">${miss.length} missing</span>`:`<span class="pill ok">all covers</span>`}</header>
    <div class="pbar"><i style="width:${all.length?have/all.length*100:0}%"></i></div>
    <p class="hint" style="margin:0">${have} of ${all.length} games have a cover. Translations, hacks and damaged files are skipped.</p>
    <label class="inline" for="art-auto2" style="font-size:13px"><input type="checkbox" id="art-auto2" ${A.auto?"checked":""}> Download covers for new games automatically</label>`;
  if (R) h+=`<p class="hint" style="margin:0">Downloading ${R.done} of ${R.total} · ${A.threads} at a time · requests today ${nl(A.used)} of ${nl(A.quota)}</p><div class="prog"><i style="width:${R.total?R.done/R.total*100:0}%"></i></div>`;
  else if (!artReady()) h+=`<div class="verdict warn"><b>Sign in to ScreenScraper first.</b> Or switch to libretro-thumbnails, which needs no account. <button class="linkbtn" id="art-set">Open Box art settings</button></div>`;
  else h+=`<div class="gact"><button class="btn ${miss.length?"primary":""} small" id="art-run" ${miss.length?"":"disabled"}>${!miss.length?"Nothing to download":A.last&&miss.every(f=>A.last.nf.includes(f.name))?`Try again (${miss.length})`:`Download ${miss.length} missing cover${miss.length>1?"s":""}`}</button><button class="linkbtn" id="art-set">Settings</button></div>`;
  if (A.last && !R) h+=`<div class="verdict ${A.last.nf.length?"warn":"ok"}"><b>${A.last.ok} cover${A.last.ok===1?"":"s"} downloaded</b>${A.last.lr?` (${A.last.lr} from libretro)`:""} · ${A.last.req} requests used.${A.last.nf.length?` Not found: ${A.last.nf.map(n=>`<span class="mono">${esc(n)}</span>`).join(", ")}. Rename the file to its official name, or drop a cover image in the covers folder yourself.`:""}</div>`;
  return h+`</div>`;
}
function bindArtTool(){
  const A=S.art, re=()=>renderRoms();
  const st=$("#art-set"); if(st) st.onclick=()=>{ document.querySelector('.tab[data-tab="set"]').click(); setTimeout(()=>{ const el=$("#art-sec"); if(el) el.scrollIntoView({block:"start"}); },30); };
  const rn=$("#art-run"); if(rn) rn.onclick=()=>EV.covers(); 
}

// ---------------------------------------------------------------- Calm layout: fold away what you don't need right now
S.ui = {open:new Set()};
const isOpen = k => S.ui.open.has(k);
document.addEventListener("toggle", e=>{ const d=e.target; if(!(d instanceof HTMLDetailsElement) || !d.dataset.k) return; d.open ? S.ui.open.add(d.dataset.k) : S.ui.open.delete(d.dataset.k); }, true);
const SET_SUB = {
  "Look": ()=>document.documentElement.dataset.skin==="modern"?"Modern":"Retro 83",
  "Emu Vault": ()=>`v${S.self.ver}${selfUpdateAvailable()?` · v${S.self.latest.ver} available`:""}`,
  "Add your own": ()=>"Apps, BIOS systems, ROM folders, lists",
  "Box art": ()=>`${S.art.source==="libretro"?"libretro-thumbnails":"ScreenScraper"}${artNeedsSS()?(S.art.signedIn?` · signed in as ${S.art.user}`:" · not signed in"):""}${S.art.show?" · covers shown":""}`,
  "Which region do you keep?": ()=>regionRule(),
  "Folders & downloads": ()=>`${S.dir} · keep ${S.keep} versions`,
};
const SET_ALERT = { "Emu Vault": ()=>selfUpdateAvailable(), "Box art": ()=>artNeedsSS() && !S.art.signedIn };
function tidy(root){
  // 1. Settings: one accordion per section
  const set=root.querySelector("#view-set > div");
  if (set) [...set.children].filter(f=>f.classList.contains("form") && !f.dataset.t).forEach(f=>{
    f.dataset.t="1";
    const h=f.querySelector(":scope > h2"); let title=h?h.textContent.trim():(f.querySelector(".lbl")?.textContent.trim()||"Settings");
    if (!h) title = f.querySelector("[data-skin]") ? "Look" : "Folders & downloads";
    if (h) h.remove();
    if (title==="Look"){ const l=f.querySelector(".lbl"); if(l && l.textContent.trim()==="Look") l.remove(); }
    const d=document.createElement("details"); d.className="fold2 setfold"; d.dataset.k="set:"+title; d.open=isOpen(d.dataset.k);
    const sub=SET_SUB[title]?SET_SUB[title]():"", alert=SET_ALERT[title]&&SET_ALERT[title]();
    d.innerHTML=`<summary><span class="ft">${esc(title)}${alert?` <span class="dotalert" aria-label="needs attention"></span>`:""}</span><span class="fs">${esc(sub)}</span></summary>`;
    f.replaceWith(d); d.appendChild(f); f.classList.add("inner");
  });
  // 2. Long explanations at the top of a screen go under "How this works"
  root.querySelectorAll(".dupsum:not([data-t])").forEach(box=>{
    box.dataset.t="1";
    const ps=[...box.children].filter(c=>c.matches("p.hint:not(.keep)") && !c.querySelector("button,input,select,a.btn") && c.textContent.trim().length>70);
    if (!ps.length) return; const p=ps[0];
    const d=document.createElement("details"); d.className="howto"; d.dataset.k="how:"+(document.querySelector('.tab[aria-selected="true"]')?.dataset.tab||"")+":"+(S.romView||""); d.open=isOpen(d.dataset.k);
    d.innerHTML="<summary>How this works</summary>"; p.replaceWith(d); ps.forEach(x=>d.appendChild(x));
  });
  // 3. Region switches and extra filters go under "Filters"
  root.querySelectorAll(".regtog:not([data-t])").forEach(rt=>{
    rt.dataset.t="1";
    const on=["US","EU","JP","OV"].filter(r=>S.coll.regs[r]);
    const d=document.createElement("details"); d.className="filt"; d.dataset.k="filt:"+(S.coll.view||""); d.open=isOpen(d.dataset.k);
    d.innerHTML=`<summary>Filters <span class="fs">${on.length===4?"all regions":on.length?on.map(r=>GROUP_NAMES[r]).join(", "):"no regions"}${S.coll.unl||S.coll.test?" · extras on":""}</span></summary>`;
    const hint=rt.nextElementSibling&&rt.nextElementSibling.matches("p.hint")?rt.nextElementSibling:null;
    const extra=rt.parentElement.querySelector(":scope > .chips .inline-t")?.closest(".chips");
    rt.replaceWith(d); d.appendChild(rt); if(hint) d.appendChild(hint); if(extra) d.appendChild(extra);
  });
  // 4. Blocks in BIOS, Backups and Tools fold to their header
  root.querySelectorAll('#view-bios .sys-block[data-bios]:not([data-t]), #view-bk .sys-block[id^="bk-"]:not([data-t]), #view-roms .sys-block.tool:not([data-t])').forEach(b=>{
    b.dataset.t="1"; const head=b.querySelector(":scope > header"); if(!head) return;
    const k="blk:"+(b.dataset.bios||b.id||head.textContent.trim().slice(0,30));
    b.classList.add("fold"); if(isOpen(k)) b.classList.add("open");
    head.setAttribute("role","button"); head.tabIndex=0; head.setAttribute("aria-expanded", b.classList.contains("open"));
    const tg=()=>{ b.classList.toggle("open"); const o=b.classList.contains("open"); head.setAttribute("aria-expanded",o); o?S.ui.open.add(k):S.ui.open.delete(k); };
    head.addEventListener("click", e=>{ if(e.target.closest("button,a,input,label,select")) return; tg(); });
    head.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); tg(); } });
  });
}
let tidyQueued=false;
new MutationObserver(()=>{ if(tidyQueued) return; tidyQueued=true; queueMicrotask(()=>{ tidyQueued=false; tidy(document); }); }).observe(document.querySelector("main.app"), {childList:true, subtree:true});

function renderRoms(){
  const groups=findDups();
  const sub=`<div class="subtabs" role="group">
    <button data-rv="overzicht" aria-pressed="${S.romView==="overzicht"}">Overview</button>
    <button data-rv="bestanden" aria-pressed="${S.romView==="bestanden"}">Files</button>
    <button data-rv="dubbels" aria-pressed="${S.romView==="dubbels"}">Duplicates<span class="n">${groups.length}</span></button>
    <button data-rv="inbox" aria-pressed="${S.romView==="inbox"}">Inbox<span class="n">${S.inbox.length||""}</span></button>
    <button data-rv="drives" aria-pressed="${S.romView==="drives"}">Drives</button>
    <button data-rv="tools" aria-pressed="${S.romView==="tools"}">Tools</button></div>`;
  if (S.romView==="dubbels"){ $("#view-roms").innerHTML=sub+renderDups(); bindDups(); }
  else if (S.romView==="bestanden"){ $("#view-roms").innerHTML=sub+renderFiles(); bindFiles(); }
  else if (S.romView==="drives"){ $("#view-roms").innerHTML=sub+`<div id="drv-box"></div>`; renderDrives($("#drv-box")); }
  else if (S.romView==="tools"){ $("#view-roms").innerHTML=sub+renderTools(); bindTools(); }
  else if (S.romView==="inbox"){ $("#view-roms").innerHTML=sub+`<div id="inbox-box"><div class="empty-state">Checking new files…</div></div>`; renderInbox($("#inbox-box")); }
  else {
    const tot=S.roms.reduce((a,r)=>a+r.mb,0);
    let h=sub+`<div class="bar" style="margin-bottom:12px"><span class="muted" style="font-size:13px">ROMs are stored per system in <span class="mono">${esc(S.dir)}/roms/</span> · ${size(tot)} in total. Folder names follow ES-DE, so frontends find them right away.</span>
      <span class="gact">${S.inbox.length?`<button class="btn primary small" id="go-inbox">${S.inbox.length} new files in your inbox</button>`:""}${groups.length?`<button class="btn small" id="go-dups">Review ${groups.length} games with duplicates</button>`:""}</span></div>${typeof EV!=="undefined"&&EV.readyHTML?EV.readyHTML():""}<div class="grid2">`;
    for (const r of S.roms){
      const dn=groups.filter(g=>g.sys===r.id).length, has=S.romFiles.some(f=>f.sys===r.id);
      h+=`<div class="rom" data-rom="${r.id}">
        <h3 style="font-size:15px;font-weight:600">${esc(r.name)} ${r.mine?`<span class="pill mine">custom</span>`:""}</h3>
        <div><span class="count">${r.n}</span> <span class="muted">games · ${size(r.mb)}</span></div>
        <div class="ext">roms/${r.id}/ · ${esc(r.ext)}</div>
        <div>${biosChip(r.id)}</div>
        <div class="gact">${has?`<button class="linkbtn" data-open="${r.id}">Show files</button>`:""}${locLink(`${S.dir}/roms/${r.id}/`)}${dn?`<button class="linkbtn" data-dsys="${r.id}">${dn} with duplicates</button>`:""}</div>
        <div class="drop" style="padding:6px"><label for="rf-${r.id}">Add</label><input type="file" id="rf-${r.id}" multiple hidden></div></div>`;
    }
    $("#view-roms").innerHTML=h+`</div>`;
    if($("#go-dups")) $("#go-dups").onclick=()=>{S.romView="dubbels"; renderRoms();};
    if($("#go-inbox")) $("#go-inbox").onclick=()=>{S.romView="inbox"; renderRoms();};
    document.querySelectorAll("[data-dsys]").forEach(b=>b.onclick=()=>{S.romView="dubbels"; renderRoms();});
    document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{S.fb.sys=b.dataset.open; S.fb.filter="alles"; S.fb.sel.clear(); S.fb.cmp=null; S.romView="bestanden"; renderRoms();});
    document.querySelectorAll("[data-rom]").forEach(el=>{
      const r=S.roms.find(x=>x.id===el.dataset.rom);
      const take=files=>{
        if(!files.length) return;
        [...files].forEach((f,i)=>S.romFiles.push({id:"u"+Date.now()+i, sys:r.id, name:f.name, mb:f.size/1048576, hash:"u"+f.size+"-"+f.name.length}));
        r.n+=files.length; r.mb+=Math.max(1,Math.round([...files].reduce((a,f)=>a+f.size,0)/1048576));
        const after=findDups().length; log(`ROMs ${r.name}: ${files.length} file(s) added`);
        toast(after>groups.length?`${files.length} ROM(s) added. New duplicates were found.`:`${files.length} ROM(s) added to ${r.name}`);
        renderRoms(); renderStrip();
      };
      el.querySelector("input").addEventListener("change",ev=>take(ev.target.files));
      el.addEventListener("dragover",ev=>ev.preventDefault());
      el.addEventListener("drop",ev=>{ev.preventDefault(); take(ev.dataTransfer.files);});
    });
  }
  document.querySelectorAll("[data-rv]").forEach(b=>b.onclick=()=>{S.romView=b.dataset.rv; S.fb.confirm=false; renderRoms();});
  if (typeof renderColl==="function" && document.getElementById("view-coll")) renderColl();
  $("#n-roms").textContent=S.inbox.length?`${S.inbox.length} new`:groups.length?`${groups.length} dup`:String(S.roms.reduce((a,r)=>a+r.n,0));
  const cur=document.querySelector('.subtabs [aria-pressed="true"]'); if(cur && cur.parentElement.scrollWidth>cur.parentElement.clientWidth){ const sb=cur.parentElement; sb.scrollLeft=cur.offsetLeft-sb.clientWidth/2+cur.clientWidth/2; }
}

// ---------------------------------------------------------------- Emu Vault updates itself
S.self = {ver:"0.9.0", installed:"2026-10-20", latest:{ver:"0.9.1", date:"2026-10-28", mb:18, notes:["Inbox: more choices when you already have a game","Drives: read external drives and SD cards","Retro 83 look with a Linux prompt","Open folder and Copy path in ROMs"]}, prev:null, state:"available", pct:0, channel:"stable", auto:true};
const SELF_STABLE = {ver:"0.9.1", date:"2026-10-28", mb:18, notes:["Inbox: more choices when you already have a game","Drives: read external drives and SD cards","Retro 83 look with a Linux prompt","Open folder and Copy path in ROMs"]};
const SELF_BETA = {ver:"0.10.0-beta.2", date:"2026-10-27", mb:19, notes:["Experimental: CHD conversion runs in the background","Experimental: faster fingerprint checks on large drives"]};
function selfUpdateAvailable(){ return S.self.state==="available" || S.self.state==="downloading" || S.self.state==="ready"; }
function selfHTML(){
  const s=S.self, L=s.latest, plat=S.platform==="linux"?"linux":S.platform==="android"?"android":"both";
  const seg2=(name,opts,val)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-${name}="${v}" aria-pressed="${v===val}">${l}</button>`).join("")}</div>`;
  let st="";
  if (s.state==="checking") st=`<p class="hint" style="margin:0">Checking for a new version…</p><div class="prog"><i style="width:35%"></i></div>`;
  else if (s.state==="current") st=`<div class="verdict ok"><b>Emu Vault is up to date.</b> You have the newest ${s.channel==="beta"?"beta":"version"}.</div>`;
  else if (s.state==="available") st=`<div class="verdict warn"><b>Version ${esc(L.ver)} is available</b> · ${fmtDate(L.date)} · ${L.mb} MB</div>
      <div class="notes">${L.notes.map(n=>`<div class="crow2"><span class="ck info">+</span><span>${esc(n)}</span></div>`).join("")}</div>
      <div class="gact"><button class="btn primary" id="self-go">Update Emu Vault</button><button class="btn" id="self-later">Later</button></div>`;
  else if (s.state==="downloading") st=`<p class="hint" style="margin:0">Downloading ${esc(L.ver)} · ${Math.round(L.mb*s.pct/100)} of ${L.mb} MB</p><div class="prog"><i style="width:${s.pct}%"></i></div>`;
  else if (s.state==="ready") st=`<div class="verdict ok"><b>${esc(L.ver)} is downloaded.</b> Restart Emu Vault to finish. ${plat==="android"?"Android asks you to confirm the install.":plat==="linux"?"The new AppImage replaces the old one.":"On Android you confirm the install; on Linux the AppImage is replaced."}</div>
      <div class="gact"><button class="btn primary" id="self-restart">Restart now</button><button class="btn" id="self-later2">On next start</button></div>`;
  return `<div class="form set-sec" id="self-sec"><h2>Emu Vault</h2>
    <div class="selfhead"><div><div class="selfver mono">v${esc(s.ver)}</div><div class="hint">Installed ${fmtDate(s.installed)} · ${s.channel==="beta"?"beta channel":"stable channel"}</div></div>
      ${s.state==="current"||s.state==="idle"?`<button class="btn small" id="self-check">Check for updates</button>`:""}</div>
    ${st}
    <div class="field"><span class="lbl">Update channel</span>${seg2("selfch",[["stable","Stable"],["beta","Beta"]],s.channel)}<p class="hint">Beta gets new features earlier, with more chance of bugs.</p></div>
    <div class="field"><label class="inline" for="self-auto"><input type="checkbox" id="self-auto" ${s.auto?"checked":""}> Check for Emu Vault updates on startup</label></div>
    <p class="hint" style="margin:0">Your settings, packs, lists, saves and backups are kept when the app updates. The previous version is kept, so you can go back.${s.prev?` <button class="linkbtn" id="self-back">Go back to v${esc(s.prev)}</button>`:""}</p>
  </div>`;
}
function bindSelf(){
  const s=S.self, re=()=>{ renderSet(); renderSelfBadge(); };
  const ck=$("#self-check"); if(ck) ck.onclick=()=>{ toast(`Emu Vault ${s.ver}: updating itself comes in a later version. New versions are on the page you got this one from.`); }; 
  const go=$("#self-go"); if(go) go.onclick=()=>{ s.state="downloading"; s.pct=0; re(); const tk=setInterval(()=>{ s.pct=Math.min(100,s.pct+12+Math.random()*14); if(s.pct>=100){ clearInterval(tk); s.state="ready"; log(`Emu Vault ${s.latest.ver} downloaded`); } re(); },160); };
  const lt=$("#self-later"); if(lt) lt.onclick=()=>{ toast("We'll remind you next time Emu Vault starts"); };
  const lt2=$("#self-later2"); if(lt2) lt2.onclick=()=>{ toast(`${s.latest.ver} installs the next time Emu Vault starts`); };
  const rs=$("#self-restart"); if(rs) rs.onclick=()=>{ s.prev=s.ver; s.ver=s.latest.ver; s.installed="2026-10-29"; s.state="current"; log(`Emu Vault updated to ${s.ver}`); toast(`Emu Vault updated to v${s.ver}`); re(); };
  const bk=$("#self-back"); if(bk) bk.onclick=()=>{ const v=s.prev; s.prev=null; s.latest={...s.latest, ver:s.ver}; s.ver=v; s.state="available"; log(`Emu Vault: went back to ${v}`); toast(`Back on v${v}`); re(); };
  document.querySelectorAll("[data-selfch]").forEach(b=>b.onclick=()=>{ s.channel=b.dataset.selfch; s.latest = s.channel==="beta" ? {...SELF_BETA} : {...SELF_STABLE}; if (s.latest.ver===s.ver) s.latest=null; s.state="idle"; re(); $("#self-check") && $("#self-check").click(); });
  const au=$("#self-auto"); if(au) au.onchange=()=>{ s.auto=au.checked; };
}
function renderSelfBadge(){
  const n=$("#n-set"); if(n) n.textContent = selfUpdateAvailable() ? "update" : "";
  const sb=$("#self-strip"); if(sb){ sb.hidden=!selfUpdateAvailable(); sb.textContent = S.self.state==="ready" ? `v${S.self.latest.ver} ready · restart` : `Emu Vault v${S.self.latest?S.self.latest.ver:""} available`; }
}

function renderSet(){
  const seg=(name,opts,val)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-${name}="${v}" aria-pressed="${String(v)===String(val)}">${l}</button>`).join("")}</div>`;
  $("#view-set").innerHTML=`<div style="display:flex;flex-direction:column;gap:16px">
  <div class="form"><div class="field"><span class="lbl">Look</span>${seg("skin",[["retro","Retro 83"],["modern","Modern"]],document.documentElement.dataset.skin==="modern"?"modern":"retro")}<p class="hint">Retro 83: amber terminal text on dark grey. Modern: clean, follows your light or dark setting.</p></div></div>
  ${selfHTML()}
  <div class="form set-sec"><h2>Add your own</h2>
    <p class="hint">Something that is not in the pack? Add it here. What you add yourself stays put when the pack list refreshes.</p>
    <div class="choices">
      <button class="choice" data-add="app"><span class="ic">APP</span><b>An app or emulator</b><span>Paste a link from GitHub or a website.</span></button>
      <button class="choice" data-add="bios"><span class="ic">BIOS</span><b>A BIOS system</b><span>A folder with the files an emulator needs.</span></button>
      <button class="choice" data-add="rom"><span class="ic">ROM</span><b>A ROM folder</b><span>A folder for a console's games.</span></button>
      <button class="choice" data-add="cat"><span class="ic">LIST</span><b>A custom list</b><span>Group apps, e.g. "Favorites".</span></button>
    </div></div>
  ${artSettingsHTML()}
  <div class="form set-sec" id="rule-sec"><h2>Which region do you keep?</h2>
    <p class="hint">If you have the same game from several regions, we keep one according to this order. Put your favorite at the top with the arrows.</p>
    ${regionRuleHTML()}
    ${codesHTML()}
    <div class="field"><span class="lbl">New files in the inbox</span>${seg("inbox",[["ask","Always ask me"],["auto","Sort sure matches automatically"]],S.inboxMode)}
      <p class="hint" style="margin-bottom:6px">With automatic sorting, the app only asks when it is not sure, when the file seems to be in the wrong folder, when you already have the game, or for translations and hacks.</p></div>
    <div class="field"><span class="lbl">When a new file is a game you already have</span>${seg("idup",[["ask","Ask me"],["rule","Follow my region rule"],["both","Always keep both"]],S.inboxDup)}
      <p class="hint">"Follow my region rule" keeps the best copy by your region order and revision, keeps both when the new file has extra languages, and deletes exact copies.</p></div>
    <div class="field"><label class="inline" for="dupmove"><input type="checkbox" id="dupmove" checked disabled> Move duplicates to <span class="mono">_duplicates</span> instead of deleting them</label>
      <p class="hint">That way you can always go back. You delete files for good yourself, in Files.</p></div></div>
  <div class="form">
    <div class="field"><label for="dir">Main folder (your drive)</label><input type="text" id="dir" value="${esc(S.dir)}">
      <p class="hint">Linux: e.g. /media/yourname/USB/Emulators. Android: /storage/emulated/0/Emulators or your SD card.</p></div>
    <div class="field"><span class="lbl">App list</span>${seg("variant",[["standaard","Standard"],["dual","Dual-screen"]],S.variant)}
      <p class="hint">Dual-screen is for devices with two screens, like the AYN Thor.</p></div>
    <div class="field"><span class="lbl">Keep apps for</span><div class="ma-row" style="gap:14px">${[["linux","Linux x64"],["linux@arm64","Linux ARM"],["windows","Windows x64"],["windows@arm64","Windows ARM"],["android","Android 64-bit"],["android@arm32","Android 32-bit"]].map(([v,l])=>`<label class="inline" for="pdef-${v.replace("@","-")}"><input type="checkbox" id="pdef-${v.replace("@","-")}" data-pdef="${v}" ${(S.plats||[]).includes(v)?"checked":""}> ${l}</label>`).join("")}</div>
      <p class="hint">Every app keeps these, when its makers offer them, unless you choose others for that app (More options › I use this on). Each one gets its own page under APPS in the menu. An app only gets a platform its makers offer.</p></div>
    <div class="field"><span class="lbl">Versions to keep</span>${seg("keep",[[1,"1"],[2,"2"],[3,"3"],[4,"4"],[5,"5"]],S.keep)}
      <p class="hint">When a new version downloads, the oldest one is deleted once there are more than this number.</p></div>
    <div class="field"><label class="inline" for="auto"><input type="checkbox" id="auto" ${S.autoCheck?"checked":""}> Check for updates on startup</label></div>
  </div></div>`;
  document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>openAdd(b.dataset.add));
  document.querySelectorAll("[data-skin]").forEach(b=>b.onclick=()=>setSkin(b.dataset.skin));
  bindSelf(); renderSelfBadge();
  bindRegionRule(()=>{ renderSet(); renderRoms(); });
  bindArtSettings();
  $("#dir").addEventListener("change",ev=>{S.dir=ev.target.value.trim()||S.dir; log(`Main folder changed to ${S.dir}`); renderAll();});
  document.querySelectorAll("[data-variant]").forEach(b=>b.addEventListener("click",()=>{S.variant=b.dataset.variant; renderAll();}));
  document.querySelectorAll("[data-plat]").forEach(b=>b.addEventListener("click",()=>{S.platform=b.dataset.plat; renderAll();}));
  document.querySelectorAll("[data-pdef]").forEach(b=>b.addEventListener("change",()=>{ const v=b.dataset.pdef; let p=(S.plats||[]).filter(x=>x!==v); if(b.checked) p.push(v); if(!p.length){ b.checked=true; toast("Keep at least one platform"); return; } S.plats=["linux","linux@arm64","windows","windows@arm64","android","android@arm32"].filter(x=>p.includes(x)); S.platform=S.plats.includes("android")&&S.plats.includes("linux")?"beide":S.plats.includes("android")?"android":"linux"; renderAll(); }));
  document.querySelectorAll("[data-keep]").forEach(b=>b.addEventListener("click",()=>{const k=+b.dataset.keep; S.emus.forEach(e=>{if(e.versions.length>k){e.versions.slice(k).forEach(v=>log(`${e.name} ${v[0]} removed (max ${k})`)); e.versions=e.versions.slice(0,k);}}); S.keep=k; renderAll();}));
  $("#auto").addEventListener("change",ev=>S.autoCheck=ev.target.checked);
  document.querySelectorAll("[data-idup]").forEach(b=>b.onclick=()=>{S.inboxDup=b.dataset.idup; renderSet(); renderRoms();});
  document.querySelectorAll("[data-inbox]").forEach(b=>b.onclick=()=>{S.inboxMode=b.dataset.inbox; log(S.inboxMode==="auto"?"Inbox: sure matches are sorted automatically":"Inbox: always ask"); renderSet(); renderRoms();});
}

// ---------------------------------------------------------------- Verzameling
S.coll = {view:"overzicht", sys:null, kind:"alle", sq:"", show:"alles", cview:"grid", regs:{US:true, EU:true, JP:true, OV:true}, unl:false, test:false, q:"", limit:1e6, manual:{}, wish:{}};
try { const w=JSON.parse(localStorage.getItem("emukluis-coll")||"null"); if(w){ S.coll.manual=w.manual||{}; S.coll.wish=w.wish||{}; if(w.regs) S.coll.regs=w.regs; } } catch(e){}
const saveColl = () => { try{ localStorage.setItem("emukluis-coll", JSON.stringify({manual:S.coll.manual, wish:S.coll.wish, regs:S.coll.regs})); }catch(e){} };
const LISTS = {}, LOADING = {};
const GI = Object.fromEntries(GAMEINDEX.map(i=>[i.id,i]));
const KIND_NAMES = {cart:"Cartridges", disc:"Discs", dl:"Downloads", arcade:"Arcade", pc:"Computers"};
const SRC_NAMES = {"no-intro":"No-Intro", redump:"Redump", fbneo:"FinalBurn Neo"};
const NO_LIST = [["Nintendo","Switch"],["Nintendo","Wii U (discs)"],["Sony","PlayStation 4"],["Microsoft","Xbox One"]];
const RB = {US:1, EU:2, JP:4, W:8, OV:16};
const nl = n => n.toLocaleString("en-US");
const sysLabel = i => i.maker==="Arcade" || i.name.startsWith(i.maker) ? i.name : `${i.maker} ${i.name}`;
let ckey = t => t.replace(/^(.*?),\s*(The|A|An|Die|Der|Le|La|Les)\b(.*)$/i,"$2 $1$3").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[&+]/g," and ").replace(/\bin one\b/g,"in 1").replace(/[^a-z0-9]+/g," ").replace(/\b(the|version|edition)\b/g," ").replace(/\s+/g," ").trim();
const mySystems = () => [...new Set(S.romFiles.map(f=>f.sys))].filter(id=>GI[id]);

function loadList(id){
  if (LISTS[id]) return Promise.resolve(LISTS[id]);
  if (!LOADING[id]) LOADING[id] = fetch(`data/${id}.json`).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(d=>{ LISTS[id]=d; return d; }).catch(e=>{ delete LOADING[id]; throw e; });
  return LOADING[id];
}
function collData(sys){
  const list = LISTS[sys] || [], owned = Object.create(null);
  S.romFiles.filter(f=>f.sys===sys).forEach(f=>{ const p=parseFile(f); if(!p.special.length && !p.bad) (owned[p.key] ||= []).push(f); });
  const man = S.coll.manual[sys] || {}, wish = S.coll.wish[sys] || {};
  return list.map(([t,r,c])=>{ const k=ckey(t); return {t, r, c, k, files:owned[k]||null, man:!!man[k], wish:!!wish[k]}; });
}
const haveG = g => !!g.files || g.man;
const selMask = () => ["US","EU","JP","OV"].reduce((m,r)=>S.coll.regs[r]?m|RB[r]:m,0);
const regVisible = r => { const m=selMask(); if(!m) return false; return r===0 || (r & m) || ((r & RB.W) && m); };
const visCount = i => i.kind==="arcade" ? i.n[0] : Object.entries(i.m||{}).reduce((a,[r,n])=>regVisible(+r)?a+n:a,0);
function regionToggles(){
  const on=["US","EU","JP","OV"].filter(r=>S.coll.regs[r]);
  return `<div class="regtog"><span class="lbl2">Show games from</span>${["US","EU","JP","OV"].map(r=>`<button class="tog ${S.coll.regs[r]?"on":""}" data-rt="${r}" aria-pressed="${!!S.coll.regs[r]}"><span class="flag">${r}</span> ${GROUP_NAMES[r]}</button>`).join("")}</div>
    <p class="hint">${on.length===4?"All regions are on.":!on.length?"<b>Turn on at least one region.</b>":`You only see games released in ${on.map(r=>GROUP_NAMES[r]).join(" or ")}. A game that also came out elsewhere stays visible. World releases always count.`}</p>`;
}
function bindRegionToggles(after){
  document.querySelectorAll("[data-rt]").forEach(b=>b.onclick=()=>{ S.coll.regs[b.dataset.rt]=!S.coll.regs[b.dataset.rt]; saveColl(); S.coll.limit=1e6; after(); });
}
function progress(sys){
  if (!LISTS[sys]) return null;
  const off = collData(sys).filter(g=>g.c===0 && (GI[sys].kind==="arcade" || regVisible(g.r)));
  return {have: off.filter(haveG).length, total: off.length};
}

function renderColl(){
  if (S.coll.view==="systeem" && S.coll.sys) return renderCollSystem();
  const C=S.coll, mine=mySystems();
  mine.forEach(id=>{ if(!LISTS[id]) loadList(id).then(()=>{ if(S.coll.view==="overzicht") renderColl(); }).catch(()=>{}); });
  const total = GAMEINDEX.reduce((a,i)=>a+visCount(i),0);
  const q = C.sq.toLowerCase();
  const vis = GAMEINDEX.filter(i=>(C.kind==="alle"||i.kind===C.kind) && (!q || sysLabel(i).toLowerCase().includes(q)));
  const card = i => { const p=progress(i.id), small=i.n[0]<15;
    return `<button class="syscard" data-open-sys="${i.id}">
      <span class="sn">${esc(i.name)}</span>
      ${p?`<span class="pbar sm"><i style="width:${Math.max(p.have/p.total*100, p.have?1.5:0)}%"></i></span><span class="sc"><b class="mono">${p.have}</b> of ${nl(visCount(i))} games</span>`:`<span class="sc"><b class="mono">${nl(visCount(i))}</b> games${small?` · small list`:""}</span>`}
      ${p?`<span class="muted" style="font-size:12px">${p.have>=visCount(i)?"complete":`${nl(Math.max(0,visCount(i)-p.have))} still to find`}</span>`:""}</button>`; };
  let h=`<div class="dupsum">
      <div class="nums"><div><b>${GAMEINDEX.length}</b>systems</div><div><b>${nl(total)}</b>official games</div><div><b>${mine.length}</b>of yours</div></div>
      <p class="hint">All lists are built in: No-Intro for cartridges and downloads, Redump for discs, FinalBurn Neo for arcade. Each game counts once, even if it came out in several regions, also when it has another name there (Rockman is Mega Man, Biohazard is Resident Evil). Those names come from the Retool clone lists. The app keeps all lists up to date. Want something different for one system? Open it and use <b>Your changes to this list</b>.</p>
      ${regionToggles()}
    </div>`;
  if (mine.length && !q && C.kind==="alle"){
    h+=`<div class="group" style="margin-top:14px"><h2>Your systems · with ROMs on your drive</h2><div class="sysgrid">${mine.map(id=>card(GI[id])).join("")}</div></div>`;
  }
  h+=`<div class="fbar" style="margin-top:14px">
      <input class="search" id="c-sq" type="search" placeholder="Search a system, e.g. Saturn or Lynx" value="${esc(C.sq)}" aria-label="Search a system">
      <div class="chips">${[["alle","All"],...Object.entries(KIND_NAMES)].map(([v,l])=>`<button class="chip" data-ckind="${v}" aria-pressed="${C.kind===v}">${l}<span class="c">${v==="alle"?GAMEINDEX.length:GAMEINDEX.filter(i=>i.kind===v).length}</span></button>`).join("")}</div></div>`;
  const makers=[...new Set(vis.map(i=>i.maker))].sort((a,b)=>{ const s=m=>vis.filter(i=>i.maker===m).reduce((x,i)=>x+visCount(i),0); return s(b)-s(a); });
  for (const m of makers){
    const items=vis.filter(i=>i.maker===m).sort((a,b)=>visCount(b)-visCount(a));
    h+=`<div class="group" style="margin-top:12px"><h2>${esc(m)} · ${items.length}</h2><div class="sysgrid">${items.map(card).join("")}</div></div>`;
  }
  if (!vis.length) h+=`<div class="empty-state" style="margin-top:10px">No system found for “${esc(C.sq)}”.</div>`;
  if (!q && C.kind==="alle") h+=`<div class="group" style="margin-top:12px"><h2>No complete list yet</h2>
    <div class="sysgrid">${NO_LIST.map(([m,n])=>`<div class="syscard none"><span class="sn">${m} ${n}</span><span class="src">No-Intro and Redump are not done with this one yet. When a list appears, it shows up here automatically.</span></div>`).join("")}</div></div>`;
  $("#view-coll").innerHTML=h;
  document.querySelectorAll("[data-open-sys]").forEach(b=>b.onclick=()=>{ C.view="systeem"; C.sys=b.dataset.openSys; C.q=""; C.show="alles"; C.limit=1e6; renderColl(); try{ window.scrollTo(0,0); }catch(e){} });
  document.querySelectorAll("[data-ckind]").forEach(b=>b.onclick=()=>{C.kind=b.dataset.ckind; renderColl();});
  bindRegionToggles(renderColl);
  const si=$("#c-sq"); si.oninput=()=>{C.sq=si.value; const p=si.selectionStart; renderColl(); const n=$("#c-sq"); n.focus(); n.setSelectionRange(p,p);};
  const tot = mine.reduce((a,id)=>{const p=progress(id); return p?a+p.have:a;},0);
  $("#n-coll").textContent = tot ? String(tot) : "";
}

function renderCollSystem(){
  const C=S.coll, info=GI[C.sys];
  const head=`<div class="bar" style="margin-bottom:12px"><button class="btn small" id="c-back">← All systems</button><span class="muted" style="font-size:13px">${KIND_NAMES[info.kind]} · list from ${SRC_NAMES[info.src]}, version <span class="mono">${esc(info.ver)}</span></span></div>
    <h2 class="sys-title">${esc(sysLabel(info))} <span style="font-size:13px;vertical-align:middle">${biosChip(C.sys)}</span></h2>`;
  if (!LISTS[C.sys]){
    $("#view-coll").innerHTML = head + `<div class="empty-state" id="c-load">Loading list…</div>`;
    $("#c-back").onclick=()=>{C.view="overzicht"; renderColl();};
    loadList(C.sys).then(()=>{ if(C.view==="systeem") renderCollSystem(); })
      .catch(()=>{ const el=$("#c-load"); if(el) el.innerHTML=`The list could not be loaded. Check your internet connection. <button class="btn small" id="c-retry">Try again</button>`; $("#c-retry")&&($("#c-retry").onclick=renderCollSystem); });
    return;
  }
  const all=collData(C.sys);
  const scope=all.filter(g=>(g.c===0)||(g.c===1&&C.unl)||(g.c===2&&C.test));
  const arcade=info.kind==="arcade";
  const regOk=g=>arcade||regVisible(g.r);
  const inReg=scope.filter(regOk), nHave=inReg.filter(haveG).length, pct=inReg.length?nHave/inReg.length*100:0;
  const q=C.q.toLowerCase();
  let rows=inReg.filter(g=>C.show==="alles"||(C.show==="heb"&&haveG(g))||(C.show==="mis"&&!haveG(g))||(C.show==="wens"&&g.wish));
  if(q) rows=rows.filter(g=>g.t.toLowerCase().includes(q)||g.k.includes(ckey(q)));
  const regCount=b=>{const s=scope.filter(g=>g.r&(b|RB.W)); return `${s.filter(haveG).length} of ${nl(s.length)}`;};
  const fl=r=>arcade?"":["US","EU","JP","W","OV"].filter(x=>r&RB[x]).map(x=>`<span class="flag ${x!=="W"&&!C.regs[x]?"off":""}" title="${GROUP_NAMES[x]}${x!=="W"&&!C.regs[x]?" (turned off)":""}">${x}</span>`).join(" ")||`<span class="flag q">?</span>`;
  let h=head+`<div class="dupsum">
      <div class="nums"><div><b>${nHave}</b>of ${nl(inReg.length)} games</div><div><b>${pct<1&&nHave?pct.toFixed(1):Math.round(pct)}%</b>complete</div><div><b>${inReg.filter(g=>g.wish&&!haveG(g)).length}</b>on your wishlist</div></div>
      <div class="pbar"><i style="width:${Math.max(pct,nHave?0.6:0)}%"></i></div>
      ${arcade?"":`<div class="prefs" style="gap:14px"><span>Released in USA: <b class="mono">${regCount(RB.US)}</b></span><span>Europe: <b class="mono">${regCount(RB.EU)}</b></span><span>Japan: <b class="mono">${regCount(RB.JP)}</b></span><span>Japan only: <b class="mono">${nl(scope.filter(g=>g.r===RB.JP).length)}</b></span></div>`}
      <p class="hint">A ROM on your drive counts automatically. A game you physically own, like a cartridge, you mark yourself with the circle.</p>
      <div class="gact"><button class="btn small" id="c-copy">Copy what I'm missing</button></div>
    </div>
    <div class="fbar" style="margin-top:12px">
      <input class="search" id="c-q" type="search" placeholder="Search a game" value="${esc(C.q)}" aria-label="Search a game">
      ${S.art.show?`<div class="seg" role="group" style="align-self:flex-start"><button data-cview="grid" aria-pressed="${C.cview==="grid"}">Covers</button><button data-cview="list" aria-pressed="${C.cview!=="grid"}">List</button></div>`:""}
      <div class="chips">${[["alles","All"],["heb","Have"],["mis","Missing"],["wens","Wishlist"]].map(([v,l])=>`<button class="chip" data-cshow="${v}" aria-pressed="${C.show===v}">${l}</button>`).join("")}</div>
      ${arcade?"":regionToggles()}
      <div class="chips"><label class="inline-t"><input type="checkbox" id="c-unl" ${C.unl?"checked":""}> Include ${arcade?"bootlegs and hacks":"unofficial and homebrew games"} (${nl(all.filter(g=>g.c===1).length)})</label><label class="inline-t"><input type="checkbox" id="c-test" ${C.test?"checked":""}> Include demos and test versions (${nl(all.filter(g=>g.c===2).length)})</label></div>
    </div><div class="ftable">`;
  if(!rows.length) h+=`<div class="empty-state">${C.show==="wens"?"Your wishlist is empty. Tap the star next to a game.":"No games for this filter."}</div>`;
  S.cvColl = rows.slice(0,C.limit).map(g=>g.k);
  const covOf=g=>{ const f=g.files&&g.files.find(hasCover); let inner;
    if (f){ const vars=coverVariants(C.sys,g.k,g.r,parseFile(f).regions), ch=chosenVariant(C.sys,g.k,vars); inner=coverHTML(C.sys, g.t, {big:C.cview==="grid", reg:ch, shift:REG_SHIFT[ch]}); }
    else inner=coverHTML(C.sys, g.t, {none:true, missing:!g.files, big:C.cview==="grid"});
    return `<button class="covbtn" data-cv="${esc(g.k)}" data-cvsrc="coll" aria-label="View cover: ${esc(g.t)}">${inner}</button>`; };
  if (S.art.show && C.cview==="grid"){
    h=h.replace(/<div class="ftable">$/,'<div class="cgrid">');
    rows.slice(0,C.limit).forEach(g=>{ const hv=haveG(g);
      h+=`<div class="ctile ${hv?"have":""}">${covOf(g)}<div class="ct">${esc(g.t)}</div><div class="crowact"><button class="cstat ${g.files?"auto":g.man?"man":""}" data-cman="${esc(g.k)}" ${g.files?"disabled":""} aria-label="${hv?"Have":"Missing"}: ${esc(g.t)}">${hv?"✓":""}</button><button class="star ${g.wish?"on":""}" data-cwish="${esc(g.k)}" aria-label="${g.wish?"Remove from wishlist":"Add to wishlist"}: ${esc(g.t)}" aria-pressed="${g.wish}">${g.wish?"★":"☆"}</button></div></div>`; });
  } else rows.slice(0,C.limit).forEach(g=>{ const hv=haveG(g);
    h+=`<div class="crow ${hv?"have":""}">
      <button class="cstat ${g.files?"auto":g.man?"man":""}" data-cman="${esc(g.k)}" ${g.files?"disabled":""} aria-label="${hv?"Have":"Missing"}: ${esc(g.t)}" title="${g.files?"ROM is on your drive":g.man?"Marked as owned by you":"Tap if you own this game"}">${hv?"✓":""}</button>
      <div class="fmain ${S.art.show?"wc":""}">${S.art.show?covOf(g):""}<div><div class="ct">${esc(g.t)}</div><div class="meta">${fl(g.r)} ${g.c===1?`<span>${arcade?"bootleg":"unofficial"}</span>`:g.c===2?`<span>demo or test</span>`:""} ${g.files?`<span class="mono">${esc(g.files[0].name)}</span>`:g.man?`<span>marked by you</span>`:""}</div></div>${S.art.show?"</div>":""}
      <button class="star ${g.wish?"on":""}" data-cwish="${esc(g.k)}" aria-label="${g.wish?"Remove from wishlist":"Add to wishlist"}: ${esc(g.t)}" aria-pressed="${g.wish}">${g.wish?"★":"☆"}</button></div>`; });
  h+=`</div>`;
  if(rows.length>C.limit) h+=`<button class="btn" id="c-more" style="margin-top:10px;width:100%">Show more (${nl(rows.length-C.limit)} left)</button>`;
  $("#view-coll").innerHTML=h;
  const re=()=>renderCollSystem();
  $("#c-back").onclick=()=>{C.view="overzicht"; renderColl();};
  document.querySelectorAll("[data-cshow]").forEach(b=>b.onclick=()=>{C.show=b.dataset.cshow; C.limit=1e6; re();});
  bindRegionToggles(re);
  document.querySelectorAll("[data-cview]").forEach(b=>b.onclick=()=>{C.cview=b.dataset.cview; if(C.cview==="grid" && C.show==="alles") C.show="heb"; C.limit=b.dataset.cview==="grid"?60:80; re();});
  $("#c-unl").onchange=e=>{C.unl=e.target.checked; re();};
  $("#c-test").onchange=e=>{C.test=e.target.checked; re();};
  const qi=$("#c-q"); qi.oninput=()=>{C.q=qi.value; C.limit=1e6; const p=qi.selectionStart; re(); const n=$("#c-q"); n.focus(); n.setSelectionRange(p,p);};
  document.querySelectorAll("[data-cman]").forEach(b=>b.onclick=()=>{const m=(C.manual[C.sys] ||= {}); m[b.dataset.cman]?delete m[b.dataset.cman]:m[b.dataset.cman]=1; saveColl(); re();});
  document.querySelectorAll("[data-cwish]").forEach(b=>b.onclick=()=>{const w=(C.wish[C.sys] ||= {}); w[b.dataset.cwish]?delete w[b.dataset.cwish]:w[b.dataset.cwish]=1; saveColl(); re();});
  if($("#c-more")) $("#c-more").onclick=()=>{C.limit+=200; re();};
  $("#c-copy").onclick=()=>{ const miss=inReg.filter(g=>!haveG(g)); const txt=miss.map(g=>g.t).join("\n");
    try{ navigator.clipboard.writeText(txt).then(()=>toast(`Copied a list of ${nl(miss.length)} missing games`)).catch(()=>toast("Copying did not work in this window")); }catch(e){ toast("Copying did not work in this window"); } };
}

// ---------------------------------------------------------------- Cover viewer: tap to enlarge, swipe to browse, pick the cover version
S.art.pick = {};
S.lbx = null;
const REG_SHIFT = {US:0, EU:140, JP:220, W:300, OV:60};
const REG_WORD = {US:"USA", EU:"Europe", JP:"Japan", W:"World", OV:"Other"};
function coverVariants(sys, key, mask, fileRegs){
  let regs = mask ? regsOfMask(mask).filter(r=>r!=="OV") : [];
  if (!regs.length && LISTS[sys]){ const g=LISTS[sys].find(x=>ckey(x[0])===key); if(g) regs=regsOfMask(g[1]).filter(r=>r!=="OV"); }
  (fileRegs||[]).forEach(r=>{ const g=REG_GROUP[r]||r; if(g!=="OV" && !regs.includes(g)) regs.push(g); });
  if (!regs.length) regs=["W"];
  return regs.sort((a,b)=>regionRank([a])-regionRank([b]));
}
const chosenVariant = (sys, key, vars) => { const p=S.art.pick[sys+"|"+key]; return vars.includes(p) ? p : vars[0]; };
function lbItem(){
  const L=S.lbx; if(!L) return null; const id=L.ids[L.i];
  if (L.src==="coll"){
    const g=collData(L.sys).find(x=>x.k===id); if(!g) return null;
    const f=g.files&&g.files.find(hasCover), vars=coverVariants(L.sys, g.k, g.r, g.files?parseFile(g.files[0]).regions:[]);
    return {sys:L.sys, key:g.k, title:g.t, have:haveG(g), auto:!!g.files, man:g.man, wish:g.wish, file:g.files?g.files[0]:null, cover:!!f, vars, c:g.c};
  }
  const f=S.romFiles.find(x=>x.id===id); if(!f) return null; const p=parseFile(f);
  const w=(S.coll.wish[f.sys]||{})[p.key];
  return {sys:f.sys, key:p.key, title:p.title, have:true, auto:true, wish:!!w, file:f, cover:hasCover(f), vars:coverVariants(f.sys, p.key, 0, p.regions), special:p.special.length||p.bad};
}
function openLbx(src, sys, ids, i){ S.lbx={src, sys, ids, i}; $("#lbx").hidden=false; document.body.style.overflow="hidden"; renderLbx(); setTimeout(()=>$("#lbx-x").focus(),30); }
function closeLbx(){ S.lbx=null; $("#lbx").hidden=true; document.body.style.overflow=""; }
function stepLbx(d){ const L=S.lbx; if(!L) return; const n=L.i+d; if(n<0||n>=L.ids.length){ const st=$("#lbx-cov"); st.classList.remove("bump"); void st.offsetWidth; st.classList.add("bump"); return; } L.i=n; L.dir=d; renderLbx(); }
function renderLbx(){
  const L=S.lbx, it=lbItem(); if(!it){ closeLbx(); return; }
  const sysN=GI[it.sys]?sysLabel(GI[it.sys]):it.sys, ch=chosenVariant(it.sys,it.key,it.vars);
  $("#lbx-n").textContent=`${L.i+1} / ${L.ids.length}`;
  $("#lbx-prev").disabled=L.i===0; $("#lbx-next").disabled=L.i===L.ids.length-1;
  const cov=$("#lbx-cov");
  cov.className="lbx-cov"+(L.dir>0?" in-r":L.dir<0?" in-l":""); L.dir=0;
  cov.innerHTML = it.cover ? coverHTML(it.sys,it.title,{big:true, reg:REG_WORD[ch], shift:REG_SHIFT[ch]}) : coverHTML(it.sys,it.title,{big:true, none:true, missing:!it.have});
  const status = it.special ? `<span class="pill info">translation or hack</span>` : it.have ? `<span class="pill ok">${it.auto?"in your collection":"marked as owned"}</span>` : `<span class="pill plat">not in your collection</span>`;
  let h=`<h3 id="lbx-t">${esc(it.title)}</h3><div class="meta" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:var(--muted)"><span>${esc(sysN)}</span>${status}${it.wish?`<span class="pill warn">on wishlist</span>`:""}</div>`;
  if (it.file) h+=`<div class="mono" style="font-size:12px;overflow-wrap:anywhere;color:var(--muted)">${esc(it.file.name)} ${locLink(romPath(it.file.sys,it.file.name))}</div>${it.file.id&&!String(it.file.id).startsWith("c")?`<div class="gact" style="margin:0"><button class="btn primary small" data-play="${esc(it.file.id)}">▶ Play</button></div>`:""}`;
  if (it.cover && it.vars.length>1) h+=`<div class="lbx-vars"><span class="lbl2">Choose the cover</span><div class="vrowc">${it.vars.map(r=>`<button class="vbtn ${r===ch?"on":""}" data-vpick="${r}" aria-pressed="${r===ch}" aria-label="${REG_WORD[r]} cover">${coverHTML(it.sys,it.title,{reg:r, shift:REG_SHIFT[r]})}<span>${REG_WORD[r]}</span></button>`).join("")}</div></div>`;
  else if (it.cover) h+=`<p class="hint" style="margin:0">One cover version: ${REG_WORD[ch]}.</p>`;
  h+=`<div class="gact">`;
  if (it.have && !it.cover && !it.special) h+=`<button class="btn primary small" id="lbx-dl">Download cover</button>`;
  if (L.src==="coll" && !it.auto) h+=`<button class="btn small" id="lbx-own">${it.man?"Unmark as owned":"I own this game"}</button>`;
  h+=`<button class="btn small" id="lbx-wish">${it.wish?"★ On wishlist":"☆ Add to wishlist"}</button></div>
    <p class="hint" style="margin:0">Swipe, or use the arrows or ← → keys, to see the next game.</p>`;
  $("#lbx-info").innerHTML=h;
  const refresh=()=>{ renderLbx(); if(L.src==="coll") renderCollSystem(); else renderRoms(); };
  document.querySelectorAll("[data-vpick]").forEach(b=>b.onclick=()=>{ S.art.pick[it.sys+"|"+it.key]=b.dataset.vpick; log(`Cover for ${it.title}: ${REG_WORD[b.dataset.vpick]}`); toast(`${REG_WORD[b.dataset.vpick]} cover chosen`); refresh(); });
  const wb=$("#lbx-wish"); if(wb) wb.onclick=()=>{ const w=(S.coll.wish[it.sys] ||= {}); w[it.key]?delete w[it.key]:w[it.key]=1; saveColl(); refresh(); };
  const ob=$("#lbx-own"); if(ob) ob.onclick=()=>{ const m=(S.coll.manual[it.sys] ||= {}); m[it.key]?delete m[it.key]:m[it.key]=1; saveColl(); refresh(); };
  const db=$("#lbx-dl"); if(db) db.onclick=()=>{ if(!artReady()){ toast("Sign in to ScreenScraper in Settings → Box art first"); return; } db.disabled=true; db.textContent="Downloading…"; setTimeout(()=>{ if(it.file) S.art.got.add(it.file.id); S.art.used+=2; log(`Cover downloaded: ${it.title}`); refresh(); },600); };
}
(function initLbx(){
  const el=$("#lbx");
  $("#lbx-x").onclick=closeLbx; $("#lbx-prev").onclick=()=>stepLbx(-1); $("#lbx-next").onclick=()=>stepLbx(1);
  el.addEventListener("click", e=>{ if(e.target===el) closeLbx(); });
  let sx=null, sy=null;
  const stage=$("#lbx-stage");
  stage.addEventListener("touchstart", e=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; }, {passive:true});
  stage.addEventListener("touchend", e=>{ if(sx===null) return; const t=e.changedTouches[0], dx=t.clientX-sx, dy=t.clientY-sy; sx=null; if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)) stepLbx(dx<0?1:-1); }, {passive:true});
  document.addEventListener("keydown", e=>{ if(!S.lbx) return; if(e.key==="ArrowRight"){ e.preventDefault(); stepLbx(1);} else if(e.key==="ArrowLeft"){ e.preventDefault(); stepLbx(-1);} else if(e.key==="Escape") closeLbx(); });
  document.addEventListener("click", e=>{ const b=e.target.closest("[data-cv]"); if(!b) return; e.preventDefault(); e.stopPropagation();
    const src=b.dataset.cvsrc, ids=(src==="coll"?S.cvColl:S.cvFiles)||[]; openLbx(src, src==="coll"?S.coll.sys:null, ids, ids.indexOf(b.dataset.cv)); }, true);
})();

function renderLog(){ $("#log").innerHTML = S.log.map(([t,m])=>`<li><span>${t}</span>${esc(m)}</li>`).join("") || `<li class="muted">Nog niets gebeurd.</li>`; }
function renderAll(){ renderPack(); renderChips(); renderEmus(); renderBios(); renderRoms(); renderBackups(); renderColl(); renderSet(); renderLog(); }

let busy=false;
function updateOne(id){
  return new Promise(res=>{
    const e=S.emus.find(x=>x.id===id); if(!needsUpdate(e)) return res();
    const card=$("#emu-"+id);
    if(!card){ finish(); return; }
    card.querySelector("[data-upd]").disabled=true;
    const plats=wantPlats(e);
    const p=document.createElement("div"); p.className="prog"; p.innerHTML="<i></i>";
    const info=document.createElement("div"); info.className="proginfo";
    card.append(p,info);
    const totalMb = plats.length*e.mb;
    let pct=0;
    log(`${e.name}: downloading ${e.latest[0]} (${plats.join(" + ")})`);
    const tick=setInterval(()=>{
      pct=Math.min(100,pct+5+Math.random()*10);
      p.firstChild.style.width=pct+"%";
      info.textContent=`${e.latest[0]} · ${plats.join(" + ")} · ${Math.round(totalMb*pct/100)} of ${totalMb} MB`;
      if(pct>=100){
        clearInterval(tick);
        const leaving = e.versions.length>=S.keep && card.querySelector(`[data-slot="${S.keep-1}"]`);
        if(leaving) leaving.classList.add("leaving");
        setTimeout(finish, leaving?450:0);
      }
    },110);
    function finish(){
      e.versions.unshift([...e.latest]);
      if(e.versions.length>S.keep){ e.versions.splice(S.keep).forEach(v=>log(`${e.name} ${v[0]} removed (oldest)`)); }
      log(`${e.name} ${e.latest[0]} saved to apps/${e.id}/${e.latest[0]}/`);
      renderEmus(); res();
    }
  });
}
async function updateAll(){
  if(busy) return; busy=true;
  const ids=S.emus.filter(needsUpdate).map(e=>e.id);
  for(const id of ids) await updateOne(id);
  busy=false; toast(`${ids.length} app(s) updated`);
}
function checkUpdates(){
  log("Checking for updates…");
  setTimeout(()=>{
    const pick=S.emus.filter(e=>e.on && !needsUpdate(e) && e.versions.length);
    if(pick.length){
      const e=pick[Math.floor(Math.random()*pick.length)];
      const m=e.latest[0].match(/(\d+)(?!.*\d)/);
      e.latest=[e.latest[0].slice(0,m.index)+(+m[1]+1)+e.latest[0].slice(m.index+m[1].length),"2026-10-28"];
      log(`New version found: ${e.name} ${e.latest[0]}`);
      toast(`New: ${e.name} ${e.latest[0]}`);
    } else toast("No new versions found");
    renderEmus();
  },700);
}

$("#upd-all").addEventListener("click", updateAll);
$("#check").addEventListener("click", checkUpdates);
$("#q").addEventListener("input", ev=>{S.q=ev.target.value; if(S.q) {S.filter="alle"; renderChips();} renderEmus();});
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected", x===t));
  document.querySelectorAll(".view").forEach(v=>v.hidden = v.id!=="view-"+t.dataset.tab);
  $("#ptitle").textContent = t.querySelector(".lb").textContent;
  try{ window.scrollTo({top:0}); }catch(e){}
}));
document.getElementById("self-strip").onclick=()=>{ document.querySelector('.tab[data-tab="set"]').click(); };
// small dot badges on the phone tab bar
const badgeObs = new MutationObserver(()=>document.querySelectorAll(".tab .n").forEach(n=>n.classList.toggle("quiet", !/collect|new|dup|missing|update/.test(n.textContent))));
document.querySelectorAll(".tab .n").forEach(n=>badgeObs.observe(n,{childList:true,characterData:true,subtree:true}));

// ---------------------------------------------------------------- toevoegen (wizard)
const W = {type:null, step:0, d:{}};
const PLAT_LABEL = {android:"Android (APK)", linux:"Linux", windows:"Windows", other:"Other"};
const slug = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const pretty = s => s.replace(/[-_]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());

function openAdd(type, extra){
  const tab = document.querySelector('.tab[aria-selected="true"]').dataset.tab;
  W.type = type || null; W.step = 0;
  W.d = {name:"", url:"", files:[], cat:"Emulator", sys:"", newCat:"", bfiles:[{f:"",req:true}], used:"", ext:[], apps:[], err:""};
  if (extra) Object.assign(W.d, extra);
  if (!type && tab==="bios") W.type="bios";
  if (!type && tab==="roms") W.type="rom";
  $("#sheet").hidden = false; document.body.style.overflow="hidden";
  renderSheet();
}
function closeAdd(){ $("#sheet").hidden = true; document.body.style.overflow=""; }

function sheetFrame(title, step, body, back, next, nextLabel, nextDisabled){
  $("#sh-title").textContent = title;
  $("#sh-step").textContent = step || "";
  $("#sh-body").innerHTML = body;
  $("#sh-foot").innerHTML = (back ? `<button class="btn" id="sh-back">Back</button>` : `<button class="btn" id="sh-back">Cancel</button>`) +
    (next ? `<button class="btn primary" id="sh-next" ${nextDisabled?"disabled":""}>${nextLabel||"Next"}</button>` : "");
  $("#sh-back").onclick = back || closeAdd;
  if (next) $("#sh-next").onclick = next;
  const first = $("#sh-body").querySelector("input[type=text],input[type=url]"); if (first) setTimeout(()=>first.focus(),50);
}

function renderSheet(){
  const d = W.d;
  if (!W.type){
    sheetFrame("What do you want to add?", "", `
      <div class="choices">
        <button class="choice" data-t="app"><span class="ic">APP</span><b>An app or emulator</b><span>Paste a link, we look up the rest.</span></button>
        <button class="choice" data-t="bios"><span class="ic">BIOS</span><b>A BIOS system</b><span>A folder with the files an emulator needs.</span></button>
        <button class="choice" data-t="rom"><span class="ic">ROM</span><b>A ROM folder</b><span>A folder for a console's games.</span></button>
        <button class="choice" data-t="cat"><span class="ic">LIST</span><b>A custom list</b><span>Group apps, e.g. "Favorites".</span></button>
      </div>`);
    document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{W.type=b.dataset.t; W.step=0; renderSheet();});
    return;
  }

  // ---- APP
  if (W.type==="app"){
    const total = d.web ? 4 : 3;
    const stepNo = s => `Step ${s} of ${total}`;
    if (W.step===0){
      sheetFrame("Add an app or emulator","Step 1",`
        <div class="q"><label for="a-url">Where do you download the app?</label>
          <input type="url" id="a-url" inputmode="url" autocomplete="off" placeholder="Paste a link here" value="${esc(d.url)}">
          <p class="help">This can be a GitHub page, but also a regular website or a download folder, like RetroArch's. Just paste the link of the page where you would normally click "download".</p>
          ${d.err?`<div class="err" role="alert">${d.err}</div>`:""}
        </div>
        <div class="q"><span class="lbl">Or try an example</span>
          <div class="sugs">
            <button class="sug" data-u="https://github.com/mamedev/mame">GitHub: MAME</button>
            <button class="sug" data-u="https://buildbot.libretro.com/nightly/android/">RetroArch Nightly</button>
            <button class="sug" data-u="https://buildbot.libretro.com/nightly/android/latest/arm64-v8a/">RetroArch-cores</button>
            <button class="sug" data-u="https://www.mamedev.org/release.html">Website: mamedev.org</button>
          </div></div>`,
        ()=>{W.type=null; renderSheet();}, findApp, "Search");
      $("#a-url").addEventListener("input", ev=>{d.url=ev.target.value; d.err="";});
      $("#a-url").addEventListener("keydown", ev=>{ if(ev.key==="Enter") findApp(); });
      document.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>{d.url=b.dataset.u; findApp();});
      document.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>{d.url=b.dataset.goto; findApp();});
      return;
    }
    if (W.step===1){
      const anyOn = d.all || d.files.some(f=>f.on);
      const head = d.web
        ? `<div class="found"><div class="ok">Found on ${esc(d.host)}</div>
             ${d.trail?`<div style="font-size:13px">We followed the folders: <span class="mono">${d.trail.map(esc).join(" › ")}</span></div>`:""}
             <div class="muted" style="font-size:13px">${d.files.length} downloadable files${d.more?` (and ${d.more} more)`:""}</div></div>`
        : `<div class="found"><div class="ok">Found: ${esc(d.name)} ${esc(d.ver)}</div>
             <div class="muted" style="font-size:13px">${esc(d.host)} · ${d.files.length} downloads in the newest version</div></div>`;
      sheetFrame("Which files do you want to keep?",stepNo(2),`${head}
        ${d.folder?`<label class="opt ${d.all?"":"dim"}" style="border-color:${d.all?"var(--accent)":"var(--line)"}"><input type="checkbox" id="a-all" ${d.all?"checked":""}>
            <span><b>Everything in this folder</b><br><span class="muted" style="font-size:12px">${d.folder}</span></span><span class="pill ok">recommended</span></label>`:""}
        <div class="q" ${d.all?"hidden":""}><span class="lbl">${d.folder?"Or pick which ones":"Choose what goes in your backup"}</span>
          <p class="help">What we recommend is already ticked. With every new version we look for the same kind of file.</p>
          <div class="rows">${d.files.map((f,i)=>`<label class="opt ${f.on?"":"dim"}"><input type="checkbox" data-fi="${i}" ${f.on?"checked":""}>
            <span><span class="fn">${esc(f.name)}</span><br><span class="muted" style="font-size:12px">${PLAT_LABEL[f.plat]}${f.mb?` · ${f.mb} MB`:""}${f.what?` · ${esc(f.what)}`:""}</span></span>
            ${f.rec?`<span class="pill ok">recommended</span>`:"<span></span>"}</label>`).join("")}</div>
        </div>
        ${anyOn?"":`<div class="err">Choose at least one file.</div>`}`,
        ()=>{W.step=0; renderSheet();}, ()=>{W.step = d.web?2:3; renderSheet();}, "Next", !anyOn);
      document.querySelectorAll("[data-fi]").forEach(c=>c.onchange=()=>{d.files[+c.dataset.fi].on=c.checked; renderSheet();});
      if ($("#a-all")) $("#a-all").onchange=ev=>{d.all=ev.target.checked; renderSheet();};
      return;
    }
    if (W.step===2){
      const opts = [
        ["map", "The newest version number in the folder or link", d.verHint?`Found now: <span class="mono">${esc(d.verHint)}</span>. When a folder with a higher number appears, we take that one.`:"Works when the site has a folder or link per version, like 1.21.0."],
        ["datum", "The date in the file name", d.dateHint?`Found now: <span class="mono">${esc(d.dateHint)}</span>. Handy for nightly builds that appear every day.`:"Handy for nightly builds that appear every day."],
        ["wijziging", "When the file changes", "Always works. We download the file again and compare it with the previous one. Uses more data."],
      ];
      sheetFrame("How do we spot a new version?",stepNo(3),`
        <p class="help">A website has no fixed "latest version" button like GitHub. Choose how the app tells the difference. What we recommend is already selected.</p>
        <div class="rows">${opts.map(([v,t,h])=>`<label class="opt ${d.how===v?"":"dim"}" style="border-color:${d.how===v?"var(--accent)":"var(--line)"};grid-template-columns:auto minmax(0,1fr) auto">
          <input type="radio" name="how" value="${v}" ${d.how===v?"checked":""}>
          <span><b style="font-size:14px">${t}</b><br><span class="muted" style="font-size:12.5px">${h}</span></span>
          ${d.howRec===v?`<span class="pill ok">recommended</span>`:"<span></span>"}</label>`).join("")}</div>`,
        ()=>{W.step=1; renderSheet();}, ()=>{W.step=3; renderSheet();}, "Next");
      document.querySelectorAll("input[name=how]").forEach(r=>r.onchange=()=>{d.how=r.value; renderSheet();});
      return;
    }
    if (W.step===3){
      const catOpts = Object.entries(CATS).map(([k,v])=>`<option value="${esc(k)}" ${d.cat===k?"selected":""}>${esc(v)}</option>`).join("");
      sheetFrame("Final details",stepNo(total),`
        <div class="q"><label for="a-name">Name</label><input type="text" id="a-name" value="${esc(d.name)}"></div>
        <div class="q"><label for="a-sys">For which system?</label><input type="text" id="a-sys" value="${esc(d.sys)}" placeholder="e.g. Sega Saturn">
          <div class="sugs">${["Multi-system","Arcade","Sega Saturn","Neo Geo","PC"].map(s=>`<button class="sug" data-s="${s}" aria-pressed="${d.sys===s}">${s}</button>`).join("")}</div></div>
        <div class="q"><label for="a-cat">Which list?</label><select id="a-cat">${catOpts}</select></div>
        <div class="preview">Saved in <span class="mono">${esc(S.dir)}/apps/${slug(d.name)||"…"}/</span>, always the latest ${S.keep} versions.</div>`,
        ()=>{W.step = d.web?2:1; renderSheet();}, saveApp, "Add", !d.name.trim());
      $("#a-name").oninput = ev=>{d.name=ev.target.value; $("#sh-next").disabled=!d.name.trim(); document.querySelector(".preview .mono").textContent=`${S.dir}/apps/${slug(d.name)||"…"}/`;};
      $("#a-sys").oninput = ev=>{d.sys=ev.target.value;};
      $("#a-cat").onchange = ev=>{d.cat=ev.target.value;};
      document.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{d.sys=b.dataset.s; renderSheet();});
      return;
    }
    if (W.step===4) return doneScreen(`${d.name} is in your backup`, `The first version is downloading. You will find the app under ${CATS[d.cat]}.`, "emu");
  }

  // ---- BIOS
  if (W.type==="aoc"){
    const key=s=>s.toLowerCase().replace(/\(aarch64\)|\bemulator\b|[^a-z0-9]/g,"").replace("development","dev").replace("version","");
    const akey=a=>key(a.name)+(/nightly/i.test(a.url)&&!/nightly/i.test(a.name)?"nightly":"");
    const inList=a=>S.emus.find(e=>key(e.name)===akey(a));
    const NOTES={"Lime3DS":"No longer developed. The team continues as Azahar.","Citra MMJ":"Older 3DS emulator; Azahar is the active one.","PPSSPP VR":"For VR headsets only."};
    const seen=new Set(), list=AOC_EMU.filter(a=>{ const k=a.name+"|"+a.url; if(seen.has(k)) return false; seen.add(k); return true; });
    d.pick ||= new Set();
    sheetFrame("Emulators from Obtainium app configs","",`
      <p class="help">${list.length} emulator configs from <a href="https://apps.obtainium.imranr.dev" target="_blank" rel="noopener">apps.obtainium.imranr.dev</a>. Tick the ones you want. The ones you already have are greyed out.</p>
      <div class="rows">${list.map((a,i)=>{ const have=inList(a); const tag=/nightly/i.test(a.url)?"nightly":/stable/.test(a.url)?"stable":"";
        return `<label class="opt ${have?"dim":""}"><input type="checkbox" data-aoc="${i}" ${have?"disabled checked":d.pick.has(i)?"checked":""}>
          <span><b>${esc(a.name)}</b>${tag?` <span class="pill plat">${tag}</span>`:""}<br><span class="muted" style="font-size:12px">${have?`Already in your list as ${esc(have.name)}`:esc(NOTES[a.name]||a.url.replace(/^https?:\/\//,""))}</span></span>
          ${have?`<span class="pill ok">have</span>`:NOTES[a.name]?`<span class="pill warn">note</span>`:"<span></span>"}</label>`; }).join("")}</div>`,
      ()=>{W.type="pack"; W.step=0; renderSheet();}, ()=>{
        const chosen=[...d.pick].map(i=>list[i]);
        if (!S.packs.some(p=>p.id==="aoc")) S.packs.push({id:"aoc", name:"Obtainium app configs", src:"https://apps.obtainium.imranr.dev", kind:"site"});
        chosen.forEach(a=>{ const gh=/github\.com/i.test(a.url); S.emus.push({id:slug(a.name)+"-aoc"+Math.random().toString(36).slice(2,5), name:a.name, cat:"Emulator", sys:"Emulator", src:gh?"GitHub":"Website", source:a.url, dl:gh?a.url+"/releases/latest":a.url, site:a.url, pkg:a.id, linux:false, plats:["android"], on:false, versions:[], latest:["new","2026-10-28"], mb:60, packs:["aoc"]}); });
        log(`Added ${chosen.length} emulator(s) from Obtainium app configs`); d.added=chosen.length; W.type="pack"; W.step=3; renderAll(); renderSheet(); },
      d.pick.size?`Add ${d.pick.size}`:"Add", !d.pick.size);
    document.querySelectorAll("[data-aoc]").forEach(c=>c.onchange=()=>{ const i=+c.dataset.aoc; c.checked?d.pick.add(i):d.pick.delete(i); renderSheet(); });
    return;
  }
  if (W.type==="notes"){
    const e=S.emus.find(x=>x.id===d.app), v=d.ver;
    const NOTES=["Faster startup and lower battery use","Fixes for controller hot-plugging","Better compatibility with a number of games","New translations and small interface fixes"];
    sheetFrame(`${e.name} ${v}`,"What's new",`<div class="notes">${NOTES.slice(0,2+(v.length%3)).map(n=>`<div class="crow2"><span class="ck info">·</span><span>${n}</span></div>`).join("")}</div>
      <p class="help">In the real app these are the release notes of the developer, from GitHub or the website.</p>
      <div class="preview">File in your backup: <span class="mono">${esc(S.dir)}/apps/${esc(e.id)}/${esc(v)}/</span></div>`, null, null);
    $("#sh-back").textContent="Close";
    return;
  }
  if (W.type==="newdevice"){
    sheetFrame("Set up a new device","",`
      <div class="notes">
        <div class="crow2"><span class="ck ok">1</span><span><b>Install Emu Vault</b> on the new phone or PC.</span></div>
        <div class="crow2"><span class="ck ok">2</span><span><b>Point it at your vault</b>: the same drive or SD card, or turn on sync so Syncthing copies it over.</span></div>
        <div class="crow2"><span class="ck ok">3</span><span><b>Tap Restore everything.</b> The app installs your emulators from the versions in your backup, puts your BIOS files in place, and brings back your saves, save states, controller layouts and settings.</span></div>
      </div>
      <p class="help">On Android you confirm each app install yourself; Android doesn't allow apps to install other apps silently.</p>`, null, null);
    $("#sh-back").textContent="Close";
    return;
  }
  if (W.type==="pack"){
    if (W.step===0){
      sheetFrame("Add an Obtainium pack","",`
        <p class="help">A pack is an Obtainium export: a .json file with a list of apps. Apps that are already in your list are not added twice.</p>
        <div class="choices">
          <label class="choice" for="pk-file" style="cursor:pointer"><span class="ic">FILE</span><b>Import a .json file</b><span>For example obtainium-emulation-pack-v8.0.1.json from your downloads.</span></label>
          <button class="choice" id="pk-link"><span class="ic">LINK</span><b>Paste a link</b><span>A GitHub or Codeberg page. The app downloads the newest file itself.</span></button>
        </div>
        <input type="file" id="pk-file" accept=".json,application/json" hidden>
        ${d.err?`<div class="err" role="alert">${esc(d.err)}</div>`:""}
        <div class="q"><span class="lbl">Other packs you could try</span>
          <div class="rows">${PACK_SUGGEST.map((p,i)=>{ const added=!p.aoc && S.packs.some(x=>normUrl(x.src)===normUrl(p.url)); return `<button class="opt pickg" data-psug="${i}" ${added?"disabled":""}><span></span><span><b>${esc(p.name)}</b><br><span class="muted" style="font-size:12px">${esc(p.note)}</span></span>${added?`<span class="pill ok">added</span>`:`<span class="muted" style="font-size:12px">${p.restore?"add":p.aoc?"pick":"link"}</span>`}</button>`; }).join("")}</div></div>`,
        null, null);
      $("#pk-file").onchange=ev=>{ const f=ev.target.files[0]; if(!f) return; const r=new FileReader();
        r.onload=()=>{ try{ const apps=parsePack(JSON.parse(r.result)); if(!apps.length) throw new Error("This file has no apps in it."); d.apps2=apps; d.file=f.name; d.name=f.name.replace(/\.json$/i,"").replace(/[-_.]?v?\d+(\.\d+)*$/i,"").replace(/[-_]+/g," ").replace(/\b\w/g,c=>c.toUpperCase()); d.ver=(f.name.match(/v\d+(\.\d+)+/i)||[""])[0]; d.err=""; W.step=1; renderSheet(); }
          catch(e){ d.err = e instanceof SyntaxError ? "This is not a valid .json file." : e.message; renderSheet(); } };
        r.readAsText(f); };
      $("#pk-link").onclick=()=>{ W.step=2; renderSheet(); };
      document.querySelectorAll("[data-psug]").forEach(b=>b.onclick=()=>{ const p=PACK_SUGGEST[+b.dataset.psug]; if(p.restore){ d.added=p.restore==="recomp"?restoreRecomp():restoreOEP(); W.step=3; renderAll(); renderSheet(); return; } if(p.aoc){ W.type="aoc"; d.pick=new Set(); renderSheet(); return; } d.url=p.url; d.name=p.name; W.step=2; renderSheet(); });
      $("#sh-back").textContent="Cancel";
      return;
    }
    if (W.step===1){
      const df=packDiff(d.apps2);
      const urls=new Set(d.apps2.map(a=>normUrl(a.url)));
      const same=S.packs.map(p=>({p, n:S.emus.filter(e=>e.packs.includes(p.id)&&urls.has(normUrl(e.source))).length, tot:S.emus.filter(e=>e.packs.includes(p.id)).length})).filter(x=>x.tot&&x.n/x.tot>=0.8).sort((a,b)=>b.n-a.n)[0];
      d.updateOf = same ? same.p.id : null;
      sheetFrame(same?"Update a pack you have":"Check the pack","",`
        ${same?`<div class="verdict ok"><b>This is ${esc(same.p.name)}${d.ver?` ${esc(d.ver)}`:""}.</b> You already have it${same.p.ver?` (${esc(same.p.ver)})`:""}. Adding it updates that pack instead of making a second one.</div>`:""}
        <div class="found"><div class="ok">${d.apps2.length} apps found in ${esc(d.file)}</div>
          <div class="muted" style="font-size:13px">${df.have} already in your list · <b>${df.fresh.length} new</b></div></div>
        ${df.fresh.length?`<div class="q"><span class="lbl">New apps by type</span><div class="sugs">${Object.entries(df.cats).map(([c,n])=>`<span class="pill plat">${esc(CATS[c]||c)} · ${n}</span>`).join(" ")}</div>
          <div class="pick">${df.fresh.slice(0,40).map(a=>`<label><span class="pill plat">${a.src}</span> ${esc(a.name)} <span class="muted" style="font-size:12px">${esc(a.about)}</span></label>`).join("")}${df.fresh.length>40?`<label class="muted">and ${df.fresh.length-40} more…</label>`:""}</div></div>`
          :`<p class="hint">Every app in this file is already in your list. Adding it still links the apps to this pack, so you can see where they come from.</p>`}
        ${same?"":`<div class="q"><label for="pk-name">Name of the pack</label><input type="text" id="pk-name" value="${esc(d.name)}"></div>`}
        <p class="help">New apps are added unticked. Tick the ones you want to back up.</p>`,
        ()=>{W.step=0; renderSheet();}, ()=>{ if (d.updateOf && S.packs.some(p=>p.id===d.updateOf)){ const n=updatePack(d.updateOf, d.apps2, d.ver); d.added=n; d.updated=true; } else { d.added=addPack({name:(d.name||"My pack").trim(), ver:d.ver||"", date:"2026-10-28", src:"", kind:"file"}, d.apps2); d.updated=false; } W.step=3; renderAll(); renderSheet(); }, same?"Update pack":"Add pack", false);
      if ($("#pk-name")) $("#pk-name").oninput=e=>{d.name=e.target.value;};
      return;
    }
    if (W.step===2){
      sheetFrame("Add a pack by link","",`
        <div class="q"><label for="pk-url">Link to the pack</label><input type="url" id="pk-url" placeholder="https://github.com/maker/pack" value="${esc(d.url)}">
          <p class="help">Paste the page of the pack on GitHub or Codeberg. The app looks in the newest release for the .json file, and checks again every time you refresh.</p>
          ${d.err?`<div class="err" role="alert">${esc(d.err)}</div>`:""}</div>
        <div class="q"><label for="pk-lname">Name</label><input type="text" id="pk-lname" value="${esc(d.name)}" placeholder="e.g. My emulators"></div>
        <div class="verdict maybe">This preview can't download from the internet. The pack is added and waits for its first download. To see real apps now, import the .json file instead.</div>`,
        ()=>{W.step=0; d.err=""; renderSheet();}, ()=>{
          const u=(d.url||"").trim(); let ok=false; try{ ok=/^https?:\/\//.test(u) && !!new URL(u).hostname; }catch(e){}
          if(!ok){ d.err="That doesn't look like a link. A link starts with https://"; return renderSheet(); }
          if (S.packs.some(p=>normUrl(p.src)===normUrl(u))){ d.err="This pack is already in your list."; return renderSheet(); }
          S.packs.push({id:"p"+Date.now().toString(36), name:(d.name||new URL(u).pathname.split("/").filter(Boolean).pop()||"Pack").trim(), src:u, kind:"link", waiting:true});
          log(`Pack linked: ${u}`); d.added=null; W.step=3; renderAll(); renderSheet(); }, "Add pack", false);
      $("#pk-url").oninput=e=>{d.url=e.target.value; d.err="";};
      $("#pk-lname").oninput=e=>{d.name=e.target.value;};
      return;
    }
    return doneScreen(d.added===null?`Pack linked`:d.updated?`Pack updated`:`Pack added`, d.added===null?`It will be downloaded the next time the lists refresh.`:(d.added?`${d.added} new app(s) are in your list, unticked. Tick what you want to back up.`:`No new apps in this version. Everything was already in your list.`), "emu");
  }

  if (W.type==="bios"){
    if (W.step===0){
      const ok = d.name.trim() && d.bfiles.some(f=>f.f.trim());
      sheetFrame("Add a BIOS system","",`
        <div class="q"><label for="b-name">System name</label><input type="text" id="b-name" value="${esc(d.name)}" placeholder="e.g. Sega Saturn">
          <div class="sugs">${["Sega Saturn","Neo Geo","Atari Lynx","PC Engine CD","3DO"].map(s=>`<button class="sug" data-bs="${s}" aria-pressed="${d.name===s}">${s}</button>`).join("")}</div></div>
        <div class="q"><span class="lbl">Which files belong in it?</span>
          <p class="help">Type the file name exactly as the emulator expects it. Tick "required" if the emulator won't start without it.</p>
          <div class="rows" id="b-rows">${d.bfiles.map((f,i)=>`<div class="brow">
            <input type="text" data-bf="${i}" value="${esc(f.f)}" placeholder="file.bin" aria-label="File name ${i+1}">
            <label class="req"><input type="checkbox" data-br="${i}" ${f.req?"checked":""}> required</label>
            <button class="del" data-bd="${i}" aria-label="Remove row" ${d.bfiles.length<2?"disabled":""}>×</button></div>`).join("")}</div>
          <button class="btn small" id="b-more" style="align-self:flex-start">+ Another file</button></div>
        <div class="q"><label for="b-used">For which emulator? <span class="muted" style="font-weight:400">(optional)</span></label><input type="text" id="b-used" value="${esc(d.used)}" placeholder="e.g. RetroArch, Yaba Sanshiro"></div>
        <div class="preview">Folder: <span class="mono">${esc(S.dir)}/bios/${slug(d.name)||"…"}/</span></div>`,
        ()=>{W.type=null; renderSheet();}, saveBios, "Add", !ok);
      const upd = ()=>{ $("#sh-next").disabled = !(d.name.trim() && d.bfiles.some(f=>f.f.trim())); document.querySelector(".preview .mono").textContent=`${S.dir}/bios/${slug(d.name)||"…"}/`; };
      $("#b-name").oninput = ev=>{d.name=ev.target.value; upd();};
      $("#b-used").oninput = ev=>{d.used=ev.target.value;};
      document.querySelectorAll("[data-bf]").forEach(i=>i.oninput=()=>{d.bfiles[+i.dataset.bf].f=i.value; upd();});
      document.querySelectorAll("[data-br]").forEach(i=>i.onchange=()=>{d.bfiles[+i.dataset.br].req=i.checked;});
      document.querySelectorAll("[data-bd]").forEach(b=>b.onclick=()=>{d.bfiles.splice(+b.dataset.bd,1); renderSheet();});
      $("#b-more").onclick = ()=>{d.bfiles.push({f:"",req:false}); renderSheet(); const ins=document.querySelectorAll("[data-bf]"); ins[ins.length-1].focus();};
      document.querySelectorAll("[data-bs]").forEach(b=>b.onclick=()=>{
        d.name=b.dataset.bs;
        const known={"Sega Saturn":[["sega_101.bin",true],["mpr-17933.bin",true]],"Neo Geo":[["neogeo.zip",true]],"Atari Lynx":[["lynxboot.img",true]],"PC Engine CD":[["syscard3.pce",true]],"3DO":[["panafz10.bin",true]]}[d.name];
        if (known && !d.bfiles.some(f=>f.f.trim())) d.bfiles = known.map(([f,req])=>({f,req}));
        renderSheet();
      });
      return;
    }
    return doneScreen(`BIOS folder for ${d.name} is ready`, `Put your own files in the folder. You will see right away which ones are still missing.`, "bios");
  }

  // ---- ROM
  if (W.type==="rom"){
    if (W.step===0){
      const EXT = [".zip",".7z",".chd",".iso",".bin",".cue",".rom",".img"];
      sheetFrame("Add a ROM folder","",`
        <div class="q"><label for="r-name">For which console?</label><input type="text" id="r-name" value="${esc(d.name)}" placeholder="e.g. Neo Geo">
          <div id="r-bios" style="margin-top:6px">${biosBoxHTML(d.folder||matchSystem(d.name))}</div>
          <div class="sugs">${[["Neo Geo","neogeo",[".zip"]],["Atari Lynx","atarilynx",[".lnx",".zip"]],["Sega Saturn","saturn",[".chd",".cue"]],["PC Engine","pcengine",[".pce",".zip"]],["MSX","msx",[".rom",".dsk"]]].map(([n,f,e])=>`<button class="sug" data-rs="${n}" data-rf="${f}" data-re="${e.join(" ")}" aria-pressed="${d.name===n}">${n}</button>`).join("")}</div></div>
        <div class="q"><span class="lbl">Which file types?</span>
          <p class="help">Tap what you use. Not sure? You can leave this empty.</p>
          <div class="sugs">${[...new Set([...EXT,...d.ext])].map(e=>`<button class="sug" data-ext="${e}" aria-pressed="${d.ext.includes(e)}">${e}</button>`).join("")}</div></div>
        <div id="r-shape">${EV.shapeHTML(d.folder||matchSystem(d.name)||slug(d.name).replace(/-/g,""))}</div>
        <div class="preview">Folder: <span class="mono">${esc(S.dir)}/roms/${d.folder||matchSystem(d.name)||slug(d.name).replace(/-/g,"")||"…"}/</span></div>`,
        ()=>{W.type=null; renderSheet();}, saveRom, "Add", !d.name.trim());
      $("#r-name").oninput = ev=>{d.name=ev.target.value; d.folder=""; const m=matchSystem(d.name); $("#sh-next").disabled=!d.name.trim(); $("#r-bios").innerHTML=biosBoxHTML(m); $("#r-shape").innerHTML=EV.shapeHTML(m||slug(d.name).replace(/-/g,"")); document.querySelector(".preview .mono").textContent=`${S.dir}/roms/${m||slug(d.name).replace(/-/g,"")||"…"}/`;};
      document.querySelectorAll("[data-ext]").forEach(b=>b.onclick=()=>{const e=b.dataset.ext; d.ext=d.ext.includes(e)?d.ext.filter(x=>x!==e):[...d.ext,e]; renderSheet();});
      document.querySelectorAll("[data-rs]").forEach(b=>b.onclick=()=>{d.name=b.dataset.rs; d.folder=b.dataset.rf; d.ext=b.dataset.re.split(" "); renderSheet();});
      return;
    }
    return doneScreen(`ROM folder for ${d.name} is ready`, (()=>{ const id=d.folder||matchSystem(d.name); const s=id?biosState(id):null; return s&&s.k==="missing"?`This system needs a BIOS. You will find it under BIOS → Still to collect.`:`Drop your games on the new card in the ROMs overview.`; })(), "roms");
  }

  // ---- CATEGORIE
  if (W.type==="cat"){
    if (W.step===0){
      sheetFrame("Make a custom list","Step 1 of 2",`
        <div class="q"><label for="c-name">List name</label><input type="text" id="c-name" value="${esc(d.name)}" placeholder="e.g. Favorites">
          <div class="sugs">${["Favorites","For the Retroid","To test","Kids"].map(s=>`<button class="sug" data-cs="${s}" aria-pressed="${d.name===s}">${s}</button>`).join("")}</div></div>`,
        ()=>{W.type=null; renderSheet();}, ()=>{ if(CATS[d.name.trim()]||Object.values(CATS).includes(d.name.trim())){d.err="That list already exists."; renderSheet(); return;} W.step=1; renderSheet();}, "Next", !d.name.trim());
      if (d.err) $("#sh-body").insertAdjacentHTML("beforeend",`<div class="err" role="alert">${esc(d.err)}</div>`);
      $("#c-name").oninput = ev=>{d.name=ev.target.value; d.err=""; $("#sh-next").disabled=!d.name.trim();};
      document.querySelectorAll("[data-cs]").forEach(b=>b.onclick=()=>{d.name=b.dataset.cs; d.err=""; renderSheet();});
      return;
    }
    if (W.step===1){
      sheetFrame(`Which apps belong in ${d.name}?`,"Step 2 of 2",`
        <input class="search" id="c-q" type="search" placeholder="Search an app" aria-label="Search an app">
        <div class="pick" id="c-pick">${S.emus.slice().sort((a,b)=>(b.on-a.on)||a.name.localeCompare(b.name)).map(e=>`<label data-n="${esc((e.name+" "+e.sys).toLowerCase())}"><input type="checkbox" data-ca="${e.id}" ${d.apps.includes(e.id)?"checked":""}> ${esc(e.name)} <span class="muted" style="font-size:12px">${esc(e.sys)}</span></label>`).join("")}</div>
        <p class="help">An app can only be in one list. You can change this later.</p>`,
        ()=>{W.step=0; renderSheet();}, saveCat, d.apps.length?`Create list (${d.apps.length})`:"Create empty list");
      $("#c-q").oninput = ev=>{const q=ev.target.value.toLowerCase(); document.querySelectorAll("#c-pick label").forEach(l=>l.hidden=!l.dataset.n.includes(q));};
      document.querySelectorAll("[data-ca]").forEach(c=>c.onchange=()=>{const id=c.dataset.ca; d.apps=c.checked?[...d.apps,id]:d.apps.filter(x=>x!==id); $("#sh-next").textContent=d.apps.length?`Create list (${d.apps.length})`:"Create empty list";});
      return;
    }
    return doneScreen(`List ${d.name} created`, d.apps.length?`${d.apps.length} app(s) are now in this list.`:"Add apps later from Settings.", "emu");
  }
}

function doneScreen(title, text, tab){
  sheetFrame("Done","",`<div class="done"><div class="big">OK!</div><b style="font-size:17px">${esc(title)}</b><p class="hint">${esc(text)}</p></div>`,
    null, ()=>{ closeAdd(); document.querySelector(`.tab[data-tab="${tab}"]`).click(); }, "View");
  $("#sh-back").textContent="Add something else"; $("#sh-back").onclick=()=>openAdd();
}

function findApp(){
  const d=W.d, raw=d.url.trim();
  if(!raw){ d.err="Paste a link first."; return renderSheet(); }
  let u; try{ u=new URL(raw.startsWith("http")?raw:"https://"+raw); }catch{ d.err="That doesn't look like a link. A link usually starts with https://"; return renderSheet(); }
  const host=u.hostname.replace(/^www\./,""), href=u.href.replace(/\/$/,"").toLowerCase();
  const gh = host==="github.com" ? u.pathname.split("/").filter(Boolean) : null;
  if (gh && gh.length<2){ d.err="This is a GitHub user, not an app. Open the app itself and paste that link, e.g. github.com/maker/app."; return renderSheet(); }
  const dup = S.emus.find(e=>e.source.replace(/\/$/,"").toLowerCase()===href);
  if (dup){
    d.err = `<b>${esc(dup.name)}</b> is already in your list with this link.` + (host==="buildbot.libretro.com"
      ? ` Want something else from RetroArch? <button class="sug" data-goto="https://buildbot.libretro.com/nightly/android/">Nightly build</button> <button class="sug" data-goto="https://buildbot.libretro.com/nightly/android/latest/arm64-v8a/">All cores</button>` : "");
    return renderSheet();
  }
  $("#sh-next").disabled=true; $("#sh-next").textContent="Searching…";
  setTimeout(()=>{
    d.all=false; d.folder=""; d.trail=null; d.more=0; d.verHint=""; d.dateHint="";
    d.source=u.href; d.host=host;
    if (gh){
      const repo=gh[1]; d.web=false; d.src="GitHub";
      d.name=pretty(repo); d.host=`github.com/${gh[0]}/${gh[1]}`; d.source=`https://github.com/${gh[0]}/${gh[1]}`;
      d.ver="v"+(1+Math.floor(Math.random()*3))+"."+Math.floor(Math.random()*20)+".0";
      const r=slug(repo);
      d.files=[
        {name:`${r}-${d.ver}-android-arm64.apk`, plat:"android", mb:38+Math.floor(Math.random()*90), rec:true, on:S.platform!=="linux"},
        {name:`${r}-${d.ver}-linux-x86_64.AppImage`, plat:"linux", mb:60+Math.floor(Math.random()*90), rec:true, on:S.platform!=="android"},
        {name:`${r}-${d.ver}-windows-x64.zip`, plat:"windows", mb:40+Math.floor(Math.random()*60), rec:false, on:false},
        {name:`source-code.tar.gz`, plat:"other", mb:12, rec:false, on:false}];
    } else {
      d.web=true; d.src="Website";
      const p=u.pathname;
      if (host==="buildbot.libretro.com" && /latest\/[^/]+\/?$/.test(p)){        // cores-map
        const arch=p.split("/").filter(Boolean).pop();
        d.name="RetroArch-cores"; d.sys="Multi-system"; d.folder=`312 cores for ${arch}, about 1.1 GB in total`; d.all=true;
        d.trail=["nightly","android","latest",arch]; d.more=306; d.how="wijziging"; d.howRec="wijziging";
        d.files=[["swanstation_libretro_android.so.zip","PlayStation 1",4],["mupen64plus_next_gles3_libretro_android.so.zip","Nintendo 64",6],["snes9x_libretro_android.so.zip","SNES",2],["mgba_libretro_android.so.zip","Game Boy (Advance)",2],["genesis_plus_gx_libretro_android.so.zip","Mega Drive",2],["fbneo_libretro_android.so.zip","Arcade",14]]
          .map(([n,w,mb])=>({name:n,plat:"android",mb,what:w,rec:false,on:false}));
      } else if (host==="buildbot.libretro.com"){                              // nightly / stable
        const nightly=p.includes("nightly");
        d.name = nightly ? "RetroArch Nightly" : "RetroArch"; d.sys="Multi-system";
        if (nightly){
          d.trail=["nightly","android"]; d.dateHint="2026-10-28"; d.how="datum"; d.howRec="datum";
          d.files=[{name:"2026-10-28_RetroArch_aarch64.apk",plat:"android",mb:142,what:"64-bit, for almost every device",rec:true,on:true},
                   {name:"2026-10-28_RetroArch_ra32.apk",plat:"android",mb:120,what:"32-bit, older devices",rec:false,on:false},
                   {name:"2026-10-28_RetroArch.apk",plat:"android",mb:248,what:"universal, larger",rec:false,on:false}];
        } else {
          d.trail=["stable","1.21.0","android"]; d.verHint="1.21.0"; d.how="map"; d.howRec="map";
          d.files=[{name:"RetroArch_aarch64.apk",plat:"android",mb:142,what:"64-bit",rec:true,on:true},
                   {name:"RetroArch.7z",plat:"linux",mb:96,what:"from stable/1.21.0/linux/x86_64",rec:true,on:S.platform!=="android"}];
        }
      } else {                                                                  // gewone website
        const base=host.split(".").slice(-2,-1)[0];
        d.name=pretty(base); d.verHint="0.271"; d.how="map"; d.howRec="map";
        d.files=[{name:`${base}0271b_64bit.exe`,plat:"windows",mb:98,rec:false,on:false},
                 {name:`${base}0271s.zip`,plat:"other",mb:180,what:"source code",rec:false,on:false},
                 {name:`${base}-0.271-linux-x86_64.tar.xz`,plat:"linux",mb:85,rec:true,on:S.platform!=="android"},
                 {name:`${base}-0.271-android-arm64.apk`,plat:"android",mb:72,rec:true,on:S.platform!=="linux"}];
        d.trail=null;
      }
    }
    W.step=1; renderSheet();
  },700);
}

function saveApp(){
  const d=W.d, plats=[...new Set(d.files.filter(f=>f.on&&(f.plat==="android"||f.plat==="linux")).map(f=>f.plat))];
  const id=slug(d.name)+"-custom";
  S.emus.push({id, packs:[], name:d.name.trim(), cat:d.cat, sys:d.sys.trim()||"Custom app", src:d.src, source:d.source, dl:d.source+(d.src==="GitHub"?"/releases/latest":""), site:d.src==="GitHub"?d.source:"https://"+d.host, pkg:"", linux:plats.includes("linux"), plats:plats.length?plats:["android"], on:true, mine:true, versions:[], latest:[d.ver,"2026-10-28"], mb:d.all?1100:d.files.filter(f=>f.on).reduce((a,f)=>a+f.mb,0), how:d.how});
  log(`Custom app added: ${d.name}`);
  S.filter=d.cat; renderAll(); W.step=4; renderSheet();
}
function saveBios(){
  const d=W.d;
  { const e={id:slug(d.name), name:d.name.trim(), mine:true, used:d.used.trim()||"your own emulators", why:"Your own BIOS system.", files:d.bfiles.filter(f=>f.f.trim()).map(f=>({f:f.f.trim(), req:f.req, note:""}))}; e.st=e.files.some(f=>f.req)?"req":"opt"; BIOSDB.push(e); BIOS_MAP[e.id]=e; BIOS_EXTRA_NAMES[e.id]=e.name; }
  log(`Custom BIOS system added: ${d.name}`); renderAll(); W.step=1; renderSheet();
}
function saveRom(){
  const d=W.d;
  const nid=d.folder||matchSystem(d.name)||slug(d.name).replace(/-/g,""); S.roms.push({id:nid, name:d.name.trim(), ext:d.ext.join(" ")||"all types", n:0, mb:0, mine:true}); EV.addSystem(nid); EV.keepShape(nid);
  log(`Custom ROM folder added: ${d.name}`); renderAll(); W.step=1; renderSheet();
}
function saveCat(){
  const d=W.d, key=d.name.trim();
  CATS[key]=key;
  d.apps.forEach(id=>{ const e=S.emus.find(x=>x.id===id); if(e) e.cat=key; });
  log(`Custom list created: ${key}${d.apps.length?` (${d.apps.length} apps)`:""}`);
  S.filter=key; renderAll(); W.step=2; renderSheet();
}


$("#sheet").addEventListener("click", ev=>{ if(ev.target.id==="sheet") closeAdd(); });
document.addEventListener("keydown", ev=>{ if(ev.key==="Escape" && !$("#sheet").hidden) closeAdd(); });

// =====================================================================================
//  6. Recent changes + undo  (loaded first so the other parts can record into it)
// =====================================================================================
S.hist = [];
S.trashDays = 30;
S.trash.forEach(f=>f.at ||= "2026-10-20");
function record(label, undo, opt={}){
  S.hist.unshift({id:"h"+Date.now()+Math.random().toString(36).slice(2,5), t:now().slice(0,5), label, undo:undo||null, done:false, tab:opt.tab||null});
  S.hist=S.hist.slice(0,40);
  if (typeof renderSet==="function" && $("#view-set") && $("#view-set").innerHTML) renderSet();
}
function undoHist(id){
  const h=S.hist.find(x=>x.id===id); if(!h||!h.undo||h.done) return;
  h.undo(); h.done=true; log(`Undone: ${h.label}`); toast(`Undone: ${h.label}`); renderAll(); renderHome();
}
// hooks
{ const _mt=moveToTrash;
  moveToTrash=function(files, why){ _mt(files, why); const ids=files.map(f=>f.id); files.forEach(f=>{ const x=S.trash.find(t=>t.id===f.id); if(x) x.at="2026-10-29"; });
    record(`${files.length} file${files.length===1?"":"s"} moved to _duplicates`, ()=>restore(ids), {tab:"roms"}); }; }
{ const _ai=acceptInbox;
  acceptInbox=function(f, opts={}){
    const before=new Set([...S.romFiles,...S.trash].map(x=>x.id)), doneLen=S.inboxDone.length;
    _ai(f, opts);
    const added=S.romFiles.filter(x=>!before.has(x.id)), trashed=S.trash.filter(x=>!before.has(x.id));
    record(`Inbox: ${f.name} sorted`, ()=>{
      added.forEach(a=>{ S.romFiles=S.romFiles.filter(x=>x.id!==a.id); const r=S.roms.find(x=>x.id===a.sys); if(r){ r.n=Math.max(0,r.n-1); r.mb=Math.max(0,Math.round(r.mb-a.mb)); } S.art.got.delete(a.id); });
      trashed.forEach(a=>{ S.trash=S.trash.filter(x=>x.id!==a.id); });
      S.inbox.push(f); S.inboxDone.shift();
    }, {tab:"roms"});
  }; }
const trashAge = f => Math.round((new Date("2026-10-29")-new Date(f.at||"2026-10-29"))/86400000);

// =====================================================================================
//  4. RetroAchievements check
// =====================================================================================
const RA_SYS = new Set(["nes","snes","gb","gbc","gba","n64","nds","megadrive","mastersystem","gamegear","psx","ps2","psp","pcengine","atarilynx","ngpc","wonderswan","virtualboy","sega32x","segacd","saturn","dreamcast","arcade"]);
const RA_NOSET = new Set(["metal gear solid integral"]);
const RA_REV = {"donkey kong country":2};
function raStatus(f){
  const p=parseFile(f);
  if (!RA_SYS.has(f.sys)) return {k:"none", t:"RetroAchievements doesn't support this system yet."};
  if (p.bad) return {k:"no", t:"Damaged copy: its fingerprint isn't recognized."};
  if (p.special.some(s=>/^t[-+]/i.test(s))) return {k:"maybe", t:"Some fan translations have their own achievement set. The app checks the patched file's fingerprint."};
  if (p.special.length) return {k:"no", t:"Hacks only work if RetroAchievements lists that exact hack."};
  if (!p.datName) return {k:"no", t:"Unknown dump. Use a dump that matches No-Intro or Redump."};
  if (RA_NOSET.has(p.key)) return {k:"noset", t:"Recognized, but nobody has made achievements for this game yet."};
  if (RA_REV[p.key] && p.rev && p.rev!==RA_REV[p.key]) return {k:"other", t:`This revision isn't supported. Rev ${RA_REV[p.key]} is${S.romFiles.some(x=>x.sys===f.sys && parseFile(x).key===p.key && parseFile(x).rev===RA_REV[p.key])?", and you have it":""}.`};
  return {k:"ok", t:"Supported: achievements work with this file."};
}
S.ra = {ran:false};
const RA_LABEL = {ok:["ok","supported"], other:["warn","other version"], no:["bad","not recognized"], noset:["plat","no set yet"], maybe:["info","maybe"], none:["plat","system not supported"]};
function raToolHTML(){
  let h=`<div class="sys-block tool" id="ra-tool" style="margin-top:12px"><header><div><h3>RetroAchievements</h3><div class="used">Which of your ROMs work with achievements</div></div>`;
  if (!S.ra.ran){ h+=`<button class="btn small primary" id="ra-run">Check</button></header><p class="hint" style="margin:0">Achievements only work with specific dumps. The check compares each file's fingerprint with the RetroAchievements list. No account needed.</p></div>`; return h; }
  const rows=S.romFiles.map(f=>({f, s:raStatus(f)})), cnt=k=>rows.filter(r=>r.s.k===k).length;
  h+=`<span class="pill ok">${cnt("ok")} supported</span></header>
    <div class="nums vnums"><div><b>${cnt("ok")}</b>supported</div><div><b>${cnt("other")}</b>other version needed</div><div><b>${cnt("no")}</b>not recognized</div><div><b>${cnt("noset")}</b>no set yet</div></div>
    <div class="files">${rows.filter(r=>r.s.k!=="ok").map(r=>{ const [c,l]=RA_LABEL[r.s.k]; return `<div class="frow"><span class="ck ${c==="plat"?"info":c}">${r.s.k==="no"?"✗":r.s.k==="maybe"||r.s.k==="noset"||r.s.k==="none"?"i":"!"}</span><div><div class="fn">${esc(r.f.name)}</div><div class="note">roms/${esc(r.f.sys)}/ · ${esc(r.s.t)}</div></div><span class="pill ${c}">${l}</span></div>`; }).join("")}</div>
    <div class="gact"><button class="btn small" id="ra-run">Check again</button><a class="linkbtn" href="https://retroachievements.org" target="_blank" rel="noopener" style="align-self:center">retroachievements.org</a></div></div>`;
  return h;
}

// =====================================================================================
//  5. Translation patches
// =====================================================================================
S.patches = [
  {id:"p1", name:"Metal Gear Solid Integral - English.xdelta", kind:"Translation", sys:"psx", title:"Metal Gear Solid - Integral", reg:"Japan", tag:"T-En", mb:31},
  {id:"p2", name:"Final Fantasy V (J) [RPGe 1.1].ips", kind:"Translation", sys:"snes", title:"Final Fantasy V", reg:"Japan", tag:"T-En RPGe", mb:0.4},
  {id:"p3", name:"Super Mario World - Restoration.bps", kind:"Fix", sys:"snes", title:"Super Mario World", reg:"USA", tag:"Restoration", mb:0.1},
  {id:"p4", name:"my_patch.ips", kind:"Unknown", sys:null, title:null, reg:null, tag:"Patched", mb:0.2},
];
function patchTarget(p){
  if (!p.sys) return p.pick ? S.romFiles.find(f=>f.id===p.pick) : null;
  const k=ckey(p.title);
  return S.romFiles.find(f=>f.sys===p.sys && parseFile(f).key===k && !parseFile(f).special.length && (parseFile(f).regions.map(r=>REG_NAMES[r]||r).includes(p.reg)||!p.reg));
}
function patchesToolHTML(){
  let h=`<div class="sys-block tool" id="patch-tool" style="margin-top:12px"><header><div><h3>Translations and fixes</h3><div class="used">Apply .ips, .bps, .ups and .xdelta patches</div></div><span class="pill info">${S.patches.filter(p=>!p.done).length} patches</span></header>
    <p class="hint" style="margin:0">Put patches in <span class="mono">${esc(S.dir)}/patches/</span>. The app finds the game each patch is for, checks that your file is the exact version the patch expects, and makes a new patched copy. Your original file is never changed.</p>
    <div class="files">`;
  for (const p of S.patches){
    const tgt=patchTarget(p);
    let st, act="";
    if (p.done) { st=`Done: <span class="mono">${esc(p.done)}</span>`; act=`<span class="pill ok">applied</span>`; }
    else if (!p.sys && !p.pick) { const opts=S.romFiles.filter(f=>!parseFile(f).special.length); st=`We couldn't tell which game this patch is for.`; act=`<select style="max-width:150px;min-width:0" data-ppick="${p.id}" aria-label="Choose the game for ${esc(p.name)}"><option value="">Choose the game…</option>${opts.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join("")}</select>`; }
    else if (tgt) { st=`For <span class="mono">${esc(tgt.name)}</span>${p.exact?" · version matches":p.sys?" · found by name (the patch checks the version itself)":" · chosen by you"}`; act=`<button class="btn small primary" data-papply="${p.id}">Apply</button>`; }
    else { st=`Needs ${esc(p.title)} (${esc(p.reg)}), which you don't have yet.`; act=`<button class="btn small" data-pwish="${p.id}">Add to wishlist</button>`; }
    h+=`<div class="frow"><span class="dot ${p.done?"on":""}"></span><div><div class="fn">${esc(p.name)}</div><div class="note">${esc(p.kind)}${p.sys&&GI[p.sys]?` · ${esc(sysLabel(GI[p.sys]))}`:""} · ${st}</div></div>${act}</div>`;
  }
  h+=`</div><div class="gact"><label class="btn small" for="patch-file" style="cursor:pointer">Add patch files</label><input type="file" id="patch-file" accept=".ips,.bps,.ups,.xdelta" multiple hidden></div></div>`;
  return h;
}
function bindExtraTools(){
  const re=()=>renderRoms();
  const ra=$("#ra-run"); if(ra) ra.onclick=()=>EV.later("The RetroAchievements check"); 
  document.querySelectorAll("[data-papply]").forEach(b=>b.onclick=()=>EV.applyPatch(b.dataset.papply, b)); 
  document.querySelectorAll("[data-ppick]").forEach(s=>s.onchange=()=>{ const p=S.patches.find(x=>x.id===s.dataset.ppick); p.pick=s.value||null; re(); });
  document.querySelectorAll("[data-pwish]").forEach(b=>b.onclick=()=>{ const p=S.patches.find(x=>x.id===b.dataset.pwish); const w=(S.coll.wish[p.sys] ||= {}); w[ckey(p.title)]=1; saveColl(); toast(`${p.title} is on your wishlist`); re(); });
  const pf=$("#patch-file"); if(pf) pf.onchange=()=>EV.addPatches([...pf.files]); 
}

// =====================================================================================
//  3. Profiles per device
// =====================================================================================
const LAYOUTS = {esde:"ES-DE (Android)", muos:"muOS", batocera:"Batocera / Knulli", ra:"RetroArch only"};
S.profiles = [
  {id:"rp5", name:"Retroid Pocket 5", systems:["gba","snes","psx","gb"], layout:"esde", cover:"300", bios:true, saves:true},
  {id:"rg35", name:"Anbernic RG35XX", systems:["gba","gb","snes","megadrive"], layout:"muos", cover:"300", bios:true, saves:true},
];
S.drives.forEach(d=>{ if(d.id==="sd") d.profile="rg35"; });
function profilePlan(drv, prof){
  const onDrive=new Set(drv.files.map(f=>{ const l=driveSys(f.dir); return l.sys+"|"+parseRom(f.name).key; }));
  const games=S.romFiles.filter(f=>prof.systems.includes(f.sys) && !onDrive.has(f.sys+"|"+parseFile(f).key) && !parseFile(f).bad);
  const bios=prof.bios ? prof.systems.flatMap(s=>biosFor(s).files.filter(x=>biosHas(s, x.f)).map(x=>s+"/"+x.f)) : [];
  const covers=games.filter(hasCover).length;
  const saves=prof.saves ? prof.systems.length*7 : 0;
  const mb=games.reduce((a,f)=>a+f.mb,0)+covers*(prof.cover==="300"?0.03:0.08);
  return {games, bios, covers, saves, mb};
}
function profilesHTML(drv){
  let h=`<details class="filt" data-k="drv:profiles" ${isOpen("drv:profiles")||drv?"open":""} style="margin-top:12px"><summary>Device profiles <span class="fs">${S.profiles.length} profile${S.profiles.length===1?"":"s"}</span></summary>
    <p class="hint" style="margin:0">A profile says what goes on a device: which systems, in which folder layout, with which cover size, BIOS and saves.</p>
    <div class="sysgrid">${S.profiles.map(p=>`<div class="syscard"><span class="sn">${esc(p.name)}</span><span class="sc">${p.systems.map(s=>esc(SYS_SHORT[s]||s)).join(" · ")}</span><span class="src">${esc(LAYOUTS[p.layout])} · covers ${p.cover} px${p.bios?" · BIOS":""}${p.saves?" · saves":""}</span><button class="linkbtn" data-pedit="${p.id}" style="align-self:flex-start">Edit</button></div>`).join("")}</div>
    <button class="btn small" id="prof-new" style="align-self:flex-start">+ New profile</button>`;
  if (drv){
    const prof=S.profiles.find(p=>p.id===(drv.profile||S.profiles[0]?.id));
    if (prof){
      const pl=profilePlan(drv, prof);
      h+=`<div class="sys-block" style="margin-top:4px"><header><div><h3>Fill ${esc(drv.name)} with a profile</h3><div class="used">Only adds what's missing. Nothing on the drive is deleted.</div></div></header>
        <div class="q"><label for="prof-sel">Profile</label><select id="prof-sel">${S.profiles.map(p=>`<option value="${p.id}" ${p.id===prof.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></div>
        <div class="checks">
          <div class="crow2"><span class="ck ok">+</span><span><b>${pl.games.length} games</b> for ${prof.systems.map(s=>SYS_SHORT[s]||s).join(", ")}, in the ${esc(LAYOUTS[prof.layout])} layout</span></div>
          <div class="crow2"><span class="ck ok">+</span><span><b>${pl.covers} covers</b>, resized to ${prof.cover} px</span></div>
          ${prof.bios?`<div class="crow2"><span class="ck ok">+</span><span><b>${pl.bios.length} BIOS file${pl.bios.length===1?"":"s"}</b> you have for these systems</span></div>`:""}
          ${prof.saves?`<div class="crow2"><span class="ck ok">+</span><span><b>Saves</b> for these systems, kept in sync both ways</span></div>`:""}
        </div>
        <div class="bar"><span class="muted" style="font-size:13px">About ${size(Math.max(1,Math.round(pl.mb)))} · ${size(drv.free)} free on the drive</span><button class="btn primary small" id="prof-apply" ${pl.mb>drv.free?"disabled":""}>Fill the drive</button></div></div>`;
    }
  }
  return h+`</details>`;
}
function bindProfiles(drv){
  const re=()=>renderRoms();
  const ps=$("#prof-sel"); if(ps) ps.onchange=()=>{ drv.profile=ps.value; re(); };
  const pn=$("#prof-new"); if(pn) pn.onclick=()=>openAdd("profile");
  document.querySelectorAll("[data-pedit]").forEach(b=>b.onclick=()=>{ const p=S.profiles.find(x=>x.id===b.dataset.pedit); openAdd("profile", {edit:p.id, name:p.name, systems:[...p.systems], layout:p.layout, cover:p.cover, bios:p.bios, saves:p.saves}); });
  const pa=$("#prof-apply"); if(pa) pa.onclick=()=>{ pa.disabled=true; pa.textContent="Copying…"; EV.fillDrive(drv); }; 
}
{ const _rd=renderDrives;
  renderDrives=function(el){ _rd(el); const drv=S.drives.find(d=>d.id===S.drv.sel);
    if (drv && !drv.scanned) return;
    const box=document.createElement("div"); box.innerHTML=profilesHTML(drv||null);
    const first=el.querySelector(".sysgrid"); if(first) first.after(...box.childNodes); else el.append(...box.childNodes);
    bindProfiles(drv); }; }

// =====================================================================================
//  2. First-run import of an existing setup
// =====================================================================================
S.imported = false;
let FOUND = [
  {id:"ra-sys", path:"/storage/emulated/0/RetroArch/system", what:"BIOS files", n:14, note:"9 match the BIOS list", mb:12},
  {id:"roms", path:"/storage/emulated/0/ROMs", what:"games", n:352, note:"6 systems · folders SNES, GBA, PS1, N64, MD, GB", mb:41200},
  {id:"saves", path:"/storage/emulated/0/RetroArch/saves + states", what:"saves", n:186, note:"for RetroArch", mb:64},
  {id:"apks", path:"/storage/emulated/0/Download", what:"emulator installers", n:3, note:"DuckStation, PPSSPP, Azahar", mb:290},
  {id:"sd", path:"SD card 1234-ABCD/Roms", what:"games", n:7, note:"from your handheld", mb:770},
];
const RENAME = [["SNES","snes"],["GBA","gba"],["PS1","psx"],["N64","n64"],["MD","megadrive"],["GB","gb"]];

// =====================================================================================
//  extra sheets: profile editor, import wizard, search
// =====================================================================================
const EXTRA_SHEETS = {
  profile(){
    const d=W.d; d.systems ||= []; d.layout ||= "esde"; d.cover ||= "300"; if(d.bios===undefined) d.bios=true; if(d.saves===undefined) d.saves=true;
    const mine=[...new Set([...S.roms.map(r=>r.id), ...S.romFiles.map(f=>f.sys)])].filter(s=>GI[s]);
    const seg3=(name,opts,val)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-${name}="${v}" aria-pressed="${v===val}">${l}</button>`).join("")}</div>`;
    if (W.step===1) return doneScreen(`Profile ${d.name} saved`, "Plug in the device or its SD card, open Drives and choose Fill the drive.", "roms");
    sheetFrame(d.edit?"Edit profile":"New device profile","",`
      <div class="q"><label for="pf-name">Device name</label><input type="text" id="pf-name" value="${esc(d.name||"")}" placeholder="e.g. Retroid Pocket 5"></div>
      <div class="q"><span class="lbl">Systems on this device</span><div class="sugs">${mine.map(s=>`<button class="sug" data-pfs="${s}" aria-pressed="${d.systems.includes(s)}">${esc(GI[s]?GI[s].name:s)}</button>`).join("")}</div></div>
      <div class="q"><span class="lbl">Folder layout</span>${seg3("pfl",Object.entries(LAYOUTS),d.layout)}<p class="help">Use the layout of the frontend on that device.</p></div>
      <div class="q"><span class="lbl">Cover size</span>${seg3("pfc",[["0","None"],["300","300 px"],["600","600 px"]],d.cover)}</div>
      <label class="inline-t"><input type="checkbox" id="pf-bios" ${d.bios?"checked":""}> Copy the BIOS files I have</label>
      <label class="inline-t"><input type="checkbox" id="pf-saves" ${d.saves?"checked":""}> Keep saves in sync with this device</label>`,
      null, ()=>{ const p={id:d.edit||("pf"+Date.now()), name:d.name.trim(), systems:d.systems, layout:d.layout, cover:d.cover, bios:d.bios, saves:d.saves};
        const i=S.profiles.findIndex(x=>x.id===p.id); if(i>=0) S.profiles[i]=p; else S.profiles.push(p);
        log(`Profile saved: ${p.name}`); W.step=1; renderRoms(); renderSheet(); }, "Save profile", !(d.name&&d.name.trim()&&d.systems.length));
    $("#pf-name").oninput=e=>{ d.name=e.target.value; $("#sh-next").disabled=!(d.name.trim()&&d.systems.length); };
    document.querySelectorAll("[data-pfs]").forEach(b=>b.onclick=()=>{ const s=b.dataset.pfs; d.systems=d.systems.includes(s)?d.systems.filter(x=>x!==s):[...d.systems,s]; renderSheet(); });
    document.querySelectorAll("[data-pfl]").forEach(b=>b.onclick=()=>{ d.layout=b.dataset.pfl; renderSheet(); });
    document.querySelectorAll("[data-pfc]").forEach(b=>b.onclick=()=>{ d.cover=b.dataset.pfc; renderSheet(); });
    $("#pf-bios").onchange=e=>{ d.bios=e.target.checked; }; $("#pf-saves").onchange=e=>{ d.saves=e.target.checked; };
  },
  import(){
    const d=W.d; d.pick ||= new Set(FOUND.map(f=>f.id)); d.how ||= "leave";
    if (W.step===0){
      sheetFrame("Bring in what you already have","Step 1 of 3",`
        <p class="help">Emu Vault looks for ROMs, BIOS files, saves and emulator installers on this device and on plugged-in drives. Nothing is changed until you say so.</p>
        ${d.scanning?`<div class="prog"><i style="width:60%"></i></div><p class="hint">Looking in your folders…</p>`:""}`,
        null, ()=>{ d.scanning=true; renderSheet(); EV.findSetup().then(()=>{ d.scanning=false; d.pick=new Set(FOUND.map(f=>f.id)); W.step=1; renderSheet(); }); }, d.scanning?"Looking…":"Look for my files", !!d.scanning);
      return;
    }
    if (W.step===1){
      sheetFrame("This is what we found","Step 2 of 3",`
        <div class="rows">${FOUND.map(f=>`<label class="opt ${d.pick.has(f.id)?"":"dim"}"><input type="checkbox" data-imp="${f.id}" ${d.pick.has(f.id)?"checked":""}><span><b>${nl(f.n)} ${f.what}</b> · ${size(f.mb)}<br><span class="mono" style="font-size:12px;overflow-wrap:anywhere">${esc(f.path)}</span><br><span class="muted" style="font-size:12px">${esc(f.note)}</span></span><span></span></label>`).join("")}</div>`,
        ()=>{ W.step=0; renderSheet(); }, ()=>{ W.step=2; renderSheet(); }, "Next", !d.pick.size);
      document.querySelectorAll("[data-imp]").forEach(c=>c.onchange=()=>{ c.checked?d.pick.add(c.dataset.imp):d.pick.delete(c.dataset.imp); renderSheet(); });
      return;
    }
    if (W.step===2){
      const mb=FOUND.filter(f=>d.pick.has(f.id)).reduce((a,f)=>a+f.mb,0);
      const H=[["leave","Leave them where they are","Nothing moves. BIOS files are copied in by fingerprint and save folders are backed up from where they are. Games stay where they are.",true],["copy","Copy them into the vault",`Your originals stay. Games go to the Inbox, where you check where each one goes. Uses ${size(mb)} extra space.`],["move","Move them into the vault","Games go to the Inbox, where you check where each one goes. Your old folders end up empty. You can undo this in Recent changes."]];
      sheetFrame("How should Emu Vault use them?","Step 3 of 3",`
        <div class="rows">${H.map(([v,t,s,rec])=>`<label class="opt ${d.how===v?"":"dim"}" style="border-color:${d.how===v?"var(--accent)":"var(--line)"}"><input type="radio" name="imp-how" value="${v}" ${d.how===v?"checked":""}><span><b style="font-size:14px">${t}</b><br><span class="muted" style="font-size:12.5px">${s}</span></span>${rec?`<span class="pill ok">recommended</span>`:"<span></span>"}</label>`).join("")}</div>
        ${d.how!=="leave"&&d.pick.has("roms")?`<details class="codes"><summary>Folder names are changed to the ES-DE names</summary><div class="tscroll"><table><thead><tr><th>Now</th><th>In the vault</th></tr></thead><tbody>${RENAME.map(([a,b])=>`<tr><td class="mono">ROMs/${a}/</td><td class="mono">roms/${b}/</td></tr>`).join("")}</tbody></table></div></details>`:""}`,
        ()=>{ W.step=1; renderSheet(); }, ()=>{ const picked=FOUND.filter(f=>d.pick.has(f.id)); if(d.how==="copy"){ if(typeof needSpace==="function" && !needSpace(mb,"the copy")) return; S.space.free-=mb; } S.imported=true; EV.importSetup(picked, d.how);
          const label=`Imported ${picked.map(f=>`${nl(f.n)} ${f.what}`).join(", ")} (${{leave:"left in place",copy:"copied",move:"moved"}[d.how]})`;
          log(label); record(label, d.how==="leave"?()=>{ S.imported=false; }:()=>{ S.imported=false; log(d.how==="move"?"Files moved back to their old folders":"Copied files removed from the vault"); }, {tab:"home"});
          W.step=3; renderAll(); renderHome(); renderSheet(); }, d.how==="leave"?"Use them":d.how==="copy"?"Copy":"Move");
      document.querySelectorAll('input[name="imp-how"]').forEach(r=>r.onchange=()=>{ d.how=r.value; renderSheet(); });
      return;
    }
    return doneScreen("Your setup is in Emu Vault", "Your games, BIOS files and saves now show up everywhere in the app. Check Home for what's left to do.", "home");
  },
};
{ const _rs=renderSheet; renderSheet=function(){ if (EXTRA_SHEETS[W.type]) return EXTRA_SHEETS[W.type](); return _rs(); }; }

// =====================================================================================
//  1. Home
// =====================================================================================
function go(tab, after){ const t=document.querySelector(`.tab[data-tab="${tab}"]`); if(t) t.click(); if(after){ after(); } }
const GO = {
  apps:()=>go("emu",()=>{ S.onlyOn=true; renderChips(); renderEmus(); }),
  self:()=>go("set",()=>{ S.ui.open.add("set:Emu Vault"); renderSet(); }),
  inbox:()=>go("roms",()=>{ S.romView="inbox"; renderRoms(); }),
  dups:()=>go("roms",()=>{ S.romView="dubbels"; renderRoms(); }),
  bios:()=>go("bios",()=>{ S.biosView.filter="todo"; renderBios(); }),
  bk:()=>go("bk"),
  art:()=>go("roms",()=>{ S.romView="tools"; S.ui.open.add("blk:art-tool"); S.ui.open.add("art:miss"); renderRoms(); setTimeout(()=>{ const el=document.querySelector('[data-k="art:miss"]')||$("#art-tool"); if(el) el.scrollIntoView({block:"start"}); },30); }),
  drive:()=>go("roms",()=>{ S.romView="drives"; S.drv.sel="sd"; renderRoms(); }),
  coll:()=>go("coll"),
  hist:()=>go("set",()=>{ S.ui.open.add("set:Recent changes"); renderSet(); setTimeout(()=>$('[data-k="set:Recent changes"]')?.scrollIntoView({block:"start"}),30); }),
  import:()=>openAdd("import"),
};
function homeItems(){
  const it=[];
  const upd=S.emus.filter(needsUpdate).length, inbox=S.inbox.length, dups=findDups().filter(g=>!S.dupIgnored.has(g.key)).length;
  const bios=mySystemIds().filter(id=>biosState(id).k==="missing"), biosFiles=bios.reduce((a,id)=>a+biosState(id).missing,0);
  const covers=artTargets().length, drv=S.drives.find(d=>d.id==="sd"), prof=drv&&S.profiles.find(p=>p.id===drv.profile);
  if (!S.imported) it.push({k:"start", icon:"→", t:"Bring in your existing setup", s:"Find the ROMs, BIOS files and saves you already have", go:"import", btn:"Start"});
  if (selfUpdateAvailable()) it.push({k:"warn", icon:"↑", t:`Emu Vault v${S.self.latest.ver} is available`, s:"Update the app itself", go:"self"});
  if (upd) it.push({k:"warn", icon:"↑", t:`${upd} emulator update${upd>1?"s":""}`, s:S.emus.filter(needsUpdate).slice(0,3).map(e=>e.name).join(", ")+(upd>3?"…":""), go:"apps", btn:"Update all", act:"updall"});
  if (inbox) it.push({k:"warn", icon:"⇣", t:`${inbox} new file${inbox>1?"s":""} in the Inbox`, s:(n=>n?`${n} ready to add`:"Check where they go")(S.inbox.filter(isClear).length), go:"inbox"});
  if (drv && prof){ const pl=profilePlan(drv,prof); if(pl.games.length) it.push({k:"warn", icon:"▣", t:`${drv.name} is plugged in`, s:`${pl.games.length} games missing for profile ${prof.name}`, go:"drive"}); }
  if (dups) it.push({k:"info", icon:"≡", t:`${dups} games with duplicates`, s:"Review and clean up", go:"dups"});
  if (bios.length) it.push({k:"info", icon:"▤", t:`${biosFiles} BIOS file${biosFiles>1?"s":""} to collect`, s:`for ${bios.slice(0,3).map(biosName).join(", ")}${bios.length>3?"…":""}`, go:"bios"});
  if (covers) it.push({k:"info", icon:"▢", t:`${covers} cover${covers>1?"s":""} missing`, s:S.art.from==="esde"?"See which ones, and scrape them in ES-DE":"See which ones, and download them from libretro-thumbnails", go:"art"});
  if (typeof EV==="object") EV.bkHome(it);
  return it;
}
function renderHome(){
  const el=$("#view-home"); if(!el) return;
  const items=homeItems(), todo=items.filter(i=>i.k!=="ok"), ok=items.filter(i=>i.k==="ok");
  const mine=mySystems().map(id=>({id, p:progress(id)})).filter(x=>x.p).sort((a,b)=>b.p.have-a.p.have).slice(0,4);
  const row=i=>`<div class="hrow ${i.k}"><button class="hmain" data-hgo="${i.go}"><span class="hico" aria-hidden="true">${i.icon}</span><span class="htx"><b>${esc(i.t)}</b><span>${esc(i.s)}</span></span></button>${i.btn?`<button class="btn small ${i.k==="start"?"primary":""}" data-hgo="${i.go}" ${i.act?`data-hact="${i.act}"`:""}>${i.btn}</button>`:`<span class="hchev" aria-hidden="true"></span>`}</div>`;
  let h=`<div class="hhead"><span class="muted">Last check ${esc(typeof MA==="object"?MA.M.lastCheck:"")}</span><span style="display:flex;gap:8px;flex-wrap:wrap">${typeof EV!=="undefined"&&EV.esdeHomeBtn?EV.esdeHomeBtn():""}<button class="btn small" id="h-check" title="Apps, your library, the Inbox and BIOS">Check everything</button></span></div>`;
  h+=`<div class="group"><h2>${todo.length?`To do · ${todo.length}`:"Nothing to do"}</h2><div class="hlist">${todo.map(row).join("")||`<div class="empty-state">All caught up.</div>`}</div></div>`;
  h+=`<div class="group" style="margin-top:14px"><h2>All good</h2><div class="hlist">${ok.map(row).join("")}</div></div>`;
  if (mine.length) h+=`<div class="group" style="margin-top:14px"><h2>Your collection</h2><div class="hlist">${mine.map(x=>`<button class="hrow hmain" data-hsys="${x.id}" style="width:100%"><span class="htx"><b>${esc(GI[x.id].name)}</b><span class="pbar sm" style="margin-top:6px"><i style="width:${Math.max(x.p.have/x.p.total*100,1.5)}%"></i></span><span>${x.p.have} of ${nl(x.p.total)} games</span></span><span class="hchev" aria-hidden="true"></span></button>`).join("")}</div></div>`;
  const hist=S.hist.slice(0,3);
  if (hist.length) h+=`<div class="group" style="margin-top:14px"><h2 style="display:flex;justify-content:space-between"><span>Recent changes</span><button class="linkbtn" data-hgo="hist">All changes</button></h2><div class="hlist">${hist.map(x=>`<div class="hrow"><span class="htx" style="padding:10px 12px"><b style="font-weight:500">${esc(x.label)}</b><span>${x.t}${x.done?" · undone":""}</span></span>${x.undo&&!x.done?`<button class="btn small" data-hundo="${x.id}">Undo</button>`:""}</div>`).join("")}</div></div>`;
  el.innerHTML=h;
  el.querySelectorAll("[data-hgo]").forEach(b=>b.onclick=()=>{ if(b.dataset.hact==="updall"){ go("emu"); updateAll(); return; } GO[b.dataset.hgo](); });
  el.querySelectorAll("[data-hsys]").forEach(b=>b.onclick=()=>go("coll",()=>{ S.coll.view="systeem"; S.coll.sys=b.dataset.hsys; S.coll.q=""; renderColl(); }));
  el.querySelectorAll("[data-hundo]").forEach(b=>b.onclick=()=>undoHist(b.dataset.hundo));
  $("#h-check").onclick=()=>{ $("#h-check").disabled=true; $("#h-check").textContent="Checking…"; log("Checking everything…"); EV.checkAll(); };
  const n=$("#n-home"); if(n) n.textContent=todo.length?`${todo.length} to do`:"";
}

// =====================================================================================
//  7. Search everywhere
// =====================================================================================
function searchIndex(){
  const R=[];
  S.emus.forEach(e=>R.push({g:"Apps", t:e.name, s:e.sys, run:()=>go("emu",()=>{ S.q=e.name; $("#q").value=e.name; S.filter="alle"; S.ui.open.add("emu-"+e.id); renderChips(); renderEmus(); })}));
  S.romFiles.forEach(f=>R.push({g:"Your games", t:f.name, s:GI[f.sys]?sysLabel(GI[f.sys]):f.sys, run:()=>go("roms",()=>{ S.romView="bestanden"; S.fb.sys=f.sys; S.fb.filter="alles"; S.fb.q=parseFile(f).title; S.fb.open=f.id; renderRoms(); })}));
  mySystems().forEach(s=>(LISTS[s]||[]).forEach(g=>{ if(g[2]===0) R.push({g:"Game lists", t:g[0], s:GI[s].name, run:()=>go("coll",()=>{ S.coll.view="systeem"; S.coll.sys=s; S.coll.q=g[0]; S.coll.show="alles"; renderColl(); })}); }));
  BIOSDB.forEach(e=>e.files.forEach(x=>R.push({g:"BIOS", t:x.f, s:biosName(e.id), run:()=>go("bios",()=>{ S.biosView.filter="all"; S.biosView.q=""; S.ui.open.add("blk:"+e.id); renderBios(); setTimeout(()=>$(`[data-bios="${e.id}"]`)?.scrollIntoView({block:"center"}),40); })})));
  ["Look","Emu Vault","Add your own","Box art","Which region do you keep?","Recent changes","Folders & downloads"].forEach(t=>R.push({g:"Settings", t, s:"Settings", run:()=>go("set",()=>{ S.ui.open.add("set:"+t); renderSet(); setTimeout(()=>$(`[data-k="set:${t}"]`)?.scrollIntoView({block:"start"}),40); })}));
  [["Check for updates",()=>go("emu",checkUpdates)],["Back up everything now",()=>go("bk",()=>$("#bk-all")?.click())],["Download missing covers",GO.art],["Check RetroAchievements",()=>go("roms",()=>{ S.romView="tools"; S.ra.ran=true; S.ui.open.add("blk:ra-tool"); renderRoms(); })],["Bring in your existing setup",GO.import],["New device profile",()=>openAdd("profile")],["Switch to controller mode",()=>setPad(!S.pad.on)]].forEach(([t,run])=>R.push({g:"Actions", t, s:"", run}));
  return R;
}
S.cmd = {q:"", i:0, items:[]};
function openSearch(){ S.cmd={q:"", i:0, items:searchIndex()}; $("#cmdk").hidden=false; document.body.style.overflow="hidden"; renderSearch(); setTimeout(()=>$("#cmdk-q").focus(),20); }
function closeSearch(){ $("#cmdk").hidden=true; document.body.style.overflow=""; }
function searchResults(){
  const q=S.cmd.q.trim().toLowerCase(); if(!q) return S.cmd.items.filter(r=>r.g==="Actions"||r.g==="Settings");
  const words=q.split(/\s+/), groups={};
  S.cmd.items.forEach(r=>{ const hay=(r.t+" "+r.s).toLowerCase(); if(words.every(w=>hay.includes(w))) (groups[r.g] ||= []).push(r); });
  return ["Actions","Apps","Your games","BIOS","Game lists","Settings"].flatMap(g=>(groups[g]||[]).slice(0,g==="Game lists"?6:5));
}
function renderSearch(){
  const res=searchResults(); S.cmd.res=res; S.cmd.i=Math.min(S.cmd.i, Math.max(0,res.length-1));
  let last=""; $("#cmdk-list").innerHTML = res.length ? res.map((r,i)=>{ const head=r.g!==last?`<div class="cmdg">${esc(r.g)}</div>`:""; last=r.g; return head+`<button class="cmdi ${i===S.cmd.i?"on":""}" data-ci="${i}"><span class="ct">${esc(r.t)}</span><span class="muted">${esc(r.s)}</span></button>`; }).join("") : `<div class="empty-state">Nothing found for “${esc(S.cmd.q)}”.</div>`;
  document.querySelectorAll("[data-ci]").forEach(b=>b.onclick=()=>pickSearch(+b.dataset.ci));
}
function pickSearch(i){ const r=S.cmd.res[i]; if(!r) return; closeSearch(); r.run(); }
(function initSearch(){
  const q=$("#cmdk-q");
  q.oninput=()=>{ S.cmd.q=q.value; S.cmd.i=0; renderSearch(); };
  q.onkeydown=e=>{ if(e.key==="ArrowDown"){ e.preventDefault(); S.cmd.i=Math.min(S.cmd.i+1,S.cmd.res.length-1); renderSearch(); $(".cmdi.on")?.scrollIntoView({block:"nearest"}); } else if(e.key==="ArrowUp"){ e.preventDefault(); S.cmd.i=Math.max(0,S.cmd.i-1); renderSearch(); $(".cmdi.on")?.scrollIntoView({block:"nearest"}); } else if(e.key==="Enter"){ e.preventDefault(); pickSearch(S.cmd.i); } else if(e.key==="Escape") closeSearch(); };
  $("#cmdk").addEventListener("click", e=>{ if(e.target.id==="cmdk") closeSearch(); });
  document.querySelectorAll("[data-search]").forEach(b=>b.onclick=openSearch);
  document.addEventListener("keydown", e=>{ const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||""); if(((e.key==="/"&&!typing)||(e.key.toLowerCase()==="k"&&(e.ctrlKey||e.metaKey))) && $("#cmdk").hidden){ e.preventDefault(); openSearch(); } });
})();

// =====================================================================================
//  8. Controller mode
// =====================================================================================
S.pad = {on:false, auto:true, connected:false};
function setPad(on){ S.pad.on=on; document.documentElement.classList.toggle("pad", on); $("#padbar").hidden=!on; if(on){ toast("Controller mode on: D-pad moves, Ⓐ selects, Ⓑ goes back, LB/RB switch tabs"); if(!document.activeElement||document.activeElement===document.body) focusFirst(); } renderSet(); }
const visibleFocusables = scope => [...scope.querySelectorAll('button:not([disabled]),a[href],input:not([type=hidden]):not([disabled]),select,summary,[role="button"][tabindex="0"]')].filter(el=>{ const r=el.getBoundingClientRect(); return r.width>0 && r.height>0 && getComputedStyle(el).visibility!=="hidden"; });
function padScope(){ for (const id of ["cmdk","lbx","sheet"]) { const el=$("#"+id); if(el && !el.hidden) return el; } return document.body; }
function focusFirst(){ const sc=padScope(), list=visibleFocusables(sc===document.body?document.querySelector("main.app"):sc); if(list[0]) list[0].focus(); }
function padMove(dir){
  const sc=padScope(), list=visibleFocusables(sc), cur=document.activeElement;
  if (!cur || cur===document.body || !sc.contains(cur)) return focusFirst();
  const a=cur.getBoundingClientRect(), ax=a.left+a.width/2, ay=a.top+a.height/2;
  let best=null, bs=1e9;
  for (const el of list){ if(el===cur) continue; const b=el.getBoundingClientRect(), bx=b.left+b.width/2, by=b.top+b.height/2, dx=bx-ax, dy=by-ay;
    const ok = dir==="right"?dx>4:dir==="left"?dx<-4:dir==="down"?dy>4:dy<-4; if(!ok) continue;
    const main = dir==="left"||dir==="right"?Math.abs(dx):Math.abs(dy), side = dir==="left"||dir==="right"?Math.abs(dy):Math.abs(dx);
    const sc2=main+side*2.5; if(sc2<bs){ bs=sc2; best=el; } }
  if (best){ best.focus({preventScroll:true}); best.scrollIntoView({block:"nearest", inline:"nearest"}); }
}
function padBack(){
  if (!$("#cmdk").hidden) return closeSearch();
  if (!$("#lbx").hidden) return closeLbx();
  if (!$("#sheet").hidden) return closeAdd();
  const tab=document.querySelector('.tab[aria-selected="true"]')?.dataset.tab;
  if (tab==="coll" && S.coll.view==="systeem"){ S.coll.view="overzicht"; renderColl(); return; }
  if (tab!=="home") return go("home", focusFirst);
}
function padTab(d){ const tabs=[...document.querySelectorAll(".tab")].filter(t=>t.offsetParent!==null||t.dataset.tab==="set"), i=tabs.findIndex(t=>t.getAttribute("aria-selected")==="true"); const n=tabs[(i+d+tabs.length)%tabs.length]; n.click(); setTimeout(focusFirst,30); }
document.addEventListener("keydown", e=>{
  if (!S.pad.on) return; const typing=/INPUT|TEXTAREA/.test(document.activeElement?.tagName||"") && document.activeElement.type!=="checkbox" && document.activeElement.type!=="radio";
  const map={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"};
  if (map[e.key] && !typing && $("#cmdk").hidden && $("#lbx").hidden){ e.preventDefault(); padMove(map[e.key]); }
  else if ((e.key==="Backspace" && !typing) || (e.key==="Escape" && $("#cmdk").hidden && $("#lbx").hidden && $("#sheet").hidden)){ e.preventDefault(); padBack(); }
  else if (!typing && (e.key==="q"||e.key==="[")) padTab(-1); else if (!typing && (e.key==="e"||e.key==="]")) padTab(1);
});
(function initPad(){
  let raf=null, prev={}, rep={};
  const press=(k,fn)=>{ const t=performance.now(); if(!prev[k]){ fn(); rep[k]=t+380; } else if(t>rep[k] && ["up","down","left","right"].includes(k)){ fn(); rep[k]=t+120; } };
  const poll=()=>{ let gp=null; try{ gp=[...(navigator.getGamepads?navigator.getGamepads():[])].find(Boolean); }catch(e){}
    if (gp && S.pad.on){ const b=i=>gp.buttons[i]&&gp.buttons[i].pressed, ax=gp.axes||[];
      const st={a:b(0), b:b(1), lb:b(4), rb:b(5), up:b(12)||ax[1]<-.6, down:b(13)||ax[1]>.6, left:b(14)||ax[0]<-.6, right:b(15)||ax[0]>.6, start:b(9), lt:b(6), rt:b(7)};
      if(st.up) press("up",()=>padMove("up")); if(st.down) press("down",()=>padMove("down")); if(st.left) press("left",()=>!$("#lbx").hidden?stepLbx(-1):padMove("left")); if(st.right) press("right",()=>!$("#lbx").hidden?stepLbx(1):padMove("right"));
      if(st.a) press("a",()=>document.activeElement?.click()); if(st.b) press("b",padBack); if(st.lb) press("lb",()=>padTab(-1)); if(st.rb) press("rb",()=>padTab(1)); if(st.start) press("start",openSearch); if(st.lt) press("lt",()=>window.padPage&&padPage(-1)); if(st.rt) press("rt",()=>window.padPage&&padPage(1));
      prev=st; }
    raf=requestAnimationFrame(poll); };
  try{
    window.addEventListener("gamepadconnected", ()=>{ S.pad.connected=true; if(S.pad.auto && !S.pad.on) setPad(true); if(!raf) poll(); });
    window.addEventListener("gamepaddisconnected", ()=>{ S.pad.connected=false; });
  }catch(e){}
})();

// =====================================================================================
//  settings: controller mode in Look + Recent changes section
// =====================================================================================
SET_SUB["Recent changes"]=()=>`${S.hist.length} change${S.hist.length===1?"":"s"} · _duplicates ${size(Math.round(S.trash.reduce((a,f)=>a+f.mb,0)))}`;
SET_SUB["Look"]=()=>(document.documentElement.dataset.skin==="modern"?"Modern":"Retro 83")+(S.pad.on?" · controller mode":"");
{ const _set=renderSet;
  renderSet=function(){
    _set();
    const root=$("#view-set > div"); if(!root) return;
    const look=[...root.querySelectorAll(":scope > .form, :scope > details")].find(x=>x.textContent.includes("Retro 83"));
    const lookForm=look && (look.matches(".form")?look:look.querySelector(".form"));
    if (lookForm && !lookForm.querySelector("#pad-on")){
      lookForm.insertAdjacentHTML("beforeend",`<div class="field"><span class="lbl">Controller mode</span>
        <label class="inline-t"><input type="checkbox" id="pad-on" ${S.pad.on?"checked":""}> Bigger buttons, move with the D-pad</label>
        <label class="inline-t"><input type="checkbox" id="pad-auto" ${S.pad.auto?"checked":""}> Turn on by itself when a controller connects</label>
        <p class="hint">On a handheld: D-pad or stick moves, Ⓐ selects, Ⓑ goes back, LB/RB switch tabs, Start opens search. On a keyboard: arrow keys, Enter, Backspace, Q/E.</p></div>`);
      $("#pad-on").onchange=e=>setPad(e.target.checked); $("#pad-auto").onchange=e=>{ S.pad.auto=e.target.checked; };
    }
    if (!root.querySelector("#hist-sec")){
      const trashMb=S.trash.reduce((a,f)=>a+f.mb,0), old=S.trash.filter(f=>S.trashDays && trashAge(f)>=S.trashDays);
      const html=`<div class="form set-sec" id="hist-sec"><h2>Recent changes</h2>
        ${S.hist.length?`<div class="files">${S.hist.map(x=>`<div class="frow"><span class="dot ${x.done?"":"on"}"></span><div><div class="fn" style="font-family:var(--f-body)">${esc(x.label)}</div><div class="note">${x.t}${x.done?" · undone":""}</div></div>${x.undo&&!x.done?`<button class="btn small" data-hundo="${x.id}">Undo</button>`:x.done?`<span class="pill plat">undone</span>`:`<span class="pill plat">can't undo</span>`}</div>`).join("")}</div>`:`<p class="hint" style="margin:0">Nothing changed yet. Everything the app moves, renames or copies shows up here, with an Undo button.</p>`}
        <div class="field"><span class="lbl">_duplicates folders</span><p class="hint" style="margin:0">${S.trash.length} file${S.trash.length===1?"":"s"} · ${size(Math.max(0,Math.round(trashMb)))}${old.length?` · ${old.length} older than ${S.trashDays} days`:""}</p>
          <div class="seg" role="group">${[[0,"Keep forever"],[30,"Empty after 30 days"],[90,"After 90 days"]].map(([v,l])=>`<button data-tdays="${v}" aria-pressed="${S.trashDays===v}">${l}</button>`).join("")}</div>
          ${S.trash.length?`<button class="linkbtn" id="trash-now" style="align-self:flex-start">Empty all _duplicates now</button>`:""}</div></div>`;
      const anchor=root.querySelector('[data-k="set:Folders & downloads"]') || [...root.children].pop();
      anchor.insertAdjacentHTML("beforebegin", html);
      root.querySelectorAll("[data-hundo]").forEach(b=>b.onclick=()=>undoHist(b.dataset.hundo));
      root.querySelectorAll("[data-tdays]").forEach(b=>b.onclick=()=>{ S.trashDays=+b.dataset.tdays; log(S.trashDays?`_duplicates: emptied after ${S.trashDays} days`:"_duplicates: kept forever"); renderSet(); });
      const tn=$("#trash-now"); if(tn) tn.onclick=()=>{ if(tn.dataset.sure){ const n=S.trash.length; S.trash=[]; record(`Emptied _duplicates (${n} files)`, null); log(`Emptied _duplicates: ${n} files`); toast(`${n} files deleted for good`); renderSet(); renderRoms(); } else { tn.dataset.sure="1"; tn.textContent="Tap again to delete them for good"; } };
    }
  }; }
// tools: add RetroAchievements + patches blocks
{ const _rt=renderTools; renderTools=function(){ return _rt()+raToolHTML()+patchesToolHTML(); };
  const _bt=bindTools; bindTools=function(){ _bt(); bindExtraTools(); }; }
// files details: RetroAchievements line
{ const _rf=renderFiles; renderFiles=function(){ let h=_rf(); return h.replace(/<dt>Languages<\/dt><dd>([^<]*)<\/dd>/, (m)=>m); }; }
// keep Home fresh
{ const _ra=renderAll; renderAll=function(){ _ra(); renderHome(); }; }
{ const _lg=log; log=function(m){ _lg(m); if (typeof renderHome==="function" && !$("#view-home").hidden) renderHome(); }; }

// =====================================================================================
//  A. Notifications
// =====================================================================================
S.notif = {on:true, kinds:{apps:true, self:true, inbox:true, drive:true, backup:true, space:true}, quiet:true, mute:new Set()};
const NOTIF_KINDS = [["apps","Emulator updates"],["self","Emu Vault updates"],["inbox","New files in the Inbox"],["drive","A drive or SD card is plugged in"],["backup","A backup failed"],["space","Running out of space"]];
function notify(kind, title, text, goKey){
  if (!S.notif.on || !S.notif.kinds[kind]) return false;
  const n=$("#notif"); n.innerHTML=`<span class="nic" aria-hidden="true">EV</span><span class="ntx"><b>${esc(title)}</b><span>${esc(text)}</span></span><span class="muted" style="font-size:11px;flex:none">now</span>`;
  n.hidden=false; n.classList.remove("in"); void n.offsetWidth; n.classList.add("in");
  n.onclick=()=>{ n.hidden=true; if(goKey&&GO[goKey]) GO[goKey](); };
  clearTimeout(n._t); n._t=setTimeout(()=>{ n.hidden=true; },5200);
  return true;
}
function updateNotice(){
  const ups=S.emus.filter(e=>needsUpdate(e) && !S.notif.mute.has(e.id));
  if (!ups.length) return notify("apps","Emu Vault","All your emulators are up to date","apps");
  return notify("apps", ups.length===1?`${ups[0].name} has an update`:`${ups.length} emulator updates`, ups.slice(0,3).map(e=>`${e.name} ${e.latest[0]}`).join(", ")+(ups.length>3?"…":""), "apps");
}

// =====================================================================================
//  B. Storage warning
// =====================================================================================
S.space = {free:52600, total:953674, warn:10240};   // MB
const spaceLow = () => S.space.free < S.space.warn;
function needSpace(mb, what){
  if (S.space.free - mb >= S.space.warn) return true;
  const short = S.space.free - mb < 0;
  toast(short?`Not enough space for ${what}: needs ${size(Math.round(mb))}, ${size(S.space.free)} free`:`Careful: after ${what} only ${size(Math.max(0,Math.round(S.space.free-mb)))} is left`);
  if (short) notify("space","Not enough space",`${what} needs ${size(Math.round(mb))}. Free up space or choose another drive.`,"space");
  return !short;
}
GO.space = ()=>go("roms",()=>{ S.romView="tools"; S.ui.open.add("blk:storage"); renderRoms(); });
{ const _hi=homeItems; homeItems=function(){ const it=_hi(); const free=size(S.space.free), pct=Math.round(S.space.free/S.space.total*100);
    const row = spaceLow()
      ? {k:"warn", icon:"!", t:`Only ${free} free on your drive`, s:`Less than your limit of ${size(S.space.warn)}. Compress disc games or clean up duplicates.`, go:"space"}
      : {k:"ok", icon:"◔", t:`${free} free on your drive`, s:`${pct}% free · you get a warning below ${size(S.space.warn)}`, go:"space"};
    const i=it.findIndex(x=>x.k==="ok"); if(row.k==="ok") it.push(row); else it.splice(i<0?it.length:i,0,row); return it; }; }
// the downloads use space: check before updating
{ const _ua=updateAll; updateAll=async function(){ const mb=S.emus.filter(needsUpdate).length*85; if(!needSpace(mb,"these updates")) return; S.space.free-=mb; return _ua(); }; }

// =====================================================================================
//  C. Export / import settings
// =====================================================================================
function exportSettings(){
  return {app:"Emu Vault", kind:"settings", version:1, exported:new Date().toISOString().slice(0,10),
    folder:S.dir, platform:S.platform, variant:S.variant, keep:S.keep, autoCheck:S.autoCheck,
    regions:S.regions, inbox:{mode:S.inboxMode, duplicates:S.inboxDup}, trashDays:S.trashDays,
    packs:S.packs.map(p=>p.id), appsOn:S.emus.filter(e=>e.on).map(e=>e.id),
    profiles:S.profiles, collection:{regions:S.coll.regs, manual:S.coll.manual, wishlist:S.coll.wish},
    boxArt:{source:S.art.source, user:S.art.user||"", media:S.art.media, size:S.art.size, folders:S.art.dest, show:S.art.show},
    backups:{when:S.bk.when, keep:S.bk.keep},
    look:{skin:document.documentElement.dataset.skin==="modern"?"modern":"retro", controller:S.pad.auto},
    notifications:{on:S.notif.on, kinds:S.notif.kinds, muted:[...S.notif.mute]}, space:{warnMB:S.space.warn}};
}
async function downloadSettings(){
  const data=JSON.stringify(exportSettings(),null,2), name="emu-vault-settings.json";
  let dl=null; try{ dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null; }catch(e){}
  if (dl){
    try{ const r=await dl.save({filename:name, data}); if(r.status==="saved"){ log(`Settings exported to ${name}`); toast(`Saved ${name}. Your ScreenScraper password is not in it.`); } }
    catch(e){ if(e&&e.code==="declined") return; toast(e&&e.code==="rate_limited"?"A save is already waiting for your answer":"Saving isn't possible here"); }
    return;
  }
  try{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([data],{type:"application/json"})); a.download=name; document.body.append(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); }catch(e){}
  log(`Settings exported to ${name}`); toast(`Saved ${name}. Your ScreenScraper password is not in it.`);
}
function applySettings(d){
  const before=exportSettings();
  if (d.folder) S.dir=d.folder; if (d.platform) S.platform=d.platform; if (d.variant) S.variant=d.variant; if (d.keep) S.keep=d.keep;
  if (Array.isArray(d.regions)) S.regions=d.regions; if (d.inbox){ S.inboxMode=d.inbox.mode||S.inboxMode; S.inboxDup=d.inbox.duplicates||S.inboxDup; }
  if (d.trashDays!==undefined) S.trashDays=d.trashDays;
  if (Array.isArray(d.appsOn)){ const on=new Set(d.appsOn); S.emus.forEach(e=>e.on=on.has(e.id)); }
  if (Array.isArray(d.profiles)) S.profiles=d.profiles;
  if (d.collection){ Object.assign(S.coll.regs, d.collection.regions||{}); S.coll.manual=d.collection.manual||S.coll.manual; S.coll.wish=d.collection.wishlist||S.coll.wish; saveColl(); }
  if (d.boxArt){ const b=d.boxArt; S.art.source=b.source||S.art.source; if(b.user){ S.art.user=b.user; S.art.signedIn=false; } Object.assign(S.art.media,b.media||{}); S.art.size=b.size||S.art.size; Object.assign(S.art.dest,b.folders||{}); if(b.show!==undefined) S.art.show=b.show; }
  if (d.backups){ S.bk.when=d.backups.when||S.bk.when; S.bk.keep=d.backups.keep||S.bk.keep; }
  if (d.look){ if(d.look.skin) setSkin(d.look.skin); if(d.look.controller!==undefined) S.pad.auto=d.look.controller; }
  if (d.notifications){ S.notif.on=d.notifications.on!==false; Object.assign(S.notif.kinds,d.notifications.kinds||{}); S.notif.mute=new Set(d.notifications.muted||[]); }
  if (d.space&&d.space.warnMB) S.space.warn=d.space.warnMB;
  return before;
}
function importSummary(d){
  const r=[];
  if (d.folder) r.push(`Main folder: ${d.folder}`);
  if (d.regions) r.push(`Region order: ${d.regions.join(" › ")}`);
  if (d.appsOn) r.push(`${d.appsOn.length} apps switched on`);
  if (d.profiles) r.push(`${d.profiles.length} device profile${d.profiles.length===1?"":"s"}: ${d.profiles.map(p=>p.name).join(", ")}`);
  if (d.collection) r.push(`Collection: ${Object.values(d.collection.wishlist||{}).reduce((a,w)=>a+Object.keys(w).length,0)} games on the wishlist`);
  if (d.boxArt&&d.boxArt.user) r.push(`ScreenScraper account ${d.boxArt.user} (sign in once more with your password)`);
  if (d.backups) r.push(`Backups: ${d.backups.when}, keep ${d.backups.keep}`);
  return r;
}
EXTRA_SHEETS.importset = function(){
  const d=W.d;
  if (W.step===1) return doneScreen("Settings imported", d.data.boxArt&&d.data.boxArt.user?"Sign in to ScreenScraper once more: passwords are never put in the file.":"Everything is set up like on your other device.", "set");
  if (d.err){ sheetFrame("This file can't be used","",`<p class="help">${esc(d.err)}</p>`, null, ()=>closeAdd(), "Close"); return; }
  const rows=importSummary(d.data);
  sheetFrame("Import these settings?","",`
    <p class="help">From <span class="mono">${esc(d.file)}</span>, exported ${esc(d.data.exported||"")}. These replace your current settings. Your games, BIOS files and saves are not touched.</p>
    <div class="checks">${rows.map(x=>`<div class="crow2"><span class="ck ok">✓</span><span>${esc(x)}</span></div>`).join("")}</div>`,
    ()=>closeAdd(), ()=>{ const before=applySettings(d.data); record(`Settings imported from ${d.file}`, ()=>applySettings(before), {tab:"set"}); log(`Settings imported from ${d.file}`); W.step=1; renderAll(); renderSheet(); }, "Import");
};
function readSettingsFile(file){
  const fr={}; EV.inv("read_text",{path:file.path}).then(t=>{ fr.result=t; fr.onload(); }).catch(e=>toast(EV.errMsg(e)));
  fr.onload=()=>{ let data=null, err=null;
    try{ data=JSON.parse(fr.result); if(data.app!=="Emu Vault"||data.kind!=="settings") err="It isn't an Emu Vault settings file. Export one in Settings on your other device."; }catch(e){ err="The file is damaged or isn't a settings file."; }
    openAdd("importset",{file:file.name, data, err}); };
}

// =====================================================================================
//  settings sections for A, B, C
// =====================================================================================
SET_SUB["Notifications"]=()=>S.notif.on?`On · ${Object.values(S.notif.kinds).filter(Boolean).length} kinds${S.notif.mute.size?` · ${S.notif.mute.size} apps muted`:""}`:"Off";
SET_SUB["Storage"]=()=>`${size(S.space.free)} free · warn below ${size(S.space.warn)}`;
SET_SUB["Move to another device"]=()=>"Export or import your settings";
SET_ALERT["Storage"]=()=>spaceLow();
{ const _set=renderSet;
  renderSet=function(){
    _set();
    const root=$("#view-set > div"); if(!root || root.querySelector("#notif-sec")) return;
    const myApps=S.emus.filter(e=>e.on);
    const html=`
    <div class="form set-sec" id="notif-sec"><h2>Notifications</h2>
      <label class="inline-t"><input type="checkbox" id="nt-on" ${S.notif.on?"checked":""}> Send me notifications</label>
      <div class="field" ${S.notif.on?"":'style="opacity:.5;pointer-events:none"'}><span class="lbl">Tell me about</span>
        ${NOTIF_KINDS.map(([k,l])=>`<label class="inline-t"><input type="checkbox" data-ntk="${k}" ${S.notif.kinds[k]?"checked":""}> ${l}</label>`).join("")}
        <label class="inline-t"><input type="checkbox" id="nt-quiet" ${S.notif.quiet?"checked":""}> Quiet at night (22:00–08:00): collect them for the morning</label></div>
      <details class="codes"${S.notif.on&&S.notif.kinds.apps?"":" hidden"}><summary>Updates per app · ${myApps.length-myApps.filter(e=>S.notif.mute.has(e.id)).length} of ${myApps.length} on</summary>
        <div class="rows" style="margin-top:8px">${myApps.map(e=>`<label class="inline-t"><input type="checkbox" data-ntapp="${e.id}" ${S.notif.mute.has(e.id)?"":"checked"}> ${esc(e.name)}</label>`).join("")}</div></details>
      <button class="btn small" id="nt-test" style="align-self:flex-start">Send a test notification</button>
      <p class="hint" style="margin:0">Android shows them as normal notifications. On Linux they appear in your desktop's notification area.</p></div>
    ${typeof EV!=="undefined"&&EV.bgHTML?EV.bgHTML():""}
    ${typeof EV!=="undefined"&&EV.extraHTML?EV.extraHTML():""}
    <div class="form set-sec" id="space-sec"><h2>Storage</h2>
      <div class="field"><span class="lbl">${esc(S.dir)}</span>
        <div class="pbar"><i style="width:${Math.round((1-S.space.free/S.space.total)*100)}%;${spaceLow()?"background:var(--bad)":""}"></i></div>
        <p class="hint" style="margin:0">${size(S.space.free)} free of ${size(S.space.total)}${spaceLow()?" · below your limit":""}</p></div>
      <div class="field"><span class="lbl">Warn me when less than this is free</span>
        <div class="seg" role="group">${[[5120,"5 GB"],[10240,"10 GB"],[20480,"20 GB"],[51200,"50 GB"]].map(([v,l])=>`<button data-spw="${v}" aria-pressed="${S.space.warn===v}">${l}</button>`).join("")}</div>
        <p class="hint">Before a download, a copy to a drive or an import, the app checks if it fits. If it doesn't, it stops before it starts instead of halfway.</p></div>${typeof EV!=="undefined"&&EV.dupStoreHTML?EV.dupStoreHTML():""}</div>
    <div class="form set-sec" id="move-sec"><h2>Move to another device</h2>
      <p class="hint" style="margin:0">Save your settings in one file and open it on your new phone, handheld or PC: folders, region order, apps you use, device profiles, wishlist, box art and backup settings. Your games, BIOS files and saves are not in the file, and neither is your ScreenScraper password.</p>
      <div class="gact"><button class="btn small primary" id="set-export">Export settings</button><label class="btn small" for="set-import" style="cursor:pointer">Import settings…</label><input type="file" id="set-import" accept=".json,application/json" hidden></div></div>`;
    const anchor=root.querySelector("#hist-sec") || [...root.children].pop();
    anchor.insertAdjacentHTML("beforebegin", html);
    $("#nt-on").onchange=e=>{ S.notif.on=e.target.checked; renderSet(); };
    root.querySelectorAll("[data-ntk]").forEach(c=>c.onchange=()=>{ S.notif.kinds[c.dataset.ntk]=c.checked; renderSet(); });
    root.querySelectorAll("[data-ntapp]").forEach(c=>c.onchange=()=>{ c.checked?S.notif.mute.delete(c.dataset.ntapp):S.notif.mute.add(c.dataset.ntapp); });
    $("#nt-quiet").onchange=e=>{ S.notif.quiet=e.target.checked; };
    $("#nt-test").onclick=()=>{ if(!updateNotice()) toast("Notifications are off"); };
    root.querySelectorAll("[data-spw]").forEach(b=>b.onclick=()=>{ S.space.warn=+b.dataset.spw; log(`Storage warning below ${size(S.space.warn)}`); renderSet(); renderHome(); });
    $("#set-export").onclick=downloadSettings;
    const si=$("#set-import"); si.onchange=()=>{ if(si.files[0]) readSettingsFile(si.files[0]); si.value=""; };
  }; }
// "Check everything" on Home also sends the update notification
{ const _cu=checkUpdates; checkUpdates=function(){ const r=_cu.apply(this, arguments); setTimeout(updateNotice, 400); return r; }; }
// drive plugged in → notification (once, shortly after start)
setTimeout(()=>{ const drv=S.drives.find(d=>d.id==="sd"), prof=drv&&S.profiles.find(p=>p.id===drv.profile); if(drv&&prof) notify("drive", `${drv.name} plugged in`, `Profile ${prof.name}: tap to fill it`, "drive"); }, 2500);

$("#gear").onclick=()=>go("set");
// =====================================================================================
//  My apps: your own list, update alerts only, drop a download on the app to keep it
// =====================================================================================
const MA = (()=>{
const KEEP=3, PLATS=["Linux","Android","Windows","macOS"], CATS=["Emulator","PC emulator","Frontend","Tool","Other"];
const fmt=mb=>mb>=1024?(mb/1024).toFixed(1)+" GB":Math.max(1,Math.round(mb))+" MB";
const pl=(n,w)=>`${n} ${w}${n===1?"":"s"}`;
const M={
  sub:"mine", filter:"all", q:"", open:new Set(), pending:{}, sheet:null, exp:{mode:"list", pick:{}}, catLoaded:false, lastCheck:"today 20:12",
  apps:[
    {id:"mgba", name:"mGBA", cat:"Emulator", about:"Game Boy Advance emulator", src:"github", url:"https://github.com/mgba-emu/mgba", keep:["Linux","Windows"], notes:"Take the AppImage, not the .deb.",
      latest:{ver:"0.10.5", date:"2025-03-08"}, update:null,
      files:[
        {plat:"Linux", variant:"AppImage", ver:"0.10.5", file:"mGBA-0.10.5-appimage-x64.appimage", mb:31, added:"2026-10-29"},
        {plat:"Linux", variant:"AppImage", ver:"0.10.4", file:"mGBA-0.10.4-appimage-x64.appimage", mb:30, added:"2025-01-12"},
        {plat:"Linux", variant:"AppImage", ver:"0.10.3", file:"mGBA-0.10.3-appimage-x64.appimage", mb:30, added:"2024-02-20"},
        {plat:"Windows", variant:"", ver:"0.10.5", file:"mGBA-0.10.5-win64.7z", mb:16, added:"2026-10-29"}]},
    {id:"pcsx2", name:"PCSX2", cat:"PC emulator", about:"PlayStation 2 emulator", src:"github", url:"https://github.com/PCSX2/pcsx2", keep:["Linux"], notes:"",
      latest:{ver:"v2.4.0", date:"2026-09-02"},
      update:{ver:"v2.4.1", date:"2026-10-27", assets:[
        {plat:"Linux", name:"pcsx2-v2.4.1-linux-appimage-x64-Qt.AppImage", mb:47},
        {plat:"Windows", name:"pcsx2-v2.4.1-windows-x64-Qt.7z", mb:38},
        {plat:"macOS", name:"pcsx2-v2.4.1-macos-Qt.tar.xz", mb:52}]},
      files:[
        {plat:"Linux", variant:"Qt", ver:"v2.4.0", file:"pcsx2-v2.4.0-linux-appimage-x64-Qt.AppImage", mb:46, added:"2026-09-05"},
        {plat:"Linux", variant:"Qt", ver:"v2.2.0", file:"pcsx2-v2.2.0-linux-appimage-x64-Qt.AppImage", mb:44, added:"2025-11-02"}]},
    {id:"azahar", name:"Azahar", cat:"Emulator", about:"Nintendo 3DS emulator", src:"github", url:"https://github.com/azahar-emu/azahar", keep:["Linux","Android"], notes:"Android: the vanilla build.",
      latest:{ver:"2122.2", date:"2026-08-30"},
      update:{ver:"2123.1", date:"2026-10-24", assets:[
        {plat:"Android", name:"azahar-2123.1-android-vanilla.apk", mb:61},
        {plat:"Android", name:"azahar-2123.1-android-googleplay.apk", mb:61},
        {plat:"Linux", name:"azahar-2123.1-linux-appimage.tar.gz", mb:41},
        {plat:"Windows", name:"azahar-2123.1-windows-msvc.zip", mb:35}]},
      files:[
        {plat:"Android", variant:"vanilla", ver:"2122.2", file:"azahar-2122.2-android-vanilla.apk", mb:60, added:"2026-09-01"},
        {plat:"Linux", variant:"", ver:"2122.2", file:"azahar-2122.2-linux-appimage.tar.gz", mb:40, added:"2026-09-01"}]},
    {id:"duck", name:"DuckStation", cat:"Emulator", about:"PlayStation emulator", src:"github", url:"https://github.com/stenzek/duckstation", keep:["Linux","Android"], notes:"",
      latest:{ver:"0.1-9669", date:"2026-10-25"}, update:null,
      files:[
        {plat:"Linux", variant:"", ver:"0.1-9669", file:"DuckStation-x64.AppImage", mb:36, added:"2026-10-26"},
        {plat:"Android", variant:"", ver:"0.1-9669", file:"duckstation-android-aarch64.apk", mb:31, added:"2026-10-26"}]},
    {id:"dolphin", name:"Dolphin", cat:"Emulator", about:"GameCube and Wii emulator", src:"web", url:"https://dolphin-emu.org/download/", keep:["Android"], notes:"Linux: install the Flatpak from Discover.",
      latest:null, update:null, remind:3, checked:"2026-07-12",
      files:[{plat:"Android", variant:"", ver:"2509", file:"dolphin-master-2509-a1b2c3.apk", mb:27, added:"2026-10-02"}]},
    {id:"retroarch", name:"RetroArch", cat:"Emulator", about:"All-in-one emulator frontend", src:"web", url:"https://www.retroarch.com/?page=platforms", keep:["Linux","Android"], notes:"Linux: the AppImage inside RetroArch.7z.",
      latest:null, update:null, remind:3, checked:"2026-09-20",
      files:[{plat:"Linux", variant:"", ver:"1.21.0", file:"RetroArch-Linux-x86_64.AppImage", mb:120, added:"2026-09-20"},{plat:"Android", variant:"", ver:"1.21.0", file:"RetroArch_aarch64.apk", mb:110, added:"2026-09-20"}]},
    {id:"citra", name:"Citra MMJ", cat:"Emulator", about:"3DS emulator (fork)", src:"github", url:"https://github.com/weihuoya/citra", keep:["Android"], notes:"Replaced by Azahar.", retired:true,
      latest:{ver:"20240310", date:"2024-03-10"}, update:null,
      files:[{plat:"Android", variant:"", ver:"20240310", file:"citra-mmj-20240310.apk", mb:22, added:"2024-03-12"}]},
    {id:"esde", name:"ES-DE", cat:"Frontend", about:"Frontend for all your emulators", src:"gitlab", url:"https://gitlab.com/es-de/emulationstation-de", keep:["Linux"], notes:"",
      latest:{ver:"v3.4.0", date:"2026-10-10"}, update:null, files:[]},
  ],
};
const updates=()=>M.apps.filter(a=>a.update && !a.retired);
const TODAY="2026-10-30";
const days=(a,b)=>Math.round((new Date(b)-new Date(a))/86400000);
const nextCheck=a=>{ if(!a.remind||!a.checked) return null; const d=new Date(a.checked); d.setMonth(d.getMonth()+a.remind); return d.toISOString().slice(0,10); };
const due=a=>a.src==="web" && !a.retired && a.remind>0 && nextCheck(a)<=TODAY;
const dueList=()=>M.apps.filter(due);
const niceDate=s=>new Date(s).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
const REMIND=[[1,"Every month"],[3,"Every 3 months"],[6,"Every 6 months"],[0,"Never"]];
const isOpen=a=>M.open.has(a.id) || (!M.open.has("!"+a.id) && !!M.pending[a.id]);

function guess(fileName, app){
  const n=fileName.toLowerCase();
  let plat="Linux";
  if (/\.apk$/.test(n)||/android/.test(n)) plat="Android";
  else if (/\.(exe|msi)$/.test(n)||/win(64|32)/.test(n)||/windows/.test(n)) plat="Windows";
  else if (/\.dmg$/.test(n)||/macos|darwin|universal/.test(n)) plat="macOS";
  const v=fileName.match(/(?:^|[-_ ])(v?\d+(?:\.\d+){1,3}(?:-[a-z]*\d+)?)/i) || fileName.match(/(\d{4})/);
  const vm=n.match(/\b(qt|sdl|nightly|dev|vanilla|googleplay|standard|legacy|avx2)\b/);
  let variant=vm?vm[1]:"";
  if (!variant && plat==="Linux" && /appimage/.test(n) && app.files.some(f=>f.plat==="Linux"&&f.variant==="AppImage")) variant="AppImage";
  if (variant==="qt") variant="Qt"; if (variant==="sdl") variant="SDL";
  const words=app.name.toLowerCase().replace(/[^a-z0-9]+/g," ").trim().split(" ").filter(w=>w.length>2);
  return {file:fileName, ver:v?v[1]:"", plat, variant, match:words.some(w=>n.replace(/[^a-z0-9]/g,"").includes(w)), mb:0};
}
function groups(a){
  const g={}; a.files.forEach(f=>{ (g[f.plat+"|"+f.variant] ||= []).push(f); });
  return Object.entries(g).map(([k,list])=>({plat:k.split("|")[0], variant:k.split("|")[1], list:list.sort((x,y)=>y.added.localeCompare(x.added))})).sort((x,y)=>PLATS.indexOf(x.plat)-PLATS.indexOf(y.plat));
}
const pathFor=(a,ver,plat,variant,file)=>`${S.dir.split("/").pop()}/Apps/${a.name}/${plat}/${ver||"?"}/${file}`;

// ------------------------------------------------------------------ render
function render(){
  const el=$("#myapps"); if(!el) return;
  // 0.12: the simple page (simple.js) draws My apps and Get more apps itself
  if (window.EVS && EVS.handles(M.sub)) { EVS.render(el); return; }
  // 0.10: appsplat.js shows one platform at a time (Linux, Windows, Android); the real list comes back after drawing
  const full=M.apps, AP=window.EVAP; if (AP && M.sub==="mine") M.apps=AP.project(full);
  try { render0(el); } finally { M.apps=full; }
  if (AP) AP.after(el);
}
function render0(el){
  const c={apps:M.apps.length, upd:updates().length, manual:M.apps.filter(a=>a.src!=="github"&&a.src!=="gitlab"&&!a.retired).length, due:dueList().length, retired:M.apps.filter(a=>a.retired).length, files:M.apps.reduce((n,a)=>n+a.files.length,0)};
  let h=`<div class="ma-subtabs" role="group">${[["mine","Apps",c.upd||""],["cat","Catalog",""],["exp","Export",""],["where","Where files go",""]].map(([k,l,n])=>`<button data-masub="${k}" aria-pressed="${M.sub===k}">${l}${n?`<span class="ma-cnt">${n}</span>`:""}</button>`).join("")}</div>`;
  if (M.sub==="mine") h+=mine(c); else if (M.sub==="cat") h+=cat(); else if (M.sub==="exp") h+=exp(); else h+=where();
  el.innerHTML=h;
  el.querySelectorAll("[data-masub]").forEach(b=>b.onclick=()=>{ M.sub=b.dataset.masub; render(); });
  bind(el);
  const n=$("#n-emu"); if(n){ n.textContent=c.upd?`${c.upd} update${c.upd>1?"s":""}`:`${c.apps}`; n.classList.toggle("quiet", !c.upd); }
}
function mine(c){
  const q=M.q.trim().toLowerCase();
  const list=M.apps.filter(a=>(M.filter==="all"||(M.filter==="upd"&&(a.update&&!a.retired||due(a)))||(M.filter==="manual"&&a.src!=="github"&&a.src!=="gitlab"&&!a.retired)||(M.filter==="retired"&&a.retired)) && (!q||(a.name+" "+a.about+" "+a.cat).toLowerCase().includes(q)));
  return `<div class="ma-panel">
      <div class="ma-sum"><div><b>${c.apps}</b>apps</div><div><b>${c.upd}</b>updates</div><div><b>${c.due}</b>to check by hand</div><div><b>${c.files}</b>files kept</div></div>
      <div class="ma-row"><span class="muted ma-grow" style="font-size:12.5px">GitHub and GitLab apps: last check ${esc(M.lastCheck)}, again every 6 hours and when Emu Vault starts. Websites: a reminder when it's time to look. Emu Vault never downloads by itself.</span>
        <button class="btn" id="ma-check">Check for updates</button><button class="btn primary" id="ma-add">+ Add app</button></div></div>
    <div class="ma-row">
      <input type="search" id="ma-q" class="search" placeholder="Search your apps" value="${esc(M.q)}" style="flex:1 1 220px;width:auto" aria-label="Search your apps">
      <div class="ma-chips" role="group">${[["all","All"],["upd",`To do · ${c.upd+c.due}`],["manual","By hand"],["retired",`Not maintained · ${c.retired}`]].map(([k,l])=>`<button class="ma-chip" data-maf="${k}" aria-pressed="${M.filter===k}">${l}</button>`).join("")}</div></div>
    <div class="ma-row" style="justify-content:flex-end;margin-top:-6px"><button class="linkbtn" id="ma-openall">Open all</button><button class="linkbtn" id="ma-closeall">Close all</button></div>
    <div class="ma-cards">${list.map(card).join("")||`<div class="empty-state">${M.apps.length?"No apps match.":"Your list is empty. Press “+ Add app” and paste a GitHub link."}</div>`}</div>`;
}
function card(a){
  const P=M.pending[a.id], srcL=a.srcLabel||{github:"GitHub",gitlab:"GitLab",web:"Website"}[a.src];
  const open=isOpen(a), newest=groups(a).map(g=>`${g.plat}${g.variant?" "+g.variant:""} ${g.list[0].ver}`).join(" · ");
  let h=`<article class="ma-card ${a.update?"upd":""} ${open?"open":""}" data-macard="${a.id}">
    <div class="ma-card-h" data-matoggle="${a.id}" role="button" tabindex="0" aria-expanded="${open}"><span class="ma-chev" aria-hidden="true"></span><div class="t"><div class="nm">${esc(a.name)}</div><div class="ab">${esc(a.about)}${open?"":` · <span class="muted">${a.files.length?esc(newest):"no files yet"}</span>`}</div>
      ${open?`<div class="src">${srcL} · <a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.url.replace(/^https?:\/\//,""))}</a></div>`:""}</div>
      <div class="ma-row"><span class="pill plat">${esc(a.cat)}</span>${a.retired?`<span class="pill plat">not maintained</span>`:a.update?`<span class="pill warn">update ${esc(a.update.ver)}</span>`:due(a)?`<span class="pill warn">time to check</span>`:a.src==="web"?`<span class="pill plat">by hand</span>`:a.src==="none"?`<span class="pill plat">no link</span>`:`<span class="pill ok">up to date</span>`}${open?`<button class="linkbtn" data-maedit="${a.id}">Edit</button>`:""}</div></div>
    <div class="ma-body" ${open?"":"hidden"}>`;
  if (a.retired){
    h+=`<div class="ma-manual"><span class="ma-grow">Marked as not maintained anymore. No update checks or reminders; your files stay.</span><button class="btn small" data-maunretire="${a.id}">Follow again</button></div>`;
  } else if (a.update){
    h+=`<div class="ma-upd"><div class="head"><b>${esc(a.name)} ${esc(a.update.ver)} is out</b><span class="muted" style="font-size:12px">released ${esc(a.update.date)} · you have ${esc(a.latest?.ver||"–")}</span></div>
      <div class="ma-assets">${a.update.assets.map(x=>{ const m=a.keep.includes(x.plat); return `<div class="ma-asset ${m?"mine":"other"}"><span class="p">${esc(x.plat)}${m?" ✓":""}</span><span class="fn">${esc(x.name)} <span class="muted">· ${fmt(x.mb)}</span></span><button class="btn small" data-madl="${a.id}" data-maplat="${esc(x.plat)}" data-maname="${esc(x.name)}">${x.got?"Downloaded":"Download"}</button></div>`; }).join("")}</div>
      <span class="hint">Download fetches that file into Apps/${esc(a.name)}/&lt;platform&gt;/&lt;version&gt;/ and keeps the newest ${KEEP}. You can also download it yourself and drop it on this card. ✓ = platforms you keep.</span>
      <div><button class="linkbtn" data-maskip="${a.id}">Skip this version</button></div></div>`;
  } else if (a.src==="web"){
    const nx=nextCheck(a);
    h+=`<div class="ma-manual ${due(a)?"due":""}"><div class="ma-grow" style="display:flex;flex-direction:column;gap:4px">
        <span>${due(a)?`<b style="color:var(--warn)">Time to check ${esc(a.name)}.</b> `:""}This is a website, so Emu Vault can't see new versions by itself.</span>
        <span class="muted">Last checked ${a.checked?esc(niceDate(a.checked))+` (${days(a.checked,TODAY)} days ago)`:"never"}${a.remind&&nx?` · next reminder ${esc(niceDate(nx))}`:a.remind===0?" · no reminders":""}</span>
        <label class="ma-row" style="gap:6px;font-size:12.5px"><span class="muted">Remind me</span><select data-maremind="${a.id}" style="width:auto">${REMIND.map(([v,l])=>`<option value="${v}" ${a.remind===v?"selected":""}>${l}</option>`).join("")}</select></label></div>
      <div class="ma-row"><a class="btn small" href="${esc(a.url)}" target="_blank" rel="noopener">Open site</a><button class="btn small ${due(a)?"primary":""}" data-machecked="${a.id}">I checked</button></div></div>`;
  } else if (a.src==="none"){
    h+=`<div class="ma-manual"><span class="ma-grow">No link: no update alerts or reminders. Add a link with Edit when you find the app's page.</span></div>`;
  }
  const G=groups(a);
  h+=`<div class="ma-vgroups">${G.length?G.map(g=>`<div class="ma-vg"><span class="gl">${esc(g.plat)}${g.variant?` · ${esc(g.variant)}`:""}<small>${g.list.length} of ${KEEP}</small></span>
      <div class="ma-vers">${g.list.map((f,i)=>`<span class="ma-vchip ${i===0?"new":""}" title="${esc(f.file)} · ${fmt(f.mb)} · added ${esc(f.added.slice(0,10))}"><span>${esc(f.ver)}${i===0?" · newest":""}</span><button data-maopen="${a.id}" aria-label="Show in folder" title="Show in folder">↗</button><button data-madel="${a.id}|${esc(f.file)}" aria-label="Delete ${esc(f.ver)}" title="Delete">✕</button></span>`).join("")}</div></div>`).join("")
      :`<span class="hint">No files yet. Drop your first download below.</span>`}</div>`;
  if (a.notes) h+=`<div class="ma-notes"><span class="lbl2">Note</span><span>${esc(a.notes)}</span></div>`;
  if (!a.retired) h+=`<div class="ma-notes" style="justify-content:flex-end"><button class="linkbtn" data-maretire="${a.id}">Not maintained anymore</button></div>`;
  if (P){
    h+=`<div class="ma-confirm" data-maconfirm="${a.id}"><b style="color:var(--accent)">${P.fromFolder?`New file found in Apps/${esc(a.name)}/`:`Keep this file with ${esc(a.name)}?`}</b>${P.fromFolder?`<span class="hint">You put this file in the folder yourself. Check the details, then keep it.</span>`:""}
      <span class="muted" style="font-size:12.5px;overflow-wrap:anywhere">${esc(P.file)}</span>
      ${!P.match?`<div class="ma-warn">The file name doesn't mention ${esc(a.name)}. Is this the right app?</div>`:""}
      <div class="ma-grid">
        <div class="field"><label for="mcv-${a.id}">Version</label><input type="text" id="mcv-${a.id}" value="${esc(P.ver)}" placeholder="e.g. 0.10.6"></div>
        <div class="field"><label for="mcp-${a.id}">Platform</label><select id="mcp-${a.id}">${PLATS.map(p=>`<option ${p===P.plat?"selected":""}>${p}</option>`).join("")}</select></div>
        <div class="field"><label for="mcw-${a.id}">Variant (optional)</label><input type="text" id="mcw-${a.id}" value="${esc(P.variant)}" placeholder="Qt, SDL, nightly…"></div></div>
      <span class="muted" style="font-size:12px;overflow-wrap:anywhere" id="mcpath-${a.id}"></span>
      <div class="ma-row"><button class="btn primary" data-masave="${a.id}">Keep it</button><button class="btn" data-macancel="${a.id}">Cancel</button></div></div>`;
  }
  h+=`<div class="ma-drop" data-madrop="${a.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 18h16"/></svg>
      <span class="ma-grow">Drop a download of <b>${esc(a.name)}</b> here</span>
      <label class="btn small" for="mapick-${a.id}" style="cursor:pointer">Choose file…</label><input type="file" id="mapick-${a.id}" data-mapick="${a.id}" hidden></div></div></article>`;
  return h;
}
const SAMPLE_PACK=[["RetroArch","All-in-one emulator frontend","Emulator"],["PPSSPP","PSP emulator","Emulator"],["Daijishō","Android frontend","Frontend"],["ScummVM","Point-and-click adventure engine","Emulator"],["Moonlight","Game streaming from your PC","Tool"]];
function cat(){ return EVA.catHTML(); }
function cat_pretend(){
  return `<div class="ma-panel"><h3>Packs</h3>
    <p class="hint">A pack is a ready-made list from someone else, like the Obtainium Emulation Pack (69 Android apps) or the Recomp/Decomp pack. Here a pack is only something to browse: nothing from it is followed until you press “+ My list”. Then it becomes a normal app in your own list, and you can change it like any other.</p>
    <div class="ma-row"><button class="btn" id="ma-catadd">Add a pack (.json)…</button>${M.catLoaded?"":`<button class="linkbtn" id="ma-catdemo">Show an example pack</button>`}</div></div>
    ${M.catLoaded?`<div class="ma-panel"><div class="ma-row"><h3 class="ma-grow">Example pack</h3><span class="muted" style="font-size:12px">${SAMPLE_PACK.length} apps</span></div>
      <div>${SAMPLE_PACK.map(([n,ab,c])=>{ const have=M.apps.some(a=>a.name===n); return `<div class="ma-catrow"><div><b>${esc(n)}</b> <span class="pill plat">${esc(c)}</span><div class="muted" style="font-size:12.5px">${esc(ab)}</div></div>${have?`<span class="pill ok">in my list</span>`:`<button class="btn small" data-matake="${esc(n)}">+ My list</button>`}</div>`; }).join("")}</div></div>`
      :`<div class="empty-state">No packs yet. Your own list works without them.</div>`}`;
}
function exp(){
  const E=M.exp;
  M.apps.forEach(a=>{ if(!(a.id in E.pick)) E.pick[a.id]={on:true, files:Object.fromEntries(a.files.map(f=>[f.file,true]))}; a.files.forEach(f=>{ if(!(f.file in E.pick[a.id].files)) E.pick[a.id].files[f.file]=true; }); });
  const chosen=M.apps.filter(a=>E.pick[a.id].on);
  const files=E.mode==="files"?chosen.flatMap(a=>a.files.filter(f=>E.pick[a.id].files[f.file])):[];
  const mb=files.reduce((n,f)=>n+f.mb,0);
  const json={app:"Emu Vault", kind:"my-apps", version:3, apps:chosen.map(a=>({id:a.id,name:a.name,url:a.url,categories:[a.cat],about:a.about,keep:a.keep,notes:a.notes||undefined}))};
  return `<div class="ma-panel"><h3>Export</h3>
    <div class="seg" role="group"><button data-mamode="list" aria-pressed="${E.mode==="list"}">List only (.json)</button><button data-mamode="files" aria-pressed="${E.mode==="files"}">List + files (.zip)</button></div>
    <p class="hint">${E.mode==="list"?"A small file with your apps, links, kinds, platforms and notes. Open it on another computer, or in Obtainium on your phone.":"Your list plus the downloads you tick below, in one .zip. Handy to move everything to a new drive."}</p></div>
    <div class="ma-panel"><div class="ma-row"><span class="lbl2 ma-grow">What goes in</span><button class="linkbtn" id="ma-xall">All</button><button class="linkbtn" id="ma-xnone">None</button></div>
      <div>${M.apps.map(a=>`<div class="ma-xrow"><label class="inline-t"><input type="checkbox" data-maxa="${a.id}" ${E.pick[a.id].on?"checked":""}> <b>${esc(a.name)}</b> <span class="muted" style="font-size:12px">${esc(a.cat)} · ${pl(a.files.length,"file")}</span></label>
        ${E.mode==="files"&&a.files.length&&E.pick[a.id].on?`<div class="ma-xsub">${a.files.map(f=>`<label class="inline-t"><input type="checkbox" data-maxf="${a.id}|${esc(f.file)}" ${E.pick[a.id].files[f.file]?"checked":""}> ${esc(f.plat)}${f.variant?" "+esc(f.variant):""} ${esc(f.ver)} <span class="muted">(${fmt(f.mb)})</span></label>`).join("")}</div>`:""}</div>`).join("")}</div></div>
    <div class="ma-panel"><div class="ma-row"><span class="ma-grow">${pl(chosen.length,"app")}${E.mode==="files"?` · ${pl(files.length,"file")} · ${fmt(mb)}`:""}</span><button class="btn primary" id="ma-xgo" ${chosen.length?"":"disabled"}>Export</button></div>
      <details><summary class="lbl2" style="cursor:pointer">What the list file looks like</summary><pre class="ma-json">${esc(JSON.stringify(json,null,2))}</pre></details></div>`;
}
function where(){
  const base=S.dir.split("/").pop();
  return `<div class="ma-panel"><h3>Where things live</h3>
    <dl class="ma-kv">
      <dt>Main folder</dt><dd>${esc(S.dir)}</dd>
      <dt>Your list</dt><dd>Saved with your settings (~/.config/emu-vault). Use Export to take it to another computer.</dd>
      <dt>Kept files</dt><dd>${esc(base)}/Apps/&lt;app&gt;/&lt;platform&gt;/&lt;version&gt;/, with a small .emuvault.json next to each file (where it came from, its fingerprint, the date)</dd>
      <dt>Versions</dt><dd>The ${KEEP} newest per app and platform. Change the number in Settings.</dd>
      <dt>New app</dt><dd>Adding an app makes its folders right away, one per platform you keep: ${esc(base)}/Apps/mGBA/Linux/, …/Windows/. Renaming an app renames its folder. Removing it from your list leaves the folder and files alone.</dd>
      <dt>Files you add yourself</dt><dd>You can also put a download straight into an app's folder with your file manager. At the next check Emu Vault finds it and asks for the version, platform and variant, just like after dropping it on the card.</dd>
      <dt>GitHub · GitLab · Codeberg</dt><dd>Checked when Emu Vault starts (at most every 6 hours), with a desktop notification. Never downloads by itself: Download fetches a file when you press it.</dd>
      <dt>Websites</dt><dd>A reminder to look, every month, 3 months (standard) or 6 months, or never. “I checked” or keeping a new file resets it.</dd>
      <dt>Not maintained</dt><dd>No checks and no reminders. The files stay, so you keep the last version.</dd>
    </dl></div>`;
}

// ------------------------------------------------------------------ events
function bind(el){
  const on=(id,f)=>{ const x=el.querySelector("#"+id); if(x) x.onclick=f; };
  const qi=el.querySelector("#ma-q"); if(qi) qi.oninput=()=>{ M.q=qi.value; render(); const n=$("#ma-q"); n.focus(); n.setSelectionRange(n.value.length,n.value.length); };
  el.querySelectorAll("[data-maf]").forEach(b=>b.onclick=()=>{ M.filter=b.dataset.maf; render(); });
  on("ma-check",checkNow); on("ma-add",()=>openSheet());
  const toggle=id=>{ const a=M.apps.find(x=>x.id===id); if(isOpen(a)){ M.open.delete(id); M.open.add("!"+id); } else { M.open.delete("!"+id); M.open.add(id); } render(); };
  el.querySelectorAll("[data-matoggle]").forEach(hd=>{
    hd.addEventListener("click",e=>{ if(e.target.closest("a,button")) return; toggle(hd.dataset.matoggle); });
    hd.addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&e.target===hd){ e.preventDefault(); toggle(hd.dataset.matoggle); } });
    // dropping a file on a closed card opens it and keeps the file
    hd.closest(".ma-card").addEventListener("dragover",e=>{ e.preventDefault(); const z=hd.closest(".ma-card").querySelector(".ma-drop"); if(z.offsetParent===null){ hd.closest(".ma-card").classList.add("dropping"); } });
    hd.closest(".ma-card").addEventListener("dragleave",e=>{ if(!hd.closest(".ma-card").contains(e.relatedTarget)) hd.closest(".ma-card").classList.remove("dropping"); });
    hd.closest(".ma-card").addEventListener("drop",e=>{ if(e.defaultPrevented) return; e.preventDefault(); e.stopPropagation(); hd.closest(".ma-card").classList.remove("dropping"); const f=e.dataTransfer.files[0]; if(f){ M.open.delete("!"+hd.dataset.matoggle); M.open.add(hd.dataset.matoggle); dropped(hd.dataset.matoggle,f); } });
  });
  on("ma-openall",()=>{ M.apps.forEach(a=>{ M.open.delete("!"+a.id); M.open.add(a.id); }); render(); });
  on("ma-closeall",()=>{ M.apps.forEach(a=>{ M.open.delete(a.id); M.open.add("!"+a.id); }); render(); });
  el.querySelectorAll("[data-madrop]").forEach(z=>{ const id=z.dataset.madrop;
    z.addEventListener("dragover",e=>{ e.preventDefault(); z.classList.add("over"); });
    z.addEventListener("dragleave",()=>z.classList.remove("over"));
    z.addEventListener("drop",e=>{ e.preventDefault(); e.stopPropagation(); z.classList.remove("over"); const f=e.dataTransfer.files[0]; if(f) dropped(id,f); }); });
  el.querySelectorAll("[data-mapick]").forEach(i=>i.onchange=()=>{ if(i.files[0]) dropped(i.dataset.mapick,i.files[0]); });
  el.querySelectorAll("[data-maconfirm]").forEach(box=>{ const id=box.dataset.maconfirm, a=M.apps.find(x=>x.id===id), P=M.pending[id];
    const upd=()=>{ $(`#mcpath-${CSS.escape(id)}`).textContent="Goes to "+pathFor(a,$(`#mcv-${CSS.escape(id)}`).value.trim(),$(`#mcp-${CSS.escape(id)}`).value,$(`#mcw-${CSS.escape(id)}`).value.trim(),P.file); };
    ["mcv","mcp","mcw"].forEach(p=>$(`#${p}-${CSS.escape(id)}`).addEventListener("input",upd)); upd(); });
  el.querySelectorAll("[data-masave]").forEach(b=>b.onclick=()=>saveDrop(b.dataset.masave));
  el.querySelectorAll("[data-macancel]").forEach(b=>b.onclick=()=>{ delete M.pending[b.dataset.macancel]; render(); });
  el.querySelectorAll("[data-madel]").forEach(b=>b.onclick=()=>{
    if (!b.dataset.sure){ b.dataset.sure="1"; b.textContent="delete?"; b.style.color="var(--bad)"; setTimeout(()=>{ if(b.isConnected){ delete b.dataset.sure; b.textContent="✕"; b.style.color=""; } },3000); return; }
    const [id,file]=b.dataset.madel.split("|"); EVA.delVersion(id,file); });
  el.querySelectorAll("[data-maopen]").forEach(b=>b.onclick=()=>EVA.openApp(b.dataset.maopen));
  el.querySelectorAll("[data-maskip]").forEach(b=>b.onclick=()=>{ const a=M.apps.find(x=>x.id===b.dataset.maskip); toast(`${a.name} ${a.update.ver} skipped. You'll hear about the next version.`); a.skip=a.update.ver; a.update=null; render(); renderHome(); });
  el.querySelectorAll("[data-machecked]").forEach(b=>b.onclick=()=>{ const a=M.apps.find(x=>x.id===b.dataset.machecked); a.checked=TODAY; log(`${a.name}: checked by hand`); toast(`Noted. Next reminder for ${a.name}: ${a.remind?niceDate(nextCheck(a)):"none"}`); render(); renderHome(); });
  el.querySelectorAll("[data-maremind]").forEach(s=>s.onchange=()=>{ const a=M.apps.find(x=>x.id===s.dataset.maremind); a.remind=+s.value; if(!a.checked) a.checked=TODAY; toast(a.remind?`${a.name}: reminder ${REMIND.find(r=>r[0]===a.remind)[1].toLowerCase()}`:`${a.name}: no reminders`); render(); renderHome(); });
  el.querySelectorAll("[data-maretire]").forEach(b=>b.onclick=()=>{ if(!b.dataset.sure){ b.dataset.sure="1"; b.textContent="Sure? Press again"; setTimeout(()=>{ if(b.isConnected){ delete b.dataset.sure; b.textContent="Not maintained anymore"; } },3500); return; }
    const a=M.apps.find(x=>x.id===b.dataset.maretire); a.retired=true; M.open.delete(a.id); M.open.add("!"+a.id); log(`${a.name} marked as not maintained`); toast(`${a.name}: no more update checks or reminders. Your files stay.`); render(); renderHome(); });
  el.querySelectorAll("[data-maunretire]").forEach(b=>b.onclick=()=>{ const a=M.apps.find(x=>x.id===b.dataset.maunretire); a.retired=false; toast(`Following ${a.name} again`); render(); renderHome(); });
  el.querySelectorAll("[data-maedit]").forEach(b=>b.onclick=()=>openSheet(b.dataset.maedit));
  on("ma-catadd",()=>EVA.addPack()); el.querySelectorAll("[data-mafollow]").forEach(b=>b.onclick=()=>EVA.follow(b.dataset.mafollow)); el.querySelectorAll("[data-maunpack]").forEach(b=>b.onclick=()=>EVA.removePack(b.dataset.maunpack)); el.querySelectorAll("[data-mapack]").forEach(b=>b.onclick=()=>{ M.catOpen=M.catOpen===b.dataset.mapack?null:b.dataset.mapack; render(); }); const cq=el.querySelector("#ma-catq"); if(cq) cq.oninput=()=>{ M.catQ=cq.value; render(); const n=$("#ma-catq"); n.focus(); n.setSelectionRange(n.value.length,n.value.length); };
  on("ma-catdemo",()=>{ M.catLoaded=true; render(); });
  el.querySelectorAll("[data-matake]").forEach(b=>b.onclick=()=>{ const p=SAMPLE_PACK.find(x=>x[0]===b.dataset.matake); M.apps.push({id:"p"+Date.now(), name:p[0], about:p[1], cat:p[2], src:"web", url:"https://example.org/"+p[0].toLowerCase(), keep:["Linux"], notes:"", latest:null, update:null, files:[]}); log(`${p[0]} added to my apps`); toast(`${p[0]} added to your list`); render(); });
  el.querySelectorAll("[data-mamode]").forEach(b=>b.onclick=()=>{ M.exp.mode=b.dataset.mamode; render(); });
  el.querySelectorAll("[data-maxa]").forEach(c=>c.onchange=()=>{ M.exp.pick[c.dataset.maxa].on=c.checked; render(); });
  el.querySelectorAll("[data-maxf]").forEach(c=>c.onchange=()=>{ const [id,file]=c.dataset.maxf.split("|"); M.exp.pick[id].files[file]=c.checked; render(); });
  on("ma-xall",()=>{ M.apps.forEach(a=>M.exp.pick[a.id].on=true); render(); });
  on("ma-xnone",()=>{ M.apps.forEach(a=>M.exp.pick[a.id].on=false); render(); });
  on("ma-xgo",()=>EVA.exportApps());
}
function dropped(id,file){ const a=M.apps.find(x=>x.id===id); const g=guess(file.name,a); g.mb=file.size/1048576; M.pending[id]=g; g.path=file.path||""; render(); document.querySelector(`[data-maconfirm="${id}"]`)?.scrollIntoView({block:"nearest"}); }
function saveDrop(id){ return EVA.saveDrop(id); }
function saveDrop_pretend(id){
  const a=M.apps.find(x=>x.id===id), P=M.pending[id];
  const ver=$(`#mcv-${CSS.escape(id)}`).value.trim()||"?", plat=$(`#mcp-${CSS.escape(id)}`).value, variant=$(`#mcw-${CSS.escape(id)}`).value.trim();
  a.files.push({plat, variant, ver, file:P.file, mb:P.mb||1, added:new Date().toISOString()});
  const same=a.files.filter(f=>f.plat===plat&&f.variant===variant).sort((x,y)=>y.added.localeCompare(x.added));
  let msg=`Kept: ${pathFor(a,ver,plat,variant,P.file)}`;
  if (same.length>KEEP){ const gone=same.slice(KEEP); a.files=a.files.filter(f=>!gone.includes(f)); msg+=` · removed ${gone.map(f=>f.ver).join(", ")} (keep ${KEEP})`; }
  if (!a.keep.includes(plat)) a.keep.push(plat);
  if (a.update && ver.replace(/^v/,"")===a.update.ver.replace(/^v/,"")){ a.latest={ver:a.update.ver,date:a.update.date}; if(a.update.assets.filter(x=>a.keep.includes(x.plat)).every(x=>a.files.some(f=>f.plat===x.plat&&f.ver.replace(/^v/,"")===ver.replace(/^v/,"")))) a.update=null; }
  if (a.src==="web") a.checked=TODAY;
  delete M.pending[id]; log(msg); toast(msg); render(); renderHome();
}
function checkNow(){ return EVA.check(); }
function checkNow_pretend(){
  const b=$("#ma-check"); if(b){ b.disabled=true; b.textContent="Checking…"; }
  log("Checking your apps for new versions…");
  setTimeout(()=>{
    const m=M.apps.find(a=>a.id==="mgba");
    if (m && !m.update && !m.files.some(f=>f.ver==="0.10.6")) m.update={ver:"0.10.6", date:"2026-10-30", assets:[{plat:"Linux",name:"mGBA-0.10.6-appimage-x64.appimage",mb:31},{plat:"Windows",name:"mGBA-0.10.6-win64.7z",mb:16},{plat:"macOS",name:"mGBA-0.10.6-macos.dmg",mb:22}]};
    M.lastCheck="just now";
    const d=M.apps.find(a=>a.id==="duck");
    if (d && !d.files.some(f=>f.ver==="0.1-9701") && !M.pending.duck){ M.pending.duck={file:"duckstation-android-aarch64-0.1-9701.apk", ver:"0.1-9701", plat:"Android", variant:"", match:true, mb:31, fromFolder:true}; M.open.delete("!duck"); M.open.add("duck"); }
    const n=updates().length, dd=dueList().length; log(`${pl(n,"update")} found`); toast(`${n?pl(n,"update")+" found":"No new versions on GitHub"}${M.pending.duck?" · 1 new file in a folder":""}${dd?` · ${dd} website${dd>1?"s":""} to check by hand`:""}`);
    render(); renderHome();
  },900);
}

// ------------------------------------------------------------------ add / edit (own small sheet)
const LOOKUP={"github.com/mgba-emu/mgba":["mGBA","Game Boy Advance emulator","0.10.5"],"github.com/pcsx2/pcsx2":["PCSX2","PlayStation 2 emulator","v2.4.1"],"github.com/rpcs3/rpcs3-binaries-linux":["RPCS3","PlayStation 3 emulator","v0.0.38"],"github.com/xemu-project/xemu":["xemu","Original Xbox emulator","v0.8.106"],"github.com/cemu-project/cemu":["Cemu","Wii U emulator","v2.6"],"github.com/melonds-emu/melonds":["melonDS","Nintendo DS emulator","1.0"],"github.com/armsx2/armsx2":["ARMSX2","PlayStation 2 emulator for Android","v1.2.0"],"github.com/flyinghead/flycast":["Flycast","Dreamcast emulator","v2.5"],"github.com/vita3k/vita3k":["Vita3K","PlayStation Vita emulator","continuous"],"github.com/shadps4-emu/shadps4":["shadPS4","PlayStation 4 emulator","v0.12.0"]};
// what typing a name suggests (the real app asks GitHub and a small built-in list)
const KNOWN=[
  ["RetroArch","All-in-one emulator frontend","https://www.retroarch.com/?page=platforms"],
  ["RetroArch (GitHub)","Source code only, no download files","https://github.com/libretro/RetroArch"],
  ["PPSSPP","PSP emulator","https://www.ppsspp.org/download/"],
  ["Dolphin","GameCube and Wii emulator","https://dolphin-emu.org/download/"],
  ["ScummVM","Point-and-click adventure engine","https://www.scummvm.org/downloads/"],
  ["ARMSX2","PlayStation 2 emulator for Android","https://github.com/ARMSX2/ARMSX2"],
  ["mGBA","Game Boy Advance emulator","https://github.com/mgba-emu/mgba"],
  ["PCSX2","PlayStation 2 emulator","https://github.com/PCSX2/pcsx2"],
  ["xemu","Original Xbox emulator","https://github.com/xemu-project/xemu"],
  ["Cemu","Wii U emulator","https://github.com/cemu-project/Cemu"],
  ["melonDS","Nintendo DS emulator","https://github.com/melonDS-emu/melonDS"],
  ["Flycast","Dreamcast emulator","https://github.com/flyinghead/flycast"],
  ["RPCS3","PlayStation 3 emulator","https://github.com/RPCS3/rpcs3-binaries-linux"],
  ["shadPS4","PlayStation 4 emulator","https://github.com/shadps4-emu/shadPS4"],
  ["Vita3K","PlayStation Vita emulator","https://github.com/Vita3K/Vita3K"],
  ["DuckStation","PlayStation emulator","https://github.com/stenzek/duckstation"],
  ["Azahar","Nintendo 3DS emulator","https://github.com/azahar-emu/azahar"],
];
function readLink(u){
  const s=u.trim().replace(/^https?:\/\//i,"").replace(/\/+$/,"").replace(/\.git$/,"");
  const m=s.match(/^(github\.com|gitlab\.com|codeberg\.org)\/([^/]+)\/([^/#?]+)/i);
  if (m){ const k=LOOKUP[`${m[1]}/${m[2]}/${m[3]}`.toLowerCase()]; return {src:m[1].startsWith("gitlab")?"gitlab":"github", url:`https://${m[1]}/${m[2]}/${m[3]}`, name:k?k[0]:m[3], about:k?k[1]:`Project by ${m[2]}`, ver:k?k[2]:""}; }
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/|$|\?)/i.test(s) && !/\s/.test(s)){ const host=s.split(/[/?]/)[0]; const known=KNOWN.find(k=>k[2].includes(host.replace(/^www\./,""))); return {src:"web", url:"https://"+s, name:known?known[0]:host.replace(/^www\./,"").split(".")[0].replace(/^\w/,c=>c.toUpperCase()), about:known?known[1]:"Website", ver:""}; }
  return null;
}
function suggestions(q){
  const t=q.trim().toLowerCase(); if(t.length<2) return [];
  return KNOWN.filter(k=>k[0].toLowerCase().includes(t)||k[1].toLowerCase().includes(t)).slice(0,6);
}
function folderList(a){ const base=S.dir.split("/").pop(); return a.keep.map(p=>`${base}/Apps/${a.name}/${p}/`); }
function openSheet(editId){
  const a=editId?M.apps.find(x=>x.id===editId):null;
  M.sheet={edit:editId||null, link:a?a.url:"", found:a?{src:a.src,url:a.url,name:a.name,about:a.about,ver:a.latest?.ver||""}:null, name:a?a.name:"", about:a?a.about:"", cat:a?a.cat:"Emulator", keep:a?[...a.keep]:["Linux"], notes:a?a.notes:"", remind:a?(a.remind??3):3, retired:a?!!a.retired:false, file:null, looking:false, err:"", sugg:[]};
  $("#ma-veil").hidden=false; document.body.style.overflow="hidden"; sheet(); setTimeout(()=>$("#mas-link")?.focus(),30);
}
function close(){ $("#ma-veil").hidden=true; document.body.style.overflow=""; M.sheet=null; }
function sheet(){
  const d=M.sheet, f=d.found;
  $("#ma-sheet").innerHTML=`<div class="ma-sh-h"><h2>${d.edit?"Edit app":"Add an app"}</h2><button class="btn small" id="mas-x" aria-label="Close">✕</button></div>
  <div class="ma-sh-b">
    <div class="field"><label for="mas-link">Link or name</label>
      <div class="ma-row"><input type="text" id="mas-link" value="${esc(d.link)}" placeholder="RetroArch, or https://github.com/ARMSX2/ARMSX2" style="flex:1 1 260px;width:auto" autocomplete="off"><button class="btn" id="mas-look" ${d.looking?"disabled":""}>${d.looking?"Looking…":"Look up"}</button></div>
      ${d.err?`<div class="ma-err" role="alert">${d.err}</div>`:""}
      ${d.sugg.length?`<div class="ma-sugg"><span class="lbl2">Did you mean</span>${d.sugg.map((s,i)=>`<button class="ma-suggi" data-masugg="${i}"><b>${esc(s[0])}</b><span>${esc(s[1])}</span><span class="muted">${esc(s[2].replace(/^https:\/\//,""))}</span></button>`).join("")}</div>`:""}
      ${!f&&!d.edit?`<p class="hint">Paste the page of the app (GitHub, GitLab, Codeberg or a website), or type a name to search. <button class="linkbtn" id="mas-nolink">Add without a link</button></p>`:""}</div>
    ${f?`<div class="ma-found"><b>${f.src==="web"?"Website":f.src==="none"?"No link":"Found on "+(f.src==="gitlab"?"GitLab":"GitHub")}</b>${f.url?`<span>${esc(f.url.replace(/^https:\/\//,""))}</span>`:""}${f.ver?`<span>Newest version: ${esc(f.ver)}</span>`:f.src==="web"?`<span>Emu Vault reminds you to check this site</span>`:f.src==="none"?`<span>No update alerts or reminders. You can add a link later.</span>`:""}</div>
    <div class="field"><label for="mas-name">Name</label><input type="text" id="mas-name" value="${esc(d.name)}"></div>
    <div class="field"><label for="mas-about">Short description</label><input type="text" id="mas-about" value="${esc(d.about)}"></div>
    <div class="field"><span class="lbl">Kind</span><div class="ma-chips">${CATS.map(c=>`<button class="ma-chip" data-mascat="${c}" aria-pressed="${d.cat===c}">${c}</button>`).join("")}</div></div>
    <div class="field"><span class="lbl">Platforms you keep</span><div class="ma-chips">${PLATS.map(p=>`<button class="ma-chip" data-maskeep="${p}" aria-pressed="${d.keep.includes(p)}">${p}</button>`).join("")}</div>
      <p class="hint">A folder is made for each: ${d.keep.length?folderList({name:d.name||"…",keep:d.keep}).map(x=>`<span class="mono">${esc(x)}</span>`).join(", "):"pick at least one"}.</p></div>
    ${f.src==="web"?`<div class="field"><label for="mas-remind">Remind me to check the site</label><select id="mas-remind" style="width:auto">${REMIND.map(([v,l])=>`<option value="${v}" ${d.remind===v?"selected":""}>${l}</option>`).join("")}</select></div>`:""}
    <div class="field"><label for="mas-notes">Note (optional)</label><textarea id="mas-notes" placeholder="e.g. take the Qt build">${esc(d.notes)}</textarea></div>
    ${d.edit?`<label class="inline-t"><input type="checkbox" id="mas-retired" ${d.retired?"checked":""}> Not maintained anymore (no update checks or reminders; files stay)</label>`:""}
    ${d.edit?"":`<div class="ma-drop" id="mas-drop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 18h16"/></svg><span class="ma-grow">${d.file?`Ready to keep: <b>${esc(d.file.name)}</b>`:"Already downloaded? Drop the file here"}</span><label class="btn small" for="mas-pick" style="cursor:pointer">Choose file…</label><input type="file" id="mas-pick" hidden></div>`}`:""}
  </div>
  <div class="ma-sh-f">${d.edit?`<button class="btn" id="mas-remove">Remove from my list</button>`:""}<button class="btn" id="mas-cancel">Cancel</button><button class="btn primary" id="mas-save" ${f&&d.name.trim()&&d.keep.length?"":"disabled"}>${d.edit?"Save":"Add to my list"}</button></div>`;
  $("#mas-x").onclick=close; $("#mas-cancel").onclick=close;
  $("#mas-link").oninput=e=>{ d.link=e.target.value; if(d.err){ d.err=""; const x=document.querySelector(".ma-err"); if(x) x.remove(); } };
  $("#mas-link").onkeydown=e=>{ if(e.key==="Enter"){ e.preventDefault(); look(); } };
  $("#mas-look").onclick=look;
  const nl=$("#mas-nolink"); if(nl) nl.onclick=()=>{ const n=d.link.trim(); d.found={src:"none",url:"",name:n||"New app",about:"",ver:""}; d.name=/^https?:|\//.test(n)?"New app":(n||"New app"); d.about=""; d.err=""; d.sugg=[]; sheet(); $("#mas-name")?.select(); };
  document.querySelectorAll("[data-masugg]").forEach(b=>b.onclick=()=>{ const s=d.sugg[+b.dataset.masugg]; d.link=s[2]; d.sugg=[]; d.err=""; look(); });
  if (f){
    $("#mas-name").oninput=e=>{ d.name=e.target.value; $("#mas-save").disabled=!(d.name.trim()&&d.keep.length); };
    $("#mas-about").oninput=e=>{ d.about=e.target.value; };
    $("#mas-notes").oninput=e=>{ d.notes=e.target.value; };
    const rm=$("#mas-remind"); if(rm) rm.onchange=()=>{ d.remind=+rm.value; };
    const rt=$("#mas-retired"); if(rt) rt.onchange=()=>{ d.retired=rt.checked; };
    document.querySelectorAll("[data-mascat]").forEach(b=>b.onclick=()=>{ d.cat=b.dataset.mascat; sheet(); });
    document.querySelectorAll("[data-maskeep]").forEach(b=>b.onclick=()=>{ const p=b.dataset.maskeep; d.keep=d.keep.includes(p)?d.keep.filter(x=>x!==p):[...d.keep,p]; sheet(); });
    const z=$("#mas-drop");
    if (z){ z.addEventListener("dragover",e=>{e.preventDefault(); z.classList.add("over");}); z.addEventListener("dragleave",()=>z.classList.remove("over"));
      z.addEventListener("drop",e=>{ e.preventDefault(); e.stopPropagation(); const fl=e.dataTransfer.files[0]; if(fl){ d.file=fl; sheet(); } });
      $("#mas-pick").onchange=e=>{ const fl=e.target.files[0]; if(fl){ d.file=fl; sheet(); } }; }
  }
  $("#mas-save").onclick=save;
  const rmv=$("#mas-remove"); if(rmv) rmv.onclick=()=>{ if(!rmv.dataset.sure){ rmv.dataset.sure="1"; rmv.textContent="Press again to remove"; return; } const id=d.edit; close(); EVA.removeApp(id); };
}
function look(){
  const d=M.sheet, txt=d.link.trim();
  if (!txt){ d.err="Type a name or paste a link first."; sheet(); return; }
  const r=readLink(txt);
  if (!r){
    d.sugg=suggestions(txt);
    d.err=d.sugg.length?`“${esc(txt)}” is not a link. Pick one of these, or paste the page yourself.`:`No match for “${esc(txt)}”. Paste the address of the app's page (for example github.com/owner/name), or use <b>Add without a link</b>.`;
    sheet(); return;
  }
  d.err=""; d.sugg=[]; d.looking=true; sheet();
  setTimeout(()=>{ d.looking=false; d.found=r; d.name=r.name; d.about=r.about; sheet(); $("#mas-name")?.focus(); },600);
}
function save(){ const d=M.sheet; const r=save_pretend(); EVA.saveSheet(d); return r; }
function save_pretend(){
  const d=M.sheet;
  if (d.edit){ const a=M.apps.find(x=>x.id===d.edit), oldName=a.name;
    Object.assign(a,{name:d.name.trim(), about:d.about, cat:d.cat, keep:d.keep, notes:d.notes, url:d.found.url, src:d.found.src, remind:d.found.src==="web"?d.remind:undefined, retired:d.retired});
    if (a.src==="web" && !a.checked) a.checked=TODAY;
    close(); toast(oldName!==a.name?`Saved. Folder renamed to Apps/${a.name}/`:"Saved"); log(`${a.name} changed`); render(); renderHome(); return; }
  const id="a"+Date.now();
  const a={id, name:d.name.trim(), cat:d.cat, about:d.about||d.cat, src:d.found.src, url:d.found.url, keep:d.keep, notes:d.notes, latest:d.found.ver?{ver:d.found.ver,date:TODAY}:null, update:null, files:[]};
  if (a.src==="web"){ a.remind=d.remind; a.checked=TODAY; }
  M.apps.unshift(a); M.open.add(id); const fl=d.file; close(); M.filter="all"; M.q=""; M.sub="mine";
  log(`${a.name} added to my apps; folders made: ${folderList(a).join(", ")}`);
  toast(`${a.name} added. Folders made: ${folderList(a).join(", ")}`); render(); renderHome();
  if (fl) dropped(id,fl);
}
return {M, render, updates, openSheet, checkNow, close, dueList, days, TODAY};
})();

// ------------------------------------------------------------------ hook into the rest of the preview
// the old pack-based Apps screen stays in the page (hidden), the old app list no longer counts
S.emus.forEach(e=>{ e.latest=[...(e.versions[0]||e.latest)]; });
{ const _ra=renderAll; renderAll=function(){ _ra(); MA.render(); }; }
{ const _hi=homeItems; homeItems=function(){
    const it=_hi().filter(i=>i.go!=="apps");
    const u=MA.updates();
    if (u.length){ const i=it.findIndex(x=>x.k!=="start"); it.splice(i<0?it.length:Math.max(i,0),0,{k:"warn", icon:"↑", t:`${u.length} new version${u.length>1?"s":""} of your apps`, s:u.slice(0,3).map(a=>`${a.name} ${a.update.ver}`).join(", ")+" · press Download on the app", go:"myapps", btn:"Show"}); }
    const dl=MA.dueList();
    if (dl.length){ const i=it.findIndex(x=>x.k!=="start"); it.splice(i<0?it.length:Math.max(i,0)+(u.length?1:0),0,{k:"warn", icon:"⌕", t:dl.length===1?`Time to check ${dl[0].name}`:`${dl.length} websites to check`, s:dl.map(a=>`${a.name} · last checked ${MA.days(a.checked,MA.TODAY)} days ago`).join(", "), go:"myapps", btn:"Show"}); }
    return it; }; }
GO.myapps=()=>go("emu",()=>{ MA.M.sub="mine"; MA.M.filter="upd"; MA.render(); });
GO.apps=GO.myapps;
{ const _si=searchIndex; searchIndex=function(){
    const R=_si().filter(r=>r.g!=="Apps");
    MA.M.apps.forEach(a=>R.push({g:"Apps", t:a.name, s:a.about, run:()=>go("emu",()=>{ MA.M.sub="mine"; MA.M.filter="all"; MA.M.q=a.name; MA.M.open.delete("!"+a.id); MA.M.open.add(a.id); MA.render(); })}));
    R.push({g:"Actions", t:"Add an app to my list", s:"", run:()=>go("emu",()=>MA.openSheet())});
    return R; }; }
updateNotice=function(){ const u=MA.updates(); if(!u.length) return notify("apps","Emu Vault","All your apps are up to date","apps"); return notify("apps", u.length===1?`${u[0].name} ${u[0].update.ver} is out`:`${u.length} new versions`, u.slice(0,3).map(a=>`${a.name} ${a.update.ver}`).join(", "), "myapps"); };
$("#ma-veil").addEventListener("click",e=>{ if(e.target.id==="ma-veil") MA.close(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape" && !$("#ma-veil").hidden) MA.close(); });
{ const _rs=renderStrip; renderStrip=function(){ _rs(); if(typeof MA==="undefined") return; const u=MA.updates().length, files=MA.M.apps.reduce((n,a)=>n+a.files.length,0);
    $("#strip").innerHTML=`<span>Folder <b class="mono">${esc(S.dir)}</b></span><span>Apps <b>${MA.M.apps.length}</b></span><span>Kept <b>${files} files · max 3 per platform</b></span><span>${u?`<b>${u}</b> new version${u>1?"s":""}`:"All up to date"}</span>`;
    const n=$("#n-emu"); n.textContent=u?`${u} update${u>1?"s":""}`:`${MA.M.apps.length}`; }; }
{ const _r=MA.render; MA.render=function(){ _r(); renderStrip(); }; }

// ===================================================================== Fold long lists (Duplicates, Inbox, Collection) + Multi-disc tool
function foldBlock(b, k, head, sub){
  b.dataset.t="1"; b.classList.add("fold"); if(isOpen(k)) b.classList.add("open");
  if (sub){ const d=head.querySelector(":scope > div"); if(d && !d.querySelector(".fsum")) d.insertAdjacentHTML("beforeend", `<div class="fsum">${sub}</div>`); }
  head.setAttribute("role","button"); head.tabIndex=0; head.setAttribute("aria-expanded", b.classList.contains("open"));
  const tg=()=>{ b.classList.toggle("open"); const o=b.classList.contains("open"); head.setAttribute("aria-expanded",o); o?S.ui.open.add(k):S.ui.open.delete(k); };
  head.addEventListener("click", e=>{ if(e.target.closest("button,a,input,label,select")) return; tg(); });
  head.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); tg(); } });
}
function foldBar(list, sel, prefix, label){
  if (!list || list.previousElementSibling?.classList.contains("foldbar")) return;
  const bar=document.createElement("div"); bar.className="foldbar";
  bar.innerHTML=`<span class="muted">${label}</span><button class="linkbtn" data-fo="1">Open all</button><button class="linkbtn" data-fo="0">Close all</button>`;
  bar.querySelectorAll("[data-fo]").forEach(btn=>btn.onclick=()=>{ const o=btn.dataset.fo==="1";
    document.querySelectorAll(sel).forEach(b=>{ const k=b.dataset.fk; b.classList.toggle("open",o); b.querySelector(":scope > header")?.setAttribute("aria-expanded",o); o?S.ui.open.add(k):S.ui.open.delete(k); }); });
  list.before(bar);
}
function inboxState(c){
  if (c.querySelector(".verdict.warn")) return ["warn","wrong folder?"];
  if (c.querySelector("select[data-isys]")) return ["warn","pick the system"];
  if (c.querySelector("[data-ich]")) return ["warn","you already have it"];
  if (c.querySelector(".ck.warn")) return ["warn","check the match"];
  if (c.querySelector(".ck.bad")) return ["plat","not in the list"];
  if (c.querySelector("[data-ireg]")) return ["warn","which region?"];
  return ["ok","ready to add"];
}
{ const _tidy=tidy; tidy=function(root){ _tidy(root);
  // Duplicates: one line per game
  const dl=root.querySelectorAll("#view-roms .dgroup:not([data-t])");
  dl.forEach(g=>{ const head=g.querySelector(":scope > header"); if(!head) return;
    const k="dup:"+head.querySelector("h3").textContent.trim()+"|"+(head.querySelector(".why")?.textContent.split("·")[0].trim()||"");
    g.dataset.fk=k;
    const keep=g.querySelectorAll(".vrow.keep").length, go=g.querySelectorAll(".vrow:not(.keep)").length;
    const kn=g.querySelector(".vrow.keep .fn")?.textContent.trim();
    const sub=g.classList.contains("ignored")?"ignored":`keep ${keep>1?keep+" versions":`<span class="mono">${esc(kn||"")}</span>`}${go?` · <span style="color:var(--warn)">${go} → _duplicates</span>`:""}`;
    foldBlock(g, k, head, sub); });
  if (dl.length) foldBar(root.querySelector("#view-roms .dgroup")?.parentElement, "#view-roms .dgroup.fold", "dup:", "Tap a game to see its versions.");
  // Inbox: one line per file, with what it needs
  const il=root.querySelectorAll("#view-roms .icard:not([data-t]), #view-inbox #inbox-box .icard:not([data-t])");
  il.forEach(c=>{ const head=c.querySelector(":scope > header"); if(!head) return;
    const k="in:"+head.querySelector(".fn").textContent.trim(); c.dataset.fk=k;
    const [kind,txt]=inboxState(c);
    head.insertAdjacentHTML("beforeend", `<span class="pill ${kind}">${txt}</span>`);
    foldBlock(c, k, head, null); });
  if (il.length) foldBar(root.querySelector("#inbox-box .ilist, #view-roms .ilist")?.closest(".group"), "#view-inbox .icard.fold, #view-roms .icard.fold", "in:", "Tap a file to decide.");
  // Collection: makers fold, your own systems stay open
  // makers with one system go together under "Other makers"
  const singles=[...root.querySelectorAll("#view-coll > .group:not([data-t])")].filter(gr=>{ const h=gr.querySelector(":scope > h2"), g=gr.querySelector(":scope > .sysgrid"); return h&&g&&g.children.length===1&&!/^(Your systems|No complete list)/.test(h.textContent.trim()); });
  if (singles.length>2){ const gr=document.createElement("div"); gr.className="group"; gr.style.marginTop="12px";
    gr.innerHTML=`<h2>Other makers · ${singles.length}</h2><div class="sysgrid"></div>`; const grid=gr.querySelector(".sysgrid");
    singles[0].before(gr); singles.forEach(x=>{ grid.appendChild(x.querySelector(".sysgrid").firstElementChild); x.remove(); }); }
}; }

// ---- Multi-disc games (Tools)
S.tools.md = {done:{}};
// systems whose emulators read .m3u playlists (discs, and floppies in RetroArch)
const M3U_OK = {psx:"DuckStation, RetroArch", saturn:"RetroArch (Beetle Saturn, Yabasanshiro)", segacd:"RetroArch (Genesis Plus GX)", dreamcast:"Flycast", pcenginecd:"RetroArch (Beetle PCE)", "3do":"RetroArch (Opera)", pcfx:"RetroArch (Beetle PC-FX)", neogeocd:"RetroArch (NeoCD)", amigacd32:"RetroArch (PUAE)", cdtv:"RetroArch (PUAE)", atarijaguarcd:"RetroArch", cdimono1:"RetroArch (SAME CDi)", gc:"Dolphin", amiga:"RetroArch (PUAE), floppies", msx:"RetroArch (blueMSX), floppies", pc98:"RetroArch (Neko Project II), floppies", atarist:"RetroArch (Hatari), floppies", c64:"RetroArch (VICE), disks"};
const M3U_NO = {ps2:"PCSX2 can't read playlists. Keep the discs as they are and use Change Disc in PCSX2.", xbox:"xemu can't read playlists. Load the next disc from xemu's menu.", wii:"Dolphin plays Wii games from one disc; nothing to combine."};
function mdGames(){
  const g={};
  S.romFiles.forEach(f=>{ const m=f.name.match(/^(.*?)\s*\((?:Disc|Disk|CD) (\d+)[^)]*\)(.*)\.(\w+)$/i); if(!m) return;
    const name=(m[1]+m[3]).trim(), k=f.sys+"|"+name; (g[k] ||= {k, sys:f.sys, name, ext:m[4], discs:[]}).discs.push({n:+m[2], file:f.name, mb:f.mb}); });
  return Object.values(g).filter(x=>M3U_OK[x.sys]||M3U_NO[x.sys]).map(x=>{ x.no=M3U_NO[x.sys]||""; x.discs.sort((a,b)=>a.n-b.n); const max=Math.max(...x.discs.map(d=>d.n)); x.missing=[]; for(let i=1;i<=max;i++) if(!x.discs.some(d=>d.n===i)) x.missing.push(i); x.only1=x.discs.length===1; return x; });
}
function mdToolHTML(){
  const all=mdGames(), D=S.tools.md.done, no=all.filter(x=>x.no), ok=all.filter(x=>!x.no), ready=ok.filter(x=>!x.only1&&!x.missing.length&&!D[x.k]), done=ok.filter(x=>D[x.k]), wait=ok.filter(x=>(x.only1||x.missing.length)&&!D[x.k]);
  const pill=ready.length?`<span class="pill warn">${ready.length} to combine</span>`:`<span class="pill ok">all combined</span>`;
  return `<div class="sys-block tool" id="md-tool" style="margin-top:12px"><header><div><h3>Multi-disc games</h3><div class="used">One entry per game instead of one per disc</div></div>${pill}</header>
    <p class="hint" style="margin:0">Games on more than one disc show up as Disc 1, Disc 2… in ES-DE and RetroArch. Combining puts the discs in a folder <span class="mono">Game.m3u/</span> with a small playlist. Your frontend then shows one game, and you swap discs from the emulator menu. Nothing is converted or deleted.</p>
    <details class="codes"><summary>Which systems can do this?</summary>
      <div class="tscroll"><table><thead><tr><th>System</th><th>Works with</th></tr></thead><tbody>${Object.entries(M3U_OK).map(([id,e])=>`<tr><td>${esc(GI[id]?sysLabel(GI[id]):id)}</td><td>${esc(e)}</td></tr>`).join("")}${Object.entries(M3U_NO).map(([id,e])=>`<tr><td>${esc(GI[id]?sysLabel(GI[id]):id)}</td><td class="muted">Not possible. ${esc(e)}</td></tr>`).join("")}</tbody></table></div></details>
    ${ready.length>1?`<div><button class="btn small primary" id="md-all">Combine all ${ready.length}</button></div>`:""}
    <div class="files">${[
      ...ready.map(x=>`<div class="frow"><span class="dot"></span><div><div class="fn">${esc(x.name)}</div><div class="note">roms/${esc(x.sys)}/ · ${x.discs.length} discs · ${x.discs.map(d=>"Disc "+d.n).join(", ")}</div></div><button class="btn small" data-md="${esc(x.k)}">Combine</button></div>`),
      ...wait.map(x=>`<div class="frow"><span class="ck warn">!</span><div><div class="fn">${esc(x.name)}</div><div class="note">roms/${esc(x.sys)}/ · ${x.only1?"Only Disc 1 found. Add the other discs first.":`Disc ${x.missing.join(", ")} missing. Add ${x.missing.length>1?"them":"it"} first.`}</div></div><span class="pill plat">waiting</span></div>`),
      ...no.map(x=>`<div class="frow"><span class="ck info">i</span><div><div class="fn">${esc(x.name)}</div><div class="note">roms/${esc(x.sys)}/ · ${esc(x.no)}</div></div><span class="pill plat">not possible</span></div>`),
      ...done.map(x=>`<div class="frow"><span class="dot on"></span><div><div class="fn">${esc(x.name)}</div><div class="note mono">roms/${esc(x.sys)}/${esc(x.name)}.m3u/</div></div><span class="pill ok">one game</span></div>`)
    ].join("")||`<p class="hint">No multi-disc games found.</p>`}</div></div>`;
}
function bindMdTool(){
  const D=S.tools.md.done, re=()=>renderRoms();
  const doIt=ks=>{ EV.m3u(ks); ks.forEach(k=>D[k]=true); const n=ks.length; record?.(`Combined ${n} multi-disc game${n>1?"s":""}`, null); log(`${n} multi-disc game${n>1?"s":""} combined into .m3u folders`); toast(n===1?`${ks[0].split("|")[1]} is now one game`:`${n} games combined`); re(); };
  document.querySelectorAll("[data-md]").forEach(b=>b.onclick=()=>doIt([b.dataset.md]));
  const a=$("#md-all"); if(a) a.onclick=()=>doIt(mdGames().filter(x=>!x.no&&!x.only1&&!x.missing.length&&!D[x.k]).map(x=>x.k));
}
{ const _rt=renderTools; renderTools=function(){ const h=_rt(), mark='<div class="sys-block tool" style="margin-top:12px"><header><div><h3>Check your files'; const i=h.indexOf(mark); return i<0?h+mdToolHTML():h.slice(0,i)+mdToolHTML()+h.slice(i); };
  const _bt=bindTools; bindTools=function(){ _bt(); bindMdTool(); }; }

// ===================================================================== Lists: merged regional names (Retool clone lists) + your own changes (lists/<system>.txt)
S.coll.edits = (()=>{ try{ return JSON.parse(localStorage.getItem("emukluis-edits")||"{}"); }catch(e){ return {}; } })();
let saveEdits = () => { try{ localStorage.setItem("emukluis-edits", JSON.stringify(S.coll.edits)); }catch(e){} };
const EDIT_REG = {usa:"US",us:"US",europe:"EU",eu:"EU",japan:"JP",jp:"JP",world:"W",w:"W"};
function parseEdits(txt){
  const E={hide:[], same:[], add:[], bad:[]};
  (txt||"").split("\n").forEach((ln,i)=>{ const l=ln.trim(); if(!l||l.startsWith("#")) return;
    const m=l.match(/^(hide|same|add)\s*:\s*(.+)$/i); if(!m){ E.bad.push(i+1); return; }
    const kind=m[1].toLowerCase(), v=m[2].trim();
    if (kind==="same"){ const p=v.split("="); if(p.length!==2){ E.bad.push(i+1); return; } E.same.push([p[0].trim(),p[1].trim()]); }
    else if (kind==="add"){ const r=v.match(/\(([^)]+)\)\s*$/); const regs=r?r[1].split(",").map(x=>EDIT_REG[x.trim().toLowerCase()]).filter(Boolean):[]; E.add.push([r?v.slice(0,r.index).trim():v, regs.reduce((a,x)=>a|RB[x],0)]); }
    else E.hide.push(v);
  });
  return E;
}
const LIST_CACHE = {};
function listFor(sys){
  const txt=S.coll.edits[sys]||"", ck=sys+"\u0000"+txt, raw=LISTS[sys];
  if (!raw) return {rows:[], alias:{}};
  if (LIST_CACHE[sys] && LIST_CACHE[sys].ck===ck && LIST_CACHE[sys].raw===raw) return LIST_CACHE[sys];
  const E=parseEdits(txt), alias=Object.create(null), by=new Map();
  raw.forEach(([t,r,c,alts])=>{ const k=ckey(t); by.set(k,{t,r,c,k,alts:(alts||[]).slice(),mine:""}); alias[k]=k; (alts||[]).forEach(a=>alias[ckey(a)]=k); });
  const find=name=>{ const k=alias[ckey(name)]; return k&&by.get(k); };
  E.same.forEach(([a,b])=>{ const A=find(a), B=find(b); if(!A||!B||A===B) return; B.r|=A.r; B.c=Math.min(B.c,A.c); B.alts.push(A.t,...A.alts); B.mine="merged by you"; by.delete(A.k); Object.keys(alias).forEach(k=>{ if(alias[k]===A.k) alias[k]=B.k; }); });
  E.hide.forEach(h=>{ const A=find(h); if(A){ by.delete(A.k); A.hidden=true; } });
  E.add.forEach(([t,r])=>{ const k=ckey(t); if(!k||by.has(k)) return; by.set(k,{t,r,c:0,k,alts:[],mine:"added by you"}); alias[k]=k; });
  const rows=[...by.values()].sort((a,b)=>a.t.localeCompare(b.t,undefined,{sensitivity:"base"}));
  return LIST_CACHE[sys]={ck, raw, rows, alias, E, hidden:E.hide.length, added:E.add.length, merged:E.same.length};
}
collData=function(sys){
  const L=listFor(sys), owned=Object.create(null);
  S.romFiles.filter(f=>f.sys===sys).forEach(f=>{ const p=parseFile(f); if(p.special.length||p.bad) return; const k=L.alias[p.key]||p.key; (owned[k] ||= []).push(f); });
  const man=S.coll.manual[sys]||{}, wish=S.coll.wish[sys]||{};
  return L.rows.map(e=>({t:e.t, r:e.r, c:e.c, k:e.k, alts:e.alts, mine:e.mine, files:owned[e.k]||null, man:!!man[e.k], wish:!!wish[e.k]}));
};
// list page: "also known as", your changes, where the file lives
{ const _rcs=renderCollSystem; renderCollSystem=function(){
  _rcs(); const C=S.coll; if (!LISTS[C.sys]) return;
  const info=GI[C.sys], L=listFor(C.sys), v=$("#view-coll"), by=Object.fromEntries(L.rows.map(e=>[e.k,e]));
  v.querySelectorAll(".crow").forEach(row=>{ const e=by[row.querySelector("[data-cwish]")?.dataset.cwish]; if(!e) return; const meta=row.querySelector(".meta"); if(!meta) return;
    if (e.alts.length) meta.insertAdjacentHTML("beforeend", `<span class="aka" title="${esc(e.alts.join(" · "))}">also ${esc(e.alts.slice(0,2).join(", "))}${e.alts.length>2?` +${e.alts.length-2}`:""}</span>`);
    if (e.mine) meta.insertAdjacentHTML("beforeend", `<span class="pill plat">${esc(e.mine)}</span>`); });
  const sum=v.querySelector(".dupsum"); if(!sum) return;
  const file=`${S.dir}/lists/${C.sys}.txt`, txt=C.edits[C.sys]||"", n=L.hidden+L.added+L.merged;
  sum.insertAdjacentHTML("beforeend", `<details class="codes" id="c-edits" ${S.ui.open.has("edits:"+C.sys)?"open":""}><summary>Your changes to this list${n?` · ${n}`:""}</summary>
    <p class="hint">${info.clones?`Games with another name in another region already count as one: ${nl(info.clones)} names are merged, for example Rockman = Mega Man. `:""}Want it different? Write it here, one line each. It is saved as <span class="mono">${esc(file)}</span>, so you can also edit it with any text editor. A new list version from No-Intro or Redump keeps your changes.</p>
    <pre class="ehelp">hide: Game title           leave a game out
same: Title A = Title B    count two games as one
add: Game title (USA)      a game the list doesn't have</pre>
    <textarea id="c-etxt" rows="5" spellcheck="false" placeholder="# for example&#10;hide: Pinball Fantasies&#10;same: Rockman = Mega Man">${esc(txt)}</textarea>
    ${L.E&&L.E.bad.length?`<p class="hint" style="color:var(--bad)">Line ${L.E.bad.join(", ")} not understood. Start with hide:, same: or add:.</p>`:""}
    <div class="gact"><button class="btn small primary" id="c-esave">Save</button>${txt?`<button class="linkbtn" id="c-eclear">Remove all my changes</button>`:""}</div></details>`);
  const d=$("#c-edits"); d.addEventListener("toggle",()=>{ d.open?S.ui.open.add("edits:"+C.sys):S.ui.open.delete("edits:"+C.sys); });
  $("#c-esave").onclick=()=>{ C.edits[C.sys]=$("#c-etxt").value.trim(); if(!C.edits[C.sys]) delete C.edits[C.sys]; saveEdits(); const L2=listFor(C.sys); log(`${info.name} list: your changes saved to lists/${C.sys}.txt`); toast(`Saved · ${L2.hidden} hidden, ${L2.merged} merged, ${L2.added} added`); renderCollSystem(); };
  const cl=$("#c-eclear"); if(cl) cl.onclick=()=>{ delete C.edits[C.sys]; saveEdits(); toast("Back to the list as it comes"); renderCollSystem(); };
}; }
// overview: everything below "Your systems" in one fold; counts follow your changes once a list is loaded
{ const _rc=renderColl; renderColl=function(){ _rc(); if (S.coll.view==="systeem") return; const root=document;
  // everything below "Your systems" goes into one fold: All systems
  const vc=root.querySelector("#view-coll");
  if (vc && S.coll.view!=="systeem" && !vc.querySelector("details.allsys")){
    const fbar=vc.querySelector(":scope > .fbar");
    if (fbar){
      const searching=!!(S.coll.sq||"").trim() || S.coll.kind!=="alle";
      const d=document.createElement("details"); d.className="allsys"; d.dataset.k="coll:all"; d.open=searching||isOpen("coll:all");
      const groups=[...vc.querySelectorAll(":scope > .group")].filter(g=>!/^Your systems/.test(g.querySelector("h2")?.textContent.trim()||""));
      const makers=groups.map(g=>g.querySelector("h2").textContent.trim().split(" · ")[0]).filter(m=>!/^No complete list/.test(m));
      d.innerHTML=`<summary><span class="mkt">All systems · ${GAMEINDEX.length}</span><span class="fs">${esc(makers.slice(0,5).join(", "))}${makers.length>5?"…":""}</span></summary><div class="allin"></div>`;
      fbar.before(d); const inn=d.querySelector(".allin"); inn.appendChild(fbar); groups.forEach(g=>{ g.dataset.t="1"; inn.appendChild(g); });
      // typing in the search: keep the fold open and the focus in the box
    }
  }

}; }
// ROMs overview: same-size cards, Add at the bottom, add your own system
{ const _rr=renderRoms; renderRoms=function(){ _rr(); if (S.romView && S.romView!=="overzicht") return;
  const g=$("#view-roms .grid2"); if(!g || g.querySelector(".rom-new")) return;
  g.classList.add("romgrid");
  g.insertAdjacentHTML("beforeend", `<button class="rom rom-new" id="rom-new"><span class="plus">+</span><b>Add a system</b><span class="muted">A folder for a console that isn't here yet. It shows up in Collection too when there is a list for it.</span></button>`);
  $("#rom-new").onclick=()=>openAdd("rom");
}; }

// ===================================================================== Collection follows "Which region do you keep?"
let ruleRank = r => r==="W" ? -1 : (S.regions.indexOf(r)<0 ? 9 : S.regions.indexOf(r));
const bestOf = regs => regs.length ? regs.reduce((a,r)=>ruleRank(r)<ruleRank(a)?r:a) : null;
function upgradeOf(sys, g){
  if (!Array.isArray(g.files) || GI[sys]?.kind==="arcade") return null;
  const avail = bestOf(regsOfMask(g.r).filter(r=>r!=="OV"||S.regions.includes("OV")));
  const mine = bestOf(g.files.reduce((a,f)=>a.concat(parseFile(f).regions),[]));
  if (!avail || !mine || ruleRank(avail) >= ruleRank(mine)) return null;
  return {mine, avail};
}
{ const _cd=collData; collData=function(sys){ return _cd(sys).map(g=>{ g.up=upgradeOf(sys,g); return g; }); }; }
{ const _rcs=renderCollSystem; renderCollSystem=function(){
  const C=S.coll; if (C.show==="beter" && !LISTS[C.sys]) C.show="alles";
  const realShow=C.show; if (realShow==="beter") C.show="heb";
  _rcs(); C.show=realShow;
  if (!LISTS[C.sys] || GI[C.sys].kind==="arcade") return;
  const all=collData(C.sys), ups=all.filter(g=>g.up && regVisible(g.r));
  const v=$("#view-coll"), sum=v.querySelector(".dupsum"); if(!sum) return;
  // rule line in the summary
  const nums=sum.querySelector(".nums");
  nums.insertAdjacentHTML("beforeend", `<div><b>${ups.length}</b>could be better</div>`);
  nums.insertAdjacentHTML("afterend", `<div class="prefs"><span><b>One of every game.</b> The version that counts best is the one first in your rule: ${regionRule()}.</span><button class="linkbtn" id="c-rule">Change</button></div>`);
  $("#c-rule").onclick=()=>{ document.querySelector('.tab[data-tab="set"]').click(); S.ui.open.add("set:Which region do you keep?"); renderSet(); setTimeout(()=>$('[data-k="set:Which region do you keep?"]')?.scrollIntoView({block:"start"}),40); };
  // extra chip
  const chips=v.querySelector("[data-cshow]")?.parentElement;
  if (chips){ chips.insertAdjacentHTML("beforeend", `<button class="chip" data-cshow="beter" aria-pressed="${C.show==="beter"}">Could be better<span class="c">${ups.length}</span></button>`);
    chips.querySelectorAll("[data-cshow]").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.cshow===C.show)));
    chips.querySelector('[data-cshow="beter"]').onclick=()=>{ C.show="beter"; C.limit=1e6; renderCollSystem(); }; }
  // mark rows, and filter when "Could be better" is on
  const U=Object.fromEntries(ups.map(g=>[g.k,g.up]));
  v.querySelectorAll(".crow, .ctile").forEach(row=>{ const k=row.querySelector("[data-cwish]")?.dataset.cwish; const u=U[k];
    if (u){ const meta=row.querySelector(".meta")||row.querySelector(".ct"); meta.insertAdjacentHTML("beforeend", ` <span class="pill warn" title="You have the ${GROUP_NAMES[u.mine]||u.mine} version. Your rule prefers ${GROUP_NAMES[u.avail]||u.avail}.">better: ${esc(GROUP_NAMES[u.avail]||u.avail)}</span>`); }
    else if (C.show==="beter") row.remove(); });
  if (C.show==="beter"){ const t=v.querySelector(".ftable, .cgrid"); if (t && !t.children.length) t.innerHTML=`<div class="empty-state">Every game you have is already the version your rule likes best.</div>`;
    v.querySelector("#c-more")?.remove();
    t?.insertAdjacentHTML("beforebegin", `<p class="hint" style="margin:10px 0 0">When a better version lands in your Inbox, Emu Vault asks whether to replace the one you have. The old one goes to <span class="mono">_duplicates</span>.</p>`); }
}; }
// the collection overview shows the rule too
{ const _rc=renderColl; renderColl=function(){ _rc(); if (S.coll.view==="systeem") return;
  const p=$("#view-coll .dupsum .nums"); if (p && !$("#c-rule0")) p.insertAdjacentHTML("afterend", `<div class="prefs"><span><b>One of every game</b>, any region counts. Best version: ${regionRule()}.</span><button class="linkbtn" id="c-rule0">Change</button></div>`);
  const b=$("#c-rule0"); if(b) b.onclick=()=>{ document.querySelector('.tab[data-tab="set"]').click(); S.ui.open.add("set:Which region do you keep?"); renderSet(); setTimeout(()=>$('[data-k="set:Which region do you keep?"]')?.scrollIntoView({block:"start"}),40); };
}; }

S.log=[[now(),`${MA.updates().length} new versions of your apps`],[now(),`Apps loaded: ${MA.M.apps.length} apps`]];
renderAll();

// ===================================================================== Inbox: its own place. Drop anything; Emu Vault sorts games, BIOS files and app downloads.
S.ib = {view:"inbox", other:[], done:[]};
const activeTab = () => document.querySelector('.tab[aria-selected="true"]')?.dataset.tab;
const IB_AMBIG = new Set(["zip","7z","rar","iso","chd","cue","bin","img","rvz","cso","pbp","gdi","cdi","m3u"]);
const IB_EXT_SYS = (()=>{ const m={}; S.roms.forEach(r=>(r.ext||"").split(/\s+/).forEach(e=>{ e=e.replace(/^\./,"").replace(/[^a-z0-9]/gi,"").toLowerCase(); if(e && !IB_AMBIG.has(e) && !m[e]) m[e]=r.id; })); return m; })();
const IB_APP_EXT = /\.(appimage|apk|exe|msi|dmg|flatpak|deb|rpm)$/i;
const IB_SAVE_EXT = /\.(srm|sav|state\d*|mcr|mcd|ps2|dsv|sa1)$/i;
const ibNorm = s => s.toLowerCase().replace(/[^a-z0-9]/g,"");
function whatIs(name){
  const low=name.toLowerCase(), ext=(low.match(/\.([a-z0-9]+)$/)||[])[1]||"";
  for (const e of BIOSDB){ const f=e.files.find(x=>x.f.toLowerCase()===low); if (f && !(e.id==="neogeo" && low==="neogeo.zip" && false)) return {kind:"bios", sys:e.id, f:f.f, to:`bios/${e.id}/${f.f}`, label:`BIOS for ${biosName(e.id)}`}; }
  const app=MA.M.apps.find(a=>ibNorm(name).startsWith(ibNorm(a.name)) || (ibNorm(a.name).length>3 && ibNorm(name).includes(ibNorm(a.name))));
  if (app && (IB_APP_EXT.test(low) || /\.(zip|7z|tar\.gz|tar\.xz)$/.test(low))){
    const plat=/\.apk$/.test(low)?"Android":/\.(exe|msi)$|win/i.test(low)?"Windows":/\.dmg$|macos/i.test(low)?"macOS":"Linux";
    const ver=(name.match(/(\d+(?:\.\d+)+(?:-\d+)?|\d{4,})/)||[])[1]||"";
    return {kind:"app", app:app.id, plat, ver, to:`Apps/${app.name}/${plat}/`, label:`Download of ${app.name}${ver?" "+ver:""} (${plat})`};
  }
  if (IB_APP_EXT.test(low)) return {kind:"app?", to:"", label:"An app download, but not one in your Apps list"};
  if (IB_SAVE_EXT.test(low)) return {kind:"save", to:"", label:"Looks like a save file"};
  if (IB_EXT_SYS[ext]) return {kind:"rom", sys:IB_EXT_SYS[ext]};
  if (IB_AMBIG.has(ext)) return {kind:"rom", sys:""};
  return {kind:"?", to:"", label:"Emu Vault doesn't know this file"};
}
function takeFiles(list, how){
  let roms=0, other=0;
  [...list].forEach((x,i)=>{ const name=x.name, mb=(x.size||0)/1048576, w=whatIs(name);
    if (w.kind==="rom"){ S.inbox.push({id:"d"+Date.now()+i, dir:w.sys, name, mb}); roms++; }
    else { S.ib.other.push({id:"o"+Date.now()+i, name, mb, ...w}); other++; } });
  log(`Inbox: ${list.length} file(s) ${how}`);
  toast(`${roms?`${roms} game${roms>1?"s":""}`:""}${roms&&other?" and ":""}${other?`${other} other file${other>1?"s":""}`:""} in the inbox`);
  renderInboxTab(); renderStrip(); renderHome?.();
}
function otherCard(o){
  const sure=o.kind==="bios"||o.kind==="app";
  const acts = sure ? `<button class="btn small primary" data-ogo="${o.id}">Put it there</button><button class="linkbtn" data-oskip="${o.id}">Skip</button>`
    : `<select data-oas="${o.id}" aria-label="What is ${esc(o.name)}?"><option value="">What is it?</option><option value="rom">A game</option><option value="bios">A BIOS file</option>${MA.M.apps.map(a=>`<option value="app:${a.id}">A download of ${esc(a.name)}</option>`).join("")}<option value="leave">Leave it in the inbox</option></select><button class="linkbtn" data-oskip="${o.id}">Skip</button>`;
  return `<article class="icard ib-other"><header><div style="min-width:0"><div class="fn mono">${esc(o.name)}</div><div class="muted" style="font-size:12px">inbox/ · ${size(Math.max(1,Math.round(o.mb||1)))}</div></div><span class="pill ${sure?"ok":"warn"}">${sure?o.kind==="bios"?"BIOS":"app":"what is it?"}</span></header>
    <div class="checks"><div class="crow2"><span class="ck ${sure?"ok":"warn"}">${sure?"✓":"?"}</span><span><b>${esc(o.label)}</b>${sure?`<br><span class="muted">Goes to <span class="mono">${esc(S.dir)}/${esc(o.to)}</span>${o.kind==="app"?". You check the version in Apps, like after a drop.":""}</span>`:""}</span></div></div>
    <div class="iact">${acts}</div></article>`;
}
function renderInboxTab(){
  const el=$("#view-inbox"); if(!el) return;
  const n=S.inbox.length+S.ib.other.length;
  let h=`<div class="ib-drop" id="ib-drop" tabindex="0">
      <div class="ib-ic" aria-hidden="true">↓</div>
      <div><b>Drop anything here</b><span class="muted">Games, BIOS files, app downloads, whole folders or zips. Emu Vault works out what each file is and where it goes.</span></div>
      <div class="ib-btns"><label class="btn small" for="ib-files">Choose files</label><input type="file" id="ib-files" multiple hidden>
        <label class="btn small" for="ib-dir">Choose a folder</label><input type="file" id="ib-dir" webkitdirectory multiple hidden>
        <button class="btn small" id="ib-scan">Scan a drive</button></div>
    </div>
    <div class="seg ib-seg" role="group"><button data-ibv="inbox" aria-pressed="${S.ib.view==="inbox"}">New files${n?` · ${n}`:""}</button><button data-ibv="drives" aria-pressed="${S.ib.view==="drives"}">Drives</button></div>
    <div id="ib-box"></div>`;
  el.innerHTML=h;
  const box=$("#ib-box");
  if (S.ib.view==="drives"){ box.innerHTML=`<p class="hint" style="margin:0 0 10px">Pick a drive or SD card. You only see what you don't have yet, or a better version by your region rule.</p><div id="drv-box"></div>`; renderDrives($("#drv-box")); }
  else {
    box.innerHTML=(S.ib.other.length?`<div class="group" style="margin-top:4px"><h2>Not games · ${S.ib.other.length}</h2><div class="ilist" style="margin-top:0">${S.ib.other.map(otherCard).join("")}</div></div>`:"")+`<div id="inbox-box"><div class="empty-state">Checking new files…</div></div>`;
    renderInbox($("#inbox-box"));
    box.querySelectorAll("[data-ogo]").forEach(b=>b.onclick=()=>doOther(b.dataset.ogo));
    box.querySelectorAll("[data-oskip]").forEach(b=>b.onclick=()=>{ S.ib.other=S.ib.other.filter(o=>o.id!==b.dataset.oskip); renderInboxTab(); });
    box.querySelectorAll("[data-oas]").forEach(s=>s.onchange=()=>{ const o=S.ib.other.find(x=>x.id===s.dataset.oas), v=s.value; if(!v||!o) return;
      if (v==="leave"){ toast("It stays in the inbox folder"); return; }
      if (v==="rom"){ S.ib.other=S.ib.other.filter(x=>x!==o); S.inbox.push({id:"r"+o.id, dir:"", name:o.name, mb:o.mb, loc:o.loc}); renderInboxTab(); return; }
      if (v==="bios"){ toast("Open BIOS and drop it on the right system"); return; }
      if (v.startsWith("app:")){ const a=MA.M.apps.find(x=>x.id===v.slice(4)); Object.assign(o,{kind:"app", app:a.id, plat:/\.apk$/i.test(o.name)?"Android":"Linux", ver:"", to:`Apps/${a.name}/`, label:`Download of ${a.name}`}); doOther(o.id); } });
  }
  el.querySelectorAll("[data-ibv]").forEach(b=>b.onclick=()=>{ S.ib.view=b.dataset.ibv; renderInboxTab(); });
  const dz=$("#ib-drop");
  ["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{ e.preventDefault(); dz.classList.add("hover"); }));
  ["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{ e.preventDefault(); dz.classList.remove("hover"); }));
  dz.addEventListener("drop",e=>{ const f=e.dataTransfer?.files; if(f&&f.length) takeFiles(f,"dropped"); });
  $("#ib-files").onchange=e=>takeFiles(e.target.files,"added");
  $("#ib-dir").onchange=e=>takeFiles(e.target.files,"added from a folder");
  $("#ib-scan").onclick=()=>{ S.ib.view="drives"; renderInboxTab(); };
  updateIbBadge();
}
function doOther(id){
  const o=S.ib.other.find(x=>x.id===id); if(!o) return;
  if (o.kind==="bios"){ S.biosHave.add(`${o.sys}/${o.f}`); S.ib.other=S.ib.other.filter(x=>x!==o); S.inboxDone.unshift({name:`inbox/${o.name}`, to:o.to}); log(`BIOS ${o.f} → ${o.to}`); toast(`${o.f}: ${biosName(o.sys)} BIOS is in place`); renderBios?.(); }
  if (o.kind==="app"){ const a=MA.M.apps.find(x=>x.id===o.app); MA.M.pending[a.id]={file:o.name, ver:o.ver||"", plat:o.plat, variant:"", match:true, mb:Math.max(1,Math.round(o.mb||1)), fromInbox:true}; MA.M.open.delete("!"+a.id); MA.M.open.add(a.id);
    S.ib.other=S.ib.other.filter(x=>x!==o); log(`${o.name} → Apps/${a.name}`); MA.render(); toast(`Sent to ${a.name}. Check the version in Apps.`); }
  renderInboxTab(); renderStrip(); renderHome?.();
}
function updateIbBadge(){ const b=$("#n-inbox"); const n=S.inbox.length+S.ib.other.length; if(b) b.textContent=n?`${n} new`:""; }
{ const _u=updateInboxBadge; updateInboxBadge=function(){ _u(); updateIbBadge(); }; }
// ROMs no longer has Inbox and Drives: they live in the Inbox now
{ const _rr=renderRoms; renderRoms=function(){
  if (S.romView==="inbox"||S.romView==="drives"){ S.ib.view=S.romView==="drives"?"drives":"inbox"; S.romView="overzicht"; document.querySelector('.tab[data-tab="inbox"]').click(); return; }
  if (activeTab()==="inbox"){ renderInboxTab(); }
  _rr();
  document.querySelectorAll('#view-roms [data-rv="inbox"], #view-roms [data-rv="drives"]').forEach(b=>b.remove());
  const gi=$("#go-inbox"); if(gi) gi.onclick=()=>{ S.ib.view="inbox"; document.querySelector('.tab[data-tab="inbox"]').click(); };
  const nr=$("#n-roms"); if(nr){ const g=findDups().length; nr.textContent=g?`${g} dup`:String(S.roms.reduce((a,r)=>a+r.n,0)); }
  updateIbBadge();
}; }
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{ if(t.dataset.tab==="inbox") renderInboxTab(); if(t.dataset.tab==="roms"){ renderRoms(); } }));
GO.inbox = ()=>{ S.ib.view="inbox"; go("inbox"); };
GO.drive = ()=>{ S.ib.view="drives"; S.drv.sel="sd"; go("inbox"); };

// Phone: Home · Inbox · Collection · ROMs · Apps · More (BIOS, Backups, Settings)
(()=>{ const bar=document.querySelector('.tab[data-tab="home"]').parentElement;
  const more=document.createElement("button"); more.className="tab tab-more"; more.type="button"; more.setAttribute("aria-haspopup","menu"); more.setAttribute("aria-selected","false");
  more.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg><span class="lb">More</span><span class="n" id="n-more"></span>`;
  bar.appendChild(more);
  const menu=document.createElement("div"); menu.className="more-menu"; menu.hidden=true; menu.setAttribute("role","menu");
  document.body.appendChild(menu);
  const fill=()=>{ menu.innerHTML=[["bios","BIOS"],["bk","Backups"],["set","Settings"]].map(([k,l])=>{ const n=$("#n-"+k)?.textContent||""; return `<button role="menuitem" data-mgo="${k}"><span>${l}</span><span class="muted">${esc(n)}</span></button>`; }).join("");
    menu.querySelectorAll("[data-mgo]").forEach(b=>b.onclick=()=>{ menu.hidden=true; document.querySelector(`.tab[data-tab="${b.dataset.mgo}"]`).click(); }); };
  more.onclick=e=>{ e.stopPropagation(); fill(); menu.hidden=!menu.hidden; };
  document.addEventListener("click",e=>{ if(!menu.hidden && !menu.contains(e.target)) menu.hidden=true; });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") menu.hidden=true; });
  const sync=()=>{ const t=activeTab(); more.setAttribute("aria-selected", String(["bios","bk","set"].includes(t))); const busy=["bios","bk","set"].some(k=>/collect|update|fail/.test($("#n-"+k)?.textContent||"")); $("#n-more").textContent=busy?"!":""; };
  document.querySelectorAll(".tab[data-tab]").forEach(t=>t.addEventListener("click",()=>setTimeout(sync,0)));
  setTimeout(sync,200);
})();
updateIbBadge(); setTimeout(updateIbBadge,300);

