// Tambah tindak lanjut dari Arahan SKK (artifact TLJ-01 T12A; FR-TL-03b). Aksi hanya untuk pengguna berizin (bawaan R-04, R-05, R-06;
// di prototipe: Pejabat Berwenang). Satu poin arahan = satu tindak lanjut dengan satu PIC.
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { DateField } from '@/components/ui/DateField';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { ARAHAN_CHANNELS, addArahanFollowUp, MAX_ACTION, MAX_EVIDENCE_HINT, TL_NOW } from '@/services/mock/workflow.followup';
import { TlShell } from '../components/TlShell';

const PICS = ['Rudi Hartono', 'Dedi Kurniawan', 'Joko Susilo', 'Andi Pratama'];
const areaStyle = { minHeight: 72, border: 0, font: 'inherit', resize: 'vertical' as const, width: '100%', boxSizing: 'border-box' as const };

export function TlArahanFormPage() {
  const navigate = useNavigate();
  const role = useDemoStore((s) => s.role);
  const decide = useDemoStore((s) => s.decide);
  const me = DEMO_USERS[role].name;
  const [v, setV] = useState({ date: '', channel: '', giver: '', action: '', pic: '', dueDate: '', evidence: '' });
  const [tried, setTried] = useState(false);
  const [error, setError] = useState('');
  if (role !== 'pejabat') return <Navigate to="/tindak-lanjut" replace />;

  const miss = {
    date: !v.date, channel: !v.channel, giver: !v.giver.trim(), action: !v.action.trim(), pic: !v.pic, dueDate: !v.dueDate,
  };
  const err = (k: keyof typeof miss, text: string) => tried && miss[k] && <span className="p-help err" role="alert">{text}</span>;
  const submit = () => {
    setTried(true);
    if (Object.values(miss).some(Boolean)) return;
    const r = decide((s) => addArahanFollowUp(s, { date: v.date, channel: v.channel, giver: v.giver, action: v.action, pic: v.pic, dueDate: v.dueDate, expectedEvidence: v.evidence, by: me, at: TL_NOW }));
    if (!r.ok) { setError(r.reason); return; }
    const no = useDemoStore.getState().followUps[0]?.no ?? '';
    navigate(`/tindak-lanjut/${no}`, { state: { toast: `Tindak lanjut ${no} dibuat dan PIC diberi tahu` } });
  };
  const set = (p: Partial<typeof v>) => setV({ ...v, ...p });

  return (
    <TlShell title="Tambah tindak lanjut" crumbNo="Tambah tindak lanjut">
      {error && <div className="in-bn err" role="alert"><div className="body"><b>Tindak lanjut gagal dibuat.</b> {error}</div></div>}
      <div className="lk-grid">
        <div className="c8 lk-stack">
          <section className="p-card in-sec">
            <h2 className="in-h">Arahan SKK</h2>
            <span className="p-cap">Arahan SKK Migas yang disampaikan di luar PERISAI.</span>
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Tanggal arahan<span className="p-req">*</span></span>
              <DateField label="Tanggal arahan" value={v.date} onChange={(d) => set({ date: d })} max={TL_NOW.slice(0, 10)} today={TL_NOW.slice(0, 10)} invalid={tried && miss.date} />
              {err('date', 'Pilih tanggal arahan.')}
            </div>
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Cara penyampaian<span className="p-req">*</span></span>
              <select className="p-input" aria-label="Cara penyampaian" value={v.channel} onChange={(e) => set({ channel: e.target.value })}>
                <option value="">Pilih cara penyampaian</option>
                {ARAHAN_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="p-help">Rapat, Surat, Kunjungan lapangan, Lisan, atau Lainnya.</span>
              {err('channel', 'Pilih cara penyampaian.')}
            </div>
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Pemberi arahan<span className="p-req">*</span></span>
              <label className="p-input"><input aria-label="Pemberi arahan" maxLength={120} value={v.giver} onChange={(e) => set({ giver: e.target.value })} className="tl-bare" /></label>
              <span className="p-help row"><span>Nama dan jabatan pemberi arahan di SKK Migas.</span><span>{v.giver.length}/120</span></span>
              {err('giver', 'Tulis pemberi arahan.')}
            </div>
          </section>

          <section className="p-card in-sec">
            <h2 className="in-h">Tindak lanjut</h2>
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Tindakan<span className="p-req">*</span></span>
              <textarea className={'p-input p-area' + (tried && miss.action ? ' err' : '')} aria-label="Tindakan" maxLength={MAX_ACTION} value={v.action} onChange={(e) => set({ action: e.target.value })} style={areaStyle} />
              <span className="p-help row"><span>Satu poin arahan = satu tindak lanjut. Poin lain dibuat sebagai tindak lanjut terpisah.</span><span>{v.action.length}/{MAX_ACTION}</span></span>
              {err('action', 'Tulis tindakan tindak lanjut.')}
            </div>
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Dikerjakan oleh<span className="p-req">*</span></span>
              <select className="p-input" aria-label="PIC" value={v.pic} onChange={(e) => set({ pic: e.target.value })}>
                <option value="">Pilih PIC</option>
                {PICS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <span className="p-help">Hanya pengguna aktif di organisasi Anda.</span>
              {err('pic', 'Pilih PIC tindak lanjut.')}
            </div>
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Tenggat<span className="p-req">*</span></span>
              <DateField label="Tenggat" value={v.dueDate} onChange={(d) => set({ dueDate: d })} min={TL_NOW.slice(0, 10)} today={TL_NOW.slice(0, 10)} invalid={tried && miss.dueDate} />
              {err('dueDate', 'Tanggal tidak boleh sebelum hari ini.')}
            </div>
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Bukti selesai <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
              <textarea className="p-input p-area" aria-label="Bukti selesai" placeholder="Mis. jadwal patroli baru dan log patroli 1 minggu" maxLength={MAX_EVIDENCE_HINT} value={v.evidence} onChange={(e) => set({ evidence: e.target.value })} style={areaStyle} />
              <span className="p-help row"><span>Dilampirkan PIC saat mengajukan selesai.</span><span>{v.evidence.length}/{MAX_EVIDENCE_HINT}</span></span>
            </div>
          </section>
        </div>
        <aside className="c4 lk-stack">
          <section className="p-card in-sec">
            <h2 className="in-h">Penugasan</h2>
            <dl className="tl-kv">
              <dt>Pemeriksa</dt><dd>{me} (Anda), juga pemberi tugas</dd>
              <dt>Pemeriksa bukti</dt><dd>Pembuat sendiri</dd>
              <dt>Status awal</dt><dd><span className="p-tag t-neutral">Belum dimulai</span></dd>
            </dl>
          </section>
          <div className="p-note">PIC menerima notifikasi dan email tugas baru. SKK Migas melihat tindak lanjut ini setelah Selesai atau Dibatalkan.</div>
        </aside>
      </div>
      <div className="lk-ffoot" role="region" aria-label="Aksi formulir">
        <button type="button" className="p-btn p-btn-secondary" onClick={() => navigate('/tindak-lanjut')}>Batal</button>
        <button type="button" className="p-btn p-btn-primary" onClick={submit}>Tambah tindak lanjut</button>
      </div>
    </TlShell>
  );
}
