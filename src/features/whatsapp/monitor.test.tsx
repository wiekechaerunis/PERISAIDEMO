// Pemantauan WhatsApp v2: RBAC (SKK ditolak), ketentuan, tab Admin KKKS, dan panel simulasi → Pesan masuk.
import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import type { Role } from '@/lib/rbac';
import { WaInboxPage } from './pages/WaInboxPage';
import { WaMessagePage } from './pages/WaMessagePage';
import { WaSimPanel, useWaSimUi } from './sim/WaSimPanel';

const store = () => useDemoStore.getState();
const renderPage = (role: Role, url = '/pemantauan-whatsapp') => {
  store().setRole(role);
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/pemantauan-whatsapp" element={<WaInboxPage />} />
        <Route path="/insiden/wa/pesan/:id" element={<WaMessagePage />} />
        <Route path="/" element={<div>Beranda</div>} />
      </Routes>
      <WaSimPanel />
    </MemoryRouter>,
  );
};

beforeEach(() => {
  localStorage.clear();
  store().resetDemo();
  useWaSimUi.setState({ open: false });
});

describe('Pemantauan WhatsApp v2', () => {
  it('K1: SKK ditolak dan menu tidak tampil', () => {
    renderPage('pengawas');
    expect(screen.getByText('Beranda')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pemantauan WhatsApp' })).toBeNull();
  });

  it('A1: Admin KKKS harus menyetujui ketentuan; Lanjutkan nonaktif sampai dicentang; lalu empat tab', () => {
    renderPage('admin-kkks');
    expect(screen.getByRole('heading', { name: 'Sebelum memakai Pemantauan WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lanjutkan' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Saya memahami risiko di atas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan' }));
    for (const t of ['Pesan masuk', 'Nomor tertaut', 'Aturan', 'Grup']) expect(screen.getByRole('tab', { name: new RegExp(t) })).toBeInTheDocument();
  });

  it('Pelapor hanya melihat Pesan masuk dan bisa memilih pesan; Pejabat hanya baca', () => {
    const { unmount } = renderPage('pelapor');
    expect(screen.queryByRole('tab', { name: /Nomor tertaut/ })).toBeNull();
    expect(screen.getAllByRole('checkbox', { name: /Pilih pesan:/ }).length).toBeGreaterThan(0);
    unmount();
    renderPage('pejabat');
    expect(screen.queryByRole('checkbox', { name: /Pilih pesan:/ })).toBeNull();
    expect(screen.getAllByRole('link', { name: /S/ }).some((l) => l.getAttribute('href')?.startsWith('/insiden/wa/pesan/'))).toBe(true);
  });

  it('Pesan masuk: segmen cepat papan, filter Status Rutin, Tandai rutin dan Buka kembali dari Detail pesan', () => {
    renderPage('pelapor', '/insiden/wa/pesan/WAM-003');
    expect(screen.getByRole('button', { name: 'Jadikan draf laporan' })).toBeInTheDocument();
    const before = store().waMessages.filter((m) => m.status === 'rutin').length;
    fireEvent.click(screen.getByRole('button', { name: 'Tandai rutin' }));
    expect(store().waMessages.filter((m) => m.status === 'rutin').length).toBe(before + 1);
    fireEvent.click(screen.getByRole('button', { name: 'Buka kembali' }));
    expect(store().waMessages.filter((m) => m.status === 'rutin').length).toBe(before);
    expect(screen.queryByText(/Teruskan ke SKK/)).toBeNull();
  });

  it('Pesan masuk: radio Semua, Prioritas, Perlu ditinjau, Tidak relevan; Tandai tidak relevan massal dengan alasan', () => {
    renderPage('pelapor');
    for (const s of ['Semua', 'Prioritas', 'Perlu ditinjau', 'Tidak relevan']) expect(screen.getByRole('radio', { name: new RegExp('^' + s) })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('checkbox', { name: /Pilih pesan:/ })[0]);
    expect(screen.getByText('1 pesan dipilih')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tandai tidak relevan' }));
    const dlg = screen.getByRole('dialog', { name: /Tandai pesan ini tidak relevan/ });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Uji coba' }));
    fireEvent.click(within(dlg).getByRole('button', { name: 'Tandai tidak relevan' }));
    expect(store().waMessages.filter((m) => m.status === 'tidak-relevan' && m.irrelevantReason === 'Uji coba').length).toBeGreaterThan(0);
  });

  it('C4: panel simulasi: pesan siap pakai no. 2 tidak disimpan; no. 3 (3 bubble) menjadi satu item Prioritas', () => {
    renderPage('pelapor');
    act(() => useWaSimUi.setState({ open: true }));
    const panel = screen.getByRole('dialog', { name: 'Simulasi WhatsApp' });
    expect(within(panel).getByText('Simulasi · bukan aplikasi WhatsApp')).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('tab', { name: 'Chat grup' }));
    const n0 = store().waMessages.length;
    fireEvent.change(within(panel).getByLabelText('Pesan siap pakai'), { target: { value: '1' } });
    expect(store().waMessages.length).toBe(n0);
    expect(within(panel).getAllByText(/Tidak ditangkap/).length).toBeGreaterThan(0);
    fireEvent.change(within(panel).getByLabelText('Pesan siap pakai'), { target: { value: '2' } });
    expect(store().waMessages.length).toBe(n0 + 1);
    const item = store().waMessages[0];
    expect(item.priority).toBe(true);
    expect(item.bubbles).toHaveLength(2);
  });

  it('A3/C2: tautkan nomor baru lalu pindai dari panel: nomor berbeda ditolak, nomor yang benar Terhubung', () => {
    renderPage('admin-kkks');
    act(() => store().updateWaMon(() => ({ waTerms: ['Dewi Lestari'] })));
    fireEvent.click(screen.getByRole('tab', { name: /Nomor tertaut/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Tautkan nomor' }));
    const dlg = screen.getByRole('dialog', { name: /Tautkan nomor WhatsApp/ });
    fireEvent.change(within(dlg).getByLabelText(/^Label nomor/), { target: { value: 'Posko Baru' } });
    fireEvent.change(within(dlg).getByLabelText(/^Nomor WhatsApp/), { target: { value: '0812 7000 3333' } });
    fireEvent.click(within(dlg).getByLabelText(/Nomor ini milik organisasi/));
    fireEvent.click(within(dlg).getByLabelText(/Anggota grup .* diberi tahu/));
    fireEvent.click(within(dlg).getByRole('button', { name: 'Lanjut' }));
    expect(store().waNumbers.find((n) => n.label === 'Posko Baru')?.status).toBe('menunggu');
    act(() => useWaSimUi.setState({ open: true }));
    const panel = screen.getByRole('dialog', { name: 'Simulasi WhatsApp' });
    fireEvent.change(within(panel).getByLabelText('Ponsel'), { target: { value: '0812 7000 9999' } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Tautkan perangkat' }));
    expect(within(panel).getByText('Nomor yang memindai berbeda dengan nomor yang ditautkan.')).toBeInTheDocument();
    fireEvent.change(within(panel).getByLabelText('Ponsel'), { target: { value: '0812 7000 3333' } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Tautkan perangkat' }));
    expect(store().waNumbers.find((n) => n.label === 'Posko Baru')?.status).toBe('terhubung');
    expect(screen.getByText(/Terhubung\./)).toBeInTheDocument();
  });
});
