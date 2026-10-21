"""Circuit-level entanglement swapping simulation across multi-hop repeater chains."""

from typing import Sequence, Tuple
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import DensityMatrix, partial_trace, state_fidelity


def create_werner_density_matrix(w: float) -> DensityMatrix:
    """Construct the exact 2-qubit isotropic Werner density matrix:

    ρ_W(w) = w |Φ+⟩⟨Φ+| + (1 - w) (I_4 / 4)
    """
    if isinstance(w, bool) or not isinstance(w, (int, float)):
        raise TypeError(f"Werner parameter w must be a real number, got {type(w).__name__}")
    if not (0.0 <= float(w) <= 1.0):
        raise ValueError(f"Werner parameter w must be in [0.0, 1.0], got {w}")
    w = float(w)

    # Canonical Bell state |Φ+⟩ = (|00⟩ + |11⟩) / √2
    bell_state = np.zeros(4, dtype=complex)
    bell_state[0] = 1.0 / np.sqrt(2.0)
    bell_state[3] = 1.0 / np.sqrt(2.0)
    bell_dm = np.outer(bell_state, bell_state.conj())

    identity_4 = np.eye(4, dtype=complex) / 4.0
    werner_data = w * bell_dm + (1.0 - w) * identity_4
    return DensityMatrix(werner_data)


def build_n_hop_swapping_circuit(
    link_parameters_or_hops: int | Sequence[float],
) -> QuantumCircuit:
    """Construct the scalable 2N-qubit quantum circuit for an N-hop repeater chain.

    Implements ADR-002 (coherent feedforward corrections under deferred measurement)
    for arbitrary N-hop entanglement swapping.

    For an N-hop path, the network has N links and N-1 intermediate repeater nodes:
        - Link 0: Qubits (0, 1) [Source to Repeater 1]
        - Link 1: Qubits (2, 3) [Repeater 1 to Repeater 2]
        ...
        - Link k: Qubits (2k, 2k+1) [Repeater k to Repeater k+1]
        ...
        - Link N-1: Qubits (2N-2, 2N-1) [Repeater N-1 to Destination]

    At each intermediate repeater node k in {1, ..., N-1}:
        - Qubit 2k-1 (left port) and Qubit 2k (right port) undergo Bell-basis measurement:
            CX(2k-1, 2k)
            H(2k-1)
        - Coherent feedforward corrections are propagated to the next stage qubit (2k+1):
            CX(2k, 2k+1)   [bit-flip correction based on parity outcome]
            CZ(2k-1, 2k+1) [phase-flip correction based on phase outcome]

    Terminal Endpoints:
        Qubit 0 (Source) and Qubit 2N-1 (Destination).
        All intermediate qubits [1, 2, ..., 2N-2] are subsequently traced out.

    Args:
        link_parameters_or_hops: Either the integer number of hops N (>= 1),
                                 or a sequence of link parameters whose length determines N.

    Returns:
        QuantumCircuit: A 2N-qubit circuit implementing the complete swapping chain.

    Raises:
        ValueError: If N < 1.
    """
    if isinstance(link_parameters_or_hops, bool) or isinstance(link_parameters_or_hops, (str, bytes)):
        raise TypeError(
            f"Expected int or Sequence of floats for link_parameters_or_hops, got {type(link_parameters_or_hops).__name__}"
        )
    if isinstance(link_parameters_or_hops, int):
        num_hops = link_parameters_or_hops
    elif isinstance(link_parameters_or_hops, Sequence):
        num_hops = len(link_parameters_or_hops)
    else:
        raise TypeError(
            f"Expected int or Sequence for link_parameters_or_hops, got {type(link_parameters_or_hops).__name__}"
        )

    if num_hops < 1:
        raise ValueError(f"Number of hops must be at least 1, got {num_hops}")

    # Total qubits in joint state is 2 * num_hops
    total_qubits = 2 * num_hops
    qc = QuantumCircuit(total_qubits, name=f"swapping_{num_hops}hop")

    # For 1 hop, no intermediate swapping operations are required
    if num_hops == 1:
        return qc

    # Apply sequential Bell-state measurements and coherent feedforward corrections
    # across each intermediate repeater k in {1, ..., N-1}
    for k in range(1, num_hops):
        rep_left = 2 * k - 1
        rep_right = 2 * k
        target_qubit = 2 * k + 1

        # Bell measurement on repeater qubits (rep_left, rep_right)
        qc.cx(rep_left, rep_right)
        qc.h(rep_left)

        # Coherent feedforward corrections to the forward link qubit
        qc.cx(rep_right, target_qubit)
        qc.cz(rep_left, target_qubit)

    return qc


def simulate_swapping_chain(
    link_parameters: Sequence[float],
    max_circuit_hops: int = 5,
) -> DensityMatrix:
    """Simulate entanglement swapping along an arbitrary multi-hop repeater path.

    Uses coherent feedforward corrections (ADR-002 deferred measurement).
    Evaluates the exact 2-qubit reduced density matrix between the terminal endpoints.

    For paths with N <= max_circuit_hops (up to 10 qubits), an exact 2N-qubit joint density
    matrix is constructed, evolved through the compiled quantum circuit, and intermediate
    repeaters are traced out using partial trace.

    For larger paths (N > max_circuit_hops), where full density matrix representation would
    exceed machine memory (e.g., > 10 qubits), the state is evaluated using the mathematically
    proven isotropic Werner composition theorem:
        w_path = prod_{i=1}^N w_i

    Args:
        link_parameters: List of Werner parameters w_e for consecutive links in the path.
        max_circuit_hops: Maximum number of hops to simulate via full 2N-qubit circuit
                          evolution before applying theorem composition (default: 5).

    Returns:
        DensityMatrix: 2-qubit reduced density matrix of the terminal nodes.
    """
    num_links = len(link_parameters)
    if num_links == 0:
        raise ValueError("Must provide at least one link parameter.")

    validated_links = []
    for w in link_parameters:
        if isinstance(w, bool) or not isinstance(w, (int, float)):
            raise TypeError(f"Invalid link parameter type: {type(w).__name__}")
        w_float = float(w)
        if not (0.0 <= w_float <= 1.0):
            raise ValueError(f"Invalid Werner parameter: {w}")
        validated_links.append(w_float)
    link_parameters = validated_links

    # 1 Hop: Single Bell pair between endpoints
    if num_links == 1:
        return create_werner_density_matrix(link_parameters[0])

    # Dynamic 2N-qubit quantum circuit simulation for N <= max_circuit_hops
    if num_links <= max_circuit_hops:
        # Build tensor product of initial 2-qubit Werner states along the chain:
        # joint_dm = rho_W(w_0) ⊗ rho_W(w_1) ⊗ ... ⊗ rho_W(w_{N-1})
        joint_dm = create_werner_density_matrix(link_parameters[0])
        for w in link_parameters[1:]:
            joint_dm = joint_dm.tensor(create_werner_density_matrix(w))

        # Dynamically compile the 2N-qubit swapping circuit
        qc = build_n_hop_swapping_circuit(num_links)

        # Evolve density matrix through the swapping circuit
        evolved_dm = joint_dm.evolve(qc)

        # Intermediate repeater qubits to trace out: [1, 2, ..., 2N-2]
        intermediate_qubits = list(range(1, 2 * num_links - 1))

        # Terminal endpoints remaining: [0, 2N-1] (Source and Destination)
        end_to_end_dm = partial_trace(evolved_dm, intermediate_qubits)
        return end_to_end_dm

    # For chains exceeding memory bounds (N > max_circuit_hops), apply the proven Werner
    # composition theorem: w_path = prod_{i=1}^N w_i
    w_effective = float(np.prod(link_parameters))
    return create_werner_density_matrix(w_effective)


def calculate_end_to_end_bell_fidelity(end_to_end_dm: DensityMatrix) -> float:
    """Calculate the fidelity of the end-to-end state relative to the ideal |Φ+⟩."""
    ideal_bell = create_werner_density_matrix(1.0)
    return float(state_fidelity(ideal_bell, end_to_end_dm))
