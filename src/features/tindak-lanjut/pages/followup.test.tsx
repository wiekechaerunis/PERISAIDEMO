import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import type { FollowUp } from '@/services/types';
import type { Role } from '@/lib/rbac';
import { taskCount } from '@/features/insiden/logic/list';
import { TasksPage } from '@/features/insiden/pages/TasksPage';
import { IncidentReviewPage } from '@/features/insiden/pages/IncidentReviewPage';
import { PicHandlingPage } from '@/features/insiden/pages/PicHandlingPage';
import { TindakLanjutDetailPage } from './TindakLanjutDetailPage';
import { TindakLanjutBaruPage } from './TindakLanjutBaruPage';
import { TindakLanjutListPage } from './TindakLanjutListPage';

const INS = 'INS-SEN-2026-0007';
const store = () => useDemoStore.getState();
const fu = (no: string) => store().followUps.find((f) => f.no === no)!;
const asRole = (r: Role) => store().setRole(r);
const patchFu = (no: string, p: Partial<FollowUp>) =>
  useDemoStore.setState({ followUps: store().followUps.map((f) => (f.no === no ? { ...f, ...p } : f)) });
const submitted = (no: string) =>
  patchFu(no, { status: 'menunggu-verifikasi', submittedAt: '2026-11-05T09:12:00', evidence: [{ name: 'a.jpg', sizeKb: 1 }, { name: 'b.jpg', sizeKb: 1 }] });

/** Insiden sumber dijalankan (seed 0007 masih Menunggu pemeriksaan): Dalam penanganan, PIC Andi Pratama. */
const runIncident = (no = INS) =>
  useDemoStore.setState({
    incidents: store().incidents.map((i) =>
      i.no === no ? { ...i, status: 'dalam-penanganan' as const, pic: 'Andi Pratama', handleDueAt: '2026-11-02T10:00:00' } : i,
    ),
  });

const renderDetail = (no: string, role?: Role) => {
  if (role) asRole(role);
  return render(
    <MemoryRouter initialEntries={[`/tindak-lanjut/${no}`]}>
      <Routes><Route path="/tindak-lanjut/:no" element={<TindakLanjutDetailPage />} /></Routes>
    </MemoryRouter>,
  );
};
const renderList = (role: Role, entry = '/tindak-lanjut') => {
  asRole(role);
  return render(<MemoryRouter initialEntries={[entry]}><TindakLanjutListPage /></MemoryRouter>);
};

beforeEach(() => {
  localStorage.clear();
  store().resetDemo();
  runIncident();
});

describe('Modul Tindak lanjut · detail dan alur status (TLJ-01)', () => {
  it('(T14N) satu kartu Pengerjaan: unggah bukti tidak mengubah status, catatan pertama mulai Dikerjakan, Ajukan nonaktif tanpa bukti', () => {
    renderDetail('TL-SEN-2026-0041', 'pic-tl');
    const card = screen.getByRole('region', { name: 'Pengerjaan' });
    expect(within(card).getByLabelText('Status tindak lanjut')).toBeInTheDocument();
    expect(within(card).getByText('1 · Catatan progres')).toBeInTheDocument();
    expect(within(card).getByText('2 · Selesaikan')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Ajukan selesai' })).toHaveAttribute('aria-disabled', 'true');
    expect(within(card).getByText('Lampirkan minimal satu bukti untuk mengajukan selesai.')).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: 'Pilih file' }));
    expect(fu('TL-SEN-2026-0041')).toMatchObject({ status: 'belum-dimulai' });
    expect(fu('TL-SEN-2026-0041').evidence).toHaveLength(1);
    expect(within(card).getByText('Andi Pratama memeriksa. Bukti terkunci setelah diajukan.')).toBeInTheDocument();
    fireEvent.change(within(card).getByLabelText('Catatan progres'), { target: { value: 'Material pagar sudah tiba.' } });
    fireEvent.click(within(card).getByRole('button', { name: 'Lampirkan foto' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Tambah catatan' }));
    expect(fu('TL-SEN-2026-0041').status).toBe('berjalan');
    expect(within(screen.getByRole('region', { name: 'Pengerjaan' })).getByText(/1 foto progres/)).toBeInTheDocument();
  });

  it('(a) PIC memulai, melampirkan bukti, mengajukan selesai, lalu menarik pengajuan', () => {
    renderDetail('TL-SEN-2026-0041', 'pic-tl');
    expect(screen.getByRole('heading', { name: 'Detail tindak lanjut' })).toBeInTheDocument();
    expect(screen.getAllByText('Belum dimulai').length).toBeGreaterThan(0);
    // tanpa bukti, Ajukan selesai nonaktif
    expect(screen.getByRole('button', { name: 'Ajukan selesai' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Mulai kerjakan' }));
    expect(fu('TL-SEN-2026-0041').status).toBe('berjalan');
    expect(screen.getByText('Status jadi Dikerjakan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pilih file' }));
    expect(fu('TL-SEN-2026-0041').evidence).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Catatan penyelesaian'), { target: { value: 'Pagar beton 12 m terpasang.' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Ajukan selesai' })[0]);
    const dlg = screen.getByRole('dialog', { name: 'Ajukan selesai?' });
    expect(within(dlg).getByText('Bukti dikunci dan Andi Pratama akan memeriksa.')).toBeInTheDocument();
    expect(within(dlg).getByText('Pagar beton 12 m terpasang.')).toBeInTheDocument();
    expect(within(dlg).queryByLabelText('Catatan penyelesaian')).toBeNull();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Ajukan selesai' }));
    expect(fu('TL-SEN-2026-0041')).toMatchObject({ status: 'menunggu-verifikasi', completionNote: 'Pagar beton 12 m terpasang.' });
    expect(screen.getByText('Tindak lanjut diajukan untuk diperiksa')).toBeInTheDocument();
    expect(screen.getByText('2 · Pengajuan selesai')).toBeInTheDocument();
    expect(screen.getByText(/diperiksa Andi Pratama/)).toBeInTheDocument();
    expect(screen.getAllByText('Terkunci selama diperiksa')).toHaveLength(1);
    expect(screen.getByText('Pagar beton 12 m terpasang.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Catatan penyelesaian')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tarik pengajuan' }));
    expect(fu('TL-SEN-2026-0041').status).toBe('berjalan');
    expect(within(screen.getByRole('status')).getByText('Pengajuan ditarik')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Riwayat tindak lanjut' })).getByText('Pengajuan ditarik')).toBeInTheDocument();
  });

  it('(b) pemberi tugas menyetujui: Selesai, bukti resmi, tanpa aksi lagi', () => {
    submitted('TL-SEN-2026-0039');
    renderDetail('TL-SEN-2026-0039', 'pic');
    expect(screen.getByRole('heading', { name: 'Periksa hasil tindak lanjut' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Setujui selesai/ }));
    const dlg = screen.getByRole('dialog', { name: 'Setujui penyelesaian?' });
    expect(within(dlg).getByText('Tindak lanjut menjadi Selesai dan bukti menjadi resmi. Status ini tidak bisa dibuka kembali.')).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Setujui' }));
    expect(fu('TL-SEN-2026-0039')).toMatchObject({ status: 'selesai', verifiedBy: 'Andi Pratama', finishedAt: '2026-11-05T09:12:00' });
    expect(screen.getByText('Tindak lanjut TL-SEN-2026-0039 selesai')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hasil' })).toBeInTheDocument();
    expect(screen.getAllByText('Resmi').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Setujui selesai|Kembalikan|Ajukan selesai|Batalkan|Ubah tenggat/ })).toBeNull();
  });

  it('(c) Kembalikan tanpa alasan ditolak; dengan alasan PIC melihat banner dan tetap Dikerjakan', () => {
    submitted('TL-SEN-2026-0041');
    const { unmount } = renderDetail('TL-SEN-2026-0041', 'pic');
    fireEvent.click(screen.getByRole('button', { name: /Kembalikan/ }));
    const dlg = screen.getByRole('dialog', { name: 'Kembalikan ke PIC' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Kembalikan' }));
    expect(fu('TL-SEN-2026-0041').status).toBe('menunggu-verifikasi');
    expect(within(dlg).getByText('Tulis alasan minimal 10 karakter.')).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Foto belum menunjukkan sisi luar pagar.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Kembalikan' }));
    expect(fu('TL-SEN-2026-0041')).toMatchObject({ status: 'dikembalikan', returnReason: 'Foto belum menunjukkan sisi luar pagar.', returnedBy: 'Andi Pratama' });
    expect(screen.getByText('Tindak lanjut dikembalikan ke Rudi Hartono')).toBeInTheDocument();
    unmount();

    renderDetail('TL-SEN-2026-0041', 'pic-tl');
    expect(screen.getByText(/Dikembalikan oleh Andi Pratama/)).toBeInTheDocument();
    expect(screen.getAllByText('Foto belum menunjukkan sisi luar pagar.')).toHaveLength(2); // banner + catatan di Riwayat
    expect(screen.getAllByText('Dikerjakan').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/belum diajukan/)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Pilih file' }));
    expect(fu('TL-SEN-2026-0041').evidence).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /Ajukan selesai/ }).length).toBeGreaterThan(0);
  });

  it('(d) Gabung insiden membatalkan tindak lanjut anak', () => {
    const child: FollowUp = { ...fu('TL-SEN-2026-0034'), no: 'TL-SEN-2026-0090', incidentNo: 'INS-SEN-2026-0009', status: 'berjalan', returnReason: undefined };
    useDemoStore.setState({ followUps: [child, ...store().followUps] });
    asRole('pejabat');
    const { unmount } = render(
      <MemoryRouter initialEntries={['/insiden/INS-SEN-2026-0009/review']}>
        <Routes>
          <Route path="/insiden/:no/review" element={<IncidentReviewPage />} />
          <Route path="/insiden" element={<div>daftar</div>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('radio', { name: /Pencurian kabel listrik sumur ADR-07/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Gabung ke INS-SEN-2026-0007' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Gabung laporan ini?' })).getByRole('button', { name: 'Gabung' }));
    expect(fu('TL-SEN-2026-0090')).toMatchObject({ status: 'dibatalkan', cancelledBy: 'Sistem' });
    expect(fu('TL-SEN-2026-0041').status).toBe('belum-dimulai'); // tindak lanjut insiden induk tidak ikut
    unmount();

    renderDetail('TL-SEN-2026-0090', 'pic-tl');
    expect(screen.getAllByText(/Insiden sumber INS-SEN-2026-0009 digabung ke INS-SEN-2026-0007/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dibatalkan', { selector: '.p-tag' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Ajukan selesai/ })).toBeNull();
  });

  it('(e) pemberi tugas mengubah tenggat, mengganti PIC, dan membatalkan; alasan wajib 10 karakter', () => {
    renderDetail('TL-SEN-2026-0041', 'pic');
    fireEvent.click(screen.getByRole('button', { name: 'Ubah tenggat' }));
    let dlg = screen.getByRole('dialog', { name: 'Ubah tenggat' });
    expect(within(dlg).getByText(/Tenggat awal 6 Nov 2026 tetap tercatat/)).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText('Tenggat baru'), { target: { value: '2026-11-11' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Ubah tenggat' }));
    expect(fu('TL-SEN-2026-0041').dueAt).toBe('2026-11-06T17:00:00');
    expect(within(dlg).getByText('Tulis alasan minimal 10 karakter.')).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Vendor panel beton mundur jadwal.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Ubah tenggat' }));
    expect(fu('TL-SEN-2026-0041')).toMatchObject({ dueAt: '2026-11-11T17:00:00', dueAtOriginal: '2026-11-06T17:00:00' });
    expect(screen.getByText('Tenggat diubah menjadi 11 Nov 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ganti PIC' }));
    dlg = screen.getByRole('dialog', { name: 'Ganti PIC' });
    fireEvent.change(within(dlg).getByLabelText('PIC baru'), { target: { value: 'Joko Susilo' } });
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Rudi sedang cuti dua minggu.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Ganti PIC' }));
    expect(fu('TL-SEN-2026-0041').pic).toBe('Joko Susilo');
    expect(screen.getByText('PIC diganti ke Joko Susilo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Batalkan' }));
    dlg = screen.getByRole('dialog', { name: 'Batalkan tindak lanjut?' });
    expect(within(dlg).getByText(/Data tidak dihapus/)).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText('Alasan'), { target: { value: 'Pekerjaan sudah dikerjakan pihak lain.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Batalkan tindak lanjut' }));
    expect(fu('TL-SEN-2026-0041')).toMatchObject({ status: 'dibatalkan', cancelledBy: 'Andi Pratama' });
    expect(screen.getByText('Tindak lanjut TL-SEN-2026-0041 dibatalkan')).toBeInTheDocument();
  });

  it('SKK hanya membuka yang final; yang belum final menampilkan "belum tersedia"', () => {
    renderDetail('TL-SEN-2026-0041', 'pengawas');
    expect(screen.getByText('Tindak lanjut ini belum tersedia')).toBeInTheDocument();
  });
});

describe('Modul Tindak lanjut · daftar, papan, filter (T11, T21, T22, T35, T36)', () => {
  it('Milik saya memuat tugas PIC atau pemberi tugas; Semua menambah milik orang lain; kolom sesuai desain', () => {
    renderList('pic');
    expect(screen.getByRole('link', { name: 'Perbaiki pagar sisi panel ADR-07 dengan panel beton' })).toHaveAttribute('href', '/tindak-lanjut/TL-SEN-2026-0041');
    ['Tindak lanjut', 'Sumber', 'PIC', 'Pemeriksa', 'Tenggat', 'Status', 'Bukti'].forEach((h) => expect(screen.getByRole('columnheader', { name: h })).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'Perbaiki CCTV gerbang 2' })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Semua' }));
    expect(screen.getByRole('link', { name: 'Perbaiki CCTV gerbang 2' })).toBeInTheDocument();
    expect(() => taskCount(store().incidents, 'pic')).not.toThrow();
  });

  it('terlambat di atas, tag status modul, dan keterangan tenggat', () => {
    renderList('pejabat');
    fireEvent.click(screen.getByRole('radio', { name: 'Semua' }));
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText(/Terlambat \d+ hari/)).toBeInTheDocument();
    expect(screen.getAllByText('Menunggu pemeriksaan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dikembalikan').length).toBeGreaterThan(0); // keterangan di bawah tenggat, bukan status
  });

  it('filter Tenggat Terlambat dan Hapus filter', () => {
    renderList('pejabat');
    fireEvent.click(screen.getByRole('radio', { name: 'Semua' }));
    const all = screen.getAllByRole('row').length;
    fireEvent.click(screen.getByRole('button', { name: /^Filter/ }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Filter tindak lanjut' })).getByRole('button', { name: 'Terlambat' }));
    expect(screen.getByRole('group', { name: 'Filter aktif' })).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeLessThan(all);
    fireEvent.click(screen.getByRole('button', { name: 'Hapus filter' }));
    expect(screen.getAllByRole('row')).toHaveLength(all);
  });

  it('Papan: empat lajur dan menu Pindahkan ke untuk kartu yang perlu diputuskan', () => {
    submitted('TL-SEN-2026-0039');
    renderList('pic');
    fireEvent.click(screen.getByRole('button', { name: 'Papan' }));
    ['Belum dimulai', 'Dikerjakan', 'Menunggu pemeriksaan', 'Selesai'].forEach((l) => expect(screen.getByRole('region', { name: l })).toBeInTheDocument());
    expect(screen.getByText(/2 perlu Anda/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aksi TL-SEN-2026-0039' }));
    expect(within(screen.getByRole('menu')).getByText('Pindahkan ke')).toBeInTheDocument();
  });

  it('Papan: pegangan seret hanya di kartu milik pengguna; Keterangan selalu tampil; kartu Selesai terkunci', () => {
    renderList('pic');
    fireEvent.click(screen.getByRole('button', { name: 'Papan' }));
    expect(screen.getByRole('note')).toHaveTextContent('Keterangan');
    const mine = screen.getByRole('article', { name: 'Pasang papan peringatan di gerbang 2' });
    expect(mine).toHaveAttribute('draggable', 'true');
    expect(within(mine).getByText('Perlu Anda periksa')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /^Semua/ }));
    const others = screen.getByRole('article', { name: 'Tambah lampu sorot di pagar perimeter terminal' });
    expect(others).toHaveAttribute('draggable', 'false');
    expect(others.textContent).not.toContain('⋮⋮');
  });

  it('tampilan SKK: hanya Selesai/Dibatalkan, kolom KKKS, tanpa cakupan dan tampilan', () => {
    renderList('pengawas');
    expect(screen.getByRole('columnheader', { name: 'KKKS' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Milik saya' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Papan' })).toBeNull();
    expect(screen.queryByText('Perbaiki pagar sisi panel ADR-07 dengan panel beton')).toBeNull();
    expect(screen.getByText('Pasang CCTV di jalur truk logistik')).toBeInTheDocument();
  });

  it('keadaan memuat dan gagal muat', () => {
    const { unmount } = renderList('pic', '/tindak-lanjut?state=memuat');
    expect(screen.getByLabelText('Memuat daftar')).toBeInTheDocument();
    unmount();
    renderList('pic', '/tindak-lanjut?state=gagal');
    expect(screen.getByText('Daftar gagal dimuat')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Muat ulang' })).toBeInTheDocument();
  });
});

describe('Modul Tindak lanjut · Tugas saya dan pembuatan', () => {
  it('Tugas saya Rudi menghitung tindak lanjut yang perlu dikerjakan; pemberi tugas memeriksa', () => {
    asRole('pic-tl');
    const { unmount } = render(<MemoryRouter><TasksPage /></MemoryRouter>);
    expect(screen.getAllByText('Dikembalikan').length).toBe(1);
    expect(screen.getAllByText('Perlu dikerjakan').length).toBeGreaterThan(1);
    const n = screen.getAllByRole('link', { name: 'Kerjakan' }).length;
    expect(n).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(`${n} tugas · urut dari yang paling lama menunggu`)).toBeInTheDocument();
    expect(taskCount(store().incidents, 'pic-tl', store().followUps)).toBe(n);
    unmount();

    submitted('TL-SEN-2026-0039');
    asRole('pic');
    render(<MemoryRouter><TasksPage /></MemoryRouter>);
    expect(screen.getAllByRole('link', { name: 'Periksa' }).find((a) => a.getAttribute('href') === '/tindak-lanjut/TL-SEN-2026-0039')!).toHaveAttribute('href', '/tindak-lanjut/TL-SEN-2026-0039');
    expect(screen.getAllByText('Menunggu pemeriksaan')[0]).toBeInTheDocument();
  });

  it('Tambah tindak lanjut dari halaman Tangani: isi Tindakan, pilih PIC, tenggat 5 hari kerja = 6 Nov', () => {
    asRole('pic');
    render(
      <MemoryRouter initialEntries={[`/tindak-lanjut/baru?insiden=${INS}&dari=pic`]}>
        <Routes>
          <Route path="/tindak-lanjut/baru" element={<TindakLanjutBaruPage />} />
          <Route path="/insiden/:no" element={<PicHandlingPage />} />
          <Route path="/insiden/:no/tangani" element={<PicHandlingPage mode="tangani" />} />
        </Routes>
      </MemoryRouter>,
    );
    const dlg = screen.getByRole('dialog', { name: 'Tambah tindak lanjut' });
    const save = within(dlg).getByRole('button', { name: 'Tugaskan' });
    expect(save).toHaveAttribute('aria-disabled', 'true');
    expect(within(dlg).getByText('Perkiraan 6 Nov 2026.')).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText('Tindakan'), { target: { value: 'Tambah CCTV di sisi panel' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'PIC' }));
    fireEvent.click(within(dlg).getByRole('option', { name: /Rudi Hartono/ }));
    fireEvent.click(within(dlg).getByRole('button', { name: 'Tugaskan' }));
    const n = store().followUps[0];
    expect(n).toMatchObject({ no: 'TL-SEN-2026-0046', action: 'Tambah CCTV di sisi panel', pic: 'Rudi Hartono', dueAt: '2026-11-06T17:00:00', status: 'belum-dimulai', source: 'manual' });
    expect(screen.getByText('Tindak lanjut TL-SEN-2026-0046 dibuat. Rudi Hartono diberi tahu.')).toBeInTheDocument();
    expect(screen.getByText('Tambah CCTV di sisi panel')).toBeInTheDocument();
  });

  it('Jadikan tindak lanjut dari saran pemeriksa mengisi Tindakan dan menandai langkah', () => {
    useDemoStore.setState({
      incidents: store().incidents.map((i) => (i.no === INS ? { ...i, forwardedSteps: ['Ganti kabel dan pastikan pengamanan panel.'] } : i)),
    });
    asRole('pic');
    render(
      <MemoryRouter initialEntries={[`/insiden/${INS}`]}>
        <Routes><Route path="/insiden/:no" element={<PicHandlingPage />} /></Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Jadikan tindak lanjut/ }));
    const dlg = screen.getByRole('dialog', { name: 'Jadikan tindak lanjut' });
    expect(within(dlg).getByText(/Dari saran pemeriksa · Sari Wulandari/)).toBeInTheDocument();
    expect(within(dlg).getByLabelText('Tindakan')).toHaveValue('Ganti kabel dan pastikan pengamanan panel.');
    fireEvent.click(within(dlg).getByRole('button', { name: 'PIC' }));
    fireEvent.click(within(dlg).getByRole('option', { name: /Dedi Kurniawan/ }));
    fireEvent.click(within(dlg).getByRole('button', { name: 'Tugaskan' }));
    expect(store().followUps[0]).toMatchObject({ source: 'saran-verifikator', sourceLabel: 'Sari Wulandari', pic: 'Dedi Kurniawan' });
    expect(store().incidents.find((i) => i.no === INS)?.handling?.stepsDone).toContain('Ganti kabel dan pastikan pengamanan panel.');
  });
});
