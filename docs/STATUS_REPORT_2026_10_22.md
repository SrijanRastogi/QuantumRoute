# QuantumRoute — Comprehensive Daily Status Report

**Date:** 2026-10-22  
**Team:** Quantum D Clan  
**Team ID:** `VTU-QFF-HC-0126`  
**Track:** Quantum Communication & Networking  
**Event:** VTU-Qiskit Fall Fest 2026 Hackathon (VTU Belagavi)  
**Authors:** Yuvaraj B Sutar, Srijan Rastogi, Veeresh M A  

---

## 1. Executive Summary

Today, the Quantum D Clan completed the entire Phase 2 Competitive Upgrade milestone suite (`QR-009`, `QR-010`, `QR-011`, `QR-012`, `QR-013`, and `QR-014`). These packages transform the baseline MVP into an advanced, scientifically grounded, and competition-winning quantum networking simulator.

### Key Milestones Achieved:
1. **Dynamic $N$-Hop Swapping Engine (`QR-011`):** Scalable compilation of $2N$-qubit circuits with intermediate Bell measurements and coherent feedforward, eliminating analytical shortcuts up to 5 hops ($1024 \times 1024$ density matrix).
2. **Real Telecom Topologies & Multi-Metric Routing (`QR-012`):** Modeled the authentic **Karnataka Quantum Backbone** (Belagavi, Hubballi, Davanagere, Shivamogga, Tumakuru, Bengaluru) and implemented dual-objective Pareto optimization balancing quantum Werner fidelity against classical optical propagation latency ($5.0\,\mu\text{s/km}$).
3. **Physical Optical Fiber Attenuation & $T_1/T_2$ Memory Channels (`QR-009`):** Realistic silica fiber attenuation at $1550\,\text{nm}$ ($\alpha = 0.20\,\text{dB/km}$), dark count SNR scaling, and Kraus representations of atomic memory relaxation enforcing $T_2 \le 2T_1$.
4. **BBPSSW Entanglement Distillation Protocol (`QR-010`):** 4-qubit bilateral CNOT quantum distillation with $Z$-basis parity post-selection, proving fidelity enhancement for $F > 0.5$ and characterization of the 3 dynamical fixed points ($F=0.25, 0.50, 1.00$).
5. **Pauli Quantum State Tomography (`QR-013`):** Single-qubit Pauli measurement circuits ($X, Y, Z$) on Qiskit Aer with finite-shot sampling variance, Stokes linear inversion, and physical projection to the Bloch sphere.
6. **Dashboard 2.0 with Universal Visualizer & OpenQASM 3.0 Exporter (`QR-014`):** Production-grade 5-tab demonstration portal with multi-topology switcher, WebGL-free 2D and 3D Bloch sphere visualizers, live multi-round purification simulator, and one-click IBM Quantum hardware exporter.

### Quantitative Verification:
- **Test Suite Growth:** Increased from 38 passing tests to **91 passing tests** across 10 specialized test modules.
- **Pass Rate:** **100% clean pass rate** with 0 failures, 0 warnings, and 0 skipped tests.
- **Execution Time:** Full test suite executes in **~4.4 seconds** locally.

---

## 2. In-Depth Task Breakdown & Implementation Details

### Task QR-011: Arbitrary $N$-Hop Quantum Circuit Swapping Engine
- **Lead Developer:** Srijan Rastogi
- **Core Files:** `src/quantumroute/swapping.py`, `tests/test_swapping.py`
- **Scientific Foundation:**
  - Under ideal swapping and coherent feedforward, path Werner parameters follow the isotropic multiplication theorem:
    $$w_{\text{path}} = \prod_{i=1}^N w_i$$
- **Engineering Changes:**
  - Implemented `build_n_hop_swapping_circuit(link_parameters_or_hops)`: Programmatically allocates $2N$ qubits for an $N$-hop repeater chain.
  - For each intermediate repeater node $k \in \{1, \dots, N-1\}$, applies Bell-state measurement:
    $$\text{CX}(2k-1, 2k) \quad \text{and} \quad \text{H}(2k-1)$$
  - Propagates coherent feedforward corrections to the forward qubit ($2k+1$):
    $$\text{CX}(2k, 2k+1) \quad \text{and} \quad \text{CZ}(2k-1, 2k+1)$$
  - Traces out all $2N-2$ intermediate repeater qubits $[1, \dots, 2N-2]$ via Qiskit's `partial_trace`, leaving an exact 2-qubit reduced density matrix between terminal endpoints $[0, 2N-1]$.
  - Verified exact match with analytical predictions for 1-hop, 2-hop, 3-hop, 4-hop, and 5-hop chains within $\Delta \le 10^{-6}$.
- **Verification:** 9 passed tests in `tests/test_swapping.py`.

---

### Task QR-012: Real-World Telecom Topologies & Multi-Metric Routing
- **Lead Developer:** Srijan Rastogi
- **Core Files:** `src/quantumroute/network.py`, `src/quantumroute/routing.py`, `tests/test_topologies.py`
- **Scientific Foundation:**
  - Standard quantum routing optimizes solely for fidelity ($-\ln w_e$). In real deployments, optical fiber propagation delay ($n \approx 1.468 \implies 5.0\,\mu\text{s/km}$) introduces latency critical to QKD key generation and quantum cloud coordination.
  - Multi-metric composite cost formulation:
    $$\text{Cost}(e) = (1 - \alpha)(-\ln w_e) + \alpha \cdot \text{Delay}(L_e)$$
- **Engineering Changes:**
  - Added `create_karnataka_topology()` connecting 6 authentic regional telecom hubs:
    - Belagavi $\leftrightarrow$ Hubballi ($95\,\text{km}$)
    - Hubballi $\leftrightarrow$ Davanagere ($145\,\text{km}$)
    - Hubballi $\leftrightarrow$ Shivamogga ($195\,\text{km}$)
    - Davanagere $\leftrightarrow$ Shivamogga ($90\,\text{km}$)
    - Davanagere $\leftrightarrow$ Tumakuru ($200\,\text{km}$)
    - Shivamogga $\leftrightarrow$ Tumakuru ($180\,\text{km}$)
    - Tumakuru $\leftrightarrow$ Bengaluru ($70\,\text{km}$)
    - Bengaluru $\leftrightarrow$ Shivamogga Express Link ($280\,\text{km}$)
  - Implemented parametric graph generators: `create_ring_topology()`, `create_star_topology()`, `create_grid_topology()`.
  - Implemented `find_multi_metric_route(graph, source, target, alpha)` and `compare_multi_metric_routes()`.
- **Verification:** 8 passed tests in `tests/test_topologies.py`.

---

### Task QR-009: Physical Fiber Attenuation & $T_1/T_2$ Memory Decoherence
- **Lead Developer:** Yuvaraj B Sutar / Co-Authored
- **Core Files:** `src/quantumroute/physics.py`, `tests/test_physics.py`
- **Scientific Foundation:**
  - Optical telecom transmission at $1550\,\text{nm}$ in standard silica fiber (SMF-28):
    $$\eta(L) = 10^{-\alpha L / 10}, \quad \alpha = 0.20\,\text{dB/km}$$
  - Taking into account detector dark count probability $p_{\text{dark}}$:
    $$w(L) = \frac{\eta(L)}{\eta(L) + 2 p_{\text{dark}}}$$
  - Quantum memory relaxation channels:
    - Amplitude damping parameter: $\gamma = 1 - e^{-\tau / T_1}$
    - Pure dephasing parameter: $\lambda_{\text{phase}} = 1 - e^{-\tau / T_\phi}$, where $\frac{1}{T_2} = \frac{1}{2T_1} + \frac{1}{T_\phi}$
    - Physical invariant enforced: $T_2 \le 2 T_1$.
- **Engineering Changes:**
  - Implemented `calculate_fiber_attenuation_db()`, `calculate_fiber_transmittance()`, `fiber_distance_to_werner_parameter()`, `evaluate_fiber_link()`, and `werner_parameter_to_max_distance()`.
  - Implemented Qiskit Aer Kraus quantum error generators: `make_amplitude_damping_channel()`, `make_phase_damping_channel()`, and `make_quantum_memory_channel()`.
- **Verification:** 7 passed tests in `tests/test_physics.py`.

---

### Task QR-010: BBPSSW Entanglement Purification Protocol
- **Lead Developer:** Yuvaraj B Sutar
- **Core Files:** `src/quantumroute/purification.py`, `tests/test_purification.py`
- **Scientific Foundation:**
  - Bennett et al. (Phys. Rev. Lett. 76, 722, 1996) 2-pair bilateral CNOT protocol.
  - Parity measurement success probability:
    $$P_{\text{succ}}(F) = F^2 + \frac{2}{3}F(1-F) + \frac{5}{9}(1-F)^2$$
  - Purified Bell fidelity conditional on matching parity ($00$ or $11$):
    $$F' = \frac{F^2 + \frac{1}{9}(1-F)^2}{P_{\text{succ}}(F)}$$
  - Proved dynamical fixed points:
    1. $F = 1.00$: Pure Bell state attractive fixed point ($F'=1.0, P=1.0$).
    2. $F = 0.50$ ($w=1/3$): Unstable classical separability threshold fixed point.
    3. $F = 0.25$ ($w=0.0$): Maximally mixed unpolarized state attractive fixed point.
    4. For all $F \in (0.50, 1.00)$: Strict fidelity enhancement ($F' > F$).
- **Engineering Changes:**
  - Implemented `build_bbpssw_circuit()` (4 qubits, 2 CNOTs: $CX(0 \to 2)$ and $CX(1 \to 3)$).
  - Implemented `project_matching_parity()`, `twirl_to_werner_state()`, `simulate_bbpssw_step()`, and `simulate_multi_round_bbpssw()`.
  - Verified exact match between 4-qubit circuit simulation and closed-form theory ($\Delta \le 10^{-16}$).
- **Verification:** 9 passed tests in `tests/test_purification.py`.

---

### Task QR-013: Quantum State Tomography & Finite-Shot Engine
- **Lead Developer:** Veeresh M A
- **Core Files:** `src/quantumroute/tomography.py`, `tests/test_tomography.py`
- **Scientific Foundation:**
  - Linear Stokes inversion for single-qubit density matrix:
    $$\rho = \frac{1}{2}\left(I + \langle X \rangle \sigma_x + \langle Y \rangle \sigma_y + \langle Z \rangle \sigma_z\right)$$
  - Pauli observable measurement gates:
    - $Z$: Direct computational measurement
    - $X$: $H \to \text{Measure}$
    - $Y$: $S^\dagger \to H \to \text{Measure}$
  - Statistical variance for $N$ shots: $\sigma_{B} = \sqrt{\frac{1 - \langle B \rangle^2}{N_{\text{shots}}}}$.
- **Engineering Changes:**
  - Implemented `build_tomography_circuits()`, `execute_tomography()`, `sample_density_matrix_tomography()`, and `reconstruct_density_matrix()`.
  - Implemented physical projection: if shot noise pushes $\|\vec{r}\| > 1$, rescales $\vec{r} \to \vec{r}/\|\vec{r}\|$ to preserve trace 1, Hermiticity, and positive semi-definiteness.
  - Verified $O(1/\sqrt{N})$ convergence from 256 to 16,384 shots and Bloch vector contraction $r = 1 - p$ under depolarizing noise.
- **Verification:** 8 passed tests in `tests/test_tomography.py`.

---

### Task QR-014: Dashboard 2.0 & Production Engineering Upgrades
- **Lead Developer:** Veeresh M A / Co-Authored
- **Core Files:** `src/quantumroute/app.py`, `app/streamlit_app.py`, `.streamlit/config.toml`, `run_dashboard.sh`
- **Key Modules & UI Architecture:**
  - **Tab 1: Multi-Topology Routing:** Dynamic topology switcher, interactive Plotly network maps with highlighted paths, latency/distance callouts.
  - **Tab 2: Interactive Bloch Sphere & Tomography:**
    - **Dual-Mode Visualizer:** Default **2D Orthogonal Projections (XZ & XY planes)** that use 100% SVG/Canvas requiring zero WebGL (eliminating browser canvas crashes), with optional toggle to 3D.
    - Live Pauli observables $\langle X \rangle, \langle Y \rangle, \langle Z \rangle$, purity, and confidence intervals.
  - **Tab 3: Circuit Swapping Validation (QR-006 & QR-011):** Benchmarks for 1 to 4 hops cached with `@st.cache_data`.
  - **Tab 4: Fiber Optics & BBPSSW Distillation:** Interactive attenuation sliders and live multi-round distillation cascade simulator.
  - **Tab 5: OpenQASM 3.0 Hardware Exporter:** One-click copy and download for QASM 3.0 and standalone Qiskit Python submission scripts.

---

## 3. Critical Production Bug Diagnoses & Resolutions

| # | Issue Observed | Root Cause | Permanent Resolution |
|---|---|---|---|
| 1 | `ModuleNotFoundError: No module named 'quantumroute'` | Direct execution via `streamlit run src/quantumroute/app.py` set `sys.path[0]` to script directory instead of repository root. | Added dynamic `_src_dir` path bootstrapping at top of `app.py` and registered `quantumroute.pth` in `.venv`. |
| 2 | `TypeError: fiber_distance_to_werner_parameter()` | Keyword argument mismatch (`dark_count_prob` passed vs. `p_dark` expected). | Added `dark_count_prob` alias in `physics.py` and updated `app.py` to pass `p_dark=p_dark`. |
| 3 | `'RouteResult' object has no attribute 'hop_count'` | Field was named `num_hops` in `RouteResult` dataclass. | Added `@property def hop_count`, `@property def total_latency_us`, and `@property def metrics` to `RouteResult`. |
| 4 | `3D bloch sphere says WebGL not supported by your browser` | Plotly 3D requires hardware WebGL, which fails in virtual machines or browsers with hardware acceleration off. | Added 2D Orthogonal Cross-Section mode (XZ & XY planes) using pure SVG/Canvas that works in 100% of browsers without WebGL. |
| 5 | `Segmentation fault (core dumped)` on Streamlit startup | 1. Streamlit defaulted to non-headless mode and called `webbrowser.open()`, which invoked `os.fork()`. In a process where OpenMP is active, calling `fork()` is an unsafe POSIX violation.<br>2. Python 3.14 on Linux glibc exhausts static TLS if `libgomp.so.1` is dynamically loaded on a non-main thread. | 1. Configured `.streamlit/config.toml` with `headless = true`.<br>2. Implemented automated `LD_PRELOAD` bootstrapping via `os.execv` in `streamlit`, `app.py`, and `run_dashboard.sh`. |
| 6 | Hardcoded port `8501` | Hardcoding a fixed port prevents auto-fallback and breaks cloud deployments using `$PORT`. | Removed `port = 8501` from `config.toml` and made `run_dashboard.sh` dynamically bind to `$PORT` if set. |

---

## 4. Verification & Regression Test Log

```text
============================= test session starts ==============================
platform linux -- Python 3.14.4, pytest-9.1.1, pluggy-1.7.0
rootdir: /home/srijan-rastogi/Coding/vtu-hc-quantum-d-clan
configfile: pytest.ini
collected 91 items

tests/test_environment.py (2 tests)   PASSED  [  2%]
tests/test_network.py (10 tests)       PASSED  [ 13%]
tests/test_noise.py (8 tests)          PASSED  [ 21%]
tests/test_physics.py (7 tests)        PASSED  [ 29%]
tests/test_purification.py (9 tests)   PASSED  [ 39%]
tests/test_routing.py (10 tests)       PASSED  [ 50%]
tests/test_swapping.py (9 tests)       PASSED  [ 60%]
tests/test_teleport.py (8 tests)       PASSED  [ 69%]
tests/test_tomography.py (8 tests)     PASSED  [ 78%]
tests/test_topologies.py (8 tests)     PASSED  [ 86%]
tests/test_validate.py (12 tests)      PASSED  [100%]

============================== 91 passed in 4.38s ==============================
```

---

## 5. Next Recommended Step: Final Submission Bundle (Task QR-008)

With all Phase 1 and Phase 2 code packages verified and tested with 100% pass rate:
1. Rehearse the 3-minute video presentation walking through the 5 tabs in Dashboard 2.0.
2. Finalize `README.md` with dashboard screenshots.
3. Submit the final repository to the VTU hackathon portal.
