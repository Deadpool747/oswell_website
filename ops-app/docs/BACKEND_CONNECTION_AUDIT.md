# Backend Connection Audit

Audit date: 2026-09-02

## Runtime found

The repository contains a Next.js 16 application with Node route handlers and a local SQLite database (`better-sqlite3`). It does not contain a FastAPI service, Alembic migrations, PostgreSQL configuration, an Opik SDK/integration, or Microsoft Foundry agent-client integration. The prior implementation seeded SQLite and the browser state from `src/data/mock*.ts` files.

The existing `build:static` command intentionally moves `src/app/api` out of the app while generating `out/`. Therefore the Hostinger static deployment cannot serve this application's API routes. Deploying `out/` is incompatible with a backend-driven production environment unless a separate API URL is deployed and configured via `NEXT_PUBLIC_API_URL`.

| Page group | UI component | Current data source | Expected backend source | API endpoint | Storage/provider | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Agent Registry | Table, KPI, detail panel | SQLite records; previously mock seed | Agent registry | Generic `GET /api/dashboard/agents` | SQLite now; PostgreSQL required for production | Partially connected |
| Live Runs | Table, actions, detail panel | SQLite records and OpenAI runtime for supported run action | Oswell runs and Opik traces | Generic `GET /api/dashboard/runs` | SQLite; OpenAI | Partially connected |
| Connection Center / Connectors | Tables and connection tests | SQLite records; OpenAI/Azure OpenAI probe | Provider connections | Generic dashboard API plus actions | SQLite; OpenAI only verified | Partially connected |
| Policies / Approvals / Configurations | Tables, detail panel, CRUD actions | SQLite records | Persistent platform data | Generic dashboard CRUD API | SQLite now; PostgreSQL required | Partially connected |
| Prompts / Knowledge / Secrets / Memory | Tables and detail panel | SQLite records | Persistent platform data and providers | Generic dashboard CRUD API | SQLite now | Partially connected |
| Evaluations / Testing / Feedback / Alerts | Tables and actions | SQLite records; test action uses demo generator | Opik jobs and persistent records | Generic dashboard API | SQLite; Opik absent | Not connected |
| Security pages | Tables, KPI, charts, details | SQLite records; previously mock seed | Security events and incidents | Generic dashboard API | SQLite now | Partially connected |
| Metrics / Cost / Capacity / Replay | Charts, KPI, tables | Static configuration values and SQLite rows | Run telemetry aggregates | No dedicated metrics API | SQLite / Opik required | Not connected |
| Agent detail route | Detail page | `mockData` direct import | `GET /api/agents/{id}` | Missing | PostgreSQL / Foundry | Not connected |

## Static-data findings

- `src/data/mockData.ts` and `src/data/mockSecurityOverview.ts` contain production-looking rows, KPIs, charts, and details.
- `src/lib/server/oswell-db.ts` previously copied those rows into SQLite on startup.
- `src/store/oswell-store.tsx` previously showed those rows before and after failed backend loads.
- `src/services/demoExecutionEngine.ts`, `src/services/demoConnectionTester.ts`, and `src/services/demoTestRunner.ts` simulate user-visible work.
- `src/app/api/actions/route.ts` contains hard-coded Azure agent imports and demo test results.

## Live-mode change applied

`APP_MODE=live` is now the default. A newly created database has no seeded business records, and browser state starts empty until the API responds. Existing seeded SQLite files are deliberately not deleted automatically because they may include user-created changes; migrate to a fresh production database before deployment.

## Required before production acceptance

1. Provide a PostgreSQL `DATABASE_URL` and add migrations/data models.
2. Provide Microsoft Foundry project credentials and implement its real agent API, not Azure OpenAI completions alone.
3. Provide Opik credentials/project and implement health, tracing, prompt versions, and evaluations.
4. Replace each remaining `mock*.ts` page configuration with presentation-only metadata plus API-provided KPIs/charts/details.
5. Replace generic dashboard endpoints with typed resource endpoints (`/api/agents`, `/api/runs`, `/api/policies`, etc.) and add TanStack Query client hooks.
