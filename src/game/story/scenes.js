// Guion narrado del Libro I: escenas con retratos que guían al jugador (ver docs/historia.md, «Escenas»).
// Ids: 'prologue' · '<cap>.intro' · '<cap>.<paso>' (reacción al cumplir un paso) · '<cap>.outro' (cierre + recompensa).
// Cada página: { who: 'narrator' | id de CAST, text }. Los textos viven aquí; la lógica en director.js.
// Fichero generado a partir del guion: edita con cuidado y mantén en-escenas.js sincronizado (npm run i18n si cambia el texto).
import { t } from '../../i18n';

export const NARRATOR = 'narrator';
export const SCENES = {
  "prologue": { mood: "dawn", pages: [
    { who: "narrator", text: t("Hay valles que se duermen cuando la gente se va. Este llevaba tanto tiempo callado que hasta el viento pasaba de puntillas.") },
    { who: "narrator", text: t("Pero el buzón del Ayuntamiento seguía abierto. Y esta mañana, por primera vez en años, algo ha cruzado el valle: dos casitas con luz en la ventana, a muchos kilómetros la una de la otra.") },
    { who: "narrator", text: t("Dos personas lejanas y un mismo huerto. En este valle, eso cuenta como una señal.") },
    { who: "remedios", text: t("«¡Por fin! Llevaba tanto tiempo repasando el buzón que ya me había acostumbrado a verlo vacío. Pasad, pasad: tengo cartas para vosotros.»") },
  ] },
  "c1.intro": { mood: "dawn", pages: [
    { who: "narrator", text: t("Un sobre con sello de cera aparece en vuestro buzón. Huele a té y a papel viejo.") },
    { who: "remedios", text: t("«Queridos recién llegados: soy Remedios, alcaldesa de este valle (y también jardinera, cartera y encargada de las goteras). Os esperaba.»") },
    { who: "remedios", text: t("«La fuente de la plaza lleva años sin cantar. Plantad algo, cosechadlo y llevad vuestro primer pedido al Tablón: cuando el agua suene, el pueblo entero se asomará a la ventana.»") },
    { who: "narrator", text: t("Primero lo primero: id a saludar a Doña Remedios. Os espera en el Ayuntamiento, en la plaza.") },
  ] },
  "c1.a": { mood: "day", pages: [
    { who: "remedios", text: t("«¡Ya estáis aquí! Qué bien suena eso. Venid cuando queráis: el valle tiene mucho que enseñaros… y mucho que agradeceros.»") },
  ] },
  "c1.b": { mood: "day", pages: [
    { who: "narrator", text: t("Tres cosechas en la cesta y las manos con olor a tierra. En la plaza, muy flojito, algo gotea: la fuente está tomando aire.") },
  ] },
  "c1.c": { mood: "day", pages: [
    { who: "narrator", text: t("Vuestro primer pedido, entregado. Alguien, al otro lado de una ventana, sonríe sin saber por qué.") },
  ] },
  "c1.outro": { mood: "dusk", pages: [
    { who: "remedios", text: t("«¿Lo oís? Es la fuente. Todavía tose un poco, pero ya canta. Habéis hecho en un día lo que yo llevaba años esperando.»") },
    { who: "remedios", text: t("«Aceptad esto: unas monedas, madera y mi cariño. Y encended los farolillos de la calle: esta noche el valle se verá desde lejos.»") },
    { who: "narrator", text: t("Se enciende la primera luz del pueblo. Y, al fondo, sale humo de una chimenea: en la panadería hay alguien despierto.") },
  ] },
  "c2.intro": { mood: "dawn", pages: [
    { who: "narrator", text: t("Al día siguiente, un olor llega con la brisa: harina, canela y algo de tristeza. Viene de la panadería, que lleva meses con la chimenea fría.") },
    { who: "rosa", text: t("«Hola, vecinos. Soy Rosa. Heredé de mi abuela un horno precioso y ninguna receta. Lleva meses apagado, y no por falta de leña, sino de ganas.»") },
    { who: "rosa", text: t("«Si me traéis unas zanahorias para una masa dulce y un plato casero para estrenar el calor, prometo que habrá pan para los dos. Para vuestras dos casas, aunque estén lejos.»") },
    { who: "narrator", text: t("Rosa os espera en la panadería, junto a la plaza.") },
  ] },
  "c2.a": { mood: "day", pages: [
    { who: "rosa", text: t("«Ay, qué manos tenéis. Yo hablo con la masa cada mañana, ¿sabéis? Dice que ya os cae bien.»") },
  ] },
  "c2.b": { mood: "day", pages: [
    { who: "rosa", text: t("«Zanahorias… ¡y qué naranjas! La masa ha dado un saltito. Primera vez en meses que algo se mueve ahí dentro.»") },
  ] },
  "c2.c": { mood: "day", pages: [
    { who: "rosa", text: t("«¡Una tortilla! ¡Y en mi horno! Mi abuela estaría llorando y riendo a la vez.»") },
  ] },
  "c2.outro": { mood: "day", pages: [
    { who: "narrator", text: t("El horno cruje, huele a corteza y, por un momento, toda la plaza se queda quieta con la nariz al aire.") },
    { who: "rosa", text: t("«Pan de las dos mitades. Una para ti, otra para quien está lejos: así, por fin, la receta de mi abuela tiene sentido.»") },
    { who: "narrator", text: t("La panadería abre sus puertas. Y, al lado, desde la tienda, alguien os mira por la ventana con una caja de cartas sin entregar.") },
  ] },
  "c3.intro": { mood: "day", pages: [
    { who: "narrator", text: t("La tienda de Tomás lleva diez años ‘a punto de cerrar’. Hoy el cartel de la puerta ha cambiado: «Abierto, quizá».") },
    { who: "tomas", text: t("«Buenas. Guardo en un cajón unas cartas que nunca llegué a entregar. Larga historia, mejor con algo caliente.»") },
    { who: "tomas", text: t("«Empecemos por lo fácil: escribíos tres cartas entre vosotros, que se note que van en serio. Y vendedme algo, por favor: la caja está más triste que yo.»") },
    { who: "narrator", text: t("Escribid las cartas desde el buzón de casa, vended en el mercado… y, cuando estéis listos, coincidid los dos en la plaza.") },
  ] },
  "c3.a": { mood: "day", pages: [
    { who: "narrator", text: t("Tres cartas cruzan el valle de una casa a otra. Cada sobre pesa un poco menos que la distancia que recorre.") },
  ] },
  "c3.b": { mood: "day", pages: [
    { who: "tomas", text: t("«¡Seis ventas! La caja ha hecho un ruidito que no oía desde hace años. Creo que se llama «cling».»") },
  ] },
  "c3.c": { mood: "dusk", pages: [
    { who: "narrator", text: t("La plaza os ve llegar a los dos a la vez. Los pájaros se levantan, sorprendidos, y vuelven a posarse un poco más cerca.") },
  ] },
  "c3.outro": { mood: "dusk", pages: [
    { who: "tomas", text: t("«Reparto de cartas, pues. Esta para Marta, esta para Pablo… y esta, creo, siempre fue para vosotros.»") },
    { who: "tomas", text: t("«Gracias. Ya no estoy a punto de cerrar. Estoy, simplemente, abierto.»") },
    { who: "narrator", text: t("En la escuela, tres pares de ojos pequeños pegan la nariz al cristal.") },
  ] },
  "c4.intro": { mood: "day", pages: [
    { who: "narrator", text: t("Un compás cae al suelo, rueda hasta vuestros pies y alguien pequeño sale corriendo a buscarlo. Estáis delante de la escuela más pequeña del valle.") },
    { who: "celia", text: t("«Soy Celia, la maestra. Lola, Biel y Nuri quieren un huerto de «cosas que crecen rápido», porque tienen la paciencia de un gato en una ventana.»") },
    { who: "celia", text: t("«Enseñadles cómo se cosecha de verdad y traedles lechugas y zanahorias para sembrar. Yo prometo que no lo regarán todo con el bote de la cola.»") },
    { who: "narrator", text: t("Cosechad un poco más y llevadle las semillas a Celia.") },
  ] },
  "c4.a": { mood: "day", pages: [
    { who: "narrator", text: t("Cinco cosechas, y tres alumnos que ya quieren ser granjeros. «¡Yo cavo!», grita Biel. Nadie le ha dicho dónde.") },
  ] },
  "c4.b": { mood: "day", pages: [
    { who: "celia", text: t("«Lechugas. Lola las ha contado tres veces y aún no se lo cree. «Son verdes de verdad», dice.»") },
  ] },
  "c4.c": { mood: "day", pages: [
    { who: "celia", text: t("«Y zanahorias. Nuri ha preguntado si crecen hacia abajo. Hoy hemos aprendido muchísimo.»") },
  ] },
  "c4.outro": { mood: "day", pages: [
    { who: "celia", text: t("«Mirad: han sembrado en filas. ¡En filas! Es lo más cerca del orden que ha estado jamás esta escuela.»") },
    { who: "narrator", text: t("En el patio aparece un columpio nuevo. Los niños hacen cola, y la risa llega hasta el río.") },
    { who: "narrator", text: t("Y en la orilla, alguien lleva un lienzo bajo el brazo y mira la colina… como si le faltara un color.") },
  ] },
  "c5.intro": { mood: "dusk", pages: [
    { who: "narrator", text: t("Hay una colina que Luna pinta cada mañana. Y cada mañana le sale distinta.") },
    { who: "luna", text: t("«Hola, parejita. Hoy me he dado cuenta de que me falta un color: el de la espera. Ese que tiene la tarde cuando alguien está lejos y uno mira por la ventana por si acaso.»") },
    { who: "luna", text: t("«Para mezclarlo necesito recuerdos vuestros y un poco de río. Id a pescar con Pablo: no habla mucho, pero con una caña en la mano es un poeta.»") },
    { who: "narrator", text: t("Guardad recuerdos en el álbum, pescad en el río y dejad algo de caja con los pedidos: el Café del Puente os espera.") },
  ] },
  "c5.a": { mood: "dusk", pages: [
    { who: "luna", text: t("«Esos recuerdos… los he mirado con los ojos cerrados. Tienen el color de dos sitios que se parecen cuando se quieren.»") },
  ] },
  "c5.b": { mood: "day", pages: [
    { who: "pablo", text: t("«Cuatro peces. No digo nada. (Digo que estoy contento. Pero no se lo repitáis al río.)»") },
  ] },
  "c5.c": { mood: "day", pages: [
    { who: "narrator", text: t("Dos pedidos más en la caja del café. Desde la puerta, alguien ya ha colgado un cartel de «Próximamente».") },
  ] },
  "c5.outro": { mood: "dusk", pages: [
    { who: "luna", text: t("«Ya está. El color de la espera es un naranja con un poquito de azul: lo que queda cuando el sol se va y no sabes si es despedida o hasta luego.»") },
    { who: "narrator", text: t("El Café del Puente enciende sus luces por primera vez en años. Huele a café, a pintura fresca y a conversaciones que se retoman.") },
    { who: "narrator", text: t("En lo alto, junto a la plaza, la torre del reloj hace un ruidito. Tic… y se calla.") },
  ] },
  "c6.intro": { mood: "dawn", pages: [
    { who: "narrator", text: t("La torre del reloj tiene las manecillas paradas en las seis y diez. Lleva así tanto tiempo que los pájaros la usan de mirador.") },
    { who: "inigo", text: t("«Estimados vecinos: yo rompí el reloj. O eso llevo creyendo desde aquel invierno: perdí el muelle, el corazón de la maquinaria. Tic, tac… ya no sé ni dónde.»") },
    { who: "inigo", text: t("«Necesito latón y aceite fino (los pedidos del Tablón traen de todo) y que averigüen qué fue de ese muelle. Pregunten a quien tenga la costumbre de guardar cosas.»") },
    { who: "narrator", text: t("Entregad pedidos, ganaos la confianza de Tomás… y, cuando aparezca el muelle, estad los dos en la torre.") },
  ] },
  "c6.a": { mood: "day", pages: [
    { who: "inigo", text: t("«Latón. Aceite. Tic, tac… Casi puedo oírlo. Casi.»") },
  ] },
  "c6.b": { mood: "day", pages: [
    { who: "tomas", text: t("«¿Un muelle? Sí… en el cajón de las cosas que nunca tiré. Lo guardaba por si alguien todavía lo esperaba.»") },
  ] },
  "c6.c": { mood: "dusk", pages: [
    { who: "narrator", text: t("Los dos, a la vez, bajo la torre. El muelle encaja con un clic suave, como un corazón que recuerda su sitio.") },
  ] },
  "c6.outro": { mood: "dusk", pages: [
    { who: "inigo", text: t("«Tic. Tac. Tic… ¡tac! ¿Lo oyen? Late. Por fin late.»") },
    { who: "narrator", text: t("Las manecillas se estremecen y empiezan a moverse. Despacio, como quien despierta de una siesta de años.") },
    { who: "narrator", text: t("En el Ayuntamiento se enciende una luz. Doña Remedios os llama: ha llegado la hora de las cartas.") },
  ] },
  "c7.intro": { mood: "dusk", pages: [
    { who: "narrator", text: t("Esta tarde el cielo va a ponerse del color de la mermelada. Hay farolillos colgados de punta a punta de la plaza.") },
    { who: "remedios", text: t("«Queridos míos: quiero veros a los dos en la plaza a la vez, aunque cada uno la vea desde su pantalla y su ventana.»") },
    { who: "remedios", text: t("«Primero, terminar la torre con las cinco piezas. Luego, preparar la fiesta. Y al atardecer, darle cuerda al reloj entre los dos. Os debo una confesión y una carta, y las dos se leerán en voz alta.»") },
  ] },
  "c7.a": { mood: "day", pages: [
    { who: "inigo", text: t("«Las cinco piezas. Tic, tac, tic, tac. Nunca volverá a quedarse callado.»") },
  ] },
  "c7.b": { mood: "day", pages: [
    { who: "rosa", text: t("«¡Pan para todo el valle! Tomás pone los vasos, Marta los huevos y Pablo ha prometido no hablar de pesca. Ya veremos.»") },
  ] },
  "c7.c": { mood: "dusk", pages: [
    { who: "narrator", text: t("El cielo se vuelve mermelada. En la plaza se encienden los farolillos, uno a uno.") },
  ] },
  "c7.outro": { mood: "dusk", pages: [
    { who: "remedios", text: t("«Os debía una confesión: durante años escribí cada atardecer una carta a alguien lejano. Nunca la envié. Estaba… practicando.»") },
    { who: "remedios", text: t("«Hoy la leo en voz alta: «Querida distancia: no pudiste con nosotros. Con cariño, el valle.»»") },
    { who: "narrator", text: t("El reloj da la hora. Los farolillos suben al cielo y toda la gente del valle se vuelve hacia vosotros.") },
    { who: "narrator", text: t("Dos personas lejanas, un mismo huerto, un valle despierto. Fin del Libro I… y quizá el principio de otro.") },
  ] },
};
