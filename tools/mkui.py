# Builds the app's screens (ui/index.html, ui/style.css, ui/preview.js) from the design file design/emu-kluis.html,
# then adds the module script and style tags. Run it with tools/mk.sh, not by hand. ui/data/ is kept as it is.
import os, shutil, re
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
UI=ROOT+'ui/'
t=open(ROOT+'design/emu-kluis.html').read()
a=t.index('<style>'); b=t.index('</style>')
css=t[a+7:b]
fonts='''@font-face{font-family:"Silkscreen";font-weight:400;font-display:swap;src:url(fonts/silkscreen-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Sans";font-weight:400;font-display:swap;src:url(fonts/ibm-plex-sans-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Sans";font-weight:500;font-display:swap;src:url(fonts/ibm-plex-sans-latin-500-normal.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Sans";font-weight:600;font-display:swap;src:url(fonts/ibm-plex-sans-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-weight:400;font-display:swap;src:url(fonts/ibm-plex-mono-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-weight:500;font-display:swap;src:url(fonts/ibm-plex-mono-latin-500-normal.woff2) format("woff2")}
'''
open(UI+'style.css','w').write(fonts+css)
s=t.index('<script>',b); e=t.rindex('</script>')
open(UI+'preview.js','w').write(t[s+8:e])
body=t[b+8:s]
html=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Emu Vault</title>
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="bridge.css">
</head>
<body>
{body.strip()}
<script src="preview.js"></script>
<script src="bridge.js"></script>
</body>
</html>
'''
open(UI+'index.html','w').write(html)
os.makedirs(UI+'data',exist_ok=True)
# (ui/data/ is the master copy of the game lists; nothing to copy)
print('ok', len(css), e-s, len(body), len(os.listdir(UI+'data')))

# ---------------------------------------------------------------- Apps: real actions instead of pretend ones
js=open(UI+'preview.js').read()
def P(a,b,n=1):
    global js
    assert js.count(a)>=1, 'missing: '+a[:90]
    js=js.replace(a,b,n)
P('const P=M.pending[a.id], srcL={github:"GitHub",gitlab:"GitLab",web:"Website"}[a.src];',
  'const P=M.pending[a.id], srcL=a.srcLabel||{github:"GitHub",gitlab:"GitLab",web:"Website"}[a.src];')
P('<a class="btn small" href="${esc(a.url)}/releases/tag/${esc(a.update.ver)}" target="_blank" rel="noopener">Download</a>',
  '<button class="btn small" data-madl="${a.id}" data-maplat="${esc(x.plat)}" data-maname="${esc(x.name)}">${x.got?"Downloaded":"Download"}</button>')
P('<span class="hint">Download opens the release page in your browser. Then drag the file onto this card. ✓ = platforms you keep.</span>',
  '<span class="hint">Download fetches that file into Apps/${esc(a.name)}/&lt;platform&gt;/&lt;version&gt;/ and keeps the newest ${KEEP}. You can also download it yourself and drop it on this card. ✓ = platforms you keep.</span>')
P('const pathFor=(a,ver,plat,variant,file)=>`${S.dir.split("/").pop()}/Apps/${a.name}/${plat}${variant?"/"+variant:""}/${ver||"?"}/${file}`;',
  'const pathFor=(a,ver,plat,variant,file)=>`${S.dir.split("/").pop()}/Apps/${a.name}/${plat}/${ver||"?"}/${file}`;')
P('<dt>Kept files</dt><dd>${esc(base)}/Apps/&lt;app&gt;/&lt;platform&gt;/&lt;variant&gt;/&lt;version&gt;/</dd>',
  '<dt>Kept files</dt><dd>${esc(base)}/Apps/&lt;app&gt;/&lt;platform&gt;/&lt;version&gt;/, with a small .emuvault.json next to each file (where it came from, its fingerprint, the date)</dd>')
P('<dt>Versions</dt><dd>The ${KEEP} newest per app, platform and variant. A Qt and an SDL build, or stable and nightly, each keep their own ${KEEP}.</dd>',
  '<dt>Versions</dt><dd>The ${KEEP} newest per app and platform. Change the number in Settings.</dd>')
P('<dt>Your list</dt><dd>${esc(base)}/emu-vault-apps.json<br><span class="muted" style="font-size:12px">On the drive itself, so a backup or a move of the drive takes your list along.</span></dd>',
  '<dt>Your list</dt><dd>Saved with your settings (~/.config/emu-vault). Use Export to take it to another computer.</dd>')
P('<dt>GitHub · GitLab</dt><dd>Checked when Emu Vault starts and every 6 hours, with a desktop notification. Never downloads by itself.</dd>',
  '<dt>GitHub · GitLab · Codeberg</dt><dd>Checked when Emu Vault starts (at most every 6 hours), with a desktop notification. Never downloads by itself: Download fetches a file when you press it.</dd>')
P('function checkNow(){\n','function checkNow(){ return EVA.check(); }\nfunction checkNow_pretend(){\n')
P('function saveDrop(id){\n','function saveDrop(id){ return EVA.saveDrop(id); }\nfunction saveDrop_pretend(id){\n')
P('M.pending[id]=g; render();','M.pending[id]=g; g.path=file.path||""; render();')
P('const [id,file]=b.dataset.madel.split("|"); const a=M.apps.find(x=>x.id===id); a.files=a.files.filter(f=>f.file!==file); log(`Deleted ${file}`); toast(`Deleted ${file}`); render(); });',
  'const [id,file]=b.dataset.madel.split("|"); EVA.delVersion(id,file); });')
P('el.querySelectorAll("[data-maopen]").forEach(b=>b.onclick=()=>toast("Opens the folder in your file manager"));',
  'el.querySelectorAll("[data-maopen]").forEach(b=>b.onclick=()=>EVA.openApp(b.dataset.maopen));')
P('const a=M.apps.find(x=>x.id===d.edit); M.apps=M.apps.filter(x=>x.id!==d.edit); close(); log(`${a.name} removed from my apps`); toast(`${a.name} removed from your list. Its folder and files stay in Apps/.`); render(); renderHome(); };',
  'const id=d.edit; close(); EVA.removeApp(id); };')
P('function save(){\n  const d=M.sheet;\n','function save(){ const d=M.sheet; const r=save_pretend(); EVA.saveSheet(d); return r; }\nfunction save_pretend(){\n  const d=M.sheet;\n')
P('function cat(){\n','function cat(){ return EVA.catHTML(); }\nfunction cat_pretend(){\n')
P('on("ma-catadd",()=>toast("Opens a file picker for an Obtainium export"));','on("ma-catadd",()=>EVA.addPack()); el.querySelectorAll("[data-mafollow]").forEach(b=>b.onclick=()=>EVA.follow(b.dataset.mafollow)); el.querySelectorAll("[data-maunpack]").forEach(b=>b.onclick=()=>EVA.removePack(b.dataset.maunpack)); el.querySelectorAll("[data-mapack]").forEach(b=>b.onclick=()=>{ M.catOpen=M.catOpen===b.dataset.mapack?null:b.dataset.mapack; render(); }); const cq=el.querySelector("#ma-catq"); if(cq) cq.oninput=()=>{ M.catQ=cq.value; render(); const n=$("#ma-catq"); n.focus(); n.setSelectionRange(n.value.length,n.value.length); };')
P('on("ma-xgo",()=>{ const t=$("#ma-xgo").closest(".ma-row").querySelector(".ma-grow").textContent; toast(M.exp.mode==="list"?"Saves emu-vault-apps.json":`Saves emu-vault-export.zip (${t.split("·").pop().trim()})`); });',
  'on("ma-xgo",()=>EVA.exportApps());')
open(UI+'preview.js','w').write(js)
print('apps patched')
js=open(UI+'preview.js').read()
P('toast(`${a.name} ${a.update.ver} skipped. You\'ll hear about the next version.`); a.update=null;','toast(`${a.name} ${a.update.ver} skipped. You\'ll hear about the next version.`); a.skip=a.update.ver; a.update=null;')
open(UI+'preview.js','w').write(js)
open(UI+'index.html','a').close()
html=open(UI+'index.html').read()
if '<script>EV.start()</script>' not in html: html=html.replace('<script src="bridge.js"></script>','<script src="bridge.js"></script>\n<script>EV.start()</script>')
open(UI+'index.html','w').write(html)
print('ok2')
js=open(UI+'preview.js').read()
P(' · download and drop them on the app',' · press Download on the app')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
# settings file: read the real file
P('function readSettingsFile(file){\n  const fr=new FileReader();\n  fr.onload=()=>{ let data=null, err=null;',
  'function readSettingsFile(file){\n  const fr={}; EV.inv("read_text",{path:file.path}).then(t=>{ fr.result=t; fr.onload(); }).catch(e=>toast(EV.errMsg(e)));\n  fr.onload=()=>{ let data=null, err=null;')
P('  fr.readAsText(file);\n}','}')
# multi-disc: really combine
P('const doIt=ks=>{ ks.forEach(k=>D[k]=true);','const doIt=ks=>{ EV.m3u(ks); ks.forEach(k=>D[k]=true);')
# drives: real copies
P('S.romFiles.push({id:"c"+i.f.id, sys:i.sys, name:i.f.name, mb:i.f.mb, hash:i.f.hash});','S.romFiles.push({id:"c"+i.f.id, sys:i.sys, name:i.f.name, mb:i.f.mb, hash:i.f.hash, src:i.f.path, srcKind:"copy", origSys:i.sys, rel:""});')
P("if (i.kind===\"bios\"){ const e=biosFor(i.sys), k=e.files.find(x=>x.f.toLowerCase()===i.f.name.toLowerCase()); S.biosHave.add(`${i.sys}/${k?k.f:i.f.name}`); bios++; return; }",
  "if (i.kind===\"bios\"){ const e=biosFor(i.sys), k=e.files.find(x=>x.f.toLowerCase()===i.f.name.toLowerCase()); S.biosHave.add(`${i.sys}/${k?k.f:i.f.name}`); EV.queue({kind:\"copy\", from:i.f.path, to:`${EV.root()}/bios/${i.sys}/${k?k.f:i.f.name}`}); bios++; return; }")
P('else items.forEach(i=>{ drv.files.push({id:"d"+i.f.id, dir:`roms/${i.sys}`, name:i.f.name, mb:i.f.mb, hash:i.f.hash}); drv.free-=i.f.mb; roms++; });',
  'else items.forEach(i=>{ drv.files.push({id:"d"+i.f.id, dir:`roms/${i.sys}`, name:i.f.name, mb:i.f.mb, hash:i.f.hash, path:`${drv.path}/roms/${i.sys}/${i.f.name}`}); EV.queue({kind:"copy", from:i.f.path, to:`${drv.path}/roms/${i.sys}/${i.f.name}`}); drv.free-=i.f.mb; roms++; });')
P('return S.romFiles.filter(x=>!onDrive.has(x.sys+"|"+parseFile(x).key)).map(x=>({f:{id:"v-"+x.id, name:x.name, mb:x.mb, dir:`roms/${x.sys}`},',
  'return S.romFiles.filter(x=>!onDrive.has(x.sys+"|"+parseFile(x).key)).map(x=>({f:{id:"v-"+x.id, name:x.name, mb:x.mb, dir:`roms/${x.sys}`, path:x.loc},')
P('const pk=el.querySelector("#drv-pick"); if(pk) pk.onclick=()=>toast("In the real app this opens a folder picker. Any folder with ROMs works.");',
  'const pk=el.querySelector("#drv-pick"); if(pk) pk.onclick=()=>EV.pickDrive();')
P('async function scanDrive(drv){\n','async function scanDrive(drv){\n  await EV.readDrive(drv);\n')
# things the core can't do yet: say so instead of pretending
P('document.querySelectorAll("[data-chd]").forEach(b=>b.onclick=()=>{','document.querySelectorAll("[data-chd]").forEach(b=>b.onclick=()=>EV.later("CHD conversion")); if(0) document.querySelectorAll("[data-chd]").forEach(b=>b.onclick=()=>{')
P('document.querySelectorAll("[data-fe]").forEach(b=>b.onclick=()=>{ const k=b.dataset.fe;','document.querySelectorAll("[data-fe]").forEach(b=>b.onclick=()=>{ const k=b.dataset.fe; if(k!=="art") return EV.later(k==="ra"?"Writing RetroArch playlists":"Writing ES-DE game lists");')
P('const ra=$("#ra-run"); if(ra) ra.onclick=()=>{','const ra=$("#ra-run"); if(ra) ra.onclick=()=>EV.later("The RetroAchievements check"); if(0) ra.onclick=()=>{')
P('document.querySelectorAll("[data-papply]").forEach(b=>b.onclick=()=>{','document.querySelectorAll("[data-papply]").forEach(b=>b.onclick=()=>EV.later("Applying patches")); if(0) document.querySelectorAll("[data-papply]").forEach(b=>b.onclick=()=>{')
P('on("#ss-in","onclick",()=>{','on("#ss-in","onclick",()=>{ A.err="Signing in to ScreenScraper needs a developer key that Emu Vault doesn\'t have yet. Use libretro-thumbnails for now: it needs no account."; return re(); }); if(0) on("#ss-in","onclick",()=>{')
P('const ck=$("#self-check"); if(ck) ck.onclick=()=>{','const ck=$("#self-check"); if(ck) ck.onclick=()=>{ toast(`Emu Vault ${s.ver}: updating itself comes in a later version. New versions are on the page you got this one from.`); }; if(0) ck.onclick=()=>{')
# box art: real downloads from libretro-thumbnails into media/
P('const rn=$("#art-run"); if(rn) rn.onclick=()=>{','const rn=$("#art-run"); if(rn) rn.onclick=()=>EV.covers(); if(0) rn.onclick=()=>{')
open(UI+'preview.js','w').write(js)
print('ok3')
js=open(UI+'preview.js').read()
P("if(m){ S.biosHave.add(`${id}/${m.f}`); hit++; } else miss.push(file.name); }",
  "if(m){ S.biosHave.add(`${id}/${m.f}`); if(file.path) EV.queue({kind:\"copy\", from:file.path, to:`${EV.root()}/bios/${id}/${m.f}`}); hit++; } else { miss.push(file.name); if(file.path){ S.biosHave.add(`${id}/${file.name}`); EV.queue({kind:\"copy\", from:file.path, to:`${EV.root()}/bios/${id}/${file.name}`}); } } }")
P("if (miss.length) toast(`Not recognized for ${biosName(id)}: ${miss.join(\", \")}. In the real app the fingerprint is checked, so the name doesn't matter.`);",
  "if (miss.length){ const any=biosAny(id); toast(`${miss.length} file${miss.length===1?\"\":\"s\"} put in bios/${id}/ with ${miss.length===1?\"its\":\"their\"} own name${e.any&&any.length?` · counts as ${e.anyLabel||\"BIOS\"}`:\": not a name on the list, shown under In this folder\"}`); log(`BIOS ${biosName(id)}: ${miss.join(\", \")} put in bios/${id}/`); }")
open(UI+'preview.js','w').write(js)
print('ok4')
js=open(UI+'preview.js').read()
P('const saveEdits = () => {','let saveEdits = () => {')
P("  S.roms.push({id:d.folder||matchSystem(d.name)||slug(d.name).replace(/-/g,\"\"), name:d.name.trim(), ext:d.ext.join(\" \")||\"all types\", n:0, mb:0, mine:true});",
  "  const nid=d.folder||matchSystem(d.name)||slug(d.name).replace(/-/g,\"\"); S.roms.push({id:nid, name:d.name.trim(), ext:d.ext.join(\" \")||\"all types\", n:0, mb:0, mine:true}); EV.addSystem(nid);")
open(UI+'preview.js','w').write(js)
print('ok5')
js=open(UI+'preview.js').read()
P('const FOUND = [','let FOUND = [')
P('null, ()=>{ d.scanning=true; renderSheet(); setTimeout(()=>{ d.scanning=false; W.step=1; renderSheet(); },900); }',
  'null, ()=>{ d.scanning=true; renderSheet(); EV.findSetup().then(()=>{ d.scanning=false; d.pick=new Set(FOUND.map(f=>f.id)); W.step=1; renderSheet(); }); }')
P('["leave","Leave them where they are","Nothing moves. Emu Vault reads your folders where they are. Safest to start with.",true]',
  '["leave","Leave them where they are","Nothing moves. BIOS files are copied in by fingerprint and save folders are backed up from where they are. Games stay where they are.",true]')
P('["copy","Copy them into the vault",`Your originals stay. Uses ${size(mb)} extra space.`]','["copy","Copy them into the vault",`Your originals stay. Games go to the Inbox, where you check where each one goes. Uses ${size(mb)} extra space.`]')
P('["move","Move them into the vault","One clean structure in one place. Your old folders end up empty. You can undo this."]','["move","Move them into the vault","Games go to the Inbox, where you check where each one goes. Your old folders end up empty. You can undo this in Recent changes."]')
P('S.imported=true;\n','S.imported=true; EV.importSetup(picked, d.how);\n')
open(UI+'preview.js','w').write(js)
print('ok6')
js=open(UI+'preview.js').read()
P('const pa=$("#prof-apply"); if(pa) pa.onclick=()=>{','const pa=$("#prof-apply"); if(pa) pa.onclick=()=>{ pa.disabled=true; pa.textContent="Copying…"; EV.fillDrive(drv); }; if(0) pa.onclick=()=>{')
open(UI+'preview.js','w').write(js)
print('ok7')
js=open(UI+'preview.js').read()
P('<button class="btn small" onclick="openAdd(\'app\')">','<button class="btn small" data-openadd="app">')
open(UI+'preview.js','w').write(js)
html=open(UI+'index.html').read()
html=html.replace('<button class="x" onclick="closeAdd()"','<button class="x" data-closeadd="1"')
html=html.replace('<script src="bridge.js"></script>\n<script>EV.start()</script>','<script src="bridge.js"></script>')
assert 'onclick=' not in html and '<script>' not in html
open(UI+'index.html','w').write(html)
print('ok8')
js=open(UI+'preview.js').read()
P('s:artReady()?"Download them from ScreenScraper":"Sign in to ScreenScraper first", go:"art"});','s:artReady()?`Download them from ${S.art.source==="libretro"?"libretro-thumbnails":"ScreenScraper"}`:"Sign in to ScreenScraper first", go:"art"});')
P('  const last=Object.values(S.bk.snaps)[0]?.[0]||{date:"2026-10-28",time:"03:00"};\n  it.push({k:"ok", icon:"✓", t:`Saves backed up ${fmtDate(last.date)}, ${last.time}`, s:S.bk.when==="nightly"?"Next backup tonight at 03:00":S.bk.when==="weekly"?"Next backup in a week":"Backups only when you ask", go:"bk"});',
  '  if (typeof EV==="object") EV.bkHome(it);')
P('<span class="muted">Last check ${now().slice(0,5)}</span>','<span class="muted">Last check ${esc(typeof MA==="object"?MA.M.lastCheck:"")}</span>')
P('setTimeout(()=>{ checkUpdates(); renderHome(); toast("Checked apps, packs, game lists and BIOS"); },700); };','EV.checkAll(); };')
open(UI+'preview.js','w').write(js)
html=open(UI+'index.html').read()
html=html.replace('<span class="sample">Preview with sample data</span>','')
open(UI+'index.html','w').write(html)
print('ok9')
html=open(UI+'index.html').read()
html=html.replace('<span class="sample sm">Preview</span>','')
open(UI+'index.html','w').write(html)
js=open(UI+'preview.js').read()
P('if (choice==="delete"){ S.inbox=S.inbox.filter(x=>x!==f);','if (choice==="delete"){ if(f.loc) EV.queue({kind:"delete", from:f.loc, to:""}); S.inbox=S.inbox.filter(x=>x!==f);')
P('S.inbox.push({id:"r"+o.id, dir:"", name:o.name, mb:o.mb});','S.inbox.push({id:"r"+o.id, dir:"", name:o.name, mb:o.mb, loc:o.loc});')
open(UI+'preview.js','w').write(js)
print('ok10')
js=open(UI+'preview.js').read()
P('const ckey = t =>','let ckey = t =>')
P('const cands = LISTS[f.sys].filter(g=>g[2]===0||p.special.length).map(g=>({t:g[0], r:g[1], s:matchScore(p.title,g[0])})).filter(c=>c.s>0.45).sort((a,b)=>b.s-a.s).slice(0,5);',
  'const cands = EV.cands(f.sys, p);')
open(UI+'preview.js','w').write(js)
print('ok11')
html=open(UI+'index.html').read()
if 'perf.js' not in html: html=html.replace('<script src="bridge.js"></script>','<script src="bridge.js"></script>\n<script src="perf.js"></script>')
open(UI+'index.html','w').write(html)
js=open(UI+'preview.js').read()
P('const ruleRank = r =>','let ruleRank = r =>')
P('const regionRule = () =>','let regionRule = () =>')
open(UI+'preview.js','w').write(js)
html=open(UI+'index.html').read()
if 'rules.js' not in html: html=html.replace('<script src="perf.js"></script>','<script src="perf.js"></script>\n<script src="rules.js"></script>')
open(UI+'index.html','w').write(html)
print('ok12')
html=open(UI+'index.html').read()
if 'inboxui.js' not in html: html=html.replace('<script src="rules.js"></script>','<script src="rules.js"></script>\n<script src="inboxui.js"></script>')
open(UI+'index.html','w').write(html)
js=open(UI+'preview.js').read()
P('const cands=S.roms.filter(r=>CHD_SYS[r.id] && r.mb && !T.chdDone[r.id]);','const cands=EV.convRoms().filter(r=>!T.chdDone[r.id]);')
P('<div class="files">${S.roms.filter(r=>CHD_SYS[r.id]&&r.mb).map(r=>{','<div class="files">${EV.convRoms().map(r=>{')
P('${run?`<div class="prog" style="margin-top:6px"><i style="width:55%"></i></div>`:""}','${run?`<div class="prog" style="margin-top:6px"><i style="width:${T.chdPct||3}%"></i></div><div class="note">${esc(T.chdNow||"")}</div>`:""}${!done&&!run&&r.need?`<div class="note" style="color:var(--warn)">${r.need}</div>`:""}')
P('Disc images can be packed smaller: CHD for PlayStation, Saturn, Dreamcast and more, RVZ for GameCube, CSO for PSP.','Disc images can be packed smaller: CHD for PlayStation 1 and 2, PSP (PPSSPP 1.17 and newer), Saturn, Dreamcast and more, RVZ for GameCube and Wii.')
P('document.querySelectorAll("[data-chd]").forEach(b=>b.onclick=()=>EV.later("CHD conversion"));','document.querySelectorAll("[data-chd]").forEach(b=>b.onclick=()=>EV.convert(b.dataset.chd));')
open(UI+'preview.js','w').write(js)
print('ok13')
js=open(UI+'preview.js').read()
i=js.index('<div class="files">${EV.convRoms().map(r=>{')
j=js.index('}).join("")}</div></div>`;',i)
js=js[:j]+'}).join("")}</div>${EV.convertedHTML()}</div>`;'+js[j+len('}).join("")}</div></div>`;'):]
open(UI+'preview.js','w').write(js)
print('ok14')
js=open(UI+'preview.js').read()
P('document.querySelectorAll("[data-papply]").forEach(b=>b.onclick=()=>EV.later("Applying patches"));','document.querySelectorAll("[data-papply]").forEach(b=>b.onclick=()=>EV.applyPatch(b.dataset.papply, b));')
P('const pf=$("#patch-file"); if(pf) pf.onchange=()=>{','const pf=$("#patch-file"); if(pf) pf.onchange=()=>EV.addPatches([...pf.files]); if(0) pf.onchange=()=>{')
P('${p.sys?" · version matches":" · chosen by you"}','${p.sys||p.exact?" · version matches":" · chosen by you"}')
P('document.querySelectorAll("[data-fe]").forEach(b=>b.onclick=()=>{ const k=b.dataset.fe; if(k!=="art") return EV.later(k==="ra"?"Writing RetroArch playlists":"Writing ES-DE game lists");','document.querySelectorAll("[data-fe]").forEach(b=>b.onclick=()=>{ const k=b.dataset.fe; if(k!=="art") return EV.frontend(k, b);')
open(UI+'preview.js','w').write(js)
print('ok15')
js=open(UI+'preview.js').read()
P('"One playlist per system, with the right core already chosen"','"One playlist per system, with the official names. RetroArch asks for the core the first time you start a game."')
P('"Your roms/ folders already use ES-DE names. The app also writes game lists with the official names."','"Your roms/ folders already use ES-DE names. The app also writes game lists with the official names; what ES-DE already knows (favourites, play time) stays."')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('${p.sys||p.exact?" · version matches":" · chosen by you"}','${p.exact?" · version matches":p.sys?" · found by name (the patch checks the version itself)":" · chosen by you"}')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('const cands=EV.convRoms().filter(r=>!T.chdDone[r.id]);','const cands=EV.convRoms().filter(r=>r.n&&!T.chdDone[r.id]);')
P('const c=CHD_SYS[r.id], done=T.chdDone[r.id], run=T.chdRun===r.id;','const c=CHD_SYS[r.id], done=T.chdDone[r.id]||(r.n?0:-1), run=T.chdRun===r.id;')
P('${done?`Done, saved ${size(done)}`:`${r.n} games','${done<0?`Already ${c.to}: ${r.already} game${r.already===1?"":"s"}`:done?`Done, saved ${size(done)}`:`${r.already?`${r.already} already ${c.to} · `:""}${r.n} games')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
# custom ROM folder: choose the box shape
P('''        <div class="preview">Folder: <span class="mono">${esc(S.dir)}/roms/${d.folder||matchSystem(d.name)||slug(d.name).replace(/-/g,"")||"…"}/</span></div>`,
        ()=>{W.type=null; renderSheet();}, saveRom, "Add", !d.name.trim());''','''        <div id="r-shape">${EV.shapeHTML(d.folder||matchSystem(d.name)||slug(d.name).replace(/-/g,""))}</div>
        <div class="preview">Folder: <span class="mono">${esc(S.dir)}/roms/${d.folder||matchSystem(d.name)||slug(d.name).replace(/-/g,"")||"…"}/</span></div>`,
        ()=>{W.type=null; renderSheet();}, saveRom, "Add", !d.name.trim());''')
P('''$("#r-bios").innerHTML=biosBoxHTML(m);''','''$("#r-bios").innerHTML=biosBoxHTML(m); $("#r-shape").innerHTML=EV.shapeHTML(m||slug(d.name).replace(/-/g,""));''')
P('''S.roms.push({id:nid, name:d.name.trim(), ext:d.ext.join(" ")||"all types", n:0, mb:0, mine:true}); EV.addSystem(nid);''','''S.roms.push({id:nid, name:d.name.trim(), ext:d.ext.join(" ")||"all types", n:0, mb:0, mine:true}); EV.addSystem(nid); EV.keepShape(nid);''')
P('''    <div class="field"><span class="lbl">Cover region</span>''','''    ${EV.shapeSettingsHTML()}
    <div class="field"><span class="lbl">Cover region</span>''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''    ${EV.shapeSettingsHTML()}''','''    ${typeof EV!=="undefined"&&EV.shapeSettingsHTML?EV.shapeSettingsHTML():""}''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''  if (!f.sys){ f.conf="unknown"; f.id_done=true; return f; }''','''  if (!f.sys && !f.dir && typeof EV!=="undefined" && EV.guessByName){ try { const g=await EV.guessByName(p); if(g){ f.sys=g; f.sysHow="name"; } } catch(e){} }
  if (!f.sys){ f.conf="unknown"; f.id_done=true; return f; }''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''games have a cover. Translations, hacks and damaged files are skipped.</p>`;''','''games have a cover. Translations, hacks and damaged files are skipped.</p>
    <label class="inline" for="art-auto2" style="font-size:13px"><input type="checkbox" id="art-auto2" ${A.auto?"checked":""}> Download covers for new games automatically</label>`;''')
P('''<input type="checkbox" id="art-auto" ${A.auto?"checked":""}> Download covers for new games automatically</label></div>''','''<input type="checkbox" id="art-auto" ${A.auto?"checked":""}> Download covers for new games automatically</label>
      <p class="hint">On: when games are added (from the inbox, a drive, or by hand), their covers come in the background. Covers that weren't found aren't asked for again; "Download missing covers" tries all of them again.</p></div>''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
# "+", "&" and "and" are the same; "2 Games in One" = "2 Games in 1"
P('''  let key = title.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/&/g," and ")''','''  let key = title.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[&+]/g," and ").replace(/\\bin one\\b/g,"in 1")''')
P('''  .replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").replace(/\\b(the|version|edition)\\b/g," ").replace(/\\s+/g," ").trim();
const mySystems''','''  .replace(/[&+]/g," and ").replace(/\\bin one\\b/g,"in 1").replace(/[^a-z0-9]+/g," ").replace(/\\b(the|version|edition)\\b/g," ").replace(/\\s+/g," ").trim();
const mySystems''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''If it doesn't, it stops before it starts instead of halfway.</p></div></div>''','''If it doesn't, it stops before it starts instead of halfway.</p></div>${typeof EV!=="undefined"&&EV.dupStoreHTML?EV.dupStoreHTML():""}</div>''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''      <div class="frow"><span class="dot on"></span><div><div class="fn">Daijishō</div><div class="note">Point Daijishō at <span class="mono">${esc(S.dir)}/roms/</span>. It finds every system by its folder name.</div></div><span class="pill ok">ready</span></div>
''','')
P('''"Your roms/ folders already use ES-DE names. The app also writes game lists with the official names; what ES-DE already knows (favourites, play time) stays."''','''"Your roms/ folders already use ES-DE names. The app also writes game lists with the official names; what ES-DE already knows (favourites, play time) stays. Tip: Daijishō on Android finds the same folders by their names."''')
P('''<button class="btn small" id="h-check">Check everything</button>''','''<button class="btn small" id="h-check" title="Apps, your library, the Inbox and BIOS">Check everything</button>''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''    <div class="form set-sec" id="space-sec"><h2>Storage</h2>''','''    ${typeof EV!=="undefined"&&EV.bgHTML?EV.bgHTML():""}
    <div class="form set-sec" id="space-sec"><h2>Storage</h2>''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''    ${typeof EV!=="undefined"&&EV.bgHTML?EV.bgHTML():""}''','''    ${typeof EV!=="undefined"&&EV.bgHTML?EV.bgHTML():""}
    ${typeof EV!=="undefined"&&EV.extraHTML?EV.extraHTML():""}''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''before a game crashes halfway.</p>`}</div>`;''','''before a game crashes halfway.</p>`}${typeof EV!=="undefined"&&EV.listsHTML?EV.listsHTML():""}</div>`;''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''      <div class="frow"><span class="dot ${fe.esde?"on":""}"></span><div><div class="fn">ES-DE</div><div class="note">${fe.esde?"Game lists written for every system":"Your roms/ folders already use ES-DE names. The app also writes game lists with the official names; what ES-DE already knows (favourites, play time) stays. Tip: Daijishō on Android finds the same folders by their names."}</div></div><button class="btn small" data-fe="esde">${fe.esde?"Update":"Write game lists"}</button></div>''','''      ${typeof EV!=="undefined"&&EV.esdeHTML?EV.esdeHTML():""}''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
import re as _re
i=js.index('<h3>Show your games in a frontend</h3>')
s=js.rindex('h+=`<div class="sys-block tool"',0,i)
e=js.index('</div></div>`;',i)+len('</div></div>`;')
js=js[:s]+'''h+=`<div class="sys-block tool" id="esde-tool" style="margin-top:12px"><header><div><h3>ES-DE</h3><div class="used">Your games in one menu, with covers and videos</div></div>${typeof EV!=="undefined"&&EV.esdePill?EV.esdePill():""}</header>
    <div class="files">
      ${typeof EV!=="undefined"&&EV.esdeHTML?EV.esdeHTML():""}
    </div></div>`;'''+js[e:]
P('''<button class="btn small" id="h-check" title="Apps, your library, the Inbox and BIOS">Check everything</button></div>`;''','''<span style="display:flex;gap:8px;flex-wrap:wrap">${typeof EV!=="undefined"&&EV.esdeHomeBtn?EV.esdeHomeBtn():""}<button class="btn small" id="h-check" title="Apps, your library, the Inbox and BIOS">Check everything</button></span></div>`;''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
# Collection: every cover, not 80 at a time
js=js.replace('limit:80','limit:1e6').replace('C.limit=80','C.limit=1e6').replace('S.coll.limit=80','S.coll.limit=1e6')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''s:artReady()?`Download them from ${S.art.source==="libretro"?"libretro-thumbnails":"ScreenScraper"}`:"Sign in to ScreenScraper first", go:"art"});''','''s:S.art.from==="esde"?"See which ones, and scrape them in ES-DE":"See which ones, and download them from libretro-thumbnails", go:"art"});''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''  art:()=>go("roms",()=>{ S.romView="tools"; S.ui.open.add("blk:art-tool"); renderRoms(); }),''','''  art:()=>go("roms",()=>{ S.romView="tools"; S.ui.open.add("blk:art-tool"); S.ui.open.add("art:miss"); renderRoms(); setTimeout(()=>{ const el=document.querySelector('[data-k="art:miss"]')||$("#art-tool"); if(el) el.scrollIntoView({block:"start"}); },30); }),''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''      ${typeof EV!=="undefined"&&EV.esdeHTML?EV.esdeHTML():""}
    </div></div>`;''','''      ${typeof EV!=="undefined"&&EV.esdeHTML?EV.esdeHTML():""}
    </div></div>`;
  h+=`<div class="sys-block tool" id="rarch-tool" style="margin-top:12px"><header><div><h3>RetroArch</h3><div class="used">Plays most retro systems, in the vault with its cores and saves</div></div>${typeof EV!=="undefined"&&EV.rarchPill?EV.rarchPill():""}</header>
    ${typeof EV!=="undefined"&&EV.rarchHTML?EV.rarchHTML():""}</div>`;''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''<span class="kind ${kl[0]}">${kl[1]}</span></header>
      ${ign?''','''<span class="kind ${kl[0]}">${kl[1]}</span></header>
      ${!ign&&typeof EV!=="undefined"&&EV.discHint?EV.discHint(g):""}
      ${ign?''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''Review ${groups.length} games with duplicates</button>`:""}</span></div><div class="grid2">`;''','''Review ${groups.length} games with duplicates</button>`:""}</span></div>${typeof EV!=="undefined"&&EV.readyHTML?EV.readyHTML():""}<div class="grid2">`;''')
P('''      <button class="linkbtn" data-fopen="${f.id}" aria-expanded="${open}">${open?"Less":"Details"}</button>''','''      <span style="display:flex;gap:10px;align-items:center">${!inTrash?`<button class="linkbtn" data-play="${f.id}">▶ Play</button>`:""}<button class="linkbtn" data-fopen="${f.id}" aria-expanded="${open}">${open?"Less":"Details"}</button></span>''')
P('''    ${typeof EV!=="undefined"&&EV.rarchHTML?EV.rarchHTML():""}</div>`;''','''    ${typeof EV!=="undefined"&&EV.rarchHTML?EV.rarchHTML():""}</div>`;
  h+=`<div class="sys-block tool" id="vemu-tool" style="margin-top:12px"><header><div><h3>Emulators in the vault</h3><div class="used">PCSX2, DuckStation, Cemu… standalone, with their settings in the vault</div></div>${typeof EV!=="undefined"&&EV.vemuPill?EV.vemuPill():""}</header>
    ${typeof EV!=="undefined"&&EV.vemuHTML?EV.vemuHTML():""}</div>`;''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
# Collection: what you still miss, not BIOS (that's in Roms › Overview and BIOS)
P('''      ${p&&biosChip(i.id)?`<span>${biosChip(i.id)}</span>`:""}</button>`; };''','''      ${p?`<span class="muted" style="font-size:12px">${p.have>=visCount(i)?"complete":`${nl(Math.max(0,visCount(i)-p.have))} still to find`}</span>`:""}</button>`; };''')
open(UI+'preview.js','w').write(js)
js=open(UI+'preview.js').read()
P('''  if (it.file) h+=`<div class="mono" style="font-size:12px;overflow-wrap:anywhere;color:var(--muted)">${esc(it.file.name)} ${locLink(romPath(it.file.sys,it.file.name))}</div>`;''','''  if (it.file) h+=`<div class="mono" style="font-size:12px;overflow-wrap:anywhere;color:var(--muted)">${esc(it.file.name)} ${locLink(romPath(it.file.sys,it.file.name))}</div>${it.file.id&&!String(it.file.id).startsWith("c")?`<div class="gact" style="margin:0"><button class="btn primary small" data-play="${esc(it.file.id)}">▶ Play</button></div>`:""}`;''')
open(UI+'preview.js','w').write(js)
html=open(UI+'index.html').read()
if 'keys.js' not in html: html=html.replace('<script src="inboxui.js"></script>','<script src="inboxui.js"></script>\n<script src="keys.js"></script>')
open(UI+'index.html','w').write(html)
js=open(UI+'preview.js').read()
P('start:b(9)};','start:b(9), lt:b(6), rt:b(7)};')
P('if(st.start) press("start",openSearch);','if(st.start) press("start",openSearch); if(st.lt) press("lt",()=>window.padPage&&padPage(-1)); if(st.rt) press("rt",()=>window.padPage&&padPage(1));')
open(UI+'preview.js','w').write(js)
html=open(UI+'index.html').read()
html=html.replace('<span>LB / RB Tabs</span></div>','<span>LB / RB Tabs</span><span class="opt2">LT / RT Page</span></div>')
open(UI+'index.html','w').write(html)
# 0.6.8: GOG backups module (own files; remove these two lines and gog.js/gog.css to take it out)
html=open(UI+'index.html').read()
if 'gog.js' not in html:
    assert '<link rel="stylesheet" href="bridge.css">' in html and '<script src="preview.js"></script>' in html
    html=html.replace('<link rel="stylesheet" href="bridge.css">','<link rel="stylesheet" href="bridge.css">\n<link rel="stylesheet" href="gog.css">',1)
    html=html.replace('<script src="preview.js"></script>','<script src="gog.js"></script>\n<script src="preview.js"></script>',1)
open(UI+'index.html','w').write(html)
# 0.7.2: "Make a full package" (own file)
html=open(UI+'index.html').read()
if 'full.js' not in html:
    assert '<script src="keys.js"></script>' in html
    html=html.replace('<script src="keys.js"></script>','<script src="keys.js"></script>\n<script src="full.js"></script>',1)
open(UI+'index.html','w').write(html)
# 0.7.8: ES-DE folder names in the Collection
html=open(UI+'index.html').read()
if 'esde.js' not in html:
    html=html.replace('<script src="full.js"></script>','<script src="full.js"></script>\n<script src="esde.js"></script>',1)
    open(UI+'index.html','w').write(html)
# 0.7.9: Test buttons on duplicates
html=open(UI+'index.html').read()
if 'duptest.js' not in html:
    html=html.replace('<script src="esde.js"></script>','<script src="esde.js"></script>\n<script src="duptest.js"></script>',1)
    open(UI+'index.html','w').write(html)
# 0.9.0: Setup check (before preview.js, so its tab is a normal tab)
html=open(UI+'index.html').read()
if 'setup.js' not in html:
    html=html.replace('<script src="gog.js"></script>','<script src="gog.js"></script>\n<script src="setup.js"></script>',1)
    open(UI+'index.html','w').write(html)
# 0.10: Apps per platform + catalog (own files appsplat.js/appsplat.css; after bridge.js)
html=open(UI+'index.html').read()
if 'appsplat.js' not in html:
    html=html.replace('<script src="duptest.js"></script>','<script src="duptest.js"></script>\n<script src="appsplat.js"></script>',1)
    html=html.replace('<link rel="stylesheet" href="gog.css">','<link rel="stylesheet" href="gog.css">\n<link rel="stylesheet" href="appsplat.css">',1)
    open(UI+'index.html','w').write(html)
# 0.10.4: own BIOS folders (biosown.js, after appsplat.js)
html=open(UI+'index.html').read()
if 'biosown.js' not in html:
    html=html.replace('<script src="appsplat.js"></script>','<script src="appsplat.js"></script>\n<script src="biosown.js"></script>',1)
    open(UI+'index.html','w').write(html)
# 0.11: RetroArch extras (raextras.js, after biosown.js)
html=open(UI+'index.html').read()
if 'raextras.js' not in html:
    html=html.replace('<script src="biosown.js"></script>','<script src="biosown.js"></script>\n<script src="raextras.js"></script>',1)
    open(UI+'index.html','w').write(html)
# 0.12: simple Apps page (simple.js after raextras.js, simple.css after appsplat.css)
html=open(UI+'index.html').read()
if 'simple.js' not in html:
    html=html.replace('<script src="raextras.js"></script>','<script src="raextras.js"></script>\n<script src="simple.js"></script>',1)
    html=html.replace('<link rel="stylesheet" href="appsplat.css">','<link rel="stylesheet" href="appsplat.css">\n<link rel="stylesheet" href="simple.css">',1)
    open(UI+'index.html','w').write(html)
# 0.12.1: BIOS tabs (biostabs.js, after simple.js so it wraps renderBios last)
html=open(UI+'index.html').read()
if 'biostabs.js' not in html:
    html=html.replace('<script src="simple.js"></script>','<script src="simple.js"></script>\n<script src="biostabs.js"></script>',1)
    open(UI+'index.html','w').write(html)
# 0.13: APPS group in the menu (appsnav.js after biostabs.js)
html=open(UI+'index.html').read()
if 'appsnav.js' not in html:
    html=html.replace('<script src="biostabs.js"></script>','<script src="biostabs.js"></script>\n<script src="appsnav.js"></script>',1)
    open(UI+'index.html','w').write(html)
# 0.14: menu groups (menu.js after appsnav.js)
html=open(UI+'index.html').read()
if 'menu.js' not in html:
    html=html.replace('<script src="appsnav.js"></script>','<script src="appsnav.js"></script>\n<script src="menu.js"></script>',1)
    open(UI+'index.html','w').write(html)
# 0.15: startup screen (splash.css in head, splash.js first thing in body)
html=open(UI+'index.html').read()
if 'splash.js' not in html:
    html=html.replace('</head>','<link rel="stylesheet" href="splash.css">\n</head>',1)
    html=re.sub(r'(<body[^>]*>)', r'\1\n<script src="splash.js"></script>', html, count=1)
    open(UI+'index.html','w').write(html)
# 0.16: Emu Vault updates itself (selfupd.js after menu.js)
html=open(UI+'index.html').read()
if 'selfupd.js' not in html:
    html=html.replace('<script src="menu.js"></script>','<script src="menu.js"></script>\n<script src="selfupd.js"></script>',1)
    html=html.replace('</head>','<link rel="stylesheet" href="selfupd.css">\n</head>',1)
    open(UI+'index.html','w').write(html)
