// e2e tombol Periode di Dashboard insiden (/analitik). Jalankan dev server dulu: npx vite --port 5200, lalu node e2e/dashboard-periode.e2e.mjs.
// Memakai playwright-core + Chrome terpasang. Env: E2E_URL, CHROME_PATH. Screenshot 1366 px ke screenshots/dashboard-periode/.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const OUT = 'screenshots/dashboard-periode';
const BASE = process.env.E2E_URL ?? 'http://localhost:5200';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text().slice(0, 160)); });
const role = async (name) => { await page.getByRole('button', { name: /Menu akun/ }).click(); await page.getByText(name, { exact: true }).first().click(); await page.waitForTimeout(500); };
const perBtn = () => page.getByRole('button', { name: /^Periode:/ });
const pop = () => page.locator('.db-per2');
const kpi0 = async () => (await page.locator('.k-val').first().innerText()).trim();
const sub = async () => (await page.locator('.p-appbar .sub').first().innerText()).trim();
const bars = async () => page.locator('.db-col').evaluateAll((els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
const search = () => new URL(page.url()).search;
const pickDate = async (label, monthsBack, day) => {
  await pop().getByRole('button', { name: new RegExp('^' + label + ':') }).click();
  for (let i = 0; i < monthsBack; i++) await page.getByRole('button', { name: 'Bulan sebelumnya' }).click();
  await page.getByRole('gridcell', { name: day, exact: true }).click();
  await page.waitForTimeout(150);
};
const r = {};

await page.goto(BASE + '/analitik');
await page.evaluate(() => localStorage.clear());
await page.goto(BASE + '/analitik'); await page.waitForTimeout(800);
await role('Pengawas SKK');
await page.waitForTimeout(600);
r.start = { btn: (await perBtn().innerText()).trim(), kpi: await kpi0(), sub: await sub(), bars: (await bars()).length };

// 1. dropdown: 7 pilihan dengan rentang (hari ini = 30 Jun 2026)
await perBtn().click(); await page.waitForTimeout(200);
r.expanded = await perBtn().getAttribute('aria-expanded');
r.options = (await pop().getByRole('option').allInnerTexts()).map((t) => t.replace(/\n/g, ' | '));
await page.screenshot({ path: `${OUT}/01-dropdown-terbuka.png` });

// 2. keyboard ↓ Enter memilih 7 hari terakhir; langsung berlaku
await perBtn().focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
r.d7 = { btn: (await perBtn().innerText()).trim(), url: search(), kpi: await kpi0(), sub: await sub(), bars: await bars(), closed: (await pop().count()) === 0 };
await page.screenshot({ path: `${OUT}/02-tujuh-hari.png` });

// 3. 3 bulan terakhir (klik)
await perBtn().click(); await pop().getByRole('option', { name: /3 bulan terakhir/ }).click(); await page.waitForTimeout(600);
r.b3 = { url: search(), kpi: await kpi0(), bars: await bars() };

// 4. Back kembali ke 7 hari; reload mempertahankan
await page.goBack(); await page.waitForTimeout(600);
r.back = { url: search(), kpi: await kpi0() };
await page.reload(); await page.waitForTimeout(900);
r.reload = { url: search(), btn: (await perBtn().innerText()).trim(), kpi: await kpi0() };

// 5. Rentang khusus: terbalik → galat, Terapkan nonaktif; lalu 1–15 Mei
await perBtn().click(); await pop().getByRole('option', { name: /Rentang khusus/ }).click(); await page.waitForTimeout(200);
r.cuDisabled0 = await pop().getByRole('button', { name: 'Terapkan' }).isDisabled();
await pickDate('Dari', 1, '15 Mei 2026');
await pickDate('Sampai', 1, '1 Mei 2026');
r.cuErr = await pop().locator('.p-help.err').innerText();
r.cuDisabled = await pop().getByRole('button', { name: 'Terapkan' }).isDisabled();
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(150);
await page.screenshot({ path: `${OUT}/03-rentang-khusus-galat.png` });
await pickDate('Dari', 0, '1 Mei 2026');
await pickDate('Sampai', 0, '15 Mei 2026');
r.cuErr2 = await pop().locator('.p-help.err').count();
await pop().getByRole('button', { name: 'Terapkan' }).click(); await page.waitForTimeout(600);
r.cu = { url: search(), btn: (await perBtn().innerText()).trim(), kpi: await kpi0(), sub: await sub(), cmp: (await page.locator('.k-cmp, .cmp').first().innerText().catch(() => '')).trim(), foot: (await page.locator('.db-foot, footer').last().innerText().catch(() => '')).trim() };
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(150);
await page.screenshot({ path: `${OUT}/04-rentang-khusus-diterapkan.png` });

// 6. Tanya data ikut periode
const input = () => page.getByRole('textbox', { name: 'Tanya data' });
await page.evaluate(() => { const el = document.querySelector('.db-ai'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80); });
await input().fill('insiden Kritis'); await page.waitForTimeout(300); await input().press('Enter'); await page.waitForTimeout(900);
r.ask = (await page.locator('.db-askpop .kal').innerText().catch(() => '')).trim();
await page.keyboard.press('Escape'); await page.waitForTimeout(200);

// 7. nilai URL tidak valid diabaikan; Semua waktu kembali ke angka semester
await page.goto(BASE + '/analitik?periode=99h'); await page.waitForTimeout(800);
r.invalid = { btn: (await perBtn().innerText()).trim(), kpi: await kpi0() };
await page.goto(BASE + '/analitik?periode=bulan'); await page.waitForTimeout(800);
await perBtn().click(); await pop().getByRole('option', { name: /Semua waktu/ }).click(); await page.waitForTimeout(600);
r.all = { url: search(), kpi: await kpi0(), sub: await sub(), bars: (await bars()).length };

console.log(JSON.stringify(r, null, 1));
assert.deepEqual(r.start, { btn: 'Semua waktu', kpi: '106', sub: r.start.sub, bars: 6 });
assert.match(r.start.sub, /^Semester I 2026 · /);
assert.equal(r.expanded, 'true');
assert.deepEqual(r.options, [
  'Semua waktu | 1 Jan – 30 Jun 2026', '7 hari terakhir | 23–30 Jun 2026', '30 hari terakhir | 31 Mei – 30 Jun 2026', 'Bulan ini | 1–30 Jun 2026',
  '3 bulan terakhir | 30 Mar – 30 Jun 2026', 'Tahun berjalan | 1 Jan – 30 Jun 2026', 'Rentang khusus | Pilih tanggal Dari dan Sampai',
]);
assert.equal(r.d7.btn, '7 hari terakhir');
assert.equal(r.d7.url, '?periode=7h');
assert.ok(r.d7.closed);
assert.match(r.d7.sub, /^7 hari terakhir \(23–30 Jun 2026\) · /);
assert.equal(r.d7.bars.length, 1);
assert.ok(Number(r.d7.kpi) > 0 && Number(r.d7.kpi) < Number(r.b3.kpi) && Number(r.b3.kpi) < 106, 'angka berbeda per periode');
assert.equal(r.b3.url, '?periode=3b');
assert.equal(r.b3.bars.length, 4);
assert.deepEqual(r.back, { url: '?periode=7h', kpi: r.d7.kpi });
assert.deepEqual(r.reload, { url: '?periode=7h', btn: '7 hari terakhir', kpi: r.d7.kpi });
assert.ok(r.cuDisabled0);
assert.equal(r.cuErr, 'Tanggal akhir tidak boleh sebelum tanggal awal.');
assert.ok(r.cuDisabled);
assert.equal(r.cuErr2, 0);
assert.equal(r.cu.url, '?dari=2026-05-01&sampai=2026-05-15');
assert.equal(r.cu.btn, '1–15 Mei 2026');
assert.match(r.cu.sub, /^1–15 Mei 2026 · /);
assert.match(r.ask, /periode 1–15 Mei 2026/, 'jawaban Tanya data menyebut periode aktif');
assert.deepEqual(r.invalid, { btn: 'Semua waktu', kpi: '106' });
assert.equal(r.all.url, '');
assert.equal(r.all.kpi, '106');
assert.equal(r.all.bars, 6);
assert.deepEqual(errs, [], 'console bersih');
console.log('e2e Periode dashboard lolos');
await b.close();
