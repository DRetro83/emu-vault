"use strict";
// Emu Vault — keyboard (and controller) everywhere:
//   arrows move to the nearest thing in that direction, Enter/Space presses it,
//   Backspace/Escape go back one step (close what's open, then back to the overview, then Home),
//   [ and ] switch tabs. Works with or without controller mode.
{
  const TYPING = el => el && ((el.tagName === "INPUT" && !/^(checkbox|radio|button|submit|range|color|file)$/i.test(el.type)) || el.tagName === "TEXTAREA" || el.isContentEditable);
  const FOCUSABLE = 'button:not([disabled]),a[href],input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea,summary,[role="button"][tabindex="0"],[tabindex="0"]';
  const shown = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const s = getComputedStyle(el); if (s.visibility === "hidden" || s.display === "none") return false; return !el.closest("[hidden],details:not([open]) > :not(summary)"); };
  const scope = () => { for (const id of ["cmdk", "lbx", "sheet"]){ const el = document.getElementById(id); if (el && !el.hidden) return el; } return document.body; };
  const list = sc => [...sc.querySelectorAll(FOCUSABLE)].filter(shown);

  function move(dir){
    const sc = scope(), all = list(sc), cur = document.activeElement;
    if (!cur || cur === document.body || !sc.contains(cur) || !shown(cur)){
      const main = sc === document.body ? (document.querySelector("section.view:not([hidden])") || document.querySelector("main.app") || document.body) : sc;
      const first = list(main)[0] || all[0]; if (first){ first.focus(); first.scrollIntoView({ block: "nearest" }); } return;
    }
    const a = cur.getBoundingClientRect();
    let best = null, bs = Infinity;
    for (const el of all){
      if (el === cur || el.contains(cur) || cur.contains(el)) continue;
      const b = el.getBoundingClientRect();
      let primary, perp, overlap;
      if (dir === "right" || dir === "left"){
        primary = dir === "right" ? b.left - a.right : a.left - b.right;
        if (primary < -Math.min(a.width, b.width) / 2) continue;
        overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        perp = Math.abs((b.top + b.bottom) / 2 - (a.top + a.bottom) / 2);
      } else {
        primary = dir === "down" ? b.top - a.bottom : a.top - b.bottom;
        if (primary < -Math.min(a.height, b.height) / 2) continue;
        overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        perp = Math.abs(Math.max(b.left, a.left) - a.left) + (overlap > 0 ? 0 : Math.abs((b.left + b.right) / 2 - (a.left + a.right) / 2));
      }
      const score = Math.max(primary, 0) + perp * (overlap > 0 ? 0.4 : 3) + (overlap > 0 ? 0 : 40);
      if (score < bs){ bs = score; best = el; }
    }
    if (best){ best.focus({ preventScroll: true }); best.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    else if (dir === "down" || dir === "up") window.scrollBy({ top: dir === "down" ? 200 : -200 });
  }

  const KEYS = ["data-open-sys", "data-rv", "data-cv", "data-rom", "data-tab", "id"];
  const memo = {};   // view -> how to find the item you opened from there
  const viewKey = () => (document.querySelector('.tab[aria-selected="true"]')?.dataset.tab || "") + ":" + (typeof S !== "undefined" ? (S.coll?.view || "") + "/" + (S.romView || "") : "");
  document.addEventListener("click", e => {
    const el = e.target.closest && e.target.closest(KEYS.map(k => `[${k}]`).join(","));
    if (!el) return;
    const k = KEYS.find(k => el.hasAttribute(k)); if (!k || (k === "id" && !el.id)) return;
    memo[viewKey()] = `[${k}="${CSS.escape(el.getAttribute(k))}"]`;
  }, true);
  const restore = () => setTimeout(() => {
    const sel = memo[viewKey()], view = document.querySelector("section.view:not([hidden])") || document.body;
    const el = sel && [...document.querySelectorAll(sel)].find(shown);
    const f = el || list(view)[0];
    if (f){ f.focus({ preventScroll: true }); f.scrollIntoView({ block: "center" }); }
  }, 40);

  function back(){
    const q = id => document.getElementById(id);
    if (q("cmdk") && !q("cmdk").hidden) return typeof closeSearch === "function" && closeSearch();
    if (q("lbx") && !q("lbx").hidden) return typeof closeLbx === "function" && closeLbx();
    if (q("sheet") && !q("sheet").hidden) return typeof closeAdd === "function" && closeAdd();
    const cur = document.activeElement;
    // close what you're in: a folded block or an open section, and stay on its title
    const det = cur && cur.closest && cur.closest("details[open]");
    if (det){ const sum = det.querySelector(":scope > summary"); det.open = false; if (sum) sum.focus(); return; }
    const blk = cur && cur.closest && cur.closest(".sys-block.fold.open");
    if (blk){ const h = blk.querySelector(":scope > header"); if (h){ h.click(); h.focus(); return; } }
    const tab = document.querySelector('.tab[aria-selected="true"]')?.dataset.tab;
    const refocus = restore;
    if (tab === "coll" && S.coll.view === "systeem"){ S.coll.view = "overzicht"; renderColl(); window.scrollTo(0, 0); refocus(); return; }
    if (tab === "roms" && S.romView && S.romView !== "overzicht"){ S.romView = "overzicht"; renderRoms(); window.scrollTo(0, 0); refocus(); return; }
    if (tab && tab !== "home"){ go("home"); window.scrollTo(0, 0); refocus(); }
  }
  // a page up or down (PageUp/PageDown, Home/End, LT/RT on a controller): like jumping in ES-DE's lists
  function page(d, all){
    const sc = scope(), items = list(sc === document.body ? (document.querySelector("section.view:not([hidden])") || document.body) : sc);
    if (!items.length) return;
    const cur = document.activeElement, i = items.indexOf(cur);
    let n;
    if (all) n = d > 0 ? items.length - 1 : 0;
    else {
      const y = cur && cur.getBoundingClientRect ? cur.getBoundingClientRect().top : 0, h = innerHeight * 0.8;
      n = d > 0 ? items.findIndex(el => el.getBoundingClientRect().top > y + h) : (() => { let k = -1; items.forEach((el, j) => { if (el.getBoundingClientRect().top < y - h) k = j; }); return k; })();
      if (n < 0) n = d > 0 ? items.length - 1 : 0;
    }
    if (i === n && !all) return;
    items[n].focus({ preventScroll: true }); items[n].scrollIntoView({ block: "center" });
  }
  window.padPage = d => page(d);
  // the controller uses the same moves and the same "back"
  padMove = move;
  padBack = back;

  window.addEventListener("keydown", e => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const el = document.activeElement, typing = TYPING(el);
    const lbxOpen = document.getElementById("lbx") && !document.getElementById("lbx").hidden;
    const arrows = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (arrows[e.key]){
      if (typing && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;      // move the cursor in the text
      if (document.getElementById("cmdk") && !document.getElementById("cmdk").hidden && (e.key === "ArrowUp" || e.key === "ArrowDown")) return; // search list
      if (lbxOpen && (e.key === "ArrowLeft" || e.key === "ArrowRight")){ e.preventDefault(); e.stopImmediatePropagation(); stepLbx(e.key === "ArrowRight" ? 1 : -1); return; }
      e.preventDefault(); e.stopImmediatePropagation(); move(arrows[e.key]); return;
    }
    if ((e.key === "Backspace" && !typing) || (e.key === "Escape")){
      if (e.key === "Escape" && typing && el.value){ return; }
      e.preventDefault(); e.stopImmediatePropagation(); back(); return;
    }
    if (!typing && (e.key === "PageDown" || e.key === "PageUp")){ e.preventDefault(); e.stopImmediatePropagation(); page(e.key === "PageDown" ? 1 : -1); return; }
    if (!typing && (e.key === "Home" || e.key === "End")){ e.preventDefault(); e.stopImmediatePropagation(); page(e.key === "End" ? 1 : -1, true); return; }
    if (!typing && (e.key === "[" || e.key === "]")){ e.preventDefault(); e.stopImmediatePropagation(); padTab(e.key === "]" ? 1 : -1); return; }
    // Enter / Space on things that act like a button
    if ((e.key === "Enter" || e.key === " ") && el && el.getAttribute && el.getAttribute("role") === "button" && !/^(BUTTON|A|SUMMARY|INPUT|SELECT|TEXTAREA|HEADER)$/.test(el.tagName)){
      e.preventDefault(); el.click();
    }
  }, true);
}
