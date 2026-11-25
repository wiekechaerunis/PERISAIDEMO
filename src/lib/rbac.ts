export type Role = 'pelapor' | 'pejabat' | 'pic' | 'pic-tl' | 'pengawas' | 'pimpinan' | 'admin' | 'admin-kkks';

export interface DemoUser {
  role: Role;
  name: string;
  roleLabel: string;
  org: 'kkks' | 'skk';
  /** cakupan wilayah kerja (HAK-02); kosong = semua WK organisasi */
  scope?: string[];
}

export const DEMO_USERS: Record<Role, DemoUser> = {
  pelapor: { role: 'pelapor', name: 'Budi Santoso', roleLabel: 'Pelapor KKKS', org: 'kkks', scope: ['WK Andalas Darat'] },
  pejabat: { role: 'pejabat', name: 'Sari Wulandari', roleLabel: 'Pejabat Berwenang KKKS', org: 'kkks' },
  pic: { role: 'pic', name: 'Andi Pratama', roleLabel: 'Koordinator Security', org: 'kkks' },
  'pic-tl': { role: 'pic-tl', name: 'Rudi Hartono', roleLabel: 'Teknisi pengamanan', org: 'kkks', scope: ['WK Andalas Darat'] },
  pengawas: { role: 'pengawas', name: 'Hendra Wijaya', roleLabel: 'Pengawas SKK', org: 'skk' },
  // ASSUMPTION: Pimpinan SKK tidak punya nama/board khusus; memakai tampilan Pengawas SKK.
  pimpinan: { role: 'pimpinan', name: 'Pimpinan SKK', roleLabel: 'Pimpinan SKK', org: 'skk' },
  admin: { role: 'admin', name: 'Rina Hapsari', roleLabel: 'Admin SKK', org: 'skk' },
  'admin-kkks': { role: 'admin-kkks', name: 'Dewi Lestari', roleLabel: 'Admin KKKS', org: 'kkks', scope: ['WK Andalas Darat'] },
};

export const isSkk = (r: Role) => DEMO_USERS[r].org === 'skk';
/**
 * Maker titik Lapor insiden (ADJ-18; nilai awal WFL-01 v3 = Pelapor KKKS), dinilai dari role aktif. Pejabat Berwenang dan Admin KKKS
 * hanya melihat draf, tanpa Buat laporan. ASSUMPTION: persona PIC (Andi Pratama) memegang role aktif Pelapor, jadi tetap maker.
 */
export const isMaker = (r: Role) => r === 'pelapor' || r === 'pic';
export const canCreateReport = isMaker;
export const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Pejabat Berwenang KKKS organisasi demo (pemeriksa laporan dan permintaan penutupan). */
export const PEJABAT_NAMES = ['Sari Wulandari', 'Hendra Saputra', 'Dewi Anggraini'];

/** Jabatan Pejabat Berwenang di daftar "Diperiksa oleh" (board I14m). */
const REVIEWER_TITLES: Record<string, string> = {
  'Sari Wulandari': 'Manager HSSE', 'Hendra Saputra': 'Senior Manager Security', 'Dewi Anggraini': 'VP HSSE',
};
export const reviewerTitle = (name: string): string => REVIEWER_TITLES[name] ?? '';

/**
 * Pilihan "Diperiksa oleh". ADJ-01: pengaju yang juga Pejabat Berwenang tetap muncul (ditandai "(Anda)" dan diberi peringatan, tidak
 * diblokir). Parameter dipertahankan agar pemanggil lama tetap jalan.
 */
export const reviewerOptions = (_submitter?: string): string[] => [...PEJABAT_NAMES];

/** Tujuan pengajuan ke "Diperiksa oleh": semua terpilih (null) → jumlah Pejabat; subset → nama. */
export const reviewerTarget = (rev: string[] | null | undefined, options: string[] = PEJABAT_NAMES): string =>
  !rev || rev.length >= options.length ? `${options.length} Pejabat Berwenang` : rev.join(', ');
/** Kalimat banner "Menunggu ditutup oleh …". */
export const reviewerBy = (rev: string[] | null | undefined, options: string[] = PEJABAT_NAMES): string =>
  rev === undefined ? options[0] :
  !rev || rev.length >= options.length ? `Pejabat Berwenang (${options.length})` : rev.join(', ');

/** Jabatan persona demo di layar Tindak lanjut (T14N); kosong bila tidak dikenal. */
export const titleOf = (name: string): string =>
  ({ 'Andi Pratama': 'Koordinator Security', 'Rudi Hartono': 'Teknisi pengamanan', 'Dedi Kurniawan': 'Staf Security', 'Sari Wulandari': 'Pejabat Berwenang KKKS', 'Hendra Wijaya': 'Pengawas SKK' } as Record<string, string>)[name] ?? '';

/** Pemantauan WhatsApp: SKK tidak punya akses (keputusan PM K1). */
export const canUseWaMonitor = (r: Role) => !isSkk(r);
/** Kelola nomor, grup, dan aturan: hanya Admin KKKS (R-04). */
export const canManageWa = (r: Role) => r === 'admin-kkks';
/** Memproses pesan (Jadikan draf, Tautkan, Tandai rutin/tidak relevan, Buka kembali): Admin KKKS dan Pelapor. */
export const canProcessWa = (r: Role) => r === 'admin-kkks' || r === 'pelapor';
