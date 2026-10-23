"""Entanglement purification module implementing the two-pair BBPSSW recurrence protocol.

This module models the standard two-pair recurrence purification protocol
(Bennett, Bernstein, Popescu, Schumacher, Smolin, Wootters, Phys. Rev. Lett. 76, 722 (1996))
for identical isotropic Werner input states:
    ρ_W(w) = w |Φ+⟩⟨Φ+| + (1 - w) (I_4 / 4),  w ∈ [0, 1]

Target Bell State:
------------------
    |Φ+⟩ = (|00⟩ + |11⟩) / √2

Qubit Register Allocation (4 Qubits):
--------------------------------------
    - Qubit 0: Alice's retained qubit A1 (Pair 1 control)
    - Qubit 1: Bob's retained qubit B1   (Pair 1 control)
    - Qubit 2: Alice's sacrificed qubit A2 (Pair 2 target)
    - Qubit 3: Bob's sacrificed qubit B2   (Pair 2 target)

Protocol Sequence:
------------------
    1. Bilateral CNOT:
       Alice executes CX(A1 -> A2), Bob executes CX(B1 -> B2).
    2. Local Computational-Basis (Z) Measurements:
       Alice measures A2 to bit m_A ∈ {0, 1}.
       Bob measures B2 to bit m_B ∈ {0, 1}.
    3. Parity Selection Rule:
       Accept if and only if m_A == m_B (matching parity).
       - On acceptance: retain pair 1 (A1, B1); discard pair 2 (A2, B2).
       - On rejection: discard both pairs (0 output pairs).

Exact Analytical Recurrence Invariants:
---------------------------------------
    Let F_in = (1 + 3w_in) / 4 be the initial Bell fidelity.
    Success Probability:
        P_succ(w) = (w^2 + 1) / 2 = (8 F_in^2 - 4 F_in + 5) / 9
    Output Bell-Diagonal Coefficients:
        c1' (|Φ+⟩) = (5 w^2 + 2 w + 1) / (4 (w^2 + 1)) = (10 F_in^2 - 2 F_in + 1) / (8 F_in^2 - 4 F_in + 5)
        c2' (|Φ-⟩) = (1 - w) (3 w + 1) / (4 (w^2 + 1))
        c3' (|Ψ+⟩) = (1 - w)^2 / (4 (w^2 + 1))
        c4' (|Ψ-⟩) = (1 - w)^2 / (4 (w^2 + 1))
    Target Output Bell Fidelity:
        F_out = c1'
    Purification Threshold:
        F_threshold = 0.50 (w_threshold = 1/3 ≈ 0.333333)
        - For F_in ∈ (0.50, 1.0]: F_out > F_in (strictly purified)
        - For F_in = 0.50: F_out = 0.50 (fixed point threshold)
        - For F_in ∈ [0.25, 0.50): F_out < F_in (state degrades toward mixed state)
        - For F_in = 0.25: F_out = 0.25 (maximally mixed fixed point)
    Expected Raw Input Pairs Consumed per Successful Output:
        E[N_pairs] = 2 / P_succ
    Derived Average Teleportation Fidelity:
        F_tel,avg = (2 F + 1) / 3 = (1 + w) / 2
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import DensityMatrix, Kraus, partial_trace, state_fidelity
from qiskit_aer import AerSimulator
from qiskit_aer.noise import depolarizing_error

# Canonical Bell target vector |Φ+⟩ in computational basis |00>, |01>, |10>, |11>
BELL_PHI_PLUS = np.array([1.0, 0.0, 0.0, 1.0], dtype=complex) / np.sqrt(2.0)
BELL_PHI_MINUS = np.array([1.0, 0.0, 0.0, -1.0], dtype=complex) / np.sqrt(2.0)
BELL_PSI_PLUS = np.array([0.0, 1.0, 1.0, 0.0], dtype=complex) / np.sqrt(2.0)
BELL_PSI_MINUS = np.array([0.0, 1.0, -1.0, 0.0], dtype=complex) / np.sqrt(2.0)

BELL_VECTORS = {
    "Phi+": BELL_PHI_PLUS,
    "Phi-": BELL_PHI_MINUS,
    "Psi+": BELL_PSI_PLUS,
    "Psi-": BELL_PSI_MINUS,
}

BELL_PROJECTORS = {
    name: np.outer(vec, vec.conj()) for name, vec in BELL_VECTORS.items()
}


# ==============================================================================
# Validators and Converters
# ==============================================================================


def validate_werner_w(w: float) -> float:
    """Validate that Werner parameter w is a float within [0.0, 1.0]."""
    if isinstance(w, bool) or not isinstance(w, (int, float)):
        raise TypeError(f"Werner parameter w must be a real number, got {type(w).__name__}")
    w_val = float(w)
    if w_val < -1e-9 or w_val > 1.0 + 1e-9:
        raise ValueError(f"Werner parameter w must be in [0.0, 1.0], got {w}")
    return max(0.0, min(1.0, w_val))


def validate_bell_fidelity(f: float) -> float:
    """Validate that Bell fidelity F is a float within physical interval [0.25, 1.0]."""
    if isinstance(f, bool) or not isinstance(f, (int, float)):
        raise TypeError(f"Bell fidelity F must be a real number, got {type(f).__name__}")
    f_val = float(f)
    if f_val < 0.25 - 1e-9 or f_val > 1.0 + 1e-9:
        raise ValueError(f"Bell fidelity F must be in physical range [0.25, 1.0], got {f}")
    return max(0.25, min(1.0, f_val))


def werner_w_to_fidelity(w: float) -> float:
    """Convert Werner parameter w ∈ [0, 1] to Bell fidelity F = (1 + 3w) / 4."""
    w_val = validate_werner_w(w)
    return (1.0 + 3.0 * w_val) / 4.0


def fidelity_to_werner_w(f: float) -> float:
    """Convert Bell fidelity F ∈ [0.25, 1] to Werner parameter w = (4F - 1) / 3."""
    f_val = validate_bell_fidelity(f)
    return max(0.0, min(1.0, (4.0 * f_val - 1.0) / 3.0))


def fidelity_to_average_teleportation(f: float) -> float:
    """Convert Bell state fidelity F to Horodecki average teleportation fidelity."""
    f_val = validate_bell_fidelity(f)
    return (2.0 * f_val + 1.0) / 3.0


# ==============================================================================
# Result Dataclasses
# ==============================================================================


@dataclass(frozen=True)
class PurificationAnalyticalResult:
    """Analytical calculation report for BBPSSW purification."""

    input_werner_w: float
    input_bell_fidelity: float
    input_teleport_fidelity: float
    success_probability: float
    output_bell_coefficients: Dict[str, float]
    output_bell_fidelity: float
    output_werner_w_twirled: float
    output_teleport_fidelity: float
    fidelity_gain: float
    is_purified: bool
    expected_raw_pairs_consumed: float
    threshold_fidelity: float = 0.50
    threshold_werner_w: float = 1.0 / 3.0


@dataclass(frozen=True)
class PurificationDMResult:
    """Density-matrix simulation result for BBPSSW purification."""

    input_werner_w: float
    input_bell_fidelity: float
    success_probability: float
    output_bell_coefficients: Dict[str, float]
    output_bell_fidelity: float
    output_werner_w_twirled: float
    output_teleport_fidelity: float
    fidelity_gain: float
    is_purified: bool
    expected_raw_pairs_consumed: float
    retained_density_matrix: DensityMatrix
    is_hermitian: bool
    is_positive: bool
    trace: float


@dataclass(frozen=True)
class PurificationShotResult:
    """Finite-shot simulation result for BBPSSW purification."""

    input_werner_w: float
    input_bell_fidelity: float
    total_attempts: int
    accepted_attempts: int
    estimated_success_probability: float
    success_probability_uncertainty: float
    estimated_output_fidelity: Optional[float]
    output_fidelity_uncertainty: Optional[float]
    estimated_bell_coefficients: Dict[str, float]
    expected_raw_pairs_consumed_estimate: Optional[float]
    fidelity_reliable: bool
    warning_message: Optional[str] = None


# ==============================================================================
# Analytical Engine
# ==============================================================================


def calculate_bbpssw_analytical(w: float) -> PurificationAnalyticalResult:
    """Compute the exact analytical BBPSSW recurrence output for Werner input w.

    Args:
        w: Werner parameter of the two identical input pairs in [0.0, 1.0].

    Returns:
        PurificationAnalyticalResult containing exact probabilities and fidelities.
    """
    w_val = validate_werner_w(w)
    f_in = werner_w_to_fidelity(w_val)
    f_tel_in = fidelity_to_average_teleportation(f_in)

    # Exact success probability: P_succ = (w^2 + 1) / 2
    p_succ = (w_val**2 + 1.0) / 2.0

    # Output Bell-diagonal coefficients
    denom = 4.0 * (w_val**2 + 1.0)
    c1_out = (5.0 * w_val**2 + 2.0 * w_val + 1.0) / denom
    c2_out = (1.0 - w_val) * (3.0 * w_val + 1.0) / denom
    c3_out = (1.0 - w_val) ** 2 / denom
    c4_out = c3_out

    # Normalized Bell coefficients dict
    bell_coeffs = {
        "Phi+": float(c1_out),
        "Phi-": float(c2_out),
        "Psi+": float(c3_out),
        "Psi-": float(c4_out),
    }

    f_out = float(c1_out)
    gain = f_out - f_in
    is_purified = gain > 1e-12

    # Twirled Werner parameter w_out = (4 F_out - 1) / 3
    w_out_twirled = (2.0 * w_val * (2.0 * w_val + 1.0)) / (3.0 * (w_val**2 + 1.0))
    w_out_twirled = max(0.0, min(1.0, float(w_out_twirled)))

    f_tel_out = fidelity_to_average_teleportation(f_out)
    expected_pairs = 2.0 / p_succ

    return PurificationAnalyticalResult(
        input_werner_w=w_val,
        input_bell_fidelity=f_in,
        input_teleport_fidelity=f_tel_in,
        success_probability=p_succ,
        output_bell_coefficients=bell_coeffs,
        output_bell_fidelity=f_out,
        output_werner_w_twirled=w_out_twirled,
        output_teleport_fidelity=f_tel_out,
        fidelity_gain=gain,
        is_purified=is_purified,
        expected_raw_pairs_consumed=expected_pairs,
    )


# ==============================================================================
# Exact Twirling Construction (G12 Bilateral Subgroup)
# ==============================================================================


def _get_g12_twirl_unitaries() -> List[np.ndarray]:
    """Generate the exact 12-element single-qubit unitary subgroup G12.

    The group G12 = {C^k * P : k ∈ {0, 1, 2}, P ∈ {I, X, Y, Z}}, where
    C = (I - i(X + Y + Z)) / 2 cyclically permutes the Pauli axes (X -> Y -> Z -> X).
    Under bilateral action (U ⊗ U*), |Φ+⟩ is invariant, and the three orthogonal
    Bell states {|Φ-⟩, |Ψ+⟩, |Ψ-⟩} are uniformly averaged, producing the exact
    isotropic Werner state ρ_W(w_out).
    """
    I = np.eye(2, dtype=complex)
    X = np.array([[0.0, 1.0], [1.0, 0.0]], dtype=complex)
    Y = np.array([[0.0, -1.0j], [1.0j, 0.0]], dtype=complex)
    Z = np.array([[1.0, 0.0], [0.0, -1.0]], dtype=complex)

    U_c = 0.5 * (I - 1.0j * (X + Y + Z))
    cyclic_powers = [I, U_c, U_c @ U_c]
    paulis = [I, X, Y, Z]

    g12 = [c @ p for c in cyclic_powers for p in paulis]
    return g12


def apply_werner_twirl(dm: DensityMatrix) -> DensityMatrix:
    """Apply bilateral Werner twirling using the exact 12-element Clifford subgroup G12.

    Note on Physical Implementation:
        Ideal twirling is a mathematical modeling operation used to map an anisotropic
        Bell-diagonal state back to the standard isotropic Werner parameter form. In physical
        implementations, twirling requires shared random bits and local single-qubit rotations
        that incur control errors and gate noise.
    """
    g12 = _get_g12_twirl_unitaries()
    rho_data = dm.data
    rho_twirled = np.zeros((4, 4), dtype=complex)

    for u in g12:
        u_bi = np.kron(u, u.conj())
        rho_twirled += u_bi @ rho_data @ u_bi.conj().T

    rho_twirled /= float(len(g12))
    return DensityMatrix(rho_twirled)


# ==============================================================================
# Density-Matrix Simulation
# ==============================================================================


def simulate_bbpssw_density_matrix(
    w: float, apply_twirling: bool = False
) -> PurificationDMResult:
    """Simulate the 4-qubit BBPSSW recurrence protocol via exact matrix mechanics.

    Qubit ordering in computational basis:
        |A1 B1 A2 B2> = |A1 B1> ⊗ |A2 B2>
        - A1 (q0), B1 (q1): Retained pair 1
        - A2 (q2), B2 (q3): Sacrificed pair 2
    """
    w_val = validate_werner_w(w)
    f_in = werner_w_to_fidelity(w_val)

    # Initial 2-qubit Werner pair density matrix
    i4 = np.eye(4, dtype=complex) / 4.0
    rho_pair = w_val * BELL_PROJECTORS["Phi+"] + (1.0 - w_val) * i4

    # 4-qubit joint density matrix |A1 B1> ⊗ |A2 B2>
    rho_4q = np.kron(rho_pair, rho_pair)

    # Construct Bilateral CNOT unitary in |A1 B1 A2 B2> basis
    # Alice CX: control A1 (bit 3), target A2 (bit 1)
    # Bob CX:   control B1 (bit 2), target B2 (bit 0)
    U_bi_cx = np.zeros((16, 16), dtype=complex)
    for a1 in (0, 1):
        for b1 in (0, 1):
            for a2 in (0, 1):
                for b2 in (0, 1):
                    in_idx = (a1 << 3) | (b1 << 2) | (a2 << 1) | b2
                    a2_out = a2 ^ a1
                    b2_out = b2 ^ b1
                    out_idx = (a1 << 3) | (b1 << 2) | (a2_out << 1) | b2_out
                    U_bi_cx[out_idx, in_idx] = 1.0

    rho_evolved = U_bi_cx @ rho_4q @ U_bi_cx.conj().T

    # Computational Z-basis measurement on (A2, B2) with parity acceptance a2 == b2
    P_accept = np.zeros((16, 16), dtype=complex)
    for a1 in (0, 1):
        for b1 in (0, 1):
            for a2 in (0, 1):
                for b2 in (0, 1):
                    if a2 == b2:
                        idx = (a1 << 3) | (b1 << 2) | (a2 << 1) | b2
                        P_accept[idx, idx] = 1.0

    unnorm_accepted = P_accept @ rho_evolved @ P_accept
    p_succ = float(np.real(np.trace(unnorm_accepted)))

    if p_succ <= 1e-15:
        raise RuntimeError("Purification acceptance probability is non-positive.")

    rho_accepted_4q = unnorm_accepted / p_succ

    # Partial trace over sacrificed qubits (A2, B2) to get 2-qubit state on (A1, B1)
    rho_retained = np.zeros((4, 4), dtype=complex)
    for a1 in (0, 1):
        for b1 in (0, 1):
            for a1_p in (0, 1):
                for b1_p in (0, 1):
                    r_2q = (a1 << 1) | b1
                    c_2q = (a1_p << 1) | b1_p
                    val = 0.0 + 0.0j
                    for a2 in (0, 1):
                        for b2 in (0, 1):
                            r_4q = (a1 << 3) | (b1 << 2) | (a2 << 1) | b2
                            c_4q = (a1_p << 3) | (b1_p << 2) | (a2 << 1) | b2
                            val += rho_accepted_4q[r_4q, c_4q]
                    rho_retained[r_2q, c_2q] = val

    retained_dm = DensityMatrix(rho_retained)
    if apply_twirling:
        retained_dm = apply_werner_twirl(retained_dm)

    # Physical checks
    is_hermitian = bool(np.allclose(retained_dm.data, retained_dm.data.conj().T, atol=1e-10))
    evals = np.linalg.eigvalsh(retained_dm.data)
    is_positive = bool(np.all(evals >= -1e-10))
    trace_val = float(np.real(np.trace(retained_dm.data)))

    # Compute Bell-state coefficients
    bell_coeffs = {
        name: float(np.real(np.trace(retained_dm.data @ proj)))
        for name, proj in BELL_PROJECTORS.items()
    }
    f_out = bell_coeffs["Phi+"]
    gain = f_out - f_in
    is_purified = gain > 1e-12

    w_out_twirled = max(0.0, min(1.0, (4.0 * f_out - 1.0) / 3.0))
    f_tel_out = fidelity_to_average_teleportation(f_out)
    expected_pairs = 2.0 / p_succ

    return PurificationDMResult(
        input_werner_w=w_val,
        input_bell_fidelity=f_in,
        success_probability=p_succ,
        output_bell_coefficients=bell_coeffs,
        output_bell_fidelity=f_out,
        output_werner_w_twirled=w_out_twirled,
        output_teleport_fidelity=f_tel_out,
        fidelity_gain=gain,
        is_purified=is_purified,
        expected_raw_pairs_consumed=expected_pairs,
        retained_density_matrix=retained_dm,
        is_hermitian=is_hermitian,
        is_positive=is_positive,
        trace=trace_val,
    )


# ==============================================================================
# Circuit Construction & Finite-Shot Simulation
# ==============================================================================


def build_bbpssw_circuit(w: Optional[float] = None) -> QuantumCircuit:
    """Build the 4-qubit BBPSSW quantum circuit.

    If w is None, builds the bilateral CNOT core circuit: CX(0, 2) and CX(1, 3).
    If w is provided, builds the complete simulation circuit with state prep, noise,
    and measurement.
    """
    if w is None:
        qc = QuantumCircuit(4, name="bbpssw_cnot_core")
        qc.cx(0, 2)
        qc.cx(1, 3)
        return qc

    return build_bbpssw_experiment_circuit(w)


def build_bbpssw_experiment_circuit(w: float) -> QuantumCircuit:
    """Build the full 4-qubit BBPSSW experiment circuit with noise and measurements.

    Layout:
        q0: Alice retained (A1)
        q1: Bob retained (B1)
        q2: Alice sacrificed (A2)
        q3: Bob sacrificed (B2)
        c0, c1: Parity check bits (q2, q3)
        c2, c3: Bell basis witness bits on (q0, q1)
    """
    w_val = validate_werner_w(w)
    p_noise = 1.0 - w_val

    qc = QuantumCircuit(4, 4, name="bbpssw_purification")

    # Step 1: Prepare Pair 1 |Φ+⟩ on (q0, q1) and Pair 2 |Φ+⟩ on (q2, q3)
    qc.h(0)
    qc.cx(0, 1)
    qc.h(2)
    qc.cx(2, 3)

    # Step 2: Apply depolarizing noise channel p = 1 - w to distributed qubits (q1, q3)
    if p_noise > 1e-9:
        k_depol = Kraus(depolarizing_error(p_noise, 1))
        qc.append(k_depol, [1])
        qc.append(k_depol, [3])

    # Step 3: Bilateral CNOT (Alice: 0 -> 2, Bob: 1 -> 3)
    qc.cx(0, 2)
    qc.cx(1, 3)

    # Step 4: Measure sacrificed qubits into c0, c1
    qc.measure(2, 0)
    qc.measure(3, 1)

    # Step 5: Bell witness measurement on retained pair (q0, q1) into c2, c3
    qc.cx(0, 1)
    qc.h(0)
    qc.measure(0, 2)
    qc.measure(1, 3)

    return qc


def simulate_bbpssw_shots(
    w: float, shots: int = 4096, seed: Optional[int] = 42
) -> PurificationShotResult:
    """Simulate BBPSSW purification with finite statistical shots in Qiskit Aer.

    Proper Statistical Uncertainty Accounting:
        - Acceptance rate uncertainty is evaluated over all attempts:
          σ(P_succ) = sqrt(p_hat * (1 - p_hat) / N_attempts)
        - Conditional output fidelity uncertainty is evaluated over accepted samples only:
          σ(F_out) = sqrt(f_hat * (1 - f_hat) / N_accepted)
    """
    w_val = validate_werner_w(w)
    f_in = werner_w_to_fidelity(w_val)

    if not isinstance(shots, int) or shots < 100:
        raise ValueError(f"Shots must be an integer >= 100, got {shots}")

    qc = build_bbpssw_circuit(w_val)
    sim = AerSimulator()
    run_kwargs: Dict[str, Any] = {"shots": shots}
    if seed is not None:
        run_kwargs["seed_simulator"] = seed

    job = sim.run(qc, **run_kwargs)
    counts = job.result().get_counts()

    n_accepted = 0
    bell_counts = {"Phi+": 0, "Phi-": 0, "Psi+": 0, "Psi-": 0}

    # Parse counts: keys are bitstrings formatted 'c3 c2 c1 c0' or 'c3c2c1c0'
    for bstr, count in counts.items():
        clean_bstr = bstr.replace(" ", "")
        c3 = int(clean_bstr[0])
        c2 = int(clean_bstr[1])
        c1 = int(clean_bstr[2])
        c0 = int(clean_bstr[3])

        # Parity acceptance condition: c0 == c1
        if c0 == c1:
            n_accepted += count
            if c2 == 0 and c3 == 0:
                bell_counts["Phi+"] += count
            elif c2 == 1 and c3 == 0:
                bell_counts["Phi-"] += count
            elif c2 == 0 and c3 == 1:
                bell_counts["Psi+"] += count
            elif c2 == 1 and c3 == 1:
                bell_counts["Psi-"] += count

    p_succ_hat = n_accepted / float(shots)
    sigma_p = math.sqrt(max(0.0, p_succ_hat * (1.0 - p_succ_hat)) / float(shots))

    if n_accepted >= 10:
        f_out_hat = bell_counts["Phi+"] / float(n_accepted)
        sigma_f = math.sqrt(max(0.0, f_out_hat * (1.0 - f_out_hat)) / float(n_accepted))
        bell_coeff_estimates = {
            k: float(v) / float(n_accepted) for k, v in bell_counts.items()
        }
        fidelity_reliable = True
        warning = None
        expected_pairs_est = (
            (2.0 / p_succ_hat) if p_succ_hat > 1e-6 else None
        )
    else:
        f_out_hat = None
        sigma_f = None
        bell_coeff_estimates = {k: 0.0 for k in bell_counts}
        fidelity_reliable = False
        warning = (
            f"Only {n_accepted} attempts accepted out of {shots} shots. "
            "Insufficient sample size to estimate conditional output fidelity reliably."
        )
        expected_pairs_est = None

    return PurificationShotResult(
        input_werner_w=w_val,
        input_bell_fidelity=f_in,
        total_attempts=shots,
        accepted_attempts=n_accepted,
        estimated_success_probability=p_succ_hat,
        success_probability_uncertainty=sigma_p,
        estimated_output_fidelity=f_out_hat,
        output_fidelity_uncertainty=sigma_f,
        estimated_bell_coefficients=bell_coeff_estimates,
        expected_raw_pairs_consumed_estimate=expected_pairs_est,
        fidelity_reliable=fidelity_reliable,
        warning_message=warning,
    )


# ==============================================================================
# Legacy / Extended Compatibility Functions
# ==============================================================================


@dataclass(frozen=True)
class PurificationResult:
    """Multi-round cascading purification distillation result."""

    rounds: int
    pairs_consumed: int
    fidelity_history: List[float]
    probability_history: List[float]
    purified_fidelity: float
    success_probability: float
    fidelity_gain: float


def bbpssw_output_fidelity(f: float) -> float:
    """Exact analytical BBPSSW output Bell fidelity F' as a function of input fidelity F."""
    f_val = validate_bell_fidelity(f)
    return (10.0 * f_val**2 - 2.0 * f_val + 1.0) / (8.0 * f_val**2 - 4.0 * f_val + 5.0)


def bbpssw_success_probability(f: float) -> float:
    """Exact analytical BBPSSW success probability P_succ as a function of input fidelity F."""
    f_val = validate_bell_fidelity(f)
    return (8.0 * f_val**2 - 4.0 * f_val + 5.0) / 9.0


def bbpssw_output_werner_parameter(w: float) -> float:
    """Exact analytical BBPSSW output Werner parameter w' as a function of input w."""
    w_val = validate_werner_w(w)
    return (2.0 * w_val * (2.0 * w_val + 1.0)) / (3.0 * (w_val**2 + 1.0))


def twirl_to_werner_state(dm: DensityMatrix) -> DensityMatrix:
    """Alias for apply_werner_twirl."""
    return apply_werner_twirl(dm)


def project_matching_parity(dm_4qubit: DensityMatrix) -> Tuple[float, DensityMatrix]:
    """Project a 4-qubit density matrix onto matching parity on target qubits A2 and B2.

    Args:
        dm_4qubit: 4-qubit joint density matrix (dim 16) in basis |A1 B1 A2 B2>.

    Returns:
        Tuple of (p_succ, rho_retained) where rho_retained is the 2-qubit state on (A1, B1).
    """
    if dm_4qubit.dim != 16:
        raise ValueError(f"Expected 4-qubit density matrix with dim 16, got dim {dm_4qubit.dim}")

    P_accept = np.zeros((16, 16), dtype=complex)
    for a1 in (0, 1):
        for b1 in (0, 1):
            for a2 in (0, 1):
                for b2 in (0, 1):
                    if a2 == b2:
                        idx = (a1 << 3) | (b1 << 2) | (a2 << 1) | b2
                        P_accept[idx, idx] = 1.0

    unnorm = P_accept @ dm_4qubit.data @ P_accept
    p_succ = float(np.real(np.trace(unnorm)))
    if p_succ <= 1e-15:
        raise RuntimeError("Acceptance probability is zero.")

    rho_acc = unnorm / p_succ
    # Trace out A2, B2
    rho_2q = np.zeros((4, 4), dtype=complex)
    for a1 in (0, 1):
        for b1 in (0, 1):
            for a1_p in (0, 1):
                for b1_p in (0, 1):
                    r_2q = (a1 << 1) | b1
                    c_2q = (a1_p << 1) | b1_p
                    val = 0.0 + 0.0j
                    for a2 in (0, 1):
                        for b2 in (0, 1):
                            r_4q = (a1 << 3) | (b1 << 2) | (a2 << 1) | b2
                            c_4q = (a1_p << 3) | (b1_p << 2) | (a2 << 1) | b2
                            val += rho_acc[r_4q, c_4q]
                    rho_2q[r_2q, c_2q] = val

    return p_succ, DensityMatrix(rho_2q)


def simulate_bbpssw_step(
    f_or_w: float, input_is_fidelity: bool = True
) -> Tuple[float, float, DensityMatrix]:
    """Simulate a single BBPSSW purification step on a Werner input state."""
    if input_is_fidelity:
        f_val = validate_bell_fidelity(f_or_w)
        w_val = fidelity_to_werner_w(f_val)
    else:
        w_val = validate_werner_w(f_or_w)

    dm_res = simulate_bbpssw_density_matrix(w_val, apply_twirling=False)
    return (dm_res.output_bell_fidelity, dm_res.success_probability, dm_res.retained_density_matrix)


def simulate_multi_round_bbpssw(
    f_or_w: float, rounds: int = 1, input_is_fidelity: bool = True
) -> PurificationResult:
    """Simulate multi-round cascading BBPSSW purification under twirling assumption.

    In each round r, pairs are twirled back to Werner form to allow recurrence.
    """
    if isinstance(rounds, bool) or not isinstance(rounds, int):
        raise TypeError(f"rounds must be an integer, got {type(rounds).__name__}")
    if rounds < 0:
        raise ValueError(f"rounds must be non-negative, got {rounds}")

    if input_is_fidelity:
        f_init = validate_bell_fidelity(f_or_w)
    else:
        w_init = validate_werner_w(f_or_w)
        f_init = werner_w_to_fidelity(w_init)

    fidelity_history = [f_init]
    prob_history: List[float] = []

    f_current = f_init
    for _ in range(rounds):
        p_step = bbpssw_success_probability(f_current)
        f_next = bbpssw_output_fidelity(f_current)
        prob_history.append(p_step)
        fidelity_history.append(f_next)
        f_current = f_next

    pairs_consumed = 2**rounds if rounds > 0 else 1
    total_p = float(np.prod(prob_history)) if prob_history else 1.0
    gain = f_current - f_init

    return PurificationResult(
        rounds=rounds,
        pairs_consumed=pairs_consumed,
        fidelity_history=fidelity_history,
        probability_history=prob_history,
        purified_fidelity=f_current,
        success_probability=total_p,
        fidelity_gain=gain,
    )

