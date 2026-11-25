// Jawaban kolom "Tanya data": dihitung dari data demo yang sama dengan kartu dashboard (INC, A0, W, CAT, LV, MO).
// Aturan saring sama dengan logika dashboard (incS): area dalam cakupan, level terpilih, kategori.
import { A0, CAT, INC, LV, MO, SEN, W } from '@/data/dashboard';
import type { Chip, Filters, Parsed, Role } from './parseQuery';

type AreaRow = [string, string, string, number, number, number[], number, string, string];
type IncRow = [string, string, number, number, number, number, string, string, number, number];
const AREAS = A0 as unknown as AreaRow[];
const INCS = INC as unknown as IncRow[];
const WN = W as unknown as Record<string, { n: string; kk: number; rep: number; nr?: boolean }>;
const CATS = CAT as unknown as [string][];
const LVS = LV as unknown as [string, string][];
const MOS = MO as unknown as string[];
const AREA = Object.fromEntries(AREAS.map((a) => [a[0], a]));

/** format Rupiah sama dengan dashboard (nilai dalam juta) */
export const rp = (jt: number) => (!jt ? 'Rp0' : jt >= 1000 ? `Rp${(jt / 1000).toFixed(2).replace('.', ',')} M` : `Rp${Math.round(jt)} jt`);

export interface Item {
  label: string;
  value: string;
  apply: Filters;
}
export interface Answer {
  kind: 'ok' | 'zero' | 'unknown' | 'scope';
  intent?: Parsed['intent'];
  kalimat: string;
  items?: Item[];
  link?: string;
  /** filter yang bisa dipasang ke bar filter dashboard */
  apply?: Filters;
  /** bulan tidak bisa dipasang ke dashboard (dashboard per semester) */
  monthNote?: string;
  zoom?: { w: string; area: string };
  highlight?: { cat?: number; months: number[] };
  activeNote?: boolean;
  lastChip?: Chip;
  suggestions?: string[];
}

export const SUGGEST_SKK = ['insiden Kritis di Sumbagsel bulan Juni', 'KKKS dengan kerugian terbesar', 'pencurian Maret vs Juni', 'insiden lewat tenggat'];
export const SUGGEST_KKKS = ['insiden Kritis di WK Andalas Darat bulan Juni', 'lokasi dengan kerugian terbesar', 'pencurian Maret vs Juni', 'insiden lewat tenggat'];
export const suggestions = (role: Role) => (role === 'kkks' ? SUGGEST_KKKS : SUGGEST_SKK);

/** Area dalam cakupan filter (wilayah, KKKS, lokasi) dan peran. */
export function scopeAreas(f: Filters, role: Role): AreaRow[] {
  return AREAS.filter(
    (a) => (role === 'skk' || a[7] === SEN) && (!f.w || a[1] === f.w) && (!f.kk || a[7] === f.kk) && (!f.area || a[0] === f.area),
  );
}

/** Insiden yang cocok: sama dengan incS di logika dashboard, ditambah filter bulan. */
export function matchInc(f: Filters, role: Role): IncRow[] {
  const ids = new Set(scopeAreas(f, role).map((a) => a[0]));
  return INCS.filter(
    (r) => ids.has(r[1]) && (!f.lv || f.lv.includes(r[3])) && (f.cat == null || r[2] === f.cat) && (!f.months || f.months.includes(r[9])),
  );
}

/** Kerugian area dengan cara dashboard: nilai area diskalakan dengan porsi level yang dipilih. */
const areaRp = (a: AreaRow, f: Filters) => {
  const all = a[5].reduce((x, y) => x + y, 0);
  if (!all) return 0;
  const sel = f.lv ? a[5].filter((_, i) => f.lv!.includes(i)).reduce((x, y) => x + y, 0) : all;
  let r = a[6] * Math.min(1, sel / all);
  if (f.cat != null) {
    const tot = INCS.filter((x) => x[1] === a[0]).length;
    r *= tot ? INCS.filter((x) => x[1] === a[0] && x[2] === f.cat).length / tot : 0;
  }
  return r;
};

const placeOf = (f: Filters) =>
  f.area ? `${AREA[f.area][2]} · ${AREA[f.area][8]}` : f.kk ? f.kk.replace(/^PT /, '') : f.w ? WN[f.w].n : '';
const monthsOf = (m?: number[]) => (m && m.length ? m.map((i) => MOS[i]).join(', ') + ' 2026' : '');

export function linkOf(f: Filters, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams();
  if (f.w) q.set('wilayah', f.w);
  if (f.kk) q.set('kkks', f.kk);
  if (f.area) q.set('lokasi', f.area);
  if (f.cat != null) q.set('kategori', CATS[f.cat][0]);
  if (f.lv) q.set('level', f.lv.map((i) => LVS[i][0].toLowerCase()).join(','));
  if (f.months) q.set('bulan', f.months.map((i) => i + 1).join(','));
  Object.entries(extra).forEach(([k, v]) => q.set(k, v));
  const s = q.toString();
  return '/insiden' + (s ? `?${s}` : '');
}

const isEmpty = (f: Filters) => !f.w && !f.kk && !f.area && f.cat == null && !f.lv && !f.months;

/**
 * Jawaban dari hasil parsing. `active` = filter dashboard yang sedang terpasang; bagian yang disebut di ketikan
 * menggantikan filter aktif yang sejenis.
 */
export function answer(p: Parsed, role: Role, active: Filters = {}): Answer {
  const sug = suggestions(role);
  if (p.outOfScope) return { kind: 'scope', kalimat: 'Hanya data organisasi Anda yang bisa ditanyakan.' };
  if (p.unknown) return { kind: 'unknown', kalimat: 'Belum bisa menjawab pertanyaan itu. Coba:', suggestions: sug.slice(0, 2) };

  const f: Filters = { ...active, ...p.filters };
  if (p.filters.area) { delete f.w; delete f.kk; }
  const activeNote = !isEmpty(active) && Object.keys(active).some((k) => !(k in p.filters));
  const suffix = activeNote ? ' (dengan filter aktif)' : '';
  const lastChip = p.chips.filter((c) => c.kind !== 'kelompok' && c.kind !== 'ukuran').at(-1);
  const applyOf = (x: Filters): Filters => ({ w: x.w, kk: x.kk, area: x.area, cat: x.cat, lv: x.lv });
  const monthNote = f.months ? `Bulan (${monthsOf(f.months)}) tidak dipasang ke dashboard karena dashboard dihitung per semester.` : undefined;

  if (p.intent === 'lokasi' && f.area) {
    const a = AREA[f.area];
    return { kind: 'ok', intent: 'lokasi', kalimat: `Membuka peta ${a[8]} · ${a[2]}.`, zoom: { w: a[1], area: a[0] } };
  }

  if (p.intent === 'tindakan') {
    if (p.action === 'belum-melapor') {
      const ws = f.w ? [f.w] : Object.keys(WN);
      const kk = ws.reduce((s, w) => s + WN[w].kk, 0);
      const rep = ws.reduce((s, w) => s + WN[w].rep, 0);
      return {
        kind: 'ok', intent: 'tindakan', activeNote,
        kalimat: `${kk - rep} dari ${kk} KKKS belum melapor insiden atau nihil untuk Jun 2026${f.w ? ` di ${WN[f.w].n}` : ''}${suffix}.`,
        link: linkOf(f, { kkks: 'belum-melapor' }),
      };
    }
    const late = matchInc(f, role).filter((r) => r[5]);
    const crit = late.filter((r) => r[3] === 4).length;
    if (!late.length) return { kind: 'zero', kalimat: `Tidak ada insiden lewat tenggat${placeOf(f) ? ` di ${placeOf(f)}` : ''}.`, lastChip };
    return {
      kind: 'ok', intent: 'tindakan', activeNote, apply: applyOf(f),
      kalimat: `${late.length} insiden lewat tenggat${placeOf(f) ? ` di ${placeOf(f)}` : ''}${crit ? `, ${crit} di antaranya Kritis` : ''}${suffix}.`,
      link: linkOf(f, { status: 'lewat-tenggat' }),
    };
  }

  if (p.intent === 'peringkat') {
    const g = p.group ?? 'kategori';
    const byRp = p.measure === 'kerugian';
    const areas = scopeAreas(f, role);
    const inc = matchInc(f, role);
    let rows: { label: string; v: number; apply: Filters }[] = [];
    if (g === 'kategori') {
      rows = CATS.map((c, i) => ({
        label: c[0],
        v: byRp ? areas.reduce((s, a) => s + areaRp(a, { ...f, cat: i }), 0) : inc.filter((r) => r[2] === i).length,
        apply: { ...applyOf(f), cat: i },
      }));
    } else {
      const key = (a: AreaRow) => (g === 'kkks' ? a[7] : g === 'wilayah' ? a[1] : a[0]);
      const groups = [...new Set(areas.map(key))];
      rows = groups.map((k) => {
        const as = areas.filter((a) => key(a) === k);
        const ids = new Set(as.map((a) => a[0]));
        return {
          label: g === 'kkks' ? k.replace(/^PT /, '') : g === 'wilayah' ? WN[k].n : `${AREA[k][2]} · ${AREA[k][8]}`,
          v: byRp ? as.reduce((s, a) => s + areaRp(a, f), 0) : inc.filter((r) => ids.has(r[1])).length,
          apply: g === 'kkks' ? { ...applyOf(f), kk: k } : g === 'wilayah' ? { ...applyOf(f), w: k } : { ...applyOf(f), area: k, w: undefined, kk: undefined },
        };
      });
    }
    const top = rows.filter((r) => r.v > 0).sort((a, b) => b.v - a.v).slice(0, 3);
    if (!top.length) return { kind: 'zero', kalimat: 'Tidak ada insiden yang cocok dengan pertanyaan ini.', lastChip };
    const gName = { kkks: 'KKKS', wilayah: 'wilayah', kategori: 'jenis insiden', lokasi: 'lokasi' }[g];
    return {
      kind: 'ok', intent: 'peringkat', activeNote, monthNote,
      kalimat: `${top.length} ${gName} dengan ${byRp ? 'kerugian terbesar' : 'insiden terbanyak'}${placeOf(f) ? ` di ${placeOf(f)}` : ''}${f.months && !byRp ? `, ${monthsOf(f.months)}` : ''}${suffix}:`,
      items: top.map((r) => ({ label: r.label, value: byRp ? rp(r.v) : `${r.v} insiden`, apply: r.apply })),
    };
  }

  if (p.intent === 'banding') {
    const ms = f.months ?? [];
    const [a, b] = ms.length >= 2 ? [ms[0], ms[ms.length - 1]] : ms.length === 1 ? [Math.max(0, ms[0] - 1), ms[0]] : [0, MOS.length - 1];
    const base = { ...f, months: undefined };
    const ca = matchInc({ ...base, months: [a] }, role).length;
    const cb = matchInc({ ...base, months: [b] }, role).length;
    const what = f.cat != null ? CATS[f.cat][0] : 'Insiden';
    const dir = cb > ca ? 'naik' : cb < ca ? 'turun' : 'tetap';
    const pct = ca ? Math.round((Math.abs(cb - ca) / ca) * 100) : null;
    const where = placeOf(f) ? ` di ${placeOf(f)}` : '';
    return {
      kind: 'ok', intent: 'banding', activeNote, apply: applyOf(f), highlight: { cat: f.cat, months: [a, b] },
      kalimat:
        dir === 'tetap'
          ? `${what}${where} tetap (${MOS[a]} ${ca} → ${MOS[b]} ${cb})${suffix}.`
          : pct == null
            ? `${what}${where} ${dir} dari 0 jadi ${cb} (${MOS[a]} → ${MOS[b]})${suffix}.`
            : `${what}${where} ${dir} ${pct}% (${MOS[a]} ${ca} → ${MOS[b]} ${cb})${suffix}.`,
    };
  }

  // saring
  const n = matchInc(f, role).length;
  const lvTxt = f.lv ? ' ' + f.lv.map((i) => LVS[i][0]).join('/') : '';
  const catTxt = f.cat != null ? ` ${CATS[f.cat][0]}` : '';
  const where = placeOf(f) ? ` di ${placeOf(f)}` : '';
  const when = f.months ? `, ${monthsOf(f.months)}` : '';
  if (n === 0) {
    return { kind: 'zero', kalimat: `Tidak ada insiden yang cocok dengan ${p.chips.map((c) => c.label).join(' · ')}.`, lastChip };
  }
  return {
    kind: 'ok', intent: 'saring', activeNote, monthNote, apply: applyOf(f), link: linkOf(f),
    kalimat: `${n} insiden${lvTxt}${catTxt}${where}${when}${suffix}.`,
  };
}
