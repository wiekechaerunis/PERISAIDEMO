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
