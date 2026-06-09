import type { TerrainCounts, ReadyStatus } from '../types';

type TerrainScenario = Partial<TerrainCounts>;
const TERRAIN_TYPES: (keyof TerrainCounts)[] = ['lava', 'metal', 'rock', 'snow', 'stone', 'wood'];

export function getTerrainStatus(
  scenarioTerrain: TerrainScenario,
  inventory: TerrainCounts,
): ReadyStatus {
  const required = TERRAIN_TYPES.filter(t => (scenarioTerrain[t] ?? 0) > 0);
  if (required.length === 0) return 'ready';
  const covered = required.filter(t => inventory[t] >= (scenarioTerrain[t] ?? 0));
  if (covered.length === required.length) return 'ready';
  if (covered.length > 0) return 'partial';
  return 'missing';
}

// Returns 'ready' if all monsters checked, 'partial' if some, 'missing' if none.
// null/undefined scenarioMonsterCounts → 'no-data' (unknown or N/A)
export function getMonsterStatus(
  scenarioMonsterCounts: Record<string, number> | null | undefined,
  monsterInventory: Record<string, boolean>,
): ReadyStatus {
  if (scenarioMonsterCounts === null || scenarioMonsterCounts === undefined) return 'no-data';
  const required = Object.keys(scenarioMonsterCounts);
  if (required.length === 0) return 'ready';
  const covered = required.filter(name => monsterInventory[name] === true);
  if (covered.length === required.length) return 'ready';
  if (covered.length > 0) return 'partial';
  return 'missing';
}

// Combines terrain and monster statuses.
// Only 'ready' if both are ready; only 'missing' if both are missing.
export function combineStatus(terrain: ReadyStatus, monster: ReadyStatus): ReadyStatus {
  if (terrain === 'ready' && monster === 'ready') return 'ready';
  if (terrain === 'missing' && monster === 'missing') return 'missing';
  if (terrain === 'no-data' && monster === 'no-data') return 'no-data';
  if (terrain === 'missing' && monster === 'no-data') return 'missing';
  if (terrain === 'no-data' && monster === 'missing') return 'missing';
  return 'partial';
}

export function getScenarioStatus(
  scenarioTerrain: TerrainScenario | undefined,
  terrain: TerrainCounts,
  monsterCounts?: Record<string, number> | null,
  monsters?: Record<string, boolean>,
): ReadyStatus {
  if (!scenarioTerrain) return 'no-data';
  const tStatus = getTerrainStatus(scenarioTerrain, terrain);
  if (monsterCounts !== undefined && monsters !== undefined) {
    const mStatus = getMonsterStatus(monsterCounts, monsters);
    return combineStatus(tStatus, mStatus);
  }
  return tStatus;
}
