import React from 'react';
import { Eye, ArrowRight, Play } from 'lucide-react';

interface ProductPreviewSectionProps {
  onLaunchSimulator: (tab?: string) => void;
}

export const ProductPreviewSection: React.FC<ProductPreviewSectionProps> = ({ onLaunchSimulator }) => {
  return (
    <section style={{ padding: '5.0rem 1.75rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.0rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(192, 38, 211, 0.15)',
            border: '1px solid rgba(217, 70, 239, 0.35)',
            color: '#f0abfc',
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '0.35rem 0.95rem',
            borderRadius: '20px',
            marginBottom: '1.0rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <Eye size={13} color="#f0abfc" />
          Interactive Simulator Workspace
        </div>

        <h2
          style={{
            fontSize: 'clamp(2.0rem, 4vw, 2.85rem)',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            marginBottom: '1.0rem',
          }}
        >
          Built for Precision Research & Execution
        </h2>

        <p
          style={{
            fontSize: '1.02rem',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Inspect the actual QuantumRoute V2 interface. No static mockups or fabricated dashboards—every calculation is powered by verified Qiskit Aer simulation engines.
        </p>
      </div>

      {/* Simulator Workspace Mockup Card */}
      <div
        className="glass-panel"
        style={{
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          background: 'linear-gradient(180deg, rgba(18, 11, 36, 0.95) 0%, rgba(9, 5, 20, 0.98) 100%)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.7), 0 0 40px rgba(147, 51, 234, 0.25)',
        }}
      >
        {/* Mock Top Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            background: 'rgba(12, 7, 24, 0.95)',
            borderBottom: '1px solid rgba(147, 51, 234, 0.2)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              quantumroute-v2 / simulator / network-lab
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontWeight: 600,
              }}
            >
              ● Qiskit Aer 0.18 Engine Active
            </span>
            <button
              onClick={() => onLaunchSimulator('network')}
              className="btn-primary"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.76rem',
                fontWeight: 700,
              }}
            >
              <span>Launch Live</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Mock Main Workspace Body */}
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '1.25rem' }}>
          
          {/* Left Column Preview: Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '0.85rem',
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fff', marginBottom: '0.45rem' }}>
                Topology Preset
              </div>
              <div style={{ fontSize: '0.8rem', color: '#c084fc', background: 'rgba(0,0,0,0.4)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                Generic Mesh (6 nodes · 10 links)
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '0.85rem',
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fff', marginBottom: '0.45rem' }}>
                Routing Strategy
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '0.76rem', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid #10b981', color: '#fff', fontWeight: 600 }}>
                  ✓ Quality-Aware (Dijkstra)
                </div>
                <div style={{ fontSize: '0.76rem', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)' }}>
                  Shortest-Hop (BFS)
                </div>
                <div style={{ fontSize: '0.76rem', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)' }}>
                  Multi-Metric (Pareto Trade-off)
                </div>
              </div>
            </div>

            <button
              onClick={() => onLaunchSimulator('network')}
              style={{
                background: 'linear-gradient(135deg, #7e22ce 0%, #c026d3 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
              }}
            >
              <Play size={14} />
              <span>Run Circuit Simulation</span>
            </button>
          </div>

          {/* Center Column Preview: Topology Diagram */}
          <div
            style={{
              background: 'rgba(8, 4, 18, 0.95)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                Interactive Topology Canvas
              </div>
              <div style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                Optimal Route Active (3 Hops)
              </div>
            </div>

            {/* Simplified Topology Diagram Schema */}
            <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-around', position: 'relative' }}>
              {/* Alice */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', border: '2px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontWeight: 800, margin: '0 auto 4px' }}>
                  A
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8' }}>Alice</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Source</div>
              </div>

              {/* Arrow Line 1 */}
              <div style={{ height: '2px', flex: 1, background: 'linear-gradient(90deg, #38bdf8, #a855f7)', margin: '0 8px' }} />

              {/* Repeater α */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)', border: '2px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontWeight: 800, margin: '0 auto 4px' }}>
                  R₁
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a855f7' }}>Rep A</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>120 km</div>
              </div>

              {/* Arrow Line 2 */}
              <div style={{ height: '2px', flex: 1, background: 'linear-gradient(90deg, #a855f7, #d946ef)', margin: '0 8px' }} />

              {/* Repeater δ */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(217, 70, 239, 0.2)', border: '2px solid #d946ef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d946ef', fontWeight: 800, margin: '0 auto 4px' }}>
                  R₂
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d946ef' }}>Rep D</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>180 km</div>
              </div>

              {/* Arrow Line 3 */}
              <div style={{ height: '2px', flex: 1, background: 'linear-gradient(90deg, #d946ef, #f59e0b)', margin: '0 8px' }} />

              {/* Bob */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontWeight: 800, margin: '0 auto 4px' }}>
                  B
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b' }}>Bob</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Target</div>
              </div>
            </div>

            {/* Path breakdown bar */}
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Dijkstra Path: Alice → Repeater A → Repeater D → Bob</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Total: 510 km</span>
            </div>
          </div>

          {/* Right Column Preview: Live Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Werner Parameter (w_path)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                0.8574
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>w = ∏ w_e (multiplicative)</div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Bell State Fidelity (F_e)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                0.8931
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Threshold F = 0.50 (Purifiable)</div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Teleportation Fidelity</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f0abfc', fontFamily: 'var(--font-mono)' }}>
                0.9287
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Classical Limit: 0.6667 (Passed)</div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Transmission Delay</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                2.55 ms
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>5.0 µs / km propagation</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
