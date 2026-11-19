import '@testing-library/jest-dom/vitest';

// jsdom tidak punya matchMedia; tes mobile memakai setForceMobile(true) dari src/mobile/useIsMobile.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (q: string) =>
    ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }) as MediaQueryList;
}
