# Deviasi dari desain

Selisih antara prototype dan desain Insiden v2 yang disengaja, beserta alasannya.

## Filter Periode kejadian (panel Filter daftar Insiden, `/insiden`)

Board yang dicek: `design-ref/project/Main-Filter.dc.html` dan `Main.dc.html`. Keduanya hanya menampilkan isian Periode
kejadian dalam keadaan tertutup, berisi "30 hari terakhir". Tidak ada board untuk dropdown terbuka, rentang khusus, atau
chip periode, jadi bagian itu mengikuti spek tugas.

| ID | Desain / spek | Prototype | Alasan |
|---|---|---|---|
| D-P1 | Board: isian menampilkan "30 hari terakhir" | Bawaan **Semua waktu** (teks `--ink-muted`, seperti "Semua WK"). "30 hari terakhir" tetap tersedia sebagai pilihan | Teks di board tampak seperti filter aktif padahal panel menulis "Belum ada filter". Bawaan Semua waktu membuat header, angka tombol, dan daftar konsisten |
| D-P2 | Tidak ada di board | "N hari terakhir" = hari ini mundur N hari s.d. hari ini, inklusif. 7 hari terakhir pada 28 Okt = 21–28 Okt, 30 hari terakhir = 28 Sep – 28 Okt | Mengikuti contoh di spek (caption "28 Sep – 28 Okt 2026", 7 hari = insiden 21–28 Okt). Konsekuensinya rentang berisi N+1 tanggal kalender |
| D-P3 | Spek: memilih di panel belum menerapkan | Hanya **periode** yang menunggu tombol Tampilkan. PIC, Status, Keparahan, Kategori, dan Lainnya tetap langsung berlaku seperti sebelumnya. Menutup panel lewat tombol Filter membuang pilihan periode yang belum diterapkan | Mengubah semua filter menjadi draf di luar cakupan tugas dan akan mengubah perilaku yang sudah diuji |
| D-P4 | Spek: galat menonaktifkan Tampilkan | Rentang khusus yang belum lengkap juga menonaktifkan tombol, dengan petunjuk netral "Pilih tanggal Dari dan Sampai.". Selama rentang belum lengkap atau tidak valid, tombol bertuliskan "Tampilkan insiden" tanpa angka | Tidak ada rentang yang bisa dihitung, jadi angka akan menyesatkan |
| D-P5 | Spek: galat "Tanggal tidak boleh melewati hari ini." | Kalender Dari/Sampai tidak memblokir tanggal setelah hari ini; tanggal itu bisa dipilih lalu langsung memunculkan galat | Supaya alasannya terlihat, bukan tanggal yang diam-diam tidak bisa diklik |
| D-P6 | Tidak ada di board | Daftar pilihan terbuka di dalam alur panel (mendorong isi di bawahnya), bukan melayang, dan digulir ke tampilan saat dibuka. Caption rentang tampil di kanan isian dan di bawah tiap pilihan | Panel Filter bisa digulir (`max-height`), jadi popover melayang akan terpotong |
| D-P7 | Spek: hitungan tab segmen ikut periode | Hitungan pintasan (Semua / Tinggi & Kritis / Dieskalasi ke saya / Belum diperiksa, dan pintasan peran lain) ikut periode. Hitungan tab halaman **Insiden n / Kerawanan n** tetap total dalam cakupan | Tab halaman menunjukkan isi modul. Mengikutkan periode hanya di satu tab akan membuat dua angka itu tidak sebanding |
| D-P8 | Board Kerawanan (K.1): tombol Filter statis | Tombol Filter di tab Kerawanan membuka panel berisi **Periode kejadian saja**, memakai URL yang sama dengan tab Insiden. Dasar waktunya adalah kolom "Waktu diketahui" yang tampil (overlay board) | Spek meminta periode berlaku juga di tab Kerawanan. Board tidak punya isi panel filter kerawanan |
| D-P9 | Spek: tambah 2–3 insiden Agustus–September 2026 dan 1 di 2025 | Ditambah **INS-SEN-2026-0001** (14 Jan 2026) dan **INS-SEN-2025-0098** (12 Agu 2025), keduanya Ditutup. Agustus–September diwakili INS-SEN-2026-0003 (20 Sep), yang sebelumnya tersembunyi oleh batas 30 hari | Nomor 2026 di atas 0010 menggeser "nomor insiden berikutnya" dari INS-SEN-2026-0011, yang tampil di board KD4 dan dipakai beberapa tes Kerawanan. Kategori Pencurian juga masuk ke panel Insiden serupa di layar review. Nomor dan judul kedua seed sesuai kasus yang sudah dikutip SimilarPanel. Store v8 menambahkan keduanya ke state yang sudah tersimpan |
| D-P10 | — | Daftar Insiden desktop tidak lagi memotong 30 hari secara diam-diam (`scopedIncidents`). Tugas saya, hitungan lonceng, dan daftar mobile tetap 30 hari (`visibleIncidents`) | Batas tersembunyi itulah yang membuat isian "30 hari terakhir" terlihat benar padahal tidak menyaring apa pun. Tes memastikan "30 hari terakhir" sama persis dengan isi daftar lama |
| D-P11 | Spek: "× dan Hapus filter" | Baris chip tetap memakai tautan "Hapus semua" yang sudah ada, sedangkan panel memakai "Hapus filter". Keduanya mengembalikan periode ke Semua waktu | Label baris chip tidak diubah |

## Sinkron INS-ADJ + Desain v2 (25 Nov 2026)

Acuan: `docs/insiden-sync/` (INS-ADJ butir Disepakati, audit PA/B, peta board). Board dibaca dari canvas Desain v2 versi
`1795587511-f048` lewat konektor artifact (hanya baca). Bila INS-ADJ dan board bertentangan, INS-ADJ dipakai.

| ID | Acuan | Prototype | Alasan |
|---|---|---|---|
| S-01 | Board V11-Daftar dan P11-DaftarPIC masih bersubjudul "Laporan insiden organisasi Anda" | Semua peran KKKS memakai "Insiden dan kerawanan keamanan di wilayah kerja." | PA-01 menyebut semua peran KKKS; board Main sudah memakai teks ini |
| S-02 | Board Main (menu baris Menunggu pemeriksaan) memuat "Lihat detail" + "Batalkan pengajuan" | Hanya "Batalkan pengajuan" | B-15 (keputusan 23–24 Nov): "Lihat detail" tidak dipakai karena klik baris membuka detail |
| S-03 | B-15 tidak memberi ⋯ pada draf bagi Pejabat | Draf bagi non-maker punya ⋯ berisi "Lihat draf" | **Konflik, INS-ADJ menang.** ADJ-18 kriteria: "menu ⋯ hanya berisi Lihat" |
| S-04 | ADJ-18: maker = role aktif Pelapor; prototype tidak punya Ganti role | Persona PIC (Andi, role aktif dianggap Pelapor) tetap maker; Pejabat dan Admin KKKS bukan maker (tanpa Buat laporan, tanpa Lanjutkan/Hapus draf) | Demo memakai satu persona per peran |
| S-05 | Main-Filter: PIC penanganan dropdown; daftar nama tidak ada di board | Dropdown pilih-banyak berisi Saya, Belum ada PIC, lalu nama PIC dan grup dari data mock | B-16 menyebut Saya dan Belum ada PIC paling atas |
| S-06 | Main-Filter: Kategori dan WK dropdown tertutup | Dropdown pilih-banyak (daftar ikut alur panel, sama dengan D-P6) | Board tidak punya state terbuka |
| S-07 | Main-Filter: Periode chip 7/30/90 hari, Tahun ini, Rentang tanggal | Chip itu menggantikan dropdown Periode (D-P1..D-P7 tetap berlaku untuk logika). Preset lama Bulan ini dan 3 bulan terakhir masih dibaca dari URL dan dipakai Dashboard, tetapi tidak ditawarkan di daftar | Menyesuaikan board; logika `period.ts` dipertahankan |
| S-08 | Board menu ⋯ mobile (M1x-AksiDraf, M1y-AksiMenunggu) | Daftar mobile belum memakai menu ⋯ | Fokus alur desktop; dicatat untuk iterasi berikut |

## Periode Dashboard insiden (tombol Periode di AppBar, `/analitik`)

Board `design/dashboard/Dashboard.dc.html` hanya punya tombol Periode statis "Semester I 2026". Atas masukan pengguna,
daftar pilihannya disamakan dengan filter Periode kejadian: Semua waktu, 7 hari terakhir, 30 hari terakhir, Bulan ini,
3 bulan terakhir, Tahun berjalan, Rentang khusus. Logika dashboard diubah lewat `PERIOD_PATCHES` di `scripts/dc-to-tsx.mjs`,
bukan dengan mengedit `src/generated/DashboardLogic.ts` langsung.

| ID | Desain / acuan | Prototype | Alasan |
|---|---|---|---|
| D-D1 | Jam demo aplikasi 28 Okt 2026 (`demoNow`) | "Hari ini" dashboard = **30 Jun 2026**, akhir data demo dashboard (Jan–Jun 2026). 7 hari = 23–30 Jun, 30 hari = 31 Mei – 30 Jun, Bulan ini = Jun, 3 bulan = 30 Mar – 30 Jun, Tahun berjalan = 1 Jan – 30 Jun | Dengan 28 Okt, empat preset tidak akan berisi data. Disetujui pengguna |
| D-D2 | Tombol berisi "Semester I 2026" | Bawaan **Semua waktu**. Semua waktu dan Tahun berjalan mencakup seluruh data, jadi angka dashboard sama persis dengan versi semester (dijaga tes); subjudul Semua waktu tetap "Semester I 2026" | Tidak mengubah tampilan bawaan yang sudah disetujui |
| D-D3 | Angka dashboard agregat per semester | **Jumlah insiden, jumlah per bulan, per jenis, per status, dan per level** dihitung tepat dari insiden (`INC`) lewat satu modul agregasi `src/analytics/incAgg.ts` (patch `scripts/dashboard-agg.mjs`), sama untuk semua periode. **Kerawanan** = rasio kerawanan/insiden desain per bulan × insiden bulan itu. **Kerugian per area dan DTT diskalakan** sesuai porsi insiden periode itu, dengan keterangan "perkiraan" di catatan kaki, matriks, dan tooltip | Data per tanggal untuk angka itu tidak ada. Pilihan "skala + label perkiraan" disetujui pengguna |
| D-D4 | Pembanding "vs Sem. I 2025" (periode yang sama tahun lalu) | Label ikut periode, termasuk Semua waktu ("vs 1 Jan–30 Jun 2025", "vs Jun 2025"; tidak ada lagi "Sem. I 2025" di kartu angka, Temuan AI, dan catatan Jenis terbanyak); selain periode penuh angka pembanding = angka Sem. I 2025 × porsi periode (perkiraan) | Data 2025 per tanggal tidak ada di data demo |
| D-D5 | Temuan AI dan ringkasan AI berisi kalimat kurasi semester (2,4×, 48%, 63%, "naik 15%") | Selain periode penuh, kalimat kurasi diganti kalimat yang dihitung (jumlah, kerugian perkiraan, lokasi level tertinggi, kerawanan pada periode). Daftar **Perlu tindakan** dan kartu "KKKS melapor (Jun 2026)" tidak ikut periode | Kalimat kurasi hanya benar untuk satu semester; Perlu tindakan menggambarkan keadaan saat ini |
| D-D6 | Tren per bulan dan Insiden vs kerawanan menampilkan 6 bulan | Hanya bulan yang tersentuh periode yang ditampilkan (7 hari terakhir = 1 batang Jun). Tanya data ikut dibatasi periode dan menyebutnya ("pada periode 1–15 Mei 2026"); bulan dari ketikan tetap tidak dipasang ke dashboard | Batang di luar periode akan terbaca sebagai 0 insiden |
| D-D7 | — | Preset langsung berlaku saat dipilih; Rentang khusus memakai tombol Terapkan, dengan galat yang sama seperti daftar Insiden. State di URL (`?periode=` / `?dari=&sampai=`), bertahan saat reload dan Back | Pola tombol Periode di AppBar: satu pilihan, tanpa panel filter |
| S-09 | Board I14 masih memuat "Diperiksa oleh" di kartu Pengajuan dan kotak "Yang terjadi saat Anda menekan Ajukan" | Keduanya hanya di modal Ajukan | B-13 dan B-14 (keputusan 23–24 Nov) lebih baru dari isi board |
| S-10 | Board I13d: dialog Hapus draf hanya berisi kalimat | Dialog memuat kalimat + Nomor, Judul, Lampiran | B-8 menyebut Nomor/Judul/Lampiran |
| S-11 | Board I14: Perkiraan kerugian "Masih dihitung · diperbarui selama penanganan" | "Belum diketahui" | B-11: "Ringkasan menulis Belum diketahui" |
| S-12 | Form WhatsApp (I20, I21) | Hanya stepper yang diselaraskan (B-2). Section langkah 1, Sumber informasi otomatis "Laporan pihak lain", dan "Belum diketahui" belum diterapkan di form WA | Form WA modul terpisah (INS-05) dengan draf sendiri; dicatat untuk iterasi berikut |
| S-13 | Mobile (M2a, M2, M7, M2u, M2ue, M4k) | Form mobile belum memakai B-1..B-13 | Fokus desktop |
| S-14 | Kerawanan (S16) | Simpan draf kerawanan tidak memberi nomor (kerawanan tidak punya status Draf di data mock) | Di luar cakupan alur Insiden |
| S-15 | B-9: lampiran yang diunggah sebelum Simpan draf dibuang bila keluar | Dibuang bersama semua perubahan lain (draf dikosongkan); bila draf sudah tersimpan, membukanya lagi memuat versi tersimpan | Prototype tidak memisahkan lampiran tersimpan dari yang baru |
| S-16 | I14m: catatan "Isi dan lampiran terkunci sampai diperiksa." | "…sampai diverifikasi." | B-14 menulis "terkunci sampai diverifikasi" |
| S-17 | I14m: 6 Pejabat Berwenang dengan jabatan; varian I14mg (grup) dan I14mi (individu) | Tiga Pejabat dari data mock (jabatan ditambah). Varian grup/individu tidak dibuat karena prototype belum punya halaman Persetujuan untuk mengatur pemeriksa | Mengikuti data mock yang ada |
| S-18 | I14ma: pelapor sekaligus pemeriksa | Persona Pelapor demo bukan Pejabat; state ini ditampilkan lewat `?pemeriksa=sendiri` | Satu persona per peran (S-04) |
| S-19 | Board S07: alasan maks. 300 karakter; toast gagal "Laporan sudah diputus pemeriksa…" | Maks. 500; toast "Laporan sudah diproses Pejabat Berwenang dan pengajuannya tidak bisa dibatalkan." | **Konflik, INS-ADJ menang** (ADJ-17) |
| S-20 | Board I15: kolom kanan Pelapor berisi kartu "Menunggu pemeriksaan" (Batas, Diperiksa oleh, PIC) | Kartu "Ringkasan" sesuai B-19 (memuat Batas pemeriksaan dan Diperiksa oleh) + kartu Lokasi | B-19 menyebut panel Ringkasan secara eksplisit |
| S-21 | Board P22: menu "Aksi lain" (Ganti PIC, Ubah tenggat, Eskalasi, Tandai terbatas) saat Minta ditutup | Tidak ada menu Aksi lain saat Menunggu penutupan | **Konflik, INS-ADJ menang** (ADJ-09) |
| S-22 | Riwayat penuh di tab Riwayat | Pada layar PIC entri Riwayat (termasuk eskalasi otomatis) hanya terlihat di tab Riwayat, tidak lagi di kolom Detail | B-18 |
| S-23 | Mobile (M8r, M11r, MP2, MV2) | Tab Detail \| Riwayat belum diterapkan di layar mobile | Fokus desktop |
| S-24 | PD1/PD2: label "sementara" juga di dashboard; notifikasi SKK, Pejabat, dan item Tugas saya "Konfirmasi penurunan level" | Dicatat di Riwayat dan ditampilkan sebagai kartu di Detail Pejabat; dashboard, notifikasi, dan Tugas saya tidak diubah | Dashboard di luar cakupan tugas ini; notifikasi belum dimodelkan di mock |
| S-25 | PD3: koreksi juga untuk korban, kondisi operasi, dan LPO | Prototype hanya mengoreksi Kerugian final | Cukup untuk menunjukkan aturan "tanpa buka kembali" |
| S-26 | ADJ-12: saklar fitur LPO (bawaan mati) dan saklar isi AI di Konfigurasi | Bagian LPO selalu tampil; AI pembaca dokumen berupa mock | Parameter saklar ada di ADJ-15 yang masih Usulan; PA-17 meminta bagian ini terlihat |
| S-27 | P34: panel Detail jejak audit memuat Sumber (IP, peramban), Id korelasi, dan tabel Perubahan nilai | Panel memuat pelaku, peran, modul, objek, dan isi catatan Riwayat | Data mock tidak menyimpan IP, korelasi, atau nilai per field; filter selain Objek belum dibuat |
| S-28 | ADJ-04 (tiga lapis), ADJ-05 (SKK checker lewat pengaturan), ADJ-06 (terapkan ke laporan berjalan) | Tidak dikerjakan | Prototype tidak punya halaman Persetujuan (WFL-01 v3). ADJ-05 bawaan sudah sesuai: SKK bukan approver kecuali `?persetujuan=skk` |
| S-29 | ADJ-16 FR-KIN-20..24: Tambah, Ganti nama, Nonaktifkan, Atur urutan | Halaman Kategori & jenis dan Penyebab & faktor pendukung baca saja | Fokus menunjukkan pemilik daftar dan sumbernya; pengelolaan menunggu board halaman Konfigurasi |
| S-30 | Board P22 menyimpan aturan [G] di ins.css: kartu "Butuh persetujuan Anda" sticky di kolom kanan | Tidak sticky | Permintaan pengguna 25 Nov: kartu di bawahnya (Info laporan, Lokasi, Kondisi sekitar) jadi tertutup saat menggulir |
| S-31 | Board P22/P24: header "Dalam penanganan" + "Minta ditutup" | P22: satu tag "Menunggu penutupan"; P24: "Ditutup" + "Tindak lanjut berjalan" sesuai board | Status Minta ditutup diganti Menunggu penutupan (B-16) |
| S-32 | Board P22/P24: kartu Tindak lanjut sederhana (judul, PIC · tanggal, status) | Memakai kartu Tindak lanjut bersama dari modul TL (TlCard), diberi sorotan saat "Lihat" | Komponen modul Tindak lanjut tidak diubah di tugas ini |
| S-33 | B-23 menulis urutan P22: Bahan pertimbangan → Data penutupan → Tindak lanjut → Isi laporan; P24: Data penutupan → Tindak lanjut → Isi laporan | Mengikuti board terbaru: Ringkasan → Isi laporan → Lampiran laporan awal → Hasil penanganan → Tindak lanjut | Permintaan 25 Nov: ikuti board P22/P24, bukan UI sebelumnya |
| S-34 | P22 "Perlu dicek": TL diperiksa PIC-nya sendiri | Hanya muncul bila data modul TL mencatat pemeriksa = PIC tindak lanjut; insiden demo P22 tidak punya kasus itu | Isi dari data mock, teks board hanya contoh |
| S-35 | Detail Dalam penanganan (Pejabat, SKK) | Kartu Lokasi dipindah tepat di bawah Tenggat penanganan | Permintaan pengguna 25 Nov |
| S-36 | P35: Hasil penanganan selalu tampil | Insiden Ditutup di seed kini diberi data penutupan demo dan lampiran awal (`seedDemoDetail.ts`, store v9) | Teks data demo, bukan dari board; data yang sudah ada tidak ditimpa |
| S-37 | P31/P33: Riwayat tampil di kolom utama Detail | Riwayat tetap di tab Riwayat (B-18); kolom utama: Isi laporan, Lampiran, Tindak lanjut | Konsisten dengan B-18 di semua layar Detail |
| S-38 | P31/P33: kanan = kartu arahan, Info laporan, lalu Lokasi | Lokasi tepat di bawah kartu arahan (yang memuat Tenggat), lalu Info laporan | Permintaan pengguna: Lokasi di bawah Tenggat (S-35) |
| S-39 | P31 untuk eskalasi otomatis karena lewat tenggat (PS1) | Kartu "Diminta arahan dari Anda" hanya saat PIC mengeskalasi ke SKK; PS1 tetap banner + Langkah berikutnya | P31 hanya menggambarkan eskalasi manual ke SKK |
| S-40 | Sidebar ciut tidak digambar di board Sidebar | Mode ciut memakai kelas DS `.p-sb.mini` (72 px, ikon, tip saat hover), wordmark jadi "P", kaki hak cipta disembunyikan | Permintaan pengguna (expand/collapse); status disimpan per peramban |

## Tabel insiden Dashboard (S16, `/analitik`, 26 Nov 2026) · versi pivot, sudah diganti

> Diganti kartu TabelDrill (bagian berikutnya). D-T1..D-T5 hanya catatan sejarah; pivot dan tesnya sudah dihapus.

Kartu "Kategori × wilayah" / "Kategori × wilayah kerja" diganti kartu "Tabel insiden" dari canvas Desain v2
(`project/Dashboard.dc.html`, `section.db-tb`, versi 1795661784-3e31; contoh dirinci di `Dashboard-Tabel.dc.html`).
`design/dashboard/Dashboard.dc.html` tidak diganti; markup, CSS, dan logika tabel dipasang lewat `scripts/dashboard-tabel.mjs`
(dipanggil `scripts/dc-to-tsx.mjs`). Matriks lama beserta logikanya dan patch periodenya dihapus.

| ID | Desain / acuan | Prototype | Alasan |
|---|---|---|---|
| D-T1 | Tabel memakai insiden dalam cakupan filter (`incS`) | Sama, termasuk Periode. Total tabel = KPI Insiden terverifikasi dan Kerugian (dijaga `src/features/dashboard/incidentTable.test.ts`, termasuk filter wilayah, KKKS, WK, level, kategori, periode). Bila "Hitung DTT" aktif, KPI ikut menghitung DTT sedangkan tabel tidak; caption menulis "DTT tidak termasuk" seperti di desain | DTT tidak punya baris insiden |
| D-T2 | Kerugian per insiden = kerugian area dibagi ke insidennya dengan bobot level (tetap) | Kerugian area **setelah filter** (angka yang sama dengan KPI Kerugian) dibagi **rata** ke insiden area itu dalam cakupan | Data mock belum punya kerugian per insiden. Bobot level membuat total berbeda dari KPI saat filter level aktif. PRODUKSI: nilai per insiden dari data layer |
| D-T3 | Tautan "Buka di daftar insiden →" | Teks tanpa "→"; panah datang dari `.lk-alink::after` | Di desain panahnya tampil dua kali |
| D-T4 | Menu Baris / Rincikan / Kolom hanya dibuka-tutup lewat tombol | Menu juga menutup dengan Escape atau saat fokus pindah ke luar | Tambahan kecil; tampilan tidak berubah |
| D-T5 | — | "Buka di daftar insiden" membuka `/insiden` tanpa filter | Daftar insiden belum membaca filter dari URL (sama dengan tautan dashboard lain) |

## Tabel insiden Dashboard · TabelDrill (S16, `/analitik`, 26 Nov 2026)

Kartu Tabel insiden kini tabel ringkasan + drill-down sesuai komponen `project/TabelDrill.dc.html` dan board TD0–TD8
(canvas Desain v2, versi 1795666495-d16d). Markup dan kelas `td-*` disalin ke
`src/features/dashboard/components/IncidentDrillTable.tsx` dan `src/styles/tabel-drill.css`; perilaku `renderVals()` diport
ke `src/analytics/tabelDrill.ts` (fungsi murni). Aturan korban ada di `src/analytics/casualties.ts`. Pivot sebelumnya
(state `tb`, prop `tabel`) dihapus dari generator (`scripts/dashboard-tabel.mjs`).

| ID | Desain / acuan | Prototype | Alasan |
|---|---|---|---|
| D-TD1 | `data()` demo: 147 insiden dengan angka sendiri | Insiden dalam cakupan filter halaman dari logika dashboard (`v.tdInc`, data `INC`), jadi baris Total = kartu Insiden terverifikasi, Kerugian, dan Tinggi & Kritis (dijaga `src/analytics/tabelDrill.test.ts`). Kerugian per insiden = kerugian area setelah filter dibagi rata ke insidennya. Sejak 26 Nov malam kartu angka, Tren per bulan, Insiden dan kerawanan, Jenis terbanyak, dan Status penanganan dihitung dari insiden yang sama lewat `aggInc` (D-TD13), jadi juga cocok dengan filter Kategori. Satu pengecualian: bila **Hitung DTT** aktif, kartu ikut menghitung DTT sedangkan tabel tidak | Kartu lain tidak boleh diubah; DTT tidak punya baris insiden |
| D-TD2 | Korban dari isian pelapor dan rincian PIC | Data `INC` dashboard belum punya korban. Ditambahkan di `src/data/dashboardIncidentMeta.ts`: 2 insiden Kritis dengan korban meninggal, 6 dengan luka (satu juga dengan korban meninggal; dua Ditutup dengan rincian PIC yang berbeda dari isian pelapor), 1 "Belum diketahui". Level tidak diubah. Detail insiden yang dibuat dari dashboard ikut memuat korban yang sama | Permintaan tugas |
| D-TD3 | Waktu kejadian = tanggal + jam | Data dashboard hanya punya tanggal; jam demo diturunkan tetap dari nomor insiden (`jamKejadian`) dan dipakai juga di Detail | Tidak ada jam di data desain |
| D-TD4 | Wilayah kerja (KKKS) baris kedua "Sumatera Selatan" | Nama area (kabupaten) dari data dashboard, mis. "Musi Banyuasin" | Data provinsi per WK tidak ada |
| D-TD5 | Toast "Contoh: CSV tampilan ini diunduh (…). Unduhan tercatat di jejak audit." | File CSV sungguhan (UTF-8, isi = tampilan saat ini; tingkat insiden = semua halaman), toast "CSV tampilan ini diunduh (…)." tanpa kalimat jejak audit | Prototype belum punya jejak audit unduhan |
| D-TD6 | "Saring halaman" hanya toast | Filter halaman benar-benar dipasang (chip Filter aktif, semua kartu ikut): Kategori, Wilayah SKK, KKKS, Wilayah kerja (zoom ke WK), Level (hanya level itu), Bulan (Periode = rentang bulan itu). Untuk **Status penanganan** butir ini tidak ditampilkan | Bar filter dashboard tidak punya filter status |
| D-TD7 | Tautan "Buka di daftar insiden →" | Teks tanpa "→" (panah dari `.lk-alink::after`); tautan membawa filter jejak + syarat kolom (`/insiden?kategori=…&wilayah=…&korban=meninggal`). Daftar insiden belum membaca parameter ini | Daftar insiden di luar cakupan tugas |
| D-TD8 | Popover hanya ditutup tombol × | Juga Escape dan klik di luar | Tambahan kecil |
| D-TD9 | Kategori Illegal tapping/drilling (TD0 gap #3) | Mengikuti kategori kartu lain | Sesuai catatan TD0 |
| D-TD10 | Pivot (TD9–TD20) memakai `data()` demo | Sama dengan D-TD1: insiden dalam cakupan filter halaman; baris dan kolom Total = kartu angka | — |
| D-TD11 | Menu "Kelompokkan menurut" (TD1–TD8) | Diganti susunan chip Baris · Kolom · Nilai dengan "+ Tambah" (TD17–TD20, desain 26 Nov malam). Kontrol "› Rincian" versi sebelumnya dan param URL `rincian`/`kelompok` dihapus; URL baru `baris`, `kolom`, `nilai`, `lipat` | Desain berubah |
| D-TD12 | "Saring halaman" pivot hanya toast | Filter dipasang untuk semua tingkat baris dan semua kolom sel itu sekaligus (WK menimpa Wilayah, Bulan menimpa Triwulan; Triwulan = Periode 1 Jan–31 Mar atau 1 Apr–30 Jun). Status penanganan dilewati karena tidak punya filter halaman; butir disembunyikan bila semua langkahnya Status | Bar filter dashboard tidak punya filter status |
| D-TD13 | Kartu Tren per bulan, Insiden dan kerawanan, Jenis terbanyak memakai angka desain (diskalakan); kartu angka dengan filter Kategori memakai alokasi matriks | Semua kartu dan Tabel insiden dihitung dari insiden yang sama lewat `aggInc`. Catatan kurasi tren ("Mei: insiden naik 24%…") diganti catatan yang dihitung. Sebaran bulan KKKS disamakan dengan desain (3, 4, 3, 5, 5, 4) dengan memindah **bulan kejadian** 4 insiden di seed (`MONTH_MOVES` di `src/data/dashboardExtra.ts`: INS-SEN-2026-0003 21 Jan → 3 Feb, 0013 10 Mei → 10 Feb, 0023 24 Jun → 14 Apr, 0024 25 Jun → 21 Apr). SKK nasional kini 32, 22, 21, 24, 25, 23 (desain 22, 14, 15, 17, 21, 17 untuk 106 insiden; prototype 147 insiden) | Masukan 26 Nov: angka per bulan harus satu sumber |
| D-TD14 | Catatan kaki "Insiden (%) = porsi … Hanya insiden terverifikasi; draf tidak dihitung. Meninggal dan Luka = jumlah orang, dari laporan pelapor … Angka demo." | Tetap versi singkat yang diminta sebelumnya: "Insiden (%) = porsi dari {n} insiden di tampilan ini. Meninggal/Luka = jumlah orang · {k} insiden korban belum diketahui" | Keputusan pengguna 26 Nov (catatan kaki dipersingkat) |
| D-TD15 | Tabel ringkasan `table-layout: fixed` dengan colgroup persen | Lebar kolom otomatis (`td-sum`), kolom nama min. 220 px untuk jorok 28 px per tingkat; layar sempit bergeser di dalam kartu | Perbaikan sebelumnya: judul kolom tidak terlipat dan bar tidak menabrak |
| D-TD16 | CSS `.td-pv thead th:first-child` (sticky, min-width 240 px) | Ditambah `.td-pv thead tr.h2 th:first-child{position:static;min-width:0}`: di header 2 tingkat aturan desain ikut mengenai sel pertama baris kedua (Kritis), sehingga kolom itu 240 px dan menempel | Bug CSS desain di TD19 |
| D-TD17 | TD0 bagian Pivot: "Kolom hanya Bulan, Level, Status, Wilayah SKK" | Mengikuti `renderVals()` dan TD0 aturan 2 terbaru: Kolom = Wilayah SKK (SKK), Kategori, Level, Triwulan, Bulan, Status penanganan | Bagian Pivot di TD0 belum diperbarui |
