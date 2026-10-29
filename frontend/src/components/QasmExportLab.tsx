import React, { useState, useEffect } from 'react';
import {
  Binary,
  Copy,
  Check,
  Download,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Code2
} from 'lucide-react';
import { fetchSupportedCircuits, exportQasm } from '../api';
import type { QasmCircuitOption, QasmExportResponse } from '../types';

export const QasmExportLab: React.FC = () => {
  const [circuits, setCircuits] = useState<QasmCircuitOption[]>([]);
  const [selectedCircuit, setSelectedCircuit] = useState<string>('teleportation');

  // Dynamic parameters
  const [theta, setTheta] = useState<number>(1.570796);
  const [phi, setPhi] = useState<number>(0.0);
  const [wernerW, setWernerW] = useState<number>(0.80);
  const [idealized, setIdealized] = useState<boolean>(true);

  // Exported state
  const [exportData, setExportData] = useState<QasmExportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchSupportedCircuits()
      .then((data) => {
        setCircuits(data.supported_circuits);
        if (data.supported_circuits.length > 0) {
          setSelectedCircuit(data.supported_circuits[0].id);
        }
      })
      .catch((err) => console.error('Failed to load supported circuits', err));
  }, []);

  const handleExport = async (circuitType = selectedCircuit, useIdealized = idealized) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await exportQasm({
        circuit_type: circuitType,
        theta,
        phi,
        werner_w: wernerW,
        idealized: useIdealized,
      });
      setExportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to export OpenQASM 3.0');
      setExportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleExport(selectedCircuit, idealized);
  }, [selectedCircuit, theta, phi, wernerW, idealized]);

  const handleCopy = () => {
    if (!exportData?.qasm) return;
    navigator.clipboard.writeText(exportData.qasm);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!exportData?.qasm) return;
    const blob = new Blob([exportData.qasm], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportData.circuit_type}_circuit.qasm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Binary size={18} color="var(--text-primary)" />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            OpenQASM 3.0 Circuit Export
          </h1>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--color-success)' }}>
            Qiskit 1.4 Native Synthesizer
          </span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
          Directly compile and export verified multi-qubit repeater circuits to standardized OpenQASM 3.0 for hardware execution.
        </p>
      </div>

      {/* Main Grid: Controls on Left, Code Viewer on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Left Column: Circuit Selection & Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.0rem' }}>
          <div className="glass-panel" style={{ padding: '1.15rem' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Cpu size={16} color="var(--color-success)" />
              Target Quantum Circuit
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.0rem' }}>
              {circuits.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCircuit(c.id)}
                  style={{
                    textAlign: 'left',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    border: selectedCircuit === c.id ? '1px solid var(--color-success)' : '1px solid var(--border-subtle)',
                    background: selectedCircuit === c.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: selectedCircuit === c.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.76rem',
                    fontWeight: selectedCircuit === c.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Werner note for protocol-only exports */}
            {selectedCircuit !== 'purification_experiment' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.45rem',
                  marginBottom: '0.9rem',
                  padding: '0.55rem 0.65rem',
                  border: '1px solid var(--border-faint)',
                  borderRadius: '6px',
                  background: 'var(--surface-inset)',
                  fontSize: '0.68rem',
                  lineHeight: 1.45,
                  color: 'var(--text-secondary)',
                }}
              >
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                <span>
                  This export is the ideal protocol unitary, so it has no link-Werner input. Set
                  <b> w </b> on the <b>Purification Experiment</b> circuit or in the Network Lab to model
                  noisy links.
                </span>
              </div>
            )}

            {/* Contextual Parameters */}
            {selectedCircuit === 'teleportation' && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Input State Angles:
                </div>
                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    <span>Polar θ (rad):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}>{theta.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.PI}
                    step="0.05"
                    value={theta}
                    onChange={(e) => setTheta(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-info)' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    <span>Azimuth φ (rad):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)' }}>{phi.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={2 * Math.PI}
                    step="0.05"
                    value={phi}
                    onChange={(e) => setPhi(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-violet)' }}
                  />
                </div>
              </div>
            )}

            {selectedCircuit === 'purification_experiment' && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  <span>Input Werner w:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-warning)' }}>{wernerW.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={wernerW}
                  onChange={(e) => setWernerW(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-warning)' }}
                />

                <div style={{ marginTop: '0.65rem', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.55rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={idealized}
                      onChange={(e) => setIdealized(e.target.checked)}
                      style={{ accentColor: 'var(--color-success)' }}
                    />
                    <span>Idealized Unitary Export (Omit Kraus noise)</span>
                  </label>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-dim)', marginTop: '3px', lineHeight: 1.35 }}>
                    OpenQASM 3 supports only unitary gates & measurements. Disabling this demonstrates the non-unitary Kraus error guardrail.
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => handleExport(selectedCircuit)}
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '1.0rem', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Code2 size={16} />}
              <span>Recompile Circuit</span>
            </button>
          </div>

          {/* Test Error Handling Section */}
          <div className="glass-panel" style={{ padding: '0.85rem', border: '1px dashed var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
              Robustness audit · intentionally requests an unsupported circuit
            </div>
            <button
              onClick={() => handleExport('unsupported_exotic_circuit')}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.4rem 0.6rem',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                cursor: 'pointer',
              }}
            >
              Run guardrail test
            </button>
          </div>
        </div>

        {/* Right Column: Code Viewer & Validation Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.0rem' }}>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '0.85rem', color: 'var(--color-danger)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="var(--color-danger)" />
                <span>{error}</span>
              </div>
              <button onClick={() => handleExport('teleportation')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', textDecoration: 'underline', fontSize: '0.74rem', cursor: 'pointer' }}>
                Restore Valid Circuit
              </button>
            </div>
          )}

          {exportData && (
            <>
              {/* Idealized Kraus Channel Disclosure Banner */}
              {exportData.is_idealized && (
                <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--color-warning)', fontSize: '0.76rem', display: 'flex', gap: '0.65rem' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                      Notice: Idealized Unitary Circuit Architecture (Non-Unitary Noise Disclosure)
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {exportData.omitted_channel_notes}
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics Header Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div className="glass-panel" style={{ padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Qubit Register</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>
                    {exportData.qubit_count} Qubits
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    {exportData.classical_bit_count} Classical Bits
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Circuit Depth</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)' }}>
                    {exportData.depth}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    Layered operations
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Gate Operations</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                    {Object.values(exportData.gate_count).reduce((a, b) => a + b, 0)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    {Object.entries(exportData.gate_count).map(([k, v]) => `${k}:${v}`).join(' ')}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-success)' }}>Standard Compliance</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={16} />
                    Valid OpenQASM 3
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    Syntax validated
                  </div>
                </div>
              </div>

              {/* Code Panel with Copy & Download */}
              <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div style={{ background: 'var(--surface-inset)', borderBottom: '1px solid var(--border-subtle)', padding: '0.6rem 1.0rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
                    <span>{exportData.circuit_name}.qasm</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <button
                      onClick={handleCopy}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: copied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: copied ? '1px solid var(--color-success)' : '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.35rem 0.75rem',
                        color: copied ? 'var(--color-success)' : 'var(--text-primary)',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'Copied!' : 'Copy QASM'}</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'var(--gradient-success)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.35rem 0.85rem',
                        color: '#fff',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Download size={14} />
                      <span>Download .qasm</span>
                    </button>
                  </div>
                </div>

                {/* Monospace Code Body */}
                <pre
                  className="qr-dark-surface"
                  style={{
                    margin: 0,
                    padding: '1.25rem',
                    background: 'rgba(5, 5, 10, 0.95)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    maxHeight: '450px',
                    overflowY: 'auto',
                    whiteSpace: 'pre',
                  }}
                >
                  <code>{exportData.qasm}</code>
                </pre>
              </div>

              {/* Validation Notes List */}
              <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem 1.0rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Verification Audit Log:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.5 }}>
                  {exportData.validation_notes.map((n, idx) => (
                    <li key={idx}>{n}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default QasmExportLab;
