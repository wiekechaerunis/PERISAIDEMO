// Transisi oleh SKK (Pengawas/Pimpinan) atas insiden yang sudah disetujui (board P31, P32, P36). Fungsi murni gaya workflow.ts.
// SKK hanya membaca selain: memberi arahan (tanpa mengubah status, PIC, tenggat) dan, bila dikonfigurasi, menyetujui penutupan (DL-74).
import { demoNow } from '@/services/mock/clock';
import type { DemoState, HandlingData, Incident } from '../types';

import type { DecisionResult } from './workflow';
import { returnToPic } from './workflow.closure';

type Slice = Pick<DemoState, 'incidents' | 'kerawanan' | 'config'>;

export const MAX_DIRECTIVE = 1000;
export const MSG_DIRECTIVE_EMPTY = 'Tulis arahan untuk PIC.';
export const MSG_DIRECTIVE_STATUS = 'Arahan hanya bisa diberikan selama insiden berjalan.';
export const TOAST_DIRECTIVE = 'Arahan terkirim. PIC dan Pejabat Berwenang diberi tahu.';
/** Awalan teks entri timeline arahan; dipakai untuk mengenali entri di layar lain. */
export const DIRECTIVE_PREFIX = 'Arahan SKK: ';

const find = (s: Slice, no: string) => s.incidents.find((i) => i.no === no);
const put = (s: Slice, i: Incident): Slice => ({ ...s, incidents: s.incidents.map((x) => (x.no === i.no ? i : x)) });
const handlingOf = (i: Incident): HandlingData => i.handling ?? { notes: [], directives: [] };
const bad = (reason: string): DecisionResult => ({ ok: false, reason });

/** Beri arahan: teks wajib (maks 1.000). Menambah `handling.directives` dan entri timeline "Arahan SKK". Status, PIC, tenggat tidak berubah. */
export function giveDirective(s: Slice, no: string, by: string, text: string, at: string = demoNow()): DecisionResult {
  const i = find(s, no);
  if (!i) return bad('Insiden tidak ditemukan.');
  if (i.status !== 'dalam-penanganan' && i.status !== 'minta-ditutup') return bad(MSG_DIRECTIVE_STATUS);
  const t = text.trim();
  if (!t) return bad(MSG_DIRECTIVE_EMPTY);
  if (t.length > MAX_DIRECTIVE) return bad(`Arahan maksimal ${MAX_DIRECTIVE} karakter.`);
  const h = handlingOf(i);
  return {
    ok: true,
    state: put(s, {
      ...i,
      handling: { ...h, directives: [...h.directives, { at, by, text: t }] },
      timeline: [...(i.timeline ?? []), { at, by, text: `${DIRECTIVE_PREFIX}${t}` }],
    }),
  };
}

/** Setujui penutupan (P36, bila SKK dikonfigurasi sebagai penyetuju): Minta ditutup → Ditutup. */
export function approveClosureBySkk(s: Slice, no: string, by: string, note = '', at: string = demoNow()): DecisionResult {
  const i = find(s, no);
  if (!i) return bad('Insiden tidak ditemukan.');
  if (i.status !== 'minta-ditutup') return bad('Insiden tidak sedang menunggu penutupan.');
  const h = handlingOf(i);
  const n = note.trim();
  return {
    ok: true,
    state: put(s, {
      ...i, status: 'ditutup',
      handling: { ...h, closure: h.closure ? { ...h.closure, closedAt: at, closedBy: by, closureNote: n || h.closure.closureNote, returnReason: undefined } : h.closure },
      timeline: [...(i.timeline ?? []), { at, by, text: `Ditutup: Disetujui SKK.${n ? ` ${n}` : ''}` }],
    }),
  };
}

/** Kembalikan ke PIC (P36): alasan wajib; Minta ditutup → Dalam penanganan. */
export function rejectClosureBySkk(s: Slice, no: string, by: string, reason: string, at: string = demoNow()): DecisionResult {
  return returnToPic(s, no, by, reason, at);
}
