# QuantumRoute — Master Plan and Source of Truth

**Document status:** Initial baseline — pending team review  
**Project:** QuantumRoute  
**Hackathon:** Qiskit Fall Fest 2026 — Quantum Communication & Networking  
**Build constraint:** Plan for a maximum of 38 focused implementation hours  
**Primary audience:** Three team members and any AI coding/research agents working on the project

> **Purpose:** This file is the project's authoritative planning document. Every human and AI agent must read it before proposing, changing, or implementing project work. When other notes, prompts, AI responses, or generated code conflict with this document, do not silently choose one: flag the conflict and ask the team lead to resolve it.

---

## 1. Project summary

QuantumRoute is a **simulator-first, reproducible research and learning tool** for exploring entanglement-based quantum teleportation over a small abstract quantum network.

It will combine:

1. A Qiskit implementation of single-link quantum teleportation.
2. Controlled noise experiments and quantum-state fidelity measurements.
3. A small network model whose edges represent sources of noisy entangled Bell pairs.
4. A simplified entanglement-swapping model for obtaining end-to-end entanglement.
5. A comparison of shortest-hop routing and quality-aware routing.
6. A validation harness that compares analytical predictions with circuit-level simulation.
7. A compact interactive Streamlit dashboard that exposes the experiments and their results.

The project is an **engineering prototype**, not a claim of a new quantum-networking algorithm, a production quantum internet, or demonstrated quantum advantage.

## 2. Problem statement

Quantum communication can be affected by imperfect entangled resources and noisy quantum operations. These imperfections can reduce the fidelity of a quantum state transferred using teleportation. In a network, the choice of entanglement links and the operations performed at intermediate nodes affect the quality of the resulting end-to-end entangled resource.

QuantumRoute will let users investigate this problem through reproducible quantum-circuit simulations, an explicitly stated network model, and comparisons between predicted and simulated results.

### Short description

Build a Qiskit-based simulator for entanglement-based quantum teleportation under controlled noise. Model a small network of noisy Bell-pair links, compare shortest-hop and quality-aware route selection, and validate the model's predicted end-to-end entanglement fidelity against quantum-circuit simulation.

## 3. Goals and success criteria

### Essential MVP goals

- [ ] Prepare arbitrary single-qubit input states.
- [ ] Implement and test ideal teleportation using Qiskit.
- [ ] Introduce a depolarizing-noise experiment and measure output-state fidelity.
- [ ] Verify the expected ideal-case and depolarizing-case relationships using automated tests.
- [ ] Represent a small network of nodes and noisy entangled links.
- [ ] Implement a shortest-hop baseline and a quality-aware route selector.
- [ ] State the mathematical assumptions behind route scoring and fidelity predictions.
- [ ] Validate predicted end-to-end Bell-pair fidelity against a circuit-level entanglement-swapping simulation for the MVP's stated model.
- [ ] Provide a basic Streamlit interface for selecting experiments and viewing results.
- [ ] Provide reproducible commands, tests, documented limitations, and a working demo.

### Success means

1. The core tests pass in a clean environment.
2. Ideal teleportation fidelity is numerically close to 1 for a set of input states.
3. The depolarizing experiment agrees with its stated analytical prediction within the test tolerance.
4. The routing example produces valid routes and demonstrates a case where shortest-hop and quality-aware routes differ.
5. Predicted-versus-simulated comparisons are shown with their assumptions and numerical error.
6. The demo reports real output from the code; no fabricated measurements or hardcoded claims are presented as experimental results.

### Non-goals for the 38-hour build

- Real quantum hardware execution.
- Physical photon/fiber simulation or realistic loss modelling.
- Production-ready quantum networking.
- A novel quantum-routing algorithm claim.
- Quantum advantage claims.
- Quantum error correction or entanglement purification.
- Congestion control, multi-path routing, authentication, user accounts, databases, or cloud deployment.
- A React/FastAPI frontend unless the team explicitly changes the stack after the MVP works.
- Multiple advanced noise models before the depolarizing MVP is verified.

## 4. Mandatory scientific distinctions

Every team member and AI agent must preserve these distinctions in code, documentation, and presentations.

- **Graph path:** a classical abstraction over nodes and edges.
- **Entanglement link:** in this MVP, an abstract resource that supplies a noisy Bell pair. It is not a full physical model of a quantum channel.
- **Entanglement swapping:** an intermediate operation that combines entangled resources to create an end-to-end entangled pair.
- **Teleportation:** consumes an end-to-end entangled pair and uses classical communication for the required measurement outcomes/corrections.
- **Physical transmission:** photons, fiber loss, detector performance, memory lifetimes, and hardware effects are out of scope unless explicitly added and validated.
- **Simulation:** numerical evidence about the model being simulated, not proof that the same performance will occur on a real network.

Do not describe repeated hop-by-hop teleportation as equivalent to entanglement distribution plus swapping. Do not imply that the MVP simulates a real quantum internet.

## 5. Mathematical model and assumptions

### 5.1 Werner-link model

For the network MVP, each edge is represented as an idealized Werner-like two-qubit state:

\[
\rho_W = w|\Phi^+\rangle\langle\Phi^+| + (1-w)\frac{I_4}{4}
\]

where \(w\) is the edge's Werner parameter and must be in the valid range \([0,1]\) for this chosen model.

Its Bell-state fidelity is:

\[
F_e = \frac{1+3w}{4}
\]

Under the MVP assumptions of Werner-form links, ideal Bell measurements/swapping operations, ideal classical communication, and no memory decoherence, the model predicts:

\[
w_{\mathrm{path}} = \prod_{e \in P} w_e
\]

and:

\[
F_{e,\mathrm{path}} = \frac{1+3w_{\mathrm{path}}}{4}
\]

The corresponding average teleportation fidelity for that shared state is:

\[
F_{\mathrm{tel,avg}} = \frac{2F_{e,\mathrm{path}}+1}{3}
\]

These equations must be implemented with tests and compared against the circuit-level model before being treated as validated by this project.

**Never multiply Bell-pair fidelities directly to estimate end-to-end fidelity.** The product rule above applies to the Werner parameters under the stated assumptions, not to the \(F_e\) values themselves.

### 5.2 Routing objective

For a path with edge Werner parameters \(w_e > 0\), maximizing \(\prod_e w_e\) is equivalent to minimizing:

\[
\sum_{e\in P} -\ln(w_e)
\]

The quality-aware route can therefore use Dijkstra's algorithm with edge cost \(-\ln(w_e)\), subject to valid edge parameters and any explicitly implemented constraints.

The baseline route minimizes hop count. The test topology should contain at least two candidate routes where the shortest-hop path is not the quality-aware choice.

If \(w_e=0\), the logarithmic cost is undefined/infinite; handle this explicitly by treating that edge as unusable for the quality-aware route. Validate input values and do not silently clamp invalid parameters.

### 5.3 Classical fidelity threshold

The often-cited \(2/3\) average-fidelity threshold applies to the standard single-copy qubit state-estimation/measure-and-prepare comparison under its assumptions. If displayed, label it as a reference threshold, not as a universal threshold for every metric, state, or network scenario. Do not claim quantum advantage solely because one simulated result crosses a line without explaining the comparison assumptions.

### 5.4 Noise model scope

- **MVP:** depolarizing noise, with the exact placement and parameter convention documented.
- **Optional only after MVP validation:** amplitude damping and phase damping.
- Noise on the transmitted half of an entangled pair, noise on gates, and noise on a link are different models. Code and UI labels must state which one is being applied.
- Do not mix exact density-matrix results and finite-shot estimates as if they had the same uncertainty.
- Exact density-matrix simulation has numerical precision error but no finite-shot sampling error.
- Finite-shot results require a documented estimator, shot count, seed, and uncertainty estimate.

## 6. Teleportation circuit requirements

The core experiment uses three qubits:

- `q0`: the unknown input/message state.
- `q1`: Alice's half of the entangled Bell pair.
- `q2`: Bob's half of the entangled Bell pair.

The experiment must:

1. Prepare the input state with documented parameters.
2. Prepare the Bell pair shared between `q1` and `q2`.
3. Apply the chosen link-noise channel at the documented location.
4. Perform Alice's Bell-basis operations.
5. Apply Bob's corrections.
6. Extract Bob's reduced density matrix.
7. Calculate state fidelity against the original input state.

The initial MVP may use deferred-measurement/coherent corrections (`cx` and `cz`) to avoid mid-circuit measurement/control-flow compatibility issues. If so, documentation must explain that this is a mathematically equivalent simulation of the corrected output under the assumed ideal protocol; it is not a literal implementation of the classical communication step. A literal measurement-and-feed-forward implementation is optional, not a prerequisite.

Required core checks:

- Identical-state fidelity is 1 within numerical tolerance.
- Orthogonal pure states have fidelity 0 within numerical tolerance.
- Ideal teleportation returns fidelity near 1 for multiple input states.
- The selected depolarizing channel matches the analytical relation for the exact channel and parameter convention actually implemented.
- Invalid parameters are rejected with clear errors.

**Important review rule:** do not copy an expected formula or numerical table from a research note without verifying that the formula matches the exact Qiskit channel convention and where the channel is applied. If the test fails, inspect and reconcile the model; do not change the expected value merely to make the test pass.

## 7. Network and swapping validation requirements

The MVP network should have approximately 6–8 nodes, but a smaller test topology is acceptable during development.

- Nodes represent end nodes or abstract repeater nodes capable of the idealized swapping operation.
- Edges represent sources of noisy entangled Bell pairs, parameterized by \(w_e\).
- A selected path represents a chain of link resources to be joined by swapping.
- The MVP assumes ideal swapping operations unless the team explicitly adds and tests a different model.
- The model prediction and circuit simulation must use the same declared assumptions.
- For the ideal Werner-link case, test whether predicted and simulated end-to-end fidelity agree within a justified tolerance.
- Add a clear error report when they do not agree; do not silently substitute the analytical prediction for the circuit result.

The MVP's differentiator is a transparent, reproducible validation harness and documented model boundaries—not a claim that Dijkstra or the Werner-state formula is new.

## 8. Technology stack

### Required for MVP

- Python 3.11+ or another Python version verified to work with the pinned dependencies.
- Qiskit.
- Qiskit Aer.
- NumPy.
- NetworkX.
- Streamlit.
- Plotly or Matplotlib.
- pytest.

### Stack rules

- Pin tested dependency versions in `requirements.txt`.
- Record the Python and package versions used for the final demo.
- Prefer a single Python application and one reproducible command path.
- Do not introduce React, FastAPI, a database, Docker, or cloud services unless the team lead approves a documented change after the scientific MVP works.
- The UI must call the same tested modules as the tests; do not implement separate, inconsistent fidelity/routing logic in the UI.

## 9. Proposed repository structure

```text
quantumroute/
├── PLAN.md                    # This source-of-truth plan
├── README.md                  # Project overview and run instructions
├── requirements.txt           # Pinned tested dependencies
├── src/
│   └── quantumroute/
│       ├── __init__.py
│       ├── teleport.py        # Input states, teleportation, fidelity
│       ├── swapping.py        # Entanglement swapping and chain validation
│       ├── network.py         # Graph and link parameters
│       ├── routing.py         # Shortest-hop and quality-aware routing
│       ├── validate.py        # Predicted vs circuit-simulated results
│       └── experiments.py     # Reproducible experiments and exports
├── tests/
│   ├── test_teleport.py
│   ├── test_noise.py
│   ├── test_network.py
│   ├── test_routing.py
│   └── test_validation.py
├── app/
│   └── streamlit_app.py
└── results/
    └── .gitkeep
```

This is a target structure, not permission to create every module before it is needed. Start with the smallest working files and grow the repository as milestones pass.

## 10. Team roles (three members)

Assign names in the team decision log before parallel implementation. These are role suggestions, not assumptions about individual skills.

- **Member A — Quantum core:** teleportation circuit, noise channel, density matrices, fidelity, and core tests.
- **Member B — Network and routing:** graph model, Werner parameters, shortest-hop baseline, quality-aware route, and path-model tests.
- **Member C — Validation and interface:** integration tests, predicted-vs-simulated checks, Streamlit dashboard after data contracts are agreed, result exports, and demo assets.

All members must review the scientific assumptions and understand the end-to-end demo. The interface work must not block circuit validation. A reviewer who did not author a module should check its tests and assumptions where practical.

## 11. Time-boxed build plan (38 focused hours)

| Phase | Time budget | Deliverable | Exit condition |
|---|---:|---|---|
| 0. Setup | 2 h | Environment, repository, dependencies, smoke test | Imports work; pytest starts |
| 1. Ideal teleportation | 4 h | Core circuit and tests | Multiple input states achieve fidelity near 1 |
| 2. Noise and fidelity | 5 h | Depolarizing sweep and plot/data output | Exact results match the verified formula |
| 3. Network and swapping | 7 h | Werner links, small topology, swapping model | Predicted and circuit results agree under declared assumptions |
| 4. Routing and validation | 4 h | Shortest-hop and quality-aware routes | Routes are valid; test graph separates the strategies |
| 5. Dashboard and exports | 8 h | Streamlit UI, route comparison, noise plots | UI uses tested modules and shows actual results |
| 6. Testing and submission | 6 h | Regression tests, README, demo, slides | Clean run and demo rehearsal succeed |
| Buffer | 2 h | Fixes | Reserved for integration failures |

The plan totals 38 hours including a 2-hour buffer. Actual progress must be tracked. Do not hide overruns; update the status log and cut scope.

### Cut order if behind schedule

1. Adaptive rerouting.
2. Amplitude/phase damping.
3. Finite-shot mode and confidence intervals.
4. Dashboard polish.
5. Network size beyond the smallest useful test topology.

Do not cut ideal teleportation, correct fidelity calculation, the primary noise validation, or the predicted-versus-simulated check. If network swapping validation proves infeasible, show the verified single-link experiment and clearly label the network model as analytical rather than pretending it was circuit-validated.

## 12. Required tests and experiment evidence

- Input-state preparation is normalized.
- State-fidelity utility returns 1 for identical states and 0 for orthogonal pure states.
- Ideal teleportation passes on multiple deterministic input states.
- Zero noise reproduces the ideal case.
- Depolarizing results match the independently checked analytical prediction.
- Routing returns valid simple paths and handles invalid/disconnected graphs.
- Dijkstra's quality-aware route agrees with brute-force enumeration on the small test graph.
- The chosen example includes a case where shortest-hop and quality-aware routes differ.
- Predicted and circuit-simulated network fidelity are compared using identical assumptions.
- Experiments use fixed seeds where randomness is involved.
- Results shown in the final demo are generated by the committed code.
- All known model limitations are documented.

No agent may fabricate test results, claim tests passed without running them, or label expected values as measured output.

## 13. Agent and AI-tool operating rules

Every coding/research agent must follow these rules:

1. Read `PLAN.md` before acting.
2. Work only on the assigned task and named files.
3. Do not expand scope or change the technology stack without approval.
4. Do not silently alter scientific equations, expected values, assumptions, dependencies, interfaces, or acceptance criteria.
5. If a requirement is ambiguous or contradictory, stop and report the exact conflict with a proposed resolution.
6. Do not claim to have run code or tests unless they were actually run in the available environment.
7. Cite sources for externally derived technical claims; label unverified claims and assumptions.
8. Do not copy an external solution or pre-built project. Write the team's implementation and credit libraries, tutorials, and references.
9. Do not commit secrets, API keys, credentials, or personal data.
10. Provide a concise handoff with changed files, commands run, test results, limitations, and remaining work.
11. Avoid modifying another member's files or shared interfaces without coordination.
12. Keep commits and work within the hackathon's allowed window and use the team's assigned event repository.

### Required agent task template

Before a task begins, specify:

- **Task ID and owner:**
- **Goal:**
- **Allowed files:**
- **Dependencies/interfaces:**
- **Acceptance criteria:**
- **Tests to run:**
- **Out of scope:**

At completion, report:

- **Files changed:**
- **Implementation summary:**
- **Commands actually run:**
- **Tests and actual outcomes:**
- **Known limitations or assumptions:**
- **Next recommended task:**

## 14. Decision-making and change control

`PLAN.md` is the current baseline. If a scientific or architectural change is needed:

1. Describe the existing rule.
2. Explain the evidence or failure that motivates the change.
3. State the proposed replacement and consequences.
4. Ask the team lead to approve it.
5. Update this plan and the relevant decision log before dependent implementation continues.

Do not treat an AI answer, an online snippet, or a test expectation as authoritative merely because it sounds confident.

### Decisions that still need team confirmation

- Team member names and final task owners.
- Exact pinned package versions after installation is tested.
- Whether finite-shot estimates fit after the exact MVP works.
- Whether any optional noise model will be included.
- Whether the event organizers clarify any simulator-eligibility condition.

Until decided, the defaults are: **Streamlit; exact density-matrix MVP; depolarizing noise first; no real hardware; no advanced features before core validation.**

## 15. Hackathon submission constraints

The team's supplied VTU Qiskit Fall Fest 2026 guidelines state that:

- The solution must use Qiskit and implement quantum algorithms or circuits.
- The assigned event GitHub repository must be used.
- The repository must include source code, a README, setup/run instructions, team details, and a requirements file.
- The final submission includes a working prototype and YouTube demo video.
- The coding window closes at the stated event deadline; no later commits are considered.
- The PPT must include the problem statement/track, approach, quantum algorithm and circuit details, results, repository link, demo link/video, and team details.
- The evaluation considers innovation/originality, Qiskit implementation quality, problem-solving, track relevance, and working demo.
- Copied/pre-built solutions or plagiarism can lead to disqualification.

The team lead must re-check the event's official channels for any updates and confirm exact deadlines. This plan does not replace the organizers' rules.

## 16. Demo narrative

Target a 2–3 minute demo:

1. State the problem: noisy entanglement can reduce teleportation quality.
2. Show the ideal teleportation result and measured fidelity.
3. Increase depolarizing noise and show the verified fidelity curve.
4. Show a small network where shortest-hop and quality-aware routing choose different paths.
5. Compare the analytical prediction with the circuit-simulated result.
6. Explain one limitation or failure case honestly.
7. State that this is a simulator-based engineering prototype, not a real quantum network deployment or proof of quantum advantage.

## 17. First task — do this before parallelizing

**Task ID:** QR-001  
**Owner:** Member A (proposed; confirm assignment)  
**Goal:** Establish a clean environment and validate ideal teleportation and the chosen depolarizing channel.  
**Allowed files:** `requirements.txt`, `src/quantumroute/__init__.py`, `src/quantumroute/teleport.py`, `tests/test_teleport.py`, `tests/test_noise.py`.

### Acceptance criteria

- The environment imports Qiskit and Qiskit Aer.
- Ideal teleportation is tested across 20 deterministic input states.
- The depolarizing channel is applied at a documented location.
- The expected formula is independently checked against the actual Qiskit channel convention and implementation.
- Tests pass without weakening tolerances just to hide a mismatch.
- The handoff includes actual package versions, commands, output, and any failure.

Do not start the complete dashboard until the teleportation and noise tests pass.

---

## 18. Source-of-truth policy

Priority order when information conflicts:

1. Official hackathon rules and announcements for event constraints.
2. This `PLAN.md` for the team's approved project scope and assumptions.
3. Approved decision-log entries that have been incorporated into this plan.
4. Source code and tests for what is actually implemented.
5. Research notes and external references as evidence to review—not automatic authority.
6. AI-generated suggestions, which are proposals until verified and approved.

**Current status:** Plan drafted; team owners not yet assigned; implementation not yet verified. No tests are claimed to have passed by this document.
