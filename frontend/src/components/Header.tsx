import React from 'react';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  currentView?: 'home' | 'lab';
  onViewChange: (view: 'home' | 'lab') => void;
  onNavigateTab?: (tab: string) => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onViewChange,
  onNavigateTab,
  activeTab = 'network',
}) => {
  const openTab = (tab: string) => {
    onNavigateTab?.(tab);
  };

  return (
    <header className="qr-header">
      <div className="qr-progress" aria-hidden="true" />
      <div className="qr-header-inner">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.25rem', minWidth: 0 }}>
          <button
            type="button"
            className="qr-brand"
            onClick={() => onViewChange('home')}
            title="QuantumRoute — return to the landing page"
          >
            <img
              src="/assets/quantumroute-symbol.png"
              alt=""
              className="qr-brand-mark"
              width={30}
              height={30}
            />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="qr-brand-name">QuantumRoute</span>
              <span className="qr-brand-meta">Simulator V2</span>
            </span>
          </button>

          <nav className="qr-nav" aria-label="Primary">
            <button
              type="button"
              className="qr-nav-link"
              aria-current={activeTab === 'network' ? 'page' : undefined}
              onClick={() => openTab('network')}
            >
              Simulator
            </button>
            <button
              type="button"
              className="qr-nav-link"
              onClick={() => openTab('experiments')}
            >
              Experiments
            </button>
            <button
              type="button"
              className="qr-nav-link"
              onClick={() => openTab('docs')}
            >
              Documentation
            </button>
          </nav>
        </div>

        {/* Actions */}
        <div className="qr-header-actions">
          <div className="qr-search-slot">
            <GlobalSearch onNavigate={(tab) => openTab(tab)} />
          </div>

          <div className="qr-status" title="Qiskit Aer engine ready">
            <span className="qr-status-dot" aria-hidden="true" />
            <span>Simulation ready</span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
