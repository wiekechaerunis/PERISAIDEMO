import { describe, expect, it } from 'vitest';
import { parseQuery } from './parseQuery';

const labels = (t: string, r: 'skk' | 'kkks' = 'skk') => parseQuery(t, r).chips.map((c) => c.label);

describe('parseQuery', () => {
  it('saring: level + wilayah + bulan', () => {
    const p = parseQuery('insiden Kritis di Sumbagsel bulan Juni', 'skk');
    expect(p.intent).toBe('saring');
    expect(p.filters).toMatchObject({ w: 'sbs', lv: [4], months: [5] });
    expect(labels('insiden Kritis di Sumbagsel bulan Juni')).toEqual(['Kritis', 'Sumbagsel', 'Jun 2026']);
    expect(p.unknown).toBe(false);
  });
  it('huruf besar/kecil tidak berpengaruh', () => {
    expect(parseQuery('KRITIS SUMBAGSEL', 'skk').filters).toEqual(parseQuery('kritis sumbagsel', 'skk').filters);
  });
  it('bulan singkat "jun" dan lengkap "juni" sama', () => {
    expect(parseQuery('tinggi jun', 'skk').filters.months).toEqual([5]);
    expect(parseQuery('tinggi juni', 'skk').filters.months).toEqual([5]);
  });
  it('alias wilayah: "sumatera bagian utara" = Sumbagut', () => {
    expect(parseQuery('insiden di sumatera bagian utara', 'skk').filters.w).toBe('sbu');
  });
  it('sinonim kategori: pencurian → Pencurian/Perampokan', () => {
    const p = parseQuery('pencurian di Pusat', 'skk');
    expect(p.filters).toMatchObject({ cat: 0, w: 'pst' });
  });
  it('"Sangat rendah" tidak terbaca sebagai "Rendah"', () => {
    expect(parseQuery('insiden sangat rendah', 'skk').filters.lv).toEqual([0]);
  });
  it('"tertinggi" bukan level Tinggi', () => {
    expect(parseQuery('wilayah dengan insiden tertinggi', 'skk').filters.lv).toBeUndefined();
  });
  it('peringkat: KKKS dengan kerugian terbesar', () => {
    const p = parseQuery('KKKS dengan kerugian terbesar', 'skk');
    expect(p).toMatchObject({ intent: 'peringkat', group: 'kkks', measure: 'kerugian', unknown: false });
  });
  it('peringkat: jenis terbanyak (ukuran bawaan jumlah)', () => {
    expect(parseQuery('jenis insiden terbanyak di Sumbagut', 'skk')).toMatchObject({ intent: 'peringkat', group: 'kategori', measure: 'jumlah' });
  });
  it('banding: pencurian Maret vs Juni', () => {
    const p = parseQuery('pencurian Maret vs Juni', 'skk');
    expect(p).toMatchObject({ intent: 'banding', filters: { cat: 0, months: [2, 5] } });
  });
  it('banding: kata "tren" tanpa bulan', () => {
    expect(parseQuery('tren illegal tapping', 'skk')).toMatchObject({ intent: 'banding', filters: { cat: 2 } });
  });
  it('lokasi: hanya nama area', () => {
    const p = parseQuery('Aceh Timur', 'skk');
    expect(p).toMatchObject({ intent: 'lokasi', filters: { area: 'ace' } });
  });
  it('lokasi lewat nama WK', () => {
    expect(parseQuery('WK Andalas Darat', 'skk')).toMatchObject({ intent: 'lokasi', filters: { area: 'mub' } });
  });
  it('tindakan: lewat tenggat', () => {
    expect(parseQuery('insiden lewat tenggat', 'skk')).toMatchObject({ intent: 'tindakan', action: 'lewat-tenggat' });
    expect(parseQuery('yang terlambat di Sumbagsel', 'skk')).toMatchObject({ intent: 'tindakan', filters: { w: 'sbs' } });
  });
  it('tindakan: belum melapor', () => {
    expect(parseQuery('KKKS belum melapor', 'skk')).toMatchObject({ intent: 'tindakan', action: 'belum-melapor' });
  });
  it('nama KKKS dengan atau tanpa "PT"', () => {
    expect(parseQuery('insiden Deli Raya Hulu', 'skk').filters.kk).toBe('PT Deli Raya Hulu');
    expect(parseQuery('insiden PT Deli Raya Hulu', 'skk').filters.kk).toBe('PT Deli Raya Hulu');
  });
  it('token tidak dikenal: cuaca besok', () => {
    const p = parseQuery('cuaca besok', 'skk');
    expect(p.unknown).toBe(true);
    expect(p.unknownTokens).toEqual(['cuaca', 'besok']);
  });
  it('token tak dikenal di samping bagian yang dikenal tetap dijawab', () => {
    const p = parseQuery('kritis sumbagsel kemarin', 'skk');
    expect(p.unknown).toBe(false);
    expect(p.unknownTokens).toEqual(['kemarin']);
  });
  it('peran KKKS menyebut KKKS lain → di luar cakupan', () => {
    expect(parseQuery('insiden PT Deli Raya Hulu', 'kkks').outOfScope).toBe(true);
  });
  it('peran KKKS menyebut wilayah lain → di luar cakupan; wilayahnya sendiri boleh', () => {
    expect(parseQuery('insiden di Sumbagut', 'kkks').outOfScope).toBe(true);
    expect(parseQuery('insiden di Sumbagsel', 'kkks').outOfScope).toBe(false);
    expect(parseQuery('insiden Kritis di WK Andalas Darat', 'kkks').outOfScope).toBe(false);
  });
});
