const ITEMS: Array<{ label: string; color?: string; hatched?: boolean; note?: string }> = [
  {
    label: "Produktivitas Tinggi, Aktivasi Rendah (Q1)",
    color: "#2E6FCC",
    note: "fokus kerangka intervensi",
  },
  { label: "Produktivitas Tinggi, Aktivasi Tinggi", color: "#9FBF97" },
  { label: "Produktivitas Rendah, Aktivasi Rendah", color: "#C7BBA3" },
  { label: "Produktivitas Rendah, Aktivasi Tinggi", color: "#D98A4E" },
  {
    label: "Di luar populasi analitis",
    hatched: true,
    note: "tidak memiliki lahan pertanian / wilayah kota",
  },
];

export function ProfilLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "14px",
        padding: "10px 14px",
        background: "var(--surface-3)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        fontSize: 13,
        color: "var(--text-secondary)",
      }}
    >
      {ITEMS.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: item.hatched
                ? "repeating-linear-gradient(45deg, rgba(120,118,112,0.55) 0 1.4px, transparent 1.4px 4px)"
                : item.color,
              border: "1px solid var(--border)",
              flexShrink: 0,
            }}
          />
          <span>
            {item.label}
            {item.note && <span style={{ color: "var(--text-muted)" }}> · {item.note}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
