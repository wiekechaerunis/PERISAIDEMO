// Bagian bersama daftar mobile (board M1, M12, MP1, MV1, MK1, MS08–MS12): bar atas, tab, kartu, tag, layar state.
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MobileShell } from '../ui/MobileShell';
import { Fab } from '../ui/Fab';
import { formatDateShort } from '@/lib/format';
import { SEV_LABEL, SEV_TAG_CLS } from '@/lib/severity';
import { STATUS_TAG, type Incident } from '@/services/types';
import type { Role } from '@/lib/rbac';
import { statusText } from '@/features/insiden/logic/list';

export const REPORT_PATH = '/insiden/baru/temuan';
export const incidentHref = (i: Incident) => (i.status === 'draf' ? '/insiden/baru/kejadian' : `/insiden/${i.no}`);
/** "Sumur ADR-07 · Musi Banyuasin" menjadi "Sumur ADR-07" */
export const firstSeg = (s: string) => s.split(' · ')[0];
/** "28 Okt, 01:00" */
export const shortWhen = (iso: string) => `${formatDateShort(iso)}, ${iso.slice(11, 16)}`;

const Svg = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
    <path d={d} />
  </svg>
);
export const ClockIc = () => <Svg d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2" size={13} />;

/** Menggulir membuat FAB menyusut jadi ikon saja (board M1, prop `scroll`). */
export function useScrolled() {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => setS(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return s;
}

/** Bar atas + isi `.body`; tombol menu/cari/notifikasi hanya tampilan (belum ada layar tujuan). */
export function ListShell({ children, fab, overlay }: { children: ReactNode; fab?: ReactNode; overlay?: ReactNode }) {
  return (
    <MobileShell
      title="Insiden"
      left="menu"
      fab={fab}
      overlay={overlay}
      actions={
        <>
          <button type="button" className="ib44" aria-label="Cari">
            <Svg d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5" />
          </button>
          <button type="button" className="ib44" aria-label="Notifikasi">
            <Svg d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
          </button>
        </>
      }
    >
      {children}
    </MobileShell>
  );
}

export function ReportFab({ mini }: { mini?: boolean }) {
  return <Fab to={REPORT_PATH} mini={mini} />;
}

/** Tab Insiden | Kerawanan (`.p-qf`); tab tidak aktif berupa tautan. */
export function Tabs({ active, insCount, krwCount }: { active: 'insiden' | 'kerawanan'; insCount: number; krwCount: number }) {
  const on = { flex: 1, justifyContent: 'center', height: 40 } as const;
  return (
    <div className="p-qf" role="radiogroup" aria-label="Insiden dan kerawanan" style={{ display: 'flex', width: '100%', boxSizing: 'border-box', flex: 'none' }}>
      {active === 'insiden' ? (
        <button type="button" role="radio" aria-checked="true" style={on}>
          Insiden<span className="c">{insCount}</span>
        </button>
      ) : (
        <Link to="/insiden" className="qa" role="radio" aria-checked="false">
          Insiden<span className="c">{insCount}</span>
        </Link>
      )}
      {active === 'kerawanan' ? (
        <button type="button" role="radio" aria-checked="true" style={on}>
          Kerawanan<span className="c">{krwCount}</span>
        </button>
      ) : (
        <Link to="/insiden?tab=kerawanan" className="qa" role="radio" aria-checked="false">
          Kerawanan<span className="c">{krwCount}</span>
        </Link>
      )}
    </div>
  );
}

export function FilterChip({ n, onClick }: { n: number; onClick?: () => void }) {
  return (
    <button type="button" className="p-chip" aria-pressed={n > 0} onClick={onClick} style={{ minHeight: 44 }}>
      <Svg d="M3 6h18M7 12h10M10 18h4" size={15} />
      {n ? `Filter · ${n}` : 'Filter'}
    </button>
  );
}

export function FilterRow({ n, onClick, count }: { n: number; onClick?: () => void; count: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <FilterChip n={n} onClick={onClick} />
      <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{count}</span>
    </div>
  );
}

export function SevTag({ i, suffix }: { i: Incident; suffix?: string }) {
  if (!i.severity) return null;
  return (
    <span className={'p-tag ' + SEV_TAG_CLS[i.severity]}>
      <span className="dot"></span>
      {SEV_LABEL[i.severity]}
      {suffix}
    </span>
  );
}

export function StatusTag({ i, role }: { i: Incident; role: Role }) {
  const s = statusText(i, role);
  return <span className={'p-tag ' + (s.override ?? STATUS_TAG[i.status])}>{s.label}</span>;
}

/** Kartu insiden (`.card`): judul + nomor, baris tag, baris meta. */
export function IncidentCard({ i, tags, kkks, meta }: { i: Incident; tags: ReactNode; kkks?: boolean; meta: ReactNode }) {
  return (
    <Link to={incidentHref(i)} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <b style={{ fontSize: 14, lineHeight: '20px' }}>{i.title}</b>
        <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
          {i.no}
        </span>
      </div>
      {kkks && <span style={{ fontSize: 12, color: 'var(--ink-subtle)', fontWeight: 600 }}>{i.org}</span>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{tags}</div>
      {meta}
    </Link>
  );
}

export const Meta = ({ children }: { children: ReactNode }) => <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{children}</span>;

function EsIcon({ d }: { d: string }) {
  return (
    <span style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--surface-sunken)', color: 'var(--ink-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Svg d={d} size={24} />
    </span>
  );
}
const ES = { flex: 1, justifyContent: 'center', padding: '40px 16px' } as const;
const ES_TXT = { color: 'var(--ink-muted)', maxWidth: 300 } as const;

/** MS08 Memuat. */
export function LoadingScreen() {
  return (
    <ListShell>
      <div role="status" aria-label="Memuat daftar insiden" style={{ display: 'contents' }}>
        <FilterRow n={0} count="" />
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="card" style={{ height: 118, background: 'var(--surface)' }}>
            <span className="p-sk" style={{ height: 14, width: '60%' }}></span>
            <span className="p-sk" style={{ height: 10, width: '85%' }}></span>
            <span className="p-sk" style={{ height: 10, width: '40%' }}></span>
          </div>
        ))}
      </div>
    </ListShell>
  );
}

/** MS09 Kosong. `canCreate` = peran boleh membuat laporan. */
export function EmptyScreen({ canCreate }: { canCreate: boolean }) {
  return (
    <ListShell>
      <div className="lk-es" style={ES}>
        <EsIcon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <b>Belum ada insiden yang dilaporkan.</b>
        <span style={ES_TXT}>Semoga tetap begitu. Bila terjadi, laporkan dari sini atau dari pesan WhatsApp.</span>
        {canCreate && (
          <Link to={REPORT_PATH} className="p-btn p-btn-primary" style={{ minHeight: 44 }}>
            <Svg d="M12 5v14M5 12h14" size={16} />
            Buat laporan
          </Link>
        )}
      </div>
    </ListShell>
  );
}

/** Isi MS10 (ikon, judul, keterangan filter aktif, Hapus filter). */
export function FilterEmptyBody({ desc, onClear }: { desc?: string; onClear: () => void }) {
  return (
    <div className="lk-es" style={ES}>
      <EsIcon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5" />
      <b>Tidak ada insiden yang cocok dengan filter.</b>
      {desc && <span style={ES_TXT}>{desc}</span>}
      <button type="button" className="p-btn p-btn-secondary" style={{ minHeight: 44 }} onClick={onClear}>
        Hapus filter
      </button>
    </div>
  );
}

/** MS10 Filter kosong (layar penuh, dipakai lewat `?state=filter-kosong`). */
export function FilterEmptyScreen({ n, count, desc, onClear, fab }: { n: number; count: string; desc: string; onClear: () => void; fab: boolean }) {
  return (
    <ListShell fab={fab ? <ReportFab /> : undefined}>
      <FilterRow n={n} count={count} />
      <FilterEmptyBody desc={desc} onClear={onClear} />
    </ListShell>
  );
}

/** MS11 Gagal muat. */
export function FailedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <ListShell>
      <div className="lk-es" style={ES} role="alert">
        <EsIcon d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <b>Daftar insiden tidak dapat dimuat.</b>
        <span style={ES_TXT}>Periksa koneksi Anda, lalu coba lagi.</span>
        <button type="button" className="p-btn p-btn-secondary" style={{ minHeight: 44 }} onClick={onRetry}>
          <Svg d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" size={16} />
          Muat ulang
        </button>
      </div>
    </ListShell>
  );
}

/** MS12 Terbatas: layar penuh dengan tombol kembali. */
export function LimitedScreen() {
  return (
    <MobileShell
      title="Detail insiden"
      left="back"
      backTo="/insiden"
      actions={
        <button type="button" className="ib44" aria-label="Aksi lain">
          <Svg d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </button>
      }
    >
      <div className="lk-es" style={ES}>
        <EsIcon d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" />
        <b>Anda tidak punya akses ke insiden ini.</b>
        <span style={ES_TXT}>Insiden ini terbatas atau di luar cakupan Anda. Hubungi Pejabat Berwenang bila perlu melihatnya.</span>
        <Link to="/insiden" className="p-btn p-btn-secondary" style={{ minHeight: 44 }}>
          Kembali ke daftar
        </Link>
      </div>
    </MobileShell>
  );
}
