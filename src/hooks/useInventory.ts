import { useState, useEffect, useRef, useCallback } from 'react';
import type { TerrainCounts, Inventory } from '../types';

const DEFAULT_TERRAIN: TerrainCounts = {
  lava: 0, metal: 0, rock: 0, snow: 0, stone: 0, wood: 0,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useInventory() {
  const [inventory, setInventory] = useState<Inventory>(() => ({
    terrain: loadFromStorage('fh:terrain', { ...DEFAULT_TERRAIN }),
    monsters: loadFromStorage('fh:monsters', {}),
    obstacles: loadFromStorage('fh:obstacles', {}),
    printing: loadFromStorage('fh:printing', []),
  }));
  const [isLoading] = useState(false);

  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const persist = useCallback((key: string, value: unknown) => {
    clearTimeout(debounceRefs.current[key]);
    debounceRefs.current[key] = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(value));
    }, 500);
  }, []);

  useEffect(() => {
    persist('fh:terrain', inventory.terrain);
  }, [inventory.terrain, persist]);

  useEffect(() => {
    persist('fh:monsters', inventory.monsters);
  }, [inventory.monsters, persist]);

  useEffect(() => {
    persist('fh:obstacles', inventory.obstacles);
  }, [inventory.obstacles, persist]);

  useEffect(() => {
    persist('fh:printing', inventory.printing);
  }, [inventory.printing, persist]);

  const updateTerrain = useCallback((type: keyof TerrainCounts, value: number) => {
    setInventory(prev => ({
      ...prev,
      terrain: { ...prev.terrain, [type]: Math.max(0, value) },
    }));
  }, []);

  const updateMonster = useCallback((name: string, value: number) => {
    setInventory(prev => ({
      ...prev,
      monsters: { ...prev.monsters, [name]: Math.max(0, value) },
    }));
  }, []);

  const updateObstacle = useCallback((name: string, value: number) => {
    setInventory(prev => ({
      ...prev,
      obstacles: { ...prev.obstacles, [name]: Math.max(0, value) },
    }));
  }, []);

  const togglePrinting = useCallback((name: string) => {
    setInventory(prev => {
      const printing = prev.printing.includes(name)
        ? prev.printing.filter(n => n !== name)
        : [...prev.printing, name];
      return { ...prev, printing };
    });
  }, []);

  return { inventory, updateTerrain, updateMonster, updateObstacle, togglePrinting, isLoading };
}
