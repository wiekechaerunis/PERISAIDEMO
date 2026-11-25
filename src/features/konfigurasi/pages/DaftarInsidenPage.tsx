// ADJ-16 (KIN-01 pemilik daftar; FR-KIN-19 dan FR-KIN-25): "Kategori & jenis insiden" dan "Penyebab & faktor pendukung" di Konfigurasi
// Modul › Insiden. Daftar ini sumber pilihan di form lapor (Kategori, Jenis), koreksi Pemeriksaan, filter daftar, dan Data penutupan
// (Penyebab utama, Faktor pendukung). Prototype: baca saja; isi awal menunggu K-05.
import { useState } from 'react';
import { useDemoStore } from '@/services/mock/store';
import { formatDate } from '@/lib/format';
import { KAT } from '@/features/insiden/components/step2Data';
import { CAUSE_OPTS, FACTOR_OPTS } from '@/features/insiden/logic/handling';
import { AdminGate, ChildShell } from '../components/ConfigShell';

const pad = (n: number) => String(n).padStart(2, '0');
/** Isi awal Go-Live tercatat dengan pengubah "Sistem" (FR-KIN-26). */
const SEED_AT = '2026-11-18T09:00:00';

export function DaftarInsidenPage({ kind }: { kind: 'kategori' | 'penyebab' }) {
  return (
    <AdminGate>
      {kind === 'kategori' ? <KategoriBody /> : <PenyebabBody />}
    </AdminGate>
  );
}

function Head() {
  return (
    <thead>
      <tr>
        <th style={{ paddingLeft: 16 }}>Kode</th><th>Nama</th><th>Jenis</th><th>Status</th><th>Dipakai di</th><th style={{ paddingRight: 16 }}>Terakhir diubah</th>
      </tr>
    </thead>
  );
}

function KategoriBody() {
  const incidents = useDemoStore((s) => s.incidents);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ChildShell title="Kategori & jenis insiden">
      <section className="p-card" style={{ padding: 0 }}>
        <div className="in-bn info sm" style={{ margin: 16 }}>
          <div className="body">
            Kategori dan jenis ini berlaku untuk semua KKKS. Nama baru langsung tampil di semua insiden dan kodenya tetap. Kategori atau jenis
            nonaktif tidak tampil di laporan baru; insiden yang sudah diajukan tetap menampilkannya.
          </div>
        </div>
        <table className="p-table lk-tbl" style={{ width: '100%' }}>
          <Head />
          <tbody>
            {KAT.flatMap(([, name, desc, jenis], n) => {
              const code = `KI${pad(n + 1)}`;
              const used = incidents.filter((i) => i.category === name).length;
              const rows = [
                <tr key={code}>
                  <td style={{ paddingLeft: 16 }}><span className="p-mono">{code}</span></td>
                  <td>{name}<div className="sub">{desc}</div></td>
                  <td>
                    {jenis.length ? (
                      <button type="button" className="lk-alink" aria-expanded={open === code} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => setOpen(open === code ? null : code)}>
                        {jenis.length} jenis
                      </button>
                    ) : '—'}
                  </td>
                  <td><span className="p-tag t-ok">Aktif</span></td>
                  <td>{used} insiden</td>
                  <td style={{ paddingRight: 16 }}>{formatDate(SEED_AT)}<div className="sub">Sistem</div></td>
                </tr>,
              ];
              if (open === code) {
                jenis.forEach((j, k) =>
                  rows.push(
                    <tr key={`${code}-${k}`}>
                      <td style={{ paddingLeft: 32 }}><span className="p-mono">{code}-{pad(k + 1)}</span></td>
                      <td>{j}</td><td>—</td><td><span className="p-tag t-ok">Aktif</span></td>
                      <td>{incidents.filter((i) => i.detail?.jenis === j).length} insiden</td>
                      <td style={{ paddingRight: 16 }}>{formatDate(SEED_AT)}<div className="sub">Sistem</div></td>
                    </tr>,
                  ),
                );
              }
              return rows;
            })}
          </tbody>
        </table>
      </section>
    </ChildShell>
  );
}

function PenyebabBody() {
  const incidents = useDemoStore((s) => s.incidents);
  const used = (k: 'cause' | 'factor', name: string) =>
    incidents.filter((i) => (k === 'cause' ? i.handling?.closure?.cause === name : i.handling?.closure?.factors?.includes(name))).length;
  const List = ({ title, prefix, items, k }: { title: string; prefix: string; items: string[]; k: 'cause' | 'factor' }) => (
    <section className="p-card" style={{ padding: 0 }}>
      <div className="p-toolbar"><h2 className="p-h2">{title}</h2></div>
      <table className="p-table lk-tbl" style={{ width: '100%' }}>
        <Head />
        <tbody>
          {items.map((name, n) => (
            <tr key={name}>
              <td style={{ paddingLeft: 16 }}><span className="p-mono">{prefix}{pad(n + 1)}</span></td>
              <td>{name}</td><td>—</td><td><span className="p-tag t-ok">Aktif</span></td>
              <td>{used(k, name)} insiden</td>
              <td style={{ paddingRight: 16 }}>{formatDate(SEED_AT)}<div className="sub">Sistem</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
  return (
    <ChildShell title="Penyebab & faktor pendukung">
      <div className="lk-stack">
        <div className="in-bn info sm">
          <div className="body">
            Penyebab utama dipilih satu, Faktor pendukung boleh lebih dari satu (ADJ-14). Nama yang sama tidak boleh ada di kedua daftar. Isi
            awal menunggu K-05.
          </div>
        </div>
        <List title="Penyebab utama" prefix="PN" items={CAUSE_OPTS} k="cause" />
        <List title="Faktor pendukung" prefix="FP" items={FACTOR_OPTS} k="factor" />
      </div>
    </ChildShell>
  );
}
