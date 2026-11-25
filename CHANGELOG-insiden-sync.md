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

## 13. Jejak audit (P34)

- B-21, PA-15: halaman `/insiden/:no/jejak-audit` (dibuka dari "Jejak audit lengkap" di tab Riwayat): crumb Insiden › {nomor} ›
  Jejak audit, "Periode: Sejak dibuat", pil "Objek: {nomor}" + Hapus filter (semua jejak dalam cakupan peran), kolom Waktu, Pelaku
  (+organisasi), Sebagai, Modul, Aksi, Objek, Hasil, tombol Filter dan Ekspor CSV, panel samping "Detail jejak audit".

## 6. Pemeriksaan (Pejabat) dan ajukan ulang

- ADJ-01 (V12s): bila pemeriksa = pengaju, banner peringatan di layar Pemeriksaan dan konfirmasi "Anda yang melaporkan insiden ini.
  Tetap periksa?" sebelum Setujui atau Minta revisi; tidak diblokir; Riwayat mencatat "Diperiksa sendiri". Demo: `?pelapor=sendiri`.
- ADJ-11 (PB2, PB3): Ringkasan laporan Perlu perbaikan memuat catatan pemeriksa, Waktu registrasi (tetap), Diperiksa ulang; tombol
  "Ajukan ulang". Cek laporan mirip hanya bila lokasi, waktu kejadian, atau kategori berubah; dialog "Ada laporan mirip setelah Anda
  mengubah …" dengan "Kembali ubah" / "Tandai dan lanjutkan"; kecocokan yang sudah ditandai disimpan dan tidak ditanyakan lagi.
  Nomor dan waktu registrasi tidak berubah; Riwayat "Mengajukan ulang laporan".
- Setujui, Minta revisi, Tolak (Batalkan insiden), dan laporan ganda (Gabung, Tautkan) memakai alur yang sudah ada.

## 12. SKK

- Tanpa menu ⋯ di daftar (B-15), tidak melihat draf (ADJ-18: daftar dan akses langsung), tab Detail | Riwayat di layar SKK (P31,
  P35, P36), status penutupan jadi kartu dan urutan B-23 di P35. Persetujuan penutupan SKK (P36) hanya muncul bila dikonfigurasi
  (`?persetujuan=skk`); bawaannya SKK cukup diberi tahu (ADJ-05). Beri arahan dan notifikasi memakai alur yang ada.

## 14. Konfigurasi Insiden (KIN-01)

- ADJ-16: dua baris baru di Konfigurasi Modul › Insiden: "Kategori & jenis insiden" (`/konfigurasi/kategori-insiden`, kode KI01…,
  jenis KI02-01…, status, Dipakai di N insiden, Terakhir diubah Sistem, catatan FR-KIN-19) dan "Penyebab & faktor pendukung"
  (`/konfigurasi/penyebab-insiden`, PN01…, FP01…). Daftar yang sama dipakai form lapor dan Data penutupan.
- ADJ-04, ADJ-05, ADJ-06: prototype tidak punya halaman Persetujuan; tidak dikerjakan (lihat DEVIATIONS S-28).

## 15. State galat, kosong, dan memuat

- B-17 (S09): daftar kosong kini di dalam kartu daftar (toolbar Daftar insiden, cari, Filter), ilustrasi dokumen, teks "Bila
  terjadi, laporkan dari sini atau dari pesan WhatsApp.", tombol sekunder Buat laporan; header tetap punya Buat laporan.
- S08 (Memuat), S10 (Filter kosong), S11 (Gagal dimuat), S12 (Terbatas), VS3/VS4 (review), PS2/PS3/PS8/PS9 (penanganan) dicek ulang
  terhadap canvas; teks sudah sama dan tidak diubah.

## Checklist penerimaan

Bukti: route + peran demo (Menu akun). Diverifikasi dengan tes otomatis (nama berkas) dan pengecekan di browser 1366 px.

- [x] PA-01..PA-18 selesai untuk desktop: PA-01..04 (alur 1, `/insiden`, Pelapor/Pejabat), PA-05..09 (alur 2, `/insiden/baru/*`,
  Pelapor), PA-10..13, PA-15 (alur 4, `/insiden/:no`, semua peran), PA-14 (alur 5), PA-16..17 (alur 8, `/insiden/:no/tangani`, PIC),
  PA-18 (alur 7, `/insiden/INS-SEN-2026-0010`, PIC). Mobile belum (DEVIATIONS S-08, S-13, S-23).
- [x] Tidak ada teks "Tarik kembali", "setara", atau "PLT-06" di kode `/insiden/**` (grep; sisa hanya di komentar riwayat dan
  `src/dev/canvas.json` salinan indeks board) dan di layar yang dicek. `detail.test.tsx`, `formSync.test.tsx` memeriksa "setara".
- [x] Stepper Waktu & lokasi / Dampak / Lampiran / Ringkasan; "Buat laporan" sebelum tersimpan, "Ubah insiden" + Draf sesudahnya
  (`/insiden/baru`, Pelapor; `formSync.test.tsx`).
- [x] Kartu Pengajuan hanya di Ringkasan (`/insiden/baru/ringkasan`).
- [x] Footer form sesuai B-7 dan sticky (dicek di browser).
- [x] Modal "Tinggalkan halaman ini?" saat keluar dengan perubahan belum disimpan (dicek di browser: ketik Judul → klik menu Insiden).
- [x] "Belum diketahui" di keempat isian dampak, saran sementara, dan "Belum bisa disarankan" (`formSync.test.tsx`).
- [x] Modal Ajukan: combobox pilih-banyak, validasi kosong, peringatan "(Anda)" (`step34.test.tsx`, `?pemeriksa=sendiri`).
- [x] Menu ⋯ per baris sesuai B-15 per peran; SKK tanpa ⋯ (`rowMenu.test.ts`, `/insiden` Pelapor/Pejabat/PIC/Pengawas).
- [x] Tab Detail | Riwayat (n) di semua layar detail; kartu Lokasi terpisah; Ringkasan B-19 (`detail.test.tsx`, `pic.test.tsx`,
  `skk.test.tsx`).
- [x] "Jejak audit lengkap" membuka halaman Jejak audit tersaring nomor insiden (`jejakAudit.test.tsx`).
- [x] Batalkan pengajuan: alasan wajib (maks. 500), status kembali Draf, toast dan Riwayat ADJ-17 (`detail.test.tsx`,
  `workflow.test.ts`, `formB.test.tsx`).
- [x] Perbarui dampak: naik langsung berlaku, turun menunggu konfirmasi Pejabat, tercatat di Riwayat (`workflow.impact.test.ts`).
- [x] Data penutupan: Penyebab utama tunggal, Faktor pendukung opsional, 5 isian wajib, Produksi hilang opsional dengan saran AI
  (`closureSync.test.ts`, `pic.test.tsx`).
- [x] Menunggu penutupan: Pejabat hanya Setujui (Tutup insiden) / Kembalikan ke PIC / Tambah tindak lanjut; Kembalikan nonaktif
  sampai Alasan terisi (`closure.test.tsx`).
- [x] Periksa penutupan: peringatan ADJ-02/03 dan tombol "Ringkasan untuk keputusan" tanpa panel AI terpisah (`closure.test.tsx`).
- [x] Lama penanganan dan Total waktu tampil di Periksa penutupan dan Ditutup (`closure.test.tsx`; P35 SKK).
- [x] Status penutupan jadi kartu di kolom kanan; urutan kolom utama sesuai B-23 (Pejabat, PIC, SKK).
- [x] Draf: rekan satu organisasi bisa melihat; hanya maker bisa Lanjutkan; Hapus hanya pembuat; non-maker tanpa Buat laporan; SKK
  tidak melihat draf (`rowMenu.test.ts`, `detailLogic.accessOf`).
- [x] Tidak ada error di console di layar yang dicek di browser (daftar, form, detail Pelapor, detail PIC + Perbarui dampak).

## 16. Periksa penutupan dan Ditutup 1:1 board (P22, P22r, P22c, P24)

- `components/closure/P22Parts.tsx` + CSS board (`s2-*`, `rk-*`) di `closure.css`.
- P22: kartu "Ringkasan untuk keputusan" (.rk, tertutup bawaan dengan "Ringkas untuk saya", terbuka "Tutup"): 4 poin berikon (Kejadian,
  Yang dilakukan + "Lihat jejak · N langkah", Dampak akhir, Masih berjalan setelah ditutup), kotak "Perlu dicek" dengan tombol Lihat
  yang menyorot data (in-hl), footer jempol. "Tidak ada yang perlu dicek" bila kosong (ADJ-13).
- Hasil penanganan: KPI Kerugian akhir, Produksi hilang, Lama penanganan + Total (ADJ-10), Proses hukum; Ringkasan penanganan dengan
  kalimat klaim disorot dan tanda "AI · Belum cocok" + "Lihat tindak lanjut"; Penyebab, Yang menangani, Bukti. P22c: tanpa tanda.
- Urutan: Ringkasan → Isi laporan → Lampiran laporan awal → Hasil penanganan → Tindak lanjut; kanan: Butuh persetujuan Anda (Batas
  putusan, Diajukan, Tenggat PIC, Kesiapan, Kontrak, Catatan) → Info laporan → Lokasi → Kondisi sekitar (terlipat).
- P24: "Ringkasan insiden" 4 poin tanpa Perlu dicek, Hasil penanganan dengan Koreksi data, kartu kanan "Ditutup", Info laporan, Lokasi.
- Kartu persetujuan tidak sticky; Lokasi di bawah Tenggat penanganan pada Detail Dalam penanganan (permintaan pengguna).
- P35 (SKK, Ditutup, hanya baca): susunan sama dengan P24, tanpa Koreksi data; kartu Tindak lanjut SKK hanya menampilkan yang
  selesai + "N masih berjalan. Rinciannya tampil setelah selesai diperiksa PIC insiden."; kartu Ditutup tanpa Buka kembali; Info laporan
  dengan baris KKKS (organisasi + WK) dan tanpa Terkait; Lampiran laporan awal terlipat.
- P33 (Pejabat, Dalam penanganan, ada arahan SKK): kartu kanan "Arahan baru dari SKK" (kutipan, Pengawas SKK + waktu, Atas eskalasi,
  Tenggat + sisa, tombol Jadikan tindak lanjut), Lokasi, Info laporan (keparahan resmi, avatar PIC, "(Anda)", Terkait · Kerawanan);
  Tindak lanjut pindah ke kolom utama; header menambah tag Dieskalasi.
- P31 (SKK, PIC mengeskalasi ke SKK): kartu kanan "Diminta arahan dari Anda" (alasan PIC, Tenggat, Penanganan Tetap di KKKS,
  tombol Beri arahan), Lokasi, Info laporan; kolom utama Isi laporan, Lampiran, Tindak lanjut.
- Sidebar bisa diciutkan dan dilebarkan dari tombol di bar atas semua layar (termasuk Dashboard dan Tindak lanjut lewat delegasi klik).
