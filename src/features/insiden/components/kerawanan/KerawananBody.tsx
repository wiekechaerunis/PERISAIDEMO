// Board KD1 (+ hasil KD6): isi detail kerawanan berstatus Tercatat: kartu utama, Lampiran, Riwayat, Info.
import type { Kerawanan } from '@/services/types';
import { formatWibFull } from '@/lib/format';
import { Cap, Fact, FilesCard, MapLink, MetaChip, minutesBetween, P, TlItem } from './parts';

const MakinRawan = ({ small }: { small?: boolean }) => (
  <span className="p-tag t-caution" style={small ? { height: 20, fontSize: 11 } : undefined}>Makin rawan</span>
);

/** `k` sudah lewat `resolveKerawanan`. */
export function KerawananBody({ k }: { k: Kerawanan }) {
  const progress = [...(k.progress ?? [])].reverse();
  const files = k.attachments ?? [];
  const lag = minutesBetween(k.observedAt, k.recordedAt ?? k.observedAt);
  return (
    <div className="lk-grid">
      <div className="c8 lk-stack">
        <article className="p-card" aria-labelledby="krw-judul" style={{ padding: 0, overflow: 'hidden', fontSize: 13, lineHeight: '18px' }}>
          <header style={{ padding: '24px 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="p-mono" style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-muted)' }}>{k.no}</span>
            <h2 id="krw-judul" style={{ margin: 0, fontSize: 22, lineHeight: '30px', fontWeight: 700 }}>{k.title}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              <MetaChip d={P.warn}>Jenis: Kerawanan</MetaChip>
              <MetaChip d={P.tag}>Jenis kerawanan: {k.kind}</MetaChip>
              <MetaChip d={P.cal}>Diketahui {formatWibFull(k.observedAt)}</MetaChip>
              {k.worsening && <MakinRawan />}
            </div>
          </header>
          <div style={{ padding: '20px 24px 4px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h3 className="p-lbl" style={{ margin: 0 }}>Kondisi yang ditemukan</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: '22px' }}>{k.story ?? 'Belum ada penjelasan.'}</p>
          </div>
          <dl style={{ margin: '16px 24px 24px 24px', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 28px' }}>
            <Fact term="Lokasi">
              <span>{k.location}</span>
              <Cap>{k.area}</Cap>
              {k.lat != null && k.lng != null && <Cap mono>{`${k.lat}, ${k.lng}`}</Cap>}
              {k.lat != null && k.lng != null && <MapLink lat={k.lat} lng={k.lng} />}
            </Fact>
            <Fact term="Patokan"><span>{k.patokan ?? '—'}</span></Fact>
            <Fact term="Sumber informasi"><span>{k.source ?? '—'}</span></Fact>
            <Fact term="Dilaporkan oleh">
              <span>{k.reporter}</span>
              <Cap>Tercatat {formatWibFull(k.recordedAt ?? k.observedAt)}</Cap>
            </Fact>
          </dl>
        </article>
        {files.length > 0 && <FilesCard files={files} />}
        <section className="p-card in-sec">
          <h2 className="in-h">Riwayat</h2>
          <ol className="p-tl" aria-label="Riwayat kerawanan">
            {progress.map((p) => (
              <TlItem key={p.at + p.text} cls="nd now" icon={p.worsening ? P.warn : P.plus}>
                <div className="hd">
                  <b>Perkembangan</b>
                  {p.worsening && <> · <MakinRawan small /></>} · oleh {p.by}
                </div>
                <div className="dt">{p.text}</div>
                {p.photos && p.photos.length > 0 && <div className="dt">Foto: {p.photos.join(', ')}</div>}
                {p.worsening && <div className="dt">Pejabat Berwenang KKKS cakupan {k.wk} diberi tahu seketika.</div>}
                <div className="tm">{formatWibFull(p.at)}</div>
              </TlItem>
            ))}
            <TlItem cls={progress.length === 0 ? 'nd now' : 'nd'} icon={P.plus}>
              <div className="hd"><b>Tercatat</b> oleh {k.reporter}</div>
              <div className="dt">{lag} menit setelah diketahui</div>
              <div className="tm">{formatWibFull(k.recordedAt ?? k.observedAt)}</div>
            </TlItem>
          </ol>
        </section>
      </div>
      <aside className="c4 lk-stack">
        <section className="p-card in-sec">
          <h2 className="in-h">Info</h2>
          <dl className="lk-kv1">
            <dt>Nomor</dt><dd><span className="p-mono" style={{ fontSize: 12 }}>{k.no}</span></dd>
            {k.worsening && (
              <>
                <dt>Status</dt>
                <dd><MakinRawan /></dd>
              </>
            )}
            <dt>Dilaporkan oleh</dt><dd>{k.reporter}</dd>
            <dt>Pemeriksaan</dt><dd>Tidak perlu</dd>
            <dt>Dihitung sebagai insiden</dt><dd>Tidak</dd>
          </dl>
        </section>
      </aside>
    </div>
  );
}
