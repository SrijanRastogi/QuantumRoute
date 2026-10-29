import React from 'react';
import { ShieldCheck, BookOpen, Check, Cpu } from 'lucide-react';
import { MathBlock } from '../MathView';
import { Reveal } from '../Reveal';

interface ScientificCredibilitySectionProps {
  onOpenDocs: () => void;
  onOpenValidation: () => void;
}

const principles = [
  {
    title: 'Werner-state invariant formulation',
    badge: 'PLAN.md §5.1',
    equation: '\\rho_W(w) = w |\\Phi^+\\rangle\\langle\\Phi^+| + (1 - w) \\frac{I_4}{4} \\implies F_e = \\frac{1 + 3w}{4}',
    description:
      'State fidelities cannot be multiplied directly across multi-hop repeaters. Under Werner-state link assumptions, path composition multiplies Werner parameters: w_path = ∏ w_e. End-to-end fidelity is derived solely from w_path.',
  },
  {
    title: 'Dijkstra quality routing mapping',
    badge: 'AGENTS.md §3.3',
    equation: 'c_e = -\\ln(w_e) \\implies \\min \\sum c_e \\;\\equiv\\; \\max \\prod w_e',
    description:
      'Maximising the end-to-end product of Werner parameters is mathematically equivalent to minimising the sum of negative natural logarithms. Edges with w_e = 0 carry zero entanglement and are pruned from the graph.',
  },
  {
    title: 'Physical fibre attenuation & yield',
    badge: 'Milestone 3 physics',
    equation: '\\eta(L) = 10^{-\\frac{\\alpha \\cdot L}{10}} \\quad (\\alpha = 0.20\\text{ dB/km @ }1550\\text{ nm})',
    description:
      'Exponential Beer–Lambert transmissivity models photon attenuation in silica telecom fibre. Yield is kept separate from Werner decoherence so transmission loss is never conflated with depolarisation.',
  },
  {
    title: 'BBPSSW purification recurrence',
    badge: 'Milestone 4 recurrence',
    equation: 'F_{\\text{out}} = \\frac{5w^2 + 2w + 1}{4(w^2 + 1)} \\quad (\\text{Threshold } F_{\\text{in}} > 0.50)',
    description:
      'Two-pair bilateral CNOT filtering with parity coincidence (m_A = m_B). Above threshold, purification increases fidelity toward 1.0. Below it, the protocol degrades the state toward the maximally mixed state.',
  },
  {
    title: 'Analytical vs Aer residual verification',
    badge: 'Automated CI audit',
    equation: '|F_{\\text{analytical}} - F_{\\text{circuit}}| < 10^{-6} \\quad (201\\text{ tests passing})',
    description:
      'Every analytical calculation is benchmarked against Qiskit Aer 0.18 density-matrix simulations. Residuals are audited on every release so formulas cannot silently drift from the circuits.',
  },
];

export const ScientificCredibilitySection: React.FC<ScientificCredibilitySectionProps> = ({
  onOpenDocs,
  onOpenValidation,
}) => {
  return (
    <section id="science" className="qr-section" style={{ paddingTop: 0 }}>
      <div className="qr-section-head">
        <Reveal>
          <span className="qr-eyebrow">Scientific grounding</span>
          <h2 className="qr-section-title" style={{ marginTop: '1rem' }}>
            Verifiable
            <br />
            mathematics.
          </h2>
        </Reveal>
        <Reveal variant="left" delay={120}>
          <p className="qr-section-head-copy">
            Governed by source-of-truth specifications derived from standard quantum information
            theory. Each principle below is enforced by an automated check.
          </p>
        </Reveal>
      </div>

      <div className="qr-grid-2">
        {principles.map((principle, index) => (
          <Reveal key={principle.title} as="article" className="qr-card" delay={index * 70}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <span
                className="qr-card-label"
                style={{
                  padding: '0.18rem 0.5rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-muted)',
                }}
              >
                {principle.badge}
              </span>
              <Check size={15} color="var(--color-success)" aria-hidden="true" />
            </div>

            <h3 className="qr-card-title" style={{ fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
              {principle.title}
            </h3>

            <div
              style={{
                margin: '1rem 0',
                padding: '0.6rem 0.8rem',
                background: 'var(--surface-inset)',
                border: '1px solid var(--border-faint)',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
              }}
            >
              <MathBlock math={principle.equation} style={{ margin: 0, padding: 0 }} />
            </div>

            <p className="qr-card-body">{principle.description}</p>
          </Reveal>
        ))}
      </div>

      <Reveal style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
        <button type="button" onClick={onOpenDocs} className="btn-secondary">
          <ShieldCheck size={15} aria-hidden="true" />
          Read scientific documentation
        </button>
        <button type="button" onClick={onOpenValidation} className="btn-secondary">
          <Cpu size={15} aria-hidden="true" />
          View validation benchmarks
        </button>
        <button type="button" onClick={onOpenDocs} className="qr-link">
          <BookOpen size={15} aria-hidden="true" />
          Architecture decisions
        </button>
      </Reveal>
    </section>
  );
};
