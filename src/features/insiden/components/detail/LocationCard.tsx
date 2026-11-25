// Kartu Lokasi terpisah di kolom kanan, di bawah Ringkasan (board InsLokasi, B-20): peta, Lokasi, Patokan, Kabupaten/kota,
// Wilayah kerja, Koordinat, Buka di peta. Peta skematik seperti pemilih lokasi (bukan tile sungguhan).
import type { Incident } from '@/services/types';
import { Ic } from './Ic';
import { areaLine, detailOf, wkShort } from './detailLogic';

export function LocationCard({ incident: i }: { incident: Incident }) {
  const d = detailOf(i);
  const coord = d.lat !== null && d.lng !== null ? `${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}` : '—';
  const kab = areaLine(i).split(' · ')[0];
  return (
    <section className="p-card in-sec" aria-labelledby="lok-h">
      <div className="lk-card-head" style={{ marginBottom: 12 }}>
        <h2 className="in-h" id="lok-h" style={{ margin: 0 }}>Lokasi</h2>
        <a href="#peta" className="p-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }} onClick={(e) => e.preventDefault()}>
          <Ic d="map" size={14} />Buka di peta
        </a>
      </div>
      <div
        role="img" aria-label={`Peta lokasi ${d.patokan || i.location}`}
        style={{ position: 'relative', height: 140, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#E3ECEF', boxShadow: 'inset 0 0 0 1px var(--border)' }}
      >
        <svg viewBox="0 0 260 140" width="100%" height="140" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 96 C 60 84 110 118 260 92 L260 140 L0 140Z" fill="#D6E4F5" />
          <path d="M0 40 L260 58" stroke="#fff" strokeWidth="6" />
          <path d="M80 0 L96 140" stroke="#fff" strokeWidth="4" />
        </svg>
        <span style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%, -100%)' }}>
          <svg viewBox="0 0 34 44" width="22" height="28" aria-hidden="true">
            <path d="M17 43s15-13.5 15-26A15 15 0 0 0 2 17c0 12.5 15 26 15 26z" fill="#1C1D21" />
            <circle cx="17" cy="17" r="6.5" fill="#BED630" />
          </svg>
        </span>
        <span style={{ position: 'absolute', right: 8, bottom: 6, fontSize: 10, color: 'var(--ink-muted)', background: 'rgba(255,255,255,.8)', padding: '1px 6px', borderRadius: 4 }}>
          © OpenStreetMap contributors
        </span>
      </div>
      <dl className="lk-kv1" style={{ gridTemplateColumns: '110px minmax(0, 1fr)', marginTop: 12 }}>
        <dt>Lokasi</dt><dd>{d.locationName || i.location}</dd>
        <dt>Patokan</dt><dd>{d.patokan || '—'}</dd>
        <dt>Kabupaten/kota</dt><dd>{kab || '—'}</dd>
        <dt>Wilayah kerja</dt><dd>{wkShort(i.wk)}</dd>
        <dt>Koordinat</dt><dd><span className="p-mono" style={{ fontSize: 12 }}>{coord}</span></dd>
      </dl>
    </section>
  );
}
