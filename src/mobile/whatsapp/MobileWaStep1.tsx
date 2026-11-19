// Board mobile: M9 (Draf dari WhatsApp · Temuan, saran AI + Perlu dicek) dan MS04 (saran AI gagal, ?state=ai-gagal). Perilaku sama dengan WaStep1Page.
import { LocationPicker } from '@/features/insiden/components/LocationPicker';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/format';
import { FieldError } from '@/features/insiden/components/AiTag';
import { AiFailedBanner, AiHead, MessageText, StatusNote } from '@/features/whatsapp/components/parts';
import { WA_ROUTES, senderInitials, senderLabel, step1Missing, useActiveWaDraft, waPath } from '@/features/whatsapp/logic/draft';
import { locationHint } from '@/features/whatsapp/logic/extract';
import { StepBar } from '../formA/parts';
import { MobileShell } from '../ui/MobileShell';
import { WaFoot, useWaDraftActions } from './parts';
import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';

const bare = { flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0, width: '100%' } as const;
const ICON_INS = 'M7 18v-6a5 5 0 0 1 10 0v6M5 21h14v-3H5zM12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4';
const ICON_KRW = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01';

export function MobileWaStep1() {
  const navigate = useNavigate();
  const { draft, message, patchForm, confirm } = useActiveWaDraft();
  const [tried, setTried] = useState(false);
  const [sheet, setSheet] = useState(false);
  const menu = useWaDraftActions(draft?.id ?? '');
  if (!draft || !message) {
    return (
      <MobileShell title="Draf dari WhatsApp" left="back" backTo={WA_ROUTES.inbox}>
        <div className="sec"><h2>Draf tidak ditemukan</h2><span className="p-cap">Draf ini sudah dihapus atau diajukan.</span></div>
      </MobileShell>
    );
  }
  const f = draft.form;
  const miss = step1Missing(f);
  const err = (b: boolean) => tried && b;
  const hint = locationHint(message.text);
  const next = () => {
    setTried(true);
    if (Object.values(miss).some(Boolean)) return;
    navigate(waPath('kejadian', draft.id));
  };

  const body = (
    <>
      <StepBar n={1} title="Temuan" next="Kejadian & dampak" />
      {draft.aiState === 'gagal' ? <AiFailedBanner /> : null}
      <StatusNote
        draft={draft} step={1}
        intro={<>Isian bertanda <b style={{ fontWeight: 600 }}>AI</b> adalah saran dari pesan grup {message.group}. Periksa sebelum mengajukan.</>}
      />
      <div className="sec">
        <h2>Temuan</h2>
        <div className="p-field">
          <AiHead id="wa-f-kind" draft={draft} k="kind" label="Jenis laporan" required onConfirm={confirm} />
          <div role="radiogroup" aria-label="Jenis laporan" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['insiden', 'Insiden', 'Sudah terjadi dan menimbulkan kerugian, korban, atau gangguan operasi.', ICON_INS], ['kerawanan', 'Kerawanan', 'Tanpa kerugian, korban, atau gangguan operasi, mis. pagar rusak, orang mencurigakan.', ICON_KRW]].map(([k, l, d, p]) => (
              <button key={k} type="button" role="radio" className="jn" aria-checked={k === 'insiden'} aria-disabled={k === 'kerawanan'}>
                <span className="ic"><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 15, height: 15 }}><path d={p} /></svg></span>
                <span className="tx"><b>{l}</b><span className="p-cap">{d}</span></span>
              </button>
            ))}
          </div>
          <span className="p-help">Laporan dari WhatsApp diajukan sebagai insiden. Pejabat Berwenang bisa menjadikannya kerawanan.</span>
        </div>
        <div className="p-field">
          <AiHead draft={draft} k="time" label="Waktu kejadian" required />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <DateField label="Tanggal" value={f.date} onChange={(v) => patchForm({ date: v })} invalid={err(miss.time)} style={{ flex: 1 }} />
            <TimeField label="Jam" value={f.time} onChange={(v) => patchForm({ time: v })} invalid={err(miss.time)} style={{ width: 96 }} />
            <span className="p-cap">WIB</span>
          </div>
          <FieldError text={err(miss.time) ? 'Isi tanggal dan jam.' : undefined} />
        </div>
        <div className="p-field">
          <AiHead draft={draft} k="title" label="Judul" required />
          <label className={'p-input' + (err(miss.title) ? ' err' : '')} style={{ height: 44 }}>
            <input aria-label="Judul" maxLength={120} value={f.title} onChange={(e) => patchForm({ title: e.target.value })} placeholder="Ringkas apa yang terjadi" style={bare} />
          </label>
          <FieldError text={err(miss.title) ? 'Judul wajib diisi.' : undefined} />
        </div>
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Lokasi kejadian<span className="p-req">*</span></span>
          <button type="button" className={'p-loc' + (err(miss.location) ? ' err' : '')} style={{ minHeight: 44 }} aria-label="Lokasi kejadian" onClick={() => setSheet(true)}>
            <Icon name="search" size={16} />
            <span className={f.locationName ? '' : 'ph'} style={{ flex: 1, textAlign: 'left' }}>{f.locationName || 'Pilih lokasi di peta'}</span>
            <Icon name="chevDown" size={14} />
          </button>
          <span className="p-help">
            {f.locationName ? `Dalam ${f.wk}` : hint && draft.aiState === 'ok' ? `Pesan tidak membagikan titik. Peta dibuka di area “${hint}”.` : 'Pilih titik di peta. Wilayah kerja terisi otomatis.'}
          </span>
          <FieldError text={err(miss.location) ? 'Pilih lokasi kejadian.' : undefined} />
        </div>
        <div className="p-field">
          <AiHead draft={draft} k="patokan" label="Patokan lokasi" required />
          <label className={'p-input' + (err(miss.patokan) ? ' err' : '')} style={{ height: 44 }}>
            <input aria-label="Patokan lokasi" maxLength={120} value={f.patokan} onChange={(e) => patchForm({ patokan: e.target.value })} style={bare} />
          </label>
          <FieldError text={err(miss.patokan) ? 'Patokan lokasi wajib diisi.' : undefined} />
        </div>
      </div>
      <div className="sec">
        <h2>Pesan asli</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="lk-av">{senderInitials(message)}</span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <b style={{ fontSize: 13 }}>{senderLabel(message)}</b>
            <span className="p-cap">{message.group} · {message.at.slice(11, 16)} WIB · {formatDate(message.at)}</span>
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: '20px', padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-sunken)' }}>
          <MessageText text={message.text} draft={draft} />
        </p>
      </div>
    </>
  );

  return (
    <MobileShell
      title="Draf dari WhatsApp" left="back" backTo={WA_ROUTES.inbox} actions={menu.actions}
      footer={<WaFoot prevTo={WA_ROUTES.inbox} onNext={next} />}
      overlay={
        <>
          {menu.overlay}
          {sheet && (
            <LocationPicker
              variant="sheet" askWk initial={{ lat: f.lat, lng: f.lng, wk: f.wk }}
              onClose={() => setSheet(false)}
              onPick={(p) => {
                patchForm({ locationName: p.name, lat: p.lat, lng: p.lng, wk: p.wk, patokan: f.patokan || p.name });
                setSheet(false);
              }}
            />
          )}
        </>
      }
    >
      {body}
    </MobileShell>
  );
}
