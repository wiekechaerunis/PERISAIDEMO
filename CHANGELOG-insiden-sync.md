# CHANGELOG sinkron menu Insiden ke INS-ADJ + Desain v2 (25 Nov 2026)

Rencana: `docs/insiden-sync/PLAN.md`. Penyimpangan: `DEVIATIONS.md` bagian "Sinkron INS-ADJ + Desain v2" (S-xx).

## 1. Daftar (`/insiden`)

- PA-01: subjudul "Insiden dan kerawanan keamanan di wilayah kerja." untuk semua peran KKKS (board Main).
- PA-02, B-15: menu ⋯ per baris per status dan peran (Main-AksiDraf, Main-AksiTarik, Main-AksiTangani, V11-AksiBuka,
  V11-AksiPenanganan, P11-AksiAmbil). SKK tanpa ⋯; baris tanpa aksi tanpa ⋯. Logika di `rowMenu()` (`logic/list.ts`).
- PA-03: baris Draf (dan "Lanjutkan draf"/"Perbaiki laporan") membuka `/insiden/:no/ubah` → form langkah 1 berisi draf itu.
- PA-04, ADJ-18: Buat laporan hanya untuk role aktif maker (`isMaker`); draf terlihat semua pengguna KKKS organisasi yang sama,
  SKK tidak melihat draf; Hapus draf hanya pembuat (dialog "Hapus draf ini?", toast "Draf dihapus.", `deleteDraft`).
- Status "Minta ditutup" → "Menunggu penutupan" di semua layar (Main, Main-Filter, B-16).
- Pintasan Pejabat "Terlambat" dan "Dieskalasi ke saya" (V11).
- B-16 / Main-Filter: urutan Status (chip), Keparahan (chip), Kategori + Wilayah kerja (dropdown), PIC penanganan (dropdown
  pilih-banyak), Periode kejadian (chip 7/30/90 hari, Tahun ini, Rentang tanggal), Lainnya. Filter WK kini berfungsi.
- Tes: `rowMenu.test.ts` (baru); `lists.test.tsx` diperbarui (label pintasan V11, Kategori jadi dropdown); `e2e/periode.e2e.mjs`
  memakai chip Periode.

## 2. Form Lapor (`/insiden/baru/*`)

- B-1, PA-05: "Buat laporan" + crumb Insiden › Baru sebelum tersimpan; "Ubah insiden" + Draf + crumb Insiden › {nomor} › Ubah
  sesudah Simpan draf (I12, I12s). Rute `/insiden/baru` memulai draf kosong; `/insiden/:no/ubah` memuat draf tersimpan.
- B-2, PA-06: stepper Waktu & lokasi / Dampak / Lampiran / Ringkasan (juga form WhatsApp).
- B-3, PA-07, PA-09: langkah 1 bersection Jenis laporan · Kejadian (Judul → Waktu → Apa yang terjadi? → Sumber informasi) · Lokasi;
  Patokan diisi manual. Pertanyaan "Ada kerugian, korban, atau operasi terganggu?" tetap karena masih ada di board I12.
- B-4, B-5, B-6, PA-08: kartu Pengajuan hanya di Ringkasan (Nomor, Status, Terakhir disimpan); catatan "Setelah diajukan…" dan
  "Keparahan disarankan…" dihapus.
- B-7: footer sticky; langkah 1 Batal, langkah 2–4 Sebelumnya.
- B-8, ADJ-18: Hapus draf (header, hanya pembuat) → dialog "Hapus draf ini?" → daftar + toast "Draf dihapus.".
- B-9: draf hanya tersimpan lewat Simpan draf (`saveDraftNow`); keluar dengan perubahan → "Tinggalkan halaman ini?" (I13k),
  Keluar membuang perubahan termasuk lampiran baru.
- B-10, B-11, ADJ-07: kartu keparahan tanpa "setara"; "Belum diketahui" di kerugian (centang), kondisi operasi, sebaran dampak, dan
  besar data bocor; saran sementara / "Belum bisa disarankan" + "Wajib dipilih" / "Dipilih pelapor" (I13u, I13ue).
- B-12: Penanganan dengan chip Lainnya (Sebutkan, maks. 50) dan Tindakan awal (opsional, maks. 500).
- B-13: Ringkasan memuat Apa yang terjadi?, Sumber informasi, Jenis, Patokan, WK, koordinat, Penanganan + Tindakan awal;
  "Diperiksa oleh" dan "Yang terjadi saat Anda menekan Ajukan" tidak lagi di halaman.
- Tes: `formSync.test.tsx` (baru), `step34.test.tsx` diperbarui (isian wajib baru di langkah 1, bagian pra-ajukan pindah ke modal).

## 3. Modal Ajukan (langkah Ringkasan)

- B-14 (I14m, I14mb, I14mk, I14ma): Ajukan membuka "Ajukan laporan?" berisi Nomor/Judul/Keparahan, Diperiksa oleh, catatan "Isi dan
  lampiran terkunci sampai diverifikasi." (+ "SKK Migas langsung diberi tahu" untuk Tinggi/Kritis), Batal / Ajukan laporan.
- `ReviewerSelect` diganti combobox pilih-banyak berchip (× hapus): cari nama atau jabatan, "Pilih semua" + hitungan, daftar
  bercentang dengan jabatan dan "(Anda)". Mode modal boleh kosong → "Pilih minimal satu pemeriksa." + tombol nonaktif.
- ADJ-01: pengaju tetap muncul di pilihan pemeriksa (`reviewerOptions`); bila terpilih tampil peringatan "Anda juga termasuk
  pemeriksa…", tidak diblokir. Demo: `?pemeriksa=sendiri` di Ringkasan.
- "Diperiksa oleh" yang dipilih disimpan di insiden (`reviewers`).
- Tes: `reviewerSelect.test.tsx` ditulis ulang (perilaku ADJ-01 menggantikan aturan lama "pengaju tidak muncul"); `step34.test.tsx`
  menambah kasus modal.

## 4. Detail + tab Riwayat (`/insiden/:no`, semua peran)

- B-18, PA-10: tab Detail | Riwayat (n) di bawah app bar (badge lime saat aktif, `?tab=riwayat`) di Detail Pelapor, Pemeriksaan,
  Penanganan PIC, Pejabat (Dalam penanganan / Menunggu penutupan / Ditutup), dan SKK. Crumb "Insiden › {nomor}"; header hanya status.
- B-19, PA-12: Ringkasan berisi Keparahan + keterangan + alasan, Waktu kejadian, Waktu registrasi, Batas pemeriksaan, Diperiksa oleh
  (nama + menunggu sejak), PIC. "Sudah menangani" dan "Pelapor" hanya di kartu utama.
- B-20: kartu utama memuat Apa yang terjadi?, Yang terdampak, Tindakan awal, Sumber informasi; kartu Lokasi terpisah di kolom kanan
  (InsLokasi). PA-13: "Terkunci sampai diverifikasi" (desktop, review, mobile). Kartu "Pemeriksa meminta perbaikan" di kanan (I15 rev).
- PA-11, B-10: label "setara Insignificant…Catastrophic" dihapus dari semua layar Insiden (kartu isi, review, keputusan, kerawanan,
  mobile). Halaman Konfigurasi › Matriks keparahan tidak diubah.
- PA-15, B-21: "Jejak audit lengkap" kini tautan ke `/insiden/:no/jejak-audit` (halamannya di alur 13).

## 5. Batalkan pengajuan

- PA-14, ADJ-17 (S07, MS07): tombol header dan menu ⋯ "Batalkan pengajuan"; dialog "Batalkan pengajuan?" dengan alasan wajib
  (maks. 500); toast "Pengajuan dibatalkan. Insiden kembali menjadi draf."; toast gagal "Laporan sudah diproses Pejabat Berwenang
  dan pengajuannya tidak bisa dibatalkan."; Riwayat "Pengajuan dibatalkan" + alasan. Teks di Ringkasan WA, mobile, dan email EI.10
  ikut diganti. `?aksi=batalkan` membuka dialog langsung (dari menu ⋯ daftar).
