import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  Code,
  Layers,
  TrendingDown,
  Gauge,
  Eye,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Check
} from 'lucide-react';
import { MathBlock, MathInline } from './MathView';
import { BlochSphere } from './BlochSphere';
import { NoiseSweepChart } from './NoiseSweepChart';
import {
  fetchStatePresets,
  prepareCustomState,
  runTeleportExperiment,
  runNoiseSweep
} from '../api';
import type {
  StatePreset,
  StatePrepResponse,
  TeleportExperimentResponse,
  NoiseSweepResponse
} from '../types';
import {
  sphericalToCartesian,
  cartesianToSpherical,
  validateCartesianCoordinates
} from '../utils/quantumCoordinates';

export const ExperimentsLab: React.FC = () => {
  // Preset States & Custom Angles
  const [presets, setPresets] = useState<StatePreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('zero');
  const [theta, setTheta] = useState<number>(0.0);
  const [phi, setPhi] = useState<number>(0.0);
  const [stateData, setStateData] = useState<StatePrepResponse | null>(null);

  // Cartesian Coordinates State
  const [cartX, setCartX] = useState<number>(0.0);
  const [cartY, setCartY] = useState<number>(0.0);
  const [cartZ, setCartZ] = useState<number>(1.0);
  const [isMixedMode, setIsMixedMode] = useState<boolean>(false);
  const [coordValidation, setCoordValidation] = useState<{ isValid: boolean; error: string | null; radius: number }>({
    isValid: true,
    error: null,
    radius: 1.0,
  });

  // Depolarizing Noise
  const [noiseP, setNoiseP] = useState<number>(0.0);

  // Finite-shot Tomography Toggle
  const [enableTomography, setEnableTomography] = useState<boolean>(false);
  const [tomoShots, setTomoShots] = useState<number>(2048);

  // Experiment Execution State & Stale Flag
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [experimentResult, setExperimentResult] = useState<TeleportExperimentResponse | null>(null);
  const [experimentError, setExperimentError] = useState<string | null>(null);
  const [isSimStale, setIsSimStale] = useState<boolean>(false);

  // Parameter Sweep State
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [sweepResult, setSweepResult] = useState<NoiseSweepResponse | null>(null);
  const [sweepError, setSweepError] = useState<string | null>(null);

  // Explanations Accordion
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [showQasmModal, setShowQasmModal] = useState<boolean>(false);

  // Active Sub-Tab: 'teleport' | 'sweep'
  const [activeTab, setActiveTab] = useState<'teleport' | 'sweep'>('teleport');

  // Load presets on mount
  useEffect(() => {
    fetchStatePresets()
      .then((data) => {
        setPresets(data);
      })
      .catch((err) => {
        console.error('Failed to load presets:', err);
      });
  }, []);

  // Update state evaluation when theta or phi changes
  useEffect(() => {
    prepareCustomState(theta, phi)
      .then((data) => {
        setStateData(data);
      })
      .catch((err) => {
        console.error('Failed to prepare state:', err);
      });
  }, [theta, phi]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: StatePreset) => {
    setSelectedPresetId(preset.id);
    setTheta(preset.theta);
    setPhi(preset.phi);

    // Synchronize Cartesian coordinates
    const [x, y, z] = preset.bloch_vector;
    setCartX(x);
    setCartY(y);
    setCartZ(z);
    setCoordValidation({
      isValid: true,
      error: null,
      radius: Math.sqrt(x * x + y * y + z * z),
    });

    if (experimentResult) {
      setIsSimStale(true);
    }
  };

  // Handle Spherical Sliders Change
  const handleSphericalAngleChange = (newTheta: number, newPhi: number) => {
    setSelectedPresetId('custom');
    setTheta(newTheta);
    setPhi(newPhi);

    // Derive Cartesian vector
    const [x, y, z] = sphericalToCartesian(newTheta, newPhi);
    setCartX(Number(x.toFixed(4)));
    setCartY(Number(y.toFixed(4)));
    setCartZ(Number(z.toFixed(4)));
    setCoordValidation({
      isValid: true,
      error: null,
      radius: 1.0,
    });

    if (experimentResult) {
      setIsSimStale(true);
    }
  };

  // Handle Cartesian Coordinate Input Change
  const handleCartesianInputChange = (x: number, y: number, z: number) => {
    setSelectedPresetId('custom');
    setCartX(x);
    setCartY(y);
    setCartZ(z);

    const validation = validateCartesianCoordinates(x, y, z, isMixedMode);
    setCoordValidation({
      isValid: validation.isValid,
      error: validation.error,
      radius: validation.radius,
    });

    if (validation.isValid) {
      const { theta: newTheta, phi: newPhi } = cartesianToSpherical(x, y, z);
      setTheta(newTheta);
      setPhi(newPhi);
    }

    if (experimentResult) {
      setIsSimStale(true);
    }
  };

  // Normalize Vector to Unit Sphere Action
  const handleNormalize = () => {
    const validation = validateCartesianCoordinates(cartX, cartY, cartZ, isMixedMode);
    const [nx, ny, nz] = validation.normalized;
    const cleanX = Number(nx.toFixed(4));
    const cleanY = Number(ny.toFixed(4));
    const cleanZ = Number(nz.toFixed(4));

    setCartX(cleanX);
    setCartY(cleanY);
    setCartZ(cleanZ);

    const { theta: newTheta, phi: newPhi } = cartesianToSpherical(cleanX, cleanY, cleanZ);
    setTheta(newTheta);
    setPhi(newPhi);
    setCoordValidation({
      isValid: true,
      error: null,
      radius: 1.0,
    });

    if (experimentResult) {
      setIsSimStale(true);
    }
  };

  // Reset Experiment to default state |0>
  const handleReset = () => {
    const pZero = presets.find((p) => p.id === 'zero');
    if (pZero) {
      setSelectedPresetId('zero');
      setTheta(0.0);
      setPhi(0.0);
      setCartX(0.0);
      setCartY(0.0);
      setCartZ(1.0);
    } else {
      setSelectedPresetId('custom');
      setTheta(0.0);
      setPhi(0.0);
      setCartX(0.0);
      setCartY(0.0);
      setCartZ(1.0);
    }
    setNoiseP(0.0);
    setCoordValidation({ isValid: true, error: null, radius: 1.0 });
    setExperimentResult(null);
    setExperimentError(null);
    setIsSimStale(false);
  };

  // Run Real Qiskit Teleportation Experiment
  const handleRunExperiment = async () => {
    setIsRunning(true);
    setExperimentError(null);
    setIsSimStale(false);
    try {
      const data = await runTeleportExperiment({
        theta,
        phi,
        noise_p: noiseP,
        shots: enableTomography ? tomoShots : undefined,
      });
      setExperimentResult(data);
    } catch (err: any) {
      setExperimentError(err.message || 'Teleportation experiment failed.');
    } finally {
      setIsRunning(false);
    }
  };

  // Run Noise Sweep
  const handleRunSweep = async () => {
    setIsSweeping(true);
    setSweepError(null);
    try {
      const data = await runNoiseSweep({
        theta,
        phi,
        p_min: 0.0,
        p_max: 0.75,
        num_points: 16,
      });
      setSweepResult(data);
    } catch (err: any) {
      setSweepError(err.message || 'Noise sweep calculation failed.');
    } finally {
      setIsSweeping(false);
    }
  };

  // Compute active Bloch coordinates
  const currentInputVector: [number, number, number] = [cartX, cartY, cartZ];

  const currentOutputVector: [number, number, number] | null = experimentResult
    ? experimentResult.output_state.bloch_vector
    : noiseP > 0
    ? [
        currentInputVector[0] * (1.0 - noiseP),
        currentInputVector[1] * (1.0 - noiseP),
        currentInputVector[2] * (1.0 - noiseP),
      ]
    : null;

  const currentPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Top Workspace Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Guided Quantum Experiments & 3D Bloch Explorer
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--color-info)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
              }}
            >
              Interactive 3D WebGL
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
            Interactive single-qubit state preparation, Cartesian & spherical coordinate editing, and Qiskit teleportation
          </p>
        </div>

        {/* Workspace Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Sub-tab Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'var(--surface-inset)',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <button
              onClick={() => setActiveTab('teleport')}
              style={{
                background: activeTab === 'teleport' ? 'var(--accent-purple)' : 'transparent',
                color: activeTab === 'teleport' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Protocol & Noise
            </button>
            <button
              onClick={() => {
                setActiveTab('sweep');
                if (!sweepResult && !isSweeping) {
                  handleRunSweep();
                }
              }}
              style={{
                background: activeTab === 'sweep' ? 'var(--accent-purple)' : 'transparent',
                color: activeTab === 'sweep' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Noise Sweep
            </button>
          </div>

          {/* Reset Quantum State Action */}
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--surface-1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Reset quantum state to default ground state |0⟩ and zero noise"
          >
            <RotateCcw size={13} />
            Reset State Default
          </button>
        </div>
      </div>

      {/* Collapsible "What am I seeing?" Educational Guide */}
      <div
        className="glass-panel"
        style={{
          padding: '0.85rem 1.15rem',
          background: 'rgba(30, 27, 75, 0.3)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
        }}
      >
        <div
          onClick={() => setShowExplanation(!showExplanation)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-violet)', fontWeight: 700, fontSize: '0.85rem' }}>
            <HelpCircle size={16} />
            <span>What am I seeing? Bloch Sphere & Coordinate Foundations</span>
          </div>
          {showExplanation ? <ChevronUp size={16} color="var(--accent-violet)" /> : <ChevronDown size={16} color="var(--accent-violet)" />}
        </div>

        {showExplanation && (
          <div
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.75rem',
              borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-info)', marginBottom: '0.2rem' }}>
                1. The Bloch Sphere
              </div>
              A geometric representation of a 2-level quantum state space. Every point on the unit sphere surface (||r|| = 1.0) represents a unique pure state |ψ⟩. The interior (||r|| &lt; 1.0) represents mixed states.
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: '0.2rem' }}>
                2. Cartesian vs. Spherical
              </div>
              Coordinates X, Y, Z are the expectation values of Pauli spin matrices: <MathInline math={`X = \\langle\\sigma_x\\rangle`} />, <MathInline math={`Y = \\langle\\sigma_y\\rangle`} />, <MathInline math={`Z = \\langle\\sigma_z\\rangle`} />. Spherical angle θ is polar latitude (Z axis), and φ is azimuthal phase in the equator (X-Y plane).
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: '0.2rem' }}>
                3. Noise Contraction
              </div>
              Depolarizing noise contracts Bob's received state vector isotropically: r_out = (1 - p) * r_in. Pure states become mixed, shrinking toward the center (0, 0, 0) where the state is completely mixed (I/2).
            </div>
          </div>
        )}
      </div>

      {/* Main Grid Layout: Controls (Left) + 3D Bloch Canvas & Teleportation (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>

        {/* LEFT COLUMN: State Playground & Coordinate Editors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Phase A & B: State Playground & Dual Coordinate Editors */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={16} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  1. Input State & Coordinate Editor
                </h3>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <MathInline math={`|\\psi\\rangle = \\cos(\\theta/2)|0\\rangle + e^{i\\phi}\\sin(\\theta/2)|1\\rangle`} />
              </div>
            </div>

            {/* Presets Grid */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.45rem' }}>
                Standard Canonical Presets:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.45rem' }}>
                {presets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid var(--color-info)' : '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0.55rem 0.25rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      title={preset.description}
                    >
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isSelected ? 'var(--color-info)' : 'var(--text-primary)' }}>
                        {preset.symbol}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {preset.label.split(' ')[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cartesian Coordinate Editor (X, Y, Z) */}
            <div
              style={{
                background: 'var(--surface-inset)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Cartesian Bloch Vector (X, Y, Z):
                </span>

                {/* Mixed-State Mode Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isMixedMode}
                    onChange={(e) => {
                      const newMode = e.target.checked;
                      setIsMixedMode(newMode);
                      const val = validateCartesianCoordinates(cartX, cartY, cartZ, newMode);
                      setCoordValidation({ isValid: val.isValid, error: val.error, radius: val.radius });
                    }}
                    style={{ accentColor: 'var(--accent-violet)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.68rem', color: isMixedMode ? 'var(--accent-violet)' : 'var(--text-muted)', fontWeight: 600 }}>
                    Mixed Mode (||r|| ≤ 1)
                  </span>
                </label>
              </div>

              {/* 3 Input fields: X, Y, Z */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '0.65rem' }}>
                {/* X Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600, marginBottom: '2px' }}>
                    <span>X (|+⟩ / |-⟩):</span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="-1"
                    max="1"
                    value={cartX}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleCartesianInputChange(val, cartY, cartZ);
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--surface-inset)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.5rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                {/* Y Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600, marginBottom: '2px' }}>
                    <span>Y (|+i⟩ / |-i⟩):</span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="-1"
                    max="1"
                    value={cartY}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleCartesianInputChange(cartX, val, cartZ);
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--surface-inset)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.5rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                {/* Z Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-info)', fontWeight: 600, marginBottom: '2px' }}>
                    <span>Z (|0⟩ / |1⟩):</span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="-1"
                    max="1"
                    value={cartZ}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleCartesianInputChange(cartX, cartY, val);
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--surface-inset)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.5rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>

              {/* Radius / Norm indicator & Validation Message */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bloch Radius ||r||:</span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: coordValidation.isValid ? 'var(--color-success)' : 'var(--color-danger)'
                    }}
                  >
                    {coordValidation.radius.toFixed(4)}
                  </span>
                </div>

                {!coordValidation.isValid && (
                  <button
                    onClick={handleNormalize}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid var(--color-info)',
                      borderRadius: '5px',
                      padding: '2px 8px',
                      color: 'var(--color-info)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Scale coordinates so x² + y² + z² = 1.0"
                  >
                    <Check size={11} />
                    <span>Normalize to Unit Sphere</span>
                  </button>
                )}
              </div>

              {/* Validation Warning Alert */}
              {!coordValidation.isValid && coordValidation.error && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.45rem 0.65rem',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: 'var(--color-danger)',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertTriangle size={13} />
                  <span>{coordValidation.error}</span>
                </div>
              )}
            </div>

            {/* Synchronized Spherical Angle Sliders */}
            <div
              style={{
                background: 'var(--surface-inset)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Synchronized Spherical Coordinates (θ, φ):
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <MathInline math={`\\theta = \\arccos(z), \\quad \\phi = \\text{atan2}(y, x)`} />
                </span>
              </div>

              {/* Theta Slider (0 to pi) */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>Polar Angle θ (0 → π):</span>
                  <span style={{ color: 'var(--color-info)', fontFamily: 'monospace', fontWeight: 600 }}>
                    {theta.toFixed(3)} rad ({(theta * 180 / Math.PI).toFixed(1)}°)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.PI}
                  step="0.01"
                  value={theta}
                  onChange={(e) => handleSphericalAngleChange(parseFloat(e.target.value), phi)}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                />
              </div>

              {/* Phi Slider (0 to 2pi) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>Azimuthal Angle φ (0 → 2π):</span>
                  <span style={{ color: 'var(--color-info)', fontFamily: 'monospace', fontWeight: 600 }}>
                    {phi.toFixed(3)} rad ({(phi * 180 / Math.PI).toFixed(1)}°)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={2 * Math.PI}
                  step="0.01"
                  value={phi}
                  onChange={(e) => handleSphericalAngleChange(theta, parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Selected State Description Card */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 0.95rem',
                fontSize: '0.76rem',
                lineHeight: 1.45,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-info)', fontWeight: 700, marginBottom: '0.25rem' }}>
                <Sparkles size={13} />
                <span>{currentPreset ? currentPreset.label : 'Custom Single-Qubit State'}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 'auto' }}>
                  {stateData?.formula || ''}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {currentPreset
                  ? currentPreset.description
                  : `Custom state prepared at polar angle θ = ${theta.toFixed(2)} rad, azimuthal angle φ = ${phi.toFixed(2)} rad.`}
              </p>
            </div>
          </div>

          {/* Depolarizing Noise Channel */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingDown size={16} color="var(--color-danger)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  2. Entangled Link Depolarizing Noise
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: noiseP === 0 ? 'var(--color-success)' : noiseP > 2/3 ? 'var(--color-danger)' : 'var(--color-warning)'
                }}
              >
                {noiseP === 0 ? 'Noiseless Link (p=0)' : noiseP > 2/3 ? 'Sub-Classical Link (p > 2/3)' : 'Noisy Quantum Link'}
              </span>
            </div>

            {/* Depolarizing Parameter Slider */}
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <span>Depolarizing Noise Parameter (p):</span>
                <span style={{ color: 'var(--color-danger)', fontFamily: 'monospace', fontWeight: 700 }}>
                  {noiseP.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.01"
                value={noiseP}
                onChange={(e) => {
                  setNoiseP(parseFloat(e.target.value));
                  if (experimentResult) {
                    setIsSimStale(true);
                  }
                }}
                style={{ width: '100%', accentColor: 'var(--color-danger)', cursor: 'pointer' }}
              />
            </div>

            {/* Quick Presets Buttons */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Ideal (p=0.0)', val: 0.0 },
                { label: 'Low (p=0.10)', val: 0.1 },
                { label: 'Typical (p=0.20)', val: 0.2 },
                { label: 'Moderate (p=0.50)', val: 0.5 },
                { label: 'Classical Bound (p=0.667)', val: 0.667 },
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() => {
                    setNoiseP(btn.val);
                    if (experimentResult) {
                      setIsSimStale(true);
                    }
                  }}
                  style={{
                    background: Math.abs(noiseP - btn.val) < 0.01 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: Math.abs(noiseP - btn.val) < 0.01 ? '1px solid var(--color-danger)' : '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.3rem 0.6rem',
                    color: Math.abs(noiseP - btn.val) < 0.01 ? 'var(--color-danger)' : 'var(--text-secondary)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Derived Link Metrics Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              <div
                style={{
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '0.6rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Equivalent Werner (w)</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {(1.0 - noiseP).toFixed(3)}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '0.6rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bell Link Fidelity (Fe)</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'monospace' }}>
                  {((1.0 + 3.0 * (1.0 - noiseP)) / 4.0).toFixed(3)}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '0.6rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Theory Fidelity (F)</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'monospace' }}>
                  {(1.0 - noiseP / 2.0).toFixed(3)}
                </div>
              </div>
            </div>
          </div>

          {/* Qiskit Execution Trigger */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gauge size={16} color="var(--accent-purple)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  3. Simulation Mode & Execution
                </h3>
              </div>
              {isSimStale && (
                <span style={{ fontSize: '0.72rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                  ● State updated (Re-run needed)
                </span>
              )}
            </div>

            {/* Finite-Shot Tomography Option */}
            <div
              style={{
                background: 'var(--surface-inset)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Finite-Shot Pauli Tomography
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Demonstrate statistical shot noise (σ_x, σ_y, σ_z) via Qiskit Aer
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={enableTomography}
                    onChange={(e) => setEnableTomography(e.target.checked)}
                    style={{ accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: enableTomography ? 'var(--accent-violet)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {enableTomography ? 'Finite Shots' : 'Exact DM'}
                  </span>
                </label>
              </div>

              {enableTomography && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Shots:</span>
                  {[1024, 2048, 4096].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTomoShots(s)}
                      style={{
                        background: tomoShots === s ? 'rgba(192, 38, 211, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: tomoShots === s ? '1px solid var(--accent-magenta)' : '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: tomoShots === s ? 'var(--accent-magenta)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Run Experiment Action Button */}
            <button
              onClick={handleRunExperiment}
              disabled={isRunning || !coordValidation.isValid}
              style={{
                width: '100%',
                background: isRunning
                  ? 'rgba(168, 85, 247, 0.3)'
                  : !coordValidation.isValid
                  ? 'rgba(100, 116, 139, 0.2)'
                  : 'var(--gradient-purple)',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                borderRadius: '8px',
                padding: '0.75rem',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: (isRunning || !coordValidation.isValid) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: (isRunning || !coordValidation.isValid) ? 'none' : '0 4px 15px rgba(147, 51, 234, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              {isRunning ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--text-primary)' }} />
                  <span>Executing Qiskit Aer Teleportation Circuit...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span>Run Teleportation Experiment ▶</span>
                </>
              )}
            </button>

            {experimentError && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '6px',
                  color: 'var(--color-danger)',
                  fontSize: '0.74rem'
                }}
              >
                {experimentError}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 3D Bloch Canvas & Teleportation Protocol Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Interactive 3D Bloch Sphere Panel */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Eye size={15} color="var(--color-info)" />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Interactive 3D Bloch Sphere
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-violet)', fontWeight: 600 }}>
                Three.js WebGL Orbit
              </span>
            </div>

            <BlochSphere
              inputVector={currentInputVector}
              outputVector={currentOutputVector}
              inputLabel="|ψ⟩ Alice Input"
              outputLabel="Bob Post-Noise"
              size={330}
            />

            {/* Density Matrix Representation */}
            {stateData && (
              <div
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.75rem 0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Target State Density Matrix <MathInline math={`\\rho = |\\psi\\rangle\\langle\\psi|`} />
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 600 }}>
                    <MathInline math={`\\text{Purity } \\gamma = \\text{Tr}(\\rho^2) = ${stateData.purity.toFixed(3)}`} />
                  </span>
                </div>
                <div style={{ background: 'var(--surface-inset)', borderRadius: '6px', padding: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                  <MathBlock math={`\\rho = \\begin{pmatrix} ${stateData.density_matrix.real[0][0].toFixed(3)} & ${(stateData.density_matrix.real[0][1]).toFixed(3)}${stateData.density_matrix.imag[0][1] >= 0 ? '+' : ''}${stateData.density_matrix.imag[0][1].toFixed(3)}i \\\\[4pt] ${(stateData.density_matrix.real[1][0]).toFixed(3)}${stateData.density_matrix.imag[1][0] >= 0 ? '+' : ''}${stateData.density_matrix.imag[1][0].toFixed(3)}i & ${stateData.density_matrix.real[1][1].toFixed(3)} \\end{pmatrix}`} />
                </div>
              </div>
            )}
          </div>

          {/* Experiment Result Metrics & Status */}
          {experimentResult && (
            <div className="glass-panel" style={{ padding: '1.25rem', opacity: isSimStale ? 0.75 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Actual Qiskit Simulation Results
                </h4>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    background: experimentResult.metrics.has_quantum_advantage
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                    color: experimentResult.metrics.has_quantum_advantage ? 'var(--color-success)' : 'var(--color-danger)',
                    border: experimentResult.metrics.has_quantum_advantage
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : '1px solid rgba(239, 68, 68, 0.35)',
                  }}
                >
                  {experimentResult.metrics.has_quantum_advantage ? (
                    <>
                      <CheckCircle size={12} />
                      <span>Quantum Advantage Preserved</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={12} />
                      <span>Classical Bound Reached</span>
                    </>
                  )}
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginBottom: '0.85rem' }}>
                <div style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.65rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Simulated State Fidelity</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-violet)', fontFamily: 'monospace' }}>
                    {experimentResult.metrics.state_fidelity.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Theory: {experimentResult.metrics.theoretical_fidelity.toFixed(4)} (Δ = {experimentResult.metrics.fidelity_discrepancy.toExponential(2)})
                  </div>
                </div>

                <div style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.65rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Bob's State Purity (γ)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'monospace' }}>
                    {experimentResult.output_state.purity.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Bloch radius: ||r|| = {experimentResult.output_state.bloch_radius.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Finite-Shot Tomography Breakdown if enabled */}
              {experimentResult.tomography && (
                <div
                  style={{
                    background: 'rgba(192, 38, 211, 0.08)',
                    border: '1px solid rgba(192, 38, 211, 0.25)',
                    borderRadius: '6px',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '0.85rem',
                    fontSize: '0.74rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-magenta)' }}>
                      Finite-Shot Pauli Tomography ({experimentResult.tomography.shots} shots):
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 700 }}>
                      F_emp = {experimentResult.tomography.empirical_fidelity?.toFixed(4) ?? 'N/A'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.68rem' }}>
                    Empirical Bloch: ({experimentResult.tomography.empirical_bloch_vector.map((v) => v.toFixed(3)).join(', ')})
                    {' · '}Standard Error: ±{experimentResult.tomography.std_errors.z.toFixed(4)}
                  </div>
                </div>
              )}

              {/* Circuit Stats Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Circuit: {experimentResult.circuit.num_qubits} Qubits · Depth {experimentResult.circuit.depth} · Gates: {JSON.stringify(experimentResult.circuit.ops_count)}
                </span>
                <button
                  onClick={() => setShowQasmModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.25rem 0.55rem',
                    color: 'var(--color-info)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  <Code size={12} />
                  <span>View QASM</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guided 5-Step Teleportation Protocol Walkthrough */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Guided Teleportation Protocol Workflow
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Step-by-step breakdown of entanglement generation, Bell measurement, and feedforward corrections
            </p>
          </div>
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-info)',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>{showTechnicalDetails ? 'Hide Scientific Notes' : 'Scientific Notes'}</span>
            {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* 5 Protocol Steps Carousel/List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
          {[
            {
              num: 1,
              title: 'State Prep',
              qubits: 'q₀ (Alice)',
              desc: (
                <span>
                  Prepare message state <MathInline math={`|\\psi\\rangle`} /> with <MathInline math={`\\theta = ${theta.toFixed(2)}\\ \\text{rad}`} />, <MathInline math={`\\phi = ${phi.toFixed(2)}\\ \\text{rad}`} /> [<MathInline math={`X=${cartX.toFixed(2)},\\ Y=${cartY.toFixed(2)},\\ Z=${cartZ.toFixed(2)}`} />].
                </span>
              ),
              tag: 'Alice',
            },
            {
              num: 2,
              title: 'Bell Resource',
              qubits: 'q₁ (Alice) & q₂ (Bob)',
              desc: (
                <span>
                  Generate <MathInline math={`|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}`} /> via H(q₁) + CX(q₁, q₂). Noise <MathInline math={`p=${noiseP.toFixed(2)}`} /> degrades Werner parameter <MathInline math={`w=${(1 - noiseP).toFixed(2)}`} />.
                </span>
              ),
              tag: 'EPR Link',
            },
            {
              num: 3,
              title: 'Alice BSM',
              qubits: 'q₀ & q₁ (Alice)',
              desc: 'Apply CX(q₀, q₁) and H(q₀), entangling Alice’s unknown message with her half of the shared Bell pair.',
              tag: 'Bell Basis',
            },
            {
              num: 4,
              title: 'Feedforward',
              qubits: 'q₂ (Bob)',
              desc: 'Apply coherent corrections: CX(q₁, q₂) applies bit-flip X and CZ(q₀, q₂) applies phase-flip Z onto Bob’s qubit.',
              tag: 'Correction',
            },
            {
              num: 5,
              title: 'Verification',
              qubits: 'q₂ (Bob)',
              desc: (
                <span>
                  Trace out Alice's qubits (q₀, q₁). Bob’s reduced state matches <MathInline math={`|\\psi\\rangle`} /> with fidelity <MathInline math={`F = ${(1 - noiseP / 2).toFixed(3)}`} />.
                </span>
              ),
              tag: 'Target ρ',
            },
          ].map((st) => (
            <div
              key={st.num}
              style={{
                background: 'var(--surface-inset)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--accent-purple)',
                    color: 'var(--text-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {st.num}
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: 'var(--surface-1)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {st.tag}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {st.title}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-info)', fontWeight: 600 }}>
                {st.qubits}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {st.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Expandable Technical Deep Dive (Coherent vs Measurement) */}
        {showTechnicalDetails && (
          <div
            style={{
              marginTop: '1rem',
              background: 'rgba(30, 41, 59, 0.35)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.95rem 1.15rem',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--color-info)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={14} />
              <span>Coherent Feedforward vs Physical Classical Communication (ADR-002)</span>
            </div>
            <p style={{ margin: '0 0 0.4rem 0' }}>
              In physical quantum networks, Alice performs projective measurement on (q₀, q₁), transmits 2 classical bits over a classical optical fiber channel (bounded by the speed of light c), and Bob conditionally applies Pauli X and Z gates.
            </p>
            <p style={{ margin: 0 }}>
              Under the MVP assumptions (PLAN.md §6), this simulator employs <strong>deferred-measurement coherent feedforward</strong> (CX(q₁, q₂) and CZ(q₀, q₂)). This mathematically models the exact unconditional post-correction quantum ensemble without requiring dynamic mid-circuit conditional resets, preserving 100% mathematical fidelity.
            </p>
          </div>
        )}
      </div>

      {/* Noise Sweep Chart Section */}
      {activeTab === 'sweep' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Depolarizing Noise Parameter Sweep
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                Bounded parameter sweep across noise values p ∈ [0.0, 0.75] comparing Qiskit Aer simulation with theoretical fidelity F = 1 - p/2
              </p>
            </div>
            <button
              onClick={handleRunSweep}
              disabled={isSweeping}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: isSweeping ? 'rgba(168, 85, 247, 0.3)' : 'var(--accent-purple)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: isSweeping ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isSweeping ? (
                <>
                  <div className="spinner" style={{ width: '12px', height: '12px', borderTopColor: 'var(--text-primary)' }} />
                  <span>Computing Parameter Sweep...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>Run Parameter Sweep</span>
                </>
              )}
            </button>
          </div>

          {sweepError && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.65rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '6px',
                color: 'var(--color-danger)',
                fontSize: '0.74rem'
              }}
            >
              {sweepError}
            </div>
          )}

          {sweepResult && (
            <div>
              <NoiseSweepChart
                points={sweepResult.points}
                classicalThreshold={sweepResult.classical_threshold}
                width={800}
                height={260}
              />

              <div
                style={{
                  marginTop: '1rem',
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Scientific Trend Analysis:
                </div>
                {sweepResult.explanation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QASM Modal */}
      {showQasmModal && experimentResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowQasmModal(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={18} color="var(--color-info)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Teleportation Circuit QASM
                </h3>
              </div>
              <button
                onClick={() => setShowQasmModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <pre
              style={{
                background: '#090d16',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '1rem',
                fontSize: '0.75rem',
                color: 'var(--color-info)',
                fontFamily: 'monospace',
                overflowX: 'auto',
                margin: 0,
              }}
            >
              {experimentResult.circuit.qasm}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};
