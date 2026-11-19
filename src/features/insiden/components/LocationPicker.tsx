// Pemilih lokasi sesuai komponen peta DS (`.p-map`): peta digeser di bawah pin tetap di tengah, zoom, "lokasi saya", kolom cari
// (nama tempat atau koordinat), dan pil koordinat. Peta skematik (bukan tile sungguhan). Titik di luar cakupan WK memunculkan
// pilihan WK (board S13).
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { BottomSheet } from '@/mobile/ui/BottomSheet';
import { Modal } from './review/ReviewDialogs';
import { KNOWN_SITES, MAP_BOX, WK_ZONES, formatCoord, locate, parseCoord, searchPlaces, toLatLng, toPoint, type Place } from '../logic/geo';

const W = 600;
const H = 380;
const ZOOMS = [1, 2, 4];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export interface PickedLocation {
  name: string;
  lat: number;
  lng: number;
  /** WK terpilih ('' bila di luar cakupan dan WK belum dipilih) */
  wk: string;
  area: string;
  outside: boolean;
}

interface Props {
  variant?: 'dialog' | 'sheet';
  /** titik awal; bila kosong peta dibuka di sumur ADR-07 */
  initial?: { lat: number | null; lng: number | null; wk?: string };
  /** tanyakan WK di sini bila titik di luar cakupan (desktop). Mobile menanyakannya di form. */
  askWk?: boolean;
  onPick: (v: PickedLocation) => void;
  onClose: () => void;
}

/** Peta DS: pin tetap di tengah; yang bergeser adalah petanya. Titik terpilih = pusat peta. */
export function LocationMap({ lat, lng, onCenter }: { lat: number; lng: number; onCenter: (lat: number, lng: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [zi, setZi] = useState(0);
  const [drag, setDrag] = useState(false);
  const [moved, setMoved] = useState(false);
  const [q, setQ] = useState('');
  const [openList, setOpenList] = useState(false);
  const listId = useId();
  const gesture = useRef<{ x: number; y: number; lat: number; lng: number; dragged: boolean } | null>(null);

  const zf = ZOOMS[zi];
  const vbW = W / zf;
  const vbH = H / zf;
  const c = toPoint(lat, lng, W, H);
  const results = useMemo(() => searchPlaces(q), [q]);
  const coord = parseCoord(q);

  /** piksel layar per satuan peta (preserveAspectRatio "slice": kanvas diisi penuh) */
  const scale = () => {
    const r = box.current!.getBoundingClientRect();
    return { r, k: Math.max(r.width / vbW, r.height / vbH) };
  };
  const moveTo = (nx: number, ny: number) => {
    const p = toLatLng(clamp(nx, 0, W), clamp(ny, 0, H), W, H);
    onCenter(p.lat, p.lng);
    setMoved(true);
  };

  const down = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.zoom,.me,.srch')) return;
    gesture.current = { x: e.clientX, y: e.clientY, lat, lng, dragged: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.dragged && Math.hypot(dx, dy) < 4) return;
    g.dragged = true;
    setDrag(true);
    const { k } = scale();
    const start = toPoint(g.lat, g.lng, W, H);
    moveTo(start.x - dx / k, start.y - dy / k);
  };
  const up = () => {
    gesture.current = null;
    setDrag(false);
  };
  // klik tanpa menggeser: pindahkan pusat ke titik yang diklik
  const click = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.zoom,.me,.srch')) return;
    if (gesture.current?.dragged) return;
    const { r, k } = scale();
    moveTo(c.x + (e.clientX - (r.left + r.width / 2)) / k, c.y + (e.clientY - (r.top + r.height / 2)) / k);
  };
  const key = (e: React.KeyboardEvent) => {
    const step = (vbW / 12) * (e.shiftKey ? 3 : 1);
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (d[e.key]) {
      e.preventDefault();
      moveTo(c.x + d[e.key][0], c.y + d[e.key][1]);
    } else if (e.key === '+' || e.key === '=') setZi((z) => Math.min(ZOOMS.length - 1, z + 1));
    else if (e.key === '-') setZi((z) => Math.max(0, z - 1));
  };

  const jump = (p: { lat: number; lng: number }, zoom = 1) => {
    onCenter(p.lat, p.lng);
    setZi(zoom);
    setMoved(true);
    setOpenList(false);
  };
  const pickPlace = (p: Place) => {
    jump(p, 1);
    setQ(p.name);
  };
  const submitSearch = () => {
    if (coord) {
      jump(coord, 1);
      setQ(formatCoord(coord.lat, coord.lng));
    } else if (results[0]) pickPlace(results[0]);
  };

  const labelSize = 10 / zf;
  return (
    <div
      ref={box} className={'p-map' + (drag ? ' drag' : '')} role="application" tabIndex={0}
      aria-label="Peta lokasi. Geser peta atau gunakan tombol panah untuk memindahkan pin; plus dan minus untuk zoom"
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={click} onKeyDown={key}
      style={{ touchAction: 'none' }}
    >
      <svg className="base" viewBox={`${c.x - vbW / 2} ${c.y - vbH / 2} ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="#EEF0EA" />
        <path d="M-600 300C-450 240-340 330-220 270S-60 250 0 290C150 240 260 330 380 270S540 250 600 290C700 330 900 250 1200 300" stroke="#D6E4F5" strokeWidth="22" fill="none" strokeLinecap="round" />
        <path d="M-600 120 1200 150M180 -380l40 1140M340 -380C360 160 420 260 600 330L1200 560" stroke="#fff" strokeWidth="4" fill="none" />
        {WK_ZONES.map((z) => {
          const a = toPoint(z.box.latMax, z.box.lngMin, W, H);
          const b = toPoint(z.box.latMin, z.box.lngMax, W, H);
          return (
            <g key={z.wk}>
              <rect x={a.x} y={a.y} width={b.x - a.x} height={b.y - a.y} rx="6" fill="#BED630" fillOpacity=".12" stroke="#6F8410" strokeWidth={1.5 / zf} strokeDasharray={`${5 / zf} ${4 / zf}`} />
              <text x={a.x + 8 / zf} y={a.y + 16 / zf} fontSize={11 / zf} fontWeight="700" fill="#4A5507">{z.wk}</text>
            </g>
          );
        })}
        {KNOWN_SITES.map((k) => {
          const p = toPoint(k.lat, k.lng, W, H);
          return (
            <g key={k.name}>
              <circle cx={p.x} cy={p.y} r={3.5 / zf} fill="#1C1D21" />
              {zf >= 2 && (
                <text x={p.x + 7 / zf} y={p.y + 3 / zf} fontSize={labelSize} fontWeight="600" fill="#1C1D21" stroke="#EEF0EA" strokeWidth={3 / zf} paintOrder="stroke">{k.name}</text>
              )}
            </g>
          );
        })}
      </svg>
      <span className="shadow" aria-hidden="true"></span>
      <svg className="pin" viewBox="0 0 34 44" width="28" height="36" aria-hidden="true">
        <path d="M17 43s15-13.5 15-26A15 15 0 0 0 2 17c0 12.5 15 26 15 26z" fill="#1C1D21" />
        <circle cx="17" cy="17" r="6.5" fill="#BED630" />
      </svg>
      {!moved && !drag && <span className="hint">Geser peta untuk memindahkan pin</span>}

      <div className="srch" onPointerDown={(e) => e.stopPropagation()}>
        <label className="p-input" style={{ height: 40 }}>
          <Icon name="search" size={16} style={{ color: 'var(--ink-muted)' }} />
          <input
            role="combobox" aria-expanded={openList && (results.length > 0 || !!coord)} aria-controls={listId} aria-autocomplete="list"
            aria-label="Cari lokasi atau koordinat" placeholder="Cari nama tempat atau koordinat" value={q} autoComplete="off"
            onChange={(e) => { setQ(e.target.value); setOpenList(true); }}
            onFocus={() => setOpenList(true)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') { e.preventDefault(); submitSearch(); }
              if (e.key === 'Escape') setOpenList(false);
            }}
            style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0 }}
          />
          {q && (
            <button type="button" className="p-ibtn ghost" style={{ width: 24, height: 24 }} aria-label="Hapus pencarian" onClick={() => { setQ(''); setOpenList(false); }}>
              <Icon name="close" size={14} />
            </button>
          )}
        </label>
        {openList && q.trim() !== '' && (
          <div id={listId} className="in-pop" role="listbox" aria-label="Hasil pencarian" style={{ top: 46, maxHeight: 220 }}>
            {coord && (
              <button type="button" role="option" aria-selected="false" className="op" style={{ minHeight: 44 }} onClick={() => jump(coord, 1)}>
                <span className="t"><b>Koordinat {formatCoord(coord.lat, coord.lng)}</b><span>Pindahkan pin ke titik ini</span></span>
              </button>
            )}
            {results.map((p) => (
              <button key={p.name} type="button" role="option" aria-selected="false" className="op" style={{ minHeight: 44 }} onClick={() => pickPlace(p)}>
                <span className="t"><b>{p.name}</b><span>{p.kind} · {p.area}</span></span>
              </button>
            ))}
            {!coord && results.length === 0 && <span className="p-cap" style={{ display: 'block', padding: '12px 14px' }}>Tidak ada tempat yang cocok. Ketik nama lain atau koordinat, mis. -2.98512, 104.04213.</span>}
          </div>
        )}
      </div>

      <div className="zoom">
        <button type="button" aria-label="Perbesar" disabled={zi === ZOOMS.length - 1} onClick={() => setZi(zi + 1)}><Icon name="plus" size={16} /></button>
        <span></span>
        <button type="button" aria-label="Perkecil" disabled={zi === 0} onClick={() => setZi(zi - 1)}>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="M5 12h14" /></svg>
        </button>
      </div>
      {/* ASSUMPTION: "lokasi saya" demo memakai titik dekat sumur ADR-07, bukan geolokasi browser (menghindari izin lokasi) */}
      <button type="button" className="me" aria-label="Gunakan lokasi saya" onClick={() => jump({ lat: -2.98512 + 0.0011, lng: 104.04213 - 0.0003 }, 2)}>
        <Icon name="search" size={16} />
      </button>
      <span className="coord" aria-hidden="true">{formatCoord(lat, lng)}</span>
    </div>
  );
}

function Body({ lat, lng, setPoint, wkChoice, setWkChoice, askWk }: {
  lat: number; lng: number; setPoint: (lat: number, lng: number) => void; wkChoice: string; setWkChoice: (w: string) => void; askWk: boolean;
}) {
  const loc = locate(lat, lng);
  return (
    <div className="lp-body">
      <LocationMap lat={lat} lng={lng} onCenter={setPoint} />
      <div className="lp-info" role="status" aria-live="polite">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <b>{loc.name}</b>
          <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatCoord(lat, lng)}</span>
        </div>
        <span style={{ textAlign: 'right', fontSize: 12 }}>
          {loc.area} ·{' '}
          {loc.outside ? <span className="p-tag t-caution" style={{ height: 20 }}>Di luar cakupan WK</span> : <>Dalam {loc.wk}</>}
        </span>
      </div>
      {loc.outside && askWk && (
        <div className="p-field">
          <span className="p-lbl" id="lp-wk" style={{ color: 'var(--ink)' }}>Wilayah kerja<span className="p-req">*</span></span>
          <div className="in-chips" role="radiogroup" aria-labelledby="lp-wk" style={{ flexWrap: 'wrap' }}>
            {WK_ZONES.map((z) => (
              <button key={z.wk} type="button" role="radio" className="p-chip" aria-checked={wkChoice === z.wk} aria-pressed={wkChoice === z.wk} onClick={() => setWkChoice(z.wk)}>
                {z.wk}
              </button>
            ))}
          </div>
          <span className="p-help">Titik ini di luar cakupan WK organisasi Anda. Pilih WK yang paling terkait. Pilihan PIC mengikuti WK ini.</span>
        </div>
      )}
    </div>
  );
}

export function LocationPicker({ variant = 'dialog', initial, askWk = true, onPick, onClose }: Props) {
  const start = initial && initial.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : { lat: KNOWN_SITES[0].lat, lng: KNOWN_SITES[0].lng };
  const [pt, setPt] = useState(start);
  const [wkChoice, setWkChoice] = useState(initial?.wk ?? '');
  const loc = locate(pt.lat, pt.lng);
  useEffect(() => {
    if (!loc.outside) setWkChoice('');
  }, [loc.outside]);
  const needWk = loc.outside && askWk && !wkChoice;
  const confirm = () => onPick({ name: loc.name, lat: pt.lat, lng: pt.lng, wk: loc.outside ? wkChoice : loc.wk, area: loc.area, outside: loc.outside });
  const body = <Body lat={pt.lat} lng={pt.lng} setPoint={(lat, lng) => setPt({ lat, lng })} wkChoice={wkChoice} setWkChoice={setWkChoice} askWk={askWk} />;
  const buttons = (
    <>
      <button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Batal</button>
      <button type="button" className="p-btn p-btn-primary" onClick={confirm} disabled={needWk}>Pilih lokasi ini</button>
    </>
  );
  return variant === 'sheet' ? (
    <BottomSheet title="Pilih lokasi" onClose={onClose} footer={buttons} footerRow>{body}</BottomSheet>
  ) : (
    <Modal title="Pilih lokasi kejadian" width={640} onClose={onClose} footer={buttons}>{body}</Modal>
  );
}

/** Batas peta (untuk tes dan dokumentasi). */
export const MAP_RANGE = MAP_BOX;
