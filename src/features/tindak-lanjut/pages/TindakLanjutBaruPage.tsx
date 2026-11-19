// Board: T1 (Tambah tindak lanjut) dan T1b (Jadikan tindak lanjut dari saran). Rute /tindak-lanjut/baru?insiden=...&dari=pic|saran&langkah=...
// Tampil sebagai halaman Tangani insiden (P14) dengan dialog terbuka, persis latar board T1.
import { useSearchParams } from 'react-router-dom';
import { TlArahanFormPage } from './TlArahanFormPage';
import { PicHandlingPage } from '@/features/insiden/pages/PicHandlingPage';

export function TindakLanjutBaruPage() {
  const [params] = useSearchParams();
  const no = params.get('insiden');
  if (!no) return <TlArahanFormPage />;
  return <PicHandlingPage mode="tangani" incidentNo={no} tlNew={{ dari: params.get('dari') ?? 'pic', langkah: params.get('langkah') }} />;
}
