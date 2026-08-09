import { useEffect, useRef, useState } from "react";

// Every phrase in this component is copy-pasted verbatim from the paper's
// Metode (§2.1–2.2) and Figure 2 caption, not paraphrased — see the source
// comments on each line. Do not edit wording here without updating the paper,
// or vice versa; this panel exists specifically to prevent the two drifting.

export function MethodologyPanel() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} style={{ fontSize: 13, position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background: "var(--surface-3)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        <span aria-hidden>ⓘ</span> Sumber Data & Metodologi
      </button>

      {open && (
        // Anchored left and absolutely positioned so it opens as a flyout over
        // the page instead of pushing the tabs/content below it downward.
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 50,
            padding: 16,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface-3)",
            boxShadow: "0 8px 24px var(--border)",
            width: "min(560px, 90vw)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            lineHeight: 1.6,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Sumber Data</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)" }}>
              {/* §2.1 Data — verbatim per sentence, with the data period spliced in
                  at the natural point in each without altering the paper's wording */}
              <li>
                Produktivitas pertanian desa diukur menggunakan indeks vegetasi (NDVI) dari
                citra Sentinel-2 periode Mei–Oktober 2024, yang diagregasi khusus pada piksel
                bermasker lahan pertanian (cropland) berdasarkan peta tutupan lahan ESA
                WorldCover resolusi 10 meter.
              </li>
              <li>
                Aktivasi ekonomi lokal diukur menggunakan intensitas cahaya malam (nighttime
                lights) dari VIIRS periode Mei–Oktober 2024, dirata-ratakan pada batas
                administratif setiap desa.
              </li>
              <li>
                Data institusional dan infrastruktur desa bersumber dari Potensi Desa (PODES)
                2025 (menggunakan data tahun 2024), yang mencakup tujuh dimensi: akses pasar,
                perbankan, infrastruktur pertanian, konektivitas fisik, konektivitas digital,
                modal manusia, dan fasilitas kesehatan.
              </li>
            </ul>
          </div>

          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Populasi Analitis</div>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              {/* §2.2 Populasi Analitis dan Profil Perkembangan Desa — verbatim */}
              Dari total 2.284 desa di Provinsi Sulawesi Tenggara, sebanyak 1.577 desa
              teridentifikasi memiliki lahan pertanian. Penelitian ini mengeluarkan wilayah
              administratif kota (Kota Kendari dan Kota Bau Bau), yang secara struktural
              bukan sasaran kebijakan intervensi desa pertanian, sehingga diperoleh populasi
              analitis akhir sebanyak N = 1.524 desa dengan data institusional PODES yang
              lengkap.
            </p>
          </div>

          <p
            style={{
              margin: 0,
              paddingTop: 8,
              borderTop: "1px solid var(--gridline)",
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            Purwarupa ini mengoperasionalkan hasil Tabel 3 dari{" "}
            <span style={{ color: "var(--critical)", fontStyle: "normal" }}>
              [ISI: judul singkat/nama penulis paper]
            </span>
            .
          </p>
        </div>
      )}
    </div>
  );
}
