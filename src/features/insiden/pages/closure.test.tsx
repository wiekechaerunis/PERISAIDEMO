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
    // Board P22: kartu kanan "Butuh persetujuan Anda"
    expect(screen.getByRole('heading', { name: 'Butuh persetujuan Anda' })).toBeInTheDocument();
    // ADJ-13 + P22/P22r: ringkasan tertutup bawaan ("Ringkas untuk saya"); terbuka menampilkan 4 poin dan Perlu dicek
    const rk = screen.getByRole('region', { name: 'Ringkasan untuk keputusan' });
    expect(within(rk).getByRole('button', { name: /Ringkas untuk saya/ })).toHaveAttribute('aria-expanded', 'false');
    expect(within(rk).queryByText('Perlu dicek')).toBeNull();
    fireEvent.click(within(rk).getByRole('button', { name: /Ringkas untuk saya/ }));
    ['Kejadian', 'Yang dilakukan', 'Dampak akhir', 'Masih berjalan setelah ditutup', 'Perlu dicek'].forEach((k) => expect(within(rk).getByText(k)).toBeInTheDocument());
    expect(within(rk).getByRole('button', { name: /Lihat jejak · 3 langkah/ })).toBeInTheDocument();
    // tombol Lihat di Perlu dicek menyorot data terkait
    fireEvent.click(within(rk).getAllByRole('button', { name: /^Lihat$/ })[0]);
    expect(document.querySelector('.in-hl')).not.toBeNull();
    expect(within(rk).getByRole('button', { name: /Tutup/ })).toHaveAttribute('aria-expanded', 'true');
    // tanda AI · Belum cocok menempel di Ringkasan penanganan
    expect(screen.getByText('Belum cocok:')).toBeInTheDocument();
    // ADJ-10: Lama penanganan + Total waktu di KPI Hasil penanganan
    expect(screen.getByText('Lama penanganan')).toBeInTheDocument();
    expect(screen.getByText(/^Total .* · dalam tenggat$/)).toBeInTheDocument();
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
    // Board P24: kartu kanan "Ditutup", Ringkasan insiden 4 poin (tanpa Perlu dicek), Koreksi data di Hasil penanganan
    expect(screen.getByRole('heading', { name: 'Ditutup' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Ringkasan insiden' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Koreksi data/ })).toBeInTheDocument();
  });

  // ADJ-09 (uji staging PT1-07): tombol Kembalikan nonaktif sampai Alasan terisi
  it('Kembalikan ke PIC: nonaktif tanpa alasan, dengan alasan status Dalam penanganan', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Kembalikan ke PIC/ }));
    const dlg = screen.getByRole('dialog', { name: 'Kembalikan ke PIC?' });
    expect(within(dlg).getByRole('button', { name: 'Kembalikan' })).toBeDisabled();
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

  it('P22c: semua klaim cocok → tanpa tanda Belum cocok dan tanpa baris klaim di Kesiapan', () => {
    renderPage('?variant=cocok');
    expect(screen.queryByText('Belum cocok:')).toBeNull();
    expect(screen.queryByText(/klaim belum cocok/)).toBeNull();
  });

  it('?state=tanpa-pic memunculkan ajakan Tunjuk PIC', () => {
    renderPage('?state=tanpa-pic');
    expect(screen.getByText('PIC tidak aktif.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tunjuk PIC/ }));
    expect(screen.getByRole('dialog', { name: 'Tunjuk PIC' })).toBeInTheDocument();
  });
});
