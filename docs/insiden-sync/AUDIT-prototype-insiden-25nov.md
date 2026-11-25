# Audit prototype Insiden (localhost:5200) vs INS-ADJ + Desain v2 · 25 Nov 2026

Acuan (dipilih Mino 25 Nov): **INS-ADJ** (`docs/INS-ADJ.md`, butir berstatus Disepakati) + **Desain v2** (canvas "PERISAI · Security Incident Management · Desain v2", termasuk keputusan desain 23–24 Nov di bagian B). Sheet Temuan hanya cek silang.

Cara cek: dibuka di 1366 px sebagai Budi Santoso (Pelapor), Sari Wulandari (Pejabat Berwenang), dan Hendra Wijaya (Pengawas SKK). Yang dicek: daftar, form Lapor langkah 1, Detail Pelapor, dialog Tarik kembali, Detail + Tangani + Data penutupan PIC, daftar dan Pemeriksaan Pejabat, daftar SKK. Layar lain belum dibuka. Aturannya tetap tertulis di bagian B dan C, dan wajib dicek Claude Code sendiri.

## A. Temuan langsung di prototype

| ID | Layar · route | Sekarang | Seharusnya | Rujukan |
|---|---|---|---|---|
| PA-01 | Daftar · /insiden (semua peran KKKS) | Subjudul "Kejadian yang sudah terjadi dan menimbulkan kerugian…" | "Insiden dan kerawanan keamanan di wilayah kerja." | Main |
| PA-02 | Daftar · Pelapor & Pejabat | Tidak ada menu ⋯ per baris | Menu ⋯ per status dan peran (B-12). SKK tanpa ⋯ | Main-Aksi*, V11-Aksi*, P11-AksiAmbil |
| PA-03 | Daftar · baris Draf | Membuka /insiden/baru/kejadian (langkah 2) | Membuka langkah 1 mode "Ubah insiden" | I12s |
| PA-04 | Daftar · Pejabat | Tombol "Buat laporan" tampil | Disembunyikan bila role aktif bukan maker | ADJ-18 butir 6 |
| PA-05 | Form · langkah 1 | Judul "Laporan baru" + badge Draf, crumb "Insiden › Laporan baru" | Sebelum tersimpan: "Buat laporan", crumb "Insiden › Baru", tanpa badge | B-1, I12 |
| PA-06 | Form · stepper | Temuan / Kejadian & dampak / Lampiran / Ringkasan | Waktu & lokasi / Dampak / Lampiran / Ringkasan | B-2 |
| PA-07 | Form · langkah 1 | Ada pertanyaan "Ada kerugian, korban, atau operasi terganggu?"; urutan Waktu → Judul; tanpa "Apa yang terjadi?" dan "Sumber informasi" | Section Jenis laporan · Kejadian (Judul → Waktu → Apa yang terjadi? → Sumber informasi) · Lokasi. Pertanyaan Ya/Tidak/Belum tahu dihapus kalau tidak ada di I12 | B-3, I12 |
| PA-08 | Form · langkah 1–3 | Kartu "Pengajuan" (Nomor, Status, Tercatat di, Diperiksa oleh) di kolom kanan | Dihapus di langkah 1–3; hanya ada di Ringkasan (Nomor, Status, Terakhir disimpan) | B-4 |
| PA-09 | Form · Patokan lokasi | "Terisi otomatis dari lokasi yang dipilih" | Patokan diisi manual | B-3 |
| PA-10 | Detail · semua peran | Riwayat berupa kartu di bawah isi | Tab Detail \| Riwayat (n) di bawah app bar | B-18 (DT-04) |
| PA-11 | Detail, Pemeriksaan, Penanganan | "Keparahan awal: Tinggi · setara Significant" | Tanpa label "setara …" di mana pun | B-10 |
| PA-12 | Detail · kolom kanan | Lokasi di kartu utama; Ringkasan memuat Sudah menangani dan Pelapor | Kartu Lokasi terpisah di bawah Ringkasan. Ringkasan: Keparahan + alasan, Waktu kejadian, Waktu registrasi, Batas pemeriksaan, Diperiksa oleh (nama + menunggu sejak), PIC | B-19, B-20 |
| PA-13 | Detail · lampiran | "Terkunci sampai diperiksa" / "Terkunci" | "Terkunci sampai diverifikasi" | B-20 |
| PA-14 | Detail Pelapor · Menunggu pemeriksaan | Tombol dan dialog "Tarik kembali", "Tarik kembali jadi draf?", tanpa isian alasan | "Batalkan pengajuan" + isian Alasan wajib (maks. 500) + teks ADJ-17 | ADJ-17, S07 |
| PA-15 | Detail PIC · Riwayat | "Jejak audit lengkap" berupa tombol panel | Tautan ke halaman Jejak audit, tersaring Objek = nomor insiden | B-21, P34 |
| PA-16 | Penanganan · Data penutupan | "Penyebab*" (catatan "taksonomi PLT-06"), "Penjelasan · opsional", "Faktor penyebab*", "0 dari 6 isian wajib" | Penyebab utama (satu pilihan), Penjelasan penyebab (aturan wajib tetap), Faktor pendukung · opsional, isian wajib 5. Catatan daftar menyebut KIN-01 | ADJ-14, ADJ-16 |
| PA-17 | Penanganan · Data penutupan | Tidak ada bagian Produksi hilang | Bagian Produksi hilang (LPO) opsional + unggah laporan produksi → saran AI | ADJ-12, LPOSec, LPOm-TerisiAI |
| PA-18 | Penanganan | Tidak ada aksi Perbarui dampak | Perbarui dampak selama penanganan; naik langsung berlaku, turun perlu konfirmasi | ADJ-07, PD1, PD2, PD3 |

## B. Keputusan desain 23–24 Nov (wajib diterapkan; kebanyakan belum dicek satu per satu di prototype)

**Form Lapor**
- B-1 Judul langkah 1 sebelum tersimpan: "Buat laporan", crumb "Insiden › Baru", tanpa badge. Setelah draf tersimpan (langkah 1–4): "Ubah insiden" + badge Draf, crumb "Insiden › {nomor} › Ubah". Form dari WhatsApp: crumb WA tetap.
- B-2 Stepper: Waktu & lokasi / Dampak / Lampiran / Ringkasan.
- B-3 Langkah 1: section Jenis laporan · Kejadian (Judul → Waktu → Apa yang terjadi? → Sumber informasi) · Lokasi (kartu peta + Patokan manual). Dari WA: Sumber informasi otomatis "Laporan pihak lain".
- B-4 Kartu Pengajuan di kolom kanan langkah 1–3 dihapus. Tetap ada di Ringkasan (Nomor, Status, Terakhir disimpan).
- B-5 Catatan "Setelah diajukan, laporan dikunci untuk pelapor…" di kolom kanan langkah Lampiran dihapus.
- B-6 Kartu catatan "Keparahan disarankan dari dampak…" dihapus.
- B-7 Footer desktop: langkah 1 = Batal di kiri; langkah 2–4 = Sebelumnya (tanpa ikon) di kiri, tanpa Batal. Simpan draf + aksi utama di kanan. Footer sticky.
- B-8 Hapus draf: setelah draf tersimpan, tombol "Hapus draf" (destruktif, ikon tempat sampah) di header kanan form. Membuka dialog "Hapus draf ini?" (Nomor/Judul/Lampiran; Batal / Hapus draf). Sesudahnya kembali ke daftar + toast "Draf dihapus.". Hanya untuk pembuat draf (ADJ-18).
- B-9 Draf hanya tersimpan lewat Simpan draf (Ajukan = simpan + ajukan). Ada perubahan belum disimpan lalu klik kembali/crumb/menu/Batal → modal "Tinggalkan halaman ini?" (Keluar sekunder / Tetap di sini primer). Lampiran yang diunggah sebelum Simpan draf dibuang bila keluar.
- B-10 Label "setara Insignificant…Catastrophic" dihapus dari semua layar.
- B-11 Dampak belum diketahui (ADJ-07):
  - kerugian punya centang "Belum diketahui, masih dihitung" (isian nonaktif);
  - kondisi operasi punya chip "Belum diketahui" (durasi disembunyikan);
  - sebaran dampak dan besar data bocor punya chip "Belum diketahui".
  - Bila sebagian belum diketahui: saran keparahan dihitung dari yang diketahui, tag "Otomatis · sementara", ditambah kalimat "Saran sementara: bisa naik setelah dampak yang belum diketahui diperbarui selama penanganan."
  - Bila tidak ada satu pun yang diketahui: "Belum bisa disarankan" + tag "Wajib dipilih", pelapor memilih sendiri (tag "Dipilih pelapor"). Berikutnya tanpa level → kotak merah + "Pilih tingkat keparahan dulu sebelum lanjut."
  - Ringkasan menulis "Belum diketahui".
- B-12 Penanganan oleh pelapor: chip + Lainnya + Tindakan awal (opsional).
- B-13 Ringkasan: data lengkap (Apa yang terjadi?, Sumber informasi, Patokan, WK, Penanganan + Tindakan awal, Jenis bila ada). "Diperiksa oleh" dan "Yang terjadi saat Anda menekan Ajukan" dihapus dari halaman.
- B-14 Modal "Ajukan laporan?":
  - isi: ringkasan Nomor/Judul/Keparahan; Diperiksa oleh*; info "Isi dan lampiran terkunci sampai diverifikasi." (+ "SKK Migas langsung diberi tahu" untuk Tinggi/Kritis); tombol Batal / Ajukan laporan.
  - Diperiksa oleh = combobox pilih-banyak berisi chip per orang (× hapus). Saat terbuka: cari, "Pilih semua · {judul}" + hitungan, daftar bercentang (nama, jabatan, "(Anda)").
  - Kosong → "Pilih minimal satu pemeriksa." dan tombol nonaktif.
  - Checker individu → nama saja + "Ditetapkan admin di alur persetujuan insiden".
  - Pelapor juga pemeriksa → penanda "(Anda)" + peringatan, tidak diblokir (ADJ-01). Board I14m, I14mb, I14mg, I14mi, I14mk, I14ma.

**Daftar**
- B-15 Menu ⋯ per baris ("Lihat detail" tidak dipakai, karena klik baris membuka detail; baris tanpa aksi tidak punya ⋯):
  - Pelapor: Draf → Lanjutkan draf, Hapus draf (merah); Menunggu pemeriksaan → Batalkan pengajuan (merah); Perlu perbaikan → Lihat catatan pemeriksa, Perbaiki laporan; PIC = saya → Tangani insiden.
  - Pejabat: Menunggu pemeriksaan → Periksa laporan; Dalam penanganan → Ganti PIC, Ubah tenggat; Menunggu penutupan → Periksa penutupan; Ditutup → Buka kembali.
  - PIC grup belum diambil → Ambil alih penanganan.
  - SKK: tanpa ⋯.
- B-16 Filter (popover 420px): Status chip pilih-banyak (termasuk Menunggu penutupan); Keparahan chip; Kategori dan WK dropdown; PIC penanganan pilih-banyak (Saya dan Belum ada PIC paling atas); Periode chip (7/30/90 hari, Tahun ini, Rentang tanggal); Lainnya checkbox (Lewat tenggat, Dieskalasi, Ditandai kemungkinan ganda). Footer "Hapus filter" / "Tampilkan N insiden". Chip filter aktif + "Hapus semua" di bawah pintasan.
- B-17 Kosong: ilustrasi dokumen + tombol sekunder.

**Detail (semua peran)**
- B-18 Tab Detail | Riwayat (n) di bawah app bar (badge lime saat aktif). Crumb "Insiden › {nomor}". Header hanya menampilkan status. Berlaku di Detail Pelapor, Pemeriksaan, Penanganan, Menunggu penutupan, Periksa penutupan, Ditutup, dan layar SKK.
- B-19 Panel Ringkasan: Keparahan + "saran dari dampak · belum diperiksa" + alasan, Waktu kejadian, Waktu registrasi, Batas pemeriksaan, Diperiksa oleh (nama + menunggu sejak), PIC. "Sudah menangani" dan "Pelapor" hanya di kartu utama.
- B-20 Kartu utama: Apa yang terjadi?, Yang terdampak, Tindakan awal. Kartu **Lokasi** terpisah di kolom kanan di bawah Ringkasan (peta, Lokasi, Patokan, Kab/kota, WK, Koordinat, Buka di peta). Banner "Menunggu pemeriksaan …" dihapus. Label lampiran "Terkunci sampai diverifikasi".
- B-21 "Jejak audit lengkap" di tab Riwayat = tautan ke halaman Jejak audit (crumb Insiden › nomor › Jejak audit; pil "Objek: {nomor}"; kolom Waktu, Pelaku (+organisasi), Sebagai, Modul, Aksi, Objek, Hasil; Filter, Ekspor CSV; panel samping Detail jejak audit).

**Penutupan (24 Nov)**
- B-22 Banner status di kolom utama dihapus. Status menjadi kartu di atas kolom kanan: Menunggu penutupan → kartu info "Menunggu ditutup"; Ditutup → kartu sukses "Insiden ditutup". Isi laporan dan lampiran tidak dilipat lagi.
- B-23 Urutan kolom utama:
  - Menunggu penutupan (P17): Data penutupan → Isi laporan → Lampiran;
  - Periksa penutupan (P22): Bahan pertimbangan → Data penutupan → Tindak lanjut → Isi laporan;
  - Ditutup (P24, P35): Data penutupan → Tindak lanjut → Isi laporan.

## C. Butir INS-ADJ yang berdampak ke prototype

Teks lengkap, tabel sebelum/sesudah, dan kriteria penerimaan ada di `docs/INS-ADJ.md`. Kerjakan butir berstatus **Disepakati**. Butir **Usulan** (ADJ-15) dan bagian "Kandidat adjustment" tidak dikerjakan.

| ADJ | Yang harus terlihat di prototype |
|---|---|
| ADJ-01 | Pengaju juga pemeriksa: peringatan di modal Ajukan (B-14) dan di layar Pemeriksaan saat ia memutus. Tidak diblokir; tercatat di Riwayat |
| ADJ-02 | PIC juga penyetuju penutupan: peringatan di Periksa penutupan, tidak diblokir |
| ADJ-03 | Pemeriksa insiden juga menyetujui penutupan: peringatan di Periksa penutupan |
| ADJ-04 / 05 / 06 | Hanya kalau prototype punya halaman Persetujuan: nilai awal tiga lapis; SKK bukan approver penutupan secara bawaan (cukup notifikasi); pilihan "terapkan ke laporan berjalan" saat menyimpan. Kalau tidak ada halamannya, lewati dan catat |
| ADJ-07 | Isian "Belum diketahui" (B-11) dan aksi **Perbarui dampak** selama penanganan (naik langsung berlaku; turun perlu konfirmasi Pejabat; koreksi setelah ditutup tanpa buka kembali). Board PD1, PD1m, PD2, PD3 |
| ADJ-09 | Menunggu penutupan: aksi hanya Setujui, Kembalikan ke PIC, Tambah tindak lanjut. Kembalikan nonaktif sampai Alasan terisi. Tenggat dinilai saat Ajukan penutupan |
| ADJ-10 | Ringkasan penutupan dan Ditutup menampilkan Lama penanganan (disetujui → ditutup) dan Total waktu (registrasi → ditutup) |
| ADJ-11 | Ajukan ulang: cek laporan ganda hanya bila lokasi, waktu, atau kategori berubah; kecocokan lama tidak ditanyakan lagi |
| ADJ-12 | Bagian Produksi hilang (LPO) opsional di Data penutupan: unggah laporan produksi → AI mengisi saran (tag sumber AI); terpisah dari kerugian dan level |
| ADJ-13 | Panel AI terpisah di Periksa penutupan diganti tombol "Ringkasan untuk keputusan" (5 poin, dibuka atas permintaan). Temuan AI ditempel di data terkait |
| ADJ-14 | Penyebab utama (satu pilihan), Penjelasan penyebab, Faktor pendukung (opsional); isian wajib 5 |
| ADJ-16 | Daftar kategori, jenis, dan penyebab berasal dari Konfigurasi Insiden (KIN-01). Hapus rujukan "PLT-06" dari teks |
| ADJ-17 | "Tarik kembali" → "Batalkan pengajuan" di semua teks; toast dan Riwayat sesuai tabel ADJ-17 |
| ADJ-18 | Draf: semua pengguna KKKS organisasi yang sama boleh melihat; hanya role aktif maker (bawaan Pelapor) yang bisa Lanjutkan; Hapus hanya pembuat; non-maker tidak melihat Buat laporan; SKK tidak melihat draf |

## D. Belum dicek (wajib dicek Claude Code)
- Kerawanan (daftar, form, Naikkan jadi insiden).
- Jalur WhatsApp (form dari WA, panel Pesan asli).
- Laporan ganda (Gabung, Tandai).
- Minta revisi → Perlu perbaikan → Ajukan ulang.
- Penanganan grup (Ambil alih).
- Eskalasi.
- Buka kembali.
- Layar SKK (detail, Beri arahan, Periksa penutupan SKK).
- Konfigurasi Insiden.
- Semua state galat/kosong/memuat (S*, PS*, VS*).
