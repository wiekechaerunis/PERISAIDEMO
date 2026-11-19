// Detail insiden disetujui untuk SKK (Pengawas/Pimpinan). Board: P31 (dieskalasi, Beri arahan), P32 (dialog), P35 (ditutup, hanya baca),
// P36 (persetujuan penutupan SKK bila dikonfigurasi; `?persetujuan=skk`, DL-74), PS1 (bagian SKK: eskalasi otomatis lewat tenggat).
// SKK hanya membaca selain arahan dan persetujuan penutupan; tanpa tombol Setujui/Tutup bawaan Pejabat.
import { useState } from 'react';
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { approveClosureBySkk, giveDirective, rejectClosureBySkk, TOAST_DIRECTIVE } from '@/services/mock/workflow.skk';
import { DEMO_USERS } from '@/lib/rbac';
import { SEV_LABEL } from '@/lib/severity';
import { formatDateShort } from '@/lib/format';
import { STATUS_LABEL, STATUS_TAG } from '@/services/types';
import { DetailShell, type ToastMsg } from '../components/detail/DetailShell';
import { IncidentSummaryCard } from '../components/detail/IncidentSummaryCard';
import { AttachmentsCard } from '../components/detail/AttachmentsCard';
import { RestrictedView } from '../components/detail/StateViews';
import { detailOf } from '../components/detail/detailLogic';
import { DirectiveDialog } from '../components/skk/DirectiveDialog';
import { EscalationBanner, EscalationCard } from '../components/skk/EscalationCard';
import { RiwayatCard } from '../components/skk/RiwayatCard';
import { ClosureDecision, ReturnDialog, type Focus } from '../components/skk/ClosureDecision';
import { ClosureDataCard, DueCard, Fold, FollowUpsCard, NextStep, PenutupanCard, RelatedCard, SkkSummaryCard } from '../components/skk/Cards';
import { closedInfo, escalationOf, isSkkStatus, nextStepMeta, withoutDirectiveEntries } from '../components/skk/skkLogic';
import { riwayat, timeShort } from '../logic/closure';

const TOAST_APPROVED = 'Penutupan disetujui. Insiden ditutup.';
const TOAST_RETURNED = 'Insiden dikembalikan ke PIC.';

export function SkkIncidentPage() {
  const { no = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const role = useDemoStore((s) => s.role);
  const all = useDemoStore((s) => s.incidents);
  const kerawanan = useDemoStore((s) => s.kerawanan);
  const fus = useFollowUps();
  const [dialog, setDialog] = useState<'arahan' | 'kembali' | null>(null);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [focus, setFocus] = useState<Focus>(null);

  const i = all.find((x) => x.no === no);
  const me = DEMO_USERS[role].name;
  if (!i || i.restricted || !isSkkStatus(i.status)) {
    return (
      <DetailShell title="Insiden" crumb={false} bell={false} centered>
        <RestrictedView />
      </DetailShell>
    );
  }

  const closed = i.status === 'ditutup';
  const approval = params.get('persetujuan') === 'skk' && i.status === 'minta-ditutup';
  const esc = escalationOf(i);
  const d = detailOf(i);
  const ci = closedInfo(i, fus);
  const log = riwayat(withoutDirectiveEntries(i));

  const give = (text: string): string | undefined => {
    const r = useDemoStore.getState().decide((s) => giveDirective(s, i.no, me, text));
    if (!r.ok) return r.reason;
    setDialog(null);
    setToast({ text: TOAST_DIRECTIVE });
    return undefined;
  };
  const approve = (note: string) => {
    const r = useDemoStore.getState().decide((s) => approveClosureBySkk(s, i.no, me, note));
    if (r.ok) navigate(`/insiden/${i.no}`, { state: { toast: TOAST_APPROVED } });
    else setToast({ text: r.reason, tone: 'err' });
  };
  const sendBack = (reason: string): string | undefined => {
    const r = useDemoStore.getState().decide((s) => rejectClosureBySkk(s, i.no, me, reason));
    if (!r.ok) return r.reason;
    setDialog(null);
    navigate(`/insiden/${i.no}`, { state: { toast: TOAST_RETURNED } });
    return undefined;
  };

  const tags = (
    <>
      <span className={`p-tag ${approval ? 't-info' : STATUS_TAG[i.status]}`}>{approval ? 'Dalam penanganan' : STATUS_LABEL[i.status]}</span>
      {approval && <span className="p-tag t-caution">Menunggu persetujuan SKK</span>}
      {!approval && !closed && i.escalated && <span className="p-tag t-caution">Dieskalasi</span>}
    </>
  );

  const overlay =
    dialog === 'arahan' ? <DirectiveDialog onCancel={() => setDialog(null)} onSubmit={give} />
    : dialog === 'kembali' ? <ReturnDialog onCancel={() => setDialog(null)} onSubmit={sendBack} />
    : null;

  const reportFold = (
    <Fold title="Isi laporan & lampiran" caption={`${i.title} · ${i.severity ? SEV_LABEL[i.severity] : 'Belum ditentukan'} · ${d.attachments.length} file`}>
      <IncidentSummaryCard incident={i} />
      {d.attachments.length > 0 && <AttachmentsCard files={d.attachments} />}
    </Fold>
  );
  const last = log[0];
  const historyFold = (
    <Fold title={`Riwayat · ${log.length}`} caption={last ? `Terakhir: ${last.bold}${last.by ? ` oleh ${last.by}` : ''}, ${timeShort(last.at)}` : 'Belum ada entri'}>
      <RiwayatCard incident={i} />
    </Fold>
  );

  // P36: persetujuan penutupan SKK
  if (approval) {
    return (
      <DetailShell title="Detail insiden" tags={tags} toast={toast} onToastClose={() => setToast(null)} overlay={overlay}>
        <div className="lk-grid">
          <div className="c7 lk-stack">
            <ClosureDataCard incident={i} hl={focus === 'dp'} hlFiles={focus === 'bk'} />
            <FollowUpsCard incident={i} hl={focus === 'tl'} />
            {reportFold}
            {historyFold}
          </div>
          <aside className="c5 lk-stack">
            <ClosureDecision incident={i} focus={focus} onFocus={setFocus} onApprove={approve} onReturn={() => setDialog('kembali')} />
            <SkkSummaryCard incident={i} kerawanan={kerawanan} />
          </aside>
        </div>
      </DetailShell>
    );
  }

  // P35: insiden ditutup, hanya baca
  if (closed) {
    return (
      <DetailShell title="Detail insiden" tags={tags} toast={toast} onToastClose={() => setToast(null)} overlay={overlay}>
        <div className="lk-grid">
          <div className="c8 lk-stack">
            {ci && (
              <div className="in-bn info sm" style={{ alignSelf: 'stretch' }}>
                <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5" /></svg>
                <div className="body">
                  <b>Ditutup {formatDateShort(ci.at)}, {ci.at.slice(11, 16)} oleh {ci.by}.</b> Lama penanganan {ci.dur}
                  {i.handleDueAt ? ` · ${ci.inTime ? 'dalam tenggat' : 'melewati tenggat'}` : ''}
                  {ci.open > 0 ? ` · ${ci.open} tindak lanjut masih berjalan` : ''}.
                </div>
              </div>
            )}
            <ClosureDataCard incident={i} />
            <FollowUpsCard incident={i} closed />
            {reportFold}
            {historyFold}
          </div>
          <aside className="c4 lk-stack">
            <SkkSummaryCard incident={i} closed kerawanan={kerawanan} />
            <PenutupanCard incident={i} />
          </aside>
        </div>
      </DetailShell>
    );
  }

  // P31 (dieskalasi) dan PS1 (lewat tenggat), insiden berjalan
  return (
    <DetailShell title="Detail insiden" tags={tags} toast={toast} onToastClose={() => setToast(null)} overlay={overlay}>
      <div className="lk-grid">
        <div className="c8 lk-stack">
          {esc && <EscalationBanner e={esc} />}
          <IncidentSummaryCard incident={i} />
          {d.attachments.length > 0 && <AttachmentsCard files={d.attachments} />}
          <NextStep meta={nextStepMeta(esc)} onGive={() => setDialog('arahan')} />
          <RiwayatCard incident={i} />
        </div>
        <aside className="c4 lk-stack">
          <DueCard incident={i} />
          <SkkSummaryCard incident={i} kerawanan={kerawanan} />
          {esc && <EscalationCard e={esc} />}
          <FollowUpsCard incident={i} />
          <RelatedCard incident={i} kerawanan={kerawanan} />
        </aside>
      </div>
    </DetailShell>
  );
}
