import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  X,
  Network,
  FlaskConical,
  Activity,
  Radio,
  Sparkles,
  Binary,
  CheckCircle,
  BookOpen,
  CornerDownLeft,
  Sliders,
  Cpu
} from 'lucide-react';

export interface SearchResultItem {
  id: string;
  tabId: string;
  title: string;
  category: 'Module' | 'Protocol' | 'Physics' | 'Action' | 'Documentation';
  description: string;
  keywords: string[];
  icon: any;
  accent: string;
}

export const SEARCH_INDEX: SearchResultItem[] = [
  // 1. Modules
  {
    id: 'mod-network',
    tabId: 'network',
    title: 'Network Lab',
    category: 'Module',
    description: 'Dijkstra quality-aware routing, BFS shortest hop, Pareto trade-offs, and multi-repeater topology builder.',
    keywords: ['network', 'routing', 'dijkstra', 'bfs', 'pareto', 'topology', 'mesh', 'star', 'ring', 'grid', 'repeaters', 'links', 'simulation'],
    icon: Network,
    accent: 'var(--color-info)',
  },
  {
    id: 'mod-experiments',
    tabId: 'experiments',
    title: 'Guided Quantum Experiments',
    category: 'Module',
    description: 'Single-qubit quantum teleportation, interactive 3D Bloch sphere, depolarizing noise channel, and classical bound.',
    keywords: ['experiments', 'teleportation', 'bloch sphere', '3d', 'noise', 'depolarizing', 'cartesian', 'spherical', 'theta', 'phi', 'state preparation'],
    icon: FlaskConical,
    accent: 'var(--accent-magenta)',
  },
  {
    id: 'mod-analysis',
    tabId: 'analysis',
    title: 'State Analysis Lab',
    category: 'Module',
    description: 'Stokes vector linear inversion, finite-shot Pauli tomography (X, Y, Z), density matrix reconstruction, and purity.',
    keywords: ['state analysis', 'tomography', 'density matrix', 'stokes', 'pauli', 'purity', 'hermitian', 'linear inversion', 'aer'],
    icon: Activity,
    accent: 'var(--accent-purple)',
  },
  {
    id: 'mod-channels',
    tabId: 'channels',
    title: 'Physical Channels Lab',
    category: 'Module',
    description: 'Beer-Lambert optical fiber attenuation (0.20 dB/km @ 1550 nm), dark count noise, and yield vs quality trade-offs.',
    keywords: ['channels', 'fiber', 'loss', 'attenuation', 'beer lambert', 'telecom', '1550nm', 'dark count', 'detector', 'yield', 'tradeoff'],
    icon: Radio,
    accent: 'var(--color-success)',
  },
  {
    id: 'mod-purification',
    tabId: 'purification',
    title: 'Entanglement Purification Lab',
    category: 'Module',
    description: 'BBPSSW two-pair recurrence protocol, bilateral CNOT distillation, threshold boundary (F=0.50), and finite-shot Aer trials.',
    keywords: ['purification', 'distillation', 'bbpssw', 'recurrence', 'cnot', 'threshold', 'werner', 'fidelity gain', 'twirling'],
    icon: Sparkles,
    accent: 'var(--accent-violet)',
  },
  {
    id: 'mod-qasm',
    tabId: 'qasm',
    title: 'OpenQASM 3.0 Circuit Export',
    category: 'Module',
    description: 'Synthesize and export verified multi-qubit Qiskit circuits directly to standard OpenQASM 3.0.',
    keywords: ['qasm', 'openqasm', 'export', 'code', 'download', 'circuit', 'swapping', 'teleportation', 'purification', 'ast'],
    icon: Binary,
    accent: 'var(--color-success)',
  },
  {
    id: 'mod-validation',
    tabId: 'validation',
    title: 'Mathematical Validation Suite',
    category: 'Module',
    description: 'Continuous residual tracking comparing analytical Werner calculations against Qiskit Aer simulations to < 10⁻⁶.',
    keywords: ['validation', 'residuals', 'benchmark', 'invariants', 'unit tests', 'numerical', 'tolerance', 'aer verification'],
    icon: CheckCircle,
    accent: 'var(--color-info)',
  },
  {
    id: 'mod-docs',
    tabId: 'docs',
    title: 'Documentation & Architecture',
    category: 'Module',
    description: 'Scientific specifications, Architecture Decision Records (ADR-001 through ADR-005), and REST API directory.',
    keywords: ['docs', 'documentation', 'adr', 'architecture', 'api', 'swagger', 'specifications', 'formulas', 'literature'],
    icon: BookOpen,
    accent: 'var(--color-warning)',
  },

  // 2. Key Actions & Deep Protocols
  {
    id: 'act-dijkstra-routing',
    tabId: 'network',
    title: 'Dijkstra Quality-Aware Pathfinding',
    category: 'Action',
    description: 'Execute optimal multi-hop route finding with link cost c_e = -ln(w_e) maximizing end-to-end entanglement.',
    keywords: ['dijkstra', 'cost', 'routing', 'path', 'quality', 'logarithm', 'optimal'],
    icon: Network,
    accent: 'var(--color-info)',
  },
  {
    id: 'act-edit-links',
    tabId: 'network',
    title: 'Edit Network Link Distance & Werner Quality',
    category: 'Action',
    description: 'Customize individual repeater edge lengths (km) and initial Werner fidelity parameters in real time.',
    keywords: ['edit link', 'distance', 'werner parameter', 'link override', 'fidelity', 'custom edge'],
    icon: Sliders,
    accent: 'var(--color-warning)',
  },
  {
    id: 'act-bloch-sphere',
    tabId: 'experiments',
    title: '3D Bloch Sphere Vector Visualizer',
    category: 'Action',
    description: 'Inspect single-qubit quantum states with dual spherical (θ, φ) and Cartesian (X,Y,Z) interactive controls.',
    keywords: ['bloch sphere', 'qubit', 'polar angle', 'azimuth', 'vector', 'threejs'],
    icon: FlaskConical,
    accent: 'var(--accent-magenta)',
  },
  {
    id: 'act-depol-noise',
    tabId: 'experiments',
    title: 'Depolarizing Noise Channel & Classical Bound',
    category: 'Physics',
    description: 'Simulate Kraus depolarizing channel noise and observe the teleportation fidelity crossing below 2/3.',
    keywords: ['depolarizing noise', 'classical limit', 'kraus', 'threshold', 'noise sweep'],
    icon: Cpu,
    accent: 'var(--color-danger)',
  },
  {
    id: 'act-bbpssw-protocol',
    tabId: 'purification',
    title: 'BBPSSW Bilateral-CNOT Purification Protocol',
    category: 'Protocol',
    description: 'Evaluate two-pair distillation with parity coincidence condition (mA = mB) and measure fidelity gain.',
    keywords: ['bbpssw', 'bilateral cnot', 'parity coincidence', 'purify', 'werner distillation'],
    icon: Sparkles,
    accent: 'var(--accent-violet)',
  },
  {
    id: 'act-fiber-attenuation',
    tabId: 'channels',
    title: 'Fiber Loss & Attenuation Calculations',
    category: 'Physics',
    description: 'Compute photon survival probability η(L) = 10^(-αL/10) over telecom fiber links up to 200 km.',
    keywords: ['fiber loss', 'attenuation', 'beer lambert', 'transmissivity', '1550 nm'],
    icon: Radio,
    accent: 'var(--color-success)',
  },
  {
    id: 'act-aer-tomography',
    tabId: 'analysis',
    title: 'Execute Finite-Shot Aer Tomography',
    category: 'Action',
    description: 'Run 4096-shot Pauli measurement circuit in X, Y, Z bases and reconstruct full density matrix ρ.',
    keywords: ['tomography', 'pauli', 'density matrix', 'aer', 'shots', 'stokes'],
    icon: Activity,
    accent: 'var(--accent-purple)',
  },
  {
    id: 'act-openqasm-download',
    tabId: 'qasm',
    title: 'Export OpenQASM 3.0 Circuit File',
    category: 'Action',
    description: 'Compile verified multi-qubit repeater circuits and download clean .qasm code for hardware runners.',
    keywords: ['download qasm', 'openqasm 3', 'hardware export', 'code file'],
    icon: Binary,
    accent: 'var(--color-success)',
  },
  {
    id: 'act-adr-records',
    tabId: 'docs',
    title: 'Architecture Decision Records (ADR 001 - 005)',
    category: 'Documentation',
    description: 'Review formal decisions on Werner modeling, Dijkstra formulation, Qiskit Aer simulation, and API boundaries.',
    keywords: ['adr', 'architecture decision records', 'decisions', 'governance', 'plan'],
    icon: BookOpen,
    accent: 'var(--color-warning)',
  },
];

interface GlobalSearchProps {
  onNavigate: (tabId: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filter search items
  const filteredResults = query.trim() === ''
    ? SEARCH_INDEX.slice(0, 8) // default suggestions
    : SEARCH_INDEX.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      });

  // Open modal
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(0);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  // Close modal
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  // Select item & navigate
  const handleSelect = useCallback((item: SearchResultItem) => {
    onNavigate(item.tabId);
    handleClose();
  }, [onNavigate, handleClose]);

  // Global Ctrl+K / Cmd+K and Escape keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          handleOpen();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleOpen, handleClose]);

  // Arrow navigation inside results popover
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClose]);

  return (
    <>
      {/* Search Bar Trigger Pill */}
      <div
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'var(--surface-inset)',
          border: '1px solid rgba(147, 51, 234, 0.25)',
          borderRadius: '24px',
          padding: '0.45rem 1.15rem',
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
          minWidth: '280px',
          maxWidth: '360px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
          e.currentTarget.style.background = 'var(--surface-inset)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.25)';
          e.currentTarget.style.background = 'var(--surface-inset)';
        }}
        title="Search modules, protocols, algorithms, or actions (Ctrl + K)"
      >
        <Search size={15} color="var(--accent-violet)" />
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Search modules, routing, noise...
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            padding: '0.15rem 0.45rem',
            borderRadius: '5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}
        >
          Ctrl K
        </span>
      </div>

      {/* Global Command Palette Popover Modal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(4, 2, 10, 0.78)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh',
            paddingLeft: '1rem',
            paddingRight: '1rem',
          }}
        >
          <div
            ref={popoverRef}
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '620px',
              background: 'linear-gradient(180deg, rgba(22, 14, 46, 0.96) 0%, var(--surface-inset) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '16px',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 35px rgba(147, 51, 234, 0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeInScale 0.15s ease-out',
            }}
          >
            {/* Search Input Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1.0rem 1.25rem',
                borderBottom: '1px solid rgba(147, 51, 234, 0.25)',
                background: 'var(--surface-inset)',
              }}
            >
              <Search size={18} color="var(--accent-violet)" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search quantum modules, protocols, physics, or actions..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                  }}
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={handleClose}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div
              style={{
                maxHeight: '380px',
                overflowY: 'auto',
                padding: '0.5rem',
              }}
            >
              {filteredResults.length === 0 ? (
                <div
                  style={{
                    padding: '2.5rem 1.0rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Search size={28} color="rgba(147, 51, 234, 0.4)" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    No results found for "{query}"
                  </div>
                  <div style={{ fontSize: '0.78rem' }}>
                    Try searching for "routing", "Bloch sphere", "purification", "noise", "QASM", or "validation".
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {filteredResults.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === selectedIndex;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          background: isSelected
                            ? 'linear-gradient(90deg, rgba(147, 51, 234, 0.3) 0%, rgba(192, 38, 211, 0.15) 100%)'
                            : 'transparent',
                          border: isSelected ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: `${item.accent}18`,
                            border: `1px solid ${item.accent}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: item.accent,
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={16} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {item.title}
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: `${item.accent}15`,
                                border: `1px solid ${item.accent}30`,
                                color: item.accent,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {item.category}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '0.74rem',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.description}
                          </div>
                        </div>

                        <div
                          style={{
                            opacity: isSelected ? 1 : 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.7rem',
                            color: 'var(--accent-violet)',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          <span>Select</span>
                          <CornerDownLeft size={12} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Popover Footer Shortcuts */}
            <div
              style={{
                borderTop: '1px solid rgba(147, 51, 234, 0.18)',
                padding: '0.6rem 1.0rem',
                background: 'var(--surface-inset)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.0rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <kbd style={{ background: 'var(--surface-2)', padding: '1px 4px', borderRadius: '3px' }}>↑</kbd>
                  <kbd style={{ background: 'var(--surface-2)', padding: '1px 4px', borderRadius: '3px' }}>↓</kbd>
                  Navigate
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <kbd style={{ background: 'var(--surface-2)', padding: '1px 4px', borderRadius: '3px' }}>↵</kbd>
                  Open
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <kbd style={{ background: 'var(--surface-2)', padding: '1px 4px', borderRadius: '3px' }}>esc</kbd>
                  Close
                </span>
              </div>
              <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>QuantumRoute V2 Engine</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
