import { useState, useCallback } from 'react';

export type PaintStatus = 'unpainted' | 'painted' | 'color-printed';

const CYCLE: PaintStatus[] = ['unpainted', 'painted', 'color-printed'];

function load(): Record<string, PaintStatus> {
  try {
    const raw = localStorage.getItem('fh:paintstatus');
    return raw ? (JSON.parse(raw) as Record<string, PaintStatus>) : {};
  } catch {
    return {};
  }
}

function save(data: Record<string, PaintStatus>) {
  localStorage.setItem('fh:paintstatus', JSON.stringify(data));
}

export function usePaintStatus() {
  const [paintStatus, setPaintStatus] = useState<Record<string, PaintStatus>>(load);

  const getStatus = useCallback(
    (name: string): PaintStatus => paintStatus[name] ?? 'unpainted',
    [paintStatus],
  );

  const cycleStatus = useCallback((name: string) => {
    setPaintStatus(prev => {
      const current = prev[name] ?? 'unpainted';
      const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
      const updated = { ...prev, [name]: next };
      save(updated);
      return updated;
    });
  }, []);

  return { paintStatus, getStatus, cycleStatus };
}
