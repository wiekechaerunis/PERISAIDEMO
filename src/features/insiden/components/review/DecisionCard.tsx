// Kartu "Butuh keputusan pemeriksaan" (kolom kanan board V12). Mengisi ReviewForm; Setujui membuka dialog di halaman.
import type { Incident, Priority } from '@/services/types';
import { PIC_GROUPS, PIC_PEOPLE } from '@/services/mock/workflow';
import { formatWibFull } from '@/lib/format';
import { SEVERITIES, SEV_DOT, SEV_EQUIV, SEV_LABEL, type Severity } from '@/lib/severity';
import { initials } from '@/lib/rbac';
import { Icon } from '@/components/ui/Icon';
import { KAT, KAT_LAIN, MAX_LAIN, jenisOf } from '../step2Data';
import { MAX_REASON, severityChanged, severityHelp, type ReviewErrors, type ReviewForm, type DeadlineInfo } from '../../logic/review';
import { Ic, SelectField, SevDot } from './parts';

interface Props {
  incident: Incident;
  form: ReviewForm;
  onChange: (p: Partial<ReviewForm>) => void;
  /** batas pemeriksaan: ISO dan teks sisa/lewat */
  dueIso: string;
  deadline: DeadlineInfo;
  showErrors: boolean;
  errors: ReviewErrors;
  serverError?: string;
  /** Setujui dinonaktifkan (kemungkinan ganda belum diputuskan) */
  blocked: boolean;
  onApprove: () => void;
}

const PRIORITIES: [Priority, string][] = [['tinggi', 'Tinggi'], ['normal', 'Normal'], ['rendah', 'Rendah']];
const ERR_PATH = 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z';

export function DecisionCard({ incident: i, form: f, onChange, dueIso, deadline, showErrors, errors, serverError, blocked, onApprove }: Props) {
  const changed = severityChanged(f, i);
  const jl = jenisOf(f.category);
  const nErr = Object.keys(errors).length + (serverError ? 1 : 0);
  const err = showErrors && nErr > 0;
  const kasusBaru = f.category === KAT_LAIN;
  const grup = f.picKind === 'grup';
  const ph = kasusBaru ? 'mis. Drone terlihat dekat panel listrik; perlu penanganan lebih cepat.' : 'mis. Pompa kembali menyala setelah 30 menit; kerugian kecil.';
  return (
    <section className="p-card in-warn-card" style={{ padding: 20, background: 'color-mix(in srgb, var(--caution-bg) 45%, var(--surface))', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}>
      <div className="lk-card-head" style={{ marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="lk-acc-ic" style={{ background: 'var(--caution-bg)', color: 'var(--caution-ink)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}>
            <Ic d={ERR_PATH} size={15} />
          </span>
          <h2 className="p-h2">Butuh keputusan pemeriksaan</h2>
        </span>
      </div>
      {err ? (
        <div className="in-bn err" style={{ padding: '10px 12px', fontSize: 12, lineHeight: '17px' }}>
          <Ic d={ERR_PATH} size={16} />
          <div className="body" role="alert"><b>{nErr} isian perlu dilengkapi.</b></div>
        </div>
      ) : deadline.late ? (
        <span style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--caution-ink)' }}>
          <Ic d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2" size={14} />
          <span className="lk-dl">{deadline.text} · {formatWibFull(dueIso)}</span>
          <Tip />
        </span>
      ) : (
        <span className="p-cap" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Ic d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2" size={14} />
          Batas pemeriksaan {formatWibFull(dueIso)} · {deadline.text}
          <Tip />
        </span>
      )}
      <div className="lk-stack" style={{ marginTop: 16, gap: 16 }}>
        <div className="lk-f2" style={{ gap: 12 }}>
          <SelectField
            label={<span className="p-lbl" style={{ color: 'var(--ink)' }}>Kategori<span className="p-req">*</span></span>}
            ariaLabel="Kategori" display={f.category} group={`Kategori insiden · ${KAT.length} pilihan`} selected={f.category}
            options={KAT.map(([, l, d]) => ({ key: l, label: l, caption: d }))}
            onPick={(k) => onChange({ category: k, jenis: null })} popStyle={{ width: 380, right: 'auto' }}
          />
          {jl.length > 0 && (
          <SelectField
            label={<span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis</span>}
            ariaLabel="Jenis" disabled={!jl.length} placeholder={!jl.length || !f.jenis}
            display={!jl.length ? 'Tidak ada jenis untuk kategori ini' : (f.jenis ?? 'Pilih jenis')} group={`Jenis · ${f.category}`} selected={f.jenis}
            options={jl.map((l) => ({ key: l, label: l }))} onPick={(k) => onChange({ jenis: k })}
          />
          )}
        </div>
        {kasusBaru && (
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Sebutkan kategori<span className="p-req">*</span></span>
            <span className={'p-input' + (err && errors.categoryOther ? ' err' : '')}>
              <input
                aria-label="Sebutkan kategori" maxLength={MAX_LAIN} value={f.categoryOther} onChange={(e) => onChange({ categoryOther: e.target.value })}
                style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0, width: '100%' }}
              />
            </span>
            {err && errors.categoryOther && <span className="p-help err" role="alert"><Icon name="warn" size={14} />{errors.categoryOther}</span>}
          </div>
        )}
        <SelectField
          label={<span className="p-lbl" style={{ color: 'var(--ink)' }}>Keparahan resmi<span className="p-req">*</span></span>}
          ariaLabel="Keparahan resmi" lead={<SevDot dot={SEV_DOT[f.severity]} />}
          display={<><b style={{ fontWeight: 600 }}>{SEV_LABEL[f.severity]}</b> <span className="p-cap">· setara {SEV_EQUIV[f.severity]}</span></>}
          selected={f.severity} onPick={(k) => onChange({ severity: k as Severity })}
          options={SEVERITIES.map((s) => ({ key: s, label: SEV_LABEL[s], caption: `Setara ${SEV_EQUIV[s]}`, lead: <SevDot dot={SEV_DOT[s]} /> }))}
          help={<span className="p-help">{severityHelp(i, (s) => SEV_EQUIV[s])}</span>}
        />
        {changed && (
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan perubahan keparahan<span className="p-req">*</span></span>
            <textarea
              className={'p-input p-area' + (err && errors.reason ? ' err' : '')} aria-label="Alasan perubahan keparahan" maxLength={MAX_REASON}
              placeholder={ph} value={f.reason} onChange={(e) => onChange({ reason: e.target.value })} style={{ minHeight: err && errors.reason ? 88 : 64 }}
            />
            {err && errors.reason ? (
              <span className="p-help err" role="alert"><Icon name="warn" size={14} />{errors.reason}</span>
            ) : (
              <span className="p-help row"><span>Keparahan awal dan resmi tampil berdampingan di Detail.</span><span>{f.reason.length}/{MAX_REASON}</span></span>
            )}
          </div>
        )}
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Prioritas<span className="p-req">*</span></span>
          <div className="in-chips">
            {PRIORITIES.map(([k, l]) => (
              <button key={k} type="button" className="p-chip" aria-pressed={f.priority === k} onClick={() => onChange({ priority: k })}>{l}</button>
            ))}
          </div>
          <span className="p-help">Hanya mengatur urutan antrean. Tenggat penanganan tetap dari keparahan.</span>
        </div>
        <div className="p-field">
          <div className="in-pic-hd">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>PIC penanganan<span className="p-req">*</span></span>
            <div className="in-seg" role="radiogroup" aria-label="Jenis PIC">
              <button type="button" role="radio" aria-checked={!grup} className={!grup ? 'on' : ''} onClick={() => onChange({ picKind: 'perorangan' })}>Perorangan</button>
              <button type="button" role="radio" aria-checked={grup} className={grup ? 'on' : ''} onClick={() => onChange({ picKind: 'grup' })}>Grup</button>
            </div>
          </div>
          {grup ? (
            <SelectField
              label={null} ariaLabel="PIC penanganan"
              lead={<span className="lk-av grp" style={{ width: 24, height: 24 }}><Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" size={14} /></span>}
              display={(() => { const g = PIC_GROUPS.find((x) => x.name === f.group) ?? PIC_GROUPS[0]; return `${g.name} · ${g.caption}`; })()}
              selected={f.group} onPick={(k) => onChange({ group: k })} options={PIC_GROUPS.map((g) => ({ key: g.name, label: g.name, caption: g.caption }))}
              help={<span className="p-help">Semua anggota diberi tahu. Anggota pertama yang mengambil alih menjadi PIC; anggota lain hanya bisa melihat.</span>}
            />
          ) : (
            <SelectField
              label={null} ariaLabel="PIC penanganan"
              lead={<span className="lk-av" style={{ width: 24, height: 24, fontSize: 10 }}>{initials(f.person)}</span>}
              display={(() => { const p = PIC_PEOPLE.find((x) => x.name === f.person) ?? PIC_PEOPLE[0]; return `${p.name} · ${p.caption}`; })()}
              selected={f.person} onPick={(k) => onChange({ person: k })}
              options={PIC_PEOPLE.map((p) => ({ key: p.name, label: p.name, caption: p.caption, lead: <span className="lk-av" style={{ width: 24, height: 24, fontSize: 10 }}>{initials(p.name)}</span> }))}
              help={<span className="p-help">Pilihan berisi pengguna yang cakupannya meliputi {i.wk}.</span>}
            />
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        <button
          type="button" className="p-btn p-btn-primary" aria-disabled={blocked} onClick={() => !blocked && onApprove()}
          style={blocked ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
        >
          Setujui
        </button>
      </div>
      <p className="p-cap" style={{ margin: '10px 0 0 0', textAlign: 'right' }}>Keputusan dicatat di jejak audit atas nama Anda.</p>
    </section>
  );
}

function Tip() {
  return (
    <span className="in-tw">
      <button type="button" className="ib" aria-label="Penjelasan batas pemeriksaan">
        <Ic d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5" size={14} />
      </button>
      <span className="in-tip" role="tooltip">Batas waktu pemeriksaan, dihitung dari waktu registrasi sesuai aturan alur insiden.</span>
    </span>
  );
}
