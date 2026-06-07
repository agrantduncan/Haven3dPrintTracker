import { useState, useEffect, useRef, useCallback } from 'react';
import type { TerrainCounts, Inventory } from '../types';
import { loadAllInventory, syncInventory } from '../services/db';

const DEFAULT_TERRAIN: TerrainCounts = {
  lava: 0, metal: 0, rock: 0, snow: 0, stone: 0, wood: 0,
};

const STORAGE_KEYS = {
  terrain: 'fh:terrain',
  monsters: 'fh:monsters',
  obstacles: 'fh:obstacles',
  printing: 'fh:printing',
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable — Neon is the fallback
  }
}

export function useInventory() {
  const [inventory, setInventory] = useState<Inventory>(() => ({
    terrain: loadFromStorage(STORAGE_KEYS.terrain, { ...DEFAULT_TERRAIN }),
    monsters: loadFromStorage(STORAGE_KEYS.monsters, {}),
    obstacles: loadFromStorage(STORAGE_KEYS.obstacles, {}),
    printing: loadFromStorage(STORAGE_KEYS.printing, []),
  }));
  const [isLoading, setIsLoading] = useState(true);

  // On mount: load from Neon, merge over localStorage, then mark ready
  useEffect(() => {
    let cancelled = false;
    loadAllInventory().then(remote => {
      if (cancelled) return;
      setInventory(prev => {
        const terrain = (remote[STORAGE_KEYS.terrain] as TerrainCounts | undefined) ?? prev.terrain;
        const monsters = (remote[STORAGE_KEYS.monsters] as Record<string, number> | undefined) ?? prev.monsters;
        const obstacles = (remote[STORAGE_KEYS.obstacles] as Record<string, number> | undefined) ?? prev.obstacles;
        const printing = (remote[STORAGE_KEYS.printing] as string[] | undefined) ?? prev.printing;
        // Sync Neon data back to localStorage so offline still works
        if (remote[STORAGE_KEYS.terrain]) saveToStorage(STORAGE_KEYS.terrain, terrain);
        if (remote[STORAGE_KEYS.monsters]) saveToStorage(STORAGE_KEYS.monsters, monsters);
        if (remote[STORAGE_KEYS.obstacles]) saveToStorage(STORAGE_KEYS.obstacles, obstacles);
        if (remote[STORAGE_KEYS.printing]) saveToStorage(STORAGE_KEYS.printing, printing);
        return { terrain, monsters, obstacles, printing };
      });
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
    return () => { cancelled = true; };
  }, []);

  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Persist to localStorage immediately; debounce Neon sync (skip during initial Neon load)
  const persist = useCallback((key: string, value: unknown, skipNeon = false) => {
    saveToStorage(key, value);
    if (!skipNeon) {
      clearTimeout(debounceRefs.current[key]);
      debounceRefs.current[key] = setTimeout(() => {
        void syncInventory(key, value);
      }, 500);
    }
  }, []);

  useEffect(() => {
    persist(STORAGE_KEYS.terrain, inventory.terrain, isLoading);
  }, [inventory.terrain, persist, isLoading]);

  useEffect(() => {
    persist(STORAGE_KEYS.monsters, inventory.monsters, isLoading);
  }, [inventory.monsters, persist, isLoading]);

  useEffect(() => {
    persist(STORAGE_KEYS.obstacles, inventory.obstacles, isLoading);
  }, [inventory.obstacles, persist, isLoading]);

  useEffect(() => {
    persist(STORAGE_KEYS.printing, inventory.printing, isLoading);
  }, [inventory.printing, persist, isLoading]);

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
