import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MobileReportStep1Page } from './MobileReportStep1Page';
import { MobileReportStep2Page } from './MobileReportStep2Page';
import { MitraSheet } from './sheets';
import { MOBILE_FORM_A } from '../registry/formA';
import { useDemoStore } from '@/services/mock/store';
import { useDraftStore } from '@/features/insiden/logic/draft';
import { useCopilotStore } from '@/features/insiden/copilot/copilotStore';

const renderPage = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDraftStore.getState().resetDraft();
  useCopilotStore.getState().reset(false);
});

describe('form lapor mobile · langkah 1', () => {
  it('terdaftar pada rute temuan dan kejadian', () => {
    expect(MOBILE_FORM_A['/insiden/baru/temuan']).toBe(MobileReportStep1Page);
    expect(MOBILE_FORM_A['/insiden/baru/kejadian']).toBe(MobileReportStep2Page);
  });

  it('jawaban Ya mengunci kartu Kerawanan', () => {
    renderPage(<MobileReportStep1Page />);
    fireEvent.click(screen.getByRole('radio', { name: 'Ya' }));
    expect(screen.getByRole('radio', { name: /Kerawanan/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('radio', { name: /Insiden/ })).toHaveAttribute('aria-checked', 'true');
    expect(useDraftStore.getState().draft.hasImpact).toBe('ya');
    fireEvent.click(screen.getByRole('radio', { name: /Kerawanan/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(useDraftStore.getState().draft.kind).toBe('insiden');
  });

  it('jawaban Tidak menandai Kerawanan sebagai Saran; memilihnya meminta konfirmasi lalu mengosongkan dampak', () => {
    useDraftStore.getState().patch({ securityImpact: 'Kabel hilang', axes: ['prop'] });
    renderPage(<MobileReportStep1Page />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tidak' }));
    expect(screen.getByText('Saran')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /Kerawanan/ }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText('Jadikan kerawanan?')).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Jadikan kerawanan' }));
    const d = useDraftStore.getState().draft;
    expect(d.kind).toBe('kerawanan');
    expect(d.securityImpact).toBe('');
    expect(d.axes).toEqual([]);
  });

  it('Berikutnya tanpa isian wajib menampilkan galat', () => {
    renderPage(<MobileReportStep1Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    expect(screen.getByText('Judul wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Pilih lokasi kejadian.')).toBeInTheDocument();
  });

  it('mikrofon tidak tersedia menampilkan peringatan izin (MS17)', () => {
    renderPage(<MobileReportStep1Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Rekam suara' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Izin mikrofon belum diberikan');
  });

  it('cerita demo ke Copilot lalu Pakai semua mengisi judul dan waktu di draf', async () => {
    renderPage(<MobileReportStep1Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }));
    const all = await screen.findByRole('button', { name: /Pakai semua/ }, { timeout: 4000 });
    fireEvent.click(all);
    const d = useDraftStore.getState().draft;
    expect(d.title).not.toBe('');
    expect(d.date).not.toBe('');
    expect(d.time).not.toBe('');
    expect(d.aiFilled).toEqual(expect.arrayContaining(['title', 'time']));
    fireEvent.click(screen.getByRole('button', { name: 'Lihat form' }));
    expect(screen.getByText(/AI mengisi/)).toBeInTheDocument();
  }, 8000);
});

describe('form lapor mobile · langkah 2', () => {
  it('sumbu dampak menampilkan grup sesuai dan operasi berhenti memberi keparahan Tinggi', () => {
    renderPage(<MobileReportStep2Page />);
    expect(screen.queryByText('Kondisi operasi')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Properti atau operasi' }));
    expect(screen.getByText('Kondisi operasi')).toBeInTheDocument();
    expect(screen.queryByText('Kondisi korban')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Berhenti' }));
    fireEvent.change(screen.getByLabelText('Berapa lama operasi berhenti?'), { target: { value: '6' } });
    const sev = document.querySelector('.in-sevauto')!;
    expect(sev).toHaveTextContent('Tinggi');
    expect(sev).toHaveTextContent('Otomatis');
    expect(screen.getByText('SKK Migas langsung diberi tahu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Manusia' }));
    expect(screen.getByText('Kondisi korban')).toBeInTheDocument();
  });

  it('sheet kategori memilih kategori dan menerapkannya ke draf', () => {
    renderPage(<MobileReportStep2Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Kategori' }));
    const dlg = screen.getByRole('dialog', { name: 'Kategori' });
    expect(within(dlg).getAllByRole('option')).toHaveLength(19);
    fireEvent.change(within(dlg).getByLabelText('Cari kategori'), { target: { value: 'sabot' } });
    fireEvent.click(within(dlg).getByRole('option', { name: /Sabotase/ }));
    fireEvent.click(within(dlg).getByRole('button', { name: 'Terapkan' }));
    expect(useDraftStore.getState().draft.category).toBe('Sabotase');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Kategori' })).toHaveTextContent('Sabotase');
  });

  it('Pencurian minyak membuka sheet Jenis', () => {
    useDraftStore.getState().patch({ category: 'Pencurian minyak' });
    renderPage(<MobileReportStep2Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Jenis' }));
    const dlg = screen.getByRole('dialog', { name: 'Jenis' });
    fireEvent.click(within(dlg).getByRole('option', { name: /Tapping/ }));
    fireEvent.click(within(dlg).getByRole('button', { name: 'Terapkan' }));
    expect(useDraftStore.getState().draft.jenis).toBe('Tapping');
  });

  it('Berikutnya tanpa isian menampilkan banner galat', () => {
    renderPage(<MobileReportStep2Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    expect(screen.getByText(/isian belum lengkap/)).toBeInTheDocument();
    expect(screen.getByText('Pilih kategori kejadian.')).toBeInTheDocument();
  });
});

describe('sheet Tim terlibat (M3)', () => {
  it('memilih mitra dan menyimpan', () => {
    let saved: string[] = [];
    renderPage(<MitraSheet wk="WK Andalas Darat" selected={[]} onSave={(n) => { saved = n; }} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /PT Garda Nusantara Sejahtera/ }));
    fireEvent.click(screen.getByRole('button', { name: /Simpan · 1 dipilih/ }));
    expect(saved).toEqual(['PT Garda Nusantara Sejahtera · BUJP']);
  });
});
