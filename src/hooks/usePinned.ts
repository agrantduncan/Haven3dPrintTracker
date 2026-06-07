import { useState, useCallback } from 'react';

function load(): string[] {
  try {
    const raw = localStorage.getItem('fh:pinned');
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function save(pinned: string[]) {
  localStorage.setItem('fh:pinned', JSON.stringify(pinned));
}

export function usePinned() {
  const [pinned, setPinned] = useState<string[]>(load);

  const pin = useCallback((id: string) => {
    setPinned(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      save(next);
      return next;
    });
  }, []);

  const unpin = useCallback((id: string) => {
    setPinned(prev => {
      const next = prev.filter(p => p !== id);
      save(next);
      return next;
    });
  }, []);

  const isPinned = useCallback((id: string) => pinned.includes(id), [pinned]);

  return { pinned, pin, unpin, isPinned };
}
