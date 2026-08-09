interface Row {
  blok: string;
  hubungan: string;
  arah: "up" | "down" | "mixed" | "none";
  interpretasi: string;
}

const ROWS: Row[] = [
  { blok: "Akses Pasar (B1)", hubungan: "Aktivasi ekonomi ↑", arah: "up", interpretasi: "Berkaitan dengan kepadatan aktivitas perdagangan lokal (kepadatan pertokoan)." },
  { blok: "Perbankan (B2)", hubungan: "Produktivitas ↑, Aktivasi ↑", arah: "up", interpretasi: "Satu-satunya blok yang konsisten pada kedua dimensi — bank pemerintah maupun swasta." },
  { blok: "Infrastruktur Pertanian (B3)", hubungan: "Aktivasi ekonomi ↓", arah: "down", interpretasi: "Kelangkaan air dan ketergantungan tadah hujan — bersifat struktural, perlu investasi irigasi." },
  { blok: "Konektivitas Fisik (B4)", hubungan: "Tidak konsisten", arah: "none", interpretasi: "Belum menunjukkan hubungan yang konsisten pada model terpangkas." },
  { blok: "Konektivitas Digital (B5)", hubungan: "Tidak konsisten", arah: "none", interpretasi: "Pengaruh tidak konsisten setelah seleksi model." },
  { blok: "Modal Manusia (B6)", hubungan: "Aktivasi ekonomi ↓ (lemah)", arah: "mixed", interpretasi: "Temuan masih bersifat eksploratif, belum memadai sebagai dasar rekomendasi." },
  { blok: "Kesehatan (B7)", hubungan: "Produktivitas ↓, Aktivasi ↑", arah: "mixed", interpretasi: "Terutama fasilitas kesehatan swasta (RS, klinik pratama, dokter mandiri), bukan puskesmas. Arah sebab-akibat belum pasti." },
];

const ARAH_COLOR: Record<Row["arah"], string> = {
  up: "var(--good)",
  down: "var(--critical)",
  mixed: "var(--warning)",
  none: "var(--text-muted)",
};

export function DeterminantsPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 920, margin: "0 auto", width: "100%" }}>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
        Dari tujuh dimensi institusional PODES, empat blok menunjukkan hubungan empiris yang
        konsisten (p&lt;0,05) terhadap produktivitas pertanian dan/atau aktivasi ekonomi pada
        model terpangkas (Bagian 3.3). Hanya blok-blok ini yang digunakan sebagai dasar diagnosis
        kendala utama pada kerangka prioritas.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--baseline)" }}>
              <th style={{ padding: "8px 12px" }}>Blok</th>
              <th style={{ padding: "8px 12px" }}>Hubungan Empiris</th>
              <th style={{ padding: "8px 12px" }}>Interpretasi</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.blok} style={{ borderBottom: "1px solid var(--gridline)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, whiteSpace: "nowrap" }}>{r.blok}</td>
                <td style={{ padding: "10px 12px", color: ARAH_COLOR[r.arah], whiteSpace: "nowrap" }}>
                  {r.hubungan}
                </td>
                <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{r.interpretasi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
        Tanda panah menunjukkan arah pengaruh signifikan pada model terpangkas setelah
        penyaringan observasi berpengaruh (Cook's Distance, ambang 4/N). Rincian koefisien
        tersedia pada lampiran naskah.
      </p>
    </div>
  );
}
