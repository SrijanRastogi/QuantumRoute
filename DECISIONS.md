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
- **Current State:** Workspace host system runs Python 3.14.0 (`python --version` confirmed). However, compiled binary wheels for Qiskit and Qiskit Aer typically target Python 3.10–3.12 (with emerging support for 3.13).
- **Impact:** Installing Qiskit Aer in Python 3.14 may fail if pre-built wheels are unavailable.
- **Proposed Resolution:** Create a dedicated Python 3.11 or 3.12 virtual environment (e.g., using `uv` or `pyenv`/Windows Python launcher) to test and pin exact working versions in `requirements.txt`.
- **Status:** `OPEN` — Requires team lead confirmation during Task `QR-000`.

### OQ-002: Team Member Role Assignments
- **Current State:** [PLAN.md](file:///d:/QiskitFallFest/PLAN.md) §10 specifies three roles (Member A: Quantum Core; Member B: Network & Routing; Member C: Validation & Interface).
- **Impact:** All tasks in [TASKS.md](file:///d:/QiskitFallFest/TASKS.md) currently have owners marked `UNASSIGNED`.
- **Proposed Resolution:** Assign human team member names to Roles A, B, and C in `TASKS.md` before starting parallel work.
- **Status:** `OPEN` — Awaiting team roster.

### OQ-003: Official GitHub Repository Remote & Permissions
- **Current State:** Current workspace has no Git repository initialized (`fatal: not a git repository`). Organizers created a private repository under their GitHub organization and granted access to the team lead.
- **Impact:** Contributor and agent pushes must be directed only to the verified official remote, never to personal accounts.
- **Proposed Resolution:** Team lead provides the verified remote URL and default branch name, after which the existing workspace is connected to the official repository.
- **Status:** `OPEN` — Pending team lead confirmation.

### OQ-004: Inclusion of Optional Noise Models (Amplitude / Phase Damping)
- **Current State:** [PLAN.md](file:///d:/QiskitFallFest/PLAN.md) §5.4 lists amplitude damping and phase damping as optional features after depolarizing noise MVP validation.
- **Impact:** Expanding noise channels early risks schedule overrun against the 38-hour build budget.
- **Proposed Resolution:** Maintain depolarizing noise as the sole MVP noise model. Review inclusion of amplitude/phase damping only after Milestone 4 is complete.
- **Status:** `DEFERRED` — Scheduled for review at Milestone 4 exit gate.
