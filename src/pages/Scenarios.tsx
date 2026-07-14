import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useInventory } from '../hooks/useInventory';
import { usePaintStatus } from '../hooks/usePaintStatus';
import { getTerrainStatus, getMonsterStatus, combineStatus } from '../utils/status';
import { getScenarioMonsterCounts } from '../utils/monsterUtils';
import { PaintStatusDot } from '../components/PaintStatusDot';
import type { TerrainCounts, ReadyStatus } from '../types';
import terrainData from '../data/terrain.json';
import monstersData from '../data/monsters.json';
import scenarioPagesData from '../data/scenarioPages.json';

type TerrainKey = keyof TerrainCounts;
const TERRAIN_TYPES: TerrainKey[] = ['lava', 'metal', 'rock', 'snow', 'stone', 'wood'];

interface TerrainJson { maxNeeded: TerrainCounts; scenarios: Record<string, Partial<TerrainCounts>>; }
interface MonstersJson { [id: string]: Record<string, { normal: number[]; elite: number[] }>; }

const terrain = terrainData as TerrainJson;
const monsters = monstersData as MonstersJson;

interface ScenarioPagesJson { [id: string]: { title: string | null; grid: string | null; pages: string[] } }
const scenarioPages = scenarioPagesData as ScenarioPagesJson;

// 4A/4B share book scenario 4
const getBookPages = (id: string) => scenarioPages[id.replace(/[AB]$/, '')];

type FilterTab = 'all' | 'ready' | 'partial' | 'missing';

const STATUS_COLORS: Record<ReadyStatus, string> = {
  ready: 'var(--ready)', partial: 'var(--partial)', missing: 'var(--missing)', 'no-data': 'var(--text-dim)',
};
const STATUS_LABELS: Record<ReadyStatus, string> = {
  ready: 'Ready', partial: 'Partial', missing: 'Missing', 'no-data': 'No Data',
};

interface ScenarioEntry {
  id: string;
  displayId: string;
  terrainData: Partial<TerrainCounts> | undefined;
  monsterNames: string[] | null;
}

function buildScenarioList(): ScenarioEntry[] {
  const entries: ScenarioEntry[] = [];
  const terrainIds = Object.keys(terrain.scenarios).filter(id => id !== '102').map(Number).sort((a, b) => a - b);
  for (const numId of terrainIds) {
    const id = String(numId);
    if (id === '4') {
      entries.push({ id: '4A', displayId: '4A', terrainData: terrain.scenarios[id], monsterNames: monsters['4A'] ? Object.keys(monsters['4A']!) : null });
      entries.push({ id: '4B', displayId: '4B', terrainData: terrain.scenarios[id], monsterNames: monsters['4B'] ? Object.keys(monsters['4B']!) : null });
      continue;
    }
    const monsterEntry = monsters[id];
    let monsterNames: string[] | null = null;
    if (id === '91') monsterNames = [];
    else if (monsterEntry !== undefined) monsterNames = Object.keys(monsterEntry);
    entries.push({ id, displayId: id, terrainData: terrain.scenarios[id], monsterNames });
  }
  return entries;
}

const ALL_SCENARIOS = buildScenarioList();

export default function Scenarios() {
  const { inventory } = useInventory();
  const { getStatus } = usePaintStatus();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [openPages, setOpenPages] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { search?: string } | null;
    if (state?.search) setSearch(state.search);
  }, [location.state]);

  const scenariosWithStatus = useMemo(() => {
    return ALL_SCENARIOS.map(s => {
      const tStatus: ReadyStatus = s.terrainData
        ? getTerrainStatus(s.terrainData, inventory.terrain)
        : 'no-data';
      const monsterCounts = getScenarioMonsterCounts(s.id);
      const mStatus = getMonsterStatus(monsterCounts, inventory.monsters);
      const status = combineStatus(tStatus, mStatus);
      return { ...s, status, tStatus, mStatus, monsterCounts };
    });
  }, [inventory.terrain, inventory.monsters]);

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
        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '16px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
      />

      <div className="filter-tabs" style={{ marginBottom: '16px' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--accent)', background: tab === t.key ? 'var(--accent)' : 'var(--accent-dim)', color: tab === t.key ? 'var(--bg-base)' : 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t.key ? 700 : 400, transition: 'all 150ms', whiteSpace: 'nowrap', flexShrink: 0, minHeight: '44px' }}>
            {t.label}
          </button>
        ))}
        <span style={{ fontSize: '13px', color: 'var(--text-dim)', alignSelf: 'center', marginLeft: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {filtered.length} scenario{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(s => {
          const nonZeroTerrain = s.terrainData ? TERRAIN_TYPES.filter(t => (s.terrainData![t] ?? 0) > 0) : [];
          const hasTerrain = nonZeroTerrain.length > 0;
          const monsterNames = s.monsterNames ?? [];
          const monsterText = s.monsterNames === null ? 'Unknown' : monsterNames.length === 0 ? 'None' : '';

          return (
            <div key={s.id}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '12px 14px', transition: 'border-color 150ms, box-shadow 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 8px var(--accent-dim)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="font-fantasy" style={{ fontSize: '14px', fontWeight: 600 }}>
                  Scenario {s.displayId}
                  {getBookPages(s.id)?.title && (
                    <span style={{ fontWeight: 400, color: 'var(--text-dim)' }}> — {getBookPages(s.id)!.title}</span>
                  )}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: STATUS_COLORS[s.status] }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s.status], display: 'inline-block' }} />
                  {STATUS_LABELS[s.status]}
                </span>
              </div>

              {/* Terrain chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginRight: '2px' }}>Terrain:</span>
                {!hasTerrain ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>None required</span>
                ) : (
                  nonZeroTerrain.map(t => {
                    const have = inventory.terrain[t];
                    const need = s.terrainData![t] ?? 0;
                    const chipStatus: ReadyStatus = have >= need ? 'ready' : have > 0 ? 'partial' : 'missing';
                    return (
                      <span key={t} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '3px', background: 'var(--bg-surface-2)', border: `1px solid ${STATUS_COLORS[chipStatus]}44`, color: STATUS_COLORS[chipStatus] }}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}: {need}
                      </span>
                    );
                  })
                )}
              </div>

              {/* Monsters with inventory + paint status dots */}
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                <span>Monsters: </span>
                {monsterText ? (
                  <span style={{ color: 'var(--text-dim)', fontStyle: s.monsterNames === null ? 'italic' : 'normal' }}>{monsterText}</span>
                ) : (
                  <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', verticalAlign: 'middle' }}>
                    {monsterNames.slice(0, 6).map(name => {
                      const have = inventory.monsters[name] === true;
                      return (
                        <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text-primary)' }}>
                          {/* Inventory dot: green = have, red = missing */}
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: have ? 'var(--ready)' : 'var(--missing)', flexShrink: 0, display: 'inline-block' }} title={have ? 'Have set' : 'Missing'} />
                          <PaintStatusDot status={getStatus(name)} />
                          {name}
                          {monsterNames.indexOf(name) < monsterNames.length - 1 && monsterNames.length <= 6 ? ',' : ''}
                        </span>
                      );
                    })}
                    {monsterNames.length > 6 && (
                      <span style={{ color: 'var(--text-dim)' }}>+{monsterNames.length - 6} more</span>
                    )}
                  </span>
                )}
              </div>

              {/* Scenario book pages (map layout + full scenario) */}
              {(() => {
                const book = getBookPages(s.id);
                if (!book || book.pages.length === 0) return null;
                const isOpen = openPages === s.id;
                return (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={() => setOpenPages(isOpen ? null : s.id)}
                      style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', minHeight: '32px' }}
                    >
                      {isOpen ? '▾ Hide' : '▸ Map & Pages'} ({book.pages.length} page{book.pages.length !== 1 ? 's' : ''}{book.grid ? `, hex ${book.grid}` : ''})
                    </button>
                    {isOpen && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {book.pages.map(img => (
                          <img
                            key={img}
                            src={`/images/scenarios/${img}`}
                            alt={`Scenario ${s.displayId} — ${book.title ?? 'book page'}`}
                            loading="lazy"
                            style={{ width: '100%', maxWidth: '820px', borderRadius: '4px', border: '1px solid var(--border)' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
