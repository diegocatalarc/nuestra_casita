# Auditoría de sistemas: utilidad y comunicación al jugador

Fecha: 2026-11-19. Método tomado de las skills `map-systems`, `balance-check`, `ux-review` y `cut` de
[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT), aplicado a mano sobre nuestro código
(no se instalaron sus skills ni hooks). Todo lo marcado **[POR CONFIRMAR]** necesita vuestra opinión o una medición.
Dispositivos reales de juego: **Edge en macOS** (ordenador) y **iPad** (táctil, sin teclado).

## 1. Hallazgo prioritario: el iPad no tiene controles táctiles
- Girar la cámara solo existe con las teclas **Q/E** y el zoom solo con la **rueda del ratón** (`scene/CameraRig.jsx`). No hay pellizco, gestos ni botones en pantalla. El canvas solo declara `touch-action: none`.
- Atajos solo de teclado: **Enter** (abrir chat; el botón 💬 sí funciona), **WASD**, **R / C / X / H / G / Esc** (rotar, colorear, quitar, abrazar, saludar, cancelar). Los textos de ayuda siguen diciendo "WASD" y "rueda".
- Moverse por clic y los menús sí funcionan con el dedo.
- **Consecuencia:** quien juega en iPad no puede rotar ni acercar la cámara, ni abrazar o saludar sin teclado **[POR CONFIRMAR si hay botones alternativos para abrazo/saludo]**.
- **Otros riesgos del iPad (Safari) [POR CONFIRMAR]:** inicio de sesión con Google en ventana emergente, audio que necesita un toque para activarse, rendimiento del postproceso (MSAA ×4, bloom) y avisos: en iOS solo funcionan si la web se instala en la pantalla de inicio.

## 2. Mapa de sistemas y cómo se presentan
| Sistema | Dónde se abre | Presentación hoy | Utilidad clara |
|---|---|---|---|
| Huerto, recolección, construir | Barra principal | Tutorial (6 pasos) | Sí |
| Misión de pareja | Pareja | Último paso del tutorial | Sí (es el corazón del juego) |
| Animales | Hogar | Ninguna | Media: producen recursos |
| Comer / dormir (energía y hambre) | Hogar | Ninguna; barras arriba a la derecha | Poco clara: no se dice qué ocurre al llegar a 0 **[POR CONFIRMAR]** |
| Pesca, bote | Mundo | Ninguna | Sí (diario de peces) |
| Pedidos y Mercado | Comercio | Ninguna | Sí (única fuente fuerte de 🪙) |
| Habilidades y mejoras (caña, regadera, sartén) | Dentro de Mercado | Ninguna | Baja: beneficios pequeños (−10 %, +8 %) |
| Taller / crafteo | Hogar | Ninguna | Alta si se descubre; pesado de entender (>35 recetas) |
| Citas, regalos escondidos, eventos | Pareja / Mundo / chips | Chips arriba a la izquierda | Media; se solapan |
| Explorar (excavar, mina, vecinos, mascotas) y Mapa/niebla | Mundo | Ninguna | Media-alta; Explorar y Mapa están separados |
| Familia | Hogar | Ninguna | Cara y tardía (150 💗 de total + 40 💗 por hijo) |
| Terreno / ampliaciones | Mundo | Ninguna | Baja hoy: este y sur son gratis |
| Vestidor, decoración, recuerdos | Hogar / barra / Pareja | Vestidor al empezar | Sí (personalización) |

Dependencias: casi todo alimenta a **🪙** (Mercado, pedidos, descubrimientos) y a **💗** (casi todo lo anterior). El resto de sistemas se desbloquean con `heartsTotal` (animales a 50/120/150/200/250, familia a 150).

## 3. Economía (balance-check a mano, con números del código)
- **Corazones 💗 por persona y día** (topes de `HEART_RULES`): regar 10 + cosechar 20 + alimentar 8 + recoger 10 + cuidar 12 + cartas 10 + pesca 8 = **78**, más hasta 60 por pedidos, 5-12 de entrada diaria y las misiones (8 + 10 si ambos). Orden de magnitud: **100-150 💗/día por persona**.
- **Sumideros de 💗:** animales 15+40+60+70+80+90 = **355**; hijos 3×40 = **120**. Total finito ≈ **475 💗**: en pocos días los corazones dejan de poder gastarse.
- **Consecuencia:** los 💗 sirven como contador ("nivel de casita") y para desbloquear cosas, pero **no como moneda**; el jugador ve el número subir sin saber para qué sirve. Es el punto más confuso de la economía.
- **Monedas 🪙:** sumideros claros (semillas raras 120-200, mejoras 150-500, terreno 900, ropa). Empiezan en 0 y la primera fuente es el Mercado/pedidos, que no se explican en el tutorial.
- **Opciones:** (a) renombrar/asumir 💗 como "afecto" no gastable y mostrarlo como progreso (sin sumideros); (b) crear sumideros reales de 💗 (decoración exclusiva, cartas, cenas románticas, mejoras de la casita); (c) fusionar en una sola moneda. Recomiendo (b) o (a), no (c). **[Decisión vuestra]**

## 4. Comunicación y HUD (ux-review)
- **Demasiados elementos a la vez:** hasta 7 chips arriba a la izquierda (pareja, meta, evento, cita, regalo, taller…), barras y recursos arriba a la derecha, 8 botones abajo, el botón 💬 y 4 botones redondos de ajustes. En iPad el espacio útil es menor.
- **El tutorial acaba muy pronto** (6 pasos) y no enseña pedidos, mercado, pesca, comer/dormir ni para qué sirven los 💗.
- **Varias fuentes de objetivos compiten:** misión diaria, meta semanal, pedidos, citas, eventos, hitos de exploración. No hay un lugar único con "qué hacer hoy".
- **Mejoras ya hechas:** menús con descripciones, chat siempre visible.

## 5. Propuesta de recortes y cambios (cut): decide cada uno
Leyenda: ✅ mantener · 🔀 fusionar/ocultar hasta que haga falta · ✂️ recortar · ➕ añadir. Marcad en la columna "Decidido".
| # | Propuesta | Por qué | Decidido |
|---|---|---|---|
| 1 | ✅ **Hecho (v10)** ➕ **Controles táctiles** (pellizco para zoom, dos dedos para girar, botones Abrazo/Saludo/Rotar) | El iPad no puede rotar ni acercar | |
| 2 | ➕ **Panel "Hoy"** (misión del día, meta semanal, pedidos, evento) | Un solo sitio para "¿qué hago?" | |
| 3 | ➕ Tutorial ampliado y opcional: pedidos/mercado, pesca, para qué sirven los 💗 y comer/dormir | Son los sistemas que sostienen la economía | |
| 4 | 🔀 Dar uso real a los 💗 (opción b) o mostrarlos como progreso (opción a) | No se pueden gastar tras pocos días | ✅ Hecho (b): decoración del corazón, 6 objetos, 770 💗 en total y repetibles |
| 5 | 🔀 Fusionar **Explorar + Mapa** en un solo menú | Mismo tema, dos entradas | ✅ Hecho: el mapa se abre desde Explorar |
| 6 | 🔀 Fusionar **Eventos + Citas** en una pestaña de "Planes juntos" | Se solapan | ⏸ Descartado de momento: Eventos (mundo) y Citas (pareja) viven en menús distintos |
| 7 | 🔀 Ocultar **Terreno** hasta que haya algo que comprar (sureste) | Hoy casi no tiene función | |
| 8 | 🔀 Reducir los chips: mostrar solo el más importante y agrupar el resto | Saturación visual, sobre todo en iPad | |
| 9 | ✂️ Valorar **habilidades y mejoras** si nadie las usa | Bonos pequeños y escondidos en Mercado | |
| 10 | ✂️ Valorar **Familia** si no la habéis tocado | Cara, tardía y solo para quien llega a 150 💗 | |
| 11 | ✂️ Valorar que **comer/dormir** deje de ser obligatorio (solo bonificación) | No queda claro el castigo | |

## 6. Qué necesito de vosotros para cerrar el recorte
1. Qué sistemas habéis usado de verdad, y cuáles ni habéis abierto.
2. Si en el iPad se puede rotar/acercar de alguna forma que yo no haya visto.
3. Marcar la columna "Decidido" del apartado 5.
