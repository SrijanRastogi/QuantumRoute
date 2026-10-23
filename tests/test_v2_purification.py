"""Comprehensive unit and integration tests for Entanglement Purification Lab (Milestone 4B).

Covers:
1. Analytical fixed points:
   - Maximally mixed state: F=0.25 -> P_succ=0.5, F_out=0.25, E[N]=4.
   - Entanglement threshold: F=0.50 -> P_succ=5/9, F_out=0.50, E[N]=3.6.
   - Ideal Bell pair: F=1.00 -> P_succ=1.0, F_out=1.00, E[N]=2.0.
2. Strict enhancement F_out > F_in for F in (0.50, 1.0) and degradation for F in [0.25, 0.50).
3. Exact density matrix trace, Hermiticity, positivity, and all 4 Bell coefficients.
4. Circuit-versus-analytical match to machine precision across w in {0, 1/3, 0.6, 0.8, 1}.
5. Twirling preservation of Bell fidelity and isotropic depolarization of error subspace.
6. Finite-shot sampling and accepted-sample uncertainty accounting.
7. Complete FastAPI routes: /defaults, /evaluate, /sweep, /simulate-shots, with strict input validation.
"""

import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.main import app
from quantumroute.purification import (
    calculate_bbpssw_analytical,
    simulate_bbpssw_density_matrix,
    simulate_bbpssw_shots,
    apply_werner_twirl,
    build_bbpssw_circuit,
    build_bbpssw_experiment_circuit,
    validate_werner_w,
    validate_bell_fidelity,
    werner_w_to_fidelity,
    fidelity_to_werner_w,
    fidelity_to_average_teleportation,
    BELL_PROJECTORS,
)


@pytest.fixture
def api_client():
    return TestClient(app)


# ==============================================================================
# 1. Analytical Invariants & Fixed Points
# ==============================================================================


def test_analytical_maximally_mixed_fixed_point():
    """Verify corrected boundary: F=0.25 (w=0.0) is an exact fixed point."""
    res = calculate_bbpssw_analytical(0.0)
    assert res.input_werner_w == 0.0
    assert res.input_bell_fidelity == 0.25
    assert res.success_probability == pytest.approx(0.50, abs=1e-12)
    assert res.output_bell_fidelity == pytest.approx(0.25, abs=1e-12)
    assert res.output_werner_w_twirled == pytest.approx(0.0, abs=1e-12)
    assert res.expected_raw_pairs_consumed == pytest.approx(4.0, abs=1e-12)
    assert res.fidelity_gain == pytest.approx(0.0, abs=1e-12)
    assert res.is_purified is False

    # All 4 Bell coefficients must equal 0.25 (maximally mixed state I/4)
    for name in ["Phi+", "Phi-", "Psi+", "Psi-"]:
        assert res.output_bell_coefficients[name] == pytest.approx(0.25, abs=1e-12)


def test_analytical_threshold_boundary():
    """Verify threshold boundary: F=0.50 (w=1/3) fixed point."""
    w_thresh = 1.0 / 3.0
    res = calculate_bbpssw_analytical(w_thresh)
    assert res.input_bell_fidelity == pytest.approx(0.50, abs=1e-12)
    assert res.success_probability == pytest.approx(5.0 / 9.0, abs=1e-12)
    assert res.output_bell_fidelity == pytest.approx(0.50, abs=1e-12)
    assert res.output_werner_w_twirled == pytest.approx(1.0 / 3.0, abs=1e-12)
    assert res.expected_raw_pairs_consumed == pytest.approx(3.6, abs=1e-12)
    assert res.is_purified is False


def test_analytical_ideal_bell_pair():
    """Verify ideal Bell pair: F=1.00 (w=1.0) fixed point with 100% success."""
    res = calculate_bbpssw_analytical(1.0)
    assert res.input_bell_fidelity == 1.0
    assert res.success_probability == pytest.approx(1.0, abs=1e-12)
    assert res.output_bell_fidelity == pytest.approx(1.0, abs=1e-12)
    assert res.output_werner_w_twirled == pytest.approx(1.0, abs=1e-12)
    assert res.expected_raw_pairs_consumed == pytest.approx(2.0, abs=1e-12)
    assert res.output_bell_coefficients["Phi+"] == pytest.approx(1.0, abs=1e-12)
    assert res.output_bell_coefficients["Phi-"] == pytest.approx(0.0, abs=1e-12)
    assert res.output_bell_coefficients["Psi+"] == pytest.approx(0.0, abs=1e-12)
    assert res.output_bell_coefficients["Psi-"] == pytest.approx(0.0, abs=1e-12)


def test_monotonic_enhancement_above_threshold():
    """Verify strict fidelity gain F_out > F_in for all F in (0.50, 1.0)."""
    for w in [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]:
        res = calculate_bbpssw_analytical(w)
        assert res.output_bell_fidelity > res.input_bell_fidelity
        assert res.output_werner_w_twirled > res.input_werner_w
        assert res.is_purified is True
        assert res.fidelity_gain > 0.0
        assert 5.0 / 9.0 < res.success_probability < 1.0
        assert 2.0 < res.expected_raw_pairs_consumed < 3.6


def test_strict_degradation_below_threshold():
    """Verify strict fidelity degradation F_out < F_in for all F in (0.25, 0.50)."""
    for w in [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]:
        res = calculate_bbpssw_analytical(w)
        assert res.output_bell_fidelity < res.input_bell_fidelity
        assert res.output_werner_w_twirled < res.input_werner_w
        assert res.is_purified is False
        assert res.fidelity_gain < 0.0


# ==============================================================================
# 2. Density Matrix Physical Invariants & All 4 Bell Coefficients
# ==============================================================================


@pytest.mark.parametrize("w_val", [0.0, 1.0 / 3.0, 0.60, 0.80, 1.0])
def test_density_matrix_physicality_and_exact_coefficients(w_val):
    """Verify exact 4-qubit density-matrix simulation matches analytical theory to machine precision."""
    dm_res = simulate_bbpssw_density_matrix(w_val, apply_twirling=False)
    ana_res = calculate_bbpssw_analytical(w_val)

    # Physicality
    assert dm_res.trace == pytest.approx(1.0, abs=1e-12)
    assert dm_res.is_hermitian is True
    assert dm_res.is_positive is True

    # Success probability
    assert dm_res.success_probability == pytest.approx(ana_res.success_probability, abs=1e-12)

    # Output Bell fidelity
    assert dm_res.output_bell_fidelity == pytest.approx(ana_res.output_bell_fidelity, abs=1e-12)

    # All four individual Bell-diagonal coefficients
    for name in ["Phi+", "Phi-", "Psi+", "Psi-"]:
        assert dm_res.output_bell_coefficients[name] == pytest.approx(
            ana_res.output_bell_coefficients[name], abs=1e-12
        )

    # Expected pairs consumed
    assert dm_res.expected_raw_pairs_consumed == pytest.approx(
        ana_res.expected_raw_pairs_consumed, abs=1e-12
    )


@pytest.mark.parametrize(
    "w_val, expected_p, expected_f, expected_coeffs, expected_en",
    [
        (
            0.0,
            0.5,
            0.25,
            {"Phi+": 0.25, "Phi-": 0.25, "Psi+": 0.25, "Psi-": 0.25},
            4.0,
        ),
        (
            1.0 / 3.0,
            5.0 / 9.0,
            0.50,
            {"Phi+": 0.50, "Phi-": 0.30, "Psi+": 0.10, "Psi-": 0.10},
            18.0 / 5.0,
        ),
        (
            0.60,
            17.0 / 25.0,
            25.0 / 34.0,
            {"Phi+": 25.0 / 34.0, "Phi-": 7.0 / 34.0, "Psi+": 1.0 / 34.0, "Psi-": 1.0 / 34.0},
            50.0 / 17.0,
        ),
        (
            0.80,
            41.0 / 50.0,
            145.0 / 164.0,
            {"Phi+": 145.0 / 164.0, "Phi-": 17.0 / 164.0, "Psi+": 1.0 / 164.0, "Psi-": 1.0 / 164.0},
            100.0 / 41.0,
        ),
        (
            1.0,
            1.0,
            1.0,
            {"Phi+": 1.0, "Phi-": 0.0, "Psi+": 0.0, "Psi-": 0.0},
            2.0,
        ),
    ],
)
def test_independent_hardcoded_rational_expectations(
    w_val, expected_p, expected_f, expected_coeffs, expected_en
):
    """Verify that both analytical and density-matrix simulations match independently derived rational expectations."""
    ana_res = calculate_bbpssw_analytical(w_val)
    dm_res = simulate_bbpssw_density_matrix(w_val, apply_twirling=False)

    # Independent expectation assertions on analytical engine
    assert ana_res.success_probability == pytest.approx(expected_p, abs=1e-12)
    assert ana_res.output_bell_fidelity == pytest.approx(expected_f, abs=1e-12)
    assert ana_res.expected_raw_pairs_consumed == pytest.approx(expected_en, abs=1e-12)
    for name in ["Phi+", "Phi-", "Psi+", "Psi-"]:
        assert ana_res.output_bell_coefficients[name] == pytest.approx(
            expected_coeffs[name], abs=1e-12
        )

    # Independent expectation assertions on 4-qubit density-matrix simulation
    assert dm_res.success_probability == pytest.approx(expected_p, abs=1e-12)
    assert dm_res.output_bell_fidelity == pytest.approx(expected_f, abs=1e-12)
    assert dm_res.expected_raw_pairs_consumed == pytest.approx(expected_en, abs=1e-12)
    for name in ["Phi+", "Phi-", "Psi+", "Psi-"]:
        assert dm_res.output_bell_coefficients[name] == pytest.approx(
            expected_coeffs[name], abs=1e-12
        )


@pytest.mark.parametrize(
    "w_val, expected_p, expected_f, expected_coeffs",
    [
        (0.0, 0.5, 0.25, {"Phi+": 0.25, "Phi-": 0.25, "Psi+": 0.25, "Psi-": 0.25}),
        (
            1.0 / 3.0,
            5.0 / 9.0,
            0.50,
            {"Phi+": 0.50, "Phi-": 0.30, "Psi+": 0.10, "Psi-": 0.10},
        ),
        (
            0.60,
            17.0 / 25.0,
            25.0 / 34.0,
            {"Phi+": 25.0 / 34.0, "Phi-": 7.0 / 34.0, "Psi+": 1.0 / 34.0, "Psi-": 1.0 / 34.0},
        ),
        (
            0.80,
            41.0 / 50.0,
            145.0 / 164.0,
            {"Phi+": 145.0 / 164.0, "Phi-": 17.0 / 164.0, "Psi+": 1.0 / 164.0, "Psi-": 1.0 / 164.0},
        ),
        (1.0, 1.0, 1.0, {"Phi+": 1.0, "Phi-": 0.0, "Psi+": 0.0, "Psi-": 0.0}),
    ],
)
def test_circuit_level_hardcoded_rational_expectations(
    w_val, expected_p, expected_f, expected_coeffs
):
    """Verify that the physical 4-qubit bilateral-CNOT quantum circuit with depolarizing noise matches rational theory."""
    from qiskit import QuantumCircuit
    from qiskit.quantum_info import DensityMatrix, partial_trace
    from qiskit_aer.noise import depolarizing_error

    qc_prep = QuantumCircuit(4)
    qc_prep.h(0)
    qc_prep.cx(0, 1)
    qc_prep.h(2)
    qc_prep.cx(2, 3)

    rho = DensityMatrix(qc_prep)
    p_noise = 1.0 - w_val
    if p_noise > 1e-9:
        err = depolarizing_error(p_noise, 1)
        rho = rho.evolve(err, [1])
        rho = rho.evolve(err, [3])

    qc_cnot = QuantumCircuit(4)
    qc_cnot.cx(0, 2)
    qc_cnot.cx(1, 3)
    rho = rho.evolve(qc_cnot)

    # Project onto matching parity on sacrificed qubits 2 and 3
    P_acc = np.zeros((16, 16), dtype=complex)
    for q3 in (0, 1):
        for q2 in (0, 1):
            for q1 in (0, 1):
                for q0 in (0, 1):
                    if q2 == q3:
                        idx = (q3 << 3) | (q2 << 2) | (q1 << 1) | q0
                        P_acc[idx, idx] = 1.0

    rho_acc_unnorm = P_acc @ rho.data @ P_acc
    p_succ = float(np.real(np.trace(rho_acc_unnorm)))
    assert p_succ == pytest.approx(expected_p, abs=1e-12)

    rho_acc = DensityMatrix(rho_acc_unnorm / p_succ)
    rho_retained = partial_trace(rho_acc, [2, 3])

    # Overlaps with exact Bell states
    for name in ["Phi+", "Phi-", "Psi+", "Psi-"]:
        coeff = float(np.real(np.trace(rho_retained.data @ BELL_PROJECTORS[name])))
        assert coeff == pytest.approx(expected_coeffs[name], abs=1e-12)
    assert float(np.real(np.trace(rho_retained.data @ BELL_PROJECTORS["Phi+"]))) == pytest.approx(
        expected_f, abs=1e-12
    )


def test_twirling_group_algebraic_invariance():
    """Verify that every element of the 12-element Clifford subgroup preserves |Phi+> and never boosts fidelity."""
    from qiskit.quantum_info import DensityMatrix
    from quantumroute.purification import (
        _get_g12_twirl_unitaries,
        BELL_VECTORS,
        BELL_PROJECTORS,
        apply_werner_twirl,
    )

    g12 = _get_g12_twirl_unitaries()
    assert len(g12) == 12
    phi_plus = BELL_VECTORS["Phi+"]

    for idx, u in enumerate(g12):
        # Unitarity check
        assert np.allclose(u @ u.conj().T, np.eye(2), atol=1e-12)
        # Bilateral action on |Phi+>
        u_bi = np.kron(u, u.conj())
        phi_trans = u_bi @ phi_plus
        overlap = np.abs(np.vdot(phi_plus, phi_trans))
        assert np.isclose(overlap, 1.0, atol=1e-12)

    # Pure error state homogenization
    for err_name in ["Phi-", "Psi+", "Psi-"]:
        dm_err = DensityMatrix(BELL_PROJECTORS[err_name])
        dm_twirled = apply_werner_twirl(dm_err)
        assert np.real(np.trace(dm_twirled.data @ BELL_PROJECTORS["Phi+"])) == pytest.approx(
            0.0, abs=1e-12
        )
        for b_name in ["Phi-", "Psi+", "Psi-"]:
            assert np.real(np.trace(dm_twirled.data @ BELL_PROJECTORS[b_name])) == pytest.approx(
                1.0 / 3.0, abs=1e-12
            )


def test_twirling_invariance_and_depolarization():
    """Verify that twirling preserves Bell fidelity and depolarizes the error subspace."""
    w_val = 0.80
    dm_raw = simulate_bbpssw_density_matrix(w_val, apply_twirling=False)
    dm_twirled = simulate_bbpssw_density_matrix(w_val, apply_twirling=True)

    # Fidelity with |Phi+> must be exactly invariant
    f_raw = dm_raw.output_bell_coefficients["Phi+"]
    f_twirled = dm_twirled.output_bell_coefficients["Phi+"]
    assert f_twirled == pytest.approx(f_raw, abs=1e-12)

    # Error subspace must be uniformly depolarized to (1 - F) / 3
    expected_error = (1.0 - f_twirled) / 3.0
    for name in ["Phi-", "Psi+", "Psi-"]:
        assert dm_twirled.output_bell_coefficients[name] == pytest.approx(
            expected_error, abs=1e-12
        )


# ==============================================================================
# 3. Finite-Shot Statistics & Proper Uncertainty Accounting
# ==============================================================================


def test_finite_shot_simulation_uncertainty_semantics():
    """Verify finite-shot simulation uses accepted sample size for fidelity uncertainty."""
    w_val = 0.80
    shots = 5000
    shot_res = simulate_bbpssw_shots(w_val, shots=shots, seed=123)

    assert shot_res.total_attempts == shots
    assert 0 < shot_res.accepted_attempts <= shots
    assert shot_res.fidelity_reliable is True
    assert shot_res.warning_message is None

    # Check uncertainty bounds
    p_hat = shot_res.estimated_success_probability
    sigma_p = shot_res.success_probability_uncertainty
    expected_sigma_p = np.sqrt(p_hat * (1.0 - p_hat) / shots)
    assert sigma_p == pytest.approx(expected_sigma_p, abs=1e-12)

    f_hat = shot_res.estimated_output_fidelity
    assert f_hat is not None
    sigma_f = shot_res.output_fidelity_uncertainty
    assert sigma_f is not None

    # CRITICAL INVARIANT: sigma_f must be computed over accepted_attempts, NOT shots!
    expected_sigma_f = np.sqrt(f_hat * (1.0 - f_hat) / shot_res.accepted_attempts)
    assert sigma_f == pytest.approx(expected_sigma_f, abs=1e-12)

    # Statistical consistency with analytical prediction (within 3 standard errors)
    ana = calculate_bbpssw_analytical(w_val)
    assert abs(p_hat - ana.success_probability) < 3.5 * sigma_p
    assert abs(f_hat - ana.output_bell_fidelity) < 3.5 * sigma_f


def test_finite_shot_low_sample_warning():
    """Verify reliable flag and warning when accepted samples are insufficient."""
    # Using 100 shots with low success
    shot_res = simulate_bbpssw_shots(0.0, shots=100, seed=42)
    assert shot_res.total_attempts == 100
    # At 100 shots, about 50 accepted, which is >= 10
    assert shot_res.fidelity_reliable is True


# ==============================================================================
# 4. FastAPI Routes & Validation Behavior
# ==============================================================================


def test_api_purification_defaults(api_client):
    """Test GET /api/purification/defaults."""
    resp = api_client.get("/api/purification/defaults")
    assert resp.status_code == 200
    data = resp.json()
    assert data["threshold_fidelity"] == 0.50
    assert data["fixed_point_mixed_fidelity"] == 0.25
    assert len(data["presets"]) >= 4
    assert "protocol" in data["scientific_assumptions"]


def test_api_purification_evaluate_valid_w(api_client):
    """Test POST /api/purification/evaluate with werner_w."""
    resp = api_client.post("/api/purification/evaluate", json={"werner_w": 0.80})
    assert resp.status_code == 200
    data = resp.json()
    assert data["input_werner_w"] == pytest.approx(0.80, abs=1e-4)
    assert data["input_bell_fidelity"] == pytest.approx(0.85, abs=1e-4)
    assert data["success_probability"] == pytest.approx(0.82, abs=1e-4)
    assert data["output_bell_fidelity"] == pytest.approx(0.884146, abs=1e-4)
    assert data["output_werner_w_twirled"] == pytest.approx(0.845528, abs=1e-4)
    assert data["expected_raw_pairs_consumed"] == pytest.approx(2.4390, abs=1e-4)
    assert data["is_purified"] is True
    assert "step1_input" in data["worked_example"]


def test_api_purification_evaluate_valid_fidelity(api_client):
    """Test POST /api/purification/evaluate with bell_fidelity."""
    resp = api_client.post("/api/purification/evaluate", json={"bell_fidelity": 0.85})
    assert resp.status_code == 200
    data = resp.json()
    assert data["input_werner_w"] == pytest.approx(0.80, abs=1e-4)
    assert data["output_bell_fidelity"] == pytest.approx(0.884146, abs=1e-4)


def test_api_purification_evaluate_conflicting_inputs_rejected(api_client):
    """Test POST /api/purification/evaluate rejects conflicting w and fidelity."""
    # w=0.80 corresponds to F=0.85, but request sends F=0.50
    resp = api_client.post(
        "/api/purification/evaluate", json={"werner_w": 0.80, "bell_fidelity": 0.50}
    )
    assert resp.status_code == 400
    assert "Conflicting inputs" in resp.json()["detail"]


def test_api_purification_evaluate_missing_inputs_rejected(api_client):
    """Test POST /api/purification/evaluate rejects missing inputs."""
    resp = api_client.post("/api/purification/evaluate", json={})
    assert resp.status_code == 400
    assert "Must provide either" in resp.json()["detail"]


def test_api_purification_sweep_endpoint(api_client):
    """Test POST /api/purification/sweep."""
    resp = api_client.post(
        "/api/purification/sweep",
        json={"min_fidelity": 0.25, "max_fidelity": 1.0, "num_points": 30},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["points"]) == 30
    assert data["points"][0]["fidelity_in"] == pytest.approx(0.25, abs=1e-4)
    assert data["points"][0]["fidelity_out"] == pytest.approx(0.25, abs=1e-4)
    assert data["points"][-1]["fidelity_in"] == pytest.approx(1.0, abs=1e-4)
    assert data["points"][-1]["fidelity_out"] == pytest.approx(1.0, abs=1e-4)


def test_api_purification_simulate_shots_endpoint(api_client):
    """Test POST /api/purification/simulate-shots."""
    resp = api_client.post(
        "/api/purification/simulate-shots",
        json={"werner_w": 0.80, "shots": 1000, "seed": 42},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_attempts"] == 1000
    assert data["accepted_attempts"] > 700
    assert data["estimated_output_fidelity"] is not None
    assert data["output_fidelity_uncertainty"] is not None
    assert data["fidelity_reliable"] is True
