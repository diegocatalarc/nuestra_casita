const { collect, listFiles } = require('./i18n-lib.cjs');
const files = listFiles('src');
const all = new Map(); let total = 0;
for (const f of files) {
  const { found } = collect(f);
  for (const c of found) { total++; if (!all.has(c.key)) all.set(c.key, []); all.get(c.key).push(`${f.replace('src/', '')}:${c.line}`); }
}
console.error('ocurrencias', total, 'únicas', all.size);
const out = [...all.entries()].map(([k, w]) => ({ k, w: w.slice(0, 2).join(' ') }));
require('fs').writeFileSync('tools/strings.json', JSON.stringify(out, null, 1));
for (const o of out) console.log(JSON.stringify(o.k) + '  @' + o.w);
