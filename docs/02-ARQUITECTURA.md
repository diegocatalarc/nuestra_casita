# Nuestra Casita — Arquitectura

## 1. Visión general

```
┌──────────────────────────── Navegador (React + Vite) ────────────────────────────┐
│  UI HTML (HUD, paneles)  ◄──── zustand store ────►  Escena R3F (Three.js)        │
│                                    ▲   ▲                                          │
│                      acciones del juego  runtime mutable (posición, caminos)      │
│                                    │   │                                          │
│                         ┌──────────┴───┴──────────┐                               │
│                         │  Backend (interfaz)      │  ◄── elige en tiempo de      │
│                         │  auth · couple · write · │      ejecución según .env    │
│                         │  subscribe · presence    │                              │
│                         └──────┬───────────┬───────┘                              │
└────────────────────────────────┼───────────┼──────────────────────────────────────┘
                                 │           │
              ┌──────────────────▼──┐   ┌────▼───────────────┐   ┌──────────────────┐
              │ Firebase Auth       │   │ Firestore          │   │ Realtime DB      │
              │ (Google)            │   │ estado persistente │   │ presencia 10 Hz  │
              └─────────────────────┘   └────────────────────┘   └──────────────────┘
```

Principios:

1. **Cliente "tonto" sobre estado persistente.** El mundo es el conjunto de documentos de Firestore + una semilla. No hay servidor de juego.
2. **Simulación perezosa (lazy).** El crecimiento, el hambre, la producción y el reaparecer de nodos se calculan al leer con marcas de tiempo. No hay tareas programadas ni "ticks" de servidor.
3. **Dos canales con distinta naturaleza.** Lo que debe sobrevivir (Firestore) y lo efímero de alta frecuencia (RTDB).
4. **Backend intercambiable.** Existe un `localBackend` (localStorage + BroadcastChannel) con **exactamente la misma interfaz** que `firebaseBackend`: se puede jugar con dos pestañas sin crear proyecto, y los tests no necesitan red.
5. **Escena desacoplada de la UI.** Lo que cambia 60 veces por segundo (posiciones) vive en un objeto mutable fuera de React; lo declarativo vive en zustand.

## 2. Estructura de carpetas

```
nuestra-casita/
├─ docs/                       GDD y arquitectura
├─ index.html
├─ vite.config.js
├─ firebase.json · firestore.rules · database.rules.json
├─ .env.example
└─ src/
   ├─ main.jsx · App.jsx · styles.css
   ├─ game/                    ← lógica pura (sin React, testeable)
   │  ├─ constants.js          recursos, cultivos, edificios, decoración, animales, misiones
   │  ├─ rng.js                PRNG determinista + hash
   │  ├─ time.js               reloj del mundo, estaciones, clima, tiempo de servidor
   │  ├─ lighting.js           claves de color/luz por hora y clima
   │  ├─ worldGen.js           generador 50×50 (tiles + nodos de recurso)
   │  ├─ logic.js              estado de cultivos/animales, validación de colocación, slots de recuerdos
   │  ├─ movement.js           colisiones, muros, A*
   │  ├─ runtime.js            estado mutable: jugador local, remotos, FX
   │  └─ actions.js            acciones del juego → operaciones de escritura
   ├─ store/
   │  └─ gameStore.js          zustand: sesión, mundo sincronizado, UI
   ├─ services/backend/
   │  ├─ index.js              selector de backend + utilidades
   │  ├─ firebaseBackend.js    Auth, Firestore, RTDB
   │  └─ localBackend.js       demo local con BroadcastChannel
   ├─ scene/                   ← Three.js / R3F
   │  ├─ GameCanvas.jsx        <Canvas> + composición de la escena
   │  ├─ Terrain.jsx           tiles instanciados, agua, puente, base de diorama
   │  ├─ Nature.jsx            árboles, rocas, flores… instanciados e interactivos
   │  ├─ Buildings.jsx         edificios con techo que se desvanece
   │  ├─ Crops.jsx · Decor.jsx · Animals.jsx · Memories.jsx
   │  ├─ Avatar.jsx · Players.jsx
   │  ├─ CameraRig.jsx · Interaction.jsx
   │  ├─ Lighting.jsx · Sky.jsx · Weather.jsx · LightPool.jsx
   │  └─ FloatingFx.jsx
   └─ ui/
      ├─ LoginScreen.jsx · CoupleSetup.jsx · HUD.jsx
      ├─ Modal.jsx · BuildPanel.jsx · DecorPanel.jsx · AnimalsPanel.jsx
      ├─ QuestsPanel.jsx · MemoriesPanel.jsx · AvatarPanel.jsx · InventoryPanel.jsx
      └─ media.js              imagen→dataURL comprimida, grabadora de audio
```

## 3. Arquitectura Firebase

| Servicio | Uso | Por qué |
|----------|-----|---------|
| **Authentication** | Google Sign-In | Sin contraseñas, UID estable |
| **Firestore** | Estado del mundo y datos íntimos | Persistente, consultas, reglas, caché offline multi-pestaña, snapshots incrementales |
| **Realtime Database** | Presencia y movimiento | Latencia baja, coste por ancho de banda, `onDisconnect` nativo |
| **Hosting** | SPA estática | Un comando de despliegue |
| *(Fase 2)* Cloud Functions | Validación autoritativa, limpieza | Evitar manipulación de inventario |
| *(Fase 2)* Storage | Fotos/audio grandes | Hoy se guardan comprimidos en Firestore (< 200 KB) |

### Flujo de unión de la pareja
1. Persona A inicia sesión → `createCouple` crea `couples/{cid}`, `invites/{CODE}` y `users/{uidA}`.
2. Persona B inicia sesión → introduce `CODE` → `joinCouple` lee `invites/CODE` (solo `get`), hace `update` sobre `couples/{cid}` añadiéndose a `members` (las reglas solo lo permiten si hay un único miembro) y crea `users/{uidB}`.
3. Ambas se suscriben a `couples/{cid}` y subcolecciones.

## 4. Esquema Firestore

```
users/{uid}                       { coupleId }
invites/{CODE}                    { coupleId, owner }

couples/{cid}                     ← documento "raíz" de la pareja
  members: [uidA, uidB]
  inviteCode: "K7M2QX"
  seed: 482910                    semilla del mapa y del clima
  startedAt: 1731900000000        origen del reloj/estaciones
  schemaVersion: 1
  hearts: 42                      saldo gastable
  heartsTotal: 130                acumulado (nivel de casita)
  inventory: { wood, stone, clay, cloth, crystal, flower,
               tomato, lettuce, carrot, strawberry, pumpkin, rose, egg }
  players: { [uid]: { name, avatar:{skin,hair,hairColor,top,bottom,acc},
                      lastLogin:"2026-11-18", streak: 3 } }
  daily:   { [uid]: { date:"2026-11-18", water, harvest, feed, collect } }
  lastHug: 1731901234567
  lastDinner: "2026-11-18"
  lastStars: "2026-11-18"

couples/{cid}/crops/{x_z}         { type, x, z, plantedAt, wateredAt|null, lastWaterAt, rate, harvested, by }
couples/{cid}/buildings/{id}      { type, x, z, w, d, builtAt, by }
couples/{cid}/decor/{id}          { type, x, z, rot, variant, by }
couples/{cid}/animals/{id}        { type, name, home:{x,z}, bornAt, fedAt, pettedAt, lastCollectAt }
couples/{cid}/memories/{id}       { kind, title, text, image?, audio?, date?, by, at }
couples/{cid}/nodes/{kind_x_z}    { until }              nodo de recurso agotado hasta `until`
couples/{cid}/questLog/{date_q}   { date, questId, answers:{[uid]:{text?,image?,audio?,at}}, bonus }
```

Decisiones:
- **Terreno y nodos no se guardan**: se regeneran de `seed`. Solo se persisten las *diferencias* (nodos agotados, cultivos, construcciones). Un mundo de 2500 tiles ocupa decenas de documentos, no miles.
- **ID de cultivo = `x_z`**: imposible duplicar un cultivo en una parcela y lectura O(1).
- **Dotted paths** para `players.{uid}`, `daily.{uid}` y `inventory.{k}` → los dos jugadores escriben sin pisarse.
- **Contadores con `increment()`**: dos personas gastando/ganando a la vez no pierden updates.
- **Medios** como `data:` URL comprimidos (foto ≤ 720 px JPEG ≈ 60-120 KB, audio ≤ 20 s Opus ≈ 30-60 KB), bajo el límite de 1 MB por documento.

### Esquema Realtime Database
```
presence/{cid}/{uid}   { x, z, rot, anim, emote, inside, name, online, t, lastSeen }
```

### Reglas de seguridad
Ver `firestore.rules` y `database.rules.json`. Resumen:
- `couples/{cid}`: lectura/escritura solo `members`; unión controlada (1→2 miembros, solo `members`/`players`).
- Subcolecciones: solo miembros (`get()` sobre la raíz).
- `invites`: se puede `get` por código pero no `list`.
- RTDB: cada jugador escribe solo su nodo; lectura autenticada (el `cid` es un ID aleatorio no adivinable). En fase 2 se refuerza espejando `members` en RTDB mediante Cloud Function.

## 5. Sistema multijugador

### 5.1 Dos capas

| Capa | Transporte | Contenido | Frecuencia |
|------|------------|-----------|------------|
| Persistente | Firestore `onSnapshot` + `docChanges()` | cultivos, edificios, decoración, animales, recuerdos, recursos | por evento |
| Efímera | Realtime DB | posición, rotación, animación, emote, `inside` | ≈ 10 Hz si hay cambios + latido cada 4 s |

### 5.2 Presencia y movimiento
1. **Emisor** (`PresenceSync`): cada 100 ms compara `{x,z,rot,anim}` con lo último enviado; si cambió, `publish`. Latido cada 4 s para detectar caídas.
2. **Receptor**: guarda el objetivo en `runtime.others[uid]` y **interpola** (`lerp` exponencial 12/s, ángulos por camino más corto). Sin re-render de React.
3. **Desconexión**: `onDisconnect().update({ online:false, lastSeen })` en RTDB.
4. **Animaciones**: se transmite el *nombre* (`water`, `harvest`, `build`, `wave`, `love`) y cada cliente la reproduce localmente. Cero coste de ancho de banda por frame.
5. **Reloj**: se corrige con `.info/serverTimeOffset`; todo cálculo usa `serverNow()`.

### 5.3 Acciones y consistencia
- Cada acción construye un **lote de operaciones** (`set`/`del`/`inc`/`patch`) y se aplica con `writeBatch` (atómico). El cliente local se actualiza al instante gracias a la *latency compensation* de Firestore.
- Determinismo compartido: mapa, clima, misiones del día, paseo de animales y estado de cultivos se derivan de `(seed, marca de tiempo)` → no hay que "sincronizar" nada más.
- Conflictos: *last-writer-wins* por documento; las acciones son idempotentes (regar un cultivo ya regado no hace nada).

### 5.4 Modo demo local
`localBackend` implementa la misma interfaz con `localStorage` + `BroadcastChannel`. Cada pestaña tiene su `uid` (`sessionStorage`), así que **dos pestañas = dos jugadores** con presencia, escrituras y persistencia reales.

## 6. Sistema de guardado

No existe el botón "guardar": **la partida es el estado del servidor**.

| Aspecto | Solución |
|---------|----------|
| Persistencia | Cada acción escribe en Firestore (batch atómico) |
| Offline | `persistentLocalCache` con `persistentMultipleTabManager`: se puede jugar sin red; se sincroniza al volver |
| Progreso con la otra persona offline | Simulación perezosa por timestamps |
| Versionado | `schemaVersion` en la raíz + `migrate()` al cargar (preparado, v1) |
| Semilla | `seed` en la raíz; el mundo base nunca se persiste |
| Copias de seguridad | Fase 2: export programado de Firestore (`gcloud firestore export`) + descarga de recuerdos |
| Demo | `localStorage` clave `nuestra-casita:demo:v1` |

## 7. Componentes React

| Componente | Responsabilidad |
|------------|-----------------|
| `App` | Máquina de estados de sesión (boot → login → setup → game), reloj de 1 s, suscripciones |
| `LoginScreen` | Google o demo |
| `CoupleSetup` | Crear casita / unirse con código |
| `HUD` | Hora, clima, corazones, recursos, estado de la pareja, herramientas, toasts |
| `BuildPanel`, `DecorPanel` | Catálogos con coste y validación de recursos |
| `AnimalsPanel` | Adopción, hambre/felicidad/producción por animal |
| `QuestsPanel` | 3 misiones diarias + actividades cooperativas |
| `MemoriesPanel` | Crear y ver recuerdos (foto, mensaje, fecha, nota, voz) |
| `AvatarPanel` | Editor con vista previa 3D |
| `GameCanvas` | `<Canvas>` ortográfico, sombras suaves, composición de la escena |

## 8. Escena Three.js (R3F)

- **Cámara ortográfica** a 45° de yaw (±30° limitado), 38° de inclinación, zoom suavizado, seguimiento con `lerp`.
- **Terreno**: 2 `InstancedMesh` (tierra y agua) con color por instancia según estación; losa base de diorama.
- **Naturaleza**: 1 `InstancedMesh` por pieza (troncos, copas, rocas, cristales…) con `onClick` por `instanceId`.
- **Iluminación**: `DirectionalLight` con sombras PCF suaves que sigue al jugador, `HemisphereLight`, color de cielo y niebla interpolados por hora y clima. **Pool fijo de 6 `PointLight`** asignadas a las fuentes cercanas (evita recompilar shaders).
- **Fondo celeste**: estrellas, sol y luna pegados a la cámara (se ven en el vacío alrededor del diorama).
- **Clima**: lluvia (`LineSegments`), nieve (`Points`), niebla (`Fog`), nubes que proyectan sombras.
- **Techos**: se desvanecen si cualquiera de los dos jugadores está dentro.

## 9. Rendimiento (presupuesto)
- ≈ 25 `drawcalls` de terreno/naturaleza gracias al instancing; edificios y cultivos con geometrías simples compartidas.
- `dpr` limitado a [1, 2]; sombra 2048².
- Re-render de React ≤ 1/s para el mundo (reloj); movimiento 100 % fuera de React.
- Firestore: `docChanges()` → coste proporcional a los cambios; sin escrituras por frame.

## 10. Costes estimados (Firebase, por pareja activa/día)
- Firestore: ~200 lecturas + ~150 escrituras → muy por debajo de la capa gratuita para cientos de parejas.
- RTDB: 10 Hz × ~120 B ≈ 1 KB/s por jugador activo ⇒ ~3.6 MB/h.

## 11. Despliegue

```bash
cp .env.example .env.local        # rellenar con tu proyecto Firebase
npm install
npm run dev                       # desarrollo
npm run build && firebase deploy  # producción (hosting + reglas)
```

En la consola de Firebase: activar *Authentication → Google*, crear *Firestore* y *Realtime Database*, y desplegar `firestore.rules` y `database.rules.json`.

## 12. Hoja de ruta técnica
1. **Cloud Functions** para validar costes/recursos y emitir corazones de forma autoritativa.
2. **Storage** para media y miniaturas.
3. **PWA + táctil** (joystick virtual, gestos de pellizco).
4. **Tests unitarios** de `game/` (lógica pura): estados de cultivos, A*, colocación.
5. **Audio** posicional y música dinámica por estación/hora.
