import type { VillageRecord } from "../types";

interface Props {
  records: VillageRecord[];
}

export function StatSummary({ records }: Props) {
  const total = records.length;
  const inScope = records.filter((r) => r.in_scope).length;
  const q1 = records.filter((r) => r.profil_code === 1).length;
  const kelompok1 = records.filter((r) => r.kelompok === "Kelompok 1").length;
  const kelompok2 = records.filter((r) => r.kelompok === "Kelompok 2").length;

  const tiles = [
    { label: "Total desa", value: total, note: "Sulawesi Tenggara" },
    { label: "Populasi analitis", value: inScope, note: "memiliki lahan pertanian, non-kota" },
    { label: "Tinggi–Rendah (Q1)", value: q1, note: "fokus kerangka intervensi", accent: true },
    { label: "Kelompok 1", value: kelompok1, note: "akses pasar / perbankan / kesehatan" },
    { label: "Kelompok 2", value: kelompok2, note: "infrastruktur irigasi" },
  ];

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            flex: "1 1 160px",
            padding: "12px 16px",
            borderRadius: 10,
            background: "var(--surface-3)",
            border: t.accent ? "1px solid var(--series-1)" : "1px solid var(--border)",
          }}
        >
          <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: t.accent ? "var(--series-1)" : "var(--text-primary)" }}>
            {t.value.toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{t.label}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.note}</div>
        </div>
      ))}
    </div>
  );
}
