import React from 'react';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';

interface FinalCtaSectionProps {
  onLaunchSimulator: () => void;
  onOpenDocs: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onLaunchSimulator,
  onOpenDocs,
}) => {
  return (
    <section style={{ padding: '4.0rem 1.75rem 6.0rem', maxWidth: '1280px', margin: '0 auto' }}>
      <div
        className="glass-panel"
        style={{
          padding: '4.5rem 2.5rem',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(28, 16, 56, 0.95) 0%, rgba(13, 8, 28, 0.98) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(147, 51, 234, 0.25)',
        }}
      >
        {/* Layered Background Glows */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(192, 38, 211, 0.25) 0%, rgba(147, 51, 234, 0.12) 50%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px', margin: '0 auto' }}>
          {/* Status Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(192, 38, 211, 0.18)',
              border: '1px solid rgba(217, 70, 239, 0.45)',
              color: '#f0abfc',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.35rem 0.95rem',
              borderRadius: '20px',
              marginBottom: '1.5rem',
              letterSpacing: '0.03em',
            }}
          >
            <Sparkles size={14} color="#f0abfc" />
            Ready for Live Exploration
          </div>

          {/* Headline */}
          <h2
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}
          >
            Your next quantum network experiment starts here.
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
              maxWidth: '620px',
              margin: '0 auto 2.5rem',
            }}
          >
            Launch the interactive workspace to evaluate multi-hop entanglement swapping routes, simulate single-qubit teleportation, and export compliant OpenQASM 3.0 circuits.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.0rem', flexWrap: 'wrap' }}>
            <button
              onClick={onLaunchSimulator}
              className="btn-primary"
              style={{
                padding: '0.85rem 1.85rem',
                fontSize: '0.98rem',
                fontWeight: 800,
                borderRadius: '12px',
                boxShadow: '0 0 30px rgba(192, 38, 211, 0.55)',
              }}
            >
              <span>Launch Simulator</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={onOpenDocs}
              className="btn-secondary"
              style={{
                padding: '0.85rem 1.65rem',
                fontSize: '0.95rem',
                borderRadius: '12px',
              }}
            >
              <BookOpen size={16} />
              <span>Technical Documentation</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
