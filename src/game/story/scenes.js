// Guion narrado del Libro I («El Valle Atrasado», ver docs/historia-v2.md): escenas con retratos que guían al jugador.
// Ids: 'prologue' · '<cap>.intro' · '<cap>.<paso>' (reacción al cumplir un paso) · '<cap>.outro' (cierre + recompensa).
// Cada página: { who: 'narrator' | id de ui speakers.js, text }. La lógica vive en director.js.
// Fichero generado a partir del guion: mantén en-escenas.js sincronizado con los textos.
import { t } from '../../i18n';

export const NARRATOR = 'narrator';
export const SCENES = {
  "prologue": { mood: "dawn", pages: [
    { who: "narrator", text: t("Todo valle tiene una estación favorita. Este tenía cuatro… hasta que el invierno se quedó a vivir y se negó a pagar el alquiler.") },
    { who: "narrator", text: t("Desde entonces el calendario va con retraso, el reloj de la plaza marca siempre las seis y diez, y el único funcionario del Negociado de Estaciones ficha cada mañana, aunque nadie le ha dicho que ya no cobra.") },
    { who: "narrator", text: t("Pero esta madrugada, dos personas distintas, en dos casas distintas, a muchos kilómetros y a varias horas de diferencia, han abierto el mismo sobre sin remitente.") },
    { who: "valle", text: t("«Se solicita su presencia para resolver un asunto pendiente de la estación. Traigan paraguas y sentido del humor. P. D.: aquí nadie se muere; se queda.»") },
    { who: "remedios", text: t("«¡Por fin! Les esperábamos… bueno, a alguien. Pasen, que el papeleo no se firma solo. Eso sí: no toquen el reloj. Todavía.»") },
  ] },
  "c1.intro": { mood: "dawn", pages: [
    { who: "narrator", text: t("¿Quién deja una carta sin remitente… y con sello de lluvia? Esa es la primera pregunta del día. La segunda es por qué llueve solo a medias.") },
    { who: "remedios", text: t("«Soy Remedios, alcaldesa, cartera y encargada de las goteras. Aquí llueve a trozos desde hace años: la primavera empieza, se arrepiente y se vuelve a casa.»") },
    { who: "remedios", text: t("«Para que arranque necesito pruebas de que van en serio: plantar, cosechar y entregar un pedido. El Negociado de Estaciones exige papeleo hasta para florecer.»") },
    { who: "narrator", text: t("Presentaos a Doña Remedios en el Ayuntamiento. Y, por si acaso, no toquéis nada que haga tic.") },
  ] },
  "c1.a": { mood: "day", pages: [
    { who: "remedios", text: t("«Perfecto: ya constan en acta. Les he puesto de “forasteros en prácticas”. Es un cargo sin sueldo, pero con muy buenas vistas.»") },
  ] },
  "c1.b": { mood: "day", pages: [
    { who: "narrator", text: t("Tres cosechas. La tierra del valle ha dado un pequeño suspiro, como quien cumple un trámite que llevaba años archivado.") },
  ] },
  "c1.c": { mood: "day", pages: [
    { who: "funcionario", text: t("«Pedido recibido y registrado, formulario 27-B. Procedimiento de primavera… en trámite. Disculpen la tardanza: llevamos un retraso de, calculo, once años.»") },
  ] },
  "c1.outro": { mood: "dusk", pages: [
    { who: "remedios", text: t("«¿Lo oyen? Es la fuente. Tose un poco, pero canta. Ha llovido donde tenía que llover. Una primera vez, siempre es una primera vez.»") },
    { who: "funcionario", text: t("«Nota para el expediente: se ha detectado un cielo despejado de forma no autorizada. Procedo a presentar una queja… contra mí mismo.»") },
    { who: "narrator", text: t("Se encienden los farolillos. A lo lejos sale humo de una chimenea: en la panadería alguien lleva meses sin encender el horno y, esta noche, por lo visto, lo ha pensado.") },
  ] },
  "c2.intro": { mood: "day", pages: [
    { who: "narrator", text: t("El termómetro del Ayuntamiento lleva años marcando 31 grados. Es un récord. Es un récord tristísimo.") },
    { who: "rosa", text: t("«Hola. Soy Rosa. Mi horno solo hornea lo que ya se ha comido: pan de ayer, galletas de la semana pasada, recuerdos con corteza. Me falta una receta que no sea nostalgia.»") },
    { who: "rosa", text: t("«Si me traen zanahorias para una masa dulce y un plato casero para estrenar el calor, habrá pan de hoy. Dicen que el pan de hoy es el único que sabe a futuro.»") },
    { who: "narrator", text: t("Conoced a Rosa en la panadería. Aquí no llueve: tendréis que regar vosotros.") },
  ] },
  "c2.a": { mood: "day", pages: [
    { who: "rosa", text: t("«Qué manos. Hablo con la masa cada mañana, ¿saben? Dice que no se fía de nadie con prisa. A ustedes los acepta.»") },
  ] },
  "c2.b": { mood: "day", pages: [
    { who: "rosa", text: t("«Zanahorias frescas, naranjas, de este año. Me tiembla el delantal. Hace mucho que nada me sabía a ahora mismo.»") },
  ] },
  "c2.c": { mood: "day", pages: [
    { who: "narrator", text: t("Una tortilla recién hecha entra en un horno que llevaba meses frío. Por un momento, el calor del valle se parece a un abrazo y no a una amenaza.") },
  ] },
  "c2.outro": { mood: "day", pages: [
    { who: "rosa", text: t("«Pan de las dos mitades: una para quien lo hornea y otra para quien lo echa de menos. Mi abuela me lo explicó con la boca llena. Yo lo he entendido hoy.»") },
    { who: "funcionario", text: t("«Observo con inquietud que el valle ha pasado de 31 a 29 grados. Es una variación no prevista en el presupuesto.»") },
    { who: "narrator", text: t("El calor afloja un poco. En la tienda de al lado, alguien mira por la ventana con una caja de cartas, preguntándose si alguna vez se entregan.") },
  ] },
  "c3.intro": { mood: "dusk", pages: [
    { who: "narrator", text: t("Hay 214 cartas en un cajón de la tienda. Ninguna es para quien creéis.") },
    { who: "tomas", text: t("«Buenas. Tomás. Llevo diez años a punto de cerrar y trescientos días a punto de entregar estas cartas. Son de gente que ya no está… y de alguien que sí. Larga historia; mejor con algo caliente.»") },
    { who: "tomas", text: t("«Escríbanse tres cartas entre ustedes, que me dé pie. Véndanme algo, que la caja está más triste que yo. Y luego coincidan en la plaza los dos, que las cartas se reparten mejor a coro.»") },
    { who: "narrator", text: t("Aquí las hojas no caen: esperan a que alguien las despida. Escribid, vended y encontraos en la plaza.") },
  ] },
  "c3.a": { mood: "dusk", pages: [
    { who: "narrator", text: t("Tres cartas cruzan el valle de una casa a otra. Cada sobre pesa un poco menos que la distancia que recorre; aun así, a veces llegan a deshora.") },
  ] },
  "c3.b": { mood: "dusk", pages: [
    { who: "tomas", text: t("«¡Seis ventas! La caja ha hecho un ruido que no oía desde 2014. Creo que se llama “cling”. Lo guardaré para cuando me muera, que aquí tampoco es tan grave.»") },
  ] },
  "c3.c": { mood: "dusk", pages: [
    { who: "narrator", text: t("La plaza os ve llegar, a los dos, a la vez. Las hojas, por fin, empiezan a caer: no por el viento, sino por si acaso.") },
  ] },
  "c3.outro": { mood: "dusk", pages: [
    { who: "tomas", text: t("«Reparto de cartas, pues. Esta para Marta; esta para Pablo, que no la leerá hasta el río; esta para Íñigo… y esta, creo, siempre fue para ustedes.»") },
    { who: "valle", text: t("«Queridos forasteros: gracias por venir. Perdonen el retraso del otoño. Firmado: el Valle (en funciones de ustedes).»") },
    { who: "narrator", text: t("La carta no tiene sello ni remitente humano. Pero la letra se parece sospechosamente a la vuestra. En la escuela, tres pares de ojos pequeños dicen: «qué raro».") },
  ] },
  "c4.intro": { mood: "dawn", pages: [
    { who: "narrator", text: t("El invierno llamó a la puerta del valle hace años. Con llave. Y se quedó.") },
    { who: "celia", text: t("«Soy Celia, maestra de la escuela más pequeña del valle: Lola, Biel, Nuri y un invierno que no se va. Quieren un huerto de “cosas que crecen rápido”. Con nieve. Les expliqué que no se puede. Les pareció una falta de ambición.»") },
    { who: "celia", text: t("«Enséñenles cómo se cosecha de verdad y tráiganles lechugas y zanahorias para sembrar bajo plástico. Que no lo rieguen con el bote de la cola, por favor.»") },
    { who: "narrator", text: t("Cosechad más y llevad a Celia las lechugas y las zanahorias. La nieve no es un villano: solo espera que alguien la reclame.") },
  ] },
  "c4.a": { mood: "day", pages: [
    { who: "narrator", text: t("Cinco cosechas con la nariz roja. Biel declara que va a cavar. Nadie le dice dónde, y esa es la mejor noticia del trimestre.") },
  ] },
  "c4.b": { mood: "day", pages: [
    { who: "celia", text: t("«Lechugas. Lola las ha contado tres veces y sigue sin creerlo. “Son verdes de verdad”, dice. Hay generaciones enteras que no las vieron en invierno.»") },
  ] },
  "c4.c": { mood: "day", pages: [
    { who: "celia", text: t("«Y zanahorias. Nuri pregunta si crecen hacia abajo. Respuesta: sí. Segunda pregunta: ¿por qué? Respuesta: la vida es así. Ha habido un silencio filosófico.»") },
  ] },
  "c4.outro": { mood: "day", pages: [
    { who: "celia", text: t("«Han sembrado en filas. ¡En filas! Es lo más cerca del orden que ha estado esta escuela desde su fundación, y la fundó un reloj parado.»") },
    { who: "funcionario", text: t("«Detecto un invierno con temperaturas superiores a cero. Procedo a derivarlo a “Asuntos Imprevistos”. Por cierto: ¿alguien sabe qué día es?»") },
    { who: "narrator", text: t("En el patio aparece un columpio nuevo y la nieve, por primera vez, no se queda quieta: baja a ratos, como si tuviera sitio al que ir.") },
  ] },
  "c5.intro": { mood: "dusk", pages: [
    { who: "narrator", text: t("Hoy el cielo no se decide. Llueve, nieva, brilla y vuelve a llover en menos tiempo del que tardáis en abrir el paraguas.") },
    { who: "luna", text: t("«Hola, parejita. Me falta un color: el de todos los tiempos juntos. El que tiene la tarde cuando alguien está lejos y uno mira por la ventana por si acaso. He pintado esa colina veintidós veces; siempre sale distinta.»") },
    { who: "luna", text: t("«Para mezclarlo necesito recuerdos de ustedes y un poco de río. Vayan a pescar con Pablo: no habla, pero con una caña en la mano es un poeta con barba.»") },
    { who: "narrator", text: t("Guardad recuerdos en el álbum, pescad en el río y dejad algo de caja con pedidos: el Café del Puente espera a su primer cliente (y a su primer fantasma, que ya tiene mesa reservada).") },
  ] },
  "c5.a": { mood: "dusk", pages: [
    { who: "luna", text: t("«Esos recuerdos… los miré con los ojos cerrados. Tienen el color de dos sitios que se parecen cuando se quieren. Y de una discusión por la cobertura.»") },
  ] },
  "c5.b": { mood: "day", pages: [
    { who: "pablo", text: t("«Cuatro peces. No digo nada. (Digo que estoy contento. No se lo repitan al río, que se le sube.)»") },
  ] },
  "c5.c": { mood: "day", pages: [
    { who: "narrator", text: t("Dos pedidos más en la caja del café. Desde la puerta, alguien ya ha colgado un cartel de «Próximamente», que en este valle suele significar «algún día de este siglo».") },
  ] },
  "c5.outro": { mood: "dusk", pages: [
    { who: "luna", text: t("«Ya está. El color de todos los tiempos es un naranja con un poco de azul: lo que queda cuando el sol se va y no sabes si es despedida o hasta luego. Hoy lo he pintado y, por primera vez, no he tenido que repetirlo.»") },
    { who: "narrator", text: t("El Café del Puente enciende sus luces. Huele a café, a pintura fresca y a conversaciones que se retoman. Y alguien invisible pide un cortado.") },
    { who: "narrator", text: t("Arriba, en la torre, el reloj hace tic. Y se calla. Son las seis y diez.") },
  ] },
  "c6.intro": { mood: "dawn", pages: [
    { who: "narrator", text: t("Hoy el cielo está despejado y el valle no lo soporta. Todo el mundo habla bajito, como si el sol fuera una visita con prisa.") },
    { who: "inigo", text: t("«Estimados forasteros: yo rompí el reloj. O eso llevo creyendo desde las seis y diez de aquel día en que perdí el muelle, el corazón de la maquinaria. Tic, tac… ya no sé ni dónde.»") },
    { who: "inigo", text: t("«Necesito latón y aceite fino (los pedidos del Tablón traen de todo) y que averigüen qué fue de ese muelle. Pregunten a quien tenga la costumbre de guardar cosas. Y vengan los dos a la torre a la vez: el reloj es más sensible a las parejas que a mí.»") },
    { who: "narrator", text: t("Entregad pedidos, ganad la confianza de Tomás y, cuando aparezca el muelle, estad los dos en la torre.") },
  ] },
  "c6.a": { mood: "day", pages: [
    { who: "inigo", text: t("«Latón. Aceite. Tic, tac… Casi puedo oírlo. Casi. Hoy el valle me parece menos de mentira, y eso me preocupa.»") },
  ] },
  "c6.b": { mood: "day", pages: [
    { who: "tomas", text: t("«¿Un muelle? Sí… en el cajón de las cosas que nunca tiré. Lo guardaba por si alguien todavía lo esperaba. Qué cosas: llevo años esperándome a mí mismo.»") },
  ] },
  "c6.c": { mood: "dusk", pages: [
    { who: "narrator", text: t("Los dos, a la vez, bajo la torre. El muelle encaja con un clic suave, como un corazón recordando su sitio. En algún lugar, un funcionario deja de fichar.") },
  ] },
  "c6.outro": { mood: "dusk", pages: [
    { who: "inigo", text: t("«Tic. Tac. Tic… ¡tac! ¿Lo oyen? Late. Por fin late. Y no marca las seis y diez: marca la hora que hay donde ustedes están, las dos a la vez.»") },
    { who: "funcionario", text: t("«Hoy no he fichado. Es la primera vez en… ¿cuánto? Me han dicho que ya no cobro. Pensaba que era un chiste. Ahora que lo pienso, todos los vecinos se ríen en el mismo sitio.»") },
    { who: "narrator", text: t("Las manecillas se estremecen y se ponen en marcha. En el Ayuntamiento se enciende una luz: Doña Remedios os llama. Hay una carta que debe leerse en voz alta.") },
  ] },
  "c7.intro": { mood: "dusk", pages: [
    { who: "narrator", text: t("Esto es lo que pasa cuando dos personas, por fin, coinciden.") },
    { who: "remedios", text: t("«Queridos míos: terminen la torre con las cinco piezas, preparen la fiesta con unos pedidos y, al atardecer, quiero verlos a los dos en la plaza, a la vez, aunque cada uno la vea desde su pantalla y su ventana.»") },
    { who: "remedios", text: t("«Os debo una confesión y el Funcionario os debe un expediente. Las dos cosas se leerán en voz alta. Traigan paraguas. Y, si pueden, un pañuelo.»") },
    { who: "narrator", text: t("Terminad la reparación de la torre, preparad la fiesta y estad los dos en la plaza al atardecer.") },
  ] },
  "c7.a": { mood: "day", pages: [
    { who: "inigo", text: t("«Las cinco piezas. Tic, tac, tic, tac. Nunca volverá a callarse. He pasado de temerle al silencio a temerle al ruido. Es progreso.»") },
  ] },
  "c7.b": { mood: "day", pages: [
    { who: "rosa", text: t("«¡Pan para todo el valle! Tomás pone los vasos, Marta los huevos y Pablo ha prometido no hablar de pesca. Veremos cuánto dura la promesa.»") },
  ] },
  "c7.c": { mood: "dusk", pages: [
    { who: "narrator", text: t("El cielo se vuelve mermelada. En la plaza se encienden los farolillos, uno a uno. Es el día más largo de un valle que no tenía días.") },
  ] },
  "c7.outro": { mood: "dusk", pages: [
    { who: "funcionario", text: t("«Expediente del Valle. Fecha de apertura: la primera vez que ustedes discutieron por videollamada. Primer parte del tiempo: tormenta. Segundo: niebla. Tercero: sol…»") },
    { who: "funcionario", text: t("«Cada parte meteorológico corresponde a un día de ustedes. Lo he leído de arriba abajo cuatro veces. El clima del valle nunca fue del valle: era de ustedes. Cada tormenta fue una discusión; cada sol, una buena noche.»") },
    { who: "remedios", text: t("«Yo solo soy la que escribe las cartas. Ustedes eran el tiempo, y el valle, el sitio donde guardarlo. Tantos kilómetros… y aun así llueve igual en los dos lados.»") },
    { who: "valle", text: t("«Queridos forasteros: no había nada que arreglar. Solo hacía falta que coincidieran. Con cariño, el Valle (en funciones de ustedes).»") },
    { who: "narrator", text: t("El cielo se despeja de golpe. El sol sale por el este, por el oeste y por las dos pantallas a la vez. Cuatro estaciones, una detrás de otra, en un minuto.") },
    { who: "narrator", text: t("Dos personas lejanas, un mismo huerto, un valle que por fin lleva la hora justa. Fin del Libro I… y quizá el principio de otro.") },
  ] },
};
