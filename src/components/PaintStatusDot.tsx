import type { PaintStatus } from '../hooks/usePaintStatus';

const DOT_COLORS: Record<PaintStatus, string> = {
  unpainted: '#4a5568',
  painted: 'var(--accent)',
  'color-printed': '#a855f7',
};

const DOT_TITLES: Record<PaintStatus, string> = {
  unpainted: 'Unpainted',
  painted: 'Painted',
  'color-printed': 'Color Printed',
};

export function PaintStatusDot({ status }: { status: PaintStatus }) {
  return (
    <span
      title={DOT_TITLES[status]}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: DOT_COLORS[status],
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}
