// State halaman detail: Terbatas (S12), Memuat (S08, disesuaikan ke detail), Gagal dimuat (S11, disesuaikan ke detail).
import { Link } from 'react-router-dom';
import { Ic } from './Ic';

export function RestrictedView() {
  return (
    <div className="in-status">
      <svg className="il" viewBox="0 0 120 96" width="120" height="96" aria-hidden="true">
        <rect className="pa ln" x="34" y="40" width="52" height="42" rx="8" />
        <path className="ln" d="M46 40V30a14 14 0 0 1 28 0v10" />
        <circle className="ac ln" cx="60" cy="61" r="6" />
      </svg>
      <h2>Anda tidak punya akses ke insiden ini.</h2>
      <p>Insiden ini terbatas atau di luar cakupan Anda. Hubungi Pejabat Berwenang bila perlu melihatnya.</p>
      <Link to="/insiden" className="p-btn p-btn-secondary" style={{ marginTop: 8 }}>Kembali ke daftar</Link>
    </div>
  );
}

const sk = (w: string | number, h: number, extra?: object) => <span className="p-sk" style={{ width: w, height: h, ...extra }}></span>;

export function LoadingView() {
  return (
    <div className="lk-grid">
      <div className="c8 lk-stack">
        <section className="p-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sk('30%', 12)}
          {sk('70%', 22)}
          {sk('55%', 12)}
          {sk('100%', 12)}
          {sk('100%', 12)}
          {sk('80%', 12)}
        </section>
        <section className="p-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sk('24%', 14)}
          {sk('100%', 40, { borderRadius: 'var(--radius-md)' })}
        </section>
      </div>
      <aside className="c4 lk-stack">
        <section className="p-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sk('30%', 14)}
          {sk(64, 22)}
          {sk('60%', 12)}
          {sk('50%', 12)}
          {sk('55%', 12)}
        </section>
      </aside>
    </div>
  );
}

export function LoadFailedView({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="p-card" style={{ padding: 0, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
      <div className="lk-es" style={{ flex: '1 1 auto', justifyContent: 'center' }} role="alert">
        <svg className="il" viewBox="0 0 120 96" width="120" height="96" aria-hidden="true">
          <rect className="pa ln" x="20" y="18" width="80" height="56" rx="8" />
          <path className="ln" d="M20 34h80" />
          <circle className="er ln" cx="60" cy="56" r="12" />
          <path className="ln" d="M60 50v6M60 61h.01" />
        </svg>
        <b>Detail insiden tidak dapat dimuat.</b>
        <span style={{ color: 'var(--ink-muted)' }}>Periksa koneksi Anda, lalu coba lagi.</span>
        <button type="button" className="p-btn p-btn-secondary" style={{ marginTop: 8 }} onClick={onRetry}>
          <Ic d="retry" size={16} />
          Muat ulang
        </button>
      </div>
    </section>
  );
}
