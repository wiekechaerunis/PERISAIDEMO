# Changelog

## 25 Nov 2026 · Tanya data di Temuan AI

- Kolom "Tanya data" bisa diketik: saran saat fokus (↑/↓, Enter), "Dipahami sebagai" dengan chip yang bisa dihapus (debounce 250 ms), "Menghitung..." 500 ms, lalu jawaban di popover. Intent: saring, peringkat, banding, lokasi, tindakan; hasil 0, tidak dikenali, dan pembatasan peran KKKS.
- Jawaban dihitung dari data demo dengan aturan saring yang sama seperti dashboard (`src/ask/`); "Terapkan ke dashboard" memasang filter di bar filter, "Sorot di Tren" menyorot bulan, lokasi membuka peta. Bukan AI (dicatat di docs/dashboard/DEVIATIONS.md).
- Tes: 20 unit `parseQuery`, 10 unit `answer` (jumlah sama dengan kartu dashboard), e2e `node e2e/tanya-data.e2e.mjs`, screenshot di `screenshots/tanya-data/`.

## 25 Nov 2026 · Masukan PM setelah Iterasi 3

- Tampilan nasional kembali ke gaya lama: provinsi putih bergaris abu tipis di atas laut, tanpa bidang wilayah berwarna dan tanpa garis antarwilayah. Keterangan peta nasional ikut kembali ("Area panas di lokasi insiden. ..."). Hover provinsi menyorot tipis seluruh wilayah SKK-nya, chip wilayah tetap hanya saat hover.
- Tingkat wilayah dan WK tetap memakai lapisan Iterasi 3 (cakupan WK, batas WK, fasilitas, tombol Lapisan).
- Tombol periode ("Semester I 2026") bisa dibuka: Semester, Kuartal, Tahun. Data demo hanya Semester I 2026, jadi periode lain tampil tapi belum bisa dipilih ("Data demo hanya Semester I 2026").
- Klik titik insiden di peta atau baris insiden di panel membuka halaman Detail insiden aplikasi (`/insiden/<ID>`). Insiden dashboard yang belum ada di data aplikasi dibuat sekali dari data dashboard (ID, judul, kategori, level, status, tanggal, lokasi, WK, KKKS) dengan isi detail lain dipinjam dari insiden contoh berstatus sama (`src/features/dashboard/openIncident.ts`). Pelapor, PIC, dan kondisi operasi pada insiden buatan ini adalah isi contoh.

## 25 Nov 2026 · Iterasi 3 · disetujui PM 25 Nov

Peta wilayah SKK, cakupan WK, dan fasilitas. Desain dan `public/peta/` (68 file) dari zip terbaru.

- Lapisan nasional: `id-land.svg` (tanpa garis provinsi) → 6 bidang wilayah SKK (`.db-msk` + mask `reg-<w>.svg`; level tertinggi 16%, abu 10% bila 0 insiden, arsir bila belum ada laporan) → `reg-lines.svg` → area panas.
- Lapisan wilayah: `z-<w>.svg` (opacity ikut lapisan Batas administrasi) → bidang WK (mask `wk-<id>.svg`; level 18%, abu untuk WK tanpa insiden dan WK lain milik KKKS lain, khusus SKK) → area panas + label WK.
- Lapisan WK: `l-<id>.svg` → bidang WK terpilih 12%, WK lain 5% → `wkl-<id>.svg` (garis putus-putus) → `wka-<id>.svg` (fasilitas, jalur pipa, anjungan lepas pantai) → chip lokasi aset dengan ikon dan titik insiden.
- Tombol "Lapisan" di kontrol peta: Wilayah kerja, Fasilitas & jalur pipa, Batas administrasi (default menyala); tutup dengan klik di luar atau Esc.
- Teks: breadcrumb "WK Andalas Darat · Musi Banyuasin", petunjuk "Klik WK untuk melihat titik insiden", keterangan peta per tingkat, nama lokasi aset dari konstanta SITES.
- Penyesuaian iterasi 2: panel ringkasan tersembunyi di nasional dan muncul otomatis saat zoom ke wilayah/WK; area panas nasional 1,5×; hover area panas di tingkat wilayah menaikkan bidang WK yang sama ke 30%.
- Perbaikan: kartu hover yang terbuka sebelum zoom tidak lagi tertinggal di tingkat berikutnya.

**Menyimpang dari prompt Iterasi 3**
- Perilaku iterasi 2b dipertahankan: chip wilayah hanya muncul saat hover, dan provinsi tetap bisa di-hover/diklik. Provinsi kini jadi area klik tak terlihat (tanpa garis provinsi); hover menyorot bidang wilayah SKK-nya.
- Kontrol peta ada di kiri (aturan iterasi 2), jadi popover Lapisan membuka ke kanan, bukan ke kiri seperti di desain.

## 25 Nov 2026 · Iterasi 2b (masukan PM)

- Peta nasional: 38 provinsi bisa di-hover dan diklik (path dari `id-prov.svg`, data di `src/data/provinsi.ts`, dibuat oleh `scripts/build-provinsi.mjs`). Hover menyorot provinsi dan wilayah SKK-nya, kartu menampilkan nama provinsi, wilayah, dan jumlah insiden di provinsi itu. Klik atau scroll naik = zoom ke wilayah SKK provinsi tersebut, termasuk Kalsul dan Pamalu (memakai peta dasar karena belum ada peta detail).
- Chip wilayah ("Jabanusa 3 insiden") hanya muncul saat wilayahnya di-hover (provinsi, area panas, atau baris panel).
- Dropdown filter Wilayah, KKKS, dan Kategori (KKKS: Wilayah kerja, Kategori) bisa dibuka; memilih opsi mengubah seluruh halaman. Filter KKKS baru: menyaring area dan insiden ke KKKS itu, muncul di Filter aktif, ikut terhapus di "Hapus semua". Tutup dengan klik di luar atau Esc.
- Hint peta lebih halus (latar terang, teks abu-abu), teks: "Klik provinsi atau area panas untuk zoom".
- Catatan kaki dipersingkat.
- ASUMSI: Sumatera Barat dan Kepulauan Riau masuk wilayah Sumbagut (konfirmasi PM).

## 25 Nov 2026 · Analitik diganti Dashboard insiden

- Halaman `/analitik` sekarang memakai Dashboard insiden dari `design/dashboard/Dashboard.dc.html` (PRD di `docs/dashboard/`). Halaman lain (Insiden, Tindak lanjut, WhatsApp, Konfigurasi) tidak berubah.
- Peran SKK/KKKS dashboard mengikuti peran demo aplikasi (menu akun di Sidebar). Sidebar memakai Sidebar aplikasi.
- Rute baru `/laporan`: Laporan PDF 5 halaman A4 dari menu Unduh.
- Kode dashboard digenerate oleh `scripts/dc-to-tsx.mjs` (`node scripts/dc-to-tsx.mjs`). File hasil: `src/generated/`, `src/data/dashboard.ts`, `src/features/dashboard/components/*` (kecuali IncidentMap, MapStage, MapPanel), `src/features/laporan/Pdf*.tsx`, `src/styles/dashboard.css`, `src/styles/laporan.css`.
- Halaman Analitik lama beserta tesnya (`analitik.test.tsx`, 8 tes) dihapus. `logic/analitik.ts` dan `analitik.css` dibiarkan, tidak dipakai lagi.

## Iterasi 2 · disetujui PM 25 Nov

**A. Zoom titik (sinkron desain terbaru)**
- A1–A3: titik insiden digambar di lapisan layar di atas peta, bulatan 12px dengan bayangan, dikelompokkan di 3 lokasi aset berlabel (Sumur ADR-07, Stasiun pengumpul ADR, Jalur pipa ADR km 12).
- A4: peta dasar `id-prov.svg` memudar (opacity 0, .3s) di luar tingkat nasional.
- A5: label area hanya di tingkat wilayah.

**B. Bug tata letak**
- B1: menu sidebar tanpa garis bawah.
- B2: pill wilayah digeser setelah render supaya ≥ 8px dari tepi peta dan tidak tertutup panel.
- B3: legenda menjadi tombol "Legenda" di kiri bawah; kartu legenda isinya sama, tertutup bawaan, tutup dengan klik di luar atau Esc.
- B4: label area diurutkan dari insiden terbanyak; label yang bertabrakan (lebar = jumlah karakter × 6,6px) dilewati. Nama area tetap ada di kartu hover.

**C. Peta seperti fitur WK**
- C1: tinggi peta 560px; stage 1000×400 di-fit "contain", sisa ruang berwarna laut.
- C2: panel ringkasan melayang di kanan (360px), menggantikan strip di bawah peta: nasional = per wilayah, wilayah = ringkasan + area, titik = ringkasan + insiden. Tombol "Sembunyikan panel"; saat tersembunyi muncul tombol "Ringkasan". Rumus zoom memakai lebar peta − 376px saat panel terbuka. Kontrol zoom (−, rumah, +) di kiri atas.
- C3: kartu hover untuk area panas, pill, dan titik (120ms). Area yang di-hover membesar 1,08×. Baris panel ikut tersorot, dan hover baris panel memberi ring 2px pada area di peta.
- C4: scroll naik = masuk ke wilayah/area di bawah kursor, scroll turun = naik satu tingkat (debounce 250ms, halaman tidak ikut bergulir). Klik-tahan lalu geser, dibatasi 20%. Double-click = scroll naik. Tombol + = zoom ke area dengan insiden terbanyak.

**D. Gerak**
- D1: `useAnimatedNumber` / `AnimNum` (400ms ease-out) di kartu angka utama, panel ringkasan, Temuan AI, status penanganan, insiden & kerawanan.
- D2: lebar/tinggi bar bertransisi .35s.
- D3: panel, Temuan AI, daftar status, dan matriks fade + geser 4px (150ms) saat isi berganti.
- D4: area panas muncul fade + scale .85→1 (200ms, bertahap 20ms) setiap tingkat zoom berubah.
- D5: kartu yang angkanya berubah mendapat kilatan outline 2px `--action` 600ms.
- D6: `prefers-reduced-motion` mematikan semua animasi di atas.

**E. Hover dan klik**
- E1: bar tren: tooltip bulan, jumlah, kerugian, perubahan dari bulan sebelumnya; klik → `/insiden?bulan=<n>`.
- E2: baris jenis insiden: tooltip jumlah, porsi, kerugian, Semester II 2025.
- E3: bar insiden & kerawanan: tooltip bulan, insiden, kerawanan, naik jadi insiden.
- E4: kartu angka utama bisa diklik → `/insiden` dengan query filter (mis. `level=tinggi,kritis&status=terbuka`).
- E5: satu komponen tooltip (`TipLayer`, atribut `data-tip`): latar `--ink`, 12px, 120ms, menempel ke elemen, tidak keluar layar.

**Menyimpang dari prompt Iterasi 2**
- Lokasi: dikerjakan di `perisai-insiden-demo` (halaman Analitik), bukan di prototype terpisah (localhost:5199), atas permintaan PM.
- E2 "kerugian" per jenis tidak ada di data desain; ditampilkan sebagai "Kerugian (perkiraan)" = kerugian total × porsi jenis.
- E3 "naik jadi insiden" per bulan dihitung dengan rasio desain (8,3% SKK, 9% KKKS) karena desain hanya punya totalnya.
- E1/E4: Daftar insiden belum membaca query `bulan`, `level`, `status`, `kkks`, `urut`, `wilayah`; tautan sudah membawa query-nya.
- C2 di tingkat nasional: peta ikut mengecil ke lebar peta − 376px (Indonesia ~70% lebar) supaya Pamalu tidak tertutup panel.
- C4 batas geser: 20% dari kotak peta yang terlihat, bukan dari kotak area.
- Titik di Musi Banyuasin (15) mengikuti rumus `pts` desain; sebagian saling tumpuk di 3 lokasi aset.
- Screenshot diambil dengan `playwright-core` + Chrome terpasang (bukan paket `@playwright/test`), di `screenshots/iterasi-2/`.
