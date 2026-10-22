import React from 'react';
import type { RouteDetail, HopBreakdown } from '../types';
import { ArrowRight, MapPin } from 'lucide-react';

interface SelectedRouteProps {
  route: RouteDetail | null;
  hops: HopBreakdown[];
}

export const SelectedRoute: React.FC<SelectedRouteProps> = ({ route, hops }) => {
  if (!route || !route.path || route.path.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active route path</div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '1.15rem', marginTop: '1rem' }}>
      <div 
        style={{ 
          fontSize: '0.92rem', 
          fontWeight: 700, 
          color: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.45rem',
          marginBottom: '0.75rem',
          paddingBottom: '0.45rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        <MapPin size={16} color="var(--accent-fuchsia)" />
        Selected Route
      </div>

      {/* Path Breadcrumb */}
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.45rem',
          background: 'var(--bg-card-alt)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.65rem 0.85rem',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#fff',
          marginBottom: '0.75rem',
        }}
      >
        {route.path.map((node, i) => (
          <React.Fragment key={node}>
            <span 
              style={{
                color: i === 0 ? 'var(--color-alice)' : i === route.path.length - 1 ? 'var(--color-bob)' : '#fff',
              }}
            >
              {node}
            </span>
            {i < route.path.length - 1 && (
              <ArrowRight size={13} color="var(--accent-purple)" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Hop segments breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {hops.map((hop, idx) => (
          <div 
            key={`${hop.from}-${hop.to}-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-fuchsia)' }} />
              <span>{hop.from} ➔ {hop.to}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {hop.distance_km} km · w={hop.w.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
