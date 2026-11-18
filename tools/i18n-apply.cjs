const fs = require('fs'); const path = require('path');
const { collect, listFiles } = require('./i18n-lib.cjs');
const traverse = require('@babel/traverse').default;
const keys = JSON.parse(fs.readFileSync('tools/keys.frozen.json', 'utf8'));
const dict = {};
for (const line of fs.readFileSync('tools/en.txt', 'utf8').split('\n')) {
  if (!line.trim()) continue; const i = line.indexOf('|'); const n = +line.slice(0, i);
  dict[keys[n]] = line.slice(i + 1);
}
fs.writeFileSync('src/i18n/en.js', '// Traducciones al inglés. Clave = texto original en español.\nexport default ' + JSON.stringify(dict, null, 1).replace(/^\{/, '{') + ';\n');

let changed = 0, wrapped = 0; const unknown = new Set();
for (const file of listFiles('src')) {
  if (file.includes('src/i18n')) continue;
  const { src, ast, found } = collect(file);
  const wraps = found.filter((f) => { if (Object.prototype.hasOwnProperty.call(dict, f.key)) return true; unknown.add(f.key); return false; });
  if (!wraps.length) continue;
  // padres para saber si un string es atributo JSX
  const attrStrings = new Set();
  traverse(ast, { JSXAttribute(p) { if (p.node.value && p.node.value.type === 'StringLiteral') attrStrings.add(p.node.value); } });
  const inside = (a, b) => a.node.start >= b.node.start && a.node.end <= b.node.end && a !== b;
  const gen = (w) => {
    const n = w.node;
    if (w.kind === 'jsxtext') {
      const raw = src.slice(n.start, n.end);
      const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
      return (/\n/.test(lead) ? '' : lead) + `{t(${JSON.stringify(w.key)})}` + (/\n/.test(trail) ? '' : trail);
    }
    if (w.kind === 'string') { const call = `t(${JSON.stringify(w.key)})`; return attrStrings.has(n) ? `{${call}}` : call; }
    const args = n.expressions.map((e) => render(e.start, e.end, wraps.filter((x) => inside(x, { node: e }) || x.node === e)));
    return args.length ? `t(${JSON.stringify(w.key)}, [${args.join(', ')}])` : `t(${JSON.stringify(w.key)})`;
  };
  function render(start, end, list) {
    const top = list.filter((w) => !list.some((o) => o !== w && w.node.start >= o.node.start && w.node.end <= o.node.end && !(w.node.start === o.node.start && w.node.end === o.node.end)));
    top.sort((a, b) => a.node.start - b.node.start);
    let out = '', pos = start;
    for (const w of top) { if (w.node.start < pos) continue; out += src.slice(pos, w.node.start) + gen(w); pos = w.node.end; }
    return out + src.slice(pos, end);
  }
  let out = render(0, src.length, wraps);
  // import de t()
  const rel = path.relative(path.dirname(file), 'src/i18n').split(path.sep).join('/');
  const imp = `import { t } from '${rel.startsWith('.') ? rel : './' + rel}';\n`;
  const lastImp = ast.program.body.filter((s) => s.type === 'ImportDeclaration').pop();
  if (lastImp) { const endAfter = render(0, lastImp.end, wraps).length; out = out.slice(0, endAfter) + '\n' + imp.trimEnd() + out.slice(endAfter); }
  else out = imp + out;
  fs.writeFileSync(file, out); changed++; wrapped += wraps.length;
}
console.log('archivos', changed, 'textos envueltos', wrapped);
console.log('sin traducción:', [...unknown].slice(0, 20));
