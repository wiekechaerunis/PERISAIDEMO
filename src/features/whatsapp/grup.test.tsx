// Tab Grup (board V2-50..57): daftar dipantau, cari, pantau, ubah, anggota, berhenti memantau.
import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useDemoStore } from '@/services/mock/store';
import { simulateNewGroup, simulateRemoved } from '@/services/mock/workflow.wamon';
import { run } from './components/monitor/shared';
import { GrupTab } from './components/monitor/GrupTab';

const store = () => useDemoStore.getState();
const apply = (fn: Parameters<typeof run>[0]) => act(() => { run(fn); });
const pickWk = (name: string) => {
  fireEvent.click(screen.getByLabelText(/Wilayah kerja/));
  fireEvent.click(screen.getByRole('option', { name }));
};
const search = (v: string) => fireEvent.change(screen.getByLabelText('Cari nama grup'), { target: { value: v } });

beforeEach(() => {
  localStorage.clear();
  store().resetDemo();
});

describe('Tab Grup', () => {
  it('daftar awal hanya memuat grup dipantau dan ada petunjuk pencarian', () => {
    render(<GrupTab />);
    expect(screen.getByRole('heading', { name: /Grup dipantau/ })).toBeInTheDocument();
    expect(screen.getByText('SITREP PAM ANDALAS')).toBeInTheDocument();
    expect(screen.queryByText('PAM NATARU 2026')).toBeNull();
    expect(screen.getByText(/minimal 3 huruf\)/)).toBeInTheDocument();
  });

  it('cari: kurang dari 3 huruf memberi petunjuk, 3 huruf ke atas memuat grup yang belum dipantau', () => {
    render(<GrupTab />);
    search('zz');
    expect(screen.getByText('Ketik minimal 3 huruf untuk mencari.')).toBeInTheDocument();
    expect(screen.getByText(/Tidak ada grup dipantau yang cocok dengan “zz”/)).toBeInTheDocument();
    search('nataru');
    expect(screen.getByText('PAM NATARU 2026')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Pantau PAM NATARU 2026' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Tidak dipantau')).toBeInTheDocument();
  });

  it('Pantau wajib memilih wilayah kerja, lalu grup masuk daftar dengan toast', () => {
    render(<GrupTab />);
    search('nataru');
    fireEvent.click(screen.getByRole('switch', { name: 'Pantau PAM NATARU 2026' }));
    const dlg = screen.getByRole('dialog', { name: 'Pantau "PAM NATARU 2026"?' });
    expect(within(dlg).getByText(/Mulai dibaca sejak sekarang/)).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Pantau grup' }));
    expect(within(dlg).getByRole('alert')).toHaveTextContent('Pilih wilayah kerja untuk grup ini.');
    expect(store().waGroups.find((g) => g.id === 'G2')?.monitored).toBe(false);
    pickWk('WK Rokan');
    expect(within(dlg).getByText('Wilayah kerja ini belum punya area')).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Pantau grup' }));
    const g = store().waGroups.find((x) => x.id === 'G2');
    expect(g).toMatchObject({ monitored: true, wk: 'WK Rokan' });
    expect(screen.getByText('PAM NATARU 2026 mulai dipantau')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('area opsional muncul untuk wilayah kerja yang punya area', () => {
    render(<GrupTab />);
    search('keluarga');
    fireEvent.click(screen.getByRole('switch', { name: 'Pantau Keluarga Pos 4' }));
    pickWk('WK Andalas Darat');
    fireEvent.click(screen.getByLabelText(/Area/));
    fireEvent.click(screen.getByRole('option', { name: 'Muara Enim' }));
    fireEvent.change(screen.getByLabelText(/^Tag/), { target: { value: 'Ring 1' } });
    fireEvent.keyDown(screen.getByLabelText(/^Tag/), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Pantau grup' }));
    expect(store().waGroups.find((x) => x.id === 'G4')).toMatchObject({ monitored: true, area: 'Muara Enim', tags: ['Ring 1'] });
  });

  it('Ubah menyimpan wilayah kerja, area, dan keterangan', () => {
    render(<GrupTab />);
    fireEvent.click(screen.getByRole('button', { name: 'Ubah Koordinasi Polsek' }));
    const dlg = screen.getByRole('dialog', { name: 'Ubah "Koordinasi Polsek"' });
    pickWk('WK Batu Ampar');
    fireEvent.change(within(dlg).getByLabelText(/Keterangan/), { target: { value: 'Koordinasi harian' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Simpan' }));
    expect(store().waGroups.find((x) => x.id === 'G3')).toMatchObject({ wk: 'WK Batu Ampar', description: 'Koordinasi harian', monitored: true });
  });

  it('Anggota: panel terbuka dari nama grup, nomor disamarkan, bisa dicari', () => {
    render(<GrupTab />);
    fireEvent.click(screen.getByRole('link', { name: 'Koordinasi Polsek' }));
    const panel = screen.getByRole('dialog', { name: 'Anggota Koordinasi Polsek' });
    expect(within(panel).getByText('Nomor ini')).toBeInTheDocument();
    expect(within(panel).getByText('PERISAI')).toBeInTheDocument();
    expect(within(panel).getByText('+62 812-****-1111')).toBeInTheDocument();
    expect(within(panel).getByText(/3 anggota/)).toBeInTheDocument();
    fireEvent.change(within(panel).getByLabelText('Cari nama anggota'), { target: { value: 'intel' } });
    expect(within(panel).getByText('Kanit Intel')).toBeInTheDocument();
    expect(within(panel).queryByText('Kapolsek Babat')).toBeNull();
  });

  it('Berhenti memantau: konfirmasi, grup hilang dari daftar, pesan lama tetap', () => {
    const before = store().waMessages.length;
    render(<GrupTab />);
    fireEvent.click(screen.getByRole('switch', { name: 'Pantau SITREP PAM ADR' }));
    const dlg = screen.getByRole('dialog', { name: 'Berhenti memantau "SITREP PAM ADR"?' });
    expect(within(dlg).getByText(/Pesan yang sudah masuk tetap ada di Pesan masuk/)).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Berhenti memantau' }));
    expect(store().waGroups.find((x) => x.id === 'G6')?.monitored).toBe(false);
    expect(screen.queryByRole('link', { name: 'SITREP PAM ADR' })).toBeNull();
    expect(store().waMessages.length).toBe(before);
  });

  it('grup baru bertanda Baru; grup yang nomornya dikeluarkan menampilkan keterangan dan tidak bisa dipantau', () => {
    render(<GrupTab />);
    apply((s) => simulateNewGroup(s, 'N1', 'Grup baru 7'));
    expect(screen.getByRole('link', { name: 'Grup baru 7' })).toBeInTheDocument();
    expect(screen.getByText('Baru')).toBeInTheDocument();
    apply((s) => simulateRemoved(s, 'G5'));
    expect(screen.getByText('Nomor bukan anggota lagi')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Pantau Pam ADR Area 2' })).toBeDisabled();
  });
});
