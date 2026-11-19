// Turunan data murni modul Tindak lanjut (board T1..T9): izin aksi, indikator tenggat, daftar, tugas.
import type { FollowUp, FollowUpStatus, Incident } from '@/services/types';
import { FOLLOWUP_LABEL } from '@/services/types';
import { DEMO_USERS, isSkk, type Role } from '@/lib/rbac';
import { ORG } from '@/services/mock/seed';
import { formatDate, formatDateShort } from '@/lib/format';
import { TL_NOW, verifierOf, workingDaysBetween } from '@/services/mock/workflow.followup';

export const EMPTY_FU: FollowUp[] = [];

export const sourceText = (f: FollowUp): string =>
  f.source === 'saran-verifikator'
    ? `Dari saran pemeriksa${f.sourceLabel ? ` · ${f.sourceLabel}` : ''}`
    : f.source === 'arahan-skk'
      ? `Dari arahan SKK Migas${f.sourceLabel ? ` · ${f.sourceLabel}` : ''}`
      : 'Dibuat PIC insiden dari halaman Tangani insiden';

/** Label status di judul halaman: `dikembalikan` tampil "Dikerjakan" (T6/T7); di daftar dan Tugas saya tampil "Dikembalikan". */
export const headerLabel = (s: FollowUpStatus) => (s === 'dikembalikan' ? FOLLOWUP_LABEL.berjalan : FOLLOWUP_LABEL[s]);
export const headerTag = (s: FollowUpStatus) => (s === 'dikembalikan' ? 't-info' : undefined);

export const isWorkable = (f: FollowUp) => f.status === 'berjalan' || f.status === 'belum-dimulai' || f.status === 'dikembalikan';

/** PIC tindak lanjut boleh mengerjakan (catatan, bukti, ajukan selesai) bila namanya sama dengan PIC. */
export const canWork = (f: FollowUp, role: Role) => isWorkable(f) && DEMO_USERS[role].name === f.pic && !isSkk(role);
export const canTarik = (f: FollowUp, role: Role) => f.status === 'menunggu-verifikasi' && DEMO_USERS[role].name === f.pic && !isSkk(role);
/** PIC insiden (pemberi tugas) memeriksa. */
export const canVerify = (f: FollowUp, incident: Incident | undefined, role: Role) =>
  f.status === 'menunggu-verifikasi' && !isSkk(role) && role !== 'pic-tl' && DEMO_USERS[role].name === verifierOf(f, incident);

export function dueTl(f: FollowUp): { cls: string; text: string } | null {
  if (f.status !== 'berjalan' && f.status !== 'belum-dimulai' && f.status !== 'dikembalikan') return null;
  const n = workingDaysBetween(TL_NOW, f.dueAt);
  if (n < 0) return { cls: 'in-due late', text: `lewat ${-n} hari kerja` };
  if (n === 0) return { cls: 'in-due soon', text: 'jatuh tempo hari ini' };
  return { cls: n <= 1 ? 'in-due soon' : 'in-due ok', text: `sisa ${n} hari kerja` };
}

/** TL yang boleh dilihat peran ini: KKKS hanya organisasinya; SKK semua. */
export function visibleFollowUps(fus: FollowUp[], incidents: Incident[], role: Role): FollowUp[] {
  if (isSkk(role)) return fus;
  return fus.filter((f) => (incidents.find((i) => i.no === f.incidentNo)?.org ?? ORG) === ORG);
}

/** Pintasan daftar. */
export interface TlQuick { key: string; label: string; test: (f: FollowUp) => boolean }
export function tlQuickFilters(role: Role, incidents: Incident[]): TlQuick[] {
  const me = DEMO_USERS[role].name;
  const all: TlQuick = { key: 'all', label: 'Semua', test: () => true };
  const mine: TlQuick = { key: 'mine', label: 'Ditugaskan ke saya', test: (f) => f.pic === me };
  const act: TlQuick = {
    key: 'act', label: 'Perlu tindakan saya',
    test: (f) => (f.pic === me && isWorkable(f)) || canVerify(f, incidents.find((i) => i.no === f.incidentNo), role),
  };
  const run: TlQuick = { key: 'run', label: 'Berjalan', test: (f) => f.status !== 'selesai' && f.status !== 'dibatalkan' };
  const done: TlQuick = { key: 'done', label: 'Selesai', test: (f) => f.status === 'selesai' };
  return isSkk(role) ? [all, run, done] : [all, act, mine, run, done];
}

export const lowerFirst = (t: string) => t.replace(/\.$/, '').replace(/^(.)/, (c) => c.toLowerCase());
export const dueShort = (f: FollowUp) => formatDateShort(f.dueAt);
export const dueFull = (f: FollowUp) => formatDate(f.dueAt);

// ---- Tampilan modul Tindak Lanjut (artifact TLJ-01) ----
/** Label dan warna tag status di modul: "Dikembalikan" bukan status (PRD), tampil Dikerjakan dengan keterangan di tenggat. */
export const MOD_LABEL: Record<FollowUpStatus, string> = {
  'belum-dimulai': 'Belum dimulai', berjalan: 'Dikerjakan', dikembalikan: 'Dikerjakan',
  'menunggu-verifikasi': 'Menunggu pemeriksaan', selesai: 'Selesai', dibatalkan: 'Dibatalkan',
};
export const MOD_TAG: Record<FollowUpStatus, string> = {
  'belum-dimulai': 't-neutral', berjalan: 't-info', dikembalikan: 't-info', 'menunggu-verifikasi': 't-caution', selesai: 't-ok', dibatalkan: 't-muted',
};
export const isFinal = (f: FollowUp) => f.status === 'selesai' || f.status === 'dibatalkan';
export const sourceKindOf = (f: FollowUp): 'insiden' | 'kerawanan' | 'arahan' => f.sourceKind ?? (f.source === 'arahan-skk' && !f.incidentNo ? 'arahan' : 'insiden');
export const sourceId = (f: FollowUp): string => f.incidentNo || f.krwNo || 'Arahan SKK';

/** Selisih hari kerja dari TL_NOW ke tenggat (negatif = lewat). */
export const daysLeft = (f: FollowUp): number => workingDaysBetween(TL_NOW, f.dueAt);
export const isLate = (f: FollowUp) => !isFinal(f) && f.status !== 'menunggu-verifikasi' && daysLeft(f) < 0;

/** Keterangan di bawah tanggal tenggat pada tabel. */
export function dueSub(f: FollowUp): { text: string; late?: boolean } | null {
  if (f.status === 'dikembalikan') return { text: 'Dikembalikan' };
  if (isFinal(f)) return null;
  const n = daysLeft(f);
  if (f.status === 'menunggu-verifikasi') return n < 0 ? { text: `Diajukan terlambat ${-n} hari kerja`, late: true } : null;
  if (n < 0) return { text: `Terlambat ${-n} hari kerja`, late: true };
  return { text: `H-${n}` };
}

export interface TlFilter {
  status: FollowUpStatus[];
  due: 'late' | 'week' | null;
  source: ('insiden' | 'kerawanan' | 'arahan')[];
  pic: string;
  giver: string;
  showCancelled: boolean;
}
export const EMPTY_TL_FILTER: TlFilter = { status: [], due: null, source: [], pic: '', giver: '', showCancelled: false };
export const filterCount = (x: TlFilter) => (x.status.length ? 1 : 0) + (x.due ? 1 : 0) + (x.source.length ? 1 : 0) + (x.pic ? 1 : 0) + (x.giver ? 1 : 0) + (x.showCancelled ? 1 : 0);

/** Status chip filter: "Dikerjakan" mencakup yang dikembalikan. */
export const matchesTl = (f: FollowUp, x: TlFilter): boolean => {
  if (f.status === 'dibatalkan' && !x.showCancelled && !x.status.includes('dibatalkan')) return false;
  if (x.status.length && !x.status.some((s) => s === f.status || (s === 'berjalan' && f.status === 'dikembalikan'))) return false;
  if (x.due === 'late' && !isLate(f)) return false;
  if (x.due === 'week' && (isFinal(f) || daysLeft(f) < 0 || daysLeft(f) > 7)) return false;
  if (x.source.length && !x.source.includes(sourceKindOf(f))) return false;
  if (x.pic && !f.pic.toLowerCase().includes(x.pic.toLowerCase())) return false;
  if (x.giver && !f.createdBy.toLowerCase().includes(x.giver.toLowerCase())) return false;
  return true;
};

/** Urut bawaan: terlambat di atas, lalu tenggat terdekat; yang final di bawah. */
export const sortTlList = (a: FollowUp, b: FollowUp) =>
  Number(isFinal(a)) - Number(isFinal(b)) || Number(isLate(b)) - Number(isLate(a)) || a.dueAt.localeCompare(b.dueAt);

/** Pemindahan kartu di Papan (TLJ-01 P-10): tujuan lajur dan aksi. Tidak ada jalan kembali ke Belum dimulai; Selesai dan Dibatalkan tidak bisa dipindah. */
export type BoardAct = 'mulai' | 'ajukan' | 'tarik' | 'setujui' | 'kembalikan';
export interface BoardMove { to: FollowUpStatus; act: BoardAct; hint: string }
export function boardMoves(f: FollowUp, me: string): BoardMove[] {
  const isPic = f.pic === me;
  const isGiver = f.createdBy === me;
  const out: BoardMove[] = [];
  if (f.status === 'belum-dimulai' && isPic) out.push({ to: 'berjalan', act: 'mulai', hint: 'Lepas untuk mulai dikerjakan' });
  if ((f.status === 'berjalan' || f.status === 'dikembalikan') && isPic) out.push({ to: 'menunggu-verifikasi', act: 'ajukan', hint: 'Lepas untuk mengajukan selesai' });
  if (f.status === 'menunggu-verifikasi' && isGiver) {
    out.push({ to: 'selesai', act: 'setujui', hint: 'Lepas untuk menyetujui' }, { to: 'berjalan', act: 'kembalikan', hint: 'Lepas untuk kembalikan ke PIC' });
  } else if (f.status === 'menunggu-verifikasi' && isPic) out.push({ to: 'berjalan', act: 'tarik', hint: 'Lepas untuk menarik pengajuan' });
  return out;
}
