import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Reveal } from '../Reveal';

interface FinalCtaSectionProps {
  onLaunchSimulator: () => void;
  onOpenDocs: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onLaunchSimulator,
  onOpenDocs,
}) => {
  return (
    <section
      style={{
        maxWidth: 'var(--page-max)',
        margin: '0 auto',
        padding: '0 var(--page-gutter) clamp(4rem, 8vw, 7rem)',
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(2.5rem, 6vw, 5.5rem) clamp(1.5rem, 4vw, 4rem)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-canvas)',
          textAlign: 'center',
        }}
      >
        <div
          aria-hidden="true"
          className="qr-glow"
          style={{
            width: 620,
            height: 320,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.16,
          }}
        />
        <div className="qr-noise" aria-hidden="true" />

        <Reveal style={{ position: 'relative' }}>
          <span className="qr-eyebrow">Ready when you are</span>

          <h2
            className="qr-section-title"
            style={{ margin: '1.25rem auto 1.1rem', maxWidth: '18ch' }}
          >
            Run your first quantum network.
          </h2>

          <p
            className="qr-lead"
            style={{ maxWidth: '56ch', margin: '0 auto 2.25rem' }}
          >
            Open the workspace to evaluate multi-hop swapping routes, simulate single-qubit
            teleportation, and export compliant OpenQASM 3.0 circuits.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.9rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={onLaunchSimulator}
              className="btn-primary"
              style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}
            >
              Launch simulator
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onOpenDocs}
              className="btn-secondary"
              style={{ padding: '0.8rem 1.35rem', fontSize: '0.9rem' }}
            >
              <BookOpen size={15} aria-hidden="true" />
              Technical documentation
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
