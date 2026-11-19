// Bagian bersama layar Kerawanan: chip meta, sel fakta, tautan peta, kartu Lampiran, node riwayat (board KD1/KD4).
import type { ReactNode } from 'react';
import { Ic } from '../review/parts';
import { formatSize } from '../../logic/attachments';

export const P = {
  warn: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
  cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
  hat: 'M7 18v-6a5 5 0 0 1 10 0v6M5 21h14v-3H5zM12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ops: 'M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  wallet: 'M2 7h20v12H2zM16 13h.01M2 11h20',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  up: 'M12 19V5M5 12l7-7 7 7',
  plus: 'M12 5v14M5 12h14',
  group: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
};

export const MetaChip = ({ d, children }: { d: string; children: ReactNode }) => (
  <span className="lk-meta">
    <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
    {children}
  </span>
);

export const Fact = ({ term, children }: { term: string; children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
    <dt className="p-lbl">{term}</dt>
    <dd style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</dd>
  </div>
);

export const Cap = ({ children, mono }: { children: ReactNode; mono?: boolean }) => (
  <span className={'p-cap' + (mono ? ' p-mono' : '')} style={{ color: 'var(--ink-subtle)' }}>{children}</span>
);

export function MapLink({ lat, lng }: { lat: number; lng: number }) {
  const t = `${lat}, ${lng}`;
  return (
    <a href="#" className="p-link" onClick={(e) => e.preventDefault()} title={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, alignSelf: 'flex-start' }}>
      <Ic d={P.map} size={14} />Lihat di peta
    </a>
  );
}

export function FilesCard({ files }: { files: { name: string; sizeKb: number; caption: string }[] }) {
  return (
    <section className="p-card">
      <div className="lk-card-head" style={{ marginBottom: 12 }}><h2 className="p-h2">Lampiran · {files.length} file</h2></div>
      <div className="p-files">
        {files.map((f) => (
          <div className="p-file" key={f.name}>
            <span className="fi">{(f.name.split('.').pop() ?? '').toUpperCase()}</span>
            <div className="grow">
              <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>{f.name}</b>
              <span className="p-row" style={{ gap: 8, flexWrap: 'wrap' }}><span className="p-cap">{formatSize(f.sizeKb)}</span></span>
              {f.caption && (
                <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>
                  <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Keterangan:</span> {f.caption}
                </span>
              )}
            </div>
            <span className="p-row" style={{ gap: 2, flex: 'none' }}>
              <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Pratinjau"><Ic d={P.eye} size={15} /></button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Satu baris Riwayat (`p-tl`): node bulat + judul, rincian, waktu. */
export function TlItem({ cls, icon, children }: { cls: string; icon: string; children: ReactNode }) {
  return (
    <li>
      <span className={cls}>
        <svg className="p-ic" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d={icon} /></svg>
      </span>
      <div>{children}</div>
    </li>
  );
}

export const minutesBetween = (a: string, b: string) => Math.round((new Date(b + 'Z').getTime() - new Date(a + 'Z').getTime()) / 60_000);
