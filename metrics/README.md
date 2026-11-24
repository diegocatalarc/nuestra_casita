# Métricas semanales
`node tools/metrics.mjs [--perf] [--rules]` escribe `latest.json` y `runs/<fecha>.json`. Lo ejecuta cada domingo `.github/workflows/weekly-metrics.yml` y publica el resultado en la rama `metrics-data`. Metas y semáforo: `tools/metrics-lib.mjs`. KPI manuales: `manual.json`. Informe: Notion «Nuestra Casita · Calidad y seguridad». Ver `docs/metricas.md`.
