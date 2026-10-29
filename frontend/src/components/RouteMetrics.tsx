import React from 'react';
import type { RouteDetail } from '../types';
import { Activity } from 'lucide-react';
import { MathInline } from './MathView';

interface RouteMetricsProps {
  route: RouteDetail | null;
  strategyLabel: string;
  improvementPct: number;
}

export const RouteMetrics: React.FC<RouteMetricsProps> = ({
  route,
  strategyLabel,
  improvementPct,
}) => {
  const footnoteStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
    marginTop: '0.25rem',
  };

  if (!route) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No route selected</div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '1.15rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.9rem',
          paddingBottom: '0.45rem',
          borderBottom: '1px solid var(--border-faint)'
        }}
      >
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Activity size={16} color="var(--accent-fuchsia)" />
          Route Metrics ({strategyLabel})
        </div>
        {improvementPct > 0 && (
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-success)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '12px'
            }}
          >
            +{improvementPct}% vs BFS
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem'
        }}
      >
        {/* Path Werner w */}
        <div
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9px',
            padding: '0.7rem 0.85rem'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Path Werner w
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {route.werner_parameter.toFixed(4)}
          </div>
          <div style={{ ...footnoteStyle, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
            <MathInline math={`\\prod_e w_e`} />
            <span style={{ color: 'var(--color-success)' }}>composed</span>
          </div>
        </div>

        {/* Bell Fidelity Fe */}
        <div
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9px',
            padding: '0.7rem 0.85rem'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Bell Fidelity F<sub>e</sub>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-fuchsia)', letterSpacing: '-0.02em' }}>
            {route.bell_fidelity.toFixed(4)}
          </div>
          <div style={{ ...footnoteStyle, display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <MathInline math={`\\dfrac{1 + 3w}{4}`} />
            <span style={{ color: 'var(--text-muted)' }}>Bell Pair</span>
          </div>
        </div>

        {/* Avg Teleport Fidelity */}
        <div
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9px',
            padding: '0.7rem 0.85rem'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Avg. Teleport Fidelity
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-info)', letterSpacing: '-0.02em' }}>
            {route.average_teleportation_fidelity.toFixed(4)}
          </div>
          <div style={{ ...footnoteStyle, display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <MathInline math={`\\dfrac{1 + w}{2}`} />
            <span style={{ color: 'var(--text-muted)' }}>Single-Qubit</span>
          </div>
        </div>

        {/* Hop Count */}
        <div
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9px',
            padding: '0.7rem 0.85rem'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Hop Count
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {route.num_hops} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>hops</span>
          </div>
          <div style={footnoteStyle}>
            {route.num_hops - 1} repeaters
          </div>
        </div>

        {/* Total Distance */}
        <div
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9px',
            padding: '0.7rem 0.85rem'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Total Distance
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {route.total_distance_km.toFixed(0)} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)' }}>km</span>
          </div>
        </div>

        {/* Estimated Delay */}
        <div
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9px',
            padding: '0.7rem 0.85rem'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Estimated Delay
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {route.total_delay_ms.toFixed(2)} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)' }}>ms</span>
          </div>
          <div style={footnoteStyle}>
            (5.0 µs/km)
          </div>
        </div>
      </div>
    </div>
  );
};
