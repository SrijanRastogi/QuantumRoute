"""Single-qubit quantum teleportation module.

This module models standard single-qubit quantum teleportation over a 3-qubit register:
    - Qubit 0 (q0): Unknown input/message state |psi>.
    - Qubit 1 (q1): Alice's half of the shared Bell pair.
    - Qubit 2 (q2): Bob's half of the shared Bell pair (receiver subsystem).

Implementation note on coherent corrections:
    In accordance with ADR-002 (DECISIONS.md) and PLAN.md §6, the circuit uses
    deferred-measurement coherent feedforward corrections (CX(1, 2) and CZ(0, 2)).
    This provides a mathematically exact simulation of the corrected output state on Bob's
    subsystem under ideal classical feedforward without requiring dynamic mid-circuit
    branching. It is a simulation of the ideal post-correction state, not a literal
    implementation of physical classical transmission.

Subsystem Extraction:
    Tracing out qubits 0 and 1 via partial_trace(rho_3qubit, [0, 1]) leaves the reduced
    single-qubit density matrix of Bob (qubit 2).
"""

from __future__ import annotations

import numpy as np
from typing import Any
from qiskit import QuantumCircuit
from qiskit.circuit import Instruction
from qiskit.quantum_info import (
    DensityMatrix,
    Statevector,
    state_fidelity,
    partial_trace,
    Kraus,
)


def prepare_input_state(theta: float, phi: float) -> Statevector:
    """Prepare a deterministic single-qubit pure state on the Bloch sphere.

    The state is defined as:
        |psi(theta, phi)> = cos(theta / 2) |0> + exp(i * phi) * sin(theta / 2) |1>

    Args:
        theta: Polar angle in radians [0, pi].
        phi: Azimuthal angle in radians [0, 2*pi].

    Returns:
        A normalized Qiskit Statevector representing |psi(theta, phi)>.
    """
    alpha = np.cos(theta / 2.0)
    beta = np.exp(1j * phi) * np.sin(theta / 2.0)
    sv = Statevector(np.array([alpha, beta], dtype=complex))
    return sv


def input_state(theta: float, phi: float) -> Statevector:
    """Alias for prepare_input_state matching INTERFACES.md specification.

    Args:
        theta: Polar angle in radians.
        phi: Azimuthal angle in radians.

    Returns:
        Normalized Statevector of the single-qubit input state.
    """
    return prepare_input_state(theta, phi)


def create_bell_pair() -> QuantumCircuit:
    """Create a 2-qubit circuit that prepares the canonical |Phi+> Bell state.

    |Phi+> = (|00> + |11>) / sqrt(2)

    Qubits:
        q0: First half of the Bell pair.
        q1: Second half of the Bell pair.

    Returns:
        QuantumCircuit of 2 qubits preparing |Phi+>.
    """
    qc = QuantumCircuit(2, name="bell_pair")
    qc.h(0)
    qc.cx(0, 1)
    return qc


def build_teleportation_circuit(
    state: Statevector | QuantumCircuit | tuple[float, float],
    link_error: Any = None,
) -> QuantumCircuit:
    """Build the complete 3-qubit teleportation circuit.

    Register layout:
        q0: Input state to be teleported.
        q1: Alice's half of the Bell pair.
        q2: Bob's half of the Bell pair.

    Protocol steps:
        1. Initialize q0 to the desired input state.
        2. Prepare canonical Bell pair |Phi+> on (q1, q2).
        3. If link_error is provided, apply the noise channel to q2 (the distributed qubit).
        4. Apply Alice's Bell-basis measurement operations: CX(q0, q1) followed by H(q0).
        5. Apply coherent feedforward corrections on Bob's qubit (q2):
           CX(q1, q2) conditioned on q1 (bit 1 / X-correction),
           CZ(q0, q2) conditioned on q0 (bit 0 / Z-correction).

    Args:
        state: Input state specification. Can be:
            - A Statevector (length 2).
            - A 1-qubit QuantumCircuit preparing the state from |0>.
            - A tuple (theta, phi) in radians.
        link_error: Optional quantum channel, Kraus operator, or float depolarizing parameter
            applied to Bob's entangled qubit (q2) before Alice's Bell operations.

    Returns:
        Constructed 3-qubit QuantumCircuit.
    """
    qc = QuantumCircuit(3, name="teleportation")

    # Step 1: Input state preparation on q0
    if isinstance(state, tuple) and len(state) == 2:
        theta, phi = float(state[0]), float(state[1])
        qc.ry(theta, 0)
        qc.p(phi, 0)
    elif isinstance(state, QuantumCircuit):
        if state.num_qubits != 1:
            raise ValueError(
                f"Input state QuantumCircuit must have exactly 1 qubit, but got {state.num_qubits} qubits."
            )
        qc.compose(state, [0], inplace=True)
    elif isinstance(state, Statevector):
        if state.num_qubits != 1:
            raise ValueError(
                f"Input Statevector must be a single-qubit state (dim 2), but got {state.dim} dimensions."
            )
        qc.prepare_state(state, [0])
    else:
        raise TypeError(
            f"Unsupported state format: {type(state)}. "
            "Expected Statevector, 1-qubit QuantumCircuit, or (theta, phi) tuple."
        )

    # Step 2: Shared Bell pair preparation between Alice (q1) and Bob (q2)
    qc.h(1)
    qc.cx(1, 2)

    # Step 3: Link noise channel on distributed link qubit (Bob's qubit q2)
    if link_error is not None:
        if isinstance(link_error, bool):
            raise TypeError(
                "link_error cannot be a boolean; expected float parameter in [0.0, 1.0], QuantumChannel, or None."
            )
        elif isinstance(link_error, (int, float)):
            from quantumroute.noise import make_depolarizing_channel
            channel_op = make_depolarizing_channel(float(link_error))
            qc.append(channel_op, [2])
        elif isinstance(link_error, (Instruction, Kraus)):
            qc.append(link_error, [2])
        elif hasattr(link_error, "to_quantumchannel"):
            kraus_op = Kraus(link_error)
            qc.append(kraus_op, [2])
        elif hasattr(link_error, "to_instruction"):
            qc.append(link_error.to_instruction(), [2])
        else:
            # Try directly appending
            qc.append(link_error, [2])

    # Step 4: Alice's Bell-basis measurement operations
    qc.cx(0, 1)
    qc.h(0)

    # Step 5: Coherent feedforward corrections on Bob's qubit (q2)
    # q1 == 1 applies X on q2
    qc.cx(1, 2)
    # q0 == 1 applies Z on q2
    qc.cz(0, 2)

    return qc


def extract_bob_density_matrix(circuit: QuantumCircuit) -> DensityMatrix:
    """Simulate the teleportation circuit and extract Bob's reduced density matrix.

    Uses exact density-matrix evaluation via Qiskit quantum_info. Traces out qubits 0 and 1
    (Alice's message and Bell qubit), returning Bob's 1-qubit reduced density matrix on qubit 2.

    Validates:
        - Trace is 1.0 within numerical precision (±10^-7).
        - Matrix is Hermitian.
        - Matrix is positive semi-definite (eigenvalues >= -10^-9).

    Args:
        circuit: 3-qubit teleportation circuit.

    Returns:
        DensityMatrix of Bob's qubit (dimension 2x2).
    """
    if circuit.num_qubits != 3:
        raise ValueError(
            f"Expected a 3-qubit teleportation circuit, but got {circuit.num_qubits} qubits."
        )

    # Exact density matrix evaluation of the 3-qubit circuit
    rho_full = DensityMatrix.from_instruction(circuit)

    # Trace out Alice's qubits (subsystems 0 and 1) to isolate Bob (subsystem 2)
    rho_bob = partial_trace(rho_full, [0, 1])

    # Physical validity invariants
    tr = np.trace(rho_bob.data)
    if abs(tr - 1.0) > 1e-6:
        raise ValueError(f"Density matrix trace violates normalization: Tr(rho) = {tr}")

    # Check Hermiticity
    if not np.allclose(rho_bob.data, rho_bob.data.conj().T, atol=1e-7):
        raise ValueError("Density matrix is not Hermitian.")

    # Check positive semi-definiteness
    eigvals = np.linalg.eigvalsh(rho_bob.data)
    if np.any(eigvals < -1e-7):
        raise ValueError(f"Density matrix has negative eigenvalues: {eigvals}")

    return rho_bob


def calculate_state_fidelity(
    rho_target: Statevector | DensityMatrix,
    rho_actual: Statevector | DensityMatrix,
) -> float:
    """Calculate the quantum state fidelity between target and actual states.

    Uses Qiskit's state_fidelity which evaluates:
        F(rho, sigma) = (Tr[sqrt(sqrt(rho) * sigma * sqrt(rho))])^2
    For pure target |psi>, this simplifies to:
        F(|psi>, rho) = <psi| rho |psi>

    Args:
        rho_target: Expected target quantum state.
        rho_actual: Measured/simulated quantum state.

    Returns:
        State fidelity F in [0.0, 1.0].
    """
    fid = float(np.real(state_fidelity(rho_target, rho_actual)))
    # Clip numerical precision artifacts strictly within [0.0, 1.0]
    return float(np.clip(fid, 0.0, 1.0))


def teleport_rho(
    theta: float,
    phi: float,
    link_error: Any = None,
) -> DensityMatrix:
    """Execute teleportation for input state (theta, phi) and return Bob's reduced density matrix.

    Implements the public API contract specified in INTERFACES.md:
        teleport_rho(theta: float, phi: float, link_error=None) -> DensityMatrix

    Args:
        theta: Polar angle in radians of input state.
        phi: Azimuthal angle in radians of input state.
        link_error: Optional noise channel or parameter applied to the distributed link.

    Returns:
        Bob's reduced DensityMatrix after teleportation and corrections.
    """
    circuit = build_teleportation_circuit((theta, phi), link_error=link_error)
    return extract_bob_density_matrix(circuit)
