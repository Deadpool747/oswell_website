# Oswell Website Repository

This repository is no longer just the original lead-extraction app. It now contains several parallel tracks:

- the public Oswell marketing site and static content pages
- a small Next.js lead-intelligence and intake frontend at the repo root
- a separate `ops-app/` Next.js dashboard prototype
- the original Python lead-generation and extraction pipeline

There is currently no initial git commit in this workspace, so the repository state is effectively a live working tree with multiple in-progress surfaces.

## Current structure

- `index.html`, `services.html`, `products.html`, `use-cases.html`, `contact.html`, `about.html`
  The main public marketing site.
- `research.html`, `assets/research/`, `*-ai-assessment/`
  New research and industry-assessment content for top-of-funnel discovery.
- `app/`, `components/`, `lib/`, `public/`
  Root Next.js app for lead intelligence and the idea intake flow.
- `ops-app/`
  Separate Next.js operations dashboard with mock data and static routes.
- `apollo/`
  Transition layer for Apollo-style ranking and CRM-oriented lead scoring work.
- `main.py`, `crawler.py`, `discovery.py`, `extractor.py`, `database.py`, `exporter.py`, `leadgen_app.py`
  Original Python data pipeline and FastAPI interface.
- `prototype-homepage/`
  Snapshot/prototype copy of the public site.
- `deploy/`
  Static deployment artifacts and side experiments.

## Active frontend surfaces

### 1. Public marketing site

The public site is still mostly static HTML, CSS, and vanilla JS.

- shared styles: `assets/css/style.css`
- shared behavior: `assets/js/main.js`
- industry assessments: `healthcare-ai-assessment/`, `accounting-ai-assessment/`, `logistics-ai-assessment/`, `manufacturing-ai-assessment/`, `education-ai-assessment/`, `legal-ai-assessment/`, `recruitment-ai-assessment/`, `retail-ai-assessment/`
- research hub: `research.html`

### 2. Root Next.js app

This app currently builds as a static export and exposes:

- `/` for the lead intelligence explorer
- `/idea` for the guided project intake experience

Commands:

```bash
npm run dev
npm run build
```

Notes:

- `predev` and `prebuild` regenerate `public/leadgen-data.json`.
- The build currently succeeds in the existing workspace.

### 3. `ops-app` dashboard

This is a separate Next.js application focused on an AI operations dashboard experience.

Commands:

```bash
cd ops-app
npm run dev
npm run build
```

The current implementation is largely mock-data driven under `ops-app/src/data/`.

## Python lead-generation pipeline

The original leadgen system is still present and usable.

### What it does

- discovers company websites from seeds or CSVs
- crawls public pages
- extracts publicly listed executive details
- deduplicates rows
- exports clean CSV and JSON files

### Key files

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

### Install

```bash
pip install -r requirements.txt
playwright install
```

### Run the CLI

```bash
python main.py --config config.yaml --resume
python main.py --config config.yaml --target-leads 1000 --resume
python main.py --config config.yaml --limit 10 --resume
```

### Run the FastAPI app

```bash
uvicorn leadgen_app:app --reload --port 8000
```

Open `http://127.0.0.1:8000`.

## Documentation notes

- `ARCHITECTURE.md` still documents the leadgen-to-Apollo platform direction.
- Some directories are prototypes or deployment snapshots rather than the single source of truth.
- Because the repo has no baseline commit yet, use extra care when interpreting "recent changes": most files are still part of the first uncommitted import.
