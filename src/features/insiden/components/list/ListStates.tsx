// State daftar: S08 Memuat, S09 Kosong, S11 Gagal muat, S12 Terbatas (S10 Filter kosong ada di IncidentListPage).
import { Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Icon } from '@/components/ui/Icon';
import { canCreateReport, type Role } from '@/lib/rbac';

const SK_ROWS: [string, string, string][] = [
  ['62%', '34%', '70%'],
  ['48%', '34%', '60%'],
  ['70%', '34%', '74%'],
  ['55%', '34%', '58%'],
  ['66%', '34%', '64%'],
];

export function LoadingCard() {
  return (
    <section className="p-card" style={{ padding: 0, overflow: 'hidden' }} aria-busy="true" aria-label="Memuat daftar insiden">
      <div className="p-toolbar">
        <b style={{ flex: 1, fontSize: 15 }}>Semua insiden</b>
        <span className="p-sk" style={{ width: 300, height: 36, borderRadius: 'var(--radius-md)' }}></span>
        <span className="p-sk" style={{ width: 86, height: 36, borderRadius: 'var(--radius-md)' }}></span>
      </div>
      <table className="p-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ paddingLeft: 16 }}>Insiden</th>
            <th>Kategori · lokasi</th>
            <th>Keparahan</th>
            <th>Waktu kejadian</th>
            <th>Status</th>
            <th>PIC</th>
          </tr>
        </thead>
        <tbody>
          {SK_ROWS.map(([a, b, c], i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 16 }}>
                <span className="p-col" style={{ gap: 6 }}>
                  <span className="p-sk" style={{ width: a, height: 12 }}></span>
                  <span className="p-sk" style={{ width: b, height: 10 }}></span>
                </span>
              </td>
              <td>
                <span className="p-sk" style={{ width: c, height: 12 }}></span>
              </td>
              <td>
                <span className="p-sk" style={{ width: 64, height: 22 }}></span>
              </td>
              <td>
                <span className="p-sk" style={{ width: 110, height: 12 }}></span>
              </td>
              <td>
                <span className="p-sk" style={{ width: 96, height: 22 }}></span>
              </td>
              <td>
                <span className="p-sk" style={{ width: 80, height: 12 }}></span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const FILL_CARD = { padding: 0, flex: '1 1 auto', display: 'flex', flexDirection: 'column' } as const;

export function EmptyCard({ role }: { role: Role }) {
  return (
    <section className="p-card" style={FILL_CARD}>
      <div className="lk-es" style={{ flex: '1 1 auto', justifyContent: 'center' }}>
        <svg className="il" viewBox="0 0 120 96" width="120" height="96" aria-hidden="true">
          <path className="pa ln" d="M60 10l38 14v24c0 22-16 34-38 40C38 82 22 70 22 48V24z" />
          <path className="ac ln" d="M46 50l10 10 20-22" />
        </svg>
        <b>Belum ada insiden yang dilaporkan.</b>
        <span style={{ color: 'var(--ink-muted)', maxWidth: 360 }}>
          Semoga tetap begitu. Bila terjadi, laporkan dari sini atau dari pesan WhatsApp.
        </span>
        {canCreateReport(role) && (
          <Link to="/insiden/baru" className="p-btn p-btn-primary" style={{ marginTop: 8 }}>
            <Icon name="plus" size={16} />
            Buat laporan
          </Link>
        )}
      </div>
    </section>
  );
}

export function FailedCard({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="p-card" style={FILL_CARD}>
      <div className="lk-es" style={{ flex: '1 1 auto', justifyContent: 'center' }} role="alert">
        <svg className="il" viewBox="0 0 120 96" width="120" height="96" aria-hidden="true">
          <rect className="pa ln" x="20" y="18" width="80" height="56" rx="8" />
          <path className="ln" d="M20 34h80" />
          <circle className="er ln" cx="60" cy="56" r="12" />
          <path className="ln" d="M60 50v6M60 61h.01" />
        </svg>
        <b>Daftar insiden tidak dapat dimuat.</b>
        <span style={{ color: 'var(--ink-muted)' }}>Periksa koneksi Anda, lalu coba lagi.</span>
        <button type="button" className="p-btn p-btn-secondary" style={{ marginTop: 8 }} onClick={onRetry}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
          </svg>
          Muat ulang
        </button>
      </div>
    </section>
  );
}

/** S12: layar penuh (header `child` dengan tombol kembali), jadi tidak memakai AppShell. */
export function LimitedPage({ role, taskCount }: { role: Role; taskCount: number }) {
  return (
    <div className="lk-app p-app">
      <Sidebar active="insiden" role={role} taskCount={taskCount} />
      <div className="lk-main">
        <header className="p-appbar child">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-label="Perkecil sidebar">
              <Icon name="collapse" size={18} />
            </button>
            <Link to="/insiden" className="p-ibtn" aria-label="Kembali ke Insiden">
              <Icon name="back" size={16} />
            </Link>
            <div className="p-col ttl">
              <h1>Insiden</h1>
            </div>
            <div className="acts"></div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              <button type="button" className="p-ai">
                <span className="lbl">Tanya AI</span>
              </button>
            </div>
          </div>
        </header>
        <main className="lk-content" style={{ display: 'flex' }}>
          <div className="in-status">
            <svg className="il" viewBox="0 0 120 96" width="120" height="96" aria-hidden="true">
              <rect className="pa ln" x="34" y="40" width="52" height="42" rx="8" />
              <path className="ln" d="M46 40V30a14 14 0 0 1 28 0v10" />
              <circle className="ac ln" cx="60" cy="61" r="6" />
            </svg>
            <h2>Anda tidak punya akses ke insiden ini.</h2>
            <p>Insiden ini terbatas atau di luar cakupan Anda. Hubungi Pejabat Berwenang bila perlu melihatnya.</p>
            <Link to="/insiden" className="p-btn p-btn-secondary" style={{ marginTop: 8 }}>
              Kembali ke daftar
            </Link>
          </div>
        </main>
      </div>
      <RoleSwitcher />
    </div>
  );
}
