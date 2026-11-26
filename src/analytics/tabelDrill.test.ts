/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { DashboardLogic } from '@/generated/DashboardLogic';
import { INC } from '@/data/dashboard';
import { DASH_CASUALTIES } from '@/data/dashboardIncidentMeta';
import { casualtiesOfDashboard, casualtiesOfIncident, countCasualties } from './casualties';
import {
  closePop, crumbTo, drillCsv, drillFromParams, drillInto, drillToParams, drillView, INIT, layoutOf, listHref, openPop,
  reset, rowKey, setAllGroups, setCols, setMeasure, setRows, showList, sortBy, toDrillInc, toggleGroup,
  type DrillRow, type DrillState,
} from './tabelDrill';

const PERIODE = { from: '2026-03-01', to: '2026-04-30', full: false, label: 'Mar–Apr 2026', cap: 'Mar–Apr 2026', text: 'Maret–April 2026' };
const dash = (peran: 'skk' | 'kkks', patch: Record<string, any> = {}) => {
  const { periode, ...st } = patch;
  const d: any = new DashboardLogic({ peran, ...(periode ? { periode } : {}) });
  d.state = { ...d.state, ...st };
  const v = d.renderVals();
  return { v, inc: (v.tdInc as any[]).map(toDrillInc) };
};
const num = (x: string) => (x === '–' ? 0 : Number(x));

describe('korban (casualties.ts)', () => {
  it('jumlah orang; Luka = P3K + klinik/RS + luka berat; Belum diketahui tidak dihitung', () => {
    expect(countCasualties({ closed: false, pelapor: { meninggal: 1, berat: 1, p3k: 2, klinik: 1 } })).toEqual({ meninggal: 1, luka: 4, unknown: false });
    expect(countCasualties({ closed: false, pelapor: { belum: 1 } })).toEqual({ meninggal: 0, luka: 0, unknown: true });
  });
  it('setelah Ditutup rincian PIC menggantikan isian pelapor; sebelum ditutup isian pelapor', () => {
    expect(countCasualties({ closed: true, pelapor: { p3k: 1 }, pic: { p3k: 1, klinik: 1 } }).luka).toBe(2);
    expect(countCasualties({ closed: false, pelapor: { p3k: 1 }, pic: { p3k: 1, klinik: 1 } }).luka).toBe(1);
    expect(countCasualties({ closed: true, pelapor: { p3k: 3 } }).luka).toBe(3);
    expect(casualtiesOfIncident({ status: 'ditutup', detail: { casualties: { p3k: 1 } } as any, handling: { closure: { casualtiesFinal: { meninggal: 1 } } } as any }).meninggal).toBe(1);
  });
  it('data demo: ≥2 insiden Kritis dengan korban meninggal, ≥4 dengan luka, ≥1 Belum diketahui; level tidak diubah', () => {
    const rows = (INC as any[]).map((r) => ({ r, c: casualtiesOfDashboard(r[0], r[4]) }));
    const md = rows.filter((x) => x.c.meninggal > 0);
    expect(md.length).toBeGreaterThanOrEqual(2);
    md.forEach((x) => expect(x.r[3]).toBe(4));
    expect(rows.filter((x) => x.c.luka > 0).length).toBeGreaterThanOrEqual(4);
    expect(rows.filter((x) => x.c.unknown).length).toBeGreaterThanOrEqual(1);
    Object.keys(DASH_CASUALTIES).forEach((no) => expect((INC as any[]).filter((r) => r[0] === no).length).toBe(1));
  });
});

const CASES: [string, 'skk' | 'kkks', Record<string, any>][] = [
  ['SKK nasional', 'skk', {}],
  ['SKK Sumbagsel', 'skk', { z: 'sbs' }],
  ['SKK level Tinggi + Kritis', 'skk', { lv: [0, 0, 0, 1, 1] }],
  ['SKK satu KKKS', 'skk', { kk: 'PT Samudra Energi Nusantara' }],
  ['SKK satu WK', 'skk', { z: 'sbs', loc: 'mub' }],
  ['SKK kategori Pencurian', 'skk', { kat: 0 }],
  ['SKK periode Mar–Apr', 'skk', { periode: PERIODE }],
  ['KKKS', 'kkks', {}],
  ['KKKS kategori Pencurian', 'kkks', { kat: 0 }],
  ['KKKS level Kritis', 'kkks', { lv: [0, 0, 0, 0, 1] }],
];

describe('Tabel insiden: baris Total = kartu angka (satu sumber)', () => {
  it.each(CASES)('%s', (_, peran, patch) => {
    const { v, inc } = dash(peran, patch);
    const view = drillView(inc, INIT, peran === 'kkks');
    expect(view.foot[0]).toBe(v.kpis[0].val); // Insiden terverifikasi
    expect(view.foot[2]).toBe(v.kpis[1].val); // Kerugian
    expect(view.foot[3]).toBe(v.kpis[2].val); // Tinggi & Kritis (juga dengan filter Kategori)
  });
});

describe('Angka per bulan satu sumber: Tabel insiden (Kolom Bulan) = Tren per bulan = Insiden dan kerawanan', () => {
  const MONTH_CASES: [string, 'skk' | 'kkks', Record<string, any>][] = CASES.concat([
    ['SKK kategori Unjuk rasa', 'skk', { kat: 4 }],
    ['SKK Kalsul', 'skk', { z: 'kls' }],
  ]);
  it.each(MONTH_CASES)('%s', (_, peran, patch) => {
    const { v, inc } = dash(peran, patch);
    const t = drillView(inc, { ...INIT, cols: ['bln'] }, peran === 'kkks');
    const byM: Record<string, string> = {};
    t.pv.head.forEach((h, j) => { byM[h.l] = t.pv.foot[j].v; });
    v.trend.forEach((b: any) => expect(num(byM[b.m] ?? '0')).toBe(Number(b.lbl)));
    v.ikBars.forEach((b: any) => expect(b.tip.split('\n')[1]).toBe('Insiden: ' + (byM[b.m] ?? '0')));
    // Jenis terbanyak dan Status penanganan dari insiden yang sama
    const byCat = drillView(inc, INIT, peran === 'kkks').rows;
    if (patch.kat == null) v.topCat.filter((c: any) => !c.cls.includes('dtt')).forEach((c: any) => expect(c.v).toBe(byCat.find((r) => r.rv[0] === c.n)?.cells[0].v));
    const bySt = drillView(inc, { ...INIT, rows: ['st'] }, peran === 'kkks').rows;
    v.st.slice(0, 3).forEach((x: any) => expect(x.v).toBe(bySt.find((r) => r.rv[0] === x.n)?.cells[0].v ?? '0'));
  });
  it('sebaran bulan KKKS = 3, 4, 3, 5, 5, 4 (seed: bulan kejadian dipindah, bukan angka)', () => {
    const { v } = dash('kkks');
    expect(v.trend.map((b: any) => b.lbl)).toEqual(['3', '4', '3', '5', '5', '4']);
  });
});

describe('Tabel insiden: drill', () => {
  const { inc } = dash('skk');
  const go = (s: DrillState) => drillView(inc, s, false);

  it('ringkasan (TD1): Baris [Kategori] [+ Tambah] · Kolom [+ Tambah], 7 kolom ukuran, 0 = "–"', () => {
    const v = go(INIT);
    expect(v.hDim.l).toBe('Kategori');
    expect(v.heads.map((h) => h.l)).toEqual(['Insiden (jumlah)', 'Insiden (%)', 'Kerugian', 'Tinggi & Kritis', 'Meninggal', 'Luka', 'Masih terbuka']);
    expect(v.rows[0].rv).toEqual(['Pencurian/Perampokan']);
    expect(v.rows.every((r) => r.cells.every((c) => !c.z || c.v === '0' || c.v === 'Rp0' || c.v === '0%'))).toBe(true);
    expect(v.cap).toBe(`${v.tot.n} insiden terverifikasi · seluruh KKKS · Kategori · klik angka untuk merinci`);
    expect(v.ctl.map((g) => [g.l, g.chips.map((c) => c.v), g.canAdd])).toEqual([['Baris', ['Kategori'], true], ['Kolom', [], true]]);
    expect(v.ctl[0].chips[0].x).toBe(false); // chip Baris terakhir tidak bisa dihapus
    expect(v.ctl[0].addH).toBe('Rincikan baris menurut');
    expect(v.ctl[1].addH).toBe('Jadikan kolom');
    expect(v.ctl[1].addOpts.map((o) => o.l)).toEqual(['Wilayah SKK', 'Level', 'Triwulan', 'Bulan', 'Status penanganan']);
    expect(v.nested).toBe(false);
    expect(v.drilled).toBe(false);
  });

  it('popover aksi (TD2) dan Rincikan (TD3): dimensi yang dipakai tidak ditawarkan; popover kiri/kanan', () => {
    let s = openPop(INIT, ['Pencurian/Perampokan'], 'n', false);
    const v = go(s);
    expect(v.pop!.T).toBe('Pencurian/Perampokan');
    expect(v.pop!.subOpts.map((o) => o.l)).toEqual(['Wilayah SKK', 'KKKS', 'Wilayah kerja', 'Level', 'Triwulan', 'Bulan', 'Status penanganan']);
    expect(v.rows[0].cells.map((c) => c.side)).toEqual(['l', 'l', 'l', 'l', 'r', 'r', 'r']);
    s = drillInto(s, 'wil', false);
    const v4 = go(s);
    expect(v4.crumb.map((c) => c.t)).toEqual(['Semua insiden', 'Kategori: Pencurian/Perampokan']);
    expect(v4.hDim.l).toBe('Wilayah SKK');
    expect(v4.ctl[0].chips[0].opts.map((o) => o.l)).not.toContain('Kategori');
    expect(v4.rows.map((r) => r.rv[0])).toEqual(['Pusat', 'Sumbagut', 'Sumbagsel', 'Kalsul', 'Jabanusa'].filter((w) => v4.rows.some((r) => r.rv[0] === w)));
  });

  it('tingkat insiden (TD5): 10 per halaman, urut level tertinggi lalu terbaru', () => {
    let s = drillInto(openPop(INIT, ['Pencurian/Perampokan'], 'n', false), 'wil', false);
    s = showList(openPop(s, ['Sumbagsel'], 'n', false), false);
    const v = go(s);
    expect(v.showList).toBe(true);
    expect(v.showCtl).toBe(false);
    expect(v.crumb.map((c) => c.t)).toEqual(['Semua insiden', 'Kategori: Pencurian/Perampokan', 'Wilayah SKK: Sumbagsel', `${v.lAll.length} insiden`]);
    expect(v.lRows.length).toBe(Math.min(10, v.lAll.length));
    for (let i = 1; i < v.lAll.length; i++) expect(v.lAll[i - 1].lv).toBeGreaterThanOrEqual(v.lAll[i].lv);
    expect(v.cap).toBe('Klik baris untuk membuka detail insiden');
    expect(v.lS).toBe('Pencurian/Perampokan · Sumbagsel · urut level tertinggi lalu terbaru');
  });

  it('korban (TD6): Total Meninggal → insiden dengan korban meninggal; bar di Insiden (%)', () => {
    const v0 = go(INIT);
    expect(Number(v0.foot[4])).toBeGreaterThanOrEqual(2);
    const v = go({ ...INIT, list: { c: 'md' } });
    expect(v.lAll.every((i) => i.md > 0)).toBe(true);
    expect(v.crumb.at(-1)!.t).toBe(`${v.lAll.length} insiden · ada korban meninggal`);
    expect(v.lRows[0].kc).toBe('kb');
    expect(go({ ...INIT, list: { c: 'tk' } }).lAll.every((i) => i.lv >= 3)).toBe(true);
    expect(go({ ...INIT, list: { c: 'op' } }).lAll.every((i) => i.st !== 2)).toBe(true);
    expect(go({ ...INIT, list: { c: 'lk' } }).lAll.every((i) => i.lk > 0)).toBe(true);
    expect(v0.foot2).toBe(`Insiden (%) = porsi dari ${v0.tot.n} insiden di tampilan ini. Meninggal/Luka = jumlah orang · 1 insiden korban belum diketahui`);
    const pc = v0.rows[0].cells.find((c) => c.k === 'pct')!;
    expect(pc.bar).toBe(true);
    expect(pc.w).toBe(pc.v);
    expect(v0.rows[0].cells.find((c) => c.k === 'n')!.bar).toBe(false);
    expect(v0.foot[1]).toBe('100%');
  });

  it('breadcrumb kembali, Reset, sortir, urutan alami', () => {
    const s = drillInto(openPop(drillInto(openPop(INIT, ['Pencurian/Perampokan'], 'n', true), 'wil', false), ['Sumbagsel'], 'n', true), 'lv', false);
    expect(go(s).rows.map((r) => r.rv[0])).toEqual(['Kritis', 'Tinggi', 'Sedang', 'Rendah', 'Sangat rendah'].filter((l) => go(s).rows.some((r) => r.rv[0] === l)));
    const back = crumbTo(s, 0);
    expect(back.path).toHaveLength(1);
    expect(back.rows).toEqual(['wil']);
    expect(reset({ ...s, rows: ['wil', 'kkks'], cols: ['lv'], cl: { x: true } })).toMatchObject({ path: [], rows: ['kat'], cols: [], cl: {}, list: null });
    const sorted = go(sortBy(INIT, 'rp')).rows.map((r) => r.rv[0]);
    expect(go(sortBy(sortBy(INIT, 'rp'), 'rp')).rows.map((r) => r.rv[0])).toEqual([...sorted].reverse().sort((a, b) => sorted.indexOf(b) - sorted.indexOf(a)));
    expect(go(setRows(INIT, ['bln'])).rows[0].rv[0]).toBe('Jan 2026');
    expect(closePop(openPop(INIT, ['x'], 'n', true))).toMatchObject({ pop: null, sub: false });
  });

  it('KKKS (TD7, TD8): tanpa KKKS dan Wilayah SKK; daftar per WK', () => {
    const k = dash('kkks').inc;
    const v = drillView(k, INIT, true);
    expect(v.ctl[0].addOpts.map((o) => o.l)).toEqual(['Wilayah kerja', 'Level', 'Triwulan', 'Bulan', 'Status penanganan']);
    expect(v.ctl[1].addOpts.map((o) => o.l)).toEqual(['Level', 'Triwulan', 'Bulan', 'Status penanganan']);
    expect(v.cap).toContain('wilayah kerja Anda');
    const s = showList(openPop(drillInto(openPop(INIT, ['Pencurian/Perampokan'], 'n', true), 'wk', true), ['WK Andalas Darat'], 'n', false), true);
    const l = drillView(k, s, true);
    expect(l.lColL).toBe('Wilayah kerja');
    expect(l.lRows.every((r) => r.c1 === 'WK Andalas Darat')).toBe(true);
  });

  it('CSV dan tautan daftar insiden', () => {
    const csv = drillCsv(go(INIT), false);
    expect(csv.split('\r\n')[0]).toBe('﻿Kategori,Insiden (jumlah),Insiden (%),Kerugian,Tinggi & Kritis,Meninggal,Luka,Masih terbuka');
    expect(csv).toContain('\r\nTotal,');
    expect(listHref([{ d: 'kat', v: 'Pencurian/Perampokan' }, { d: 'wil', v: 'Sumbagsel' }], 'md')).toBe('/insiden?kategori=Pencurian%2FPerampokan&wilayah=Sumbagsel&korban=meninggal');
    expect(listHref([{ d: 'tw', v: 'TW II 2026' }], null)).toBe('/insiden?triwulan=2');
  });
});

describe('Tabel insiden: susunan Baris · Kolom · Nilai (TD9–TD20)', () => {
  const { inc } = dash('skk');
  const go = (s: DrillState, k = false, data = inc) => drillView(data, s, k);
  /** subtotal baris induk = jumlah anak langsung, di setiap sel */
  const checkTree = (rows: DrillRow[], depthOf: (r: DrillRow) => number) => {
    let groups = 0;
    rows.forEach((r, ix) => {
      if (r.rc !== 'grp' || !r.open) return;
      const d = depthOf(r);
      const kids: DrillRow[] = [];
      for (let j = ix + 1; j < rows.length && depthOf(rows[j]) > d; j++) if (depthOf(rows[j]) === d + 1) kids.push(rows[j]);
      expect(kids.length).toBeGreaterThan(0);
      expect(r.cnt.split(' ')[0]).toBe(String(kids.length));
      r.cells.forEach((c, k) => {
        if (c.k === 'pct' || c.k === 'rp') return; // persen dan rupiah dibulatkan; jumlahnya dicek lewat Insiden
        expect(kids.reduce((a, x) => a + num(x.cells[k].v), 0)).toBe(num(c.v));
      });
      groups++;
    });
    return groups;
  };
  const depth = (r: DrillRow) => r.rv.length - 1;

  it('TD18: Kategori › Wilayah SKK tanpa kolom: baris induk = subtotal 7 ukuran, rincian menjorok 28 px, bisa dilipat', () => {
    const st = setRows(INIT, ['kat', 'wil']);
    const v = go(st);
    expect(v.showFlat).toBe(true);
    expect(v.hDim.l).toBe('Kategori › Wilayah SKK');
    expect(v.nested).toBe(true);
    expect(checkTree(v.rows, depth)).toBeGreaterThan(3);
    expect(v.rows.find((r) => r.rc === 'ch')!.pad).toBe('28px');
    expect(v.rows.find((r) => r.rc === 'grp')!.cnt).toMatch(/^\d+ Wilayah SKK$/);
    // lipat satu grup: rinciannya hilang, subtotal tetap
    const g = v.rows.find((r) => r.rc === 'grp')!;
    const s1 = toggleGroup(st, g.key, true);
    const v1 = go(s1);
    expect(v1.rows.some((r) => r.rc === 'ch' && r.rv[0] === g.rv[0])).toBe(false);
    expect(v1.rows.find((r) => r.key === g.key)!.cells[0].v).toBe(g.cells[0].v);
    // Lipat semua / Buka semua
    expect(go(setAllGroups(s1, v.groupKeys, true)).rows.every((r) => r.rc === 'grp')).toBe(true);
    expect(go(setAllGroups(s1, v.groupKeys, false)).rows.length).toBe(v.rows.length);
  });

  it('TD20: 3 tingkat baris (Kategori › Wilayah SKK › KKKS × Triwulan): subtotal di tiap tingkat, Total kanan = jumlah sel', () => {
    const v = go({ ...INIT, rows: ['kat', 'wil', 'kkks'], cols: ['tw'] });
    expect(v.showPivot).toBe(true);
    expect(v.rowL).toBe('Kategori › Wilayah SKK › KKKS');
    expect(checkTree(v.pv.rows, depth)).toBeGreaterThan(5);
    expect(v.pv.rows.some((r) => r.pad === '56px')).toBe(true);
    v.pv.rows.forEach((r) => expect(num(r.cells.at(-1)!.v)).toBe(r.cells.slice(0, -1).reduce((a, c) => a + num(c.v), 0)));
    expect(v.ctl[0].canAdd).toBe(false); // maks. 3 baris
  });

  it('TD19: Kategori × Triwulan × Level: header 2 tingkat, jumlah sel per baris = Total', () => {
    const v = go({ ...INIT, cols: ['tw', 'lv'] });
    expect(v.pv.twoCol).toBe(true);
    expect(v.pv.rs).toBe(2);
    expect(v.pv.head.map((h) => h.l)).toEqual(['TW I', 'TW II']);
    expect(v.pv.head.every((h) => h.span === 5 && h.cls === 'cg')).toBe(true);
    expect(v.pv.head2.length).toBe(10);
    expect(v.pv.head2.filter((h) => h.cls === 'c0').length).toBe(2);
    v.pv.rows.forEach((r) => expect(num(r.cells.at(-1)!.v)).toBe(r.cells.slice(0, -1).reduce((a, c) => a + num(c.v), 0)));
    expect(num(v.pv.foot.at(-1)!.v)).toBe(v.tot.n);
    expect(v.ctl[1].canAdd).toBe(false); // maks. 2 kolom
    expect(v.ctl[1].chips.map((c) => c.v)).toEqual(['Triwulan', 'Level']);
    expect(v.ctl[2].l).toBe('Nilai');
    expect(drillCsv(v, false).split('\r\n')[0]).toBe('﻿Kategori,TW I 2026 · Kritis,TW I 2026 · Tinggi,TW I 2026 · Sedang,TW I 2026 · Rendah,TW I 2026 · Sangat rendah,TW II 2026 · Kritis,TW II 2026 · Tinggi,TW II 2026 · Sedang,TW II 2026 · Rendah,TW II 2026 · Sangat rendah,Total');
  });

  it('batas maksimal dan larangan dimensi ganda', () => {
    expect(layoutOf({ ...INIT, rows: ['kat', 'wil', 'kkks', 'wk'] }, false).rd).toEqual(['kat', 'wil', 'kkks']);
    expect(layoutOf({ ...INIT, cols: ['tw', 'lv', 'st'] }, false).cd).toEqual(['tw', 'lv']);
    expect(layoutOf({ ...INIT, rows: ['kat', 'kat'], cols: ['kat', 'lv'] }, false)).toMatchObject({ rd: ['kat'], cd: ['lv'] });
    expect(layoutOf({ ...INIT, path: [{ d: 'kat', v: 'Kebakaran' }], rows: ['kat'], cols: ['kat'] }, false)).toMatchObject({ rd: ['wil'], cd: [] });
    // Baris baru yang sama dengan Kolom melepas Kolom itu
    expect(setRows({ ...INIT, cols: ['lv'] }, ['kat', 'lv']).cols).toEqual([]);
    const v = go({ ...INIT, rows: ['kat', 'wil'], cols: ['lv'] });
    const all = [...v.ctl[0].addOpts, ...v.ctl[1].addOpts].map((o) => o.l);
    expect(all).not.toContain('Kategori');
    expect(all).not.toContain('Wilayah SKK');
    expect(all).not.toContain('Level');
    expect(v.ctl[1].addH).toBe('Pecah kolom menurut');
    expect(v.ctl[0].chips.every((c) => c.x)).toBe(true);
    expect(v.ctl[0].chips[1].sep).toBe(true);
    // KKKS: Kolom tanpa Wilayah SKK
    expect(layoutOf({ ...INIT, cols: ['wil'] }, true).cd).toEqual([]);
  });

  it('popover sel anak memuat semua filter (semua tingkat baris + semua kolom); Rincikan → satu Baris, Kolom dilepas', () => {
    const st: DrillState = { ...INIT, rows: ['wil', 'kkks'], cols: ['lv'] };
    const v = go(st);
    const ch = v.pv.rows.find((r) => r.rc === 'ch' && r.cells.some((c) => !c.z && c.cv.length))!;
    const c = ch.cells.find((x) => !x.z && x.cv.length)!;
    const s = openPop(st, ch.rv, 'n', false, c.cv);
    const pv = go(s);
    expect(pv.pop!.V).toBe(ch.rv.join(' › ') + ' · ' + c.cv[0]);
    expect(pv.pop!.N).toBe(num(c.v));
    expect(pv.pop!.steps.map((x) => x.d)).toEqual(['wil', 'kkks', 'lv']);
    const l = go(showList(s, false));
    expect(l.lAll.length).toBe(num(c.v));
    expect(l.crumb.map((x) => x.t)).toEqual(['Semua insiden', 'Wilayah SKK: ' + ch.rv[0], 'KKKS: ' + ch.rv[1], 'Level: ' + c.cv[0], `${num(c.v)} insiden`]);
    const d = drillInto(s, 'st', false);
    expect(d.path.map((x) => x.d)).toEqual(['wil', 'kkks', 'lv']);
    expect(d.rows).toEqual(['st']);
    expect(layoutOf(d, false).cd).toEqual([]);
    // TD11: sel pivot Kategori × Bulan
    const p9 = openPop({ ...INIT, cols: ['bln'] }, ['Pencurian/Perampokan'], 'n', false, ['Apr 2026']);
    expect(go(p9).pop!.V).toBe('Pencurian/Perampokan · Apr 2026');
  });

  it('Nilai: Kerugian; Total = KPI Kerugian (TD13/TD15)', () => {
    const { v: dv } = dash('skk');
    const v = go(setMeasure({ ...INIT, rows: ['kat', 'tw'], cols: ['wil'] }, 'rp'));
    expect(v.pv.foot.at(-1)!.v).toBe(dv.kpis[1].val);
    expect(v.ctl[2].chips[0].v).toBe('Kerugian');
    expect(v.cap).toContain('Kategori › Triwulan × Wilayah SKK');
  });

  it('TD16 KKKS: Kategori › Wilayah kerja × Level', () => {
    const k = dash('kkks').inc;
    const v = go({ ...INIT, rows: ['kat', 'wk'], cols: ['lv'] }, true, k);
    expect(v.rowL).toBe('Kategori › Wilayah kerja');
    v.ctl.forEach((g) => g.chips.forEach((c) => c.opts.forEach((o) => expect(['KKKS', 'Wilayah SKK']).not.toContain(o.l))));
    expect(v.pv.foot.at(-1)!.v).toBe(String(k.length));
  });

  it('URL: baris, kolom, nilai, lipat, jejak, tingkat insiden bolak-balik', () => {
    const st: DrillState = { ...INIT, rows: ['kat', 'wil', 'kkks'], cols: ['tw', 'lv'], m: 'rp', cl: { [rowKey(['Kebakaran'])]: true } };
    const p = drillToParams(new URLSearchParams('periode=30h'), st, false);
    expect(p.toString()).toBe('periode=30h&baris=kat%2Cwil%2Ckkks&kolom=tw%2Clv&nilai=rp&lipat=Kebakaran');
    expect(drillFromParams(p, false)).toMatchObject({ rows: ['kat', 'wil', 'kkks'], cols: ['tw', 'lv'], m: 'rp', cl: { Kebakaran: true }, path: [] });
    expect(drillToParams(new URLSearchParams(), INIT, false).toString()).toBe('');
    const s2: DrillState = { ...INIT, path: [{ d: 'kat', v: 'Pencurian/Perampokan' }, { d: 'wil', v: 'Sumbagsel' }], list: { c: 'n' }, pg: 1 };
    const q = drillToParams(new URLSearchParams(), s2, false);
    expect(q.toString()).toBe('tabel=kat%3APencurian%252FPerampokan%7Cwil%3ASumbagsel&lihat=n&hal=2');
    expect(drillFromParams(q, false)).toMatchObject({ path: s2.path, rows: ['kkks'], list: { c: 'n' }, pg: 1 });
    expect(drillFromParams(new URLSearchParams('tabel=wil:Sumbagsel'), true).path).toEqual([]);
    expect(drillFromParams(new URLSearchParams('rincian=kkks'), false)).toMatchObject({ rows: ['kat'], cols: [] }); // param lama diabaikan
    expect(setCols(INIT, ['tw', 'lv', 'st']).cols).toEqual(['tw', 'lv']);
  });
});
