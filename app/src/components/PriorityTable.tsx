import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { VillageRecord } from "../types";

interface Props {
  records: VillageRecord[];
  onSelect: (iddesa: string) => void;
}

type SortKey = "nama_desa" | "kabupaten_kota" | "kelompok" | "jenjang_prioritas" | "severity";

const JENJANG_COLOR: Record<string, string> = {
  "Prioritas I": "#2a78d6",
  "Prioritas II": "#6da7ec",
  "Prioritas III": "#b7d3f6",
  "Investasi Infrastruktur": "#eb6834",
};

export function PriorityTable({ records, onSelect }: Props) {
  const [kelompok, setKelompok] = useState("Semua");
  const [jenjang, setJenjang] = useState("Semua");
  const [kabupaten, setKabupaten] = useState("Semua");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const q1 = useMemo(() => records.filter((r) => r.profil_code === 1), [records]);

  const kabupatenList = useMemo(
    () => ["Semua", ...Array.from(new Set(q1.map((r) => r.kabupaten_kota ?? ""))).sort()],
    [q1]
  );

  const jenjangList = ["Semua", "Prioritas I", "Prioritas II", "Prioritas III", "Investasi Infrastruktur"];

  const filtered = useMemo(() => {
    let rows = q1;
    if (kelompok !== "Semua") rows = rows.filter((r) => r.kelompok === kelompok);
    if (jenjang !== "Semua") rows = rows.filter((r) => r.jenjang_prioritas === jenjang);
    if (kabupaten !== "Semua") rows = rows.filter((r) => r.kabupaten_kota === kabupaten);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      rows = rows.filter((r) => r.nama_desa?.toLowerCase().includes(s));
    }
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [q1, kelompok, jenjang, kabupaten, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const th = (label: string, key: SortKey) => (
    <th
      onClick={() => toggleSort(key)}
      style={{ padding: "8px 12px", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
    >
      {label} {sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Cari nama desa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", minWidth: 180 }}
        />
        <select value={kelompok} onChange={(e) => setKelompok(e.target.value)} style={selectStyle}>
          {["Semua", "Kelompok 1", "Kelompok 2"].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <select value={jenjang} onChange={(e) => setJenjang(e.target.value)} style={selectStyle}>
          {jenjangList.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <select value={kabupaten} onChange={(e) => setKabupaten(e.target.value)} style={selectStyle}>
          {kabupatenList.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {filtered.length} dari {q1.length} desa Q1
        </span>
      </div>

      <div style={{ flex: 1, overflow: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--surface-3)", zIndex: 1 }}>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--baseline)" }}>
              {th("Desa", "nama_desa")}
              {th("Kabupaten/Kota", "kabupaten_kota")}
              {th("Kelompok", "kelompok")}
              <th style={{ padding: "8px 12px" }}>Kendala Utama</th>
              {th("Jenjang Prioritas", "jenjang_prioritas")}
              {th("Besaran Kendala", "severity")}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.iddesa}
                onClick={() => onSelect(r.iddesa)}
                style={{ borderBottom: "1px solid var(--gridline)", cursor: "pointer" }}
              >
                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{r.nama_desa}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{r.kabupaten_kota}</td>
                {r.no_binding_constraint ? (
                  <td colSpan={4} style={{ padding: "8px 12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    Tidak ada kendala di bawah rata-rata pada B1/B2/B3/B7 — tidak masuk kerangka prioritas
                  </td>
                ) : (
                  <>
                    <td style={{ padding: "8px 12px" }}>{r.kelompok}</td>
                    <td style={{ padding: "8px 12px" }}>{r.kendala_utama_label}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          color: "#fff",
                          background: JENJANG_COLOR[r.jenjang_prioritas ?? ""] ?? "var(--text-muted)",
                        }}
                      >
                        {r.jenjang_prioritas}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ padding: "8px 12px" }}>
                      {r.severity?.toFixed(2)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const selectStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid var(--border)",
};
