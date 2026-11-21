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
