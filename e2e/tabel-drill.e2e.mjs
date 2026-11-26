// e2e kartu "Tabel insiden" (TabelDrill, board TD1–TD20 Desain v2, 26 Nov malam). Jalankan dev server dulu:
// npx vite --port 5200, lalu node e2e/tabel-drill.e2e.mjs. Memakai playwright-core + Chrome terpasang. Env: E2E_URL, CHROME_PATH.
// Screenshot 1366 px ke screenshots/tabel-drill/ (nama file = board). Termasuk susunan Baris · Kolom · Nilai (TD9–TD20).
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
/** chip "Baris 1", "Kolom 2", "Nilai 1" → pilih isi menu */
const chip = async (label, opt) => { await card().getByRole('button', { name: new RegExp('^' + label + ':') }).click(); await card().getByRole('menuitemradio', { name: opt, exact: true }).click(); await page.waitForTimeout(150); };
const add = async (grp, opt) => { await card().getByRole('button', { name: 'Tambah dimensi ke ' + grp }).click(); await card().getByRole('menuitem', { name: opt, exact: true }).click(); await page.waitForTimeout(200); };
const foot = () => card().locator('tfoot td').allInnerTexts();
const kpi = (i) => page.locator('.k-val').nth(i).innerText();
const qs = () => decodeURIComponent(page.url().split('?')[1] ?? '');
/** subtotal baris induk = jumlah anak langsung di semua kolom angka (kedalaman dari padding 28 px per tingkat) */
const subtotalOk = () => card().locator('table.td-t tbody').evaluate((tb) => {
  const num = (t) => (t.trim() === '–' ? 0 : Number(t.trim().replace('%', '')));
  const rows = [...tb.querySelectorAll('tr')].map((tr) => ({ tr, d: Math.round(parseFloat(tr.querySelector('.pvn').style.paddingLeft) / 28) }));
  const bad = [];
  let n = 0;
  rows.forEach(({ tr, d }, i) => {
    if (!tr.classList.contains('grp') || tr.querySelector('.tg').innerText !== '−') return;
    const kids = [];
    for (let j = i + 1; j < rows.length && rows[j].d > d; j++) if (rows[j].d === d + 1) kids.push(rows[j].tr);
    const tds = [...tr.querySelectorAll('td')];
    tds.forEach((td, c) => {
      const t = td.innerText.trim();
      if (/Rp|%/.test(t) || /Rp|%/.test(kids[0]?.querySelectorAll('td')[c].innerText ?? '')) return;
      const s = kids.reduce((a, k) => a + num(k.querySelectorAll('td')[c].innerText), 0);
      if (s !== num(t)) bad.push(tr.querySelector('th').innerText + ' kolom ' + c + ': ' + t + ' ≠ ' + s);
    });
    n++;
  });
  return { groups: n, bad };
});
const r = {};

await page.goto(BASE + '/analitik'); await page.waitForTimeout(700);
await role('Pengawas SKK');
assert.equal(await page.locator('.db-tb').count(), 0, 'pivot lama sudah hilang');

// TD1 ringkasan: Baris [Kategori] [+ Tambah] · Kolom [+ Tambah]
r.td1 = { cap: await card().locator('.hd .p-cap').innerText(), ctl: (await card().locator('.td-ctl').innerText()).replace(/\s+/g, ' '), head: (await card().locator('thead').innerText()).replace(/\n/g, ' | '), foot: await foot() };
assert.equal(r.td1.ctl, 'Baris Kategori + Tambah Kolom + Tambah');
assert.doesNotMatch(await card().innerText(), /Rincian|Kelompokkan/, 'tidak ada teks Rincian / Kelompokkan menurut');
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
r.td4 = { crumb: await card().locator('.td-crumb').innerText(), url: qs(), rows: await card().locator('tbody th').allInnerTexts() };
assert.match(r.td4.crumb, /Semua insiden\s*›\s*Kategori: Pencurian\/Perampokan/);
await shot('TD4-PerWilayah');
// TD5 daftar insiden
await cell('Sumbagsel', 0).click(); await page.waitForTimeout(150);
await card().locator('.td-pop').getByRole('button', { name: /^Lihat \d+ insiden$/ }).click(); await page.waitForTimeout(200);
r.td5 = { crumb: await card().locator('.td-crumb').innerText(), lh: await card().locator('.td-lh').innerText(), rows: await card().locator('.td-l tbody tr').count(), pg: await card().locator('.td-pg .p-cap').innerText(), url: qs() };
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

// TD6 korban: klik angka Meninggal di baris → Lihat insiden
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

// chip Baris → Level: urutan alami
await chip('Baris 1', 'Level');
r.lvRows = await card().locator('tbody th').allInnerTexts();
await chip('Baris 1', 'Kategori');

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

// ===== Susunan Baris · Kolom · Nilai =====
await page.goto(BASE + '/analitik'); await page.waitForTimeout(700);
// TD17: menu + Tambah Baris
await card().getByRole('button', { name: 'Tambah dimensi ke Baris' }).click(); await page.waitForTimeout(120);
r.td17 = (await card().locator('.td-menu').innerText()).split('\n');
assert.equal(r.td17[0].toLowerCase(), 'rincikan baris menurut');
await shot('TD17-TambahBaris', 260);
await card().getByRole('menuitem', { name: 'Wilayah SKK', exact: true }).click(); await page.waitForTimeout(200);
// TD18: Kategori › Wilayah SKK tanpa kolom: subtotal 7 ukuran
r.td18 = { ctl: (await card().locator('.td-ctl').innerText()).replace(/\s+/g, ' '), url: qs(), head: await card().locator('thead th').first().innerText(), sub: await subtotalOk() };
assert.match(r.td18.ctl, /^Baris Kategori × › Wilayah SKK × \+ Tambah Kolom \+ Tambah Buka semua · Lipat semua$/);
assert.equal(r.td18.url, 'baris=kat,wil');
assert.ok(r.td18.sub.groups > 3 && r.td18.sub.bad.length === 0, 'subtotal = jumlah rincian: ' + r.td18.sub.bad.join('; '));
// lipat satu grup lalu Buka semua
const chAll = await card().locator('tbody tr.ch').count();
await card().locator('tbody tr.grp').first().locator('button.tg').click(); await page.waitForTimeout(120);
r.td18.fold = [chAll, await card().locator('tbody tr.ch').count(), qs()];
assert.ok(r.td18.fold[1] < chAll && /lipat=Pencurian\/Perampokan/.test(r.td18.fold[2]));
await card().getByRole('button', { name: 'Buka semua' }).click(); await page.waitForTimeout(120);
assert.equal(await card().locator('tbody tr.ch').count(), chAll);
// tampilan board TD18: hanya grup pertama terbuka
await card().getByRole('button', { name: 'Lipat semua' }).click(); await page.waitForTimeout(120);
assert.equal(await card().locator('tbody tr.ch').count(), 0);
await card().locator('tbody tr.grp').first().locator('button.tg').click(); await page.waitForTimeout(120);
await shot('TD18-BarisBertingkat');
await card().getByRole('button', { name: 'Buka semua' }).click(); await page.waitForTimeout(120);
// 3 tingkat: + Tambah → KKKS, tombol + Tambah Baris hilang
await add('Baris', 'KKKS');
assert.equal(await card().getByRole('button', { name: 'Tambah dimensi ke Baris' }).count(), 0, 'maks. 3 baris');
// TD20: × Triwulan
await card().getByRole('button', { name: 'Tambah dimensi ke Kolom' }).click(); await page.waitForTimeout(100);
r.td20 = { addH: (await card().locator('.td-menu .mh').innerText()) };
await card().getByRole('menuitem', { name: 'Triwulan', exact: true }).click(); await page.waitForTimeout(250);
Object.assign(r.td20, { url: qs(), ctl: (await card().locator('.td-ctl').innerText()).replace(/\s+/g, ' '), sub: await subtotalOk(), tot: (await foot()).at(-1) });
assert.equal(r.td20.addH.toLowerCase(), 'jadikan kolom');
assert.equal(r.td20.url, 'baris=kat,wil,kkks&kolom=tw');
assert.ok(r.td20.sub.groups > 5 && r.td20.sub.bad.length === 0, 'subtotal 3 tingkat: ' + r.td20.sub.bad.join('; '));
assert.equal(r.td20.tot, await kpi(0));
await shot('TD20-Baris3Tingkat');
// × pada chip: susunan kembali (Kategori × Triwulan)
await card().getByRole('button', { name: 'Hapus KKKS dari Baris' }).click(); await page.waitForTimeout(120);
await card().getByRole('button', { name: 'Hapus Wilayah SKK dari Baris' }).click(); await page.waitForTimeout(120);
assert.equal(qs(), 'kolom=tw');
assert.equal(await card().getByRole('button', { name: /^Hapus Kategori dari Baris/ }).count(), 0, 'chip Baris terakhir tidak bisa dihapus');
// TD19: Kolom + Tambah → Level → header 2 tingkat
await card().getByRole('button', { name: 'Tambah dimensi ke Kolom' }).click(); await page.waitForTimeout(100);
r.td19 = { addH: await card().locator('.td-menu .mh').innerText() };
await card().getByRole('menuitem', { name: 'Level', exact: true }).click(); await page.waitForTimeout(250);
Object.assign(r.td19, {
  url: qs(), h1: await card().locator('.td-pv thead tr.h1 th').allInnerTexts(), h2: await card().locator('.td-pv thead tr.h2 th').count(),
  sumOk: await card().locator('.td-pv tbody').evaluate((tb) => [...tb.querySelectorAll('tr')].every((tr) => { const n = [...tr.querySelectorAll('td')].map((td) => (td.innerText.trim() === '–' ? 0 : Number(td.innerText))); return n.at(-1) === n.slice(0, -1).reduce((a, x) => a + x, 0); })),
});
assert.equal(r.td19.addH.toLowerCase(), 'pecah kolom menurut');
assert.equal(r.td19.url, 'kolom=tw,lv');
assert.deepEqual(r.td19.h1.map((t) => t.replace(/\s+/g, ' ').trim()).slice(1), ['TW I', 'TW II', 'Total']);
assert.equal(r.td19.h2, 10);
assert.ok(r.td19.sumOk, 'jumlah sel per baris = Total');
assert.equal(await card().getByRole('button', { name: 'Tambah dimensi ke Kolom' }).count(), 0, 'maks. 2 kolom');
await shot('TD19-Kolom2Tingkat');
// sticky kolom nama saat tabel digulir ke samping
await page.setViewportSize({ width: 900, height: 900 }); await page.waitForTimeout(300);
r.sticky = await card().locator('.td-pvw').evaluate((w) => {
  const th = w.querySelector('tbody th');
  const before = th.getBoundingClientRect().left;
  w.scrollLeft = 200;
  return { overflow: w.scrollWidth > w.clientWidth, before: Math.round(before), after: Math.round(th.getBoundingClientRect().left) };
});
assert.ok(r.sticky.overflow && r.sticky.before === r.sticky.after, 'kolom nama tetap saat digulir');
await page.setViewportSize({ width: 1366, height: 900 }); await page.waitForTimeout(300);
// reload mempertahankan susunan
await page.reload(); await page.waitForTimeout(800);
assert.equal(await card().locator('.td-pv thead tr.h2 th').count(), 10, 'reload mempertahankan Kolom 2 tingkat');

// TD9: Kategori × Bulan; total per bulan = Tren per bulan
await page.goto(BASE + '/analitik?kolom=bln'); await page.waitForTimeout(800);
r.td9 = { foot: (await foot()).slice(0, -1), trend: await page.locator('.db-bars .db-col .v').allInnerTexts() };
assert.deepEqual(r.td9.foot, r.td9.trend, 'total per bulan di tabel = Tren per bulan');
await shot('TD9-PivotKategoriBulan');
// TD10: menu chip Kolom
await card().getByRole('button', { name: /^Kolom 1:/ }).click(); await page.waitForTimeout(100);
r.td10 = await card().getByRole('menuitemradio').allInnerTexts();
await shot('TD10-PivotMenuKolom', 200);
await page.keyboard.press('Escape');
// TD11: popover sel pivot
await cell('Pencurian/Perampokan', 3).click(); await page.waitForTimeout(150);
r.td11 = (await card().locator('.td-pop .ph b').innerText());
assert.equal(r.td11, 'Pencurian/Perampokan · Apr 2026');
await shot('TD11-PivotAksi', 200);
await page.keyboard.press('Escape');

// TD14: Wilayah SKK › KKKS × Level; klik sel anak → Lihat insiden → breadcrumb memuat semua filter → Back
await page.goto(BASE + '/analitik?baris=wil,kkks&kolom=lv'); await page.waitForTimeout(800);
r.td14 = { sub: await subtotalOk(), tot: (await foot()).at(-1) };
assert.ok(r.td14.sub.groups > 0 && r.td14.sub.bad.length === 0);
assert.equal(r.td14.tot, await kpi(0), 'Total = Insiden terverifikasi');
await shot('TD14-Pivot2Tingkat');
const ch = card().locator('.td-pv tr.ch').filter({ has: page.locator('td:not(.tot) button.cv') }).first();
const chName = (await ch.locator('th .nm span').first().evaluate((s) => s.firstChild.textContent)).replace('\u200b', '').trim();
const grpName = await ch.evaluate((tr) => { let p = tr.previousElementSibling; while (p && !p.classList.contains('grp')) p = p.previousElementSibling; return p.querySelector('.nm > span').firstChild.textContent.replace('\u200b', '').trim(); });
const cellBtn = ch.locator('td:not(.tot) button.cv').first();
const cellN = Number(await cellBtn.innerText());
const colIx = await cellBtn.evaluate((x) => [...x.closest('tr').children].indexOf(x.closest('td')));
const colName = (await card().locator('.td-pv thead th').nth(colIx).innerText()).trim();
const urlPivot = page.url();
await cellBtn.click(); await page.waitForTimeout(150);
r.td14.pop = (await card().locator('.td-pop .ph').innerText()).replace(/\n/g, ' | ');
assert.ok(r.td14.pop.startsWith(grpName + ' › ' + chName + ' · ' + colName));
await shot('TD14-Aksi', 160);
await card().locator('.td-pop').getByRole('button', { name: /^Lihat \d+ insiden$/ }).click(); await page.waitForTimeout(250);
r.td14.list = { crumb: (await card().locator('.td-crumb').innerText()).replace(/\s+/g, ' '), n: await card().locator('.td-lh b').innerText() };
assert.equal(r.td14.list.n, cellN + ' insiden');
assert.ok(r.td14.list.crumb.includes(`Wilayah SKK: ${grpName} › KKKS: ${chName} › Level: ${colName}`), r.td14.list.crumb);
await page.goBack(); await page.waitForTimeout(500);
assert.equal(page.url(), urlPivot, 'Back kembali ke pivot yang sama');
assert.ok(await card().locator('.td-pv').count() === 1);

// TD15: Kategori › Triwulan × Wilayah SKK, nilai Kerugian
await page.goto(BASE + '/analitik?baris=kat,tw&kolom=wil&nilai=rp'); await page.waitForTimeout(800);
r.td15 = { tot: (await foot()).at(-1), kpi: await kpi(1), nilai: await card().getByRole('button', { name: /^Nilai 1:/ }).innerText() };
assert.equal(r.td15.tot, r.td15.kpi, 'Total Kerugian = KPI Kerugian');
await shot('TD15-Pivot2Kerugian');

// TD7 KKKS
await role('Pejabat Berwenang KKKS');
await page.goto(BASE + '/analitik'); await page.waitForTimeout(700);
r.td7 = { cap: await card().locator('.hd .p-cap').innerText(), foot: await foot(), kpi: [await kpi(0), await kpi(1), await kpi(2)] };
assert.deepEqual([r.td7.foot[0], r.td7.foot[2], r.td7.foot[3]], r.td7.kpi);
await card().getByRole('button', { name: /^Baris 1:/ }).click();
r.td7.dims = await card().getByRole('menuitemradio').allInnerTexts();
assert.deepEqual(r.td7.dims, ['Kategori', 'Wilayah kerja', 'Level', 'Triwulan', 'Bulan', 'Status penanganan']);
await card().getByRole('button', { name: /^Baris 1:/ }).click();
await shot('TD7-KKKS');
// KKKS: total per bulan = Tren per bulan (3, 4, 3, 5, 5, 4)
await page.goto(BASE + '/analitik?kolom=bln'); await page.waitForTimeout(800);
r.kkBln = { foot: (await foot()).slice(0, -1), trend: await page.locator('.db-bars .db-col .v').allInnerTexts() };
assert.deepEqual(r.kkBln.foot, r.kkBln.trend);
assert.deepEqual(r.kkBln.trend, ['3', '4', '3', '5', '5', '4']);
// TD8 daftar KKKS per WK
await page.goto(BASE + '/analitik?tabel=kat:Pencurian%252FPerampokan|wk:WK%2520Andalas%2520Darat&lihat=n'); await page.waitForTimeout(800);
r.td8 = { crumb: await card().locator('.td-crumb').innerText(), head: (await card().locator('.td-l thead').innerText()).replace(/\n/g, ' | '), c1: await card().locator('.td-l tbody td:nth-child(3) b').allInnerTexts() };
assert.ok(r.td8.c1.length > 0 && r.td8.c1.every((x) => x === 'WK Andalas Darat'));
await shot('TD8-KKKSDaftar');
// TD16 KKKS: Kategori › Wilayah kerja × Level
await page.goto(BASE + '/analitik?baris=kat,wk&kolom=lv'); await page.waitForTimeout(800);
r.td16 = { sub: await subtotalOk(), opts: [] };
for (const l of ['Baris 1', 'Baris 2', 'Kolom 1']) { await card().getByRole('button', { name: new RegExp('^' + l + ':') }).click(); r.td16.opts.push(...(await card().getByRole('menuitemradio').allInnerTexts())); await page.keyboard.press('Escape'); await page.waitForTimeout(80); }
assert.ok(!r.td16.opts.includes('KKKS') && !r.td16.opts.includes('Wilayah SKK'));
assert.ok(r.td16.sub.bad.length === 0);
assert.equal((await foot()).at(-1), await kpi(0));
await shot('TD16-KKKSPivot2');

console.log(JSON.stringify(r, null, 1));
console.log('console errors:', errs.length ? errs : 'tidak ada');
assert.equal(errs.length, 0);
await b.close();
