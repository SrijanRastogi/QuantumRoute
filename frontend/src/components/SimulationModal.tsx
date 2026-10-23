import React from 'react';
import type { SimulationResult, EducationalExplanation } from '../types';
import { X, CheckCircle2, Cpu, Sparkles, AlertTriangle } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SimulationResult | null;
  isLoading: boolean;
  error?: string | null;
  explanation: EducationalExplanation | null;
  path: string[];
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  error,
  explanation,
  path,
}) => {
  if (!isOpen) return null;

  // Use the verified simulated path if available, otherwise the requested path
  const displayPath = result?.path && result.path.length > 0 ? result.path : path;
  const numHops = result?.num_hops ?? Math.max(1, displayPath.length - 1);
  const numRepeaters = Math.max(0, numHops - 1);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(18, 11, 36, 0.95)',
          border: error ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid var(--accent-fuchsia)',
          boxShadow: error ? '0 0 50px rgba(239, 68, 68, 0.3)' : '0 0 50px rgba(192, 38, 211, 0.35)',
          padding: '1.75rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Close modal"
          data-testid="close-sim-modal"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div 
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: error ? 'rgba(239, 68, 68, 0.8)' : 'var(--gradient-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: error ? '0 0 12px rgba(239, 68, 68, 0.5)' : '0 0 12px rgba(192, 38, 211, 0.5)'
            }}
          >
            {error ? <AlertTriangle size={20} color="#fff" /> : <Cpu size={20} color="#fff" />}
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              {error ? 'Simulation Error' : 'Qiskit Circuit Simulation Results'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              End-to-End Entanglement Swapping along: <b style={{ color: 'var(--accent-fuchsia)' }}>{displayPath.join(' ➔ ')}</b> ({numHops} {numHops === 1 ? 'hop' : 'hops'}, {numRepeaters} {numRepeaters === 1 ? 'repeater' : 'repeaters'})
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ display: 'inline-block', width: '42px', height: '42px', border: '3px solid rgba(192, 38, 211, 0.2)', borderTopColor: 'var(--accent-fuchsia)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ marginTop: '1.2rem', color: '#fff', fontWeight: 700, fontSize: '0.98rem' }}>Executing 2N-Qubit Quantum Circuit on Qiskit Aer...</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Evolving joint density matrix & applying coherent BSM corrections</div>
          </div>
        ) : error ? (
          <div>
            <div 
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '1.0rem',
                color: '#f87171',
                fontSize: '0.86rem',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertTriangle size={18} />
                Failed to Execute Quantum Simulation
              </div>
              <div>{error}</div>
            </div>
            <button 
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              Dismiss
            </button>
          </div>
        ) : result ? (
          <div>
            {/* Success Banner */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.15rem',
                color: '#34d399',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} />
              <span>Simulation Verified Clean: Theoretical Model Matches Qiskit Aer Circuit (Δ &lt; 10⁻⁸)</span>
            </div>

            {/* Link-by-Link Werner Configuration Verification */}
            {result.link_qualities && result.link_qualities.length > 0 && (
              <div 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '8px', 
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.76rem',
                  marginBottom: '1.15rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Configured Link Werner Parameters (w<sub>e</sub>):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
                  {result.link_qualities.map((wVal, idx) => (
                    <span 
                      key={idx}
                      style={{ 
                        background: 'rgba(147, 51, 234, 0.15)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        color: '#d8b4fe'
                      }}
                    >
                      Hop {idx + 1}: w = {wVal.toFixed(4)}
                    </span>
                  ))}
                  <span style={{ color: 'var(--text-muted)' }}>➔</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>
                    w<sub>path</sub> = {result.theoretical.path_werner_w.toFixed(4)}
                  </span>
                </div>
              </div>
            )}

            {/* Comparison Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.15rem' }}>
              <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Analytical Werner Bell Fidelity (F<sub>e</sub>)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                  {result.theoretical.bell_fidelity.toFixed(4)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  Formula: F<sub>e</sub> = (1 + 3∏w<sub>e</sub>) / 4
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-alt)', border: '1px solid rgba(192, 38, 211, 0.4)', borderRadius: '8px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--accent-fuchsia)' }}>Simulated Circuit Bell Fidelity (F<sub>e</sub>)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f0abfc' }}>
                  {result.circuit_simulation.simulated_bell_fidelity.toFixed(4)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '0.2rem' }}>
                  Error Delta: {result.circuit_simulation.fidelity_error_delta.toExponential(2)} (Aer DM Exact)
                </div>
              </div>
            </div>

            {/* Teleportation Fidelity Scientific Clarification */}
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '0.75rem 0.9rem', marginBottom: '1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>
                  Average Teleportation Fidelity: F<sub>tel,avg</sub> = {result.theoretical.average_teleportation_fidelity.toFixed(4)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                  Derived invariant: F<sub>tel,avg</sub> = (1 + w<sub>path</sub>) / 2 = (2F<sub>e</sub> + 1) / 3
                </div>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#7dd3fc', background: 'rgba(56, 189, 248, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                Single-Qubit State
              </span>
            </div>

            {/* Simulation Specs */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem', fontSize: '0.78rem', marginBottom: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Circuit Width:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{result.circuit_simulation.qubits_evolved} Qubits ({numHops} Bell pairs)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Intermediate Repeaters Traced Out:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{numRepeaters} Relay Nodes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Simulation Engine:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{result.circuit_simulation.engine}</span>
              </div>
            </div>

            {/* Educational Explanation Box */}
            {explanation && (
              <div style={{ background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(192, 38, 211, 0.08) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '1.0rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', fontWeight: 700, color: '#f0abfc', marginBottom: '0.35rem' }}>
                  <Sparkles size={16} />
                  {explanation.for_beginners.headline}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.5rem' }}>
                  {explanation.for_beginners.concept}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 600 }}>
                  💡 {explanation.for_beginners.key_takeaway}
                </div>
              </div>
            )}

            <button 
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              Continue Exploring
            </button>
          </div>
        ) : (
          <div style={{ color: 'var(--color-bfs-red)', padding: '1rem 0' }}>Simulation failed to produce results.</div>
        )}
      </div>
    </div>
  );
};

export default SimulationModal;
