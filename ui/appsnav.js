// 0.13: APPS gets its own group in the menu, under GOG: Linux x64, Linux ARM, Windows x64, Windows ARM, Android
// (64-bit and 32-bit inside) and Get more apps. A section shows when you keep it in Settings or an app of yours
// keeps it. The old Apps item under EMU is hidden. Own module: remove this file and its line in index.html.
const EVN = (() => {
const e = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ICON = {
  linux: '<path d="M12 3c-2 0-3 1.8-3 4v2c0 1-1.5 2.5-2.5 4.5S5 17 6 18s3 .5 4-1h4c1 1.5 3 2 4 1s.5-2.5-.5-4.5S15 10 15 9V7c0-2.2-1-4-3-4z"/>',
  arm: '<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M9 3v4M12 3v4M15 3v4M9 17v4M12 17v4M15 17v4M3 9h4M3 12h4M3 15h4M17 9h4M17 12h4M17 15h4"/>',
  win: '<path d="M4 5.5l7-1v7H4zM13 4.2l7-1.2v8.5h-7zM4 12.5h7v7l-7-1zM13 12.5h7V21l-7-1.2z"/>',
  android: '<rect x="6" y="8" width="12" height="10" rx="2"/><path d="M8 5l1.5 2.5M16 5l-1.5 2.5M9 18v3M15 18v3"/><circle cx="10" cy="11" r=".6"/><circle cx="14" cy="11" r=".6"/>',
  more: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
};
const ITEMS = [["linux", "Linux x64", ICON.linux], ["linux@arm64", "Linux ARM", ICON.arm], ["windows", "Windows x64", ICON.win], ["windows@arm64", "Windows ARM", ICON.arm], ["android", "Android", ICON.android]];
const btn = (k, lb, ic) => `<button class="tab apps-tab" role="tab" data-apsec="${k}" aria-selected="false" hidden><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg><span class="lb">${lb}</span><span class="n quiet" id="n-ap-${k.replace(/[@~]/g, "-")}"></span></button>`;
let built = false;
function build(){
  if (built) return; const nav = document.querySelector("nav.tabs"); if (!nav) return;
  const after = nav.querySelector('.gog-tab[data-tab="gogset"]') || nav.querySelector('[data-tab="set"]'); if (!after) return;
  after.insertAdjacentHTML("afterend", `<div class="rbar side-sec apps-sec" role="presentation"><span>APPS</span></div>` + ITEMS.map(([k, l, i]) => btn(k, l, i)).join("") + btn("cat", "Get more apps", ICON.more).replace(" hidden>", ">"));
  const old = nav.querySelector('.tab[data-tab="emu"]'); if (old) old.hidden = true;
  nav.querySelectorAll(".apps-tab").forEach(b => b.addEventListener("click", () => go2(b.dataset.apsec)));
  built = true; show(); counts();
}
function go2(k){
  const old = document.querySelector('.tab[data-tab="emu"]'); if (old) old.click();
  if (k === "cat"){ MA.M.sub = "cat"; MA.render(); }
  else if (window.EVS) EVS.setSec(k);
  mark();
}
// which item is lit, and the page title
function mark(){
  const sub = MA.M.sub, sec = window.EVS ? EVS.sec : "linux", v = document.getElementById("view-emu");
  const onApps = v && !v.hidden;
  document.querySelectorAll(".apps-tab").forEach(b => { const k = b.dataset.apsec; b.setAttribute("aria-selected", String(onApps && (sub === "cat" ? k === "cat" : k === "cat" ? false : (k === sec || (k === "android" && sec.startsWith("android")))))); });
  const pt = document.getElementById("ptitle");
  if (onApps && pt) pt.textContent = "apps/" + (sub === "cat" ? "get more" : (window.EVS ? EVS.SECN[sec] || sec : "")).toLowerCase().replace(/ /g, "-");
}
const keyOf = k => (window.EVS ? EVS.secKey(k) : k);
function used(k){
  const K = keyOf(k), P = (typeof S === "object" && S.plats) || [];
  if (P.includes(k) || (k === "android" && P.includes("android@arm32"))) return true;
  return MA.M.apps.some(a => (a.keys || []).includes(K) || (k === "android" && (a.keys || []).includes(keyOf("android@arm32"))));
}
function show(){ document.querySelectorAll(".apps-tab").forEach(b => { const k = b.dataset.apsec; if (k !== "cat") b.hidden = !used(k); }); }
function counts(){
  if (!built || !window.EVS) return;
  for (const [k] of ITEMS){
    const n = document.getElementById("n-ap-" + k.replace(/[@~]/g, "-")); if (!n) continue;
    const keys = k === "android" ? [keyOf("android"), keyOf("android@arm32")] : [keyOf(k)];
    const apps = MA.M.apps.filter(a => !a.retired && keys.some(K => (a.keys || []).includes(K)));
    const up = apps.filter(a => keys.some(K => (a.keys || []).includes(K) && EVS.stateIn(a, K).k === "new")).length;
    n.textContent = up ? `${up} update${up > 1 ? "s" : ""}` : apps.length ? String(apps.length) : "";
  }
  show(); mark();
}
// keep the menu in step with the page
if (typeof EVAP === "object"){ const prev = EVAP.after; EVAP.after = function(el){ prev(el); counts(); }; }
const mo = new MutationObserver(() => { clearTimeout(mo.t); mo.t = setTimeout(counts, 150); });
window.addEventListener("DOMContentLoaded", () => { build(); const v = document.getElementById("myapps"); if (v) mo.observe(v, { childList: true }); document.querySelectorAll('.tab:not(.apps-tab)').forEach(t => t.addEventListener("click", () => setTimeout(mark, 0))); });
setInterval(counts, 5000);
return { mark, counts, go: go2 };
})();
window.EVN = EVN;
