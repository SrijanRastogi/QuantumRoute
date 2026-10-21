# QuantumRoute — Module Interface Contracts

These are proposed contracts, not proof that functions already exist. Confirm them before parallel implementation and keep `ARCHITECTURE.md` synchronized.

## General rules
- Keep scientific logic independent of Streamlit.
- Document types, qubit ordering, parameter conventions, and error behavior.
- Keep analytical outputs distinct from circuit-simulated results.
- Do not duplicate scientific formulas in the UI.

## Teleportation — Yuvaraj B Sutar
Proposed API:
```python
input_state(theta: float, phi: float) -> Statevector
teleport_rho(theta: float, phi: float, link_error=None) -> DensityMatrix
```
Document input preparation gate order, receiver subsystem ordering, channel type, and noise placement. Ideal teleportation must preserve the input state within a justified tolerance. Deferred-measurement coherent corrections must not be described as literal classical feed-forward.

## Noise — Yuvaraj B Sutar
Proposed API:
```python
make_depolarizing_channel(p: float)
```
Validate the parameter range for the chosen Qiskit channel and derive expected results for the actual convention and placement.

## Werner model — Srijan Rastogi
Proposed APIs:
```python
bell_state_fidelity(w: float) -> float
path_parameter(link_parameters: Sequence[float]) -> float
path_metrics(link_parameters: Sequence[float]) -> PathMetrics
```
For `rho = w |Phi+><Phi+| + (1-w) I/4`, use `F_e = (1 + 3w)/4`. Under documented ideal-swapping assumptions, multiply path `w` values, not Bell-state fidelities. The average teleportation-fidelity formula applies only to the specified resource state and assumptions.

## Routing — Srijan Rastogi
Proposed APIs:
```python
shortest_hop_path(graph, source, target)
quality_aware_path(graph, source, target)
```
Document graph edge attributes and ranges. Quality-aware routing uses `-log(w)` for `w > 0`. Handle zero/invalid weights, missing attributes, and no-path cases. Test against exhaustive simple paths on small graphs.

## Validation — Veeresh M A
Proposed API:
```python
compare_model_and_simulation(...)
```
Compare equivalent metrics under matching assumptions. Return structured metrics, absolute difference, tolerance, assumptions, and status. Never hide a mismatch by rounding or changing expected values.

## Dashboard — Veeresh M A
Use public module APIs. Show assumptions and noise conventions, distinguish analytical/exact/finite-shot outputs, handle unsupported cases, and never present placeholder values as real.
