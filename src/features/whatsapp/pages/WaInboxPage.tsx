// Pemantauan WhatsApp v2 (V2-01..06b): header halaman, tab strip, dan tab Pesan masuk; tab lain dikerjakan di components/monitor/*Tab.tsx.
// SKK tidak punya akses (K1). Pesan dipilah manual (K2). Aksi per pesan (Jadikan draf laporan, Tautkan ke insiden, Tandai rutin, Tandai tidak relevan, Buka kembali) ada di Detail pesan.
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { DEMO_USERS, canManageWa, canUseWaMonitor } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import { AturanTab, GrupTab, NomorTab, WaTerms } from '../components/WaMonitorTabs';
import { Ic, P } from '../components/monitor/nomor/icons';
import { useNomorUi } from '../components/monitor/nomor/ui';
import { InboxView } from '../components/monitor/pesan/InboxView';
import { PageHeader, PesanShell } from '../components/monitor/pesan/PesanShell';
import { isPriority } from '../components/monitor/pesan/util';

type Tab = 'pesan' | 'nomor' | 'aturan' | 'grup';
const BASE = '/pemantauan-whatsapp';
const SUM = 'Laporan sitrep dari grup WhatsApp BUJP, TNI, dan Polri yang dipantau nomor organisasi Anda.';

export function WaInboxPage() {
  const role = useDemoStore((s) => s.role);
  const terms = useDemoStore((s) => s.waTerms ?? []);
  const messages = useDemoStore((s) => s.waMessages);
  const [params] = useSearchParams();
  const me = DEMO_USERS[role].name;
  if (!canUseWaMonitor(role)) return <Navigate to="/" replace />;
  const manage = canManageWa(role);
  const raw = params.get('tab') as Tab | null;
  const needTerms = manage && !terms.includes(me);
  const tab: Tab = manage && (raw === 'nomor' || raw === 'aturan' || raw === 'grup') ? raw : needTerms ? 'nomor' : 'pesan';
  const waiting = messages.filter(isPriority).length;
  const tabs = manage
    ? [
        { to: BASE, label: 'Pesan masuk', count: waiting, on: tab === 'pesan' },
        { to: `${BASE}?tab=nomor`, label: 'Nomor tertaut', count: 0, on: tab === 'nomor' },
        { to: `${BASE}?tab=aturan`, label: 'Aturan pemantauan', count: 0, on: tab === 'aturan' },
        { to: `${BASE}?tab=grup`, label: 'Grup', count: 0, on: tab === 'grup' },
      ]
    : undefined;
  const nomorAction = manage && tab === 'nomor';

  return (
    <PesanShell>
      <PageHeader
        title="Pemantauan WhatsApp" sum={SUM}
        action={nomorAction ? (
          <button type="button" className="pr-btn pr-btn--primary pr-btn--md" onClick={() => useNomorUi.getState().openLink()}>
            <Ic d={P.plus} />Tautkan nomor
          </button>
        ) : undefined}
      />
      {tabs && (
        <div className="pr-tabsbar">
          <nav className="pr-tabs" role="tablist" aria-label="Tampilan Pemantauan WhatsApp">
            {tabs.map((t) => (
              <Link key={t.to} to={t.to} role="tab" aria-selected={t.on} aria-current={t.on ? 'page' : undefined}>
                {t.label}{t.count > 0 && <span>{t.count}</span>}
              </Link>
            ))}
          </nav>
        </div>
      )}
      {needTerms && <WaTerms me={me} />}
      {tab === 'pesan' ? (
        <InboxView manage={manage} />
      ) : (
        <div className="pr-page pr-stack wa-scope">
          {tab === 'nomor' ? <NomorTab hideLinkButton /> : tab === 'aturan' ? <AturanTab /> : <GrupTab />}
        </div>
      )}
    </PesanShell>
  );
}
