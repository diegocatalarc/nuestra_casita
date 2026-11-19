# Nuestra Casita en iPad (PWA)

Objetivo: que en el iPad se pueda **instalar en la pantalla de inicio** y verse a pantalla completa (sin barras de Safari), con los controles dentro de las áreas seguras.

## Cómo instalarlo
1. Abre la dirección del juego en **Safari** (no vale el navegador integrado de otras apps).
2. Toca **Compartir** (cuadrado con flecha) → **Añadir a pantalla de inicio** → **Añadir**.
3. Abre «Casita» desde el icono nuevo. Se abre sin barra de direcciones.

## Qué cambia al instalarlo
- Pantalla completa (`display: standalone`), barra de estado translúcida sobre el juego.
- Funciona en horizontal y vertical.
- Los menús, el chat, los botones de cámara y los botones redondos respetan las áreas seguras (muesca, barra de inicio y bordes redondeados) con `env(safe-area-inset-*)`.
- Sin «tirar para refrescar», sin rebote y sin zoom de página: el pellizco es solo para el zoom del juego.
- Sin selección de texto ni menú de «mantener pulsado» sobre el juego; en cajas de texto (chat, nombre) sí se puede seleccionar.
- En iPad los botones redondos (ajustes, efectos, sonido, salir) pasan a una fila bajo los recursos, arriba a la derecha, para no tapar la barra inferior ni el chat. En vertical la barra se alinea a la izquierda para dejar sitio al botón del chat. En escritorio no cambia nada.

## Cómo está hecho
- `public/manifest.webmanifest`, iconos `public/icon-*.png`, `public/apple-touch-icon.png` y `public/icon.svg` (fuente).
- Los iconos se regeneran con `node tools/make-icons.cjs` (necesita Playwright/Chromium; no es dependencia del proyecto).
- `index.html`: metas `apple-mobile-web-app-*`, `mobile-web-app-capable`, `theme-color`, `viewport-fit=cover`, `user-scalable=no`. Las rutas usan `%BASE_URL%`, así que sirven con `vite build` (base `/`) y con `--base=./`.
- Estilos: bloque «iPad / PWA» al final de `src/styles.css`.
- **No hay service worker ni caché offline** (decisión deliberada de esta fase).

## Limitaciones conocidas
- **Avisos con la app cerrada:** en iOS (16.4+) las notificaciones push de una web instalada requieren un **service worker con Web Push** y un servidor/función que las envíe (p. ej. Firebase Cloud Messaging). **No está implementado**; es el siguiente paso si se quiere avisar de mensajes o cartas. Hoy los avisos solo funcionan con el juego abierto.
- Sin service worker no hay modo sin conexión: sin red el juego no arranca.
- Si se cambia la dirección o el icono, hay que borrar el acceso directo y volver a añadirlo.
- El inicio de sesión con Google en una PWA instalada de iOS puede comportarse distinto (ventana emergente/redirección); **[POR CONFIRMAR en iPad real]**.
- Las pruebas en este repo son con Chromium emulando iPad (táctil, 1024×768 y 768×1024, y un contexto con áreas seguras simuladas). No sustituyen a un iPad real.

## Lista de comprobación en el iPad real
- [ ] Se instala con Compartir → Añadir a pantalla de inicio y el icono es la casita con corazón.
- [ ] Abre a pantalla completa; nada queda bajo la barra de estado ni la barra de inicio.
- [ ] Horizontal y vertical: barra inferior, botón de chat y botones ＋ － ↺ ↻ no se tapan entre sí ni con los bordes.
- [ ] Gestos: tocar para caminar, pellizco (zoom del juego, no de la página), giro con dos dedos; al soltar no camina.
- [ ] Deslizar hacia abajo desde arriba no refresca ni hace rebote.
- [ ] Chat: se abre, el teclado no tapa la caja de texto, se puede enviar y cerrar.
- [ ] Menús de la barra (Hogar, Pareja, Mundo, Comercio) y paneles: se abren, se desplazan y se cierran.
- [ ] Botones redondos (arriba a la derecha): sonido, efectos, ajustes, salir.
- [ ] Sonido: suena tras el primer toque y el botón de silencio funciona.
- [ ] Inicio de sesión (Google / código de pareja) funciona dentro de la app instalada y se mantiene al cerrarla y volver a abrirla.
- [ ] Rendimiento: fluido al mover la cámara (si no, probar `?nofog`).
