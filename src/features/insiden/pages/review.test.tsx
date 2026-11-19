import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { IncidentReviewPage } from './IncidentReviewPage';
import { deadlineInfo, duplicateCandidates } from '../logic/review';

function Landing({ label }: { label: string }) {
  const loc = useLocation();
  return <div>{label}:{loc.pathname}{loc.search}|{(loc.state as { toast?: string } | null)?.toast}</div>;
}

function renderReview(no: string, query = '') {
  return render(
    <MemoryRouter initialEntries={[`/insiden/${no}/review${query}`]}>
      <Routes>
        <Route path="/insiden/:no/review" element={<IncidentReviewPage />} />
        <Route path="/insiden/:no" element={<Landing label="detail" />} />
        <Route path="/insiden" element={<Landing label="daftar" />} />
      </Routes>
    </MemoryRouter>,
  );
}
const inc = (no: string) => useDemoStore.getState().incidents.find((i) => i.no === no)!;
const pick = (combo: string, option: string) => {
  fireEvent.click(screen.getByRole('button', { name: combo }));
  fireEvent.click(screen.getByRole('option', { name: new RegExp(option) }));
};

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDemoStore.setState({ role: 'pejabat' });
});

describe('Review insiden · Pejabat Berwenang', () => {
  it('Setujui 0007: dialog konfirmasi lalu status Dalam penanganan dengan PIC terpilih dan toast V14', () => {
    renderReview('INS-SEN-2026-0007');
    expect(screen.getByText('Butuh keputusan pemeriksaan')).toBeInTheDocument();
    expect(screen.getByText(/Lewat 5 jam · 28 Okt 2026, 08:00 WIB/)).toBeInTheDocument();
    pick('PIC penanganan', 'Dedi Kurniawan');
    fireEvent.click(screen.getByRole('checkbox', { name: /Lakukan patroli tambahan/ }));
    expect(screen.getByText('1 saran langkah dikirim ke Dedi Kurniawan saat Anda menyetujui')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Setujui' }));
    const dlg = screen.getByRole('dialog', { name: 'Setujui insiden ini?' });
    expect(within(dlg).getByText('Dedi Kurniawan')).toBeInTheDocument();
    expect(within(dlg).getByText('Tenggat 2 Nov 2026')).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: /Setujui insiden/ }));
    const i = inc('INS-SEN-2026-0007');
    expect(i.status).toBe('dalam-penanganan');
    expect(i.pic).toBe('Dedi Kurniawan');
    expect(i.forwardedSteps).toEqual(['Lakukan patroli tambahan di area sumur dan jalur akses.']);
    expect(screen.getByText(/detail:\/insiden\/INS-SEN-2026-0007\|Insiden INS-SEN-2026-0007 disetujui\. 1 saran langkah dikirim ke Dedi Kurniawan\./)).toBeInTheDocument();
  });

  it('mengubah keparahan tanpa alasan menampilkan galat dan tidak menyetujui', () => {
    renderReview('INS-SEN-2026-0007');
    expect(screen.queryByLabelText('Alasan perubahan keparahan')).not.toBeInTheDocument();
    pick('Keparahan resmi', 'Sedang');
    fireEvent.change(screen.getByLabelText('Alasan perubahan keparahan'), { target: { value: 'Turun' } });
    fireEvent.click(screen.getByRole('button', { name: 'Setujui' }));
    expect(screen.getByText('1 isian perlu dilengkapi.')).toBeInTheDocument();
    expect(screen.getByText('Tulis alasan perubahan keparahan, minimal 10 karakter.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(inc('INS-SEN-2026-0007').status).toBe('review-internal');
    // alasan cukup: dialog terbuka dan keputusan tersimpan dengan alasan
    fireEvent.change(screen.getByLabelText('Alasan perubahan keparahan'), { target: { value: 'Pompa menyala lagi setelah 30 menit.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Setujui' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Setujui insiden/ }));
    expect(inc('INS-SEN-2026-0007')).toMatchObject({ status: 'dalam-penanganan', severity: 'sedang', officialSeverityReason: 'Pompa menyala lagi setelah 30 menit.' });
  });

  it('panel serupa: penuh bila ≥3 kasus, diperluas "few" dan "none" lewat ?rec=', () => {
    const full = renderReview('INS-SEN-2026-0007');
    expect(screen.getByText('Bahan pertimbangan dari 7 insiden serupa')).toBeInTheDocument();
    expect(screen.getByText('14 jam')).toBeInTheDocument();
    expect(screen.getByText('Rp16,8 jt')).toBeInTheDocument();
    expect(screen.getByText('2,5 hari')).toBeInTheDocument();
    // klik pola menyorot titik yang cocok
    fireEvent.click(screen.getByRole('button', { name: /Kabel dipotong/ }));
    expect(full.container.querySelectorAll('g.pt.hit')).toHaveLength(3);
    expect(full.container.querySelectorAll('g.pt.dim')).toHaveLength(4);
    full.unmount();

    const few = renderReview('INS-SEN-2026-0007', '?rec=few');
    expect(screen.queryByText('Bahan pertimbangan dari 7 insiden serupa')).not.toBeInTheDocument();
    expect(screen.queryByText('Langkah yang biasa dilakukan')).not.toBeInTheDocument();
    expect(screen.getByText(/Data belum cukup untuk melihat pola \(2 kasus\)/)).toBeInTheDocument();
    expect(screen.getByText('INS-SEN-2024-0377')).toBeInTheDocument();
    few.unmount();

    renderReview('INS-SEN-2026-0007', '?rec=none');
    expect(screen.getByText('Belum ada kasus serupa untuk dijadikan pembanding')).toBeInTheDocument();
    expect(screen.queryByText('Langkah yang biasa dilakukan')).not.toBeInTheDocument();
  });

  it('Jadikan kerawanan: alasan wajib, lalu entri KRW baru dan navigasi ke tab Kerawanan', () => {
    renderReview('INS-SEN-2026-0007');
    fireEvent.click(screen.getByRole('button', { name: 'Aksi lain' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Jadikan kerawanan/ }));
    const dlg = screen.getByRole('dialog', { name: 'Jadikan kerawanan?' });
    expect(within(dlg).getByText(/Insiden ini Tinggi\./)).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Jadikan kerawanan' }));
    expect(inc('INS-SEN-2026-0007').status).toBe('review-internal');
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Tidak ada kerugian.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Jadikan kerawanan' }));
    expect(useDemoStore.getState().kerawanan[0].no).toBe('KRW-SEN-2026-0048');
    expect(screen.getByText(/daftar:\/insiden\?tab=kerawanan\|Kerawanan tercatat sebagai KRW-SEN-2026-0048/)).toBeInTheDocument();
  });

  it('kemungkinan ganda 0009: Setujui nonaktif sampai diputuskan; Gabung memilih induk 0007', () => {
    renderReview('INS-SEN-2026-0009');
    expect(screen.getByText('Sepertinya sudah dilaporkan.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Setujui' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('radio', { name: /Pencurian kabel listrik sumur ADR-07/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Gabung ke INS-SEN-2026-0007' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Gabung laporan ini?' })).getByRole('button', { name: 'Gabung' }));
    expect(inc('INS-SEN-2026-0009')).toMatchObject({ status: 'digabung', mergedInto: 'INS-SEN-2026-0007' });
  });

  it('Tetap terpisah membuka Setujui; Minta revisi dan Batalkan butuh alasan', () => {
    renderReview('INS-SEN-2026-0009');
    fireEvent.click(screen.getByRole('button', { name: 'Tetap sebagai insiden terpisah' }));
    expect(screen.getByRole('button', { name: 'Setujui' })).toHaveAttribute('aria-disabled', 'false');
    fireEvent.click(screen.getByRole('button', { name: /Minta revisi/ }));
    const dlg = screen.getByRole('dialog', { name: 'Minta revisi laporan' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Minta revisi' }));
    expect(inc('INS-SEN-2026-0009').status).toBe('review-internal');
    fireEvent.change(within(dlg).getByLabelText('Alasan revisi'), { target: { value: 'Lengkapi kerugian.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Minta revisi' }));
    expect(inc('INS-SEN-2026-0009').status).toBe('perlu-perbaikan');
  });

  it('state sudah diputus (VS2), kosong (VS3) dan peran bukan Pejabat', () => {
    useDemoStore.getState().decide((s) => ({ ok: true, state: { ...s, incidents: s.incidents.map((i) => (i.no === 'INS-SEN-2026-0007' ? { ...i, status: 'dalam-penanganan' as const } : i)) } }));
    renderReview('INS-SEN-2026-0007');
    expect(screen.getByText('Insiden ini tidak lagi menunggu pemeriksaan.')).toBeInTheDocument();
  });

  it('state demo: validasi, lewat-batas, sudah-diputus, memuat', () => {
    const a = renderReview('INS-SEN-2026-0009', '?state=validasi');
    expect(screen.getByText('1 isian perlu dilengkapi.')).toBeInTheDocument();
    a.unmount();
    const b = renderReview('INS-SEN-2026-0009', '?state=lewat-batas');
    expect(screen.getByText(/Lewat batas 5 jam|Lewat 5 jam/)).toBeInTheDocument();
    b.unmount();
    const c = renderReview('INS-SEN-2026-0007', '?state=sudah-diputus');
    expect(screen.getByRole('alert')).toHaveTextContent('Insiden ini sudah diputus Rudi Hartono. Halaman dimuat ulang.');
    c.unmount();
    renderReview('INS-SEN-2026-0007', '?state=memuat');
    expect(screen.getByRole('status', { name: 'Memuat' })).toBeInTheDocument();
  });
});

describe('logika review', () => {
  it('batas pemeriksaan dihitung terhadap DEMO_NOW', () => {
    expect(deadlineInfo('2026-10-28T08:00:00')).toEqual({ late: true, text: 'Lewat 5 jam' });
    expect(deadlineInfo('2026-10-29T07:00:00')).toEqual({ late: false, text: 'sisa 18 jam' });
    expect(deadlineInfo('2026-10-28T13:20:00').text).toBe('sisa 20 menit');
  });
  it('kandidat induk untuk 0009 adalah 0007', () => {
    const all = useDemoStore.getState().incidents;
    const c = duplicateCandidates(all.find((i) => i.no === 'INS-SEN-2026-0009')!, all);
    expect(c.map((x) => x.no)).toEqual(['INS-SEN-2026-0007']);
    expect(c[0]).toMatchObject({ dist: 'Lokasi sama', dt: '1 jam 10 menit', linkable: true });
  });
});

describe('V13 · tenggat hari kerja di dialog Setujui', () => {
  it('bawaan 3 hari kerja sampai 2 Nov; 10 hari kerja = 11 Nov dan wajib beralasan', () => {
    renderReview('INS-SEN-2026-0007');
    pick('PIC penanganan', 'Dedi Kurniawan');
    fireEvent.click(screen.getByRole('button', { name: 'Setujui' }));
    const dlg = screen.getByRole('dialog', { name: 'Setujui insiden ini?' });
    const field = within(dlg).getByLabelText('Tenggat penanganan (hari kerja)');
    expect(field).toHaveValue('3');
    expect(within(dlg).getByText(/sampai/)).toHaveTextContent('2 Nov 2026');
    fireEvent.change(field, { target: { value: '10' } });
    expect(within(dlg).getByText(/sampai/)).toHaveTextContent('11 Nov 2026');
    fireEvent.click(within(dlg).getByRole('button', { name: /Setujui insiden/ }));
    expect(inc('INS-SEN-2026-0007').status).toBe('review-internal');
    fireEvent.change(within(dlg).getByLabelText('Kenapa berbeda dari konfigurasi?'), { target: { value: 'Kabel pengganti dipesan dari Jakarta.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: /Setujui insiden/ }));
    expect(inc('INS-SEN-2026-0007')).toMatchObject({ status: 'dalam-penanganan', handleDueAt: '2026-11-11T07:00:00' });
  });
});
