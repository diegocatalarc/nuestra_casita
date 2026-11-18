const { listFiles, parse } = require('./i18n-lib.cjs');
const traverse = require('@babel/traverse').default; const fs = require('fs');
const seen = new Set();
for (const f of listFiles('src')) {
  if (/scene|toon|rb\.js|models|input|audio/.test(f)) continue;
  const ast = parse(fs.readFileSync(f, 'utf8'));
  traverse(ast, { StringLiteral(p) {
    const v = p.node.value, par = p.parent;
    if (/^[a-záéíóúñ]+$/.test(v) && v.length >= 3 && ['ConditionalExpression','LogicalExpression','ArrayExpression','CallExpression'].includes(par.type) && !(par.type==='CallExpression' && /^(use|get|set|on|add|remove|toast|fx)/.test(par.callee.name||par.callee.property?.name||'x') && false)) {
      const k = v + '@' + f.replace('src/','') + ':' + p.node.loc.start.line + ' ' + par.type; if (!seen.has(k)) { seen.add(k); console.log(k); }
    }
  } });
}
