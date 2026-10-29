import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Reveal } from '../Reveal';

interface HowItWorksSectionProps {
  onLaunchSimulator: () => void;
}

const steps = [
  {
    num: '01',
    title: 'Configure the network',
    desc: 'Choose a topology or define custom endpoints. Set link distances, initial Werner parameters, or dial in single-qubit Bloch angles (θ, φ) with depolarising noise.',
  },
  {
    num: '02',
    title: 'Execute the calculation',
    desc: 'Run Dijkstra quality-aware pathfinding, evaluate multiplicative Werner decay (w_path = ∏ w_e), and launch exact density-matrix or finite-shot Aer simulations.',
  },
  {
    num: '03',
    title: 'Inspect and export',
    desc: 'Analyse Bell fidelities, compare routing strategies, inspect reconstructed density matrices, and export verified OpenQASM 3.0 for hardware execution.',
  },
];

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onLaunchSimulator }) => {
  return (
    <section id="how-it-works" className="qr-section" style={{ paddingTop: 0 }}>
      <div className="qr-section-head">
        <Reveal>
          <span className="qr-eyebrow">Workflow</span>
          <h2 className="qr-section-title" style={{ marginTop: '1rem' }}>
            From topology
            <br />
            to verified circuit.
          </h2>
        </Reveal>
        <Reveal variant="left" delay={120}>
          <p className="qr-section-head-copy">
            QuantumRoute bridges classical graph-theoretic routing with real Qiskit circuit
            synthesis. Three stages, no hidden steps.
          </p>
        </Reveal>
      </div>

      <div className="qr-grid-3">
        {steps.map((step, index) => (
          <Reveal
            key={step.num}
            as="article"
            className="qr-card"
            delay={index * 100}
            style={{ paddingTop: '1.75rem' }}
          >
            <div className="qr-card-label" style={{ fontSize: '0.7rem' }}>
              Step {step.num}
            </div>
            <div
              aria-hidden="true"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(2.2rem, 4vw, 3rem)',
                fontWeight: 500,
                letterSpacing: '-0.06em',
                color: 'var(--text-dim)',
                margin: '0.6rem 0 1.1rem',
                lineHeight: 1,
              }}
            >
              {step.num}
            </div>
            <h3 className="qr-card-title" style={{ fontSize: '1.25rem' }}>
              {step.title}
            </h3>
            <p className="qr-card-body" style={{ marginTop: '0.75rem' }}>
              {step.desc}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal
        delay={80}
        style={{
          marginTop: '1.35rem',
          padding: '1.2rem 1.4rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          border: '1px solid var(--border-subtle)',
          borderLeft: '2px solid var(--accent-yellow)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-1)',
        }}
      >
        <AlertTriangle
          size={18}
          color="var(--accent-yellow)"
          style={{ flexShrink: 0, marginTop: '2px' }}
          aria-hidden="true"
        />
        <div>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Scope: high-fidelity numerical simulation
          </div>
          <p
            style={{
              marginTop: '0.3rem',
              fontSize: '0.81rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
            }}
          >
            Results reflect mathematical formulations of Werner-state links, entanglement
            swapping, fibre attenuation, and BBPSSW purification. The project does not claim
            physical hardware access or an operational quantum internet.
          </p>
        </div>
      </Reveal>

      <Reveal delay={120} style={{ marginTop: '2rem' }}>
        <button type="button" className="qr-link" onClick={onLaunchSimulator}>
          Test the workflow in the simulator
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </Reveal>
    </section>
  );
};
