import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Sparkles,
  Layers,
  ShieldCheck,
  Cpu,
  Loader2,
  Info
} from 'lucide-react';
import { MathBlock, MathInline } from './MathView';
import { fetchAnalysisPresets, runStateTomography } from '../api';
import type { AnalysisPreset, TomographyResponse } from '../types';

export const StateAnalysisLab: React.FC = () => {
  const [presets, setPresets] = useState<AnalysisPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('plus');

  // Custom controls
  const [theta, setTheta] = useState<number>(Math.PI / 2);
  const [phi, setPhi] = useState<number>(0.0);
  const [shots, setShots] = useState<number>(2048);
  const [depolarizingP, setDepolarizingP] = useState<number>(0.0);

  // Results
  const [tomoResult, setTomoResult] = useState<TomographyResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Results are only refreshed on an explicit Execute. `stale` tells the user the
  // controls moved after the last run so they know to re-run.
  const [isStale, setIsStale] = useState<boolean>(false);
  const requestIdRef = useRef(0);
  const didInitRef = useRef(false);

  useEffect(() => {
    fetchAnalysisPresets()
      .then((data) => {
        setPresets(data.presets);
      })
      .catch((err) => console.error('Failed to load presets', err));
  }, []);

  const handleRunTomography = async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const data = await runStateTomography({
        preset: selectedPreset,
        theta: selectedPreset === 'custom' ? theta : undefined,
        phi: selectedPreset === 'custom' ? phi : undefined,
        shots,
        depolarizing_p: depolarizingP,
      });
      // Ignore responses that arrive after a newer run was requested.
      if (requestId !== requestIdRef.current) return;
      setTomoResult(data);
      setIsStale(false);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || 'Tomography analysis failed');
      setTomoResult(null);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  // One initial reconstruction on mount only; every later update is explicit.
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    void handleRunTomography();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flag results as stale when the controls no longer match the last run.
  useEffect(() => {
    if (didInitRef.current && tomoResult) setIsStale(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset, theta, phi, shots, depolarizingP]);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="var(--text-primary)" />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Quantum State Tomography &amp; Density Matrix Lab
          </h1>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: 'var(--accent-violet)' }}>
            Finite-Shot Stokes Inversion
          </span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
          Reconstruct single-qubit density matrices via empirical Pauli measurements (X, Y, Z) and quantify shot-noise variance.
        </p>
      </div>

      {/* Main Grid: Controls Left, Results Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Left Column: State Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.0rem' }}>

          <div className="glass-panel" style={{ padding: '1.15rem' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Cpu size={16} color="var(--accent-violet)" />
              Target State Selection
            </div>

            {/* Presets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginBottom: '1.0rem' }}>
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: selectedPreset === p.id ? '1px solid var(--accent-violet)' : '1px solid var(--border-subtle)',
                    background: selectedPreset === p.id ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    color: selectedPreset === p.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.74rem',
                    fontWeight: selectedPreset === p.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Angle Selectors */}
            <div style={{ marginBottom: '1.0rem' }}>
              <button
                onClick={() => setSelectedPreset('custom')}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  borderRadius: '6px',
                  border: selectedPreset === 'custom' ? '1px solid var(--accent-violet)' : '1px dashed var(--border-subtle)',
                  background: selectedPreset === 'custom' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  color: selectedPreset === 'custom' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.74rem',
                  fontWeight: selectedPreset === 'custom' ? 700 : 500,
                  cursor: 'pointer',
                  marginBottom: selectedPreset === 'custom' ? '0.75rem' : '0',
                }}
              >
                Custom Bloch Angles (θ, φ)
              </button>

              {selectedPreset === 'custom' && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div>
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
            </div>

            {/* Shots Slider */}
            <div style={{ marginBottom: '1.0rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Measurement Shots / Basis:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-info)', fontWeight: 700 }}>{shots}</span>
              </div>
              <input
                type="range"
                min="128"
                max="8192"
                step="128"
                value={shots}
                onChange={(e) => setShots(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--color-info)' }}
              />
              <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Statistical shot noise scales as O(1/√N) ≈ ±{(1 / Math.sqrt(shots)).toFixed(3)}
              </div>
            </div>

            {/* Depolarizing Noise Slider */}
            <div style={{ marginBottom: '1.0rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Depolarizing Noise (p):</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-danger)', fontWeight: 700 }}>
                  {(depolarizingP * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={depolarizingP}
                onChange={(e) => setDepolarizingP(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-danger)' }}
              />
              <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                {depolarizingP === 0 ? 'Ideal pure state' : `Bloch vector shrinks to ||r|| = ${(1 - depolarizingP).toFixed(2)}`}
              </div>
            </div>

            <button
              onClick={handleRunTomography}
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>Execute Aer Tomography</span>
            </button>

            {isStale && !isLoading && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Info size={12} />
                Parameters changed — run again to refresh the results.
              </div>
            )}
          </div>

          {/* Theory Reference Card */}
          <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '8px', padding: '0.85rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-violet)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} />
              Stokes Inversion Identity
            </div>
            <MathBlock math={`\\rho = \\frac{1}{2}\\left(I + r_x \\sigma_x + r_y \\sigma_y + r_z \\sigma_z\\right)`} style={{ margin: '0.25rem 0 0', padding: 0, textAlign: 'left' }} />
            <div style={{ marginTop: '0.35rem', color: 'var(--text-dim)' }}>
              Eigenvalue physical projection ensures positive semi-definiteness if statistical shot fluctuation momentarily yields ||r|| &gt; 1.
            </div>
          </div>

        </div>

        {/* Right Column: Reconstructed Bloch Vector & Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.0rem' }}>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', borderRadius: '8px', padding: '0.85rem', color: 'var(--color-danger)', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          {tomoResult && (
            <>
              {/* Primary Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Target State Fidelity</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                    {tomoResult.fidelity_with_target.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    Overlap with ideal |ψ⟩
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>State Purity (γ = Tr(ρ²))</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>
                    {tomoResult.purity.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    {tomoResult.purity > 0.98 ? 'Pure state' : 'Mixed state'}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Bloch Radius (||r||)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)' }}>
                    {tomoResult.bloch_radius.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    Physical ball ≤ 1.0
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Experiment Shots</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
                    {tomoResult.shots * 3}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    {tomoResult.shots} per basis (X, Y, Z)
                  </div>
                </div>
              </div>

              {/* Reconstructed Bloch Coordinates Breakdown */}
              <div className="glass-panel" style={{ padding: '1.15rem' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Activity size={16} color="var(--color-info)" />
                  Pauli Expectation Values (Empirical Stokes Vector)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {/* r_x */}
                  <div style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><MathInline math={`\\langle\\sigma_x\\rangle`} /> (Pauli X)</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Theory: {tomoResult.theoretical_rx.toFixed(3)}</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'var(--font-mono)', margin: '0.25rem 0' }}>
                      {tomoResult.rx.toFixed(4)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                      ± {tomoResult.std_err_x.toFixed(4)} std error
                    </div>
                  </div>

                  {/* r_y */}
                  <div style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><MathInline math={`\\langle\\sigma_y\\rangle`} /> (Pauli Y)</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Theory: {tomoResult.theoretical_ry.toFixed(3)}</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)', margin: '0.25rem 0' }}>
                      {tomoResult.ry.toFixed(4)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                      ± {tomoResult.std_err_y.toFixed(4)} std error
                    </div>
                  </div>

                  {/* r_z */}
                  <div style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><MathInline math={`\\langle\\sigma_z\\rangle`} /> (Pauli Z)</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Theory: {tomoResult.theoretical_rz.toFixed(3)}</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-mono)', margin: '0.25rem 0' }}>
                      {tomoResult.rz.toFixed(4)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                      ± {tomoResult.std_err_z.toFixed(4)} std error
                    </div>
                  </div>
                </div>
              </div>

              {/* Reconstructed 2x2 Density Matrix Display */}
              <div className="glass-panel" style={{ padding: '1.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Layers size={16} color="var(--accent-fuchsia)" />
                    Reconstructed Density Matrix (<MathInline math={`\\rho_{\\text{recon}}`} />)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <MathInline math={`\\rho = \\frac{1}{2}\\left(I_2 + r_x \\sigma_x + r_y \\sigma_y + r_z \\sigma_z\\right)`} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.0rem' }}>
                  <div className="qr-dark-surface" style={{ background: 'rgba(5, 5, 10, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-info)', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Real Part <MathInline math={`\\text{Re}[\\rho]`} />:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <MathBlock math={`\\text{Re}[\\rho] = \\begin{pmatrix} ${tomoResult.density_matrix_real[0][0].toFixed(4)} & ${tomoResult.density_matrix_real[0][1].toFixed(4)} \\\\[6pt] ${tomoResult.density_matrix_real[1][0].toFixed(4)} & ${tomoResult.density_matrix_real[1][1].toFixed(4)} \\end{pmatrix}`} />
                    </div>
                  </div>

                  <div className="qr-dark-surface" style={{ background: 'rgba(5, 5, 10, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--accent-violet)', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Imaginary Part <MathInline math={`\\text{Im}[\\rho]`} />:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <MathBlock math={`\\text{Im}[\\rho] = \\begin{pmatrix} ${tomoResult.density_matrix_imag[0][0].toFixed(4)}i & ${tomoResult.density_matrix_imag[0][1].toFixed(4)}i \\\\[6pt] ${tomoResult.density_matrix_imag[1][0].toFixed(4)}i & ${tomoResult.density_matrix_imag[1][1].toFixed(4)}i \\end{pmatrix}`} />
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default StateAnalysisLab;
