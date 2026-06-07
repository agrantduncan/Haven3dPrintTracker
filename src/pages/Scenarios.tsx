import { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import { getTerrainStatus } from '../utils/status';
import type { TerrainCounts, ReadyStatus } from '../types';
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

type FilterTab = 'all' | 'ready' | 'partial' | 'missing';

const STATUS_COLORS: Record<ReadyStatus, string> = {
  ready: 'var(--ready)',
  partial: 'var(--partial)',
  missing: 'var(--missing)',
  'no-data': 'var(--text-dim)',
};

const STATUS_LABELS: Record<ReadyStatus, string> = {
  ready: 'Ready',
  partial: 'Partial',
  missing: 'Missing',
  'no-data': 'No Data',
};

interface ScenarioEntry {
  id: string;
  displayId: string;
  terrainData: Partial<TerrainCounts> | undefined;
  monsterNames: string[] | null;
}

function buildScenarioList(): ScenarioEntry[] {
  const entries: ScenarioEntry[] = [];

  // Collect all scenario IDs from terrain (0–137 excluding 102)
  const terrainIds = Object.keys(terrain.scenarios)
    .filter(id => id !== '102')
    .map(Number)
    .sort((a, b) => a - b);

  for (const numId of terrainIds) {
    const id = String(numId);

    // Scenario 4 gets 4A and 4B sub-entries
    if (id === '4') {
      const has4A = monsters['4A'] !== undefined;
      const has4B = monsters['4B'] !== undefined;
      entries.push({
        id: '4A',
        displayId: '4A',
        terrainData: terrain.scenarios[id],
        monsterNames: has4A ? Object.keys(monsters['4A']!) : null,
      });
      entries.push({
        id: '4B',
        displayId: '4B',
        terrainData: terrain.scenarios[id],
        monsterNames: has4B ? Object.keys(monsters['4B']!) : null,
      });
      continue;
    }

    const monsterEntry = monsters[id];
    let monsterNames: string[] | null = null;

    if (id === '91') {
      monsterNames = []; // explicitly no monsters
    } else if (monsterEntry !== undefined) {
      monsterNames = Object.keys(monsterEntry);
    }
    // id === '93' → monsterNames stays null → "Unknown"

    entries.push({
      id,
      displayId: id,
      terrainData: terrain.scenarios[id],
      monsterNames,
    });
  }

  return entries;
}

const ALL_SCENARIOS = buildScenarioList();

export default function Scenarios() {
  const { inventory } = useInventory();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');

  const scenariosWithStatus = useMemo(() => {
    return ALL_SCENARIOS.map(s => {
      const status: ReadyStatus = s.terrainData
        ? getTerrainStatus(s.terrainData, inventory.terrain)
        : 'no-data';
      return { ...s, status };
    });
  }, [inventory.terrain]);

  const filtered = useMemo(() => {
    return scenariosWithStatus.filter(s => {
      const matchesSearch = search === '' || s.displayId.toLowerCase().includes(search.toLowerCase());
      const matchesTab =
        tab === 'all' ||
        (tab === 'ready' && s.status === 'ready') ||
        (tab === 'partial' && s.status === 'partial') ||
        (tab === 'missing' && (s.status === 'missing' || s.status === 'no-data'));
      return matchesSearch && matchesTab;
    });
  }, [scenariosWithStatus, search, tab]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'ready', label: 'Ready' },
    { key: 'partial', label: 'Partial' },
    { key: 'missing', label: 'Missing' },
  ];

  return (
    <div>
      <h2 className="font-fantasy" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px', color: 'var(--accent)' }}>
        Scenarios
      </h2>

      <input
        type="text"
        placeholder="Search scenario number..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          color: 'var(--text-primary)',
          fontSize: '14px',
          marginBottom: '12px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
      />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              border: '1px solid var(--accent)',
              background: tab === t.key ? 'var(--accent)' : 'var(--accent-dim)',
              color: tab === t.key ? 'var(--bg-base)' : 'var(--accent)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: tab === t.key ? 700 : 400,
              transition: 'all 150ms',
            }}
          >
            {t.label}
          </button>
        ))}
        <span style={{ fontSize: '13px', color: 'var(--text-dim)', alignSelf: 'center', marginLeft: '8px' }}>
          {filtered.length} scenario{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(s => {
          const nonZeroTerrain = s.terrainData
            ? TERRAIN_TYPES.filter(t => (s.terrainData![t] ?? 0) > 0)
            : [];

          const hasTerrain = nonZeroTerrain.length > 0;
          const monsterText = s.monsterNames === null
            ? 'Unknown'
            : s.monsterNames.length === 0
              ? 'None'
              : s.monsterNames.join(', ');

          return (
            <div
              key={s.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '10px 14px',
                transition: 'border-color 150ms, box-shadow 150ms',
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
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="font-fantasy" style={{ fontSize: '14px', fontWeight: 600 }}>
                  Scenario {s.displayId}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: STATUS_COLORS[s.status] }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s.status], display: 'inline-block' }} />
                  {STATUS_LABELS[s.status]}
                </span>
              </div>

              {/* Terrain chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginRight: '2px' }}>Terrain:</span>
                {!hasTerrain ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>None required</span>
                ) : (
                  nonZeroTerrain.map(t => {
                    const have = inventory.terrain[t];
                    const need = s.terrainData![t] ?? 0;
                    const chipStatus: ReadyStatus = have >= need ? 'ready' : have > 0 ? 'partial' : 'missing';
                    return (
                      <span
                        key={t}
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: 'var(--bg-surface-2)',
                          border: `1px solid ${STATUS_COLORS[chipStatus]}44`,
                          color: STATUS_COLORS[chipStatus],
                        }}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}: {need}
                      </span>
                    );
                  })
                )}
              </div>

              {/* Monster row */}
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span>Monsters: </span>
                <span style={{ color: s.monsterNames === null ? 'var(--text-dim)' : 'var(--text-primary)' }}
                  title={monsterText}>
                  {monsterText.length > 80 ? monsterText.slice(0, 77) + '...' : monsterText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
