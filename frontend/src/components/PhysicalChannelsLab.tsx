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
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(56, 189, 248, 0.4)' 
                }}
              >
                <Radio size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
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
              background: 'rgba(15, 23, 42, 0.6)', 
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
                background: subTab === 'link' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: subTab === 'link' ? '#fff' : 'var(--text-muted)',
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
                background: subTab === 'network' ? 'linear-gradient(135deg, #9333ea 0%, #c026d3 100%)' : 'transparent',
                color: subTab === 'network' ? '#fff' : 'var(--text-muted)',
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
                  <Sliders size={16} color="#38bdf8" />
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Optical Link Parameters
                  </h3>
                </div>
                {isLoadingLink && <Loader2 size={14} className="animate-spin" color="#38bdf8" />}
              </div>

              {linkError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', padding: '0.5rem 0.65rem', color: '#fca5a5', fontSize: '0.72rem', marginBottom: '0.85rem' }}>
                  {linkError}
                </div>
              )}

              {/* Distance Slider & Quick Buttons */}
              <div style={{ marginBottom: '1.0rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fiber Distance (L):</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
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
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                  {[10, 25, 50, 80, 100].map((km) => (
                    <button
                      key={km}
                      onClick={() => setDistanceKm(km)}
                      style={{
                        background: distanceKm === km ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: distanceKm === km ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: distanceKm === km ? '#38bdf8' : 'var(--text-secondary)',
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
                  <span style={{ color: 'var(--text-muted)' }}>Attenuation Rate (α):</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
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
                  <span style={{ color: 'var(--text-muted)' }}>Coupling & Detector Eff. (η_coupling):</span>
                  <span style={{ color: '#34d399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
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
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </div>

              {/* Conditional Quality Model Selector */}
              <div style={{ background: 'rgba(15, 23, 42, 0.55)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                  Conditional Entanglement Quality Model:
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: !useDecoupled ? '#fff' : 'var(--text-muted)', cursor: 'pointer', marginBottom: '4px' }}>
                  <input
                    type="radio"
                    name="wernerModel"
                    checked={!useDecoupled}
                    onChange={() => setUseDecoupled(false)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  <span>Simplified Dark-Count SNR Heuristic</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: useDecoupled ? '#fff' : 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="wernerModel"
                    checked={useDecoupled}
                    onChange={() => setUseDecoupled(true)}
                    style={{ accentColor: '#38bdf8' }}
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
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.25rem 0.4rem', color: '#fff', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}
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
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.25rem 0.4rem', color: '#fff', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.35rem' }}>
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
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
                    {linkResult.attenuation_db.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>dB</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Latency: {linkResult.propagation_delay_ms.toFixed(2)} ms (5.0 µs/km)
                  </div>
                </div>

                {/* 2. Total Transmission Probability */}
                <div className="glass-panel" style={{ padding: '0.85rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#34d399' }}>Transmission Prob. (η_total)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {(linkResult.transmittance_total * 100).toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {linkResult.expected_attempts ? `~${linkResult.expected_attempts.toFixed(0)} trials/herald` : 'Absorption floor'}
                  </div>
                </div>

                {/* 3. Conditional Werner Parameter */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Conditional Werner (w)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                    {linkResult.conditional_werner_w.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Post-selected arrival
                  </div>
                </div>

                {/* 4. Conditional Teleport Fidelity */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Conditional Fidelity (F_tel)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {linkResult.conditional_teleport_fidelity.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#38bdf8', marginTop: '2px', fontWeight: 600 }}>
                    Bell Fe = {linkResult.conditional_bell_fidelity.toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            {/* DUAL PLOT VISUALIZATION: Transmission Loss vs Conditional Quality */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Activity size={16} color="#38bdf8" />
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Physical Contrast: Transmission Probability vs. Conditional Entanglement Quality
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    η_total (Transmission Yield)
                  </span>
                  <span style={{ color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c084fc' }} />
                    F_e (Conditional Quality)
                  </span>
                </div>
              </div>

              {/* Custom SVG Distance Sweep Visualization */}
              {sweepResult && sweepResult.points.length > 0 && (
                <div style={{ position: 'relative', width: '100%', height: '220px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid var(--border-subtle)', padding: '10px' }}>
                  <svg viewBox="0 0 650 200" style={{ width: '100%', height: '100%', display: 'block' }}>
                    {/* Gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((val) => {
                      const y = 180 - val * 160;
                      return (
                        <g key={val}>
                          <line x1="45" y1={y} x2="630" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                          <text x="38" y={y + 3.5} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
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
                          <text x={x} y="195" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
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
                      stroke="#10b981"
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
                      stroke="#c084fc"
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
                          <line x1={curX} y1="20" x2={curX} y2="180" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                          <circle cx={curX} cy={curY_eta} r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                          <circle cx={curX} cy={curY_fe} r="5" fill="#c084fc" stroke="#fff" strokeWidth="1.5" />
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
                    <Sparkles size={16} color="#facc15" />
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                      Step-by-Step Worked Numerical Calculation ({distanceKm.toFixed(1)} km)
                    </h4>
                  </div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                    {showWorkedExample ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {showWorkedExample && (
                  <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#f43f5e' }}>
                      Step 1 (Loss): {linkResult.worked_example.step1_attenuation}
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#10b981' }}>
                      Step 2 (Fiber Transmittance): {linkResult.worked_example.step2_transmittance}
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#34d399' }}>
                      Step 3 (Coupling × Fiber): {linkResult.worked_example.step3_total}
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#c084fc' }}>
                      Step 4 (Conditional Quality): {linkResult.worked_example.step4_quality}
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.65rem', borderRadius: '6px', color: '#38bdf8' }}>
                      Step 5 (Fidelities): {linkResult.worked_example.step5_fidelity}
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
                    <BookOpen size={16} color="#38bdf8" />
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: 0 }}>
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
                      <div key={key} style={{ background: 'rgba(0,0,0,0.35)', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ color: '#38bdf8', fontWeight: 700, textTransform: 'capitalize', marginBottom: '2px' }}>
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
      )}

      {/* SUB-TAB 2: MULTI-HOP PATHS & ROUTING IMPACT */}
      {subTab === 'network' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Controls Bar for Topology & Routing */}
          <div className="glass-panel" style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                Multi-Hop Path & Routing Evaluation
              </div>
              {isLoadingCompare && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c084fc', fontSize: '0.74rem' }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Evaluating routes...</span>
                </div>
              )}
            </div>

            {compareError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', padding: '0.5rem 0.65rem', color: '#fca5a5', fontSize: '0.72rem', marginBottom: '0.85rem' }}>
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
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.4rem 0.6rem', color: '#fff', fontSize: '0.76rem' }}
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
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.4rem 0.6rem', color: '#fff', fontSize: '0.76rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#c084fc', display: 'block', marginBottom: '3px' }}>
                  Memory Coherence T₂: {t2MemoryUs >= 1000 ? `${(t2MemoryUs / 1000).toFixed(1)} ms` : `${t2MemoryUs.toFixed(0)} µs`}
                </label>
                <input
                  type="range"
                  min="200"
                  max="10000"
                  step="200"
                  value={t2MemoryUs}
                  onChange={(e) => setT2MemoryUs(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#c084fc', cursor: 'pointer' }}
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
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f43f5e' }}>
                        Minimum Hops (BFS)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        {compareResult.routes.shortest_hop.num_hops} hops
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#fff', fontWeight: 600, marginBottom: '0.75rem', wordBreak: 'break-word' }}>
                      {compareResult.routes.shortest_hop.path.join(' ➔ ')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Distance:</span>
                        <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.shortest_hop.total_distance_km} km</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Channel Loss:</span>
                        <span style={{ color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.shortest_hop.total_attenuation_db} dB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>Path Success (Yield):</span>
                        <span style={{ color: '#34d399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {(compareResult.routes.shortest_hop.path_success_probability * 100).toFixed(4)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#c084fc', fontWeight: 600 }}>Conditional Bell Fe:</span>
                        <span style={{ color: '#c084fc', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {compareResult.routes.shortest_hop.conditional_bell_fidelity.toFixed(4)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#38bdf8' }}>Fidelity with Memory:</span>
                        <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
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
                      <span style={{ fontSize: '0.68rem', color: '#c084fc', background: 'rgba(192, 38, 211, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        {compareResult.routes.quality_aware.num_hops} hops
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#fff', fontWeight: 600, marginBottom: '0.75rem', wordBreak: 'break-word' }}>
                      {compareResult.routes.quality_aware.path.join(' ➔ ')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Distance:</span>
                        <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.quality_aware.total_distance_km} km</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Channel Loss:</span>
                        <span style={{ color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.quality_aware.total_attenuation_db} dB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>Path Success (Yield):</span>
                        <span style={{ color: '#34d399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {(compareResult.routes.quality_aware.path_success_probability * 100).toFixed(4)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#c084fc', fontWeight: 600 }}>Conditional Bell Fe:</span>
                        <span style={{ color: '#c084fc', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {compareResult.routes.quality_aware.conditional_bell_fidelity.toFixed(4)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#38bdf8' }}>Fidelity with Memory:</span>
                        <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
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
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>
                        Multi-Metric (Balanced)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#7dd3fc', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        {compareResult.routes.multi_metric.num_hops} hops
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#fff', fontWeight: 600, marginBottom: '0.75rem', wordBreak: 'break-word' }}>
                      {compareResult.routes.multi_metric.path.join(' ➔ ')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Distance:</span>
                        <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.multi_metric.total_distance_km} km</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Channel Loss:</span>
                        <span style={{ color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>{compareResult.routes.multi_metric.total_attenuation_db} dB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>Path Success (Yield):</span>
                        <span style={{ color: '#34d399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {(compareResult.routes.multi_metric.path_success_probability * 100).toFixed(4)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#c084fc', fontWeight: 600 }}>Conditional Bell Fe:</span>
                        <span style={{ color: '#c084fc', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {compareResult.routes.multi_metric.conditional_bell_fidelity.toFixed(4)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#38bdf8' }}>Fidelity with Memory:</span>
                        <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#f0abfc', fontWeight: 700, marginBottom: '0.35rem' }}>
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
