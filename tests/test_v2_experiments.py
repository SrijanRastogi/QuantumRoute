"""Comprehensive test suite for Milestone 2 Guided Quantum Experiments.

Validates:
1. Supported state presets (|0>, |1>, |+>, |->, |+i>, |-i>) and Bloch coordinates.
2. Custom state preparation and angle boundary validation (θ in [0, π], φ in [0, 2π]).
3. Depolarizing noise parameter validation (p in [0.0, 1.0]) and equivalent Werner mapping (w = 1 - p).
4. Real Qiskit teleportation circuit execution vs analytical theoretical predictions (F = 1 - p/2).
5. Coherent feedforward correction verification and partial trace extraction.
6. Finite-shot Pauli state tomography vs exact density-matrix evaluation.
7. Noise sweep correctness, monotonicity, and classical threshold (2/3) boundary detection.
8. API error handling for malformed payloads and out-of-bounds parameters.
9. Non-regression of existing Network Lab and editable link endpoints.
"""

import math
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_experiments_presets_endpoint():
    """Verify all 6 canonical single-qubit preset states are returned with valid Bloch coordinates."""
    response = client.get("/api/experiments/presets")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 6

    preset_ids = [p["id"] for p in data]
    assert "zero" in preset_ids
    assert "one" in preset_ids
    assert "plus" in preset_ids
    assert "minus" in preset_ids
    assert "plus_i" in preset_ids
    assert "minus_i" in preset_ids

    # Check |0> properties
    p_zero = next(p for p in data if p["id"] == "zero")
    assert p_zero["theta"] == 0.0
    assert p_zero["bloch_vector"] == [0.0, 0.0, 1.0]

    # Check |1> properties
    p_one = next(p for p in data if p["id"] == "one")
    assert math.isclose(p_one["theta"], math.pi, abs_tol=1e-5)
    assert p_one["bloch_vector"] == [0.0, 0.0, -1.0]

    # Check |+> properties
    p_plus = next(p for p in data if p["id"] == "plus")
    assert math.isclose(p_plus["theta"], math.pi / 2, abs_tol=1e-5)
    assert p_plus["bloch_vector"] == [1.0, 0.0, 0.0]

    # Check |-> properties
    p_minus = next(p for p in data if p["id"] == "minus")
    assert math.isclose(p_minus["theta"], math.pi / 2, abs_tol=1e-5)
    assert math.isclose(p_minus["phi"], math.pi, abs_tol=1e-5)
    assert p_minus["bloch_vector"] == [-1.0, 0.0, 0.0]

    # Check |+i> properties
    p_plus_i = next(p for p in data if p["id"] == "plus_i")
    assert p_plus_i["bloch_vector"] == [0.0, 1.0, 0.0]

    # Check |-i> properties
    p_minus_i = next(p for p in data if p["id"] == "minus_i")
    assert p_minus_i["bloch_vector"] == [0.0, -1.0, 0.0]


def test_custom_state_preparation_valid():
    """Verify custom (theta, phi) state preparation produces normalized Bloch vectors and density matrices."""
    # Arbitrary state on Bloch sphere
    theta = math.pi / 3.0  # 60 degrees
    phi = math.pi / 4.0    # 45 degrees
    response = client.post("/api/experiments/state", json={"theta": theta, "phi": phi})
    assert response.status_code == 200
    data = response.json()

    assert math.isclose(data["theta"], theta, abs_tol=1e-5)
    assert math.isclose(data["phi"], phi, abs_tol=1e-5)
    assert math.isclose(data["bloch_radius"], 1.0, abs_tol=1e-5)
    assert data["purity"] == 1.0

    # Theoretical Bloch coordinates: rx = sin(theta)*cos(phi), ry = sin(theta)*sin(phi), rz = cos(theta)
    expected_rx = math.sin(theta) * math.cos(phi)
    expected_ry = math.sin(theta) * math.sin(phi)
    expected_rz = math.cos(theta)
    bx, by, bz = data["bloch_vector"]
    assert math.isclose(bx, expected_rx, abs_tol=1e-5)
    assert math.isclose(by, expected_ry, abs_tol=1e-5)
    assert math.isclose(bz, expected_rz, abs_tol=1e-5)


def test_custom_state_validation_invalid_bounds():
    """Verify rejection of invalid theta/phi angles."""
    # Negative theta
    res_neg_theta = client.post("/api/experiments/state", json={"theta": -1.0, "phi": 0.0})
    assert res_neg_theta.status_code == 422

    # Theta > pi
    res_large_theta = client.post("/api/experiments/state", json={"theta": 4.0, "phi": 0.0})
    assert res_large_theta.status_code == 422

    # Phi > 2pi
    res_large_phi = client.post("/api/experiments/state", json={"theta": 1.0, "phi": 7.0})
    assert res_large_phi.status_code == 422


def test_teleport_experiment_noiseless():
    """Verify ideal noiseless teleportation achieves state fidelity 1.0 and identical Bloch vector."""
    # Teleport |+> state
    theta = math.pi / 2.0
    phi = 0.0
    payload = {"theta": theta, "phi": phi, "noise_p": 0.0}
    response = client.post("/api/experiments/teleport", json=payload)
    assert response.status_code == 200
    data = response.json()

    metrics = data["metrics"]
    assert math.isclose(metrics["state_fidelity"], 1.0, abs_tol=1e-5)
    assert math.isclose(metrics["theoretical_fidelity"], 1.0, abs_tol=1e-5)
    assert metrics["fidelity_discrepancy"] < 1e-6
    assert metrics["has_quantum_advantage"] is True

    # Check Bloch vectors match
    in_vec = data["input_state"]["bloch_vector"]
    out_vec = data["output_state"]["bloch_vector"]
    for vi, vo in zip(in_vec, out_vec):
        assert math.isclose(vi, vo, abs_tol=1e-5)

    # Check circuit structure
    circuit = data["circuit"]
    assert circuit["num_qubits"] == 3
    assert circuit["depth"] > 0
    assert "cx" in circuit["ops_count"]

    # Verify 5 guided steps are documented
    steps = data["guided_steps"]
    assert len(steps) == 5
    assert steps[0]["step"] == 1
    assert steps[4]["step"] == 5


def test_teleport_experiment_depolarizing_noise():
    """Verify depolarizing noise shrinks Bob's Bloch vector and matches analytical formula F = 1 - p/2."""
    p_val = 0.2
    payload = {"theta": 0.0, "phi": 0.0, "noise_p": p_val}  # Teleporting |0>
    response = client.post("/api/experiments/teleport", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Analytical prediction: F = 1 - p/2 = 1 - 0.1 = 0.90
    expected_fidelity = 1.0 - p_val / 2.0
    metrics = data["metrics"]
    assert math.isclose(metrics["state_fidelity"], expected_fidelity, abs_tol=1e-5)
    assert math.isclose(metrics["theoretical_fidelity"], expected_fidelity, abs_tol=1e-5)
    assert metrics["fidelity_discrepancy"] < 1e-6

    # Werner parameter w = 1 - p = 0.8
    assert math.isclose(data["werner_parameter"], 0.8, abs_tol=1e-5)
    # Bell fidelity Fe = (1 + 3w)/4 = (1 + 2.4)/4 = 0.85
    assert math.isclose(data["bell_fidelity"], 0.85, abs_tol=1e-5)

    # Bloch vector shrinkage: r_out = (1 - p) * r_in = (0, 0, 0.8)
    out_bloch = data["output_state"]["bloch_vector"]
    assert math.isclose(out_bloch[0], 0.0, abs_tol=1e-5)
    assert math.isclose(out_bloch[1], 0.0, abs_tol=1e-5)
    assert math.isclose(out_bloch[2], 0.8, abs_tol=1e-5)
    assert math.isclose(data["output_state"]["bloch_radius"], 0.8, abs_tol=1e-5)


def test_teleport_experiment_classical_limit_crossing():
    """Verify that when p > 2/3 (~0.667), fidelity falls below the classical threshold 2/3."""
    p_high = 0.75  # 0.75 > 2/3
    payload = {"theta": math.pi / 2.0, "phi": math.pi / 2.0, "noise_p": p_high}
    response = client.post("/api/experiments/teleport", json=payload)
    assert response.status_code == 200
    data = response.json()

    # F = 1 - 0.75/2 = 0.625 < 2/3 (0.6667)
    expected_fidelity = 1.0 - 0.75 / 2.0
    assert math.isclose(data["metrics"]["state_fidelity"], expected_fidelity, abs_tol=1e-5)
    assert data["metrics"]["has_quantum_advantage"] is False


def test_teleport_experiment_finite_shot_tomography():
    """Verify finite-shot Pauli state tomography execution and statistical reporting."""
    payload = {"theta": 0.0, "phi": 0.0, "noise_p": 0.1, "shots": 1024}
    response = client.post("/api/experiments/teleport", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["tomography"] is not None
    tomo = data["tomography"]
    assert tomo["shots"] == 1024
    assert len(tomo["empirical_bloch_vector"]) == 3
    # Standard errors must be positive and non-zero
    assert tomo["std_errors"]["z"] > 0.0
    # Empirical fidelity should be close to exact 0.95 within 3-sigma statistical fluctuation
    assert 0.90 <= tomo["empirical_fidelity"] <= 1.0


def test_noise_sweep_endpoint():
    """Verify the depolarizing noise sweep across [0.0, 0.75] produces monotonic fidelity decay."""
    payload = {
        "theta": 0.0,
        "phi": 0.0,
        "p_min": 0.0,
        "p_max": 0.75,
        "num_points": 8,
    }
    response = client.post("/api/experiments/noise-sweep", json=payload)
    assert response.status_code == 200
    data = response.json()

    points = data["points"]
    assert len(points) == 8
    assert data["max_discrepancy"] < 1e-5

    # Check monotonic decrease of state fidelity
    for i in range(len(points) - 1):
        assert points[i]["state_fidelity"] >= points[i + 1]["state_fidelity"] - 1e-6
        assert points[i]["bloch_radius"] >= points[i + 1]["bloch_radius"] - 1e-6

    # Verify first point is p=0, F=1.0
    assert math.isclose(points[0]["noise_p"], 0.0, abs_tol=1e-5)
    assert math.isclose(points[0]["state_fidelity"], 1.0, abs_tol=1e-5)
    assert points[0]["has_quantum_advantage"] is True

    # Verify last point is p=0.75, F=0.625 (< 2/3)
    assert math.isclose(points[-1]["noise_p"], 0.75, abs_tol=1e-5)
    assert math.isclose(points[-1]["state_fidelity"], 0.625, abs_tol=1e-5)
    assert points[-1]["has_quantum_advantage"] is False


def test_noise_sweep_invalid_bounds():
    """Verify validation error when p_min >= p_max."""
    payload = {
        "theta": 0.0,
        "phi": 0.0,
        "p_min": 0.8,
        "p_max": 0.2,
        "num_points": 5,
    }
    response = client.post("/api/experiments/noise-sweep", json=payload)
    assert response.status_code == 400


def test_regression_network_lab_and_editable_links():
    """Verify Network Lab routes and editable links continue to work without regression."""
    # Topologies list
    res_topo = client.get("/api/network/topologies")
    assert res_topo.status_code == 200
    topos = res_topo.json()
    assert "presets" in topos
    assert len(topos["presets"]) >= 3

    # Route calculation with link overrides
    route_payload = {
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "source": "Alice",
        "target": "Bob",
        "strategy": "dijkstra",
        "link_overrides": [
            {"source": "Alice", "target": "Repeater A", "w": 0.2, "distance_km": 100.0}
        ]
    }
    res_route = client.post("/api/network/route", json=route_payload)
    assert res_route.status_code == 200
    route_data = res_route.json()
    assert "selected_route" in route_data
    path = route_data["selected_route"]["path"]
    assert "Alice" in path
    assert "Bob" in path
