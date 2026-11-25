/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MapPanel, type Hl } from './MapPanel';
import { AREA_PROV, PROVINSI } from '@/data/provinsi';
import { W } from '@/data/dashboard';

// S8 (peta, zoom, lapisan) + S9-S11 (panel ringkasan melayang). Ditulis tangan sejak Iterasi 2 (disetujui PM 25 Nov).
// Tambahan Iterasi 2: panel melayang, kartu hover, zoom scroll/geser/double-click, tombol Legenda, pill tidak terpotong.

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const SKIP = '.db-panel, .db-ctl, .db-leg, .db-legbtn, .db-sumbtn';

type Card = { x: number; y: number; kind: 'area' | 'pill' | 'pt' | 'prov'; d: any } | null;
const WN = W as Record<string, { n: string; nr?: boolean }>;

export function MapStage({ v, hl, setHl }: { v: any; hl: Hl; setHl: (h: Hl) => void }) {
  const ui = v.ui;
  const mapRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [legOpen, setLegOpen] = useState(false);
  const [card, setCard] = useState<Card>(null);
  const [hovP, setHovP] = useState<number | null>(null);
  const timer = useRef<number>(0);
  const drag = useRef({ on: false, moved: false, sx: 0, sy: 0, px: 0, py: 0 });
  const lastWheel = useRef(0);
  const vRef = useRef(v);
  useEffect(() => { vRef.current = v; });

  // Lebar kotak peta dipakai rumus zoom (area pas = lebar peta - 376px saat panel terbuka).
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const set = () => ui.setMapW(Math.round(el.clientWidth));
    const ro = new ResizeObserver(set);
    ro.observe(el);
    set();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tingkat berganti atau panel dibuka/ditutup: geseran kembali ke nol.
  const resetKey = `${v.zKey}|${ui.panelOpen}`;
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setPan({ x: 0, y: 0 });
    setCard(null);
  }
  // kartu yang dijadwalkan sebelum zoom tidak boleh muncul setelah tingkat berganti
  useEffect(() => () => window.clearTimeout(timer.current), [resetKey]);

  // B2: pill wilayah >= 8px dari tepi kotak peta dan tidak tertutup panel.
  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const mr = map.getBoundingClientRect();
    const right = mr.right - (ui.panelOpen ? 376 : 0) - 8;
    map.querySelectorAll<HTMLElement>('.db-pill').forEach((p) => {
      p.style.marginLeft = '0px';
      if (pan.x || pan.y) return;
      const r = p.getBoundingClientRect();
      let shift = 0;
      if (r.left < mr.left + 8) shift = mr.left + 8 - r.left;
      else if (r.right > right) shift = right - r.right;
      if (shift) p.style.marginLeft = `${shift}px`;
    });
  });

  // B3: legenda ditutup dengan klik di luar atau Esc.
  useEffect(() => {
    if (!legOpen) return;
    const close = (e: Event) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return;
      if (e.type === 'mousedown' && (e.target as HTMLElement | null)?.closest?.('.db-leg, .db-legbtn')) return;
      setLegOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [legOpen]);

  // C4: sasaran di bawah kursor (wilayah di nasional, area di tingkat wilayah), toleransi 90px.
  const curZ = () => String(vRef.current.zKey).split('|')[1];
  // Klik provinsi: zoom ke wilayah SKK provinsi itu (KKKS hanya melihat wilayah kerjanya sendiri).
  const goProv = (i: number) => {
    const cv = vRef.current;
    const w = PROVINSI[i].w;
    if (!cv.isSkk || (cv.lvl === 'area' && curZ() === w)) return;
    cv.goTo(w);
  };
  const zoomIn = (cx: number, cy: number) => {
    const pe = document.elementFromPoint(cx, cy)?.closest<SVGElement>('[data-prov]');
    if (pe && vRef.current.lvl === 'nat') {
      goProv(Number(pe.dataset.prov));
      return;
    }
    const els = mapRef.current?.querySelectorAll<HTMLElement>('[data-gi]') ?? [];
    let best: { d: number; go: () => void } | null = null;
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(Math.max(r.left - cx, 0, cx - r.right), Math.max(r.top - cy, 0, cy - r.bottom));
      const list = el.dataset.gk === 'p' ? vRef.current.pills : vRef.current.heat;
      const go = list?.[Number(el.dataset.gi)]?.go;
      if (go && d < 90 && (!best || d < best.d)) best = { d, go };
    });
    (best as { go: () => void } | null)?.go();
  };
  const zoomBest = () => {
    const h = [...(v.heat ?? [])].sort((a: any, b: any) => b.area.n - a.area.n)[0];
    h?.go();
  };

  // C4: scroll naik = masuk satu tingkat, turun = keluar. Debounce 250ms; halaman tidak ikut bergulir.
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('.db-panel')) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel.current < 250) return;
      lastWheel.current = now;
      if (e.deltaY < 0) zoomIn(e.clientX, e.clientY);
      else vRef.current.goUp();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // C4: klik-tahan lalu geser; dibatasi 20% dari kotak peta.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest(SKIP)) return;
    drag.current = { on: true, moved: false, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.on) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    setDragging(true);
    setCard(null);
    const lx = ui.mapW * 0.2;
    const ly = ui.mapW * 0.4 * 0.2;
    setPan({ x: Math.max(-lx, Math.min(lx, d.px + dx)), y: Math.max(-ly, Math.min(ly, d.py + dy)) });
  };
  const endDrag = () => {
    if (!drag.current.on) return;
    drag.current.on = false;
    setDragging(false);
    window.setTimeout(() => { drag.current.moved = false; }, 0);
  };

  // C3: kartu hover dekat kursor, muncul setelah 120ms.
  const rel = (e: React.MouseEvent) => {
    const m = mapRef.current!.getBoundingClientRect();
    return { x: e.clientX - m.left, y: e.clientY - m.top };
  };
  const showCard = (kind: 'area' | 'pill' | 'pt' | 'prov', d: any, hid?: string) => (e: React.MouseEvent) => {
    const p = rel(e);
    if (hid) setHl({ id: hid, from: 'map' });
    window.clearTimeout(timer.current);
    if (drag.current.on) return;
    timer.current = window.setTimeout(() => setCard({ ...p, kind, d }), reduced() ? 0 : 120);
  };
  const moveCard = (e: React.MouseEvent) => {
    const p = rel(e);
    setCard((c) => (c ? { ...c, ...p } : c));
  };
  const hideCard = () => {
    window.clearTimeout(timer.current);
    setCard(null);
    setHl(null);
    setHovP(null);
  };

  // Chip wilayah hanya tampil saat wilayahnya di-hover (provinsi, area panas, atau baris panel).
  const hovW = hovP != null ? PROVINSI[hovP].w : hl?.id && WN[hl.id] ? hl.id : null;
  const provCount = (i: number) =>
    (v.heat ?? []).filter((h: any) => AREA_PROV[h.area.id] === i).reduce((s: number, h: any) => s + h.area.n, 0);

  const boxW = mapRef.current?.clientWidth ?? 1078;
  const boxH = mapRef.current?.clientHeight ?? 560;
  const hlId = hl?.id;
  const sev = (c: string, t: string) => (
    <span className="db-sev" style={{ background: 'var(--surface-sunken)', color: 'var(--ink)' }}>
      <i style={{ background: c }} />
      {t}
    </span>
  );

  return (
    <div
      className={`db-map${dragging ? ' drag' : ''}`}
      ref={mapRef}
      aria-label={v.mapAria}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClickCapture={(e) => {
        if (drag.current.moved) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onDoubleClick={(e) => {
        if (!(e.target as HTMLElement).closest(SKIP)) zoomIn(e.clientX, e.clientY);
      }}
    >
      <div className="db-wrap" ref={wrapRef}>
        <div className="db-pan" style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, transition: dragging ? 'none' : undefined }}>
          <div className="db-stage" style={{ transform: v.mapT }}>
            <svg className={`db-prov${v.baseOp === '0' ? ' off' : ''}`} viewBox="0 0 1000 400" aria-hidden="true">
              {PROVINSI.map((p, i) => (
                <path
                  key={i}
                  d={p.d}
                  data-prov={i}
                  className={`${hovW === p.w && v.lvl === 'nat' ? 'w' : ''}${hovP === i ? ' on' : ''}`}
                  onMouseEnter={(e) => {
                    setHovP(i);
                    showCard('prov', { i }, v.isSkk && v.lvl === 'nat' ? p.w : undefined)(e);
                  }}
                  onMouseMove={moveCard}
                  onMouseLeave={hideCard}
                  onClick={() => goProv(i)}
                />
              ))}
            </svg>
            {v.hasDet && <img src={v.detSrc} alt="" aria-hidden="true" draggable={false} style={{ left: v.det.l, top: v.det.t, width: v.det.w, height: v.det.h }} />}
            <Fragment key={v.zKey}>
              {(v.heat ?? []).map((h: any, i: number) => (
                <button
                  key={h.area.id}
                  type="button"
                  data-gi={i}
                  data-gk="h"
                  className={`db-heat${hlId === h.hid ? ' on' : ''}${hl?.from === 'panel' && hlId === h.hid ? ' ring' : ''}`}
                  aria-label={h.tip}
                  onClick={h.go}
                  onMouseEnter={showCard('area', h, h.hid)}
                  onMouseMove={moveCard}
                  onMouseLeave={hideCard}
                  style={{ left: h.x, top: h.y, width: h.s, animationDelay: `${i * 20}ms` }}
                >
                  <i style={{ background: h.bg }} />
                  <em style={{ background: h.c }} />
                </button>
              ))}
              {(v.lbls ?? []).map((l: any, i: number) => (
                <span key={i} className="db-lbl" style={{ left: l.x, top: l.y, fontSize: l.fs }}>
                  {l.t}
                </span>
              ))}
            </Fragment>
          </div>
          {(v.sites ?? []).map((t: any, i: number) => (
            <span key={i} className="db-site" style={{ left: t.x, top: t.y }}>
              {t.n}
            </span>
          ))}
          {(v.pts ?? []).map((p: any, i: number) => (
            <span key={`${v.zKey}${i}`} className="db-pt" style={{ left: p.x, top: p.y, background: p.c }} onMouseEnter={showCard('pt', p)} onMouseMove={moveCard} onMouseLeave={hideCard} />
          ))}
          {(v.pills ?? []).map((p: any, i: number) => (p.hid !== hovW ? null :
            <button
              key={p.hid}
              type="button"
              data-gi={i}
              data-gk="p"
              className={`db-pill peek ${p.cls}`}
              tabIndex={-1}
              style={{ left: p.x, top: p.y }}
              onClick={p.go}
              aria-label={p.aria}
              onMouseEnter={showCard('pill', p, p.hid)}
              onMouseMove={moveCard}
              onMouseLeave={hideCard}
            >
              <i style={{ background: p.c }} />
              {p.n}
              <span className="m">{p.m}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="db-ctl">
        <button type="button" aria-label="Perkecil satu tingkat" onClick={v.goUp} disabled={!!v.outDis}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}><path d="M5 12h14" /></svg>
        </button>
        {v.isSkk && (
          <button type="button" aria-label="Kembali ke seluruh Indonesia" onClick={v.zoomHome}>
            <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}><path d="M3 11l9-8 9 8M5 10v10h14V10" /></svg>
          </button>
        )}
        <button type="button" aria-label="Perbesar ke area dengan insiden terbanyak" onClick={zoomBest} disabled={!(v.heat ?? []).length}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>

      {v.showHint && <span className="db-hint" style={{ left: ui.panelOpen ? 'calc(50% - 188px)' : undefined }}>{v.hint}</span>}

      <button type="button" className="db-legbtn" aria-expanded={legOpen} onClick={() => setLegOpen((o) => !o)}>
        <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10" /></svg>
        Legenda
      </button>
      {legOpen && (
        <div className="db-leg" aria-label="Legenda peta">
          <div className="row">
            <span className="p-cap" style={{ fontWeight: 700, color: 'var(--ink)' }}>Warna = level tertinggi</span>
            {(v.lvChips ?? []).map((g: any, i: number) => (
              <button key={i} type="button" className="sw" aria-pressed={g.on} onClick={g.pick}>
                <i style={{ background: g.c }} />
                {g.n}
              </button>
            ))}
          </div>
          <div className="row">
            <span className="ramp"><span />Makin pekat = makin banyak insiden</span>
            {v.isSkk && (
              <>
                <span className="sw"><i style={{ background: 'var(--surface-subtle)', boxShadow: 'inset 0 0 0 1px var(--border-control)' }} />Tidak ada insiden tercatat</span>
                <span className="sw"><i style={{ background: 'repeating-linear-gradient(135deg, var(--surface) 0 2px, var(--border-control) 2px 3px)' }} />Belum ada laporan</span>
              </>
            )}
          </div>
        </div>
      )}

      {ui.panelOpen ? (
        <MapPanel v={v} hl={hl} setHl={setHl} onHide={() => ui.setPanelOpen(false)} />
      ) : (
        <button type="button" className="db-sumbtn" onClick={() => ui.setPanelOpen(true)}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="M4 6h16M4 12h16M4 18h10" /></svg>
          Ringkasan
        </button>
      )}

      {card && (
        <div
          className="db-card"
          role="tooltip"
          style={
            // kartu provinsi di atas kursor supaya chip wilayah (biasanya di bawah pulau) tetap terlihat
            card.kind === 'prov' && card.y > 130
              ? { left: Math.max(8, Math.min(card.x + 16, boxW - 288)), top: card.y - 12, transform: 'translateY(-100%)' }
              : { left: Math.max(8, Math.min(card.x + 16, boxW - 288)), top: Math.max(8, Math.min(card.y + 16, boxH - 150)) }
          }
        >
          {card.kind === 'area' && (
            <>
              <b>{(v.isSkk ? `${card.d.area.name} · ` : '') + card.d.area.wk}</b>
              {v.isSkk && <span className="s">{card.d.area.kk}</span>}
              <span className="r"><b>{card.d.area.n}</b> insiden · kerugian {card.d.rpS}</span>
              <span className="r">Level tertinggi {sev(card.d.c, card.d.mxL)}</span>
              <span className="s">Klik untuk zoom</span>
            </>
          )}
          {card.kind === 'pill' && (
            <>
              <b>{card.d.n}</b>
              <span className="r">{card.d.m}</span>
              <span className="r">Level tertinggi {sev(card.d.c, card.d.mxL)}</span>
              {card.d.cnt > 0 && <span className="s">Klik untuk zoom</span>}
            </>
          )}
          {card.kind === 'prov' && (() => {
            const p = PROVINSI[card.d.i];
            const w = WN[p.w];
            const n = provCount(card.d.i);
            const canZoom = v.isSkk && !(v.lvl === 'area' && curZ() === p.w);
            return (
              <>
                <b>{p.n}</b>
                {v.isSkk && <span className="s">Wilayah SKK {w.n}</span>}
                <span className="r">{w.nr ? 'Belum ada laporan' : <><b>{n}</b> insiden di provinsi ini</>}</span>
                {canZoom && <span className="s">Klik untuk zoom ke {w.n}</span>}
              </>
            );
          })()}
          {card.kind === 'pt' && (
            <>
              {card.d.inc && <span className="db-id">{card.d.inc.id}</span>}
              <b>{card.d.inc ? card.d.inc.t : `Insiden ${card.d.lvN}`}</b>
              <span className="r">{sev(card.d.c, card.d.lvN)}{card.d.inc ? ` ${card.d.inc.st}` : ''}</span>
              <span className="s">{card.d.site}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
