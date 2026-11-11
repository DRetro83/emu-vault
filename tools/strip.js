// removes `if(0) ...` blocks (old preview-only code) from the app's preview.js
const fs = require("fs"), acorn = require("acorn"), walk = (n, f) => { if (!n || typeof n.type !== "string") return; f(n); for (const k in n){ const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, f)); else if (v && typeof v.type === "string") walk(v, f); } };
const p = process.argv[2], src = fs.readFileSync(p, "utf8");
const ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: "script" });
const cut = [];
walk(ast, n => { if (n.type === "IfStatement" && n.test.type === "Literal" && n.test.value === 0 && !n.alternate) cut.push([n.start, n.end]); });
cut.sort((a, b) => b[0] - a[0]);
let out = src; for (const [a, b] of cut) out = out.slice(0, a) + out.slice(b);
acorn.parse(out, { ecmaVersion: 2022, sourceType: "script" });
fs.writeFileSync(p, out);
console.log(`removed ${cut.length} blocks, ${src.length - out.length} bytes`);
