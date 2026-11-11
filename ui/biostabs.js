// 0.12.1: the BIOS page in two tabs. "My BIOS": the numbers, the filters and your systems.
// "Add BIOS": Import BIOS, your own BIOS folder and the RetroArch BIOS folder. Own module: remove this file
// and its line in index.html to take it out.
(() => {
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
let tab = ls("ev-bios-tab") === "add" ? "add" : "mine";
const ADD = [".bios-imp", "#bown", ".bios-rab"];
// setup.js adds its boxes on DOMContentLoaded: wrap after it, so the tabs see every box
window.addEventListener("DOMContentLoaded", () => {
const orig = window.renderBios;
window.renderBios = function(){
  orig.apply(this, arguments);
  const v = document.getElementById("view-bios"); if (!v) return;
  v.querySelector(".bt-tabs")?.remove();
  const add = ADD.map(s => v.querySelector(s)).filter(Boolean);
  const kids = [...v.children];
  for (const c of kids) c.hidden = tab === "add" ? !add.includes(c) : add.includes(c);
  const n = (S.biosHave && S.biosHave.size) || 0;
  v.insertAdjacentHTML("afterbegin", `<div class="bt-tabs" role="tablist"><button role="tab" class="sv-tab" data-bttab="mine" aria-selected="${tab === "mine"}" aria-pressed="${tab === "mine"}">My BIOS</button><button role="tab" class="sv-tab" data-bttab="add" aria-selected="${tab === "add"}" aria-pressed="${tab === "add"}">Add BIOS</button>
    <span class="sv-mode">${tab === "mine" ? `Files to add? <button class="linkbtn" data-bttab="add">Import or make a folder</button>` : `<button class="linkbtn" data-bttab="mine">← Back to my BIOS</button>`}</span></div>`);
  if (tab === "add" && !add.length) v.querySelector(".bt-tabs").insertAdjacentHTML("afterend", `<div class="empty-state">Import and the RetroArch BIOS folder are only in the app.</div>`);
};
});
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-bttab]"); if (!t) return;
  ev.preventDefault(); tab = t.dataset.bttab; ls("ev-bios-tab", tab); renderBios(); window.scrollTo(0, 0);
});
})();
