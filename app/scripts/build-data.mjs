// Joins the raw research-output tables in /database into the merged dataset
// the dashboard consumes. Run with: node scripts/build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mapshaper = require("mapshaper");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DB_DIR = path.join(ROOT, "database");
const APP_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.join(APP_DIR, "public", "data");

fs.mkdirSync(OUT_DIR, { recursive: true });

// ---- minimal RFC4180 CSV parser (handles quoted fields with commas) ----
function parseCSV(filePath) {
  const text = fs.readFileSync(filePath, "utf-8");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows[0];
  const records = rows
    .slice(1)
    .filter((r) => r.length === header.length && r.some((v) => v !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
  return records;
}

const toFloat = (v) => (v === undefined || v === "" || v === "nan" ? null : parseFloat(v));
const toBool = (v) => v === "True";

console.log("Reading source tables...");
const population = parseCSV(path.join(DB_DIR, "db_population.csv"));
const measure = parseCSV(path.join(DB_DIR, "db_measure.csv"));
const block = parseCSV(path.join(DB_DIR, "db_block.csv"));
const cls = parseCSV(path.join(DB_DIR, "db_class.csv"));
const intervention = parseCSV(path.join(DB_DIR, "db_intervention.csv"));
const geo = JSON.parse(fs.readFileSync(path.join(DB_DIR, "db_identifier.geojson"), "utf-8"));

const byId = (records) => new Map(records.map((r) => [r.iddesa, r]));
const measureById = byId(measure);
const blockById = byId(block);
const clsById = byId(cls);
const interventionById = byId(intervention);
const identById = new Map(geo.features.map((f) => [String(f.properties.iddesa), f.properties]));

// Profile (quadrant) label mapping, confirmed against paper's Table 1 counts
// (1=688 Tinggi-Rendah, 2=127 Tinggi-Tinggi, 3=532 Rendah-Rendah, 4=177 Rendah-Tinggi)
const PROFIL_LABEL = {
  1: "Produktivitas Tinggi, Aktivasi Rendah",
  2: "Produktivitas Tinggi, Aktivasi Tinggi",
  3: "Produktivitas Rendah, Aktivasi Rendah",
  4: "Produktivitas Rendah, Aktivasi Tinggi",
};

const BLOCK_LABEL = {
  B1: "Akses Pasar",
  B2: "Perbankan",
  B3: "Infrastruktur Pertanian",
  B7: "Kesehatan",
};

const KELOMPOK_LABEL = { "Tier 1": "Kelompok 1", "Tier 2": "Kelompok 2" };

// --- derive Prioritas I/II/III within Kelompok 1 (Tier 1) by severity rank ---
// Reproduces the paper's published 127/111/198 split (verified: no ties straddle
// rank 127 or rank 238 in this dataset), Kelompok 2 gets a single label instead.
const tier1 = intervention
  .filter((r) => r.tier === "Tier 1")
  .map((r) => ({ iddesa: r.iddesa, severity: toFloat(r.severity) }))
  .sort((a, b) => b.severity - a.severity);

const jenjangById = new Map();
tier1.forEach((r, idx) => {
  const label = idx < 127 ? "Prioritas I" : idx < 127 + 111 ? "Prioritas II" : "Prioritas III";
  jenjangById.set(r.iddesa, label);
});
intervention
  .filter((r) => r.tier === "Tier 2")
  .forEach((r) => jenjangById.set(r.iddesa, "Investasi Infrastruktur"));

console.log(`Tier 1 tertile split: I=${[...jenjangById.values()].filter((v) => v === "Prioritas I").length}, II=${[...jenjangById.values()].filter((v) => v === "Prioritas II").length}, III=${[...jenjangById.values()].filter((v) => v === "Prioritas III").length}`);

const records = population.map((p) => {
  const id = p.iddesa;
  const ident = identById.get(id);
  const m = measureById.get(id);
  const b = blockById.get(id);
  const c = clsById.get(id);
  const iv = interventionById.get(id);

  const isUrban = toBool(p.is_urban); // NB: naming is inverted — False = Kota Kendari/Bau-Bau
  const hasAgri = toBool(p.has_agri);
  const inScope = toBool(p.is_analytic);
  const excludedReason = !isUrban ? "urban" : !hasAgri ? "no_agriculture" : null;

  const quadrant = c ? Math.round(toFloat(c.quadrant)) : null;
  const bindingRaw = iv?.binding_constraint ? iv.binding_constraint.replace(/^z_/, "") : null;

  // 6 of 688 Q1 villages have a positive `magnitude` on their assigned binding
  // constraint (i.e. that block is actually ABOVE the provincial average, not a
  // real deficiency), with `severity` stored as -magnitude instead of abs(magnitude).
  // These stay in their originally-assigned kelompok/kendala_utama/jenjang_prioritas
  // so Kelompok 1 = 436 and Prioritas I = 127 keep matching the manuscript exactly —
  // they're flagged (no_binding_constraint) for the dashboard to display a caveat
  // rather than removed from the framework, since removing them would itself
  // create a mismatch against the published counts. The one thing suppressed is
  // `lever` (the intervention recommendation), since recommending an intervention
  // for a block that isn't actually deficient would be actively misleading.
  const noBindingConstraint = Boolean(iv && toFloat(iv.magnitude) > 0);

  return {
    iddesa: id,
    nama_desa: ident?.nmdesa ?? null,
    kecamatan: ident?.nmkec ?? null,
    kabupaten_kota: ident?.nmkab ?? null,
    has_geometry: Boolean(ident),

    in_scope: inScope,
    excluded_reason: excludedReason,
    excluded_ndvi_model: toBool(p.is_ndvi_exc),
    excluded_ntl_model: toBool(p.is_ntl_exc),

    ndvi_raw: m ? toFloat(m.mean_ndvi) : null,
    z_ndvi: m ? toFloat(m.z_NDVI) : null,
    ntl_raw: m ? toFloat(m.mean_ntl) : null,
    z_ntl: m ? toFloat(m.z_NTL) : null,
    luas_m2: m ? toFloat(m.luas) : null,

    b1_akses_pasar: b ? toFloat(b.B1_MarketAccess_score) : null,
    b2_perbankan: b ? toFloat(b.B2_Perbankan_score) : null,
    b3_infrastruktur_pertanian: b ? toFloat(b.B3_AgriInfra_score) : null,
    b4_konektivitas_fisik: b ? toFloat(b.B4_Physical_Connectivity_score) : null,
    b5_konektivitas_digital: b ? toFloat(b.B5_Digital_Connectivity_score) : null,
    b6_modal_manusia: b ? toFloat(b.B6_HumanCapital_score) : null,
    b7_kesehatan: b ? toFloat(b.B7_Health_score) : null,

    profil_code: quadrant,
    profil: quadrant ? PROFIL_LABEL[quadrant] : null,

    no_binding_constraint: noBindingConstraint,
    kelompok: iv ? KELOMPOK_LABEL[iv.tier] : null,
    kendala_utama: bindingRaw,
    kendala_utama_label: bindingRaw ? BLOCK_LABEL[bindingRaw] : null,
    lever: noBindingConstraint ? null : iv?.lever || null,
    note: iv?.note || null,
    besaran_kendala: iv ? toFloat(iv.magnitude) : null,
    severity: iv ? toFloat(iv.severity) : null,
    jenjang_prioritas: jenjangById.get(id) ?? null,
  };
});

console.log(`Merged ${records.length} village records.`);
console.log(
  `${records.filter((r) => r.no_binding_constraint).length} villages flagged no_binding_constraint (positive magnitude on assigned block) — kept in their kelompok/jenjang_prioritas, lever suppressed.`
);
console.log(
  `Kelompok 1: ${records.filter((r) => r.kelompok === "Kelompok 1").length}, Kelompok 2: ${records.filter((r) => r.kelompok === "Kelompok 2").length}`
);

// --- split into geo (has polygon) vs full master list (includes the 10 without geometry) ---
const recordsById = new Map(records.map((r) => [r.iddesa, r]));

const mergedGeo = {
  type: "FeatureCollection",
  features: geo.features.map((f) => {
    const id = String(f.properties.iddesa);
    return {
      type: "Feature",
      geometry: f.geometry,
      properties: recordsById.get(id) ?? { iddesa: id },
    };
  }),
};

fs.writeFileSync(path.join(OUT_DIR, "villages.json"), JSON.stringify(records));

console.log("Simplifying polygon geometry with mapshaper...");
const rawGeoJSON = JSON.stringify(mergedGeo);
const rawSize = Buffer.byteLength(rawGeoJSON);

const output = await mapshaper.applyCommands(
  "-i input.geojson -simplify 8% keep-shapes -clean -o format=geojson precision=0.0001 output.geojson",
  { "input.geojson": rawGeoJSON }
);
const simplified = output["output.geojson"];
fs.writeFileSync(path.join(OUT_DIR, "villages.geojson"), simplified);

const outSize = Buffer.byteLength(simplified);
console.log(`Geometry size: ${(rawSize / 1e6).toFixed(1)}MB -> ${(outSize / 1e6).toFixed(1)}MB`);

console.log("Done. Output in public/data/villages.geojson and public/data/villages.json");
