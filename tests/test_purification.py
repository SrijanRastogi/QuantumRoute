"""Unit and integration tests for BBPSSW Entanglement Purification Protocol (QR-010).

Verifies the Bennett et al. (1996) bilateral CNOT protocol:
    1. Fixed-point invariants at F=1.0 and F=0.5.
    2. Strict fidelity enhancement F' > F for all F in (0.5, 1.0).
    3. Degradation F' < F for sub-threshold states F < 0.5.
    4. Exact agreement between 4-qubit circuit simulation and closed-form theory.
    5. Multi-round cascading distillation and resource counting.
    6. Density matrix physical invariants (Tr=1, Hermitian, positive semi-definite).
    7. Input validation and error handling against out-of-range, non-real, or boolean inputs.
"""

import pytest
import numpy as np
from qiskit.quantum_info import DensityMatrix, Statevector

from quantumroute.purification import (
    PurificationResult,
    bbpssw_success_probability,
    bbpssw_output_fidelity,
    bbpssw_output_werner_parameter,
    build_bbpssw_circuit,
    project_matching_parity,
    twirl_to_werner_state,
    simulate_bbpssw_step,
    simulate_multi_round_bbpssw,
)


def test_bbpssw_boundary_invariants():
    """Verify analytical boundary values and the 3 fixed points of BBPSSW protocol."""
    # 1. Pure Bell state F = 1.0 is an attractive fixed point with 100% success
    assert bbpssw_output_fidelity(1.0) == pytest.approx(1.0, abs=1e-12)
    assert bbpssw_success_probability(1.0) == pytest.approx(1.0, abs=1e-12)
    assert bbpssw_output_werner_parameter(1.0) == pytest.approx(1.0, abs=1e-12)

    # 2. Classical separability threshold F = 0.5 (w = 1/3) is an unstable fixed point
    assert bbpssw_output_fidelity(0.5) == pytest.approx(0.5, abs=1e-12)
    assert bbpssw_success_probability(0.5) == pytest.approx(5.0 / 9.0, abs=1e-12)
    assert bbpssw_output_werner_parameter(1.0 / 3.0) == pytest.approx(1.0 / 3.0, abs=1e-12)

    # 3. Maximally mixed state F = 0.25 (w = 0.0) is an attractive sub-threshold fixed point
    assert bbpssw_output_fidelity(0.25) == pytest.approx(0.25, abs=1e-12)
    assert bbpssw_success_probability(0.25) == pytest.approx(0.5, abs=1e-12)
    assert bbpssw_output_werner_parameter(0.0) == pytest.approx(0.0, abs=1e-12)


def test_bbpssw_fidelity_enhancement_above_threshold():
    """Verify strict fidelity gain F' > F for all entangled states F in (0.5, 1.0)."""
    fidelities = np.linspace(0.51, 0.99, 25)
    for f in fidelities:
        f_prime = bbpssw_output_fidelity(float(f))
        p_succ = bbpssw_success_probability(float(f))

        # Strict fidelity enhancement
        assert f_prime > f, f"Expected F' > F for F={f}, got F'={f_prime}"

        # Valid probability bounds
        assert 5.0 / 9.0 <= p_succ <= 1.0

        # Werner parameter enhancement
        w_in = (4.0 * f - 1.0) / 3.0
        w_out = bbpssw_output_werner_parameter(w_in)
        assert w_out > w_in, f"Expected w' > w for w={w_in}, got w'={w_out}"


def test_bbpssw_fidelity_degradation_below_threshold():
    """Verify that states between unpolarized noise (F=0.25) and threshold (F=0.5) strictly degrade toward F=0.25."""
    sub_threshold_fidelities = [0.26, 0.30, 0.35, 0.40, 0.45, 0.49]
    for f in sub_threshold_fidelities:
        f_prime = bbpssw_output_fidelity(f)
        assert f_prime < f, f"Expected degradation F' < F for F={f}, got F'={f_prime}"


def test_bbpssw_circuit_matches_analytical_theory():
    """Verify circuit-level density-matrix simulation matches analytical formulas to machine precision."""
    test_fidelities = [0.30, 0.50, 0.65, 0.80, 0.90, 0.98, 1.0]

    for f in test_fidelities:
        sim_f, sim_p, _ = simulate_bbpssw_step(f, input_is_fidelity=True)
        theo_f = bbpssw_output_fidelity(f)
        theo_p = bbpssw_success_probability(f)

        assert abs(sim_f - theo_f) < 1e-6, f"Fidelity mismatch at F={f}: sim={sim_f}, theo={theo_f}"
        assert abs(sim_p - theo_p) < 1e-6, f"Probability mismatch at F={f}: sim={sim_p}, theo={theo_p}"


def test_density_matrix_properties_of_purified_state():
    """Verify that the reduced density matrix of the purified pair satisfies all physical invariants."""
    for f in [0.60, 0.85]:
        _, _, rho_purified = simulate_bbpssw_step(f)

        assert isinstance(rho_purified, DensityMatrix)
        data = rho_purified.data

        # 1. Trace must equal 1.0
        assert np.trace(data) == pytest.approx(1.0 + 0.0j, abs=1e-10)

        # 2. Must be Hermitian
        assert np.allclose(data, data.conj().T, atol=1e-10)

        # 3. All eigenvalues must be non-negative (positive semi-definite)
        eigvals = np.linalg.eigvalsh(data)
        assert np.all(eigvals >= -1e-10), f"Negative eigenvalues found: {eigvals}"


def test_multi_round_bbpssw_cascading():
    """Verify multi-round cascading BBPSSW distillation and resource consumption."""
    f_init = 0.60
    rounds = 3
    result = simulate_multi_round_bbpssw(f_init, rounds=rounds, input_is_fidelity=True)

    assert isinstance(result, PurificationResult)
    assert result.rounds == 3
    assert result.pairs_consumed == 8  # 2^3
    assert len(result.fidelity_history) == 4
    assert len(result.probability_history) == 3

    # Monotonic fidelity increase across rounds
    for r in range(rounds):
        assert result.fidelity_history[r + 1] > result.fidelity_history[r]

    # Cumulative probability equals product of individual round probabilities
    expected_p_cum = float(np.prod(result.probability_history))
    assert result.success_probability == pytest.approx(expected_p_cum, abs=1e-12)
    assert result.fidelity_gain == pytest.approx(result.purified_fidelity - f_init, abs=1e-12)

    # Zero rounds base case
    zero_result = simulate_multi_round_bbpssw(0.75, rounds=0)
    assert zero_result.purified_fidelity == pytest.approx(0.75, abs=1e-12)
    assert zero_result.pairs_consumed == 1
    assert zero_result.success_probability == 1.0
    assert zero_result.fidelity_gain == 0.0


def test_twirl_to_werner_state():
    """Verify that twirl_to_werner_state outputs an exact isotropic Werner state."""
    # Purify an initial state to obtain a Bell-diagonal non-isotropic state
    _, _, rho_raw = simulate_bbpssw_step(0.80)
    rho_twirled = twirl_to_werner_state(rho_raw)

    phi_plus = (Statevector.from_label("00") + Statevector.from_label("11")) / np.sqrt(2.0)
    f_raw = float(np.real(phi_plus.expectation_value(rho_raw)))
    f_twirled = float(np.real(phi_plus.expectation_value(rho_twirled)))

    # Bell fidelity must be exactly conserved by twirling
    assert f_twirled == pytest.approx(f_raw, abs=1e-12)

    # In isotropic Werner form, all 3 orthogonal Bell states have equal fidelity (1 - F) / 3
    phi_minus = (Statevector.from_label("00") - Statevector.from_label("11")) / np.sqrt(2.0)
    psi_plus = (Statevector.from_label("01") + Statevector.from_label("10")) / np.sqrt(2.0)
    psi_minus = (Statevector.from_label("01") - Statevector.from_label("10")) / np.sqrt(2.0)

    expected_ortho = (1.0 - f_twirled) / 3.0
    assert float(np.real(phi_minus.expectation_value(rho_twirled))) == pytest.approx(expected_ortho, abs=1e-10)
    assert float(np.real(psi_plus.expectation_value(rho_twirled))) == pytest.approx(expected_ortho, abs=1e-10)
    assert float(np.real(psi_minus.expectation_value(rho_twirled))) == pytest.approx(expected_ortho, abs=1e-10)


def test_purification_parameter_validation_and_errors():
    """Verify robust input validation and error rejection."""
    # Booleans rejected
    with pytest.raises(TypeError, match="real number"):
        bbpssw_output_fidelity(True)
    with pytest.raises(TypeError, match="real number"):
        bbpssw_success_probability(False)
    with pytest.raises(TypeError, match="real number"):
        bbpssw_output_werner_parameter(True)

    # Strings and invalid types rejected
    with pytest.raises(TypeError):
        bbpssw_output_fidelity("0.8")
    with pytest.raises(TypeError):
        simulate_multi_round_bbpssw(0.8, rounds="two")
    with pytest.raises(TypeError):
        simulate_multi_round_bbpssw(0.8, rounds=True)

    # Out of bounds values rejected
    with pytest.raises(ValueError, match="bounds|in"):
        bbpssw_output_fidelity(-0.1)
    with pytest.raises(ValueError, match="bounds|in"):
        bbpssw_output_fidelity(1.05)
    with pytest.raises(ValueError, match="bounds|in"):
        bbpssw_output_werner_parameter(-0.01)
    with pytest.raises(ValueError, match="bounds|in"):
        bbpssw_output_werner_parameter(1.2)
    with pytest.raises(ValueError, match="non-negative"):
        simulate_multi_round_bbpssw(0.8, rounds=-1)

    # Invalid dimension in projection
    with pytest.raises(ValueError, match="Expected 4-qubit"):
        project_matching_parity(DensityMatrix(np.eye(4) / 4.0))


def test_build_bbpssw_circuit_structure():
    """Verify gate counts and structure of 4-qubit BBPSSW quantum circuit."""
    qc = build_bbpssw_circuit()
    assert qc.num_qubits == 4
    op_counts = qc.count_ops()
    assert op_counts.get("cx", 0) == 2
    assert len(qc.data) == 2
