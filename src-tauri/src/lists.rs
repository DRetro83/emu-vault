//! Game lists per system: regional names merged into one game (Retool clone lists),
//! and your own changes in `<root>/lists/<system>.txt` (hide / same / add).

use crate::roms::{self, title_key, ListGame};
use serde::Serialize;
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, Mutex, OnceLock};

pub const CLONES_GZ: &[u8] = include_bytes!("../data/clones.tsv.gz");

/// Per system: title key -> key of the game it belongs to, plus the names of each group.
pub struct Clones {
    pub alias: HashMap<String, HashMap<String, String>>,
}

pub fn clones() -> &'static Clones {
    static C: OnceLock<Clones> = OnceLock::new();
    C.get_or_init(|| {
        use std::io::Read;
        let mut text = String::new();
        let _ = flate2::read::GzDecoder::new(CLONES_GZ).read_to_string(&mut text);
        let mut alias: HashMap<String, HashMap<String, String>> = HashMap::new();
        let mut cur = String::new();
        for line in text.lines() {
            if let Some(s) = line.strip_prefix('@') {
                cur = s.to_string();
                continue;
            }
            let t: Vec<&str> = line.split('\t').collect();
            if t.len() < 2 || cur.is_empty() {
                continue;
            }
            // Retool's group names don't always follow No-Intro's current spelling
            // ("Megaman" vs "Mega Man"), so names are compared without spaces.
            let g = format!("={}", compact(&title_key(t[0])));
            let m = alias.entry(cur.clone()).or_default();
            for x in &t {
                let k = compact(&title_key(x));
                if !k.is_empty() {
                    m.entry(k).or_insert_with(|| g.clone());
                }
            }
        }
        Clones { alias }
    })
}

/// Number of regional names merged for a system.
pub fn merged_names(sys: &str) -> usize {
    clones().alias.get(sys).map(|m| m.iter().filter(|(k, v)| v[1..] != k[..]).count()).unwrap_or(0)
}

fn compact(k: &str) -> String {
    k.chars().filter(|c| *c != ' ').collect()
}

pub(crate) fn clone_key(sys: &str, key: &str) -> String {
    clones().alias.get(sys).and_then(|m| m.get(&compact(key))).cloned().unwrap_or_else(|| key.to_string())
}

// ------------------------------------------------------------------ your changes

#[derive(Debug, Default, Clone, Serialize)]
pub struct Edits {
    pub hide: Vec<String>,
    pub same: Vec<(String, String)>,
    pub add: Vec<(String, u8)>,
    /// line numbers that weren't understood
    pub bad: Vec<usize>,
}

pub fn parse_edits(txt: &str) -> Edits {
    let mut e = Edits::default();
    for (i, ln) in txt.lines().enumerate() {
        let l = ln.trim();
        if l.is_empty() || l.starts_with('#') {
            continue;
        }
        let Some((kind, v)) = l.split_once(':') else {
            e.bad.push(i + 1);
            continue;
        };
        let v = v.trim();
        match kind.trim().to_lowercase().as_str() {
            "hide" if !v.is_empty() => e.hide.push(v.to_string()),
            "same" => match v.split_once('=') {
                Some((a, b)) if !a.trim().is_empty() && !b.trim().is_empty() => e.same.push((a.trim().to_string(), b.trim().to_string())),
                _ => e.bad.push(i + 1),
            },
            "add" if !v.is_empty() => {
                let (t, regs) = match v.rfind('(') {
                    Some(p) if v.ends_with(')') => (v[..p].trim(), &v[p + 1..v.len() - 1]),
                    _ => (v, ""),
                };
                let bits = regs.split(',').fold(0u8, |a, r| {
                    a | match r.trim().to_lowercase().as_str() {
                        "usa" | "us" => 1,
                        "europe" | "eu" => 2,
                        "japan" | "jp" => 4,
                        "world" | "w" => 8,
                        "" => 0,
                        _ => 16,
                    }
                });
                e.add.push((t.to_string(), bits));
            }
            _ => e.bad.push(i + 1),
        }
    }
    e
}

static EDITS: OnceLock<Mutex<HashMap<String, String>>> = OnceLock::new();
fn edits_map() -> &'static Mutex<HashMap<String, String>> {
    EDITS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn edits_file(root: &str, sys: &str) -> std::path::PathBuf {
    Path::new(root).join("lists").join(format!("{sys}.txt"))
}

/// Read every lists/<system>.txt (at start and when the main folder changes).
pub fn load_edits(root: &str) {
    let mut m = HashMap::new();
    if let Ok(rd) = std::fs::read_dir(Path::new(root).join("lists")) {
        for e in rd.flatten() {
            let n = e.file_name().to_string_lossy().to_string();
            if let Some(sys) = n.strip_suffix(".txt") {
                if let Ok(t) = std::fs::read_to_string(e.path()) {
                    m.insert(sys.to_string(), t);
                }
            }
        }
    }
    *edits_map().lock().unwrap() = m;
}

pub fn edits_text(sys: &str) -> String {
    edits_map().lock().unwrap().get(sys).cloned().unwrap_or_default()
}

pub fn save_edits(root: &str, sys: &str, text: &str) -> std::io::Result<()> {
    let f = edits_file(root, sys);
    let t = text.trim();
    if t.is_empty() {
        let _ = std::fs::remove_file(&f);
        edits_map().lock().unwrap().remove(sys);
    } else {
        std::fs::create_dir_all(f.parent().unwrap())?;
        let body =
            format!("# Your changes to the {sys} list. One per line:\n#   hide: Game title\n#   same: Title A = Title B\n#   add: Game title (USA)\n{t}\n");
        std::fs::write(&f, body)?;
        edits_map().lock().unwrap().insert(sys.to_string(), std::fs::read_to_string(&f)?);
    }
    Ok(())
}

/// The key a file or list title counts under: regional names and your "same:" lines merged.
pub fn canon(sys: &str, key: &str) -> String {
    let (base, tail) = match key.find(" #") {
        Some(i) => (&key[..i], &key[i..]),
        None => (key, ""),
    };
    let k = clone_key(sys, base);
    let t = edits_text(sys);
    if t.is_empty() {
        return format!("{k}{tail}");
    }
    let e = parse_edits(&t);
    let mut k = k;
    for _ in 0..4 {
        let mut changed = false;
        for (a, b) in &e.same {
            if clone_key(sys, &title_key(a)) == k {
                let nb = clone_key(sys, &title_key(b));
                if nb != k {
                    k = nb;
                    changed = true;
                }
            }
        }
        if !changed {
            break;
        }
    }
    format!("{k}{tail}")
}

// ------------------------------------------------------------------ the list as you see it

#[derive(Debug, Clone, Serialize)]
pub struct Row {
    pub title: String,
    pub key: String,
    pub regions: u8,
    pub cat: u8,
    pub alts: Vec<String>,
    /// "" | "merged by you" | "added by you"
    pub mine: String,
}

pub struct UserList {
    pub rows: Vec<Row>,
    pub hidden: usize,
    pub merged: usize,
    pub added: usize,
    pub bad: Vec<usize>,
}

type Cache = Mutex<HashMap<String, (String, Arc<UserList>)>>;
static LCACHE: OnceLock<Cache> = OnceLock::new();

pub fn list_for(sys: &str) -> Arc<UserList> {
    let txt = edits_text(sys);
    let c = LCACHE.get_or_init(|| Mutex::new(HashMap::new()));
    if let Some((t, l)) = c.lock().unwrap().get(sys) {
        if *t == txt {
            return l.clone();
        }
    }
    let base: Arc<Vec<ListGame>> = roms::game_list(sys);
    let e = parse_edits(&txt);
    let mut by: HashMap<String, Row> = base
        .iter()
        .map(|g| (g.key.clone(), Row { title: g.title.clone(), key: g.key.clone(), regions: g.regions, cat: g.cat, alts: g.alts.clone(), mine: String::new() }))
        .collect();
    let find = |by: &HashMap<String, Row>, name: &str| -> Option<String> {
        let k = clone_key(sys, &title_key(name));
        by.contains_key(&k).then_some(k)
    };
    let mut merged = 0;
    for (a, b) in &e.same {
        let (Some(ka), Some(kb)) = (find(&by, a), find(&by, b)) else { continue };
        if ka == kb {
            continue;
        }
        let ra = by.remove(&ka).unwrap();
        let rb = by.get_mut(&kb).unwrap();
        rb.regions |= ra.regions;
        rb.cat = rb.cat.min(ra.cat);
        rb.alts.push(ra.title);
        rb.alts.extend(ra.alts);
        rb.mine = "merged by you".into();
        merged += 1;
    }
    let mut hidden = 0;
    for h in &e.hide {
        if let Some(k) = find(&by, h) {
            by.remove(&k);
            hidden += 1;
        }
    }
    let mut added = 0;
    for (t, r) in &e.add {
        let k = title_key(t);
        if k.is_empty() || by.contains_key(&clone_key(sys, &k)) {
            continue;
        }
        by.insert(k.clone(), Row { title: t.clone(), key: k, regions: *r, cat: 0, alts: vec![], mine: "added by you".into() });
        added += 1;
    }
    let mut rows: Vec<Row> = by.into_values().collect();
    rows.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    let l = Arc::new(UserList { rows, hidden, merged, added, bad: e.bad });
    c.lock().unwrap().insert(sys.to_string(), (txt, l.clone()));
    l
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn regional_names_count_once() {
        let l = roms::game_list("gba");
        let bn: Vec<_> = l.iter().filter(|g| g.title == "Mega Man - Battle Network" || g.title == "Battle Network - Rockman EXE").collect();
        assert_eq!(bn.len(), 1, "one game, two names");
        assert_eq!(bn[0].title, "Mega Man - Battle Network", "the USA name wins");
        assert!(bn[0].alts.iter().any(|a| a == "Battle Network - Rockman EXE"));
        assert_eq!(bn[0].regions & 5, 5, "USA and Japan");
        assert!(merged_names("snes") > 50);
        assert_eq!(canon("gba", &title_key("Mega Man - Battle Network")), canon("gba", &title_key("Battle Network - Rockman EXE")));
        let psx = roms::game_list("psx");
        assert!(psx.iter().any(|g| g.title.starts_with("Resident Evil") && g.alts.iter().any(|a| a.starts_with("Biohazard"))));
    }
    #[test]
    fn edits() {
        let e = parse_edits("# x\nhide: Pinball\nsame: A = B\nadd: My Game (USA, Europe)\nnonsense\nsame: broken");
        assert_eq!(e.hide, vec!["Pinball"]);
        assert_eq!(e.same, vec![("A".into(), "B".into())]);
        assert_eq!(e.add, vec![("My Game".into(), 3)]);
        assert_eq!(e.bad, vec![5, 6]);
    }
}
