//! 0.11: RetroArch from buildbot.libretro.com.
//! - The app itself for Linux, Windows and Android, stable (stable/<version>/…) or nightly (nightly/…).
//! - The frontend extras (assets/frontend/*.zip: menu icons, controller profiles, cheats, databases,
//!   overlays, shaders), kept in Apps/RetroArch/Extras/.
//! - The system files some cores need (assets/system/*.zip: Dolphin, PPSSPP, ScummVM…), unpacked into
//!   bios/_retroarch/ so they land in RetroArch-BIOS with the rest.
use crate::sources::{Asset, Ctx, Latest, Pick};
use crate::Core;
use futures_util::StreamExt;
use regex::Regex;
use serde::Serialize;
use std::collections::HashMap;
use std::io::Write;
use std::path::{Path, PathBuf};

pub fn buildbot() -> String {
    let b = std::env::var("EMUVAULT_BUILDBOT").unwrap_or_else(|_| "https://buildbot.libretro.com/".into());
    if b.ends_with('/') {
        b
    } else {
        format!("{b}/")
    }
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Entry {
    pub name: String,
    pub url: String,
    /// "2026-11-09" (the listing's last-modified day), "" when the page doesn't say
    pub date: String,
    pub size: u64,
    pub dir: bool,
}

/// The entries of a buildbot folder page: every link, with the date and size that follow it in its row.
pub fn listing(html: &str, page: &str) -> Vec<Entry> {
    let a = Regex::new(r#"(?i)<a\s+[^>]*href="([^"?#]+)"[^>]*>"#).unwrap();
    let date = Regex::new(r"(\d{4}-\d{2}-\d{2})").unwrap();
    let size = Regex::new(r"(?i)>\s*([\d.]+)\s*(B|KB|K|MB|M|GB|G)\s*<").unwrap();
    let base = url::Url::parse(page).ok();
    let mut out: Vec<Entry> = vec![];
    let ms: Vec<_> = a.captures_iter(html).collect();
    for (i, m) in ms.iter().enumerate() {
        let href = m.get(1).unwrap().as_str();
        let end = m.get(0).unwrap().end();
        let next = ms.get(i + 1).map(|n| n.get(0).unwrap().start()).unwrap_or(html.len());
        let row = &html[end..next.min(end + 600).max(end)];
        let Some(full) = base.as_ref().and_then(|b| b.join(href).ok()) else { continue };
        let full = full.to_string();
        // only things below this page (no parent, no sorting links, no other sites)
        if !full.starts_with(page) || full.len() <= page.len() {
            continue;
        }
        let rest = &full[page.len()..];
        let dir = rest.ends_with('/');
        let name = url_decode(rest.trim_end_matches('/'));
        if name.is_empty() || name.contains('/') {
            continue;
        }
        let d = date.captures(row).map(|c| c[1].to_string()).unwrap_or_default();
        let sz = size
            .captures(row)
            .map(|c| {
                let n: f64 = c[1].parse().unwrap_or(0.0);
                let mul = match c[2].to_uppercase().as_str() {
                    "KB" | "K" => 1024.0,
                    "MB" | "M" => 1048576.0,
                    "GB" | "G" => 1073741824.0,
                    _ => 1.0,
                };
                (n * mul) as u64
            })
            .unwrap_or(0);
        if !out.iter().any(|e| e.url == full) {
            out.push(Entry { name, url: full, date: d, size: sz, dir });
        }
    }
    out
}

fn url_decode(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            if let Ok(v) = u8::from_str_radix(&s[i + 1..i + 3], 16) {
                out.push(v);
                i += 3;
                continue;
            }
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

async fn list(ctx: &Ctx<'_>, url: &str) -> Result<Vec<Entry>, String> {
    let html = crate::sources::get_text_pub(ctx, url).await?;
    Ok(listing(&html, url))
}

/// The newest stable version folder ("1.22.2").
fn newest_version(es: &[Entry]) -> Option<String> {
    let re = Regex::new(r"^\d+\.\d+(\.\d+)?$").unwrap();
    es.iter().filter(|e| e.dir && re.is_match(&e.name)).map(|e| e.name.clone()).max_by(|a, b| crate::sources::natural_cmp(a, b))
}

/// The file to keep from one folder: Linux and Windows `RetroArch.7z`, Android the APK for your chip.
fn pick_file(es: &[Entry], plat: &str, apk_arch: &str) -> Option<Entry> {
    let files: Vec<&Entry> = es.iter().filter(|e| !e.dir).collect();
    let find = |n: &str| files.iter().find(|e| e.name == n).map(|e| (*e).clone());
    match plat {
        "android" => {
            let want = if apk_arch.starts_with("armeabi") {
                "RetroArch_ra32.apk"
            } else if apk_arch.starts_with("x86") {
                "RetroArch.apk"
            } else {
                "RetroArch_aarch64.apk"
            };
            find(want).or_else(|| find("RetroArch.apk"))
        }
        _ => find("RetroArch.7z").or_else(|| {
            // only dated ones (2026-11-08_RetroArch.7z): the newest
            let mut d: Vec<&&Entry> = files.iter().filter(|e| e.name.ends_with("RetroArch.7z")).collect();
            d.sort_by(|a, b| a.name.cmp(&b.name));
            d.last().map(|e| (**e).clone())
        }),
    }
}

fn pick(e: Entry, version: String) -> Pick {
    Pick { version, date: e.date.clone(), asset: Some(Asset { name: e.name, url: e.url, size: e.size }) }
}

/// RetroArch for Linux, Windows and Android. `nightly`: the daily builds, the day as the version.
pub async fn check(ctx: &Ctx<'_>, nightly: bool) -> Result<Latest, String> {
    let bb = buildbot();
    let mut l = Latest { page: format!("{bb}{}", if nightly { "nightly/" } else { "stable/" }), ..Default::default() };
    let (dirs, ver): (Vec<(&str, String)>, String) = if nightly {
        (
            vec![
                ("linux", format!("{bb}nightly/linux/x86_64/")),
                ("windows", format!("{bb}nightly/windows/x86_64/")),
                ("android", format!("{bb}nightly/android/")),
            ],
            String::new(),
        )
    } else {
        let v = newest_version(&list(ctx, &format!("{bb}stable/")).await?).ok_or("The libretro page shows no stable version")?;
        (
            vec![
                ("linux", format!("{bb}stable/{v}/linux/x86_64/")),
                ("windows", format!("{bb}stable/{v}/windows/x86_64/")),
                ("android", format!("{bb}stable/{v}/android/")),
            ],
            v,
        )
    };
    for (plat, url) in dirs {
        let note = match list(ctx, &url).await {
            Ok(es) => match pick_file(&es, plat, ctx.arch) {
                Some(e) => {
                    let v = if nightly {
                        format!("nightly-{}", if e.date.is_empty() { chrono::Local::now().format("%Y-%m-%d").to_string() } else { e.date.clone() })
                    } else {
                        ver.clone()
                    };
                    let p = pick(e, v);
                    match plat {
                        "linux" => l.linux = Some(p),
                        "windows" => l.windows = Some(p),
                        _ => l.android = Some(p),
                    }
                    String::new()
                }
                None => format!("No RetroArch file in {url}"),
            },
            Err(e) => e,
        };
        match plat {
            "linux" => l.note_linux = note,
            "windows" => l.note_windows = note,
            _ => l.note_android = note,
        }
    }
    l.note_macos = "Not kept: RetroArch for macOS comes from the App Store".into();
    if l.linux.is_none() && l.windows.is_none() && l.android.is_none() {
        return Err(l.note_linux.clone());
    }
    Ok(l)
}

// ------------------------------------------------------------------ extras and system files

#[derive(Serialize, Clone)]
pub struct Extra {
    /// "frontend" or "system"
    group: String,
    name: String,
    size: u64,
    date: String,
    /// the date of the copy you have ("" = none)
    have: String,
    url: String,
    /// you ticked it: it comes along with "Get the ticked ones"
    keep: bool,
}

fn extras_dir(root: &str) -> PathBuf {
    Path::new(root).join("Apps").join("RetroArch").join("Extras")
}
fn manifest(root: &str) -> PathBuf {
    extras_dir(root).join(".emuvault-extras.json")
}
fn read_manifest(root: &str) -> HashMap<String, String> {
    std::fs::read_to_string(manifest(root)).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}

pub async fn extras_list(core: &Core) -> Result<Vec<Extra>, String> {
    let (root, keep) = {
        let c = core.cfg.lock().unwrap();
        (c.root.clone(), c.ra_extras.clone())
    };
    let ctx = Ctx { client: &core.client, github_token: "", arch: "", cache: &core.cache, api_base: None };
    let have = read_manifest(&root);
    let bb = buildbot();
    let mut out = vec![];
    for g in ["frontend", "system"] {
        for e in list(&ctx, &format!("{bb}assets/{g}/")).await? {
            if e.dir || !e.name.to_lowercase().ends_with(".zip") {
                continue;
            }
            let key = format!("{g}/{}", e.name);
            out.push(Extra {
                group: g.into(),
                have: have.get(&key).cloned().unwrap_or_default(),
                keep: keep.contains(&key),
                size: e.size,
                date: e.date,
                url: e.url,
                name: e.name,
            });
        }
    }
    Ok(out)
}

async fn fetch(core: &Core, url: &str, dest: &Path) -> Result<(), String> {
    let res = core.client.get(url).header("User-Agent", "EmuVault/0.11").send().await.map_err(|e| format!("Network problem: {e}"))?;
    if !res.status().is_success() {
        return Err(format!("the download server answered {}", res.status()));
    }
    std::fs::create_dir_all(dest.parent().unwrap()).map_err(|e| e.to_string())?;
    let tmp = dest.with_extension("part");
    let mut f = std::fs::File::create(&tmp).map_err(|e| e.to_string())?;
    let mut s = res.bytes_stream();
    while let Some(c) = s.next().await {
        f.write_all(&c.map_err(|e| format!("Network problem: {e}"))?).map_err(|e| e.to_string())?;
    }
    drop(f);
    std::fs::rename(&tmp, dest).map_err(|e| e.to_string())
}

/// Unpack a system zip into bios/_retroarch/ (only files that are new or changed).
pub fn unpack_system(zip: &Path, to: &Path) -> Result<usize, String> {
    let f = std::fs::File::open(zip).map_err(|e| e.to_string())?;
    let mut a = zip::ZipArchive::new(f).map_err(|e| format!("not a zip: {e}"))?;
    let mut n = 0;
    for i in 0..a.len() {
        let mut z = a.by_index(i).map_err(|e| e.to_string())?;
        let Some(rel) = z.enclosed_name() else { continue };
        let dest = to.join(rel);
        if z.is_dir() {
            let _ = std::fs::create_dir_all(&dest);
            continue;
        }
        if let Some(p) = dest.parent() {
            std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
        }
        let mut buf = vec![];
        std::io::copy(&mut z, &mut buf).map_err(|e| e.to_string())?;
        if std::fs::read(&dest).map(|b| b == buf).unwrap_or(false) {
            continue;
        }
        std::fs::write(&dest, &buf).map_err(|e| e.to_string())?;
        n += 1;
    }
    Ok(n)
}

/// Get the named extras ("frontend/shaders_slang.zip", "system/PPSSPP.zip"); `keep`: remember them as ticked.
pub async fn extras_get(core: &Core, names: Vec<String>, keep: Vec<String>) -> Result<String, String> {
    let root = {
        let mut c = core.cfg.lock().unwrap();
        c.ra_extras = keep;
        let _ = crate::store::save_config(&c);
        c.root.clone()
    };
    if root.is_empty() {
        return Err("Choose your vault folder first".into());
    }
    let all = extras_list(core).await?;
    let mut have = read_manifest(&root);
    let (mut got, mut files, mut failed) = (0, 0, vec![]);
    for n in &names {
        let Some(e) = all.iter().find(|e| &format!("{}/{}", e.group, e.name) == n) else {
            failed.push(format!("{n}: not on the libretro page"));
            continue;
        };
        let r: Result<(), String> = async {
            if e.group == "frontend" {
                fetch(core, &e.url, &extras_dir(&root).join(&e.name)).await
            } else {
                let tmp = extras_dir(&root).join(".tmp").join(&e.name);
                fetch(core, &e.url, &tmp).await?;
                let r = unpack_system(&tmp, &Path::new(&root).join("bios").join("_retroarch"));
                let _ = std::fs::remove_file(&tmp);
                files += r?;
                Ok(())
            }
        }
        .await;
        match r {
            Ok(()) => {
                got += 1;
                have.insert(n.clone(), if e.date.is_empty() { chrono::Local::now().format("%Y-%m-%d").to_string() } else { e.date.clone() });
            }
            Err(x) => failed.push(format!("{}: {x}", e.name)),
        }
    }
    let _ = std::fs::create_dir_all(extras_dir(&root));
    let _ = std::fs::write(manifest(&root), serde_json::to_string_pretty(&have).unwrap_or_default());
    let _ = std::fs::remove_dir(extras_dir(&root).join(".tmp"));
    if files > 0 {
        crate::retroarch::bios_links(core);
    }
    let msg = format!(
        "RetroArch extras: {got} of {} fetched{}",
        names.len(),
        if files > 0 { format!(", {files} system files in bios/_retroarch/") } else { String::new() }
    );
    core.log(if failed.is_empty() { msg.clone() } else { format!("{msg}. Failed: {}", failed.join("; ")) });
    if got == 0 && !failed.is_empty() {
        return Err(failed.join("; "));
    }
    Ok(if failed.is_empty() { msg } else { format!("{msg}. Failed: {}", failed.join("; ")) })
}

#[cfg(test)]
mod tests {
    use super::*;
    const PAGE: &str = r#"<table><tr><td><a href="/assets/">Parent Directory</a></td></tr>
<tr><td class="fb-n"><a href="/assets/frontend/assets.zip">assets.zip</a></td><td class="fb-d">2026-11-08 15:04</td><td class="fb-s">74633 KB</td></tr>
<tr><td class="fb-n"><a href="/assets/frontend/shaders_slang.zip">shaders_slang.zip</a></td><td class="fb-d">2026-11-08 15:04</td><td class="fb-s">54368 KB</td></tr>
<tr><td><a href="?C=M&amp;O=A">Last modified</a></td></tr></table>"#;
    #[test]
    fn reads_a_listing() {
        let es = listing(PAGE, "https://buildbot.libretro.com/assets/frontend/");
        assert_eq!(es.len(), 2);
        assert_eq!(es[0].name, "assets.zip");
        assert_eq!(es[0].date, "2026-11-08");
        assert_eq!(es[0].size, 74633 * 1024);
        assert_eq!(es[1].url, "https://buildbot.libretro.com/assets/frontend/shaders_slang.zip");
    }
    #[test]
    fn picks_files() {
        let page = r#"<a href="1.21.0/">1.21.0/</a> 2025-05-01 <a href="1.22.2/">1.22.2/</a> 2026-10-01 <a href="1.9.0/">1.9.0/</a>"#;
        assert_eq!(newest_version(&listing(page, "https://b/stable/")).unwrap(), "1.22.2");
        let a = listing(
            r#"<a href="RetroArch.apk">a</a><a href="RetroArch_aarch64.apk">b</a> 2026-11-09 12:07 <a href="2026-11-08-RetroArch_aarch64.apk">c</a>"#,
            "https://b/nightly/android/",
        );
        assert_eq!(pick_file(&a, "android", "arm64-v8a").unwrap().name, "RetroArch_aarch64.apk");
        assert_eq!(pick_file(&a, "android", "arm64-v8a").unwrap().date, "2026-11-09");
        assert_eq!(pick_file(&a, "android", "armeabi-v7a").unwrap().name, "RetroArch.apk");
        let w = listing(
            r#"<a href="2026-11-07_RetroArch.7z">x</a><a href="2026-11-08_RetroArch.7z">y</a><a href="RetroArch_update.7z">z</a>"#,
            "https://b/nightly/windows/x86_64/",
        );
        assert_eq!(pick_file(&w, "windows", "").unwrap().name, "2026-11-08_RetroArch.7z");
    }
    #[test]
    fn system_zip_unpacks_without_overwriting_yours() {
        let d = std::env::temp_dir().join(format!("ev-sys-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        let z = d.join("PPSSPP.zip");
        {
            let f = std::fs::File::create(&z).unwrap();
            let mut w = zip::ZipWriter::new(f);
            let o = zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
            w.start_file("PPSSPP/ppge_atlas.zim", o).unwrap();
            w.write_all(b"atlas").unwrap();
            w.finish().unwrap();
        }
        let to = d.join("bios").join("_retroarch");
        assert_eq!(unpack_system(&z, &to).unwrap(), 1);
        assert_eq!(std::fs::read(to.join("PPSSPP/ppge_atlas.zim")).unwrap(), b"atlas");
        assert_eq!(unpack_system(&z, &to).unwrap(), 0);
        let _ = std::fs::remove_dir_all(&d);
    }
}
