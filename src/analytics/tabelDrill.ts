// Kartu "Tabel insiden" (TabelDrill, board TD0–TD20 Desain v2, 26 Nov malam): tabel ringkasan + drill-down dengan
// susunan Baris · Kolom · Nilai (chip + "+ Tambah", pola Metabase). Baris maks. 3 tingkat (baris induk = subtotal, bisa
// dilipat), Kolom maks. 2 tingkat (header 2 baris), Nilai satu ukuran saat Kolom terisi.
// Fungsi murni: insiden dalam cakupan filter halaman + state → view model. Komponen React ada di
// src/features/dashboard/components/IncidentDrillTable.tsx. Teks UI disalin dari project/TabelDrill.dc.html (renderVals).
// Aturan: drill (Rincikan / Lihat insiden) mengganti isi tabel, tidak pernah menyisipkan baris insiden.
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
export type Col = 'n' | 'pct' | 'rp' | 'tk' | 'md' | 'lk' | 'op';
/** Menu terbuka: chip Baris ke-i ('r0'..'r2'), + Tambah Baris ('ra'), chip Kolom ('c0','c1'), + Tambah Kolom ('ca'), Nilai ('m'). */
export type Menu = 'r0' | 'r1' | 'r2' | 'ra' | 'c0' | 'c1' | 'ca' | 'm';
export interface Step { d: Dim; v: string }
export interface DrillState {
  path: Step[];
  /** dimensi Baris (1–3), urut dari luar ke dalam */
  rows: Dim[];
  /** dimensi Kolom (0–2) */
  cols: Dim[];
  m: Measure;
  /** grup baris yang dilipat (kunci = nilai baris digabung "›") */
  cl: Record<string, boolean>;
  /** tingkat insiden (kolom yang menentukan syarat) */
  list: { c: Col } | null;
  pg: number;
  sort: { k: Col | 'dim'; dir: 'asc' | 'desc' } | null;
  /** sel popover: nilai baris per tingkat (rv) dan nilai kolom per tingkat (cv) */
  pop: { rv: string[]; c: Col; cv: string[] } | null;
  sub: boolean;
  dd: Menu | null;
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
export const MAXR = 3;
export const MAXC = 2;

export const rp = (jt: number) => (!jt ? 'Rp0' : jt >= 1000 ? 'Rp' + (jt / 1000).toFixed(2).replace('.', ',') + ' M' : 'Rp' + Math.round(jt) + ' jt');

export const DIM: Record<Dim, { l: string; f: (i: DrillInc) => string; ord?: string[] }> = {
  kat: { l: 'Kategori', f: (i) => i.kat },
  wil: { l: 'Wilayah SKK', f: (i) => i.wil, ord: WIL_ORD },
  kkks: { l: 'KKKS', f: (i) => i.kk },
  wk: { l: 'Wilayah kerja', f: (i) => i.wk },
  lv: { l: 'Level', f: (i) => LV[i.lv][0], ord: LV.map((x) => x[0]).reverse() },
  tw: { l: 'Triwulan', f: (i) => (i.m < 3 ? 'TW I' : 'TW II') + ' 2026', ord: ['TW I 2026', 'TW II 2026'] },
  bln: { l: 'Bulan', f: (i) => BL[i.m] + ' 2026', ord: BL.map((b) => b + ' 2026') },
  st: { l: 'Status penanganan', f: (i) => STO[i.st], ord: STO },
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

/** Kunci grup baris (nilai per tingkat). */
export const rowKey = (rv: string[]) => rv.join('›');

/* ------------------------------------------------------------------ state */

export const INIT: DrillState = { path: [], rows: ['kat'], cols: [], m: 'n', cl: {}, list: null, pg: 0, sort: null, pop: null, sub: false, dd: null };
const clean = { pop: null, sub: false, sort: null, list: null, pg: 0, dd: null } as const;

/** Susunan yang berlaku: Baris maks. 3, Kolom maks. 2, tidak ada dimensi ganda (Baris, Kolom, jejak), Nilai sah. */
export function layoutOf(s: DrillState, kk: boolean): { rd: Dim[]; cd: Dim[]; m: Measure } {
  const dims = dimsFor(kk);
  const used = s.path.map((p) => p.d);
  const okR = (d: Dim) => dims.includes(d) && !used.includes(d);
  const rd: Dim[] = [];
  s.rows.forEach((d) => { if (okR(d) && !rd.includes(d) && rd.length < MAXR) rd.push(d); });
  if (!rd.length) rd.push(dims.find(okR) ?? 'kat');
  const cd: Dim[] = [];
  s.cols.forEach((d) => { if (colDimsFor(kk).includes(d) && !used.includes(d) && !rd.includes(d) && !cd.includes(d) && cd.length < MAXC) cd.push(d); });
  return { rd, cd, m: MS[s.m] ? s.m : 'n' };
}
/** Jejak setelah memilih sel popover: jejak + semua tingkat baris + semua kolom sel. */
export function popPath(s: DrillState, kk: boolean): Step[] {
  if (!s.pop) return s.path;
  const { rd, cd } = layoutOf(s, kk);
  return s.path
    .concat(s.pop.rv.map((v, ix) => ({ d: rd[ix], v })))
    .concat(s.pop.cv.map((v, ix) => ({ d: cd[ix], v })));
}

export const openPop = (s: DrillState, rv: string[], c: Col, sub: boolean, cv: string[] = []): DrillState => ({ ...s, pop: { rv, c, cv }, sub, dd: null });
export const closePop = (s: DrillState): DrillState => ({ ...s, pop: null, sub: false });
export const toggleSub = (s: DrillState): DrillState => ({ ...s, sub: !s.sub });
/** Rincikan menurut d: semua filter sel masuk jejak; tabel kembali ke satu Baris; dimensi jejak dilepas dari Kolom. */
export const drillInto = (s: DrillState, d: Dim, kk: boolean): DrillState => {
  if (!s.pop) return s;
  const path = popPath(s, kk);
  const usedNext = path.map((p) => p.d);
  return { ...s, ...clean, path, rows: [d], cols: s.cols.filter((x) => !usedNext.includes(x) && x !== d), cl: {} };
};
/** Lihat n insiden: tingkat insiden untuk sel popover (semua filter sel + syarat kolom ukuran). */
export const showList = (s: DrillState, kk: boolean): DrillState => (s.pop ? { ...s, ...clean, path: popPath(s, kk), list: { c: s.pop.c } } : s);
/** × Reset / Semua insiden: jejak, Baris tambahan, Kolom, dan status lipat dikosongkan. */
export const reset = (s: DrillState): DrillState => ({ ...s, ...clean, path: [], rows: ['kat'], cols: [], cl: {} });
/** Klik segmen jejak ke-ix (0 = segmen pertama setelah "Semua insiden"). */
export const crumbTo = (s: DrillState, ix: number): DrillState => {
  const next = s.path[ix + 1]?.d;
  return { ...s, ...clean, path: s.path.slice(0, ix + 1), rows: next ? [next] : s.rows.slice(0, 1), cl: {} };
};
export const toggleMenu = (s: DrillState, k: Menu): DrillState => ({ ...s, dd: s.dd === k ? null : k, pop: null, sub: false });
/** Ganti susunan Baris (Kolom yang sama dengan Baris baru dilepas; status lipat direset). */
export const setRows = (s: DrillState, rows: Dim[]): DrillState => ({ ...s, rows: rows.slice(0, MAXR), cols: s.cols.filter((x) => !rows.includes(x)), cl: {}, dd: null, pop: null, sub: false, sort: null });
export const setCols = (s: DrillState, cols: Dim[]): DrillState => ({ ...s, cols: cols.slice(0, MAXC), dd: null, pop: null, sub: false, sort: null });
export const setMeasure = (s: DrillState, m: Measure): DrillState => ({ ...s, m, dd: null, pop: null, sub: false });
/** − / + pada baris induk: isOpen = grup sedang terbuka (jadi dilipat). */
export const toggleGroup = (s: DrillState, key: string, isOpen: boolean): DrillState => {
  const cl = { ...s.cl };
  if (isOpen) cl[key] = true; else delete cl[key];
  return { ...s, cl, pop: null, sub: false };
};
/** Buka semua (closed = false) / Lipat semua (closed = true). */
export const setAllGroups = (s: DrillState, keys: string[], closed: boolean): DrillState =>
  ({ ...s, cl: closed ? Object.fromEntries(keys.map((k) => [k, true])) : {}, pop: null, sub: false });
export const sortBy = (s: DrillState, k: Col | 'dim'): DrillState => {
  const on = s.sort && s.sort.k === k;
  return { ...s, sort: on ? { k, dir: s.sort!.dir === 'asc' ? 'desc' : 'asc' } : { k, dir: k === 'dim' ? 'asc' : 'desc' }, pop: null, sub: false };
};
export const toPage = (s: DrillState, pg: number): DrillState => ({ ...s, pg });

/* ------------------------------------------------------------------ URL */

type UrlPart = Pick<DrillState, 'path' | 'rows' | 'cols' | 'm' | 'cl' | 'list' | 'pg'>;
const isDim = (x: string): x is Dim => x in DIM;
/** `?tabel=kat:Pencurian%2FPerampokan&baris=wil,kkks&kolom=tw,lv&nilai=rp&lipat=Pusat|Sumbagut&lihat=n&hal=2` */
export function drillFromParams(p: URLSearchParams, kk: boolean): UrlPart {
  const dims = dimsFor(kk);
  const path: Step[] = [];
  for (const seg of (p.get('tabel') ?? '').split('|').filter(Boolean)) {
    const i = seg.indexOf(':');
    const d = seg.slice(0, i);
    if (i < 1 || !isDim(d) || !dims.includes(d) || path.some((x) => x.d === d)) continue;
    path.push({ d, v: decodeURIComponent(seg.slice(i + 1)) });
  }
  const used = path.map((x) => x.d);
  const bar = (p.get('baris') ?? '').split(',').filter(isDim).filter((d) => dims.includes(d));
  const rows = bar.length ? bar : [dims.find((d) => !used.includes(d)) ?? 'kat'];
  const cols = (p.get('kolom') ?? '').split(',').filter(isDim).filter((d) => colDimsFor(kk).includes(d));
  const m = p.get('nilai') as Measure | null;
  const cl = Object.fromEntries((p.get('lipat') ?? '').split('|').filter(Boolean).map((k) => [k, true]));
  const c = p.get('lihat') as Col | null;
  const lst = c && COLS.some((x) => x.k === c) ? { c } : null;
  const pg = Math.max(0, (Number(p.get('hal')) || 1) - 1);
  return { path, rows, cols, m: m && MS[m] ? m : 'n', cl, list: lst, pg: lst ? pg : 0 };
}

export function drillToParams(cur: URLSearchParams, s: UrlPart, kk: boolean): URLSearchParams {
  const p = new URLSearchParams(cur);
  ['tabel', 'baris', 'kolom', 'nilai', 'lipat', 'lihat', 'hal'].forEach((k) => p.delete(k));
  if (s.path.length) p.set('tabel', s.path.map((x) => `${x.d}:${encodeURIComponent(x.v)}`).join('|'));
  const used = s.path.map((x) => x.d);
  const def = dimsFor(kk).find((d) => !used.includes(d));
  if (!s.list && !(s.rows.length === 1 && s.rows[0] === def)) p.set('baris', s.rows.join(','));
  if (!s.list && s.cols.length) p.set('kolom', s.cols.join(','));
  if (!s.list && s.cols.length && s.m !== 'n') p.set('nilai', s.m);
  const lip = Object.keys(s.cl).filter((k) => s.cl[k]);
  if (!s.list && lip.length) p.set('lipat', lip.join('|'));
  if (s.list) p.set('lihat', s.list.c);
  if (s.list && s.pg > 0) p.set('hal', String(s.pg + 1));
  return p;
}

/* ------------------------------------------------------------------ view */

interface Agg { n: number; rp: number; tk: number; md: number; lk: number; op: number }
export const agg = (xs: DrillInc[]): Agg => ({
  n: xs.length, rp: xs.reduce((a, i) => a + i.rp, 0), tk: xs.filter((i) => i.lv >= 3).length,
  md: xs.reduce((a, i) => a + i.md, 0), lk: xs.reduce((a, i) => a + i.lk, 0), op: xs.filter((i) => i.st !== 2).length,
});

export interface DrillCell { k: Col | Measure; cv: string[]; side: 'l' | 'r'; z: boolean; v: string; cls: string; bar: boolean; w: string; exp: boolean; aria: string }
/** rc: '' (baris tunggal), 'grp' (baris induk = subtotal), 'ch' (rincian) */
export interface DrillRow { key: string; rv: string[]; rc: '' | 'grp' | 'ch'; pad: string; tg: boolean; open: boolean; label: string; cnt: string; aria: string; tgAria: string; cells: DrillCell[] }
export interface DrillListRow {
  id: string; t: string; kat: string; c1: string; c2: string; sn: string; sc: string; sbg: string; sink: string;
  d: string; h: string; rp: string; k: string; kc: string; x: string; xc: string; inc: DrillInc;
}
export interface DrillHead { k: Col | 'dim'; l: string; a: string; sort: 'ascending' | 'descending' | 'none' }
export interface ChipOpt { val: Dim | Measure; l: string; on: boolean }
export interface Chip { id: Menu; n: number; v: string; sep: boolean; x: boolean; opts: ChipOpt[] }
export interface CtlGroup { k: 'r' | 'c' | 'm'; l: string; sep: string; chips: Chip[]; canAdd: boolean; addId: Menu; addH: string; addOpts: { val: Dim; l: string }[] }
export interface PvHead { l: string; v: string; span: number; cls: string; dot: string | null }

export function drillView(inc: DrillInc[], s: DrillState, kk: boolean) {
  const dims = dimsFor(kk);
  const base = inc.filter((i) => s.path.every((p) => DIM[p.d].f(i) === p.v));
  const used = s.path.map((p) => p.d);
  const scopeTxt = kk ? 'wilayah kerja Anda' : 'seluruh KKKS';
  const { rd, cd, m } = layoutOf(s, kk);
  const pivot = cd.length > 0;
  const pop = s.pop;
  const tot = agg(base);
  const sort = s.sort;

  const order = (d: Dim, vals: string[], xsOf: (v: string) => DrillInc[]) => {
    const a = vals.slice();
    if (sort) {
      const k = sort.k;
      a.sort((x, y) => {
        const r = k === 'dim' ? x.localeCompare(y) : k === 'pct' ? xsOf(x).length - xsOf(y).length : agg(xsOf(x))[k] - agg(xsOf(y))[k];
        return sort.dir === 'asc' ? r : -r;
      });
    } else if (DIM[d].ord) { const o = DIM[d].ord!; a.sort((x, y) => o.indexOf(x) - o.indexOf(y)); }
    else a.sort((x, y) => xsOf(y).length - xsOf(x).length || x.localeCompare(y));
    return a;
  };

  // pohon baris: baris induk = subtotal, bisa dilipat
  const tree: { rv: string[]; xs: DrillInc[]; depth: number; isG: boolean; open: boolean; kids: number }[] = [];
  const groupKeys: string[] = [];
  const walk = (xs: DrillInc[], depth: number, vals: string[]) => {
    const d = rd[depth];
    const gp: Record<string, DrillInc[]> = {};
    xs.forEach((i) => { const v = DIM[d].f(i); (gp[v] = gp[v] || []).push(i); });
    order(d, Object.keys(gp), (v) => gp[v]).forEach((v) => {
      const rv = vals.concat([v]);
      const isG = depth < rd.length - 1;
      const kids = isG ? new Set(gp[v].map(DIM[rd[depth + 1]].f)).size : 0;
      const open = isG ? !s.cl[rowKey(rv)] : false;
      if (isG) groupKeys.push(rowKey(rv));
      tree.push({ rv, xs: gp[v], depth, isG, open, kids });
      if (isG && open) walk(gp[v], depth + 1, rv);
    });
  };
  walk(base, 0, []);

  const sameArr = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  const isOn = (rv: string[], c: Col | Measure, cv: string[]) => !!(pop && sameArr(pop.rv, rv) && pop.c === c && sameArr(pop.cv, cv));
  const rowMeta = (t: (typeof tree)[number]) => ({
    key: rowKey(t.rv), rv: t.rv, rc: (t.isG ? 'grp' : t.depth > 0 ? 'ch' : '') as DrillRow['rc'], pad: t.depth * 28 + 'px',
    tg: t.isG, open: t.open,
    tgAria: (t.open ? 'Lipat rincian ' : 'Buka rincian ') + t.rv.join(' › '),
    label: t.rv[t.rv.length - 1].replace('/', '/​'),
    cnt: t.isG ? t.kids + ' ' + DIM[rd[t.depth + 1]].l : '',
    aria: 'Pilihan untuk ' + t.rv.join(' › '),
  });

  // tabel tanpa kolom: 7 ukuran
  const fmt = (k: Col, a: Agg, pct: number) => (k === 'rp' ? rp(a.rp) : k === 'pct' ? Math.round(pct * 100) + '%' : String(a[k]));
  const rowsV: DrillRow[] = pivot ? [] : tree.map((t) => {
    const a = agg(t.xs);
    const pct = tot.n ? a.n / tot.n : 0;
    return {
      ...rowMeta(t),
      cells: COLS.map((c, ci) => {
        const val = c.k === 'pct' ? pct : a[c.k];
        return {
          k: c.k, cv: [], side: ci >= 4 ? 'r' : 'l', z: !val, v: fmt(c.k, a, pct), cls: c.k === 'md' && a.md > 0 ? 'strong' : '',
          bar: c.k === 'pct', w: Math.round(pct * 100) + '%', exp: isOn(t.rv, c.k, []),
          aria: c.l + ' ' + t.rv.join(' › ') + ': ' + fmt(c.k, a, pct) + '. Klik untuk pilihan',
        } as DrillCell;
      }),
    };
  });
  const foot = COLS.map((c) => (c.k === 'pct' ? '100%' : c.k === 'rp' ? rp(tot.rp) : String(tot[c.k])));

  // pivot: Baris × Kolom (1–2 tingkat), satu Nilai
  const fm = (x: number) => (m === 'rp' ? rp(x) : String(x));
  const valsOf = (d: Dim) => {
    const a = Array.from(new Set(base.map(DIM[d].f)));
    const o = DIM[d].ord;
    if (o) a.sort((x, y) => o.indexOf(x) - o.indexOf(y));
    else a.sort((x, y) => base.filter((i) => DIM[d].f(i) === y).length - base.filter((i) => DIM[d].f(i) === x).length || x.localeCompare(y));
    return a.slice(0, 12);
  };
  const v1 = cd[0] ? valsOf(cd[0]) : [];
  const v2 = cd[1] ? valsOf(cd[1]) : [];
  const ck: string[][] = cd.length === 1 ? v1.map((v) => [v]) : cd.length === 2 ? v1.flatMap((v) => v2.map((w) => [v, w])) : [];
  const inCol = (i: DrillInc, c: string[]) => cd.every((d, ix) => DIM[d].f(i) === c[ix]);
  const short = (d: Dim, v: string) => (d === 'bln' || d === 'tw' ? v.replace(' 2026', '') : v);
  const dotOf = (d: Dim, v: string) => { const li = d === 'lv' ? LV.findIndex((x) => x[0] === v) : -1; return li >= 0 ? LV[li][1] : null; };
  const half = Math.floor((ck.length + 1) / 2);
  const firstOfGroup = (ci: number) => cd.length === 2 && ci % v2.length === 0;
  const pvRows: DrillRow[] = !pivot ? [] : tree.map((t) => ({
    ...rowMeta(t),
    cells: [...ck, null].map((c, ci) => {
      const val = agg(c ? t.xs.filter((i) => inCol(i, c)) : t.xs)[m];
      return {
        k: m, cv: c ?? [], side: ci >= half ? 'r' : 'l', z: !val, v: fm(val), bar: false, w: '',
        cls: (c ? '' : 'tot ') + (c && firstOfGroup(ci) ? 'c0 ' : '') + (m === 'md' && val > 0 ? 'strong' : ''),
        exp: isOn(t.rv, m, c ?? []),
        aria: MS[m] + ' ' + t.rv.join(' › ') + (c ? ' · ' + c.join(' · ') : ' · total') + ': ' + fm(val) + '. Klik untuk pilihan',
      } as DrillCell;
    }),
  }));
  const pvHead: PvHead[] = cd.length === 1
    ? ck.map((c) => ({ l: short(cd[0], c[0]), v: c[0], span: 1, cls: 'num', dot: dotOf(cd[0], c[0]) }))
    : cd.length === 2 ? v1.map((v) => ({ l: short(cd[0], v), v, span: v2.length, cls: 'cg', dot: dotOf(cd[0], v) })) : [];
  const pvHead2: PvHead[] = cd.length === 2 ? ck.map((c, ci) => ({ l: short(cd[1], c[1]), v: c[1], span: 1, cls: ci % v2.length === 0 ? 'c0' : '', dot: dotOf(cd[1], c[1]) })) : [];
  const pvFoot = !pivot ? [] : ck.map((c, ci) => ({ v: fm(agg(base.filter((i) => inCol(i, c)))[m]), cls: firstOfGroup(ci) ? 'c0' : '' })).concat([{ v: fm(tot[m]), cls: 'tot' }]);

  // popover aksi (filter = semua nilai baris + kolom sel)
  let popV = null as null | { T: string; S: string; N: number; V: string; subOpts: { d: Dim; l: string }[]; steps: Step[] };
  if (pop) {
    const pp = popPath(s, kk);
    const steps = pp.slice(s.path.length);
    const gx = base.filter((i) => steps.every((p) => DIM[p.d].f(i) === p.v));
    const cond = COND[pop.c];
    const xs = gx.filter((i) => !cond || cond(i));
    const V = pop.rv.join(' › ') + (pop.cv.length ? ' · ' + pop.cv.join(' · ') : '');
    const usedNext = pp.map((p) => p.d);
    popV = {
      N: xs.length, V,
      T: V + (CONDL[pop.c] ? ' · ' + CONDL[pop.c] : ''),
      S: xs.length + ' insiden' + (pop.c === 'md' ? ' · ' + gx.reduce((a, i) => a + i.md, 0) + ' orang meninggal' : pop.c === 'lk' ? ' · ' + gx.reduce((a, i) => a + i.lk, 0) + ' orang luka' : pop.c === 'rp' ? ' · ' + rp(xs.reduce((a, i) => a + i.rp, 0)) : ''),
      subOpts: dims.filter((d) => !usedNext.includes(d)).map((d) => ({ d, l: DIM[d].l })),
      /** langkah baru dari sel ini (semua tingkat baris + kolom), dipakai Saring halaman */
      steps,
    };
  }

  // kontrol Baris / Kolom / Nilai
  const okR = (d: Dim) => dims.includes(d) && !used.includes(d);
  const colDims = colDimsFor(kk);
  const rowChips: Chip[] = rd.map((d, ix) => ({
    id: ('r' + ix) as Menu, n: ix + 1, v: DIM[d].l, sep: ix > 0, x: rd.length > 1,
    opts: dims.filter((x) => okR(x) && (x === d || !rd.includes(x))).map((x) => ({ val: x, l: DIM[x].l, on: x === d })),
  }));
  const colChips: Chip[] = cd.map((d, ix) => ({
    id: ('c' + ix) as Menu, n: ix + 1, v: DIM[d].l, sep: ix > 0, x: true,
    opts: colDims.filter((x) => !used.includes(x) && !rd.includes(x) && (x === d || !cd.includes(x))).map((x) => ({ val: x, l: DIM[x].l, on: x === d })),
  }));
  const rowAdd = dims.filter((x) => okR(x) && !rd.includes(x) && !cd.includes(x));
  const colAdd = colDims.filter((x) => !used.includes(x) && !rd.includes(x) && !cd.includes(x));
  const ctl: CtlGroup[] = [
    { k: 'r', l: 'Baris', sep: '›', chips: rowChips, canAdd: rd.length < MAXR && rowAdd.length > 0, addId: 'ra', addH: 'Rincikan baris menurut', addOpts: rowAdd.map((x) => ({ val: x, l: DIM[x].l })) },
    { k: 'c', l: 'Kolom', sep: '×', chips: colChips, canAdd: cd.length < MAXC && colAdd.length > 0, addId: 'ca', addH: cd.length ? 'Pecah kolom menurut' : 'Jadikan kolom', addOpts: colAdd.map((x) => ({ val: x, l: DIM[x].l })) },
  ];
  if (pivot) ctl.push({ k: 'm', l: 'Nilai', sep: '', canAdd: false, addId: 'm', addH: '', addOpts: [], chips: [{ id: 'm', n: 1, v: MS[m], sep: false, x: false, opts: (Object.keys(MS) as Measure[]).map((k) => ({ val: k, l: MS[k], on: k === m })) }] });

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
  const rowL = rd.map((d) => DIM[d].l).join(' › ');
  const colL = cd.map((d) => DIM[d].l).join(' × ');
  const nested = !lst && rd.length > 1;
  return {
    cap: lst ? 'Klik baris untuk membuka detail insiden' : tot.n + ' insiden terverifikasi · ' + (pathTxt || scopeTxt) + ' · ' + rowL + (pivot ? ' × ' + colL : '') + ' · klik angka untuk merinci',
    drilled, crumb,
    showCtl: !lst, showFlat: !lst && !pivot, showPivot: !lst && pivot, showList: !!lst,
    layout: { rd, cd, m },
    ctl, nested, groupKeys, rowL, colL,
    hDim: hd('dim', rowL), heads: COLS.map((c) => hd(c.k, c.l)),
    rows: rowsV, foot, tot,
    pv: {
      rs: cd.length === 2 ? 2 : 1, twoCol: cd.length === 2, head: pvHead, head2: pvHead2, rows: pvRows, foot: pvFoot, hTot: hd(m, 'Total'), m,
      minW: 280 + rd.length * 20 + (ck.length + 1) * 84 + 'px', cols: ck,
      note: pivot ? (nested ? 'Baris abu-abu = subtotal; klik − / + untuk melipat atau membuka rinciannya. ' : '') + 'Nilai sel: ' + MS[m] + (m === 'md' || m === 'lk' ? ' (jumlah orang)' : '') + '. Kolom hanya untuk dimensi dengan paling banyak 12 nilai.' : '',
    },
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

/** CSV = isi tampilan saat ini (baris yang tampil, termasuk subtotal; atau semua insiden di tingkat insiden). */
export function drillCsv(view: DrillView, kk: boolean): string {
  let lines: (string | number)[][];
  if (view.showList) {
    lines = [['Nomor', 'Insiden', 'Kategori', kk ? 'Wilayah kerja' : 'KKKS', kk ? 'Area' : 'WK', 'Wilayah SKK', 'Level', 'Waktu kejadian', 'Kerugian (juta Rp)', 'Meninggal', 'Luka', 'Korban', 'Status']];
    view.lAll.forEach((i) => lines.push([
      i.id, i.t, i.kat, kk ? i.wk : i.kk, kk ? i.area : i.wk, i.wil, LV[i.lv][0], i.day + ' ' + BL[i.m] + ' 2026 ' + i.jam + ' WIB',
      Math.round(i.rp * 10) / 10, i.md, i.lk, casualtyText({ meninggal: i.md, luka: i.lk, unknown: i.unk }), STO[i.st],
    ]));
  } else if (view.showPivot) {
    lines = [[view.rowL, ...view.pv.cols.map((c) => c.join(' · ')), 'Total']];
    view.pv.rows.forEach((r) => lines.push([r.rv.join(' › '), ...r.cells.map((c) => (c.z ? 0 : c.v))]));
    lines.push(['Total', ...view.pv.foot.map((f) => f.v)]);
  } else {
    lines = [[view.rowL, ...COLS.map((c) => c.l)]];
    view.rows.forEach((r) => lines.push([r.rv.join(' › '), ...r.cells.map((c) => (c.z ? 0 : c.v))]));
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
