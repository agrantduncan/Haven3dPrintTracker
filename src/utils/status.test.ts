import { describe, it, expect } from 'vitest'
import { getTerrainStatus, getScenarioStatus } from './status'
import terrainData from '../data/terrain.json'

const FULL_INVENTORY = { lava: 35, metal: 132, rock: 128, snow: 140, stone: 118, wood: 87 }
const ZERO_INVENTORY = { lava: 0, metal: 0, rock: 0, snow: 0, stone: 0, wood: 0 }

describe('getTerrainStatus', () => {
  it('returns ready when inventory meets all requirements', () => {
    const scenario = { snow: 89, rock: 33 }
    const inventory = { ...ZERO_INVENTORY, snow: 90, rock: 40 }
    expect(getTerrainStatus(scenario, inventory)).toBe('ready')
  })

  it('returns partial when inventory covers some but not all terrain types', () => {
    const scenario = { snow: 89, rock: 33 }
    const inventory = { ...ZERO_INVENTORY, snow: 90, rock: 0 }
    expect(getTerrainStatus(scenario, inventory)).toBe('partial')
  })

  it('returns missing when inventory is all zeros', () => {
    const scenario = { snow: 89, rock: 33 }
    expect(getTerrainStatus(scenario, ZERO_INVENTORY)).toBe('missing')
  })

  it('returns ready when scenario has no terrain requirements', () => {
    expect(getTerrainStatus({}, ZERO_INVENTORY)).toBe('ready')
  })

  it('returns ready when inventory exactly meets requirements', () => {
    const scenario = { lava: 35, metal: 132 }
    expect(getTerrainStatus(scenario, FULL_INVENTORY)).toBe('ready')
  })
})

describe('getScenarioStatus', () => {
  it('returns no-data when scenarioTerrain is undefined', () => {
    expect(getScenarioStatus(undefined, ZERO_INVENTORY)).toBe('no-data')
  })

  it('delegates to getTerrainStatus when terrain data is present', () => {
    const scenario = { snow: 50 }
    const inventory = { ...ZERO_INVENTORY, snow: 100 }
    expect(getScenarioStatus(scenario, inventory)).toBe('ready')
  })
})

describe('terrain.json scenario 102', () => {
  it('scenario 102 does not exist in terrain.json', () => {
    const scenarios = (terrainData as { scenarios: Record<string, unknown> }).scenarios
    expect(scenarios['102']).toBeUndefined()
  })
})
