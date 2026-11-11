// 0.10.4: your own BIOS folders. A folder in bios/ that Emu Vault has no list for (bios/mysystem/) shows as a
// system of its own with its files, and you can make a new one here. Own module: remove this file and its line
// in index.html to take it out.
(() => {
const KEY = "ev-bios-own";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } };
const save = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
const clean = s => String(s || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
const known = () => new Set(BIOSDB.map(e => e.id));
function ownIds(){
  const k = known(), ids = new Set(load().filter(x => !k.has(x)));
  for (const h of S.biosHave){ const id = h.split("/")[0]; if (id && !id.startsWith("_") && !k.has(id) && !k.has(id.toLowerCase())) ids.add(id); }
  return [...ids].sort();
}
// 0.14.2: a system counts as yours when one of your emulator apps plays it (RPCS3 -> PS3, shadPS4 -> PS4),
// so its BIOS shows under "Your systems" before you have games or BIOS files for it. RetroArch plays too many to count.
function byApps(){
  if (typeof EVA !== "object" || !EVA.OVA || typeof EVAP !== "object" || !EVAP.sysOf) return;
  const ids = new Set();
  for (const av of EVA.OVA.filter(a => a.enabled && !/^retroarch/i.test(a.name))) for (const s of EVAP.sysOf(av)) ids.add(s);
  for (const e of BIOSDB) if (ids.has(e.id) || (e.id === "3ds" && ids.has("n3ds"))) e.mine = true;
}
function addOwn(){
  try { byApps(); } catch (err) {}
  for (const id of ownIds()){
    if (BIOSDB.some(e => e.id === id)) continue;
    const e = { id, st: "check", used: "your own emulator", why: "A folder you made yourself. Emu Vault has no list for this system, so it doesn't check the files: it keeps them, backs them up and copies them to RetroArch-BIOS like the others.", files: [], own: true, mine: true };
    BIOSDB.push(e);
    if (typeof BIOS_MAP === "object") BIOS_MAP[id] = e;
    if (typeof BIOS_EXTRA_NAMES === "object" && !BIOS_EXTRA_NAMES[id]) BIOS_EXTRA_NAMES[id] = id;
  }
}
async function make(){
  const inp = document.getElementById("bown-name"), id = clean(inp && inp.value);
  if (!id){ toast("Type a short name, like mysystem"); return; }
  if (known().has(id) && !BIOSDB.find(e => e.id === id).own){ toast(`bios/${id}/ is already on the list: drop your files on ${biosName(id)}`); return; }
  try {
    if (typeof EV === "object" && EV.inv){ const r = await EV.inv("apply_ops", { label: `New BIOS folder bios/${id}/`, ops: [{ kind: "mkdir", from: `${EV.root()}/bios/${id}`, to: "" }] }); if (r[0] && !r[0].ok){ toast(r[0].error || "Couldn't make the folder"); return; } }
  } catch (e) { toast(String(e)); return; }
  const v = load(); if (!v.includes(id)) v.push(id); save(v);
  addOwn();
  S.biosView.filter = "all"; S.biosView.q = id; S.ui.open.add("blk:" + id);
  toast(`bios/${id}/ made. Drop your files on it.`); log(`BIOS: made bios/${id}/`);
  renderBios();
}
// an own folder is drawn as a full card (its files and a drop zone), counted as ready
const own = id => { const e = BIOSDB.find(x => x.id === id); return !!(e && e.own); };
const nOwn = id => [...S.biosHave].filter(h => h.startsWith(id + "/") && h.length > id.length + 1).length;
const origState = window.biosState;
window.biosState = function(id){
  if (own(id)){ const n = nOwn(id); return { k: "ready", label: `Your own · ${n} file${n === 1 ? "" : "s"}`, cls: "ok" }; }
  return origState.apply(this, arguments);
};
const orig = window.renderBios;
window.renderBios = function(){
  addOwn();
  orig.apply(this, arguments);
  const v = document.getElementById("view-bios"); if (!v) return;
  // 0.14.5: a file at the top of bios/<system>/ whose name the list wants in a subfolder (sys_modules/x.sprx):
  // one button moves them where the emulator looks
  for (const e of BIOSDB.filter(x => !x.own && x.files.some(f => f.f.includes("/") && !f.f.endsWith("/")))){
    const card = v.querySelector(`[data-bios="${CSS.escape(e.id)}"]`); if (!card || card.querySelector(".mis-fix")) continue;
    const top = [...S.biosHave].filter(h => h.startsWith(e.id + "/") && !h.slice(e.id.length + 1).includes("/")).map(h => h.slice(e.id.length + 1));
    const mv = [];
    for (const n of top){ const t = e.files.find(f => f.f.includes("/") && f.f.toLowerCase().endsWith("/" + n.toLowerCase()) && !biosHas(e.id, f.f)); if (t && !e.files.some(f => f.f.toLowerCase() === n.toLowerCase())) mv.push([n, t.f]); }
    if (!mv.length) continue;
    card.insertAdjacentHTML("beforeend", `<div class="mis-fix hint" style="margin:8px 0 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span>${mv.length} file${mv.length > 1 ? "s" : ""} belong${mv.length > 1 ? "" : "s"} in a subfolder: ${mv.slice(0, 3).map(x => `<span class="mono">${x[1]}</span>`).join(", ")}${mv.length > 3 ? "…" : ""}</span><button class="btn small" data-misfix="${e.id}">Put ${mv.length > 1 ? "them" : "it"} there</button></div>`);
    card.querySelector("[data-misfix]").onclick = async () => {
      if (typeof EV !== "object" || !EV.inv){ toast("Only in the app"); return; }
      const ops = mv.map(([n, t]) => ({ kind: "move", from: `${EV.root()}/bios/${e.id}/${n}`, to: `${EV.root()}/bios/${e.id}/${t}` }));
      try { const r = await EV.inv("apply_ops", { label: `BIOS ${biosName(e.id)}: files into their folders`, ops }); const ok = r.filter(x => x.ok).length;
        mv.slice(0, ok).forEach(([n, t]) => { S.biosHave.delete(`${e.id}/${n}`); S.biosHave.add(`${e.id}/${t}`); });
        toast(`${ok} file${ok === 1 ? "" : "s"} moved into ${[...new Set(mv.map(x => x[1].split("/").slice(0, -1).join("/")))].join(", ")}/`); log(`BIOS ${biosName(e.id)}: ${ok} files moved into their folders`); renderBios();
      } catch (x) { toast(String(x)); }
    };
  }
  // files in subfolders of your own folders (bios/mysystem/firmware/x.bin)
  for (const e of BIOSDB.filter(x => x.own)){
    const card = v.querySelector(`[data-bios="${CSS.escape(e.id)}"]`); if (!card || card.querySelector(".own-sub")) continue;
    const sub = [...S.biosHave].map(h => h.slice(e.id.length + 1)).filter((r, i, a) => [...S.biosHave][i].startsWith(e.id + "/") && r.includes("/") && !r.endsWith("/")).sort();
    if (!sub.length) continue;
    const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    card.insertAdjacentHTML("beforeend", `<div class="own-sub hint" style="margin:8px 0 0"><b>In subfolders · ${sub.length}</b><div class="mono" style="display:flex;flex-direction:column;gap:2px;margin-top:4px;overflow-wrap:anywhere">${sub.slice(0, 40).map(esc).map(x => `<span>${x}</span>`).join("")}${sub.length > 40 ? `<span>… and ${sub.length - 40} more</span>` : ""}</div></div>`);
  }
  const top = v.querySelector(".dupsum"); if (!top || v.querySelector("#bown")) return;
  top.insertAdjacentHTML("afterend", `<div class="ma-panel" id="bown" style="margin-top:12px"><div class="ma-row" style="gap:10px;flex-wrap:wrap;align-items:center"><span style="font-weight:600">Your own BIOS folder</span>
    <label for="bown-name" class="lbl2" style="position:absolute;left:-9999px">Folder name</label><input id="bown-name" class="search" placeholder="name, like mysystem" style="flex:0 1 220px;width:auto">
    <button class="btn small" id="bown-make">Make bios/&lt;name&gt;/</button></div>
    <p class="hint" style="margin:0">For a system or emulator that isn't on the list. Folders you make in bios/ yourself show up here too, with their files.</p></div>`);
  v.querySelector("#bown-make").onclick = make;
  v.querySelector("#bown-name").onkeydown = ev => { if (ev.key === "Enter") make(); };
};
})();
