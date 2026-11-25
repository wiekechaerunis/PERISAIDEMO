# Changelog

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
