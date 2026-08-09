export type ExcludedReason = "urban" | "no_agriculture" | null;

export type Profil =
  | "Produktivitas Tinggi, Aktivasi Rendah"
  | "Produktivitas Tinggi, Aktivasi Tinggi"
  | "Produktivitas Rendah, Aktivasi Rendah"
  | "Produktivitas Rendah, Aktivasi Tinggi";

export type Kelompok = "Kelompok 1" | "Kelompok 2" | null;
export type KendalaUtama = "B1" | "B2" | "B3" | "B7" | null;
export type JenjangPrioritas =
  | "Prioritas I"
  | "Prioritas II"
  | "Prioritas III"
  | "Investasi Infrastruktur"
  | null;

export interface VillageRecord {
  iddesa: string;
  nama_desa: string | null;
  kecamatan: string | null;
  kabupaten_kota: string | null;
  has_geometry: boolean;

  in_scope: boolean;
  excluded_reason: ExcludedReason;
  excluded_ndvi_model: boolean;
  excluded_ntl_model: boolean;

  ndvi_raw: number | null;
  z_ndvi: number | null;
  ntl_raw: number | null;
  z_ntl: number | null;
  luas_m2: number | null;

  b1_akses_pasar: number | null;
  b2_perbankan: number | null;
  b3_infrastruktur_pertanian: number | null;
  b4_konektivitas_fisik: number | null;
  b5_konektivitas_digital: number | null;
  b6_modal_manusia: number | null;
  b7_kesehatan: number | null;

  profil_code: 1 | 2 | 3 | 4 | null;
  profil: Profil | null;

  no_binding_constraint: boolean;
  kelompok: Kelompok;
  kendala_utama: KendalaUtama;
  kendala_utama_label: string | null;
  lever: string | null;
  note: string | null;
  besaran_kendala: number | null;
  severity: number | null;
  jenjang_prioritas: JenjangPrioritas;
}

export const PROFIL_ORDER: Profil[] = [
  "Produktivitas Tinggi, Aktivasi Rendah",
  "Produktivitas Tinggi, Aktivasi Tinggi",
  "Produktivitas Rendah, Aktivasi Rendah",
  "Produktivitas Rendah, Aktivasi Tinggi",
];

// Full "Produktivitas X, Aktivasi Y" form kept intentionally — a bare "Tinggi–Rendah"
// doesn't say which axis is which, which is exactly what surfaced as a real point of
// confusion, so every label spells out both axis names rather than abbreviating them.
export const PROFIL_SHORT: Record<Profil, string> = {
  "Produktivitas Tinggi, Aktivasi Rendah": "Produktivitas Tinggi, Aktivasi Rendah (Q1)",
  "Produktivitas Tinggi, Aktivasi Tinggi": "Produktivitas Tinggi, Aktivasi Tinggi",
  "Produktivitas Rendah, Aktivasi Rendah": "Produktivitas Rendah, Aktivasi Rendah",
  "Produktivitas Rendah, Aktivasi Tinggi": "Produktivitas Rendah, Aktivasi Tinggi",
};

export const BLOCK_LABELS: Record<string, string> = {
  b1_akses_pasar: "B1 · Akses Pasar",
  b2_perbankan: "B2 · Perbankan",
  b3_infrastruktur_pertanian: "B3 · Infrastruktur Pertanian",
  b4_konektivitas_fisik: "B4 · Konektivitas Fisik",
  b5_konektivitas_digital: "B5 · Konektivitas Digital",
  b6_modal_manusia: "B6 · Modal Manusia",
  b7_kesehatan: "B7 · Kesehatan",
};

export const OPD_BY_BLOCK: Record<string, string> = {
  B1: "Dinas Perdagangan",
  B2: "Dinas Koperasi & UKM / OJK daerah",
  B3: "Dinas Pekerjaan Umum dan Sumber Daya Air",
  B7: "Dinas Kesehatan",
};
