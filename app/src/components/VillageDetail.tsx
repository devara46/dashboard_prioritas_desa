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

function BlockBar({ value }: { value: number }) {
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
          background: value >= 0 ? "var(--good)" : "var(--critical)",
          borderRadius: 3,
        }}
      />
    </div>
  );
}

export function VillageDetail({ village, onClose }: Props) {
  if (!village) return null;
  const v = village;

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
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Profil Perkembangan</div>
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

            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                Skor Blok Institusional (B1–B7)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {BLOCK_KEYS.map((key) => {
                  const value = v[key];
                  if (value === null) return null;
                  const isBinding = v.kendala_utama && key.startsWith(v.kendala_utama.toLowerCase());
                  return (
                    <div key={key}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: isBinding ? "var(--text-primary)" : "var(--text-secondary)",
                          fontWeight: isBinding ? 700 : 400,
                        }}
                      >
                        <span>
                          {BLOCK_LABELS[key]}
                          {isBinding && " · kendala utama"}
                        </span>
                        <span className="tabular-nums">{value.toFixed(2)}</span>
                      </div>
                      <BlockBar value={value} />
                    </div>
                  );
                })}
              </div>
            </div>

            {v.profil_code === 1 && (
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
                {v.no_binding_constraint ? (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Tidak ada kendala di bawah rata-rata provinsi pada keempat blok tervalidasi
                    (B1/B2/B3/B7) — desa ini tidak memiliki kendala utama yang dapat ditindaklanjuti
                    melalui kerangka prioritas, sehingga tidak diberi jenjang prioritas.
                  </div>
                ) : (
                  <>
                    <Row label="Kelompok" value={v.kelompok} />
                    <Row label="Kendala Utama" value={v.kendala_utama_label} />
                    <Row label="Jenjang Prioritas" value={v.jenjang_prioritas} />
                    <Row label="Besaran Kendala (severity)" value={v.severity?.toFixed(2)} />
                    {v.lever && <Row label="Intervensi" value={v.lever} />}
                    {v.kendala_utama && OPD_BY_BLOCK[v.kendala_utama] && (
                      <Row label="Koordinasi OPD" value={OPD_BY_BLOCK[v.kendala_utama]} />
                    )}
                    {v.note && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                        Catatan: {v.note}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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
