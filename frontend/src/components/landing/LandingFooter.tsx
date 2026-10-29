import React from 'react';
import { ExternalLink, ArrowUp } from 'lucide-react';
import { Reveal } from '../Reveal';

interface LandingFooterProps {
  onSelectModule: (tabId: string) => void;
}

const labLinks = [
  { id: 'network', label: 'Network lab' },
  { id: 'experiments', label: 'Guided experiments' },
  { id: 'channels', label: 'Physical channels' },
  { id: 'purification', label: 'Purification' },
];

const toolLinks = [
  { id: 'qasm', label: 'OpenQASM 3.0 exporter' },
  { id: 'validation', label: 'Validation suite' },
  { id: 'analysis', label: 'State tomography' },
  { id: 'docs', label: 'Documentation' },
];

export const LandingFooter: React.FC<LandingFooterProps> = ({ onSelectModule }) => {
  return (
    <footer style={{ borderTop: '1px solid var(--border-faint)', padding: '3.5rem 0 2rem' }}>
      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 var(--page-gutter)' }}>
        <Reveal
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <img
                src="/assets/quantumroute-symbol.png"
                alt=""
                width={26}
                height={26}
                style={{ width: 26, height: 26, objectFit: 'contain' }}
              />
              <span style={{ fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
                QuantumRoute
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.65, color: 'var(--text-muted)', maxWidth: '32ch' }}>
              Interactive quantum-network simulation and research platform for multi-hop routing,
              teleportation, and BBPSSW distillation.
            </p>
            <a
              href="https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-quantum-d-clan"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.25rem',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '2px',
              }}
            >
              GitHub repository
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>

          <div>
            <div className="qr-card-label" style={{ marginBottom: '1rem' }}>
              Simulator labs
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {labLinks.map((link) => (
                <li key={link.id}>
                  <button type="button" className="qr-link" onClick={() => onSelectModule(link.id)}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="qr-card-label" style={{ marginBottom: '1rem' }}>
              Developer & physics
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {toolLinks.map((link) => (
                <li key={link.id}>
                  <button type="button" className="qr-link" onClick={() => onSelectModule(link.id)}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="qr-card-label" style={{ marginBottom: '1rem' }}>
              Context
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.65, color: 'var(--text-muted)' }}>
              Built for <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>VTU Qiskit Fall Fest 2026</strong>.
              Powered by Qiskit 1.4 and Aer 0.18.
            </p>
            <p style={{ fontSize: '0.74rem', lineHeight: 1.6, color: 'var(--text-dim)', marginTop: '0.75rem' }}>
              Open source under the MIT licence. Numerical simulation only — no hardware overclaims.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            borderTop: '1px solid var(--border-faint)',
            paddingTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.74rem',
            color: 'var(--text-dim)',
          }}
        >
          <span>© 2026 QuantumRoute Team · VTU Qiskit Fall Fest</span>

          <button
            type="button"
            className="qr-link"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ fontSize: '0.74rem' }}
          >
            Back to top
            <ArrowUp size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
};
