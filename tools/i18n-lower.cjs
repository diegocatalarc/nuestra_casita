const { listFiles, parse } = require('./i18n-lib.cjs');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
for (const f of listFiles('src')) {
  const ast = parse(fs.readFileSync(f, 'utf8'));
  traverse(ast, {
    StringLiteral(p) {
      const v = p.node.value, par = p.parent;
      if (/^(Import|Export)/.test(par.type) || (par.type === 'ObjectProperty' && par.key === p.node)) return;
      if (/^[a-záéíóúñü ,.¡!¿?'()·%+\-—…/0-9]+$/.test(v) && /\p{L}{2,}/u.test(v) && !/^[a-z]+$/.test(v) && !/^[\w-]+( [\w-]+)*$/.test(v.replace(/[^\w -]/g,'')) ) console.log(JSON.stringify(v), f.replace('src/', '') + ':' + p.node.loc.start.line);
      else if (/ /.test(v) && /^[a-z ]+$/.test(v) && v.split(' ').length >= 2) console.log(JSON.stringify(v), f.replace('src/', '') + ':' + p.node.loc.start.line, '(lower)');
    },
    TemplateLiteral(p) {
      const s = p.node.quasis.map((q) => q.value.cooked).join('|');
      if (/ [a-záéíóúñ]{3,}/.test(s) && /[a-záéíóúñ]{3,} /.test(s) && !/^[a-z\-| ]*$/.test(s)) console.log('TPL', JSON.stringify(s), f.replace('src/', '') + ':' + p.node.loc.start.line);
    },
  });
}
