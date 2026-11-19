import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Adapter AI nyata (mock) tanpa jeda 1,4 detik
vi.mock('@/services/ai', async () => {
  const m = await import('@/services/ai/mock');
  return {
    ai: { extract: async (s: string, o?: { now?: string }) => m.extractStory(s, o?.now), isOutOfScope: m.mockAi.isOutOfScope },
    claudeActive: () => false,
    forceMockAi: vi.fn(),
  };
});

import { ai } from '@/services/ai';
import { extractStory } from '@/services/ai/mock';
import { CopilotPanel } from './CopilotPanel';
import { useCopilotStore } from './copilotStore';
import { localIso } from './interview';
import { useDraftStore } from '../logic/draft';
import { STORY_FIXTURES, OUT_OF_SCOPE_MESSAGES } from '@/services/ai/fixtures';

const story = (id: string) => STORY_FIXTURES.find((f) => f.id === id)!.story;
const draft = () => useDraftStore.getState().draft;
const renderPanel = (step: 1 | 2 = 1) => render(<MemoryRouter><CopilotPanel step={step} /></MemoryRouter>);
const send = (text: string) => {
  fireEvent.change(screen.getByLabelText('Ceritakan kejadian'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Kirim' }));
};

describe('AI Copilot · percakapan', () => {
  beforeEach(() => {
    useCopilotStore.getState().reset(false);
    useDraftStore.getState().resetDraft();
  });

  it('cerita kabel ADR-07 langkah 1: Pakai semua mengisi jenis, waktu, judul, patokan dengan tag AI', async () => {
    renderPanel();
    send(story('kabel-adr07'));
    fireEvent.click(await screen.findByRole('button', { name: /Pakai semua yang tersisa/ }));
    expect(draft()).toMatchObject({ kind: 'insiden', hasImpact: 'ya', date: localIso().slice(0, 10), time: '01:00', title: 'Pencurian kabel listrik sumur ADR-07', patokan: 'Sumur ADR-07, sisi panel listrik' });
    expect(draft().aiFilled).toEqual(expect.arrayContaining(['kind', 'time', 'title', 'patokan']));
  });

  it('langkah 2: saran dampak, operasi, korban, kerugian dan penanganan masuk ke draf', async () => {
    renderPanel(2);
    send(story('kabel-adr07'));
    fireEvent.click(await screen.findByRole('button', { name: /Pakai semua yang tersisa/ }));
    expect(draft()).toMatchObject({ category: 'Pencurian/Perampokan', ops: 'berhenti', opsHours: 6, lossIdr: 18_500_000, handledBy: ['bujp'] });
    expect(draft().axes).toContain('prop');
  });

  it('cerita tanpa dampak disarankan sebagai Kerawanan', async () => {
    renderPanel();
    send(story('pagar-roboh'));
    const card = (await screen.findByText('JENIS LAPORAN')).closest('.cp-s') as HTMLElement;
    expect(within(card).getByText('Kerawanan')).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: /Pakai/ }));
    expect(draft()).toMatchObject({ kind: 'kerawanan', hasImpact: 'tidak' });
  });

  it('Tidak membiarkan isian kosong; Batalkan mengosongkan isian yang tadi dipakai', async () => {
    renderPanel();
    send(story('kabel-adr07'));
    const judul = (await screen.findByText('JUDUL')).closest('.cp-s') as HTMLElement;
    fireEvent.click(within(judul).getByRole('button', { name: /Pakai/ }));
    expect(draft().title).toBe('Pencurian kabel listrik sumur ADR-07');
    fireEvent.click(within(judul).getByRole('button', { name: 'Batalkan' }));
    expect(draft().title).toBe('');
    fireEvent.click(within(judul).getByRole('button', { name: /Tidak/ }));
    expect(draft().title).toBe('');
    expect(within(judul).getByText(/Isian dibiarkan kosong/)).toBeInTheDocument();
  });

  it('cerita terlalu pendek: tidak ada saran dan pelapor diminta menambah cerita (S23)', async () => {
    renderPanel();
    send(story('ambigu'));
    expect(await screen.findByText(/Saya belum menemukan isian/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pakai semua/ })).not.toBeInTheDocument();
    expect(draft().title).toBe('');
  });

  it.each(OUT_OF_SCOPE_MESSAGES)('pertanyaan di luar cakupan dijawab dengan penolakan sopan: %s', async (q) => {
    renderPanel();
    send(story('kabel-adr07'));
    await screen.findByRole('button', { name: /Pakai semua yang tersisa/ });
    send(q);
    await waitFor(() => expect(screen.getByText(/belum bisa saya bantu/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Lanjut isi form' })).toBeInTheDocument();
  });

  it('Mulai ulang menghapus percakapan tetapi isian yang sudah dipakai tetap ada', async () => {
    renderPanel();
    send(story('kabel-adr07'));
    const judul = (await screen.findByText('JUDUL')).closest('.cp-s') as HTMLElement;
    fireEvent.click(within(judul).getByRole('button', { name: /Pakai/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Mulai ulang percakapan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mulai ulang' }));
    expect(screen.getByText('Ceritakan kejadianmu di sini')).toBeInTheDocument();
    expect(draft().title).toBe('Pencurian kabel listrik sumur ADR-07');
  });

  it('kirim tanpa mengetik memakai cerita demo kabel ADR-07', async () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }));
    expect(await screen.findByText(/Pencurian kabel listrik sumur ADR-07/)).toBeInTheDocument();
  });
});

describe('AI Copilot · wawancara sampai semua isian wajib terisi', () => {
  beforeEach(() => {
    useCopilotStore.getState().reset(false);
    useDraftStore.getState().resetDraft();
  });
  const header = () => screen.getAllByText(/Terisi \d+ dari \d+ isian wajib/)[0].textContent;
  const chip = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

  it('cerita kecelakaan kerja (Budi): kartu saran, peringatan K3, titik peta, peringatan WK, lalu ringkasan dan Periksa form', async () => {
    renderPanel();
    send(story('k3-wellpad-rokan'));
    // isian yang tersirat di cerita langsung jadi kartu; kategori tidak (ditanya dulu karena K3)
    await screen.findByText('JENIS LAPORAN');
    for (const k of ['WAKTU KEJADIAN', 'YANG TERDAMPAK', 'KORBAN', 'KRONOLOGI SINGKAT']) expect(screen.getByText(k)).toBeInTheDocument();
    expect(screen.queryByText(/^KATEGORI/)).not.toBeInTheDocument();
    expect(within(screen.getByText('KORBAN').closest('.cp-s') as HTMLElement).getByText(/Klinik atau rumah sakit · 1 orang/)).toBeInTheDocument();
    expect(within(screen.getByText('YANG TERDAMPAK').closest('.cp-s') as HTMLElement).getByText(/Manusia/)).toBeInTheDocument();
    expect(screen.getByText(/Ini terdengar seperti kecelakaan kerja\. Kategori K3 belum dipastikan masuk PERISAI\. Tetap catat\?/)).toBeInTheDocument();
    expect(header()).toBe('Terisi 0 dari 6 isian wajib');

    fireEvent.click(screen.getByRole('button', { name: /Pakai semua yang tersisa/ }));
    expect(draft()).toMatchObject({ kind: 'insiden', hasImpact: 'ya', time: '09:00', axes: ['man'], casualties: { klinik: 1 } });
    expect(draft().date).toBe(localIso().slice(0, 10));
    expect(draft().ongoing).toBe(false);
    expect(header()).toBe('Terisi 5 dari 7 isian wajib');

    chip('Ya');
    expect(draft().category).toBe('Kecelakaan kerja');
    expect(screen.getByText(/Cerita menyebut Wellpad Blok Rokan\./)).toBeInTheDocument();

    // lokasi: pilih di peta (titik bawaan di WK Andalas Darat) → cerita menyebut Blok Rokan → peringatan WK
    chip('Buka peta');
    fireEvent.click(screen.getByRole('button', { name: 'Pilih lokasi ini' }));
    expect(draft()).toMatchObject({ wk: 'WK Andalas Darat' });
    expect(await screen.findByText('Cerita menyebut Blok Rokan, titik di peta masuk WK Andalas Darat. Mana yang benar?')).toBeInTheDocument();
    chip('Pakai titik peta');

    expect(header()).toBe('Terisi 7 dari 7 isian wajib');
    expect(screen.getByText('Semua isian wajib sudah terisi.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Periksa form' })).toBeInTheDocument();
    expect(screen.getByText('Kecelakaan kerja')).toBeInTheDocument();
  });

  it('isian ditolak (Tidak) lalu ditanyakan dengan chip; Lewati menolak isian dan ringkasan menandainya', async () => {
    renderPanel();
    send(story('k3-wellpad-rokan'));
    const korban = (await screen.findByText('KORBAN')).closest('.cp-s') as HTMLElement;
    fireEvent.click(within(korban).getByRole('button', { name: /Tidak/ }));
    fireEvent.click(screen.getByRole('button', { name: /Pakai semua yang tersisa/ }));
    chip('Ya'); // K3
    chip('Isi sendiri di form'); // lokasi
    // satu pertanyaan per pesan: kondisi korban dengan lima chip jawaban cepat
    expect(screen.getByText('Bagaimana kondisi korbannya?')).toBeInTheDocument();
    for (const l of ['Luka ringan, P3K', 'Dibawa ke klinik atau RS', 'Luka berat atau cacat', 'Meninggal', 'Belum diketahui']) {
      expect(screen.getByRole('button', { name: l })).toBeInTheDocument();
    }
    chip('Luka berat atau cacat');
    expect(draft().casualties).toEqual({ berat: 1 });
    expect(screen.getByText('Semua isian wajib sudah terisi atau Anda lewati.')).toBeInTheDocument();
    expect(screen.getByText('Dilewati')).toBeInTheDocument();
    expect(header()).toBe('Terisi 6 dari 7 isian wajib');
  });

  it('jawaban diketik untuk pertanyaan terbuka (jam) mengisi waktu', async () => {
    renderPanel();
    send('Pekerja terjatuh dari tangga di sumur ADR-07, luka ringan dan sudah diberi P3K.');
    await screen.findByText('JENIS LAPORAN');
    fireEvent.click(screen.getByRole('button', { name: /Pakai semua yang tersisa/ }));
    chip('Ya'); // peringatan K3
    expect(screen.getByText(/Kapan kejadiannya\?/)).toBeInTheDocument();
    send('jam 6.30 pagi');
    await waitFor(() => expect(draft()).toMatchObject({ time: '06:30' }));
  });

  it('kutipan "dari cerita" memuat potongan teks asli; bila bukan potongan cerita, barisnya disembunyikan', async () => {
    const real = extractStory(story('kabel-adr07'));
    vi.spyOn(ai, 'extract').mockResolvedValueOnce({
      ...real, title: { value: 'Judul karangan', src: 'kalimat yang tidak ada di cerita', confidence: 'md' },
    });
    renderPanel();
    send(story('kabel-adr07'));
    const judul = (await screen.findByText('JUDUL')).closest('.cp-s') as HTMLElement;
    expect(within(judul).queryByText(/dari cerita/)).not.toBeInTheDocument();
    const jenis = screen.getByText('JENIS LAPORAN').closest('.cp-s') as HTMLElement;
    const quote = within(jenis).getByText(/dari cerita:/).textContent!.replace(/^dari cerita: “|”$/g, '');
    expect(story('kabel-adr07')).toContain(quote);
  });
});
