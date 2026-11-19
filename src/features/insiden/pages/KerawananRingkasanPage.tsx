// Board: EK1 (Email ringkasan kerawanan harian ke Pejabat Berwenang KKKS). Rute: /kerawanan/ringkasan, dari "Lihat ringkasan" di tab Kerawanan.
// Isi email disalin dari board; daftar dan hitungan dari store (RINGKASAN_NOS = jendela 17 Nov 07:00 s.d. 18 Nov 07:00 WIB).
import { Link } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { RINGKASAN_NOS } from '@/services/mock/seedExtra';
import { resolveKerawanan } from '@/services/mock/workflow.kerawanan';
import { KerawananShell } from '../components/kerawanan/KerawananShell';

const KINDS = ['Kondisi rawan', 'Kejadian tanpa dampak', 'Upaya digagalkan'];
const mono = "'IBM Plex Mono',Consolas,monospace";

export function KerawananRingkasanPage() {
  const all = useDemoStore((s) => s.kerawanan);
  const rows = RINGKASAN_NOS.map((no) => all.find((k) => k.no === no)).filter((k) => !!k).map((k) => resolveKerawanan(k!));
  const count = (kind: string) => rows.filter((r) => r.kind === kind).length;
  const gagal = rows.find((r) => r.kind === 'Upaya digagalkan');
  const adr07 = rows.filter((r) => r.location === 'Sumur ADR-07');
  return (
    <KerawananShell
      title="Ringkasan kerawanan" back={{ to: '/insiden?tab=kerawanan', label: 'Kembali ke Insiden, tab Kerawanan' }}
      crumbs={[{ label: 'Insiden', to: '/insiden' }, { label: 'Kerawanan', to: '/insiden?tab=kerawanan' }, { label: 'Ringkasan' }]}
    >
      <p className="p-cap" style={{ margin: '0 0 12px' }}>Pratinjau email harian yang diterima Pejabat Berwenang KKKS.</p>
      <div className="ek-mail" style={{ width: 600, maxWidth: '100%', background: '#ffffff', fontFamily: "'IBM Plex Sans','Segoe UI',Arial,sans-serif", color: '#1d1c1a', margin: '0 auto', boxShadow: '0 0 0 1px #ecebe6' }}>
        <div style={{ padding: '14px 40px', background: '#f7f6f3', borderBottom: '1px solid #ecebe6', fontSize: 12, lineHeight: '18px', color: '#5e5b55' }}>
          <div><span style={{ display: 'inline-block', width: 64 }}>Subjek</span><b style={{ color: '#1d1c1a', fontWeight: 600 }}>Ringkasan kerawanan · 18 Nov 2026 · WK Andalas Darat</b></div>
          <div><span style={{ display: 'inline-block', width: 64 }}>Kepada</span>Sari Wulandari (Pejabat Berwenang KKKS)</div>
          <div><span style={{ display: 'inline-block', width: 64 }}>Dikirim</span>18 Nov 2026, 07:00 WIB · harian, hanya bila ada kerawanan baru dalam 24 jam terakhir</div>
        </div>
        {/* ASSUMPTION: logo SKK Migas/PERISAI (/_blob) tidak ada di artifact; diganti wordmark teks (A5). */}
        <div style={{ height: 80, padding: '0 40px', borderBottom: '1px solid #ecebe6', display: 'flex', alignItems: 'center', gap: 12, boxSizing: 'border-box' }}>
          <b style={{ fontSize: 15, letterSpacing: '.02em' }}>SKK Migas</b>
          <span aria-hidden="true" style={{ width: 1, height: 34, background: '#e4e2dd' }}></span>
          <b style={{ fontSize: 22, letterSpacing: '.04em' }}>PERISAI</b>
        </div>
        <div aria-hidden="true" style={{ display: 'flex', height: 2 }}><div style={{ flex: 4, background: '#ea292b' }}></div><div style={{ flex: 1, background: '#bed630' }}></div></div>
        <div style={{ padding: '24px 40px 40px 40px' }}>
          <h1 style={{ margin: 0, fontSize: 22, lineHeight: '30px', fontWeight: 600 }}>{rows.length} kerawanan baru di WK Andalas Darat</h1>
          <p style={{ margin: '16px 0 0 0', fontSize: 15, lineHeight: '24px' }}>Halo Sari Wulandari,</p>
          <p style={{ margin: '12px 0 0 0', fontSize: 15, lineHeight: '24px' }}>
            Ini kerawanan yang tercatat dari 17 Nov 2026, 07:00 sampai 18 Nov 2026, 07:00 WIB. Kerawanan langsung tercatat tanpa pemeriksaan dan tidak dihitung sebagai insiden.
          </p>
          <div style={{ margin: '24px 0 0 0', display: 'flex', gap: 8 }}>
            {KINDS.map((kind) => (
              <div key={kind} style={{ flex: 1, background: '#f7f6f3', borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ fontSize: 22, lineHeight: '28px', fontWeight: 600 }}>{count(kind)}</div>
                <div style={{ fontSize: 13, lineHeight: '18px', color: '#5e5b55' }}>{kind}</div>
              </div>
            ))}
          </div>

          <h2 style={{ margin: '28px 0 0 0', fontSize: 15, lineHeight: '22px', fontWeight: 600 }}>Perlu dilihat</h2>
          {gagal && (
            <div style={{ marginTop: 8, borderLeft: '3px solid #1d1c1a', padding: '2px 0 2px 12px' }}>
              <div style={{ fontSize: 15, lineHeight: '22px', fontWeight: 500 }}>{gagal.title}</div>
              <div style={{ fontSize: 13, lineHeight: '18px', color: '#5e5b55' }}><span style={{ fontFamily: mono, fontSize: 12 }}>{gagal.no}</span> · {gagal.kind} · {gagal.location}</div>
            </div>
          )}
          {adr07.length >= 2 && (
            <div style={{ marginTop: 12, borderLeft: '3px solid #1d1c1a', padding: '2px 0 2px 12px' }}>
              <div style={{ fontSize: 15, lineHeight: '22px', fontWeight: 500 }}>Sumur ADR-07 · {adr07.length} kerawanan dalam 24 jam</div>
              <div style={{ fontSize: 13, lineHeight: '18px', color: '#5e5b55' }}>Motor tanpa pelat berhenti lama di dekat sumur, lalu gembok gerbang sumur rusak beberapa jam kemudian.</div>
            </div>
          )}

          <h2 style={{ margin: '28px 0 0 0', fontSize: 15, lineHeight: '22px', fontWeight: 600 }}>Semua kerawanan baru ({rows.length})</h2>
          <table className="ek-t">
            <thead>
              <tr><th style={{ width: 132 }}>Nomor</th><th>Judul</th><th style={{ width: 104 }}>Jenis</th><th style={{ width: 118, paddingRight: 0 }}>Lokasi</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.no}>
                  <td className="no">{r.no}</td><td>{r.title}</td><td className="sub">{r.kind}</td><td className="sub" style={{ paddingRight: 0 }}>{r.location}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Link
            to="/insiden?tab=kerawanan"
            style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 24px', marginTop: 24, borderRadius: 6, background: '#1d1c1a', color: '#ffffff', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}
          >
            Buka tab Kerawanan
          </Link>
          <p style={{ margin: '16px 0 0 0', fontSize: 12, lineHeight: '16px', color: '#6b675f' }}>Jika tombol tidak berfungsi, salin tautan berikut ke browser:</p>
          <p style={{ margin: '4px 0 0 0', fontFamily: mono, fontSize: 12, lineHeight: '16px', color: '#1d1c1a', textDecoration: 'underline' }}>https://perisai.skkmigas.go.id/insiden?tab=kerawanan</p>
          <p style={{ margin: '24px 0 0 0', fontSize: 15, lineHeight: '24px' }}>Tidak perlu persetujuan. Bila ada yang ternyata berdampak, buka laporannya lalu pilih Naikkan jadi insiden.</p>
          <div aria-hidden="true" style={{ height: 64, display: 'flex', alignItems: 'center' }}><div style={{ flex: 1, height: 1, background: '#ecebe6' }}></div></div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: '16px', color: '#6b675f' }}>Email ini dikirim otomatis oleh PERISAI. Jangan membalas email ini.</p>
          <p style={{ margin: '4px 0 0 0', fontSize: 12, lineHeight: '16px', color: '#6b675f' }}><a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#1d1c1a', textDecoration: 'underline' }}>Atur ringkasan di Pengaturan notifikasi</a></p>
        </div>
        <div style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, lineHeight: '16px', color: '#6b675f' }}>© 2026 SKK Migas. Hak cipta dilindungi.</div>
      </div>
    </KerawananShell>
  );
}
