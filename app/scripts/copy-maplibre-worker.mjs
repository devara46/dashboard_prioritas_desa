// MapLibre's worker script has its own internal `import ... from "./maplibre-gl-shared.mjs"`
// that must resolve against the worker's OWN final location. Vite's `?url` asset pipeline
// hashes/moves files it's explicitly told about, but has no idea a raw-copied file contains
// its own literal relative import to a second file — so hashing just the worker alone breaks
// that import. Instead we copy both files verbatim (unhashed, original names, same directory)
// into public/ so their relative relationship survives untouched, and point MapLibre at the
// copy explicitly via setWorkerUrl() in MapView.tsx. Runs before every build so it always
// matches whatever maplibre-gl version is actually installed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(APP_DIR, "node_modules", "maplibre-gl", "dist");
const OUT_DIR = path.join(APP_DIR, "public", "maplibre");

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  fs.copyFileSync(path.join(SRC_DIR, file), path.join(OUT_DIR, file));
  console.log(`Copied ${file} -> public/maplibre/${file}`);
}
