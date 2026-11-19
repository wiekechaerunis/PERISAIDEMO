import type { ReactNode } from 'react';
import type { EmailData } from './data';

export const FONT_SANS = "'IBM Plex Sans','Segoe UI',Arial,sans-serif";
export const FONT_MONO = "'IBM Plex Mono',Consolas,monospace";
const noNav = (e: { preventDefault: () => void }) => e.preventDefault();

/** Wordmark teks pengganti logo SKK Migas + PERISAI (/_blob/… tidak tersedia). Lihat ASSUMPTION email-logo. */
export function EmailHeader() {
  return (
    <>
      <div style={{ height: 80, padding: '0 40px', borderBottom: '1px solid #ecebe6', display: 'flex', alignItems: 'center', gap: 12, boxSizing: 'border-box' }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.4, color: '#5e5b55' }}>SKK Migas</span>
        <span aria-hidden="true" style={{ width: 1, height: 34, background: '#e4e2dd' }} />
        <span style={{ fontSize: 22, lineHeight: '30px', fontWeight: 700, letterSpacing: 1.5 }}>PERISAI</span>
      </div>
      <div aria-hidden="true" style={{ display: 'flex', height: 2 }}>
        <div style={{ flex: 4, background: '#ea292b' }} />
        <div style={{ flex: 1, background: '#bed630' }} />
      </div>
    </>
  );
}

export function EmailFooter() {
  return (
    <div style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, lineHeight: '16px', color: '#6b675f' }}>
      © 2026 SKK Migas. Hak cipta dilindungi.
    </div>
  );
}

export function EmailShell({ children }: { children: ReactNode }) {
  return (
    <div className="email-root" style={{ width: '100%', background: '#ffffff', fontFamily: FONT_SANS, color: '#1d1c1a' }}>
      <EmailHeader />
      <div style={{ padding: '24px 40px 40px 40px' }}>{children}</div>
      <EmailFooter />
    </div>
  );
}

export function EmailButton({ label, tautan }: { label: string; tautan: string }) {
  return (
    <>
      <a href="#" onClick={noNav} style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 24px', marginTop: 24, borderRadius: 6, background: '#1d1c1a', color: '#ffffff', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>{label}</a>
      <p style={{ margin: '16px 0 0 0', fontSize: 12, lineHeight: '16px', color: '#6b675f' }}>Jika tombol tidak berfungsi, salin tautan berikut ke browser:</p>
      <p style={{ margin: '4px 0 0 0', fontFamily: FONT_MONO, fontSize: 12, lineHeight: '16px', color: '#1d1c1a', textDecoration: 'underline' }}>{tautan}</p>
    </>
  );
}

export function EmailDivider() {
  return (
    <div aria-hidden="true" style={{ height: 64, display: 'flex', alignItems: 'center' }}>
      <div style={{ flex: 1, height: 1, background: '#ecebe6' }} />
    </div>
  );
}

export const AUTO_NOTE = 'Email ini dikirim otomatis oleh PERISAI. Jangan membalas email ini.';

/** Kerangka "EmailTemplate DS v1" (Email.dc.html). */
export function EmailTemplate({ e, catatan = AUTO_NOTE }: { e: EmailData; catatan?: string }) {
  return (
    <EmailShell>
      <h1 style={{ margin: 0, fontSize: 22, lineHeight: '30px', fontWeight: 600 }}>{e.judul}</h1>
      <p style={{ margin: '16px 0 0 0', fontSize: 15, lineHeight: '24px' }}>Halo {e.nama},</p>
      <p style={{ margin: '12px 0 0 0', fontSize: 15, lineHeight: '24px' }}>{e.konteks}</p>
      <dl style={{ margin: '24px 0 0 0', background: '#f7f6f3', borderRadius: 6, padding: '6px 20px' }}>
        {e.rows.map((r) => (
          <div key={r.k} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #e4e2dd' }}>
            <dt style={{ width: 120, flex: 'none', fontSize: 13, lineHeight: '20px', fontWeight: 500, color: '#5e5b55' }}>{r.k}</dt>
            <dd style={{ margin: 0, fontSize: 15, lineHeight: '22px', whiteSpace: 'pre-line' }}>{r.v}</dd>
          </div>
        ))}
      </dl>
      {e.tombol !== '' && <EmailButton label={e.tombol} tautan={e.tautan} />}
      <p style={{ margin: '24px 0 0 0', fontSize: 15, lineHeight: '24px' }}>{e.penutup}</p>
      <EmailDivider />
      <p style={{ margin: 0, fontSize: 12, lineHeight: '16px', color: '#6b675f' }}>{catatan}</p>
    </EmailShell>
  );
}

/** Kerangka tanpa data (Email.dc.html dengan nilai default board). */
export const TEMPLATE_DEFAULT: EmailData = {
  id: 'email', kode: 'Kerangka', judul: '[Judul hasil]', nama: '[nama pengguna]', konteks: '[konteks]',
  rows: [{ k: '[label]', v: '[nilai]' }], tombol: '[Aksi]', tautan: 'https://perisai.skkmigas.go.id/…',
  penutup: 'Notifikasi ini juga tampil di PERISAI.', penerima: 'Pengguna PERISAI', kategori: '-', dasar: 'Email.dc.html (EmailTemplate DS v1)',
};
