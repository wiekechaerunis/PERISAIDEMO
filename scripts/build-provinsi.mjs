// Membuat src/data/provinsi.ts dari public/peta/id-prov.svg: 38 path provinsi (urutan kode Kemendagri),
// nama, wilayah SKK Migas, dan area insiden demo yang titiknya jatuh di provinsi itu.
// Jalankan: node scripts/build-provinsi.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const svg = fs.readFileSync(path.join(ROOT, 'public/peta/id-prov.svg'), 'utf8');
const D = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);

// [nama, wilayah SKK]. ASUMSI: Sumatera Barat dan Kepulauan Riau masuk Sumbagut (konfirmasi PM).
const PROV = [
  ['Aceh', 'sbu'], ['Sumatera Utara', 'sbu'], ['Sumatera Barat', 'sbu'], ['Riau', 'sbu'], ['Jambi', 'sbs'],
  ['Sumatera Selatan', 'sbs'], ['Bengkulu', 'sbs'], ['Lampung', 'sbs'], ['Kepulauan Bangka Belitung', 'sbs'], ['Kepulauan Riau', 'sbu'],
  ['DKI Jakarta', 'pst'], ['Jawa Barat', 'pst'], ['Jawa Tengah', 'jbn'], ['DI Yogyakarta', 'jbn'], ['Jawa Timur', 'jbn'],
  ['Banten', 'pst'], ['Bali', 'jbn'], ['Nusa Tenggara Barat', 'jbn'], ['Nusa Tenggara Timur', 'jbn'], ['Kalimantan Barat', 'kls'],
  ['Kalimantan Tengah', 'kls'], ['Kalimantan Selatan', 'kls'], ['Kalimantan Timur', 'kls'], ['Kalimantan Utara', 'kls'], ['Sulawesi Utara', 'kls'],
  ['Sulawesi Tengah', 'kls'], ['Sulawesi Selatan', 'kls'], ['Sulawesi Tenggara', 'kls'], ['Gorontalo', 'kls'], ['Sulawesi Barat', 'kls'],
  ['Maluku', 'pml'], ['Maluku Utara', 'pml'], ['Papua', 'pml'], ['Papua Barat', 'pml'], ['Papua Selatan', 'pml'],
  ['Papua Tengah', 'pml'], ['Papua Pegunungan', 'pml'], ['Papua Barat Daya', 'pml'],
];
if (D.length !== PROV.length) throw new Error(`jumlah path ${D.length}, provinsi ${PROV.length}`);

// titik area insiden dari data dashboard
const data = fs.readFileSync(path.join(ROOT, 'src/data/dashboard.ts'), 'utf8');
const A0 = [...data.matchAll(/\['(\w+)', '(\w+)', '[^']*', ([\d.]+), ([\d.]+),/g)].map((m) => ({ id: m[1], w: m[2], x: +m[3], y: +m[4] }));

const rings = (d) => d.split('Z').map((r) => [...r.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [+m[1], +m[2]])).filter((r) => r.length > 2);
const inside = (x, y, ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const R = D.map(rings);
const dist = (x, y, i) => Math.min(...R[i].flat().map(([px, py]) => Math.hypot(px - x, py - y)));
const areaProv = {};
for (const a of A0) {
  let i = R.findIndex((rs) => rs.some((r) => inside(a.x, a.y, r)));
  if (i < 0) i = PROV.reduce((b, _, k) => (dist(a.x, a.y, k) < dist(a.x, a.y, b) ? k : b), 0); // titik di laut/pesisir: provinsi terdekat
  areaProv[a.id] = i;
}

const out = `// DIHASILKAN oleh scripts/build-provinsi.mjs dari public/peta/id-prov.svg. Jangan diedit tangan.
/** Provinsi di peta nasional: nama, wilayah SKK Migas, path SVG (koordinat peta 1000x400). */
export const PROVINSI: { n: string; w: string; d: string }[] = ${JSON.stringify(PROV.map(([n, w], i) => ({ n, w, d: D[i] })))};

/** Area insiden demo -> indeks provinsi. */
export const AREA_PROV: Record<string, number> = ${JSON.stringify(areaProv)};
`;
fs.writeFileSync(path.join(ROOT, 'src/data/provinsi.ts'), out);
console.log(Object.entries(areaProv).map(([k, v]) => `${k}:${PROV[v][0]}`).join(', '));
