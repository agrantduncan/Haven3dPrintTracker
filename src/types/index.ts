export interface TerrainCounts {
  lava: number;
  metal: number;
  rock: number;
  snow: number;
  stone: number;
  wood: number;
}

export interface MonsterEntry {
  normal: number[];
  elite: number[];
}

export interface ScenarioMonsters {
  [monsterName: string]: MonsterEntry;
}

export interface Inventory {
  terrain: TerrainCounts;
  monsters: Record<string, boolean>; // true = have full set
  obstacles: Record<string, number>;
  printing: string[];
  pinned: string[];
}

export type ReadyStatus = 'ready' | 'partial' | 'missing' | 'no-data';

export type PaintStatus = 'unpainted' | 'painted' | 'color-printed';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
