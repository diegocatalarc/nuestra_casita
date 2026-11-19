# Plan siguiente: qué necesitamos ver y quién lo hace

Fecha: 2026-11-19. Punto de partida: uso real declarado (sembrar + vender por encargo; el crafteo no se usa) y `docs/auditoria-sistemas.md`.

## Qué necesitamos ver (análisis)
| # | Cuestión | Por qué importa | Cómo se aborda |
|---|---|---|---|
| 1 | **Bucle central** sembrar → cosechar → vender por encargo | Es lo que realmente se juega; hoy son 4 pedidos fijos al día, sin temporada ni variedad | Subagente A: «Pedidos 2.0» |
| 2 | **Crafteo sin uso** | Se pidió como función pero no está conectado al bucle ni se presenta bien. Motivo exacto **[POR CONFIRMAR]** | Subagente B: conectarlo (sugerencia en Hoy, paso de tutorial, panel más simple). Sin borrar nada |
| 3 | **iPad real** (Safari, táctil) | Una de las dos personas juega ahí; mis pruebas fueron emuladas | Subagente D: PWA instalable, áreas seguras, lista de pruebas. **Tarea humana:** probarlo en el iPad |
| 4 | **Red de seguridad automática** | Hoy solo hay tests de lógica; los fallos visuales/de arranque los detecto a mano | Subagente C: test de humo con Playwright, prueba táctil y medición de rendimiento en el repo |
| 5 | **Firebase real sin probar** | Todo el multijugador se verificó en modo demo | **Tarea humana:** probar con dos cuentas; revisar claves y dominios (ver `docs/estado.md`) |
| 6 | **Sistemas sin datos de uso** (pesca, animales, citas, exploración, familia, mina) | No sabemos cuáles sobran | **Pregunta pendiente a la persona usuaria**; después `/cut` de la auditoría |
| 7 | **Rendimiento en dispositivo real** | Solo medido con render por software | Subagente C deja el script; **medir en el iPad/Mac** |

## Reparto de archivos (para no pisarse)
- **A (pedidos):** `src/game/logic.js` (solo `dailyOrders` y ayudantes), bloque de pedidos de `src/game/constants.js`, `src/ui/OrdersPanel.jsx`, `tests/orders.test.js`, `src/i18n/en-pedidos.js`.
- **B (crafteo):** `src/ui/CraftPanel.jsx`, `src/ui/TodayPanel.jsx`, `src/game/today.js`, `src/ui/Tutorial.jsx`, tests, `src/i18n/en-crafteo.js`.
- **C (e2e/rendimiento):** `tests/e2e/`, `package.json` (scripts y devDependency), `.github/workflows/ci.yml`, `docs/pruebas.md`.
- **D (PWA/iPad):** `index.html`, `public/`, final de `src/styles.css`, `docs/ipad.md`.
- **Principal:** `HUD.jsx`, `news.js`, integración y publicación.
