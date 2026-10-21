"""Unit and integration tests for real-world telecom topologies and multi-metric routing (QR-012)."""

import math
import pytest
import networkx as nx

from quantumroute.network import (
    create_karnataka_topology,
    create_ring_topology,
    create_star_topology,
    create_grid_topology,
    calculate_path_metrics,
)
from quantumroute.routing import (
    find_shortest_hop_route,
    find_quality_aware_route,
    find_multi_metric_route,
    compare_multi_metric_routes,
)


def test_karnataka_topology_structure():
    """Verify authentic Karnataka Regional Quantum Backbone topology attributes."""
    g = create_karnataka_topology()
    assert isinstance(g, nx.Graph)
    assert not g.is_directed()

    # 6 Major academic and research nodes
    expected_nodes = {
        "Belagavi",
        "Hubballi",
        "Davanagere",
        "Shivamogga",
        "Tumakuru",
        "Bengaluru",
    }
    assert set(g.nodes()) == expected_nodes
    assert g.number_of_nodes() == 6
    assert g.number_of_edges() == 8

    # Check edge attributes: w, distance_km, delay_ms, weight
    for u, v, data in g.edges(data=True):
        assert "w" in data
        assert "distance_km" in data
        assert "delay_ms" in data
        assert "weight" in data
        assert "bell_fidelity" in data

        w = data["w"]
        dist = data["distance_km"]
        delay = data["delay_ms"]
        assert 0.0 < w <= 1.0
        assert dist > 0.0
        # Silica fiber delay: 5.0 microseconds/km = 0.005 ms/km
        assert np.isclose(delay, dist * 0.005, atol=1e-9) if "np" in globals() else abs(delay - dist * 0.005) < 1e-9
        assert abs(data["weight"] - (-math.log(w))) < 1e-9


def test_karnataka_routing_divergence_and_tradeoffs():
    """Verify routing trade-offs between Belagavi and Bengaluru on Karnataka backbone."""
    g = create_karnataka_topology()

    bfs_route = find_shortest_hop_route(g, "Belagavi", "Bengaluru")
    dijkstra_route = find_quality_aware_route(g, "Belagavi", "Bengaluru")

    # Shortest hop uses the express bypass via Davanagere -> Bengaluru (3 hops)
    assert bfs_route.num_hops == 3
    assert bfs_route.path == ["Belagavi", "Hubballi", "Davanagere", "Bengaluru"]

    # Quality-aware routing chooses the higher-fidelity highway route via Tumakuru (4 hops)
    assert dijkstra_route.num_hops == 4
    assert dijkstra_route.path == ["Belagavi", "Hubballi", "Davanagere", "Tumakuru", "Bengaluru"]

    # Dijkstra strictly delivers higher end-to-end Werner parameter and Bell fidelity
    assert dijkstra_route.werner_parameter > bfs_route.werner_parameter
    assert dijkstra_route.bell_fidelity > bfs_route.bell_fidelity
    assert dijkstra_route.average_teleportation_fidelity > bfs_route.average_teleportation_fidelity

    # Total distance and latency verification
    assert bfs_route.total_distance_km == 95.0 + 145.0 + 260.0  # 500.0 km
    assert abs(bfs_route.total_delay_ms - 2.50) < 1e-9  # 500 * 0.005 ms

    assert dijkstra_route.total_distance_km == 95.0 + 145.0 + 195.0 + 70.0  # 505.0 km
    assert abs(dijkstra_route.total_delay_ms - 2.525) < 1e-9


def test_multi_metric_routing_alpha_extremes():
    """Verify that multi-metric routing strictly reproduces quality routing at alpha=0 and delay-minimizing routing at alpha=1."""
    g = create_karnataka_topology()

    # Alpha = 0.0: Pure Quality-Aware routing
    route_alpha0 = find_multi_metric_route(g, "Belagavi", "Bengaluru", alpha=0.0)
    route_quality = find_quality_aware_route(g, "Belagavi", "Bengaluru")
    assert route_alpha0.path == route_quality.path
    assert abs(route_alpha0.werner_parameter - route_quality.werner_parameter) < 1e-12

    # Alpha = 1.0: Pure Minimum-Delay routing (shortest optical distance)
    route_alpha1 = find_multi_metric_route(g, "Belagavi", "Bengaluru", alpha=1.0)
    # 500 km route vs 505 km route
    assert route_alpha1.path == ["Belagavi", "Hubballi", "Davanagere", "Bengaluru"]
    assert route_alpha1.total_distance_km == 500.0


def test_multi_metric_routes_comparison_sweep():
    """Verify compare_multi_metric_routes returns structured dictionary across trade-off factors."""
    g = create_karnataka_topology()
    alphas = (0.0, 0.5, 1.0)
    comp = compare_multi_metric_routes(g, "Belagavi", "Bengaluru", alphas=alphas)

    assert "alpha_0.00" in comp
    assert "alpha_0.50" in comp
    assert "alpha_1.00" in comp

    for key, route in comp.items():
        assert len(route.path) >= 2
        assert route.path[0] == "Belagavi"
        assert route.path[-1] == "Bengaluru"
        assert route.total_distance_km > 0.0


def test_ring_topology_generator():
    """Verify parametric Ring topology generation and constraints."""
    g_ring = create_ring_topology(num_nodes=6, default_w=0.88, default_distance_km=40.0)
    assert g_ring.number_of_nodes() == 6
    assert g_ring.number_of_edges() == 6

    # Every node in a ring has degree 2
    for node in g_ring.nodes():
        assert g_ring.degree(node) == 2

    # Ring size < 3 raises ValueError
    with pytest.raises(ValueError, match="at least 3 nodes"):
        create_ring_topology(num_nodes=2)


def test_star_topology_generator():
    """Verify parametric Star topology generation and constraints."""
    g_star = create_star_topology(num_spokes=4, hub_name="CentralRouter", default_w=0.95)
    assert g_star.number_of_nodes() == 5  # 1 hub + 4 spokes
    assert g_star.number_of_edges() == 4

    # Central hub has degree 4, all clients have degree 1
    assert g_star.degree("CentralRouter") == 4
    for i in range(1, 5):
        assert g_star.degree(f"Client_{i}") == 1

    # Spokes < 1 raises ValueError
    with pytest.raises(ValueError, match="at least 1 spoke"):
        create_star_topology(num_spokes=0)


def test_grid_topology_generator():
    """Verify parametric Grid/Mesh topology generation and constraints."""
    g_grid = create_grid_topology(rows=3, cols=3, default_w=0.90)
    assert g_grid.number_of_nodes() == 9
    # In a 3x3 grid, internal edges = 2 * 3 * (3 - 1) = 12
    assert g_grid.number_of_edges() == 12

    # Corners have degree 2, center has degree 4
    assert g_grid.degree("N_0_0") == 2
    assert g_grid.degree("N_1_1") == 4

    # Dimensions < 2 raise ValueError
    with pytest.raises(ValueError, match="at least 2x2"):
        create_grid_topology(rows=1, cols=3)


def test_multi_metric_validation_and_error_handling():
    """Verify error handling on invalid alpha, disconnected graphs, and unknown nodes."""
    g = create_karnataka_topology()

    # Out of range alpha raises ValueError
    with pytest.raises(ValueError, match="must be in"):
        find_multi_metric_route(g, "Belagavi", "Bengaluru", alpha=-0.1)

    with pytest.raises(ValueError, match="must be in"):
        find_multi_metric_route(g, "Belagavi", "Bengaluru", alpha=1.05)

    # Boolean or non-numeric alpha raises TypeError
    with pytest.raises(TypeError, match="must be a real number"):
        find_multi_metric_route(g, "Belagavi", "Bengaluru", alpha=True)

    with pytest.raises(TypeError, match="must be a real number"):
        find_multi_metric_route(g, "Belagavi", "Bengaluru", alpha="0.5")

    # Identical endpoints raises ValueError
    with pytest.raises(ValueError, match="must be distinct"):
        find_multi_metric_route(g, "Belagavi", "Belagavi", alpha=0.5)

    # Unknown node raises KeyError
    with pytest.raises(KeyError, match="does not exist"):
        find_multi_metric_route(g, "NON_EXISTENT", "Bengaluru", alpha=0.5)

    # Disconnected graph raises NetworkXNoPath
    g_disc = nx.Graph()
    g_disc.add_edge("X", "Y", w=0.9, distance_km=10.0)
    g_disc.add_edge("Z", "W", w=0.9, distance_km=10.0)

    with pytest.raises(nx.NetworkXNoPath):
        find_multi_metric_route(g_disc, "X", "Z", alpha=0.5)
