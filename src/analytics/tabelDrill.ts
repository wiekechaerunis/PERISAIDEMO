// Kartu "Tabel insiden" (TabelDrill, board TD0–TD8 Desain v2, 26 Nov): tabel ringkasan + drill-down.
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

export type Dim = 'kat' | 'wil' | 'kkks' | 'wk' | 'lv' | 'bln' | 'st';
export type Col = 'n' | 'pct' | 'rp' | 'tk' | 'md' | 'lk' | 'op';
export interface Step { d: Dim; v: string }
export interface DrillState {
  path: Step[];
  g: Dim;
  /** tingkat insiden (kolom yang menentukan syarat) */
  list: { c: Col } | null;
  pg: number;
  sort: { k: Col | 'dim'; dir: 'asc' | 'desc' } | null;
  pop: { v: string; c: Col } | null;
  sub: boolean;
  gOpen: boolean;
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
};
export const dimsFor = (kk: boolean): Dim[] => (kk ? ['kat', 'wk', 'lv', 'bln', 'st'] : ['kat', 'wil', 'kkks', 'wk', 'lv', 'bln', 'st']);

export const COLS: { k: Col; l: string }[] = [
  { k: 'n', l: 'Insiden' }, { k: 'pct', l: '%' }, { k: 'rp', l: 'Kerugian' }, { k: 'tk', l: 'Tinggi & Kritis' },
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

export const INIT: DrillState = { path: [], g: 'kat', list: null, pg: 0, sort: null, pop: null, sub: false, gOpen: false };
const clean = { pop: null, sub: false, sort: null, list: null, pg: 0 } as const;

export const openPop = (s: DrillState, v: string, c: Col, sub: boolean): DrillState => ({ ...s, pop: { v, c }, sub, gOpen: false });
export const closePop = (s: DrillState): DrillState => ({ ...s, pop: null, sub: false });
export const toggleSub = (s: DrillState): DrillState => ({ ...s, sub: !s.sub });
/** Rincikan menurut d: nilai baris popover masuk jejak, tabel dikelompokkan menurut d. */
export const drillInto = (s: DrillState, d: Dim): DrillState => (s.pop ? { ...s, ...clean, path: [...s.path, { d: s.g, v: s.pop.v }], g: d } : s);
/** Lihat n insiden: tingkat insiden untuk baris dan kolom popover. */
export const showList = (s: DrillState): DrillState => (s.pop ? { ...s, ...clean, path: [...s.path, { d: s.g, v: s.pop.v }], list: { c: s.pop.c } } : s);
export const reset = (s: DrillState): DrillState => ({ ...s, ...clean, path: [], g: 'kat', gOpen: false });
/** Klik segmen jejak ke-ix (0 = segmen pertama setelah "Semua insiden"). */
export const crumbTo = (s: DrillState, ix: number): DrillState => ({ ...s, ...clean, path: s.path.slice(0, ix + 1), g: s.path[ix + 1]?.d ?? s.g });
export const pickGroup = (s: DrillState, d: Dim): DrillState => ({ ...s, g: d, gOpen: false, sort: null, pop: null, sub: false });
export const toggleGroup = (s: DrillState): DrillState => ({ ...s, gOpen: !s.gOpen, pop: null, sub: false });
export const sortBy = (s: DrillState, k: Col | 'dim'): DrillState => {
  const on = s.sort && s.sort.k === k;
  return { ...s, sort: on ? { k, dir: s.sort!.dir === 'asc' ? 'desc' : 'asc' } : { k, dir: k === 'dim' ? 'asc' : 'desc' }, pop: null, sub: false };
};
export const toPage = (s: DrillState, pg: number): DrillState => ({ ...s, pg });

/* ------------------------------------------------------------------ URL */

/** `?tabel=kat:Pencurian%2FPerampokan|wil:Sumbagsel&lihat=n&kelompok=wil&hal=2` */
export function drillFromParams(p: URLSearchParams, kk: boolean): Pick<DrillState, 'path' | 'g' | 'list' | 'pg'> {
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
  return { path, g, list, pg: list ? pg : 0 };
}

export function drillToParams(cur: URLSearchParams, s: Pick<DrillState, 'path' | 'g' | 'list' | 'pg'>, kk: boolean): URLSearchParams {
  const p = new URLSearchParams(cur);
  ['tabel', 'lihat', 'kelompok', 'hal'].forEach((k) => p.delete(k));
  if (s.path.length) p.set('tabel', s.path.map((x) => `${x.d}:${encodeURIComponent(x.v)}`).join('|'));
  if (s.list) p.set('lihat', s.list.c);
  const used = s.path.map((x) => x.d);
  const def = dimsFor(kk).find((d) => !used.includes(d));
  if (!s.list && s.g !== def) p.set('kelompok', s.g);
  if (s.list && s.pg > 0) p.set('hal', String(s.pg + 1));
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
  const maxN = Math.max(1, ...rows.map((r) => r.n));
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
        bar: c.k === 'n', w: Math.round((r.n / maxN) * 100) + '%', exp: on,
        aria: c.l + ' ' + r.v + ': ' + fmt(c.k, r) + '. Klik untuk pilihan',
      };
    }),
  }));
  const foot = COLS.map((c) => (c.k === 'pct' ? '100%' : c.k === 'rp' ? rp(tot.rp) : String(tot[c.k])));

  // popover aksi
  let popV = null as null | { T: string; S: string; N: number; V: string; subOpts: { d: Dim; l: string }[] };
  if (pop) {
    const gx = groups[pop.v] || [];
    const cond = COND[pop.c];
    const xs = gx.filter((i) => !cond || cond(i));
    popV = {
      N: xs.length, V: pop.v,
      T: pop.v + (CONDL[pop.c] ? ' · ' + CONDL[pop.c] : ''),
      S: xs.length + ' insiden' + (pop.c === 'md' ? ' · ' + gx.reduce((a, i) => a + i.md, 0) + ' orang meninggal' : pop.c === 'lk' ? ' · ' + gx.reduce((a, i) => a + i.lk, 0) + ' orang luka' : pop.c === 'rp' ? ' · ' + rp(xs.reduce((a, i) => a + i.rp, 0)) : ''),
      subOpts: dims.filter((d) => d !== g && !used.includes(d)).map((d) => ({ d, l: DIM[d].l })),
    };
  }

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
    cap: lst ? 'Klik baris untuk membuka detail insiden' : tot.n + ' insiden terverifikasi · ' + (pathTxt || scopeTxt) + ' · klik angka untuk merinci',
    drilled, crumb,
    showTable: !lst, showList: !!lst,
    gLabel: DIM[g].l,
    gOpts: dims.filter((d) => !used.includes(d)).map((d) => ({ d, l: DIM[d].l, on: d === g })),
    hDim: hd('dim', DIM[g].l), heads: COLS.map((c) => hd(c.k, c.l)),
    rows: rowsV, foot, tot,
    pop: popV,
    lN: lXs.length + ' insiden',
    lS: (pathTxt || scopeTxt) + (lst && CONDL[lst.c] ? ' · ' + CONDL[lst.c] : '') + ' · urut level tertinggi lalu terbaru',
    lColL: kk ? 'Wilayah kerja' : 'KKKS · WK', lRows, lAll: lXs,
    pgT: lXs.length ? pg * PG + 1 + '–' + Math.min(lXs.length, pg * PG + PG) + ' dari ' + lXs.length : '',
    pg, pages, prevDis: pg === 0, nextDis: pg >= pages - 1,
    foot2: 'Meninggal/Luka = jumlah orang' + (unk ? ' · ' + unk + ' insiden korban belum diketahui' : ''),
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
  } else {
    lines = [[view.hDim.l, ...COLS.map((c) => c.l)]];
    view.rows.forEach((r) => lines.push([r.v, ...r.cells.map((c) => (c.z ? 0 : c.v))]));
    lines.push(['Total', ...view.foot]);
  }
  return '﻿' + lines.map((l) => l.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** "Buka di daftar insiden": /insiden dengan filter yang sama (jejak + syarat kolom). */
export function listHref(path: Step[], c: Col | null): string {
  const KEY: Record<Dim, string> = { kat: 'kategori', wil: 'wilayah', kkks: 'kkks', wk: 'wk', lv: 'level', bln: 'bulan', st: 'status' };
  const q = new URLSearchParams();
  path.forEach((p) => q.set(KEY[p.d], p.d === 'bln' ? String(BL.indexOf(p.v.split(' ')[0]) + 1) : p.v));
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
