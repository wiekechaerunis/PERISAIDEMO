import { create } from 'zustand';
import { advanceDemo, resetDemoClock } from './clock';
import { persist } from 'zustand/middleware';
import type { DemoState, Incident, Kerawanan, ModuleConfig, WaDraft } from '../types';
import type { ConfigResult } from './workflow.config';
import type { Role } from '@/lib/rbac';
import { seedState } from './seed';
import { seedFollowUps } from './seedFollowUps';
import { seedWaMessages } from './seedWa';
import { seedWaGroups, seedWaNumbers, seedWaRules } from './seedWaMon';
import type { DecisionResult } from './workflow';

/** Irisan state untuk `decide`: followUps selalu ada (transisi TL), slice WhatsApp tersedia untuk workflow.wa. */
type DecideSlice = Pick<DemoState, 'incidents' | 'kerawanan' | 'config' | 'followUps'> & Partial<Pick<DemoState, 'waMessages' | 'waDrafts'>>;

interface DemoStore extends DemoState {
  setRole: (r: Role) => void;
  addIncident: (i: Incident) => void;
  addKerawanan: (k: Kerawanan) => void;
  /** Jalankan transisi dari workflow*.ts; state hanya berubah bila hasilnya ok. */
  decide: (fn: (s: DecideSlice) => DecisionResult) => DecisionResult;
  /** Ubah satu draf WhatsApp (INS-05) tanpa transisi status; draf yang tidak ada diabaikan. */
  updateWaDraft: (id: string, fn: (d: WaDraft) => WaDraft) => void;
  /** Ubah slice Pemantauan WhatsApp v2 (pesan, nomor, grup, aturan, ketentuan) lewat fungsi murni. */
  updateWaMon: (fn: (s: Pick<DemoState, 'waMessages' | 'waNumbers' | 'waGroups' | 'waRules' | 'waTerms'>) => Partial<Pick<DemoState, 'waMessages' | 'waNumbers' | 'waGroups' | 'waRules' | 'waTerms'>>) => void;
  /** Terapkan perubahan Konfigurasi Modul (workflow.config.ts); state hanya berubah bila hasilnya ok. */
  applyConfig: (fn: (c: ModuleConfig) => ConfigResult) => ConfigResult;
  /** Kembalikan semua data demo ke seed awal. */
  resetDemo: () => void;
}

export const STORAGE_KEY = 'perisai-insiden-demo/v1';

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      ...seedState(),
      setRole: (role) => set({ role }),
      addIncident: (i) => set((s) => ({ incidents: [i, ...s.incidents.filter((x) => x.no !== i.no)] })),
      addKerawanan: (k) => set((s) => ({ kerawanan: [k, ...s.kerawanan] })),
      decide: (fn) => {
        const g = get();
        const r = fn({ incidents: g.incidents, kerawanan: g.kerawanan, config: g.config, followUps: g.followUps ?? [], waMessages: g.waMessages ?? [], waDrafts: g.waDrafts ?? [] });
        if (r.ok) {
          advanceDemo(3);
          set({
            incidents: r.state.incidents, kerawanan: r.state.kerawanan,
            ...(r.state.followUps ? { followUps: r.state.followUps } : {}),
            ...(r.state.waMessages ? { waMessages: r.state.waMessages } : {}),
            ...(r.state.waDrafts ? { waDrafts: r.state.waDrafts } : {}),
          });
        }
        return r;
      },
      updateWaDraft: (id, fn) => set((s) => ({ waDrafts: (s.waDrafts ?? []).map((d) => (d.id === id ? fn(d) : d)) })),
      updateWaMon: (fn) => set((st) => fn({ waMessages: st.waMessages ?? [], waNumbers: st.waNumbers ?? [], waGroups: st.waGroups ?? [], waRules: st.waRules ?? [], waTerms: st.waTerms ?? [] })),
      applyConfig: (fn) => {
        const r = fn(get().config);
        if (r.ok) set({ config: r.config });
        return r;
      },
      resetDemo: () => { resetDemoClock(); set({ ...seedState() }); },
    }),
    {
      name: STORAGE_KEY,
      // v2: slice `followUps` (fase 6). State lama tanpa slice itu diisi seed supaya aplikasi tidak rusak.
      // v3: `config.history` (fase 8, Konfigurasi Modul). Konfigurasi lama tanpa riwayat diisi riwayat seed.
      // v4: slice `waMessages` + `waDrafts` (INS-05, insiden dari WhatsApp). State lama diisi pesan seed dan tanpa draf.
      // v5: data tindak lanjut diperluas (artifact TLJ-01); state lama memakai seed baru.
      // v6: Pemantauan WhatsApp v2 (nomor, grup, aturan, ketentuan). State lama diisi seed baru; pesan lama dilengkapi id grup.
      version: 7,
      migrate: (persisted, from) => {
        const p = (persisted ?? {}) as Partial<DemoState>;
        const base = seedState().config;
        const config = { ...base, ...(p.config ?? {}), history: p.config?.history ?? base.history ?? [] };
        return {
          ...p, config,
          followUps: from >= 5 && Array.isArray(p.followUps) ? p.followUps : seedFollowUps(),
          waMessages: from >= 7 && Array.isArray(p.waMessages) ? p.waMessages : seedWaMessages(),
          waDrafts: Array.isArray(p.waDrafts) ? p.waDrafts : [],
          waNumbers: Array.isArray(p.waNumbers) ? p.waNumbers : seedWaNumbers(),
          waGroups: Array.isArray(p.waGroups) ? p.waGroups : seedWaGroups(),
          waRules: Array.isArray(p.waRules) ? p.waRules : seedWaRules(),
          waTerms: Array.isArray(p.waTerms) ? p.waTerms : [],
        } as DemoStore;
      },
    },
  ),
);
