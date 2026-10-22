import React from 'react';
import { ArrowRight, Network, Route, Cpu, GraduationCap, Sparkles } from 'lucide-react';

interface HeroLandingProps {
  onExplore: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({ onExplore }) => {
  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* Top Hero Section */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '3.5rem 3.0rem', 
          marginBottom: '2.5rem', 
          position: 'relative', 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(22, 13, 44, 0.85) 0%, rgba(13, 7, 26, 0.95) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
        }}
      >
        {/* Ambient Glowing Orb Graphic in Background */}
        <div 
          style={{
            position: 'absolute',
            right: '-40px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(192, 38, 211, 0.35) 0%, rgba(147, 51, 234, 0.15) 50%, transparent 70%)',
            filter: 'blur(35px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '680px', position: 'relative', zIndex: 1 }}>
          
          {/* Pill Badge */}
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(147, 51, 234, 0.18)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#d8b4fe',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              marginBottom: '1.5rem',
            }}
          >
            <Sparkles size={14} color="var(--accent-fuchsia)" />
            Quantum Network Simulator
          </div>

          {/* Headline */}
          <h1 
            style={{ 
              fontSize: '3.2rem', 
              fontWeight: 800, 
              lineHeight: 1.15, 
              color: '#fff', 
              letterSpacing: '-0.03em', 
              marginBottom: '1.25rem' 
            }}
          >
            Explore the Future of{' '}
            <span 
              style={{
                background: 'linear-gradient(135deg, #c026d3 0%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Quantum Communication
            </span>
          </h1>

          {/* Subtitle */}
          <p 
            style={{ 
              fontSize: '1.05rem', 
              lineHeight: 1.6, 
              color: 'var(--text-secondary)', 
              marginBottom: '2.0rem' 
            }}
          >
            Build, simulate, and explore quantum communication networks. Compare routing strategies, 
            study the effect of noise, and understand how quantum information travels — all in one 
            interactive platform.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
            <button 
              onClick={onExplore}
              className="btn-primary"
              style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem' }}
            >
              Explore a Sample Network
              <ArrowRight size={17} />
            </button>
            <button 
              onClick={onExplore}
              className="btn-secondary"
              style={{ padding: '0.8rem 1.4rem', fontSize: '0.95rem' }}
            >
              Build My Network
            </button>
            <button 
              onClick={onExplore}
              className="btn-secondary"
              style={{ padding: '0.8rem 1.4rem', fontSize: '0.95rem' }}
            >
              Run a Quantum Experiment
            </button>
          </div>

        </div>
      </div>

      {/* 4 Feature Pillars matching Reference Image */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Network size={22} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
            Interactive Network Builder
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Create and configure quantum repeater topologies with customizable Werner link qualities.
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(192, 38, 211, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Route size={22} color="var(--accent-fuchsia)" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
            Multiple Routing Strategies
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Compare classical Shortest-Hop (BFS) with Dijkstra Quality-Aware and Pareto Multi-Metric routes.
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Cpu size={22} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
            Realistic Noise Models
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Simulate fiber attenuation, dark counts, and decoherence using verified Qiskit Aer circuits.
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <GraduationCap size={22} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
            Educational & Research
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Simple mode for 13–15 year old learners, plus deep algebraic invariants for quantum researchers.
          </div>
        </div>
      </div>

      {/* Stats Row matching Reference Image */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '1.75rem 2rem', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>5+</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Network Topologies</div>
        </div>
        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-fuchsia)' }}>3</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Routing Algorithms</div>
        </div>
        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>7+</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Quantum Experiments</div>
        </div>
        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a855f7' }}>∞</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Learning Possibilities</div>
        </div>
      </div>

    </div>
  );
};
