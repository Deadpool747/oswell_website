# Public Executive Lead Extraction

This project is a standalone, extraction-only lead generation app for public business data.

It discovers company websites from seeds or CSVs, crawls public pages, extracts publicly listed executive details, deduplicates rows, and exports clean CSV and JSON files.

## What it targets

- startups
- new companies
- small and mid-sized businesses
- public company websites and public directories you are allowed to crawl

## What it collects

- company name
- website
- executive name
- executive title
- email, only if publicly listed
- phone, only if publicly listed
- LinkedIn URL, only if publicly listed
- Twitter/X URL, only if publicly listed
- country, state, city, and industry
- source URL
- last crawled time

## Boundaries

- No email guessing
- No generated contacts
- No hidden or leaked datasets
- Respect robots.txt where applicable
- Only use public pages and public registries

## Project layout

- `main.py` - CLI pipeline runner
- `crawler.py` - website discovery and crawling
- `discovery.py` - startup and registry discovery
- `extractor.py` - executive extraction
- `parser.py` - HTML parsing
- `database.py` - SQLite persistence and resume support
- `exporter.py` - CSV and JSON export
- `leadgen_app.py` - FastAPI web UI and job runner
- `leadgen_quality.py` - shared dedupe and quality rules
- `config.yaml` - runtime configuration

## Install

```bash
pip install -r requirements.txt
playwright install
```

## Run the CLI

Process whatever is in `config.yaml`:

```bash
python main.py --config config.yaml --resume
```

Stop after a specific lead target:

```bash
python main.py --config config.yaml --target-leads 1000 --resume
```

Test with a small batch:

```bash
python main.py --config config.yaml --limit 10 --resume
```

## Run the web app

Start the extraction dashboard:

```bash
uvicorn leadgen_app:app --reload --port 8000
```

Open:

- `http://127.0.0.1:8000`

In the web UI:

- paste one public company website per line
- set a target lead count
- click run
- inspect the latest rows and recent job logs

## Input format

You can seed discovery from a CSV with columns like:

```csv
company,website,country,state,city,industry,source_url
Acme Inc,https://acme.com,United States,California,San Francisco,Software,https://example.org/source
```

You can also paste raw URLs into the web UI.

## Output files

The latest clean export is written to:

- `output/executive_leads.csv`
- `output/executive_leads.json`

Job-specific runs are stored under:

- `data/jobs/<job_id>/`

## Resume behavior

SQLite stores crawl state so interrupted runs can continue later.

## Data quality

The app removes duplicates and filters obvious false positives before export.

## Notes

- The pipeline is designed around public data only.
- If you want to scale later, the same extraction core can be wrapped in queue workers, API endpoints, or a larger dashboard.
- The FastAPI app uses deterministic heuristic extraction by default, so it works without any LLM API key or local model server.
- If you do have a local OpenAI-compatible model server, you can re-enable `llm.enabled` in `config.yaml` for deeper extraction experiments.
