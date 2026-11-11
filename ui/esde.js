// ES-DE folder names (all 178 of them): a folder in roms/ with games always shows in the Collection.
// Same console under another ES-DE name (genesis, famicom, sfc, tg16, fbneo…) uses that console's list;
// a system without an official list shows the games in your folder.
(() => {
const NAMES = {"3do": "3DO Interactive Multiplayer", "adam": "Coleco Adam", "amiga": "Commodore Amiga", "amiga1200": "Commodore Amiga 1200", "amiga600": "Commodore Amiga 600", "amigacd32": "Commodore Amiga CD32", "amstradcpc": "Amstrad CPC", "androidapps": "Android Apps", "androidgames": "Android Games", "apple2": "Apple II", "apple2gs": "Apple IIGS", "arcade": "Arcade", "arcadia": "Emerson Arcadia 2001", "archimedes": "Acorn Archimedes", "arduboy": "Arduboy Miniature Game System", "astrocde": "Bally Astrocade", "atari2600": "Atari 2600", "atari5200": "Atari 5200", "atari7800": "Atari 7800 ProSystem", "atari800": "Atari 800", "atarijaguar": "Atari Jaguar", "atarilynx": "Atari Lynx", "atarist": "Atari ST", "atarixe": "Atari XE", "atomiswave": "Sammy Corporation Atomiswave", "bbcmicro": "Acorn Computers BBC Micro", "c64": "Commodore 64", "cdimono1": "Philips CD-i", "cdtv": "Commodore CDTV", "chailove": "ChaiLove Game Engine", "channelf": "Fairchild Channel F", "coco": "Tandy Color Computer", "colecovision": "Coleco ColecoVision", "consolearcade": "Console Arcade Systems", "cps": "Capcom Play System", "cps1": "Capcom Play System I", "cps2": "Capcom Play System II", "cps3": "Capcom Play System III", "crvision": "VTech CreatiVision", "daphne": "Daphne Arcade LaserDisc Emulator", "doom": "Doom", "dos": "DOS (PC)", "dragon32": "Dragon Data Dragon 32", "dreamcast": "Sega Dreamcast", "easyrpg": "EasyRPG Game Engine", "electron": "Acorn Electron", "emulators": "Emulators", "epic": "Epic Games Store", "famicom": "Nintendo Family Computer", "fba": "FinalBurn Alpha", "fbneo": "FinalBurn Neo", "fds": "Nintendo Famicom Disk System", "flash": "Adobe Flash", "fm7": "Fujitsu FM-7", "fmtowns": "Fujitsu FM Towns", "gamate": "Bit Corporation Gamate", "gameandwatch": "Nintendo Game and Watch", "gamecom": "Tiger Electronics Game.com", "gamegear": "Sega Game Gear", "gb": "Nintendo Game Boy", "gba": "Nintendo Game Boy Advance", "gbc": "Nintendo Game Boy Color", "gc": "Nintendo GameCube", "genesis": "Sega Genesis", "gmaster": "Hartung Game Master", "gx4000": "Amstrad GX4000", "intellivision": "Mattel Electronics Intellivision", "j2me": "Java 2 Micro Edition (J2ME)", "laserdisc": "LaserDisc Games", "lcdgames": "LCD Handheld Games", "lowresnx": "LowRes NX Fantasy Console", "lutro": "Lutro Game Engine", "macintosh": "Apple Macintosh", "mame": "Multiple Arcade Machine Emulator", "mark3": "Sega Mark III", "mastersystem": "Sega Master System", "megacd": "Sega Mega-CD", "megacdjp": "Sega Mega-CD", "megadrive": "Sega Mega Drive", "megadrivejp": "Sega Mega Drive", "megaduck": "Creatronic Mega Duck", "mess": "Multi Emulator Super System", "model2": "Sega Model 2", "model3": "Sega Model 3", "moto": "Thomson MO/TO Series", "msx": "MSX", "msx1": "MSX1", "msx2": "MSX2", "msxturbor": "MSX Turbo R", "multivision": "Othello Multivision", "n3ds": "Nintendo 3DS", "n64": "Nintendo 64", "n64dd": "Nintendo 64DD", "naomi": "Sega NAOMI", "naomi2": "Sega NAOMI 2", "naomigd": "Sega NAOMI GD-ROM", "nds": "Nintendo DS", "neogeo": "SNK Neo Geo", "neogeocd": "SNK Neo Geo CD", "neogeocdjp": "SNK Neo Geo CD", "nes": "Nintendo Entertainment System", "ngage": "Nokia N-Gage", "ngp": "SNK Neo Geo Pocket", "ngpc": "SNK Neo Geo Pocket Color", "odyssey2": "Magnavox Odyssey 2", "openbor": "OpenBOR Game Engine", "oric": "Tangerine Computer Systems Oric", "palm": "Palm OS", "pc": "IBM PC", "pc88": "NEC PC-8800 Series", "pc98": "NEC PC-9800 Series", "pcarcade": "PC Arcade Systems", "pcengine": "NEC PC Engine", "pcenginecd": "NEC PC Engine CD", "pcfx": "NEC PC-FX", "pico8": "PICO-8 Fantasy Console", "plus4": "Commodore Plus/4", "pokemini": "Nintendo Pokémon Mini", "ports": "Ports", "ps2": "Sony PlayStation 2", "ps3": "Sony PlayStation 3", "psp": "Sony PlayStation Portable", "psvita": "Sony PlayStation Vita", "psx": "Sony PlayStation", "pv1000": "Casio PV-1000", "quake": "Quake", "samcoupe": "MGT SAM Coupé", "satellaview": "Nintendo Satellaview", "saturn": "Sega Saturn", "saturnjp": "Sega Saturn", "scummvm": "ScummVM Game Engine", "scv": "Epoch Super Cassette Vision", "sega32x": "Sega Mega Drive 32X", "sega32xjp": "Sega Super 32X", "sega32xna": "Sega Genesis 32X", "segacd": "Sega CD", "sfc": "Nintendo SFC (Super Famicom)", "sg-1000": "Sega SG-1000", "sgb": "Nintendo Super Game Boy", "snes": "Nintendo SNES (Super Nintendo)", "snesna": "Nintendo SNES (Super Nintendo)", "spectravideo": "Spectravideo", "steam": "Valve Steam", "stv": "Sega Titan Video Game System", "sufami": "Bandai SuFami Turbo", "supergrafx": "NEC SuperGrafx", "supervision": "Watara Supervision", "supracan": "Funtech Super A'Can", "switch": "Nintendo Switch", "symbian": "Symbian", "tanodragon": "Tano Dragon", "tg-cd": "NEC TurboGrafx-CD", "tg16": "NEC TurboGrafx-16", "ti99": "Texas Instruments TI-99", "tic80": "TIC-80 Fantasy Computer", "to8": "Thomson TO8", "type-x": "Taito Type X", "uzebox": "Uzebox Open Source Console", "vectrex": "GCE Vectrex", "vic20": "Commodore VIC-20", "videopac": "Philips Videopac G7000", "vircon32": "Vircon32 Virtual Console", "virtualboy": "Nintendo Virtual Boy", "vpinball": "Visual Pinball", "vsmile": "VTech V.Smile", "wasm4": "WASM-4 Fantasy Console", "wii": "Nintendo Wii", "wiiu": "Nintendo Wii U", "windows": "Microsoft Windows", "windows3x": "Microsoft Windows 3.x", "windows9x": "Microsoft Windows 9x", "wonderswan": "Bandai WonderSwan", "wonderswancolor": "Bandai WonderSwan Color", "x1": "Sharp X1", "x68000": "Sharp X68000", "zmachine": "Infocom Z-machine", "zx81": "Sinclair ZX81", "zxspectrum": "Sinclair ZX Spectrum"};
const ALIAS = {"genesis": "megadrive", "megadrivejp": "megadrive", "famicom": "nes", "sfc": "snes", "snesna": "snes", "tg16": "pcengine", "tg-cd": "pcenginecd", "megacd": "segacd", "megacdjp": "segacd", "sega32xjp": "sega32x", "sega32xna": "sega32x", "saturnjp": "saturn", "neogeocdjp": "neogeocd", "mark3": "mastersystem", "msx1": "msx", "amiga600": "amiga", "amiga1200": "amiga", "atarixe": "atari800", "sgb": "gb", "naomigd": "naomi", "fbneo": "arcade", "fba": "arcade", "mame": "arcade", "cps": "arcade", "arcadia": "emerson-arcadia-2001", "gamecom": "tiger-game-com", "supervision": "watara-supervision", "vsmile": "vtech-v-smile", "crvision": "vtech-creativision", "supracan": "funtech-super-acan", "gmaster": "hartung-game-master", "pv1000": "casio-pv-1000", "arduboy": "arduboy-inc-arduboy", "scv": "epoch-super-cassette-vision"};
const OWN = {};
function add(id){
  if (GI[id]) return;
  const src = ALIAS[id] && GI[ALIAS[id]];
  if (src){ GI[id] = { ...src, id, name: NAMES[id] || src.name, maker: "", alias: src.id }; return; }
  GI[id] = { id, maker: "", name: NAMES[id] || id, src: "own", kind: "own", ver: "", n: [0, 0, 0], m: { "8": 0 } }; OWN[id] = true;
}
function ownRows(id){
  const seen = new Map();
  S.romFiles.filter(f => f.sys === id).forEach(f => { const p = parseFile(f); if (p.special && p.special.length) return; const k = p.key; if (k && !seen.has(k)) seen.set(k, [p.title || f.name, 8, 0]); });
  const rows = [...seen.values()].sort((a, b) => a[0].localeCompare(b[0]));
  GI[id].n = [rows.length, 0, 0]; GI[id].m = { "8": rows.length };
  return rows;
}
function sync(){ (S.romFiles || []).forEach(f => add(f.sys)); Object.keys(OWN).forEach(id => { LISTS[id] = ownRows(id); }); }
SRC_NAMES.own = "your own folder (no official list for this system)";
const _load = loadList;
loadList = function(id){
  add(id);
  if (OWN[id]){ LISTS[id] = ownRows(id); return Promise.resolve(LISTS[id]); }
  const a = GI[id] && GI[id].alias;
  if (a) return _load(a).then(d => (LISTS[id] = d));
  return _load(id);
};
const _coll = renderColl;
renderColl = function(){ sync(); return _coll.apply(this, arguments); };
const _sys = renderCollSystem;
renderCollSystem = function(){
  sync();
  const info = GI[S.coll.sys];
  if (!info || !OWN[info.id]) return _sys.apply(this, arguments);
  const k = KIND_NAMES.arcade; info.kind = "arcade"; KIND_NAMES.arcade = "Your games";
  try { return _sys.apply(this, arguments); } finally { info.kind = "own"; KIND_NAMES.arcade = k; }
};
window.EV_ESDE = { NAMES, ALIAS, add, sync };
})();
