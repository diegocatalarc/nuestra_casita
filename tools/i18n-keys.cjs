const { collect, listFiles } = require('./i18n-lib.cjs');
const keys = new Map();
for (const f of listFiles('src')) for (const c of collect(f).found) { if (!keys.has(c.key)) keys.set(c.key, 0); keys.set(c.key, keys.get(c.key) + 1); }
const arr = [...keys.keys()];
require('fs').writeFileSync('tools/keys.json', JSON.stringify(arr, null, 1));
arr.forEach((k, i) => console.log(i + '|' + k.replace(/\n/g, '\\n')));
