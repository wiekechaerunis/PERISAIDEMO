// Jam demo tunggal (B7): semua logika demo membaca `demoNow()`, bukan jam browser. Awal 28 Okt 2026 13:00 WIB; maju saat aksi demo.
export const DEMO_START = '2026-10-28T13:00:00';
let current = DEMO_START;

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (ms: number) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

/** Waktu demo sekarang (ISO lokal WIB tanpa zona). */
export const demoNow = (): string => current;
/** Maju `minutes` menit (aksi demo yang berhasil). */
export const advanceDemo = (minutes: number): string => {
  current = fmt(new Date(current + 'Z').getTime() + minutes * 60_000);
  return current;
};
export const setDemoNow = (iso: string) => { current = iso; };
export const resetDemoClock = () => { current = DEMO_START; };
