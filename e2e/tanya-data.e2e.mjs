// e2e kolom "Tanya data" di Temuan AI (S6). Jalankan dev server dulu: npx vite --port 5200, lalu node e2e/tanya-data.e2e.mjs.
// Memakai playwright-core + Chrome terpasang. Env: E2E_URL, CHROME_PATH. Screenshot 1366 px ke screenshots/tanya-data/.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const OUT = 'screenshots/tanya-data';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text().slice(0, 160)); });
const role = async (name) => { await page.getByRole('button', { name: /Menu akun/ }).click(); await page.getByText(name, { exact: true }).first().click(); await page.waitForTimeout(500); };
const toAi = async () => { await page.evaluate(() => { const el = document.querySelector('.db-ai'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80); }); await page.waitForTimeout(200); };
const input = () => page.getByRole('textbox', { name: 'Tanya data' });
const ask = async (q) => { await input().fill(q); await page.waitForTimeout(300); await input().press('Enter'); await page.waitForTimeout(700); };
const r = {};

await page.goto((process.env.E2E_URL ?? 'http://localhost:5200') + '/analitik'); await page.waitForTimeout(600);
await role('Pengawas SKK');
await toAi();
const h = await page.evaluate(() => { const a = document.querySelector('.db-ai').getBoundingClientRect().height; const p = [...document.querySelectorAll('.lk-grid > section')].find((s) => /Perlu tindakan/.test(s.innerText)); return [Math.round(a), Math.round(p.getBoundingClientRect().height)]; });
r.heights = h;
// fokus kosong
await input().click(); await page.waitForTimeout(200);
r.sug = await page.locator('.db-askpop .p-chip.sug').allInnerTexts();
await page.screenshot({ path: `${OUT}/01-fokus.png` });
// keyboard ↓ Enter
await input().press('ArrowDown'); await input().press('Enter'); await page.waitForTimeout(700);
r.kbd = await page.locator('.db-askpop .kal').innerText();
r.focusKept = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
// mengetik
await input().fill('insiden Kritis di Sumbagsel bulan Juni'); await page.waitForTimeout(350);
r.chips = await page.locator('.db-askpop .p-chip.got').allInnerTexts();
await page.screenshot({ path: `${OUT}/02-mengetik.png` });
// hapus chip lalu kembalikan
await input().press('Enter'); await page.waitForTimeout(150);
r.busy = await page.locator('.db-askpop .busy').count();
await page.waitForTimeout(600);
r.saring = await page.locator('.db-askpop .kal').innerText();
r.monthNote = await page.locator('.db-askpop .note').innerText().catch(() => '');
await page.screenshot({ path: `${OUT}/03-jawaban-saring.png` });
const before = await page.locator('.k-val').first().innerText();
await page.getByRole('button', { name: 'Terapkan ke dashboard' }).click(); await page.waitForTimeout(600);
r.applied = { before, after: await page.locator('.k-val').first().innerText(), af: (await page.locator('.db-af').innerText()).replace(/\n/g, ' ') };
await page.getByRole('button', { name: 'Hapus semua' }).click().catch(() => {}); await page.waitForTimeout(400);
// peringkat
await toAi();
await ask('KKKS dengan kerugian terbesar');
r.rank = (await page.locator('.db-askpop .res').innerText()).replace(/\n/g, ' | ');
await page.screenshot({ path: `${OUT}/04-jawaban-peringkat.png` });
await page.locator('.db-askpop .rank button').first().click(); await page.waitForTimeout(500);
r.rankApplied = (await page.locator('.db-af').innerText()).replace(/\n/g, ' ');
await page.getByRole('button', { name: 'Hapus semua' }).click().catch(() => {}); await page.waitForTimeout(400);
// banding
await toAi();
await ask('pencurian Maret vs Juni');
r.banding = await page.locator('.db-askpop .kal').innerText();
await page.getByRole('button', { name: 'Sorot di Tren' }).click(); await page.waitForTimeout(700);
r.trendRing = await page.evaluate(() => [...document.querySelectorAll('.db-col .st i')].filter((i) => i.style.boxShadow && i.style.boxShadow !== 'none').length);
await page.getByRole('button', { name: 'Hapus semua' }).click().catch(() => {}); await page.waitForTimeout(400);
// lokasi
await toAi();
await ask('Aceh Timur');
await page.waitForTimeout(500);
r.lokasi = { crumb: (await page.locator('.db-crumb').innerText()).replace(/\n/g, ' '), mapTop: Math.round(await page.evaluate(() => document.querySelector('.db-mapc').getBoundingClientRect().top)) };
// tidak dikenali
await page.locator('.db-crumb button', { hasText: 'Indonesia' }).click(); await page.waitForTimeout(400);
await toAi();
await ask('cuaca besok');
r.unknown = (await page.locator('.db-askpop .res').innerText()).replace(/\n/g, ' | ');
await page.screenshot({ path: `${OUT}/05-tidak-dikenali.png` });
// nol
await ask('kebakaran di Jabanusa');
r.zero = await page.locator('.db-askpop .kal').innerText();
await page.locator('.db-askpop .acts button', { hasText: 'Hapus Jabanusa' }).click(); await page.waitForTimeout(800);
r.zeroAfter = await page.locator('.db-askpop .kal').innerText();
await input().press('Escape'); await page.waitForTimeout(150);
r.escClosed = (await page.locator('.db-askpop').count()) === 0;
r.footer = 'checked';
// KKKS
await role('Pejabat Berwenang KKKS');
await toAi();
await input().click(); await page.waitForTimeout(200);
r.kkksSug = await page.locator('.db-askpop .p-chip.sug').allInnerTexts();
await ask('insiden PT Deli Raya Hulu');
r.kkks = await page.locator('.db-askpop .kal').innerText();
await page.screenshot({ path: `${OUT}/06-kkks.png` });
// ---- pemeriksaan ----
assert.deepEqual(r.heights[0], r.heights[1], 'tinggi Temuan AI = Perlu tindakan');
assert.equal(r.sug.length, 4);
assert.equal(r.focusKept, 'Tanya data', 'fokus tetap di input');
assert.deepEqual(r.chips, ['Kritis', 'Sumbagsel', 'Jun 2026']);
assert.equal(r.busy, 1, 'state Menghitung tampil');
assert.match(r.saring, /^\d+ insiden Kritis di Sumbagsel, Jun 2026\.$/);
assert.notEqual(r.applied.before, r.applied.after, 'kartu angka berubah setelah Terapkan');
assert.match(r.applied.af, /Level: Kritis/);
assert.match(r.applied.af, /Wilayah: Sumbagsel/);
assert.match(r.rankApplied, /KKKS: PT Samudra Energi Nusantara/);
assert.ok(r.trendRing >= 2, 'bulan disorot di Tren');
assert.match(r.lokasi.crumb, /Aceh Timur/);
assert.match(r.unknown, /^Belum bisa menjawab pertanyaan itu\. Coba:/);
assert.match(r.zero, /^Tidak ada insiden yang cocok dengan Kebakaran · Jabanusa\.$/);
assert.ok(r.escClosed, 'Esc menutup popover');
assert.equal(r.kkks, 'Hanya data organisasi Anda yang bisa ditanyakan.');
assert.deepEqual(errs, [], 'console bersih');
console.log('e2e Tanya data lolos', JSON.stringify({ saring: r.saring, rank: r.rank, banding: r.banding, lokasi: r.lokasi.crumb }));
await b.close();
