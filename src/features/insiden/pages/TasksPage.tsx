// Board: V10 (Pejabat), P10 (PIC), P20 (Pejabat, penutupan), T4/T4b (tindak lanjut) — Tugas saya
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { formatWib } from '@/lib/format';
import { tasksFor } from '../logic/list';
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';

/** Halaman Tugas saya (rute /tugas). Daftar dihitung dari store, termasuk tugas tindak lanjut (TL-*, board T4/T4b). */
export function TasksPage() {
  const role = useDemoStore((s) => s.role);
  const incidents = useDemoStore((s) => s.incidents);
  const [search, setSearch] = useState('');
  const followUps = useFollowUps();
  const tasks = useMemo(() => tasksFor(incidents, role, followUps), [incidents, role, followUps]);
  const text = search.trim().toLowerCase();
  const rows = tasks.filter((t) => !text || [t.no, t.title, t.kkks, t.wk].some((x) => x.toLowerCase().includes(text)));

  return (
    <AppShell
      nav="tugas"
      title="Tugas saya"
      subtitle="Pengajuan dari semua modul yang menunggu keputusan, pemeriksaan, atau tinjauan Anda."
    >
      <section className="p-card" style={{ padding: 0 }}>
        <div className="p-toolbar" style={{ padding: '16px 20px 12px' }}>
          <h2 className="p-h2" style={{ flex: 1 }}>
            Menunggu Anda{' '}
            <span className="p-count" style={{ marginLeft: 6 }}>
              {tasks.length}
            </span>
          </h2>
          <label className="p-input" style={{ width: 260, height: 36 }}>
            <Icon name="search" size={16} style={{ color: 'var(--ink-muted)' }} />
            <input
              className="ph"
              aria-label="Cari KKKS, WK, atau nomor"
              placeholder="Cari KKKS, WK, atau nomor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit' }}
            />
          </label>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm">
            <Icon name="filter" size={15} />
            Filter
          </button>
        </div>
        {rows.length > 0 ? (
          <>
            <table className="p-table lk-tbl tg-t">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Tugas</th>
                  <th>Modul</th>
                  <th>KKKS · wilayah kerja</th>
                  <th>Masuk</th>
                  <th style={{ paddingRight: 20, width: 110 }}>
                    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.no}>
                    <td style={{ paddingLeft: 20 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link to={r.href} className="tg-n">
                          {r.title}
                        </Link>
                        <span className={'p-tag ' + r.cls} style={{ height: 20, fontSize: 11 }}>
                          {r.st}
                        </span>
                      </span>
                      <span className="tg-d">{r.desc}</span>
                    </td>
                    <td>{r.module}</td>
                    <td>
                      <span>{r.kkks}</span>
                      <span className="sub">{r.wk}</span>
                    </td>
                    <td>
                      {r.old ? (
                        <span className="tg-old" title="Lebih dari 1 hari kerja">
                          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 13, height: 13 }}>
                            <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2" />
                          </svg>
                          {formatWib(r.at)}
                        </span>
                      ) : (
                        <span>{formatWib(r.at)}</span>
                      )}
                      <span className="sub">{r.from}</span>
                    </td>
                    <td style={{ paddingRight: 20, textAlign: 'right' }}>
                      <Link to={r.href} className="p-btn p-btn-secondary p-btn-sm">
                        {r.cta}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-pager">
              <span>{rows.length} tugas · urut dari yang paling lama menunggu</span>
              <span></span>
            </div>
          </>
        ) : (
          <div className="lk-es">
            <svg className="il" viewBox="0 0 96 72" width="96" height="72" aria-hidden="true">
              <rect className="pa ln" x="16" y="10" width="52" height="52" rx="6" />
              <path className="ln" d="M28 26h28M28 36h20" />
              <circle className="ac ln" cx="68" cy="50" r="12" />
              <path className="ln" d="M64 50h8" />
            </svg>
            <b>{tasks.length === 0 ? 'Tidak ada tugas yang menunggu Anda.' : 'Tidak ada tugas yang cocok dengan pencarian.'}</b>
          </div>
        )}
      </section>
    </AppShell>
  );
}
