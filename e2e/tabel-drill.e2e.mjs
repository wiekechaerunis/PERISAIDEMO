// e2e kartu "Tabel insiden" (TabelDrill, board TD1–TD8 Desain v2). Jalankan dev server dulu: npx vite --port 5200,
// lalu node e2e/tabel-drill.e2e.mjs. Memakai playwright-core + Chrome terpasang. Env: E2E_URL, CHROME_PATH.
// Screenshot 1366 px ke screenshots/tabel-drill/ (nama file = board). Termasuk pivot 2 tingkat (TD14–TD16).
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const OUT = 'screenshots/tabel-drill';
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_URL ?? 'http://localhost:5200';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text().slice(0, 160)); });
const role = async (name) => { await page.getByRole('button', { name: /Menu akun/ }).click(); await page.getByText(name, { exact: true }).first().click(); await page.waitForTimeout(500); };
const card = () => page.locator('section.td');
const shot = async (name, extra = 0) => {
  await card().scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
  const bb = await card().boundingBox();
  await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: bb.x - 8, y: bb.y - 8, width: bb.width + 16, height: bb.height + 16 + extra } });
};
const row = (name) => card().locator('tbody tr').filter({ has: page.locator('th', { hasText: name }) }).first();
const cell = (name, i) => row(name).locator('td').nth(i).locator('button.cv');
const menu = async (label, opt) => { await card().getByRole('button', { name: new RegExp('^' + label.replace(/[›]/g, '.') + ':') }).click(); await card().getByRole('menuitemradio', { name: opt, exact: true }).click(); await page.waitForTimeout(150); };
const foot = () => card().locator('tfoot td').allInnerTexts();
const kpi = (i) => page.locator('.k-val').nth(i).innerText();
const r = {};

await page.goto(BASE + '/analitik'); await page.waitForTimeout(700);
await role('Pengawas SKK');
assert.equal(await page.locator('.db-tb').count(), 0, 'pivot lama sudah hilang');

// TD1 ringkasan
r.td1 = { cap: await card().locator('.hd .p-cap').innerText(), head: (await card().locator('thead').innerText()).replace(/\n/g, ' | '), foot: await foot() };
r.kpi = [await kpi(0), await kpi(1), await kpi(2)];
assert.deepEqual([r.td1.foot[0], r.td1.foot[2], r.td1.foot[3]], r.kpi, 'baris Total = Insiden terverifikasi, Kerugian, Tinggi & Kritis');
await shot('TD1-Ringkasan');

// TD2 popover aksi
await cell('Pencurian/Perampokan', 0).click(); await page.waitForTimeout(150);
r.td2 = (await card().locator('.td-pop').innerText()).replace(/\n/g, ' | ');
await shot('TD2-Aksi', 200);
// TD3 rincikan
await card().locator('.td-pop').getByRole('button', { name: 'Rincikan menurut' }).click(); await page.waitForTimeout(150);
r.td3 = await card().locator('.td-pop .sub button').allInnerTexts();
await shot('TD3-Rincikan', 260);
// TD4 per wilayah
await card().locator('.td-pop .sub').getByRole('menuitem', { name: 'Wilayah SKK' }).click(); await page.waitForTimeout(200);
r.td4 = { crumb: await card().locator('.td-crumb').innerText(), url: page.url().split('?')[1], rows: await card().locator('tbody th').allInnerTexts() };
assert.match(r.td4.crumb, /Semua insiden\s*›\s*Kategori: Pencurian\/Perampokan/);
await shot('TD4-PerWilayah');
// TD5 daftar insiden
await cell('Sumbagsel', 0).click(); await page.waitForTimeout(150);
await card().locator('.td-pop').getByRole('button', { name: /^Lihat \d+ insiden$/ }).click(); await page.waitForTimeout(200);
r.td5 = { crumb: await card().locator('.td-crumb').innerText(), lh: await card().locator('.td-lh').innerText(), rows: await card().locator('.td-l tbody tr').count(), pg: await card().locator('.td-pg .p-cap').innerText(), url: page.url().split('?')[1] };
assert.ok(r.td5.rows <= 10 && r.td5.rows > 0);
await shot('TD5-DaftarInsiden');
// reload + Back mengembalikan state
await page.reload(); await page.waitForTimeout(800);
assert.equal(await card().locator('.td-crumb').innerText(), r.td5.crumb, 'reload mempertahankan jejak');
await page.goBack(); await page.waitForTimeout(500);
r.back = await card().locator('.td-crumb').innerText();
assert.match(r.back, /Kategori: Pencurian\/Perampokan$|Kategori: Pencurian\/Perampokan\s*× Reset/);
await page.goForward(); await page.waitForTimeout(500);
// klik baris membuka detail
const firstId = await card().locator('.td-l tbody tr a.id').first().innerText();
await card().locator('.td-l tbody tr').first().click(); await page.waitForTimeout(700);
r.detailUrl = page.url().replace(BASE, '');
assert.equal(r.detailUrl, '/insiden/' + firstId);
await page.goBack(); await page.waitForTimeout(800);
// Reset
await card().getByRole('button', { name: '× Reset' }).click(); await page.waitForTimeout(200);
assert.equal(await card().locator('.td-crumb').count(), 0);

// TD6 korban: klik Total Meninggal? Total tidak bisa diklik di desain; klik angka Meninggal di baris → Lihat insiden
const mdRow = card().locator('tbody tr').filter({ has: page.locator('td.strong') }).first();
r.mdRow = await mdRow.locator('th').innerText();
await mdRow.locator('td.strong button.cv').click(); await page.waitForTimeout(150);
r.mdPop = (await card().locator('.td-pop .ph').innerText()).replace(/\n/g, ' | ');
await card().locator('.td-pop').getByRole('button', { name: /^Lihat \d+ insiden$/ }).click(); await page.waitForTimeout(200);
r.td6 = { crumb: await card().locator('.td-crumb').innerText(), korban: await card().locator('.td-l tbody td:nth-child(7)').allInnerTexts(), foot: await card().locator('.td-foot').innerText() };
assert.ok(r.td6.korban.every((k) => /meninggal/.test(k)));
await shot('TD6-Korban');
await card().getByRole('button', { name: '× Reset' }).click(); await page.waitForTimeout(200);

// sortir: klik header Kerugian
await card().locator('thead button.sh', { hasText: 'Kerugian' }).click(); await page.waitForTimeout(150);
r.sort = await card().locator('thead th[aria-sort="descending"]').innerText();

// Kelompokkan menurut Level → urutan alami
await menu('Baris', 'Level');
r.lvRows = await card().locator('tbody th').allInnerTexts();
await menu('Baris', 'Kategori');

// Saring halaman benar-benar memasang filter
const before = await kpi(0);
await cell('Unjuk rasa', 0).click(); await page.waitForTimeout(150);
await card().locator('.td-pop').getByRole('button', { name: /Saring halaman ke/ }).click(); await page.waitForTimeout(500);
r.filter = { toast: await card().locator('.td-toast').innerText(), chips: (await page.locator('.db-af').innerText()).replace(/\n/g, ' '), kpi: [before, await kpi(0)], foot0: (await foot())[0] };
assert.match(r.filter.chips, /Kategori: Unjuk rasa/);
assert.equal(r.filter.kpi[1], r.filter.foot0);
assert.notEqual(r.filter.kpi[0], r.filter.kpi[1]);
await page.getByRole('button', { name: 'Hapus semua' }).click().catch(() => {}); await page.waitForTimeout(400);

// Unduh CSV
const [dl] = await Promise.all([page.waitForEvent('download'), card().getByRole('button', { name: 'Unduh CSV' }).click()]);
const p = await dl.path();
r.csv = { name: dl.suggestedFilename(), head: fs.readFileSync(p, 'utf8').split('\r\n').slice(0, 2) };
assert.ok(r.csv.head[0].includes('Kategori,Insiden (jumlah),Insiden (%),Kerugian'));

// ===== Pivot 2 tingkat (TD14, TD15) =====
await page.goto(BASE + '/analitik'); await page.waitForTimeout(700);
assert.equal(await card().getByRole('button', { name: /^. Rincian:/ }).count(), 0, '› Rincian hanya bila Kolom terisi');
await menu('Baris', 'Wilayah SKK');
await menu('Kolom', 'Level');
await menu('› Rincian', 'KKKS');
r.td14 = {
  menus: await card().locator('.td-grp > .p-cap').allInnerTexts(),
  head: (await card().locator('.td-pv thead').innerText()).replace(/\s+/g, ' '),
  url: page.url().split('?')[1],
  note: await card().locator('.td-pvw + .p-cap').innerText(),
};
assert.deepEqual(r.td14.menus, ['Baris', '› Rincian', 'Kolom', 'Nilai']);
// subtotal grup = jumlah rinciannya (semua kolom, termasuk Total)
r.td14.sub = await card().locator('.td-pv tbody').evaluate((tb) => {
  const num = (t) => (t.trim() === '–' ? 0 : Number(t.trim()));
  const rows = [...tb.querySelectorAll('tr')];
  const out = [];
  rows.forEach((tr, i) => {
    if (!tr.classList.contains('grp')) return;
    const kids = [];
    for (let j = i + 1; j < rows.length && rows[j].classList.contains('ch'); j++) kids.push(rows[j]);
    const g = [...tr.querySelectorAll('td')].map((td) => num(td.innerText));
    const s = g.map((_, c) => kids.reduce((a, k) => a + num(k.querySelectorAll('td')[c].innerText), 0));
    out.push({ name: tr.querySelector('th').innerText.replace(/\n/g, ' '), open: kids.length > 0, ok: kids.length === 0 || g.every((x, c) => x === s[c]) });
  });
  return out;
});
assert.ok(r.td14.sub.length > 0 && r.td14.sub.every((x) => x.ok), 'subtotal = jumlah rincian');
assert.equal((await foot()).at(-1), await kpi(0), 'Total = Insiden terverifikasi');
await shot('TD14-Pivot2Tingkat');
// − / + dan Tutup semua / Buka semua
const g0 = card().locator('.td-pv tr.grp').first();
const chBefore = await card().locator('.td-pv tr.ch').count();
await g0.locator('button.tg').click(); await page.waitForTimeout(120);
r.td14.toggle = [chBefore, await card().locator('.td-pv tr.ch').count(), await g0.locator('button.tg').innerText()];
assert.ok(r.td14.toggle[1] < chBefore && r.td14.toggle[2] === '+');
await card().getByRole('button', { name: 'Tutup semua' }).click(); await page.waitForTimeout(120);
assert.equal(await card().locator('.td-pv tr.ch').count(), 0);
assert.ok((await card().locator('.td-pv tr.grp td.tot').allInnerTexts()).every((t) => t !== '–'), 'grup tertutup tetap menampilkan subtotal');
await card().getByRole('button', { name: 'Buka semua' }).click(); await page.waitForTimeout(120);
r.td14.allOpen = await card().locator('.td-pv tr.ch').count();
assert.ok(r.td14.allOpen >= chBefore);
// klik angka di baris rincian → popover → Lihat insiden: insiden yang benar
const ch = card().locator('.td-pv tr.ch').filter({ has: page.locator('td:not(.tot) button.cv') }).first();
const chName = (await ch.locator('th .nm span').first().innerText()).trim();
const grpName = await ch.evaluate((tr) => { let p = tr.previousElementSibling; while (p && !p.classList.contains('grp')) p = p.previousElementSibling; return p.querySelector('.nm > span').firstChild.textContent.trim(); });
const cellBtn = ch.locator('td:not(.tot) button.cv').first();
const cellN = Number(await cellBtn.innerText());
const colIx = await cellBtn.evaluate((b) => [...b.closest('tr').children].indexOf(b.closest('td')));
const colName = (await card().locator('.td-pv thead th').nth(colIx).innerText()).trim();
await cellBtn.click(); await page.waitForTimeout(150);
r.td14.pop = (await card().locator('.td-pop .ph').innerText()).replace(/\n/g, ' | ');
assert.ok(r.td14.pop.startsWith(grpName.replace('/​', '/') + ' › ' + chName.replace('/​', '/') + ' · ' + colName));
await shot('TD14-Aksi', 160);
await card().locator('.td-pop').getByRole('button', { name: /^Lihat \d+ insiden$/ }).click(); await page.waitForTimeout(250);
r.td14.list = { crumb: await card().locator('.td-crumb').innerText(), n: await card().locator('.td-lh b').innerText(), kk: await card().locator('.td-l tbody td:nth-child(3) b').allInnerTexts(), lv: await card().locator('.td-l tbody .td-sev').allInnerTexts() };
assert.equal(r.td14.list.n, cellN + ' insiden');
assert.ok(r.td14.list.kk.every((x) => x === chName) && r.td14.list.lv.every((x) => x === colName));
await card().getByRole('button', { name: '× Reset' }).click(); await page.waitForTimeout(200);
// sticky kolom nama saat tabel digulir ke samping (layar sempit)
await page.setViewportSize({ width: 900, height: 900 }); await page.waitForTimeout(300);
r.sticky = await card().locator('.td-pvw').evaluate((w) => {
  const th = w.querySelector('tbody th');
  const before = th.getBoundingClientRect().left;
  w.scrollLeft = 200;
  return { overflow: w.scrollWidth > w.clientWidth, before: Math.round(before), after: Math.round(th.getBoundingClientRect().left) };
});
assert.ok(r.sticky.overflow && r.sticky.before === r.sticky.after, 'kolom nama tetap saat digulir');
await page.setViewportSize({ width: 1366, height: 900 }); await page.waitForTimeout(300);
// TD15: Kategori › Triwulan × Wilayah SKK, nilai Kerugian
await page.goto(BASE + '/analitik?kolom=wil&rincian=tw&nilai=rp'); await page.waitForTimeout(800);
r.td15 = { head: (await card().locator('.td-pv thead').innerText()).replace(/\s+/g, ' '), tot: (await foot()).at(-1), kpi: await kpi(1) };
assert.equal(r.td15.tot, r.td15.kpi, 'Total Kerugian = KPI Kerugian');
await shot('TD15-Pivot2Kerugian');

// TD7 KKKS
await role('Pejabat Berwenang KKKS');
await page.goto(BASE + '/analitik'); await page.waitForTimeout(700);
r.td7 = { cap: await card().locator('.hd .p-cap').innerText(), foot: await foot(), kpi: [await kpi(0), await kpi(1), await kpi(2)] };
assert.deepEqual([r.td7.foot[0], r.td7.foot[2], r.td7.foot[3]], r.td7.kpi);
await card().getByRole('button', { name: /^Baris:/ }).click();
r.td7.dims = await card().getByRole('menuitemradio').allInnerTexts();
assert.deepEqual(r.td7.dims, ['Kategori', 'Wilayah kerja', 'Level', 'Triwulan', 'Bulan', 'Status penanganan']);
await card().getByRole('button', { name: /^Baris:/ }).click();
await shot('TD7-KKKS');
// TD8 daftar KKKS per WK
await page.goto(BASE + '/analitik?tabel=kat:Pencurian%252FPerampokan|wk:WK%2520Andalas%2520Darat&lihat=n'); await page.waitForTimeout(800);
r.td8 = { crumb: await card().locator('.td-crumb').innerText(), head: (await card().locator('.td-l thead').innerText()).replace(/\n/g, ' | '), c1: await card().locator('.td-l tbody td:nth-child(3) b').allInnerTexts() };
assert.ok(r.td8.c1.length > 0 && r.td8.c1.every((x) => x === 'WK Andalas Darat'));
await shot('TD8-KKKSDaftar');
// TD16 KKKS pivot 2 tingkat: Kategori › Wilayah kerja × Level
await page.goto(BASE + '/analitik?kolom=lv&rincian=wk'); await page.waitForTimeout(800);
r.td16 = { head: (await card().locator('.td-pv thead').innerText()).replace(/\s+/g, ' '), grp: await card().locator('.td-pv tr.grp th').allInnerTexts(), opts: [] };
for (const l of ['Baris', '› Rincian', 'Kolom']) { await card().getByRole('button', { name: new RegExp('^' + l.replace('›', '.') + ':') }).click(); r.td16.opts.push(...(await card().getByRole('menuitemradio').allInnerTexts())); await page.keyboard.press('Escape'); await page.waitForTimeout(80); }
assert.ok(!r.td16.opts.includes('KKKS') && !r.td16.opts.includes('Wilayah SKK'));
assert.equal((await foot()).at(-1), await kpi(0));
await shot('TD16-KKKSPivot2');

console.log(JSON.stringify(r, null, 1));
console.log('console errors:', errs.length ? errs : 'tidak ada');
assert.equal(errs.length, 0);
await b.close();
