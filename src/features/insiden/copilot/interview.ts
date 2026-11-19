// Mesin wawancara AI Copilot (murni, tanpa React): menentukan isian wajib yang belum terisi, pertanyaan berikutnya
// (satu per pesan, dengan chip bila pilihannya tertutup), progres "Terisi X dari Y", dan dua pengecekan khusus (K3, WK).
// Pertanyaan selalu dihitung dari draf saat ini, jadi isian yang diubah langsung di form ikut menggugurkan pertanyaannya.
// Urutan: jenis laporan → kategori (+jenis) → waktu → lokasi → yang terdampak → kondisi per sumbu → kronologi → tindakan awal.
import type { Extraction } from '@/services/ai/types';
import { demoNow } from '@/services/mock/clock';
import type { Axis, ReportDraft } from '../logic/draft';
import { KB, AXES, OPS, SEBARAN, DATA_OPTS, KAT, jenisOf } from '../components/step2Data';
import { KNOWN_SITES, locate } from '../logic/geo';
import { formatRupiah, formatWibFull } from '@/lib/format';

export type SlotKey =
  | 'kind' | 'category' | 'jenis' | 'time' | 'location' | 'axes'
  | 'ops' | 'rug' | 'casualty' | 'env' | 'data' | 'chronology' | 'action';

export const SLOT_LABEL: Record<SlotKey, string> = {
  kind: 'Jenis laporan', category: 'Kategori', jenis: 'Jenis', time: 'Waktu kejadian', location: 'Lokasi', axes: 'Yang terdampak',
  ops: 'Kondisi operasi', rug: 'Perkiraan kerugian', casualty: 'Kondisi korban', env: 'Sebaran lingkungan', data: 'Data dan informasi',
  chronology: 'Kronologi', action: 'Tindakan awal',
};

/** Penanda yang dibawa percakapan: pengecekan yang sudah dijawab. */
export interface Flags {
  k3?: boolean;
  wk?: boolean;
  axesDone?: boolean;
}

export interface Ctx {
  draft: ReportDraft;
  ex: Extraction | null;
  /** isian yang ditolak/dilewati pengguna */
  skipped: SlotKey[];
  flags: Flags;
  /** gabungan cerita yang dikirim pengguna */
  story: string;
}

export interface Chip {
  id: string;
  label: string;
  /** chip pilih-banyak (yang terdampak) */
  pressed?: boolean;
}

export interface Question {
  /** 'k3' dan 'wk' adalah pengecekan, bukan isian */
  slot: SlotKey | 'k3' | 'wk';
  text: string;
  chips: Chip[];
  /** pertanyaan yang jawabannya boleh diketik bebas */
  typed: boolean;
}

const SKIP: Chip = { id: 'skip', label: 'Isi sendiri di form' };
const AXIS_SLOTS: Record<Axis, SlotKey[]> = { prop: ['ops', 'rug'], man: ['casualty'], ling: ['env'], data: ['data'] };

/** Isian wajib yang relevan untuk draf ini, berurutan. */
export function slotsFor(d: ReportDraft): SlotKey[] {
  const out: SlotKey[] = ['kind', 'category'];
  if (jenisOf(d.category).length) out.push('jenis');
  out.push('time', 'location');
  if (d.kind === 'insiden') {
    out.push('axes');
    AXES.forEach(([a]) => { if (d.axes.includes(a)) out.push(...AXIS_SLOTS[a]); });
  }
  out.push('chronology'); // Tindakan awal tidak ada di board I13 (D6)
  return out;
}

export function isFilled(slot: SlotKey, d: ReportDraft): boolean {
  switch (slot) {
    case 'kind': return d.hasImpact !== null;
    case 'category': return !!d.category;
    case 'jenis': return d.jenis !== null;
    case 'time': return !!d.date && !!d.time;
    case 'location': return d.lat !== null && d.lng !== null;
    case 'axes': return d.axes.length > 0;
    case 'ops': return d.ops !== null && (d.ops === 'tidak' || d.opsHours !== null || d.ongoing);
    case 'rug': return d.lossIdr !== null;
    case 'casualty': return Object.keys(d.casualties).length > 0;
    case 'env': return !!d.envNote;
    case 'data': return !!d.dataNote;
    case 'chronology': return d.story.trim().length > 0;
    case 'action': return d.initialAction.trim().length > 0;
  }
}

export interface Progress {
  filled: number;
  total: number;
  /** isian belum terisi dan belum ditolak */
  open: SlotKey[];
}

export function progress(d: ReportDraft, skipped: SlotKey[]): Progress {
  const slots = slotsFor(d);
  return {
    filled: slots.filter((s) => isFilled(s, d)).length,
    total: slots.length,
    open: slots.filter((s) => !isFilled(s, d) && !skipped.includes(s)),
  };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\b(blok|wk|wilayah|kerja)\b/g, ' ').replace(/\s+/g, ' ').trim();

/** Blok/WK di cerita tidak sama dengan WK dari titik peta (mis. "Blok Rokan" vs "WK Andalas Darat"). */
export function locationMismatch(mention: string | null, wk: string): boolean {
  if (!mention || !wk) return false;
  const m = norm(mention).split(' ').filter(Boolean);
  const w = norm(wk);
  return m.length > 0 && !m.some((t) => w.includes(t));
}

/** Kutipan "dari cerita" hanya boleh potongan teks asli; mengembalikan potongan itu (dengan huruf aslinya) atau null. */
export function literalQuote(src: string, story: string): string | null {
  const needle = src.replace(/\s+/g, ' ').trim();
  if (needle.length < 2) return null;
  const hay = story.replace(/\s+/g, ' ');
  const at = hay.toLowerCase().indexOf(needle.toLowerCase());
  return at < 0 ? null : hay.slice(at, at + needle.length);
}

/** Waktu "sekarang" Copilot = jam demo (B7); `d` hanya untuk uji. */
export const localIso = (d?: Date): string => {
  if (!d) return `${demoNow().slice(0, 16)}:00`;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
};

const CATEGORY_CHIPS = ['Pencurian/Perampokan', 'Perusakan material', 'Ancaman', 'Blokade area', 'Kebakaran', 'Kecelakaan kerja'];

/** Pertanyaan berikutnya, atau null bila semua isian wajib terisi atau ditolak. */
export function nextQuestion(c: Ctx): Question | null {
  const { draft: d, ex, skipped, flags } = c;
  const open = progress(d, skipped).open;

  // pengecekan K3: cerita kecelakaan kerja tanpa unsur keamanan, ditanyakan di tempat pertanyaan kategori
  if (ex?.k3 && !flags.k3 && (open.includes('category') || d.category === ex.category?.value)) {
    return {
      slot: 'k3', typed: false,
      text: 'Ini terdengar seperti kecelakaan kerja. Kategori K3 belum dipastikan masuk PERISAI. Tetap catat?',
      chips: [{ id: 'yes', label: 'Ya' }, { id: 'change', label: 'Ubah kategori' }],
    };
  }
  // pengecekan WK: nama blok/WK di cerita beda dengan WK dari titik peta
  if (!flags.wk && isFilled('location', d) && locationMismatch(ex?.locationMention ?? null, d.wk)) {
    return {
      slot: 'wk', typed: false,
      text: `Cerita menyebut ${ex!.locationMention}, titik di peta masuk ${d.wk}. Mana yang benar?`,
      chips: [{ id: 'map', label: 'Pakai titik peta' }, { id: 'story', label: 'Pilih ulang di peta' }],
    };
  }

  const slot = open[0];
  if (!slot) return null;
  // pilih-banyak "yang terdampak": tetap ditanya sampai pengguna menekan Lanjut (kecuali sudah dipilih lewat saran)
  if (!open.includes('axes') && d.kind === 'insiden' && isFilled('axes', d) && !flags.axesDone && !skipped.includes('axes')) {
    return axesQuestion(d);
  }
  switch (slot) {
    case 'kind':
      return {
        slot, typed: false,
        text: 'Apakah kejadian ini sudah menimbulkan dampak, seperti kerugian, korban, atau operasi terganggu?',
        chips: [{ id: 'insiden', label: 'Sudah ada dampak (Insiden)' }, { id: 'kerawanan', label: 'Belum ada dampak (Kerawanan)' }, SKIP],
      };
    case 'category':
      return {
        slot, typed: false,
        text: 'Kategori mana yang paling sesuai dengan kejadian ini?',
        chips: [...CATEGORY_CHIPS.filter((x) => !(flags.k3 && x === 'Kecelakaan kerja')).map((x) => ({ id: x, label: x })), SKIP],
      };
    case 'jenis':
      return {
        slot, typed: false,
        text: `Jenis ${d.category?.toLowerCase()} yang mana?`,
        chips: [...jenisOf(d.category).filter((j) => j !== 'Lainnya').map((j) => ({ id: j, label: j })), SKIP],
      };
    case 'time':
      return {
        slot, typed: true,
        text: 'Kapan kejadiannya? Tulis jamnya, misalnya "jam 09.00 pagi", atau pilih di bawah.',
        chips: [{ id: 'now', label: 'Baru saja' }, SKIP],
      };
    case 'location':
      return {
        slot, typed: false,
        text: ex?.locationName
          ? `Cerita menyebut ${ex.locationName}. Titik koordinatnya tidak saya tebak supaya wilayah kerjanya tepat. Pilih di peta.`
          : 'Di mana lokasi kejadiannya? Titik koordinatnya tidak saya tebak supaya wilayah kerjanya tepat. Pilih di peta.',
        chips: [{ id: 'map', label: 'Buka peta' }, { id: 'here', label: 'Pakai lokasi saya sekarang' }, SKIP],
      };
    case 'axes':
      return axesQuestion(d);
    case 'ops':
      if (d.ops && d.ops !== 'tidak') {
        return {
          slot, typed: true,
          text: `Berapa jam operasi ${d.ops === 'berhenti' ? 'berhenti' : 'terganggu'}? Tulis angkanya, misalnya "6 jam".`,
          chips: [{ id: 'ongoing', label: 'Masih berlangsung' }, SKIP],
        };
      }
      return { slot, typed: false, text: 'Bagaimana kondisi operasinya?', chips: [...OPS.map(([k, l]) => ({ id: k, label: l })), SKIP] };
    case 'rug':
      return {
        slot, typed: true,
        text: 'Berapa perkiraan kerugiannya? Tulis nominalnya, misalnya "18,5 juta".',
        chips: [{ id: 'skip', label: 'Belum diperkirakan' }],
      };
    case 'casualty':
      return {
        slot, typed: false,
        text: 'Bagaimana kondisi korbannya?',
        chips: [
          { id: 'p3k', label: 'Luka ringan, P3K' }, { id: 'klinik', label: 'Dibawa ke klinik atau RS' },
          { id: 'berat', label: 'Luka berat atau cacat' }, { id: 'meninggal', label: 'Meninggal' }, { id: 'belum', label: 'Belum diketahui' },
        ],
      };
    case 'env':
      return {
        slot, typed: false,
        text: 'Seberapa luas sebaran dampaknya ke lingkungan pengamanan?',
        chips: [...SEBARAN.map((x) => ({ id: x, label: x })), SKIP],
      };
    case 'data':
      return {
        slot, typed: false,
        text: 'Seberapa besar data atau informasi yang terdampak?',
        chips: [...DATA_OPTS.map((x) => ({ id: x, label: x })), SKIP],
      };
    case 'chronology':
      return {
        slot, typed: true,
        text: 'Ceritakan kronologi singkatnya: apa yang terjadi dari awal sampai sekarang?',
        chips: [{ id: 'story', label: 'Pakai cerita saya tadi' }, SKIP],
      };
    case 'action':
      return {
        slot, typed: true,
        text: 'Tindakan awal apa yang sudah dilakukan di lokasi?',
        chips: [{ id: 'none', label: 'Belum ada tindakan' }, SKIP],
      };
  }
}

function axesQuestion(d: ReportDraft): Question {
  return {
    slot: 'axes', typed: false,
    text: 'Apa saja yang terdampak? Pilih semua yang sesuai, lalu tekan Lanjut.',
    chips: [
      ...AXES.map(([k, l]) => ({ id: k, label: l, pressed: d.axes.includes(k) })),
      ...(d.axes.length ? [{ id: 'done', label: 'Lanjut' }] : [SKIP]),
    ],
  };
}

export interface Answer {
  patch: Partial<ReportDraft>;
  /** isian ditolak (tidak dipaksa terisi) */
  skip?: SlotKey;
  flag?: keyof Flags;
  openMap?: boolean;
  /** pesan AI sebelum pertanyaan berikutnya */
  reply?: string;
  /** chip pilih-banyak: jangan catat sebagai jawaban final di percakapan */
  toggle?: boolean;
}

const labelOf = (q: Question, id: string) => q.chips.find((c) => c.id === id)?.label ?? id;
export const answerLabel = labelOf;

/** Jawaban lewat chip. */
export function answerChip(q: Question, id: string, c: Ctx): Answer {
  const d = c.draft;
  if (id === 'skip' && q.slot !== 'k3' && q.slot !== 'wk') return { patch: {}, skip: q.slot };
  switch (q.slot) {
    case 'kind':
      return id === 'insiden' ? { patch: { kind: 'insiden', hasImpact: 'ya' } } : { patch: { kind: 'kerawanan', hasImpact: 'tidak' } };
    case 'k3':
      return id === 'yes'
        ? { patch: { category: c.ex?.category?.value ?? 'Kecelakaan kerja', jenis: null }, flag: 'k3', reply: 'Baik, saya catat. Pejabat Berwenang yang memastikan masuk cakupan PERISAI atau tidak.' }
        : { patch: {}, flag: 'k3', reply: 'Baik, kita pilih kategori lain.' };
    case 'category':
      return KAT.some((k) => k[1] === id) ? { patch: { category: id, jenis: null } } : { patch: {} };
    case 'jenis':
      return { patch: { jenis: id } };
    case 'time': {
      const now = localIso();
      return { patch: { date: now.slice(0, 10), time: now.slice(11, 16) } };
    }
    case 'location':
      if (id === 'map') return { patch: {}, openMap: true };
      {
        // ASSUMPTION: "lokasi saya sekarang" memakai titik demo sumur ADR-07 (tanpa geolokasi sungguhan).
        const site = KNOWN_SITES[0];
        const loc = locate(site.lat, site.lng);
        return {
          patch: { locationName: site.name, lat: site.lat, lng: site.lng, wk: loc.wk, patokan: d.patokan || site.name },
          reply: `Lokasi Anda sekarang 120 m dari ${site.name}. Saya pakai titik tersebut; geser di peta bila kurang tepat.`,
        };
      }
    case 'wk':
      return id === 'map'
        ? { patch: {}, flag: 'wk', reply: `Baik, saya pakai ${d.wk} dari titik di peta.` }
        : { patch: {}, openMap: true, reply: `Baik. Geser titik di peta ke ${c.ex?.locationMention ?? 'lokasi yang benar'}.` };
    case 'axes': {
      if (id === 'done') return { patch: {}, flag: 'axesDone' };
      const a = id as Axis;
      return { patch: { axes: d.axes.includes(a) ? d.axes.filter((x) => x !== a) : [...d.axes, a] }, toggle: true };
    }
    case 'ops':
      if (id === 'ongoing') return { patch: { ongoing: true } };
      return { patch: { ops: id as ReportDraft['ops'], opsHours: null, ongoing: false } };
    case 'casualty':
      return {
        patch: { casualties: id === 'belum' ? { belum: 0 } : { [id]: 1 } },
        reply: id === 'belum' ? undefined : 'Saya catat 1 orang. Ubah jumlahnya di form bila perlu.',
      };
    case 'env':
      return { patch: { envNote: id } };
    case 'data':
      return { patch: { dataNote: id } };
    case 'chronology':
      return { patch: { story: c.story.trim() } };
    case 'action':
      return { patch: { initialAction: 'Belum ada tindakan awal.' } };
    default:
      return { patch: {} };
  }
}

export interface SummaryRow {
  slot: SlotKey;
  label: string;
  value: string;
  skipped: boolean;
}

/** Ringkasan isian untuk pesan penutup ("Periksa form"). */
export function summaryOf(d: ReportDraft, skipped: SlotKey[]): SummaryRow[] {
  const cut = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);
  const val = (slot: SlotKey): string => {
    switch (slot) {
      case 'kind': return d.kind === 'insiden' ? 'Insiden' : 'Kerawanan';
      case 'category': return d.category ?? '';
      case 'jenis': return d.jenis ?? '';
      case 'time': return formatWibFull(`${d.date}T${d.time}:00`);
      case 'location': return [d.locationName, d.wk].filter(Boolean).join(' · ');
      case 'axes': return AXES.filter(([k]) => d.axes.includes(k)).map(([, l]) => l).join(', ');
      case 'ops': {
        const l = OPS.find(([k]) => k === d.ops)?.[1] ?? '';
        return d.ops && d.ops !== 'tidak' ? `${l}${d.opsHours ? ` · ${d.opsHours} jam` : d.ongoing ? ' · masih berlangsung' : ''}` : l;
      }
      case 'rug': return d.lossIdr === null ? '' : formatRupiah(d.lossIdr);
      case 'casualty': return KB.filter(([k]) => k in d.casualties).map(([k, l]) => (d.casualties[k] ? `${l} · ${d.casualties[k]} orang` : l)).join(', ');
      case 'env': return d.envNote;
      case 'data': return d.dataNote;
      case 'chronology': return cut(d.story.trim());
      case 'action': return cut(d.initialAction.trim());
    }
  };
  return slotsFor(d).map((slot) => {
    const filled = isFilled(slot, d);
    return { slot, label: SLOT_LABEL[slot], value: filled ? val(slot) : 'Dilewati', skipped: !filled && skipped.includes(slot) };
  });
}

const NUM_ID =/(\d{1,3}(?:\.\d{3})+|\d+(?:[.,]\d+)?)\s*(miliar|juta|jt|ribu|rb)?/i;

/** Jawaban yang diketik untuk pertanyaan bertanda `typed`. null = belum dipahami (pertanyaan tetap terbuka). */
export function answerText(q: Question, text: string, c: Ctx, parseTime: (t: string) => { date: string; time: string } | null): Answer | null {
  const t = text.trim();
  if (!t) return null;
  switch (q.slot) {
    case 'time': {
      const v = parseTime(t);
      return v ? { patch: { date: v.date, time: v.time } } : null;
    }
    case 'ops': {
      if (!c.draft.ops || c.draft.ops === 'tidak') return null;
      const m = t.match(/(\d+(?:[.,]\d+)?)\s*jam/i) ?? t.match(/^(\d+(?:[.,]\d+)?)$/);
      return m ? { patch: { opsHours: Math.round(parseFloat(m[1].replace(',', '.'))), ongoing: false } } : null;
    }
    case 'rug': {
      const m = t.match(NUM_ID);
      if (!m) return null;
      const unit = (m[2] ?? '').toLowerCase();
      const v = parseFloat(m[1].replace(/\./g, '').replace(',', '.')) * (unit === 'miliar' ? 1e9 : unit === 'juta' || unit === 'jt' ? 1e6 : unit ? 1e3 : 1);
      return { patch: { lossIdr: Math.round(v) } };
    }
    case 'chronology':
      return { patch: { story: t } };
    case 'action':
      return { patch: { initialAction: t } };
    default:
      return null;
  }
}
