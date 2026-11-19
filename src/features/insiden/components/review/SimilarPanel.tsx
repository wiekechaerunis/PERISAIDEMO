// Panel "Bahan pertimbangan dari insiden serupa" (board V12, V12e, V12f, V12g). Markup dan class sama dengan board.
import { useState } from 'react';
import type { Incident } from '@/services/types';
import {
  closedInText, monthYear, similarDots, similarPatterns, similarStats, similarSteps, toXY,
  type PatternKey, type SimilarResult,
} from '../../logic/similar';
import { Ic } from './parts';

const SPARK = 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z';
const WARN = 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z';
const INFO = 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5';
const CHECK = 'M20 6 9 17l-5-5';

interface Props {
  result: SimilarResult;
  target: Incident;
  /** teks langkah yang dipilih untuk dikirim ke PIC */
  steps: string[];
  onToggleStep: (text: string) => void;
  /** nama PIC terpilih (untuk "dikirim ke …") */
  pic: string;
  /** tampilkan panel "kasus baru" (V12e) alih-alih "none" */
  newCase?: boolean;
  onSetSteps: (steps: string[]) => void;
}

const AiBadge = () => (
  <span className="in-ai" style={{ display: 'inline-flex', height: 18, padding: '0 6px', marginLeft: 6, fontSize: 10, gap: 3, verticalAlign: 1 }}>
    <Ic d={SPARK} size={10} />AI
  </span>
);

export function SimilarPanel({ result, target, steps, onToggleStep, pic, newCase, onSetSteps }: Props) {
  if (result.mode === 'full') return <SimilarFull result={result} target={target} steps={steps} onToggleStep={onToggleStep} pic={pic} />;
  if (result.mode === 'few') return <SimilarFew result={result} target={target} />;
  if (newCase) return <NewCase steps={steps} onSetSteps={onSetSteps} />;
  return <SimilarNone category={target.category} />;
}

function SimilarFull({ result, target, steps, onToggleStep, pic }: Omit<Props, 'newCase' | 'onSetSteps'>) {
  const [pat, setPat] = useState<PatternKey | null>(null);
  const [folded, setFolded] = useState(false);
  const cases = result.cases;
  const n = cases.length;
  const wide = result.scope === 'org-36';
  const stats = similarStats(cases);
  const patterns = similarPatterns(cases);
  const stepRows = similarSteps(cases);
  const dots = similarDots(cases);
  const me = toXY(target.detail?.lat, target.detail?.lng);
  const nSel = steps.length;
  return (
    <section className="p-card in-sec rcv" aria-label="Bahan pertimbangan dari insiden serupa" style={{ display: 'flex' }}>
      <div className="rcv-hd">
        <span className="tile"><Ic d={SPARK} size={18} /></span>
        <div className="t">
          <h2 className="in-h">Bahan pertimbangan dari {n} insiden serupa</h2>
          <span className="p-cap" style={{ fontSize: 12, lineHeight: '17px' }}>
            {target.category} di {wide ? 'seluruh WK organisasi Anda' : target.wk} yang sudah Ditutup. Keputusan tetap di Anda.
          </span>
          <span className="chip">{wide ? '36 bulan terakhir · seluruh WK organisasi Anda' : '18 bulan terakhir · organisasi Anda'}</span>
        </div>
        <a href="#" className="p-btn p-btn-secondary p-btn-sm rcv-all" onClick={(e) => e.preventDefault()}>
          Lihat {n} insiden serupa<Ic d="M5 12h14M13 6l6 6-6 6" size={14} />
        </a>
      </div>
      {!folded && (
        <>
          {stats.length > 0 && (
            <div className="rcv-strip" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
              {stats.map((s) => (
                <div className="it" key={s.key}><span className="k">{s.label}</span><b>{s.value}</b><span className="n">{s.note}</span></div>
              ))}
            </div>
          )}
          <div className="rcv-grid2">
            {patterns.length > 0 && (
              <div className="rcv-card rcv-patc">
                <div className="ch">
                  <span className="dot-ic t-info"><Ic d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" size={13} /></span>
                  <b>Pola kejadian serupa</b>
                  <span className="hint">{pat ? 'Titik yang cocok disorot' : 'Klik pola untuk menyorot di peta'}</span>
                </div>
                <div className="rcv-pat2">
                  <div className="rcv-wm">
                    <svg viewBox="0 0 360 210" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Sebaran ${n} insiden serupa di ${target.wk}`}>
                      <rect width="360" height="210" fill="color-mix(in srgb, var(--status-info-bg) 75%, var(--surface))" />
                      <path d="M0,0 L170,0 L210,40 L270,80 L320,140 L360,170 L360,210 L0,210 Z" fill="var(--surface)" stroke="var(--border-control)" />
                      <path d="M80,210 L125,140 L170,90 L190,30 L170,0" fill="none" stroke="var(--border-control)" strokeDasharray="5 4" />
                      <path d="M0,130 L70,124 L125,140" fill="none" stroke="var(--border)" strokeDasharray="3 4" />
                      <text x="214" y="22" style={{ fontSize: 9, letterSpacing: 2, fill: 'var(--status-info-ink)', opacity: 0.7, fontFamily: 'var(--font-sans)' }}>SELAT BANGKA</text>
                      <text x="14" y="150" style={{ fontSize: 8, letterSpacing: 2, fill: 'var(--ink-muted)', fontFamily: 'var(--font-sans)' }}>SUMATERA SELATAN</text>
                      <polygon points="150,62 236,52 284,96 268,156 196,170 140,124" fill="color-mix(in srgb, var(--action) 30%, transparent)" stroke="var(--action-line)" strokeWidth="2" strokeLinejoin="round" />
                      <polygon points="60,40 120,30 132,78 80,92 48,70" fill="color-mix(in srgb, var(--chart-series-1) 14%, transparent)" stroke="var(--chart-series-1)" strokeWidth="1.2" />
                      <text x="62" y="62" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--status-info-ink)' }}>WK Rimau</text>
                      <text x="158" y="160" style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-sans)', fill: 'var(--action-subtle-ink)' }}>{target.wk}</text>
                      {dots.map((d) => {
                        const hit = pat ? d.tags.includes(pat) : false;
                        return (
                          <g key={d.no} className={'pt' + (pat && !hit ? ' dim' : '') + (hit ? ' hit' : '')} data-no={d.no}>
                            <circle cx={d.x} cy={d.y} r="12" className="halo" />
                            <circle cx={d.x} cy={d.y} r="5" className="dot" />
                          </g>
                        );
                      })}
                      <g><circle cx={me.x} cy={me.y} r="8" fill="var(--ink)" /><circle cx={me.x} cy={me.y} r="3" fill="var(--action)" /></g>
                    </svg>
                    <div className="wm-ctl">
                      <button type="button" className="p-ibtn" aria-label="Perbesar peta"><Ic d="M12 5v14M5 12h14" size={14} /></button>
                      <button type="button" className="p-ibtn" aria-label="Perkecil peta"><Ic d="M5 12h14" size={14} /></button>
                    </div>
                    <div className="wm-foot">
                      <div className="wm-lg"><span><i className="me"></i>Insiden ini</span><span><i className="cs"></i>Insiden serupa</span><span><i className="wk"></i>WK Anda</span></div>
                      <div className="wm-scale"><span>5 km</span><span className="b"></span></div>
                    </div>
                  </div>
                  <div className="rows">
                    {patterns.map((p) => (
                      <button key={p.key} type="button" className={'pr' + (pat === p.key ? ' on' : '')} aria-pressed={pat === p.key} onClick={() => setPat(pat === p.key ? null : p.key)}>
                        <span className="k">{p.dim}{p.ai && <AiBadge />}</span>
                        <span className="v">{p.label}</span>
                        <span className="bar"><i style={{ width: `${p.pct}%` }}></i></span>
                        <span className="n">{p.count} dari {n} kasus</span>
                        <span className="p-cap" style={{ gridColumn: '1 / -1', fontSize: 11, lineHeight: '14px', color: 'var(--ink-muted)' }}>{p.source}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {stepRows.length > 0 && (
              <div className="rcv-card rcv-stepc">
                <div className="ch">
                  <span className="dot-ic t-act"><Ic d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" size={13} /></span>
                  <b>Langkah yang biasa dilakukan</b>
                  <span className="hint">Pilih untuk dikirim ke PIC sebagai saran</span>
                </div>
                <div className="rcv-steps">
                  {stepRows.map((s, k) => {
                    const on = steps.includes(s.text);
                    return (
                      <button key={s.text} type="button" role="checkbox" aria-checked={on} className={'st' + (on ? ' on' : '')} onClick={() => onToggleStep(s.text)}>
                        <span className="no">{k + 1}</span>
                        <span className="tx">{s.text}<span className="m">{s.tag} · tercatat di {s.count} kasus</span></span>
                        <span className="ck"><Ic d={CHECK} size={12} /></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <div className="rcv-ft">
        <span className={'fw' + (nSel ? ' on' : '')}>
          <Ic d={CHECK} size={14} />
          <span>{nSel ? `${nSel} saran langkah dikirim ke ${pic} saat Anda menyetujui` : 'Belum ada saran untuk PIC penanganan'}</span>
        </span>
        <span className="fb">
          <span className="p-cap">Membantu?</span>
          <button type="button" className="ib" aria-label="Membantu"><Ic d="M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.4 22H7V10l4-8a3 3 0 0 1 4 3.9z" size={15} /></button>
          <button type="button" className="ib" aria-label="Tidak membantu"><Ic d="M17 14V2M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.6 2H17v12l-4 8a3 3 0 0 1-4-3.9z" size={15} /></button>
        </span>
        <button type="button" className="p-ibtn ghost" aria-label={folded ? 'Perluas' : 'Ciutkan'} aria-expanded={!folded} style={{ width: 30, height: 30 }} onClick={() => setFolded(!folded)}>
          <Ic d={folded ? 'm6 9 6 6 6-6' : 'm18 15-6-6-6 6'} size={16} />
        </button>
      </div>
      <p className="p-cap" style={{ margin: 0 }}>Tidak termasuk laporan yang digabung dan insiden terbatas. Panel tampil bila ada minimal 3 insiden serupa.</p>
    </section>
  );
}

function SimilarFew({ result, target }: { result: SimilarResult; target: Incident }) {
  const n = result.cases.length;
  return (
    <section className="p-card in-sec rc" aria-label="Bahan pertimbangan dari insiden serupa" style={{ display: 'flex' }}>
      <div className="lk-card-head" style={{ marginBottom: 0 }}>
        <h2 className="in-h" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Bahan pertimbangan dari insiden serupa</h2>
        <button type="button" className="p-ibtn ghost" aria-label="Ciutkan" style={{ width: 30, height: 30 }}><Ic d="m18 15-6-6-6 6" size={16} /></button>
      </div>
      <span className="p-cap rc-basis">
        Di {target.wk} kurang dari 3 kasus, jadi cakupan diperluas: <b>{n} insiden</b> {target.category} yang sudah Ditutup · 36 bulan terakhir · seluruh WK organisasi Anda.
      </span>
      <div className="in-bn info sm rc-few">
        <Ic d={INFO} size={16} />
        <span>Data belum cukup untuk melihat pola ({n} kasus). Ringkasan, dampak, dan langkah muncul setelah ada minimal 3 kasus.</span>
      </div>
      <div className="rc-g">
        <span className="rc-h">Kasus rujukan</span>
        {result.cases.map((c) => (
          <a href="#" className="rc-case" key={c.no} onClick={(e) => e.preventDefault()}>
            <b>{c.title}</b>
            <span className="p-cap"><span className="p-mono">{c.no}</span> · {monthYear(c.occurredAt)} · {c.wk} · {closedInText(c)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function SimilarNone({ category }: { category: string }) {
  return (
    <section className="p-card in-sec rc rc-none" aria-label="Bahan pertimbangan dari insiden serupa" style={{ display: 'flex' }}>
      <span className="ic"><Ic d={INFO} size={16} /></span>
      <div>
        <b>Belum ada kasus serupa untuk dijadikan pembanding</b>
        <span className="p-cap">Bahan pertimbangan muncul setelah ada insiden {category} yang sudah Ditutup di organisasi Anda.</span>
      </div>
    </section>
  );
}

/** Langkah awal AI untuk kasus baru (V12e): teks + sumbernya. */
export const NEW_CASE_STEPS: { text: string; src: string }[] = [
  { text: 'Simpan foto atau video, waktu, dan arah terbang drone.', src: 'SOP PAM-03' },
  { text: 'Periksa CCTV dan sekitar perimeter untuk mencari operatornya.', src: 'SOP PAM-03' },
  { text: 'Tambah patroli malam di sisi panel listrik selama 7 hari.', src: 'INS-SEN-2025-0098' },
  { text: 'Laporkan ke Polsek setempat dan beri tahu SKK Migas bila terulang.', src: 'SOP PAM-07' },
];

const H5: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: '.02em', textTransform: 'uppercase', color: 'var(--ink-muted)' };
const CASE_A: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', borderRadius: 'var(--radius-lg)', boxShadow: 'inset 0 0 0 1px var(--border)', textDecoration: 'none', color: 'var(--ink)' };

function NewCase({ steps, onSetSteps }: { steps: string[]; onSetSteps: (s: string[]) => void }) {
  const all = NEW_CASE_STEPS.map((s) => s.text);
  const on = all.every((t) => steps.includes(t));
  return (
    <section className="p-card in-sec" style={{ gap: 14 }} aria-label="Rekomendasi AI">
      <div className="lk-card-head" style={{ marginBottom: 0 }}>
        <h2 className="in-h">Rekomendasi untuk kasus baru</h2>
        <span className="p-tag" style={{ background: 'var(--status-info-bg)', color: 'var(--status-info-ink)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Ic d={SPARK} size={13} />AI Recommendation
        </span>
      </div>
      <div className="in-bn info sm" style={{ alignSelf: 'stretch', background: 'var(--caution-bg)', color: 'var(--caution-ink)' }}>
        <Ic d={WARN} size={16} />
        <div className="body"><b>Belum ada kasus serupa yang sudah ditutup.</b> Saran di bawah disusun dari SOP pengamanan dan kasus yang hanya sebagian mirip. Tingkat keyakinan: rendah.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={H5}>Perkiraan dampak</span>
        <span style={{ lineHeight: '20px' }}>Belum bisa diperkirakan dari data historis. Kemungkinan terkait pengintaian sebelum pencurian atau sabotase, karena drone berputar di atas panel listrik yang pernah dicuri kabelnya.</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={H5}>Kasus yang sebagian mirip</span>
        <a href="#" style={CASE_A} onClick={(e) => e.preventDefault()}><b style={{ fontSize: 13, lineHeight: '18px' }}>Orang tak dikenal memotret area sumur ADR-05</b><span className="p-cap"><span className="p-mono">INS-SEN-2025-0098</span> · Mirip: pengintaian · Agu 2025 · ditutup 1 hari</span></a>
        <a href="#" style={CASE_A} onClick={(e) => e.preventDefault()}><b style={{ fontSize: 13, lineHeight: '18px' }}>Akses tidak sah ke area sumur ADR-02</b><span className="p-cap"><span className="p-mono">INS-SEN-2026-0001</span> · Mirip: lokasi dan waktu malam · Jan 2026 · ditutup 2 hari</span></a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={H5}>Langkah awal yang disarankan</span>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {NEW_CASE_STEPS.map((s, k) => (
            <li key={s.text} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr) auto', gap: 10, alignItems: 'baseline' }}>
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--status-info-bg)', color: 'var(--status-info-ink)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{k + 1}</span>
              <span style={{ lineHeight: '20px' }}>{s.text}</span>
              <span className="p-cap" style={{ whiteSpace: 'nowrap' }}>{s.src}</span>
            </li>
          ))}
        </ol>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
        <button
          type="button" role="checkbox" aria-checked={on}
          onClick={() => onSetSteps(on ? steps.filter((t) => !all.includes(t)) : [...new Set([...steps, ...all])])}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 0, background: 'none', padding: 0, font: 'inherit', color: 'var(--ink)', cursor: 'pointer' }}
        >
          <span className={on ? 'p-check on' : 'p-check'}>{on && <Ic d={CHECK} size={11} />}</span>Teruskan langkah awal ke PIC sebagai saran
        </button>
        <span className="p-cap">Setelah ditutup, insiden ini jadi rujukan pertama untuk kasus serupa.</span>
      </div>
    </section>
  );
}
