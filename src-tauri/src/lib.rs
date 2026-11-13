mod bg;
mod biosimport;
mod biosref;
mod bundle;
mod catalog;
mod cmds;
mod convert;
mod dbupdate;
mod discs;
mod esde;
mod extras;
mod frontends;
mod gog;
mod journal;
mod library;
mod libretro;
mod lists;
mod media;
mod patch;
mod play;
mod ra;
mod retroarch;
mod roms;
mod saves;
mod selfupd;
mod setupcheck;
mod sources;
mod stick;
mod store;
mod ui2;
mod watch;

use catalog::AppDef;
use futures_util::StreamExt;
use serde::Serialize;
use sources::{HttpCache, Latest};
use std::collections::HashSet;
use std::sync::Mutex;
use store::{AppState, Config, State, Stored};
use tauri::{Emitter, Manager};

pub struct Core {
    pub(crate) cfg: Mutex<Config>,
    pub(crate) state: Mutex<State>,
    pub(crate) catalog: Mutex<Vec<AppDef>>,
    pub(crate) cache: HttpCache,
    pub(crate) md5: library::Md5Cache,
    pub(crate) client: reqwest::Client,
    pub(crate) busy: Mutex<HashSet<String>>,
    pub(crate) lib: Mutex<std::collections::HashMap<String, Vec<roms::RomFile>>>,
    pub(crate) lib_time: Mutex<String>,
    pub(crate) hashes: roms::HashCache,
    pub(crate) inbox: Mutex<Vec<roms::InboxItem>>,
}

fn load_catalog(cfg: &Config) -> (Vec<AppDef>, Vec<String>) {
    let mut apps = catalog::parse_pack(catalog::BUILTIN_PACK, catalog::BUILTIN_PACK_NAME).unwrap_or_default();
    apps.extend(catalog::parse_pack(catalog::PC_PACK, catalog::PC_PACK_NAME).unwrap_or_default());
    apps.extend(catalog::parse_pack(catalog::AWESOME_PACK, catalog::AWESOME_PACK_NAME).unwrap_or_default());
    let mut problems = vec![];
    for p in &cfg.packs {
        match std::fs::read_to_string(&p.file).map_err(|e| e.to_string()).and_then(|t| catalog::parse_pack(&t, &p.name)) {
            Ok(list) => {
                for a in list {
                    if !apps.iter().any(|x| x.id == a.id) {
                        apps.push(a);
                    }
                }
            }
            Err(e) => problems.push(format!("Pack {}: {e}", p.name)),
        }
    }
    for m in &cfg.my_apps {
        apps.retain(|a| a.id != m.id);
        apps.push(my_app_def(m));
    }
    (apps, problems)
}

pub const MY_PACK: &str = "My apps";

fn my_app_def(m: &store::MyApp) -> AppDef {
    AppDef {
        id: m.id.clone(),
        name: m.name.clone(),
        author: String::new(),
        url: m.url.clone(),
        source: if m.url.trim().is_empty() { "none".into() } else { catalog::detect_source(&m.url, "") },
        about: m.about.clone(),
        category: if m.category.is_empty() { "Other".into() } else { m.category.clone() },
        pack: MY_PACK.into(),
        rules: catalog::Rules { auto_arch: true, fallback_to_older: true, sort_by_date: true, ..Default::default() },
        linux_alt: None,
        win_alt: None,
        plats: m.plats.clone(),
        notes: m.notes.clone(),
        offers: vec![],
        systems: vec![],
        license: String::new(),
    }
}

impl Core {
    fn new() -> Self {
        let mut cfg = store::load_config();
        let state = store::load_state();
        let (apps, _) = load_catalog(&cfg);
        if !cfg.first_run_done && cfg.enabled.is_empty() {
            // start with the emulators and frontends switched on
            cfg.enabled = apps.iter().filter(|a| matches!(a.category.as_str(), "Emulator" | "Frontend" | "PC Emulation")).map(|a| a.id.clone()).collect();
        }
        if !cfg.pc_pack_added {
            // the PC/Linux emulators came in 0.2.4: follow them once
            for a in apps.iter().filter(|a| a.pack == catalog::PC_PACK_NAME) {
                if !cfg.enabled.contains(&a.id) {
                    cfg.enabled.push(a.id.clone());
                }
            }
            cfg.pc_pack_added = true;
            let _ = store::save_config(&cfg);
        }
        Core {
            cfg: Mutex::new(cfg),
            state: Mutex::new(state),
            catalog: Mutex::new(apps),
            cache: HttpCache::default(),
            md5: Default::default(),
            client: reqwest::Client::builder()
                .connect_timeout(std::time::Duration::from_secs(15))
                .timeout(std::time::Duration::from_secs(60 * 60))
                .build()
                .unwrap(),
            busy: Mutex::new(HashSet::new()),
            lib: Default::default(),
            lib_time: Default::default(),
            hashes: Mutex::new(cmds::load_hashes()),
            inbox: Default::default(),
        }
    }
    pub(crate) fn log(&self, msg: impl Into<String>) {
        let mut s = self.state.lock().unwrap();
        s.log.insert(0, (store::now(), msg.into()));
        s.log.truncate(300);
        let _ = store::save_state(&s);
    }
}

fn global_plats(c: &Config) -> Vec<&'static str> {
    if !c.plats_default.is_empty() {
        return ["linux", "linux@arm64", "windows", "windows@arm64", "android", "android@arm32", "macos"]
            .into_iter()
            .filter(|p| c.plats_default.iter().any(|x| x == p))
            .collect();
    }
    match c.platform.as_str() {
        "android" => vec!["android"],
        "linux" => vec!["linux"],
        _ => vec!["android", "linux"],
    }
}

/// The platforms followed for one app: your own choice for apps you added, else Settings.
fn plats_for(c: &Config, a: &AppDef) -> Vec<String> {
    if let Some(p) = c.app_plats.get(&a.id).filter(|p| !p.is_empty()) {
        return p.clone();
    }
    if !a.plats.is_empty() {
        return a.plats.clone();
    }
    let g: Vec<String> = global_plats(c).into_iter().map(String::from).collect();
    if a.offers.is_empty() {
        return g;
    }
    // a pack that says where the app exists: only those of your platforms
    let both: Vec<String> = g.iter().filter(|p| a.offers.iter().any(|o| o == p.split('@').next().unwrap_or(p))).cloned().collect();
    if both.is_empty() {
        vec![a.offers[0].clone()]
    } else {
        both
    }
}

/// Where an app exists: the pack says so, or (Obtainium pack) Android plus the built-in Linux/Windows sources.
fn offers_of(a: &AppDef) -> Vec<String> {
    if !a.offers.is_empty() {
        return a.offers.clone();
    }
    let mut v = vec![];
    if a.pack == catalog::BUILTIN_PACK_NAME {
        v.push("android".to_string());
    }
    if a.linux_alt.is_some() {
        v.push("linux".into());
    }
    if a.win_alt.is_some() {
        v.push("windows".into());
    }
    if v == ["android"] {
        vec![]
    } else {
        v
    }
}

/// Platforms (and other chips) the newest release has a file for.
fn avail_plats(latest: Option<&Latest>) -> Vec<String> {
    let Some(l) = latest else { return vec![] };
    let mut v: Vec<String> = sources::PLATS.iter().filter(|p| l.get(p).map(|x| x.asset.is_some()).unwrap_or(false)).map(|p| p.to_string()).collect();
    let mut ex: Vec<String> = l.extra.keys().cloned().collect();
    ex.sort();
    v.extend(ex);
    v
}

#[derive(Serialize)]
struct PlatView {
    plat: String,
    /// none | track | missing | update | ok
    status: String,
    latest: Option<sources::Pick>,
    note: String,
    stored: Vec<Stored>,
    /// more than one fitting file in the release: their names
    choices: Vec<sources::Asset>,
    /// what you chose before (words in the file name)
    prefer: String,
}

#[derive(Serialize)]
struct AppView {
    id: String,
    name: String,
    about: String,
    category: String,
    source: String,
    url: String,
    page: String,
    pack: String,
    track_only: bool,
    enabled: bool,
    checked: String,
    error: String,
    plats: Vec<PlatView>,
    busy: bool,
    mine: bool,
    notes: String,
    /// 0.10: what the newest release has ("linux", "windows@arm64"…), where the pack says it exists, what it plays
    avail: Vec<String>,
    offers: Vec<String>,
    systems: Vec<String>,
    license: String,
    /// 0.10.4: other files of the newest release, ("android~classic", "NetherSX2-Classic-….apk")
    variants: Vec<(String, String)>,
    /// 0.11: every file of the newest release you could keep: (key, file, bytes, version)
    release: Vec<(String, String, u64, String)>,
}

#[derive(Serialize)]
struct Overview {
    config: Config,
    apps: Vec<AppView>,
    last_check: String,
    free: u64,
    total: u64,
    machine: String,
    version: String,
    packs: Vec<(String, usize)>,
    log: Vec<(String, String)>,
    config_dir: String,
}

fn plat_view(cfg: &Config, a: &AppDef, latest: Option<&Latest>, plat: &str) -> PlatView {
    let stored = store::list_versions(&cfg.root, &a.name, plat);
    let pick = latest.and_then(|l| l.get(plat).cloned());
    let note = latest.map(|l| l.note(plat).to_string()).unwrap_or_default();
    let choices = latest.and_then(|l| l.choices.get(plat).cloned()).unwrap_or_default();
    let prefer = cfg.prefer.get(&format!("{}|{plat}", a.id)).cloned().unwrap_or_default();
    let status = match &pick {
        None => "none",
        Some(p) if p.asset.is_none() => "track",
        Some(p) => {
            if stored.is_empty() {
                "missing"
            } else if stored[0].version != p.version
                && !stored.iter().any(|s| s.version == p.version || p.asset.as_ref().map(|x| x.name == s.file).unwrap_or(false))
            {
                "update"
            } else {
                "ok"
            }
        }
    };
    PlatView { plat: plat.into(), status: status.into(), latest: pick, note, stored, choices, prefer }
}

fn overview(core: &Core) -> Overview {
    let cfg = core.cfg.lock().unwrap().clone();
    let st = core.state.lock().unwrap().clone();
    let busy = core.busy.lock().unwrap().clone();
    let cat = core.catalog.lock().unwrap().clone();
    let en: HashSet<&String> = cfg.enabled.iter().collect();
    let apps = cat
        .iter()
        .map(|a| {
            let s = st.apps.get(&a.id);
            let latest = s.and_then(|s| s.latest.as_ref());
            AppView {
                id: a.id.clone(),
                name: a.name.clone(),
                about: a.about.clone(),
                category: a.category.clone(),
                source: a.source.clone(),
                url: a.url.clone(),
                page: latest.map(|l| l.page.clone()).unwrap_or_else(|| a.url.clone()),
                pack: a.pack.clone(),
                track_only: a.rules.track_only,
                enabled: en.contains(&a.id),
                checked: s.map(|s| s.checked.clone()).unwrap_or_default(),
                error: s.map(|s| s.error.clone()).unwrap_or_default(),
                plats: plats_for(&cfg, a).iter().map(|p| plat_view(&cfg, a, latest, p)).collect(),
                busy: busy.contains(&a.id),
                mine: a.pack == MY_PACK,
                notes: a.notes.clone(),
                avail: avail_plats(latest),
                offers: offers_of(a),
                release: latest
                    .map(|l| {
                        let mut v: Vec<(String, String, u64, String)> = sources::PLATS
                            .iter()
                            .filter_map(|p| l.get(p).and_then(|x| x.asset.as_ref().map(|a| (p.to_string(), a.name.clone(), a.size, x.version.clone()))))
                            .collect();
                        let mut ex: Vec<_> =
                            l.extra.iter().filter_map(|(k, x)| x.asset.as_ref().map(|a| (k.clone(), a.name.clone(), a.size, x.version.clone()))).collect();
                        ex.sort();
                        v.extend(ex);
                        v
                    })
                    .unwrap_or_default(),
                variants: latest
                    .map(|l| {
                        let mut v: Vec<(String, String)> = l
                            .extra
                            .iter()
                            .filter(|(k, _)| k.contains('~'))
                            .filter_map(|(k, p)| p.asset.as_ref().map(|x| (k.clone(), x.name.clone())))
                            .collect();
                        v.sort();
                        v
                    })
                    .unwrap_or_default(),
                systems: a.systems.clone(),
                license: a.license.clone(),
            }
        })
        .collect();
    let (free, total) = store::free_space(&cfg.root).unwrap_or((0, 0));
    let mut packs: Vec<(String, usize)> = vec![];
    for a in &cat {
        match packs.iter_mut().find(|p| p.0 == a.pack) {
            Some(p) => p.1 += 1,
            None => packs.push((a.pack.clone(), 1)),
        }
    }
    Overview {
        config: Config { github_token: if cfg.github_token.is_empty() { String::new() } else { "••••••••".into() }, ..cfg },
        apps,
        last_check: st.last_check,
        free,
        total,
        machine: std::env::consts::ARCH.into(),
        version: env!("CARGO_PKG_VERSION").into(),
        packs,
        log: st.log.iter().take(80).cloned().collect(),
        config_dir: store::app_dir().to_string_lossy().into(),
    }
}

#[tauri::command]
fn get_overview(core: tauri::State<Core>) -> Overview {
    overview(&core)
}

#[tauri::command]
fn save_settings(core: tauri::State<Core>, mut cfg: Config) -> Result<Overview, String> {
    {
        let mut cur = core.cfg.lock().unwrap();
        if cfg.github_token == "••••••••" {
            cfg.github_token = cur.github_token.clone();
        }
        cfg.keep = cfg.keep.clamp(1, 10);
        cfg.enabled = cur.enabled.clone();
        cfg.packs = cur.packs.clone();
        cfg.pc_pack_added = cur.pc_pack_added;
        cfg.first_run_done = true;
        // these change through their own screens
        cfg.bg = cur.bg.clone();
        cfg.ra_user = cur.ra_user.clone();
        cfg.ra_key = cur.ra_key.clone();
        roms::set_extra(&cfg.extra_dirs);
        let keep_changed = cfg.keep < cur.keep;
        if cfg.root != cur.root {
            lists::load_edits(&cfg.root);
        }
        *cur = cfg;
        store::save_config(&cur)?;
        if keep_changed {
            let cat = core.catalog.lock().unwrap().clone();
            for a in &cat {
                for p in ["android", "linux"] {
                    for v in store::prune(&cur.root, &a.name, p, cur.keep) {
                        core.state.lock().unwrap().log.insert(0, (store::now(), format!("{} {v} removed (keep {})", a.name, cur.keep)));
                    }
                }
            }
        }
    }
    Ok(overview(&core))
}

#[tauri::command]
fn set_enabled(core: tauri::State<Core>, ids: Vec<String>, on: bool) -> Result<Overview, String> {
    {
        let mut c = core.cfg.lock().unwrap();
        for id in ids {
            c.enabled.retain(|x| x != &id);
            if on {
                c.enabled.push(id);
            }
        }
        c.first_run_done = true;
        store::save_config(&c)?;
    }
    Ok(overview(&core))
}

async fn check_one(core: &Core, a: &AppDef) -> Result<Latest, String> {
    let (token, arch, prefer) = {
        let c = core.cfg.lock().unwrap();
        (c.github_token.clone(), c.arch.clone(), c.prefer.clone())
    };
    if a.source == "none" {
        let mut l = Latest::default();
        l.note_android = "No link: add new versions yourself (drop the file on this app)".into();
        l.note_linux = l.note_android.clone();
        l.note_windows = l.note_android.clone();
        l.note_macos = l.note_android.clone();
        return Ok(l);
    }
    let mut a = a.clone();
    if a.source == "libretro" {
        a.rules.include_prereleases = core.cfg.lock().unwrap().ra_nightly;
    }
    for p in sources::PLATS
        .iter()
        .map(|p| p.to_string())
        .chain(["linux@arm64", "linux@x64", "windows@arm64", "windows@x64", "android@arm32", "android@arm64"].map(String::from))
    {
        if let Some(t) = prefer.get(&format!("{}|{p}", a.id)) {
            a.rules.prefer.insert(p.clone(), t.clone());
        }
    }
    let a = &a;
    let api = std::env::var("EMUVAULT_API").ok();
    let ctx = sources::Ctx { client: &core.client, github_token: &token, arch: &arch, cache: &core.cache, api_base: api.as_deref() };
    let mut l = sources::check(&ctx, a, std::env::consts::ARCH).await?;
    keep_what_you_have(core, a, &mut l);
    Ok(l)
}

/// 0.10.4: a release with two files that fit (Classic and normal build): the main one is the file you
/// already keep, so the other one shows as "also in this release" and not the other way round.
fn keep_what_you_have(core: &Core, a: &AppDef, l: &mut Latest) {
    let root = core.cfg.lock().unwrap().root.clone();
    for plat in sources::PLATS {
        let Some(ch) = l.choices.get(plat).cloned() else { continue };
        let Some(main) = l.get(plat).and_then(|p| p.asset.clone()) else { continue };
        let have = store::list_versions(&root, &a.name, plat).into_iter().map(|s| s.file).find(|f| ch.iter().any(|c| &c.name == f));
        let Some(have) = have.filter(|h| *h != main.name) else { continue };
        let names: Vec<String> = ch.iter().map(|c| c.name.clone()).collect();
        let Some(asset) = ch.iter().find(|c| c.name == have).cloned() else { continue };
        // the main file becomes a variant, the one you have becomes the main file
        l.extra.retain(|k, v| !(k.starts_with(&format!("{plat}~")) && v.asset.as_ref().map(|x| x.name == have).unwrap_or(false)));
        if let Some(p) = l.get(plat).cloned() {
            l.extra.insert(sources::variant_key(plat, &main.name, &names), sources::Pick { asset: Some(main.clone()), ..p });
        }
        let tok = sources::distinct_token(&have, &names);
        let p = match plat {
            "android" => l.android.as_mut(),
            "linux" => l.linux.as_mut(),
            "windows" => l.windows.as_mut(),
            _ => l.macos.as_mut(),
        };
        if let Some(p) = p {
            p.asset = Some(asset);
        }
        let mut c = core.cfg.lock().unwrap();
        c.prefer.insert(format!("{}|{plat}", a.id), tok);
        let _ = store::save_config(&c);
    }
}

#[tauri::command]
async fn check_apps(app: tauri::AppHandle, core: tauri::State<'_, Core>, ids: Option<Vec<String>>) -> Result<Overview, String> {
    let list: Vec<AppDef> = {
        let c = core.cfg.lock().unwrap();
        let want: HashSet<String> = ids.unwrap_or_else(|| c.enabled.clone()).into_iter().collect();
        core.catalog.lock().unwrap().iter().filter(|a| want.contains(&a.id)).cloned().collect()
    };
    let total = list.len();
    let core_ref: &Core = &core;
    let mut done = 0usize;
    let mut found = 0usize;
    let mut failed = 0usize;
    let futs: Vec<_> = list
        .into_iter()
        .map(|a| async move {
            let r = check_one(core_ref, &a).await;
            (a, r)
        })
        .collect();
    let mut stream = futures_util::stream::iter(futs).buffer_unordered(4);
    while let Some((a, res)) = stream.next().await {
        done += 1;
        let mut st = core.state.lock().unwrap();
        let e = st.apps.entry(a.id.clone()).or_insert_with(AppState::default);
        e.checked = store::now();
        match res {
            Ok(l) => {
                e.latest = Some(l);
                e.error.clear();
                found += 1;
            }
            Err(err) => {
                e.error = err;
                failed += 1;
            }
        }
        drop(st);
        let _ = app.emit("check-progress", (done, total, a.name.clone()));
    }
    {
        let mut st = core.state.lock().unwrap();
        st.last_check = store::now();
        let _ = store::save_state(&st);
    }
    let ov = overview(&core);
    let ups = ov.apps.iter().filter(|a| a.enabled && a.plats.iter().any(|p| p.status == "update")).count();
    core.log(format!(
        "Checked {total} app{}: {ups} update{} available{}",
        if total == 1 { "" } else { "s" },
        if ups == 1 { "" } else { "s" },
        if failed > 0 { format!(", {failed} couldn't be checked") } else { String::new() }
    ));
    let _ = found;
    Ok(overview(&core))
}

/// Check the apps you use, without a window. Returns "<app>|<platform>|<version>" for every update.
pub(crate) async fn check_enabled_quiet(core: &Core) -> Vec<String> {
    let list: Vec<AppDef> = {
        let c = core.cfg.lock().unwrap();
        let want: HashSet<String> = c.enabled.iter().cloned().collect();
        core.catalog.lock().unwrap().iter().filter(|a| want.contains(&a.id)).cloned().collect()
    };
    let futs: Vec<_> = list
        .into_iter()
        .map(|a| async move {
            let r = check_one(core, &a).await;
            (a, r)
        })
        .collect();
    let mut stream = futures_util::stream::iter(futs).buffer_unordered(4);
    while let Some((a, res)) = stream.next().await {
        let mut st = core.state.lock().unwrap();
        let e = st.apps.entry(a.id.clone()).or_insert_with(AppState::default);
        e.checked = store::now();
        match res {
            Ok(l) => {
                e.latest = Some(l);
                e.error.clear();
            }
            Err(err) => e.error = err,
        }
    }
    {
        let mut st = core.state.lock().unwrap();
        st.last_check = store::now();
        let _ = store::save_state(&st);
    }
    let ov = overview(core);
    ov.apps
        .iter()
        .filter(|a| a.enabled)
        .flat_map(|a| {
            a.plats
                .iter()
                .filter(|p| p.status == "update")
                .map(move |p| format!("{}|{}|{}", a.id, p.plat, p.latest.as_ref().map(|l| l.version.clone()).unwrap_or_default()))
        })
        .collect()
}

/// The name of an app in the list (its folder in Apps/)
pub(crate) fn overview_name(core: &Core, id: &str) -> Option<String> {
    core.catalog.lock().unwrap().iter().find(|a| a.id == id).map(|a| a.name.clone())
}
pub(crate) struct EsdeApp {
    pub esde_appimage: Option<String>,
    pub esde_version: String,
    /// a newer version Emu Vault found, if any
    pub esde_update: String,
}
/// ES-DE as downloaded by Emu Vault (the "ES-DE (PC)" app): its newest stored AppImage
pub(crate) fn overview_pub(core: &Core) -> EsdeApp {
    let ov = overview(core);
    let a = ov.apps.iter().find(|a| a.id == "pc.esde");
    let s = a
        .and_then(|a| a.plats.iter().find(|p| p.plat == "linux"))
        .and_then(|p| p.stored.iter().find(|s| s.file.to_lowercase().ends_with(".appimage") && std::path::Path::new(&s.path).is_file()));
    let up = a
        .and_then(|a| a.plats.iter().find(|p| p.plat == "linux"))
        .filter(|p| p.status == "update")
        .and_then(|p| p.latest.as_ref())
        .map(|l| l.version.clone())
        .unwrap_or_default();
    EsdeApp { esde_appimage: s.map(|s| s.path.clone()), esde_version: s.map(|s| s.version.clone()).unwrap_or_default(), esde_update: up }
}

/// For every app: (id, newest stored Linux AppImage)
pub(crate) fn overview_any(core: &Core) -> Vec<(String, Option<String>)> {
    overview(core)
        .apps
        .iter()
        .map(|a| {
            let p = a
                .plats
                .iter()
                .find(|p| p.plat == "linux")
                .and_then(|p| p.stored.iter().find(|s| s.file.to_lowercase().ends_with(".appimage") && std::path::Path::new(&s.path).is_file()))
                .map(|s| s.path.clone());
            (a.id.clone(), p)
        })
        .collect()
}

/// `emu-vault --background`: the checks from the systemd timer, without a window.
pub fn background() -> i32 {
    bg::run_background()
}

#[derive(Clone, Serialize)]
struct DlProgress {
    id: String,
    plat: String,
    got: u64,
    total: u64,
}

async fn download_one(app: &tauri::AppHandle, core: &Core, id: &str, plat: &str) -> Result<String, String> {
    let a = core.catalog.lock().unwrap().iter().find(|a| a.id == id).cloned().ok_or("Unknown app")?;
    let pick = {
        let st = core.state.lock().unwrap();
        let l = st.apps.get(id).and_then(|s| s.latest.clone()).ok_or("Check for updates first.")?;
        l.get(plat).cloned().ok_or(format!("There is no {} version of this app.", sources::plat_name(plat)))?
    };
    let (root, keep) = {
        let c = core.cfg.lock().unwrap();
        (c.root.clone(), c.keep)
    };
    {
        let mut b = core.busy.lock().unwrap();
        if !b.insert(id.to_string()) {
            return Err(format!("{} is already downloading.", a.name));
        }
    }
    let h = app.clone();
    let (idc, pc) = (id.to_string(), plat.to_string());
    let res = store::download(&core.client, &root, &a.name, plat, &pick, keep, &a.rules.headers, move |got, total| {
        let _ = h.emit("dl-progress", DlProgress { id: idc.clone(), plat: pc.clone(), got, total });
    })
    .await;
    core.busy.lock().unwrap().remove(id);
    let (stored, gone) = res?;
    let mut msg = format!("{} {} downloaded for {} ({} MB)", a.name, stored.version, sources::plat_name(plat), stored.size / 1_048_576);
    if !gone.is_empty() {
        msg.push_str(&format!("; removed old {}", gone.join(", ")));
    }
    core.log(msg.clone());
    Ok(msg)
}

#[tauri::command]
async fn download_app(app: tauri::AppHandle, core: tauri::State<'_, Core>, id: String, plat: String) -> Result<Overview, String> {
    match download_one(&app, &core, &id, &plat).await {
        Ok(_) => Ok(overview(&core)),
        Err(e) => {
            core.log(format!("Download failed: {e}"));
            Err(e)
        }
    }
}

#[tauri::command]
async fn update_all(app: tauri::AppHandle, core: tauri::State<'_, Core>) -> Result<(Overview, Vec<String>), String> {
    let todo: Vec<(String, String)> = overview(&core)
        .apps
        .iter()
        .filter(|a| a.enabled)
        .flat_map(|a| a.plats.iter().filter(|p| p.status == "update" || p.status == "missing").map(move |p| (a.id.clone(), p.plat.clone())))
        .collect();
    let mut errors = vec![];
    let n = todo.len();
    for (i, (id, plat)) in todo.into_iter().enumerate() {
        let name = core.catalog.lock().unwrap().iter().find(|a| a.id == id).map(|a| a.name.clone()).unwrap_or_default();
        let _ = app.emit("update-progress", (i + 1, n, name.clone(), plat.clone(), id.clone()));
        if let Err(e) = download_one(&app, &core, &id, &plat).await {
            let msg = format!("{name} ({}): {e}", sources::plat_name(&plat));
            core.log(format!("Download failed: {msg}"));
            errors.push(msg);
        }
    }
    let _ = app.emit("update-progress", (n, n, String::new(), String::new(), String::new()));
    Ok((overview(&core), errors))
}

fn reload_catalog(core: &Core) {
    let c = core.cfg.lock().unwrap().clone();
    *core.catalog.lock().unwrap() = load_catalog(&c).0;
}

/// Add or change an app of your own. It's followed straight away.
#[tauri::command]
fn save_my_app(core: tauri::State<Core>, mut app: store::MyApp) -> Result<Overview, String> {
    app.name = app.name.trim().to_string();
    app.url = app.url.trim().to_string();
    if app.name.is_empty() {
        return Err("Give the app a name.".into());
    }
    if app.plats.is_empty() {
        return Err("Tick at least one platform.".into());
    }
    if !app.url.is_empty() && !app.url.starts_with("http") {
        return Err("The link should start with https://".into());
    }
    {
        let mut c = core.cfg.lock().unwrap();
        if app.id.is_empty() {
            let base =
                format!("my-{}", app.name.to_lowercase().chars().map(|ch| if ch.is_alphanumeric() { ch } else { '-' }).collect::<String>().trim_matches('-'));
            let mut id = base.clone();
            let mut i = 2;
            while c.my_apps.iter().any(|m| m.id == id) {
                id = format!("{base}-{i}");
                i += 1;
            }
            app.id = id;
        }
        let new = !c.my_apps.iter().any(|m| m.id == app.id);
        if let Some(m) = c.my_apps.iter_mut().find(|m| m.id == app.id) {
            if m.url != app.url {
                core.state.lock().unwrap().apps.remove(&app.id);
            }
            *m = app.clone();
        } else {
            c.my_apps.push(app.clone());
        }
        if !c.enabled.contains(&app.id) {
            c.enabled.push(app.id.clone());
        }
        store::save_config(&c)?;
        drop(c);
        core.log(format!("{} {}", if new { "Added your app" } else { "Changed your app" }, app.name));
    }
    reload_catalog(&core);
    Ok(overview(&core))
}

/// Remove an app you added. Its downloaded files stay in Apps/.
#[tauri::command]
fn remove_my_app(core: tauri::State<Core>, id: String) -> Result<Overview, String> {
    {
        let mut c = core.cfg.lock().unwrap();
        let name = c.my_apps.iter().find(|m| m.id == id).map(|m| m.name.clone()).unwrap_or_default();
        c.my_apps.retain(|m| m.id != id);
        c.enabled.retain(|e| e != &id);
        c.prefer.retain(|k, _| !k.starts_with(&format!("{id}|")));
        store::save_config(&c)?;
        drop(c);
        core.log(format!("Removed your app {name}. Its files stay in the Apps folder."));
    }
    reload_catalog(&core);
    Ok(overview(&core))
}

/// A release has several fitting files: remember which one you want (by the words that set it apart).
#[tauri::command]
fn set_prefer(core: tauri::State<Core>, id: String, plat: String, file: String) -> Result<Overview, String> {
    let others: Vec<String> = core
        .state
        .lock()
        .unwrap()
        .apps
        .get(&id)
        .and_then(|s| s.latest.as_ref())
        .and_then(|l| l.choices.get(&plat).cloned())
        .unwrap_or_default()
        .into_iter()
        .map(|a| a.name)
        .collect();
    let tok = sources::distinct_token(&file, &others);
    {
        let mut c = core.cfg.lock().unwrap();
        c.prefer.insert(format!("{id}|{plat}"), tok);
        store::save_config(&c)?;
    }
    // choose again from what was found, without asking the server
    {
        let mut st = core.state.lock().unwrap();
        if let Some(l) = st.apps.get_mut(&id).and_then(|s| s.latest.as_mut()) {
            if let Some(chosen) = l.choices.get(&plat).and_then(|v| v.iter().find(|x| x.name == file)).cloned() {
                let found = match plat.as_str() {
                    p if p.contains('@') || p.contains('~') => l.extra.get_mut(p),
                    "android" => l.android.as_mut(),
                    "linux" => l.linux.as_mut(),
                    "windows" => l.windows.as_mut(),
                    _ => l.macos.as_mut(),
                };
                if let Some(p) = found {
                    p.asset = Some(chosen);
                }
            }
        }
        let _ = store::save_state(&st);
    }
    Ok(overview(&core))
}

/// 0.11: RetroArch extras from libretro (assets/frontend and assets/system).
#[tauri::command]
async fn ra_extras_list(core: tauri::State<'_, Core>) -> Result<Vec<libretro::Extra>, String> {
    libretro::extras_list(&core).await
}
#[tauri::command]
async fn ra_extras_get(core: tauri::State<'_, Core>, names: Vec<String>, keep: Vec<String>) -> Result<String, String> {
    libretro::extras_get(&core, names, keep).await
}
/// 0.11: RetroArch stable or nightly. The next check shows the other channel's newest file.
#[tauri::command]
fn ra_channel(core: tauri::State<Core>, nightly: bool) -> Result<Overview, String> {
    {
        let mut c = core.cfg.lock().unwrap();
        c.ra_nightly = nightly;
        store::save_config(&c)?;
    }
    core.log(format!("RetroArch: {} builds", if nightly { "nightly" } else { "stable" }));
    Ok(overview(&core))
}

/// 0.10: the platforms (and other chips) you keep for one app. Makes their folders straight away.
#[tauri::command]
fn set_app_plats(core: tauri::State<Core>, id: String, plats: Vec<String>) -> Result<Overview, String> {
    let ok = |p: &str| {
        if let Some((b, v)) = p.split_once('~') {
            return sources::PLATS.contains(&b) && !v.is_empty() && v.chars().all(|c| c.is_ascii_alphanumeric() || c == '-');
        }
        let (b, chip) = p.split_once('@').unwrap_or((p, ""));
        sources::PLATS.contains(&b) && (chip.is_empty() || ["x64", "arm64", "arm32"].contains(&chip))
    };
    if let Some(bad) = plats.iter().find(|p| !ok(p)) {
        return Err(format!("Unknown platform: {bad}"));
    }
    let mut plats: Vec<String> = plats;
    plats.dedup();
    // 0.13: another chip may be kept on its own (Linux ARM only); another file of a release needs its platform
    let base: Vec<String> = plats.iter().filter(|p| !p.contains('@') && !p.contains('~')).cloned().collect();
    plats.retain(|p| p.split_once('~').map(|(b, _)| base.iter().any(|x| x == b)).unwrap_or(true));
    let a = core.catalog.lock().unwrap().iter().find(|a| a.id == id).cloned().ok_or("Unknown app")?;
    let root = {
        let mut c = core.cfg.lock().unwrap();
        if a.pack == MY_PACK {
            if let Some(m) = c.my_apps.iter_mut().find(|m| m.id == id) {
                m.plats = plats.clone();
            }
            c.app_plats.remove(&id);
        } else if plats.is_empty() {
            c.app_plats.remove(&id);
        } else {
            c.app_plats.insert(id.clone(), plats.clone());
        }
        store::save_config(&c)?;
        c.root.clone()
    };
    if a.pack == MY_PACK {
        reload_catalog(&core);
    }
    for p in &plats {
        let _ = std::fs::create_dir_all(store::versions_dir(&root, &a.name, p));
    }
    core.log(format!(
        "{}: keeping {}",
        a.name,
        if plats.is_empty() { "the platforms from Settings".to_string() } else { plats.iter().map(|p| store::plat_folder(p)).collect::<Vec<_>>().join(", ") }
    ));
    Ok(overview(&core))
}

/// A file you downloaded yourself, kept as a version of an app.
#[tauri::command]
fn app_add_file(core: tauri::State<Core>, id: String, plat: String, path: String, ver: Option<String>) -> Result<Overview, String> {
    let a = core.catalog.lock().unwrap().iter().find(|a| a.id == id).cloned().ok_or("Unknown app")?;
    let src = std::path::Path::new(&path);
    let file = src.file_name().ok_or("Not a file")?.to_string_lossy().to_string();
    if !src.is_file() {
        return Err("Only single files can be added to an app.".into());
    }
    let latest = core.state.lock().unwrap().apps.get(&id).and_then(|s| s.latest.as_ref()).and_then(|l| l.get(&plat).cloned());
    let ver = match &latest {
        _ if ver.as_deref().map(|v| !v.trim().is_empty() && v.trim() != "?").unwrap_or(false) => ver.clone().unwrap().trim().to_string(),
        Some(p) if p.asset.as_ref().map(|x| x.name == file).unwrap_or(false) => p.version.clone(),
        _ => crate::re!(r"(?i)(?:^|[^a-z0-9])v?(\d+(?:\.\d+){1,3})")
            .captures(&file)
            .map(|c| c[1].to_string())
            .or_else(|| latest.as_ref().map(|p| p.version.clone()))
            .unwrap_or_else(|| format!("added {}", &store::now()[..10])),
    };
    let (root, keep) = {
        let c = core.cfg.lock().unwrap();
        (c.root.clone(), c.keep)
    };
    let dir = store::versions_dir(&root, &a.name, &plat).join(store::safe(&ver));
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let to = dir.join(&file);
    std::fs::copy(src, &to).map_err(|e| format!("Couldn't copy {file}: {e}"))?;
    let sha = {
        use sha2::{Digest, Sha256};
        let mut h = Sha256::new();
        if let Ok(mut f) = std::fs::File::open(&to) {
            let _ = std::io::copy(&mut f, &mut h);
        }
        hex::encode(h.finalize())
    };
    let size = to.metadata().map(|m| m.len()).unwrap_or(0);
    store::write_json(
        &dir.join(store::META),
        &Stored {
            version: ver.clone(),
            date: String::new(),
            file: file.clone(),
            path: String::new(),
            size,
            sha256: sha,
            url: String::new(),
            downloaded: store::now(),
            hand: false,
        },
    )?;
    let gone = store::prune(&root, &a.name, &plat, keep);
    core.log(format!(
        "{} {ver} added for {} from {file}{}",
        a.name,
        sources::plat_name(&plat),
        if gone.is_empty() { String::new() } else { format!("; removed old {}", gone.join(", ")) }
    ));
    Ok(overview(&core))
}

#[tauri::command]
fn delete_version(core: tauri::State<Core>, path: String) -> Result<Overview, String> {
    let root = core.cfg.lock().unwrap().root.clone();
    let p = std::path::Path::new(&path);
    let dir = p.parent().ok_or("Bad path")?;
    if !dir.starts_with(std::path::Path::new(&root).join("Apps")) {
        return Err("That file isn't in the Apps folder, so it isn't deleted.".into());
    }
    if dir.join(store::META).exists() {
        // a version folder the vault made itself
        std::fs::remove_dir_all(dir).map_err(|e| e.to_string())?;
    } else if p.is_file() {
        // a file you put there yourself: only that file (and its folder, if that is empty now)
        std::fs::remove_file(p).map_err(|e| e.to_string())?;
        let _ = std::fs::remove_dir(dir);
    } else {
        return Err("Nothing to delete there.".into());
    }
    core.log(format!("Deleted {}", p.file_name().map(|f| f.to_string_lossy().to_string()).unwrap_or_default()));
    Ok(overview(&core))
}

/// Start a desktop program (file manager, browser) without the settings of Emu Vault's own
/// bundled libraries (the .sh / AppImage version sets those, and they break other programs).
/// Windows: a feature that still needs Linux says so, instead of failing on a missing program.
pub(crate) fn linux_only(what: &str) -> Result<(), String> {
    if cfg!(windows) {
        return Err(format!("{what} doesn't work on Windows yet. It comes in a later version of Emu Vault for Windows."));
    }
    Ok(())
}

pub(crate) fn desktop_cmd(prog: &str) -> std::process::Command {
    let mut c = std::process::Command::new(prog);
    let appdir = std::env::var("APPDIR").unwrap_or_default();
    for v in [
        "APPDIR",
        "APPIMAGE",
        "ARGV0",
        "OWD",
        "GTK_DATA_PREFIX",
        "GTK_THEME",
        "GSETTINGS_SCHEMA_DIR",
        "GI_TYPELIB_PATH",
        "GIO_MODULE_DIR",
        "GTK_EXE_PREFIX",
        "GTK_PATH",
        "GTK_IM_MODULE_FILE",
        "GDK_PIXBUF_MODULE_FILE",
        "LD_LIBRARY_PATH",
        "LD_PRELOAD",
        "PYTHONHOME",
        "PYTHONPATH",
        "PERLLIB",
        "QT_PLUGIN_PATH",
        "GST_PLUGIN_SYSTEM_PATH",
        "GST_PLUGIN_PATH",
        "WEBKIT_EXEC_PATH",
    ] {
        c.env_remove(v);
    }
    if !appdir.is_empty() {
        let clean =
            |var: &str| std::env::var(var).unwrap_or_default().split(':').filter(|p| !p.is_empty() && !p.starts_with(&appdir)).collect::<Vec<_>>().join(":");
        for var in ["XDG_DATA_DIRS", "PATH"] {
            let v = clean(var);
            if v.is_empty() {
                c.env_remove(var);
            } else {
                c.env(var, v);
            }
        }
    }
    c.stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null());
    c
}

fn file_uri(p: &std::path::Path) -> String {
    url::Url::from_file_path(p).map(|u| u.to_string()).unwrap_or_else(|_| format!("file://{}", p.display()))
}

/// Show a folder (or a file, selected) in the file manager.
fn reveal(p: &std::path::Path) -> Result<(), String> {
    let (method, arg) = if p.is_file() { ("ShowItems", file_uri(p)) } else { ("ShowFolders", file_uri(p)) };
    // 1. the file manager's own "show this" (Dolphin, Nautilus, Nemo, Thunar…), selects the file too
    let ok = desktop_cmd("dbus-send")
        .args([
            "--session",
            "--print-reply",
            "--reply-timeout=2000",
            "--dest=org.freedesktop.FileManager1",
            "--type=method_call",
            "/org/freedesktop/FileManager1",
            &format!("org.freedesktop.FileManager1.{method}"),
            &format!("array:string:{arg}"),
            "string:",
        ])
        .status()
        .map(|s| s.success())
        .unwrap_or(false);
    if ok {
        return Ok(());
    }
    // 2. the usual "open this folder"
    let dir = if p.is_file() { p.parent().unwrap_or(p) } else { p };
    for prog in ["xdg-open", "gio", "kde-open", "kde-open5"] {
        let mut c = desktop_cmd(prog);
        if prog == "gio" {
            c.arg("open");
        }
        if let Ok(mut ch) = c.arg(dir).spawn() {
            std::thread::spawn(move || {
                let _ = ch.wait();
            });
            return Ok(());
        }
    }
    Err(format!("Couldn't open a file manager. The folder is {}", dir.display()))
}

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    let mut p = std::path::PathBuf::from(&path);
    while !p.exists() {
        p = p.parent().ok_or("That folder doesn't exist yet.")?.to_path_buf();
    }
    reveal(&p)
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("Only web links can be opened.".into());
    }
    for prog in ["xdg-open", "gio", "kde-open"] {
        let mut c = desktop_cmd(prog);
        if prog == "gio" {
            c.arg("open");
        }
        if let Ok(mut ch) = c.arg(&url).spawn() {
            std::thread::spawn(move || {
                let _ = ch.wait();
            });
            return Ok(());
        }
    }
    Err(format!("Couldn't open a browser. The link is {url}"))
}

#[tauri::command]
fn get_folders(core: tauri::State<Core>) -> Vec<library::FolderInfo> {
    let root = core.cfg.lock().unwrap().root.clone();
    library::folders(&root)
}

#[tauri::command]
fn make_folders(core: tauri::State<Core>) -> Result<usize, String> {
    let root = core.cfg.lock().unwrap().root.clone();
    let n = library::make_folders(&root)?;
    core.log(format!("Folders made in {root}: {n} new"));
    Ok(n)
}

#[tauri::command]
async fn get_bios(core: tauri::State<'_, Core>) -> Result<Vec<library::BiosSystem>, String> {
    let root = core.cfg.lock().unwrap().root.clone();
    let c: &Core = &core;
    // md5 of big files can take a moment: keep the window responsive
    Ok(tokio::task::block_in_place(|| library::bios_status(&root, &c.md5)))
}

#[tauri::command]
async fn collect_bios(core: tauri::State<'_, Core>, from: String) -> Result<library::Collected, String> {
    let root = core.cfg.lock().unwrap().root.clone();
    let c: &Core = &core;
    let r = tokio::task::block_in_place(|| library::collect_bios(&root, &from, &c.md5))?;
    core.log(format!("BIOS search in {from}: {} file(s) copied, {} already there", r.copied.len(), r.already));
    Ok(r)
}

#[tauri::command]
fn add_pack(core: tauri::State<Core>, path: String) -> Result<Overview, String> {
    let text = std::fs::read_to_string(&path).map_err(|e| format!("Can't read the file: {e}"))?;
    let stem = std::path::Path::new(&path).file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or("Pack".into());
    let apps = catalog::parse_pack(&text, &stem)?;
    let dest = store::app_dir().join("packs").join(format!("{}.json", store::safe(&stem)));
    std::fs::create_dir_all(dest.parent().unwrap()).map_err(|e| e.to_string())?;
    std::fs::write(&dest, &text).map_err(|e| e.to_string())?;
    {
        let mut c = core.cfg.lock().unwrap();
        c.packs.retain(|p| p.name != stem);
        c.packs.push(store::PackRef { name: stem.clone(), file: dest.to_string_lossy().into() });
        store::save_config(&c)?;
        let (cat, _) = load_catalog(&c);
        *core.catalog.lock().unwrap() = cat;
    }
    core.log(format!("Pack added: {stem} ({} apps)", apps.len()));
    Ok(overview(&core))
}

#[tauri::command]
fn remove_pack(core: tauri::State<Core>, name: String) -> Result<Overview, String> {
    {
        let mut c = core.cfg.lock().unwrap();
        c.packs.retain(|p| p.name != name);
        store::save_config(&c)?;
        let (cat, _) = load_catalog(&c);
        *core.catalog.lock().unwrap() = cat;
    }
    core.log(format!("Pack removed: {name}. Downloaded versions stay in the Apps folder."));
    Ok(overview(&core))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let core = Core::new();
            lists::load_edits(&core.cfg.lock().unwrap().root);
            roms::set_extra(&core.cfg.lock().unwrap().extra_dirs);
            bg::mark_window_open();
            watch::start(app.handle().clone(), core.cfg.lock().unwrap().root.clone());
            {
                let b = core.cfg.lock().unwrap().bg.clone();
                if b.on {
                    std::thread::spawn(move || {
                        let _ = bg::apply(&b);
                    });
                }
            }
            app.manage(core);
            gog::start(app.handle().clone());
            bundle::apply(app.handle().clone());
            {
                // 0.9: without "start games from the vault", ES-DE goes back to its own find rules
                let h = app.handle().clone();
                std::thread::spawn(move || {
                    use tauri::Manager;
                    let core = h.state::<Core>();
                    play::write_find_rules(&core);
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_overview,
            save_settings,
            set_enabled,
            check_apps,
            download_app,
            update_all,
            delete_version,
            save_my_app,
            ui2::ui_snapshot,
            ui2::disk_stamp,
            ui2::ui_state_save,
            ui2::apply_ops,
            ui2::read_text,
            ui2::file_info,
            ui2::list_tree,
            ui2::export_zip,
            ui2::list_drives,
            ui2::read_drive,
            ui2::find_setup,
            ui2::device_dirs,
            ui2::selftest_path,
            convert::convert_tools,
            convert::convert_system,
            convert::install_tool,
            saves::saves_status,
            saves::saves_backup,
            saves::saves_restore,
            saves::saves_tick,
            saves::save_put,
            patch::patch_info,
            patch::apply_patch,
            frontends::write_frontend,
            media::media_info,
            media::import_esde_media,
            media::point_esde,
            bg::bg_status,
            bg::bg_set,
            ra::ra_check,
            ra::ra_last,
            ra::ra_account,
            dbupdate::lists_update,
            dbupdate::list_override,
            dbupdate::lists_info,
            esde::esde_status,
            esde::esde_setup,
            esde::esde_start,
            esde::esde_where,
            gog::gog_login_url,
            gog::gog_login_code,
            gog::gog_login_window,
            gog::gog_logout,
            gog::gog_refresh,
            gog::gog_view,
            selfupd::self_check,
            selfupd::self_download,
            selfupd::self_install,
            selfupd::self_open_deb,
            selfupd::self_note,
            gog::gog_set,
            gog::gog_download,
            gog::gog_pause,
            gog::gog_resume,
            gog::gog_unqueue,
            gog::gog_check,
            gog::gog_check_stop,
            gog::gog_cover_set,
            gog::gog_cover_reset,
            gog::gog_gd_find,
            gog::gog_gd_use,
            gog::gog_selftest_path,
            bundle::full_info,
            bundle::full_make,
            gog::heroic_status,
            gog::heroic_get,
            gog::heroic_own,
            gog::heroic_start,
            gog::heroic_play,
            gog::heroic_set_games,
            gog::heroic_install,
            gog::gog_cover_refetch,
            gog::gog_saves,
            gog::gog_saves_get,
            gog::gog_saves_dir,
            gog::gog_saves_copy,
            retroarch::rarch_status,
            retroarch::rarch_check,
            retroarch::rarch_install,
            retroarch::rarch_cores,
            retroarch::rarch_core_again,
            retroarch::ra_bios_info,
            retroarch::ra_solo_status,
            retroarch::ra_solo_get,
            retroarch::ra_solo_start,
            retroarch::bios_size,
            setupcheck::setup_check,
            setupcheck::ra_mode,
            setupcheck::old_ra_info,
            setupcheck::old_ra_remove,
            biosimport::bios_import,
            biosref::bios_ref_set,
            biosref::bios_ref_scan,
            biosref::bios_ref_copy,
            retroarch::rarch_setup,
            retroarch::rarch_start,
            play::play_options,
            play::play_set,
            play::vault_emus,
            play::vault_emu_set,
            play::vault_emu_link,
            play::play,
            discs::discs_check,
            discs::discs_last,
            remove_my_app,
            set_prefer,
            set_app_plats,
            ra_extras_list,
            ra_extras_get,
            ra_channel,
            app_add_file,
            open_path,
            open_url,
            get_folders,
            make_folders,
            get_bios,
            collect_bios,
            add_pack,
            remove_pack,
            cmds::scan_library,
            cmds::library_summary,
            cmds::list_files,
            cmds::find_duplicates,
            cmds::move_to_duplicates,
            cmds::find_multidisc,
            cmds::make_m3u,
            cmds::inbox_plan,
            cmds::inbox_apply,
            cmds::recent_changes,
            cmds::undo_change,
            cmds::empty_duplicates,
            cmds::collection_overview,
            cmds::collection_list,
            cmds::list_edits_save,
            cmds::inbox_take,
            cmds::add_system,
            cmds::covers_status,
            cmds::covers_fetch,
            cmds::backup_status,
            cmds::backup_now,
            cmds::backup_restore,
            cmds::device_plan,
            cmds::device_copy,
            cmds::export_settings,
            cmds::import_settings,
            cmds::notify,
            cmds::startup_chores,
            cmds::write_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running Emu Vault");
}

#[cfg(test)]
mod e2e {
    //! Runs the real check + download code against a small fake server.
    use super::*;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    async fn serve(port_tx: tokio::sync::oneshot::Sender<u16>, tag: std::sync::Arc<Mutex<String>>) {
        let l = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = l.local_addr().unwrap().port();
        port_tx.send(port).unwrap();
        loop {
            let (mut s, _) = l.accept().await.unwrap();
            let tag = tag.clone();
            tokio::spawn(async move {
                let mut buf = vec![0u8; 4096];
                let n = s.read(&mut buf).await.unwrap_or(0);
                let req = String::from_utf8_lossy(&buf[..n]).to_string();
                let path = req.split_whitespace().nth(1).unwrap_or("/").to_string();
                let t = tag.lock().unwrap().clone();
                let (ctype, body): (&str, Vec<u8>) = if path.starts_with("/repos/emu/test/releases") {
                    let j = format!(
                        r#"[{{"tag_name":"v{t}","name":"Test {t}","draft":false,"prerelease":false,"published_at":"2026-10-2{}T10:00:00Z",
                        "assets":[{{"name":"test-{t}-armeabi-v7a.apk","browser_download_url":"http://127.0.0.1:PORT/dl/a32-{t}.apk","size":10}},
                                  {{"name":"test-{t}-arm64-v8a.apk","browser_download_url":"http://127.0.0.1:PORT/dl/a64-{t}.apk","size":2000}},
                                  {{"name":"Test-{t}-x86_64.AppImage","browser_download_url":"http://127.0.0.1:PORT/dl/lin-{t}.AppImage","size":3000}},
                                  {{"name":"test-{t}-windows.zip","browser_download_url":"http://127.0.0.1:PORT/dl/win.zip","size":5}}]}}]"#,
                        t.len() % 10
                    );
                    ("application/json", j.into_bytes())
                } else if path == "/stable/" {
                    ("text/html", br#"<a href="/stable/1.9.9/">1.9.9</a> <a href="/stable/1.21.0/">1.21.0</a> <a href="/stable/1.10.0/">1.10.0</a>"#.to_vec())
                } else if path == "/stable/1.21.0/" {
                    ("text/html", br#"<a href="/stable/1.21.0/android/">android</a><a href="/stable/1.21.0/linux/">linux</a><a href="/stable/1.21.0/windows/">windows</a>"#.to_vec())
                } else if path == "/stable/1.21.0/linux/" {
                    ("text/html", br#"<a href="/stable/1.21.0/linux/armhf/">armhf</a><a href="/stable/1.21.0/linux/x86_64/">x86_64</a>"#.to_vec())
                } else if path == "/stable/1.21.0/linux/x86_64/" {
                    ("text/html", br#"<a href="/stable/1.21.0/linux/x86_64/RetroArch.7z">RetroArch.7z</a>"#.to_vec())
                } else if path == "/stable/1.21.0/linux/x86_64/RetroArch.7z" {
                    ("application/x-7z-compressed", include_bytes!("../tests-data/retroarch-test.7z").to_vec())
                } else if path.starts_with("/page/") {
                    (
                        "text/html",
                        format!(r#"<html><a href="/page/1.9.0/">old</a><a href='/page/1.10.0/'>new</a><a href="/dl/thing_{t}.apk">apk</a></html>"#)
                            .into_bytes(),
                    )
                } else if path.starts_with("/dl/a64") {
                    ("application/octet-stream", vec![7u8; 2000])
                } else if path.starts_with("/dl/") {
                    ("application/octet-stream", vec![1u8; 3000])
                } else {
                    ("text/plain", b"nope".to_vec())
                };
                let port = s.local_addr().unwrap().port();
                let body = String::from_utf8(body.clone()).map(|b| b.replace("PORT", &port.to_string()).into_bytes()).unwrap_or(body);
                let head = format!("HTTP/1.1 200 OK\r\nContent-Type: {ctype}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", body.len());
                let _ = s.write_all(head.as_bytes()).await;
                let _ = s.write_all(&body).await;
            });
        }
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn check_download_keep_three() {
        let tag = std::sync::Arc::new(Mutex::new("1.0".to_string()));
        let (tx, rx) = tokio::sync::oneshot::channel();
        tokio::spawn(serve(tx, tag.clone()));
        let port = rx.await.unwrap();
        let base = format!("http://127.0.0.1:{port}");
        let client = reqwest::Client::new();
        let cache = HttpCache::default();
        let ctx = sources::Ctx { client: &client, github_token: "", arch: "arm64-v8a", cache: &cache, api_base: Some(&base) };
        let mut app = catalog::parse_pack(catalog::BUILTIN_PACK, "t").unwrap().into_iter().find(|a| a.source == "github").unwrap();
        app.url = "https://github.com/emu/test".into();
        app.name = "Test Emu".into();
        app.rules = catalog::Rules { auto_arch: true, fallback_to_older: true, sort_by_date: true, ..Default::default() };
        let root = std::env::temp_dir().join(format!("ev-e2e-{}", std::process::id()));
        let r = root.to_string_lossy().to_string();
        for v in ["1.0", "1.1", "1.2", "1.3"] {
            *tag.lock().unwrap() = v.into();
            let l = sources::check(&ctx, &app, "x86_64").await.unwrap();
            let a = l.android.clone().unwrap();
            assert_eq!(a.version, format!("v{v}"));
            assert_eq!(a.asset.as_ref().unwrap().name, format!("test-{v}-arm64-v8a.apk"));
            assert_eq!(l.linux.as_ref().unwrap().asset.as_ref().unwrap().name, format!("Test-{v}-x86_64.AppImage"));
            let (s, _) = store::download(&client, &r, &app.name, "android", &a, 3, &[], |_, _| {}).await.unwrap();
            assert_eq!(s.size, 2000);
            store::download(&client, &r, &app.name, "linux", l.linux.as_ref().unwrap(), 3, &[], |_, _| {}).await.unwrap();
            std::thread::sleep(std::time::Duration::from_millis(1100));
        }
        let kept: Vec<String> = store::list_versions(&r, &app.name, "android").into_iter().map(|s| s.version).collect();
        assert_eq!(kept, vec!["v1.3", "v1.2", "v1.1"]);
        let lin = store::list_versions(&r, &app.name, "linux");
        assert_eq!(lin.len(), 3);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert!(std::fs::metadata(&lin[0].path).unwrap().permissions().mode() & 0o111 != 0, "AppImage is executable");
        }
        // same version again is refused, nothing breaks
        assert!(store::download(&client, &r, &app.name, "android", &sources::check(&ctx, &app, "x86_64").await.unwrap().android.unwrap(), 3, &[], |_, _| {})
            .await
            .is_err());

        // an HTML page with an intermediate step, like RetroArch's buildbot
        let mut h = app.clone();
        h.source = "html".into();
        h.url = format!("{base}/page/");
        h.rules = catalog::Rules {
            intermediate: vec![catalog::LinkStep { filter: r"/page/\d+\.\d+\.\d+/".into(), ..Default::default() }],
            link_filter: r"thing_.*\.apk$".into(),
            version_regex: r"thing_(.+)\.apk".into(),
            version_group: "$1".into(),
            ..Default::default()
        };
        let l = sources::check(&ctx, &h, "x86_64").await.unwrap();
        assert_eq!(l.android.unwrap().version, "1.3");
        assert!(l.linux.is_none());
        // RetroArch for Linux: buildbot pages -> RetroArch.7z -> unpacked AppImage
        let mut ra = app.clone();
        ra.name = "RetroArch".into();
        let mut alt = catalog::linux_alt_for("RetroArch (AArch64)").unwrap();
        alt.url = format!("{base}/stable/");
        ra.linux_alt = Some(alt);
        let l = sources::check(&ctx, &ra, "x86_64").await.unwrap();
        let lp = l.linux.clone().unwrap();
        assert_eq!(lp.version, "1.21.0");
        assert_eq!(lp.asset.as_ref().unwrap().name, "RetroArch.7z");
        let (s, _) = store::download(&client, &r, &ra.name, "linux", &lp, 3, &[], |_, _| {}).await.unwrap();
        assert!(s.file.ends_with("RetroArch-Linux-x86_64.AppImage"), "{}", s.file);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert!(std::fs::metadata(&s.path).unwrap().permissions().mode() & 0o111 != 0);
        }
        assert_eq!(store::list_versions(&r, "RetroArch", "linux").len(), 1);
        std::fs::remove_dir_all(root).unwrap();
    }
}
