// Nomor tertaut dan ketentuan pemakaian (board V2-20, 22, 23, 23b, 23c, 24). Tampilan memakai kelas `pr-*` di dalam V2Root.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatWibFull } from '@/lib/format';
import { DEMO_USERS } from '@/lib/rbac';
import { demoNow } from '@/services/mock/clock';
import { useDemoStore } from '@/services/mock/store';
import { WA_MAX_NUMBERS, type WaNumber } from '@/services/types';
import { acceptTerms, resumeNumber } from '@/services/mock/workflow.wamon';
import { run } from './shared';
import { V2Root } from './V2Root';
import { Ic, P } from './nomor/icons';
import { LinkNumberDialog } from './nomor/LinkNumberDialog';
import { V2Dialog } from './nomor/V2Dialog';
import { ReasonDialog, RenameDialog, TermsReadDialog } from './nomor/NumberDialogs';
import { RiskText } from './nomor/RiskText';
import { RowMenu } from './nomor/RowMenu';
import { useNomorUi } from './nomor/ui';
import { maskPhone, rememberTermsAt, termsAt } from './nomor/util';

const BASE = '/pemantauan-whatsapp';
const NUM_TAG: Record<WaNumber['status'], { label: string; cls: string }> = {
  terhubung: { label: 'Terhubung', cls: 'pr-tag--ok' },
  menunggu: { label: 'Menunggu dipindai', cls: 'pr-tag--info' },
  terputus: { label: 'Perlu ditautkan ulang', cls: 'pr-tag--muted' },
  ditangguhkan: { label: 'Ditangguhkan', cls: 'pr-tag--caution' },
};

/* ------------------------------ Ketentuan (persetujuan pertama) ------------------------------ */
export function WaTerms({ me }: { me: string }) {
  const [ok, setOk] = useState(false);
  const accept = () => { rememberTermsAt(me); run((s) => acceptTerms(s, me)); };
  return (
    <V2Root>
      <div className="asis-scrim" />
      <V2Dialog
        title="Sebelum memakai Pemantauan WhatsApp" size="lg" labelId="wa-terms-first"
        subtitle="Baca ketentuan pemakaian WhatsApp berikut. Persetujuan ini bisa dibuka lagi kapan saja."
        onClose={() => undefined}
        footer={<button type="button" className="pr-btn pr-btn--primary pr-btn--md" disabled={!ok} onClick={accept}>Lanjutkan</button>}
      >
        <RiskText />
        <label className="pr-choice" style={{ marginTop: 12 }}>
          <input className="pr-check" type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          <span>Saya memahami risiko di atas</span>
        </label>
      </V2Dialog>
    </V2Root>
  );
}

/* ------------------------------ Nomor tertaut ------------------------------ */
type Ask = { id: string; kind: 'putuskan' | 'tangguhkan' | 'label' | 'tautkan-ulang' };

/** `hideLinkButton`: sembunyikan tombol "Tautkan nomor" di kartu bila header halaman sudah memilikinya. */
export function NomorTab({ hideLinkButton = false }: { hideLinkButton?: boolean } = {}) {
  const navigate = useNavigate();
  const role = useDemoStore((s) => s.role);
  const numbers = useDemoStore((s) => s.waNumbers);
  const groups = useDemoStore((s) => s.waGroups);
  const messages = useDemoStore((s) => s.waMessages);
  const linkOpen = useNomorUi((s) => s.linkOpen);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [readTerms, setReadTerms] = useState(false);
  const me = DEMO_USERS[role].name;
  const target = ask ? numbers.find((n) => n.id === ask.id) : undefined;
  const today = demoNow().slice(0, 10);
  const caught = messages.filter((m) => m.at.slice(0, 10) === today).length;
  const monitored = (id: string) => groups.filter((g) => g.numberId === id && g.monitored && !g.removed).length;
  const lastMsg = (id: string) => messages.filter((m) => m.numberId === id).map((m) => m.at).sort().pop();
  const full = numbers.length >= WA_MAX_NUMBERS;
  const openLink = useNomorUi.getState().openLink;

  return (
    <V2Root>
      <div className="pr-stack wa-scope">
        <section className="pr-card wa-metrics" aria-label="Ringkasan nomor">
          <div className="pr-metric"><div className="pr-metric__label">Nomor tertaut</div><div><span className="pr-metric__value">{numbers.length}<small> / {WA_MAX_NUMBERS}</small></span></div></div>
          <div className="pr-metric"><div className="pr-metric__label">Diperiksa hari ini</div><div><span className="pr-metric__value">–</span></div></div>
          <div className="pr-metric"><div className="pr-metric__label">Tertangkap hari ini</div><div><span className="pr-metric__value">{caught}</span></div></div>
          <div className="pr-metric"><div className="pr-metric__label">Diabaikan aturan hari ini</div><div><span className="pr-metric__value">–</span></div></div>
        </section>

        <section className="pr-tcard">
          <div className="pr-tcard__bar">
            <h2>Nomor organisasi</h2>
            {!hideLinkButton && (
              <button type="button" className="pr-btn pr-btn--primary pr-btn--md nomor-link-btn" disabled={full} onClick={openLink}><Ic d={P.plus} />Tautkan nomor</button>
            )}
          </div>
          <div className="pr-table-scroll">
            <table className="pr-table">
              <thead><tr><th>Nomor</th><th>Status</th><th>Grup dipantau</th><th>Pesan terakhir</th><th>HP terakhir aktif</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {numbers.map((n) => {
                  const last = lastMsg(n.id);
                  return (
                    <tr key={n.id}>
                      <td><span className="pr-row-title block">{n.label}</span><span className="wa-num">{maskPhone(n.phone)}</span></td>
                      <td>
                        <span className={`pr-tag ${NUM_TAG[n.status].cls}`}>{NUM_TAG[n.status].label}</span>
                        {n.suspendedReason && <span className="pr-help block">{n.suspendedReason}</span>}
                      </td>
                      <td>{monitored(n.id)} grup</td>
                      <td>{last ? formatWibFull(last) : '–'}</td>
                      <td>{n.linkedAt ? formatWibFull(n.linkedAt) : '–'}</td>
                      <td className="text-right">
                        <RowMenu n={n} a={{
                          onRules: () => navigate(`${BASE}?tab=aturan`),
                          onGroups: () => navigate(`${BASE}?tab=grup`),
                          onRename: () => setAsk({ id: n.id, kind: 'label' }),
                          onRelink: () => setAsk({ id: n.id, kind: 'tautkan-ulang' }),
                          onSuspend: () => setAsk({ id: n.id, kind: 'tangguhkan' }),
                          onResume: () => { run((s) => resumeNumber(s, n.id)); },
                          onDisconnect: () => setAsk({ id: n.id, kind: 'putuskan' }),
                        }} />
                      </td>
                    </tr>
                  );
                })}
                {numbers.length === 0 && <tr><td colSpan={6} className="pr-help">Belum ada nomor tertaut.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <div className="v2-consent">
          <span className="ci"><Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" size={18} /></span>
          <span className="tx"><b>Anda sudah menyetujui ketentuan pemakaian WhatsApp</b><span>{formatWibFull(termsAt(me))}</span></span>
          <button type="button" className="pr-btn pr-btn--secondary pr-btn--sm" onClick={() => setReadTerms(true)}>Lihat teks persetujuan</button>
        </div>

        {linkOpen && <LinkNumberDialog onClose={useNomorUi.getState().closeLink} />}
        {ask?.kind === 'tautkan-ulang' && target && <LinkNumberDialog relinkId={target.id} onClose={() => setAsk(null)} />}
        {ask?.kind === 'label' && target && <RenameDialog n={target} onClose={() => setAsk(null)} />}
        {(ask?.kind === 'putuskan' || ask?.kind === 'tangguhkan') && target && <ReasonDialog n={target} kind={ask.kind} groups={monitored(target.id)} onClose={() => setAsk(null)} />}
        {readTerms && <TermsReadDialog at={termsAt(me)} onClose={() => setReadTerms(false)} />}
      </div>
    </V2Root>
  );
}
