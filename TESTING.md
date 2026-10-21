# QuantumRoute — Scientific Invariants & Verification Strategy (`TESTING.md`)

**Document Status:** Baseline Verification Plan  
**Authority:** [PLAN.md](file:///d:/QiskitFallFest/PLAN.md) (§5, §6, §7, §12)  
**Strict Directives:**
1. Never fabricate test results, benchmark data, or claim tests passed without executing them in the project environment.
2. If a test fails, do **not** weaken the tolerance or alter the theoretical formula merely to force a green status; inspect the implementation and scientific convention.

---

## 1. Scientific & Mathematical Invariants

Every module and test suite in QuantumRoute must verify and preserve these fundamental physical and mathematical invariants:

### Invariant 1: Quantum State Normalization & Purity
- **Statement:** Every prepared single-qubit state $|\psi\rangle$ must satisfy $\langle\psi|\psi\rangle = 1.0$ within floating-point precision ($\pm 10^{-7}$).
- **Density Matrix Form:** For any simulated density matrix $\rho$, $\text{Tr}(\rho) = 1.0$ and $\rho = \rho^\dagger$ (Hermitian and positive semi-definite).

### Invariant 2: State Fidelity Boundaries
- **Bounds:** For arbitrary states $\rho$ and $\sigma$, state fidelity $F(\rho, \sigma) \in [0.0, 1.0]$.
- **Self-Fidelity:** $F(\rho, \rho) = 1.0 \pm 10^{-6}$.
- **Orthogonal Pure States:** $F(|\psi\rangle, |\psi^\perp\rangle) = 0.0 \pm 10^{-6}$ (e.g., $|0\rangle$ vs. $|1\rangle$, or $|+\rangle$ vs. $|-\rangle$).

### Invariant 3: Ideal Teleportation Unit Fidelity
- **Statement:** Under zero noise ($\lambda = 0$), ideal quantum teleportation must reconstruct the input state with $F(\rho_{\text{Bob}}, |\psi_{\text{in}}\rangle\langle\psi_{\text{in}}|) \ge 0.9999$ for all input states on the Bloch sphere.

### Invariant 4: Werner Link Formulation & Parameter Multiplying Rule
- **Definition:** Each link is parameterized by $w_e \in [0.0, 1.0]$ with Bell-state fidelity:
  $$F_e = \frac{1 + 3w_e}{4}$$
- **Multiplication Rule:** Under the declared MVP model assumptions (Werner-form links, ideal swapping, ideal feedforward, no memory decoherence), path Werner parameters multiply:
  $$w_{\text{path}} = \prod_{e \in P} w_e \quad \text{and} \quad F_{e,\text{path}} = \frac{1 + 3w_{\text{path}}}{4}$$
- **CRITICAL VIOLATION TO PREVENT:** Never compute end-to-end fidelity by multiplying edge fidelities directly ($\prod F_e$). Direct multiplication of fidelities is mathematically and physically invalid.

### Invariant 5: Depolarizing Channel Agreement
- **Statement:** Simulated output state fidelity under single-qubit depolarizing noise must match the theoretical analytical curve corresponding to the exact channel placement and convention implemented in Qiskit.
- **Tolerance:** Absolute difference $|F_{\text{sim}} - F_{\text{theory}}| \le 10^{-4}$ across the entire sweep $\lambda \in [0, 1]$.

### Invariant 6: Routing Optimality Invariants
- **Quality Route Separation:** The standard test graph must include at least one topology case where the Shortest-Hop (BFS) path is strictly sub-optimal in fidelity compared to the Quality-Aware (Dijkstra) path.
- **Logarithmic Mapping Equivalence:** Minimizing $\sum_{e \in P} -\ln(w_e)$ must strictly yield the path maximizing $\prod_{e \in P} w_e$.

### Invariant 7: Circuit Simulation vs. Analytical Prediction
- **Statement:** When simulating an end-to-end multi-hop entanglement swapping chain under the Werner model, the simulated 2-qubit Bell fidelity must agree with the analytical prediction $F_{e,\text{path}}$ within numerical tolerance ($\Delta \le 10^{-4}$).

---

## 2. Test Suite Architecture

```text
tests/
├── test_teleport.py       # Unit tests for input states, Bell preparation, ideal teleportation
├── test_noise.py          # Validation of depolarizing noise model against theory
├── test_network.py        # Graph construction, Werner mechanics, edge validation
├── test_routing.py        # Dijkstra quality-aware vs. BFS shortest-hop verification
├── test_swapping.py       # Circuit-level multi-hop entanglement swapping simulation
└── test_validation.py     # End-to-end predicted vs. simulated validation harness
```

### 2.1 Detailed Test Specifications

#### Suite 1: `test_teleport.py`
- `test_input_state_normalization()`: Verifies norm across 50 random $(\theta, \phi)$ pairs.
- `test_state_fidelity_boundaries()`: Verifies fidelity of identical and orthogonal basis states.
- `test_ideal_teleportation_cardinal_states()`: Tests teleportation of $|0\rangle$, $|1\rangle$, $|+\rangle$, $|-\rangle$, $|i\rangle$, $|-i\rangle$.
- `test_ideal_teleportation_random_ensemble()`: Tests teleportation across an ensemble of 20 deterministic pseudo-random states.

#### Suite 2: `test_noise.py`
- `test_zero_noise_reproduces_ideal()`: Verifies $\lambda = 0 \implies F \approx 1.0$.
- `test_complete_depolarization_bound()`: Verifies $\lambda = 1.0$ matches the fully mixed state boundary.
- `test_depolarizing_sweep_curve()`: Verifies that simulated points match closed-form analytical predictions across 21 points in $\lambda \in [0, 1]$.
- `test_noise_parameter_validation()`: Verifies negative or $>1$ parameters raise `ValueError`.

#### Suite 3: `test_network.py`
- `test_graph_topology_integrity()`: Verifies test graph has 6–8 nodes and valid attributes.
- `test_werner_parameter_bounds()`: Rejects $w_e \notin [0, 1]$.
- `test_path_werner_multiplication()`: Verifies $w_{\text{path}} = \prod w_e$ for multi-hop chains.
- `test_average_teleportation_fidelity_formula()`: Verifies $F_{\text{tel,avg}} = (2F_e + 1)/3$.

#### Suite 4: `test_routing.py`
- `test_shortest_hop_path()`: Confirms path minimizes edge count.
- `test_quality_aware_dijkstra_path()`: Confirms Dijkstra path minimizes $-\ln(w)$ and maximizes end-to-end Werner parameter.
- `test_routing_divergence_case()`: Confirms that on the benchmark topology, BFS selects Path A (e.g., 2 hops with lower quality) while Dijkstra selects Path B (e.g., 3 hops with higher total quality).
- `test_disconnected_graph_handling()`: Confirms graceful error handling when no path exists.
- `test_zero_parameter_link_handling()`: Confirms edges with $w_e = 0$ are excluded from routing.

#### Suite 5: `test_swapping.py` & `test_validation.py`
- `test_single_hop_swapping_consistency()`: 1-hop path matches single-link Bell fidelity.
- `test_two_hop_swapping_simulation()`: Verifies circuit simulation of 1 intermediate repeater node.
- `test_three_hop_swapping_simulation()`: Verifies circuit simulation across 2 intermediate repeater nodes.
- `test_predicted_vs_simulated_tolerance()`: Confirms $|F_{\text{pred}} - F_{\text{sim}}| \le 10^{-4}$.

---

## 3. Reproducibility & Verified Test Status

### 3.1 Verified Execution Summary (Milestones 0, 1, 2, 3A & 4)

Tests executed in clean local environment (`.venv` Python 3.12.14, Qiskit 1.4.6, Qiskit Aer 0.18.0, NumPy 2.5.4, pytest 9.1.1, NetworkX 3.7):

```bash
# Full test suite execution command:
.\.venv\Scripts\python.exe -m pytest -v --durations=10
```

#### Execution Results:
- **Total Tests Collected:** 38
- **Passed:** 38 (100% pass rate)
- **Failed:** 0
- **Warnings:** 0 (cleanly filtered)
- **Execution Time:** ~2.66 seconds

#### Verified Test Breakdown:
| Test File | Test Case | Target Metric / Invariant | Result |
|---|---|---|---|
| `test_environment.py` | `test_required_package_imports` | Qiskit, Aer, NumPy, SciPy, NetworkX, pytest imports | `PASSED` |
| `test_environment.py` | `test_aer_simulator_smoke` | Minimal Bell-state simulation ($P_{00}=0.5, P_{11}=0.5$) | `PASSED` |
| `test_network.py` | `test_werner_parameter_bounds_and_types` | Validates $w \in [0, 1]$, rejects negative/out-of-bounds/booleans | `PASSED` |
| `test_network.py` | `test_bell_state_fidelity_boundary_values` | $w=1 \implies F_e=1.0$, $w=0 \implies F_e=0.25$, independent grid check | `PASSED` |
| `test_network.py` | `test_average_teleportation_fidelity_formula` | $F_{\text{tel,avg}} = (2F_e + 1)/3$, bounds $[0.25, 1.0]$ validated | `PASSED` |
| `test_network.py` | `test_path_werner_parameter_multiplication` | $w_{\text{path}} = \prod w_e$, verified against `math.prod`, empty path check | `PASSED` |
| `test_network.py` | `test_forbidden_fidelity_multiplication_invariant` | Proves $\prod F_e \neq F_{e,\text{path}}$; asserts Werner product required | `PASSED` |
| `test_network.py` | `test_path_metrics_dataclass` | `PathMetrics` immutability and exact consistency across fields | `PASSED` |
| `test_network.py` | `test_graph_topology_integrity` | 7-node benchmark graph, 9 edges, undirected, weights $-\ln(w)$ | `PASSED` |
| `test_network.py` | `test_calculate_path_werner_parameter_on_graph` | Graph path Werner evaluation vs independent direct calculation | `PASSED` |
| `test_network.py` | `test_path_validation_error_handling` | Rejects unknown nodes, missing edges, length < 2, and non-graphs | `PASSED` |
| `test_network.py` | `test_topology_routing_divergence_precondition` | Verifies 2 pairs ('A'->'D', 'A'->'G') where BFS and Dijkstra diverge | `PASSED` |
| `test_routing.py` | `test_shortest_hop_minimizes_hops` | BFS guarantees minimal hop count across multi-path topologies | `PASSED` |
| `test_routing.py` | `test_quality_aware_maximizes_werner_parameter` | Dijkstra $-\ln(w)$ strictly maximizes $w_{\text{path}}$ vs BFS | `PASSED` |
| `test_routing.py` | `test_dijkstra_matches_exhaustive_enumeration_on_all_pairs` | Exhaustive simple-path enumeration check across all 21 pairs ($\Delta < 10^{-12}$) | `PASSED` |
| `test_routing.py` | `test_benchmark_routing_divergence_pair_ad` | A->D: BFS `['A', 'C', 'D']` ($w=0.49$) vs Dijkstra `['A', 'B', 'E', 'D']` ($w=0.8574$) | `PASSED` |
| `test_routing.py` | `test_benchmark_routing_divergence_pair_ag` | A->G: BFS `['A', 'C', 'D', 'G']` ($w=0.4312$) vs Dijkstra `['A', 'B', 'E', 'D', 'G']` ($w=0.7545$) | `PASSED` |
| `test_routing.py` | `test_zero_quality_link_handling` | Links with $w=0$ safely excluded; raises `NetworkXNoPath` if only 0-quality path | `PASSED` |
| `test_routing.py` | `test_endpoint_validation_and_errors` | Rejects identical endpoints (`ValueError`) and unknown nodes (`KeyError`) | `PASSED` |
| `test_routing.py` | `test_disconnected_graph_handling` | Disconnected components raise `NetworkXNoPath` with informative message | `PASSED` |
| `test_routing.py` | `test_tie_breaking_behavior` | Deterministic routing when multiple equal-cost paths exist | `PASSED` |
| `test_routing.py` | `test_public_interface_contracts` | Duck-typed list interface, sequence access, `RouteResult` immutability | `PASSED` |
| `test_teleport.py` | `test_input_state_normalization` | $\|\langle\psi\|\psi\rangle - 1.0\| < 10^{-7}$ across 50 random states | `PASSED` |
| `test_teleport.py` | `test_state_fidelity_boundaries` | Self $F=1.0 \pm 10^{-6}$, orthogonal $F=0.0 \pm 10^{-6}$ | `PASSED` |
| `test_teleport.py` | `test_create_bell_pair` | Bell pair matches $|\Phi^+\rangle$ ($F=1.0$) | `PASSED` |
| `test_teleport.py` | `test_ideal_teleportation_cardinal_states` | 6 cardinal states ($|0\rangle, |1\rangle, |+\rangle, |-\rangle, |i\rangle, |-i\rangle$) with $F \ge 0.9999$ | `PASSED` |
| `test_teleport.py` | `test_ideal_teleportation_random_ensemble` | 25 pseudo-random Bloch states (seed 42), all $F \ge 0.9999$ | `PASSED` |
| `test_teleport.py` | `test_bob_density_matrix_properties` | $\text{Tr}(\rho)=1.0, \rho=\rho^\dagger$, eigenvalues $\ge 0$, purity = 1.0 | `PASSED` |
| `test_teleport.py` | `test_subsystem_extraction_correctness` | Correct receiver subsystem (Bob, $q_2$) isolated via partial trace | `PASSED` |
| `test_teleport.py` | `test_invalid_circuit_and_state_handling` | Invalid register size, multi-qubit states, and booleans rejected | `PASSED` |
| `test_noise.py` | `test_zero_noise_reproduces_ideal` | $p=0.0 \implies F \approx 1.0$ | `PASSED` |
| `test_noise.py` | `test_complete_depolarization_bound` | $p=1.0 \implies \rho_{\text{Bob}} = I/2, F = 0.5$ | `PASSED` |
| `test_noise.py` | `test_classical_threshold_point` | $p=2/3 \implies F = 2/3 \approx 0.6667$ | `PASSED` |
| `test_noise.py` | `test_depolarizing_sweep_curve` | 21-point sweep in $[0, 1]$, $|F_{\text{sim}} - F_{\text{theo}}| < 1.3 \times 10^{-15} \ll 10^{-4}$ | `PASSED` |
| `test_noise.py` | `test_noise_parameter_validation` | $p < 0.0$, $p > 1.0$, and booleans raise `ValueError`/`TypeError` | `PASSED` |
| `test_noise.py` | `test_werner_parameter_relationship` | $w = 1 - p, F_e = (1+3w)/4, F_{\text{tel,avg}} = (2F_e+1)/3 = 1 - p/2$ | `PASSED` |
| `test_noise.py` | `test_state_invariance_under_isotropic_noise` | Fidelity is invariant to input state under isotropic noise | `PASSED` |
| `test_noise.py` | `test_sweep_helper_and_experiments_interoperability` | `experiments.py` sweep and analytical helpers integration | `PASSED` |

### 3.2 Reproducibility Guidelines

1. **Deterministic Randomness:** All randomized tests, state ensembles, or simulations explicitly pass a fixed seed (e.g., `seed=42`).
2. **Clean Run Assurance:** Every test executes without pre-existing state or residual filesystem artifacts.
3. **No Flaky Tests:** Exact statevector and density-matrix calculations ensure 100% deterministic reproducibility across platforms.
