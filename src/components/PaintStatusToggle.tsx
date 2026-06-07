import { Circle, Paintbrush, Sparkles } from 'lucide-react';
import type { PaintStatus } from '../hooks/usePaintStatus';

const ICONS: Record<PaintStatus, React.ReactNode> = {
  unpainted: <Circle size={16} color="#4a5568" />,
  painted: <Paintbrush size={16} color="var(--accent)" />,
  'color-printed': <Sparkles size={16} color="#a855f7" />,
};

const LABELS: Record<PaintStatus, string> = {
  unpainted: 'Unpainted',
  painted: 'Painted',
  'color-printed': 'Color Printed',
};

export function PaintStatusToggle({
  status,
  onCycle,
}: {
  status: PaintStatus;
  onCycle: () => void;
}) {
  return (
    <button
      onClick={onCycle}
      title={LABELS[status]}
      aria-label={`Paint status: ${LABELS[status]} — tap to cycle`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        minWidth: 36,
        minHeight: 36,
        border: '1px solid var(--border)',
        borderRadius: '6px',
        background: 'var(--bg-surface-2)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'border-color 150ms, background 150ms',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
    >
      {ICONS[status]}
    </button>
  );
}
