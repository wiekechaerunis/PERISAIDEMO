// Tabel daftar insiden per susunan kolom: Main (pelapor), V11 (pemeriksaan), P21/P11 (tenggat), I31 (SKK).
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { formatDateShort, formatDate, formatWib } from '@/lib/format';
import { SEV_LABEL, SEV_TAG_CLS } from '@/lib/severity';
import { STATUS_TAG, type Incident } from '@/services/types';
import type { Role } from '@/lib/rbac';
import { actionFor, closedAtShort, dueIndicator, rowHref, rowMenu, statusText, verifyIndicator, type ListLayout, type RowMenuItem } from '../../logic/list';
import { RowMenu } from './RowMenu';

interface Props {
  rows: Incident[];
  layout: ListLayout;
  role: Role;
  me: string;
  /** tampilkan teks tindakan di bawah status (hanya pelapor, pintasan Semua / Perlu tindakan) */
  showAction: boolean;
  /** aksi menu ⋯ yang dijalankan di halaman daftar (Hapus draf) */
  onRowAction?: (i: Incident, it: RowMenuItem) => void;
}


function Tip({ label, text, children }: { label: string; text: string; children: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {children}
      <span className="in-tw">
        <button type="button" className="ib" aria-label={label}>
          <Icon name="info" size={14} />
        </button>
        <span className="in-tip" role="tooltip">
          {text}
        </span>
      </span>
    </span>
  );
}

function SevTag({ r }: { r: Incident }) {
  return r.severity ? (
    <span className={'p-tag ' + SEV_TAG_CLS[r.severity]}>
      <span className="dot"></span>
      {SEV_LABEL[r.severity]}
    </span>
  ) : (
    <span className="sub">—</span>
  );
}

function Title({ r, role }: { r: Incident; role: Role }) {
  return (
    <td style={{ paddingLeft: 16 }}>
      <Link className="ttl" to={rowHref(r, role)}>
        {r.title}
      </Link>
      <span className="id">{r.no}</span>
    </td>
  );
}

function StatusTag({ r, role }: { r: Incident; role: Role }) {
  const s = statusText(r, role);
  return <span className={'p-tag ' + (s.override ?? STATUS_TAG[r.status])}>{s.label}</span>;
}

const ActTh = () => (
  <th style={{ width: 52, paddingRight: 12 }}>
    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Aksi</span>
  </th>
);

export function IncidentTable({ rows, layout, role, me, showAction, onRowAction }: Props) {
  const Act = ({ r }: { r: Incident }) => (
    <td className="ls-act" style={{ position: 'relative' }}>
      <RowMenu no={r.no} items={rowMenu(r, role)} onAction={(it) => onRowAction?.(r, it)} />
    </td>
  );
  if (layout === 'verifikasi') {
    return (
      <table className="p-table lk-tbl" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ paddingLeft: 16 }}>Insiden</th>
            <th>Kategori · lokasi</th>
            <th>Keparahan awal</th>
            <th>
              <Tip
                label="Penjelasan batas pemeriksaan"
                text="Batas waktu pemeriksaan, dihitung dari waktu registrasi sesuai aturan alur insiden."
              >
                Batas pemeriksaan
              </Tip>
            </th>
            <th>Status</th>
            <ActTh />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const waiting = r.status === 'review-internal' && r.verifyDueAt;
            const ind = waiting ? verifyIndicator(r.verifyDueAt!) : null;
            return (
              <tr key={r.no}>
                <Title r={r} role={role} />
                <td>
                  {r.category}
                  <div className="sub">{r.area}</div>
                </td>
                <td>
                  <SevTag r={r} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {waiting ? `${formatDateShort(r.verifyDueAt!)}, ${r.verifyDueAt!.slice(11, 16)}` : '—'}
                  <div className={ind?.late ? 'lk-dl' : 'p-cap'}>{ind?.text ?? ''}</div>
                </td>
                <td>
                  <StatusTag r={r} role={role} />
                </td>
                <Act r={r} />
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  if (layout === 'penutupan' || layout === 'pic') {
    return (
      <table className="p-table lk-tbl" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ paddingLeft: 16 }}>Insiden</th>
            <th>Kategori · lokasi</th>
            <th>Keparahan</th>
            <th>PIC</th>
            <th>
              <Tip
                label="Penjelasan tenggat penanganan"
                text="Batas waktu menyelesaikan insiden, dihitung dari waktu registrasi sesuai keparahan. Bila diubah, alasan ada di riwayat."
              >
                Tenggat
              </Tip>
            </th>
            <th>Status</th>
            <ActTh />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const active = (r.status === 'dalam-penanganan' || r.status === 'minta-ditutup') && r.handleDueAt;
            const ind = active ? dueIndicator(r.handleDueAt!) : null;
            const note =
              r.status === 'ditutup'
                ? ('ditutup ' + closedAtShort(r.no)).trim()
                : r.status === 'review-internal'
                  ? 'belum diperiksa'
                  : '';
            return (
              <tr key={r.no}>
                <Title r={r} role={role} />
                <td>
                  {r.category}
                  <div className="sub">{r.area}</div>
                </td>
                <td>
                  <SevTag r={r} />
                </td>
                <td>{r.pic ?? '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {active ? formatDate(r.handleDueAt!) : '—'}
                  <div className={ind ? ind.cls : 'p-cap'} style={{ display: 'flex' }}>
                    {ind ? ind.text : note}
                  </div>
                </td>
                <td>
                  <StatusTag r={r} role={role} />
                </td>
                <Act r={r} />
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  if (layout === 'skk') {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="p-table lk-tbl" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: 16 }}>Insiden</th>
              <th>KKKS</th>
              <th>Kategori · lokasi</th>
              <th>Keparahan</th>
              <th>Waktu kejadian</th>
              <th style={{ paddingRight: 16 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.no}>
                <Title r={r} role={role} />
                <td>{r.org}</td>
                <td>
                  {r.category}
                  <div className="sub">{r.area}</div>
                </td>
                <td>
                  <SevTag r={r} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatWib(r.occurredAt)}</td>
                <td style={{ paddingRight: 16 }}>
                  <StatusTag r={r} role={role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="p-table lk-tbl" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ paddingLeft: 16 }}>Insiden</th>
            <th>Kategori · lokasi</th>
            <th>Keparahan</th>
            <th>Waktu kejadian</th>
            <th>Status</th>
            <th>PIC</th>
            <ActTh />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const act = showAction ? actionFor(r, role) : '';
            return (
              <tr key={r.no}>
                <Title r={r} role={role} />
                <td>
                  {r.category}
                  <div className="sub">{r.location}</div>
                </td>
                <td>
                  <SevTag r={r} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatWib(r.occurredAt)}</td>
                <td>
                  <StatusTag r={r} role={role} />
                  {act && (
                    <div className="sub" style={{ color: 'var(--caution-ink)', fontWeight: 600 }}>
                      {act}
                    </div>
                  )}
                </td>
                <td>
                  {r.pic ?? '—'}
                  {r.pic === me && (
                    <span className="p-tag t-info" style={{ marginLeft: 6, height: 20 }}>
                      Anda
                    </span>
                  )}
                </td>
                <Act r={r} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
