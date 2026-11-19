// Board MP4-Eskalasi: sheet Eskalasi insiden. Perilaku sama dengan EscalateDialog desktop (alasan wajib) lewat `escalate` di workflow.handling.
import { useState } from 'react';
import { MAX_ESCALATION_REASON } from '@/services/mock/workflow.handling';
import { ESC_TARGETS } from '@/features/insiden/logic/handling';
import { Ic } from '@/features/insiden/components/review/parts';
import { P, Sheet, SheetTitle, WARN_ERR } from './parts';

type To = 'pejabat' | 'skk';
const OPTS: [To, string, string][] = [
  ['pejabat', 'Pejabat Berwenang lain', 'Di PT Samudra Energi Nusantara.'],
  ['skk', 'Pengawas SKK Migas', 'Diberi tahu dan boleh memberi arahan.'],
];

export function EscalateSheet({ onClose, onConfirm }: { onClose: () => void; onConfirm: (a: { to: To; name: string; reason: string }) => string | null }) {
  const [to, setTo] = useState<To>('pejabat');
  const [name, setName] = useState(ESC_TARGETS.pejabat[0]);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const submit = () => {
    if (!reason.trim()) return setErr('Isi alasan eskalasi.');
    setErr(onConfirm({ to, name, reason }));
  };
  return (
    <Sheet
      labelId="sh-t" onClose={onClose}
      footer={<><button type="button" className="p-btn p-btn-primary" onClick={submit}>Eskalasi</button><button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Batal</button></>}
    >
      <SheetTitle id="sh-t" icon={P.up} bg="--caution-bg" ink="--caution-ink">Eskalasi insiden</SheetTitle>
      {OPTS.map(([k, t, d]) => (
        <button key={k} type="button" className="jn" role="radio" aria-checked={to === k} style={{ width: '100%' }}
          onClick={() => { setTo(k); setName(ESC_TARGETS[k][0]); }}>
          <span className="tx"><b>{t}</b><span className="p-cap">{d}</span></span>
        </button>
      ))}
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Nama<span className="p-req">*</span></span>
        <span className="p-input">
          <select aria-label="Nama penerima" value={name} onChange={(e) => setName(e.target.value)}
            style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', appearance: 'none' }}>
            {ESC_TARGETS[to].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <Ic d={P.chevDown} size={16} />
        </span>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan<span className="p-req">*</span></span>
        <textarea className={'p-input p-area' + (err ? ' err' : '')} aria-label="Alasan" maxLength={MAX_ESCALATION_REASON} style={{ minHeight: 72, alignItems: 'flex-start' }}
          value={reason} onChange={(e) => { setReason(e.target.value); setErr(null); }} />
        {err && WARN_ERR(err)}
      </div>
    </Sheet>
  );
}
