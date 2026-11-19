import { Icon } from '@/components/ui/Icon';

/** Tag "AI" kecil di samping label field yang diisi AI Copilot (board I13). */
export function AiTag({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span
      className="p-tag t-info"
      title="Diisi AI Copilot dari cerita Anda · bisa diubah"
      style={{ height: 18, fontSize: 11, gap: 3, marginLeft: 6, verticalAlign: 'middle', cursor: 'help' }}
    >
      <Icon name="sparkle" size={11} />AI
    </span>
  );
}

export function FieldError({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span className="p-help err" role="alert"><Icon name="warn" size={14} />{text}</span>
  );
}
