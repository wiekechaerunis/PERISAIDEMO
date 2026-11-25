// Filter "Periode kejadian" di panel Filter daftar Insiden/Kerawanan. Logika murni: tidak membaca jam browser.
// Semua waktu disimpan sebagai ISO lokal tanpa zona (dianggap WIB), jadi perbandingan cukup pada bagian tanggal `YYYY-MM-DD`:
// batas inklusif 00:00 hari pertama s.d. 23:59 hari terakhir. "Hari ini" selalu dari demoNow() (dioper oleh pemanggil).
// ASSUMPTION (DEVIATIONS D-P1..): board Main-Filter tidak punya dropdown Periode terbuka; pilihan dan rentang mengikuti spek tugas.
import { KERAWANAN_BOARD, KERAWANAN_DETAIL } from '@/services/mock/seedExtra';
import type { Kerawanan } from '@/services/types';

export type PeriodPreset = 'all' | '7h' | '30h' | '90h' | 'bulan' | '3b' | 'tahun';
export type PeriodChoice = PeriodPreset | 'custom';
/** Periode yang diterapkan (sumbernya URL). Rentang khusus memakai tanggal ISO `YYYY-MM-DD`. */
export type Period = { kind: 'preset'; preset: PeriodPreset } | { kind: 'custom'; from: string; to: string };
/** Isian panel sebelum ditekan Tampilkan. */
export interface PeriodDraft {
  choice: PeriodChoice;
  from: string;
  to: string;
}
export interface DateRange {
  from: string;
  to: string;
}

export const ALL_TIME: Period = { kind: 'preset', preset: 'all' };

/** Urutan pilihan dropdown. */
export const PERIOD_CHOICES: { key: PeriodChoice; label: string }[] = [
  { key: 'all', label: 'Semua waktu' },
  { key: '7h', label: '7 hari terakhir' },
  { key: '30h', label: '30 hari terakhir' },
  { key: 'bulan', label: 'Bulan ini' },
  { key: '3b', label: '3 bulan terakhir' },
  { key: 'tahun', label: 'Tahun berjalan' },
  { key: 'custom', label: 'Rentang khusus' },
];
/**
 * Chip Periode kejadian di panel Filter daftar Insiden (board Main-Filter): 7/30/90 hari, Tahun ini, Rentang tanggal. Tanpa chip aktif =
 * Semua waktu. Preset lama (Bulan ini, 3 bulan terakhir) tetap dibaca dari URL dan dipakai dashboard, tetapi tidak ditawarkan di daftar.
 */
export const LIST_PERIOD_CHIPS: { key: PeriodChoice; label: string }[] = [
  { key: '7h', label: '7 hari terakhir' },
  { key: '30h', label: '30 hari terakhir' },
  { key: '90h', label: '90 hari terakhir' },
  { key: 'tahun', label: 'Tahun ini' },
  { key: 'custom', label: 'Rentang tanggal' },
];
export const choiceLabel = (c: PeriodChoice) => (PERIOD_CHOICES.find((x) => x.key === c) ?? LIST_PERIOD_CHIPS.find((x) => x.key === c))!.label;
/** Label periode di daftar Insiden: memakai nama chip Main-Filter bila ada ("Tahun ini"), selain itu label umum. */
export const listPeriodLabel = (p: Period): string =>
  p.kind === 'custom' ? rangeCaption(p) : (LIST_PERIOD_CHIPS.find((x) => x.key === p.preset)?.label ?? choiceLabel(p.preset));

/** Nilai `?periode=` per preset. */
const URL_KEY: Record<Exclude<PeriodPreset, 'all'>, string> = { '7h': '7h', '30h': '30h', '90h': '90h', bulan: 'bulan', '3b': '3b', tahun: 'tahun' };

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const parts = (s: string): [number, number, number] => s.slice(0, 10).split('-').map(Number) as [number, number, number];
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Tanggal ISO valid `YYYY-MM-DD` (bukan 2026-02-31). */
export function isIsoDate(s: string | null | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = parts(s);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysIn(y, m);
}

/** Geser tanggal sebanyak `n` hari (aritmetika UTC atas tanggal WIB, jadi tidak terpengaruh zona waktu mesin). */
function addDays(s: string, n: number): string {
  const [y, m, d] = parts(s);
  const t = new Date(Date.UTC(y, m - 1, d) + n * 86_400_000);
  return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Mundur `n` bulan; tanggal dipotong ke akhir bulan bila perlu (31 Mei − 3 bulan = 28/29 Feb). */
function subMonths(s: string, n: number): string {
  const [y, m, d] = parts(s);
  const t = y * 12 + (m - 1) - n;
  const ny = Math.floor(t / 12);
  const nm = (t % 12) + 1;
  return ymd(ny, nm, Math.min(d, daysIn(ny, nm)));
}

/**
 * Rentang tanggal inklusif untuk preset, relatif terhadap `now` (ISO WIB dari demoNow()). `null` = Semua waktu (tanpa batas).
 * "N hari terakhir" = hari ini mundur N hari s.d. hari ini (30 hari pada 28 Okt → 28 Sep–28 Okt, sesuai contoh caption di spek).
 */
export function periodRange(preset: PeriodPreset, now: string): DateRange | null {
  const today = now.slice(0, 10);
  const [y, m] = parts(today);
  switch (preset) {
    case 'all':
      return null;
    case '7h':
      return { from: addDays(today, -7), to: today };
    case '30h':
      return { from: addDays(today, -30), to: today };
    case '90h':
      return { from: addDays(today, -90), to: today };
    case 'bulan':
      return { from: ymd(y, m, 1), to: today };
    case '3b':
      return { from: subMonths(today, 3), to: today };
    case 'tahun':
      return { from: ymd(y, 1, 1), to: today };
  }
}

/** Rentang untuk periode yang diterapkan. */
export const rangeOf = (p: Period, now: string): DateRange | null => (p.kind === 'custom' ? { from: p.from, to: p.to } : periodRange(p.preset, now));

/** Waktu kejadian (ISO WIB) berada di rentang, inklusif kedua ujung. */
export const inRange = (iso: string, r: DateRange | null): boolean => {
  if (!r) return true;
  const d = iso.slice(0, 10);
  return d >= r.from && d <= r.to;
};

/** Pesan galat rentang khusus, atau null bila valid. Isian yang belum lengkap bukan galat (lihat `draftToPeriod`). */
export function validateCustomRange(from: string, to: string, today: string): string | null {
  const t = today.slice(0, 10);
  if ((from && from > t) || (to && to > t)) return 'Tanggal tidak boleh melewati hari ini.';
  if (from && to && to < from) return 'Tanggal akhir tidak boleh sebelum tanggal awal.';
  return null;
}

/** Ubah isian panel menjadi periode yang bisa diterapkan; null bila rentang khusus belum lengkap atau tidak valid. */
export function draftToPeriod(d: PeriodDraft, today: string): Period | null {
  if (d.choice !== 'custom') return { kind: 'preset', preset: d.choice };
  if (!isIsoDate(d.from) || !isIsoDate(d.to) || validateCustomRange(d.from, d.to, today)) return null;
  return { kind: 'custom', from: d.from, to: d.to };
}
export const periodToDraft = (p: Period): PeriodDraft =>
  p.kind === 'custom' ? { choice: 'custom', from: p.from, to: p.to } : { choice: p.preset, from: '', to: '' };

/** "28 Sep – 28 Okt 2026", "1–15 Okt 2026", "15 Okt 2026", "28 Des 2025 – 5 Jan 2026". */
export function rangeCaption(r: DateRange): string {
  const [fy, fm, fd] = parts(r.from);
  const [ty, tm, td] = parts(r.to);
  if (r.from === r.to) return `${td} ${BULAN[tm - 1]} ${ty}`;
  if (fy !== ty) return `${fd} ${BULAN[fm - 1]} ${fy} – ${td} ${BULAN[tm - 1]} ${ty}`;
  if (fm !== tm) return `${fd} ${BULAN[fm - 1]} – ${td} ${BULAN[tm - 1]} ${ty}`;
  return `${fd}–${td} ${BULAN[tm - 1]} ${ty}`;
}

/** Teks chip: "30 hari terakhir" atau rentang khusus "1–15 Okt 2026". */
export const periodLabel = (p: Period): string => (p.kind === 'custom' ? rangeCaption(p) : choiceLabel(p.preset));
export const isAllTime = (p: Period) => p.kind === 'preset' && p.preset === 'all';

/** Baca periode dari URL. Nilai tidak valid (preset tak dikenal, tanggal rusak, terbalik, melewati hari ini) diabaikan → Semua waktu. */
export function parsePeriod(params: URLSearchParams, today: string): Period {
  const pr = params.get('periode');
  const preset = (Object.keys(URL_KEY) as (keyof typeof URL_KEY)[]).find((k) => URL_KEY[k] === pr);
  if (preset) return { kind: 'preset', preset };
  const from = params.get('dari');
  const to = params.get('sampai');
  if (isIsoDate(from) && isIsoDate(to) && !validateCustomRange(from, to, today)) return { kind: 'custom', from, to };
  return ALL_TIME;
}

/** Salin `params` dengan periode baru (Semua waktu menghapus parameternya). Parameter lain (mis. `tab`) dipertahankan. */
export function withPeriod(params: URLSearchParams, p: Period): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete('periode');
  next.delete('dari');
  next.delete('sampai');
  if (p.kind === 'custom') {
    next.set('dari', p.from);
    next.set('sampai', p.to);
  } else if (p.preset !== 'all') next.set('periode', URL_KEY[p.preset]);
  return next;
}

const MON: Record<string, number> = Object.fromEntries(BULAN.map((b, i) => [b, i + 1]));
/** "18 Nov 2026, 07:20" → "2026-11-18T07:20:00"; null bila tidak terbaca. */
function parseBoardWhen(s: string): string | null {
  const m = /^(\d{1,2}) (\w{3}) (\d{4}), (\d{2}):(\d{2})$/.exec(s);
  if (!m || !MON[m[2]]) return null;
  return `${m[3]}-${pad(MON[m[2]])}-${pad(Number(m[1]))}T${m[4]}:${m[5]}:00`;
}

/**
 * Waktu kejadian kerawanan yang dipakai filter = waktu yang tampil di kolom "Waktu diketahui" (overlay board Kerawanan bila ada),
 * supaya hasil saring selalu cocok dengan tanggal yang dilihat pengguna.
 */
export function kerawananWhen(k: Kerawanan): string {
  const b = KERAWANAN_BOARD[k.no];
  return KERAWANAN_DETAIL[k.no]?.observedAt ?? (b ? parseBoardWhen(b.when) : null) ?? k.observedAt;
}
