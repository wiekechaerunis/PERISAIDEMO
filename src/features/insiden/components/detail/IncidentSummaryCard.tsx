// Kartu isi insiden (board InsIsi.dc.html), dirender dari data store.
import type { Incident } from '@/services/types';
import { SEV_EQUIV, SEV_LABEL, isHighOrCritical } from '@/lib/severity';
import { formatWibFull } from '@/lib/format';
import { Ic } from './Ic';
import { areaLine, casualtyText, detailOf, handledText, lossText, opsText, registeredAt, submittedEntry } from './detailLogic';
import { useWaSource } from '@/features/whatsapp/logic/source';

const box = { background: 'var(--surface-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', gap: 12 } as const;
const icn = { width: 18, height: 18, color: 'var(--ink-muted)', marginTop: 1 } as const;
const field = { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 } as const;
const dd = { margin: 0, display: 'flex', flexDirection: 'column', gap: 2 } as const;

export function IncidentSummaryCard({ incident: i }: { incident: Incident }) {
  const WA_SOURCE = useWaSource(i);
  const d = detailOf(i);
  const sev = i.severity;
  const sevCls = isHighOrCritical(sev) ? 'lk-meta urg' : 'lk-meta';
  return (
    <article className="p-card" aria-labelledby="ins-judul" style={{ padding: 0, overflow: 'hidden', fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: '18px', color: 'var(--ink)', boxSizing: 'border-box' }}>
      <header style={{ padding: '24px 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="p-mono" style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-muted)' }}>{i.no}</span>
        <h2 id="ins-judul" style={{ margin: 0, fontSize: 22, lineHeight: '30px', fontWeight: 700 }}>{i.title}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          <span className="lk-meta"><Ic d="building" />Jenis: Insiden</span>
          <span className="lk-meta"><Ic d="tag" />{i.category}</span>
          <span className="lk-meta"><Ic d="calendar" />Kejadian {formatWibFull(i.occurredAt)}</span>
          <span className={sevCls}>
            <Ic d="warn" />
            {sev ? `Keparahan awal: ${SEV_LABEL[sev]} · setara ${SEV_EQUIV[sev]}` : 'Keparahan awal: belum ditentukan'}
          </span>
        </div>
      </header>
      <div style={{ padding: '20px 24px 4px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 className="p-lbl" style={{ margin: 0 }}>Dampak keamanan</h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: '22px' }}>{d.securityImpact || i.title}</p>
      </div>
      <dl style={{ margin: '16px 24px 20px 24px', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 28px' }}>
        <div style={field}>
          <dt className="p-lbl">Lokasi</dt>
          <dd style={dd}>
            <span>{d.patokan || i.location}</span>
            <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>{areaLine(i)}</span>
            {d.lat !== null && d.lng !== null && (
              <a href="#peta" className="p-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, alignSelf: 'flex-start' }} title={`${d.lat}, ${d.lng}`} onClick={(e) => e.preventDefault()}>
                <Ic d="map" size={14} />Lihat di peta
              </a>
            )}
          </dd>
        </div>
        <div style={field}>
          <dt className="p-lbl">Sudah menangani (menurut pelapor)</dt>
          <dd style={dd}>
            <span>{handledText(d)}</span>
            <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>Mitra dan kontraknya dicatat PIC saat penanganan</span>
          </dd>
        </div>
        <div style={field}>
          <dt className="p-lbl">Pelapor</dt>
          <dd style={dd}>
            <span>{i.reporter}</span>
            <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>Diajukan {formatWibFull(submittedEntry(i)?.at ?? registeredAt(i))}</span>
          </dd>
        </div>
        <div style={field}>
          <dt className="p-lbl">Sumber informasi</dt>
          <dd style={dd}>
            <span>{i.source === 'wa' ? `WhatsApp · ${WA_SOURCE.group} · ${WA_SOURCE.sender}` : 'Temuan langsung'}</span>
          </dd>
        </div>
      </dl>
      <div style={{ padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <div style={box}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={icn}><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><h3 className="p-lbl" style={{ margin: 0 }}>Kondisi operasi</h3><p style={{ margin: 0, lineHeight: '20px', fontWeight: 600 }}>{opsText(d)}</p></div>
        </div>
        <div style={box}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={icn}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><h3 className="p-lbl" style={{ margin: 0 }}>Korban</h3><p style={{ margin: 0, lineHeight: '20px', fontWeight: 600 }}>{casualtyText(d)}</p></div>
        </div>
        <div style={box}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={icn}><path d="M2 7h20v12H2zM16 13h.01M2 11h20" /></svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><h3 className="p-lbl" style={{ margin: 0 }}>Perkiraan kerugian</h3><p style={{ margin: 0, lineHeight: '20px', fontWeight: 600 }}>{lossText(d)}</p></div>
        </div>
      </div>
    </article>
  );
}
