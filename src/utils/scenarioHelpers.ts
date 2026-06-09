import monstersData from '../data/monsters.json';
import terrainData from '../data/terrain.json';

interface MonsterEntry {
  normal: number[];
  elite: number[];
}
interface MonstersJson {
  [scenarioId: string]: Record<string, MonsterEntry>;
}
interface TerrainJson {
  maxNeeded: Record<string, number>;
  scenarios: Record<string, unknown>;
}

const monsters = monstersData as MonstersJson;
const terrain = terrainData as TerrainJson;

const SCENARIOS_WITH_NO_MONSTERS = new Set(['91']);

export function getScenarioMonsters(
  scenarioId: string,
): Record<string, MonsterEntry> | null | undefined {
  if (scenarioId === '102') return null;
  if (SCENARIOS_WITH_NO_MONSTERS.has(scenarioId)) return {};
  return monsters[scenarioId];
}

export function getScenario4Entries(): {
  '4A': Record<string, MonsterEntry>;
  '4B': Record<string, MonsterEntry>;
} {
  return {
    '4A': monsters['4A'] ?? {},
    '4B': monsters['4B'] ?? {},
  };
}

// All scenario IDs used throughout the app (no 102, splits 4 → 4A + 4B).
export const ALL_SCENARIO_IDS: string[] = (() => {
  const ids: string[] = [];
  for (const id of Object.keys(terrain.scenarios).filter(k => k !== '102')) {
    if (id === '4') { ids.push('4A', '4B'); }
    else ids.push(id);
  }
  return ids;
})();
