// Recoge las métricas semanales (calidad, seguridad, rendimiento) y las guarda en metrics/. Uso:
//   node tools/metrics.mjs [--perf] [--rules] [--no-coverage] [--out metrics]
// Cada paso falla de forma aislada: si una herramienta no está disponible (gitleaks, gh, Java…) ese KPI queda en null y el informe
// lo marca como «sin medir» en vez de romper. No toca producción ni Firebase: solo lee y ejecuta tests.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { summarizeVitest, flakyTests, summarizeAudit, majorOutdated, coveragePct, parseNodeTest, flatten, evaluate } from './metrics-lib.mjs';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(`--${f}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.resolve(ROOT, opt('out', 'metrics'));
fs.mkdirSync(path.join(OUT, 'runs'), { recursive: true });
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'nc-metrics-'));

const run = (cmd, args, o = {}) => spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, ...o });
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const step = async (name, fn) => { const t = Date.now(); try { const v = await fn(); console.log(`✔ ${name} (${((Date.now() - t) / 1000).toFixed(1)} s)`); return v; } catch (e) { console.log(`✖ ${name}: ${String(e.message || e).split('\n')[0]}`); return null; } };

if (!fs.existsSync(path.join(ROOT, 'dist'))) console.log('⚠ no hay dist/: ejecuta `npm run build` antes (bundle y rendimiento dependen de ello)');
const report = { date: new Date().toISOString(), commit: run('git', ['rev-parse', '--short', 'HEAD']).stdout.trim(), node: process.version };

// 1. Tests unitarios (dos pasadas: la segunda detecta flaky) + cobertura de la lógica
report.tests = await step('tests unitarios', () => {
  const f1 = path.join(tmp, 't1.json'), f2 = path.join(tmp, 't2.json');
  const t0 = Date.now();
  const cov = has('no-coverage') ? [] : ['--coverage', '--coverage.reporter=json-summary', `--coverage.reportsDirectory=${path.join(tmp, 'cov')}`, '--coverage.include=src/game/**'];
  run('npx', ['vitest', 'run', '--reporter=json', `--outputFile=${f1}`, ...cov]);
  const seconds = Math.round((Date.now() - t0) / 100) / 10;
  run('npx', ['vitest', 'run', '--reporter=json', `--outputFile=${f2}`]);
  const a = readJson(f1);
  if (!a) throw new Error('vitest no produjo resultados');
  report.flaky = flakyTests(a, readJson(f2));
  report.coverage = coveragePct(readJson(path.join(tmp, 'cov', 'coverage-summary.json')));
  return { ...summarizeVitest(a), seconds };
});

// 2. Dependencias
// `audit` = lo que llega al navegador de las personas (dependencias de producción: manda para el semáforo); `auditAll` = incluye herramientas de desarrollo (informativo)
report.audit = await step('npm audit (producción)', () => summarizeAudit(JSON.parse(run('npm', ['audit', '--omit=dev', '--json']).stdout || 'null')));
report.auditAll = await step('npm audit (todo)', () => summarizeAudit(JSON.parse(run('npm', ['audit', '--json']).stdout || 'null')));
report.outdated = await step('npm outdated', () => majorOutdated(JSON.parse(run('npm', ['outdated', '--json']).stdout || '{}')));

// 3. Secretos (gitleaks, si está instalado) y CodeQL (alertas de GitHub, si hay gh y token)
report.secrets = await step('gitleaks', () => {
  const f = path.join(tmp, 'gl.json');
  const r = run('gitleaks', ['detect', '--no-banner', '--redact', '--report-format', 'json', '--report-path', f]);
  if (r.error) throw new Error('gitleaks no está instalado');
  if (r.status === 0) return 0;
  const leaks = readJson(f);
  if (r.status === 1 && Array.isArray(leaks)) return leaks.length;
  throw new Error(`gitleaks falló (código ${r.status})`);
});
report.codeql = await step('CodeQL (alertas abiertas)', () => {
  const fromGit = /github\.com[:/](.+?)(?:\.git)?$/.exec(run('git', ['remote', 'get-url', 'github']).stdout.trim() || run('git', ['remote', 'get-url', 'origin']).stdout.trim());
  const repo = process.env.GITHUB_REPOSITORY || fromGit?.[1];
  if (!repo) throw new Error('no se sabe qué repositorio consultar');
  const r = run('gh', ['api', '--paginate', `repos/${repo}/code-scanning/alerts?state=open&per_page=100`, '--jq', '.[] | (.rule.security_severity_level // .rule.severity)']);
  if (r.status !== 0) throw new Error('sin acceso a code scanning');
  const sev = r.stdout.split('\n').filter(Boolean);
  return { open: sev.length, high: sev.filter((x) => ['critical', 'high', 'error'].includes(x)).length };
});

// 4. Reglas de Firestore (emulador; necesita Java y red para firebase-tools)
if (has('rules')) report.rules = await step('reglas de Firestore', () => { const r = run('npm', ['run', '--silent', 'test:rules']); const p = parseNodeTest(`${r.stdout}\n${r.stderr}`); if (!p) throw new Error('no se pudo leer el resultado'); return p; });

// 5. Peso del bundle (dist/) y rendimiento (arnés perf; relativo, sin GPU)
report.bundleGzipKb = await step('peso del bundle', () => {
  const dir = path.join(ROOT, 'dist', 'assets');
  const total = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).reduce((n, f) => n + zlib.gzipSync(fs.readFileSync(path.join(dir, f))).length, 0);
  return Math.round(total / 1024);
});
if (has('perf')) report.perf = await step('rendimiento (perf)', () => {
  const pf = path.join(ROOT, 'perf-results', 'metrics.json');
  fs.rmSync(pf, { force: true }); // nunca leer un resultado antiguo si el arnés falla
  run('npm', ['run', '--silent', 'perf', '--', '--quick', '--no-build', '--label', 'metrics']);
  const j = readJson(pf);
  const d = j?.desktop;
  if (!d) throw new Error('el arnés no produjo resultados');
  return { drawCalls: d.idle.drawCalls.p50, jsFrameMs: Math.round((d.idle.useFrameMs.p50 + d.idle.glRenderJsMs.p50) * 100) / 100, loadSeconds: Math.round((j.load?.tEnterMs || 0) / 100) / 10 || null, note: j.note };
});

// 6. KPI manuales (los actualiza una persona en metrics/manual.json) y semáforo
report.manual = readJson(path.join(OUT, 'manual.json')) || {};
const prev = readJson(path.join(OUT, 'latest.json'));
report.kpi = flatten(report);
report.verdict = evaluate(report.kpi, prev?.kpi || null);

const stamp = report.date.slice(0, 10);
fs.writeFileSync(path.join(OUT, 'runs', `${stamp}.json`), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify(report, null, 2));
console.log(`\nSemáforo: ${report.verdict.status.toUpperCase()}`);
for (const r of report.verdict.reds) console.log(`  🔴 ${r}`);
for (const a of report.verdict.ambers) console.log(`  🟠 ${a}`);
if (report.verdict.missing.length) console.log(`  ⚪ sin medir: ${report.verdict.missing.join(', ')}`);
fs.rmSync(tmp, { recursive: true, force: true });
