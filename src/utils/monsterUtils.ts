import monstersData from '../data/monsters.json';
import monsterStandeesData from '../data/monsterStandees.json';

interface MonsterEntry {
  normal: number[];
  elite: number[];
}
interface MonstersJson {
  [scenarioId: string]: Record<string, MonsterEntry>;
}

export const monsters = monstersData as MonstersJson;

// Max standees needed per monster type across all scenarios at 2 players (index 1)
export const MONSTER_MAX_NEEDED: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const scenario of Object.values(monsters)) {
    for (const [name, entry] of Object.entries(scenario)) {
      const count = (entry.normal[1] ?? 0) + (entry.elite[1] ?? 0);
      if (!map[name] || count > map[name]) map[name] = count;
    }
  }
  return map;
})();

export const MONSTER_NAMES_SORTED: string[] = Object.keys(MONSTER_MAX_NEEDED).sort();

const MONSTER_STANDEES = (monsterStandeesData as { counts: Record<string, number> }).counts;

// Standees in the physical/printed set for a monster type. Falls back to the
// max 2-player requirement for variants not in the reference chart (bosses,
// scenario-specific variants like "Living Bones (65)").
export function getStandeeCount(name: string): number {
  return MONSTER_STANDEES[name] ?? MONSTER_MAX_NEEDED[name] ?? 0;
}

const NO_MONSTER_SCENARIOS = new Set(['91']);

// Returns per-monster 2-player counts for a specific scenario.
// undefined = unknown, null = doesn't exist, {} = explicitly no monsters
export function getScenarioMonsterCounts(
  scenarioId: string,
): Record<string, number> | null | undefined {
  if (scenarioId === '102') return null;
  if (NO_MONSTER_SCENARIOS.has(scenarioId)) return {};
  const entry = monsters[scenarioId];
  if (!entry) return undefined;
  const result: Record<string, number> = {};
  for (const [name, data] of Object.entries(entry)) {
    result[name] = (data.normal[1] ?? 0) + (data.elite[1] ?? 0);
  }
  return result;
}
