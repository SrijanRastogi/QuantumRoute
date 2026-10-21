"""QR-003: Unit and integration tests for quantum network model and Werner link mechanics.

Verifies:
    1. Werner parameter validation bounds [0.0, 1.0] and type safety.
    2. Bell-state fidelity formula F_e = (1 + 3*w) / 4 and boundary cases (w=1 -> 1.0, w=0 -> 0.25).
    3. Average teleportation fidelity formula F_tel,avg = (2*F_e + 1) / 3.
    4. Path Werner parameter product rule w_path = prod(w_e).
    5. Scientific invariant: Werner parameters multiply, NOT Bell-state fidelities.
    6. PathMetrics data structure consistency.
    7. Standard 7-node benchmark topology structure and edge attributes.
    8. Path calculations on NetworkX graph with independent direct verification.
    9. Edge cases: non-existent nodes, missing links, invalid path lengths, and zero-quality links.
    10. Topology separation precondition: Shortest-Hop (BFS) vs. Quality-Aware (Dijkstra) route divergence.
"""

import math
import pytest
import networkx as nx

from quantumroute.network import (
    PathMetrics,
    validate_werner_parameter,
    bell_state_fidelity,
    calculate_predicted_path_fidelity,
    calculate_average_teleportation_fidelity,
    path_parameter,
    path_metrics,
    calculate_path_werner_parameter,
    calculate_path_metrics,
    create_topology,
)


def test_werner_parameter_bounds_and_types():
    """Verify that Werner parameters are restricted strictly to real numbers in [0.0, 1.0]."""
    # Valid boundaries and interior
    assert validate_werner_parameter(0.0) == 0.0
    assert validate_werner_parameter(1.0) == 1.0
    assert validate_werner_parameter(0.5) == 0.5
    assert validate_werner_parameter(1) == 1.0
    assert validate_werner_parameter(0) == 0.0

    # Out of range values raise ValueError
    for invalid_w in [-0.001, -1.0, 1.001, 2.5]:
        with pytest.raises(ValueError, match="must be in"):
            validate_werner_parameter(invalid_w)
        with pytest.raises(ValueError, match="must be in"):
            bell_state_fidelity(invalid_w)

    # Boolean or non-numeric types raise TypeError
    for bad_type in [True, False, "0.8", None, [0.5]]:
        with pytest.raises(TypeError, match="must be a real number"):
            validate_werner_parameter(bad_type)  # type: ignore
        with pytest.raises(TypeError, match="must be a real number"):
            bell_state_fidelity(bad_type)  # type: ignore


def test_bell_state_fidelity_boundary_values():
    """Verify Bell-state fidelity formula against theoretical boundaries and direct manual calculation."""
    # Boundary 1: Pure Bell pair (w = 1.0) -> F_e = 1.0
    assert abs(bell_state_fidelity(1.0) - 1.0) < 1e-12

    # Boundary 2: Completely mixed state I_4 / 4 (w = 0.0) -> F_e = 0.25
    assert abs(bell_state_fidelity(0.0) - 0.25) < 1e-12

    # Classical threshold crossover condition:
    # When w = 1/3, F_e = (1 + 3*(1/3)) / 4 = 2/4 = 0.50
    assert abs(bell_state_fidelity(1.0 / 3.0) - 0.50) < 1e-12

    # Direct independent arithmetic check across a grid of points
    grid_w = [0.1, 0.25, 0.5, 0.75, 0.9, 0.99]
    for w in grid_w:
        # Independent manual calculation: 0.25 + 0.75 * w
        expected = 0.25 + 0.75 * w
        computed = bell_state_fidelity(w)
        assert abs(computed - expected) < 1e-12
        assert calculate_predicted_path_fidelity(w) == computed


def test_average_teleportation_fidelity_formula():
    """Verify average teleportation fidelity formula F_tel,avg = (2*F_e + 1) / 3."""
    # Ideal Bell pair: F_e = 1.0 -> F_tel,avg = 1.0
    assert abs(calculate_average_teleportation_fidelity(1.0) - 1.0) < 1e-12

    # Threshold Bell fidelity: F_e = 0.50 -> F_tel,avg = 2/3 (~0.6667)
    assert abs(calculate_average_teleportation_fidelity(0.50) - (2.0 / 3.0)) < 1e-12

    # Completely mixed link: F_e = 0.25 -> F_tel,avg = (2*0.25 + 1)/3 = 1.5/3 = 0.50
    assert abs(calculate_average_teleportation_fidelity(0.25) - 0.50) < 1e-12

    # Out of range fidelity values raise ValueError
    for bad_f in [0.24, 0.0, -0.5, 1.01, 1.5]:
        with pytest.raises(ValueError, match="must be in"):
            calculate_average_teleportation_fidelity(bad_f)

    # Boolean or non-numeric types raise TypeError
    for bad_type in [True, False, "0.9", None]:
        with pytest.raises(TypeError, match="must be a real number"):
            calculate_average_teleportation_fidelity(bad_type)  # type: ignore


def test_path_werner_parameter_multiplication():
    """Verify path Werner parameter evaluation w_path = prod(w_e)."""
    # Single link
    assert abs(path_parameter([0.85]) - 0.85) < 1e-12

    # Multi-link chain verified against math.prod
    test_links = [0.95, 0.90, 0.85, 0.80]
    expected_prod = math.prod(test_links)
    computed_prod = path_parameter(test_links)
    assert abs(computed_prod - expected_prod) < 1e-12

    # Path containing a completely depolarized link (w = 0.0) yields w_path = 0.0
    assert path_parameter([0.9, 0.0, 0.8]) == 0.0

    # All ideal links yields w_path = 1.0
    assert path_parameter([1.0, 1.0, 1.0]) == 1.0

    # Empty list raises ValueError
    with pytest.raises(ValueError, match="empty sequence"):
        path_parameter([])

    # Invalid parameter inside sequence raises ValueError
    with pytest.raises(ValueError, match="must be in"):
        path_parameter([0.9, -0.1, 0.8])


def test_forbidden_fidelity_multiplication_invariant():
    """Verify that multiplying Bell fidelities directly is scientifically invalid.

    Scientific Proof:
        Let w_1 = 0.80, w_2 = 0.70.
        True Werner composition: w_path = 0.80 * 0.70 = 0.56.
        True Bell fidelity: F_e,path = (1 + 3 * 0.56) / 4 = 0.67000.

        Invalid fidelity product:
        F_e1 = (1 + 3 * 0.80) / 4 = 0.85.
        F_e2 = (1 + 3 * 0.70) / 4 = 0.775.
        F_e1 * F_e2 = 0.85 * 0.775 = 0.65875.

        Discrepancy: |0.67000 - 0.65875| = 0.01125 > 1.1%.
    """
    w1, w2 = 0.80, 0.70
    w_path = path_parameter([w1, w2])
    true_path_fidelity = calculate_predicted_path_fidelity(w_path)

    fe1 = bell_state_fidelity(w1)
    fe2 = bell_state_fidelity(w2)
    invalid_fidelity_product = fe1 * fe2

    discrepancy = abs(true_path_fidelity - invalid_fidelity_product)
    assert discrepancy > 0.01, f"Expected noticeable discrepancy, got {discrepancy}"
    assert abs(true_path_fidelity - 0.67) < 1e-12
    assert abs(invalid_fidelity_product - 0.65875) < 1e-12


def test_path_metrics_dataclass():
    """Verify PathMetrics fields, values, and immutability."""
    links = [0.90, 0.80]
    metrics = path_metrics(links)

    assert isinstance(metrics, PathMetrics)
    assert metrics.num_hops == 2
    assert abs(metrics.werner_parameter - 0.72) < 1e-12
    # F_e = (1 + 3*0.72) / 4 = 3.16 / 4 = 0.79
    assert abs(metrics.bell_fidelity - 0.79) < 1e-12
    # F_tel,avg = (2*0.79 + 1) / 3 = 2.58 / 3 = 0.86
    assert abs(metrics.average_teleportation_fidelity - 0.86) < 1e-12

    # Dataclass is frozen (immutable)
    with pytest.raises(Exception):
        metrics.num_hops = 3  # type: ignore


def test_graph_topology_integrity():
    """Verify standard 7-node benchmark network topology structure and attributes."""
    g = create_topology()

    assert isinstance(g, nx.Graph)
    assert not g.is_directed()

    # Must contain 7 nodes: 'A' through 'G'
    expected_nodes = {"A", "B", "C", "D", "E", "F", "G"}
    assert set(g.nodes()) == expected_nodes
    assert g.number_of_nodes() == 7
    assert g.number_of_edges() == 9

    # Check each edge attribute validity
    for u, v, data in g.edges(data=True):
        assert "w" in data, f"Edge ({u}, {v}) missing 'w'"
        assert "weight" in data, f"Edge ({u}, {v}) missing 'weight'"
        assert "bell_fidelity" in data, f"Edge ({u}, {v}) missing 'bell_fidelity'"

        w = data["w"]
        assert 0.0 < w <= 1.0
        # weight must equal -ln(w)
        expected_weight = -math.log(w)
        assert abs(data["weight"] - expected_weight) < 1e-12
        # bell_fidelity must equal (1 + 3w)/4
        expected_fe = (1.0 + 3.0 * w) / 4.0
        assert abs(data["bell_fidelity"] - expected_fe) < 1e-12


def test_calculate_path_werner_parameter_on_graph():
    """Verify path Werner calculations on NetworkX graph against independent direct products."""
    g = create_topology()

    # Path 1: A -> C -> D (2 hops)
    w_acd = calculate_path_werner_parameter(g, ["A", "C", "D"])
    expected_acd = 0.70 * 0.70  # 0.49
    assert abs(w_acd - expected_acd) < 1e-12

    # Path 2: A -> B -> E -> D (3 hops)
    w_abed = calculate_path_werner_parameter(g, ["A", "B", "E", "D"])
    expected_abed = 0.95 * 0.95 * 0.95  # 0.857375
    assert abs(w_abed - expected_abed) < 1e-12

    # Calculate PathMetrics on graph
    metrics_abed = calculate_path_metrics(g, ["A", "B", "E", "D"])
    assert metrics_abed.num_hops == 3
    assert abs(metrics_abed.werner_parameter - expected_abed) < 1e-12
    expected_fe = (1.0 + 3.0 * expected_abed) / 4.0
    assert abs(metrics_abed.bell_fidelity - expected_fe) < 1e-12


def test_path_validation_error_handling():
    """Verify robust error handling for invalid graph inputs, node errors, and disconnected paths."""
    g = create_topology()

    # Path with fewer than 2 nodes raises ValueError
    with pytest.raises(ValueError, match="at least 2 nodes"):
        calculate_path_werner_parameter(g, ["A"])
    with pytest.raises(ValueError, match="at least 2 nodes"):
        calculate_path_metrics(g, [])

    # Unknown node raises KeyError
    with pytest.raises(KeyError, match="does not exist in the network"):
        calculate_path_werner_parameter(g, ["A", "Z"])
    with pytest.raises(KeyError, match="does not exist in the network"):
        calculate_path_metrics(g, ["X", "B"])

    # Disconnected nodes (no edge) raises ValueError
    with pytest.raises(ValueError, match="No direct link exists"):
        calculate_path_werner_parameter(g, ["A", "D"])  # 'A' and 'D' have no direct edge
    with pytest.raises(ValueError, match="No direct link exists"):
        calculate_path_metrics(g, ["A", "G"])

    # Non-NetworkX object raises TypeError
    with pytest.raises(TypeError, match="Expected a networkx.Graph"):
        calculate_path_werner_parameter("not_a_graph", ["A", "B"])  # type: ignore

    # Edge missing 'w' attribute raises KeyError
    bad_graph = nx.Graph()
    bad_graph.add_edge("N1", "N2")  # no 'w'
    with pytest.raises(KeyError, match="missing required Werner parameter"):
        calculate_path_werner_parameter(bad_graph, ["N1", "N2"])


def test_topology_routing_divergence_precondition():
    """Verify that benchmark topology possesses distinct pairs where Shortest-Hop (BFS)

    and Quality-Aware (Dijkstra) paths diverge.

    This ensures that the topology prepared in QR-003 satisfies the invariant needed by QR-004.
    """
    g = create_topology()

    # Pair 1: Source 'A', Target 'D'
    bfs_ad = nx.shortest_path(g, "A", "D")  # Unweighted = BFS shortest hops
    dijkstra_ad = nx.shortest_path(g, "A", "D", weight="weight")  # Quality-aware

    assert bfs_ad == ["A", "C", "D"], f"Expected ['A', 'C', 'D'], got {bfs_ad}"
    assert dijkstra_ad == ["A", "B", "E", "D"], f"Expected ['A', 'B', 'E', 'D'], got {dijkstra_ad}"

    metrics_bfs_ad = calculate_path_metrics(g, bfs_ad)
    metrics_dijkstra_ad = calculate_path_metrics(g, dijkstra_ad)

    # BFS has fewer hops (2 < 3)
    assert metrics_bfs_ad.num_hops < metrics_dijkstra_ad.num_hops
    # But Dijkstra has significantly higher quality (w: 0.857 > 0.490, Fe: 0.893 > 0.618)
    assert metrics_dijkstra_ad.werner_parameter > metrics_bfs_ad.werner_parameter
    assert metrics_dijkstra_ad.bell_fidelity > metrics_bfs_ad.bell_fidelity

    # Pair 2: Source 'A', Target 'G'
    bfs_ag = nx.shortest_path(g, "A", "G")
    dijkstra_ag = nx.shortest_path(g, "A", "G", weight="weight")

    assert bfs_ag == ["A", "C", "D", "G"]
    assert dijkstra_ag == ["A", "B", "E", "D", "G"]

    metrics_bfs_ag = calculate_path_metrics(g, bfs_ag)
    metrics_dijkstra_ag = calculate_path_metrics(g, dijkstra_ag)

    assert metrics_bfs_ag.num_hops < metrics_dijkstra_ag.num_hops
    assert metrics_dijkstra_ag.werner_parameter > metrics_bfs_ag.werner_parameter
    assert metrics_dijkstra_ag.bell_fidelity > metrics_bfs_ag.bell_fidelity
