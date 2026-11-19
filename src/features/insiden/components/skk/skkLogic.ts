// Turunan data layar SKK untuk insiden yang sudah disetujui (board P31, P35, P36, PS1). Semua dari store.
import { demoNow } from '@/services/mock/clock';
import type { FollowUp, Incident } from '@/services/types';
import { formatDateShort, formatWibFull } from '@/lib/format';
import { DEMO_USERS } from '@/lib/rbac';

import { CLOSED_AT } from '@/services/mock/seedExtra';
import { closedAtOf, openFollowUps } from '@/services/mock/workflow.closure';
import { durFull, dueRemaining, timeShort } from '../../logic/closure';
import { DIRECTIVE_PREFIX } from '@/services/mock/workflow.skk';
import { registeredAt } from '../detail/detailLogic';

export const SKK_STATUSES = ['dalam-penanganan', 'minta-ditutup', 'ditutup'] as const;
export const isSkkStatus = (s: Incident['status']) => (SKK_STATUSES as readonly string[]).includes(s);

export interface EscalationInfo {
  auto: boolean;
  /** nama penerima */
  to: string;
  /** penerima adalah SKK (banner "mengeskalasi ... ke Anda") */
  toSkk: boolean;
  by: string;
  at: string;
  reason: string;
}

const SKK_NAME = DEMO_USERS.pengawas.name;
const PEJABAT_NAME = DEMO_USERS.pejabat.name;

/** Eskalasi insiden dari timeline; bila hanya ada tanda `escalated` (seed), diturunkan dari data penanganan/keterlambatan. */
export function escalationOf(i: Incident): EscalationInfo | null {
  if (!i.escalated) return null;
  const tl = [...(i.timeline ?? [])].reverse();
  const auto = tl.find((e) => e.text.startsWith('Eskalasi otomatis ke '));
  const manual = tl.find((e) => e.text.startsWith('Eskalasi ke '));
  const parse = (text: string, prefix: string) => {
    const rest = text.slice(prefix.length);
    const k = rest.indexOf(': ') >= 0 ? rest.indexOf(': ') : rest.indexOf('. ');
    return k < 0 ? { name: rest.replace(/\.$/, ''), reason: '' } : { name: rest.slice(0, k), reason: rest.slice(k + 2) };
  };
  const h = i.handling;
  if (manual && (!auto || manual.at >= auto.at)) {
    const p = parse(manual.text, 'Eskalasi ke ');
    return { auto: false, to: p.name, toSkk: h?.escalatedTo === 'skk' || p.name === SKK_NAME, by: manual.by, at: manual.at, reason: p.reason };
  }
  if (auto) {
    const p = parse(auto.text, 'Eskalasi otomatis ke ');
    return { auto: true, to: p.name, toSkk: false, by: 'Sistem', at: auto.at, reason: p.reason };
  }
  if (h?.escalatedTo === 'skk' || (h?.escalatedName && h.escalationReason)) {
    return { auto: false, to: h.escalatedName ?? SKK_NAME, toSkk: h.escalatedTo === 'skk', by: i.pic ?? 'PIC', at: i.handleDueAt ?? demoNow(), reason: h.escalationReason ?? '' };
  }
  const due = i.handleDueAt;
  return { auto: true, to: PEJABAT_NAME, toSkk: false, by: 'Sistem', at: due ?? demoNow(), reason: due ? `Tenggat ${formatWibFull(due)} terlewat.` : 'Tenggat terlewat.' };
}

/** Waktu penutupan: data penutupan atau tanggal tutup seed (jam 10:00 bila hanya tanggal). */
export const closedAtOrSeed = (i: Incident): string | null => closedAtOf(i) ?? CLOSED_AT[i.no] ?? null;
export const closedByOf = (i: Incident): string => i.handling?.closure?.closedBy ?? PEJABAT_NAME;

/** "2 hari 2 jam" (tanpa menit bila sudah ada hari), "6 jam 20 menit" */
export function durShort(from: string, to: string): string {
  const full = durFull(from, to);
  return /hari/.test(full) ? full.replace(/ \d+ menit$/, '') : full;
}

export interface ClosedInfo { at: string; by: string; dur: string; durFull: string; inTime: boolean; open: number }
export function closedInfo(i: Incident, fus: FollowUp[] = []): ClosedInfo | null {
  const at = closedAtOrSeed(i);
  if (!at) return null;
  const reg = registeredAt(i);
  return {
    at, by: closedByOf(i), dur: durShort(reg, at), durFull: durFull(reg, at),
    inTime: !i.handleDueAt || at <= i.handleDueAt, open: openFollowUps(i, fus).length,
  };
}

/** Teks "Dari {sumber}" riwayat tidak diperlukan; entri timeline arahan diturunkan dari `handling.directives`, jadi disaring agar tidak ganda. */
export const withoutDirectiveEntries = (i: Incident): Incident =>
  i.handling?.directives.length ? { ...i, timeline: (i.timeline ?? []).filter((e) => !e.text.startsWith(DIRECTIVE_PREFIX)) } : i;

export const dueLine = (due: string) => dueRemaining(due, demoNow());
export const nextStepMeta = (e: EscalationInfo | null) => (e ? `${timeShort(e.at)} · penanganan tetap di KKKS` : 'Penanganan tetap di KKKS');
export { formatDateShort };
