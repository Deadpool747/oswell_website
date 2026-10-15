import { execFileSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";

const ROOT = process.cwd();
const SQLITE_PATH = path.join(ROOT, "data", "leadgen.sqlite3");
const EXPORT_JSON_PATH = path.join(ROOT, "output", "executive_leads.json");

function runPythonSnapshot() {
  const script = String.raw`
import json
import sqlite3
from pathlib import Path

from leadgen_quality import dedupe_executive_rows

db_path = Path(${JSON.stringify(SQLITE_PATH)})
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

def count(sql):
    row = cur.execute(sql).fetchone()
    return int(row[0]) if row else 0

stats = {
    "companies": count("SELECT COUNT(*) FROM companies"),
    "leads": 0,
    "pages": count("SELECT COUNT(*) FROM pages"),
}

rows = []
for row in cur.execute(
    """
    SELECT company_name, website, name, title, normalized_title, email, phone, linkedin, twitter,
           country, state, city, industry, source_url, last_crawled
    FROM executives
    ORDER BY created_at DESC, id DESC
    LIMIT 500
    """
):
    rows.append(dict(row))

rows = dedupe_executive_rows(rows)
stats["leads"] = len(rows)
stats["emails"] = sum(1 for row in rows if row.get("email"))
stats["phones"] = sum(1 for row in rows if row.get("phone"))
stats["industries"] = len({row.get("industry", "").strip() for row in rows if row.get("industry", "").strip()})
stats["states"] = len({row.get("state", "").strip() for row in rows if row.get("state", "").strip()})

companies = []
seen_companies = set()
for row in rows:
    company = row.get("company_name", "")
    if company and company not in seen_companies:
        seen_companies.add(company)
        companies.append(company)

payload = {
    "generated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat().replace("+00:00", "Z"),
    "stats": stats,
    "companies": companies,
    "leads": rows,
}

print(json.dumps(payload))
`;

  const output = execFileSync("python3", ["-c", script], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 1024 * 1024 * 10,
  });
  return JSON.parse(output);
}

function readJsonFallback() {
  if (!existsSync(EXPORT_JSON_PATH)) {
    return {
      generated_at: new Date().toISOString(),
      stats: { companies: 0, leads: 0, pages: 0, emails: 0, phones: 0, industries: 0, states: 0 },
      companies: [],
      leads: [],
    };
  }

  const raw = JSON.parse(readFileSync(EXPORT_JSON_PATH, "utf8"));
  const leads = Array.isArray(raw) ? raw : [];
  const companies = [...new Set(leads.map((row) => row.Company).filter(Boolean))];
  return {
    generated_at: new Date().toISOString(),
    stats: {
      companies: companies.length,
      leads: leads.length,
      pages: 0,
      emails: leads.filter((row) => row.Email).length,
      phones: leads.filter((row) => row.Phone).length,
      industries: new Set(leads.map((row) => row.Industry).filter(Boolean)).size,
      states: new Set(leads.map((row) => row.State).filter(Boolean)).size,
    },
    companies,
    leads: leads.map((row) => ({
      company_name: row.Company || "",
      website: row.Website || "",
      name: row["Executive Name"] || "",
      title: row.Title || "",
      normalized_title: row.Title || "",
      email: row.Email || "",
      phone: row.Phone || "",
      linkedin: row.LinkedIn || "",
      twitter: row["Twitter/X"] || "",
      country: row.Country || "",
      state: row.State || "",
      city: row.City || "",
      industry: row.Industry || "",
      source_url: row["Source URL"] || "",
      last_crawled: row["Last Crawled"] || "",
    })),
  };
}

export function loadLeadgenData() {
  try {
    if (existsSync(SQLITE_PATH)) {
      return runPythonSnapshot();
    }
  } catch {
    // Fall back to the exported JSON snapshot below.
  }
  return readJsonFallback();
}
