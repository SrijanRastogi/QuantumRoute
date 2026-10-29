import React, { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Code2,
  Sparkles,
  Radio,
  Layers,
  ChevronRight
} from 'lucide-react';
import { EquationCard, MathBlock, MathInline } from './MathView';

export const DocumentationLab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'math' | 'adrs' | 'physics' | 'purification' | 'api'>('math');

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={18} color="var(--text-primary)" />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Documentation &amp; Scientific Specifications
              </h1>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(14, 165, 233, 0.2)', border: '1px solid rgba(14, 165, 233, 0.4)', color: 'var(--color-info)' }}>
                QuantumRoute V2 Master Reference
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Comprehensive mathematical foundations, architectural invariants, and live FastAPI interactive endpoint schemas.
            </p>
          </div>

          {/* Direct API Explorer Links */}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(14, 165, 233, 0.15)',
                border: '1px solid rgba(14, 165, 233, 0.4)',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                color: 'var(--color-info)',
                fontSize: '0.76rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>FastAPI Swagger UI</span>
              <ExternalLink size={13} />
            </a>

            <a
              href="http://127.0.0.1:8000/redoc"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--surface-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                color: 'var(--text-secondary)',
                fontSize: '0.76rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>ReDoc Explorer</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Main Layout: Sub-navigation Tabs Left, Document Body Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Navigation Rail */}
        <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {[
            { id: 'math', label: '1. Mathematical Invariants', icon: ShieldCheck },
            { id: 'adrs', label: '2. Architecture Decisions (ADR)', icon: Layers },
            { id: 'physics', label: '3. Physical Channel Modeling', icon: Radio },
            { id: 'purification', label: '4. BBPSSW Purification Protocol', icon: Sparkles },
            { id: 'api', label: '5. Complete REST API Directory', icon: Code2 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: activeSection === item.id ? 'rgba(14, 165, 233, 0.18)' : 'transparent',
                color: activeSection === item.id ? 'var(--color-info)' : 'var(--text-secondary)',
                fontWeight: activeSection === item.id ? 700 : 500,
                fontSize: '0.76rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <item.icon size={15} />
                <span>{item.label}</span>
              </div>
              {activeSection === item.id && <ChevronRight size={14} />}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="glass-panel" style={{ padding: '1.5rem', lineHeight: 1.6 }}>

          {/* SECTION 1: MATHEMATICAL INVARIANTS */}
          {activeSection === 'math' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Mathematical Invariants (PLAN.md §5)
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                These equations represent invariant ground truth across all QuantumRoute calculations and Qiskit simulations.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <EquationCard
                  title="1. Isotropic Werner Link Representation"
                  badge="PLAN.md §5.1"
                  accentColor="var(--color-info)"
                  math={`\\rho_W(w) = w |\\Phi^+\\rangle\\langle\\Phi^+| + (1 - w) \\frac{I_4}{4}, \\qquad w \\in [0, 1]`}
                  description={
                    <div>
                      <div>
                        Each network edge provides an isotropic two-qubit Werner state interpolating between a maximally entangled Bell pair and completely unpolarized white noise.
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Canonical Bell State &amp; Link Fidelity:</span>
                        <MathInline math={`|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}`} />
                        <span style={{ color: 'var(--color-info)' }}>⟹</span>
                        <MathInline math={`F_e = \\langle\\Phi^+|\\rho_W|\\Phi^+\\rangle = \\frac{1 + 3w}{4}`} />
                      </div>
                    </div>
                  }
                  variables={[
                    { symbol: 'w', meaning: 'Werner noise parameter (1 = pure Bell state, 0 = maximally mixed I/4)' },
                    { symbol: 'F_e', meaning: 'Bell state overlap fidelity relative to |Φ⁺⟩ ∈ [0.25, 1.0]' },
                    { symbol: 'I_4', meaning: '4×4 maximally mixed identity density matrix' },
                  ]}
                />

                <EquationCard
                  title="2. Multi-Hop Path Composition Under Ideal Swapping"
                  badge="PLAN.md §5.2"
                  accentColor="var(--accent-violet)"
                  math={`w_{\\text{path}} = \\prod_{e \\in P} w_e \\qquad \\Longrightarrow \\qquad F_{e,\\text{path}} = \\frac{1 + 3 w_{\\text{path}}}{4}`}
                  description={
                    <div>
                      <div style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: '0.35rem' }}>
                        ⚠️ Crucial Invariant: Werner parameters multiply along paths, NEVER state fidelities directly.
                      </div>
                      <div>
                        Under Werner-state link assumptions with ideal Bell-State Measurement (BSM) swapping and feedforward Pauli corrections, path noise parameters compound multiplicatively. Direct fidelity multiplication is scientifically invalid.
                      </div>
                    </div>
                  }
                  variables={[
                    { symbol: 'P', meaning: 'Set of directed edges forming the multi-hop repeater path' },
                    { symbol: 'w_{\\text{path}}', meaning: 'End-to-end composite path Werner parameter' },
                    { symbol: 'w_e', meaning: 'Individual Werner parameter of edge e' },
                    { symbol: 'F_{e,\\text{path}}', meaning: 'Resulting end-to-end Bell-state fidelity' },
                  ]}
                />

                <EquationCard
                  title="3. Additive Quality-Aware Dijkstra Cost Transformation"
                  badge="PLAN.md §5.3"
                  accentColor="var(--color-success)"
                  math={`c_e = -\\ln(w_e) \\qquad \\Longrightarrow \\qquad \\min_{P} \\sum_{e \\in P} c_e \\;\\equiv\\; \\max_{P} \\prod_{e \\in P} w_e`}
                  description={
                    <div>
                      Because Werner parameter multiplication maximizes total quality, taking the negative natural logarithm converts the product into an additive non-negative shortest path formulation. Dijkstra's algorithm is guaranteed to find the globally optimal end-to-end fidelity path.
                    </div>
                  }
                  variables={[
                    { symbol: 'c_e', meaning: 'Non-negative edge weight: c_e ∈ [0, ∞) for w_e ∈ (0, 1]' },
                    { symbol: 'w_e = 0', meaning: 'Unusable links pruned with infinite cost (c_e = +∞)' },
                  ]}
                />

                <EquationCard
                  title="4. Horodecki Average Single-Qubit Teleportation Fidelity"
                  badge="PLAN.md §5.4"
                  accentColor="var(--color-warning)"
                  math={`F_{\\text{tel,avg}} = \\frac{2 F_{e,\\text{path}} + 1}{3} = \\frac{1 + w_{\\text{path}}}{2}`}
                  description={
                    <div>
                      The state-averaged fidelity achieved when teleporting an arbitrary unknown single-qubit quantum state over the distributed Bell pair using the standard 2-bit classical feedforward protocol.
                      <div style={{ marginTop: '0.45rem', padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-block' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-warning)' }}>Classical Limit: </span>
                        <MathInline math={`F_{\\text{classical}} = \\frac{2}{3} \\approx 0.6667`} />
                        <span style={{ marginLeft: '0.5rem', color: 'var(--text-primary)' }}>Any teleportation fidelity with <MathInline math={`F_{\\text{tel}} > 2/3`} /> verifies strictly non-classical quantum channel transfer.</span>
                      </div>
                    </div>
                  }
                  variables={[
                    { symbol: 'F_{\\text{tel,avg}}', meaning: 'Average teleportation fidelity across all Haar-random pure input states' },
                    { symbol: 'F_{\\text{classical}}', meaning: 'Upper bound achievable via classical measure-and-prepare strategies' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* SECTION 2: ARCHITECTURE DECISION RECORDS */}
          {activeSection === 'adrs' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Architecture Decision Records (ADRs)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8rem' }}>
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                  <b style={{ color: 'var(--color-info)' }}>ADR-001: Separation of Routing Engine from Quantum Simulation</b>
                  <p style={{ margin: '0.35rem 0', color: 'var(--text-secondary)' }}>
                    Classical routing operates on graph abstractions using NetworkX with cost metrics <MathInline math={`c_e = -\\ln(w_e)`} />. Circuit synthesis and simulation are completely decoupled into Qiskit Aer.
                  </p>
                </div>

                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                  <b style={{ color: 'var(--accent-violet)' }}>ADR-002: Coherent Deferred-Measurement Feedforward Corrections</b>
                  <p style={{ margin: '0.35rem 0', color: 'var(--text-secondary)' }}>
                    Intermediate Bell measurements apply CX and CZ feedforward gates to the next stage before tracing out intermediate repeater qubits. This mathematically reproduces exact post-correction states without dynamic mid-circuit branching.
                  </p>
                </div>

                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                  <b style={{ color: 'var(--color-success)' }}>ADR-003: Distinction Between Photon Loss and State Mixedness</b>
                  <p style={{ margin: '0.35rem 0', color: 'var(--text-secondary)' }}>
                    Silica fiber absorption causes photon loss (erasure events affecting transmission yield), whereas dark counts and detector jitter introduce depolarizing mixed-state noise affecting Werner parameter w.
                  </p>
                </div>

                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                  <b style={{ color: 'var(--color-warning)' }}>ADR-004: Raw Bell-Diagonal Output Before Twirling in Purification</b>
                  <p style={{ margin: '0.35rem 0', color: 'var(--text-secondary)' }}>
                    The BBPSSW protocol produces an anisotropic Bell-diagonal state <MathInline math={`(c_1, c_2, c_3, c_4)`} />. The lab reports both the raw decomposed coefficients and the twirled scalar Werner parameter <MathInline math={`w_{\\text{twirled}} = \\frac{4F - 1}{3}`} />.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: PHYSICAL CHANNELS */}
          {activeSection === 'physics' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Physical Optical Fiber &amp; Channel Physics
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ background: 'var(--surface-inset)', padding: '0.85rem', borderRadius: '8px' }}>
                  <b style={{ color: 'var(--color-info)' }}>Beer-Lambert Attenuation:</b>
                  <MathBlock math={`\\text{Loss}_{\\text{dB}} = \\alpha L, \\qquad \\eta_{\\text{fiber}} = 10^{-\\alpha L / 10}`} />
                  <div>
                    Standard telecom silica fiber at 1550 nm: <MathInline math={`\\alpha = 0.20\\ \\text{dB/km}`} />. Total transmittance includes coupling efficiency: <MathInline math={`\\eta_{\\text{total}} = \\eta_{\\text{coupling}} \\cdot \\eta_{\\text{fiber}}`} />.
                  </div>
                </div>

                <div style={{ background: 'var(--surface-inset)', padding: '0.85rem', borderRadius: '8px' }}>
                  <b style={{ color: 'var(--accent-violet)' }}>Latency &amp; Quantum Memory Decoherence:</b>
                  <MathBlock math={`t_{\\text{prop}} = 5.0\\ \\mu\\text{s/km} \\quad (n_{\\text{silica}} = 1.4682)`} />
                  <MathBlock math={`F_{\\text{mem}}(t) = \\frac{1}{2} + \\left(F_{\\text{init}} - \\frac{1}{2}\\right) e^{-t / T_2}`} />
                  <div>
                    Memory relaxation scales exponentially with storage time <MathInline math={`t`} /> relative to the coherence time <MathInline math={`T_2`} />.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: PURIFICATION */}
          {activeSection === 'purification' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Two-Pair BBPSSW Recurrence Protocol
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p>
                  Bennett et al. (PRL 1996) recurrence protocol operates on two identical noisy Werner pairs to distill a single higher-fidelity pair using bilateral local CNOTs.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <EquationCard
                    title="Round Success Probability"
                    badge="BBPSSW §1"
                    accentColor="var(--color-info)"
                    math={`P_{\\text{succ}}(w) = \\frac{w^2 + 1}{2}`}
                    description="Probability that Alice and Bob obtain identical parity outcomes and keep the distilled pair."
                    variables={[{ symbol: 'w', meaning: 'Input Werner parameter of each of the two raw pairs' }]}
                  />
                  <EquationCard
                    title="Purified Output Fidelity"
                    badge="BBPSSW §2"
                    accentColor="var(--color-success)"
                    math={`F_{\\text{out}}(w) = \\frac{5w^2 + 2w + 1}{4\\left(w^2 + 1\\right)}`}
                    description="Output Bell-state fidelity after a successful bilateral CNOT round."
                  />
                  <EquationCard
                    title="Purification Threshold"
                    badge="BBPSSW §3"
                    accentColor="var(--color-warning)"
                    math={`F_{\\text{in}} > \\frac{1}{2} \\quad \\Longleftrightarrow \\quad w_{\\text{in}} > \\frac{1}{3}`}
                    description="Below this threshold the protocol degrades the state toward white noise instead of purifying it."
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: COMPLETE API DIRECTORY */}
          {activeSection === 'api' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Active REST API Endpoints Directory
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.45rem' }}>Method</th>
                    <th style={{ padding: '0.45rem' }}>Endpoint</th>
                    <th style={{ padding: '0.45rem' }}>Module</th>
                    <th style={{ padding: '0.45rem' }}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { m: 'GET', p: '/api/network/topologies', mod: 'Network', d: 'List preset network topologies' },
                    { m: 'POST', p: '/api/network/route', mod: 'Network', d: 'Compute optimal paths (BFS, Dijkstra, Multi)' },
                    { m: 'POST', p: '/api/simulate', mod: 'Network', d: 'Execute 2N-qubit swapping circuit on Qiskit Aer' },
                    { m: 'POST', p: '/api/experiments/teleport', mod: 'Experiments', d: 'Run single-qubit teleportation experiment' },
                    { m: 'POST', p: '/api/channels/link', mod: 'Channels', d: 'Evaluate physical link transmission vs quality' },
                    { m: 'POST', p: '/api/purification/evaluate', mod: 'Purification', d: 'Calculate BBPSSW analytical recurrence output' },
                    { m: 'POST', p: '/api/purification/simulate-shots', mod: 'Purification', d: 'Finite-shot Aer purification Monte Carlo' },
                    { m: 'POST', p: '/api/qasm/export', mod: 'QASM', d: 'Compile circuit to OpenQASM 3.0' },
                    { m: 'GET', p: '/api/validation/benchmarks', mod: 'Validation', d: 'Execute multi-hop analytical vs simulation tests' },
                    { m: 'POST', p: '/api/analysis/tomography', mod: 'State Analysis', d: 'Finite-shot Pauli state tomography' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.5rem 0.45rem', fontWeight: 700, color: row.m === 'GET' ? 'var(--color-info)' : 'var(--color-success)' }}>{row.m}</td>
                      <td style={{ padding: '0.5rem 0.45rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{row.p}</td>
                      <td style={{ padding: '0.5rem 0.45rem', color: 'var(--accent-violet)' }}>{row.mod}</td>
                      <td style={{ padding: '0.5rem 0.45rem', color: 'var(--text-secondary)' }}>{row.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DocumentationLab;
