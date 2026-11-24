import { describe, it, expect } from 'vitest';
import { summarizeVitest, flakyTests, summarizeAudit, majorOutdated, coveragePct, parseNodeTest, flatten, evaluate } from '../tools/metrics-lib.mjs';

const vt = (statuses) => ({
  numTotalTests: statuses.length, numPassedTests: statuses.filter((s) => s === 'passed').length, numFailedTests: statuses.filter((s) => s === 'failed').length,
  testResults: [{ name: '/r/tests/e2e/a.test.js', startTime: 0, endTime: 500, assertionResults: statuses.map((s, i) => ({ status: s, fullName: `t${i}` })) }],
});
describe('métricas semanales', () => {
  it('resume vitest por módulo', () => {
    const s = summarizeVitest(vt(['passed', 'passed', 'failed']));
    expect(s.total).toBe(3); expect(s.passPct).toBe(66.7); expect(s.modules.e2e).toEqual({ tests: 3, failed: 1, ms: 500 });
    expect(summarizeVitest(null)).toBeNull();
  });
  it('detecta flaky entre dos ejecuciones', () => {
    expect(flakyTests(vt(['passed', 'failed']), vt(['passed', 'passed']))).toHaveLength(1);
    expect(flakyTests(vt(['passed']), vt(['passed']))).toHaveLength(0);
  });
  it('npm audit, outdated, cobertura y node:test', () => {
    expect(summarizeAudit({ metadata: { vulnerabilities: { critical: 1, high: 2, moderate: 3, low: 4 } } })).toMatchObject({ highCrit: 3, moderate: 3 });
    expect(summarizeAudit({})).toBeNull();
    expect(majorOutdated({ a: { current: '1.2.0', latest: '2.0.0' }, b: { current: '1.2.0', latest: '1.9.0' } })).toEqual(['a']);
    expect(coveragePct({ total: { lines: { pct: 61.5 } } })).toBe(61.5);
    expect(parseNodeTest('# tests 5\n# pass 4\n# fail 1\n')).toEqual({ pass: 4, fail: 1, pct: 80 });
    expect(parseNodeTest('nada')).toBeNull();
  });
  const base = { testsPassPct: 100, vulnsHighCrit: 0, secrets: 0, codeqlHigh: 0, rulesTestsPct: 100, rulesDeployed: 'al-dia', flaky: 0, bundleGzipKb: 1000, drawCalls: 1000 };
  it('semáforo: verde, ámbar por empeoramiento y rojo por meta incumplida', () => {
    expect(evaluate(base, base).status).toBe('verde');
    const am = evaluate({ ...base, bundleGzipKb: 1200 }, base);
    expect(am.status).toBe('ambar'); expect(am.ambers[0]).toMatch(/bundleGzipKb/);
    expect(evaluate({ ...base, vulnsHighCrit: 2 }, base).status).toBe('rojo');
    expect(evaluate({ ...base, rulesDeployed: 'no-desplegadas' }, base).reds[0]).toMatch(/desplegadas/);
    expect(evaluate({ ...base, flaky: 1 }, base).status).toBe('ambar');
  });
  it('la primera semana (sin anterior) solo evalúa metas; lo no medido se lista (el rendimiento no medido no bloquea)', () => {
    const r = evaluate({ ...base, drawCalls: null, codeqlHigh: 0, firebaseKeyRestricted: true }, null);
    expect(r.status).toBe('verde'); expect(r.missing).toContain('drawCalls');
  });
  it('un KPI esencial sin medir NO es verde', () => {
    for (const k of ['testsPassPct', 'vulnsHighCrit', 'secrets', 'codeqlHigh', 'rulesTestsPct']) {
      const r = evaluate({ ...base, codeqlHigh: 0, firebaseKeyRestricted: true, [k]: null }, base);
      expect(r.status).toBe('ambar'); expect(r.ambers.join()).toMatch(new RegExp(k));
    }
  });
  it('cada meta incumplida da rojo', () => {
    const ok = { ...base, codeqlHigh: 0, firebaseKeyRestricted: true };
    for (const [k, v] of [['testsPassPct', 99.9], ['secrets', 1], ['codeqlHigh', 1], ['rulesTestsPct', 90], ['vulnsHighCrit', 1]]) expect(evaluate({ ...ok, [k]: v }, ok).status).toBe('rojo');
  });
  it('umbral exacto: +10 % no es ámbar, +11 % sí', () => {
    const ok = { ...base, codeqlHigh: 0, firebaseKeyRestricted: true };
    expect(evaluate({ ...ok, bundleGzipKb: 1100 }, ok).status).toBe('verde');
    expect(evaluate({ ...ok, bundleGzipKb: 1110 }, ok).status).toBe('ambar');
  });
  it('la clave de Firebase sin restringir avisa en ámbar', () => {
    expect(evaluate({ ...base, codeqlHigh: 0, firebaseKeyRestricted: false }, base).ambers.join()).toMatch(/clave web/);
  });
  it('una suite que no carga cuenta como fallo y el redondeo no lo esconde', () => {
    const s = summarizeVitest({ numTotalTests: 5000, numPassedTests: 5000, numFailedTests: 0, numFailedTestSuites: 1, testResults: [] });
    expect(s.failed).toBe(1); expect(s.passPct).toBe(99.9);
    expect(summarizeVitest({ numTotalTests: 0, numPassedTests: 0, numFailedTests: 0, numFailedTestSuites: 2, testResults: [] }).passPct).toBe(0);
    expect(summarizeVitest({ numTotalTests: 10, numPassedTests: 8, numFailedTests: 0, numPendingTests: 2, testResults: [] }).passPct).toBe(100);
  });
  it('salidas de error de npm (sin red) no se toman por cero problemas', () => {
    expect(summarizeAudit({ error: { code: 'ENOTFOUND' } })).toBeNull();
    expect(majorOutdated({ error: { code: 'ENOTFOUND' } })).toBeNull();
    expect(flatten({ audit: null, auditAll: { highCrit: 4 } }).vulnsDevHighCrit).toBeNull();
    expect(flatten({ audit: { highCrit: 1 }, auditAll: { highCrit: 4 } }).vulnsDevHighCrit).toBe(3);
  });
  it('flatten aplana el informe', () => {
    const f = flatten({ tests: { total: 5, passPct: 100, seconds: 2 }, flaky: [], audit: { highCrit: 0, moderate: 1 }, manual: { rulesDeployed: 'no-desplegadas' }, outdated: ['x'], perf: { drawCalls: 9 }, bundleGzipKb: 700 });
    expect(f).toMatchObject({ testsTotal: 5, flaky: 0, vulnsModerate: 1, rulesDeployed: 'no-desplegadas', majorOutdated: 1, drawCalls: 9, bundleGzipKb: 700, secrets: null });
  });
});
