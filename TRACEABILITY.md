# Traceability (rute → board)

Daftar lengkap seluruh board ada di `/dev/boards` (dibaca dari `src/dev/canvas.json`; peta rute di `src/dev/routes.ts`).

| Rute | Board | FR | Status |
|---|---|---|---|
| `/insiden` | Main, Main-Filter | FR-INS-14, 15 | Fase 1: Pelapor mendekati 1:1 (pintasan, filter, chip, tabel) |
| `/insiden` (Pejabat/PIC/SKK) | V11, P11, P21, I31 | FR-INS-15, 53 | Parsial: kolom dan pintasan masih generik |
| `/insiden?tab=kerawanan` | Kerawanan | K-1 | Parsial: tabel sementara |
| Shell | Sidebar | | Sidebar, AppBar, tab; mobile belum |
| `/insiden/baru/temuan` | I12, S16, Copilot I12e/o/p/r | FR-LK-25, FR-INS-01, 60–65 | Fase 2: 1:1 struktur; pemilih lokasi kini peta. Wawancara Copilot: A56-A61 |
| `/insiden/baru/kejadian` | I13, I13r | FR-INS-01–06 | Fase 2: belum dicek visual terhadap board; selisih S01 (stepper `warn`) |
| `/insiden/baru/lampiran` | I13b | INS-01 | Fase 2: tanpa upload sungguhan |
| `/insiden/baru/ringkasan` | I14, I14s, S01, S05, S06 | FR-INS-09 | Fase 2: Ajukan membuat insiden di store |
| `/insiden/baru/detail` | S16b | usulan K-1 | Fase 2: kerawanan langsung tercatat |
| `/insiden/:no` | I15, I23, I32, V14, S12, S07 | FR-INS-16, 17, 10 | Fase 3: detail dari store; belum dicek visual |
| `/insiden/:no/review` | V12 + varian, V13/V13g, V21/V22, V31–V34, VS1–VS5 | FR-INS-21–28 | Fase 3: Setujui/Revisi/Batalkan/Gabung/Jadikan kerawanan/Terbatas jalan; V12b tanpa rute sendiri |
| `/tugas` | V10, P10, P20, T4, T4b | FR-INS-20, 44, 54 | Fase 3: tindak lanjut sudah ada (fase 6) |
| `/insiden/:no` (PIC), `/insiden/:no/tangani` | P12, P12g/h, P14, P15, P16, P17, PS1–PS6, PS9, PS11 | FR-INS-43–46, 53 | Fase 4: catatan, eskalasi, data penutupan, Ajukan penutupan jalan; belum dicek visual |
| `/insiden/:no` (Pejabat, status berjalan) | P22/c/g/k, P23–P29, P33, P34, PS5, PS7, PS8, PS10 | FR-INS-51, 55–57, 59 | Fase 4: Tutup, Kembalikan, Ganti PIC, Ubah tenggat, Buka kembali jalan |
| `/insiden/:no` (SKK, status berjalan) | P31, P32, P35, P36 | FR-INS-59 | Fase 4: Beri arahan jalan; P36 lewat `?persetujuan=skk` |
| `/kerawanan/:no` | KD1–KD6, S16b | usulan K-1, K-2 | Fase 5: Naikkan (berdampak), Ajukan jadi insiden, Tambah perkembangan jalan; belum dicek visual |
| `/kerawanan/ringkasan` | EK1 | usulan 18 Nov | Fase 5: ringkasan harian (data board) |
| `/tindak-lanjut`, `/tindak-lanjut/:no`, `/tindak-lanjut/baru` | T1, T1b, T3, T3b, T4, T4b, T5–T9 | FR-INS-120..123 | Fase 6: tambah, ajukan selesai, verifikasi, kembalikan, batal karena gabung jalan; daftar tanpa board (tabel minimal) |
| `/konfigurasi`, `/konfigurasi/matriks-keparahan`, `/konfigurasi/tenggat` | CFG-Daftar, CFG-MatriksKeparahan, CFG-Tenggat | FR-CFG-08 | Fase 8: simpan nyata, riwayat, memengaruhi tenggat dan saran keparahan; belum dicek visual |
| Mobile `/insiden` | M1, M12, MP1, MV1, MK1, MS08–MS12 | FR-INS-14, 15, RS-1 | Mobile: `src/mobile/lists` |
| Mobile `/insiden/baru/*` | M2a, M2, M3, M4, M7, M7s, MA1–MA7, MS01–MS07, MS13–MS17 | FR-INS-60–65, 85, 86 | Mobile: `src/mobile/formA`, `formB`; M5 ganda hanya `?state=ganda` |
| Mobile `/insiden/:no` | M6, M8, M11, MS12, MP2–MP6 | FR-INS-16, 43–46, 51, 55 | Mobile: pengarah `src/mobile/registry/incident.tsx` → `formB/MobileIncidentDetail` atau `handling/MobileHandlingDetail` |
| Mobile `/insiden/:no/review` | MV2, MV2m, MV3–MV6 | FR-INS-21–26 | Mobile: `src/mobile/review` |
| `/dev/email`, `/dev/email/:id` | EmailKatalog, Email, EI1–EI18 (tanpa EI9), EK1 | INS-03 Tabel N-1 | Pratinjau saja, tidak dikirim; data contoh board |
| `/insiden/wa`, `/insiden/wa/{temuan,kejadian,lampiran,ringkasan}`, `/insiden/wa/pesan/:id`, `/insiden/wa/tautan/:no`, `/insiden/wa/:no` | I20, I21, I21b, I22, I22b, I23, I24, I25, IF2 | FR-INS-11, 12, 13, W-2 | Alur WA jalan: draf dari pesan, ganda, tautkan/lepas; kotak masuk `/insiden/wa` tanpa board |
| Mobile WA | M9, M10, M11, MS04 | FR-INS-12 | `src/mobile/whatsapp` (langkah 3–4 memakai desktop) |
- 2026-11-19: istilah Pemeriksaan/Disetujui, tenggat hari kerja (workdays.ts), persona Koordinator Security, Diperiksa sendiri (lihat ASSUMPTIONS A69–A73).
