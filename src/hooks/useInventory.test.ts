import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInventory } from './useInventory'

// Use a real localStorage mock backed by a Map
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

beforeEach(() => {
  localStorageMock.clear()
  vi.useFakeTimers()
})

describe('useInventory', () => {
  it('loads default terrain as all zeros when localStorage is empty', () => {
    const { result } = renderHook(() => useInventory())
    const { terrain } = result.current.inventory
    expect(terrain).toEqual({ lava: 0, metal: 0, rock: 0, snow: 0, stone: 0, wood: 0 })
  })

  it('updateTerrain saves correctly to localStorage under fh:terrain', async () => {
    const { result } = renderHook(() => useInventory())
    act(() => { result.current.updateTerrain('snow', 42) })
    act(() => { vi.runAllTimers() })
    const saved = JSON.parse(localStorageMock.getItem('fh:terrain')!)
    expect(saved.snow).toBe(42)
  })

  it('updateMonster saves correctly to localStorage under fh:monsters', () => {
    const { result } = renderHook(() => useInventory())
    act(() => { result.current.updateMonster('Algox Archer', 3) })
    act(() => { vi.runAllTimers() })
    const saved = JSON.parse(localStorageMock.getItem('fh:monsters')!)
    expect(saved['Algox Archer']).toBe(3)
  })

  it('togglePrinting adds item to fh:printing list', () => {
    const { result } = renderHook(() => useInventory())
    act(() => { result.current.togglePrinting('Algox Guard') })
    act(() => { vi.runAllTimers() })
    const saved = JSON.parse(localStorageMock.getItem('fh:printing')!)
    expect(saved).toContain('Algox Guard')
  })

  it('togglePrinting removes item if already in list', () => {
    const { result } = renderHook(() => useInventory())
    act(() => { result.current.togglePrinting('Algox Guard') })
    act(() => { result.current.togglePrinting('Algox Guard') })
    act(() => { vi.runAllTimers() })
    const saved = JSON.parse(localStorageMock.getItem('fh:printing')!)
    expect(saved).not.toContain('Algox Guard')
  })

  it('loads inventory from existing localStorage data', () => {
    localStorageMock.setItem('fh:terrain', JSON.stringify({ lava: 10, metal: 20, rock: 0, snow: 5, stone: 0, wood: 0 }))
    localStorageMock.setItem('fh:monsters', JSON.stringify({ 'Algox Archer': 4 }))
    const { result } = renderHook(() => useInventory())
    expect(result.current.inventory.terrain.lava).toBe(10)
    expect(result.current.inventory.terrain.snow).toBe(5)
    expect(result.current.inventory.monsters['Algox Archer']).toBe(4)
  })
})
