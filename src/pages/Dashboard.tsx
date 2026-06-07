import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { getScenarioStatus } from '../utils/status';
import type { TerrainCounts } from '../types';
import terrainData from '../data/terrain.json';
import monstersData from '../data/monsters.json';

type TerrainKey = keyof TerrainCounts;

const TERRAIN_TYPES: { key: TerrainKey; label: string; color: string }[] = [
  { key: 'lava', label: 'Lava', color: '#ff6b35' },
  { key: 'metal', label: 'Metal', color: '#9bb7d4' },
  { key: 'rock', label: 'Rock', color: '#8b7355' },
  { key: 'snow', label: 'Snow', color: '#e8f4fd' },
  { key: 'stone', label: 'Stone', color: '#7a8a9a' },
  { key: 'wood', label: 'Wood', color: '#8b6914' },
];

interface TerrainData {
  maxNeeded: TerrainCounts;
  scenarios: Record<string, Partial<TerrainCounts>>;
}
interface MonstersJson {
  [scenarioId: string]: Record<string, { normal: number[]; elite: number[] }>;
}

const terrain = terrainData as TerrainData;
const monsters = monstersData as MonstersJson;

// Max standees needed per monster type across all scenarios at 2 players (index 1)
const MONSTER_MAX_NEEDED: { name: string; need: number }[] = (() => {
  const map: Record<string, number> = {};
  for (const scenario of Object.values(monsters)) {
    for (const [name, entry] of Object.entries(scenario)) {
      const count = (entry.normal[1] ?? 0) + (entry.elite[1] ?? 0);
      if (!map[name] || count > map[name]) map[name] = count;
    }
  }
  return Object.entries(map)
    .map(([name, need]) => ({ name, need }))
    .sort((a, b) => a.name.localeCompare(b.name));
})();

export default function Dashboard() {
  const { inventory } = useInventory();
  const [monstersOpen, setMonstersOpen] = useState(false);

  const readyCount = useMemo(() => {
    return Object.entries(terrain.scenarios)
      .filter(([id]) => id !== '102')
      .filter(([, scenarioTerrain]) => getScenarioStatus(scenarioTerrain, inventory.terrain) === 'ready')
      .length;
  }, [inventory.terrain]);

  const totalScenarios = Object.keys(terrain.scenarios).filter(id => id !== '102').length;

  return (
    <div>
      <h2 className="font-fantasy" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: 'var(--accent)' }}>
        Command Post
      </h2>

      {/* Terrain cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {TERRAIN_TYPES.map(({ key, label, color }) => {
          const have = inventory.terrain[key];
          const need = terrain.maxNeeded[key];
          const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 100;
          const barColor = have >= need ? 'var(--ready)' : have > 0 ? 'var(--partial)' : 'var(--missing)';

          return (
            <div
              key={key}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '16px',
                transition: 'border-color 150ms, box-shadow 150ms',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 8px var(--accent-dim)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span className="font-fantasy" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {label}
                </span>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <div style={{ height: '6px', background: 'var(--bg-surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: barColor,
                    borderRadius: '3px',
                    transition: 'width 300ms',
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Have: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{have}</span></span>
                <span style={{ color: 'var(--text-dim)' }}>Need: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{need}</span></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scenario ready summary */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '14px 16px',
        fontSize: '14px',
        color: 'var(--text-dim)',
        marginBottom: '16px',
      }}>
        Ready for{' '}
        <span style={{ color: 'var(--ready)', fontWeight: 700, fontSize: '16px' }}>{readyCount}</span>
        {' '}of{' '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalScenarios}</span>
        {' '}scenarios
      </div>

      {/* Collapsible Monsters section */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        {/* Header toggle */}
        <button
          onClick={() => setMonstersOpen(o => !o)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            transition: 'background 150ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
        >
          <span className="font-fantasy" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)' }}>
            Monsters
          </span>
          {monstersOpen
            ? <ChevronUp size={18} color="var(--accent)" />
            : <ChevronDown size={18} color="var(--accent)" />
          }
        </button>

        {/* Expandable list */}
        <div style={{
          maxHeight: monstersOpen ? '400px' : '0',
          overflow: 'hidden',
          transition: 'max-height 200ms ease-in-out',
        }}>
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            borderTop: '1px solid var(--border)',
          }}>
            {MONSTER_MAX_NEEDED.map(({ name, need }, i) => {
              const have = inventory.monsters[name] ?? 0;
              const color = have >= need ? 'var(--ready)' : have > 0 ? 'var(--partial)' : 'var(--missing)';
              return (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                    borderBottom: i < MONSTER_MAX_NEEDED.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{name}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
                    {have} / {need}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .terrain-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
