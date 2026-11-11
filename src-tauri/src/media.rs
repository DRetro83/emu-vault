//! Box art you already have: ES-DE's downloaded_media (the same folder layout Emu Vault uses in
//! <main folder>/media/<system>/<covers|screenshots|...>/<rom name>.png), and pointing ES-DE at Emu Vault's media folder.

use crate::extras::{esde_media_dir, ra_thumbs_dir, same_file};
use crate::Core;
use serde::Serialize;
use std::path::{Path, PathBuf};

fn esde_settings() -> Option<PathBuf> {
    let h = dirs::home_dir()?;
    [h.join("ES-DE/settings/es_settings.xml"), h.join(".emulationstation/es_settings.xml")].into_iter().find(|p| p.is_file())
}

#[derive(Serialize)]
pub struct MediaInfo {
    /// ES-DE's media folder, if ES-DE is on this computer
    esde_media: String,
    /// ES-DE already uses <main folder>/media
    esde_here: bool,
    esde_found: bool,
    /// RetroArch's thumbnails folder, if RetroArch is on this computer
    ra_thumbs: String,
    media_dir: String,
}

fn same_dir(a: &Path, b: &Path) -> bool {
    match (a.canonicalize(), b.canonicalize()) {
        (Ok(x), Ok(y)) => x == y,
        _ => a == b,
    }
}

#[tauri::command]
pub fn media_info(core: tauri::State<Core>) -> MediaInfo {
    let root = core.cfg.lock().unwrap().root.clone();
    let mine = Path::new(&root).join("media");
    let es = esde_media_dir();
    MediaInfo {
        esde_here: es.as_ref().map(|e| same_dir(e, &mine)).unwrap_or(false),
        esde_found: es.is_some() || esde_settings().is_some(),
        esde_media: es.map(|p| p.to_string_lossy().into()).unwrap_or_default(),
        ra_thumbs: ra_thumbs_dir().map(|p| p.to_string_lossy().into()).unwrap_or_default(),
        media_dir: mine.to_string_lossy().into(),
    }
}

#[derive(Serialize)]
pub struct Imported {
    files: usize,
    systems: usize,
    from: String,
}

/// Take over what ES-DE already scraped, for the games you have: linked when it's on the same drive, else copied.
#[tauri::command]
pub async fn import_esde_media(core: tauri::State<'_, Core>) -> Result<Imported, String> {
    let root = core.cfg.lock().unwrap().root.clone();
    let lib = core.lib.lock().unwrap().clone();
    let src = esde_media_dir().ok_or("ES-DE's media folder wasn't found (~/ES-DE/downloaded_media).")?;
    let mine = Path::new(&root).join("media");
    if same_dir(&src, &mine) {
        return Err("ES-DE already uses Emu Vault's media folder, so there's nothing to take over.".into());
    }
    tokio::task::block_in_place(|| {
        let (mut files, mut systems) = (0, 0);
        for (sys, roms) in &lib {
            let sd = src.join(sys);
            if !sd.is_dir() {
                continue;
            }
            let stems: std::collections::HashSet<String> = roms
                .iter()
                .map(|f| {
                    let r = f.rel.trim_end_matches('/');
                    r.rsplit_once('.').filter(|(a, _)| !a.ends_with('/')).map(|(a, _)| a.to_string()).unwrap_or_else(|| r.to_string())
                })
                .collect();
            let mut n = 0;
            for kind in std::fs::read_dir(&sd).map_err(|e| e.to_string())?.flatten().filter(|e| e.path().is_dir()) {
                let kname = kind.file_name().to_string_lossy().to_string();
                let mut stack = vec![(kind.path(), String::new())];
                while let Some((d, pre)) = stack.pop() {
                    for e in std::fs::read_dir(&d).into_iter().flatten().flatten() {
                        let p = e.path();
                        let name = e.file_name().to_string_lossy().to_string();
                        if p.is_dir() {
                            stack.push((p, format!("{pre}{name}/")));
                            continue;
                        }
                        let stem = name.rsplit_once('.').map(|(a, _)| a).unwrap_or(&name);
                        if !stems.contains(&format!("{pre}{stem}")) {
                            continue;
                        }
                        let dest = mine.join(sys).join(&kname).join(format!("{pre}{name}"));
                        if dest.exists() {
                            continue;
                        }
                        if same_file(&p, &dest).is_ok() {
                            n += 1;
                        }
                    }
                }
            }
            if n > 0 {
                systems += 1;
                files += n;
            }
        }
        core.log(format!("Box art: {files} files taken over from ES-DE ({})", src.display()));
        Ok(Imported { files, systems, from: src.to_string_lossy().into() })
    })
}

/// Let ES-DE use <main folder>/media for its game media (a copy of its settings is kept first).
#[tauri::command]
pub fn point_esde(core: tauri::State<Core>) -> Result<String, String> {
    let root = core.cfg.lock().unwrap().root.clone();
    let mine = Path::new(&root).join("media");
    std::fs::create_dir_all(&mine).map_err(|e| e.to_string())?;
    let p = esde_settings().ok_or("ES-DE's settings weren't found. Start ES-DE once, close it, and try again.")?;
    let t = std::fs::read_to_string(&p).map_err(|e| e.to_string())?;
    let line = format!("<string name=\"MediaDirectory\" value=\"{}\" />", mine.to_string_lossy().replace('&', "&amp;").replace('"', "&quot;"));
    let re = crate::re!(r#"<string name="MediaDirectory" value="[^"]*"\s*/>"#);
    let nt = if re.is_match(&t) {
        re.replace(&t, line.as_str()).to_string()
    } else if let Some(i) = t.rfind("</config>") {
        format!("{}{}\n{}", &t[..i], line, &t[i..])
    } else {
        format!("{}\n{}\n", t.trim_end(), line)
    };
    let b = p.with_extension("xml.emuvault-backup");
    if !b.exists() {
        let _ = std::fs::copy(&p, &b);
    }
    std::fs::write(&p, nt).map_err(|e| e.to_string())?;
    core.log(format!("ES-DE now uses {} for game media", mine.display()));
    Ok(mine.to_string_lossy().into())
}
