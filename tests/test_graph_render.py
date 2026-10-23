"""Tests for dashboard network graph rendering (QR-014 regression test)."""

import networkx as nx
import plotly.graph_objects as go
import pytest

from quantumroute.network import (
    create_topology,
    create_karnataka_topology,
    create_ring_topology,
    create_star_topology,
    create_grid_topology,
)
from quantumroute.app import (
    get_topology_node_positions,
    render_network_graph,
)


@pytest.mark.parametrize(
    "topo_name, graph_factory",
    [
        ("Karnataka Quantum Backbone", create_karnataka_topology),
        ("7-Node Benchmark Topology", create_topology),
        ("Parametric Ring Network", lambda: create_ring_topology(6)),
        ("Parametric Star Network", lambda: create_star_topology(5)),
        ("Parametric Grid Network", lambda: create_grid_topology(2, 3)),
    ],
)
def test_render_network_graph_all_topologies(topo_name, graph_factory):
    """Verify that all five topologies produce valid, non-empty Plotly figures with clean layouts."""
    g = graph_factory()
    pos = get_topology_node_positions(g, topo_name)

    # Check that positions dictionary covers all nodes
    for n in g.nodes:
        assert n in pos
        x, y = pos[n]
        assert isinstance(x, (int, float))
        assert isinstance(y, (int, float))

    # Render figure without routes
    fig = render_network_graph(g, topo_name=topo_name, title=f"Test {topo_name}")
    assert isinstance(fig, go.Figure)
    assert len(fig.data) >= 2  # Has at least base links and nodes
    assert fig.layout.showlegend is True
    assert fig.layout.plot_bgcolor == "#070D1E"


def test_render_network_graph_with_route_and_terminal_highlighting():
    """Verify that routes, source node, and destination node are visually distinguished."""
    g = create_karnataka_topology()
    src = "Belagavi"
    dst = "Bengaluru"
    path = ["Belagavi", "Hubballi", "Davanagere", "Tumakuru", "Bengaluru"]

    fig = render_network_graph(
        g,
        topo_name="Karnataka Quantum Backbone",
        highlighted_paths={"Quality-Aware": (path, "#10B981")},
        source_node=src,
        target_node=dst,
        title="Karnataka Route Test",
        height=360,
    )

    trace_names = [t.name for t in fig.data if t.name]
    assert "Available Fiber Link" in trace_names
    assert "Selected Route (Quality-Aware)" in trace_names
    assert "Quantum Repeater Node" in trace_names
    assert "Alice (Source)" in trace_names
    assert "Bob (Destination)" in trace_names


def test_render_network_graph_fallback_layout():
    """Verify that arbitrary unlisted graphs fall back gracefully to spring layout."""
    g = nx.cycle_graph(5)
    fig = render_network_graph(g, topo_name="Arbitrary Custom Graph")
    assert isinstance(fig, go.Figure)
    assert len(fig.data) >= 2
