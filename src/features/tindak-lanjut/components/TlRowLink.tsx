import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { FollowUpItem } from '@/services/types';

/** Baris tindak lanjut (`in-tlr rail`): menaut ke Detail tindak lanjut bila berasal dari modul TL, selain itu tautan mati seperti board. */
export function TlRowLink({ f, children, hash = '#tl' }: { f: FollowUpItem; children: ReactNode; hash?: string }) {
  if (f.tl) return <Link to={`/tindak-lanjut/${f.tl}`} className="in-tlr rail">{children}</Link>;
  return <a href={hash} className="in-tlr rail" onClick={(e) => e.preventDefault()}>{children}</a>;
}
