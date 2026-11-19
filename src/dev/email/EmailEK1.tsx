import { AUTO_NOTE, EmailButton, EmailDivider, EmailShell, FONT_MONO } from './EmailTemplate';

const STATS: [string, string][] = [['3', 'Kondisi rawan'], ['2', 'Kejadian tanpa dampak'], ['1', 'Upaya digagalkan']];
const ROWS: [string, string, string, string][] = [
  ['KRW-SEN-2026-0046', 'Upaya pemotongan pipa idle digagalkan', 'Upaya digagalkan', 'Jalur pipa SP Batu Ampar KM 12'],
  ['KRW-SEN-2026-0045', 'Lampu jalan akses SP padam', 'Kondisi rawan', 'Jalan akses SP Batu Ampar'],
  ['KRW-SEN-2026-0044', 'Gembok gerbang sumur ADR-07 rusak', 'Kondisi rawan', 'Sumur ADR-07'],
  ['KRW-SEN-2026-0043', 'Motor tanpa pelat berhenti lama dekat sumur', 'Kejadian tanpa dampak', 'Sumur ADR-07'],
  ['KRW-SEN-2026-0042', 'Kamera CCTV sisi timur terminal mati', 'Kondisi rawan', 'Terminal Arunika'],
  ['KRW-SEN-2026-0041', 'Warga masuk jalur pipa tanpa izin', 'Kejadian tanpa dampak', 'Jalur pipa SP Batu Ampar KM 9'],
];
export const EK1_META = {
  subjek: 'Ringkasan kerawanan · 18 Nov 2026 · WK Andalas Darat',
  kepada: 'Sari Wulandari (Pejabat Berwenang KKKS)',
  dikirim: '18 Nov 2026, 07:00 WIB · harian, hanya bila ada kerawanan baru dalam 24 jam terakhir',
};

const cap = { fontSize: 13, lineHeight: '18px', color: '#5e5b55' } as const;
const metaLabel = { display: 'inline-block', width: 64 } as const;

/** EK1-RingkasanKerawanan.dc.html. Blok meta Subjek/Kepada/Dikirim ada di dalam email pada board; dipertahankan. */
export function EmailEK1() {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ padding: '14px 40px', background: '#f7f6f3', borderBottom: '1px solid #ecebe6', fontSize: 12, lineHeight: '18px', color: '#5e5b55' }}>
        <div><span style={metaLabel}>Subjek</span><b style={{ color: '#1d1c1a', fontWeight: 600 }}>{EK1_META.subjek}</b></div>
        <div><span style={metaLabel}>Kepada</span>{EK1_META.kepada}</div>
        <div><span style={metaLabel}>Dikirim</span>{EK1_META.dikirim}</div>
      </div>
      <EmailShell>
        <h1 style={{ margin: 0, fontSize: 22, lineHeight: '30px', fontWeight: 600 }}>6 kerawanan baru di WK Andalas Darat</h1>
        <p style={{ margin: '16px 0 0 0', fontSize: 15, lineHeight: '24px' }}>Halo Sari Wulandari,</p>
        <p style={{ margin: '12px 0 0 0', fontSize: 15, lineHeight: '24px' }}>Ini kerawanan yang tercatat dari 17 Nov 2026, 07:00 sampai 18 Nov 2026, 07:00 WIB. Kerawanan langsung tercatat tanpa pemeriksaan dan tidak dihitung sebagai insiden.</p>
        <div style={{ margin: '24px 0 0 0', display: 'flex', gap: 8 }}>
          {STATS.map(([n, l]) => (
            <div key={l} style={{ flex: 1, background: '#f7f6f3', borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ fontSize: 22, lineHeight: '28px', fontWeight: 600 }}>{n}</div>
              <div style={cap}>{l}</div>
            </div>
          ))}
        </div>
        <h2 style={{ margin: '28px 0 0 0', fontSize: 15, lineHeight: '22px', fontWeight: 600 }}>Perlu dilihat</h2>
        <div style={{ marginTop: 8, borderLeft: '3px solid #1d1c1a', padding: '2px 0 2px 12px' }}>
          <div style={{ fontSize: 15, lineHeight: '22px', fontWeight: 500 }}>Upaya pemotongan pipa idle digagalkan</div>
          <div style={cap}><span style={{ fontFamily: FONT_MONO, fontSize: 12 }}>KRW-SEN-2026-0046</span> · Upaya digagalkan · Jalur pipa SP Batu Ampar KM 12</div>
        </div>
        <div style={{ marginTop: 12, borderLeft: '3px solid #1d1c1a', padding: '2px 0 2px 12px' }}>
          <div style={{ fontSize: 15, lineHeight: '22px', fontWeight: 500 }}>Sumur ADR-07 · 2 kerawanan dalam 24 jam</div>
          <div style={cap}>Motor tanpa pelat berhenti lama di dekat sumur, lalu gembok gerbang sumur rusak beberapa jam kemudian.</div>
        </div>
        <h2 style={{ margin: '28px 0 0 0', fontSize: 15, lineHeight: '22px', fontWeight: 600 }}>Semua kerawanan baru (6)</h2>
        <table className="ek-t">
          <thead>
            <tr><th style={{ width: 132 }}>Nomor</th><th>Judul</th><th style={{ width: 104 }}>Jenis</th><th style={{ width: 118, paddingRight: 0 }}>Lokasi</th></tr>
          </thead>
          <tbody>
            {ROWS.map(([no, judul, jenis, lok]) => (
              <tr key={no}><td className="no">{no}</td><td>{judul}</td><td className="sub">{jenis}</td><td className="sub" style={{ paddingRight: 0 }}>{lok}</td></tr>
            ))}
          </tbody>
        </table>
        <EmailButton label="Buka tab Kerawanan" tautan="https://perisai.skkmigas.go.id/insiden?tab=kerawanan" />
        <p style={{ margin: '24px 0 0 0', fontSize: 15, lineHeight: '24px' }}>Tidak perlu persetujuan. Bila ada yang ternyata berdampak, buka laporannya lalu pilih Naikkan jadi insiden.</p>
        <EmailDivider />
        <p style={{ margin: 0, fontSize: 12, lineHeight: '16px', color: '#6b675f' }}>{AUTO_NOTE}</p>
        <p style={{ margin: '4px 0 0 0', fontSize: 12, lineHeight: '16px', color: '#6b675f' }}>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#1d1c1a', textDecoration: 'underline' }}>Atur ringkasan di Pengaturan notifikasi</a>
        </p>
      </EmailShell>
    </div>
  );
}
