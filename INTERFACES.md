# QuantumRoute — Module Interface Contracts

These are proposed contracts, not proof that functions already exist. Confirm them before parallel implementation and keep `ARCHITECTURE.md` synchronized.

## General rules
- Keep scientific logic independent of Streamlit.
- Document types, qubit ordering, parameter conventions, and error behavior.
- Keep analytical outputs distinct from circuit-simulated results.
- Do not duplicate scientific formulas in the UI.

## Teleportation — Yuvaraj B Sutar
**Status:** Implemented & Verified in `src/quantumroute/teleport.py`
```python
input_state(theta: float, phi: float) -> Statevector
prepare_input_state(theta: float, phi: float) -> Statevector
create_bell_pair() -> QuantumCircuit
build_teleportation_circuit(state, link_error=None) -> QuantumCircuit
extract_bob_density_matrix(circuit: QuantumCircuit) -> DensityMatrix
calculate_state_fidelity(rho_target, rho_actual) -> float
teleport_rho(theta: float, phi: float, link_error=None) -> DensityMatrix
```
*Documentation:* Register uses 3 qubits (`q0` message, `q1` Alice Bell qubit, `q2` Bob Bell qubit). Input prepared via $R_y(\theta)$ then $P(\phi)$. Link noise applied to $q2$ (distributed qubit). Alice applies $CX(0, 1)$ then $H(0)$. Coherent feedforward corrections use $CX(1, 2)$ followed by $CZ(0, 2)$ (deferred measurement principle, ADR-002). Bob's reduced density matrix is extracted by tracing out subsystems `[0, 1]`.

## Noise — Yuvaraj B Sutar
**Status:** Implemented & Verified in `src/quantumroute/noise.py` and `experiments.py`
```python
make_depolarizing_channel(p: float) -> Kraus
get_analytical_depolarizing_fidelity(p: float) -> float
get_werner_parameter_from_noise(p: float) -> float
depolarizing_noise_sweep(param_range=None, input_states=None, seed=42, tolerance=1e-4) -> dict
```
*Documentation:* Qiskit depolarizing convention $\mathcal{E}(\rho) = (1-p)\rho + p(I/2)$ with valid range $p \in [0.0, 1.0]$. When applied to one half of $|\Phi^+\rangle$, it produces an isotropic Werner state $\rho_W(w)$ with parameter $w = 1 - p$. The resulting teleportation fidelity is $F(p) = 1 - p/2 = (1+w)/2$.

## Werner model — Srijan Rastogi
**Status:** Implemented & Verified in `src/quantumroute/network.py`
```python
validate_werner_parameter(w: float) -> float
bell_state_fidelity(w: float) -> float
calculate_predicted_path_fidelity(w_path: float) -> float
calculate_average_teleportation_fidelity(F_path: float) -> float
path_parameter(link_parameters: Sequence[float]) -> float
path_metrics(link_parameters: Sequence[float]) -> PathMetrics
calculate_path_werner_parameter(graph: nx.Graph, path: Sequence[Hashable]) -> float
calculate_path_metrics(graph: nx.Graph, path: Sequence[Hashable]) -> PathMetrics
create_topology() -> nx.Graph
```
*Documentation:* For $\rho_W = w |\Phi^+\rangle\langle\Phi^+| + (1-w) I_4/4$, Bell fidelity is $F_e = (1 + 3w)/4$. Under ideal entanglement-swapping assumptions, path Werner parameter obeys $w_{\text{path}} = \prod_{e \in P} w_e$, and $F_{e,\text{path}} = (1 + 3w_{\text{path}})/4$. Path composition multiplies Werner parameters $w$, NOT Bell-state fidelities $F_e$. Direct multiplication of $F_e$ is strictly prohibited. `create_topology()` constructs a 7-node benchmark network with attributes `'w'`, `'weight'` ($-\ln(w)$), and `'bell_fidelity'`.

## Routing — Srijan Rastogi
**Status:** Implemented & Verified in `src/quantumroute/routing.py`
```python
RouteResult(path: tuple[Any, ...], num_hops: int, werner_parameter: float, bell_fidelity: float, average_teleportation_fidelity: float, cost: float, strategy: str)
find_shortest_hop_route(graph: nx.Graph, source: Any, target: Any, exclude_zero_quality: bool = False) -> RouteResult
find_quality_aware_route(graph: nx.Graph, source: Any, target: Any) -> RouteResult
shortest_hop_path(graph: nx.Graph, source: Any, target: Any) -> list
quality_aware_path(graph: nx.Graph, source: Any, target: Any) -> list
compare_routes(graph: nx.Graph, source: Any, target: Any) -> dict[str, RouteResult]
exhaustive_quality_route(graph: nx.Graph, source: Any, target: Any) -> list
```
*Documentation:* `find_shortest_hop_route` computes minimum-hop route using unweighted BFS (`nx.shortest_path`). `find_quality_aware_route` finds maximum Werner-product path using Dijkstra with additive costs $c_e = -\ln(w_e)$ on positive-quality edges ($w > 0$). Zero-quality links ($w=0$) are strictly excluded from positive-quality routes; if no path with $w > 0$ exists, `nx.NetworkXNoPath` is raised. Validates that source and target are distinct (`ValueError` on identical endpoints) and exist in the graph (`KeyError`). Disconnected graphs raise `nx.NetworkXNoPath`. `RouteResult` provides full path metrics and is duck-typed as a sequence/list (`__iter__`, `__len__`, `__getitem__`) for backwards compatibility with plain path list expectations.

## Validation — Veeresh M A
Proposed API:
```python
compare_model_and_simulation(...)
```
Compare equivalent metrics under matching assumptions. Return structured metrics, absolute difference, tolerance, assumptions, and status. Never hide a mismatch by rounding or changing expected values.

## Dashboard — Veeresh M A
Use public module APIs. Show assumptions and noise conventions, distinguish analytical/exact/finite-shot outputs, handle unsupported cases, and never present placeholder values as real.
