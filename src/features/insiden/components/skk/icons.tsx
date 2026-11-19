/** Ikon inline dengan path persis board SKK (P31, P35, P36). */
const PATHS = {
  up: 'M12 19V5M5 12l7-7 7 7',
  flag: 'M4 22V4M4 4h12l-2 4 2 4H4',
  pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  wa: 'M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.4A8.5 8.5 0 1 1 21 11.5z',
  clip: 'M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5',
  chev: 'm6 9 6 6 6-6',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  warn: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  check: 'M20 6 9 17l-5-5',
  close: 'M18 6 6 18M6 6l12 12',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-1',
  sys: 'M20 6 9 17l-5-5',
} as const;

export function SIc({ d, size = 16 }: { d: keyof typeof PATHS; size?: number }) {
  return (
    <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
      <path d={PATHS[d]} />
    </svg>
  );
}
