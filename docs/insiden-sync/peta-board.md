
## INS-01
| Board | File di canvas | Layar dan rujukan | Halaman canvas |
|---|---|---|---|
| `IF1-Lapor` | `project/IF1-Lapor.dc.html` | Flow 1 · Lapor insiden dari lapangan | Batch 1 · Alur (grooming) |
| `IF3-SKK` | `project/IF3-SKK.dc.html` | Flow 3 · SKK memantau insiden | Batch 1 · Alur (grooming) |
| `Main` | `project/Main.dc.html` | 1.1 Daftar insiden — Pelapor · FR-INS-14, 15 | Batch 1 · Layar per flow |
| `I12-Jenis` | `project/I12-Jenis.dc.html` | 1.2 Form · langkah 1, pilih Insiden — Pelapor · FR-LK-25, FR-INS-01 | Batch 1 · Layar per flow |
| `I13-Kejadian` | `project/I13-Kejadian.dc.html` | 1.3 Form · langkah 2, Dampak (interaktif) — Pelapor · FR-INS-01–06 | Batch 1 · Layar per flow |
| `I13b-Lampiran` | `project/I13b-Lampiran.dc.html` | 1.3b Lampiran — Pelapor · INS-01 (upload, keterangan, gagal format) · AI Copilot memeriksa file | Batch 1 · Layar per flow |
| `I14-Ringkasan` | `project/I14-Ringkasan.dc.html` | 1.4 Form · Ringkasan & Ajukan — Pelapor · FR-INS-09 · AI Copilot memeriksa isian | Batch 1 · Layar per flow |
| `I15-Detail` | `project/I15-Detail.dc.html` | 1.5 Detail insiden setelah diajukan (Tinggi) — Pelapor · FR-INS-16, T-1, U-1 #16 | Batch 1 · Layar per flow |
| `I22-RingkasanGanda` | `project/I22-RingkasanGanda.dc.html` | 2.2 Ringkasan · kemungkinan laporan ganda — Pelapor · FR-INS-11, 13 · banyak insiden mirip [USULAN] | Batch 1 · Layar per flow |
| `I22b-HapusDraf` | `project/I22b-HapusDraf.dc.html` | 2.2b Konfirmasi Hapus draf (opsi C) — Pelapor · FR-INS-11 | Batch 1 · Layar per flow |
| `I22b-RingkasanGandaTutup` | `project/I22b-RingkasanGandaTutup.dc.html` | 2.2b Ringkasan · kemungkinan ganda, daftar disembunyikan — Pelapor · FR-INS-11, 13 [USULAN] | Batch 1 · Layar per flow |
| `I31-DaftarSKK` | `project/I31-DaftarSKK.dc.html` | 3.1 Daftar insiden — Pengawas SKK · FR-INS-15, P-04 | Batch 1 · Layar per flow |
| `I32-DetailSKK` | `project/I32-DetailSKK.dc.html` | 3.2 Detail insiden jalur cepat belum diperiksa — Pengawas SKK · FR-INS-15, 16, U-1 #20 | Batch 1 · Layar per flow |
| `I14s-RingkasanSedang` | `project/I14s-RingkasanSedang.dc.html` | 1.4s Form · Ringkasan & Ajukan, keparahan Sedang (tanpa jalur cepat) — Pelapor · FR-INS-09 | Batch 1 · Layar per flow |
| `S01-Validasi` | `project/S01-Validasi.dc.html` | Negative · Ajukan ditolak validasi — Pelapor · FR-INS-09, V-1, U-1 #13 | Batch 1 · State, negative & edge case |
| `S03-GantiJenis` | `project/S03-GantiJenis.dc.html` | Edge · Ganti jenis Insiden → Kerawanan selama Draf — Pelapor · FR-LK-25 [usulan] | Batch 1 · State, negative & edge case |
| `S04-AIGagal` | `project/S04-AIGagal.dc.html` | Negative · Saran AI gagal — Pelapor · U-1 #6 | Batch 1 · State, negative & edge case |
| `S05-GagalKirim` | `project/S05-GagalKirim.dc.html` | Negative · Ajukan gagal (jaringan) — Pelapor · U-1 #11 | Batch 1 · State, negative & edge case |
| `S06-DrafBentrok` | `project/S06-DrafBentrok.dc.html` | Edge · Draf sudah diubah rekan — Pelapor · FR-INS-08, U-1 #12 | Batch 1 · State, negative & edge case |
| `S07-TarikKembali` | `project/S07-TarikKembali.dc.html` | Edge · Tarik kembali setelah jalur cepat terkirim — Pelapor · FR-INS-10, U-1 #17 | Batch 1 · State, negative & edge case |
| `S08-Memuat` | `project/S08-Memuat.dc.html` | State · Daftar memuat — semua role · U-1 #1 | Batch 1 · State, negative & edge case |
| `S09-Kosong` | `project/S09-Kosong.dc.html` | State · Belum ada insiden — Pelapor · U-1 #3 | Batch 1 · State, negative & edge case |
| `S10-FilterKosong` | `project/S10-FilterKosong.dc.html` | State · Hasil filter kosong — Pelapor · U-1 #4 | Batch 1 · State, negative & edge case |
| `S11-GagalMuat` | `project/S11-GagalMuat.dc.html` | Negative · Daftar gagal dimuat — semua role · U-1 #2 | Batch 1 · State, negative & edge case |
| `S12-Terbatas` | `project/S12-Terbatas.dc.html` | Negative · Insiden terbatas / di luar cakupan — semua role · FR-INS-17, U-1 #19 | Batch 1 · State, negative & edge case |
| `S13-LuarWK` | `project/S13-LuarWK.dc.html` | Edge · Lokasi di luar cakupan WK — Pelapor · FR-INS-06, RSK-01 F-1 | Batch 1 · State, negative & edge case |
| `LP1-PilihLokasiPeta` | `project/LP1-PilihLokasiPeta.dc.html` | 1.2b Pilih lokasi kejadian · peta + cari aset/alamat/koordinat + lapisan WK — Pelapor · INS-01 F-0, FR-INS-06 | Batch 1 · State, negative & edge case |
| `S14-Kategori` | `project/S14-Kategori.dc.html` | Kategori · daftar pilihan (interaktif) — Pelapor · INS-01 F-1, 4.7 · contoh [ASUMSI] K-05 | Batch 1 · State, negative & edge case |
| `S15-Jenis` | `project/S15-Jenis.dc.html` | Jenis · turunan kategori (interaktif) — Pelapor · INS-01 F-1 | Batch 1 · State, negative & edge case |
| `S16-FormObservasi` | `project/S16-FormObservasi.dc.html` | 1.2k Form · langkah 1, pilih Kerawanan (interaktif) — Pelapor · usulan K-1 opsi A | Batch 1 · State, negative & edge case |
| `S17-JenisLainnya` | `project/S17-JenisLainnya.dc.html` | Jenis Lainnya · ketik manual — Pelapor · INS-01 | Batch 1 · State, negative & edge case |
| `S18-KategoriLainnya` | `project/S18-KategoriLainnya.dc.html` | Kategori Lainnya · ketik manual — Pelapor · INS-01 | Batch 1 · State, negative & edge case |
| `Main-Filter` | `project/Main-Filter.dc.html` | Daftar insiden · filter terbuka (PIC, status, keparahan, kategori, WK, periode, lainnya) + pintasan Perlu tindakan saya | Batch 1 · State, negative & edge case |
| `M1-Daftar` | `project/M1-Daftar.dc.html` | M1 Daftar insiden · FAB Buat laporan — Pelapor · FR-INS-14, RS-1 | Batch 1 · Mobile |
| `M2a-Temuan` | `project/M2a-Temuan.dc.html` | M2a Form langkah 1 · pilih jenis (interaktif) — Pelapor · FR-LK-25, FR-INS-01 | Batch 1 · Mobile |
| `M2-Kejadian` | `project/M2-Kejadian.dc.html` | M2 Form langkah 2 · Dampak (interaktif) — Pelapor · FR-INS-01–06 | Batch 1 · Mobile |
| `M4-Lampiran` | `project/M4-Lampiran.dc.html` | M4 Form langkah 3 · Lampiran (unggah, gagal) — Pelapor · FR-INS-18 | Batch 1 · Mobile |
| `M7-Ringkasan` | `project/M7-Ringkasan.dc.html` | M7 Form langkah 4 · Ringkasan & Ajukan — Pelapor · FR-INS-09 | Batch 1 · Mobile |
| `M8-Detail` | `project/M8-Detail.dc.html` | M8 Detail setelah diajukan + toast — Pelapor · FR-INS-16, T-1 | Batch 1 · Mobile |
| `M5-Ganda` | `project/M5-Ganda.dc.html` | M5 Kemungkinan ganda (bottom sheet) — Pelapor · FR-INS-11 · banyak insiden mirip [USULAN] | Batch 1 · Mobile |
| `M5b-HapusDraf` | `project/M5b-HapusDraf.dc.html` | M5b Konfirmasi hapus draf (bottom sheet) — Pelapor · FR-INS-11 | Batch 1 · Mobile |
| `M7s-RingkasanSedang` | `project/M7s-RingkasanSedang.dc.html` | M7s Ringkasan & Ajukan, keparahan Sedang (tanpa jalur cepat) — Pelapor · FR-INS-09 | Batch 1 · Mobile |
| `M12-DaftarSKK` | `project/M12-DaftarSKK.dc.html` | M12 Daftar insiden (tanpa FAB) — Pengawas SKK · FR-INS-15, P-04 | Batch 1 · Mobile |
| `M6-DetailSKK` | `project/M6-DetailSKK.dc.html` | M6 Detail belum diperiksa · ikon info waktu — Pengawas SKK · FR-INS-16, T-1 | Batch 1 · Mobile |
| `MS01-Validasi` | `project/MS01-Validasi.dc.html` | Negative · Ajukan ditolak validasi — Pelapor · V-1, U-1 #13 | Batch 1 · Mobile |
| `MS03-GantiJenis` | `project/MS03-GantiJenis.dc.html` | Edge · Ganti jenis (bottom sheet) — Pelapor · FR-LK-25 | Batch 1 · Mobile |
| `MS04-AIGagal` | `project/MS04-AIGagal.dc.html` | Negative · Saran AI gagal / memuat — Pelapor · U-1 #6 | Batch 1 · Mobile |
| `MS05-GagalKirim` | `project/MS05-GagalKirim.dc.html` | Negative · Ajukan gagal (jaringan) — Pelapor · U-1 #11 | Batch 1 · Mobile |
| `MS06-DrafBentrok` | `project/MS06-DrafBentrok.dc.html` | Edge · Draf diubah rekan — Pelapor · FR-INS-08, U-1 #12 | Batch 1 · Mobile |
| `MS07-TarikKembali` | `project/MS07-TarikKembali.dc.html` | Edge · Tarik kembali (bottom sheet) — Pelapor · FR-INS-10, U-1 #17 | Batch 1 · Mobile |
| `MS08-Memuat` | `project/MS08-Memuat.dc.html` | State · Daftar memuat — semua role · U-1 #1 | Batch 1 · Mobile |
| `MS09-Kosong` | `project/MS09-Kosong.dc.html` | State · Belum ada insiden — Pelapor · U-1 #3 | Batch 1 · Mobile |
| `MS10-FilterKosong` | `project/MS10-FilterKosong.dc.html` | State · Filter kosong — Pelapor · U-1 #4 | Batch 1 · Mobile |
| `MS11-GagalMuat` | `project/MS11-GagalMuat.dc.html` | Negative · Daftar gagal dimuat — semua role · U-1 #2 | Batch 1 · Mobile |
| `MS12-Terbatas` | `project/MS12-Terbatas.dc.html` | Negative · Insiden terbatas — semua role · FR-INS-17, U-1 #19 | Batch 1 · Mobile |
| `MS13-LuarWK` | `project/MS13-LuarWK.dc.html` | Edge · Lokasi di luar cakupan WK — Pelapor · FR-INS-06 | Batch 1 · Mobile |
| `MS14-Kategori` | `project/MS14-Kategori.dc.html` | Mobile · kategori (bottom sheet) — Pelapor · INS-01 RS-1 | Batch 1 · Mobile |
| `MS15-Jenis` | `project/MS15-Jenis.dc.html` | Mobile · jenis (bottom sheet) — Pelapor · INS-01 RS-1 | Batch 1 · Mobile |
| `Kerawanan` | `project/Kerawanan.dc.html` | K.1 Daftar kerawanan — Pejabat Berwenang · usulan K-1 opsi A | Kerawanan (usulan, modul Risk keluar) |
| `S16b-DetailKerawanan` | `project/S16b-DetailKerawanan.dc.html` | K.2 Form kerawanan · langkah 2, Detail & lampiran (interaktif) — Pelapor · usulan | Kerawanan (usulan, modul Risk keluar) |
| `KD1-DetailKerawanan` | `project/KD1-DetailKerawanan.dc.html` | K.3 Detail kerawanan + Naikkan jadi insiden (interaktif) — Pejabat Berwenang · usulan | Kerawanan (usulan, modul Risk keluar) |
| `KD2-NaikkanPilih` | `project/KD2-NaikkanPilih.dc.html` | KD2 Naikkan jadi insiden · pilih: berdampak atau kejadian baru | Kerawanan (usulan, modul Risk keluar) |
| `KD3-NaikkanDampak` | `project/KD3-NaikkanDampak.dc.html` | KD3 Naikkan jadi insiden · dampak, keparahan, alasan | Kerawanan (usulan, modul Risk keluar) |
| `KD4-Dinaikkan` | `project/KD4-Dinaikkan.dc.html` | KD4 Kerawanan sudah dinaikkan · tertaut INS-SEN-2026-0010 | Kerawanan (usulan, modul Risk keluar) |
| `KD5-AjukanInsiden` | `project/KD5-AjukanInsiden.dc.html` | KD5 Ajukan jadi insiden · Pelapor (lewat pemeriksaan Pejabat) | Kerawanan (usulan, modul Risk keluar) |
| `KD6-TambahPerkembangan` | `project/KD6-TambahPerkembangan.dc.html` | KD6 Tambah perkembangan · Makin rawan | Kerawanan (usulan, modul Risk keluar) |
| `KF1-NaikkanAlur` | `project/KF1-NaikkanAlur.dc.html` | KF1 Alur Naikkan jadi insiden (a) berdampak (b) kejadian baru | Kerawanan (usulan, modul Risk keluar) |
| `MK1-DaftarKerawanan` | `project/MK1-DaftarKerawanan.dc.html` | MK1 Daftar · tab Kerawanan (mobile) · usulan 18 Nov | Batch 2 · Mobile |

## INS-02
| Board | File di canvas | Layar dan rujukan | Halaman canvas |
|---|---|---|---|
| `VF4-Verifikasi` | `project/VF4-Verifikasi.dc.html` | Flow 4 · Pemeriksaan & klasifikasi | Batch 2 · Alur (grooming) |
| `VF5-Ganda` | `project/VF5-Ganda.dc.html` | Flow 5 · Laporan ganda | Batch 2 · Alur (grooming) |
| `V11-Daftar` | `project/V11-Daftar.dc.html` | 4.1 Daftar · pintasan Menunggu pemeriksaan (interaktif) — R-06 · FR-INS-20, U-1 #11 | Batch 2 · Layar per flow |
| `V12-Review` | `project/V12-Review.dc.html` | 4.2 Review + Keputusan pemeriksaan (interaktif) — R-06 · FR-INS-21, 23, 24, 27, 30, P-04 | Batch 2 · Layar per flow |
| `V13-Setujui` | `project/V13-Setujui.dc.html` | 4.3 Konfirmasi Setujui — R-06 · FR-INS-22, U-1 #6 | Batch 2 · Layar per flow |
| `V14-Terverifikasi` | `project/V14-Terverifikasi.dc.html` | 4.4 Detail terverifikasi + toast — R-06 · FR-INS-22, 24, T-1 | Batch 2 · Layar per flow |
| `V12b-ReviewSiap` | `project/V12b-ReviewSiap.dc.html` | 4.2b Review · keterkaitan dan PIC terisi, siap disetujui (interaktif) — R-06 · FR-INS-23, 27 | Batch 2 · Layar per flow |
| `V13g-SetujuiGrup` | `project/V13g-SetujuiGrup.dc.html` | 4.3g Dialog Setujui · PIC grup + saran langkah — R-06 · FR-INS-22, 43, 83 [USULAN] | Batch 2 · Layar per flow |
| `V21-ReviewGanda` | `project/V21-ReviewGanda.dc.html` | 5.1 Review dengan tanda kemungkinan ganda — R-06 · FR-INS-25, U-1 #4 · banyak insiden mirip [USULAN] | Batch 2 · Layar per flow |
| `V22-Gabung` | `project/V22-Gabung.dc.html` | 5.2 Dialog Gabung — R-06 · FR-INS-25, U-1 #9 | Batch 2 · Layar per flow |
| `V21b-ReviewGandaTutup` | `project/V21b-ReviewGandaTutup.dc.html` | 5.1b Review · kemungkinan ganda, daftar disembunyikan — R-06 · FR-INS-25 [USULAN] | Batch 2 · Layar per flow |
| `V31-MintaRevisi` | `project/V31-MintaRevisi.dc.html` | 6.1 Minta revisi — R-06 · FR-INS-26, U-1 #7 | Batch 2 · Layar per flow |
| `V32-Batalkan` | `project/V32-Batalkan.dc.html` | 6.2 Batalkan (jalur cepat terkirim) — R-06 · FR-INS-26a, U-1 #8 | Batch 2 · Layar per flow |
| `V33-UbahJenis` | `project/V33-UbahJenis.dc.html` | 6.3 Jadikan kerawanan — R-06 · FR-INS-26b [usulan, menggantikan Ubah jadi Observasi] | Batch 2 · Layar per flow |
| `V34-Terbatas` | `project/V34-Terbatas.dc.html` | 6.4 Tandai terbatas — R-06 · FR-INS-28, U-1 #10 | Batch 2 · Layar per flow |
| `V35-SKKTingkat2` | `project/V35-SKKTingkat2.dc.html` | 6.5 SKK sebagai approver tingkat 2 — R-02 · DL-74, SK-06 | Batch 2 · Layar per flow |
| `V10-TugasSaya` | `project/V10-TugasSaya.dc.html` | 4.0 Tugas saya · pemeriksaan insiden — R-06 · FR-INS-20, RKJ-03 | Batch 2 · Layar per flow |
| `VS1-Validasi` | `project/VS1-Validasi.dc.html` | Negative · Setujui ditolak validasi — R-06 · V-1 | Batch 2 · State, negative & edge case |
| `VS2-SudahDiputus` | `project/VS2-SudahDiputus.dc.html` | Edge · Sudah diputus penyetuju lain — R-06 · U-1 #3, NFR-INS-08 | Batch 2 · State, negative & edge case |
| `VS3-Kosong` | `project/VS3-Kosong.dc.html` | State · Tidak ada yang menunggu — R-06 · U-1 #2 | Batch 2 · State, negative & edge case |
| `VS4-Memuat` | `project/VS4-Memuat.dc.html` | State · Review memuat — U-1 #1 | Batch 2 · State, negative & edge case |
| `VS5-LewatBatas` | `project/VS5-LewatBatas.dc.html` | Edge · Lewat batas pemeriksaan — R-06 · U-1 #11 | Batch 2 · State, negative & edge case |
| `MV1-Daftar` | `project/MV1-Daftar.dc.html` | MV1 Daftar penyetuju (Filter · 1) — R-06 · 4.9 | Batch 2 · Mobile |
| `MV2-Review` | `project/MV2-Review.dc.html` | MV2 Review + Keputusan, Setujui menempel — R-06 · 4.9 | Batch 2 · Mobile |
| `MV3-Setujui` | `project/MV3-Setujui.dc.html` | MV3 Sheet Setujui — R-06 · U-1 #6 | Batch 2 · Mobile |
| `MV4-AksiLain` | `project/MV4-AksiLain.dc.html` | MV4 Sheet aksi lain (⋯) — R-06 · FR-INS-21 | Batch 2 · Mobile |
| `MV4b-MintaRevisi` | `project/MV4b-MintaRevisi.dc.html` | MV4b Sheet Minta revisi — R-06 · FR-INS-26 | Batch 2 · Mobile |
| `MV5-Gabung` | `project/MV5-Gabung.dc.html` | MV5 Sheet Gabung — R-06 · FR-INS-25 | Batch 2 · Mobile |
| `MV6-Batalkan` | `project/MV6-Batalkan.dc.html` | MV6 Sheet Batalkan — R-06 · FR-INS-26a | Batch 2 · Mobile |
| `MV2m-PetaSerupa` | `project/MV2m-PetaSerupa.dc.html` | MV2m Peta insiden serupa layar penuh · sorot pola · dari peta mini MV2 | Batch 2 · Mobile |

## INS-03
| Board | File di canvas | Layar dan rujukan | Halaman canvas |
|---|---|---|---|
| `M3-Mitra` | `project/M3-Mitra.dc.html` | Mobile · PIC pilih Tim terlibat (bottom sheet) — PIC · keputusan 18 Nov | Batch 1 · Mobile |
| `MS02-TanpaKontrak` | `project/MS02-TanpaKontrak.dc.html` | Edge · Tim terlibat, WK tanpa kontrak Aktif — PIC · keputusan 18 Nov (mitra pindah ke penanganan) | Batch 1 · Mobile |
| `PF6-PIC` | `project/PF6-PIC.dc.html` | Flow 6 · PIC menangani insiden | Batch 3 · Alur (grooming) |
| `PF7-Penutupan` | `project/PF7-Penutupan.dc.html` | Flow 7 · Pejabat Berwenang menutup insiden | Batch 3 · Alur (grooming) |
| `PF8-SKK` | `project/PF8-SKK.dc.html` | Flow 8 · SKK menerima eskalasi | Batch 3 · Alur (grooming) |
| `P10-TugasSayaPIC` | `project/P10-TugasSayaPIC.dc.html` | 6.0 Tugas saya · PIC — PIC · RKJ-03, FR-INS-43 | Batch 3 · Layar per flow |
| `P11-DaftarPIC` | `project/P11-DaftarPIC.dc.html` | 6.1 Daftar · pintasan PIC (interaktif) — PIC · FR-INS-53 | Batch 3 · Layar per flow |
| `P12-Penanganan` | `project/P12-Penanganan.dc.html` | 6.2 Detail insiden · PIC + banner Langkah berikutnya (interaktif: Riwayat, Jejak audit) — PIC · FR-INS-47, 58 | Batch 3 · Layar per flow |
| `P14-Tangani` | `project/P14-Tangani.dc.html` | 6.3 Tangani insiden · halaman kerja (interaktif: Simpan catatan, Lihat detail lengkap) — PIC · FR-INS-47, 48, 54 | Batch 3 · Layar per flow |
| `P15-Eskalasi` | `project/P15-Eskalasi.dc.html` | 6.2c Dialog Eskalasi (dari Detail) — PIC · FR-INS-45, U-1 #7 | Batch 3 · Layar per flow |
| `P16-DataPenutupan` | `project/P16-DataPenutupan.dc.html` | 6.4 Tangani insiden · data penutupan lengkap → Minta ditutup aktif — PIC · FR-INS-54, Tabel F-2 | Batch 3 · Layar per flow |
| `P17-MenungguPenutupan` | `project/P17-MenungguPenutupan.dc.html` | 6.5 Menunggu penutupan + toast — PIC · U-1 #11 | Batch 3 · Layar per flow |
| `P12g-DetailPICGrup` | `project/P12g-DetailPICGrup.dc.html` | 6.2g Detail insiden · PIC grup, belum diambil alih (interaktif: Ambil alih) — anggota grup PIC · FR-INS-43 [USULAN] | Batch 3 · Layar per flow |
| `P12h-GrupSudahDiambil` | `project/P12h-GrupSudahDiambil.dc.html` | 6.2h Detail insiden · anggota grup lain setelah diambil alih (hanya lihat) — anggota grup PIC · FR-INS-43 [USULAN] | Batch 3 · Layar per flow |
| `P20-TugasSaya` | `project/P20-TugasSaya.dc.html` | 7.0 Tugas saya · R-06 — R-06 · RKJ-03, FR-INS-44, 46, 54 | Batch 3 · Layar per flow |
| `P21-DaftarR06` | `project/P21-DaftarR06.dc.html` | 7.1 Daftar · pintasan R-06 (interaktif) — R-06 · FR-INS-53 | Batch 3 · Layar per flow |
| `P22-ReviewTutup` | `project/P22-ReviewTutup.dc.html` | 7.2 Detail · permintaan penutupan (menu interaktif) — R-06 · FR-INS-55 | Batch 3 · Layar per flow |
| `P23-Tutup` | `project/P23-Tutup.dc.html` | 7.3 Dialog Tutup + tindak lanjut berjalan — R-06 · FR-INS-55, 56, U-1 #12 | Batch 3 · Layar per flow |
| `P24-Ditutup` | `project/P24-Ditutup.dc.html` | 7.4 Detail ditutup + toast — R-06 · FR-INS-55, T-1 | Batch 3 · Layar per flow |
| `P29-AksiLainR06` | `project/P29-AksiLainR06.dc.html` | 7.2b Menu Aksi lain terbuka (R-06) — Kembalikan, Ganti PIC, Ubah tenggat, Eskalasi, Tandai terbatas · FR-INS-44, 45, 51, | Batch 3 · Layar per flow |
| `P22g-ReviewTutupGrup` | `project/P22g-ReviewTutupGrup.dc.html` | 7.2g Permintaan penutupan dari PIC grup — R-06 · FR-INS-43, 55 [USULAN] | Batch 3 · Layar per flow |
| `P25-KembalikanPIC` | `project/P25-KembalikanPIC.dc.html` | 7.5 Kembalikan ke PIC — R-06 · FR-INS-55, U-1 #13 | Batch 3 · Layar per flow |
| `P26-GantiPIC` | `project/P26-GantiPIC.dc.html` | 7.6 Ganti PIC — R-06 · FR-INS-44, U-1 #8 | Batch 3 · Layar per flow |
| `P27-UbahTenggat` | `project/P27-UbahTenggat.dc.html` | 7.7 Ubah tenggat — R-06 · FR-INS-51, U-1 #9 | Batch 3 · Layar per flow |
| `P28-BukaKembali` | `project/P28-BukaKembali.dc.html` | 7.8 Buka kembali — R-06 · FR-INS-57 | Batch 3 · Layar per flow |
| `P34-Riwayat` | `project/P34-Riwayat.dc.html` | 7.9 Jejak audit · panel samping (dari Kronologi › Jejak audit lengkap) — semua · FR-INS-58 | Batch 3 · Layar per flow |
| `P31-DetailSKK` | `project/P31-DetailSKK.dc.html` | 8.1 Detail SKK · dieskalasi (interaktif: Beri arahan) — Pengawas SKK · FR-INS-45, 59 | Batch 3 · Layar per flow |
| `P32-BeriArahan` | `project/P32-BeriArahan.dc.html` | 8.2 Dialog Beri arahan — Pengawas SKK · FR-INS-59 | Batch 3 · Layar per flow |
| `P33-ArahanMasuk` | `project/P33-ArahanMasuk.dc.html` | 8.3 Arahan di kronologi + Jadikan tindak lanjut — R-06 · FR-INS-59, TLJ-01 FR-TL-03b | Batch 3 · Layar per flow |
| `P35-DitutupSKK` | `project/P35-DitutupSKK.dc.html` | 8.4 Detail insiden ditutup · SKK (hanya baca) — Pengawas SKK · FR-INS-55 | Batch 3 · Layar per flow |
| `P36-ReviewTutupSKK` | `project/P36-ReviewTutupSKK.dc.html` | 8.5 Persetujuan penutupan · SKK, bila dikonfigurasi (DL-74): Kesiapan + Kondisi sekitar, tanpa panel AI, hanya Setujui/K | Batch 3 · Layar per flow |
| `PS1-LewatTenggat` | `project/PS1-LewatTenggat.dc.html` | Lewat tenggat + eskalasi otomatis — PIC · FR-INS-46, U-1 #6 | Batch 3 · State, negative & edge case |
| `PS2-KronologiKosong` | `project/PS2-KronologiKosong.dc.html` | Kronologi kosong — PIC · U-1 #2 | Batch 3 · State, negative & edge case |
| `PS3-KronologiGagal` | `project/PS3-KronologiGagal.dc.html` | Kronologi gagal dimuat — PIC · U-1 #3 | Batch 3 · State, negative & edge case |
| `PS4-CatatanGagal` | `project/PS4-CatatanGagal.dc.html` | Catatan gagal tersimpan (halaman kerja) — PIC · U-1 #5 | Batch 3 · State, negative & edge case |
| `PS5-TanpaPIC` | `project/PS5-TanpaPIC.dc.html` | Insiden tanpa PIC — R-06 · FR-INS-44, U-1 #14 | Batch 3 · State, negative & edge case |
| `PS6-DataBelumLengkap` | `project/PS6-DataBelumLengkap.dc.html` | Data penutupan belum lengkap (halaman kerja) — PIC · V-1, U-1 #10 | Batch 3 · State, negative & edge case |
| `PS7-BukaLewat30` | `project/PS7-BukaLewat30.dc.html` | Buka kembali lewat 30 hari — R-06 · V-1 | Batch 3 · State, negative & edge case |
| `PS8-RiwayatKosong` | `project/PS8-RiwayatKosong.dc.html` | Jejak audit · filter tanpa hasil — U-1 #16 | Batch 3 · State, negative & edge case |
| `PS9-Memuat` | `project/PS9-Memuat.dc.html` | Tab Penanganan memuat — U-1 #1 | Batch 3 · State, negative & edge case |
| `PS10-TenggatError` | `project/PS10-TenggatError.dc.html` | Ubah tenggat ditolak — R-06 · V-1 | Batch 3 · State, negative & edge case |
| `PS11-Dikembalikan` | `project/PS11-Dikembalikan.dc.html` | Penutupan dikembalikan, PIC melihat alasan — PIC · U-1 #13 | Batch 3 · State, negative & edge case |
| `MP1-DaftarPIC` | `project/MP1-DaftarPIC.dc.html` | MP1 Daftar PIC — 4.8 Responsif | Batch 3 · Mobile |
| `MP2-Penanganan` | `project/MP2-Penanganan.dc.html` | MP2 Detail Penanganan (menu ⋯ interaktif) — PIC · 4.8 | Batch 3 · Mobile |
| `MP3-DataPenutupan` | `project/MP3-DataPenutupan.dc.html` | MP3 Data penutupan layar penuh — PIC · 4.8 | Batch 3 · Mobile |
| `MP4-Eskalasi` | `project/MP4-Eskalasi.dc.html` | MP4 Eskalasi bottom sheet — PIC | Batch 3 · Mobile |
| `MP5-Tutup` | `project/MP5-Tutup.dc.html` | MP5 Tutup bottom sheet — R-06 | Batch 3 · Mobile |
| `MP6-UbahTenggat` | `project/MP6-UbahTenggat.dc.html` | MP6 Ubah tenggat + pemilih tanggal — R-06 | Batch 3 · Mobile |
| `EmailKatalog` | `project/EmailKatalog.dc.html` | Katalog email Insiden (INS-03 Tabel N-1) | Email notifikasi |
| `Email` | `project/Email.dc.html` | Kerangka email (EmailTemplate DS v1) | Email notifikasi |
| `EI1-MenungguVerifikasi` | `project/EI1-MenungguVerifikasi.dc.html` | EI.1 insiden menunggu pemeriksaan — R-06 penyetuju tingkat aktif · INS-01 Ajukan · INS-02 FR-INS-20 | Email notifikasi |
| `EI2-JalurCepat` | `project/EI2-JalurCepat.dc.html` | EI.2 jalur cepat ke SKK — Semua Pengawas SKK & Pimpinan SKK + R-06 organisasi pelapor · INS-03 FR-INS-40, 41 | Email notifikasi |
| `EI3-JalurCepatGanda` | `project/EI3-JalurCepatGanda.dc.html` | EI.3 jalur cepat · kemungkinan sama — Penerima jalur cepat · INS-03 FR-INS-42, P-06 | Email notifikasi |
| `EI4-Terverifikasi` | `project/EI4-Terverifikasi.dc.html` | EI.4 insiden terverifikasi (penerima jalur cepat) — Penerima jalur cepat · INS-03 FR-INS-42 · INS-02 FR-INS-22 | Email notifikasi |
| `EI5-Dibatalkan` | `project/EI5-Dibatalkan.dc.html` | EI.5 insiden dibatalkan — Pelapor + penerima jalur cepat · INS-02 FR-INS-26a, 26b · INS-03 FR-INS-42 | Email notifikasi |
| `EI6-Digabung` | `project/EI6-Digabung.dc.html` | EI.6 insiden digabung — Pelapor insiden sumber + penerima jalur cepat · INS-02 FR-INS-25 · INS-03 FR-INS-42 | Email notifikasi |
| `EI7-RevisiDiminta` | `project/EI7-RevisiDiminta.dc.html` | EI.7 revisi insiden diminta — Pelapor · INS-02 FR-INS-26 | Email notifikasi |
| `EI8-PICDitunjuk` | `project/EI8-PICDitunjuk.dc.html` | EI.8 ditunjuk sebagai PIC insiden — PIC baru · INS-03 FR-INS-43 | Email notifikasi |
| `EI10-DitarikKembali` | `project/EI10-DitarikKembali.dc.html` | EI.10 insiden ditarik kembali — Penerima jalur cepat · INS-01 U-1 #17 · INS-03 FR-INS-42 | Email notifikasi |
| `EI8b-GrupDitunjuk` | `project/EI8b-GrupDitunjuk.dc.html` | EI.8b grup ditunjuk sebagai PIC (Ambil alih) — semua anggota grup PIC · INS-03 FR-INS-43 [USULAN] | Email notifikasi |
| `EI11-TenggatBesok` | `project/EI11-TenggatBesok.dc.html` | EI.11 pengingat tenggat H-1 — PIC · INS-03 FR-INS-50 | Email notifikasi |
| `EI12-LewatTenggat` | `project/EI12-LewatTenggat.dc.html` | EI.12 lewat tenggat, eskalasi otomatis — R-06 organisasi · INS-03 FR-INS-46 | Email notifikasi |
| `EI13-Dieskalasi` | `project/EI13-Dieskalasi.dc.html` | EI.13 insiden dieskalasi — Tujuan eskalasi (R-06 atau Pengawas SKK) · INS-03 FR-INS-45, 59 | Email notifikasi |
| `EI14-MintaDitutup` | `project/EI14-MintaDitutup.dc.html` | EI.14 permintaan penutupan — R-06 penyetuju penutupan · INS-03 FR-INS-54 | Email notifikasi |
| `EK1-RingkasanKerawanan` | `project/EK1-RingkasanKerawanan.dc.html` | EK.1 Ringkasan kerawanan harian · Pejabat Berwenang KKKS · usulan 18 Nov | Email notifikasi |
| `EI15-PenutupanDikembalikan` | `project/EI15-PenutupanDikembalikan.dc.html` | EI.15 penutupan dikembalikan — PIC · INS-03 FR-INS-55 | Email notifikasi |
| `EI16-Ditutup` | `project/EI16-Ditutup.dc.html` | EI.16 insiden ditutup — Pelapor, PIC; penerima jalur cepat bila Tinggi/Kritis · INS-03 FR-INS-55 | Email notifikasi |
| `EI17-DibukaKembali` | `project/EI17-DibukaKembali.dc.html` | EI.17 insiden dibuka kembali — PIC + penerima jalur cepat · INS-03 FR-INS-57 | Email notifikasi |
| `EI18-ArahanSKK` | `project/EI18-ArahanSKK.dc.html` | EI.18 arahan SKK — PIC + R-06 · INS-03 FR-INS-59 | Email notifikasi |

## INS-04
| Board | File di canvas | Layar dan rujukan | Halaman canvas |
|---|---|---|---|
| `I12e-CopilotKosong` | `project/I12e-CopilotKosong.dc.html` | 1.2a Form · AI Copilot kosong (interaktif) — Pelapor [USULAN] | Batch 1 · Layar per flow |
| `I12r-CopilotRekam` | `project/I12r-CopilotRekam.dc.html` | 1.2b Form · AI Copilot merekam suara (interaktif) — Pelapor [USULAN] | Batch 1 · Layar per flow |
| `I12p-CopilotProses` | `project/I12p-CopilotProses.dc.html` | 1.2c Form · AI Copilot membaca rekaman (interaktif) — Pelapor [USULAN] | Batch 1 · Layar per flow |
| `I12o-CopilotLuarCakupan` | `project/I12o-CopilotLuarCakupan.dc.html` | 1.2d Form · AI Copilot, pertanyaan di luar cakupan (interaktif) — Pelapor [USULAN] | Batch 1 · Layar per flow |
| `I13r-CopilotRekam` | `project/I13r-CopilotRekam.dc.html` | 1.3a Form · langkah 2, Copilot merekam suara (interaktif) — Pelapor · FR-INS-62 [USULAN] | Batch 1 · Layar per flow |
| `S19-CopilotGagal` | `project/S19-CopilotGagal.dc.html` | Negative · AI Copilot tidak tersedia (gagal / kuota habis) — Pelapor · FR-INS-75 [USULAN] | Batch 1 · State, negative & edge case |
| `S20-MikDitolak` | `project/S20-MikDitolak.dc.html` | Negative · izin mikrofon ditolak — Pelapor · FR-INS-62, V-INS-AI [USULAN] | Batch 1 · State, negative & edge case |
| `S21-SuaraTakJelas` | `project/S21-SuaraTakJelas.dc.html` | Negative · suara kurang jelas — Pelapor · FR-INS-63, V-INS-AI [USULAN] | Batch 1 · State, negative & edge case |
| `S22-Rekam3Menit` | `project/S22-Rekam3Menit.dc.html` | Edge · rekaman mencapai 3 menit — Pelapor · FR-INS-62 [USULAN] | Batch 1 · State, negative & edge case |
| `S23-TanpaSaran` | `project/S23-TanpaSaran.dc.html` | Edge · cerita belum cukup, tidak ada saran — Pelapor · FR-INS-71 [USULAN] | Batch 1 · State, negative & edge case |
| `MS16-AIGagal` | `project/MS16-AIGagal.dc.html` | Negative · AI Copilot tidak tersedia (mobile) — Pelapor · FR-INS-75 [USULAN] | Batch 1 · Mobile |
| `MS17-MikDitolak` | `project/MS17-MikDitolak.dc.html` | Negative · izin mikrofon ditolak (mobile) — Pelapor · FR-INS-62 [USULAN] | Batch 1 · Mobile |
| `MA1-AIKartu` | `project/MA1-AIKartu.dc.html` | MA1 Form langkah 1 · kartu AI Copilot — Pelapor · FR-INS-60, 61 [USULAN] | Batch 1 · Mobile |
| `MA1b-AIKetik` | `project/MA1b-AIKetik.dc.html` | MA1b AI Copilot layar penuh · mulai mengetik cerita — Pelapor · FR-INS-61 [USULAN] | Batch 1 · Mobile |
| `MA3-AIRekam` | `project/MA3-AIRekam.dc.html` | MA3 AI Copilot layar penuh · merekam suara — Pelapor · FR-INS-62 [USULAN] | Batch 1 · Mobile |
| `MA2-AISheet` | `project/MA2-AISheet.dc.html` | MA2 AI Copilot layar penuh · saran isian — Pelapor · FR-INS-63, 64 [USULAN] | Batch 1 · Mobile |
| `MA4-AIFormTerisi` | `project/MA4-AIFormTerisi.dc.html` | MA4 Form langkah 1 · setelah AI mengisi — Pelapor · FR-INS-65 [USULAN] | Batch 1 · Mobile |
| `MA5-AILangkah2` | `project/MA5-AILangkah2.dc.html` | MA5 Form langkah 2 · tombol AI di bar bawah, saran mitra — Pelapor · FR-INS-60, 66 [USULAN] | Batch 1 · Mobile |
| `MA6-AILampiran` | `project/MA6-AILampiran.dc.html` | MA6 Form langkah 3 · Lampiran dengan AI Copilot — Pelapor · FR-INS-85 [USULAN] | Batch 1 · Mobile |
| `MA7-AIRingkasan` | `project/MA7-AIRingkasan.dc.html` | MA7 Form langkah 4 · Ringkasan dengan AI Copilot — Pelapor · FR-INS-86 [USULAN] | Batch 1 · Mobile |
| `V12e-KasusBaru` | `project/V12e-KasusBaru.dc.html` | 4.2e Review · kasus baru, belum ada kasus serupa (interaktif) — rekomendasi AI dari SOP | Batch 2 · Layar per flow |
| `V12f-RekomDataKurang` | `project/V12f-RekomDataKurang.dc.html` | 4.2f Review · rekomendasi kasus serupa, data belum cukup (2 kasus) — R-06 · INS-04 FR-INS-80 | Batch 2 · Layar per flow |
| `V12g-RekomKosong` | `project/V12g-RekomKosong.dc.html` | 4.2g Review · belum ada kasus serupa (usulan, alternatif 4.2e) — R-06 · INS-04 FR-INS-80 | Batch 2 · Layar per flow |
| `P22c-ReviewTutupCocok` | `project/P22c-ReviewTutupCocok.dc.html` | 7.2c Permintaan penutupan, semua klaim cocok (kotak Belum cocok tidak tampil) — R-06 · INS-04 FR-INS-94 | Batch 3 · Layar per flow |
| `P22k-ReviewTutupDataMinim` | `project/P22k-ReviewTutupDataMinim.dc.html` | 7.2k Permintaan penutupan, data sekitar belum cukup (perkiraan kosong, tanpa kabar OSINT) — R-06 · FR-INS-55b [USULAN] | Batch 3 · Layar per flow |

## INS-05
| Board | File di canvas | Layar dan rujukan | Halaman canvas |
|---|---|---|---|
| `IF2-WhatsApp` | `project/IF2-WhatsApp.dc.html` | Flow 2 · Insiden dari pesan WhatsApp | Batch 1 · Alur (grooming) |
| `I20-WATemuan` | `project/I20-WATemuan.dc.html` | 2.0 Form dari WhatsApp · langkah 1, saran AI — Pelapor · FR-INS-12, W-2 · AI Copilot | Batch 1 · Layar per flow |
| `I21-WAKejadian` | `project/I21-WAKejadian.dc.html` | 2.1 Form dari WhatsApp · langkah 2, saran AI — Pelapor · FR-INS-12, W-2 · AI Copilot | Batch 1 · Layar per flow |
| `I21b-WALampiran` | `project/I21b-WALampiran.dc.html` | 2.1b Form dari WhatsApp · langkah 3, Lampiran (foto dari pesan) · AI Copilot — Pelapor · FR-INS-12, RSK-10 lampiran dari | Batch 1 · Layar per flow |
| `I23-DetailWA` | `project/I23-DetailWA.dc.html` | 2.3 Detail insiden dari WhatsApp — Pelapor · FR-INS-12, T-1 | Batch 1 · Layar per flow |
| `I24-TautkanInsiden` | `project/I24-TautkanInsiden.dc.html` | 2.4 Detail pesan · dialog Tautkan ke insiden (interaktif) — Pelapor · FR-INS-49, 95, 96 | Batch 1 · Layar per flow |
| `I25-LepasTautan` | `project/I25-LepasTautan.dc.html` | 2.5 Detail insiden · modal konfirmasi Lepas tautan (interaktif) — Pejabat Berwenang/PIC · FR-INS-97 | Batch 1 · Layar per flow |
| `M9-WATemuan` | `project/M9-WATemuan.dc.html` | M9 Draf dari WhatsApp · langkah 1, saran AI — Pelapor · FR-INS-12, W-2 | Batch 1 · Mobile |
| `M10-WAKejadian` | `project/M10-WAKejadian.dc.html` | M10 Draf dari WhatsApp · langkah 2, saran AI — Pelapor · FR-INS-12, W-2 | Batch 1 · Mobile |
| `M11-DetailWA` | `project/M11-DetailWA.dc.html` | M11 Detail insiden dari WhatsApp — Pelapor · FR-INS-12, T-1 | Batch 1 · Mobile |

## INS-06
| Board | File di canvas | Layar dan rujukan | Halaman canvas |
|---|---|---|---|
| `P13-TambahTL` | `project/P13-TambahTL.dc.html` | 6.2b Dialog Tambah tindak lanjut (prop asal saran/tambah) — PIC insiden · INS-03 kartu Tindak lanjut, TLJ-01 | Batch 3 · Layar per flow |
| `TL-Rujukan` | `project/TL-Rujukan.dc.html` | 9.0 Tindak lanjut · dirancang di artifact Tindak Lanjut (TLJ-01, modul bersama) · rujukan board lama | Batch 3 · Layar per flow |
| `T4-TugasSayaTL` | `project/T4-TugasSayaTL.dc.html` | 9.3 Tugas saya · PIC insiden memverifikasi tindak lanjut — PIC insiden · INS-06 FR-INS-117, Tabel J-INS | Batch 3 · Layar per flow |
| `T4b-TugasSayaPICTL` | `project/T4b-TugasSayaPICTL.dc.html` | 9.3b Tugas saya · PIC tindak lanjut, termasuk dikembalikan — PIC tindak lanjut · INS-06 FR-INS-117, Tabel J-INS | Batch 3 · Layar per flow |

## KIN-01
| Board | File di canvas | Layar dan rujukan | Halaman canvas |
|---|---|---|---|
| `CFG-Daftar` | `project/CFG-Daftar.dc.html` | CFG Konfigurasi Modul · daftar (grup Insiden terbuka) · CFG-01 FR-CFG-01 | Konfigurasi Modul · Insiden (usulan 18 Nov) |
| `CFG-Tenggat` | `project/CFG-Tenggat.dc.html` | CFG Tenggat penanganan per keparahan · nilai contoh, menunggu SKK · CFG-01 FR-CFG-08 | Konfigurasi Modul · Insiden (usulan 18 Nov) |
| `CFG-MatriksKeparahan` | `project/CFG-MatriksKeparahan.dc.html` | CFG Matriks keparahan · 5 level, ambang USD + pratinjau Rp, versi — Admin SKK · usulan 18 Nov (nilai contoh, K-2) | Konfigurasi Modul · Insiden (usulan 18 Nov) |
