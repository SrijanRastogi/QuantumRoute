import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  RefreshCw, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  Loader2, 
  Layers 
} from 'lucide-react';
import { fetchValidationBenchmarks, runCustomValidation } from '../api';
import type { BenchmarkSuiteResponse, ValidationBenchmarkItem } from '../types';

export const ValidationLab: React.FC = () => {
  const [tolerance, setTolerance] = useState<number>(1e-4);
  const [suiteData, setSuiteData] = useState<BenchmarkSuiteResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Custom validation test state
  const [customPathName, setCustomPathName] = useState<string>('Custom 3-Hop Route');
  const [customWeights, setCustomWeights] = useState<string>('0.92, 0.88, 0.85');
  const [customResult, setCustomResult] = useState<ValidationBenchmarkItem | null>(null);
  const [customLoading, setCustomLoading] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const loadBenchmarks = async (tol = tolerance) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchValidationBenchmarks(tol);
      setSuiteData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load validation benchmarks');
      setSuiteData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBenchmarks(tolerance);
  }, [tolerance]);

  const handleCustomValidate = async () => {
    setCustomLoading(true);
    setCustomError(null);
    try {
      const weights = customWeights
        .split(',')
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n));

      if (weights.length === 0) {
        throw new Error('Please enter at least one valid Werner parameter.');
      }

      const res = await runCustomValidation({
        path_name: customPathName,
        link_werner_parameters: weights,
        tolerance,
      });
      setCustomResult(res);
    } catch (err: any) {
      setCustomError(err.message || 'Custom validation failed');
      setCustomResult(null);
    } finally {
      setCustomLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                Analytical vs. Simulation Validation Suite
              </h1>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa' }}>
                Continuous Invariant Verification (QR-006)
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Rigorous precision benchmarks comparing theoretical Werner path models against exact 2N-qubit density matrix circuit evolution.
            </p>
          </div>

          <button
            onClick={() => loadBenchmarks(tolerance)}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.5rem 0.95rem',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Re-run Suite</span>
          </button>
        </div>
      </div>

      {/* Suite Status Summary Banner */}
      {suiteData && (
        <div 
          style={{ 
            background: suiteData.overall_status === 'ALL_PASSED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: suiteData.overall_status === 'ALL_PASSED' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            padding: '1.0rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.0rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {suiteData.overall_status === 'ALL_PASSED' ? (
              <CheckCircle2 size={24} color="#34d399" />
            ) : (
              <XCircle size={24} color="#f87171" />
            )}
            <div>
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: suiteData.overall_status === 'ALL_PASSED' ? '#34d399' : '#f87171' }}>
                {suiteData.overall_status === 'ALL_PASSED' ? 'All Mathematical Validation Tests Passed' : 'Discrepancy Detected in Benchmark Suite'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {suiteData.passed_tests} of {suiteData.total_tests} test cases strictly satisfy error residual tolerance |Δ| ≤ {suiteData.tolerance.toExponential(1)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Maximum Observed |Δ|</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {suiteData.max_observed_residual.toExponential(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Configured Tolerance (ε)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                {suiteData.tolerance.toExponential(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '0.85rem', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1.0rem' }}>
          {error}
        </div>
      )}

      {/* Tolerance Configurator Card */}
      <div className="glass-panel" style={{ padding: '0.85rem 1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={16} color="var(--accent-fuchsia)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Residual Tolerance Threshold (ε):</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>
            {tolerance.toExponential(1)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem' }}>
          {[1e-6, 1e-4, 1e-3, 1e-2].map((t) => (
            <button
              key={t}
              onClick={() => setTolerance(t)}
              style={{
                background: tolerance === t ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: tolerance === t ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '3px 9px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: tolerance === t ? '#38bdf8' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              10^{Math.round(Math.log10(t))}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      {suiteData && (
        <div className="glass-panel" style={{ padding: '1.15rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
            <Layers size={16} color="#38bdf8" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Multi-Hop Werner Entanglement Swapping Benchmarks
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Benchmark Test</th>
                <th style={{ padding: '0.5rem' }}>Hops</th>
                <th style={{ padding: '0.5rem' }}>Link Parameters (w_e)</th>
                <th style={{ padding: '0.5rem' }}>Analytical F_bell</th>
                <th style={{ padding: '0.5rem' }}>Qiskit Sim F_bell</th>
                <th style={{ padding: '0.5rem' }}>Residual |Δ|</th>
                <th style={{ padding: '0.5rem' }}>Classical Limit</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {suiteData.benchmarks.map((bm) => (
                <tr key={bm.test_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '0.65rem 0.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{bm.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{bm.description}</div>
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    {bm.hop_count}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
                    [{bm.link_werner_parameters.map((w) => w.toFixed(2)).join(', ')}]
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>
                    {bm.f_bell_predicted.toFixed(6)}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'var(--font-mono)', color: '#c084fc' }}>
                    {bm.f_bell_simulated.toFixed(6)}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'var(--font-mono)', color: bm.is_valid ? '#34d399' : '#f87171', fontWeight: 700 }}>
                    {bm.bell_delta.toExponential(2)}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem' }}>
                    {bm.beats_classical ? (
                      <span style={{ color: '#34d399', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        &gt; 2/3 Quantum
                      </span>
                    ) : (
                      <span style={{ color: '#f59e0b', fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Classical Bound
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                    <span 
                      style={{ 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.68rem', 
                        fontWeight: 700,
                        background: bm.is_valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: bm.is_valid ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                        color: bm.is_valid ? '#34d399' : '#f87171'
                      }}
                    >
                      {bm.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactive Custom Route Validation */}
      <div className="glass-panel" style={{ padding: '1.15rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
          <Cpu size={16} color="var(--accent-fuchsia)" />
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Interactive Custom Route Validator
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.75rem', alignItems: 'end', marginBottom: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
              Route Label
            </label>
            <input
              type="text"
              value={customPathName}
              onChange={(e) => setCustomPathName(e.target.value)}
              className="custom-input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.76rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
              Hop Werner Parameters (comma-separated, w_e ∈ [0, 1])
            </label>
            <input
              type="text"
              value={customWeights}
              onChange={(e) => setCustomWeights(e.target.value)}
              placeholder="e.g. 0.95, 0.90, 0.85"
              className="custom-input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <button
            onClick={handleCustomValidate}
            disabled={customLoading}
            className="btn-primary"
            style={{ padding: '0.45rem 1.0rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {customLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>Validate Route</span>
          </button>
        </div>

        {customError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#fca5a5', fontSize: '0.74rem' }}>
            {customError}
          </div>
        )}

        {customResult && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem', marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.82rem' }}>
                {customResult.name} ({customResult.hop_count} hops · {customResult.circuit_qubits} qubits)
              </span>
              <span style={{ color: customResult.is_valid ? '#34d399' : '#f87171', fontWeight: 700, fontSize: '0.74rem' }}>
                {customResult.status} (Residual: {customResult.bell_delta.toExponential(2)})
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.72rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>w_path: </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{customResult.w_analytical.toFixed(4)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Analytical Fe: </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>{customResult.f_bell_predicted.toFixed(6)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Simulated Fe: </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#c084fc' }}>{customResult.f_bell_simulated.toFixed(6)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>F_tel,avg: </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>{customResult.f_tel_simulated.toFixed(4)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scientific Invariants & Assumptions */}
      {suiteData && (
        <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '0.85rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>
            <ShieldCheck size={16} />
            Verified Scientific Assumptions (PLAN.md §5 &amp; §18)
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {suiteData.assumptions.map((asm, i) => (
              <li key={i}>{asm}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValidationLab;
