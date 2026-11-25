import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { closureDemoIncident, CLOSURE_DEMO_NO } from '@/services/mock/seedClosure';
import { SkkIncidentPage } from './SkkIncidentPage';

const renderSkk = (no: string, search = '') =>
  render(
    <MemoryRouter initialEntries={[`/insiden/${no}${search}`]}>
      <Routes>
        <Route path="/insiden/:no" element={<SkkIncidentPage />} />
        <Route path="/insiden" element={<div>daftar</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDemoStore.getState().setRole('pengawas');
});

describe('Detail SKK insiden disetujui', () => {
  it('P31: INS-SEN-2026-0005 menampilkan keparahan Kritis dan tanda dieskalasi', () => {
    renderSkk('INS-SEN-2026-0005');
    expect(screen.getByRole('heading', { name: 'Penghadangan truk logistik oleh warga' })).toBeInTheDocument();
    expect(screen.getAllByText('Dieskalasi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kritis').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Beri arahan/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Setujui|Tutup insiden/ })).toBeNull();
  });

  it('Beri arahan menambah arahan ke store dan muncul di kronologi', () => {
    renderSkk('INS-SEN-2026-0005');
    fireEvent.click(screen.getByRole('button', { name: /Beri arahan/ }));
    const dlg = screen.getByRole('dialog');
    fireEvent.change(within(dlg).getByRole('textbox'), { target: { value: 'Koordinasikan patroli gabungan dengan Polres.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Kirim arahan' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    const i = useDemoStore.getState().incidents.find((x) => x.no === 'INS-SEN-2026-0005')!;
    expect(i.handling?.directives).toHaveLength(1);
    expect(i.status).toBe('dalam-penanganan');
    expect(screen.getByRole('status')).toHaveTextContent('Arahan terkirim');
    // B-18: Riwayat di tab tersendiri
    fireEvent.click(screen.getByRole('tab', { name: /Riwayat/ }));
    const tl = screen.getByRole('list', { name: 'Riwayat insiden' });
    expect(within(tl).getByText('Koordinasikan patroli gabungan dengan Polres.')).toBeInTheDocument();
    expect(within(tl).getAllByText('Arahan SKK').length).toBeGreaterThan(0);
  });

  it('arahan kosong ditolak dan tidak tersimpan', () => {
    renderSkk('INS-SEN-2026-0005');
    fireEvent.click(screen.getByRole('button', { name: /Beri arahan/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Kirim arahan' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Tulis arahan untuk PIC.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(useDemoStore.getState().incidents.find((x) => x.no === 'INS-SEN-2026-0005')!.handling?.directives ?? []).toHaveLength(0);
  });

  it('P35: insiden ditutup hanya baca, tanpa tombol Beri arahan', () => {
    renderSkk('INS-SEN-2026-0004');
    expect(screen.getAllByText('Ditutup').length).toBeGreaterThan(0);
    // board P35: kartu kanan Ditutup, Ringkasan insiden 4 poin, Hasil penanganan hanya baca (tanpa Koreksi data), Info laporan + KKKS
    expect(screen.getByRole('heading', { name: 'Ditutup' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Ringkasan insiden' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Koreksi data/ })).toBeNull();
    expect(screen.getByText('KKKS')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Beri arahan/ })).toBeNull();
  });

  it('P36: ?persetujuan=skk menyetujui penutupan; Kembalikan ke PIC butuh alasan', () => {
    useDemoStore.getState().addIncident(closureDemoIncident());
    renderSkk(CLOSURE_DEMO_NO, '?persetujuan=skk');
    expect(screen.getByText('Butuh persetujuan penutupan dari Anda')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Kembalikan ke PIC/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Kembalikan' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Alasan wajib diisi.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Tutup dialog' }));
    fireEvent.click(screen.getByRole('button', { name: /Setujui penutupan/ }));
    expect(useDemoStore.getState().incidents.find((x) => x.no === CLOSURE_DEMO_NO)!.status).toBe('ditutup');
  });
});
