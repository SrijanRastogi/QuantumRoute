"""Milestone 3: Unit and integration tests for Physical Channels Lab and API.

Verifies:
1. Fiber transmission model eta_fiber(L) = 10^(-alpha * L / 10).
2. Coupling efficiency: eta_total = eta_coupling * eta_fiber.
3. Separation of transmission probability from conditional Werner quality w.
4. Independent single-shot path success probability: P_success = prod(eta_total_e).
5. Multi-hop Werner composition w_path = prod(w_e) and Bell / teleportation fidelities.
6. Memory decoherence dephasing: exp(-tau_wait / T2).
7. Strict parameter validation and probability bounds in [0.0, 1.0].
8. Route comparison behavior under unequal link distances and heterogeneous efficiencies.
9. FastAPI channels endpoints (/api/channels/defaults, /link, /sweep, /path, /compare-routes).
"""

import math
import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.main import app
from quantumroute.physics import (
    DEFAULT_ALPHA_DB_PER_KM,
    DEFAULT_COUPLING_EFFICIENCY,
    DEFAULT_P_DARK,
    DEFAULT_RAW_VISIBILITY,
    calculate_fiber_attenuation_db,
    calculate_fiber_transmittance,
    calculate_total_transmittance,
    calculate_conditional_werner_parameter,
    calculate_path_success_probability,
    calculate_path_conditional_werner,
    calculate_memory_decay_factor,
    evaluate_fiber_link,
    evaluate_physical_path,
    validate_physical_distance,
    validate_attenuation_coefficient,
    validate_efficiency,
)

client = TestClient(app)


def test_fiber_transmission_distance_scaling():
    """Verify zero distance, positive distance, and increasing-distance attenuation."""
    alpha = 0.20  # dB/km illustrative telecom silica baseline

    # Zero distance => 0 dB loss, 1.0 transmittance
    assert calculate_fiber_attenuation_db(0.0, alpha) == 0.0
    assert calculate_fiber_transmittance(0.0, alpha) == 1.0

    # 10 km => 2 dB loss => eta = 10^(-0.2) ≈ 0.630957
    loss_10 = calculate_fiber_attenuation_db(10.0, alpha)
    assert abs(loss_10 - 2.0) < 1e-12
    eta_10 = calculate_fiber_transmittance(10.0, alpha)
    assert abs(eta_10 - (10.0 ** (-0.2))) < 1e-12

    # 50 km => 10 dB loss => eta = 0.10
    eta_50 = calculate_fiber_transmittance(50.0, alpha)
    assert abs(eta_50 - 0.10) < 1e-12

    # 100 km => 20 dB loss => eta = 0.01
    eta_100 = calculate_fiber_transmittance(100.0, alpha)
    assert abs(eta_100 - 0.01) < 1e-12

    # Monotonic strictly decreasing property: eta(L1) > eta(L2) for L1 < L2
    distances = [0.0, 5.0, 15.0, 30.0, 60.0, 100.0]
    etas = [calculate_fiber_transmittance(d, alpha) for d in distances]
    for i in range(len(etas) - 1):
        assert etas[i] > etas[i + 1]


def test_coupling_efficiency_and_total_transmittance():
    """Verify separate representation of coupling efficiency: eta_total = eta_coupling * eta_fiber."""
    dist = 50.0  # 10 dB loss => eta_fiber = 0.10
    alpha = 0.20

    # Ideal coupling (1.0)
    eta_ideal = calculate_total_transmittance(dist, alpha, coupling_efficiency=1.0)
    assert abs(eta_ideal - 0.10) < 1e-12

    # 85% coupling efficiency
    eta_85 = calculate_total_transmittance(dist, alpha, coupling_efficiency=0.85)
    assert abs(eta_85 - 0.085) < 1e-12

    # 50% coupling efficiency
    eta_50 = calculate_total_transmittance(dist, alpha, coupling_efficiency=0.50)
    assert abs(eta_50 - 0.050) < 1e-12

    # Zero coupling => zero transmission regardless of distance
    eta_zero = calculate_total_transmittance(0.0, alpha, coupling_efficiency=0.0)
    assert eta_zero == 0.0


def test_parameter_validation_and_bounds():
    """Verify validation for distances, attenuation, efficiencies, and probability bounds [0.0, 1.0]."""
    # Negative distance rejected
    with pytest.raises(ValueError, match="cannot be negative"):
        validate_physical_distance(-5.0)

    # Boolean rejected as distance
    with pytest.raises(TypeError, match="must be a real number"):
        validate_physical_distance(True)

    # Negative alpha rejected
    with pytest.raises(ValueError, match="cannot be negative"):
        validate_attenuation_coefficient(-0.2)

    # Efficiency outside [0, 1] rejected
    with pytest.raises(ValueError, match="must be in"):
        validate_efficiency(-0.01)

    with pytest.raises(ValueError, match="must be in"):
        validate_efficiency(1.001)

    with pytest.raises(TypeError, match="must be a real number"):
        validate_efficiency(False)

    # Output probabilities strictly clipped to [0, 1]
    for d in [0.0, 1e-9, 25.0, 150.0, 500.0]:
        eta = calculate_total_transmittance(d, alpha_db_per_km=0.20, coupling_efficiency=0.90)
        assert 0.0 <= eta <= 1.0


def test_separation_of_transmission_success_from_werner_quality():
    """Verify that transmission loss is decoupled from conditional Werner quality w.

    In the decoupled model:
    - Distance and attenuation drastically reduce transmission probability eta_total.
    - Conditional Werner quality w remains constant (independent of photon absorption).
    """
    alpha = 0.20
    coupling = 0.85
    raw_vis = 0.96

    # Compare 10 km vs 80 km under decoupled quality
    eta_10 = calculate_total_transmittance(10.0, alpha, coupling)
    eta_80 = calculate_total_transmittance(80.0, alpha, coupling)

    # Transmittance drops by more than a factor of 25 (14 dB difference)
    assert eta_10 > 25.0 * eta_80

    # Under decoupled model, conditional quality w is raw_vis on both links
    # (Loss does NOT twirl the photon into a mixed state; it only causes an erasure / loss event)
    w_10_decoupled = raw_vis
    w_80_decoupled = raw_vis
    assert w_10_decoupled == w_80_decoupled == 0.96

    # Under the simplified dark-count SNR heuristic, w degrades only when eta nears p_dark
    p_dark = 1e-5
    w_10_heuristic = calculate_conditional_werner_parameter(eta_10, p_dark=p_dark, raw_visibility=raw_vis)
    w_80_heuristic = calculate_conditional_werner_parameter(eta_80, p_dark=p_dark, raw_visibility=raw_vis)

    # At 10 km, eta_10 ~ 0.536 >> 2e-5, so w is practically untouched (~ 0.95996)
    assert abs(w_10_heuristic - raw_vis) < 0.001

    # At 80 km, eta_80 ~ 0.021 >> 2e-5, so w is still ~ 0.959
    assert abs(w_80_heuristic - raw_vis) < 0.005

    # If p_dark == 0, heuristic identically equals decoupled quality
    w_zero_dark = calculate_conditional_werner_parameter(eta_80, p_dark=0.0, raw_visibility=raw_vis)
    assert abs(w_zero_dark - raw_vis) < 1e-12


def test_path_success_probability_under_independence_assumption():
    """Verify multi-hop path success probability P_success = product(eta_total_e)."""
    # 3-hop path with transmittances 0.5, 0.4, 0.8
    hops_eta = [0.5, 0.4, 0.8]
    expected_p = 0.5 * 0.4 * 0.8  # 0.16
    p_path = calculate_path_success_probability(hops_eta)
    assert abs(p_path - expected_p) < 1e-12

    # Single-hop path
    assert calculate_path_success_probability([0.75]) == 0.75

    # Empty path defaults to 1.0
    assert calculate_path_success_probability([]) == 1.0

    # Zero link transmittance drops entire path to zero (unbuffered single-shot assumption)
    assert calculate_path_success_probability([0.9, 0.0, 0.8]) == 0.0


def test_path_werner_composition_and_fidelities():
    """Verify conditional path Werner composition w_path = prod(w_e) and Bell / teleport fidelities."""
    hop_w = [0.95, 0.90, 0.85]
    expected_w_path = 0.95 * 0.90 * 0.85  # 0.72675
    w_path = calculate_path_conditional_werner(hop_w)
    assert abs(w_path - expected_w_path) < 1e-12

    # Bell fidelity: Fe = (1 + 3w)/4
    fe = (1.0 + 3.0 * w_path) / 4.0
    assert abs(fe - (1.0 + 3.0 * 0.72675) / 4.0) < 1e-12

    # Average single-qubit teleportation fidelity: F_tel = (1 + w)/2 = (2*Fe + 1)/3
    ftel = (1.0 + w_path) / 2.0
    assert abs(ftel - (2.0 * fe + 1.0) / 3.0) < 1e-12
    assert abs(ftel - (1.0 + 0.72675) / 2.0) < 1e-12


def test_memory_decoherence_decay_model():
    """Verify simplified memory dephasing decay factor exp(-tau / T2)."""
    # tau = 0 => decay = 1.0 (no decay)
    assert calculate_memory_decay_factor(0.0, t2_ms=2.0) == 1.0

    # tau = 2.0 ms, T2 = 2.0 ms => exp(-1) ≈ 0.367879
    decay_1 = calculate_memory_decay_factor(2.0, t2_ms=2.0)
    assert abs(decay_1 - math.exp(-1.0)) < 1e-12

    # Negative tau rejected
    with pytest.raises(ValueError, match="cannot be negative"):
        calculate_memory_decay_factor(-1.0, t2_ms=2.0)

    # Non-positive T2 rejected
    with pytest.raises(ValueError, match="must be positive"):
        calculate_memory_decay_factor(1.0, t2_ms=0.0)


def test_evaluate_physical_path_comprehensive_report():
    """Verify evaluate_physical_path returns consistent report separating yield, quality, and memory."""
    distances = [20.0, 30.0, 25.0]  # Total = 75 km
    report = evaluate_physical_path(
        hop_distances_km=distances,
        alpha_db_per_km=0.20,
        coupling_efficiency=0.90,
        raw_visibility=0.98,
        t2_ms=5.0,
    )

    assert report.num_hops == 3
    assert report.total_distance_km == 75.0
    assert report.total_attenuation_db == 15.0  # 75 * 0.20

    # Total delay: 75 km * 0.005 ms/km = 0.375 ms
    assert abs(report.total_propagation_delay_ms - 0.375) < 1e-12

    # Path success probability < single hop
    assert 0.0 < report.path_success_probability < 1.0
    assert report.conditional_werner_w <= 0.98

    # Memory effect reduces werner_with_memory
    assert report.werner_with_memory <= report.conditional_werner_w
    assert report.fidelity_with_memory <= report.conditional_bell_fidelity


def test_route_comparison_minimum_hops_vs_distance_divergence():
    """Verify that minimum-hop routing does NOT always maximize transmission probability.

    Construct a scenario where:
    Route A (1 hop): Distance = 80 km (16 dB loss).
    Route B (2 hops): 25 km + 25 km = 50 km total (10 dB loss).

    For identical coupling efficiency:
    Route B has MORE hops, but 30 km LESS total fiber distance.
    Therefore Route B has much HIGHER photon transmission probability than Route A!
    """
    alpha = 0.20
    coupling = 1.0  # Uniform coupling

    # 1-hop path of 80 km
    eta_1hop = calculate_total_transmittance(80.0, alpha, coupling)  # 10^(-1.6) ≈ 0.0251

    # 2-hop path of 25 km each
    eta_hop1 = calculate_total_transmittance(25.0, alpha, coupling)  # 10^(-0.5) ≈ 0.3162
    eta_hop2 = calculate_total_transmittance(25.0, alpha, coupling)
    p_2hop = calculate_path_success_probability([eta_hop1, eta_hop2])  # 10^(-1.0) = 0.1000

    # Route B (2 hops) transmission probability is 4x higher than Route A (1 hop)!
    assert p_2hop > 3.9 * eta_1hop, (
        f"Expected 2-hop 50 km route (P={p_2hop:.4f}) to beat 1-hop 80 km route (P={eta_1hop:.4f})"
    )


def test_api_channels_defaults_endpoint():
    """Verify GET /api/channels/defaults returns presets and valid physical documentation."""
    response = client.get("/api/channels/defaults")
    assert response.status_code == 200
    data = response.json()

    assert data["alpha_db_per_km"] == 0.20
    assert 0.0 < data["coupling_efficiency"] <= 1.0
    assert len(data["presets"]) >= 3
    assert "transmission_model" in data["assumptions"]
    assert "path_success" in data["assumptions"]


def test_api_channels_link_endpoint():
    """Verify POST /api/channels/link computes physical metrics and worked example."""
    payload = {
        "distance_km": 50.0,
        "alpha_db_per_km": 0.20,
        "coupling_efficiency": 0.85,
        "p_dark": 1e-5,
        "raw_visibility": 0.98,
        "use_decoupled_werner": False,
    }
    response = client.post("/api/channels/link", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["distance_km"] == 50.0
    assert data["attenuation_db"] == 10.0
    assert math.isclose(data["transmittance_fiber"], 0.10, abs_tol=1e-5)
    assert math.isclose(data["transmittance_total"], 0.085, abs_tol=1e-5)
    assert data["conditional_bell_fidelity"] > 0.90
    assert "worked_example" in data


def test_api_channels_sweep_endpoint():
    """Verify POST /api/channels/sweep returns distance points with loss vs quality contrast."""
    payload = {
        "max_distance_km": 80.0,
        "num_points": 9,
        "alpha_db_per_km": 0.20,
        "coupling_efficiency": 0.90,
    }
    response = client.post("/api/channels/sweep", json=payload)
    assert response.status_code == 200
    data = response.json()

    points = data["points"]
    assert len(points) == 9
    assert points[0]["distance_km"] == 0.0
    assert points[-1]["distance_km"] == 80.0

    # Ensure transmission drops while decoupled quality stays constant
    assert points[0]["eta_total"] > points[-1]["eta_total"]
    assert points[0]["w_decoupled"] == points[-1]["w_decoupled"]


def test_api_channels_path_endpoint():
    """Verify POST /api/channels/path evaluates multi-hop path success and memory decay."""
    payload = {
        "hops": [
            {"from": "Alice", "to": "Node1", "distance_km": 20.0},
            {"from": "Node1", "to": "Bob", "distance_km": 30.0},
        ],
        "alpha_db_per_km": 0.20,
        "coupling_efficiency": 0.90,
        "t2_memory_us": 5000.0,
    }
    response = client.post("/api/channels/path", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["num_hops"] == 2
    assert data["total_distance_km"] == 50.0
    assert 0.0 < data["path_success_probability"] < 1.0
    assert data["memory_effects"]["memory_decay_factor"] <= 1.0
    assert len(data["hops"]) == 2


def test_api_channels_compare_routes_endpoint():
    """Verify POST /api/channels/compare-routes evaluates routing strategies on Generic Mesh topology."""
    payload = {
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "source": "Alice",
        "target": "Bob",
        "alpha_db_per_km": 0.20,
        "coupling_efficiency": 0.85,
    }
    response = client.post("/api/channels/compare-routes", json=payload)
    assert response.status_code == 200
    data = response.json()

    routes = data["routes"]
    assert "shortest_hop" in routes
    assert "quality_aware" in routes
    assert "multi_metric" in routes
    assert "scientific_insight" in data

    # Verify that shortest hop and quality aware routes have physical channel evaluations
    assert routes["shortest_hop"] is not None
    assert routes["quality_aware"] is not None
    assert "path_success_probability" in routes["shortest_hop"]
    assert "conditional_werner_w" in routes["quality_aware"]
