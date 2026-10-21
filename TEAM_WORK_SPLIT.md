# QuantumRoute — Team Work Split

**Team:** Quantum D Clan  
**Team ID:** VTU-QFF-HC-0126  
**Status:** Assigned proposal; confirm that each member agrees before implementation.

## Confirmed members

| Member | GitHub username | Role |
|---|---|---|
| Yuvaraj B Sutar | `YUVA56-gomu` | Team Lead |
| Srijan Rastogi | `SrijanRastogi` | Developer |
| Veeresh M A | `Veeresh23-06` | Developer |

## Project goal

Deliver a scientifically defensible, reproducible Qiskit simulator for single-link teleportation under noise, a small analytical entanglement-distribution model, routing comparisons, and validation that distinguishes analytical predictions from circuit simulation.

## Yuvaraj B Sutar — Team Lead; Quantum Circuit & Noise Lead

**Owns:** `src/quantumroute/teleport.py`, `src/quantumroute/noise.py`, `tests/test_teleport.py`, `tests/test_noise.py`.

Responsibilities:
- Coordinate the daily task board, integration decisions, and deadline.
- QR-000: coordinate environment setup with Veeresh.
- QR-001: implement input-state preparation and ideal single-qubit teleportation using the agreed deferred-measurement correction approach.
- QR-002: implement depolarizing-noise experiments and document exactly where the channel is applied.
- Test ideal teleportation over multiple input states and verify noisy cases against a derived expectation for the exact channel convention.
- Explain circuit design, density matrices, partial trace, and fidelity to the team.
- Review scientific claims and make sure README/demo statements match tested implementation.

Acceptance criteria:
- Output is the receiver's reduced state with documented subsystem ordering.
- Ideal teleportation fidelity meets an agreed numerical tolerance over varied input states.
- Noise tests include zero-noise and nonzero cases.
- No unverified hardware, finite-shot, or experimental claims.

## Srijan Rastogi — Network Model, Entanglement Swapping & Routing Lead

**Owns:** `src/quantumroute/network.py`, `src/quantumroute/swapping.py`, `src/quantumroute/routing.py`, `tests/test_network.py`, `tests/test_routing.py`.

Responsibilities:
- QR-003: implement topology and Werner-model calculations under documented assumptions.
- QR-004: implement and validate the analytical entanglement-swapping/path model; clearly label its scope.
- QR-005: implement shortest-hop and quality-aware routing using edge cost `-ln(w)` for valid positive `w`.
- Validate Dijkstra against exhaustive simple-path enumeration on tiny graphs.
- Create an example where shortest-hop and highest-quality routes differ.
- Coordinate with Yuvaraj on the mathematical contract. Do not claim circuit-validated swapping unless an actual swapping circuit is implemented and tested.

Acceptance criteria:
- Invalid parameters, disconnected paths, and `w = 0` are handled explicitly.
- Path quality combines Werner parameters, not Bell-state fidelities.
- Route output includes path and relevant model-based metrics.
- Model assumptions and limitations are documented.

## Veeresh M A — Environment, Validation, Integration & Dashboard Lead

**Owns:** environment/test setup, `src/quantumroute/validate.py`, `src/quantumroute/app.py`, `tests/test_validate.py`, dashboard integration and demo materials.

Responsibilities:
- QR-000: verify the Python runtime and Qiskit/Aer installation; record tested versions.
- Define module integration contracts before connecting implementations.
- QR-006: compare analytical predictions with circuit results only for matching metrics and assumptions, working with Yuvaraj and Srijan.
- QR-007: build a small Streamlit dashboard after core APIs stabilize.
- QR-008: coordinate clean-environment tests, README accuracy, genuine screenshots/demo, and presentation evidence.

Acceptance criteria:
- Dashboard calls public module functions instead of duplicating scientific formulas.
- UI distinguishes analytical estimates, exact circuit simulation, and finite-shot estimates.
- Errors and unsupported configurations are displayed clearly.
- Tests and setup commands are reproducible. No fabricated results or screenshots.

## Shared responsibilities

All members must read `PLAN.md`, `AGENTS.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TASKS.md`, and `TESTING.md`; add tests with behavior changes; communicate API changes; report actual commands/results; and follow the agreed Git workflow. Do not overwrite another member's work.

## Dependency order

1. QR-000 — environment and dependencies.
2. QR-001 — ideal teleportation circuit.
3. QR-002 — noise and fidelity.
4. QR-003 — Werner network model.
5. QR-004 — entanglement-swapping model and validation scope.
6. QR-005 — routing.
7. QR-006 — model-versus-circuit validation.
8. QR-007 — dashboard.
9. QR-008 — reproducibility, demo, README and presentation.

Parallelize only when dependencies and interfaces are agreed.

## Scope cuts if time is short

Preserve the correct teleportation circuit, tested noise/fidelity, network model, routing comparison, and honest validation. Cut UI polish, finite-shot mode, advanced damping, adaptive rerouting, and extra topologies first. If swapping remains analytical, label it analytical.
