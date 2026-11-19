/** Ikon inline dengan path dari board (class `p-ic`, viewBox 24). */
export function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
      <path d={d} />
    </svg>
  );
}

export const P_INFO = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01';
export const P_INFO2 = 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5';
export const P_CHECK = 'M20 6 9 17l-5-5';
export const P_CLOCK = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2';
export const P_WARN = 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z';
