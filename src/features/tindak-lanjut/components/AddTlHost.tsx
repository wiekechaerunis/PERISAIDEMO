// Menghubungkan dialog T1/T1b ke store: dibuka dari halaman PIC (`?tl=baru|saran`) atau rute /tindak-lanjut/baru.
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Incident } from '@/services/types';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { addFollowUp } from '@/services/mock/workflow.followup';
import { respondStep } from '@/services/mock/workflow.handling';
import { PEJABAT_NAME } from '@/features/insiden/logic/handling';
import { AddFollowUpDialog, type AddValues } from './AddFollowUpDialog';

interface Props {
  incident: Incident;
  /** 'saran' = Jadikan tindak lanjut dari saran pemeriksa (T1b); selain itu Tambah (T1) */
  dari: string | null;
  langkah: string | null;
  /** dibuka dari rute /tindak-lanjut/baru (menutup = kembali ke Tangani) */
  fromRoute?: boolean;
}

export function AddTlHost({ incident: i, dari, langkah, fromRoute }: Props) {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const role = useDemoStore((s) => s.role);
  const decide = useDemoStore((s) => s.decide);
  const me = DEMO_USERS[role].name;
  const saran = dari === 'saran' ? { text: langkah ?? '', by: PEJABAT_NAME } : undefined;

  const close = () => {
    if (fromRoute) return navigate(`/insiden/${i.no}/tangani`);
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.delete('tl');
      n.delete('langkah');
      return n;
    }, { replace: true });
  };
  const save = (v: AddValues): string | null => {
    const r = decide((s) => addFollowUp(s, { incidentNo: i.no, action: v.action, pic: v.pic, dueDate: v.dueDate, expectedEvidence: v.expectedEvidence, source: v.source, sourceLabel: v.sourceLabel, by: me }));
    if (!r.ok) return r.reason;
    if (saran && langkah) decide((s) => respondStep(s, i.no, langkah, 'done'));
    const no = useDemoStore.getState().followUps[0]?.no ?? '';
    navigate(`/insiden/${i.no}`, { replace: true, state: { toast: `Tindak lanjut ${no} dibuat. ${v.pic} diberi tahu.` } });
    return null;
  };
  return <AddFollowUpDialog incident={i} saran={saran} onClose={close} onSave={save} />;
}
