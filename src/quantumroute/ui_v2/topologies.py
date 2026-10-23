"""Generic quantum network topology presets for QuantumRoute UI V2.

In accordance with PHASE 4:
- The default experience uses generic node labels (Alice, Bob, Repeater A, Repeater B, etc.).
- Default topology contains a valid path between Alice and Bob.
- Geographic topologies (Karnataka Regional Backbone) are retained strictly as optional presets.
"""

from __future__ import annotations

import math
from typing import Any
import networkx as nx

from quantumroute.network import (
    validate_werner_parameter,
    bell_state_fidelity,
    create_karnataka_topology,
)


def create_generic_mesh_topology() -> nx.Graph:
    """Construct the default generic 6-node quantum mesh network.

    Features Alice (source), Bob (destination), and 4 intermediate repeaters:
        - Repeater A, Repeater B, Repeater C, Repeater D

    Provides clear distinction between:
        - Shortest-Hop (BFS): Alice -> Repeater B -> Bob (2 hops, 420 km, w = 0.4900)
        - Quality-Aware (Dijkstra): Alice -> Repeater A -> Repeater D -> Bob (3 hops, 510 km, w = 0.8574)
        - Multi-Metric (Pareto): Alice -> Repeater A -> Repeater C -> Bob (3 hops, 490 km, w = 0.8216)
    """
    g = nx.Graph(name="generic_quantum_mesh_6node")

    # Deterministic 2D coordinates for stable canvas visualization
    nodes = {
        "Alice": {"pos": (50.0, 320.0), "type": "endpoint", "role": "source"},
        "Repeater A": {"pos": (170.0, 360.0), "type": "repeater", "role": "relay"},
        "Repeater B": {"pos": (140.0, 150.0), "type": "repeater", "role": "relay"},
        "Repeater C": {"pos": (310.0, 130.0), "type": "repeater", "role": "relay"},
        "Repeater D": {"pos": (300.0, 340.0), "type": "repeater", "role": "relay"},
        "Bob": {"pos": (440.0, 310.0), "type": "endpoint", "role": "destination"},
    }

    for node, attrs in nodes.items():
        g.add_node(node, **attrs)

    # (u, v, distance_km, werner_w)
    edges = [
        ("Alice", "Repeater A", 120.0, 0.95),
        ("Repeater A", "Repeater D", 180.0, 0.95),
        ("Repeater D", "Bob", 210.0, 0.95),
        ("Alice", "Repeater B", 180.0, 0.70),
        ("Repeater B", "Bob", 240.0, 0.70),
        ("Repeater A", "Repeater B", 110.0, 0.60),
        ("Repeater A", "Repeater C", 160.0, 0.92),
        ("Repeater C", "Bob", 210.0, 0.94),
        ("Repeater C", "Repeater D", 120.0, 0.88),
        ("Repeater B", "Repeater C", 130.0, 0.85),
    ]

    for u, v, dist_km, w in edges:
        w_val = validate_werner_parameter(w)
        fe = bell_state_fidelity(w_val)
        weight = -math.log(w_val) if w_val > 0.0 else float("inf")
        delay_ms = dist_km * 0.005  # 5.0 µs/km
        g.add_edge(
            u,
            v,
            w=w_val,
            werner_parameter=w_val,
            distance_km=float(dist_km),
            delay_ms=float(delay_ms),
            weight=weight,
            bell_fidelity=fe,
        )

    return g


def create_generic_star_topology() -> nx.Graph:
    """Construct a generic Star quantum network with central hub."""
    g = nx.Graph(name="generic_quantum_star_6node")

    nodes = {
        "Alice": {"pos": (60.0, 300.0), "type": "endpoint", "role": "source"},
        "Repeater A": {"pos": (250.0, 250.0), "type": "hub", "role": "hub"},
        "Repeater B": {"pos": (130.0, 120.0), "type": "repeater", "role": "relay"},
        "Repeater C": {"pos": (370.0, 120.0), "type": "repeater", "role": "relay"},
        "Repeater D": {"pos": (250.0, 390.0), "type": "repeater", "role": "relay"},
        "Bob": {"pos": (440.0, 300.0), "type": "endpoint", "role": "destination"},
    }

    for node, attrs in nodes.items():
        g.add_node(node, **attrs)

    # All spokes connect to Repeater A (Hub)
    spokes = [
        ("Alice", 100.0, 0.95),
        ("Bob", 120.0, 0.94),
        ("Repeater B", 80.0, 0.90),
        ("Repeater C", 80.0, 0.91),
        ("Repeater D", 90.0, 0.93),
    ]

    for spoke, dist_km, w in spokes:
        w_val = validate_werner_parameter(w)
        fe = bell_state_fidelity(w_val)
        weight = -math.log(w_val) if w_val > 0.0 else float("inf")
        delay_ms = dist_km * 0.005
        g.add_edge(
            "Repeater A",
            spoke,
            w=w_val,
            werner_parameter=w_val,
            distance_km=float(dist_km),
            delay_ms=float(delay_ms),
            weight=weight,
            bell_fidelity=fe,
        )

    # Optional cross-link between B and C
    w_bc = 0.88
    dist_bc = 140.0
    g.add_edge(
        "Repeater B",
        "Repeater C",
        w=w_bc,
        werner_parameter=w_bc,
        distance_km=float(dist_bc),
        delay_ms=float(dist_bc * 0.005),
        weight=-math.log(w_bc),
        bell_fidelity=bell_state_fidelity(w_bc),
    )

    return g


def create_generic_ring_topology() -> nx.Graph:
    """Construct a generic Ring quantum network with 6 nodes."""
    g = nx.Graph(name="generic_quantum_ring_6node")

    ring_nodes = [
        ("Alice", (80.0, 250.0), "endpoint", "source"),
        ("Repeater A", (170.0, 370.0), "repeater", "relay"),
        ("Repeater D", (330.0, 370.0), "repeater", "relay"),
        ("Bob", (420.0, 250.0), "endpoint", "destination"),
        ("Repeater C", (330.0, 130.0), "repeater", "relay"),
        ("Repeater B", (170.0, 130.0), "repeater", "relay"),
    ]

    for node, pos, n_type, role in ring_nodes:
        g.add_node(node, pos=pos, type=n_type, role=role)

    ring_order = ["Alice", "Repeater A", "Repeater D", "Bob", "Repeater C", "Repeater B"]
    ring_params = [
        (0.96, 75.0),
        (0.95, 80.0),
        (0.94, 75.0),
        (0.91, 85.0),
        (0.89, 80.0),
        (0.92, 85.0),
    ]

    n = len(ring_order)
    for i in range(n):
        u = ring_order[i]
        v = ring_order[(i + 1) % n]
        w, dist_km = ring_params[i]
        w_val = validate_werner_parameter(w)
        fe = bell_state_fidelity(w_val)
        weight = -math.log(w_val) if w_val > 0.0 else float("inf")
        g.add_edge(
            u,
            v,
            w=w_val,
            werner_parameter=w_val,
            distance_km=float(dist_km),
            delay_ms=float(dist_km * 0.005),
            weight=weight,
            bell_fidelity=fe,
        )

    return g


def create_generic_grid_topology() -> nx.Graph:
    """Construct a generic 2x3 Lattice/Grid quantum repeater network."""
    g = nx.Graph(name="generic_quantum_grid_6node")

    grid_nodes = {
        "Alice": {"pos": (80.0, 330.0), "type": "endpoint", "role": "source"},
        "Repeater A": {"pos": (250.0, 330.0), "type": "repeater", "role": "relay"},
        "Bob": {"pos": (420.0, 330.0), "type": "endpoint", "role": "destination"},
        "Repeater B": {"pos": (80.0, 150.0), "type": "repeater", "role": "relay"},
        "Repeater C": {"pos": (250.0, 150.0), "type": "repeater", "role": "relay"},
        "Repeater D": {"pos": (420.0, 150.0), "type": "repeater", "role": "relay"},
    }

    for node, attrs in grid_nodes.items():
        g.add_node(node, **attrs)

    edges = [
        # Horizontal top
        ("Alice", "Repeater A", 100.0, 0.95),
        ("Repeater A", "Bob", 110.0, 0.94),
        # Horizontal bottom
        ("Repeater B", "Repeater C", 100.0, 0.88),
        ("Repeater C", "Repeater D", 100.0, 0.89),
        # Vertical cross
        ("Alice", "Repeater B", 90.0, 0.91),
        ("Repeater A", "Repeater C", 90.0, 0.93),
        ("Bob", "Repeater D", 90.0, 0.92),
    ]

    for u, v, dist_km, w in edges:
        w_val = validate_werner_parameter(w)
        fe = bell_state_fidelity(w_val)
        weight = -math.log(w_val) if w_val > 0.0 else float("inf")
        g.add_edge(
            u,
            v,
            w=w_val,
            werner_parameter=w_val,
            distance_km=float(dist_km),
            delay_ms=float(dist_km * 0.005),
            weight=weight,
            bell_fidelity=fe,
        )

    return g


TOPOLOGY_PRESETS = {
    "Generic Mesh (6 nodes · 10 links)": create_generic_mesh_topology,
    "Star Network (6 nodes · 6 links)": create_generic_star_topology,
    "Ring Network (6 nodes · 6 links)": create_generic_ring_topology,
    "Grid Network (2x3 · 7 links)": create_generic_grid_topology,
    "Karnataka Regional Backbone (Optional)": create_karnataka_topology,
}

DEFAULT_TOPOLOGY_KEY = "Generic Mesh (6 nodes · 10 links)"


def get_topology(preset_name: str) -> nx.Graph:
    """Retrieve an initialized NetworkX graph for a given preset name."""
    factory = TOPOLOGY_PRESETS.get(preset_name, create_generic_mesh_topology)
    return factory()
