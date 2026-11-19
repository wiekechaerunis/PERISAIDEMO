import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { approve } from '@/services/mock/workflow';
import { closureDemoIncident, CLOSURE_DEMO_NO } from '@/services/mock/seedClosure';
import { MobileHandlingDetail } from './MobileHandlingDetail';

const NO = 'INS-SEN-2026-0007';
const get = (no: string) => useDemoStore.getState().incidents.find((i) => i.no === no)!;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/insiden/:no" element={<MobileHandlingDetail />} />
        <Route path="*" element={<div>lain</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
});

describe('Mobile · PIC (MP2, MP3, MP4)', () => {
  beforeEach(() => {
    useDemoStore.getState().setRole('pic');
    useDemoStore.getState().decide((s) =>
      approve(s, NO, { by: 'Sari Wulandari', category: 'Pencurian/Perampokan', severity: 'tinggi', priority: 'tinggi', picKind: 'perorangan', pic: 'Andi Pratama', steps: [] }),
    );
  });

  it('PIC melihat detail Penanganan (MP2) lalu menyimpan catatan di layar Tangani (MP3)', () => {
    renderAt(`/insiden/${NO}`);
    expect(screen.getByText('Butuh penanganan dari Anda')).toBeInTheDocument();
    expect(screen.getByText('Sebelum ajukan penutupan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tangani insiden/ }));
    expect(screen.getByText('Catatan penanganan')).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Simpan catatan' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Catatan penanganan'), { target: { value: 'Gembok diganti.' } });
    fireEvent.click(save);
    expect(get(NO).handling?.notes.map((n) => n.text)).toEqual(['Gembok diganti.']);
    expect(screen.getByText('Catatan ditambahkan ke Riwayat')).toBeInTheDocument();
  });

  it('Ajukan penutupan tanpa data lengkap ditolak; status tetap', () => {
    renderAt(`/insiden/${NO}?langkah=penutupan`);
    fireEvent.click(screen.getByRole('button', { name: /Ajukan penutupan/ }));
    expect(screen.getAllByText(/Lengkapi Ringkasan penanganan/).length).toBeGreaterThan(0);
    expect(get(NO).status).toBe('dalam-penanganan');
  });

  it('Sheet Eskalasi butuh alasan', () => {
    renderAt(`/insiden/${NO}`);
    fireEvent.click(screen.getByRole('button', { name: 'Aksi lain' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Eskalasi' }));
    const dlg = screen.getByRole('dialog', { name: 'Eskalasi insiden' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Eskalasi' }));
    expect(within(dlg).getByText('Isi alasan eskalasi.')).toBeInTheDocument();
    expect(get(NO).escalated).toBeFalsy();
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Butuh keputusan pengadaan kabel lapis baja.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Eskalasi' }));
    expect(get(NO).escalated).toBe(true);
    expect(get(NO).handling?.escalatedTo).toBe('pejabat');
    expect(screen.getByText('Insiden dieskalasi ke Rudi Hartono.')).toBeInTheDocument();
  });
});

describe('Mobile · Pejabat (MP5, MP6)', () => {
  beforeEach(() => {
    useDemoStore.getState().setRole('pejabat');
    useDemoStore.getState().addIncident(closureDemoIncident());
  });

  it('Tutup lewat sheet mengubah status jadi ditutup', () => {
    renderAt(`/insiden/${CLOSURE_DEMO_NO}`);
    fireEvent.click(screen.getByRole('button', { name: /Tutup insiden/ }));
    const dlg = screen.getByRole('dialog', { name: 'Tutup insiden ini?' });
    expect(within(dlg).getByText('Kontrak mitra yang terlibat')).toBeInTheDocument();
    expect(within(dlg).getByText('3 tindak lanjut belum selesai')).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Tutup insiden' }));
    expect(get(CLOSURE_DEMO_NO).status).toBe('ditutup');
    expect(get(CLOSURE_DEMO_NO).handling?.closure?.closedBy).toBe('Sari Wulandari');
    expect(screen.getByText(`Insiden ${CLOSURE_DEMO_NO} ditutup`)).toBeInTheDocument();
  });

  it('Ubah tenggat ke masa lalu ditolak; tanggal valid tersimpan', () => {
    renderAt(`/insiden/${CLOSURE_DEMO_NO}`);
    const before = get(CLOSURE_DEMO_NO).handleDueAt;
    fireEvent.click(screen.getByRole('button', { name: 'Aksi lain' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ubah tenggat' }));
    const dlg = screen.getByRole('dialog', { name: /tenggat/i });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Bulan sebelumnya' }));
    fireEvent.click(within(dlg).getByRole('button', { name: '5 Oktober 2026' }));
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Penyelidikan Polsek butuh 2 minggu.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Simpan tenggat' }));
    expect(within(dlg).getByText('Pilih tenggat setelah hari ini.')).toBeInTheDocument();
    expect(get(CLOSURE_DEMO_NO).handleDueAt).toBe(before);

    fireEvent.click(within(dlg).getByRole('button', { name: 'Bulan berikutnya' }));
    fireEvent.click(within(dlg).getByRole('button', { name: '14 November 2026' }));
    fireEvent.click(within(dlg).getByRole('button', { name: 'Simpan tenggat' }));
    expect(get(CLOSURE_DEMO_NO).handleDueAt?.slice(0, 10)).toBe('2026-11-14');
    expect(screen.getByText('Tenggat penanganan diubah ke 14 Nov 2026.')).toBeInTheDocument();
  });

  it('Kembalikan ke PIC butuh alasan lalu status Dalam penanganan', () => {
    renderAt(`/insiden/${CLOSURE_DEMO_NO}`);
    fireEvent.click(screen.getByRole('button', { name: 'Aksi lain' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Kembalikan ke PIC' }));
    const dlg = screen.getByRole('dialog', { name: 'Kembalikan ke PIC?' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Kembalikan' }));
    expect(within(dlg).getByText('Tulis alasan.')).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Lampirkan berita acara resmi.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Kembalikan' }));
    expect(get(CLOSURE_DEMO_NO).status).toBe('dalam-penanganan');
  });
});

describe('Mobile · SKK', () => {
  it('Beri arahan menambah arahan; teks kosong ditolak', () => {
    useDemoStore.getState().setRole('pengawas');
    useDemoStore.getState().addIncident(closureDemoIncident());
    renderAt(`/insiden/${CLOSURE_DEMO_NO}`);
    expect(screen.queryByRole('button', { name: 'Aksi lain' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Beri arahan' }));
    const dlg = screen.getByRole('dialog', { name: 'Beri arahan' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Kirim arahan' }));
    expect(within(dlg).getByText('Tulis arahan untuk PIC.')).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText(/Arahan/), { target: { value: 'Koordinasikan patroli gabungan.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Kirim arahan' }));
    expect(get(CLOSURE_DEMO_NO).handling?.directives.map((d) => d.text)).toEqual(['Koordinasikan patroli gabungan.']);
    expect(screen.getByText('Arahan terkirim. PIC dan Pejabat Berwenang diberi tahu.')).toBeInTheDocument();
  });
});
