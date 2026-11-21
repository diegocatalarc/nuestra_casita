# Rendimiento: criterios, medición y resultados

Rama `feature/rendimiento`. Objetivo: que el juego corra más fluido en escritorio (Edge/macOS) y en iPad (Safari), **sin cambiar el aspecto apreciablemente** y sin tocar mundo, semillas, datos ni lógica.
Prioridades de la persona usuaria: (1) **carga inicial**, (2) **mover personaje y cámara** (tirones al caminar, zoom, giro), (3) **abrir menús y paneles**.

## Cómo medir

```bash
npm run perf -- --label antes            # build + medición completa (≈ 10 min con render por software)
npm run perf -- --label despues --quick  # versión corta (6 s por fase)
npm run perf -- --label antes --root /ruta/a/otra/copia --no-build   # medir otra revisión (p. ej. un `git archive` con node_modules enlazado)
```
`tests/e2e/perf.mjs` construye (`vite build`), sirve con `vite preview` y mide con Chromium headless y **render por software** (swiftshader): los tiempos absolutos de GPU **no valen**; se comparan antes/después **en la misma máquina** y con métricas independientes de la GPU. Resultados en `perf-results/<label>.json` (ignorado por git; copias de la medición de este informe en `docs/rendimiento-datos/`).

Para que sea reproducible: `Math.random` determinista, casita de demo con semilla fija (4242, se fija por el backend al entrar), `hour=12`, `weather=clear`, `nc_noboot=1`, `?debug` (expone `window.__nc`, `__gl`, `__r3f`). Dos perfiles: **escritorio** 1024×640 (postproceso activo) e **iPad táctil** 1024×768 emulado (`pointer:coarse`, UA de iPad, postproceso apagado por defecto).

Fases por perfil (20 s cada una): cámara **quieta** y **moviéndose** con render real (draw calls, triángulos, memoria/fugas) y tres fases **«solo JS»** (`gl.render` anulado: sin GPU por software salen ~1200 fotogramas y se ve el coste puro de JS) con cámara quieta, moviéndose y **zoom + giro**. Después se abren 7 paneles midiendo desde el cambio de estado hasta que existe su `.modal` en el DOM (1.ª y 2.ª apertura; incluye cargar el chunk diferido).
Métricas: `renderer.info` (draw calls, triángulos, geometrías, texturas, programas) por fotograma; suma de los `useFrame` y tiempo de `gl.render` por fotograma (p50/p95); commits de React por segundo (gancho DevTools); tareas largas > 50 ms (`PerformanceObserver`); CDP `Performance.getMetrics` (Script/Layout/RecalcStyle por fotograma); bytes gzip de JS en la carga y tiempos hasta pantalla de acceso/pantalla de carga con CPU ×2 más lenta (mediana de 3 cargas en frío).

## Línea base (commit `a39e1a2`, antes de optimizar)

Hallazgos que guiaron el trabajo:
- **~1.100 draw calls y ~1,56 M de triángulos por fotograma**; el 55-65 % es la **pasada de sombras** (el volumen de sombras era fijo ±26 u de 80×80 y las capas instanciadas —árboles, hierba— y el terreno (205 000 triángulos en una sola malla) se dibujaban **enteros** dos veces aunque en pantalla se ve ~1/8 del mundo).
- Al caminar se subían a la GPU **~105 geometrías nuevas** (solo se suben al aparecer en cámara) y se compilaba un programa: tirones.
- `GameCanvas` se re-renderizaba cada segundo (el reloj de `App`) y reconciliaba toda la escena: **9 commits/s en reposo**.
- Chunk de entrada: **615 KB gzip** (los modelos `.glb` en base64 dentro del JS, el diccionario inglés, 22 paneles, postproceso).

## Resultados

| Métrica (misma máquina) | Antes | Después | Cambio |
|---|---|---|---|
| **Carga** · JS gzip hasta la pantalla de acceso | 614 598 B | 467 987 B | −24 % |
| Carga · JS del chunk de entrada (estático) | 614 598 B | 272 256 B | **−56 %** |
| Carga · tiempo hasta pantalla de acceso (CPU×2) | 1 292 ms | 866 ms | −33 % |
| Carga · primer contenido (FCP) | 1 264 ms | 836 ms | −34 % |
| Carga · hasta botón «Entrar» | 21,7 s | 18,5 s | (limitado por la regla de 30 fotogramas < 45 ms, imposible con render por software; no concluyente) |
| **Mover** · draw calls p50 (escritorio / iPad) | 1 242 / 1 176 | 982 / 989 | −21 % / −16 % |
| Quieta · draw calls p50 (escritorio / iPad) | 1 110 / 1 089 | 975 / 984 | −12 % / −10 % |
| **Mover** · triángulos p50 (escritorio / iPad) | 1 598 k / 1 580 k | 602 k / 646 k | **−62 % / −59 %** |
| **Mover** · geometrías subidas a la GPU caminando 20 s | +106 / +103 | **0 / 0** | sin tirones por subida |
| Fugas (geometrías/texturas/programas) en reposo y al moverse | 0 (la subida al caminar era caché, no fuga) | 0 | = |
| **Mover** · `useFrame` p95 (solo JS) escritorio / iPad | 1,4 / 1,0 ms | 0,7 / 0,8 ms | −50 % / −20 % |
| **Zoom+giro** · `useFrame` p95 (solo JS) | 1,3 / 1,0 ms | 0,7 / 0,8 ms | −46 % / −20 % |
| Reposo · `useFrame` p95 (solo JS) | 1,1 / 0,9 ms | 0,7 / 0,7 ms | −36 % / −22 % |
| Reposo · commits de React / s (solo JS) | 9,0 | 1,0 (iPad 2,4) | −89 % / −73 % |
| Mover · commits de React / s (solo JS) | 9,7 | 2,1 (iPad 1,7) | −78 % / −82 % |
| Tareas largas > 50 ms en reposo (solo JS) | 0 | 0 | = |
| **Paneles** · 1.ª apertura (JS, sin GPU) | 1-9 ms | 2-6 ms | = (los chunks se precargan en reposo) |
| Pasada de sombras · mapa | 2048² (todos) | 1536² escritorio / 1024² táctil | −44 % / −75 % píxeles |

(`useFrame` = suma de todos los `useFrame` por fotograma; en las fases con render real incluye el coste de `gl.render` del compositor y no es comparable.)
Tareas largas con render real: no son interpretables aquí (swiftshader bloquea el hilo principal al dibujar); se reportan en el JSON.

### Umbrales de aceptación y veredicto

| Umbral fijado | Resultado |
|---|---|
| Draw calls −30 % | **No alcanzado**: −12 % en reposo, −21 % al moverse. Lo que queda (≈ 1 000) son ~190 cajas redondeadas y piezas **escritas a mano en JSX** en `Buildings`/`Props`/`Village`/`Plaza` (la casa sola son ~390 llamadas con sombras). Fusionarlas exige un horneado genérico de mallas estáticas que rompe el raycasting de los grupos con `onClick` y las animaciones por `ref`; se descartó por riesgo. Se fusionaron las piezas **dirigidas por datos** (`PartsModel`/`PartsList`). Los triángulos sí bajan −60 %. |
| JS por fotograma p95 −30 % | **Cumplido** en `useFrame` (−36 % a −50 %); el coste de `gl.render` (≈ 8-10 ms) con render por software no es fiable y apenas varía porque depende de los draw calls. |
| JS de entrada −20 % | **Cumplido**: −56 % del chunk de entrada, −24 % hasta la pantalla de acceso. |
| 0 fugas | **Cumplido** (y desaparece la subida de ~105 geometrías al caminar). |
| 0 tareas largas en reposo | **Cumplido** en las fases solo JS (0 en 60 s ×2 perfiles). |

## Qué se cambió

**Carga** (`vite.config.js`, `main.jsx`, `i18n/index.js`, `ui/HUD.jsx`, `scene/GameCanvas.jsx`)
- Los `.glb` ya no se incrustan en base64 en el JS (`assetsInlineLimit` por fichero): se piden por separado.
- Diccionario inglés (≈ 190 KB) bajo demanda: `loadDictionary()` se espera en `main.jsx` antes de importar `App` (los módulos llaman a `t()` al evaluarse). Solo se descarga si el idioma es inglés.
- 22 paneles del HUD con `React.lazy` y precarga en reposo (`requestIdleCallback`) para que abrirlos sea inmediato; el postproceso (`Effects`) solo se descarga si los efectos están activos (en táctil, apagados por defecto).

**Mover personaje y cámara** (`scene/*`)
- **Terreno en 25 bloques** que comparten atributos y solo cambian el índice (con esfera de descarte propia): antes 205 000 triángulos dibujados enteros dos veces por fotograma.
- **Vegetación en bloques espaciales de 10×10 u** (`scene/chunks.jsx`): cada capa instanciada (árboles, rocas, flores, hierba…) se parte en `InstancedMesh` por bloque para que funcione el descarte, y pinos y árboles de copa tienen capas separadas (ya no se dibujan instancias ocultas «escondidas» a escala 0,001).
- **Sombras** (`Lighting.jsx`): el volumen sigue al **centro de la vista** (no al personaje) y se ajusta al zoom/tamaño de pantalla más un margen según la altura del sol (12-26 u en vez de 26 fijo); mapa 1536² en escritorio y 1024² en táctil.
- **Precalentamiento** (`Prewarm` en `GameCanvas`): un dibujado sin descarte + `compile` a los ~0,5 s y a los ~2,5 s del montaje sube todas las geometrías y compila shaders mientras la pantalla de carga sigue encima. Si el montaje es lento el segundo pase lo cubre.
- Piezas estáticas de los modelos por datos fusionadas por material (color de vértice × AO horneado, mismos parámetros) y **geometrías simples compartidas** por parámetros (antes cada pieza creaba la suya); las piezas con animación, brillo, cristal o ventanas siguen sueltas. Cajas redondeadas con 2 segmentos en vez de 3 (−45 % de triángulos de cada caja; el radio es ≤ 0,06 u, imperceptible incluso al zoom máximo).
- Menos renders de React: `GameCanvas` con `memo` (se re-renderizaba cada segundo y reconciliaba toda la escena), `Interaction` con selector fino en vez de `useGame()`, y relojes gruesos (3 s / 1 min / 0,05 h) en `Crops`, `Animals`, `Children`, `Events`, `Explore`, `Discover`, `Players`. Piezas sin animación ya no se suscriben a `useFrame` (1 224 suscriptores → solo las animadas).

**Abrir paneles**: chunks diferidos + precarga en reposo → la apertura cuesta lo mismo que antes (2-6 ms de JS) aunque el código ya no esté en el chunk de entrada.

## Diferencias visuales (mismas semilla, hora 12, capturas antes/después)
- Sombras algo más nítidas en el zoom por defecto (el volumen cubre menos área con una textura 1536² → más píxeles por unidad) y ligeramente más suaves con el zoom máximo alejado (volumen 26 u con 1536²/1024²). En táctil (1024²) la sombra es algo más blanda.
- Resto idéntico a simple vista (árboles, casa, terreno, bordes redondeados incluso al zoom 90). El avatar y el código de la casita varían entre ejecuciones por `Math.random` de la demo, no por el cambio.

## Pendiente de medir en un iPad real / navegador real
- Nada de esto se ha medido con **GPU real**: ni fps, ni el hipo de `Prewarm`, ni la memoria de GPU de las geometrías subidas por adelantado (~750 frente a ~530 buffers, pero compartidas). Usar el panel ⚙️ → «Medir fluidez» en iPad (Safari) y en Edge/macOS, antes y después (desplegar ambas ramas).
- Tiempo real hasta «Entrar» (la regla de 30 fotogramas < 45 ms) y si el precalentamiento alarga la carga en un iPad lento.
- Que 1024² táctil de sombras se vea bien en pantalla Retina; si no, subir `SHADOW_PX` en `Lighting.jsx` (1536).
- Los ≈ 1 000 draw calls restantes: si en iPad real siguen siendo el cuello, el siguiente paso es instanciar/fusionar `Buildings` y `Props` a mano (por tipo de objeto) con pruebas visuales por objeto (`?showroom`).
