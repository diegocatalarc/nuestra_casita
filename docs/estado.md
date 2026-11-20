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

## Taller sencillo (rama feature/crafteo-simple)
- Hecho: 10 recetas básicas por defecto, recogida automática, modo Avanzado plegado, Hoy y tutorial actualizados, tests/craft-simple.test.js, en-crafteo-simple.js. Probado en navegador (demo): taburete de principio a fin, trabajo antiguo (Tablón) con Recoger, interruptor avanzado.
- Falta: aviso en Novedades (`news.js`, lo toca el chat principal); probar en iPad real; decidir balance de las prendas.
