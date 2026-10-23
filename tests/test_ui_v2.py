"""Automated tests for QuantumRoute UI V2 adapters, topologies, and graph rendering."""

import pytest
import networkx as nx
import plotly.graph_objects as go

from quantumroute.ui_v2.topologies import (
    create_generic_mesh_topology,
    create_generic_star_topology,
    create_generic_ring_topology,
    create_generic_grid_topology,
    get_topology,
    TOPOLOGY_PRESETS,
    DEFAULT_TOPOLOGY_KEY,
)
from quantumroute.ui_v2.network_view import render_network_graph
from quantumroute.routing import (
    find_shortest_hop_route,
    find_quality_aware_route,
    find_multi_metric_route,
)


def test_topology_presets_inventory():
    """Verify that all declared topology presets can be constructed."""
    assert DEFAULT_TOPOLOGY_KEY in TOPOLOGY_PRESETS
    for name, factory in TOPOLOGY_PRESETS.items():
        g = factory()
        assert isinstance(g, nx.Graph)
        assert len(g.nodes) >= 6
        assert len(g.edges) >= 5


def test_generic_mesh_topology_properties_and_routes():
    """Verify the default generic 6-node mesh network and routing characteristics."""
    g = create_generic_mesh_topology()

    # Node validation
    expected_nodes = {"Alice", "Bob", "Repeater A", "Repeater B", "Repeater C", "Repeater D"}
    assert set(g.nodes) == expected_nodes

    # Check positions and attributes
    for node, data in g.nodes(data=True):
        assert "pos" in data
        assert len(data["pos"]) == 2

    # Verify edge attributes
    for u, v, data in g.edges(data=True):
        assert "w" in data
        assert 0.0 < data["w"] <= 1.0
        assert "distance_km" in data
        assert data["distance_km"] > 0.0
        assert "bell_fidelity" in data

    # Route verification between Alice and Bob
    # 1. Shortest-Hop (BFS) must select the 2-hop route via Repeater B
    bfs_res = find_shortest_hop_route(g, "Alice", "Bob")
    assert bfs_res.num_hops == 2
    assert bfs_res.path == ["Alice", "Repeater B", "Bob"]
    assert abs(bfs_res.werner_parameter - 0.4900) < 1e-4
    assert abs(bfs_res.bell_fidelity - 0.6175) < 1e-4

    # 2. Quality-Aware (Dijkstra) must select the 3-hop high-fidelity route via Repeaters A and D
    dijk_res = find_quality_aware_route(g, "Alice", "Bob")
    assert dijk_res.num_hops == 3
    assert dijk_res.path == ["Alice", "Repeater A", "Repeater D", "Bob"]
    assert abs(dijk_res.werner_parameter - 0.857375) < 1e-4
    assert abs(dijk_res.bell_fidelity - 0.89303125) < 1e-4
    assert abs(dijk_res.average_teleportation_fidelity - 0.9286875) < 1e-4

    # 3. Multi-Metric Route with balanced alpha
    multi_res = find_multi_metric_route(g, "Alice", "Bob", alpha=0.35)
    assert multi_res.num_hops >= 2
    assert multi_res.werner_parameter > 0.70


def test_generic_star_ring_grid_connectivity():
    """Verify that Alice and Bob are connected in all generic presets."""
    for key in ["Star Network (6 nodes · 6 links)", "Ring Network (6 nodes · 6 links)", "Grid Network (2x3 · 7 links)"]:
        g = get_topology(key)
        assert nx.has_path(g, "Alice", "Bob")
        bfs_res = find_shortest_hop_route(g, "Alice", "Bob")
        assert bfs_res.num_hops >= 1
        dijk_res = find_quality_aware_route(g, "Alice", "Bob")
        assert dijk_res.werner_parameter > 0.0


def test_render_network_graph():
    """Verify that Plotly graph is constructed cleanly without errors."""
    g = create_generic_mesh_topology()
    route = find_quality_aware_route(g, "Alice", "Bob")

    fig = render_network_graph(
        graph=g,
        selected_path=route.path,
        source="Alice",
        target="Bob",
        strategy_label="Quality-Aware (Dijkstra)",
    )

    assert isinstance(fig, go.Figure)
    # Check that traces exist (edges, glow, active, nodes, legends)
    assert len(fig.data) >= 4
