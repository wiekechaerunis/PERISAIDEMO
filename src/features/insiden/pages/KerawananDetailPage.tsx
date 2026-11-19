// Board: KD1 (detail kerawanan), KD2 (pilih), KD3 (dampak, Pejabat), KD4 (sudah dinaikkan), KD5 (Ajukan, Pelapor), KD6 (Tambah perkembangan),
// KF1 (alur). Rute: /kerawanan/:no. Query demo: ?langkah=naikkan|ajukan membuka formulir langsung.
// Keputusan PM 18 Nov: kerawanan tercatat tanpa pemeriksaan; Naikkan jadi insiden = Pejabat, langsung disetujui + PIC, satu catatan.
import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DEMO_USERS } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import { addProgress, raiseToIncident, resolveKerawanan, submitAsIncident } from '@/services/mock/workflow.kerawanan';
import { useDraftStore } from '../logic/draft';
import { canAddProgress, canRaise, canSubmit, initialRaiseForm, picOf, toRaiseInput, toSubmitInput, type RaiseForm } from '../logic/kerawanan';
import { nextNumber } from '../logic/submit';
import { KerawananBody } from '../components/kerawanan/KerawananBody';
import { ProgressDialog, RaiseDialog, type RaisePick } from '../components/kerawanan/KerawananDialogs';
import { KerawananShell } from '../components/kerawanan/KerawananShell';
import { RaiseFormView } from '../components/kerawanan/RaiseForm';
import { RaisedView } from '../components/kerawanan/RaisedView';
import { RvToast } from '../components/review/parts';

type Step = 'detail' | 'naikkan' | 'ajukan';
type Dialog = null | 'pilih' | 'progres';
interface Note { text: string; error?: boolean }

export function KerawananDetailPage() {
  const { no = '' } = useParams();
  const [sp] = useSearchParams();
  const role = useDemoStore((s) => s.role);
  const raw = useDemoStore((s) => s.kerawanan.find((k) => k.no === no));
  const incidents = useDemoStore((s) => s.incidents);
  const cfg = useDemoStore((s) => s.config);
  const state = useLocation().state as { toast?: string } | null;
  const [toast, setToast] = useState<string | null>(state?.toast ?? null);
  const closeToast = useCallback(() => setToast(null), []);

  if (!raw) {
    return (
      <KerawananShell title="Detail kerawanan" back={{ to: '/insiden?tab=kerawanan', label: 'Kembali ke Insiden, tab Kerawanan' }}
        crumbs={[{ label: 'Insiden', to: '/insiden' }, { label: 'Kerawanan', to: '/insiden?tab=kerawanan' }, { label: no }]}>
        <section className="p-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="lk-es" style={{ justifyContent: 'center', padding: '40px 16px' }}>
            <b>Kerawanan tidak ditemukan.</b>
            <span style={{ color: 'var(--ink-muted)', maxWidth: 300 }}>Periksa nomor kerawanan atau kembali ke tab Kerawanan.</span>
            <Link className="p-btn p-btn-secondary" to="/insiden?tab=kerawanan">Ke tab Kerawanan</Link>
          </div>
        </section>
      </KerawananShell>
    );
  }
  const k = resolveKerawanan(raw);
  const raised = raw.raisedTo ? incidents.find((i) => i.no === raw.raisedTo) : undefined;
  if (raised) {
    return <RaisedView k={k} incident={raised} cfg={cfg} canReview={role === 'pejabat'} toast={toast} onToastClose={closeToast} />;
  }
  const start: Step = sp.get('langkah') === 'naikkan' && canRaise(role) ? 'naikkan' : sp.get('langkah') === 'ajukan' && canSubmit(role) ? 'ajukan' : 'detail';
  return <OpenKerawanan key={k.no} krwNo={k.no} start={start} />;
}

/** Kerawanan berstatus Tercatat: KD1 dengan langkah KD2/KD3/KD5 dan dialog KD6. */
function OpenKerawanan({ krwNo, start }: { krwNo: string; start: Step }) {
  const navigate = useNavigate();
  const role = useDemoStore((s) => s.role);
  const raw = useDemoStore((s) => s.kerawanan.find((x) => x.no === krwNo))!;
  const incidents = useDemoStore((s) => s.incidents);
  const cfg = useDemoStore((s) => s.config);
  const decide = useDemoStore((s) => s.decide);
  const [step, setStep] = useState<Step>(start);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [note, setNote] = useState<Note | null>(null);
  const closeNote = useCallback(() => setNote(null), []);
  const k = resolveKerawanan(raw);
  const by = DEMO_USERS[role].name;
  const nextNo = nextNumber('INS-SEN', incidents.map((i) => i.no));
  const [initial] = useState(() => initialRaiseForm(k, cfg));

  const raiseUp = (f: RaiseForm) => {
    const r = decide((s) => raiseToIncident(s, k.no, toRaiseInput(f, by, s.config)));
    if (!r.ok) return r.reason;
    navigate('/insiden', { state: { toast: `Insiden ${nextNo} dibuat, Dalam penanganan. PIC: ${picOf(f)}.${r.skkNotified ? ' SKK Migas diberi tahu.' : ''}` } });
  };
  const submit = (f: RaiseForm) => {
    const r = decide((s) => submitAsIncident(s, k.no, toSubmitInput(f, by, s.config)));
    if (!r.ok) return r.reason;
    navigate('/insiden', { state: { toast: `Insiden ${nextNo} diajukan. Menunggu pemeriksaan Pejabat Berwenang.` } });
  };
  /** Cabang (b): laporan Insiden baru dengan lokasi terisi; kerawanan ini tetap Tercatat. */
  const startNewReport = () => {
    const draft = useDraftStore.getState();
    draft.resetDraft();
    draft.patch({
      kind: 'insiden', hasImpact: 'ya', locationName: k.location, lat: k.lat ?? null, lng: k.lng ?? null, wk: k.wk, patokan: k.patokan ?? k.location,
    });
    navigate('/insiden/baru/temuan', { state: { fromKrw: k.no } });
  };
  const next = (p: RaisePick) => {
    setDialog(null);
    if (p === 'a') setStep('naikkan');
    else startNewReport();
  };
  const saveProgress = (v: { text: string; worsening: boolean; photos: string[] }) => {
    const r = decide((s) => addProgress(s, k.no, { by, ...v }));
    setDialog(null);
    setNote(r.ok ? { text: v.worsening ? 'Perkembangan disimpan. Pejabat Berwenang diberi tahu.' : 'Perkembangan disimpan.' } : { text: r.reason, error: true });
  };
  const escalate = () => {
    setDialog(null);
    if (canRaise(role)) setDialog('pilih');
    else if (canSubmit(role)) setStep('ajukan');
  };

  if (step !== 'detail') {
    return (
      <RaiseFormView
        key={step} k={k} mode={step === 'naikkan' ? 'raise' : 'submit'} cfg={cfg} initial={initial} nextNo={nextNo}
        onCancel={() => setStep('detail')} onSubmit={step === 'naikkan' ? raiseUp : submit}
      />
    );
  }
  const acts = (
    <>
      {canAddProgress(role) && <button type="button" className="p-btn p-btn-secondary" onClick={() => setDialog('progres')}>Tambah perkembangan</button>}
      {canRaise(role) && <button type="button" className="p-btn p-btn-secondary" onClick={() => setDialog('pilih')}>Naikkan jadi insiden</button>}
      {canSubmit(role) && <button type="button" className="p-btn p-btn-secondary" onClick={() => setStep('ajukan')}>Ajukan jadi insiden</button>}
    </>
  );
  return (
    <>
      <KerawananShell
        title="Detail kerawanan" back={{ to: '/insiden?tab=kerawanan', label: 'Kembali ke Insiden, tab Kerawanan' }} acts={acts}
        crumbs={[{ label: 'Insiden', to: '/insiden' }, { label: 'Kerawanan', to: '/insiden?tab=kerawanan' }, { label: k.no }]}
      >
        <KerawananBody k={k} />
      </KerawananShell>
      {dialog === 'pilih' && <RaiseDialog krwNo={k.no} location={k.location} onClose={() => setDialog(null)} onNext={next} />}
      {dialog === 'progres' && (
        <ProgressDialog krwNo={k.no} title={k.title} canRaise={canRaise(role)} onClose={() => setDialog(null)} onSave={saveProgress} onEscalate={escalate} />
      )}
      {note && <RvToast text={note.text} error={note.error} onClose={closeNote} />}
    </>
  );
}

