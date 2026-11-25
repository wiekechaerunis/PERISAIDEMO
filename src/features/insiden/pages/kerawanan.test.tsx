import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { useDraftStore } from '../logic/draft';
import { KerawananDetailPage } from './KerawananDetailPage';
import { KerawananRingkasanPage } from './KerawananRingkasanPage';

function Landing({ label }: { label: string }) {
  const loc = useLocation();
  return <div>{label}:{loc.pathname}{loc.search}|{(loc.state as { toast?: string } | null)?.toast}</div>;
}

function renderKrw(no: string, query = '') {
  return render(
    <MemoryRouter initialEntries={[`/kerawanan/${no}${query}`]}>
      <Routes>
        <Route path="/kerawanan/ringkasan" element={<KerawananRingkasanPage />} />
        <Route path="/kerawanan/:no" element={<KerawananDetailPage />} />
        <Route path="/insiden/baru/temuan" element={<Landing label="baru" />} />
        <Route path="/insiden" element={<Landing label="daftar" />} />
      </Routes>
    </MemoryRouter>,
  );
}
const NO = 'KRW-SEN-2026-0047';
const krw = (no: string) => useDemoStore.getState().kerawanan.find((k) => k.no === no)!;
const inc = (no: string) => useDemoStore.getState().incidents.find((i) => i.no === no);

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDraftStore.getState().resetDraft();
});

describe('Kerawanan · detail dan Naikkan jadi insiden (Pejabat)', () => {
  it('KD1: detail KRW-0047 tampil lengkap dengan aksi Pejabat', () => {
    useDemoStore.setState({ role: 'pejabat' });
    renderKrw(NO);
    expect(screen.getByRole('heading', { name: 'Pagar sisi barat sumur ADR-07 roboh' })).toBeInTheDocument();
    expect(screen.getByText('Jenis kerawanan: Kondisi rawan')).toBeInTheDocument();
    expect(screen.getByText(/Diketahui 18 Nov 2026, 07:20 WIB/)).toBeInTheDocument();
    expect(screen.getByText('Lampiran · 1 file')).toBeInTheDocument();
    expect(screen.getByText('12 menit setelah diketahui')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tambah perkembangan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Naikkan jadi insiden' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajukan jadi insiden' })).toBeNull();
  });

  it('(a) Pejabat menaikkan KRW-0047: pilih → formulir → insiden baru dengan PIC dan fromKrw, pindah ke tab Insiden dengan toast', () => {
    useDemoStore.setState({ role: 'pejabat' });
    renderKrw(NO);
    fireEvent.click(screen.getByRole('button', { name: 'Naikkan jadi insiden' }));
    const dlg = screen.getByRole('dialog', { name: 'Naikkan jadi insiden?' });
    expect(within(dlg).getByRole('radio', { name: /Kerawanan ini ternyata berdampak/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByRole('heading', { name: 'Naikkan jadi insiden' })).toBeInTheDocument();
    expect(screen.getByText('Otomatis')).toBeInTheDocument(); // keparahan Rendah otomatis dari dampak
    expect(screen.getByText('Dari dampak: kerugian properti, operasi tidak terganggu.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Naikkan dan tetapkan PIC' }));
    const i = inc('INS-SEN-2026-0011')!;
    expect(i.status).toBe('dalam-penanganan');
    expect(i.pic).toBe('Andi Pratama');
    expect(i.fromKrw).toBe(NO);
    expect(i.handleDueAt).toBe('2026-12-08T10:42:00');
    expect(krw(NO).raisedTo).toBe('INS-SEN-2026-0011');
    expect(useDemoStore.getState().kerawanan).toHaveLength(8); // satu catatan, tidak diduplikasi
    expect(screen.getByText('daftar:/insiden|Insiden INS-SEN-2026-0011 dibuat, Dalam penanganan. PIC: Andi Pratama.')).toBeInTheDocument();
  });

  it('KD3: mengubah keparahan dari saran wajib beralasan; alasan dinaikkan minimal 10 karakter', () => {
    useDemoStore.setState({ role: 'pejabat' });
    renderKrw(NO, '?langkah=naikkan');
    fireEvent.click(screen.getByRole('button', { name: 'Ubah' }));
    fireEvent.click(screen.getByRole('radio', { name: /Tinggi/ }));
    expect(screen.getByText('Diubah Anda')).toBeInTheDocument();
    expect(screen.getByText('SKK Migas langsung diberi tahu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Naikkan dan tetapkan PIC' }));
    expect(screen.getByText('Jelaskan kenapa berbeda dari saran.')).toBeInTheDocument();
    expect(inc('INS-SEN-2026-0011')).toBeUndefined();
    fireEvent.change(screen.getByLabelText('Kenapa berbeda dari saran?'), { target: { value: 'Kabel panel jalur utama pompa.' } });
    fireEvent.change(screen.getByLabelText('Kenapa kerawanan ini dinaikkan jadi insiden?'), { target: { value: 'Pendek' } });
    fireEvent.click(screen.getByRole('button', { name: 'Naikkan dan tetapkan PIC' }));
    expect(screen.getByText('Alasan minimal 10 karakter.')).toBeInTheDocument();
    expect(inc('INS-SEN-2026-0011')).toBeUndefined();
    fireEvent.change(screen.getByLabelText('Kenapa kerawanan ini dinaikkan jadi insiden?'), { target: { value: 'Pagar dijebol dan kabel hilang.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Naikkan dan tetapkan PIC' }));
    expect(inc('INS-SEN-2026-0011')?.severity).toBe('tinggi');
    expect(inc('INS-SEN-2026-0011')?.skkNotified).toBe(true);
  });

  it('KD2 opsi b: kejadian baru membuka Laporan baru dengan lokasi terisi; kerawanan tetap Tercatat', () => {
    useDemoStore.setState({ role: 'pejabat' });
    renderKrw(NO);
    fireEvent.click(screen.getByRole('button', { name: 'Naikkan jadi insiden' }));
    fireEvent.click(screen.getByRole('radio', { name: /Terjadi kejadian baru di lokasi ini/ }));
    expect(screen.getByText('Laporan baru dibuka dengan lokasi Sumur ADR-07 terisi dan tautan Kerawanan terkait: KRW-SEN-2026-0047.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByText(/baru:\/insiden\/baru\/temuan/)).toBeInTheDocument();
    expect(useDraftStore.getState().draft.locationName).toBe('Sumur ADR-07');
    expect(krw(NO).raisedTo).toBeUndefined();
  });
});

describe('Kerawanan · Pelapor', () => {
  it('(b) Pelapor Ajukan jadi insiden: status Menunggu pemeriksaan tanpa PIC, menunggu pemeriksaan Pejabat', () => {
    useDemoStore.setState({ role: 'pelapor' });
    renderKrw(NO);
    expect(screen.queryByRole('button', { name: 'Naikkan jadi insiden' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan jadi insiden' }));
    expect(screen.getByRole('heading', { name: 'Ajukan jadi insiden' })).toBeInTheDocument();
    expect(screen.queryByText('Siapa yang menangani?')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan jadi insiden' }));
    const i = inc('INS-SEN-2026-0011')!;
    expect(i.status).toBe('review-internal');
    expect(i.pic).toBeNull();
    expect(i.fromKrw).toBe(NO);
    expect(krw(NO).raisedTo).toBe(i.no);
    expect(screen.getByText(/daftar:\/insiden\|Insiden INS-SEN-2026-0011 diajukan/)).toBeInTheDocument();
  });

  it('(c) Tambah perkembangan dengan Makin rawan menandai kerawanan dan tampil di Riwayat', () => {
    useDemoStore.setState({ role: 'pelapor' });
    renderKrw('KRW-SEN-2026-0044');
    expect(screen.queryByText('Makin rawan')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah perkembangan' }));
    const dlg = screen.getByRole('dialog', { name: 'Tambah perkembangan' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Simpan perkembangan' }));
    expect(within(dlg).getByText('Isi apa yang berubah.')).toBeInTheDocument(); // wajib
    expect(krw('KRW-SEN-2026-0044').progress).toBeUndefined();
    fireEvent.change(within(dlg).getByLabelText('Apa yang berubah?'), { target: { value: 'Dua hari terakhir jejak motor masuk lewat pagar roboh.' } });
    expect(within(dlg).getByRole('checkbox', { name: /Makin rawan/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Simpan perkembangan' }));
    const k = krw('KRW-SEN-2026-0044');
    expect(k.worsening).toBe(true);
    expect(k.progress?.[0]).toMatchObject({ by: 'Budi Santoso', worsening: true });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Perkembangan disimpan. Pejabat Berwenang diberi tahu.')).toBeInTheDocument();
    expect(screen.getByText('Dua hari terakhir jejak motor masuk lewat pagar roboh.')).toBeInTheDocument();
    expect(screen.getAllByText('Makin rawan').length).toBeGreaterThan(0);
    expect(screen.getByText('Pejabat Berwenang KKKS cakupan WK Andalas Darat diberi tahu seketika.')).toBeInTheDocument();
  });

  it('Tambah perkembangan tanpa Makin rawan hanya mencatat', () => {
    useDemoStore.setState({ role: 'pelapor' });
    renderKrw('KRW-SEN-2026-0044');
    fireEvent.click(screen.getByRole('button', { name: 'Tambah perkembangan' }));
    const dlg = screen.getByRole('dialog');
    fireEvent.change(within(dlg).getByLabelText('Apa yang berubah?'), { target: { value: 'Gembok sudah diganti sementara.' } });
    fireEvent.click(within(dlg).getByRole('checkbox', { name: /Makin rawan/ }));
    fireEvent.click(within(dlg).getByRole('button', { name: 'Simpan perkembangan' }));
    expect(krw('KRW-SEN-2026-0044').worsening).toBeFalsy();
    expect(screen.getByText('Perkembangan disimpan.')).toBeInTheDocument();
  });
});

describe('Kerawanan · sudah dinaikkan (KD4)', () => {
  it('(d) KRW-0045 (sudah INS-SEN-2026-0010) menampilkan detail insiden tertaut tanpa tombol Naikkan', () => {
    useDemoStore.setState({ role: 'pejabat' });
    renderKrw('KRW-SEN-2026-0045');
    expect(screen.getByRole('heading', { name: 'Detail insiden' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Drone tidak dikenal di atas sumur ADR-07' })).toBeInTheDocument();
    expect(screen.getByText(/Dinaikkan dari kerawanan/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Naikkan jadi insiden' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tambah perkembangan' })).toBeNull();
  });

  it('setelah dinaikkan, membuka nomor KRW menampilkan KD4: tertaut INS-SEN-2026-0011 dengan PIC, tenggat, dan riwayat', () => {
    useDemoStore.setState({ role: 'pejabat' });
    const { unmount } = renderKrw(NO, '?langkah=naikkan');
    fireEvent.click(screen.getByRole('button', { name: 'Naikkan dan tetapkan PIC' }));
    unmount();
    renderKrw(NO);
    expect(screen.getByRole('heading', { name: 'Pagar sisi barat sumur ADR-07 roboh, kabel panel hilang' })).toBeInTheDocument();
    expect(screen.getAllByText('INS-SEN-2026-0011').length).toBeGreaterThan(0);
    expect(screen.getByText('PIC Andi Pratama ditetapkan')).toBeInTheDocument();
    expect(screen.getByText('Dinaikkan jadi insiden dan disetujui')).toBeInTheDocument();
    expect(screen.getByText(/Tenggat 8 Des 2026 \(Rendah · 14 hari kerja\)/)).toBeInTheDocument();
    expect(screen.getByText(/Keparahan: Rendah$/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Naikkan jadi insiden' })).toBeNull();
  });

  it('SKK hanya melihat: tanpa aksi di detail kerawanan', () => {
    useDemoStore.setState({ role: 'pengawas' });
    renderKrw('KRW-SEN-2026-0044');
    expect(screen.getByRole('heading', { name: 'Gembok gerbang sumur ADR-07 rusak' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tambah perkembangan|Naikkan|Ajukan/ })).toBeNull();
  });

  it('kerawanan tidak ditemukan', () => {
    renderKrw('KRW-SEN-2026-9999');
    expect(screen.getByText('Kerawanan tidak ditemukan.')).toBeInTheDocument();
  });
});

describe('Ringkasan harian (EK1)', () => {
  it('memuat 6 kerawanan baru dengan hitungan 3 · 2 · 1', () => {
    useDemoStore.setState({ role: 'pejabat' });
    render(
      <MemoryRouter initialEntries={['/kerawanan/ringkasan']}>
        <Routes><Route path="/kerawanan/ringkasan" element={<KerawananRingkasanPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: '6 kerawanan baru di WK Andalas Darat' })).toBeInTheDocument();
    expect(screen.getByText('Semua kerawanan baru (6)')).toBeInTheDocument();
    expect(screen.getByText('Sumur ADR-07 · 2 kerawanan dalam 24 jam')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buka tab Kerawanan' })).toHaveAttribute('href', '/insiden?tab=kerawanan');
  });
});
