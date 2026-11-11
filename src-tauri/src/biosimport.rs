//! BIOS import (0.9.8): sort-bios.sh, built in. A folder or a pack (zip/7z/rar) is sorted into bios/<system>/
//! by name, md5, PS2 size and RetroArch folders, exactly like the script. Only copies; the source stays as it is.

use crate::Core;
use std::path::Path;

const SCRIPT: &str = include_str!("../data/sort-bios.sh");

#[derive(serde::Serialize)]
pub struct ImportOut {
    text: String,
    ok: bool,
}

/// `dry`: only show what would happen. `fix`: swap wrong dumps in the vault for right ones (old ones to bios/_replaced/).
#[tauri::command]
pub async fn bios_import(core: tauri::State<'_, Core>, src: String, dry: bool, fix: bool) -> Result<ImportOut, String> {
    let root = core.cfg.lock().unwrap().root.clone();
    if root.is_empty() {
        return Err("Choose your main folder first.".into());
    }
    let s = Path::new(&src);
    if !s.exists() {
        return Err(format!("That isn't there: {src}"));
    }
    let script = crate::store::app_dir().join("sort-bios.sh");
    std::fs::write(&script, SCRIPT).map_err(|e| e.to_string())?;
    // a pack on its own: in a folder of its own (a copy; the original stays)
    let tmp = std::env::temp_dir().join(format!("emuvault-import-{}", std::process::id()));
    let folder = if s.is_file() {
        let _ = std::fs::remove_dir_all(&tmp);
        std::fs::create_dir_all(&tmp).map_err(|e| e.to_string())?;
        let to = tmp.join(s.file_name().unwrap_or_default());
        std::fs::hard_link(s, &to).or_else(|_| std::fs::copy(s, &to).map(|_| ())).map_err(|e| e.to_string())?;
        tmp.clone()
    } else {
        s.to_path_buf()
    };
    let mut args = vec![script.to_string_lossy().to_string(), folder.to_string_lossy().to_string(), root.clone()];
    if dry {
        args.push("--dry".into());
    }
    if fix {
        args.push("--fix".into());
    }
    let out = tokio::task::spawn_blocking(move || std::process::Command::new("bash").args(&args).output())
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| format!("bash didn't start: {e}"))?;
    if s.is_file() {
        let _ = std::fs::remove_dir_all(&tmp);
    }
    let mut text = String::from_utf8_lossy(&out.stdout).to_string();
    let err = String::from_utf8_lossy(&out.stderr);
    if !err.trim().is_empty() {
        text.push_str("\n");
        text.push_str(err.trim());
    }
    if !dry {
        crate::retroarch::bios_links(&core);
        let last = text.lines().rev().find(|l| l.contains("copied")).unwrap_or("").to_string();
        core.log(format!("BIOS import from {src}: {last}"));
    }
    Ok(ImportOut { text, ok: out.status.success() })
}
