export type Role = 'pelapor' | 'pejabat' | 'pic' | 'pic-tl' | 'pengawas' | 'pimpinan' | 'admin';

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
};

export const isSkk = (r: Role) => DEMO_USERS[r].org === 'skk';
export const canCreateReport = (r: Role) => r === 'pelapor' || r === 'pejabat' || r === 'pic';
export const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Pejabat Berwenang KKKS organisasi demo (pemeriksa laporan dan permintaan penutupan). */
export const PEJABAT_NAMES = ['Sari Wulandari', 'Hendra Saputra', 'Dewi Anggraini'];

/** Pilihan "Diperiksa oleh": pengaju tidak muncul di daftar, kecuali dia satu-satunya Pejabat. */
export const reviewerOptions = (submitter: string): string[] => {
  const others = PEJABAT_NAMES.filter((n) => n !== submitter);
  return others.length ? others : PEJABAT_NAMES;
};

/** Tujuan pengajuan ke "Diperiksa oleh": semua terpilih (null) → jumlah Pejabat; subset → nama. */
export const reviewerTarget = (rev: string[] | null | undefined, options: string[] = PEJABAT_NAMES): string =>
  !rev || rev.length >= options.length ? `${options.length} Pejabat Berwenang` : rev.join(', ');
/** Kalimat banner "Menunggu ditutup oleh …". */
export const reviewerBy = (rev: string[] | null | undefined, options: string[] = PEJABAT_NAMES): string =>
  rev === undefined ? options[0] :
  !rev || rev.length >= options.length ? `Pejabat Berwenang (${options.length})` : rev.join(', ');
