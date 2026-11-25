import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { useDraftStore } from '../logic/draft';
import { nextNumber } from '../logic/submit';
import { ReportStep4Page } from './ReportStep4Page';
import { ReportKerawananDetailPage } from './ReportKerawananDetailPage';

const base = {
  title: 'Pencurian kabel listrik sumur ADR-07', date: '2026-10-28', time: '01:00', locationName: 'Sumur ADR-07',
  patokan: 'Sumur ADR-07, sisi panel listrik', wk: 'WK Andalas Darat', category: 'Pencurian/Perampokan',
  securityImpact: 'Sekitar 40 m kabel hilang.', axes: ['prop' as const], handledBy: ['bujp' as const],
  // B-3: Apa yang terjadi? dan Sumber informasi kini wajib di langkah 1
  story: 'Kabel listrik pompa sumur ADR-07 dipotong orang tak dikenal.', infoSource: 'pihak-lain' as const,
};

function renderStep4() {
  return render(
    <MemoryRouter initialEntries={['/insiden/baru/ringkasan']}>
      <Routes>
        <Route path="/insiden/baru/ringkasan" element={<ReportStep4Page />} />
        <Route path="/insiden/:no" element={<div>detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useDraftStore.getState().resetDraft();
  useDemoStore.getState().resetDemo();
});

describe('Langkah 4 · Ringkasan & Ajukan', () => {
  it('keparahan Tinggi: Ajukan menambah insiden review-internal', () => {
    useDraftStore.getState().patch({ ...base, ops: 'berhenti', opsHours: 6 });
    const expected = nextNumber('INS-SEN', useDemoStore.getState().incidents.map((i) => i.no));
    const before = useDemoStore.getState().incidents.length;
    renderStep4();
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan' }));
    const { incidents } = useDemoStore.getState();
    expect(incidents).toHaveLength(before + 1);
    expect(incidents[0].no).toBe(expected);
    expect(incidents[0].status).toBe('review-internal');
    expect(incidents[0].severity).toBe('tinggi');
    expect(screen.getByText('detail')).toBeInTheDocument();
    expect(useDraftStore.getState().draft.title).toBe('');
  });

  it('B-13: Ringkasan tanpa "Yang terjadi saat Anda menekan Ajukan" dan tanpa Diperiksa oleh; Sumber informasi dan Tindakan awal tampil', () => {
    useDraftStore.getState().patch({ ...base, ops: 'sebagian', opsHours: 2, initialAction: 'Area diamankan.' });
    renderStep4();
    expect(screen.queryByText('Yang terjadi saat Anda menekan Ajukan')).not.toBeInTheDocument();
    expect(screen.queryByText(/Diperiksa oleh/)).not.toBeInTheDocument();
    expect(screen.getByText('Laporan pihak lain')).toBeInTheDocument();
    expect(screen.getByText('Tindakan awal: Area diamankan.')).toBeInTheDocument();
  });

  it('B-11: dampak belum diketahui ditulis "Belum diketahui" di Ringkasan', () => {
    useDraftStore.getState().patch({ ...base, opsUnknown: true, lossUnknown: true });
    renderStep4();
    expect(screen.getAllByText('Belum diketahui').length).toBeGreaterThanOrEqual(2);
  });

  it('data wajib belum lengkap: tampil galat dan tidak mengajukan', () => {
    useDraftStore.getState().patch({ ...base, ops: 'berhenti', opsHours: null });
    const before = useDemoStore.getState().incidents.length;
    renderStep4();
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan' }));
    expect(screen.getByText('1 isian belum lengkap.')).toBeInTheDocument();
    expect(useDemoStore.getState().incidents).toHaveLength(before);
  });
});

describe('Kerawanan · Detail & lampiran', () => {
  it('Catat kerawanan menambah entri kerawanan tanpa status review', () => {
    useDraftStore.getState().patch({ ...base, kind: 'kerawanan', securityImpact: 'Pagar sisi barat roboh.' });
    const before = useDemoStore.getState().kerawanan.length;
    const expected = nextNumber('KRW-SEN', useDemoStore.getState().kerawanan.map((k) => k.no));
    render(
      <MemoryRouter initialEntries={['/insiden/baru/detail']}>
        <Routes>
          <Route path="/insiden/baru/detail" element={<ReportKerawananDetailPage />} />
          <Route path="/insiden" element={<div>daftar</div>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Catat kerawanan' }));
    const { kerawanan } = useDemoStore.getState();
    expect(kerawanan).toHaveLength(before + 1);
    expect(kerawanan[0].no).toBe(expected);
    expect(kerawanan[0]).not.toHaveProperty('status');
    expect(screen.getByText('daftar')).toBeInTheDocument();
  });
});
