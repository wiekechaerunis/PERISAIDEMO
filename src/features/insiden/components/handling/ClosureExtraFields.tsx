// Tiga isian tambahan Data penutupan (INS-03 Tabel F-2): F1 Waktu operasi pulih, F2 Hasil pengamanan (wajib), F3 Proses hukum.
// Dipakai form desktop (P14, P16) dan mobile (MP3); `stack` menumpuk Status dan Nomor LP di layar sempit.
import type { ReactNode } from 'react';
import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';
import { demoNow } from '@/services/mock/clock';
import { restoredAtError, MAX_LP } from '@/services/mock/workflow.handling';
import { LEGAL_STATUS_LABEL, SECURITY_OUTCOME_LABEL, type Closure, type LegalStatus, type SecurityOutcome } from '@/services/types';

const OUTCOMES = Object.keys(SECURITY_OUTCOME_LABEL) as SecurityOutcome[];
const LEGALS = Object.keys(LEGAL_STATUS_LABEL) as LegalStatus[];

const Field = ({ label, optional, required, error, help, children }: { label: string; optional?: boolean; required?: boolean; error?: string; help?: ReactNode; children: ReactNode }) => (
  <div className="p-field">
    <span className="p-lbl" style={{ color: 'var(--ink)' }}>
      {label}
      {optional ? <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}> · opsional</span> : required ? <span className="p-req">*</span> : null}
    </span>
    {children}
    {error && <span className="p-help err" role="alert">{error}</span>}
    {help && <span className="p-help">{help}</span>}
  </div>
);

interface Props {
  form: Closure;
  onChange: (patch: Partial<Closure>) => void;
  /** kondisi operasi menurut laporan bukan "Tidak terganggu" */
  opsReported: boolean;
  occurredAt: string;
  /** tampilkan galat wajib (Hasil pengamanan) */
  showErrors?: boolean;
  stack?: boolean;
}

export function ClosureExtraFields({ form, onChange, opsReported, occurredAt, showErrors, stack }: Props) {
  const now = demoNow();
  const [rd, rt] = (form.restoredAt ?? '').split('T');
  const setRestored = (d: string, t: string) => onChange({ restoredAt: d ? `${d}T${t || '00:00'}` : undefined });
  const err = restoredAtError(form.restoredAt, occurredAt, now);
  const legal = form.legal;
  const setLegal = (patch: Partial<NonNullable<Closure['legal']>>) => onChange({ legal: { status: 'tidak-diproses', ...legal, ...patch } });

  return (
    <>
      {opsReported && (
        <Field label="Waktu operasi pulih" optional error={err ?? undefined} help="Tampil karena operasi berhenti menurut laporan. Bila diisi, ringkasan penutupan memakai nilai ini.">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <DateField label="Tanggal operasi pulih" value={rd ?? ''} onChange={(v) => setRestored(v, rt ?? '')} min={occurredAt.slice(0, 10)} max={now.slice(0, 10)} invalid={!!err} style={{ flex: 1 }} />
            <TimeField label="Jam operasi pulih" value={rt ?? ''} onChange={(v) => setRestored(rd ?? now.slice(0, 10), v)} invalid={!!err} style={{ width: 96 }} />
            <span className="p-cap">WIB</span>
          </div>
        </Field>
      )}

      <Field
        label="Hasil pengamanan" required help="Pilih satu. Tidak ada: aksi tidak digagalkan dan pelaku belum tertangkap."
        error={showErrors && !form.result ? 'Lengkapi Hasil pengamanan sebelum menutup insiden.' : undefined}
      >
        <div className="in-chips" role="radiogroup" aria-label="Hasil pengamanan">
          {OUTCOMES.map((o) => (
            <button key={o} type="button" role="radio" aria-checked={form.result === o} className="p-chip" aria-pressed={form.result === o} onClick={() => onChange({ result: o })}>
              {SECURITY_OUTCOME_LABEL[o]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Proses hukum" optional help="Proses yang masih berjalan tidak menghalangi penutupan. Statusnya bisa diperbarui setelah insiden ditutup.">
        <div style={{ display: 'grid', gridTemplateColumns: stack ? '1fr' : '1fr 1fr', gap: 8 }}>
          <label className="p-field" style={{ gap: 4 }}>
            <span className="p-cap">Status</span>
            <select className="p-input" aria-label="Status proses hukum" value={legal?.status ?? ''} onChange={(e) => setLegal({ status: (e.target.value || 'tidak-diproses') as LegalStatus })}>
              <option value="">Pilih status</option>
              {LEGALS.map((s) => <option key={s} value={s}>{LEGAL_STATUS_LABEL[s]}</option>)}
            </select>
          </label>
          {legal && legal.status !== 'tidak-diproses' && (
            <label className="p-field" style={{ gap: 4 }}>
              <span className="p-cap">Nomor laporan polisi</span>
              <input className="p-input" aria-label="Nomor laporan polisi" maxLength={MAX_LP} value={legal.lpNo ?? ''} onChange={(e) => setLegal({ lpNo: e.target.value })} />
            </label>
          )}
        </div>
      </Field>
    </>
  );
}
