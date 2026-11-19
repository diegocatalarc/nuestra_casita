// Lista los textos t("...") del código que aún no tienen traducción al inglés en src/i18n/en.js ni en-extra.js.
// Uso (desde la raíz): node tools/i18n-missing.cjs   → imprime una clave por línea; vacío = todo traducido.
const fs=require('fs'),path=require('path');
const read=(p)=>fs.readFileSync(p,'utf8');
const have=new Set();
for (const f of fs.readdirSync('src/i18n').filter((n) => /^en(-.*)?\.js$/.test(n)).map((n) => 'src/i18n/' + n)) { const s=read(f); for (const m of s.matchAll(/^\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'):/gm)) have.add(JSON.parse('"'+(m[1]??m[2].replace(/\\'/g,"'").replace(/"/g,'\\"'))+'"')); }
const out=new Set();
(function walk(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})) { const p=path.join(d,e.name); if (e.isDirectory()) { if (e.name!=='i18n') walk(p); } else if (/\.jsx?$/.test(e.name)) { const s=read(p); for (const m of s.matchAll(/\bt\(\s*(?:"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)')/g)) { const k=m[1]!==undefined?JSON.parse('"'+m[1]+'"'):m[2].replace(/\\'/g,"'"); if (!have.has(k)) out.add(k);} } } })('src');
console.log([...out].map(k=>JSON.stringify(k)).join('\n'));
