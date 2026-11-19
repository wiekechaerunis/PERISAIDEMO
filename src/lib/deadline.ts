import type { Severity } from './severity';
import { addWorkingDays, workingDaysBetween } from './workdays';
import { demoNow } from '@/services/mock/clock';

export type DeadlineConfig = Record<Severity, number>;

/** Tenggat penanganan = waktu registrasi + N hari kerja WIB (Konfigurasi › Tenggat penanganan). */
export function handlingDeadline(registeredIso: string, sev: Severity, cfg: DeadlineConfig): string {
  return addWorkingDays(registeredIso, cfg[sev]);
}

/** Jumlah hari kerja tenggat insiden: nilai yang dipakai saat Setujui (`handleDays`), atau dihitung dari registrasi bila data seed tanpa nilai. */
export function handleDaysOf(i: { handleDays?: number; handleDueAt?: string }, registeredIso: string): number {
  if (i.handleDays != null) return i.handleDays;
  return i.handleDueAt ? Math.max(1, workingDaysBetween(registeredIso, i.handleDueAt)) : 0;
}

const H = 3_600_000;
/**
 * Satu fungsi "sisa/lewat" untuk semua layar (B5). Kurang dari 24 jam: jam. Selebihnya: hari kerja penuh
 * (selisih hari kerja dikurangi satu bila jam tenggat lebih awal dari jam sekarang). Jam acuan: jam demo.
 */
export function remainingLabel(dueAt: string, now: string = demoNow()): { late: boolean; text: string } {
  const due = new Date(dueAt.slice(0, 19) + 'Z').getTime();
  const cur = new Date(now.slice(0, 19) + 'Z').getTime();
  const diff = due - cur;
  const late = diff < 0;
  const hours = Math.abs(diff) / H;
  if (hours < 24) return { late, text: `${late ? 'lewat' : 'sisa'} ${Math.max(1, late ? Math.floor(hours) : Math.ceil(hours))} jam` };
  const [a, b] = late ? [dueAt, now] : [now, dueAt];
  let n = workingDaysBetween(a, b);
  if (b.slice(11, 16) < a.slice(11, 16)) n -= 1;
  n = Math.max(1, n);
  return { late, text: `${late ? 'lewat' : 'sisa'} ${n} hari` };
}
