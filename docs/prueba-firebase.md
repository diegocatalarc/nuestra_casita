# Prueba con Firebase real (lista para la persona responsable)

Hasta hoy todo el multijugador se verificó en **modo demo** (dos pestañas, localStorage). Esto hay que probarlo con Firebase de verdad, con **dos cuentas Google y dos dispositivos** (por ejemplo Edge en macOS + iPad).

## Antes de empezar
- [ ] `.env.local` con `VITE_FIREBASE_*` del proyecto `bri-game` (ver `.env.example`), o build desplegado con esas variables.
- [ ] En la consola de Firebase: Authentication → Google activado; **dominios autorizados** incluyen el dominio de Netlify (y `localhost` si se prueba en local).
- [ ] Firestore y Realtime Database creados; reglas actuales desplegadas (`firestore.rules`, `database.rules.json`).
- [ ] Clave de API restringida por dominio (Google Cloud → Credenciales). Ver `docs/estado.md`.

## Flujo (marcar lo que falle y anotar el mensaje de error)
1. [ ] Persona A: iniciar sesión con Google → crear casita → anotar el código de 6 letras.
2. [ ] Persona B (otro dispositivo): iniciar sesión → «Unirme» con el código. Ambas ven «en línea».
3. [ ] **Tiempo real:** A planta y riega; B lo ve aparecer sin recargar. B responde una misión; A la ve.
4. [ ] **Presencia:** al moverse, el personaje de la otra persona se mueve (RTDB). Cerrar una pestaña → pasa a «desconectada/o».
5. [ ] **Chat:** mensaje A→B y B→A; «visto ✓✓»; vista previa del botón 💬.
6. [ ] **Economía:** vender cosecha, entregar un pedido, aportar al pedido grande semanal entre las dos personas (el `inc` anidado `orders.w<N>.<uid>.<item>` está sin verificar en Firebase real).
7. [ ] **Cosechar muchas veces seguidas** un cultivo: debe cobrarse una sola vez (arreglo de actualización optimista).
8. [ ] **Corazones:** comprar un objeto de «decoración del corazón», quitarlo y comprobar el reembolso del 50 %.
9. [ ] **Niebla:** caminar hasta descubrir un lugar; la otra persona ve el mapa descubierto (cadena `explored`).
10. [ ] **Sin conexión:** cortar la red unos segundos, hacer una acción y reconectar. Anotar si se pierde o se duplica.
11. [ ] Cerrar sesión y volver a entrar: todo sigue ahí.
12. [ ] Desde la pantalla ⚙️ → «Probar conexión»: Firestore y Realtime Database deben salir en verde (copiar el informe si falla).

## iPad (Safari)
Ver la lista de `docs/ipad.md` (gestos, instalación en pantalla de inicio, sonido, inicio de sesión con Google en Safari).

## Si algo falla
Copiar el informe de «Probar conexión» y el texto exacto del aviso rojo. Los errores más comunes (dominio no autorizado, URL de Realtime Database, reglas) tienen mensaje propio en la pantalla de ajustes.
