# Historia v2 — «El Valle Atrasado» (IMPLEMENTADA en v20; guion en `src/game/story/scenes.js`)

Estado: **implementada** (v20) con las decisiones de dos rondas de preguntas; sigue abierta a pulido. Decisiones ya tomadas por la persona responsable: tono de **misterio cálido con bastante humor negro**; protagonistas = **dos forasteros elegidos**; hilo conductor = **las estaciones y el clima**; final = **un gran giro**. Todo lo demás está **[POR CONFIRMAR]**.

## Regla de producto
- **La historia es lo primero que se ve.** Al pulsar «Entrar al valle» arranca una escena (antes del avatar y del tutorial). Cada capítulo empieza con una **apertura en frío**: la primera línea plantea una pregunta o un problema (nunca «hola, soy X»), y la escena termina dejando un objetivo concreto en el banner.
- La premisa misma es una escena (prólogo). Todo giro importante es una escena.

## Premisa
Las estaciones del Valle llevan **años de retraso**. No es una metáfora: el clima del valle lo tramita el **Negociado de Estaciones**, una oficina del Ayuntamiento cuyo único funcionario sigue fichando cada mañana… aunque lleva mucho tiempo sin cobrar. Resultado: el valle está atascado en una primavera eterna a medio hacer («Día 1») y las demás estaciones esperan turno en un buzón.

Dos forasteros reciben una carta sin remitente: *«Se solicita su presencia para resolver un asunto pendiente de la estación. Traigan paraguas y sentido del humor.»* Llegan, cada uno desde su casa a miles de kilómetros, a la misma casita.

Tono: humor negro **deadpan, tierno por debajo**. Ejemplos: «Aquí nadie se muere; se queda.» · «El cementerio es lo mejor cuidado del pueblo. Es el único sitio con vistas al río y sin vecinos ruidosos.» · «El invierno se quedó a vivir y no paga alquiler.»

## Reparto (los 8 de siempre, con una vuelta de tuerca)
- **Doña Remedios** (alcaldesa, guía): organizada, adora el papeleo y las malas noticias dichas con amabilidad. Escribe cada atardecer una carta a alguien lejano. Guarda **el secreto**.
- **Íñigo** (relojero): su reloj marca las 6:10. «Es la hora a la que el tiempo dijo que volvía enseguida.»
- **Tomás** (tendero): cartas que nunca entregó; **no tira nada** («por si alguien todavía lo espera»).
- **Rosa**, **Celia**, **Luna**, **Pablo** (el koi dorado), **Marta** (su difunto Anselmo «sigue opinando» sobre el huerto).
- **El Funcionario del Negociado** (nuevo; antagonista amable): sellos, formularios y una absoluta convicción de que sigue vivo y trabajando. **[POR CONFIRMAR si es antagonista, aliado o ambos]**.

## Estructura propuesta: 7 capítulos, 4 estaciones + 3 de giro (la tabla con clima está más abajo)
Cada capítulo reutiliza las mecánicas actuales (cultivar, vender, pedidos, pesca, recuerdos, presencia de la pareja) y **cambia el clima/estación del valle como parte de la trama** (p. ej. la lluvia solo cae cuando los dos riegan a la vez).

| Cap. | Título provisional | Estación/clima | Qué se descubre |
|---|---|---|---|
| 1 | La primavera que no llegó | Primavera atascada | Primer síntoma: nada florece del todo. Aparece el Negociado. |
| 2 | Expediente de verano | Calor extremo / sequía | Por qué nadie se va del valle. Humor: la panadería «solo hornea lo que ya se comió». |
| 3 | Otoño, pendiente de firma | Hojas que no caen | Las cartas sin entregar: son para **gente que ya no está**, y para alguien que sí. |
| 4 | El invierno inquilino | Nieve fuera de temporada | El invierno no es el villano: está **esperando que alguien lo reclame**. |
| 5 | La hora de las 6:10 | Clima loco (todas a la vez) | El reloj: qué ocurrió a las 6:10. |
| 6 | Fe de erratas | Cielo despejado | Sale a la luz el registro oficial del valle. |
| 7 | La estación que falta | Todas, una detrás de otra | **El gran giro** + cierre. |

## Decisiones tomadas (ronda 1 de preguntas)
- Tono: misterio cálido + humor negro **deadpan suave** (chistes sobre la muerte y el papeleo, dichos con ternura; sin crudeza).
- Gran giro: **«El clima eres tú»**. El tiempo del valle es el estado de ánimo de la distancia entre ellos: cada tormenta fue una discusión por videollamada, cada sol una buena noche, cada nevada un silencio largo. La carta inicial la escribió el propio valle.
- El Funcionario del Negociado: **obstáculo en los primeros capítulos y pieza clave en el giro** (es quien lleva el registro del tiempo… y descubre que los expedientes llevan sus nombres).
- Clima **jugable**: cada capítulo puede forzar un clima o efecto visual en el mundo (determinista, solo mientras el capítulo está activo; no altera la partida base).

## Cómo encaja el giro (pistas sembradas desde el capítulo 1)
1. Las estaciones «atrasadas» son, en realidad, los **estados de ánimo acumulados**: el valle está atascado en «primavera sin acabar» porque la relación está en un «casi».
2. Cada vecino encarna una emoción de la distancia: Remedios = la esperanza que escribe cartas; Íñigo = el tiempo que no pasa; Tomás = lo no dicho; Rosa = la ternura que alimenta; Celia = la paciencia; Luna = la añoranza; Pablo = el silencio; Marta = la costumbre de cuidar.
3. El Funcionario lleva un libro de «partes meteorológicos» con fechas… que coinciden con **fechas reales de la pareja** (por eso hace falta personalizar, ver abajo).
4. El giro (cap. 7): al cerrar el libro, los forasteros comprenden que el valle **no necesita que lo arreglen, necesita que se reencuentren**: el sol definitivo sale cuando los dos están en la plaza a la vez. La carta del inicio estaba firmada por «El Valle (en funciones de ustedes)».

## Capítulos con clima jugable (propuesta v2)
| Cap. | Título | Clima forzado | Gancho (primera línea de la escena) |
|---|---|---|---|
| 1 | La primavera que no llegó | Llovizna a medio camino | «¿Quién deja una carta sin remitente… y con sello de lluvia?» |
| 2 | Expediente de verano | Calor seco; llueve solo si riegan los dos a la vez | «El termómetro del Ayuntamiento lleva años en 31 grados. Es un record. Tristísimo.» |
| 3 | Otoño, pendiente de firma | Hojas que no caen | «Hay 214 cartas en un cajón. Ninguna es para quien creen.» |
| 4 | El invierno inquilino | Nieve fuera de temporada | «El invierno llamó a la puerta. Con llave.» |
| 5 | La hora de las 6:10 | Todos los climas, uno cada hora | «Hoy el cielo no se decide, y el reloj se niega a ayudar.» |
| 6 | Fe de erratas | Cielo despejado… y el Funcionario deja de fichar | «Hoy no hay parte del tiempo. Es la primera vez en años que se siente raro.» |
| 7 | La estación que falta | Las cuatro, seguidas | «Esto es lo que pasa cuando dos personas por fin coinciden.» |

## Prólogo (borrador de la escena inicial, para valorar el tono)
> **[Libro I · «El Valle Atrasado»]**
> *Narrador:* «Todo valle tiene una estación favorita. Este tenía cuatro… hasta que el invierno se quedó a vivir y se negó a pagar el alquiler.»
> *Narrador:* «Desde entonces el calendario va con retraso, el reloj de la plaza marca siempre las seis y diez, y el único funcionario del Negociado de Estaciones ficha cada mañana aunque nadie le haya dicho que ya no cobra.»
> *Narrador:* «Pero esta madrugada, dos personas distintas, en dos casas distintas, a muchos kilómetros la una de la otra, han abierto un sobre sin remitente.»
> *Carta:* «Se solicita su presencia para resolver un asunto pendiente de la estación. Traigan paraguas y sentido del humor. P. D.: aquí nadie se muere; se queda.»
> *Doña Remedios:* «¡Por fin! Les esperábamos… bueno, a alguien. Pasen, que el papeleo no se firma solo. Eso sí: no toquen el reloj. Todavía.»

## Cómo se implementa (cuando se apruebe)
Datos declarativos: reescribir `src/game/story/chapters.js` (pasos y recompensas) y `scenes.js` (guion; se genera desde un fuente + `src/i18n/en-escenas.js`). Cambiar el clima por capítulo exigirá un gancho en `game/time.js` **[POR CONFIRMAR]**: hoy el clima es determinista por semilla; un clima «de trama» debería ser una condición del capítulo, no alterar la partida base.

## Implementación (v20)
- Escenas: `src/game/story/scenes.js` (+ `speakers.js`: vecinos, **El Funcionario** 🗂️ y **El Valle** 🌦️ como voces) y traducciones en `src/i18n/en-escenas.js`. Títulos/cartas/pasos en `chapters.js` (mismas condiciones y recompensas que antes: los ids de capítulo y proyectos no cambian). Mapa final: c1 fuente (primavera/llovizna) · c2 panadería (sequía) · c3 tienda/cartas (otoño) · c4 escuela (nieve) · c5 café (todos los tiempos) · c6 reloj (6:10, despejado) · c7 fiesta y **el giro** (las cuatro estaciones).
- Clima de trama: `src/game/story/plot.js` fuerza el tiempo del capítulo activo (determinista por hora; `?weather=` manda). Se fija en `tickStory`.
- **Pistas del giro sembradas:** la carta del cap. 3 «con letra sospechosamente parecida a la vuestra»; el Funcionario deja de fichar al arreglar el reloj; el parte del cap. 7 lee los «partes del tiempo» con fechas de discusiones por videollamada.
- **Pendiente [POR CONFIRMAR]:** «dos ciudades y diferencia horaria» (decidido por la persona responsable): el reloj de la torre del cap. 6 marcaría la hora de cada ciudad; requiere guardar la zona horaria de cada persona (`couple.players.<uid>.tz`, escritura propia ya permitida por las reglas) y mostrarla en la escena; no hecho aún.
- Datos de la pareja (nombres, fechas): decidido **ambiguo y universal**.
- **Efecto en la jugabilidad:** forzar `rain` (cap. 1, mañanas) o `clear` (cap. 2, «sequía») cambia el riego automático por lluvia (`rainWater`) y el crecimiento que depende del clima. Es intencionado («aquí no llueve, hay que regar»); la nieve (cap. 4) y la tormenta (cap. 5) no tienen efecto mecánico.
