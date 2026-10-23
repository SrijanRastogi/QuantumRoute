import React from 'react';
import { Network, Compass, Activity, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CapabilityShowcaseProps {
  onSelectModule: (tabId: string) => void;
}

export const CapabilityShowcase: React.FC<CapabilityShowcaseProps> = ({ onSelectModule }) => {
  const capabilities = [
    {
      id: 'network',
      title: 'Quantum Network Routing',
      tag: 'Milestone 1 · Quality-Aware Pathfinding',
      accentColor: '#38bdf8',
      accentBg: 'rgba(56, 189, 248, 0.12)',
      borderColor: 'rgba(56, 189, 248, 0.35)',
      icon: Network,
      description:
        'Compare Dijkstra quality-aware routing against Breadth-First Search and multi-metric Pareto trade-offs across customizable quantum network topologies. Edit link lengths and Werner parameters in real time.',
      formula: 'Cost: c_e = -ln(w_e)  ·  w_path = ∏ w_e',
      highlights: [
        'Dijkstra pathfinding optimizing end-to-end Werner parameter',
        'Real-time link editing of distance (km) and initial fidelity',
        'Dynamic multi-hop circuit simulation modal with Qiskit Aer',
        'Topologies: Generic Mesh, Star, Ring, Grid, and Regional Backbone',
      ],
      buttonLabel: 'Launch Network Lab',
    },
    {
      id: 'experiments',
      title: 'Guided Quantum Experiments',
      tag: 'Milestone 2 · 3D Bloch Sphere & Teleportation',
      accentColor: '#d946ef',
      accentBg: 'rgba(217, 70, 239, 0.12)',
      borderColor: 'rgba(217, 70, 239, 0.35)',
      icon: Compass,
      description:
        'Explore single-qubit quantum state preparation and teleportation with an interactive 3D Three.js Bloch sphere. Synchronize Cartesian (X,Y,Z) and Spherical (θ,φ) coordinates, test mixed states, and sweep depolarizing noise.',
      formula: 'F_tel = (2·F_e + 1)/3  ·  Classical Limit: F = 2/3',
      highlights: [
        'Real-time Three.js 3D Bloch sphere vector orientation',
        'Dual spherical-Cartesian synchronized coordinate editor',
        'Qiskit Aer teleportation circuit execution with Kraus depolarizing noise',
        'Automated classical limit crossing analysis and noise sweeps',
      ],
      buttonLabel: 'Explore Guided Experiments',
    },
    {
      id: 'channels',
      title: 'Physical Channels Lab',
      tag: 'Milestone 3 · Fiber Physics & Yield vs. Quality',
      accentColor: '#10b981',
      accentBg: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      icon: Activity,
      description:
        'Model the physical realities of quantum optical fiber channels. Simulate exponential Beer-Lambert attenuation at 1550 nm telecom wavelengths, detector dark counts, and the fundamental trade-off between entanglement yield and route fidelity.',
      formula: 'η(L) = 10^(-α·L / 10)  ·  α = 0.20 dB/km',
      highlights: [
        'Telecom fiber loss modeling across 1 km to 200 km spans',
        'Detector dark counts and single-photon coupling efficiency',
        'Multi-hop path evaluation comparing Pareto vs Dijkstra paths',
        'Yield-vs-distance parametric attenuation sweeps',
      ],
      buttonLabel: 'Test Physical Channels',
    },
    {
      id: 'purification',
      title: 'Entanglement Purification',
      tag: 'Milestone 4 · BBPSSW Recurrence Protocol',
      accentColor: '#c084fc',
      accentBg: 'rgba(192, 132, 252, 0.12)',
      borderColor: 'rgba(192, 132, 252, 0.35)',
      icon: Sparkles,
      description:
        'Distill higher-fidelity entangled Bell pairs from two noisy raw pairs using the BBPSSW bilateral-CNOT protocol. Verify the critical threshold boundary at F = 0.50 and run finite-shot Qiskit Aer Monte Carlo trials with rigorous uncertainty accounting.',
      formula: "F_out = (1 + 2w + 5w²) / (4(1 + w²))  ·  Threshold F = 0.50",
      highlights: [
        'BBPSSW bilateral-CNOT filtering on raw Werner states',
        'Critical threshold fixed point boundary (F_in = 0.50, w = 1/3)',
        'Finite-shot Qiskit Aer simulation with accepted-sample uncertainty',
        'Standardized OpenQASM 3.0 circuit export for hardware execution',
      ],
      buttonLabel: 'Open Purification Lab',
    },
  ];

  return (
    <section id="capabilities" style={{ padding: '5.0rem 1.75rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(147, 51, 234, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            color: '#d8b4fe',
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '0.35rem 0.95rem',
            borderRadius: '20px',
            marginBottom: '1.0rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <Sparkles size={13} color="var(--accent-fuchsia)" />
          Complete Capability Suite
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
          Engineered for Rigorous Quantum Research
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
          Each capability connects analytical physics formulation directly to verified Qiskit Aer circuits. Select any module below to jump directly into the live simulator.
        </p>
      </div>

      {/* 2x2 Grid of Feature Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
        }}
      >
        {capabilities.map((cap) => {
          const Icon = cap.icon;
          return (
            <div
              key={cap.id}
              className="glass-panel"
              style={{
                padding: '2.0rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: `1px solid ${cap.borderColor}`,
                background: 'linear-gradient(180deg, rgba(22, 14, 44, 0.75) 0%, rgba(12, 7, 24, 0.9) 100%)',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 14px 40px ${cap.accentBg}`;
                e.currentTarget.style.borderColor = cap.accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.37)';
                e.currentTarget.style.borderColor = cap.borderColor;
              }}
            >
              {/* Top ambient color flare */}
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${cap.accentColor} 0%, transparent 70%)`,
                  opacity: 0.18,
                  filter: 'blur(25px)',
                  pointerEvents: 'none',
                }}
              />

              <div>
                {/* Header: Icon & Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: cap.accentBg,
                      border: `1px solid ${cap.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cap.accentColor,
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: cap.accentColor,
                      background: cap.accentBg,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${cap.borderColor}`,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {cap.tag}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '-0.02em',
                    marginBottom: '0.75rem',
                  }}
                >
                  {cap.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                    marginBottom: '1.15rem',
                  }}
                >
                  {cap.description}
                </p>

                {/* Math Formula Monospace Box */}
                <div
                  style={{
                    background: 'rgba(5, 3, 12, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#e2e8f0',
                    marginBottom: '1.25rem',
                  }}
                >
                  {cap.formula}
                </div>

                {/* Feature Bullet Points */}
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 1.5rem 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {cap.highlights.map((h, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.4,
                      }}
                    >
                      <CheckCircle2 size={14} color={cap.accentColor} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Action Button */}
              <button
                onClick={() => onSelectModule(cap.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.7rem 1.0rem',
                  borderRadius: '8px',
                  background: cap.accentBg,
                  border: `1px solid ${cap.borderColor}`,
                  color: '#fff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = cap.accentColor;
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = cap.accentBg;
                  e.currentTarget.style.color = '#fff';
                }}
              >
                <span>{cap.buttonLabel}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
