// Transisi insiden dari pesan WhatsApp (INS-05): buat/hapus draf, ajukan, tautkan pesan ke insiden, lepas tautan.
// Fungsi murni: menerima state, mengembalikan state baru (dipanggil lewat useDemoStore.getState().decide).
import { demoNow } from '@/services/mock/clock';
import type { Incident, WaAiField, WaDraft, WaLinkRecord, WaMessage } from '../types';
import type { ReportDraft } from '@/features/insiden/logic/draft';
import { buildIncident, nextNumber } from '@/features/insiden/logic/submit';
import { isLinkable, waDuplicates } from '@/features/whatsapp/logic/duplicates';
import { ORG } from './seed';
import type { DecisionResult, Slice } from './workflow';

export const MIN_UNLINK_REASON = 10;
export const MAX_UNLINK_REASON = 500;
export const MSG_WA_UNLINK_SHORT = 'Tulis alasan minimal 10 karakter.';

const msgsOf = (s: Slice): WaMessage[] => s.waMessages ?? [];
const draftsOf = (s: Slice): WaDraft[] => s.waDrafts ?? [];
const putMsg = (s: Slice, m: WaMessage): Slice => ({ ...s, waMessages: msgsOf(s).map((x) => (x.id === m.id ? m : x)) });
const stamp = (by: string, text: string) => ({ at: demoNow(), by, text });
export const draftIdOf = (messageId: string) => `WAD-${messageId.replace(/^WAM-/, '')}`;
export const activeLink = (m: WaMessage): WaLinkRecord | undefined => [...m.links].reverse().find((l) => !l.releasedAt);
const hhmm = (iso: string) => iso.slice(11, 16).replace(':', '.');
export const quoteOf = (m: WaMessage) => `${m.sender} (${m.senderRole}) di grup ${m.group}, ${hhmm(m.at)}: "${m.text}"`;

export interface CreateWaDraftInput {
  messageId: string;
  by: string;
  form: ReportDraft;
  ai: Record<string, WaAiField>;
  aiState: 'ok' | 'gagal';
}

/** Jadikan draf laporan: pesan Baru → Draf. Bila pesan sudah punya draf, state tidak berubah. */
export function createWaDraft(s: Slice, a: CreateWaDraftInput): DecisionResult {
  const m = msgsOf(s).find((x) => x.id === a.messageId);
  if (!m) return { ok: false, reason: 'Pesan tidak ditemukan.' };
  if (m.draftId && draftsOf(s).some((d) => d.id === m.draftId)) return { ok: true, state: s };
  if (m.status === 'diproses') return { ok: false, reason: 'Pesan ini sudah diproses.' };
  const draft: WaDraft = {
    id: draftIdOf(m.id), messageId: m.id, createdAt: demoNow(), createdBy: a.by, form: a.form, ai: a.ai, aiState: a.aiState, dupChoice: null,
  };
  return { ok: true, state: putMsg({ ...s, waDrafts: [draft, ...draftsOf(s)] }, { ...m, status: 'draf', draftId: draft.id }) };
}

/** Hapus draf (opsi C, I22b): isian dan lampiran draf hilang; pesan sumber kembali Baru dan tetap ada. */
export function deleteWaDraft(s: Slice, draftId: string): DecisionResult {
  const d = draftsOf(s).find((x) => x.id === draftId);
  if (!d) return { ok: false, reason: 'Draf tidak ditemukan.' };
  const state = { ...s, waDrafts: draftsOf(s).filter((x) => x.id !== draftId) };
  const m = msgsOf(s).find((x) => x.id === d.messageId);
  if (!m) return { ok: true, state };
  return { ok: true, state: putMsg(state, { ...m, status: 'baru', draftId: undefined }) };
}

/** Ajukan draf WhatsApp: masuk Menunggu pemeriksaan sebagai insiden `source: 'wa'`. Kemungkinan ganda harus diputuskan dulu. */
export function submitWaDraft(s: Slice, draftId: string, by: string): DecisionResult {
  const d = draftsOf(s).find((x) => x.id === draftId);
  if (!d) return { ok: false, reason: 'Draf tidak ditemukan.' };
  const m = msgsOf(s).find((x) => x.id === d.messageId);
  if (!m) return { ok: false, reason: 'Pesan tidak ditemukan.' };
  const f = d.form;
  if (!f.title.trim() || !f.date || !f.time || !f.locationName || !f.category || !f.securityImpact.trim() || f.axes.length === 0) {
    return { ok: false, reason: 'Lengkapi isian wajib dulu.' };
  }
  if (d.dupChoice === null && waDuplicates(f, s.incidents, s.config).length > 0) {
    return { ok: false, reason: 'Putuskan dulu kemungkinan laporan ganda.' };
  }
  const no = nextNumber('INS-SEN', s.incidents.map((i) => i.no));
  const base = buildIncident(f, no, by, ORG, s.config);
  const inc: Incident = {
    ...base, source: 'wa', possibleDuplicate: d.dupChoice === 'tetap',
    timeline: [
      { at: d.createdAt, by: d.createdBy, text: 'Draf dibuat dari pesan WhatsApp' },
      { at: demoNow(), by, text: 'Mengajukan laporan.' },
    ],
  };
  const link: WaLinkRecord = { incidentNo: no, kind: 'laporan', by, at: demoNow() };
  const state = { ...s, incidents: [inc, ...s.incidents], waDrafts: draftsOf(s).filter((x) => x.id !== draftId) };
  return { ok: true, state: putMsg(state, { ...m, status: 'diproses', draftId: undefined, links: [...m.links, link] }) };
}

const withPhotos = (i: Incident, m: WaMessage): Incident['detail'] => {
  if (!i.detail || m.photos.length === 0) return i.detail;
  const have = new Set(i.detail.attachments.map((a) => a.name));
  const add = m.photos
    .filter((p) => !have.has(p.name))
    .map((p) => ({ name: p.name, sizeKb: p.sizeKb, caption: `Dari WhatsApp · ${m.sender}, ${m.at.slice(11, 16)}` }));
  return { ...i.detail, attachments: [...i.detail.attachments, ...add] };
};

/**
 * Tautkan pesan ke insiden (I24; opsi A di I22): isi dan foto pesan masuk ke Riwayat insiden sebagai entri "Dari WhatsApp".
 * Hanya insiden Menunggu pemeriksaan atau Dalam penanganan. Draf pesan (bila ada) ikut dihapus.
 */
export function linkMessageToIncident(s: Slice, messageId: string, incidentNo: string, by: string): DecisionResult {
  const m = msgsOf(s).find((x) => x.id === messageId);
  if (!m) return { ok: false, reason: 'Pesan tidak ditemukan.' };
  if (activeLink(m)) return { ok: false, reason: 'Pesan ini sudah ditautkan.' };
  const i = s.incidents.find((x) => x.no === incidentNo);
  if (!i) return { ok: false, reason: 'Insiden tidak ditemukan.' };
  if (!isLinkable(i)) return { ok: false, reason: 'Insiden ini sudah tidak bisa ditautkan.' };
  const next: Incident = { ...i, detail: withPhotos(i, m), timeline: [...(i.timeline ?? []), stamp(by, `Pesan ditautkan: ${quoteOf(m)}`)] };
  const link: WaLinkRecord = { incidentNo, kind: 'tautan', by, at: demoNow() };
  const state: Slice = {
    ...s, incidents: s.incidents.map((x) => (x.no === incidentNo ? next : x)),
    waDrafts: draftsOf(s).filter((x) => x.messageId !== messageId),
  };
  return { ok: true, state: putMsg(state, { ...m, status: 'diproses', draftId: undefined, links: [...m.links, link] }) };
}

/** Lepas tautan (I25, Pejabat): pesan kembali Baru; entri Riwayat tidak dihapus, diberi tanda "Tautan dilepas"; foto tetap di insiden. */
export function unlinkMessage(s: Slice, messageId: string, incidentNo: string, by: string, reason: string): DecisionResult {
  const m = msgsOf(s).find((x) => x.id === messageId);
  if (!m) return { ok: false, reason: 'Pesan tidak ditemukan.' };
  const link = activeLink(m);
  if (!link || link.incidentNo !== incidentNo) return { ok: false, reason: 'Pesan ini tidak sedang ditautkan ke insiden itu.' };
  if (link.kind === 'laporan') return { ok: false, reason: 'Pesan ini sumber laporan, tautannya tidak bisa dilepas.' };
  const r = reason.trim();
  if (r.length < MIN_UNLINK_REASON) return { ok: false, reason: MSG_WA_UNLINK_SHORT };
  if (r.length > MAX_UNLINK_REASON) return { ok: false, reason: 'Alasan maksimal 500 karakter.' };
  const i = s.incidents.find((x) => x.no === incidentNo);
  if (!i) return { ok: false, reason: 'Insiden tidak ditemukan.' };
  const links = m.links.map((l) => (l === link ? { ...l, releasedBy: by, releasedAt: demoNow(), releaseReason: r } : l));
  const next: Incident = { ...i, timeline: [...(i.timeline ?? []), stamp(by, `Tautan pesan WhatsApp dilepas: ${r}`)] };
  const state: Slice = { ...s, incidents: s.incidents.map((x) => (x.no === incidentNo ? next : x)) };
  return { ok: true, state: putMsg(state, { ...m, status: 'baru', links }) };
}
