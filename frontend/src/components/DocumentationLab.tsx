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

export const DocumentationLab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'math' | 'adrs' | 'physics' | 'purification' | 'api'>('math');

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={18} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                Documentation &amp; Scientific Specifications
              </h1>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(14, 165, 233, 0.2)', border: '1px solid rgba(14, 165, 233, 0.4)', color: '#38bdf8' }}>
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
                color: '#38bdf8',
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
                background: 'rgba(255, 255, 255, 0.04)',
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
                color: activeSection === item.id ? '#38bdf8' : 'var(--text-secondary)',
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
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                Mathematical Invariants (PLAN.md §5)
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                These equations represent invariant ground truth across all QuantumRoute calculations and Qiskit simulations.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.0rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.0rem' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.35rem' }}>
                    1. Isotropic Werner Link Representation
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.4)', padding: '0.6rem 0.85rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                    ρ_W(w) = w |Φ+⟩⟨Φ+| + (1 - w) (I_4 / 4),  w ∈ [0, 1]
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                    Fidelity relative to canonical Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2 is given by <b>F_e = (1 + 3w)/4</b>.
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.0rem' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.35rem' }}>
                    2. Multi-Hop Path Composition Under Ideal Swapping
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.4)', padding: '0.6rem 0.85rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                    w_path = ∏_(e ∈ P) w_e  ⟹  F_e,path = (1 + 3 w_path) / 4
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                    <b>Crucial scientific rule:</b> Werner parameters multiply along paths, <i>never</i> state fidelities F_e directly.
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.0rem' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#34d399', marginBottom: '0.35rem' }}>
                    3. Additive Quality-Aware Dijkstra Cost Transformation
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.4)', padding: '0.6rem 0.85rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                    c_e = -ln(w_e)  ⟹  min ∑ c_e ≡ max ∏ w_e
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                    Maps the multiplicative Werner quality maximization into a strictly positive additive shortest-path problem.
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.0rem' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.35rem' }}>
                    4. Horodecki Average Single-Qubit Teleportation Fidelity
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.4)', padding: '0.6rem 0.85rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                    F_tel,avg = (2 F_e,path + 1) / 3 = (1 + w_path) / 2
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                    The classical limit is 2/3 ≈ 0.6667. Any teleportation fidelity F_tel &gt; 2/3 demonstrates strictly quantum non-classical transfer.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: ARCHITECTURE DECISION RECORDS */}
          {activeSection === 'adrs' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                Architecture Decision Records (ADRs)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                  <b style={{ color: '#38bdf8' }}>ADR-001: Separation of Routing Engine from Quantum Simulation</b>
                  <p style={{ margin: '0.35rem 0', color: 'var(--text-secondary)' }}>
                    Classical routing operates on graph abstractions using NetworkX with cost metrics c_e = -ln(w_e). Circuit synthesis and simulation are completely decoupled into Qiskit Aer.
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                  <b style={{ color: '#c084fc' }}>ADR-002: Coherent Deferred-Measurement Feedforward Corrections</b>
                  <p style={{ margin: '0.35rem 0', color: 'var(--text-secondary)' }}>
                    Intermediate Bell measurements apply CX and CZ feedforward gates to the next stage before tracing out intermediate repeater qubits. This mathematically reproduces exact post-correction states without dynamic mid-circuit branching.
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                  <b style={{ color: '#34d399' }}>ADR-003: Distinction Between Photon Loss and State Mixedness</b>
                  <p style={{ margin: '0.35rem 0', color: 'var(--text-secondary)' }}>
                    Silica fiber absorption causes photon loss (erasure events affecting transmission yield), whereas dark counts and detector jitter introduce depolarizing mixed-state noise affecting Werner parameter w.
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                  <b style={{ color: '#f59e0b' }}>ADR-004: Raw Bell-Diagonal Output Before Twirling in Purification</b>
                  <p style={{ margin: '0.35rem 0', color: 'var(--text-secondary)' }}>
                    The BBPSSW protocol produces an anisotropic Bell-diagonal state (c1, c2, c3, c4). The lab reports both the raw decomposed coefficients and the twirled scalar Werner parameter w_twirled = (4F - 1)/3.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: PHYSICAL CHANNELS */}
          {activeSection === 'physics' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                Physical Optical Fiber &amp; Channel Physics
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '8px' }}>
                  <b style={{ color: '#38bdf8' }}>Beer-Lambert Attenuation:</b>
                  <div style={{ fontFamily: 'var(--font-mono)', margin: '0.35rem 0', color: '#fff' }}>
                    Loss(dB) = α · L,  η_fiber = 10^(-α · L / 10)
                  </div>
                  <div>Standard telecom silica fiber at 1550 nm: α = 0.20 dB/km. Total transmittance includes coupling efficiency: η_total = η_coupling · η_fiber.</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '8px' }}>
                  <b style={{ color: '#c084fc' }}>Latency &amp; Quantum Memory Decoherence:</b>
                  <div style={{ fontFamily: 'var(--font-mono)', margin: '0.35rem 0', color: '#fff' }}>
                    t_prop = 5.0 µs/km  (n_silica = 1.4682)
                  </div>
                  <div>Memory relaxation scales exponentially: F_mem(t) = 1/2 + (F_init - 1/2) · exp(-t / T2).</div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: PURIFICATION */}
          {activeSection === 'purification' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                Two-Pair BBPSSW Recurrence Protocol
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p>
                  Bennett et al. (PRL 1996) recurrence protocol operates on two identical noisy Werner pairs to distill a single higher-fidelity pair using bilateral local CNOTs.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '8px', fontFamily: 'var(--font-mono)' }}>
                  <div>P_succ(w) = (w² + 1) / 2</div>
                  <div style={{ marginTop: '0.4rem', color: '#34d399' }}>
                    F_out = (5w² + 2w + 1) / (4 (w² + 1))
                  </div>
                  <div style={{ marginTop: '0.4rem', color: '#f59e0b' }}>
                    Purification Threshold: F_in &gt; 0.50 (w_in &gt; 1/3)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: COMPLETE API DIRECTORY */}
          {activeSection === 'api' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
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
                      <td style={{ padding: '0.5rem 0.45rem', fontWeight: 700, color: row.m === 'GET' ? '#38bdf8' : '#34d399' }}>{row.m}</td>
                      <td style={{ padding: '0.5rem 0.45rem', fontFamily: 'var(--font-mono)', color: '#fff' }}>{row.p}</td>
                      <td style={{ padding: '0.5rem 0.45rem', color: '#c084fc' }}>{row.mod}</td>
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
