import { describe, it, expect } from 'vitest'
import { getScenarioMonsters, getScenario4Entries } from './scenarioHelpers'

describe('getScenarioMonsters', () => {
  it('returns monster data for a valid scenario', () => {
    const result = getScenarioMonsters('1')
    expect(result).toBeDefined()
    expect(result).not.toBeNull()
    // Scenario 1 should have at least one monster
    expect(Object.keys(result!).length).toBeGreaterThan(0)
  })

  it('returns empty object for scenario 91 (confirmed no monsters)', () => {
    const result = getScenarioMonsters('91')
    expect(result).toBeDefined()
    expect(result).not.toBeNull()
    expect(Object.keys(result!)).toHaveLength(0)
  })

  it('returns undefined for scenario 93 (monster data unknown)', () => {
    const result = getScenarioMonsters('93')
    expect(result).toBeUndefined()
  })

  it('returns null for scenario 102 (does not exist in game)', () => {
    const result = getScenarioMonsters('102')
    expect(result).toBeNull()
  })
})

describe('getScenario4Entries', () => {
  it('returns both 4A and 4B entries', () => {
    const { '4A': a, '4B': b } = getScenario4Entries()
    expect(Object.keys(a).length).toBeGreaterThan(0)
    expect(Object.keys(b).length).toBeGreaterThan(0)
  })

  it('4A and 4B have different monster sets', () => {
    const { '4A': a, '4B': b } = getScenario4Entries()
    // Not identical keys
    expect(Object.keys(a).join(',')).not.toBe(Object.keys(b).join(','))
  })
})
