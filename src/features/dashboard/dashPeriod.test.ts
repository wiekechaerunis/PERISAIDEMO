import { describe, expect, it } from 'vitest';
import { DashboardLogic } from '@/generated/DashboardLogic';
import { INC } from '@/data/dashboard';
import { matchInc } from '@/ask/answer';
import type { Period } from '@/features/insiden/logic/period';
import { dashPeriodInfo } from './dashPeriod';

type Row = [string, string, number, number, number, number, string, string, number, number];
const ROWS = INC as unknown as Row[];
const MOI: Record<string, string> = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', Mei: '05', Jun: '06' };
const dateOf = (t: string) => { const [d, m] = t.split(' '); return `2026-${MOI[m]}-${d.padStart(2, '0')}`; };
const countIn = (from: string, to: string) => ROWS.filter((r) => dateOf(r[6]) >= from && dateOf(r[6]) <= to).length;

const P = (preset: string): Period => ({ kind: 'preset', preset } as Period);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const view = (periode?: ReturnType<typeof dashPeriodInfo>, peran: 'skk' | 'kkks' = 'skk'): any => new DashboardLogic({ peran, periode }).renderVals();
const kpi = (v: { kpis: { val: string }[] }, i: number) => v.kpis[i].val;

describe('dashPeriodInfo (hari ini dashboard = 30 Jun 2026)', () => {
  it('rentang preset dan label', () => {
    expect(dashPeriodInfo(P('all'))).toMatchObject({ from: '2026-01-01', to: '2026-06-30', full: true, label: 'Semua waktu', text: 'Semester I 2026' });
    expect(dashPeriodInfo(P('7h'))).toMatchObject({ from: '2026-06-23', to: '2026-06-30', full: false, cap: '23–30 Jun 2026' });
    expect(dashPeriodInfo(P('30h'))).toMatchObject({ from: '2026-05-31', to: '2026-06-30', full: false, text: '30 hari terakhir (31 Mei – 30 Jun 2026)' });
    expect(dashPeriodInfo(P('bulan'))).toMatchObject({ from: '2026-06-01', to: '2026-06-30', full: false });
    expect(dashPeriodInfo(P('3b'))).toMatchObject({ from: '2026-03-30', to: '2026-06-30', full: false });
    expect(dashPeriodInfo(P('tahun'))).toMatchObject({ from: '2026-01-01', to: '2026-06-30', full: true, label: 'Tahun berjalan' });
    expect(dashPeriodInfo({ kind: 'custom', from: '2026-05-01', to: '2026-05-15' })).toMatchObject({ full: false, label: '1–15 Mei 2026', text: '1–15 Mei 2026' });
  });
});

describe('logika dashboard per periode', () => {
  it('Semua waktu = angka semester apa adanya (sama persis dengan tanpa periode), SKK dan KKKS', () => {
    for (const peran of ['skk', 'kkks'] as const) {
      expect(JSON.stringify(view(dashPeriodInfo(P('all')), peran))).toBe(JSON.stringify(view(undefined, peran)));
      expect(JSON.stringify(view(dashPeriodInfo(P('tahun')), peran)).replace(/Tahun berjalan \(1 Jan – 30 Jun 2026\)/g, 'Semester I 2026')).toBe(
        JSON.stringify(view(undefined, peran)),
      );
    }
    // 106 insiden desain + 41 insiden sebaran tambahan (src/data/dashboardExtra.ts)
    expect(kpi(view(), 0)).toBe('147');
  });

  it('jumlah insiden per preset dihitung tepat dari tanggal lapor', () => {
    for (const k of ['7h', '30h', 'bulan', '3b']) {
      const info = dashPeriodInfo(P(k));
      const v = view(info);
      expect(kpi(v, 0)).toBe(String(countIn(info.from, info.to)));
      expect(v.subtitle.startsWith(info.text)).toBe(true);
    }
    const n = [view(dashPeriodInfo(P('7h'))), view(dashPeriodInfo(P('30h'))), view(dashPeriodInfo(P('3b'))), view()].map((v) => Number(kpi(v, 0)));
    expect(n[0]).toBeLessThan(n[1]);
    expect(n[1]).toBeLessThan(n[2]);
    expect(n[2]).toBeLessThan(n[3]);
  });

  it('tren hanya menampilkan bulan yang tercakup, totalnya = jumlah insiden', () => {
    const v3 = view(dashPeriodInfo(P('3b')));
    expect(v3.trend.map((b: { m: string }) => b.m)).toEqual(['Mar', 'Apr', 'Mei', 'Jun']);
    expect(v3.trend.reduce((s: number, b: { lbl: string }) => s + Number(b.lbl), 0)).toBe(Number(kpi(v3, 0)));
    const v7 = view(dashPeriodInfo(P('7h')));
    expect(v7.trend.map((b: { m: string }) => b.m)).toEqual(['Jun']);
    expect(v7.ikBars.map((b: { m: string }) => b.m)).toEqual(['Jun']);
  });

  it('rentang khusus, KKKS, dan keterangan perkiraan', () => {
    const cu = dashPeriodInfo({ kind: 'custom', from: '2026-05-01', to: '2026-05-15' });
    const v = view(cu);
    expect(kpi(v, 0)).toBe(String(countIn('2026-05-01', '2026-05-15')));
    expect(v.kpis[0].cmp).toMatch(/^vs periode sebelumnya, perkiraan/);
    expect(v.foot).toMatch(/diskalakan \(perkiraan\)/);
    expect(v.askCtx.per).toEqual({ from: '2026-05-01', to: '2026-05-15', label: '1–15 Mei 2026' });
    const k = view(dashPeriodInfo(P('3b')), 'kkks');
    const own = ROWS.filter((r) => ['mub', 'bny'].includes(r[1]) && dateOf(r[6]) >= '2026-03-30').length;
    expect(kpi(k, 0)).toBe(String(own));
    expect(view(undefined).foot).not.toMatch(/perkiraan/);
  });

  it('Tanya data memakai periode yang sama', () => {
    const range = { from: '2026-06-01', to: '2026-06-30', label: 'Bulan ini' };
    expect(matchInc({ range }, 'skk')).toHaveLength(countIn('2026-06-01', '2026-06-30'));
    expect(matchInc({}, 'skk')).toHaveLength(147);
  });
});
