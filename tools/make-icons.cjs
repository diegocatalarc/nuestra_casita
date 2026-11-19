// Genera los iconos PNG de la PWA a partir de public/icon.svg con Chromium (Playwright).
// Uso: node tools/make-icons.cjs   (requiere `playwright` disponible; no es dependencia del proyecto)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const pub = path.join(__dirname, '..', 'public');
const svg = fs.readFileSync(path.join(pub, 'icon.svg'), 'utf8');
const OUT = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512], // el SVG ya deja el contenido en la zona segura (66 % central)
  ['apple-touch-icon.png', 180],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, size] of OUT) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
    await page.screenshot({ path: path.join(pub, name), clip: { x: 0, y: 0, width: size, height: size } });
    console.log('ok', name);
  }
  await browser.close();
})();
