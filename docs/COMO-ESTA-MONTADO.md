# Cómo está montado Nuestra Casita (para conversarlo)

Explicación en lenguaje llano de las ideas de fondo. Los detalles finos están en `docs/02-ARQUITECTURA.md` y las reglas de trabajo en `AGENTS.md`. Al final hay **preguntas abiertas** para decidir juntos.

## 1. La idea en una frase
No hay "servidor de juego". El juego es una web que corre entera en el navegador de cada persona; lo único compartido es **una carpeta de datos de la pareja en la nube** (Firestore) y un canal de posiciones en vivo (Realtime DB). Las dos pantallas muestran lo mismo porque leen la misma carpeta y porque el mundo se calcula igual en las dos.

## 2. Las cuatro capas
```
 UI HTML (menús, paneles) ──┐
                            ├── zustand (estado)  ◄── suscripciones ── Backend (Firebase | local)
 Escena 3D (R3F/Three.js) ──┘        ▲
        ▲                            │ acciones (game/actions/*) validan y escriben
        └── runtime mutable (posiciones, caminos): fuera de React, 60 veces por segundo
```
1. **Backend** (`services/backend`): una interfaz con dos implementaciones. `firebaseBackend` (real) y `localBackend` (localStorage + BroadcastChannel: dos pestañas = dos jugadores). Todo lo demás solo conoce `getBackend()`.
2. **Estado** (`store/gameStore.js`, zustand): espejo en memoria de lo que hay en la nube (inventario, edificios, cultivos…) más el estado de la interfaz (qué panel está abierto).
3. **Lógica** (`game/`): sin React. `logic.js` son funciones puras ("¿se puede construir aquí?", "¿qué pedidos hay hoy?"); `actions/` son las operaciones que el jugador dispara (plantar, pescar, comprar…).
4. **Presentación**: `scene/` dibuja el mundo (un componente por cosa) y `ui/` los paneles. Las cosas que cambian cada frame (posición del jugador) viven en `game/runtime.js`, no en el estado de React, para no re-renderizar 60 veces por segundo.

## 3. Cómo viaja un dato (ejemplo: regar un cultivo)
1. Clic → `goAndDo` hace caminar al personaje (A* en `movement.js`) y al llegar ejecuta la acción.
2. La acción mira el store, valida, y llama a `commit([ops])`. Una operación es `set/del` sobre una subcolección o `inc/patch` sobre el documento raíz de la pareja (`{op:'inc', field:'inventory.wood', by:-3}`).
3. `firebaseBackend.write` las junta en un lote atómico. Los `inc` usan `increment()` de Firestore, así que dos personas sumando a la vez no se pisan.
4. Firestore avisa a **las dos** pantallas por `onSnapshot` (con compensación de latencia: quien escribe ve el cambio al instante). El store se actualiza y React re-renderiza lo que cambió.
La otra persona no recibe "un mensaje del juego": simplemente ve cambiar los datos.

## 4. Tres trucos que sostienen todo
- **Mundo determinista.** Terreno, rincones secretos, pedidos del día, eventos, excavaciones, cofre semanal… salen de `seed + día UTC` con un generador pseudoaleatorio (`rng.js`). Nunca se guardan: se recalculan idénticos en cada dispositivo. Ahorra escrituras y evita divergencias. Coste: cambiar el algoritmo cambia partidas guardadas (por eso el terreno base 50×50 es intocable y las ampliaciones se añaden aparte).
- **Simulación perezosa.** Nada "crece" en un servidor. Un cultivo guarda cuándo se plantó y al leerlo se calcula en qué estado debería estar. Lo mismo con hambre, energía, animales, crafteo. Sin tareas programadas ni "ticks" de servidor.
- **Modelos procedurales.** Casi ningún objeto es un archivo 3D: son listas de piezas `[forma, posición, tamaño, color, opciones]` que `PartsModel` convierte en mallas. Cero descargas y estilo coherente; añadir un objeto es añadir datos.

## 5. Qué vive dónde
| Dato | Dónde | Por qué |
|---|---|---|
| Inventario, monedas, corazones, habilidades, niebla, descubrimientos | Documento raíz de la pareja | Pocos datos, se cambian con `inc/patch` |
| Cultivos, edificios, decoración, animales, chat, regalos, crafteos… | Subcolecciones (`COLLECTIONS` en `initialState.js`) | Una por sistema; el comodín de reglas deja añadir más sin tocar reglas |
| Posición y animación de cada jugador | Realtime DB (~10 Hz) | Efímero y frecuente; no merece historial |
| Terreno, POIs, pedidos, eventos | Calculado (semilla + día) | Determinista, gratis |
| Preferencias (idioma, sonido, efectos) | localStorage del navegador | Solo de ese dispositivo |

## 6. El mundo y la exploración
`worldGen.js` genera un mapa 80×80: base 50×50 (casa, río, huerto), pradera del este (con el pueblo grande) y valle del sur, libres; colinas del sureste de pago. La **niebla** es una cuadrícula de 20×20 celdas (cadena de 400 `0/1` en el documento de la pareja): se marca al caminar a ~5 Hz, se escribe a la nube cada 3,5 s y se mezcla con lo que sabe la otra persona sin perder nada. Las nubes son una sola malla instanciada que solo dibuja lo visible.

## 7. Traducciones y avisos
El texto en español es la clave: `t("Cultivar")`. El diccionario inglés está en `i18n/en*.js`. Cada función nueva debe traer su entrada en `ui/news.js` (modal de Novedades + badge 🆕).

## 8. Cómo se verifica
Tests de Vitest sobre la lógica pura (`npm test`), lint de nombres sin definir (`npm run lint`), build, y pruebas visuales con Playwright contra el modo demo de dos pestañas. Con `?debug` se puede teletransportar al jugador y leer el estado (`window.__nc`).

## 9. Puntos débiles reconocidos (honestos)
- **La confianza está en el cliente.** Monedas, corazones y límites diarios los calcula el navegador; las reglas de Firestore solo comprueban que seas de la pareja. Cualquiera de los dos puede trampear desde la consola.
- **Un solo documento raíz** acumula casi todo el estado: techo de 1 MB por documento y ~1 escritura/s sostenida.
- **Cada acción escribe al instante**, sin agrupar; con juego intenso son muchas escrituras.
- **Sin migraciones de datos**: se escribe `schemaVersion` pero nada lo usa. Cambiar un campo puede romper partidas.
- **Claves de traducción frágiles** (el texto es la clave).
- **Firebase real sin probar** desde estas sesiones: todo el multijugador se verificó con el modo demo.
- **Sin notificaciones** con la app cerrada.

## 10. Preguntas abiertas para conversar
1. **¿Cuánta trampa nos importa?** Si es solo vosotros dos, quizá nada. Si algún día se abre a más parejas, habría que mover recompensas a Cloud Functions o validar en reglas. ¿Dónde ponemos la línea?
2. **Documento raíz único vs. repartido.** ¿Partimos inventario/habilidades/exploración en documentos aparte ahora (más trabajo, más margen) o esperamos a notarlo?
3. **Determinismo vs. libertad.** Es barato y elegante, pero ata el contenido a la semilla. ¿Queremos contenido que cambie con el tiempo (temporadas reales, eventos manuales) y que por tanto sí se guarde?
4. **Escrituras por acción vs. agrupadas.** Agrupar abarata y reduce conflictos, pero añade el riesgo de perder una acción si se cierra la pestaña.
5. **Claves de i18n estables.** ¿Merece la pena migrar ya (una vez, con un script) para que retocar un texto no rompa el inglés?
6. **Rendimiento en móvil.** La niebla es más ligera, pero hay muchas mallas sueltas (árboles, props). ¿Medimos en el móvil real antes de seguir añadiendo mundo?
7. **Siguiente gran paso:** ¿notificaciones push (retención a distancia), cocina cooperativa, aniversarios/cápsula del tiempo, o fortalecer la base (reglas, tests, migraciones)?
