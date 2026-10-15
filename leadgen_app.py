from __future__ import annotations

import csv
import shutil
import subprocess
import threading
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse

from leadgen_quality import dedupe_executive_rows
from utils import normalize_whitespace


ROOT = Path(__file__).resolve().parent
BASE_CONFIG_PATH = ROOT / "config.yaml"
BASE_OUTPUT_DIR = ROOT / "output"
BASE_CSV_PATH = BASE_OUTPUT_DIR / "executive_leads.csv"
BASE_JSON_PATH = BASE_OUTPUT_DIR / "executive_leads.json"
JOBS_DIR = ROOT / "data" / "jobs"


@dataclass
class JobRecord:
    job_id: str
    status: str = "queued"
    created_at: str = ""
    started_at: str = ""
    finished_at: str = ""
    command: list[str] = field(default_factory=list)
    seed_urls: list[str] = field(default_factory=list)
    target_leads: int = 0
    batch_size: int = 0
    limit: int = 0
    log_path: str = ""
    config_path: str = ""
    seed_csv_path: str = ""
    output_csv: str = ""
    output_json: str = ""
    row_count: int = 0
    error: str = ""
    lines: deque[str] = field(default_factory=lambda: deque(maxlen=200))


app = FastAPI(title="Executive Lead Extraction", version="1.0.0")
_jobs: dict[str, JobRecord] = {}
_job_lock = threading.Lock()
_active_job_id: str | None = None


def load_base_config() -> dict[str, Any]:
    with BASE_CONFIG_PATH.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def normalize_seed_urls(raw: str) -> list[str]:
    urls = []
    seen = set()
    for line in raw.splitlines():
        value = normalize_whitespace(line)
        if not value:
            continue
        if not value.startswith(("http://", "https://")):
            value = f"https://{value}"
        if value not in seen:
            seen.add(value)
            urls.append(value)
    return urls


def build_job_config(job_dir: Path, seed_urls: list[str], target_leads: int, batch_size: int, limit: int) -> tuple[Path, Path]:
    config = load_base_config()
    config.setdefault("app", {})
    config.setdefault("discovery", {})
    config.setdefault("crawl", {})
    config.setdefault("export", {})

    seed_csv_path = job_dir / "seed_companies.csv"
    config_path = job_dir / "config.yaml"

    with seed_csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["company", "website", "country", "state", "city", "industry", "source_url"],
        )
        writer.writeheader()
        for index, url in enumerate(seed_urls, start=1):
            host = url.split("://", 1)[-1].split("/", 1)[0]
            company_name = host.removeprefix("www.").split(".")[0].replace("-", " ").title() or f"Company {index}"
            writer.writerow(
                {
                    "company": company_name,
                    "website": url,
                    "country": "",
                    "state": "",
                    "city": "",
                    "industry": "",
                    "source_url": url,
                }
            )

    config["discovery"]["mode"] = "startup"
    config["discovery"]["providers"] = ["seed_csv"]
    config["discovery"]["countries"] = []
    config["discovery"]["industries"] = []
    config["discovery"]["keywords"] = []
    config["discovery"]["seed_urls"] = []
    config["discovery"]["seed_companies_csv"] = str(seed_csv_path)
    config["discovery"]["registry_queries_csv"] = ""
    config["discovery"]["startup_queries_csv"] = ""
    config["discovery"]["additional_source_csvs"] = []
    config["discovery"]["registry_queries"] = []
    config["discovery"]["max_discovered_companies"] = max(len(seed_urls), 1)
    config["llm"]["enabled"] = False
    config["app"]["target_leads"] = target_leads
    config["app"]["output_dir"] = str(job_dir / "output")
    config["app"]["database_path"] = str(job_dir / "leadgen.sqlite3")
    config["app"]["log_dir"] = str(job_dir / "logs")
    config["crawl"]["batch_size"] = max(batch_size, 1)
    if limit > 0:
        config["crawl"]["max_pages_per_company"] = min(int(config.get("crawl", {}).get("max_pages_per_company", 8)), 8)

    with config_path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(config, handle, sort_keys=False)

    return config_path, seed_csv_path


def append_line(job: JobRecord, text: str) -> None:
    job.lines.append(text.rstrip("\n"))


def load_rows_from_csv(csv_path: Path) -> list[dict[str, Any]]:
    if not csv_path.exists():
        return []
    import pandas as pd

    df = pd.read_csv(csv_path).fillna("")
    rows = df.to_dict(orient="records")
    return dedupe_executive_rows(
        [
            {
                "company_name": row.get("Company", ""),
                "website": row.get("Website", ""),
                "name": row.get("Executive Name", ""),
                "title": row.get("Title", ""),
                "normalized_title": row.get("Title", ""),
                "email": row.get("Email", ""),
                "phone": row.get("Phone", ""),
                "linkedin": row.get("LinkedIn", ""),
                "twitter": row.get("Twitter/X", ""),
                "country": row.get("Country", ""),
                "state": row.get("State", ""),
                "city": row.get("City", ""),
                "industry": row.get("Industry", ""),
                "source_url": row.get("Source URL", ""),
                "last_crawled": row.get("Last Crawled", ""),
            }
            for row in rows
        ]
    )


def run_job(job: JobRecord) -> None:
    global _active_job_id
    with _job_lock:
        _active_job_id = job.job_id
        job.status = "running"
        job.started_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    job_dir = JOBS_DIR / job.job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    log_path = job_dir / "run.log"
    job.log_path = str(log_path)
    config_path, seed_csv_path = build_job_config(job_dir, job.seed_urls, job.target_leads, job.batch_size, job.limit)
    job.config_path = str(config_path)
    job.seed_csv_path = str(seed_csv_path)

    cmd = [
        "python3",
        "main.py",
        "--config",
        str(config_path),
    ]
    if job.limit > 0:
        cmd.extend(["--limit", str(job.limit)])
    if job.target_leads > 0:
        cmd.extend(["--target-leads", str(job.target_leads)])
    if job.batch_size > 0:
        cmd.extend(["--batch-size", str(job.batch_size)])
    cmd.append("--resume")
    job.command = cmd

    try:
        with log_path.open("w", encoding="utf-8") as log_handle:
            process = subprocess.Popen(
                cmd,
                cwd=ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )
            assert process.stdout is not None
            for line in process.stdout:
                log_handle.write(line)
                log_handle.flush()
                append_line(job, line)
            code = process.wait()
            if code != 0:
                raise RuntimeError(f"Pipeline exited with code {code}")

        job_output_dir = job_dir / "output"
        job_output_csv = job_output_dir / BASE_CSV_PATH.name
        job_output_json = job_output_dir / BASE_JSON_PATH.name
        BASE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        if job_output_csv.exists():
            shutil.copy2(job_output_csv, BASE_CSV_PATH)
        if job_output_json.exists():
            shutil.copy2(job_output_json, BASE_JSON_PATH)

        job.output_csv = str(job_output_csv)
        job.output_json = str(job_output_json)
        if job_output_csv.exists():
            job.row_count = len(load_rows_from_csv(job_output_csv))
        job.status = "completed"
    except Exception as exc:
        job.status = "failed"
        job.error = str(exc)
    finally:
        job.finished_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        with _job_lock:
            if _active_job_id == job.job_id:
                _active_job_id = None


def current_rows() -> list[dict[str, Any]]:
    return load_rows_from_csv(BASE_CSV_PATH)


def render_home() -> str:
    rows = current_rows()
    job_cards = []
    for job in sorted(_jobs.values(), key=lambda item: item.created_at, reverse=True)[:5]:
        job_cards.append(
            f"""
            <div class="card">
              <div class="row"><strong><a href="/runs/{job.job_id}" style="color:inherit;text-decoration:none;">{job.job_id}</a></strong><span class="pill {job.status}">{job.status}</span></div>
              <div class="muted">Seeds: {len(job.seed_urls)} | Leads: {job.row_count or len(rows)} | Started: {job.started_at or 'n/a'}</div>
              <pre>{normalize_whitespace(job.error) or 'No errors'}</pre>
            </div>
            """
        )

    table_rows = []
    for row in rows[:25]:
        table_rows.append(
            f"<tr><td>{row.get('company_name','')}</td><td>{row.get('name','')}</td><td>{row.get('title','')}</td><td>{row.get('email','')}</td><td>{row.get('website','')}</td></tr>"
        )

    return f"""
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Executive Lead Extraction</title>
  <style>
    :root {{
      --bg: #08121f;
      --panel: rgba(12, 20, 33, 0.92);
      --panel-border: rgba(255,255,255,0.08);
      --text: #f4f7fb;
      --muted: #9fb0c7;
      --accent: #6ee7b7;
      --accent-2: #60a5fa;
      --warn: #fbbf24;
      --danger: #f87171;
    }}
    body {{ margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--text); background: radial-gradient(circle at top, #10213b, var(--bg) 55%); }}
    .wrap {{ max-width: 1200px; margin: 0 auto; padding: 28px 18px 56px; }}
    .hero {{ display: grid; gap: 16px; grid-template-columns: 1.2fr .8fr; align-items: start; }}
    .card, .hero-card, .panel {{ background: var(--panel); border: 1px solid var(--panel-border); border-radius: 22px; box-shadow: 0 24px 80px rgba(0,0,0,.22); }}
    .hero-card {{ padding: 24px; }}
    .panel {{ padding: 20px; margin-top: 18px; }}
    h1 {{ margin: 0 0 8px; font-size: clamp(2.1rem, 4vw, 3.6rem); line-height: 1; }}
    .sub {{ color: var(--muted); line-height: 1.65; max-width: 70ch; }}
    .grid {{ display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 16px; }}
    .stat {{ padding: 18px; border-radius: 18px; background: rgba(255,255,255,.03); border: 1px solid var(--panel-border); }}
    .stat .label {{ color: var(--muted); font-size: .78rem; text-transform: uppercase; letter-spacing: .18em; }}
    .stat .value {{ margin-top: 10px; font-size: 2rem; font-weight: 700; }}
    form {{ display: grid; gap: 12px; }}
    textarea, input {{ width: 100%; border-radius: 14px; border: 1px solid var(--panel-border); background: rgba(255,255,255,.04); color: var(--text); padding: 12px 14px; font: inherit; box-sizing: border-box; }}
    textarea {{ min-height: 180px; resize: vertical; }}
    .row {{ display: flex; gap: 10px; justify-content: space-between; align-items: center; }}
    .muted {{ color: var(--muted); font-size: .95rem; }}
    button, .btn {{ display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 999px; padding: 12px 18px; font-weight: 700; text-decoration: none; cursor: pointer; background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #04111f; }}
    .btn.secondary {{ background: rgba(255,255,255,.06); color: var(--text); border: 1px solid var(--panel-border); }}
    .two {{ display: grid; gap: 18px; grid-template-columns: 1fr 1fr; margin-top: 18px; }}
    table {{ width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 18px; }}
    th, td {{ padding: 12px 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,.08); }}
    th {{ color: var(--muted); font-size: .76rem; letter-spacing: .16em; text-transform: uppercase; }}
    .jobs {{ display: grid; gap: 12px; }}
    .card pre {{ white-space: pre-wrap; color: var(--muted); font-size: .9rem; margin: 8px 0 0; }}
    .pill {{ padding: 5px 10px; border-radius: 999px; font-size: .75rem; text-transform: uppercase; letter-spacing: .14em; }}
    .pill.running {{ background: rgba(96,165,250,.14); color: #bfdbfe; }}
    .pill.completed {{ background: rgba(110,231,183,.14); color: #bbf7d0; }}
    .pill.failed {{ background: rgba(248,113,113,.14); color: #fecaca; }}
    .pill.queued {{ background: rgba(251,191,36,.14); color: #fde68a; }}
    @media (max-width: 900px) {{
      .hero, .two, .grid {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <section class="hero-card">
        <div class="muted" style="text-transform:uppercase;letter-spacing:.2em;">Public executive extraction</div>
        <h1>Complete lead extraction app</h1>
        <p class="sub">Paste public company websites, run the crawler, and export clean executive contacts from public pages only. The engine crawls, extracts, dedupes, and writes CSV and JSON outputs.</p>
        <div class="row" style="margin-top:16px;">
          <a class="btn" href="/api/export/csv">Download CSV</a>
          <a class="btn secondary" href="/api/export/json">Download JSON</a>
        </div>
        <div class="grid">
          <div class="stat"><div class="label">Stored leads</div><div class="value">{len(rows)}</div></div>
          <div class="stat"><div class="label">Companies</div><div class="value">{len({r.get("company_name") for r in rows if r.get("company_name")})}</div></div>
          <div class="stat"><div class="label">Public emails</div><div class="value">{len([r for r in rows if r.get("email")])}</div></div>
          <div class="stat"><div class="label">Public phones</div><div class="value">{len([r for r in rows if r.get("phone")])}</div></div>
        </div>
      </section>
      <section class="hero-card">
        <div class="row"><strong>Start extraction</strong><span class="muted">Seed URLs only</span></div>
        <form method="post" action="/api/run">
          <label>
            <div class="muted" style="margin-bottom:6px;">Public websites, one per line</div>
            <textarea name="seed_urls" placeholder="https://example.com&#10;https://startup.com"></textarea>
          </label>
          <div class="two">
            <label><div class="muted" style="margin-bottom:6px;">Target leads</div><input name="target_leads" type="number" min="1" max="100000" value="1000"></label>
            <label><div class="muted" style="margin-bottom:6px;">Batch size</div><input name="batch_size" type="number" min="1" max="200" value="20"></label>
          </div>
          <label><div class="muted" style="margin-bottom:6px;">Company limit</div><input name="limit" type="number" min="0" max="1000" value="0"></label>
          <div class="muted">Set to 0 for no cap. The target lead count is usually the main stopping condition.</div>
          <button type="submit">Run extraction</button>
        </form>
      </section>
    </div>

    <div class="two">
      <section class="panel">
        <div class="row"><strong>Recent jobs</strong><span class="muted">last 5</span></div>
        <div class="jobs" style="margin-top:12px;">{"".join(job_cards) or '<div class="muted">No jobs yet.</div>'}</div>
      </section>
      <section class="panel">
        <div class="row"><strong>Latest rows</strong><span class="muted">{len(rows)} total</span></div>
        <div style="overflow:auto; margin-top:12px;">
          <table>
            <thead><tr><th>Company</th><th>Executive</th><th>Title</th><th>Email</th><th>Website</th></tr></thead>
            <tbody>{"".join(table_rows) or '<tr><td colspan="5" class="muted">No results yet.</td></tr>'}</tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
def home() -> str:
    return render_home()


@app.post("/api/run")
def api_run(seed_urls: str = Form(...), target_leads: int = Form(1000), batch_size: int = Form(20), limit: int = Form(0)) -> RedirectResponse:
    urls = normalize_seed_urls(seed_urls)
    if not urls:
        raise HTTPException(status_code=400, detail="Please provide at least one public website URL.")

    job_id = uuid.uuid4().hex[:12]
    job = JobRecord(
        job_id=job_id,
        status="queued",
        created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        seed_urls=urls,
        target_leads=max(target_leads, 1),
        batch_size=max(batch_size, 1),
        limit=max(limit, 0),
    )
    _jobs[job_id] = job
    thread = threading.Thread(target=run_job, args=(job,), daemon=True)
    thread.start()
    return RedirectResponse(url=f"/runs/{job_id}", status_code=303)


@app.get("/runs/{job_id}", response_class=HTMLResponse)
def run_detail(job_id: str) -> str:
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Run not found")
    rows = load_rows_from_csv(Path(job.output_csv)) if job.output_csv else current_rows()
    lines = list(job.lines)[-20:]
    refresh_meta = '<meta http-equiv="refresh" content="5">' if job.status == "running" else ""
    return f"""
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {refresh_meta}
  <title>Run {job_id}</title>
  <style>
    body {{ font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 0; background:#08121f; color:#f4f7fb; padding: 24px; }}
    a {{ color: #6ee7b7; }}
    pre {{ white-space: pre-wrap; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); padding: 14px; border-radius: 14px; overflow:auto; }}
    .pill {{ padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.08); }}
    .grid {{ display:grid; gap:16px; grid-template-columns: repeat(4, 1fr); margin: 18px 0; }}
    .card {{ background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 18px; padding: 16px; }}
    table {{ width:100%; border-collapse: collapse; margin-top: 18px; }}
    th, td {{ text-align:left; padding: 10px 8px; border-bottom:1px solid rgba(255,255,255,.08); }}
  </style>
</head>
<body>
  <p><a href="/">Back</a></p>
  <h1>Run {job_id}</h1>
  <p>Status: <span class="pill">{job.status}</span></p>
  <div class="grid">
    <div class="card"><div>Seeds</div><strong>{len(job.seed_urls)}</strong></div>
    <div class="card"><div>Leads</div><strong>{job.row_count or len(rows)}</strong></div>
    <div class="card"><div>Target</div><strong>{job.target_leads}</strong></div>
    <div class="card"><div>Batch</div><strong>{job.batch_size}</strong></div>
  </div>
  <p><a href="/api/export/csv">Download CSV</a> | <a href="/api/export/json">Download JSON</a></p>
  <h2>Recent log lines</h2>
  <pre>{"".join(lines) or "No log output yet."}</pre>
  <h2>Latest rows</h2>
  <table>
    <thead><tr><th>Company</th><th>Executive</th><th>Title</th><th>Email</th><th>Website</th></tr></thead>
    <tbody>
      {"".join(f"<tr><td>{row.get('company_name','')}</td><td>{row.get('name','')}</td><td>{row.get('title','')}</td><td>{row.get('email','')}</td><td>{row.get('website','')}</td></tr>" for row in rows[:25])}
    </tbody>
  </table>
</body>
</html>
"""


@app.get("/api/jobs")
def api_jobs() -> JSONResponse:
    return JSONResponse(
        {
            "jobs": [
                {
                    "job_id": job.job_id,
                    "status": job.status,
                    "created_at": job.created_at,
                    "started_at": job.started_at,
                    "finished_at": job.finished_at,
                    "seed_urls": job.seed_urls,
                    "target_leads": job.target_leads,
                    "batch_size": job.batch_size,
                    "limit": job.limit,
                    "row_count": job.row_count,
                    "error": job.error,
                }
                for job in _jobs.values()
            ]
        }
    )


@app.get("/api/jobs/{job_id}")
def api_job(job_id: str) -> JSONResponse:
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Run not found")
    return JSONResponse(
        {
            "job_id": job.job_id,
            "status": job.status,
            "created_at": job.created_at,
            "started_at": job.started_at,
            "finished_at": job.finished_at,
            "command": job.command,
            "seed_urls": job.seed_urls,
            "target_leads": job.target_leads,
            "batch_size": job.batch_size,
            "limit": job.limit,
            "log_path": job.log_path,
            "config_path": job.config_path,
            "seed_csv_path": job.seed_csv_path,
            "output_csv": job.output_csv,
            "output_json": job.output_json,
            "row_count": job.row_count,
            "error": job.error,
        }
    )


@app.get("/api/export/csv")
def api_export_csv() -> FileResponse:
    if not BASE_CSV_PATH.exists():
        raise HTTPException(status_code=404, detail="CSV export not found")
    return FileResponse(BASE_CSV_PATH, filename=BASE_CSV_PATH.name)


@app.get("/api/export/json")
def api_export_json() -> FileResponse:
    if not BASE_JSON_PATH.exists():
        raise HTTPException(status_code=404, detail="JSON export not found")
    return FileResponse(BASE_JSON_PATH, filename=BASE_JSON_PATH.name)
