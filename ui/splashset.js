// 0.16.1: turn the startup screen (splash.js) off or on in HOME › Settings › Look.
// splash.js already reads localStorage ev-splash = "off"; this module only adds the switch for it.
// Own module: remove this file and its line in index.html (tools/mkui.py) to take it out.
(() => {
if (!window.__TAURI__) return;   // the startup screen only runs in the app, not in the preview
const KEY = "ev-splash";
const isOn = () => { try { return localStorage.getItem(KEY) !== "off"; } catch (e) { return true; } };
const setOn = on => { try { if (on) localStorage.removeItem(KEY); else localStorage.setItem(KEY, "off"); } catch (e) {} };

function add(){
  if (document.getElementById("sp-set")) return;
  const skin = document.querySelector("#view-set [data-skin]"), form = skin && skin.closest(".form");
  if (!form) return;
  form.insertAdjacentHTML("beforeend", `<div class="field" id="sp-set"><label class="inline" for="sp-on"><input type="checkbox" id="sp-on" ${isOn() ? "checked" : ""}> Show the startup screen</label><p class="hint">The Emu Vault logo and a quick check of your vault when the app opens. Takes effect the next time you start Emu Vault.</p></div>`);
}
document.addEventListener("change", ev => {
  if (!ev.target || ev.target.id !== "sp-on") return;
  setOn(ev.target.checked);
  if (typeof toast === "function") toast(ev.target.checked ? "Startup screen on" : "Startup screen off");
});
window.addEventListener("DOMContentLoaded", () => {
  const rs = window.renderSet; if (typeof rs !== "function") return;
  window.renderSet = function(){ const r = rs.apply(this, arguments); try { add(); } catch (e) { console.error(e); } return r; };
  try { add(); } catch (e) {}
});
})();
