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

## 3. Reproducibility & Environment Requirements

1. **Deterministic Randomness:** All randomized tests, state ensembles, or simulations must explicitly pass a fixed seed (e.g., `seed=42`).
2. **Execution Framework:** All test suites run through `pytest`:
   ```bash
   pytest -v --durations=10
   ```
3. **No Flaky Tests:** Tests must not rely on probabilistic shot thresholds in unit validation; exact statevector and density-matrix calculations ensure 100% deterministic reproducibility.
4. **Clean Run Assurance:** Every test must execute without pre-existing state or residual filesystem artifacts.
