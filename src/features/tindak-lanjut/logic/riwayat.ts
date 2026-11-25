// Riwayat tindak lanjut menurut spek LR-SpekRiwayatTL: label kejadian, ikon, simpul, detail sistem, dan catatan orang.
// Store mencatat kalimat lengkap (mis. "Mengajukan selesai."); di sini kalimat itu dipetakan ke tampilan spek.

export type RiwayatTone = '' | 'warn' | 'ok' | 'err';
export interface RiwayatView {
  label: string;
  icon: string;
  tone: RiwayatTone;
  /** detail sistem (baris kedua, teks abu) */
  detail?: string;
  /** catatan yang ditulis orang (kotak) */
  note?: string;
  /** tag "Diperiksa sendiri" */
  self?: boolean;
}

const IC = {
  tambah: 'M12 5v14M5 12h14',
  mulai: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  kirim: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  ulang: 'M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6',
  kembali: 'M19 12H5M12 19l-7-7 7-7',
  centang: 'M20 6 9 17l-5-5',
  silang: 'M18 6 6 18M6 6l12 12',
  kalender: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
  pengguna: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
};

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
/** "2026-10-16" -> "16 Okt 2026" */
const tgl = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return y && m && d ? `${d} ${MON[m - 1]} ${y}` : iso;
};

export function riwayatOf(text: string): RiwayatView {
  let m: RegExpMatchArray | null;
  if (text.startsWith('Membuat tindak lanjut')) return { label: 'Dibuat', icon: IC.tambah, tone: '' };
  if (text.startsWith('Mulai dikerjakan')) return { label: 'Mulai dikerjakan', icon: IC.mulai, tone: '' };
  if (text.startsWith('Mengajukan selesai')) return { label: 'Diajukan selesai', icon: IC.kirim, tone: '' };
  if (text.startsWith('Menarik pengajuan')) return { label: 'Pengajuan ditarik', icon: IC.ulang, tone: '', detail: 'Kembali menjadi Dikerjakan' };
  if ((m = text.match(/^Mengembalikan: (.*)$/s))) return { label: 'Dikembalikan', icon: IC.kembali, tone: 'warn', detail: 'Hitungan terlambat berjalan lagi', note: m[1] };
  if (text.startsWith('Diperiksa selesai')) return { label: 'Diperiksa selesai', icon: IC.centang, tone: 'ok', detail: 'Bukti menjadi resmi', self: text.includes('Diperiksa sendiri') };
  if ((m = text.match(/^(?:Dibatalkan|Membatalkan): (.*)$/s))) return { label: 'Dibatalkan', icon: IC.silang, tone: 'err', detail: 'Tidak dihitung terlambat', note: m[1] };
  if ((m = text.match(/^Mengubah tenggat dari (\S+) menjadi (\S+)\. Alasan: (.*)$/s)))
    return { label: 'Tenggat diubah', icon: IC.kalender, tone: '', detail: `Dari ${tgl(m[1])} menjadi ${tgl(m[2])}`, note: m[3] };
  if ((m = text.match(/^Mengganti PIC dari (.+?) ke (.+?)\. Alasan: (.*)$/s)))
    return { label: 'PIC diganti', icon: IC.pengguna, tone: '', detail: `Dari ${m[1]} ke ${m[2]}`, note: m[3] };
  return { label: text.replace(/\.$/, ''), icon: IC.tambah, tone: '' };
}
