# Catatan tab Grup (V2-50..57)

Papan dipadankan: V2-50 daftar, V2-51 cari pendek, V2-52 cari hasil, V2-53 dan 53b dialog Pantau (pilih wilayah kerja), V2-54 setelah pantau (toast), V2-55 Ubah, V2-56 Anggota (side panel), V2-57 Berhenti memantau.
V2-41, V2-42, V2-43 tidak ada di artifact; hanya V2-40 (generasi lama: judul "Grup", kolom Hari ini "4 tertangkap", pencarian "nama grup atau tag", semua grup tampil). Acuan utama V2-50..57; dua perbedaan yang diikuti dari yang baru: daftar hanya memuat grup dipantau, pencarian nama saja dengan minimal 3 huruf.

Berkas: dibuat `components/monitor/grup/parts.tsx` (ikon, V2Select listbox, Dlg modal, TagInput) dan `grup/dialogs.tsx` (GroupFormDialog, StopDialog, MembersPanel); ditulis ulang `GrupTab.tsx` (ekspor `GrupTab` tetap); `src/features/whatsapp/grup.test.tsx` (8 tes). Tambahan layanan (hanya menambah): `WaMember` dan field opsional di `WaGroup` (members, membersAt, tags, description, monitoredSince, checkedToday) di `types.ts`; `workflow.wamon.ts`: `setGroupMonitor` menerima argumen opsional `meta` (tag, keterangan) dan mengisi `monitoredSince`, fungsi baru `updateGroup`, `stopMonitoring`, konstanta MAX_GROUP_TAGS/MAX_TAG_LEN/MAX_GROUP_DESC; `seedWaMon.ts`: anggota contoh, tag, keterangan, tanggal mulai dipantau. Tidak perlu CSS tambahan.

Penyimpangan dari papan (disengaja):
- Daftar default juga menampilkan grup bertanda "Baru" dan grup "Nomor bukan anggota lagi" (papan hanya menampilkan grup dipantau), agar perilaku wajib tetap terlihat. Switch grup bukan-anggota dinonaktifkan.
- Wilayah kerja di dialog Pantau/Ubah tidak diisi awal (papan memilih "Wilayah Kerja Demo 1"); placeholder "Pilih wilayah kerja", dan "Pilih wilayah kerja untuk grup ini." muncul bila kosong saat Pantau grup. Pilihan WK memakai daftar WK prototipe (shared.tsx), area contoh hanya untuk WK Andalas Darat.
- Teks yang tidak ada di papan dan dibuat sendiri: toast "Perubahan {grup} disimpan" dan "Berhenti memantau {grup}", baris kosong "Belum ada grup yang dipantau.", placeholder area "Pilih wilayah kerja dulu", pesan "Tidak ada anggota yang cocok dengan ...".
- Kolom "Hari ini": "N pesan masuk" dihitung dari pesan hari ini di store; "M diperiksa" dari `checkedToday` contoh (minimal sama dengan N).
- Shell papan (sidebar, header halaman, tab) tidak ditiru; tab dan header dipegang WaInboxPage. Dialog memakai `<dialog>.showModal()` sehingga latar gelap dari ::backdrop (bukan `asis-scrim`).
- Seed: grup G1, G3, G5, G6 awalnya Dipantau (seed lama, dipakai tes waRules); bukan "semua Tidak dipantau". Data localStorage lama tidak punya anggota/tag baru, jalankan Reset demo untuk melihatnya.

Belum dipadankan: tidak ada. K1-K8 tidak menyentuh tab ini.

Gate: `npx tsc --noEmit` bersih, `npx eslint` untuk berkas milik bersih, `grup.test.tsx` 8/8 lolos. `npx vitest run src/features/whatsapp` masih gagal di monitor.test.tsx dan whatsapp.test.tsx karena `PesanMasuk` (WaInboxPage, milik agen lain, sedang dikerjakan: "Element type is invalid"), bukan dari tab Grup.
