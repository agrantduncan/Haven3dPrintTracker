import type { TerrainCounts, ReadyStatus } from '../types';

type TerrainScenario = Partial<TerrainCounts>;
type TerrainInventory = TerrainCounts;

const TERRAIN_TYPES: (keyof TerrainCounts)[] = ['lava', 'metal', 'rock', 'snow', 'stone', 'wood'];

export function getTerrainStatus(
  scenarioTerrain: TerrainScenario,
  inventory: TerrainInventory,
): ReadyStatus {
  const required = TERRAIN_TYPES.filter(t => (scenarioTerrain[t] ?? 0) > 0);

  if (required.length === 0) return 'ready';

  const covered = required.filter(t => inventory[t] >= (scenarioTerrain[t] ?? 0));

  if (covered.length === required.length) return 'ready';
  if (covered.length > 0) return 'partial';
  return 'missing';
}

export function getScenarioStatus(
  scenarioTerrain: TerrainScenario | undefined,
  inventory: TerrainInventory,
): ReadyStatus {
  if (!scenarioTerrain) return 'no-data';
  return getTerrainStatus(scenarioTerrain, inventory);
}
