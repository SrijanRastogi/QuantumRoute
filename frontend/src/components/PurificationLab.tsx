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
import { MathBlock, MathInline } from './MathView';
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

const PURIFICATION_ASSUMPTION_MATH: Record<string, React.ReactNode> = {
  protocol: <>BBPSSW two-pair recurrence protocol (Bennett et al. PRL 76, 722 (1996)).</>,
  target_state: (
    <>
      Canonical symmetric Bell pair:
      <MathBlock
        math={`|\\Phi^{+}\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}`}
        style={{ padding: '0.25rem 0', margin: '0.25rem 0 0' }}
      />
    </>
  ),
  qubit_allocation: (
    <>
      Pair 1 on <MathInline math={`(A_1, B_1)`} /> retained; pair 2 on{' '}
      <MathInline math={`(A_2, B_2)`} /> sacrificed.
    </>
  ),
  gates_and_detectors: (
    <>
      Ideal local <MathInline math={`\\mathrm{CNOT}`} /> operations and ideal computational-basis
      detectors.
    </>
  ),
  parity_rule: (
    <>
      Acceptance conditioned strictly on matching measurement bits{' '}
      <MathInline math={`m_A = m_B`} />.
    </>
  ),
  twirling_assumption: (
    <>
      Idealized bilateral twirling maps the post-selected Bell-diagonal state to isotropic Werner form
      while preserving target Bell fidelity. In physical systems, twirling requires correlated random
      classical coordination and local Clifford gates with finite physical errors.
    </>
  ),
  resource_cost: (
    <>
      Each attempt consumes 2 raw input pairs. Under independent Bernoulli trials, the expected number
      of input pairs per successful output pair is:
      <MathBlock
        math={`\\mathbb{E}[N] = \\frac{2}{P_{\\text{succ}}}`}
        style={{ padding: '0.25rem 0', margin: '0.25rem 0 0' }}
      />
    </>
  ),
};

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
                  background: 'var(--gradient-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(192, 38, 211, 0.4)'
                }}
              >
                <Sparkles size={20} color="var(--text-primary)" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
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
              background: 'var(--surface-inset)',
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
                background: labMode === 'analytical' ? 'var(--gradient-purple)' : 'transparent',
                color: labMode === 'analytical' ? 'var(--text-primary)' : 'var(--text-muted)',
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
                background: labMode === 'shots' ? 'var(--gradient-info)' : 'transparent',
                color: labMode === 'shots' ? 'var(--text-primary)' : 'var(--text-muted)',
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
                <Sliders size={16} color="var(--accent-violet)" />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Input Pair Quality
                </h3>
              </div>
              {isLoadingEval && <Loader2 size={14} className="animate-spin" color="var(--accent-violet)" />}
            </div>

            {evalError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', borderRadius: '6px', padding: '0.5rem 0.65rem', color: 'var(--color-danger)', fontSize: '0.72rem', marginBottom: '0.85rem' }}>
                {evalError}
              </div>
            )}

            {/* Werner W Slider */}
            <div style={{ marginBottom: '1.0rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Werner Parameter (w):</span>
                <span style={{ color: 'var(--accent-violet)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
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
                style={{ width: '100%', accentColor: 'var(--accent-violet)', cursor: 'pointer' }}
              />
            </div>

            {/* Bell Fidelity Display */}
            <div style={{ marginBottom: '1.0rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Initial Bell Fidelity (<MathInline math={`F_{\\text{in}}`} />):</span>
                <span style={{ color: currentFidelity >= 0.5 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {currentFidelity.toFixed(4)}
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                <MathInline math={`F_{\\text{in}} = \\frac{1 + 3w}{4}`} />
                <span>·</span>
                <span>Threshold</span>
                <MathInline math={`F = 0.50 \\; (w = 1/3)`} />
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
                        border: Math.abs(wernerW - p.werner_w) < 0.02 ? '1px solid var(--accent-violet)' : '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.65rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: Math.abs(wernerW - p.werner_w) < 0.02 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
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
            <div style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Bilateral Twirling Mode:
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: applyTwirling ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', marginBottom: '4px' }}>
                <input
                  type="radio"
                  name="twirlMode"
                  checked={applyTwirling}
                  onChange={() => setApplyTwirling(true)}
                  style={{ accentColor: 'var(--accent-violet)' }}
                />
                <span>Werner Twirl (Averages error subspace)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: !applyTwirling ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="twirlMode"
                  checked={!applyTwirling}
                  onChange={() => setApplyTwirling(false)}
                  style={{ accentColor: 'var(--accent-violet)' }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-violet)', fontWeight: 700, marginBottom: '0.35rem' }}>
              <ShieldCheck size={16} />
              <span>Entanglement Purification Principle</span>
            </div>
            <div>
              <b>Purification is non-deterministic and requires 2 pairs.</b> It cannot create entanglement from classical correlations alone.
              By sacrificing pair 2 through bilateral parity measurement, Alice and Bob filter out phase-flip noise from pair 1, paying a resource cost of <b><MathInline math={`\\mathbb{E}[N] = \\frac{2}{P_{\\text{succ}}}`} /></b> pairs per successful output!
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
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Output Bell Fidelity (<MathInline math={`F_{\\text{out}}`} />)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: evalResult.is_purified ? 'var(--color-success)' : 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
                  {evalResult.output_bell_fidelity.toFixed(4)}
                </div>
                <div style={{ fontSize: '0.68rem', marginTop: '3px', fontWeight: 700, color: evalResult.fidelity_gain >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {evalResult.fidelity_gain >= 0 ? '+' : ''}{(evalResult.fidelity_gain * 100).toFixed(2)}% gain
                </div>
              </div>

              {/* 2. Success Probability */}
              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Success Probability (<MathInline math={`P_{\\text{succ}}`} />)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>
                  {(evalResult.success_probability * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Matching parity: m_A == m_B
                </div>
              </div>

              {/* 3. Expected Raw Pairs Consumed */}
              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Expected Cost <MathInline math={`\\mathbb{E}[N]`} /></div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
                  {evalResult.expected_raw_pairs_consumed.toFixed(2)} <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>pairs</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  <MathInline math={`\\frac{2}{P_{\\text{succ}}}`} /> per output pair
                </div>
              </div>

              {/* 4. Derived Teleportation Fidelity */}
              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Teleport Fidelity (<MathInline math={`F_{\\text{tel}}`} />)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)' }}>
                  {evalResult.output_teleport_fidelity.toFixed(4)}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-violet)', marginTop: '2px' }}>
                  <MathInline math={`\\frac{2 F_{\\text{out}} + 1}{3}`} />
                </div>
              </div>

            </div>
          )}

          {/* Raw Bell-Diagonal Output Breakdown */}
          {evalResult && (
            <div className="glass-panel" style={{ padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Layers size={16} color="var(--accent-violet)" />
                  <h3 style={{ fontSize: '0.90rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Post-Measurement Bell-Diagonal State Representation
                  </h3>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  {applyTwirling ? 'Idealized Werner Twirl Enabled' : 'Raw Anisotropic Error Subspace'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                <div style={{ background: 'var(--surface-inset)', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-success)', fontWeight: 600 }}>Target <MathInline math={`|\\Phi^+\\rangle`} /> (<MathInline math={`c_1`} />)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                    {evalResult.output_bell_coefficients['Phi+'].toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>Target fidelity <MathInline math={`F_{\\text{out}}`} /></div>
                </div>

                <div style={{ background: 'var(--surface-inset)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-danger)', fontWeight: 600 }}>Phase Error <MathInline math={`|\\Phi^-\\rangle`} /> (<MathInline math={`c_2`} />)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {evalResult.output_bell_coefficients['Phi-'].toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>Z-correlated noise</div>
                </div>

                <div style={{ background: 'var(--surface-inset)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bit Error <MathInline math={`|\\Psi^+\\rangle`} /> (<MathInline math={`c_3`} />)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {evalResult.output_bell_coefficients['Psi+'].toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>X-correlated noise</div>
                </div>

                <div style={{ background: 'var(--surface-inset)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bit-Phase <MathInline math={`|\\Psi^-\\rangle`} /> (<MathInline math={`c_4`} />)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
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
                  <Activity size={16} color="var(--accent-violet)" />
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    BBPSSW Recurrence Map: <MathInline math={`F_{\\text{out}}`} /> vs. <MathInline math={`F_{\\text{in}}`} />
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-violet)' }} />
                    <MathInline math={`F_{\\text{out}}`} /> (Purified Fidelity)
                  </span>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '2px', background: 'var(--text-muted)' }} />
                    y = x (No-Change Reference)
                  </span>
                </div>
              </div>

              {/* Custom SVG Recurrence Plot */}
              <div style={{ position: 'relative', width: '100%', height: '230px', background: 'var(--surface-inset)', borderRadius: '6px', border: '1px solid var(--border-subtle)', padding: '10px' }}>
                <svg viewBox="0 0 650 200" style={{ width: '100%', height: '100%', display: 'block' }}>

                  {/* Gridlines */}
                  {[0.25, 0.50, 0.75, 1.0].map((val) => {
                    const y = 180 - ((val - 0.25) / 0.75) * 160;
                    return (
                      <g key={val}>
                        <line x1="45" y1={y} x2="630" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <text x="38" y={y + 3.5} fill="currentColor" fontSize="9" textAnchor="end" fontFamily="monospace">
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
                        <text x={x} y="195" fill="currentColor" fontSize="9" textAnchor="middle" fontFamily="monospace">
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
                    stroke="var(--text-muted)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Threshold Marker F = 0.50 */}
                  {(() => {
                    const xThresh = 45 + ((0.50 - 0.25) / 0.75) * 585;
                    const yThresh = 180 - ((0.50 - 0.25) / 0.75) * 160;
                    return (
                      <g>
                        <line x1={xThresh} y1="20" x2={xThresh} y2="180" stroke="var(--color-warning)" strokeWidth="1" strokeDasharray="3 3" />
                        <circle cx={xThresh} cy={yThresh} r="4" fill="var(--color-warning)" />
                        <text x={xThresh + 6} y={yThresh - 6} fill="var(--color-warning)" fontSize="8" fontFamily="monospace">
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
                    stroke="var(--accent-violet)"
                    strokeWidth="2.5"
                  />

                  {/* Current operating point marker */}
                  {(() => {
                    const curX = 45 + ((currentFidelity - 0.25) / 0.75) * 585;
                    const curY = 180 - (((evalResult?.output_bell_fidelity ?? currentFidelity) - 0.25) / 0.75) * 160;
                    return (
                      <g>
                        <line x1={curX} y1="20" x2={curX} y2="180" stroke="var(--color-info)" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx={curX} cy={curY} r="6" fill="var(--color-info)" stroke="currentColor" strokeWidth="2" />
                      </g>
                    );
                  })()}
                </svg>
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                💡 <b>Physical Insight:</b> Notice the crossover at <MathInline math={`F = 0.50`} />. Above 0.50 (shaded green), the curve arches strictly above the diagonal reference line (<MathInline math={`F_{\\text{out}} > F_{\\text{in}}`} />), amplifying entanglement quality. Below 0.50, the curve falls below the line (<MathInline math={`F_{\\text{out}} < F_{\\text{in}}`} />), degrading toward the completely mixed unentangled fixed point at <MathInline math={`F = 0.25`} />!
              </div>
            </div>
          )}

          {/* FINITE-SHOT SIMULATION MODE */}
          {labMode === 'shots' && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Activity size={16} color="var(--color-info)" />
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
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
                      background: 'var(--gradient-info)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.4rem 0.85rem',
                      color: 'var(--text-primary)',
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
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', borderRadius: '6px', padding: '0.5rem 0.65rem', color: 'var(--color-danger)', fontSize: '0.72rem', marginBottom: '0.85rem' }}>
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
                  style={{ width: '100%', accentColor: 'var(--color-info)', cursor: 'pointer' }}
                />
              </div>

              {shotResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                    <div style={{ background: 'var(--surface-inset)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Attempts</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {shotResult.total_attempts}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>2 pairs/attempt</div>
                    </div>

                    <div style={{ background: 'var(--surface-inset)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Accepted (m_A == m_B)</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>
                        {shotResult.accepted_attempts}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-info)' }}>
                        Yield: {(shotResult.estimated_success_probability * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface-inset)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Estimated <MathInline math={`F_{\\text{out}}`} /></div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                        {shotResult.estimated_output_fidelity !== null ? shotResult.estimated_output_fidelity.toFixed(4) : 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-success)' }}>
                        ±{shotResult.output_fidelity_uncertainty !== null ? shotResult.output_fidelity_uncertainty.toFixed(4) : 'N/A'} (1σ)
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface-inset)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Empirical Cost <MathInline math={`\\mathbb{E}[N]`} /></div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
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
                  <Sparkles size={16} color="var(--color-warning)" />
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Step-by-Step Worked Numerical Calculation (w = {evalResult.input_werner_w.toFixed(4)})
                  </h4>
                </div>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                  {showWorkedExample ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {showWorkedExample && (
                <div style={{ marginTop: '1.0rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Step 1 */}
                  <div style={{ background: 'rgba(192, 132, 252, 0.04)', border: '1px solid rgba(192, 132, 252, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-violet)' }}>Step 1 · Input Werner State Parameters</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Initial Characterization</span>
                    </div>
                    <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                      <MathBlock math={`w_{\\text{in}} = ${evalResult.input_werner_w.toFixed(4)} \\implies F_{\\text{in}} = \\frac{1 + 3w_{\\text{in}}}{4} = ${evalResult.input_bell_fidelity.toFixed(4)}, \\qquad F_{\\text{tel}} = \\frac{1 + w_{\\text{in}}}{2} = ${evalResult.input_teleport_fidelity.toFixed(4)}`} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Two identical pairs described by isotropic parameter <MathInline math={`w = ${evalResult.input_werner_w.toFixed(4)}`} /> are supplied for bilateral local distillation.
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-info)' }}>Step 2 · Bilateral Local CNOT Filtering</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>BBPSSW Operations</span>
                    </div>
                    <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                      <MathBlock math={`\\text{Alice: } \\text{CNOT}(A_1 \\to A_2), \\qquad \\text{Bob: } \\text{CNOT}(B_1 \\to B_2)`} />
                      <MathBlock math={`\\text{Post-Selection Condition: Accept iff } m_A = m_B`} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Local bilateral CNOTs correlate bit and phase error syndromes into the auxiliary pair <MathInline math={`(A_2, B_2)`} />, which is measured in the computational basis and discarded.
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ background: 'rgba(250, 204, 21, 0.04)', border: '1px solid rgba(250, 204, 21, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-warning)' }}>Step 3 · Round Acceptance Probability</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Parity Coincidence Yield</span>
                    </div>
                    <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                      <MathBlock math={`P_{\\text{succ}}(w) = \\frac{w^2 + 1}{2} = \\frac{(${evalResult.input_werner_w.toFixed(4)})^2 + 1}{2} = ${evalResult.success_probability.toFixed(6)} \\quad \\left(${(evalResult.success_probability * 100).toFixed(2)}\\%\\right)`} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      The round succeeds whenever Alice and Bob obtain identical measurement parity bits (<MathInline math={`m_A = m_B`} />).
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div style={{ background: 'rgba(168, 85, 247, 0.04)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-purple)' }}>Step 4 · Raw Output Bell-Diagonal Decomposition</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Anisotropic State</span>
                    </div>
                    <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                      <MathBlock math={`c_1 (|\\Phi^+\\rangle) = ${evalResult.output_bell_coefficients['Phi+'].toFixed(4)}, \\quad c_2 (|\\Phi^-\\rangle) = ${evalResult.output_bell_coefficients['Phi-'].toFixed(4)}, \\quad c_3 (|\\Psi^+\\rangle) = ${evalResult.output_bell_coefficients['Psi+'].toFixed(4)}, \\quad c_4 (|\\Psi^-\\rangle) = ${evalResult.output_bell_coefficients['Psi-'].toFixed(4)}`} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Notice that <MathInline math={`c_2 > c_3 = c_4`} />: bilateral CNOT purifies bit-flip (<MathInline math={`X`} />) errors but leaves asymmetric phase (<MathInline math={`Z`} />) errors prior to twirling.
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-success)' }}>Step 5 · Purified Output Fidelity &amp; Net Gain</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Fidelity Delta</span>
                    </div>
                    <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                      <MathBlock math={`F_{\\text{out}} = c_1 = \\frac{5w^2 + 2w + 1}{4(w^2 + 1)} = ${evalResult.output_bell_fidelity.toFixed(6)}`} />
                      <MathBlock math={`\\Delta F = F_{\\text{out}} - F_{\\text{in}} = ${evalResult.output_bell_fidelity.toFixed(6)} - ${evalResult.input_bell_fidelity.toFixed(6)} = ${evalResult.fidelity_gain >= 0 ? '+' : ''}${evalResult.fidelity_gain.toFixed(6)}`} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: evalResult.is_purified ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                      {evalResult.is_purified ? '✓ Distillation Succeeded: Fidelity monotonically increased above input state.' : '✗ Sub-Threshold Warning: State lies below threshold (F < 0.50) and degraded toward white noise.'}
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-warning)' }}>Step 6 · Resource Accounting (Pair Consumption)</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Geometric Expectation</span>
                    </div>
                    <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                      <MathBlock math={`\\mathbb{E}[N] = \\frac{2}{P_{\\text{succ}}} = \\frac{2}{${evalResult.success_probability.toFixed(4)}} = ${evalResult.expected_raw_pairs_consumed.toFixed(2)} \\text{ raw Werner pairs consumed}`} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Each attempt consumes 2 raw Werner pairs. Accounting for non-deterministic geometric trials with success probability <MathInline math={`P_{\\text{succ}}`} />, generating 1 purified pair requires on average <MathInline math={`${evalResult.expected_raw_pairs_consumed.toFixed(2)}`} /> input pairs.
                    </div>
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
                  <BookOpen size={16} color="var(--color-info)" />
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
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
                    <div key={key} style={{ background: 'var(--surface-inset)', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ color: 'var(--accent-violet)', fontWeight: 700, textTransform: 'capitalize', marginBottom: '2px' }}>
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {PURIFICATION_ASSUMPTION_MATH[key] ?? desc}
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
