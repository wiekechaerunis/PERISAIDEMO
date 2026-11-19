import { describe, expect, it } from 'vitest';
import { KNOWN_SITES, locate, toLatLng, toPoint, distanceKm } from './geo';

describe('geo (pemilih lokasi)', () => {
  it('titik sumur ADR-07 berada di WK Andalas Darat dan dikenali', () => {
    const l = locate(-2.98512, 104.04213);
    expect(l).toMatchObject({ wk: 'WK Andalas Darat', area: 'Kab. Musi Banyuasin', name: 'Sumur ADR-07', outside: false });
  });
  it('jalan akses SP Batu Ampar berada di WK Batu Ampar', () => {
    expect(locate(-2.7421, 104.3012)).toMatchObject({ wk: 'WK Batu Ampar', area: 'Kab. Banyuasin', outside: false });
  });
  it('titik di luar semua WK (board S13) ditandai di luar cakupan', () => {
    const l = locate(-2.61204, 104.11873);
    expect(l.outside).toBe(true);
    expect(l.wk).toBe('');
    expect(l.area).toBe('Kab. Musi Banyuasin');
    expect(l.name).toBe('Titik di peta');
  });
  it('titik di dalam WK tetapi jauh dari fasilitas diberi nama umum', () => {
    expect(locate(-3.04, 104.1).name).toBe('Titik di peta');
  });
  it('konversi koordinat dan posisi peta bolak-balik', () => {
    const p = toPoint(-2.98512, 104.04213, 600, 380);
    const back = toLatLng(p.x, p.y, 600, 380);
    expect(back.lat).toBeCloseTo(-2.98512, 5);
    expect(back.lng).toBeCloseTo(104.04213, 5);
  });
  it('jarak Sumur ADR-07 ke Terminal Arunika sekitar 1,7 km', () => {
    const d = distanceKm(KNOWN_SITES[0], KNOWN_SITES[1]);
    expect(d).toBeGreaterThan(1.4);
    expect(d).toBeLessThan(2);
  });
});

import { parseCoord, searchPlaces } from './geo';

describe('pencarian lokasi', () => {
  it('mencari nama tempat tanpa peduli huruf besar dan tanda baca', () => {
    expect(searchPlaces('adr 07')[0].name).toBe('Sumur ADR-07');
    expect(searchPlaces('LILIN').map((p) => p.name)).toEqual(expect.arrayContaining(['Desa Sungai Lilin', 'Pos Polsek Sungai Lilin']));
  });
  it('awal nama diurutkan lebih dulu dan hasil dibatasi', () => {
    expect(searchPlaces('desa')[0].name.toLowerCase().startsWith('desa')).toBe(true);
    expect(searchPlaces('a', 3).length).toBeLessThanOrEqual(3);
  });
  it('mencari lewat nama WK atau kabupaten', () => {
    expect(searchPlaces('Batu Ampar').some((p) => p.name === 'Jalan akses SP Batu Ampar')).toBe(true);
    expect(searchPlaces('banyuasin').length).toBeGreaterThan(0);
  });
  it('pencarian kosong atau tak ada padanan menghasilkan daftar kosong', () => {
    expect(searchPlaces('')).toEqual([]);
    expect(searchPlaces('zzzz')).toEqual([]);
  });
  it('mengenali koordinat yang diketik', () => {
    expect(parseCoord('-2.98512, 104.04213')).toEqual({ lat: -2.98512, lng: 104.04213 });
    expect(parseCoord('-2.7;104.3')).toEqual({ lat: -2.7, lng: 104.3 });
    expect(parseCoord('10, 20')).toBeNull(); // di luar peta
    expect(parseCoord('sumur')).toBeNull();
  });
});
