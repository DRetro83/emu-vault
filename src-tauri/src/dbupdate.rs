//! "Update the game lists": the newest No-Intro (cartridges) and Redump (discs) lists from libretro-database,
//! for the systems you have. Fingerprint checks use them after a restart; Collection uses them right away.

use crate::{roms, store, Core};
use serde::Serialize;
use std::collections::HashMap;
use tauri::Emitter;

fn dir() -> std::path::PathBuf {
    store::app_dir().join("lists")
}

const REG: &[(&str, &str)] = &[
    ("usa", "US"),
    ("europe", "EU"),
    ("japan", "JP"),
    ("world", "W"),
    ("germany", "EU"),
    ("france", "EU"),
    ("spain", "EU"),
    ("italy", "EU"),
    ("netherlands", "EU"),
    ("united kingdom", "EU"),
    ("uk", "EU"),
    ("australia", "EU"),
    ("sweden", "EU"),
    ("scandinavia", "EU"),
    ("canada", "US"),
    ("korea", "OV"),
    ("china", "OV"),
    ("asia", "OV"),
    ("brazil", "OV"),
    ("taiwan", "OV"),
    ("hong kong", "OV"),
    ("russia", "OV"),
];

fn bit(r: &str) -> u8 {
    match r {
        "US" => 1,
        "EU" => 2,
        "JP" => 4,
        "W" => 8,
        _ => 16,
    }
}

/// Same as the app's title key (ckey): "The Legend of Zelda" and "Legend of Zelda, The" are one game.
fn key_and_title(title: &str) -> (String, String) {
    let disp = crate::re!(r"(?i)^(.*?),\s*(The|A|An|Die|Der|Le|La|Les)\b(.*)$").replace(title, "$2 $1$3").trim().to_string();
    let mut k = disp.to_lowercase();
    k = k.replace('&', " and ").replace('+', " and ");
    k = crate::re!(r"[^a-z0-9]+").replace_all(&k, " ").to_string();
    k = crate::re!(r"\b(the|version|edition)\b").replace_all(&k, " ").to_string();
    (crate::re!(r"\s+").replace_all(&k, " ").trim().to_string(), disp)
}

/// One system's DAT -> (fingerprint lines, Collection list [[title, regions, kind]])
fn parse(txt: &str, disc: bool) -> (Vec<String>, Vec<(String, u8, u8)>) {
    let mut lines = vec![];
    let mut names = vec![];
    if disc {
        let mut seen = std::collections::HashSet::new();
        for c in crate::re!(r#"game \(\s*name "([^"]+)""#).captures_iter(txt) {
            let n = c[1].replace("&amp;", "&").replace("&apos;", "'");
            if seen.insert(n.clone()) {
                lines.push(format!("\t{n}"));
                names.push(n);
            }
        }
    } else {
        for c in crate::re!(r#"rom \( name "([^"]+)"(?: size \d+)?(?: crc ([0-9A-Fa-f]{8}))?"#).captures_iter(txt) {
            let n = c[1].rsplit_once('.').map(|(a, _)| a).unwrap_or(&c[1]).to_string();
            lines.push(format!("{}\t{n}", c.get(2).map(|m| m.as_str().to_uppercase()).unwrap_or_default()));
            names.push(n);
        }
    }
    let mut games: HashMap<String, (String, u8, u8, u8)> = HashMap::new();
    for name in names {
        if name.starts_with("[BIOS]") || name.contains("(Program)") || name.contains("(Test Program)") || name.contains("(Enhancement Chip)") {
            continue;
        }
        let tags: Vec<String> = crate::re!(r"\(([^)]*)\)").captures_iter(&name).map(|c| c[1].to_string()).collect();
        let title = crate::re!(r"\s*\([^)]*\)|\s*\[[^\]]*\]").replace_all(&name, "").trim().to_string();
        let mut regs = 0u8;
        for t in &tags {
            let parts: Vec<String> = t.split(',').map(|p| p.trim().to_lowercase()).collect();
            if parts.iter().all(|p| REG.iter().any(|(k, _)| k == p)) {
                for p in &parts {
                    regs |= bit(REG.iter().find(|(k, _)| k == p).unwrap().1);
                }
            }
        }
        let tl = tags.join(" ").to_lowercase();
        let cat = if crate::re!(r"\b(beta|proto|demo|sample|kiosk|promo|debug)\b").is_match(&tl) {
            2
        } else if crate::re!(r"\b(unl|pirate|aftermarket|homebrew)\b").is_match(&tl) {
            1
        } else {
            0
        };
        let (k, disp) = key_and_title(&title);
        if k.is_empty() {
            continue;
        }
        let rank = if regs & 1 != 0 {
            0
        } else if regs & 8 != 0 {
            1
        } else if regs & 2 != 0 {
            2
        } else {
            3
        };
        let g = games.entry(k).or_insert((disp.clone(), 0, cat, 99));
        g.1 |= regs;
        g.2 = g.2.min(cat);
        if cat == 0 && rank < g.3 {
            g.0 = disp;
            g.3 = rank;
        }
    }
    let mut list: Vec<(String, u8, u8)> = games.into_values().map(|g| (g.0, g.1, g.2)).collect();
    list.sort_by(|a, b| a.0.to_lowercase().cmp(&b.0.to_lowercase()));
    (lines, list)
}

#[derive(Serialize)]
pub struct Updated {
    systems: usize,
    failed: Vec<String>,
    when: String,
}

#[tauri::command]
pub async fn lists_update(app: tauri::AppHandle, core: tauri::State<'_, Core>) -> Result<Updated, String> {
    let mut ids: Vec<String> = core.lib.lock().unwrap().iter().filter(|(_, v)| !v.is_empty()).map(|(k, _)| k.clone()).collect();
    ids.sort();
    let db = roms::db();
    let base = std::env::var("EMUVAULT_LDB").unwrap_or_else(|_| "https://raw.githubusercontent.com/libretro/libretro-database/master/metadat/".into());
    std::fs::create_dir_all(dir()).map_err(|e| e.to_string())?;
    let (mut ok, mut failed) = (0, vec![]);
    let n = ids.len();
    for (i, id) in ids.iter().enumerate() {
        let _ = app.emit("lists-progress", (i, n, id.clone()));
        let Some(s) = db.systems.get(id) else { continue };
        if s.kind == "arcade" {
            continue;
        }
        let disc = s.kind == "disc";
        let mut u = url::Url::parse(&base).map_err(|e| e.to_string())?;
        u.path_segments_mut().map_err(|_| "bad url")?.pop_if_empty().push(if disc { "redump" } else { "no-intro" }).push(&format!("{}.dat", s.full));
        let res = core.client.get(u).header("User-Agent", "EmuVault/0.5").send().await;
        let txt = match res {
            Ok(r) if r.status().is_success() => r.text().await.unwrap_or_default(),
            Ok(r) => {
                failed.push(format!("{} ({})", s.full, r.status().as_u16()));
                continue;
            }
            Err(e) => return Err(format!("Network problem: {e}")),
        };
        let ver = crate::re!(r#"version "?([^"\n]+)"?"#).captures(&txt).map(|c| c[1].trim().to_string()).unwrap_or_default();
        let (lines, list) = parse(&txt, disc);
        if lines.is_empty() {
            failed.push(s.full.clone());
            continue;
        }
        let tsv = format!("@{id}\t{}\t{}\t{ver}\n{}\n", s.full, s.kind, lines.join("\n"));
        std::fs::write(dir().join(format!("{id}.tsv")), tsv).map_err(|e| e.to_string())?;
        let json: Vec<serde_json::Value> = list.into_iter().map(|(t, r, c)| serde_json::json!([t, r, c])).collect();
        std::fs::write(dir().join(format!("{id}.json")), serde_json::to_vec(&json).unwrap()).map_err(|e| e.to_string())?;
        ok += 1;
    }
    let when = store::now();
    let _ = std::fs::write(dir().join("updated.txt"), &when);
    let _ = app.emit("lists-progress", (n, n, String::new()));
    core.log(format!("Game lists updated for {ok} system{}", if ok == 1 { "" } else { "s" }));
    Ok(Updated { systems: ok, failed, when })
}

/// A newer Collection list for a system, if one was downloaded.
#[tauri::command]
pub fn list_override(sys: String) -> Option<String> {
    if sys.contains('/') || sys.contains("..") {
        return None;
    }
    std::fs::read_to_string(dir().join(format!("{sys}.json"))).ok()
}

#[tauri::command]
pub fn lists_info() -> String {
    std::fs::read_to_string(dir().join("updated.txt")).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parse_dats() {
        let nointro = r#"clrmamepro ( name "Nintendo - Super Nintendo Entertainment System" version 20261020 )
game ( name "Legend of Zelda, The - A Link to the Past (USA)" rom ( name "Legend of Zelda, The - A Link to the Past (USA).sfc" size 1048576 crc 777AAC2F ) )
game ( name "Zelda no Densetsu (Japan)" rom ( name "Zelda no Densetsu (Japan).sfc" size 1048576 crc 3322EFFC ) )
game ( name "Legend of Zelda, The - A Link to the Past (Europe) (Beta)" rom ( name "Legend of Zelda, The - A Link to the Past (Europe) (Beta).sfc" size 1048576 crc 11111111 ) )
"#;
        let (lines, list) = parse(nointro, false);
        assert_eq!(lines[0], "777AAC2F\tLegend of Zelda, The - A Link to the Past (USA)");
        let z = list.iter().find(|g| g.0.starts_with("The Legend of Zelda")).unwrap();
        assert_eq!((z.1, z.2), (1 | 2, 0));
        let redump = "game (\n\tname \"Final Fantasy VII (USA) (Disc 1)\"\n)\ngame (\n\tname \"Final Fantasy VII (USA) (Disc 2)\"\n)\n";
        let (l2, list2) = parse(redump, true);
        assert_eq!(l2.len(), 2);
        assert_eq!(list2.len(), 1);
    }
}
