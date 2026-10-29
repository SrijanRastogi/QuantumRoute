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
  Cpu,
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
    description: 'Interactive topology builder, Dijkstra routing, and 2N-qubit circuit simulation.',
  },
  {
    id: 'experiments',
    label: 'Experiments',
    icon: FlaskConical,
    status: 'active',
    milestone: 'M2 Active',
    description: 'Quantum state teleportation (|ψ⟩), 3D Bloch sphere, and depolarizing noise experiments.',
  },
  {
    id: 'analysis',
    label: 'State Analysis',
    icon: Activity,
    status: 'active',
    milestone: 'Active',
    description: 'Stokes vector linear inversion, finite-shot Pauli tomography (X, Y, Z), and purity tracking.',
  },
  {
    id: 'channels',
    label: 'Channels Lab',
    icon: Radio,
    status: 'active',
    milestone: 'M3 Active',
    description: 'Physical optical fiber transmission loss, coupling efficiency, and yield vs quality trade-offs.',
  },
  {
    id: 'purification',
    label: 'Purification Lab',
    icon: Sparkles,
    status: 'active',
    milestone: 'M4 Active',
    description: 'Two-pair BBPSSW recurrence protocol, bilateral CNOT distillation, and finite-shot Aer trials.',
  },
  {
    id: 'qasm',
    label: 'QASM Export',
    icon: Binary,
    status: 'active',
    milestone: 'Active',
    description: 'Compile and export verified Qiskit circuits directly to standard OpenQASM 3.0.',
  },
  {
    id: 'validation',
    label: 'Validation',
    icon: CheckCircle,
    status: 'active',
    milestone: 'Active',
    description: 'Continuous mathematical invariant validation comparing analytical predictions against Aer.',
  },
  {
    id: 'docs',
    label: 'Documentation',
    icon: BookOpen,
    status: 'active',
    milestone: 'Active',
    description: 'Mathematical invariants, ADR architecture decision records, and REST API directory.',
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
  const collapsed = isCollapsed && !isMobileDrawer;

  return (
    <aside className="qr-sidebar" data-collapsed={collapsed} aria-label="Lab navigation">
      <div className="qr-sidebar-head" style={{ justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && <span className="qr-sidebar-title">Modules</span>}
        {!isMobileDrawer && (
          <button
            type="button"
            className="qr-icon-btn"
            style={{ width: 26, height: 26 }}
            onClick={() => setIsCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      <nav
        className="qr-nav-list"
        aria-label="Simulator labs"
        style={{ display: 'flex', gap: '2px', flex: 1 }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isComingSoon = item.status === 'coming_soon';

          return (
            <button
              key={item.id}
              type="button"
              className="qr-nav-item"
              data-active={isActive}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                if (isComingSoon) {
                  onLockedFeatureClick?.(item);
                  return;
                }
                onTabChange(item.id);
                onCloseMobileDrawer?.();
              }}
              title={`${item.label} — ${item.description}`}
              style={{ justifyContent: collapsed ? 'center' : 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon size={17} className="qr-nav-item-icon" aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </span>
              {!collapsed && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: isActive ? 'var(--color-success)' : 'var(--border-light)',
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="qr-engine">
          <div className="qr-card-label" style={{ marginBottom: '0.35rem' }}>
            Active engine
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Qiskit Aer 0.18.0
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '0.3rem',
              fontSize: '0.68rem',
              color: 'var(--color-success)',
            }}
          >
            <Cpu size={11} aria-hidden="true" />
            <span>Coherent swapping</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
