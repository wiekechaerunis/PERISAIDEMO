# Prompt Claude Code · Iterasi 2 Dashboard insiden (supaya tidak kaku)

Salin blok di bawah ke Claude Code, di repo prototype yang sudah berjalan (localhost:5199).

---

```
Lanjutkan prototype Dashboard insiden PERISAI. Iterasi ini fokus membuat dashboard terasa hidup dan petanya terasa seperti peta di fitur Wilayah Kerja. Tetap prototype: jangan tambah backend/test, jangan tambah library berat. Boleh pakai framer-motion kalau benar-benar perlu; utamakan CSS transition.

Beberapa perubahan di bawah BELUM ada di design/Dashboard.dc.html. Spesifikasi di prompt ini yang berlaku untuk bagian-bagian tersebut. Catat setiap perubahan di CHANGELOG.md dengan label "Iterasi 2 · disetujui PM 25 Nov".

====================================================
A. Sinkron dengan desain terbaru (wajib dulu)
====================================================
Ganti design/Dashboard.dc.html dengan versi baru dari zip terbaru, lalu port perubahan "zoom titik" (bagian S8 di PRD):
1. Titik insiden TIDAK lagi di dalam .db-stage (yang di-scale). Titik digambar di lapisan layar di atas peta. Posisi dihitung dari koordinat peta:
   left = (x − x0)·k/10 %, top = (y − y0)·k/4 %, dengan x0 = cx − 500/k, y0 = cy − 200/k.
2. Titik berupa bulatan 12px, box-shadow 0 0 0 2px var(--surface), 0 1px 3px rgba(28,29,33,.35).
3. Titik dikelompokkan di 3 lokasi aset dengan label chip (.db-site): "Sumur <KODE>-07", "Stasiun pengumpul <KODE>", "Jalur pipa <KODE> km 12". Pakai kode ADR untuk Musi Banyuasin. Ikuti logika `pts` dan `sites` di renderVals.
4. Peta dasar (peta/id-prov.svg) opacity 0 saat tidak di tingkat nasional, dengan transisi opacity .3s. Ini menghilangkan garis pantai tebal saat zoom.
5. Label area di dalam stage hanya tampil di tingkat wilayah, tidak di tingkat titik.

====================================================
B. Perbaiki bug tata letak
====================================================
B1. Menu sidebar bergaris bawah. Di desain tidak bergaris bawah: #nav-utama a.nv, a.nv:hover, a.nv span { text-decoration: none }.
B2. Pill wilayah terpotong di tepi peta (Sumbagut). Setelah render, clamp posisi pill supaya seluruh pill berada ≥ 8px dari tepi kontainer peta.
B3. Legenda menutupi pill dan label. Legenda jadi tombol kecil "Legenda" (kiri bawah peta) yang membuka kartu legenda yang sama persis isinya. Default tertutup. Klik di luar atau Esc menutup.
B4. Label area bertabrakan di zoom wilayah. Urutkan label dari area dengan insiden terbanyak. Lewati label yang kotaknya bertabrakan dengan label yang sudah tampil (estimasi lebar = jumlah karakter × 6,6px pada 12px, atau measureText). Label yang dilewati tetap muncul di kartu hover (C3).

====================================================
C. Peta seperti fitur WK
====================================================
C1. Tinggi peta 560px pada lebar konten ≥ 1078px. Rasio peta tetap: stage 1000×400 di-fit dengan "contain", sisa ruang diisi warna laut yang sama.
C2. Panel ringkasan melayang di kanan peta, menggantikan strip di bawah peta (bagian S9–S11):
    - Posisi top/right/bottom 16px, lebar 360px, latar var(--surface), radius var(--radius-xl), shadow var(--shadow-overlay). Isi bisa di-scroll.
    - Isinya sama dengan strip lama sesuai tingkat:
      · nasional: daftar per wilayah dengan kasus + kerugian + porsi + level tertinggi + KKKS melapor, dalam baris yang ringkas;
      · wilayah: ringkasan + daftar area;
      · titik: ringkasan + daftar insiden.
    - Tombol "Sembunyikan panel" (ikon) di kepala panel. Saat tersembunyi, muncul tombol kecil "Ringkasan" di kanan atas peta.
    - Saat panel terbuka, area pas zoom = lebar peta − 376px. Hitung ulang k, tx, ty memakai lebar itu, supaya area yang di-zoom tidak tertutup panel.
    - Kontrol zoom (−, rumah, +) pindah ke kiri atas peta.
C3. Kartu hover. Hover area panas, pill, atau titik memunculkan kartu kecil di dekat kursor (bukan title bawaan browser), muncul setelah 120ms:
    - area: nama area · WK · KKKS, jumlah insiden, level tertinggi (tag warna), kerugian, "Klik untuk zoom";
    - titik: ID, judul, level, status, lokasi aset.
    Area panas yang di-hover membesar 1,08× (transition .15s). Baris yang sama di panel ikut tersorot (background var(--surface-sunken)), dan sebaliknya: hover baris panel menyorot area di peta dengan ring 2px var(--ink).
C4. Zoom dengan scroll dan geser:
    - Scroll ke atas di atas sebuah wilayah (nasional) → zoom ke wilayah itu.
    - Scroll ke atas di atas sebuah area (tingkat wilayah) → zoom ke titik area itu.
    - Scroll ke bawah → naik satu tingkat (sama dengan tombol −).
    - Debounce 250ms supaya satu gerakan scroll = satu langkah. Halaman tidak ikut scroll saat kursor di atas peta.
    - Klik-tahan lalu geser → menggeser peta di tingkat yang sama, dibatasi supaya tidak keluar lebih dari 20% dari kotak area. Lepas → tetap di posisi itu. Double-click → sama dengan scroll ke atas.
    - Tombol + di kontrol zoom = zoom ke area dengan insiden terbanyak di tingkat sekarang.
    - Tetap pakai preset tingkat (nasional/wilayah/titik) dan transisi .45s cubic-bezier(.2,.7,.2,1). Tidak perlu zoom kontinu bebas.

====================================================
D. Gerak (supaya perubahan terasa)
====================================================
D1. Angka di kartu angka utama, panel ringkasan, Temuan AI, dan status penanganan beranimasi dari nilai lama ke nilai baru dalam 400ms (ease-out). Format tetap sama selama animasi (Rp…, %, "hari"). Buat hook useAnimatedNumber.
D2. Lebar/tinggi semua bar (tren, jenis, insiden & kerawanan, status, panel) transition .35s ease.
D3. Isi yang berganti (panel ringkasan, daftar status, Temuan AI, matriks yang tersaring) fade + geser 4px dalam 150ms.
D4. Area panas muncul dengan fade + scale dari 0.85 ke 1 selama 200ms, bertahap 20ms per area, setiap kali tingkat zoom berubah.
D5. Kartu yang angkanya berubah karena filter atau zoom diberi kilatan halus sekali: outline 2px var(--action) yang memudar dalam 600ms.
D6. Hormati prefers-reduced-motion: semua animasi di atas dimatikan, perubahan langsung.

====================================================
E. Hover dan klik yang masih kosong
====================================================
E1. Bar tren per bulan: tooltip berisi bulan, jumlah, kerugian, dan perubahan dari bulan sebelumnya. Klik → /insiden?bulan=<n>.
E2. Baris jenis insiden: tooltip berisi jumlah, porsi, kerugian, dan Semester II 2025.
E3. Bar insiden & kerawanan: tooltip berisi bulan, insiden, kerawanan, dan yang naik jadi insiden.
E4. Seluruh kartu angka utama bisa diklik (cursor pointer, hover border var(--border-control)) → /insiden dengan query filter yang sesuai (mis. level=tinggi,kritis untuk kartu Tinggi & Kritis).
E5. Semua tooltip memakai satu komponen Tooltip: latar var(--ink), teks var(--surface), 12px, radius var(--radius-sm), muncul setelah 120ms, mengikuti posisi elemen (bukan kursor), dan tidak keluar dari layar.

====================================================
Selesai bila
====================================================
- Semua angka di PRD §13 tetap cocok.
- Bug B1–B4 tidak terlihat di lebar 1366px pada tingkat nasional, Sumbagsel, dan Musi Banyuasin.
- Alur nasional → Sumbagsel → Musi Banyuasin → kembali bisa dilakukan hanya dengan scroll mouse di atas peta, dan panel kanan selalu sesuai tingkatnya.
- Mengubah filter level, kategori, atau DTT menghasilkan animasi angka dan bar, bukan lompatan.
- prefers-reduced-motion mematikan animasi.
- npm run build lolos dan console bersih.
- Ambil screenshot Playwright di 1366×900 untuk: nasional, Sumbagsel, Musi Banyuasin, hover area, legenda terbuka, panel tersembunyi. Simpan di screenshots/iterasi-2/ dan cek sendiri sebelum lapor.

Laporkan di akhir: yang selesai, yang menyimpang dari prompt ini, dan alasannya.
```
