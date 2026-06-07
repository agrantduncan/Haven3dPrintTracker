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
  monsters: Record<string, number>;
  obstacles: Record<string, number>;
  printing: string[];
}

export type ReadyStatus = 'ready' | 'partial' | 'missing' | 'no-data';
