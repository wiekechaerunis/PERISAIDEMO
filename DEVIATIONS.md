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
| D-D3 | Angka dashboard agregat per semester | **Jumlah insiden** per periode dihitung tepat dari tanggal lapor tiap insiden (data per insiden cocok 1:1 dengan level per area dan pola bulanan). **Kerugian, jenis terbanyak, matriks kategori × wilayah, kerawanan, dan DTT diskalakan** sesuai porsi insiden periode itu, dengan keterangan "perkiraan" di catatan kaki, matriks, dan tooltip | Data per tanggal untuk angka itu tidak ada. Pilihan "skala + label perkiraan" disetujui pengguna |
| D-D4 | Pembanding "vs Sem. II 2025" | Selain periode penuh: "vs periode sebelumnya, perkiraan (n)" = angka pembanding semester × porsi periode | Data periode pembanding yang sebenarnya tidak ada |
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
