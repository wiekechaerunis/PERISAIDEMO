import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { closureDemoIncident, CLOSURE_DEMO_NO as NO } from '@/services/mock/seedClosure';
import { PejabatHandlingPage } from './PejabatHandlingPage';

function renderPage(query = '') {
  return render(
    <MemoryRouter initialEntries={[`/insiden/${NO}${query}`]}>
      <Routes><Route path="/insiden/:no" element={<PejabatHandlingPage />} /></Routes>
    </MemoryRouter>,
  );
}
const inc = () => useDemoStore.getState().incidents.find((i) => i.no === NO)!;
const closedAt = (at: string) => {
  const b = closureDemoIncident();
  return { ...b, status: 'ditutup' as const, handling: { ...b.handling!, closure: { ...b.handling!.closure!, closedAt: at, closedBy: 'Sari Wulandari' } } };
};
const menu = (item: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Aksi lain' }));
  fireEvent.click(screen.getByRole('menuitem', { name: item }));
};

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDemoStore.getState().setRole('pejabat');
  useDemoStore.getState().addIncident(closureDemoIncident());
});

describe('Layar Pejabat · insiden berjalan', () => {
  it('Tutup insiden: dialog konfirmasi lalu status Ditutup dan toast P24', () => {
    renderPage();
    expect(screen.getByText('Butuh keputusan penutupan dari Anda')).toBeInTheDocument();
    // ADJ-13: ringkasan AI tertutup bawaan; dibuka atas permintaan dan memuat Perlu dicek
    expect(screen.getByRole('button', { name: /Ringkasan untuk keputusan/ })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: /Ringkasan untuk keputusan/ }));
    expect(screen.getByText(/Perlu dicek · \d/)).toBeInTheDocument();
    // ADJ-10: dua ukuran waktu di Periksa penutupan
    expect(screen.getAllByText('Lama penanganan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Total waktu').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Tutup insiden/ }));
    // ADJ-03: Sari juga memeriksa laporan ini → peringatan, tidak memblokir
    const warn = screen.queryByRole('alertdialog');
    if (warn) fireEvent.click(within(warn).getByRole('button', { name: 'Tetap tutup' }));
    const dlg = screen.getByRole('dialog', { name: 'Tutup insiden ini?' });
    expect(within(dlg).getByText('3 tindak lanjut belum selesai')).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: /Tutup insiden/ }));
    expect(inc().status).toBe('ditutup');
    expect(inc().handling?.closure?.closedBy).toBe('Sari Wulandari');
    expect(screen.getByText(`Insiden ${NO} ditutup`)).toBeInTheDocument();
    // B-22: status jadi kartu di kolom kanan
    expect(screen.getByRole('heading', { name: 'Insiden ditutup' })).toBeInTheDocument();
  });

  it('Kembalikan ke PIC: tanpa alasan ditolak, dengan alasan status Dalam penanganan', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Kembalikan ke PIC/ }));
    const dlg = screen.getByRole('dialog', { name: 'Kembalikan ke PIC?' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Kembalikan' }));
    expect(within(dlg).getByText('Tulis alasan.')).toBeInTheDocument();
    expect(inc().status).toBe('minta-ditutup');
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Lampirkan berita acara resmi' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Kembalikan' }));
    expect(inc().status).toBe('dalam-penanganan');
    expect(inc().handling?.closure?.returnReason).toBe('Lampirkan berita acara resmi');
  });

  it('Buka kembali setelah 30 hari menampilkan PS7', () => {
    useDemoStore.getState().addIncident(closedAt('2026-09-26T09:40:00'));
    renderPage();
    menu('Buka kembali');
    const dlg = screen.getByRole('dialog', { name: 'Tidak bisa dibuka kembali' });
    expect(within(dlg).getByText(/ditutup lebih dari 30 hari lalu/)).toBeInTheDocument();
    expect(inc().status).toBe('ditutup');
  });

  it('Buka kembali dalam 30 hari mengubah status dan mencatat reopenedAt', () => {
    useDemoStore.getState().addIncident(closedAt('2026-10-26T09:40:00'));
    renderPage();
    menu('Buka kembali');
    const dlg = screen.getByRole('dialog', { name: 'Buka kembali insiden?' });
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Kabel dicuri lagi' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Buka kembali' }));
    expect(inc().status).toBe('dalam-penanganan');
    expect(inc().handling?.reopenedAt).toBeTruthy();
  });

  it('ADJ-09: selama Menunggu penutupan tidak ada Aksi lain (Ganti PIC, Ubah tenggat, Eskalasi disembunyikan)', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: 'Aksi lain' })).toBeNull();
  });

  it('Ubah tenggat ke masa lalu menampilkan PS10 dan tidak mengubah data (Dalam penanganan)', () => {
    useDemoStore.getState().addIncident({ ...closureDemoIncident(), status: 'dalam-penanganan' });
    renderPage();
    menu('Ubah tenggat');
    const dlg = screen.getByRole('dialog', { name: 'Ubah tenggat penanganan' });
    fireEvent.click(within(dlg).getByRole('button', { name: /^Tenggat baru/ }));
    fireEvent.click(within(dlg).getByRole('gridcell', { name: '27 Okt 2026' }));
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Polsek' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Simpan tenggat' }));
    expect(within(dlg).getByText('Pilih tenggat setelah hari ini.')).toBeInTheDocument();
    expect(within(dlg).getByText('Tulis alasan minimal 10 karakter.')).toBeInTheDocument();
    expect(inc().handleDueAt).toBe('2026-11-02T07:00:00');
  });

  it('?state=tanpa-pic memunculkan ajakan Tunjuk PIC', () => {
    renderPage('?state=tanpa-pic');
    expect(screen.getByText('PIC tidak aktif.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tunjuk PIC/ }));
    expect(screen.getByRole('dialog', { name: 'Tunjuk PIC' })).toBeInTheDocument();
  });
});
