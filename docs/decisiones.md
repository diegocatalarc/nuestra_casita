# Bitácora de decisiones

Formato: qué elegimos / qué descartamos / por qué. Lo que no se pudo confirmar va como **[POR CONFIRMAR]**. Más reciente abajo dentro de cada bloque.

## Arquitectura

## Backend intercambiable (Firebase / local)
- **Elegimos:** una interfaz única (`getBackend()`: auth, couple, `write(ops)`, subscribe, presencia) con dos implementaciones: `firebaseBackend` y `localBackend` (localStorage + BroadcastChannel).
- **Por qué:** se puede jugar y testear con dos pestañas sin proyecto Firebase ni red. Mantener las dos con la misma semántica de ops (`set/del/inc/patch`).
- **Cuidado:** si cambias una, cambia la otra.

## Sin servidor de juego: simulación perezosa + cliente "tonto"
- **Elegimos:** estado en Firestore + una `seed`; crecimiento, hambre, producción y reaparición de recursos se calculan al leer con marcas de tiempo. Presencia de alta frecuencia en Realtime DB (efímera).
- **Descartamos:** Cloud Functions / ticks de servidor (coste y complejidad; sigue en la hoja de ruta, ver `docs/estado.md`).
- **Consecuencia conocida:** todas las reglas (monedas, corazones, límites diarios `HEART_RULES`) corren en el cliente → se pueden manipular. Aceptado de momento por ser un juego de pareja.

## Mundo determinista por semilla y día UTC
- **Elegimos:** terreno, POIs, pedidos, eventos, excavaciones, cofre semanal, rivales del concurso… salen de `seed + día UTC` (`mulberry32(hashStr(...))`). Las dos personas ven lo mismo sin sincronizar nada.
- **Descartamos:** guardar esos datos en Firestore (más escrituras, riesgo de divergencia).
- **No repetir:** no usar `Math.random()` para nada que ambos deban ver igual.

## Ampliación del mundo sin romper partidas
- **Elegimos:** `MAP=80`, `MAP_BASE=50`; la generación base 50×50 queda intacta y las ampliaciones vienen de `expandZone`/`withFree`. `TILE.VOID` marca zonas bloqueadas.
- **Por qué:** las partidas guardadas dependen del terreno exacto de la semilla.
- **Zonas:** este y sur son `free:true` (sin comprar; la persona usuaria pidió más espacio gratis); sureste cuesta 900 monedas + 8 cristales (`ZONES` en `constants.js`).

## Modelos procedurales en vez de assets
- **Elegimos:** objetos/edificios/POIs como listas de piezas `[forma,pos,tamaño,color,opts]` (`PartsModel`), con AO horneado en vértices (`rbGeo`), sombras de contacto y materiales nocturnos compartidos (`scene/nightmats.js`).
- **Por qué:** cero descargas, estética coherente low-poly, fácil de añadir y de animar. Los únicos assets externos son modelos Kenney (licencia en `public/models/LICENSE-Kenney.md`).
- **Descartamos:** una sala de pruebas ad hoc por objeto → se creó `?showroom` para revisarlos aislados.

## Colecciones nuevas
- **Elegimos:** una subcolección por sistema (gifts, crafts, soil…). El comodín de reglas `/{collection}/{docId}` evita tocar reglas. Receta de alta en AGENTS.md → Zonas sensibles.
- **Chat:** consulta `orderBy('at') + limitToLast(150)`.

## Niebla de exploración compartida
- **Elegimos:** celdas de 4×4 casillas, estado en `couple.explored` como cadena de 400 caracteres `0/1` (mezcla con `mergeStr`, nunca pierde lo local), escritura limitada a 1 cada 3,5 s. Las nubes son un `InstancedMesh` (4 puñados por celda) que se encogen al descubrir.
- **Por qué:** pocas escrituras y un solo documento; descubrir es cosa de la pareja, no individual. (Motivo exacto frente a alternativas **[POR CONFIRMAR]**; no se probó otra.)
- **Petición del usuario que originó esto:** "pueblo más grande, mapa que se descubre al avanzar, cosas en el camino" → pueblo al este (`TOWN`), 15 POIs, mapa 🧭.

## Niebla: rendimiento
- **Problema (usuario):** la niebla hacía el juego "ir a tirones".
- **Causas probables y arreglo:** (1) 1.600 nubes con material PBR con luces → ahora 1.200, `MeshBasicMaterial` con sombreado horneado en vértices (`scene/Fog.jsx`); (2) se dibujaban todas aunque estuvieran fuera de cámara o ya descubiertas → solo se dibujan las visibles (frustum) y se compactan en `instanceMatrix`; (3) el descubrimiento ocurría 1 vez/s en bloques → ahora `markCircle` a 5 Hz dentro de `Fog` (la escritura a Firestore sigue en `exploreTick` cada 3,5 s); (4) todos los `Reveal` se re-renderizaban en cada cambio de niebla → ahora cada uno se suscribe a un booleano.
- **Medición:** Playwright con swiftshader (CPU, no GPU real), 1 pasada por variante, ruidosa: sin niebla ≈787 ms/frame, niebla nueva ≈833, niebla vieja ≈1181. Solo indica la tendencia; **[POR CONFIRMAR en un móvil/GPU real]**. Comparar con `?nofog`.

## Props del pueblo viejo vs. terreno del jugador
- **Problema (usuario):** una fuente apareció encima de un invernadero ya construido. El pueblo viejo (`VILLAGE`) está sobre terreno construible y `validateBuilding` no sabía de sus props.
- **Elegimos:** `game/villageProps.js` con huellas de fuente/bancos/puesto/adoquines: (a) `validateBuilding` rechaza obras nuevas encima (fuente, bancos, puesto); (b) en partidas ya existentes el prop se oculta y deja de colisionar si hay un edificio del jugador encima. Las casas de los vecinos no se ocultan **[POR CONFIRMAR si también se solapan casos reales]**.

## Producto y diseño

## Cada función nueva lleva aviso en el juego
- **Regla fija pedida por el usuario:** modal "Novedades" (`ui/news.js`) + badges 🆕, y entrega con zip nuevo para Netlify. Ver AGENTS.md.

## Barra de herramientas agrupada en menús
- **Elegimos:** menús (Casita, Pareja, Mundo, Comercio, Ayuda) en `HUD.jsx`. El usuario dijo "sí" a agruparlos cuando la barra se llenó de botones.

## Pueblo "con poco espacio" fue rechazado
- **Qué pasó:** una primera versión del pueblo (`VILLAGE=[39,9,50,23]`, junto a la casa) pareció pequeña al usuario.
- **Decisión:** se mantiene el pueblo viejo (tras `Reveal`), y se añade un pueblo grande al este (`TOWN=[51,7,79,33]`) más la niebla. No volver a acotar el pueblo a un recinto pequeño.

## Crafteo y estética
- **El usuario eligió** el sistema de crafteo ("me interesa un sistema de crafteo") y luego pidió pulido estético tomándose el tiempo necesario. Los surcos del huerto se rehicieron: las primeras crestas parecían tablones de madera; quedaron como montículos de tierra alargados, uno por fila y casilla.

## Idiomas
- **Elegimos:** el texto en español es la clave de `t()`; inglés en `en.js` + `en-extra.js`; cambiar idioma **recarga la página** (el contenido se evalúa al cargar). Detecta el idioma del dispositivo.
- **Deuda:** claves frágiles (ver `docs/estado.md`). Una codemod histórica en `tools/i18n-*.cjs` envolvió los textos en `t()`.

## Despliegue y entornos

## Artifact de Claude = solo demo
- La versión publicada como Artifact no puede usar Firebase (CSP). Se compila con `vite build --base=./` y se genera `dist/page.html` a mano. **No sirve para probar multijugador real.** El proceso de publicación lo hacía el asistente con la herramienta Artifact (no está scripteado en el repo).
- **Netlify:** el usuario sube `dist` (zip sin `page.html`, build con base `/`). **[POR CONFIRMAR: dominio, y si Firebase está configurado allí]**.
- **No verificado:** nunca se probó contra un Firebase real desde estas sesiones; el multijugador solo se probó con dos pestañas en modo demo.

## Errores cometidos y qué no repetir
- **`t is not a function` al crear terraza:** una variable local `const t` tapaba la función i18n `t`. Usa otro nombre (`tl`).
- **`PRICES` no definido (TDZ) en `constants.js`:** bloques que usaban `PRICES` antes de definirlo. Mantener el orden (COLLECT antes del bloque Economía; entradas de PRICES añadidas después de `PRICES`).
- **Doble `onClick`** en `DecorItem`: fusionar los manejadores (cama + estación).
- **Editor de decoración:** (a) el listener de arrastre se registraba tras un render y perdía clics rápidos → ahora un `pointerup` permanente; (b) el `onClick` del plano deseleccionaba justo tras soltar → guarda `lastDrop`.
- **Vista previa "corrupta" al cambiar de tipo:** rotaciones viejas en `PartsModel` → `key={tipo}`.
- **`</Suspense>` duplicado** al insertar `<Fog />` en `GameCanvas.jsx`.
- **Cofre semanal se renovaba en domingo** (`weekIdx` con offset de 3 días en vez de 4): detectado por el primer test de Vitest; corregido (puede dejar abrir un cofre extra en la transición).
- **División de `actions.js` con script:** el análisis de nombres ignoró `...NOMBRE` (spread) y faltó un import (`DISCOVERIES_FIXED`) → pantalla en blanco en runtime aunque `vite build` pasaba. **Por eso existe `npm run lint` (no-undef): ejecutarlo siempre tras mover código.** `vite build` NO detecta nombres sin definir.
- **`constants.js` solo se partió en `exploreData.js`:** los demás bloques se referencian entre sí y el orden de evaluación importa.
- **Capturas engañosas** ("láminas" en vez de modelos) eran fotos a medio cambio de tipo: esperar ~1700 ms antes de capturar.

## Pruebas (cómo se verificó lo visual)
- Playwright + Chromium con swiftshader contra `vite --port 5173` (a veces el servidor se cae: relanzar con `nohup npx vite --port 5173 &`). Es lento: `nc_fx='0'`, viewport pequeño, espera por polling dentro de `evaluate`. Con dos páginas WebGL se arrastra. Los scripts de Playwright **no están en el repo** (vivían en el scratchpad de las sesiones).
- Hooks de test: `?debug=1` → `window.__nc.runtime.me.x/z` para teletransportar al jugador, `window.__camTarget.zoom`, `useGame.getState()`.
- Atajo del entorno del asistente: `sleep` suelto bloqueado; no usar `pkill -f` con patrones que casen con la propia shell.

## Ideas descartadas o aplazadas
- **Aplazadas (el usuario aún no las eligió):** minijuego cooperativo de cocina, aniversarios/cápsula del tiempo, mover/eliminar edificios (decoración sí se puede), notificaciones push con la app cerrada (hoy solo con la pestaña abierta).
