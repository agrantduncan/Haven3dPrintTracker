import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { InventoryProvider, useInventory } from './useInventory'

// Mock the db service — no real API in tests
vi.mock('../services/db', () => ({
  loadAllInventory: vi.fn().mockResolvedValue({}),
  syncInventory: vi.fn().mockResolvedValue(undefined),
}))

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(InventoryProvider, null, children)

beforeEach(() => {
  localStorageMock.clear()
  vi.useFakeTimers()
})

// Flush the async Neon load (resolves with {}) so the hook transitions
// from isLoading=true to isLoading=false before we test mutations.
async function waitForLoad() {
  await act(async () => { await Promise.resolve() })
}

describe('useInventory', () => {
  it('loads default terrain as all zeros on first run', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    expect(result.current.inventory.terrain).toEqual({ lava: 0, metal: 0, rock: 0, snow: 0, stone: 0, wood: 0 })
  })

  it('updateTerrain saves to localStorage under fh:terrain', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    act(() => { result.current.updateTerrain('snow', 42) })
    act(() => { vi.runAllTimers() })
    const saved = JSON.parse(localStorageMock.getItem('fh:terrain')!)
    expect(saved.snow).toBe(42)
  })

  it('updateMonster saves boolean true to localStorage under fh:monsters', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    act(() => { result.current.updateMonster('Algox Archer', true) })
    act(() => { vi.runAllTimers() })
    const saved = JSON.parse(localStorageMock.getItem('fh:monsters')!)
    expect(saved['Algox Archer']).toBe(true)
  })

  it('updateMonster saves boolean false', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    act(() => { result.current.updateMonster('Algox Archer', true) })
    act(() => { result.current.updateMonster('Algox Archer', false) })
    act(() => { vi.runAllTimers() })
    const saved = JSON.parse(localStorageMock.getItem('fh:monsters')!)
    expect(saved['Algox Archer']).toBe(false)
  })

  it('updateMonster reflects immediately in React state', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    act(() => { result.current.updateMonster('Forest Imp', true) })
    expect(result.current.inventory.monsters['Forest Imp']).toBe(true)
  })

  it('togglePrinting adds item to fh:printing list', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    act(() => { result.current.togglePrinting('Algox Guard') })
    act(() => { vi.runAllTimers() })
    const saved = JSON.parse(localStorageMock.getItem('fh:printing')!)
    expect(saved).toContain('Algox Guard')
  })

  it('togglePrinting removes item if already in list', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    act(() => { result.current.togglePrinting('Algox Guard') })
    act(() => { result.current.togglePrinting('Algox Guard') })
    act(() => { vi.runAllTimers() })
    const saved = JSON.parse(localStorageMock.getItem('fh:printing')!)
    expect(saved).not.toContain('Algox Guard')
  })

  it('pin/unpin updates fh:pinned in localStorage', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    act(() => { result.current.pin('5') })
    act(() => { vi.runAllTimers() })
    expect(JSON.parse(localStorageMock.getItem('fh:pinned')!)).toContain('5')

    act(() => { result.current.unpin('5') })
    act(() => { vi.runAllTimers() })
    expect(JSON.parse(localStorageMock.getItem('fh:pinned')!)).not.toContain('5')
  })

  it('isPinned returns true after pin', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    act(() => { result.current.pin('7') })
    expect(result.current.isPinned('7')).toBe(true)
  })

  it('loads terrain from localStorage when Neon returns empty', async () => {
    localStorageMock.setItem('fh:terrain', JSON.stringify({ lava: 10, metal: 20, rock: 0, snow: 5, stone: 0, wood: 0 }))
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    expect(result.current.inventory.terrain.lava).toBe(10)
    expect(result.current.inventory.terrain.snow).toBe(5)
  })

  it('migrates numeric monster format to boolean on load', async () => {
    localStorageMock.setItem('fh:monsters', JSON.stringify({ 'Algox Archer': 4, 'City Guard': 0 }))
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    expect(result.current.inventory.monsters['Algox Archer']).toBe(true)
    expect(result.current.inventory.monsters['City Guard']).toBe(false)
  })

  it('auto-checks monsters with non-unpainted paint status on load', async () => {
    localStorageMock.setItem('fh:monsters', JSON.stringify({ 'Forest Imp': false }))
    localStorageMock.setItem('fh:paintstatus', JSON.stringify({ 'Forest Imp': 'painted' }))
    const { result } = renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    expect(result.current.inventory.monsters['Forest Imp']).toBe(true)
  })

  it('does not auto-save loaded state back to Neon (no spurious saves)', async () => {
    const { syncInventory } = await import('../services/db')
    const spy = vi.mocked(syncInventory)
    spy.mockClear()
    localStorageMock.setItem('fh:terrain', JSON.stringify({ lava: 5, metal: 0, rock: 0, snow: 0, stone: 0, wood: 0 }))
    renderHook(() => useInventory(), { wrapper })
    await waitForLoad()
    act(() => { vi.runAllTimers() })
    // syncInventory should NOT be called just because we loaded data
    expect(spy).not.toHaveBeenCalledWith('fh:terrain', expect.anything())
  })
})
