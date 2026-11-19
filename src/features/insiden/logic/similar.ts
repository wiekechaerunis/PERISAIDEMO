// Bahan pertimbangan dari insiden serupa (board V12, V12f, V12g). Logika murni: tanpa React.
import { demoNow } from '@/services/mock/clock';
import type { Incident } from '@/services/types';

import { MAP_REF, STEP_CATALOG } from '@/services/mock/seedHistory';
import { formatNumber } from '@/lib/format';

export type SimilarMode = 'full' | 'few' | 'none';
export type PatternKey = 'night' | 'remote' | 'panel' | 'cut';

export const MIN_CASES = 3;
export const STRICT_MONTHS = 18;
export const WIDE_MONTHS = 36;

const monthsAgo = (now: string, m: number) => {
  const d = new Date(now + 'Z');
  d.setUTCMonth(d.getUTCMonth() - m);
  return d.getTime();
};
const at = (iso: string) => new Date(iso + 'Z').getTime();

/** Teks bebas insiden yang dipakai untuk menyimpulkan pola (di produk: disimpulkan AI dari isi laporan). */
const textOf = (i: Incident) => `${i.title} ${i.detail?.story ?? ''} ${i.location} ${i.detail?.patokan ?? ''}`.toLowerCase();
const hourOf = (i: Incident) => parseInt(i.occurredAt.slice(11, 13), 10);

export interface PatternDef {
  key: PatternKey;
  dim: 'Waktu' | 'Lokasi' | 'Sasaran' | 'Modus';
  label: string;
  /** true bila disimpulkan AI dari isi laporan (bukan dari field terstruktur) */
  ai: boolean;
  source: string;
  test: (i: Incident) => boolean;
}
export const PATTERN_DEFS: PatternDef[] = [
  { key: 'night', dim: 'Waktu', label: 'Malam hari, 22.00–04.00', ai: false, source: 'Dari jam kejadian', test: (i) => hourOf(i) >= 22 || hourOf(i) < 4 },
  { key: 'remote', dim: 'Lokasi', label: 'Area sumur terpencil', ai: true, source: 'Disimpulkan AI dari isi laporan', test: (i) => /sumur|terpencil/.test(textOf(i)) },
  { key: 'panel', dim: 'Sasaran', label: 'Kabel panel atau pompa', ai: true, source: 'Disimpulkan AI dari isi laporan', test: (i) => /kabel/.test(textOf(i)) && /panel|pompa/.test(textOf(i)) },
  { key: 'cut', dim: 'Modus', label: 'Kabel dipotong', ai: true, source: 'Disimpulkan AI dari isi laporan', test: (i) => /dipotong/.test(textOf(i)) },
];

const eligible = (target: Incident, c: Incident) =>
  c.no !== target.no && c.category === target.category && c.status === 'ditutup' && !c.restricted && !c.mergedInto && c.org === target.org;

/** Kandidat: Ditutup, kategori sama. `strict` = WK sama · 18 bulan; `wide` = seluruh WK organisasi · 36 bulan. */
export function similarPools(target: Incident, pool: Incident[], now = demoNow()) {
  const seen = new Set<string>();
  const all = pool.filter((c) => {
    if (seen.has(c.no)) return false;
    seen.add(c.no);
    return eligible(target, c);
  });
  const newest = (a: Incident, b: Incident) => at(b.occurredAt) - at(a.occurredAt);
  const strictFrom = monthsAgo(now, STRICT_MONTHS);
  const wideFrom = monthsAgo(now, WIDE_MONTHS);
  return {
    strict: all.filter((c) => c.wk === target.wk && at(c.occurredAt) >= strictFrom).sort(newest),
    wide: all.filter((c) => at(c.occurredAt) >= wideFrom).sort(newest),
  };
}

export interface SimilarResult {
  mode: SimilarMode;
  /** cakupan yang dipakai: WK sendiri 18 bulan, atau seluruh WK organisasi 36 bulan */
  scope: 'wk-18' | 'org-36';
  cases: Incident[];
}

/**
 * Tampil penuh hanya bila ≥3 kasus. Bila WK sendiri <3, cakupan diperluas (36 bulan, seluruh WK organisasi);
 * masih <3 → "few" (1–2 kasus rujukan), 0 → "none". `force` hanya untuk demo (?rec=): tidak pernah menampilkan
 * lebih banyak dari yang didukung data.
 */
export function findSimilar(target: Incident, pool: Incident[], force?: SimilarMode | null, now = demoNow()): SimilarResult {
  const { strict, wide } = similarPools(target, pool, now);
  let natural: SimilarResult;
  if (strict.length >= MIN_CASES) natural = { mode: 'full', scope: 'wk-18', cases: strict };
  else if (wide.length >= MIN_CASES) natural = { mode: 'full', scope: 'org-36', cases: wide };
  else if (wide.length > 0) natural = { mode: 'few', scope: 'org-36', cases: wide };
  else natural = { mode: 'none', scope: 'org-36', cases: [] };
  if (force === 'none') return { mode: 'none', scope: 'org-36', cases: [] };
  if (force === 'few' && wide.length > 0) {
    const ids = new Set(strict.map((c) => c.no));
    const cases = [...wide.filter((c) => !ids.has(c.no)), ...wide.filter((c) => ids.has(c.no))].slice(0, 2);
    return { mode: 'few', scope: 'org-36', cases };
  }
  return natural;
}

const median = (n: number[]): number | null => {
  if (!n.length) return null;
  const s = [...n].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const dec = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });

/** Hari antara registrasi (entri pertama jejak) dan penutupan (entri "Menutup ..."). */
export function handlingDays(i: Incident): number | null {
  const tl = i.timeline ?? [];
  const closed = [...tl].reverse().find((t) => t.text.startsWith('Menutup'));
  if (!tl.length || !closed) return null;
  return (at(closed.at) - at(tl[0].at)) / 86_400_000;
}

export interface StatItem { key: 'ops' | 'loss' | 'days'; label: string; value: string; note: string }
export function similarStats(cases: Incident[]): StatItem[] {
  const ops = cases.filter((c) => c.detail?.ops === 'berhenti' && c.detail.opsHours != null).map((c) => c.detail!.opsHours!);
  const loss = cases.map((c) => c.detail?.lossIdr).filter((n): n is number => !!n);
  const days = cases.map(handlingDays).filter((n): n is number => n != null);
  const out: StatItem[] = [];
  const mo = median(ops);
  const ml = median(loss);
  const md = median(days);
  if (mo != null) out.push({ key: 'ops', label: 'Operasi berhenti', value: `${dec(mo)} jam`, note: `median · ${ops.length} kasus` });
  if (ml != null) out.push({ key: 'loss', label: 'Kerugian', value: `Rp${dec(ml / 1e6)} jt`, note: `median · ${loss.length} kasus` });
  if (md != null) out.push({ key: 'days', label: 'Lama penanganan', value: `${dec(md)} hari`, note: `median · ${days.length} kasus` });
  return out;
}

export interface PatternItem extends Omit<PatternDef, 'test'> { count: number; pct: number }
export function similarPatterns(cases: Incident[]): PatternItem[] {
  return PATTERN_DEFS.map(({ test, ...d }) => {
    const count = cases.filter(test).length;
    return { ...d, count, pct: cases.length ? Math.round((count * 100) / cases.length) : 0 };
  }).filter((p) => p.count > 0);
}

export interface StepItem { text: string; tag: string; count: number }
export function similarSteps(cases: Incident[]): StepItem[] {
  return STEP_CATALOG.map((s) => ({ ...s, count: cases.filter((c) => c.forwardedSteps?.includes(s.text)).length })).filter((s) => s.count > 0);
}

export interface Dot { no: string; x: number; y: number; tags: PatternKey[] }
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
export const toXY = (lat: number | null | undefined, lng: number | null | undefined) =>
  lat == null || lng == null
    ? { x: MAP_REF.cx, y: MAP_REF.cy }
    : {
        x: clamp(Math.round(MAP_REF.cx + (lng - MAP_REF.lng) * MAP_REF.pxPerDeg), 8, 352),
        y: clamp(Math.round(MAP_REF.cy - (lat - MAP_REF.lat) * MAP_REF.pxPerDeg), 8, 202),
      };
export function similarDots(cases: Incident[]): Dot[] {
  return cases.map((c) => ({ no: c.no, ...toXY(c.detail?.lat, c.detail?.lng), tags: PATTERN_DEFS.filter((d) => d.test(c)).map((d) => d.key) }));
}

const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
/** "Feb 2026" dari ISO. */
export const monthYear = (iso: string) => `${BLN[parseInt(iso.slice(5, 7), 10) - 1]} ${iso.slice(0, 4)}`;
export const closedInText = (i: Incident) => {
  const d = handlingDays(i);
  return d == null ? 'ditutup' : `ditutup ${formatNumber(Math.max(1, Math.round(d)))} hari`;
};
