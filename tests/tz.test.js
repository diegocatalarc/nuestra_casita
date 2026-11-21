import { describe, it, expect, vi } from 'vitest';

// los textos se comprueban en español, sea cual sea el idioma del entorno de pruebas
vi.mock('../src/i18n', () => ({ t: (k, v) => (v ? k.replace(/\{(\d+)\}/g, (m, i) => v[i]) : k) }));

import { cityOf, zoneOffset, minutesApart, diffText, fillTokens, clockText } from '../src/game/tz';

const D = new Date('2026-06-15T12:00:00Z'); // sin cambios de hora en las zonas elegidas

describe('dos ciudades y diferencia horaria', () => {
  it('ciudad a partir de la zona', () => {
    expect(cityOf('America/Santiago')).toBe('Santiago');
    expect(cityOf('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
    expect(cityOf('UTC')).toBeNull();
    expect(cityOf('Etc/GMT+3')).toBeNull();
    expect(cityOf(null)).toBeNull();
  });
  it('desfase y diferencia entre zonas', () => {
    expect(zoneOffset('UTC', D)).toBe(0);
    expect(zoneOffset('Asia/Tokyo', D)).toBe(540);
    expect(zoneOffset('Asia/Kolkata', D)).toBe(330);
    expect(minutesApart('Asia/Tokyo', 'Asia/Kolkata', D)).toBe(210);
    expect(minutesApart('Asia/Kolkata', 'Asia/Tokyo', D)).toBe(210);   // simétrica
    expect(minutesApart('Asia/Tokyo', 'Asia/Tokyo', D)).toBe(0);
  });
  it('zonas desconocidas o ausentes no rompen nada', () => {
    expect(minutesApart(null, 'Asia/Tokyo', D)).toBe(0);
    expect(minutesApart('No/Existe', 'Asia/Tokyo', D)).toBe(0);
    expect(clockText('No/Existe', D)).toBe('--:--');
  });
  it('hora local formateada', () => { expect(clockText('Asia/Tokyo', D)).toBe('21:00'); });
  it('la diferencia se dice en palabras', () => {
    expect(diffText(0)).toBe('cero horas'); expect(diffText(60)).toBe('una hora'); expect(diffText(180)).toBe('3 horas');
    expect(diffText(210)).toBe('3 horas y media'); expect(diffText(30)).toBe('media hora'); expect(diffText(195)).toBe('3 h 15 min');
  });
  it('los marcadores de las escenas se rellenan, con textos genéricos si falta la pareja', () => {
    const t = 'Entre {tuCiudad} y {suCiudad} hay {diferencia}.';
    expect(fillTokens(t, { me: 'Asia/Tokyo', partner: 'Asia/Kolkata', date: D })).toBe('Entre Tokyo y Kolkata hay 3 horas y media.');
    expect(fillTokens(t, { me: 'Asia/Tokyo', partner: null, date: D })).toBe('Entre Tokyo y la suya hay unas horas.');
    expect(fillTokens(t, {})).toBe('Entre tu ciudad y la suya hay unas horas.');
    expect(fillTokens('sin marcadores', {})).toBe('sin marcadores');
  });
});
