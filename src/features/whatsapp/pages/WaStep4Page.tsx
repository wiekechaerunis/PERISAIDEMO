// Board: I22 (Ringkasan · kemungkinan ganda, tiga pilihan), I22b (Hapus draf ini?), I22b-RingkasanGandaTutup (?daftar=tutup).
// Ajukan nonaktif sampai Pelapor memilih: Tautkan pesan ke insiden itu, Tetap ajukan sebagai insiden baru, atau Hapus draf.
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { formatRupiah, formatWibFull } from '@/lib/format';
import { DEMO_USERS } from '@/lib/rbac';
import { SEV_LABEL, SEV_TAG_CLS, isHighOrCritical } from '@/lib/severity';
import { useDemoStore } from '@/services/mock/store';
import { deleteWaDraft, linkMessageToIncident, submitWaDraft } from '@/services/mock/workflow.wa';
import { extLabel, formatSize } from '@/features/insiden/logic/attachments';
import { occurredIso, suggestedSeverityOf, nextNumber } from '@/features/insiden/logic/submit';
import { AXIS_LABEL, AXIS_ORDER, HANDLED_LABEL, casualtyText, missingOf, opsText } from '@/mobile/formB/step4Logic';
import { STEP_ROUTES } from '@/features/insiden/logic/steps';
import { DeleteDraftDialog } from '../components/Dialogs';
import { NoDraft } from '../components/NoDraft';
import { SubmissionCard, Toast } from '../components/parts';
import { WaDuplicateBanner } from '../components/WaDuplicateBanner';
import { WaFormShell } from '../components/WaFormShell';
import { TOAST_DELETED, WA_ROUTES, senderLabel, useActiveWaDraft, waPath, type WaStepKey } from '../logic/draft';
import { waDuplicates } from '../logic/duplicates';
import { WA_PREFIX } from '../logic/extract';

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const STEP_OF: Record<string, WaStepKey> = { [STEP_ROUTES.temuan]: 'temuan', [STEP_ROUTES.kejadian]: 'kejadian' };

export function WaStep4Page() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { draft: wa, message, patchDraft } = useActiveWaDraft();
  const incidents = useDemoStore((s) => s.incidents);
  const config = useDemoStore((s) => s.config);
  const role = useDemoStore((s) => s.role);
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState(false);
  const [del, setDel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = wa?.form;
  const candidates = useMemo(() => (form ? waDuplicates(form, incidents, config) : []), [form, incidents, config]);
  if (!wa || !message || !form) return <NoDraft />;

  const me = DEMO_USERS[role].name;
  const f = form;
  const sev = f.severity ?? suggestedSeverityOf(f, config);
  const fast = isHighOrCritical(sev);
  const sevLbl = sev ? SEV_LABEL[sev] : 'Belum ditentukan';
  const missing = missingOf(f);
  const pending = candidates.length > 0 && wa.dupChoice === null;
  const kept = wa.dupChoice === 'tetap' && candidates.length > 0;
  const category = f.category === 'Lainnya' && f.categoryOther ? f.categoryOther : (f.category ?? '—');
  const lokasi = f.patokan || f.locationName || '—';
  const affected = AXIS_ORDER.filter((a) => f.axes.includes(a)).map((a) => AXIS_LABEL[a]);
  const unaffected = AXIS_ORDER.filter((a) => !f.axes.includes(a)).map((a) => AXIS_LABEL[a]);
  const to = (path: string) => waPath(STEP_OF[path] ?? 'kejadian', wa.id);

  const submit = () => {
    if (pending) return;
    if (missing.length > 0) {
      setTried(true);
      return;
    }
    const r = useDemoStore.getState().decide((s) => submitWaDraft(s, wa.id, me));
    if (!r.ok) {
      setError(r.reason);
      return;
    }
    const no = r.state.incidents[0].no;
    navigate(`/insiden/${no}`, { state: { toast: fast ? 'Insiden diajukan. SKK Migas sudah diberi tahu.' : 'Insiden diajukan.' } });
  };
  const link = (no: string) => {
    const r = useDemoStore.getState().decide((s) => linkMessageToIncident(s, message.id, no, me));
    if (!r.ok) return setError(r.reason);
    navigate(`/insiden/${no}`, { state: { toast: `Pesan ditautkan ke ${no}. Draf ini dihapus.` } });
  };
  const remove = () => {
    const r = useDemoStore.getState().decide((s) => deleteWaDraft(s, wa.id));
    if (!r.ok) return setError(r.reason);
    navigate(WA_ROUTES.inbox, { state: { toast: TOAST_DELETED } });
  };

  const top = (
    <>
      {candidates.length > 0 && wa.dupChoice === null && (
        <WaDuplicateBanner
          candidates={candidates} initiallyClosed={params.get('daftar') === 'tutup'}
          onLink={link} onKeep={() => patchDraft((d) => ({ ...d, dupChoice: 'tetap' }))} onDelete={() => setDel(true)}
        />
      )}
      {kept && (
        <div className="in-bn info">
          <Icon name="info" size={18} />
          <div className="body">Ditandai <b>kemungkinan sama dengan {candidates.length} insiden</b>. Pejabat Berwenang yang memutuskan saat pemeriksaan.</div>
        </div>
      )}
      {error && (
        <div className="in-bn err" role="alert">
          <Icon name="warn" size={18} />
          <div className="body">{error}</div>
        </div>
      )}
      {tried && missing.length > 0 && (
        <div className="in-bn err" role="alert">
          <Icon name="warn" size={18} />
          <div className="body">
            <b>{missing.length} isian belum lengkap.</b> Lengkapi lalu ajukan lagi dari Ringkasan.
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {missing.map((x) => (
                <li key={x.label}>{x.msg ?? `${x.label} belum diisi.`} <Link to={to(x.to)} className="lk-alink">Isi {x.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );

  const main = (
    <>
      <section className="p-card">
        <div className="lk-card-head" style={{ marginBottom: 0 }}>
          <div className="hero-top">
            <span className="p-tag t-info">Insiden</span>
            <span className={'p-tag ' + (sev ? SEV_TAG_CLS[sev] : 't-draft')}><span className="dot"></span>{sevLbl}</span>
          </div>
          <Link to={waPath('temuan', wa.id)} className="p-tbtn">Ubah</Link>
        </div>
        <h2 className="hero-ttl">{f.title || '—'}</h2>
        <dl className="lk-kv1">
          <dt>Waktu kejadian</dt><dd>{formatWibFull(occurredIso(f))}</dd>
          <dt>Lokasi</dt>
          <dd>{lokasi}<span className="p-cap" style={{ display: 'block' }}>{[f.locationName, f.wk].filter(Boolean).join(' · ')}</span></dd>
          <dt>Kategori</dt><dd>{category}</dd>
        </dl>
        <div className="stats">
          <div><span className="k">Operasi</span><b>{opsText(f)}</b></div>
          <div><span className="k">Korban</span><b>{casualtyText(f) === 'Tidak terdampak' ? 'Tidak ada' : casualtyText(f)}</b></div>
          <div><span className="k">Perkiraan kerugian</span><b>{f.axes.includes('prop') && f.lossIdr ? formatRupiah(f.lossIdr) : 'Belum diisi'}</b></div>
        </div>
      </section>

      <section className="p-card">
        <div className="lk-card-head" style={{ marginBottom: 12 }}>
          <h2 className="p-h2">Kejadian &amp; dampak</h2>
          <Link to={waPath('kejadian', wa.id)} className="p-tbtn">Ubah</Link>
        </div>
        <dl className="lk-kv1">
          <dt>Yang terdampak</dt>
          <dd>
            {affected.length ? affected.join(', ') : '—'}
            {unaffected.length > 0 && (
              <span className="p-cap" style={{ display: 'block' }}>{unaffected.map((u, i) => (i === 0 ? u : lowerFirst(u))).join(', ')}: tidak terdampak</span>
            )}
          </dd>
          <dt>Dampak keamanan</dt><dd>{f.securityImpact || '—'}</dd>
          <dt>Sudah menangani</dt><dd>{f.handledBy.length ? f.handledBy.map((h) => HANDLED_LABEL[h]).join(', ') : '—'}</dd>
          <dt>Sumber</dt><dd>WhatsApp · {message.group} · {senderLabel(message)}</dd>
        </dl>
      </section>

      <section className="p-card">
        <div className="lk-card-head" style={{ marginBottom: 12 }}>
          <h2 className="p-h2">Lampiran · {f.attachments.length} file</h2>
          <Link to={waPath('lampiran', wa.id)} className="p-tbtn">Ubah</Link>
        </div>
        {f.attachments.length === 0 ? (
          <span className="p-cap">Tidak ada lampiran.</span>
        ) : (
          <div className="p-files">
            {f.attachments.map((a) => (
              <div className="p-file" key={a.id}>
                <span className="fi">{extLabel(a.name)}</span>
                <div className="grow">
                  <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.name}>{a.name}</b>
                  <span className="p-row" style={{ gap: 8, flexWrap: 'wrap' }}><span className="p-cap">{formatSize(a.sizeKb)}</span></span>
                  <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Keterangan:</span> {a.caption || (a.id.startsWith(WA_PREFIX) ? 'Dari pesan WhatsApp' : '—')}
                  </span>
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
            <span><b>Laporan terkunci</b>Isi dan lampiran tidak bisa diubah sampai Pejabat Berwenang memeriksa. Perlu mengubah? Tarik kembali selama belum diperiksa.</span>
          </div>
          {fast ? (
            <div className="r">
              <span className="ic"><Icon name="bell" size={15} /></span>
              <span>
                <b>SKK Migas langsung diberi tahu</b>Keparahan <b style={{ display: 'inline', margin: 0 }}>{sevLbl}</b> langsung dikirim ke semua Pengawas SKK
                {kept ? ', beserta tanda kemungkinan sama' : ''}. Pastikan keparahannya sudah sesuai.
              </span>
            </div>
          ) : (
            <div className="r">
              <span className="ic"><Icon name="user" size={15} /></span>
              <span><b>Pejabat Berwenang diberi tahu</b>Laporan masuk ke Pejabat Berwenang untuk diperiksa. Keparahan <b style={{ display: 'inline', margin: 0 }}>{sevLbl}</b> tidak langsung dikirim ke SKK Migas.</span>
            </div>
          )}
        </div>
      </section>
    </>
  );

  const aside = (
    <SubmissionCard no={nextNumber('INS-SEN', incidents.map((i) => i.no))} message={message} firstReported />
  );

  return (
    <>
      <WaFormShell
        step={4} top={top} main={main} aside={aside}
        back={{ label: 'Sebelumnya', to: waPath('kejadian', wa.id) }}
        actions={[
          { label: 'Simpan draf', onClick: () => setSaved(true) },
          { label: 'Ajukan', variant: 'primary', onClick: submit, disabled: pending, icon: <Icon name="send" size={16} /> },
        ]}
        overlay={del ? <DeleteDraftDialog onCancel={() => setDel(false)} onConfirm={remove} /> : null}
      />
      {saved && <Toast text="Draf disimpan." onClose={() => setSaved(false)} />}
    </>
  );
}
