// Util daftar Pesan masuk (papan V2-01..06b): status, tampilan waktu, dan penyaringan.
import { formatWib } from '@/lib/format';
import { demoNow } from '@/services/mock/clock';
import type { WaMessage } from '@/services/types';

export type StatusKey = 'Perlu ditinjau' | 'Rutin' | 'Tidak relevan' | 'Diproses';
export type Quick = 'Semua' | 'Prioritas' | 'Perlu ditinjau' | 'Tidak relevan';
export const QUICKS: Quick[] = ['Semua', 'Prioritas', 'Perlu ditinjau', 'Tidak relevan'];
export const STATUS_KEYS: StatusKey[] = ['Perlu ditinjau', 'Rutin', 'Tidak relevan', 'Diproses'];
export type RangeKey = '' | '24j' | '7h' | '30h' | 'rentang';
export const RANGES: { key: Exclude<RangeKey, ''>; label: string }[] = [
  { key: '24j', label: '24 jam terakhir' }, { key: '7h', label: '7 hari' }, { key: '30h', label: '30 hari' }, { key: 'rentang', label: 'Rentang tanggal' },
];

export interface Filters {
  status: StatusKey[];
  numbers: string[];
  tags: string[];
  groups: string[];
  senders: string[];
  rules: string[];
  range: RangeKey;
  from: string;
  to: string;
}
export const NO_FILTER: Filters = { status: [], numbers: [], tags: [], groups: [], senders: [], rules: [], range: '', from: '', to: '' };
export const isFiltering = (f: Filters) =>
  !!(f.status.length || f.numbers.length || f.tags.length || f.groups.length || f.senders.length || f.rules.length || f.range);

/** Kelompok status daftar: Draf dan Diproses digabung ke Diproses. */
export const statusOf = (m: WaMessage): StatusKey =>
  m.status === 'baru' ? 'Perlu ditinjau' : m.status === 'rutin' ? 'Rutin' : m.status === 'tidak-relevan' ? 'Tidak relevan' : 'Diproses';
export const isPriority = (m: WaMessage) => !!m.priority && m.status === 'baru';

/** "20 Okt, 20:54 WIB" */
export const shortWib = (iso: string) => `${formatWib(iso).replace(/ \d{4},/, ',')} WIB`;

const HOURS: Record<string, number> = { '24j': 24, '7h': 24 * 7, '30h': 24 * 30 };
const ms = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).getTime();

export interface Lookups { groupTag: (groupId?: string) => string | undefined }

export function matches(m: WaMessage, q: string, f: Filters, quick: Quick, lk: Lookups): boolean {
  if (quick === 'Prioritas' && !isPriority(m)) return false;
  if (quick === 'Perlu ditinjau' && statusOf(m) !== 'Perlu ditinjau') return false;
  if (quick === 'Tidak relevan' && statusOf(m) !== 'Tidak relevan') return false;
  if (f.status.length && !f.status.includes(statusOf(m))) return false;
  if (f.numbers.length && !(m.numberId && f.numbers.includes(m.numberId))) return false;
  if (f.groups.length && !(m.groupId && f.groups.includes(m.groupId))) return false;
  if (f.tags.length) { const t = lk.groupTag(m.groupId); if (!t || !f.tags.includes(t)) return false; }
  if (f.senders.length && !f.senders.includes(m.sender)) return false;
  if (f.rules.length && !m.ruleIds?.some((r) => f.rules.includes(r))) return false;
  if (f.range && f.range !== 'rentang') {
    if (ms(m.at) < ms(demoNow()) - HOURS[f.range] * 3600_000) return false;
  }
  if (f.range === 'rentang') {
    if (f.from && ms(m.at) < ms(f.from)) return false;
    if (f.to && ms(m.at) >= ms(f.to) + 86_400_000) return false;
  }
  const s = q.trim().toLowerCase();
  if (s && ![m.text, m.sender, m.group, ...(m.bubbles ?? []).map((b) => b.text)].some((x) => x.toLowerCase().includes(s))) return false;
  return true;
}
