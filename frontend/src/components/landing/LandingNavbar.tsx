import React, { useState } from 'react';
import { ArrowRight, Menu, X, BookOpen, Layers, ShieldCheck, Cpu } from 'lucide-react';

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
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(9, 5, 20, 0.82)',
        borderBottom: '1px solid rgba(147, 51, 234, 0.18)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.85rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          className="navbar-brand-logo"
          title="QuantumRoute™ — Simulate the Future of Quantum Networks"
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'drop-shadow(0 0 14px rgba(192, 38, 211, 0.75))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
          }}
        >
          <img 
            src="/assets/quantumroute-logo.png" 
            alt="QuantumRoute™ Quantum Network Simulator"
            style={{
              height: '48px',
              width: 'auto',
              maxWidth: '240px',
              objectFit: 'contain',
              display: 'block',
              transition: 'transform 0.2s ease',
            }} 
            className="navbar-logo-img"
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '2.0rem',
          }}
          className="desktop-nav"
        >
          <button
            onClick={() => handleScrollTo('capabilities')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Features
          </button>

          <button
            onClick={() => handleScrollTo('how-it-works')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            How It Works
          </button>

          <button
            onClick={() => handleScrollTo('science')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Scientific Approach
          </button>

          <button
            onClick={onOpenDocs}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Documentation
          </button>
        </nav>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onLaunchSimulator}
            className="btn-primary"
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: '#fff',
              cursor: 'pointer',
            }}
            className="mobile-toggle"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            padding: '1.25rem 1.75rem 1.75rem',
            background: 'rgba(12, 8, 27, 0.98)',
            borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.0rem',
          }}
        >
          <button
            onClick={() => handleScrollTo('capabilities')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '0.92rem',
              fontWeight: 600,
              padding: '0.5rem 0',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <Layers size={16} color="#c084fc" />
            <span>Features & Labs</span>
          </button>

          <button
            onClick={() => handleScrollTo('how-it-works')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '0.92rem',
              fontWeight: 600,
              padding: '0.5rem 0',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <Cpu size={16} color="#38bdf8" />
            <span>How It Works</span>
          </button>

          <button
            onClick={() => handleScrollTo('science')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '0.92rem',
              fontWeight: 600,
              padding: '0.5rem 0',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <ShieldCheck size={16} color="#10b981" />
            <span>Scientific Approach</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenDocs();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '0.92rem',
              fontWeight: 600,
              padding: '0.5rem 0',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <BookOpen size={16} color="#f59e0b" />
            <span>Documentation</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLaunchSimulator();
            }}
            className="btn-primary"
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            Launch Simulator
          </button>
        </div>
      )}

      {/* Responsive CSS via style block */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .navbar-logo-img {
            height: 32px !important;
            max-width: 155px !important;
          }
        }
      `}</style>
    </header>
  );
};
