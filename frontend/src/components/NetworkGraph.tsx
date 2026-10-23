import React, { useState, useMemo } from 'react';
import type { NetworkGraphData, NetworkEdge, RouteDetail } from '../types';
import { Sliders, RotateCcw } from 'lucide-react';

interface NetworkGraphProps {
  graph: NetworkGraphData | null;
  selectedRoute: RouteDetail | null;
  sourceNode: string;
  targetNode: string;
  selectedEdge?: NetworkEdge | null;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edge: NetworkEdge) => void;
  isNetworkModified?: boolean;
  onResetAllLinks?: () => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  graph,
  selectedRoute,
  sourceNode,
  targetNode,
  selectedEdge,
  onNodeClick,
  onEdgeClick,
  isNetworkModified,
  onResetAllLinks,
}) => {
  const [hoveredEdge, setHoveredEdge] = useState<NetworkEdge | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Derive active path edges set for fast lookup
  const activeEdges = useMemo(() => {
    const set = new Set<string>();
    if (!selectedRoute || !selectedRoute.path || selectedRoute.path.length < 2) return set;
    for (let i = 0; i < selectedRoute.path.length - 1; i++) {
      const u = selectedRoute.path[i];
      const v = selectedRoute.path[i + 1];
      set.add(`${u}-${v}`);
      set.add(`${v}-${u}`);
    }
    return set;
  }, [selectedRoute]);

  // Normalized coordinate mapping into SVG viewBox 0 0 700 480
  const { minX, maxX, minY, maxY } = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    if (graph && graph.nodes) {
      graph.nodes.forEach((n) => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      });
    }
    if (!isFinite(minX)) { minX = 0; maxX = 500; minY = 0; maxY = 400; }
    return { minX, maxX, minY, maxY };
  }, [graph]);

  const scaleX = (x: number) => {
    const span = maxX - minX || 1;
    return 70 + ((x - minX) / span) * 560;
  };

  const scaleY = (y: number) => {
    const span = maxY - minY || 1;
    return 410 - ((y - minY) / span) * 340;
  };

  const nodeMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; node: any }>();
    if (graph && graph.nodes) {
      graph.nodes.forEach((n) => {
        map.set(n.id, { x: scaleX(n.x), y: scaleY(n.y), node: n });
      });
    }
    return map;
  }, [graph, minX, maxX, minY, maxY]);

  const isEdgeSelected = (edge: NetworkEdge) => {
    if (!selectedEdge) return false;
    return (
      (edge.source === selectedEdge.source && edge.target === selectedEdge.target) ||
      (edge.source === selectedEdge.target && edge.target === selectedEdge.source)
    );
  };

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return (
      <div 
        style={{
          height: '490px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          background: 'rgba(10, 6, 22, 0.6)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        Loading quantum network topology...
      </div>
    );
  }

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '490px', 
        background: 'radial-gradient(ellipse at center, rgba(30, 16, 62, 0.5) 0%, rgba(9, 5, 20, 0.95) 75%)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Top Left: Accessible Link Selector & Modified Indicator */}
      <div 
        style={{
          position: 'absolute',
          top: '16px',
          left: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          zIndex: 10,
        }}
      >
        {/* Accessible Link Dropdown Fallback */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(14, 9, 28, 0.85)', backdropFilter: 'blur(8px)', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <Sliders size={13} color="var(--accent-fuchsia)" />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Link:</span>
          <select 
            aria-label="Select link to edit"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
            value={selectedEdge ? `${selectedEdge.source}-${selectedEdge.target}` : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              const [u, v] = val.split('-');
              const edge = graph.edges.find((ed) => (ed.source === u && ed.target === v) || (ed.source === v && ed.target === u));
              if (edge && onEdgeClick) onEdgeClick(edge);
            }}
          >
            <option value="" style={{ background: '#120b24', color: '#888' }}>
              Choose a link to edit...
            </option>
            {graph.edges.map((e) => (
              <option key={`${e.source}-${e.target}`} value={`${e.source}-${e.target}`} style={{ background: '#120b24', color: '#fff' }}>
                {e.source} ↔ {e.target} ({e.distance_km}km, w={e.w.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Modified Network Indicator */}
        {isNetworkModified && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              borderRadius: '8px',
              padding: '0.35rem 0.65rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#facc15',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span>Modified network</span>
            {onResetAllLinks && (
              <button 
                onClick={onResetAllLinks}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fef08a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.72rem',
                  padding: 0,
                  textDecoration: 'underline',
                }}
                title="Restore all links to preset default parameters"
              >
                <RotateCcw size={11} />
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Top Right: Legend */}
      <div 
        style={{
          position: 'absolute',
          top: '16px',
          right: '18px',
          background: 'rgba(14, 9, 28, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.55rem 0.8rem',
          fontSize: '0.72rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.3rem',
          zIndex: 10,
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '16px', height: '3px', background: 'var(--accent-fuchsia)', boxShadow: '0 0 6px var(--accent-fuchsia)', borderRadius: '2px' }} />
          <span>Selected Route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '16px', height: '2px', background: 'rgba(147, 51, 234, 0.4)', borderRadius: '2px' }} />
          <span>Network Link (Click to Edit)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-alice)', boxShadow: '0 0 6px var(--color-alice)' }} />
          <span>Source Node</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-bob)', boxShadow: '0 0 6px var(--color-bob)' }} />
          <span>Destination Node</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg 
        viewBox="0 0 700 480" 
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {/* Active Route Glow Filter */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Selected Edge Pulsing Glow Filter */}
          <filter id="selectedEdgeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node Glow Filters */}
          <filter id="aliceGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="bobGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Inactive Background Fiber Edges */}
        {graph.edges.map((edge) => {
          const u = nodeMap.get(edge.source);
          const v = nodeMap.get(edge.target);
          if (!u || !v) return null;
          const isActive = activeEdges.has(`${edge.source}-${edge.target}`);
          if (isActive) return null; // Rendered in active layer

          const isHovered = hoveredEdge === edge;
          const isSelected = isEdgeSelected(edge);

          return (
            <g 
              key={`${edge.source}-${edge.target}`} 
              style={{ cursor: 'pointer' }}
              onClick={() => onEdgeClick && onEdgeClick(edge)}
              onMouseEnter={() => setHoveredEdge(edge)}
              onMouseLeave={() => setHoveredEdge(null)}
            >
              {/* Invisible thicker hit-area for easy mouse clicking */}
              <line 
                x1={u.x} 
                y1={u.y} 
                x2={v.x} 
                y2={v.y} 
                stroke="transparent" 
                strokeWidth={18} 
              />

              {/* Distinct selected edge halo */}
              {isSelected && (
                <line 
                  x1={u.x} 
                  y1={u.y} 
                  x2={v.x} 
                  y2={v.y} 
                  stroke="#fbbf24" 
                  strokeWidth={6} 
                  strokeOpacity={0.6}
                  filter="url(#selectedEdgeGlow)"
                />
              )}

              {/* Visual line */}
              <line 
                x1={u.x} 
                y1={u.y} 
                x2={v.x} 
                y2={v.y} 
                stroke={isSelected ? '#facc15' : isHovered ? 'rgba(192, 38, 211, 0.9)' : 'rgba(147, 51, 234, 0.35)'} 
                strokeWidth={isSelected ? 3.0 : isHovered ? 2.5 : 1.5}
                strokeDasharray={isSelected ? '6,3' : isHovered ? 'none' : '4,3'}
                style={{ transition: 'all 0.15s ease' }}
              />

              {/* Edge Distance text marker on midpoint */}
              <rect
                x={(u.x + v.x) / 2 - 20}
                y={(u.y + v.y) / 2 - 13}
                width={40}
                height={14}
                rx={3}
                fill={isSelected ? 'rgba(234, 179, 8, 0.25)' : isHovered ? 'rgba(147, 51, 234, 0.35)' : 'rgba(10, 6, 22, 0.7)'}
                stroke={isSelected ? '#facc15' : isHovered ? 'rgba(192, 38, 211, 0.6)' : 'transparent'}
                strokeWidth={1}
              />
              <text
                x={(u.x + v.x) / 2}
                y={(u.y + v.y) / 2 - 3}
                fill={isSelected ? '#fde047' : isHovered ? '#fff' : 'rgba(192, 132, 252, 0.65)'}
                fontSize="8.5"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                fontWeight={isSelected || isHovered ? '700' : '500'}
              >
                {edge.distance_km}km
              </text>
            </g>
          );
        })}

        {/* 2. Active Glowing Route Edges */}
        {graph.edges.map((edge) => {
          const u = nodeMap.get(edge.source);
          const v = nodeMap.get(edge.target);
          if (!u || !v) return null;
          const isActive = activeEdges.has(`${edge.source}-${edge.target}`);
          if (!isActive) return null;

          const isHovered = hoveredEdge === edge;
          const isSelected = isEdgeSelected(edge);

          return (
            <g 
              key={`active-${edge.source}-${edge.target}`} 
              style={{ cursor: 'pointer' }}
              onClick={() => onEdgeClick && onEdgeClick(edge)}
              onMouseEnter={() => setHoveredEdge(edge)}
              onMouseLeave={() => setHoveredEdge(null)}
            >
              {/* Invisible thicker hit-area */}
              <line 
                x1={u.x} 
                y1={u.y} 
                x2={v.x} 
                y2={v.y} 
                stroke="transparent" 
                strokeWidth={20} 
              />

              {/* Selected halo */}
              {isSelected && (
                <line 
                  x1={u.x} 
                  y1={u.y} 
                  x2={v.x} 
                  y2={v.y} 
                  stroke="#fbbf24" 
                  strokeWidth={12} 
                  strokeOpacity={0.65}
                  filter="url(#selectedEdgeGlow)"
                />
              )}

              {/* Soft ambient outer halo */}
              <line 
                x1={u.x} 
                y1={u.y} 
                x2={v.x} 
                y2={v.y} 
                stroke="rgba(217, 70, 239, 0.4)" 
                strokeWidth={10} 
                strokeLinecap="round"
                filter="url(#routeGlow)"
              />
              {/* Core intense laser line */}
              <line 
                x1={u.x} 
                y1={u.y} 
                x2={v.x} 
                y2={v.y} 
                stroke={isSelected ? '#fde047' : isHovered ? '#fff' : '#f5d0fe'} 
                strokeWidth={isHovered ? 4.5 : 3.8} 
                strokeLinecap="round"
              />

              {/* Active hop distance pill */}
              <rect
                x={(u.x + v.x) / 2 - 25}
                y={(u.y + v.y) / 2 - 11}
                width={50}
                height={16}
                rx={4}
                fill={isSelected ? 'rgba(234, 179, 8, 0.3)' : 'rgba(19, 11, 36, 0.95)'}
                stroke={isSelected ? '#facc15' : 'rgba(217, 70, 239, 0.8)'}
                strokeWidth={isSelected ? 1.5 : 1}
              />
              <text
                x={(u.x + v.x) / 2}
                y={(u.y + v.y) / 2 + 1}
                fill={isSelected ? '#fde047' : '#f0abfc'}
                fontSize="9"
                fontWeight="700"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {edge.distance_km}km
              </text>
            </g>
          );
        })}

        {/* 3. Nodes Layer */}
        {graph.nodes.map((n) => {
          const pt = nodeMap.get(n.id);
          if (!pt) return null;

          const isSource = n.id === sourceNode || n.role === 'source';
          const isTarget = n.id === targetNode || n.role === 'destination';
          const inRoute = selectedRoute?.path.includes(n.id);
          const isHovered = hoveredNode === n.id;

          let fillColor = '#170f2e';
          let strokeColor = '#818cf8';
          let nodeRadius = 13;
          let filterUrl = '';

          if (isSource) {
            fillColor = 'var(--color-alice)';
            strokeColor = '#bae6fd';
            nodeRadius = 15;
            filterUrl = 'url(#aliceGlow)';
          } else if (isTarget) {
            fillColor = 'var(--color-bob)';
            strokeColor = '#fde68a';
            nodeRadius = 15;
            filterUrl = 'url(#bobGlow)';
          } else if (inRoute) {
            fillColor = '#7e22ce';
            strokeColor = '#f0abfc';
            nodeRadius = 14;
          }

          return (
            <g 
              key={n.id} 
              style={{ cursor: 'pointer' }}
              onClick={() => onNodeClick && onNodeClick(n.id)}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Outer pulsing ring for Source / Destination */}
              {isSource && (
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={22} 
                  fill="none" 
                  stroke="var(--color-alice)" 
                  strokeWidth={1.5} 
                  strokeDasharray="3,3" 
                  opacity={0.7}
                />
              )}

              {isTarget && (
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={22} 
                  fill="none" 
                  stroke="var(--color-bob)" 
                  strokeWidth={1.5} 
                  strokeDasharray="4,2" 
                  opacity={0.8}
                />
              )}

              {/* Main Node Circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? nodeRadius + 2 : nodeRadius}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isHovered ? 3 : 2}
                filter={filterUrl}
                style={{ transition: 'all 0.15s ease' }}
              />

              {/* Inner core pin */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill="#fff"
                opacity={0.9}
              />

              {/* Node Label Text */}
              <text
                x={pt.x}
                y={pt.y + 24}
                fill="#fff"
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-sans)"
                textAnchor="middle"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                {n.label || n.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Bottom Canvas Controls & Legend */}
      <div 
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '18px',
          right: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto', fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>💡 Click any link to edit distance & Werner parameter</span>
        </div>

        {/* Scale & Compass Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-dim)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100 km</span>
            <span style={{ letterSpacing: '-0.1em' }}>├──┼──┼──┤</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-fuchsia)' }}>▲</span>
            <span>N</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;
