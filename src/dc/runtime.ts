/* eslint-disable @typescript-eslint/no-explicit-any */
// Pengganti ringan runtime canvas desain (DCLogic): kelas dengan `props`, `state`, `setState`, dan `renderVals()`.
// Skrip desain dipindah apa adanya; hook `useDC` menjalankannya di React.
import { useReducer, useRef } from 'react';

export class DCLogic {
  props: any;
  state: any = {};
  _notify: (() => void) | null = null;
  constructor(p?: any) {
    this.props = p ?? {};
  }
  setState(patch: any) {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...next };
    this._notify?.();
  }
  renderVals(): any {
    return {};
  }
}

export function useDC<T extends DCLogic>(Cls: new (p?: any) => T, props: any): any {
  const [, force] = useReducer((n: number) => n + 1, 0);
  const ref = useRef<T | null>(null);
  if (!ref.current) {
    // salinan props: konstruktor desain boleh memutasi props
    ref.current = new Cls({ ...props });
    ref.current._notify = force;
  }
  ref.current.props = { ...props };
  return ref.current.renderVals();
}
