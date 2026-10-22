import React, { useState } from 'react';
import type { NoiseSweepPoint } from '../types';

interface NoiseSweepChartProps {
  points: NoiseSweepPoint[];
  classicalThreshold?: number;
  width?: number;
  height?: number;
}

export const NoiseSweepChart: React.FC<NoiseSweepChartProps> = ({
  points,
  classicalThreshold = 2.0 / 3.0,
  width = 540,
  height = 240,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: '0.85rem',
          border: '1px dashed var(--border-subtle)',
          borderRadius: '8px',
        }}
      >
        Click "Run Parameter Sweep" to generate fidelity vs noise curve
      </div>
    );
  }

  // Margins
  const margin = { top: 20, right: 30, bottom: 35, left: 45 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // X range: 0.0 to 0.75 (or max p in points)
  const pMax = Math.max(0.75, ...points.map((pt) => pt.noise_p));
  const pMin = 0.0;

  // Y range: 0.5 to 1.05
  const yMin = 0.5;
  const yMax = 1.02;

  // Scaling functions
  const scaleX = (p: number) => margin.left + ((p - pMin) / (pMax - pMin)) * plotW;
  const scaleY = (f: number) => margin.top + (1 - (f - yMin) / (yMax - yMin)) * plotH;

  // Build SVG paths
  const theoreticalPath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(pt.noise_p)} ${scaleY(pt.theoretical_fidelity)}`)
    .join(' ');

  const simulatedPath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(pt.noise_p)} ${scaleY(pt.state_fidelity)}`)
    .join(' ');

  // Classical threshold Y
  const threshY = scaleY(classicalThreshold);

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id="quantumZoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="classicalZoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* Shaded Quantum Advantage Zone (F >= 2/3) */}
        <rect
          x={margin.left}
          y={scaleY(1.0)}
          width={plotW}
          height={Math.max(0, threshY - scaleY(1.0))}
          fill="url(#quantumZoneGrad)"
        />

        {/* Shaded Classical Zone (F < 2/3) */}
        <rect
          x={margin.left}
          y={threshY}
          width={plotW}
          height={Math.max(0, scaleY(yMin) - threshY)}
          fill="url(#classicalZoneGrad)"
        />

        {/* Gridlines */}
        {[0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((val) => {
          const y = scaleY(val);
          return (
            <g key={val}>
              <line
                x1={margin.left}
                y1={y}
                x2={margin.left + plotW}
                y2={y}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
              />
              <text
                x={margin.left - 8}
                y={y + 3.5}
                fill="#64748b"
                fontSize="10"
                textAnchor="end"
                fontFamily="monospace"
              >
                {val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* X axis ticks */}
        {[0.0, 0.15, 0.3, 0.45, 0.6, 0.75].map((val) => {
          const x = scaleX(val);
          return (
            <g key={val}>
              <line
                x1={x}
                y1={margin.top}
                x2={x}
                y2={margin.top + plotH}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={margin.top + plotH + 16}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {val.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Classical Threshold (F = 2/3) line */}
        <line
          x1={margin.left}
          y1={threshY}
          x2={margin.left + plotW}
          y2={threshY}
          stroke="#eab308"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text
          x={margin.left + plotW - 4}
          y={threshY - 5}
          fill="#eab308"
          fontSize="9.5"
          fontWeight="bold"
          textAnchor="end"
        >
          Classical Bound (F = 2/3 ≈ 0.667)
        </text>

        {/* Theoretical Curve (F = 1 - p/2) */}
        <path
          d={theoreticalPath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="3 3"
        />

        {/* Simulated Curve (Qiskit Aer) */}
        <path
          d={simulatedPath}
          fill="none"
          stroke="#a855f7"
          strokeWidth="2.5"
        />

        {/* Data points */}
        {points.map((pt, idx) => {
          const cx = scaleX(pt.noise_p);
          const cy = scaleY(pt.state_fidelity);
          const isHovered = hoveredIndex === idx;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill={pt.has_quantum_advantage ? '#10b981' : '#f43f5e'}
                stroke="#fff"
                strokeWidth={isHovered ? 2 : 1}
              />
            </g>
          );
        })}

        {/* Axis Labels */}
        <text
          x={margin.left + plotW / 2}
          y={height - 4}
          fill="#94a3b8"
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
        >
          Depolarizing Noise Parameter (p)
        </text>
        <text
          x={14}
          y={margin.top + plotH / 2}
          fill="#94a3b8"
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
          transform={`rotate(-90 14 ${margin.top + plotH / 2})`}
        >
          State Fidelity F(ρ)
        </text>
      </svg>

      {/* Hover Tooltip Box */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.72rem',
            color: '#e2e8f0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
          }}
        >
          <div>
            <span style={{ color: '#94a3b8' }}>Noise p: </span>
            <span style={{ fontWeight: 600 }}>{points[hoveredIndex].noise_p.toFixed(3)}</span>
            <span style={{ color: '#94a3b8', marginLeft: '8px' }}>Werner w: </span>
            <span style={{ fontWeight: 600 }}>{points[hoveredIndex].werner_w.toFixed(3)}</span>
          </div>
          <div style={{ marginTop: '2px' }}>
            <span style={{ color: '#a855f7' }}>Simulated F: </span>
            <span style={{ fontWeight: 700 }}>{points[hoveredIndex].state_fidelity.toFixed(4)}</span>
            <span style={{ color: '#38bdf8', marginLeft: '8px' }}>Theory F: </span>
            <span>{points[hoveredIndex].theoretical_fidelity.toFixed(4)}</span>
          </div>
          <div style={{ marginTop: '2px' }}>
            <span
              style={{
                color: points[hoveredIndex].has_quantum_advantage ? '#34d399' : '#f87171',
                fontWeight: 600,
              }}
            >
              {points[hoveredIndex].has_quantum_advantage
                ? '✓ Quantum Advantage (F > 2/3)'
                : '✗ Classical Threshold Reached (F ≤ 2/3)'}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '6px',
          fontSize: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '16px',
              height: '3px',
              background: '#a855f7',
              borderRadius: '2px',
              display: 'inline-block',
            }}
          />
          <span style={{ color: '#e2e8f0' }}>Qiskit Aer Simulated</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '16px',
              height: '2px',
              borderTop: '2px dashed #38bdf8',
              display: 'inline-block',
            }}
          />
          <span style={{ color: '#94a3b8' }}>Theoretical F = 1 - p/2</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '16px',
              height: '2px',
              borderTop: '2px dashed #eab308',
              display: 'inline-block',
            }}
          />
          <span style={{ color: '#facc15' }}>Classical Limit (2/3)</span>
        </div>
      </div>
    </div>
  );
};
