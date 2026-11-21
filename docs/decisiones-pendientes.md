# Checklist de decisiones pendientes (para la persona responsable)

Marca lo que decidas; cada punto lleva mi recomendación. Fecha de esta lista: tras la v21 (dos ciudades y diferencia horaria).

## A. Antes de jugar de verdad con Firebase real
- [ ] **Probar en iPad real + Firebase real** (`docs/prueba-firebase.md`, `docs/ipad.md`) y pegar el informe de ⚙️ («Medir fluidez» → «Copiar informe»). *Recomendación: hacerlo antes de cualquier despliegue de reglas.*
- [ ] **Desplegar las reglas de Firestore endurecidas** (`firestore.rules`, probadas solo en emulador). ¿Las despliegas tú (`firebase deploy --only firestore:rules`) o autorizas el conector de Firebase para que lo haga yo? *Recomendación: tras la prueba real; quedarse con la versión anterior a mano por si hay que revertir.*
- [ ] **Restringir la clave web de Firebase** a vuestro dominio de Netlify (consola de Google Cloud → Credenciales). El zip lleva la configuración real de `bri-game`.

## B. Publicación y ramas
- [ ] **¿Promover `casita-sync` a `main`?** (hoy `main` solo tiene el README). Opciones: pull request, o renombrar. *Recomendación: PR único con el CI en verde.*
- [ ] **Despliegue en Netlify:** ¿sitio y proceso exactos? ¿Quieres que despliegue yo con las herramientas de Netlify (solo si lo pides)? Hoy subes el zip a mano.
- [ ] **Sesión auxiliar «Historia 5: plaza viva y emotes»:** archivarla manualmente (mi permiso fue denegado).

## C. Historia «El Valle Atrasado»
- [ ] **Leer y aprobar el guion** (tono, nivel de humor negro, el giro «el clima eres tú», pistas del capítulo 3). Lo más rápido: abrir el Diario → «Ver la escena otra vez» en cada capítulo.
- [ ] **El Funcionario del Negociado:** hoy solo habla en escenas. ¿Quieres que también camine por el pueblo (nuevo vecino con casa, rutina y modelo)? *Recomendación: sí, pero como siguiente tarea aparte.*
- [ ] **Sequía del capítulo 2** (no llueve; hay que regar a mano) y llovizna del 1: ¿te parece bien como jugabilidad? *Alternativa: dejar el clima solo en las escenas.*
- [ ] **Privacidad de las ciudades:** la pareja ve el nombre de la ciudad (deducido de la zona horaria) de la otra persona. ¿Basta con el aviso en Novedades o prefieres un interruptor para ocultarla/editarla? *Recomendación: añadir el interruptor si os incomoda.*
- [ ] **Recompensas y ritmo** de los 7 capítulos (monedas/corazones/cristales) y duración total: sin telemetría, son estimaciones.
- [ ] **El Festival del capítulo 7** exige a las dos personas conectadas al atardecer: ¿probamos juntos una tarde y ajustamos la ventana (18-21 h de juego)?
- [ ] **Libro II:** ¿qué pasa después del giro? (final abierto, nuevo misterio, o cerrar aquí).
- [ ] **Datos personales** (nombres/fechas): decidiste «ambiguo y universal»; confirmar que se queda así.

## D. Jugabilidad pendiente
- [ ] **Dirección D «decisiones de granja»** (riesgo de clima/plagas, precios de mercado cambiantes, combos de cultivos, pedidos especiales/trampa, cultivos de varios días). *Recomendación: segunda tanda, después de probar la historia.*
- [ ] **Recortes de la auditoría de sistemas** (habilidades, Familia, comer/dormir opcionales): necesito saber qué usáis (pesca, animales, citas, exploración, familia).
- [ ] **Interruptor de calidad gráfica:** quitamos el botón ✨; en táctil arranca en «baja». ¿Quieres un selector en ⚙️ (Ajustes)? *Recomendación: sí, dentro de Ajustes.*
- [ ] **Minijuegos cooperativos con Phaser:** descartado por ahora; ¿reabrir más adelante?

## E. Rendimiento
- [ ] **Informe del subagente de optimización** (en curso): aprobar o descartar cada cambio y los umbrales que fije (draw calls, JS por fotograma, carga).
- [ ] **Umbral de la pantalla de carga** (30 fotogramas < 45 ms, tope de 15 s, entrada forzada a los 30 s): validar en iPad.

## F. Ingeniería y costes
- [ ] **Notificaciones push:** requieren Cloud Functions (plan Blaze, de pago). ¿Merece la pena o preferís avisos solo dentro del juego?
- [ ] **Migraciones de datos** con `SCHEMA_VERSION` y **comprobación de traducciones en el CI**: ¿las hago? (sin dependencias; recomendado).
- [ ] **Salud del código:** paneles con carga diferida (lo está viendo el subagente de rendimiento), claves de traducción estables, dividir `constants.js`.
- [ ] **`?weather=fog` y referencias inertes a `fog`** (audio, luces, diálogos): ¿limpiarlas del todo?
