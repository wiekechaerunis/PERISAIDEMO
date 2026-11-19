// Perubahan Konfigurasi Modul Insiden: Tenggat penanganan dan Matriks keparahan (CFG-Tenggat, CFG-MatriksKeparahan).
// Fungsi murni: menerima ModuleConfig, mengembalikan ModuleConfig baru (termasuk entri riwayat) atau galat per kolom.
import type { ConfigChange, ModuleConfig } from '../types';
import { SEVERITIES, SEV_LABEL, type LossThresholds, type Severity } from '@/lib/severity';
import type { Role } from '@/lib/rbac';
import { formatNumber } from '@/lib/format';

/** Waktu simpan di demo (board CFG-Tenggat: 18 Nov 2026, 14:10 WIB), supaya riwayat stabil. */
export const CFG_NOW = '2026-11-18T14:10:00';

export interface ConfigActor {
  name: string;
  role: Role;
  roleLabel: string;
}

export type ConfigResult =
  | { ok: true; config: ModuleConfig; changed: number; version?: number }
  | { ok: false; reason: string; errors: Record<string, string> };

export const canEditConfig = (r: Role) => r === 'admin';

export const ERR_DAYS = 'Isi bilangan bulat, minimal 1 hari.';
export const ERR_USD = 'Isi bilangan bulat, minimal USD 1.';
export const ERR_FORBIDDEN = 'Hanya Admin SKK yang bisa mengubah konfigurasi.';
export const ERR_NO_CHANGE = 'Tidak ada perubahan untuk disimpan.';
export const ERR_DATE = 'Isi tanggal mulai berlaku.';
export const ERR_DATE_PAST = 'Minimal besok.';
export const ERR_BASIS = 'Dasar perubahan wajib diisi.';

const fail = (reason: string, errors: Record<string, string> = {}): ConfigResult => ({ ok: false, reason, errors });

/** Bilangan bulat >= 1; teks boleh memakai pemisah ribuan titik atau spasi bila `grouping`. */
export function parseWhole(v: number | string, grouping = false): number | null {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 1 ? v : null;
  const t = grouping ? v.trim().replace(/[.\s]/g, '') : v.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isSafeInteger(n) && n >= 1 ? n : null;
}

const history = (c: ModuleConfig) => c.history ?? [];
const withHistory = (c: ModuleConfig, e: ConfigChange): ConfigChange[] => [e, ...history(c)];

export type DeadlineInput = Record<Severity, number | string>;

/** Ubah tenggat penanganan (hari kerja sejak registrasi) per keparahan. Berlaku untuk insiden yang disetujui sesudahnya. */
export function updateDeadlines(c: ModuleConfig, input: DeadlineInput, actor: ConfigActor, at: string = CFG_NOW): ConfigResult {
  if (!canEditConfig(actor.role)) return fail(ERR_FORBIDDEN);
  const errors: Record<string, string> = {};
  const next = { ...c.deadlines };
  for (const s of SEVERITIES) {
    const n = parseWhole(input[s]);
    if (n === null) errors[s] = ERR_DAYS;
    else next[s] = n;
  }
  if (Object.keys(errors).length) return fail(ERR_DAYS, errors);
  const diffs = [...SEVERITIES].reverse().filter((s) => next[s] !== c.deadlines[s]);
  if (!diffs.length) return fail(ERR_NO_CHANGE);
  const text = diffs.map((s) => `${SEV_LABEL[s]} ${c.deadlines[s]} → ${next[s]}`).join(', ') + ' hari kerja';
  const entry: ConfigChange = { key: 'tenggat', at, by: actor.name, role: actor.roleLabel, text };
  return { ok: true, config: { ...c, deadlines: next, history: withHistory(c, entry) }, changed: diffs.length };
}

export interface LossInput {
  rendah: number | string;
  sedang: number | string;
  tinggi: number | string;
  kritis: number | string;
  /** YYYY-MM-DD */
  effectiveFrom: string;
  basis: string;
}
export const LOSS_LEVELS = ['rendah', 'sedang', 'tinggi', 'kritis'] as const;

/** Versi matriks saat ini (nomor terbesar di riwayat; minimal 1). */
export const matrixVersion = (c: ModuleConfig) =>
  history(c).reduce((m, h) => (h.key === 'matriks' && h.version ? Math.max(m, h.version) : m), 1);

/** Buat versi baru matriks keparahan: ambang USD naik monoton, tanggal mulai minimal besok, dasar perubahan wajib. */
export function updateLossThresholds(c: ModuleConfig, input: LossInput, actor: ConfigActor, at: string = CFG_NOW): ConfigResult {
  if (!canEditConfig(actor.role)) return fail(ERR_FORBIDDEN);
  const errors: Record<string, string> = {};
  const next: LossThresholds = { ...c.lossThresholdsUsd };
  for (const l of LOSS_LEVELS) {
    const n = parseWhole(input[l], true);
    if (n === null) errors[l] = ERR_USD;
    else next[l] = n;
  }
  LOSS_LEVELS.forEach((l, i) => {
    const prev = LOSS_LEVELS[i - 1];
    if (!errors[l] && prev && !errors[prev] && next[l] <= next[prev]) {
      errors[l] = `Harus lebih besar dari ambang ${SEV_LABEL[prev]}.`;
    }
  });
  if (!input.effectiveFrom) errors.effectiveFrom = ERR_DATE;
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveFrom)) errors.effectiveFrom = ERR_DATE;
  else if (input.effectiveFrom <= at.slice(0, 10)) errors.effectiveFrom = ERR_DATE_PAST;
  if (!input.basis.trim()) errors.basis = ERR_BASIS;
  if (Object.keys(errors).length) return fail('Periksa isian yang bertanda galat.', errors);
  const diffs = LOSS_LEVELS.filter((l) => next[l] !== c.lossThresholdsUsd[l]);
  if (!diffs.length) return fail(ERR_NO_CHANGE, { rendah: ERR_NO_CHANGE });
  const version = matrixVersion(c) + 1;
  const text =
    diffs.map((l) => `${SEV_LABEL[l]} ${formatNumber(c.lossThresholdsUsd[l])} → ${formatNumber(next[l])}`).join(', ') + ' USD';
  const entry: ConfigChange = {
    key: 'matriks', at, by: actor.name, role: actor.roleLabel, text, version, effectiveFrom: input.effectiveFrom, basis: input.basis.trim(),
  };
  return { ok: true, config: { ...c, lossThresholdsUsd: next, history: withHistory(c, entry) }, changed: diffs.length, version };
}
