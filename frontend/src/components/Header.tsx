import React from 'react';
import { Home, ChevronDown } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';

interface HeaderProps {
  currentView?: 'home' | 'lab';
  onViewChange: (view: 'home' | 'lab') => void;
  selectedPreset: string;
  presets: string[];
  onPresetChange: (preset: string) => void;
  onNavigateTab?: (tab: string) => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onViewChange,
  selectedPreset,
  presets,
  onPresetChange,
  onNavigateTab,
}) => {
  return (
    <header className="glass-panel" style={{ padding: '0.75rem 1.5rem', marginBottom: '1.25rem', position: 'relative', zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>

        {/* Brand & Clean Home Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            onClick={() => onViewChange('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="QuantumRoute™ — Return to Public Landing Page"
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(192, 38, 211, 0.65))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none';
            }}
          >
            <img
              src="/assets/quantumroute-logo.png"
              alt="QuantumRoute™ Quantum Network Simulator"
              style={{
                height: '40px',
                width: 'auto',
                maxWidth: '190px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          {/* Unobtrusive Return Home Link */}
          <button
            onClick={() => onViewChange('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.35rem 0.75rem',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
              e.currentTarget.style.background = 'rgba(147, 51, 234, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
            title="Return to Public Landing Page"
          >
            <Home size={13} color="#c084fc" />
            <span>Home</span>
          </button>
        </div>

        {/* Center: Functional Global Search (Ctrl+K) */}
        <GlobalSearch onNavigate={(tab) => onNavigateTab ? onNavigateTab(tab) : null} />

        {/* Right Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>

          {/* Simulation Ready Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }}
            />
            Simulation Ready
          </div>

          {/* Sample Network Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedPreset}
              onChange={(e) => onPresetChange(e.target.value)}
              style={{
                background: 'rgba(20, 13, 40, 0.85)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.45rem 2.0rem 0.45rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
              }}
            >
              {presets.map((p) => (
                <option key={p} value={p} style={{ background: '#130b24', color: '#fff' }}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}
            />
          </div>

          {/* Team Avatar Badge */}
          <div
            title="Quantum D Clan · VTU-QFF-HC-0126"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.82rem',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
              cursor: 'pointer',
            }}
          >
            QD
          </div>

        </div>

      </div>
    </header>
  );
};
