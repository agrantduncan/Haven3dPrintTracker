import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { usePaintStatus } from '../hooks/usePaintStatus';
import { PaintStatusDot } from '../components/PaintStatusDot';
import type { PaintStatus } from '../hooks/usePaintStatus';
import type { TerrainCounts } from '../types';
import terrainData from '../data/terrain.json';
import { MONSTER_NAMES_SORTED, getStandeeCount } from '../utils/monsterUtils';

type TerrainKey = keyof TerrainCounts;
const TERRAIN_TYPES: TerrainKey[] = ['lava', 'metal', 'rock', 'snow', 'stone', 'wood'];
const TERRAIN_LABELS: Record<TerrainKey, string> = { lava: 'Lava', metal: 'Metal', rock: 'Rock', snow: 'Snow', stone: 'Stone', wood: 'Wood' };

interface TerrainJson { maxNeeded: TerrainCounts; scenarios: Record<string, Partial<TerrainCounts>>; }
const terrain = terrainData as TerrainJson;

interface TerrainGap { key: TerrainKey; label: string; have: number; need: number; deficit: number; }
interface MonsterGap { name: string; standees: number; }

type PaintFilter = 'all' | PaintStatus;

export default function PrintQueue() {
  const { inventory, togglePrinting } = useInventory();
  const { getStatus } = usePaintStatus();
  const [paintFilter, setPaintFilter] = useState<PaintFilter>('all');

  const terrainGaps = useMemo((): TerrainGap[] => {
    return TERRAIN_TYPES
      .map(key => ({ key, label: TERRAIN_LABELS[key], have: inventory.terrain[key], need: terrain.maxNeeded[key], deficit: Math.max(0, terrain.maxNeeded[key] - inventory.terrain[key]) }))
      .filter(g => g.deficit > 0)
      .sort((a, b) => b.deficit - a.deficit);
  }, [inventory.terrain]);

  // Monsters where the full set is NOT yet checked off
  const allMonsterGaps = useMemo((): MonsterGap[] => {
    return MONSTER_NAMES_SORTED
      .filter(name => inventory.monsters[name] !== true)
      .map(name => ({ name, standees: getStandeeCount(name) }));
  }, [inventory.monsters]);

  const monsterGaps = useMemo(() => {
    return allMonsterGaps
      .filter(g => paintFilter === 'all' || getStatus(g.name) === paintFilter)
      .sort((a, b) => {
        const aPrinting = inventory.printing.includes(a.name);
        const bPrinting = inventory.printing.includes(b.name);
        if (aPrinting !== bPrinting) return aPrinting ? 1 : -1;
        return b.standees - a.standees;
      });
  }, [allMonsterGaps, paintFilter, inventory.printing, getStatus]);

  const allTerrainCovered = terrainGaps.length === 0;
  const allMonstersCovered = allMonsterGaps.length === 0;

  const sectionHeadingStyle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: 'var(--accent)', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border)', fontFamily: "'Cinzel', serif" };
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', marginBottom: '6px', minHeight: '52px' };

  const paintFilters: { key: PaintFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unpainted', label: 'Unpainted' },
    { key: 'painted', label: 'Painted' },
    { key: 'color-printed', label: 'Color Printed' },
  ];

  return (
    <div>
      <h2 className="font-fantasy" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: 'var(--accent)' }}>
        Print Queue
      </h2>

      {/* Terrain Gaps */}
      <section style={{ marginBottom: '32px' }}>
        <h3 style={sectionHeadingStyle}>Terrain Gaps</h3>
        {allTerrainCovered ? (
          <div style={{ color: 'var(--ready)', fontSize: '14px', fontWeight: 600 }}>✓ All terrain accounted for</div>
        ) : (
          terrainGaps.map(g => (
            <div key={g.key} style={rowStyle}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{g.label}</span>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-dim)', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
        <h3 style={sectionHeadingStyle}>Monster Gaps</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px' }}>
          Monsters not yet checked off in Inventory. Mark printing to track in-progress prints.
        </p>

        {!allMonstersCovered && (
          <div className="filter-tabs" style={{ marginBottom: '12px' }}>
            {paintFilters.map(f => (
              <button key={f.key} onClick={() => setPaintFilter(f.key)}
                style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--accent)', background: paintFilter === f.key ? 'var(--accent)' : 'var(--accent-dim)', color: paintFilter === f.key ? 'var(--bg-base)' : 'var(--accent)', cursor: 'pointer', fontSize: '12px', fontWeight: paintFilter === f.key ? 700 : 400, transition: 'all 150ms', whiteSpace: 'nowrap', flexShrink: 0, minHeight: '44px' }}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {allMonstersCovered ? (
          <div style={{ color: 'var(--ready)', fontSize: '14px', fontWeight: 600 }}>✓ All monsters checked off</div>
        ) : monsterGaps.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '13px', fontStyle: 'italic' }}>No monsters match this filter</div>
        ) : (
          monsterGaps.map(g => {
            const isPrinting = inventory.printing.includes(g.name);
            const ps = getStatus(g.name);
            return (
              <div key={g.name} style={{ ...rowStyle, borderColor: isPrinting ? 'var(--partial)' : 'var(--border)', background: isPrinting ? 'rgba(255,170,0,0.07)' : 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <PaintStatusDot status={ps} />
                  <span style={{ fontSize: '13px', color: isPrinting ? 'var(--partial)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={g.name}>
                    {g.name}
                  </span>
                  {isPrinting && <span style={{ fontSize: '11px', color: 'var(--partial)', whiteSpace: 'nowrap', flexShrink: 0 }}>🖨 Printing</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{g.standees} standees</span>
                  <button
                    onClick={() => togglePrinting(g.name)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--accent)', background: isPrinting ? 'var(--accent)' : 'var(--accent-dim)', color: isPrinting ? 'var(--bg-base)' : 'var(--accent)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 150ms', whiteSpace: 'nowrap', minHeight: '44px' }}>
                    <Printer size={12} />
                    {isPrinting ? 'Unmark' : 'Mark'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Obstacle Gaps */}
      <section>
        <h3 style={sectionHeadingStyle}>Obstacle Gaps</h3>
        <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
          Add obstacle counts to obstacles.json to track gaps here
        </div>
      </section>
    </div>
  );
}
