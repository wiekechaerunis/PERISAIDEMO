const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** "28 Okt 2026, 07:00" (demo: waktu disimpan sebagai ISO tanpa zona, dianggap WIB). */
export function formatWib(iso: string): string {
  const [d, t] = iso.split('T');
  const [y, m, day] = d.split('-').map(Number);
  return `${day} ${BULAN[m - 1]} ${y}, ${t.slice(0, 5)}`;
}
/** "28 Okt 2026, 07:00 WIB" */
export const formatWibFull = (iso: string) => `${formatWib(iso)} WIB`;
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}
export const formatDateShort = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${BULAN[m - 1]}`;
};
/** "Rp18.500.000" */
export const formatRupiah = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');
export const formatNumber = (n: number) => n.toLocaleString('id-ID');
