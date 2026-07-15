import { useState, useCallback, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import { usePaintStatus } from '../hooks/usePaintStatus';
import { PaintStatusToggle } from '../components/PaintStatusToggle';
import type { TerrainCounts } from '../types';
import { MONSTER_NAMES_SORTED, getStandeeCount } from '../utils/monsterUtils';
import obstaclesData from '../data/obstacles.json';

type TerrainKey = keyof TerrainCounts;

const TERRAIN_TYPES: { key: TerrainKey; label: string }[] = [
  { key: 'lava', label: 'Lava' },
  { key: 'metal', label: 'Metal' },
  { key: 'rock', label: 'Rock' },
  { key: 'snow', label: 'Snow' },
  { key: 'stone', label: 'Stone' },
  { key: 'wood', label: 'Wood' },
];

interface ObstaclesJson { note: string; types: string[]; scenarios: Record<string, unknown>; }
const obstacles = obstaclesData as ObstaclesJson;
const ALL_OBSTACLE_TYPES: string[] = obstacles.types.slice().sort();

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [display, setDisplay] = useState<string>(String(value));
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) { setPrevValue(value); setDisplay(String(value)); }
  return (
    <input
      type="number"
      min={0}
      value={display}
      onChange={e => { setDisplay(e.target.value); const n = parseInt(e.target.value); onChange(isNaN(n) ? 0 : Math.max(0, n)); }}
      onFocus={e => { if (value === 0) setDisplay(''); e.target.style.borderColor = 'var(--accent)'; }}
      onBlur={e => { if (display === '' || isNaN(parseInt(display))) { setDisplay('0'); onChange(0); } e.target.style.borderColor = 'var(--border)'; }}
      style={{ width: '80px', minWidth: '72px', padding: '6px 8px', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '16px', outline: 'none', textAlign: 'left', colorScheme: 'dark' }}
    />
  );
}

export default function Inventory() {
  const { inventory, updateTerrain, updateMonster, updateObstacle } = useInventory();
  const { getStatus, cycleStatus } = usePaintStatus();
  const [monsterSearch, setMonsterSearch] = useState('');
  const [obstacleSearch, setObstacleSearch] = useState('');

  const filteredMonsters = useMemo(() =>
    MONSTER_NAMES_SORTED.filter(n => monsterSearch === '' || n.toLowerCase().includes(monsterSearch.toLowerCase())),
    [monsterSearch]
  );

  const filteredObstacles = useMemo(() =>
    ALL_OBSTACLE_TYPES.filter(n => obstacleSearch === '' || n.toLowerCase().includes(obstacleSearch.toLowerCase())),
    [obstacleSearch]
  );

  const sectionHeadingStyle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: 'var(--accent)', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border)', fontFamily: "'Cinzel', serif" };
  const searchInputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '16px', marginBottom: '8px', outline: 'none', boxSizing: 'border-box' };

  const handleObstacleChange = useCallback((name: string, v: number) => updateObstacle(name, v), [updateObstacle]);

  return (
    <div>
      <h2 className="font-fantasy" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: 'var(--accent)' }}>
        Inventory
      </h2>

      {/* Terrain */}
      <section style={{ marginBottom: '32px' }}>
        <h3 style={sectionHeadingStyle}>Terrain</h3>
        <div className="terrain-inv-grid">
          {TERRAIN_TYPES.map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '56px' }}>
              <label style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{label}</label>
              <NumberInput value={inventory.terrain[key]} onChange={v => updateTerrain(key, v)} />
            </div>
          ))}
        </div>
      </section>

      {/* Monsters */}
      <section style={{ marginBottom: '32px' }}>
        <h3 style={sectionHeadingStyle}>Monsters</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>
          Check each monster when you have the full standee set printed.
        </p>
        <input type="text" placeholder="Filter monsters…" value={monsterSearch} onChange={e => setMonsterSearch(e.target.value)} style={searchInputStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
        <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          {filteredMonsters.map((name, i) => {
            const checked = inventory.monsters[name] === true;
            const standees = getStandeeCount(name);
            return (
              <div
                key={name}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px',
                  background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                  borderBottom: i < filteredMonsters.length - 1 ? '1px solid var(--border)' : 'none',
                  minHeight: '52px',
                  cursor: 'pointer',
                  transition: 'background 100ms',
                }}
                onClick={() => updateMonster(name, !checked)}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, flexShrink: 0, borderRadius: '4px',
                  border: `2px solid ${checked ? 'var(--ready)' : 'var(--border)'}`,
                  background: checked ? 'var(--ready)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 150ms',
                }}>
                  {checked && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1.5" stroke="var(--bg-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Name */}
                <span style={{ fontSize: '14px', color: checked ? 'var(--text-primary)' : 'var(--text-dim)', flex: 1, minWidth: 0 }}>
                  {name}
                </span>

                {/* Standee count (muted, right) */}
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {standees} standees
                </span>

                {/* Paint status toggle — stop propagation so it doesn't toggle checkbox */}
                <div onClick={e => e.stopPropagation()}>
                  <PaintStatusToggle status={getStatus(name)} onCycle={() => cycleStatus(name)} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Obstacles */}
      <section style={{ marginBottom: '32px' }}>
        <h3 style={sectionHeadingStyle}>Obstacles</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '10px', fontStyle: 'italic' }}>
          Obstacle data is a placeholder — fill in manually as needed
        </p>
        <input type="text" placeholder="Filter obstacles…" value={obstacleSearch} onChange={e => setObstacleSearch(e.target.value)} style={searchInputStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '4px' }}>
          {filteredObstacles.map((name, i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 14px', background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-2)', borderBottom: i < filteredObstacles.length - 1 ? '1px solid var(--border)' : 'none', minHeight: '52px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>{name}</span>
              <NumberInput value={inventory.obstacles[name] ?? 0} onChange={v => handleObstacleChange(name, v)} />
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .terrain-inv-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (max-width: 767px) { .terrain-inv-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
