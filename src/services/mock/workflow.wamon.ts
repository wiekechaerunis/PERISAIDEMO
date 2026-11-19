// Transisi Pemantauan WhatsApp v2 (mock): tangkap pesan, nomor, grup, aturan. Fungsi murni atas irisan `WaMon`; gateway WhatsApp ditiru.
import type { WaGroup, WaMessage, WaNumber, WaRule } from '../types';
import { WA_MAX_NUMBERS } from '../types';
import { demoNow } from './clock';
import { evaluate, isFollowUp, type RuleVerdict, type WaKind } from './waRules';

export interface WaMon {
  waMessages: WaMessage[];
  waNumbers: WaNumber[];
  waGroups: WaGroup[];
  waRules: WaRule[];
  waTerms: string[];
}
export type WaResult<T = object> = ({ ok: true; state: Partial<WaMon> } & T) | { ok: false; reason: string };
const bad = (reason: string): { ok: false; reason: string } => ({ ok: false, reason });

export const MAX_IRRELEVANT_NOTE = 200;
export const IRRELEVANT_REASONS = ['Salah tangkap', 'Bukan laporan keamanan', 'Duplikat', 'Uji coba', 'Lainnya'] as const;

export interface SimMessage {
  groupId: string;
  sender: string;
  senderRole?: string;
  text: string;
  kinds?: WaKind[];
  photos?: string[];
  fromOwnNumber?: boolean;
  at?: string;
}

const nextId = (list: WaMessage[]) => `WAM-${String(Math.max(0, ...list.map((m) => Number(m.id.replace(/\D/g, '')) || 0)) + 1).padStart(3, '0')}`;

/** Kirim pesan dari panel simulasi: lewat mesin aturan; ditangkap → pesan baru atau bergabung sebagai bubble lanjutan. */
export function ingest(s: WaMon, m: SimMessage): WaResult<{ verdict: RuleVerdict; merged: boolean; id?: string }> {
  const group = s.waGroups.find((g) => g.id === m.groupId);
  if (!group) return bad('Grup tidak ditemukan.');
  const number = s.waNumbers.find((n) => n.id === group.numberId);
  if (!number || number.status !== 'terhubung') {
    return { ok: true, state: {}, verdict: { captured: false, ruleIds: [], priority: false, reason: 'Nomor tidak terhubung.' }, merged: false };
  }
  const at = m.at ?? demoNow();
  const verdict = evaluate({ groupId: m.groupId, sender: m.sender, text: m.text, kinds: m.kinds ?? ['teks'], fromOwnNumber: m.fromOwnNumber, at }, s.waRules, s.waGroups);
  if (!verdict.captured) return { ok: true, state: {}, verdict, merged: false };

  // pesan lanjutan: bubble dari pengirim dan grup yang sama dalam jendela N pesan / M menit
  const prev = [...s.waMessages].filter((x) => x.groupId === m.groupId && x.sender === m.sender && x.status === 'baru').sort((a, b) => b.at.localeCompare(a.at))[0];
  const rule = s.waRules.find((r) => prev?.ruleIds?.includes(r.id) && r.followUp)?.followUp;
  if (prev && isFollowUp({ groupId: prev.groupId, sender: prev.sender, at: prev.bubbles?.at(-1)?.at ?? prev.at, bubbles: 1 + (prev.bubbles?.length ?? 0) }, { groupId: m.groupId, sender: m.sender, text: m.text, kinds: [], at }, rule)) {
    const merged: WaMessage = {
      ...prev, bubbles: [...(prev.bubbles ?? []), { text: m.text, at }],
      photos: [...prev.photos, ...(m.photos ?? []).map((n, i) => ({ id: `${prev.id}-b${(prev.bubbles?.length ?? 0) + 1}-${i}`, name: n, sizeKb: 1500 }))],
    };
    return { ok: true, state: { waMessages: s.waMessages.map((x) => (x.id === prev.id ? merged : x)) }, verdict, merged: true, id: prev.id };
  }
  const id = nextId(s.waMessages);
  const msg: WaMessage = {
    id, sender: m.sender, senderRole: m.senderRole ?? '', group: group.name, groupId: group.id, numberId: number.id,
    text: m.text, at, photos: (m.photos ?? []).map((n, i) => ({ id: `${id}-${i}`, name: n, sizeKb: 1500 })),
    status: 'baru', priority: verdict.priority || undefined, ruleIds: verdict.ruleIds, links: [],
  };
  return { ok: true, state: { waMessages: [msg, ...s.waMessages] }, verdict, merged: false, id };
}

/** Tandai rutin, tandai tidak relevan, buka kembali: pesan yang sudah diproses orang lain ditolak. */
function guard(s: WaMon, id: string, by: string): { m: WaMessage } | { err: { ok: false; reason: string } } {
  const m = s.waMessages.find((x) => x.id === id);
  if (!m) return { err: bad('Pesan tidak ditemukan.') };
  if ((m.status === 'diproses' || m.status === 'draf') && m.handledBy && m.handledBy !== by) {
    return { err: bad(`Pesan ini sudah diproses oleh ${m.handledBy} pada ${(m.handledAt ?? '').slice(11, 16)}.`) };
  }
  return { m };
}
const put = (s: WaMon, m: WaMessage): Partial<WaMon> => ({ waMessages: s.waMessages.map((x) => (x.id === m.id ? m : x)) });

export function markRoutine(s: WaMon, id: string, by: string): WaResult {
  const g = guard(s, id, by);
  if ('err' in g) return g.err;
  if (g.m.status !== 'baru') return bad('Hanya pesan Perlu ditinjau yang bisa ditandai rutin.');
  return { ok: true, state: put(s, { ...g.m, status: 'rutin', handledBy: by, handledAt: demoNow() }) };
}

export function markIrrelevant(s: WaMon, id: string, by: string, reason: string, note = ''): WaResult {
  const g = guard(s, id, by);
  if ('err' in g) return g.err;
  if (!(IRRELEVANT_REASONS as readonly string[]).includes(reason)) return bad('Pilih alasan.');
  if (reason === 'Lainnya' && !note.trim()) return bad('Tulis catatan untuk alasan Lainnya.');
  if (note.length > MAX_IRRELEVANT_NOTE) return bad(`Catatan maksimal ${MAX_IRRELEVANT_NOTE} karakter.`);
  const text = reason === 'Lainnya' ? note.trim() : reason;
  return { ok: true, state: put(s, { ...g.m, status: 'tidak-relevan', irrelevantReason: text, handledBy: by, handledAt: demoNow() }) };
}

export function reopen(s: WaMon, id: string, by: string): WaResult {
  const m = s.waMessages.find((x) => x.id === id);
  if (!m) return bad('Pesan tidak ditemukan.');
  if (m.status !== 'rutin' && m.status !== 'tidak-relevan') return bad('Hanya pesan Rutin atau Tidak relevan yang bisa dibuka kembali.');
  return { ok: true, state: put(s, { ...m, status: 'baru', irrelevantReason: undefined, handledBy: by, handledAt: demoNow() }) };
}

// ---- nomor ----
const activeCount = (s: WaMon) => s.waNumbers.length;

export function createNumber(s: WaMon, label: string, phone: string): WaResult<{ id: string }> {
  if (!label.trim()) return bad('Isi label nomor.');
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return bad('Isi nomor WhatsApp yang valid.');
  if (s.waNumbers.some((n) => n.phone.replace(/\D/g, '') === digits)) return bad('Nomor ini sudah tertaut.');
  if (activeCount(s) >= WA_MAX_NUMBERS) return bad(`Kuota nomor habis (${WA_MAX_NUMBERS}/${WA_MAX_NUMBERS}). Lepas satu nomor untuk menautkan yang baru.`);
  const id = `N${Math.max(0, ...s.waNumbers.map((n) => Number(n.id.slice(1)) || 0)) + 1}`;
  return { ok: true, id, state: { waNumbers: [...s.waNumbers, { id, label: label.trim(), phone: phone.trim(), status: 'menunggu', devices: [] }] } };
}

/** Panel simulasi memindai QR (atau memasukkan kode) dari ponsel dengan nomor `phone`. */
export function scanLink(s: WaMon, numberId: string, phone: string, device = 'Google Chrome (PERISAI)'): WaResult {
  const n = s.waNumbers.find((x) => x.id === numberId);
  if (!n) return bad('Nomor tidak ditemukan.');
  if (n.status !== 'menunggu') return bad('Nomor ini tidak sedang menunggu dipindai.');
  if (n.phone.replace(/\D/g, '') !== phone.replace(/\D/g, '')) return bad('Nomor yang memindai berbeda dengan nomor yang ditautkan.');
  if (n.devices.length >= 4) return bad('Ponsel ini sudah memiliki 4 perangkat tertaut.');
  return { ok: true, state: { waNumbers: s.waNumbers.map((x) => (x.id === n.id ? { ...x, status: 'terhubung', linkedAt: demoNow(), devices: [...x.devices, device] } : x)) } };
}

/** Lepas perangkat dari ponsel: nomor di PERISAI Terputus. */
export function unlinkDevice(s: WaMon, numberId: string): WaResult {
  return { ok: true, state: { waNumbers: s.waNumbers.map((x) => (x.id === numberId ? { ...x, status: 'terputus', devices: [] } : x)) } };
}

/** Ubah label nomor (V2-23). */
export function renameNumber(s: WaMon, numberId: string, label: string): WaResult {
  if (!label.trim()) return bad('Isi label nomor.');
  if (!s.waNumbers.some((x) => x.id === numberId)) return bad('Nomor tidak ditemukan.');
  return { ok: true, state: { waNumbers: s.waNumbers.map((x) => (x.id === numberId ? { ...x, label: label.trim() } : x)) } };
}

/** Tautkan ulang nomor yang Terputus: kembali Menunggu dipindai (V2-22). */
export function relinkNumber(s: WaMon, numberId: string): WaResult {
  const n = s.waNumbers.find((x) => x.id === numberId);
  if (!n) return bad('Nomor tidak ditemukan.');
  if (n.status !== 'terputus' && n.status !== 'menunggu') return bad('Tautkan ulang hanya bila status Perlu ditautkan ulang.');
  return { ok: true, state: { waNumbers: s.waNumbers.map((x) => (x.id === numberId ? { ...x, status: 'menunggu', devices: [] } : x)) } };
}

export function suspendNumber(s: WaMon, numberId: string, reason: string): WaResult {
  if (!reason.trim()) return bad('Tulis alasan.');
  return { ok: true, state: { waNumbers: s.waNumbers.map((x) => (x.id === numberId ? { ...x, status: 'ditangguhkan', suspendedReason: reason.trim() } : x)) } };
}
export function resumeNumber(s: WaMon, numberId: string): WaResult {
  return { ok: true, state: { waNumbers: s.waNumbers.map((x) => (x.id === numberId ? { ...x, status: 'terhubung', suspendedReason: undefined } : x)) } };
}
export function releaseNumber(s: WaMon, numberId: string, reason: string): WaResult {
  if (!reason.trim()) return bad('Tulis alasan.');
  return { ok: true, state: { waNumbers: s.waNumbers.filter((x) => x.id !== numberId), waGroups: s.waGroups.filter((g) => g.numberId !== numberId) } };
}

// ---- grup ----
export const MAX_GROUP_TAGS = 10;
export const MAX_TAG_LEN = 30;
export const MAX_GROUP_DESC = 500;
export interface GroupMeta { tags?: string[]; description?: string }

function checkMeta(meta?: GroupMeta): string | null {
  if ((meta?.tags ?? []).length > MAX_GROUP_TAGS) return `Paling banyak ${MAX_GROUP_TAGS} tag.`;
  if ((meta?.tags ?? []).some((t) => t.length > MAX_TAG_LEN)) return `Tag paling banyak ${MAX_TAG_LEN} karakter.`;
  if ((meta?.description ?? '').length > MAX_GROUP_DESC) return `Keterangan paling banyak ${MAX_GROUP_DESC} karakter.`;
  return null;
}

export function setGroupMonitor(s: WaMon, groupId: string, on: boolean, wk?: string, area?: string, meta?: GroupMeta): WaResult {
  const g = s.waGroups.find((x) => x.id === groupId);
  if (!g) return bad('Grup tidak ditemukan.');
  if (on && !(wk ?? g.wk)) return bad('Pilih wilayah kerja untuk grup ini.');
  const m = on ? checkMeta(meta) : null;
  if (m) return bad(m);
  return { ok: true, state: { waGroups: s.waGroups.map((x) => (x.id === groupId ? {
    ...x, monitored: on, wk: on ? wk ?? x.wk : x.wk, area: on ? area ?? x.area : x.area, isNew: false,
    tags: on && meta?.tags ? meta.tags : x.tags, description: on && meta?.description !== undefined ? meta.description : x.description,
    monitoredSince: on ? (x.monitored ? x.monitoredSince : demoNow().slice(0, 10)) : undefined,
  } : x)) } };
}
/** Ubah wilayah kerja, area, tag, dan keterangan grup yang sedang dipantau (board V2-55). */
export function updateGroup(s: WaMon, groupId: string, v: { wk: string; area?: string } & GroupMeta): WaResult {
  const g = s.waGroups.find((x) => x.id === groupId);
  if (!g) return bad('Grup tidak ditemukan.');
  if (!v.wk) return bad('Pilih wilayah kerja untuk grup ini.');
  const m = checkMeta(v);
  if (m) return bad(m);
  return { ok: true, state: { waGroups: s.waGroups.map((x) => (x.id === groupId ? { ...x, wk: v.wk, area: v.area || undefined, tags: v.tags ?? x.tags, description: v.description ?? x.description } : x)) } };
}
/** Berhenti memantau: pesan baru tidak dibaca lagi, pesan yang sudah masuk tetap ada (board V2-57). */
export function stopMonitoring(s: WaMon, groupId: string): WaResult {
  if (!s.waGroups.some((x) => x.id === groupId)) return bad('Grup tidak ditemukan.');
  return { ok: true, state: { waGroups: s.waGroups.map((x) => (x.id === groupId ? { ...x, monitored: false, monitoredSince: undefined } : x)) } };
}
export function simulateRemoved(s: WaMon, groupId: string): WaResult {
  return { ok: true, state: { waGroups: s.waGroups.map((x) => (x.id === groupId ? { ...x, removed: true, monitored: false } : x)) } };
}
export function simulateNewGroup(s: WaMon, numberId: string, name: string): WaResult {
  const id = `G${Math.max(0, ...s.waGroups.map((g) => Number(g.id.slice(1)) || 0)) + 1}`;
  return { ok: true, state: { waGroups: [...s.waGroups, { id, numberId, name, monitored: false, isNew: true }] } };
}

// ---- aturan ----
export function saveRule(s: WaMon, rule: WaRule): WaResult {
  if (!rule.name.trim()) return bad('Isi nama aturan.');
  const exists = s.waRules.some((r) => r.id === rule.id);
  return { ok: true, state: { waRules: exists ? s.waRules.map((r) => (r.id === rule.id ? rule : r)) : [...s.waRules, rule] } };
}
export function toggleRule(s: WaMon, id: string, enabled: boolean): WaResult {
  return { ok: true, state: { waRules: s.waRules.map((r) => (r.id === id ? { ...r, enabled } : r)) } };
}
export function deleteRule(s: WaMon, id: string): WaResult {
  const r = s.waRules.find((x) => x.id === id);
  if (!r) return bad('Aturan tidak ditemukan.');
  if (r.builtin) return bad('Aturan bawaan tidak bisa dihapus, hanya dimatikan.');
  return { ok: true, state: { waRules: s.waRules.filter((x) => x.id !== id) } };
}

export function acceptTerms(s: WaMon, by: string): WaResult {
  return { ok: true, state: { waTerms: s.waTerms.includes(by) ? s.waTerms : [...s.waTerms, by] } };
}
