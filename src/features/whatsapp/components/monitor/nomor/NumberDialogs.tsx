// Dialog Ubah label (V2-23), Putuskan nomor (V2-23b), Tangguhkan, dan teks persetujuan (V2-24).
import { useId, useState } from 'react';
import type { WaNumber } from '@/services/types';
import { releaseNumber, renameNumber, suspendNumber } from '@/services/mock/workflow.wamon';
import { formatWibFull } from '@/lib/format';
import { run } from '../shared';
import { Ic, P } from './icons';
import { RiskText } from './RiskText';
import { V2Dialog } from './V2Dialog';
import { maskPhone } from './util';

const btn = (kind: 'primary' | 'secondary' | 'destructive') => `pr-btn pr-btn--${kind} pr-btn--md`;

export function RenameDialog({ n, onClose }: { n: WaNumber; onClose: () => void }) {
  const uid = useId();
  const [label, setLabel] = useState(n.label);
  const [err, setErr] = useState('');
  const save = () => { const e = run((s) => renameNumber(s, n.id, label)); if (e) setErr(e); else onClose(); };
  return (
    <V2Dialog
      title="Ubah label nomor" subtitle={<span className="wa-num">{maskPhone(n.phone)}</span>} onClose={onClose} labelId={`${uid}-t`}
      footer={<><button type="button" className={btn('secondary')} onClick={onClose}>Batal</button><button type="button" className={btn('primary')} onClick={save}>Simpan label</button></>}
    >
      <div className="pr-field">
        <label htmlFor={`${uid}-l`} className="pr-label">Label nomor<span aria-hidden="true" className="pr-req">*</span></label>
        <input id={`${uid}-l`} aria-invalid={err ? 'true' : 'false'} aria-describedby={`${uid}-h`} className="pr-input" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} />
        <p id={`${uid}-h`} className="pr-help">Nama yang dikenali tim Anda, misalnya lokasi posko.</p>
        {err && <p className="pr-help nomor-err-text" role="alert">{err}</p>}
      </div>
    </V2Dialog>
  );
}

/** Putuskan (melepas nomor) dan Tangguhkan memakai kerangka yang sama: alasan wajib. */
export function ReasonDialog({ n, kind, groups, onClose }: { n: WaNumber; kind: 'putuskan' | 'tangguhkan'; groups: number; onClose: () => void }) {
  const uid = useId();
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const off = kind === 'putuskan';
  const confirm = () => {
    const e = run((s) => (off ? releaseNumber(s, n.id, reason) : suspendNumber(s, n.id, reason)));
    if (e) setErr(e); else onClose();
  };
  return (
    <V2Dialog
      title={`${off ? 'Putuskan' : 'Tangguhkan'} ${n.label}?`} onClose={onClose} labelId={`${uid}-t`}
      footer={<><button type="button" data-autofocus="true" className={btn('secondary')} onClick={onClose}>Batal</button><button type="button" className={btn(off ? 'destructive' : 'primary')} onClick={confirm}>{off ? 'Putuskan nomor' : 'Tangguhkan'}</button></>}
    >
      <div className="flex flex-col gap-3">
        <span>{off
          ? `PERISAI keluar dari WhatsApp di HP ini dan berhenti memantau ${groups} grup. Untuk memantau lagi, nomor harus ditautkan ulang.`
          : `PERISAI berhenti menangkap pesan dari ${groups} grup di nomor ini sampai Anda melanjutkannya.`}</span>
        <dl className="pr-summary">
          <div className="contents"><dt>Nomor</dt><dd><span className="wa-num !text-ink">{maskPhone(n.phone)}</span></dd></div>
          <div className="contents"><dt>Pesan tersimpan</dt><dd>Tetap ada sampai masa simpannya berakhir</dd></div>
        </dl>
        <div className="pr-field">
          <label htmlFor={`${uid}-r`} className="pr-label">Alasan<span aria-hidden="true" className="pr-req">*</span></label>
          <input id={`${uid}-r`} aria-invalid={err ? 'true' : 'false'} className="pr-input" maxLength={200} placeholder={off ? 'Nomor diganti dengan SIM baru' : 'Ponsel sedang diperbaiki'} value={reason} onChange={(e) => setReason(e.target.value)} />
          {err && <p className="pr-help nomor-err-text" role="alert">{err}</p>}
        </div>
      </div>
    </V2Dialog>
  );
}

export function TermsReadDialog({ at, onClose }: { at: string; onClose: () => void }) {
  return (
    <V2Dialog
      size="lg" title="Ketentuan pemakaian WhatsApp" labelId="wa-risk-read" onClose={onClose}
      subtitle="Hal yang perlu diketahui tim Anda saat memantau grup lewat WhatsApp. Bisa dibuka lagi kapan saja."
      note={<><Ic d={P.info} size={14} />Anda menyetujui teks ini pada {formatWibFull(at)}</>}
      footer={<button type="button" className={btn('secondary')} onClick={onClose}>Tutup</button>}
    >
      <RiskText />
    </V2Dialog>
  );
}
