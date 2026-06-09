import { Pin, PinOff } from 'lucide-react';
import { getTerrainStatus, getMonsterStatus, combineStatus } from '../utils/status';
import { getScenarioMonsterCounts } from '../utils/monsterUtils';
import { PaintStatusDot } from './PaintStatusDot';
import type { TerrainCounts, ReadyStatus } from '../types';
import type { PaintStatus } from '../hooks/usePaintStatus';
import terrainData from '../data/terrain.json';

interface TerrainJson {
  maxNeeded: TerrainCounts;
  scenarios: Record<string, Partial<TerrainCounts>>;
}
const terrain = terrainData as TerrainJson;

const TERRAIN_TYPES: (keyof TerrainCounts)[] = ['lava', 'metal', 'rock', 'snow', 'stone', 'wood'];

const STATUS_COLORS: Record<ReadyStatus, string> = {
  ready: 'var(--ready)', partial: 'var(--partial)', missing: 'var(--missing)', 'no-data': 'var(--text-dim)',
};
const STATUS_LABELS: Record<ReadyStatus, string> = {
  ready: 'Ready', partial: 'Partial', missing: 'Missing', 'no-data': 'No Data',
};

function resolveScenarioId(raw: string): string[] {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed === '4') return ['4A', '4B'];
  if (trimmed === '4A') return ['4A'];
  if (trimmed === '4B') return ['4B'];
  return [raw.trim()];
}

function terrainIdForLookup(id: string): string {
  if (id === '4A' || id === '4B') return '4';
  return id;
}

interface Props {
  query: string;
  inventory: { terrain: TerrainCounts; monsters: Record<string, boolean> };
  paintStatus: Record<string, PaintStatus>;
  pinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
}

export function ScenarioLookupCard({ query, inventory, paintStatus, pinned, onPin, onUnpin }: Props) {
  if (!query.trim()) return null;

  const ids = resolveScenarioId(query);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
      {ids.map(id => {
        const terrainId = terrainIdForLookup(id);

        if (id === '102') {
          return (
            <div key={id} style={cardStyle}>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Scenario 102 does not exist in Frosthaven.</p>
            </div>
          );
        }

        const scenarioTerrain = terrain.scenarios[terrainId];
        if (!scenarioTerrain) {
          return (
            <div key={id} style={cardStyle}>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Scenario {id} not found.</p>
            </div>
          );
        }

        const nonZeroTerrain = TERRAIN_TYPES.filter(t => (scenarioTerrain[t] ?? 0) > 0);
        const tStatus = getTerrainStatus(scenarioTerrain, inventory.terrain);
        const monsterCounts = getScenarioMonsterCounts(id);
        const mStatus = getMonsterStatus(monsterCounts, inventory.monsters);
        const overallStatus = combineStatus(tStatus, mStatus);

        const monsterEntries = monsterCounts
          ? Object.entries(monsterCounts).sort((a, b) => a[0].localeCompare(b[0]))
          : null;

        return (
          <div key={id} style={cardStyle}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span className="font-fantasy" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Scenario {id}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: STATUS_COLORS[overallStatus] }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[overallStatus], display: 'inline-block' }} />
                  {STATUS_LABELS[overallStatus]}
                </span>
                <button
                  onClick={pinned ? onUnpin : onPin}
                  title={pinned ? 'Unpin scenario' : 'Pin scenario'}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: '1px solid var(--border)', borderRadius: '6px', background: pinned ? 'var(--accent-dim)' : 'none', cursor: 'pointer', color: pinned ? 'var(--accent)' : 'var(--text-dim)', transition: 'all 150ms' }}
                >
                  {pinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
              </div>
            </div>

            {/* Terrain */}
            <div style={{ marginBottom: '14px' }}>
              <p style={subheadStyle}>Terrain</p>
              {nonZeroTerrain.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>None required</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {nonZeroTerrain.map(t => {
                    const need = scenarioTerrain[t] ?? 0;
                    const have = inventory.terrain[t];
                    const diff = have - need;
                    const ok = diff >= 0;
                    const color = ok ? 'var(--ready)' : have > 0 ? 'var(--partial)' : 'var(--missing)';
                    return (
                      <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                        <span style={{ color, fontWeight: 600 }}>
                          {have} / {need}{' '}
                          <span style={{ fontSize: '11px', opacity: 0.8 }}>{ok ? `+${diff}` : diff}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Monsters */}
            <div style={{ marginBottom: '14px' }}>
              <p style={subheadStyle}>Monsters</p>
              {monsterCounts === undefined ? (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>Unknown</p>
              ) : monsterCounts === null || monsterEntries!.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>None</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {monsterEntries!.map(([name, standeeCount]) => {
                    const have = inventory.monsters[name] === true;
                    const ps: PaintStatus = paintStatus[name] ?? 'unpainted';
                    return (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)' }}>
                          {/* Inventory dot */}
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: have ? 'var(--ready)' : 'var(--missing)', flexShrink: 0 }} title={have ? 'Have full set' : 'Missing'} />
                          <PaintStatusDot status={ps} />
                          {name}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginLeft: '8px', flexShrink: 0 }}>
                          {standeeCount} standees
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Obstacles */}
            <div>
              <p style={subheadStyle}>Obstacles</p>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                Obstacle data not yet tracked per scenario
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '16px',
};

const subheadStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: 'var(--text-dim)',
  textTransform: 'uppercase',
  marginBottom: '6px',
};
