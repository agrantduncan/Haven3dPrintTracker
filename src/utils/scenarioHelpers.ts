import monstersData from '../data/monsters.json'

interface MonsterEntry {
  normal: number[];
  elite: number[];
}
interface MonstersJson {
  [scenarioId: string]: Record<string, MonsterEntry>;
}

const monsters = monstersData as MonstersJson;

// Scenarios confirmed to have no monsters (empty list, not unknown)
const SCENARIOS_WITH_NO_MONSTERS = new Set(['91']);

/**
 * Returns monster data for a scenario id.
 * - Returns an empty object for scenarios confirmed to have no monsters (e.g. 91)
 * - Returns undefined for scenarios not in monsters.json (unknown, e.g. 93)
 * - Returns null for scenario 102 (does not exist in the game)
 */
export function getScenarioMonsters(
  scenarioId: string,
): Record<string, MonsterEntry> | null | undefined {
  if (scenarioId === '102') return null;
  if (SCENARIOS_WITH_NO_MONSTERS.has(scenarioId)) return {};
  return monsters[scenarioId];
}

/**
 * Returns the 4A and 4B sub-entries for scenario 4.
 */
export function getScenario4Entries(): {
  '4A': Record<string, MonsterEntry>;
  '4B': Record<string, MonsterEntry>;
} {
  return {
    '4A': monsters['4A'] ?? {},
    '4B': monsters['4B'] ?? {},
  };
}
