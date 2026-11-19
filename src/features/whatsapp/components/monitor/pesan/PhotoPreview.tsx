// Pratinjau lampiran foto pesan WhatsApp. Foto di prototype hanya berisi nama dan ukuran, jadi pratinjau menampilkan gambar contoh
// (SVG dibuat dari nama berkas) di dalam dialog, dengan navigasi antar-foto. Gambar contoh bukan foto asli.
import { useState } from 'react';
import type { WaPhoto } from '@/services/types';
import { V2Dialog } from '../nomor/V2Dialog';

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Foto dummy yang tersedia sebagai berkas (public/dummy-wa); nama lain memakai gambar contoh SVG. */
const REAL_PHOTOS: Record<string, string> = {
  'IMG-20261028-WA0044.jpg': '/dummy-wa/IMG-20261028-WA0044.webp',
  'IMG-20261028-WA0045.jpg': '/dummy-wa/IMG-20261028-WA0045.webp',
};
export const hasRealPhoto = (name: string) => name in REAL_PHOTOS;

/** Gambar contoh deterministik: langit, tanah, bangunan panel, dan sosok, berbeda per nama berkas. */
export function SamplePhoto({ name, size = 'lg' }: { name: string; size?: 'sm' | 'lg' }) {
  const real = REAL_PHOTOS[name];
  if (real) {
    return size === 'sm'
      ? <img src={real} alt={`Pratinjau ${name}`} width={120} height={90} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      : <img src={real} alt={`Pratinjau ${name}`} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 8, display: 'block', objectFit: 'contain' }} />;
  }
  const h = hash(name);
  const hue = 30 + (h % 40);
  const panelX = 40 + (h % 120);
  const w = size === 'lg' ? 640 : 120;
  return (
    <svg viewBox="0 0 320 220" width={w} height={(w * 220) / 320} role="img" aria-label={`Pratinjau ${name}`} style={{ borderRadius: 8, display: 'block', maxWidth: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id={`sky-${h}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={`hsl(${hue + 150} 35% 62%)`} /><stop offset="1" stopColor={`hsl(${hue} 45% 82%)`} /></linearGradient>
      </defs>
      <rect width="320" height="220" fill={`url(#sky-${h})`} />
      <rect y="150" width="320" height="70" fill={`hsl(${hue} 25% 38%)`} />
      <rect x={panelX} y="82" width="70" height="78" rx="3" fill="#6b7280" />
      <rect x={panelX + 6} y="90" width="58" height="34" rx="2" fill="#374151" />
      <path d={`M${panelX + 70} 140 q40 20 ${70 + (h % 40)} 30`} stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="6 5" />
      <circle cx={panelX - 28} cy="128" r="9" fill="#374151" />
      <rect x={panelX - 37} y="137" width="18" height="30" rx="6" fill="#4b5563" />
      <text x="10" y="210" fontSize="10" fill="rgba(255,255,255,.85)" fontFamily="monospace">{name}</text>
    </svg>
  );
}

interface Props {
  photos: WaPhoto[];
  startIndex: number;
  sender: string;
  at: string;
  onClose: () => void;
}

export function PhotoPreview({ photos, startIndex, sender, at, onClose }: Props) {
  const [i, setI] = useState(startIndex);
  const p = photos[i];
  const many = photos.length > 1;
  return (
    <V2Dialog
      title={p.name} subtitle={`${sender} · ${at} · ${p.sizeKb} KB`} size="lg" labelId="wa-photo" onClose={onClose}
      note={<span>{i + 1} dari {photos.length} foto{hasRealPhoto(p.name) ? '' : ' · pratinjau simulasi, bukan foto asli'}</span>}
      footer={
        <>
          {many && <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={() => setI((i - 1 + photos.length) % photos.length)}>Sebelumnya</button>}
          {many && <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={() => setI((i + 1) % photos.length)}>Berikutnya</button>}
          <button type="button" className="pr-btn pr-btn--primary pr-btn--md" onClick={onClose}>Tutup</button>
        </>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}><SamplePhoto name={p.name} /></div>
    </V2Dialog>
  );
}
