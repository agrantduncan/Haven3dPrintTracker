import { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import type { TerrainCounts } from '../types';
import terrainData from '../data/terrain.json';
import monstersData from '../data/monsters.json';

type TerrainKey = keyof TerrainCounts;
const TERRAIN_TYPES: TerrainKey[] = ['lava', 'metal', 'rock', 'snow', 'stone', 'wood'];

interface TerrainJson {
  maxNeeded: TerrainCounts;
  scenarios: Record<string, Partial<TerrainCounts>>;
}
interface MonstersJson {
  [scenarioId: string]: Record<string, { normal: number[]; elite: number[] }>;
}

const terrain = terrainData as TerrainJson;
const monsters = monstersData as MonstersJson;

function computeMonsterMaxNeeded(): Record<string, number> {
  const maxMap: Record<string, number> = {};
  for (const scenario of Object.values(monsters)) {
    for (const [name, entry] of Object.entries(scenario)) {
      const count = (entry.normal[1] ?? 0) + (entry.elite[1] ?? 0);
      if (!maxMap[name] || count > maxMap[name]) {
        maxMap[name] = count;
      }
    }
  }
  return maxMap;
}

const MONSTER_MAX_NEEDED = computeMonsterMaxNeeded();

interface TerrainGap {
  key: TerrainKey;
  label: string;
  have: number;
  need: number;
  deficit: number;
}

interface MonsterGap {
  name: string;
  have: number;
  need: number;
}

const TERRAIN_LABELS: Record<TerrainKey, string> = {
  lava: 'Lava', metal: 'Metal', rock: 'Rock', snow: 'Snow', stone: 'Stone', wood: 'Wood',
};

export default function PrintQueue() {
  const { inventory, togglePrinting } = useInventory();

  const terrainGaps = useMemo((): TerrainGap[] => {
    return TERRAIN_TYPES
      .map(key => ({
        key,
        label: TERRAIN_LABELS[key],
        have: inventory.terrain[key],
        need: terrain.maxNeeded[key],
        deficit: Math.max(0, terrain.maxNeeded[key] - inventory.terrain[key]),
      }))
      .filter(g => g.deficit > 0)
      .sort((a, b) => b.deficit - a.deficit);
  }, [inventory.terrain]);

  const monsterGaps = useMemo((): MonsterGap[] => {
    return Object.entries(MONSTER_MAX_NEEDED)
      .map(([name, need]) => ({
        name,
        have: inventory.monsters[name] ?? 0,
        need,
      }))
      .filter(g => g.have < g.need)
      .sort((a, b) => {
        const aPrinting = inventory.printing.includes(a.name);
        const bPrinting = inventory.printing.includes(b.name);
        if (aPrinting !== bPrinting) return aPrinting ? 1 : -1;
        return (b.need - b.have) - (a.need - a.have);
      });
  }, [inventory.monsters, inventory.printing]);

  const allTerrainCovered = terrainGaps.length === 0;
  const allMonstersCovered = monsterGaps.length === 0;

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--accent)',
    marginBottom: '12px',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--border)',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    marginBottom: '6px',
  };

  return (
    <div>
      <h2 className="font-fantasy" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: 'var(--accent)' }}>
        Print Queue
      </h2>

      {/* Terrain Gaps */}
      <section style={{ marginBottom: '32px' }}>
        <h3 className="font-fantasy" style={sectionHeadingStyle}>Terrain Gaps</h3>
        {allTerrainCovered ? (
          <div style={{ color: 'var(--ready)', fontSize: '14px', fontWeight: 600 }}>✓ All terrain accounted for</div>
        ) : (
          terrainGaps.map(g => (
            <div key={g.key} style={rowStyle}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{g.label}</span>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-dim)', alignItems: 'center' }}>
                <span>Have: <strong style={{ color: 'var(--text-primary)' }}>{g.have}</strong></span>
                <span>Need: <strong style={{ color: 'var(--text-primary)' }}>{g.need}</strong></span>
                <span style={{ color: 'var(--missing)', fontWeight: 700 }}>−{g.deficit}</span>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Monster Gaps */}
      <section style={{ marginBottom: '32px' }}>
        <h3 className="font-fantasy" style={sectionHeadingStyle}>Monster Gaps</h3>
        {allMonstersCovered ? (
          <div style={{ color: 'var(--ready)', fontSize: '14px', fontWeight: 600 }}>✓ All monsters accounted for</div>
        ) : (
          monsterGaps.map(g => {
            const isPrinting = inventory.printing.includes(g.name);
            return (
              <div
                key={g.name}
                style={{
                  ...rowStyle,
                  borderColor: isPrinting ? 'var(--partial)' : 'var(--border)',
                  background: isPrinting ? 'rgba(255,170,0,0.07)' : 'var(--bg-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '13px',
                      color: isPrinting ? 'var(--partial)' : 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '200px',
                    }}
                    title={g.name}
                  >
                    {g.name}
                  </span>
                  {isPrinting && (
                    <span style={{ fontSize: '11px', color: 'var(--partial)', whiteSpace: 'nowrap' }}>
                      🖨 Printing
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    {g.have}/{g.need}
                  </span>
                  <button
                    onClick={() => togglePrinting(g.name)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid var(--accent)',
                      background: isPrinting ? 'var(--accent)' : 'var(--accent-dim)',
                      color: isPrinting ? 'var(--bg-base)' : 'var(--accent)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 150ms',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Printer size={12} />
                    {isPrinting ? 'Unmark' : 'Mark as Printing'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Obstacle Gaps */}
      <section>
        <h3 className="font-fantasy" style={sectionHeadingStyle}>Obstacle Gaps</h3>
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          fontSize: '13px',
          color: 'var(--text-dim)',
          fontStyle: 'italic',
        }}>
          Add obstacle counts to obstacles.json to track gaps here
        </div>
      </section>
    </div>
  );
}
