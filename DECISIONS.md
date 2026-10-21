# QuantumRoute — Architectural & Scientific Decision Records (`DECISIONS.md`)

**Document Status:** Baseline Records  
**Authority:** [PLAN.md](file:///d:/QiskitFallFest/PLAN.md)  
**Maintenance Rule:** If any assumption or architectural choice appears incorrect, ambiguous, or requires change, log it here as an Open Question. Never silently modify approved decisions.

---

## 1. Adopted Decisions (Supported by `PLAN.md`)

### ADR-001: Simulator-First Architecture via Qiskit Aer
- **Status:** Approved (`PLAN.md` §1, §3)
- **Context:** Building within a 38-hour hackathon window makes cloud queue times, hardware calibration drifts, and physical QPUs impractical for tight iteration.
- **Decision:** Implement all quantum circuits, state simulations, and noise experiments locally using Qiskit and Qiskit Aer density-matrix/statevector simulators.
- **Consequences:** Provides instant, reproducible test feedback. Eliminates external API dependencies and quota exhaustion risks. Requires explicit labeling that results are numerical simulations, not hardware demonstrations.

### ADR-002: Coherent Corrections (Deferred Measurement) for Teleportation MVP
- **Status:** Approved (`PLAN.md` §6)
- **Context:** Mid-circuit dynamic measurements and classical feedforward control-flow (`if_test`) can introduce backend compatibility constraints or simulator complexity.
- **Decision:** The initial MVP teleportation circuit may use coherent corrections (conditional `cx` and `cz` gates) to simulate the mathematically equivalent post-correction state on Bob's qubit.
- **Consequences:** Ensures seamless execution across all standard Qiskit Aer simulator versions. The project documentation must explicitly state that this is a mathematically equivalent simulation of ideal feedforward, not a physical realization of classical transmission.

### ADR-003: Werner-Link Network Model and Logarithmic Edge Costs
- **Status:** Approved (`PLAN.md` §5.1, §5.2)
- **Context:** Quantum networks suffer from imperfect entanglement generation. A mathematically rigorous yet tractable link model is required.
- **Decision:** Model each link as a 2-qubit isotropic Werner state $\rho_W(w) = w|\Phi^+\rangle\langle\Phi^+| + (1-w)\frac{I_4}{4}$ with $w_e \in (0, 1]$. Under the declared assumptions of ideal swapping and no memory decoherence, path composition obeys $w_{\text{path}} = \prod_{e \in P} w_e$. Route quality maximization is mapped to Dijkstra shortest-path by assigning edge weight $c_e = -\ln(w_e)$.
- **Consequences:** Enables standard Dijkstra's algorithm to compute the exact quality-optimal path in $O(|E| + |V|\log|V|)$. Precludes invalid direct multiplication of Bell fidelities ($F_e$). Disconnected or zero-parameter links ($w_e = 0$) are marked unusable.

### ADR-004: End-to-End Entanglement Swapping Followed by Single Teleportation
- **Status:** Approved (`PLAN.md` §4, §5)
- **Context:** Repeated hop-by-hop teleportation reconstructs and measures quantum states at intermediate nodes, exposing the payload to repeated state-tomography/measurement destruction or node vulnerabilities.
- **Decision:** A multi-hop connection establishes end-to-end entanglement between endpoints via intermediate entanglement swapping first; teleportation is performed exactly once between source and destination using the resulting end-to-end pair.
- **Consequences:** Accurately models standard quantum repeater network theory. Differentiates graph routing from payload transport.

### ADR-005: Streamlit Framework for Demo Dashboard
- **Status:** Approved (`PLAN.md` §8)
- **Context:** A full-stack React/FastAPI setup requires multiple runtimes, API serialization, and deployment coordination, introducing high overhead during a short hackathon.
- **Decision:** Build the user interface as a single-file/modular Streamlit application (`app/streamlit_app.py`).
- **Consequences:** The dashboard runs directly in the Python runtime and calls the exact same functions evaluated in `pytest`. Rapid UI turnaround without JavaScript build dependencies.

### ADR-006: Exact Density-Matrix Simulation Before Finite-Shot Sampling
- **Status:** Approved (`PLAN.md` §5.4, §14)
- **Context:** Finite-shot sampling introduces statistical variance, complicating unit test assertions and automated regression testing.
- **Decision:** The MVP prioritizes exact density-matrix and statevector simulation to validate theoretical predictions within machine precision ($\epsilon \le 10^{-5}$). Finite-shot sampling is strictly deferred until exact validation is verified.
- **Consequences:** Clean, deterministic unit tests. Eliminates flaky test runs caused by shot noise.

---

## 2. Open Questions & Unresolved Decisions

The following items are unresolved baseline questions identified from [PLAN.md](file:///d:/QiskitFallFest/PLAN.md) §14 and the existing workspace environment. They require explicit confirmation from the human team lead before implementation:

### OQ-001: Python Runtime & Dependency Pinning
- **Current State:** Workspace host runs Python 3.14.0. Dedicated Python 3.12.14 virtual environment `.venv` created via `uv`. Qiskit 1.4.6, Qiskit Aer 0.18.0, NumPy 2.5.4, SciPy 1.18.1, and pytest 9.1.1 installed and verified via automated test suite.
- **Resolution:** Python 3.12.14 local `.venv` pinned and tested. All 18 automated tests pass with 100% success rate.
- **Status:** `RESOLVED` (QR-000)

### OQ-002: Team Member Role Assignments
- **Current State:** Team roster and ownership confirmed in `TEAM_WORK_SPLIT.md` and user mission directive.
- **Resolution:**
  - Yuvaraj B Sutar (`YUVA56-gomu`): Team Lead; Quantum Circuit & Noise Lead (`teleport.py`, `noise.py`).
  - Srijan Rastogi (`SrijanRastogi`): Developer; Network Model, Swapping & Routing Lead (`network.py`, `swapping.py`, `routing.py`).
  - Veeresh M A (`Veeresh23-06`): Developer; Environment, Validation, Integration & Dashboard Lead (`validate.py`, `app/`).
- **Status:** `RESOLVED`

### OQ-003: Official GitHub Repository Remote & Permissions
- **Current State:** Workspace Git repository is connected to official organizer remote `https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-quantum-d-clan.git` on branch `main`.
- **Resolution:** Verified clean working tree tracking `origin/main`.
- **Status:** `RESOLVED`

### OQ-004: Inclusion of Optional Noise Models (Amplitude / Phase Damping)
- **Current State:** [PLAN.md](file:///d:/QiskitFallFest/PLAN.md) §5.4 lists amplitude damping and phase damping as optional features after depolarizing noise MVP validation.
- **Impact:** Expanding noise channels early risks schedule overrun against the 38-hour build budget.
- **Proposed Resolution:** Maintain depolarizing noise as the sole MVP noise model. Review inclusion of amplitude/phase damping only after Milestone 4 is complete.
- **Status:** `DEFERRED` — Scheduled for review at Milestone 4 exit gate.
