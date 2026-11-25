// Data dan aturan murni langkah 2 "Kejadian & dampak" (board I13, S14, S15, S17, S18, S01).
import type { CasualtyKind, OpsImpact, Severity } from '@/lib/severity';
import { UNKNOWN, type Axis, type ReportDraft } from '../logic/draft';
import type { HandledBy } from '@/services/ai/types';

/** [kunci, label, deskripsi, daftar jenis] — 19 kategori (S14). Label dipakai sebagai nilai `draft.category`. */
export const KAT: [string, string, string, string[]][] = [
  ['pr', 'Pencurian/Perampokan', 'Aset, material, atau barang diambil tanpa hak, termasuk dengan kekerasan', []],
  ['pm', 'Pencurian minyak', 'Minyak mentah, kondensat, atau BBM diambil tanpa hak', ['Drilling', 'Tapping', 'Penggesekan', 'Dari tangki/fasilitas (usulan)']],
  ['pe', 'Pemerasan', 'Meminta uang atau barang dengan ancaman', []],
  ['bl', 'Blokade area', 'Akses jalan atau lokasi ditutup pihak lain', []],
  ['ps', 'Penyanderaan aset', 'Aset atau peralatan ditahan pihak lain', []],
  ['ph', 'Penghentian kegiatan/operasi', 'Kegiatan dihentikan paksa oleh pihak lain', []],
  ['ur', 'Unjuk rasa', 'Aksi massa menyampaikan tuntutan', []],
  ['sb', 'Sabotase', 'Aset sengaja dirusak untuk mengganggu operasi', []],
  ['pk', 'Perusakan material', 'Material atau fasilitas dirusak', []],
  ['kt', 'Kasus tanah', 'Sengketa atau klaim lahan yang mengganggu kegiatan', []],
  ['an', 'Ancaman', 'Ancaman atau intimidasi terhadap pekerja atau fasilitas', []],
  ['pc', 'Penculikan', 'Pekerja atau orang diculik', []],
  ['dt', 'DTT', 'Pelanggaran Daerah Terbatas/Terlarang · arti menunggu konfirmasi SKK', []],
  ['kb', 'Kebakaran', 'K3 · masuk cakupan atau tidak menunggu Q-048', []],
  ['kk', 'Kecelakaan kerja', 'K3 · menunggu Q-048', []],
  ['kl', 'Kecelakaan lalu lintas', 'K3 · menunggu Q-048', []],
  ['sf', 'Serangan fisik', 'Penganiayaan atau perkelahian terhadap pekerja atau petugas · usulan, belum ada di daftar SKK', []],
  ['sd', 'Serangan data', 'Pencurian atau kebocoran data/informasi perusahaan · usulan, belum ada di daftar SKK', []],
  ['ln', 'Lainnya', 'Tidak cocok dengan kategori di atas; jelaskan singkat', []],
];
export const KAT_LAIN = 'Lainnya';
export const JENIS_LAIN = 'Lainnya';
export const MAX_LAIN = 100;
export const MAX_DAMPAK = 500;
export const MAX_ALASAN = 300;

/** Daftar jenis turunan kategori; bila ada, ditambah "Lainnya" (S17). */
export const jenisOf = (category: string | null): string[] => {
  const j = KAT.find((k) => k[1] === category)?.[3] ?? [];
  return j.length ? [...j, JENIS_LAIN] : [];
};

export const AXES: [Axis, string][] = [
  ['prop', 'Properti atau operasi'],
  ['man', 'Manusia'],
  ['ling', 'Lingkungan pengamanan'],
  ['data', 'Data dan informasi'],
];
export const OPS: [OpsImpact, string][] = [
  ['tidak', 'Tidak terganggu'],
  ['sebagian', 'Terganggu sebagian'],
  ['berhenti', 'Berhenti'],
];
/** [kunci, label, level, frasa untuk alasan saran] */
export const KB: [CasualtyKind, string, Severity | null, string][] = [
  ['p3k', 'Luka ringan (P3K)', 'sangat-rendah', 'korban luka ringan (P3K)'],
  ['klinik', 'Dibawa ke klinik atau rumah sakit', 'rendah', 'korban dibawa ke klinik'],
  ['berat', 'Luka berat atau cacat', 'tinggi', 'korban luka berat atau cacat'],
  ['meninggal', 'Meninggal', 'kritis', 'korban meninggal'],
  ['belum', 'Belum diketahui', null, 'kondisi korban belum diketahui'],
];
/** B-11: pilihan terakhir "Belum diketahui" (tidak dihitung dalam saran) */
export const SEBARAN = ['Setempat', 'Regional', 'Nasional', 'Internasional', 'Belum diketahui'];
export const DATA_OPTS = ['Data terbatas', 'Data penting skala besar', 'Belum diketahui'];
/** Lainnya pada "Sudah ada yang menangani?" (B-12): maks. 50 karakter */
export const MAX_LAIN_TIM = 50;
export const MAX_TINDAKAN = 500;
export const TIMS: [HandledBy, string][] = [
  ['belum', 'Belum ada'],
  ['int', 'Security internal'],
  ['bujp', 'BUJP'],
  ['tni', 'TNI'],
  ['polri', 'Polri'],
];

/** Alur pilih-banyak dengan satu opsi eksklusif ("Belum diketahui" / "Belum ada"). */
export function toggleExclusive<T extends string>(list: T[], key: T, exclusive: T): T[] {
  const on = list.includes(key);
  if (key === exclusive) return on ? [] : [exclusive];
  return on ? list.filter((x) => x !== key) : [...list.filter((x) => x !== exclusive), key];
}

export function toggleCasualty(c: ReportDraft['casualties'], k: CasualtyKind): ReportDraft['casualties'] {
  if (k in c) {
    const rest = { ...c };
    delete rest[k];
    return rest;
  }
  if (k === 'belum') return { belum: 0 };
  const rest = { ...c };
  delete rest.belum;
  return { ...rest, [k]: 1 };
}

/** Rincian "Dari dampak: …" untuk kartu keparahan (renderVals board). */
export function severityParts(d: ReportDraft): string[] {
  const parts: string[] = [];
  if (d.axes.includes('prop') && d.opsUnknown) parts.push('kondisi operasi belum diketahui');
  else if (d.axes.includes('prop') && d.ops) {
    if (d.ops === 'berhenti') parts.push(d.opsHours ? `operasi berhenti ${d.opsHours} jam` : 'operasi berhenti (durasi belum diisi)');
    else parts.push(d.ops === 'sebagian' ? 'operasi terganggu sebagian' : 'operasi tidak terganggu');
  }
  if (d.axes.includes('prop') && d.lossUnknown) parts.push('kerugian belum diketahui');
  if (d.axes.includes('man')) KB.filter((x) => x[0] in d.casualties).forEach((x) => parts.push(x[3]));
  if (d.axes.includes('ling')) parts.push(d.envNote === UNKNOWN ? 'sebaran belum diketahui' : `sebaran ${(d.envNote || 'Setempat').toLowerCase()}`);
  if (d.axes.includes('data')) parts.push(d.dataNote === UNKNOWN ? 'besar data bocor belum diketahui' : `${(d.dataNote || 'Data terbatas').toLowerCase()} bocor`);
  return parts;
}

export type Step2Errors = Partial<Record<
  'category' | 'categoryOther' | 'jenisOther' | 'securityImpact' | 'axes' | 'ops' | 'opsHours' | 'casualties' | 'severityReason' | 'severity' | 'handledOther',
  string
>>;

/** Validasi langkah 2 (S01, I13ue). `differs` = level beda dari saran; `noLevel` = belum bisa disarankan dan belum dipilih. */
export function validateStep2(d: ReportDraft, differs: boolean, noLevel = false): Step2Errors {
  const e: Step2Errors = {};
  if (noLevel) e.severity = 'Pilih tingkat keparahan dulu sebelum lanjut.';
  if (!d.category) e.category = 'Pilih kategori kejadian.';
  else if (d.category === KAT_LAIN && !d.categoryOther.trim()) e.categoryOther = 'Sebutkan kategori kejadian.';
  if (d.jenis === JENIS_LAIN && !d.jenisOther.trim()) e.jenisOther = 'Sebutkan jenis.';
  if (!d.securityImpact.trim()) e.securityImpact = 'Isi dampak keamanan.';
  if (d.axes.length === 0) e.axes = 'Pilih minimal satu yang terdampak.';
  if (d.axes.includes('prop')) {
    if (d.opsUnknown) {
      // Belum diketahui: durasi tidak diminta (B-11)
    } else if (!d.ops) e.ops = 'Pilih kondisi operasi.';
    else if (d.ops !== 'tidak' && d.opsHours === null) {
      e.opsHours = d.ops === 'berhenti' ? 'Isi berapa jam operasi berhenti.' : 'Isi berapa jam operasi terganggu.';
    }
  }
  if (d.axes.includes('man') && Object.keys(d.casualties).length === 0) e.casualties = 'Pilih kondisi korban.';
  if (differs && !d.severityReason.trim()) e.severityReason = 'Jelaskan kenapa berbeda dari saran.';
  if (d.handledOther !== null && !d.handledOther.trim()) e.handledOther = 'Sebutkan siapa yang menangani.';
  return e;
}

/** Gaya input polos di dalam .p-input. */
export const bareInput = {
  flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0, width: '100%',
} as const;
