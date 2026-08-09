# Dasbor Prioritas Desa — Sulawesi Tenggara

Interactive dashboard for the village-level decision-support framework described in
*Draf_Metode_Hasil_Forkestra2026*: agricultural productivity (NDVI) × economic
activation (nighttime lights) × institutional capacity (PODES), classified into four
development profiles and, for the 688 "high productivity, low activation" villages,
a prioritized intervention framework.

## Structure

- `database/` — source research output (CSV + GeoJSON), one row per village, joined
  on `iddesa`. This is the ground truth; nothing here is hand-edited by the app.
- `app/` — the React + TypeScript + MapLibre dashboard.
  - `app/scripts/build-data.mjs` joins the `database/` tables into
    `app/public/data/villages.json` (all properties) and `villages.geojson`
    (simplified polygons for the map), applying a few corrections documented inline
    in that script (e.g. the `is_urban` flag is inverted from its name, and 6 of the
    688 Q1 villages have no genuine below-average constraint despite being assigned
    one by the source pipeline — see the `noBindingConstraint` logic).

## Local development

```bash
cd app
npm install
node scripts/build-data.mjs   # regenerate public/data/*.json from database/
npm run dev
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which regenerates the
data files from `database/` and deploys `app/` to GitHub Pages. Enable Pages once,
under Settings → Pages → Source → "GitHub Actions", after the first push.
