import { useState, useCallback, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import type { TerrainCounts } from '../types';
import monstersData from '../data/monsters.json';
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

interface MonstersJson {
  [scenarioId: string]: Record<string, { normal: number[]; elite: number[] }>;
}
interface ObstaclesJson {
  note: string;
  types: string[];
  scenarios: Record<string, unknown>;
}

const monsters = monstersData as MonstersJson;
const obstacles = obstaclesData as ObstaclesJson;

const ALL_MONSTER_NAMES: string[] = Array.from(
  new Set(
    Object.values(monsters).flatMap(scenario => Object.keys(scenario))
  )
).sort();

const ALL_OBSTACLE_TYPES: string[] = obstacles.types.slice().sort();

function SavedIndicator({ show }: { show: boolean }) {
  return (
    <span
      style={{
        fontSize: '12px',
        color: 'var(--ready)',
        opacity: show ? 1 : 0,
        transition: 'opacity 500ms',
        marginLeft: '8px',
      }}
    >
      Saved ✓
    </span>
  );
}

function NumberInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [display, setDisplay] = useState<string>(String(value));

  // Keep display in sync when value changes externally
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDisplay(String(value));
  }

  return (
    <input
      type="number"
      min={0}
      value={display}
      onChange={e => {
        setDisplay(e.target.value);
        const n = parseInt(e.target.value);
        onChange(isNaN(n) ? 0 : Math.max(0, n));
      }}
      onFocus={e => {
        if (value === 0) setDisplay('');
        e.target.style.borderColor = 'var(--accent)';
      }}
      onBlur={e => {
        if (display === '' || isNaN(parseInt(display))) {
          setDisplay('0');
          onChange(0);
        }
        e.target.style.borderColor = 'var(--border)';
      }}
      style={{
        width: '80px',
        padding: '6px 8px',
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        textAlign: 'left',
        colorScheme: 'dark',
      }}
    />
  );
}

export default function Inventory() {
  const { inventory, updateTerrain, updateMonster, updateObstacle } = useInventory();
  const [showSaved, setShowSaved] = useState(false);
  const [monsterSearch, setMonsterSearch] = useState('');
  const [obstacleSearch, setObstacleSearch] = useState('');

  const triggerSaved = useCallback(() => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, []);

  const handleTerrainChange = useCallback((key: TerrainKey, value: number) => {
    updateTerrain(key, value);
    triggerSaved();
  }, [updateTerrain, triggerSaved]);

  const handleMonsterChange = useCallback((name: string, value: number) => {
    updateMonster(name, value);
    triggerSaved();
  }, [updateMonster, triggerSaved]);

  const handleObstacleChange = useCallback((name: string, value: number) => {
    updateObstacle(name, value);
    triggerSaved();
  }, [updateObstacle, triggerSaved]);

  const filteredMonsters = useMemo(() =>
    ALL_MONSTER_NAMES.filter(n =>
      monsterSearch === '' || n.toLowerCase().includes(monsterSearch.toLowerCase())
    ),
    [monsterSearch]
  );

  const filteredObstacles = useMemo(() =>
    ALL_OBSTACLE_TYPES.filter(n =>
      obstacleSearch === '' || n.toLowerCase().includes(obstacleSearch.toLowerCase())
    ),
    [obstacleSearch]
  );

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--accent)',
    marginBottom: '12px',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--border)',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    marginBottom: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="font-fantasy" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>
          Inventory
        </h2>
        <SavedIndicator show={showSaved} />
      </div>

      {/* Terrain Section */}
      <section style={{ marginBottom: '32px' }}>
        <h3 className="font-fantasy" style={sectionHeadingStyle}>Terrain</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}>
          {TERRAIN_TYPES.map(({ key, label }) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            >
              <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{label}</label>
              <NumberInput
                value={inventory.terrain[key]}
                onChange={v => handleTerrainChange(key, v)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Monsters Section */}
      <section style={{ marginBottom: '32px' }}>
        <h3 className="font-fantasy" style={sectionHeadingStyle}>Monsters</h3>
        <input
          type="text"
          placeholder="Filter monsters..."
          value={monsterSearch}
          onChange={e => setMonsterSearch(e.target.value)}
          style={searchInputStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
        />
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}>
          {filteredMonsters.map((name, i) => (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                borderBottom: i < filteredMonsters.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{name}</span>
              <NumberInput
                value={inventory.monsters[name] ?? 0}
                onChange={v => handleMonsterChange(name, v)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Obstacles Section */}
      <section style={{ marginBottom: '32px' }}>
        <h3 className="font-fantasy" style={sectionHeadingStyle}>Obstacles</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px', fontStyle: 'italic' }}>
          Obstacle data is a placeholder — fill in manually as needed
        </p>
        <input
          type="text"
          placeholder="Filter obstacles..."
          value={obstacleSearch}
          onChange={e => setObstacleSearch(e.target.value)}
          style={searchInputStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
        />
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}>
          {filteredObstacles.map((name, i) => (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                borderBottom: i < filteredObstacles.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{name}</span>
              <NumberInput
                value={inventory.obstacles[name] ?? 0}
                onChange={v => handleObstacleChange(name, v)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
