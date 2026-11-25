// Board KD3 (Naikkan jadi insiden, Pejabat) dan KD5 (Ajukan jadi insiden, Pelapor): satu formulir, dua mode.
// Teks dan markup mengikuti board; saran keparahan memakai suggestSeverity (lib) lewat suggestRaiseSeverity.
import { ReviewerSelect } from '@/components/ui/ReviewerSelect';
import { reviewerOptions } from '@/lib/rbac';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { formatNumber, formatWib } from '@/lib/format';
import { SEVERITIES, SEV_DOT, SEV_LABEL, SEV_TAG_CLS, isHighOrCritical, type Severity } from '@/lib/severity';
import { initials } from '@/lib/rbac';
import { PIC_GROUPS, PIC_PEOPLE } from '@/services/mock/workflow';
import { MAX_RAISE_REASON, raiseErrors } from '@/services/mock/workflow.kerawanan';
import type { Kerawanan, ModuleConfig } from '@/services/types';
import { FieldError } from '../AiTag';
import { AXES, DATA_OPTS, KAT, KB, MAX_ALASAN, MAX_DAMPAK, OPS, SEBARAN, bareInput, jenisOf, toggleCasualty } from '../step2Data';
import { Ic, SelectField } from '../review/parts';
import { formatSize } from '../../logic/attachments';
import { levelOf, picOf, severityParts, toSubmitInput, type RaiseForm } from '../../logic/kerawanan';
import { KerawananShell } from './KerawananShell';
import { P } from './parts';

export type RaiseMode = 'raise' | 'submit';

interface Props {
  k: Kerawanan;
  mode: RaiseMode;
  cfg: ModuleConfig;
  initial: RaiseForm;
  /** nomor insiden berikutnya, mis. INS-SEN-2026-0011 */
  nextNo: string;
  onCancel: () => void;
  /** mengembalikan pesan galat dari workflow bila gagal */
  onSubmit: (f: RaiseForm) => string | void;
}

const digits = (s: string) => s.replace(/\D/g, '');
const Divider = () => <div className="lk-divider" style={{ margin: '4px 0' }}></div>;
const Group = ({ t }: { t: string }) => <span className="p-lbl" style={{ color: 'var(--ink-muted)' }}>{t}</span>;
const Lbl = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
  <span className="p-lbl" style={{ color: 'var(--ink)' }}>{children}{req && <span className="p-req">*</span>}</span>
);

const COPY = {
  raise: {
    title: 'Naikkan jadi insiden', submit: 'Naikkan dan tetapkan PIC', copied: 'Disalin dari kerawanan. Bisa diperbaiki di detail insiden setelah dinaikkan.',
    katHelp: 'Daftar kategori SKK Migas. Ini menjadi kategori resmi insiden.', reasonH: 'Alasan dinaikkan', reasonQ: 'Kenapa kerawanan ini dinaikkan jadi insiden?',
    diffHelp: 'Saran dan pilihan Anda tampil berdampingan di detail insiden.', skk: 'saat Anda menekan Naikkan dan tetapkan PIC.',
    note: 'Menaikkan sama dengan memeriksa. [Usulan]', diffBy: 'Diubah Anda',
  },
  submit: {
    title: 'Ajukan jadi insiden', submit: 'Ajukan jadi insiden', copied: 'Disalin dari kerawanan. Pejabat Berwenang memeriksa isinya saat pemeriksaan.',
    katHelp: 'Daftar kategori SKK Migas. Pejabat Berwenang bisa mengubahnya saat pemeriksaan.', reasonH: 'Alasan diajukan', reasonQ: 'Kenapa kerawanan ini diajukan jadi insiden?',
    diffHelp: 'Pejabat Berwenang menetapkan keparahan resmi.', skk: 'saat diajukan.',
    note: 'Belum dihitung resmi sampai diperiksa Pejabat Berwenang.', diffBy: 'Diubah Anda',
  },
} as const;

export function RaiseFormView({ k, mode, cfg, initial, nextNo, onCancel, onSubmit }: Props) {
  const c = COPY[mode];
  const [f, setF] = useState<RaiseForm>(initial);
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [katOpen, setKatOpen] = useState(false);
  const [rev, setRev] = useState<string[] | null>(null);
  const [sevEdit, setSevEdit] = useState(false);
  const katRef = useRef<HTMLDivElement>(null);
  const patch = (p: Partial<RaiseForm>) => {
    setServerError(undefined);
    setF((x) => ({ ...x, ...p }));
  };

  useEffect(() => {
    if (!katOpen) return;
    const down = (e: MouseEvent) => katRef.current && !katRef.current.contains(e.target as Node) && setKatOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setKatOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [katOpen]);

  const { suggested, level } = levelOf(f, cfg);
  const differs = level !== suggested;
  const errors = raiseErrors({ ...toSubmitInput(f, '', cfg), pic: picOf(f) }, suggested, mode === 'raise');
  const show = (key: keyof typeof errors) => (tried ? errors[key] : undefined);
  const parts = severityParts(f);
  const has = (a: RaiseForm['axes'][number]) => f.axes.includes(a);
  const toggleAxis = (a: RaiseForm['axes'][number]) => patch({ axes: has(a) ? f.axes.filter((x) => x !== a) : [...f.axes, a] });
  const pickOps = (o: (typeof OPS)[number][0]) => patch({ ops: o, opsHours: o === 'tidak' ? null : (f.opsHours ?? 2), ongoing: o === 'tidak' ? false : f.ongoing });
  const jl = jenisOf(f.category);
  const hoursLabel = f.ops === 'berhenti' ? 'Berapa lama operasi berhenti?' : 'Berapa lama operasi terganggu?';
  const recorded = k.recordedAt ?? k.observedAt;
  const grup = f.picKind === 'grup';

  const submit = () => {
    if (Object.keys(errors).length) {
      setTried(true);
      return;
    }
    const r = onSubmit(f);
    if (r) {
      setServerError(r);
      setTried(true);
    }
  };

  return (
    <KerawananShell
      form title={c.title} tag={<span className="p-tag t-draft">Belum disimpan</span>}
      back={{ onClick: onCancel, label: 'Kembali ke kerawanan' }}
      crumbs={[
        { label: 'Insiden', to: '/insiden' }, { label: 'Kerawanan', to: '/insiden?tab=kerawanan' },
        { label: k.no, onClick: onCancel }, { label: c.title },
      ]}
    >
      <div className="lk-grid">
        <div className="c8 lk-stack">
          {serverError && (
            <div className="in-bn err" role="alert">
              <Icon name="warn" size={18} />
              <div className="body">{serverError}</div>
            </div>
          )}
          <section className="p-card in-sec">
            <div className="lk-card-head" style={{ marginBottom: 0 }}>
              <h2 className="in-h">Dari kerawanan <span className="p-mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)' }}>{k.no}</span></h2>
              <span className="lk-lock" style={{ fontSize: 12 }}><Ic d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" size={14} />Disalin</span>
            </div>
            <div className="in-bn info sm"><Icon name="info" size={16} /><span>{c.copied}</span></div>
            <dl className="lk-kv1">
              <dt>Judul</dt><dd>{k.title}</dd>
              <dt>Waktu kejadian</dt>
              <dd>{formatWib(k.observedAt)} <span className="p-tz">WIB</span><div className="p-cap">Dari Waktu diketahui di kerawanan</div></dd>
              <dt>Lokasi</dt>
              <dd>
                {k.location}{k.lat != null && k.lng != null ? ` · ${k.lat}, ${k.lng}` : ''}
                <div className="p-cap">{k.area}{k.patokan ? ` · patokan: ${k.patokan.replace(/^.*?,\s*/, '')}` : ''}</div>
              </dd>
              <dt>Kondisi yang ditemukan</dt><dd style={{ fontWeight: 400 }}>{k.story ?? 'Belum ada penjelasan.'}</dd>
              {(k.attachments ?? []).length > 0 && (
                <>
                  <dt>Lampiran</dt>
                  <dd>{(k.attachments ?? []).map((a) => <div key={a.name}>{a.name} <span className="p-cap">· {formatSize(a.sizeKb)}</span></div>)}</dd>
                </>
              )}
              <dt>Sumber informasi</dt><dd>{k.source ?? '—'} · dilaporkan {k.reporter}</dd>
            </dl>
          </section>

          <section className="p-card in-sec">
            <h2 className="in-h">Jenis kejadian</h2>
            <div className="lk-f2">
              <div className="p-field in-cbx" ref={katRef}>
                <Lbl req>Kategori insiden</Lbl>
                <button
                  type="button" className={'p-input' + (show('category') ? ' err' : '')} aria-haspopup="listbox" aria-expanded={katOpen} aria-label="Kategori insiden"
                  onClick={() => setKatOpen(!katOpen)} style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', border: 0, width: '100%' }}
                >
                  <span className={f.category ? '' : 'ph'} style={{ flex: 1 }}>{f.category ?? 'Pilih kategori'}</span>
                  <Icon name="chevDown" size={16} />
                </button>
                <span className="p-help">{c.katHelp}</span>
                <FieldError text={show('category')} />
                {katOpen && (
                  <div className="in-pop" role="listbox" aria-label="Kategori insiden" style={{ top: 70, width: 380, right: 'auto' }}>
                    <div className="grp">Kategori insiden · {KAT.length} pilihan</div>
                    {KAT.map(([key, l, d]) => (
                      <button
                        key={key} type="button" role="option" className={f.category === l ? 'op on' : 'op'} aria-selected={f.category === l}
                        onClick={() => { patch({ category: l }); setKatOpen(false); }} style={{ minHeight: 48 }}
                      >
                        <span className="t"><b>{l}</b><span>{d}</span></span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {jl.length > 0 && (
              <div className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
                <span className="p-input"><span className="ph" style={{ flex: 1 }}>{jl.length ? 'Pilih jenis' : 'Tidak ada jenis untuk kategori ini'}</span><Icon name="chevDown" size={16} /></span>
              </div>
              )}
            </div>
          </section>

          <section className="p-card in-sec">
            <h2 className="in-h">Dampak</h2>
            <div className="p-field">
              <Lbl req>Dampak keamanan</Lbl>
              <textarea
                className={'p-input p-area' + (show('securityImpact') ? ' err' : '')} aria-label="Dampak keamanan" maxLength={MAX_DAMPAK}
                style={{ minHeight: 72 }} value={f.securityImpact} onChange={(e) => patch({ securityImpact: e.target.value })}
              />
              <span className="p-help row"><span>Apa yang hilang, rusak, atau terbuka.</span><span>{f.securityImpact.length}/{MAX_DAMPAK}</span></span>
              <FieldError text={show('securityImpact')} />
            </div>
            <div className="p-field">
              <Lbl req>Apa saja yang terdampak?</Lbl>
              <div className="in-chips" role="group" aria-label="Yang terdampak">
                {AXES.map(([key, l]) => (
                  <button key={key} type="button" className="p-chip" aria-pressed={has(key)} onClick={() => toggleAxis(key)}>{l}</button>
                ))}
              </div>
              <span className="p-help">Boleh lebih dari satu.</span>
              <FieldError text={show('axes')} />
            </div>

            {has('prop') && (
              <>
                <Divider />
                <Group t="Properti dan operasi" />
                <div className="p-field">
                  <span className="p-lbl" style={{ color: 'var(--ink)' }}>Perkiraan kerugian <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
                  <span className="p-input" style={{ maxWidth: 320 }}>
                    <span className="affix">Rp</span>
                    <input
                      className="num" style={{ ...bareInput, textAlign: 'right' }} inputMode="numeric" aria-label="Perkiraan kerugian" placeholder="0"
                      value={f.lossIdr ? formatNumber(f.lossIdr) : ''}
                      onChange={(e) => { const d = digits(e.target.value).slice(0, 15); patch({ lossIdr: d ? Number(d) : null }); }}
                    />
                  </span>
                  <span className="p-help">Dalam Rupiah. Dipakai untuk saran keparahan.</span>
                </div>
                <div className="p-field">
                  <Lbl req>Kondisi operasi</Lbl>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div className="in-chips" role="radiogroup" aria-label="Kondisi operasi">
                      {OPS.map(([key, l]) => (
                        <button key={key} type="button" role="radio" className="p-chip" aria-pressed={f.ops === key} aria-checked={f.ops === key} onClick={() => pickOps(key)}>{l}</button>
                      ))}
                    </div>
                    {f.ops && f.ops !== 'tidak' && (
                      <div style={{ flexBasis: '100%', display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-subtle)' }}>
                        <Lbl req>{hoursLabel}</Lbl>
                        <span className={'p-input' + (show('opsHours') ? ' err' : '')} style={{ width: 140 }}>
                          <input
                            className="num" style={{ ...bareInput, textAlign: 'right', flex: 1 }} inputMode="numeric" aria-label={hoursLabel} placeholder="—"
                            value={f.opsHours ?? ''}
                            onChange={(e) => { const d = digits(e.target.value).slice(0, 4); patch({ opsHours: d ? Number(d) : null }); }}
                          />
                          <span className="affix">jam</span>
                        </span>
                        <span className="p-help">Dari mulai terganggu sampai pulih. Perkiraan boleh.</span>
                        <FieldError text={show('opsHours')} />
                      </div>
                    )}
                  </div>
                  <FieldError text={show('ops')} />
                </div>
              </>
            )}

            {has('man') && (
              <>
                <Divider />
                <Group t="Manusia" />
                <div className="p-field">
                  <Lbl req>Kondisi korban</Lbl>
                  <div className="in-chips" role="group" aria-label="Kondisi korban" style={{ flexWrap: 'wrap' }}>
                    {KB.map(([key, l]) => (
                      <button key={key} type="button" className="p-chip" aria-pressed={key in f.casualties} onClick={() => patch({ casualties: toggleCasualty(f.casualties, key) })}>{l}</button>
                    ))}
                  </div>
                  <span className="p-help">Boleh lebih dari satu. Belum diketahui tidak bisa digabung dengan pilihan lain.</span>
                  <FieldError text={show('casualties')} />
                </div>
              </>
            )}

            {has('ling') && (
              <>
                <Divider />
                <Group t="Lingkungan pengamanan" />
                <div className="p-field">
                  <Lbl req>Sebaran dampak</Lbl>
                  <div className="in-chips" role="radiogroup" aria-label="Sebaran dampak">
                    {SEBARAN.map((l) => (
                      <button key={l} type="button" role="radio" className="p-chip" aria-pressed={f.envNote === l} onClick={() => patch({ envNote: l })}>{l}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {has('data') && (
              <>
                <Divider />
                <Group t="Data dan informasi" />
                <div className="p-field">
                  <Lbl req>Seberapa besar data yang dicuri atau bocor?</Lbl>
                  <div className="in-chips" role="radiogroup" aria-label="Data dan informasi">
                    {DATA_OPTS.map((l) => (
                      <button key={l} type="button" role="radio" className="p-chip" aria-pressed={f.dataNote === l} onClick={() => patch({ dataNote: l })}>{l}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="p-card in-sec">
            <h2 className="in-h">Seberapa parah?</h2>
            <div className="in-sevauto">
              <div className="r1">
                <span className={'p-tag ' + SEV_TAG_CLS[level]}><span className="dot"></span>{SEV_LABEL[level]}</span>
                <span className={differs ? 'p-tag t-caution' : 'p-tag t-info'} style={{ height: 20, fontSize: 11 }}>{differs ? c.diffBy : 'Otomatis'}</span>
                <span style={{ flex: 1 }}></span>
                <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => setSevEdit(!sevEdit)}>{sevEdit ? 'Selesai' : 'Ubah'}</button>
              </div>
              <span className="p-cap">{parts.length ? `Dari dampak: ${parts.join(', ')}.` : 'Pilih apa saja yang terdampak dulu.'}</span>
            </div>
            {sevEdit && (
              <div className="in-seg5" role="radiogroup" aria-label="Keparahan" style={{ marginTop: 10 }}>
                {SEVERITIES.map((s: Severity) => (
                  <button key={s} type="button" role="radio" aria-checked={level === s} onClick={() => patch({ severity: s, sevManual: s !== suggested })}>
                    <i style={{ background: SEV_DOT[s] }}></i>{SEV_LABEL[s]}<span className="s">{s === suggested ? '· saran' : ''}</span>
                  </button>
                ))}
              </div>
            )}
            {differs && (
              <div className="p-field" style={{ marginTop: 12 }}>
                <Lbl req>Kenapa berbeda dari saran?</Lbl>
                <textarea
                  className={'p-input p-area' + (show('severityReason') ? ' err' : '')} aria-label="Kenapa berbeda dari saran?" maxLength={MAX_ALASAN}
                  style={{ minHeight: 64 }} placeholder="mis. Kabel panel yang hilang jalur utama pompa, kerugian sebenarnya lebih besar."
                  value={f.severityReason} onChange={(e) => patch({ severityReason: e.target.value })}
                />
                <span className="p-help row"><span>{c.diffHelp}</span><span>{f.severityReason.length}/{MAX_ALASAN}</span></span>
                <FieldError text={show('severityReason')} />
              </div>
            )}
            {isHighOrCritical(level) ? (
              <div className="in-bn caution" style={{ marginTop: 12 }}>
                <Icon name="bell" size={18} />
                <div className="body"><b>SKK Migas langsung diberi tahu</b> {c.skk}</div>
              </div>
            ) : (
              <span className="p-cap">SKK Migas langsung diberi tahu hanya bila Tinggi atau Kritis.</span>
            )}
          </section>

          {mode === 'raise' && (
            <section className="p-card in-sec">
              <h2 className="in-h">Siapa yang menangani?</h2>
              <div className="p-field">
                <div className="in-pic-hd">
                  <Lbl req>PIC penanganan</Lbl>
                  <div className="in-seg" role="radiogroup" aria-label="Jenis PIC">
                    <button type="button" role="radio" aria-checked={!grup} className={!grup ? 'on' : ''} onClick={() => patch({ picKind: 'perorangan' })}>Perorangan</button>
                    <button type="button" role="radio" aria-checked={grup} className={grup ? 'on' : ''} onClick={() => patch({ picKind: 'grup' })}>Grup</button>
                  </div>
                </div>
                {grup ? (
                  <SelectField
                    label={null} ariaLabel="PIC penanganan"
                    lead={<span className="lk-av grp" style={{ width: 24, height: 24 }}><Ic d={P.group} size={14} /></span>}
                    display={(() => { const g = PIC_GROUPS.find((x) => x.name === f.group) ?? PIC_GROUPS[0]; return `${g.name} · ${g.caption}`; })()}
                    selected={f.group} onPick={(key) => patch({ group: key })} options={PIC_GROUPS.map((g) => ({ key: g.name, label: g.name, caption: g.caption }))}
                    help={<span className="p-help">Anggota pertama yang mengambil alih menjadi PIC.</span>}
                  />
                ) : (
                  <SelectField
                    label={null} ariaLabel="PIC penanganan"
                    lead={<span className="lk-av" style={{ width: 24, height: 24, fontSize: 10 }}>{initials(f.person)}</span>}
                    display={(() => { const p = PIC_PEOPLE.find((x) => x.name === f.person) ?? PIC_PEOPLE[0]; return `${p.name} · ${p.caption}`; })()}
                    selected={f.person} onPick={(key) => patch({ person: key })}
                    options={PIC_PEOPLE.map((p) => ({ key: p.name, label: p.name, caption: p.caption, lead: <span className="lk-av" style={{ width: 24, height: 24, fontSize: 10 }}>{initials(p.name)}</span> }))}
                    help={<span className="p-help">Pengguna dengan cakupan {k.wk}.</span>}
                  />
                )}
                <FieldError text={show('pic')} />
              </div>
            </section>
          )}

          <section className="p-card in-sec">
            <h2 className="in-h">{c.reasonH}</h2>
            <div className="p-field">
              <Lbl req>{c.reasonQ}</Lbl>
              <textarea
                className={'p-input p-area' + (show('reason') ? ' err' : '')} aria-label={c.reasonQ} maxLength={MAX_RAISE_REASON}
                style={{ minHeight: 88 }} value={f.reason} onChange={(e) => patch({ reason: e.target.value })}
              />
              <span className="p-help row"><span>Minimal 10 karakter.</span><span>{f.reason.length}/{MAX_RAISE_REASON}</span></span>
              <FieldError text={show('reason')} />
            </div>
          </section>
        </div>

        <aside className="c4 lk-stack">
          <section className="p-card">
            <div className="lk-card-head" style={{ marginBottom: 12 }}><h2 className="p-h2">Yang terjadi setelah ini</h2></div>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, lineHeight: '19px' }}>
              {(mode === 'raise'
                ? [
                    <>Jadi insiden <span className="p-mono" style={{ fontSize: 12 }}>{nextNo}</span>, langsung <b>Dalam penanganan</b>.</>,
                    <>{grup ? f.group : f.person} dan pelapor diberi tahu.</>,
                    <>Tenggat dihitung dari keparahan <b>{SEV_LABEL[level]}</b>.</>,
                    <>Bila Tinggi atau Kritis, SKK Migas langsung diberi tahu.</>,
                    <>Pindah ke tab Insiden. <span className="p-mono" style={{ fontSize: 12 }}>{k.no}</span> tetap tercatat sebagai asal.</>,
                  ]
                : [
                    <>Jadi insiden <span className="p-mono" style={{ fontSize: 12 }}>{nextNo}</span>, menunggu pemeriksaan Pejabat Berwenang.</>,
                    <>Pejabat menetapkan keparahan resmi dan PIC.</>,
                    <>Bila Tinggi atau Kritis, SKK Migas langsung diberi tahu.</>,
                    <>Pindah ke tab Insiden. <span className="p-mono" style={{ fontSize: 12 }}>{k.no}</span> tetap tercatat sebagai asal.</>,
                  ]
              ).map((t, i) => (
                <li key={i} style={{ display: 'flex', gap: 10 }}>
                  <span className="p-count" style={{ background: 'var(--surface-sunken)', color: 'var(--ink)', flex: 'none' }}>{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="p-card">
            <div className="lk-card-head" style={{ marginBottom: 12 }}><h2 className="p-h2">Asal laporan</h2></div>
            <dl className="lk-kv1">
              <dt>Kerawanan</dt><dd><a href="#" className="p-mono" style={{ fontSize: 12 }} onClick={(e) => { e.preventDefault(); onCancel(); }}>{k.no}</a></dd>
              <dt>Jenis kerawanan</dt><dd>{k.kind}</dd>
              <dt>Tercatat</dt><dd>{formatWib(recorded)} <span className="p-tz">WIB</span></dd>
              <dt>Dilaporkan oleh</dt><dd>{k.reporter}</dd>
            </dl>
          </section>
          {mode === 'submit' && (
            <section className="p-card in-sec"><ReviewerSelect options={reviewerOptions('Budi Santoso')} value={rev} onChange={setRev} /></section>
          )}
          <div className="p-note" style={{ alignItems: 'flex-start' }}>
            <Icon name="info" size={16} style={{ flex: 'none', marginTop: 1 }} />
            <span>{c.note}</span>
          </div>
        </aside>
      </div>
      <div className="lk-ffoot" role="region" aria-label="Aksi formulir" style={{ margin: '0 -24px' }}>
        <button type="button" className="p-btn p-btn-secondary" onClick={onCancel}>Batal</button>
        <button type="button" className="p-btn p-btn-primary" onClick={submit}>{c.submit}</button>
      </div>
    </KerawananShell>
  );
}

