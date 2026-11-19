// Potongan visual AI Copilot (markup & class persis board I12): wajah, kerangka kartu, gelembung, ilustrasi kosong.
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

export function CopilotFace({ size = 19 }: { size?: number }) {
  return (
    <svg className="cp-face" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
      <rect x="1.5" y="4" width="21" height="16" rx="7" fill="#fff" stroke="var(--border-control)" strokeWidth="1.6" />
      <rect x="4.2" y="6.6" width="15.6" height="10.8" rx="5" fill="var(--ink)" />
      <path d="M7.6 12q1.3-1.6 2.6 0M13.8 12q1.3-1.6 2.6 0" stroke="var(--action)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M10.6 14.4q1.4 0.9 2.8 0" stroke="var(--action)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Kartu Copilot: header (wajah, judul, status, tombol mulai ulang) + isi + footer. */
export function CopilotFrame({
  status, onRestart, showRestart, children,
}: { status: string; onRestart?: () => void; showRestart?: boolean; children: ReactNode }) {
  return (
    <section className="p-card cp" aria-label="AI Copilot">
      <div className="cp-hd">
        <span className="av"><CopilotFace size={24} /></span>
        <div className="t"><b>AI Copilot</b><span>{status}</span></div>
        {showRestart && (
          <button type="button" className="p-ibtn ghost" style={{ width: 30, height: 30 }} aria-label="Mulai ulang percakapan" title="Mulai ulang percakapan" onClick={onRestart}>
            <Icon name="restart" size={15} />
          </button>
        )}
      </div>
      {children}
      <div className="cp-ft">Hanya saran yang Anda <b>Pakai</b> yang masuk ke form.</div>
    </section>
  );
}

export function AiMsg({ children, time }: { children: ReactNode; time?: string }) {
  return (
    <>
      <div className="cp-m">
        <span className="mi"><CopilotFace /></span>
        <div className="cp-b">{children}</div>
      </div>
      {time && <div className="cp-tm">{time}</div>}
    </>
  );
}

export function MeMsg({ children, time }: { children: ReactNode; time?: string }) {
  return (
    <>
      <div className="cp-m me"><div className="cp-b">{children}</div></div>
      {time && <div className="cp-tm">{time}</div>}
    </>
  );
}

export function QuickReplies({ items }: { items: { label: string; onClick: () => void; pressed?: boolean }[] }) {
  return (
    <div className="cp-qr" style={{ display: 'flex' }}>
      {items.map((i) => (
        <button
          key={i.label} type="button" onClick={i.onClick}
          {...(i.pressed === undefined ? {} : { 'aria-pressed': i.pressed, className: i.pressed ? 'on' : undefined })}
        >{i.label}</button>
      ))}
    </div>
  );
}

export function EmptyIllustration() {
  return (
    <div className="cp-empty">
      <svg className="cp-il" viewBox="0 0 260 160" role="img" aria-label="Ilustrasi asisten AI menulis laporan">
        <ellipse cx="132" cy="138" rx="96" ry="10" fill="var(--surface-sunken)" />
        <g className="doc">
          <rect x="160" y="50" width="78" height="92" rx="8" fill="var(--surface-sunken)" stroke="var(--border)" />
          <rect x="150" y="40" width="78" height="92" rx="8" fill="var(--surface)" stroke="var(--border-control)" strokeWidth="1.5" />
          <rect x="162" y="54" width="34" height="22" rx="4" fill="var(--action-subtle-bg)" />
          <path className="ln l1" d="M162 90h52" stroke="var(--border-control)" strokeWidth="4" strokeLinecap="round" />
          <path className="ln l2" d="M162 102h44" stroke="var(--border-control)" strokeWidth="4" strokeLinecap="round" />
          <path className="ln l3" d="M162 114h48" stroke="var(--border-control)" strokeWidth="4" strokeLinecap="round" />
          <path className="sig" d="M236 30l8-6M240 40h10M236 50l8 5" stroke="var(--action-line)" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g className="bot">
          <line x1="92" y1="32" x2="92" y2="41" stroke="var(--border-control)" strokeWidth="3" strokeLinecap="round" />
          <circle className="ant" cx="92" cy="28" r="5" fill="var(--action)" stroke="var(--action-line)" />
          <circle cx="62" cy="64" r="7" fill="var(--surface-sunken)" stroke="var(--border-control)" strokeWidth="1.5" />
          <circle cx="122" cy="64" r="7" fill="var(--surface-sunken)" stroke="var(--border-control)" strokeWidth="1.5" />
          <rect x="64" y="40" width="56" height="48" rx="20" fill="var(--surface)" stroke="var(--border-control)" strokeWidth="1.5" />
          <rect x="71" y="50" width="42" height="28" rx="12" fill="var(--ink)" />
          <path className="eye" d="M78 66q5-7 10 0" stroke="var(--action)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path className="eye" d="M96 66q5-7 10 0" stroke="var(--action)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M88 71q4 3 8 0" stroke="var(--action)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M76 98q-12 10-6 22" stroke="var(--border-control)" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M76 98q-12 10-6 22" stroke="var(--surface)" strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="70" y="90" width="44" height="40" rx="16" fill="var(--surface)" stroke="var(--border-control)" strokeWidth="1.5" />
          <path d="M92 104Q92 110 98 110Q92 110 92 116Q92 110 86 110Q92 110 92 104Z" fill="var(--action)" stroke="var(--action-line)" strokeWidth="1" />
          <g className="pen">
            <path d="M110 100q14 0 24 10" stroke="var(--border-control)" strokeWidth="9" fill="none" strokeLinecap="round" />
            <path d="M110 100q14 0 24 10" stroke="var(--surface)" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M134 116l14-30" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
            <path d="M134 116l2-5" stroke="var(--action)" strokeWidth="5" strokeLinecap="round" />
            <circle cx="134" cy="110" r="6" fill="var(--surface)" stroke="var(--border-control)" strokeWidth="1.5" />
          </g>
        </g>
        <path className="spk s1" d="M42 35Q42 44 51 44Q42 44 42 53Q42 44 33 44Q42 44 42 35Z" fill="var(--action)" stroke="var(--action-line)" />
        <path className="spk s2" d="M132 14Q132 20 138 20Q132 20 132 26Q132 20 126 20Q132 20 132 14Z" fill="var(--action-line)" />
        <path className="spk s3" d="M30 95Q30 100 35 100Q30 100 30 105Q30 100 25 100Q30 100 30 105Z" fill="var(--action-subtle-ink)" opacity=".6" />
      </svg>
      <h3>Ceritakan kejadianmu di sini</h3>
      <p>Kami bantu menganalisis laporanmu dan memberikan insight yang relevan.</p>
    </div>
  );
}

/** Titik mengetik (animasi inTyping, fallback prefers-reduced-motion ada di ins.css). */
export function TypingDots() {
  return (
    <span className="cp-ty" aria-label="AI Copilot sedang mengetik">
      <i></i><i></i><i></i>
    </span>
  );
}
