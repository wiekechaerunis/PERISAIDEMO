import { Fragment, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CATALOG, CATALOG_INTRO, CATALOG_NOTES, EMAILS } from './data';
import { EmailEK1, EK1_META } from './EmailEK1';
import { EmailTemplate, TEMPLATE_DEFAULT } from './EmailTemplate';

/** Teks catatan board memakai <b>…</b> untuk label tebal; dirender tanpa innerHTML. */
function Note({ text }: { text: string }) {
  const m = text.match(/^<b>(.*?)<\/b>(.*)$/s);
  return <li>{m ? <><b>{m[1]}</b>{m[2]}</> : text}</li>;
}

/** /dev/email: EmailKatalog.dc.html (INS-03 Tabel N-1). */
export function EmailCatalogPage() {
  return (
    <div className="em-page">
      <p><Link to="/dev/boards">Indeks board</Link> · <Link to="/insiden">Kembali ke aplikasi</Link> · Pratinjau saja, email tidak dikirim.</p>
      <div className="in-note" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="p-tag t-info" style={{ alignSelf: 'flex-start' }}>EmailTemplate DS v1 · email tetap gaya v1 (RSK-07)</span>
          <h2 style={{ margin: 0, fontSize: 22, lineHeight: '30px' }}>Katalog email Insiden</h2>
          <p className="p-cap" style={{ margin: 0, fontSize: 14, lineHeight: '20px' }}>{CATALOG_INTRO}</p>
        </div>
        <table className="p-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: 70 }}>Kode</th><th>Judul email</th><th style={{ width: 250 }}>Penerima</th>
              <th style={{ width: 120 }}>Kategori</th><th style={{ width: 260 }}>Dasar</th>
            </tr>
          </thead>
          <tbody>
            {CATALOG.map((r) => (
              <tr key={r.kode}>
                <td className="p-mono">{r.kode}</td>
                <td>
                  {r.id ? <Link to={`/dev/email/${r.id}`} data-testid={`row-${r.id}`}>{r.judul}</Link> : r.judul}
                  {r.catatan && <div className="p-cap">{r.catatan}</div>}
                </td>
                <td>{r.penerima}</td><td>{r.kategori}</td><td>{r.dasar}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul>{CATALOG_NOTES.map((n) => <Note key={n} text={n} />)}</ul>
      </div>
    </div>
  );
}

/** /dev/email/:id: pratinjau satu email dalam bingkai 600 (atau 390 untuk mobile). */
export function EmailPreviewPage() {
  const { id = '' } = useParams();
  const key = id.toLowerCase();
  const [mobile, setMobile] = useState(false);
  const isEk1 = key === 'ek1';
  const email = key === 'email' ? TEMPLATE_DEFAULT : EMAILS[key];
  const cat = CATALOG.find((r) => r.id === key);

  if (!email && !isEk1) {
    return (
      <div className="em-page">
        <h1 className="page-title">Email tidak ditemukan</h1>
        <p>Tidak ada board email dengan id <span className="data-id">{id}</span>.</p>
        <Link to="/dev/email">Kembali ke katalog email</Link>
      </div>
    );
  }

  const kepada = isEk1 ? EK1_META.kepada : `${email.nama} (${email.penerima})`;
  const perihal = isEk1 ? EK1_META.subjek : email.judul;
  const pemicu = isEk1
    ? [cat?.catatan, cat?.dasar].filter(Boolean).join(' · ')
    : `${cat?.kode ?? email.kode} · ${email.kategori} · ${email.dasar}`;
  const meta: [string, string][] = [['Kepada', kepada], ['Perihal', perihal], ['Pemicu', pemicu]];

  return (
    <div className="em-page">
      <p><Link to="/dev/email">← Kembali ke katalog email</Link></p>
      <dl className="em-meta" aria-label="Meta email">
        {meta.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
      </dl>
      <p>
        Lihat sebagai:{' '}
        <button type="button" className="p-btn" aria-pressed={!mobile} onClick={() => setMobile(false)}>Desktop 600</button>{' '}
        <button type="button" className="p-btn" aria-pressed={mobile} onClick={() => setMobile(true)}>Mobile 390</button>
        <span className="sub"> Pratinjau saja, email tidak dikirim.</span>
      </p>
      <div className="em-frame" style={{ width: mobile ? 390 : 600 }} data-testid="email-frame">
        {isEk1 ? <EmailEK1 /> : <EmailTemplate e={email} />}
      </div>
    </div>
  );
}
