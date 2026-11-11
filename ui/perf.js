"use strict";
// Emu Vault — speed for big libraries (thousands of games, hundreds of inbox files).
// Same results as the screens' own code, only remembered instead of worked out again each time.
{
  // file names: parsed once
  const PR = new Map(), _pr = parseRom;
  parseRom = function(name){ let c = PR.get(name); if (!c){ c = _pr(name); PR.set(name, c); if (PR.size > 200000) PR.clear(); } return { ...c, regions: [...c.regions], special: [...c.special] }; };
  const CK = new Map(), _ck = ckey;
  ckey = t => { let c = CK.get(t); if (c === undefined){ c = _ck(t); CK.set(t, c); if (CK.size > 400000) CK.clear(); } return c; };
  // a file: parsed once, again when its name or database name changes
  const PF = new WeakMap(), _pf = parseFile;
  parseFile = function(f){ const dat = DAT[f.hash] || "", c = PF.get(f); if (c && c.n === f.name && c.d === dat && c.h === f.hash) return c.p; const p = _pf(f); PF.set(f, { n: f.name, d: dat, h: f.hash, p }); return p; };
  // the library changes rarely compared to how often it is looked at
  let sigArr = null, sigLen = -1, sigT = 0, sig = "";
  const libSig = () => { const a = S.romFiles, now = Date.now(); if (a !== sigArr || a.length !== sigLen || now - sigT > 400){ sigArr = a; sigLen = a.length; sigT = now; sig = a.length + ":" + a.map(f => f.id + "\u0001" + f.name + "\u0001" + f.sys).join("\u0002"); } return sig; };
  const _fd = findDups; let fdKey = null, fdVal = null;
  findDups = function(){ const k = libSig() + "|" + S.regions.join() + "|" + [...S.dupIgnored].join() + "|" + Object.keys(DAT).length; if (k !== fdKey){ fdVal = _fd.apply(this, arguments); fdKey = k; } return fdVal; };
  // inbox: which of your games has the same title
  let ovKey = null, ovIdx = null;
  ownedVersions = function(f){
    if (!f.sys || !f.title) return [];
    const k = libSig(); if (k !== ovKey){ ovKey = k; ovIdx = new Map(); S.romFiles.forEach(x => { const p = parseFile(x); if (p.special.length) return; const kk = x.sys + "|" + p.key; let a = ovIdx.get(kk); if (!a) ovIdx.set(kk, a = []); a.push({ x, p }); }); }
    return (ovIdx.get(f.sys + "|" + ckey(f.title)) || []).slice();
  };
  // inbox: candidates from the game list, scored only for titles that share a word
  const IDX = {};
  EV.cands = function(sys, p){
    const L = LISTS[sys]; let ix = IDX[sys];
    if (!ix || ix.L !== L){ ix = IDX[sys] = { L, exact: new Map(), words: new Map() }; L.forEach((g, i) => { const k = ckey(g[0]); if (!ix.exact.has(k)) ix.exact.set(k, i); new Set(k.split(" ")).forEach(w => { if (!w) return; let a = ix.words.get(w); if (!a) ix.words.set(w, a = []); a.push(i); }); }); }
    const ok = g => g[2] === 0 || p.special.length;
    const q = ckey(p.title); if (!q) return [];
    const e = ix.exact.get(q);
    const pool = new Set(); q.split(" ").forEach(w => (ix.words.get(w) || []).forEach(i => pool.add(i)));
    if (e !== undefined) pool.add(e);
    return [...pool].map(i => L[i]).filter(ok).map(g => ({ t: g[0], r: g[1], s: matchScore(p.title, g[0]) })).filter(c => c.s > 0.45).sort((a, b) => b.s - a.s).slice(0, 5);
  };
}
