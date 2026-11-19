// Tugas saya dari modul Tindak lanjut (board T4, T4b): PIC TL mengerjakan, PIC insiden memeriksa.
import { demoNow } from '@/services/mock/clock';
import type { FollowUp, Incident } from '@/services/types';
import { DEMO_USERS, isSkk, type Role } from '@/lib/rbac';
import { ORG } from '@/services/mock/seed';
import { verifierOf } from '@/services/mock/workflow.followup';
import { formatDateShort } from '@/lib/format';
import type { Task } from '@/features/insiden/logic/list';
import { lowerFirst } from './followups';

const DAY = 86_400_000;

/** Tugas TL untuk peran ini. Hitungan sidebar/lonceng memakai daftar yang sama dengan halaman Tugas saya. */
export function followUpTasks(fus: FollowUp[], incidents: Incident[], role: Role): Task[] {
  const me = DEMO_USERS[role].name;
  const out: Task[] = [];
  for (const f of fus) {
    const inc = incidents.find((i) => i.no === f.incidentNo);
    const base = { no: f.no, title: f.action, module: 'Insiden', kkks: inc?.org ?? ORG, wk: inc?.wk ?? '', href: `/tindak-lanjut/${f.no}` };
    const batas = formatDateShort(f.dueAt);
    if (role === 'pic-tl' && f.pic === me && (f.status === 'berjalan' || f.status === 'belum-dimulai' || f.status === 'dikembalikan')) {
      const back = f.status === 'dikembalikan';
      const at = (back ? f.returnedAt : f.createdAt) ?? f.createdAt;
      out.push({
        ...base, kind: 'tl-kerjakan', at, cta: 'Kerjakan', st: back ? 'Dikembalikan' : 'Perlu dikerjakan', cls: back ? 't-caution' : 't-info',
        desc: back && f.returnReason ? `${f.no} · ${f.incidentNo || f.krwNo || 'Arahan SKK'} · ${lowerFirst(f.returnReason)}` : `${f.no} · ${f.incidentNo || f.krwNo || 'Arahan SKK'} · batas ${batas}`,
        from: `dari ${(back ? f.returnedBy : f.createdBy) ?? f.createdBy}`, old: back || new Date(demoNow()).getTime() - new Date(at).getTime() > DAY,
      });
    } else if (role !== 'pic-tl' && !isSkk(role) && f.status === 'menunggu-verifikasi' && verifierOf(f, inc) === me) {
      const at = f.submittedAt ?? f.createdAt;
      out.push({
        ...base, kind: 'tl-verifikasi', at, cta: 'Periksa', st: 'Menunggu pemeriksaan', cls: 't-caution',
        desc: `${f.no} · tindak lanjut ${f.incidentNo || f.krwNo || 'Arahan SKK'} · diajukan selesai · batas ${batas}`, from: `dari ${f.pic}`,
        old: new Date(demoNow()).getTime() - new Date(at).getTime() > DAY,
      });
    }
  }
  return out;
}
