// Board: CFG-Tenggat (lihat / diubah / disimpan). `?state=diubah|disimpan` menampilkan varian board.
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { SEV_LABEL, SEV_TAG_CLS, SEVERITIES, type Severity } from '@/lib/severity';
import { handlingDeadline } from '@/lib/deadline';
import { formatDateShort, formatWibFull } from '@/lib/format';
import { KRW_NOW } from '@/services/mock/workflow.kerawanan';
import { CFG_NOW, parseWhole, updateDeadlines, type DeadlineInput } from '@/services/mock/workflow.config';
import { AdminGate, CfgToast, ChildShell, useCfgToast } from '../components/ConfigShell';
import { Ic, P_CHECK } from '../components/Ic';
import { NumField } from '../components/Field';
import { tenggatHistory } from '../logic/levels';

type Draft = Record<Severity, string>;
const ORDER: Severity[] = ['kritis', 'tinggi', 'sedang', 'rendah', 'sangat-rendah'];

/** "18 Nov, 10:42" */
const shortStamp = (iso: string) => `${formatDateShort(iso)}, ${iso.slice(11, 16)}`;

export function TenggatPage() {
  const [params] = useSearchParams();
  const raw = params.get('state');
  const variant = raw === 'diubah' || raw === 'disimpan' ? raw : null;
  return (
    <AdminGate>
      <TenggatBody key={variant ?? ''} variant={variant} />
    </AdminGate>
  );
}

function TenggatBody({ variant }: { variant: 'diubah' | 'disimpan' | null }) {
  const config = useDemoStore((s) => s.config);
  const role = useDemoStore((s) => s.role);
  const applyConfig = useDemoStore((s) => s.applyConfig);
  const me = DEMO_USERS[role];
  const hist = tenggatHistory(config);
  const saved: Draft = { ...config.deadlines } as unknown as Draft;
  const [draft, setDraft] = useState<Draft>(() => {
    const d = Object.fromEntries(SEVERITIES.map((s) => [s, String(config.deadlines[s])])) as Draft;
    return variant ? { ...d, kritis: '2' } : d;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useCfgToast();

  const doSave = (d: Draft) => {
    const r = applyConfig((c) => updateDeadlines(c, d as DeadlineInput, { name: me.name, role, roleLabel: me.roleLabel }, CFG_NOW));
    if (r.ok) {
      setErrors({});
      setToast('Tenggat disimpan. Berlaku untuk insiden baru.');
    } else {
      setErrors(r.errors);
    }
  };
  // Varian "disimpan" memperagakan hasil simpan Kritis 1 → 2 lewat jalur yang sama dengan tombol Simpan.
  const auto = useRef(false);
  useEffect(() => {
    if (variant !== 'disimpan' || auto.current) return;
    auto.current = true;
    if (useDemoStore.getState().config.deadlines.kritis !== 2) doSave({ ...draft });
    else setToast('Tenggat disimpan. Berlaku untuk insiden baru.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const same = (s: Severity) => draft[s].trim() === String(saved[s]);
  const changed = SEVERITIES.filter((s) => !same(s));
  const dirty = changed.length > 0;
  const days = (s: Severity) => parseWhole(draft[s]) ?? config.deadlines[s];
  const preview = (s: Severity) =>
    `Registrasi ${shortStamp(KRW_NOW)} → ${shortStamp(handlingDeadline(KRW_NOW, s, { ...config.deadlines, [s]: days(s) }))}`;
  const last = hist[0];

  return (
    <ChildShell
      title="Tenggat penanganan"
      ai
      mainStyle={{ paddingBottom: 0 }}
      outside={<CfgToast msg={toast} bottom={88} />}
    >
      <div className="lk-stack">
        <section className="p-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="lk-card-head" style={{ padding: '16px 20px', margin: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <h2 className="p-h2">Tenggat per keparahan</h2>
              <span className="p-cap">Hari kerja sejak registrasi, mengikuti kalender kerja (WIB) dan PTK 049.</span>
            </div>
          </div>
          <table className="p-table lk-tbl" style={{ width: '100%' }}>
            <thead>
              <tr><th style={{ paddingLeft: 20 }}>Keparahan</th><th>Tenggat (hari)</th><th style={{ paddingRight: 20 }}>Contoh</th></tr>
            </thead>
            <tbody>
              {ORDER.map((s) => (
                <tr key={s}>
                  <td style={{ paddingLeft: 20 }}><span className={`p-tag ${SEV_TAG_CLS[s]}`}><span className="dot"></span>{SEV_LABEL[s]}</span></td>
                  <td>
                    <NumField
                      label={`Tenggat ${SEV_LABEL[s]} (hari)`} value={draft[s]} width={120} err={errors[s]}
                      onChange={(v) => { setDraft({ ...draft, [s]: v }); setErrors({}); }}
                    />
                    {!same(s) && !errors[s] && <span className="p-cap" style={{ display: 'block', marginTop: 4 }}>sebelumnya {saved[s]}</span>}
                  </td>
                  <td style={{ paddingRight: 20 }}><span className="p-cap">{preview(s)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
            <span className="p-cap">Berlaku untuk insiden baru. Pejabat Berwenang bisa mengubah tenggat saat menyetujui.</span>
          </div>
        </section>
        <section className="p-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="p-h2">Riwayat perubahan</h2>
          <ol className="lk-tl">
            {hist.map((h, i) => (
              <li key={i}><b>{h.text}</b> oleh {h.by}{h.role ? `, ${h.role}` : ''}<br />{formatWibFull(h.at)}</li>
            ))}
          </ol>
        </section>
      </div>
      <div className="lk-ffoot" role="region" aria-label="Aksi formulir" style={{ margin: '16px -24px 0' }}>
        <span className="p-cap">
          {dirty
            ? `${changed.length} perubahan belum disimpan`
            : last ? `Terakhir diubah ${last.by} · ${formatWibFull(last.at)}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button" className="p-btn p-btn-secondary"
            onClick={() => { setDraft(Object.fromEntries(SEVERITIES.map((s) => [s, String(saved[s])])) as Draft); setErrors({}); }}
          >Batal</button>
          {dirty ? (
            <button type="button" className="p-btn p-btn-primary" onClick={() => doSave(draft)}>
              <Ic d={P_CHECK} />Simpan
            </button>
          ) : (
            <button type="button" className="p-btn p-btn-primary" disabled style={{ opacity: 0.45 }}>
              <Ic d={P_CHECK} />Simpan
            </button>
          )}
        </div>
      </div>
    </ChildShell>
  );
}
