# Pruebas automáticas (e2e y rendimiento)

Además de los tests unitarios de lógica (`npm test`, Vitest), hay tres scripts con Playwright que arrancan el juego de verdad en Chromium headless. Están en `tests/e2e/` y **no** forman parte de `npm test`.

| Comando | Qué hace | Duración aproximada |
|---|---|---|
| `npm run smoke` | Test de humo: arranque, paneles, chat, Hoy y prueba táctil emulada | ~4 min |
| `npm run bench` | Medición orientativa de ms por fotograma, normal vs `&nofog` | ~1 min |

Ambos arrancan solos el servidor de Vite (puerto libre, modo dev) y lo cierran al terminar. No hace falta tener `npm run dev` abierto.

## Requisitos

- `npm install --legacy-peer-deps` (Playwright va como devDependency: `playwright@1.63.0`).
- Un Chromium que Playwright encuentre. En el contenedor de desarrollo ya está instalado en `/opt/pw-browsers`. En otro entorno: `npx playwright install --with-deps chromium` (es lo que hace el job de CI).
- No hace falta `.env.local`: todo corre en **modo demo** (localStorage + BroadcastChannel, sin Firebase).

## `npm run smoke` (`tests/e2e/smoke.mjs`)

1. Abre `/?hour=12&weather=clear&debug=1` con `localStorage`: `nc_fx=0` (sin efectos), `nc_news=99` (sin novedades), `nc_evday=2099` (sin evento del día) y `nc_lang=es` (los selectores son textos en español).
2. Flujo de arranque: nombre → «Jugar en modo demo» → «Crear» → «Entrar a la casita» → «Empezar» (el primer render por software puede tardar ~30 s).
3. Comprueba:
   - ningún `pageerror` ni `console.error` durante el arranque;
   - existen el canvas 3D y el HUD (`.toolbar`);
   - **cada panel** de `src/ui/HUD.jsx` se abre sin errores. La lista de ids se lee del propio HUD (`{panel === 'x' && …}`), así que un panel nuevo se prueba solo;
   - el panel «Hoy» (`today`) muestra su contenido (`.today`);
   - el chat (`.chatfab`) se abre sin errores;
   - al final de la sesión de escritorio, 0 errores acumulados.
4. **Prueba táctil** (`tests/e2e/touch.mjs`, nuevo contexto con `hasTouch` e `isMobile`, viewport 1024×768), con `Input.dispatchTouchEvent` de CDP:
   - existe `.touchctl` (botones ＋ － ↺ ↻);
   - un pellizco de dos dedos cambia `window.__camTarget.zoom`;
   - un giro de dos dedos cambia `window.__camTarget.off`;
   - tras los gestos (y pasados los 350 ms de guarda de `gesture`), `window.__nc.runtime.me.x/z` no cambia: no camina al soltar.

Sale con código 1 si alguna comprobación falla, y lista las fallidas.

## `npm run bench` (`tests/e2e/bench.mjs`)

- Entra en demo y camina al jugador a velocidad constante (`me.x += 2 u/s`) durante **9 s** tras **1,5 s** de calentamiento. Cada fotograma se mide con `requestAnimationFrame`.
- Corre dos veces: normal y con `&nofog` (la misma sesión, recargando la página).
- Imprime media, p95, máximo, número de fotogramas y el recorrido (para comprobar que el jugador de verdad se movió) y la comparación en %.

**Cómo leerlo:**
- Es una **medición orientativa**. Chromium usa render por software (swiftshader, sin GPU), así que los tiempos (~1 s por fotograma) no son los de un ordenador o un iPad reales.
- Solo hay ~9 muestras por corrida. Con tan pocas, **el p95 es prácticamente el máximo**; no lo uses como dato fino.
- El ruido medido en esta máquina es de ±5 % entre corridas (ver `docs/decisiones.md`, sección de niebla). Una diferencia menor que eso no es significativa.
- La corrida `nofog` va después de la normal, así que comparte la caché y el calentamiento. No es un doble ciego.
- Para decisiones de rendimiento, medir en el dispositivo real (**[POR CONFIRMAR]**, ver `docs/plan-siguiente.md`).

## Integración continua

`.github/workflows/ci.yml` tiene un job `e2e` aparte de `check` (que sigue igual: lint, test, build). Hace `npm ci --legacy-peer-deps`, `npx playwright install --with-deps chromium` y `npm run smoke`. No está como requisito de `check`; si falla, se ve en el PR, pero no bloquea el job de lint/test/build.

## Qué NO comprueban

- **iPad real ni Safari.** La prueba táctil es emulada en Chromium. Los gestos reales del sistema, el rendimiento en el iPad y los conflictos con los gestos de iOS siguen **[POR CONFIRMAR]** a mano.
- **Firebase real.** Todo corre en demo local. Auth de Google, reglas de Firestore/Realtime y el multijugador entre dos cuentas no se prueban aquí.
- **Dos jugadores a la vez.** El smoke usa una sola persona. El multijugador en demo se prueba a mano con dos pestañas.
- **Lo visual fino.** Solo se detectan errores de arranque, de render y de consola; no se compara una captura con otra.
- **Rendimiento real.** `bench` no sirve para fijar presupuestos de fotogramas.

## Cuándo se rompe y qué mirar

- Si cambian los textos en español de los botones que usa el flujo (`Jugar en modo demo`, `Crear`, `Entrar a la casita`, `Empezar`), hay que cambiar también el selector en `tests/e2e/harness.mjs`. Ojo: cambiar un texto existente rompe su traducción (ver `AGENTS.md`).
- Si cambia el nombre de `window.__nc`, `window.__camTarget` o la forma de `runtime.me`, hay que actualizar los scripts (`main.jsx`, `CameraRig.jsx`, `runtime.js`).
- Si el smoke falla solo en CI pero no en local, mirar el log del job `e2e` (Chromium y render por software pueden variar).
