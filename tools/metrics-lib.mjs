// Lógica PURA de las métricas semanales (testeable): resume los resultados crudos y calcula el semáforo frente a la semana anterior.
// La recogida (ejecutar tests, auditoría, rendimiento…) vive en tools/metrics.mjs.

/** Metas fijas. Cualquier KPI fuera de meta pone el informe en rojo. */
export const GOALS = { vulnsHighCrit: 0, secrets: 0, codeqlHigh: 0, testsPassPct: 100, rulesTestsPct: 100 };
/** Empeoramientos relativos frente a la semana anterior que ponen el informe en ámbar. */
export const WORSEN = { bundleGzipKb: 0.10, drawCalls: 0.10, jsFrameMs: 0.20, testSeconds: 0.30, loadSeconds: 0.30 };

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const pct = (ok, total) => (total > 0 ? Math.round((ok / total) * 1000) / 10 : null);

/** Resumen de un informe JSON de vitest (--reporter=json): total, pasan, duración y por módulo (primer directorio bajo tests/). */
export function summarizeVitest(json) {
  if (!json) return null;
  const mods = {};
  for (const f of json.testResults || []) {
    const name = String(f.name || '').split('/tests/')[1] || f.name;
    const mod = name.includes('/') ? name.split('/')[0] : 'unit';
    const m = (mods[mod] ||= { tests: 0, failed: 0, ms: 0 });
    m.tests += (f.assertionResults || []).length;
    m.failed += (f.assertionResults || []).filter((a) => a.status === 'failed').length;
    m.ms += Math.max(0, (f.endTime || 0) - (f.startTime || 0));
  }
  const total = json.numTotalTests ?? 0, passed = json.numPassedTests ?? 0;
  return { total, passed, failed: json.numFailedTests ?? 0, passPct: pct(passed, total), modules: mods };
}

/** Tests que dieron resultado distinto en dos ejecuciones seguidas (señal de flaky). */
export function flakyTests(a, b) {
  const status = (j) => { const m = new Map(); for (const f of j?.testResults || []) for (const t of f.assertionResults || []) m.set(`${f.name}::${t.fullName || t.title}`, t.status); return m; };
  const A = status(a), B = status(b);
  return [...A].filter(([k, s]) => B.has(k) && B.get(k) !== s).map(([k]) => k);
}

/** Vulnerabilidades de `npm audit --json`. */
export function summarizeAudit(json) {
  const v = json?.metadata?.vulnerabilities;
  if (!v) return null;
  return { critical: v.critical || 0, high: v.high || 0, moderate: v.moderate || 0, low: v.low || 0, highCrit: (v.critical || 0) + (v.high || 0) };
}

/** Dependencias con salto de versión mayor, de `npm outdated --json`. */
export function majorOutdated(json) {
  if (!json) return null;
  const major = (s) => parseInt(String(s).split('.')[0], 10);
  return Object.entries(json).filter(([, o]) => o.current && o.latest && major(o.latest) > major(o.current)).map(([n]) => n).sort();
}

/** Cobertura de un coverage-summary.json (vitest/c8): % de líneas del total. */
export const coveragePct = (json) => num(json?.total?.lines?.pct);

/** Recuento de tests de node:test (reglas de Firestore): «# pass N» y «# fail N». */
export function parseNodeTest(out) {
  const g = (k) => { const m = new RegExp(`^# ${k} (\\d+)`, 'm').exec(out || ''); return m ? +m[1] : null; };
  const pass = g('pass'), fail = g('fail');
  return pass == null || fail == null ? null : { pass, fail, pct: pct(pass, pass + fail) };
}

/** Números clave que se comparan semana a semana, aplanados desde el informe completo. */
export function flatten(r) {
  return {
    testsTotal: r.tests?.total ?? null, testsPassPct: r.tests?.passPct ?? null, testSeconds: r.tests?.seconds ?? null,
    flaky: r.flaky?.length ?? null, coveragePct: r.coverage ?? null,
    vulnsHighCrit: r.audit?.highCrit ?? null, vulnsModerate: r.audit?.moderate ?? null, vulnsDevHighCrit: r.auditAll ? r.auditAll.highCrit - (r.audit?.highCrit ?? 0) : null,
    secrets: r.secrets ?? null, codeqlHigh: r.codeql?.high ?? null,
    rulesTestsPct: r.rules?.pct ?? null, rulesDeployed: r.manual?.rulesDeployed ?? 'sin-comprobar',
    majorOutdated: r.outdated?.length ?? null,
    drawCalls: r.perf?.drawCalls ?? null, jsFrameMs: r.perf?.jsFrameMs ?? null, loadSeconds: r.perf?.loadSeconds ?? null,
    bundleGzipKb: r.bundleGzipKb ?? null,
  };
}

/** Semáforo: { status: 'verde'|'ambar'|'rojo', reds: [...], ambers: [...] } con las razones en texto. */
export function evaluate(cur, prev) {
  const reds = [], ambers = [];
  const bad = (v, goal, cmp) => v != null && (cmp === 'max' ? v > goal : v < goal);
  if (bad(cur.vulnsHighCrit, GOALS.vulnsHighCrit, 'max')) reds.push(`Vulnerabilidades críticas/altas en producción: ${cur.vulnsHighCrit}`);
  if (bad(cur.secrets, GOALS.secrets, 'max')) reds.push(`Secretos expuestos: ${cur.secrets}`);
  if (bad(cur.codeqlHigh, GOALS.codeqlHigh, 'max')) reds.push(`Hallazgos altos de CodeQL: ${cur.codeqlHigh}`);
  if (bad(cur.testsPassPct, GOALS.testsPassPct, 'min')) reds.push(`Tests que pasan: ${cur.testsPassPct} %`);
  if (bad(cur.rulesTestsPct, GOALS.rulesTestsPct, 'min')) reds.push(`Tests de reglas de Firestore: ${cur.rulesTestsPct} %`);
  if (cur.rulesDeployed && cur.rulesDeployed !== 'al-dia') reds.push(`Reglas de Firestore desplegadas: ${cur.rulesDeployed}`);
  if (prev) for (const [k, lim] of Object.entries(WORSEN)) {
    const a = cur[k], b = prev[k];
    if (a != null && b != null && b > 0 && (a - b) / b > lim) ambers.push(`${k}: ${b} → ${a} (+${Math.round(((a - b) / b) * 100)} %)`);
  }
  if (cur.flaky > 0) ambers.push(`Tests flaky: ${cur.flaky}`);
  if (prev && cur.majorOutdated != null && prev.majorOutdated != null && cur.majorOutdated > prev.majorOutdated) ambers.push(`Dependencias con salto mayor: ${prev.majorOutdated} → ${cur.majorOutdated}`);
  const missing = Object.entries(cur).filter(([, v]) => v == null).map(([k]) => k);
  return { status: reds.length ? 'rojo' : ambers.length ? 'ambar' : 'verde', reds, ambers, missing };
}
