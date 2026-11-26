// Kartu "Tabel insiden" (TabelDrill, board TD0–TD16 Desain v2, 26 Nov): tabel ringkasan + drill-down, dan pivot
// Baris (› Rincian) × Kolom dengan satu Nilai (TD9–TD16: baris grup abu-abu = subtotal, − / + buka-tutup rincian).
// Fungsi murni: insiden dalam cakupan filter halaman + state drill → view model. Komponen React ada di
// src/features/dashboard/components/IncidentDrillTable.tsx. Teks UI disalin dari project/TabelDrill.dc.html (renderVals).
// Aturan: satu tampilan = satu tingkat; drill mengganti isi tabel, tidak menyisipkan baris.
import { casualtiesOfDashboard, casualtyText } from './casualties';
import { jamKejadian } from '@/data/dashboardIncidentMeta';

/** Baris insiden dari logika dashboard (`v.tdInc`, insiden dalam cakupan filter halaman). */
export interface DashIncRaw {
  id: string;
  t: string;
  /** indeks kategori di CAT */
  katI: number;
  kat: string;
  /** kunci wilayah SKK (pst, sbu, ...) */
  wilKey: string;
  wil: string;
  kk: string;
  wk: string;
  areaId: string;
  /** nama area (kabupaten) */
  area: string;
  /** 0 Sangat rendah … 4 Kritis */
  lv: number;
  /** 0 Dalam penanganan, 1 Menunggu penutupan, 2 Ditutup */
  st: number;
  /** tanggal lapor, mis. "21 Jan" */
  tgl: string;
  /** bulan 0..5 (Jan..Jun 2026) */
  m: number;
  /** kerugian (juta), bagian kerugian area setelah filter (sama dengan KPI Kerugian) */
  rp: number;
}

export interface DrillInc extends DashIncRaw {
  md: number;
  lk: number;
  unk: boolean;
  day: number;
  jam: string;
}

export type Dim = 'kat' | 'wil' | 'kkks' | 'wk' | 'lv' | 'tw' | 'bln' | 'st';
/** Nilai sel pivot */
export type Measure = 'n' | 'rp' | 'tk' | 'md' | 'lk' | 'op';
export type Menu = 'g' | 'g2' | 'col' | 'm';
export type Col = 'n' | 'pct' | 'rp' | 'tk' | 'md' | 'lk' | 'op';
export interface Step { d: Dim; v: string }
export interface DrillState {
  path: Step[];
  g: Dim;
  /** tingkat insiden (kolom yang menentukan syarat) */
  list: { c: Col } | null;
  pg: number;
  sort: { k: Col | 'dim'; dir: 'asc' | 'desc' } | null;
  /** v2 = nilai Rincian, cv = nilai Kolom (pivot) */
  pop: { v: string; c: Col; v2?: string | null; cv?: string | null } | null;
  sub: boolean;
  /** menu terbuka (Baris, › Rincian, Kolom, Nilai) */
  dd: Menu | null;
  /** pivot: dimensi Kolom, dimensi Rincian (tingkat 2 Baris), nilai sel */
  col: Dim | null;
  g2: Dim | null;
  m: Measure;
  /** grup yang ditutup (true) / dibuka (false) eksplisit; tanpa entri = bawaan (tertutup bila > 10 rincian) */
  cl: Record<string, boolean>;
}

export const LV: [string, string, string, string][] = [
  ['Sangat rendah', 'var(--ink-subtle)', 'var(--surface-sunken)', 'var(--ink-subtle)'],
  ['Rendah', 'var(--sev-low-dot)', 'var(--sev-low-bg)', 'var(--sev-low-ink)'],
  ['Sedang', 'var(--sev-medium-dot)', 'var(--sev-medium-bg)', 'var(--sev-medium-ink)'],
  ['Tinggi', 'var(--sev-high-dot)', 'var(--sev-high-bg)', 'var(--sev-high-ink)'],
  ['Kritis', 'var(--sev-critical-dot)', 'var(--sev-critical-bg)', 'var(--sev-critical-ink)'],
];
const BL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
const STO = ['Dalam penanganan', 'Menunggu penutupan', 'Ditutup'];
const WIL_ORD = ['Pusat', 'Sumbagut', 'Sumbagsel', 'Kalsul', 'Jabanusa', 'Pamalu'];

export const rp = (jt: number) => (!jt ? 'Rp0' : jt >= 1000 ? 'Rp' + (jt / 1000).toFixed(2).replace('.', ',') + ' M' : 'Rp' + Math.round(jt) + ' jt');

export const DIM: Record<Dim, { l: string; f: (i: DrillInc) => string; ord?: string[] }> = {
  kat: { l: 'Kategori', f: (i) => i.kat },
  wil: { l: 'Wilayah SKK', f: (i) => i.wil, ord: WIL_ORD },
  kkks: { l: 'KKKS', f: (i) => i.kk },
  wk: { l: 'Wilayah kerja', f: (i) => i.wk },
  lv: { l: 'Level', f: (i) => LV[i.lv][0], ord: LV.map((x) => x[0]).reverse() },
  bln: { l: 'Bulan', f: (i) => BL[i.m] + ' 2026', ord: BL.map((b) => b + ' 2026') },
  st: { l: 'Status penanganan', f: (i) => STO[i.st], ord: STO },
  tw: { l: 'Triwulan', f: (i) => (i.m < 3 ? 'TW I' : 'TW II') + ' 2026', ord: ['TW I 2026', 'TW II 2026'] },
};
export const dimsFor = (kk: boolean): Dim[] => (kk ? ['kat', 'wk', 'lv', 'tw', 'bln', 'st'] : ['kat', 'wil', 'kkks', 'wk', 'lv', 'tw', 'bln', 'st']);
/** Dimensi yang boleh jadi Kolom (paling banyak 12 nilai). */
export const colDimsFor = (kk: boolean): Dim[] => (kk ? [] : (['wil'] as Dim[])).concat(['kat', 'lv', 'tw', 'bln', 'st']);
export const MS: Record<Measure, string> = { n: 'Insiden (jumlah)', rp: 'Kerugian', tk: 'Tinggi & Kritis', md: 'Meninggal', lk: 'Luka', op: 'Masih terbuka' };

export const COLS: { k: Col; l: string }[] = [
  { k: 'n', l: 'Insiden (jumlah)' }, { k: 'pct', l: 'Insiden (%)' }, { k: 'rp', l: 'Kerugian' }, { k: 'tk', l: 'Tinggi & Kritis' },
  { k: 'md', l: 'Meninggal' }, { k: 'lk', l: 'Luka' }, { k: 'op', l: 'Masih terbuka' },
];
/** Kolom menentukan syarat "Lihat insiden". */
export const COND: Record<Col, ((i: DrillInc) => boolean) | null> = {
  n: null, pct: null, rp: null, tk: (i) => i.lv >= 3, md: (i) => i.md > 0, lk: (i) => i.lk > 0, op: (i) => i.st !== 2,
};
export const CONDL: Partial<Record<Col, string>> = { tk: 'Tinggi & Kritis', md: 'ada korban meninggal', lk: 'ada korban luka', op: 'masih terbuka' };

export const toDrillInc = (r: DashIncRaw): DrillInc => {
  const c = casualtiesOfDashboard(r.id, r.st);
  return { ...r, md: c.meninggal, lk: c.luka, unk: c.unknown, day: Number(String(r.tgl).trim().split(' ')[0]) || 1, jam: jamKejadian(r.id) };
};

/* ------------------------------------------------------------------ state */

export const INIT: DrillState = { path: [], g: 'kat', list: null, pg: 0, sort: null, pop: null, sub: false, dd: null, col: null, g2: null, m: 'n', cl: {} };
const clean = { pop: null, sub: false, sort: null, list: null, pg: 0 } as const;

/** Kolom, Rincian, dan Nilai yang berlaku (yang tidak sah untuk Baris/jejak/peran diabaikan). */
export function pivotOf(s: DrillState, kk: boolean): { col: Dim | null; g2: Dim | null; m: Measure } {
  const used = s.path.map((p) => p.d);
  const col = s.col && s.col !== s.g && !used.includes(s.col) && colDimsFor(kk).includes(s.col) ? s.col : null;
  const g2 = col && s.g2 && s.g2 !== s.g && s.g2 !== col && !used.includes(s.g2) && dimsFor(kk).includes(s.g2) ? s.g2 : null;
  return { col, g2, m: MS[s.m] ? s.m : 'n' };
}
/** Jejak setelah memilih sel popover: jejak + baris (+ rincian) (+ kolom). */
export function popPath(s: DrillState, kk: boolean): Step[] {
  if (!s.pop) return s.path;
  const { col, g2 } = pivotOf(s, kk);
  return [...s.path, { d: s.g, v: s.pop.v }]
    .concat(s.pop.v2 && g2 ? [{ d: g2, v: s.pop.v2 }] : [])
    .concat(s.pop.cv && col ? [{ d: col, v: s.pop.cv }] : []);
}

export const openPop = (s: DrillState, v: string, c: Col, sub: boolean, v2: string | null = null, cv: string | null = null): DrillState => ({ ...s, pop: { v, c, v2, cv }, sub, dd: null });
export const closePop = (s: DrillState): DrillState => ({ ...s, pop: null, sub: false });
export const toggleSub = (s: DrillState): DrillState => ({ ...s, sub: !s.sub });
/** Rincikan menurut d: sel popover masuk jejak, tabel dikelompokkan menurut d. */
export const drillInto = (s: DrillState, d: Dim, kk: boolean): DrillState => {
  if (!s.pop) return s;
  const path = popPath(s, kk);
  const usedNext = path.map((p) => p.d);
  return { ...s, ...clean, path, g: d, col: s.col && (usedNext.includes(s.col) || s.col === d) ? null : s.col };
};
/** Lihat n insiden: tingkat insiden untuk sel popover (baris, rincian, kolom, syarat kolom ukuran). */
export const showList = (s: DrillState, kk: boolean): DrillState => (s.pop ? { ...s, ...clean, path: popPath(s, kk), list: { c: s.pop.c } } : s);
export const reset = (s: DrillState): DrillState => ({ ...s, ...clean, path: [], g: 'kat', dd: null });
/** Klik segmen jejak ke-ix (0 = segmen pertama setelah "Semua insiden"). */
export const crumbTo = (s: DrillState, ix: number): DrillState => ({ ...s, ...clean, path: s.path.slice(0, ix + 1), g: s.path[ix + 1]?.d ?? s.g });
export const toggleMenu = (s: DrillState, k: Menu): DrillState => ({ ...s, dd: s.dd === k ? null : k, pop: null, sub: false });
/** Pilih isi menu Baris / › Rincian / Kolom / Nilai (null = Tanpa rincian / Tanpa kolom). */
export function pickMenu(s: DrillState, k: Menu, v: Dim | Measure | null): DrillState {
  const o = { ...s, dd: null, pop: null, sub: false };
  if (k === 'g') return { ...o, g: v as Dim, col: v === s.col ? null : s.col, sort: null };
  if (k === 'g2') return { ...o, g2: v as Dim | null, cl: {} };
  if (k === 'col') return { ...o, col: v as Dim | null, sort: null };
  return { ...o, m: v as Measure };
}
/** − / + pada baris grup: isOpen = grup sedang terbuka (jadi ditutup). */
export const toggleGroupRow = (s: DrillState, v: string, isOpen: boolean): DrillState => ({ ...s, cl: { ...s.cl, [v]: isOpen }, pop: null, sub: false });
/** Buka semua (closed = false) / Tutup semua (closed = true) untuk grup yang tampil. */
export const setAllGroups = (s: DrillState, groups: string[], closed: boolean): DrillState => ({ ...s, cl: Object.fromEntries(groups.map((g) => [g, closed])), pop: null, sub: false });
export const sortBy = (s: DrillState, k: Col | 'dim'): DrillState => {
  const on = s.sort && s.sort.k === k;
  return { ...s, sort: on ? { k, dir: s.sort!.dir === 'asc' ? 'desc' : 'asc' } : { k, dir: k === 'dim' ? 'asc' : 'desc' }, pop: null, sub: false };
};
export const toPage = (s: DrillState, pg: number): DrillState => ({ ...s, pg });

/* ------------------------------------------------------------------ URL */

type UrlPart = Pick<DrillState, 'path' | 'g' | 'list' | 'pg' | 'col' | 'g2' | 'm'>;
/** `?tabel=kat:Pencurian%2FPerampokan|wil:Sumbagsel&lihat=n&kelompok=wil&hal=2&kolom=lv&rincian=kkks&nilai=rp` */
export function drillFromParams(p: URLSearchParams, kk: boolean): UrlPart {
  const dims = dimsFor(kk);
  const path: Step[] = [];
  for (const seg of (p.get('tabel') ?? '').split('|').filter(Boolean)) {
    const i = seg.indexOf(':');
    const d = seg.slice(0, i) as Dim;
    if (i < 1 || !dims.includes(d) || path.some((x) => x.d === d)) continue;
    path.push({ d, v: decodeURIComponent(seg.slice(i + 1)) });
  }
  const c = p.get('lihat') as Col | null;
  const list = c && COLS.some((x) => x.k === c) ? { c } : null;
  const used = path.map((x) => x.d);
  const k = p.get('kelompok') as Dim | null;
  const g = k && dims.includes(k) && !used.includes(k) ? k : (dims.find((d) => !used.includes(d)) ?? 'kat');
  const pg = Math.max(0, (Number(p.get('hal')) || 1) - 1);
  const col = p.get('kolom') as Dim | null;
  const g2 = p.get('rincian') as Dim | null;
  const m = p.get('nilai') as Measure | null;
  return {
    path, g, list, pg: list ? pg : 0,
    col: col && colDimsFor(kk).includes(col) ? col : null,
    g2: g2 && dims.includes(g2) ? g2 : null,
    m: m && MS[m] ? m : 'n',
  };
}

export function drillToParams(cur: URLSearchParams, s: UrlPart, kk: boolean): URLSearchParams {
  const p = new URLSearchParams(cur);
  ['tabel', 'lihat', 'kelompok', 'hal', 'kolom', 'rincian', 'nilai'].forEach((k) => p.delete(k));
  if (s.path.length) p.set('tabel', s.path.map((x) => `${x.d}:${encodeURIComponent(x.v)}`).join('|'));
  if (s.list) p.set('lihat', s.list.c);
  const used = s.path.map((x) => x.d);
  const def = dimsFor(kk).find((d) => !used.includes(d));
  if (!s.list && s.g !== def) p.set('kelompok', s.g);
  if (s.list && s.pg > 0) p.set('hal', String(s.pg + 1));
  if (s.col) p.set('kolom', s.col);
  if (s.col && s.g2) p.set('rincian', s.g2);
  if (s.col && s.m !== 'n') p.set('nilai', s.m);
  return p;
}

/* ------------------------------------------------------------------ view */

interface Agg { n: number; rp: number; tk: number; md: number; lk: number; op: number }
const agg = (xs: DrillInc[]): Agg => ({
  n: xs.length, rp: xs.reduce((a, i) => a + i.rp, 0), tk: xs.filter((i) => i.lv >= 3).length,
  md: xs.reduce((a, i) => a + i.md, 0), lk: xs.reduce((a, i) => a + i.lk, 0), op: xs.filter((i) => i.st !== 2).length,
});
type Row = Agg & { v: string; xs: DrillInc[]; pct: number };

export interface DrillCell { k: Col; side: 'l' | 'r'; z: boolean; v: string; cls: string; bar: boolean; w: string; exp: boolean; aria: string }
export interface DrillRow { v: string; label: string; aria: string; cells: DrillCell[] }
export interface DrillListRow {
  id: string; t: string; kat: string; c1: string; c2: string; sn: string; sc: string; sbg: string; sink: string;
  d: string; h: string; rp: string; k: string; kc: string; x: string; xc: string; inc: DrillInc;
}
export interface DrillHead { k: Col | 'dim'; l: string; a: string; sort: 'ascending' | 'descending' | 'none' }
export interface PivotCell { cv: string | null; side: 'l' | 'r'; z: boolean; v: string; cls: string; exp: boolean; aria: string }
/** rc: '' (tanpa rincian), 'grp' (baris grup = subtotal), 'ch' (baris rincian) */
export interface PivotRow { rc: '' | 'grp' | 'ch'; key: string; v: string; v2: string | null; label: string; pad: string; tg: boolean; open: boolean; cnt: string; aria: string; cells: PivotCell[] }
export interface PivotMenu { k: Menu; l: string; v: string; empty: boolean; opts: { val: Dim | Measure | null; l: string; on: boolean }[] }

export function drillView(inc: DrillInc[], s: DrillState, kk: boolean) {
  const dims = dimsFor(kk);
  const base = inc.filter((i) => s.path.every((p) => DIM[p.d].f(i) === p.v));
  const used = s.path.map((p) => p.d);
  const g = s.g;
  const scopeTxt = kk ? 'wilayah kerja Anda' : 'seluruh KKKS';

  // ringkasan per dimensi
  const groups: Record<string, DrillInc[]> = {};
  base.forEach((i) => { const v = DIM[g].f(i); (groups[v] = groups[v] || []).push(i); });
  const tot = agg(base);
  const rows: Row[] = Object.keys(groups).map((v) => ({ v, xs: groups[v], ...agg(groups[v]), pct: 0 }));
  rows.forEach((r) => { r.pct = tot.n ? r.n / tot.n : 0; });
  const sort = s.sort;
  if (sort) {
    rows.sort((a, b) => {
      const x = sort.k === 'dim' ? a.v.localeCompare(b.v) : (a[sort.k] as number) - (b[sort.k] as number);
      return sort.dir === 'asc' ? x : -x;
    });
  } else if (DIM[g].ord) {
    const o = DIM[g].ord!;
    rows.sort((a, b) => o.indexOf(a.v) - o.indexOf(b.v));
  } else rows.sort((a, b) => b.n - a.n || a.v.localeCompare(b.v));
  const fmt = (k: Col, r: Agg & { pct: number }) => (k === 'rp' ? rp(r.rp) : k === 'pct' ? Math.round(r.pct * 100) + '%' : String(r[k]));
  const pop = s.pop;

  const rowsV: DrillRow[] = rows.map((r) => ({
    v: r.v,
    label: r.v.replace('/', '/​'),
    aria: 'Rincikan ' + r.v,
    cells: COLS.map((c, ci) => {
      const val = c.k === 'pct' ? r.pct : r[c.k];
      const on = !!(pop && pop.v === r.v && pop.c === c.k);
      return {
        k: c.k, side: ci >= 4 ? 'r' : 'l', z: !val, v: fmt(c.k, r), cls: c.k === 'md' && r.md > 0 ? 'strong' : '',
        bar: c.k === 'pct', w: Math.round(r.pct * 100) + '%', exp: on,
        aria: c.l + ' ' + r.v + ': ' + fmt(c.k, r) + '. Klik untuk pilihan',
      };
    }),
  }));
  const foot = COLS.map((c) => (c.k === 'pct' ? '100%' : c.k === 'rp' ? rp(tot.rp) : String(tot[c.k])));

  // pivot (Baris › Rincian × Kolom, satu Nilai)
  const { col, g2, m } = pivotOf(s, kk);
  const fm = (k: Measure, x: number) => (k === 'rp' ? rp(x) : String(x));
  let colVals: string[] = [];
  if (col) {
    colVals = Array.from(new Set(base.map(DIM[col].f)));
    const o = DIM[col].ord;
    if (o) colVals.sort((a, b) => o.indexOf(a) - o.indexOf(b)); else colVals.sort();
    colVals = colVals.slice(0, 12);
  }
  const ordOf = (d: Dim, vals: string[], xsOf: (v: string) => DrillInc[]) => {
    const a = vals.slice();
    const o = DIM[d].ord;
    if (o) a.sort((x, y) => o.indexOf(x) - o.indexOf(y)); else a.sort((x, y) => xsOf(y).length - xsOf(x).length || x.localeCompare(y));
    return a;
  };
  const pvCells = (xs: DrillInc[], rv: string, v2: string | null): PivotCell[] =>
    [...colVals, null].map((cv, ci) => {
      const cx = cv === null ? xs : xs.filter((i) => DIM[col!].f(i) === cv);
      const val = agg(cx)[m];
      const on = !!(pop && pop.v === rv && (pop.v2 || null) === v2 && (pop.cv || null) === cv);
      return {
        cv, side: ci >= Math.floor((colVals.length + 1) / 2) ? 'r' : 'l', z: !val, v: fm(m, val),
        cls: (cv === null ? 'tot ' : '') + (m === 'md' && val > 0 ? 'strong' : ''), exp: on,
        aria: MS[m] + ' ' + rv + (v2 ? ' › ' + v2 : '') + (cv ? ' · ' + cv : ' · total') + ': ' + fm(m, val) + '. Klik untuk pilihan',
      };
    });
  const pvRows: PivotRow[] = [];
  const pvGroups: string[] = [];
  if (col) rows.forEach((r) => {
    if (!g2) { pvRows.push({ rc: '', key: r.v, v: r.v, v2: null, label: r.v.replace('/', '/​'), pad: '0px', tg: false, open: false, cnt: '', aria: 'Rincikan ' + r.v, cells: pvCells(r.xs, r.v, null) }); return; }
    const sub: Record<string, DrillInc[]> = {};
    r.xs.forEach((i) => { const v = DIM[g2].f(i); (sub[v] = sub[v] || []).push(i); });
    const kids = ordOf(g2, Object.keys(sub), (v) => sub[v]);
    const isOpen = s.cl[r.v] !== undefined ? !s.cl[r.v] : kids.length <= 10;
    pvGroups.push(r.v);
    pvRows.push({ rc: 'grp', key: r.v, v: r.v, v2: null, label: r.v.replace('/', '/​'), pad: '0px', tg: true, open: isOpen, cnt: kids.length + ' ' + DIM[g2].l.toLowerCase(), aria: 'Rincikan ' + r.v, cells: pvCells(r.xs, r.v, null) });
    if (isOpen) kids.forEach((k) => pvRows.push({ rc: 'ch', key: r.v + '\u0000' + k, v: r.v, v2: k, label: k.replace('/', '/​'), pad: '28px', tg: false, open: false, cnt: '', aria: 'Pilihan untuk ' + r.v + ' › ' + k, cells: pvCells(sub[k], r.v, k) }));
  });
  const pvFoot = col ? colVals.map((cv) => fm(m, agg(base.filter((i) => DIM[col].f(i) === cv))[m])).concat([fm(m, tot[m])]) : [];
  const pvHead = colVals.map((cv) => {
    const li = col === 'lv' ? LV.findIndex((x) => x[0] === cv) : -1;
    return { v: cv, l: col === 'bln' ? cv.replace(' 2026', '') : cv, dot: li >= 0 ? LV[li][1] : null };
  });

  // popover aksi (ringkasan: sel baris × ukuran; pivot: sel baris [› rincian] × kolom, nilai = ukuran)
  let popV = null as null | { T: string; S: string; N: number; V: string; subOpts: { d: Dim; l: string }[]; steps: Step[] };
  if (pop) {
    const gx = (groups[pop.v] || [])
      .filter((i) => !pop.v2 || !g2 || DIM[g2].f(i) === pop.v2)
      .filter((i) => !pop.cv || !col || DIM[col].f(i) === pop.cv);
    const cond = COND[pop.c];
    const xs = gx.filter((i) => !cond || cond(i));
    const V = pop.v + (pop.v2 && g2 ? ' › ' + pop.v2 : '') + (pop.cv && col ? ' · ' + pop.cv : '');
    const next = popPath(s, kk);
    const usedNext = next.map((p) => p.d);
    popV = {
      N: xs.length, V,
      T: V + (CONDL[pop.c] ? ' · ' + CONDL[pop.c] : ''),
      S: xs.length + ' insiden' + (pop.c === 'md' ? ' · ' + gx.reduce((a, i) => a + i.md, 0) + ' orang meninggal' : pop.c === 'lk' ? ' · ' + gx.reduce((a, i) => a + i.lk, 0) + ' orang luka' : pop.c === 'rp' ? ' · ' + rp(xs.reduce((a, i) => a + i.rp, 0)) : ''),
      subOpts: dims.filter((d) => !usedNext.includes(d)).map((d) => ({ d, l: DIM[d].l })),
      /** langkah baru dari sel ini (baris, rincian, kolom), dipakai Saring halaman */
      steps: next.slice(s.path.length),
    };
  }

  // menu Baris, › Rincian, Kolom, Nilai (Rincian dan Nilai hanya bila Kolom terisi)
  const menus = ([
    { k: 'g', l: 'Baris', v: DIM[g].l, empty: false, opts: dims.filter((d) => !used.includes(d)).map((d) => ({ val: d, l: DIM[d].l, on: d === g })) },
    { k: 'g2', l: '› Rincian', v: g2 ? DIM[g2].l : 'Tanpa rincian', empty: !g2, opts: [{ val: null, l: 'Tanpa rincian', on: !g2 }, ...dims.filter((d) => d !== g && d !== col && !used.includes(d)).map((d) => ({ val: d, l: DIM[d].l, on: d === g2 }))] },
    { k: 'col', l: 'Kolom', v: col ? DIM[col].l : 'Tanpa kolom', empty: !col, opts: [{ val: null, l: 'Tanpa kolom', on: !col }, ...colDimsFor(kk).filter((d) => d !== g && !used.includes(d)).map((d) => ({ val: d, l: DIM[d].l, on: d === col }))] },
    { k: 'm', l: 'Nilai', v: MS[m], empty: false, opts: (Object.keys(MS) as Measure[]).map((k) => ({ val: k, l: MS[k], on: k === m })) },
  ] as PivotMenu[]).filter((x) => (x.k !== 'm' && x.k !== 'g2') || !!col);

  // daftar insiden (tingkat paling dalam)
  const lst = s.list;
  const lcond = lst ? COND[lst.c] : null;
  const lXs = lst ? base.filter((i) => !lcond || lcond(i)).sort((a, b) => b.lv - a.lv || b.m - a.m || b.day - a.day || b.jam.localeCompare(a.jam)) : [];
  const PG = 10;
  const pages = Math.max(1, Math.ceil(lXs.length / PG));
  const pg = Math.min(s.pg, pages - 1);
  const lRows: DrillListRow[] = lXs.slice(pg * PG, pg * PG + PG).map((i) => {
    const k = casualtyText({ meninggal: i.md, luka: i.lk, unknown: i.unk });
    return {
      id: i.id, t: i.t, kat: i.kat,
      c1: kk ? i.wk : i.kk, c2: kk ? i.area : i.wk + ' · ' + i.wil,
      sn: LV[i.lv][0], sc: LV[i.lv][1], sbg: LV[i.lv][2], sink: LV[i.lv][3],
      d: i.day + ' ' + BL[i.m] + ' 2026', h: i.jam + ' WIB',
      rp: rp(i.rp), k, kc: i.md ? 'kb' : k === '–' || k === 'Belum diketahui' ? 'p-cap' : '',
      x: STO[i.st], xc: i.st === 2 ? 'dn' : 'op', inc: i,
    };
  });

  // breadcrumb (ix -1 = Semua insiden)
  const drilled = s.path.length > 0 || !!lst;
  const crumb: { t: string; link: boolean; cur: boolean; ix: number }[] = [];
  if (drilled) {
    crumb.push({ t: 'Semua insiden', link: true, cur: false, ix: -1 });
    s.path.forEach((p, ix) => {
      const last = ix === s.path.length - 1 && !lst;
      crumb.push({ t: DIM[p.d].l + ': ' + p.v, link: !last, cur: last, ix });
    });
    if (lst) crumb.push({ t: lXs.length + ' insiden' + (CONDL[lst.c] ? ' · ' + CONDL[lst.c] : ''), link: false, cur: true, ix: s.path.length });
  }

  // header kolom + sortir
  const hd = (k: Col | 'dim', l: string): DrillHead => {
    const on = !!sort && sort.k === k;
    return { k, l, a: on ? (sort!.dir === 'asc' ? '▲' : '▼') : '', sort: on ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none' };
  };

  const unk = (lst ? lXs : base).filter((i) => i.unk).length;
  const pathTxt = s.path.map((p) => p.v).join(' · ');
  return {
    cap: lst ? 'Klik baris untuk membuka detail insiden' : tot.n + ' insiden terverifikasi · ' + (pathTxt || scopeTxt) + (col ? ' · ' + DIM[g].l + ' × ' + DIM[col].l : '') + ' · klik angka untuk merinci',
    drilled, crumb,
    showTable: !lst, showFlat: !lst && !col, showPivot: !lst && !!col, showList: !!lst,
    menus,
    hDim: hd('dim', DIM[g].l), heads: COLS.map((c) => hd(c.k, c.l)),
    pv: {
      col, g2, m, colL: col ? DIM[col].l : '', dimL: DIM[g].l + (g2 ? ' › ' + DIM[g2].l : ''), two: !lst && !!g2, groups: pvGroups,
      w0: g2 ? '30%' : '26%', minW: 300 + (colVals.length + 1) * 88 + 'px', head: pvHead, rows: pvRows, foot: pvFoot, hTot: hd(m, 'Total'),
      note: col ? (g2 ? 'Baris abu-abu = subtotal per ' + DIM[g].l.toLowerCase() + '; klik − / + untuk menutup atau membuka rinciannya. ' : '') + 'Nilai sel: ' + MS[m] + (m === 'md' || m === 'lk' ? ' (jumlah orang)' : '') + '. Klik angka untuk melihat insiden atau merinci; kolom hanya untuk dimensi dengan paling banyak 12 nilai.' : '',
    },
    rows: rowsV, foot, tot,
    pop: popV,
    lN: lXs.length + ' insiden',
    lS: (pathTxt || scopeTxt) + (lst && CONDL[lst.c] ? ' · ' + CONDL[lst.c] : '') + ' · urut level tertinggi lalu terbaru',
    lColL: kk ? 'Wilayah kerja' : 'KKKS · WK', lRows, lAll: lXs,
    pgT: lXs.length ? pg * PG + 1 + '–' + Math.min(lXs.length, pg * PG + PG) + ' dari ' + lXs.length : '',
    pg, pages, prevDis: pg === 0, nextDis: pg >= pages - 1,
    foot2: 'Insiden (%) = porsi dari ' + tot.n + ' insiden di tampilan ini. Meninggal/Luka = jumlah orang' + (unk ? ' · ' + unk + ' insiden korban belum diketahui' : ''),
  };
}
export type DrillView = ReturnType<typeof drillView>;

/* ------------------------------------------------------------------ CSV + tautan */

const csvCell = (x: string | number) => { const t = String(x); return /[",\n;]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };

/** CSV = isi tampilan saat ini (tabel ringkasan atau semua insiden di tingkat insiden). */
export function drillCsv(view: DrillView, kk: boolean): string {
  let lines: (string | number)[][];
  if (view.showList) {
    lines = [['Nomor', 'Insiden', 'Kategori', kk ? 'Wilayah kerja' : 'KKKS', kk ? 'Area' : 'WK', 'Wilayah SKK', 'Level', 'Waktu kejadian', 'Kerugian (juta Rp)', 'Meninggal', 'Luka', 'Korban', 'Status']];
    view.lAll.forEach((i) => lines.push([
      i.id, i.t, i.kat, kk ? i.wk : i.kk, kk ? i.area : i.wk, i.wil, LV[i.lv][0], i.day + ' ' + BL[i.m] + ' 2026 ' + i.jam + ' WIB',
      Math.round(i.rp * 10) / 10, i.md, i.lk, casualtyText({ meninggal: i.md, luka: i.lk, unknown: i.unk }), STO[i.st],
    ]));
  } else if (view.showPivot) {
    // pivot: baris grup = subtotal, baris rincian ditulis "Grup › Rincian"; grup tertutup hanya subtotal
    lines = [[view.pv.dimL, ...view.pv.head.map((h) => h.v), 'Total']];
    view.pv.rows.forEach((r) => lines.push([r.v2 ? r.v + ' › ' + r.v2 : r.v, ...r.cells.map((c) => (c.z ? 0 : c.v))]));
    lines.push(['Total', ...view.pv.foot]);
  } else {
    lines = [[view.hDim.l, ...COLS.map((c) => c.l)]];
    view.rows.forEach((r) => lines.push([r.v, ...r.cells.map((c) => (c.z ? 0 : c.v))]));
    lines.push(['Total', ...view.foot]);
  }
  return '﻿' + lines.map((l) => l.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** "Buka di daftar insiden": /insiden dengan filter yang sama (jejak + syarat kolom). */
export function listHref(path: Step[], c: Col | null): string {
  const KEY: Record<Dim, string> = { kat: 'kategori', wil: 'wilayah', kkks: 'kkks', wk: 'wk', lv: 'level', tw: 'triwulan', bln: 'bulan', st: 'status' };
  const q = new URLSearchParams();
  path.forEach((p) => q.set(KEY[p.d], p.d === 'bln' ? String(BL.indexOf(p.v.split(' ')[0]) + 1) : p.d === 'tw' ? (p.v.startsWith('TW II') ? '2' : '1') : p.v));
  if (c === 'tk') q.set('level', 'Tinggi,Kritis');
  if (c === 'md') q.set('korban', 'meninggal');
  if (c === 'lk') q.set('korban', 'luka');
  if (c === 'op') q.set('status', 'terbuka');
  const s = q.toString();
  return '/insiden' + (s ? '?' + s : '');
}

/** Bulan "Mar 2026" → rentang tanggal untuk filter Periode halaman. */
export function monthRange(v: string): { from: string; to: string } | null {
  const mi = BL.indexOf(v.split(' ')[0]);
  if (mi < 0) return null;
  const last = new Date(2026, mi + 1, 0).getDate();
  const mm = String(mi + 1).padStart(2, '0');
  return { from: `2026-${mm}-01`, to: `2026-${mm}-${String(last).padStart(2, '0')}` };
}

/** Triwulan "TW I 2026" → rentang tanggal untuk filter Periode halaman. */
export function quarterRange(v: string): { from: string; to: string } | null {
  if (v.startsWith('TW II')) return { from: '2026-04-01', to: '2026-06-30' };
  if (v.startsWith('TW I')) return { from: '2026-01-01', to: '2026-03-31' };
  return null;
}
