// Saran AI dari pesan WhatsApp (board I20, I21, I21b). Memakai `ai.extract` (mock) lalu menambah aturan khusus pesan sitrep:
// pengirim = sumber saran "Sudah menangani", tanggal = tanggal pesan, lokasi tidak ada di pesan (Pelapor memilih titik).
import { ai } from '@/services/ai';
import type { Extraction } from '@/services/ai/types';
import type { WaAiField, WaMessage } from '@/services/types';
import { emptyDraft, type Attachment, type ReportDraft } from '@/features/insiden/logic/draft';
import { SITES } from './sites';

export interface WaSuggestion {
  form: ReportDraft;
  ai: Record<string, WaAiField>;
  aiState: 'ok' | 'gagal';
}

const field = (src: string, confidence: 'hi' | 'md', needsCheck = confidence === 'md'): WaAiField => ({ src, confidence, needsCheck });
const cap1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Foto pesan ikut terlampir otomatis (id berawalan `wa:`, ditandai "Dari WhatsApp"; board I21b). */
export const WA_PREFIX = 'wa:';
export const photoAttachments = (m: WaMessage): Attachment[] => m.photos.map((p) => ({ id: WA_PREFIX + p.id, name: p.name, sizeKb: p.sizeKb, caption: '' }));

/** Draf kosong bila saran AI tidak tersedia: isian otomatis (waktu pesan) tetap terisi. */
export function manualSuggestion(m: WaMessage): WaSuggestion {
  const form: ReportDraft = { ...emptyDraft(), hasImpact: 'ya', kind: 'insiden', date: m.at.slice(0, 10), time: m.at.slice(11, 16), attachments: photoAttachments(m) };
  return { form, ai: {}, aiState: 'gagal' };
}

/** Nama lokasi yang disebut pesan, mis. "ADR-07"; null bila tidak ada. */
export const locationHint = (text: string): string | null => text.match(/\bADR-\d+\b/i)?.[0].toUpperCase() ?? null;
/** Lokasi contoh yang cocok dengan sebutan di pesan (dipakai membuka peta di area itu). */
export const siteForHint = (hint: string | null) => (hint ? SITES.find((s) => s.name.toUpperCase().includes(hint)) : undefined);

/** Bentuk saran dari hasil ekstraksi (murni, tanpa jaringan). */
export function buildSuggestion(m: WaMessage, ex: Extraction): WaSuggestion {
  const text = m.text;
  const aiMap: Record<string, WaAiField> = {};
  const form: ReportDraft = { ...emptyDraft(), hasImpact: 'ya', kind: 'insiden', date: m.at.slice(0, 10), time: m.at.slice(11, 16), attachments: photoAttachments(m) };

  // Jenis laporan: pesan sitrep selalu disarankan Insiden; keyakinan sedang bila dasarnya hanya kata dampak.
  const impactWord = text.match(/pompa mati|berhenti|hilang|dicuri|luka|korban|kerugian/i)?.[0];
  const cut = text.match(/kabel[^.]*?(dipotong|dicuri|hilang)/i)?.[0];
  aiMap.kind = field([cut ? cut.replace(/\s+listrik.*?(?=dipotong)/i, ' … ').replace(/\s+/g, ' ') : null, impactWord ? cap1(impactWord) : null].filter(Boolean).join(' … ') || 'isi pesan', 'md');

  // Waktu kejadian
  if (ex.time) {
    form.time = ex.time.value.time;
    aiMap.time = field(ex.time.src, 'hi');
  } else {
    aiMap.time = field('waktu pesan masuk', 'md');
  }

  // Judul dan patokan lokasi
  const hint = locationHint(text);
  const pompa = hint ? text.match(new RegExp(`pompa ${hint}`, 'i'))?.[0] : null;
  if (cut && hint) {
    const body = cut.replace(/\s+listrik/i, '');
    form.title = cap1(body.replace(/^kabel\s+/i, 'Kabel ')).slice(0, 120);
    aiMap.title = field(cut, 'hi');
    form.securityImpact = `${cap1(cut)}${/hilang/i.test(cut) ? '' : ' dan hilang'}.`;
    aiMap.securityImpact = field(cut, 'hi', true);
  } else if (ex.title) {
    form.title = ex.title.value;
    aiMap.title = field(ex.title.src, ex.title.confidence);
    if (ex.securityImpact) {
      form.securityImpact = ex.securityImpact.value;
      aiMap.securityImpact = field(ex.securityImpact.src, ex.securityImpact.confidence, true);
    }
  }
  if (pompa) {
    form.patokan = `Pompa sumur ${hint}`;
    aiMap.patokan = field(pompa, 'hi');
  } else if (ex.patokan) {
    form.patokan = ex.patokan.value;
    aiMap.patokan = field(ex.patokan.src, ex.patokan.confidence);
  }

  // Kategori
  if (ex.category) {
    form.category = ex.category.value;
    aiMap.category = field(cut ?? ex.category.src, 'md');
  }

  // Yang terdampak dan kondisi operasi
  const ops = ex.ops;
  if (ops || /pompa|kabel/i.test(text)) {
    form.axes = ['prop'];
    aiMap.axes = field(ops?.src ?? 'pompa', 'hi', false);
    if (ops) {
      form.ops = ops.value.state;
      form.opsHours = ops.value.hours;
    }
  }

  // Sudah menangani: dari peran pengirim, selalu "Perlu dicek" ("Sdh lapor polsek" belum tentu Polri ikut menangani)
  const role = m.senderRole.toLowerCase();
  if (role.includes('bujp')) {
    form.handledBy = ['bujp'];
    aiMap.handledBy = field(`pengirim pesan ${m.senderRole}`, 'md', true);
  } else if (role.includes('security')) {
    form.handledBy = ['int'];
    aiMap.handledBy = field(`pengirim pesan ${m.senderRole}`, 'md', true);
  } else if (ex.handledBy) {
    form.handledBy = [ex.handledBy.value];
    aiMap.handledBy = field(ex.handledBy.src, 'md', true);
  }

  form.aiFilled = Object.keys(aiMap);
  return { form, ai: aiMap, aiState: 'ok' };
}

/** Baca pesan lewat ai.extract. `fail` memaksa gagal (demo MS04, ?state=ai-gagal). */
export async function suggestFromMessage(m: WaMessage, opts: { fail?: boolean } = {}): Promise<WaSuggestion> {
  if (opts.fail) return manualSuggestion(m);
  try {
    return buildSuggestion(m, await ai.extract(m.text));
  } catch {
    return manualSuggestion(m);
  }
}
