import { ORG } from '@/services/mock/seed';
import { remainingLabel } from '@/lib/deadline';
import { demoNow } from '@/services/mock/clock';
import { CLOSED_AT, EXTRA_INCIDENTS } from '@/services/mock/seedExtra';
import { DEMO_USERS, isSkk, type Role } from '@/lib/rbac';
import { STATUS_LABEL, type Incident } from '@/services/types';
import { SEV_LABEL } from '@/lib/severity';
import { formatDateShort } from '@/lib/format';
import type { FollowUp } from '@/services/types';
import { followUpTasks } from '@/features/tindak-lanjut/logic/tasks';

const HOUR = 3_600_000;
const DAY = 86_400_000;
const now = () => new Date(demoNow()).getTime();

/**
 * Insiden dalam cakupan suatu peran, tanpa batas waktu. KKKS hanya melihat organisasinya; SKK melihat semua KKKS (tanpa draf dan
 * perlu perbaikan). Daftar Insiden desktop memotongnya dengan filter Periode kejadian (bawaan Semua waktu).
 */
export function scopedIncidents(all: Incident[], role: Role): Incident[] {
  const skk = isSkk(role);
  const pool = skk ? [...all, ...EXTRA_INCIDENTS.filter((x) => !all.some((a) => a.no === x.no))] : all;
  return pool.filter((i) => {
    if (i.hiddenFor?.includes(role)) return false;
    if (i.status === 'digabung' || i.status === 'dibatalkan') return false;
    if (skk) return i.status !== 'draf' && i.status !== 'perlu-perbaikan';
    // HAK-02: semua insiden di WK dalam cakupan pengguna, ditambah yang ia laporkan atau tangani di luar cakupan
    const u = DEMO_USERS[role];
    return i.org === ORG && (!u.scope || u.scope.includes(i.wk) || i.reporter === u.name || i.pic === u.name);
  });
}

/** Insiden dalam cakupan peran, 30 hari terakhir (dipakai Tugas saya, hitungan lonceng, dan daftar mobile). */
export function visibleIncidents(all: Incident[], role: Role): Incident[] {
  const limit = now() - 30 * DAY;
  return scopedIncidents(all, role).filter((i) => new Date(i.occurredAt).getTime() >= limit);
}

export type TaskKind = 'draf' | 'perbaiki' | 'tangani' | 'periksa' | 'ganda' | 'tutup' | 'eskalasi' | 'tl-kerjakan' | 'tl-verifikasi';

/** Jenis tugas yang menunggu peran ini pada sebuah insiden (null bila tidak ada). Satu-satunya sumber untuk daftar, Tugas saya, dan hitungan. */
export function taskKind(i: Incident, role: Role): TaskKind | null {
  const me = DEMO_USERS[role].name;
  if (role === 'pelapor') {
    if (i.status === 'draf' && i.reporter === me) return 'draf';
    if (i.status === 'perlu-perbaikan' && i.reporter === me) return 'perbaiki';
  }
  if ((role === 'pelapor' || role === 'pic') && i.status === 'dalam-penanganan' && i.pic === me) return 'tangani';
  if (role === 'pejabat') {
    if (i.status === 'review-internal') return i.possibleDuplicate ? 'ganda' : 'periksa';
    if (i.status === 'minta-ditutup') return 'tutup';
    if (i.status === 'dalam-penanganan' && i.escalated) return 'eskalasi';
  }
  return null;
}

/** Teks tindakan yang menunggu peran ini pada sebuah insiden ('' bila tidak ada). */
export function actionFor(i: Incident, role: Role): string {
  switch (taskKind(i, role)) {
    case 'draf':
      return 'Lanjutkan draf';
    case 'perbaiki':
      return 'Perbaiki laporan';
    case 'tangani':
      return i.handleDueAt ? `Tangani · tenggat ${formatDateShort(i.handleDueAt)}` : 'Tangani';
    case 'periksa':
    case 'ganda':
      return 'Periksa';
    case 'tutup':
      return 'Tinjau penutupan';
    case 'eskalasi':
      return 'Tinjau eskalasi';
    default:
      return '';
  }
}

export interface QuickDef {
  key: string;
  label: string;
  test: (i: Incident) => boolean;
}

/** Pintasan per peran, mengikuti board Main (Pelapor), V11/P21 (Pejabat), P11 (PIC), I31 (SKK). */
export function quickFilters(role: Role): QuickDef[] {
  const me = DEMO_USERS[role].name;
  const all: QuickDef = { key: 'all', label: 'Semua', test: () => true };
  const act: QuickDef = { key: 'act', label: 'Perlu tindakan saya', test: (i) => !!actionFor(i, role) };
  const rep: QuickDef = { key: 'rep', label: 'Laporan saya', test: (i) => i.reporter === me };
  const mine: QuickDef = { key: 'pic', label: 'Ditangani saya', test: (i) => i.pic === me };
  if (role === 'pelapor' || role === 'pic' || role === 'pic-tl') return [all, act, mine, rep];
  if (role === 'pejabat') {
    return [
      all,
      act,
      rep,
      { key: 'late', label: 'Lewat tenggat', test: (i) => !!i.late },
      { key: 'esc', label: 'Dieskalasi', test: (i) => !!i.escalated },
    ];
  }
  return [
    all,
    { key: 'fast', label: 'Tinggi & Kritis', test: (i) => i.severity === 'tinggi' || i.severity === 'kritis' },
    { key: 'esc', label: 'Dieskalasi ke saya', test: (i) => !!i.escalated },
    { key: 'nv', label: 'Belum diperiksa', test: (i) => i.status === 'review-internal' },
  ];
}

/** Pintasan awal: Pejabat (V11/P21) membuka "Perlu tindakan saya"; peran lain membuka "Semua" (HAK-02: Laporan saya dan Ditangani saya hanya filter tambahan). */
export const defaultQuick = (role: Role) => (role === 'pejabat' ? 'act' : 'all');

export type ListLayout = 'pelapor' | 'verifikasi' | 'penutupan' | 'pic' | 'skk';

/** Susunan kolom daftar. Pejabat memakai V11 (Batas pemeriksaan), atau P21 (PIC + Tenggat) setelah ada permintaan penutupan. */
export function listLayout(role: Role, rows: Incident[]): ListLayout {
  if (isSkk(role)) return 'skk';
  if (role === 'pic' || role === 'pic-tl') return 'pic';
  if (role === 'pejabat') return rows.some((i) => i.status === 'minta-ditutup') ? 'penutupan' : 'verifikasi';
  return 'pelapor';
}

/** Label dan kelas status; SKK melihat Menunggu pemeriksaan sebagai "Belum diperiksa" (I31). */
export function statusText(i: Incident, role: Role): { label: string; override: string | null } {
  if (isSkk(role) && i.status === 'review-internal') return { label: 'Belum diperiksa', override: 't-caution' };
  return { label: STATUS_LABEL[i.status], override: null };
}

const unit = (ms: number) => (ms < DAY ? `${Math.max(1, Math.round(ms / HOUR))} jam` : `${Math.floor(ms / DAY)} hari`);

/** Indikator batas pemeriksaan (V11): "Lewat 5 jam" atau "sisa 20 jam". */
export function verifyIndicator(iso: string): { late: boolean; text: string } {
  const d = new Date(iso).getTime() - now();
  return d < 0 ? { late: true, text: `Lewat ${unit(-d)}` } : { late: false, text: `sisa ${unit(d)}` };
}

/** Indikator tenggat penanganan (P11/P21): kelas `in-due ok|soon|late`. */
export function dueIndicator(iso: string): { cls: string; text: string } {
  const r = remainingLabel(iso);
  if (r.late) return { cls: 'in-due late', text: r.text };
  const soon = new Date(iso).getTime() - now() < DAY;
  return { cls: soon ? 'in-due soon' : 'in-due ok', text: r.text };
}

export const closedAtShort = (no: string) => (CLOSED_AT[no] ? formatDateShort(CLOSED_AT[no]) : '');

export interface Task {
  no: string;
  kind: TaskKind;
  title: string;
  desc: string;
  st: string;
  cls: string;
  module: string;
  kkks: string;
  wk: string;
  at: string;
  from: string;
  cta: string;
  href: string;
  old: boolean;
}

const sevTxt = (i: Incident) => (i.severity ? SEV_LABEL[i.severity] : '');
const timeOf = (iso: string) => iso.slice(11, 16);

/** Tugas dari satu insiden untuk peran ini, atau null. Isi mengikuti V10/P10/P20/T4. */
export function taskFor(i: Incident, role: Role, all: Incident[]): Task | null {
  const kind = taskKind(i, role);
  if (!kind) return null;
  const last = i.timeline?.[i.timeline.length - 1];
  let at = last?.at ?? i.occurredAt;
  let from = last ? `dari ${last.by}` : `dari ${i.reporter}`;
  const head = [i.no, sevTxt(i), i.category].filter(Boolean).join(' · ');
  const verifyLate = !!i.verifyDueAt && new Date(i.verifyDueAt).getTime() < now();
  let desc = head;
  let st = '';
  let cls = 't-info';
  let cta = 'Tinjau';
  let late = false;
  switch (kind) {
    case 'draf':
      desc = [i.no, 'Draf', i.category].join(' · ');
      st = 'Draf';
      cls = 't-draft';
      cta = 'Lanjutkan';
      from = 'dari Anda';
      break;
    case 'perbaiki':
      desc = `${head}${i.revisionReason ? ' · ' + i.revisionReason : ''}`;
      st = 'Perlu perbaikan';
      cls = 't-caution';
      cta = 'Perbaiki';
      break;
    case 'tangani': {
      const due = i.handleDueAt ? new Date(i.handleDueAt).getTime() - now() : null;
      late = !!i.late || (due !== null && due < 0);
      desc =
        due !== null && due < 0
          ? `${head} · tenggat penanganan terlewat ${unit(-due)}`
          : `${head}${i.handleDueAt ? ' · batas ' + formatDateShort(i.handleDueAt) : ''}`;
      st = late ? 'Lewat tenggat' : 'Dalam penanganan';
      cls = late ? 't-caution' : 't-info';
      cta = 'Tangani';
      break;
    }
    case 'periksa':
      desc = verifyLate
        ? `${head} · batas periksa terlewat ${unit(now() - new Date(i.verifyDueAt!).getTime())}`
        : `${head}${i.verifyDueAt ? ` · batas ${formatDateShort(i.verifyDueAt)} ${timeOf(i.verifyDueAt)}` : ''}`;
      st = verifyLate ? 'Lewat batas' : 'Menunggu pemeriksaan';
      cls = 't-caution';
      cta = 'Periksa';
      late = verifyLate;
      break;
    case 'ganda': {
      const twin = all.find((x) => x.no !== i.no && x.status === 'review-internal' && x.area === i.area && x.category === i.category);
      desc = [i.no, sevTxt(i), twin ? `kemungkinan ganda dengan ${twin.no}` : 'kemungkinan ganda'].filter(Boolean).join(' · ');
      st = 'Kemungkinan ganda';
      break;
    }
    case 'tutup':
      desc = `${head}${i.pic ? ' · diajukan ' + i.pic : ''}`;
      st = 'Minta ditutup';
      break;
    case 'eskalasi': {
      const over = i.handleDueAt ? now() - new Date(i.handleDueAt).getTime() : 0;
      desc = `${head}${over > 0 ? ' · tenggat penanganan terlewat ' + unit(over) : ''}`;
      st = 'Dieskalasi';
      cls = 't-caution';
      if (i.handleDueAt) at = i.handleDueAt;
      from = 'dari sistem';
      late = true;
      break;
    }
  }
  const old = late || now() - new Date(at).getTime() > DAY;
  return {
    no: i.no, kind, title: i.title, desc, st, cls, module: 'Insiden', kkks: i.org, wk: i.wk, at, from, cta, old,
    href: kind === 'draf' ? '/insiden/baru/kejadian' : `/insiden/${i.no}`,
  };
}

/** Daftar Tugas saya, paling lama menunggu di atas (V10, T4). Tugas modul lain (mis. Pre-WP&B) tidak ada di store. */
export function tasksFor(all: Incident[], role: Role, followUps: FollowUp[] = []): Task[] {
  return [
    ...visibleIncidents(all, role)
      .map((i) => taskFor(i, role, all))
      .filter((t): t is Task => t !== null),
    ...followUpTasks(followUps, all, role),
  ].sort((a, b) => a.at.localeCompare(b.at));
}

/** Hitungan "Tugas saya" (lonceng dan sidebar) = jumlah baris halaman Tugas saya. */
export function taskCount(all: Incident[], role: Role, followUps: FollowUp[] = []): number {
  return tasksFor(all, role, followUps).length;
}

export const STATUS_OPTIONS = ['draf', 'review-internal', 'perlu-perbaikan', 'dalam-penanganan', 'minta-ditutup', 'ditutup', 'dibatalkan'] as const;
export const statusLabel = (s: Incident['status']) => STATUS_LABEL[s];
export const sevLabel = (s: Incident['severity']) => (s ? SEV_LABEL[s] : '');

/** 19 kategori filter (Main-Filter). */
export const KATEGORI_OPTIONS = [
  'Pencurian/Perampokan', 'Pencurian minyak', 'Pemerasan', 'Blokade area', 'Penyanderaan aset', 'Penghentian kegiatan/operasi',
  'Unjuk rasa', 'Sabotase', 'Perusakan material', 'Kasus tanah', 'Ancaman', 'Penculikan', 'DTT', 'Kebakaran', 'Kecelakaan kerja',
  'Kecelakaan lalu lintas', 'Serangan fisik', 'Serangan data', 'Lainnya',
] as const;
