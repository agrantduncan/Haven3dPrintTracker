import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../hooks/useInventory';
import { usePinned } from '../hooks/usePinned';
import { usePaintStatus } from '../hooks/usePaintStatus';
import { getScenarioStatus, getTerrainStatus } from '../utils/status';
import { MONSTER_MAX_NEEDED, MONSTER_NAMES_SORTED } from '../utils/monsterUtils';
import { ScenarioLookupCard } from '../components/ScenarioLookupCard';
import { PaintStatusDot } from '../components/PaintStatusDot';
import type { TerrainCounts, ReadyStatus } from '../types';
import terrainData from '../data/terrain.json';

type TerrainKey = keyof TerrainCounts;

const TERRAIN_TYPES: { key: TerrainKey; label: string; color: string }[] = [
  { key: 'lava',  label: 'Lava',  color: '#ff6b35' },
  { key: 'metal', label: 'Metal', color: '#9bb7d4' },
  { key: 'rock',  label: 'Rock',  color: '#8b7355' },
  { key: 'snow',  label: 'Snow',  color: '#e8f4fd' },
  { key: 'stone', label: 'Stone', color: '#7a8a9a' },
  { key: 'wood',  label: 'Wood',  color: '#8b6914' },
];

const TERRAIN_TYPES_ARR: TerrainKey[] = ['lava', 'metal', 'rock', 'snow', 'stone', 'wood'];

interface TerrainData {
  maxNeeded: TerrainCounts;
  scenarios: Record<string, Partial<TerrainCounts>>;
}

const terrain = terrainData as TerrainData;

const STATUS_COLORS: Record<ReadyStatus, string> = {
  ready: 'var(--ready)', partial: 'var(--partial)', missing: 'var(--missing)', 'no-data': 'var(--text-dim)',
};
const STATUS_LABELS: Record<ReadyStatus, string> = {
  ready: 'Ready', partial: 'Partial', missing: 'Missing', 'no-data': 'No Data',
};

export default function Dashboard() {
  const { inventory } = useInventory();
  const { pinned, pin, unpin, isPinned } = usePinned();
  const { paintStatus, getStatus } = usePaintStatus();
  const [monstersOpen, setMonstersOpen] = useState(false);
  const [lookup, setLookup] = useState('');
  const navigate = useNavigate();

  const readyCount = useMemo(() => {
    return Object.entries(terrain.scenarios)
      .filter(([id]) => id !== '102')
      .filter(([, t]) => getScenarioStatus(t, inventory.terrain) === 'ready')
      .length;
  }, [inventory.terrain]);

  const totalScenarios = Object.keys(terrain.scenarios).filter(id => id !== '102').length;

  // Resolve terrain id for a pinned scenario display id (4A/4B → 4)
  function terrainIdFor(id: string) {
    if (id === '4A' || id === '4B') return '4';
    return id;
  }

  function pinnedStatus(id: string): ReadyStatus {
    const t = terrain.scenarios[terrainIdFor(id)];
    if (!t) return 'no-data';
    return getTerrainStatus(t, inventory.terrain);
  }

  function pinnedTerrainSummary(id: string): string {
    const t = terrain.scenarios[terrainIdFor(id)];
    if (!t) return '';
    return TERRAIN_TYPES_ARR
      .filter(k => (t[k] ?? 0) > 0)
      .map(k => {
        const ok = inventory.terrain[k] >= (t[k] ?? 0);
        return `${k.charAt(0).toUpperCase() + k.slice(1)}: ${t[k]} ${ok ? '✓' : '✗'}`;
      })
      .join('  ') || 'None required';
  }

  return (
    <div>
      <h2 className="font-fantasy" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px', color: 'var(--accent)' }}>
        Command Post
      </h2>

      {/* Scenario Lookup */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter scenario number..."
          value={lookup}
          onChange={e => setLookup(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '16px',
            outline: 'none',
            marginBottom: lookup.trim() ? '12px' : 0,
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
        />
        {lookup.trim() && (
          <ScenarioLookupCard
            query={lookup}
            inventory={inventory}
            paintStatus={paintStatus}
            pinned={isPinned(lookup.trim().toUpperCase() === '4' ? '4A' : lookup.trim().toUpperCase())}
            onPin={() => {
              const id = lookup.trim().toUpperCase();
              if (id === '4') { pin('4A'); pin('4B'); }
              else pin(id);
            }}
            onUnpin={() => {
              const id = lookup.trim().toUpperCase();
              if (id === '4') { unpin('4A'); unpin('4B'); }
              else unpin(id);
            }}
          />
        )}
      </div>

      {/* Terrain cards */}
      <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }} className="terrain-grid">
        {TERRAIN_TYPES.map(({ key, label, color }) => {
          const have = inventory.terrain[key];
          const need = terrain.maxNeeded[key];
          const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 100;
          const barColor = have >= need ? 'var(--ready)' : have > 0 ? 'var(--partial)' : 'var(--missing)';

          return (
            <div
              key={key}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '16px', transition: 'border-color 150ms, box-shadow 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 8px var(--accent-dim)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span className="font-fantasy" style={{ fontSize: '13px', fontWeight: 600 }}>{label}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ height: '6px', background: 'var(--bg-surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '3px', transition: 'width 300ms' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Have: <strong style={{ color: 'var(--text-primary)' }}>{have}</strong></span>
                <span style={{ color: 'var(--text-dim)' }}>Need: <strong style={{ color: 'var(--text-primary)' }}>{need}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ready summary */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '14px 16px', fontSize: '14px', color: 'var(--text-dim)', marginBottom: '16px' }}>
        Ready for{' '}
        <span style={{ color: 'var(--ready)', fontWeight: 700, fontSize: '16px' }}>{readyCount}</span>
        {' '}of{' '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalScenarios}</span>
        {' '}scenarios
      </div>

      {/* Collapsible Monsters */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
        <button
          onClick={() => setMonstersOpen(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 150ms', minHeight: '44px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
        >
          <span className="font-fantasy" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)' }}>Monsters</span>
          {monstersOpen ? <ChevronUp size={18} color="var(--accent)" /> : <ChevronDown size={18} color="var(--accent)" />}
        </button>
        <div style={{ maxHeight: monstersOpen ? '400px' : '0', overflow: 'hidden', transition: 'max-height 200ms ease-in-out' }}>
          <div style={{ maxHeight: '400px', overflowY: 'auto', borderTop: '1px solid var(--border)' }}>
            {MONSTER_NAMES_SORTED.map((name, i) => {
              const need = MONSTER_MAX_NEEDED[name] ?? 0;
              const have = inventory.monsters[name] ?? 0;
              const color = have >= need ? 'var(--ready)' : have > 0 ? 'var(--partial)' : 'var(--missing)';
              const ps = getStatus(name);
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-2)', borderBottom: i < MONSTER_NAMES_SORTED.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <PaintStatusDot status={ps} />
                    {name}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>{have} / {need}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pinned Scenarios */}
      <div>
        <h3 className="font-fantasy" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
          Pinned Scenarios
        </h3>
        {pinned.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No pinned scenarios — search above and pin for quick access
          </p>
        ) : (
          <div className="pinned-grid">
            {pinned.map(id => {
              const status = pinnedStatus(id);
              const terrainSummary = pinnedTerrainSummary(id);
              return (
                <div
                  key={id}
                  style={{ position: 'relative', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '12px 40px 12px 14px', cursor: 'pointer', transition: 'border-color 150ms, box-shadow 150ms' }}
                  onClick={() => navigate('/scenarios', { state: { search: id } })}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 8px var(--accent-dim)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <button
                    onClick={e => { e.stopPropagation(); unpin(id); }}
                    title="Unpin"
                    style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, minWidth: 28, minHeight: 28, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-dim)', borderRadius: '4px' }}
                  >
                    <X size={14} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="font-fantasy" style={{ fontSize: '13px', fontWeight: 600 }}>Scenario {id}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: STATUS_COLORS[status] }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[status], display: 'inline-block' }} />
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>{terrainSummary}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .terrain-grid { grid-template-columns: repeat(3, 1fr); }
        .pinned-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        @media (max-width: 767px) {
          .terrain-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pinned-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
