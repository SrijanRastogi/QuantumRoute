# QuantumRoute — Task Breakdown & Work Packages (`TASKS.md`)

**Document Status:** Active Execution Plan (Phase 1 Baseline MVP Complete; Phase 2 Advanced Competitive Upgrades Active)  
**Source of Truth:** [PLAN.md](file:///d:/QiskitFallFest/PLAN.md) (§10, §11, §17) & [TEAM_WORK_SPLIT.md](file:///d:/QiskitFallFest/TEAM_WORK_SPLIT.md)  
**Rule:** Work strictly within assigned packages and allowed files. Record execution output and test passes before marking tasks completed.

---

## 1. Master Task Dependency Graph

```mermaid
flowchart TD
    subgraph Phase 1: Baseline MVP (COMPLETED)
        QR000["QR-000: Environment Setup (DONE)"] --> QR001["QR-001: Teleportation Circuit (DONE)"]
        QR000 --> QR003["QR-003: Werner Model (DONE)"]
        QR001 --> QR002["QR-002: Depolarizing Noise (DONE)"]
        QR003 --> QR004["QR-004: Routing BFS/Dijkstra (DONE)"]
        QR001 --> QR005["QR-005: Swapping Simulation (DONE)"]
        QR004 --> QR006["QR-006: Validation Harness (DONE)"]
        QR005 --> QR006
        QR002 --> QR007["QR-007: Streamlit Dashboard (DONE)"]
        QR004 --> QR007
        QR006 --> QR007
    end

    subgraph Phase 2: Qualifier-Winning Competitive Upgrades (ACTIVE)
        QR002 --> QR009["QR-009: Fiber Physics & T1/T2 (Yuvaraj)"]
        QR005 --> QR010["QR-010: BBPSSW Purification (Yuvaraj)"]
        QR005 --> QR011["QR-011: Arbitrary N-Hop Engine (Srijan)"]
        QR004 --> QR012["QR-012: Real Telecom Topologies (Srijan)"]
        QR001 --> QR013["QR-013: Quantum State Tomography (Veeresh)"]
        QR007 --> QR014["QR-014: Dashboard 2.0 & QASM Exporter (Veeresh)"]
        QR009 --> QR014
        QR010 --> QR014
        QR011 --> QR014
        QR012 --> QR014
        QR013 --> QR014
    end

    QR014 --> QR008["QR-008: Final Submission Bundle (All Members)"]
```

---

## 2. Detailed Task Packages — Phase 1: Baseline MVP (Complete)

### Task QR-000: Isolated Environment & Dependency Verification
- **Owner:** Veeresh M A / Yuvaraj B Sutar
- **Phase:** Milestone 0 (Exit Gate)
- **Status:** `COMPLETE` (Verified on 2026-10-21)
- **Goal:** Establish a verified Python virtual environment with working Qiskit and Qiskit Aer installations.
- **Allowed Files:** `requirements.txt`, `README.md`, `DECISIONS.md`, `pytest.ini`
- **Acceptance Criteria:**
  - [x] Python virtual environment created and activated.
  - [x] All required packages imported cleanly (`qiskit==1.4.6`, `qiskit-aer==0.18.0`, `networkx==3.7`, `streamlit==1.66.0`, `plotly==7.1.0`).
  - [x] Tested versions recorded in `requirements.txt`.
- **Verification Command:** `pytest tests/test_environment.py -v` (2 passed).

---

### Task QR-001: Single-Link Teleportation Circuit & State Fidelity
- **Owner:** Yuvaraj B Sutar
- **Phase:** Milestone 1 (Ideal Teleportation)
- **Status:** `COMPLETE` (Verified on 2026-10-21)
- **Goal:** Implement single-link quantum teleportation with coherent corrections, input state preparation, and state fidelity calculation.
- **Allowed Files:** `src/quantumroute/__init__.py`, `src/quantumroute/teleport.py`, `tests/test_teleport.py`
- **Acceptance Criteria:**
  - [x] `prepare_input_state(theta, phi)` normalizes statevectors deterministically across Bloch sphere.
  - [x] `calculate_state_fidelity()` returns 1.0 for identical states and 0.0 for orthogonal states ($\pm 10^{-6}$).
  - [x] Ideal teleportation achieved with fidelity $> 0.9999$ across 6 cardinal states and 25 random states.
  - [x] Subsystem extraction verified: Bob's state isolated by tracing out qubits 0 and 1.
- **Verification Command:** `pytest tests/test_teleport.py -v` (8 passed).

---

### Task QR-002: Depolarizing Noise Channel & Sweeps
- **Owner:** Yuvaraj B Sutar
- **Phase:** Milestone 2 (Noise & Fidelity)
- **Status:** `COMPLETE` (Verified on 2026-10-21)
- **Goal:** Introduce single-qubit depolarizing channel on distributed link qubit and validate measured fidelity against theory.
- **Allowed Files:** `src/quantumroute/noise.py`, `src/quantumroute/experiments.py`, `tests/test_noise.py`
- **Acceptance Criteria:**
  - [x] Depolarizing channel placement on Bob's distributed qubit (q2) strictly documented.
  - [x] Theoretical formula $F(p) = 1 - p/2$ implemented and verified.
  - [x] Depolarizing noise sweep across $p \in [0.0, 1.0]$ matches theory within numerical tolerance ($\Delta < 1.3 \times 10^{-15}$).
  - [x] Boundary cases verified: zero noise ($p=0 \implies F=1.0$), complete depolarization ($p=1 \implies F=0.5$), classical threshold ($p=2/3 \implies F=2/3$).
- **Verification Command:** `pytest tests/test_noise.py -v` (8 passed).

---

### Task QR-003: Network Topology & Werner Model Mechanics
- **Owner:** Srijan Rastogi
- **Phase:** Milestone 3A (Network Representation)
- **Status:** `COMPLETE` (Verified on 2026-10-21)
- **Goal:** Implement abstract quantum network graph where edges carry Werner parameters $w_e \in [0, 1]$, and evaluate path parameters.
- **Allowed Files:** `src/quantumroute/network.py`, `tests/test_network.py`
- **Acceptance Criteria:**
  - [x] 7-node reference network initialized with defined Werner parameters $w_e \in (0, 1]$.
  - [x] `calculate_path_werner_parameter()` evaluates $w_{\text{path}} = \prod_{e \in P} w_e$.
  - [x] `calculate_predicted_path_fidelity()` evaluates $F_{e,\text{path}} = \frac{1 + 3w_{\text{path}}}{4}$.
  - [x] `calculate_average_teleportation_fidelity()` evaluates $F_{\text{tel,avg}} = \frac{1 + w_{\text{path}}}{2}$.
- **Verification Command:** `pytest tests/test_network.py -v` (10 passed).

---

### Task QR-004: Routing Algorithms (BFS Shortest-Hop vs. Dijkstra Quality-Aware)
- **Owner:** Srijan Rastogi
- **Phase:** Milestone 4 (Routing & Validation)
- **Status:** `COMPLETE` (Verified on 2026-10-21)
- **Goal:** Implement baseline hop-count routing and quality-aware Dijkstra routing using $-\ln(w_e)$ weights.
- **Allowed Files:** `src/quantumroute/routing.py`, `tests/test_routing.py`
- **Acceptance Criteria:**
  - [x] `find_shortest_hop_route()` returns path with minimal edge count.
  - [x] `find_quality_aware_route()` implements Dijkstra with cost $-\ln(w_e)$ and maximizes end-to-end Werner parameter.
  - [x] Dijkstra quality path matches brute-force exhaustive enumeration across all 21 node pairs.
  - [x] Test graph reproduces two distinct divergence pairs (`'A'->'D'` and `'A'->'G'`).
- **Verification Command:** `pytest tests/test_routing.py -v` (10 passed).

---

### Task QR-005: Circuit-Level Entanglement Swapping Simulation
- **Owner:** Srijan Rastogi & Yuvaraj B Sutar / Veeresh M A
- **Phase:** Milestone 3B (Swapping Simulation)
- **Status:** `COMPLETE` (Verified on 2026-10-21)
- **Goal:** Construct and execute multi-hop entanglement swapping quantum circuits with noisy Werner-form Bell pairs.
- **Allowed Files:** `src/quantumroute/swapping.py`, `tests/test_swapping.py`
- **Acceptance Criteria:**
  - [x] Multi-hop circuit correctly instantiates Bell pairs along consecutive edges in a path.
  - [x] Intermediate nodes perform Bell measurements and coherent corrections.
  - [x] End-to-end 2-qubit reduced density matrix extracted for terminal nodes.
  - [x] Output state fidelity calculated against ideal $|\Phi^+\rangle$ across 1-hop, 2-hop, and 3-hop chains.
- **Verification Command:** `pytest tests/test_swapping.py -v` (6 passed).

---

### Task QR-006: Predicted vs. Circuit-Simulated Validation Harness
- **Owner:** Veeresh M A
- **Phase:** Milestone 4B (Validation)
- **Status:** `COMPLETE` (Verified on 2026-10-21)
- **Goal:** Build validation harness comparing analytical prediction ($F_{e,\text{path}}$) against circuit simulation ($F_{\text{circuit}}$).
- **Allowed Files:** `src/quantumroute/validate.py`, `tests/test_validation.py`
- **Acceptance Criteria:**
  - [x] Compares analytical $F_{\text{pred}}$ with simulated $F_{\text{sim}}$ across 1-hop, 2-hop, and 3-hop paths.
  - [x] Agreement verified within numerical tolerance ($\Delta \le 10^{-4}$) under ideal swapping assumptions.
  - [x] Invariants and discrepancies clearly reported with numerical error deltas; no silent overrides.
  - [x] Validates noise sweep against theoretical fidelity curve.
- **Verification Command:** `pytest tests/test_validation.py -v` (12 passed).

---

### Task QR-007: Streamlit Interactive Dashboard MVP
- **Owner:** Veeresh M A
- **Phase:** Milestone 5 (Dashboard & Presentation)
- **Status:** `COMPLETE` (Verified on 2026-10-21)
- **Goal:** Create single-command Streamlit application exposing all project features and live comparisons.
- **Allowed Files:** `app/streamlit_app.py`, `src/quantumroute/app.py`
- **Acceptance Criteria:**
  - [x] Streamlit dashboard launches locally via `streamlit run src/quantumroute/app.py`.
  - [x] Visualizes network topology and path selections (BFS vs. Dijkstra) using Plotly.
  - [x] Displays interactive depolarizing noise slider with live theoretical vs. simulated curves.
  - [x] Reports validation comparison table and classical threshold reference ($2/3$).
- **Verification Command:** `streamlit run src/quantumroute/app.py --server.headless true`

---

## 3. Detailed Task Packages — Phase 2: Qualifier-Winning Upgrades (Active)

### Task QR-009: Physical Optical Fiber Attenuation & Decoherence Channels ($T_1, T_2$)
- **Owner:** Yuvaraj B Sutar (`Team Lead; Quantum Circuits & Noise`)
- **Phase:** Milestone 7A (Physical Realism — 4 h budget)
- **Status:** `READY TO START`
- **Goal:** Bridge abstract Werner parameters $w$ to physical optical telecom fiber attenuation and atomic memory decoherence.
- **Dependencies:** `QR-002`
- **Allowed Files:** `src/quantumroute/physics.py`, `src/quantumroute/noise.py`, `tests/test_physics.py`
- **Acceptance Criteria:**
  - [ ] Implement fiber attenuation model at $1550\,\text{nm}$ ($\alpha = 0.2\,\text{dB/km}$) with transmission probability $\eta(L) = 10^{-\alpha L / 10}$.
  - [ ] Derive effective link Werner parameter as a function of fiber distance $L$ and detector dark count probability $p_{\text{dark}}$:
    $$w(L) = \frac{\eta(L)}{\eta(L) + 2 p_{\text{dark}}}$$
  - [ ] Implement Amplitude Damping (photon loss, relaxation time $T_1$) and Phase Damping (dephasing time $T_2$) channels in Qiskit Aer.
  - [ ] Unit tests verify: at $L=0\,\text{km} \implies \eta=1.0, w \approx 1.0$; at $L=50\,\text{km} \implies \eta=0.10$; dark count bounds verified.
- **Verification Command:** `pytest tests/test_physics.py -v`

---

### Task QR-010: BBPSSW Entanglement Purification Protocol
- **Owner:** Yuvaraj B Sutar (`Team Lead; Quantum Circuits & Noise`)
- **Phase:** Milestone 7B (Advanced Quantum Protocol — 4 h budget)
- **Status:** `READY TO START`
- **Goal:** Implement the Bennett et al. (BBPSSW) entanglement distillation protocol to rescue sub-threshold links ($w \le 1/3$).
- **Dependencies:** `QR-005`
- **Allowed Files:** `src/quantumroute/purification.py`, `tests/test_purification.py`
- **Acceptance Criteria:**
  - [ ] Implement 2-pair bilateral CNOT circuit with local Pauli twirling and $Z$-basis parity measurements on auxiliary qubits.
  - [ ] Post-select on matching parity outcomes, yielding purified Bell pair with updated fidelity:
    $$F' = \frac{F^2 + \frac{1}{9}(1-F)^2}{F^2 + \frac{2}{3}F(1-F) + \frac{5}{9}(1-F)^2}$$
  - [ ] Prove that for any input Werner state with $F > 0.5$ ($w > 1/3$), $F' > F$.
  - [ ] Unit tests verify purification success probability and fidelity enhancement across varied input fidelities.
- **Verification Command:** `pytest tests/test_purification.py -v`

---

### Task QR-011: Arbitrary $N$-Hop Quantum Circuit Swapping Engine
- **Owner:** Srijan Rastogi (`Network & Routing Lead`)
- **Phase:** Milestone 8A (Circuit Scalability — 4 h budget)
- **Status:** `READY TO START`
- **Goal:** Eliminate the analytical shortcut for paths with $\ge 4$ hops by programmatically building dynamic $2N$-qubit Qiskit circuits for arbitrary $N$-hop repeater chains.
- **Dependencies:** `QR-005`
- **Allowed Files:** `src/quantumroute/swapping.py`, `tests/test_swapping.py`
- **Acceptance Criteria:**
  - [ ] `build_n_hop_swapping_circuit(link_parameters)` dynamically generates a $2N$-qubit circuit for any sequence of $N$ links.
  - [ ] Chains $N-1$ intermediate Bell measurements and coherent feedforward corrections across repeater nodes.
  - [ ] Extracts the exact 2-qubit reduced density matrix between endpoints (qubit 0 and qubit $2N-1$) via partial trace.
  - [ ] Verified across 4-hop and 5-hop chains: circuit simulation matches analytical product $w_{\text{path}} = \prod_{i=1}^N w_i$ within $\Delta \le 10^{-4}$.
- **Verification Command:** `pytest tests/test_swapping.py -v`

---

### Task QR-012: Real-World Telecom Topologies & Multi-Metric Routing
- **Owner:** Srijan Rastogi (`Network & Routing Lead`)
- **Phase:** Milestone 8B (Realistic Networks — 4 h budget)
- **Status:** `READY TO START`
- **Goal:** Provide realistic regional quantum network topologies with geographic fiber distances and dual-metric routing.
- **Dependencies:** `QR-004`, `QR-009`
- **Allowed Files:** `src/quantumroute/network.py`, `src/quantumroute/routing.py`, `tests/test_topologies.py`
- **Acceptance Criteria:**
  - [ ] Add authentic **Karnataka Quantum Backbone** topology preset: Belagavi (0 km) — Hubballi (95 km) — Davanagere (145 km) — Shivamogga (120 km) — Tumakuru (130 km) — Bengaluru (70 km).
  - [ ] Add parametric network generators: Ring ($N$ nodes), Star ($N$ spokes), and Mesh/Grid ($M \times N$).
  - [ ] Implement dual-metric routing optimization:
    $$\text{Cost} = (1 - \alpha) \cdot (-\ln w_e) + \alpha \cdot \text{Delay}(L_e)$$
    balancing quantum fidelity preservation against classical signaling delay ($5\,\mu\text{s/km}$).
- **Verification Command:** `pytest tests/test_topologies.py -v`

---

### Task QR-013: Quantum State Tomography & Finite-Shot Measurement Engine
- **Owner:** Veeresh M A (`Validation & Interface Lead`)
- **Phase:** Milestone 9A (Experimental Quantum Mechanics — 4 h budget)
- **Status:** `READY TO START`
- **Goal:** Implement realistic Pauli basis quantum state tomography with finite shots to model true experimental verification under shot noise.
- **Dependencies:** `QR-001`, `QR-006`
- **Allowed Files:** `src/quantumroute/tomography.py`, `tests/test_tomography.py`
- **Acceptance Criteria:**
  - [ ] Construct Pauli measurement circuits measuring Bob's qubit in $X$ ($H + \text{Measure}$), $Y$ ($S^\dagger H + \text{Measure}$), and $Z$ ($\text{Measure}$) bases.
  - [ ] Execute with finite shots (e.g. 1024, 4096, 8192) on Qiskit Aer to capture realistic shot noise.
  - [ ] Reconstruct density matrix via linear Stokes inversion:
    $$\rho = \frac{1}{2}\left(I + \langle X \rangle \sigma_x + \langle Y \rangle \sigma_y + \langle Z \rangle \sigma_z\right)$$
  - [ ] Verify physical validity of reconstructed state (Hermitian, $\text{Tr}=1$, positive semi-definite).
  - [ ] Validate statistical convergence: as shots increase from 256 to 8192, tomographic fidelity converges toward exact analytical fidelity as $O(1/\sqrt{\text{shots}})$.
- **Verification Command:** `pytest tests/test_tomography.py -v`

---

### Task QR-014: Dashboard 2.0 (3D Bloch Sphere, OpenQASM 3.0 Exporter & Dynamic UI)
- **Owner:** Veeresh M A (`Validation & Interface Lead`)
- **Phase:** Milestone 9B (Presentation & Hardware Integration — 4 h budget)
- **Status:** `READY TO START`
- **Goal:** Upgrade the Streamlit dashboard into a world-class demonstration portal featuring 3D Bloch spheres, dynamic topology design, and direct hardware export.
- **Dependencies:** `QR-007`, `QR-009`, `QR-012`, `QR-013`
- **Allowed Files:** `src/quantumroute/app.py`, `app/streamlit_app.py`
- **Acceptance Criteria:**
  - [ ] **3D Bloch Sphere Visualization:** Render interactive 3D Bloch sphere showing the initial pure state vector $|\psi\rangle$ on the sphere surface, and show it shrink into the interior as depolarizing/damping noise increases.
  - [ ] **Finite-Shot Tomography Toggle:** Allow users to switch between "Exact Density Matrix" and "Realistic Tomography (1024 / 4096 shots)" and see live confidence intervals.
  - [ ] **Topology Switcher:** Allow live selection of the 7-node benchmark, Karnataka Regional Network, or custom fiber distance sliders.
  - [ ] **OpenQASM 3.0 & Qiskit Python Exporter:** One-click copy/download button generating the exact QASM 3.0 / Qiskit code ready to submit to IBM Quantum QPUs (`ibm_brisbane`, `ibm_kyoto`).
- **Verification Command:** `streamlit run src/quantumroute/app.py --server.headless true`

---

### Task QR-008: Regression Verification, Demo Script & Final Artifacts
- **Owner:** All Team Members (Lead: Veeresh M A)
- **Phase:** Milestone 10 (Final Submission — 4 h budget)
- **Status:** `IN PROGRESS`
- **Goal:** Full end-to-end regression testing, documentation polish, rehearsed 3-minute video presentation, and final hackathon portal submission.
- **Dependencies:** `QR-009` through `QR-014`
- **Allowed Files:** `README.md`, `TESTING.md`, `docs/DEMO_SCRIPT.md`, `results/*`
- **Acceptance Criteria:**
  - [ ] All unit tests pass cleanly with 100% pass rate.
  - [ ] 3-minute video recorded following `docs/DEMO_SCRIPT.md` and uploaded to YouTube.
  - [ ] Screenshots embedded in `README.md`.
  - [ ] Final project summary submitted to VTU hackathon portal before deadline.
- **Verification Command:** `pytest -v`
