// Analitik insiden (board Analitik.dc.html; INS-07). Dua peran: SKK (per KKKS) dan KKKS (per wilayah kerja).
// Tata letak: KPI → [Peta sebaran 8 kolom | Butuh perhatian 4 kolom, tinggi sama 470 px, daftar bisa digulir] → [Tren 7 | Per kategori 5]
// → Per keparahan, Kerawanan → tabel. Angka demo dari logic/analitik.ts.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Icon } from '@/components/ui/Icon';
import { DateField } from '@/components/ui/DateField';
import { isSkk } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import { analitik, PERIODS, type Measure, type Period, type SortKey } from '../logic/analitik';

const SORT_ICON = { asc: 'M12 19V5M5 12l7-7 7 7', desc: 'M12 5v14M19 12l-7 7-7-7', none: 'M8 9l4-4 4 4M16 15l-4 4-4-4' };
const MONTH_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

/** "2026-07-01", "2026-10-15" → "1 Jul–15 Okt 2026" */
const rangeLabel = (a: string, b: string): string | undefined => {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  if (pa.length !== 3 || pb.length !== 3 || a > b) return undefined;
  const left = pa[0] === pb[0] ? `${pa[2]} ${MONTH_ID[pa[1] - 1]}` : `${pa[2]} ${MONTH_ID[pa[1] - 1]} ${pa[0]}`;
  return `${left}–${pb[2]} ${MONTH_ID[pb[1] - 1]} ${pb[0]}`;
};

const Filter = ({ k, v = 'Semua' }: { k: string; v?: string }) => (
  <button type="button" className="p-input" style={{ height: 36, border: 0, font: 'inherit', cursor: 'pointer' }}>
    <span className="p-cap" style={{ fontWeight: 600 }}>{k}</span>
    <span style={{ fontWeight: 600 }}>{v}</span>
    <Icon name="chevDown" size={14} />
  </button>
);

export function AnalitikPage() {
  const role = useDemoStore((s) => s.role);
  const skk = isSkk(role);
  const [period, setPeriod] = useState<Period>('ytd');
  const [perOpen, setPerOpen] = useState(false);
  const [cuOpen, setCuOpen] = useState(false);
  const [from, setFrom] = useState('2026-07-01');
  const [to, setTo] = useState('2026-10-15');
  const [custom, setCustom] = useState<string>();
  const [measure, setMeasure] = useState<Measure>('n');
  const [sort, setSort] = useState<SortKey>('cnt');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [dl, setDl] = useState(false);
  const v = useMemo(() => analitik({ skk, period, measure, sort, dir, customLabel: custom }), [skk, period, measure, sort, dir, custom]);
  const cols = (skk ? [['cnt', 'Insiden'], ['rp', 'Kerugian'], ['tk', 'Tinggi & Kritis'], ['dur', 'Rata-rata lama penanganan']] : [['cnt', 'Insiden'], ['rp', 'Kerugian'], ['tk', 'Tinggi & Kritis'], ['dur', 'Rata-rata lama penanganan']]) as [SortKey, string][];
  const cur = PERIODS.find((p) => p.key === period)!;
  const listHref = skk ? '/insiden' : '/insiden';
  const barCols = `repeat(${v.trend.length}, minmax(0, 1fr))`;
  const apply = () => {
    const label = rangeLabel(from, to);
    if (!label) return;
    setCustom(label);
    setPeriod('cu');
    setCuOpen(false);
    setPerOpen(false);
  };

  return (
    <AppShell nav="analitik" title="Analitik insiden" subtitle={skk ? 'Insiden yang sudah disetujui KKKS.' : 'Insiden organisasi Anda yang sudah disetujui.'}>
      {!skk && (
        <div className="p-note" style={{ alignItems: 'flex-start' }}>
          <Icon name="lock" size={16} />
          <span><b>Hanya data organisasi Anda.</b> Angka di halaman ini mencakup PT Samudra Energi Nusantara saja. Data dan rata-rata KKKS lain tidak ditampilkan.</span>
        </div>
      )}

      <section className="p-card" style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <button
            type="button" className="p-input" aria-label="Periode" aria-haspopup="listbox" aria-expanded={perOpen}
            onClick={() => { setPerOpen(!perOpen); setDl(false); }} style={{ height: 36, border: 0, font: 'inherit', fontWeight: 600, cursor: 'pointer' }}
          >
            <Icon name="calendar" size={16} />{period === 'cu' ? 'Rentang khusus' : cur.label} · {v.perLabel}<Icon name="chevDown" size={14} />
          </button>
          {perOpen && (
            <div className="p-pop an-per" role="listbox" aria-label="Periode" style={{ left: 0, top: 44 }}>
              <div className="p-list">
                {PERIODS.map((o) => (
                  <button
                    key={o.key} type="button" role="option" aria-checked={period === o.key} aria-selected={period === o.key} className="p-opt an-opt"
                    onClick={() => (o.key === 'cu' ? setCuOpen(true) : (setPeriod(o.key), setPerOpen(false), setCuOpen(false)))}
                  >
                    <b>{o.label}</b><span className="p-cap">{o.desc}</span>
                  </button>
                ))}
                {cuOpen && (
                  <div className="an-cu" style={{ padding: 10 }}>
                    <DateField label="Dari" value={from} onChange={setFrom} max={to || undefined} />
                    <DateField label="Sampai" value={to} onChange={setTo} min={from || undefined} />
                    <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => setCuOpen(false)}>Batal</button>
                    <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={apply} disabled={!rangeLabel(from, to)}>Terapkan</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {skk && <Filter k="KKKS" />}
        {skk && <Filter k="Wilayah" />}
        {!skk && <Filter k="Wilayah kerja" />}
        <Filter k="Kategori" />
        <Filter k="Keparahan" />
        <span style={{ flex: 1 }}></span>
        <span className="p-lbl">Tampilkan</span>
        <div className="p-qf" role="radiogroup" aria-label="Ukuran grafik">
          {([['n', 'Jumlah'], ['rp', 'Kerugian (Rp)']] as [Measure, string][]).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={measure === k} onClick={() => setMeasure(k)}>{l}</button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" aria-haspopup={skk ? 'menu' : undefined} aria-expanded={skk ? dl : undefined} onClick={() => { setDl(!dl); setPerOpen(false); }}>
            <Icon name="upload" size={16} style={{ transform: 'rotate(180deg)' }} />{skk ? 'Unduh' : 'Unduh PDF'}
          </button>
          {skk && dl && (
            <div className="p-pop" role="menu" aria-label="Unduh" style={{ position: 'absolute', right: 0, top: 44, width: 300, zIndex: 30 }}>
              <div className="p-list">
                <button type="button" role="menuitem" className="p-opt an-opt" onClick={() => setDl(false)}><b>PDF laporan pimpinan</b><span className="p-cap">Ringkasan angka dan grafik sesuai filter aktif</span></button>
                <button type="button" role="menuitem" className="p-opt an-opt" onClick={() => setDl(false)}><b>Excel rekap format SKK</b><span className="p-cap">Satu baris per insiden, kolom mengikuti rekap SKK</span></button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="lk-grid">
        <div className="c12" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
          {v.kpis.map((k) => (
            <div className="p-kpi" key={k.label}>
              <div className="k-head">{k.label}</div>
              <div><span className="k-val">{k.val}</span><span className="k-unit">{k.unit}</span></div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}><span className={'p-trend ' + k.trCls}>{k.tr}</span><span className="p-cap">{k.cmp}</span></div>
              <Link className="k-link" to={listHref}>{k.link}</Link>
            </div>
          ))}
        </div>

        <section className="p-card c8 an-row1">
          <div className="lk-card-head">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><h2 className="p-h2">Peta sebaran</h2><span className="p-cap">Ukuran titik = {measure === 'n' ? 'jumlah insiden' : 'kerugian'} per kabupaten/kota</span></div>
            <span className="p-tag t-caution">Basis peta menunggu Q-272</span>
          </div>
          <div className="p-map an-map" role="img" aria-label={'Peta sebaran insiden: ' + v.topLoc.map((l) => `${l.n} ${l.v}`).join(', ')}>
            <svg className="base" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
              <ellipse className="land" cx="122" cy="146" rx="178" ry="40" transform="rotate(50 122 146)" />
              <ellipse className="land" cx="326" cy="312" rx="106" ry="15" transform="rotate(9 326 312)" />
              <ellipse className="land" cx="476" cy="338" rx="58" ry="8" transform="rotate(-4 476 338)" />
              <ellipse className="land" cx="420" cy="140" rx="92" ry="102" />
              <ellipse className="land" cx="560" cy="185" rx="20" ry="88" transform="rotate(-8 560 185)" />
              <ellipse className="land" cx="604" cy="138" rx="44" ry="11" transform="rotate(-12 604 138)" />
              <ellipse className="land" cx="598" cy="220" rx="36" ry="10" transform="rotate(20 598 220)" />
              <ellipse className="land" cx="700" cy="170" rx="18" ry="26" />
              <ellipse className="land" cx="920" cy="245" rx="92" ry="56" transform="rotate(8 920 245)" />
              <ellipse className="land" cx="288" cy="48" rx="12" ry="8" />
            </svg>
            {v.dots.map((d) => <span key={d.tip} className="an-dot" title={d.tip} style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s }}></span>)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 12 }}>
            {v.topLoc.map((l) => <span className="p-cap" key={l.n}><b style={{ color: 'var(--ink)' }}>{l.n}</b> {l.v}</span>)}
          </div>
        </section>

        <section className="p-card c4 an-row1 an-attc">
          <div className="lk-card-head" style={{ marginBottom: 4 }}><h2 className="p-h2">Butuh perhatian</h2><span className="p-tag t-caution">{v.attn.length}</span></div>
          <div className="lk-rows">
            {v.attn.map((a) => (
              <div className="an-att" key={a.t}>
                <span className="ic" aria-hidden="true"><Icon name="warn" size={15} /></span>
                <div><b>{a.t}</b><span className="p-cap">{a.d}</span></div>
                <Link className="p-btn p-btn-secondary p-btn-sm" to={listHref}>Buka</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="p-card c7">
          <div className="lk-card-head">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><h2 className="p-h2">{v.trendTitle}</h2><span className="p-cap">{v.mLabel} · {v.perLabel}</span></div>
            <span className="p-cap">Total <b style={{ color: 'var(--ink)' }}>{v.trendTotal}</b></span>
          </div>
          <div className="an-bars" style={{ gridTemplateColumns: barCols }} role="img" aria-label={`Tren ${v.mLabel.toLowerCase()}, ${v.perLabel}`}>
            {v.trend.map((b) => <div className="an-col" key={b.m}><span className="v">{b.lbl}</span><i style={{ height: `${b.h}%` }}></i></div>)}
          </div>
          <div className="an-x" style={{ gridTemplateColumns: barCols }} aria-hidden="true">{v.trend.map((b) => <span key={b.m}>{b.m}</span>)}</div>
        </section>

        <section className="p-card c5">
          <div className="lk-card-head"><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><h2 className="p-h2">Per kategori</h2><span className="p-cap">8 teratas · {v.mLabel}</span></div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {v.cats.map((c) => (
              <div className={'an-hb' + (c.rest ? ' rest' : '')} key={c.n}><span>{c.n}</span><span className="t"><i style={{ width: `${c.w}%` }}></i></span><span className="n">{c.lbl}</span></div>
            ))}
          </div>
        </section>

        <section className="p-card c8">
          <div className="lk-card-head"><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><h2 className="p-h2">Per keparahan</h2><span className="p-cap">{v.mLabel} · 5 level sesuai matriks keparahan</span></div></div>
          <div className="an-stack" role="img" aria-label={'Sebaran keparahan: ' + v.sev.map((s) => `${s.n} ${s.lbl}`).join(', ')}>
            {v.sev.map((s) => <i key={s.n} style={{ width: `${s.w}%`, background: s.c }}></i>)}
          </div>
          <div className="an-sevl">
            {v.sev.map((s) => <div key={s.n}><span className="k"><i style={{ background: s.c }}></i>{s.n}</span><b>{s.lbl}</b><span className="p-cap">{s.pct}</span></div>)}
          </div>
        </section>

        <section className="p-card c4">
          <div className="lk-card-head" style={{ marginBottom: 8 }}><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><h2 className="p-h2">Kerawanan (indikator awal)</h2><span className="p-cap">Tidak dihitung sebagai insiden</span></div></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <div><span className="metric" style={{ fontSize: 28, lineHeight: '34px', fontWeight: 700 }}>{v.krTotal}</span><span className="p-cap" style={{ display: 'block' }}>kerawanan tercatat · {v.perLabel}</span></div>
            <svg className="an-spark" viewBox="0 0 200 48" width="160" height="48" role="img" aria-label={v.krAria}><polyline points={v.krPts}></polyline></svg>
          </div>
          <div className="lk-divider" style={{ margin: '14px 0 10px 0' }}></div>
          <Link className="lk-alink" to="/insiden?tab=kerawanan">Lihat daftar kerawanan</Link>
        </section>

        <section className="p-card c12" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="p-toolbar" style={{ justifyContent: 'space-between', padding: '16px 20px 12px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><h2 className="p-h2">{v.tblTitle}</h2><span className="p-cap">{v.tblSub}</span></div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="p-table lk-tbl" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>{v.col0}</th>
                  {cols.map(([k, l]) => (
                    <th key={k} aria-sort={sort === k ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'} style={{ textAlign: 'right' }}>
                      <button type="button" className="lk-sort" onClick={() => { setSort(k); setDir(sort === k && dir === 'desc' ? 'asc' : 'desc'); }}>
                        {l}<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14 }}><path d={sort === k ? SORT_ICON[dir] : SORT_ICON.none} /></svg>
                      </button>
                    </th>
                  ))}
                  <th style={{ paddingRight: 20 }}>{v.colLast}</th>
                </tr>
              </thead>
              <tbody>
                {v.rows.map((r) => (
                  <tr key={r.n}>
                    <td style={{ paddingLeft: 20 }}><Link className="ttl" to={listHref}>{r.n}</Link><span className="sub">{r.sub}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.cnt}</td>
                    <td style={{ textAlign: 'right' }}>{r.rpL}</td>
                    <td style={{ textAlign: 'right' }}>{r.tk}</td>
                    <td style={{ textAlign: 'right' }}>{r.durL}</td>
                    <td style={{ paddingRight: 20 }}>
                      {r.kepW !== null ? <span className="lk-mit"><span className="p-prog"><span style={{ width: `${r.kepW}%` }}></span></span><span>{r.kepL}</span></span> : r.last}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--ink-muted)' }}>{v.tblFoot}</div>
        </section>
      </div>
      <p className="p-cap" style={{ margin: 0 }}>{v.foot}</p>
    </AppShell>
  );
}
