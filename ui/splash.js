// 0.15: the startup screen. The Emu Vault logo, a short check of your vault (ROMs, BIOS, apps) and a bar,
// then it fades out. Any key, click or controller button skips it. Only in the app (not in the preview).
// Own module: remove this file and splash.css from index.html to take it out. Off: localStorage ev-splash = "off".
(() => {
const T = window.__TAURI__;
let off = false; try { off = localStorage.getItem("ev-splash") === "off"; } catch (e) {}
if (!T || off) return;
const LOGO = `███████╗███╗   ███╗██╗   ██╗   ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
██╔════╝████╗ ████║██║   ██║   ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
█████╗  ██╔████╔██║██║   ██║   ██║   ██║███████║██║   ██║██║     ██║
██╔══╝  ██║╚██╔╝██║██║   ██║   ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║
███████╗██║ ╚═╝ ██║╚██████╔╝    ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║
╚══════╝╚═╝     ╚═╝ ╚═════╝      ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝`;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ROWS = [["vault", "Vault"], ["roms", "ROMs"], ["bios", "BIOS"], ["apps", "Apps"]];
const el = document.createElement("div");
el.id = "splash"; el.setAttribute("role", "status"); el.setAttribute("aria-label", "Emu Vault is starting");
el.innerHTML = `<pre class="sp-logo" aria-hidden="true">${LOGO}</pre>
  <span class="sp-ver" id="sp-ver">STARTING</span>
  <div class="sp-rows">${ROWS.map(([k, n]) => `<div class="sp-row" data-sp="${k}"><span class="sp-st wait">[ .. ]</span><span>${n}</span><span class="sp-val"></span></div>`).join("")}</div>
  <div class="sp-barbox"><div class="sp-bar" role="progressbar" aria-label="Starting" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="sp-fill"></div></div>
  <div class="sp-foot"><span id="sp-pct">starting… 0%</span><span>Press any key or Ⓐ to skip</span></div></div>`;
const mount = () => { if (!document.body.contains(el)) document.body.appendChild(el); };
document.body ? mount() : document.addEventListener("DOMContentLoaded", mount);
const t0 = Date.now(); let done = false, closing = false;
const set = (k, st, val) => { const r = el.querySelector(`[data-sp="${k}"]`); if (!r) return; const s = r.querySelector(".sp-st");
  s.className = "sp-st " + st; s.textContent = st === "ok" ? "[ OK ]" : st === "warn" ? "[ !! ]" : "[ .. ]"; r.querySelector(".sp-val").textContent = val || ""; };
const pct = p => { el.querySelector("#sp-fill").style.width = p + "%"; el.querySelector(".sp-bar").setAttribute("aria-valuenow", p); el.querySelector("#sp-pct").textContent = p >= 100 ? "ready" : `starting… ${p}%`; };
let ver = "";
const head = () => { const r = typeof EV === "object" && EV.root ? EV.root() : ""; el.querySelector("#sp-ver").textContent = [ver && `VERSION ${ver}`, r].filter(Boolean).join(" · ") || "STARTING"; };
try { T.app.getVersion().then(v => { ver = v; head(); }).catch(() => {}); } catch (e) {}
function fill(){
  const n = x => x.toLocaleString("en");
  head(); set("vault", "ok", "found");
  const games = (S.romFiles || []).length, sys = new Set((S.romFiles || []).map(f => f.sys)).size;
  set("roms", "ok", games ? `${n(games)} file${games === 1 ? "" : "s"} · ${sys} system${sys === 1 ? "" : "s"}` : "none yet");
  try { const mine = mySystemIds().filter(id => typeof biosFor === "function" && biosFor(id) && biosFor(id).files && biosFor(id).files.length);
    const miss = mine.filter(id => biosState(id).k === "missing").length;
    miss ? set("bios", "warn", `${miss} system${miss > 1 ? "s" : ""} missing files`) : set("bios", "ok", mine.length ? "your systems ready" : "nothing needed yet"); } catch (e) { set("bios", "ok", ""); }
  try { const apps = (EVA.OVA || []).filter(a => a.enabled).length, u = typeof MA === "object" && MA.updates ? MA.updates().length : 0;
    u ? set("apps", "warn", `${u} update${u > 1 ? "s" : ""}`) : set("apps", "ok", `${apps} app${apps === 1 ? "" : "s"}`); } catch (e) { set("apps", "ok", ""); }
}
function close(){
  if (closing) return; closing = true; removeEventListener("keydown", skip, true); el.removeEventListener("pointerdown", skip);
  el.classList.add("out"); setTimeout(() => el.remove(), 350);
}
const skip = ev => { if (ev && ev.type === "keydown"){ ev.preventDefault(); ev.stopPropagation(); } close(); };
addEventListener("keydown", skip, true); el.addEventListener("pointerdown", skip);
// controller: any button
(function pad(){ if (closing) return; try { for (const g of navigator.getGamepads ? navigator.getGamepads() : []) if (g && g.buttons.some(b => b.pressed)) return close(); } catch (e) {} requestAnimationFrame(pad); })();
// walk the bar while the vault loads, then show the real numbers
let p = 0;
const tick = setInterval(() => {
  if (closing) return clearInterval(tick);
  const ready = typeof EV === "object" && EV.isReady && EV.isReady();
  if (ready && !done){ done = true; fill(); }
  p = done ? Math.min(100, p + 10) : Math.min(85, p + (p < 50 ? 6 : 2));
  pct(p);
  if (!done && p >= 30 && typeof EV === "object" && EV.root()){ head(); set("vault", "ok", "found"); }
  if (done && p >= 100 && Date.now() - t0 > 1600){ clearInterval(tick); setTimeout(close, 700); }
  if (Date.now() - t0 > 15000){ clearInterval(tick); close(); }   // never block the app
}, 120);
})();
