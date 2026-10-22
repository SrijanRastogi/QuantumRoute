import React from 'react';
import { Atom, Search, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'lab';
  onViewChange: (view: 'home' | 'lab') => void;
  selectedPreset: string;
  presets: string[];
  onPresetChange: (preset: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  selectedPreset,
  presets,
  onPresetChange,
}) => {
  return (
    <header className="glass-panel" style={{ padding: '0.75rem 1.5rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div 
            onClick={() => onViewChange('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <div 
              style={{
                width: '40px',
                height: '40px',
                background: 'var(--gradient-primary)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 16px rgba(192, 38, 211, 0.45)',
              }}
            >
              <Atom size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                QuantumRoute<span style={{ fontSize: '0.75rem', color: 'var(--accent-fuchsia)', verticalAlign: 'super' }}>™</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Quantum Network Simulator
              </div>
            </div>
          </div>

          {/* Quick Nav Switches */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => onViewChange('lab')}
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: currentView === 'lab' ? 'var(--gradient-primary)' : 'transparent',
                color: currentView === 'lab' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              Network Lab
            </button>
            <button
              onClick={() => onViewChange('home')}
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: currentView === 'home' ? 'var(--gradient-primary)' : 'transparent',
                color: currentView === 'home' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              Overview
            </button>
          </div>
        </div>

        {/* Center Search Pill */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(10, 6, 22, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '24px',
            padding: '0.45rem 1.15rem',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            minWidth: '320px',
          }}
        >
          <Search size={15} color="var(--accent-violet)" />
          <span style={{ flex: 1 }}>Search nodes, topologies, experiments...</span>
          <span 
            style={{ 
              fontSize: '0.7rem', 
              background: 'rgba(255,255,255,0.08)', 
              padding: '0.15rem 0.45rem', 
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)' 
            }}
          >
            Ctrl K
          </span>
        </div>

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
