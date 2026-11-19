// "Rapikan dengan AI" (INS-04 FR-INS-72, 73) di layanan AI mock: merapikan ejaan dan kapitalisasi tanpa mengubah fakta.
// Pemeriksa fakta membandingkan angka, tanggal, jam, dan nama antara tulisan asli dan usulan; bila berbeda, usulan tidak ditampilkan (R6).

/** Panjang minimal tulisan agar bisa dirapikan (parameter; di produksi dari konfigurasi). */
export const MIN_TIDY = 20;

const MONTHS: Record<string, string> = { jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', mei: 'Mei', jun: 'Jun', jul: 'Jul', agu: 'Agu', sep: 'Sep', okt: 'Okt', nov: 'Nov', des: 'Des' };

const sentence = (t: string) => {
  const x = t.trim();
  return x ? x.charAt(0).toUpperCase() + x.slice(1) + (/[.!?]$/.test(x) ? '' : '.') : '';
};

/** Aturan rapikan sederhana (mock): ejaan umum, satuan, bulan, kapitalisasi, tanda baca. */
function tidy(text: string): string {
  let t = text.replace(/\s+/g, ' ').trim();
  // contoh yang sengaja salah: usulan mengubah angka (memicu R6 pada pemeriksa fakta)
  if (/cuma 1,5 m/i.test(t)) return 'Pagar sisi panel hanya setinggi 1,2 m.';
  t = t
    .replace(/(\d)\s?m\b/gi, '$1 m')
    .replace(/,\s*pompa nyala lg\b/gi, ' dan pompa menyala lagi pada')
    .replace(/\bnyala lg\b/gi, 'menyala lagi pada')
    .replace(/\bjam (\d)/gi, 'pukul $1')
    .replace(/\budh lapor polisi\b/gi, 'Laporan polisi sudah dibuat')
    .replace(/\bganti yg anti potong\b/gi, 'diganti dengan tipe anti potong')
    .replace(/\b(dkernakain|dikernakan|dikarnakan|dikarenakan|krn|karna|karnaa)\b/gi, 'karena')
    .replace(/\btdk\b/gi, 'tidak')
    .replace(/\bdgn\b/gi, 'dengan')
    .replace(/\butk\b/gi, 'untuk')
    .replace(/\bsdh\b/gi, 'sudah')
    .replace(/\bblm\b/gi, 'belum')
    .replace(/\bspt\b/gi, 'seperti')
    .replace(/\byg\b/gi, 'yang')
    .replace(/\budh\b/gi, 'sudah')
    .replace(/\blg\b/gi, 'lagi')
    .replace(/\bgak\b/gi, 'tidak')
    .replace(/\b(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)\b/gi, (m) => MONTHS[m.toLowerCase()]);
  return t.split(/(?<=[.!?])\s+/).map((p) => sentence(p.replace(/,\s*(\w)/, (m, c) => (/^(dan|dengan)$/.test(c) ? m : m)))).join(' ');
}

/** Token fakta: angka (termasuk desimal, jam, tanggal) dan kata berhuruf kapital di tengah kalimat (nama, lokasi). */
export function factTokens(text: string): { nums: string[]; names: string[] } {
  const nums = (text.match(/\d+(?:[.,:]\d+)*/g) ?? []).map((n) => n.replace(/\.$/, ''));
  const names = [...text.matchAll(/(?<=[a-zA-Z0-9,]\s)([A-Z][a-zA-Z0-9-]+)/g)].map((m) => m[1].toLowerCase()).filter((n) => !(n in MONTHS));
  return { nums: nums.sort(), names: [...new Set(names)].sort() };
}

/** Fakta sama bila semua angka identik dan semua nama/lokasi di tulisan asli masih ada di usulan. */
export function sameFacts(original: string, suggestion: string): boolean {
  const a = factTokens(original);
  const b = factTokens(suggestion);
  if (a.nums.join('|') !== b.nums.join('|')) return false;
  const low = suggestion.toLowerCase();
  return a.names.every((n) => low.includes(n));
}

export interface TidyResult {
  /** usulan tulisan rapi; kosong bila tidak ditampilkan */
  suggestion: string;
  /** false bila angka, tanggal, waktu, nama, atau lokasi berubah (R6) */
  ok: boolean;
}

export function rapikan(text: string): TidyResult {
  const s = tidy(text);
  return sameFacts(text, s) ? { suggestion: s, ok: true } : { suggestion: '', ok: false };
}
