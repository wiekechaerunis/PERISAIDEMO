// e2e filter "Periode kejadian" di panel Filter daftar Insiden. Jalankan dev server dulu: npx vite --port 5200, lalu node e2e/periode.e2e.mjs.
// Memakai playwright-core + Chrome terpasang. Env: E2E_URL, CHROME_PATH. Screenshot 1366 px ke screenshots/periode/.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const OUT = 'screenshots/periode';
const BASE = process.env.E2E_URL ?? 'http://localhost:5200';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text().slice(0, 160)); });
const role = async (name) => { await page.getByRole('button', { name: /Menu akun/ }).click(); await page.getByText(name, { exact: true }).first().click(); await page.waitForTimeout(500); };
const pop = () => page.locator('.ls-pop');
const filterBtn = () => page.getByRole('button', { name: /^Filter/ });
// Periode kejadian = chip (board Main-Filter): 7/30/90 hari terakhir, Tahun ini, Rentang tanggal; tanpa chip aktif = Semua waktu
const pgroup = () => pop().getByRole('group', { name: 'Periode kejadian' });
const pchip = (name) => pgroup().getByRole('button', { name, exact: true });
const pressed = () => pgroup().locator('[aria-pressed=true]').allInnerTexts();
const applyBtn = () => pop().locator('.p-foot .p-btn-primary');
const footer = async () => (await page.locator('section.p-card > div').last().locator('span').first().innerText()).trim();
const chip = () => page.locator('.lk-applied .p-chip', { hasText: 'Periode:' });
const header = () => pop().locator('.p-cap').first().innerText();
const pickDate = async (label, day) => {
  await pop().getByRole('button', { name: new RegExp('^' + label + ':') }).click();
  await page.getByRole('gridcell', { name: day, exact: true }).click();
  await page.waitForTimeout(150);
};
const r = {};

// mulai dari data seed (localStorage bersih), peran Pengawas SKK
await page.goto(BASE + '/insiden');
await page.evaluate(() => localStorage.clear());
await page.goto(BASE + '/insiden'); await page.waitForTimeout(600);
await role('Pengawas SKK');
r.start = await footer();

// 1. panel: bawaan Semua waktu, Belum ada filter, angka tombol = semua
await filterBtn().click(); await page.waitForTimeout(200);
r.h0 = await header();
r.val0 = await pressed();
r.chips = await pgroup().getByRole('button').allInnerTexts();
r.btn0 = await applyBtn().innerText();

// 2. chip 7 hari terakhir: caption rentang tampil, belum diterapkan sebelum Tampilkan
await pchip('7 hari terakhir').click(); await page.waitForTimeout(200);
r.val7 = (await pressed()).join(',') + ' ' + (await pop().locator('.ls-sec > .p-cap').first().innerText());
await page.screenshot({ path: `${OUT}/01-chip-periode.png` });
r.h7 = await header();
r.btn7 = await applyBtn().innerText();
r.notYetApplied = await footer();

// 3. Tampilkan → chip, daftar tersaring, URL
await applyBtn().click(); await page.waitForTimeout(300);
r.panelClosed = (await pop().count()) === 0;
r.chip7 = (await chip().innerText()).trim();
r.url7 = new URL(page.url()).search;
r.rows7 = await footer();
r.dates7 = await page.locator('table tbody tr').evaluateAll((trs) => trs.map((tr) => tr.innerText.match(/(\d{1,2}) (Okt|Sep|Agu|Jan) (\d{4})?/)?.[0] ?? ''));
r.quick7 = await page.locator('.p-qf [role=radio]').allInnerTexts();
r.badge = await filterBtn().innerText();
await page.screenshot({ path: `${OUT}/03-chip-aktif.png` });

// 4. Back / Forward mempertahankan state dari URL
await page.goBack(); await page.waitForTimeout(300);
r.back = { url: new URL(page.url()).search, rows: await footer(), chip: await chip().count() };
await page.goForward(); await page.waitForTimeout(300);
r.fwd = { url: new URL(page.url()).search, rows: await footer() };

// 5. × pada chip mengembalikan ke Semua waktu
await chip().click(); await page.waitForTimeout(300);
r.afterX = { url: new URL(page.url()).search, rows: await footer(), chip: await chip().count() };

// 6. rentang khusus terbalik → galat + tombol nonaktif; lalu rentang benar diterapkan
await filterBtn().click(); await page.waitForTimeout(200);
await pchip('Rentang tanggal').click(); await page.waitForTimeout(150);
r.incompleteDisabled = await applyBtn().isDisabled();
await pickDate('Dari', '15 Okt 2026');
await pickDate('Sampai', '1 Okt 2026');
r.errRev = await pop().locator('.p-help.err').innerText();
r.revDisabled = await applyBtn().isDisabled();
r.revLabel = await applyBtn().innerText();
await page.screenshot({ path: `${OUT}/02-rentang-khusus-galat.png` });
await pickDate('Sampai', '29 Okt 2026').catch(() => {});
r.errFuture = await pop().locator('.p-help.err').innerText().catch(() => '');
await pickDate('Dari', '1 Okt 2026');
await pickDate('Sampai', '15 Okt 2026');
r.okErr = await pop().locator('.p-help.err').count();
// 1–15 Okt: tidak ada insiden SKK di rentang itu → "Tidak ada insiden" dan nonaktif
r.zero = { text: await applyBtn().innerText(), disabled: await applyBtn().isDisabled() };
await pickDate('Sampai', '20 Okt 2026');
r.btnCustom = await applyBtn().innerText();
await applyBtn().click(); await page.waitForTimeout(300);
r.chipCustom = (await chip().innerText()).trim();
r.urlCustom = new URL(page.url()).search;
r.rowsCustom = await footer();
await chip().click(); await page.waitForTimeout(200);

// 7. DAN dengan pintasan dan pencarian: 7 hari + Tinggi & Kritis
await page.goto(BASE + '/insiden?periode=7h'); await page.waitForTimeout(500);
await page.getByRole('radio', { name: /Tinggi & Kritis/ }).click(); await page.waitForTimeout(200);
r.and = await footer();
await page.getByRole('textbox', { name: /Cari/ }).fill('ADR-07'); await page.waitForTimeout(200);
r.andSearch = await footer();

// 8. reload ?periode=30h mempertahankan state
await page.goto(BASE + '/insiden?periode=30h'); await page.waitForTimeout(500);
await page.reload(); await page.waitForTimeout(600);
r.reload = { chip: (await chip().innerText()).trim(), rows: await footer() };

// 9. Hapus filter → Belum ada filter, Semua waktu
await filterBtn().click(); await page.waitForTimeout(200);
r.h30 = await header();
await pop().getByRole('button', { name: 'Hapus filter' }).click(); await page.waitForTimeout(300);
r.cleared = { url: new URL(page.url()).search, chip: await chip().count(), rows: await footer() };
await filterBtn().click(); await page.waitForTimeout(200);
r.hCleared = await header();
r.valCleared = await pressed();
await filterBtn().click();

// 10. nilai URL tidak valid diabaikan; tab Kerawanan ikut periode
await page.goto(BASE + '/insiden?periode=99h'); await page.waitForTimeout(400);
r.invalid = { chip: await chip().count(), rows: await footer() };
await page.goto(BASE + '/insiden?tab=kerawanan&periode=7h'); await page.waitForTimeout(500);
r.krw = { chip: (await chip().innerText()).trim(), body: (await page.locator('table tbody').innerText()).trim(), pager: (await page.locator('.p-pager span').first().innerText()).trim() };
await page.screenshot({ path: `${OUT}/04-kerawanan-periode.png` });

// ---- pemeriksaan ----
console.log(JSON.stringify(r, null, 1));
assert.equal(r.start, '11 insiden');
assert.equal(r.h0, 'Belum ada filter');
assert.deepEqual(r.val0, [], 'bawaan Semua waktu: tidak ada chip aktif');
assert.deepEqual(r.chips, ['7 hari terakhir', '30 hari terakhir', '90 hari terakhir', 'Tahun ini', 'Rentang tanggal']);
assert.equal(r.btn0, 'Tampilkan 11 insiden');
assert.equal(r.val7, '7 hari terakhir 21–28 Okt 2026');
assert.equal(r.h7, '1 filter aktif');
assert.equal(r.btn7, 'Tampilkan 6 insiden');
assert.equal(r.notYetApplied, '11 insiden', 'belum diterapkan sebelum Tampilkan');
assert.ok(r.panelClosed);
assert.equal(r.chip7, 'Periode: 7 hari terakhir');
assert.equal(r.url7, '?periode=7h');
assert.equal(r.rows7, '6 insiden');
assert.match(r.badge, /1/);
assert.deepEqual(r.back, { url: '', rows: '11 insiden', chip: 0 });
assert.deepEqual(r.fwd, { url: '?periode=7h', rows: '6 insiden' });
assert.deepEqual(r.afterX, { url: '', rows: '11 insiden', chip: 0 });
assert.ok(r.incompleteDisabled, 'rentang belum lengkap: tombol nonaktif');
assert.equal(r.errRev, 'Tanggal akhir tidak boleh sebelum tanggal awal.');
assert.ok(r.revDisabled);
assert.equal(r.revLabel, 'Tampilkan insiden', 'tanpa angka saat rentang tidak valid');
assert.equal(r.errFuture, 'Tanggal tidak boleh melewati hari ini.');
assert.equal(r.okErr, 0);
assert.deepEqual(r.zero, { text: 'Tidak ada insiden', disabled: true });
assert.equal(r.btnCustom, 'Tampilkan 2 insiden');
assert.equal(r.chipCustom, 'Periode: 1–20 Okt 2026');
assert.equal(r.urlCustom, '?dari=2026-10-01&sampai=2026-10-20');
assert.equal(r.rowsCustom, '2 insiden');
assert.equal(r.reload.chip, 'Periode: 30 hari terakhir');
assert.equal(r.reload.rows, '8 insiden');
assert.equal(r.h30, '1 filter aktif');
assert.deepEqual(r.valCleared, []);
assert.deepEqual(r.cleared, { url: '', chip: 0, rows: '11 insiden' });
assert.equal(r.hCleared, 'Belum ada filter');
assert.deepEqual(r.invalid, { chip: 0, rows: '11 insiden' });
assert.equal(r.krw.chip, 'Periode: 7 hari terakhir');
assert.deepEqual(errs, [], 'console bersih');
console.log('e2e Periode kejadian lolos');
await b.close();
