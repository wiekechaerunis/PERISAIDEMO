// Board mobile: M7 / M7s (Ringkasan & Ajukan), MA7 (bar AI), M5 (ganda, ?state=ganda), MS01 (validasi), MS05 (gagal kirim), MS06 (draf bentrok).
// Perilaku sama dengan ReportStep4Page: ?state=gagal-kirim | bentrok; Ajukan lewat nextNumber/buildIncident/addIncident.
import { demoNow } from '@/services/mock/clock';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatWibFull } from '@/lib/format';
import { DEMO_USERS, reviewerOptions } from '@/lib/rbac';
import { ReviewerSelect } from '@/components/ui/ReviewerSelect';
import { SEV_LABEL, SEV_TAG_CLS, isHighOrCritical } from '@/lib/severity';
import { ORG } from '@/services/mock/seed';
import { useDemoStore } from '@/services/mock/store';
import { extLabel, formatSize } from '@/features/insiden/logic/attachments';
import { useDraftStore } from '@/features/insiden/logic/draft';
import { duplicateCandidates } from '@/features/insiden/logic/review';
import { STEP_ROUTES } from '@/features/insiden/logic/steps';
import { buildIncident, nextNumber, occurredIso, suggestedSeverityOf } from '@/features/insiden/logic/submit';
import { MobileShell } from '../ui/MobileShell';
import { DuplicateSheet } from './DuplicateSheet';
import { AiBar, D, Pi, StepHead, Toast, useDraftMenu } from './parts';
import { AXIS_LABEL, AXIS_ORDER, HANDLED_LABEL, casualtyText, missingOf, opsText, rupiahShort } from './step4Logic';

const TBTN = { minHeight: 44, display: 'inline-flex', alignItems: 'center' } as const;
const BANNER = { padding: '10px 12px', fontSize: 12, lineHeight: '17px' } as const;

export function MobileReportStep4Page() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const draft = useDraftStore((s) => s.draft);
  const resetDraft = useDraftStore((s) => s.resetDraft);
  const patchDraft = useDraftStore((s) => s.patch);
  const incidents = useDemoStore((s) => s.incidents);
  const config = useDemoStore((s) => s.config);
  const role = useDemoStore((s) => s.role);
  const addIncident = useDemoStore((s) => s.addIncident);
  const [failed, setFailed] = useState(params.get('state') === 'gagal-kirim');
  const [conflict, setConflict] = useState(params.get('state') === 'bentrok');
  const [dupOpen, setDupOpen] = useState(false);
  const [tried, setTried] = useState(false);

  const sev = draft.severity ?? suggestedSeverityOf(draft, config);
  const fast = isHighOrCritical(sev);
  const sevLbl = sev ? SEV_LABEL[sev] : 'Belum ditentukan';
  const missing = missingOf(draft);
  const category = draft.category === 'Lainnya' && draft.categoryOther ? draft.categoryOther : (draft.category ?? '—');
  const lokasi = draft.patokan || draft.locationName || '—';
  const affected = AXIS_ORDER.filter((a) => draft.axes.includes(a)).map((a) => AXIS_LABEL[a]);
  const aiCount = draft.aiFilled.length;

  const removeState = () => {
    const p = new URLSearchParams(params);
    p.delete('state');
    setParams(p, { replace: true });
  };

  const { actions, overlay } = useDraftMenu({
    savedAt: formatWibFull(demoNow()).slice(-9),
    onDelete: () => {
      resetDraft();
      navigate('/insiden');
    },
  });

  const doSubmit = () => {
    const no = nextNumber('INS-SEN', useDemoStore.getState().incidents.map((i) => i.no));
    addIncident(buildIncident(draft, no, DEMO_USERS[role].name, ORG, config));
    navigate(`/insiden/${no}`, { state: { toast: fast ? 'Insiden diajukan. SKK Migas sudah diberi tahu.' : 'Insiden diajukan.' } });
    resetDraft();
  };
  // Lembar "kemungkinan ganda" (M5) hanya lewat ?state=ganda: desktop belum punya padanan di langkah 4.
  const candidates =
    params.get('state') === 'ganda'
      ? duplicateCandidates(buildIncident(draft, nextNumber('INS-SEN', incidents.map((i) => i.no)), DEMO_USERS[role].name, ORG, config), incidents)
      : [];
  const submit = () => {
    if (conflict) return;
    if (missing.length > 0) {
      setTried(true);
      return;
    }
    if (candidates.length > 0) {
      setDupOpen(true);
      return;
    }
    doSubmit();
  };
  const reload = () => {
    setConflict(false);
    removeState();
  };

  return (
    <MobileShell
      title="Laporan baru"
      backTo="/insiden"
      actions={actions}
      footer={
        <>
          <Link to={STEP_ROUTES.lampiran} className="p-btn p-btn-secondary" aria-label="Sebelumnya" style={{ width: 48, padding: 0, justifyContent: 'center' }}>
            <Pi d={D.prev} size={18} />
          </Link>
          <button type="button" className="p-btn p-btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={conflict} onClick={submit}>
            <Pi d={failed ? D.retry : D.send} />
            {failed ? 'Ajukan lagi' : 'Ajukan'}
          </button>
        </>
      }
      overlay={
        <>
          {overlay}
          {failed && <Toast text="Laporan belum terkirim. Periksa koneksi lalu coba lagi." tone="err" onClose={() => setFailed(false)} bottom={84} />}
          {dupOpen && candidates.length > 0 && (
            <DuplicateSheet
              candidates={candidates}
              onSubmitAnyway={() => {
                setDupOpen(false);
                doSubmit();
              }}
              onLink={(no) => {
                resetDraft();
                navigate(`/insiden/${no}`, { state: { toast: `Pesan ditautkan ke ${no}.` } });
              }}
              onDelete={() => {
                resetDraft();
                navigate('/insiden');
              }}
              onBack={() => setDupOpen(false)}
            />
          )}
        </>
      }
    >
      <StepHead step={4} name="Ringkasan" next="Langkah terakhir" />
      {conflict && (
        <div className="in-bn caution" role="alert" style={BANNER}>
          <Pi d={D.warn} />
          <div className="body">
            <b>Draf sudah diubah oleh Andi Pratama</b> pukul 07:12 WIB. Perubahan Anda belum tersimpan.
            <div className="acts">
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={{ minHeight: 36 }} onClick={reload}>Muat ulang</button>
            </div>
          </div>
        </div>
      )}
      {tried && missing.length > 0 && (
        <div className="in-bn err" role="alert" style={BANNER}>
          <Pi d={D.warn} />
          <div className="body">
            <b>{missing.length} isian belum lengkap.</b> Lengkapi lalu ajukan lagi.
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {missing.map((x) => (
                <li key={x.label}>
                  {x.msg ?? `${x.label} belum diisi.`} <Link to={x.to} className="lk-alink">Isi {x.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {aiCount > 0 && (
        <AiBar>
          <b>AI sudah memeriksa laporan</b> · {aiCount} isian perlu dicek
        </AiBar>
      )}
      {failed && fast && (
        <div className="in-bn caution" style={BANNER}>
          <Pi d={D.warn} />
          <div className="body">Belum terkirim, jadi SKK Migas juga belum diberi tahu. Draf Anda aman.</div>
        </div>
      )}

      <div className="sec">
        <div className="hd">
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="p-tag t-info">Insiden</span>
            <span className={'p-tag ' + (sev ? SEV_TAG_CLS[sev] : 't-draft')}><span className="dot"></span>{sevLbl}</span>
          </div>
          <Link to={STEP_ROUTES.temuan} className="p-tbtn" style={TBTN}>Ubah</Link>
        </div>
        <b style={{ fontSize: 18, lineHeight: '26px' }}>{draft.title || '—'}</b>
        <dl className="kv">
          <dt>Waktu kejadian</dt><dd>{formatWibFull(occurredIso(draft))}</dd>
          <dt>Lokasi</dt>
          <dd>
            {lokasi}
            <span className="p-cap" style={{ display: 'block' }}>{[draft.locationName, draft.wk].filter(Boolean).join(' · ')}</span>
          </dd>
          <dt>Kategori</dt><dd>{category}</dd>
        </dl>
        <div className="stats">
          <div><span className="k">Operasi</span><b>{opsText(draft)}</b></div>
          <div><span className="k">Korban</span><b>{casualtyText(draft)}</b></div>
          <div><span className="k">Kerugian</span><b>{draft.axes.includes('prop') && draft.lossIdr ? rupiahShort(draft.lossIdr) : 'Tidak diisi'}</b></div>
        </div>
      </div>

      <div className="sec">
        <div className="hd">
          <h2>Kejadian &amp; dampak</h2>
          <Link to={STEP_ROUTES.kejadian} className="p-tbtn" style={TBTN}>Ubah</Link>
        </div>
        <dl className="kv">
          <dt>Yang terdampak</dt><dd>{affected.length ? affected.join(', ') : '—'}</dd>
          <dt>Dampak keamanan</dt><dd>{draft.securityImpact || '—'}</dd>
          <dt>Keparahan</dt><dd>{sevLbl}{draft.severityManual ? '' : ' · sesuai saran sistem'}</dd>
          <dt>Sudah menangani</dt>
          <dd>{draft.handledBy.length ? `${draft.handledBy.map((h) => HANDLED_LABEL[h]).join(', ')} (menurut pelapor)` : '—'}</dd>
        </dl>
      </div>

      <div className="sec">
        <div className="hd">
          <h2>Lampiran · {draft.attachments.length} file</h2>
          <Link to={STEP_ROUTES.lampiran} className="p-tbtn" style={TBTN}>Ubah</Link>
        </div>
        {draft.attachments.length === 0 ? (
          <span className="p-cap">Tidak ada lampiran.</span>
        ) : (
          <div className="p-files">
            {draft.attachments.map((a) => (
              <div className="p-file" key={a.id}>
                <span className="fi">{extLabel(a.name)}</span>
                <div className="grow">
                  <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</b>
                  <span className="p-cap">{formatSize(a.sizeKb)}</span>
                  {a.caption && (
                    <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Keterangan:</span> {a.caption}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sec"><ReviewerSelect options={reviewerOptions(DEMO_USERS[role].name)} value={draft.reviewers} onChange={(v) => patchDraft({ reviewers: v })} /></div>

      <section className="in-pre" aria-label="Yang terjadi saat Anda menekan Ajukan">
        <h3>Yang terjadi saat Anda menekan Ajukan</h3>
        <div className="rows">
          <div className="r">
            <span className="ic"><Pi d={D.lock} size={15} /></span>
            <span>
              <b>Laporan terkunci</b>Isi dan lampiran tidak bisa diubah sampai Pejabat Berwenang memeriksa. Perlu mengubah? Batalkan pengajuan selama belum diperiksa.
            </span>
          </div>
          {fast ? (
            <div className="r">
              <span className="ic"><Pi d={D.bell} size={15} /></span>
              <span>
                <b>SKK Migas langsung diberi tahu</b>Keparahan <b style={{ display: 'inline', margin: 0 }}>{sevLbl}</b> langsung dikirim ke semua Pengawas SKK, sebelum diperiksa. Pastikan keparahannya sudah sesuai.
              </span>
            </div>
          ) : (
            <div className="r">
              <span className="ic"><Pi d={D.user} size={15} /></span>
              <span>
                <b>Pejabat Berwenang diberi tahu</b>Laporan masuk ke Pejabat Berwenang untuk diperiksa. Keparahan <b style={{ display: 'inline', margin: 0 }}>{sevLbl}</b> tidak langsung dikirim ke SKK Migas.
              </span>
            </div>
          )}
        </div>
      </section>
    </MobileShell>
  );
}
