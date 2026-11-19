// Banner eskalasi (atas) dan kartu "Eskalasi" (kolom kanan) pada detail SKK (board P31, PS1).
import { formatWibFull } from '@/lib/format';
import { SIc } from './icons';
import type { EscalationInfo } from './skkLogic';

/** Banner di atas isi: eskalasi manual ke SKK (P31) atau eskalasi otomatis karena lewat tenggat (PS1). */
export function EscalationBanner({ e }: { e: EscalationInfo }) {
  return (
    <div className="in-bn caution sm" style={{ alignSelf: 'stretch' }}>
      <SIc d="warn" />
      <div className="body">
        {e.auto ? (
          <><b>Tenggat penanganan terlewat.</b> Insiden dieskalasi otomatis ke {e.to}.{e.reason && ` ${e.reason}`}</>
        ) : (
          <><b>{e.by} mengeskalasi insiden ini ke {e.toSkk ? 'Anda' : e.to}.</b>{e.reason && ` "${e.reason}"`}</>
        )}
      </div>
    </div>
  );
}

export function EscalationCard({ e }: { e: EscalationInfo }) {
  const role = e.toSkk ? ' · Pengawas SKK' : e.auto ? ' · otomatis' : '';
  return (
    <section className="p-card in-sec" style={{ gap: 10 }}>
      <div className="lk-card-head" style={{ marginBottom: 0 }}>
        <h2 className="in-h">Eskalasi</h2>
        <span className="p-tag t-caution">Dieskalasi</span>
      </div>
      <ol className="p-tl" aria-label="Riwayat eskalasi">
        <li>
          <span className="nd warn" aria-hidden="true"><SIc d="up" size={11} /></span>
          <div>
            <div className="hd"><b>Ke {e.to}{role}</b></div>
            <div className="dt">{e.auto ? 'Tenggat terlewat' : `Manual oleh ${e.by}`}</div>
            <div className="tm">{formatWibFull(e.at)}</div>
          </div>
        </li>
      </ol>
    </section>
  );
}
