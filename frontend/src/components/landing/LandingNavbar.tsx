import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

interface LandingNavbarProps {
  onLaunchSimulator: () => void;
  onOpenDocs: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLaunchSimulator,
  onOpenDocs,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="qr-header">
      <div className="qr-progress" aria-hidden="true" />
      <div className="qr-header-inner">
        <button
          type="button"
          className="qr-brand"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="QuantumRoute — back to top"
        >
          <img
            src="/assets/quantumroute-symbol.png"
            alt=""
            className="qr-brand-mark"
            width={30}
            height={30}
          />
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="qr-brand-name">QuantumRoute</span>
            <span className="qr-brand-meta">Quantum network simulator</span>
          </span>
        </button>

        <nav className="qr-nav" aria-label="Primary">
          <button type="button" className="qr-nav-link" onClick={() => handleScrollTo('capabilities')}>
            Capabilities
          </button>
          <button type="button" className="qr-nav-link" onClick={() => handleScrollTo('how-it-works')}>
            Workflow
          </button>
          <button type="button" className="qr-nav-link" onClick={() => handleScrollTo('science')}>
            Science
          </button>
          <button type="button" className="qr-nav-link" onClick={onOpenDocs}>
            Documentation
          </button>
        </nav>

        <div className="qr-header-actions">
          <ThemeToggle />

          <button
            type="button"
            onClick={onLaunchSimulator}
            className="btn-primary"
            style={{ padding: '0.55rem 0.95rem' }}
          >
            <span className="qr-nav-launch-label">Launch simulator</span>
            <ArrowRight size={14} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="qr-icon-btn"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border-faint)',
            background: 'var(--bg-deep)',
            padding: '1rem var(--page-gutter) 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {[
            { label: 'Capabilities', id: 'capabilities' },
            { label: 'Workflow', id: 'how-it-works' },
            { label: 'Science', id: 'science' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className="qr-nav-item"
              onClick={() => handleScrollTo(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className="qr-nav-item"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenDocs();
            }}
          >
            Documentation
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 899px) {
          .qr-header-actions .qr-nav-launch-label { display: none; }
          .qr-header-actions .btn-primary { padding: 0.55rem 0.7rem !important; }
        }
        @media (min-width: 900px) {
          .qr-header-actions .qr-icon-btn[aria-expanded] { display: none !important; }
        }
      `}</style>
    </header>
  );
};
