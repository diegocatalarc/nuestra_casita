# La historia del Valle (biblia + contratos técnicos)

Documento de referencia para todos los chats que trabajen en la historia, los vecinos y los proyectos del pueblo. **Canon:** lo escrito aquí manda; si algo falta, decídelo con criterio, dilo en tu informe y no cambies lo ya fijado. Tono: cozy, cálido, un punto humorístico, nada oscuro. Pensado para una **pareja a distancia** (una persona en ordenador, otra en iPad).

## Premisa
Hace años el **Reloj de la Plaza** marcaba la *Hora de las Cartas*: cada atardecer el pueblo encendía farolillos por quienes estaban lejos. Un invierno el reloj se paró (el relojero **Íñigo** perdió su «muelle del corazón») y el pueblo se fue quedando en silencio: tiendas cerradas, fuente seca, vecinos que ya no salían. Llegan dos personas que viven lejos la una de la otra y la alcaldesa **Remedios** reconoce lo que el valle esperaba: *«El reloj solo vuelve a andar cuando dos personas lejanas le dan cuerda a la vez».*

## Reparto (8 vecinos; la alcaldesa es la guía)
| id | Nombre | Rol | Dónde | Arco personal (resumen) |
|---|---|---|---|---|
| `remedios` | Doña Remedios 🏛️ | **Alcaldesa y guía.** Reparte «Cartas del Valle» (misiones) | Ayuntamiento | Guarda un secreto: ella escribió a alguien lejano cada tarde hasta que el reloj se paró; no sabe si llegó. |
| `marta` 👵 | Marta | Granjera (ya existe, 5 historias) | Su casa y huerto | Aprender de nuevo a cocinar para dos tras perder a Anselmo. |
| `pablo` 🧔 | Pablo | Pescador (ya existe) | Su casa y el río | Un pez legendario y una promesa; teme alejarse del río. |
| `luna` 👩‍🎨 | Luna | Pintora (ya existe) | Su casa y el puente | Busca el color de «lo que se echa de menos». |
| `rosa` 🥖 | Rosa | Panadera | Panadería | Heredó el horno pero no la receta de su abuela (pan de «las dos mitades»). |
| `inigo` 🕰️ | Íñigo | Relojero | Torre del reloj | Culpa: cree haber roto el reloj. En realidad el muelle lo guardó un vecino. |
| `celia` 🍎 | Celia | Maestra y hortelana | Escuela y huerto escolar | La escuela tiene 3 alumnos que quieren plantar «cosas que crecen rápido». |
| `tomas` 🛍️ | Tomás | Tendero y molinero | Tienda y molino | Siempre «a punto de cerrar»; guarda cartas sin entregar de años atrás. |

El **Café del Puente** y la **Capilla** quedan como escenarios: el café lo reabre Luna (rincón de arte) en el capítulo 5; la capilla acoge el final.

> **Actualización (v20):** la trama y los textos pasaron a «El Valle Atrasado» (ver `docs/historia-v2.md`). Se mantienen los ids de capítulo (`c1`…`c7`), proyectos, pasos y recompensas de abajo; cambian títulos, cartas, escenas y el clima de trama (`src/game/story/plot.js`).

## Estructura: «Libro I — Despertar el valle» (7 capítulos; mecánicas vigentes, textos antiguos)
Cada capítulo = una **Carta** (de Remedios u otro vecino) con **3 pasos** (siempre uno que use el bucle que ya os gusta: sembrar/cosechar/pedidos) y una **recompensa** (monedas, corazones, un objeto o un desbloqueo) y casi siempre una **pieza del reloj** (5 en total).
1. **Carta de bienvenida** (Remedios): conocer a Remedios, plantar y cosechar algo, entregar el primer pedido. *Proyecto:* reparar la **fuente** de la plaza. Pieza 0: el pueblo empieza a «despertar» (farolas).
2. **El horno apagado** (Rosa): entregar harina/cosecha, hornear con vuestra cocina. *Proyecto:* **panadería** abierta → vende pan y da un bonus de energía. Pieza 1.
3. **Cartas sin entregar** (Tomás): repartir 3 cartas a vecinos, ambos respondéis la misma misión del día. *Proyecto:* **tienda** reabre (semillas del día). Pieza 2.
4. **Tres alumnos y un huerto** (Celia): sembrar el huerto escolar (3 cultivos de ciclo corto) entre los dos. *Proyecto:* **huerto de la escuela / columpios**. Pieza 3.
5. **El color de la espera** (Luna): pintar con vuestros recuerdos, pescar con Pablo (arco de Pablo), reabrir el café. *Proyecto:* **café del puente**. Pieza 4.
6. **El corazón del reloj** (Íñigo): reunir las piezas, descubrir quién guardó el muelle (giro de Tomás/Remedios). *Proyecto:* **torre del reloj**: reparar con las piezas. Pieza 5 = el muelle.
7. **La Hora de las Cartas** (Remedios): **Festival de las Luces**: *los dos conectados al atardecer* (hora de juego 18-21), en la plaza a la vez, dan cuerda al reloj y encienden los farolillos; Remedios lee su carta. Recompensa: decoración exclusiva «Farolillos del Valle», título, +corazones, y desbloquea el **Mercadillo semanal** y nuevos capítulos (Libro II, a futuro).
Cada vecino tiene además 5 «historias de amistad» (ya existen `STORIES` para Marta/Pablo/Luna; escribir las de los otros 5).

## Contratos técnicos
### Estado en Firestore (documento raíz de la pareja; solo campos NUEVOS y opcionales)
```
couple.story = {
  chapter: 1,                      // capítulo actual (1-based)
  steps:   { "<chapterId>.<stepId>": { done: true, at: ms, by: uid } },
  base:    { "<metric>": n },      // contadores al empezar el capítulo (progreso = total − base)
  claimed: { "<chapterId>": true },
  pieces:  0,                      // piezas del reloj
  flags:   { "<flag>": true },     // desbloqueos: shop:bakery, event:market, …
}
couple.projects = { "<projectId>": { have: { item: n }, done: bool, doneAt: ms } }
couple.npc      = { "<npcId>": { met: true, talkedDay: "YYYY-MM-DD" } }   // la amistad sigue en couple.friends
```
Escrituras con `commit([...ops])` (ver AGENTS.md). Nada de renombrar campos existentes.

### Condiciones declarativas de los pasos (las implementa el motor; el contenido solo las usa)
`{ type:'stat', metric:'harvest'|'sell'|'order'|'fish'|'gather'|'feed'|'hug'|'memory'|'quest'|'build'|'date', n }` · `{ type:'deliver', item, n }` (se entrega a un vecino y consume el objeto) · `{ type:'talk', npc }` · `{ type:'friend', npc, level }` · `{ type:'project', id }` (proyecto terminado) · `{ type:'letter', n }` (cartas enviadas) · `{ type:'together', what:'plaza'|'bench'|'chat'|'clock' }` (las dos personas conectadas y juntas) · `{ type:'dusk' }` (hora de juego 18-21 con las dos personas conectadas) · `{ type:'flag', id }`.
Recompensas: `{ coins, hearts, items:{item:n}, unlock:'cosmetic id' | flag, piece:1 }`.

### Ficheros y responsables (para no pisarse)
| Fichero(s) | Quién |
|---|---|
| `src/game/story/engine.js`, `conditions.js`, `src/game/actions/story.js`, `src/ui/StoryPanel.jsx`, `tests/story-engine.test.js` | Motor de misiones |
| `src/game/story/characters.js` (campos descriptivos), `chapters.js`, `dialogue.js`, `src/i18n/en-historia.js` | Contenido (personajes, capítulos, diálogos) |
| `src/game/story/routines.js`, `src/scene/Npcs.jsx`, `src/ui/DialogueModal.jsx` | Vecinos vivos (mundo) |
| `src/game/story/projects.js`, `src/game/actions/projects.js`, `src/scene/ProjectVisuals.jsx`, `src/ui/ProjectPanel.jsx` | Proyectos del pueblo |
| `src/ui/Emotes.jsx`, `src/scene/Plaza.jsx` | Plaza viva y emotes |
| `src/ui/HUD.jsx`, `src/ui/news.js`, integración y publicación | Chat principal |
`characters.js` ya existe como esqueleto (id, nombre, emoji, rol, edificio, puntos de parada, aspecto); lo enriquece el contenido, lo **lee** el resto.

### Lo que SIEMPRE se respeta
Textos con `t("…")` y traducciones en `src/i18n/en-historia.js` (o el fichero propio de cada tema); sin atajos de teclado ni textos que supongan teclado (una persona juega en iPad); botones grandes; nada de `Math.random()` en lo que ambas personas deben ver igual; no tocar `worldGen.js`; no borrar datos ni ids existentes.

## Escenas narradas y guía de objetivo (v18)
La historia se **cuenta** en vez de mostrarse como lista de tareas. Sin cambios en el esquema de datos (no se escribe nada nuevo en la nube).
- **Guion:** `src/game/story/scenes.js` (generado a partir del guion; textos con `t()` y traducciones en `src/i18n/en-escenas.js`). Ids: `prologue`, `<cap>.intro`, `<cap>.<paso>` (reacción al cumplir un paso; sirve en cualquier orden), `<cap>.outro` (cierre + tarjeta de recompensa). Cada página: `{ who: 'narrator' | id de CAST, text }`.
- **Director** (`src/game/story/director.js`, puro): `dueScenes(state, seen)` decide qué escena toca. Parejas ya avanzadas no ven el prólogo ni capítulos pasados; quien se une a mitad de capítulo no ve de golpe los pasos hechos; si el capítulo se completa de golpe solo sale el cierre. Las escenas **vistas se guardan en localStorage por dispositivo** (`nc_scenes_<pareja>_<uid>`): cada persona ve cada escena una vez en su aparato. `objectiveFor(state)` da el objetivo actual (primer paso pendiente o «recibir recompensa»); `stepTarget` dice a qué vecino/lugar apunta.
- **UI:** `ui/StoryScene.jsx` (pantalla completa, retrato, texto que se escribe, toque para seguir, «Saltar», tarjeta de recompensa que llama a `claimStoryChapter`) · `ui/Objective.jsx` (banner arriba con flecha hacia el objetivo calculada con `cam.yaw`, distancia y barra de progreso) · en `scene/Npcs.jsx` el vecino objetivo lleva 📍 (`runtime.goal`, posiciones vivas en `runtime.npcPos`) · `DialogueModal` muestra la misión y deja entregar ahí mismo · el Diario permite revivir escenas.
- Las escenas esperan a que no haya panel ni diálogo abierto y exista avatar. Para desactivarlas en pruebas: `localStorage.nc_noscenes = '1'` (el harness e2e lo hace; `npm run scenes` las activa).
- **Por hacer:** escenas con la pareja presente (festival al atardecer), música/ambiente por escena, escenas para proyectos del pueblo y para amistad.
