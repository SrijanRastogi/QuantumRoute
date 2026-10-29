import React from 'react';
import type { RouteDetail } from '../types';
import { Scale, Zap, Star, Sliders } from 'lucide-react';

interface AlgorithmComparisonProps {
  bfsRoute: RouteDetail | null;
  dijkstraRoute: RouteDetail | null;
  multiRoute: RouteDetail | null;
  currentStrategy: string;
  onStrategySelect: (strat: string) => void;
  alpha: number;
}

export const AlgorithmComparison: React.FC<AlgorithmComparisonProps> = ({
  bfsRoute,
  dijkstraRoute,
  multiRoute,
  currentStrategy,
  onStrategySelect,
  alpha,
}) => {
  // SVG Sparkline generator
  const renderSparkline = (points: number[], color: string) => {
    const w = 84;
    const h = 22;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const diff = max - min || 1;
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * (w - 6) + 3;
      const y = h - ((p - min) / diff) * (h - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return (
      <svg width={w} height={h} style={{ verticalAlign: 'middle' }}>
        <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" points={coords} />
      </svg>
    );
  };

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scale size={18} color="var(--accent-fuchsia)" />
          <span style={{ fontSize: '1.0rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Routing Algorithm Comparison
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Compare routing strategies for the selected source and destination
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          All values computed using exact Werner link model
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>

        {/* 1. Shortest-Hop (BFS) */}
        {bfsRoute ? (
          <div
            onClick={() => onStrategySelect('shortest_hop')}
            className="glass-panel"
            style={{
              padding: '1.0rem',
              cursor: 'pointer',
              border: currentStrategy === 'shortest_hop' ? '1px solid var(--color-bfs-red)' : '1px solid var(--border-subtle)',
              background: currentStrategy === 'shortest_hop'
                ? 'linear-gradient(180deg, rgba(244, 63, 94, 0.12) 0%, var(--surface-inset) 100%)'
                : 'var(--bg-card)',
              boxShadow: currentStrategy === 'shortest_hop' ? '0 0 20px rgba(244, 63, 94, 0.2)' : 'none',
              transform: currentStrategy === 'shortest_hop' ? 'translateY(-2px)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-bfs-red)' }}>
                <Zap size={15} />
                Shortest-Hop (BFS)
              </div>
              <span
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: 'var(--color-danger)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px'
                }}
              >
                Minimum Hops
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Path: <b>{bfsRoute.path.join(' ➔ ')}</b>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.35rem',
                background: 'var(--surface-inset)',
                padding: '0.5rem 0.4rem',
                borderRadius: '6px',
                textAlign: 'center',
                marginBottom: '0.65rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Hops</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{bfsRoute.num_hops}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Werner w</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{bfsRoute.werner_parameter.toFixed(4)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bell F<sub>e</sub></div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{bfsRoute.bell_fidelity.toFixed(4)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Avg Tel</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{bfsRoute.average_teleportation_fidelity.toFixed(4)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>Dist: <b>{bfsRoute.total_distance_km.toFixed(0)} km</b> | Delay: <b>{bfsRoute.total_delay_ms.toFixed(2)} ms</b></span>
              {renderSparkline([0.5, 0.6, 0.49], 'var(--color-bfs-red)')}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No route</div>
        )}

        {/* 2. Quality-Aware (Dijkstra) */}
        {dijkstraRoute ? (
          <div
            onClick={() => onStrategySelect('quality_aware')}
            className="glass-panel"
            style={{
              padding: '1.0rem',
              cursor: 'pointer',
              border: currentStrategy === 'quality_aware' ? '1px solid var(--accent-fuchsia)' : '1px solid var(--border-subtle)',
              background: currentStrategy === 'quality_aware'
                ? 'linear-gradient(180deg, rgba(192, 38, 211, 0.15) 0%, var(--surface-inset) 100%)'
                : 'var(--bg-card)',
              boxShadow: currentStrategy === 'quality_aware' ? '0 0 25px rgba(217, 70, 239, 0.25)' : 'none',
              transform: currentStrategy === 'quality_aware' ? 'translateY(-2px)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-dijkstra-blue)' }}>
                <Star size={15} />
                Quality-Aware (Dijkstra)
              </div>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: 'var(--color-info)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px'
                }}
              >
                Best Fidelity ✓
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Path: <b>{dijkstraRoute.path.join(' ➔ ')}</b>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.35rem',
                background: 'var(--surface-inset)',
                padding: '0.5rem 0.4rem',
                borderRadius: '6px',
                textAlign: 'center',
                marginBottom: '0.65rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Hops</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dijkstraRoute.num_hops}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Werner w</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dijkstraRoute.werner_parameter.toFixed(4)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bell F<sub>e</sub></div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dijkstraRoute.bell_fidelity.toFixed(4)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Avg Tel</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dijkstraRoute.average_teleportation_fidelity.toFixed(4)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>Dist: <b>{dijkstraRoute.total_distance_km.toFixed(0)} km</b> | Delay: <b>{dijkstraRoute.total_delay_ms.toFixed(2)} ms</b></span>
              {renderSparkline([0.7, 0.8, 0.8574], 'var(--color-info)')}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No route</div>
        )}

        {/* 3. Multi-Metric (α) */}
        {multiRoute ? (
          <div
            onClick={() => onStrategySelect('multi_metric')}
            className="glass-panel"
            style={{
              padding: '1.0rem',
              cursor: 'pointer',
              border: currentStrategy === 'multi_metric' ? '1px solid var(--accent-fuchsia)' : '1px solid var(--border-subtle)',
              background: currentStrategy === 'multi_metric'
                ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.15) 0%, var(--surface-inset) 100%)'
                : 'var(--bg-card)',
              boxShadow: currentStrategy === 'multi_metric' ? '0 0 20px rgba(168, 85, 247, 0.2)' : 'none',
              transform: currentStrategy === 'multi_metric' ? 'translateY(-2px)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-multi-purple)' }}>
                <Sliders size={15} />
                Multi-Metric (α = {alpha.toFixed(2)})
              </div>
              <span
                style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: 'var(--accent-violet)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px'
                }}
              >
                Balanced
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Path: <b>{multiRoute.path.join(' ➔ ')}</b>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.35rem',
                background: 'var(--surface-inset)',
                padding: '0.5rem 0.4rem',
                borderRadius: '6px',
                textAlign: 'center',
                marginBottom: '0.65rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Hops</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{multiRoute.num_hops}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Werner w</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{multiRoute.werner_parameter.toFixed(4)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bell F<sub>e</sub></div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{multiRoute.bell_fidelity.toFixed(4)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Avg Tel</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{multiRoute.average_teleportation_fidelity.toFixed(4)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>Dist: <b>{multiRoute.total_distance_km.toFixed(0)} km</b> | Delay: <b>{multiRoute.total_delay_ms.toFixed(2)} ms</b></span>
              {renderSparkline([0.65, 0.78, 0.8216], 'var(--color-multi-purple)')}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No route</div>
        )}

      </div>
    </div>
  );
};
