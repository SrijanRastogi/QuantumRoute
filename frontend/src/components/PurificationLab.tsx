import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  Activity,
  Layers,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
  Zap,
  Play,
} from 'lucide-react';
import {
  fetchPurificationDefaults,
  evaluatePurification,
  fetchPurificationSweep,
  simulatePurificationShots,
} from '../api';
import type {
  PurificationDefaults,
  PurificationEvaluateResponse,
  PurificationSweepResponse,
  PurificationShotsResponse,
} from '../types';

export const PurificationLab: React.FC = () => {
  // Navigation / Mode Switcher: 'analytical' | 'shots'
  const [labMode, setLabMode] = useState<'analytical' | 'shots'>('analytical');

  // Defaults & Config
  const [defaults, setDefaults] = useState<PurificationDefaults | null>(null);

  // Input Parameters
  const [wernerW, setWernerW] = useState<number>(0.80);
  const [applyTwirling, setApplyTwirling] = useState<boolean>(true);

  // Analytical Evaluation Result
  const [evalResult, setEvalResult] = useState<PurificationEvaluateResponse | null>(null);
  const [isLoadingEval, setIsLoadingEval] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Parametric Recurrence Sweep
  const [sweepResult, setSweepResult] = useState<PurificationSweepResponse | null>(null);

  // Finite-Shot Experiment State
  const [shotCount, setShotCount] = useState<number>(4096);
  const [shotResult, setShotResult] = useState<PurificationShotsResponse | null>(null);
  const [isLoadingShots, setIsLoadingShots] = useState<boolean>(false);
  const [shotsError, setShotsError] = useState<string | null>(null);

  // Accordions
  const [showWorkedExample, setShowWorkedExample] = useState<boolean>(true);
  const [showScientificAssumptions, setShowScientificAssumptions] = useState<boolean>(false);

  // Calculated Bell Fidelity derived from W
  const currentFidelity = (1.0 + 3.0 * wernerW) / 4.0;

  // 1. Load Defaults on Mount
  useEffect(() => {
    fetchPurificationDefaults()
      .then((data) => {
        setDefaults(data);
        setWernerW(data.default_werner_w);
      })
      .catch((err) => console.error('Failed to load purification defaults', err));

    fetchPurificationSweep({ min_fidelity: 0.25, max_fidelity: 1.0, num_points: 60 })
      .then((data) => setSweepResult(data))
      .catch((err) => console.error('Failed to load purification sweep', err));
  }, []);

  // 2. Evaluate Analytical Purification when Inputs Change
  useEffect(() => {
    setIsLoadingEval(true);
    setEvalError(null);
    evaluatePurification({
      werner_w: wernerW,
      apply_twirling: applyTwirling,
    })
      .then((res) => setEvalResult(res))
      .catch((err) => setEvalError(err.message))
      .finally(() => setIsLoadingEval(false));
  }, [wernerW, applyTwirling]);

  // 3. Run Finite-Shot Experiment
  const handleRunShots = () => {
    setIsLoadingShots(true);
    setShotsError(null);
    simulatePurificationShots({
      werner_w: wernerW,
      shots: shotCount,
      seed: Math.floor(Math.random() * 10000),
    })
      .then((res) => setShotResult(res))
      .catch((err) => setShotsError(err.message))
      .finally(() => setIsLoadingShots(false));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Header Banner */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px', 
                  background: 'linear-gradient(135deg, #9333ea 0%, #c026d3 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(192, 38, 211, 0.4)' 
                }}
              >
                <Sparkles size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  Entanglement Purification Lab
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Distilling high-fidelity Bell pairs from noisy Werner states via the two-pair BBPSSW recurrence protocol
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div 
            style={{ 
              display: 'flex', 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '8px', 
              padding: '3px' 
            }}
          >
            <button
              onClick={() => setLabMode('analytical')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '6px',
                border: 'none',
                background: labMode === 'analytical' ? 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)' : 'transparent',
                color: labMode === 'analytical' ? '#fff' : 'var(--text-muted)',
                fontWeight: labMode === 'analytical' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={14} />
              <span>Analytical Recurrence</span>
            </button>

            <button
              onClick={() => setLabMode('shots')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '6px',
                border: 'none',
                background: labMode === 'shots' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: labMode === 'shots' ? '#fff' : 'var(--text-muted)',
                fontWeight: labMode === 'shots' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Activity size={14} />
              <span>Finite-Shot Aer Trial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Results & Plots on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Controls & Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sliders size={16} color="#c084fc" />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Input Pair Quality
                </h3>
              </div>
              {isLoadingEval && <Loader2 size={14} className="animate-spin" color="#c084fc" />}
            </div>

            {evalError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', padding: '0.5rem 0.65rem', color: '#fca5a5', fontSize: '0.72rem', marginBottom: '0.85rem' }}>
                {evalError}
              </div>
            )}

            {/* Werner W Slider */}
            <div style={{ marginBottom: '1.0rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Werner Parameter (w):</span>
                <span style={{ color: '#c084fc', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {wernerW.toFixed(4)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={wernerW}
                onChange={(e) => setWernerW(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#c084fc', cursor: 'pointer' }}
              />
            </div>

            {/* Bell Fidelity Display */}
            <div style={{ marginBottom: '1.0rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Initial Bell Fidelity (F_in):</span>
                <span style={{ color: currentFidelity >= 0.5 ? '#10b981' : '#f43f5e', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {currentFidelity.toFixed(4)}
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '0.45rem' }}>
                F_in = (1 + 3w)/4 · Threshold F = 0.50 (w = 1/3)
              </div>
            </div>

            {/* Presets Selector */}
            {defaults && (
              <div style={{ marginBottom: '1.0rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Educational Presets:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {defaults.presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setWernerW(p.werner_w)}
                      style={{
                        background: Math.abs(wernerW - p.werner_w) < 0.02 ? 'rgba(192, 38, 211, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: Math.abs(wernerW - p.werner_w) < 0.02 ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.65rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: Math.abs(wernerW - p.werner_w) < 0.02 ? '#fff' : 'var(--text-secondary)' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '1px' }}>
                        {p.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Twirling Toggle */}
            <div style={{ background: 'rgba(15, 23, 42, 0.55)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Bilateral Twirling Mode:
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: applyTwirling ? '#fff' : 'var(--text-muted)', cursor: 'pointer', marginBottom: '4px' }}>
                <input
                  type="radio"
                  name="twirlMode"
                  checked={applyTwirling}
                  onChange={() => setApplyTwirling(true)}
                  style={{ accentColor: '#c084fc' }}
                />
                <span>Werner Twirl (Averages error subspace)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: !applyTwirling ? '#fff' : 'var(--text-muted)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="twirlMode"
                  checked={!applyTwirling}
                  onChange={() => setApplyTwirling(false)}
                  style={{ accentColor: '#c084fc' }}
                />
                <span>Raw Bell-Diagonal (Anisotropic phase error)</span>
              </label>
            </div>

          </div>

          {/* Scientific Callout Box */}
          <div 
            style={{ 
              background: 'rgba(192, 38, 211, 0.08)', 
              border: '1px solid rgba(192, 38, 211, 0.25)', 
              borderRadius: '8px', 
              padding: '0.85rem',
              fontSize: '0.74rem',
              lineHeight: 1.45,
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#c084fc', fontWeight: 700, marginBottom: '0.35rem' }}>
              <ShieldCheck size={16} />
              <span>Entanglement Purification Principle</span>
            </div>
            <div>
              <b>Purification is non-deterministic and requires 2 pairs.</b> It cannot create entanglement from classical correlations alone.
              By sacrificing pair 2 through bilateral parity measurement, Alice and Bob filter out phase-flip noise from pair 1, paying a resource cost of <b>E[N] = 2 / P_succ</b> pairs per successful output!
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Results, Metrics Cards, Dual Plots & Worked Example */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
          {/* 4 Primary Metric Stat Cards */}
          {evalResult && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              
              {/* 1. Input vs Output Fidelity */}
              <div className="glass-panel" style={{ padding: '0.85rem', border: evalResult.is_purified ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Output Bell Fidelity (F_out)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: evalResult.is_purified ? '#10b981' : '#f43f5e', fontFamily: 'var(--font-mono)' }}>
                  {evalResult.output_bell_fidelity.toFixed(4)}
                </div>
                <div style={{ fontSize: '0.68rem', marginTop: '3px', fontWeight: 700, color: evalResult.fidelity_gain >= 0 ? '#34d399' : '#f43f5e' }}>
                  {evalResult.fidelity_gain >= 0 ? '+' : ''}{(evalResult.fidelity_gain * 100).toFixed(2)}% gain
                </div>
              </div>

              {/* 2. Success Probability */}
              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Success Probability (P_succ)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {(evalResult.success_probability * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Matching parity: m_A == m_B
                </div>
              </div>

              {/* 3. Expected Raw Pairs Consumed */}
              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Expected Cost E[N]</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#facc15', fontFamily: 'var(--font-mono)' }}>
                  {evalResult.expected_raw_pairs_consumed.toFixed(2)} <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>pairs</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  2 / P_succ per output pair
                </div>
              </div>

              {/* 4. Derived Teleportation Fidelity */}
              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Teleport Fidelity (F_tel)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                  {evalResult.output_teleport_fidelity.toFixed(4)}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#c084fc', marginTop: '2px' }}>
                  (2 F_out + 1) / 3
                </div>
              </div>

            </div>
          )}

          {/* Raw Bell-Diagonal Output Breakdown */}
          {evalResult && (
            <div className="glass-panel" style={{ padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Layers size={16} color="#c084fc" />
                  <h3 style={{ fontSize: '0.90rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Post-Measurement Bell-Diagonal State Representation
                  </h3>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  {applyTwirling ? 'Idealized Werner Twirl Enabled' : 'Raw Anisotropic Error Subspace'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600 }}>Target |Φ+⟩ (c1)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {evalResult.output_bell_coefficients['Phi+'].toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>Target fidelity F_out</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#f43f5e', fontWeight: 600 }}>Phase Error |Φ-⟩ (c2)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {evalResult.output_bell_coefficients['Phi-'].toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>Z-correlated noise</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bit Error |Ψ+⟩ (c3)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {evalResult.output_bell_coefficients['Psi+'].toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>X-correlated noise</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bit-Phase |Ψ-⟩ (c4)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {evalResult.output_bell_coefficients['Psi-'].toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>Y-correlated noise</div>
                </div>
              </div>
            </div>
          )}

          {/* VISUAL RECURRENCE PLOT: F_out vs F_in */}
          {labMode === 'analytical' && sweepResult && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Activity size={16} color="#c084fc" />
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    BBPSSW Recurrence Map: F_out vs. F_in
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
                  <span style={{ color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c084fc' }} />
                    F_out (Purified Fidelity)
                  </span>
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '2px', background: '#64748b' }} />
                    y = x (No-Change Reference)
                  </span>
                </div>
              </div>

              {/* Custom SVG Recurrence Plot */}
              <div style={{ position: 'relative', width: '100%', height: '230px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid var(--border-subtle)', padding: '10px' }}>
                <svg viewBox="0 0 650 200" style={{ width: '100%', height: '100%', display: 'block' }}>
                  
                  {/* Gridlines */}
                  {[0.25, 0.50, 0.75, 1.0].map((val) => {
                    const y = 180 - ((val - 0.25) / 0.75) * 160;
                    return (
                      <g key={val}>
                        <line x1="45" y1={y} x2="630" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <text x="38" y={y + 3.5} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                          {val.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}

                  {/* X Ticks */}
                  {[0.25, 0.50, 0.75, 1.0].map((val) => {
                    const x = 45 + ((val - 0.25) / 0.75) * 585;
                    return (
                      <g key={val}>
                        <line x1={x} y1="20" x2={x} y2="180" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        <text x={x} y="195" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          {val.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Shaded Gain Region (F > 0.5) */}
                  <rect
                    x={45 + ((0.50 - 0.25) / 0.75) * 585}
                    y="20"
                    width={((1.0 - 0.50) / 0.75) * 585}
                    height="160"
                    fill="rgba(16, 185, 129, 0.04)"
                  />

                  {/* Reference Line y = x */}
                  <line
                    x1="45"
                    y1="180"
                    x2={45 + 585}
                    y2="20"
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Threshold Marker F = 0.50 */}
                  {(() => {
                    const xThresh = 45 + ((0.50 - 0.25) / 0.75) * 585;
                    const yThresh = 180 - ((0.50 - 0.25) / 0.75) * 160;
                    return (
                      <g>
                        <line x1={xThresh} y1="20" x2={xThresh} y2="180" stroke="#facc15" strokeWidth="1" strokeDasharray="3 3" />
                        <circle cx={xThresh} cy={yThresh} r="4" fill="#facc15" />
                        <text x={xThresh + 6} y={yThresh - 6} fill="#facc15" fontSize="8" fontFamily="monospace">
                          Threshold (0.50, 0.50)
                        </text>
                      </g>
                    );
                  })()}

                  {/* BBPSSW Recurrence Curve */}
                  <path
                    d={sweepResult.points.map((pt, i) => {
                      const x = 45 + ((pt.fidelity_in - 0.25) / 0.75) * 585;
                      const y = 180 - ((pt.fidelity_out - 0.25) / 0.75) * 160;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="2.5"
                  />

                  {/* Current operating point marker */}
                  {(() => {
                    const curX = 45 + ((currentFidelity - 0.25) / 0.75) * 585;
                    const curY = 180 - (((evalResult?.output_bell_fidelity ?? currentFidelity) - 0.25) / 0.75) * 160;
                    return (
                      <g>
                        <line x1={curX} y1="20" x2={curX} y2="180" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx={curX} cy={curY} r="6" fill="#38bdf8" stroke="#fff" strokeWidth="2" />
                      </g>
                    );
                  })()}
                </svg>
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                💡 <b>Physical Insight:</b> Notice the crossover at <b>F = 0.50</b>. Above 0.50 (shaded green), the curve arches strictly above the diagonal reference line (F_out &gt; F_in), amplifying entanglement quality. Below 0.50, the curve falls below the line (F_out &lt; F_in), degrading toward the completely mixed unentangled fixed point at <b>F = 0.25</b>!
              </div>
            </div>
          )}

          {/* FINITE-SHOT SIMULATION MODE */}
          {labMode === 'shots' && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Activity size={16} color="#38bdf8" />
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Qiskit Aer Finite-Shot Simulation Experiment
                  </h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Shots: {shotCount}
                  </div>
                  <button
                    onClick={handleRunShots}
                    disabled={isLoadingShots}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.4rem 0.85rem',
                      color: '#fff',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isLoadingShots ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                    <span>{isLoadingShots ? 'Running Shots...' : 'Execute Trial'}</span>
                  </button>
                </div>
              </div>

              {shotsError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', padding: '0.5rem 0.65rem', color: '#fca5a5', fontSize: '0.72rem', marginBottom: '0.85rem' }}>
                  {shotsError}
                </div>
              )}

              {/* Shot Count Slider */}
              <div style={{ marginBottom: '1.0rem' }}>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={shotCount}
                  onChange={(e) => setShotCount(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
              </div>

              {shotResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Attempts</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        {shotResult.total_attempts}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>2 pairs/attempt</div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Accepted (m_A == m_B)</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {shotResult.accepted_attempts}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#38bdf8' }}>
                        Yield: {(shotResult.estimated_success_probability * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Estimated F_out</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                        {shotResult.estimated_output_fidelity !== null ? shotResult.estimated_output_fidelity.toFixed(4) : 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#34d399' }}>
                        ±{shotResult.output_fidelity_uncertainty !== null ? shotResult.output_fidelity_uncertainty.toFixed(4) : 'N/A'} (1σ)
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Empirical Cost E[N]</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#facc15', fontFamily: 'var(--font-mono)' }}>
                        {shotResult.expected_raw_pairs_consumed_estimate !== null ? shotResult.expected_raw_pairs_consumed_estimate.toFixed(2) : 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Theory: {shotResult.analytical_expected_raw_pairs.toFixed(2)}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', padding: '0.65rem 0.85rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    📊 <b>Statistical Uncertainty Note:</b> The uncertainty for output fidelity (<b>±{shotResult.output_fidelity_uncertainty?.toFixed(4)}</b>) is evaluated over the <b>{shotResult.accepted_attempts} accepted samples</b>, demonstrating proper post-selection statistical semantics.
                  </div>

                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Click <b>Execute Trial</b> to run a finite-shot Monte Carlo simulation of the 4-qubit BBPSSW circuit on Qiskit Aer!
                </div>
              )}
            </div>
          )}

          {/* Worked Numerical Example Accordion */}
          {evalResult && evalResult.worked_example && (
            <div className="glass-panel" style={{ padding: '1.15rem' }}>
              <div 
                onClick={() => setShowWorkedExample(!showWorkedExample)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Sparkles size={16} color="#facc15" />
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Step-by-Step Worked Numerical Calculation (w = {evalResult.input_werner_w.toFixed(4)})
                  </h4>
                </div>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                  {showWorkedExample ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {showWorkedExample && (
                <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#c084fc' }}>
                    Step 1 (Input): {evalResult.worked_example.step1_input}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#38bdf8' }}>
                    Step 2 (Bilateral CNOT): {evalResult.worked_example.step2_bilateral_cnot}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#facc15' }}>
                    Step 3 (Success Probability): {evalResult.worked_example.step3_success_probability}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#a855f7' }}>
                    Step 4 (Bell Coefficients): {evalResult.worked_example.step4_output_coefficients}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#10b981' }}>
                    Step 5 (Output Fidelity): {evalResult.worked_example.step5_purified_fidelity}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#f59e0b' }}>
                    Step 6 (Resource Accounting): {evalResult.worked_example.step6_resource_cost}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scientific Assumptions & References Accordion */}
          {defaults && (
            <div className="glass-panel" style={{ padding: '1.15rem' }}>
              <div 
                onClick={() => setShowScientificAssumptions(!showScientificAssumptions)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <BookOpen size={16} color="#38bdf8" />
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Scientific Assumptions, Twirling Modeling & Physical Invariants
                  </h4>
                </div>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                  {showScientificAssumptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {showScientificAssumptions && (
                <div style={{ marginTop: '0.85rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.65rem', fontSize: '0.74rem' }}>
                  {Object.entries(defaults.scientific_assumptions).map(([key, desc]) => (
                    <div key={key} style={{ background: 'rgba(0,0,0,0.35)', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ color: '#c084fc', fontWeight: 700, textTransform: 'capitalize', marginBottom: '2px' }}>
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {desc}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default PurificationLab;
