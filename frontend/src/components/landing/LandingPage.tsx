import React, { useEffect, useRef } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { QuantumNetworkVisual } from './QuantumNetworkVisual';
import { CapabilityShowcase } from './CapabilityShowcase';
import { HowItWorksSection } from './HowItWorksSection';
import { ProductPreviewSection } from './ProductPreviewSection';
import { ScientificCredibilitySection } from './ScientificCredibilitySection';
import { FinalCtaSection } from './FinalCtaSection';
import { LandingFooter } from './LandingFooter';
import { ArrowRight, BookOpen, MousePointer2 } from 'lucide-react';

interface LandingPageProps {
  onLaunchSimulator: (tab?: string) => void;
}

const TECH_MARQUEE = [
  'Qiskit 1.4',
  'Aer 0.18',
  'OpenQASM 3.0',
  'Werner states',
  'Dijkstra',
  'BFS',
  'BBPSSW',
  'KaTeX',
  'Three.js',
  'REST API',
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchSimulator }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const handleScrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Pointer-follow spotlight shared by every card in the page.
    const onPointerMove = (event: PointerEvent) => {
      const target = (event.target as HTMLElement)?.closest?.('.qr-card') as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      target.style.setProperty('--my', `${event.clientY - rect.top}px`);
    };

    root.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => root.removeEventListener('pointermove', onPointerMove);
  }, []);

  return (
    <div className="qr-landing" ref={rootRef}>
      <LandingNavbar
        onLaunchSimulator={() => onLaunchSimulator('network')}
        onOpenDocs={() => onLaunchSimulator('docs')}
      />

      {/* Hero */}
      <section className="qr-hero">
        <div className="qr-hero-copy">
          <span className="qr-eyebrow" data-hero-fade="1">
            Qiskit Fall Fest 2026 · Quantum D Clan
          </span>

          <h1 className="qr-display qr-hero-title" style={{ marginTop: '1.4rem' }}>
            <span className="qr-hero-line">
              <span>Quantum</span>
            </span>
            <span className="qr-hero-line">
              <span className="qr-display-accent">networks,</span>
            </span>
            <span className="qr-hero-line">
              <span>routed.</span>
            </span>
          </h1>

          <p className="qr-lead" style={{ marginTop: '1.75rem', maxWidth: '54ch' }} data-hero-fade="2">
            An interactive simulator for multi-hop entanglement routing. Map a topology, edit real
            link quality, compare Dijkstra against BFS, and run verified Qiskit Aer circuits end to
            end.
          </p>

          <div className="qr-hero-actions" data-hero-fade="3">
            <button
              type="button"
              onClick={() => onLaunchSimulator('network')}
              className="btn-primary"
              style={{ padding: '0.78rem 1.4rem', fontSize: '0.9rem' }}
            >
              Launch simulator
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => handleScrollTo('science')}
              className="btn-secondary"
              style={{ padding: '0.78rem 1.3rem', fontSize: '0.9rem' }}
            >
              <BookOpen size={15} aria-hidden="true" />
              Explore the science
            </button>
          </div>

          <div className="qr-hero-stats" data-hero-fade="4">
            <div>
              <div className="qr-hero-stat-value">Qiskit 1.4</div>
              <div className="qr-hero-stat-label">Aer 0.18 native engine</div>
            </div>
            <div>
              <div className="qr-hero-stat-value">OpenQASM 3</div>
              <div className="qr-hero-stat-label">Verified circuit export</div>
            </div>
            <div>
              <div className="qr-hero-stat-value">201 / 201</div>
              <div className="qr-hero-stat-label">Passing test suite</div>
            </div>
          </div>

          <div className="qr-scroll-cue" aria-hidden="true">
            <MousePointer2 size={13} />
            <span>Scroll to explore</span>
            <span className="qr-scroll-cue-line" />
          </div>
        </div>

        <div className="qr-hero-visual" data-hero-fade="3">
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: '8% 0 12% 0',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-faint)',
              background:
                'radial-gradient(120% 90% at 50% 0%, rgba(126, 94, 255, 0.16), transparent 62%)',
              overflow: 'hidden',
            }}
          >
            <div className="qr-noise" />
            <div className="qr-glow" style={{ width: 340, height: 340, top: '-12%', right: '-8%' }} />
          </div>
          <div style={{ position: 'relative', height: '100%', minHeight: 420 }}>
            <QuantumNetworkVisual />
          </div>
        </div>
      </section>

      {/* Technology marquee */}
      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 var(--page-gutter)' }}>
        <div className="qr-marquee" aria-label="Technology stack">
          <div className="qr-marquee-track">
            {[0, 1].map((copy) => (
              <React.Fragment key={copy}>
                {TECH_MARQUEE.map((item) => (
                  <span
                    key={`${copy}-${item}`}
                    className="qr-marquee-item"
                    aria-hidden={copy === 1 ? true : undefined}
                  >
                    {item}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <CapabilityShowcase onSelectModule={(tab) => onLaunchSimulator(tab)} />
      <HowItWorksSection onLaunchSimulator={() => onLaunchSimulator('network')} />
      <ProductPreviewSection onLaunchSimulator={(tab) => onLaunchSimulator(tab)} />
      <ScientificCredibilitySection
        onOpenDocs={() => onLaunchSimulator('docs')}
        onOpenValidation={() => onLaunchSimulator('validation')}
      />
      <FinalCtaSection
        onLaunchSimulator={() => onLaunchSimulator('network')}
        onOpenDocs={() => onLaunchSimulator('docs')}
      />
      <LandingFooter onSelectModule={(tab) => onLaunchSimulator(tab)} />
    </div>
  );
};
