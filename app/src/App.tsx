import { useCallback, useMemo, useState } from "react";
import { useVillages } from "./hooks/useVillages";
import { MapView } from "./components/MapView";
import { ScatterView } from "./components/ScatterView";
import { DeterminantsPanel } from "./components/DeterminantsPanel";
import { PriorityTable } from "./components/PriorityTable";
import { VillageDetail } from "./components/VillageDetail";
import { StatSummary } from "./components/StatSummary";
import { ProfilLegend } from "./components/ProfilLegend";
import { MethodologyPanel } from "./components/MethodologyPanel";
import { RegionFilter, SEMUA } from "./components/RegionFilter";

type Tab = "peta" | "sebaran" | "determinan" | "prioritas";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "peta", label: "Peta Sebaran" },
  { id: "sebaran", label: "Produktivitas × Aktivasi" },
  { id: "determinan", label: "Determinan" },
  { id: "prioritas", label: "Eksplorasi Prioritas" },
];

function App() {
  const { records, error } = useVillages();
  const [tab, setTab] = useState<Tab>("peta");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapKabupaten, setMapKabupaten] = useState(SEMUA);
  const [mapKecamatan, setMapKecamatan] = useState(SEMUA);

  const onSelect = useCallback((id: string) => setSelectedId(id), []);
  const selectedVillage = useMemo(
    () => records?.find((r) => r.iddesa === selectedId) ?? null,
    [records, selectedId]
  );

  if (error) {
    return <div style={{ padding: 24, color: "var(--critical)" }}>Gagal memuat data: {error}</div>;
  }
  if (!records) {
    return (
      <div style={{ padding: 24, color: "var(--text-secondary)" }}>Memuat data desa…</div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-3)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20 }}>Dasbor Prioritas Desa — Sulawesi Tenggara</h1>
        <p style={{ margin: "4px 0 12px", fontSize: 13, color: "var(--text-secondary)" }}>
          Kerangka dukungan keputusan spasial: produktivitas pertanian (NDVI) × aktivasi ekonomi
          (VIIRS) × kelembagaan desa (PODES)
        </p>
        <MethodologyPanel />
      </header>

      <div style={{ padding: "16px 24px 0" }}>
        <StatSummary records={records} />
      </div>

      <nav style={{ display: "flex", gap: 4, padding: "16px 24px 0", borderBottom: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px",
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--series-1)" : "2px solid transparent",
              background: "transparent",
              color: tab === t.id ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: tab === t.id ? 600 : 400,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ flex: 1, minHeight: 0, padding: 20, display: "flex", flexDirection: "column" }}>
        {tab === "peta" && (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <ProfilLegend />
              <RegionFilter
                records={records}
                kabupaten={mapKabupaten}
                kecamatan={mapKecamatan}
                onKabupatenChange={setMapKabupaten}
                onKecamatanChange={setMapKecamatan}
              />
            </div>
            <div style={{ flex: 1, minHeight: 0, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
              <MapView
                onSelect={onSelect}
                highlightId={selectedId}
                kabupaten={mapKabupaten}
                kecamatan={mapKecamatan}
              />
            </div>
          </div>
        )}
        {tab === "sebaran" && (
          <div style={{ flex: 1, minHeight: 0 }}>
            <ScatterView records={records} onSelect={onSelect} />
          </div>
        )}
        {tab === "determinan" && <DeterminantsPanel />}
        {tab === "prioritas" && (
          <div style={{ flex: 1, minHeight: 0 }}>
            <PriorityTable records={records} onSelect={onSelect} />
          </div>
        )}
      </main>

      <VillageDetail village={selectedVillage} onClose={() => setSelectedId(null)} />
    </div>
  );
}

export default App;
