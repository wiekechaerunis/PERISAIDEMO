# Deviasi dari desain

Hal yang tidak 1:1 dengan `design/*.dc.html`, atau ditambahkan prototype.

> Sejak 25 Nov dashboard ini berada di `perisai-insiden-demo` sebagai halaman `/analitik`. Poin 5 (role switcher), 9 (logo), dan 10 (placeholder) tidak berlaku lagi: peran dan Sidebar memakai milik aplikasi, dan tautan Daftar insiden menuju `/insiden` yang asli. Aturan global CSS desain (`a`, `.lk-grid > .p-card.cN`) dibatasi ke `.db-page`. Perubahan Iterasi 2 dan penyimpangannya dicatat di `CHANGELOG.md` di root repo.

1. **Kode dihasilkan skrip, bukan ditulis tangan.** `scripts/dc-to-tsx.mjs` mengubah template `.dc.html` menjadi JSX dan membawa `renderVals()` apa adanya. Akibatnya komponen menerima satu objek `v` (hasil rumus), bukan props bertipe, dan file logika memakai `@ts-nocheck`. Pilihan ini menjaga teks dan angka identik; refaktor ke props bertipe bisa dilakukan setelah desain stabil.
2. **Hook `useDashboard` adalah pembungkus.** Rumus tetap berada di `src/generated/DashboardLogic.ts` (kelas `DashboardLogic`, termasuk `alloc()`), dibungkus oleh `useDashboard.ts`. Belum dipecah menjadi fungsi-fungsi kecil.
3. **Konstanta data dipindah** ke `src/data/dashboard.ts` (SEN, LV, W, A0, DTT, CAT, MO, INC) tanpa perubahan nilai. Konstanta lain yang kecil dan terikat rumus (mis. jenis, label bulan di dalam rumus) tetap di dalam logika.
4. **Pembagian S1–S19:** MapStage (S8) dan MapStrip (S9–S11) dipecah dari IncidentMap; KkksBanner (S2) dan Footnote (S17) adalah komponen terpisah. Laporan (S19) berupa `Pdf1..5` statis.
5. **Role switcher "Prototype"** (kanan bawah) tidak ada di desain; ditambahkan untuk berpindah SKK/KKKS.
6. **Laporan `/laporan`** statis: angka di 5 halaman adalah markup desain, tidak mengikuti filter dashboard. CSS-nya dibungkus `.laporan-root` agar selektor global (`.top`, `table`, `th`, `td`) tidak mengubah dashboard. Tombol "Cetak / simpan PDF" ditambahkan di luar area cetak.
7. **Menu Unduh:** Laporan PDF membuka `/laporan` di tab baru; Data Excel mengunduh `public/contoh-unduhan.xlsx` (berkas contoh, bukan data hasil filter).
8. **Tutup dengan Esc** ditangani di `DashboardPage` (popover, menu); klik di luar tertangani logika desain.
9. **Logo:** `public/logo-perisai.png` bila ada, jika tidak teks "PERISAI".
10. **Halaman Daftar/Detail insiden** hanya placeholder; tautan ke `*.dc.html` dipetakan ke `/insiden` dan `/insiden/:id`.
11. **Tidak ada:** unit test, backend, pustaka grafik/peta. Peta memakai SVG di `public/peta`.

Belum diverifikasi: kecocokan piksel 1366px terhadap screenshot desain dan semua interaksi I1–I26 satu per satu (yang dicek: angka §13, rute, 5 halaman laporan, konsol bersih).
