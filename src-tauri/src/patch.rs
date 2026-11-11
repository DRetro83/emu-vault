//! Translations and fixes: applying .ips, .ups, .bps (built in) and .xdelta (xdelta3) patches.
//! The original file is never changed: a patched copy is made next to it.

use crate::journal::Recorder;
use crate::Core;
use serde::Serialize;
use std::path::{Path, PathBuf};

fn crc(b: &[u8]) -> u32 {
    crc32fast::hash(b)
}

/// The "beat" number encoding used by UPS and BPS.
fn vread(p: &[u8], i: &mut usize) -> Result<u64, String> {
    let mut data: u64 = 0;
    let mut shift: u64 = 1;
    loop {
        let x = *p.get(*i).ok_or("The patch file is cut short")? as u64;
        *i += 1;
        data += (x & 0x7f) * shift;
        if x & 0x80 != 0 {
            return Ok(data);
        }
        shift <<= 7;
        data += shift;
    }
}

pub fn ips(src: &[u8], p: &[u8]) -> Result<Vec<u8>, String> {
    if !p.starts_with(b"PATCH") {
        return Err("Not an IPS patch".into());
    }
    let mut out = src.to_vec();
    let mut i = 5;
    loop {
        if p.len() < i + 3 {
            return Err("The IPS patch is cut short".into());
        }
        if &p[i..i + 3] == b"EOF" {
            i += 3;
            if p.len() >= i + 3 {
                let n = (p[i] as usize) << 16 | (p[i + 1] as usize) << 8 | p[i + 2] as usize;
                out.truncate(n);
            }
            return Ok(out);
        }
        let off = (p[i] as usize) << 16 | (p[i + 1] as usize) << 8 | p[i + 2] as usize;
        let size = (*p.get(i + 3).ok_or("cut short")? as usize) << 8 | *p.get(i + 4).ok_or("cut short")? as usize;
        i += 5;
        if size == 0 {
            let n = (*p.get(i).ok_or("cut short")? as usize) << 8 | *p.get(i + 1).ok_or("cut short")? as usize;
            let v = *p.get(i + 2).ok_or("cut short")?;
            i += 3;
            if out.len() < off + n {
                out.resize(off + n, 0);
            }
            out[off..off + n].iter_mut().for_each(|b| *b = v);
        } else {
            let data = p.get(i..i + size).ok_or("The IPS patch is cut short")?;
            i += size;
            if out.len() < off + size {
                out.resize(off + size, 0);
            }
            out[off..off + size].copy_from_slice(data);
        }
    }
}

fn footer(p: &[u8]) -> Result<(u32, u32), String> {
    if p.len() < 12 {
        return Err("The patch is cut short".into());
    }
    let r = |o: usize| u32::from_le_bytes([p[o], p[o + 1], p[o + 2], p[o + 3]]);
    let n = p.len();
    if crc(&p[..n - 4]) != r(n - 4) {
        return Err("The patch file itself is damaged (its checksum doesn't match)".into());
    }
    Ok((r(n - 12), r(n - 8)))
}

pub fn ups(src: &[u8], p: &[u8]) -> Result<Vec<u8>, String> {
    if !p.starts_with(b"UPS1") {
        return Err("Not a UPS patch".into());
    }
    let (src_crc, dst_crc) = footer(p)?;
    if crc(src) != src_crc {
        return Err(WRONG.into());
    }
    let mut i = 4;
    let _ss = vread(p, &mut i)? as usize;
    let ds = vread(p, &mut i)? as usize;
    let mut out = src.to_vec();
    out.resize(ds.max(out.len()), 0);
    let mut pos = 0usize;
    while i < p.len() - 12 {
        pos += vread(p, &mut i)? as usize;
        loop {
            let x = *p.get(i).ok_or("cut short")?;
            i += 1;
            if x == 0 {
                pos += 1;
                break;
            }
            if pos < out.len() {
                out[pos] ^= x;
            }
            pos += 1;
        }
    }
    out.truncate(ds);
    if crc(&out) != dst_crc {
        return Err("The result doesn't match what the patch promises".into());
    }
    Ok(out)
}

const WRONG: &str = "This patch is made for a different version of the game: your file's checksum doesn't match the one the patch expects. Look for the version the patch's readme names (often a No-Intro dump).";

pub fn bps(src: &[u8], p: &[u8]) -> Result<Vec<u8>, String> {
    if !p.starts_with(b"BPS1") {
        return Err("Not a BPS patch".into());
    }
    let (src_crc, dst_crc) = footer(p)?;
    if crc(src) != src_crc {
        return Err(WRONG.into());
    }
    let mut i = 4;
    let _ss = vread(p, &mut i)?;
    let ts = vread(p, &mut i)? as usize;
    let meta = vread(p, &mut i)? as usize;
    i += meta;
    let mut out = vec![0u8; ts];
    let (mut op, mut sr, mut tr) = (0usize, 0i64, 0i64);
    let end = p.len() - 12;
    while i < end {
        let d = vread(p, &mut i)?;
        let len = (d >> 2) as usize + 1;
        match d & 3 {
            0 => {
                for k in 0..len {
                    out[op + k] = *src.get(op + k).ok_or("source read past the end")?;
                }
                op += len;
            }
            1 => {
                out[op..op + len].copy_from_slice(p.get(i..i + len).ok_or("cut short")?);
                i += len;
                op += len;
            }
            2 => {
                let o = vread(p, &mut i)? as i64;
                sr += if o & 1 == 1 { -(o >> 1) } else { o >> 1 };
                for _ in 0..len {
                    out[op] = *src.get(sr as usize).ok_or("source copy past the end")?;
                    op += 1;
                    sr += 1;
                }
            }
            _ => {
                let o = vread(p, &mut i)? as i64;
                tr += if o & 1 == 1 { -(o >> 1) } else { o >> 1 };
                for _ in 0..len {
                    out[op] = out[tr as usize];
                    op += 1;
                    tr += 1;
                }
            }
        }
    }
    if crc(&out) != dst_crc {
        return Err("The result doesn't match what the patch promises".into());
    }
    Ok(out)
}

#[derive(Serialize)]
pub struct PatchInfo {
    /// ips | ups | bps | xdelta
    kind: String,
    /// for UPS and BPS: the CRC32 of the file the patch is made for (8 hex digits)
    source_crc: String,
}

#[tauri::command]
pub fn patch_info(path: String) -> Result<PatchInfo, String> {
    let ext = Path::new(&path).extension().map(|e| e.to_string_lossy().to_lowercase()).unwrap_or_default();
    let kind = match ext.as_str() {
        "ips" => "ips",
        "ups" => "ups",
        "bps" => "bps",
        "xdelta" | "xdelta3" | "vcdiff" => "xdelta",
        _ => return Err("Not a patch file Emu Vault knows (.ips, .ups, .bps, .xdelta)".into()),
    };
    let mut source_crc = String::new();
    if kind == "ups" || kind == "bps" {
        let b = std::fs::read(&path).map_err(|e| e.to_string())?;
        if let Ok((s, _)) = footer(&b) {
            source_crc = format!("{s:08x}");
        }
    }
    Ok(PatchInfo { kind: kind.into(), source_crc })
}

fn xdelta_cmd() -> Option<std::process::Command> {
    let exe = std::env::current_exe().ok()?;
    let b = exe.parent()?.join("../lib/emu-vault/xdelta3/xdelta3");
    if b.is_file() {
        let mut c = crate::desktop_cmd(&b.to_string_lossy());
        c.env("LD_LIBRARY_PATH", b.parent().unwrap());
        return Some(c);
    }
    ["/usr/bin/xdelta3", "/usr/local/bin/xdelta3"].iter().find(|p| Path::new(p).is_file()).map(|p| crate::desktop_cmd(p))
}

/// Make a patched copy of a game: "<name> [<tag>].<ext>" next to the original.
#[tauri::command]
pub async fn apply_patch(core: tauri::State<'_, Core>, rom: String, patch: String, tag: String) -> Result<String, String> {
    let romp = PathBuf::from(&rom);
    let ext = romp.extension().map(|e| e.to_string_lossy().to_lowercase()).unwrap_or_default();
    if matches!(ext.as_str(), "zip" | "7z" | "rar" | "chd" | "rvz" | "cso") {
        return Err(format!("A .{ext} file can't be patched directly. Patch the unpacked game (for example the .sfc or .bin inside the zip)."));
    }
    let name = romp.file_name().ok_or("Bad file")?.to_string_lossy().to_string();
    let (stem, dot_ext) = match name.rfind('.') {
        Some(i) => (name[..i].to_string(), name[i..].to_string()),
        None => (name.clone(), String::new()),
    };
    let tag = tag.trim().trim_matches(|c| c == '[' || c == ']').to_string();
    let out_path = crate::journal::free_name(&romp.with_file_name(format!("{stem} [{}]{dot_ext}", if tag.is_empty() { "Patched" } else { &tag })));
    let pk = patch_info(patch.clone())?.kind;
    tokio::task::block_in_place(|| -> Result<(), String> {
        if pk == "xdelta" {
            let mut c = xdelta_cmd().ok_or("xdelta3 isn't there. In a terminal:  sudo apt install xdelta3")?;
            let ok = c.args(["-d", "-f", "-s"]).arg(&romp).arg(&patch).arg(&out_path).status().map(|s| s.success()).unwrap_or(false);
            if !ok {
                let _ = std::fs::remove_file(&out_path);
                return Err("xdelta3 couldn't apply this patch. Usually that means it's made for a different version of the game.".into());
            }
            return Ok(());
        }
        let src = std::fs::read(&romp).map_err(|e| e.to_string())?;
        let p = std::fs::read(&patch).map_err(|e| e.to_string())?;
        let out = match pk.as_str() {
            "ips" => ips(&src, &p)?,
            "ups" => ups(&src, &p)?,
            _ => bps(&src, &p)?,
        };
        std::fs::write(&out_path, out).map_err(|e| e.to_string())
    })?;
    let mut rec = Recorder::new(&format!("Patched: {}", out_path.file_name().unwrap().to_string_lossy()));
    rec.batch.made.push(out_path.to_string_lossy().into());
    let l = rec.batch.label.clone();
    rec.commit();
    if let Some(sys) = romp.parent().and_then(|d| {
        let r = core.cfg.lock().unwrap().root.clone();
        d.strip_prefix(Path::new(&r).join("roms")).ok().and_then(|x| x.components().next()).map(|c| c.as_os_str().to_string_lossy().to_string())
    }) {
        let c: &Core = &core;
        tokio::task::block_in_place(|| crate::cmds::rescan_pub(c, &[sys]));
    }
    core.log(l);
    Ok(out_path.to_string_lossy().into())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn venc(mut v: u64, out: &mut Vec<u8>) {
        loop {
            let x = (v & 0x7f) as u8;
            v >>= 7;
            if v == 0 {
                out.push(0x80 | x);
                return;
            }
            out.push(x);
            v -= 1;
        }
    }
    #[test]
    fn ips_ups_bps() {
        let src = b"HELLO WORLD, THIS IS A GAME".to_vec();
        // IPS: change offset 6 to "EARTH", and an RLE run at 0
        let mut p = b"PATCH".to_vec();
        p.extend([0, 0, 6, 0, 5]);
        p.extend(b"EARTH");
        p.extend([0, 0, 0, 0, 0, 0, 2, b'J']);
        p.extend(b"EOF");
        assert_eq!(ips(&src, &p).unwrap(), b"JJLLO EARTH, THIS IS A GAME".to_vec());
        // BPS: source read 6, target read "EARTH", source read the rest
        let dst = b"HELLO EARTH, THIS IS A GAME".to_vec();
        let mut b = b"BPS1".to_vec();
        venc(src.len() as u64, &mut b);
        venc(dst.len() as u64, &mut b);
        venc(0, &mut b);
        venc(((6 - 1) << 2) | 0, &mut b);
        venc(((5 - 1) << 2) | 1, &mut b);
        b.extend(b"EARTH");
        venc((((src.len() - 11) as u64 - 1) << 2) | 0, &mut b);
        b.extend(crc(&src).to_le_bytes());
        b.extend(crc(&dst).to_le_bytes());
        let c = crc(&b);
        b.extend(c.to_le_bytes());
        assert_eq!(bps(&src, &b).unwrap(), dst);
        assert!(bps(b"other file", &b).unwrap_err().contains("different version"));
        // UPS: xor at offset 6 (every byte differs, so one hunk)
        let dst = b"HELLO EAXTH, THIS IS A GAME".to_vec();
        let mut u = b"UPS1".to_vec();
        venc(src.len() as u64, &mut u);
        venc(dst.len() as u64, &mut u);
        venc(6, &mut u);
        for k in 0..5 {
            u.push(src[6 + k] ^ dst[6 + k]);
        }
        u.push(0);
        u.extend(crc(&src).to_le_bytes());
        u.extend(crc(&dst).to_le_bytes());
        let c = crc(&u);
        u.extend(c.to_le_bytes());
        assert_eq!(ups(&src, &u).unwrap(), dst);
    }
}
