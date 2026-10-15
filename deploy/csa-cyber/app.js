const STORAGE_KEY = "oswell-security-demo-v1";
const ORGANIZATIONS = ["Oswell Technologies", "Demo Healthcare", "Demo Finance"];
const ENVIRONMENTS = ["Production", "Staging", "Development"];
const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const ALERT_STATUSES = ["Open", "Investigating", "Resolved", "Queued"];
const RULE_SOURCES = [
  "AWS CloudTrail",
  "AWS GuardDuty",
  "Azure Entra ID",
  "Azure Activity Logs",
  "Sentinel",
  "Windows Events",
  "Syslog",
  "Firewall",
  "Application Logs",
];

const PAGE_GROUPS = [
  {
    label: "OVERVIEW",
    items: [
      ["dashboard", "Dashboard"],
      ["security-posture", "Security Posture"],
    ],
  },
  {
    label: "DETECTION",
    items: [
      ["alerts", "Alerts"],
      ["incidents", "Incidents"],
      ["investigations", "Investigations"],
      ["threat-intelligence", "Threat Intelligence"],
    ],
  },
  {
    label: "AI AGENTS",
    items: [
      ["agent-center", "Agent Center"],
      ["agent-threat-intel", "Threat Intel Agent"],
      ["agent-log-analysis", "Log Analysis Agent"],
      ["agent-investigation", "Investigation Agent"],
      ["agent-configuration", "Configuration Agent"],
      ["agent-policy", "Policy Agent"],
    ],
  },
  {
    label: "CLOUD SECURITY",
    items: [
      ["aws", "AWS"],
      ["azure", "Azure"],
      ["assets", "Assets"],
      ["configuration-scans", "Configuration Scans"],
    ],
  },
  {
    label: "SECURITY",
    items: [
      ["policies", "Policies"],
      ["detection-rules", "Detection Rules"],
      ["risk-rules", "Risk Rules"],
      ["threat-indicators", "Threat Indicators"],
    ],
  },
  {
    label: "AUTOMATION",
    items: [
      ["playbooks", "Playbooks"],
      ["approvals", "Approvals"],
      ["response-actions", "Response Actions"],
      ["agent-activity", "Agent Activity"],
    ],
  },
  {
    label: "DATA",
    items: [
      ["log-sources", "Log Sources"],
      ["integrations", "Integrations"],
    ],
  },
  {
    label: "REPORTING",
    items: [
      ["reports", "Reports"],
      ["compliance", "Compliance"],
      ["audit-logs", "Audit Logs"],
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      ["users", "Users"],
      ["roles", "Roles & Permissions"],
      ["settings", "Settings"],
    ],
  },
];

const PAGE_TITLES = Object.fromEntries(PAGE_GROUPS.flatMap((group) => group.items));

const app = document.getElementById("app");
const runtime = {
  timerIds: new Set(),
  intervalIds: new Set(),
  sidebarScrollTop: 0,
  contentScrollTop: 0,
  lastRouteKey: null,
};
const memoryStorage = new Map();

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryStorage.has(key) ? memoryStorage.get(key) : null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    memoryStorage.set(key, value);
    return false;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function isoHoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDateLong(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function severityClass(value) {
  return `severity-${String(value).toLowerCase()}`;
}

function statusClass(value) {
  return `status-${String(value).toLowerCase().replace(/\s+/g, "-")}`;
}

function riskSeverity(score) {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

function setByPath(target, path, value) {
  const parts = path.split(".");
  let ref = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (ref[parts[i]] === undefined) ref[parts[i]] = {};
    ref = ref[parts[i]];
  }
  ref[parts[parts.length - 1]] = value;
}

function getByPath(target, path) {
  return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), target);
}

function ensureUiShape(data) {
  const defaults = seedState().ui;
  return {
    ...defaults,
    ...data,
    pageModes: { ...defaults.pageModes, ...(data?.pageModes || {}) },
    alertFilters: { ...defaults.alertFilters, ...(data?.alertFilters || {}) },
    alertSort: { ...defaults.alertSort, ...(data?.alertSort || {}) },
    pagination: { ...defaults.pagination, ...(data?.pagination || {}) },
    tabs: { ...defaults.tabs, ...(data?.tabs || {}) },
    settingsDraft: { ...defaults.settingsDraft, ...(data?.settingsDraft || {}) },
  };
}

function seedState() {
  return {
    organization: "Oswell Technologies",
    environment: "Production",
    theme: "dark",
    notifications: [
      {
        id: uid("ntf"),
        title: "Critical incident created",
        body: "Possible AWS account compromise escalated to human review.",
        read: false,
        route: "incident/inc-204",
        createdAt: isoMinutesAgo(12),
      },
      {
        id: uid("ntf"),
        title: "Scan completed",
        body: "AWS production scan completed with 5 findings.",
        read: false,
        route: "configuration-scans",
        createdAt: isoMinutesAgo(28),
      },
      {
        id: uid("ntf"),
        title: "Detection rule triggered",
        body: "Impossible travel rule generated 12 alerts in the last hour.",
        read: true,
        route: "detection-rules",
        createdAt: isoHoursAgo(3),
      },
      {
        id: uid("ntf"),
        title: "Human approval requested",
        body: "Threat Intel Agent recommends blocking 185.220.101.24.",
        read: false,
        route: "approvals",
        createdAt: isoHoursAgo(1.5),
      },
      {
        id: uid("ntf"),
        title: "Agent investigation completed",
        body: "Investigation Agent correlated 5 authentication anomalies.",
        read: true,
        route: "investigations",
        createdAt: isoHoursAgo(6),
      },
    ],
    alerts: [
      {
        id: "ALT-10284",
        title: "Multiple admin logins from anonymized IP",
        severity: "Critical",
        riskScore: 96,
        source: "AWS CloudTrail",
        agent: "Threat Intel Agent",
        user: "fareez.khan",
        asset: "aws-prod-account",
        ip: "185.220.101.24",
        rule: "Privileged login from known bad IP",
        status: "Open",
        timestamp: isoMinutesAgo(18),
        assignedTo: "Alex Morgan",
        tags: ["Credential attack"],
      },
      {
        id: "ALT-10283",
        title: "Impossible travel sign-in detected",
        severity: "High",
        riskScore: 81,
        source: "Azure Entra ID",
        agent: "Investigation Agent",
        user: "sarah.wilson",
        asset: "entra-prod-tenant",
        ip: "61.177.172.53",
        rule: "Impossible travel access pattern",
        status: "Investigating",
        timestamp: isoMinutesAgo(32),
        assignedTo: "Sarah Wilson",
        tags: ["Identity"],
      },
      {
        id: "ALT-10282",
        title: "Public S3 bucket with customer exports",
        severity: "Critical",
        riskScore: 92,
        source: "AWS Security Hub",
        agent: "Configuration Agent",
        user: "service-account",
        asset: "s3-customer-exports",
        ip: "Internal",
        rule: "Public storage exposure",
        status: "Open",
        timestamp: isoHoursAgo(1),
        assignedTo: "Alex Morgan",
        tags: ["Data exposure"],
      },
      {
        id: "ALT-10281",
        title: "Large outbound data transfer",
        severity: "High",
        riskScore: 78,
        source: "Firewall",
        agent: "Log Analysis Agent",
        user: "fareez.khan",
        asset: "vpn-gateway-01",
        ip: "10.14.2.88",
        rule: "Large data download",
        status: "Open",
        timestamp: isoHoursAgo(2),
        assignedTo: "Unassigned",
        tags: ["Exfiltration"],
      },
      {
        id: "ALT-10280",
        title: "MFA disabled for privileged account",
        severity: "High",
        riskScore: 74,
        source: "AWS IAM",
        agent: "Policy Agent",
        user: "fareez.khan",
        asset: "aws-prod-account",
        ip: "Internal",
        rule: "Privileged MFA disabled",
        status: "Resolved",
        timestamp: isoHoursAgo(4),
        assignedTo: "Sarah Wilson",
        tags: ["Control weakness"],
      },
      {
        id: "ALT-10279",
        title: "Excessive role assignment detected",
        severity: "Medium",
        riskScore: 54,
        source: "Azure Activity Logs",
        agent: "Policy Agent",
        user: "john.smith",
        asset: "finance-subscription",
        ip: "20.44.18.14",
        rule: "Excessive privilege grant",
        status: "Queued",
        timestamp: isoHoursAgo(6),
        assignedTo: "Unassigned",
        tags: ["Privilege"],
      },
      {
        id: "ALT-10278",
        title: "New device used for admin login",
        severity: "Medium",
        riskScore: 47,
        source: "Okta",
        agent: "Investigation Agent",
        user: "alex.morgan",
        asset: "okta-org",
        ip: "34.117.211.8",
        rule: "New device authentication",
        status: "Open",
        timestamp: isoHoursAgo(10),
        assignedTo: "Alex Morgan",
        tags: ["Authentication"],
      },
      {
        id: "ALT-10277",
        title: "RDS encryption disabled",
        severity: "Medium",
        riskScore: 44,
        source: "AWS Config",
        agent: "Configuration Agent",
        user: "db-admin",
        asset: "orders-rds-prod",
        ip: "Internal",
        rule: "Database encryption disabled",
        status: "Investigating",
        timestamp: isoHoursAgo(12),
        assignedTo: "Sarah Wilson",
        tags: ["Cloud posture"],
      },
      {
        id: "ALT-10276",
        title: "Suspicious PowerShell sequence",
        severity: "High",
        riskScore: 66,
        source: "Windows Events",
        agent: "Log Analysis Agent",
        user: "svc-patcher",
        asset: "jump-host-02",
        ip: "172.24.8.19",
        rule: "Encoded PowerShell execution",
        status: "Open",
        timestamp: isoHoursAgo(15),
        assignedTo: "Alex Morgan",
        tags: ["Endpoint"],
      },
      {
        id: "ALT-10275",
        title: "GreyNoise noisy scanner matched perimeter IP",
        severity: "Low",
        riskScore: 18,
        source: "GreyNoise",
        agent: "Threat Intel Agent",
        user: "N/A",
        asset: "edge-fw-01",
        ip: "89.248.172.16",
        rule: "Known scan infrastructure",
        status: "Resolved",
        timestamp: isoHoursAgo(18),
        assignedTo: "John Smith",
        tags: ["Reconnaissance"],
      },
      {
        id: "ALT-10274",
        title: "Policy drift in production VPC",
        severity: "Medium",
        riskScore: 40,
        source: "AWS VPC",
        agent: "Configuration Agent",
        user: "service-network",
        asset: "vpc-prod-main",
        ip: "Internal",
        rule: "Unapproved egress change",
        status: "Open",
        timestamp: isoHoursAgo(20),
        assignedTo: "Unassigned",
        tags: ["Network"],
      },
      {
        id: "ALT-10273",
        title: "Repeated failed sign-ins across 14 accounts",
        severity: "High",
        riskScore: 69,
        source: "Azure Entra ID",
        agent: "Log Analysis Agent",
        user: "Multiple",
        asset: "entra-prod-tenant",
        ip: "45.83.64.11",
        rule: "Password spray attempts",
        status: "Open",
        timestamp: isoHoursAgo(23),
        assignedTo: "Alex Morgan",
        tags: ["Identity"],
      },
    ],
    incidents: [
      {
        id: "inc-204",
        title: "Possible AWS Account Compromise",
        severity: "Critical",
        riskScore: 94,
        status: "Investigating",
        assignedTo: "Alex Morgan",
        createdAt: isoMinutesAgo(58),
        updatedAt: isoMinutesAgo(9),
        source: "AWS CloudTrail",
        user: "fareez.khan",
        asset: "aws-prod-account",
        detected: isoMinutesAgo(58),
        dataSource: "AWS CloudTrail + GuardDuty + Threat Intel",
        affectedUsers: ["fareez.khan"],
        affectedAssets: ["aws-prod-account", "s3-customer-exports"],
        aiSummary:
          "A privileged AWS account authenticated from a new device and an IP associated with malicious infrastructure. The account subsequently accessed sensitive storage and downloaded an unusually large volume of data.",
        timeline: [
          { id: uid("evt"), time: "02:31", event: "Failed authentication from 185.220.101.24" },
          { id: uid("evt"), time: "02:34", event: "Successful login with privileged AWS account" },
          { id: uid("evt"), time: "02:36", event: "MFA configuration changed" },
          { id: uid("evt"), time: "02:38", event: "IAM privilege escalated" },
          { id: uid("evt"), time: "02:43", event: "Sensitive S3 bucket accessed" },
          { id: uid("evt"), time: "02:46", event: "9.2 GB downloaded from exports bucket" },
        ],
        threatIntel: [
          { source: "AbuseIPDB", verdict: "Malicious", detail: "Credential abuse infrastructure" },
          { source: "VirusTotal", verdict: "8 detections", detail: "Seen in recent malware pivots" },
          { source: "AlienVault OTX", verdict: "Matched", detail: "Known credential attack infrastructure" },
        ],
        evidence: [
          "GuardDuty finding gd-92831",
          "CloudTrail event ct-101399",
          "Firewall transfer session fw-441029",
        ],
        rawLogs: ["evt-77829", "evt-77830", "evt-77831"],
        comments: [
          { id: uid("cmt"), author: "Sarah Wilson", text: "Escalate if exfiltration confirmed.", at: isoMinutesAgo(22) },
        ],
        activity: [
          { id: uid("act"), actor: "Threat Intel Agent", action: "Matched IP against 6 intel sources", at: isoMinutesAgo(18) },
          { id: uid("act"), actor: "Alex Morgan", action: "Assigned incident to self", at: isoMinutesAgo(12) },
        ],
      },
      {
        id: "inc-203",
        title: "Privileged Azure Identity Abuse Attempt",
        severity: "High",
        riskScore: 81,
        status: "Open",
        assignedTo: "Sarah Wilson",
        createdAt: isoHoursAgo(3),
        updatedAt: isoHoursAgo(1),
        source: "Azure Entra ID",
        user: "sarah.wilson",
        asset: "entra-prod-tenant",
        detected: isoHoursAgo(3),
        dataSource: "Azure Entra ID + Sentinel",
        affectedUsers: ["sarah.wilson"],
        affectedAssets: ["entra-prod-tenant"],
        aiSummary: "Multiple sign-ins across distant geographies and suspicious token reuse indicate likely identity abuse.",
        timeline: [
          { id: uid("evt"), time: "07:11", event: "New device sign-in from Frankfurt" },
          { id: uid("evt"), time: "07:19", event: "Token reused from Singapore" },
          { id: uid("evt"), time: "07:25", event: "Impossible travel policy fired" },
        ],
        threatIntel: [],
        evidence: ["Sentinel correlation cor-21883"],
        rawLogs: ["evt-77112"],
        comments: [],
        activity: [],
      },
      {
        id: "inc-202",
        title: "Public Cloud Storage Exposure",
        severity: "Critical",
        riskScore: 90,
        status: "Open",
        assignedTo: "Alex Morgan",
        createdAt: isoHoursAgo(9),
        updatedAt: isoHoursAgo(5),
        source: "Configuration Agent",
        user: "service-account",
        asset: "s3-customer-exports",
        detected: isoHoursAgo(9),
        dataSource: "AWS Config + Security Hub",
        affectedUsers: ["service-account"],
        affectedAssets: ["s3-customer-exports"],
        aiSummary: "A customer export bucket is publicly accessible and contains regulated data exports.",
        timeline: [
          { id: uid("evt"), time: "09:02", event: "Bucket ACL changed to public" },
          { id: uid("evt"), time: "09:11", event: "Object listing from untrusted ASN" },
        ],
        threatIntel: [],
        evidence: ["Config finding cfg-18002"],
        rawLogs: ["evt-76155"],
        comments: [],
        activity: [],
      },
    ],
    investigations: [
      {
        id: "inv-301",
        title: "Suspicious Privileged Account Activity",
        status: "Running",
        riskScore: 86,
        correlatedAlerts: [
          "Failed logins",
          "New device login",
          "Impossible travel",
          "Privilege escalation",
          "Large data download",
        ],
        chain: [
          "Credential Attack",
          "Account Compromise",
          "Privilege Escalation",
          "Sensitive Data Access",
          "Possible Exfiltration",
        ],
        owner: "Investigation Agent",
        updatedAt: isoMinutesAgo(14),
      },
      {
        id: "inv-300",
        title: "Suspicious PowerShell on Jump Host",
        status: "Review",
        riskScore: 63,
        correlatedAlerts: ["Encoded command", "Unusual parent process", "Network beaconing"],
        chain: ["Script Execution", "Persistence Check", "Outbound Beacon"],
        owner: "Investigation Agent",
        updatedAt: isoHoursAgo(2),
      },
    ],
    agents: [
      {
        id: "agent-threat-intel",
        route: "agent-threat-intel",
        name: "Threat Intel Agent",
        status: "Running",
        description: "Enriches external indicators and checks internal exposure.",
        metrics: [
          ["Indicators checked", "3,482"],
          ["Threats identified", "37"],
        ],
        lastRun: isoMinutesAgo(7),
        recentAction: "Matched malicious Tor exit node against admin sign-in.",
      },
      {
        id: "agent-log-analysis",
        route: "agent-log-analysis",
        name: "Log Analysis Agent",
        status: "Running",
        description: "Correlates logs across identity, cloud, endpoint, and network telemetry.",
        metrics: [
          ["Events analyzed", "1.8M"],
          ["Anomalies", "143"],
        ],
        lastRun: isoMinutesAgo(4),
        recentAction: "Correlated 1,284 authentication events into 3 attack stories.",
      },
      {
        id: "agent-investigation",
        route: "agent-investigation",
        name: "Investigation Agent",
        status: "Running",
        description: "Builds timelines, evidence summaries, and escalation recommendations.",
        metrics: [
          ["Investigations active", "23"],
          ["Escalated", "8"],
        ],
        lastRun: isoMinutesAgo(10),
        recentAction: "Escalated privileged AWS activity to a critical incident.",
      },
      {
        id: "agent-configuration",
        route: "agent-configuration",
        name: "Configuration Agent",
        status: "Paused",
        description: "Scans cloud configuration drift and policy violations.",
        metrics: [
          ["Resources checked", "214"],
          ["Findings", "12"],
        ],
        lastRun: isoHoursAgo(3),
        recentAction: "Discovered public storage and MFA gaps in production.",
      },
      {
        id: "agent-policy",
        route: "agent-policy",
        name: "Policy Agent",
        status: "Running",
        description: "Applies business rules and scores operational risk.",
        metrics: [
          ["Active rules", "184"],
          ["Events evaluated", "24,631"],
        ],
        lastRun: isoMinutesAgo(2),
        recentAction: "Increased risk score for privileged activity outside business hours.",
      },
    ],
    scans: [
      {
        id: "scan-900",
        provider: "AWS",
        scope: "Production account",
        status: "Completed",
        progress: 100,
        phase: "Completed",
        findings: [
          { id: uid("fnd"), severity: "Critical", title: "Public S3 Bucket", detail: "Customer export bucket is public." },
          { id: uid("fnd"), severity: "High", title: "AdministratorAccess assigned unnecessarily", detail: "Role used by CI/CD has excessive privilege." },
          { id: uid("fnd"), severity: "High", title: "MFA disabled for privileged account", detail: "Admin account missing MFA enforcement." },
          { id: uid("fnd"), severity: "Medium", title: "Old access keys detected", detail: "Two IAM access keys older than 180 days." },
        ],
        createdAt: isoHoursAgo(1),
      },
      {
        id: "scan-899",
        provider: "Azure",
        scope: "Finance subscription",
        status: "Completed",
        progress: 100,
        phase: "Completed",
        findings: [
          { id: uid("fnd"), severity: "High", title: "Public VM ports", detail: "RDP exposed to the internet." },
          { id: uid("fnd"), severity: "Medium", title: "Logging disabled", detail: "Diagnostic settings missing on key subscription resources." },
        ],
        createdAt: isoHoursAgo(8),
      },
    ],
    rules: [
      {
        id: "rule-1",
        name: "Privileged login from known bad IP",
        description: "Detect privileged authentication from malicious infrastructure.",
        source: "AWS CloudTrail",
        severity: "Critical",
        status: "Enabled",
        triggerCount: 18,
        lastTriggered: isoMinutesAgo(18),
        updatedBy: "Sarah Wilson",
        conditionField: "ip_reputation_score",
        conditionOperator: "greater than",
        conditionValue: "80",
        groupBy: "source_ip",
        window: "15 minutes",
        actions: ["Create Alert", "Run Threat Intelligence", "Start AI Investigation", "Request Human Review"],
      },
      {
        id: "rule-2",
        name: "Impossible travel access pattern",
        description: "Detect impossible travel between sign-ins.",
        source: "Azure Entra ID",
        severity: "High",
        status: "Enabled",
        triggerCount: 42,
        lastTriggered: isoMinutesAgo(30),
        updatedBy: "Alex Morgan",
        conditionField: "geo_distance",
        conditionOperator: "greater than",
        conditionValue: "4000",
        groupBy: "user",
        window: "30 minutes",
        actions: ["Create Alert", "Notify Analyst"],
      },
      {
        id: "rule-3",
        name: "Encoded PowerShell execution",
        description: "Flag encoded PowerShell launches on sensitive systems.",
        source: "Windows Events",
        severity: "High",
        status: "Disabled",
        triggerCount: 9,
        lastTriggered: isoHoursAgo(5),
        updatedBy: "Fareez Khan",
        conditionField: "command_line",
        conditionOperator: "contains",
        conditionValue: "EncodedCommand",
        groupBy: "host",
        window: "5 minutes",
        actions: ["Create Alert", "Start AI Investigation"],
      },
    ],
    policies: [
      {
        id: "pol-1",
        name: "Privileged Login Policy",
        logic: "User Role = Administrator AND Country != Approved Country AND Login Time outside Business Hours",
        result: "Risk +40, Start Investigation, Request Human Review",
        enabled: true,
        owner: "Security Manager",
      },
      {
        id: "pol-2",
        name: "Public Storage Policy",
        logic: "Storage Exposure = Public",
        result: "Severity = Critical, Create Incident, Notify Security Team",
        enabled: true,
        owner: "Cloud Security",
      },
      {
        id: "pol-3",
        name: "Disabled MFA Escalation",
        logic: "Privileged Account MFA = Disabled",
        result: "Risk +30, Create Alert, Notify Analyst",
        enabled: false,
        owner: "IAM Team",
      },
    ],
    riskConfig: {
      scores: {
        maliciousIp: 25,
        privilegedAccount: 20,
        impossibleTravel: 10,
        largeDownload: 20,
        newDevice: 5,
        publicResource: 25,
      },
      ranges: {
        low: 24,
        medium: 49,
        high: 74,
        critical: 100,
      },
    },
    assets: [
      { id: "ast-1", name: "aws-prod-account", type: "Cloud Account", provider: "AWS", environment: "Production", owner: "Cloud Team", risk: "Critical", findings: 4, lastSeen: isoMinutesAgo(8) },
      { id: "ast-2", name: "s3-customer-exports", type: "Storage", provider: "AWS", environment: "Production", owner: "Data Platform", risk: "Critical", findings: 3, lastSeen: isoMinutesAgo(18) },
      { id: "ast-3", name: "entra-prod-tenant", type: "Application", provider: "Azure", environment: "Production", owner: "Identity Team", risk: "High", findings: 5, lastSeen: isoMinutesAgo(20) },
      { id: "ast-4", name: "orders-rds-prod", type: "Database", provider: "AWS", environment: "Production", owner: "DBA Team", risk: "Medium", findings: 1, lastSeen: isoHoursAgo(2) },
      { id: "ast-5", name: "jump-host-02", type: "Server", provider: "AWS", environment: "Staging", owner: "Infra Ops", risk: "High", findings: 2, lastSeen: isoMinutesAgo(44) },
      { id: "ast-6", name: "vpn-gateway-01", type: "VM", provider: "AWS", environment: "Production", owner: "Network Team", risk: "High", findings: 2, lastSeen: isoMinutesAgo(12) },
      { id: "ast-7", name: "okta-org", type: "Application", provider: "Identity", environment: "Production", owner: "IAM Team", risk: "Medium", findings: 1, lastSeen: isoHoursAgo(1) },
      { id: "ast-8", name: "finance-subscription", type: "Cloud Account", provider: "Azure", environment: "Production", owner: "Finance IT", risk: "Medium", findings: 3, lastSeen: isoHoursAgo(3) },
    ],
    integrations: [
      { id: "int-aws", name: "AWS", category: "Cloud", status: "Connected", detail: "Production + staging accounts" },
      { id: "int-azure", name: "Microsoft Azure", category: "Cloud", status: "Connected", detail: "Primary tenant and finance subscription" },
      { id: "int-sentinel", name: "Microsoft Sentinel", category: "SIEM", status: "Connected", detail: "Workspace eastus-secops" },
      { id: "int-splunk", name: "Splunk", category: "SIEM", status: "Not Connected", detail: "No HEC configured" },
      { id: "int-vt", name: "VirusTotal", category: "Threat Intelligence", status: "Connected", detail: "Demo enrichment profile" },
      { id: "int-abuse", name: "AbuseIPDB", category: "Threat Intelligence", status: "Connected", detail: "API profile simulated" },
      { id: "int-otx", name: "AlienVault OTX", category: "Threat Intelligence", status: "Connected", detail: "Pulse feeds enabled" },
      { id: "int-misp", name: "MISP", category: "Threat Intelligence", status: "Not Connected", detail: "Awaiting simulated token" },
      { id: "int-grey", name: "GreyNoise", category: "Threat Intelligence", status: "Connected", detail: "Community feed simulated" },
      { id: "int-entra", name: "Microsoft Entra ID", category: "Identity", status: "Connected", detail: "SCIM + sign-in logs" },
      { id: "int-okta", name: "Okta", category: "Identity", status: "Connected", detail: "Event hooks enabled" },
      { id: "int-slack", name: "Slack", category: "Communication", status: "Connected", detail: "Channel #soc-alerts" },
      { id: "int-teams", name: "Microsoft Teams", category: "Communication", status: "Not Connected", detail: "No webhook configured" },
      { id: "int-email", name: "Email", category: "Communication", status: "Connected", detail: "alerts@oswellsecurity.demo" },
    ],
    logSources: [
      { id: "src-1", source: "AWS CloudTrail", provider: "AWS", eventsToday: "1,382,918", eps: 214, status: "Healthy", lastEvent: isoMinutesAgo(1), health: "99.98%" },
      { id: "src-2", source: "Azure Entra ID", provider: "Azure", eventsToday: "843,921", eps: 162, status: "Healthy", lastEvent: isoMinutesAgo(2), health: "99.96%" },
      { id: "src-3", source: "Windows Security", provider: "Endpoint", eventsToday: "182,492", eps: 28, status: "Warning", lastEvent: isoMinutesAgo(9), health: "95.10%" },
      { id: "src-4", source: "Perimeter Firewall", provider: "Network", eventsToday: "391,248", eps: 74, status: "Healthy", lastEvent: isoMinutesAgo(1), health: "99.20%" },
    ],
    rawLogs: [
      {
        id: "evt-77829",
        source: "AWS CloudTrail",
        user: "fareez.khan",
        ip: "185.220.101.24",
        eventType: "ConsoleLogin",
        severity: "Critical",
        suspicious: true,
        expanded: false,
        timestamp: isoMinutesAgo(58),
        body: {
          eventName: "ConsoleLogin",
          awsRegion: "us-east-1",
          sourceIPAddress: "185.220.101.24",
          userIdentity: { type: "IAMUser", userName: "fareez.khan" },
          additionalEventData: { MFAUsed: "No", LoginTo: "https://console.aws.amazon.com" },
        },
      },
      {
        id: "evt-77830",
        source: "AWS CloudTrail",
        user: "fareez.khan",
        ip: "185.220.101.24",
        eventType: "UpdateMFADevice",
        severity: "High",
        suspicious: true,
        expanded: false,
        timestamp: isoMinutesAgo(54),
        body: {
          eventName: "UpdateMFADevice",
          requestParameters: { serialNumber: "arn:aws:iam::mfa/fareez.khan" },
          responseElements: { status: "success" },
        },
      },
      {
        id: "evt-77112",
        source: "Azure Entra ID",
        user: "sarah.wilson",
        ip: "61.177.172.53",
        eventType: "TokenIssued",
        severity: "High",
        suspicious: false,
        expanded: false,
        timestamp: isoHoursAgo(3),
        body: {
          operationName: "Issue Token",
          appDisplayName: "Office 365",
          location: "Singapore",
          riskLevel: "high",
        },
      },
      {
        id: "evt-76155",
        source: "AWS Config",
        user: "service-account",
        ip: "Internal",
        eventType: "S3BucketAclChange",
        severity: "Critical",
        suspicious: true,
        expanded: false,
        timestamp: isoHoursAgo(9),
        body: {
          bucketName: "customer-exports-prod",
          acl: "public-read",
          actor: "service-account",
          findingId: "cfg-18002",
        },
      },
    ],
    playbooks: [
      {
        id: "pb-1",
        name: "Suspicious IP Investigation",
        enabled: true,
        steps: [
          "Check threat intelligence",
          "Search internal logs",
          "Identify impacted users",
          "Calculate risk",
          "Create incident",
          "Request human review",
        ],
        runStatus: "Idle",
        progress: 0,
      },
      {
        id: "pb-2",
        name: "Compromised Account",
        enabled: true,
        steps: [
          "Analyze sign-in history",
          "Check device",
          "Review privileges",
          "Review data access",
          "Recommend account lock",
          "Request approval",
        ],
        runStatus: "Idle",
        progress: 0,
      },
    ],
    approvals: [
      {
        id: "apr-1",
        title: "Block IP Address",
        requestedBy: "Threat Intel Agent",
        target: "185.220.101.24",
        reason: "Known malicious IP associated with credential attacks.",
        status: "Pending",
        createdAt: isoMinutesAgo(18),
      },
      {
        id: "apr-2",
        title: "Disable User Account",
        requestedBy: "Investigation Agent",
        target: "fareez.khan",
        reason: "High confidence compromise with ongoing high-risk activity.",
        status: "Pending",
        createdAt: isoMinutesAgo(42),
      },
    ],
    responseActions: [
      { id: "rsp-1", action: "Notify Analyst", target: "Alex Morgan", status: "Completed", requestedBy: "Policy Agent", createdAt: isoMinutesAgo(11) },
      { id: "rsp-2", action: "Request Human Review", target: "Possible AWS Account Compromise", status: "Queued", requestedBy: "Investigation Agent", createdAt: isoMinutesAgo(16) },
      { id: "rsp-3", action: "Simulate Block IP", target: "185.220.101.24", status: "Awaiting Approval", requestedBy: "Threat Intel Agent", createdAt: isoMinutesAgo(18) },
    ],
    reports: [],
    threatLookups: [],
    threatIndicators: [
      { id: "ioc-1", type: "IP", value: "185.220.101.24", confidence: "High", lastSeen: isoMinutesAgo(18), category: "Credential Attack Infrastructure" },
      { id: "ioc-2", type: "Domain", value: "malicious-example.com", confidence: "Medium", lastSeen: isoHoursAgo(5), category: "C2 Domain" },
      { id: "ioc-3", type: "Hash", value: "8d2f8b7ea6ef4da3219f9c31ca19876fd1e87a2f74df999a2b3be611f6afc0af", confidence: "High", lastSeen: isoHoursAgo(8), category: "Credential Stealer" },
    ],
    complianceChecks: [
      { id: "cmp-1", name: "SOC 2 Monitoring Coverage", framework: "SOC 2", score: 94, status: "Passing" },
      { id: "cmp-2", name: "CIS IAM Controls", framework: "CIS", score: 72, status: "Needs Attention" },
      { id: "cmp-3", name: "HIPAA Audit Logging", framework: "HIPAA", score: 88, status: "Passing" },
      { id: "cmp-4", name: "PCI Public Access Controls", framework: "PCI DSS", score: 69, status: "Needs Attention" },
    ],
    users: [
      { id: "usr-1", name: "Fareez Khan", email: "fareez@oswellsecurity.demo", role: "Administrator", status: "Active" },
      { id: "usr-2", name: "Alex Morgan", email: "alex@oswellsecurity.demo", role: "SOC Analyst", status: "Active" },
      { id: "usr-3", name: "Sarah Wilson", email: "sarah@oswellsecurity.demo", role: "Security Manager", status: "Active" },
      { id: "usr-4", name: "John Smith", email: "john@oswellsecurity.demo", role: "Viewer", status: "Disabled" },
    ],
    roles: [
      {
        id: "role-1",
        name: "Administrator",
        permissions: {
          dashboard: true,
          investigations: true,
          rules: true,
          approvals: true,
          settings: true,
        },
      },
      {
        id: "role-2",
        name: "Security Manager",
        permissions: {
          dashboard: true,
          investigations: true,
          rules: true,
          approvals: true,
          settings: false,
        },
      },
      {
        id: "role-3",
        name: "SOC Analyst",
        permissions: {
          dashboard: true,
          investigations: true,
          rules: false,
          approvals: false,
          settings: false,
        },
      },
      {
        id: "role-4",
        name: "Viewer",
        permissions: {
          dashboard: true,
          investigations: false,
          rules: false,
          approvals: false,
          settings: false,
        },
      },
    ],
    auditLogs: [
      { id: uid("aud"), actor: "User", action: "Created detection rule", target: "Privileged login from known bad IP", at: isoHoursAgo(2) },
      { id: uid("aud"), actor: "User", action: "Changed severity", target: "ALT-10283 -> High", at: isoHoursAgo(3) },
      { id: uid("aud"), actor: "Threat Intel Agent", action: "Requested simulated block", target: "185.220.101.24", at: isoMinutesAgo(18) },
      { id: uid("aud"), actor: "Policy Agent", action: "Ran rule", target: "Public Storage Policy", at: isoMinutesAgo(48) },
      { id: uid("aud"), actor: "Admin", action: "Changed risk score configuration", target: "Public Cloud Resource +25", at: isoHoursAgo(12) },
    ],
    agentActivity: [
      { id: uid("agt"), timestamp: isoMinutesAgo(4), agent: "Threat Intel Agent", action: "Checked IP reputation", tool: "Threat Intel", target: "185.220.101.24", result: "Malicious", risk: "Critical", approval: "Requested" },
      { id: uid("agt"), timestamp: isoMinutesAgo(4), agent: "Investigation Agent", action: "Correlated authentication events", tool: "Correlation Engine", target: "42 events", result: "High Risk", risk: "High", approval: "Not Required" },
      { id: uid("agt"), timestamp: isoMinutesAgo(7), agent: "Configuration Agent", action: "Discovered 3 findings", tool: "Config Scanner", target: "AWS Production", result: "Escalated", risk: "High", approval: "Not Required" },
      { id: uid("agt"), timestamp: isoMinutesAgo(12), agent: "Policy Agent", action: "Evaluated event stream", tool: "Risk Engine", target: "24,631 events", result: "31 incidents", risk: "Mixed", approval: "Human Review" },
    ],
    settings: {
      general: {
        severityThreshold: "Medium",
        cloudEnvironment: "Production",
      },
      security: {
        autoStartInvestigations: true,
        requireHumanApproval: true,
      },
      aiAgents: {
        autonomousInvestigations: true,
        enrichmentDepth: "Deep",
      },
      notifications: {
        criticalIncidents: true,
        playbookRuns: true,
        digests: false,
      },
      appearance: {
        theme: "dark",
      },
      dataRetention: {
        alertsDays: 90,
        logsDays: 365,
      },
    },
    ui: {
      sidebarOpen: false,
      notificationsOpen: false,
      profileOpen: false,
      helpOpen: false,
      globalSearch: "",
      modal: null,
      drawer: null,
      toasts: [],
      pageModes: {},
      alertFilters: {
        search: "",
        severity: "",
        status: "",
        source: "",
        agent: "",
        user: "",
        asset: "",
        date: "",
        risk: "",
      },
      alertSort: {
        key: "timestamp",
        direction: "desc",
      },
      selections: {
        alerts: [],
      },
      pagination: {
        alerts: 1,
        rules: 1,
        logs: 1,
      },
      tabs: {
        incident: "overview",
        settings: "general",
      },
      rawLogFilters: {
        search: "",
        source: "",
        user: "",
        ip: "",
        eventType: "",
        severity: "",
      },
      reportPreviewId: null,
      settingsDraft: {},
    },
  };
}

function loadState() {
  try {
    const raw = storageGet(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    parsed.ui = ensureUiShape(parsed.ui);
    return parsed;
  } catch {
    return seedState();
  }
}

let state = loadState();
state.ui = ensureUiShape(state.ui);

function saveState() {
  const persist = clone(state);
  persist.ui.toasts = [];
  persist.ui.notificationsOpen = false;
  persist.ui.profileOpen = false;
  persist.ui.helpOpen = false;
  storageSet(STORAGE_KEY, JSON.stringify(persist));
}

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) return { key: "dashboard" };
  if (hash.startsWith("incident/")) return { key: "incident-details", id: hash.split("/")[1] };
  if (hash.startsWith("asset/")) return { key: "asset-details", id: hash.split("/")[1] };
  return { key: hash };
}

function navigate(route) {
  const nextHash = `#/${route}`;
  state.ui.sidebarOpen = false;
  state.ui.globalSearch = "";
  state.ui.notificationsOpen = false;
  state.ui.profileOpen = false;
  saveState();
  if (window.location.hash === nextHash) {
    render();
    return;
  }
  window.location.hash = nextHash;
}

function currentRouteKey() {
  const route = parseRoute();
  return route.key;
}

function toast(title, body, tone = "info") {
  const item = { id: uid("toast"), title, body, tone };
  state.ui.toasts = [item, ...state.ui.toasts].slice(0, 4);
  render();
  const timer = setTimeout(() => {
    state.ui.toasts = state.ui.toasts.filter((entry) => entry.id !== item.id);
    render();
  }, 3200);
  runtime.timerIds.add(timer);
}

function addAudit(actor, action, target) {
  state.auditLogs.unshift({ id: uid("aud"), actor, action, target, at: nowIso() });
}

function addNotification(title, body, route) {
  state.notifications.unshift({
    id: uid("ntf"),
    title,
    body,
    read: false,
    route,
    createdAt: nowIso(),
  });
}

function addAgentActivity(agent, action, tool, target, result, risk, approval) {
  state.agentActivity.unshift({
    id: uid("agt"),
    timestamp: nowIso(),
    agent,
    action,
    tool,
    target,
    result,
    risk,
    approval,
  });
}

function organizationSummary() {
  const map = {
    "Oswell Technologies": { score: 82, assets: 214, alerts: 12842 },
    "Demo Healthcare": { score: 78, assets: 188, alerts: 11041 },
    "Demo Finance": { score: 85, assets: 241, alerts: 14228 },
  };
  return map[state.organization] || map["Oswell Technologies"];
}

function bodyClass() {
  document.body.classList.toggle("theme-light", state.theme === "light");
  document.body.classList.toggle("sidebar-open", state.ui.sidebarOpen);
}

function metricCards() {
  const summary = organizationSummary();
  return [
    ["Total Alerts", summary.alerts.toLocaleString(), `${filteredAlerts().length} visible in current workspace`],
    ["Critical Incidents", state.incidents.filter((item) => item.severity === "Critical").length, "Priority queue for human review"],
    ["High Priority", state.alerts.filter((item) => item.riskScore >= 70).length, "Signals above 70 risk"],
    ["Active Investigations", state.investigations.filter((item) => item.status !== "Closed").length, "AI-led investigations in motion"],
    ["Threats Blocked", 27, "Simulated actions approved this week"],
    ["Assets Monitored", summary.assets, `${state.environment} environment selected`],
    ["Security Score", `${summary.score}/100`, "Updated from posture + findings"],
    ["AI Compression Ratio", "29.4x", "Millions of logs compressed into analyst actions"],
  ];
}

function filteredAlerts() {
  let list = [...state.alerts];
  const { search, severity, status, source, agent, user, asset, risk } = state.ui.alertFilters;
  if (search) {
    const needle = search.toLowerCase();
    list = list.filter((item) =>
      [item.id, item.title, item.ip, item.rule, item.user, item.asset].some((value) =>
        String(value).toLowerCase().includes(needle)
      )
    );
  }
  if (severity) list = list.filter((item) => item.severity === severity);
  if (status) list = list.filter((item) => item.status === status);
  if (source) list = list.filter((item) => item.source === source);
  if (agent) list = list.filter((item) => item.agent === agent);
  if (user) list = list.filter((item) => item.user === user);
  if (asset) list = list.filter((item) => item.asset === asset);
  if (risk) {
    if (risk === "75+") list = list.filter((item) => item.riskScore >= 75);
    if (risk === "50-74") list = list.filter((item) => item.riskScore >= 50 && item.riskScore < 75);
    if (risk === "0-49") list = list.filter((item) => item.riskScore < 50);
  }
  const { key, direction } = state.ui.alertSort;
  list.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    const base =
      key === "riskScore"
        ? Number(va) - Number(vb)
        : String(va).localeCompare(String(vb));
    return direction === "asc" ? base : -base;
  });
  return list;
}

function paged(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function priorityIncidents() {
  return [...state.incidents].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
}

function aiActivityFeed() {
  return [
    `Threat Intel Agent checked 184 IP addresses`,
    `Log Analysis Agent correlated 1,284 authentication events`,
    `Configuration Agent discovered 3 high-risk findings`,
    `Policy Agent evaluated 24,631 events`,
  ];
}

function renderBadge(label, type = "") {
  const cls = type ? `${type}-${String(label).toLowerCase()}` : "";
  return `<span class="${type || "badge"} ${cls}">${escapeHtml(label)}</span>`;
}

function renderBreadcrumb(route) {
  const crumbs = [["dashboard", "Dashboard"]];
  if (route.key === "incident-details") {
    crumbs.push(["incidents", "Incidents"]);
    const incident = state.incidents.find((item) => item.id === route.id);
    crumbs.push([`incident/${route.id}`, incident?.title || route.id]);
  } else if (route.key === "asset-details") {
    crumbs.push(["assets", "Assets"]);
    const asset = state.assets.find((item) => item.id === route.id);
    crumbs.push([`asset/${route.id}`, asset?.name || route.id]);
  } else if (route.key !== "dashboard") {
    crumbs.push([route.key, PAGE_TITLES[route.key] || route.key]);
  }
  return `
    <div class="breadcrumb">
      ${crumbs
        .map(
          ([path, label], index) => `
            <button data-nav="${path}">${escapeHtml(label)}</button>${index < crumbs.length - 1 ? "<span>/</span>" : ""}
          `
        )
        .join("")}
    </div>
  `;
}

function renderPageFrame(route, title, subtitle, body, actions = "") {
  const mode = state.ui.pageModes[route.key] || "normal";
  const resolvedBody = renderPageMode(route.key, title, subtitle, body, mode);
  return `
    ${renderBreadcrumb(route)}
    <div class="page-header">
      <div>
        <h1 class="page-title">${escapeHtml(title)}</h1>
        <p class="page-subtitle">${escapeHtml(subtitle)}</p>
      </div>
      <div class="page-actions">
        <div class="page-state-select">
          <span class="small muted">Page state</span>
          <select data-model="ui.pageModes.${route.key}">
            ${["normal", "loading", "empty", "error"]
              .map((item) => `<option value="${item}" ${mode === item ? "selected" : ""}>${item[0].toUpperCase()}${item.slice(1)}</option>`)
              .join("")}
          </select>
        </div>
        ${actions}
      </div>
    </div>
    ${resolvedBody}
  `;
}

function renderPageMode(routeKey, title, subtitle, body, mode) {
  if (mode === "loading") {
    return `
      <div class="stack">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>
    `;
  }
  if (mode === "empty") {
    return `
      <div class="empty-card">
        <h3 class="section-title">No data in ${escapeHtml(title)}</h3>
        <p class="section-note">${escapeHtml(subtitle)}</p>
        <p class="muted">Your AI Security Agents have not detected anything requiring action here yet.</p>
        <button class="control-button primary" data-action="page-reset" data-page="${routeKey}">Return to normal view</button>
      </div>
    `;
  }
  if (mode === "error") {
    return `
      <div class="empty-card">
        <h3 class="section-title">Temporary render issue</h3>
        <p class="section-note">This simulated error state is available for demo walkthroughs and recovery flows.</p>
        <button class="control-button primary" data-action="page-reset" data-page="${routeKey}">Recover page</button>
      </div>
    `;
  }
  return body;
}

function renderSidebar(route) {
  const counts = {
    dashboard: organizationSummary().alerts,
    alerts: state.alerts.filter((item) => item.status !== "Resolved").length,
    incidents: state.incidents.length,
    approvals: state.approvals.filter((item) => item.status === "Pending").length,
    "agent-center": state.agents.filter((item) => item.status === "Running").length,
    "configuration-scans": state.scans.length,
    reports: state.reports.length,
  };
  return `
    <aside class="sidebar">
      <div class="brand-block">
        <div class="brand-mark">
          <img src="./favicon.svg" alt="Oswell" class="brand-mark-image" />
        </div>
        <div class="brand-copy">
          <div class="brand-eyebrow">OSWELL TECHNOLOGIES</div>
          <h1>Oswell Security</h1>
          <p>Cyber command center for alerts, investigations, cloud posture, and response automation.</p>
        </div>
      </div>
      ${PAGE_GROUPS.map(
        (group) => `
          <section class="sidebar-group">
            <div class="sidebar-label">${group.label}</div>
            <nav class="sidebar-nav">
              ${group.items
                .map(([path, label]) => {
                  const active =
                    route.key === path ||
                    (route.key === "incident-details" && path === "incidents") ||
                    (route.key === "asset-details" && path === "assets");
                  return `
                    <button class="sidebar-link ${active ? "active" : ""}" data-nav="${path}">
                      <span>${escapeHtml(label)}</span>
                      ${counts[path] ? `<span class="tiny-label">${counts[path]}</span>` : ""}
                    </button>
                  `;
                })
                .join("")}
            </nav>
          </section>
        `
      ).join("")}
    </aside>
  `;
}

function renderTopbar(route) {
  const unread = state.notifications.filter((item) => !item.read).length;
  const searchGroups = groupedSearchResults(state.ui.globalSearch);
  const currentUser = state.users[0];
  return `
    <header class="topbar">
      <button class="icon-button mobile-toggle" data-action="toggle-sidebar">Menu</button>
      <div class="search-box relative">
        <div class="search-shell">
          <span>Search</span>
          <input
            type="text"
            placeholder="Search alerts, incidents, users, assets, IPs, rules, policies, and agents"
            value="${escapeHtml(state.ui.globalSearch)}"
            data-model="ui.globalSearch"
          />
        </div>
        ${
          state.ui.globalSearch
            ? `
              <div class="popover">
                <div class="row-between">
                  <strong>Global Search</strong>
                  <span class="muted small">${Object.values(searchGroups).reduce((sum, list) => sum + list.length, 0)} results</span>
                </div>
                <div class="search-results">
                  ${Object.entries(searchGroups)
                    .filter(([, items]) => items.length)
                    .map(
                      ([group, items]) => `
                        <div class="search-group">
                          <div class="search-group-title">${escapeHtml(group)}</div>
                          ${items
                            .map(
                              (item) => `
                                <button class="search-result" data-nav="${item.route}">
                                  <strong>${escapeHtml(item.label)}</strong>
                                  <span class="muted small">${escapeHtml(item.meta)}</span>
                                </button>
                              `
                            )
                            .join("")}
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </div>
            `
            : ""
        }
      </div>
      <div class="select-shell">
        <span class="small muted">Org</span>
        <select data-model="organization">
          ${ORGANIZATIONS.map((org) => `<option ${org === state.organization ? "selected" : ""}>${org}</option>`).join("")}
        </select>
      </div>
      <div class="select-shell">
        <span class="small muted">Env</span>
        <select data-model="environment">
          ${ENVIRONMENTS.map((env) => `<option ${env === state.environment ? "selected" : ""}>${env}</option>`).join("")}
        </select>
      </div>
      <div class="topbar-actions">
        <button class="pill-button" data-nav="agent-center">AI Agents Online</button>
        <div class="relative">
          <button class="icon-button" data-action="toggle-notifications">Bell ${unread ? `<span class="tiny-label">${unread}</span>` : ""}</button>
          ${
            state.ui.notificationsOpen
              ? `
                <div class="popover">
                  <div class="row-between">
                    <strong>Notifications</strong>
                    <button class="link-button" data-action="mark-all-notifications-read">Mark all read</button>
                  </div>
                  <div class="notification-list">
                    ${state.notifications
                      .map(
                        (item) => `
                          <div class="notification-item ${item.read ? "" : "unread"}">
                            <div class="row-between">
                              <strong>${escapeHtml(item.title)}</strong>
                              <span class="muted small">${timeAgo(item.createdAt)}</span>
                            </div>
                            <div class="muted">${escapeHtml(item.body)}</div>
                            <div class="panel-actions">
                              <button class="link-button" data-action="mark-notification-read" data-id="${item.id}">Mark read</button>
                              <button class="link-button primary" data-nav="${item.route}">View item</button>
                            </div>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }
        </div>
        <button class="icon-button" data-action="open-help">Help</button>
        <div class="relative">
          <button class="pill-button" data-action="toggle-profile">${escapeHtml(currentUser.name)}</button>
          ${
            state.ui.profileOpen
              ? `
                <div class="popover">
                  <div class="stack">
                    <div>
                      <strong>${escapeHtml(currentUser.name)}</strong>
                      <div class="muted small">${escapeHtml(currentUser.role)}</div>
                    </div>
                    <button class="link-button" data-nav="users">Manage users</button>
                    <button class="link-button" data-nav="settings">Platform settings</button>
                    <button class="link-button" data-action="cycle-theme">Toggle theme</button>
                  </div>
                </div>
              `
              : ""
          }
        </div>
      </div>
    </header>
  `;
}

function renderMetrics() {
  return `
    <div class="metrics-grid">
      ${metricCards()
        .map(
          ([label, value, foot]) => `
            <div class="metric-card">
              <div class="metric-label">${escapeHtml(label)}</div>
              <div class="metric-value">${escapeHtml(String(value))}</div>
              <div class="metric-foot">${escapeHtml(foot)}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function lineChartSvg(values, color = "#3fb6ff") {
  const width = 420;
  const height = 210;
  const max = Math.max(...values.map((item) => item.value), 1);
  const stepX = width / Math.max(values.length - 1, 1);
  const points = values
    .map((item, index) => {
      const x = index * stepX;
      const y = height - (item.value / max) * (height - 24) - 12;
      return `${x},${y}`;
    })
    .join(" ");
  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
      <polyline fill="none" stroke="${color}" stroke-width="3" points="${points}" />
      ${values
        .map((item, index) => {
          const x = index * stepX;
          const y = height - (item.value / max) * (height - 24) - 12;
          return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" />`;
        })
        .join("")}
    </svg>
  `;
}

function barChartSvg(values, colors) {
  const width = 420;
  const height = 210;
  const barWidth = Math.max(40, Math.floor(width / values.length) - 18);
  const max = Math.max(...values.map((item) => item.value), 1);
  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
      ${values
        .map((item, index) => {
          const x = index * (barWidth + 18) + 12;
          const barHeight = (item.value / max) * (height - 40);
          const y = height - barHeight - 18;
          return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="10" fill="${colors[index % colors.length]}" />
            <text x="${x + barWidth / 2}" y="${height - 4}" text-anchor="middle" fill="currentColor" font-size="12">${item.label}</text>
          `;
        })
        .join("")}
    </svg>
  `;
}

function renderDashboard(route) {
  const alertTrend = [
    { label: "Mon", value: 1720 },
    { label: "Tue", value: 1880 },
    { label: "Wed", value: 2140 },
    { label: "Thu", value: 1960 },
    { label: "Fri", value: 2280 },
    { label: "Sat", value: 1540 },
    { label: "Sun", value: 1810 },
  ];
  const severityDistribution = [
    { label: "Critical", value: 12 },
    { label: "High", value: 37 },
    { label: "Medium", value: 66 },
    { label: "Low", value: 102 },
  ];
  const clouds = [
    { label: "AWS", value: 18 },
    { label: "Azure", value: 9 },
    { label: "Identity", value: 4 },
  ];
  const mitre = [
    { label: "TA0001", value: 18 },
    { label: "TA0003", value: 13 },
    { label: "TA0006", value: 29 },
    { label: "TA0010", value: 7 },
  ];
  return renderPageFrame(
    route,
    "Dashboard",
    `Millions of logs -> prioritized incidents -> human review only where necessary for ${state.organization}.`,
    `
      ${renderMetrics()}
      <div class="dashboard-grid" style="margin-top:16px;">
        <div class="stack">
          <div class="table-card">
            <div class="section-head">
              <div>
                <h3 class="section-title">Alerts Over Time</h3>
                <p class="section-note">Live-looking detection volume across the selected organization.</p>
              </div>
            </div>
            <div class="chart-box">${lineChartSvg(alertTrend)}</div>
          </div>
          <div class="table-card">
            <div class="section-head">
              <div>
                <h3 class="section-title">Priority Incidents</h3>
                <p class="section-note">Critical and high-risk cases requiring immediate analyst attention.</p>
              </div>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Incident</th>
                    <th>Severity</th>
                    <th>Risk</th>
                    <th>User</th>
                    <th>Asset</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Assigned</th>
                    <th>Detected</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${priorityIncidents()
                    .map(
                      (item) => `
                        <tr class="clickable" data-nav="incident/${item.id}">
                          <td><strong>${escapeHtml(item.title)}</strong></td>
                          <td>${renderBadge(item.severity, "severity")}</td>
                          <td>${renderBadge(`${item.riskScore}/100`, "risk")}</td>
                          <td>${escapeHtml(item.user)}</td>
                          <td>${escapeHtml(item.asset)}</td>
                          <td>${escapeHtml(item.source)}</td>
                          <td>${renderBadge(item.status, "status")}</td>
                          <td>${escapeHtml(item.assignedTo)}</td>
                          <td>${timeAgo(item.detected)}</td>
                          <td>
                            <div class="row-between">
                              <button class="link-button" data-nav="incident/${item.id}">Open</button>
                              <button class="link-button" data-action="request-review" data-id="${item.id}">Review</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="table-card">
            <div class="section-head">
              <div>
                <h3 class="section-title">Severity Distribution</h3>
                <p class="section-note">Signal mix by urgency.</p>
              </div>
            </div>
            <div class="chart-box">${barChartSvg(severityDistribution, ["#ff4d6d", "#ff8f6e", "#ffb454", "#3ddc97"])}</div>
          </div>
          <div class="mini-card">
            <div class="section-head">
              <h3 class="section-title">AI Agent Activity</h3>
            </div>
            <div class="stack">
              ${aiActivityFeed()
                .map(
                  (entry, index) => `
                    <div class="activity-item">
                      <div class="row-between">
                        <strong>${escapeHtml(entry)}</strong>
                        <span class="muted small">${index * 2 + 1}m ago</span>
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
          <div class="mini-card">
            <div class="section-head">
              <h3 class="section-title">Human Work Compression</h3>
            </div>
            <div class="human-compression">
              ${[
                "12,842 alerts",
                "437 relevant signals",
                "31 incidents",
                "13 human actions",
              ]
                .map(
                  (entry, index, array) => `
                    <div class="compression-step"><strong>${escapeHtml(entry)}</strong></div>
                    ${index < array.length - 1 ? '<div class="compression-arrow">v</div>' : ""}
                  `
                )
                .join("")}
            </div>
          </div>
          <div class="mini-card">
            <div class="section-head">
              <h3 class="section-title">Cloud & MITRE</h3>
            </div>
            <div class="chart-box">${barChartSvg(clouds, ["#65d1ff", "#3ddc97", "#ffb454"])}</div>
            <div class="chart-box">${barChartSvg(mitre, ["#1d9bf0", "#3fb6ff", "#59c9ff", "#82daff"])}</div>
          </div>
        </div>
      </div>
    `,
    `
      <button class="control-button primary" data-nav="reports">Generate executive report</button>
      <button class="control-button" data-nav="security-posture">View posture</button>
    `
  );
}

function renderSecurityPosture(route) {
  const recommendations = [
    { id: "rec-1", title: "Lock down public customer export bucket", score: "-12 points risk", target: "configuration-scans" },
    { id: "rec-2", title: "Enforce MFA for privileged AWS accounts", score: "+8 posture gain", target: "incident/inc-204" },
    { id: "rec-3", title: "Enable logging on finance Azure resources", score: "+5 posture gain", target: "azure" },
  ];
  return renderPageFrame(
    route,
    "Security Posture",
    "Track posture trends across identity, cloud, endpoint, data, and monitoring controls.",
    `
      <div class="metrics-grid">
        ${[
          ["Security Score", "82/100"],
          ["Identity", "88"],
          ["Cloud", "72"],
          ["Network", "85"],
          ["Data", "78"],
          ["Endpoint", "90"],
          ["Monitoring", "81"],
        ]
          .map(
            ([label, value]) => `
              <div class="metric-card">
                <div class="metric-label">${label}</div>
                <div class="metric-value">${value}</div>
                <div class="progress-shell"><div class="progress-bar" style="width:${Number.parseInt(value, 10) || 82}%"></div></div>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="split" style="margin-top:16px;">
        <div class="table-card">
          <div class="section-head">
            <div>
              <h3 class="section-title">Security Score Trend</h3>
              <p class="section-note">Weekly posture trajectory for the selected organization.</p>
            </div>
          </div>
          <div class="chart-box">
            ${lineChartSvg(
              [
                { label: "W1", value: 73 },
                { label: "W2", value: 75 },
                { label: "W3", value: 78 },
                { label: "W4", value: 80 },
                { label: "W5", value: 82 },
              ],
              "#3ddc97"
            )}
          </div>
        </div>
        <div class="table-card">
          <div class="section-head">
            <div>
              <h3 class="section-title">Recommendations</h3>
              <p class="section-note">Open findings tied to meaningful score movement.</p>
            </div>
          </div>
          <div class="stack">
            ${recommendations
              .map(
                (item) => `
                  <button class="search-result" data-nav="${item.target}">
                    <strong>${escapeHtml(item.title)}</strong>
                    <span class="muted small">${escapeHtml(item.score)}</span>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      </div>
    `
  );
}

function renderAlerts(route) {
  const data = filteredAlerts();
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const page = Math.min(state.ui.pagination.alerts, totalPages);
  state.ui.pagination.alerts = page;
  const rows = paged(data, page, pageSize);
  const selected = state.ui.selections.alerts;
  return renderPageFrame(
    route,
    "Alerts",
    "Operational security alerts with search, sorting, bulk selection, pagination, and full local workflows.",
    `
      <div class="table-card">
        <div class="filter-row">
          ${renderInput("Search", "ui.alertFilters.search", state.ui.alertFilters.search, "Search by ID, title, IP, rule")}
          ${renderSelect("Severity", "ui.alertFilters.severity", ["", ...SEVERITIES], state.ui.alertFilters.severity)}
          ${renderSelect("Status", "ui.alertFilters.status", ["", ...ALERT_STATUSES], state.ui.alertFilters.status)}
          ${renderSelect("Source", "ui.alertFilters.source", ["", ...uniqueValues(state.alerts, "source")], state.ui.alertFilters.source)}
          ${renderSelect("Agent", "ui.alertFilters.agent", ["", ...uniqueValues(state.alerts, "agent")], state.ui.alertFilters.agent)}
          ${renderSelect("User", "ui.alertFilters.user", ["", ...uniqueValues(state.alerts, "user")], state.ui.alertFilters.user)}
          ${renderSelect("Asset", "ui.alertFilters.asset", ["", ...uniqueValues(state.alerts, "asset")], state.ui.alertFilters.asset)}
          ${renderSelect("Risk score", "ui.alertFilters.risk", ["", "75+", "50-74", "0-49"], state.ui.alertFilters.risk)}
        </div>
        <div class="panel-actions" style="margin:16px 0;">
          <div class="row-between">
            <span class="muted small">${selected.length} selected</span>
            <button class="link-button" data-action="select-all-alerts">${selected.length === rows.length && rows.length ? "Clear page" : "Select page"}</button>
          </div>
          <div class="row-between">
            <select class="control-select" id="bulkAction">
              <option value="">Bulk action</option>
              <option value="assign">Assign</option>
              <option value="change-severity">Change severity</option>
              <option value="investigate">Start investigation</option>
              <option value="resolve">Mark resolved</option>
              <option value="tag">Add tag</option>
              <option value="export">Export</option>
            </select>
            <button class="control-button primary" data-action="apply-alert-bulk-action">Apply</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" ${rows.length && rows.every((item) => selected.includes(item.id)) ? "checked" : ""} data-action="select-all-alerts" /></th>
                ${sortableHeader("Alert ID", "id")}
                <th>Title</th>
                ${sortableHeader("Severity", "severity")}
                ${sortableHeader("Risk Score", "riskScore")}
                <th>Source</th>
                <th>User</th>
                <th>Asset</th>
                <th>IP Address</th>
                <th>Detection Rule</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (item) => `
                    <tr>
                      <td><input type="checkbox" data-action="toggle-alert-selection" data-id="${item.id}" ${selected.includes(item.id) ? "checked" : ""} /></td>
                      <td><button class="link-button" data-action="open-related-incident" data-id="${item.id}">${escapeHtml(item.id)}</button></td>
                      <td>${escapeHtml(item.title)}</td>
                      <td>${renderBadge(item.severity, "severity")}</td>
                      <td>${item.riskScore}</td>
                      <td>${escapeHtml(item.source)}</td>
                      <td>${escapeHtml(item.user)}</td>
                      <td>${escapeHtml(item.asset)}</td>
                      <td class="mono">${escapeHtml(item.ip)}</td>
                      <td>${escapeHtml(item.rule)}</td>
                      <td>${renderBadge(item.status, "status")}</td>
                      <td>${formatDate(item.timestamp)}</td>
                      <td>
                        <div class="row-between">
                          <button class="link-button" data-action="assign-alert" data-id="${item.id}">Assign</button>
                          <button class="link-button" data-action="start-alert-investigation" data-id="${item.id}">Investigate</button>
                          <button class="link-button" data-action="resolve-alert" data-id="${item.id}">Resolve</button>
                        </div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="panel-actions" style="margin-top:16px;">
          <span class="muted small">Page ${page} of ${totalPages}</span>
          <div class="row-between">
            <button class="control-button" data-action="change-page" data-target="alerts" data-direction="-1">Previous</button>
            <button class="control-button" data-action="change-page" data-target="alerts" data-direction="1">Next</button>
          </div>
        </div>
      </div>
    `,
    `
      <button class="control-button" data-action="reset-alert-filters">Reset filters</button>
      <button class="control-button primary" data-action="simulate-new-alert">Simulate alert</button>
    `
  );
}

function renderIncidents(route) {
  return renderPageFrame(
    route,
    "Incidents",
    "Prioritized multi-signal security incidents with AI-authored summaries and analyst workflows.",
    `
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Incident</th>
                <th>Severity</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>User</th>
                <th>Asset</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.incidents
                .map(
                  (item) => `
                    <tr class="clickable">
                      <td><button class="link-button" data-nav="incident/${item.id}">${escapeHtml(item.title)}</button></td>
                      <td>${renderBadge(item.severity, "severity")}</td>
                      <td>${item.riskScore}/100</td>
                      <td>${renderBadge(item.status, "status")}</td>
                      <td>${escapeHtml(item.assignedTo)}</td>
                      <td>${escapeHtml(item.user)}</td>
                      <td>${escapeHtml(item.asset)}</td>
                      <td>${timeAgo(item.updatedAt)}</td>
                      <td>
                        <button class="link-button" data-action="request-review" data-id="${item.id}">Request Review</button>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function incidentById(id) {
  return state.incidents.find((item) => item.id === id);
}

function renderIncidentDetails(route) {
  const incident = incidentById(route.id);
  if (!incident) {
    return renderPageFrame(route, "Incident not found", "The requested incident no longer exists in local demo data.", `<div class="empty-card"><button class="control-button primary" data-nav="incidents">Return to incidents</button></div>`);
  }
  const tab = state.ui.tabs.incident;
  const tabContent = {
    overview: `
      <div class="split">
        <div class="stack">
          <div class="table-card">
            <div class="section-head">
              <div>
                <div class="section-kicker">AI Summary</div>
                <h3 class="section-title">${escapeHtml(incident.title)}</h3>
              </div>
            </div>
            <p>${escapeHtml(incident.aiSummary)}</p>
          </div>
          <div class="table-card">
            <div class="section-head">
              <div>
                <div class="section-kicker">Attack Timeline</div>
                <h3 class="section-title">Latest sequence</h3>
              </div>
            </div>
            <div class="timeline">
              ${incident.timeline
                .map(
                  (entry) => `
                    <div class="timeline-item">
                      <div class="row-between">
                        <strong>${escapeHtml(entry.time)}</strong>
                        <span class="muted small">${escapeHtml(incident.source)}</span>
                      </div>
                      <div>${escapeHtml(entry.event)}</div>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="mini-card">
            <div class="mini-stat"><span>Risk Score <span title="Risk Score combines severity, exposure, and corroborating evidence.">?</span></span><strong>${incident.riskScore}/100</strong></div>
            <div class="mini-stat"><span>Status</span><strong>${incident.status}</strong></div>
            <div class="mini-stat"><span>Assigned analyst</span><strong>${incident.assignedTo}</strong></div>
            <div class="mini-stat"><span>Created</span><strong>${formatDateLong(incident.createdAt)}</strong></div>
            <div class="mini-stat"><span>Data source</span><strong>${escapeHtml(incident.dataSource)}</strong></div>
            <div class="mini-stat"><span>Affected users</span><strong>${escapeHtml(incident.affectedUsers.join(", "))}</strong></div>
            <div class="mini-stat"><span>Affected assets</span><strong>${escapeHtml(incident.affectedAssets.join(", "))}</strong></div>
          </div>
          <div class="mini-card">
            <div class="section-head">
              <h3 class="section-title">Evidence</h3>
            </div>
            <div class="stack">
              ${incident.evidence.map((entry) => `<div class="evidence-item">${escapeHtml(entry)}</div>`).join("")}
            </div>
          </div>
        </div>
      </div>
    `,
    timeline: `
      <div class="timeline">
        ${incident.timeline
          .map(
            (entry) => `
              <div class="timeline-item">
                <div class="row-between">
                  <strong>${escapeHtml(entry.time)}</strong>
                  <button class="link-button" data-action="add-incident-timeline-event" data-id="${incident.id}">Add adjacent event</button>
                </div>
                <div>${escapeHtml(entry.event)}</div>
              </div>
            `
          )
          .join("")}
      </div>
    `,
    evidence: `
      <div class="stack">
        ${incident.evidence
          .map(
            (entry) => `
              <div class="evidence-item">
                <strong>${escapeHtml(entry)}</strong>
                <button class="link-button" data-action="pin-evidence" data-id="${incident.id}" data-value="${escapeHtml(entry)}">Pin to report</button>
              </div>
            `
          )
          .join("")}
      </div>
    `,
    "raw-logs": `
      <button class="control-button primary" data-nav="raw-logs">Open raw log viewer</button>
      <div class="stack" style="margin-top:16px;">
        ${incident.rawLogs
          .map((logId) => {
            const log = state.rawLogs.find((item) => item.id === logId);
            return log
              ? `<pre class="code-block">${escapeHtml(JSON.stringify(log.body, null, 2))}</pre>`
              : "";
          })
          .join("")}
      </div>
    `,
    "threat-intelligence": `
      <div class="stack">
        ${incident.threatIntel
          .map(
            (entry) => `
              <div class="result-item">
                <div class="row-between">
                  <strong>${escapeHtml(entry.source)}</strong>
                  ${renderBadge(entry.verdict, "status")}
                </div>
                <div>${escapeHtml(entry.detail)}</div>
              </div>
            `
          )
          .join("")}
      </div>
    `,
    "ai-analysis": `
      <div class="table-card">
        <h3 class="section-title">AI Analysis</h3>
        <p>Confidence: <strong>High</strong> <span title="Confidence reflects how strongly the available evidence supports the AI conclusion.">?</span></p>
        <p>${escapeHtml(incident.aiSummary)}</p>
        <button class="control-button primary" data-action="rerun-ai-analysis" data-id="${incident.id}">Refresh AI analysis</button>
      </div>
    `,
    comments: `
      <div class="stack">
        ${incident.comments
          .map(
            (comment) => `
              <div class="comment-item">
                <div class="row-between">
                  <strong>${escapeHtml(comment.author)}</strong>
                  <span class="muted small">${timeAgo(comment.at)}</span>
                </div>
                <div>${escapeHtml(comment.text)}</div>
              </div>
            `
          )
          .join("")}
        <button class="control-button primary" data-action="add-incident-comment" data-id="${incident.id}">Add comment</button>
      </div>
    `,
    activity: `
      <div class="stack">
        ${incident.activity
          .map(
            (entry) => `
              <div class="activity-item">
                <div class="row-between">
                  <strong>${escapeHtml(entry.actor)}</strong>
                  <span class="muted small">${timeAgo(entry.at)}</span>
                </div>
                <div>${escapeHtml(entry.action)}</div>
              </div>
            `
          )
          .join("")}
      </div>
    `,
  };
  return renderPageFrame(
    route,
    `${incident.severity} - ${incident.title}`,
    "Detailed SOC incident investigation with AI summary, evidence, logs, intelligence, and analyst actions.",
    `
      <div class="panel-card">
        <div class="panel-actions">
          <div class="row-between">
            ${renderBadge(incident.severity, "severity")}
            ${renderBadge(incident.status, "status")}
            ${renderBadge(`${incident.riskScore}/100`, "risk")}
          </div>
          <div class="row-between">
            <button class="control-button" data-action="investigate-further" data-id="${incident.id}">Investigate Further</button>
            <button class="control-button primary" data-action="run-threat-intel-incident" data-id="${incident.id}">Run Threat Intel</button>
            <button class="control-button" data-nav="raw-logs">View Raw Logs</button>
            <button class="control-button" data-action="generate-incident-report" data-id="${incident.id}">Generate Report</button>
            <button class="control-button" data-action="create-detection-from-incident" data-id="${incident.id}">Create Detection Rule</button>
            <button class="control-button" data-action="assign-incident" data-id="${incident.id}">Assign Analyst</button>
            <button class="control-button" data-action="change-incident-severity" data-id="${incident.id}">Change Severity</button>
            <button class="control-button" data-action="request-review" data-id="${incident.id}">Request Human Review</button>
            <button class="control-button" data-action="resolve-incident" data-id="${incident.id}">Resolve Incident</button>
          </div>
        </div>
      </div>
      <div class="tab-row" style="margin:16px 0;">
        ${[
          ["overview", "Overview"],
          ["timeline", "Timeline"],
          ["evidence", "Evidence"],
          ["raw-logs", "Raw Logs"],
          ["threat-intelligence", "Threat Intelligence"],
          ["ai-analysis", "AI Analysis"],
          ["comments", "Comments"],
          ["activity", "Activity"],
        ]
          .map(
            ([key, label]) => `
              <button class="tab-button ${tab === key ? "active" : ""}" data-action="set-incident-tab" data-tab="${key}">${label}</button>
            `
          )
          .join("")}
      </div>
      ${tabContent[tab]}
    `
  );
}

function renderThreatIntelligence(route) {
  const latest = state.threatLookups[0];
  return renderPageFrame(
    route,
    "Threat Intelligence",
    "Search IPs, domains, URLs, and hashes against simulated multi-source threat intelligence.",
    `
      <div class="table-card">
        <div class="toolbar-row">
          ${renderInput("Indicator", "ui.threatQuery", state.ui.threatQuery || "", "Enter IP, domain, URL or hash")}
          <div class="field">
            <label>&nbsp;</label>
            <button class="control-button primary" data-action="analyze-threat">Analyze</button>
          </div>
        </div>
        <div class="chart-legend">
          <span>Example: 185.220.101.24</span>
          <span>malicious-example.com</span>
          <span>SHA256 hash</span>
        </div>
      </div>
      ${
        latest
          ? `
            <div class="split" style="margin-top:16px;">
              <div class="stack">
                ${[
                  ["Reputation", latest.reputation],
                  ["Threat Score", `${latest.score}/100`],
                  ["Associated Malware", latest.malware],
                  ["Attack Categories", latest.categories.join(", ")],
                  ["First Seen", latest.firstSeen],
                  ["Last Seen", latest.lastSeen],
                  ["Countries", latest.countries.join(", ")],
                ]
                  .map(
                    ([label, value]) => `
                      <div class="mini-card">
                        <div class="mini-stat">
                          <span>${escapeHtml(label)}</span>
                          <strong>${escapeHtml(String(value))}</strong>
                        </div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
              <div class="stack">
                <div class="table-card">
                  <h3 class="section-title">Source results</h3>
                  <div class="stack">
                    ${latest.sources
                      .map(
                        (entry) => `
                          <div class="result-item">
                            <div class="row-between">
                              <strong>${escapeHtml(entry.name)}</strong>
                              ${renderBadge(entry.result, "status")}
                            </div>
                            <div>${escapeHtml(entry.detail)}</div>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                </div>
                <div class="table-card">
                  <h3 class="section-title">Related indicators</h3>
                  <div class="stack">${latest.related.map((entry) => `<div class="search-result">${escapeHtml(entry)}</div>`).join("")}</div>
                </div>
                <div class="table-card">
                  <h3 class="section-title">Internal log matches</h3>
                  <div class="stack">${latest.matches.map((entry) => `<div class="search-result">${escapeHtml(entry)}</div>`).join("")}</div>
                </div>
              </div>
            </div>
          `
          : `
            <div class="empty-card" style="margin-top:16px;">
              <h3 class="section-title">No lookup yet</h3>
              <p class="section-note">Run an indicator lookup to view reputation, history, and internal matches.</p>
            </div>
          `
      }
    `,
    `
      <button class="control-button" data-action="load-example-threat" data-value="185.220.101.24">Load malicious IP</button>
      <button class="control-button" data-action="load-example-threat" data-value="malicious-example.com">Load domain</button>
    `
  );
}

function agentByRoute(routeKey) {
  return state.agents.find((item) => item.route === routeKey);
}

function renderAgentCenter(route) {
  return renderPageFrame(
    route,
    "AI Security Agents",
    "Autonomous agents continuously triage telemetry, enrich context, investigate findings, and request human approval only when needed.",
    `
      <div class="agent-grid">
        ${state.agents
          .map(
            (agent) => `
              <div class="agent-card">
                <div class="row-between">
                  <div>
                    <h3 class="section-title">${escapeHtml(agent.name)}</h3>
                    <div class="muted small">${escapeHtml(agent.description)}</div>
                  </div>
                  ${renderBadge(agent.status, "status")}
                </div>
                <div class="stack">
                  ${agent.metrics.map(([label, value]) => `<div class="mini-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
                </div>
                <div class="card-actions">
                  <button class="link-button" data-nav="${agent.route}">View Activity</button>
                  <button class="link-button" data-action="toggle-agent-status" data-id="${agent.id}">${agent.status === "Paused" ? "Resume" : "Pause"}</button>
                  <button class="link-button" data-action="configure-agent" data-id="${agent.id}">Configure</button>
                  <button class="link-button primary" data-action="run-agent-now" data-id="${agent.id}">Run Now</button>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `
  );
}

function renderAgentDetails(route) {
  const agent = agentByRoute(route.key);
  if (!agent) return renderPageFrame(route, "Agent not found", "No agent matched that route.", `<div class="empty-card"><button class="control-button primary" data-nav="agent-center">Return to Agent Center</button></div>`);
  return renderPageFrame(
    route,
    agent.name,
    agent.description,
    `
      <div class="split">
        <div class="stack">
          <div class="table-card">
            <div class="section-head">
              <div>
                <div class="section-kicker">Status</div>
                <h3 class="section-title">${escapeHtml(agent.status)}</h3>
              </div>
              <button class="control-button primary" data-action="run-agent-now" data-id="${agent.id}">Run agent now</button>
            </div>
            <div class="stack">
              ${agent.metrics.map(([label, value]) => `<div class="mini-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
            </div>
          </div>
          <div class="table-card">
            <div class="section-head">
              <h3 class="section-title">Recent activity</h3>
            </div>
            <div class="activity-item">
              <strong>${escapeHtml(agent.recentAction)}</strong>
              <span class="muted small">${timeAgo(agent.lastRun)}</span>
            </div>
            ${state.agentActivity
              .filter((entry) => entry.agent === agent.name)
              .slice(0, 4)
              .map(
                (entry) => `
                  <div class="activity-item">
                    <div class="row-between">
                      <strong>${escapeHtml(entry.action)}</strong>
                      <span class="muted small">${timeAgo(entry.timestamp)}</span>
                    </div>
                    <div>${escapeHtml(entry.target)} -> ${escapeHtml(entry.result)}</div>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="stack">
          <div class="mini-card">
            <h3 class="section-title">Controls</h3>
            <div class="stack">
              <button class="control-button" data-action="toggle-agent-status" data-id="${agent.id}">${agent.status === "Paused" ? "Resume agent" : "Pause agent"}</button>
              <button class="control-button" data-action="configure-agent" data-id="${agent.id}">Open configuration</button>
              <button class="control-button" data-nav="agent-activity">View audit timeline</button>
            </div>
          </div>
        </div>
      </div>
    `
  );
}

function renderInvestigations(route) {
  return renderPageFrame(
    route,
    "Investigations",
    "AI-correlated attack stories that can be updated, recalculated, escalated, or closed from the frontend.",
    `
      <div class="stack">
        ${state.investigations
          .map(
            (item) => `
              <div class="table-card">
                <div class="panel-actions">
                  <div>
                    <h3 class="section-title">${escapeHtml(item.title)}</h3>
                    <p class="section-note">${escapeHtml(item.correlatedAlerts.join(", "))}</p>
                  </div>
                  <div class="row-between">
                    ${renderBadge(item.status, "status")}
                    ${renderBadge(`${item.riskScore}/100`, "risk")}
                  </div>
                </div>
                <div class="human-compression" style="margin:16px 0;">
                  ${item.chain
                    .map(
                      (entry, index, array) => `
                        <div class="compression-step"><strong>${escapeHtml(entry)}</strong></div>
                        ${index < array.length - 1 ? '<div class="compression-arrow">v</div>' : ""}
                      `
                    )
                    .join("")}
                </div>
                <div class="card-actions">
                  <button class="link-button" data-action="add-investigation-event" data-id="${item.id}">Add event</button>
                  <button class="link-button" data-action="remove-investigation-correlation" data-id="${item.id}">Remove correlation</button>
                  <button class="link-button" data-action="recalculate-investigation-risk" data-id="${item.id}">Recalculate risk</button>
                  <button class="link-button" data-action="escalate-investigation" data-id="${item.id}">Escalate to incident</button>
                  <button class="link-button" data-action="close-investigation" data-id="${item.id}">Close investigation</button>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `,
    `
      <button class="control-button primary" data-action="create-investigation">Create investigation</button>
    `
  );
}

function renderCloudPage(route, provider) {
  const providerAssets = state.assets.filter((item) => item.provider === provider);
  const providerAlerts = state.alerts.filter((item) => item.source.includes(provider));
  const title = provider === "AWS" ? "AWS" : "Azure";
  const services =
    provider === "AWS"
      ? ["CloudTrail", "CloudWatch", "GuardDuty", "IAM", "S3", "EC2", "VPC", "RDS", "Security Hub"]
      : ["Entra ID", "Azure Monitor", "Sentinel", "Defender for Cloud", "Key Vault", "Storage", "Virtual Machines", "NSG"];
  return renderPageFrame(
    route,
    title,
    `Simulated ${provider} cloud security visibility with connection health, findings, active alerts, and service coverage.`,
    `
      <div class="metrics-grid">
        ${[
          ["Connected Account", provider === "AWS" ? "aws-prod-account" : "oswell-primary-tenant"],
          [provider === "AWS" ? "Account ID" : "Tenant", provider === "AWS" ? "9472-1201-0042" : "oswell-tenant-4431"],
          [provider === "AWS" ? "Region" : "Resources", provider === "AWS" ? "us-east-1" : "312"],
          ["Assets", providerAssets.length],
          ["Security Score", provider === "AWS" ? "72" : "79"],
          ["Findings", providerAssets.reduce((sum, item) => sum + item.findings, 0)],
          ["Active Alerts", providerAlerts.length],
          ["Configuration Issues", state.scans.flatMap((scan) => scan.findings).length],
        ]
          .map(
            ([label, value]) => `
              <div class="metric-card">
                <div class="metric-label">${escapeHtml(String(label))}</div>
                <div class="metric-value">${escapeHtml(String(value))}</div>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="split" style="margin-top:16px;">
        <div class="table-card">
          <div class="section-head">
            <h3 class="section-title">Services</h3>
          </div>
          <div class="stack">
            ${services
              .map(
                (service, index) => `
                  <div class="mini-stat">
                    <span>${escapeHtml(service)}</span>
                    ${renderBadge(index % 4 === 0 ? "Monitoring" : "Healthy", "status")}
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="table-card">
          <div class="section-head">
            <h3 class="section-title">Top findings</h3>
          </div>
          <div class="stack">
            ${state.scans
              .filter((scan) => scan.provider === provider)
              .flatMap((scan) => scan.findings)
              .slice(0, 5)
              .map(
                (finding) => `
                  <button class="search-result" data-action="open-finding" data-finding="${escapeHtml(JSON.stringify(finding))}">
                    <strong>${escapeHtml(finding.title)}</strong>
                    <span class="muted small">${escapeHtml(finding.detail)}</span>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      </div>
    `,
    `
      <button class="control-button primary" data-nav="configuration-scans">Open configuration scans</button>
      <button class="control-button" data-nav="integrations">Manage integrations</button>
    `
  );
}

function renderAssets(route) {
  return renderPageFrame(
    route,
    "Assets",
    "Asset inventory across cloud accounts, storage, servers, databases, users, and applications.",
    `
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Provider</th>
                <th>Environment</th>
                <th>Owner</th>
                <th>Risk</th>
                <th>Findings</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              ${state.assets
                .map(
                  (asset) => `
                    <tr class="clickable">
                      <td><button class="link-button" data-nav="asset/${asset.id}">${escapeHtml(asset.name)}</button></td>
                      <td>${escapeHtml(asset.type)}</td>
                      <td>${escapeHtml(asset.provider)}</td>
                      <td>${escapeHtml(asset.environment)}</td>
                      <td>${escapeHtml(asset.owner)}</td>
                      <td>${renderBadge(asset.risk, "severity")}</td>
                      <td>${asset.findings}</td>
                      <td>${timeAgo(asset.lastSeen)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function renderAssetDetails(route) {
  const asset = state.assets.find((item) => item.id === route.id);
  if (!asset) return renderPageFrame(route, "Asset not found", "This asset no longer exists.", `<div class="empty-card"><button class="control-button primary" data-nav="assets">Return to Assets</button></div>`);
  const relatedAlerts = state.alerts.filter((item) => item.asset === asset.name);
  return renderPageFrame(
    route,
    asset.name,
    `${asset.type} in ${asset.environment} with ${asset.findings} active findings.`,
    `
      <div class="split">
        <div class="table-card">
          <div class="section-head">
            <h3 class="section-title">Asset profile</h3>
          </div>
          <div class="stack">
            <div class="mini-stat"><span>Provider</span><strong>${escapeHtml(asset.provider)}</strong></div>
            <div class="mini-stat"><span>Owner</span><strong>${escapeHtml(asset.owner)}</strong></div>
            <div class="mini-stat"><span>Risk</span><strong>${escapeHtml(asset.risk)}</strong></div>
            <div class="mini-stat"><span>Last Seen</span><strong>${formatDateLong(asset.lastSeen)}</strong></div>
          </div>
        </div>
        <div class="table-card">
          <div class="section-head">
            <h3 class="section-title">Related alerts</h3>
          </div>
          <div class="stack">
            ${relatedAlerts.map((alert) => `<button class="search-result" data-action="open-related-incident" data-id="${alert.id}">${escapeHtml(alert.id)} - ${escapeHtml(alert.title)}</button>`).join("")}
          </div>
        </div>
      </div>
    `
  );
}

function renderConfigurationScans(route) {
  return renderPageFrame(
    route,
    "Cloud Configuration Scans",
    "Run and schedule simulated AWS and Azure posture scans with realistic progress phases and findings.",
    `
      <div class="panel-card">
        <div class="card-actions">
          <button class="control-button" data-action="new-scan">New Scan</button>
          <button class="control-button primary" data-action="run-full-scan" data-provider="AWS">Run Full Scan</button>
          <button class="control-button" data-action="scan-selected-resources">Scan Selected Resources</button>
          <button class="control-button" data-action="schedule-scan">Schedule Scan</button>
        </div>
      </div>
      <div class="stack" style="margin-top:16px;">
        ${state.scans
          .map(
            (scan) => `
              <div class="table-card">
                <div class="panel-actions">
                  <div>
                    <h3 class="section-title">${escapeHtml(scan.provider)} - ${escapeHtml(scan.scope)}</h3>
                    <p class="section-note">${escapeHtml(scan.phase)}</p>
                  </div>
                  <div class="row-between">
                    ${renderBadge(scan.status, "status")}
                    <span class="small muted">${formatDate(scan.createdAt)}</span>
                  </div>
                </div>
                <div class="progress-shell" style="margin:12px 0;">
                  <div class="progress-bar" style="width:${scan.progress}%"></div>
                </div>
                <div class="stack">
                  ${scan.findings
                    .map(
                      (finding) => `
                        <button class="search-result" data-action="open-finding" data-finding="${escapeHtml(JSON.stringify(finding))}">
                          <strong>${escapeHtml(finding.title)}</strong>
                          <span class="muted small">${escapeHtml(finding.detail)}</span>
                        </button>
                      `
                    )
                    .join("")}
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `
  );
}

function renderDetectionRules(route) {
  return renderPageFrame(
    route,
    "Detection Rules",
    "Frontend detection rule management with creation, editing, testing, enable/disable, import/export, duplication, and local persistence.",
    `
      <div class="panel-card">
        <div class="card-actions">
          <button class="control-button primary" data-action="open-rule-builder">Create Rule</button>
          <button class="control-button" data-action="import-rules">Import</button>
          <button class="control-button" data-action="export-rules">Export</button>
          <button class="control-button" data-action="open-ai-rule-builder">Create Rule with AI</button>
        </div>
      </div>
      <div class="table-card" style="margin-top:16px;">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Description</th>
                <th>Source</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Trigger Count</th>
                <th>Last Triggered</th>
                <th>Updated By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.rules
                .map(
                  (rule) => `
                    <tr>
                      <td>${escapeHtml(rule.name)}</td>
                      <td>${escapeHtml(rule.description)}</td>
                      <td>${escapeHtml(rule.source)}</td>
                      <td>${renderBadge(rule.severity, "severity")}</td>
                      <td>${renderBadge(rule.status, "status")}</td>
                      <td>${rule.triggerCount}</td>
                      <td>${timeAgo(rule.lastTriggered)}</td>
                      <td>${escapeHtml(rule.updatedBy)}</td>
                      <td>
                        <div class="row-between">
                          <button class="link-button" data-action="toggle-rule-status" data-id="${rule.id}">${rule.status === "Enabled" ? "Disable" : "Enable"}</button>
                          <button class="link-button" data-action="duplicate-rule" data-id="${rule.id}">Duplicate</button>
                          <button class="link-button" data-action="edit-rule" data-id="${rule.id}">Edit</button>
                          <button class="link-button" data-action="delete-rule" data-id="${rule.id}">Delete</button>
                          <button class="link-button primary" data-action="test-rule" data-id="${rule.id}">Test</button>
                        </div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function renderPolicies(route) {
  return renderPageFrame(
    route,
    "Policies",
    "Business security policies that shape risk scoring, investigation triggers, and incident automation.",
    `
      <div class="stack">
        ${state.policies
          .map(
            (policy) => `
              <div class="table-card">
                <div class="panel-actions">
                  <div>
                    <h3 class="section-title">${escapeHtml(policy.name)}</h3>
                    <p class="section-note">IF ${escapeHtml(policy.logic)}</p>
                    <p><strong>THEN</strong> ${escapeHtml(policy.result)}</p>
                  </div>
                  ${renderBadge(policy.enabled ? "Enabled" : "Disabled", "status")}
                </div>
                <div class="card-actions">
                  <button class="link-button" data-action="edit-policy" data-id="${policy.id}">Edit</button>
                  <button class="link-button" data-action="toggle-policy" data-id="${policy.id}">${policy.enabled ? "Disable" : "Enable"}</button>
                  <button class="link-button" data-action="duplicate-policy" data-id="${policy.id}">Duplicate</button>
                  <button class="link-button" data-action="delete-policy" data-id="${policy.id}">Delete</button>
                  <button class="link-button primary" data-action="test-policy" data-id="${policy.id}">Test</button>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `,
    `
      <button class="control-button primary" data-action="new-policy">Create policy</button>
    `
  );
}

function renderRiskRules(route) {
  const scores = state.riskConfig.scores;
  const preview = scores.maliciousIp + scores.privilegedAccount + scores.largeDownload + scores.newDevice;
  return renderPageFrame(
    route,
    "Risk Rules",
    "Adjust frontend-only risk scoring weights and immediately preview how incidents shift between low, medium, high, and critical.",
    `
      <div class="split">
        <div class="table-card">
          <div class="section-head">
            <h3 class="section-title">Risk scoring weights</h3>
          </div>
          <div class="stack">
            ${[
              ["Known Malicious IP", "maliciousIp"],
              ["Privileged Account", "privilegedAccount"],
              ["Impossible Travel", "impossibleTravel"],
              ["Large Data Download", "largeDownload"],
              ["New Device", "newDevice"],
              ["Public Cloud Resource", "publicResource"],
            ]
              .map(
                ([label, key]) => `
                  <div class="field">
                    <label>${escapeHtml(label)}</label>
                    <input class="control-input" type="range" min="0" max="40" value="${scores[key]}" data-model="riskConfig.scores.${key}" />
                    <div class="row-between">
                      <span class="muted small">0</span>
                      <strong>${scores[key]} points</strong>
                      <span class="muted small">40</span>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="table-card">
          <div class="section-head">
            <h3 class="section-title">Preview calculation</h3>
          </div>
          <div class="metric-value">${preview}/100</div>
          <div class="metric-foot">Severity preview: ${riskSeverity(preview)}</div>
          <div class="severity-legend">
            <span>0-24: Low</span>
            <span>25-49: Medium</span>
            <span>50-74: High</span>
            <span>75-100: Critical</span>
          </div>
        </div>
      </div>
    `
  );
}

function renderThreatIndicators(route) {
  return renderPageFrame(
    route,
    "Threat Indicators",
    "Managed IOC inventory with local actions for enrichment, investigation linkage, and simulated containment suggestions.",
    `
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Confidence</th>
                <th>Category</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.threatIndicators
                .map(
                  (ioc) => `
                    <tr>
                      <td>${escapeHtml(ioc.type)}</td>
                      <td class="mono">${escapeHtml(ioc.value)}</td>
                      <td>${renderBadge(ioc.confidence, "status")}</td>
                      <td>${escapeHtml(ioc.category)}</td>
                      <td>${timeAgo(ioc.lastSeen)}</td>
                      <td>
                        <div class="row-between">
                          <button class="link-button" data-action="lookup-indicator" data-value="${escapeHtml(ioc.value)}">Lookup</button>
                          <button class="link-button" data-action="indicator-to-investigation" data-id="${ioc.id}">Add to investigation</button>
                          <button class="link-button" data-action="suggest-containment" data-id="${ioc.id}">Suggest containment</button>
                        </div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function renderPlaybooks(route) {
  return renderPageFrame(
    route,
    "Playbooks",
    "Security automation workflows that execute step-by-step in the frontend with visible run progress.",
    `
      <div class="stack">
        ${state.playbooks
          .map(
            (playbook) => `
              <div class="table-card">
                <div class="panel-actions">
                  <div>
                    <h3 class="section-title">${escapeHtml(playbook.name)}</h3>
                    <p class="section-note">${playbook.steps.length} automated steps</p>
                  </div>
                  ${renderBadge(playbook.enabled ? "Enabled" : "Disabled", "status")}
                </div>
                <div class="stack">
                  ${playbook.steps
                    .map(
                      (step, index) => `
                        <div class="play-step">
                          <strong>${index + 1}. ${escapeHtml(step)}</strong>
                          <span class="muted small">${playbook.runStatus === "Running" && playbook.progress / 100 * playbook.steps.length > index ? "Completed" : "Waiting"}</span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
                <div class="progress-shell" style="margin-top:14px;">
                  <div class="progress-bar" style="width:${playbook.progress}%"></div>
                </div>
                <div class="card-actions" style="margin-top:14px;">
                  <button class="link-button" data-action="edit-playbook" data-id="${playbook.id}">Edit</button>
                  <button class="link-button" data-action="duplicate-playbook" data-id="${playbook.id}">Duplicate</button>
                  <button class="link-button" data-action="toggle-playbook" data-id="${playbook.id}">${playbook.enabled ? "Disable" : "Enable"}</button>
                  <button class="link-button primary" data-action="run-playbook" data-id="${playbook.id}">Run</button>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `,
    `
      <button class="control-button primary" data-action="new-playbook">Create playbook</button>
    `
  );
}

function renderApprovals(route) {
  const pendingCount = state.approvals.filter((item) => item.status === "Pending").length;
  const criticalCount = state.approvals.filter((item) => item.title.includes("Block")).length;
  const highRiskTargets = state.approvals.filter((item) => item.title.includes("Disable")).length;
  const approvalCards = state.approvals
    .map((item, index) => {
      const isBlockAction = item.title.includes("Block");
      const requestCode = `APR-${String(index + 41).padStart(3, "0")}`;
      const riskScore = isBlockAction ? 92 : 87;
      const severity = isBlockAction ? "Critical" : "High";
      const confidence = isBlockAction ? "High Confidence" : "Medium Confidence";
      const targetLabel = isBlockAction ? "Indicator" : "Identity";
      const tags = isBlockAction
        ? ["IOC Match", "Credential Abuse", "External Intel"]
        : ["Account Takeover", "Privilege Risk", "User Impact"];
      const evidenceSummary = isBlockAction
        ? "Observed across threat intel, sign-in correlation, and policy engine escalation."
        : "Investigation agent flagged user disable after correlated identity anomalies and elevated access risk.";
      return `
        <div class="approval-card ${isBlockAction ? "approval-card-critical" : "approval-card-high"}">
          <div class="approval-card-top">
            <div class="approval-heading">
              <div class="section-kicker">${requestCode} • ${severity} Response Gate</div>
              <h3 class="section-title">${escapeHtml(item.title)}</h3>
            </div>
            <div class="approval-status-block">
              ${renderBadge(item.status, "status")}
              <div class="approval-risk-score">
                <span class="small muted">Risk score</span>
                <strong>${riskScore}/100</strong>
              </div>
            </div>
          </div>
          <div class="approval-detail-grid">
            <div class="approval-target-panel">
              <div class="approval-panel-label">${targetLabel}</div>
              <div class="approval-target-value mono">${escapeHtml(item.target)}</div>
              <div class="muted small">${escapeHtml(confidence)}</div>
            </div>
            <div class="approval-context">
              <div class="approval-kv"><span>Requested by</span><strong>${escapeHtml(item.requestedBy)}</strong></div>
              <div class="approval-kv"><span>Decision type</span><strong>${isBlockAction ? "Preventive containment" : "Identity containment"}</strong></div>
              <div class="approval-kv"><span>Reason</span><strong>${escapeHtml(item.reason)}</strong></div>
            </div>
          </div>
          <div class="approval-evidence">
            <div class="approval-panel-label">Evidence summary</div>
            <p class="section-note">${escapeHtml(evidenceSummary)}</p>
            <div class="approval-tags">
              ${tags.map((tag) => `<span class="approval-tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
          <div class="card-actions">
            <button class="link-button primary" data-action="approve-request" data-id="${item.id}">Approve Action</button>
            <button class="link-button" data-action="reject-request" data-id="${item.id}">Reject</button>
            <button class="link-button" data-action="view-evidence" data-id="${item.id}">${item.title.includes("Disable") ? "Request More Information" : "View Evidence"}</button>
          </div>
        </div>
      `;
    })
    .join("");
  return renderPageFrame(
    route,
    "Human Approvals",
    "Approval queue for actions that require human judgment before simulated response steps proceed.",
    `
      <div class="approval-summary-grid">
        <div class="mini-card approval-summary-card">
          <div class="approval-panel-label">Pending approvals</div>
          <div class="metric-value">${pendingCount}</div>
          <div class="metric-foot">Human decision gates waiting in the response queue</div>
        </div>
        <div class="mini-card approval-summary-card">
          <div class="approval-panel-label">Critical containment</div>
          <div class="metric-value">${criticalCount}</div>
          <div class="metric-foot">Network and IOC actions requiring explicit approval</div>
        </div>
        <div class="mini-card approval-summary-card">
          <div class="approval-panel-label">Identity containment</div>
          <div class="metric-value">${highRiskTargets}</div>
          <div class="metric-foot">User-facing actions with elevated business impact</div>
        </div>
      </div>
      <div class="approval-grid" style="margin-top:16px;">
        ${approvalCards}
      </div>
    `,
    `
      <button class="control-button" data-nav="response-actions">View response actions</button>
      <button class="control-button primary" data-action="mark-all-notifications-read">Clear notifications</button>
    `
  );
}

function renderResponseActions(route) {
  return renderPageFrame(
    route,
    "Response Actions",
    "Track simulated automated and human-gated response actions across incidents and investigations.",
    `
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Target</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.responseActions
                .map(
                  (entry) => `
                    <tr>
                      <td>${escapeHtml(entry.action)}</td>
                      <td>${escapeHtml(entry.target)}</td>
                      <td>${renderBadge(entry.status, "status")}</td>
                      <td>${escapeHtml(entry.requestedBy)}</td>
                      <td>${timeAgo(entry.createdAt)}</td>
                      <td>
                        <div class="row-between">
                          <button class="link-button" data-action="rerun-response-action" data-id="${entry.id}">Retry</button>
                          <button class="link-button" data-action="complete-response-action" data-id="${entry.id}">Complete</button>
                        </div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function renderAgentActivity(route) {
  return renderPageFrame(
    route,
    "Agent Activity",
    "Timeline of agent actions, tools used, targets touched, results generated, and approval states.",
    `
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Agent</th>
                <th>Action</th>
                <th>Tool</th>
                <th>Target</th>
                <th>Result</th>
                <th>Risk</th>
                <th>Human Approval</th>
              </tr>
            </thead>
            <tbody>
              ${state.agentActivity
                .map(
                  (entry) => `
                    <tr>
                      <td>${formatDate(entry.timestamp)}</td>
                      <td>${escapeHtml(entry.agent)}</td>
                      <td>${escapeHtml(entry.action)}</td>
                      <td>${escapeHtml(entry.tool)}</td>
                      <td>${escapeHtml(entry.target)}</td>
                      <td>${escapeHtml(entry.result)}</td>
                      <td>${escapeHtml(entry.risk)}</td>
                      <td>${escapeHtml(entry.approval)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function renderLogSources(route) {
  return renderPageFrame(
    route,
    "Log Sources",
    "Monitor source health, event rates, and operational control of inbound telemetry.",
    `
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Provider</th>
                <th>Events Today</th>
                <th>Events/sec</th>
                <th>Status</th>
                <th>Last Event</th>
                <th>Health</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.logSources
                .map(
                  (src) => `
                    <tr>
                      <td>${escapeHtml(src.source)}</td>
                      <td>${escapeHtml(src.provider)}</td>
                      <td>${escapeHtml(src.eventsToday)}</td>
                      <td>${src.eps}</td>
                      <td>${renderBadge(src.status, "status")}</td>
                      <td>${timeAgo(src.lastEvent)}</td>
                      <td>${escapeHtml(src.health)}</td>
                      <td>
                        <div class="row-between">
                          <button class="link-button" data-action="toggle-log-source" data-id="${src.id}">${src.status === "Paused" ? "Resume" : "Pause"}</button>
                          <button class="link-button" data-action="view-log-source" data-id="${src.id}">View Events</button>
                          <button class="link-button" data-action="configure-log-source" data-id="${src.id}">Configure</button>
                        </div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `,
    `
      <button class="control-button primary" data-action="add-log-source">Add Log Source</button>
    `
  );
}

function filteredLogs() {
  let logs = [...state.rawLogs];
  const filters = state.ui.rawLogFilters;
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    logs = logs.filter((item) => JSON.stringify(item.body).toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle));
  }
  ["source", "user", "ip", "eventType", "severity"].forEach((key) => {
    if (filters[key]) logs = logs.filter((item) => item[key] === filters[key]);
  });
  return logs;
}

function renderRawLogs(route) {
  return renderPageFrame(
    route,
    "Raw Log Viewer",
    "Search, filter, expand, copy, and route raw events into investigations or new detection rules.",
    `
      <div class="table-card">
        <div class="filter-row">
          ${renderInput("Search", "ui.rawLogFilters.search", state.ui.rawLogFilters.search, "Search event payloads")}
          ${renderSelect("Source", "ui.rawLogFilters.source", ["", ...uniqueValues(state.rawLogs, "source")], state.ui.rawLogFilters.source)}
          ${renderSelect("User", "ui.rawLogFilters.user", ["", ...uniqueValues(state.rawLogs, "user")], state.ui.rawLogFilters.user)}
          ${renderSelect("IP", "ui.rawLogFilters.ip", ["", ...uniqueValues(state.rawLogs, "ip")], state.ui.rawLogFilters.ip)}
          ${renderSelect("Event Type", "ui.rawLogFilters.eventType", ["", ...uniqueValues(state.rawLogs, "eventType")], state.ui.rawLogFilters.eventType)}
          ${renderSelect("Severity", "ui.rawLogFilters.severity", ["", ...SEVERITIES], state.ui.rawLogFilters.severity)}
        </div>
      </div>
      <div class="stack" style="margin-top:16px;">
        ${filteredLogs()
          .map(
            (log) => `
              <div class="table-card">
                <div class="panel-actions">
                  <div>
                    <strong>${escapeHtml(log.id)}</strong>
                    <div class="muted small">${escapeHtml(log.source)} - ${escapeHtml(log.eventType)} - ${formatDateLong(log.timestamp)}</div>
                  </div>
                  <div class="row-between">
                    ${renderBadge(log.severity, "severity")}
                    ${log.suspicious ? renderBadge("Suspicious", "status") : ""}
                  </div>
                </div>
                <pre class="code-block">${escapeHtml(JSON.stringify(log.body, null, 2))}</pre>
                <div class="card-actions" style="margin-top:14px;">
                  <button class="link-button" data-action="toggle-log-expand" data-id="${log.id}">${log.expanded ? "Collapse" : "Expand"}</button>
                  <button class="link-button" data-action="copy-log" data-id="${log.id}">Copy</button>
                  <button class="link-button" data-action="log-to-investigation" data-id="${log.id}">Add to Investigation</button>
                  <button class="link-button" data-action="rule-from-log" data-id="${log.id}">Create Rule from Event</button>
                  <button class="link-button" data-action="mark-log-suspicious" data-id="${log.id}">Mark Suspicious</button>
                </div>
                ${
                  log.expanded
                    ? `<div class="muted small" style="margin-top:10px;">Expanded context: actor ${escapeHtml(log.user)}, ip ${escapeHtml(log.ip)}, source ${escapeHtml(log.source)}</div>`
                    : ""
                }
              </div>
            `
          )
          .join("")}
      </div>
    `
  );
}

function renderIntegrations(route) {
  const categories = [...new Set(state.integrations.map((item) => item.category))];
  return renderPageFrame(
    route,
    "Integrations",
    "Simulated cloud, SIEM, threat intelligence, identity, and communication integrations with local connect/test/save flows.",
    `
      ${categories
        .map(
          (category) => `
            <div class="stack" style="margin-bottom:20px;">
              <div class="section-head">
                <div>
                  <div class="section-kicker">${escapeHtml(category)}</div>
                  <h3 class="section-title">${escapeHtml(category)} Integrations</h3>
                </div>
              </div>
              <div class="integration-grid">
                ${state.integrations
                  .filter((item) => item.category === category)
                  .map(
                    (item) => `
                      <div class="integration-card">
                        <div class="row-between">
                          <div>
                            <h3 class="section-title">${escapeHtml(item.name)}</h3>
                            <div class="muted small">${escapeHtml(item.detail)}</div>
                          </div>
                          ${renderBadge(item.status, "status")}
                        </div>
                        <div class="card-actions">
                          <button class="link-button" data-action="configure-integration" data-id="${item.id}">Configure</button>
                          <button class="link-button" data-action="${item.status === "Connected" ? "disconnect-integration" : "connect-integration"}" data-id="${item.id}">${item.status === "Connected" ? "Disconnect" : "Connect"}</button>
                          <button class="link-button primary" data-action="test-integration" data-id="${item.id}">Test Connection</button>
                        </div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          `
        )
        .join("")}
    `
  );
}

function renderReports(route) {
  return renderPageFrame(
    route,
    "Reports",
    "Generate executive, incident, posture, intelligence, compliance, and AI performance reports in the frontend.",
    `
      <div class="report-grid">
        ${[
          "Executive Security Summary",
          "Incident Report",
          "Threat Intelligence Report",
          "Cloud Security Report",
          "AI Agent Performance Report",
          "Alert Compression Report",
          "Compliance Report",
        ]
          .map(
            (name) => `
              <div class="report-card">
                <h3 class="section-title">${escapeHtml(name)}</h3>
                <div class="muted small">Generate a demo-ready preview and downloadable artifact.</div>
                <div class="card-actions">
                  <button class="link-button primary" data-action="generate-report" data-name="${escapeHtml(name)}">Generate</button>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
      ${
        state.reports.length
          ? `
            <div class="table-card" style="margin-top:16px;">
              <div class="section-head">
                <h3 class="section-title">Generated Reports</h3>
              </div>
              <div class="stack">
                ${state.reports
                  .map(
                    (report) => `
                      <div class="result-item">
                        <div class="row-between">
                          <strong>${escapeHtml(report.name)}</strong>
                          ${renderBadge(report.status, "status")}
                        </div>
                        <div class="muted small">${report.progress}% complete</div>
                        <div class="progress-shell"><div class="progress-bar" style="width:${report.progress}%"></div></div>
                        <div class="card-actions">
                          <button class="link-button" data-action="preview-report" data-id="${report.id}">Preview</button>
                          <button class="link-button" data-action="download-report" data-id="${report.id}">Download</button>
                        </div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          `
          : ""
      }
    `
  );
}

function renderCompliance(route) {
  return renderPageFrame(
    route,
    "Compliance",
    "Frontend compliance tracking across common frameworks with local evidence and action links.",
    `
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Check</th>
                <th>Framework</th>
                <th>Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.complianceChecks
                .map(
                  (check) => `
                    <tr>
                      <td>${escapeHtml(check.name)}</td>
                      <td>${escapeHtml(check.framework)}</td>
                      <td>${check.score}</td>
                      <td>${renderBadge(check.status, "status")}</td>
                      <td>
                        <button class="link-button" data-action="review-compliance" data-id="${check.id}">Review</button>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function renderAuditLogs(route) {
  return renderPageFrame(
    route,
    "Audit Logs",
    "Track frontend user actions, agent actions, and admin configuration changes with local filters and search.",
    `
      <div class="table-card">
        ${renderInput("Search", "ui.auditSearch", state.ui.auditSearch || "", "Search actor, action, or target")}
        <div class="table-wrap" style="margin-top:16px;">
          <table>
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${state.auditLogs
                .filter((entry) => {
                  if (!state.ui.auditSearch) return true;
                  const needle = state.ui.auditSearch.toLowerCase();
                  return [entry.actor, entry.action, entry.target].some((value) => String(value).toLowerCase().includes(needle));
                })
                .map(
                  (entry) => `
                    <tr>
                      <td>${escapeHtml(entry.actor)}</td>
                      <td>${escapeHtml(entry.action)}</td>
                      <td>${escapeHtml(entry.target)}</td>
                      <td>${formatDate(entry.at)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function renderUsers(route) {
  return renderPageFrame(
    route,
    "Users",
    "Manage analysts, administrators, managers, and viewers entirely in local frontend state.",
    `
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.users
                .map(
                  (user) => `
                    <tr>
                      <td>${escapeHtml(user.name)}</td>
                      <td>${escapeHtml(user.email)}</td>
                      <td>${escapeHtml(user.role)}</td>
                      <td>${renderBadge(user.status, "status")}</td>
                      <td>
                        <div class="row-between">
                          <button class="link-button" data-action="edit-user" data-id="${user.id}">Edit</button>
                          <button class="link-button" data-action="toggle-user-status" data-id="${user.id}">${user.status === "Active" ? "Disable" : "Enable"}</button>
                          <button class="link-button" data-action="change-role" data-id="${user.id}">Change Role</button>
                          <button class="link-button" data-action="delete-user" data-id="${user.id}">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `,
    `
      <button class="control-button primary" data-action="add-user">Add User</button>
    `
  );
}

function renderRoles(route) {
  return renderPageFrame(
    route,
    "Roles & Permissions",
    "Editable local permissions matrix for administrators, managers, analysts, and viewers.",
    `
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Dashboard</th>
                <th>Investigations</th>
                <th>Rules</th>
                <th>Approvals</th>
                <th>Settings</th>
              </tr>
            </thead>
            <tbody>
              ${state.roles
                .map(
                  (role) => `
                    <tr>
                      <td>${escapeHtml(role.name)}</td>
                      ${["dashboard", "investigations", "rules", "approvals", "settings"]
                        .map(
                          (perm) => `
                            <td><input type="checkbox" data-action="toggle-role-permission" data-id="${role.id}" data-perm="${perm}" ${role.permissions[perm] ? "checked" : ""} /></td>
                          `
                        )
                        .join("")}
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function renderSettings(route) {
  const tab = state.ui.tabs.settings;
  const tabs = [
    ["general", "General"],
    ["organization", "Organization"],
    ["security", "Security"],
    ["aiAgents", "AI Agents"],
    ["notifications", "Notifications"],
    ["appearance", "Appearance"],
    ["dataRetention", "Data Retention"],
  ];
  return renderPageFrame(
    route,
    "Settings",
    "Update frontend application preferences, operating posture, and presentation state.",
    `
      <div class="tab-row">
        ${tabs
          .map(([key, label]) => `<button class="tab-button ${tab === key ? "active" : ""}" data-action="set-settings-tab" data-tab="${key}">${escapeHtml(label)}</button>`)
          .join("")}
      </div>
      <div class="table-card" style="margin-top:16px;">
        ${renderSettingsTab(tab)}
      </div>
    `
  );
}

function renderSettingsTab(tab) {
  if (tab === "general") {
    return `
      <div class="form-grid">
        ${renderSelect("Default severity threshold", "settings.general.severityThreshold", ["Low", "Medium", "High", "Critical"], state.settings.general.severityThreshold)}
        ${renderSelect("Default cloud environment", "settings.general.cloudEnvironment", ENVIRONMENTS, state.settings.general.cloudEnvironment)}
      </div>
    `;
  }
  if (tab === "organization") {
    return `
      <div class="form-grid">
        ${renderSelect("Current organization", "organization", ORGANIZATIONS, state.organization)}
        ${renderSelect("Current environment", "environment", ENVIRONMENTS, state.environment)}
      </div>
    `;
  }
  if (tab === "security") {
    return `
      <div class="check-grid">
        ${renderCheckbox("Auto-start investigations", "settings.security.autoStartInvestigations", state.settings.security.autoStartInvestigations)}
        ${renderCheckbox("Require human approval", "settings.security.requireHumanApproval", state.settings.security.requireHumanApproval)}
      </div>
    `;
  }
  if (tab === "aiAgents") {
    return `
      <div class="check-grid">
        ${renderCheckbox("Autonomous investigations", "settings.aiAgents.autonomousInvestigations", state.settings.aiAgents.autonomousInvestigations)}
        ${renderSelect("Enrichment depth", "settings.aiAgents.enrichmentDepth", ["Light", "Balanced", "Deep"], state.settings.aiAgents.enrichmentDepth)}
      </div>
    `;
  }
  if (tab === "notifications") {
    return `
      <div class="check-grid">
        ${renderCheckbox("Critical incidents", "settings.notifications.criticalIncidents", state.settings.notifications.criticalIncidents)}
        ${renderCheckbox("Playbook runs", "settings.notifications.playbookRuns", state.settings.notifications.playbookRuns)}
        ${renderCheckbox("Digest emails", "settings.notifications.digests", state.settings.notifications.digests)}
      </div>
    `;
  }
  if (tab === "appearance") {
    return `
      <div class="form-grid">
        ${renderSelect("Theme", "theme", ["dark", "light", "system"], state.theme)}
      </div>
    `;
  }
  return `
    <div class="form-grid">
      ${renderInput("Alert retention days", "settings.dataRetention.alertsDays", state.settings.dataRetention.alertsDays, "90")}
      ${renderInput("Log retention days", "settings.dataRetention.logsDays", state.settings.dataRetention.logsDays, "365")}
    </div>
  `;
}

function renderInput(label, model, value, placeholder = "") {
  return `
    <div class="field">
      <label>${escapeHtml(label)}</label>
      <input class="control-input" data-model="${model}" value="${escapeHtml(String(value ?? ""))}" placeholder="${escapeHtml(placeholder)}" />
    </div>
  `;
}

function renderSelect(label, model, options, value) {
  return `
    <div class="field">
      <label>${escapeHtml(label)}</label>
      <select class="control-select" data-model="${model}">
        ${options
          .map((option) => {
            const labelText = option === "" ? "All" : option;
            return `<option value="${escapeHtml(String(option))}" ${String(option) === String(value) ? "selected" : ""}>${escapeHtml(String(labelText))}</option>`;
          })
          .join("")}
      </select>
    </div>
  `;
}

function renderCheckbox(label, model, checked) {
  return `
    <label class="check-item">
      <input type="checkbox" data-model="${model}" ${checked ? "checked" : ""} />
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function sortableHeader(label, key) {
  const active = state.ui.alertSort.key === key;
  const direction = active ? state.ui.alertSort.direction : "";
  return `<th><button class="link-button" data-action="sort-alerts" data-key="${key}">${escapeHtml(label)} ${direction ? (direction === "asc" ? "^" : "v") : ""}</button></th>`;
}

function uniqueValues(list, key) {
  return [...new Set(list.map((item) => item[key]))];
}

function groupedSearchResults(query) {
  if (!query) return {};
  const needle = query.toLowerCase();
  const makeItems = (list, mapper) => list.filter((item) => mapper(item).haystack.toLowerCase().includes(needle)).map((item) => mapper(item).result);
  return {
    Alerts: makeItems(state.alerts, (item) => ({
      haystack: `${item.id} ${item.title} ${item.ip} ${item.user} ${item.asset}`,
      result: { label: `${item.id} - ${item.title}`, meta: `${item.severity} alert`, route: "alerts" },
    })),
    Incidents: makeItems(state.incidents, (item) => ({
      haystack: `${item.id} ${item.title} ${item.user} ${item.asset}`,
      result: { label: item.title, meta: `${item.severity} incident`, route: `incident/${item.id}` },
    })),
    Users: makeItems(state.users, (item) => ({
      haystack: `${item.name} ${item.email} ${item.role}`,
      result: { label: item.name, meta: item.role, route: "users" },
    })),
    Assets: makeItems(state.assets, (item) => ({
      haystack: `${item.name} ${item.type} ${item.provider} ${item.owner}`,
      result: { label: item.name, meta: `${item.type} - ${item.provider}`, route: `asset/${item.id}` },
    })),
    Rules: makeItems(state.rules, (item) => ({
      haystack: `${item.name} ${item.description} ${item.source}`,
      result: { label: item.name, meta: `Rule - ${item.source}`, route: "detection-rules" },
    })),
    Policies: makeItems(state.policies, (item) => ({
      haystack: `${item.name} ${item.logic} ${item.result}`,
      result: { label: item.name, meta: "Policy", route: "policies" },
    })),
    Agents: makeItems(state.agents, (item) => ({
      haystack: `${item.name} ${item.description} ${item.recentAction}`,
      result: { label: item.name, meta: item.status, route: item.route },
    })),
  };
}

function renderModal() {
  if (!state.ui.modal) return "";
  const modal = state.ui.modal;
  if (modal.type === "rule-form") {
    const draft = modal.draft;
    return `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal">
        <div class="panel-actions">
          <div>
            <h3 class="modal-title">${modal.mode === "edit" ? "Edit Detection Rule" : "Create Detection Rule"}</h3>
            <p class="section-note">All changes save locally and persist across refresh.</p>
          </div>
          <button class="icon-button" data-action="close-modal">Close</button>
        </div>
        <div class="form-grid">
          ${renderInput("Rule Name", "ui.modal.draft.name", draft.name || "", "Rule Name")}
          ${renderInput("Description", "ui.modal.draft.description", draft.description || "", "Description")}
          ${renderSelect("Data Source", "ui.modal.draft.source", RULE_SOURCES, draft.source || RULE_SOURCES[0])}
          ${renderInput("Condition Field", "ui.modal.draft.conditionField", draft.conditionField || "failed_login_count")}
          ${renderSelect("Operator", "ui.modal.draft.conditionOperator", ["greater than", "less than", "equals", "contains"], draft.conditionOperator || "greater than")}
          ${renderInput("Value", "ui.modal.draft.conditionValue", draft.conditionValue || "10")}
          ${renderInput("Group By", "ui.modal.draft.groupBy", draft.groupBy || "source_ip")}
          ${renderInput("Time Window", "ui.modal.draft.window", draft.window || "5 minutes")}
          ${renderSelect("Severity", "ui.modal.draft.severity", SEVERITIES, draft.severity || "High")}
        </div>
        <div class="check-grid" style="margin-top:14px;">
          ${["Create Alert", "Run Threat Intelligence", "Start AI Investigation", "Notify Analyst", "Request Human Review", "Simulate Block IP"]
            .map(
              (action) => `
                <label class="check-item">
                  <input type="checkbox" data-action="toggle-rule-action" data-value="${action}" ${(draft.actions || []).includes(action) ? "checked" : ""} />
                  <span>${escapeHtml(action)}</span>
                </label>
              `
            )
            .join("")}
        </div>
        <div class="form-actions" style="margin-top:18px;">
          <button class="control-button" data-action="test-modal-rule">Test Rule</button>
          <button class="control-button" data-action="save-rule-draft">Save Draft</button>
          <button class="control-button primary" data-action="save-rule-enable">${modal.mode === "edit" ? "Save Changes" : "Save & Enable"}</button>
          <button class="control-button" data-action="close-modal">Cancel</button>
        </div>
      </div>
    `;
  }
  if (modal.type === "policy-form") {
    const draft = modal.draft;
    return `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal">
        <div class="panel-actions">
          <div>
            <h3 class="modal-title">${modal.mode === "edit" ? "Edit Policy" : "Create Policy"}</h3>
            <p class="section-note">Update business logic and downstream automated actions.</p>
          </div>
          <button class="icon-button" data-action="close-modal">Close</button>
        </div>
        <div class="form-grid">
          ${renderInput("Policy Name", "ui.modal.draft.name", draft.name || "", "Policy Name")}
          ${renderInput("Logic", "ui.modal.draft.logic", draft.logic || "", "User Role = Administrator ...")}
          ${renderInput("Result", "ui.modal.draft.result", draft.result || "", "Risk +40, Start Investigation")}
          ${renderInput("Owner", "ui.modal.draft.owner", draft.owner || "", "Owner")}
        </div>
        <div class="form-actions" style="margin-top:18px;">
          <button class="control-button primary" data-action="save-policy">Save Policy</button>
          <button class="control-button" data-action="close-modal">Cancel</button>
        </div>
      </div>
    `;
  }
  if (modal.type === "user-form") {
    const draft = modal.draft;
    return `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal">
        <div class="panel-actions">
          <div>
            <h3 class="modal-title">${modal.mode === "edit" ? "Edit User" : "Add User"}</h3>
            <p class="section-note">Manage demo users locally.</p>
          </div>
          <button class="icon-button" data-action="close-modal">Close</button>
        </div>
        <div class="form-grid">
          ${renderInput("Name", "ui.modal.draft.name", draft.name || "", "Name")}
          ${renderInput("Email", "ui.modal.draft.email", draft.email || "", "Email")}
          ${renderSelect("Role", "ui.modal.draft.role", ["Administrator", "Security Manager", "SOC Analyst", "Viewer"], draft.role || "Viewer")}
          ${renderSelect("Status", "ui.modal.draft.status", ["Active", "Disabled"], draft.status || "Active")}
        </div>
        <div class="form-actions" style="margin-top:18px;">
          <button class="control-button primary" data-action="save-user">Save User</button>
          <button class="control-button" data-action="close-modal">Cancel</button>
        </div>
      </div>
    `;
  }
  if (modal.type === "integration-config") {
    return `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal">
        <div class="panel-actions">
          <div>
            <h3 class="modal-title">Configure ${escapeHtml(modal.integration.name)}</h3>
            <p class="section-note">Credentials remain entirely local in this frontend simulation.</p>
          </div>
          <button class="icon-button" data-action="close-modal">Close</button>
        </div>
        <div class="form-grid">
          ${renderInput("API Key / Token", "ui.modal.draft.apiKey", modal.draft.apiKey || "", "demo-token")}
          ${renderInput("Endpoint", "ui.modal.draft.endpoint", modal.draft.endpoint || "", "https://demo.endpoint")}
          ${renderInput("Workspace / Tenant", "ui.modal.draft.workspace", modal.draft.workspace || "", "oswell-demo")}
        </div>
        <div class="form-actions" style="margin-top:18px;">
          <button class="control-button" data-action="test-modal-integration" data-id="${modal.integration.id}">Test</button>
          <button class="control-button primary" data-action="save-integration" data-id="${modal.integration.id}">Save</button>
          <button class="control-button" data-action="close-modal">Cancel</button>
        </div>
      </div>
    `;
  }
  if (modal.type === "report-preview") {
    const report = state.reports.find((item) => item.id === modal.id);
    return `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal">
        <div class="panel-actions">
          <div>
            <h3 class="modal-title">${escapeHtml(report?.name || "Report Preview")}</h3>
            <p class="section-note">Preview generated content before download.</p>
          </div>
          <button class="icon-button" data-action="close-modal">Close</button>
        </div>
        <pre class="code-block">${escapeHtml(report?.content || "No content available.")}</pre>
        <div class="form-actions" style="margin-top:18px;">
          <button class="control-button primary" data-action="download-report" data-id="${report?.id}">Download</button>
          <button class="control-button" data-action="close-modal">Close</button>
        </div>
      </div>
    `;
  }
  if (modal.type === "finding") {
    return `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal">
        <div class="panel-actions">
          <div>
            <h3 class="modal-title">${escapeHtml(modal.finding.title)}</h3>
            <p class="section-note">${escapeHtml(modal.finding.severity)} finding</p>
          </div>
          <button class="icon-button" data-action="close-modal">Close</button>
        </div>
        <p>${escapeHtml(modal.finding.detail)}</p>
        <div class="form-actions">
          <button class="control-button primary" data-action="create-finding-incident" data-title="${escapeHtml(modal.finding.title)}">Create incident</button>
          <button class="control-button" data-action="close-modal">Close</button>
        </div>
      </div>
    `;
  }
  if (modal.type === "help") {
    return `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal">
        <div class="panel-actions">
          <div>
            <h3 class="modal-title">Security Glossary</h3>
            <p class="section-note">Tooltips and definitions for technical language used across the platform.</p>
          </div>
          <button class="icon-button" data-action="close-modal">Close</button>
        </div>
        <div class="stack">
          ${[
            ["Risk Score", "A weighted measure of likelihood, impact, and corroborating evidence."],
            ["IOC", "Indicator of Compromise such as an IP, domain, URL, or hash associated with malicious activity."],
            ["MITRE ATT&CK", "A framework describing attacker tactics and techniques."],
            ["Event Correlation", "Linking multiple low-level events into a higher-confidence story."],
            ["Threat Intelligence", "External knowledge about adversaries, infrastructure, and malware."],
            ["Confidence", "How strongly the evidence supports the generated conclusion."],
            ["AI Compression Ratio", "How effectively the system compresses raw event volume into analyst-ready actions."],
          ]
            .map(
              ([term, description]) => `
                <div class="result-item">
                  <strong>${escapeHtml(term)}</strong>
                  <div>${escapeHtml(description)}</div>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }
  if (modal.type === "ai-rule") {
    const generated = modal.generated;
    return `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal">
        <div class="panel-actions">
          <div>
            <h3 class="modal-title">Create Rule with AI</h3>
            <p class="section-note">Simulated AI rule-generation based on predefined frontend logic.</p>
          </div>
          <button class="icon-button" data-action="close-modal">Close</button>
        </div>
        ${renderInput("Prompt", "ui.modal.prompt", modal.prompt || "", "Alert me when the same IP attempts to log into more than 10 accounts within five minutes.")}
        <div class="form-actions" style="margin-top:16px;">
          <button class="control-button primary" data-action="generate-ai-rule">Generate Rule</button>
        </div>
        ${
          generated
            ? `
              <div class="stack" style="margin-top:18px;">
                <div class="result-item"><strong>WHEN</strong><div class="mono">${escapeHtml(generated.when)}</div></div>
                <div class="result-item"><strong>GROUP BY</strong><div class="mono">${escapeHtml(generated.groupBy)}</div></div>
                <div class="result-item"><strong>WINDOW</strong><div class="mono">${escapeHtml(generated.window)}</div></div>
                <div class="result-item"><strong>SEVERITY</strong><div class="mono">${escapeHtml(generated.severity)}</div></div>
                <div class="form-actions">
                  <button class="control-button" data-action="edit-generated-rule">Edit</button>
                  <button class="control-button" data-action="test-generated-rule">Test</button>
                  <button class="control-button primary" data-action="approve-generated-rule">Approve & Activate</button>
                </div>
              </div>
            `
            : ""
        }
      </div>
    `;
  }
  return "";
}

function renderDrawer() {
  if (!state.ui.drawer) return "";
  const drawer = state.ui.drawer;
  if (drawer.type === "agent-config") {
    const agent = state.agents.find((item) => item.id === drawer.id);
    return `
      <div class="drawer-backdrop" data-action="close-drawer"></div>
      <div class="drawer">
        <div class="panel-actions">
          <div>
            <h3 class="drawer-title">Configure ${escapeHtml(agent.name)}</h3>
            <p class="section-note">Adjust local automation posture and simulated behavior.</p>
          </div>
          <button class="icon-button" data-action="close-drawer">Close</button>
        </div>
        <div class="check-grid">
          ${renderCheckbox("Auto-run every 5 minutes", "ui.drawer.autoRun", drawer.autoRun ?? true)}
          ${renderCheckbox("Escalate critical findings automatically", "ui.drawer.autoEscalate", drawer.autoEscalate ?? true)}
          ${renderCheckbox("Notify analyst on completion", "ui.drawer.notify", drawer.notify ?? true)}
        </div>
        <div class="form-actions" style="margin-top:18px;">
          <button class="control-button primary" data-action="save-agent-config" data-id="${agent.id}">Save configuration</button>
          <button class="control-button" data-action="close-drawer">Cancel</button>
        </div>
      </div>
    `;
  }
  return "";
}

function renderToasts() {
  if (!state.ui.toasts.length) return "";
  return `
    <div class="toast-stack">
      ${state.ui.toasts
        .map(
          (item) => `
            <div class="toast">
              <div class="toast-title">${escapeHtml(item.title)}</div>
              <div class="toast-copy">${escapeHtml(item.body)}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderPage(route) {
  switch (route.key) {
    case "dashboard":
      return renderDashboard(route);
    case "security-posture":
      return renderSecurityPosture(route);
    case "alerts":
      return renderAlerts(route);
    case "incidents":
      return renderIncidents(route);
    case "incident-details":
      return renderIncidentDetails(route);
    case "investigations":
      return renderInvestigations(route);
    case "threat-intelligence":
      return renderThreatIntelligence(route);
    case "agent-center":
      return renderAgentCenter(route);
    case "agent-threat-intel":
    case "agent-log-analysis":
    case "agent-investigation":
    case "agent-configuration":
    case "agent-policy":
      return renderAgentDetails(route);
    case "aws":
      return renderCloudPage(route, "AWS");
    case "azure":
      return renderCloudPage(route, "Azure");
    case "assets":
      return renderAssets(route);
    case "asset-details":
      return renderAssetDetails(route);
    case "configuration-scans":
      return renderConfigurationScans(route);
    case "policies":
      return renderPolicies(route);
    case "detection-rules":
      return renderDetectionRules(route);
    case "risk-rules":
      return renderRiskRules(route);
    case "threat-indicators":
      return renderThreatIndicators(route);
    case "playbooks":
      return renderPlaybooks(route);
    case "approvals":
      return renderApprovals(route);
    case "response-actions":
      return renderResponseActions(route);
    case "agent-activity":
      return renderAgentActivity(route);
    case "log-sources":
      return renderLogSources(route);
    case "integrations":
      return renderIntegrations(route);
    case "raw-logs":
      return renderRawLogs(route);
    case "reports":
      return renderReports(route);
    case "compliance":
      return renderCompliance(route);
    case "audit-logs":
      return renderAuditLogs(route);
    case "users":
      return renderUsers(route);
    case "roles":
      return renderRoles(route);
    case "settings":
      return renderSettings(route);
    default:
      return renderPageFrame(route, "Page not found", "This view is not yet mapped in the local router.", `<div class="empty-card"><button class="control-button primary" data-nav="dashboard">Return home</button></div>`);
  }
}

function render() {
  const existingSidebar = app.querySelector(".sidebar");
  const existingContent = app.querySelector(".content-shell");
  if (existingSidebar) {
    runtime.sidebarScrollTop = existingSidebar.scrollTop;
  }
  if (existingContent) {
    runtime.contentScrollTop = existingContent.scrollTop;
  }
  bodyClass();
  const route = parseRoute();
  const previousRouteKey = runtime.lastRouteKey;
  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar(route)}
      <div class="main-shell">
        ${renderTopbar(route)}
        <main class="content-shell">${renderPage(route)}</main>
      </div>
    </div>
    ${renderModal()}
    ${renderDrawer()}
    ${renderToasts()}
  `;
  const newSidebar = app.querySelector(".sidebar");
  const newContent = app.querySelector(".content-shell");
  if (newSidebar) {
    newSidebar.scrollTop = runtime.sidebarScrollTop;
  }
  if (newContent && previousRouteKey === route.key) {
    newContent.scrollTop = runtime.contentScrollTop;
  } else if (newContent) {
    newContent.scrollTop = 0;
  }
  runtime.lastRouteKey = route.key;
  saveState();
}

function mutate(action) {
  action();
  saveState();
  render();
}

function simulateSequence(steps, onStep, onComplete) {
  steps.forEach((step, index) => {
    const timer = setTimeout(() => {
      onStep(step, index);
      if (index === steps.length - 1 && onComplete) onComplete();
      render();
      saveState();
    }, step.delay);
    runtime.timerIds.add(timer);
  });
}

function createRuleFromPrompt(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes("same ip") && lower.includes("10") && lower.includes("five")) {
    return {
      when: "distinct_users > 10",
      groupBy: "source_ip",
      window: "5 minutes",
      severity: "High",
    };
  }
  return {
    when: "event_count > 5",
    groupBy: "user",
    window: "15 minutes",
    severity: "Medium",
  };
}

function handleModelUpdate(element, event) {
  const path = element.dataset.model;
  if (!path) return;
  let value;
  if (element.type === "checkbox") value = element.checked;
  else if (element.type === "range") value = Number(element.value);
  else value = element.value;
  setByPath(state, path, value);
  if (path === "theme" && value === "system") {
    const supportsMatchMedia = typeof window.matchMedia === "function";
    state.theme = supportsMatchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  if (path.startsWith("settings.") || path === "organization" || path === "environment" || path === "theme") {
    addAudit("Admin", "Updated settings", path);
  }
  render();
}

function openRuleModal(mode, rule) {
  state.ui.modal = {
    type: "rule-form",
    mode,
    ruleId: rule?.id || null,
    draft: clone(
      rule || {
        name: "",
        description: "",
        source: RULE_SOURCES[0],
        severity: "High",
        conditionField: "failed_login_count",
        conditionOperator: "greater than",
        conditionValue: "10",
        groupBy: "source_ip",
        window: "5 minutes",
        actions: ["Create Alert", "Run Threat Intelligence"],
      }
    ),
  };
}

function openPolicyModal(mode, policy) {
  state.ui.modal = {
    type: "policy-form",
    mode,
    policyId: policy?.id || null,
    draft: clone(policy || { name: "", logic: "", result: "", owner: "Security Team" }),
  };
}

function openUserModal(mode, user) {
  state.ui.modal = {
    type: "user-form",
    mode,
    userId: user?.id || null,
    draft: clone(user || { name: "", email: "", role: "Viewer", status: "Active" }),
  };
}

function openIntegrationModal(integration) {
  state.ui.modal = {
    type: "integration-config",
    integration,
    draft: { apiKey: "", endpoint: "", workspace: "" },
  };
}

function downloadFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function findRelatedIncident(alert) {
  return state.incidents.find((incident) => incident.asset === alert.asset || incident.user === alert.user) || state.incidents[0];
}

function handleAction(action, dataset, sourceElement) {
  switch (action) {
    case "toggle-sidebar":
      state.ui.sidebarOpen = !state.ui.sidebarOpen;
      return render();
    case "toggle-notifications":
      state.ui.notificationsOpen = !state.ui.notificationsOpen;
      state.ui.profileOpen = false;
      return render();
    case "toggle-profile":
      state.ui.profileOpen = !state.ui.profileOpen;
      state.ui.notificationsOpen = false;
      return render();
    case "open-help":
      state.ui.modal = { type: "help" };
      return render();
    case "close-modal":
      state.ui.modal = null;
      return render();
    case "close-drawer":
      state.ui.drawer = null;
      return render();
    case "page-reset":
      state.ui.pageModes[dataset.page] = "normal";
      return render();
    case "mark-all-notifications-read":
      state.notifications.forEach((item) => {
        item.read = true;
      });
      addAudit("User", "Marked notifications read", "All notifications");
      return render();
    case "mark-notification-read":
      {
        const item = state.notifications.find((entry) => entry.id === dataset.id);
        if (item) item.read = true;
      }
      return render();
    case "cycle-theme":
      state.theme = state.theme === "dark" ? "light" : "dark";
      state.settings.appearance.theme = state.theme;
      toast("Appearance updated", `Theme switched to ${state.theme}.`);
      return render();
    case "sort-alerts":
      if (state.ui.alertSort.key === dataset.key) {
        state.ui.alertSort.direction = state.ui.alertSort.direction === "asc" ? "desc" : "asc";
      } else {
        state.ui.alertSort.key = dataset.key;
        state.ui.alertSort.direction = "asc";
      }
      return render();
    case "toggle-alert-selection":
      {
        const set = new Set(state.ui.selections.alerts);
        if (set.has(dataset.id)) set.delete(dataset.id);
        else set.add(dataset.id);
        state.ui.selections.alerts = [...set];
      }
      return render();
    case "select-all-alerts":
      {
        const visible = paged(filteredAlerts(), state.ui.pagination.alerts, 8).map((item) => item.id);
        const allSelected = visible.every((id) => state.ui.selections.alerts.includes(id));
        state.ui.selections.alerts = allSelected ? state.ui.selections.alerts.filter((id) => !visible.includes(id)) : [...new Set([...state.ui.selections.alerts, ...visible])];
      }
      return render();
    case "reset-alert-filters":
      state.ui.alertFilters = seedState().ui.alertFilters;
      return render();
    case "apply-alert-bulk-action":
      {
        const select = document.getElementById("bulkAction");
        const bulkAction = select?.value;
        const selectedAlerts = state.alerts.filter((item) => state.ui.selections.alerts.includes(item.id));
        if (!bulkAction || !selectedAlerts.length) {
          toast("Bulk action skipped", "Select alerts and a bulk action first.", "warning");
          return;
        }
        if (bulkAction === "assign") selectedAlerts.forEach((item) => (item.assignedTo = "Alex Morgan"));
        if (bulkAction === "change-severity") selectedAlerts.forEach((item) => (item.severity = "High"));
        if (bulkAction === "investigate") selectedAlerts.forEach((item) => (item.status = "Investigating"));
        if (bulkAction === "resolve") selectedAlerts.forEach((item) => (item.status = "Resolved"));
        if (bulkAction === "tag") selectedAlerts.forEach((item) => item.tags.push("Reviewed"));
        if (bulkAction === "export") {
          downloadFile("alerts-export.json", JSON.stringify(selectedAlerts, null, 2), "application/json");
        }
        addAudit("User", "Applied bulk alert action", `${bulkAction} on ${selectedAlerts.length} alerts`);
        toast("Bulk action applied", `${bulkAction} updated ${selectedAlerts.length} alerts.`);
        if (bulkAction !== "export") addNotification("Alerts updated", `${selectedAlerts.length} alerts changed via bulk action.`, "alerts");
      }
      return render();
    case "change-page":
      {
        const target = dataset.target;
        const delta = Number(dataset.direction);
        const key = `pagination.${target}`;
        const current = getByPath(state.ui, key.replace("pagination.", "pagination."));
        const pageSize = target === "alerts" ? 8 : 8;
        const total = Math.max(1, Math.ceil((target === "alerts" ? filteredAlerts() : []).length / pageSize));
        setByPath(state, `ui.pagination.${target}`, Math.max(1, Math.min(total, current + delta)));
      }
      return render();
    case "simulate-new-alert":
      {
        const alert = {
          id: `ALT-${Math.floor(10000 + Math.random() * 999)}`,
          title: "Suspicious federated login burst",
          severity: "High",
          riskScore: 72,
          source: "Sentinel",
          agent: "Log Analysis Agent",
          user: "multi-user",
          asset: "entra-prod-tenant",
          ip: "109.248.148.37",
          rule: "Federated login spray",
          status: "Queued",
          timestamp: nowIso(),
          assignedTo: "Unassigned",
          tags: ["Identity"],
        };
        state.alerts.unshift(alert);
        addAudit("User", "Simulated alert", alert.id);
        addNotification("New alert queued", `${alert.title} entered the queue.`, "alerts");
        toast("Alert simulated", `${alert.id} queued for triage.`);
      }
      return render();
    case "open-related-incident":
      {
        const alert = state.alerts.find((item) => item.id === dataset.id);
        if (alert) navigate(`incident/${findRelatedIncident(alert).id}`);
      }
      return;
    case "assign-alert":
      {
        const alert = state.alerts.find((item) => item.id === dataset.id);
        if (alert) {
          alert.assignedTo = alert.assignedTo === "Alex Morgan" ? "Sarah Wilson" : "Alex Morgan";
          addAudit("User", "Assigned alert", alert.id);
          toast("Alert assigned", `${alert.id} assigned to ${alert.assignedTo}.`);
        }
      }
      return render();
    case "start-alert-investigation":
      {
        const alert = state.alerts.find((item) => item.id === dataset.id);
        if (alert) {
          alert.status = "Investigating";
          state.investigations.unshift({
            id: uid("inv"),
            title: `Investigation for ${alert.id}`,
            status: "Running",
            riskScore: alert.riskScore,
            correlatedAlerts: [alert.title],
            chain: ["Alert Received", "Correlation Pending", "Investigation Running"],
            owner: "Investigation Agent",
            updatedAt: nowIso(),
          });
          addAudit("User", "Started investigation", alert.id);
          toast("Investigation started", `${alert.id} handed to Investigation Agent.`);
        }
      }
      return render();
    case "resolve-alert":
      {
        const alert = state.alerts.find((item) => item.id === dataset.id);
        if (alert) {
          alert.status = "Resolved";
          addAudit("User", "Resolved alert", alert.id);
          toast("Alert resolved", `${alert.id} marked resolved.`);
        }
      }
      return render();
    case "request-review":
      {
        const incident = state.incidents.find((item) => item.id === dataset.id) || state.incidents[0];
        state.approvals.unshift({
          id: uid("apr"),
          title: "Human Review Requested",
          requestedBy: "Investigation Agent",
          target: incident.title,
          reason: "AI confidence high, human approval requested before simulated response.",
          status: "Pending",
          createdAt: nowIso(),
        });
        addNotification("Human approval requested", `Review requested for ${incident.title}.`, "approvals");
        toast("Review requested", `Approval queue updated for ${incident.title}.`);
      }
      return render();
    case "set-incident-tab":
      state.ui.tabs.incident = dataset.tab;
      return render();
    case "run-threat-intel-incident":
      {
        const incident = incidentById(dataset.id);
        if (!incident) return;
        toast("Threat intel started", "Checking threat intelligence sources...");
        simulateSequence(
          [
            { delay: 700, phase: "Checking AbuseIPDB" },
            { delay: 1500, phase: "Checking VirusTotal" },
            { delay: 2300, phase: "Checking AlienVault OTX" },
          ],
          (step) => {
            incident.activity.unshift({ id: uid("act"), actor: "Threat Intel Agent", action: step.phase, at: nowIso() });
          },
          () => {
            incident.riskScore = Math.min(100, incident.riskScore + 3);
            incident.timeline.push({ id: uid("evt"), time: "03:01", event: "Threat intel enrichment confirmed malicious infrastructure" });
            incident.threatIntel = [
              { source: "AbuseIPDB", verdict: "Malicious", detail: "Credential abuse cluster observed" },
              { source: "VirusTotal", verdict: "8 detections", detail: "Flagged by multiple vendors" },
              { source: "AlienVault OTX", verdict: "Matched", detail: "Known credential attack infrastructure" },
              { source: "GreyNoise", verdict: "Seen", detail: "Internet-facing scanning from TOR exit node" },
            ];
            addAudit("Threat Intel Agent", "Ran threat intel enrichment", incident.title);
            addNotification("Threat intel complete", `${incident.title} intelligence results updated.`, `incident/${incident.id}`);
            toast("Threat intel complete", "Risk score updated and results added to timeline.");
          }
        );
      }
      return;
    case "generate-incident-report":
      startReportGeneration(`Incident Report - ${dataset.id}`);
      return;
    case "create-detection-from-incident":
      {
        const incident = incidentById(dataset.id);
        openRuleModal("create", {
          name: `${incident.title} follow-up rule`,
          description: "Generated from incident evidence.",
          source: incident.source.includes("Azure") ? "Azure Entra ID" : "AWS CloudTrail",
          severity: incident.severity,
          status: "Draft",
          triggerCount: 0,
          lastTriggered: nowIso(),
          updatedBy: "AI Assistant",
          conditionField: "risk_score",
          conditionOperator: "greater than",
          conditionValue: String(incident.riskScore - 10),
          groupBy: "user",
          window: "15 minutes",
          actions: ["Create Alert", "Start AI Investigation"],
        });
      }
      return render();
    case "assign-incident":
      {
        const incident = incidentById(dataset.id);
        if (incident) {
          incident.assignedTo = incident.assignedTo === "Alex Morgan" ? "Sarah Wilson" : "Alex Morgan";
          incident.activity.unshift({ id: uid("act"), actor: "User", action: `Assigned to ${incident.assignedTo}`, at: nowIso() });
          toast("Incident reassigned", `${incident.title} -> ${incident.assignedTo}.`);
        }
      }
      return render();
    case "change-incident-severity":
      {
        const incident = incidentById(dataset.id);
        if (incident) {
          incident.severity = incident.severity === "Critical" ? "High" : "Critical";
          addAudit("User", "Changed incident severity", incident.title);
          toast("Severity updated", `${incident.title} is now ${incident.severity}.`);
        }
      }
      return render();
    case "resolve-incident":
      {
        const incident = incidentById(dataset.id);
        if (incident) {
          incident.status = "Resolved";
          incident.updatedAt = nowIso();
          incident.activity.unshift({ id: uid("act"), actor: "User", action: "Resolved incident", at: nowIso() });
          addAudit("User", "Resolved incident", incident.title);
          addNotification("Incident resolved", `${incident.title} marked resolved.`, "incidents");
          toast("Incident resolved", `${incident.title} closed.`);
        }
      }
      return render();
    case "investigate-further":
      {
        const incident = incidentById(dataset.id);
        if (incident) {
          incident.activity.unshift({ id: uid("act"), actor: "Investigation Agent", action: "Expanded evidence search across identity and network logs", at: nowIso() });
          toast("Investigation expanded", "Correlating more telemetry for this incident.");
        }
      }
      return render();
    case "add-incident-timeline-event":
      {
        const incident = incidentById(dataset.id);
        if (incident) {
          incident.timeline.push({ id: uid("evt"), time: "03:08", event: "Analyst added contextual checkpoint to timeline" });
          toast("Timeline updated", "New incident event added.");
        }
      }
      return render();
    case "pin-evidence":
      toast("Evidence pinned", `${dataset.value} pinned for the next report.`);
      return;
    case "rerun-ai-analysis":
      {
        const incident = incidentById(dataset.id);
        if (incident) {
          incident.aiSummary = `${incident.aiSummary} Confidence increased after additional evidence review.`;
          toast("AI analysis refreshed", "Narrative summary updated.");
        }
      }
      return render();
    case "add-incident-comment":
      {
        const incident = incidentById(dataset.id);
        if (incident) {
          incident.comments.push({ id: uid("cmt"), author: "Alex Morgan", text: "Front-end simulation comment added for analyst handoff.", at: nowIso() });
          toast("Comment added", `Comment appended to ${incident.title}.`);
        }
      }
      return render();
    case "analyze-threat":
      {
        const query = (state.ui.threatQuery || "").trim();
        if (!query) {
          toast("Indicator required", "Enter an IP, domain, URL, or hash first.", "warning");
          return;
        }
        const lookup = {
          id: uid("ti"),
          query,
          reputation: query.includes("185.") || query.includes("malicious") ? "Malicious" : "Suspicious",
          score: query.includes("185.") || query.includes("malicious") ? 91 : 61,
          malware: query.includes("hash") ? "Credential Stealer" : "Credential Abuse Toolkit",
          categories: ["Credential Attack", "Reconnaissance"],
          firstSeen: "Aug 14, 2026",
          lastSeen: "Aug 20, 2026",
          countries: ["Germany", "Netherlands", "Singapore"],
          related: ["45.83.64.11", "auth-burst.example", "tor-exit-swarm"],
          matches: ["12 internal sign-in matches", "3 firewall hits", "1 GuardDuty finding"],
          sources: [
            { name: "VirusTotal", result: "8 detections", detail: "Malicious detections seen from multiple engines" },
            { name: "AbuseIPDB", result: "Malicious", detail: "High-confidence reports for credential abuse" },
            { name: "AlienVault OTX", result: "Matched", detail: "Included in active pulse feed" },
            { name: "GreyNoise", result: "Observed", detail: "Commonly noisy, but overlaps with suspicious identity activity" },
            { name: "URLhaus", result: "Seen", detail: "Indicator associated with known malicious campaign infrastructure" },
            { name: "MISP", result: "Shared", detail: "IOC shared across trusted communities" },
          ],
        };
        state.threatLookups.unshift(lookup);
        addAudit("Threat Intel Agent", "Performed lookup", query);
        toast("Analysis complete", `Threat intel results ready for ${query}.`);
      }
      return render();
    case "load-example-threat":
      state.ui.threatQuery = dataset.value;
      return render();
    case "toggle-agent-status":
      {
        const agent = state.agents.find((item) => item.id === dataset.id);
        if (agent) {
          agent.status = agent.status === "Paused" ? "Running" : "Paused";
          addAudit("User", `${agent.status === "Running" ? "Resumed" : "Paused"} agent`, agent.name);
          toast("Agent updated", `${agent.name} is now ${agent.status}.`);
        }
      }
      return render();
    case "configure-agent":
      state.ui.drawer = { type: "agent-config", id: dataset.id, autoRun: true, autoEscalate: true, notify: true };
      return render();
    case "save-agent-config":
      state.ui.drawer = null;
      toast("Agent configuration saved", "Agent settings stored locally.");
      return render();
    case "run-agent-now":
      {
        const agent = state.agents.find((item) => item.id === dataset.id);
        if (agent) {
          agent.status = "Running";
          agent.recentAction = "Run started...";
          addAgentActivity(agent.name, "Manual run initiated", "Run Scheduler", state.environment, "Running", "Medium", "Not Required");
          toast("Agent run started", `${agent.name} is processing fresh data.`);
          simulateSequence(
            [
              { delay: 900, result: "Checking telemetry" },
              { delay: 1800, result: "Correlating evidence" },
              { delay: 2700, result: "Run complete" },
            ],
            (step) => {
              agent.recentAction = step.result;
              agent.lastRun = nowIso();
            },
            () => {
              agent.recentAction = "Manual run completed successfully.";
              addAgentActivity(agent.name, "Completed run", "Execution Engine", state.environment, "Completed", "Low", "Not Required");
              addNotification("Agent run completed", `${agent.name} finished a manual run.`, agent.route);
              toast("Agent complete", `${agent.name} completed its simulated run.`);
            }
          );
        }
      }
      return;
    case "add-investigation-event":
      {
        const inv = state.investigations.find((item) => item.id === dataset.id);
        if (inv) {
          inv.chain.splice(Math.max(1, inv.chain.length - 1), 0, "Analyst Added Event");
          inv.updatedAt = nowIso();
          toast("Investigation updated", `${inv.title} now includes a new event.`);
        }
      }
      return render();
    case "remove-investigation-correlation":
      {
        const inv = state.investigations.find((item) => item.id === dataset.id);
        if (inv && inv.correlatedAlerts.length > 1) {
          inv.correlatedAlerts.pop();
          inv.updatedAt = nowIso();
          toast("Correlation removed", `One correlated alert was removed from ${inv.title}.`);
        }
      }
      return render();
    case "recalculate-investigation-risk":
      {
        const inv = state.investigations.find((item) => item.id === dataset.id);
        if (inv) {
          inv.riskScore = Math.min(99, inv.riskScore + 4);
          toast("Risk recalculated", `${inv.title} recalculated to ${inv.riskScore}.`);
        }
      }
      return render();
    case "escalate-investigation":
      {
        const inv = state.investigations.find((item) => item.id === dataset.id);
        if (inv) {
          state.incidents.unshift({
            id: uid("inc"),
            title: inv.title,
            severity: riskSeverity(inv.riskScore),
            riskScore: inv.riskScore,
            status: "Open",
            assignedTo: "Alex Morgan",
            createdAt: nowIso(),
            updatedAt: nowIso(),
            source: "Investigation Agent",
            user: "multiple",
            asset: "derived-from-investigation",
            detected: nowIso(),
            dataSource: "Investigation Agent",
            affectedUsers: ["multiple"],
            affectedAssets: ["derived-from-investigation"],
            aiSummary: "Escalated from correlated investigation chain.",
            timeline: inv.chain.map((entry, index) => ({ id: uid("evt"), time: `0${index + 1}:00`, event: entry })),
            threatIntel: [],
            evidence: inv.correlatedAlerts,
            rawLogs: [],
            comments: [],
            activity: [],
          });
          inv.status = "Escalated";
          addNotification("Investigation escalated", `${inv.title} created a new incident.`, "incidents");
          toast("Escalated to incident", `${inv.title} is now an incident.`);
        }
      }
      return render();
    case "close-investigation":
      {
        const inv = state.investigations.find((item) => item.id === dataset.id);
        if (inv) {
          inv.status = "Closed";
          inv.updatedAt = nowIso();
          toast("Investigation closed", `${inv.title} closed locally.`);
        }
      }
      return render();
    case "create-investigation":
      state.investigations.unshift({
        id: uid("inv"),
        title: "New Cross-Signal Investigation",
        status: "Running",
        riskScore: 58,
        correlatedAlerts: ["Simulated alert correlation"],
        chain: ["Signal Intake", "Correlation", "Escalation Decision"],
        owner: "Investigation Agent",
        updatedAt: nowIso(),
      });
      toast("Investigation created", "New investigation added to the queue.");
      return render();
    case "new-scan":
      state.scans.unshift({
        id: uid("scan"),
        provider: "AWS",
        scope: "Selected resources",
        status: "Queued",
        progress: 0,
        phase: "Queued",
        findings: [],
        createdAt: nowIso(),
      });
      toast("Scan queued", "New scan created in queued state.");
      return render();
    case "run-full-scan":
      {
        const provider = dataset.provider || "AWS";
        const scan = {
          id: uid("scan"),
          provider,
          scope: provider === "AWS" ? "Production account" : "Primary subscription",
          status: "Queued",
          progress: 0,
          phase: "Queued",
          findings: [],
          createdAt: nowIso(),
        };
        state.scans.unshift(scan);
        toast("Scan started", `${provider} full scan queued.`);
        simulateSequence(
          [
            { delay: 500, progress: 0, phase: "Initializing", status: "Initializing" },
            { delay: 1200, progress: 25, phase: "Scanning IAM", status: "Running" },
            { delay: 2000, progress: 45, phase: "Scanning storage", status: "Running" },
            { delay: 2800, progress: 70, phase: "Scanning network", status: "Running" },
            { delay: 3600, progress: 90, phase: "Evaluating policies", status: "Running" },
            { delay: 4500, progress: 100, phase: "Completed", status: "Completed" },
          ],
          (step) => {
            scan.progress = step.progress;
            scan.phase = step.phase;
            scan.status = step.status;
          },
          () => {
            scan.findings = provider === "AWS"
              ? [
                  { id: uid("fnd"), severity: "Critical", title: "Public S3 Bucket", detail: "Bucket exports-prod is publicly reachable." },
                  { id: uid("fnd"), severity: "High", title: "AdministratorAccess assigned unnecessarily", detail: "CI role has overly broad policy." },
                  { id: uid("fnd"), severity: "High", title: "MFA disabled for privileged account", detail: "Privileged user missing MFA." },
                  { id: uid("fnd"), severity: "Medium", title: "Old access keys detected", detail: "Two keys older than 180 days." },
                  { id: uid("fnd"), severity: "Medium", title: "RDS encryption disabled", detail: "Database cluster missing storage encryption." },
                ]
              : [
                  { id: uid("fnd"), severity: "High", title: "Public storage", detail: "Azure storage account has anonymous blob access." },
                  { id: uid("fnd"), severity: "High", title: "Public VM ports", detail: "RDP exposed to the internet." },
                  { id: uid("fnd"), severity: "High", title: "Excessive privileges", detail: "Owner rights granted too broadly." },
                  { id: uid("fnd"), severity: "Medium", title: "MFA disabled", detail: "Privileged account lacks MFA." },
                  { id: uid("fnd"), severity: "Medium", title: "Key Vault security issue", detail: "Network ACLs are too open." },
                ];
            addNotification("Scan completed", `${provider} scan completed with ${scan.findings.length} findings.`, "configuration-scans");
            addAudit("Configuration Agent", "Completed configuration scan", `${provider} ${scan.id}`);
            toast("Scan completed", `${provider} findings are ready to review.`);
          }
        );
      }
      return;
    case "scan-selected-resources":
      toast("Resource scan started", "Selected resource scan is running locally.");
      return;
    case "schedule-scan":
      toast("Schedule saved", "Daily 02:00 UTC scan schedule stored locally.");
      return;
    case "open-finding":
      state.ui.modal = { type: "finding", finding: JSON.parse(dataset.finding) };
      return render();
    case "create-finding-incident":
      state.incidents.unshift({
        id: uid("inc"),
        title: dataset.title,
        severity: "High",
        riskScore: 79,
        status: "Open",
        assignedTo: "Alex Morgan",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        source: "Configuration Agent",
        user: "service-account",
        asset: "derived-finding",
        detected: nowIso(),
        dataSource: "Configuration scan",
        affectedUsers: ["service-account"],
        affectedAssets: ["derived-finding"],
        aiSummary: "Incident created from configuration finding.",
        timeline: [{ id: uid("evt"), time: "Now", event: `Created from finding ${dataset.title}` }],
        threatIntel: [],
        evidence: [dataset.title],
        rawLogs: [],
        comments: [],
        activity: [],
      });
      state.ui.modal = null;
      toast("Incident created", `${dataset.title} escalated into a new incident.`);
      return render();
    case "open-rule-builder":
      openRuleModal("create");
      return render();
    case "edit-rule":
      openRuleModal("edit", state.rules.find((item) => item.id === dataset.id));
      return render();
    case "delete-rule":
      state.rules = state.rules.filter((item) => item.id !== dataset.id);
      toast("Rule deleted", "Detection rule removed from local state.");
      return render();
    case "toggle-rule-status":
      {
        const rule = state.rules.find((item) => item.id === dataset.id);
        if (rule) {
          rule.status = rule.status === "Enabled" ? "Disabled" : "Enabled";
          addAudit("User", "Toggled rule status", rule.name);
          toast("Rule updated", `${rule.name} is now ${rule.status}.`);
        }
      }
      return render();
    case "duplicate-rule":
      {
        const rule = state.rules.find((item) => item.id === dataset.id);
        if (rule) {
          state.rules.unshift({ ...clone(rule), id: uid("rule"), name: `${rule.name} Copy`, lastTriggered: nowIso() });
          toast("Rule duplicated", `${rule.name} copied.`);
        }
      }
      return render();
    case "test-rule":
      {
        const rule = state.rules.find((item) => item.id === dataset.id);
        if (rule) {
          toast("Rule test started", `${rule.name} running against demo dataset.`);
          simulateSequence(
            [{ delay: 700 }, { delay: 1400 }, { delay: 2100 }],
            () => {},
            () => {
              rule.triggerCount += 1;
              rule.lastTriggered = nowIso();
              toast("Rule test complete", `${rule.name} matched 3 simulated events.`);
            }
          );
        }
      }
      return;
    case "import-rules":
      {
        state.rules.unshift({
          id: uid("rule"),
          name: "Imported lateral movement detector",
          description: "Imported demo content",
          source: "Syslog",
          severity: "Medium",
          status: "Enabled",
          triggerCount: 0,
          lastTriggered: nowIso(),
          updatedBy: "Import Job",
          conditionField: "ssh_failures",
          conditionOperator: "greater than",
          conditionValue: "12",
          groupBy: "source_ip",
          window: "15 minutes",
          actions: ["Create Alert"],
        });
        toast("Rules imported", "One demo rule imported successfully.");
      }
      return render();
    case "export-rules":
      downloadFile("detection-rules.json", JSON.stringify(state.rules, null, 2), "application/json");
      toast("Rules exported", "Detection rules downloaded as JSON.");
      return;
    case "toggle-rule-action":
      {
        const actions = state.ui.modal.draft.actions || [];
        state.ui.modal.draft.actions = actions.includes(dataset.value) ? actions.filter((item) => item !== dataset.value) : [...actions, dataset.value];
      }
      return render();
    case "test-modal-rule":
      toast("Rule test", "Draft rule matched 4 simulated log entries.");
      return;
    case "save-rule-draft":
      {
        const draft = state.ui.modal?.draft;
        if (!draft?.name || !draft?.description) {
          toast("Validation error", "Rule name and description are required.", "warning");
          return;
        }
        const id = state.ui.modal.ruleId || uid("rule");
        const rule = {
          id,
          ...draft,
          status: "Draft",
          triggerCount: draft.triggerCount || 0,
          lastTriggered: draft.lastTriggered || nowIso(),
          updatedBy: "User",
        };
        state.rules = state.rules.filter((item) => item.id !== id);
        state.rules.unshift(rule);
        state.ui.modal = null;
        addAudit("User", "Saved rule draft", rule.name);
        toast("Draft saved", `${rule.name} saved locally.`);
      }
      return render();
    case "save-rule-enable":
      {
        const draft = state.ui.modal?.draft;
        if (!draft?.name || !draft?.description) {
          toast("Validation error", "Rule name and description are required.", "warning");
          return;
        }
        const id = state.ui.modal.ruleId || uid("rule");
        const rule = {
          id,
          ...draft,
          status: "Enabled",
          triggerCount: draft.triggerCount || 0,
          lastTriggered: draft.lastTriggered || nowIso(),
          updatedBy: "User",
        };
        state.rules = state.rules.filter((item) => item.id !== id);
        state.rules.unshift(rule);
        state.ui.modal = null;
        addAudit("User", "Enabled rule", rule.name);
        addNotification("Detection rule enabled", `${rule.name} is now active.`, "detection-rules");
        toast("Rule enabled", `${rule.name} saved and enabled.`);
      }
      return render();
    case "open-ai-rule-builder":
      state.ui.modal = {
        type: "ai-rule",
        prompt: "Alert me when the same IP attempts to log into more than 10 accounts within five minutes.",
        generated: null,
      };
      return render();
    case "generate-ai-rule":
      {
        const prompt = state.ui.modal.prompt || "";
        state.ui.modal.generated = createRuleFromPrompt(prompt);
        toast("AI rule generated", "Draft detection logic is ready to review.");
      }
      return render();
    case "edit-generated-rule":
      {
        const generated = state.ui.modal.generated;
        if (generated) {
          openRuleModal("create", {
            name: "AI Generated Credential Attack Rule",
            description: "Generated from simulated AI builder.",
            source: "Azure Entra ID",
            severity: generated.severity,
            status: "Draft",
            triggerCount: 0,
            lastTriggered: nowIso(),
            updatedBy: "AI Builder",
            conditionField: generated.when.split(" ")[0],
            conditionOperator: "greater than",
            conditionValue: generated.when.match(/\d+/)?.[0] || "10",
            groupBy: generated.groupBy,
            window: generated.window,
            actions: ["Create Alert", "Start AI Investigation", "Notify Analyst"],
          });
        }
      }
      return render();
    case "test-generated-rule":
      toast("AI rule tested", "Generated rule matched 14 simulated sign-in attempts.");
      return;
    case "approve-generated-rule":
      {
        const generated = state.ui.modal.generated;
        if (!generated) return;
        state.rules.unshift({
          id: uid("rule"),
          name: "AI Generated Credential Attack Rule",
          description: "Generated from simulated AI builder.",
          source: "Azure Entra ID",
          severity: generated.severity,
          status: "Enabled",
          triggerCount: 0,
          lastTriggered: nowIso(),
          updatedBy: "AI Builder",
          conditionField: generated.when,
          conditionOperator: "derived",
          conditionValue: "",
          groupBy: generated.groupBy,
          window: generated.window,
          actions: ["Create Alert", "Start AI Investigation", "Notify Analyst"],
        });
        state.ui.modal = null;
        toast("AI rule approved", "Generated rule is now active.");
      }
      return render();
    case "new-policy":
      openPolicyModal("create");
      return render();
    case "edit-policy":
      openPolicyModal("edit", state.policies.find((item) => item.id === dataset.id));
      return render();
    case "toggle-policy":
      {
        const policy = state.policies.find((item) => item.id === dataset.id);
        if (policy) {
          policy.enabled = !policy.enabled;
          toast("Policy updated", `${policy.name} is now ${policy.enabled ? "enabled" : "disabled"}.`);
        }
      }
      return render();
    case "duplicate-policy":
      {
        const policy = state.policies.find((item) => item.id === dataset.id);
        if (policy) {
          state.policies.unshift({ ...clone(policy), id: uid("pol"), name: `${policy.name} Copy` });
          toast("Policy duplicated", `${policy.name} copied.`);
        }
      }
      return render();
    case "delete-policy":
      state.policies = state.policies.filter((item) => item.id !== dataset.id);
      toast("Policy deleted", "Policy removed from local state.");
      return render();
    case "test-policy":
      toast("Policy tested", "Policy matched 2 simulated resources and triggered downstream actions.");
      return;
    case "save-policy":
      {
        const draft = state.ui.modal?.draft;
        if (!draft?.name || !draft?.logic || !draft?.result) {
          toast("Validation error", "Policy name, logic, and result are required.", "warning");
          return;
        }
        const id = state.ui.modal.policyId || uid("pol");
        const policy = { id, ...draft, enabled: true };
        state.policies = state.policies.filter((item) => item.id !== id);
        state.policies.unshift(policy);
        state.ui.modal = null;
        toast("Policy saved", `${policy.name} stored locally.`);
      }
      return render();
    case "lookup-indicator":
      state.ui.threatQuery = dataset.value;
      navigate("threat-intelligence");
      return;
    case "indicator-to-investigation":
      toast("Indicator added", "IOC linked to the active investigation.");
      return;
    case "suggest-containment":
      toast("Containment suggested", "Suggested simulated IP block and analyst notification.");
      return;
    case "edit-playbook":
      toast("Playbook editor", "Playbook edit workflow is simulated inline.");
      return;
    case "duplicate-playbook":
      {
        const playbook = state.playbooks.find((item) => item.id === dataset.id);
        if (playbook) {
          state.playbooks.unshift({ ...clone(playbook), id: uid("pb"), name: `${playbook.name} Copy` });
          toast("Playbook duplicated", `${playbook.name} copied.`);
        }
      }
      return render();
    case "toggle-playbook":
      {
        const playbook = state.playbooks.find((item) => item.id === dataset.id);
        if (playbook) {
          playbook.enabled = !playbook.enabled;
          toast("Playbook updated", `${playbook.name} is now ${playbook.enabled ? "enabled" : "disabled"}.`);
        }
      }
      return render();
    case "run-playbook":
      {
        const playbook = state.playbooks.find((item) => item.id === dataset.id);
        if (!playbook) return;
        playbook.runStatus = "Running";
        playbook.progress = 0;
        toast("Playbook started", `${playbook.name} is executing.`);
        const stepCount = playbook.steps.length;
        simulateSequence(
          playbook.steps.map((step, index) => ({ delay: 800 * (index + 1), progress: Math.round(((index + 1) / stepCount) * 100), step })),
          (step) => {
            playbook.progress = step.progress;
          },
          () => {
            playbook.runStatus = "Completed";
            playbook.progress = 100;
            addAudit("Automation", "Ran playbook", playbook.name);
            addNotification("Playbook complete", `${playbook.name} finished successfully.`, "playbooks");
            toast("Playbook complete", `${playbook.name} executed all steps.`);
          }
        );
      }
      return;
    case "new-playbook":
      state.playbooks.unshift({
        id: uid("pb"),
        name: "New Triage Playbook",
        enabled: true,
        steps: ["Check indicator", "Review user", "Review asset", "Calculate risk", "Escalate if needed"],
        runStatus: "Idle",
        progress: 0,
      });
      toast("Playbook created", "New playbook added locally.");
      return render();
    case "approve-request":
      {
        const approval = state.approvals.find((item) => item.id === dataset.id);
        if (approval) {
          approval.status = "Approved";
          state.responseActions.unshift({
            id: uid("rsp"),
            action: approval.title,
            target: approval.target,
            status: "Completed",
            requestedBy: approval.requestedBy,
            createdAt: nowIso(),
          });
          addAudit("User", "Approved request", approval.title);
          toast("Request approved", `${approval.title} approved.`);
        }
      }
      return render();
    case "reject-request":
      {
        const approval = state.approvals.find((item) => item.id === dataset.id);
        if (approval) {
          approval.status = "Rejected";
          toast("Request rejected", `${approval.title} rejected.`);
        }
      }
      return render();
    case "view-evidence":
      {
        const approval = state.approvals.find((item) => item.id === dataset.id);
        if (approval) {
          state.ui.modal = {
            type: "finding",
            finding: {
              title: approval.title,
              severity: "High",
              detail: `${approval.reason} Requested by ${approval.requestedBy} at ${formatDateLong(approval.createdAt)}.`,
            },
          };
        }
      }
      return render();
    case "rerun-response-action":
      toast("Response action retried", "Simulated retry queued.");
      return;
    case "complete-response-action":
      {
        const item = state.responseActions.find((entry) => entry.id === dataset.id);
        if (item) {
          item.status = "Completed";
          toast("Response action completed", `${item.action} marked completed.`);
        }
      }
      return render();
    case "toggle-log-source":
      {
        const src = state.logSources.find((item) => item.id === dataset.id);
        if (src) {
          src.status = src.status === "Paused" ? "Healthy" : "Paused";
          toast("Log source updated", `${src.source} is now ${src.status}.`);
        }
      }
      return render();
    case "view-log-source":
      {
        const src = state.logSources.find((item) => item.id === dataset.id);
        if (src) state.ui.rawLogFilters.source = src.source;
        navigate("raw-logs");
      }
      return;
    case "configure-log-source":
      toast("Configuration opened", "Log source configuration is simulated through local state.");
      return;
    case "add-log-source":
      state.logSources.unshift({
        id: uid("src"),
        source: "New Demo Source",
        provider: "Application",
        eventsToday: "0",
        eps: 0,
        status: "Healthy",
        lastEvent: nowIso(),
        health: "100%",
      });
      toast("Log source added", "New source added to local inventory.");
      return render();
    case "toggle-log-expand":
      {
        const log = state.rawLogs.find((item) => item.id === dataset.id);
        if (log) log.expanded = !log.expanded;
      }
      return render();
    case "copy-log":
      {
        const log = state.rawLogs.find((item) => item.id === dataset.id);
        if (log) {
          navigator.clipboard?.writeText(JSON.stringify(log.body, null, 2));
          toast("Log copied", `${log.id} copied to clipboard.`);
        }
      }
      return;
    case "log-to-investigation":
      toast("Log linked", "Raw event added to the active investigation.");
      return;
    case "rule-from-log":
      {
        const log = state.rawLogs.find((item) => item.id === dataset.id);
        if (log) {
          openRuleModal("create", {
            name: `Rule from ${log.eventType}`,
            description: `Generated from ${log.id}`,
            source: log.source,
            severity: log.severity,
            status: "Draft",
            triggerCount: 0,
            lastTriggered: nowIso(),
            updatedBy: "Log Viewer",
            conditionField: log.eventType,
            conditionOperator: "equals",
            conditionValue: "true",
            groupBy: "user",
            window: "10 minutes",
            actions: ["Create Alert", "Start AI Investigation"],
          });
        }
      }
      return render();
    case "mark-log-suspicious":
      {
        const log = state.rawLogs.find((item) => item.id === dataset.id);
        if (log) {
          log.suspicious = true;
          toast("Marked suspicious", `${log.id} flagged for investigation.`);
        }
      }
      return render();
    case "configure-integration":
    case "connect-integration":
      {
        const integration = state.integrations.find((item) => item.id === dataset.id);
        if (integration) openIntegrationModal(integration);
      }
      return render();
    case "disconnect-integration":
      {
        const integration = state.integrations.find((item) => item.id === dataset.id);
        if (integration) {
          integration.status = "Not Connected";
          integration.detail = "Disconnected locally";
          toast("Integration disconnected", `${integration.name} set to not connected.`);
        }
      }
      return render();
    case "test-integration":
      {
        const integration = state.integrations.find((item) => item.id === dataset.id);
        if (integration) toast("Connection test successful", `${integration.name} responded with a simulated success.`);
      }
      return;
    case "test-modal-integration":
      toast("Integration test successful", "Credentials validated locally. No data was sent anywhere.");
      return;
    case "save-integration":
      {
        const integration = state.integrations.find((item) => item.id === dataset.id);
        if (integration) {
          integration.status = "Connected";
          integration.detail = `Configured locally at ${formatDate(nowIso())}`;
          state.ui.modal = null;
          addAudit("User", "Configured integration", integration.name);
          toast("Integration saved", `${integration.name} is now connected.`);
        }
      }
      return render();
    case "generate-report":
      startReportGeneration(dataset.name);
      return;
    case "preview-report":
      state.ui.modal = { type: "report-preview", id: dataset.id };
      return render();
    case "download-report":
      {
        const report = state.reports.find((item) => item.id === dataset.id);
        if (report) {
          downloadFile(`${report.name.toLowerCase().replace(/\s+/g, "-")}.html`, report.content, "text/html");
          toast("Report downloaded", `${report.name} downloaded.`);
        }
      }
      return;
    case "review-compliance":
      toast("Compliance review opened", "Evidence collection and remediation steps are simulated locally.");
      return;
    case "add-user":
      openUserModal("create");
      return render();
    case "edit-user":
      openUserModal("edit", state.users.find((item) => item.id === dataset.id));
      return render();
    case "save-user":
      {
        const draft = state.ui.modal?.draft;
        if (!draft?.name || !draft?.email) {
          toast("Validation error", "User name and email are required.", "warning");
          return;
        }
        const id = state.ui.modal.userId || uid("usr");
        const user = { id, ...draft };
        state.users = state.users.filter((item) => item.id !== id);
        state.users.unshift(user);
        state.ui.modal = null;
        toast("User saved", `${user.name} stored locally.`);
      }
      return render();
    case "toggle-user-status":
      {
        const user = state.users.find((item) => item.id === dataset.id);
        if (user) {
          user.status = user.status === "Active" ? "Disabled" : "Active";
          toast("User updated", `${user.name} is now ${user.status}.`);
        }
      }
      return render();
    case "change-role":
      {
        const user = state.users.find((item) => item.id === dataset.id);
        if (user) {
          const roles = ["Administrator", "Security Manager", "SOC Analyst", "Viewer"];
          user.role = roles[(roles.indexOf(user.role) + 1) % roles.length];
          toast("Role changed", `${user.name} is now ${user.role}.`);
        }
      }
      return render();
    case "delete-user":
      state.users = state.users.filter((item) => item.id !== dataset.id);
      toast("User deleted", "User removed from local state.");
      return render();
    case "toggle-role-permission":
      {
        const role = state.roles.find((item) => item.id === dataset.id);
        if (role) {
          role.permissions[dataset.perm] = !role.permissions[dataset.perm];
          toast("Permission updated", `${role.name} ${dataset.perm} updated.`);
        }
      }
      return render();
    case "set-settings-tab":
      state.ui.tabs.settings = dataset.tab;
      return render();
    default:
      return;
  }
}

function startReportGeneration(name) {
  const report = {
    id: uid("rpt"),
    name,
    status: "Queued",
    progress: 0,
    content: "",
  };
  state.reports.unshift(report);
  toast("Report generation started", `${name} is being generated.`);
  render();
  simulateSequence(
    [
      { delay: 700, progress: 10, status: "Queued" },
      { delay: 1500, progress: 45, status: "Running" },
      { delay: 2500, progress: 75, status: "Running" },
      { delay: 3500, progress: 100, status: "Completed" },
    ],
    (step) => {
      report.progress = step.progress;
      report.status = step.status;
    },
    () => {
      report.content = `
        <html><body style="font-family:Arial,sans-serif;padding:24px;">
          <h1>${escapeHtml(name)}</h1>
          <p>Organization: ${escapeHtml(state.organization)}</p>
          <p>Environment: ${escapeHtml(state.environment)}</p>
          <p>Generated: ${escapeHtml(formatDateLong(nowIso()))}</p>
          <h2>Summary</h2>
          <p>Security Score: 82/100</p>
          <p>Open Incidents: ${state.incidents.filter((item) => item.status !== "Resolved").length}</p>
          <p>Open Alerts: ${state.alerts.filter((item) => item.status !== "Resolved").length}</p>
        </body></html>
      `;
      addAudit("Reporting", "Generated report", name);
      addNotification("Report ready", `${name} is ready for preview.`, "reports");
      toast("Report ready", `${name} completed successfully.`);
    }
  );
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    event.preventDefault();
    navigate(nav.dataset.nav);
    return;
  }
  const action = event.target.closest("[data-action]");
  if (action) {
    event.preventDefault();
    handleAction(action.dataset.action, action.dataset, action);
  }
});

document.addEventListener("input", (event) => {
  const element = event.target;
  if (element.matches("[data-model]")) handleModelUpdate(element, event);
});

document.addEventListener("change", (event) => {
  const element = event.target;
  if (element.matches("[data-model]")) handleModelUpdate(element, event);
});

window.addEventListener("hashchange", render);

if (!window.location.hash) {
  window.location.hash = "#/dashboard";
}

render();
