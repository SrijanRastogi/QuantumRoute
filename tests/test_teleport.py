"""QR-001: Unit tests for single-qubit quantum teleportation.

Verifies:
    1. Input state normalization on the Bloch sphere.
    2. State fidelity boundary invariants (identical = 1.0, orthogonal = 0.0).
    3. Ideal teleportation fidelity >= 0.9999 across cardinal states and 20+ random states.
    4. Bob's reduced density matrix physical properties (trace, Hermiticity, positivity).
    5. Correct receiver subsystem isolation via partial trace over qubits 0 and 1.
    6. Error handling for invalid inputs.
"""

import pytest
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, DensityMatrix

from quantumroute.teleport import (
    prepare_input_state,
    input_state,
    create_bell_pair,
    build_teleportation_circuit,
    extract_bob_density_matrix,
    calculate_state_fidelity,
    teleport_rho,
)


def test_input_state_normalization():
    """Verify that prepared states are strictly normalized across random (theta, phi) pairs."""
    rng = np.random.default_rng(42)
    thetas = rng.uniform(0.0, np.pi, 50)
    phis = rng.uniform(0.0, 2 * np.pi, 50)

    for theta, phi in zip(thetas, phis):
        sv = prepare_input_state(theta, phi)
        # Check L2 norm of the statevector
        norm = np.linalg.norm(sv.data)
        assert abs(norm - 1.0) < 1e-7, f"Norm {norm} != 1.0 for theta={theta}, phi={phi}"

    # Also check the input_state alias
    sv_alias = input_state(np.pi / 3, np.pi / 4)
    assert abs(np.linalg.norm(sv_alias.data) - 1.0) < 1e-7


def test_state_fidelity_boundaries():
    """Verify fidelity invariants: F(rho, rho) == 1.0 and F(psi, psi_perp) == 0.0."""
    # Cardinal basis states
    s0 = Statevector.from_label("0")
    s1 = Statevector.from_label("1")
    s_plus = prepare_input_state(np.pi / 2, 0.0)
    s_minus = prepare_input_state(np.pi / 2, np.pi)
    s_i = prepare_input_state(np.pi / 2, np.pi / 2)
    s_minus_i = prepare_input_state(np.pi / 2, 3 * np.pi / 2)

    # Identical state fidelity must be 1.0
    for s in [s0, s1, s_plus, s_minus, s_i, s_minus_i]:
        fid_self = calculate_state_fidelity(s, s)
        assert abs(fid_self - 1.0) <= 1e-6, f"Self-fidelity {fid_self} != 1.0"

    # Orthogonal pairs must have fidelity 0.0
    orthogonal_pairs = [
        (s0, s1),
        (s_plus, s_minus),
        (s_i, s_minus_i),
    ]
    for sA, sB in orthogonal_pairs:
        fid_ortho = calculate_state_fidelity(sA, sB)
        assert abs(fid_ortho - 0.0) <= 1e-6, f"Orthogonal fidelity {fid_ortho} != 0.0"


def test_create_bell_pair():
    """Verify that create_bell_pair generates canonical |Phi+> state."""
    qc = create_bell_pair()
    assert qc.num_qubits == 2
    sv = Statevector.from_instruction(qc)
    expected_phi_plus = Statevector(np.array([1 / np.sqrt(2), 0, 0, 1 / np.sqrt(2)]))
    fid = calculate_state_fidelity(expected_phi_plus, sv)
    assert abs(fid - 1.0) < 1e-7


def test_ideal_teleportation_cardinal_states():
    """Test ideal teleportation across the 6 cardinal Bloch sphere states."""
    cardinal_states = {
        "|0>": (0.0, 0.0),
        "|1>": (np.pi, 0.0),
        "|+>": (np.pi / 2, 0.0),
        "|->": (np.pi / 2, np.pi),
        "|i>": (np.pi / 2, np.pi / 2),
        "|-i>": (np.pi / 2, 3 * np.pi / 2),
    }

    for label, (theta, phi) in cardinal_states.items():
        psi_target = prepare_input_state(theta, phi)
        rho_bob = teleport_rho(theta, phi, link_error=None)
        fid = calculate_state_fidelity(psi_target, rho_bob)
        assert fid >= 0.9999, (
            f"Ideal teleportation for {label} produced fidelity {fid:.6f} < 0.9999"
        )


def test_ideal_teleportation_random_ensemble():
    """Test ideal teleportation across at least 20 deterministic random input states."""
    rng = np.random.default_rng(42)
    thetas = rng.uniform(0.01, np.pi - 0.01, 25)
    phis = rng.uniform(0.0, 2 * np.pi, 25)

    fidelities = []
    for theta, phi in zip(thetas, phis):
        psi_target = prepare_input_state(theta, phi)
        rho_bob = teleport_rho(theta, phi, link_error=None)
        fid = calculate_state_fidelity(psi_target, rho_bob)
        fidelities.append(fid)
        assert fid >= 0.9999, (
            f"Fidelity {fid} < 0.9999 for theta={theta:.4f}, phi={phi:.4f}"
        )

    assert len(fidelities) >= 20
    min_fid = min(fidelities)
    assert min_fid >= 0.9999, f"Minimum fidelity in ensemble was {min_fid:.7f}"


def test_bob_density_matrix_properties():
    """Verify physical properties of Bob's extracted density matrix."""
    theta, phi = 1.0, 2.0
    rho_bob = teleport_rho(theta, phi, link_error=None)

    # 1. Dimension must be 2x2
    assert rho_bob.data.shape == (2, 2)

    # 2. Trace must be 1.0
    tr = np.trace(rho_bob.data)
    assert abs(tr - 1.0) < 1e-7

    # 3. Must be Hermitian
    assert np.allclose(rho_bob.data, rho_bob.data.conj().T, atol=1e-7)

    # 4. Positive semi-definite
    eigvals = np.linalg.eigvalsh(rho_bob.data)
    assert np.all(eigvals >= -1e-7)

    # 5. Purity of ideal teleportation must be 1.0 (pure state)
    purity = float(np.real(np.trace(rho_bob.data @ rho_bob.data)))
    assert abs(purity - 1.0) < 1e-6


def test_subsystem_extraction_correctness():
    """Verify that Bob's subsystem is isolated properly and not Alice's qubits."""
    # Test an asymmetric state: |1> input
    # If subsystem extraction took q0 or q1 instead of q2, the state could be mixed or wrong
    psi_1 = prepare_input_state(np.pi, 0.0)
    rho_bob = teleport_rho(np.pi, 0.0, link_error=None)

    # Bob must be in |1> with probability ~ 1.0 on |1>
    prob_1 = np.real(rho_bob.data[1, 1])
    assert abs(prob_1 - 1.0) < 1e-6, f"Expected Bob to have prob(|1>)=1.0, got {prob_1}"

    prob_0 = np.real(rho_bob.data[0, 0])
    assert abs(prob_0 - 0.0) < 1e-6, f"Expected Bob to have prob(|0>)=0.0, got {prob_0}"


def test_invalid_circuit_and_state_handling():
    """Verify that invalid inputs raise appropriate exceptions."""
    # 2-qubit circuit should be rejected by extract_bob_density_matrix
    qc_2 = QuantumCircuit(2)
    with pytest.raises(ValueError, match="Expected a 3-qubit teleportation circuit"):
        extract_bob_density_matrix(qc_2)

    # Invalid state argument type
    with pytest.raises(TypeError, match="Unsupported state format"):
        build_teleportation_circuit(12345)  # type: ignore

    # Multi-qubit circuit passed as input state
    with pytest.raises(ValueError, match="must have exactly 1 qubit"):
        build_teleportation_circuit(QuantumCircuit(2))

    # Multi-qubit Statevector passed as input state
    with pytest.raises(ValueError, match="must be a single-qubit state"):
        build_teleportation_circuit(Statevector.from_label("00"))

    # Boolean passed as link_error
    with pytest.raises(TypeError, match="cannot be a boolean"):
        build_teleportation_circuit((0.0, 0.0), link_error=True)


def test_prepare_input_state_density_matrix_conversion():
    """Verify that prepare_input_state output can be converted to DensityMatrix without QiskitError (regression test)."""
    sv = prepare_input_state(np.pi / 3.0, np.pi / 4.0)
    assert isinstance(sv, Statevector)
    dm = DensityMatrix(sv)
    assert dm.is_valid()
    assert abs(dm.trace() - 1.0) < 1e-7
    assert dm.purity() > 0.999999


