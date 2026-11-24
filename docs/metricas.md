# Métricas semanales: calidad, seguridad y rendimiento

**Para qué sirve:** cada semana, números objetivos (¿pasan los tests?, ¿hay vulnerabilidades?, ¿va peor el juego?) comparados con la semana anterior, con un semáforo. Sin mirar el código a mano.

## Cómo funciona (3 piezas)
1. **Recogida** — `tools/metrics.mjs` (`npm run metrics`; opciones `--perf` y `--rules`). Ejecuta tests (dos veces, para ver flaky) con cobertura de `src/game/`, `npm audit`, `npm outdated`, gitleaks, alertas de CodeQL, tests de reglas de Firestore, peso del bundle y el arnés de rendimiento. Cada paso falla de forma aislada (KPI «sin medir»); un KPI de seguridad o de tests sin medir pone el informe en **ámbar**, nunca en verde. Escribe `metrics/latest.json` y `metrics/runs/<fecha>.json`. La lógica de resumen y semáforo es pura y está testeada (`tools/metrics-lib.mjs`, `tests/metrics.test.js`).
2. **Ejecución** — la hace el propio agente semanal (ver abajo): clona el repo, ejecuta `node tools/metrics.mjs --perf --rules` y publica los JSON en la rama `metrics-data` (historial acumulado, no toca el código). Además existe `.github/workflows/weekly-metrics.yml` (domingos 05:17 UTC + CodeQL + gitleaks), pero **GitHub solo ejecuta flujos programados desde la rama por defecto**: se activará cuando `casita-sync` se promueva a `main` (decisión pendiente). Hasta entonces gitleaks y CodeQL salen «sin medir» salvo que el entorno del agente tenga gitleaks/`gh`.
3. **Informe + agente** — una tarea programada de Claude (semanal) lee `metrics-data`, compara con la semana anterior, añade una fila a la base «Informe semanal» de Notion («Nuestra Casita · Calidad y seguridad») y propone arreglos. **Propone; la persona responsable aprueba. Nunca despliega ni toca Firebase/Netlify/`main`.**

## KPI y metas
| KPI | Fuente | Meta | Semáforo |
|---|---|---|---|
| Vulnerabilidades críticas+altas **en producción** (lo que llega al navegador) | `npm audit --omit=dev` | 0 | rojo si > 0 |
| Vulnerabilidades altas en herramientas de desarrollo | `npm audit` | informativo | — |
| Secretos expuestos | gitleaks | 0 | rojo si > 0 |
| Hallazgos altos de código inseguro | CodeQL | 0 | rojo si > 0 |
| Tests que pasan | vitest | 100 % | rojo si < 100 |
| Tests de reglas de Firestore | `npm run test:rules` | 100 % | rojo si < 100 |
| Reglas desplegadas | `metrics/manual.json` | `al-dia` | rojo si no |
| Dependencias con salto de versión mayor | `npm outdated` | a la baja | ámbar si sube |
| Flaky (resultado distinto en 2 pasadas) | vitest ×2 | 0 | ámbar si > 0 |
| Bundle gzip (kB), draw calls, JS por fotograma, carga, duración de tests | build + `perf` | sin empeorar | ámbar si empeora > 10 % (bundle, draw calls), 20 % (JS), 30 % (carga, duración) |
| Clave web de Firebase restringida | `metrics/manual.json` | `true` | ámbar si no |
| Cobertura de `src/game/` | vitest + c8 | informativo | — |
| Tiempo medio de corrección (MTTR) | el agente lo calcula con el historial | críticas ≤ 7 d, altas ≤ 14 d | — |

**Los números de rendimiento son relativos** (navegador sin GPU): sirven para ver tendencias semana a semana en la misma máquina de CI, no fps reales. Los reales siguen siendo manuales: informe de ⚙️ «Medir fluidez» en Edge y en el iPad.

## Qué hay que hacer a mano
- Cuando se desplieguen las reglas: poner `"rulesDeployed": "al-dia"` en `metrics/manual.json`. Mientras no, el informe sale **rojo** a propósito.
- Primera ejecución del workflow: habilitar «Code scanning» no es necesario (CodeQL lo activa); GitHub → Settings → Actions debe permitir escribir contenido.

## Límites y no-objetivos
Sin ZAP/pruebas dinámicas contra producción (no hay entorno de pruebas aparte); sin telemetría de jugadores reales.
