import { describe, it, expect } from 'vitest'
import { getTerrainStatus, getScenarioStatus, getMonsterStatus, combineStatus } from './status'
import terrainData from '../data/terrain.json'

const FULL_INVENTORY = { lava: 35, metal: 132, rock: 128, snow: 140, stone: 118, wood: 87 }
const ZERO_INVENTORY = { lava: 0, metal: 0, rock: 0, snow: 0, stone: 0, wood: 0 }

describe('getTerrainStatus', () => {
  it('returns ready when inventory meets all requirements', () => {
    expect(getTerrainStatus({ snow: 89, rock: 33 }, { ...ZERO_INVENTORY, snow: 90, rock: 40 })).toBe('ready')
  })
  it('returns partial when inventory covers some terrain types', () => {
    expect(getTerrainStatus({ snow: 89, rock: 33 }, { ...ZERO_INVENTORY, snow: 90, rock: 0 })).toBe('partial')
  })
  it('returns missing when inventory is all zeros', () => {
    expect(getTerrainStatus({ snow: 89, rock: 33 }, ZERO_INVENTORY)).toBe('missing')
  })
  it('returns ready when scenario has no terrain requirements', () => {
    expect(getTerrainStatus({}, ZERO_INVENTORY)).toBe('ready')
  })
  it('returns ready when inventory exactly meets requirements', () => {
    expect(getTerrainStatus({ lava: 35, metal: 132 }, FULL_INVENTORY)).toBe('ready')
  })
})

describe('getMonsterStatus', () => {
  it('returns no-data when counts are null', () => {
    expect(getMonsterStatus(null, {})).toBe('no-data')
  })
  it('returns no-data when counts are undefined', () => {
    expect(getMonsterStatus(undefined, {})).toBe('no-data')
  })
  it('returns ready when scenario has no monsters', () => {
    expect(getMonsterStatus({}, {})).toBe('ready')
  })
  it('returns ready when all required monsters are checked', () => {
    const counts = { 'Algox Archer': 4, 'Algox Guard': 3 }
    const inv = { 'Algox Archer': true, 'Algox Guard': true }
    expect(getMonsterStatus(counts, inv)).toBe('ready')
  })
  it('returns partial when some monsters are checked', () => {
    const counts = { 'Algox Archer': 4, 'Algox Guard': 3 }
    const inv = { 'Algox Archer': true }
    expect(getMonsterStatus(counts, inv)).toBe('partial')
  })
  it('returns missing when no monsters are checked', () => {
    const counts = { 'Algox Archer': 4, 'Algox Guard': 3 }
    expect(getMonsterStatus(counts, {})).toBe('missing')
  })
  it('treats false as unchecked (missing)', () => {
    const counts = { 'Algox Archer': 4 }
    const inv = { 'Algox Archer': false }
    expect(getMonsterStatus(counts, inv)).toBe('missing')
  })
})

describe('combineStatus', () => {
  it('returns ready only when both terrain and monsters are ready', () => {
    expect(combineStatus('ready', 'ready')).toBe('ready')
  })
  it('returns missing when both terrain and monsters are missing', () => {
    expect(combineStatus('missing', 'missing')).toBe('missing')
  })
  it('returns partial when terrain ready but monsters missing', () => {
    expect(combineStatus('ready', 'missing')).toBe('partial')
  })
  it('returns partial when terrain missing but monsters ready', () => {
    expect(combineStatus('missing', 'ready')).toBe('partial')
  })
  it('returns partial when terrain ready and monsters no-data', () => {
    expect(combineStatus('ready', 'no-data')).toBe('partial')
  })
})

describe('getScenarioStatus', () => {
  it('returns no-data when scenarioTerrain is undefined', () => {
    expect(getScenarioStatus(undefined, ZERO_INVENTORY)).toBe('no-data')
  })
  it('returns terrain-only status when no monster args given', () => {
    expect(getScenarioStatus({ snow: 50 }, { ...ZERO_INVENTORY, snow: 100 })).toBe('ready')
  })
  it('combines terrain and monster status when monster args given', () => {
    const scenario = { snow: 50 }
    const monsterCounts = { 'Algox Archer': 4 }
    const monsters = { 'Algox Archer': true }
    expect(getScenarioStatus(scenario, { ...ZERO_INVENTORY, snow: 100 }, monsterCounts, monsters)).toBe('ready')
  })
  it('returns partial when terrain ready but monsters missing', () => {
    const scenario = { snow: 50 }
    const monsterCounts = { 'Algox Archer': 4 }
    expect(getScenarioStatus(scenario, { ...ZERO_INVENTORY, snow: 100 }, monsterCounts, {})).toBe('partial')
  })
})

describe('terrain.json scenario 102', () => {
  it('scenario 102 does not exist in terrain.json', () => {
    const scenarios = (terrainData as { scenarios: Record<string, unknown> }).scenarios
    expect(scenarios['102']).toBeUndefined()
  })
})
