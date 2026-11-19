// Lampiran di memori (demo tanpa upload sungguhan): hanya nama, ukuran, keterangan yang masuk ke draf.
import { useRef, useState } from 'react';
import { useDraftStore, type Attachment } from './draft';

export const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'pdf'];
/** Teks galat format: board I13b. */
export const MSG_FORMAT = 'Format tidak didukung. Pakai JPG, PNG, atau PDF.';

export interface RejectedFile {
  id: string;
  name: string;
  reason: string;
}

export const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '');
export const extLabel = (name: string) => (extOf(name) === 'jpeg' ? 'JPG' : extOf(name).toUpperCase().slice(0, 4));
export const isImage = (name: string) => ['jpg', 'jpeg', 'png'].includes(extOf(name));

/** "3,4 MB" / "820 KB" */
export function formatSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1).replace('.', ',')} MB` : `${kb} KB`;
}

let seq = 0;
const newId = () => `att-${Date.now().toString(36)}-${++seq}`;

interface Opts {
  maxFiles: number;
  maxMb: number;
}

export function useAttachmentUpload({ maxFiles, maxMb }: Opts) {
  const attachments = useDraftStore((s) => s.draft.attachments);
  const patch = useDraftStore((s) => s.patch);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const blobs = useRef(new Map<string, File>());

  const add = (list: FileList | File[] | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const ok: Attachment[] = [];
    const bad: RejectedFile[] = [];
    let count = useDraftStore.getState().draft.attachments.length;
    for (const f of incoming) {
      if (!ALLOWED_EXT.includes(extOf(f.name))) {
        bad.push({ id: newId(), name: f.name, reason: MSG_FORMAT });
      } else if (f.size > maxMb * 1024 * 1024) {
        bad.push({ id: newId(), name: f.name, reason: `Ukuran melebihi ${maxMb} MB.` });
      } else if (count >= maxFiles) {
        bad.push({ id: newId(), name: f.name, reason: `Maks. ${maxFiles} file.` });
      } else {
        const id = newId();
        blobs.current.set(id, f);
        ok.push({ id, name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)), caption: '' });
        count += 1;
      }
    }
    if (ok.length) patch({ attachments: [...useDraftStore.getState().draft.attachments, ...ok] });
    if (bad.length) setRejected((r) => [...r, ...bad]);
  };

  const remove = (id: string) => {
    blobs.current.delete(id);
    patch({ attachments: useDraftStore.getState().draft.attachments.filter((a) => a.id !== id) });
  };
  const removeRejected = (id: string) => setRejected((r) => r.filter((x) => x.id !== id));
  const setCaption = (id: string, caption: string) =>
    patch({ attachments: useDraftStore.getState().draft.attachments.map((a) => (a.id === id ? { ...a, caption } : a)) });
  const preview = (id: string) => {
    const f = blobs.current.get(id);
    if (f) window.open(URL.createObjectURL(f), '_blank', 'noopener');
  };
  const canPreview = (id: string) => blobs.current.has(id);

  return { attachments, rejected, add, remove, removeRejected, setCaption, preview, canPreview };
}
