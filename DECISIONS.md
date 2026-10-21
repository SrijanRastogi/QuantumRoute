# QuantumRoute — Architectural & Scientific Decision Records (`DECISIONS.md`)

**Document Status:** Active Decision Records  
**Authority:** [PLAN.md](file:///d:/QiskitFallFest/PLAN.md)  
**Maintenance Rule:** If any assumption or architectural choice appears incorrect, ambiguous, or requires change, log it here as an Open Question. Never silently modify approved decisions.

---

## 1. Adopted Decisions — Phase 1: Baseline MVP

### ADR-001: Simulator-First Architecture via Qiskit Aer
- **Status:** Approved (`PLAN.md` §1, §3)
- **Decision:** Implement all quantum circuits, state simulations, and noise experiments locally using Qiskit and Qiskit Aer density-matrix/statevector simulators.
- **Consequences:** Instant, reproducible test feedback. Eliminates external API dependencies and quota exhaustion risks.

### ADR-002: Coherent Corrections (Deferred Measurement) for Teleportation MVP
- **Status:** Approved (`PLAN.md` §6)
- **Decision:** The initial MVP teleportation circuit uses coherent corrections (conditional `cx` and `cz` gates) to simulate the mathematically equivalent post-correction state on Bob's qubit.
- **Consequences:** Seamless execution across standard Qiskit Aer simulator versions without mid-circuit dynamic branching overhead.

### ADR-003: Werner-Link Network Model and Logarithmic Edge Costs
- **Status:** Approved (`PLAN.md` §5.1, §5.2)
- **Decision:** Model each link as a 2-qubit isotropic Werner state $\rho_W(w) = w|\Phi^+\rangle\langle\Phi^+| + (1-w)\frac{I_4}{4}$ with $w_e \in (0, 1]$. Under the declared assumptions of ideal swapping, $w_{\text{path}} = \prod_{e \in P} w_e$. Route quality maximization maps to Dijkstra shortest-path with additive edge weights $c_e = -\ln(w_e)$.
- **Consequences:** Dijkstra guarantees the exact quality-optimal path in $O(|E| + |V|\log|V|)$. Precludes invalid direct multiplication of Bell fidelities.

### ADR-004: End-to-End Entanglement Swapping Followed by Single Teleportation
- **Status:** Approved (`PLAN.md` §4, §5)
- **Decision:** A multi-hop connection establishes end-to-end entanglement between endpoints via intermediate entanglement swapping first; teleportation is performed exactly once between source and destination using the resulting end-to-end pair.
- **Consequences:** Accurately models standard quantum repeater network theory. Differentiates graph routing from payload transport.

### ADR-005: Streamlit Framework for Demo Dashboard
- **Status:** Approved (`PLAN.md` §8)
- **Decision:** Build the user interface as a modular Streamlit application (`src/quantumroute/app.py` with alias in `app/streamlit_app.py`).
- **Consequences:** Runs directly in the Python runtime and calls the exact same functions evaluated in `pytest`. Rapid UI turnaround without JavaScript build dependencies.

### ADR-006: Exact Density-Matrix Simulation Before Finite-Shot Sampling
- **Status:** Approved (`PLAN.md` §5.4, §14)
- **Decision:** The MVP prioritized exact density-matrix and statevector simulation to validate theoretical predictions within machine precision ($\epsilon \le 10^{-5}$). Finite-shot sampling is introduced as an advanced mode in Phase 2.
- **Consequences:** Clean, deterministic unit tests. Eliminates flaky test runs caused by shot noise.

---

## 2. Adopted Decisions — Phase 2: Qualifier-Winning Competitive Upgrades

### ADR-007: Realistic Telecom Optical Fiber Attenuation Modeling ($\alpha = 0.2\,\text{dB/km}$)
- **Status:** Approved (Phase 2 Upgrade)
- **Context:** To distinguish QuantumRoute from generic AI-generated toy projects, link quality parameters must be grounded in real optical physics rather than arbitrary numbers.
- **Decision:** Model physical telecom silica optical fiber attenuation at $1550\,\text{nm}$ using the standard attenuation coefficient $\alpha = 0.2\,\text{dB/km}$. Transmission probability over link length $L$ (in km) is evaluated as $\eta(L) = 10^{-\alpha L / 10}$. Effective Werner parameter is derived taking into account detector dark counts:
  $$w(L) = \frac{\eta(L)}{\eta(L) + 2 p_{\text{dark}}}$$
- **Consequences:** Enables network operators to evaluate realistic repeater placement and geographic fiber links (e.g., Belagavi to Bengaluru).

### ADR-008: Pauli Basis Quantum State Tomography (Finite-Shot Linear Inversion)
- **Status:** Approved (Phase 2 Upgrade)
- **Context:** In physical quantum experiments, Bob cannot inspect the density matrix directly due to the No-Cloning Theorem and measurement collapse. Experimental fidelity must be estimated from finite measurement statistics.
- **Decision:** Implement a realistic Quantum State Tomography engine measuring Bob's qubit across Pauli observables $X$, $Y$, and $Z$ with finite shots (1024, 4096). Reconstruct the density matrix using Stokes linear inversion:
  $$\rho_{\text{reconstructed}} = \frac{1}{2}\left(I + \langle X \rangle \sigma_x + \langle Y \rangle \sigma_y + \langle Z \rangle \sigma_z\right)$$
- **Consequences:** Directly demonstrates advanced experimental quantum mechanics in the demonstration video and dashboard. Shows statistical convergence $O(1/\sqrt{\text{shots}})$ toward theoretical limits.

### ADR-009: BBPSSW Entanglement Purification Protocol for Sub-Threshold Links
- **Status:** Approved (Phase 2 Upgrade)
- **Context:** Links with $w \le 1/3 \iff F \le 0.5$ cannot support quantum teleportation above the classical limit ($2/3$). Real quantum repeaters execute entanglement distillation to recover high-fidelity pairs.
- **Decision:** Implement a 1-step Bennett et al. (BBPSSW) entanglement purification protocol using local bilateral CNOTs and parity measurements on auxiliary Bell pairs to distill higher-fidelity entanglement before teleportation.
- **Consequences:** Proves deep mastery of quantum repeater architecture to hackathon judges.

### ADR-010: Dynamic $N$-Hop Quantum Circuit Compilation for Repeater Chains
- **Status:** Approved (Phase 2 Upgrade — Completed in QR-011)
- **Context:** The Phase 1 MVP used an analytical fallback for repeater paths with $\ge 4$ hops.
- **Decision:** Eliminate the analytical shortcut in `swapping.py`. Implement a programmatic quantum circuit builder that allocates $2N$ qubits for an arbitrary $N$-hop path, executes sequential Bell measurements with coherent feedforward corrections, and extracts the exact 2-qubit end-to-end reduced state.
- **Consequences:** Truly scalable quantum circuit simulation for arbitrarily large network topologies. Verified on 4-hop and 5-hop exact density matrix circuits.

### ADR-011: Multi-Objective Routing Balancing Entanglement Quality and Classical Fiber Signaling Delay
- **Status:** Approved (Phase 2 Upgrade — Completed in QR-012)
- **Context:** Classical optical propagation delay in silica fiber ($5.0\,\mu\text{s/km}$) can introduce latency in real-time quantum key distribution (QKD) and quantum cloud coordination, while minimizing hop count alone ignores link entanglement quality.
- **Decision:** Implement dual-metric Pareto routing formulation parameterized by a trade-off factor $\alpha \in [0.0, 1.0]$:
  $$\text{Cost}(e) = (1 - \alpha) \cdot (-\ln w_e) + \alpha \cdot \text{Delay}(L_e)$$
  When $\alpha = 0$, routing strictly maximizes Werner fidelity. When $\alpha = 1$, routing strictly minimizes end-to-end signaling latency. Intermediate $\alpha$ yields the Pareto frontier.
- **Consequences:** Enables quantum network operators to optimize real geographic deployments (such as the Karnataka Quantum Backbone) for both fidelity and latency.

---

## 3. Resolved Decisions & Open Questions

### OQ-001: Python Runtime & Dependency Pinning
- **Resolution:** Python 3.12/3.13 local virtual environment verified. Qiskit 1.4.6, Aer 0.18.0, NetworkX 3.7, Streamlit 1.66.0, Plotly 7.1.0 pinned in `requirements.txt`.
- **Status:** `RESOLVED`

### OQ-002: Team Member Role Assignments
- **Resolution:** Confirmed in `TEAM_WORK_SPLIT.md`.
- **Status:** `RESOLVED`

### OQ-003: Official GitHub Repository Remote & Permissions
- **Resolution:** Clean repository tracking `origin/main` at `https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-quantum-d-clan.git`.
- **Status:** `RESOLVED`

### OQ-004: Inclusion of Physical Fiber Damping & $T_1/T_2$ Models
- **Resolution:** Promoted from deferred status to active implementation in Phase 2 under Task `QR-009` (ADR-007).
- **Status:** `RESOLVED / ACTIVE IN PHASE 2`
