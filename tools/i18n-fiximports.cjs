const fs = require('fs'); const path = require('path');
const { listFiles, parse } = require('./i18n-lib.cjs');
let n = 0;
for (const file of listFiles('src')) {
  if (file.includes('src/i18n')) continue;
  let src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(path.dirname(file), 'src/i18n').split(path.sep).join('/');
  const line = `import { t } from '${rel.startsWith('.') ? rel : './' + rel}';`;
  if (!src.includes(line)) continue;
  src = src.split('\n' + line).join('');          // quita la inserción (con su salto de línea)
  if (src.includes(line)) src = src.split(line).join('');
  const ast = parse(src);
  const lastImp = ast.program.body.filter((s) => s.type === 'ImportDeclaration').pop();
  src = lastImp ? src.slice(0, lastImp.end) + '\n' + line + src.slice(lastImp.end) : line + '\n' + src;
  fs.writeFileSync(file, src); n++;
}
console.log('corregidos', n);
