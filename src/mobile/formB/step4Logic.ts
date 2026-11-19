// Logika murni ringkasan mobile. Salinan dari ReportStep4Page (fungsinya tidak diekspor di sana).
import type { CasualtyKind } from '@/lib/severity';
import { formatRupiah } from '@/lib/format';
import type { Axis, ReportDraft } from '@/features/insiden/logic/draft';
import { STEP_ROUTES } from '@/features/insiden/logic/steps';

export const AXIS_LABEL: Record<Axis, string> = {
  prop: 'Properti atau operasi',
  man: 'Manusia',
  ling: 'Lingkungan pengamanan',
  data: 'Data dan informasi',
};
export const AXIS_ORDER: Axis[] = ['prop', 'man', 'ling', 'data'];
const CASUALTY_LABEL: Record<CasualtyKind, string> = {
  p3k: 'Luka ringan (P3K)',
  klinik: 'Dibawa ke klinik atau rumah sakit',
  berat: 'Luka berat atau cacat',
  meninggal: 'Meninggal dunia',
  belum: 'Belum diketahui',
};
export const HANDLED_LABEL = { belum: 'Belum ada', int: 'Security internal', bujp: 'BUJP', tni: 'TNI', polri: 'Polri' } as const;

export interface Missing {
  label: string;
  to: string;
  msg?: string;
}

/** Isian wajib yang belum lengkap (board S01 / MS01). */
export function missingOf(d: ReportDraft): Missing[] {
  const m: Missing[] = [];
  if (!d.title.trim()) m.push({ label: 'Judul', to: STEP_ROUTES.temuan });
  if (!d.date || !d.time) m.push({ label: 'Waktu kejadian', to: STEP_ROUTES.temuan });
  if (!d.locationName.trim()) m.push({ label: 'Lokasi kejadian', to: STEP_ROUTES.temuan });
  if (!d.category) m.push({ label: 'Kategori', to: STEP_ROUTES.temuan });
  if (!d.securityImpact.trim()) m.push({ label: 'Dampak keamanan', to: STEP_ROUTES.kejadian });
  if (d.axes.length === 0) m.push({ label: 'Apa saja yang terdampak', to: STEP_ROUTES.kejadian });
  if (d.axes.includes('prop') && !d.ops) m.push({ label: 'Kondisi operasi', to: STEP_ROUTES.kejadian });
  if (d.axes.includes('prop') && d.ops === 'berhenti' && !d.opsHours && !d.ongoing) {
    m.push({ label: 'Lama operasi berhenti', to: STEP_ROUTES.kejadian, msg: 'Isi berapa jam operasi berhenti.' });
  }
  return m;
}

/** "Berhenti 6 jam" / "Terganggu 2 jam" / "Tidak terdampak" (board M7). */
export function opsText(d: ReportDraft): string {
  if (!d.axes.includes('prop') || !d.ops) return 'Tidak terdampak';
  const h = d.opsHours ? ` ${d.opsHours} jam` : d.ongoing ? ' (masih berlangsung)' : '';
  if (d.ops === 'berhenti') return `Berhenti${h}`;
  if (d.ops === 'sebagian') return `Terganggu${h}`;
  return 'Tidak terganggu';
}
export function casualtyText(d: ReportDraft): string {
  const entries = d.axes.includes('man') ? (Object.entries(d.casualties) as [CasualtyKind, number][]) : [];
  if (entries.length === 0) return 'Tidak terdampak';
  return entries.map(([k, n]) => (k === 'belum' ? CASUALTY_LABEL[k] : `${CASUALTY_LABEL[k]}: ${n}`)).join(', ');
}

/** "Rp18,5 jt" (board M7/M8); di bawah sejuta tetap angka penuh. */
export function rupiahShort(n: number): string {
  const fmt = (v: number) => v.toFixed(1).replace(/\.0$/, '').replace('.', ',');
  if (n >= 1_000_000_000) return `Rp${fmt(n / 1_000_000_000)} M`;
  if (n >= 1_000_000) return `Rp${fmt(n / 1_000_000)} jt`;
  return formatRupiah(n);
}
