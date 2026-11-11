//! The list of apps, read from Obtainium export files (the same format the
//! Obtainium Emulation Pack and the Recomp/Decomp pack use).

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LinkStep {
    pub filter: String,
    pub skip_sort: bool,
    pub reverse_sort: bool,
    pub by_last_segment: bool,
}

/// The parts of Obtainium's "additionalSettings" that decide which release and file to take.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Rules {
    pub include_prereleases: bool,
    pub fallback_to_older: bool,
    pub title_filter: String,
    pub version_regex: String,
    pub version_group: String,
    pub version_from_page: bool,
    pub title_as_version: bool,
    pub date_as_version: bool,
    pub apk_filter: String,
    pub invert_apk_filter: bool,
    pub auto_arch: bool,
    pub preferred_apk_index: usize,
    pub track_only: bool,
    pub sort_by_date: bool,
    // HTML pages
    pub link_filter: String,
    pub links_outside_a: bool,
    pub by_last_segment: bool,
    pub skip_sort: bool,
    pub intermediate: Vec<LinkStep>,
    pub headers: Vec<(String, String)>,
    /// per platform: words in the file name you chose when a release has several fitting files
    #[serde(default)]
    pub prefer: std::collections::HashMap<String, String>,
}

/// Where the Linux build of an app lives, when the pack only knows the Android one.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinuxAlt {
    pub source: String,
    pub url: String,
    pub rules: Rules,
}

/// 0.10.3: where the Windows build lives, when the pack only knows the Android one.
pub fn win_alt_for(name: &str) -> Option<LinuxAlt> {
    let n = name.to_lowercase();
    let step = |f: &str| LinkStep { filter: f.into(), ..Default::default() };
    if n.starts_with("retroarch") {
        // buildbot.libretro.com/stable/<version>/windows/x86_64/RetroArch.7z (kept packed: you unpack it on Windows)
        return Some(LinuxAlt {
            source: "html".into(),
            url: "https://buildbot.libretro.com/stable/".into(),
            rules: Rules {
                intermediate: vec![step(r"/stable/\d+\.\d+\.\d+/?$"), step(r"/stable/\d+\.\d+\.\d+/windows/?$"), step(r"/windows/x86_64/?$")],
                link_filter: r"/windows/x86_64/RetroArch\.7z$".into(),
                version_regex: r"/stable/(\d+\.\d+\.\d+)/".into(),
                version_group: "$1".into(),
                headers: vec![("User-Agent".into(), "Obtainium/1.0".into())],
                ..Default::default()
            },
        });
    }
    None
}

/// Built-in Linux sources for apps whose pack entry only finds the APK.
pub fn linux_alt_for(name: &str) -> Option<LinuxAlt> {
    let n = name.to_lowercase();
    let step = |f: &str| LinkStep { filter: f.into(), ..Default::default() };
    if n.starts_with("retroarch") {
        // buildbot.libretro.com/stable/<version>/linux/x86_64/RetroArch.7z (has the AppImage inside)
        return Some(LinuxAlt {
            source: "html".into(),
            url: "https://buildbot.libretro.com/stable/".into(),
            rules: Rules {
                intermediate: vec![step(r"/stable/\d+\.\d+\.\d+/?$"), step(r"/stable/\d+\.\d+\.\d+/linux/?$"), step(r"/linux/x86_64/?$")],
                link_filter: r"/linux/x86_64/RetroArch\.7z$".into(),
                version_regex: r"/stable/(\d+\.\d+\.\d+)/".into(),
                version_group: "$1".into(),
                headers: vec![("User-Agent".into(), "Obtainium/1.0".into())],
                ..Default::default()
            },
        });
    }
    if n.starts_with("duckstation") {
        return Some(LinuxAlt {
            source: "github".into(),
            url: "https://github.com/stenzek/duckstation".into(),
            rules: Rules { include_prereleases: true, fallback_to_older: true, sort_by_date: true, ..Default::default() },
        });
    }
    None
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppDef {
    pub id: String,
    pub name: String,
    pub author: String,
    pub url: String,
    /// github | gitlab | codeberg | forgejo | html
    pub source: String,
    pub about: String,
    pub category: String,
    pub pack: String,
    pub rules: Rules,
    #[serde(default)]
    pub linux_alt: Option<LinuxAlt>,
    #[serde(default)]
    pub win_alt: Option<LinuxAlt>,
    /// platforms for your own apps (empty: the ones in Settings)
    #[serde(default)]
    pub plats: Vec<String>,
    #[serde(default)]
    pub notes: String,
    /// 0.10: platforms the app exists for (from the pack; empty = not known)
    #[serde(default)]
    pub offers: Vec<String>,
    /// 0.10: vault systems it plays (ES-DE folder names)
    #[serde(default)]
    pub systems: Vec<String>,
    #[serde(default)]
    pub license: String,
}

fn s(v: &Value, k: &str) -> String {
    v.get(k).and_then(|x| x.as_str()).unwrap_or("").to_string()
}
fn b(v: &Value, k: &str) -> bool {
    v.get(k).and_then(|x| x.as_bool()).unwrap_or(false)
}

pub fn detect_source(url: &str, override_source: &str) -> String {
    let o = override_source.to_lowercase();
    if o == "html" || o == "libretro" {
        return o;
    }
    let u = url.to_lowercase();
    if u.contains("github.com/") {
        "github".into()
    } else if u.contains("gitlab.com/") {
        "gitlab".into()
    } else if u.contains("codeberg.org/") {
        "codeberg".into()
    } else if o == "forgejo" || o == "gitea" || o == "codeberg" {
        "forgejo".into()
    } else {
        "html".into()
    }
}

/// Parse one Obtainium export. `pack` is the name shown in the app.
pub fn parse_pack(text: &str, pack: &str) -> Result<Vec<AppDef>, String> {
    let root: Value = serde_json::from_str(text).map_err(|e| format!("Not a valid pack file: {e}"))?;
    let apps = root.get("apps").and_then(|a| a.as_array()).ok_or("This file has no app list. Export it from Obtainium with \"Export\".")?;
    let mut out = Vec::new();
    for a in apps {
        let url = s(a, "url");
        if url.is_empty() {
            continue;
        }
        let extra: Value = match a.get("additionalSettings") {
            Some(Value::String(t)) => serde_json::from_str(t).unwrap_or(Value::Null),
            Some(v @ Value::Object(_)) => v.clone(),
            _ => Value::Null,
        };
        let headers = extra
            .get("requestHeader")
            .and_then(|h| h.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|h| h.get("requestHeader").and_then(|x| x.as_str()))
                    .filter_map(|h| h.split_once(':').map(|(k, v)| (k.trim().to_string(), v.trim().to_string())))
                    .collect()
            })
            .unwrap_or_default();
        let intermediate = extra
            .get("intermediateLink")
            .and_then(|h| h.as_array())
            .map(|arr| {
                arr.iter()
                    .map(|st| LinkStep {
                        filter: s(st, "customLinkFilterRegex"),
                        skip_sort: b(st, "skipSort"),
                        reverse_sort: b(st, "reverseSort"),
                        by_last_segment: b(st, "sortByLastLinkSegment"),
                    })
                    .collect()
            })
            .unwrap_or_default();
        let rules = Rules {
            include_prereleases: b(&extra, "includePrereleases"),
            fallback_to_older: extra.get("fallbackToOlderReleases").and_then(|x| x.as_bool()).unwrap_or(true),
            title_filter: s(&extra, "filterReleaseTitlesByRegEx"),
            version_regex: s(&extra, "versionExtractionRegEx"),
            version_group: s(&extra, "matchGroupToUse"),
            version_from_page: b(&extra, "versionExtractWholePage"),
            title_as_version: b(&extra, "releaseTitleAsVersion"),
            date_as_version: b(&extra, "releaseDateAsVersion"),
            apk_filter: s(&extra, "apkFilterRegEx"),
            invert_apk_filter: b(&extra, "invertAPKFilter"),
            auto_arch: extra.get("autoApkFilterByArch").and_then(|x| x.as_bool()).unwrap_or(true),
            preferred_apk_index: a.get("preferredApkIndex").and_then(|x| x.as_u64()).unwrap_or(0) as usize,
            track_only: b(&extra, "trackOnly"),
            sort_by_date: s(&extra, "sortMethodChoice") != "smartname" && s(&extra, "sortMethodChoice") != "name",
            link_filter: s(&extra, "customLinkFilterRegex"),
            links_outside_a: b(&extra, "matchLinksOutsideATags"),
            by_last_segment: b(&extra, "sortByLastLinkSegment"),
            skip_sort: b(&extra, "skipSort"),
            intermediate,
            headers,
            ..Default::default()
        };
        let name = {
            let n = s(&extra, "appName");
            if n.is_empty() {
                s(a, "name")
            } else {
                n
            }
        };
        let category = a
            .get("categories")
            .and_then(|c| c.as_array())
            .and_then(|c| c.first())
            .and_then(|c| c.as_str())
            .unwrap_or(if rules.track_only { "Track Only" } else { "Other" })
            .to_string();
        let id = {
            let i = s(a, "id");
            if i.is_empty() {
                url.clone()
            } else {
                i
            }
        };
        let linux_alt = linux_alt_for(&name);
        let win_alt = win_alt_for(&name);
        let ev = a.get("emuvault").cloned().unwrap_or(Value::Null);
        let list = |k: &str| {
            ev.get(k).and_then(|x| x.as_array()).map(|v| v.iter().filter_map(|x| x.as_str().map(String::from)).collect::<Vec<_>>()).unwrap_or_default()
        };
        out.push(AppDef {
            // "manual": a website without release files, you look yourself (a reminder)
            source: if b(&ev, "manual") { "manual".into() } else { detect_source(&url, &s(a, "overrideSource")) },
            offers: list("offers"),
            systems: list("systems"),
            license: s(&ev, "license"),
            id,
            name,
            author: s(a, "author"),
            url,
            about: s(&extra, "about"),
            category,
            pack: pack.to_string(),
            linux_alt,
            win_alt,
            rules,
            plats: vec![],
            notes: String::new(),
        });
    }
    if out.is_empty() {
        return Err("The pack file has no apps in it.".into());
    }
    Ok(out)
}

pub const BUILTIN_PACK: &str = include_str!("../data/pack-oep.json");
pub const BUILTIN_PACK_NAME: &str = "Obtainium Emulation Pack";
pub const PC_PACK: &str = include_str!("../data/pack-pc.json");
pub const PC_PACK_NAME: &str = "PC emulators (Linux)";
/// 0.10: active, recommended emulators from awesome-emulators (CC BY-NC-SA 4.0, DerekTurtleRoe)
pub const AWESOME_PACK: &str = include_str!("../data/pack-awesome.json");
pub const AWESOME_PACK_NAME: &str = "Awesome Emulators";

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn builtin_pack_parses() {
        let apps = parse_pack(BUILTIN_PACK, BUILTIN_PACK_NAME).unwrap();
        assert!(apps.len() > 50);
        let dolphin = apps.iter().find(|a| a.name.contains("Dolphin")).unwrap();
        assert_eq!(dolphin.source, "html");
        assert!(dolphin.rules.link_filter.contains("dolphin"));
        let ra = apps.iter().find(|a| a.name.starts_with("RetroArch")).unwrap();
        assert_eq!(ra.rules.intermediate.len(), 2);
        let az = apps.iter().find(|a| a.name == "Azahar").unwrap();
        assert_eq!(az.source, "github");
        assert_eq!(az.rules.apk_filter, "vanilla");
        assert!(apps.iter().any(|a| a.rules.track_only));
    }
    #[test]
    fn retroarch_all_platforms() {
        let apps = parse_pack(BUILTIN_PACK, BUILTIN_PACK_NAME).unwrap();
        let ra = apps.iter().find(|a| a.name.to_lowercase().starts_with("retroarch")).unwrap();
        assert!(ra.linux_alt.is_some() && ra.win_alt.is_some());
        assert!(ra.win_alt.as_ref().unwrap().rules.link_filter.contains("windows/x86_64"));
    }
    #[test]
    fn awesome_pack_parses() {
        let apps = parse_pack(AWESOME_PACK, AWESOME_PACK_NAME).unwrap();
        assert!(apps.len() > 100);
        let rmg = apps.iter().find(|a| a.name.contains("Rosalie")).unwrap();
        assert_eq!(rmg.source, "github");
        assert!(rmg.offers.contains(&"linux".to_string()));
        assert!(rmg.systems.contains(&"n64".to_string()));
        assert!(apps.iter().any(|a| a.source == "manual"));
        assert!(!apps.iter().any(|a| a.name == "PCSX2"));
    }
}
