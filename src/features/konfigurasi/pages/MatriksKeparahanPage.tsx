// Board: CFG-MatriksKeparahan (lihat / ubah). `?state=ubah` membuka mode "Buat versi baru".
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { SEV_LABEL, SEV_TAG_CLS, lossSeverity, suggestSeverity } from '@/lib/severity';
import { formatDate, formatNumber, formatWibFull } from '@/lib/format';
import {
  CFG_NOW, LOSS_LEVELS, matrixVersion, parseWhole, updateLossThresholds,
} from '@/services/mock/workflow.config';
import { AdminGate, CfgToast, ChildShell, useCfgToast } from '../components/ConfigShell';
import { Ic, P_CHECK, P_CLOCK } from '../components/Ic';
import { DateField } from '@/components/ui/DateField';
import { FieldErr, NumField, RAW_INPUT } from '../components/Field';
import { dayBefore, levelRows, matrixVersions, type Bounds } from '../logic/levels';

type LossKey = (typeof LOSS_LEVELS)[number];
type Draft = { rendah: string; sedang: string; tinggi: string; kritis: string; effectiveFrom: string; basis: string };

export function MatriksKeparahanPage() {
  const [params] = useSearchParams();
  return (
    <AdminGate>
      <MatriksBody initialEdit={params.get('state') === 'ubah'} />
    </AdminGate>
  );
}

function MatriksBody({ initialEdit }: { initialEdit: boolean }) {
  const config = useDemoStore((s) => s.config);
  const role = useDemoStore((s) => s.role);
  const applyConfig = useDemoStore((s) => s.applyConfig);
  const me = DEMO_USERS[role];
  const t = config.lossThresholdsUsd;
  const kurs = config.kursIdrPerUsd;
  const versions = matrixVersions(config);
  const cur = versions[0];
  const version = matrixVersion(config);

  const fresh = (): Draft => ({
    rendah: String(t.rendah), sedang: String(t.sedang), tinggi: String(t.tinggi), kritis: String(t.kritis),
    // Board menampilkan contoh "1 Jan 2028" pada draf.
    effectiveFrom: '2028-01-01', basis: '',
  });
  const [edit, setEdit] = useState(initialEdit);
  const [draft, setDraft] = useState<Draft>(fresh);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useCfgToast();

  const toEdit = () => { setDraft(fresh()); setErrors({}); setEdit(true); setToast(null); };
  const save = () => {
    const r = applyConfig((c) => updateLossThresholds(c, draft, { name: me.name, role, roleLabel: me.roleLabel }, CFG_NOW));
    if (!r.ok) { setErrors(r.errors); return; }
    setErrors({});
    setEdit(false);
    setToast(`Versi ${r.version} disimpan. Berlaku mulai ${formatDate(draft.effectiveFrom)}.`);
  };
  const set = (k: keyof Draft, v: string) => { setDraft({ ...draft, [k]: v }); setErrors({}); };

  const bounds: Bounds = edit
    ? {
        rendah: parseWhole(draft.rendah, true), sedang: parseWhole(draft.sedang, true),
        tinggi: parseWhole(draft.tinggi, true), kritis: parseWhole(draft.kritis, true),
      }
    : { ...t };
  const rows = levelRows(bounds, kurs);

  // Contoh di kartu Konversi kurs: dihitung dari ambang dan kurs yang berlaku.
  const exLoss = 18_500_000;
  const exSev = lossSeverity(exLoss, kurs, t);
  const exSuggest = suggestSeverity({ ops: 'berhenti', lossIdr: exLoss, kursIdrPerUsd: kurs }, t);

  return (
    <ChildShell
      title="Matriks keparahan"
      actions={!edit ? (
        <button type="button" className="p-btn p-btn-primary" onClick={toEdit}>
          <Ic d="M12 5v14M5 12h14" />Buat versi baru
        </button>
      ) : null}
      outside={<CfgToast msg={toast} bottom={24} />}
    >
      <div className="lk-grid">
        <div className="c8 lk-stack">
          <section className="p-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="lk-card-head" style={{ padding: '16px 20px', margin: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h2 className="p-h2">{edit ? `Versi ${version + 1} · draf` : `Versi ${version} · berlaku sejak ${formatDate(cur?.effectiveFrom ?? CFG_NOW)}`}</h2>
                <span className="p-cap">{edit ? 'Isi batas bawah tiap level. Batas atas mengikuti level berikutnya.' : `Dibuat ${cur?.by ?? 'Sistem'}, ${formatDate(cur?.at ?? CFG_NOW)}`}</span>
              </div>
              <span className={edit ? 'p-tag t-draft' : 'p-tag t-ok'}>{edit ? 'Draf' : 'Berlaku'}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="p-table lk-tbl" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Level</th>
                    <th>Kerugian (USD)</th>
                    <th>Pratinjau Rp<span className="p-cap" style={{ display: 'block', fontWeight: 500 }}>kurs contoh {formatNumber(kurs)}</span></th>
                    <th>Operasi berhenti</th>
                    <th style={{ paddingRight: 20 }}>Korban terberat</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const key = r.sev;
                    const editable = edit && key !== 'sangat-rendah';
                    return (
                      <tr key={r.sev}>
                        <td style={{ paddingLeft: 20 }}>
                          <span className={r.tag}><span className="dot"></span>{r.n} · {r.l}</span>
                          <span className="p-cap" style={{ display: 'block', marginTop: 4 }}>Setara {r.alt}</span>
                        </td>
                        <td>
                          {!edit && <span className="p-mono" style={{ fontSize: 13 }}>{r.usd}</span>}
                          {edit && key === 'sangat-rendah' && (
                            <span className="p-input ro" style={{ height: 32, width: 150 }}><span className="affix">USD</span><span className="num" style={{ flex: 1 }}>0</span></span>
                          )}
                          {editable && (
                            <NumField label={`Batas bawah ${r.l} (USD)`} value={draft[key as LossKey]} width={150} lead="USD" err={errors[key]} onChange={(v) => set(key as LossKey, v)} />
                          )}
                        </td>
                        <td><span className="p-cap">{r.rp}</span></td>
                        <td>
                          {!edit ? r.op : (
                            <span className="p-input ro" style={{ height: 32, width: 120 }}><span className="num" style={{ flex: 1 }}>{r.opn}</span><span className="affix">jam</span></span>
                          )}
                        </td>
                        <td style={{ paddingRight: 20 }}>{r.kb}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
              <span className="p-cap">Batas bawah termasuk, batas atas tidak. Sumbu korban dan sebaran dampak adalah definisi tetap dan tidak bisa diubah di sini.</span>
            </div>
          </section>
          {edit && (
            <section className="p-card">
              <h2 className="p-h2" style={{ marginBottom: 12 }}>Berlaku untuk</h2>
              <div className="lk-f2">
                <div className="p-field">
                  <label className="p-lbl" htmlFor="cfg-mulai" style={{ color: 'var(--ink)' }}>Tanggal mulai berlaku<span className="p-req">*</span></label>
                  <DateField id="cfg-mulai" label="Tanggal mulai berlaku" value={draft.effectiveFrom} onChange={(v) => set('effectiveFrom', v)} invalid={!!errors.effectiveFrom} />
                  {errors.effectiveFrom
                    ? <FieldErr text={errors.effectiveFrom} />
                    : <span className="p-help">Minimal besok. Insiden dengan waktu kejadian sebelum tanggal ini tetap memakai versi lama.</span>}
                </div>
                <div className="p-field">
                  <label className="p-lbl" htmlFor="cfg-dasar" style={{ color: 'var(--ink)' }}>Dasar perubahan<span className="p-req">*</span></label>
                  <span className={'p-input' + (errors.basis ? ' err' : '')}>
                    <input
                      id="cfg-dasar" placeholder="mis. Keputusan rapat SKK no. ..." value={draft.basis} aria-invalid={errors.basis ? true : undefined}
                      onChange={(e) => set('basis', e.target.value)} style={{ ...RAW_INPUT, flex: 1 }}
                    />
                  </span>
                  {errors.basis
                    ? <FieldErr text={errors.basis} />
                    : <span className="p-help">Tercatat di jejak audit bersama nilai lama dan baru.</span>}
                </div>
              </div>
            </section>
          )}
          <section className="p-card">
            <h2 className="p-h2" style={{ marginBottom: 12 }}>Riwayat perubahan</h2>
            <ol className="p-tl in-kr" aria-label="Riwayat versi matriks">
              {versions.map((h, i) => {
                const newer = versions[i - 1];
                const from = h.effectiveFrom ?? h.at.slice(0, 10);
                return (
                  <li key={h.version ?? i}>
                    <span className="nd" aria-hidden="true"><Ic d={i === 0 ? P_CHECK : P_CLOCK} size={11} /></span>
                    <div>
                      <div className="hd"><b>{i === 0 ? `Versi ${h.version} · berlaku` : `Versi ${h.version}`}</b> · {h.by}</div>
                      <div className="tm">
                        {i === 0
                          ? `Berlaku sejak ${formatDate(from)} · disimpan ${formatWibFull(h.at)}`
                          : `${formatDate(from)} – ${formatDate(dayBefore(newer.effectiveFrom ?? newer.at.slice(0, 10)))}`}
                      </div>
                      <div className="body">{h.basis ? `${h.text}\nDasar: ${h.basis}` : h.text}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
        <aside className="c4 lk-stack">
          <section className="p-card">
            <h2 className="p-h2" style={{ marginBottom: 12 }}>Konversi kurs</h2>
            <dl className="lk-kv1">
              <dt>Input di form</dt><dd>Rupiah</dd>
              <dt>Ambang disimpan</dt><dd>USD</dd>
              <dt>Sumber kurs</dt><dd>JISDOR Bank Indonesia<span className="p-tag t-caution" style={{ height: 18, fontSize: 10, marginLeft: 6 }}>usulan</span></dd>
              <dt>Kurs dipakai</dt><dd>Tanggal kejadian, disimpan bersama insiden</dd>
            </dl>
            <div className="lk-divider" style={{ margin: '14px 0' }}></div>
            <span className="p-lbl">Contoh</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, fontSize: 13, lineHeight: '19px' }}>
              <span>Kerugian <b>Rp18.500.000</b> pada 28 Okt 2026</span>
              <span className="p-cap">≈ USD {formatNumber(Math.round(exLoss / kurs))} (kurs {formatNumber(kurs)}) → <b style={{ color: 'var(--ink)' }}>{exSev ? SEV_LABEL[exSev] : '—'}</b></span>
              <span className="p-cap">Operasi berhenti 6 jam → <b style={{ color: 'var(--ink)' }}>Tinggi</b></span>
              <span>
                Saran keparahan:{' '}
                {exSuggest && <span className={`p-tag ${SEV_TAG_CLS[exSuggest]}`}><span className="dot"></span>{SEV_LABEL[exSuggest]}</span>}
                <span className="p-cap" style={{ display: 'block' }}>dampak tertinggi dari semua sumbu</span>
              </span>
            </div>
          </section>
          <section className="p-card">
            <h2 className="p-h2" style={{ marginBottom: 10 }}>Aturan</h2>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, lineHeight: '19px' }}>
              <li>Hanya Admin SKK yang bisa membuat versi baru. KKKS melihat matriks ini tapi tidak bisa mengubahnya.</li>
              <li>Versi baru berlaku ke depan. Level insiden yang sudah tercatat tidak berubah.</li>
              <li>Kalau kurs berubah, level insiden lama tidak bergeser karena kursnya ikut tersimpan.</li>
              <li>Detail dan dashboard menampilkan Rp dan USD.</li>
            </ul>
          </section>
        </aside>
      </div>
      {edit && (
        <div className="lk-ffoot" role="region" aria-label="Aksi formulir" style={{ margin: '16px -24px 0' }}>
          <span className="p-cap">Versi {version + 1} · draf, belum disimpan</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="p-btn p-btn-secondary" onClick={() => { setEdit(false); setErrors({}); }}>Batal</button>
            <button type="button" className="p-btn p-btn-primary" onClick={save}>Simpan versi {version + 1}</button>
          </div>
        </div>
      )}
    </ChildShell>
  );
}
