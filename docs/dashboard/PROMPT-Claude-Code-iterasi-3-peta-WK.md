# Prompt Claude Code · Iterasi 3 · Peta wilayah SKK, cakupan WK, dan fasilitas

Jalankan sesudah iterasi 2. Pakai zip terbaru `prototype-dashboard-insiden.zip`: `design/Dashboard.dc.html` dan `public/peta/` sudah diperbarui.

---

```
Lanjutkan prototype Dashboard insiden PERISAI (rute analitik). Iterasi ini mengubah ISI PETA supaya terasa sebagai peta operasi hulu migas, bukan peta Indonesia. Tetap prototype: tanpa library peta, semua lapisan berupa SVG statis + CSS mask.

Sumber kebenaran: design/Dashboard.dc.html versi baru di zip. Cari perubahan dengan kata kunci regs, wkm, SITES, WKX, lay, layers, showWkLine, showAreas, admOp, db-msk, db-laypop. Port perubahan itu dengan perilaku identik, lalu gabungkan dengan fitur iterasi 2 yang sudah ada (panel kanan, hover, zoom dengan scroll, animasi). Catat di CHANGELOG.md dengan label "Iterasi 3 · disetujui PM 25 Nov".

== 1. Aset ==
Ganti seluruh public/peta/ dengan isi zip baru (68 file):
- id-land.svg: daratan Indonesia tanpa garis provinsi (pengganti id-prov.svg di tingkat nasional).
- reg-<wilayah>.svg (6 file): bentuk tiap wilayah SKK, dipakai sebagai MASK.
- reg-lines.svg: garis putih pemisah antarwilayah.
- wk-<id>.svg: cakupan tiap WK (gabungan kecamatan terpilih), dipakai sebagai MASK. Ada 12 WK dengan insiden dan 6 WK tanpa insiden (wk-x-*).
- wkl-<id>.svg: garis putus-putus batas luar WK, untuk tingkat WK.
- wka-<id>.svg: area buatan sendiri (kotak fasilitas, jalur pipa, anjungan lepas pantai), untuk tingkat WK.
- z-*.svg dan l-*.svg: batas administrasi yang dibuat lebih samar (tanpa label kabupaten di tingkat wilayah, tanpa label kecamatan di tingkat WK).

== 2. Lapisan per tingkat zoom (urutan di dalam stage, bawah → atas) ==
Nasional:
  id-land.svg → 6 bidang wilayah (span .db-msk, mask-image = reg-<w>.svg, background:
  - color-mix(level tertinggi wilayah, 16%) kalau ada insiden;
  - rgba(142,146,157,.10) kalau 0 insiden tapi ada laporan;
  - arsir repeating-linear-gradient kalau belum ada laporan (Pamalu))
  → reg-lines.svg → area panas → pill wilayah.
Wilayah:
  detail z-<w>.svg (opacity mengikuti lapisan "Batas administrasi") → bidang WK (.db-msk, mask wk-<id>.svg):
  - WK dengan insiden: warna level tertinggi 18%;
  - WK tanpa insiden: abu 12%;
  - WK lain milik KKKS lain (WKX) hanya untuk SKK
  → area panas + label WK.
WK (dulu "titik"):
  detail l-<id>.svg → bidang WK terpilih (level 12%) dan WK lain samar (5%) → wkl-<id>.svg → wka-<id>.svg → di ruang layar: chip lokasi aset (ikon + nama) dan titik insiden.
Semua .db-msk: position absolute, inset 0, pointer-events none, mask-size 100% 100%, no-repeat. Pakai juga prefix -webkit-mask-*.

== 3. Tombol "Lapisan" ==
Tombol ikon di kontrol peta, membuka popover dengan 3 checkbox (default semua menyala):
- Wilayah kerja: bidang WK dan garis WK.
- Fasilitas & jalur pipa: wka-<id>.svg dan chip lokasi aset.
- Batas administrasi: z-*/l-*.svg (opacity 0/1, transisi .2s).
Klik di luar atau Esc menutup popover.

== 4. Teks ==
- Breadcrumb tingkat terdalam: "WK Andalas Darat · Musi Banyuasin" (nama WK di depan; KKKS hanya nama WK).
- Petunjuk peta: nasional "Klik area panas atau nama wilayah untuk zoom"; wilayah "Klik WK untuk melihat titik insiden". Perbaiki teks lama yang menyebut "provinsi".
- Keterangan peta (mapCap) per tingkat: salin dari .dc.html.
- Nama lokasi aset: "Sumur <KODE>-07", "Stasiun pengumpul <KODE>", "Jalur pipa <KODE> km 12", "Anjungan lepas pantai <KODE>" (KODE = ADR untuk WK Andalas Darat). Posisinya dari konstanta SITES.

== 5. Penyesuaian dengan iterasi 2 ==
- Tingkat nasional: panel kanan otomatis tersembunyi (tombol "Ringkasan" tetap ada). Bidang wilayah + pill sudah membawa informasinya. Panel muncul otomatis saat zoom ke wilayah.
- Ukuran area panas di tingkat nasional ×1,5 dari sekarang.
- Hover area panas di tingkat wilayah → bidang WK yang sama naik ke 30% (transisi .2s), selain kartu hover dan sorotan baris panel yang sudah ada.
- Zoom ke WK memusatkan WK di area peta yang tidak tertutup panel (aturan iterasi 2 tetap berlaku).

== Selesai bila ==
- Nasional: Sumatra bagian utara oranye muda, bagian selatan merah muda, Jawa barat oranye, Jawa timur hijau, Kalimantan–Sulawesi abu muda, Maluku–Papua berarsir. Tidak ada garis provinsi.
- Sumbagsel: 4 WK berwarna + 2 WK abu tanpa label, garis kabupaten samar, tanpa label kabupaten.
- WK Andalas Darat: garis putus-putus batas WK, 2 kotak fasilitas biru, jalur pipa hijau melengkung, 3 chip lokasi, 15 titik.
- WK Bengawan Hilir (Gresik): ada anjungan lepas pantai di laut.
- Mematikan tiap lapisan langsung menyembunyikan isinya.
- npm run build lolos dan console bersih. Screenshot Playwright 1366×900 untuk keempat kondisi di atas disimpan di screenshots/iterasi-3/ dan dicek sendiri sebelum lapor.

Catatan produksi (tulis di README, jangan dibangun): di produk, bentuk WK dan area diambil dari modul Wilayah kerja ("Pilih wilayah" + "Buat area sendiri"). Bentuk wilayah SKK diambil dari pemetaan provinsi → wilayah yang dikonfirmasi SKK.
```
