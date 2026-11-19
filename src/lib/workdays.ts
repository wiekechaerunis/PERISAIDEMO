/** Kalender kerja mock (RSK-05, PTK 049): hari libur nasional dan cuti bersama yang dilewati hitungan hari kerja WIB. */
export const WORK_CALENDAR: readonly string[] = [
  '2026-08-17', '2026-12-24', '2026-12-25', '2026-12-31', '2027-01-01',
];

/** Tambah `n` hari kerja (lewati Sabtu, Minggu, dan libur dari `calendar`) ke ISO lokal; jam tetap seperti awal. */
export function addWorkingDays(startIso: string, n: number, calendar: readonly string[] = WORK_CALENDAR): string {
  const d = new Date(startIso.slice(0, 10) + 'T00:00:00Z');
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const w = d.getUTCDay();
    if (w !== 0 && w !== 6 && !calendar.includes(d.toISOString().slice(0, 10))) left -= 1;
  }
  return d.toISOString().slice(0, 10) + (startIso.length > 10 ? startIso.slice(10, 19) : '');
}

/** Selisih hari kerja dari `from` ke `to` (tanggal, `to` dihitung, `from` tidak); negatif bila `to` sudah lewat. */
export function workingDaysBetween(from: string, to: string): number {
  const a = new Date(from.slice(0, 10) + 'T00:00:00Z').getTime();
  const b = new Date(to.slice(0, 10) + 'T00:00:00Z').getTime();
  const step = a <= b ? 1 : -1;
  let n = 0;
  for (let t = a; t !== b; ) {
    t += step * 86_400_000;
    const w = new Date(t).getUTCDay();
    if (w !== 0 && w !== 6) n += step;
  }
  return n;
}
