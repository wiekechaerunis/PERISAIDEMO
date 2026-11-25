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

## 8. Data penutupan (PIC, `/insiden/:no/tangani`)

- PA-16, ADJ-14: "Penyebab utama" (satu pilihan, teks bantuan ADJ-14), "Penjelasan penyebab" (wajib bila Tinggi/Kritis, dihitung
  bersama Penyebab utama), "Faktor pendukung · opsional"; isian wajib 6 → 5 di progres, validasi, tooltip, dan workflow
  `requestClosure`. Layar baca (Pejabat, PIC, SKK, dialog Tutup) memakai label baru dan "–" bila Faktor pendukung kosong.
- ADJ-16: catatan daftar menyebut Konfigurasi Insiden (KIN-01); rujukan "PLT-06" dihapus dari teks dan komentar.
- PA-17, ADJ-12 (LPOSec, LPOm-TerisiAI): bagian "Produksi hilang (LPO) · opsional" di bawah Kerugian akhir: Tidak ada / Ada /
  Belum dihitung; Ada → "Unggah laporan produksi" (AI mock mengisi jenis, produksi normal, sumber angka dengan tag "AI · Perlu
  dicek"; harga memakai harga acuan) atau "Isi manual"; volume dan nilai dihitung (200 bbl/hari × 6 jam × US$70 = 50 bbl,
  US$3.500). Ada tanpa sumber angka atau dokumen menahan Ajukan penutupan. LPO tampil di Data penutupan layar baca.

## 9. Menunggu penutupan

- ADJ-09: Pejabat tanpa menu Aksi lain (Ganti PIC, Ubah tenggat, Eskalasi disembunyikan); tombol Kembalikan nonaktif sampai
  Alasan terisi (uji PT1-07). PIC tetap bisa Tambah tindak lanjut selama Menunggu penutupan (TlCard).
- B-22, B-23 (P17): banner diganti kartu "Menunggu ditutup" di atas kolom kanan; urutan Data penutupan → Isi laporan → Lampiran,
  tidak dilipat; Riwayat di tab.

## 10. Periksa penutupan (Pejabat, P22)

- ADJ-13: panel "Bahan pertimbangan" diganti tombol "Ringkasan untuk keputusan" (tertutup bawaan) berisi 5 poin: Kejadian, Yang
  dilakukan (+ Lihat jejak), Dampak akhir, Masih berjalan setelah ditutup, Perlu dicek (jumlah + daftar + Lihat; "Tidak ada yang
  perlu dicek" bila kosong); footer AI + Membantu?.
- ADJ-02, ADJ-03: Tutup insiden oleh PIC atau pemeriksa yang sama → satu dialog peringatan ("Anda PIC insiden ini. Tetap tutup?" /
  "Anda juga memeriksa laporan ini. Tetap tutup?" / gabungan), tidak memblokir; Riwayat mencatat "ditutup sendiri" / "diperiksa dan
  ditutup orang yang sama". Catatan perhatian juga tampil di kartu status.
- ADJ-10: Lama penanganan (disetujui → sekarang/ditutup) dan Total waktu (registrasi → sekarang/ditutup) di kartu status.
- B-23: urutan Ringkasan untuk keputusan → Data penutupan → Tindak lanjut → Isi laporan; kartu Lokasi di kanan.

## 11. Ditutup (P24, P35)

- B-22: banner "Ditutup …" dihapus; kartu sukses "Insiden ditutup" di atas kolom kanan berisi Ditutup, Lama penanganan, Total
  waktu (ADJ-10), Tenggat PIC (dinilai saat Ajukan penutupan, ADJ-09), tindak lanjut berjalan, batas Buka kembali.
- B-23: Data penutupan → Tindak lanjut → Isi laporan (tidak dilipat). Sama untuk tampilan SKK (P35).

## 7. Penanganan (PIC) dan Perbarui dampak

- PA-18, ADJ-07 (PD1, PD1m, PD2): aksi "Perbarui dampak" di kartu Dampak Detail PIC (label "Dampak saat ini · Sementara") dan di bawah
  kotak catatan halaman Tangani. Dialog berisi Kondisi operasi (+ Belum diketahui), Kondisi korban, Perkiraan kerugian (+ Belum
  diketahui), Alasan atau sumber info (min. 10 karakter) dan pratinjau akibat level. `workflow.impact.ts`:
  naik → langsung berlaku, SKK diberi tahu bila Tinggi/Kritis, tenggat = min(tenggat lama, kenaikan + tenggat level baru);
  turun → level lama tetap, Pejabat mendapat kartu "Konfirmasi penurunan level"; diperbarui Pejabat → langsung tanpa konfirmasi.
  Kenaikan oleh PIC memunculkan kartu Pejabat "Level naik ke …" dengan "Kembalikan ke …" (alasan wajib). Riwayat mencatat nilai
  sebelum → sesudah dan alasan.
- Ambil alih untuk PIC grup tetap memakai alur yang ada (P12g); menu ⋯ daftar memuat "Ambil alih penanganan".

## 11b. Koreksi data setelah ditutup (PD3)

- ADJ-07 butir 8: tombol "Koreksi data" di kartu "Insiden ditutup" (Pejabat) → dialog Kerugian final + alasan; status tetap Ditutup,
  Riwayat mencatat sebelum → sesudah, SKK diberi tahu bila Tinggi/Kritis.
