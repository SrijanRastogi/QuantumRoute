import React, { useState, useEffect } from 'react';
import {
  Radio,
  Sliders,
  Sparkles,
  Info,
  Layers,
  Activity,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { MathBlock, MathInline } from './MathView';
import {
  fetchChannelDefaults,
  evaluatePhysicalLink,
  fetchDistanceSweep,
  comparePhysicalRoutes,
  fetchTopologies,
} from '../api';
import type {
  ChannelDefaults,
  PhysicalLinkResponse,
  PhysicalSweepResponse,
  PhysicalRouteCompareResponse,
} from '../types';

const CHANNEL_ASSUMPTION_MATH: Record<string, React.ReactNode> = {
  transmission_model: (
    <>
      Fibre transmittance <MathInline math={`\\eta_{\\text{fiber}}(L) = 10^{-\\alpha L / 10}`} />.
      Total transmittance <MathInline math={`\\eta_{\\text{total}} = \\eta_{\\text{coupling}} \\, \\eta_{\\text{fiber}}`} />.
    </>
  ),
  conditional_werner: (
    <>
      Conditional quality <MathInline math={`w`} /> describes post-selected Bell states given heralded
      photon arrival. Loss does <b>not</b> directly twirl the state into white noise.
    </>
  ),
  dark_count_heuristic: (
    <>
      Simplified SNR heuristic, illustrating collapse near the dark-count floor:
      <MathBlock
        math={`w(\\eta) = w_{\\text{raw}} \\cdot \\frac{\\eta}{\\eta + 2p_{\\text{dark}}}`}
        style={{ padding: '0.25rem 0', margin: '0.25rem 0 0' }}
      />
    </>
  ),
  path_success: (
    <>
      <MathInline math={`P_{\\text{success}} = \\prod_{e \\in P} \\eta_{\\text{total},e}`} /> under the
      independent single-shot attempt model.
    </>
  ),
  memory_decay: (
    <>
      Dephasing over propagation delay <MathInline math={`w_{\\text{mem}} = e^{-\\tau_{\\text{wait}} / T_2}`} />.
    </>
  ),
};

export const PhysicalChannelsLab: React.FC = () => {
  // Navigation sub-tab: 'link' | 'network'
  const [subTab, setSubTab] = useState<'link' | 'network'>('link');

  // Channel Defaults & Presets
  const [defaults, setDefaults] = useState<ChannelDefaults | null>(null);

  // Single Link Parameters
  const [distanceKm, setDistanceKm] = useState<number>(50.0);
  const [alphaDb, setAlphaDb] = useState<number>(0.20);
  const [couplingEff, setCouplingEff] = useState<number>(0.85);
  const [rawVis, setRawVis] = useState<number>(0.98);
  const [pDark, setPDark] = useState<number>(1e-5);
  const [useDecoupled, setUseDecoupled] = useState<boolean>(false);

  // Link Evaluation Result
  const [linkResult, setLinkResult] = useState<PhysicalLinkResponse | null>(null);
  const [isLoadingLink, setIsLoadingLink] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Distance Sweep Result
  const [sweepResult, setSweepResult] = useState<PhysicalSweepResponse | null>(null);

  // Network Routing Compare State
  const [topologies, setTopologies] = useState<string[]>([]);
  const [selectedTopology, setSelectedTopology] = useState<string>('Generic Mesh (6 nodes · 10 links)');
  const [sourceNode, setSourceNode] = useState<string>('Alice');
  const [targetNode, setTargetNode] = useState<string>('Bob');
  const [t2MemoryUs, setT2MemoryUs] = useState<number>(2000.0);
  const [compareResult, setCompareResult] = useState<PhysicalRouteCompareResponse | null>(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Educational Accordion
  const [showWorkedExample, setShowWorkedExample] = useState<boolean>(true);
  const [showScientificAssumptions, setShowScientificAssumptions] = useState<boolean>(false);

  // 1. Load Defaults on Mount
  useEffect(() => {
    fetchChannelDefaults()
      .then((data) => {
        setDefaults(data);
        setAlphaDb(data.alpha_db_per_km);
        setCouplingEff(data.coupling_efficiency);
        setRawVis(data.raw_visibility);
        setPDark(data.p_dark);
        setT2MemoryUs(data.t2_memory_us);
      })
      .catch((err) => console.error('Failed to load channel defaults', err));

    fetchTopologies()
      .then((data) => {
        setTopologies(data.presets);
        if (data.default) setSelectedTopology(data.default);
      })
      .catch((err) => console.error('Failed to load topologies', err));
  }, []);

  // 2. Re-evaluate link whenever parameters change
  useEffect(() => {
    setIsLoadingLink(true);
    setLinkError(null);
    evaluatePhysicalLink({
      distance_km: distanceKm,
      alpha_db_per_km: alphaDb,
      coupling_efficiency: couplingEff,
      raw_visibility: rawVis,
      p_dark: pDark,
      use_decoupled_werner: useDecoupled,
    })
      .then((res) => setLinkResult(res))
      .catch((err) => setLinkError(err.message))
      .finally(() => setIsLoadingLink(false));
  }, [distanceKm, alphaDb, couplingEff, rawVis, pDark, useDecoupled]);

  // 3. Load distance sweep for charts
  useEffect(() => {
    fetchDistanceSweep({
      max_distance_km: 100.0,
      num_points: 25,
      alpha_db_per_km: alphaDb,
      coupling_efficiency: couplingEff,
      raw_visibility: rawVis,
      p_dark: pDark,
    })
      .then((res) => setSweepResult(res))
      .catch((err) => console.error('Sweep failed', err));
  }, [alphaDb, couplingEff, rawVis, pDark]);

  // 4. Evaluate route comparison in network sub-tab
  useEffect(() => {
    if (subTab !== 'network') return;
    setIsLoadingCompare(true);
    setCompareError(null);
    comparePhysicalRoutes({
      topology: selectedTopology,
      source: sourceNode,
      target: targetNode,
      alpha_db_per_km: alphaDb,
      coupling_efficiency: couplingEff,
      raw_visibility: rawVis,
      p_dark: pDark,
      t2_memory_us: t2MemoryUs,
    })
      .then((res) => setCompareResult(res))
      .catch((err) => setCompareError(err.message))
      .finally(() => setIsLoadingCompare(false));
  }, [subTab, selectedTopology, sourceNode, targetNode, alphaDb, couplingEff, rawVis, pDark, t2MemoryUs]);

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
                  background: 'var(--gradient-info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(56, 189, 248, 0.4)'
                }}
              >
                <Radio size={20} color="var(--text-primary)" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  Physical Channels & Transmission Loss Lab
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Decoupling optical photon attenuation (yield) from post-selected Bell state fidelity (quality)
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Tab Navigation Switcher */}
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
              onClick={() => setSubTab('link')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '6px',
                border: 'none',
                background: subTab === 'link' ? 'var(--gradient-info)' : 'transparent',
                color: subTab === 'link' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: subTab === 'link' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={14} />
              <span>Link Physics & Yield vs. Quality</span>
            </button>

            <button
              onClick={() => setSubTab('network')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '6px',
                border: 'none',
                background: subTab === 'network' ? 'var(--gradient-purple)' : 'transparent',
                color: subTab === 'network' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: subTab === 'network' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Layers size={14} />
              <span>Multi-Hop Paths & Routing Impact</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: LINK PHYSICS & YIELD VS QUALITY */}
      {subTab === 'link' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.25rem', alignItems: 'start' }}>

          {/* LEFT COLUMN: Physical Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

            {/* Link Parameters Card */}
            <div className="glass-panel" style={{ padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.95rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Sliders size={16} color="var(--color-info)" />
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Optical Link Parameters
                  </h3>
                </div>
                {isLoadingLink && <Loader2 size={14} className="animate-spin" color="var(--color-info)" />}
              </div>

              {linkError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', borderRadius: '6px', padding: '0.5rem 0.65rem', color: 'var(--color-danger)', fontSize: '0.72rem', marginBottom: '0.85rem' }}>
                  {linkError}
                </div>
              )}

              {/* Distance Slider & Quick Buttons */}
              <div style={{ marginBottom: '1.0rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fiber Distance (L):</span>
                  <span style={{ color: 'var(--color-info)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {distanceKm.toFixed(1)} km
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-info)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                  {[10, 25, 50, 80, 100].map((km) => (
                    <button
                      key={km}
                      onClick={() => setDistanceKm(km)}
                      style={{
                        background: distanceKm === km ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: distanceKm === km ? '1px solid var(--color-info)' : '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: distanceKm === km ? 'var(--color-info)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {km} km
                    </button>
                  ))}
                </div>
              </div>

              {/* Attenuation Rate (alpha) */}
              <div style={{ marginBottom: '1.0rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Attenuation Rate (<MathInline math={`\\alpha`} />):</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {alphaDb.toFixed(2)} dB/km
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.80"
                  step="0.01"
                  value={alphaDb}
                  onChange={(e) => setAlphaDb(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-fuchsia)', cursor: 'pointer' }}
                />

                {/* Fiber Presets Selector */}
                {defaults && (
                  <div style={{ marginTop: '0.45rem' }}>
                    <select
                      className="custom-select"
                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.5rem' }}
                      value={alphaDb}
                      onChange={(e) => setAlphaDb(parseFloat(e.target.value))}
                    >
                      {defaults.presets.map((p) => (
                        <option key={p.id} value={p.alpha_db_per_km}>
                          {p.label} ({p.alpha_db_per_km.toFixed(2)} dB/km)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Optical Coupling Efficiency */}
              <div style={{ marginBottom: '1.0rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Coupling &amp; Detector Eff. (<MathInline math={`\\eta_{\\text{coupling}}`} />):</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {(couplingEff * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="1.0"
                  step="0.05"
                  value={couplingEff}
                  onChange={(e) => setCouplingEff(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-success)', cursor: 'pointer' }}
                />
              </div>

              {/* Conditional Quality Model Selector */}
              <div style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Conditional Entanglement Quality Model:
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: !useDecoupled ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', marginBottom: '4px' }}>
                  <input
                    type="radio"
                    name="wernerModel"
                    checked={!useDecoupled}
                    onChange={() => setUseDecoupled(false)}
                    style={{ accentColor: 'var(--color-info)' }}
                  />
                  <span>Simplified Dark-Count SNR Heuristic</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: useDecoupled ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="wernerModel"
                    checked={useDecoupled}
                    onChange={() => setUseDecoupled(true)}
                    style={{ accentColor: 'var(--color-info)' }}
                  />
                  <span>Decoupled Quality (Loss affects transmission only)</span>
                </label>
              </div>

              {/* Source Quality & Dark Counts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Raw Visibility (w₀)</div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="1.0"
                    value={rawVis}
                    onChange={(e) => setRawVis(parseFloat(e.target.value) || 0.98)}
                    style={{ width: '100%', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.25rem 0.4rem', color: 'var(--text-primary)', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Dark Count Prob (p_dark)</div>
                  <input
                    type="number"
                    step="1e-6"
                    min="0"
                    max="0.01"
                    value={pDark}
                    onChange={(e) => setPDark(parseFloat(e.target.value) || 1e-5)}
                    style={{ width: '100%', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.25rem 0.4rem', color: 'var(--text-primary)', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
            </div>

            {/* Scientific Callout Box */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '8px',
                padding: '0.85rem',
                fontSize: '0.74rem',
                lineHeight: 1.45,
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-info)', fontWeight: 700, marginBottom: '0.35rem' }}>
                <ShieldCheck size={16} />
                <span>Fundamental Scientific Distinction</span>
              </div>
              <div>
                <b>Photon loss does NOT equal mixed-state noise.</b> When a photon is absorbed in silica, it fails to arrive (erasure/loss event).
                The <i>conditional</i> Bell state fidelity describes the quality of pairs that <b>did</b> arrive successfully and were heralded.
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Results, Metrics Cards, Dual Plots & Worked Example */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

            {/* 4 Primary Metric Stat Cards */}
            {linkResult && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>

                {/* 1. Optical Loss */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Channel Loss (dB)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
                    {linkResult.attenuation_db.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>dB</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Latency: {linkResult.propagation_delay_ms.toFixed(2)} ms (5.0 µs/km)
                  </div>
                </div>

                {/* 2. Total Transmission Probability */}
                <div className="glass-panel" style={{ padding: '0.85rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-success)' }}>Transmission Prob. (<MathInline math={`\\eta_{\\text{total}}`} />)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                    {(linkResult.transmittance_total * 100).toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {linkResult.expected_attempts ? `~${linkResult.expected_attempts.toFixed(0)} trials/herald` : 'Absorption floor'}
                  </div>
                </div>

                {/* 3. Conditional Werner Parameter */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Conditional Werner (<MathInline math={`w`} />)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)' }}>
                    {linkResult.conditional_werner_w.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Post-selected arrival
                  </div>
                </div>

                {/* 4. Conditional Teleport Fidelity */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Conditional Fidelity (<MathInline math={`F_{\\text{tel}}`} />)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>
                    {linkResult.conditional_teleport_fidelity.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-info)', marginTop: '2px', fontWeight: 600 }}>
                    Bell <MathInline math={`F_e`} /> = {linkResult.conditional_bell_fidelity.toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            {/* DUAL PLOT VISUALIZATION: Transmission Loss vs Conditional Quality */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Activity size={16} color="var(--color-info)" />
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Physical Contrast: Transmission Probability vs. Conditional Entanglement Quality
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
                    <MathInline math={`\\eta_{\\text{total}}`} /> (Transmission Yield)
                  </span>
                  <span style={{ color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-violet)' }} />
                    <MathInline math={`F_e`} /> (Conditional Quality)
                  </span>
                </div>
              </div>

              {/* Custom SVG Distance Sweep Visualization */}
              {sweepResult && sweepResult.points.length > 0 && (
                <div style={{ position: 'relative', width: '100%', height: '220px', background: 'var(--surface-inset)', borderRadius: '6px', border: '1px solid var(--border-subtle)', padding: '10px' }}>
                  <svg viewBox="0 0 650 200" style={{ width: '100%', height: '100%', display: 'block' }}>
                    {/* Gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((val) => {
                      const y = 180 - val * 160;
                      return (
                        <g key={val}>
                          <line x1="45" y1={y} x2="630" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                          <text x="38" y={y + 3.5} fill="currentColor" fontSize="9" textAnchor="end" fontFamily="monospace">
                            {(val * 100).toFixed(0)}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Distance X Ticks */}
                    {[0, 20, 40, 60, 80, 100].map((d) => {
                      const x = 45 + (d / 100) * 585;
                      return (
                        <g key={d}>
                          <line x1={x} y1="20" x2={x} y2="180" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                          <text x={x} y="195" fill="currentColor" fontSize="9" textAnchor="middle" fontFamily="monospace">
                            {d} km
                          </text>
                        </g>
                      );
                    })}

                    {/* Curve 1: Transmission Probability (Green) */}
                    <path
                      d={sweepResult.points.map((pt, i) => {
                        const x = 45 + (pt.distance_km / 100) * 585;
                        const y = 180 - Math.min(1.0, pt.eta_total) * 160;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="var(--color-success)"
                      strokeWidth="2.5"
                    />

                    {/* Curve 2: Conditional Bell Fidelity (Purple) */}
                    <path
                      d={sweepResult.points.map((pt, i) => {
                        const x = 45 + (pt.distance_km / 100) * 585;
                        const f = useDecoupled ? pt.bell_fidelity_decoupled : pt.bell_fidelity_heuristic;
                        const y = 180 - Math.min(1.0, f) * 160;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="var(--accent-violet)"
                      strokeWidth="2.5"
                      strokeDasharray={useDecoupled ? '4 2' : 'none'}
                    />

                    {/* Current operating point marker */}
                    {(() => {
                      const curX = 45 + (Math.min(100, distanceKm) / 100) * 585;
                      const curY_eta = 180 - Math.min(1.0, linkResult?.transmittance_total ?? 0) * 160;
                      const curY_fe = 180 - Math.min(1.0, linkResult?.conditional_bell_fidelity ?? 0) * 160;
                      return (
                        <g>
                          <line x1={curX} y1="20" x2={curX} y2="180" stroke="var(--color-info)" strokeWidth="1.5" strokeDasharray="3 3" />
                          <circle cx={curX} cy={curY_eta} r="5" fill="var(--color-success)" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx={curX} cy={curY_fe} r="5" fill="var(--accent-violet)" stroke="currentColor" strokeWidth="1.5" />
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              )}

              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                💡 <b>Visual Insight:</b> Notice the dramatic contrast between the two curves. Transmission probability (green) plummets exponentially as photons are scattered.
                In stark contrast, the conditional Bell fidelity (purple) remains high across tens of kilometers because conditional fidelity evaluates only the photons that successfully arrive!
              </div>
            </div>

            {/* Worked Numerical Example Accordion */}
            {linkResult && linkResult.worked_example && (
              <div className="glass-panel" style={{ padding: '1.15rem' }}>
                <div
                  onClick={() => setShowWorkedExample(!showWorkedExample)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={16} color="var(--color-warning)" />
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Step-by-Step Worked Numerical Calculation ({distanceKm.toFixed(1)} km)
                    </h4>
                  </div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                    {showWorkedExample ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {showWorkedExample && (
                  <div style={{ marginTop: '1.0rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Step 1 */}
                    <div style={{ background: 'rgba(244, 63, 94, 0.04)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-danger)' }}>Step 1 · Optical Fiber Attenuation</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Beer-Lambert Absorption</span>
                      </div>
                      <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                        <MathBlock math={`\\text{Loss (dB)} = \\alpha \\cdot L = ${alphaDb.toFixed(2)}\\text{ dB/km} \\times ${distanceKm.toFixed(1)}\\text{ km} = ${linkResult.attenuation_db.toFixed(2)}\\text{ dB}`} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Standard silica fiber exhibits <MathInline math={`\\alpha = ${alphaDb.toFixed(2)}\\text{ dB/km}`} /> at telecom wavelengths. Over <MathInline math={`${distanceKm.toFixed(1)}\\text{ km}`} />, cumulative signal attenuation reaches <MathInline math={`${linkResult.attenuation_db.toFixed(2)}\\text{ dB}`} />.
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-success)' }}>Step 2 · Fiber Transmittance (Pass-Through Yield)</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Decibel to Linear Ratio</span>
                      </div>
                      <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                        <MathBlock math={`\\eta_{\\text{fiber}} = 10^{-\\frac{\\text{Loss}}{10}} = 10^{-\\frac{${linkResult.attenuation_db.toFixed(2)}}{10}} = ${linkResult.transmittance_fiber.toFixed(4)} \\quad \\left(${(linkResult.transmittance_fiber * 100).toFixed(2)}\\%\\right)`} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Yield represents the raw probability of a single photon traversing the fiber link without being scattered or absorbed.
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div style={{ background: 'rgba(52, 211, 153, 0.04)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-success)' }}>Step 3 · Total End-to-End Transmittance</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Coupling &amp; Detection Inclusion</span>
                      </div>
                      <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                        <MathBlock math={`\\eta_{\\text{total}} = \\eta_{\\text{coupling}} \\cdot \\eta_{\\text{fiber}} = ${couplingEff.toFixed(2)} \\times ${linkResult.transmittance_fiber.toFixed(4)} = ${linkResult.transmittance_total.toFixed(4)} \\quad \\left(${(linkResult.transmittance_total * 100).toFixed(2)}\\%\\right)`} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Includes terminal optics coupling and single-photon detector quantum efficiency <MathInline math={`\\eta_{\\text{coupling}} = ${(couplingEff * 100).toFixed(0)}\\%`} />.
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div style={{ background: 'rgba(192, 132, 252, 0.04)', border: '1px solid rgba(192, 132, 252, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-violet)' }}>Step 4 · Conditional Werner Noise Parameter</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Dark-Count Signal-to-Noise Impact</span>
                      </div>
                      <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                        {useDecoupled ? (
                          <MathBlock math={`w_{\\text{cond}} = w_{\\text{raw}} = ${rawVis.toFixed(4)} \\quad (\\text{constant decoupled quality})`} />
                        ) : (
                          <MathBlock math={`w_{\\text{cond}} = w_{\\text{raw}} \\cdot \\left[\\frac{\\eta_{\\text{total}}}{\\eta_{\\text{total}} + 2 p_{\\text{dark}}}\\right] = ${rawVis.toFixed(2)} \\times \\left[\\frac{${linkResult.transmittance_total.toFixed(4)}}{${linkResult.transmittance_total.toFixed(4)} + 2(${pDark.toExponential(1)})}\\right] = ${linkResult.conditional_werner_w.toFixed(4)}`} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <b>Fundamental Distinction:</b> Photon absorption is an erasure event. The conditional fidelity only measures pairs where photons successfully arrived and triggered herald detectors.
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div style={{ background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-info)' }}>Step 5 · Conditional Bell &amp; Teleportation Fidelities</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Horodecki Formula</span>
                      </div>
                      <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0.35rem 0' }}>
                        <MathBlock math={`F_e = \\frac{1 + 3 w_{\\text{cond}}}{4} = \\frac{1 + 3(${linkResult.conditional_werner_w.toFixed(4)})}{4} = ${linkResult.conditional_bell_fidelity.toFixed(4)}`} />
                        <MathBlock math={`F_{\\text{tel}} = \\frac{2 F_e + 1}{3} = \\frac{1 + w_{\\text{cond}}}{2} = \\frac{1 + ${linkResult.conditional_werner_w.toFixed(4)}}{2} = ${linkResult.conditional_teleport_fidelity.toFixed(4)}`} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Because <MathInline math={`F_{\\text{tel}} = ${linkResult.conditional_teleport_fidelity.toFixed(4)} > 2/3`} />, non-classical quantum state transfer remains verified conditioned on photon arrival.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scientific Assumptions & Scope Limitations Reference */}
            {defaults && (
              <div className="glass-panel" style={{ padding: '1.15rem' }}>
                <div
                  onClick={() => setShowScientificAssumptions(!showScientificAssumptions)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <BookOpen size={16} color="var(--color-info)" />
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Scientific Assumptions, Models & Units Reference
                    </h4>
                  </div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                    {showScientificAssumptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {showScientificAssumptions && (
                  <div style={{ marginTop: '0.85rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.65rem', fontSize: '0.74rem' }}>
                    {Object.entries(defaults.assumptions).map(([key, desc]) => (
                      <div key={key} style={{ background: 'var(--surface-inset)', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ color: 'var(--color-info)', fontWeight: 700, textTransform: 'capitalize', marginBottom: '2px' }}>
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {CHANNEL_ASSUMPTION_MATH[key] ?? desc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* SUB-TAB 2: MULTI-HOP PATHS & ROUTING IMPACT */}
      {subTab === 'network' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Controls Bar for Topology & Routing */}
          <div className="glass-panel" style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Multi-Hop Path & Routing Evaluation
              </div>
              {isLoadingCompare && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-violet)', fontSize: '0.74rem' }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Evaluating routes...</span>
                </div>
              )}
            </div>

            {compareError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', borderRadius: '6px', padding: '0.5rem 0.65rem', color: 'var(--color-danger)', fontSize: '0.72rem', marginBottom: '0.85rem' }}>
                {compareError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  Network Topology:
                </label>
                <select
                  className="custom-select"
                  value={selectedTopology}
                  onChange={(e) => setSelectedTopology(e.target.value)}
                  style={{ fontSize: '0.76rem', padding: '0.4rem 0.6rem' }}
                >
                  {topologies.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--color-alice)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                  Source Node (Alice):
                </label>
                <input
                  type="text"
                  value={sourceNode}
                  onChange={(e) => setSourceNode(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.4rem 0.6rem', color: 'var(--text-primary)', fontSize: '0.76rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--color-bob)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                  Destination Node (Bob):
                </label>
                <input
                  type="text"
                  value={targetNode}
                  onChange={(e) => setTargetNode(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.4rem 0.6rem', color: 'var(--text-primary)', fontSize: '0.76rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--accent-violet)', display: 'block', marginBottom: '3px' }}>
                  Memory Coherence T₂: {t2MemoryUs >= 1000 ? `${(t2MemoryUs / 1000).toFixed(1)} ms` : `${t2MemoryUs.toFixed(0)} µs`}
                </label>
                <input
                  type="range"
                  min="200"
                  max="10000"
                  step="200"
                  value={t2MemoryUs}
                  onChange={(e) => setT2MemoryUs(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-violet)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Route Comparison Grid */}
          {compareResult && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.0rem', marginBottom: '1.25rem' }}>

                {/* 1. Shortest Hop (BFS) */}
                {compareResult.routes.shortest_hop && (
                  <div className="glass-panel" style={{ padding: '1.15rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                        Minimum Hops (BFS)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', background: 'var(--surface-1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {compareResult.routes.shortest_hop.num_hops} hops
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem', wordBreak: 'break-word' }}>
                      {compareResult.routes.shortest_hop.path.join(' ➔ ')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Distance:</span>
                        <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.shortest_hop.total_distance_km} km</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Channel Loss:</span>
                        <span style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.shortest_hop.total_attenuation_db} dB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Path Success (Yield):</span>
                        <span style={{ color: 'var(--color-success)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {(compareResult.routes.shortest_hop.path_success_probability * 100).toFixed(4)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--accent-violet)', fontWeight: 600 }}>Conditional Bell Fe:</span>
                        <span style={{ color: 'var(--accent-violet)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {compareResult.routes.shortest_hop.conditional_bell_fidelity.toFixed(4)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-info)' }}>Fidelity with Memory:</span>
                        <span style={{ color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>
                          {compareResult.routes.shortest_hop.fidelity_with_memory.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Quality-Aware (Dijkstra) */}
                {compareResult.routes.quality_aware && (
                  <div className="glass-panel" style={{ padding: '1.15rem', border: '1px solid rgba(192, 38, 211, 0.4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-fuchsia)' }}>
                        Quality-Aware (Dijkstra)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--accent-violet)', background: 'rgba(192, 38, 211, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        {compareResult.routes.quality_aware.num_hops} hops
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem', wordBreak: 'break-word' }}>
                      {compareResult.routes.quality_aware.path.join(' ➔ ')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Distance:</span>
                        <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.quality_aware.total_distance_km} km</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Channel Loss:</span>
                        <span style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.quality_aware.total_attenuation_db} dB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Path Success (Yield):</span>
                        <span style={{ color: 'var(--color-success)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {(compareResult.routes.quality_aware.path_success_probability * 100).toFixed(4)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--accent-violet)', fontWeight: 600 }}>Conditional Bell Fe:</span>
                        <span style={{ color: 'var(--accent-violet)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {compareResult.routes.quality_aware.conditional_bell_fidelity.toFixed(4)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-info)' }}>Fidelity with Memory:</span>
                        <span style={{ color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>
                          {compareResult.routes.quality_aware.fidelity_with_memory.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Multi-Metric (Pareto) */}
                {compareResult.routes.multi_metric && (
                  <div className="glass-panel" style={{ padding: '1.15rem', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-info)' }}>
                        Multi-Metric (Balanced)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-info)', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        {compareResult.routes.multi_metric.num_hops} hops
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem', wordBreak: 'break-word' }}>
                      {compareResult.routes.multi_metric.path.join(' ➔ ')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Distance:</span>
                        <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.multi_metric.total_distance_km} km</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Channel Loss:</span>
                        <span style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.multi_metric.total_attenuation_db} dB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Path Success (Yield):</span>
                        <span style={{ color: 'var(--color-success)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {(compareResult.routes.multi_metric.path_success_probability * 100).toFixed(4)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--accent-violet)', fontWeight: 600 }}>Conditional Bell Fe:</span>
                        <span style={{ color: 'var(--accent-violet)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {compareResult.routes.multi_metric.conditional_bell_fidelity.toFixed(4)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-info)' }}>Fidelity with Memory:</span>
                        <span style={{ color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>
                          {compareResult.routes.multi_metric.fidelity_with_memory.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scientific Insight Box */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  borderRadius: '8px',
                  padding: '1.0rem',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-magenta)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <Info size={16} />
                  <span>Physical Channel Routing Discovery</span>
                </div>
                <div>
                  {compareResult.scientific_insight}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default PhysicalChannelsLab;
