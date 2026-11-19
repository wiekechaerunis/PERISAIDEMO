// Sumber WhatsApp sebuah insiden: pesan yang menjadi laporannya (tautan kind 'laporan'). Tanpa pesan, jatuh ke contoh board I23.
import { WA_SOURCE } from '@/features/insiden/components/detail/detailLogic';
import { useDemoStore } from '@/services/mock/store';
import type { Incident, WaMessage } from '@/services/types';
import { senderLabel } from './draft';

export type WaSource = typeof WA_SOURCE;

export function waSourceOf(i: Pick<Incident, 'no'> | undefined, messages: WaMessage[]): WaSource {
  const m = i && messages.find((x) => x.links.some((l) => l.incidentNo === i.no && l.kind === 'laporan'));
  return m ? { group: m.group, sender: senderLabel(m), text: m.text, at: m.at, photos: m.photos.length } : WA_SOURCE;
}

export function useWaSource(i: Pick<Incident, 'no'> | undefined): WaSource {
  const messages = useDemoStore((s) => s.waMessages);
  return waSourceOf(i, messages ?? []);
}
