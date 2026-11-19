// Board: I24 (Detail pesan · dialog "Tautkan ke insiden"), I25 (Lepas tautan pesan). Mengubah data nyata lewat workflow.wa.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { formatWibFull } from '@/lib/format';
import { DEMO_USERS, canCreateReport } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import { activeLink, linkMessageToIncident, unlinkMessage } from '@/services/mock/workflow.wa';
import { LinkDialog, UnlinkDialog } from '../components/Dialogs';
import { STATUS_WA } from '../components/MessageCard';
import { WaPageShell, type WaToast } from '../components/WaPageShell';
import { TOAST_UNLINKED, WA_ROUTES, senderLabel } from '../logic/draft';
import { useStartDraft } from '../logic/startDraft';

export function WaMessagePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const role = useDemoStore((s) => s.role);
  const message = useDemoStore((s) => s.waMessages.find((m) => m.id === id));
  const incidents = useDemoStore((s) => s.incidents);
  const { busy, error, start } = useStartDraft();
  const [dlg, setDlg] = useState<null | 'link' | 'unlink'>(null);
  const [toast, setToast] = useState<WaToast | null>(null);
  const crumb: [string, string?][] = [['Pemantauan WhatsApp', WA_ROUTES.inbox], ['Detail pesan']];

  if (!message) {
    return (
      <WaPageShell title="Detail pesan" crumb={crumb} backTo={WA_ROUTES.inbox}>
        <section className="p-card in-sec">
          <h2 className="in-h">Pesan tidak ditemukan</h2>
          <p style={{ margin: 0 }}>Kembali ke <Link to={WA_ROUTES.inbox} className="lk-alink">Pemantauan WhatsApp</Link>.</p>
        </section>
      </WaPageShell>
    );
  }

  const me = DEMO_USERS[role].name;
  const st = STATUS_WA[message.status];
  const link = activeLink(message);
  const can = canCreateReport(role);
  const doLink = (no: string) => {
    const r = useDemoStore.getState().decide((s) => linkMessageToIncident(s, message.id, no, me));
    setDlg(null);
    setToast(r.ok ? { text: `Pesan ditautkan ke ${no}.` } : { text: r.reason, tone: 'err' });
  };
  const doUnlink = (reason: string) => {
    if (!link) return;
    const r = useDemoStore.getState().decide((s) => unlinkMessage(s, message.id, link.incidentNo, me, reason));
    setDlg(null);
    setToast(r.ok ? { text: TOAST_UNLINKED } : { text: r.reason, tone: 'err' });
  };

  return (
    <WaPageShell
      title="Detail pesan" tags={<span className={'p-tag ' + st.tag}>{st.label}</span>} crumb={crumb} backTo={WA_ROUTES.inbox}
      toast={toast} onToastClose={() => setToast(null)}
      overlay={
        dlg === 'link' ? <LinkDialog message={message} incidents={incidents} onCancel={() => setDlg(null)} onLink={doLink} />
        : dlg === 'unlink' ? <UnlinkDialog message={message} onCancel={() => setDlg(null)} onConfirm={doUnlink} />
        : null
      }
    >
      <div className="lk-grid">
        <div className="c8 lk-stack">
          <section className="p-card in-sec">
            <h2 className="in-h">Pesan</h2>
            <div className="in-wa">
              <span className="who">Grup <b>{message.group}</b> · {senderLabel(message)}</span>
              <div className="bub">{message.text}</div>
              <span className="who">{formatWibFull(message.at)} · {message.photos.length} foto</span>
            </div>
          </section>
        </div>
        <aside className="c4 lk-stack">
          <section className="p-card in-sec">
            <h2 className="in-h">Proses pesan</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="p-cap">Status</span>
              <span className={'p-tag ' + st.tag}>{st.label}</span>
            </div>
            {link && (
              <span className="p-cap">
                {link.kind === 'laporan' ? 'Dijadikan laporan ' : 'Ditautkan ke '}
                <Link to={`/insiden/${link.incidentNo}`} className="lk-alink">{link.incidentNo}</Link> oleh {link.by}, {formatWibFull(link.at)}
              </span>
            )}
            {error && <div className="in-bn err" role="alert"><div className="body">{error}</div></div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              {message.status !== 'diproses' && can && (
                <button type="button" className="p-btn p-btn-primary" disabled={busy === message.id} onClick={() => void start(message)}>
                  {message.status === 'draf' ? 'Lanjutkan draf' : busy ? 'Membaca pesan…' : 'Jadikan draf laporan'}
                </button>
              )}
              {message.status === 'baru' && can && (
                <>
                  <button type="button" className="p-btn p-btn-secondary" onClick={() => setDlg('link')}>
                    <Icon name="attach" size={16} />Tautkan ke insiden
                  </button>
                  <span className="p-cap">Pakai Tautkan bila pesan ini kabar lanjutan dari insiden yang sedang ditangani.</span>
                </>
              )}
              {link && link.kind === 'tautan' && (
                <Link to={`/insiden/wa/tautan/${link.incidentNo}`} className="p-btn p-btn-secondary">Lihat di Riwayat insiden</Link>
              )}
              {link && link.kind === 'tautan' && role === 'pejabat' && (
                <button type="button" className="p-btn p-btn-secondary" onClick={() => setDlg('unlink')}>Lepas tautan</button>
              )}
              {link && link.kind === 'laporan' && (
                <button type="button" className="p-btn p-btn-secondary" onClick={() => navigate(`/insiden/${link.incidentNo}`)}>Buka insiden</button>
              )}
            </div>
          </section>
        </aside>
      </div>
    </WaPageShell>
  );
}
