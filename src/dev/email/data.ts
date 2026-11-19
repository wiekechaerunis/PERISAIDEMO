// DIHASILKAN dari design-ref/project/Email*.dc.html dan EI*.dc.html (teks disalin persis dari board). Jangan hand-edit tanpa memeriksa board.
export interface EmailRow { k: string; v: string }
export interface EmailData {
  id: string; kode: string; judul: string; nama: string; konteks: string; rows: EmailRow[];
  tombol: string; tautan: string; penutup: string; penerima: string; kategori: string; dasar: string;
}
export interface CatalogRow { kode: string; id: string | null; judul: string; catatan?: string; penerima: string; kategori: string; dasar: string }
export const CATALOG_INTRO = "Setiap email juga tampil sebagai notifikasi lonceng. Satu email per kejadian per insiden, tanpa ringkasan harian untuk insiden (RSK-07). Kerawanan memakai satu ringkasan harian (EK.1). Kategori: Wajib = tidak bisa dimatikan; Info = bisa dimatikan di Akun saya › Notifikasi. Insiden Tinggi atau Kritis langsung diteruskan ke SKK saat diajukan, sebelum diperiksa KKKS; \"penerima kiriman langsung\" = penerima EI.2.";
export const CATALOG_NOTES: string[] = [
 "Pelapor tidak menerima email saat insidennya disetujui; cukup lonceng (pola Kerawanan: pengaju in-app) [USULAN].",
 "\"Keparahan dinaikkan\" (FR-INS-41) memakai EI.2 dengan label \"Keparahan dinaikkan\" di judul; \"keparahan diturunkan\" memakai EI.4.",
 "Pengingat dan lewat batas pemeriksaan belum diatur di INS-02; diusulkan memakai pola pengingat RSK-07 (titipan PRD).",
 "Ganti PIC memakai EI.8 untuk PIC baru; PIC lama hanya lonceng. Pesan WhatsApp ditautkan dan catatan kronologi baru hanya lonceng.",
 "<b>EK.2 Kerawanan makin rawan</b> (bukan email): Lonceng (seketika) saat pelapor atau pengguna KKKS menandai perkembangan kerawanan sebagai Makin rawan. Penerima: Pejabat Berwenang KKKS cakupan WK. Tidak menunggu ringkasan harian EK.1. Dasar: Keputusan PM 18 Nov. Perlu tidaknya email menyusul belum diputuskan [ASUMSI].",
 "Kategori bertanda [USULAN] belum diputuskan."
];
export const CATALOG: CatalogRow[] = [
 {
  "kode": "EI.1",
  "id": "ei1",
  "judul": "Insiden menunggu pemeriksaan Anda",
  "penerima": "Semua Pejabat Berwenang KKKS (R-06) organisasi pelapor; pelapor sendiri hanya bila ia satu-satunya R-06",
  "kategori": "Wajib",
  "dasar": "INS-01 Ajukan · INS-02 FR-INS-20"
 },
 {
  "kode": "EI.2",
  "id": "ei2",
  "judul": "Insiden Tinggi dilaporkan, belum diperiksa",
  "penerima": "Semua Pengawas SKK & Pimpinan SKK + R-06 organisasi pelapor",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-40, 41"
 },
 {
  "kode": "EI.3",
  "id": "ei3",
  "judul": "Insiden Tinggi dilaporkan, kemungkinan sama dengan laporan sebelumnya",
  "penerima": "Penerima kiriman langsung",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-42, P-06"
 },
 {
  "kode": "EI.4",
  "id": "ei4",
  "judul": "Insiden INS-SEN-2026-0007 disetujui",
  "penerima": "Penerima kiriman langsung",
  "kategori": "Info [USULAN]",
  "dasar": "INS-03 FR-INS-42 · INS-02 FR-INS-22"
 },
 {
  "kode": "EI.5",
  "id": "ei5",
  "judul": "Insiden INS-SEN-2026-0007 dibatalkan",
  "penerima": "Pelapor + penerima kiriman langsung",
  "kategori": "Wajib",
  "dasar": "INS-02 FR-INS-26a, 26b · INS-03 FR-INS-42"
 },
 {
  "kode": "EI.6",
  "id": "ei6",
  "judul": "Insiden INS-SEN-2026-0009 digabung ke INS-SEN-2026-0007",
  "penerima": "Pelapor insiden sumber + penerima kiriman langsung",
  "kategori": "Info [USULAN]",
  "dasar": "INS-02 FR-INS-25 · INS-03 FR-INS-42"
 },
 {
  "kode": "EI.7",
  "id": "ei7",
  "judul": "Revisi diminta untuk insiden Anda",
  "penerima": "Pelapor",
  "kategori": "Wajib",
  "dasar": "INS-02 FR-INS-26"
 },
 {
  "kode": "EI.8",
  "id": "ei8",
  "judul": "Anda ditunjuk sebagai PIC insiden",
  "penerima": "PIC baru",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-43"
 },
 {
  "kode": "EI.8b",
  "id": "ei8b",
  "judul": "Tim Anda ditunjuk sebagai PIC insiden",
  "penerima": "Semua anggota grup PIC (tambahan; EI.8b tidak ada di katalog board)",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-43"
 },
 {
  "kode": "EI.10",
  "id": "ei10",
  "judul": "Insiden INS-SEN-2026-0007 ditarik kembali oleh pelapor",
  "penerima": "Penerima kiriman langsung",
  "kategori": "Info [USULAN]",
  "dasar": "INS-01 U-1 #17 · INS-03 FR-INS-42"
 },
 {
  "kode": "EI.11",
  "id": "ei11",
  "judul": "Tenggat penanganan insiden besok",
  "penerima": "PIC",
  "kategori": "Pengingat",
  "dasar": "INS-03 FR-INS-50"
 },
 {
  "kode": "EI.12",
  "id": "ei12",
  "judul": "Insiden lewat tenggat dan dieskalasi ke Anda",
  "penerima": "R-06 organisasi",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-46"
 },
 {
  "kode": "EI.13",
  "id": "ei13",
  "judul": "Insiden dieskalasi ke Anda",
  "penerima": "Tujuan eskalasi (R-06 atau Pengawas SKK)",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-45, 59"
 },
 {
  "kode": "EI.14",
  "id": "ei14",
  "judul": "Insiden menunggu penutupan Anda",
  "penerima": "R-06 penyetuju penutupan",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-54"
 },
 {
  "kode": "EI.15",
  "id": "ei15",
  "judul": "Penutupan insiden dikembalikan",
  "penerima": "PIC",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-55"
 },
 {
  "kode": "EI.16",
  "id": "ei16",
  "judul": "Insiden INS-SEN-2026-0007 ditutup",
  "penerima": "Pelapor, PIC; penerima kiriman langsung bila Tinggi/Kritis",
  "kategori": "Info [USULAN]",
  "dasar": "INS-03 FR-INS-55"
 },
 {
  "kode": "EI.17",
  "id": "ei17",
  "judul": "Insiden INS-SEN-2026-0007 dibuka kembali",
  "penerima": "PIC + penerima kiriman langsung",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-57"
 },
 {
  "kode": "EI.18",
  "id": "ei18",
  "judul": "Arahan SKK Migas untuk insiden INS-SEN-2026-0007",
  "penerima": "PIC + R-06",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-59"
 },
 {
  "kode": "EI.19",
  "id": null,
  "judul": "Insiden diturunkan jadi kerawanan",
  "catatan": "Saat insiden Tinggi atau Kritis dijadikan kerawanan. Board email belum dibuat.",
  "penerima": "Pengawas SKK & Pimpinan SKK sesuai cakupan",
  "kategori": "Info",
  "dasar": "Keputusan PM 18 Nov"
 },
 {
  "kode": "EK.1",
  "id": "ek1",
  "judul": "Ringkasan kerawanan · 18 Nov 2026 · WK Andalas Darat",
  "catatan": "Harian 07:00 WIB bila ada kerawanan baru 24 jam terakhir",
  "penerima": "Pejabat Berwenang KKKS (cakupan WK)",
  "kategori": "Info",
  "dasar": "Keputusan PM 18 Nov: ringkasan harian menggantikan pemeriksaan per laporan kerawanan"
 }
];
export const EMAILS: Record<string, EmailData> = {
 "ei1": {
  "id": "ei1",
  "kode": "EI.1",
  "judul": "Insiden menunggu pemeriksaan Anda",
  "nama": "Sari Wulandari",
  "konteks": "Budi Santoso mengajukan insiden di PT Samudra Energi Nusantara. Periksa, klasifikasikan, lalu setujui atau minta revisi.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Keparahan awal",
    "v": "Tinggi · menurut pelapor"
   },
   {
    "k": "Lokasi",
    "v": "Sumur ADR-07, Kab. Musi Banyuasin · WK Andalas Darat"
   },
   {
    "k": "Waktu kejadian",
    "v": "28 Okt 2026, 01:00 WIB"
   },
   {
    "k": "Batas pemeriksaan",
    "v": "29 Okt 2026, 07:00 WIB (1 hari kerja)"
   }
  ],
  "tombol": "Periksa insiden",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Pejabat Berwenang lain di organisasi Anda juga menerima email ini. Keputusan pertama yang tersimpan yang berlaku.",
  "penerima": "Semua Pejabat Berwenang KKKS (R-06) organisasi pelapor; pelapor sendiri hanya bila ia satu-satunya R-06",
  "kategori": "Wajib",
  "dasar": "INS-01 Ajukan · INS-02 FR-INS-20"
 },
 "ei10": {
  "id": "ei10",
  "kode": "EI.10",
  "judul": "Insiden INS-SEN-2026-0007 ditarik kembali oleh pelapor",
  "nama": "Hendra Wijaya",
  "konteks": "Budi Santoso menarik kembali insiden yang Anda terima lewat jalur cepat untuk diperbaiki.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Ditarik",
    "v": "28 Okt 2026, 07:20 WIB"
   },
   {
    "k": "Status",
    "v": "Draft · sedang diperbaiki pelapor"
   }
  ],
  "tombol": "Buka insiden",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Notifikasi ini juga tampil di PERISAI.",
  "penerima": "Penerima kiriman langsung",
  "kategori": "Info [USULAN]",
  "dasar": "INS-01 U-1 #17 · INS-03 FR-INS-42"
 },
 "ei11": {
  "id": "ei11",
  "kode": "EI.11",
  "judul": "Tenggat penanganan insiden besok",
  "nama": "Andi Pratama",
  "konteks": "Insiden yang Anda tangani mencapai tenggat dalam 1 hari. Catat perkembangan atau minta ditutup bila sudah selesai.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Tenggat",
    "v": "2 Nov 2026, 07:00 WIB"
   },
   {
    "k": "Data penutupan",
    "v": "Belum diisi"
   }
  ],
  "tombol": "Buka penanganan",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Bila tenggat terlewat, insiden otomatis dieskalasi ke Pejabat Berwenang.",
  "penerima": "PIC",
  "kategori": "Pengingat",
  "dasar": "INS-03 FR-INS-50"
 },
 "ei12": {
  "id": "ei12",
  "kode": "EI.12",
  "judul": "Insiden lewat tenggat dan dieskalasi ke Anda",
  "nama": "Sari Wulandari",
  "konteks": "Insiden berikut belum ditutup sampai tenggat. PERISAI mengeskalasinya ke Anda sebagai Pejabat Berwenang.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0005\nPenghadangan truk logistik oleh warga"
   },
   {
    "k": "Keparahan",
    "v": "Kritis"
   },
   {
    "k": "PIC",
    "v": "Andi Pratama"
   },
   {
    "k": "Tenggat",
    "v": "28 Okt 2026, 07:00 WIB · lewat 1 hari"
   }
  ],
  "tombol": "Buka insiden",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0005",
  "penutup": "Anda bisa mengganti PIC atau mengubah tenggat dengan alasan dari halaman insiden.",
  "penerima": "R-06 organisasi",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-46"
 },
 "ei13": {
  "id": "ei13",
  "kode": "EI.13",
  "judul": "Insiden dieskalasi ke Anda",
  "nama": "Hendra Wijaya",
  "konteks": "Andi Pratama, PIC di PT Samudra Energi Nusantara, mengeskalasi insiden berikut ke Anda. Penanganan tetap di KKKS; Anda bisa memberi arahan.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Keparahan",
    "v": "Tinggi"
   },
   {
    "k": "Alasan",
    "v": "Butuh dukungan koordinasi dengan Polres untuk patroli gabungan."
   },
   {
    "k": "Dieskalasi",
    "v": "30 Okt 2026, 08:15 WIB"
   }
  ],
  "tombol": "Buka insiden",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Arahan Anda masuk ke kronologi insiden dan diberitahukan ke PIC.",
  "penerima": "Tujuan eskalasi (R-06 atau Pengawas SKK)",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-45, 59"
 },
 "ei14": {
  "id": "ei14",
  "kode": "EI.14",
  "judul": "Insiden menunggu penutupan Anda",
  "nama": "Sari Wulandari",
  "konteks": "Andi Pratama sudah mengisi data penutupan dan meminta insiden berikut ditutup.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Penyebab",
    "v": "Celah pengamanan fisik"
   },
   {
    "k": "Bukti",
    "v": "2 file"
   },
   {
    "k": "Tindak lanjut",
    "v": "2 masih berjalan"
   },
   {
    "k": "Batas",
    "v": "1 Nov 2026 (2 hari kerja)"
   }
  ],
  "tombol": "Tinjau penutupan",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Anda bisa menutup atau mengembalikannya ke PIC dengan alasan.",
  "penerima": "R-06 penyetuju penutupan",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-54"
 },
 "ei15": {
  "id": "ei15",
  "kode": "EI.15",
  "judul": "Penutupan insiden dikembalikan",
  "nama": "Andi Pratama",
  "konteks": "Sari Wulandari mengembalikan permintaan penutupan Anda. Lengkapi sesuai alasan di bawah, lalu minta ditutup lagi.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Alasan",
    "v": "Lampirkan berita acara yang sudah ditandatangani Polsek, bukan draf."
   },
   {
    "k": "Tenggat",
    "v": "2 Nov 2026, 07:00 WIB"
   }
  ],
  "tombol": "Buka penanganan",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Data penutupan yang sudah Anda isi tetap tersimpan.",
  "penerima": "PIC",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-55"
 },
 "ei16": {
  "id": "ei16",
  "kode": "EI.16",
  "judul": "Insiden INS-SEN-2026-0007 ditutup",
  "nama": "Hendra Wijaya",
  "konteks": "Sari Wulandari menutup insiden yang Anda terima lewat jalur cepat.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Lama penanganan",
    "v": "2 hari 2 jam · dalam tenggat"
   },
   {
    "k": "Penyebab",
    "v": "Celah pengamanan fisik"
   },
   {
    "k": "Tim terlibat",
    "v": "PT Garda Nusantara Sejahtera (BUJP), Polres Musi Banyuasin (Polri)"
   },
   {
    "k": "Tindak lanjut",
    "v": "2 tetap berjalan"
   },
   {
    "k": "Ditutup",
    "v": "30 Okt 2026, 09:40 WIB"
   }
  ],
  "tombol": "Buka insiden",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Insiden bisa dibuka kembali dalam 30 hari bila kejadian berulang.",
  "penerima": "Pelapor, PIC; penerima kiriman langsung bila Tinggi/Kritis",
  "kategori": "Info [USULAN]",
  "dasar": "INS-03 FR-INS-55"
 },
 "ei17": {
  "id": "ei17",
  "kode": "EI.17",
  "judul": "Insiden INS-SEN-2026-0007 dibuka kembali",
  "nama": "Andi Pratama",
  "konteks": "Sari Wulandari membuka kembali insiden yang Anda tangani. Status kembali Dalam penanganan.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Alasan",
    "v": "Kabel kembali dicuri di titik yang sama 2 Nov; penyebab belum tuntas."
   },
   {
    "k": "Dibuka kembali",
    "v": "3 Nov 2026, 08:10 WIB"
   }
  ],
  "tombol": "Buka penanganan",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Penerima jalur cepat juga diberi tahu.",
  "penerima": "PIC + penerima kiriman langsung",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-57"
 },
 "ei18": {
  "id": "ei18",
  "kode": "EI.18",
  "judul": "Arahan SKK Migas untuk insiden INS-SEN-2026-0007",
  "nama": "Andi Pratama",
  "konteks": "Hendra Wijaya, Pengawas SKK Migas, memberi arahan pada insiden yang Anda tangani.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Arahan",
    "v": "Koordinasikan patroli gabungan dengan Polres Musi Banyuasin minggu ini. Laporkan hasilnya di kronologi."
   },
   {
    "k": "Diberikan",
    "v": "30 Okt 2026, 10:05 WIB"
   }
  ],
  "tombol": "Buka penanganan",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Pejabat Berwenang bisa menjadikan arahan ini tindak lanjut. Arahan tidak mengubah status, PIC, atau tenggat.",
  "penerima": "PIC + R-06",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-59"
 },
 "ei2": {
  "id": "ei2",
  "kode": "EI.2",
  "judul": "Insiden Tinggi dilaporkan, belum diperiksa",
  "nama": "Hendra Wijaya",
  "konteks": "PT Samudra Energi Nusantara baru saja melaporkan insiden berkeparahan Tinggi. Pemeriksaan KKKS masih berjalan, jadi isinya masih bisa berubah.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Kategori",
    "v": "Pencurian/Perampokan"
   },
   {
    "k": "Keparahan awal",
    "v": "Tinggi · Belum diperiksa"
   },
   {
    "k": "Lokasi",
    "v": "Sumur ADR-07, Kab. Musi Banyuasin · WK Andalas Darat"
   },
   {
    "k": "Waktu kejadian",
    "v": "28 Okt 2026, 01:00 WIB"
   },
   {
    "k": "Diajukan",
    "v": "28 Okt 2026, 07:00 WIB"
   }
  ],
  "tombol": "Buka insiden",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Anda akan menerima kabar bila insiden ini disetujui, dibatalkan, digabung, atau ditutup.",
  "penerima": "Semua Pengawas SKK & Pimpinan SKK + R-06 organisasi pelapor",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-40, 41"
 },
 "ei3": {
  "id": "ei3",
  "kode": "EI.3",
  "judul": "Insiden Tinggi dilaporkan, kemungkinan sama dengan laporan sebelumnya",
  "nama": "Hendra Wijaya",
  "konteks": "PT Samudra Energi Nusantara melaporkan insiden Tinggi yang mirip dengan insiden yang sudah Anda terima. Pejabat Berwenang KKKS akan memutuskan apakah keduanya kejadian yang sama.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0009\nKabel pompa ADR-07 dipotong"
   },
   {
    "k": "Kemungkinan sama dengan",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Keparahan awal",
    "v": "Tinggi · Belum diperiksa"
   },
   {
    "k": "Sumber",
    "v": "WhatsApp · grup Pam ADR Area 2"
   },
   {
    "k": "Diajukan",
    "v": "28 Okt 2026, 08:34 WIB"
   }
  ],
  "tombol": "Buka insiden",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0009",
  "penutup": "Bila keduanya digabung, Anda menerima satu kabar \"Digabung ke INS-SEN-2026-0007\".",
  "penerima": "Penerima kiriman langsung",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-42, P-06"
 },
 "ei4": {
  "id": "ei4",
  "kode": "EI.4",
  "judul": "Insiden INS-SEN-2026-0007 disetujui",
  "nama": "Hendra Wijaya",
  "konteks": "Sari Wulandari, Pejabat Berwenang PT Samudra Energi Nusantara, menyetujui insiden yang Anda terima lewat jalur cepat. Insiden kini data resmi dan sedang ditangani.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Klasifikasi",
    "v": "Pencurian/Perampokan · Keparahan Tinggi · Prioritas Tinggi"
   },
   {
    "k": "PIC penanganan",
    "v": "Andi Pratama"
   },
   {
    "k": "Tenggat penanganan",
    "v": "2 Nov 2026"
   },
   {
    "k": "Disetujui",
    "v": "28 Okt 2026, 13:20 WIB"
   }
  ],
  "tombol": "Buka insiden",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Bila keparahan resmi lebih rendah dari keparahan awal, email ini menampilkan keduanya.",
  "penerima": "Penerima kiriman langsung",
  "kategori": "Info [USULAN]",
  "dasar": "INS-03 FR-INS-42 · INS-02 FR-INS-22"
 },
 "ei5": {
  "id": "ei5",
  "kode": "EI.5",
  "judul": "Insiden INS-SEN-2026-0007 dibatalkan",
  "nama": "Hendra Wijaya",
  "konteks": "Sari Wulandari membatalkan insiden yang Anda terima lewat jalur cepat. Insiden ini tidak masuk statistik.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Alasan",
    "v": "Kabel dipindah kontraktor untuk perbaikan panel, dikonfirmasi PT Garda Nusantara Sejahtera."
   },
   {
    "k": "Dibatalkan",
    "v": "28 Okt 2026, 13:20 WIB"
   }
  ],
  "tombol": "Buka insiden",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Bila dijadikan kerawanan, email ini memakai judul \"dijadikan kerawanan\" dan menautkan ke laporan kerawanan barunya.",
  "penerima": "Pelapor + penerima kiriman langsung",
  "kategori": "Wajib",
  "dasar": "INS-02 FR-INS-26a, 26b · INS-03 FR-INS-42"
 },
 "ei6": {
  "id": "ei6",
  "kode": "EI.6",
  "judul": "Insiden INS-SEN-2026-0009 digabung ke INS-SEN-2026-0007",
  "nama": "Andi Pratama",
  "konteks": "Sari Wulandari menilai laporan Anda dan laporan Budi Santoso adalah kejadian yang sama. Foto dan pesan WhatsApp Anda kini ada di kronologi insiden tujuan.",
  "rows": [
   {
    "k": "Laporan Anda",
    "v": "INS-SEN-2026-0009 · Dibatalkan\nKabel pompa ADR-07 dipotong"
   },
   {
    "k": "Digabung ke",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Digabung",
    "v": "28 Okt 2026, 13:10 WIB"
   }
  ],
  "tombol": "Buka insiden tujuan",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Penerima jalur cepat menerima kabar yang sama, satu kali.",
  "penerima": "Pelapor insiden sumber + penerima kiriman langsung",
  "kategori": "Info [USULAN]",
  "dasar": "INS-02 FR-INS-25 · INS-03 FR-INS-42"
 },
 "ei7": {
  "id": "ei7",
  "kode": "EI.7",
  "judul": "Revisi diminta untuk insiden Anda",
  "nama": "Budi Santoso",
  "konteks": "Sari Wulandari, Pejabat Berwenang di PT Samudra Energi Nusantara, meminta Anda melengkapi bagian berikut.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Bagian",
    "v": "Kejadian & dampak"
   },
   {
    "k": "Alasan",
    "v": "Perkiraan kerugian masih kosong. Isi dari data gudang bila sudah ada."
   },
   {
    "k": "Diminta",
    "v": "28 Okt 2026, 13:05 WIB"
   }
  ],
  "tombol": "Perbaiki laporan",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Waktu registrasi tidak berubah saat Anda mengajukan ulang.",
  "penerima": "Pelapor",
  "kategori": "Wajib",
  "dasar": "INS-02 FR-INS-26"
 },
 "ei8": {
  "id": "ei8",
  "kode": "EI.8",
  "judul": "Anda ditunjuk sebagai PIC insiden",
  "nama": "Andi Pratama",
  "konteks": "Sari Wulandari menyetujui insiden berikut dan menunjuk Anda sebagai penanggung jawab penanganannya. Catat setiap langkah di tab Penanganan.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Keparahan",
    "v": "Tinggi · Prioritas Tinggi"
   },
   {
    "k": "Lokasi",
    "v": "Sumur ADR-07, Kab. Musi Banyuasin · WK Andalas Darat"
   },
   {
    "k": "Tenggat penanganan",
    "v": "2 Nov 2026 (3 hari kerja sejak registrasi)"
   },
   {
    "k": "Saran langkah",
    "v": "2 saran dari pemeriksa. Jadikan tindak lanjut atau abaikan di halaman penanganan."
   }
  ],
  "tombol": "Buka penanganan",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Insiden ini juga tampil di Tugas saya.",
  "penerima": "PIC baru",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-43"
 },
 "ei8b": {
  "id": "ei8b",
  "kode": "EI.8b",
  "judul": "Tim Anda ditunjuk sebagai PIC insiden",
  "nama": "Dedi Kurniawan",
  "konteks": "Sari Wulandari menyetujui insiden berikut dan menunjuk Tim Pengamanan ADR Area 2 sebagai penanggung jawab penanganannya. Anggota pertama yang mengambil alih menjadi PIC; anggota lain diberi tahu dan hanya bisa melihat. Bila belum ada yang mengambil alih dalam 4 jam, tim dan Pejabat Berwenang diingatkan.",
  "rows": [
   {
    "k": "Insiden",
    "v": "INS-SEN-2026-0007\nPencurian kabel listrik sumur ADR-07"
   },
   {
    "k": "Keparahan",
    "v": "Tinggi · Prioritas Tinggi"
   },
   {
    "k": "Lokasi",
    "v": "Sumur ADR-07, Kab. Musi Banyuasin · WK Andalas Darat"
   },
   {
    "k": "PIC",
    "v": "Tim Pengamanan ADR Area 2 (4 anggota)\nAndi Pratama, Dedi Kurniawan, Joko Susilo, Rina Wijaya"
   },
   {
    "k": "Tenggat penanganan",
    "v": "2 Nov 2026 (3 hari kerja sejak registrasi)"
   },
   {
    "k": "Saran langkah",
    "v": "2 saran dari pemeriksa. Jadikan tindak lanjut atau abaikan di halaman penanganan."
   }
  ],
  "tombol": "Ambil alih penanganan",
  "tautan": "https://perisai.skkmigas.go.id/insiden/INS-SEN-2026-0007",
  "penutup": "Email yang sama dikirim ke semua anggota tim. Tenggat penanganan tetap berjalan sejak registrasi.",
  "penerima": "Semua anggota grup PIC (tambahan; EI.8b tidak ada di katalog board)",
  "kategori": "Wajib",
  "dasar": "INS-03 FR-INS-43"
 }
};
