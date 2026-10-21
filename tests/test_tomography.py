"""Unit and integration tests for Quantum State Tomography Engine (QR-013).

Verifies:
    1. Pauli matrices and Clifford algebra invariants.
    2. Exact Bloch vector extraction across 6 cardinal states and maximally mixed state.
    3. Density matrix Stokes reconstruction and physical projection to the Bloch sphere.
    4. Measurement circuit generation for X, Y, and Z bases.
    5. Circuit-level execution with AerSimulator on teleportation circuits.
    6. Statistical convergence O(1/√shots) as shot count increases.
    7. Bloch vector contraction under depolarizing noise channels.
    8. Robust input validation and error rejection.
"""

import pytest
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import DensityMatrix, Statevector

from quantumroute.teleport import build_teleportation_circuit, prepare_input_state
from quantumroute.tomography import (
    TomographyResult,
    pauli_matrices,
    exact_bloch_vector,
    reconstruct_density_matrix,
    build_tomography_circuits,
    execute_tomography,
    sample_density_matrix_tomography,
)


def test_pauli_matrices_algebra():
    """Verify algebraic properties and commutation relations of Pauli spin matrices."""
    sx, sy, sz = pauli_matrices()
    i2 = np.eye(2, dtype=complex)

    # 1. Unitarity & Involutory: σ_i^2 = I
    assert np.allclose(sx @ sx, i2)
    assert np.allclose(sy @ sy, i2)
    assert np.allclose(sz @ sz, i2)

    # 2. Traceless: Tr(σ_i) = 0
    assert np.trace(sx) == pytest.approx(0.0)
    assert np.trace(sy) == pytest.approx(0.0)
    assert np.trace(sz) == pytest.approx(0.0)

    # 3. Commutation relation: [σ_x, σ_y] = 2i σ_z
    comm_xy = sx @ sy - sy @ sx
    assert np.allclose(comm_xy, 2.0j * sz)


def test_exact_bloch_vector_cardinal_states():
    """Verify exact Bloch vector coordinates (rx, ry, rz) for all 6 cardinal states."""
    cardinal_states = {
        "|0>": (Statevector.from_label("0"), (0.0, 0.0, 1.0)),
        "|1>": (Statevector.from_label("1"), (0.0, 0.0, -1.0)),
        "|+>": (Statevector.from_label("+"), (1.0, 0.0, 0.0)),
        "|->": (Statevector.from_label("-"), (-1.0, 0.0, 0.0)),
        "|+i>": (Statevector.from_label("r"), (0.0, 1.0, 0.0)),
        "|-i>": (Statevector.from_label("l"), (0.0, -1.0, 0.0)),
    }

    for name, (svec, expected_coords) in cardinal_states.items():
        rho = DensityMatrix(svec)
        rx, ry, rz = exact_bloch_vector(rho)
        assert rx == pytest.approx(expected_coords[0], abs=1e-12), f"Mismatch in rx for {name}"
        assert ry == pytest.approx(expected_coords[1], abs=1e-12), f"Mismatch in ry for {name}"
        assert rz == pytest.approx(expected_coords[2], abs=1e-12), f"Mismatch in rz for {name}"

    # Maximally mixed state I / 2 -> (0, 0, 0)
    rho_mixed = DensityMatrix(np.eye(2, dtype=complex) / 2.0)
    rx, ry, rz = exact_bloch_vector(rho_mixed)
    assert (rx, ry, rz) == pytest.approx((0.0, 0.0, 0.0), abs=1e-12)


def test_reconstruct_density_matrix_physicality():
    """Verify reconstructed states satisfy Tr=1, Hermiticity, and positive semi-definiteness."""
    # Test valid interior and surface points
    test_vectors = [
        (0.0, 0.0, 1.0),     # Pure |0>
        (0.5, -0.5, 0.5),    # Mixed state
        (0.0, 0.0, 0.0),     # Maximally mixed
        (0.8, 0.6, 0.5),     # Norm > 1 (shot noise artifact)
    ]

    for rx, ry, rz in test_vectors:
        rho = reconstruct_density_matrix(rx, ry, rz, physical_projection=True)
        assert isinstance(rho, DensityMatrix)
        data = rho.data

        # 1. Tr(ρ) == 1
        assert np.trace(data) == pytest.approx(1.0 + 0.0j, abs=1e-12)

        # 2. Hermitian: ρ == ρ†
        assert np.allclose(data, data.conj().T, atol=1e-12)

        # 3. Positive semi-definite: all eigenvalues in [0, 1]
        eigvals = np.linalg.eigvalsh(data)
        assert np.all(eigvals >= -1e-12), f"Negative eigenvalue found: {eigvals}"
        assert np.all(eigvals <= 1.0 + 1e-12)


def test_build_tomography_circuits_structure():
    """Verify structure and operation additions for X, Y, and Z tomography circuits."""
    input_s = prepare_input_state(0.5, 0.3)
    qc = build_teleportation_circuit(input_s)

    circuits = build_tomography_circuits(qc, target_qubit=2)
    assert set(circuits.keys()) == {"X", "Y", "Z"}

    for basis, c in circuits.items():
        assert c.num_qubits == 3
        # Has classical register for measurement
        assert len(c.cregs) >= 1

    # Verify basis rotation gates
    ops_x = circuits["X"].count_ops()
    ops_y = circuits["Y"].count_ops()
    ops_z = circuits["Z"].count_ops()

    assert ops_x.get("h", 0) >= ops_z.get("h", 0) + 1
    assert ops_y.get("sdg", 0) >= 1
    assert ops_y.get("h", 0) >= ops_z.get("h", 0) + 1


def test_execute_tomography_on_teleportation_circuit():
    """Verify end-to-end tomography on Bob's qubit in a teleportation circuit."""
    theta = np.pi / 3.0
    phi = np.pi / 4.0
    psi_in = prepare_input_state(theta, phi)
    qc = build_teleportation_circuit(psi_in)
    target_rho = DensityMatrix(psi_in)

    # Bob's qubit is index 2 in 3-qubit teleportation circuit
    result = execute_tomography(
        circuit=qc,
        target_qubit=2,
        shots=8192,
        seed=42,
        target_density_matrix=target_rho,
    )

    assert isinstance(result, TomographyResult)
    assert result.shots == 8192

    # Expected exact Bloch coordinates
    rx_exp = np.sin(theta) * np.cos(phi)
    ry_exp = np.sin(theta) * np.sin(phi)
    rz_exp = np.cos(theta)

    # Statistical tolerance for 8192 shots (~3 * sqrt(1/8192) ≈ 0.033)
    assert abs(result.rx - rx_exp) < 0.05
    assert abs(result.ry - ry_exp) < 0.05
    assert abs(result.rz - rz_exp) < 0.05

    # Tomographic fidelity against true input state
    assert result.fidelity_with_target is not None
    assert result.fidelity_with_target >= 0.98


def test_sample_density_matrix_tomography_convergence():
    """Verify that tomographic estimation error scales as O(1/√shots)."""
    theta = 1.1
    phi = 2.3
    state = prepare_input_state(theta, phi)
    rho = DensityMatrix(state)
    rx_exact, ry_exact, rz_exact = exact_bloch_vector(rho)

    shots_list = [256, 1024, 4096, 16384]
    errors = []

    for s in shots_list:
        res = sample_density_matrix_tomography(rho, shots=s, seed=42)
        err = np.sqrt(
            (res.rx - rx_exact) ** 2 + (res.ry - ry_exact) ** 2 + (res.rz - rz_exact) ** 2
        )
        errors.append(err)

    # High-shot error (16384) must be substantially smaller than low-shot error (256)
    assert errors[-1] < errors[0]
    assert errors[-1] < 0.02


def test_depolarizing_noise_tomography_bloch_shrinkage():
    """Verify that isotropic depolarizing noise contracts the Bloch radius by (1 - p)."""
    state = prepare_input_state(np.pi / 2, 0.0)  # |+> state on x-axis
    rho_pure = DensityMatrix(state)

    for p in [0.0, 0.2, 0.5, 0.8, 1.0]:
        # Depolarized state: ρ(p) = (1 - p) ρ + p (I / 2)
        i2 = np.eye(2, dtype=complex) / 2.0
        rho_noisy = DensityMatrix((1.0 - p) * rho_pure.data + p * i2)

        res = sample_density_matrix_tomography(rho_noisy, shots=16384, seed=42)
        expected_radius = 1.0 - p
        assert res.bloch_radius == pytest.approx(expected_radius, abs=0.03)


def test_tomography_input_validation_and_errors():
    """Verify input validation and informative error messages."""
    # Booleans rejected
    with pytest.raises(TypeError, match="real number"):
        reconstruct_density_matrix(True, 0.0, 0.0)
    with pytest.raises(TypeError, match="integer"):
        execute_tomography(QuantumCircuit(1), target_qubit=False)
    with pytest.raises(TypeError, match="integer"):
        sample_density_matrix_tomography(DensityMatrix(np.eye(2) / 2), shots=True)

    # Non-positive shots rejected
    with pytest.raises(ValueError, match="positive"):
        sample_density_matrix_tomography(DensityMatrix(np.eye(2) / 2), shots=0)
    with pytest.raises(ValueError, match="positive"):
        sample_density_matrix_tomography(DensityMatrix(np.eye(2) / 2), shots=-10)

    # Target qubit index out of bounds
    qc = QuantumCircuit(2)
    with pytest.raises(ValueError, match="out of bounds"):
        build_tomography_circuits(qc, target_qubit=3)
    with pytest.raises(ValueError, match="out of bounds"):
        build_tomography_circuits(qc, target_qubit=-1)

    # Multi-qubit density matrix rejected
    rho_2q = DensityMatrix(np.eye(4) / 4.0)
    with pytest.raises(ValueError, match="dimension 2"):
        exact_bloch_vector(rho_2q)
