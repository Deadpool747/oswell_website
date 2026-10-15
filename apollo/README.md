# Apollo Prospecting Helper

This package searches Apollo for prospects that match the Oswell Technologies ICP, ranks the results, and can enrich the top matches.

## Environment

Set these variables in your shell or `.env` file:

- `APOLLO_API_KEY`
- `APOLLO_BASE_URL` (optional, defaults to `https://api.apollo.io`)

## Commands

```bash
python -m apollo.cli dry-run
python -m apollo.cli health
python -m apollo.cli search --page 1 --per-page 25 --output output/apollo_ranked.csv
python -m apollo.cli rank --input output/apollo_ranked.csv --output output/apollo_ranked_clean.csv
```

## Notes

- `dry-run` uses local sample data and does not call Apollo.
- `health` confirms the API key works.
- `search` runs the Oswell ICP search and ranks the returned prospects.
- `rank` lets you score a CSV or JSON export offline.
