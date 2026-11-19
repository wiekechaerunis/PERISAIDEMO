// Baris tambahan Data penutupan (INS-03 F-2): Operasi pulih, Hasil pengamanan, Proses hukum; dipakai P22, P24 (dengan Perbarui), P35 (hanya baca).
// ASSUMPTION: dialog Perbarui proses hukum belum ada di desain; memakai pola dialog Ubah tenggat (Select status + nomor LP + Simpan/Batal).
import { useState, type ReactNode } from 'react';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { formatWibFull } from '@/lib/format';
import { LEGAL_STATUS_LABEL, SECURITY_OUTCOME_LABEL, type Closure, type Incident, type LegalStatus } from '@/services/types';
import { MAX_LP, updateLegalProcess } from '@/services/mock/workflow.handling';
import { Modal } from '../review/ReviewDialogs';

const LEGALS = Object.keys(LEGAL_STATUS_LABEL) as LegalStatus[];

/** Tiga baris; `action` = tombol di samping Proses hukum (P24). */
export function ClosureExtraRows({ c, action }: { c: Closure; action?: ReactNode }) {
  const legal = c.legal;
  return (
    <>
      {c.restoredAt && (<><dt>Operasi pulih</dt><dd>{formatWibFull(c.restoredAt)}</dd></>)}
      <dt>Hasil pengamanan</dt>
      <dd>
        {c.result ? SECURITY_OUTCOME_LABEL[c.result] : '—'}
        {c.result === 'tidak-ada' && <div className="sub">Aksi tidak digagalkan, pelaku belum tertangkap.</div>}
      </dd>
      <dt>Proses hukum</dt>
      <dd>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {legal ? LEGAL_STATUS_LABEL[legal.status] : '—'}
            {legal?.lpNo && <> · <span className="p-mono" style={{ fontSize: 12 }}>{legal.lpNo}</span></>}
            {legal?.updatedAt && <div className="sub">diperbarui {formatWibFull(legal.updatedAt)} oleh {legal.updatedBy}</div>}
          </div>
          {action}
        </div>
        {action && <div className="sub">Bisa diperbarui tanpa membuka kembali insiden. Tercatat di Riwayat.</div>}
      </dd>
    </>
  );
}

/** Tombol + dialog Perbarui proses hukum untuk PIC insiden dan Pejabat Berwenang (tanpa batas waktu). */
export function UpdateLegalButton({ i }: { i: Incident }) {
  const role = useDemoStore((s) => s.role);
  const decide = useDemoStore((s) => s.decide);
  const me = DEMO_USERS[role].name;
  const c = i.handling?.closure;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<LegalStatus>(c?.legal?.status ?? 'tidak-diproses');
  const [lp, setLp] = useState(c?.legal?.lpNo ?? '');
  const [msg, setMsg] = useState<{ text: string; err?: boolean } | null>(null);
  const allowed = role === 'pejabat' || (role === 'pic' && i.pic === me);
  if (!allowed || !c) return null;
  const save = () => {
    const r = decide((s) => updateLegalProcess(s, i.no, me, { status, lpNo: lp }));
    if (r.ok) { setMsg({ text: 'Proses hukum diperbarui' }); setOpen(false); } else setMsg({ text: r.reason, err: true });
  };
  return (
    <>
      <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => { setStatus(c.legal?.status ?? 'tidak-diproses'); setLp(c.legal?.lpNo ?? ''); setOpen(true); }}>Perbarui proses hukum</button>
      {msg && <span className={msg.err ? 'p-help err' : 'p-cap'} role={msg.err ? 'alert' : 'status'}>{msg.text}</span>}
      {open && (
        <Modal
          title="Perbarui proses hukum" width={480} onClose={() => setOpen(false)}
          footer={<><button type="button" className="p-btn p-btn-secondary" onClick={() => setOpen(false)}>Batal</button><button type="button" className="p-btn p-btn-primary" onClick={save}>Simpan</button></>}
        >
          <span>Hanya status proses hukum dan nomor laporan polisi yang berubah. Status insiden tetap Ditutup.</span>
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Status</span>
            <select className="p-input" aria-label="Status proses hukum" value={status} onChange={(e) => setStatus(e.target.value as LegalStatus)}>
              {LEGALS.map((s) => <option key={s} value={s}>{LEGAL_STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          {status !== 'tidak-diproses' && (
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Nomor laporan polisi</span>
              <input className="p-input" aria-label="Nomor laporan polisi" maxLength={MAX_LP} value={lp} onChange={(e) => setLp(e.target.value)} />
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
