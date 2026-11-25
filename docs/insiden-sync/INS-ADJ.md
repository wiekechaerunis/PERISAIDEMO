# INS-ADJ Adjustment Insiden pasca-serah ke dev

Status: Draft · dibuka 23 Nov 2026 · Mino

Sumber: PRD INS-01 s.d. INS-07, KIN-01, HAK-02 versi yang diserahkan ke dev (task ClickUp) · keputusan Mino 23 Nov 2026 (belum di Decision Log) · MoM Weekly W3

## Cara pakai dokumen ini

- PRD Insiden yang sudah diserahkan ke dev **tidak diubah lagi**. Setiap perubahan setelah serah terima ditulis di sini sebagai satu butir ADJ-nn.
- Tiap butir menunjuk FR atau tabel asli dan menulis **Sebelum** dan **Sesudah**, kriteria penerimaan, serta dampaknya ke backend, UI, dan prototype.
- Dev membaca PRD asli ditambah butir berstatus **Disepakati**. Butir **Usulan** belum boleh dikerjakan.
- Butir baru dari hasil test dan pengecekan ditambahkan di bawah dengan nomor berikutnya. Nomor tidak dipakai ulang.
- Status butir:
  - **Usulan**: belum diputuskan.
  - **Disepakati**: sudah diputuskan PM dan boleh dikerjakan.
  - **Diserahkan**: sudah dikabarkan ke dev.
  - **Selesai**: sudah dikerjakan dan lolos uji.
  - **Dibatalkan**: tidak jadi dikerjakan.

## Indeks butir

| ID | PRD asli | Rujukan | Jenis | Ringkasan | Status | Sumber |
| --- | --- | --- | --- | --- | --- | --- |
| ADJ-01 | INS-02 | Tabel M-1, baris "Pengaju boleh memutus sendiri" | Ubah | Pengaju boleh memeriksa laporannya sendiri; diberi peringatan, tidak diblokir | Disepakati | Keputusan Mino 23 Nov |
| ADJ-02 | INS-03 | Tabel M-2, baris "Pengaju boleh memutus sendiri" | Ubah | PIC boleh menyetujui penutupan sendiri; diberi peringatan, tidak diblokir | Disepakati | Keputusan Mino 23 Nov |
| ADJ-03 | INS-03 | 4.x Penutupan (FR baru FR-INS-56c) | Tambah | Peringatan bila pemeriksa insiden juga menyetujui penutupannya | Disepakati | Keputusan Mino 23 Nov |
| ADJ-04 | INS-02, INS-03 | Paragraf "Titik persetujuan bisa dikonfigurasi" | Ubah | Nilai awal tiga lapis maker, checker, approver; role tiap lapis bisa diubah | Disepakati | Keputusan Mino 23 Nov; MoM W3 |
| ADJ-05 | INS-03 | P-10, FR-INS-56a, FR-INS-56b | Ubah | SKK bukan approver penutupan secara bawaan, cukup notifikasi; bisa dijadikan checker lewat pengaturan | Disepakati (perlu DL + Tech Lead) | Keputusan Mino 23 Nov |
| ADJ-06 | INS-02, INS-03 | Semua titik persetujuan insiden | Ubah | Perubahan alur bisa diterapkan ke laporan yang sedang berjalan (pilihan saat menyimpan) | Disepakati | Keputusan Mino 23 Nov; WFL-01 v3 |
| ADJ-07 | INS-01, INS-02, INS-03 | Isian dampak, Pemeriksaan, Penanganan, Penutupan | Tambah | Dampak (kerugian, korban, operasi terganggu) bisa diperbarui sepanjang penanganan; keparahan naik langsung berlaku, turun perlu konfirmasi; koreksi setelah ditutup tanpa buka kembali | Disepakati | Keputusan Mino 23 Nov; MoM W3 (kerugian menyusul) |
| ADJ-08 | KIN-01 | Matriks keparahan, baris Definisi sumbu korban (FR-KIN-16) | Ubah | Sumbu korban di matriks keparahan bisa diatur Admin SKK, tidak lagi terkunci | Disepakati (nilai awal menunggu K-2) | Keputusan Mino 23 Nov |
| ADJ-09 | INS-03 | Status Menunggu ditutup, penilaian tenggat; INS-06 aturan tombol Tambah tindak lanjut (semula hanya saat Dalam penanganan) | Ubah | Menunggu penutupan: hanya Setujui, Kembalikan ke PIC, Tambah tindak lanjut; tenggat dinilai saat Ajukan penutupan | Disepakati | DL-182; keputusan Mino 24 Nov (review flowchart) |
| ADJ-10 | INS-03, Analitik | Ringkasan penutupan, metrik durasi | Tambah | Lama penanganan (disetujui → ditutup) dan total waktu (registrasi → ditutup) | Disepakati (KPI menunggu SKK) | DL-183; keputusan Mino 24 Nov (review flowchart) |
| ADJ-11 | INS-01, INS-02 | FR-INS-11, Ajukan ulang | Ubah | Cek laporan ganda saat ajukan ulang hanya bila lokasi, waktu, atau kategori berubah; kecocokan lama tidak diulang | Disepakati | DL-184; keputusan Mino 24 Nov (review flowchart); uji staging 24 Nov |
| ADJ-12 | INS-03, INS-04, Analitik | Data penutupan, Setujui penutupan, Koreksi data, Konfigurasi | Tambah | Produksi hilang (LPO) opsional saat penutupan; jalan utama unggah laporan produksi lalu AI mengisi saran; terpisah dari kerugian dan level | Disepakati (nilai awal menunggu SKK; AI menunggu cek keamanan data) | DL-185; keputusan Mino 24 Nov; MoM W3 Action 7 |
| ADJ-13 | INS-03, INS-04 | 4.6 Bahan pertimbangan penutupan (FR-INS-87..94), Setujui penutupan, Detail ditutup | Ubah | Panel AI terpisah diganti tombol "Ringkasan untuk keputusan" (5 poin, dibuka atas permintaan) + temuan AI ditempel di data; dipakai juga SKK approver dan Detail ditutup | Disepakati (cakupan SKK dan Detail ditutup menunggu Medco) | DL-186; keputusan Mino 24 Nov (review desain penutupan) |
| ADJ-14 | INS-03 | Tabel isian Data penutupan: baris Penyebab, Faktor penyebab, catatan jumlah isian wajib (6) | Ubah | Penyebab utama satu pilihan; Uraian penyebab jadi Penjelasan penyebab (aturan wajib tetap); Faktor penyebab jadi Faktor pendukung, opsional; isian wajib 6 jadi 5 | Disepakati (taksonomi menunggu K-05) | DL-191; keputusan Mino 24 Nov; uji staging PC3-05 |
| ADJ-15 | KIN-01 | Tabel P-1, FR-KIN-01, 03, 16 | Tambah | Sumbu korban bisa diubah di matriks (dari ADJ-08); parameter baru Produksi hilang: saklar fitur, saklar isi AI, harga minyak per bulan (dari ADJ-12) | Usulan (konflik versi matriks ADJ-08 vs FR-KIN-05) | Turunan ADJ-08, ADJ-12; KIN-01 rev 41 |
| ADJ-16 | KIN-01, INS-01, INS-03 | Keputusan terbuka #6, Tabel B-1, INS-03 P-09, ADJ-14 | Ubah | Pemilik daftar kategori, jenis, dan taksonomi penyebab; usulan PM: KIN-01 dengan pola KAT-01 | Disepakati (DL-192; isi awal penyebab menunggu K-05) | DL-192; keputusan Mino 24 Nov; pola KAT-01 |
| ADJ-17 | INS-01 | FR-INS-10, Tabel R-1, U-1 #17, EI.10 | Ubah | "Tarik kembali" diganti "Batalkan pengajuan" di semua teks; perilaku tetap | Disepakati | DL-177 (memperluas DL-136) |
| ADJ-18 | INS-01, WFL-01 v3 | Tabel R-1, FR-INS-15; WFL-01 v3 4.2 | Ubah | Draf hanya dilanjutkan pengguna yang role aktifnya maker titik Lapor (bawaan Pelapor); Pejabat dan Admin KKKS hanya melihat; hapus hanya pembuat | Disepakati | DL-179 (diperjelas Mino 24 Nov: sesama maker, role aktif); uji PJ1-01 |

## ADJ-01 · Pengaju boleh memeriksa laporannya sendiri (INS-02)

- **Sebelum (INS-02 Tabel M-1):**
  - Tidak boleh, bila di organisasinya ada Pejabat Berwenang lain; nama pengaju tidak muncul di pilihan pemeriksa.
  - Boleh, bila ia satu-satunya; riwayat mencatat "diperiksa sendiri".
- **Sesudah:** boleh, tidak diblokir. Prinsipnya pemeriksa sebaiknya orang yang berbeda, tetapi organisasi bisa hanya punya sedikit Pejabat Berwenang. Satu orang boleh memegang role maker, checker, dan approver; untuk bertindak dengan role lain ia harus Ganti role.
- **Kriteria penerimaan:**
  - Given pengaju juga Pejabat Berwenang, When daftar pilihan pemeriksa dibuka, Then nama pengaju tetap muncul.
  - Given pemeriksa sama dengan pengaju, When ia menekan Setujui atau Kembalikan, Then muncul konfirmasi "Anda yang melaporkan insiden ini. Tetap periksa?". Bila dilanjutkan, keputusan sah, lalu Riwayat dan Jejak audit mencatat "diperiksa sendiri".
- **Dampak:**
  - Backend: hapus filter yang mengeluarkan pengaju dari daftar pemeriksa; tambah flag riwayat.
  - UI: dialog konfirmasi.
  - Prototype: alur Periksa.
- **Konflik yang dicatat:** Cetak Biru Skema Data Bab 8 (penyusun ≠ penyetuju) dan permintaan Pak Nugraha di MoM W3 ("tiga orang"). Jawabannya: prinsip orang berbeda tetap berlaku, ditegakkan lewat peringatan, bukan blokir. Perlu dicatat di Decision Log.

## ADJ-02 · PIC boleh menyetujui penutupan sendiri (INS-03)

- **Sebelum (INS-03 Tabel M-2):** tidak boleh bila ada Pejabat Berwenang lain; boleh bila PIC satu-satunya, dan riwayat mencatat "diperiksa sendiri".
- **Sesudah:** boleh, tidak diblokir, dengan prinsip yang sama seperti ADJ-01.
- **Kriteria penerimaan:**
  - Given PIC juga Pejabat Berwenang, Then namanya tetap muncul di pilihan penyetuju penutupan.
  - Given penyetuju sama dengan PIC, When ia menekan Setujui penutupan, Then muncul konfirmasi "Anda PIC insiden ini. Tetap tutup?". Bila dilanjutkan, Riwayat dan Jejak audit mencatat "ditutup sendiri".
- **Dampak:** sama dengan ADJ-01, di titik Penutupan.

## ADJ-03 · Peringatan bila pemeriksa juga menutup (INS-03, FR-INS-56c baru)

- **Sebelum:** tidak ada aturan lintas titik.
- **Sesudah:**
  - Given orang yang menyetujui Pemeriksaan (INS-02) juga menyetujui Penutupan untuk insiden yang sama, When ia menekan Setujui penutupan, Then muncul konfirmasi "Anda juga memeriksa laporan ini. Tetap tutup?".
  - Ia tetap bisa melanjutkan. Riwayat dan Jejak audit mencatat "diperiksa dan ditutup orang yang sama".
  - Bila ADJ-02 dan ADJ-03 berlaku bersamaan, tampilkan satu dialog yang menyebut kedua kondisi, bukan dua dialog berturut-turut \[USULAN\].
- **Dampak:** backend perlu menyimpan siapa yang memutus Pemeriksaan agar bisa dibandingkan saat Penutupan. Ini pelengkap lintas titik untuk WFL-01 v3 (peringatan orang yang sama).

## ADJ-04 · Nilai awal tiga lapis (INS-02, INS-03)

| Lapis | Role bawaan | Titik | Yang dilakukan |
| --- | --- | --- | --- |
| Maker | Pelapor KKKS | Lapor (INS-01) | Mengisi dan mengirim laporan |
| Checker | Pejabat Berwenang | Pemeriksaan (INS-02) | Memeriksa isi, menetapkan level resmi, menggabung atau membatalkan, menunjuk PIC dan tenggat |
| Approver | Pejabat Berwenang | Penutupan (INS-03) | Memeriksa data penutupan termasuk kerugian final, lalu menutup insiden |

- Ini **nilai awal**, bukan kunci. Role di tiap lapis bisa diubah di halaman Persetujuan (WFL-01 v3), termasuk role baru buatan KKKS.
- Checker dan approver boleh orang yang sama atau berbeda (ADJ-03).
- Insiden masuk Analitik **setelah diperiksa**, bukan setelah ditutup, supaya dashboard real time walau penanganan lama. Ini sama dengan INS-02 FR-INS-22.
- &#91;USULAN\] Kerugian yang belum final ditandai "sementara" di Analitik sampai insiden ditutup. Perlu dicek apakah INS-02 atau Analitik sudah mengatur label ini.
- **Dampak:** dokumentasi dan label UI. Alur lima langkah tidak berubah dan tidak ada langkah baru.

## ADJ-05 · SKK bukan approver penutupan secara bawaan (INS-03)

- **Sebelum:** INS-03 P-10 masih terbuka. Arsitektur Skema Data Bab 10 mewajibkan SKK menyetujui penutupan Tinggi/Kritis dan penyetuju harus berbeda dari penutup (constraint basis data). PRD menjadikan checker SKK opsional (FR-INS-56a).
- **Sesudah:** opsi (a).
  - SKK cukup mendapat notifikasi (FR-INS-56b) dan tidak menjadi approver secara bawaan.
  - Bila perlu, Admin SKK menambahkan SKK sebagai checker penutupan lewat halaman Persetujuan (FR-INS-56a).
  - Penyetuju sebaiknya berbeda dari penutup, tetapi hanya diberi peringatan (ADJ-02).
- **Dampak:** Tech Lead memindahkan aturan dari constraint basis data ke konfigurasi alur.
- **Syarat sebelum dikerjakan:** kesepakatan Tech Lead dan DL baru, karena dokumen Arsitektur sudah disampaikan.

## ADJ-06 · Perubahan alur bisa diterapkan ke laporan berjalan (INS-02, INS-03)

- **Sebelum:** perubahan rantai checker hanya berlaku untuk pengajuan berikutnya.
- **Sesudah:** saat menyimpan perubahan alur, admin memilih "Hanya pengajuan baru" (bawaan) atau "Terapkan juga ke pengajuan yang sedang berjalan". Aturan rinci ada di WFL-01 v3.
- **Dampak ke Insiden:**
  - Laporan di Pemeriksaan atau Penutupan bisa berpindah penyetuju di tengah jalan.
  - Riwayat insiden menampilkan catatan "Alur diubah oleh {nama}, dipindah dari {x} ke {y}".
  - Tugas saya (INS-06) harus memindahkan item ke penyetuju baru.

## ADJ-07 · Dampak bisa diperbarui sepanjang penanganan (INS-01, INS-02, INS-03)

- **Sebelum:**
  - Isi laporan terkunci sejak dikirim (mesin persetujuan WFL-01).
  - Pemeriksa hanya mengoreksi kategori, keparahan, dan mitra (INS-02).
  - Catatan penanganan PIC berupa teks kronologi; koreksinya lewat entri baru (INS-03).
  - Kerugian baru diisi lagi sebagai "Kerugian akhir" di data penutupan (INS-03 Tabel F-2).
  - Akibatnya, bila korban atau kerugian baru diketahui di tengah penanganan, dashboard dan level keparahan tetap memakai isian awal sampai ditutup, dan SKK tidak tahu bila insiden sebenarnya naik ke Tinggi/Kritis.
- **Sesudah:**
  1. **Saat melapor:** kerugian dan korban diisi sesuai yang sudah diketahui saat itu, walau belum lengkap (mis. "sejauh ini 2 korban luka, kerugian sekitar Rp50 jt"), atau "Belum diketahui" bila sama sekali belum ada info. Keduanya bisa diperbarui kapan saja selama penanganan (butir 3). Saran level dihitung dari angka yang terisi; korban "Belum diketahui" tidak dihitung (sudah diatur KIN-01).
  2. **Saat Pemeriksaan:** checker boleh mengoreksi isian dampak, selain kategori dan keparahan.
  3. **Selama Dalam penanganan:** aksi baru **Perbarui dampak** untuk PIC dan Pejabat Berwenang. Isinya kerugian, korban, operasi terganggu, serta alasan atau sumber info (wajib, min. 10 karakter). Setiap pembaruan menjadi entri riwayat dengan nilai sebelum dan sesudah; nilai lama tidak hilang. Dashboard langsung memakai nilai terbaru dengan label "sementara".
  4. **Bila saran keparahan naik:** level baru langsung berlaku. Tenggat dihitung dari waktu kenaikan memakai tabel tenggat yang tersimpan di insiden, tetapi tidak boleh lebih lama dari tenggat sebelumnya. Bila level baru Tinggi/Kritis, SKK langsung diberi tahu. Pejabat Berwenang mendapat notifikasi dan bisa menekan **Kembalikan ke level sebelumnya** dengan alasan; bila dipakai, SKK mendapat notifikasi koreksi.
  5. **Bila saran keparahan turun:** level lama tetap berlaku sampai Pejabat Berwenang mengonfirmasi. Tenggat tidak diperpanjang otomatis.
  6. **Bila yang memperbarui adalah Pejabat Berwenang:** perubahan level naik atau turun langsung berlaku tanpa konfirmasi, tercatat di riwayat.
  7. **Saat ditutup:** approver mengesahkan angka final; label "sementara" hilang.
  8. **Setelah ditutup:** proses hukum dan hasil pengamanan tetap diperbarui tanpa buka kembali (sudah ada). Angka dampak dikoreksi langsung oleh Pejabat Berwenang lewat **Koreksi data** dengan alasan; riwayat mencatat sebelum dan sesudah; SKK diberi tahu bila insiden Tinggi/Kritis atau level berubah. Bila koreksi terjadi setelah periode yang datanya sudah diekspor, angka di dashboard diberi tanda "dikoreksi setelah periode". Buka kembali hanya dipakai bila ada penanganan baru.
- **Kriteria penerimaan:**
  - Given insiden Dalam penanganan level Sedang, When PIC menambah korban yang membuat saran level menjadi Kritis, Then level menjadi Kritis saat itu juga, SKK menerima notifikasi, tenggat menjadi min(tenggat lama, waktu kenaikan + tenggat Kritis), dan Pejabat Berwenang menerima notifikasi dengan aksi Kembalikan ke level sebelumnya.
  - Given PIC memperbarui dampak sehingga saran level turun, Then level tidak berubah dan Pejabat Berwenang mendapat item Tugas saya "Konfirmasi penurunan level".
  - Given Pejabat Berwenang memperbarui dampak, Then level berubah tanpa konfirmasi.
  - Given insiden Ditutup, When Pejabat Berwenang memakai Koreksi data, Then status tetap Ditutup, PIC dan tenggat tidak aktif kembali, dan riwayat mencatat koreksi.
  - Setiap pembaruan dan koreksi tampil di Riwayat dan Jejak audit: pelaku, role aktif, waktu, nilai sebelum dan sesudah, alasan.
- **Dampak:**
  - Backend: dampak disimpan berversi; level dihitung ulang memakai versi matriks dan kurs yang tersimpan di insiden (KIN-01 snapshot versi; kurs tanggal kejadian).
  - UI: aksi Perbarui dampak di Detail insiden; label "sementara" di Detail dan dashboard; notifikasi kenaikan dengan aksi Kembalikan; item Tugas saya konfirmasi penurunan; aksi Koreksi data pada insiden Ditutup.
  - Notifikasi (RSK-07): kenaikan level, koreksi alarm SKK, konfirmasi penurunan.
  - Analitik: angka terbaru dengan label sementara sampai ditutup; penanda dikoreksi setelah periode.

## ADJ-08 · Sumbu korban di matriks keparahan bisa diatur (KIN-01)

- **Sebelum:** matriks keparahan berversi dengan sumbu kerugian (USD) dan durasi operasi berhenti yang bisa diubah Admin SKK; kolom korban terberat terkunci sebagai "Definisi tetap, tidak bisa diubah" (KIN-01 FR-KIN-16, Tabel M-K).
- **Sesudah:** Admin SKK bisa mengatur level untuk setiap tingkat korban (mis. luka ringan, luka berat, meninggal) saat membuat versi baru matriks, sama seperti sumbu kerugian dan durasi. Contoh: apakah korban jiwa otomatis Kritis ditentukan lewat konfigurasi, bukan di kode.
  - Nilai awal: isi Tabel M-K saat ini, yang diambil dari ketentuan level KKKS (TKO) dan rekap SKK. Ditinjau ulang saat SKK memutus K-2.
  - Aturan versi tetap: perubahan hanya berlaku untuk insiden dengan waktu kejadian sejak tanggal mulai berlaku; insiden lama tidak dihitung ulang.
  - Matriks tetap menghasilkan saran; level resmi tetap diputus Pejabat Berwenang (ADJ-07).
  - Sebaran dampak dan data & informasi tetap terkunci sampai K-3 diputus.
- **Kriteria penerimaan:** Given Admin SKK membuat versi baru dan mengubah level "meninggal" dari 4 ke 5, When versi berlaku, Then insiden baru dengan korban meninggal mendapat saran level 5, dan insiden yang kejadiannya sebelum tanggal berlaku tetap memakai versi lama.
- **Dampak:** halaman Matriks keparahan (KIN-01): kolom korban jadi bisa diubah di draf versi; baris Definisi sumbu korban dikeluarkan dari baris terkunci.

## ADJ-09 · Menunggu penutupan: aksi dibatasi, tenggat dinilai saat diajukan (INS-03)

- **Sebelum:** INS-03 belum membatasi aksi apa saja yang tersedia selama laporan penutupan menunggu approver, dan belum menyebut kapan status "Dalam tenggat" dinilai. Akibatnya PIC bisa tercatat terlambat karena approver lambat memutus.
- **Sesudah:**
  - Selama Menunggu penutupan (istilah INS-03 U-1), aksi yang tampil hanya **Setujui penutupan**, **Kembalikan ke PIC** (alasan wajib), dan **Tambah tindak lanjut**.
  - Ganti PIC, Ubah tenggat, Eskalasi, dan Batalkan disembunyikan. Aksi itu muncul lagi setelah laporan dikembalikan ke PIC.
  - PIC insiden juga tetap melihat **Tambah tindak lanjut** selama Menunggu penutupan, karena tindak lanjut tidak menghalangi penutupan. Tindak lanjut baru tampil di layar approver tanpa mengubah status. (Ditambahkan 24 Nov dari uji staging PC4-05.)
  - "Dalam tenggat" atau "Melewati tenggat" dinilai pada waktu PIC menekan Ajukan penutupan, bukan pada waktu approver menutup.
- **Kriteria penerimaan:**
  - Given insiden dalam keadaan Menunggu penutupan, When approver membuka Detail insiden, Then tombol Ganti PIC, Ubah tenggat, Eskalasi, dan Batalkan tidak tampil, dan hanya tiga aksi di atas yang tersedia.
  - Given PIC menekan Ajukan penutupan 2 jam sebelum tenggat dan approver menutup 1 hari setelah tenggat, Then insiden tercatat "Dalam tenggat".
  - Given approver menekan Kembalikan ke PIC, Then status kembali Dalam penanganan dan keempat aksi yang disembunyikan tampil lagi.
  - Given insiden dalam keadaan Menunggu penutupan, When PIC membuka Detail insiden, Then tombol Tambah tindak lanjut tersedia, dan tindak lanjut yang dibuat tidak mengubah status Menunggu penutupan.
  - Given approver membuka dialog Kembalikan ke PIC dan Alasan masih kosong, Then tombol Kembalikan nonaktif sampai Alasan terisi. (Ditambahkan 24 Nov dari uji staging PT1-07; staging mengaktifkan tombol walau alasan kosong.)
- **Dampak:** UI tombol aksi per status di Detail insiden; backend menyimpan waktu Ajukan penutupan sebagai dasar penilaian tenggat; Analitik tepat waktu memakai waktu itu.

## ADJ-10 · Dua ukuran waktu penanganan (INS-03, Analitik)

- **Sebelum:** satu ukuran durasi tanpa titik awal yang tegas.
- **Sesudah:** dua ukuran ditampilkan berdampingan di ringkasan penutupan dan Analitik:
  - **Lama penanganan:** dari laporan disetujui di Pemeriksaan sampai ditutup. Mengukur kerja PIC.
  - **Total waktu:** dari waktu registrasi sampai ditutup. Mengukur seluruh alur, termasuk waktu tunggu pemeriksaan.
- &#91;ASUMSI\] Ukuran mana yang menjadi KPI SKK belum dikonfirmasi. Sampai dikonfirmasi, keduanya tampil dan tidak ada yang ditandai KPI.
- **Kriteria penerimaan:** Given laporan diregistrasi 1 Nov 08.00, disetujui 1 Nov 14.00, dan ditutup 3 Nov 14.00, Then lama penanganan 2 hari 0 jam dan total waktu 2 hari 6 jam.
- **Dampak:** ringkasan penutupan di Detail insiden; metrik dan definisi di Analitik.

## ADJ-11 · Cek laporan ganda saat ajukan ulang (INS-01, INS-02)

- **Sebelum:** cek laporan ganda (INS-01 FR-INS-11) berjalan saat Ajukan. Perilaku saat laporan yang dikembalikan diajukan ulang belum diatur. Di staging, cek berjalan lagi penuh (uji 24 Nov, INS-0002).
- **Sesudah:**
  - Saat ajukan ulang, cek laporan ganda dijalankan lagi **hanya** bila lokasi, waktu kejadian, atau kategori berubah.
  - Kecocokan yang sudah diputus pelapor sebelumnya (Tetap ajukan) tidak ditampilkan lagi.
  - Teks dialog khusus ajukan ulang, mis. "Setelah Anda mengubah {lokasi/waktu/kategori}, laporan ini mirip dengan {nomor}."
  - Waktu registrasi tetap memakai waktu pengajuan pertama; laporan diperiksa ulang oleh checker.
- **Kriteria penerimaan:**
  - Given laporan dikembalikan dan pelapor hanya mengubah kronologi, When ia menekan Ajukan ulang, Then dialog laporan ganda tidak muncul.
  - Given pelapor mengubah lokasi dan ada laporan baru yang memenuhi syarat FR-INS-11, Then dialog muncul hanya dengan laporan baru itu, bukan dengan laporan yang sudah ia putus sebelumnya.
  - Given laporan diajukan ulang, Then nomor dan waktu registrasi tidak berubah.
- **Dampak:** backend membandingkan field lokasi, waktu, dan kategori dengan versi yang terakhir diajukan, dan menyimpan kecocokan yang sudah diputus; UI teks dialog ajukan ulang.

## ADJ-12 · Produksi hilang (LPO) di data penutupan, diisi dari unggahan dokumen (INS-03, INS-04, Analitik)

- **Masalah:** \[FAKTA: MoM W3, transkrip 01:13:48–01:15:27\] KKKS perlu mencantumkan produksi yang hilang akibat insiden untuk memperkuat laporan polisi, dan angkanya harus bisa dijustifikasi dengan verifikasi di luar Security. PERISAI hanya mencatat kerugian langsung. LPO adalah hasil hitung (produksi normal × lama berhenti × harga); PERISAI hanya punya lama berhenti.
- **Sebelum:** tidak ada isian LPO.
- **Sesudah:**
  1. **Lapor dan penanganan:** tidak ada isian LPO. Lama berhenti tetap dari dampak dan Perbarui dampak.
  2. **Data penutupan (PIC):** bagian opsional "Produksi hilang (LPO)" di bawah Kerugian akhir dengan pilihan Tidak ada / Ada / Belum dihitung. Bila Ada, **jalan utama adalah unggah dokumen**: tombol utama "Unggah laporan produksi" (mis. laporan harian produksi, berita acara gangguan operasi). AI membaca dokumen dan mengisi saran: jenis produksi, produksi normal, lama berhenti, volume hilang, nilai bila ada, dan sumber angka beserta bagian dokumen asalnya. Setiap isian dari AI bertanda "AI · Perlu dicek"; angka yang tidak ditemukan dibiarkan kosong dengan keterangan, tidak ditebak. Jalan kedua: tautan "Isi manual".
  3. **Isian (setelah AI atau manual):** jenis produksi Minyak/Gas. Minyak: produksi normal (bbl/hari), lama berhenti (otomatis dari dampak, bisa diubah), persentase turun bila operasi terganggu sebagian, harga per barel (otomatis dari konfigurasi bulan kejadian, bisa diubah dengan alasan); volume dan nilai dihitung, bisa ditimpa dengan "Isi nilai sendiri". Gas: volume dan nilai diisi langsung. Sumber angka wajib dan minimal satu lampiran wajib; dokumen yang diunggah untuk AI otomatis menjadi lampiran.
  4. **Setujui penutupan (approver):** melihat LPO, bahan hitung, sumber, lampiran, dan isian mana yang berasal dari AI; Kembalikan ke PIC bila tidak bisa dijustifikasi.
  5. **Setelah ditutup:** LPO diisi atau dikoreksi lewat Koreksi data (ADJ-07) dengan alasan wajib.
  6. **Konfigurasi (Admin SKK):** saklar fitur LPO (bawaan mati), saklar isi otomatis AI, dan harga minyak acuan per bulan.
  7. **Keluaran:** kartu Data penutupan menampilkan Kerugian langsung dan Produksi hilang terpisah; SKK melihat LPO di detail dan sebagai ukuran tersendiri di dashboard (volume dan nilai), tidak dijumlah ke Kerugian dan tidak memengaruhi saran keparahan.
- **Nilai awal yang menunggu konfirmasi SKK (MoM W3 Action 7):** satuan volume dan nilai sekaligus; operasi terganggu sebagian dihitung dari persentase turun yang diisi PIC; acuan harga ditentukan SKK lewat angka yang diisi Admin SKK.
- **Syarat sebelum isi otomatis AI diaktifkan:** \[ASUMSI\] cek Cetak Biru Desain Keamanan Data apakah dokumen produksi boleh diproses model AI dan di mana; cek cakupan AI di SOW. Bila belum lolos, unggah tetap jalan utama sebagai lampiran, dan isian diisi manual.
- **Kriteria penerimaan:**
  - Given saklar LPO mati, Then bagian Produksi hilang tidak tampil di Data penutupan, Koreksi data, maupun dashboard.
  - Given PIC memilih Ada dan mengunggah dokumen yang memuat produksi normal 200 bbl/hari, When AI selesai membaca, Then isian produksi normal terisi 200 dengan tanda "AI · Perlu dicek" dan rujukan halaman dokumen, dan tidak ada yang tersimpan sebelum PIC menekan Simpan.
  - Given dokumen tidak memuat harga, Then isian harga memakai nilai konfigurasi bulan kejadian, bukan angka dari AI.
  - Given minyak, produksi normal 200 bbl/hari, berhenti 6 jam, harga US$70/bbl, Then volume 50 bbl dan nilai US$3.500 beserta Rp menurut kurs tanggal kejadian.
  - Given PIC memilih Ada tanpa sumber angka atau tanpa lampiran, Then Ajukan penutupan nonaktif dengan pesan isian yang kurang.
  - Given PIC memilih Belum dihitung, Then penutupan tetap bisa diajukan, dan LPO bisa diisi lewat Koreksi data setelah ditutup.
  - Given insiden Tinggi dengan LPO besar, Then saran keparahan tidak berubah karena LPO.
- **Dampak:** UI Data penutupan desktop dan mobile, Setujui penutupan, Koreksi data, Detail ditutup, Konfigurasi Modul; INS-04 kemampuan AI baca dokumen produksi; Analitik ukuran baru; model data LPO berversi dengan bahan hitung dan asal isian (AI/manual).

## ADJ-13 · Ringkasan AI untuk keputusan penutupan

- **Masalah:** \[FAKTA: review desain 24 Nov\] Approver harus membaca laporan, hasil penanganan, tindak lanjut, dan panel AI "Bahan pertimbangan" yang mengulang data yang sama. Peringatan klaim belum cocok muncul dua kali (panel AI dan Kesiapan). Approver butuh inti insiden tanpa membaca semua isi.
- **Sebelum:** panel "Bahan pertimbangan" (INS-04 4.6) selalu tampil di atas Data penutupan, berisi angka utama, "Apa yang terjadi", jejak langkah, klaim belum cocok, dan cek cepat. Hanya untuk checker KKKS.
- **Sesudah:**
  1. **Tombol "Ringkasan untuk keputusan"** di atas kolom kiri Setujui penutupan, tertutup secara bawaan, gaya sama dengan Tanya AI. Dibuka atas permintaan approver.
  2. **Isi 5 poin:** Kejadian (1 kalimat) · Yang dilakukan, dengan bukti yang dilampirkan dan tautan "Lihat jejak" ke langkah dari Riwayat beserta sumber aslinya · Dampak akhir (kerugian dan selisih dari perkiraan pelapor, produksi hilang bila ada, waktu operasi pulih, proses hukum) · Masih berjalan setelah ditutup (tindak lanjut yang belum selesai, status, tenggat) · Perlu dicek (jumlah + daftar; tiap butir punya "Lihat" yang menyorot data terkait).
  3. **Isi "Perlu dicek":** klaim di data penutupan yang tidak didukung tindak lanjut atau Riwayat; tindak lanjut yang diperiksa oleh PIC-nya sendiri; selisih data antar-bagian (mis. lama operasi berhenti di laporan vs waktu pulih).
  4. **Temuan menempel di data:** klaim yang belum cocok ditandai langsung di Ringkasan penanganan dengan catatan "AI · Belum cocok". Baris Kesiapan "klaim belum cocok" menyorot tanda itu. Panel terpisah dihapus.
  5. **Tanpa rekomendasi:** AI tidak menyarankan tutup atau kembalikan; footer "Dibuat AI … cocokkan dengan bukti" dan umpan balik Membantu? tetap.
  6. **Layar lain:** SKK sebagai approver (bila dikonfigurasi, DL-74) memakai ringkasan yang sama. Detail ditutup (KKKS dan SKK) memakai "Ringkasan insiden" 4 poin tanpa Perlu dicek.
- **Perlu konfirmasi:** \[ASUMSI\] perluasan ke SKK dan Detail ditutup menambah cakupan AI di luar checker KKKS (FR-INS-87..94). Konfirmasi ke Medco bersama DL-104 dan DL-107: scope Quotation atau change request.
- **Kriteria penerimaan:**
  - Given approver membuka Setujui penutupan, Then ringkasan tertutup dan tidak ada panel AI lain di halaman.
  - Given approver menekan "Ringkas untuk saya", Then tampil 5 poin dengan jumlah butir Perlu dicek, dan setiap butir punya tautan ke data sumbernya.
  - Given data penutupan menyebut gembok sudah diganti dan tindak lanjut terkait masih Dikerjakan tanpa catatan di Riwayat, Then kalimat itu bertanda "AI · Belum cocok" dan masuk Perlu dicek.
  - Given laporan menulis operasi berhenti 6 jam dan waktu pulih 39 jam setelah kejadian, Then selisih itu masuk Perlu dicek.
  - Given tidak ada temuan, Then Perlu dicek menulis "Tidak ada yang perlu dicek", bukan disembunyikan.
  - Given insiden sudah ditutup, Then Detail ditutup menampilkan Ringkasan insiden 4 poin tanpa Perlu dicek.
- **Dampak:** UI Setujui penutupan (KKKS dan SKK), Detail ditutup; INS-04 4.6 dan aturan AI-R\*; Kesiapan penutupan (FR-INS-55a) menautkan ke tanda klaim.

## ADJ-14 · Penyebab utama, Penjelasan penyebab, dan Faktor pendukung

- **Masalah:** \[FAKTA: uji staging 24 Nov, PC3-05\] Penyebab bisa dipilih lebih dari satu dan opsinya tumpang tindih dengan Faktor penyebab ("Faktor sosial" ada di keduanya). PIC tidak bisa membedakan dua isian ini, dan jumlah isian wajib berbeda antar-layar desain (P16 "6 dari 6", P22 dan MP2 "5 dari 5").
- **Sebelum (INS-03, tabel Data penutupan):** Penyebab wajib, pilih satu atau lebih dari taksonomi PLT-06, ditambah "Uraian penyebab" maks. 500 karakter (wajib bila Tinggi atau Kritis). Faktor penyebab wajib, pilih satu atau lebih. Isian wajib PIC: 6.
- **Sesudah:**
  1. **Penyebab utama:** wajib, pilih **satu** dari taksonomi (PLT-06). Teks bantuan: "Pilih satu yang paling menentukan terjadinya insiden."
  2. **Penjelasan penyebab:** label baru untuk "Uraian penyebab", maks. 500 karakter. Aturan wajib tidak berubah: wajib bila keparahan Tinggi atau Kritis, opsional untuk Rendah dan Sedang.
  3. **Faktor pendukung:** label baru untuk "Faktor penyebab", **opsional**, boleh lebih dari satu. Teks bantuan: "Kondisi lain yang ikut membuat insiden terjadi atau lebih parah. Boleh lebih dari satu."
  4. **Isian wajib PIC jadi 5:** Ringkasan penanganan, Tim terlibat, Penyebab utama, Bukti penyelesaian, Hasil pengamanan. Penjelasan penyebab dihitung bersama Penyebab utama, sama dengan aturan lama.
  5. **Label di layar baca** (Setujui penutupan, Detail ditutup, mobile) memakai "Penyebab utama" dan "Faktor pendukung".
- **Selaras skema:** \[FAKTA: ASD Bab 10\] incidents.root\_cause\_id + cause\_description untuk Penyebab utama dan penjelasannya; incident\_contributing\_factors untuk Faktor pendukung (maksimal satu primer, BR-INS-09).
- **Perlu dicek:** \[ASUMSI\] analisis Top Contributing Factors (SOW B.9) kini membaca Penyebab utama (selalu terisi) dan Faktor pendukung (bisa kosong). Pastikan definisi metrik di Analitik insiden mengikuti ini.
- **Kriteria penerimaan:**
  - Given PIC sudah memilih satu Penyebab utama, When ia memilih opsi lain, Then pilihan lama diganti (tidak menjadi dua).
  - Given Faktor pendukung kosong dan 5 isian wajib lain terisi, When PIC menekan Ajukan penutupan, Then pengajuan berhasil dan penghitung menulis "5 dari 5 isian wajib".
  - Given keparahan Tinggi dan Penjelasan penyebab kosong, When PIC menekan Ajukan penutupan, Then pengajuan ditolak dengan pesan di isian Penjelasan penyebab.
  - Given keparahan Sedang dan Penjelasan penyebab kosong, When PIC menekan Ajukan penutupan, Then pengajuan berhasil.
  - Given insiden menunggu atau sudah ditutup, Then layar baca menulis label "Penyebab utama" dan "Faktor pendukung", dan Faktor pendukung yang kosong ditulis "–".
- **Dampak:** UI Data penutupan web dan mobile, validasi Ajukan penutupan, layar baca penutupan; tidak ada perubahan skema data.

## ADJ-15 · Parameter Konfigurasi Insiden yang muncul dari ADJ-08 dan ADJ-12 (KIN-01)

**Masalah:** \[FAKTA: KIN-01 rev 41\] ADJ-08 dan ADJ-12 menambah nilai yang diatur Admin SKK, tetapi KIN-01 Tabel P-1 dan FR-KIN-01 belum memuatnya. Bila tidak ditulis di KIN-01, dev akan menaruh nilai ini di kode atau di tempat lain, dan Admin SKK tidak punya halaman untuk mengubahnya.

**Sebelum (KIN-01):**

- FR-KIN-01: grup Insiden berisi 12 baris, termasuk baris terkunci "Definisi sumbu tetap".
- `ins.sumbu_tetap` (FR-KIN-16): sumbu korban, sebaran dampak, dan data & informasi terkunci.
- FR-KIN-03: kolom korban terberat di matriks terkunci.
- Tidak ada parameter Produksi hilang (LPO).

**Sesudah:**

1. Sumbu korban (ADJ-08): kolom Korban terberat pindah dari `ins.sumbu_tetap` ke `ins.matriks_keparahan` dan bisa diubah per level di draf versi baru, dengan Dasar perubahan wajib seperti sumbu lain (FR-KIN-03). `ins.sumbu_tetap` tinggal sebaran dampak dan data & informasi, tetap terkunci sampai K-3. Nilai awal tetap Tabel M-K.
2. Produksi hilang (ADJ-12): satu baris baru "Produksi hilang (LPO)" di grup Insiden, satu halaman dengan tiga nilai:

| Kunci | Parameter | Tipe | Bawaan | Validasi | Kapan berlaku | Konfirmasi dampak |
| --- | --- | --- | --- | --- | --- | --- |
| `ins.lpo_aktif` | Fitur Produksi hilang | Switch | Mati (ADJ-12) | — | Langsung | Ya: jumlah insiden yang sudah punya data LPO |
| `ins.lpo_isi_ai` | Isi otomatis dari dokumen produksi | Switch | Mati | Hanya bisa dinyalakan bila `ins.lpo_aktif` menyala | Unggahan berikutnya | Tidak |
| `ins.harga_minyak_bulanan` | Harga minyak acuan per bulan | Tabel bulan × USD/bbl | Kosong | Angka > 0, maksimal 2 desimal; bulan paling akhir = bulan berjalan | Data penutupan yang diisi sesudah disimpan | Tidak |

3. FR-KIN-01 menjadi 13 baris: 12 baris lama ditambah Produksi hilang. Baris "Definisi sumbu tetap" tidak lagi menyebut korban.

**Konflik yang harus diputus sebelum butir 1 dikerjakan:**

- &#91;FAKTA: ADJ-08\] "perubahan hanya berlaku untuk insiden dengan waktu kejadian sejak tanggal mulai berlaku".
- &#91;FAKTA: KIN-01 FR-KIN-05 dan 4.3\] versi berlaku sejak disimpan, untuk laporan yang diajukan sesudahnya, tanpa tanggal mulai berlaku. Usulan 4.3 ini masih Keputusan terbuka #2.
- &#91;USULAN\] Ikuti FR-KIN-05, karena KIN-01 sudah diserahkan ke dev dan CFG-01 R-3 tidak mengenal penjadwalan. ADJ-08 lalu diubah: "berlaku untuk laporan yang diajukan sejak versi disimpan".

**Tidak diatur di sini:**

- Saran keparahan dari LPO: tidak ada (ADJ-12).
- Harga gas: diisi manual per insiden (ADJ-12), tidak ada parameter.
- Daftar penyebab utama dan faktor pendukung (ADJ-14): ikut keputusan pemilik daftar di ADJ-16.

**Perlu diputus \[ASUMSI\]:**

- Harga bulan kejadian belum diisi Admin SKK: usulan, isian harga kosong dan wajib diisi PIC dengan alasan, ditandai "Harga acuan belum tersedia".
- Admin SKK mengubah harga sesudah LPO diajukan: usulan, nilai LPO yang sudah diajukan tidak dihitung ulang (pola snapshot sama dengan kurs FR-KIN-04).
- `ins.lpo_aktif` dimatikan sesudah ada data: usulan, data tetap tersimpan, hanya disembunyikan (ADJ-12 hanya mengatur bagian tidak tampil).

**Kriteria penerimaan:**

- Given Admin SKK membuka draf versi baru matriks, Then kolom Korban terberat bisa diubah untuk level 1–5, sedangkan sebaran dampak dan data & informasi tampil terkunci.
- Given `ins.lpo_aktif` Mati (bawaan), Then grup Insiden menampilkan baris Produksi hilang dengan nilai "Mati", dan bagian Produksi hilang tidak tampil di Data penutupan, Koreksi data, maupun dashboard.
- Given `ins.lpo_aktif` Mati, When Admin SKK mencoba menyalakan `ins.lpo_isi_ai`, Then switch nonaktif dengan teks "Nyalakan Produksi hilang terlebih dahulu".
- Given `ins.lpo_isi_ai` Mati dan PIC mengunggah laporan produksi, Then dokumen tersimpan sebagai lampiran dan tidak ada isian yang diisi AI.
- Given harga minyak November 2026 = US$70/bbl, When PIC mengisi LPO minyak untuk insiden yang terjadi 12 November 2026, Then isian harga terisi 70 dan bisa diubah dengan alasan.
- Given Admin SKK memasukkan harga 0 atau angka negatif, Then Simpan nonaktif dengan pesan di isian itu.
- Setiap perubahan tercatat di Riwayat perubahan halaman dan M-22 (FR-KIN-15).

**Dampak:** KIN-01 Tabel P-1, FR-KIN-01, 03, 16; halaman Konfigurasi Modul › Insiden (baris dan halaman baru Produksi hilang); `system_parameters`. Desain: board Konfigurasi Modul · Insiden belum punya halaman Produksi hilang.

## ADJ-16 · Pemilik daftar kategori, jenis, dan taksonomi penyebab insiden (KIN-01, INS-01, INS-03)

**Masalah:** \[FAKTA: KIN-01 Keputusan terbuka #6 dan Tabel B-1\] belum diputuskan siapa yang memiliki daftar kategori dan jenis insiden: PLT-06 (master platform, rujukan INS-03 P-09) atau KIN-01 (`ins.kategori`, pola KAT-01). Kolom usulan sementara masih "Belum ada usulan". Daftar penyebab utama dan faktor pendukung (ADJ-14) juga merujuk PLT-06. Tanpa pemilik yang jelas, setelah Go-Live tidak ada halaman tempat Admin SKK menambah kategori yang diminta SKK, dan isi daftar (K-05) tidak punya tempat untuk dimasukkan.

**Pilihan:**

- A. PLT-06 tetap pemilik. Satu master untuk seluruh platform. KIN-01 hanya merujuk.
- B. KIN-01 menjadi pemilik: daftar Kategori & jenis serta daftar Penyebab & faktor pendukung menjadi dua baris di Konfigurasi Modul › Insiden.

**Usulan PM \[USULAN\]: B**, dengan alasan:

- Sama dengan pola Anggaran WP&B: \[FAKTA: KAT-01 FR-KAT-01..07\] kategori dimiliki modul, dengan kolom Kode, Nama, Status Aktif/Nonaktif, Dipakai di N data, Terakhir diubah; tambah, ganti nama, nonaktifkan, dan atur urutan; kode tetap; nama baru tampil di semua data; kategori nonaktif tidak tampil di draf baru, data lama tetap menampilkannya.
- &#91;FAKTA: CFG-01 R-8\] aturan rinci parameter dimiliki PRD modul.
- Admin SKK mengelola semua nilai Insiden di satu tempat.

**Diputuskan 24 Nov (Mino): pilihan B, KIN-01 menjadi pemilik (DL-192).** \[FAKTA: PRD master 24 Nov\] PLT-06 tidak pernah ditulis sebagai PRD (tidak ada tab PLT-06 atau berawalan PLT di PRD master); rujukannya di INS-01, INS-03, dan ADJ-14 hanya nama. Karena itu daftar ini dirancang langsung di KIN-01 dengan pola daftar kategori Anggaran WP&B (KAT-01 FR-KAT-01..07), tanpa menunggu PLT-06.

**Sesudah:**

Dua halaman baru di Konfigurasi Modul › Insiden. Nomor FR adalah usulan nomor lanjutan KIN-01 (setelah FR-KIN-18). Riwayat (FR-KIN-15) dan hak akses (FR-KIN-17) berlaku sama seperti parameter KIN-01 lain. Yang ditandai \[FAKTA: KAT-01\] disalin dari aturan kategori Anggaran WP\&B; sisanya \[USULAN\].

| ID | Kebutuhan | Kriteria penerimaan |
| --- | --- | --- |
| FR-KIN-19 | Daftar kategori & jenis insiden | Halaman "Kategori & jenis insiden". Kolom: Kode, Nama, Jenis (jumlah, bisa dibuka), Status (switch Aktif/Nonaktif), Dipakai di N insiden, Terakhir diubah (tanggal + nama), aksi Ganti nama \[FAKTA: KAT-01 FR-KAT-01\]. Setiap kategori bisa punya nol atau lebih jenis (INS-01 Tabel K-1). Jenis tampil sebagai baris di bawah kategorinya dengan kolom dan aksi yang sama. Satu daftar untuk semua KKKS (CFG-01 R-2). Catatan info di atas tabel: "Kategori dan jenis ini berlaku untuk semua KKKS. Nama baru langsung tampil di semua insiden dan kodenya tetap. Kategori atau jenis nonaktif tidak tampil di laporan baru; insiden yang sudah diajukan tetap menampilkannya." |
| FR-KIN-20 | Tambah kategori atau jenis | Nama wajib, 1–100 karakter setelah spasi awal/akhir dipangkas, unik tanpa membedakan huruf besar kecil \[FAKTA: KAT-01 FR-KAT-02\]; kategori unik di seluruh daftar, jenis unik di dalam kategorinya \[USULAN\]. Data baru langsung Aktif, masuk di urutan terakhir, dan tampil di form yang dibuka setelah disimpan. Laporan yang sudah diajukan tidak berubah. |
| FR-KIN-21 | Kode | Kode dibuat sistem berurutan, tidak berubah saat ganti nama, dan tidak dipakai ulang walau nonaktif \[FAKTA: KAT-01 FR-KAT-03\]. Format \[USULAN\]: kategori KI01, KI02, …; jenis {kode kategori}-01, mis. KI03-02. Analitik dan ekspor mengelompokkan menurut kode, sehingga ganti nama tidak memecah statistik. |
| FR-KIN-22 | Ganti nama | Validasi sama dengan FR-KIN-20. Nama baru tampil di semua insiden, termasuk yang sudah Ditutup. Dialog menyebut jumlah insiden yang ikut berubah nama \[FAKTA: KAT-01 FR-KAT-04\]. Berkas ekspor yang sudah diunduh tetap memakai nama lama. |
| FR-KIN-23 | Nonaktifkan dan aktifkan kembali | Lewat dialog yang menyebut jumlah draf terbuka dan jumlah insiden yang sudah diajukan (tidak berubah) \[FAKTA: KAT-01 FR-KAT-05\]. Kategori atau jenis nonaktif tidak tampil di form lapor, di koreksi kategori saat Pemeriksaan (INS-02), dan di pilihan baru lainnya. Kategori nonaktif membuat semua jenisnya ikut tidak tampil. Draf yang sudah memilihnya: isian ditandai "Nonaktif", pesan meminta pilihan lain, dan Ajukan nonaktif sampai diganti. Insiden yang sudah diajukan tetap menampilkannya, dan filter daftar insiden tetap bisa memilihnya. Aktif kembali: tampil lagi dengan kode dan urutan semula. Tidak ada hapus permanen. |
| FR-KIN-24 | Urutan tampil | Urutan sama di form lapor, koreksi Pemeriksaan, filter daftar, Analitik, dan ekspor untuk semua KKKS. Admin SKK mengubah urutan lewat "Atur urutan": seret baris lewat pegangan di kiri, atau tombol naik dan turun per baris; Batal dan Simpan urutan; Simpan nonaktif sampai ada perubahan \[FAKTA: KAT-01 FR-KAT-07\]. Jenis diurutkan di dalam kategorinya. Urutan hanya tampilan dan berlaku langsung tanpa dialog dampak. Data nonaktif tetap punya posisi. |
| FR-KIN-25 | Daftar Penyebab utama dan Faktor pendukung | Halaman "Penyebab & faktor pendukung" dengan dua daftar terpisah tanpa tingkat (tanpa jenis), masing-masing memakai aturan FR-KIN-20 s.d. FR-KIN-24; kode PN01, … dan FP01, … \[USULAN\]. Penyebab utama dipilih satu, Faktor pendukung boleh lebih dari satu (ADJ-14). Nama yang sama tidak boleh ada di kedua daftar; sistem menolak dengan pesan "Nama ini sudah dipakai di daftar {Penyebab utama/Faktor pendukung}" \[USULAN, menjawab tumpang tindih "Faktor sosial" di uji PC3-05\]. |
| FR-KIN-26 | Daftar kosong dan isi awal | Daftar kosong: halaman menampilkan empty state dengan tombol Tambah \[FAKTA: pola KAT-01 FR-KAT-01\]. Bila daftar kategori kosong, form lapor menampilkan "Kategori insiden belum disiapkan Admin SKK" dan Ajukan nonaktif. Bila daftar Penyebab utama kosong, Data penutupan menampilkan "Daftar penyebab belum disiapkan Admin SKK" dan Ajukan penutupan nonaktif; Faktor pendukung kosong tidak menahan apa pun karena opsional. Isi awal Go-Live tercatat dengan pengubah "Sistem" (FR-KIN-15): kategori dan jenis dari rekap SKK Jan–Jun 2026 (keputusan kategori 18 Nov) sampai K-05 diputus; penyebab dan faktor menunggu K-05. |

**Kriteria penerimaan:**

- Given Admin SKK menambah kategori "Unjuk rasa" tanpa jenis, When Pelapor membuka form lapor, Then kategori itu tersedia dan isian Jenis tidak tampil.
- Given Admin SKK menambah kategori dengan nama " pencurian " sementara "Pencurian" sudah ada, Then Simpan ditolak dengan pesan nama sudah dipakai.
- Given kategori KI03 "Pencurian" dipakai 12 insiden, When Admin SKK menggantinya menjadi "Pencurian aset", Then dialog menyebut 12 insiden, kodenya tetap KI03, nama baru tampil di 12 insiden itu termasuk yang Ditutup, dan Analitik tetap menghitungnya sebagai satu kategori.
- Given kategori dipakai 12 insiden dan ada 2 draf yang memilihnya, When Admin SKK menonaktifkannya, Then dialog menyebut 2 draf dan 12 insiden, kategori tidak tampil di form lapor baru, 12 insiden tetap menampilkannya, dan kedua draf menandai isian Kategori "Nonaktif" dengan Ajukan nonaktif sampai diganti.
- Given kategori dinonaktifkan, Then semua jenisnya juga tidak tampil di form, dan tidak ada aksi hapus untuk kategori atau jenis mana pun.
- Given Admin SKK memindah kategori "Unjuk rasa" ke urutan pertama dan menekan Simpan urutan, Then form lapor, filter daftar, dan Analitik menampilkannya paling atas tanpa dialog dampak.
- Given "Faktor sosial" ada di daftar Faktor pendukung, When Admin SKK menambah "Faktor sosial" ke daftar Penyebab utama, Then Simpan ditolak dengan pesan "Nama ini sudah dipakai di daftar Faktor pendukung".
- Given daftar Penyebab utama kosong, When PIC membuka Data penutupan, Then isian Penyebab utama menampilkan "Daftar penyebab belum disiapkan Admin SKK" dan Ajukan penutupan nonaktif.
- Given pengguna tanpa izin Kelola membuka halaman Kategori & jenis insiden, Then halaman baca saja dan tombol Tambah, Ganti nama, switch Status, dan Atur urutan tidak tampil (FR-KIN-17).

**Dampak:** KIN-01 (FR-KIN-01, Tabel P-1, Tabel B-1, Keputusan terbuka #6 ditutup), INS-01 (Tabel K-1 rujukan), INS-03 (P-09), ADJ-14 (rujukan taksonomi), HAK-02 tidak berubah (ikut baris Konfigurasi Modul › Insiden, FR-KIN-17). FR baru FR-KIN-19 s.d. FR-KIN-26 di KIN-01; FR-KIN-01 bertambah 2 baris (Kategori & jenis insiden, Penyebab & faktor pendukung); Tabel B-1 baris Kategori insiden dihapus; rujukan PLT-06 di INS-01, INS-03 (P-09, tabel Data penutupan, Dependensi), dan ADJ-14 diganti KIN-01. Desain: board S14-Kategori dan S15-Jenis tetap; perlu board halaman Konfigurasi Kategori & jenis dan Penyebab & faktor pendukung, mengikuti board P1-Pengaturan (Kategori anggaran WP&B).

## ADJ-17 · Nama aksi "Batalkan pengajuan" menggantikan "Tarik kembali" (INS-01)

**Masalah:** \[FAKTA: DL-177\] aksi Pelapor untuk menarik laporan yang belum diputus pemeriksa bernama "Tarik kembali" di INS-01, sedangkan modul lain memakai "Batalkan pengajuan" (DL-136). Di modul kontrak, kata "Tarik" sudah dipakai untuk aksi lain (Tarik kontrak, status Ditarik), sehingga mudah tertukar.

**Sebelum (INS-01):** FR-INS-10, Tabel R-1, U-1 #17, teks toast, menu ⋯ daftar, edge mobile, dan email EI.10 memakai "Tarik kembali".

**Sesudah:** semua teks memakai "Batalkan pengajuan". Perilaku tidak berubah: laporan kembali menjadi Draf, alasan wajib diisi (maks. 500 karakter), pemeriksaan dibatalkan, dan penerima jalur cepat diberi tahu bila jalur cepat sudah terkirim (FR-INS-10).

| Tempat | Sebelum | Sesudah |
| --- | --- | --- |
| Tombol header dan menu ⋯ | Tarik kembali | Batalkan pengajuan |
| Toast berhasil | "Insiden ditarik kembali menjadi draf" | "Pengajuan dibatalkan. Insiden kembali menjadi draf." |
| Toast gagal | "… dan tidak bisa ditarik kembali." | "Laporan sudah diproses Pejabat Berwenang dan pengajuannya tidak bisa dibatalkan." |
| Notifikasi jalur cepat | "insiden ditarik kembali" | "pengajuan insiden dibatalkan" |
| Riwayat | Ditarik kembali | Pengajuan dibatalkan |

**Kriteria penerimaan:**

- Given laporan Menunggu pemeriksaan milik Pelapor, Then header Detail dan menu ⋯ di daftar menampilkan "Batalkan pengajuan", dan kata "Tarik kembali" tidak muncul di layar, dialog, Riwayat, maupun email.
- Given Pelapor menekan Batalkan pengajuan dan mengisi alasan, Then status kembali Draf dan toast menulis "Pengajuan dibatalkan. Insiden kembali menjadi draf."
- Given Pejabat Berwenang sudah memproses laporan lebih dulu, Then toast gagal menulis "Laporan sudah diproses Pejabat Berwenang dan pengajuannya tidak bisa dibatalkan."

**Dampak:** teks UI web dan mobile, Riwayat, email EI.10. Tidak ada perubahan logika. Desain sudah memakai istilah baru (S07, MS07, I15). Temuan uji terkait: TK-01 s.d. TK-03, MB6-06, RV2-04.

## ADJ-18 · Draf hanya bisa dilanjutkan sesama maker (INS-01, WFL-01 v3)

**Masalah:** \[FAKTA: DL-179\] INS-01 Tabel R-1 menulis Pejabat Berwenang KKKS (R-06) "Buat, ubah, ajukan: Ya, aturan sama dengan Pelapor", sehingga staging memberi Pejabat tombol Lanjutkan draf pada draf rekan (uji PJ1-01). Ini bertentangan dengan RSK-01 FR-LK-10 (pengguna KKKS selain R-05 hanya melihat draf) dan dengan pemisahan maker–checker.

**Sebelum (INS-01 Tabel R-1, FR-INS-15):** R-06 boleh membuat, mengubah, dan mengajukan dengan aturan sama dengan Pelapor, termasuk melanjutkan draf rekan.

**Sesudah (keputusan Mino 24 Nov, DL-179 diperjelas):**

1. Maker titik Lapor insiden diatur di halaman Persetujuan (WFL-01 v3 4.2). Nilai awal: Pelapor KKKS (R-05).
2. Maker dinilai dari **role aktif** pengguna. Pengguna yang memegang role maker dan role lain harus Ganti role untuk bertindak sebagai maker (keputusan 23 Nov).
3. Draf terlihat oleh semua pengguna KKKS dalam cakupan organisasinya.
4. Lanjutkan draf (ubah dan ajukan) hanya untuk pengguna yang role aktifnya maker, di organisasi yang sama.
5. Hapus draf hanya oleh pembuat draf.
6. Pengguna yang role aktifnya bukan maker (mis. Pejabat Berwenang, Admin KKKS) hanya melihat draf: tanpa Lanjutkan draf, tanpa Hapus, dan tanpa tombol Buat laporan.

**Diputuskan Mino 24 Nov (diskusi akses di luar alur):**

- Draf boleh dilihat semua pengguna KKKS yang punya Insiden · Lihat di **organisasi yang sama**, tetapi hanya maker yang bisa mengubah dan mengajukan. Pengguna KKKS lain dan role SKK tidak melihat draf (SKK sudah dibatasi HAK-02 FR-HAI-05: hanya insiden terverifikasi dan jalur cepat).
- Di halaman Persetujuan, role, grup, atau orang yang tidak punya Insiden · Lihat tidak bisa dipilih sebagai maker, checker, atau approver. Pesan: "{Nama} belum punya akses Lihat Insiden. Berikan dulu di Role & hak akses." Tidak ada akses yang muncul diam-diam karena penunjukan.
- Pengguna yang tidak terdaftar di alur mendapat akses dari matriks saja: Lihat = baca saja; Kelola = aksi di luar alur (Ganti PIC, Ubah tenggat, Batalkan, dan seterusnya, HAK-02 Tabel A-1); tanpa Lihat = menu tidak tampil.

**Masih terbuka:** maker diatur di halaman Persetujuan (WFL-01 v3 4.2) atau tetap lewat sel Buat di matriks (HAK-02 Tabel A-1 dan H-1, keputusan 8 Nov). \[FAKTA: HAK-02 Tabel H-1\] saat ini Pejabat KKKS punya Buat secara bawaan, dan Tabel A-1 menyebut Buat mencakup "lanjutkan draf (termasuk draf rekan)". Selama ini belum diputus, aturan butir 1–6 di atas bertentangan dengan HAK-02.

**Konsekuensi yang perlu diketahui:** dengan nilai awal ini, Pejabat Berwenang yang ingin melapor sendiri harus juga memegang role Pelapor dan Ganti role. Bila Admin menambahkan R-06 sebagai maker di halaman Persetujuan, Pejabat bisa membuat laporan dan juga melanjutkan draf rekan. Ini menggantikan kalimat DL-179 "Pejabat tetap boleh membuat dan mengajukan laporannya sendiri".

**Kriteria penerimaan:**

- Given Budi (role aktif Pelapor) membuat draf, When Rina (role aktif Pelapor, organisasi sama) membuka daftar, Then menu ⋯ draf itu berisi Lanjutkan draf tanpa Hapus draf.
- Given Michael (role aktif Pejabat Berwenang) membuka daftar, Then draf Budi tampil, menu ⋯ hanya berisi Lihat, dan tombol Buat laporan tidak tampil.
- Given Michael juga memegang role Pelapor, When ia Ganti role ke Pelapor, Then Lanjutkan draf dan Buat laporan tersedia, dan Riwayat mencatat role aktif saat aksi.
- Given Admin SKK menambahkan Pejabat Berwenang sebagai maker titik Lapor insiden, When Michael (role aktif Pejabat) membuka daftar, Then Lanjutkan draf dan Buat laporan tersedia.
- Given pengguna bukan maker memanggil API ubah atau ajukan draf, Then permintaan ditolak 403 dan tercatat.
- Given Rina melanjutkan draf Budi, Then Hapus draf tetap hanya tersedia untuk Budi.

* Given draf dibuat Budi di KKKS A, When pengguna KKKS B atau Pengawas SKK membuka daftar insiden, Then draf itu tidak tampil dan tautan langsung ke draf menghasilkan 403.
* Given Admin SKK membuka halaman Persetujuan titik Pemeriksaan insiden, When ia memilih role yang tidak punya Insiden · Lihat, Then pilihan ditolak dengan pesan "{Nama} belum punya akses Lihat Insiden. Berikan dulu di Role & hak akses."
* Given pengguna punya Insiden · Lihat tetapi tidak terdaftar di alur dan tidak punya Kelola, When ia membuka Detail insiden Menunggu pemeriksaan, Then tidak ada tombol aksi alur maupun aksi Kelola.

**Dampak:** INS-01 Tabel R-1 dan FR-INS-15; HAK-02 baris Insiden · Buat/Ubah; WFL-01 v3 4.2 (maker titik Lapor insiden); backend memeriksa role aktif + status maker di titik Lapor; UI daftar dan Detail draf. Temuan uji: PJ1-01. Saran lama di INS-01 Tabel R-1 ("untuk laporan yang ia buat sendiri; draf rekan hanya dilihat") tidak lagi sesuai dan perlu ditarik.

## Kesiapan serah ke dev (cek 24 Nov, untuk dilanjutkan 25 Nov)

Belum ada butir berstatus Diserahkan. \[FAKTA: arahan Mino 24 Nov\] adjustment belum dikirim ke dev selama testing staging berjalan. Tabel ini memisahkan butir yang tinggal diserahkan dari butir yang masih tertahan, dan menautkan temuan Uji staging 24 Nov (board Uji Insiden, sheet Temuan) yang dijawab tiap butir.

| ADJ | Siap diserahkan? | Yang menahan | Temuan uji yang dijawab | Yang perlu diputuskan |
| --- | --- | --- | --- | --- |
| ADJ-01 | Belum | Sumber hanya "Keputusan Mino 23 Nov", belum ada DL (dicek di Decision Log 24 Nov: tidak ada baris yang merujuk ADJ-01 s.d. ADJ-08). Bergantung WFL-01 versi baru. | — | Catat DL pemisahan tugas sebagai peringatan, bukan blokir |
| ADJ-02 | Belum | Sama dengan ADJ-01 | — | Ikut DL ADJ-01 |
| ADJ-03 | Belum | Belum ada DL. Masih memuat satu \[USULAN\]: satu dialog gabungan bila ADJ-02 dan ADJ-03 berlaku bersamaan. | — | Putuskan dialog gabungan atau dua dialog |
| ADJ-04 | Belum | Belum ada DL. Bergantung WFL-01 versi baru. \[USULAN\] label "sementara" di Analitik sebenarnya sudah diatur ADJ-07. | — | Hapus \[USULAN\] dan rujuk ADJ-07 |
| ADJ-05 | Belum | Belum ada DL. Perlu Tech Lead: aturan masih berupa constraint basis data (Arsitektur Skema Data Bab 10). | SK1 (SKK hanya membaca saat penutupan) sejalan | Jadwalkan dengan Tech Lead |
| ADJ-06 | Belum | Belum ada DL. Aturan rinci ada di WFL-01 versi baru yang belum ditulis. | — | Tulis bersama WFL-01 |
| ADJ-07 | Belum | Belum ada DL. Contoh level dan kurs di board PD1–PD3 masih menunggu K-2. | RV1-06 terkait (keparahan tidak naik setelah dampak diubah) | Catat DL; cek RV1-06 ke matriks KIN-01 versi 1 |
| ADJ-08 | Belum | Belum ada DL. Nilai awal menunggu K-2 dari SKK. | RV1-06 terkait | Catat DL |
| ADJ-09 | Ya | — (DL-182) | PT1-06: staging masih menampilkan Ganti PIC, Ubah tenggat, Batalkan saat Menunggu penutupan. PT1-07: Kembalikan ke PIC aktif walau alasan kosong (kriteria ditambah 24 Nov). PC4-05. | — |
| ADJ-10 | Ya, untuk tampilan dua ukuran | KPI SKK belum dikonfirmasi, tetapi tidak menahan tampilan | MX4-03: staging menghitung lama penanganan dari registrasi (23 jam 31 menit untuk INS-0001) | Konfirmasi KPI ke SKK |
| ADJ-11 | Ya, setelah teks diselaraskan | Butir menyebut tombol "Tetap ajukan"; sejak MX3-02 (24 Nov, pilihan A) tombolnya "Tandai dan lanjutkan" | MX3-04: cek ganda muncul lagi saat ajukan ulang walau laporan sudah ditandai | Terima saran teks di ADJ-11 |
| ADJ-12 | Belum | Tiga pertanyaan SKK (MoM W3 Action 7); cek Cetak Biru Desain Keamanan Data untuk AI baca dokumen; cek cakupan SOW | MX4-01 (kotak Produksi hilang ditahan) | — |
| ADJ-13 | Sebagian | Cakupan SKK approver dan Detail ditutup menunggu Medco (DL-186, bersama DL-104 dan DL-107) | PT1-04, SK1-08, MX4-05 | Opsi: serahkan bagian checker KKKS lebih dulu, bagian SKK dan Detail ditutup menyusul |
| ADJ-14 | Ya | Isi taksonomi menunggu K-05, tidak menahan perubahan label dan aturan wajib | PC3-05, PT1-05, MX2-06 | — |
| ADJ-15 | Belum | Konflik versi matriks: ADJ-08 (waktu kejadian, tanggal mulai berlaku) vs FR-KIN-05 (sejak disimpan, waktu diajukan). Tiga perilaku LPO masih \[ASUMSI\]. | — | Pilih aturan versi matriks; putuskan tiga \[ASUMSI\] LPO |
| ADJ-16 | Ya, aturan halaman | Aturan halaman tidak tertahan (FR-KIN-19 s.d. 26). Isi awal penyebab dan faktor menunggu K-05; kategori memakai rekap SKK Jan–Jun 2026 dulu | — | Diputus B (KIN-01), DL-192. Cek nomor FR-KIN-19 s.d. 26 dan isi Kesiapan butir ini |
| ADJ-17 | Ya | — (DL-177) | TK-01 s.d. TK-03, MB6-06, RV2-04 | — |
| ADJ-18 | Belum | Tempat pengaturan maker belum diputus: halaman Persetujuan (WFL-01 v3) atau sel Buat matriks (HAK-02, Pejabat punya Buat bawaan). Perlu cek Tech Lead karena mengubah semua modul beralur | PJ1-01 | Konfirmasi konsekuensi: Pejabat yang ingin melapor harus memegang role Pelapor dan Ganti role |

Urutan cek 25 Nov \[USULAN\]:

1. Serahkan paket pertama yang sudah punya DL dan tidak tertahan: ADJ-09, ADJ-10 (tampilan), ADJ-11 (setelah teks), ADJ-14.
2. Catat DL untuk keputusan 23 Nov (ADJ-01 s.d. ADJ-08). Tanpa DL, butir ini tidak traceable dan belum boleh diserahkan.
3. ADJ-01 s.d. ADJ-06 ikut penulisan WFL-01 versi baru; ADJ-05 dibawa ke Tech Lead.
4. Kirim pertanyaan Medco (ADJ-13, DL-104, DL-107) dan SKK (ADJ-10 KPI, ADJ-12, K-2, K-05) dalam satu putaran.

## Kandidat adjustment (belum diputuskan)

Dari MoM Weekly W3 dan transkrip Zoom. Belum boleh dikerjakan.

- **Waktu notifikasi ke SKK:** saat laporan dikirim, atau setelah diperiksa?
- **Kategori K3 dan kasus tanah:** masuk insiden keamanan atau tidak (Pak Doddy)?
- **Istilah:** "gangguan keamanan" atau "insiden"?
- **Konfirmasi bulanan:** tetap ada atau digantikan dashboard yang bisa diekspor?
- **Definisi "tutup"** dan kebutuhan heat map (Pak Sudarsono).
- **Root cause dan keterkaitan ke WP&B** (Pak Noval).
- **Janji AI preventif** (Pak Erlansyah): cek terhadap SOW.
- **AI menyarankan Perbarui dampak dari catatan penanganan** (24 Nov): bila catatan PIC menyebut korban, kerugian, atau operasi berhenti, tampilkan ajakan "Ada info dampak baru, perbarui?". Perlu keputusan cakupan INS-04 dulu. Untuk sekarang akses Perbarui dampak ada di kartu Dampak (Detail PIC) dan di bawah kotak catatan (Tangani), bukan di header atau menu ⋯.
- **Produksi hilang (LPO, Lost Production Opportunity)** (24 Nov). \[FAKTA: MoM W3, transkrip 01:13:48–01:15:27, Pak Nugraha\] KKKS didorong mencantumkan LPO bila bisa dijustifikasi, untuk memperkuat laporan polisi; dampak tidak langsung perlu verifikasi berlapis dengan fungsi di luar Security. \[FAKTA: MoM W3 Action 7\] jenis dampak dan LPO menunggu SKK. Desain sekarang hanya punya satu angka kerugian (kerugian langsung). Diputuskan 24 Nov sebagai ADJ-12.
  - LPO adalah hasil hitung: produksi normal × lama berhenti × harga. PERISAI hanya punya lama berhenti (dari dampak); produksi normal dan harga tidak ada. \[ASUMSI\] SOW tidak mencakup integrasi data produksi KKKS; perlu dicek.
  - Opsi 1, dicatat saja: KKKS menghitung di luar; PERISAI menyimpan nilai, dasar perhitungan, dan lampiran. Paling sederhana; cara hitung antar-KKKS bisa berbeda.
  - Opsi 2, kalkulator bantu: lama berhenti otomatis dari dampak; PIC mengisi produksi normal dan harga; hasil dihitung, bisa ditimpa dengan alasan; bahan hitung tersimpan. Rumus seragam dan mudah diverifikasi. Tempat data: produksi normal diisi per insiden (data induk per aset tidak disarankan karena produksi berubah dan rawan basi); harga minyak dari konfigurasi bulanan Admin SKK, harga gas diisi manual.
  - Opsi 3, otomatis dari data produksi KKKS: paling akurat, butuh integrasi, kemungkinan di luar cakupan.
  - **Usulan PM: gabungan opsi 1 dan 2.** Bagian opsional "Produksi hilang (LPO)" di Data penutupan (di bawah Kerugian akhir) dan Koreksi data setelah ditutup; tidak ada di form lapor dan Perbarui dampak. PIC boleh langsung mengisi hasil + lampiran, atau memakai bantuan hitung. Diisi PIC atau Pejabat, beserta sumber angka (mis. fungsi Produksi). Tidak ikut menghitung saran keparahan; di dashboard menjadi ukuran terpisah, tidak dijumlah ke Kerugian. Bisa dimatikan lewat Konfigurasi Modul (bawaan mati).
  - Pertanyaan untuk SKK: (1) satuan LPO rupiah, volume (bbl/MMSCF), atau keduanya; (2) acuan harga yang dipakai; (3) apakah operasi terganggu sebagian ikut dihitung, dan dengan persentase berapa.

Dari uji staging per peran 24 Nov (board Uji Insiden). Belum boleh dikerjakan:

- Siapa pemeriksa ulang setelah ajukan ulang. Desain PB2 menulis "Pejabat Berwenang sesuai alur" \[ASUMSI\]; INS-02 belum menyebut apakah pemeriksa yang meminta perbaikan atau rantai checker dari awal. Terkait RV1-09.
- Batas waktu perbaikan bagi pelapor. Tugas saya pelapor tidak menampilkan batas (RV1-01). Perlu diputuskan apakah perbaikan punya tenggat; bila ya, berapa dan apa yang terjadi bila lewat.
- Riwayat "Diajukan ulang" beserta isian yang berubah (nilai lama → baru) dan tag "Diubah" di Ringkasan (RV1-10, RV2-03). Perlu dicek apakah INS-01/INS-02 sudah mewajibkan jejak perubahan antar-pengajuan; bila belum, ini adjustment, bukan Bug UI.
- Cakupan AI di rilis ini: panel "Bahan pertimbangan dari insiden serupa" untuk pemeriksa (PJ2-07) dan "Rapikan dengan AI" di isian penutupan PIC (PC2-04). Ikut pertanyaan Medco bersama ADJ-13, DL-104, dan DL-107.
- Keparahan setelah dampak diubah (RV1-06): korban luka ringan 1 orang dan kerugian Rp55 juta tetap Sangat rendah. Cek dulu ke matriks KIN-01 versi 1; bila hasilnya sesuai matriks, ini bukan adjustment.

## Changelog

| Tanggal | Perubahan |
| --- | --- |
| 23 Nov 2026 | Dokumen dibuka. ADJ-01 s.d. ADJ-06 dari keputusan alur persetujuan 23 Nov. Perubahan langsung di INS-02 dan INS-03 dikembalikan ke versi serah terima. |
| 23 Nov 2026 | ADJ-07 (perbarui dampak, perubahan keparahan, koreksi setelah ditutup) dan ADJ-08 (sumbu korban bisa diatur di KIN-01). Kandidat "kerugian boleh menyusul" dijawab ADJ-07. |
| 24 Nov 2026 | ADJ-09 (aksi saat Menunggu penutupan, penilaian tenggat), ADJ-10 (dua ukuran waktu), ADJ-11 (cek laporan ganda saat ajukan ulang), dari review flowchart alur insiden. |
| 24 Nov 2026 | ADJ-12 Produksi hilang (LPO), dengan unggah dokumen + isi otomatis AI sebagai jalan utama. Kandidat LPO dijawab ADJ-12. ADJ-09 s.d. ADJ-11 dirujuk ke DL-182 s.d. DL-184. |
| 24 Nov 2026 | ADJ-13 Ringkasan AI untuk keputusan penutupan (mengganti panel Bahan pertimbangan; dipakai juga SKK approver dan Detail ditutup). Dirujuk ke DL-186. |
| 24 Nov 2026 | ADJ-14 Penyebab utama satu pilihan, Penjelasan penyebab, Faktor pendukung opsional; isian wajib Data penutupan jadi 5. Dari uji staging PC3-05. Dirujuk ke DL-191. |
| 24 Nov 2026 | ADJ-09 dipertegas: PIC juga boleh Tambah tindak lanjut selama Menunggu penutupan (butir Sesudah + 1 kriteria penerimaan). Dari uji staging PC4-05. |
| 24 Nov 2026 | Bagian baru "Kesiapan serah ke dev": status siap/tertahan per butir, temuan uji yang dijawab, dan urutan cek 25 Nov. ADJ-09 ditambah kriteria tombol Kembalikan nonaktif tanpa alasan (PT1-07). Lima kandidat baru dari uji per peran. Saran teks ADJ-11 ("Tandai dan lanjutkan") menunggu diterima. Tercatat: ADJ-01 s.d. ADJ-08 belum punya DL. |
| 24 Nov 2026 | ADJ-15 (parameter KIN-01 dari ADJ-08 dan ADJ-12, konflik versi matriks dicatat) dan ADJ-16 (pemilik daftar kategori, jenis, dan penyebab; usulan KIN-01), keduanya Usulan. Indeks dan tabel Kesiapan diperbarui. |
| 24 Nov 2026 | ADJ-16 diputus Mino: pilihan B, KIN-01 pemilik daftar kategori, jenis, dan penyebab. Status Disepakati, dirujuk ke DL-192. |
| 24 Nov 2026 | ADJ-16 ditulis lengkap tanpa menunggu PLT-06 (PRD PLT-06 tidak pernah ada): FR-KIN-19 s.d. FR-KIN-26 untuk halaman Kategori & jenis insiden dan Penyebab & faktor pendukung, mengikuti pola KAT-01 FR-KAT-01..07; 9 kriteria penerimaan. Syarat cek Tech Lead dihapus. |
| 24 Nov 2026 | Catatan pengecualian: input suara AI dikeluarkan dari INS-04 dan dipindah ke INS-07 (fase 2) dengan mengedit kedua PRD langsung, tanpa butir ADJ. Mino sudah mengabarkan perubahan ini langsung ke dev (24 Nov). Rujukan: claude/keputusan-suara-out-of-scope-24nov.md. |
| 24 Nov 2026 | ADJ-17 (Batalkan pengajuan, DL-177) dan ADJ-18 (draf hanya dilanjutkan sesama maker, DL-179 diperjelas). DL-178 tidak dibuatkan ADJ: pembatasan Arahan SKK ke insiden dieskalasi atau jalur cepat dan saklarnya sudah tertulis di INS-03 FR-INS-59; DL-178 hanya memberi dasar keputusan di atas KD-01. |
| 24 Nov 2026 | ADJ-18 ditambah keputusan akses di luar alur: draf dilihat organisasi sendiri tetapi hanya maker yang mengubah; penunjukan maker/checker/approver dibatasi pada yang punya Insiden · Lihat; 3 kriteria penerimaan baru. Dicatat konflik terbuka: maker di halaman Persetujuan (WFL-01 v3) vs sel Buat matriks (HAK-02). Kesiapan ADJ-18 menjadi Belum. |
