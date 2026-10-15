import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import { withProductionAgentMetadata, withProductionConnectorMetadata } from "@/lib/server/provider-runtime";
import { createActivityEvent, createAuditEvent, type ActivityEvent, type AuditEvent } from "@/services/auditService";
import type { DashboardConfig, TableRow } from "@/types/dashboard";

const dbPath = process.env.OSWELL_DB_PATH?.trim() || join(process.cwd(), ".oswell-data", "oswell.sqlite");
const schemaVersion = 3;
const appMode = process.env.APP_MODE === "demo" ? "demo" : "live";

export type OswellDatabase = {
  records: Record<string, TableRow[]>;
  activities: ActivityEvent[];
  auditEvents: AuditEvent[];
  settings: {
    seededAt: string;
    version: number;
    storage: "sqlite";
  };
};

export const titleToKey: Record<string, string> = {
  "Live Runs": "runs",
  "Agent Registry": "agents",
  "Connector & MCP Governance": "connectors",
  "Policy Center": "policies",
  "Approvals & Audit": "approvals",
  "Configuration Center": "configurations",
  "Prompt Manager": "prompts",
  "RAG & Knowledge Governance": "knowledgeSources",
  "Secrets & Credentials": "secrets",
  "Memory & State Management": "memoryStores",
  "Testing & Regression Suite": "testSuites",
  "Feedback & Quality Loop": "feedback",
  Alerts: "alerts",
  Exports: "exports",
  "Deployment & Environment": "deployments",
  Evaluations: "evaluations",
  "AI Security Center": "securityEvents",
  "Agent Identity & Access": "identities",
  "MCP & Tool Security": "mcpServers",
  "Context Security": "contextThreats",
  "Memory Security": "memoryThreats",
  "Threats & Incidents": "incidents",
  "Permission Review": "permissions",
  "Token Lease Review": "tokens",
  "Tool Security Inventory": "tools"
};

let database: Database.Database | null = null;

export function getConfigKey(config: DashboardConfig) {
  return titleToKey[config.title] ?? config.title.toLowerCase().replaceAll("&", "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getConnection() {
  if (database) return database;

  mkdirSync(dirname(dbPath), { recursive: true });
  const next = new Database(dbPath);
  next.pragma("journal_mode = WAL");
  next.pragma("foreign_keys = ON");
  ensureSchema(next);
  seedIfNeeded(next);
  database = next;
  return next;
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_records (
      scope TEXT NOT NULL,
      id TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (scope, id)
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function applyProductionMetadata(records: Record<string, TableRow[]>) {
  if (appMode !== "demo") {
    // Live mode must return only persisted records. Provider configuration is exposed
    // through explicit health checks, never fabricated as a connector table row.
    return records;
  }

  return {
    ...records,
    agents: withProductionAgentMetadata(records.agents ?? []),
    connectors: withProductionConnectorMetadata(records.connectors ?? [])
  };
}

function seedRecords() {
  // Demo data is intentionally available only when APP_MODE=demo.
  // Keeping this isolated makes a fresh live database start with no application records.
  const { pages } = require("@/data/mockData") as typeof import("@/data/mockData");
  const { securityPages } = require("@/data/mockSecurityOverview") as typeof import("@/data/mockSecurityOverview");
  const records: Record<string, TableRow[]> = {};
  for (const config of Object.values({ ...pages, ...securityPages })) {
    const key = getConfigKey(config);
    if (!records[key]) records[key] = config.rows ?? [];
  }
  return applyProductionMetadata(records);
}

export function seedDatabase(): OswellDatabase {
  const records = seedRecords();
  return {
    records,
    activities: [
      createActivityEvent({
        entityType: "platform",
        entity: { id: "oswell-seed", name: "Oswell AI Operations Platform" },
        action: "Database Seeded",
        description: "SQLite-backed local production test data seeded on August 31, 2026."
      })
    ],
    auditEvents: [
      createAuditEvent({
        action: "DATABASE_SEEDED",
        entity: "Oswell AI Operations Platform",
        entityId: "oswell-seed",
        after: "Seed data loaded into SQLite"
      })
    ],
    settings: {
      seededAt: new Date().toISOString(),
      version: schemaVersion,
      storage: "sqlite"
    }
  };
}

function readSetting(db: Database.Database, key: string) {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value;
}

function writeSetting(db: Database.Database, key: string, value: string) {
  db.prepare(`
    INSERT INTO app_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

function seedIfNeeded(db: Database.Database) {
  if (appMode !== "demo") {
    writeSetting(db, "appMode", appMode);
    writeSetting(db, "schemaVersion", String(schemaVersion));
    writeSetting(db, "storage", "sqlite");
    return;
  }

  const existingCount = db.prepare("SELECT COUNT(*) AS count FROM dashboard_records").get() as { count: number };
  const version = Number(readSetting(db, "schemaVersion") ?? 0);

  if (existingCount.count > 0 && version >= schemaVersion) {
    return;
  }

  writeSnapshot(db, seedDatabase());
}

function readRows(db: Database.Database, scope: string) {
  const rows = db
    .prepare("SELECT payload FROM dashboard_records WHERE scope = ? ORDER BY updated_at DESC, id DESC")
    .all(scope) as Array<{ payload: string }>;
  return rows.map((row) => JSON.parse(row.payload) as TableRow);
}

function readEvents<T>(db: Database.Database, table: "activity_events" | "audit_events") {
  const rows = db
    .prepare(`SELECT payload FROM ${table} ORDER BY timestamp DESC, id DESC LIMIT 500`)
    .all() as Array<{ payload: string }>;
  return rows.map((row) => JSON.parse(row.payload) as T);
}

function writeSnapshot(db: Database.Database, snapshot: OswellDatabase) {
  const write = db.transaction((next: OswellDatabase) => {
    db.prepare("DELETE FROM dashboard_records").run();
    db.prepare("DELETE FROM activity_events").run();
    db.prepare("DELETE FROM audit_events").run();

    const insertRecord = db.prepare(`
      INSERT INTO dashboard_records (scope, id, payload, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    const insertActivity = db.prepare(`
      INSERT INTO activity_events (id, timestamp, payload)
      VALUES (?, ?, ?)
    `);
    const insertAudit = db.prepare(`
      INSERT INTO audit_events (id, timestamp, payload)
      VALUES (?, ?, ?)
    `);

    for (const [scope, rows] of Object.entries(next.records)) {
      for (const row of rows) {
        const updatedAt = String(row.lastUpdated ?? row.time ?? new Date().toISOString());
        insertRecord.run(scope, row.id, JSON.stringify(row), updatedAt);
      }
    }

    for (const activity of next.activities.slice(0, 500)) {
      insertActivity.run(activity.id, activity.timestamp, JSON.stringify(activity));
    }

    for (const auditEvent of next.auditEvents.slice(0, 500)) {
      insertAudit.run(auditEvent.id, auditEvent.timestamp, JSON.stringify(auditEvent));
    }

    writeSetting(db, "seededAt", next.settings.seededAt);
    writeSetting(db, "schemaVersion", String(next.settings.version));
    writeSetting(db, "storage", next.settings.storage);
  });

  write({
    ...snapshot,
    records: applyProductionMetadata(snapshot.records)
  });
}

export function readDatabase(): OswellDatabase {
  const db = getConnection();
  const defaultSettings = {
    seededAt: readSetting(db, "seededAt") ?? "",
    version: Number(readSetting(db, "schemaVersion") ?? schemaVersion),
    storage: "sqlite" as const
  };
  const scopes = db.prepare("SELECT DISTINCT scope FROM dashboard_records ORDER BY scope").all() as Array<{ scope: string }>;
  const records = Object.fromEntries(
    scopes.map(({ scope }) => [scope, readRows(db, scope)])
  ) as Record<string, TableRow[]>;

  return {
    records: applyProductionMetadata(records),
    activities: readEvents<ActivityEvent>(db, "activity_events"),
    auditEvents: readEvents<AuditEvent>(db, "audit_events"),
    settings: defaultSettings
  };
}

export function writeDatabase(next: OswellDatabase) {
  writeSnapshot(getConnection(), next);
}

export function mutateDatabase(mutator: (databaseState: OswellDatabase) => OswellDatabase) {
  const current = readDatabase();
  const next = mutator(current);
  writeDatabase(next);
  return readDatabase();
}

export function addAuditTrail(databaseState: OswellDatabase, key: string, row: TableRow, action: string, before?: TableRow): OswellDatabase {
  return {
    ...databaseState,
    activities: [
      createActivityEvent({
        entityType: key,
        entity: row,
        action,
        description: `${row.name ?? row.id} ${action.toLowerCase()}.`
      }),
      ...databaseState.activities
    ].slice(0, 500),
    auditEvents: [
      createAuditEvent({
        action: action.toUpperCase().replaceAll(" ", "_"),
        entity: String(row.name ?? row.id),
        entityId: row.id,
        before: before ? JSON.stringify(before) : undefined,
        after: JSON.stringify(row),
        result: "Success"
      }),
      ...databaseState.auditEvents
    ].slice(0, 500)
  };
}

export function resetDatabase() {
  if (appMode !== "demo") {
    throw new Error("Demo reset is unavailable in live mode.");
  }
  const seeded = seedDatabase();
  writeDatabase(seeded);
  return readDatabase();
}
