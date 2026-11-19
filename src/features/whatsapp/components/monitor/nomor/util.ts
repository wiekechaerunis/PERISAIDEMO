// Pembantu tampilan Nomor tertaut.
import { demoNow } from '@/services/mock/clock';

/** "0812 7000 1111" menjadi "+62 812-****-1111" (sama dengan papan). */
export function maskPhone(phone: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  if (!d.startsWith('62') || d.length < 9) return phone;
  return `+62 ${d.slice(2, 5)}-****-${d.slice(-4)}`;
}

const KEY = 'perisai-insiden-demo/wa-terms-at:';
/** Waktu persetujuan ketentuan (store hanya menyimpan nama; waktunya dicatat di sini, tanpa mengubah store). */
export function rememberTermsAt(by: string) {
  try { if (!localStorage.getItem(KEY + by)) localStorage.setItem(KEY + by, demoNow()); } catch { /* abaikan */ }
}
export function termsAt(by: string): string {
  try { return localStorage.getItem(KEY + by) ?? demoNow(); } catch { return demoNow(); }
}
