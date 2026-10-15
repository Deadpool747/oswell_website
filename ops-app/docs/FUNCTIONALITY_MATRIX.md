# Functionality Matrix

Audit date: 2026-09-02

| Page | Control | Frontend handler | API endpoint | Storage/provider | Mutation/read | Verified |
| --- | --- | --- | --- | --- | --- | --- |
| All dashboard tables | Initial data load | `useOswellStore.refresh` | `GET /api/database` | SQLite | Read | Yes |
| All dashboard tables | Create | `createRow` | `POST /api/dashboard/{scope}` | SQLite | Mutation | Yes |
| All dashboard tables | Edit/status action | `updateRow` | `PATCH /api/dashboard/{scope}` | SQLite | Mutation | Yes |
| All dashboard tables | Delete | `deleteRow` | `DELETE /api/dashboard/{scope}` | SQLite | Mutation | Yes |
| Live Runs | Run Agent | `executeAction` | `POST /api/actions` (`run-agent`) | OpenAI runtime + SQLite | Mutation | Requires configured agent and connector |
| Connection Center | Test Connection | `executeAction` | `POST /api/actions` (`test-connection`) | OpenAI/Azure OpenAI probe + SQLite | Mutation | Requires provider credentials |
| Connection Center | Sync Agents | `executeAction` | Not implemented in live mode | Microsoft Foundry | Mutation | No |
| Testing | Run Test Suite | `executeAction` | Not implemented in live mode | Opik/job runner | Mutation | No |
| Prompt Manager | Create Version | `executeAction` | Local SQLite mutation only | Opik + Foundry required | Mutation | No |
| Metrics and charts | View values | Static config currently hidden in live mode | Missing | Run telemetry / Opik | Read | No |
| System status | Integration status | N/A | `GET /api/system/status` | SQLite/environment config | Read | Yes |
