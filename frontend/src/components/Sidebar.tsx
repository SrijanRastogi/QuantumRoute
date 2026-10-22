import React from 'react';
import { 
  Network, 
  FlaskConical, 
  Activity, 
  Radio, 
  Binary, 
  CheckCircle, 
  BookOpen,
  Lock
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  status: 'active' | 'coming_soon';
  milestone: string;
  description: string;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLockedFeatureClick?: (item: NavItem) => void;
}

export const NAV_ITEMS: NavItem[] = [
  { 
    id: 'network', 
    label: 'Network Lab', 
    icon: Network, 
    status: 'active', 
    milestone: 'M1 Active',
    description: 'Interactive topology builder, multi-strategy routing, and 2N-qubit circuit simulation.'
  },
  { 
    id: 'experiments', 
    label: 'Experiments', 
    icon: FlaskConical, 
    status: 'active', 
    milestone: 'M2 Active',
    description: 'Quantum state teleportation (|ψ⟩), BSM step-through, and depolarizing noise experiments.'
  },
  { 
    id: 'analysis', 
    label: 'State Analysis', 
    icon: Activity, 
    status: 'coming_soon', 
    milestone: 'Milestone 3',
    description: 'Interactive 3D Bloch sphere, density matrix state tomography, and purity tracking.'
  },
  { 
    id: 'channels', 
    label: 'Channels', 
    icon: Radio, 
    status: 'coming_soon', 
    milestone: 'Milestone 3',
    description: 'Physical optical fiber attenuation, memory decoherence, and BBPSSW purification.'
  },
  { 
    id: 'qasm', 
    label: 'QASM Export', 
    icon: Binary, 
    status: 'coming_soon', 
    milestone: 'Milestone 4',
    description: 'Export compiled Qiskit circuits directly to standard OpenQASM 3.0.'
  },
  { 
    id: 'validation', 
    label: 'Validation', 
    icon: CheckCircle, 
    status: 'coming_soon', 
    milestone: 'Milestone 4',
    description: 'Analytical vs Qiskit Aer finite-shot statistical convergence tests.'
  },
  { 
    id: 'docs', 
    label: 'Documentation', 
    icon: BookOpen, 
    status: 'coming_soon', 
    milestone: 'Milestone 4',
    description: 'Mathematical invariants, API documentation, and architecture decision records.'
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange,
  onLockedFeatureClick 
}) => {
  return (
    <aside 
      className="glass-panel" 
      style={{ 
        width: '230px', 
        padding: '1.25rem 0.75rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.35rem',
        height: 'calc(100vh - 120px)',
        position: 'sticky',
        top: '1rem',
      }}
    >
      <div 
        style={{ 
          fontSize: '0.72rem', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em', 
          color: 'var(--text-muted)',
          padding: '0.4rem 0.75rem 0.5rem 0.75rem',
        }}
      >
        Workspace Modules
      </div>

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isComingSoon = item.status === 'coming_soon';

        return (
          <button
            key={item.id}
            onClick={() => {
              if (isComingSoon) {
                if (onLockedFeatureClick) onLockedFeatureClick(item);
              } else {
                onTabChange(item.id);
              }
            }}
            title={isComingSoon ? `${item.label} — Scheduled for ${item.milestone}` : item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.65rem 0.75rem',
              borderRadius: '9px',
              border: isActive ? '1px solid rgba(192, 38, 211, 0.4)' : '1px solid transparent',
              background: isActive 
                ? 'linear-gradient(90deg, rgba(147, 51, 234, 0.3) 0%, rgba(192, 38, 211, 0.15) 100%)' 
                : 'transparent',
              color: isActive ? '#fff' : isComingSoon ? 'rgba(255, 255, 255, 0.5)' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              fontFamily: 'var(--font-sans)',
              opacity: isComingSoon ? 0.75 : 1.0,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Icon 
                size={17} 
                color={isActive ? 'var(--accent-fuchsia)' : isComingSoon ? 'var(--text-dim)' : 'var(--text-muted)'} 
              />
              <span>{item.label}</span>
            </div>

            {isComingSoon ? (
              <span 
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  padding: '0.12rem 0.4rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <Lock size={9} />
                {item.milestone.replace('Milestone ', 'M')}
              </span>
            ) : (
              <span 
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
            )}
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Active Engine</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-white)' }}>Qiskit Aer 0.18.0</div>
        <div style={{ fontSize: '0.68rem', color: '#10b981', marginTop: '0.15rem' }}>● Coherent Swapping</div>
      </div>
    </aside>
  );
};

export default Sidebar;
