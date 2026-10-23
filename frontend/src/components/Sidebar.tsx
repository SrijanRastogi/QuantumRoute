import React, { useState } from 'react';
import {
  Network,
  FlaskConical,
  Activity,
  Radio,
  Binary,
  CheckCircle,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Cpu
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
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'network',
    label: 'Network Lab',
    icon: Network,
    status: 'active',
    milestone: 'M1 Active',
    description: 'Interactive topology builder, Dijkstra routing, and 2N-qubit circuit simulation.'
  },
  {
    id: 'experiments',
    label: 'Experiments',
    icon: FlaskConical,
    status: 'active',
    milestone: 'M2 Active',
    description: 'Quantum state teleportation (|ψ⟩), 3D Bloch sphere, and depolarizing noise experiments.'
  },
  {
    id: 'analysis',
    label: 'State Analysis',
    icon: Activity,
    status: 'active',
    milestone: 'Active',
    description: 'Stokes vector linear inversion, finite-shot Pauli tomography (X, Y, Z), and purity tracking.'
  },
  {
    id: 'channels',
    label: 'Channels Lab',
    icon: Radio,
    status: 'active',
    milestone: 'M3 Active',
    description: 'Physical optical fiber transmission loss, coupling efficiency, and yield vs quality trade-offs.'
  },
  {
    id: 'purification',
    label: 'Purification Lab',
    icon: Sparkles,
    status: 'active',
    milestone: 'M4 Active',
    description: 'Two-pair BBPSSW recurrence protocol, bilateral CNOT distillation, and finite-shot Aer trials.'
  },
  {
    id: 'qasm',
    label: 'QASM Export',
    icon: Binary,
    status: 'active',
    milestone: 'Active',
    description: 'Compile and export verified Qiskit circuits directly to standard OpenQASM 3.0.'
  },
  {
    id: 'validation',
    label: 'Validation',
    icon: CheckCircle,
    status: 'active',
    milestone: 'Active',
    description: 'Continuous mathematical invariant validation comparing analytical predictions against Aer.'
  },
  {
    id: 'docs',
    label: 'Documentation',
    icon: BookOpen,
    status: 'active',
    milestone: 'Active',
    description: 'Mathematical invariants, ADR architecture decision records, and REST API directory.'
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onLockedFeatureClick,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className="glass-panel"
      style={{
        width: isCollapsed ? '68px' : '230px',
        padding: isCollapsed ? '1.0rem 0.45rem' : '1.25rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        minHeight: 'calc(100vh - 120px)',
        position: isMobileDrawer ? 'relative' : 'sticky',
        top: '1rem',
        transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1), padding 0.2s ease',
        flexShrink: 0,
        zIndex: isMobileDrawer ? 100 : 20,
      }}
    >
      {/* Header with Title & Collapse Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0.25rem 0 0.65rem' : '0.25rem 0.5rem 0.65rem',
          borderBottom: '1px solid rgba(147, 51, 234, 0.15)',
          marginBottom: '0.35rem',
        }}
      >
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <img
              src="/assets/quantumroute-symbol.png"
              alt="QuantumRoute"
              style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain' }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              Modules
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/assets/quantumroute-symbol.png"
              alt="QuantumRoute"
              style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'contain' }}
            />
          </div>
        )}

        {!isMobileDrawer && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '4px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Nav Item Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
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
                  if (onCloseMobileDrawer) onCloseMobileDrawer();
                }
              }}
              title={`${item.label} — ${item.description}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                width: '100%',
                padding: isCollapsed ? '0.65rem 0' : '0.65rem 0.75rem',
                borderRadius: '9px',
                border: isActive ? '1px solid rgba(217, 70, 239, 0.45)' : '1px solid transparent',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(147, 51, 234, 0.35) 0%, rgba(192, 38, 211, 0.18) 100%)'
                  : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                fontFamily: 'var(--font-sans)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Active Indicator Bar on Left Edge */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '15%',
                    height: '70%',
                    width: '3px',
                    borderRadius: '0 3px 3px 0',
                    background: 'var(--accent-fuchsia)',
                    boxShadow: '0 0 8px var(--accent-fuchsia)',
                  }}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  width: isCollapsed ? 'auto' : '100%',
                }}
              >
                <Icon
                  size={18}
                  color={isActive ? '#f0abfc' : 'var(--text-muted)'}
                  style={{ flexShrink: 0 }}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </div>

              {!isCollapsed && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isActive ? '#34d399' : 'rgba(255, 255, 255, 0.2)',
                    boxShadow: isActive ? '0 0 6px #34d399' : 'none',
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Engine Card */}
      <div
        style={{
          marginTop: 'auto',
          padding: isCollapsed ? '0.5rem 0.2rem' : '0.75rem',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          textAlign: isCollapsed ? 'center' : 'left',
        }}
      >
        {isCollapsed ? (
          <div title="Qiskit Aer 0.18.0 Engine Active">
            <Cpu size={16} color="#10b981" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Active Engine</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-white)' }}>Qiskit Aer 0.18.0</div>
            <div style={{ fontSize: '0.68rem', color: '#10b981', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
              <span>Coherent Swapping</span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
