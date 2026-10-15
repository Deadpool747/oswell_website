import type { TableRow } from "@/types/dashboard";

export type AuditEvent = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  before?: string;
  after?: string;
  result: "Success" | "Failed";
};

export type ActivityEvent = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
};

const systemActor = process.env.OSWELL_SYSTEM_ACTOR?.trim() || "System";

export function createAuditEvent({
  action,
  entity,
  entityId,
  before,
  after,
  result = "Success"
}: {
  action: string;
  entity: string;
  entityId: string;
  before?: string;
  after?: string;
  result?: "Success" | "Failed";
}): AuditEvent {
  return {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    user: systemActor,
    action,
    entity,
    entityId,
    before,
    after,
    result
  };
}

export function createActivityEvent({
  entityType,
  entity,
  action,
  description,
  metadata
}: {
  entityType: string;
  entity: TableRow;
  action: string;
  description: string;
  metadata?: Record<string, string | number | boolean>;
}): ActivityEvent {
  return {
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    entityType,
    entityId: entity.id,
    action,
    description,
    user: systemActor,
    timestamp: new Date().toISOString(),
    metadata
  };
}
