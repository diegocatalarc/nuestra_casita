// Charla de los vecinos del Valle: líneas según hora, clima, estación, capítulo y amistad (docs/historia.md).
// lineFor(npcId, ctx) es DETERMINISTA: misma ctx → misma línea (semilla = vecino + día UTC + tramo horario + ctx.n).
//   ctx = { hour (0-23), weather ('clear'|'rain'|'snow'|'fog'), season (0-3), chapter (1-8; 8 = Libro I completo),
//           friendLevel (0-5), day ('YYYY-MM-DD' UTC; si falta se usa hoy), partner (nombre de la pareja), n (nº de charla, opcional) }
// Etiquetas de cada línea: h tramo ('m' mañana 5-12 · 'a' tarde 12-18 · 'e' atardecer 18-22 · 'n' noche) · w clima · s estación
// · c [min,max] de capítulo · f amistad mínima · p necesita el nombre de la pareja ({0} = nombre de la pareja).
import { t } from '../../i18n';
import { hashStr, mulberry32 } from '../rng';

const L = (text, tags = {}) => ({ text, ...tags });

const LINES = {
  remedios: [
    L(t("«Pasad cuando queráis. El Ayuntamiento tiene la puerta abierta y el bote de las galletas, medio vacío.»")),
    L(t("«Este valle tiene memoria, ¿sabéis? Se acuerda de todo el que alguna vez ha querido bien a alguien.»")),
    L(t("«Cada mañana repaso el buzón, por si acaso. El ‘por si acaso’ es el motor de un pueblo.»"), { h: 'm' }),
    L(t("«A estas horas el sol entra por el ventanal y la mesa de la alcaldía parece un campo de trigo.»"), { h: 'a' }),
    L(t("«¿Notáis cómo la plaza espera el atardecer? Antes, a esta hora, se encendían los farolillos.»"), { h: 'e' }),
    L(t("«¿Aún despiertos? Los desvelos son cartas que el cuerpo escribe cuando no encuentra el papel.»"), { h: 'n' }),
    L(t("«Con lluvia el Ayuntamiento huele a papel mojado y a té. Mi combinación favorita.»"), { w: 'rain' }),
    L(t("«Nieve en la plaza. Entrad, que hay estufa y paciencia de sobra.»"), { w: 'snow' }),
    L(t("«La primavera llega al valle como las buenas noticias: sin avisar y por todas partes a la vez.»"), { s: 0 }),
    L(t("«El otoño es la estación de las cartas largas: hojas por todas partes y nadie con prisa.»"), { s: 2 }),
    L(t("«Plantad, cosechad, entregad un pedido… y la fuente cantará. Yo ya la oigo un poquito desde aquí.»"), { c: [1, 1] }),
    L(t("«Rosa ha encendido el horno y Tomás ha abierto la tienda. Ya solo falta que alguien me diga que no tengo nada que hacer.»"), { c: [3, 4] }),
    L(t("«Íñigo no duerme, pero esta vez es de ilusión. Cada pieza que traéis le devuelve media hora de sueño.»"), { c: [5, 6] }),
    L(t("«Cuando el reloj marque la hora, quiero veros a los dos en la plaza. A los dos, a la vez, aunque sea cada uno desde su lado.»"), { c: [7, 7] }),
    L(t("«¡Qué tardes tiene ahora el valle! Y todo empezó con dos desconocidos y un huerto.»"), { c: [8, 9] }),
    L(t("«{0} y tú sois la mejor noticia que ha llegado al valle en años. Y mira que ha habido buenas cosechas.»"), { f: 3, p: true }),
    L(t("«Un día os contaré a quién escribía yo cada tarde. De momento, sabed que conozco muy bien lo que es esperar una respuesta.»"), { f: 4, c: [1, 6] }),
  ],
  marta: [
    L(t("«Sentaos un rato, que el huerto no se va a escapar. Las malas hierbas sí, pero esas corren por gusto.»")),
    L(t("«A primera hora la tierra huele a promesa. Lo aprendí con Anselmo, que se levantaba antes que el gallo.»"), { h: 'm' }),
    L(t("«A estas horas me da por cocinar para dos. Todavía me sale de más… pero siempre hay quien lo agradece.»"), { h: 'a' }),
    L(t("«Cuando cae la tarde pongo una vela en la ventana. Dicen que sirve para que quien está lejos sepa dónde volver.»"), { h: 'e' }),
    L(t("«De noche el huerto duerme y yo hago cuentas de qué sembrar mañana. No es insomnio, es planificar.»"), { h: 'n' }),
    L(t("«Llueve… las lechugas lo agradecen y mis rodillas lo anuncian.»"), { w: 'rain' }),
    L(t("«Con nieve el huerto descansa. Descansad vosotros también, que las prisas no cuecen sopas.»"), { w: 'snow' }),
    L(t("«En primavera todo brota a la vez. Me recuerda a vosotros: dos sitios, un mismo brote.»"), { s: 0 }),
    L(t("«Verano: tomates como puños y melones que no perdonan. Regad temprano, que a mediodía hasta las moscas se rinden.»"), { s: 1 }),
    L(t("«En otoño huele a calabaza asada hasta en el buzón. Os guardaré un trozo.»"), { s: 2 }),
    L(t("«¿Vosotros sois los de la casita? Se nota que alguien cuida de esas lechugas con las dos manos… y con cuatro.»"), { c: [1, 2] }),
    L(t("«He oído que Rosa ha encendido el horno por fin. ¡Ya era hora! Le llevaré mis huevos para la primera hornada.»"), { c: [3, 4] }),
    L(t("«Íñigo dice que el reloj volverá a andar. Yo ya me he sacado el jersey bueno para la fiesta.»"), { c: [5, 7] }),
    L(t("«Anselmo habría adorado este valle despierto. Yo lo miro por los dos, y algo de eso es compañía.»"), { f: 2 }),
    L(t("«{0} me dijo que echa de menos tus risas. Se lo he contado al huerto, por si le sale una flor.»"), { f: 3, p: true }),
    L(t("«Cuando alguien pregunte por el huerto de Marta, que digan: lo cuidaban dos que vivían lejos, pero lo cuidaban juntos.»"), { f: 4 }),
  ],
  pablo: [
    L(t("«No digo mucho, pero me alegra verte. Esto, a mi manera, es un discurso.»")),
    L(t("«Al amanecer el río suena a cuenco de agua. Es cuando mejor pica.»"), { h: 'm' }),
    L(t("«A mediodía los peces se esconden. Como los vecinos cuando hay que pintar la valla.»"), { h: 'a' }),
    L(t("«De tarde el río se pone de oro. Es el único momento en que dejo de mirar el corcho.»"), { h: 'e' }),
    L(t("«De noche pesco poco y pienso mucho. Sobre todo en el koi.»"), { h: 'n' }),
    L(t("«Con lluvia el agua se llena de agujeritos y los peces creen que el cielo les habla.»"), { w: 'rain' }),
    L(t("«Nieva, el río humea y yo con la manta. Quien dijo que pescar es cosa de verano no ha probado esto.»"), { w: 'snow' }),
    L(t("«Hay una bruma buena para pescar y mala para volver. Siempre vuelvo guiándome por el olor del pan de Rosa.»"), { w: 'fog' }),
    L(t("«El verano es de carpas perezosas. Comprendedlas: yo tampoco me muevo con este calor.»"), { s: 1 }),
    L(t("«En invierno el río se vuelve más hondo y los peces más listos. Yo, con suerte, igual.»"), { s: 3 }),
    L(t("«¿Vosotros sois los de la casita? El río ya os había visto. Habla de vosotros cada mañana.»"), { c: [1, 2] }),
    L(t("«Luna me ha pedido que os enseñe el río. Os enseño los sitios buenos. Los buenos, buenos, no se los enseño a nadie… pero a vosotros sí.»"), { c: [5, 5] }),
    L(t("«Una vez le escribí una carta a un pez. No me contestó, pero el río me dio una respuesta distinta cada día.»"), { f: 2 }),
    L(t("«{0} y tú sois buena gente para pescar: calladitos y juntos. Es lo más difícil del mundo.»"), { f: 3, p: true }),
    L(t("«Hay una promesa que le hice al río hace años. Cuando la cumpla, os invito a mirar.»"), { f: 4 }),
  ],
  luna: [
    L(t("«Pasad cuando queráis. Si estoy pintando, ni me veréis: seguid hablando, que la pintura escucha.»")),
    L(t("«Por la mañana la luz es tímida y pinta todo en tonos de leche. Es mi hora de mirar, no de pintar.»"), { h: 'm' }),
    L(t("«A mediodía la luz es tan fuerte que no deja secretos. Yo prefiero las medias tintas.»"), { h: 'a' }),
    L(t("«Mirad el cielo: ese rosa pide que alguien lo eche de menos. Seguro que a vosotros os suena.»"), { h: 'e' }),
    L(t("«De noche pinto con los ojos casi cerrados. Sale raro, pero sincero.»"), { h: 'n' }),
    L(t("«La lluvia es un pincel enorme que pinta toda la ciudad de gris plata. Qué envidia.»"), { w: 'rain' }),
    L(t("«La nieve borra las líneas de todo. Es como un lienzo que alguien ha preparado para vosotros.»"), { w: 'snow' }),
    L(t("«La niebla es un color que se mueve. Llevo toda la mañana intentando atraparlo.»"), { w: 'fog' }),
    L(t("«En primavera el verde no es uno, son quince. Mi paleta llora.»"), { s: 0 }),
    L(t("«El otoño es trampa: todo ocre, todo oro, todo ‘ya me voy’. Y aun así, qué ganas de quedarse.»"), { s: 2 }),
    L(t("«¿Os pasa que el color de las cosas cambia cuando alguien no está? A mí me pasa con la colina.»"), { c: [1, 4] }),
    L(t("«El color de la espera… creo que se parece al de una carta aún sin abrir. Casi lo tengo.»"), { c: [5, 5] }),
    L(t("«El Café del Puente huele a pintura fresca y a café. No sé qué es más peligroso para mis dedos.»"), { c: [6, 8] }),
    L(t("«{0} y tú aparecéis juntos en mis cuadros aunque no esté pintando a nadie. Es raro y bonito.»"), { f: 3, p: true }),
  ],
  rosa: [
    L(t("«Pasad, pasad, que el pan no espera… bueno, sí espera, pero se enfría y se pone dramático.»")),
    L(t("«Me levanto a las cuatro, hablo con la masa y le doy los buenos días. Responde a su manera: creciendo.»"), { h: 'm' }),
    L(t("«A media tarde huele a corteza tostada hasta en la plaza. Es la única publicidad que hago.»"), { h: 'a' }),
    L(t("«A esta hora el horno ya está tibio y yo también. Si traéis hambre, hay migas gratis.»"), { h: 'e' }),
    L(t("«Con lluvia la gente quiere pan caliente y yo, quedarme en casa. Siempre gana el pan.»"), { w: 'rain' }),
    L(t("«Nieva afuera, pero dentro del horno es julio. Entrad, que se está de maravilla.»"), { w: 'snow' }),
    L(t("«En primavera la masa se levanta sola. Tiene más ganas de vivir que yo antes de las siete.»"), { s: 0 }),
    L(t("«El invierno es mi mejor temporada: el que entra en la panadería, ya no se quiere ir.»"), { s: 3 }),
    L(t("«Heredé este horno y no la receta de mi abuela. Es como heredar un violín sin saber la canción.»"), { c: [1, 2] }),
    L(t("«¡El horno funciona! Se lo debo a unas zanahorias y a dos desconocidos. Qué cosa más buena es el azar.»"), { c: [3, 4] }),
    L(t("«¿Ya habéis visto la fila en la panadería? Sois responsables, aunque os hagáis los distraídos.»"), { c: [5, 8] }),
    L(t("«Mi abuela decía que el pan se parte en dos: una mitad para ti, otra para quien no está. Estoy dándole vueltas.»"), { f: 2 }),
    L(t("«{0} me dijo que a veces os coméis el mismo pan a la misma hora, cada uno en su casa. ¡Eso es cocinar a distancia!»"), { f: 3, p: true }),
    L(t("«La receta de las dos mitades ya sale casi sola. Falta el pellizco final, y creo que ya sé de dónde viene.»"), { f: 4 }),
  ],
  inigo: [
    L(t("«Tic, tac… perdón, vicio. Los relojeros llevamos el ritmo puesto aunque no haya reloj.»")),
    L(t("«A estas horas la torre sabe a polvo y a madera. Me gusta: es el olor de lo que todavía no se ha ido.»"), { h: 'm' }),
    L(t("«Dicen que el tiempo cura. Yo digo que el tiempo, sin cuerda, solo espera.»"), { h: 'a' }),
    L(t("«A esta hora, antaño, sonaba la campana. Hoy me conformo con mirar la esfera y fingir que la oigo.»"), { h: 'e' }),
    L(t("«De noche limpio engranajes. No sirven para nada hoy, pero así no se me olvidan los dedos.»"), { h: 'n' }),
    L(t("«Con lluvia todas las goteras de la torre tocan una canción. Desafinada, pero canción.»"), { w: 'rain' }),
    L(t("«El frío contrae el metal y alarga la espera. Aun así, esta torre aguanta como un viejo bien abrigado.»"), { w: 'snow' }),
    L(t("«La esfera del reloj parada, las nubes paradas… hoy el valle parece una fotografía.»"), { w: 'fog' }),
    L(t("«¿Ustedes saben qué es lo más difícil de un reloj? Que nadie lo mira hasta que falla.»"), { c: [1, 2] }),
    L(t("«Las piezas que me traen… no quiero hacerme ilusiones, pero me tiemblan las manos y no es por la edad.»"), { c: [3, 5] }),
    L(t("«Falta el muelle. Sin él, todo lo demás es bonito, pero decoración.»"), { c: [6, 6] }),
    L(t("«El reloj anda. No me lo creo: me paso el día mirándolo por si se arrepiente.»"), { c: [7, 8] }),
    L(t("«A veces pienso que fui yo. Que, de alguna forma, dejé de darle cuerda al valle.»"), { f: 2, c: [1, 6] }),
    L(t("«{0} y tú os dais cuerda el uno al otro a distancia. No hay mecanismo más fino, se lo digo yo.»"), { f: 3, p: true }),
  ],
  celia: [
    L(t("«¡Pasad! Si veis un compás en el suelo, es mío: lo dejo caer para que los niños lo recojan y se sientan útiles.»")),
    L(t("«Por la mañana la escuela huele a tiza y a pan de Rosa. Es la mejor clase de matemáticas: repartir una barra entre tres.»"), { h: 'm' }),
    L(t("«A media tarde Lola dibuja, Biel pregunta ‘¿por qué?’ y Nuri mira por la ventana. Se me da bien mi trabajo.»"), { h: 'a' }),
    L(t("«Cuando se van los niños, la escuela se queda tan callada que se oye el eco de los dibujos.»"), { h: 'e' }),
    L(t("«Con lluvia hay recreo de charcos. Es obligatorio, lo he puesto en el reglamento.»"), { w: 'rain' }),
    L(t("«Hoy nieva y los niños no escuchan nada de nada. Normal: la nieve es la mejor profesora de ciencias.»"), { w: 'snow' }),
    L(t("«Primavera: las semillas, las moscas, los pájaros… y mis alumnos, que florecen por todas partes menos en el cuaderno.»"), { s: 0 }),
    L(t("«El verano es una asignatura optativa: nadie quiere estudiarlo y todos lo aprueban.»"), { s: 1 }),
    L(t("«Mis tres alumnos quieren plantar ‘cosas que crecen rápido’. Les he dicho que la paciencia también se siembra.»"), { c: [1, 3] }),
    L(t("«¡El huerto de la escuela ya tiene lechugas! Biel les ha puesto nombre. Prefiero no saber cuál.»"), { c: [4, 5] }),
    L(t("«Los niños dicen que el columpio es un reloj: cuando está arriba, es la hora de reír.»"), { c: [5, 8] }),
    L(t("«Nuri me preguntó cómo se escribe a alguien que está lejos. Le dije que se empieza por lo que se ve desde la ventana.»"), { f: 2 }),
    L(t("«{0} y tú sois los que habéis traído el huerto a la escuela. Si necesitáis una referencia, tenéis a veinte vecinos y tres niños.»"), { f: 3, p: true }),
    L(t("«Un día les daré las notas del curso. Todos aprobados: es la única forma de enseñar.»"), { f: 4 }),
  ],
  tomas: [
    L(t("«Pasad, pasad. Estoy a punto de cerrar, pero llevo diez años a punto de cerrar y aquí sigo.»")),
    L(t("«A primera hora la tienda está tan limpia que da miedo ensuciarla. Luego llega alguien y se acaba el miedo.»"), { h: 'm' }),
    L(t("«A mediodía hago balance: tres clientes, doce suspiros y una mosca. Un día redondo.»"), { h: 'a' }),
    L(t("«Ya voy a cerrar. Es mentira: a esta hora siempre alarga alguien, y casi siempre sois vosotros.»"), { h: 'e' }),
    L(t("«Con lluvia entra más gente a mirar que a comprar, pero me gusta la compañía.»"), { w: 'rain' }),
    L(t("«El molino da vueltas con el viento de nieve. A mí me da vueltas la cabeza, pero eso es por la caja.»"), { w: 'snow' }),
    L(t("«En otoño se vende la harina como pan caliente. Es una forma de hablar: el pan lo vende Rosa.»"), { s: 2 }),
    L(t("«En verano los clientes compran helados que no tengo. Les doy sombra, que es gratis y casi igual.»"), { s: 1 }),
    L(t("«Tengo un cajón con cartas que nunca llegué a entregar. No me preguntéis; todavía me da vergüenza.»"), { c: [1, 2] }),
    L(t("«Vuestras cartas me han hecho recordar lo bonito que es repartir algo que alguien espera.»"), { c: [3, 5] }),
    L(t("«Me da la sensación de que hay una cosa en el cajón que no es una carta. Y no sé a quién devolvérsela.»"), { c: [3, 6], f: 2 }),
    L(t("«La tienda abre cada día. Me he dado cuenta de que no es que no cierre: es que no quiero.»"), { c: [7, 8] }),
    L(t("«{0} y tú escribís tanto que ya tengo un estante entero para vuestras cartas. Yo las entrego con mimo, no se pierde ni una.»"), { f: 3, p: true }),
    L(t("«Guardo todo porque me da miedo tirar algo que alguien aún espera. Es un defecto con buena intención.»"), { f: 4 }),
  ],
};

export const LINES_PER_NPC = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.length]));

const utcDay = () => new Date().toISOString().slice(0, 10);
const period = (h) => (h == null ? null : h < 5 || h >= 22 ? 'n' : h < 12 ? 'm' : h < 18 ? 'a' : 'e');

function matches(l, ctx, per) {
  if (l.h && per && l.h !== per) return false;
  if (l.h && !per) return false;
  if (l.w && l.w !== ctx.weather) return false;
  if (l.s != null && l.s !== ctx.season) return false;
  if (l.c && (ctx.chapter == null || ctx.chapter < l.c[0] || ctx.chapter > l.c[1])) return false;
  if (l.f && (ctx.friendLevel || 0) < l.f) return false;
  if (l.p && !ctx.partner) return false;
  return true;
}
const weightOf = (l) => 1 + (l.h ? 1 : 0) + (l.w ? 2 : 0) + (l.s != null ? 1 : 0) + (l.c ? 2 : 0) + (l.f ? 2 : 0) + (l.p ? 1 : 0);

/** Línea de charla del vecino para el contexto dado → { text, id }. Determinista. */
export function lineFor(npcId, ctx = {}) {
  const pool = LINES[npcId];
  if (!pool) return { text: '', id: -1 };
  const per = period(ctx.hour);
  const cands = pool.map((l, i) => ({ l, i })).filter(({ l }) => matches(l, ctx, per));
  const list = cands.length ? cands : pool.map((l, i) => ({ l, i })).filter(({ l }) => !l.h && !l.w && l.s == null && !l.c && !l.f && !l.p);
  const rnd = mulberry32(hashStr(`${npcId}|${ctx.day || utcDay()}|${per || '-'}|${ctx.n || 0}`));
  const total = list.reduce((a, { l }) => a + weightOf(l), 0);
  let r = rnd() * total;
  let pick = list[list.length - 1];
  for (const c of list) { r -= weightOf(c.l); if (r < 0) { pick = c; break; } }
  const text = pick.l.text.replace(/\{0\}/g, ctx.partner || '');
  return { text, id: pick.i };
}

// ---------- Presentaciones ----------
/** Saludo corto cuando ya os conocéis (se usa al abrir la conversación). */
export const GREETINGS = {
  remedios: t("«¡Mis dos favoritos! Pasad, pasad.»"),
  marta: t("«¡Hola, vecinos! Llegáis justo a tiempo.»"),
  pablo: t("«Mm. Hola. Qué bien.»"),
  luna: t("«¡Hola! Mirad, no os mováis… vale, ya.»"),
  rosa: t("«¡Hola! Cuidado con el suelo, que hay harina hasta donde no se ve.»"),
  inigo: t("«Buenas. Tic… perdón, buenas.»"),
  celia: t("«¡Hola, vecinos! Si os piden que cantéis el abecedario, es por mí.»"),
  tomas: t("«Buenas. Ya iba a cerrar… bueno, hoy no.»"),
};

const MEETINGS = {
  remedios: [
    t("«¡Por fin! Soy Remedios, la alcaldesa. Y no, no hay otra persona escondida detrás de la puerta: es que este valle tiene tan pocos habitantes que a mí me toca hacer de ayuntamiento entero.»"),
    t("«Hace años, cada atardecer el Reloj de la Plaza marcaba la Hora de las Cartas: el pueblo encendía farolillos por quienes estaban lejos. Un invierno el reloj se paró y el pueblo se fue quedando en silencio. Pero hoy habéis llegado vosotros.»"),
    t("«Se dice que el reloj solo vuelve a andar cuando dos personas lejanas le dan cuerda a la vez. Lo dice el valle, no yo… yo solo lo repito con mucho cariño. ¿Me ayudáis a despertarlo? Empezad por plantar algo.»"),
  ],
  rosa: [
    t("«¡Ay, perdón, os he manchado de harina! Soy Rosa, la panadera. O la heredera de una panadería, que no es lo mismo.»"),
    t("«Mi abuela me dejó este horno y una receta que nadie ha encontrado. Se llamaba ‘pan de las dos mitades’. No sé si es un nombre o una pista.»"),
    t("«Pasad por aquí cuando queráis. Si el horno vuelve a cantar, será gracias a gente como vosotros.»"),
  ],
  inigo: [
    t("«Íñigo, relojero. Sí, el de la torre que ya no suena. No, no pienso hablar del tema todavía.»"),
    t("«Pero seguro que me escucharéis igual. Es que un reloj parado es muy parecido a una persona que espera: el tiempo no lo cura, solo lo pospone.»"),
    t("«Si queréis ayudarme, habrá que hacerlo con calma. Mis manos ya no tienen la prisa de antes.»"),
  ],
  celia: [
    t("«¡Hola! Soy Celia, la maestra. Perdonad el desorden: son las tres de la tarde y ya me han desordenado seis veces el aula. Con cariño, eso sí.»"),
    t("«Tengo tres alumnos: Lola, que dibuja; Biel, que pregunta; y Nuri, que mira por la ventana esperando algo. Los tres quieren plantar ‘cosas que crecen rápido’.»"),
    t("«Les he dicho que nada crece tan deprisa como quieren. Pero un poco de ayuda de vecinos nuevos nunca viene mal.»"),
  ],
  tomas: [
    t("«Buenas, buenas. Tomás, tendero y molinero. Estoy a punto de cerrar, no os preocupéis: siempre lo estoy.»"),
    t("«Llevo años diciéndolo, pero a lo mejor es el primer día que no lo digo del todo en serio. Es que ha entrado gente, ¿sabéis? Gente que mira los estantes y no solo la puerta.»"),
    t("«Comprad, vended, preguntad… y si encontráis un sobre sin sello, no os asustéis: es una manía mía.»"),
  ],
};

/** Presentación de un vecino la primera vez que se le conoce → { text, lines } (null si no hay). */
export function firstMeeting(npcId) {
  const lines = MEETINGS[npcId];
  if (!lines) return null;
  return { text: lines.join('\n\n'), lines: [...lines] };
}

// ---------- Historias de amistad (5 capítulos por vecino; se fusionan con STORIES de constants.js) ----------
export const STORIES_NEW = {
  remedios: [
    { title: t("La alcaldesa de las cartas"), text: t("«Dicen que soy la alcaldesa, pero en realidad soy la que cuida el buzón. Es un trabajo humilde, pero el único en el que todo el mundo, tarde o temprano, me necesita. Gracias por pasaros a verme: ya empezaba a hablar sola.»"), reward: { coins: 80 } },
    { title: t("La Hora de las Cartas"), text: t("«Cada atardecer encendíamos un farolillo por alguien que estaba lejos. El pueblo entero salía a la plaza con su nombre en la boca. Era tan sencillo que no nos dimos cuenta de lo importante que era hasta que dejó de pasar.»"), reward: { coins: 100, hearts: 10 } },
    { title: t("Una tinta que no se seca"), text: t("«Yo escribía a alguien cada tarde. A mi hermana pequeña, Pilar, que se fue a otro país a buscar su vida. Una carta al día, durante años. Jamás le conté lo mucho que la echaba de menos: le hablaba del tiempo, del huerto y de la fuente.»"), reward: { coins: 150, hearts: 10 } },
    { title: t("El silencio después"), text: t("«Cuando el reloj se paró, dejé de escribir. No porque me faltaran ganas, sino porque me dio miedo preguntar por qué Pilar no respondía. A veces uno cree que es más fácil no saber que saber demasiado. Os cuento esto porque vosotros hacéis justo lo contrario: os escribís.»"), reward: { coins: 200, hearts: 15 } },
    { title: t("Lo que esperaba en el cajón"), text: t("«Tomás me ha dado un paquete atado con una cuerda. Cartas de Pilar, años de cartas, que se quedaron en el camino cuando el cartero dejó de venir. Las he leído una a una, bajito, para que el despacho las oyera. Ella nunca dejó de contestarme. Gracias por haber hecho que el valle se despertara.»"), reward: { coins: 300, hearts: 25 } },
  ],
  rosa: [
    { title: t("El horno de la abuela"), text: t("«Mi abuela amasaba de noche, sola, y por la mañana la panadería olía a lo que más me gusta en el mundo. Yo heredé el horno y las llaves, pero no el truco. Dice mi madre que el truco era ‘no tener prisa’. Qué manera tan cruel de enseñar.»"), reward: { coins: 80 } },
    { title: t("Un cuaderno sin receta"), text: t("«Encontré su cuaderno de la panadería. Está lleno de cuentas, de listas de la compra… y de dibujitos de pan en los márgenes. De receta, nada. Pero en la última página ha escrito una frase: ‘La masa pide dos manos y una distancia’. No sé qué quiere decir.»"), reward: { coins: 100, hearts: 10 } },
    { title: t("Dos manos y una distancia"), text: t("«Creo que ya lo entiendo, ¿sabéis? Dos manos, de dos personas. Y una distancia: la de la masa que reposa, la de quien espera, la de quien está lejos. Mi abuela horneaba para mi abuelo, que viajaba mucho. Cada pan era una carta comestible.»"), reward: { coins: 150, hearts: 10 } },
    { title: t("El pan de las dos mitades"), text: t("«Lo he conseguido. Un pan redondo que se parte limpio por la mitad: una para quien lo hace y otra para quien está lejos. Comedlo juntos, aunque sea por videollamada, aunque cada uno en su cocina. Sabe mejor, lo prometo.»"), reward: { coins: 200, hearts: 15 } },
    { title: t("Una panadería con receta"), text: t("«He puesto en la pizarra: ‘Pan de las dos mitades — para quien está y para quien no’. Los vecinos preguntan qué significa y yo, que ya no tengo miedo de la masa, les cuento la historia de mi abuela. Y de vosotros. Espero que no os importe.»"), reward: { coins: 300, hearts: 25 } },
  ],
  inigo: [
    { title: t("Tic, tac"), text: t("«Cuando era niño, mi padre me ponía un reloj en la oreja para dormirme. Mi corazón fue al ritmo de ese tic-tac mucho antes de conocer los números. Por eso me hice relojero: para que nadie se quedara sin ese ruido.»"), reward: { coins: 80 } },
    { title: t("El invierno del reloj"), text: t("«Aquel invierno el reloj empezó a atrasar, luego a cojear, y una noche se paró. Estaba solo en la torre. Quise arreglarlo, abrí la caja del mecanismo, y las manos me temblaron más de lo que debían. Desde aquella noche, el pueblo no vuelve a oír la hora.»"), reward: { coins: 100, hearts: 10 } },
    { title: t("Un muelle pequeño"), text: t("«El muelle del corazón es del tamaño de un caracol. Un trocito de acero enrollado que, bien tensado, mueve la torre entera. Lo saqué para limpiarlo, y a partir de ahí… no recuerdo más. Me pasó algo en las manos, o en la cabeza. Desde entonces creo que lo rompí.»"), reward: { coins: 150, hearts: 10 } },
    { title: t("Cuerda para dos"), text: t("«Un reloj así no se da cuerda con una mano: hay dos llaves, una a cada lado de la esfera. Los antiguos relojeros lo hacían a propósito: no se puede amar el tiempo solo. Vuestra historia me recuerda a la torre: dos llaves lejos, un solo mecanismo.»"), reward: { coins: 200, hearts: 15 } },
    { title: t("La hora justa"), text: t("«He pasado años pensando que había roto algo y no era así. Me tranquiliza saberlo, aunque aún me cuesta creerlo. Un buen relojero acaba aprendiendo que el tiempo no se arregla: se acompaña. Gracias por acompañarme.»"), reward: { coins: 300, hearts: 25 } },
  ],
  celia: [
    { title: t("Tres alumnos"), text: t("«Lola dibuja ardillas con alas, Biel pregunta cuántos años tiene el sol y Nuri me regaló una piedra con forma de corazón sin decir por qué. Son los tres únicos niños del valle. Sin ellos esto sería una escuela de fantasmas educados.»"), reward: { coins: 80 } },
    { title: t("Cosas que crecen rápido"), text: t("«Les pregunté qué querían plantar. ‘Algo que crezca rápido’, dijo Biel. ‘Para verlo antes de que se acabe el curso’, añadió Lola. Nuri no dijo nada, pero asintió con la cabeza muy fuerte. Creo que Nuri tiene prisa por una razón que no me ha contado.»"), reward: { coins: 100, hearts: 10 } },
    { title: t("El columpio de la cerca"), text: t("«Biel ha reparado el columpio con una cuerda y un nudo que él llama ‘de ingeniero’. No es de ingeniero. Pero aguanta, y los tres se turnan sin pelearse, que es más de lo que consiguen muchos adultos con un banco.»"), reward: { coins: 150, hearts: 10 } },
    { title: t("La carta de Nuri"), text: t("«Nuri me ha enseñado una carta. Es de su padre, que trabaja lejos y no vuelve hasta la primavera. ‘¿Cómo sé si le llega lo que le escribo?’, me preguntó. Le dije que lo importante es que se escribe pensando en quien lo va a leer. Vosotros lo sabéis bien, ¿verdad?»"), reward: { coins: 200, hearts: 15 } },
    { title: t("Examen de primavera"), text: t("«Los tres han aprobado el huerto. Lola ha dibujado cada lechuga, Biel las ha contado y Nuri ha regado todas las mañanas. Le ha escrito a su padre una carta con una hoja seca y una zanahoria dibujada. Yo creo que, a veces, aprender es solo saber a quién se lo vas a contar.»"), reward: { coins: 300, hearts: 25 } },
  ],
  tomas: [
    { title: t("A punto de cerrar"), text: t("«Llevo diez años diciendo que estoy a punto de cerrar. Nunca ha pasado nada y ya me he acostumbrado a no cerrar. Pero ‘estoy a punto’ es una manera cómoda de no preguntarse si de verdad quiero seguir. Creo que sí, aunque no lo diga.»"), reward: { coins: 80 } },
    { title: t("El cajón de las cartas"), text: t("«En el mostrador, bajo la caja, hay un cajón con llave. Dentro hay un montón de sobres que llegaron a la tienda por error, o que nunca supe a quién repartir. Los guardo desde que el cartero se jubiló. No me atrevo a abrirlos ni a tirarlos.»"), reward: { coins: 100, hearts: 10 } },
    { title: t("Por qué no las entregué"), text: t("«Al principio fue por falta de tiempo. Luego, por vergüenza: ¿cómo le explicas a alguien que su carta lleva años en un cajón? Cada día que pasa es un motivo más para no entregarla. Es un círculo muy cómodo. Y muy triste.»"), reward: { coins: 150, hearts: 10 } },
    { title: t("Una carta para cada vecino"), text: t("«Me habéis hecho reunir valor. He entregado tres cartas: a Celia, a Rosa y a Luna. Dos se rieron, una lloró, y ninguna se enfadó. Quedan más. Y un objeto pequeño y raro, de acero, que no es una carta pero que está en el cajón desde aquel invierno. No sé a quién devolvérselo.»"), reward: { coins: 200, hearts: 15 } },
    { title: t("Abierto"), text: t("«Hoy he cambiado el cartel de la puerta. Antes ponía ‘Vuelvo en cinco minutos’, desde hace diez años. Ahora pone ‘Abierto’. Es la mejor palabra del idioma. Gracias por haber entrado, comprado y esperado a que me atreviera.»"), reward: { coins: 300, hearts: 25 } },
  ],
};
