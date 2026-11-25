// Membuat peta per area untuk area tambahan Dashboard (src/data/dashboardExtra.ts): cakupan WK (wk-), garis batas WK (wkl-),
// fasilitas dan jalur pipa (wka-), dan peta detail (l-, potongan id-land.svg). Koordinat sama dengan peta nasional 1000x400.
// Jalankan: node scripts/dashboard-extra-svg.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const src = fs.readFileSync(path.join(ROOT, 'src/data/dashboardExtra.ts'), 'utf8');
const block = src.slice(src.indexOf('export const EXTRA_AREAS'), src.indexOf('];', src.indexOf('export const EXTRA_AREAS')) + 2);
// eslint-disable-next-line no-new-func
const AREAS = new Function(`${block.replace('export const', 'const').replace(/: ExtraArea\[\]/, '')}; return EXTRA_AREAS;`)();
const OUT = path.join(ROOT, 'public/peta');
const HEAD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 400" width="1000" height="400">';
const land = fs.readFileSync(path.join(OUT, 'id-land.svg'), 'utf8');

/** Bilangan acak tetap per area (supaya hasil sama tiap dijalankan). */
const rnd = (seed) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const f = (n) => n.toFixed(3);

for (const [id, , , x, y] of AREAS) {
  const r = rnd([...id].reduce((s, c) => s + c.charCodeAt(0), 0));
  const pts = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const rad = 5.2 + r() * 2.4;
    return [x + Math.cos(a) * rad * 1.2, y + Math.sin(a) * rad * 0.8];
  });
  const d = 'M' + pts.map(([px, py]) => `${f(px)},${f(py)}`).join('L') + 'Z';
  fs.writeFileSync(path.join(OUT, `wk-${id}.svg`), `${HEAD}<path d="${d}" fill="#000"/></svg>`);
  fs.writeFileSync(path.join(OUT, `wkl-${id}.svg`), `${HEAD}<path d="${d}" fill="none" stroke="#3F4250" stroke-width="0.0720" stroke-dasharray="0.270 0.135" stroke-linejoin="round"/></svg>`);
  const p1 = [x - 3.6, y + 2.4], p2 = [x + 3.2, y - 2.6];
  fs.writeFileSync(
    path.join(OUT, `wka-${id}.svg`),
    `${HEAD}<path d="M${f(p1[0])},${f(p1[1])}Q${f(x + 0.9)},${f(y + 0.6)} ${f(p2[0])},${f(p2[1])}" fill="none" stroke="#6F8410" stroke-width="0.135" stroke-linecap="round"/>` +
      `<rect x="${f(p1[0] - 0.45)}" y="${f(p1[1] - 0.3)}" width="0.9" height="0.63" rx="0.135" fill="#2A78D6" fill-opacity=".16" stroke="#1A4FA8" stroke-width="0.054"/>` +
      `<rect x="${f(p2[0] - 0.65)}" y="${f(p2[1] - 0.45)}" width="1.3" height="0.91" rx="0.135" fill="#2A78D6" fill-opacity=".16" stroke="#1A4FA8" stroke-width="0.054"/></svg>`,
  );
  fs.writeFileSync(path.join(OUT, `l-${id}.svg`), land.replace(/viewBox="[^"]*"/, `viewBox="${(x - 22.5).toFixed(3)} ${(y - 9).toFixed(3)} 45.000 18.000"`));
}
console.log(`peta ${AREAS.length} area tambahan dibuat`);
