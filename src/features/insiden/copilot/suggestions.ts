import type { Extraction } from '@/services/ai/types';
import type { ReportDraft } from '../logic/draft';
import { formatRupiah, formatWibFull } from '@/lib/format';

export type CopilotStep = 1 | 2;
export type SuggestionKey = 'jns' | 'wkt' | 'jdl' | 'ptk' | 'kat' | 'dmp' | 'ops' | 'krb' | 'rug' | 'mtr' | 'trd' | 'krn' | 'tdk';

export interface Suggestion {
  key: SuggestionKey;
  /** label kapital pada kartu, mis. "JENIS LAPORAN" */
  label: string;
  value: string;
  src: string;
  confidence: 'hi' | 'md';
}

const HANDLED_LABEL = { belum: 'Belum ada', int: 'Security internal', bujp: 'BUJP', tni: 'TNI', polri: 'Polri' } as const;
const CAS_LABEL = { p3k: 'Luka ringan (P3K)', klinik: 'Klinik atau rumah sakit', berat: 'Luka berat atau cacat', meninggal: 'Meninggal', belum: 'Belum diketahui' } as const;

/** Kartu saran per langkah, hanya untuk field yang ditemukan di cerita (urutan mengikuti board). */
export function buildSuggestions(step: CopilotStep, x: Extraction): Suggestion[] {
  const out: Suggestion[] = [];
  const add = (key: SuggestionKey, label: string, f: { value: string; src: string; confidence: 'hi' | 'md' } | null) => {
    if (f) out.push({ key, label, value: f.value, src: f.src, confidence: f.confidence });
  };
  const fmt = <T,>(f: { value: T; src: string; confidence: 'hi' | 'md' } | null, g: (v: T) => string) =>
    f ? { value: g(f.value), src: f.src, confidence: f.confidence } : null;
  if (step === 1) {
    add('jns', 'JENIS LAPORAN', fmt(x.kind, (v) => (v === 'insiden' ? 'Insiden' : 'Kerawanan')));
    add('wkt', 'WAKTU KEJADIAN', fmt(x.time, (v) => formatWibFull(`${v.date}T${v.time}:00`)));
    add('jdl', 'JUDUL', x.title);
    add('ptk', 'PATOKAN LOKASI', x.patokan);
  } else {
    add('kat', 'KATEGORI · JENIS', x.category);
    add('dmp', 'DAMPAK KEAMANAN', x.securityImpact);
    add('ops', 'KONDISI OPERASI', fmt(x.ops, (v) => (v.state === 'berhenti' ? 'Berhenti' : v.state === 'sebagian' ? 'Terganggu sebagian' : 'Tidak terganggu') + (v.hours ? ` · sekitar ${v.hours} jam` : '')));
    add('krb', 'KORBAN', fmt(x.casualty, (v) => (v.kind === 'none' ? 'Tidak ada' : `${CAS_LABEL[v.kind]} · ${v.count} orang`)));
    add('rug', 'PERKIRAAN KERUGIAN', fmt(x.lossIdr, formatRupiah));
    add('mtr', 'SUDAH MENANGANI', fmt(x.handledBy, (v) => HANDLED_LABEL[v]));
  }
  return out;
}

const AXIS_LABEL = { prop: 'Properti atau operasi', man: 'Manusia', ling: 'Lingkungan pengamanan', data: 'Data dan informasi' } as const;

/**
 * Semua kartu saran dari satu pembacaan cerita (satu percakapan menyeluruh, tidak per langkah).
 * Kategori K3 tidak jadi kartu: Copilot menanyakannya dulu (lihat interview.ts).
 */
export function buildAllSuggestions(x: Extraction): Suggestion[] {
  const base = [...buildSuggestions(1, x), ...buildSuggestions(2, x)];
  const out: Suggestion[] = base.filter((s) => !(x.k3 && s.key === 'kat'));
  const put = (at: SuggestionKey | null, s: Suggestion | null) => {
    if (!s) return;
    const i = at ? out.findIndex((o) => o.key === at) : -1;
    if (i < 0) out.push(s);
    else out.splice(i + 1, 0, s);
  };
  const one = (key: SuggestionKey, label: string, f: { value: string; src: string; confidence: 'hi' | 'md' } | null): Suggestion | null =>
    f ? { key, label, value: f.value, src: f.src, confidence: f.confidence } : null;
  put('ptk', one('trd', 'YANG TERDAMPAK', x.axes && { value: x.axes.value.map((a) => AXIS_LABEL[a]).join(', '), src: x.axes.src, confidence: x.axes.confidence }));
  put(null, one('krn', 'KRONOLOGI SINGKAT', x.chronology));
  return out;
}

/** Field draf yang terisi ketika saran di-Pakai, plus nama field untuk tag "AI". */
export function applySuggestion(key: SuggestionKey, x: Extraction, d: ReportDraft): { patch: Partial<ReportDraft>; ai: string } {
  // Bila cerita sudah memberi daftar yang terdampak (kartu "Yang terdampak"), sumbu tidak ditambah diam-diam oleh kartu lain.
  const withAxis = (a: 'prop' | 'man') => (x.axes || d.axes.includes(a) ? d.axes : [...d.axes, a]);
  switch (key) {
    case 'jns': {
      const k = x.kind!.value;
      return { patch: { kind: k, hasImpact: k === 'insiden' ? 'ya' : 'tidak' }, ai: 'kind' };
    }
    case 'wkt': return { patch: { date: x.time!.value.date, time: x.time!.value.time }, ai: 'time' };
    case 'jdl': return { patch: { title: x.title!.value }, ai: 'title' };
    case 'ptk': return { patch: { patokan: x.patokan!.value }, ai: 'patokan' };
    case 'kat': return { patch: { category: x.category!.value }, ai: 'category' };
    case 'dmp': return { patch: { securityImpact: x.securityImpact!.value, axes: withAxis('prop') }, ai: 'securityImpact' };
    case 'ops': {
      const v = x.ops!.value;
      return { patch: { ops: v.state, opsHours: v.hours, axes: withAxis('prop') }, ai: 'ops' };
    }
    case 'krb': {
      const v = x.casualty!.value;
      return v.kind === 'none'
        ? { patch: { casualties: {} }, ai: 'casualties' }
        : { patch: { casualties: { [v.kind]: v.count }, axes: withAxis('man') }, ai: 'casualties' };
    }
    case 'rug': return { patch: { lossIdr: x.lossIdr!.value, axes: withAxis('prop') }, ai: 'lossIdr' };
    case 'mtr': return { patch: { handledBy: [x.handledBy!.value] }, ai: 'handledBy' };
    case 'trd': return { patch: { axes: x.axes!.value }, ai: 'axes' };
    case 'krn': return { patch: { story: x.chronology!.value }, ai: 'story' };
    case 'tdk': return { patch: { initialAction: x.initialAction!.value }, ai: 'initialAction' };
  }
}

/** Batalkan saran: kosongkan isian yang tadi diisi. */
export function revertSuggestion(key: SuggestionKey): Partial<ReportDraft> {
  switch (key) {
    case 'jns': return { hasImpact: null };
    case 'wkt': return { date: '', time: '' };
    case 'jdl': return { title: '' };
    case 'ptk': return { patokan: '' };
    case 'kat': return { category: null };
    case 'dmp': return { securityImpact: '' };
    case 'ops': return { ops: null, opsHours: null };
    case 'krb': return { casualties: {} };
    case 'rug': return { lossIdr: null };
    case 'mtr': return { handledBy: [] };
    case 'trd': return { axes: [] };
    case 'krn': return { story: '' };
    case 'tdk': return { initialAction: '' };
  }
}

export const SUGGESTION_FIELD: Record<SuggestionKey, string> = {
  jns: 'kind', wkt: 'time', jdl: 'title', ptk: 'patokan', kat: 'category', dmp: 'securityImpact',
  ops: 'ops', krb: 'casualties', rug: 'lossIdr', mtr: 'handledBy', trd: 'axes', krn: 'story', tdk: 'initialAction',
};

/** Cerita demo yang dipakai bila Pelapor menekan kirim tanpa mengetik (skenario demo board I12/I13). */
export const DEMO_STORY =
  'Jam 1 malam kabel listrik pompa sumur ADR-07 dipotong orang tak dikenal, sekitar 40 m hilang. Panel listrik terbuka, pompa mati kira-kira 6 jam. Tidak ada korban. Kerugian kira-kira 18,5 juta. Yang jaga malam itu dari Garda Nusantara.';
