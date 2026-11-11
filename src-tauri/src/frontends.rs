//! "Show your games in a frontend": RetroArch playlists and ES-DE game lists from your library.
//! Existing lists are kept: only games that aren't in them yet are added, and a copy of the old
//! file is saved next to it first (.emuvault-backup).

use crate::Core;
use serde::Serialize;
use std::path::{Path, PathBuf};

fn home() -> PathBuf {
    dirs::home_dir().unwrap_or_default()
}

fn first_dir(cands: &[PathBuf]) -> Option<PathBuf> {
    cands.iter().find(|p| p.is_dir()).cloned()
}

fn esc(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

#[derive(Serialize)]
pub struct Written {
    systems: usize,
    added: usize,
    dir: String,
    /// true when the frontend's own folder wasn't found and the lists went into the main folder
    fallback: bool,
}

fn title_of(f: &crate::roms::RomFile) -> String {
    let base = if f.dat.is_empty() { f.name.rsplit_once('.').map(|(a, _)| a).unwrap_or(&f.name).to_string() } else { f.dat.clone() };
    crate::re!(r"\s*\((?:Disc|Disk|CD) \d+[^)]*\)").replace_all(&base, "").trim().to_string()
}

#[tauri::command]
pub async fn write_frontend(core: tauri::State<'_, Core>, kind: String) -> Result<Written, String> {
    let root = core.cfg.lock().unwrap().root.clone();
    let lib = core.lib.lock().unwrap().clone();
    let h = home();
    tokio::task::block_in_place(|| {
        let (dir, fallback) = match kind.as_str() {
            "ra" => match first_dir(&[h.join(".config/retroarch/playlists"), h.join(".var/app/org.libretro.RetroArch/config/retroarch/playlists")]) {
                Some(d) => (d, false),
                None => (Path::new(&root).join("frontends/retroarch/playlists"), true),
            },
            _ if core.cfg.lock().unwrap().esde_vault => (crate::esde::esde_dir(&core).join("gamelists"), false),
            _ => (crate::esde::esde_dir(&core).join("gamelists"), false),
        };
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        let mut systems = 0;
        let mut added = 0;
        let mut names: Vec<&String> = lib.keys().collect();
        names.sort();
        for sys in names {
            let files: Vec<&crate::roms::RomFile> = lib[sys].iter().filter(|f| f.check != "bad").collect();
            if files.is_empty() {
                continue;
            }
            // ES-DE only knows roms/<system>/ in the main folder; games in other folders go in RetroArch's playlists only
            let mine = format!("{}/roms/{sys}/", root.trim_end_matches('/'));
            let in_root: Vec<&crate::roms::RomFile> = files.iter().copied().filter(|f| f.path.starts_with(&mine)).collect();
            let n = if kind == "ra" { write_ra(&dir, sys, &files)? } else { write_esde(&dir, sys, &in_root)? };
            if n > 0 {
                systems += 1;
                added += n;
            }
        }
        core.log(format!(
            "{}: {added} games added in {systems} system{} ({})",
            if kind == "ra" { "RetroArch playlists" } else { "ES-DE game lists" },
            if systems == 1 { "" } else { "s" },
            dir.display()
        ));
        Ok(Written { systems, added, dir: dir.to_string_lossy().into(), fallback })
    })
}

/// ES-DE's game lists in ~/ES-DE/gamelists (made if needed); returns the number of systems written.
pub fn write_esde_lists(core: &Core) -> Result<usize, String> {
    let root = core.cfg.lock().unwrap().root.clone();
    let lib = core.lib.lock().unwrap().clone();
    let dir = crate::esde::esde_dir(core).join("gamelists");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut n = 0;
    for (sys, files) in &lib {
        let mine = format!("{}/roms/{sys}/", root.trim_end_matches('/'));
        let v: Vec<&crate::roms::RomFile> = files.iter().filter(|f| f.check != "bad" && f.path.starts_with(&mine)).collect();
        if v.is_empty() {
            continue;
        }
        write_esde(&dir, sys, &v)?;
        n += 1;
    }
    Ok(n)
}

fn backup(p: &Path) {
    if p.exists() {
        let b = p.with_extension(format!("{}.emuvault-backup", p.extension().map(|e| e.to_string_lossy().to_string()).unwrap_or_default()));
        if !b.exists() {
            let _ = std::fs::copy(p, b);
        }
    }
}

fn write_ra(dir: &Path, sys: &str, files: &[&crate::roms::RomFile]) -> Result<usize, String> {
    let db = crate::roms::db();
    let full = db.systems.get(sys).map(|s| s.full.clone()).filter(|s| !s.is_empty()).unwrap_or_else(|| sys.to_string());
    let p = dir.join(format!("{full}.lpl"));
    let mut doc: serde_json::Value = std::fs::read_to_string(&p).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_else(|| {
        serde_json::json!({ "version": "1.5", "default_core_path": "", "default_core_name": "", "label_display_mode": 0, "right_thumbnail_mode": 0, "left_thumbnail_mode": 0, "sort_mode": 0, "items": [] })
    });
    let items = doc.get_mut("items").and_then(|x| x.as_array_mut()).ok_or("That playlist file is damaged")?;
    let have: std::collections::HashSet<String> = items.iter().filter_map(|i| i.get("path").and_then(|x| x.as_str()).map(String::from)).collect();
    let mut n = 0;
    for f in files {
        if have.contains(&f.path) {
            continue;
        }
        items.push(serde_json::json!({ "path": f.path, "label": title_of(f), "core_path": "DETECT", "core_name": "DETECT", "crc32": if f.crc != 0 { format!("{:08X}|crc", f.crc) } else { "00000000|crc".into() }, "db_name": format!("{full}.lpl") }));
        n += 1;
    }
    if n > 0 {
        backup(&p);
        std::fs::write(&p, serde_json::to_string_pretty(&doc).unwrap()).map_err(|e| e.to_string())?;
    }
    Ok(n)
}

fn write_esde(dir: &Path, sys: &str, files: &[&crate::roms::RomFile]) -> Result<usize, String> {
    let p = dir.join(sys).join("gamelist.xml");
    let old = std::fs::read_to_string(&p).unwrap_or_default();
    let have: std::collections::HashSet<String> =
        crate::re!(r"<path>([^<]*)</path>").captures_iter(&old).map(|c| c[1].replace("&amp;", "&").replace("&apos;", "'")).collect();
    let mut add = String::new();
    let mut n = 0;
    for f in files {
        let rel = format!("./{}", f.rel);
        if have.contains(&rel) {
            continue;
        }
        add.push_str(&format!("\t<game>\n\t\t<path>{}</path>\n\t\t<name>{}</name>\n\t</game>\n", esc(&rel), esc(&title_of(f))));
        n += 1;
    }
    if n == 0 {
        return Ok(0);
    }
    std::fs::create_dir_all(p.parent().unwrap()).map_err(|e| e.to_string())?;
    backup(&p);
    let text = if let Some(i) = old.rfind("</gameList>") {
        format!("{}{}{}", &old[..i], add, &old[i..])
    } else {
        format!("<?xml version=\"1.0\"?>\n<gameList>\n{add}</gameList>\n")
    };
    std::fs::write(&p, text).map_err(|e| e.to_string())?;
    Ok(n)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn rf(name: &str) -> crate::roms::RomFile {
        crate::roms::RomFile {
            sys: "snes".into(),
            path: format!("/r/roms/snes/{name}"),
            rel: name.into(),
            name: name.into(),
            size: 1,
            dat: String::new(),
            check: "unknown".into(),
            p: Default::default(),
            crc: 0x1234abcd,
            parts: vec![],
        }
    }
    #[test]
    fn lists_keep_old_and_add_new() {
        let d = std::env::temp_dir().join(format!("evfe{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(d.join("snes")).unwrap();
        std::fs::write(d.join("snes/gamelist.xml"), "<?xml version=\"1.0\"?>\n<gameList>\n\t<game>\n\t\t<path>./A &amp; B (USA).sfc</path>\n\t\t<name>A</name>\n\t\t<favorite>true</favorite>\n\t</game>\n</gameList>\n").unwrap();
        let a = rf("A & B (USA).sfc");
        let b = rf("Chrono Trigger (USA) (Disc 1).sfc");
        assert_eq!(write_esde(&d, "snes", &[&a, &b]).unwrap(), 1);
        let t = std::fs::read_to_string(d.join("snes/gamelist.xml")).unwrap();
        assert!(t.contains("<favorite>true</favorite>") && t.contains("<name>Chrono Trigger (USA)</name>") && t.trim_end().ends_with("</gameList>"));
        assert!(d.join("snes/gamelist.xml.emuvault-backup").exists());
        assert_eq!(write_esde(&d, "snes", &[&a, &b]).unwrap(), 0);
        assert_eq!(write_ra(&d, "snes", &[&a, &b]).unwrap(), 2);
        assert_eq!(write_ra(&d, "snes", &[&a, &b]).unwrap(), 0);
        let lpl = std::fs::read_dir(&d).unwrap().flatten().find(|e| e.path().extension().map(|x| x == "lpl").unwrap_or(false)).unwrap().path();
        let v: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(&lpl).unwrap()).unwrap();
        assert_eq!(v["items"].as_array().unwrap().len(), 2);
        assert_eq!(v["items"][0]["crc32"], "1234ABCD|crc");
        println!("{}", lpl.display());
        let _ = std::fs::remove_dir_all(&d);
    }
}
