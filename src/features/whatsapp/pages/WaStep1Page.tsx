// Board: I20 (Form dari WhatsApp · langkah 1 Temuan, saran AI) + IF2 (negative: saran AI gagal, ?state=ai-gagal), FR-INS-05.
import { LocationPicker } from '@/features/insiden/components/LocationPicker';
import { locate } from '@/features/insiden/logic/geo';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/format';
import { useDemoStore } from '@/services/mock/store';
import { FieldError } from '@/features/insiden/components/AiTag';
import { nextNumber } from '@/features/insiden/logic/submit';
import { AiFailedBanner, AiHead, OriginalMessagePanel, StatusNote, SubmissionCard, Toast } from '../components/parts';
import { NoDraft } from '../components/NoDraft';
import { Step1Copilot } from '../components/WaCopilot';
import { WaFormShell } from '../components/WaFormShell';
import { WA_ROUTES, step1Missing, useActiveWaDraft, waPath } from '../logic/draft';
import { locationHint } from '../logic/extract';
import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';

const ICON_INS = 'M7 18v-6a5 5 0 0 1 10 0v6M5 21h14v-3H5zM12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4';
const ICON_KRW = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01';
const TYPES = [
  { k: 'insiden', label: 'Insiden', icon: ICON_INS, desc: 'Sudah terjadi dan menimbulkan kerugian, korban, atau gangguan operasi, mis. pencurian, penghadangan.' },
  { k: 'kerawanan', label: 'Kerawanan', icon: ICON_KRW, desc: 'Kondisi atau kejadian tanpa kerugian, korban, atau gangguan operasi, mis. pagar rusak, lampu padam, orang mencurigakan.' },
] as const;
const bare = { flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0, width: '100%' } as const;

export function WaStep1Page() {
  const navigate = useNavigate();
  const { draft, message, patchForm, confirm } = useActiveWaDraft();
  const incidents = useDemoStore((s) => s.incidents);
  const [tried, setTried] = useState(false);
  const [picker, setPicker] = useState(false);
  const [toast, setToast] = useState(false);
  const [orig, setOrig] = useState(false);
  if (!draft || !message) return <NoDraft />;

  const f = draft.form;
  const miss = step1Missing(f);
  const err = (b: boolean) => tried && b;
  const hint = locationHint(message.text);
  const loc = f.lat !== null && f.lng !== null ? locate(f.lat, f.lng) : null;
  const nomor = nextNumber('INS-SEN', incidents.map((i) => i.no));
  const next = () => {
    setTried(true);
    if (Object.values(miss).some(Boolean)) return;
    navigate(waPath('kejadian', draft.id));
  };
  const save = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  const top = (
    <>
      {draft.aiState === 'gagal' && <AiFailedBanner />}
      <StatusNote
        draft={draft} step={1}
        intro={
          <>
            Draf dari pesan WhatsApp grup <b style={{ fontWeight: 600 }}>{message.group}</b>, {formatDate(message.at)}, {message.at.slice(11, 16)} WIB.
            {draft.aiState === 'ok' && (
              <> Isian bertanda <b style={{ fontWeight: 600 }}>AI</b> adalah saran, periksa sebelum mengajukan. Pesan tidak membagikan lokasi, jadi peta dibuka di area sumur ADR-07.</>
            )}
          </>
        }
      />
    </>
  );

  const main = (
    <section className="p-card">
      <div className="lk-card-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 className="p-h2">Temuan</h2>
        <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => setOrig(true)}>Lihat pesan asli</button>
      </div>
      <div className="lk-f2">
        <div className="p-field lk-span2">
          <AiHead id="wa-f-kind" draft={draft} k="kind" label="Jenis laporan" required onConfirm={confirm} />
          <div role="radiogroup" aria-label="Jenis laporan" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TYPES.map((t) => (
              <button key={t.k} type="button" role="radio" className="jn" aria-checked={t.k === 'insiden'} aria-disabled={t.k === 'kerawanan'}>
                <span className="ic"><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 15, height: 15 }}><path d={t.icon} /></svg></span>
                <span className="tx"><b>{t.label}</b><span className="p-cap">{t.desc}</span></span>
              </button>
            ))}
          </div>
          <span className="p-cap">Laporan dari WhatsApp diajukan sebagai insiden. Pejabat Berwenang bisa menjadikannya kerawanan saat pemeriksaan.</span>
        </div>

        <div className="p-field">
          <AiHead draft={draft} k="time" label="Waktu kejadian" required />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <DateField label="Tanggal" value={f.date} onChange={(v) => patchForm({ date: v })} invalid={err(miss.time)} style={{ flex: 1 }} />
            <TimeField label="Jam" value={f.time} onChange={(v) => patchForm({ time: v })} invalid={err(miss.time)} style={{ width: 96 }} />
            <span className="p-cap">WIB</span>
          </div>
          {err(miss.time) && <FieldError text="Isi tanggal dan jam." />}
        </div>
        <div></div>

        <div className="p-field lk-span2">
          <AiHead draft={draft} k="title" label="Judul" required />
          <label className={'p-input' + (err(miss.title) ? ' err' : '')}>
            <input aria-label="Judul" maxLength={120} value={f.title} onChange={(e) => patchForm({ title: e.target.value })} placeholder="Ringkas apa yang terjadi" style={bare} />
          </label>
          <span className="p-help row"><span></span><span>{f.title.length}/120</span></span>
          {err(miss.title) && <FieldError text="Judul wajib diisi." />}
        </div>

        <div className="p-field lk-span2" style={{ position: 'relative' }}>
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Lokasi kejadian<span className="p-req">*</span></span>
          {f.locationName ? (
            <div className="p-loc filled" role="group" aria-label="Lokasi terpilih">
              <span className="thumb" style={{ position: 'relative', display: 'block' }}>
                <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true"><rect width="52" height="52" fill="#EEF0EA" /><path d="M0 38 C 14 33 26 44 52 36 L52 52 L0 52Z" fill="#D6E4F5" /><path d="M0 16 L52 22" stroke="#fff" strokeWidth="4" /><path d="M16 0 L20 52" stroke="#fff" strokeWidth="3" /></svg>
                <svg viewBox="0 0 34 44" width="14" height="18" style={{ position: 'absolute', left: 19, top: 11 }} aria-hidden="true"><path d="M17 43s15-13.5 15-26A15 15 0 0 0 2 17c0 12.5 15 26 15 26z" fill="#1C1D21" /><circle cx="17" cy="17" r="6.5" fill="#BED630" /></svg>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                <b style={{ fontWeight: 600 }}>{f.locationName}</b>
                <span className="co">{f.lat?.toFixed(5)}, {f.lng?.toFixed(5)}</span>
              </span>
              <button type="button" className="p-tbtn" onClick={() => setPicker(true)}>Ubah</button>
              <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Hapus lokasi" onClick={() => patchForm({ locationName: '', lat: null, lng: null, wk: '' })}><Icon name="close" size={14} /></button>
            </div>
          ) : (
            <button type="button" className={'p-loc' + (err(miss.location) ? ' err' : '')} onClick={() => setPicker(true)}>
              <Icon name="search" size={16} /><span className="ph">Pilih lokasi di peta</span><Icon name="chevDown" size={14} />
            </button>
          )}
          {picker && (
            <LocationPicker
              initial={{ lat: f.lat, lng: f.lng, wk: f.wk }}
              onClose={() => setPicker(false)}
              onPick={(p) => {
                patchForm({ locationName: p.name, lat: p.lat, lng: p.lng, wk: p.wk, patokan: f.patokan || p.name });
                setPicker(false);
              }}
            />
          )}
          <span className="p-help row">
            <span>
              {loc ? `${loc.area} · ${loc.outside ? (f.wk ? `Di luar cakupan WK, dipilih ${f.wk}` : 'Di luar cakupan WK') : `Dalam ${loc.wk}`}` : hint && draft.aiState === 'ok'
                ? `Saran dari pesan: “${hint}” · peta dibuka di area itu. Kabupaten/kota dan WK terisi otomatis dari titik.`
                : 'Pilih titik di peta. Wilayah kerja terisi otomatis.'}
            </span>
            <span></span>
          </span>
          {err(miss.location) && <FieldError text="Pilih lokasi kejadian." />}
        </div>

        <div className="p-field lk-span2">
          <AiHead draft={draft} k="patokan" label="Patokan lokasi" required />
          <label className={'p-input' + (err(miss.patokan) ? ' err' : '')}>
            <input aria-label="Patokan lokasi" maxLength={120} value={f.patokan} onChange={(e) => patchForm({ patokan: e.target.value })} style={bare} />
          </label>
          <span className="p-help row"><span>Patokan yang mudah dikenali. Terisi otomatis dari lokasi yang dipilih.</span><span>{f.patokan.length}/120</span></span>
          {err(miss.patokan) && <FieldError text="Patokan lokasi wajib diisi." />}
        </div>
      </div>
    </section>
  );

  const aside = (
    <>
      <SubmissionCard no={nomor} message={message} />
      <Step1Copilot draft={draft} message={message} onPickMap={() => setPicker(true)} />
    </>
  );

  return (
    <>
      <WaFormShell
        step={1} top={top} main={main} aside={aside}
        back={{ label: 'Batal', to: WA_ROUTES.inbox }}
        actions={[{ label: 'Simpan draf', onClick: save }, { label: 'Berikutnya', variant: 'primary', onClick: next }]}
        overlay={orig ? <OriginalMessagePanel message={message} draft={draft} onClose={() => setOrig(false)} /> : undefined}
      />
      {toast && <Toast text="Draf tersimpan." />}
    </>
  );
}
