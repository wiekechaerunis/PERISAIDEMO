/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom';
import { routeHref } from '@/dc/route';
import { AnimNum } from '../anim';

// S9-S11 sebagai panel ringkasan melayang di kanan peta (Iterasi 2 C2, disetujui PM 25 Nov).
// Isi sama dengan strip lama di bawah peta, disusun ringkas: nasional = per wilayah, wilayah = ringkasan + area, titik = ringkasan + insiden.

export type Hl = { id: string; from: 'map' | 'panel' } | null;

const Sev = ({ r }: { r: any }) => (
  <span className="db-sev" style={{ background: r.sbg, color: r.sink }}>
    <i style={{ background: r.sc }} />
    {r.sn}
  </span>
);

const Bar = ({ w, c = 'var(--chart-series-1)' }: { w: string; c?: string }) => (
  <span className="t">
    <i style={{ width: w, background: c }} />
  </span>
);

export function MapPanel({ v, hl, setHl, onHide }: { v: any; hl: Hl; setHl: (h: Hl) => void; onHide: () => void }) {
  const rowProps = (r: any) => ({
    className: `pn-row ${r.cls ?? ''}${hl?.id === r.hid ? ' hl' : ''}`,
    onMouseEnter: () => setHl({ id: r.hid, from: 'panel' }),
    onMouseLeave: () => setHl(null),
  });
  const title = v.zNat ? 'Per wilayah SKK' : v.aTitle;

  const summary = (
    <div className="pn-sum">
      <div>
        <span className="p-cap">Insiden</span>
        <b><AnimNum text={v.aN} /></b>
        <span className="p-cap">{v.aNs}</span>
      </div>
      <div>
        <span className="p-cap">Kerugian</span>
        <b><AnimNum text={v.aR} /></b>
        <span className="p-cap">{v.aRs}</span>
      </div>
      <div className="wide">
        <span className="p-cap">Sebaran level</span>
        <span className="db-stack" role="img" aria-label={v.aLvAria}>
          {(v.aLv ?? []).map((s: any, i: number) => <i key={i} style={{ width: s.w, background: s.c }} />)}
        </span>
      </div>
      {v.zArea && (
        <div className="wide">
          <span className="p-cap">Jenis terbanyak</span>
          <b className="sm">{v.aCat}</b>
          <span className="p-cap">{v.aCatS}</span>
        </div>
      )}
      {v.zLoc && (
        <div className="wide">
          <span className="p-cap">KKKS · wilayah kerja</span>
          <b className="sm">{v.aKkks}</b>
          <span className="p-cap">{v.aWk}</span>
        </div>
      )}
    </div>
  );

  return (
    <aside className="db-panel" aria-label="Ringkasan peta">
      <div className="pn-hd">
        <div className="pn-tt">
          <h3 className="p-h3">{title}</h3>
          {v.zNat && <span className="p-cap">Klik nama wilayah untuk zoom ke peta.</span>}
        </div>
        <button type="button" className="pn-x" aria-label="Sembunyikan panel" onClick={onHide}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
      <div className="pn-body db-fade" key={v.zKey}>
        {v.zNat &&
          (v.wRows ?? []).map((r: any) => (
            <div key={r.hid} {...rowProps(r)}>
              <div className="pn-top">
                <button type="button" className="nm" onClick={r.go}>{r.n}</button>
                <Sev r={r} />
              </div>
              {r.note && <span className="p-cap">{r.note}</span>}
              <div className="pn-m">
                <div>
                  <span className="p-cap">Insiden</span>
                  <span className="v"><b><AnimNum text={r.nL} /></b> {r.nP}</span>
                  <Bar w={r.nw} />
                </div>
                <div>
                  <span className="p-cap">Kerugian</span>
                  <span className="v"><b><AnimNum text={r.rL} /></b> {r.rP}</span>
                  <Bar w={r.rw} />
                </div>
                <div>
                  <span className="p-cap">KKKS melapor</span>
                  <span className="v"><b>{r.rep}</b> {r.repP}</span>
                  <Bar w={r.repW} c="var(--border-control)" />
                </div>
              </div>
            </div>
          ))}

        {v.zArea && (
          <>
            {summary}
            <span className="pn-sub">{v.subHead}</span>
            {(v.subRows ?? []).map((r: any) => (
              <div key={r.hid} {...rowProps(r)}>
                <div className="pn-top">
                  <button type="button" className="nm" onClick={r.go}>{r.n}</button>
                  <Sev r={r} />
                </div>
                <span className="p-cap">{r.sub}</span>
                <div className="pn-m two">
                  <div>
                    <span className="p-cap">Insiden</span>
                    <span className="v"><b><AnimNum text={r.nL} /></b></span>
                    <Bar w={r.nw} />
                  </div>
                  <div>
                    <span className="p-cap">Kerugian</span>
                    <span className="v"><b><AnimNum text={r.rL} /></b></span>
                    <Bar w={r.rw} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {v.zLoc && (
          <>
            {summary}
            <span className="pn-sub">Insiden di lokasi ini</span>
            {(v.incs ?? []).map((i: any) => (
              <Link key={i.id} className="pn-inc" to={routeHref(i.href, i.id)}>
                <span className="db-id">{i.id}</span>
                <b>{i.t}</b>
                <span className="p-cap">{i.d}</span>
                <span className="pn-top">
                  <Sev r={i} />
                  <span className="p-cap" style={{ fontWeight: 600 }}>{i.st}</span>
                </span>
              </Link>
            ))}
            <span className="p-cap">{v.incFoot}</span>
          </>
        )}
      </div>
    </aside>
  );
}
