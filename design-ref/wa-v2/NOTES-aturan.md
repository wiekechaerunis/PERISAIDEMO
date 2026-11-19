# Catatan tab Aturan (V2-30, V2-31, V2-32)

Dipadankan: V2-30-Aturan (daftar), V2-31-Aturan-bawaan (panel aturan bawaan), V2-32-Aturan-baru (panel tambah aturan). ASIS tidak dibuka (V2 sudah cukup).

Berkas: components/monitor/AturanTab.tsx (diganti), components/monitor/aturan/{RulePanel.tsx, TagInput.tsx, ruleModel.ts} (baru), src/styles/features/wa-v2-extra-aturan.css (baru, diimpor di index.css), src/features/whatsapp/aturan.test.tsx (baru, 6 tes), src/services/mock/waRules.ts (WaKind + 'video' | 'suara'; kata kunci mengabaikan tanda kutip dan * di akhir).

Penyimpangan dari papan:
- Tombol "Tambah aturan" ada di toolbar kartu (papan: di header halaman pr-ph milik WaInboxPage). Pindahkan bila halaman memasangnya.
- Picker "Nomor" memakai select asli (papan: tombol v2-sel-inline); aturan di mock bersifat global, jadi hanya mengubah judul.
- Preset (Prioritas kata kunci, LAPSIT rutin) dan "Saran jenis laporan" (Tanpa saran/Insiden/Kerawanan) ditambahkan di panel karena diwajibkan brief; tidak ada di papan. Preset hanya untuk aturan baru.
- Tombol "Hapus aturan" di kiri footer panel untuk aturan non-bawaan (papan hanya menyisakan ruang kosong di sana). Aturan bawaan tidak punya tombol hapus.
- Syarat Diawali dan panjang teks (dipakai seed) tidak punya kontrol di papan: dipertahankan, ditampilkan sebagai "Syarat lanjutan: ..." dan sebagai chip tabel.
- Tag "Prioritas" ditampilkan di kolom nama (K4); papan tidak punya.
- Kata kunci: teks bantuan papan menyebut "per kata utuh"; mesin masih mencocokkan substring (belum diubah agar tes mesin tetap sama).
- Pesan lanjutan: aturan tanpa followUp tampil 0 pesan; aturan baru default 3 pesan / 5 menit. Seed "Semua pesan" tidak diubah (papan menampilkan 3/5).
- Panel memakai dialog open + scrim (bukan showModal); Esc, scrim, Batal menutup.
- Label tab "Aturan pemantauan" di papan vs "Aturan" di tes: milik WaMonitorTabs, tidak disentuh.

Belum: tidak ada. Gate: eslint src bersih; tsc hanya galat di WaInboxPage.tsx (agen lain); vitest whatsapp+services: aturan.test.tsx dan waRules.test.ts lolos; 4 tes gagal di monitor.test.tsx/whatsapp.test.tsx milik area agen lain (Tandai rutin, tab Nomor tertaut, saran AI).
