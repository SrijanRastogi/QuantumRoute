"""Circuit-level entanglement swapping simulation across multi-hop repeater chains."""

from typing import Sequence, Tuple
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import DensityMatrix, partial_trace, state_fidelity


def create_werner_density_matrix(w: float) -> DensityMatrix:
    """Construct the exact 2-qubit isotropic Werner density matrix:

    ρ_W(w) = w |Φ+⟩⟨Φ+| + (1 - w) (I_4 / 4)
    """
    if not (0.0 <= w <= 1.0):
        raise ValueError(f"Werner parameter w must be in [0.0, 1.0], got {w}")

    # Canonical Bell state |Φ+⟩ = (|00⟩ + |11⟩) / √2
    bell_state = np.zeros(4, dtype=complex)
    bell_state[0] = 1.0 / np.sqrt(2.0)
    bell_state[3] = 1.0 / np.sqrt(2.0)
    bell_dm = np.outer(bell_state, bell_state.conj())

    identity_4 = np.eye(4, dtype=complex) / 4.0
    werner_data = w * bell_dm + (1.0 - w) * identity_4
    return DensityMatrix(werner_data)


def simulate_swapping_chain(
    link_parameters: Sequence[float],
) -> DensityMatrix:
    """Simulate entanglement swapping along a multi-hop repeater path.

    Uses coherent feedforward corrections (ADR-002 deferred measurement).
    Evaluates the exact 2-qubit reduced density matrix between the terminal endpoints.

    Args:
        link_parameters: List of Werner parameters w_e for consecutive links in the path.
                         Length 1: Single link (1 hop, 2 qubits).
                         Length 2: 2 hops (4 qubits, intermediate Bell measurement).
                         Length 3: 3 hops (6 qubits, two intermediate Bell measurements).

    Returns:
        DensityMatrix: 2-qubit reduced density matrix of the terminal nodes.
    """
    num_links = len(link_parameters)
    if num_links == 0:
        raise ValueError("Must provide at least one link parameter.")

    for w in link_parameters:
        if not (0.0 <= w <= 1.0):
            raise ValueError(f"Invalid Werner parameter: {w}")

    # 1 Hop: Single Bell pair between endpoints
    if num_links == 1:
        return create_werner_density_matrix(link_parameters[0])

    # 2 Hops: Links (0, 1) and (2, 3). Intermediate repeater has qubits (1, 2)
    if num_links == 2:
        dm1 = create_werner_density_matrix(link_parameters[0])
        dm2 = create_werner_density_matrix(link_parameters[1])
        # 4-qubit joint density matrix: link1 ⊗ link2
        # Qubits: 0 = Source, 1 = Repeater left, 2 = Repeater right, 3 = Destination
        joint_dm = dm1.tensor(dm2)

        # Apply intermediate Bell measurement & coherent corrections:
        # Circuit on 4 qubits
        qc = QuantumCircuit(4)
        # Bell measurement on repeater qubits (1, 2)
        qc.cx(1, 2)
        qc.h(1)
        # Coherent feedforward corrections to Destination (qubit 3):
        # CX controlled by q2 (bit flip)
        # CZ controlled by q1 (phase flip)
        qc.cx(2, 3)
        qc.cz(1, 3)

        # Evolve density matrix through circuit
        evolved_dm = joint_dm.evolve(qc)

        # Trace out intermediate repeater qubits [1, 2]
        # Remaining subsystem is [0, 3] (Source and Destination)
        end_to_end_dm = partial_trace(evolved_dm, [1, 2])
        return end_to_end_dm

    # 3 Hops: Links (0, 1), (2, 3), and (4, 5).
    # Repeaters at (1, 2) and (3, 4). Endpoints: 0 and 5.
    if num_links == 3:
        dm1 = create_werner_density_matrix(link_parameters[0])
        dm2 = create_werner_density_matrix(link_parameters[1])
        dm3 = create_werner_density_matrix(link_parameters[2])
        joint_dm = dm1.tensor(dm2).tensor(dm3)

        qc = QuantumCircuit(6)
        # First swapping on repeater (1, 2) -> correct to qubit 3
        qc.cx(1, 2)
        qc.h(1)
        qc.cx(2, 3)
        qc.cz(1, 3)

        # Second swapping on repeater (3, 4) -> correct to qubit 5
        qc.cx(3, 4)
        qc.h(3)
        qc.cx(4, 5)
        qc.cz(3, 5)

        evolved_dm = joint_dm.evolve(qc)
        # Trace out intermediate qubits [1, 2, 3, 4]
        end_to_end_dm = partial_trace(evolved_dm, [1, 2, 3, 4])
        return end_to_end_dm

    # For larger arbitrary paths, under the validated ideal swapping theorem:
    # w_path = ∏ w_e
    w_effective = float(np.prod(link_parameters))
    return create_werner_density_matrix(w_effective)


def calculate_end_to_end_bell_fidelity(end_to_end_dm: DensityMatrix) -> float:
    """Calculate the fidelity of the end-to-end state relative to the ideal |Φ+⟩."""
    ideal_bell = create_werner_density_matrix(1.0)
    return float(state_fidelity(ideal_bell, end_to_end_dm))
