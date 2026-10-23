"""QR-004: Unit and integration tests for routing algorithms.

Verifies:
    1. Shortest-Hop (BFS) routing minimizes edge hop count.
    2. Quality-Aware (Dijkstra) routing maximizes path Werner parameter w_path.
    3. Dijkstra strictly matches exhaustive simple-path enumeration across all node pairs.
    4. Exact reproduction of benchmark divergence cases ('A'->'D' and 'A'->'G') with exact metrics.
    5. Zero-quality link (w=0) handling: quality routing avoids zero-entanglement links,
       and raises NetworkXNoPath when no positive-quality path exists.
    6. Endpoint validation: unknown nodes raise KeyError, identical endpoints raise ValueError.
    7. Disconnected graph handling: raises NetworkXNoPath.
    8. Tie-breaking consistency between equal-quality paths.
    9. Public interface contracts: shortest_hop_path, quality_aware_path, compare_routes, RouteResult.
"""

import math
import pytest
import networkx as nx

from quantumroute.network import create_topology, calculate_path_werner_parameter
from quantumroute.routing import (
    RouteResult,
    find_shortest_hop_route,
    find_quality_aware_route,
    shortest_hop_path,
    quality_aware_path,
    compare_routes,
    exhaustive_quality_route,
)


def test_shortest_hop_minimizes_hops():
    """Verify that find_shortest_hop_route returns the minimal edge hop count."""
    g = create_topology()
    for s in ["A", "B", "C"]:
        for t in ["D", "E", "F", "G"]:
            res = find_shortest_hop_route(g, s, t)
            nx_bfs = nx.shortest_path(g, s, t)
            assert res.num_hops == len(nx_bfs) - 1
            assert len(res.path) == len(nx_bfs)
            assert res.strategy == "shortest_hop"


def test_quality_aware_maximizes_werner_parameter():
    """Verify that find_quality_aware_route strictly maximizes path Werner parameter."""
    g = create_topology()
    route_ad = find_quality_aware_route(g, "A", "D")
    route_ag = find_quality_aware_route(g, "A", "G")

    assert route_ad.path == ["A", "B", "E", "D"]
    assert abs(route_ad.werner_parameter - 0.857375) < 1e-12

    assert route_ag.path == ["A", "B", "E", "D", "G"]
    assert abs(route_ag.werner_parameter - 0.754490) < 1e-12


def test_dijkstra_matches_exhaustive_enumeration_on_all_pairs():
    """Exhaustively verify Dijkstra against brute-force enumeration for all 21 pairs."""
    g = create_topology()
    nodes = list(g.nodes())

    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            s, t = nodes[i], nodes[j]
            dijkstra_res = find_quality_aware_route(g, s, t)
            brute_path = exhaustive_quality_route(g, s, t)

            dijkstra_w = dijkstra_res.werner_parameter
            brute_w = calculate_path_werner_parameter(g, brute_path)

            assert abs(dijkstra_w - brute_w) < 1e-12, (
                f"Dijkstra w={dijkstra_w} != Brute w={brute_w} for {s} -> {t}"
            )


def test_benchmark_routing_divergence_pair_ad():
    """Verify exact reproduction of benchmark divergence case: 'A' to 'D'."""
    g = create_topology()
    comparison = compare_routes(g, "A", "D")

    bfs_route = comparison["shortest_hop"]
    dijkstra_route = comparison["quality_aware"]

    # 1. Paths diverge
    assert bfs_route.path == ["A", "C", "D"]
    assert dijkstra_route.path == ["A", "B", "E", "D"]

    # 2. Hop counts
    assert bfs_route.num_hops == 2
    assert dijkstra_route.num_hops == 3
    assert bfs_route.num_hops < dijkstra_route.num_hops

    # 3. Werner parameters: Dijkstra is higher (0.8574 > 0.4900)
    assert abs(bfs_route.werner_parameter - 0.490000) < 1e-12
    assert abs(dijkstra_route.werner_parameter - 0.857375) < 1e-12
    assert dijkstra_route.werner_parameter > bfs_route.werner_parameter

    # 4. Bell fidelities
    expected_fe_bfs = (1.0 + 3.0 * 0.490000) / 4.0  # 0.6175
    expected_fe_dijkstra = (1.0 + 3.0 * 0.857375) / 4.0  # 0.89303125
    assert abs(bfs_route.bell_fidelity - expected_fe_bfs) < 1e-12
    assert abs(dijkstra_route.bell_fidelity - expected_fe_dijkstra) < 1e-12

    # 5. Average teleportation fidelities
    expected_ftel_bfs = (2.0 * expected_fe_bfs + 1.0) / 3.0  # 0.7450
    expected_ftel_dijkstra = (2.0 * expected_fe_dijkstra + 1.0) / 3.0  # 0.9286875
    assert abs(bfs_route.average_teleportation_fidelity - expected_ftel_bfs) < 1e-12
    assert abs(dijkstra_route.average_teleportation_fidelity - expected_ftel_dijkstra) < 1e-12


def test_benchmark_routing_divergence_pair_ag():
    """Verify exact reproduction of benchmark divergence case: 'A' to 'G'."""
    g = create_topology()
    comparison = compare_routes(g, "A", "G")

    bfs_route = comparison["shortest_hop"]
    dijkstra_route = comparison["quality_aware"]

    # 1. Paths diverge
    assert bfs_route.path == ["A", "C", "D", "G"]
    assert dijkstra_route.path == ["A", "B", "E", "D", "G"]

    # 2. Hop counts
    assert bfs_route.num_hops == 3
    assert dijkstra_route.num_hops == 4
    assert bfs_route.num_hops < dijkstra_route.num_hops

    # 3. Werner parameters: Dijkstra is higher (0.7545 > 0.4312)
    assert abs(bfs_route.werner_parameter - 0.431200) < 1e-12
    assert abs(dijkstra_route.werner_parameter - 0.754490) < 1e-12
    assert dijkstra_route.werner_parameter > bfs_route.werner_parameter

    # 4. Bell fidelities
    expected_fe_bfs = (1.0 + 3.0 * 0.431200) / 4.0  # 0.5734
    expected_fe_dijkstra = (1.0 + 3.0 * 0.754490) / 4.0  # 0.8158675
    assert abs(bfs_route.bell_fidelity - expected_fe_bfs) < 1e-12
    assert abs(dijkstra_route.bell_fidelity - expected_fe_dijkstra) < 1e-12

    # 5. Average teleportation fidelities
    expected_ftel_bfs = (2.0 * expected_fe_bfs + 1.0) / 3.0  # 0.7156
    expected_ftel_dijkstra = (2.0 * expected_fe_dijkstra + 1.0) / 3.0  # 0.877245
    assert abs(bfs_route.average_teleportation_fidelity - expected_ftel_bfs) < 1e-12
    assert abs(dijkstra_route.average_teleportation_fidelity - expected_ftel_dijkstra) < 1e-12


def test_zero_quality_link_handling():
    """Verify that w=0 links are handled safely without math errors and excluded from quality routes."""
    # Graph with:
    # Path 1: N1 --(w=0.0)--> N2 (1 hop, zero entanglement)
    # Path 2: N1 --(w=0.9)--> N3 --(w=0.9)--> N2 (2 hops, positive entanglement w=0.81)
    g = nx.Graph()
    g.add_edge("N1", "N2", w=0.0)
    g.add_edge("N1", "N3", w=0.9)
    g.add_edge("N3", "N2", w=0.9)

    # BFS selects 1-hop path with w=0
    route_bfs = find_shortest_hop_route(g, "N1", "N2")
    assert route_bfs.path == ["N1", "N2"]
    assert route_bfs.num_hops == 1
    assert route_bfs.werner_parameter == 0.0
    assert route_bfs.bell_fidelity == 0.25
    assert route_bfs.average_teleportation_fidelity == 0.50
    assert math.isinf(route_bfs.cost)

    # Dijkstra skips the w=0 link and finds the positive-quality 2-hop path
    route_dijkstra = find_quality_aware_route(g, "N1", "N2")
    assert route_dijkstra.path == ["N1", "N3", "N2"]
    assert route_dijkstra.num_hops == 2
    assert abs(route_dijkstra.werner_parameter - 0.81) < 1e-12
    assert route_dijkstra.bell_fidelity == (1.0 + 3.0 * 0.81) / 4.0

    # If EVERY path between endpoints has w=0:
    g_all_zero = nx.Graph()
    g_all_zero.add_edge("X1", "X2", w=0.0)
    g_all_zero.add_edge("X2", "X3", w=0.0)

    # Quality routing raises NetworkXNoPath because no usable route exists
    with pytest.raises(nx.NetworkXNoPath, match="No usable quantum path"):
        find_quality_aware_route(g_all_zero, "X1", "X3")


def test_endpoint_validation_and_errors():
    """Verify validation for unknown nodes, identical endpoints, and non-graphs."""
    g = create_topology()

    # Identical source and target raises ValueError
    with pytest.raises(ValueError, match="Source and target nodes must be distinct"):
        find_shortest_hop_route(g, "A", "A")
    with pytest.raises(ValueError, match="Source and target nodes must be distinct"):
        find_quality_aware_route(g, "B", "B")

    # Unknown source node raises KeyError
    with pytest.raises(KeyError, match="Source node 'UNKNOWN' does not exist"):
        find_shortest_hop_route(g, "UNKNOWN", "A")
    with pytest.raises(KeyError, match="Source node 'UNKNOWN' does not exist"):
        find_quality_aware_route(g, "UNKNOWN", "A")

    # Unknown target node raises KeyError
    with pytest.raises(KeyError, match="Target node 'UNKNOWN' does not exist"):
        find_shortest_hop_route(g, "A", "UNKNOWN")
    with pytest.raises(KeyError, match="Target node 'UNKNOWN' does not exist"):
        find_quality_aware_route(g, "A", "UNKNOWN")

    # Non-NetworkX graph raises TypeError
    with pytest.raises(TypeError, match="Expected a networkx.Graph"):
        find_shortest_hop_route("not_a_graph", "A", "B")  # type: ignore
    with pytest.raises(TypeError, match="Expected a networkx.Graph"):
        find_quality_aware_route("not_a_graph", "A", "B")  # type: ignore


def test_disconnected_graph_handling():
    """Verify that disconnected components raise NetworkXNoPath."""
    g_disconnected = nx.Graph()
    g_disconnected.add_edge("A", "B", w=0.9)
    g_disconnected.add_edge("C", "D", w=0.9)

    with pytest.raises(nx.NetworkXNoPath, match="No route exists"):
        find_shortest_hop_route(g_disconnected, "A", "D")

    with pytest.raises(nx.NetworkXNoPath, match="No usable quantum path"):
        find_quality_aware_route(g_disconnected, "A", "D")


def test_tie_breaking_behavior():
    """Verify deterministic routing behavior when candidate paths have identical quality."""
    g_symmetric = nx.Graph()
    # Two symmetric paths of equal quality and hop count
    g_symmetric.add_edge("S", "X1", w=0.8)
    g_symmetric.add_edge("X1", "T", w=0.8)
    g_symmetric.add_edge("S", "X2", w=0.8)
    g_symmetric.add_edge("X2", "T", w=0.8)

    route = find_quality_aware_route(g_symmetric, "S", "T")
    assert route.num_hops == 2
    assert abs(route.werner_parameter - 0.64) < 1e-12
    assert route.path in [["S", "X1", "T"], ["S", "X2", "T"]]


def test_public_interface_contracts():
    """Verify public convenience functions and RouteResult container behavior."""
    g = create_topology()

    # shortest_hop_path returns list
    path_bfs = shortest_hop_path(g, "A", "D")
    assert isinstance(path_bfs, list)
    assert path_bfs == ["A", "C", "D"]

    # quality_aware_path returns list
    path_dijkstra = quality_aware_path(g, "A", "D")
    assert isinstance(path_dijkstra, list)
    assert path_dijkstra == ["A", "B", "E", "D"]

    # RouteResult container duck typing
    route = find_quality_aware_route(g, "A", "D")
    assert len(route) == 4
    assert route[0] == "A"
    assert route[-1] == "D"
    assert [node for node in route] == ["A", "B", "E", "D"]

    # compare_routes returns structured dictionary
    comp = compare_routes(g, "A", "D")
    assert "shortest_hop" in comp
    assert "quality_aware" in comp
    assert isinstance(comp["shortest_hop"], RouteResult)
    assert isinstance(comp["quality_aware"], RouteResult)
