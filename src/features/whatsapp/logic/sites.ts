// ASSUMPTION: daftar lokasi contoh untuk pemilih lokasi sederhana (board memakai peta); sama dengan ReportStep1Page. WK dari lokasi.
export interface Site {
  name: string;
  lat: number;
  lng: number;
  area: string;
  wk: string;
}

export const SITES: Site[] = [
  { name: 'Sumur ADR-07', lat: -2.98512, lng: 104.04213, area: 'Kab. Musi Banyuasin', wk: 'WK Andalas Darat' },
  { name: 'Terminal Arunika', lat: -2.9731, lng: 104.0512, area: 'Kab. Musi Banyuasin', wk: 'WK Andalas Darat' },
  { name: 'Flowline ADR-03', lat: -2.9894, lng: 104.0302, area: 'Kab. Musi Banyuasin', wk: 'WK Andalas Darat' },
  { name: 'Jalan akses SP Batu Ampar', lat: -2.7421, lng: 104.3012, area: 'Kab. Banyuasin', wk: 'WK Batu Ampar' },
];
