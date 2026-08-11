import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { VillageRecord } from "../types";

export const SEMUA = "Semua";

interface Props {
  records: VillageRecord[];
  kabupaten: string;
  kecamatan: string;
  onKabupatenChange: (value: string) => void;
  onKecamatanChange: (value: string) => void;
}

export function RegionFilter({ records, kabupaten, kecamatan, onKabupatenChange, onKecamatanChange }: Props) {
  const kabupatenList = useMemo(
    () => [SEMUA, ...Array.from(new Set(records.map((r) => r.kabupaten_kota ?? ""))).filter(Boolean).sort()],
    [records]
  );

  const kecamatanList = useMemo(() => {
    const pool = kabupaten === SEMUA ? records : records.filter((r) => r.kabupaten_kota === kabupaten);
    return [SEMUA, ...Array.from(new Set(pool.map((r) => r.kecamatan ?? ""))).filter(Boolean).sort()];
  }, [records, kabupaten]);

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
        padding: "8px 14px",
        background: "var(--surface-3)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
        Kabupaten/Kota:
        <select
          value={kabupaten}
          onChange={(e) => {
            onKabupatenChange(e.target.value);
            onKecamatanChange(SEMUA);
          }}
          style={selectStyle}
        >
          {kabupatenList.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
        Kecamatan:
        <select value={kecamatan} onChange={(e) => onKecamatanChange(e.target.value)} style={selectStyle}>
          {kecamatanList.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

const selectStyle: CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--surface-1)",
  color: "var(--text-primary)",
};
