import {
  useState, useEffect, useRef, useCallback,
  createContext, useContext,
} from 'react';
import type { ReactNode } from 'react';
import type { TerrainCounts, Inventory, SaveStatus } from '../types';
import { loadAllInventory, syncInventory } from '../services/db';

const DEFAULT_TERRAIN: TerrainCounts = {
  lava: 0, metal: 0, rock: 0, snow: 0, stone: 0, wood: 0,
};

const DEFAULT_INVENTORY: Inventory = {
  terrain: { ...DEFAULT_TERRAIN },
  monsters: {},
  obstacles: {},
  printing: [],
  pinned: [],
};

const KEYS = {
  terrain: 'fh:terrain',
  monsters: 'fh:monsters',
  obstacles: 'fh:obstacles',
  printing: 'fh:printing',
  pinned: 'fh:pinned',
} as const;

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function writeLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* offline ok */ }
}

// Migrate old numeric monster format {name: number} → {name: boolean}.
// Monsters with count > 0 or any paint status become true.
function migrateMonsters(raw: Record<string, unknown>): { result: Record<string, boolean>; didMigrate: boolean } {
  let paintStatus: Record<string, string> = {};
  try {
    const ps = localStorage.getItem('fh:paintstatus');
    if (ps) paintStatus = JSON.parse(ps) as Record<string, string>;
  } catch { /* ignore */ }

  const result: Record<string, boolean> = {};
  let didMigrate = false;
  for (const [name, val] of Object.entries(raw)) {
    if (typeof val === 'boolean') {
      result[name] = val;
    } else if (typeof val === 'number') {
      didMigrate = true;
      const hasPaint = paintStatus[name] && paintStatus[name] !== 'unpainted';
      result[name] = val > 0 || Boolean(hasPaint);
    }
  }
  return { result, didMigrate };
}

export interface InventoryContextValue {
  inventory: Inventory;
  isLoading: boolean;
  saveStatus: SaveStatus;
  updateTerrain: (type: keyof TerrainCounts, value: number) => void;
  updateMonster: (name: string, checked: boolean) => void;
  updateObstacle: (name: string, value: number) => void;
  togglePrinting: (name: string) => void;
  pin: (id: string) => void;
  unpin: (id: string) => void;
  isPinned: (id: string) => boolean;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

function useInventoryImpl(): InventoryContextValue {
  const [inventory, setInventory] = useState<Inventory>(DEFAULT_INVENTORY);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const pendingRef = useRef<Map<string, unknown>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savedClearRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const scheduleSave = useCallback((key: string, value: unknown) => {
    writeLocal(key, value);
    pendingRef.current.set(key, value);
    setSaveStatus('saving');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const batch = new Map(pendingRef.current);
      pendingRef.current.clear();
      try {
        await Promise.all([...batch.entries()].map(([k, v]) => syncInventory(k, v)));
        setSaveStatus('saved');
        clearTimeout(savedClearRef.current);
        savedClearRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (err) {
        console.error('[db] save failed:', err instanceof Error ? err.message : err);
        setSaveStatus('error');
      }
    }, 800);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let remote: Record<string, unknown> = {};
      let neonOk = false;
      try {
        remote = await loadAllInventory();
        neonOk = true;
      } catch { /* fall back to localStorage */ }

      if (cancelled) return;

      const terrain = (remote[KEYS.terrain] as TerrainCounts | undefined)
        ?? readLocal<TerrainCounts>(KEYS.terrain, { ...DEFAULT_TERRAIN });

      const rawMonsters = (remote[KEYS.monsters] as Record<string, unknown> | undefined)
        ?? readLocal<Record<string, unknown>>(KEYS.monsters, {});
      const { result: monsters, didMigrate } = migrateMonsters(rawMonsters);

      const obstacles = (remote[KEYS.obstacles] as Record<string, number> | undefined)
        ?? readLocal<Record<string, number>>(KEYS.obstacles, {});

      const printing = (remote[KEYS.printing] as string[] | undefined)
        ?? readLocal<string[]>(KEYS.printing, []);

      const pinned = (remote[KEYS.pinned] as string[] | undefined)
        ?? readLocal<string[]>(KEYS.pinned, []);

      const inv: Inventory = { terrain, monsters, obstacles, printing, pinned };
      setInventory(inv);
      setIsLoading(false);

      // Offline backup
      writeLocal(KEYS.terrain, terrain);
      writeLocal(KEYS.monsters, monsters);
      writeLocal(KEYS.obstacles, obstacles);
      writeLocal(KEYS.printing, printing);
      writeLocal(KEYS.pinned, pinned);

      // If we migrated monster format, persist the new format to Neon
      if (didMigrate && neonOk) {
        try { await syncInventory(KEYS.monsters, monsters); } catch { /* ok */ }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  const updateTerrain = useCallback((type: keyof TerrainCounts, value: number) => {
    setInventory(prev => {
      const terrain = { ...prev.terrain, [type]: Math.max(0, value) };
      scheduleSave(KEYS.terrain, terrain);
      return { ...prev, terrain };
    });
  }, [scheduleSave]);

  const updateMonster = useCallback((name: string, checked: boolean) => {
    setInventory(prev => {
      const monsters = { ...prev.monsters, [name]: checked };
      scheduleSave(KEYS.monsters, monsters);
      return { ...prev, monsters };
    });
  }, [scheduleSave]);

  const updateObstacle = useCallback((name: string, value: number) => {
    setInventory(prev => {
      const obstacles = { ...prev.obstacles, [name]: Math.max(0, value) };
      scheduleSave(KEYS.obstacles, obstacles);
      return { ...prev, obstacles };
    });
  }, [scheduleSave]);

  const togglePrinting = useCallback((name: string) => {
    setInventory(prev => {
      const printing = prev.printing.includes(name)
        ? prev.printing.filter(n => n !== name)
        : [...prev.printing, name];
      scheduleSave(KEYS.printing, printing);
      return { ...prev, printing };
    });
  }, [scheduleSave]);

  const pin = useCallback((id: string) => {
    setInventory(prev => {
      if (prev.pinned.includes(id)) return prev;
      const pinned = [...prev.pinned, id];
      scheduleSave(KEYS.pinned, pinned);
      return { ...prev, pinned };
    });
  }, [scheduleSave]);

  const unpin = useCallback((id: string) => {
    setInventory(prev => {
      const pinned = prev.pinned.filter(p => p !== id);
      scheduleSave(KEYS.pinned, pinned);
      return { ...prev, pinned };
    });
  }, [scheduleSave]);

  const isPinned = useCallback((id: string) => inventory.pinned.includes(id), [inventory.pinned]);

  return {
    inventory, isLoading, saveStatus,
    updateTerrain, updateMonster, updateObstacle,
    togglePrinting, pin, unpin, isPinned,
  };
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const value = useInventoryImpl();
  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used inside <InventoryProvider>');
  return ctx;
}
