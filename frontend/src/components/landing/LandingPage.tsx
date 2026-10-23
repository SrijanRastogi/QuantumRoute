import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { QuantumNetworkVisual } from './QuantumNetworkVisual';
import { CapabilityShowcase } from './CapabilityShowcase';
import { HowItWorksSection } from './HowItWorksSection';
import { ProductPreviewSection } from './ProductPreviewSection';
import { ScientificCredibilitySection } from './ScientificCredibilitySection';
import { FinalCtaSection } from './FinalCtaSection';
import { LandingFooter } from './LandingFooter';
import { ArrowRight, BookOpen } from 'lucide-react';

interface LandingPageProps {
  onLaunchSimulator: (tab?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchSimulator }) => {
  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070512',
        color: 'var(--text-primary)',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* Global Ambient Glow Highlights */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '20%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, transparent 65%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          bottom: '10%',
          right: '5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192, 38, 211, 0.08) 0%, transparent 65%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 1. Sticky Navigation */}
      <LandingNavbar
        onLaunchSimulator={() => onLaunchSimulator('network')}
        onOpenDocs={() => onLaunchSimulator('docs')}
      />

      {/* 2. Hero Section */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '3.5rem 1.75rem 4.5rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1.0fr)',
          gap: '2.5rem',
          alignItems: 'center',
        }}
        className="hero-grid"
      >
        {/* Left Column: Bold Typography & CTAs */}
        <div>
          {/* Honest Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(147, 51, 234, 0.16)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '20px',
              padding: '0.35rem 0.95rem',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#a855f7',
                boxShadow: '0 0 8px #d946ef',
              }}
            />
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#e9d5ff', letterSpacing: '0.03em' }}>
              Interactive Quantum Network Simulator · Qiskit Aer Powered
            </span>
          </div>

          {/* Oversized Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.75rem, 5.5vw, 4.4rem)',
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: '#ffffff',
              marginBottom: '1.35rem',
            }}
          >
            Simulate the Future of{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #c084fc 0%, #ec4899 50%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
              }}
            >
              Quantum Networks.
            </span>
          </h1>

          {/* Supporting Lead Text */}
          <p
            style={{
              fontSize: '1.1rem',
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              marginBottom: '2.25rem',
              maxWidth: '560px',
            }}
          >
            Explore quantum routing algorithms, multi-hop entanglement swapping, physical optical fiber loss, and BBPSSW purification in an interactive, scientifically rigorous simulator.
          </p>

          {/* Primary & Secondary Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.0rem',
              flexWrap: 'wrap',
              marginBottom: '2.5rem',
            }}
          >
            <button
              onClick={() => onLaunchSimulator('network')}
              className="btn-primary"
              style={{
                padding: '0.8rem 1.65rem',
                fontSize: '0.94rem',
                fontWeight: 800,
                borderRadius: '10px',
                boxShadow: '0 0 25px rgba(192, 38, 211, 0.45)',
              }}
            >
              <span>Get Started</span>
              <ArrowRight size={17} />
            </button>

            <button
              onClick={() => handleScrollTo('science')}
              className="btn-secondary"
              style={{
                padding: '0.8rem 1.45rem',
                fontSize: '0.92rem',
                borderRadius: '10px',
              }}
            >
              <BookOpen size={16} />
              <span>Explore the Science</span>
            </button>
          </div>

          {/* Honest Capability Highlights Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.0rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '1.5rem',
              maxWidth: '540px',
            }}
          >
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                Qiskit 1.4
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Aer 0.18 Native Engine
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                OpenQASM 3
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Standard Circuit Export
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                201 / 201
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Verified Passing Tests
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Custom Animated Quantum Network Visualization */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '520px',
          }}
        >
          <QuantumNetworkVisual />
        </div>
      </section>

      {/* 3. Capability Showcase */}
      <CapabilityShowcase onSelectModule={(tab) => onLaunchSimulator(tab)} />

      {/* 4. How It Works */}
      <HowItWorksSection onLaunchSimulator={() => onLaunchSimulator('network')} />

      {/* 5. Product Preview Section */}
      <ProductPreviewSection onLaunchSimulator={(tab) => onLaunchSimulator(tab)} />

      {/* 6. Scientific Credibility */}
      <ScientificCredibilitySection
        onOpenDocs={() => onLaunchSimulator('docs')}
        onOpenValidation={() => onLaunchSimulator('validation')}
      />

      {/* 6. Final CTA Section */}
      <FinalCtaSection
        onLaunchSimulator={() => onLaunchSimulator('network')}
        onOpenDocs={() => onLaunchSimulator('docs')}
      />

      {/* 7. Landing Footer */}
      <LandingFooter onSelectModule={(tab) => onLaunchSimulator(tab)} />

      {/* Responsive layout styles */}
      <style>{`
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 2.0rem !important;
          }
        }
      `}</style>
    </div>
  );
};
