// Bahan pertimbangan mobile (board MV2 `.mrc`) dan peta insiden serupa layar penuh (board MV2m).
import { useMemo, useState } from 'react';
import type { Incident } from '@/services/types';
import {
  similarDots, similarPatterns, similarStats, similarSteps, toXY, type PatternKey, type SimilarResult,
} from '@/features/insiden/logic/similar';
import { Ic } from '@/features/insiden/components/review/parts';
import { SimilarPanel } from '@/features/insiden/components/review/SimilarPanel';

const SPARK = 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z';
const CHECK = 'M20 6 9 17l-5-5';

const AiBadge = () => (
  <span className="in-ai" style={{ height: 18, padding: '0 6px', marginLeft: 6, fontSize: 10, gap: 3, verticalAlign: 1 }}>
    <Ic d={SPARK} size={10} />AI
  </span>
);

interface Props {
  result: SimilarResult;
  target: Incident;
  steps: string[];
  onToggleStep: (text: string) => void;
  pic: string;
  /** pola yang disorot (dibagi dengan layar peta) */
  pat: PatternKey | null;
  onOpenMap: () => void;
  /** dipakai panel desktop untuk keadaan "kasus baru" */
  newCase: boolean;
  onSetSteps: (steps: string[]) => void;
}

export function SimilarMobile({ result, target, steps, onToggleStep, pic, pat, onOpenMap, newCase, onSetSteps }: Props) {
  const [allPat, setAllPat] = useState(false);
  // Keadaan <3 kasus / kasus baru: tidak ada board mobile; pakai panel yang sama dengan desktop.
  if (result.mode !== 'full') {
    return <SimilarPanel result={result} target={target} steps={steps} onToggleStep={onToggleStep} pic={pic} newCase={newCase} onSetSteps={onSetSteps} />;
  }
  const cases = result.cases;
  const n = cases.length;
  const wide = result.scope === 'org-36';
  const stats = similarStats(cases);
  const patterns = similarPatterns(cases);
  const stepRows = similarSteps(cases);
  const dots = similarDots(cases);
  const me = toXY(target.detail?.lat, target.detail?.lng);
  const shownPat = allPat ? patterns : patterns.slice(0, 2);
  return (
    <div className="sec mrc" aria-label="Bahan pertimbangan dari insiden serupa" role="region">
      <div className="h">
        <span className="tile"><Ic d={SPARK} size={16} /></span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <b>
            Bahan pertimbangan dari {n} insiden serupa{' '}
            <span className="p-tag t-info" style={{ height: 18, fontSize: 10, verticalAlign: 2 }}>AI</span>
          </b>
          <span className="p-cap" style={{ fontSize: 12, lineHeight: '17px' }}>
            {target.category} di {wide ? 'seluruh WK organisasi Anda' : target.wk} yang sudah Ditutup. Keputusan tetap di Anda.
          </span>
          <span className="p-cap" style={{ fontWeight: 600, color: 'var(--status-info-ink)' }}>
            {wide ? '36 bulan terakhir · seluruh WK organisasi Anda' : '18 bulan terakhir · organisasi Anda'}
          </span>
        </span>
      </div>
      {stats.length > 0 && (
        <div className="g4">
          {stats.map((s, k) => (
            <div key={s.key} style={stats.length % 2 === 1 && k === stats.length - 1 ? { gridColumn: '1 / -1' } : undefined}>
              <span className="k">{s.label}</span><b>{s.value}</b><span className="n">{s.note}</span>
            </div>
          ))}
        </div>
      )}
      {patterns.length > 0 && (
        <div className="pl">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Pola kejadian serupa</span>
          <a
            href="#" className="rcv-wm" aria-label={`Buka peta sebaran ${n} insiden serupa layar penuh`}
            style={{ display: 'block', height: 160, color: 'inherit', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); onOpenMap(); }}
          >
            <svg viewBox="0 0 360 210" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Sebaran ${n} insiden serupa di ${target.wk}`}>
              <rect width="360" height="210" fill="color-mix(in srgb, var(--status-info-bg) 75%, var(--surface))" />
              <path d="M0,0 L170,0 L210,40 L270,80 L320,140 L360,170 L360,210 L0,210 Z" fill="var(--surface)" stroke="var(--border-control)" />
              <path d="M80,210 L125,140 L170,90 L190,30 L170,0" fill="none" stroke="var(--border-control)" strokeDasharray="5 4" />
              <polygon points="150,62 236,52 284,96 268,156 196,170 140,124" fill="color-mix(in srgb, var(--action) 30%, transparent)" stroke="var(--action-line)" strokeWidth="2" strokeLinejoin="round" />
              <polygon points="60,40 120,30 132,78 80,92 48,70" fill="color-mix(in srgb, var(--chart-series-1) 14%, transparent)" stroke="var(--chart-series-1)" strokeWidth="1.2" />
              <text x="62" y="62" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--status-info-ink)' }}>WK Rimau</text>
              {dots.map((d) => {
                const hit = pat ? d.tags.includes(pat) : false;
                return (
                  <g key={d.no} className={'pt' + (pat && !hit ? ' dim' : '') + (hit ? ' hit' : '')} data-no={d.no}>
                    <circle cx={d.x} cy={d.y} r="10" className="halo" />
                    <circle cx={d.x} cy={d.y} r="5" className="dot" />
                  </g>
                );
              })}
              <g><circle cx={me.x} cy={me.y} r="8" fill="var(--ink)" /><circle cx={me.x} cy={me.y} r="3" fill="var(--action)" /></g>
            </svg>
            <span className="p-ibtn" aria-hidden="true" style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32 }}>
              <Ic d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" size={14} />
            </span>
            <div className="wm-foot">
              <div className="wm-lg"><span><i className="me"></i>Insiden ini</span><span><i className="cs"></i>Insiden serupa</span><span><i className="wk"></i>WK Anda</span></div>
            </div>
          </a>
          {shownPat.map((p) => (
            <div className="r" key={p.key}>
              <span className="t"><span>{p.dim}{p.ai && <AiBadge />}</span><span>{p.count} dari {n} kasus</span></span>
              <b>{p.label}</b>
              <span className="bar"><i style={{ width: `${p.pct}%` }}></i></span>
              <span className="p-cap" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{p.source}</span>
            </div>
          ))}
          {patterns.length > 2 && !allPat && (
            <a href="#" className="lk-alink" style={{ fontSize: 12 }} onClick={(e) => { e.preventDefault(); setAllPat(true); }}>Lihat {patterns.length - 2} pola lain</a>
          )}
        </div>
      )}
      {stepRows.length > 0 && (
        <div className="stp">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Langkah yang biasa dilakukan</span>
          <span className="p-help" style={{ marginTop: -4 }}>Pilih untuk dikirim ke PIC sebagai saran</span>
          {stepRows.map((s) => {
            const on = steps.includes(s.text);
            return (
              <label key={s.text} className={on ? 'on' : ''}>
                <input type="checkbox" className="mv-hid" checked={on} onChange={() => onToggleStep(s.text)} />
                <span className={on ? 'p-check on' : 'p-check'} style={{ marginTop: 1 }} aria-hidden="true">{on && <Ic d={CHECK} size={11} />}</span>
                <span>{s.text}<span className="m">{s.tag} · tercatat di {s.count} kasus</span></span>
              </label>
            );
          })}
        </div>
      )}
      <div className="ft">
        <span>{steps.length ? `${steps.length} saran langkah dikirim ke ${pic} saat Anda menyetujui` : 'Belum ada saran untuk PIC penanganan'}</span>
        <span style={{ display: 'inline-flex', gap: 4 }}>
          <button type="button" className="p-ibtn ghost" style={{ width: 36, height: 36 }} aria-label="Membantu"><Ic d="M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.4 22H7V10l4-8a3 3 0 0 1 4 3.9z" size={15} /></button>
          <button type="button" className="p-ibtn ghost" style={{ width: 36, height: 36 }} aria-label="Tidak membantu"><Ic d="M17 14V2M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.6 2H17v12l-4 8a3 3 0 0 1-4-3.9z" size={15} /></button>
        </span>
      </div>
      <p className="p-cap" style={{ margin: 0 }}>Tidak termasuk laporan yang digabung dan insiden terbatas. Panel tampil bila ada minimal 3 insiden serupa.</p>
    </div>
  );
}

/** Layar penuh "Insiden serupa · N" (MV2m): peta + sheet bawah dengan chip pola. */
export function SimilarMapScreen({ result, target, pat, onPat, onBack }: {
  result: SimilarResult; target: Incident; pat: PatternKey | null; onPat: (p: PatternKey | null) => void; onBack: () => void;
}) {
  const cases = result.cases;
  const n = cases.length;
  const dots = useMemo(() => similarDots(cases), [cases]);
  const patterns = useMemo(() => similarPatterns(cases), [cases]);
  const me = toXY(target.detail?.lat, target.detail?.lng);
  const cur = patterns.find((p) => p.key === pat);
  return (
    <div className="in-m app mpv">
      <div className="top">
        <button type="button" className="ib44" aria-label="Kembali ke Review insiden" onClick={onBack}>
          <Ic d="M19 12H5M12 19l-7-7 7-7" size={20} />
        </button>
        <span className="ttl">Insiden serupa · {n}</span>
        <span style={{ width: 44 }}></span>
      </div>
      <div className="mpf">
        <div className="rcv-wm">
          <svg viewBox="0 0 390 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Peta sebaran ${n} insiden serupa di ${target.wk}`}>
            <g transform="translate(-40,40) scale(1.7)">
              <rect x="-40" y="-60" width="400" height="420" fill="color-mix(in srgb, var(--status-info-bg) 75%, var(--surface))" />
              <path d="M-40,-60 L150,-60 L170,0 L210,40 L270,80 L320,140 L360,170 L360,360 L-40,360 Z" fill="var(--surface)" stroke="var(--border-control)" />
              <path d="M80,360 L125,140 L170,90 L190,30 L170,0" fill="none" stroke="var(--border-control)" strokeDasharray="5 4" />
              <text x="214" y="22" style={{ fontSize: 7, letterSpacing: 2, fill: 'var(--status-info-ink)', opacity: 0.7, fontFamily: 'var(--font-sans)' }}>SELAT BANGKA</text>
              <polygon points="150,62 236,52 284,96 268,156 196,170 140,124" fill="color-mix(in srgb, var(--action) 30%, transparent)" stroke="var(--action-line)" strokeWidth="1.5" strokeLinejoin="round" />
              <polygon points="60,40 120,30 132,78 80,92 48,70" fill="color-mix(in srgb, var(--chart-series-1) 14%, transparent)" stroke="var(--chart-series-1)" strokeWidth="1" />
              <text x="62" y="62" style={{ fontSize: 7, fontFamily: 'var(--font-mono)', fill: 'var(--status-info-ink)' }}>WK Rimau</text>
              <text x="160" y="164" style={{ fontSize: 7, fontWeight: 700, fontFamily: 'var(--font-sans)', fill: 'var(--action-subtle-ink)' }}>{target.wk}</text>
              {dots.map((d) => {
                const hit = pat ? d.tags.includes(pat) : false;
                return (
                  <g key={d.no} className={'pt' + (pat ? (hit ? ' hit' : ' dim') : '')} data-no={d.no}>
                    <circle cx={d.x} cy={d.y} r="8" className="halo" />
                    <circle cx={d.x} cy={d.y} r="3.5" className="dot" />
                  </g>
                );
              })}
              <g><circle cx={me.x} cy={me.y} r="6" fill="var(--ink)" /><circle cx={me.x} cy={me.y} r="2.2" fill="var(--action)" /></g>
            </g>
          </svg>
          <div className="wm-ctl">
            <button type="button" className="p-ibtn" aria-label="Perbesar peta" style={{ width: 40, height: 40 }}><Ic d="M12 5v14M5 12h14" size={16} /></button>
            <button type="button" className="p-ibtn" aria-label="Perkecil peta" style={{ width: 40, height: 40 }}><Ic d="M5 12h14" size={16} /></button>
          </div>
        </div>
        <div className="mps">
          <span className="grab" aria-hidden="true"></span>
          <div className="wm-lg" style={{ display: 'flex', gap: 12, fontSize: 12 }}><span><i className="me"></i>Insiden ini</span><span><i className="cs"></i>Insiden serupa</span><span><i className="wk"></i>WK Anda</span></div>
          <div className="chips" role="group" aria-label="Sorot pola">
            <button type="button" className="p-chip" aria-pressed={pat === null} onClick={() => onPat(null)}>Semua</button>
            {patterns.map((p) => (
              <button key={p.key} type="button" className="p-chip" aria-pressed={pat === p.key} onClick={() => onPat(p.key)}>{p.dim + (p.ai ? ' · AI' : '')}</button>
            ))}
          </div>
          <div className="sel">
            <span className="t"><span>{cur ? cur.dim : 'Semua insiden serupa'}</span><span>{cur ? `${cur.count} dari ${n} kasus` : `${n} kasus`}</span></span>
            <b>{cur ? cur.label : `${target.category} · ${target.wk}`}</b>
            <span className="p-cap" style={{ fontSize: 11 }}>{cur ? cur.source : `${result.scope === 'org-36' ? '36' : '18'} bulan terakhir · sudah Ditutup. Pilih pola untuk menyorot titik.`}</span>
          </div>
          <a href="#" className="p-btn p-btn-secondary" style={{ justifyContent: 'center', minHeight: 44 }} onClick={(e) => e.preventDefault()}>Lihat daftar {n} insiden serupa</a>
        </div>
      </div>
    </div>
  );
}
