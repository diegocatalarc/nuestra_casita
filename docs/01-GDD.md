# Nuestra Casita — Game Design Document (v1.0)

> Un videojuego cozy 3D para parejas a distancia. Dos personas, un terreno, una vida compartida que sigue creciendo aunque una de ellas esté desconectada.

---

## 1. Visión

**Logline.** Dos personas separadas por kilómetros heredan un terreno de 50×50 tiles con una casita, un huerto, un río, una pradera y un bosque. Plantan, construyen, cuidan animales y guardan recuerdos en un mundo persistente que ambas habitan, aunque no a la vez.

**No es** una app de chat con skin bonita. Es un juego con bucle de progresión, mundo vivo y sistemas propios. La comunicación emocional (misiones, recuerdos, emotes) está integrada como *mecánica*, no como bandeja de mensajes.

### Pilares

| # | Pilar | Qué significa en diseño |
|---|-------|-------------------------|
| 1 | **Juntos aunque lejos** | Todo el progreso es compartido (un inventario, un terreno, unos corazones). Nada es "tuyo" o "mío". |
| 2 | **El mundo no se detiene** | La simulación se calcula con *marcas de tiempo reales*: el huerto crece y los animales se ponen hambrientos con una persona offline. |
| 3 | **Cozy, sin castigo** | Nada muere ni se pierde. Un animal hambriento deja de producir, no enferma. Un cultivo maduro espera. |
| 4 | **Lo íntimo se vuelve objeto** | Fotos, notas, fechas y notas de voz son objetos físicos en la Sala de recuerdos. |
| 5 | **Presencia ligera** | Verse caminar, regar a la vez, abrazarse, mirar estrellas: la co-presencia es un premio, no un requisito. |

### Público y contexto de uso
- Parejas (2 personas) en relación a distancia, con husos horarios posiblemente distintos.
- Sesiones de 5–20 min en solitario, y sesiones de 30–90 min "citas" en conjunto.
- Plataforma MVP: navegador de escritorio (teclado + ratón). Tablet/móvil en fase 2.

### Referencias y qué tomamos de cada una

| Juego | Se toma | Se evita |
|-------|---------|----------|
| Stardew Valley | Ciclo de huerto, estaciones, recolección | Energía/estrés, calendario de festivales rígido |
| Animal Crossing | Reloj real, decoración libre, personalidad en objetos | Deuda/hipoteca |
| Palia | Mundo compartido persistente, cozy social | MMO, cientos de jugadores |
| Dinkum | Construcción y recursos en un mundo abierto | Supervivencia hostil |
| Farm Together | Cooperación en la misma parcela | Monetización agresiva |
| Spiritfarer | Carga emocional de las relaciones, tono agridulce | Narrativa lineal |

---

## 2. Bucles de juego

- **Micro (10 s):** caminar → regar/cosechar/recolectar → ver el "+1 💗" flotando.
- **Sesión (10–20 min):** recoger producción animal → regar/cosechar → recolectar recursos → gastar en una construcción o decoración → hacer una misión de pareja.
- **Diario:** entrar (+corazones por racha) → 3 misiones del día → tareas del huerto → ver qué hizo la pareja ("mientras no estabas…").
- **Semanal / estacional:** cada estación (7 días reales) cambia el paisaje y qué cultivos rinden; se desbloquean animales y edificios por corazones acumulados.
- **Largo plazo:** una casa completa y decorada, una Sala de recuerdos llena, un registro visible de la relación.

---

## 3. El mundo

### 3.1 Terreno: 50×50 tiles (1 tile = 1 unidad)

```
 x→  0         10        20        30        40      49
 z  ┌──────────────────────────────────────────────────┐
 ↓  │▓▓▓▓▓▓▓▓▓▓ BOSQUE (norte) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│~~~RÍO~~~│
    │▓▓▓                                         ││     │
 10 │▓▓▓   pradera de hierba    ┌─────┐          ││ PRA │
    │BO▓   (reservada, sin      │CASA │ 14,17    ││ DE  │
 20 │SQ▓    árboles)            └─────┘          ││ RA  │
    │UE▓    ═══════camino══════════════════ puente══▶   │
 25 │ ▓   [  HUERTO 10×4  ]   [ corral ]         ││     │
 30 │      12..21 × 25..28     22..30 × 26..32   ││     │
 40 │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ BOSQUE (sur) ▓▓▓▓▓▓▓▓▓│ ~~ │ PRADERA│
    └──────────────────────────────────────────────────┘
```

| Zona | Ubicación | Contenido |
|------|-----------|-----------|
| Casita | (14..18, 17..20) | Edificio inicial 5×4 |
| Huerto | x 12–21, z 25–28 | 40 parcelas de tierra labrada |
| Corral | x 22–30, z 26–32 | Pastizal sin obstáculos para animales |
| Río | curva sinusoidal x≈35 (±2) | Agua (no transitable), orillas de arena con **arcilla** |
| Puente | z 23–24 | Cruza el río hacia la pradera |
| Pradera | este del río y sur-este | **Flores**, **algodón** (tela) |
| Bosque | norte, oeste y sur | **Árboles**, **rocas**, **cristales** raros |

El mapa se **genera de forma determinista** a partir de una semilla de pareja; solo se guarda lo que cambia (ver Arquitectura). Un anillo de árboles cierra el borde del mundo (efecto diorama flotante).

### 3.2 Tiempo
- **Reloj del mundo:** 1 minuto real = 1 hora de juego (día completo = 24 min). Empieza a las 06:00. Se deriva del instante de creación de la pareja, así ambas ven **la misma hora**.
- **Estaciones:** 7 días reales por estación, ciclo de 28 días: Primavera → Verano → Otoño → Invierno.
- **Clima:** se decide por "ranuras" de 8 min con una semilla compartida (ambas ven lo mismo, sin sincronizar mensajes).

| Estación | Lluvia | Niebla (mañanas) | Paleta |
|----------|--------|------------------|--------|
| Primavera | 22 % | 10 % | verdes frescos, copas rosadas |
| Verano | 10 % | 10 % | verdes saturados, cielo claro |
| Otoño | 26 % | 10 % | ocres, naranjas |
| Invierno | 20 % (nieve) | 10 % | blancos azulados |

---

## 4. Personajes y avatar

Avatar low-poly de proporción chibi, creado en una pantalla de personalización con vista previa 3D giratoria.

| Categoría | Opciones MVP |
|-----------|-------------|
| Color de piel | 6 tonos |
| Pelo (estilo) | Corto, Bob, Largo, Moño, Coletas, Rebelde |
| Pelo (color) | 8 colores |
| Ropa | Color de camiseta (8) y pantalón (6) |
| Accesorios | Ninguno, Gafas, Sombrero de paja, Lazo, Bufanda, Corona de flores |

Animaciones: reposo, caminar, regar, cosechar, construir, saludar, abrazo/amor. **Todas se sincronizan** para que la pareja vea qué hace el otro.

---

## 5. Controles y cámara

- **Movimiento:** WASD / flechas (relativo a la cámara) o clic en el suelo (pathfinding A*).
- **Interacción:** clic sobre cultivo, árbol, roca, animal o recuerdo → el personaje camina hasta allí y ejecuta la acción.
- **Atajos:** `Q/E` rotar cámara, rueda = zoom, `R` rotar objeto, `C` cambiar color, `X` quitar, `Esc` cancelar, `H` abrazo, `G` saludar.
- **Cámara isométrica 3D (ortográfica):** inclinación fija ≈ 38°, rotación limitada ±30° respecto a la diagonal, zoom suave (26–90), seguimiento suavizado del jugador.
- **Techos inteligentes:** el techo de un edificio se vuelve transparente cuando cualquiera de las dos personas entra (o en modo decoración).

---

## 6. Recursos y recolección

| Recurso | Fuente | Cantidad | Reaparición |
|---------|--------|----------|-------------|
| 🪵 Madera | Árbol | 2–3 | 25 min |
| 🪨 Piedra | Roca | 2–3 | 25 min |
| 🧱 Arcilla | Montículo en la orilla | 2 | 20 min |
| 🧶 Tela | Arbusto de algodón (pradera) / conejos | 1–2 | 30 min |
| 💎 Cristales | Cristal brillante (bosque profundo) / gatos | 1 | 60 min |
| 🌸 Flores | Flores silvestres (pradera) / rosas | 1–2 | 15 min |

Las reapariciones se guardan como `respawnAt` por nodo, de modo que el estado del mundo es el mismo para ambas.

Inventario **compartido** (un solo inventario por pareja). Inventario inicial: 30 madera, 12 piedra, 6 arcilla, 6 tela, 1 cristal, 6 flores, 3 lechugas, 3 zanahorias, 2 huevos, y 20 💗.

---

## 7. Sistema de construcción

Las construcciones son **habitaciones/estructuras** de tamaño en tiles con estética de casa de muñecas (muros traseros + techo que se desvanece). Se colocan con un fantasma verde/rojo sobre la cuadrícula. Cada una exige recursos y aparece con una animación de levantamiento.

| Edificio | Tamaño | Coste | Efecto especial |
|----------|--------|-------|-----------------|
| 🏠 Casita (inicial) | 5×4 | — | Punto de partida |
| 🛏️ Dormitorio | 4×4 | 20 madera, 8 tela, 4 piedra | Dos camas, armario; escenario de decoración |
| 🍳 Cocina | 4×3 | 15 madera, 12 piedra, 8 arcilla | Desbloquea **Cena romántica** (actividad de pareja) |
| 📚 Biblioteca | 4×4 | 25 madera, 6 tela, 2 cristales | Estanterías; ambiente |
| 🌿 Terraza | 4×3 | 14 madera, 6 piedra, 4 flores | Cubierta abierta, luces de fiesta |
| 🌷 Jardín | 5×5 | 12 flores, 6 piedra, 6 madera | Fuente, setos, parterres |
| 🪟 Invernadero | 5×4 | 15 madera, 6 cristales, 10 arcilla | **Cultivos ×1.5 de velocidad, sin penalización de estación**, permite plantar en su interior |
| 🖼️ Sala de recuerdos | 4×4 | 20 madera, 10 tela, 4 cristales, 5 flores | Muestra los recuerdos como objetos físicos |
| 🔭 Observatorio | 3×3 | 25 piedra, 15 madera, 12 cristales | Desbloquea **Ver las estrellas** (actividad de pareja) |

Restricciones de colocación: terreno de hierba/pradera/suelo de bosque, sin agua, sin nodos de recurso vivos en la huella, sin solaparse con otros edificios, cultivos o decoración.

---

## 8. Decoración

Los objetos se colocan **arrastrando** o haciendo clic: fantasma semitransparente, rejilla de 0.5 tiles, rotación de 90° (`R`), variantes de color (`C`).

| Objeto | Coste | Notas |
|--------|-------|-------|
| 🛋️ Sofá | 4 madera, 4 tela | 3 colores |
| 🪑 Mesa | 5 madera | 3 maderas |
| 💡 Lámpara | 2 madera, 1 cristal | Emite luz de noche |
| 🪴 Planta | 2 flores | 3 macetas |
| 🖼️ Cuadro | 2 madera, 1 tela | Caballete con lienzo |
| 🧶 Alfombra | 4 tela | Se pisa, no bloquea, se puede superponer |
| 🛏️ Cama | 8 madera, 6 tela | |
| 🔥 Chimenea | 10 piedra, 4 arcilla | Luz cálida parpadeante |

Quitar un objeto reembolsa el 50 %. Mover es gratis.

---

## 9. Sistema de huerto

### 9.1 Cultivos
| Cultivo | Crecimiento (min) | Estaciones óptimas | Corazones al cosechar |
|---------|-------------------|--------------------|-----------------------|
| 🥬 Lechuga | 12 | Pri, Oto, Inv | 2 |
| 🥕 Zanahoria | 18 | Pri, Oto | 2 |
| 🍅 Tomate | 25 | Pri, Ver | 2 |
| 🍓 Fresa | 35 | Pri, Ver | 3 |
| 🌹 Rosa | 40 | Pri, Ver, Oto | 3 (+1 flor) |
| 🎃 Calabaza | 50 | Ver, Oto | 4 |

### 9.2 Estados (5)

1. **Sembrado** — semilla en la tierra, a la espera de agua.
2. **Regado** — empieza el crecimiento (primer 20 %).
3. **Creciendo** — 20 %–100 %.
4. **Madurado** — listo, con destello; espera sin pudrirse.
5. **Cosechado** — la parcela queda labrada, lista para volver a plantar.

### 9.3 Crecimiento por tiempo real
```
progreso = (ahora − regadoEn) × tasa / tiempoCrecimiento
tasa = 1.0  (estación óptima)  |  0.5 (fuera de estación)  |  × 1.5 en invernadero (siempre óptimo)
```
- **Riego extra:** cada 4 min reales se puede volver a regar y recortar un 10 % del tiempo.
- **Lluvia:** riega automáticamente los cultivos al aire libre sin regar.
- Todo se calcula *al leer* a partir de marcas de tiempo → no hace falta un servidor que "avance" el mundo.

---

## 10. Animales

Se desbloquean por **corazones acumulados** (nivel de la casita) y se adoptan con corazones.

| Animal | Desbloqueo (💗 acum.) | Adopción | Hambre llena→vacía | Producción | Ciclo |
|--------|----------------------|----------|--------------------|------------|-------|
| 🐔 Gallina | 0 | 15 | 120 min | 🥚 Huevo | 20 min |
| 🐇 Conejo | 50 | 40 | 150 min | 🧶 Tela | 60 min |
| 🐈 Gato | 120 | 60 | 240 min | 💎 Cristal | 180 min |
| 🐕 Perro | 250 | 80 | 240 min | 💗 Tesoro (3 corazones) | 60 min |

### Estadísticas (todas derivadas de marcas de tiempo)
- **Hambre** `h = clamp((ahora − alimentadoEn)/hambreMin, 0, 1)`; 0 = saciado, 1 = hambriento.
- **Felicidad** `f = clamp(1 − 0.8·h + bonoAcariciado, 0, 1)`. El "bono" dura 10 min tras acariciar.
- **Producción** se acumula si `f ≥ 0.3`; el ciclo se alarga cuando la felicidad baja: `tiempo = ciclo / max(f, 0.3)`.
- **Alimentar** consume 1 alimento (cualquier cultivo o huevo, prioritariamente el favorito).
- Los animales vagan por el corral con un **paseo determinista** (misma posición para ambas pantallas sin sincronizar).

---

## 11. Sistema de afecto: Corazones 💗

Moneda principal. Hay un saldo (gastable) y un acumulado histórico (nivel de casita).

| Fuente | Corazones | Límite diario/persona |
|--------|-----------|------------------------|
| Entrada diaria | 5 + racha (máx +7) | 1 vez |
| Regar | 1 | 10 |
| Cosechar | = cultivo | 20 |
| Alimentar | 1 | 8 |
| Recoger producción | 1 | 10 |
| Construir | 10 | — |
| Misión de pareja | 8 (cada una) + 10 si ambas completan | 3 misiones/día |
| Cena romántica | 20 | 1/día |
| Ver las estrellas | 15 | 1/día |
| Abrazo | 3 | cada 30 min |

Sumideros: adopciones. (Fase 2: skins, festivales, mejoras de la casita.)
**Racha:** días consecutivos de entrada. Perder la racha no quita nada: simplemente vuelve a empezar.

---

## 12. Misiones de pareja

Cada día (UTC) se eligen **3 misiones deterministas** (iguales para ambas) de un pool. Cada persona responde por su cuenta (asíncrono). Cuando la otra persona responde, se ve la respuesta.

| Tipo | Ejemplo |
|------|---------|
| Texto | "Comparte tu mejor momento del día", "Cuenta algo que agradezcas", "Describe una cita soñada", "Algo que extrañas de nosotros", "Una canción que me recuerde a ti" |
| Foto | "Comparte una fotografía" |
| Voz | "Envía una nota de voz" |

Las respuestas pueden **guardarse como recuerdo** (un clic) y aparecen en la Sala de recuerdos.

### Actividades cooperativas
- **Abrazo:** ambas a ≤ 2.5 tiles → emote de amor sincronizado.
- **Cena romántica:** requiere Cocina; consume 3 cultivos.
- **Ver las estrellas:** ambas dentro del Observatorio de noche.

---

## 13. Sala de recuerdos

Todo recuerdo es un **objeto físico**:

| Tipo | Objeto 3D | Contenido |
|------|-----------|-----------|
| Foto | Marco de madera con la imagen como textura | Imagen (comprimida a ≤ 720 px) + título |
| Mensaje | Sobre con sello de corazón | Texto |
| Fecha importante | Bloque calendario | Título + fecha, "faltan N días / hace N días" |
| Nota | Nota adhesiva amarilla | Texto corto |
| Nota de voz | Casete / caja de música | Audio (≤ 20 s) |

Al hacer clic, se abre un visor con el contenido completo. Los objetos se distribuyen automáticamente por las estanterías (16 huecos). Si no está construida la Sala, se muestran en el porche de la casita.

---

## 14. Multijugador

Modelo **híbrido**:

- **Estado persistente (Firestore):** cultivos, edificios, decoración, animales, recuerdos, recursos, corazones. Fuente de verdad, funciona con la otra persona offline.
- **Presencia efímera (Realtime Database):** posición, rotación, animación, emote, estado en línea a ≈10 Hz con interpolación en el receptor.

Se ve en tiempo real: movimiento, animaciones de acciones, construcciones y decoraciones (cuando llegan por Firestore), cultivos que cambian de estado.

**Persona offline:** su avatar no aparece; el HUD muestra "última vez visto hace…". Se acumula un resumen "mientras no estabas".

**Conflictos:** operaciones sobre documentos distintos son independientes. Recursos/corazones se modifican con incrementos atómicos (`increment`). Dos personas cosechando a la vez la misma parcela: gana la primera escritura; la segunda ve el estado actualizado.

---

## 15. Iluminación, atmósfera y arte

- **Sol dinámico** con arco diario, **sombras suaves** (PCF soft), **atardecer** naranja/rosa, **noche estrellada** con luna y estrellas titilantes, **lluvia**, **nieve**, **niebla ligera** de mañana.
- Lámparas y chimeneas emiten luz cálida (pool fijo de luces puntuales para estabilidad de rendimiento).
- **Estilo low-poly cozy**: materiales mate con flat shading, paleta pastel, bordes redondeados por geometría, diorama flotante con base de tierra.
- **Música/SFX (fase 2):** guitarra suave, tema por estación, sonidos de interacción y lluvia.

---

## 16. UI / UX

| Pantalla | Función |
|----------|---------|
| Login | Google / modo demo local |
| Casita de pareja | Crear (código de invitación de 6 caracteres) o unirse con código |
| Avatar | Personalización con vista previa 3D |
| HUD | Hora/estación/clima, 💗, recursos, estado de la pareja, barra de herramientas |
| Paneles | Construir, Decorar, Animales, Misiones, Recuerdos, Inventario |

Flujo de primera vez: login → crear/unirse → avatar → tutorial en 4 toasts (mover, regar, recolectar, construir).

---

## 17. Economía y balance (objetivos)

- Primera construcción (Terraza o Cocina) en ≈ 10 min con los recursos iniciales.
- Primer animal (gallina) en la primera sesión.
- Observatorio (el hito mayor) en ≈ 3–4 días de juego casual: 12 cristales → requiere cristales del bosque y gatos.
- Corazones medios por día activo por persona: 40–70; desbloqueo de perro (250) en ≈ 4 días.

---

## 18. Privacidad, seguridad y ética

- Solo dos personas por casita; acceso por código de invitación de un uso (se invalida al unirse).
- Datos íntimos (fotos, audios) solo legibles por los miembros (reglas de Firestore).
- Sin chat abierto, sin extraños, sin publicidad.
- Exportación y borrado de datos desde ajustes (fase 2). Si la relación termina: cualquier miembro puede "cerrar la casita" y descargar los recuerdos.

## 19. Accesibilidad
- Sin acciones con límite de tiempo estricto; todo es asíncrono.
- Textos escalables, contraste suficiente, atajos documentados, opciones de reducir movimiento (lluvia/partículas) en fase 2.

## 20. Métricas de éxito (fase beta)
- D1/D7/D30 retención por pareja.
- % de parejas con ≥ 4 días de entrada por semana.
- Respuestas diarias a misiones (ratio por persona).
- Nº de recuerdos por pareja y edificios construidos.

---

## 21. Alcance

### MVP (incluido en este repositorio)
Login Google + modo demo local · crear/unirse · mundo 50×50 generado · cámara isométrica · movimiento + A* · presencia en tiempo real · recolección · huerto de 5 estados · construcción de 8 edificios · decoración arrastrable · animales con hambre/felicidad/producción · corazones · misiones diarias (texto/foto/voz) · Sala de recuerdos con objetos físicos · avatar personalizable · ciclo día/noche, estaciones, lluvia, nieve, niebla · reglas de seguridad.

### Fase 2
Móvil/táctil · audio y música · más edificios y decoración · festivales estacionales · cocina real con recetas · pesca en el río · carta diaria "mientras no estabas" · Cloud Functions autoritativas · Firebase Storage para media · notificaciones push.

### Riesgos
| Riesgo | Mitigación |
|--------|-----------|
| Coste de Firestore | Snapshots incrementales (`docChanges`), sin escrituras por frame, presencia en RTDB |
| Trampas (editar el inventario) | Aceptable en pareja; fase 2: Cloud Functions autoritativas |
| Reloj local erróneo | Corrección con `.info/serverTimeOffset` |
| Rendimiento 3D | Instancing, pool fijo de luces, DPR limitado |
