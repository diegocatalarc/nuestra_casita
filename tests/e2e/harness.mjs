// Utilidades compartidas por smoke, touch y bench.
// Arranca el servidor de Vite en un puerto libre, lanza Chromium headless y
// lleva el juego desde la pantalla de acceso hasta la casita en modo demo.
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Render por software: en CI y en contenedores no hay GPU.
export const GL_ARGS = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

// Estado de localStorage que evita avisos y efectos en las pruebas.
// nc_lang='es': los selectores de las pruebas son los textos en español.
const TEST_STORAGE = { nc_fx: '0', nc_news: '99', nc_evday: '2099', nc_lang: 'es', nc_noscenes: '1', nc_noboot: '1' };

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/** Arranca Vite (modo dev) en un puerto libre. Devuelve { url, close }. */
export async function startVite() {
  const port = await freePort();
  const server = await createServer({
    root: ROOT,
    logLevel: 'error',
    server: { host: '127.0.0.1', port, strictPort: true },
  });
  await server.listen();
  const url = `http://127.0.0.1:${port}`;
  return { url, close: () => server.close() };
}

export async function launch() {
  return chromium.launch({ headless: true, args: GL_ARGS });
}

/** Contexto con localStorage de pruebas. Acepta opciones extra (p. ej. táctil). */
export async function newContext(browser, opts = {}) {
  const { scenes, boot, ...rest } = opts; // scenes: true deja ver las escenas narradas (por defecto se desactivan para no tapar los clics)
  const context = await browser.newContext({ locale: 'es-ES', ...rest });
  await context.addInitScript((storage) => {
    try {
      for (const [k, v] of Object.entries(storage)) {
        if (localStorage.getItem(k) === null) localStorage.setItem(k, v);
      }
    } catch { /* sin localStorage: la prueba seguirá, aunque con avisos */ }
  }, { ...TEST_STORAGE, ...(scenes ? { nc_noscenes: '0' } : {}), ...(boot ? { nc_noboot: '0' } : {}) });
  return context;
}

/** Registra errores de página: excepciones no capturadas y console.error. */
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  return errors;
}

/**
 * Entra en modo demo, crea la casita y pasa la pantalla de avatar.
 * Deja el juego en marcha (canvas y HUD montados).
 */
export async function startGame(page, url, { name = 'Tester', timeout = 120_000 } = {}) {
  await page.goto(`${url}/?hour=12&weather=clear&debug=1`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder="Tu nombre"]', name);
  await page.click('button.btn.big:not(.primary)');
  await page.click('button:has-text("Crear")');
  await page.waitForSelector('.code', { timeout });
  await page.click('.btn.primary.big');
  await page.waitForSelector('text=Empezar', { timeout });
  await page.click('.btn.primary.big:has-text("Empezar")');
  await page.waitForSelector('canvas', { timeout });
  await page.waitForSelector('.toolbar', { timeout });
  await page.waitForFunction(() => !!window.__nc && !!window.__nc.runtime?.me, null, { timeout });
}
