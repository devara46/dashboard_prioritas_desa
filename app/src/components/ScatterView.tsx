import { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { VillageRecord } from "../types";
import { ProfilLegend } from "./ProfilLegend";

const SERIES: Array<{ code: 1 | 2 | 3 | 4; label: string; color: string }> = [
  { code: 1, label: "Produktivitas Tinggi, Aktivasi Rendah (Q1)", color: "#2E6FCC" },
  { code: 2, label: "Produktivitas Tinggi, Aktivasi Tinggi", color: "#9FBF97" },
  { code: 3, label: "Produktivitas Rendah, Aktivasi Rendah", color: "#C7BBA3" },
  { code: 4, label: "Produktivitas Rendah, Aktivasi Tinggi", color: "#D98A4E" },
];

interface Props {
  records: VillageRecord[];
  onSelect: (iddesa: string) => void;
}

export function ScatterView({ records, onSelect }: Props) {
  const [kabupaten, setKabupaten] = useState<string>("Semua");

  const kabupatenList = useMemo(() => {
    const set = new Set(records.filter((r) => r.in_scope).map((r) => r.kabupaten_kota ?? ""));
    return ["Semua", ...Array.from(set).sort()];
  }, [records]);

  const inScope = useMemo(
    () =>
      records.filter(
        (r) =>
          r.in_scope &&
          r.z_ndvi !== null &&
          r.z_ntl !== null &&
          (kabupaten === "Semua" || r.kabupaten_kota === kabupaten)
      ),
    [records, kabupaten]
  );

  const byCode = (code: number) => inScope.filter((r) => r.profil_code === code);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <ProfilLegend />
        <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Kabupaten/Kota:{" "}
          <select
            value={kabupaten}
            onChange={(e) => setKabupaten(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)" }}
          >
            {kabupatenList.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ flex: 1, minHeight: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid stroke="var(--gridline)" />
            <XAxis
              type="number"
              dataKey="z_ndvi"
              name="z_NDVI (produktivitas)"
              label={{ value: "z_NDVI — produktivitas pertanian", position: "insideBottom", offset: -10, fill: "var(--text-secondary)" }}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              stroke="var(--baseline)"
            />
            <YAxis
              type="number"
              dataKey="z_ntl"
              name="z_NTL (aktivasi)"
              label={{ value: "z_NTL — aktivasi ekonomi", angle: -90, position: "insideLeft", fill: "var(--text-secondary)" }}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              stroke="var(--baseline)"
            />
            <ZAxis range={[28, 28]} />
            <ReferenceLine x={0} stroke="var(--baseline)" strokeDasharray="4 4" strokeWidth={5} />
            <ReferenceLine y={0} stroke="var(--baseline)" strokeDasharray="4 4" strokeWidth={5} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as VillageRecord;
                return (
                  <div
                    style={{
                      background: "var(--surface-3)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "8px 10px",
                      fontSize: 12,
                      color: "var(--text-primary)",
                    }}
                  >
                    <strong>{p.nama_desa}</strong>
                    <div style={{ color: "var(--text-secondary)" }}>
                      {p.kecamatan}, {p.kabupaten_kota}
                    </div>
                    <div>z_NDVI: {p.z_ndvi?.toFixed(2)}</div>
                    <div>z_NTL: {p.z_ntl?.toFixed(2)}</div>
                  </div>
                );
              }}
            />
            {SERIES.map((s) => (
              <Scatter
                key={s.code}
                name={s.label}
                data={byCode(s.code)}
                fill={s.color}
                fillOpacity={0.7}
                onClick={(d) => onSelect((d as unknown as VillageRecord).iddesa)}
                cursor="pointer"
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
