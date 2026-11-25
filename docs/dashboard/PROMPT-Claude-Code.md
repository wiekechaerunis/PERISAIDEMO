# Prompt untuk Claude Code

Salin seluruh blok di bawah ke Claude Code, dari root folder paket ini (folder yang berisi `docs/`, `design/`, `public/`, `data/`).

---

```
Kamu membangun PROTOTYPE klik-able "Dashboard insiden" PERISAI. Hasilnya harus sama 1:1 dengan desain, tetapi kodenya cukup sederhana: tidak perlu backend, unit test, atau arsitektur berat.

## Baca dulu (urut)
1. docs/PRD-Prototype-Dashboard-Insiden.md: lingkup, rute, peran, PETA BAGIAN → DESAIN → KODE (§6a, S1–S19 dengan nomor baris di Dashboard.dc.html), tabel interaksi (§10, tiap interaksi merujuk ke bagian S-nya), kriteria terima (§13). Tautan canvas di PRD untuk manusia (perlu login); kamu cukup memakai nomor baris dan file di design/.
2. design/Dashboard.dc.html: SUMBER KEBENARAN. Isinya markup, CSS (<helmet><style>), state (constructor), dan semua rumus (renderVals). Baca sampai habis.
3. design/Sidebar.dc.html: sidebar yang di-import dashboard.
4. design/Dashboard-PDF1..5.dc.html: 5 halaman laporan PDF.
5. design/css/*.css: CSS design system. Pakai apa adanya, jangan diubah.

Tabel "Cara membaca .dc.html → React" ada di PRD §3. Template `{{x}}`, `<sc-for>`, `<sc-if>`, dan `onClick="{{fn}}"` adalah bahasa template canvas desain. Terjemahkan ke JSX.

## Stack
- Vite + React + TypeScript, React Router.
- CSS biasa. Import berurutan: design/css/tokens.css → bundle.css → lk.css → ins.css → src/styles/dashboard.css (isi <helmet><style> dari Dashboard.dc.html, disalin tanpa diubah).
- JANGAN pakai Tailwind, shadcn, library chart, atau library peta. Grafik di desain berupa div/CSS; peta berupa SVG + div yang di-transform.
- Salin public/peta/*.svg ke public/peta/ dan data/contoh-unduhan.xlsx ke public/.

## Aturan 1:1
- Pertahankan semua className, inline style, struktur elemen, dan teks persis seperti di .dc.html. Jangan mendesain ulang, jangan mengganti kata.
- Pindahkan logika renderVals() ke src/features/dashboard/useDashboard.ts dengan perilaku IDENTIK. Konstanta data (W, A0, DTT, CAT, INC, LV, MO, angka demo) dipindah ke src/data/ tanpa mengubah nilai. Pertahankan fungsi alloc() (largest remainder).
- Pecah UI jadi komponen per bagian S1–S19 di PRD §6a (AppBar, FilterBar, ActiveFilters, KpiRow, AiFindings, ActionList, IncidentMap, MapStrip, TopCategories, IncidentVsRisk, TrendChart, HandlingStatus, CategoryMatrix, Sidebar, ReportPages). Beri komentar `// S<n>` di tiap komponen. Struktur DOM di dalamnya tetap sama dengan desain.
- Props .dc.html (peran, zoom, dtt, menuUnduh, statusTerbuka) menjadi query string di "/" (lihat PRD §5).
- Kalau ada yang tidak bisa 1:1, tulis di DEVIATIONS.md (apa, kenapa, dampak). Jangan diam-diam.

## Yang dibangun
- "/": Dashboard, peran SKK (default) dan KKKS. Ditambah role switcher kecil berlabel "Prototype" di pojok kanan bawah.
- Semua interaksi di PRD §10 (I1–I26), termasuk animasi zoom peta (transform .45s cubic-bezier(.2,.7,.2,1)) dan lapisan detail peta per tingkat zoom (PRD §9).
- Popover Level dan menu Unduh tertutup saat klik di luar atau tekan Esc.
- "/laporan": 5 halaman A4 (794×1123) dari Dashboard-PDF1..5 berurutan, CSS @page A4, plus tombol "Cetak / simpan PDF" (window.print, disembunyikan saat cetak).
- Menu Unduh → "Data Excel" mengunduh /contoh-unduhan.xlsx.
- "/insiden" dan "/insiden/:id": placeholder sederhana (judul + tombol kembali).
- Logo sidebar: public/logo-perisai.png kalau ada; kalau tidak, wordmark teks "PERISAI".

## Selesai bila
- npm run build lolos dan console bersih.
- Semua angka di PRD §13 cocok (mis. SKK nasional: 106 insiden, Rp1,41 M, 16 Tinggi & Kritis, status 14/8/84, lewat tenggat 4).
- Semua kondisi di PRD §11 bisa dicapai lewat klik.
- Di lebar 1366 px tampilan sama dengan desain. Kalau ada design/screenshots/, bandingkan berdampingan (ambil screenshot prototype dengan Playwright di 1366 px) dan perbaiki selisihnya.

## Cara kerja
1. Tulis rencana singkat: daftar komponen, file, dan urutan kerja. Langsung lanjut tanpa menunggu konfirmasi.
2. Bangun bertahap: scaffold → CSS & layout kosong → data & useDashboard → section demi section dari atas → peta → interaksi → /laporan.
3. Setelah tiap section, cocokkan teks dan angka dengan .dc.html.
4. Akhiri dengan README.md (cara run: npm i && npm run dev), DEVIATIONS.md, dan ringkasan yang sudah dan belum dibuat.
```
