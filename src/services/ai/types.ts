import type { CasualtyKind, OpsImpact } from '@/lib/severity';

export type Confidence = 'hi' | 'md';
export type ImpactAxisKey = 'prop' | 'man' | 'ling' | 'data';
export type HandledBy = 'belum' | 'int' | 'bujp' | 'tni' | 'polri';

/** Satu hasil ekstraksi field beserta kutipan sumber dari cerita. */
export interface Found<T> {
  value: T;
  /** potongan cerita yang jadi dasar ("dari cerita: …") */
  src: string;
  confidence: Confidence;
}

/** Hasil membaca cerita pelapor. Hanya menyarankan; yang masuk ke form hanya saran yang di-Pakai. */
export interface Extraction {
  kind: Found<'insiden' | 'kerawanan'> | null;
  time: Found<{ date: string; time: string }> | null;
  title: Found<string> | null;
  patokan: Found<string> | null;
  category: Found<string> | null;
  securityImpact: Found<string> | null;
  ops: Found<{ state: OpsImpact; hours: number | null }> | null;
  casualty: Found<{ kind: CasualtyKind | 'none'; count: number }> | null;
  lossIdr: Found<number> | null;
  handledBy: Found<HandledBy> | null;
  /** sumbu yang terdampak (Properti/operasi, Manusia, Lingkungan pengamanan, Data dan informasi) */
  axes: Found<ImpactAxisKey[]> | null;
  /** ringkasan kronologi (1–2 kalimat dari cerita) */
  chronology: Found<string> | null;
  /** tindakan awal yang sudah dilakukan (mis. P3K, dibawa ke klinik) */
  initialAction: Found<string> | null;
  /** nama lokasi terdeteksi (mis. "Sumur ADR-07"), dipakai untuk pertanyaan titik lokasi */
  locationName: string | null;
  /** blok/WK yang disebut di cerita (mis. "Blok Rokan"), dibandingkan dengan WK dari titik peta */
  locationMention: string | null;
  /** kecelakaan kerja/K3 tanpa unsur keamanan: kategori K3 belum pasti masuk PERISAI */
  k3: boolean;
}

export interface AiService {
  /** Baca cerita dan kembalikan saran isian. Melempar bila layanan tidak tersedia. */
  extract(story: string, opts?: { now?: string }): Promise<Extraction>;
  /** Balasan untuk pertanyaan di luar cakupan (pola board I12o). */
  isOutOfScope(message: string): boolean;
}
