/** Unduh contoh-unduhan.xlsx apa adanya (PRD §12). */
export function downloadExcel() {
  const a = document.createElement('a');
  a.href = '/contoh-unduhan.xlsx';
  a.download = 'contoh-unduhan.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
