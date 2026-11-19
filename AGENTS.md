# AGENTS.md — Nuestra Casita

Guía para cualquier agente de IA que trabaje en este repo. Sin acceso al historial de conversaciones: todo lo necesario está aquí y en `docs/`.
Lo no confirmado va marcado **[POR CONFIRMAR]**.

## Qué es
Videojuego cozy 3D (low poly, isométrico, persistente) para **parejas a distancia**: dos personas comparten una casita, huerto, animales, pesca, crafteo, pueblo y exploración, cada una desde su dispositivo. Español (base) e inglés. Lo juegan la persona dueña del proyecto y su pareja: **la jugabilidad y los textos importan tanto como el código**.

## Stack
React 18 · Vite 5 · Three.js 0.169 vía `@react-three/fiber` + `drei` + `postprocessing` · zustand (estado) · Firebase 10 (Auth Google, Firestore, Realtime DB; proyecto `bri-game` en `.firebaserc`) · Vitest 2 · ESLint 9. JavaScript (no TypeScript), módulos ES, JSX.

## Comandos (desde la raíz)
```bash
npm install --legacy-peer-deps   # con este flag se instalaron vitest/eslint y lo usa el CI; `npm install` a secas dio ERESOLVE al añadir vitest [POR CONFIRMAR si falla con el lock actual]
npm run dev                      # http://localhost:5173 (modo demo si no hay .env.local)
npm test                         # vitest run (tests/*.test.js, lógica pura, sin red)
npm run lint                     # eslint src: solo regla no-undef (detecta imports que faltan)
npm run build                    # vite build → dist/
node tools/i18n-missing.cjs      # lista textos t("…") sin traducción al inglés (vacío = OK)
```
Probar sin Firebase: abrir **dos pestañas** en `npm run dev` → demo → Crear / Unirme con el código (localStorage + BroadcastChannel).
Parámetros URL: `?fast=60` (acelera crecimiento) · `?hour=12` · `?weather=clear|rain|snow|fog` · `?season=0..3` · `?nofog` desactiva la niebla (para comparar rendimiento) · `?debug` expone `window.__nc` (`useGame`, `actions`, `runtime`, `logic`, `backend`) y `window.__camTarget` · `?showroom` sala de pruebas visual de objetos (`__show(tipo, variante, giro)`).
Claves localStorage útiles: `nc_fx` (`'0'` desactiva efectos, útil en tests headless), `nc_news` (versión de novedades vista; `99` las oculta), `nc_evday`, `nc_lang`, `nc_muted`, `nc_cloud`.
Firebase real: `cp .env.example .env.local` y rellenar `VITE_FIREBASE_*`; desplegar `firestore.rules` y `database.rules.json` (ver `docs/02-ARQUITECTURA.md` §11).

## Dónde está cada cosa
```
src/
  main.jsx, App.jsx        arranque, sesión, tick de 1 s (exploreTick, datesTick, checkGifts…), cambio de casita
  Showroom.jsx             sala de pruebas visual (?showroom)
  store/gameStore.js       zustand: estado de UI + espejo del estado de la pareja (WORLD_COLS)
  services/backend/        interfaz única de persistencia: firebaseBackend.js y localBackend.js (misma API), index.js elige
  game/                    LÓGICA (sin React): 
    constants.js           datos de balance/contenido (precios, recetas, decoración…) · exploreData.js (niebla, pueblo, POIs)
    logic.js               funciones puras (cultivos, pedidos, eventos, pesca, economía…) ← lo más testeable
    worldGen.js            generateWorld(seed, zonas): terreno determinista · fog.js niebla · movement.js colisión/A*
    actions/               acciones que leen el store y escriben al backend, por dominio (core, base, vitals, family,
                           mailbox, chat, fishing, economy, events, land, dates, gifts, explore, neighbors, craft).
                           Se importa siempre desde 'game/actions' (index.js reexporta todo)
    initialState.js        COLLECTIONS, schemaVersion, estado inicial · runtime.js estado mutable fuera de React (posiciones)
    craftParts.js, worldParts.js, models.js   modelos procedurales (formato de piezas, ver abajo)
  scene/                   R3F: un componente por elemento del mundo (Terrain, Crops, Buildings, Decor, Fog, Discover…)
  ui/                      paneles HTML (HUD.jsx con la barra de menús, un *Panel.jsx por sistema), news.js = Novedades
  i18n/                    index.js (t()), en.js + en-extra.js (diccionario inglés)
tests/                     Vitest
tools/                     scripts .cjs de i18n (ver Zonas sensibles) · docs/ GDD, arquitectura, funciones, decisiones, estado
firestore.rules, database.rules.json, firebase.json, .github/workflows/ci.yml (lint + test + build)
```
Lectura obligada antes de tocar nada grande: `docs/02-ARQUITECTURA.md` (esquema Firestore, multijugador), `docs/decisiones.md`, `docs/estado.md`.

## Convenciones
- **Idioma del código:** identificadores en inglés; comentarios, textos de jugador y docs en español.
- **Textos de interfaz: siempre `t("Texto en español", [valores])`** con `{0}`,`{1}`. La clave ES el texto en español. Todo texto nuevo necesita su traducción en `src/i18n/en-extra.js` (formato `"clave": "valor",`). Comprobar con `node tools/i18n-missing.cjs`. Cambiar el texto español de una clave existente rompe su traducción en silencio: cambia también la clave en `en*.js`.
- **Toda función nueva visible para el jugador** lleva aviso: entrada nueva en `src/ui/news.js` (`NEWS`, `v` +1; `NEW_TABS` si hay botón nuevo → badge 🆕) y sección en `docs/03-NUEVAS-FUNCIONES.md`.
- **Escrituras al backend** solo mediante `commit([...ops])` en `game/actions/`. Ops: `{op:'set'|'del', col, id, data}` para subcolecciones; `{op:'inc', field, by}` y `{op:'patch', data}` sobre el documento raíz de la pareja (rutas con puntos: `'inventory.wood'`). Firestore no admite `undefined` (usar `clean`).
- **Determinismo:** lo que ambas personas deben ver igual (mundo, pedidos, eventos, excavaciones…) se deriva de `seed + día UTC` con `mulberry32(hashStr(...))` (`game/rng.js`). No usar `Math.random()` para eso.
- **Simulación perezosa:** crecimiento, hambre, producción se calculan al leer con marcas de tiempo; no hay servidor ni tareas programadas.
- **Rendimiento:** lo que cambia por frame va en `game/runtime.js`/refs, no en zustand. Selectores finos en `useGame(s => …)`.
- **Modelos procedurales** (sin assets externos): listas de piezas `[forma, pos, tamaño, color, opts]`; formas `b` caja, `c` cilindro, `o` elipsoide, `k` cono, `t` toro, `g` cristal, `d` octaedro; colores `'v'`, `'v+'`, `'v-'` (variante del color elegido); opts `r, anim (sway|spin|spinz|bob|flutter|glow|swim|pulse), glow, op, seg, win, lamp`. Renderizado en `scene/Decor.jsx` (`PartsModel`/`PartsList`). Al cambiar de tipo, usar `key={tipo}`.
- Estilo: componentes funcionales, 2 espacios, comillas simples en JS (dobles dentro de `t("…")`), sin dependencias nuevas sin motivo.

## Zonas sensibles (pedir permiso antes)
- **`generateWorld` / `worldGen.js` y las semillas:** las partidas guardadas dependen de que el terreno base 50×50 salga idéntico. Los cambios van en zonas nuevas (`expandZone`, `withFree`), nunca alterando la generación base.
- **Esquema Firestore y `COLLECTIONS`:** añadir una colección exige editar `initialState.js`, `gameStore.js` (WORLD_COLS + los 2 resets) y el reset de `switchHouse` en `App.jsx`. Cambiar/renombrar campos existentes rompe partidas guardadas (no hay migraciones).
- **`firestore.rules` / `database.rules.json`:** el comodín `/{collection}/{docId}` permite colecciones nuevas sin tocar reglas. Cualquier cambio de reglas afecta a datos reales: avisar.
- **Claves de i18n existentes y claves de `constants.js` usadas como id** (ids de cultivos, items, decoración): están guardadas en los datos de la pareja.
- **`.env.local` y credenciales:** nunca leer en voz alta, copiar ni commitear (ver `.gitignore`).
- **Orden de definición en `constants.js`:** hay bloques que dependen de `PRICES` y otros; ya hubo errores de "no definido" por orden (ver `docs/decisiones.md`).
- **`tools/i18n-*.cjs` (codemod histórico)** requieren `@babel/*` (solo dependencia transitiva): no ejecutar sobre `src` sin revisar; modificaron muchos ficheros en su día.
- **Economía/balance** (`HEART_RULES`, precios, probabilidades): son estimaciones sin telemetría; cambios grandes alteran la partida de personas reales.

## Flujo de trabajo
1. Trabajar siempre en una rama `feature/<tema>`. **Nunca push directo a `main`.** Commits pequeños y descriptivos.
2. Antes de dar algo por hecho: `npm run lint && npm test && npm run build`. Para cambios visuales o de interacción, comprobarlo en el navegador (dos pestañas demo).
3. Al terminar cada sesión, **actualizar `docs/estado.md`** (qué se hizo, qué queda, bugs nuevos) y, si hubo una decisión no obvia o un intento fallido, añadirlo a `docs/decisiones.md`.
4. No hacer commit/push/PR sin que la persona responsable lo pida.
5. Despliegue manual: `npm run build` y subir `dist/` (o el zip de `dist`) a Netlify **[POR CONFIRMAR: sitio y proceso exactos]**; Firebase Hosting está configurado en `firebase.json` pero no sé cuál es el destino real.
> **Nota:** el repo git se inicializó localmente (rama de trabajo `feature/fuente-y-niebla`, `main` sin commits). **[POR CONFIRMAR: dónde está el repo remoto]**
