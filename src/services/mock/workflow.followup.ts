// Transisi tindak lanjut (modul INS-06, fase 6): tambah, ajukan selesai, tarik pengajuan, setujui, kembalikan, batalkan otomatis.
// Fungsi murni gaya workflow.ts: menerima Slice (perlu `followUps`), mengembalikan DecisionResult.
import type { FollowUp, FollowUpSource, Incident, TimelineEntry } from '../types';
import type { DecisionResult, Slice } from './workflow';
import { addWorkingDays as addWd } from '@/lib/workdays';
import { nextNumber } from '@/features/insiden/logic/submit';

/** Waktu "sekarang" layar tindak lanjut: tanggal pengajuan pada board T5/T6 (5 Nov 2026, 09:12). */
export const TL_NOW = '2026-11-05T09:12:00';
/** Waktu pembuatan tindak lanjut baru di dialog Tambah (T1): 30 Okt 2026, 16:05, sehingga 5 hari kerja = 6 Nov 2026. */
export const TL_CREATE_NOW = '2026-10-30T16:05:00';
export const MAX_ACTION = 300;
export const MAX_EVIDENCE_HINT = 200;
export const MAX_NOTE_TL = 500;
export const MIN_RETURN_REASON = 10;
/** Status insiden yang boleh menerima tindak lanjut baru. */
export const TL_HOST_STATUS: Incident['status'][] = ['dalam-penanganan', 'minta-ditutup', 'ditutup'];

const bad = (reason: string): DecisionResult => ({ ok: false, reason });
const list = (s: Slice): FollowUp[] => s.followUps ?? [];
const put = (s: Slice, f: FollowUp): Slice => ({ ...s, followUps: list(s).map((x) => (x.no === f.no ? f : x)) });
const stamp = (at: string, by: string, text: string): TimelineEntry => ({ at, by, text });
const OPEN: FollowUp['status'][] = ['belum-dimulai', 'berjalan', 'menunggu-verifikasi', 'dikembalikan'];

/** Tindak lanjut yang masih berjalan (belum selesai/dibatalkan). */
export const isOpenFollowUp = (f: FollowUp) => OPEN.includes(f.status);
/** Tindak lanjut suatu insiden yang masih berjalan. */
export const openFollowUpsOf = (fus: FollowUp[] | undefined, incidentNo: string): FollowUp[] =>
  (fus ?? []).filter((f) => f.incidentNo === incidentNo && isOpenFollowUp(f));

/** Pemeriksa = PIC insiden saat ini (ikut pindah bila PIC diganti); bila belum ada, pemberi tugas. */
/** Pemberi tugas = pemeriksa (PRD TLJ-01 FR-KT-06; untuk sumber insiden = PIC insiden saat dibuat, FR-INS-113). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const verifierOf = (f: FollowUp, _incident?: Incident): string => f.createdBy;

/** Tenggat dari tanggal `YYYY-MM-DD` (jam 17:00). */
export const dueFromDate = (date: string) => `${date.slice(0, 10)}T17:00:00`;

/** Tambah hari kerja (lewati akhir pekan dan libur kalender kerja) ke tanggal ISO; hasil berupa tanggal. */
export function addWorkingDays(iso: string, n: number): string {
  return addWd(iso.slice(0,10), n);
}
export { workingDaysBetween } from '@/lib/workdays';

export interface AddInput {
  incidentNo: string;
  action: string;
  pic: string;
  /** YYYY-MM-DD */
  dueDate: string;
  expectedEvidence?: string;
  source?: FollowUpSource;
  sourceLabel?: string;
  by: string;
  at?: string;
}

/** Membangun TL baru tanpa validasi insiden (dipakai addFollowUp dan followUpDirective). */
export function buildFollowUp(existing: FollowUp[], a: AddInput): FollowUp {
  const at = a.at ?? TL_CREATE_NOW;
  const source = a.source ?? 'manual';
  const no = nextNumber('TL-SEN', existing.map((f) => f.no));
  const via = source === 'saran-verifikator' ? ' dari saran pemeriksa' : source === 'arahan-skk' ? ' dari arahan SKK' : '';
  return {
    no, incidentNo: a.incidentNo, action: a.action.trim(), pic: a.pic, dueAt: dueFromDate(a.dueDate), status: 'belum-dimulai', source,
    sourceLabel: a.sourceLabel, createdBy: a.by, createdAt: at, expectedEvidence: a.expectedEvidence?.trim() || undefined,
    evidence: [], notes: [], history: [stamp(at, a.by, `Membuat tindak lanjut${via} dan menugaskan ke ${a.pic}.`)],
  };
}

/** Tambah tindak lanjut dari insiden. Tindakan, PIC, tenggat wajib; insiden harus sedang berjalan. */
export function addFollowUp(s: Slice, a: AddInput): DecisionResult {
  const i = s.incidents.find((x) => x.no === a.incidentNo);
  if (!i) return bad('Insiden tidak ditemukan.');
  if (!TL_HOST_STATUS.includes(i.status)) return bad('Tindak lanjut hanya bisa ditambah pada insiden yang sedang berjalan.');
  const action = a.action.trim();
  if (!action) return bad('Tindakan wajib diisi.');
  if (action.length > MAX_ACTION) return bad(`Tindakan maksimal ${MAX_ACTION} karakter.`);
  if (!a.pic) return bad('Pilih PIC tindak lanjut.');
  if (!a.dueDate) return bad('Tenggat wajib diisi.');
  if (a.dueDate < (a.at ?? TL_CREATE_NOW).slice(0, 10)) return bad('Pilih tenggat mulai hari ini.');
  if ((a.expectedEvidence ?? '').length > MAX_EVIDENCE_HINT) return bad(`Bukti selesai maksimal ${MAX_EVIDENCE_HINT} karakter.`);
  const fu = buildFollowUp(list(s), a);
  const at = a.at ?? TL_CREATE_NOW;
  const inc: Incident = { ...i, timeline: [...(i.timeline ?? []), stamp(at, a.by, `Menambah tindak lanjut ${fu.no}: ${fu.action}`)] };
  return { ok: true, state: { ...s, incidents: s.incidents.map((x) => (x.no === inc.no ? inc : x)), followUps: [fu, ...list(s)] } };
}

const findFu = (s: Slice, no: string) => list(s).find((f) => f.no === no);

/** Catatan pertama memulai pekerjaan: Belum dimulai → Dikerjakan (FR-KT-01). */
const startPatch = (f: FollowUp, by: string, at: string): Partial<FollowUp> =>
  f.status === 'belum-dimulai' ? { status: 'berjalan', history: [...f.history, stamp(at, by, 'Mulai dikerjakan.')] } : {};

/** Tombol "Mulai kerjakan": tanpa konfirmasi dan tanpa notifikasi ke pemberi tugas. */
export function startFollowUp(s: Slice, no: string, by: string, at: string = TL_NOW): DecisionResult {
  const f = findFu(s, no);
  if (!f) return bad('Tindak lanjut tidak ditemukan.');
  if (f.status !== 'belum-dimulai') return bad('Tindak lanjut ini sudah dimulai.');
  if (by !== f.pic) return bad('Hanya PIC tindak lanjut yang bisa memulai.');
  return { ok: true, state: put(s, { ...f, ...startPatch(f, by, at) }) };
}

/** Catatan progres oleh PIC TL (status berjalan atau dikembalikan). */
export function addFollowUpNote(s: Slice, no: string, by: string, text: string, at: string = TL_NOW, photos = 0): DecisionResult {
  const f = findFu(s, no);
  if (!f) return bad('Tindak lanjut tidak ditemukan.');
  if (f.status !== 'berjalan' && f.status !== 'belum-dimulai' && f.status !== 'dikembalikan') return bad('Catatan tidak bisa ditambah pada status ini.');
  if (by !== f.pic) return bad('Hanya PIC tindak lanjut yang bisa menambah catatan.');
  if (!text.trim()) return bad('Tulis catatan progres.');
  if (text.length > MAX_NOTE_TL) return bad(`Catatan maksimal ${MAX_NOTE_TL} karakter.`);
  return { ok: true, state: put(s, { ...f, ...startPatch(f, by, at), notes: [{ ...stamp(at, by, text.trim()), ...(photos > 0 ? { photos } : {}) }, ...f.notes] }) };
}

/** Hapus bukti yang belum diajukan (Draf): hanya PIC, selama Belum dimulai, Dikerjakan, atau Dikembalikan. */
export function removeEvidence(s: Slice, no: string, by: string, name: string): DecisionResult {
  const f = findFu(s, no);
  if (!f) return bad('Tindak lanjut tidak ditemukan.');
  if (f.status !== 'berjalan' && f.status !== 'belum-dimulai' && f.status !== 'dikembalikan') return bad('Bukti terkunci.');
  if (by !== f.pic) return bad('Hanya PIC tindak lanjut yang bisa menghapus bukti.');
  return { ok: true, state: put(s, { ...f, evidence: f.evidence.filter((e) => e.name !== name) }) };
}

/** Tambah bukti (mock) sebagai Draf: TIDAK mengubah status (TLJ-01 §9 #20). Boleh saat Belum dimulai, Dikerjakan, atau Dikembalikan. */
export function addEvidence(s: Slice, no: string, by: string, file: { name: string; sizeKb: number }): DecisionResult {
  const f = findFu(s, no);
  if (!f) return bad('Tindak lanjut tidak ditemukan.');
  if (f.status !== 'berjalan' && f.status !== 'belum-dimulai' && f.status !== 'dikembalikan') return bad('Bukti terkunci.');
  if (by !== f.pic) return bad('Hanya PIC tindak lanjut yang bisa menambah bukti.');
  return { ok: true, state: put(s, { ...f, evidence: [...f.evidence, file] }) };
}

export const MSG_ONLY_PIC = 'Hanya PIC tindak lanjut yang bisa mengajukan selesai.';

/** Ajukan selesai (PIC TL): Dikerjakan/Dikembalikan → Menunggu pemeriksaan. Bukti terkunci. */
export function submitDone(s: Slice, no: string, by: string, note?: string, at: string = TL_NOW): DecisionResult {
  const f = findFu(s, no);
  if (!f) return bad('Tindak lanjut tidak ditemukan.');
  if (f.status !== 'berjalan' && f.status !== 'belum-dimulai' && f.status !== 'dikembalikan') return bad('Tindak lanjut ini tidak bisa diajukan selesai.');
  if (by !== f.pic) return bad(MSG_ONLY_PIC);
  if ((note ?? '').length > MAX_NOTE_TL) return bad(`Catatan penyelesaian maksimal ${MAX_NOTE_TL} karakter.`);
  if (f.createdBy === f.pic) {
    // Diperiksa sendiri: pembuat sekaligus PIC, tanpa pemeriksaan kedua.
    return {
      ok: true,
      state: put(s, {
        ...f, status: 'selesai', submittedAt: at, finishedAt: at, verifiedAt: at, verifiedBy: by, completionNote: note?.trim() || undefined, returnReason: undefined,
        history: [...f.history, stamp(at, by, 'Diperiksa selesai. Diperiksa sendiri.')],
      }),
    };
  }
  return {
    ok: true,
    state: put(s, {
      ...f, status: 'menunggu-verifikasi', submittedAt: at, completionNote: note?.trim() || undefined, returnReason: undefined,
      history: [...f.history, stamp(at, by, 'Mengajukan selesai.')],
    }),
  };
}

/** Tarik pengajuan (PIC TL): Menunggu pemeriksaan → Dikerjakan. */
export function withdrawSubmission(s: Slice, no: string, by: string, at: string = TL_NOW): DecisionResult {
  const f = findFu(s, no);
  if (!f) return bad('Tindak lanjut tidak ditemukan.');
  if (f.status === 'selesai' || f.status === 'dikembalikan' || (f.status === 'berjalan' && f.returnedBy)) return bad(`Pengajuan sudah diperiksa oleh ${f.verifiedBy ?? f.returnedBy ?? f.createdBy} dan tidak bisa ditarik.`);
  if (f.status !== 'menunggu-verifikasi') return bad('Tidak ada pengajuan yang bisa ditarik.');
  if (by !== f.pic) return bad('Hanya PIC tindak lanjut yang bisa menarik pengajuan.');
  return { ok: true, state: put(s, { ...f, status: 'berjalan', submittedAt: undefined, history: [...f.history, stamp(at, by, 'Menarik pengajuan.')] }) };
}

function verifyGuard(s: Slice, no: string, by: string): { f: FollowUp } | { err: DecisionResult } {
  const f = findFu(s, no);
  if (!f) return { err: bad('Tindak lanjut tidak ditemukan.') };
  if (f.status !== 'menunggu-verifikasi') return { err: bad(`Item ini sudah diproses oleh ${f.verifiedBy ?? f.returnedBy ?? f.createdBy}.`) };
  const v = verifierOf(f, s.incidents.find((i) => i.no === f.incidentNo));
  if (by !== v) return { err: bad(`Hanya ${v}, PIC insiden, yang bisa memeriksa.`) };
  return { f };
}

/** Setujui selesai (PIC insiden): → Selesai (final). Tanggal selesai = tanggal pengajuan, bukti menjadi resmi. */
export function approveDone(s: Slice, no: string, by: string, at: string = TL_NOW): DecisionResult {
  const g = verifyGuard(s, no, by);
  if ('err' in g) return g.err;
  const f = g.f;
  return {
    ok: true,
    state: put(s, { ...f, status: 'selesai', verifiedAt: at, verifiedBy: by, finishedAt: f.submittedAt ?? at, history: [...f.history, stamp(at, by, 'Diperiksa selesai.')] }),
  };
}

/** Kembalikan ke PIC TL: alasan minimal 10 karakter; kembali ke Dikerjakan (status `dikembalikan` sampai pengajuan berikutnya). */
export function returnFollowUp(s: Slice, no: string, by: string, reason: string, at: string = TL_NOW): DecisionResult {
  const g = verifyGuard(s, no, by);
  if ('err' in g) return g.err;
  if (reason.trim().length < MIN_RETURN_REASON) return bad(`Alasan minimal ${MIN_RETURN_REASON} karakter.`);
  const f = g.f;
  return {
    ok: true,
    state: put(s, {
      ...f, status: 'dikembalikan', returnReason: reason.trim(), returnedAt: at, returnedBy: by, submittedAt: undefined,
      history: [...f.history, stamp(at, by, `Mengembalikan: ${reason.trim()}`)],
    }),
  };
}

/** Batalkan semua tindak lanjut berjalan suatu insiden (dipakai Tutup › Batalkan semua dan Gabung). */
export function cancelOpenFollowUps(fus: FollowUp[], incidentNo: string, reason: string, by: string, at: string = TL_NOW): FollowUp[] {
  return fus.map((f) =>
    f.incidentNo === incidentNo && isOpenFollowUp(f)
      ? { ...f, status: 'dibatalkan' as const, cancelReason: reason, cancelledAt: at, cancelledBy: by, history: [...f.history, stamp(at, by, `Dibatalkan: ${reason}`)] }
      : f,
  );
}

/** Insiden sumber digabung ke `parentNo`: tindak lanjut berjalan dibatalkan otomatis oleh sistem (T9). */
export function cancelForMerge(s: Slice, incidentNo: string, parentNo: string, at: string = TL_NOW): DecisionResult {
  const reason = `Insiden sumber ${incidentNo} digabung ke ${parentNo}.`;
  return { ok: true, state: { ...s, followUps: cancelOpenFollowUps(list(s), incidentNo, reason, 'Sistem', at) } };
}

/** Tepat waktu bila diajukan sebelum atau pada tenggat (pemeriksaan setelah tenggat tidak dihitung terlambat). */
export const isOnTime = (f: FollowUp): boolean => {
  const t = f.submittedAt ?? f.finishedAt;
  return !t || t.slice(0, 10) <= f.dueAt.slice(0, 10);
};

const reasonErr = (reason: string): string | null => (reason.trim().length < MIN_RETURN_REASON ? 'Tulis alasan minimal 10 karakter.' : null);
const isGiver = (f: FollowUp, by: string) => f.createdBy === by;

/** Ubah tenggat (pemberi tugas, semua status kecuali Selesai dan Dibatalkan; FR-TL-15). Tenggat awal tetap tersimpan. */
export function changeFollowUpDue(s: Slice, no: string, by: string, date: string, reason: string, at: string = TL_NOW): DecisionResult {
  const f = findFu(s, no);
  if (!f) return bad('Tindak lanjut tidak ditemukan.');
  if (f.status === 'selesai' || f.status === 'dibatalkan') return bad('Tenggat tidak bisa diubah pada status ini.');
  if (!isGiver(f, by)) return bad('Hanya pemberi tugas yang bisa mengubah tenggat.');
  if (date.slice(0, 10) < at.slice(0, 10)) return bad('Tanggal tidak boleh sebelum hari ini.');
  const err = reasonErr(reason);
  if (err) return bad(err);
  const due = dueFromDate(date);
  return {
    ok: true,
    state: put(s, { ...f, dueAtOriginal: f.dueAtOriginal ?? f.dueAt, dueAt: due, history: [...f.history, stamp(at, by, `Mengubah tenggat dari ${f.dueAt.slice(0, 10)} menjadi ${due.slice(0, 10)}. Alasan: ${reason.trim()}`)] }),
  };
}

/** Ganti PIC (pemberi tugas, status Belum dimulai atau Dikerjakan; FR-TL-16). */
export function reassignFollowUp(s: Slice, no: string, by: string, pic: string, reason: string, at: string = TL_NOW): DecisionResult {
  const f = findFu(s, no);
  if (!f) return bad('Tindak lanjut tidak ditemukan.');
  if (f.status !== 'belum-dimulai' && f.status !== 'berjalan' && f.status !== 'dikembalikan') return bad('PIC hanya bisa diganti saat Belum dimulai atau Dikerjakan.');
  if (!isGiver(f, by)) return bad('Hanya pemberi tugas yang bisa mengganti PIC.');
  if (!pic || pic === f.pic) return bad('Pilih PIC baru.');
  const err = reasonErr(reason);
  if (err) return bad(err);
  return { ok: true, state: put(s, { ...f, pic, history: [...f.history, stamp(at, by, `Mengganti PIC dari ${f.pic} ke ${pic}. Alasan: ${reason.trim()}`)] }) };
}

/** Batalkan (pemberi tugas, semua status kecuali Selesai; FR-TL-17). Data tidak dihapus dan tidak dihitung terlambat. */
export function cancelFollowUp(s: Slice, no: string, by: string, reason: string, at: string = TL_NOW): DecisionResult {
  const f = findFu(s, no);
  if (!f) return bad('Tindak lanjut tidak ditemukan.');
  if (f.status === 'selesai' || f.status === 'dibatalkan') return bad('Tindak lanjut ini tidak bisa dibatalkan.');
  if (!isGiver(f, by)) return bad('Hanya pemberi tugas yang bisa membatalkan.');
  const err = reasonErr(reason);
  if (err) return bad(err);
  return { ok: true, state: put(s, { ...f, status: 'dibatalkan', cancelReason: reason.trim(), cancelledAt: at, cancelledBy: by, history: [...f.history, stamp(at, by, `Membatalkan: ${reason.trim()}`)] }) };
}

export interface ArahanInput {
  /** tanggal arahan YYYY-MM-DD (tidak boleh di masa depan) */
  date: string;
  channel: string;
  giver: string;
  action: string;
  pic: string;
  dueDate: string;
  expectedEvidence?: string;
  doc?: string;
  by: string;
  at?: string;
}
export const ARAHAN_CHANNELS = ['Rapat', 'Surat', 'Kunjungan lapangan', 'Lisan', 'Lainnya'];

/** Tambah tindak lanjut bersumber Arahan SKK (FR-TL-03b): satu poin arahan = satu tindak lanjut; pembuat = pemberi tugas dan pemeriksa. */
export function addArahanFollowUp(s: Slice, a: ArahanInput): DecisionResult {
  const at = a.at ?? TL_NOW;
  if (!a.date) return bad('Pilih tanggal arahan.');
  if (a.date > at.slice(0, 10)) return bad('Tanggal arahan tidak boleh di masa depan.');
  if (!ARAHAN_CHANNELS.includes(a.channel)) return bad('Pilih cara penyampaian.');
  if (!a.giver.trim()) return bad('Tulis pemberi arahan.');
  if (a.giver.length > 120) return bad('Pemberi arahan maksimal 120 karakter.');
  const action = a.action.trim();
  if (!action) return bad('Tulis tindakan tindak lanjut.');
  if (action.length > MAX_ACTION) return bad(`Tindakan maksimal ${MAX_ACTION} karakter.`);
  if (!a.pic) return bad('Pilih PIC tindak lanjut.');
  if (!a.dueDate) return bad('Tenggat wajib diisi.');
  if (a.dueDate < at.slice(0, 10)) return bad('Tanggal tidak boleh sebelum hari ini.');
  if ((a.expectedEvidence ?? '').length > MAX_EVIDENCE_HINT) return bad(`Bukti selesai maksimal ${MAX_EVIDENCE_HINT} karakter.`);
  const no = nextNumber('TL-SEN', list(s).map((f) => f.no));
  const fu: FollowUp = {
    no, incidentNo: '', sourceKind: 'arahan', source: 'arahan-skk', action, pic: a.pic, dueAt: dueFromDate(a.dueDate), status: 'belum-dimulai',
    createdBy: a.by, createdAt: at, expectedEvidence: a.expectedEvidence?.trim() || undefined, evidence: [], notes: [],
    arahan: { date: a.date, channel: a.channel, giver: a.giver.trim(), title: `Arahan SKK melalui ${a.channel.toLowerCase()}`, doc: a.doc },
    history: [stamp(at, a.by, `Membuat tindak lanjut dari arahan SKK dan menugaskan ke ${a.pic}.`)],
  };
  return { ok: true, state: { ...s, followUps: [fu, ...list(s)] } };
}
