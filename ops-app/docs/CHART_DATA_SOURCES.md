# Chart Data Sources

Audit date: 2026-09-02

The existing charts are authored in static configuration files and are not suitable for live mode. They must remain hidden or show an empty state until these APIs exist.

| Chart area | Required endpoint | Source | Status |
| --- | --- | --- | --- |
| Run volume and success | `GET /api/metrics/runs` | Persisted runs | Missing |
| Latency | `GET /api/metrics/latency` | Persisted runs / Opik traces | Missing |
| Cost and token usage | `GET /api/metrics/cost`, `GET /api/metrics/tokens` | Provider telemetry | Missing |
| Security posture | `GET /api/security/metrics/timeseries` | Security events / incidents | Missing |
| Evaluation quality | `GET /api/evaluations/stats` | Opik evaluations | Missing |
