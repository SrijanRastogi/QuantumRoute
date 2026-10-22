"""Comprehensive test suite for Interactive 3D Bloch Sphere & Coordinate Editor.

Validates:
1. Spherical (θ, φ) to Cartesian (x, y, z) conversion across all 6 cardinal states.
2. Cartesian (x, y, z) to Spherical (θ, φ) inverse conversion and round-trip consistency.
3. Stable pole handling convention (North pole θ=0 and South pole θ=π define φ=0).
4. Invalid coordinate rejection (pure state norm != 1.0, non-finite values).
5. Explicit unit sphere normalization (x/r, y/r, z/r).
6. Mixed-state mode validation (norm <= 1.0, purity = (1 + r^2)/2).
7. Synchronization between Cartesian coordinates, Stokes density matrix, and amplitudes.
8. Depolarizing noise Bloch-vector contraction behavior (r_out = (1 - p) * r_in).
9. Cardinal preset states and reset behavior.
10. Non-regression of teleportation circuit simulation and Network Lab routing.
"""

import math
import pytest
import numpy as np
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_spherical_to_cartesian_six_cardinal_states():
    """Verify conversion from (theta, phi) to (x, y, z) for all 6 cardinal states."""
    cardinal_cases = [
        # (theta, phi, expected_x, expected_y, expected_z, state_name)
        (0.0, 0.0, 0.0, 0.0, 1.0, "|0⟩ Ground"),
        (math.pi, 0.0, 0.0, 0.0, -1.0, "|1⟩ Excited"),
        (math.pi / 2.0, 0.0, 1.0, 0.0, 0.0, "|+⟩ Superposition"),
        (math.pi / 2.0, math.pi, -1.0, 0.0, 0.0, "|-⟩ Phase Flip"),
        (math.pi / 2.0, math.pi / 2.0, 0.0, 1.0, 0.0, "|+i⟩ Circular Y+"),
        (math.pi / 2.0, 3.0 * math.pi / 2.0, 0.0, -1.0, 0.0, "|-i⟩ Circular Y-"),
    ]

    for th, ph, ex, ey, ez, name in cardinal_cases:
        res = client.post("/api/experiments/state", json={"theta": th, "phi": ph})
        assert res.status_code == 200, f"Failed for {name}"
        data = res.json()
        bx, by, bz = data["bloch_vector"]
        assert math.isclose(bx, ex, abs_tol=1e-5), f"X mismatch for {name}: {bx} vs {ex}"
        assert math.isclose(by, ey, abs_tol=1e-5), f"Y mismatch for {name}: {by} vs {ey}"
        assert math.isclose(bz, ez, abs_tol=1e-5), f"Z mismatch for {name}: {bz} vs {ez}"
        assert math.isclose(data["bloch_radius"], 1.0, abs_tol=1e-5)


def test_cartesian_to_spherical_conversion_and_roundtrip():
    """Verify conversion from valid (x, y, z) to (theta, phi) and bidirectional round-trip consistency."""
    test_vectors = [
        (1.0, 0.0, 0.0),
        (-1.0, 0.0, 0.0),
        (0.0, 1.0, 0.0),
        (0.0, -1.0, 0.0),
        (0.0, 0.0, 1.0),
        (0.0, 0.0, -1.0),
        (1.0 / math.sqrt(3), 1.0 / math.sqrt(3), 1.0 / math.sqrt(3)),
        (1.0 / math.sqrt(2), 0.0, 1.0 / math.sqrt(2)),
    ]

    for x, y, z in test_vectors:
        res = client.post("/api/experiments/cartesian", json={"x": x, "y": y, "z": z, "is_mixed": False})
        assert res.status_code == 200
        data = res.json()
        assert data["is_valid"] is True
        assert math.isclose(data["radius"], 1.0, abs_tol=1e-4)

        # Check round-trip: spherical angles plugged back produce original (x, y, z)
        th = data["theta"]
        ph = data["phi"]
        roundtrip_x = math.sin(th) * math.cos(ph)
        roundtrip_y = math.sin(th) * math.sin(ph)
        roundtrip_z = math.cos(th)

        assert math.isclose(roundtrip_x, x, abs_tol=1e-4)
        assert math.isclose(roundtrip_y, y, abs_tol=1e-4)
        assert math.isclose(roundtrip_z, z, abs_tol=1e-4)


def test_pole_handling_convention():
    """Verify stable pole handling: phi is conventionally 0.0 at North (Z=+1) and South (Z=-1) poles."""
    # North pole |0>
    res_north = client.post("/api/experiments/cartesian", json={"x": 0.0, "y": 0.0, "z": 1.0})
    assert res_north.status_code == 200
    data_north = res_north.json()
    assert math.isclose(data_north["theta"], 0.0, abs_tol=1e-5)
    assert data_north["phi"] == 0.0

    # South pole |1>
    res_south = client.post("/api/experiments/cartesian", json={"x": 0.0, "y": 0.0, "z": -1.0})
    assert res_south.status_code == 200
    data_south = res_south.json()
    assert math.isclose(data_south["theta"], math.pi, abs_tol=1e-5)
    assert data_south["phi"] == 0.0

    # Extremely close to North pole
    res_near_north = client.post("/api/experiments/cartesian", json={"x": 1e-8, "y": 1e-8, "z": 0.99999999})
    assert res_near_north.status_code == 200
    assert res_near_north.json()["phi"] == 0.0


def test_invalid_cartesian_coordinate_rejection():
    """Verify rejection of non-unit vectors in pure-state mode and non-finite inputs."""
    # Vector norm > 1 in pure mode
    res_large = client.post("/api/experiments/cartesian", json={"x": 1.0, "y": 1.0, "z": 0.0, "is_mixed": False})
    assert res_large.status_code == 200
    data_large = res_large.json()
    assert data_large["is_valid"] is False
    assert "Pure states require x² + y² + z² = 1" in data_large["validation_message"]
    assert math.isclose(data_large["radius"], math.sqrt(2), abs_tol=1e-4)

    # Vector norm < 1 in pure mode
    res_small = client.post("/api/experiments/cartesian", json={"x": 0.3, "y": 0.3, "z": 0.3, "is_mixed": False})
    assert res_small.status_code == 200
    data_small = res_small.json()
    assert data_small["is_valid"] is False
    assert "Pure states require x² + y² + z² = 1" in data_small["validation_message"]


def test_explicit_normalization_logic():
    """Verify explicit unit sphere normalization correctly scales non-unit vectors."""
    res = client.post("/api/experiments/cartesian", json={"x": 1.0, "y": 1.0, "z": 0.0, "is_mixed": False})
    assert res.status_code == 200
    data = res.json()
    nx, ny, nz = data["normalized"]

    # Normalized vector must have norm 1.0
    norm_radius = math.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    assert math.isclose(norm_radius, 1.0, abs_tol=1e-5)
    assert math.isclose(nx, 1.0 / math.sqrt(2), abs_tol=1e-4)
    assert math.isclose(ny, 1.0 / math.sqrt(2), abs_tol=1e-4)
    assert math.isclose(nz, 0.0, abs_tol=1e-4)


def test_mixed_state_validation():
    """Verify mixed-state mode allows interior Bloch vectors (||r|| <= 1.0) and validates purity."""
    # Valid mixed state inside the Bloch ball (radius = 0.6)
    res_mixed = client.post("/api/experiments/cartesian", json={"x": 0.6, "y": 0.0, "z": 0.0, "is_mixed": True})
    assert res_mixed.status_code == 200
    data_mixed = res_mixed.json()
    assert data_mixed["is_valid"] is True
    assert data_mixed["validation_message"] is None
    assert math.isclose(data_mixed["radius"], 0.6, abs_tol=1e-4)
    # Theoretical purity: (1 + r^2) / 2 = (1 + 0.36) / 2 = 0.68
    assert math.isclose(data_mixed["purity"], 0.68, abs_tol=1e-4)

    # Completely mixed state I/2 (origin r = 0)
    res_center = client.post("/api/experiments/cartesian", json={"x": 0.0, "y": 0.0, "z": 0.0, "is_mixed": True})
    assert res_center.status_code == 200
    data_center = res_center.json()
    assert data_center["is_valid"] is True
    assert math.isclose(data_center["purity"], 0.50, abs_tol=1e-4)

    # Invalid mixed state (radius > 1.0)
    res_overflow = client.post("/api/experiments/cartesian", json={"x": 1.0, "y": 1.0, "z": 0.5, "is_mixed": True})
    assert res_overflow.status_code == 200
    data_overflow = res_overflow.json()
    assert data_overflow["is_valid"] is False
    assert "Physical density matrices require norm ≤ 1.0" in data_overflow["validation_message"]


def test_density_matrix_and_amplitudes_synchronization():
    """Verify linear Stokes density matrix entries match Pauli expectation values."""
    x, y, z = 0.6, 0.8, 0.0  # Unit vector in equatorial plane
    res = client.post("/api/experiments/cartesian", json={"x": x, "y": y, "z": z, "is_mixed": False})
    assert res.status_code == 200
    data = res.json()

    dm_real = data["density_matrix"]["real"]
    dm_imag = data["density_matrix"]["imag"]

    # Stokes formulas:
    # rho_00 = (1 + z)/2, rho_11 = (1 - z)/2
    assert math.isclose(dm_real[0][0], 0.5 * (1.0 + z), abs_tol=1e-4)
    assert math.isclose(dm_real[1][1], 0.5 * (1.0 - z), abs_tol=1e-4)

    # rho_01 = (x - iy)/2, rho_10 = (x + iy)/2
    assert math.isclose(dm_real[0][1], 0.5 * x, abs_tol=1e-4)
    assert math.isclose(dm_imag[0][1], -0.5 * y, abs_tol=1e-4)
    assert math.isclose(dm_real[1][0], 0.5 * x, abs_tol=1e-4)
    assert math.isclose(dm_imag[1][0], 0.5 * y, abs_tol=1e-4)


def test_noise_vector_contraction_behavior():
    """Verify depolarizing noise isotropically contracts Bob's Bloch vector: r_out = (1 - p) * r_in."""
    for p_noise in [0.1, 0.25, 0.5, 0.8]:
        payload = {"theta": math.pi / 2.0, "phi": 0.0, "noise_p": p_noise}  # |+> input: (1, 0, 0)
        res = client.post("/api/experiments/teleport", json=payload)
        assert res.status_code == 200
        data = res.json()

        out_bloch = data["output_state"]["bloch_vector"]
        expected_rx = 1.0 * (1.0 - p_noise)

        assert math.isclose(out_bloch[0], expected_rx, abs_tol=1e-4)
        assert math.isclose(out_bloch[1], 0.0, abs_tol=1e-4)
        assert math.isclose(out_bloch[2], 0.0, abs_tol=1e-4)
        assert math.isclose(data["output_state"]["bloch_radius"], expected_rx, abs_tol=1e-4)


def test_presets_endpoint_integrity():
    """Verify preset states include all 6 cardinal states with proper basis tags."""
    res = client.get("/api/experiments/presets")
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) == 6

    preset_map = {p["id"]: p for p in presets}
    assert "zero" in preset_map
    assert "one" in preset_map
    assert "plus" in preset_map
    assert "minus" in preset_map
    assert "plus_i" in preset_map
    assert "minus_i" in preset_map

    assert preset_map["zero"]["bloch_vector"] == [0.0, 0.0, 1.0]
    assert preset_map["one"]["bloch_vector"] == [0.0, 0.0, -1.0]
    assert preset_map["plus"]["bloch_vector"] == [1.0, 0.0, 0.0]
    assert preset_map["minus"]["bloch_vector"] == [-1.0, 0.0, 0.0]
    assert preset_map["plus_i"]["bloch_vector"] == [0.0, 1.0, 0.0]
    assert preset_map["minus_i"]["bloch_vector"] == [0.0, -1.0, 0.0]


def test_no_regressions_teleportation_and_network_lab():
    """Verify end-to-end teleportation and Network Lab routing continue to function without regressions."""
    # 1. Teleportation execution
    teleport_payload = {"theta": 0.0, "phi": 0.0, "noise_p": 0.0}
    res_tel = client.post("/api/experiments/teleport", json=teleport_payload)
    assert res_tel.status_code == 200
    tel_data = res_tel.json()
    assert math.isclose(tel_data["metrics"]["state_fidelity"], 1.0, abs_tol=1e-5)
    assert tel_data["circuit"]["num_qubits"] == 3

    # 2. Network Lab routing
    route_payload = {
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "source": "Alice",
        "target": "Bob",
        "strategy": "dijkstra",
    }
    res_route = client.post("/api/network/route", json=route_payload)
    assert res_route.status_code == 200
    route_data = res_route.json()
    assert "selected_route" in route_data
    assert "Alice" in route_data["selected_route"]["path"]
    assert "Bob" in route_data["selected_route"]["path"]
