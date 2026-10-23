"""Unit and Integration Tests for Phase 3 Endpoints (QASM, Validation, Analysis)."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


# ==============================================================================
# QASM Export Tests
# ==============================================================================


def test_qasm_list_circuits():
    resp = client.get("/api/qasm/circuits")
    assert resp.status_code == 200
    data = resp.json()
    assert "supported_circuits" in data
    ids = [c["id"] for c in data["supported_circuits"]]
    assert "teleportation" in ids
    assert "swapping_2hop" in ids
    assert "swapping_3hop" in ids
    assert "purification_core" in ids


def test_qasm_export_teleportation():
    resp = client.post(
        "/api/qasm/export",
        json={"circuit_type": "teleportation", "theta": 1.570796, "phi": 0.0},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["circuit_type"] == "teleportation"
    assert "OPENQASM 3" in data["qasm"]
    assert data["qubit_count"] == 3
    assert data["depth"] > 0
    assert data["is_valid"] is True


def test_qasm_export_swapping_2hop():
    resp = client.post(
        "/api/qasm/export",
        json={"circuit_type": "swapping_2hop"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["qubit_count"] == 4
    assert "OPENQASM 3" in data["qasm"]


def test_qasm_export_swapping_3hop():
    resp = client.post(
        "/api/qasm/export",
        json={"circuit_type": "swapping_3hop"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["qubit_count"] == 6
    assert "OPENQASM 3" in data["qasm"]


def test_qasm_export_purification_core():
    resp = client.post(
        "/api/qasm/export",
        json={"circuit_type": "purification_core"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["qubit_count"] == 4
    assert data["gate_count"].get("cx") == 2


def test_qasm_export_purification_experiment_kraus_rejection():
    """Regression test: noisy purification circuit without idealized flag must cleanly reject Kraus instruction."""
    resp = client.post(
        "/api/qasm/export",
        json={"circuit_type": "purification_experiment", "werner_w": 0.8, "idealized": False},
    )
    assert resp.status_code == 400
    detail = resp.json()["detail"]
    assert "non-unitary Kraus" in detail or "kraus" in detail.lower()


def test_qasm_export_purification_experiment_idealized():
    """Regression test: purification experiment with idealized=True exports valid 4-qubit, 4-clbit circuit."""
    resp = client.post(
        "/api/qasm/export",
        json={"circuit_type": "purification_experiment", "werner_w": 0.8, "idealized": True},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["qubit_count"] == 4
    assert data["classical_bit_count"] == 4
    assert data["is_idealized"] is True
    assert data["omitted_channel_notes"] is not None
    assert "OPENQASM 3" in data["qasm"]
    assert data["gate_count"].get("measure") == 4
    assert data["gate_count"].get("cx") == 5


def test_qasm_export_purification_experiment_w_one():
    """Purification experiment with w=1.0 is naturally unitary and requires no channel omission."""
    resp = client.post(
        "/api/qasm/export",
        json={"circuit_type": "purification_experiment", "werner_w": 1.0},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["qubit_count"] == 4
    assert data["classical_bit_count"] == 4
    assert data["is_idealized"] is False
    assert data["omitted_channel_notes"] is None


def test_qasm_export_unsupported_error():
    resp = client.post(
        "/api/qasm/export",
        json={"circuit_type": "unsupported_magic_circuit"},
    )
    assert resp.status_code == 400
    assert "Unsupported circuit type" in resp.json()["detail"]


# ==============================================================================
# Validation Tests
# ==============================================================================


def test_validation_benchmarks():
    resp = client.get("/api/validation/benchmarks?tolerance=0.0001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall_status"] == "ALL_PASSED"
    assert data["total_tests"] >= 5
    assert data["passed_tests"] == data["total_tests"]
    assert data["failed_tests"] == 0
    assert len(data["benchmarks"]) >= 5
    assert len(data["noise_sweep"]) > 0

    # Ensure actual residuals are numerical and strictly within tolerance
    for bm in data["benchmarks"]:
        assert bm["bell_delta"] <= data["tolerance"]
        assert bm["is_valid"] is True


def test_validation_custom_path():
    resp = client.post(
        "/api/validation/custom",
        json={
            "path_name": "Test 3-Hop Route",
            "link_werner_parameters": [0.95, 0.90, 0.85],
            "tolerance": 0.0001,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["hop_count"] == 3
    assert data["is_valid"] is True
    assert data["bell_delta"] <= 0.0001


def test_validation_invalid_bounds():
    resp = client.post(
        "/api/validation/custom",
        json={
            "path_name": "Invalid Route",
            "link_werner_parameters": [1.5],
            "tolerance": 0.0001,
        },
    )
    assert resp.status_code == 400


# ==============================================================================
# State Analysis & Tomography Tests
# ==============================================================================


def test_analysis_presets():
    resp = client.get("/api/analysis/presets")
    assert resp.status_code == 200
    data = resp.json()
    assert "presets" in data
    ids = [p["id"] for p in data["presets"]]
    assert "plus" in ids
    assert "zero" in ids


def test_analysis_tomography_plus_state():
    resp = client.post(
        "/api/analysis/tomography",
        json={"preset": "plus", "shots": 1024, "seed": 42},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["shots"] == 1024
    # For |+> state, rx should be close to 1.0, ry and rz close to 0.0
    assert abs(data["rx"] - 1.0) < 0.15
    assert abs(data["ry"]) < 0.15
    assert abs(data["rz"]) < 0.15
    assert data["fidelity_with_target"] > 0.95
    assert len(data["density_matrix_real"]) == 2
    assert len(data["density_matrix_real"][0]) == 2
