// Utilidades del "codemod" de traducción: localiza los textos de interfaz y permite envolverlos en t().
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ATTRS = new Set(['title', 'placeholder', 'aria-label', 'alt']);
const hasLetter = (s) => /\p{L}/u.test(s);
const lowerAscii = /^[a-z0-9_\-./:#%@()[\]{}, +*=<>!?&|;'"`$\\]+$/;

function userish(s) {
  const t = s.trim();
  if (!t || !hasLetter(t)) return false;
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return false;
  if (/^(https?:|\.\.?\/|data:)/.test(t)) return false;
  if (lowerAscii.test(t) && !/[áéíóúñ¿¡]/i.test(t)) return false; // todo minúsculas ASCII: identificador/CSS
  if (/^[A-Z0-9_]+$/.test(t)) return false; // CONSTANTES
  if (/^[a-z]+([A-Z][a-z0-9]*)+$/.test(t)) return false; // camelCase
  if (/^[\w{}.\-:]+$/.test(t) && /[.:_]/.test(t)) return false; // rutas y claves (players.{0}.x)
  return true;
}

function cleanJSX(raw) {
  // algoritmo de React para texto JSX multilínea
  const lines = raw.split(/\r\n|\n|\r/);
  let last = -1;
  lines.forEach((l, i) => { if (/[^ \t]/.test(l)) last = i; });
  let out = '';
  lines.forEach((l, i) => {
    const first = i === 0, isLast = i === lines.length - 1, nonEmptyLast = i === last;
    let t = l.replace(/\t/g, ' ');
    if (!first) t = t.replace(/^[ ]+/, '');
    if (!isLast) t = t.replace(/[ ]+$/, '');
    if (t) { if (!nonEmptyLast) t += ' '; out += t; }
  });
  return out;
}

const EXCLUDE = new Set(['R', 'C', 'H', 'X', 'Esc', 'G', 'Z', 'z', 'Bob', 'Shiitake', 'Sphere', 'Cone', 'Cylinder', 'Box', 'Capsule', 'Torus', 'Circle', 'Icosahedron', 'sleepTogether', 'Q/E', 'WASD']);
const EXCLUDE_RE = [/^uniform /, /^#include/, /models\/Textures/, /Geometry$/, /^\.info/, /^\{\d+\}models/, /sin malla/, /^Backend no inicializado$/, /^Firestore no/];
const EXTRA = new Set(['cultivo', 'cultivos', 'carta', 'cartas', 'recuerdo', 'recuerdos', 'misiones', 'cosa(s)', ' cosa(s)', 'algo rico', 'carta sin leer', 'cartas sin leer', 'cultivo listo', 'cultivos listos', 'animal con hambre', 'animales con hambre', 'peque con hambre', 'peques con hambre', 'mi pareja', 'esperáis', 'nació', 'sí', 'no', 'una cena romántica']);
function allowed(key) { return !EXCLUDE.has(key) && !EXCLUDE_RE.some((r) => r.test(key)); }

function parse(src) {
  return parser.parse(src, { sourceType: 'module', plugins: ['jsx'] });
}

/** Devuelve nodos a envolver: {node, kind, key, ctx} */
function collect(file) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = parse(src);
  const found = [];
  traverse(ast, {
    JSXText(p) {
      const raw = p.node.value;
      if (!hasLetter(raw)) return;
      const clean = cleanJSX(raw).trim();
      if (clean && hasLetter(clean) && allowed(clean) && clean.length > 1) found.push({ node: p.node, kind: 'jsxtext', key: clean, line: p.node.loc.start.line });
    },
    StringLiteral(p) {
      const n = p.node, par = p.parent;
      if (/^(Import|Export)/.test(par.type)) return;
      if (par.type === 'CallExpression' && par.callee.name === 't') return;
      if (par.type === 'ObjectProperty' && par.key === n && !par.computed) return;
      if (par.type === 'SwitchCase') return;
      if (par.type === 'MemberExpression' && par.property === n) return;
      if (par.type === 'JSXAttribute') { if (!ATTRS.has(par.name.name)) return; }
      if (par.type === 'CallExpression' && par.callee.type === 'MemberExpression' && ['getItem', 'setItem', 'removeItem', 'querySelector', 'addEventListener', 'removeEventListener', 'createElement', 'getElementById', 'get', 'has', 'set', 'includes', 'startsWith', 'endsWith', 'split', 'replace', 'test', 'localeCompare'].includes(par.callee.property.name)) return;
      if (par.type === 'CallExpression' && par.callee.type === 'MemberExpression' && par.callee.object.name === 'console') return;
      if (par.type === 'BinaryExpression' && ['===', '!==', '==', '!='].includes(par.operator)) return;
      if (par.type === 'ObjectProperty' && ['id', 'type', 'kind', 'op', 'col', 'field', 'tool', 'panel', 'mode', 'color', 'c', 'fill', 'stroke', 'cursor', 'className', 'key', 'display', 'accept', 'rel', 'target', 'role', 'font', 'icon', 'metric', 'item', 'hl', 'anim', 'weather', 'roofType', 'model', 'res', 'wall', 'floor', 'roof', 'stage', 'sound'].includes(par.key.name || par.key.value)) return;
      if (!(userish(n.value) || EXTRA.has(n.value)) || !allowed(n.value)) return;
      if (EXTRA.has(n.value) && !/ui\/|game\/actions|game\/errors|game\/constants/.test(file)) return;
      if (n.value === 'no' && par.type !== 'ConditionalExpression') return;
      found.push({ node: n, kind: 'string', key: n.value, line: n.loc.start.line, parentType: par.type });
    },
    TemplateLiteral(p) {
      if (p.parent.type === 'TaggedTemplateExpression') return;
      if (p.parent.type === 'CallExpression' && p.parent.callee.name === 't') return;
      const n = p.node;
      const key = n.quasis.map((q, i) => q.value.cooked + (i < n.expressions.length ? `{${i}}` : '')).join('');
      const stat = n.quasis.map((q) => q.value.cooked).join(' ');
      if (!userish(stat) || !hasLetter(stat)) return;
      if (lowerAscii.test(stat.trim()) && !/[áéíóúñ¿¡]/i.test(stat)) return;
      if (!allowed(key)) return;
      found.push({ node: n, kind: 'template', key, line: n.loc.start.line });
    },
  });
  return { src, ast, found };
}

function listFiles(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (f.name === 'assets' || f.name === 'i18n') continue; out.push(...listFiles(p)); }
    else if (/\.(jsx?|cjs)$/.test(f.name)) out.push(p);
  }
  return out;
}

module.exports = { collect, listFiles, parse, userish, cleanJSX, ATTRS, allowed };
