// Geografi demo untuk pemilih lokasi (LocationPicker disederhanakan): kotak peta, batas WK, titik yang dikenal, deteksi WK.
// ASSUMPTION: batas WK berupa kotak lintang/bujur contoh, bukan poligon resmi.

export interface Box {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}
export interface Site {
  name: string;
  lat: number;
  lng: number;
}
export interface WkZone {
  wk: string;
  area: string;
  box: Box;
}

/** Kotak peta yang ditampilkan. */
export const MAP_BOX: Box = { latMin: -3.12, latMax: -2.55, lngMin: 103.95, lngMax: 104.45 };

export const WK_ZONES: WkZone[] = [
  { wk: 'WK Andalas Darat', area: 'Kab. Musi Banyuasin', box: { latMin: -3.06, latMax: -2.9, lngMin: 103.98, lngMax: 104.12 } },
  { wk: 'WK Batu Ampar', area: 'Kab. Banyuasin', box: { latMin: -2.84, latMax: -2.66, lngMin: 104.2, lngMax: 104.38 } },
];

/** Titik yang dikenal (fasilitas WK) dan titik contoh di luar WK (board S13). */
export const KNOWN_SITES: Site[] = [
  { name: 'Sumur ADR-07', lat: -2.98512, lng: 104.04213 },
  { name: 'Terminal Arunika', lat: -2.9731, lng: 104.0512 },
  { name: 'Flowline ADR-03', lat: -2.9894, lng: 104.0302 },
  { name: 'Jalan akses SP Batu Ampar', lat: -2.7421, lng: 104.3012 },
];

const inBox = (b: Box, lat: number, lng: number) => lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface Located {
  /** nama WK, atau '' bila di luar cakupan WK organisasi */
  wk: string;
  /** "Kab. …" */
  area: string;
  /** nama titik dikenal terdekat (≤ 1,2 km) atau "Titik di peta" */
  name: string;
  outside: boolean;
}

export function locate(lat: number, lng: number): Located {
  const zone = WK_ZONES.find((z) => inBox(z.box, lat, lng));
  const near = KNOWN_SITES.map((s) => ({ s, d: distanceKm({ lat, lng }, s) })).sort((a, b) => a.d - b.d)[0];
  return {
    wk: zone?.wk ?? '',
    area: zone?.area ?? (lng < 104.2 ? 'Kab. Musi Banyuasin' : 'Kab. Banyuasin'),
    name: near && near.d <= 1.2 ? near.s.name : 'Titik di peta',
    outside: !zone,
  };
}

/** Koordinat ↔ posisi pada kanvas peta (lebar w, tinggi h). */
export const toPoint = (lat: number, lng: number, w: number, h: number) => ({
  x: ((lng - MAP_BOX.lngMin) / (MAP_BOX.lngMax - MAP_BOX.lngMin)) * w,
  y: ((MAP_BOX.latMax - lat) / (MAP_BOX.latMax - MAP_BOX.latMin)) * h,
});
export const toLatLng = (x: number, y: number, w: number, h: number) => ({
  lat: MAP_BOX.latMax - (y / h) * (MAP_BOX.latMax - MAP_BOX.latMin),
  lng: MAP_BOX.lngMin + (x / w) * (MAP_BOX.lngMax - MAP_BOX.lngMin),
});

export const formatCoord = (lat: number, lng: number) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

/** Tempat yang bisa dicari (fasilitas WK + desa/kecamatan sekitar). Data contoh; layanan geokode sungguhan menggantikan ini. */
export interface Place extends Site {
  area: string;
  kind: string;
}
export const PLACES: Place[] = [
  ...KNOWN_SITES.map((s) => ({ ...s, area: locate(s.lat, s.lng).area, kind: 'Fasilitas WK' })),
  { name: 'Desa Sungai Lilin', lat: -2.61204, lng: 104.11873, area: 'Kab. Musi Banyuasin', kind: 'Desa' },
  { name: 'Kecamatan Babat Toman', lat: -2.9, lng: 103.99, area: 'Kab. Musi Banyuasin', kind: 'Kecamatan' },
  { name: 'Desa Betung', lat: -2.7, lng: 104.25, area: 'Kab. Banyuasin', kind: 'Desa' },
  { name: 'Jembatan kayu jalur kabel ADR-07', lat: -2.9875, lng: 104.0388, area: 'Kab. Musi Banyuasin', kind: 'Patokan' },
  { name: 'Pos Polsek Sungai Lilin', lat: -2.6155, lng: 104.1215, area: 'Kab. Musi Banyuasin', kind: 'Pos aparat' },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Cari nama tempat/kabupaten/WK (tanpa peduli huruf besar dan tanda baca); cocok di awal kata diurutkan lebih dulu. */
export function searchPlaces(q: string, limit = 8): Place[] {
  const n = norm(q);
  if (!n) return [];
  const score = (p: Place) => {
    const name = norm(p.name);
    if (name.startsWith(n)) return 0;
    if (name.split(' ').some((w) => w.startsWith(n))) return 1;
    if (name.includes(n)) return 2;
    if (norm(`${p.area} ${p.kind} ${locate(p.lat, p.lng).wk}`).includes(n)) return 3;
    return 9;
  };
  return PLACES.map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s < 9)
    // skor sama: nama lebih pendek (lebih spesifik) dulu
    .sort((a, b) => a.s - b.s || a.p.name.length - b.p.name.length || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}

/** "-2.98512, 104.04213" (atau dengan spasi/titik koma) → koordinat, atau null bila tidak valid / di luar peta. */
export function parseCoord(q: string): { lat: number; lng: number } | null {
  const m = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(q);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return inBox(MAP_BOX, lat, lng) ? { lat, lng } : null;
}
