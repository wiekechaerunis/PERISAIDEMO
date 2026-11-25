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
