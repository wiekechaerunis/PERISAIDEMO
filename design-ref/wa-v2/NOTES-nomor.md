# Catatan bagian Nomor tertaut, dialog Tautkan, Teks persetujuan

Papan dipadankan: V2-20, V2-22, V2-23, V2-23b, V2-23c, V2-24. (ASIS tidak tersedia di artifact; tidak dipakai.)

Berkas:
- Diubah: `src/features/whatsapp/components/monitor/NomorTab.tsx` (ekspor `NomorTab`, `WaTerms` tetap), `src/features/whatsapp/monitor.test.tsx` (pencari label A3/C2), `src/styles/index.css` (+1 `@import`), `src/services/mock/workflow.wamon.ts` (tambah `renameNumber`, `relinkNumber`; yang lama tidak diubah).
- Baru: `components/monitor/nomor/{icons.tsx,util.ts,V2Dialog.tsx,RiskText.tsx,RowMenu.tsx,LinkNumberDialog.tsx,NumberDialogs.tsx,ui.ts}`, `src/styles/features/wa-v2-extra-nomor.css`.

Penyimpangan dari papan:
- Tombol "Tautkan nomor" di papan ada di header halaman (`pr-ph__act`), milik WaInboxPage. NomorTab menyediakan `useNomorUi` (`nomor/ui.ts`, `openLink()`) dan, selama header belum punya tombol, merender tombol yang sama di bar kartu. Bila header sudah punya tombol, pakai `<NomorTab hideLinkButton />`.
- Metrik "Diperiksa hari ini" dan "Diabaikan aturan hari ini" tampil "–": store tidak mencatat pesan yang diperiksa/diabaikan aturan. "Tertangkap hari ini" dihitung dari pesan bertanggal hari demo.
- Waktu persetujuan ketentuan: store hanya menyimpan nama. Waktu dicatat di localStorage (`perisai-insiden-demo/wa-terms-at:<nama>`), fallback jam demo.
- Menu aksi ditambah "Tangguhkan" dan "Lanjutkan" (tidak ada di papan) karena perilaku itu harus tetap ada. "Putuskan nomor" = Lepas nomor (alasan wajib, dialog V2-23b). "Tautkan ulang" aktif untuk status Terputus/Menunggu (papan menampilkannya nonaktif karena contohnya Terhubung); status Terputus berlabel "Perlu ditautkan ulang" sesuai catatan menu papan.
- Langkah 2 dialog Tautkan (QR/kode, kedaluwarsa, Terhubung) tidak ada di papan; dibuat dengan kelas `pr-*` dan teks lama dipertahankan. Pilihan "Cara menautkan" di langkah 1 menentukan QR atau kode awal.
- Layar persetujuan pertama (`WaTerms`, gate sebelum tab) tidak ada di papan; memakai teks risiko V2-24 + kotak centang dan tombol Lanjutkan. Judul "Sebelum memakai Pemantauan WhatsApp" dipertahankan (tes A1).
- Isi tab dibungkus `<V2Root><div class="pr-stack wa-scope">`, tanpa `pr-page` (padding halaman diharapkan dari WaInboxPage).
- "Atur aturan pemantauan" dan "Lihat grup" menavigasi ke `?tab=aturan` / `?tab=grup`.

Belum dicek: tampilan di Browser pane (WaInboxPage belum memakai V2Root saat dikerjakan).
