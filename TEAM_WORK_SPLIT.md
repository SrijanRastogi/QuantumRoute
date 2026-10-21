# QuantumRoute — Team Work Split (`TEAM_WORK_SPLIT.md`)

**Team:** Quantum D Clan  
**Team ID:** VTU-QFF-HC-0126  
**Status:** Active Execution (Phase 1 Baseline MVP Complete; Phase 2 Advanced Competitive Upgrades Active)

## Confirmed members

| Member | GitHub username | Role |
|---|---|---|
| Yuvaraj B Sutar | `YUVA56-gomu` | Team Lead; Quantum Circuits & Physical Noise Lead |
| Srijan Rastogi | `SrijanRastogi` | Network Topology, Dynamic Swapping & Routing Lead |
| Veeresh M A | `Veeresh23-06` | Validation, Tomography, Integration & Dashboard Lead |

---

## Project Goal
Deliver a scientifically defensible, reproducible, and competitive Qiskit simulator for noise-aware quantum communication, entanglement-based teleportation, multi-hop repeater networks, and quality-optimal routing that models real-world optical fiber physics and finite-shot quantum tomography.

---

## 👥 Task Assignments by Member

### 1. Yuvaraj B Sutar — Team Lead; Quantum Circuits & Physical Noise Lead
**Owns:** `teleport.py`, `noise.py`, `physics.py`, `purification.py`, `experiments.py`, `tests/test_teleport.py`, `tests/test_noise.py`, `tests/test_physics.py`, `tests/test_purification.py`.

**Phase 1 Tasks (Completed):**
- **`QR-001`**: Ideal single-link quantum teleportation with coherent feedforward corrections (ADR-002 deferred measurement).
- **`QR-002`**: Single-qubit depolarizing noise model on distributed Bell link ($F = 1 - p/2$).

**Phase 2 Advanced Tasks (In Progress):**
- **`QR-009`**: Physical Optical Fiber Attenuation & $T_1/T_2$ Decoherence Channel:
  - Model realistic silica telecom fiber attenuation ($\alpha = 0.2\text{ dB/km}$ at $1550\text{ nm}$) with transmission probability $\eta(L) = 10^{-\alpha L / 10}$.
  - Map fiber distance $L$ (km) directly to link Werner parameter $w(L)$ and dark count noise.
  - Implement Amplitude Damping (photon loss, $T_1$) and Phase Damping (dephasing, $T_2$) channels in `physics.py`.
- **`QR-010`**: BBPSSW Entanglement Purification Protocol:
  - Implement 1-step bilateral CNOT distillation on two noisy Bell pairs:
    $$F' = \frac{F^2 + \frac{1}{9}(1-F)^2}{F^2 + \frac{2}{3}F(1-F) + \frac{5}{9}(1-F)^2}$$
  - Simulate purification success probability and fidelity gain in `purification.py`.

---

### 2. Srijan Rastogi — Network Topology, Dynamic Swapping & Routing Lead
**Owns:** `network.py`, `routing.py`, `swapping.py`, `tests/test_network.py`, `tests/test_routing.py`, `tests/test_swapping.py`, `tests/test_topologies.py`.

**Phase 1 Tasks (Completed):**
- **`QR-003`**: Network graph representation and Werner-state algebra ($F_e = (1+3w)/4, w_{\text{path}} = \prod w_e$).
- **`QR-004`**: Shortest-Hop (BFS) vs. Quality-Aware (Dijkstra using $c_e = -\ln(w_e)$) routing algorithms.

**Phase 2 Advanced Tasks (In Progress):**
- **`QR-011`**: Arbitrary $N$-Hop Quantum Circuit Swapping Engine:
  - Eliminate the analytical shortcut for $N \ge 4$ hops in `swapping.py`.
  - Implement a dynamic quantum circuit compiler that creates an exact $2N$-qubit register for any $N$-hop path, performs sequential intermediate Bell measurements and coherent corrections, and traces out repeaters.
- **`QR-012`**: Real-World Telecom Topologies & Multi-Metric Routing:
  - Add realistic Karnataka Quantum Network preset (Belagavi, Hubballi, Davanagere, Shivamogga, Tumakuru, Bengaluru) with authentic geographic fiber distances.
  - Add parametric topology generators (Ring, Star, Grid).
  - Implement dual-metric routing comparing Quantum Fidelity vs. Classical Propagation Delay ($5\,\mu\text{s/km}$).

---

### 3. Veeresh M A — Validation, Tomography, Integration & Dashboard Lead
**Owns:** `validate.py`, `tomography.py`, `app.py`, `app/streamlit_app.py`, `tests/test_validation.py`, `tests/test_tomography.py`, `requirements.txt`, environment & demo material.

**Phase 1 Tasks (Completed):**
- **`QR-000`**: Isolated virtual environment, dependency pinning, and regression runner.
- **`QR-005`**: Circuit-level multi-hop entanglement swapping simulation (co-developed with Srijan).
- **`QR-006`**: Analytical Werner model vs. Qiskit Aer circuit simulation validation harness.
- **`QR-007`**: Baseline Streamlit interactive dashboard MVP.

**Phase 2 Advanced Tasks (In Progress):**
- **`QR-013`**: Quantum State Tomography & Finite-Shot Measurement Engine:
  - Implement Pauli basis tomography ($X, Y, Z$ observable measurements over 1024 / 4096 shots) using Qiskit Aer with finite-shot variance.
  - Reconstruct Bob's density matrix via linear inversion:
    $$\rho_{\text{reconstructed}} = \frac{1}{2}\left(I + \langle X \rangle \sigma_x + \langle Y \rangle \sigma_y + \langle Z \rangle \sigma_z\right)$$
  - Compare Tomographic Experimental Fidelity vs. Exact Numerical Simulation under shot noise.
- **`QR-014`**: Dashboard 2.0 (3D Bloch Sphere, OpenQASM 3.0 Exporter & Dynamic Topology UI):
  - Integrate interactive 3D Bloch sphere visualization showing input pure state decaying into mixed state under noise.
  - Provide a one-click OpenQASM 3.0 / Qiskit circuit export button for execution on IBM Quantum physical backends.
  - Expose physical fiber distance sliders and live purification toggles.

---

### 4. Shared Responsibilities
- **`QR-008`**: Regression verification, documentation synchronization, 3-minute video presentation, and final hackathon portal submission.

---

## Master Dependency Graph (Phase 1 + Phase 2)

```mermaid
flowchart TD
    subgraph Phase 1: Baseline MVP
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

    subgraph Phase 2: Qualifier-Winning Upgrades
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
