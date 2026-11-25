/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { MapStage } from './MapStage';
import type { Hl } from './MapPanel';

// S8 kerangka kartu peta: judul, jejak tingkat (crumb), keterangan, lalu peta + panel (S9-S11).
export function IncidentMap({ v }: { v: any }) {
  const [hl, setHl] = useState<Hl>(null);
  return (
    <section className="p-card c12 db-mapc">
      <div className="db-maphd">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 className="p-h2">Peta insiden</h2>
          <nav className="db-crumb" aria-label="Tingkat peta">
            {(v.crumb ?? []).map((b: any, i: number) =>
              b.link ? (
                <span key={i} style={{ display: 'contents' }}>
                  <button type="button" onClick={b.go}>{b.t}</button>
                  <span className="sep" aria-hidden="true">›</span>
                </span>
              ) : b.cur ? (
                <span key={i} className="cur" aria-current="location">{b.t}</span>
              ) : null,
            )}
          </nav>
        </div>
        <span className="p-cap" style={{ textAlign: 'right', maxWidth: 380 }}>{v.mapCap}</span>
      </div>
      <MapStage v={v} hl={hl} setHl={setHl} />
    </section>
  );
}
