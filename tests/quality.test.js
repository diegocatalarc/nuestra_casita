import { describe, it, expect } from 'vitest';
import { median, stepDown, decide, SLOW_MS, MIN_SAMPLES, DPR_CAP, SEVERE_MS } from '../src/game/quality';

const many = (ms, n = MIN_SAMPLES) => Array.from({ length: n }, () => ms);
describe('regulador de calidad gráfica', () => {
  it('mediana', () => { expect(median([5, 1, 3])).toBe(3); expect(median([1, 2, 3, 4])).toBe(2.5); expect(median([])).toBe(0); });
  it('escalones: alta → media → normal → nada', () => {
    expect(stepDown('alta')).toBe('media'); expect(stepDown('media')).toBe('normal'); expect(stepDown('normal')).toBeNull();
  });
  it('espera a tener muestras suficientes', () => { expect(decide({ samples: many(50, 10), tier: 'alta' }).action).toBe('wait'); });
  it('si va fluido, lo da por bueno', () => { expect(decide({ samples: many(14), tier: 'alta' }).action).toBe('ok'); });
  it('si va a tirones, baja un escalón', () => {
    const d = decide({ samples: many(SLOW_MS + 12), tier: 'alta' });
    expect(d.action).toBe('down'); expect(d.to).toBe('media');
    expect(decide({ samples: many(60), tier: 'media' }).to).toBe('normal');
  });
  it('en el escalón más bajo no hay nada más que bajar', () => { expect(decide({ samples: many(80), tier: 'normal' }).action).toBe('ok'); });
  it('un puñado de parones (pestaña en segundo plano) no hace bajar la calidad', () => {
    const s = [...many(14, 100), ...many(900, 10)];
    expect(decide({ samples: s, tier: 'alta' }).action).toBe('ok');
  });
  it('elegida a mano: solo baja si es injugable', () => {
    expect(decide({ samples: many(SLOW_MS + 6), tier: 'alta', manual: true }).action).toBe('ok');
    expect(decide({ samples: many(SEVERE_MS + 20), tier: 'alta', manual: true }).action).toBe('down');
  });
  it('bajar de escalón nunca sube la resolución', () => { expect(DPR_CAP.normal).toBeLessThanOrEqual(DPR_CAP.media); expect(DPR_CAP.media).toBeLessThanOrEqual(DPR_CAP.alta); });
  it('el umbral de 40 ms es exacto', () => { expect(decide({ samples: many(SEVERE_MS), tier: 'alta', manual: true }).action).toBe('ok'); expect(decide({ samples: many(SEVERE_MS + 1), tier: 'alta', manual: true }).action).toBe('down'); });
  it('la resolución máxima es razonable en pantallas Retina', () => { for (const v of Object.values(DPR_CAP)) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(1.5); } });
});
