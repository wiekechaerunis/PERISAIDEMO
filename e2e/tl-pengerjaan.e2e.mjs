// e2e Pengerjaan satu kartu (PgKartu/T14N). Jalankan dev server dulu: npx vite --port 5200, lalu npm run e2e.
// Memakai playwright-core + Chrome yang terpasang (tanpa unduhan browser). Ubah lewat env:
//   E2E_URL (bawaan http://localhost:5200), CHROME_PATH, E2E_SHOTS=1 untuk screenshot 7 kasus ke screenshots/tindak-lanjut/.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const BASE = process.env.E2E_URL ?? 'http://localhost:5200';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = 'screenshots/tindak-lanjut';
const TL = 'TL-SEN-2026-0035'; // Belum dimulai, sumber insiden, PIC Rudi Hartono, pemberi tugas Andi Pratama

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const errors = [];
const newPage = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  // 404 favicon.ico sudah ada sejak awal aplikasi (bukan bagian TL); respons gagal lain tetap dihitung.
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|React Router Future/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(r.status() + ' ' + r.url()); });
  page.on('pageerror', (e) => errors.push('pageerror ' + e.message));
  return page;
};
const asRole = async (page, label) => {
  await page.getByRole('button', { name: /^Menu akun/ }).click();
  await page.getByRole('menu').getByText(label, { exact: true }).first().click();
  await page.waitForTimeout(200);
};
const statusTag = (page) => page.locator('header .ttl .p-tag').first().innerText();
const open = async (page, no) => { await page.goto(`${BASE}/tindak-lanjut/${no}`); await page.waitForTimeout(300); };
const step = (t) => console.log('  ✓ ' + t);

console.log('e2e · Pengerjaan satu kartu (Rudi → Andi)');
const page = await newPage();
await page.goto(`${BASE}/tindak-lanjut`);
await asRole(page, 'Teknisi pengamanan');
await open(page, TL);
assert.equal(await statusTag(page), 'Belum dimulai');
const card = page.getByRole('region', { name: 'Pengerjaan' });

// 1. unggah bukti: status tetap Belum dimulai
await card.getByRole('button', { name: 'Pilih file' }).click();
await page.waitForTimeout(150);
assert.equal(await statusTag(page), 'Belum dimulai');
assert.ok(await card.getByText(/belum diajukan/).first().isVisible());
step('unggah bukti tidak mengubah status (Belum dimulai)');

// 2. catatan progres pertama: Dikerjakan + riwayat Mulai dikerjakan
await card.getByLabel('Catatan progres').fill('Panel beton sudah datang, pemasangan mulai hari ini.');
await card.getByRole('button', { name: 'Tambah catatan' }).click();
await page.waitForTimeout(150);
assert.equal(await statusTag(page), 'Dikerjakan');
const riwayat = page.getByRole('list', { name: 'Riwayat tindak lanjut' });
assert.ok(await riwayat.getByText('Mulai dikerjakan').isVisible());
step('catatan progres pertama → Dikerjakan + riwayat "Mulai dikerjakan"');

// 3. catatan penyelesaian di kartu, lalu Ajukan selesai lewat dialog T15
const NOTE = 'Pagar diganti panel beton, foto dari dua sisi terlampir.';
await card.getByLabel('Catatan penyelesaian').fill(NOTE);
await card.getByRole('button', { name: 'Ajukan selesai' }).click();
const dlg = page.getByRole('dialog', { name: 'Ajukan selesai?' });
assert.ok(await dlg.getByText(NOTE).isVisible(), 'dialog menampilkan catatan yang sudah ditulis');
assert.equal(await dlg.locator('textarea').count(), 0, 'dialog tanpa isian catatan');
await dlg.getByRole('button', { name: 'Ajukan selesai' }).click();
await page.waitForTimeout(200);
assert.equal(await statusTag(page), 'Menunggu pemeriksaan');
step('Ajukan selesai lewat dialog → Menunggu pemeriksaan');

// 4. layar Menunggu pemeriksaan (sisi PIC)
const sub = card.locator('.pg-sub');
assert.ok(await sub.getByText('2 · Pengajuan selesai').isVisible());
const bg = await sub.evaluate((el) => {
  const probe = document.createElement('div');
  probe.style.background = 'var(--surface-subtle)';
  document.body.appendChild(probe);
  const want = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return { got: getComputedStyle(el).backgroundColor, want };
});
assert.equal(bg.got, bg.want, 'latar Pengajuan selesai = --surface-subtle (netral, bukan lime)');
assert.equal(await card.getByText('Terkunci selama diperiksa').count(), 1);
assert.equal(await sub.locator('.pg-quote p').innerText(), NOTE);
assert.equal(await sub.locator('textarea').count(), 0, 'catatan sebagai kutipan, bukan isian');
assert.ok(await sub.getByRole('button', { name: 'Tarik pengajuan' }).isVisible());
assert.equal(await page.locator('header').first().getByRole('button', { name: /Tarik pengajuan|Ajukan selesai/ }).count(), 0, 'header tanpa aksi');
assert.equal(await card.locator('.pg-done').count(), 0);
step('Pengajuan selesai netral, kunci sekali, kutipan, Tarik pengajuan di kaki kartu');
if (process.env.E2E_SHOTS) await page.screenshot({ path: `${SHOTS}/e2e-menunggu-${TL}.png`, fullPage: true });

// 5. Andi (pemberi tugas) menyetujui lewat dialog
await asRole(page, 'Koordinator Security');
await open(page, TL);
await page.getByRole('button', { name: 'Setujui selesai' }).click();
const dlg2 = page.getByRole('dialog', { name: 'Setujui penyelesaian?' });
await dlg2.getByRole('button', { name: 'Setujui' }).click();
await page.waitForTimeout(200);
assert.equal(await statusTag(page), 'Selesai');
assert.ok(await page.getByRole('list', { name: 'Riwayat tindak lanjut' }).getByText('Diperiksa selesai').isVisible());
step('Andi Pratama menyetujui selesai lewat dialog → Selesai');

// 6. Screenshot 7 kasus (opsional)
if (process.env.E2E_SHOTS) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const cases = [
    ['T13-belum-insiden', 'TL-SEN-2026-0035'],
    ['T13M-baru-dimulai', 'TL-SEN-2026-0035', 'mulai'],
    ['T13R-belum-kerawanan', 'TL-SEN-2026-0033'],
    ['T13A-belum-arahan', 'TL-SEN-2026-0042'],
    ['T14-dikerjakan', 'TL-SEN-2026-0030'],
    ['T16-menunggu', 'TL-SEN-2026-0043'],
    ['T23-dikembalikan', 'TL-SEN-2026-0030', 'kembalikan'],
  ];
  for (const [name, no, act] of cases) {
    const p = await newPage();
    await p.goto(`${BASE}/tindak-lanjut`);
    await asRole(p, 'Teknisi pengamanan');
    await open(p, no);
    if (act === 'mulai') { await p.getByRole('button', { name: 'Mulai kerjakan' }).click(); await p.waitForTimeout(200); }
    if (act === 'kembalikan') {
      // Dikembalikan lewat alur nyata: Rudi mengajukan, Sari (pemberi tugas TL-0030) mengembalikan dengan alasan.
      await p.getByRole('region', { name: 'Pengerjaan' }).getByRole('button', { name: 'Ajukan selesai' }).click();
      await p.getByRole('dialog', { name: 'Ajukan selesai?' }).getByRole('button', { name: 'Ajukan selesai' }).click();
      await asRole(p, 'Pejabat Berwenang KKKS');
      await open(p, no);
      await p.getByRole('button', { name: 'Kembalikan' }).first().click();
      const d = p.getByRole('dialog', { name: 'Kembalikan ke PIC' });
      await d.getByLabel('Alasan').fill('Daftar hadir pelatihan belum ditandatangani komandan regu.');
      await d.getByRole('button', { name: 'Kembalikan' }).click();
      await p.waitForTimeout(200);
      await asRole(p, 'Teknisi pengamanan');
      await open(p, no);
      assert.ok(await p.getByText(/Dikembalikan oleh/).first().isVisible(), 'banner Dikembalikan tampil');
    }
    await p.mouse.move(1, 1);
    await p.screenshot({ path: `${SHOTS}/${name}-${no}.png`, fullPage: true });
    console.log(`  · screenshot ${name} (${no}): ${await statusTag(p)}`);
    await p.context().close();
  }
}

await browser.close();
if (errors.length) {
  console.error('Error konsol:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('e2e lolos, konsol bersih');
