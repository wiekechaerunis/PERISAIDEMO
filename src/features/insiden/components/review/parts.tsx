// Bagian kecil layar Review (board V12): ikon bebas, kolom pilih (combobox), kartu isi, lampiran, toast.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { Incident } from '@/services/types';
import { SEV_LABEL } from '@/lib/severity';
import { formatNumber, formatRupiah, formatWibFull } from '@/lib/format';
import { KB } from '../step2Data';

/** Ikon dengan path langsung dari board (viewBox 24). */
export function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
      <path d={d} />
    </svg>
  );
}

export interface Opt {
  key: string;
  label: string;
  caption?: string;
  /** isi kiri (titik keparahan, avatar) */
  lead?: ReactNode;
}

interface SelectProps {
  label: ReactNode;
  ariaLabel: string;
  /** isi tampilan nilai terpilih */
  display: ReactNode;
  lead?: ReactNode;
  placeholder?: boolean;
  options: Opt[];
  selected: string | null;
  onPick: (key: string) => void;
  group?: string;
  disabled?: boolean;
  help?: ReactNode;
  popStyle?: React.CSSProperties;
}

/** Combobox kecil: `p-input` sebagai pemicu, daftar `in-pop` (pola sama dengan CategoryFields). */
export function SelectField({ label, ariaLabel, display, lead, placeholder, options, selected, onPick, group, disabled, help, popStyle }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  return (
    <div ref={ref} className={label === null ? undefined : 'p-field'} style={label === null ? { display: 'contents' } : undefined}>
      {label}
      <div className="in-cbx">
        <button
          type="button" className="p-input rv-sel" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
          disabled={disabled} onClick={() => setOpen(!open)}
        >
          {lead}
          <span className={placeholder ? 'ph' : ''} style={{ flex: 1 }}>{display}</span>
          <Icon name="chevDown" size={16} />
        </button>
        {open && (
          <div className="in-pop" role="listbox" aria-label={ariaLabel} style={popStyle}>
            {group && <div className="grp">{group}</div>}
            {options.map((o) => (
              <button
                key={o.key} type="button" role="option" className={selected === o.key ? 'op on' : 'op'} aria-selected={selected === o.key}
                onClick={() => { onPick(o.key); setOpen(false); }} style={{ minHeight: 44 }}
              >
                {o.lead}
                <span className="t"><b>{o.label}</b>{o.caption && <span>{o.caption}</span>}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {help}
    </div>
  );
}

export const SevDot = ({ dot }: { dot: string }) => (
  <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flex: 'none' }} />
);

const HANDLED: Record<string, string> = { belum: 'Belum ada', int: 'Tim internal', bujp: 'BUJP', tni: 'TNI', polri: 'Polri' };

const opsText = (d: NonNullable<Incident['detail']>) =>
  d.ops === 'berhenti' ? `Berhenti${d.opsHours ? ` · ${d.opsHours} jam` : ''}`
    : d.ops === 'sebagian' ? `Terganggu sebagian${d.opsHours ? ` · ${d.opsHours} jam` : ''}` : 'Tidak terganggu';
const casualtyText = (d: NonNullable<Incident['detail']>) => {
  const parts = Object.entries(d.casualties).filter(([k, n]) => k === 'belum' || (n ?? 0) > 0)
    .map(([k, n]) => { const kb = KB.find((x) => x[0] === k); return kb ? (k === 'belum' ? kb[1] : `${kb[1]} · ${formatNumber(n ?? 0)}`) : ''; })
    .filter(Boolean);
  return parts.length ? parts.join(', ') : 'Tidak terdampak';
};

const MAP_ICON = 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14';
const meta = (d: string, size?: number) => <Ic d={d} size={size} />;

/** Kartu isi insiden (InsIsi.dc.html): data dari store. */
export function IncidentContentCard({ incident: i }: { incident: Incident }) {
  const d = i.detail;
  const sev = d?.reporterSeverity ?? i.severity;
  const urg = sev === 'tinggi' || sev === 'kritis';
  const kota = i.area.split(' · ')[0];
  const filed = i.timeline?.[0]?.at;
  const dt: React.CSSProperties = { margin: 0, display: 'flex', flexDirection: 'column', gap: 2 };
  const cell: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 };
  const box: React.CSSProperties = { background: 'var(--surface-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', gap: 12 };
  const boxIc: React.CSSProperties = { width: 18, height: 18, color: 'var(--ink-muted)', marginTop: 1 };
  return (
    <article className="p-card" aria-labelledby="ins-judul" style={{ padding: 0, overflow: 'hidden', fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: '18px', color: 'var(--ink)', boxSizing: 'border-box' }}>
      <header style={{ padding: '24px 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="p-mono" style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-muted)' }}>{i.no}</span>
        <h2 id="ins-judul" style={{ margin: 0, fontSize: 22, lineHeight: '30px', fontWeight: 700 }}>{i.title}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          <span className="lk-meta">{meta('M7 18v-6a5 5 0 0 1 10 0v6M5 21h14v-3H5zM12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4')}Jenis: Insiden</span>
          <span className="lk-meta">{meta('M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01')}{i.category}</span>
          <span className="lk-meta">{meta('M3 5h18v16H3zM16 3v4M8 3v4M3 10h18')}Kejadian {formatWibFull(i.occurredAt)}</span>
          {sev && (
            <span className={urg ? 'lk-meta urg' : 'lk-meta'}>
              {meta('M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z')}
              Keparahan awal: {SEV_LABEL[sev]}
            </span>
          )}
        </div>
      </header>
      <div style={{ padding: '20px 24px 4px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 className="p-lbl" style={{ margin: 0 }}>Dampak keamanan</h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: '22px' }}>{d?.securityImpact || i.title}</p>
      </div>
      <dl style={{ margin: '16px 24px 20px 24px', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 28px' }}>
        <div style={cell}>
          <dt className="p-lbl">Lokasi</dt>
          <dd style={dt}>
            <span>{d?.patokan || i.location}</span>
            <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>Kab. {kota} · {i.wk}</span>
            <a href="#" className="p-link" onClick={(e) => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, alignSelf: 'flex-start' }} title={d?.lat != null ? `${d.lat}, ${d.lng}` : undefined}>
              <Ic d={MAP_ICON} size={14} />Lihat di peta
            </a>
          </dd>
        </div>
        <div style={cell}>
          <dt className="p-lbl">Sudah menangani (menurut pelapor)</dt>
          <dd style={dt}>
            <span>{d?.handledBy.length ? d.handledBy.map((h) => HANDLED[h] ?? h).join(', ') : 'Belum ada'}</span>
            <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>Mitra dan kontraknya dicatat PIC saat penanganan</span>
          </dd>
        </div>
        <div style={cell}>
          <dt className="p-lbl">Pelapor</dt>
          <dd style={dt}>
            <span>{i.reporter}</span>
            {filed && <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>Diajukan {formatWibFull(filed)}</span>}
          </dd>
        </div>
        <div style={cell}>
          <dt className="p-lbl">Sumber informasi</dt>
          <dd style={dt}><span>{i.source === 'wa' ? 'WhatsApp' : 'Temuan langsung'}</span></dd>
        </div>
      </dl>
      <div style={{ padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <div style={box}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={boxIc}><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><h3 className="p-lbl" style={{ margin: 0 }}>Kondisi operasi</h3><p style={{ margin: 0, lineHeight: '20px', fontWeight: 600 }}>{d ? opsText(d) : 'Tidak terganggu'}</p></div>
        </div>
        <div style={box}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={boxIc}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><h3 className="p-lbl" style={{ margin: 0 }}>Korban</h3><p style={{ margin: 0, lineHeight: '20px', fontWeight: 600 }}>{d ? casualtyText(d) : 'Tidak terdampak'}</p></div>
        </div>
        <div style={box}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={boxIc}><path d="M2 7h20v12H2zM16 13h.01M2 11h20" /></svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><h3 className="p-lbl" style={{ margin: 0 }}>Perkiraan kerugian</h3><p style={{ margin: 0, lineHeight: '20px', fontWeight: 600 }}>{d?.lossIdr ? formatRupiah(d.lossIdr) : 'Belum diisi'}</p></div>
        </div>
      </div>
    </article>
  );
}

const mb = (kb: number) => `${(kb / 1024).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`;

export function AttachmentsCard({ files }: { files: NonNullable<Incident['detail']>['attachments'] }) {
  return (
    <section className="p-card">
      <div className="lk-card-head" style={{ marginBottom: 12 }}>
        <h2 className="p-h2">Lampiran · {files.length} file</h2>
        <span className="lk-lock" style={{ fontSize: 12 }}><Ic d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" size={14} />Terkunci sampai diverifikasi</span>
      </div>
      {files.length === 0 ? (
        <span className="p-cap">Tidak ada lampiran.</span>
      ) : (
        <div className="p-files">
          {files.map((f) => (
            <div className="p-file" key={f.name}>
              <span className="fi">{(f.name.split('.').pop() ?? '').toUpperCase()}</span>
              <div className="grow">
                <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</b>
                <span className="p-cap">{mb(f.sizeKb)}</span>
                {f.caption && (
                  <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Keterangan:</span> {f.caption}
                  </span>
                )}
              </div>
              <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Pratinjau">
                <Ic d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Toast di pojok kanan bawah (board V14 / VS2). */
export function RvToast({ text, error, onClose }: { text: string; error?: boolean; onClose?: () => void }) {
  useEffect(() => {
    if (!onClose) return;
    const id = setTimeout(onClose, 6000);
    return () => clearTimeout(id);
  }, [text, onClose]);
  return (
    <div className="rv-toastpos">
      <div className={error ? 'p-toast err' : 'p-toast'} role={error ? 'alert' : 'status'}>
        <span className="ti"><Icon name={error ? 'close' : 'check'} size={12} /></span>
        <span className="msg">{text}</span>
      </div>
    </div>
  );
}
