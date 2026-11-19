// Aturan murni layar detail Kerawanan (board KD1–KD6): siapa boleh apa, isian awal formulir Naikkan/Ajukan, rincian saran keparahan.
import type { Kerawanan, ModuleConfig } from '@/services/types';
import { RAISE_DEFAULTS } from '@/services/mock/seedExtra';
import { PIC_GROUPS, PIC_PEOPLE } from '@/services/mock/workflow';
import { suggestRaiseSeverity, type ImpactForm, type RaiseInput, type SubmitInput } from '@/services/mock/workflow.kerawanan';
import { DEMO_USERS, type Role } from '@/lib/rbac';
import type { Severity } from '@/lib/severity';
import { KAT, KB } from '../components/step2Data';

/** Hanya Pejabat Berwenang KKKS yang menaikkan (KF1). */
export const canRaise = (role: Role) => role === 'pejabat';
/** Pelapor dan pengguna KKKS lain di WK yang sama (bukan Pejabat) mengajukan. ASSUMPTION: semua pengguna KKKS demo satu WK. */
export const canSubmit = (role: Role) => DEMO_USERS[role].org === 'kkks' && role !== 'pejabat';
/** Tambah perkembangan: pelapor, pengguna KKKS di WK yang sama, dan Pejabat. */
export const canAddProgress = (role: Role) => DEMO_USERS[role].org === 'kkks';

export interface RaiseForm extends ImpactForm {
  category: string | null;
  securityImpact: string;
  /** level yang dipilih manual (dipakai bila `sevManual`) */
  severity: Severity;
  sevManual: boolean;
  severityReason: string;
  reason: string;
  picKind: 'perorangan' | 'grup';
  person: string;
  group: string;
  title: string;
}

/** Isian awal: kategori dari kerawanan; untuk kasus kanonik (KRW-0047) dampak, kerugian, dan alasan terisi seperti board KD3/KD5. */
export function initialRaiseForm(k: Kerawanan, cfg: ModuleConfig): RaiseForm {
  const d = RAISE_DEFAULTS[k.no];
  const known = KAT.some((x) => x[1] === k.category);
  const f: RaiseForm = {
    category: known ? k.category : null, securityImpact: d?.securityImpact ?? '', axes: d ? ['prop'] : [], ops: d ? 'tidak' : null, opsHours: null,
    ongoing: false, lossIdr: d?.lossIdr ?? null, casualties: {}, envNote: 'Setempat', dataNote: 'Data terbatas', severity: 'rendah', sevManual: false,
    severityReason: '', reason: d?.reason ?? '', picKind: 'perorangan', person: PIC_PEOPLE[0].name, group: PIC_GROUPS[0].name, title: d?.title ?? k.title,
  };
  return { ...f, severity: suggestRaiseSeverity(f, cfg) };
}

export const levelOf = (f: RaiseForm, cfg: ModuleConfig): { suggested: Severity; level: Severity } => {
  const suggested = suggestRaiseSeverity(f, cfg);
  return { suggested, level: f.sevManual ? f.severity : suggested };
};

/** "Dari dampak: …" (renderVals KD3). */
export function severityParts(f: RaiseForm): string[] {
  const parts: string[] = [];
  if (f.axes.includes('prop')) {
    if (f.ops === 'berhenti') parts.push(`operasi berhenti ${f.opsHours ?? 2} jam`);
    else if (f.ops === 'sebagian') parts.push('operasi terganggu sebagian');
    else parts.push('kerugian properti, operasi tidak terganggu');
  }
  if (f.axes.includes('man')) KB.filter((x) => x[0] in f.casualties).forEach((x) => parts.push(x[3]));
  if (f.axes.includes('ling')) parts.push(`sebaran ${f.envNote.toLowerCase()}`);
  if (f.axes.includes('data')) parts.push(`${f.dataNote.toLowerCase()} bocor`);
  return parts;
}

export const picOf = (f: RaiseForm) => (f.picKind === 'grup' ? f.group : f.person);

/** Isian formulir → masukan fungsi workflow (kategori sudah divalidasi saat dikirim). */
export function toSubmitInput(f: RaiseForm, by: string, cfg: ModuleConfig): SubmitInput {
  const { level } = levelOf(f, cfg);
  return {
    by, category: f.category ?? '', securityImpact: f.securityImpact, axes: f.axes, ops: f.ops, opsHours: f.opsHours, ongoing: f.ongoing,
    lossIdr: f.lossIdr, casualties: f.casualties, envNote: f.envNote, dataNote: f.dataNote, severity: level, severityReason: f.severityReason,
    reason: f.reason, title: f.title,
  };
}
export const toRaiseInput = (f: RaiseForm, by: string, cfg: ModuleConfig): RaiseInput => ({
  ...toSubmitInput(f, by, cfg), picKind: f.picKind, pic: picOf(f),
});
