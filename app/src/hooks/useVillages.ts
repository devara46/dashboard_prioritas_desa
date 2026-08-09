import { useEffect, useState } from "react";
import type { Geometry } from "geojson";
import type { VillageRecord } from "../types";

export interface VillageGeoJSON {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: Geometry;
    properties: VillageRecord;
  }>;
}

interface State {
  records: VillageRecord[] | null;
  geojson: VillageGeoJSON | null;
  error: string | null;
}

let cache: State | null = null;
let inflight: Promise<void> | null = null;

export function useVillages() {
  const [state, setState] = useState<State>(
    cache ?? { records: null, geojson: null, error: null }
  );

  useEffect(() => {
    if (cache) return;
    if (!inflight) {
      inflight = Promise.all([
        fetch(`${import.meta.env.BASE_URL}data/villages.json`).then((r) => r.json()),
        fetch(`${import.meta.env.BASE_URL}data/villages.geojson`).then((r) => r.json()),
      ])
        .then(([records, geojson]) => {
          cache = { records, geojson, error: null };
        })
        .catch((err) => {
          cache = { records: null, geojson: null, error: String(err) };
        })
        .then(() => setState(cache!));
    }
  }, []);

  return state;
}
