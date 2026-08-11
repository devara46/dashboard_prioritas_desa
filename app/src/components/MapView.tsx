import { useEffect, useRef } from "react";
import { Map as MaplibreMap, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import type { ExpressionSpecification, MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Geometry } from "geojson";
import type { VillageGeoJSON } from "../hooks/useVillages";
import { PROFIL_SHORT } from "../types";
import type { Profil } from "../types";
import { HATCH_PATTERN_ID, buildHatchPatternImage } from "../lib/hatchPattern";
import { SEMUA } from "./RegionFilter";

// MapLibre computes its worker's URL at runtime relative to its OWN bundled file,
// and that worker script has its own internal relative import to a second file
// (maplibre-gl-shared.mjs). Vite's dev server keeps package files in their real
// node_modules locations so both resolve correctly by accident; a production
// build squashes everything into one bundle, which breaks both assumptions (only
// in production, silently: the layer object still gets added, it just never gets
// tessellated into visible geometry). scripts/copy-maplibre-worker.mjs copies both
// files verbatim (unhashed, original names, same directory) into public/maplibre/
// before every build so their relative relationship survives untouched, and this
// points MapLibre at that copy explicitly instead of letting it auto-detect a path.
setWorkerUrl(`${import.meta.env.BASE_URL}maplibre/maplibre-gl-worker.mjs`);

const INITIAL_CENTER: [number, number] = [122.3, -4.0];
const INITIAL_ZOOM = 7.3;

const SCOPE_FILL_FILTER: ExpressionSpecification = ["==", ["get", "in_scope"], true];
const SCOPE_HATCH_FILTER: ExpressionSpecification = ["==", ["get", "in_scope"], false];

// Q1 gets the most saturated hue — it must read as dominant from viewing
// distance since it's the sole focus of the intervention framework. Q2–Q4 are
// deliberately desaturated so none of them compete with it. Out-of-scope
// villages are NOT part of this color family at all (see hatchPattern.ts) —
// a muted solid color here would still read as "a paler Q3."
const FILL_COLOR: ExpressionSpecification = [
  "case",
  ["==", ["get", "profil_code"], 1],
  "#2E6FCC",
  ["==", ["get", "profil_code"], 2],
  "#9FBF97",
  ["==", ["get", "profil_code"], 4],
  "#D98A4E",
  "#C7BBA3", // profil_code 3 (Rendah-Rendah)
];

function buildRegionFilter(kabupaten: string, kecamatan: string): ExpressionSpecification | null {
  const clauses: ExpressionSpecification[] = [];
  if (kabupaten !== SEMUA) clauses.push(["==", ["get", "kabupaten_kota"], kabupaten]);
  if (kecamatan !== SEMUA) clauses.push(["==", ["get", "kecamatan"], kecamatan]);
  if (clauses.length === 0) return null;
  return clauses.length === 1 ? clauses[0] : ["all", ...clauses];
}

function collectCoords(geometry: Geometry | null | undefined, out: [number, number][]) {
  if (!geometry) return;
  const rings = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  for (const poly of rings) {
    for (const ring of poly) {
      for (const c of ring) out.push(c as [number, number]);
    }
  }
}

function computeBounds(
  features: Array<{ geometry: Geometry }>
): [[number, number], [number, number]] | null {
  const coords: [number, number][] = [];
  for (const f of features) collectCoords(f.geometry, coords);
  if (coords.length === 0) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

interface Props {
  onSelect: (iddesa: string) => void;
  highlightId: string | null;
  kabupaten: string;
  kecamatan: string;
}

export function MapView({ onSelect, highlightId, kabupaten, kecamatan }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const featuresRef = useRef<VillageGeoJSON["features"]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    // "style.load" fires once source/layer definitions are parsed, independent of
    // whether the raster basemap's actual tile images finish downloading — using
    // "load" instead would leave the village layer waiting on basemap tiles that
    // may never arrive (e.g. blocked outbound requests in a sandboxed preview).
    map.on("style.load", async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/villages.geojson`);
        const geojson: VillageGeoJSON = await res.json();
        featuresRef.current = geojson.features;

        map.addImage(HATCH_PATTERN_ID, buildHatchPatternImage(), { pixelRatio: 2 });

        map.addSource("villages", {
          type: "geojson",
          data: geojson as unknown as FeatureCollection,
        });

        map.addLayer({
          id: "villages-fill",
          type: "fill",
          source: "villages",
          filter: SCOPE_FILL_FILTER,
          paint: {
            "fill-color": FILL_COLOR,
            "fill-opacity": 0.8,
          },
        });

        // Diagonal-hatch pattern instead of a solid color — deliberately outside
        // the quadrant color family so it can't be misread as a faded category.
        map.addLayer({
          id: "villages-fill-hatch",
          type: "fill",
          source: "villages",
          filter: SCOPE_HATCH_FILTER,
          paint: {
            "fill-pattern": HATCH_PATTERN_ID,
            "fill-opacity": 0.9,
          },
        });

        map.addLayer({
          id: "villages-line",
          type: "line",
          source: "villages",
          paint: {
            "line-color": "#0b0b0b",
            "line-opacity": 0.08,
            "line-width": 0.5,
          },
        });

        map.addLayer({
          id: "villages-highlight",
          type: "line",
          source: "villages",
          filter: ["==", ["get", "iddesa"], ""],
          paint: { "line-color": "#0b0b0b", "line-width": 3 },
        });

        // Re-apply whatever region filter is currently selected — this handler can
        // run after the user has already picked a Kabupaten/Kecamatan (data load and
        // filter-selection races are possible since they're independent fetches).
        applyRegionFilter(map, featuresRef.current, kabupaten, kecamatan, false);

        const interactiveLayers = ["villages-fill", "villages-fill-hatch"];
        const popup = new Popup({ closeButton: false, closeOnClick: false, maxWidth: "280px" });

        for (const layerId of interactiveLayers) {
          map.on("click", layerId, (e: MapLayerMouseEvent) => {
            const f = e.features?.[0];
            if (f) onSelect(String(f.properties?.iddesa));
          });
          map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
            popup.remove();
          });
          map.on("mousemove", layerId, (e: MapLayerMouseEvent) => {
            const f = e.features?.[0];
            if (!f) return;
            const p = f.properties as Record<string, unknown>;
            const header = `<strong>${p.nama_desa}</strong><br/>${p.kecamatan}, ${p.kabupaten_kota}`;
            // Verbatim from the paper (Fig. 2 caption / §2.2) — deliberately not
            // paraphrased, so the scope-boundary explanation can never drift from
            // the paper's own wording. See MethodologyPanel.tsx for the same rule.
            const body =
              p.in_scope === false
                ? p.excluded_reason === "urban"
                  ? "Desa/kelurahan ini berada di luar populasi analitis karena termasuk wilayah administratif kota (Kota Kendari atau Kota Bau Bau), yang secara struktural bukan sasaran kebijakan intervensi desa pertanian."
                  : "Desa ini berada di luar populasi analitis karena tidak teridentifikasi memiliki lahan pertanian (ESA WorldCover), sehingga produktivitas pertanian tidak dapat diukur pada desa ini."
                : PROFIL_SHORT[p.profil as Profil];
            popup.setLngLat(e.lngLat).setHTML(`${header}<br/>${body}`).addTo(map);
          });
        }
      } catch (err) {
        console.error("[MapView] failed to set up village layers:", err);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run this effect for onSelect; kabupaten/kecamatan are read once at mount time and otherwise handled by the effect below
  }, [onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("villages-fill")) return;
    applyRegionFilter(map, featuresRef.current, kabupaten, kecamatan, true);
  }, [kabupaten, kecamatan]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("villages-highlight")) return;
    map.setFilter("villages-highlight", ["==", ["get", "iddesa"], highlightId ?? ""]);
  }, [highlightId]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

function applyRegionFilter(
  map: MaplibreMap,
  features: VillageGeoJSON["features"],
  kabupaten: string,
  kecamatan: string,
  animate: boolean
) {
  const regionFilter = buildRegionFilter(kabupaten, kecamatan);
  map.setFilter("villages-fill", regionFilter ? ["all", SCOPE_FILL_FILTER, regionFilter] : SCOPE_FILL_FILTER);
  map.setFilter(
    "villages-fill-hatch",
    regionFilter ? ["all", SCOPE_HATCH_FILTER, regionFilter] : SCOPE_HATCH_FILTER
  );
  map.setFilter("villages-line", regionFilter);

  if (kabupaten === SEMUA && kecamatan === SEMUA) {
    map.easeTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: animate ? 500 : 0 });
    return;
  }
  const matching = features.filter((f) => {
    const p = f.properties;
    if (kabupaten !== SEMUA && p.kabupaten_kota !== kabupaten) return false;
    if (kecamatan !== SEMUA && p.kecamatan !== kecamatan) return false;
    return true;
  });
  const bounds = computeBounds(matching);
  if (bounds) map.fitBounds(bounds, { padding: 40, duration: animate ? 500 : 0 });
}
