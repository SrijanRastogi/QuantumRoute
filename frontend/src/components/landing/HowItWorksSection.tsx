import React from 'react';
import { Sliders, Cpu, FileCode2, AlertTriangle, ArrowRight } from 'lucide-react';

interface HowItWorksSectionProps {
  onLaunchSimulator: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onLaunchSimulator }) => {
  const steps = [
    {
      num: '01',
      title: 'Configure Network or Experiment',
      icon: Sliders,
      accent: '#38bdf8',
      desc: 'Select from standardized network topologies (Mesh, Star, Ring, Grid) or define custom endpoints. Configure link distances, initial Werner fidelities, or dial in single-qubit Bloch angles (θ, φ) with depolarizing noise parameters.',
    },
    {
      num: '02',
      title: 'Execute Calculations & Aer Simulations',
      icon: Cpu,
      accent: '#c084fc',
      desc: 'Run Dijkstra quality-aware pathfinding, evaluate multiplicative Werner parameter decay (w_path = ∏ w_e), and launch exact density-matrix or 4096-shot finite-shot Qiskit Aer circuit simulations across the multi-hop repeater path.',
    },
    {
      num: '03',
      title: 'Inspect Outcomes & Export Circuits',
      icon: FileCode2,
      accent: '#10b981',
      desc: 'Analyze Bell state fidelities, compare routing strategies against BFS and Pareto trade-offs, inspect reconstructed quantum state density matrices, and export verified OpenQASM 3.0 code for hardware execution.',
    },
  ];

  return (
    <section
      id="how-it-works"
      style={{
        padding: '5.0rem 1.75rem',
        maxWidth: '1280px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#7dd3fc',
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '0.35rem 0.95rem',
            borderRadius: '20px',
            marginBottom: '1.0rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Three-Stage Workflow
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
          From Abstract Topology to Verified Circuit
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
          QuantumRoute bridges classical graph-theoretical routing algorithms with real Qiskit quantum circuit synthesis.
        </p>
      </div>

      {/* 3 Step Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: '2.0rem 1.75rem',
                borderRadius: '16px',
                background: 'linear-gradient(180deg, rgba(20, 13, 38, 0.8) 0%, rgba(12, 7, 24, 0.9) 100%)',
                border: '1px solid rgba(147, 51, 234, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    fontSize: '2.0rem',
                    fontWeight: 900,
                    color: s.accent,
                    fontFamily: 'var(--font-mono)',
                    opacity: 0.85,
                  }}
                >
                  {s.num}
                </span>

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${s.accent}18`,
                    border: `1px solid ${s.accent}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: s.accent,
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>

              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.015em',
                }}
              >
                {s.title}
              </h3>

              <p
                style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Honest Scientific Disclaimer Callout */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1.0rem',
        }}
      >
        <AlertTriangle size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.25rem' }}>
            Product Reality & Scientific Scope: High-Fidelity Simulation
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
            QuantumRoute is an interactive quantum-network simulation and research platform powered by Qiskit Aer 0.18. Results reflect mathematical formulations of Werner-state links, entanglement swapping, fiber attenuation, and BBPSSW purification. The software does not claim physical quantum hardware access or demonstration of an operational quantum internet.
          </p>
        </div>
      </div>

      {/* Action link */}
      <div style={{ marginTop: '2.0rem', textAlign: 'center' }}>
        <button
          onClick={onLaunchSimulator}
          className="btn-secondary"
          style={{ padding: '0.65rem 1.35rem', fontSize: '0.86rem' }}
        >
          <span>Test the 3-Stage Workflow in Simulator</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
};
