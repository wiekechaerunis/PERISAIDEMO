// Transisi insiden yang sudah berjalan (Pejabat Berwenang): Tutup, Kembalikan ke PIC, Ganti PIC, Ubah tenggat,
// Buka kembali, Jadikan arahan tindak lanjut (FR-INS-44..52, 58). Fungsi murni gaya workflow.ts.
import { demoNow } from '@/services/mock/clock';
import type { FollowUp, FollowUpItem, Incident } from '../types';
import { isHighOrCritical } from '@/lib/severity';
import { formatDate, formatWibFull } from '@/lib/format';

import { CLOSED_AT } from './seedExtra';
import type { DecisionResult, Slice } from './workflow';
import { buildFollowUp, cancelOpenFollowUps, addWorkingDays } from './workflow.followup';

export const REOPEN_DAYS = 30;
export const MIN_REASON = 10;
export const MSG_DUE_PAST = 'Pilih tenggat setelah hari ini.';
export const MSG_DUE_REASON = `Tulis alasan minimal ${MIN_REASON} karakter.`;
export const msgReopenLate = (no: string) => `Insiden ini ditutup lebih dari ${REOPEN_DAYS} hari lalu. Laporkan sebagai insiden baru dan tautkan ke ${no}.`;

const MS = (iso: string) => new Date(iso + 'Z').getTime();
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 19);
export const addDaysIso = (at: string, n: number) => iso(MS(at) + n * 86_400_000);

const find = (s: Slice, no: string) => s.incidents.find((i) => i.no === no);
const put = (s: Slice, i: Incident): Slice => ({ ...s, incidents: s.incidents.map((x) => (x.no === i.no ? i : x)) });
const stamp = (at: string, by: string, text: string) => ({ at, by, text });

/** Waktu penutupan insiden (data penutupan, atau tanggal tutup seed). Null bila tidak diketahui. */
export const closedAtOf = (i: Incident): string | null => i.handling?.closure?.closedAt ?? CLOSED_AT[i.no] ?? null;
/** Batas buka kembali: 30 hari sejak ditutup. */
export const reopenLimit = (closedAt: string) => addDaysIso(closedAt, REOPEN_DAYS);
export const canReopen = (i: Incident, now: string = demoNow()): boolean => {
  const c = closedAtOf(i);
  return !c || MS(now) <= MS(reopenLimit(c));
};

/** Semua tindak lanjut insiden dalam bentuk baris ringkas: data lama di handling.followUps ditambah modul TL (slice followUps). */
export const followUpItemsOf = (i: Incident, fus: FollowUp[] = []): FollowUpItem[] => [
  ...(i.handling?.followUps ?? []),
  ...fus
    .filter((f) => f.incidentNo === i.no)
    .map((f): FollowUpItem => ({
      id: f.no, title: f.action, dueAt: f.dueAt, owner: f.pic, tl: f.no, tlStatus: f.status,
      status: f.status === 'selesai' ? 'selesai' : f.status === 'dibatalkan' ? 'dibatalkan' : 'dikerjakan',
    })),
];
/** Tindak lanjut yang belum selesai (berjalan atau belum dimulai). */
export const openFollowUps = (i: Incident, fus: FollowUp[] = []): FollowUpItem[] =>
  followUpItemsOf(i, fus).filter((f) => f.status === 'dikerjakan' || f.status === 'belum-dimulai');

const handling = (i: Incident) => i.handling ?? { notes: [], directives: [] };
const bad = (reason: string): DecisionResult => ({ ok: false, reason });
const missing = bad('Insiden tidak ditemukan.');

export interface CloseInput {
  /** Pejabat sudah mengonfirmasi kontrak tiap mitra */
  confirmedContracts: boolean;
  /** kontrak terpilih (menggantikan isian awal) */
  contracts?: { partner: string; ref: string }[];
  note?: string;
  /** pilihan atas tindak lanjut yang belum selesai */
  followUp?: 'lanjut' | 'batal';
  cancelReason?: string;
  at?: string;
}

/** Tutup: Minta ditutup → Ditutup. Tindak lanjut yang berjalan dilanjutkan atau dibatalkan (alasan wajib). */
export function closeIncident(s: Slice, no: string, by: string, o: CloseInput): DecisionResult {
  const i = find(s, no);
  if (!i) return missing;
  if (i.status !== 'minta-ditutup') return bad('Insiden tidak sedang menunggu penutupan.');
  const at = o.at ?? demoNow();
  const h = handling(i);
  const c = h.closure;
  if (!c) return bad('Data penutupan belum diisi PIC.');
  const contracts = o.contracts ?? c.contracts ?? [];
  if (contracts.length > 0 && (!o.confirmedContracts || contracts.some((k) => !k.ref))) return bad('Konfirmasi kontrak mitra yang terlibat.');
  const fus = s.followUps ?? [];
  const open = openFollowUps(i, fus);
  const choice = open.length > 0 ? (o.followUp ?? 'lanjut') : undefined;
  if (choice === 'batal' && !o.cancelReason?.trim()) return bad('Alasan pembatalan tindak lanjut wajib diisi.');
  const asked = c.requestedAt ?? at;
  const entries = [...(i.timeline ?? [])];
  if (!entries.some((e) => e.text.startsWith('Penutupan diajukan'))) entries.push(stamp(asked, c.requestedBy ?? i.pic ?? 'PIC', 'Penutupan diajukan'));
  const body = choice === 'lanjut' ? `Tindak lanjut dilanjutkan (${open.length}).` : choice === 'batal' ? `Tindak lanjut dibatalkan (${open.length}). Alasan: ${o.cancelReason!.trim()}` : '';
  entries.push(stamp(at, by, body ? `Ditutup: ${body}` : 'Ditutup'));
  const next: Incident = {
    ...i,
    status: 'ditutup',
    skkNotified: i.skkNotified || isHighOrCritical(i.severity),
    handling: {
      ...h,
      followUps: choice === 'batal' ? (h.followUps ?? []).map((f) => (open.some((x) => x.id === f.id) ? { ...f, status: 'dibatalkan' as const } : f)) : h.followUps,
      closure: {
        ...c, contracts, closedAt: at, closedBy: by, confirmedContracts: o.confirmedContracts, closureNote: o.note?.trim() || c.closureNote,
        followUpChoice: choice, followUpCancelReason: choice === 'batal' ? o.cancelReason!.trim() : undefined, returnReason: undefined,
      },
    },
    timeline: entries,
  };
  const state = put(s, next);
  return {
    ok: true, skkNotified: isHighOrCritical(i.severity),
    state: choice === 'batal' && s.followUps ? { ...state, followUps: cancelOpenFollowUps(fus, i.no, `Insiden ditutup. ${o.cancelReason!.trim()}`, by, at) } : state,
  };
}

/** Kembalikan ke PIC: Minta ditutup → Dalam penanganan; alasan wajib dan tampil di Detail. */
export function returnToPic(s: Slice, no: string, by: string, reason: string, at: string = demoNow()): DecisionResult {
  const i = find(s, no);
  if (!i) return missing;
  if (i.status !== 'minta-ditutup') return bad('Insiden tidak sedang menunggu penutupan.');
  if (!reason.trim()) return bad('Alasan wajib diisi.');
  const h = handling(i);
  return {
    ok: true,
    state: put(s, {
      ...i, status: 'dalam-penanganan',
      handling: { ...h, closure: h.closure ? { ...h.closure, returnReason: reason.trim() } : h.closure },
      timeline: [...(i.timeline ?? []), stamp(at, by, `Dikembalikan ke PIC: ${reason.trim()}`)],
    }),
  };
}

export interface ReassignInput { pic: string; picKind: 'perorangan' | 'grup'; reason: string; at?: string }

/** Ganti PIC (atau tunjuk PIC bila kosong). Tenggat tidak berubah. */
export function reassignPic(s: Slice, no: string, by: string, a: ReassignInput): DecisionResult {
  const i = find(s, no);
  if (!i) return missing;
  if (i.status !== 'dalam-penanganan' && i.status !== 'minta-ditutup') return bad('PIC hanya bisa diganti selama insiden berjalan.');
  if (!a.pic) return bad('Pilih PIC baru.');
  if (a.pic === i.pic) return bad('PIC baru harus berbeda dari PIC saat ini.');
  if (!a.reason.trim()) return bad('Alasan wajib diisi.');
  const h = handling(i);
  const old = i.pic ?? h.picPrev ?? 'belum ada';
  return {
    ok: true,
    state: put(s, {
      ...i, pic: a.pic, picKind: a.picKind,
      handling: { ...h, picPrev: undefined, picInactiveSince: undefined, takenBy: undefined },
      timeline: [...(i.timeline ?? []), stamp(a.at ?? demoNow(), by, `Mengganti PIC: ${old} → ${a.pic}. Alasan: ${a.reason.trim()}`)],
    }),
  };
}

export interface DueErrors { date?: string; reason?: string }
/** Validasi Ubah tenggat (PS10): tanggal harus setelah hari ini, alasan minimal 10 karakter. `date` = YYYY-MM-DD. */
export function dueErrors(date: string, reason: string, today: string = demoNow()): DueErrors {
  const e: DueErrors = {};
  if (!date || date <= today.slice(0, 10)) e.date = MSG_DUE_PAST;
  if (reason.trim().length < MIN_REASON) e.reason = MSG_DUE_REASON;
  return e;
}

/** Ubah tenggat penanganan. Jam tenggat lama dipertahankan. */
export function changeDueDate(s: Slice, no: string, by: string, date: string, reason: string, at: string = demoNow()): DecisionResult {
  const i = find(s, no);
  if (!i) return missing;
  if (i.status !== 'dalam-penanganan' && i.status !== 'minta-ditutup') return bad('Tenggat hanya bisa diubah selama insiden berjalan.');
  const err = dueErrors(date, reason, at);
  if (err.date || err.reason) return bad(err.date ?? err.reason ?? '');
  const old = i.handleDueAt;
  const next = `${date}T${(old ?? at).slice(11, 19)}`;
  const h = handling(i);
  return {
    ok: true,
    state: put(s, {
      ...i, handleDueAt: next, late: false,
      handling: { ...h, dueChangeReason: reason.trim(), dueDefaultAt: h.dueDefaultAt ?? old },
      timeline: [...(i.timeline ?? []), stamp(at, by, `Mengubah tenggat: ${old ? formatWibFull(old) : '—'} → ${formatDate(next)}. Alasan: ${reason.trim()}`)],
    }),
  };
}

/** Buka kembali: Ditutup → Dalam penanganan, hanya sampai 30 hari sejak ditutup. */
export function reopen(s: Slice, no: string, by: string, reason: string, at: string = demoNow()): DecisionResult {
  const i = find(s, no);
  if (!i) return missing;
  if (i.status !== 'ditutup') return bad('Hanya insiden Ditutup yang bisa dibuka kembali.');
  if (!canReopen(i, at)) return bad(msgReopenLate(i.no));
  if (!reason.trim()) return bad('Alasan wajib diisi.');
  const h = handling(i);
  const was = closedAtOf(i);
  return {
    ok: true,
    state: put(s, {
      ...i, status: 'dalam-penanganan',
      handling: {
        ...h, reopenedAt: at,
        closure: h.closure ? { ...h.closure, closedAt: undefined, closedBy: undefined, requestedAt: undefined, returnReason: undefined } : h.closure,
      },
      timeline: [...(i.timeline ?? []), stamp(at, by, `Dibuka kembali: ${reason.trim()}${was ? ` Penutupan ${formatWibFull(was)} tersimpan di riwayat.` : ''}`)],
    }),
  };
}

/** Jadikan arahan SKK (urutan ke-`index` di handling.directives) sebagai tindak lanjut nyata (TL-SEN-…): PIC = PIC insiden, tenggat 5 hari kerja. */
export function followUpDirective(s: Slice, no: string, by: string, index: number, at: string = demoNow()): DecisionResult {
  const i = find(s, no);
  if (!i) return missing;
  const h = handling(i);
  const d = h.directives[index];
  if (!d) return bad('Arahan tidak ditemukan.');
  if (d.followUp) return bad('Arahan ini sudah dijadikan tindak lanjut.');
  const fu = buildFollowUp(s.followUps ?? [], {
    incidentNo: no, action: d.text.slice(0, 300), pic: i.pic ?? by, dueDate: addWorkingDays(at, 5), source: 'arahan-skk', sourceLabel: d.by, by, at,
  });
  const next = put(s, {
    ...i,
    handling: { ...h, directives: h.directives.map((x, n) => (n === index ? { ...x, followUp: true } : x)) },
    timeline: [...(i.timeline ?? []), stamp(at, by, 'Arahan dijadikan tindak lanjut: ' + d.text)],
  });
  return { ok: true, state: { ...next, followUps: [fu, ...(s.followUps ?? [])] } };
}
