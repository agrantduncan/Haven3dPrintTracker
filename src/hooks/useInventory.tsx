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

function readPaintStatus(): Record<string, string> {
  try {
    const ps = localStorage.getItem('fh:paintstatus');
    return ps ? (JSON.parse(ps) as Record<string, string>) : {};
  } catch { return {}; }
}

// Migrate old numeric monster format {name: number} → {name: boolean}.
function migrateMonsters(raw: Record<string, unknown>): { result: Record<string, boolean>; didMigrate: boolean } {
  const paintStatus = readPaintStatus();
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

  // Tracks whether we've completed the initial Neon load so the save-on-change
  // effect doesn't fire during (or immediately after) the initial load.
  const isReadyRef = useRef(false);
  // Snapshot of last-saved inventory for change detection in the save effect.
  const lastSavedRef = useRef<Inventory | null>(null);

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

  // ── Save-on-change effect ───────────────────────────────────────────────────
  // Called whenever inventory changes. Skipped before the initial Neon load
  // completes (isReadyRef = false) and skipped on the first render post-load
  // (lastSavedRef = null, which we use to record the baseline).
  // Only user-initiated changes trigger a save.
  useEffect(() => {
    if (!isReadyRef.current) return;
    if (lastSavedRef.current === null) {
      // First render after load — record baseline, do not save
      lastSavedRef.current = inventory;
      return;
    }
    const prev = lastSavedRef.current;
    lastSavedRef.current = inventory;
    // Reference equality: objects are replaced on every state update
    if (prev.terrain !== inventory.terrain) scheduleSave(KEYS.terrain, inventory.terrain);
    if (prev.monsters !== inventory.monsters) scheduleSave(KEYS.monsters, inventory.monsters);
    if (prev.obstacles !== inventory.obstacles) scheduleSave(KEYS.obstacles, inventory.obstacles);
    if (prev.printing !== inventory.printing) scheduleSave(KEYS.printing, inventory.printing);
    if (prev.pinned !== inventory.pinned) scheduleSave(KEYS.pinned, inventory.pinned);
  }, [inventory, scheduleSave]);

  // ── Initial Neon load ───────────────────────────────────────────────────────
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
      const { result: migratedMonsters, didMigrate } = migrateMonsters(rawMonsters);

      // Auto-check any monster with paint status != 'unpainted' (Bug 2 fix)
      const paintStatus = readPaintStatus();
      const monsters: Record<string, boolean> = { ...migratedMonsters };
      let monstersAutoUpdated = false;
      for (const [name, status] of Object.entries(paintStatus)) {
        if (status !== 'unpainted' && monsters[name] !== true) {
          monsters[name] = true;
          monstersAutoUpdated = true;
        }
      }

      const obstacles = (remote[KEYS.obstacles] as Record<string, number> | undefined)
        ?? readLocal<Record<string, number>>(KEYS.obstacles, {});
      const printing = (remote[KEYS.printing] as string[] | undefined)
        ?? readLocal<string[]>(KEYS.printing, []);
      const pinned = (remote[KEYS.pinned] as string[] | undefined)
        ?? readLocal<string[]>(KEYS.pinned, []);

      const inv: Inventory = { terrain, monsters, obstacles, printing, pinned };

      // Offline backup
      writeLocal(KEYS.terrain, terrain);
      writeLocal(KEYS.monsters, monsters);
      writeLocal(KEYS.obstacles, obstacles);
      writeLocal(KEYS.printing, printing);
      writeLocal(KEYS.pinned, pinned);

      // Write back to Neon if data changed during load (migration or auto-check)
      if (neonOk && (didMigrate || monstersAutoUpdated)) {
        try { await syncInventory(KEYS.monsters, monsters); } catch { /* ok */ }
      }

      if (cancelled) return;

      // Mark as ready BEFORE setting state so the save-on-change effect
      // can immediately recognise this as the baseline (not a user change).
      isReadyRef.current = true;
      setInventory(inv);
      setIsLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  // ── Pure state updaters (no side effects) ──────────────────────────────────
  const updateTerrain = useCallback((type: keyof TerrainCounts, value: number) => {
    setInventory(prev => ({ ...prev, terrain: { ...prev.terrain, [type]: Math.max(0, value) } }));
  }, []);

  const updateMonster = useCallback((name: string, checked: boolean) => {
    setInventory(prev => ({ ...prev, monsters: { ...prev.monsters, [name]: checked } }));
  }, []);

  const updateObstacle = useCallback((name: string, value: number) => {
    setInventory(prev => ({ ...prev, obstacles: { ...prev.obstacles, [name]: Math.max(0, value) } }));
  }, []);

  const togglePrinting = useCallback((name: string) => {
    setInventory(prev => {
      const printing = prev.printing.includes(name)
        ? prev.printing.filter(n => n !== name)
        : [...prev.printing, name];
      return { ...prev, printing };
    });
  }, []);

  const pin = useCallback((id: string) => {
    setInventory(prev => {
      if (prev.pinned.includes(id)) return prev;
      return { ...prev, pinned: [...prev.pinned, id] };
    });
  }, []);

  const unpin = useCallback((id: string) => {
    setInventory(prev => ({ ...prev, pinned: prev.pinned.filter(p => p !== id) }));
  }, []);

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
