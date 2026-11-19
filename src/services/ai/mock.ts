import { demoNow } from '@/services/mock/clock';
import type { AiService, Extraction, Found, HandledBy, ImpactAxisKey } from './types';


const found = <T>(value: T, src: string, confidence: 'hi' | 'md'): Found<T> => ({ value, src, confidence });
const LOC = /(sumur|flowline|terminal|tangki|gerbang|pos jaga|wellpad)\s+([A-Z]{0,4}-?\d+[A-Za-z]?|arunika|blok\s+[A-Za-z]+)/i;
const cap = (s: string) => s.replace(/(^|\s)([a-z])/g, (_, a, b) => a + b.toUpperCase());
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const NUM: Record<string, number> = { satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5 };

/**
 * Ekstraksi deterministik berbasis kata kunci. Tidak ada jaringan.
 * `now` = acuan "hari ini" (ISO lokal) untuk waktu relatif ("tadi pagi", "kemarin"); bawaan tanggal demo supaya tes stabil.
 * Setiap `src` adalah potongan persis dari cerita (UI menyembunyikan baris kutipan bila bukan potongan asli).
 */
export function extractStory(story: string, now: string = demoNow()): Extraction {
  const s = story.trim();
  const low = s.toLowerCase();
  const empty: Extraction = {
    kind: null, time: null, title: null, patokan: null, category: null, securityImpact: null,
    ops: null, casualty: null, lossIdr: null, handledBy: null, axes: null, chronology: null, initialAction: null,
    locationName: null, locationMention: null, k3: false,
  };
  if (s.length < 12) return empty;
  const sentences = s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);

  const jm = s.match(/jalan akses\s+SP\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  const locM = s.match(LOC) ?? jm;
  const locationName = jm && !s.match(LOC)
    ? `Jalan akses SP ${cap(jm[1])}`
    : locM
      ? cap(locM[0].replace(/\s+/g, ' ')).replace(/^(\w+) ([a-z]+-\d+)/i, (_, a, b) => `${a} ${b.toUpperCase()}`)
      : null;
  const bm = s.match(/\bblok\s+[A-Za-z]+/i) ?? s.match(/\bWK\s+[A-Za-z]+(?:\s+[A-Za-z]+)?/);
  const locationMention = bm ? cap(bm[0].replace(/\s+/g, ' ')) : null;

  // waktu: "jam 1 malam", "jam 06.10 pagi", "tadi pagi sekitar jam 9"
  let time: Extraction['time'] = null;
  const tm = s.match(/jam\s+(\d{1,2})(?:[.:](\d{2}))?\s*(malam|pagi|siang|sore|dini hari)?/i);
  if (tm) {
    let h = parseInt(tm[1], 10);
    const part = (tm[3] ?? '').toLowerCase();
    if ((part === 'sore' || part === 'siang') && h < 12) h += 12;
    if (part === 'malam' && h >= 6 && h < 12) h += 12;
    const mm = tm[2] ?? '00';
    const base = new Date(now.slice(0, 10) + 'T00:00:00Z');
    if (/kemarin/i.test(s) || (/semalam|tadi malam/i.test(s) && h >= 18)) base.setUTCDate(base.getUTCDate() - 1);
    time = found({ date: base.toISOString().slice(0, 10), time: `${String(h).padStart(2, '0')}:${mm}` }, tm[0], 'md');
  }

  // kategori (urutan: unsur keamanan lebih dulu, K3 terakhir)
  const cats: [RegExp, string][] = [
    [/solar|minyak|bbm/, 'Pencurian minyak'],
    [/kabel|hilang|dicuri|dipotong|pencuri/, 'Pencurian/Perampokan'],
    [/pagar|cctv|dirusak|rusak|dibakar/, 'Perusakan material'],
    [/hadang|blokade|warga menutup/, 'Blokade area'],
    [/dipukul|dikeroyok|diserang|penyerangan/, 'Serangan fisik'],
    [/kebakar|\bapi\b/, 'Kebakaran'],
    [/ancam|bom/, 'Ancaman'],
    [/drone/, 'Lainnya'],
    [/tabrakan|kecelakaan lalu lintas|laka lantas|menabrak/, 'Kecelakaan lalu lintas'],
    [/terjepit|kecelakaan kerja|tertimpa|terjatuh|terpeleset|tersengat|jatuh dari ketinggian/, 'Kecelakaan kerja'],
  ];
  const catHit = cats.find(([re]) => re.test(low));
  const catSrc = catHit ? (s.match(new RegExp(catHit[0].source, 'i'))?.[0] ?? '') : '';
  const k3 = !!catHit && ['Kecelakaan kerja', 'Kecelakaan lalu lintas', 'Kebakaran'].includes(catHit[1]);
  const kabelSrc = s.match(/kabel[^.]*?(dipotong|dicuri|hilang)[^.,]*/i)?.[0] ?? catSrc;

  // judul dan patokan
  let title: Extraction['title'] = null;
  if (catHit && locM) {
    const noun = /kabel/.test(low) ? 'kabel listrik' : /pagar/.test(low) ? 'pagar' : /cctv/.test(low) ? 'CCTV' : /solar/.test(low) ? 'solar' : '';
    const verb: Record<string, string> = {
      'Pencurian/Perampokan': 'Pencurian', 'Pencurian minyak': 'Pencurian', 'Perusakan material': 'Perusakan',
      'Blokade area': 'Penghadangan di', Kebakaran: 'Kebakaran di', Ancaman: 'Ancaman di', 'Serangan fisik': 'Penyerangan di',
      'Kecelakaan kerja': 'Kecelakaan kerja di', 'Kecelakaan lalu lintas': 'Kecelakaan lalu lintas di', Lainnya: 'Kejadian di',
    };
    title = found([verb[catHit[1]], noun, locM[0].replace(/\s+/g, ' ')].filter(Boolean).join(' '), kabelSrc, 'hi');
  }
  const panel = low.includes('panel listrik');
  const patokan = locationName
    ? found(panel ? `${locationName}, sisi panel listrik` : locationName, (locM?.[0] ?? locationName).replace(/\s+/g, ' '), 'md')
    : null;

  // dampak keamanan
  const meter = s.match(/sekitar\s+(\d+)\s*m\b[^.]*hilang[^.]*/i);
  let securityImpact: Extraction['securityImpact'] = null;
  if (meter) {
    securityImpact = found(
      `Sekitar ${meter[1]} m kabel hilang.${panel ? ' Panel listrik pompa terbuka.' : ''}`,
      meter[0], 'hi',
    );
  } else if (/hilang|dicuri|rusak/.test(low)) {
    const m = s.match(/[^.]*(hilang|dicuri|rusak)[^.]*/i)!;
    securityImpact = found(m[0].trim() + '.', m[0].trim(), 'md');
  }

  // operasi
  let ops: Extraction['ops'] = null;
  const om = s.match(/(pompa|produksi|operasi)[^.]*?(mati|berhenti)[^.]*?(\d+)\s*jam/i);
  if (om) ops = found({ state: 'berhenti', hours: parseInt(om[3], 10) }, om[0], 'md');
  else if (/pompa mati|operasi berhenti|produksi berhenti/.test(low)) ops = found({ state: 'berhenti', hours: null }, 'pompa mati', 'md');
  else if (/terganggu sebagian|sebagian terganggu|tertahan/.test(low)) {
    const h = s.match(/(?:tertahan|terganggu)[^.]*?(\d+)\s*jam/i);
    ops = found({ state: 'sebagian', hours: h ? parseInt(h[1], 10) : null }, s.match(/[^.]*(?:terganggu sebagian|sebagian terganggu|tertahan)[^.]*/i)![0].trim(), 'md');
  } else if (/tidak (terganggu|ada gangguan)/.test(low)) ops = found({ state: 'tidak', hours: null }, s.match(/tidak (terganggu|ada gangguan)/i)![0], 'md');

  // korban: meninggal > luka berat > klinik/RS > P3K/luka ringan; jumlah dari "dua pekerja" dst.
  let casualty: Extraction['casualty'] = null;
  const noCasualty = s.match(/tidak ada( yang)? (korban|luka)|tanpa korban/i);
  const cnt = s.match(/\b(\d+|satu|dua|tiga|empat|lima)\s+(orang|pekerja|karyawan|satpam|warga|petugas)/i);
  const n = cnt ? (NUM[cnt[1].toLowerCase()] ?? parseInt(cnt[1], 10)) : 1;
  const klinik = s.match(/(?:dibawa|dirujuk|dilarikan)[^.,]*?(?:klinik|rumah sakit|puskesmas|\brs\b)[^.,]*/i);
  if (noCasualty) casualty = found({ kind: 'none', count: 0 }, noCasualty[0], 'hi');
  else if (/meninggal|tewas/.test(low)) casualty = found({ kind: 'meninggal', count: n }, s.match(/meninggal|tewas/i)![0], 'md');
  else if (/luka berat|cacat/.test(low)) casualty = found({ kind: 'berat', count: n }, 'luka berat', 'md');
  else if (klinik) casualty = found({ kind: 'klinik', count: n }, klinik[0].trim(), 'md');
  else if (/luka|p3k|memar|berdarah|lecet/.test(low)) casualty = found({ kind: 'p3k', count: n }, s.match(/luka\w*|p3k|memar|berdarah|lecet/i)![0], 'md');
  const hurt = casualty && casualty.value.kind !== 'none';
  if (!securityImpact && hurt) {
    const inj = sentences.find((x) => /terjepit|luka|memar|berdarah|dipukul|diserang|patah|tersengat|terjatuh|tertimpa/i.test(x));
    if (inj) securityImpact = found(inj, inj, 'md');
  }

  // kerugian
  let lossIdr: Extraction['lossIdr'] = null;
  const lm = s.match(/(?:kerugian|rugi)[^.]*?(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(juta|miliar|jt)/i);
  if (lm) {
    const v = parseFloat(lm[1].replace(',', '.'));
    lossIdr = found(Math.round(v * (/miliar/i.test(lm[2]) ? 1e9 : 1e6)), lm[0], 'md');
  }

  // sudah menangani
  let handledBy: Extraction['handledBy'] = null;
  const hm: [RegExp, HandledBy][] = [[/bujp|garda|security/i, 'bujp'], [/tni/i, 'tni'], [/polri|polisi|polsek/i, 'polri']];
  for (const [re, v] of hm) {
    const m = s.match(re);
    if (m) { handledBy = found(v, s.match(/[^.]*\b(?:bujp|garda|security|tni|polri|polisi|polsek)\b[^.]*/i)?.[0].trim() ?? m[0], 'md'); break; }
  }

  // tindakan awal: kalimat yang menyebut langkah yang sudah dilakukan
  const act = sentences.find((x) => /\b(p3k|dibawa ke|dilarikan|dirujuk|dievakuasi|dilaporkan|melapor|dipasang|diamankan|dipadamkan|dijaga|ditutup sementara|diberi)\b/i.test(x));
  const initialAction = act ? found(sentenceCase(act.replace(/^langsung\s+/i, '')), act, 'md') : null;

  // sumbu terdampak (urutan tetap: properti, manusia, lingkungan, data); "tidak ada kebocoran" bukan dampak
  const pos = s.replace(/tidak ada( yang)? (korban|kerugian|luka|kebocoran|tumpahan)/gi, '');
  const axes: ImpactAxisKey[] = [];
  const axSrc: string[] = [];
  if (ops || lossIdr || (securityImpact && !hurt)) { axes.push('prop'); axSrc.push((ops ?? lossIdr ?? securityImpact)!.src); }
  if (hurt) { axes.push('man'); axSrc.push(casualty!.src); }
  const env = pos.match(/tumpah\w*|bocor\w*|pencemaran/i);
  if (env) { axes.push('ling'); axSrc.push(env[0]); }
  const dat = pos.match(/\b(data|laptop|server|dokumen rahasia)\b/i);
  if (dat) { axes.push('data'); axSrc.push(dat[0]); }
  const axesF = axes.length ? found(axes, axSrc[0], 'md') : null;

  // kronologi hanya bila cerita memuat sesuatu yang dikenali (cerita samar tidak diberi saran)
  const chronology = s.length >= 25 && (catHit || time || locationName || hurt || ops) ? found(sentences.slice(0, 2).join(' '), sentences[0], 'hi') : null;

  const impactWords = /hilang|dicuri|luka|tewas|meninggal|berhenti|mati|rusak berat|kerugian|rugi|terganggu|tertahan|dipukul|diserang|terjepit|memar|berdarah|klinik|p3k/i;
  // "Tidak ada korban/kerugian" bukan dampak: dibuang sebelum mencari kata dampak.
  const withoutNegated = s.replace(/tidak ada( yang)? (korban|kerugian|luka)|tanpa korban|tidak (terganggu|ada gangguan)/gi, '');
  const hasImpact = impactWords.test(withoutNegated) || !!hurt;
  // Jenis laporan hanya disarankan bila ada dasar dari cerita (kata dampak, atau kategori/lokasi/waktu yang jelas); cerita samar tidak diberi saran.
  const kind =
    hasImpact || catHit || locationName || time
      ? found<'insiden' | 'kerawanan'>(
          hasImpact ? 'insiden' : 'kerawanan',
          withoutNegated.match(impactWords)?.[0] ?? noCasualty?.[0] ?? (catSrc || s.slice(0, 50)), 'hi',
        )
      : null;
  return {
    kind, time, title, patokan, category: catHit ? found(catHit[1], catSrc, 'hi') : null, securityImpact, ops, casualty, lossIdr,
    handledBy, axes: axesF, chronology, initialAction, locationName, locationMention, k3,
  };
}

const OOS = /(minggu lalu|kemarin|bulan lalu).*(kejadian|insiden|laporan)|pelakunya siapa|siapa pelaku|buka laporan|laporan (lain|orang)/i;

export const mockAi: AiService = {
  async extract(story, opts) {
    await new Promise((r) => setTimeout(r, 1400));
    return extractStory(story, opts?.now);
  },
  isOutOfScope: (m) => OOS.test(m),
};
