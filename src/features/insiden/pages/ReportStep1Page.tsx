// Board: I12 (1.2 Form · langkah 1, Temuan) + S16 (jenis Kerawanan) + S03 (ganti jenis), S13 (lokasi di luar WK) — FR-LK-25, FR-INS-01
import { LocationPicker } from '../components/LocationPicker';
import { locate } from '../logic/geo';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportFormShell } from '../components/ReportFormShell';
import { CopilotPanel } from '../copilot/CopilotPanel';
import { Icon } from '@/components/ui/Icon';
import { useDraftStore } from '../logic/draft';
import { useDemoStore } from '@/services/mock/store';
import { nextNumber } from '../logic/submit';
import { STEP_ROUTES, stepsOf } from '../logic/steps';
import { storyWarning, typeGuard, type HasImpactAnswer, type ReportKind } from '@/lib/reportType';
import { useCopilotStore } from '../copilot/copilotStore';
import { demoNow } from '@/services/mock/clock';
import { isFutureTime } from '../logic/draft';
import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';

const ICON_INS = 'M7 18v-6a5 5 0 0 1 10 0v6M5 21h14v-3H5zM12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4';
const ICON_KRW = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01';
const TYPES: { k: ReportKind; label: string; desc: string; icon: string }[] = [
  { k: 'insiden', label: 'Insiden', icon: ICON_INS, desc: 'Sudah terjadi dan menimbulkan kerugian, korban, atau gangguan operasi, mis. pencurian, penghadangan.' },
  { k: 'kerawanan', label: 'Kerawanan', icon: ICON_KRW, desc: 'Kondisi atau kejadian tanpa kerugian, korban, atau gangguan operasi, mis. pagar rusak, lampu padam, orang mencurigakan.' },
];
const DMP: [HasImpactAnswer, string][] = [['ya', 'Ya'], ['tidak', 'Tidak'], ['belum', 'Belum tahu']];


const AiTag = ({ on, why = 'Diisi AI Copilot dari cerita Anda · bisa diubah', label = 'AI' }: { on: boolean; why?: string; label?: string }) =>
  on ? (
    <span className="p-tag t-info" title={why} style={{ height: 18, fontSize: 11, gap: 3, marginLeft: 6, verticalAlign: 'middle', cursor: 'help' }}>
      <Icon name="sparkle" size={11} />{label}
    </span>
  ) : null;

export function ReportStep1Page() {
  const navigate = useNavigate();
  const { draft, patch, resetDraft } = useDraftStore();
  const incidents = useDemoStore((s) => s.incidents);
  const kerawanan = useDemoStore((s) => s.kerawanan);
  const cpStory = useCopilotStore((s) => s.story);
  const [tried, setTried] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState(false);

  const guard = typeGuard(draft.hasImpact);
  const kind: ReportKind = guard.lockKerawanan ? 'insiden' : draft.kind;
  const isIns = kind === 'insiden';
  const ai = (f: string) => draft.aiFilled.includes(f);
  const hit = kind === 'kerawanan' ? storyWarning(cpStory) : null;
  const nomor = useMemo(
    () => (isIns ? nextNumber('INS-SEN', incidents.map((i) => i.no)) : nextNumber('KRW-SEN', kerawanan.map((k) => k.no))),
    [isIns, incidents, kerawanan],
  );

  const missing = {
    hasImpact: !draft.hasImpact,
    time: !draft.date || !draft.time,
    future: !!draft.date && !!draft.time && isFutureTime(draft.date, draft.time),
    title: !draft.title.trim(),
    location: !draft.locationName,
    patokan: !draft.patokan.trim(),
  };
  const invalid = Object.values(missing).some(Boolean);
  const err = (b: boolean) => tried && b;
  const errMsg = (t: string) => (
    <span className="p-help err"><Icon name="warn" size={14} />{t}</span>
  );

  const answer = (a: HasImpactAnswer) => {
    const g = typeGuard(a);
    patch({ hasImpact: a, kind: a === 'tidak' ? draft.kind : g.kind });
  };
  const pickKind = (k: ReportKind) => {
    if (guard.lockKerawanan && k === 'kerawanan') return;
    patch({ kind: k });
  };
  const next = () => {
    setTried(true);
    if (invalid) return;
    patch({ kind });
    navigate(isIns ? STEP_ROUTES.kejadian : STEP_ROUTES.detailKerawanan);
  };
  const save = () => {
    patch({ kind });
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };
  const dateLbl = isIns ? 'Waktu kejadian' : 'Waktu diketahui';
  const dateTip = isIns
    ? 'Kapan kejadian terjadi menurut Anda. Bukan waktu Anda melapor.'
    : 'Kapan kondisi atau kejadian ini Anda lihat atau ketahui.';
  const loc = draft.lat !== null && draft.lng !== null ? locate(draft.lat, draft.lng) : null;

  const main = (
    <section className="p-card">
      <div className="lk-card-head" style={{ marginBottom: 12 }}><h2 className="p-h2">Temuan</h2></div>
      <div className="lk-f2">
        <div className="p-field lk-span2">
          <span className="p-lbl" id="dmp-l" style={{ color: 'var(--ink)' }}>Ada kerugian, korban, atau operasi terganggu?<span className="p-req">*</span></span>
          <div className="p-qf" role="radiogroup" aria-labelledby="dmp-l" style={{ alignSelf: 'flex-start' }}>
            {DMP.map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={draft.hasImpact === k} onClick={() => answer(k)} style={{ minWidth: 96, justifyContent: 'center' }}>{l}</button>
            ))}
          </div>
          {err(missing.hasImpact) && errMsg('Pilih salah satu jawaban.')}
        </div>

        <div className="p-field lk-span2">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis laporan<span className="p-req">*</span><AiTag on={ai('kind')} /></span>
          <div role="radiogroup" aria-label="Jenis laporan" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TYPES.map((t) => (
              <button key={t.k} type="button" role="radio" className="jn" aria-checked={kind === t.k} aria-disabled={guard.lockKerawanan && t.k === 'kerawanan'} onClick={() => pickKind(t.k)}>
                <span className="ic"><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 15, height: 15 }}><path d={t.icon} /></svg></span>
                <span className="tx">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <b>{t.label}</b>
                    <AiTag on={guard.suggestKerawanan && t.k === 'kerawanan'} why="Saran sistem dari jawaban dampak · bisa diubah" label="Saran" />
                  </span>
                  <span className="p-cap">{t.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {draft.hasImpact !== 'tidak' && (
          <span className="lk-span2 p-cap">
            {draft.hasImpact === 'ya' ? 'Ada dampak, jadi dilaporkan sebagai insiden.' : 'Bila ragu, laporkan sebagai insiden. Pejabat Berwenang bisa menjadikannya kerawanan.'}
          </span>
        )}

        {hit && (
          <div className="lk-span2 in-bn caution" role="status" style={{ display: 'flex' }}>
            <Icon name="warn" size={18} />
            <div className="body">
              <b>Cerita Anda menyebut “{hit}”.</b> Laporkan sebagai insiden?
              <div className="acts">
                <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => patch({ kind: 'insiden', hasImpact: 'ya' })}>Jadikan insiden</button>
              </div>
            </div>
          </div>
        )}

        <div className={'lk-span2 in-bn ' + (isIns ? 'info' : 'caution')}>
          <Icon name="info" size={18} />
          <div className="body">
            <b>{isIns ? 'Insiden dipilih.' : 'Kerawanan dipilih. Laporan ini masuk ke tab Kerawanan di menu Insiden.'}</b>{' '}
            {isIns
              ? 'Langkah 2 menanyakan dampak, keparahan, dan siapa yang sudah menangani. Bila Tinggi atau Kritis, SKK Migas langsung diberi tahu saat diajukan.'
              : 'Langkah 2 hanya menanyakan jenis kerawanan. Kerawanan langsung tercatat tanpa pemeriksaan, keparahan, atau PIC, dan tidak dihitung sebagai insiden.'}
          </div>
        </div>

        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {dateLbl}<span className="p-req">*</span><AiTag on={ai('time')} />
            <span className="in-tw">
              <button type="button" className="ib" aria-label={`Penjelasan ${dateLbl}`}><Icon name="info" size={15} /></button>
              <span className="in-tip" role="tooltip">{dateTip}</span>
            </span>
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <DateField label="Tanggal" value={draft.date} onChange={(v) => patch({ date: v })} invalid={err(missing.time || missing.future)} max={demoNow().slice(0, 10)} style={{ flex: 1 }} />
            <TimeField label="Jam" value={draft.time} onChange={(v) => patch({ time: v })} invalid={err(missing.time || missing.future)} style={{ width: 96 }} />
            <span className="p-cap">WIB</span>
          </div>
          {err(missing.time) && errMsg('Isi tanggal dan jam.')}
          {missing.future && errMsg(`${dateLbl} tidak boleh setelah waktu sekarang.`)}
        </div>
        <div></div>

        <div className="p-field lk-span2">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Judul<span className="p-req">*</span><AiTag on={ai('title')} /></span>
          <label className={'p-input' + (err(missing.title) ? ' err' : '')}>
            <input aria-label="Judul" maxLength={120} value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Ringkas apa yang terjadi" style={bare} />
          </label>
          <span className="p-help row"><span></span><span>{draft.title.length}/120</span></span>
          {err(missing.title) && errMsg('Judul wajib diisi.')}
        </div>

        <div className="p-field lk-span2" style={{ position: 'relative' }}>
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Lokasi kejadian<span className="p-req">*</span></span>
          {draft.locationName ? (
            <div className="p-loc filled" role="group" aria-label="Lokasi terpilih">
              <span className="thumb" style={{ position: 'relative', display: 'block' }}>
                <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true"><rect width="52" height="52" fill="#EEF0EA" /><path d="M0 38 C 14 33 26 44 52 36 L52 52 L0 52Z" fill="#D6E4F5" /><path d="M0 16 L52 22" stroke="#fff" strokeWidth="4" /><path d="M16 0 L20 52" stroke="#fff" strokeWidth="3" /></svg>
                <svg viewBox="0 0 34 44" width="14" height="18" style={{ position: 'absolute', left: 19, top: 11 }} aria-hidden="true"><path d="M17 43s15-13.5 15-26A15 15 0 0 0 2 17c0 12.5 15 26 15 26z" fill="#1C1D21" /><circle cx="17" cy="17" r="6.5" fill="#BED630" /></svg>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                <b style={{ fontWeight: 600 }}>{draft.locationName}</b>
                <span className="co">{draft.lat?.toFixed(5)}, {draft.lng?.toFixed(5)}</span>
              </span>
              <button type="button" className="p-tbtn" onClick={() => setPickerOpen(true)}>Ubah</button>
              <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Hapus lokasi" onClick={() => patch({ locationName: '', lat: null, lng: null, wk: '' })}><Icon name="close" size={14} /></button>
            </div>
          ) : (
            <button type="button" className={'p-loc' + (err(missing.location) ? ' err' : '')} onClick={() => setPickerOpen(true)}>
              <Icon name="search" size={16} /><span className="ph">Pilih lokasi di peta</span>
            </button>
          )}
          {pickerOpen && (
            <LocationPicker
              initial={{ lat: draft.lat, lng: draft.lng, wk: draft.wk }}
              onClose={() => setPickerOpen(false)}
              onPick={(p) => {
                patch({ locationName: p.name, lat: p.lat, lng: p.lng, wk: p.wk, patokan: draft.patokan || p.name });
                setPickerOpen(false);
              }}
            />
          )}
          <span className="p-help row"><span>{loc ? `${loc.area} · ${loc.outside ? (draft.wk ? `Di luar cakupan WK, dipilih ${draft.wk}` : 'Di luar cakupan WK') : `Dalam ${loc.wk}`}` : 'Pilih titik di peta. Wilayah kerja terisi otomatis.'}</span><span></span></span>
          {err(missing.location) && errMsg('Pilih lokasi kejadian.')}
        </div>

        <div className="p-field lk-span2">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Patokan lokasi<span className="p-req">*</span><AiTag on={ai('patokan')} /></span>
          <label className={'p-input' + (err(missing.patokan) ? ' err' : '')}>
            <input aria-label="Patokan lokasi" maxLength={120} value={draft.patokan} onChange={(e) => patch({ patokan: e.target.value })} style={bare} />
          </label>
          <span className="p-help row"><span>Patokan yang mudah dikenali. Terisi otomatis dari lokasi yang dipilih.</span><span>{draft.patokan.length}/120</span></span>
          {err(missing.patokan) && errMsg('Patokan lokasi wajib diisi.')}
        </div>
      </div>
    </section>
  );

  const aside = (
    <>
      <section className="p-card">
        <div className="lk-card-head" style={{ marginBottom: 12 }}><h2 className="p-h2">Pengajuan</h2></div>
        <dl className="lk-kv1">
          <dt>Nomor laporan</dt><dd><span className="p-mono" style={{ fontSize: 12 }}>{nomor}</span></dd>
          <dt>Status</dt><dd><span className="p-tag t-draft">Draf</span></dd>
          <dt>Tercatat di</dt><dd>{isIns ? 'Insiden' : 'Insiden › tab Kerawanan'}</dd>
          <dt>{isIns ? 'Diperiksa oleh' : 'Pemeriksaan'}</dt><dd>{isIns ? 'Semua Pejabat Berwenang (3)' : 'Tidak perlu, langsung tercatat'}</dd>
        </dl>
      </section>
      <CopilotPanel step={1} />
    </>
  );

  return (
    <>
      <ReportFormShell
        step={1}
        steps={stepsOf(kind)}
        main={main}
        aside={aside}
        back={{ label: 'Batal', onClick: () => { resetDraft(); useCopilotStore.getState().reset(false); navigate('/insiden'); } }}
        actions={[{ label: 'Simpan draf', onClick: save }, { label: 'Berikutnya', variant: 'primary', onClick: next }]}
      />
      {toast && (
        <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 120 }}>
          <div className="p-toast" role="status"><span className="ti"><Icon name="check" size={14} /></span>Draf tersimpan.</div>
        </div>
      )}
    </>
  );
}

const bare = { flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0, width: '100%' } as const;
