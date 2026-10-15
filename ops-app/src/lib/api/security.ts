import { apiFetch } from "@/lib/api/client";

export type PolicySummary = {
  source: string;
  provenance: string;
  policy_results: number;
  resources_evaluated: number;
  policy_definitions_evaluated: number;
  compliant: number;
  noncompliant: number;
  open_posture_findings: number;
};

export type PolicyResult = {
  id: string;
  resource_id: string | null;
  resource_type: string | null;
  resource_group: string | null;
  resource_location: string | null;
  compliance_state: string;
  policy_definition_display_name: string;
  policy_definition_description: string | null;
  policy_definition_id: string;
  policy_set_definition_id: string | null;
  effect: string | null;
  category: string | null;
  classification: string;
  oswell_posture_severity: string;
  priority_score: number;
  timestamp: string | null;
  provenance: string;
};

export type PolicyFinding = {
  id: string;
  title: string;
  resource_id: string | null;
  resource_type: string | null;
  policy_display_name: string;
  classification: string;
  oswell_posture_severity: string;
  priority_score: number;
  status: string;
  provenance: string;
};

export type PolicyInvestigation = {
  id: string;
  resource_id: string;
  agent_name: string;
  agent_version: string | null;
  response_id: string | null;
  latency_ms: number;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  conversation_id?: string | null;
  requested_by?: string | null;
  status: "AI_INVESTIGATED" | "HUMAN_REVIEW_REQUIRED";
  human_review_state: "PENDING" | "REVIEWED" | "RESOLVED";
  structured_result: {
    summary: string;
    risk_assessment: "low" | "medium" | "high" | "critical";
    confidence: number;
    posture_weaknesses: Array<{ title: string; evidence: string; policy_id: string; resource_id: string; risk: string }>;
    compliant_controls: Array<{ title: string; evidence: string }>;
    related_activity: Array<{ source: string; description: string; timestamp: string }>;
    correlations: string[];
    hypotheses: Array<{ description: string; confidence: number }>;
    recommended_actions: Array<{ priority: string; action: string; reason: string }>;
    requires_human_review: boolean;
  };
  included_evidence: Array<{ source: string; record_id: string; kind: string }>;
  created_at: string;
};

export type PolicySync = {
  sources: {
    AzurePolicyMCSB?: {
      fetched: number;
      created: number;
      updated: number;
      compliant: number;
      noncompliant: number;
      findings_created: number;
      findings_resolved: number;
      errors: number;
      reason?: string;
    };
  };
};

export const securityApi = {
  summary: () => apiFetch<PolicySummary>("/api/security/policy/summary"),
  results: () => apiFetch<PolicyResult[]>("/api/security/policy/results?limit=200"),
  findings: () => apiFetch<PolicyFinding[]>("/api/security/policy/findings?limit=200"),
  investigations: () => apiFetch<PolicyInvestigation[]>("/api/security/policy/investigations?limit=100"),
  sync: () => apiFetch<PolicySync>("/api/security/sync", { method: "POST" }),
  investigateResource: (resourceId: string) => apiFetch<{ investigation: PolicyInvestigation }>("/api/security/policy/resources/investigate", {
    method: "POST",
    body: JSON.stringify({ resource_id: resourceId }),
  }),
};
