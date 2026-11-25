# Rencana sinkron menu Insiden ke INS-ADJ + Desain v2 (25 Nov 2026)

Acuan: `INS-ADJ.md` (butir Disepakati), `AUDIT-prototype-insiden-25nov.md` (PA-xx, B-xx), board canvas Desain v2
(dibaca lewat konektor artifact, versi `1795587511-f048`, disalin ke folder kerja sementara, tidak di-commit).
`design-ref/project/` di repo adalah salinan lama (18 Nov) dan tidak diubah; board baru (I12s, I14m*, PD*, LPO*, Main-Aksi*,
V11-Aksi*, P11-AksiAmbil, PB*, I13k, I13u, dst.) hanya ada di canvas.

## Peta kode yang terdampak

| Area | Route | Berkas utama | Data mock |
|---|---|---|---|
| Daftar | `/insiden` | `pages/IncidentListPage.tsx`, `components/list/*` (IncidentTable, FilterPopover, PeriodField, ListStates) | `logic/list.ts`, `logic/period.ts`, seed |
| Form Lapor | `/insiden/baru/{temuan,kejadian,lampiran,ringkasan}`, `/insiden/wa/*` | `pages/ReportStep1..4Page.tsx`, `components/ReportFormShell.tsx`, `ImpactAxes`, `SeverityAuto`, `step2Data.ts` | `logic/draft.ts` (satu draf aktif di localStorage), `logic/submit.ts` |
| Modal Ajukan | langkah Ringkasan | `pages/ReportStep4Page.tsx` | `lib/rbac.ts` (`reviewerOptions`) |
| Detail | `/insiden/:no` | `pages/IncidentDetailPage.tsx`, `components/detail/*` | `detailLogic.ts` |
| Pemeriksaan | `/insiden/:no/review` | `pages/IncidentReviewPage.tsx`, `components/review/*` | `services/mock/workflow.ts` |
| Penanganan/penutupan | `/insiden/:no/tangani`, `/insiden/:no` (PIC/Pejabat) | `PicHandlingPage`, `PejabatHandlingPage`, `components/handling/*`, `components/closure/*` | `workflow.handling.ts`, `workflow.closure.ts` |
| SKK | `/insiden/:no` (pengawas) | `SkkIncidentPage`, `components/skk/*` | `workflow.skk.ts` |
| Konfigurasi | `/konfigurasi` | `features/konfigurasi/*` | `workflow.config.ts` |

## Rencana per alur (urutan prompt)

1. **Daftar.** Subjudul PA-01. Menu ⋯ per baris (B-15, board Main-Aksi*, V11-Aksi*, P11-AksiAmbil) sebagai kolom aksi di semua
   susunan tabel kecuali SKK. Baris Draf membuka langkah 1 mode Ubah (PA-03). Buat laporan hanya untuk role maker (Pelapor; PA-04,
   ADJ-18). Status "Minta ditutup" → "Menunggu penutupan". Panel Filter mengikuti Main-Filter: urutan Status, Keparahan,
   Kategori+WK, PIC, Periode (chip), Lainnya; logika Periode dari `logic/period.ts` dipertahankan. Hapus draf dari daftar
   (dialog "Hapus draf ini?", toast "Draf dihapus.").
2. **Form Lapor.** Draf punya nomor setelah Simpan draf (`draft.no`). Judul/crumb/badge per B-1. Stepper B-2. Langkah 1 per B-3
   (Jenis laporan · Kejadian: Judul → Waktu → Apa yang terjadi? → Sumber informasi · Lokasi + Patokan manual); pertanyaan Ya/Tidak
   dihapus. Kartu Pengajuan hanya di Ringkasan (B-4), catatan B-5/B-6 dihapus. Footer B-7 sticky. Hapus draf (B-8, hanya pembuat).
   Modal "Tinggalkan halaman ini?" (B-9). "Belum diketahui" di empat isian dampak + saran sementara / "Belum bisa disarankan"
   (B-11, ADJ-07). Penanganan + Tindakan awal (B-12). Ringkasan lengkap (B-13). Jalur WA ikut kerangka yang sama.
3. **Modal Ajukan.** Board I14m*: ringkasan, Diperiksa oleh (combobox pilih-banyak berchip, cari, Pilih semua, "(Anda)"), validasi
   kosong, info terkunci + SKK, peringatan pengaju = pemeriksa (ADJ-01).
4. **Detail + Riwayat.** Tab Detail | Riwayat (n) di bawah app bar, crumb "Insiden › {nomor}", header hanya status (B-18). Ringkasan
   B-19, kartu Lokasi terpisah dan isi kartu utama B-20, label lampiran "Terkunci sampai diverifikasi" (PA-13), tanpa "setara"
   (PA-11). "Jejak audit lengkap" = tautan ke halaman Jejak audit (B-21).
5. **Batalkan pengajuan.** Ganti semua teks Tarik kembali (tombol, dialog S07 + alasan wajib maks. 500, toast, Riwayat, menu ⋯).
6. **Pemeriksaan.** Konfirmasi "Anda yang melaporkan insiden ini. Tetap periksa?" + Riwayat "diperiksa sendiri" (ADJ-01). Ajukan
   ulang: cek ganda hanya bila lokasi/waktu/kategori berubah (ADJ-11, PB3).
7. **Penanganan.** Perbarui dampak (PD1, PD1m, PD2): naik langsung berlaku, turun menunggu konfirmasi Pejabat, Riwayat sebelum →
   sesudah. Ambil alih PIC grup.
8. **Data penutupan.** Penyebab utama tunggal, Penjelasan penyebab, Faktor pendukung opsional, 5 isian wajib (ADJ-14), catatan KIN-01
   (ADJ-16), bagian Produksi hilang opsional + unggah → saran AI (ADJ-12, LPOSec, LPOm-TerisiAI).
9. **Menunggu penutupan.** Aksi hanya Setujui / Kembalikan ke PIC / Tambah tindak lanjut; Kembalikan nonaktif tanpa alasan (ADJ-09);
   status jadi kartu kanan, urutan kolom B-22/B-23 (P17).
10. **Periksa penutupan.** Peringatan ADJ-02/ADJ-03 (satu dialog bila keduanya), tombol "Ringkasan untuk keputusan" menggantikan panel
    AI (ADJ-13), Lama penanganan + Total waktu (ADJ-10), urutan P22.
11. **Ditutup + Buka kembali.** Kartu "Insiden ditutup", urutan P24, ADJ-10, Koreksi data (PD3, ADJ-07).
12. **SKK.** Tanpa ⋯, tanpa draf, bukan approver bawaan; tab Riwayat.
13. **Jejak audit.** Halaman `/insiden/:no/jejak-audit` (P34): crumb, pil Objek, kolom, Filter, Ekspor CSV, panel samping.
14. **Konfigurasi Insiden.** Rujukan daftar ke KIN-01; ADJ-04/05/06 hanya bila halaman Persetujuan ada.
15. **State galat/kosong/memuat.** Cek S08–S12, VS3/VS4, PS2/PS3/PS8/PS9 setelah perubahan di atas.

Tiap alur: tes terdampak diperbarui dengan alasan, typecheck + lint + test, cek di browser 1366 px dan 390 px, commit tematis.

## Prinsip

- INS-ADJ menang bila bertentangan dengan board; konflik dicatat di `DEVIATIONS.md` (bagian "Sinkron INS-ADJ 25 Nov").
- Komponen dan class DS yang sudah ada dipakai (`p-*`, `lk-*`, `in-*`); tidak ada varian baru bila sudah ada.
- Berkas Tindak lanjut (`src/features/tindak-lanjut/*`, `workflow.followup*`, `seedFollowUps.ts`), Dashboard, dan `src/ask/*` tidak
  disentuh.
