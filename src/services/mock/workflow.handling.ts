// Transisi penanganan oleh PIC (board P12, P14, P15, P16, P17, PS6). Fungsi murni gaya workflow.ts.
import { demoNow } from '@/services/mock/clock';
import type { Closure, DemoState, HandlingData, Incident } from '../types';
import type { DecisionResult } from './workflow';


type Slice = Pick<DemoState, 'incidents' | 'kerawanan' | 'config'>;

/** Anggota Tim Pengamanan ADR Area 2 (data demo, selaras PIC_GROUPS "4 anggota"). */
export const GROUP_NAME = 'Tim Pengamanan ADR Area 2';
export const GROUP_MEMBERS = ['Andi Pratama', 'Dedi Kurniawan', 'Joko Susilo', 'Rina Wijaya'];

export const MSG_NOT_HANDLING = 'Insiden tidak sedang dalam penanganan.';
export const MAX_NOTE = 1000;
export const MAX_ESCALATION_REASON = 500;

const find = (s: Slice, no: string) => s.incidents.find((i) => i.no === no);
const put = (s: Slice, i: Incident): Slice => ({ ...s, incidents: s.incidents.map((x) => (x.no === i.no ? i : x)) });
const stamp = (by: string, text: string) => ({ at: demoNow(), by, text });
export const handlingOf = (i: Incident): HandlingData => i.handling ?? { notes: [], directives: [] };
export const emptyClosure = (): Closure => ({
  partners: [], casualtiesFinal: {}, lossFinalIdr: null, opsHoursFinal: null, cause: '', actions: '', outcome: '',
});

/** Satu sumber teks Ringkasan penanganan: `actions` (form PIC); `summary`/`outcome` hanya untuk data seed lama. */
export const closureSummary = (c: Closure | undefined): string => (c?.actions || c?.summary || c?.outcome || '').trim();

/** Kelengkapan 5 isian wajib data penutupan; dipakai semua layar (PIC, Pejabat, SKK, dialog Tutup). */
export function closureCompleteness(i: Incident): { done: number; total: number; missing: string[]; complete: boolean } {
  const c = i.handling?.closure;
  const missing = closureMissing(c).map((m) => m.label);
  return { done: CLOSURE_REQUIRED.length - missing.length, total: CLOSURE_REQUIRED.length, missing, complete: missing.length === 0 };
}

/** Label 5 isian wajib data penutupan (P16) dan pemeriksanya; satu sumber untuk progres, validasi PS6, dan Minta ditutup. */
export const CLOSURE_REQUIRED: { key: string; label: string; ok: (c: Closure) => boolean }[] = [
  { key: 'actions', label: 'Ringkasan penanganan', ok: (c) => closureSummary(c).length > 0 },
  { key: 'partners', label: 'Tim terlibat', ok: (c) => c.partners.length > 0 },
  { key: 'cause', label: 'Penyebab', ok: (c) => c.cause.trim().length > 0 },
  { key: 'factors', label: 'Faktor penyebab', ok: (c) => (c.factors?.length ?? 0) > 0 },
  { key: 'evidence', label: 'Bukti penyelesaian', ok: (c) => (c.evidence?.length ?? 0) > 0 },
];
export const closureMissing = (c: Closure | undefined) => CLOSURE_REQUIRED.filter((r) => !r.ok(c ?? emptyClosure()));
export const closureDone = (c: Closure | undefined) => CLOSURE_REQUIRED.length - closureMissing(c).length;

const working = (i?: Incident): string | null =>
  !i ? 'Insiden tidak ditemukan.' : i.status !== 'dalam-penanganan' ? MSG_NOT_HANDLING : null;

const withHandling = (i: Incident, patch: Partial<HandlingData>): HandlingData => ({ ...handlingOf(i), ...patch });

/** Simpan catatan: menambah `handling.notes` dan satu entri timeline. */
export function saveNote(s: Slice, no: string, by: string, text: string): DecisionResult {
  const i = find(s, no);
  const bad = working(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  const t = text.trim();
  if (!t) return { ok: false, reason: 'Tulis catatan dulu.' };
  if (t.length > MAX_NOTE) return { ok: false, reason: `Catatan maksimal ${MAX_NOTE} karakter.` };
  const h = handlingOf(i);
  return {
    ok: true,
    state: put(s, {
      ...i,
      handling: withHandling(i, { notes: [...h.notes, stamp(by, t)] }),
      timeline: [...(i.timeline ?? []), stamp(by, 'Menambah catatan penanganan.')],
    }),
  };
}

/** Ambil alih (PIC grup): anggota pertama menjadi PIC; anggota lain hanya melihat. */
export function takeOver(s: Slice, no: string, by: string): DecisionResult {
  const i = find(s, no);
  const bad = working(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  if (i.picKind !== 'grup') return { ok: false, reason: 'Insiden ini tidak ditangani grup.' };
  if (!GROUP_MEMBERS.includes(by)) return { ok: false, reason: 'Hanya anggota grup yang bisa mengambil alih.' };
  const taken = handlingOf(i).takenBy;
  if (taken) return { ok: false, reason: `Sudah diambil alih ${taken}.` };
  return {
    ok: true,
    state: put(s, {
      ...i,
      handling: withHandling(i, { takenBy: by }),
      timeline: [...(i.timeline ?? []), stamp(by, `Mengambil alih penanganan dari ${i.pic ?? GROUP_NAME}.`)],
    }),
  };
}

export interface EscalateInput {
  to: 'pejabat' | 'skk';
  name: string;
  reason: string;
}

/** Eskalasi manual (P15): alasan wajib; insiden tetap ditangani PIC dan diberi tag Dieskalasi. */
export function escalate(s: Slice, no: string, by: string, a: EscalateInput): DecisionResult {
  const i = find(s, no);
  const bad = working(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  const reason = a.reason.trim();
  if (!reason) return { ok: false, reason: 'Alasan eskalasi wajib diisi.' };
  if (reason.length > MAX_ESCALATION_REASON) return { ok: false, reason: `Alasan maksimal ${MAX_ESCALATION_REASON} karakter.` };
  if (!a.name.trim()) return { ok: false, reason: 'Pilih nama penerima eskalasi.' };
  return {
    ok: true,
    state: put(s, {
      ...i,
      escalated: true,
      handling: withHandling(i, { escalatedTo: a.to, escalatedName: a.name, escalationReason: reason }),
      timeline: [...(i.timeline ?? []), stamp(by, `Eskalasi ke ${a.name}. ${reason}`)],
    }),
  };
}

/** Simpan draf data penutupan (dipanggil tiap perubahan isian). Tidak mengubah status. */
export function saveClosure(s: Slice, no: string, _by: string, patch: Partial<Closure>): DecisionResult {
  const i = find(s, no);
  const bad = working(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  const closure: Closure = { ...emptyClosure(), ...handlingOf(i).closure, ...patch };
  return { ok: true, state: put(s, { ...i, handling: withHandling(i, { closure }) }) };
}

/** Minta ditutup (P16 → P17): hanya bila 5 isian wajib lengkap; selain itu galat (PS6). */
export function requestClosure(s: Slice, no: string, by: string, reviewers?: string[] | null): DecisionResult {
  const i = find(s, no);
  const bad = working(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  const closure = handlingOf(i).closure;
  const missing = closureMissing(closure);
  if (missing.length) return { ok: false, reason: `Lengkapi ${missing.map((m) => m.label).join(', ')} sebelum menutup insiden.` };
  const next: Closure = { ...(closure as Closure), requestedAt: demoNow(), returnReason: undefined, reviewers: reviewers ?? null };
  return {
    ok: true,
    state: put(s, {
      ...i,
      status: 'minta-ditutup',
      handling: withHandling(i, { closure: next }),
      timeline: [...(i.timeline ?? []), stamp(by, 'Mengajukan penutupan.')],
    }),
  };
}

/** Tanggapi saran langkah dari pemeriksa: 'done' (Jadikan tindak lanjut), 'ignored' (Abaikan), null (Batalkan). */
export function respondStep(s: Slice, no: string, step: string, as: 'done' | 'ignored' | null): DecisionResult {
  const i = find(s, no);
  const bad = working(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  const h = handlingOf(i);
  const rest = (l?: string[]) => (l ?? []).filter((x) => x !== step);
  return {
    ok: true,
    state: put(s, {
      ...i,
      handling: withHandling(i, {
        stepsDone: as === 'done' ? [...rest(h.stepsDone), step] : rest(h.stepsDone),
        stepsIgnored: as === 'ignored' ? [...rest(h.stepsIgnored), step] : rest(h.stepsIgnored),
      }),
    }),
  };
}
