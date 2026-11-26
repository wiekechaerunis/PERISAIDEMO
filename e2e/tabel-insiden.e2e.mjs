// e2e kartu "Tabel insiden" (S16, board Dashboard dan Dashboard-Tabel). Jalankan dev server dulu: npx vite --port 5200,
// lalu node e2e/tabel-insiden.e2e.mjs. Memakai playwright-core + Chrome terpasang. Env: E2E_URL, CHROME_PATH.
// Screenshot 1366 px ke screenshots/tabel-insiden/.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const OUT = 'screenshots/tabel-insiden';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text().slice(0, 160)); });
const role = async (name) => { await page.getByRole('button', { name: /Menu akun/ }).click(); await page.getByText(name, { exact: true }).first().click(); await page.waitForTimeout(500); };
const card = () => page.locator('section.db-tb');
const shot = async (name) => { await card().scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await card().screenshot({ path: `${OUT}/${name}.png` }); };
const pick = async (slot, label) => { await card().locator('.tbar .dd').nth(slot).locator('.pill').click(); await card().locator('.tbar .dd').nth(slot).getByRole('menuitemradio', { name: label, exact: true }).click(); await page.waitForTimeout(150); };
const kpi = (i) => page.locator('.k-val').nth(i).innerText();
const tot = () => card().locator('.ln.ft .c.t').innerText();
const r = {};

await page.goto((process.env.E2E_URL ?? 'http://localhost:5200') + '/analitik'); await page.waitForTimeout(700);
await role('Pengawas SKK');
assert.equal(await page.getByText('Kategori × wilayah', { exact: true }).count(), 0, 'matriks lama sudah hilang');
r.cap = await card().locator('.p-cap').first().innerText();
r.head = await card().locator('.ln.hd').innerText();
r.skkTotal = [await tot(), await kpi(0)];
assert.equal(r.skkTotal[0], r.skkTotal[1], 'total Jumlah = KPI Insiden terverifikasi');
await shot('01-skk-bawaan');

// Kerugian
await card().getByRole('radio', { name: 'Kerugian' }).click(); await page.waitForTimeout(150);
r.rp = [await tot(), await kpi(1)];
assert.equal(r.rp[0], r.rp[1], 'total Kerugian = KPI Kerugian');
await shot('02-kerugian');
await card().getByRole('radio', { name: 'Jumlah' }).click(); await page.waitForTimeout(150);

// Rincikan KKKS, buka baris pertama dan anak pertama (contoh board Dashboard-Tabel)
await pick(1, 'KKKS');
await pick(2, 'Level');
const first = card().locator('.ln.l1 .nm').first();
r.firstRow = await first.locator('.tx').innerText();
await first.click(); await page.waitForTimeout(150);
await card().locator('.ln.l2 .nm').first().click(); await page.waitForTimeout(150);
r.rinci = { kids: await card().locator('.ln.l2').count(), leafs: await card().locator('a.leaf').count(), more: await card().locator('.ln.more .p-cap').first().innerText() };
assert.ok(r.rinci.kids > 0 && r.rinci.leafs > 0);
assert.equal(await card().getByRole('button', { name: 'Tutup semua rincian' }).count(), 1);
await shot('03-rinci-kategori-kkks-level');

// ganti dimensi = tutup semua rincian
await pick(1, 'Tanpa rincian');
assert.equal(await card().locator('.ln.l2').count(), 0);
assert.equal(await card().getByRole('button', { name: 'Tutup semua rincian' }).count(), 0);

// klik angka: buka baris, saring ke kolom, sel bergaris; klik lagi melepas
const cell = card().locator('.ln.l1').first().locator('button.c:not(.z)').last();
const cellV = await cell.innerText();
await cell.click(); await page.waitForTimeout(150);
r.cell = { v: cellV, sel: await card().locator('button.c.sel').count(), more: await card().locator('.ln.more .p-cap').innerText() };
assert.equal(r.cell.sel, 1);
assert.match(r.cell.more, / · Level /);
await shot('04-klik-sel');
await card().locator('button.c.sel').click(); await page.waitForTimeout(150);
assert.equal(await card().locator('button.c.sel').count(), 0);
// angka 0 tidak bisa diklik
r.zero = await card().locator('button.c.z').first().evaluate((e) => getComputedStyle(e).cursor).catch(() => 'tidak ada');

// scroll horizontal dengan kolom pertama tetap (kolom = KKKS)
await card().getByRole('button', { name: 'Tutup semua rincian' }).click().catch(() => {});
await pick(2, 'KKKS');
r.scroll = await card().locator('.grid').evaluate((g) => {
  const before = g.querySelector('.ln.l1 .nm').getBoundingClientRect().left;
  g.scrollLeft = 400;
  const after = g.querySelector('.ln.l1 .nm').getBoundingClientRect().left;
  return { overflow: g.scrollWidth > g.clientWidth, before: Math.round(before), after: Math.round(after), scrollLeft: g.scrollLeft };
});
assert.ok(r.scroll.overflow, 'kolom KKKS melebar, tabel bisa digulir');
assert.equal(r.scroll.before, r.scroll.after, 'kolom nama tetap saat digulir');
await shot('05-kolom-kkks-digulir');

// klik baris insiden membuka detail
await card().locator('.grid').evaluate((g) => { g.scrollLeft = 0; });
await pick(2, 'Tanpa kolom');
await card().locator('.ln.l1 .nm').first().click(); await page.waitForTimeout(150);
const href = await card().locator('a.leaf').first().getAttribute('href');
r.leafHref = href;
assert.match(href, /^\/insiden\/INS-/);

// menu menutup dengan Escape dan saat fokus pindah ke luar
await card().locator('.tbar .dd').nth(2).locator('.pill').click();
await page.keyboard.press('Escape'); await page.waitForTimeout(100);
assert.equal(await card().locator('.pop').count(), 0, 'Escape menutup menu');
await card().locator('.tbar .dd').nth(2).locator('.pill').click();
await card().getByRole('radio', { name: 'Kerugian' }).focus(); await page.waitForTimeout(100);
assert.equal(await card().locator('.pop').count(), 0, 'fokus keluar menutup menu');

// KKKS
await role('Pejabat Berwenang KKKS');
r.kkks = { head: await card().locator('.ln.hd').innerText(), total: [await tot(), await kpi(0)], dims: [] };
await card().locator('.tbar .dd').nth(0).locator('.pill').click();
r.kkks.dims = await card().locator('.tbar .dd').nth(0).getByRole('menuitemradio').allInnerTexts();
await card().locator('.tbar .dd').nth(0).locator('.pill').click();
assert.deepEqual(r.kkks.dims, ['Wilayah kerja', 'Kategori', 'Level']);
assert.equal(r.kkks.total[0], r.kkks.total[1]);
await shot('06-kkks-bawaan');

console.log(JSON.stringify(r, null, 1));
console.log('console errors:', errs.length ? errs : 'tidak ada');
assert.equal(errs.length, 0);
await b.close();
