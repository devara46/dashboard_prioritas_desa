import { useEffect, useRef } from "react";
import { Map as MaplibreMap, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import type { ExpressionSpecification, MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import type { VillageGeoJSON } from "../hooks/useVillages";
import { PROFIL_SHORT } from "../types";
import type { Profil } from "../types";
import { HATCH_PATTERN_ID, buildHatchPatternImage } from "../lib/hatchPattern";

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

interface Props {
  onSelect: (iddesa: string) => void;
  highlightId: string | null;
}

export function MapView({ onSelect, highlightId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);

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
      center: [122.3, -4.0],
      zoom: 7.3,
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

        map.addImage(HATCH_PATTERN_ID, buildHatchPatternImage(), { pixelRatio: 2 });

        map.addSource("villages", {
          type: "geojson",
          data: geojson as unknown as FeatureCollection,
        });

        map.addLayer({
          id: "villages-fill",
          type: "fill",
          source: "villages",
          filter: ["==", ["get", "in_scope"], true],
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
          filter: ["==", ["get", "in_scope"], false],
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
  }, [onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("villages-highlight")) return;
    map.setFilter("villages-highlight", ["==", ["get", "iddesa"], highlightId ?? ""]);
  }, [highlightId]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
