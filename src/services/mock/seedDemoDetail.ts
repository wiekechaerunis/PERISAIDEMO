// Pelengkap data demo supaya Detail (P31/P33/P35/P24) tampil lengkap seperti board: lampiran laporan awal untuk insiden yang sudah
// berjalan, dan data penutupan untuk insiden Ditutup yang belum punya. Hanya mengisi yang kosong; data yang ada tidak ditimpa.
import type { Closure, Incident } from '../types';
import { CLOSED_AT } from './seedExtra';

const RUNNING = ['dalam-penanganan', 'minta-ditutup', 'ditutup'];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);

/** "2026-10-19T03:30:00" + n hari, jam tetap `hh:mm`. */
const plusDays = (iso: string, n: number, hm: string) => {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return `${d.toISOString().slice(0, 10)}T${hm}:00`;
};

const CAUSE: Record<string, { cause: string; detail: string; factors: string[] }> = {
  'Pencurian minyak': { cause: 'Celah pengamanan fisik', detail: 'Katup tangki tidak bersegel dan berada di luar jangkauan CCTV.', factors: ['Lemahnya pengawasan malam', 'Segel katup tidak ada'] },
  'Perusakan material': { cause: 'Perusakan oleh pihak luar', detail: 'Perangkat berada di sisi pagar yang mudah dijangkau dari luar.', factors: ['Penerangan kurang', 'Celah pagar'] },
  Lainnya: { cause: 'Akses tanpa izin', detail: 'Area sumur tanpa pagar penuh; pelintas masuk dari jalan kebun.', factors: ['Pagar tidak lengkap'] },
};

function closureOf(i: Incident, closedAt: string): Closure {
  const c = CAUSE[i.category] ?? CAUSE.Lainnya;
  const loss = i.detail?.lossIdr ?? (i.severity === 'sedang' ? 6_800_000 : 1_200_000);
  const s = slug(i.location);
  const summary = i.category === 'Pencurian minyak'
    ? 'Katup tangki disegel ulang, patroli malam ditambah, dan kejadian dilaporkan ke Polsek.'
    : i.category === 'Perusakan material'
      ? 'Perangkat yang rusak diganti, pagar sisi luar diperbaiki, dan patroli ditambah.'
      : 'Area diperiksa bersama BUJP, tidak ada kerusakan. Patroli area ditambah selama dua minggu.';
  return {
    partners: ['bujp'], partnerNames: ['PT Garda Nusantara Sejahtera (BUJP)'],
    contracts: [{ partner: 'PT Garda Nusantara Sejahtera', ref: 'KTR-2026-0014' }], confirmedContracts: true,
    casualtiesFinal: {}, lossFinalIdr: loss, opsHoursFinal: i.detail?.opsHours ?? 0,
    cause: c.cause, causeDetail: c.detail, factors: c.factors,
    actions: summary, outcome: summary, summary,
    result: 'tidak-ada',
    legal: i.category === 'Pencurian minyak' ? { status: 'dilaporkan', lpNo: 'LP/B/388/X/2026' } : { status: 'tidak-diproses' },
    evidence: [
      { name: `kondisi-akhir-${s}.jpg`, sizeKb: 2240, caption: 'Kondisi akhir setelah ditangani' },
      { name: `berita-acara-${s}.pdf`, sizeKb: 612, caption: 'Berita acara penanganan' },
    ],
    requestedAt: plusDays(closedAt, -1, '09:00'), requestedBy: i.pic ?? 'Andi Pratama',
    closedAt, closedBy: 'Sari Wulandari',
  };
}

export function withDemoDetail(i: Incident): Incident {
  if (!RUNNING.includes(i.status) || !i.detail) return i;
  let out = i;
  if (!i.detail.attachments.length) {
    const s = slug(i.location);
    out = {
      ...out,
      detail: {
        ...i.detail,
        attachments: [
          { name: `${s}-1.jpg`, sizeKb: 3120, caption: `Kondisi ${i.location} saat kejadian` },
          { name: `${s}-2.jpg`, sizeKb: 2860, caption: 'Titik kejadian dari dekat' },
          { name: `${s}-wa.jpg`, sizeKb: 1790, caption: 'Foto dari grup WhatsApp pengamanan' },
        ],
      },
    };
  }
  if (i.status === 'ditutup' && !i.handling?.closure) {
    const at = CLOSED_AT[i.no] ?? plusDays(i.occurredAt, 3, '10:00');
    out = { ...out, handling: { ...(i.handling ?? { notes: [], directives: [] }), closure: closureOf(i, at) } };
  }
  return out;
}
