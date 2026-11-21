# Estado del proyecto

Última actualización: 2026-11-18 (fin de la sesión en la que se creó este documento). Actualizar al final de cada sesión.

## Qué funciona (verificado en navegador con 2 pestañas en modo demo, salvo indicación)
- Login (Google en modo Firebase / modo demo), crear/unirse a casita por código de 6 caracteres, cambio de casita.
- Mundo 80×80 determinista: casa, río con puente, huerto (arado con surcos), animales y granero, invernadero/hongos, recolección, comer/cocinar/dormir, familia (hijos), buzón, metas semanales, misiones de pareja, recuerdos.
- Chat con globos y ✓✓, Vestidor (muchas opciones y conjuntos), pesca + bote (con pasajera/o), economía (pedidos diarios, mercado, habilidades y mejoras), eventos (festival, visitante, estrellas fugaces), editor de decoración (rotar, recolorear, mover, eliminar), ampliaciones de terreno (este/sur gratis), citas y regalos escondidos, exploración (excavar, cofre semanal, álbum, mina), vecinos y mascotas, crafteo (taller + 4 estaciones, >35 recetas).
- Mundo por descubrir: niebla compartida, pueblo grande al este con vecinos paseando, 15 POIs con premios, mapa 🧭 con hitos de explorador (6/12/20).
- Bilingüe ES/EN; "Novedades" hasta la versión 8 (`ui/news.js`).
- Calidad: 23 tests Vitest pasan, `npm run lint` sin errores (12 avisos de directivas eslint-disable sin uso), build OK, test de humo manual con Playwright OK en la última sesión.
- `game/actions/` dividido por dominio; datos de exploración en `game/exploreData.js`.

## Pedidos 2.0 (rama feature/pedidos-2)
Hecho: pedidos de temporada, pedido grande semanal cooperativo, bonus diario con barra n/4 y pistas de origen. Verificado en demo (entrega, aporte, bonus). Pendiente: pasar `env.season` en TodayPanel, entrada en `news.js`, probar con Firebase real el `inc` anidado `orders.w<N>.<uid>.<item>`.

## A medio hacer / sin verificar
- **Firebase real nunca probado desde estas sesiones** (auth Google, reglas desplegadas, latencia, RTDB). Solo `localBackend`. **[POR CONFIRMAR si la persona usuaria lo probó por su cuenta con `bri-game`.]**
- CI de GitHub (`.github/workflows/ci.yml`) escrito pero **no ejecutado**; además el directorio no es un repo git.
- Revisión visual de los 15 POIs y del pueblo: se miraron 3-4 POIs y el pueblo; **[POR CONFIRMAR]** el resto (cabaña, faro, barco, gruta, etc.) y cómo se ven los marcadores Html (❔ de regalos, etiquetas de zona) bajo la niebla.
- Niebla: **retirada** (v16, petición de la persona usuaria).
- `constants.js` sigue siendo un fichero grande (~600 líneas) con bloques interdependientes.
- Rendimiento no medido en móviles reales (solo swiftshader).

## Bugs y deudas conocidas
- **Claves de i18n = texto español:** cualquier retoque de un texto rompe su traducción sin aviso (la comprobación es `node tools/i18n-missing.cjs`, manual). `en.js` y `en-extra.js` son dos catálogos por acumulación.
- **Lógica de economía en el cliente:** monedas/corazones/límites diarios manipulables. Reglas de Firestore solo validan pertenencia a la pareja, no los valores.
- **Un único documento raíz de pareja** acumula inventario, habilidades, niebla, descubrimientos…: riesgo de límite de 1 MB / ~1 escritura/s con uso intenso. Cada acción hace `commit` inmediato (sin agrupar).
- **Sin migraciones:** `SCHEMA_VERSION = 1` se escribe en la pareja pero no hay código que lo use.
- Acciones tipo "gastar y construir" no usan transacciones: dos clics simultáneos podrían dejar inventario negativo. **[POR CONFIRMAR: reproducir]**
- `commit` solo muestra un toast ante error; sin reintentos ni cola offline.
- `tools/i18n-*.cjs` dependen de `@babel/parser`/`traverse` (solo transitivas) y de `tools/keys.frozen.json`: herramienta histórica, no mantenida.
- Fichero `nuestra-casita-web.zip` en la raíz es un artefacto de despliegue (ya en `.gitignore`).
- Credenciales: ver sección Seguridad más abajo.
- Notificaciones solo funcionan con la pestaña abierta.
- `docs/02-ARQUITECTURA.md` §12 (hoja de ruta) está desactualizada (lista "tests unitarios" como pendiente) y no refleja las ~15 colecciones nuevas.

## Seguridad / secretos (revisado)
- `.gitignore` excluye `node_modules`, `dist`, `.env*` (salvo `.env.example`), `.firebase/`, logs, `*.zip`.
- Existe `.env.local` local con una **clave de API web de Firebase** (proyecto `bri-game`). No está versionada (no hay `.git`; no se pudo revisar historial). Las claves web de Firebase no son secretas por diseño (se incrustan en el bundle: aparecen en `dist/` y en el zip ya entregado), pero la protección real son las reglas de Firestore/RTDB y los dominios autorizados de Auth. **[POR CONFIRMAR: restringir la clave por dominio en Google Cloud y revisar dominios autorizados.]**
- No hay otros secretos en `src/`.

## Historia del Valle (integrada, 2026-11-20)
Integrado y probado en `casita-sync`: motor de misiones, contenido (7 capítulos, diálogos, 5 historias de amistad nuevas sin conectar), proyectos del pueblo (rotos/arreglados), Diario del Valle, tarjeta en Hoy, vecinos con rutinas y diálogo (el ❗ indica a quién hablar), plaza viva y emotes. Pruebas: 179 unitarias + e2e `smoke`, `story`, `emotes`.
**Pendiente de la historia:** conectar la amistad/regalos de los 5 vecinos nuevos (hoy solo Marta, Pablo y Luna), probar el Festival (dos conectados al atardecer) con dos jugadores reales, «sentarse juntos» en un banco, balance de recompensas jugando. **No probado en iPad real ni con Firebase real.**

## Próximos pasos (por prioridad)
0b. **Reglas de Firestore endurecidas** (rama integrada, `docs/seguridad.md`): 38/38 pruebas con emulador. **Falta:** probar con Firebase real y desplegar con `firebase deploy --only firestore:rules` (decisión de la persona responsable).
0. **Auditoría de sistemas** (`docs/auditoria-sistemas.md`): decidir la tabla de recortes. Hecho: controles táctiles (v10). Hecho también: panel «Hoy» (v12), tutorial ampliado (11 pasos), corazones con sumidero real (decoración del corazón, v11) y Mapa dentro de Explorar. En curso: pulido de modelos `feature/pulir-love-parts`.
1. **Inicializar/recuperar el repo git** y dejar CI funcionando (rama `main` protegida, trabajo en `feature/*`).
2. **Probar con Firebase real** (dos cuentas, dos dispositivos) y desplegar reglas; anotar fallos aquí.
3. **Reglas de Firestore con validación de campos** (rangos de `coins`/`hearts`, tamaños) y/o Cloud Functions para recompensas.
4. **Claves de i18n estables** (`explore.map.title`) + un solo catálogo por idioma + comprobación automática en CI.
5. **Rendimiento:** `React.lazy` para paneles poco usados (Crafteo, Citas, Mapa, Showroom), `InstancedMesh` para árboles/props, selectores `useGame` más finos, culling por distancia; medir en móvil.
6. **Escrituras:** agrupar/debounce de `inc` frecuentes; transacciones donde se gasta y crea; reintentos y aviso de "sin conexión".
7. **Notificaciones push** con la app cerrada (FCM + Functions).
8. Migraciones de esquema usando `SCHEMA_VERSION`.
9. Nuevas funciones aplazadas: cocina cooperativa, aniversarios/cápsula del tiempo, mover/eliminar edificios.
10. Accesibilidad (ARIA, teclado en paneles, contraste).

## Tareas aptas para delegar a un modelo más barato
Cada una: acotada, bajo riesgo, criterio de "listo" comprobable.
1. **Tests de `logic.js`:** añadir casos a `tests/logic.test.js` para `cropInfo`, `validateBuilding`, `validateDecor`, `rollCatch` (pasando `rnd` determinista), `recipeStatus`, `craftDur`, `animalStats`. *Listo:* `npm test` verde y ≥15 tests nuevos, sin tocar `src/`.
2. **Limpiar los 12 avisos de lint** (`npx eslint src --fix` solo para "Unused eslint-disable directive"). *Listo:* `npm run lint` sin avisos y `npm run build` OK; diff solo elimina comentarios.
3. **Test de integridad de contenido:** que todo item de `RECIPES`, `DECOR`, `COLLECT`, `PRICES`, `STATIONS` referencia ids existentes en `ITEMS`/`CROPS`. *Listo:* test en `tests/` que falla si se rompe una referencia.
4. **Test de i18n:** que `node tools/i18n-missing.cjs` devuelva vacío, como test Vitest (reimplementando la lógica en `tests/`). *Listo:* test verde ahora y rojo si se añade un `t("x")` sin traducir.
5. **Actualizar `docs/02-ARQUITECTURA.md`:** lista real de colecciones (`COLLECTIONS` en `initialState.js`), estructura `game/actions/`, hoja de ruta §12. *Listo:* cada ruta/archivo citado existe.
6. **Unificar `en.js` y `en-extra.js`** en un solo catálogo ordenado alfabéticamente sin perder claves. *Listo:* mismo número de claves, `node tools/i18n-missing.cjs` vacío, build OK.
7. **Script `npm run smoke`** con Playwright (instalar como devDependency) que arranca el dev server, crea partida demo y falla ante cualquier `pageerror`/`console.error`. *Listo:* `npm run smoke` verde; documentar en AGENTS.md.
8. **Revisión visual POIs:** con `?debug=1`, teletransportar a cada POI de `world.pois` y guardar una captura; listar los que se vean mal. *Listo:* informe en este fichero, sin cambiar código.

## No delegar (requiere criterio o permiso)
Cambios en `worldGen.js`, reglas de Firebase, esquema de datos, balance de economía, claves de i18n existentes.

## Historia del Valle: contenido del Libro I (rama feature/historia-contenido)
- Hecho: `story/chapters.js` (7 capítulos × 3 pasos, recompensas, cartas), `story/dialogue.js` (≥14 líneas por vecino según hora/clima/estación/capítulo/amistad, `lineFor`, `GREETINGS`, `firstMeeting`, `STORIES_NEW` con 5 historias × 5 vecinos), `characters.js` enriquecido (bio, likesText, quirk, likes), `en-historia.js` completo, `tests/story-content.test.js`.
- Para el motor/integración: fusionar `STORIES_NEW` con `STORIES`; ids de proyecto: fountain, bakery, store, schoolgarden, cafe, clocktower; flags de recompensa: village:lamps, shop:bakery, shop:store, school:swings, cafe:art, clock:spring, event:market.
- Falta: validar con el motor real `together`/`dusk` y las recompensas extra (`flag`, `title`); revisar el tono en pantalla.

## Taller sencillo (rama feature/crafteo-simple)
- Hecho: 10 recetas básicas por defecto, recogida automática, modo Avanzado plegado, Hoy y tutorial actualizados, tests/craft-simple.test.js, en-crafteo-simple.js. Probado en navegador (demo): taburete de principio a fin, trabajo antiguo (Tablón) con Recoger, interruptor avanzado.
- Falta: aviso en Novedades (`news.js`, lo toca el chat principal); probar en iPad real; decidir balance de las prendas.

## Motor de misiones de la historia (rama feature/historia-motor)
- **Hecho:** `src/game/story/conditions.js` (los 9 tipos de condición, puros; `presenceMet` para together/dusk), `engine.js` (`currentChapter`, `chapterStatus`, `canClaim`, `nextStep`…), `src/game/actions/story.js` (`startStory`, `completeStep`, `storyTalk`, `claimStoryChapter`, `tickStory`), `src/ui/StoryPanel.jsx` (panel `'story'`, «Diario del Valle»), `tests/story-engine.test.js` (+ fixtures), `src/i18n/en-motor-historia.js`. `tickStory()` ya se llama en el tick de 1 s de `App.jsx`. `src/game/story/chapters.js` es un placeholder vacío (`CHAPTERS = []`): lo reemplaza el chat de contenido.
- **Decisiones:** (1) la acción se llama `claimStoryChapter` porque `claimChapter` ya existe en `neighbors.js` (amistad) y chocaba en `actions/index.js`. (2) Los pasos se guardan anidados (`story.steps.<cap>.<paso>`), porque en una ruta con puntos no cabe la clave plana «cap.paso» de la biblia; el motor lee ambas formas. (3) `tickStory` arranca la historia sola (con la base de contadores) cuando `CHAPTERS` no está vacío. (4) Presencia: `plaza` = ambas a ≤9 casillas de (60,19.5), `clock` ≤6 de (65,16), `bench` junto a los bancos del pueblo viejo, `chat` = pareja conectada y chat abierto, `dusk` = hora 18-21 y pareja conectada **[POR CONFIRMAR coordenadas y qué significa `chat`]**.
- **Falta:** montar `StoryPanel` en `HUD.jsx` (`panel === 'story'`, botón de menú) y entrada en `news.js` + `docs/03-NUEVAS-FUNCIONES.md` (chat principal); que el diálogo llame a `storyTalk(npcId)`. Limitación: si las dos personas reclaman a la vez desde dos dispositivos no hay transacción y podría pagarse dos veces (el doble clic en un mismo dispositivo sí está protegido).
## Vecinos vivos (rama feature/vecinos-vivos)
- **Hecho:** los 8 vecinos de `CAST` siguen una agenda diaria por hora de juego (`game/story/routines.js`): salen de casa, caminan hasta su puesto, charlan en la plaza (💬), pasean por la Calle Mayor, comen en casa, se sientan en los bancos y se retiran por la noche. Con lluvia/tormenta se quedan en el portal o dentro. Se dibujan en `scene/Npcs.jsx` (sustituye al `Neighbor` estático de `Village.jsx`). Tocar a un vecino → la persona camina hasta él (`goAndDo`) y se abre `ui/DialogueModal.jsx` (charlar cuenta amistad una vez al día vía `talkNeighbor`; «Regalar» abre el panel de vecinos solo para Marta, Pablo y Luna).
- **Todo se calcula desde la hora** (sin guardar posiciones): ambas personas ven a cada vecino en el mismo sitio. Rutas precalculadas una vez por mundo con `findPath`; luego solo se interpola.
- **Tests:** `tests/routines.test.js` (rutas sobre mundos de 4 semillas: puntos transitables, nadie pisa casillas bloqueadas, charlas con interlocutor cerca, determinismo, lluvia).
- **Punto movido:** el puesto de Pablo (38.4, 17.5) caía en agua (el embarcadero está sobre casillas bloqueadas): ahora pesca desde (39.5, 17.5), en la orilla. Los `stops` de characters.js de los 5 vecinos nuevos ya eran transitables.
- **Diálogo provisional:** `game/story/dialogueStub.js` (no es contenido final). `DialogueModal` usa solo `lineFor` de `game/story/dialogue.js` en cuanto exista y lo exporte (`import.meta.glob`); para forzar el stub: `FORCE_STUB = true`.
- **❗ sobre el vecino:** `hasNews(npcId, state)` en `routines.js`: cartas en `couple.story.pending` (array de ids u objeto `{id:true}`) o capítulo de amistad por reclamar (Marta/Pablo/Luna). El motor de misiones debe conectar aquí (una función).
- **Pendiente / sin verificar:** rendimiento en iPad real (solo swiftshader); que `couple.npc.<id>.{met,talkedDay}` del contrato lo escriba el motor al abrir el diálogo (aquí solo se usa `friends.<id>.talkDay`); entrada en `news.js` y sección en `03-NUEVAS-FUNCIONES.md` (las lleva el chat principal); los vecinos no se esquivan entre sí; si cambia el mundo en caliente (nodos que rebrotan) las rutas no se recalculan hasta cambiar de casita.
- **Hooks de prueba:** `?debug` expone `window.__npcs`; `window.__npcHour = <hora>` fija la hora de los vecinos (para capturas).
## Historia narrada (v18)
- **Hecho:** escenas narradas, director, guía de objetivo con flecha y 📍, misión dentro del diálogo, repetir escenas desde el Diario. Ver «Escenas narradas» en `docs/historia.md`. Tests: `tests/story-scenes.test.js` (guion completo, director, objetivo) y `npm run scenes` (e2e).
- **Por verificar a mano:** lectura cómoda en iPad (tamaño de texto), que el banner de objetivo no tape otros elementos en pantallas estrechas, escenas con las dos personas conectadas.
## Sin niebla del todo + pantalla de carga (v19)
- Quitados `<fog>`, bruma de suelo, clima `fog` y botón ✨. Añadida pantalla de carga con botón «Entrar al valle». Tests: `tests/boot.test.js`; el e2e `npm run scenes` comprueba la pantalla de carga.
