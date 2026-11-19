// "Jadikan draf laporan": baca pesan (saran AI), buat draf, buka langkah 1. Dipakai kotak masuk dan detail pesan, desktop dan mobile.
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEMO_USERS } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import { createWaDraft } from '@/services/mock/workflow.wa';
import type { WaMessage } from '@/services/types';
import { waPath } from './draft';
import { suggestFromMessage } from './extract';

export function useStartDraft() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (m: WaMessage) => {
    const draftId = useDemoStore.getState().waMessages.find((x) => x.id === m.id)?.draftId;
    const fail = params.get('state') === 'ai-gagal';
    const suffix = fail ? '&state=ai-gagal' : '';
    if (draftId) return navigate(waPath('temuan', draftId) + suffix);
    setBusy(m.id);
    setError(null);
    const s = await suggestFromMessage(m, { fail });
    const by = DEMO_USERS[useDemoStore.getState().role].name;
    const r = useDemoStore.getState().decide((st) => createWaDraft(st, { messageId: m.id, by, ...s }));
    setBusy(null);
    if (!r.ok) return setError(r.reason);
    const id = useDemoStore.getState().waMessages.find((x) => x.id === m.id)?.draftId;
    navigate(waPath('temuan', id) + suffix);
  };
  return { busy, error, start };
}
