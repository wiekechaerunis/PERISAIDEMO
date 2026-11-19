# Catatan bagian Pesan masuk dan Detail pesan

Dipadankan: V2-01, 02, 03, 04, 05, 06, 06b, 10, 11, 12, 13. V2-15 (Hapus) tidak dibuat: tidak ada di K3 dan tidak ada alur hapus pesan di workflow. V2-14 dilewati (K8).

Berkas: pages/WaInboxPage.tsx, pages/WaMessagePage.tsx, components/MessageCard.tsx (kini STATUS_WA + StatusTags), components/IrrelevantDialog.tsx, components/monitor/pesan/{util.ts, V2Toast.tsx, PesanShell.tsx, MultiSelect.tsx, FilterPopover.tsx, InboxView.tsx}, styles/features/wa-v2-extra-pesan.css (+ satu @import), services/mock/workflow.wamon.ts (tambah alasan "Salah tangkap"), tes monitor.test.tsx dan whatsapp.test.tsx.

Menyimpang dari papan:
- K8: tidak ada filter "Diteruskan ke SKK", tombol "Teruskan ke SKK".
- K2/K4: tidak ada baris "Saran jenis laporan" di Asal pesan.
- K3: kartu Tindakan menambah Jadikan draf laporan, Lanjutkan draf, Tautkan ke insiden, Lepas tautan, Buka insiden, Lihat di Riwayat insiden; tombol "Hapus pesan" dan "Hapus" massal tidak ada.
- Aksi per pesan hanya di Detail pesan (baris tabel tidak punya tombol, seperti papan). Massal hanya Tandai tidak relevan.
- Segmen cepat 4 seperti papan (Semua, Prioritas, Perlu ditinjau, Tidak relevan); Rutin dan Diproses lewat filter Status. Prioritas adalah subset Perlu ditinjau.
- Tab "Aturan pemantauan" (teks papan); angka di tab Pesan masuk = pesan Prioritas.
- Data tidak tersedia: nomor ponsel pengirim tersamar (diganti peran pengirim), balasan/kutipan, status "bersih" berkas.
- "Tag grup" memakai wilayah kerja grup. Rentang tanggal diberi dua input tanggal. Keterangan dialog mengikuti batas 200 karakter service.
- Detail pesan: grid dua kolom berdampingan (pesan 4fr, Tindakan 1fr min 280px) hingga lebar 768px; papan menumpuk di bawah 1280px, diubah atas koreksi pengguna.
- Tombol "Tautkan nomor" ada di header tab Nomor tertaut (NomorTab hideLinkButton).
