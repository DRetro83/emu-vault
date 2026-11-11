// 0.11: RetroArch from libretro on the Apps page: Stable or Nightly on its card, and a panel with the extras
// (assets/frontend: icons, controller profiles, cheats, databases, overlays, shaders) and the system files
// cores need (assets/system: Dolphin, PPSSPP, ScummVM…). Own module: remove this file and its line in index.html.
(() => {
const e = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MB = b => !b ? "" : b >= 1073741824 ? (b / 1073741824).toFixed(1) + " GB" : Math.max(1, Math.round(b / 1048576)) + " MB";
const RA = "pc.retroarch";
const fold = v => { try { if (v === undefined) return localStorage.getItem("ev-raextras") === "1"; localStorage.setItem("ev-raextras", v ? "1" : "0"); } catch (err) {} return false; };
let list = null, loading = false, err = "", busy = false, open = fold();
const live = () => typeof EV === "object" && EV.inv && window.__TAURI__;

async function load(){
  if (!live()){ err = "Only in the app."; return; }
  loading = true; err = ""; MA.render();
  try { list = await EV.inv("ra_extras_list"); } catch (x) { err = EV.errMsg ? EV.errMsg(x) : String(x); }
  loading = false; MA.render();
}
const LABEL = { "assets.zip": "menu icons and pictures", "autoconfig.zip": "controller profiles", "cheats.zip": "cheats", "database-cursors.zip": "database cursors", "database-rdb.zip": "game database (scanning, playlists)", "glui_minimal_assets.zip": "small icon set (GLUI menu)", "info.zip": "core info files", "overlays.zip": "on-screen controls and bezels", "shaders_cg.zip": "shaders (Cg)", "shaders_glsl.zip": "shaders (GLSL)", "shaders_slang.zip": "shaders (Slang, Vulkan)" };
function panel(){
  const rows = g => (list || []).filter(x => x.group === g).map(x => {
    const k = `${x.group}/${x.name}`, st = x.have ? (x.date && x.have < x.date ? "newer" : "have") : "";
    return `<label class="ap-tick"><input type="checkbox" data-raex="${e(k)}" ${x.keep ? "checked" : ""}><span class="p">${g === "frontend" ? "extras" : "system"}</span><span class="fn"><span class="mono">${e(x.name)}</span> <span class="muted">${e(LABEL[x.name] || "")}</span></span><span class="muted">${MB(x.size)}</span><span class="pill ${st === "have" ? "ok" : st === "newer" ? "warn" : "plat"}">${st === "have" ? "have it" : st === "newer" ? "newer " + e(x.date) : x.keep ? "to get" : "not kept"}</span></label>`; }).join("");
  const nNew = (list || []).filter(x => x.keep && (!x.have || (x.date && x.have < x.date))).length;
  return `<details class="ma-panel" id="raex" ${open ? "open" : ""}><summary style="cursor:pointer;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap"><span style="font-weight:600">RetroArch extras from libretro</span><span class="muted" style="font-size:12.5px">${list ? `${list.length} files${nNew ? ` · ${nNew} to get` : ""}` : "shaders, overlays, cheats, databases and system files for cores"}</span></summary>
    <p class="hint">Extras go to <span class="mono">Apps/RetroArch/Extras/</span> as they are (unpack them into RetroArch yourself, or point RetroArch at them). System files are unpacked into <span class="mono">bios/_retroarch/</span>, so they land in RetroArch-BIOS with your BIOS files. Free from <a href="https://buildbot.libretro.com/assets/" target="_blank" rel="noopener">buildbot.libretro.com</a>.</p>
    ${loading ? `<p class="muted">Looking at libretro…</p>` : err ? `<p class="hint" style="color:var(--bad)">${e(err)}</p><button class="btn small" data-raexload>Try again</button>` : !list ? `<button class="btn small" data-raexload>Show the files</button>` :
      `<div class="ap-ticks"><span class="lbl2">Frontend extras</span>${rows("frontend")}<span class="lbl2" style="margin-top:6px">System files for cores</span>${rows("system")}
       <div class="ma-row" style="gap:10px;flex-wrap:wrap"><button class="btn small primary" data-raexget ${busy ? "disabled" : ""}>${busy ? "Downloading…" : "Get the ticked ones"}</button><button class="linkbtn" data-raexload>Look again</button><span class="hint" style="margin:0">Ticks are remembered; look again later to see newer files.</span></div></div>`}
  </details>`;
}
async function get(){
  const box = document.getElementById("raex"); if (!box) return;
  const keep = [...box.querySelectorAll("[data-raex]")].filter(x => x.checked).map(x => x.dataset.raex);
  const names = keep.filter(k => { const x = list.find(y => `${y.group}/${y.name}` === k); return x && (!x.have || (x.date && x.have < x.date)); });
  busy = true; MA.render();
  try { const msg = await EV.inv("ra_extras_get", { names, keep }); toast(names.length ? msg : "Ticks saved. You have every ticked file."); list = await EV.inv("ra_extras_list"); } catch (x) { toast(EV.errMsg ? EV.errMsg(x) : String(x)); }
  busy = false; MA.render();
}
function channelBox(){
  const n = !!(EV.OV && EV.OV.config && EV.OV.config.ra_nightly);
  return `<div class="ma-row ap-keep"><span class="lbl2">Builds</span><button class="ma-chip" data-rach="0" aria-pressed="${!n}">Stable</button><button class="ma-chip" data-rach="1" aria-pressed="${n}">Nightly</button><span class="hint" style="margin:0">${n ? "The daily build: newest, sometimes broken. The day is its version." : "The released version, tested."}</span></div>`;
}
async function channel(n){
  try { EVA.apply(await EV.inv("ra_channel", { nightly: n })); EVA.apply(await EV.inv("check_apps", { ids: [RA] })); toast(n ? "RetroArch: nightly builds. The newest daily build shows as an update." : "RetroArch: stable builds."); } catch (x) { toast(EV.errMsg ? EV.errMsg(x) : String(x)); }
  MA.render();
}
const prev = EVAP.after;
EVAP.after = function(el){
  prev(el);
  if (MA.M.sub !== "mine") return;
  const card = el.querySelector(`article[data-macard="${RA}"] .ap-box`);
  if (card) card.insertAdjacentHTML("afterbegin", channelBox());
  const cards = el.querySelector(".ma-cards");
  if (cards) cards.insertAdjacentHTML("afterend", panel());
  const d = el.querySelector("#raex");
  if (d) d.addEventListener("toggle", () => { open = d.open; fold(open); if (open && !list && !loading && !err) load(); });
};
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-raexload],[data-raexget],[data-rach]");
  if (!t) return; ev.preventDefault();
  if (t.hasAttribute("data-raexload")) load();
  else if (t.hasAttribute("data-raexget")) get();
  else channel(t.dataset.rach === "1");
});
})();
