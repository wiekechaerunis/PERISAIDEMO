/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { DashboardLogic } from '@/generated/DashboardLogic';
import { INC } from '@/data/dashboard';
import { DASH_CASUALTIES } from '@/data/dashboardIncidentMeta';
import { casualtiesOfDashboard, casualtiesOfIncident, countCasualties } from './casualties';
import {
  closePop, crumbTo, drillCsv, drillFromParams, drillInto, drillToParams, drillView, INIT, listHref, openPop,
  pickGroup, reset, showList, sortBy, toDrillInc, type DrillState,
} from './tabelDrill';

const PERIODE = { from: '2026-03-01', to: '2026-04-30', full: false, label: 'Mar–Apr 2026', cap: 'Mar–Apr 2026', text: 'Maret–April 2026' };
const dash = (peran: 'skk' | 'kkks', patch: Record<string, any> = {}) => {
  const { periode, ...st } = patch;
  const d: any = new DashboardLogic({ peran, ...(periode ? { periode } : {}) });
  d.state = { ...d.state, ...st };
  const v = d.renderVals();
  return { v, inc: (v.tdInc as any[]).map(toDrillInc) };
};

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
  ['KKKS level Kritis', 'kkks', { lv: [0, 0, 0, 0, 1] }],
];

describe('Tabel insiden: baris Total = kartu angka', () => {
  it.each(CASES)('%s', (_, peran, patch) => {
    const { v, inc } = dash(peran, patch);
    const view = drillView(inc, INIT, peran === 'kkks');
    expect(view.foot[0]).toBe(v.kpis[0].val); // Insiden terverifikasi
    expect(view.foot[2]).toBe(v.kpis[1].val); // Kerugian
    // Tinggi & Kritis: dengan filter Kategori, kartu angka memakai sebaran level perkiraan (alokasi matriks desain),
    // tabel menghitung insiden sebenarnya. Lihat DEVIATIONS D-TD1.
    if (patch.kat == null) expect(view.foot[3]).toBe(v.kpis[2].val);
  });
});

describe('Tabel insiden: drill', () => {
  const { inc } = dash('skk');
  const go = (s: DrillState) => drillView(inc, s, false);

  it('ringkasan (TD1): per Kategori, 7 kolom ukuran, 0 = "–"', () => {
    const v = go(INIT);
    expect(v.hDim.l).toBe('Kategori');
    expect(v.heads.map((h) => h.l)).toEqual(['Insiden (jumlah)', 'Insiden (%)', 'Kerugian', 'Tinggi & Kritis', 'Meninggal', 'Luka', 'Masih terbuka']);
    expect(v.rows[0].v).toBe('Pencurian/Perampokan');
    expect(v.rows.every((r) => r.cells.every((c) => !c.z || c.v === '0' || c.v === 'Rp0' || c.v === '0%'))).toBe(true);
    expect(v.cap).toBe(`${v.tot.n} insiden terverifikasi · seluruh KKKS · klik angka untuk merinci`);
    expect(v.drilled).toBe(false);
  });

  it('popover aksi (TD2) dan Rincikan (TD3): dimensi yang dipakai tidak ditawarkan; popover kiri/kanan', () => {
    let s = openPop(INIT, 'Pencurian/Perampokan', 'n', false);
    const v = go(s);
    expect(v.pop!.T).toBe('Pencurian/Perampokan');
    expect(v.pop!.subOpts.map((o) => o.l)).toEqual(['Wilayah SKK', 'KKKS', 'Wilayah kerja', 'Level', 'Bulan', 'Status penanganan']);
    expect(v.rows[0].cells.map((c) => c.side)).toEqual(['l', 'l', 'l', 'l', 'r', 'r', 'r']);
    s = drillInto(s, 'wil');
    const v4 = go(s);
    expect(v4.crumb.map((c) => c.t)).toEqual(['Semua insiden', 'Kategori: Pencurian/Perampokan']);
    expect(v4.hDim.l).toBe('Wilayah SKK');
    expect(v4.gOpts.map((o) => o.l)).not.toContain('Kategori');
    expect(v4.rows.map((r) => r.v)).toEqual(['Pusat', 'Sumbagut', 'Sumbagsel', 'Kalsul', 'Jabanusa'].filter((w) => v4.rows.some((r) => r.v === w)));
  });

  it('tingkat insiden (TD5): 10 per halaman, urut level tertinggi lalu terbaru', () => {
    let s = drillInto(openPop(INIT, 'Pencurian/Perampokan', 'n', false), 'wil');
    s = showList(openPop(s, 'Sumbagsel', 'n', false));
    const v = go(s);
    expect(v.showList).toBe(true);
    expect(v.crumb.map((c) => c.t)).toEqual(['Semua insiden', 'Kategori: Pencurian/Perampokan', 'Wilayah SKK: Sumbagsel', `${v.lAll.length} insiden`]);
    expect(v.lRows.length).toBe(Math.min(10, v.lAll.length));
    for (let i = 1; i < v.lAll.length; i++) expect(v.lAll[i - 1].lv).toBeGreaterThanOrEqual(v.lAll[i].lv);
    expect(v.cap).toBe('Klik baris untuk membuka detail insiden');
    expect(v.lS).toBe('Pencurian/Perampokan · Sumbagsel · urut level tertinggi lalu terbaru');
  });

  it('korban (TD6): Total Meninggal → insiden dengan korban meninggal', () => {
    const v0 = go(INIT);
    const md = Number(v0.foot[4]);
    expect(md).toBeGreaterThanOrEqual(2);
    const v = go({ ...INIT, list: { c: 'md' } });
    expect(v.lAll.every((i) => i.md > 0)).toBe(true);
    expect(v.crumb.at(-1)!.t).toBe(`${v.lAll.length} insiden · ada korban meninggal`);
    expect(v.lRows[0].kc).toBe('kb');
    // syarat kolom lain
    expect(go({ ...INIT, list: { c: 'tk' } }).lAll.every((i) => i.lv >= 3)).toBe(true);
    expect(go({ ...INIT, list: { c: 'op' } }).lAll.every((i) => i.st !== 2)).toBe(true);
    expect(go({ ...INIT, list: { c: 'lk' } }).lAll.every((i) => i.lk > 0)).toBe(true);
    expect(v0.foot2).toBe(`Insiden (%) = porsi dari ${v0.tot.n} insiden di tampilan ini. Meninggal/Luka = jumlah orang · 1 insiden korban belum diketahui`);
    // bar tipis ada di kolom Insiden (%), panjangnya = porsi baris
    const pc = v0.rows[0].cells.find((c) => c.k === 'pct')!;
    expect(pc.bar).toBe(true);
    expect(pc.w).toBe(pc.v);
    expect(v0.rows[0].cells.find((c) => c.k === 'n')!.bar).toBe(false);
    expect(v0.foot[1]).toBe('100%');
  });

  it('breadcrumb kembali, Reset, sortir, urutan alami', () => {
    const s = drillInto(openPop(drillInto(openPop(INIT, 'Pencurian/Perampokan', 'n', true), 'wil'), 'Sumbagsel', 'n', true), 'lv');
    expect(go(s).rows.map((r) => r.v)).toEqual(['Kritis', 'Tinggi', 'Sedang', 'Rendah', 'Sangat rendah'].filter((l) => go(s).rows.some((r) => r.v === l)));
    const back = crumbTo(s, 0);
    expect(back.path).toHaveLength(1);
    expect(back.g).toBe('wil');
    expect(reset(s)).toMatchObject({ path: [], g: 'kat', list: null });
    const sorted = go(sortBy(INIT, 'rp')).rows.map((r) => r.v);
    expect(go(sortBy(sortBy(INIT, 'rp'), 'rp')).rows.map((r) => r.v)).toEqual([...sorted].reverse().sort((a, b) => sorted.indexOf(b) - sorted.indexOf(a)));
    expect(go(pickGroup(INIT, 'bln')).rows.map((r) => r.v)[0]).toBe('Jan 2026');
    expect(closePop(openPop(INIT, 'x', 'n', true))).toMatchObject({ pop: null, sub: false });
  });

  it('KKKS (TD7, TD8): tanpa KKKS dan Wilayah SKK; daftar per WK', () => {
    const k = dash('kkks').inc;
    const v = drillView(k, INIT, true);
    expect(v.gOpts.map((o) => o.l)).toEqual(['Kategori', 'Wilayah kerja', 'Level', 'Bulan', 'Status penanganan']);
    expect(v.cap).toContain('wilayah kerja Anda');
    const s = showList(openPop(drillInto(openPop(INIT, 'Pencurian/Perampokan', 'n', true), 'wk'), 'WK Andalas Darat', 'n', false));
    const l = drillView(k, s, true);
    expect(l.lColL).toBe('Wilayah kerja');
    expect(l.lRows.every((r) => r.c1 === 'WK Andalas Darat')).toBe(true);
  });

  it('URL: jejak, kelompok, tingkat insiden, halaman bolak-balik', () => {
    const s: DrillState = { ...INIT, path: [{ d: 'kat', v: 'Pencurian/Perampokan' }, { d: 'wil', v: 'Sumbagsel' }], list: { c: 'n' }, pg: 1 };
    const p = drillToParams(new URLSearchParams('periode=30h'), s, false);
    expect(p.toString()).toBe('periode=30h&tabel=kat%3APencurian%252FPerampokan%7Cwil%3ASumbagsel&lihat=n&hal=2');
    expect(drillFromParams(p, false)).toEqual({ path: s.path, g: 'kkks', list: { c: 'n' }, pg: 1 });
    const q = drillToParams(new URLSearchParams(), { ...INIT, path: [{ d: 'kat', v: 'Kebakaran' }], g: 'lv' }, false);
    expect(drillFromParams(q, false)).toMatchObject({ path: [{ d: 'kat', v: 'Kebakaran' }], g: 'lv', list: null });
    // dimensi SKK tidak berlaku untuk KKKS
    expect(drillFromParams(new URLSearchParams('tabel=wil:Sumbagsel'), true).path).toEqual([]);
  });

  it('CSV dan tautan daftar insiden', () => {
    const csv = drillCsv(go(INIT), false);
    expect(csv.split('\r\n')[0]).toBe('﻿Kategori,Insiden (jumlah),Insiden (%),Kerugian,Tinggi & Kritis,Meninggal,Luka,Masih terbuka');
    expect(csv).toContain('\r\nTotal,');
    expect(listHref([{ d: 'kat', v: 'Pencurian/Perampokan' }, { d: 'wil', v: 'Sumbagsel' }], 'md')).toBe('/insiden?kategori=Pencurian%2FPerampokan&wilayah=Sumbagsel&korban=meninggal');
  });
});
