// Tampilan baca-saja SKK (Pengawas/Pimpinan) untuk insiden berjalan, paling dekat dengan board MP2; aksi tunggal: Beri arahan (board P32).
// Logika = SkkIncidentPage desktop: giveDirective (teks wajib, maks 1.000), status/PIC/tenggat tidak berubah.
import { useState } from 'react';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import type { Incident } from '@/services/types';
import { MAX_DIRECTIVE, MSG_DIRECTIVE_EMPTY, TOAST_DIRECTIVE, giveDirective } from '@/services/mock/workflow.skk';
import { Ic } from '@/features/insiden/components/review/parts';
import { dueBadge } from '@/features/insiden/logic/handling';
import { MobileShell } from '../ui/MobileShell';
import { IncHead, KejadianSec, LampiranSec, P, PtStrip, RiwayatSec, Sheet, SheetTitle, TimesSec, ToastLine, WARN_ERR, type ToastM } from './parts';

export function SkkView({ i }: { i: Incident }) {
  const role = useDemoStore((s) => s.role);
  const decide = useDemoStore((s) => s.decide);
  const by = DEMO_USERS[role].name;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const [toast, setToast] = useState<ToastM | null>(null);
  const running = i.status === 'dalam-penanganan' || i.status === 'minta-ditutup';
  const badge = i.handleDueAt ? dueBadge(i.handleDueAt) : null;

  const send = () => {
    if (!text.trim()) return setError(MSG_DIRECTIVE_EMPTY);
    const r = decide((s) => giveDirective(s, i.no, by, text));
    if (!r.ok) return setError(r.reason);
    setOpen(false);
    setText('');
    setError(undefined);
    setToast({ text: TOAST_DIRECTIVE });
  };
  const close = () => { setOpen(false); setError(undefined); };

  return (
    <MobileShell
      title="Detail insiden" backTo="/insiden" bodyStyle={{ paddingBottom: running ? 96 : undefined }}
      footer={running ? <button type="button" className="p-btn p-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOpen(true)}><Ic d={P.up} size={16} />Beri arahan</button> : undefined}
      overlay={
        <>
          {open && (
            <Sheet labelId="sh-t" onClose={close} footer={<><button type="button" className="p-btn p-btn-primary" onClick={send}>Kirim arahan</button><button type="button" className="p-btn p-btn-secondary" onClick={close}>Batal</button></>}>
              <SheetTitle id="sh-t" icon={P.up} bg="--status-info-bg" ink="--status-info-ink">Beri arahan</SheetTitle>
              <span>Arahan masuk ke riwayat. PIC dan Pejabat Berwenang diberi tahu. Tidak mengubah status, PIC, atau tenggat.</span>
              <div className="p-field">
                <label htmlFor="arahan-teks" className="p-lbl" style={{ color: 'var(--ink)' }}>Arahan<span className="p-req">*</span></label>
                <textarea id="arahan-teks" className={'p-input p-area' + (error ? ' err' : '')} style={{ minHeight: 88, alignItems: 'flex-start' }} maxLength={MAX_DIRECTIVE}
                  value={text} aria-invalid={!!error} onChange={(e) => { setText(e.target.value); setError(undefined); }} />
                {error && WARN_ERR(error)}
              </div>
            </Sheet>
          )}
          <ToastLine toast={toast} onClose={() => setToast(null)} />
        </>
      }
    >
      <IncHead i={i} />
      <PtStrip i={i} dueCls={badge?.cls} dueText={badge?.text} />
      <TimesSec i={i} />
      <KejadianSec i={i} partners={i.status !== 'dalam-penanganan'} />
      <LampiranSec i={i} />
      <RiwayatSec i={i} due={i.handleDueAt} />
    </MobileShell>
  );
}
