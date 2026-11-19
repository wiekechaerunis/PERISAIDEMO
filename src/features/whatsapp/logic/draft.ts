// Akses draf WhatsApp aktif, rute langkah, dan aturan tanda "Perlu dicek" (board I20, I21; chip AI sama dengan Kerawanan).
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import type { ReportDraft } from '@/features/insiden/logic/draft';
import type { WaAiField, WaDraft, WaMessage } from '@/services/types';

export const TOAST_DELETED = 'Draf dihapus. Pesan WhatsApp sumbernya tetap ada di Pemantauan WhatsApp.';
export const TOAST_UNLINKED = 'Tautan pesan dilepas. Pesan kembali ke kotak masuk.';

export const WA_STEPS = ['Temuan', 'Kejadian & dampak', 'Lampiran', 'Ringkasan'];
export const WA_ROUTES = {
  inbox: '/insiden/wa',
  temuan: '/insiden/wa/temuan',
  kejadian: '/insiden/wa/kejadian',
  lampiran: '/insiden/wa/lampiran',
  ringkasan: '/insiden/wa/ringkasan',
} as const;
export type WaStepKey = keyof typeof WA_ROUTES;

/** Rute langkah dengan penanda draf (`?d=`), supaya beberapa draf tidak tertukar. */
export const waPath = (step: WaStepKey, draftId?: string) => (draftId ? `${WA_ROUTES[step]}?d=${draftId}` : WA_ROUTES[step]);

/** Nama isian di baris status "isian perlu dicek". */
export const CHECK_NAMES: Record<string, string> = {
  kind: 'Jenis laporan', category: 'Kategori', securityImpact: 'Dampak keamanan', handledBy: 'Sudah menangani',
};
export const STEP_CHECKS: Record<1 | 2, string[]> = { 1: ['kind'], 2: ['category', 'securityImpact', 'handledBy'] };

export const needsCheck = (d: WaDraft, key: string) => !!d.ai[key]?.needsCheck && !d.ai[key]?.checked;
export const pendingChecks = (d: WaDraft, step: 1 | 2): string[] => STEP_CHECKS[step].filter((k) => needsCheck(d, k));
export const aiTitle = (f: WaAiField) => `Saran AI dari pesan: “${f.src}” · keyakinan ${f.confidence === 'hi' ? 'tinggi' : 'sedang'}`;

/** Isian wajib langkah 1 yang belum terisi. */
export function step1Missing(f: ReportDraft) {
  return { time: !f.date || !f.time, title: !f.title.trim(), location: !f.locationName, patokan: !f.patokan.trim() };
}

export interface ActiveWaDraft {
  draft: WaDraft | undefined;
  message: WaMessage | undefined;
  patchForm: (p: Partial<ReportDraft>) => void;
  /** tandai saran AI sudah dicek ("Sudah sesuai") */
  confirm: (key: string) => void;
  patchDraft: (fn: (d: WaDraft) => WaDraft) => void;
  /** kunci query keadaan demo, mis. ?state=ai-gagal */
  view: string | null;
}

/** Draf aktif: `?d=<id>`, bila tidak ada draf terbaru. */
export function useActiveWaDraft(): ActiveWaDraft {
  const [params] = useSearchParams();
  const drafts = useDemoStore((s) => s.waDrafts);
  const messages = useDemoStore((s) => s.waMessages);
  const updateWaDraft = useDemoStore((s) => s.updateWaDraft);
  const id = params.get('d');
  const draft = useMemo(() => (id ? drafts.find((d) => d.id === id) : drafts[0]), [drafts, id]);
  const message = draft ? messages.find((m) => m.id === draft.messageId) : undefined;
  const patchDraft = (fn: (d: WaDraft) => WaDraft) => draft && updateWaDraft(draft.id, fn);
  return {
    draft, message, patchDraft, view: params.get('state'),
    patchForm: (p) => patchDraft((d) => ({ ...d, form: { ...d.form, ...p } })),
    confirm: (key) => patchDraft((d) => (d.ai[key] ? { ...d, ai: { ...d.ai, [key]: { ...d.ai[key], checked: true } } } : d)),
  };
}

/** "Joko (Danru BUJP)" */
export const senderLabel = (m: WaMessage) => `${m.sender} (${m.senderRole})`;
/** "JK" */
export const senderInitials = (m: WaMessage) => (m.sender.slice(0, 2) || 'WA').toUpperCase();
