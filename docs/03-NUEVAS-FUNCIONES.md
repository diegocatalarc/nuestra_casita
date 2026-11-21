# Nuevas funciones: vida diaria, familia, granero y hongos

## Necesidades (por persona)
- **⚡ Energía:** baja 1 punto cada 3 min despierta (el doble si tienes hambre) y cada tarea cuesta un poco. Durmiendo sube 1 cada 3 s. Con < 12 caminas más lento.
- **🍽️ Saciedad:** baja 1 punto cada 2 min. Con < 15 la energía se gasta el doble de rápido. Nada es punitivo: no hay muerte ni pérdida de progreso.
- Ambas se **derivan de marcas de tiempo** (`players.{uid}.energy/energyAt/full/fullAt/sleepSince`): funcionan aunque la persona esté desconectada.

## Dormir 😴
Clic en una cama (la de la casita, las del Dormitorio o las que coloquéis) o botón *Dormir*. El personaje se tumba, la pareja lo ve dormir (animación sincronizada) y aparece una pantalla nocturna con *Despertar*. Si **las dos dormís a la vez durante 60 s**: +8 💗 (1 vez al día).

## Comer y cocinar 🍽️
- Los cultivos, huevos, leche y hongos se pueden comer crudos.
- La **Cocina** permite 7 recetas (ensalada, sopa, tortilla, mermelada, guiso de setas, tarta de calabaza, queso). Los platos saben un 20 % mejor sentado a una mesa o dentro de casa.
- **Comer juntos** (a menos de 4 casillas y en menos de 90 s): +5 💗 (cada 20 min).

## Familia 👶
Requisitos: Dormitorio + Cuna (decoración) + 150 💗 acumulados + 40 💗 disponibles + máximo 3 peques. **Una persona propone y la otra acepta.** Embarazo de 8 h reales (visible con cuenta atrás). El bebé nace como documento `children/{id}` con rasgos mezclados de ambos; se le pone nombre en *Familia*. Crece por edad real: Bebé (< 1 día, duerme en la cuna) → Gateando (< 3 d) → Peque (< 10 d) → Joven. Se le alimenta (leche o comida) y se juega con él: +2 💗 por cuidado (máx. 12/día).

## Animales y Granero 🛖
- Gallinas, perros y gatos como antes; nuevos: **🐑 oveja** (lana) y **🐄 vaca** (leche), que requieren **Granero**.
- Capacidad: 4 animales + 6 por Granero.
- **Alimentación automática:** el granero da de comer a los animales hambrientos con la comida de la mochila (la ejecuta solo una de las dos personas, para evitar duplicados).

## Invernadero y hongos 🍄
- **Invernadero**: cultivos ×1.5, sin penalización de estación (ya existía).
- **Hongos** (champiñón, shiitake, seta rosa): se plantan en el **suelo del bosque** o dentro del **Cobertizo de hongos** (×1.6). No crecen en tierra labrada.

## Guía de prueba con tu pareja
1. Una persona crea la casita y envía el código; la otra se une. Abrid ⚙️ **Ayuda** → *Probar ahora*: debe salir ✅ en Firestore y Realtime Database.
2. Comprobad que os veis moverse (⚙️ muestra «Pareja en línea»). Si no, copiad el informe y enviadlo.
3. Uno construye o planta algo; el otro lo debe ver aparecer.
4. Dejaos una carta en el 📬 buzón (la bandera del buzón del mapa sube cuando hay correo).
5. Salid y volved a entrar al día siguiente: aparece **«Mientras no estabas…»**.

## Tutorial, metas y avisos
- **Tutorial** de 6 pasos (se completa solo al hacer cada cosa; el botón de la barra parpadea).
- **Metas semanales:** 3 por semana (cambian cada lunes), progreso compartido, recompensa en 💗.
- **Mientras no estabas:** se basa en `activity/*` y `players.{uid}.lastSeenAt`.
- **Buzón:** `mailbox/{id}`; leer una carta da +2 💗 (máx. 10/día).
- **Avisos:** Notification API con la pestaña en segundo plano (carta nueva, pareja en línea, propuesta). Con la app cerrada harían falta FCM + Cloud Functions (plan Blaze).

## Idiomas (español / inglés)
- Al abrir el juego se **detecta el idioma del dispositivo** (`navigator.languages`): si es español se usa español, si es inglés se usa inglés, y en cualquier otro caso inglés. La elección manual (botones **ES | EN** en la pantalla de inicio y en ⚙️ Ayuda) se recuerda y recarga la página.
- Todos los textos pasan por `t('texto en español', [valores])` (`src/i18n/index.js`). La clave es el texto en español y las traducciones están en `src/i18n/en.js` (volcado automático) y `src/i18n/en-extra.js` (frases añadidas a mano). Los `{0}`, `{1}`… son huecos para valores.
- Para añadir un idioma nuevo: crear su diccionario, añadirlo a `LANGS` y a `t()`. Para detectar textos sin traducir en inglés, abre la consola y mira `window.__i18nMissing`.
- Los recuerdos, cartas y nombres que escribe cada persona se guardan tal cual en el idioma en que se escribieron.

## Chat 💬
- Ventana flotante (botón **💬 Chat**) que no tapa el juego. Mensajes en `couples/{cid}/chat/{id}` (`from`, `text`, `at`); solo se descargan los **últimos 150** (`orderBy('at') + limitToLast`).
- Atajos con emojis (❤️ 😘 🤗…), día/hora, **«visto ✓✓»** (`players.{uid}.chatSeen`) y contador en el botón y en la pestaña.
- Cada mensaje aparece como **globo sobre la cabeza** del personaje durante 7 s (un emoji solo se ve grande).
- Aviso + sonido + notificación del navegador cuando llega un mensaje con el chat cerrado o la pestaña oculta.
- Las reglas de Firestore ya cubren la subcolección (`/{collection}/{docId}`): no hace falta republicarlas.

## Vestidor 👗
- Botón **👗 Vestidor** (o tocar el **armario** dentro de la casita/dormitorio). Pestañas: Cuerpo (piel 8, ojos 4, boca 3, mejillas/pecas), Pelo (10 peinados · 14 colores), Ropa (camiseta, vestido, sudadera, peto, chaqueta · pantalón, falda, shorts · colores · zapatos), Extras (10 gorros/orejas/coronas, 4 gafas, 5 de cuello, 4 de espalda: mochila, alas, capa) y **Conjuntos** (hasta 4 looks guardados). Botón 🎲 *Sorpréndeme*.
- Los avatares antiguos (campo `acc`) se convierten solos (`normAvatar`).

## Pesca 🎣 y bote ⛵
- **Pescar:** botón 🎣 → *Empezar a pescar* (o simplemente pulsa el agua). Se lanza la caña, aparece ❗ al picar y hay **2,4 s** para tirar (clic, Espacio o botón «¡Tira!»). Si te mueves o llegas tarde, se escapa.
- 8 especies (pececillo, gamba, carpa, trucha, siluro, cangrejo, pez dorado, koi). Más probabilidad según **hora, estación y lluvia**; el amanecer y la lluvia aceleran las picadas. También salen botas viejas (tela) y, con suerte, cristales.
- Recompensas: corazones (máx. 8/día), **+3 💗 por especie nueva**, bonus por raros; meta semanal «Pescad 6 peces»; diario de pesca con récord de tamaño (`fishLog`, `fishBest` en la raíz de la casita).
- Los peces se comen crudos o se cocinan: sopa de pescado, trucha asada, sushi y arroz con cangrejo.
- **Bote:** 25 🪵 + 6 🧶, amarrado junto al puente (`couple.boat`). Clic en el bote para subir; navega solo por el **río** (también bajo el puente); *Bajar del bote* (⚓ / tecla F) en la orilla. Si tu pareja ya navega, te subes de **pasajera/o** y vais juntos. Se puede pescar desde el bote. La posición se guarda en la nube.

## Encargos, mercado y habilidades 🪙
- **Monedas** (`couple.coins`, junto a los 💗). Se ganan vendiendo y entregando pedidos.
- **📋 Tablón de pedidos** (botón o el tablón del mapa junto al camino): 4 pedidos al día (vecinos Marta, Pablo, Luna + un **visitante** con premio mayor y, a veces, una **prenda exclusiva** para el Vestidor). Se generan de forma determinista por `seed + día UTC` (`dailyOrders`), así que son idénticos para los dos. Se entregan con la mochila compartida y quedan marcados en `orders.{día}.{slot}`.
- **🏪 Mercado:** *Vender* (cosecha, peces, huevos, leche, platos; cada día un producto «de moda» paga ×1,5), *Tienda* (semillas raras: girasol, lavanda, melón; ropa del Vestidor) y *Mejoras*.
- **Habilidades** (pesca, cultivo, cocina; `skills.*` en XP, nivel máx. 10) y **herramientas** (caña, regadera, sartén; 2 niveles con monedas, `upgrades.*`): menos espera y más tiempo al pescar, cosecha doble, platos que alimentan más y doble ración.
- Desbloqueos en `unlocks.*` (`crop_melon`, `hat_7`…). Lo que ya lleva puesto cada persona se respeta aunque ahora sea de pago.
- Metas semanales nuevas: «Completad 4 pedidos» y «Vended 30 productos».

## Avisos de novedades 🆕
- Al entrar tras una actualización aparece un **modal de novedades** (una vez por persona; se recuerda en el navegador). Se puede reabrir en ⚙️ Ayuda → *Novedades*. Los botones nuevos de la barra llevan una etiqueta 🆕 hasta que se abren.
- Para anunciar algo en el futuro: añadir una entrada a `NEWS` en `src/ui/news.js` (con `v` mayor) y, si es un botón nuevo, su id a `NEW_TABS`.

## Eventos 🎪
Todo se deriva de `seed + día UTC` (`eventsFor` en `logic.js`), así que los dos ven lo mismo sin escribir nada en la nube hasta que alguien participa. Estado en `couple.events.{día}`.
- **Festival** cada sábado (UTC); el tema depende de la estación (flores, estrellas, cosecha, nieve). Puesto con banderines en la plaza. Minijuego de 25 s (3 intentos por persona y día); cuenta el **mejor resultado de cada uno y se suman** (40 / 80 / 120 pts → monedas, corazones y, al final, una **prenda exclusiva de festival**).
- **Visitante sorpresa** (≈50 % de los días sin festival): aparece en la plaza de 7:00 a 21:00 con un regalo (monedas, materiales o semillas raras), uno por día para la pareja.
- **Lluvia de estrellas** (≈30 % de las noches, 21:00–5:00): estrellas fugaces en el cielo y botón «Pedir un deseo» (+3 💗); si los dos piden en menos de 10 min, +10 💗 extra.
- Botón **🎪 Eventos**: evento de hoy, premios y calendario de la semana; chip amarillo en pantalla y aviso al entrar el primer día.

## Editor de decoración ✏️
En 🛋️ *Decorar* (sin elegir objeto nuevo): **toca un objeto para seleccionarlo** (anillo amarillo) y usa los botones: **↺ ↻ Rotar** (en el sitio, comprobando que cabe), **🎨 Color**, **✋ Mover** (toca el sitio nuevo) y **🗑️ Eliminar** (50 % de reembolso). También se puede **arrastrar** directamente. Atajos: R / Mayús+R, C, X o Supr. Funciona igual con toques en el móvil.

## Ampliaciones de terreno 🗺️
- El mapa pasa de 50×50 a **80×80** (`MAP`). El terreno inicial no cambia (se genera igual que antes); lo demás es niebla hasta comprarlo. Tres ampliaciones (`ZONES` en `constants.js`): **Pradera del Este** (600 🪙 + 30 madera; estanque), **Valle del Sur** (800 🪙 + 30 piedra; lago grande) y **Colinas del Sureste** (1500 🪙 + 8 cristales; exige Este o Sur).
- Se entra por dos **puertas con camino** (este, junto al puente; sur, bajo la casita), marcadas con un cartel 🗺️. Estado en `couple.zones.{id}`; el mundo se regenera de forma determinista (`generateWorld(seed, zones)`), así que las dos personas ven lo mismo.
- **Arar tierra** (`soil/{x_z}`): en 🌱 Plantar elige ⛏️ *Arar* para convertir hierba o pradera en huerto en cualquier parte (↩️ *Quitar* lo deshace). Se dibuja encima del terreno sin reconstruirlo.
- Nuevo botón **🗺️ Terreno** con el mapa de zonas y la compra.

## Citas 💞 y regalos escondidos 🎁
- **Citas** (botón 💞): picnic, noche de estrellas, paseo en bote, pesca a dúo y cena romántica. Una persona invita y la otra acepta (`couple.date`). La cita se cumple **estando juntos haciendo algo**; el contador sube mientras se cumple la condición y lo lleva la persona que invitó. Al completarla: +12 💗, +60 🪙 y un **recuerdo automático** en la sala (`kind: 'date'`). Máx. 3 al día.
- **Regalos escondidos** (`gifts/{id}`): escondes monedas u objetos donde estás, con una nota y una pista. Tu pareja ve un chip **«frío / caliente»**, destellos al acercarse y lo encuentra al pasar por encima (+6 💗); tú recibes un aviso cuando lo encuentra. Máx. 3 sin encontrar a la vez; se pueden recoger de nuevo.
- Metas semanales nuevas: «Tened 2 citas» y «Encontrad 2 regalos escondidos».

## Exploración 🧭
- **El río sigue hacia el sur** al comprar el *Valle del Sur* y se abre en una **bahía con islas** (`BAY`, `ISLAND` en `worldGen.js`). Se llega en bote; en la isla mayor hay un **cofre del tesoro semanal** (monedas + pieza rara, `couple.chestWeek`).
- **Excavación diaria:** 7 destellos ✨ en la arena (`digSpots`, deterministas por semilla + día UTC). Salen conchas, fósiles, monedas y piezas raras (`digs.{día}.{n}`).
- **Álbum** (`found.{id}`, `albumClaimed`): conchas (8), fósiles (6), minerales (6) y peces (8). Cada pieza nueva da +2 💗 y completar una página da un premio. Los coleccionables entran en la mochila y se pueden vender.
- **La mina** (Colinas del Sureste): cuadrícula de rocas, 12 golpes, 5 pisos con escaleras ⬇️ y minerales mejores abajo; cuesta 10 de energía.

## Pueblo 🏘️
- Tres **casas de vecinos** al otro lado del puente (Marta, Pablo, Luna) con sus vecinos en la puerta. Botón **🧭 Explorar → Vecinos**.
- **Amistad** (`friends.{id}.pts`): charla diaria (+2), regalo diario (+6 si le gusta, +2 si no). Cada nivel (6/18/36/60 pts) desbloquea un **capítulo de su historia** con recompensa; el 3.º da una prenda exclusiva para el Vestidor.
- **Mascotas con carácter:** cada una tiene un rasgo (curiosa, perezosa, juguetona, glotona, valiente) y un **vínculo** (`bond`) que sube al acariciar, alimentar y **jugar** (cada 4 h). Desde el nivel 2 pueden **ayudar una vez al día** (rastrear, pescar, recoger flores…) y los domingos hay **concurso** contra rivales deterministas.

## Territorio principal ampliado y pueblo con vida
- La **Pradera del Este** y el **Valle del Sur** (con la bahía y la isla del tesoro) pasan a ser **territorio principal gratuito** (`free: true` en `ZONES`): 5 500 casillas en lugar de 2 500. Los árboles del borde se despejan para que el terreno sea continuo. Solo las **Colinas del Sureste** (mina) siguen en venta, ahora por 900 🪙. Los mundos guardados no cambian: lo ya construido sigue donde estaba.
- **Pueblo** (`scene/Village.jsx`): plaza empedrada con fuente, calles, farolas (iluminan de noche, igual que las ventanas), mercadillo, banco, huerto vallado de Marta con tendedero, muelle de Pablo con su caña en el río y secadero de pescado, caballete de Luna con un gato en el porche, arco de entrada y árboles. Los vecinos **trabajan** (Marta riega, Pablo pesca, Luna pinta) y **se juntan en la plaza** de 12 a 14 h y de 18 a 21 h; fuera de su horario están en casa.

## Crafteo 🛠️
- **Taller** (menú 🏡 Casita → 🛠️ Taller, o tocando una estación colocada): **mesa de trabajo** siempre disponible y **4 estaciones** que se colocan con 🛋️ Decorar con recursos: Banco de carpintero, Telar, Fragua y Horno de cristal. 35 recetas en `RECIPES` (`constants.js`).
- **Materiales intermedios** (`CRAFT_ITEMS`): tablón, ladrillo, hilo, cuerda, pintura, tela fina, lingote y vidrio; se pueden vender. Con ellos se fabrican **19 objetos de decoración** (se dibujan con la lista `parts` de su definición, así que añadir uno nuevo es solo datos), **prendas para el Vestidor** y **mejoras** (bote +25 % de velocidad, pico +4 golpes en la mina, anzuelo con más peces raros).
- **Trabajos con tiempo real** (`crafts/{id}`, hasta 4 a la vez para la pareja). La otra persona puede **ayudar** una vez por trabajo (−30 % del tiempo restante, +1 💗) y también **pedir** un objeto (`state: 'request'`, además llega un mensaje al chat). La **Artesanía** (`skills.craft`) acorta los tiempos y abre recetas con nivel; otras se abren con amistad con un vecino o con una página del álbum.
- Los objetos fabricados se guardan en la mochila (`d_*`) y se colocan con Decorar; al quitarlos vuelven enteros a la mochila.

## Pulido estético de objetos
- **Sombreado horneado** en todas las cajas redondeadas (`scene/rb.js`): más claro arriba y más oscuro abajo, como una oclusión ambiental falsa que da volumen a muebles, edificios y props sin coste de rendimiento.
- **Sombras de contacto** suaves bajo los objetos decorativos, los props y el pueblo (`scene/shadow.jsx`), para que se asienten en el suelo.
- **Objetos fabricados y estaciones rehechos** (`game/craftParts.js`): cada uno con muchas más piezas y detalle (libros variados, mantel a cuadros, cuerdas, remaches, flecos…), **cristal translúcido** de verdad (vitrina, terrario, acuario) y **animaciones**: cortinas y estandarte que ondean, peces que nadan, cristales que brillan, veleta que gira, brasas que parpadean. `PartsModel` admite formas caja, cilindro, elipsoide, cono, toro, octaedro y cristal, colores derivados del color elegido y giros por pieza.
- **Huerto con surcos** (también la tierra arada), **puente de tablas** individuales con vigas, remates y bolas en los postes, y **plantas, cultivos y hojas** que se balancean suavemente.
- **Sala de pruebas** para revisar un objeto aislado con la luz del juego: abre `/?showroom&obj=d_hammock` y, desde la consola, `__show('sofa', variante, giro)`.

## Mundo por descubrir (niebla, pueblo grande y rincones)
- **Niebla de exploración**: el mapa 80×80 está cubierto de nubes que se despejan al caminar (celdas de 4×4, compartido por la pareja en `couple.explored`).
- **15 rincones secretos (POIs)** y 10 edificios/plazas del pueblo grande (este, `TOWN`) con premios al acercarse (`couple.discovered`). Definidos en `constants.js` (`POIS`, `TOWN_BUILDINGS`, `TOWN_LANDMARKS`); modelos en `worldParts.js`.
- **Mapa del mundo** (botón 🧭): minimapa con niebla, descubrimientos y puntos de ambos; hitos de explorador (6/12/20 lugares).

## Calidad y mantenimiento
- **Tests** (`npm test`, Vitest en `tests/`): mundo determinista, pedidos/eventos/misiones diarias, economía, niebla y contenido. Detectaron un fallo real: el cofre semanal se renovaba en domingo en vez de lunes (`weekIdx`).
- **Lint** (`npm run lint`): detecta identificadores sin definir (imports que faltan al mover código).
- **`game/actions/`** ya no es un fichero de 1.500 líneas: está dividido por dominio (`core`, `base`, `vitals`, `family`, `mailbox`, `chat`, `fishing`, `economy`, `events`, `land`, `dates`, `gifts`, `explore`, `neighbors`, `craft`). Se sigue importando desde `game/actions`.
- Datos de exploración en `game/exploreData.js` (reexportado por `constants.js`).
- **CI** de GitHub (`.github/workflows/ci.yml`): lint + tests + build en cada push.

## Chat a mano, menús claros y más detalle visual
- **Chat siempre visible:** botón flotante 💬 abajo a la derecha (`ui/ChatFab.jsx`) con contador, punto de conexión de la pareja, vista previa del último mensaje sin leer y atajo **Enter**. Ya no está dentro de un menú.
- **Menús:** la barra separa herramientas (Mano, Plantar, Construir, Decorar) de menús (Hogar, Pareja, Mundo, Comercio). Cada menú es una lista con una descripción por opción. Ajustes y novedades pasaron al ⚙️ (abajo a la izquierda).
- **Detalle del mapa sin coste de rendimiento:** textura de grano repetida sobre el terreno (una sola muestra de textura), florecillas silvestres y segunda copa en árboles redondos (instancias), surcos continuos en el huerto y travesaños laterales en la valla.

## Pedidos 2.0
- **De temporada:** `dailyOrders(seed, day, season)` (season opcional): los cultivos pedidos se pueden sembrar en la estación actual (en invierno: lechuga y champiñón). Sin `season` se comporta como antes.
- **Pedido grande semanal** (📦 arriba en el Tablón): ~3 ingredientes (2 cultivos de temporada ×6–10 + 1 de huevo/pescado/flor ×4–7). Se entrega entre los dos con botones «Aportar»; al completarse paga monedas (valor×1,8) + 12 💗. Progreso en `couple.orders.w<weekIdx>` (`{<uid>:{item:n}, need, claimed}`).
- **Bonus diario:** completar los 4 pedidos del día da +50 🪙 +5 💗 (`couple.orders.<día>.bonus`); barra n/4 en el Tablón.
- **Pistas** junto a lo que falta («🌱 Sembrar…», «🎣 Pescar…», «🍳 Cocinar…»).
## El Taller entra en el bucle del jugador
- **Hoy → 🛠️ Taller:** tarjeta que sugiere una receta fabricable con lo que hay en la mochila (`game/today.js`, `craftSuggestion`). Si no hay ninguna, indica la más cercana y el material que falta, o «Nada que fabricar hoy». El botón abre el Taller.
- **Tutorial:** paso final opcional «Fabrica algo» (resalta 🛠️ Taller del menú Hogar). Se da por hecho al empezar o completar una fabricación propia.
- **Taller:** arriba una línea «¿Para qué sirve?»; las recetas que se pueden fabricar ahora van primero y el resto, en «Más recetas» (colapsado si hay más de 6). Solo cambia el orden y la presentación.

## Taller sencillo
- El 🛠️ Taller abre con **10 recetas básicas** (`SIMPLE_RECIPES` en `constants.js`, ids `s_*`): taburete, cerca, estantería, alfombra, peluche, lámpara de cristal, terrario y 3 prendas (orejas de gato, orejas de conejo, gafas de corazón). Solo usan madera, piedra, tela, flores y cristales; se hacen en la mesa de trabajo (sin colocar estaciones), sin nivel de Artesanía y en 20-60 s.
- Un solo botón grande «Fabricar». Al terminar, el objeto llega **solo a la mochila** (`autoCollectCrafts`, cada segundo, solo los trabajos propios).
- Estaciones, materiales intermedios, Artesanía y ayuda de la pareja siguen en «Mostrar recetas avanzadas» (apagado por defecto, se recuerda en `nc_craft_adv`). Los trabajos en curso y los objetos ya fabricados no cambian.
- Hoy → Taller y el último paso del tutorial sugieren recetas sencillas.

## La historia, contada (v18)
- Escenas narradas a pantalla completa: prólogo, introducción de cada capítulo, reacción al cumplir cada paso y cierre con recompensa. Toca para avanzar; «Saltar» salta al final.
- Guía siempre visible arriba (qué toca hacer, flecha y distancia); el vecino objetivo lleva 📍. Al hablar con él te pide lo que necesita y se le entrega ahí mismo.
- El Diario del Valle permite revivir cualquier escena.

## Un mundo más vivo y dibujado (v22)
- **Contorno global** (postproceso por profundidad, ver `docs/visual.md`): línea fina marrón cálida en las siluetas de todo el mundo y realce de nitidez ligero; ya no hay efecto «maqueta» (TiltShift).
- **Calidad gráfica** (⚙️ Ayuda → «Calidad gráfica»: Normal / Alta, se guarda en `nc_fx`). Escritorio = Alta (bloom, color, contorno). Tablet = Normal (contorno solo en personajes) hasta que se active Alta, que usa una versión barata de un solo pase.
- Mariposas, libélulas y pajarillos junto a la casa; hierba y flores extra; humo de chimenea más vivo; «pop» al sembrar, regar y cosechar.

## Funciones poco a poco (v23)
- Descubrimiento progresivo: las parejas **nuevas** empiezan con Mano, Plantar, Pedidos, Mochila, Diario y Ajustes; el resto se desbloquea por capítulos de la historia con un aviso 🆕 «Desbloqueado». Las parejas anteriores al 22/11/2026 conservan todo. Ajustes → «Pantalla limpia» → «Mostrar todas las funciones» (por dispositivo). Tabla en `src/game/unlocks.js`.

## Instálalo como app (v24)
- En iPad (Safari, fuera del modo app) el juego muestra una vez la tarjeta «Para Bri 💗» con los pasos de Compartir → «Añadir a pantalla de inicio». «Entendido» la pospone 14 días; «No volver a mostrar» la silencia. También en Ajustes → «Cómo instalarlo». Lógica en `src/game/install.js`; `?ipad` en la URL la fuerza (pruebas).
