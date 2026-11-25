/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { DashboardLogic } from '@/generated/DashboardLogic';
import { parseQuery } from './parseQuery';
import { answer, matchInc } from './answer';

/** Jalankan logika dashboard dengan filter terpasang manual, ambil jumlah dari kartu Status penanganan. */
const dash = (peran: 'skk' | 'kkks', patch: Record<string, unknown>) => {
  const d: any = new DashboardLogic({ peran });
  d.state = { ...d.state, ...patch };
  const v = d.renderVals();
  return { statusSum: v.st.reduce((s: number, x: any) => s + Number(x.v), 0), kpi: Number(v.kpis[0].val) };
};

describe('answer', () => {
  it('"Kritis Sumbagsel" = jumlah di dashboard setelah filter yang sama dipasang manual', () => {
    const a = answer(parseQuery('insiden Kritis di Sumbagsel', 'skk'), 'skk');
    const d = dash('skk', { z: 'sbs', lv: [0, 0, 0, 0, 1] });
    expect(a.kind).toBe('ok');
    expect(a.kalimat.startsWith(`${d.statusSum} insiden Kritis di Sumbagsel`)).toBe(true);
    expect(d.kpi).toBe(d.statusSum); // kartu "Insiden terverifikasi" menunjukkan angka yang sama
  });

  it('"Kritis Sumbagsel Juni" = subset bulan Juni dari jumlah dashboard yang sama', () => {
    const p = parseQuery('insiden Kritis di Sumbagsel bulan Juni', 'skk');
    const n = matchInc(p.filters, 'skk').length;
    const d = dash('skk', { z: 'sbs', lv: [0, 0, 0, 0, 1] });
    const perMonth = [0, 1, 2, 3, 4, 5].map((m) => matchInc({ ...p.filters, months: [m] }, 'skk').length);
    expect(perMonth.reduce((s, x) => s + x, 0)).toBe(d.statusSum);
    expect(answer(p, 'skk').kalimat).toBe(`${n} insiden Kritis di Sumbagsel, Jun 2026.`);
  });

  it('tanpa filter = total nasional dashboard', () => {
    expect(matchInc({}, 'skk').length).toBe(dash('skk', {}).statusSum);
  });

  it('kategori + KKKS sama dengan dashboard', () => {
    const p = parseQuery('pencurian PT Samudra Energi Nusantara', 'skk');
    const d = dash('skk', { kat: 0, kk: 'PT Samudra Energi Nusantara' });
    expect(matchInc(p.filters, 'skk').length).toBe(d.statusSum);
  });

  it('peran KKKS dibatasi ke organisasinya sendiri', () => {
    expect(matchInc({}, 'kkks').length).toBe(dash('kkks', {}).statusSum);
    expect(answer(parseQuery('insiden PT Deli Raya Hulu', 'kkks'), 'kkks').kind).toBe('scope');
  });

  it('filter aktif ikut dihitung dan disebut', () => {
    const a = answer(parseQuery('insiden Kritis', 'skk'), 'skk', { w: 'sbs' });
    expect(a.kalimat).toContain('di Sumbagsel');
    expect(a.kalimat).toContain('(dengan filter aktif)');
  });

  it('hasil 0 menyebut chip dan chip terakhir bisa dihapus', () => {
    const a = answer(parseQuery('kebakaran di Jabanusa', 'skk'), 'skk');
    expect(a.kind).toBe('zero');
    expect(a.kalimat).toBe('Tidak ada insiden yang cocok dengan Kebakaran · Jabanusa.');
    expect(a.lastChip?.label).toBe('Jabanusa');
  });

  it('tidak dikenali: 2 saran', () => {
    const a = answer(parseQuery('cuaca besok', 'skk'), 'skk');
    expect(a.kind).toBe('unknown');
    expect(a.suggestions).toHaveLength(2);
  });

  it('peringkat KKKS menurut kerugian: tiga teratas, urut menurun', () => {
    const a = answer(parseQuery('KKKS dengan kerugian terbesar', 'skk'), 'skk');
    expect(a.items).toHaveLength(3);
    expect(a.items![0].label).toBe('Samudra Energi Nusantara');
  });

  it('lokasi memberi zoom ke area', () => {
    expect(answer(parseQuery('Aceh Timur', 'skk'), 'skk').zoom).toEqual({ w: 'sbu', area: 'ace' });
  });
});
