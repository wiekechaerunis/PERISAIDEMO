# Paritas visual: aplikasi vs board desain

Tidak ada PNG board, jadi board asli dirender dengan runtime desainnya (`design-ref/project/support.js` = `dc-runtime.js` dari artifact) dan dibandingkan dengan aplikasi di satu origin:
dev server menyajikan board di `/__ref/<Board>.dc.html` (hanya dev, tidak ikut build). Skrip: `scripts/parity-compare.js`.

Metrik: **cover** = % baris teks board yang juga ada di aplikasi; **geometri** = posisi/ukuran kartu, appbar, tabel, stepper (toleransi 3 px).
Cover tidak bisa 100% karena (a) board menumpuk beberapa state dalam satu artboard (dialog, rekam suara, Copilot "chat") yang tersembunyi tetapi terbaca, (b) data contoh board berbeda dari seed, (c) teks terpecah beberapa node.

## Hasil (diukur 18 Nov 2026)

| Layar | Cover teks | Geometri |
|---|---|---|
| Main (daftar Pelapor) | 97% | sama |
| I12 langkah 1 · I13 langkah 2 | 42% · 51% (draf terisi) | kartu sama; yang beda hanya panel Copilot (state default board "chat") |
| I13b lampiran · I14 ringkasan | 67% · 86% | kartu sama |
| I15 detail Pelapor | 87% | semua kartu sama setelah seed jejak audit diperbaiki |
| I31 daftar SKK · I32 detail SKK | 93% · 84% | sama |
| V11 daftar Pejabat | 82% | sama |
| V12 review | 80% | tinggi halaman identik (1879 px) |
| KD1 detail kerawanan | 86% | semua kartu sama |
| CFG Tenggat | 100% | sama |
| CFG Matriks · CFG Daftar | 96% · 84% | sama |
| Mobile M1 · MV1 · M12 · MP1 · MK1 | 79% · 57% · 85% · 50% · 81% | tampilan `in-m` termuat |
| Mobile M2a · M7 · M8 · MV2 | 78% · 94% · 89% · 80% | tampilan `in-m` termuat |

Hanya selisih tinggi sidebar (artboard memakai tinggi tetap, aplikasi menempel setinggi layar) yang tersisa pada geometri desktop.

## Diperbaiki dari pembandingan ini

- Judul saran AI memakai huruf asli cerita: "Pencurian kabel listrik **sumur** ADR-07" (sebelumnya "Sumur").
- Keterangan saran keparahan di langkah 2 tidak lagi menyebut kerugian ("Dari dampak: operasi berhenti 6 jam.").
- Baris lokasi di ringkasan: "Kab. Musi Banyuasin · WK Andalas Darat".
- Kurs contoh 16.500 (sama dengan board Matriks), sehingga pratinjau Rupiah cocok.
- Jejak audit seed: "Draf dibuat" 06:41 dan "Diajukan" 07:00 (kartu Riwayat I15 kini setinggi board).

## Selisih yang masih ada

- **I14:** bar "9 isian dari saran AI sudah Anda pakai · 1 isian masih Perlu dicek: waktu kejadian" belum ada (draf tidak punya konsep "perlu dicek" per isian).
- **Mobile:** penghitung langkah "1/4" dan tombol "Berikutnya: …" di bar bawah form (M2a, M7) perlu dicek terhadap board; Kerawanan memakai 2 segmen.
- **Data seed vs board:** daftar mobile dan Pejabat/PIC memakai data seed (6 insiden, bukan 12) dan INS-0006 berstatus Perlu perbaikan (A2).
- **Batas verifikasi INS-0007:** board V11/VS5 "28 Okt 08:00 (lewat 5 jam)" bertentangan dengan I15/V12 "29 Okt 07:00 (sisa 18 jam)"; seed mengikuti V11 (A17).
- **Nama:** I15 menyebut "Rudi Hartono, Pimpinan SKK", sedangkan PIC tindak lanjut di board T* juga bernama Rudi. Aplikasi memakai "Rudi Hartono" untuk PIC tindak lanjut dan "Pimpinan SKK" tanpa nama.
- Layar yang belum dibandingkan: P*, T*, KD2–KD6, WhatsApp, email, MA*/MS*/MP*/MV3–MV6 (sheet, state, dialog).

## Perluasan (layar penanganan, tindak lanjut, kerawanan, WhatsApp, email, sheet mobile)

Skrip kini mendukung skenario data (`scen`) dan klik pembuka sheet (`act`). Layar yang butuh data tertentu dijalankan dengan skenario "disetujui" (INS-0007 → PIC Andi) atau "penutupan" (INS-0012, data penutupan lengkap).

| Kelompok | Layar (cover teks · geometri) |
|---|---|
| **Email** | EI1–EI18 (tanpa EI9) dan EK1: **100% teks, geometri sama** untuk semua 19 |
| **Kerawanan** | KD1 88% · KD3 92% · KD5 93% · KD6 88% (semua geometri sama) · K.1 daftar 98% · KD2 51% (dialog menimpa detail) · KD4 41% (data: board memakai KRW-0047→INS-0011, seed KRW-0045→INS-0010) |
| **Penanganan PIC** | P11 91% · P10 79% · P12 65% · P14 61% (selisih utama data: board memuat catatan dan lampiran lebih banyak) |
| **Penutupan Pejabat** | P22 86% (varian cocok 88%; dialog P23/P25/P27 setara) · P24 81% · P35 SKK 78% |
| **SKK** | P31 65% (data: jumlah lampiran 2 vs 3, riwayat 4 vs 8 entri, 4 TL vs 2) |
| **Tugas saya** | V10 61% · P20 64% · P10 79% · T4 81% · T4b 87% (isi baris mengikuti seed) |
| **Tindak lanjut** | T3 88% · T5 88% · T4 81% · T4b 87% · T6 58% · T7 57% · T1 61% (T6/T7 memakai TL-0041 di board, seed memakai TL-0039/0034) |
| **WhatsApp** | I20 84% · I21 91% · I23 39% (dicek sebagai Pejabat karena 0009 tersembunyi untuk Pelapor) |
| **Mobile (sheet)** | MV2 80% · MV3 80% · MV4 80% · MP4 73% · MP5 85% · MP6 87% · MP2 67% · MP3 71% · MS03 58% · MS07: sheet terbuka dengan teks sama ("Tarik kembali jadi draf? …") |

### Tindak lanjut perbaikan

- **P22 (diperbaiki):** kalimat "Belum cocok" memakai judul tindak lanjut lengkap ("…anti potong di panel ADR-07") sehingga satu baris lebih panjang dari board. Sekarang "…“Pasang gembok anti potong” masih Dikerjakan…". Tinggi dan posisi semua kartu P22, P22c, P22k, P22g kini sama dengan board (selisih sisa hanya lebar 8 px karena scrollbar iframe pengukur).
- **Bukan cacat (selisih skenario):** board P31/P32/P33 menggambarkan INS-0007 *setelah* alur berjalan (digabung dengan 0009 sehingga lampiran ketiga "kabel-adr07-wa.jpg", catatan PIC, eskalasi, tautan ke KRW-0039). Seed menggambarkan keadaan awal yang cocok dengan I15/V12 (2 lampiran, 2 entri riwayat). Mengubah seed agar cocok P31 akan merusak kecocokan I15/V12/V11. Kartu "Tautan" sudah ada di aplikasi dalam bentuk baris "Terkait" bila insiden punya asal KRW (`fromKrw`); pada INS-0007 baru muncul bila ada tautan.
- **TL-0041 vs TL-0039/0034:** T6/T7 di board memakai satu TL untuk semua keadaan; aplikasi memakai tiga TL seed berbeda untuk memperlihatkan semua status sekaligus.

### Masih terbuka

- **I14:** bar "…1 isian masih Perlu dicek: waktu kejadian" belum ada (draf tidak punya konsep "perlu dicek" per isian).
- **I23:** belum dibandingkan sebagai Pelapor karena INS-0009 disembunyikan untuk Pelapor di seed.
- **Mobile:** geometri tidak bermakna (board `in-m` tidak memakai `.p-card`); penghitung "1/4" dan "Berikutnya: …" di bar bawah form perlu dicek visual.
- Layar yang belum dibandingkan: P15/P16/P17/P26/P28/P32/P33/P34, PS*/VS*/S* (state), V13–V34 dialog, MA2–MA7, MS*/MV5–MV6, M9–M11, KF1.
