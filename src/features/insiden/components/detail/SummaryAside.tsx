// Kartu "Ringkasan" kolom kanan. Varian: Pelapor (I15), WhatsApp (I23), SKK (I32), resmi setelah pemeriksaan (V14).
// B-19: Keparahan + keterangan + alasan, Waktu kejadian, Waktu registrasi, Batas pemeriksaan, Diperiksa oleh (nama + menunggu sejak), PIC.
// "Sudah menangani" dan "Pelapor" hanya di kartu utama.
import type { ReactNode } from 'react';
import type { Incident } from '@/services/types';
import { SEV_LABEL, SEV_TAG_CLS, isHighOrCritical, type Severity } from '@/lib/severity';
import { formatWibFull } from '@/lib/format';
import { InfoTip } from './InfoTip';
import { detailOf, formatDuration, registeredAt, submittedEntry, verifiedEntry, addMinutes, wkShort } from './detailLogic';
import { useWaSource } from '@/features/whatsapp/logic/source';
import { PEJABAT_NAMES } from '@/lib/rbac';

export type SummaryVariant = 'pelapor' | 'wa' | 'skk' | 'resmi';
const SEV_LABEL_PRIORITY = { tinggi: 'Tinggi', normal: 'Normal', rendah: 'Rendah' } as const;

export function SevTag({ sev }: { sev: Severity }) {
  return (
    <span className={`p-tag ${SEV_TAG_CLS[sev]}`}>
      <span className="dot"></span>
      {SEV_LABEL[sev]}
    </span>
  );
}

const TIP = {
  kejadian: 'Kapan kejadian terjadi menurut pelapor.',
  registrasi: 'Waktu insiden diajukan dan resmi tercatat. Batas penanganan dihitung dari sini.',
  pemeriksaan: 'Dihitung dari waktu registrasi sesuai aturan alur insiden.',
  disetujui: 'Waktu insiden disetujui dan menjadi data resmi.',
  pertama: 'Waktu pesan pertama tentang kejadian ini masuk di grup WhatsApp. Diisi otomatis.',
};

function Row({ k, tip, children }: { k: string; tip?: ReactNode; children: ReactNode }) {
  return (
    <div className="row">
      <span className="k">{k}{tip}</span>
      {children}
    </div>
  );
}

export function variantOf(i: Incident, isSkkRole: boolean): SummaryVariant {
  if (['dalam-penanganan', 'minta-ditutup', 'ditutup'].includes(i.status)) return 'resmi';
  if (isSkkRole) return 'skk';
  if (i.source === 'wa') return 'wa';
  return 'pelapor';
}

export function SummaryAside({ incident: i, variant, openTip }: { incident: Incident; variant: SummaryVariant; openTip?: boolean }) {
  const WA_SOURCE = useWaSource(i);
  const d = detailOf(i);
  const sev = i.severity;
  const reg = registeredAt(i);
  const submitted = !!submittedEntry(i) && i.status !== 'draf';
  const kejadian = (
    <Row k="Waktu kejadian" tip={<InfoTip label="waktu kejadian" text={TIP.kejadian} />}>
      <span className="v">{formatWibFull(i.occurredAt)}</span>
    </Row>
  );
  const registrasi = (cap?: string, defaultOpen?: boolean) =>
    submitted && (
      <Row k="Waktu registrasi" tip={<InfoTip label="waktu registrasi" text={TIP.registrasi} right defaultOpen={defaultOpen} />}>
        <span className="v">{formatWibFull(reg)}</span>
        {cap && <span className="c">{cap}</span>}
      </Row>
    );
  const sinceEvent = `${formatDuration(i.occurredAt, reg)} setelah kejadian`;

  let rows: ReactNode;
  let dl: ReactNode;
  if (variant === 'resmi') {
    const ver = verifiedEntry(i);
    rows = (
      <>
        <Row k="Keparahan">
          {sev ? (
            <span className="v" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <SevTag sev={sev} />
              <span className="c">resmi{d.reporterSeverity ? ` · awal ${SEV_LABEL[d.reporterSeverity]}` : ''}</span>
            </span>
          ) : (
            <span className="v">Belum ditentukan</span>
          )}
          {i.officialSeverityReason && <span className="c">Alasan: {i.officialSeverityReason}</span>}
        </Row>
        <Row k="Klasifikasi">
          <span className="v">{i.category}</span>
          {i.priority && <span className="c">Prioritas {SEV_LABEL_PRIORITY[i.priority]}</span>}
        </Row>
        {registrasi()}
        {ver && (
          <Row k="Disetujui" tip={<InfoTip label="disetujui" text={TIP.disetujui} right />}>
            <span className="v">{formatWibFull(ver.at)}</span>
            <span className="c">{formatDuration(reg, ver.at)} setelah registrasi · {ver.by}</span>
          </Row>
        )}
      </>
    );
    dl = (
      <>
        <dt>PIC</dt><dd>{i.pic ?? <span style={{ color: 'var(--ink-muted)' }}>Belum ditunjuk</span>}</dd>
      </>
    );
  } else if (variant === 'wa') {
    rows = (
      <>
        {kejadian}
        <Row k="Pertama dilaporkan" tip={<InfoTip label="pertama dilaporkan" text={TIP.pertama} right />}>
          <span className="v">{formatWibFull(WA_SOURCE.at)}</span>
        </Row>
        {registrasi(`${formatDuration(WA_SOURCE.at, reg)} setelah pesan pertama`)}
      </>
    );
    dl = (
      <>
        <dt>Keparahan</dt><dd>{sev ? <SevTag sev={sev} /> : 'Belum ditentukan'}</dd>
      </>
    );
  } else if (variant === 'skk') {
    rows = (
      <>
        <Row k="Keparahan">
          {sev ? (
            <span className="v" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <SevTag sev={sev} />
              <span className="c">menurut pelapor</span>
            </span>
          ) : (
            <span className="v">Belum ditentukan</span>
          )}
        </Row>
        {kejadian}
        {registrasi(sinceEvent)}
        {submitted && isHighOrCritical(sev) && (
          <Row k="Anda diberi tahu">
            <span className="v">{formatWibFull(addMinutes(reg, 1))}</span>
            <span className="c">Dikirim langsung · lonceng dan email</span>
          </Row>
        )}
      </>
    );
    dl = (
      <>
        <dt>WK</dt><dd>{wkShort(i.wk)}</dd>
      </>
    );
  } else {
    const diff = d.reporterSeverity && d.suggestedSeverity && d.reporterSeverity !== d.suggestedSeverity;
    const cap =
      i.status === 'review-internal'
        ? diff && d.suggestedSeverity
          ? `menurut pelapor · saran sistem ${SEV_LABEL[d.suggestedSeverity]} · belum diperiksa`
          : 'saran dari dampak · belum diperiksa'
        : 'menurut pelapor';
    rows = (
      <>
        <Row k="Keparahan">
          {sev ? (
            <span className="v" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <SevTag sev={sev} />
              <span className="c">{cap}</span>
            </span>
          ) : (
            <span className="v">Belum ditentukan</span>
          )}
          {d.severityReason && <span className="c">Alasan pelapor: {d.severityReason}</span>}
        </Row>
        {kejadian}
        {registrasi(sinceEvent, openTip)}
        {i.status === 'review-internal' && i.verifyDueAt && (
          <Row k="Batas pemeriksaan" tip={<InfoTip label="batas pemeriksaan" text={TIP.pemeriksaan} right />}>
            <span className="v">{formatWibFull(i.verifyDueAt)}</span>
          </Row>
        )}
        {i.status === 'review-internal' && submitted && (
          <Row k="Diperiksa oleh">
            <span className="v">{(i.reviewers && i.reviewers.length ? i.reviewers : PEJABAT_NAMES).join(', ')}</span>
            <span className="c">menunggu sejak {formatWibFull(reg)}</span>
          </Row>
        )}
      </>
    );
    dl = (
      <>
        <dt>PIC</dt><dd style={i.pic ? undefined : { color: 'var(--ink-muted)' }}>{i.pic ?? 'Ditunjuk saat pemeriksaan'}</dd>
      </>
    );
  }
  return (
    <section className="p-card in-sec">
      <h2 className="in-h">Ringkasan</h2>
      <div className="in-times">{rows}</div>
      <div className="lk-divider" style={{ margin: 0 }}></div>
      <dl className="lk-kv1" style={{ gridTemplateColumns: '110px minmax(0, 1fr)' }}>{dl}</dl>
    </section>
  );
}

