// Tanya data (board Dashboard-Tanya*): pengenal jenis pertanyaan berbasis kata kunci, tanpa AI.
// Jenis: kritis (daftar insiden per level), kkks (peringkat), banding (perbandingan bulan), telat (lewat tenggat),
// selain itu tidakpaham. Kolom kosong = saran.
export type AskKind = 'saran' | 'kritis' | 'kkks' | 'banding' | 'telat' | 'tidakpaham';

const MONTH = /(jan|feb|mar|apr|mei|jun|jul|agu|agt|sep|okt|nov|des)/;

export function askKind(q: string): AskKind {
  const t = q.toLowerCase().trim();
  if (!t) return 'saran';
  if (/tenggat|terlambat|telat|lewat batas/.test(t)) return 'telat';
  if ((/\bvs\.?\b|banding|dibanding|versus/.test(t)) && MONTH.test(t)) return 'banding';
  if (/\b(kkks|wk)\b|wilayah kerja|perusahaan|operator/.test(t) && /kerugian|insiden|terbesar|terbanyak|paling/.test(t)) return 'kkks';
  if (/kritis|tinggi/.test(t)) return 'kritis';
  return 'tidakpaham';
}
