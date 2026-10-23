"""Unit tests for the predicted vs. circuit-simulated validation harness (QR-006)."""

import pytest
import numpy as np
import networkx as nx

from quantumroute.network import create_topology
from quantumroute.routing import shortest_hop_path, quality_aware_path
from quantumroute.validate import (
    compare_model_and_simulation,
    compare_predicted_vs_simulated,
    validate_noise_model,
)


@pytest.fixture
def test_network():
    return create_topology()


def test_validation_1_hop(test_network):
    """Test 1-hop link validation matches within 1e-4."""
    path = ["A", "C"]  # 1 hop in create_topology, w=0.70
    res = compare_model_and_simulation(test_network, path, tolerance=1e-4)

    assert res.hop_count == 1
    assert res.is_valid is True
    assert res.status == "PASSED"
    assert res.bell_delta < 1e-4
    expected_f_bell = (1.0 + 3.0 * 0.70) / 4.0
    assert np.isclose(res.f_bell_predicted, expected_f_bell, atol=1e-4)
    assert np.isclose(res.f_bell_simulated, expected_f_bell, atol=1e-4)


def test_validation_2_hop(test_network):
    """Test 2-hop entanglement swapping validation (A - C - D)."""
    path = ["A", "C", "D"]  # 2 hops, w=[0.70, 0.70]
    res = compare_model_and_simulation(test_network, path, tolerance=1e-4)

    assert res.hop_count == 2
    assert res.is_valid is True
    assert res.status == "PASSED"
    assert res.bell_delta < 1e-4
    expected_w = 0.70 * 0.70
    expected_f_bell = (1.0 + 3.0 * expected_w) / 4.0
    assert np.isclose(res.f_bell_predicted, expected_f_bell, atol=1e-4)
    assert np.isclose(res.f_bell_simulated, expected_f_bell, atol=1e-4)


def test_validation_3_hop():
    """Test 3-hop entanglement swapping validation on custom 3-hop graph."""
    g = nx.Graph()
    g.add_edge("N0", "N1", w=0.90)
    g.add_edge("N1", "N2", w=0.85)
    g.add_edge("N2", "N3", w=0.95)

    path = ["N0", "N1", "N2", "N3"]
    res = compare_model_and_simulation(g, path, tolerance=1e-4)

    assert res.hop_count == 3
    assert res.is_valid is True
    assert res.status == "PASSED"
    assert res.bell_delta < 1e-4

    expected_w = 0.90 * 0.85 * 0.95
    expected_f_bell = (1.0 + 3.0 * expected_w) / 4.0
    assert np.isclose(res.f_bell_predicted, expected_f_bell, atol=1e-4)
    assert np.isclose(res.f_bell_simulated, expected_f_bell, atol=1e-4)


def test_validation_route_comparison(test_network):
    """Compare validation for Shortest-Hop (BFS) vs. Quality-Aware (Dijkstra) routes on pair A->D."""
    # Source A, Target D
    bfs_path = shortest_hop_path(test_network, "A", "D")
    dijkstra_path = quality_aware_path(test_network, "A", "D")

    # In benchmark topology:
    # BFS: ['A', 'C', 'D'] (2 hops, w = 0.490)
    # Dijkstra: ['A', 'B', 'E', 'D'] (3 hops, w = 0.857)
    assert bfs_path != dijkstra_path
    assert len(bfs_path) < len(dijkstra_path)  # BFS has fewer hops

    res_bfs = compare_model_and_simulation(test_network, bfs_path)
    res_dijkstra = compare_model_and_simulation(test_network, dijkstra_path)

    # Dijkstra route MUST yield higher end-to-end fidelity despite more hops!
    assert res_dijkstra.f_bell_simulated > res_bfs.f_bell_simulated
    assert res_dijkstra.f_tel_simulated > res_bfs.f_tel_simulated
    assert res_dijkstra.is_valid is True
    assert res_bfs.is_valid is True


def test_validation_noise_sweep():
    """Verify that depolarizing noise sweep matches analytical theory across [0, 1]."""
    p_values = [0.0, 0.1, 0.25, 0.5, 0.75, 1.0]
    sweep_results = validate_noise_model(p_values)
    assert len(sweep_results) == len(p_values)
    for r in sweep_results:
        assert r["is_valid"]
        assert r["delta"] < 1e-4


def test_validation_invalid_inputs(test_network):
    """Verify that invalid paths and edge cases raise appropriate exceptions."""
    with pytest.raises(ValueError):
        compare_model_and_simulation(test_network, ["A"])  # Single node

    with pytest.raises((ValueError, KeyError)):
        compare_model_and_simulation(test_network, ["A", "NON_EXISTENT_NODE"])
