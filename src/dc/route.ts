// Tautan di desain menunjuk ke papan lain (*.dc.html). Di prototype semuanya diarahkan ke placeholder (PRD §2, §5).
export function routeHref(href: string, id?: string): string {
  if (!href || href === '#') return '#';
  if (/\.dc\.html$/.test(href)) return id ? `/insiden/${id}` : '/insiden';
  return href;
}
