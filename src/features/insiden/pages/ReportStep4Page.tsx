// Board: I14 / I14s (Ringkasan & Ajukan), S05 (gagal kirim), S06 (draf bentrok), S01 (validasi).
// Simulasi state lewat query: ?state=gagal-kirim | ?state=bentrok.
import { demoNow } from '@/services/mock/clock';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { formatRupiah, formatWibFull } from '@/lib/format';
import { DEMO_USERS, reviewerOptions } from '@/lib/rbac';
import { ReviewerSelect } from '@/components/ui/ReviewerSelect';
import { SEV_LABEL, SEV_TAG_CLS, isHighOrCritical, type CasualtyKind } from '@/lib/severity';
import { ORG } from '@/services/mock/seed';
import { useDemoStore } from '@/services/mock/store';
import { ReportFormShell } from '../components/ReportFormShell';
import { AiMsg, CopilotFrame } from '../copilot/parts';
import { extLabel, formatSize } from '../logic/attachments';
import { useDraftStore, type Axis, type ReportDraft } from '../logic/draft';
import { stepsOf, STEP_ROUTES } from '../logic/steps';
import { buildIncident, nextNumber, occurredIso, siteArea, suggestedSeverityOf } from '../logic/submit';

const hhmm = () => demoNow().slice(11, 16);

const AXIS_LABEL: Record<Axis, string> = {
  prop: 'Properti atau operasi',
  man: 'Manusia',
  ling: 'Lingkungan pengamanan',
  data: 'Data dan informasi',
};
const AXIS_ORDER: Axis[] = ['prop', 'man', 'ling', 'data'];
const CASUALTY_LABEL: Record<CasualtyKind, string> = {
  p3k: 'Luka ringan (P3K)',
  klinik: 'Dibawa ke klinik atau rumah sakit',
  berat: 'Luka berat atau cacat',
  meninggal: 'Meninggal dunia',
  belum: 'Belum diketahui',
};
const HANDLED_LABEL = { belum: 'Belum ada', int: 'Security internal', bujp: 'BUJP', tni: 'TNI', polri: 'Polri' } as const;
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

interface Missing {
  label: string;
  to: string;
  /** teks galat persis board bila ada */
  msg?: string;
}

/** Isian wajib yang belum lengkap (S01). */
function missingOf(d: ReportDraft): Missing[] {
  const m: Missing[] = [];
  if (!d.title.trim()) m.push({ label: 'Judul', to: STEP_ROUTES.temuan });
  if (!d.date || !d.time) m.push({ label: 'Waktu kejadian', to: STEP_ROUTES.temuan });
  if (!d.locationName.trim()) m.push({ label: 'Lokasi kejadian', to: STEP_ROUTES.temuan });
  if (!d.category) m.push({ label: 'Kategori', to: STEP_ROUTES.temuan });
  if (!d.securityImpact.trim()) m.push({ label: 'Dampak keamanan', to: STEP_ROUTES.kejadian });
  if (d.axes.length === 0) m.push({ label: 'Apa saja yang terdampak', to: STEP_ROUTES.kejadian });
  if (d.axes.includes('prop') && !d.ops) m.push({ label: 'Kondisi operasi', to: STEP_ROUTES.kejadian });
  if (d.axes.includes('prop') && d.ops === 'berhenti' && !d.opsHours && !d.ongoing) {
    m.push({ label: 'Lama operasi berhenti', to: STEP_ROUTES.kejadian, msg: 'Isi berapa jam operasi berhenti.' });
  }
  return m;
}

function opsText(d: ReportDraft): string {
  if (!d.axes.includes('prop') || !d.ops) return 'Tidak terdampak';
  const h = d.opsHours ? ` ${d.opsHours} jam` : d.ongoing ? ' (masih berlangsung)' : '';
  if (d.ops === 'berhenti') return `Berhenti${h}`;
  if (d.ops === 'sebagian') return `Terganggu${h}`;
  return 'Tidak terganggu';
}
function casualtyText(d: ReportDraft): string {
  const entries = d.axes.includes('man') ? (Object.entries(d.casualties) as [CasualtyKind, number][]) : [];
  if (entries.length === 0) return 'Tidak terdampak';
  return entries.map(([k, n]) => (k === 'belum' ? CASUALTY_LABEL[k] : `${CASUALTY_LABEL[k]}: ${n}`)).join(', ');
}

export function ReportStep4Page() {
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
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState(false);
  const time = useMemo(hhmm, []);

  const sev = draft.severity ?? suggestedSeverityOf(draft, config);
  const fast = isHighOrCritical(sev);
  const sevLbl = sev ? SEV_LABEL[sev] : 'Belum ditentukan';
  const missing = missingOf(draft);
  const nomor = nextNumber('INS-SEN', incidents.map((i) => i.no));
  const category = draft.category === 'Lainnya' && draft.categoryOther ? draft.categoryOther : (draft.category ?? '—');
  const lokasi = draft.patokan || draft.locationName || '—';
  const unaffected = AXIS_ORDER.filter((a) => !draft.axes.includes(a)).map((a) => AXIS_LABEL[a]);
  const affected = AXIS_ORDER.filter((a) => draft.axes.includes(a)).map((a) => AXIS_LABEL[a]);
  const withCaption = draft.attachments.filter((a) => a.caption.trim()).length;
  const sevWhy =
    draft.severityManual && draft.severityReason
      ? draft.severityReason
      : [
          opsText(draft) === 'Tidak terdampak' ? null : 'Operasi ' + lowerFirst(opsText(draft)),
          casualtyText(draft) === 'Tidak terdampak' ? 'tanpa korban' : lowerFirst(casualtyText(draft)),
        ]
          .filter(Boolean)
          .join(', ');

  const submit = () => {
    if (conflict) return;
    if (missing.length > 0) {
      setTried(true);
      return;
    }
    const no = nextNumber('INS-SEN', useDemoStore.getState().incidents.map((i) => i.no));
    addIncident(buildIncident(draft, no, DEMO_USERS[role].name, ORG, config));
    navigate(`/insiden/${no}`, {
      state: { toast: fast ? 'Insiden diajukan. SKK Migas sudah diberi tahu.' : 'Insiden diajukan.' },
    });
    resetDraft();
  };
  const reload = () => {
    setConflict(false);
    const p = new URLSearchParams(params);
    p.delete('state');
    setParams(p, { replace: true });
  };

  const main = (
    <>
      {conflict && (
        <div className="in-bn err" role="alert">
          <Icon name="warn" size={18} />
          <div className="body">
            <b>Draf sudah diubah oleh Andi Pratama</b> pukul 07:12 WIB. Muat ulang untuk melihat versi terbaru. Perubahan Anda belum
            tersimpan.
            <div className="acts">
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={{ background: 'var(--surface)' }} onClick={reload}>
                Muat ulang
              </button>
            </div>
          </div>
        </div>
      )}
      {tried && missing.length > 0 && (
        <div className="in-bn err" role="alert">
          <Icon name="warn" size={18} />
          <div className="body">
            <b>{missing.length} isian belum lengkap.</b> Lengkapi lalu ajukan lagi dari Ringkasan.
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

      <section className="p-card">
        <div className="lk-card-head" style={{ marginBottom: 0 }}>
          <div className="hero-top">
            <span className="p-tag t-info">Insiden</span>
            <span className={'p-tag ' + (sev ? SEV_TAG_CLS[sev] : 't-draft')}><span className="dot"></span>{sevLbl}</span>
          </div>
          <Link to={STEP_ROUTES.temuan} className="p-tbtn">Ubah</Link>
        </div>
        <h2 className="hero-ttl">{draft.title || '—'}</h2>
        <dl className="lk-kv1">
          <dt>Waktu kejadian</dt><dd>{formatWibFull(occurredIso(draft))}</dd>
          <dt>Lokasi</dt>
          <dd>
            {lokasi}
            <span className="p-cap" style={{ display: 'block' }}>{[siteArea(draft.locationName) || draft.locationName, draft.wk].filter(Boolean).join(' · ')}</span>
          </dd>
          <dt>Kategori</dt><dd>{category}</dd>
        </dl>
        <div className="stats">
          <div><span className="k">Operasi</span><b>{opsText(draft)}</b></div>
          <div><span className="k">Korban</span><b>{casualtyText(draft)}</b></div>
          <div>
            <span className="k">Perkiraan kerugian</span>
            <b>{draft.axes.includes('prop') && draft.lossIdr ? formatRupiah(draft.lossIdr) : 'Tidak diisi'}</b>
          </div>
        </div>
      </section>

      <section className="p-card">
        <div className="lk-card-head" style={{ marginBottom: 12 }}>
          <h2 className="p-h2">Kejadian &amp; dampak</h2>
          <Link to={STEP_ROUTES.kejadian} className="p-tbtn">Ubah</Link>
        </div>
        <dl className="lk-kv1">
          <dt>Yang terdampak</dt>
          <dd>
            {affected.length ? affected.join(', ') : '—'}
            {unaffected.length > 0 && (
              <span className="p-cap" style={{ display: 'block' }}>
                {unaffected.map((u, i) => (i === 0 ? u : lowerFirst(u))).join(', ')}: tidak terdampak
              </span>
            )}
          </dd>
          <dt>Dampak keamanan</dt><dd>{draft.securityImpact || '—'}</dd>
          <dt>Lokasi lengkap</dt>
          <dd>
            {lokasi}
            <span className="p-cap" style={{ display: 'block' }}>
              {draft.wk}
              {draft.lat !== null && draft.lng !== null && (
                <>
                  {draft.wk ? ' · ' : ''}
                  <span className="p-mono">{draft.lat}, {draft.lng}</span>
                </>
              )}
            </span>
          </dd>
          <dt>Keparahan</dt>
          <dd>
            {sevLbl}{draft.severityManual ? '' : ' · sesuai saran sistem'}
            <span className="p-cap" style={{ display: 'block' }}>{sevWhy}</span>
          </dd>
          <dt>Sudah menangani</dt>
          <dd>{draft.handledBy.length ? draft.handledBy.map((h) => HANDLED_LABEL[h]).join(', ') : '—'}</dd>
        </dl>
      </section>

      <section className="p-card">
        <div className="lk-card-head" style={{ marginBottom: 12 }}>
          <h2 className="p-h2">Lampiran · {draft.attachments.length} file</h2>
          <Link to={STEP_ROUTES.lampiran} className="p-tbtn">Ubah</Link>
        </div>
        {draft.attachments.length === 0 ? (
          <span className="p-cap">Tidak ada lampiran.</span>
        ) : (
          <div className="p-files">
            {draft.attachments.map((a) => (
              <div className="p-file" key={a.id}>
                <span className="fi">{extLabel(a.name)}</span>
                <div className="grow">
                  <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.name}>{a.name}</b>
                  <span className="p-row" style={{ gap: 8, flexWrap: 'wrap' }}><span className="p-cap">{formatSize(a.sizeKb)}</span></span>
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
      </section>

      <section className="in-pre" aria-label="Yang terjadi saat Anda menekan Ajukan">
        <h3>Yang terjadi saat Anda menekan Ajukan</h3>
        <div className="rows">
          <div className="r">
            <span className="ic"><Icon name="lock" size={15} /></span>
            <span>
              <b>Laporan terkunci</b>Isi dan lampiran tidak bisa diubah sampai Pejabat Berwenang memeriksa. Perlu mengubah? Tarik
              kembali selama belum diperiksa.
            </span>
          </div>
          {fast ? (
            <div className="r">
              <span className="ic"><Icon name="bell" size={15} /></span>
              <span>
                <b>SKK Migas langsung diberi tahu</b>Keparahan <b style={{ display: 'inline', margin: 0 }}>{sevLbl}</b> langsung dikirim ke
                semua Pengawas SKK, sebelum diperiksa. Pastikan keparahannya sudah sesuai.
              </span>
            </div>
          ) : (
            <div className="r">
              <span className="ic"><Icon name="user" size={15} /></span>
              <span>
                <b>Pejabat Berwenang diberi tahu</b>Laporan masuk ke Pejabat Berwenang untuk diperiksa. Keparahan{' '}
                <b style={{ display: 'inline', margin: 0 }}>{sevLbl}</b> tidak langsung dikirim ke SKK Migas.
              </span>
            </div>
          )}
        </div>
      </section>
    </>
  );

  const cpTxt = fast
    ? `Keparahan ${sevLbl}, jadi SKK Migas langsung diberi tahu setelah Anda mengajukan.`
    : `Keparahan ${sevLbl}, jadi laporan masuk ke Pejabat Berwenang dulu; SKK Migas tidak langsung diberi tahu.`;

  const aside = (
    <>
      {failed && fast && (
        <div className="p-note" style={{ alignItems: 'flex-start' }}>
          <Icon name="info" size={16} style={{ flex: 'none', marginTop: 1 }} />
          <span>Belum terkirim, jadi SKK Migas juga belum diberi tahu.</span>
        </div>
      )}
      <section className="p-card">
        <div className="lk-card-head" style={{ marginBottom: 12 }}><h2 className="p-h2">Pengajuan</h2></div>
        <dl className="lk-kv1">
          <dt>Nomor</dt><dd><span className="p-mono" style={{ fontSize: 12 }}>{nomor}</span></dd>
          <dt>Status</dt><dd><span className="p-tag t-draft">Draf</span></dd>
          <dt>Terakhir disimpan</dt><dd>{formatWibFull(demoNow())}</dd>
        </dl>
        <div style={{ marginTop: 12 }}><ReviewerSelect options={reviewerOptions(DEMO_USERS[role].name)} value={draft.reviewers} onChange={(v) => patchDraft({ reviewers: v })} /></div>
      </section>
      <CopilotFrame status="Memeriksa sebelum diajukan">
        <div className="cp-th" role="log" aria-live="polite">
          <AiMsg time={time}>
            Laporan hampir siap. Saya cek ulang semua isian:
            <ul className="cp-chk">
              {missing.length === 0 ? (
                <li><span className="ok"><Icon name="check" size={13} /></span>Semua isian wajib sudah terisi</li>
              ) : (
                <li className="w">
                  <span className="wr"><Icon name="warn" size={12} /></span>
                  <span>{missing.length} isian wajib belum terisi: {missing.map((x) => x.label.toLowerCase()).join(', ')}</span>
                </li>
              )}
              {draft.aiFilled.length > 0 && (
                <li><span className="ok"><Icon name="check" size={13} /></span>{draft.aiFilled.length} isian dari saran AI sudah Anda pakai</li>
              )}
              {draft.attachments.length > 0 && (
                <li><span className="ok"><Icon name="check" size={13} /></span>{withCaption} lampiran dengan keterangan</li>
              )}
            </ul>
          </AiMsg>
          <AiMsg time={time}>
            {cpTxt} Saya tidak mengajukan laporan; tekan <b>Ajukan</b> di bawah bila semuanya sudah sesuai.
          </AiMsg>
        </div>
        <div className="cp-cm">
          <div className="in">Ketik ceritamu di sini…</div>
          <button type="button" className="ib" aria-label="Lampirkan foto"><Icon name="attach" size={16} /></button>
          <button type="button" className="ib" aria-label="Rekam suara" title="Rekam suara"><Icon name="mic" size={16} /></button>
          <button type="button" className="ib send" aria-label="Kirim"><Icon name="send" size={16} /></button>
        </div>
      </CopilotFrame>
      {failed && (
        <div className="in-toastpos rb-toast">
          <div className="p-toast err" role="alert">
            <span className="ti"><Icon name="close" size={12} /></span>
            <span className="msg">Laporan belum terkirim. Periksa koneksi lalu coba lagi.</span>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup notifikasi" onClick={() => setFailed(false)}>
              <Icon name="close" size={15} />
            </button>
          </div>
        </div>
      )}
      {saved && !failed && (
        <div className="in-toastpos rb-toast">
          <div className="p-toast" role="status">
            <span className="ti"><Icon name="check" size={12} /></span>
            <span className="msg">Draf disimpan.</span>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup notifikasi" onClick={() => setSaved(false)}>
              <Icon name="close" size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <ReportFormShell
      step={4}
      steps={stepsOf('insiden')}
      main={main}
      aside={aside}
      back={{ label: 'Sebelumnya', to: STEP_ROUTES.lampiran }}
      actions={[
        { label: 'Simpan draf', onClick: () => setSaved(true) },
        { label: failed ? 'Ajukan lagi' : 'Ajukan', onClick: submit, variant: 'primary', disabled: conflict },
      ]}
    />
  );
}
