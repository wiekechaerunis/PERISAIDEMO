// Analitik insiden (board Analitik.dc.html, INS-07): angka demo per periode. Logika murni; layar hanya merender hasilnya.
// ASSUMPTION: angka adalah data contoh dari board. Periode memotong atau menyesuaikan seri bulanan, lalu angka lain diskalakan
// dengan faktor yang sama (cara yang sama dengan board). Hanya insiden disetujui yang dihitung; kerawanan bukan insiden.
export type Period = 'm1' | 'm3' | 'sm' | 'ytd' | 'l12' | 'y25' | 'cu';
export type Measure = 'n' | 'rp';
export type SortKey = 'cnt' | 'rp' | 'tk' | 'dur';

export const PERIODS: { key: Period; label: string; desc: string }[] = [
  { key: 'm1', label: 'Bulan ini', desc: 'Okt 2026' },
  { key: 'm3', label: '3 bulan terakhir', desc: 'Agt–Okt 2026' },
  { key: 'sm', label: 'Semester berjalan', desc: 'Jul–Okt 2026' },
  { key: 'ytd', label: 'Tahun berjalan', desc: 'Jan–Okt 2026' },
  { key: 'l12', label: '12 bulan terakhir', desc: 'Nov 2025–Okt 2026' },
  { key: 'y25', label: 'Tahun 2025', desc: 'Jan–Des 2025' },
  { key: 'cu', label: 'Rentang khusus', desc: 'Pilih tanggal awal dan akhir' },
];

const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt'];
const SEN = 'PT Samudra Energi Nusantara';
const PL: Record<Period, string> = { m1: 'Okt 2026', m3: 'Agt–Okt 2026', sm: 'Jul–Okt 2026', ytd: 'Jan–Okt 2026', l12: 'Nov 2025–Okt 2026', y25: 'Tahun 2025', cu: '1 Jul–15 Okt 2026' };
const PV: Record<Period, string> = { m1: 'Okt 2025', m3: 'Agt–Okt 2025', sm: 'Jul–Okt 2025', ytd: 'Jan–Okt 2025', l12: 'Nov 2024–Okt 2025', y25: 'Tahun 2024', cu: '1 Jul–15 Okt 2025' };

type Cat = [string, number, number];
type Dot = [string, number, number, number, number];
interface Data { mn: number[]; mr: number[]; cat: Cat[]; sn: number[]; sr: number[]; dots: Dot[]; kr: number[]; prevN: number; prevR: number; prevTK: number }

const SKK_DATA: Data = {
  mn: [14, 11, 16, 12, 18, 15, 13, 19, 17, 21], mr: [420, 310, 580, 290, 760, 510, 380, 890, 640, 1120],
  cat: [['Pencurian/Perampokan', 48, 1840], ['Pencurian minyak', 27, 2150], ['Unjuk rasa', 18, 120], ['Blokade area', 14, 980], ['Perusakan material', 12, 310], ['Ancaman', 10, 0], ['Kasus tanah', 8, 60], ['Lainnya', 7, 90], ['Pemerasan', 4, 85], ['Kebakaran', 3, 180], ['Penghentian kegiatan/operasi', 2, 40], ['Serangan fisik (usulan)', 2, 25], ['Kecelakaan lalu lintas', 1, 20]],
  sn: [31, 52, 46, 21, 6], sr: [40, 610, 1950, 2300, 1000],
  dots: [['Musi Banyuasin', 196, 200, 21, 910], ['Banyuasin', 214, 186, 13, 510], ['Mimika', 913, 252, 28, 1960], ['Kutai Kartanegara', 478, 150, 22, 640], ['Siak', 141, 126, 19, 710], ['Bojonegoro', 380, 306, 15, 390], ['Aceh Timur', 40, 36, 9, 240], ['Natuna', 289, 48, 6, 190], ['Luwu', 548, 214, 8, 150], ['Indramayu', 272, 292, 7, 110], ['Tabalong', 446, 186, 8, 90]],
  kr: [14, 16, 19, 15, 21, 18, 17, 22, 20, 24], prevN: 139, prevR: 4800, prevTK: 24,
};
const KKKS_DATA: Data = {
  mn: [2, 3, 4, 2, 5, 3, 2, 4, 3, 6], mr: [60, 85, 140, 40, 210, 95, 55, 190, 120, 425],
  cat: [['Pencurian/Perampokan', 11, 260], ['Pencurian minyak', 7, 470], ['Blokade area', 4, 420], ['Perusakan material', 4, 85], ['Unjuk rasa', 3, 15], ['Ancaman', 2, 0], ['Lainnya', 2, 60], ['Kebakaran', 1, 110]],
  sn: [6, 12, 9, 5, 2], sr: [10, 140, 380, 470, 420],
  dots: [['Sumur ADR-07 · Musi Banyuasin', 196, 200, 9, 160], ['WK Andalas Darat (lokasi lain)', 180, 214, 12, 750], ['Terminal Arunika', 222, 196, 7, 340], ['Jalan akses SP Batu Ampar', 210, 176, 6, 170]],
  kr: [3, 4, 5, 3, 5, 4, 4, 5, 4, 5], prevN: 29, prevR: 1100, prevTK: 5,
};

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
/** Rupiah dari angka juta: "Rp420 jt", "Rp1,12 M". */
export const rpJt = (jt: number): string => {
  if (!jt) return 'Rp0';
  if (jt >= 1000) return 'Rp' + (jt / 1000).toFixed(2).replace(/0$/, '').replace('.', ',') + ' M';
  return 'Rp' + jt + ' jt';
};
const pct = (a: number, b: number) => Math.round(((a - b) / b) * 100);
const up = (a: number, b: number) => (a >= b ? '▲ ' : '▼ ') + Math.abs(pct(a, b)) + '%';

export interface Kpi { label: string; val: string; unit: string; tr: string; trCls: string; cmp: string; link: string }
export interface AttnItem { t: string; d: string }
export interface TableRow { n: string; sub: string; cnt: string; rpL: string; tk: string; durL: string; kepW: number | null; kepL: string; last: string }

export interface AnalitikView {
  perLabel: string;
  kpis: Kpi[];
  attn: AttnItem[];
  mLabel: string;
  trendTitle: string;
  trend: { m: string; lbl: string; h: number }[];
  trendTotal: string;
  cats: { n: string; w: number; lbl: string; rest: boolean }[];
  sev: { n: string; c: string; w: number; lbl: string; pct: string }[];
  dots: { x: number; y: number; s: number; tip: string }[];
  topLoc: { n: string; v: string }[];
  krTotal: number;
  krPts: string;
  krAria: string;
  tblTitle: string;
  tblSub: string;
  col0: string;
  colLast: string;
  rows: TableRow[];
  tblFoot: string;
  foot: string;
}

export interface AnalitikInput {
  skk: boolean;
  period: Period;
  measure: Measure;
  sort: SortKey;
  dir: 'asc' | 'desc';
  /** label rentang khusus, mis. "1 Jul–15 Okt 2026" */
  customLabel?: string;
}

export function analitik({ skk, period: P, measure, sort, dir, customLabel }: AnalitikInput): AnalitikView {
  const N = measure === 'n';
  const base = skk ? SKK_DATA : KKKS_DATA;
  const D: Data = { ...base, cat: base.cat.map((c) => [...c] as Cat), dots: base.dots.map((d) => [...d] as Dot), sn: [...base.sn], sr: [...base.sr] };
  const n25 = D.mn.map((v) => Math.max(1, Math.round(v * 0.88))).concat([Math.round(D.mn[9] * 0.7), Math.round(D.mn[8] * 0.75)]);
  const r25 = D.mr.map((v) => Math.round(v * 0.82)).concat([Math.round(D.mr[9] * 0.6), Math.round(D.mr[8] * 0.7)]);
  const M25 = MO.concat(['Nov', 'Des']);
  let pm: string[], pn: number[], pr: number[];
  if (P === 'm1') {
    const w = [0.24, 0.28, 0.2, 0.28];
    pm = ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4'];
    pn = w.map((x) => Math.max(1, Math.round(D.mn[9] * x)));
    pr = w.map((x) => Math.round(D.mr[9] * x));
  } else if (P === 'm3') { pm = MO.slice(7); pn = D.mn.slice(7); pr = D.mr.slice(7); }
  else if (P === 'sm' || P === 'cu') { pm = MO.slice(6); pn = D.mn.slice(6); pr = D.mr.slice(6); }
  else if (P === 'l12') { pm = ['Nov', 'Des'].concat(MO); pn = n25.slice(10).concat(D.mn); pr = r25.slice(10).concat(D.mr); }
  else if (P === 'y25') { pm = M25; pn = n25; pr = r25; }
  else { pm = MO; pn = D.mn; pr = D.mr; }
  const fN = sum(pn) / sum(D.mn);
  const fR = sum(pr) / sum(D.mr);
  const sc = (v: number, f: number) => Math.round(v * f);
  D.cat = D.cat.map((c) => [c[0], sc(c[1], fN), sc(c[2], fR)]);
  D.sn = D.sn.map((v) => sc(v, fN));
  D.sr = D.sr.map((v) => sc(v, fR));
  D.dots = D.dots.map((d) => [d[0], d[1], d[2], Math.max(1, sc(d[3], fN)), sc(d[4], fR)]);
  D.prevN = sc(D.prevN, fN);
  D.prevR = sc(D.prevR, fR);
  D.prevTK = Math.max(1, sc(D.prevTK, fN));
  const krAll = D.kr;
  const kr = P === 'y25' ? krAll.map((v) => Math.round(v * 0.85)) : P === 'ytd' || P === 'l12' ? krAll : krAll.slice(P === 'm3' ? 7 : P === 'm1' ? 8 : 6);
  const krTotal = P === 'm1' ? krAll[9] : sum(kr);
  const perLabel = P === 'cu' && customLabel ? customLabel : PL[P];
  const prevLabel = PV[P];

  const totN = sum(pn);
  const totR = sum(pr);
  const tk = D.sn[3] + D.sn[4];
  const listLink = skk ? 'Lihat daftar' : 'Lihat daftar';
  const kpis: Kpi[] = [
    { label: 'Insiden', val: String(totN), unit: 'insiden', tr: up(totN, D.prevN), trCls: totN > D.prevN ? 'tr-bad' : 'tr-good', cmp: `vs ${prevLabel} (${D.prevN})`, link: listLink },
    { label: 'Kerugian', val: rpJt(totR), unit: '', tr: up(totR, D.prevR), trCls: totR > D.prevR ? 'tr-bad' : 'tr-good', cmp: `vs ${prevLabel} (${rpJt(D.prevR)})`, link: 'Rincian per kategori' },
    { label: 'Tinggi & Kritis', val: String(tk), unit: 'insiden', tr: up(tk, D.prevTK), trCls: tk > D.prevTK ? 'tr-bad' : 'tr-good', cmp: `vs ${prevLabel} (${D.prevTK})`, link: listLink },
    skk
      ? { label: 'KKKS mengirim laporan', val: '13', unit: 'dari 131 KKKS', tr: 'Okt 2026', trCls: 'tr-flat', cmp: 'insiden atau kerawanan · 9–13 per bulan sejak Jan', link: 'Lihat daftar KKKS' }
      : { label: 'Rata-rata lama penanganan', val: '6,2', unit: 'hari', tr: '▼ 0,8 hari', trCls: 'tr-good', cmp: `vs ${prevLabel} (7,0 hari)`, link: 'Lihat yang lewat tenggat' },
  ];
  const attn: AttnItem[] = skk
    ? [
        { t: '2 insiden Tinggi/Kritis lewat tenggat', d: `Penghadangan truk logistik (Kritis) · ${SEN}, dan 1 lainnya.` },
        { t: 'Lokasi berulang: Sumur ADR-07', d: `3 insiden dalam 90 hari · ${SEN}.` },
        { t: '2 insiden Tinggi belum diperiksa > 3 hari', d: 'Belum masuk angka di halaman ini.' },
        { t: '3 insiden diturunkan jadi kerawanan bulan ini · 1 di antaranya Tinggi', d: 'Keluar dari hitungan insiden dan tenggat penanganan. Alasan tercatat di jejak audit.' },
      ]
    : [
        { t: 'Penghadangan truk logistik lewat tenggat', d: 'INS-SEN-2026-0005 · Kritis · Dalam penanganan.' },
        { t: 'Lokasi berulang: Sumur ADR-07', d: '3 insiden dalam 90 hari, 1 belum diperiksa.' },
        { t: '2 laporan belum diperiksa', d: 'INS-SEN-2026-0007 dan INS-SEN-2026-0006 belum masuk angka dan rekap SKK.' },
      ];

  const vals = N ? pn : pr;
  const mx = Math.max(...vals);
  const trend = vals.map((v, i) => ({ m: pm[i], lbl: N ? String(v) : rpJt(v), h: (v / mx) * 86 }));
  const ci = N ? 1 : 2;
  const sorted = [...D.cat].sort((a, b) => b[ci] - a[ci]);
  const top = sorted.slice(0, 8);
  const rest = sorted.slice(8);
  const cmax = top[0][ci] || 1;
  const cats = top.map((c) => ({ n: c[0], w: (c[ci] / cmax) * 100, lbl: N ? String(c[1]) : rpJt(c[2]), rest: false }));
  if (rest.length) {
    const rv = sum(rest.map((c) => c[ci]));
    cats.push({ n: `Kategori lain (${rest.length})`, w: (rv / cmax) * 100, lbl: N ? String(rv) : rpJt(rv), rest: true });
  }
  const SL: [string, string][] = [['Sangat rendah', 'var(--ink-subtle)'], ['Rendah', 'var(--sev-low-dot)'], ['Sedang', 'var(--sev-medium-dot)'], ['Tinggi', 'var(--sev-high-dot)'], ['Kritis', 'var(--sev-critical-dot)']];
  const sv = N ? D.sn : D.sr;
  const st = sum(sv) || 1;
  const sev = SL.map(([n, c], i) => ({ n, c, w: (sv[i] / st) * 100, lbl: N ? String(sv[i]) : rpJt(sv[i]), pct: Math.round((sv[i] / st) * 100) + '% dari total' }));
  const di = N ? 3 : 4;
  const dmax = Math.max(...D.dots.map((d) => d[di])) || 1;
  const dots = D.dots.map((d) => ({ x: d[1] / 10, y: d[2] / 4, s: Math.round(10 + Math.sqrt(d[di] / dmax) * 30), tip: `${d[0]}: ${N ? d[3] + ' insiden' : rpJt(d[4])}` }));
  const topLoc = [...D.dots].sort((a, b) => b[di] - a[di]).slice(0, 3).map((d) => ({ n: d[0], v: N ? d[3] + ' insiden' : rpJt(d[4]) }));
  const kmax = Math.max(...kr);
  const kmin = Math.min(...kr);
  const kst = 192 / Math.max(1, kr.length - 1);
  const krng = kmax - kmin || 1;
  const krPts = kr.map((v, i) => (4 + i * kst).toFixed(1) + ',' + (42 - ((v - kmin) / krng) * 36).toFixed(1)).join(' ');

  type T = { n: string; sub: string; cnt: number; rp: number; tk: number; dur: number; kep?: number; last?: string };
  const T: T[] = skk
    ? [
        { n: SEN, sub: '2 WK · Sumatera Selatan', cnt: 34, rp: 1420, tk: 7, dur: 6.2, kep: 10 },
        { n: 'PT Rimba Bumi Energi', sub: '1 WK · Papua Tengah', cnt: 28, rp: 1960, tk: 9, dur: 11.4, kep: 8 },
        { n: 'PT Pesisir Raya Energi', sub: '1 WK · Kalimantan Timur', cnt: 22, rp: 640, tk: 3, dur: 4.8, kep: 10 },
        { n: 'PT Lintas Andalas Petro', sub: '1 WK · Riau', cnt: 19, rp: 710, tk: 2, dur: 5.5, kep: 7 },
        { n: 'PT Tanjung Mas Hulu', sub: '1 WK · Jawa Timur', cnt: 15, rp: 390, tk: 2, dur: 7.1, kep: 6 },
        { n: 'PT Serambi Utara Energi', sub: '1 WK · Aceh', cnt: 9, rp: 240, tk: 1, dur: 8.3, kep: 4 },
      ]
    : [
        { n: 'WK Andalas Darat', sub: 'Musi Banyuasin', cnt: 21, rp: 910, tk: 4, dur: 5.8, last: 'Sumur ADR-07 (3)' },
        { n: 'WK Batu Ampar', sub: 'Banyuasin', cnt: 13, rp: 510, tk: 3, dur: 6.9, last: 'Jalan akses SP Batu Ampar (2)' },
      ];
  T.forEach((r) => { r.cnt = Math.max(1, sc(r.cnt, fN)); r.rp = sc(r.rp, fR); r.tk = sc(r.tk, fN); });
  const sgn = dir === 'asc' ? 1 : -1;
  const rows: TableRow[] = [...T].sort((a, b) => (a[sort] - b[sort]) * sgn).map((r) => ({
    n: r.n, sub: r.sub, cnt: String(r.cnt), rpL: rpJt(r.rp), tk: String(r.tk), durL: String(r.dur).replace('.', ',') + ' hari',
    kepW: skk ? (r.kep ?? 0) * 10 : null, kepL: `${r.kep ?? 0}/10 bln`, last: r.last ?? '',
  }));

  return {
    perLabel, kpis, attn, mLabel: N ? 'Jumlah insiden' : 'Kerugian (Rp)',
    trendTitle: P === 'm1' ? 'Tren per minggu' : 'Tren per bulan', trend, trendTotal: N ? totN + ' insiden' : rpJt(totR),
    cats, sev, dots, topLoc, krTotal, krPts, krAria: 'Tren kerawanan per bulan, ' + kr.join(', '),
    tblTitle: skk ? 'Per KKKS' : 'Per wilayah kerja',
    tblSub: skk ? 'Klik nama KKKS untuk melihat daftar insidennya.' : 'Klik wilayah kerja untuk melihat daftar insidennya.',
    col0: skk ? 'KKKS' : 'Wilayah kerja', colLast: skk ? 'Bulan dengan laporan' : 'Lokasi terbanyak', rows,
    tblFoot: skk ? '6 dari 18 KKKS yang punya insiden disetujui · 113 KKKS tanpa insiden pada periode ini' : '2 wilayah kerja',
    foot: 'Angka hanya mencakup insiden yang sudah disetujui KKKS; draf dan laporan yang belum diperiksa tidak dihitung. Insiden terbatas ikut dihitung di angka total tanpa rincian. Kerawanan tidak dihitung sebagai insiden.',
  };
}
