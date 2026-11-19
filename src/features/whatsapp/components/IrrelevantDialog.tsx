// Dialog "Tandai pesan ini tidak relevan?" (V2-13): alasan (chip) + keterangan; Lainnya wajib keterangan. Bisa untuk beberapa pesan sekaligus (V2-05).
import { useState } from 'react';
import { DEMO_USERS } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import type { WaMessage } from '@/services/types';
import { IRRELEVANT_REASONS, MAX_IRRELEVANT_NOTE, markIrrelevant } from '@/services/mock/workflow.wamon';
import { V2Dialog } from './monitor/nomor/V2Dialog';

export function IrrelevantDialog({ messages, onClose, onDone }: { messages: WaMessage[]; onClose: () => void; onDone?: (done: number, errors: string[]) => void }) {
  const role = useDemoStore((s) => s.role);
  const me = DEMO_USERS[role].name;
  const [reason, setReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const save = () => {
    const errors: string[] = [];
    let done = 0;
    for (const m of messages) {
      let e: string | null = null;
      useDemoStore.getState().updateWaMon((s) => {
        const r = markIrrelevant(s, m.id, me, reason, note);
        if (!r.ok) { e = r.reason; return {}; }
        return r.state;
      });
      if (e) errors.push(e); else done++;
    }
    if (done === 0 && errors.length) { setErr(errors[0]); return; }
    onDone?.(done, errors);
    onClose();
  };
  const many = messages.length > 1;
  return (
    <V2Dialog
      title={many ? `Tandai ${messages.length} pesan ini tidak relevan?` : 'Tandai pesan ini tidak relevan?'} labelId="wa-dismiss" onClose={onClose}
      footer={<><button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={onClose}>Batal</button><button type="button" className="pr-btn pr-btn--primary pr-btn--md" onClick={save}>Tandai tidak relevan</button></>}
    >
      <span>Pesan pindah ke Tidak relevan dan tidak tampil di daftar utama. Anda dapat membukanya kembali dari tampilan Tidak relevan.</span>
      <div className="pr-field">
        <span className="pr-label" id="wa-dismiss-reason">Alasan<span aria-hidden="true" className="pr-req">*</span></span>
        <div className="pr-chipset" role="group" aria-labelledby="wa-dismiss-reason">
          {IRRELEVANT_REASONS.map((r) => (
            <button key={r} type="button" className="pr-chip-opt" aria-pressed={reason === r} onClick={() => setReason(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div className="pr-field">
        <label htmlFor="wa-dismiss-note" className="pr-label">Keterangan{reason === 'Lainnya' && <span aria-hidden="true" className="pr-req">*</span>}</label>
        <textarea id="wa-dismiss-note" aria-invalid={!!err} className="pr-input" rows={3} maxLength={MAX_IRRELEVANT_NOTE} placeholder={reason === 'Lainnya' ? 'Wajib untuk alasan Lainnya' : 'Opsional'} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {err && <span className="pr-help" role="alert" style={{ color: 'var(--error-ink)' }}>{err}</span>}
    </V2Dialog>
  );
}
