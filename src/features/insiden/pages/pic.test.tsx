import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { approve } from '@/services/mock/workflow';
import { saveClosure } from '@/services/mock/workflow.handling';
import { PicHandlingPage } from './PicHandlingPage';

const NO = 'INS-SEN-2026-0007';
const inc = () => useDemoStore.getState().incidents.find((i) => i.no === NO)!;

function Landing() {
  const loc = useLocation();
  return <div>detail:{loc.pathname}|{(loc.state as { toast?: string } | null)?.toast}</div>;
}
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/insiden/:no/tangani" element={<PicHandlingPage />} />
        <Route path="/insiden/:no" element={<PicHandlingPage />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </MemoryRouter>,
  );

function approveAs(kind: 'perorangan' | 'grup' = 'perorangan') {
  useDemoStore.getState().decide((s) =>
    approve(s, NO, {
      by: 'Sari Wulandari', category: 'Pencurian/Perampokan', severity: 'tinggi', priority: 'tinggi', picKind: kind, steps: [],
      pic: kind === 'grup' ? 'Tim Pengamanan ADR Area 2' : 'Andi Pratama',
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDemoStore.getState().setRole('pic');
  approveAs();
});

describe('Halaman kerja PIC', () => {
  it('Simpan catatan menambah catatan ke store dan Riwayat', () => {
    renderAt(`/insiden/${NO}/tangani`);
    expect(screen.getByRole('button', { name: 'Simpan catatan' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Catatan penanganan'), { target: { value: 'Gembok diganti.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan catatan' }));
    expect(inc().handling?.notes.map((n) => n.text)).toEqual(['Gembok diganti.']);
    expect(screen.getByText('Gembok diganti.')).toBeInTheDocument();
    expect(screen.getByText('Catatan ditambahkan ke Riwayat')).toBeInTheDocument();
  });

  it('Ajukan penutupan tanpa Tim terlibat menampilkan PS6 dan status tetap', () => {
    useDemoStore.getState().decide((s) =>
      saveClosure(s, NO, 'Andi Pratama', {
        actions: 'Kabel diganti.', cause: 'Celah pengamanan fisik', factors: ['Celah pagar'], evidence: [{ name: 'a.jpg', sizeKb: 10, caption: '' }],
      }),
    );
    renderAt(`/insiden/${NO}/tangani`);
    expect(screen.getByText('4 dari 6 isian wajib')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ajukan penutupan/ }));
    expect(screen.getByText('Lengkapi Tim terlibat sebelum menutup insiden.')).toBeInTheDocument();
    expect(inc().status).toBe('dalam-penanganan');
  });

  it('Ajukan penutupan lengkap mengubah status jadi minta-ditutup dan membuka tampilan P17 dengan toast', () => {
    useDemoStore.getState().decide((s) =>
      saveClosure(s, NO, 'Andi Pratama', {
        actions: 'Kabel diganti.', partners: ['bujp'], partnerNames: ['PT Garda Nusantara Sejahtera · BUJP'], cause: 'Celah pengamanan fisik',
        factors: ['Celah pagar'], evidence: [{ name: 'a.jpg', sizeKb: 10, caption: '' }], result: 'tidak-ada',
      }),
    );
    renderAt(`/insiden/${NO}/tangani`);
    fireEvent.click(screen.getByRole('button', { name: /Ajukan penutupan/ }));
    expect(inc().status).toBe('minta-ditutup');
    expect(screen.getByText('Penutupan diajukan ke 3 Pejabat Berwenang')).toBeInTheDocument();
    expect(screen.getByText(/Menunggu ditutup oleh Pejabat Berwenang [(]3[)]/)).toBeInTheDocument();
  });

  it('Eskalasi butuh alasan; dengan alasan insiden ditandai dieskalasi', () => {
    renderAt(`/insiden/${NO}`);
    fireEvent.click(screen.getByRole('button', { name: /Eskalasi/ }));
    const dlg = screen.getByRole('dialog', { name: 'Eskalasi insiden' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Eskalasi' }));
    expect(within(dlg).getByText('Isi alasan eskalasi.')).toBeInTheDocument();
    expect(inc().escalated).toBeFalsy();
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Butuh keputusan pengadaan.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Eskalasi' }));
    expect(inc().escalated).toBe(true);
    expect(inc().handling?.escalatedTo).toBe('pejabat');
  });

  it('PIC grup: Ambil alih menjadikan anggota PIC', () => {
    useDemoStore.getState().resetDemo();
    useDemoStore.getState().setRole('pic');
    approveAs('grup');
    renderAt(`/insiden/${NO}`);
    expect(screen.getByText('Butuh penanganan dari tim Anda')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ambil alih penanganan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ya, ambil alih' }));
    expect(inc().handling?.takenBy).toBe('Andi Pratama');
    expect(screen.getByText('Butuh penanganan dari Anda')).toBeInTheDocument();
  });

  it('anggota grup lain hanya melihat; Budi (pelapor) PIC INS-0002 dengan state lewat-tenggat', () => {
    useDemoStore.getState().resetDemo();
    useDemoStore.getState().setRole('pic');
    approveAs('grup');
    useDemoStore.setState((s) => ({
      incidents: s.incidents.map((i) => (i.no === NO ? { ...i, handling: { notes: [], directives: [], takenBy: 'Dedi Kurniawan' } } : i)),
    }));
    const { unmount } = renderAt(`/insiden/${NO}`);
    expect(screen.getByText(/Anda hanya bisa melihat/)).toBeInTheDocument();
    unmount();
    useDemoStore.getState().setRole('pelapor');
    renderAt('/insiden/INS-SEN-2026-0002?state=lewat-tenggat');
    expect(screen.getByText('Eskalasi otomatis ke Sari Wulandari')).toBeInTheDocument();
    expect(screen.getAllByText(/lewat 2 hari/).length).toBeGreaterThan(0);
  });
});
