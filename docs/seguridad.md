# Seguridad de Firestore (reglas)

> ✅ **Estado (2026-11-20):** reglas escritas **y probadas contra el emulador de Firestore: 38/38 pruebas en verde** (`npm run test:rules`). Con las reglas anteriores fallan 13 pruebas de denegación, así que los tests detectan de verdad las trampas que ahora se bloquean. ⚠️ **Siguen SIN desplegarse y SIN probarse con Firebase real**: hay que hacerlo antes (ver §5).

## 1. Inventario de escrituras reales

Todas salen de `commit([...ops])` (`src/game/actions/*.js`) → `firebaseBackend.write()`: un `writeBatch` con `set(merge)`/`delete` sobre subcolecciones de `couples/{cid}` y **un único `update`** sobre el documento raíz con `increment()` y rutas con puntos. Además `couple.create/join` y `leaveHouse` en `firebaseBackend.js`, y `AvatarPanel.jsx` (patch de `players.<uid>.avatar|outfits`).

### Documento raíz `couples/{cid}`
| Campo | Quién/cómo escribe | Magnitud máxima real |
|---|---|---|
| `coins` | `inc` (vender `sellItem`, pedidos, eventos, cofre, álbum, regalos, citas, vecinos, concurso; gastos: mejoras, zonas, compras, regalo de monedas) | Venta: `precio × cantidad` (sin tope: se puede vender todo el inventario; precios 6–~100, ×1,5 con demanda). Premios sueltos: ≤ 450 (álbum), 150–300 (cofre), ≤ 250 (concurso), ≤ 300+ en eventos. Gastos: ≤ 900 (zona), mejoras, ropa 120–300 |
| `hearts`, `heartsTotal` | `inc` vía `heartOps(n)`/`earn()` (`HEART_RULES`: topes diarios, p. ej. `order` 60, `harvest` 20); gasto `hearts` −`heartCost` (decoración hasta 250, familia 40); reembolso `+hr` al quitar decoración (solo `hearts`) | Premios ≤ 25 por acción, 20 (cena), 15 (estrellas); sumas por lote < 100 |
| `inventory.<item>` | `inc` ±n (cosechar, gastar, craftear, regalar) | sin tope |
| `skills.<k>`, `upgrades.<k>`, `found.<id>`, `fishLog.<id>`, `datesDone.<día>`, `stats.<semana>.<métrica>`, `friends.<id>.pts`, `events.<día>.tries.<uid>` | `inc` | pequeños |
| `players.<uid>.*` | `patch`: `energy/energyAt/full/fullAt` (`vitalsPatch`), `lastLogin/streak` (login diario), `lastSeenAt`, `chatSeen`, `avatar`, `outfits` | **siempre la propia entrada** (se comprobó en todos los `patch` con `players.`; ninguna acción escribe en la de la pareja) |
| `daily.<uid>.<kind>` | `patch` (`earn`) | propia entrada (no se valida en las reglas, ver §3) |
| `unlocks.*`, `zones.*`, `orders.<día>.<slot>`, `orders.<semana>.*`, `goalsClaimed.*`, `albumClaimed.*`, `explorerClaimed.*`, `digs.*`, `discovered.*`, `fishBest.*`, `contest.*`, `events.<día>.*`, `friends.<id>.*`, `family.*`, `date.*`, `boat`, `explored` (cadena de 400 caracteres), `chestWeek`, `mineBest`, `lastHug/lastDinner/lastStars/lastSleepTogether/lastMeal` | `patch` | booleanos/uid/marcas de tiempo/objetos pequeños |
| `members` | creación (1 miembro), `join` (`arrayUnion`) y `leaveHouse` (`arrayRemove` de uno mismo) | |
| `seed`, `startedAt`, `inviteCode`, `schemaVersion` | solo en la creación (`initialCouple`) | |

### Subcolecciones
`crops, buildings, decor, animals, memories, nodes, questLog, children, mailbox, activity, chat, soil, gifts, crafts` (+ `nodes/__ping` de `diagnose`).
- `by` lo escriben: crops, buildings, decor, memories, activity, soil, crafts (siempre `s.user.uid`).
- `from`: `chat` (texto ≤ 400 en cliente), `mailbox` (`from`/`to`, texto ≤ 800; se marca leída con `set({readAt}, merge)` por la receptora), `gifts` (`from`; la pareja la encuentra con `set({foundBy, foundAt}, merge)`; la dueña la borra con `retrieveGift`).
- Sin `by/from`: animals, children, questLog (`answers.<uid>`), nodes.

## 2. Qué se endureció (`firestore.rules`)
1. **Inmutables tras crear:** `seed`, `startedAt`, `inviteCode`. `members` solo puede cambiar si la persona se **va** (quita únicamente su uid); nadie añade ni expulsa desde dentro. Unirse sigue siendo: 1→2 miembros, solo cambian `members` y `players`, y solo se añade la propia entrada.
2. **Economía:** `coins`, `hearts`, `heartsTotal` deben ser **enteros ≥ 0**; por escritura suben como máximo **100.000** (monedas) / **500** (corazones); `heartsTotal` **nunca baja**. Al crear la pareja: monedas ≤ 1000 y corazones ≤ 100.
3. **`players`:** cada persona solo modifica (o borra, al irse) su propia entrada; la de la pareja es intocable. Al unirse solo puede crear la suya.
4. **Subcolecciones (dentro del comodín, porque en Firestore varios `match` se suman con OR):**
   - Al crear un documento con `by`/`from`, debe ser tu uid. Vale también para colecciones nuevas que usen esos campos.
   - `chat`: `from == tú`, `text` string ≤ 400; no se edita ni se borra (el juego nunca lo hace).
   - `mailbox`: `from == tú`, texto ≤ 800; solo se puede actualizar `readAt` y solo por la receptora (`to`).
   - `gifts`: `from == tú`, nota ≤ 140, pista ≤ 80; solo se actualiza `foundBy/foundAt`, por alguien que no sea la dueña y si no estaba ya encontrado; solo la dueña lo borra.
5. **Comodín intacto:** colecciones nuevas siguen funcionando sin tocar reglas.

## 3. Qué NO se pudo endurecer (y por qué)
- **Inventario, habilidades, mejoras, desbloqueos, estadísticas y todos los marcadores (`unlocks`, `orders`…):** sin servidor no hay forma de saber si un `inventory.wood +999` viene de cosechar. Se podría topar a ±N por escritura, pero vender (`−n` ítems) y recolectar legítimamente movería cantidades arbitrarias; se dejó libre.
- **Topes de monedas/corazones por escritura son generosos:** no impiden hacerse trampas en 20 pasos de 100.000. Solo evitan el "1.000.000 de golpe", los negativos y los valores no enteros. La protección real requiere Cloud Functions (ver `docs/estado.md`).
- **`hearts ≤ heartsTotal` y los topes diarios `HEART_RULES`/`daily`:** no se validan. Partidas guardadas podrían violar el invariante y habría falsos rechazos; los topes diarios dependen del estado de `daily` que el propio cliente escribe.
- **`daily.<uid>`:** podría restringirse a la propia entrada como `players`; no se hizo para no ampliar el riesgo (se escribe con un objeto completo en el primer uso del día).
- **Un lote puede escribir varias veces `coins` en subcolecciones distintas:** cada documento se valida por separado; no hay validación cruzada entre inventario y monedas.
- **Auto-aprobación:** una persona puede escribir `members` solo para irse. No puede echar a la pareja.

## 4. Riesgos de falsos rechazos (revisar al probar)
- **`is int`:** si algún premio fuera fraccionario (`coins`/`hearts` con decimales) la escritura se rechazaría. En `constants.js` no se encontraron decimales, pero conviene jugar un rato.
- **Venta masiva > 100.000 monedas** en una escritura (inventario enorme): se rechazaría. Subir `maxCoinsUp()` si hace falta.
- **Partidas con `players` de la pareja ausente** (p. ej. alguien que se fue con `leaveHouse`): el resto de la lógica no cambia, pero revisar el flujo de "cambiar de casita".
- **`chat`:** si algún día se añade borrar/editar mensajes, hay que relajar la regla.
- **Mensajes de chat > 400** (versiones antiguas del cliente) o cartas > 800: se rechazan.
- **Colecciones con `by`/`from` que apunten a la pareja** (p. ej. "pedir a mi pareja", `crafts` con `by` de quien pide): el juego hoy siempre escribe el uid propio; si cambia, relajar `honestAuthor`.
- **Escrituras sin conexión:** si dos personas jugaban con valores caducados, `increment()` se resuelve en servidor; los topes miran el resultado final de cada documento, no la acción.
- `database.rules.json` **no se ha tocado**.

## 5. Cómo probar y desplegar con seguridad
1. `npm install --legacy-peer-deps` y `npm run test:rules` (arranca el emulador de Firestore; requiere Java). Debe salir todo en verde.
2. En la consola de Firebase → Firestore → Reglas → **Simulador de reglas**: probar a mano, como una de las dos cuentas, un `update` de `couples/{cid}` con `coins` +120 (debe pasar) y +1.000.000 (debe fallar), y un `get` con una tercera cuenta (debe fallar).
3. Desplegar solo las reglas de Firestore: `firebase deploy --only firestore:rules` (**no** hosting ni RTDB).
4. **Probar con Firebase real, dos cuentas y dos dispositivos**, al menos: crear/unirse, cosechar, vender, pedido, comprar decoración con 💗, chat, carta, regalo escondido, niebla, cambiar avatar, irse de la casita. Mirar la consola del navegador: un rechazo se ve como `permission-denied` y el juego muestra el toast "No se pudo guardar".
5. Si algo se rompe: re-desplegar las reglas anteriores (`git show casita-sync:firestore.rules`).

> **La persona responsable debe probar con Firebase real antes de dar esto por bueno.** Las reglas afectan a partidas reales.
