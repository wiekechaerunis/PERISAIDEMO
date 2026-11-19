import type { IncidentDetail } from '@/services/types';
import { extLabel, formatSize } from '../../logic/attachments';
import { Ic } from './Ic';

/** Kartu Lampiran (I15, I32, V14). `locked` = teks "Terkunci sampai diperiksa" (hanya Pelapor, sebelum pemeriksaan). */
export function AttachmentsCard({ files, locked }: { files: IncidentDetail['attachments']; locked?: boolean }) {
  return (
    <section className="p-card">
      <div className="lk-card-head" style={{ marginBottom: 12 }}>
        <h2 className="p-h2">Lampiran · {files.length} file</h2>
        {locked && (
          <span className="lk-lock" style={{ fontSize: 12 }}>
            <Ic d="lock" size={14} />
            Terkunci sampai diperiksa
          </span>
        )}
      </div>
      <div className="p-files">
        {files.map((f) => (
          <div className="p-file" key={f.name}>
            <span className="fi">{extLabel(f.name)}</span>
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
              <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Pratinjau">
                <Ic d="eye" size={15} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
