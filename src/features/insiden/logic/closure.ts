// Turunan data layar Pejabat insiden berjalan (board P22..P34, PS1/PS5/PS7/PS8/PS10). Semua dihitung dari store.
import type { FollowUp, Incident, TimelineEntry } from '@/services/types';
import { remainingLabel } from '@/lib/deadline';
import { formatDate, formatDateShort, formatWib, formatWibFull } from '@/lib/format';
import { addMinutes, detailOf, formatDuration, registeredAt } from '../components/detail/detailLogic';
import { addDaysIso, openFollowUps } from '@/services/mock/workflow.closure';
import { closureCompleteness } from '@/services/mock/workflow.handling';
import { TIMS } from '../components/step2Data';

const MS = (iso: string) => new Date(iso + 'Z').getTime();
const DAY = 86_400_000;

/** "2 hari 2 jam 40 menit" */
export function durFull(from: string, to: string): string {
  const m = Math.max(0, Math.round((MS(to) - MS(from)) / 60_000));
  const p = [Math.floor(m / 1440) && `${Math.floor(m / 1440)} hari`, Math.floor((m % 1440) / 60) && `${Math.floor((m % 1440) / 60)} jam`, m % 60 && `${m % 60} menit`].filter(Boolean);
  return p.join(' ') || '0 menit';
}

/** Batas tinjau: 2 hari kerja sejak pengajuan. */
export function reviewDeadline(requestedAt: string): string {
  let t = MS(requestedAt);
  let n = 0;
  while (n < 2) {
    t += DAY;
    const wd = new Date(t).getUTCDay();
    if (wd !== 0 && wd !== 6) n++;
  }
  return new Date(t).toISOString().slice(0, 19);
}

/** "sisa 22 jam", "sisa 2 hari", "lewat 2 hari" */
export function dueRemaining(dueIso: string, now: string): { late: boolean; text: string } {
  return remainingLabel(dueIso, now);
}

export const jt = (n: number) => `Rp${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
export const timeShort = (at: string) => `${formatDateShort(at)}, ${at.slice(11, 16)}`;

/** Teks "Apa yang terjadi" dari laporan pelapor (mock AI deterministik). */
export function whatHappened(i: Incident): string {
  const d = detailOf(i);
  const base = d.securityImpact || i.title;
  const k = base.indexOf('. ');
  const first = (k < 0 ? base.replace(/\.$/, '') : base.slice(0, k));
  const rest = k < 0 ? '' : ` ${base.slice(k + 2)}`;
  return `${first} pada ${formatWibFull(i.occurredAt)}.${rest}`;
}

export function closureFilled(i: Incident): { done: number; total: number } {
  const { done, total } = closureCompleteness(i);
  return { done, total };
}

export interface Mismatch { claim: string; followUp: string; status: string }
/** Klaim di Data penutupan yang tindak lanjutnya belum Selesai ("Belum cocok"). */
export function mismatches(i: Incident): Mismatch[] {
  const c = i.handling?.closure;
  const fu = i.handling?.followUps ?? [];
  return (c?.claims ?? []).flatMap((k) => {
    const f = fu.find((x) => x.title === k.followUpTitle);
    return f && f.status !== 'selesai' ? [{ claim: k.text, followUp: f.title, status: FU_LABEL[f.status] }] : [];
  });
}

export const FU_LABEL = { 'belum-dimulai': 'Belum dimulai', dikerjakan: 'Dikerjakan', selesai: 'Selesai', dibatalkan: 'Dibatalkan' } as const;
export const FU_TAG = { 'belum-dimulai': 't-muted', dikerjakan: 't-info', selesai: 't-ok', dibatalkan: 't-draft' } as const;

export interface StripItem { k: string; v: string; n: string; check?: boolean; title?: string }
/** Empat angka ringkas bahan pertimbangan: pulih, kerugian akhir, lama penanganan, tindak lanjut. */
export function strip(i: Incident, fus: FollowUp[] = []): StripItem[] {
  const c = i.handling?.closure;
  const d = detailOf(i);
  const out: StripItem[] = [];
  if (c?.aiRestoredAt) out.push({ k: 'Pompa menyala lagi', v: timeShort(c.aiRestoredAt), n: 'Perlu dicek', check: true, title: 'Diambil AI dari teks Data penutupan. Perlu dicek.' });
  if (c?.lossFinalIdr != null) {
    const est = d.lossIdr;
    const pct = est ? Math.round(((c.lossFinalIdr - est) / est) * 100) : null;
    out.push({ k: 'Kerugian akhir', v: jt(c.lossFinalIdr), n: pct == null ? 'Perkiraan pelapor belum diisi' : pct === 0 ? 'sama dengan perkiraan pelapor' : `${pct > 0 ? 'naik' : 'turun'} ${Math.abs(pct)}% dari perkiraan pelapor` });
  }
  out.push({ k: 'Lama penanganan', v: formatDuration(registeredAt(i), c?.requestedAt ?? registeredAt(i)), n: 'Sejak registrasi' });
  const open = openFollowUps(i, fus);
  const last = open.map((f) => f.dueAt).sort().at(-1);
  out.push({ k: 'Tindak lanjut', v: open.length ? `${open.length} berjalan` : 'Tidak ada', n: last ? `Sampai ${formatDateShort(last)}` : 'Belum ada tindak lanjut' });
  return out;
}

export type RwKind = 'catatan' | 'wa' | 'sys' | 'arahan' | 'esc' | 'esc-auto' | 'ubah';
export interface RwItem { at: string; kind: RwKind; bold: string; by?: string; body?: string; files?: string[]; ok?: boolean; tag?: string }

const split = (t: string): [string, string] => {
  const k = t.indexOf(': ');
  return k < 0 ? [t.replace(/\.$/, ''), ''] : [t.slice(0, k), t.slice(k + 2)];
};

function fromTimeline(e: TimelineEntry, i: Incident, files?: string[]): RwItem {
  const t = e.text;
  const base = { at: e.at, by: e.by, files };
  const [head, body] = split(t);
  if (t.startsWith('Mengajukan laporan')) return { ...base, kind: 'sys', bold: 'Diajukan' };
  if (t.startsWith('Menyetujui insiden')) {
    const due = i.handling?.dueDefaultAt ?? i.handleDueAt;
    return { ...base, kind: 'sys', ok: true, bold: 'Disetujui', body: `PIC ${t.match(/PIC penanganan: (.+?)\.$/)?.[1] ?? i.pic ?? '—'}${due ? ` · tenggat ${formatWibFull(due)}` : ''}` };
  }
  if (t.startsWith('Menggabungkan') || t.includes('digabung ke insiden ini')) return { ...base, kind: 'ubah', bold: 'Gabung', body: t };
  if (t.startsWith('Pesan ditautkan')) return { ...base, kind: 'wa', bold: 'Pesan ditautkan', body };
  if (t.startsWith('Penutupan diajukan')) return { ...base, kind: 'sys', ok: true, bold: 'Penutupan diajukan' };
  if (t.startsWith('Ditutup')) return { ...base, kind: 'sys', ok: true, bold: 'Ditutup', body };
  if (t.startsWith('Dikembalikan ke PIC')) return { ...base, kind: 'ubah', bold: head, body };
  if (t.startsWith('Mengganti PIC')) return { ...base, kind: 'ubah', bold: 'PIC diganti', body };
  if (t.startsWith('Mengubah tenggat')) return { ...base, kind: 'ubah', bold: 'Tenggat diubah', body };
  if (t.startsWith('Dibuka kembali')) return { ...base, kind: 'ubah', bold: 'Dibuka kembali', body };
  if (t.startsWith('Eskalasi otomatis')) return { ...base, kind: 'esc-auto', bold: head, body, tag: 'Eskalasi' };
  if (t.startsWith('Eskalasi')) return { ...base, kind: 'esc', bold: head, body, tag: 'Eskalasi' };
  if (t.startsWith('Arahan dijadikan')) return { ...base, kind: 'ubah', bold: 'Arahan dijadikan tindak lanjut', body };
  return { ...base, kind: 'ubah', bold: head, body };
}

/** Riwayat gabungan (timeline + catatan PIC + arahan SKK), terbaru di atas. "Penutupan diajukan" disembunyikan selama menunggu keputusan. */
export function riwayat(i: Incident): RwItem[] {
  const h = i.handling;
  const nf = h?.noteFiles ?? {};
  const items: RwItem[] = [
    ...(i.timeline ?? []).filter((e) => !(h?.directives.length && e.text.startsWith('Arahan SKK: '))).map((e) => fromTimeline(e, i, nf[e.at])),
    ...(h?.notes ?? []).map((n): RwItem => ({ at: n.at, kind: 'catatan', bold: 'Catatan', by: n.by, body: n.text, files: nf[n.at] })),
    ...(h?.directives ?? []).map((d): RwItem => ({ at: d.at, kind: 'arahan', bold: 'Arahan', by: `${d.by} · Pengawas SKK`, body: d.text, tag: 'Arahan SKK' })),
  ];
  return items
    .filter((x) => !(i.status === 'minta-ditutup' && x.bold === 'Penutupan diajukan'))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

export type AuditGroup = 'Status' | 'Klasifikasi' | 'PIC dan eskalasi' | 'Tenggat' | 'Akses';
export interface AuditRow { group: AuditGroup; icon: 'clock' | 'check' | 'tag' | 'person' | 'merge' | 'send' | 'lock' | 'up'; title: string; who: string; at: string; note?: string }

/** Jejak audit lengkap: setiap perubahan data dan akses dengan nilai lama dan baru (P34). */
export function auditRows(i: Incident): AuditRow[] {
  const rows: AuditRow[] = [];
  const sev = i.severity ? i.severity[0].toUpperCase() + i.severity.slice(1) : '—';
  for (const e of i.timeline ?? []) {
    const w = (extra = ''): string => `${e.by}${extra} · ${timeShort(e.at)}`;
    const t = e.text;
    if (t.startsWith('Mengajukan laporan')) rows.push({ group: 'Status', icon: 'send', title: 'Status: Draft → Menunggu pemeriksaan', who: w(), at: e.at });
    else if (t.startsWith('Menggabungkan')) rows.push({ group: 'Status', icon: 'merge', title: t.replace(/\. .*$/, '').replace('Menggabungkan', 'Gabung:').replace(' ke insiden ini', ' ke insiden ini'), who: w(), at: e.at, note: `Alasan: ${t.split('. ')[1]?.replace(/\.$/, '').toLowerCase() ?? ''}` });
    else if (t.startsWith('Menyetujui insiden')) {
      const pic = t.match(/PIC penanganan: (.+?)\.$/)?.[1] ?? i.pic ?? '—';
      const due = i.handling?.dueDefaultAt ?? i.handleDueAt;
      const at = e.at;
      if (due) rows.push({ group: 'Tenggat', icon: 'clock', title: `Tenggat: — → ${formatWibFull(due)}`, who: `Sistem · dari keparahan ${sev} · ${timeShort(at)}`, at: addMinutes(at, 4) });
      rows.push({ group: 'Status', icon: 'check', title: 'Status: Menunggu pemeriksaan → Dalam penanganan', who: w(), at: addMinutes(at, 3) });
      rows.push({ group: 'Klasifikasi', icon: 'tag', title: `Klasifikasi: ${i.category} · ${sev} · prioritas ${i.priority ? i.priority[0].toUpperCase() + i.priority.slice(1) : '—'}`, who: w(), at: addMinutes(at, 2) });
      rows.push({ group: 'PIC dan eskalasi', icon: 'person', title: `PIC: — → ${pic}`, who: w(), at: addMinutes(at, 1) });
    } else if (t.startsWith('Mengganti PIC')) rows.push({ group: 'PIC dan eskalasi', icon: 'person', title: t.split('. Alasan')[0].replace('Mengganti PIC', 'PIC'), who: w(), at: e.at, note: t.split('. Alasan: ')[1] ? `Alasan: ${t.split('. Alasan: ')[1]}` : undefined });
    else if (t.startsWith('Mengubah tenggat')) rows.push({ group: 'Tenggat', icon: 'clock', title: t.split('. Alasan')[0].replace('Mengubah tenggat', 'Tenggat'), who: w(), at: e.at, note: t.split('. Alasan: ')[1] ? `Alasan: ${t.split('. Alasan: ')[1]}` : undefined });
    else if (t.startsWith('Eskalasi')) rows.push({ group: 'PIC dan eskalasi', icon: 'up', title: split(t)[0], who: w(), at: e.at });
    else if (t.startsWith('Menandai insiden sebagai terbatas')) rows.push({ group: 'Akses', icon: 'lock', title: 'Akses: ditandai terbatas', who: w(), at: e.at });
    else if (t.startsWith('Penutupan diajukan')) rows.push({ group: 'Status', icon: 'check', title: 'Status: Dalam penanganan → Minta ditutup', who: w(), at: e.at });
    else if (t.startsWith('Ditutup')) rows.push({ group: 'Status', icon: 'check', title: 'Status: Minta ditutup → Ditutup', who: w(), at: e.at });
    else if (t.startsWith('Dikembalikan ke PIC')) rows.push({ group: 'Status', icon: 'check', title: 'Status: Minta ditutup → Dalam penanganan', who: w(), at: e.at, note: `Alasan: ${split(t)[1]}` });
    else if (t.startsWith('Dibuka kembali')) rows.push({ group: 'Status', icon: 'check', title: 'Status: Ditutup → Dalam penanganan', who: w(), at: e.at, note: `Alasan: ${split(t)[1]}` });
  }
  return rows.sort((a, b) => (a.at < b.at ? 1 : -1));
}

/** Insiden dengan penutup demo (`?state=`), untuk menampilkan state board tanpa data khusus di seed. */
export function withDemoState(i: Incident, state: string | null, now: string): Incident {
  if (state === 'tanpa-pic') {
    return { ...i, status: 'dalam-penanganan', pic: null, handling: { ...(i.handling ?? { notes: [], directives: [] }), picPrev: 'Rudi Hartono', picInactiveSince: '2026-10-29T00:00:00' } };
  }
  if (state === 'arahan' && !(i.handling?.directives.length)) {
    const h = i.handling ?? { notes: [], directives: [] };
    return {
      ...i, status: 'dalam-penanganan', escalated: true,
      handling: { ...h, escalatedTo: 'skk', directives: [{ at: '2026-10-30T10:05:00', by: 'Hendra Wijaya', text: 'Koordinasikan patroli gabungan dengan Polres Musi Banyuasin minggu ini. Laporkan hasilnya di riwayat.' }] },
      timeline: [...(i.timeline ?? []), { at: '2026-10-30T08:15:00', by: 'Andi Pratama', text: 'Eskalasi ke Hendra Wijaya: Butuh dukungan koordinasi dengan Polres untuk patroli gabungan.' }],
    };
  }
  if (state === 'lewat-tenggat') {
    const due = addMinutes(now, -2 * 1440);
    return {
      ...i, status: 'dalam-penanganan', escalated: true, late: true, handleDueAt: due,
      timeline: [...(i.timeline ?? []), { at: due, by: 'Sistem', text: `Eskalasi otomatis ke Sari Wulandari: Tenggat ${formatWibFull(due)} terlewat.` }],
    };
  }
  if (state === 'ditutup') {
    const h = i.handling ?? { notes: [], directives: [] };
    return { ...i, status: 'ditutup', handling: { ...h, closure: h.closure ? { ...h.closure, closedAt: now, closedBy: 'Sari Wulandari' } : h.closure } };
  }
  if (state === 'buka-lewat30') {
    const h = i.handling ?? { notes: [], directives: [] };
    const c = h.closure;
    return { ...i, status: 'ditutup', handling: { ...h, closure: c ? { ...c, closedAt: '2026-09-26T10:00:00' } : { partners: [], casualtiesFinal: {}, lossFinalIdr: null, opsHoursFinal: null, cause: '', actions: '', outcome: '', closedAt: '2026-09-26T10:00:00' } } };
  }
  return i;
}

/** Kontrak aktif di WK per mitra (data demo). */
export const CONTRACT_OPTIONS: Record<string, string[]> = {
  'PT Garda Nusantara Sejahtera': ['KTR-2026-0014', 'KTR-2025-0102'],
  'Polres Musi Banyuasin': ['PKS-2025-0031'],
};

export const partnerLabel = (i: Incident): string[] => {
  const c = i.handling?.closure;
  return c?.partnerNames?.length ? c.partnerNames : (c?.partners ?? []).map((p) => TIMS.find(([k]) => k === p)?.[1] ?? p);
};

export const reopenLimitText = (closedAt: string) => formatDate(addDaysIso(closedAt, 30));
export { formatWib };
