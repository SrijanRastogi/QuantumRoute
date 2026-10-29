import React from 'react';
import { Network, Compass, Activity, Sparkles, ArrowUpRight } from 'lucide-react';
import { MathBlock } from '../MathView';
import { Reveal } from '../Reveal';

interface CapabilityShowcaseProps {
  onSelectModule: (tabId: string) => void;
}

const capabilities = [
  {
    id: 'network',
    number: '01',
    title: 'Quantum network routing',
    tag: 'Milestone 1 · Quality-aware pathfinding',
    accent: 'var(--color-dijkstra-blue)',
    icon: Network,
    description:
      'Compare Dijkstra quality-aware routing against breadth-first search and multi-metric Pareto trade-offs across customizable topologies. Edit link lengths and Werner parameters in real time.',
    formula: 'c_e = -\\ln(w_e) \\implies w_{\\text{path}} = \\prod_{e \\in P} w_e',
    highlights: [
      'Dijkstra pathfinding optimising the end-to-end Werner parameter',
      'Live link editing of distance (km) and initial fidelity',
      'Dynamic multi-hop circuit simulation with Qiskit Aer',
      'Mesh, star, ring, grid, and regional backbone topologies',
    ],
    action: 'Open network lab',
  },
  {
    id: 'experiments',
    number: '02',
    title: 'Guided quantum experiments',
    tag: 'Milestone 2 · Bloch sphere & teleportation',
    accent: 'var(--accent-magenta)',
    icon: Compass,
    description:
      'Explore single-qubit state preparation and teleportation with an interactive 3D Bloch sphere. Synchronise Cartesian and spherical coordinates, test mixed states, and sweep depolarising noise.',
    formula: 'F_{\\text{tel}} = \\frac{2F_e + 1}{3} \\quad \\left(\\text{Classical bound } F = \\tfrac{2}{3}\\right)',
    highlights: [
      'Real-time Three.js Bloch vector orientation',
      'Dual spherical–Cartesian coordinate editor',
      'Aer teleportation circuits with Kraus depolarising noise',
      'Automated classical-limit crossing analysis',
    ],
    action: 'Explore experiments',
  },
  {
    id: 'channels',
    number: '03',
    title: 'Physical channels lab',
    tag: 'Milestone 3 · Fibre physics & yield',
    accent: 'var(--color-success)',
    icon: Activity,
    description:
      'Model the physical realities of quantum optical fibre channels. Simulate Beer–Lambert attenuation at 1550 nm, detector dark counts, and the trade-off between entanglement yield and route fidelity.',
    formula: '\\eta(L) = 10^{-\\frac{\\alpha \\cdot L}{10}} \\quad (\\alpha = 0.20\\text{ dB/km @ }1550\\text{ nm})',
    highlights: [
      'Telecom fibre loss from 1 km to 200 km spans',
      'Detector dark counts and single-photon coupling efficiency',
      'Multi-hop path evaluation against Pareto alternatives',
      'Yield-versus-distance parametric sweeps',
    ],
    action: 'Test channels',
  },
  {
    id: 'purification',
    number: '04',
    title: 'Entanglement purification',
    tag: 'Milestone 4 · BBPSSW recurrence',
    accent: 'var(--accent-violet)',
    icon: Sparkles,
    description:
      'Distil higher-fidelity Bell pairs from two noisy raw pairs using the BBPSSW bilateral-CNOT protocol. Verify the critical boundary at F = 0.50 and run finite-shot Aer Monte Carlo trials.',
    formula: 'F_{\\text{out}} = \\frac{5w^2 + 2w + 1}{4(w^2 + 1)} \\quad (F_{\\text{in}} > 0.50)',
    highlights: [
      'BBPSSW bilateral-CNOT filtering on Werner states',
      'Critical fixed point at F_in = 0.50, w = 1/3',
      'Finite-shot Aer trials with uncertainty accounting',
      'OpenQASM 3.0 export for hardware execution',
    ],
    action: 'Open purification lab',
  },
];

export const CapabilityShowcase: React.FC<CapabilityShowcaseProps> = ({ onSelectModule }) => {
  return (
    <section id="capabilities" className="qr-section">
      <div className="qr-section-head">
        <Reveal>
          <span className="qr-eyebrow">Capabilities</span>
          <h2 className="qr-section-title" style={{ marginTop: '1rem' }}>
            Four labs.
            <br />
            One honest model.
          </h2>
        </Reveal>
        <Reveal variant="left" delay={120}>
          <p className="qr-section-head-copy">
            Every capability connects an analytical physics formulation directly to a verified
            Qiskit Aer circuit. Choose a module to enter the live workspace.
          </p>
        </Reveal>
      </div>

      <div className="qr-grid-2">
        {capabilities.map((cap, index) => {
          const Icon = cap.icon;
          return (
            <Reveal key={cap.id} as="article" className="qr-card" delay={index * 90}>
              <div className="qr-card-glow" aria-hidden="true" />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.4rem',
                }}
              >
                <span className="qr-card-label">{cap.number} / Module</span>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: cap.accent,
                    background: 'var(--surface-1)',
                  }}
                >
                  <Icon size={16} aria-hidden="true" />
                </span>
              </div>

              <h3 className="qr-card-title">{cap.title}</h3>
              <div className="qr-card-label" style={{ marginTop: '0.55rem' }}>
                {cap.tag}
              </div>

              <p className="qr-card-body" style={{ marginTop: '1rem' }}>
                {cap.description}
              </p>

              <div
                style={{
                  margin: '1.4rem 0',
                  padding: '0.7rem 0.9rem',
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--border-faint)',
                  borderRadius: 'var(--radius-sm)',
                  overflowX: 'auto',
                }}
              >
                <MathBlock math={cap.formula} style={{ margin: 0, padding: 0 }} />
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem',
                  marginBottom: '1.5rem',
                }}
              >
                {cap.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      fontSize: '0.81rem',
                      lineHeight: 1.45,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 4,
                        height: 4,
                        marginTop: '0.45rem',
                        borderRadius: '50%',
                        background: cap.accent,
                        flexShrink: 0,
                      }}
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="qr-link"
                onClick={() => onSelectModule(cap.id)}
                style={{
                  marginTop: 'auto',
                  alignSelf: 'flex-start',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                }}
              >
                {cap.action}
                <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};
