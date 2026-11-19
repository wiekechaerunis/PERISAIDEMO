// Board: M2a (langkah 1 Temuan), MA1/MA4 (kartu & hasil AI), MS03 (ganti jenis), MS13 (lokasi di luar WK), MS17 (mikrofon ditolak).
// Perilaku sama dengan ReportStep1Page desktop; menulis ke useDraftStore yang sama.
import { LocationPicker } from '@/features/insiden/components/LocationPicker';
import { locate } from '@/features/insiden/logic/geo';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { MobileShell } from '../ui/MobileShell';
import { useDraftStore, type ReportDraft } from '@/features/insiden/logic/draft';
import { useCopilotStore } from '@/features/insiden/copilot/copilotStore';
import { CopilotFace } from '@/features/insiden/copilot/parts';
import { nextNumber } from '@/features/insiden/logic/submit';
import { STEP_ROUTES, stepsOf } from '@/features/insiden/logic/steps';
import { useDemoStore } from '@/services/mock/store';
import { storyWarning, typeGuard, type HasImpactAnswer, type ReportKind } from '@/lib/reportType';
import { AiTagM, StepBar, StepFoot, bare, useDraftActions } from './parts';
import { AiSheet } from './AiSheet';
import { WkSheet } from './sheets';
import { useMobileCopilot } from './useMobileCopilot';
import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';

const ICON_INS = 'M7 18v-6a5 5 0 0 1 10 0v6M5 21h14v-3H5zM12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4';
const ICON_KRW = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01';
const TYPES: { k: ReportKind; label: string; desc: string; icon: string }[] = [
  { k: 'insiden', label: 'Insiden', icon: ICON_INS, desc: 'Sudah terjadi dan menimbulkan kerugian, korban, atau gangguan operasi, mis. pencurian, penghadangan.' },
  { k: 'kerawanan', label: 'Kerawanan', icon: ICON_KRW, desc: 'Kondisi atau kejadian tanpa kerugian, korban, atau gangguan operasi, mis. pagar rusak, lampu padam, orang mencurigakan.' },
];
const DMP: [HasImpactAnswer, string][] = [['ya', 'Ya'], ['tidak', 'Tidak'], ['belum', 'Belum tahu']];

const WK_OPTIONS = ['WK Andalas Darat', 'WK Batu Ampar'];

/** Isian langkah 2 yang dikosongkan saat laporan dijadikan Kerawanan (MS03). */
const CLEARED: Partial<ReportDraft> = {
  category: null, categoryOther: '', jenis: null, jenisOther: '', securityImpact: '', axes: [], lossIdr: null, ops: null, opsHours: null,
  ongoing: false, casualties: {}, envNote: '', dataNote: '', severity: null, severityManual: false, severityReason: '', handledBy: [],
};

export function MobileReportStep1Page() {
  const navigate = useNavigate();
  const { draft, patch } = useDraftStore();
  const kerawanan = useDemoStore((s) => s.kerawanan);
  const cpStory = useCopilotStore((s) => s.story);
  const c = useMobileCopilot(1);
  const [tried, setTried] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [sheet, setSheet] = useState<null | 'lokasi' | 'wk' | 'kerawanan'>(null);
  const menu = useDraftActions();

  const guard = typeGuard(draft.hasImpact);
  const kind: ReportKind = guard.lockKerawanan ? 'insiden' : draft.kind;
  const isIns = kind === 'insiden';
  const ai = (f: string) => draft.aiFilled.includes(f);
  const hit = kind === 'kerawanan' ? storyWarning(cpStory) : null;
  const loc = draft.lat !== null && draft.lng !== null ? locate(draft.lat, draft.lng) : null;
  const outsideWk = !!loc && loc.outside;
  const steps = stepsOf(kind);

  const missing = {
    hasImpact: !draft.hasImpact,
    time: !draft.date || !draft.time,
    title: !draft.title.trim(),
    location: !draft.locationName,
    wk: outsideWk && !draft.wk,
    patokan: !draft.patokan.trim(),
  };
  const invalid = Object.values(missing).some(Boolean);
  const err = (b: boolean) => tried && b;
  const errMsg = (t: string) => <span className="p-help err" role="alert"><Icon name="warn" size={14} />{t}</span>;

  const answer = (a: HasImpactAnswer) => {
    const g = typeGuard(a);
    patch({ hasImpact: a, kind: a === 'tidak' ? draft.kind : g.kind });
  };
  const pickKind = (k: ReportKind) => {
    if (guard.lockKerawanan && k === 'kerawanan') return;
    if (k === 'kerawanan' && kind === 'insiden') return setSheet('kerawanan');
    patch({ kind: k });
  };
  const next = () => {
    setTried(true);
    if (invalid) return;
    patch({ kind });
    navigate(isIns ? STEP_ROUTES.kejadian : STEP_ROUTES.detailKerawanan);
  };

  const ex = c.ex;
  const filled = c.suggestions.filter((s) => c.stOf(s.key) === 'on');
  const needCheck = filled.filter((s) => s.confidence === 'md').length;
  const showBar = c.cp.phase === 'ready' && !!ex && c.cp.messages.length > 0;
  const openAi = () => setAiOpen(true);

  const body = (
    <>
      <StepBar n={1} total={steps.length} title="Temuan" next={steps[1]} />

      {showBar ? (
        <>
          <button type="button" className="ma-bar" onClick={openAi}>
            <CopilotFace size={22} />
            <span>
              {filled.length > 0
                ? <><b>AI mengisi {filled.length} isian</b>{needCheck > 0 && <> · {needCheck} perlu dicek</>}</>
                : <><b>AI punya {c.left} saran</b> · belum ada yang dipakai</>}
            </span>
            <span className="lk">Lihat</span>
          </button>
          {cpStory && <p className="p-cap" style={{ margin: 0, padding: '2px 0 2px 10px', borderLeft: '3px solid var(--border-control)', color: 'var(--ink-subtle)' }}>Cerita Anda: “{cpStory}”</p>}
        </>
      ) : (
        <div className="ma-entry">
          <div className="t">
            <CopilotFace size={36} />
            <div><b>Ceritakan kejadianmu, AI bantu isi</b><span>Ketik atau rekam suara. Anda tetap memeriksa setiap isian.</span></div>
          </div>
          <div className="ma-cm">
            <button type="button" className="in" onClick={openAi}>Ketik ceritamu di sini…</button>
            <button type="button" className="ib" aria-label="Lampirkan foto" onClick={openAi}><Icon name="attach" size={18} /></button>
            <button type="button" className="ib" aria-label="Rekam suara" onClick={() => { if (c.startRec()) openAi(); }}><Icon name="mic" size={18} /></button>
            <button type="button" className="ib send" aria-label="Kirim" onClick={() => { openAi(); void c.send(''); }}><Icon name="send" size={18} /></button>
          </div>
          {c.micDenied && (
            <div className="cp-alert ma-alert" role="alert" style={{ display: 'flex' }}>
              <Icon name="micOff" size={16} />
              <span>Izin mikrofon belum diberikan. Buka pengaturan HP, izinkan mikrofon untuk PERISAI, atau ketik cerita Anda.</span>
            </div>
          )}
        </div>
      )}

      <div className="sec">
        <h2>Temuan</h2>
        <div className="p-field">
          <span className="p-lbl" id="dmp-l" style={{ color: 'var(--ink)' }}>Ada kerugian, korban, atau operasi terganggu?<span className="p-req">*</span></span>
          <div className="p-qf" role="radiogroup" aria-labelledby="dmp-l" style={{ display: 'flex' }}>
            {DMP.map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={draft.hasImpact === k} onClick={() => answer(k)} style={{ flex: 1, justifyContent: 'center', height: 40 }}>{l}</button>
            ))}
          </div>
          {err(missing.hasImpact) && errMsg('Pilih salah satu jawaban.')}
        </div>

        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis laporan<span className="p-req">*</span><AiTagM on={ai('kind')} /></span>
          <div role="radiogroup" aria-label="Jenis laporan" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TYPES.map((t) => (
              <button key={t.k} type="button" role="radio" className="jn" aria-checked={kind === t.k} aria-disabled={guard.lockKerawanan && t.k === 'kerawanan'} onClick={() => pickKind(t.k)}>
                <span className="ic"><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 15, height: 15 }}><path d={t.icon} /></svg></span>
                <span className="tx">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <b>{t.label}</b>
                    {guard.suggestKerawanan && t.k === 'kerawanan' && (
                      <span className="p-tag t-info" title="Saran sistem dari jawaban dampak · bisa diubah" style={{ display: 'inline-flex', height: 18, fontSize: 11, gap: 3 }}><Icon name="sparkle" size={11} />Saran</span>
                    )}
                  </span>
                  <span className="p-cap">{t.desc}</span>
                </span>
              </button>
            ))}
          </div>
          {draft.hasImpact !== 'tidak' && (
            <span className="p-cap">
              {draft.hasImpact === 'ya' ? 'Ada dampak, jadi dilaporkan sebagai insiden.' : 'Bila ragu, laporkan sebagai insiden. Pejabat Berwenang bisa menjadikannya kerawanan.'}
            </span>
          )}
        </div>

        {hit && (
          <div className="in-bn caution" role="status" style={{ display: 'flex', padding: '10px 12px', fontSize: 12, lineHeight: '17px' }}>
            <Icon name="warn" size={16} />
            <div className="body">
              <b>Cerita Anda menyebut “{hit}”.</b> Laporkan sebagai insiden?
              <div className="acts">
                <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={{ minHeight: 44 }} onClick={() => patch({ kind: 'insiden', hasImpact: 'ya' })}>Jadikan insiden</button>
              </div>
            </div>
          </div>
        )}

        <div className={'in-bn ' + (isIns ? 'info' : 'caution')} style={{ padding: '10px 12px', fontSize: 12, lineHeight: '17px' }}>
          <Icon name="info" size={16} />
          <div className="body">
            <b>{isIns ? 'Insiden dipilih.' : 'Kerawanan dipilih. Laporan ini masuk ke tab Kerawanan di menu Insiden.'}</b>{' '}
            {isIns
              ? 'Langkah 2 menanyakan dampak, keparahan, dan siapa yang sudah menangani. Bila Tinggi atau Kritis, SKK Migas langsung diberi tahu.'
              : 'Langkah 2 hanya menanyakan jenis kerawanan. Kerawanan langsung tercatat tanpa pemeriksaan, keparahan, atau PIC, dan tidak dihitung sebagai insiden.'}
          </div>
        </div>

        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>{isIns ? 'Waktu kejadian' : 'Waktu diketahui'}<span className="p-req">*</span><AiTagM on={ai('time')} /></span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <DateField label="Tanggal" value={draft.date} onChange={(v) => patch({ date: v })} invalid={err(missing.time)} style={{ flex: 1 }} />
            <TimeField label="Jam" value={draft.time} onChange={(v) => patch({ time: v })} invalid={err(missing.time)} style={{ width: 96 }} />
            <span className="p-cap">WIB</span>
          </div>
          {err(missing.time) && errMsg('Isi tanggal dan jam.')}
        </div>

        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Judul<span className="p-req">*</span><AiTagM on={ai('title')} /></span>
          <label className={'p-input' + (err(missing.title) ? ' err' : '')}>
            <input aria-label="Judul" maxLength={120} value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Ringkas apa yang terjadi" style={bare} />
          </label>
          {err(missing.title) && errMsg('Judul wajib diisi.')}
        </div>

        <div className="p-field">
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
              <button type="button" className="p-tbtn" style={{ minHeight: 44 }} onClick={() => setSheet('lokasi')}>Ubah</button>
            </div>
          ) : (
            <button type="button" className={'p-loc' + (err(missing.location) ? ' err' : '')} onClick={() => setSheet('lokasi')} style={{ minHeight: 44 }}>
              <Icon name="search" size={16} /><span className="ph">Pilih lokasi di peta</span>
            </button>
          )}
          <span className="p-help">
            {outsideWk
              ? <>{loc?.area} · <span className="p-tag t-caution" style={{ height: 20 }}>Di luar cakupan WK</span></>
              : loc ? `${loc.area} · Dalam ${loc.wk}` : draft.wk ? `Dalam ${draft.wk}` : 'Pilih titik di peta. Wilayah kerja terisi otomatis.'}
          </span>
          {err(missing.location) && errMsg('Pilih lokasi kejadian.')}
        </div>

        {outsideWk && (
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Wilayah kerja<span className="p-req">*</span></span>
            <button
              type="button" className={'p-input' + (err(missing.wk) ? ' err' : '')} aria-haspopup="listbox" aria-label="Wilayah kerja" onClick={() => setSheet('wk')}
              style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', border: 0, width: '100%', ...(!draft.wk && !err(missing.wk) ? { boxShadow: 'inset 0 0 0 1.5px var(--action-line)' } : {}) }}
            >
              <span className={draft.wk ? '' : 'ph'} style={{ flex: 1 }}>{draft.wk || 'Pilih WK yang terdampak'}</span>
              <Icon name="chevDown" size={16} />
            </button>
            <span className="p-help">Titik ini di luar cakupan WK organisasi Anda. Pilih WK yang paling terkait. Pejabat Berwenang WK ini yang memeriksa dan menunjuk PIC.</span>
            {err(missing.wk) && errMsg('Pilih wilayah kerja.')}
          </div>
        )}

        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Patokan lokasi<span className="p-req">*</span><AiTagM on={ai('patokan')} /></span>
          <label className={'p-input' + (err(missing.patokan) ? ' err' : '')}>
            <input aria-label="Patokan lokasi" maxLength={120} value={draft.patokan} onChange={(e) => patch({ patokan: e.target.value })} style={bare} />
          </label>
          <span className="p-help">Terisi otomatis dari lokasi yang dipilih.</span>
          {err(missing.patokan) && errMsg('Patokan lokasi wajib diisi.')}
        </div>
      </div>
    </>
  );

  const overlay = (
    <>
      {menu.overlay}
      {aiOpen && <AiSheet c={c} onClose={() => setAiOpen(false)} />}
      {sheet === 'lokasi' && (
        <LocationPicker
          variant="sheet" askWk={false} initial={{ lat: draft.lat, lng: draft.lng, wk: draft.wk }}
          onClose={() => setSheet(null)}
          onPick={(p) => {
            patch({ locationName: p.name, lat: p.lat, lng: p.lng, wk: p.outside ? '' : p.wk, patokan: draft.patokan || p.name });
            setSheet(null);
          }}
        />
      )}
      {sheet === 'wk' && (
        <WkSheet options={WK_OPTIONS} selected={draft.wk} onClose={() => setSheet(null)} onPick={(wk) => { patch({ wk }); setSheet(null); }} />
      )}
      {sheet === 'kerawanan' && (
        <>
          <div className="scrim" onClick={() => setSheet(null)}></div>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t">
            <div className="grab" aria-hidden="true"></div>
            <div className="sb">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><b id="sh-t" style={{ fontSize: 17, lineHeight: '24px' }}>Jadikan kerawanan?</b></div>
              <span style={{ color: 'var(--ink-subtle)' }}>
                Laporan ini akan diproses sebagai <b>Kerawanan</b> dengan nomor baru <span className="p-mono">{nextNumber('KRW-SEN', kerawanan.map((k) => k.no))}</span>. Kerawanan tidak dihitung sebagai insiden.
              </span>
              <span className="p-cap">Isian dampak, keparahan, dan yang sudah menangani akan dikosongkan.</span>
            </div>
            <div className="sf">
              <button type="button" className="p-btn p-btn-primary" onClick={() => { patch({ ...CLEARED, kind: 'kerawanan' }); setSheet(null); }}>Jadikan kerawanan</button>
              <button type="button" className="p-btn p-btn-secondary" onClick={() => setSheet(null)}>Batal</button>
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <MobileShell
      title="Laporan baru" left="back" backTo="/insiden" actions={menu.actions} overlay={overlay}
      footer={<StepFoot prevTo="/insiden" onNext={next} />}
    >
      {body}
    </MobileShell>
  );
}
