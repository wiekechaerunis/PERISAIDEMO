// Board: I25 (Detail insiden · Riwayat dengan entri "Dari WhatsApp" dan menu "Lepas tautan", dialog konfirmasi, Pejabat).
// Halaman ini memperlihatkan Riwayat insiden beserta pesan yang ditautkan; Riwayat di halaman penanganan Pejabat belum memuat menu ini (lihat laporan).
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Ic } from '@/features/insiden/components/detail/Ic';
import { formatWibFull } from '@/lib/format';
import { DEMO_USERS } from '@/lib/rbac';
import { SEV_LABEL, SEV_TAG_CLS } from '@/lib/severity';
import { useDemoStore } from '@/services/mock/store';
import { STATUS_LABEL, STATUS_TAG, type Incident, type WaMessage } from '@/services/types';
import { activeLink, quoteOf, unlinkMessage } from '@/services/mock/workflow.wa';
import { UnlinkDialog } from '../components/Dialogs';
import { WaPageShell, type WaToast } from '../components/WaPageShell';
import { TOAST_UNLINKED, senderLabel } from '../logic/draft';

interface Entry {
  at: string;
  by: string;
  head: string;
  body?: string;
  message?: WaMessage;
}

function entriesOf(i: Incident, messages: WaMessage[]): Entry[] {
  return (i.timeline ?? []).map((t): Entry => {
    if (t.text.startsWith('Pesan ditautkan: ')) {
      const m = messages.find((x) => t.text === `Pesan ditautkan: ${quoteOf(x)}`);
      return { at: t.at, by: t.by, head: 'Dari WhatsApp', message: m };
    }
    const k = t.text.indexOf(': ');
    if (t.text.startsWith('Tautan pesan WhatsApp dilepas')) return { at: t.at, by: t.by, head: 'Tautan pesan WhatsApp dilepas', body: `Alasan: ${t.text.slice(k + 2)}` };
    return { at: t.at, by: t.by, head: k < 0 ? t.text.replace(/\.$/, '') : t.text.slice(0, k), body: k < 0 ? undefined : t.text.slice(k + 2) };
  }).reverse();
}

export function WaLinksPage() {
  const { no = '' } = useParams();
  const role = useDemoStore((s) => s.role);
  const incident = useDemoStore((s) => s.incidents.find((i) => i.no === no));
  const messages = useDemoStore((s) => s.waMessages);
  const [menu, setMenu] = useState<string | null>(null);
  const [ask, setAsk] = useState<WaMessage | null>(null);
  const [toast, setToast] = useState<WaToast | null>(null);
  const crumb: [string, string?][] = [['Insiden', '/insiden'], [no]];

  if (!incident) {
    return (
      <WaPageShell title="Detail insiden" crumb={crumb} backTo="/insiden">
        <section className="p-card in-sec"><h2 className="in-h">Insiden tidak ditemukan</h2></section>
      </WaPageShell>
    );
  }
  const me = DEMO_USERS[role].name;
  const items = entriesOf(incident, messages);
  const doUnlink = (reason: string) => {
    if (!ask) return;
    const r = useDemoStore.getState().decide((s) => unlinkMessage(s, ask.id, incident.no, me, reason));
    setAsk(null);
    setToast(r.ok ? { text: TOAST_UNLINKED } : { text: r.reason, tone: 'err' });
  };

  return (
    <WaPageShell
      title="Detail insiden"
      tags={
        <>
          <span className={'p-tag ' + STATUS_TAG[incident.status]}>{STATUS_LABEL[incident.status]}</span>
          {incident.severity && <span className={'p-tag ' + SEV_TAG_CLS[incident.severity]}><span className="dot"></span>{SEV_LABEL[incident.severity]}</span>}
        </>
      }
      crumb={crumb} backTo={`/insiden/${incident.no}`} toast={toast} onToastClose={() => setToast(null)}
      overlay={ask ? <UnlinkDialog message={ask} onCancel={() => setAsk(null)} onConfirm={doUnlink} /> : null}
    >
      <div className="lk-grid">
        <div className="c8 lk-stack">
          <section className="p-card in-sec">
            <h2 className="in-h">{incident.title}</h2>
            <p style={{ margin: 0 }}>{incident.detail?.story || incident.detail?.securityImpact || '—'}</p>
          </section>
          <section className="p-card in-sec">
            <h2 className="in-h">Riwayat</h2>
            <ol className="p-tl" aria-label="Riwayat insiden">
              {items.map((x, n) => {
                const m = x.message;
                const l = m?.links.find((k) => k.incidentNo === incident.no && k.kind === 'tautan' && k.at === x.at) ?? m?.links.find((k) => k.incidentNo === incident.no && k.kind === 'tautan');
                const released = !!l?.releasedAt;
                const canUnlink = role === 'pejabat' && !!m && !!l && !released && activeLink(m)?.incidentNo === incident.no;
                return (
                  <li key={`${x.at}-${n}`}>
                    <span className={'nd' + (n === 0 ? ' now' : '')}><Icon name={m ? 'send' : 'check'} size={11} /></span>
                    <div>
                      {m ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div className="hd">
                              <b>Dari WhatsApp</b> · {m.group} · {senderLabel(m)}{' '}
                              {released && <span className="p-tag t-neutral">Tautan dilepas</span>}
                            </div>
                            {canUnlink && (
                              <div className="in-menuwrap">
                                <button type="button" className="p-ibtn ghost" aria-label="Aksi entri" aria-haspopup="menu" aria-expanded={menu === m.id} onClick={() => setMenu(menu === m.id ? null : m.id)}>
                                  <Ic d="more" size={16} />
                                </button>
                                {menu === m.id && (
                                  <div className="in-menu" role="menu" style={{ display: 'block' }}>
                                    <button type="button" role="menuitem" className="dz" onClick={() => { setMenu(null); setAsk(m); }}>
                                      <Icon name="close" size={14} />Lepas tautan
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="in-wa" style={released ? { opacity: 0.55 } : undefined}>
                            <div className="bub">{m.text}</div>
                            <span className="who">{formatWibFull(m.at)} · ditautkan {x.by} {x.at.slice(11, 16)} WIB</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="hd"><b>{x.head}</b> oleh {x.by}</div>
                          {x.body && <div className="dt">{x.body}</div>}
                          <div className="tm">{formatWibFull(x.at)}</div>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
        <aside className="c4 lk-stack">
          <section className="p-card in-sec">
            <h2 className="in-h">Ringkasan</h2>
            <dl className="lk-kv1">
              <dt>Nomor</dt><dd><span className="p-mono">{incident.no}</span></dd>
              <dt>PIC</dt><dd>{incident.pic ?? 'Belum ditunjuk'}</dd>
              <dt>Sumber</dt><dd>{incident.source === 'wa' ? 'WhatsApp' : 'Temuan langsung'}</dd>
            </dl>
            <Link to={`/insiden/${incident.no}`} className="lk-alink">Buka detail insiden</Link>
          </section>
          <div className="p-note"><span>Pesan WhatsApp yang ditautkan masuk ke Riwayat. Pejabat Berwenang bisa melepas tautan yang keliru; entrinya tetap tercatat.</span></div>
        </aside>
      </div>
    </WaPageShell>
  );
}
