# Calidez visual (tanda 1, rama `feature/visual-tanda1`)

Objetivo: acercar el aspecto a la calidez de Stardew Valley (colores cálidos, luz dorada, vida, detalle) sin empeorar el presupuesto de `docs/rendimiento.md`. Sin niebla de escena ni bruma de suelo (no reintroducir).

## Qué hay y cómo ajustarlo

| Pieza | Fichero | Qué hace | Ajuste |
|---|---|---|---|
| Luz por hora y estación | `game/lighting.js` | Tabla `KEYS` (cenit, horizonte, sol, sombras): hora dorada (sol ámbar, sombras violetas a las 6:30 y 18:30), mediodía cálido, noche azul-violeta legible. `SEASON_SUN` tiñe el sol por estación; `SEASON_COLORS` (hierba/hojas) más cálidos y otoño naranja-rojizo. `L` gana `zenith`, `horizon`, `cloudCol` (`L.sky` sigue existiendo como media). | Editar `KEYS` y `SEASON_*`. Luz hemisférica con suelo cálido en `Lighting.jsx`. |
| Cielo | `scene/Sky.jsx` (`SkyDome`) | UN cuadro a pantalla completa en el plano lejano, dibujado al final de los opacos con prueba de profundidad (la GPU descarta los píxeles tapados por el terreno). Degradado cenit→horizonte, resplandor del sol, nubes lejanas pintadas desde una textura de ruido 128² horneada una vez. Uniformes copiados de `L` cada fotograma (unos números). Más cubierto y gris con lluvia/tormenta/nieve. | `cover` (cobertura), umbral/borde de nubes y `uGlow` en `SkyDome`. |
| Viento | `scene/wind.js`, `Nature.jsx`, `Details.jsx` | Desplazamiento de vértices en mundo por instancia (altura sobre el suelo × amplitud × racha), uniformes compartidos `uTime`/`uWind`; `WIND_BY_WEATHER` (despejado 1, nieve 0,7, lluvia 1,8, tormenta 3,6). Árboles, pinos, matas, flores y juncos. Funciona con los bloques (`chunks.jsx`) y el raycast (la CPU no ve el balanceo, que es de unos cm). Primavera: flores silvestres ×1,35; invierno: ninguna. | `amp` de cada `swayMaterial(...)` / `windMaterial(...)`, `WIND_BY_WEATHER`. |
| Agua | `scene/water.js`, `Terrain.jsx` | Shader sobre el plano de agua: color somero→profundo por una textura de alturas (201² 8 bits), espuma animada en la orilla (+ segundo frente en escritorio), reflejo falso del color del horizonte (`L.horizon`), ondas de normal y destellos del sol/luna. Sustituye las 120 chispas instanciadas (−1 llamada, −120 matrices por fotograma). | `FOAM`/`REFLECT`/`GLINT` (comentados en el GLSL), `uGlint` en `Terrain.jsx`. |
| Halos nocturnos | `scene/Halos.jsx` | Una malla instanciada (1 llamada) de cuadros aditivos orientados en el vertex shader sobre farolas, hogueras, faroles del pueblo y lámparas (las mismas fuentes que `LightPool`, vía `useLightSources`). Solo visible al oscurecer o con lluvia. Luciérnagas con textura de punto suave. | `HALO_MAX`, radio `0.9 + base*0.5`. |
| Contorno | `scene/toon.jsx` | El casco invertido de `<P>` (avatares, vecinos, animales, barca) pasa a grosor **constante en pantalla** (~1,6 px, escalado ligeramente con el zoom) empujando el casco por la normal en espacio de recorte; marrón cálido `#4a2f26`. Un material por grosor, un uniforme (`OutlineSync`). Mismo número de mallas que antes. | `OUTLINE_PX`, `OUTLINE_COLOR`, `out` de cada `<P>`. |

## Qué se apaga o simplifica en táctil (`pointer: coarse`)
- Agua: sin ondas de normal, sin segundo frente de espuma ni segundo destello (`WATER_SIMPLE`).
- Sin postproceso (ya era así): el brillo lo dan los halos aditivos, no el bloom.
- Cielo, viento, halos y contorno: igual que en escritorio (coste de un cuadro / un uniforme).

## Medidas (`npm run perf`, swiftshader; `perf-results/antes.json` y `despues.json`)

| Métrica | Antes | Después | Cambio |
|---|---|---|---|
| Draw calls quieta p50 escritorio / iPad | 982 / 1037 | 994 / 1050 | +1,2 % / +1,3 % |
| Draw calls moviéndose p50 escritorio / iPad | 980 / 1073 | 993 / 1077 | +1,3 % / +0,4 % |
| Triángulos quieta p50 escritorio / iPad | 606 000 / 663 912 | 603 634 / 661 626 | −0,4 % / −0,3 % |
| JS de entrada (gzip, chunk estático) | 272 585 B | 272 585 B | 0 |
| JS total (gzip) | 787 515 B | 791 863 B | +0,6 % |
| `useFrame` p95 (solo JS) quieta escritorio / iPad | 0,6 / 0,6 ms | 0,6 / 0,5 ms | = |
| Fugas (geometrías/texturas/programas) | 0 | 0 | = (el «leak=true» al caminar en iPad es la caché de geometrías y aparece igual en «antes») |
| Texturas | 23 / 5 | 25 / 7 | +2 (ruido de nubes, alturas del agua) |

## Capturas
`npm run shots -- --label despues` (todas) o `--set quick`; `--root <copia>` para el commit base. Salen en `shots/<label>/` (ignorado por git). Incluye escena de la casita (horas 6/12/18/22, estaciones, lluvia, nieve, tormenta), cámara arrastrada al borde del mapa (cielo/horizonte), vistas del agua y un iPad táctil emulado. Hora, estación y clima se cambian en caliente sobre `DEBUG` de `game/time.js` (solo servidor de desarrollo).

## No hecho / límites
- Contorno en edificios: se descartó; están escritos a mano en JSX (~190 piezas) y un casco por pieza duplicaría llamadas.
- Halos en ventanas y farolillos del festival: ya brillan por su material emisivo (y el bloom en escritorio); en táctil no tienen halo.
- El cielo solo se ve en los bordes del encuadre por defecto; se nota al arrastrar el mapa o alejar la cámara.


---

# Tanda 2: contorno global, nitidez, vida y pulido

## Contorno global (`scene/OutlineEffect.js`, `scene/Effects.jsx`)
- Efecto propio de `postprocessing` que usa SOLO la profundidad de la escena (sin `NormalPass`, sin segundo render). Un píxel es borde si, en 4 ejes y 2 radios (≈2 px de búfer), el par simétrico cumple `2d - d(+r) - d(-r) > uSil`: un plano inclinado (tejado, ladera) se cancela y un escalón de profundidad (silueta) no. El trazo sale por fuera del objeto, también contra el cielo y entre árboles. La fracción de muestras que acierta da antialiasing al trazo.
- No hay línea en el cielo (no escribe profundidad; las nubes son color) ni en el agua (transparente, sin profundidad), ni en lluvia, nieve, halos o partículas (sin escritura de profundidad). Funciona con chunks e instancias porque lee el z-buffer.
- Color `#33201a` antes de la etapa de color (sale ≈ `#4a2f26` tras ACES y brillo). Grosor constante en píxeles de pantalla (`1.7 × dpr`, ≈1,5-2 px), independiente del zoom.
- **Importante**: el efecto va el PRIMERO de la cadena: solo el primer `EffectPass` ve la profundidad de la escena (después los búferes se intercambian y el depth sale vacío).
- Se probó un segundo canal de «pliegues internos» (segunda diferencia de profundidad) y se descartó: dibuja bandas de cuantización sobre los tejados. Los bordes internos (tejado/pared) no tienen contorno; sí lo tienen las siluetas de todo.
- Con el contorno global activo los cascos invertidos de `toon.jsx` (personajes, animales, barca) se apagan (`setHullOutlines(false)`) para que no se vean dobles; con «Normal» siguen activos.
- Ajustes: `OutlineEffect` (`thick`, `sil` = salto de profundidad mínimo en unidades de mundo, `strength`, `sharp`, `color`) y el cálculo del grosor en `Effects.jsx`.

## Nitidez
- Se quitó el TiltShift (desenfocaba arriba y abajo). Realce ligero (unsharp de 4 muestras, `sharp`=0,35 escritorio / 0,2 táctil) con «coring» (ignora detalle < 0,03: sin él realzaba el grano de las sombras y dibujaba rayas en los tejados).
- Antialiasing: escritorio MSAA ×4 del composer (el depth se resuelve sin multisample, por eso el trazo se suaviza en el shader); táctil «Alta» sin multisampling. No se añadió SMAA/FXAA.

## Calidad gráfica (⚙️ Ayuda → «Calidad gráfica: Normal / Alta», `nc_fx`)
- Alta (`store.quality = true`): escritorio = bloom + color + viñeta + ACES + contorno global + nitidez (MSAA ×4). Táctil = versión barata: un solo `EffectPass` (contorno + nitidez + ACES), sin bloom/viñeta, sin multisampling.
- Normal: sin postproceso; contorno solo en personajes/animales (cascos). Por defecto: escritorio Alta, iPad Normal.
- Cómo medir en iPad: ⚙️ Ayuda → «⏱️ Medir fluidez (5 s)» con Normal y con Alta (misma vista, sin tocar nada) y comparar fps/p95; el informe copiado incluye `Calidad gráfica`. Con swiftshader el coste de GPU no es medible; `npm run perf` solo mide la ruta Normal en iPad.

## Vida (`scene/Life.jsx`, `Buildings.jsx`, `Crops.jsx`)
- Mariposas y libélulas: 1 malla instanciada con aleteo en el vertex shader (12 en escritorio, 6 táctil), van de flor en flor (nodos `flower` de la zona); más en primavera/verano de día, pocas en otoño, ninguna de noche/lluvia/nieve/invierno.
- Pajarillos (4 / 2 táctil): saltan por el suelo, picotean, a veces cruzan volando; se asustan si el personaje pasa cerca; solo de día y sin lluvia.
- Hierba alta (120/70 instancias) y flores extra (80/40) alrededor de la casa y los caminos, con el viento de `wind.js`; en invierno desaparecen las flores y la hierba toma el color de nieve, en primavera hay más flores.
- Chispas (`Sparks`): al sembrar (🌱), regar (💧) y cosechar (+N): se detectan en `store.fx`, sin tocar las acciones.
- Humo de chimenea: 7 bocanadas (antes 4) que se inclinan con el viento y se ensanchan al subir.
- «Pop» de escala del cultivo al plantarse (después de la carga inicial) y al pasar de fase.
- Apagar: quitar `<Life />` de `GameCanvas.jsx`; cantidades en las constantes `BUT_MAX`, `BIRD_MAX`, `GRASS_N`, `FLOWER_N` de `Life.jsx`.

## Pulido
- Sol: sprite con degradado suave y corona (aditivo, sin escribir profundidad), no un disco plano. La luna tampoco escribe profundidad (si no, el contorno la rodeaba).
- Sombras de nubes (`CloudShadows`): 5 en vez de 8, más pequeñas, y `shadow-intensity` 0,88 de la luz del sol (todas las sombras algo más suaves).
- Agua al atardecer: reflejo del cielo y destellos suben con el sol bajo (`uReflect`, `uGlint` en `Terrain.jsx`).

## Cifras tanda 2 (`npm run perf`, swiftshader; `perf-results/antes.json` = commit base original, `t1.json` = fin de tanda 1, `t2.json` = ahora)

| Métrica | Original | Tanda 1 | Tanda 2 |
|---|---|---|---|
| Draw calls quieta p50 escritorio / iPad (Normal) | 982 / 1037 | 994 / 1050 | 978 / 1056 |
| Draw calls moviéndose p50 escritorio / iPad | 980 / 1073 | 993 / 1077 | 975 / 1091 |
| Triángulos quieta escritorio / iPad | 606 k / 664 k | 604 k / 662 k | 604 k / 665 k |
| JS de entrada gzip | 272 585 | 272 585 | 272 610 |
| JS total gzip | 787 515 | 791 863 | 797 007 |
| `useFrame` p95 solo JS escritorio quieta / mov. | 0,6 / 1,0 | 0,6 / 0,7 | 0,6 / 0,9 |
| Fugas | 0 | 0 | 0 |

Escritorio queda por debajo del original (se quitó el TiltShift y el contorno entra en un pase existente). iPad Normal: +1,9 % quieta / +1,7 % moviéndose frente al original (límite +3 %): hierba, flores, insectos y pájaros suman ~20 llamadas. Con iPad «Alta» se añade un `EffectPass` y la pasada de composición: no medible aquí.
