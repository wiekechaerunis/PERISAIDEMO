// Kolom "Tanya data" di Temuan AI (S6): ketikan → intent + filter dashboard. Tanpa LLM, tanpa API.
// Kamus dibangun dari data demo (W, A0, CAT, LV, MO, SEN). Kata yang ditulis manual ada di MANUAL_* di bawah
// dan dicatat di docs/dashboard/DEVIATIONS.md.
import { A0, CAT, LV, MO, SEN, W } from '@/data/dashboard';

export type Intent = 'saring' | 'peringkat' | 'banding' | 'lokasi' | 'tindakan';
export type Role = 'skk' | 'kkks';

/** Satu bagian yang dipahami; ditampilkan sebagai chip "Dipahami sebagai". */
export interface Chip {
  kind: 'wilayah' | 'kkks' | 'kategori' | 'level' | 'bulan' | 'lokasi' | 'ukuran' | 'kelompok' | 'tindakan';
  key: string;
  label: string;
}

export interface Filters {
  /** kode wilayah SKK (W) */
  w?: string;
  /** nama KKKS lengkap */
  kk?: string;
  /** indeks CAT */
  cat?: number;
  /** indeks level LV yang dipilih */
  lv?: number[];
  /** indeks bulan MO (0 = Jan), bisa lebih dari satu untuk banding */
  months?: number[];
  /** id area A0 */
  area?: string;
}

export interface Parsed {
  intent: Intent;
  filters: Filters;
  chips: Chip[];
  unknownTokens: string[];
  /** peringkat: kelompok yang diurutkan */
  group?: 'kkks' | 'wilayah' | 'kategori' | 'lokasi';
  /** peringkat: ukuran yang diurutkan */
  measure?: 'jumlah' | 'kerugian';
  /** tindakan: jenis */
  action?: 'lewat-tenggat' | 'belum-melapor';
  /** KKKS menyebut organisasi atau wilayah lain */
  outOfScope?: boolean;
  /** semua token tidak dikenali / intent tidak jelas */
  unknown: boolean;
}

type AreaRow = [string, string, string, number, number, number[], number, string, string];
const AREAS = A0 as unknown as AreaRow[];
const WN = W as unknown as Record<string, { n: string }>;
const CATS = CAT as unknown as [string, Record<string, number>, Record<string, number>][];
const LVS = LV as unknown as [string, string, string, string][];
const MOS = MO as unknown as string[];

export const norm = (t: string) =>
  ` ${t
    .toLowerCase()
    .replace(/[“”"'`]/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;

// ---- kata manual (tidak berasal dari data) ----
/** Alias wilayah SKK. */
export const MANUAL_WILAYAH: Record<string, string> = {
  'sumatera bagian utara': 'sbu', 'sumatra bagian utara': 'sbu', 'sumut': 'sbu',
  'sumatera bagian selatan': 'sbs', 'sumatra bagian selatan': 'sbs', 'sumsel': 'sbs',
  'jawa bali nusa tenggara': 'jbn', 'jawa bali nusra': 'jbn',
  'kalimantan sulawesi': 'kls', 'papua maluku': 'pml', 'maluku papua': 'pml', 'jakarta': 'pst',
};
/** Sinonim kategori → nama CAT. */
export const MANUAL_KATEGORI: Record<string, string> = {
  'pencurian': 'Pencurian/Perampokan', 'perampokan': 'Pencurian/Perampokan', 'maling': 'Pencurian/Perampokan',
  'pengeboran ilegal': 'Illegal drilling', 'pengeboran liar': 'Illegal drilling', 'sumur ilegal': 'Illegal drilling',
  'sambungan ilegal': 'Illegal tapping', 'tapping': 'Illegal tapping',
  'penghentian': 'Penghentian kegiatan/operasi', 'penghadangan': 'Penghentian kegiatan/operasi',
  'demo': 'Unjuk rasa', 'demonstrasi': 'Unjuk rasa', 'unras': 'Unjuk rasa',
  'kebakaran': 'Kebakaran', 'perusakan': 'Perusakan material', 'vandalisme': 'Perusakan material',
};
/** Nama bulan lengkap (MO hanya singkatan). */
export const MANUAL_BULAN: Record<string, number> = { januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5 };
/** Kata intent dan kata pengisi. */
export const MANUAL_INTENT = {
  peringkat: ['terbanyak', 'terbesar', 'tertinggi', 'top', 'paling', 'teratas', 'ranking', 'peringkat'],
  banding: ['vs', 'versus', 'dibanding', 'dibandingkan', 'banding', 'bandingkan', 'tren', 'naik', 'turun'],
  tindakanLate: ['lewat tenggat', 'terlambat', 'telat', 'melewati tenggat', 'perlu tindakan'],
  tindakanRep: ['belum melapor', 'belum lapor', 'tidak melapor'],
  kerugian: ['kerugian', 'rugi', 'nilai kerugian'],
  kelompok: { kkks: ['kkks', 'perusahaan', 'operator', 'kontraktor'], wilayah: ['wilayah', 'region', 'perwakilan'], kategori: ['jenis', 'kategori', 'tipe'], lokasi: ['lokasi', 'area', 'kabupaten', 'wk', 'wilayah kerja'] },
};
export const STOPWORDS = new Set(
  'insiden kejadian di pada bulan yang dengan dan atau apa berapa ada ke untuk dari semua data jumlah tampilkan lihat cari kasus 2026 semester level ini itu saja mana siapa banyak besar tahun periode tolong mohon berapa yg dg dgn sejak selama dalam laporan'.split(' '),
);

// ---- kamus dari data ----
const kkShort = (kk: string) => kk.replace(/^PT /, '');
type Entry = { phrase: string; chip: Chip; apply: (f: Filters) => void };
const ENTRIES: Entry[] = [];
const push = (phrase: string, chip: Chip, apply: (f: Filters) => void) => {
  const p = norm(phrase).trim();
  if (p) ENTRIES.push({ phrase: p, chip, apply });
};
Object.entries(WN).forEach(([k, w]) => push(w.n, { kind: 'wilayah', key: k, label: w.n }, (f) => { f.w = k; }));
Object.entries(MANUAL_WILAYAH).forEach(([p, k]) => push(p, { kind: 'wilayah', key: k, label: WN[k].n }, (f) => { f.w = k; }));
[...new Set(AREAS.map((a) => a[7]))].forEach((kk) => {
  push(kk, { kind: 'kkks', key: kk, label: kkShort(kk) }, (f) => { f.kk = kk; });
  push(kkShort(kk), { kind: 'kkks', key: kk, label: kkShort(kk) }, (f) => { f.kk = kk; });
});
AREAS.forEach((a) => {
  push(a[2], { kind: 'lokasi', key: a[0], label: a[2] }, (f) => { f.area = a[0]; });
  push(a[8], { kind: 'lokasi', key: a[0], label: a[8] }, (f) => { f.area = a[0]; });
});
CATS.forEach((c, i) => push(c[0], { kind: 'kategori', key: String(i), label: c[0] }, (f) => { f.cat = i; }));
Object.entries(MANUAL_KATEGORI).forEach(([p, name]) => {
  const i = CATS.findIndex((c) => c[0] === name);
  if (i >= 0) push(p, { kind: 'kategori', key: String(i), label: name }, (f) => { f.cat = i; });
});
LVS.forEach((l, i) => push(l[0], { kind: 'level', key: String(i), label: l[0] }, (f) => { f.lv = [...new Set([...(f.lv ?? []), i])].sort(); }));
MOS.forEach((m, i) => push(m, { kind: 'bulan', key: String(i), label: `${m} 2026` }, (f) => { f.months = [...(f.months ?? []), i]; }));
Object.entries(MANUAL_BULAN).forEach(([p, i]) => push(p, { kind: 'bulan', key: String(i), label: `${MOS[i]} 2026` }, (f) => { f.months = [...(f.months ?? []), i]; }));
// frasa panjang dicocokkan lebih dulu ("sangat rendah" sebelum "rendah", "musi banyuasin" sebelum nama lain)
ENTRIES.sort((a, b) => b.phrase.length - a.phrase.length);

const has = (t: string, words: string[]) => words.some((w) => t.includes(` ${w} `));

/** Ketikan → intent, filter, chip, token tak dikenal. Fungsi murni. */
export function parseQuery(text: string, role: Role): Parsed {
  let t = norm(text);
  const filters: Filters = {};
  const chips: Chip[] = [];
  const I = MANUAL_INTENT;

  // tindakan
  let action: Parsed['action'];
  for (const p of I.tindakanLate) if (t.includes(` ${p} `)) { action = 'lewat-tenggat'; t = t.replace(` ${p} `, ' '); }
  for (const p of I.tindakanRep) if (t.includes(` ${p} `)) { action = 'belum-melapor'; t = t.replace(` ${p} `, ' '); }
  if (action) chips.push({ kind: 'tindakan', key: action, label: action === 'lewat-tenggat' ? 'Lewat tenggat' : 'Belum melapor' });

  // entri data (frasa terpanjang dulu); kata utuh saja. Teks yang cocok diganti spasi sepanjang aslinya
  // supaya posisi tetap, lalu chip diurutkan sesuai urutan kata dalam ketikan.
  const found: { chip: Chip; at: number }[] = [];
  for (const e of ENTRIES) {
    const p = ` ${e.phrase} `;
    let at = t.indexOf(p);
    while (at >= 0) {
      e.apply(filters);
      if (!found.some((x) => x.chip.kind === e.chip.kind && x.chip.key === e.chip.key)) found.push({ chip: e.chip, at });
      t = t.slice(0, at) + ' '.repeat(p.length) + t.slice(at + p.length);
      at = t.indexOf(p);
    }
  }
  found.sort((a, b) => a.at - b.at).forEach((x) => chips.push(x.chip));
  t = ` ${t.replace(/\s+/g, ' ').trim()} `;

  // kelompok dan ukuran (peringkat)
  let group: Parsed['group'];
  let measure: Parsed['measure'];
  const isRank = has(t, I.peringkat);
  if (has(t, I.kerugian)) measure = 'kerugian';
  for (const [g, words] of Object.entries(I.kelompok) as [NonNullable<Parsed['group']>, string[]][]) {
    if (!group && has(t, words)) group = g;
  }
  const isCmp = has(t, I.banding) || (filters.months?.length ?? 0) >= 2;

  // sisa token
  const drop = new Set([...I.peringkat, ...I.banding, ...I.kerugian, ...Object.values(I.kelompok).flat().flatMap((w) => w.split(' '))]);
  const unknownTokens = t.trim().split(' ').filter((w) => w && !STOPWORDS.has(w) && !drop.has(w) && !/^\d+$/.test(w));

  // intent
  let intent: Intent = 'saring';
  if (action) intent = 'tindakan';
  else if (isRank && (group || measure)) intent = 'peringkat';
  else if (isCmp) intent = 'banding';
  else if (filters.area && !filters.cat && !filters.lv && !filters.months && !filters.kk && !filters.w) intent = 'lokasi';
  if (intent === 'peringkat') {
    group = group ?? 'kategori';
    measure = measure ?? 'jumlah';
    chips.push({ kind: 'kelompok', key: group, label: { kkks: 'Per KKKS', wilayah: 'Per wilayah', kategori: 'Per jenis', lokasi: 'Per lokasi' }[group] });
    chips.push({ kind: 'ukuran', key: measure, label: measure === 'kerugian' ? 'Kerugian terbesar' : 'Insiden terbanyak' });
  }

  // peran KKKS: hanya data organisasinya sendiri
  let outOfScope = false;
  if (role === 'kkks') {
    const ownW = new Set(AREAS.filter((a) => a[7] === SEN).map((a) => a[1]));
    const ownA = new Set(AREAS.filter((a) => a[7] === SEN).map((a) => a[0]));
    if (filters.kk && filters.kk !== SEN) outOfScope = true;
    if (filters.w && !ownW.has(filters.w)) outOfScope = true;
    if (filters.area && !ownA.has(filters.area)) outOfScope = true;
    if (intent === 'peringkat' && group === 'kkks') outOfScope = true;
    if (action === 'belum-melapor') outOfScope = true;
  }

  // Tidak menebak: tanpa satu pun bagian yang dipahami (atau peringkat tanpa kelompok/ukuran) = tidak dikenali.
  const unknown = chips.length === 0 || (isRank && intent !== 'peringkat' && chips.length === 0);
  return { intent, filters, chips, unknownTokens, group, measure, action, outOfScope, unknown };
}

/** Hapus satu chip dari teks hasil parsing: dipakai tombol × pada chip "Dipahami sebagai". */
export function withoutChip(p: Parsed, chip: Chip): Filters {
  const f: Filters = { ...p.filters };
  if (chip.kind === 'wilayah') delete f.w;
  if (chip.kind === 'kkks') delete f.kk;
  if (chip.kind === 'kategori') delete f.cat;
  if (chip.kind === 'lokasi') delete f.area;
  if (chip.kind === 'level') f.lv = (f.lv ?? []).filter((i) => String(i) !== chip.key);
  if (chip.kind === 'bulan') f.months = (f.months ?? []).filter((i) => String(i) !== chip.key);
  if (f.lv && !f.lv.length) delete f.lv;
  if (f.months && !f.months.length) delete f.months;
  return f;
}
