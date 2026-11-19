// Board: CFG-Daftar. `?modul=ins|wpb|pst|kbj|pks|real` memfilter modul; `?buka=semua` membuka semua grup.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { SEVERITIES } from '@/lib/severity';
import { formatDate } from '@/lib/format';
import { matrixVersion } from '@/services/mock/workflow.config';
import { AdminGate } from '../components/ConfigShell';
import { RAW_INPUT } from '../components/Field';
import { matrixVersions, tenggatHistory } from '../logic/levels';

interface Row { t: string; d: string; v: string; href: string; at: string; by: string; tag?: string; ex?: boolean }
interface Group { k: string; t: string; rows: Row[] }

const R = (t: string, d: string, v: string, href: string, at: string, by: string, tag = '', ex = false): Row => ({ t, d, v, href, at, by, tag, ex });

export function KonfigurasiDaftarPage() {
  return (
    <AdminGate>
      <DaftarBody />
    </AdminGate>
  );
}

function DaftarBody() {
  const config = useDemoStore((s) => s.config);
  const [params] = useSearchParams();
  const f = params.get('modul') ?? 'semua';
  const bawaan = params.get('buka') === 'semua' ? 'semua' : 'pertama';
  const [open, setOpen] = useState<Record<string, boolean> | null>(null);
  const [q, setQ] = useState('');

  const mx = matrixVersions(config)[0];
  const tg = tenggatHistory(config)[0];
  const days = SEVERITIES.map((s) => config.deadlines[s]);
  const G: Group[] = [
    { k: 'ins', t: 'Insiden', rows: [
      R('Matriks keparahan', 'Ambang dampak per level untuk saran keparahan.', `5 level · versi ${matrixVersion(config)}`, '/konfigurasi/matriks-keparahan', mx ? formatDate(mx.at) : '—', mx?.by ?? 'Sistem', '', true),
      R('Tenggat penanganan', 'Batas waktu menyelesaikan insiden per keparahan, sejak registrasi.', `${Math.min(...days)}–${Math.max(...days)} hari`, '/konfigurasi/tenggat', tg ? formatDate(tg.at) : '—', tg?.by ?? 'Sistem', '', true),
    ] },
    { k: 'wpb', t: 'Anggaran WP&B', rows: [
      R('Kategori anggaran', 'Kategori pengamanan untuk Pre-WP&B, Pleno, dan Revisi WP&B, beserta kode CSV (KAT-01 FR-KAT-01–07).', '11 aktif', '#', '20 Okt 2026', 'Sistem'),
      R('Kurs USD per tahun anggaran', 'Untuk padanan USD di form, detail, dan MoM. Nilai tetap disimpan dalam Rupiah (FR-KAT-09).', '2027 · Rp17.500', '#', '20 Okt 2026', 'Sistem'),
      R('Ambang Cek sebelum kirim', 'Perubahan dari nilai disetujui tahun sebelumnya yang dimunculkan sebagai pengingat di form Pre-WP&B (FR-KAT-10).', '10%', '#', '20 Okt 2026', 'Sistem'),
    ] },
    { k: 'pst', t: 'Persetujuan Teknis', rows: [
      R('Komponen biaya Perstek', 'Kerangka komponen yang muncul otomatis di form Perstek (FR-PST-02, 20).', '4 aktif · 1 nonaktif', '#', '30 Okt 2026', 'Sari Wulandari'),
      R('Pengingat masa berlaku', 'Ambang nilai, jendela pengingat, dan interval pengulangan untuk Perstek dan kontrak BUJP (FR-PST-14, 15; FR-KBJ-14).', 'Rp75 M · 12 / 6 bulan · tiap 30 hari', '#', '20 Okt 2026', 'Sistem'),
    ] },
    { k: 'kbj', t: 'Kontrak BUJP', rows: [
      R('Label sisa waktu kontrak', 'Rentang hari untuk label sisa waktu kontrak di daftar dan detail (FR-KBJ-32).', '4 rentang', '#', '20 Okt 2026', 'Sistem'),
    ] },
    { k: 'pks', t: 'PKS/PKT', rows: [
      R('Titik pengingat', 'Kapan pengingat masa berlaku PKS/PKT dikirim ke SKK dan KKKS (FR-PKS-12, 24).', '90 / 60 / 30 hari', '#', '20 Okt 2026', 'Sistem'),
    ] },
    { k: 'real', t: 'Realisasi & Monev', rows: [
      R('Parameter Realisasi & Monev', 'Usulan, PRD menyusul.', 'Usulan', '#', '—', '—', 't-info'),
    ] },
  ];

  const text = q.trim().toLowerCase();
  const match = (r: Row) => !text || `${r.t} ${r.d}`.toLowerCase().includes(text);
  const shown = G.filter((g) => f === 'semua' || g.k === f);
  const isOpen = (g: Group, i: number) => (open ? !!open[g.k] : bawaan === 'semua' || f !== 'semua' || i === 0 || !!text);
  const toggle = (g: Group, i: number) => {
    const cur: Record<string, boolean> = {};
    shown.forEach((x, j) => { cur[x.k] = isOpen(x, j); });
    cur[g.k] = !isOpen(g, i);
    setOpen(cur);
  };
  const fName = G.find((g) => g.k === f)?.t ?? '';

  return (
    <AppShell nav="pengaturan" title="Konfigurasi Modul" subtitle="Parameter sistem per modul yang dikelola Admin SKK. Berlaku untuk semua KKKS dan tercatat di jejak audit.">
      <section className="p-card" style={{ padding: 0 }}>
        <div className="p-toolbar" style={{ padding: '16px 20px 12px' }}>
          <h2 className="p-h2" style={{ flex: 1 }}>Semua konfigurasi</h2>
          <span className="p-input" style={{ width: 260, height: 36 }}>
            <Icon name="search" size={16} style={{ color: 'var(--ink-muted)' }} />
            <input
              aria-label="Cari konfigurasi" placeholder="Cari konfigurasi" value={q} onChange={(e) => setQ(e.target.value)}
              style={{ ...RAW_INPUT, flex: 1 }}
            />
          </span>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm">
            <Icon name="filter" size={15} />Filter
          </button>
        </div>
        {f !== 'semua' && (
          <div className="lk-applied">
            <span className="p-pill">Modul: <b>{fName}</b><Icon name="close" size={14} /></span>
            <Link to="/konfigurasi" className="p-tbtn" style={{ textDecoration: 'none' }}>Hapus filter</Link>
          </div>
        )}
        <table className="p-table lk-tbl pg-t">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>Konfigurasi</th>
              <th>Nilai saat ini</th>
              <th>Terakhir diubah</th>
              <th style={{ paddingRight: 20, width: 72 }}><span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((g, i) => {
              const o = isOpen(g, i);
              const rows = g.rows.filter(match);
              if (text && rows.length === 0) return null;
              return [
                <tr className="pg-grp" key={g.k}>
                  <td colSpan={4} style={{ padding: 0 }}>
                    <button type="button" className="pg-tg" aria-expanded={o} onClick={() => toggle(g, i)}>
                      <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14, transform: `rotate(${o ? '0deg' : '-90deg'})` }}><path d="m6 9 6 6 6-6" /></svg>
                      {g.t}<span className="n">· {g.rows.length} konfigurasi</span>
                      {!o && <span className="pg-sum">{g.rows.map((r) => r.t).join(' · ')}</span>}
                    </button>
                  </td>
                </tr>,
                ...(o ? rows : []).map((r) => (
                  <tr key={g.k + r.t}>
                    <td style={{ paddingLeft: 20 }}><RowLink r={r} cls="pg-n">{r.t}</RowLink><span className="pg-d">{r.d}</span></td>
                    <td>
                      {r.tag ? <span className={`p-tag ${r.tag}`}>{r.v}</span> : <span>{r.v}</span>}
                    </td>
                    <td><span>{r.at}</span><span className="sub">{r.by}</span></td>
                    <td style={{ paddingRight: 20 }}>
                      <RowLink r={r} cls="p-tbtn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Buka</RowLink>
                    </td>
                  </tr>
                )),
              ];
            })}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}

/** Tautan ke halaman konfigurasi; modul yang belum punya halaman (`#`) tidak berpindah. */
function RowLink({ r, cls, style, children }: { r: Row; cls: string; style?: React.CSSProperties; children: React.ReactNode }) {
  if (r.href === '#') return <a href="#" className={cls} style={style} onClick={(e) => e.preventDefault()}>{children}</a>;
  return <Link to={r.href} className={cls} style={style}>{children}</Link>;
}
