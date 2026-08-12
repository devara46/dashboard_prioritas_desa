import type { VillageRecord } from "../types";
import { BLOCK_LABELS, OPD_BY_BLOCK, PROFIL_SHORT } from "../types";
import type { Profil } from "../types";

interface Props {
  village: VillageRecord | null;
  onClose: () => void;
}

const BLOCK_KEYS = [
  "b1_akses_pasar",
  "b2_perbankan",
  "b3_infrastruktur_pertanian",
  "b4_konektivitas_fisik",
  "b5_konektivitas_digital",
  "b6_modal_manusia",
  "b7_kesehatan",
] as const;

// Which blocks a village's "Diagnosis Kelembagaan" lists depends on its Kelompok
// (§3.4.1): Kelompok 1 villages have their kendala utama among B1/B2/B7, Kelompok 2
// villages always have it at B3 — these are the same sets that DEFINE the two
// kelompok, not a per-village computation.
const KELOMPOK_BLOCKS: Record<string, (typeof BLOCK_KEYS)[number][]> = {
  "Kelompok 1": ["b1_akses_pasar", "b2_perbankan", "b7_kesehatan"],
  "Kelompok 2": ["b3_infrastruktur_pertanian"],
};

// The 4 blocks with an empirically consistent relationship to productivity/activation
// per Table 2b (§3.3) — B4/B5/B6 showed no consistent or only weak/exploratory effects.
const SIGNIFICANT_BLOCKS = new Set<string>([
  "b1_akses_pasar",
  "b2_perbankan",
  "b3_infrastruktur_pertanian",
  "b7_kesehatan",
]);

const NON_SIGNIFICANT_LABELS: Record<string, string> = {
  b4_konektivitas_fisik: "tidak bertahan",
  b5_konektivitas_digital: "tidak signifikan",
  b6_modal_manusia: "belum dapat dijelaskan",
};

function BlockBar({ value, muted }: { value: number; muted: boolean }) {
  const clamped = Math.max(-3, Math.min(3, value));
  const pct = ((clamped + 3) / 6) * 100;
  return (
    <div style={{ position: "relative", height: 6, background: "var(--gridline)", borderRadius: 3 }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: 1,
          background: "var(--baseline)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: value >= 0 ? "50%" : `${pct}%`,
          right: value >= 0 ? `${100 - pct}%` : "50%",
          top: 0,
          bottom: 0,
          background: muted ? "var(--text-muted)" : value >= 0 ? "var(--good)" : "var(--critical)",
          opacity: muted ? 0.5 : 1,
          borderRadius: 3,
        }}
      />
    </div>
  );
}

export function VillageDetail({ village, onClose }: Props) {
  if (!village) return null;
  const v = village;
  const diagnosisBlocks = v.kelompok ? KELOMPOK_BLOCKS[v.kelompok] : [];

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 20 }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 100vw)",
          background: "var(--surface-3)",
          borderLeft: "1px solid var(--border)",
          zIndex: 21,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Lokasi</div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{v.nama_desa}</h2>
            <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 13 }}>
              {v.kecamatan}, {v.kabupaten_kota}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 20,
              cursor: "pointer",
              color: "var(--text-muted)",
              lineHeight: 1,
            }}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {!v.in_scope ? (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "var(--surface-2)",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            {v.excluded_reason === "urban"
              ? "Desa/kelurahan ini berada di luar populasi analitis karena termasuk wilayah administratif kota (Kota Kendari atau Kota Bau Bau), yang secara struktural bukan sasaran kebijakan intervensi desa pertanian."
              : "Desa ini berada di luar populasi analitis karena tidak teridentifikasi memiliki lahan pertanian (ESA WorldCover), sehingga produktivitas pertanian tidak dapat diukur pada desa ini."}
          </div>
        ) : (
          <>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Profil</div>
              <div style={{ fontWeight: 600 }}>{PROFIL_SHORT[v.profil as Profil]}</div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>z_NDVI</div>
                <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 600 }}>
                  {v.z_ndvi?.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>z_NTL</div>
                <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 600 }}>
                  {v.z_ntl?.toFixed(2)}
                </div>
              </div>
            </div>

            {v.profil_code === 1 && (
              <>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                    Diagnosis Kelembagaan
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                    Blok konsisten pada {v.kelompok}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    {diagnosisBlocks.map((key) => (
                      <li key={key}>{BLOCK_LABELS[key]}</li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--surface-2)",
                    border: `1px solid ${v.no_binding_constraint ? "var(--warning)" : "var(--series-1)"}`,
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Kendala Utama</div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: v.no_binding_constraint ? "var(--text-primary)" : "var(--series-1)",
                    }}
                  >
                    {v.kendala_utama_label}
                  </div>
                  {v.no_binding_constraint && (
                    <div style={{ fontSize: 12, color: "var(--warning)", marginTop: 4 }}>
                      Tidak ada kendala mengikat pada blok tervalidasi
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>Kerangka Prioritas</div>
                  <Row label="Prioritas" value={v.jenjang_prioritas} />
                  <Row label="Besaran Kendala" value={v.severity?.toFixed(2)} />
                  {v.lever && <Row label="Intervensi" value={v.lever} />}
                  {v.kendala_utama && OPD_BY_BLOCK[v.kendala_utama] && (
                    <Row label="Koordinasi" value={OPD_BY_BLOCK[v.kendala_utama]} />
                  )}
                  {v.note && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                        Catatan tambahan (tidak memengaruhi prioritas)
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                        {v.note}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                Profil Skor Kelembagaan
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {BLOCK_KEYS.map((key) => {
                  const value = v[key];
                  if (value === null) return null;
                  const significant = SIGNIFICANT_BLOCKS.has(key);
                  const isBinding = v.kendala_utama && key.startsWith(v.kendala_utama.toLowerCase());
                  return (
                    <div key={key}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: isBinding
                            ? "var(--text-primary)"
                            : significant
                              ? "var(--text-secondary)"
                              : "var(--text-muted)",
                          fontWeight: isBinding ? 700 : 400,
                        }}
                      >
                        <span>
                          {BLOCK_LABELS[key]}
                          {isBinding && " · kendala utama"}
                          {!significant && ` · ${NON_SIGNIFICANT_LABELS[key]}`}
                        </span>
                        <span className="tabular-nums">{value.toFixed(2)}</span>
                      </div>
                      <BlockBar value={value} muted={!significant} />
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                Catatan: Blok abu-abu tidak digunakan dalam penentuan kendala utama.
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, gap: 12 }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ textAlign: "right", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
