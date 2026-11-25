// Seed tindak lanjut (fase 6) mengikuti contoh board T3, T4, T4b, T5, T6, T7: semua bersumber INS-SEN-2026-0007.
// Tidak mengimpor seed.ts agar tidak melingkar. Waktu layar TL memakai TL_NOW (workflow.followup.ts).
import type { FollowUp } from '../types';


type X = Pick<FollowUp, 'no' | 'incidentNo' | 'action' | 'pic' | 'createdBy' | 'dueAt' | 'status'> & Partial<FollowUp>;
const tl = (x: X): FollowUp => ({
  source: 'manual', createdAt: '2026-10-20T09:00:00', evidence: [], notes: [],
  history: [{ at: x.createdAt ?? '2026-10-20T09:00:00', by: x.createdBy, text: `Membuat tindak lanjut dan menugaskan ke ${x.pic}.` }],
  ...x,
});
const files = (...n: [string, number][]) => n.map(([name, sizeKb]) => ({ name, sizeKb }));

const EXTRA: FollowUp[] = [
  // Kasus "arahan-belum" (PgKartu) dari sisi PIC demo Rudi Hartono. Nomor 0042 dipilih agar nomor TL berikutnya tetap 0046.
  tl({
    no: 'TL-SEN-2026-0042', incidentNo: '', sourceKind: 'arahan', source: 'arahan-skk', action: 'Tambah titik patroli di jalur pipa KM 12', pic: 'Rudi Hartono',
    createdBy: 'Sari Wulandari', createdAt: '2026-10-28T10:10:00', dueAt: '2026-11-07T17:00:00', status: 'belum-dimulai',
    expectedEvidence: 'Jadwal patroli baru dan log patroli 1 minggu',
    arahan: { date: '2026-10-27', channel: 'Rapat', giver: 'Bambang Sutrisno · Kepala Divisi Pengamanan, SKK Migas', title: 'Rapat koordinasi pengamanan 27 Okt 2026', doc: 'Notulen rapat koordinasi 27 Okt.pdf' },
  }),
  // Kasus "cctv-belum" (PgKartu) dari sisi PIC demo Rudi Hartono, pemberi tugas Andi Pratama.
  // Bersumber INS-SEN-2026-0010 (Dalam penanganan) agar tampil sejak awal; nomor di bawah 0045 agar nomor TL berikutnya tetap 0046.
  tl({
    no: 'TL-SEN-2026-0035', incidentNo: 'INS-SEN-2026-0010', action: 'Pasang lampu sorot tambahan di sekitar sumur ADR-07', pic: 'Rudi Hartono',
    createdBy: 'Andi Pratama', createdAt: '2026-10-30T09:40:00', dueAt: '2026-11-06T17:00:00', status: 'belum-dimulai',
    expectedEvidence: 'Foto lampu terpasang dan menyala malam hari',
  }),
  tl({
    no: 'TL-SEN-2026-0045', incidentNo: '', sourceKind: 'arahan', source: 'arahan-skk', action: 'Perketat patroli malam di jalur pipa KM 10–16', pic: 'Joko Susilo',
    createdBy: 'Dedi Kurniawan', createdAt: '2026-10-28T09:40:00', dueAt: '2026-11-07T17:00:00', status: 'belum-dimulai',
    expectedEvidence: 'Jadwal patroli baru dan log patroli 1 minggu',
    arahan: { date: '2026-10-27', channel: 'Rapat', giver: 'Bambang Sutrisno · Kepala Divisi Pengamanan, SKK Migas', title: 'Rapat koordinasi pengamanan 27 Okt 2026', doc: 'Notulen rapat koordinasi 27 Okt.pdf' },
  }),
  tl({
    no: 'TL-SEN-2026-0044', incidentNo: '', sourceKind: 'kerawanan', krwNo: 'KRW-SEN-2026-0047', action: 'Pasang satu CCTV yang mengarah ke pagar sisi barat ADR-07', pic: 'Dedi Kurniawan',
    createdBy: 'Sari Wulandari', createdAt: '2026-10-06T16:10:00', dueAt: '2026-10-20T17:00:00', status: 'belum-dimulai',
    expectedEvidence: 'Foto CCTV terpasang dan tangkapan layar tampilan kamera ke pagar sisi barat',
  }),
  tl({
    no: 'TL-SEN-2026-0033', incidentNo: '', sourceKind: 'kerawanan', krwNo: 'KRW-SEN-2026-0047', action: 'Perbaiki pagar sisi barat sumur ADR-07', pic: 'Rudi Hartono',
    createdBy: 'Sari Wulandari', createdAt: '2026-10-19T09:15:00', dueAt: '2026-11-02T17:00:00', status: 'belum-dimulai',
    expectedEvidence: 'Foto pagar setelah diperbaiki dari dua sisi',
  }),
  tl({
    no: 'TL-SEN-2026-0038', incidentNo: 'INS-SEN-2026-0006', action: 'Tambah lampu sorot di pagar perimeter terminal', pic: 'Joko Susilo',
    createdBy: 'Dedi Kurniawan', dueAt: '2026-10-29T17:00:00', status: 'menunggu-verifikasi', evidence: files(['lampu-sorot-1.jpg', 2100], ['lampu-sorot-2.jpg', 1900]),
    submittedAt: '2026-10-28T10:20:00', completionNote: 'Dua lampu sorot baru terpasang dan menyala.',
  }),
  // Kartu uji jalur pemeriksa: Andi Pratama (pemeriksa) menunggu memeriksa hasil Rudi Hartono.
  tl({
    no: 'TL-SEN-2026-0043', incidentNo: 'INS-SEN-2026-0003', action: 'Pasang papan peringatan di gerbang 2', pic: 'Rudi Hartono',
    createdBy: 'Andi Pratama', dueAt: '2026-11-06T17:00:00', status: 'menunggu-verifikasi', expectedEvidence: 'Foto papan terpasang di gerbang 2', evidence: files(['papan-gerbang-2.jpg', 1700]),
    submittedAt: '2026-11-04T14:30:00', completionNote: 'Papan peringatan terpasang di gerbang 2.',
  }),
  tl({
    no: 'TL-SEN-2026-0029', incidentNo: 'INS-SEN-2026-0004', action: 'Ganti gembok gudang suku cadang', pic: 'Dedi Kurniawan',
    createdBy: 'Sari Wulandari', createdAt: '2026-10-23T13:15:00', dueAt: '2026-10-30T17:00:00', status: 'dikembalikan',
    expectedEvidence: 'Foto gembok baru terpasang dan kunci diserahkan ke kepala gudang',
    evidence: files(['gembok-gudang.jpg', 1800], ['berita-acara-kunci.pdf', 400]),
    notes: [{ at: '2026-10-30T15:20:00', by: 'Dedi Kurniawan', text: 'Gembok sudah diganti, menunggu serah terima kunci.' }],
    submittedAt: '2026-11-02T08:40:00', returnReason: 'Foto belum menunjukkan gembok baru terpasang di pintu gudang. Tambahkan foto dari jarak dekat.', returnedAt: '2026-11-03T09:05:00', returnedBy: 'Sari Wulandari',
  }),
  tl({
    no: 'TL-SEN-2026-0040', incidentNo: 'INS-SEN-2026-0003', action: 'Perbaiki CCTV gerbang 2', pic: 'Dedi Kurniawan',
    createdBy: 'Sari Wulandari', createdAt: '2026-10-28T09:40:00', dueAt: '2026-11-04T17:00:00', status: 'belum-dimulai',
    expectedEvidence: 'Foto CCTV menyala dan tangkapan layar rekaman',
  }),
  tl({
    no: 'TL-SEN-2026-0027', incidentNo: 'INS-SEN-2026-0006', action: 'Perbarui buku tamu di pos jaga 2', pic: 'Joko Susilo',
    createdBy: 'Sari Wulandari', dueAt: '2026-10-22T17:00:00', status: 'berjalan', evidence: files(['buku-tamu.jpg', 1200]),
  }),
  tl({
    no: 'TL-SEN-2026-0030', incidentNo: 'INS-SEN-2026-0005', action: 'Latih ulang regu jaga malam tentang rute patroli baru', pic: 'Rudi Hartono',
    createdBy: 'Sari Wulandari', dueAt: '2026-10-23T17:00:00', status: 'berjalan',
    expectedEvidence: 'Jadwal patroli baru dan daftar hadir pelatihan',
    evidence: [{ name: 'jadwal-patroli-baru.pdf', sizeKb: 420, at: '2026-11-03T10:12:00' }],
    notes: [{ at: '2026-11-02T16:05:00', by: 'Rudi Hartono', text: 'Pelatihan sesi pertama selesai, 12 dari 20 anggota hadir.', photos: 1 }],
    history: [
      { at: '2026-10-20T09:00:00', by: 'Sari Wulandari', text: 'Membuat tindak lanjut dan menugaskan ke Rudi Hartono.' },
      { at: '2026-11-02T16:05:00', by: 'Rudi Hartono', text: 'Mulai dikerjakan.' },
    ],
  }),
  tl({
    no: 'TL-SEN-2026-0025', incidentNo: 'INS-SEN-2026-0005', action: 'Pasang CCTV di jalur truk logistik', pic: 'Dedi Kurniawan',
    createdBy: 'Hendra Wijaya', createdAt: '2026-08-20T09:00:00', dueAt: '2026-09-05T17:00:00', status: 'selesai', expectedEvidence: 'Foto CCTV terpasang dan tangkapan layar rekaman',
    evidence: files(['cctv-gerbang3.jpg', 2400], ['rekaman-24jam.png', 880]), submittedAt: '2026-09-02T17:05:00', finishedAt: '2026-09-03T00:00:00',
    completionNote: 'CCTV terpasang dan merekam normal 24 jam; sudah tersambung ke NVR pos 1.', verifiedAt: '2026-09-03T14:10:00', verifiedBy: 'Hendra Wijaya',
  }),
  tl({
    no: 'TL-SEN-2026-0019', incidentNo: 'INS-SEN-2026-0004', action: 'Pasang lampu sorot cadangan di area tangki T-04', pic: 'Rudi Hartono',
    createdBy: 'Sari Wulandari', dueAt: '2026-10-12T17:00:00', status: 'selesai', evidence: files(['lampu-t04-1.jpg', 2000], ['lampu-t04-2.jpg', 1800], ['lampu-t04-3.jpg', 1700]),
    submittedAt: '2026-10-11T10:00:00', finishedAt: '2026-10-11T00:00:00', verifiedAt: '2026-10-11T15:00:00', verifiedBy: 'Sari Wulandari',
  }),
  tl({
    no: 'TL-SEN-2026-0036', incidentNo: 'INS-SEN-2026-0004', action: 'Perbarui daftar kontak darurat di pos jaga', pic: 'Rudi Hartono',
    createdBy: 'Andi Pratama', dueAt: '2026-10-09T17:00:00', status: 'selesai', evidence: files(['kontak-darurat.jpg', 900]),
    submittedAt: '2026-10-08T10:00:00', finishedAt: '2026-10-08T00:00:00', verifiedAt: '2026-10-08T15:00:00', verifiedBy: 'Andi Pratama',
  }),
  tl({
    no: 'TL-SEN-2026-0037', incidentNo: 'INS-SEN-2026-0005', action: 'Cat ulang marka jalur kendaraan di area gudang', pic: 'Dedi Kurniawan',
    createdBy: 'Andi Pratama', dueAt: '2026-10-07T17:00:00', status: 'selesai', evidence: files(['marka-jalur.jpg', 1300]),
    submittedAt: '2026-10-06T10:00:00', finishedAt: '2026-10-06T00:00:00', verifiedAt: '2026-10-06T15:00:00', verifiedBy: 'Andi Pratama',
  }),
  tl({
    no: 'TL-SEN-2026-0031', incidentNo: 'INS-SEN-2026-0010', action: 'Tambah rambu larangan masuk di sekitar sumur ADR-07', pic: 'Dedi Kurniawan',
    createdBy: 'Sari Wulandari', createdAt: '2026-10-19T11:05:00', dueAt: '2026-10-27T17:00:00', status: 'dibatalkan', expectedEvidence: 'Foto rambu terpasang di sekitar sumur',
    notes: [{ at: '2026-10-20T15:30:00', by: 'Dedi Kurniawan', text: 'Sudah minta penawaran dua vendor rambu, menunggu harga.' }],
    cancelReason: 'Rambu sudah dipasang pemerintah desa bersama Dinas Perhubungan pada 22 Okt, jadi pengadaan sendiri tidak diperlukan.', cancelledAt: '2026-10-23T10:15:00', cancelledBy: 'Sari Wulandari',
  }),
];

export function seedFollowUps(): FollowUp[] {
  return [
    {
      no: 'TL-SEN-2026-0034', incidentNo: 'INS-SEN-2026-0007', action: 'Pasang lampu sorot di gerbang ADR-07',
      pic: 'Rudi Hartono', dueAt: '2026-11-03T17:00:00', status: 'dikembalikan', source: 'manual', createdBy: 'Andi Pratama',
      createdAt: '2026-10-28T16:05:00', expectedEvidence: 'Foto lampu menyala malam hari',
      evidence: [{ name: 'lampu-sorot-gerbang.jpg', sizeKb: 2310 }], notes: [],
      submittedAt: '2026-10-29T10:30:00', completionNote: 'Lampu sorot terpasang di gerbang.',
      returnReason: 'Foto belum menunjukkan lampu menyala malam hari.', returnedAt: '2026-10-29T15:00:00', returnedBy: 'Andi Pratama',
      history: [
        { at: '2026-10-28T16:05:00', by: 'Andi Pratama', text: 'Membuat tindak lanjut dan menugaskan ke Rudi Hartono.' },
        { at: '2026-10-29T10:30:00', by: 'Rudi Hartono', text: 'Mengajukan selesai.' },
        { at: '2026-10-29T15:00:00', by: 'Andi Pratama', text: 'Mengembalikan: Foto belum menunjukkan lampu menyala malam hari.' },
      ],
    },
    {
      no: 'TL-SEN-2026-0039', incidentNo: 'INS-SEN-2026-0007', action: 'Pasang gembok anti potong di panel ADR-07',
      pic: 'Dedi Kurniawan', dueAt: '2026-11-05T17:00:00', status: 'menunggu-verifikasi', source: 'manual', createdBy: 'Andi Pratama',
      createdAt: '2026-10-29T09:00:00', expectedEvidence: 'Foto gembok terpasang',
      evidence: [{ name: 'gembok-panel-adr07.jpg', sizeKb: 1900 }], notes: [], submittedAt: '2026-11-04T10:00:00', completionNote: 'Gembok anti potong terpasang di panel.',
      history: [
        { at: '2026-10-29T09:00:00', by: 'Andi Pratama', text: 'Membuat tindak lanjut dan menugaskan ke Dedi Kurniawan.' },
        { at: '2026-11-04T10:00:00', by: 'Dedi Kurniawan', text: 'Mengajukan selesai.' },
      ],
    },
    {
      no: 'TL-SEN-2026-0041', incidentNo: 'INS-SEN-2026-0007', action: 'Perbaiki pagar sisi panel ADR-07 dengan panel beton',
      pic: 'Rudi Hartono', dueAt: '2026-11-06T17:00:00', status: 'belum-dimulai', source: 'manual', createdBy: 'Andi Pratama',
      createdAt: '2026-10-30T16:05:00', expectedEvidence: 'Foto pagar setelah diperbaiki',
      evidence: [], notes: [],
      history: [{ at: '2026-10-30T16:05:00', by: 'Andi Pratama', text: 'Membuat tindak lanjut dan menugaskan ke Rudi Hartono.' }],
    },
    // Data tambahan modul Tindak Lanjut (artifact TLJ-01: T11, T11b, T21, T22, T35): organisasi yang sama, sumber insiden, kerawanan, dan arahan SKK.
    ...EXTRA,
  ];
}
