import { t } from '../i18n';

// Novedades: cada entrada se muestra una vez a cada persona (se recuerda en el navegador).
export const NEWS = [
  {
    v: 1, title: t("Chat, Vestidor, Pesca y Bote"),
    items: [
      { emoji: '💬', text: t("Chat en vivo con tu pareja, con globos sobre la cabeza y «visto ✓✓».") },
      { emoji: '👗', text: t("Vestidor con muchísimas más opciones de pelo, ropa, caras y extras, y conjuntos guardados.") },
      { emoji: '🎣', text: t("Pesca: lanza la caña al agua, tira cuando salga ❗ y completa el diario de especies.") },
      { emoji: '⛵', text: t("Bote para navegar por el río, solos o con tu pareja de pasajera/o.") },
    ],
  },
  {
    v: 2, title: t("Encargos, Mercado y Habilidades"),
    items: [
      { emoji: '📋', text: t("Tablón de pedidos: cada día, 4 encargos de vecinos y visitantes. Pagan monedas, corazones y ropa exclusiva.") },
      { emoji: '🏪', text: t("Mercado: vended cosecha, peces y platos por 🪙. Cada día un producto se paga un 50 % más.") },
      { emoji: '🛍️', text: t("Con las monedas compráis semillas raras (girasol, lavanda, melón) y ropa nueva para el Vestidor.") },
      { emoji: '⬆️', text: t("Habilidades de pesca, cultivo y cocina que suben de nivel con el uso, y mejoras de caña, regadera y sartén.") },
    ],
  },
  {
    v: 3, title: t("Eventos y editor de decoración"),
    items: [
      { emoji: '🎪', text: t("Festival cada sábado con minijuego y premios (el tema cambia con la estación), visitantes sorpresa con regalos y noches de lluvia de estrellas para pedir deseos en pareja.") },
      { emoji: '🛋️', text: t("Decorar ahora permite tocar un objeto y rotarlo, cambiarle el color, moverlo o eliminarlo con botones en pantalla.") },
    ],
  },
  {
    v: 4, title: t("Más terreno y citas en pareja"),
    items: [
      { emoji: '🗺️', text: t("Ampliaciones de terreno: Pradera del Este, Valle del Sur y Colinas del Sureste, con estanque, lago y recursos nuevos. Se compran con monedas.") },
      { emoji: '⛏️', text: t("Arar tierra: en 🌱 Plantar elige «Arar» y convierte hierba o pradera en huerto donde queráis.") },
      { emoji: '💞', text: t("Citas en pareja (picnic, estrellas, paseo en bote, pesca a dúo, cena) que se guardan como recuerdo, y regalos escondidos con pistas «frío / caliente».") },
    ],
  },
  {
    v: 5, title: t("Exploración y vida en el pueblo"),
    items: [
      { emoji: '🏝️', text: t("El río del Valle del Sur se abre en una bahía con una isla del tesoro: navega en bote, baja a la isla y abre el cofre semanal.") },
      { emoji: '✨', text: t("Cada día aparecen destellos en la arena para excavar conchas, fósiles y minerales, y hay una mina por pisos en las Colinas del Sureste.") },
      { emoji: '📚', text: t("Álbum de coleccionables (conchas, fósiles, minerales y peces) con premios al completar cada página.") },
      { emoji: '🏘️', text: t("Pueblo con vecinos al otro lado del puente: charla, regalos, amistad y una historia de 4 capítulos con cada uno.") },
      { emoji: '🐾', text: t("Mascotas con carácter: juega con ellas para subir el vínculo, pídeles ayuda cada día y apúntalas al concurso de los domingos.") },
    ],
  },
  {
    v: 6, title: t("Territorio más grande y pueblo con vida"),
    items: [
      { emoji: '🗺️', text: t("¡Más terreno desde el principio! La Pradera del Este y el Valle del Sur (con la bahía y la isla) ya son parte de vuestro territorio, sin comprar nada. Solo las Colinas del Sureste siguen en venta (ahora por 900 🪙).") },
      { emoji: '🏘️', text: t("El pueblo ha cobrado vida: plaza con fuente, mercadillo, huerto, muelle, caballete, farolas y ventanas que se encienden de noche. Los vecinos trabajan en lo suyo y se juntan en la plaza al mediodía y por la tarde.") },
    ],
  },
  {
    v: 7, title: t("Sistema de crafteo"),
    items: [
      { emoji: '🛠️', text: t("Taller: una mesa de trabajo siempre disponible y cuatro estaciones (carpintería, telar, herrería y cristalería) que se colocan con Decorar. Más de 35 recetas.") },
      { emoji: '📏', text: t("Convierte madera, piedra, arcilla, tela y cristales en tablones, ladrillos, hilo, cuerda, pintura, tela fina, lingotes y vidrio, y con ellos fabrica muebles únicos, prendas para el Vestidor y mejoras (bote, pico, anzuelo).") },
      { emoji: '🤝', text: t("Fabricar lleva tiempo y la otra persona puede ayudar a acelerarlo o pediros un objeto. La Artesanía sube con el uso y abre recetas nuevas.") },
    ],
  },
  {
    v: 8, title: t("¡Un mundo por descubrir!"),
    items: [
      { emoji: '☁️', text: t("El valle esconde rincones secretos: ahora los encontraréis paseando juntos o por separado.") },
      { emoji: '🧭', text: t("Por el camino encontraréis 15 rincones secretos (círculo de piedras, faro, cabaña abandonada, cerezos en flor…) con premios, y un Mapa del mundo para seguir vuestro progreso.") },
      { emoji: '🏙️', text: t("¡Un pueblo mucho más grande al este! Plaza Mayor con fuente, ayuntamiento, torre del reloj, panadería, tienda, café, escuela, capilla, molino y vecinos paseando por la Calle Mayor.") },
    ],
  },
  {
    v: 9, title: t("Chat a mano y un mundo con más detalle"),
    items: [
      { emoji: '💬', text: t("El chat ya no está en un menú: tienes un botón siempre visible abajo a la derecha, con aviso de mensajes nuevos y vista previa. Pulsa Enter para abrirlo.") },
      { emoji: '🧭', text: t("Menús renovados: cada opción explica para qué sirve. Los ajustes están en el ⚙️ de abajo a la izquierda.") },
      { emoji: '🌿', text: t("Más detalle en el mapa: hierba con textura, florecillas silvestres, árboles con copas más ricas, surcos continuos en el huerto y valla completa.") },
    ],
  },
  {
    v: 10, title: t("Controles táctiles y más acciones en el menú"),
    items: [
      { emoji: '👆', text: t("En iPad y pantallas táctiles: pellizca para acercar o alejar, gira dos dedos para mover la cámara, o usa los botones ＋ － ↺ ↻ a la derecha.") },
      { emoji: '🤗', text: t("Abrazar y Saludar ya están en el menú 💞 Pareja, sin necesidad de teclado.") },
    ],
  },
  {
    v: 11, title: t("¡Ahora los corazones se gastan!"),
    items: [
      { emoji: '💞', text: t("Nueva decoración del corazón en 🛋️ Decorar: banco de dos, arco de flores, farolillos, árbol de los deseos, fuente del hogar y estatua de pareja. Se pagan con 💗 (al quitarlos se devuelve la mitad).") },
    ],
  },
  {
    v: 12, title: t("Hoy y un tutorial más completo"),
    items: [
      { emoji: '☀️', text: t("Nuevo botón ☀️ Hoy: misiones, meta semanal, pedidos y evento del día en un solo sitio, con botones para ir a cada uno.") },
      { emoji: '🎓', text: t("El tutorial ahora también enseña el Mercado, los pedidos, la pesca, comer y para qué sirven los corazones.") },
    ],
  },
  {
    v: 13, title: t("Pedidos más vivos y la casita en tu iPad"),
    items: [
      { emoji: '📦', text: t("Pedidos de temporada, un pedido grande cada semana que entregáis entre los dos, un bonus por completar los 4 del día y pistas de dónde conseguir lo que falta.") },
      { emoji: '🛠️', text: t("El Taller te sugiere en ☀️ Hoy qué puedes fabricar ahora, y el panel pone primero lo que ya puedes hacer.") },
      { emoji: '📲', text: t("En iPad puedes instalarla en la pantalla de inicio y jugar a pantalla completa (Compartir → Añadir a pantalla de inicio).") },
    ],
  },
  {
    v: 14, title: t("Arreglos para iPad y mover la cámara"),
    items: [
      { emoji: '🗺️', text: t("Arrastra con un dedo para mover la cámara por el mapa y toca 🎯 para volver a tu personaje. Además, tu personaje ya no se ralentiza en iPad y los toques en el suelo funcionan siempre.") },
    ],
  },
  {
    v: 15, title: t("Taller sencillo"),
    items: [
      { emoji: '🛠️', text: t("El Taller ahora es mucho más fácil: pocas recetas con materiales básicos, sin estaciones ni niveles y con un solo botón. Lo fabricado llega solo a la mochila. Lo de antes sigue disponible en «recetas avanzadas».") },
    ],
  },
  {
    v: 16, title: t("Sin niebla"),
    items: [
      { emoji: '🗺️', text: t("Quitamos la niebla: ahora ves todo el mapa y el pueblo desde el principio. Los lugares secretos siguen ahí, marcados con ❔ en el mapa, esperando a que los descubráis.") },
    ],
  },
  {
    v: 17, title: t("La historia del Valle"),
    items: [
      { emoji: '📖', text: t("Un pueblo dormido y una alcaldesa que os esperaba: abre el Diario del Valle (menú Mundo) y sigue las Cartas con Doña Remedios y sus vecinos. Reparad entre los dos la fuente, la panadería, la tienda, la escuela, el café y el reloj.") },
      { emoji: '🏘️', text: t("Los vecinos ahora viven su día: salen de casa, trabajan, pasean por la plaza y charlan. Tocadlos para hablar; el ❗ indica que tienen algo que contaros.") },
      { emoji: '😊', text: t("Nuevos emotes para saludar, bailar o aplaudir juntos, y una plaza con pájaros y campana.") },
    ],
  },
  {
    v: 18, title: t("La historia, contada"),
    items: [
      { emoji: '🎬', text: t("La historia del Valle ahora se cuenta con escenas: cada capítulo empieza con una carta narrada, tus avances tienen su reacción y al terminar recibes la recompensa en una pantalla de cierre.") },
      { emoji: '📍', text: t("Una guía siempre visible arriba te dice qué toca hacer, con una flecha y la distancia hasta el vecino o el lugar. El vecino al que debes ir lleva un 📍 sobre la cabeza.") },
      { emoji: '💬', text: t("Al hablar con un vecino te pide lo que necesita y puedes entregárselo ahí mismo. Puedes revivir cualquier escena desde el Diario del Valle.") },
    ],
  },
  {
    v: 19, title: t("Cielo despejado de verdad"),
    items: [
      { emoji: '☀️', text: t("Quitamos del todo la niebla: ya no hay bruma en el horizonte, ni bancos de niebla al amanecer, ni días de niebla. Y el botón ✨ de efectos desaparece de la esquina.") },
      { emoji: '⏳', text: t("Pantalla de carga: el juego espera a que todo vaya fluido y te pide pulsar «Entrar» (también activa el sonido).") },
    ],
  },
];
export const NEWS_VERSION = NEWS[NEWS.length - 1].v;

const KEY = 'nc_news', TABS = 'nc_newtabs';
export const newsSeen = () => { try { return +localStorage.getItem(KEY) || 0; } catch { return 0; } };
export const markNewsSeen = () => { try { localStorage.setItem(KEY, String(NEWS_VERSION)); } catch { /* noop */ } };

/** Botones de la barra marcados con 🆕 hasta que se abren por primera vez. */
const NEW_TABS = ['orders', 'market', 'events', 'land', 'dates', 'explore', 'craft', 'map'];
const seenTabs = () => { try { return JSON.parse(localStorage.getItem(TABS) || '[]'); } catch { return []; } };
export const isNewTab = (id) => NEW_TABS.includes(id) && !seenTabs().includes(id);
export const markTab = (id) => { try { const a = seenTabs(); if (!a.includes(id)) localStorage.setItem(TABS, JSON.stringify([...a, id])); } catch { /* noop */ } };
