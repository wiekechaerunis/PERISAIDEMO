// Pembantu model aturan untuk editor Aturan (board V2-30..32): jenis pesan, kata kunci ATAU/DAN, ringkasan chip tabel.
import type { WaRule, WaRuleCond } from '@/services/types';

export const KINDS: { key: string; label: string }[] = [
  { key: 'teks', label: 'Teks' },
  { key: 'foto', label: 'Foto' },
  { key: 'video', label: 'Video' },
  { key: 'suara', label: 'Pesan suara' },
  { key: 'dokumen', label: 'Dokumen' },
  { key: 'lokasi', label: 'Lokasi' },
];
export const KIND_KEYS = KINDS.map((k) => k.key);

/** Jenis pesan yang dipilih; kosong/tidak diisi = semua jenis. */
export const selectedKinds = (c: WaRuleCond): string[] => (c.kinds?.length ? c.kinds : KIND_KEYS);

export const setKinds = (c: WaRuleCond, sel: string[]): WaRuleCond => ({ ...c, kinds: sel.length === KIND_KEYS.length ? undefined : sel });

export type KeyMode = 'any' | 'all';
export const keyMode = (c: WaRuleCond): KeyMode => (c.containsAll?.length && !c.containsAny?.length ? 'all' : 'any');
export const keywords = (c: WaRuleCond): string[] => (keyMode(c) === 'all' ? c.containsAll ?? [] : c.containsAny ?? []);
export const withKeywords = (c: WaRuleCond, mode: KeyMode, words: string[]): WaRuleCond => ({
  ...c,
  containsAny: mode === 'any' && words.length ? words : undefined,
  containsAll: mode === 'all' && words.length ? words : undefined,
});

/** Syarat lanjutan yang tidak punya kontrol di papan (diawali, panjang teks) tetap dipertahankan dan hanya ditampilkan. */
export const extraNote = (c: WaRuleCond): string => {
  const p: string[] = [];
  if (c.startsWith?.length) p.push(`diawali ${c.startsWith.join(', ')}`);
  if (c.minLen != null) p.push(`panjang teks minimal ${c.minLen}`);
  if (c.maxLen != null) p.push(`panjang teks maksimal ${c.maxLen}`);
  return p.join('; ');
};

export const kindLabel = (k: string): string => KINDS.find((x) => x.key === k)?.label ?? k;

/** Chip ringkasan untuk kolom "Abaikan bila" / "Tangkap bila". Kosong = tidak ada chip. */
export const condChips = (c: WaRuleCond): string[] => [
  ...(c.containsAny ?? []),
  ...(c.containsAll ?? []),
  ...(c.startsWith ?? []),
  ...(c.kinds?.length ? c.kinds.map(kindLabel) : []),
  ...(c.minLen != null ? [`min. ${c.minLen} karakter`] : []),
  ...(c.maxLen != null ? [`maks. ${c.maxLen} karakter`] : []),
];

export const sourceChips = (r: WaRule, groupName: (id: string) => string): string[] => {
  const g = r.capture.groupIds?.length ? r.capture.groupIds.map(groupName) : ['Semua grup'];
  return r.capture.senders?.length ? [...g, ...r.capture.senders] : g;
};

export const splitWords = (t: string): string[] => t.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
