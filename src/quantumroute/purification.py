"""BBPSSW Entanglement Purification Protocol for Noisy Bell Pairs.

Implements the Bennett et al. (1996) bilateral CNOT distillation protocol:
    C. H. Bennett, G. Brassard, S. Popescu, B. Schumacher, J. A. Smolin, and W. K. Wootters,
    "Purification of an Entangled State with Local Operations and Classical Communication",
    Phys. Rev. Lett. 76, 722 (1996).

Given two identical noisy Bell pairs with fidelity F relative to |Φ+⟩,
Alice and Bob perform bilateral CNOTs and computational Z-basis measurements
on the second pair. Conditioning on matching parity outcomes (00 or 11),
the fidelity of the surviving pair is strictly enhanced whenever F > 0.5 (w > 1/3).
"""

from dataclasses import dataclass
from typing import List, Tuple
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import DensityMatrix, Statevector, partial_trace

from quantumroute.swapping import create_werner_density_matrix


@dataclass(frozen=True)
class PurificationResult:
    """Immutable data record summarizing multi-round entanglement purification."""

    initial_fidelity: float
    purified_fidelity: float
    initial_werner: float
    purified_werner: float
    success_probability: float
    rounds: int
    fidelity_gain: float
    pairs_consumed: int
    fidelity_history: List[float]
    probability_history: List[float]

    def __post_init__(self):
        """Validate invariant ranges upon construction."""
        if not (0.0 <= self.initial_fidelity <= 1.0):
            raise ValueError(f"Initial fidelity out of bounds: {self.initial_fidelity}")
        if not (0.0 <= self.purified_fidelity <= 1.0):
            raise ValueError(f"Purified fidelity out of bounds: {self.purified_fidelity}")
        if not (0.0 <= self.success_probability <= 1.0):
            raise ValueError(f"Success probability out of bounds: {self.success_probability}")


def _validate_fidelity(fidelity: float) -> float:
    """Validate that fidelity is a real number in [0.0, 1.0]."""
    if isinstance(fidelity, bool) or not isinstance(fidelity, (int, float)):
        raise TypeError(f"Fidelity must be a real number, got {type(fidelity).__name__}")
    f_val = float(fidelity)
    if not (0.0 <= f_val <= 1.0):
        raise ValueError(f"Fidelity must be in [0.0, 1.0], got {fidelity}")
    return f_val


def _validate_werner(w: float) -> float:
    """Validate that Werner parameter is a real number in [0.0, 1.0]."""
    if isinstance(w, bool) or not isinstance(w, (int, float)):
        raise TypeError(f"Werner parameter must be a real number, got {type(w).__name__}")
    w_val = float(w)
    if not (0.0 <= w_val <= 1.0):
        raise ValueError(f"Werner parameter must be in [0.0, 1.0], got {w}")
    return w_val


def bbpssw_success_probability(initial_fidelity: float) -> float:
    """Compute the analytical probability of passing the bilateral parity check.

    For an isotropic Werner state with Bell-state fidelity F:
        P_succ(F) = F^2 + (2/3) F (1 - F) + (5/9) (1 - F)^2

    Args:
        initial_fidelity: Bell-state fidelity F in [0.0, 1.0].

    Returns:
        Probability of matching parity outcomes in [5/9, 1.0].
    """
    f = _validate_fidelity(initial_fidelity)
    p_succ = (f ** 2) + (2.0 / 3.0) * f * (1.0 - f) + (5.0 / 9.0) * ((1.0 - f) ** 2)
    return float(np.clip(p_succ, 0.0, 1.0))


def bbpssw_output_fidelity(initial_fidelity: float) -> float:
    """Compute the analytical purified Bell-state fidelity after 1 round of BBPSSW.

    For an isotropic Werner state with Bell-state fidelity F:
        F' = [F^2 + (1/9) (1 - F)^2] / P_succ(F)

    Key Physical Properties:
        - If F > 0.5 (w > 1/3): F' > F (Fidelity gain / distillation).
        - If F = 1.0: F' = 1.0 (Pure state fixed point).
        - If F = 0.5: F' = 0.5 (Separability boundary fixed point).
        - If F < 0.5: F' < F (Below threshold degradation).

    Args:
        initial_fidelity: Bell-state fidelity F in [0.0, 1.0].

    Returns:
        Purified Bell-state fidelity F' in [0.0, 1.0].
    """
    f = _validate_fidelity(initial_fidelity)
    p_succ = bbpssw_success_probability(f)
    if p_succ <= 0.0:
        return 0.0
    numerator = (f ** 2) + (1.0 / 9.0) * ((1.0 - f) ** 2)
    f_prime = numerator / p_succ
    return float(np.clip(f_prime, 0.0, 1.0))


def bbpssw_output_werner_parameter(initial_werner: float) -> float:
    """Compute the post-purification Werner parameter w' after 1 round of BBPSSW.

    Relies on the exact relationship:
        F = (1 + 3w) / 4
        w' = (4F' - 1) / 3

    Args:
        initial_werner: Initial Werner parameter w in [0.0, 1.0].

    Returns:
        Purified Werner parameter w' in [0.0, 1.0].
    """
    w = _validate_werner(initial_werner)
    f_in = (1.0 + 3.0 * w) / 4.0
    f_out = bbpssw_output_fidelity(f_in)
    w_out = (4.0 * f_out - 1.0) / 3.0
    return float(np.clip(w_out, 0.0, 1.0))


def build_bbpssw_circuit() -> QuantumCircuit:
    """Construct the 4-qubit bilateral CNOT entanglement purification quantum circuit.

    Qubit Mapping:
        - Qubit 0: Alice's half of primary Bell Pair 1
        - Qubit 1: Bob's half of primary Bell Pair 1
        - Qubit 2: Alice's half of auxiliary Bell Pair 2
        - Qubit 3: Bob's half of auxiliary Bell Pair 2

    Operations:
        - Alice applies CX(control=0, target=2)
        - Bob applies CX(control=1, target=3)
        - Auxiliary qubits (2, 3) are measured in computational Z-basis.
    """
    qc = QuantumCircuit(4, name="bbpssw_purification")
    # Alice bilateral CNOT
    qc.cx(0, 2)
    # Bob bilateral CNOT
    qc.cx(1, 3)
    return qc


def project_matching_parity(state_4q: DensityMatrix) -> Tuple[DensityMatrix, float]:
    """Apply the bilateral parity post-selection projector onto auxiliary qubits (2, 3).

    Post-selection succeeds if both Alice and Bob obtain matching measurement outcomes:
        outcome in {|00⟩_23, |11⟩_23}.

    Args:
        state_4q: 4-qubit DensityMatrix after bilateral CNOT.

    Returns:
        Tuple of (projected_normalized_state_4q, success_probability).
    """
    data = state_4q.data
    dim = data.shape[0]
    if dim != 16:
        raise ValueError(f"Expected 4-qubit (16x16) density matrix, got dimension {dim}")

    # Build projection operator for matching parity on qubits 2 and 3:
    # In binary representation i = (q3 q2 q1 q0)_2:
    # matching parity requires q2 == q3.
    proj_diag = np.zeros(16, dtype=complex)
    for i in range(16):
        q2 = (i >> 2) & 1
        q3 = (i >> 3) & 1
        if q2 == q3:
            proj_diag[i] = 1.0

    p_matrix = np.diag(proj_diag)
    unnormalized = p_matrix @ data @ p_matrix
    p_succ = float(np.real(np.trace(unnormalized)))

    if p_succ <= 1e-15:
        # Zero probability projection fallback
        return DensityMatrix(np.zeros((16, 16), dtype=complex)), 0.0

    normalized = unnormalized / p_succ
    return DensityMatrix(normalized), float(np.clip(p_succ, 0.0, 1.0))


def twirl_to_werner_state(rho: DensityMatrix) -> DensityMatrix:
    """Project / twirl a 2-qubit Bell-diagonal state into an isotropic Werner state.

    The Werner parameter is extracted via:
        F = ⟨Φ+|ρ|Φ+⟩
        w = max(0.0, (4F - 1) / 3)

    Args:
        rho: 2-qubit DensityMatrix.

    Returns:
        Exact isotropic Werner DensityMatrix with identical Bell-state fidelity.
    """
    phi_plus = np.zeros(4, dtype=complex)
    phi_plus[0] = 1.0 / np.sqrt(2.0)
    phi_plus[3] = 1.0 / np.sqrt(2.0)
    bell_vec = Statevector(phi_plus)

    f = float(np.real(bell_vec.expectation_value(rho)))
    w = max(0.0, min(1.0, (4.0 * f - 1.0) / 3.0))
    return create_werner_density_matrix(w)


def simulate_bbpssw_step(
    initial_fidelity_or_w: float,
    input_is_fidelity: bool = True,
) -> Tuple[float, float, DensityMatrix]:
    """Execute a circuit-level density matrix simulation of 1 step of BBPSSW purification.

    Steps:
        1. Initializes two identical Werner pairs ρ_W(w) on qubits (0, 1) and (2, 3).
        2. Applies bilateral CNOTs: CX(0, 2) and CX(1, 3).
        3. Projects auxiliary qubits (2, 3) onto matching parity {|00⟩, |11⟩}.
        4. Traces out auxiliary qubits (2, 3) to isolate surviving primary pair (0, 1).
        5. Evaluates output fidelity against ideal |Φ+⟩.

    Args:
        initial_fidelity_or_w: Input Bell-state fidelity F or Werner parameter w.
        input_is_fidelity: If True, input is interpreted as fidelity F; else as w.

    Returns:
        Tuple of (output_fidelity, success_probability, reduced_density_matrix_pair1).
    """
    if input_is_fidelity:
        f_in = _validate_fidelity(initial_fidelity_or_w)
        w_in = max(0.0, min(1.0, (4.0 * f_in - 1.0) / 3.0))
    else:
        w_in = _validate_werner(initial_fidelity_or_w)

    # 1. Prepare two identical Werner states
    rho1 = create_werner_density_matrix(w_in)
    rho2 = create_werner_density_matrix(w_in)
    # Tensor product: pair 1 on qubits (0, 1), pair 2 on qubits (2, 3)
    rho_4q = rho2.tensor(rho1)

    # 2. Apply bilateral CNOT circuit
    circuit = build_bbpssw_circuit()
    evolved = rho_4q.evolve(circuit)

    # 3. Post-select on matching parity of auxiliary qubits (2, 3)
    projected_4q, p_succ = project_matching_parity(evolved)

    # 4. Partial trace over auxiliary qubits (2, 3)
    reduced_pair1 = partial_trace(projected_4q, [2, 3])

    # 5. Measure output fidelity relative to |Φ+⟩
    phi_plus = np.zeros(4, dtype=complex)
    phi_plus[0] = 1.0 / np.sqrt(2.0)
    phi_plus[3] = 1.0 / np.sqrt(2.0)
    bell_vec = Statevector(phi_plus)

    f_out = float(np.real(bell_vec.expectation_value(reduced_pair1)))
    f_out = float(np.clip(f_out, 0.0, 1.0))

    return f_out, p_succ, reduced_pair1


def simulate_multi_round_bbpssw(
    initial_fidelity_or_w: float,
    rounds: int = 1,
    input_is_fidelity: bool = True,
) -> PurificationResult:
    """Simulate multi-round cascading BBPSSW purification with intermediate twirling.

    In each round k:
        - 2 Bell pairs of fidelity F_{k-1} are consumed to yield 1 pair of fidelity F_k.
        - Bilateral twirling returns the state to isotropic Werner form.
        - Success probability compounds multiplicatively: P_cum = ∏ P_{succ, k}.
        - Total raw Bell pairs consumed = 2^rounds.

    Args:
        initial_fidelity_or_w: Initial Bell fidelity or Werner parameter.
        rounds: Number of sequential distillation rounds (>= 0).
        input_is_fidelity: If True, input is fidelity F; if False, Werner parameter w.

    Returns:
        PurificationResult dataclass containing full performance metrics and history.
    """
    if isinstance(rounds, bool) or not isinstance(rounds, int):
        raise TypeError(f"Rounds must be an integer, got {type(rounds).__name__}")
    if rounds < 0:
        raise ValueError(f"Rounds must be non-negative, got {rounds}")

    if input_is_fidelity:
        f_current = _validate_fidelity(initial_fidelity_or_w)
        w_current = max(0.0, min(1.0, (4.0 * f_current - 1.0) / 3.0))
    else:
        w_current = _validate_werner(initial_fidelity_or_w)
        f_current = (1.0 + 3.0 * w_current) / 4.0

    f_init = f_current
    w_init = w_current

    fidelity_history = [f_current]
    probability_history = []
    p_cum = 1.0

    for _ in range(rounds):
        p_step = bbpssw_success_probability(f_current)
        f_next = bbpssw_output_fidelity(f_current)
        probability_history.append(p_step)
        p_cum *= p_step
        f_current = f_next
        fidelity_history.append(f_current)

    w_final = max(0.0, min(1.0, (4.0 * f_current - 1.0) / 3.0))

    return PurificationResult(
        initial_fidelity=f_init,
        purified_fidelity=f_current,
        initial_werner=w_init,
        purified_werner=w_final,
        success_probability=p_cum,
        rounds=rounds,
        fidelity_gain=f_current - f_init,
        pairs_consumed=2 ** rounds,
        fidelity_history=fidelity_history,
        probability_history=probability_history,
    )
