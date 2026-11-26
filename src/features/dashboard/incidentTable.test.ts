/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { DashboardLogic } from '@/generated/DashboardLogic';

/** Jalankan logika dashboard dengan state terpasang, kembalikan hasil renderVals(). */
const PERIODE = { from: '2026-03-01', to: '2026-04-30', full: false, label: 'Mar–Apr 2026', cap: 'Mar–Apr 2026', text: 'Maret–April 2026' };
const run = (peran: 'skk' | 'kkks', patch: Record<string, any> = {}, tb: Record<string, any> = {}) => {
  const { periode, ...st } = patch;
  patch = st;
  const d: any = new DashboardLogic({ peran, ...(periode ? { periode } : {}) });
  d.state = { ...d.state, ...patch, tb: { ...d.state.tb, ...tb } };
  return { d, v: d.renderVals() };
};
const kpi = (v: any, i: number) => v.kpis[i].val as string;

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

describe('Tabel insiden', () => {
  it('bawaan: SKK Kategori × Wilayah, KKKS Kategori × Level', () => {
    expect(run('skk').v.tbRowHead).toBe('Kategori');
    expect(run('skk').v.dCol.l).toBe('Wilayah');
    expect(run('kkks').v.dCol.l).toBe('Level');
    expect(run('kkks').v.dR1.opts.map((o: any) => o.l)).toEqual(['Wilayah kerja', 'Kategori', 'Level']);
  });

  it.each(CASES)('%s: total Jumlah = KPI Insiden terverifikasi, total Kerugian = KPI Kerugian', (_, peran, patch) => {
    expect(run(peran, patch).v.tbTot).toBe(kpi(run(peran, patch).v, 0));
    expect(run(peran, patch, { m: 'rp' }).v.tbTot).toBe(kpi(run(peran, patch).v, 1));
  });

  it('jumlah per sel = total baris, dan baris Total = jumlah per kolom', () => {
    const { v } = run('skk');
    const rows = v.tbLines.filter((l: any) => l.agg);
    const num = (s: string) => (s === '–' ? 0 : Number(s));
    rows.forEach((r: any) => expect(r.cells.reduce((s: number, c: any) => s + num(c.v), 0)).toBe(num(r.tot)));
    v.tbFoot.forEach((f: string, j: number) => expect(rows.reduce((s: number, r: any) => s + num(r.cells[j].v), 0)).toBe(num(f)));
  });

  it('satu dimensi tidak dipakai dua kali, dan Level urut Sangat rendah→Kritis', () => {
    const { v } = run('skk', {}, { col: 'lv', r2: 'kkks' });
    expect(v.dR2.opts.map((o: any) => o.l)).toEqual(['Tanpa rincian', 'Wilayah', 'KKKS', 'Wilayah kerja']);
    expect(v.dCol.opts.map((o: any) => o.l)).toEqual(['Tanpa kolom', 'Wilayah', 'Wilayah kerja', 'Level']);
    expect(v.dR1.opts.map((o: any) => o.l)).toEqual(['Wilayah', 'KKKS', 'Wilayah kerja', 'Kategori', 'Level']);
    expect(v.tbCols.map((c: any) => c.l)).toEqual(['Sangat rendah', 'Rendah', 'Sedang', 'Tinggi', 'Kritis']);
  });

  it('klik angka membuka baris dan menyaring insiden ke kolom itu; klik lagi melepas', () => {
    const { d, v } = run('skk');
    const row = v.tbLines.find((l: any) => l.agg);
    const j = row.cells.findIndex((c: any) => c.v !== '–');
    row.cells[j].go();
    let v2 = d.renderVals();
    const more = v2.tbLines.find((l: any) => l.more);
    expect(more.mT).toContain(`${row.cells[j].v} insiden · Wilayah ${v.tbCols[j].l}`);
    expect(v2.tbLines.find((l: any) => l.agg && l.n === row.n).cells[j].cls).toBe('sel');
    expect(v2.tbLines.filter((l: any) => l.leaf).length).toBe(Math.min(5, Number(row.cells[j].v)));
    v2.tbLines.find((l: any) => l.agg && l.n === row.n).cells[j].go();
    v2 = d.renderVals();
    expect(v2.tbLines.find((l: any) => l.more).mT).not.toContain('· Wilayah');
  });

  it('ganti dimensi menutup semua rincian', () => {
    const { d, v } = run('skk');
    v.tbLines.find((l: any) => l.agg).tog();
    expect(d.renderVals().tbAnyOpen).toBe(true);
    d.renderVals().dR2.opts.find((o: any) => o.l === 'KKKS').pick();
    const v3 = d.renderVals();
    expect(v3.tbAnyOpen).toBe(false);
    expect(v3.tbRowHead).toBe('Kategori › KKKS');
  });
});
