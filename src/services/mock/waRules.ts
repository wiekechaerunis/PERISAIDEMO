// Mesin aturan penangkapan Pemantauan WhatsApp (mock; PRD WhatsApp Sitrep Capture §7). Murni, tanpa jaringan.
// Per aturan: bagian "Abaikan bila" diperiksa lebih dulu; bila tidak diabaikan dan "Tangkap bila" cocok (kosong = semua), aturan menangkap.
// Pesan disimpan bila minimal satu aturan aktif menangkapnya. Pesan dari nomor sendiri tidak pernah ditangkap (BUG-WA-10).
import type { WaGroup, WaRule, WaRuleCond } from '../types';

export type WaKind = 'teks' | 'foto' | 'video' | 'suara' | 'lokasi' | 'dokumen';

export interface WaIncoming {
  groupId: string;
  sender: string;
  /** teks pesan (bubble tunggal); pesan gabungan memanggil mesin per bubble */
  text: string;
  kinds: WaKind[];
  /** pengirim adalah nomor organisasi sendiri */
  fromOwnNumber?: boolean;
  /** waktu kirim ISO lokal */
  at: string;
}

export interface RuleVerdict {
  captured: boolean;
  /** id aturan yang menangkap */
  ruleIds: string[];
  priority: boolean;
  /** alasan tidak ditangkap (untuk toast dan Uji aturan) */
  reason?: string;
}

/** Buang emoji, tanda format (*_~`), dan spasi berlebih sebelum mencocokkan "Diawali". */
export const normalizeStart = (t: string): string =>
  t.replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍]/gu, '').replace(/[*_~`]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

const low = (s: string) => s.toLowerCase();
/** Kata kunci: buang tanda kutip frasa dan * awalan ("demonstra*" cocok dengan demonstrasi). */
const needle = (w: string) => low(w.trim().replace(/^"(.*)"$/, "$1").replace(/[*]$/, ""));

/** Satu kelompok syarat cocok bila SEMUA syarat yang diisi terpenuhi; kelompok kosong tidak pernah cocok untuk "Abaikan" dan selalu cocok untuk "Tangkap". */
function matches(c: WaRuleCond, m: WaIncoming): boolean {
  if (c.groupIds?.length && !c.groupIds.includes(m.groupId)) return false;
  if (c.senders?.length && !c.senders.some((s) => low(s) === low(m.sender))) return false;
  if (c.startsWith?.length) {
    const head = normalizeStart(m.text);
    if (!c.startsWith.some((p) => head.startsWith(normalizeStart(p)))) return false;
  }
  if (c.containsAny?.length && !c.containsAny.some((w) => low(m.text).includes(needle(w)))) return false;
  if (c.containsAll?.length && !c.containsAll.every((w) => low(m.text).includes(needle(w)))) return false;
  if (c.kinds?.length && !c.kinds.some((k) => m.kinds.includes(k as WaKind))) return false;
  if (c.minLen != null && m.text.trim().length < c.minLen) return false;
  if (c.maxLen != null && m.text.trim().length > c.maxLen) return false;
  return true;
}

export const condIsEmpty = (c: WaRuleCond): boolean =>
  !c.groupIds?.length && !c.senders?.length && !c.startsWith?.length && !c.containsAny?.length && !c.containsAll?.length && !c.kinds?.length && c.minLen == null && c.maxLen == null;

/** Evaluasi satu pesan terhadap semua aturan aktif. */
export function evaluate(m: WaIncoming, rules: WaRule[], groups: WaGroup[] = []): RuleVerdict {
  if (m.fromOwnNumber) return { captured: false, ruleIds: [], priority: false, reason: 'Pesan dari nomor sendiri tidak ditangkap.' };
  const group = groups.find((g) => g.id === m.groupId);
  if (group && !group.monitored) return { captured: false, ruleIds: [], priority: false, reason: 'Grup tidak dipantau.' };
  const hit: WaRule[] = [];
  let ignoredBy: string | undefined;
  for (const r of rules.filter((x) => x.enabled)) {
    if (!condIsEmpty(r.ignore) && matches(r.ignore, m)) { ignoredBy ??= r.name; continue; }
    if (condIsEmpty(r.capture) || matches(r.capture, m)) hit.push(r);
  }
  if (!hit.length) return { captured: false, ruleIds: [], priority: false, reason: ignoredBy ? `Diabaikan aturan ${ignoredBy}.` : 'Tidak cocok dengan aturan mana pun.' };
  return { captured: true, ruleIds: hit.map((r) => r.id), priority: hit.some((r) => r.priority) };
}

/** Uji aturan (editor): tempel teks, tampil cocok atau tidak beserta alasannya. */
export function testRule(rule: WaRule, text: string): { match: boolean; reason: string } {
  const m: WaIncoming = { groupId: rule.capture.groupIds?.[0] ?? '', sender: rule.capture.senders?.[0] ?? 'Pengirim uji', text, kinds: ['teks'], at: '' };
  if (!condIsEmpty(rule.ignore) && matches(rule.ignore, { ...m, kinds: ['teks'] })) return { match: false, reason: 'Diabaikan oleh syarat "Abaikan bila".' };
  const ok = condIsEmpty(rule.capture) || matches(rule.capture, m);
  return ok ? { match: true, reason: 'Cocok dengan syarat "Tangkap bila".' } : { match: false, reason: 'Tidak memenuhi syarat "Tangkap bila".' };
}

/** Pesan lanjutan: pengirim dan grup sama, dalam batas `count` pesan dan `minutes` menit dari pesan induk. */
export function isFollowUp(prev: { groupId?: string; sender: string; at: string; bubbles: number } | undefined, m: WaIncoming, rule: { count: number; minutes: number } | undefined): boolean {
  if (!prev || !rule || prev.groupId !== m.groupId || low(prev.sender) !== low(m.sender)) return false;
  if (prev.bubbles >= rule.count) return false;
  const gap = (new Date(m.at + 'Z').getTime() - new Date(prev.at + 'Z').getTime()) / 60_000;
  return gap >= 0 && gap <= rule.minutes;
}
