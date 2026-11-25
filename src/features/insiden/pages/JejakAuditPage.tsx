// Halaman Jejak audit tersaring ke satu insiden (board P34-Riwayat, B-21, PS8). Rute: /insiden/:no/jejak-audit.
// Crumb Insiden › {nomor} › Jejak audit; pil "Objek: {nomor}" (Hapus filter = semua jejak yang boleh dilihat); kolom Waktu, Pelaku
// (+organisasi), Sebagai, Modul, Aksi, Objek, Hasil; Filter, Ekspor CSV; panel samping Detail jejak audit.
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { formatWibFull } from '@/lib/format';
import { DEMO_USERS } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import type { Incident } from '@/services/types';
import { HandlingShell } from '../components/handling/HandlingShell';
import { scopedIncidents } from '../logic/list';

export interface AuditRow {
  id: string;
  at: string;
  who: string;
  org: string;
  as: string;
  action: string;
  objNo: string;
  hash: string;
  detail: string;
}

const hash = (no: string) => '#' + [...no].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(16).padStart(8, '0').slice(0, 8);

/** Peran pelaku saat aksi (role aktif). */
function asOf(i: Incident, who: string): string {
  const u = Object.values(DEMO_USERS).find((x) => x.name === who);
  if (who === i.pic) return 'PIC penanganan';
  if (u?.role === 'pejabat' || /Wulandari|Saputra|Anggraini/.test(who)) return 'R-06 Pejabat Berwenang';
  if (u?.role === 'pengawas') return 'Pengawas SKK';
  if (who === i.reporter || u?.role === 'pelapor') return 'R-05 Pelapor KKKS';
  return u?.roleLabel ?? 'Pengguna KKKS';
}

/** Kalimat aksi: klausa pertama entri Riwayat ("Menyetujui insiden", "Memperbarui dampak", …). */
const actionOf = (t: string) => t.split(/: |\. /)[0].replace(/\.$/, '');

export function auditRows(i: Incident): AuditRow[] {
  const entries = [...(i.timeline ?? []), ...(i.handling?.notes ?? []).map((n) => ({ ...n, text: `Menambah catatan penanganan: ${n.text}` }))];
  return entries
    .map((e, n) => ({
      id: `${i.no}-${n}`, at: e.at, who: e.by, org: /SKK|Wijaya/.test(e.by) ? 'SKK Migas' : i.org, as: asOf(i, e.by),
      action: actionOf(e.text), objNo: i.no, hash: hash(i.no), detail: e.text,
    }))
    .sort((a, b) => b.at.localeCompare(a.at));
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

export function JejakAuditPage() {
  const { no = '' } = useParams();
  const role = useDemoStore((s) => s.role);
  const all = useDemoStore((s) => s.incidents);
  const [onlyThis, setOnlyThis] = useState(true);
  const [open, setOpen] = useState<AuditRow | null>(null);
  const rows = useMemo(() => {
    const pool = onlyThis ? all.filter((x) => x.no === no) : scopedIncidents(all, role);
    return pool.flatMap(auditRows).sort((a, b) => b.at.localeCompare(a.at));
  }, [all, no, onlyThis, role]);
  const exportCsv = () => {
    const head = ['Waktu', 'Pelaku', 'Organisasi', 'Sebagai', 'Modul', 'Aksi', 'Objek', 'Hasil'];
    const body = rows.map((r) => [formatWibFull(r.at), r.who, r.org, r.as, 'M-05 Insiden', r.action, `${r.hash} ${r.objNo}`, 'Berhasil'].map(csvCell).join(','));
    const url = URL.createObjectURL(new Blob([[head.map(csvCell).join(','), ...body].join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `jejak-audit-${onlyThis ? no : 'semua'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <HandlingShell
      title="Jejak audit" backTo={`/insiden/${no}`}
      crumbs={[{ label: 'Insiden', to: '/insiden' }, { label: no, to: `/insiden/${no}` }, { label: 'Jejak audit' }]}
      acts={<span className="p-cap">Periode: <b>Sejak dibuat</b></span>}
      overlay={
        open && (
          <>
            <div className="in-scrim" onClick={() => setOpen(null)}></div>
            <aside className="lk-side" role="dialog" aria-modal="true" aria-label="Detail jejak audit" style={{ position: 'fixed' }}>
              <div className="sh">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <b style={{ fontSize: 16 }}>Detail jejak audit</b>
                  <span className="p-cap">Rincian satu catatan: siapa, kapan, apa yang diubah, dan nilai sebelum serta sesudahnya.</span>
                </div>
                <button type="button" className="p-ibtn ghost" aria-label="Tutup panel" onClick={() => setOpen(null)}><Icon name="close" size={16} /></button>
              </div>
              <div className="sb">
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><b>{open.action} · {open.objNo}</b><span className="p-tag t-ok">Berhasil</span></span>
                <span className="p-cap">{formatWibFull(open.at)}</span>
                <dl className="lk-kv1" style={{ gridTemplateColumns: '110px minmax(0, 1fr)' }}>
                  <dt>Pelaku</dt><dd>{open.who}<div className="sub">{open.as} · {open.org}</div></dd>
                  <dt>Modul</dt><dd>M-05 Insiden</dd>
                  <dt>Objek</dt><dd>Insiden atau kerawanan<div className="sub">{open.hash} · {open.objNo}</div></dd>
                  <dt>Isi catatan</dt><dd>{open.detail}</dd>
                </dl>
              </div>
            </aside>
          </>
        )
      }
    >
      <section className="p-card" style={{ padding: 0 }}>
        <div className="p-toolbar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h2 className="p-h2">Daftar jejak audit</h2>
            <span className="p-cap">{rows.length} entri · {onlyThis ? 'sejak insiden dibuat' : 'semua yang boleh Anda lihat'}, terbaru di atas</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="p-btn p-btn-secondary p-btn-sm" aria-label={`Filter${onlyThis ? ', 1 aktif' : ''}`}>
              <Icon name="filter" size={16} />Filter{onlyThis && <span className="p-count" style={{ background: 'var(--action)', color: 'var(--on-action)' }}>1</span>}
            </button>
            <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={exportCsv}>Ekspor CSV</button>
          </div>
        </div>
        {onlyThis && (
          <div className="lk-applied">
            <button type="button" className="p-chip" aria-pressed="true" aria-label={`Hapus filter Objek: ${no}`} onClick={() => setOnlyThis(false)}>
              Objek: {no}<Icon name="close" size={14} />
            </button>
            <button type="button" className="p-link" onClick={() => setOnlyThis(false)}>Hapus filter</button>
            <span className="p-cap">Dibuka dari Riwayat insiden. Hapus filter untuk melihat semua jejak audit yang boleh Anda lihat.</span>
          </div>
        )}
        {rows.length === 0 ? (
          <div className="lk-es"><b>Tidak ada jejak audit yang cocok dengan filter.</b></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="p-table lk-tbl" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 16 }}>Waktu</th><th>Pelaku</th><th>Sebagai</th><th>Modul</th><th>Aksi</th><th>Objek</th><th style={{ paddingRight: 16 }}>Hasil</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setOpen(r)} style={{ cursor: 'pointer' }}>
                    <td style={{ paddingLeft: 16, whiteSpace: 'nowrap' }}>{formatWibFull(r.at)}</td>
                    <td>{r.who}<div className="sub">{r.org}</div></td>
                    <td>{r.as}</td>
                    <td>M-05<div className="sub">Insiden</div></td>
                    <td><button type="button" className="lk-alink" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => setOpen(r)}>{r.action}</button></td>
                    <td>Insiden atau kerawanan<div className="sub">{r.hash} · {r.objNo}</div></td>
                    <td style={{ paddingRight: 16 }}><span className="p-tag t-ok">Berhasil</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </HandlingShell>
  );
}
