import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { markRestricted } from '@/services/mock/workflow';
import { useDraftStore } from '@/features/insiden/logic/draft';
import { nextNumber } from '@/features/insiden/logic/submit';
import { MobileReportStep3Page } from './MobileReportStep3Page';
import { MobileReportStep4Page } from './MobileReportStep4Page';
import { MobileIncidentDetail } from './MobileIncidentDetail';

const base = {
  title: 'Pencurian kabel listrik sumur ADR-07', date: '2026-10-28', time: '01:00', locationName: 'Sumur ADR-07',
  patokan: 'Sumur ADR-07, sisi panel listrik', wk: 'WK Andalas Darat', category: 'Pencurian/Perampokan',
  securityImpact: 'Sekitar 40 m kabel hilang.', axes: ['prop' as const], handledBy: ['bujp' as const],
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/insiden/baru/lampiran" element={<MobileReportStep3Page />} />
        <Route path="/insiden/baru/ringkasan" element={<MobileReportStep4Page />} />
        <Route path="/insiden/:no" element={<MobileIncidentDetail />} />
        <Route path="/insiden" element={<div>daftar</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
  useDraftStore.getState().resetDraft();
  useDemoStore.getState().resetDemo();
});

describe('Mobile langkah 3 · Lampiran', () => {
  it('menambah lampiran ke draf dan menolak format tak didukung', () => {
    renderAt('/insiden/baru/lampiran');
    expect(screen.getByRole('group', { name: 'Langkah 3 dari 4: Lampiran' })).toBeInTheDocument();
    const input = screen.getByTestId('file-input');
    const ok = new File(['x'.repeat(2048)], 'panel.jpg', { type: 'image/jpeg' });
    const bad = new File(['x'], 'VID_0099.mp4', { type: 'video/mp4' });
    fireEvent.change(input, { target: { files: [ok, bad] } });
    const att = useDraftStore.getState().draft.attachments;
    expect(att).toHaveLength(1);
    expect(att[0].name).toBe('panel.jpg');
    expect(screen.getByText('panel.jpg')).toBeInTheDocument();
    expect(screen.getByText('Format tidak didukung. Pakai JPG, PNG, atau PDF.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Keterangan panel.jpg'), { target: { value: 'Panel terbuka' } });
    expect(useDraftStore.getState().draft.attachments[0].caption).toBe('Panel terbuka');
  });
});

describe('Mobile langkah 4 · Ringkasan', () => {
  it('Tinggi: banner jalur cepat tampil dan Ajukan menambah insiden review-internal', () => {
    useDraftStore.getState().patch({ ...base, ops: 'berhenti', opsHours: 6 });
    const expected = nextNumber('INS-SEN', useDemoStore.getState().incidents.map((i) => i.no));
    const before = useDemoStore.getState().incidents.length;
    renderAt('/insiden/baru/ringkasan');
    expect(screen.getByText('SKK Migas langsung diberi tahu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan' }));
    const { incidents } = useDemoStore.getState();
    expect(incidents).toHaveLength(before + 1);
    expect(incidents[0].no).toBe(expected);
    expect(incidents[0].status).toBe('review-internal');
    expect(incidents[0].severity).toBe('tinggi');
    expect(useDraftStore.getState().draft.title).toBe('');
  });

  it('Sedang: tanpa banner jalur cepat', () => {
    useDraftStore.getState().patch({ ...base, ops: 'sebagian', opsHours: 2 });
    renderAt('/insiden/baru/ringkasan');
    expect(screen.queryByText('SKK Migas langsung diberi tahu')).toBeNull();
    expect(screen.getByText('Pejabat Berwenang diberi tahu')).toBeInTheDocument();
  });

  it('isian wajib kosong: Ajukan menampilkan banner validasi dan tidak menambah insiden', () => {
    const before = useDemoStore.getState().incidents.length;
    renderAt('/insiden/baru/ringkasan');
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan' }));
    expect(screen.getByText(/isian belum lengkap\./)).toBeInTheDocument();
    expect(useDemoStore.getState().incidents).toHaveLength(before);
  });

  it('?state=bentrok menonaktifkan Ajukan; ?state=gagal-kirim menampilkan Ajukan lagi', () => {
    useDraftStore.getState().patch({ ...base, ops: 'berhenti', opsHours: 6 });
    const { unmount } = renderAt('/insiden/baru/ringkasan?state=bentrok');
    expect(screen.getByRole('button', { name: 'Ajukan' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Muat ulang' }));
    expect(screen.getByRole('button', { name: 'Ajukan' })).toBeEnabled();
    unmount();
    renderAt('/insiden/baru/ringkasan?state=gagal-kirim');
    expect(screen.getByRole('button', { name: 'Ajukan lagi' })).toBeInTheDocument();
    expect(screen.getByText('Laporan belum terkirim. Periksa koneksi lalu coba lagi.')).toBeInTheDocument();
  });
});

describe('Mobile detail insiden', () => {
  // ADJ-17: "Batalkan pengajuan" dengan alasan wajib
  it('Pelapor: Batalkan pengajuan mengubah status jadi Draf', () => {
    renderAt('/insiden/INS-SEN-2026-0007');
    expect(screen.getByRole('heading', { name: 'Pencurian kabel listrik sumur ADR-07' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aksi lain: Batalkan pengajuan' }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText('Batalkan pengajuan?')).toBeInTheDocument();
    expect(within(dlg).getByRole('button', { name: 'Batalkan pengajuan' })).toBeDisabled();
    fireEvent.change(within(dlg).getByLabelText('Alasan membatalkan pengajuan'), { target: { value: 'Lokasi salah titik.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Batalkan pengajuan' }));
    expect(useDemoStore.getState().incidents.find((i) => i.no === 'INS-SEN-2026-0007')?.status).toBe('draf');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Lanjutkan draf' })).toBeInTheDocument();
  });

  it('SKK: belum diperiksa, tanpa Batalkan pengajuan', () => {
    useDemoStore.getState().setRole('pengawas');
    renderAt('/insiden/INS-SEN-2026-0007');
    expect(screen.getByText('Belum diperiksa Pejabat Berwenang KKKS.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Batalkan pengajuan/ })).toBeNull();
  });

  it('insiden restricted menampilkan Terbatas', () => {
    useDemoStore.getState().decide((s) => markRestricted(s, 'INS-SEN-2026-0007', 'Sari Wulandari'));
    renderAt('/insiden/INS-SEN-2026-0007');
    expect(screen.getByText('Anda tidak punya akses ke insiden ini.')).toBeInTheDocument();
    expect(screen.queryByText('Pencurian kabel listrik sumur ADR-07')).toBeNull();
  });
});
