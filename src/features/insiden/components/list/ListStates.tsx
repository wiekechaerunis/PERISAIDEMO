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

/** S09 (B-17): daftar kosong di dalam kartu daftar (toolbar tetap), ilustrasi dokumen, tombol sekunder. */
export function EmptyCard({ role }: { role: Role }) {
  return (
    <section className="p-card" style={FILL_CARD}>
      <div className="p-toolbar" style={{ justifyContent: 'space-between' }}>
        <b style={{ fontSize: 15 }}>Daftar insiden</b>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className="p-input" style={{ width: 300, height: 36 }}>
            <Icon name="search" size={16} style={{ color: 'var(--ink-muted)' }} />
            <input className="ph" aria-label="Cari nomor, judul, atau patokan" placeholder="Cari nomor, judul, atau patokan" disabled style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit' }} />
          </label>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" disabled><Icon name="filter" size={16} />Filter</button>
        </div>
      </div>
      <div className="lk-es" style={{ flex: '1 1 auto', justifyContent: 'center' }}>
        <svg viewBox="0 0 140 112" width="140" height="112" aria-hidden="true">
          <ellipse cx="70" cy="102" rx="46" ry="5" fill="var(--surface-sunken)" />
          <rect x="50" y="8" width="52" height="68" rx="7" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2.5" />
          <rect x="40" y="16" width="52" height="78" rx="7" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2.5" />
          <circle cx="92" cy="86" r="12" fill="var(--action)" stroke="var(--ink)" strokeWidth="2.5" />
        </svg>
        <b>Belum ada insiden yang dilaporkan.</b>
        <span style={{ color: 'var(--ink-muted)', maxWidth: 360 }}>Bila terjadi, laporkan dari sini atau dari pesan WhatsApp.</span>
        {canCreateReport(role) && (
          <Link to="/insiden/baru" className="p-btn p-btn-secondary" style={{ marginTop: 8 }}>
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
