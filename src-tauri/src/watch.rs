//! Notices when files in your main folder change outside Emu Vault (deleted in the file manager, copied in
//! by hand, covers ES-DE scrapes) and tells the window, which then reads the folders again.

use notify::{RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc;
use std::time::Duration;
use tauri::Emitter;

pub fn start(app: tauri::AppHandle, root: String) {
    std::thread::spawn(move || {
        let media = Path::new(&root).join("media");
        let _ = std::fs::create_dir_all(&media);
        let (tx, rx) = mpsc::channel::<bool>();
        let m2 = media.clone();
        let Ok(mut w) = notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
            if let Ok(e) = res {
                if matches!(e.kind, notify::EventKind::Access(_)) {
                    return;
                }
                // true: only pictures/videos changed (media/), false: games, inbox, BIOS…
                let only_media = e.paths.iter().all(|p| p.starts_with(&m2));
                let _ = tx.send(only_media);
            }
        }) else {
            return;
        };
        for d in ["roms", "inbox", "bios", "patches", "media", "Apps"] {
            let p = Path::new(&root).join(d);
            if p.is_dir() {
                let _ = w.watch(&p, RecursiveMode::Recursive);
            }
        }
        // a burst of changes (a big copy, a scraper run) becomes one message, at most every 2 seconds
        while let Ok(first) = rx.recv() {
            std::thread::sleep(Duration::from_millis(1500));
            let mut only_media = first;
            while let Ok(m) = rx.try_recv() {
                only_media &= m;
            }
            let _ = app.emit(if only_media { "media-changed" } else { "disk-changed" }, ());
        }
    });
}
