"""Quantum network topology and Werner-state link mechanics.

This module encapsulates the abstract quantum network graph where nodes represent
quantum repeaters or end-nodes, and undirected edges represent distributed entangled Bell pairs
modeled as isotropic Werner states:
    rho_W(w) = w * |Phi+><Phi+| + (1 - w) * (I_4 / 4),  w in [0.0, 1.0]

Under the declared MVP model assumptions (Werner-form links, ideal swapping, ideal feedforward,
and no quantum memory decoherence):
    - Link Bell-state fidelity:
        F_e = (1 + 3 * w) / 4
    - Multi-hop path parameter product rule:
        w_path = prod_{e in path} w_e
    - Path Bell-state fidelity:
        F_e,path = (1 + 3 * w_path) / 4
    - Path average single-qubit teleportation fidelity:
        F_tel,avg = (2 * F_e,path + 1) / 3 = (1 + w_path) / 2

CRITICAL SCIENTIFIC INVARIANT:
    Path composition multiplies Werner parameters (w_path = prod w_e), NOT Bell-state
    fidelities (prod F_e). Directly multiplying fidelities is mathematically and
    physically invalid.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Sequence, Any, Hashable
import networkx as nx


@dataclass(frozen=True)
class PathMetrics:
    """Metrics evaluated for an end-to-end multi-hop quantum path.

    Attributes:
        werner_parameter: End-to-end path Werner parameter w_path = prod(w_e) in [0.0, 1.0].
        bell_fidelity: End-to-end Bell-state fidelity F_e,path = (1 + 3*w_path) / 4 in [0.25, 1.0].
        average_teleportation_fidelity: Average single-qubit teleportation fidelity F_tel,avg in [0.5, 1.0].
        num_hops: Number of edge hops along the path.
        total_distance_km: Cumulative physical optical fiber distance along the path in km.
        total_delay_ms: Cumulative classical propagation latency along the path in milliseconds.
    """
    werner_parameter: float
    bell_fidelity: float
    average_teleportation_fidelity: float
    num_hops: int
    total_distance_km: float = 0.0
    total_delay_ms: float = 0.0


def validate_werner_parameter(w: float) -> float:
    """Validate that a Werner parameter w is a real number in [0.0, 1.0].

    Args:
        w: Link Werner parameter candidate.

    Returns:
        Validated float value.

    Raises:
        TypeError: If w is a boolean or not a real number.
        ValueError: If w is outside [0.0, 1.0].
    """
    if isinstance(w, bool) or not isinstance(w, (int, float)):
        raise TypeError(
            f"Werner parameter w must be a real number, got {type(w).__name__}."
        )
    w_float = float(w)
    if not (0.0 <= w_float <= 1.0):
        raise ValueError(
            f"Werner parameter w must be in [0.0, 1.0], but got {w_float}."
        )
    return w_float


def bell_state_fidelity(w: float) -> float:
    """Calculate the Bell-state fidelity of an isotropic Werner state relative to |Phi+>.

    Formula:
        F_e = (1 + 3 * w) / 4

    Boundary cases:
        w = 1.0 -> F_e = 1.0 (pure Bell pair |Phi+>)
        w = 0.0 -> F_e = 0.25 (completely mixed two-qubit state I_4 / 4)

    Args:
        w: Link Werner parameter in [0.0, 1.0].

    Returns:
        Bell-state fidelity in [0.25, 1.0].
    """
    w_val = validate_werner_parameter(w)
    return (1.0 + 3.0 * w_val) / 4.0


def calculate_predicted_path_fidelity(w_path: float) -> float:
    """Calculate the predicted end-to-end Bell fidelity for a path Werner parameter.

    Alias/equivalent to bell_state_fidelity(w_path) per ARCHITECTURE.md §3.3.

    Args:
        w_path: End-to-end path Werner parameter in [0.0, 1.0].

    Returns:
        Predicted Bell-state fidelity F_e,path in [0.25, 1.0].
    """
    return bell_state_fidelity(w_path)


def calculate_average_teleportation_fidelity(F_path: float) -> float:
    """Calculate the average single-qubit teleportation fidelity for a shared Bell state.

    Formula (Horodecki et al.):
        F_tel,avg = (2 * F_path + 1) / 3

    Boundary cases:
        F_path = 1.00 -> F_tel,avg = 1.00 (ideal teleportation)
        F_path = 0.50 -> F_tel,avg = 2/3 (~0.6667, classical threshold)
        F_path = 0.25 -> F_tel,avg = 0.50 (completely mixed state)

    Args:
        F_path: Bell-state fidelity in [0.25, 1.0].

    Returns:
        Average teleportation fidelity in [0.5, 1.0].

    Raises:
        TypeError: If F_path is a boolean or not a real number.
        ValueError: If F_path is outside [0.25, 1.0].
    """
    if isinstance(F_path, bool) or not isinstance(F_path, (int, float)):
        raise TypeError(
            f"Fidelity F_path must be a real number, got {type(F_path).__name__}."
        )
    f_val = float(F_path)
    if not (0.25 <= f_val <= 1.0):
        raise ValueError(
            f"Bell fidelity F_path must be in [0.25, 1.0], but got {f_val}."
        )
    return (2.0 * f_val + 1.0) / 3.0


def path_parameter(link_parameters: Sequence[float]) -> float:
    """Calculate the end-to-end path Werner parameter under ideal entanglement swapping.

    Formula:
        w_path = prod_{e in path} w_e

    Args:
        link_parameters: Sequence of Werner parameters w_e in [0.0, 1.0] for consecutive links.

    Returns:
        Product w_path in [0.0, 1.0].

    Raises:
        ValueError: If link_parameters is empty.
    """
    if not link_parameters:
        raise ValueError("Cannot calculate path parameter for an empty sequence of links.")

    product_w = 1.0
    for w in link_parameters:
        w_val = validate_werner_parameter(w)
        product_w *= w_val
    return float(product_w)


def path_metrics(link_parameters: Sequence[float]) -> PathMetrics:
    """Compute comprehensive end-to-end quantum metrics for a sequence of link Werner parameters.

    Args:
        link_parameters: Sequence of link Werner parameters along a path.

    Returns:
        PathMetrics object containing w_path, F_e,path, F_tel,avg, and num_hops.
    """
    w_path = path_parameter(link_parameters)
    fe_path = calculate_predicted_path_fidelity(w_path)
    ftel_avg = calculate_average_teleportation_fidelity(fe_path)
    return PathMetrics(
        werner_parameter=w_path,
        bell_fidelity=fe_path,
        average_teleportation_fidelity=ftel_avg,
        num_hops=len(link_parameters),
    )


def calculate_path_werner_parameter(graph: nx.Graph, path: Sequence[Hashable]) -> float:
    """Extract link Werner parameters along a node path in graph and compute the product w_path.

    Args:
        graph: NetworkX graph representing the quantum network with edge attribute 'w'.
        path: Ordered sequence of at least 2 nodes defining a valid contiguous path.

    Returns:
        Product w_path = prod w_e along the path.

    Raises:
        TypeError: If graph is not a networkx.Graph or path is not a sequence.
        ValueError: If path has fewer than 2 nodes or consecutive nodes are not connected.
        KeyError: If a node in path does not exist in graph or an edge lacks 'w'.
    """
    if not isinstance(graph, nx.Graph):
        raise TypeError(f"Expected a networkx.Graph, got {type(graph).__name__}.")
    if len(path) < 2:
        raise ValueError(
            f"A network path must contain at least 2 nodes (1 link), but got {len(path)} node(s)."
        )

    link_params: list[float] = []
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        if u not in graph:
            raise KeyError(f"Node '{u}' does not exist in the network graph.")
        if v not in graph:
            raise KeyError(f"Node '{v}' does not exist in the network graph.")
        if not graph.has_edge(u, v):
            raise ValueError(f"No direct link exists between node '{u}' and node '{v}'.")

        edge_data = graph[u][v]
        if "w" not in edge_data:
            raise KeyError(
                f"Edge ({u}, {v}) is missing required Werner parameter attribute 'w'."
            )
        link_params.append(edge_data["w"])

    return path_parameter(link_params)


def calculate_path_metrics(graph: nx.Graph, path: Sequence[Hashable]) -> PathMetrics:
    """Calculate PathMetrics for a node path within a NetworkX quantum network.

    Args:
        graph: NetworkX graph with edge attribute 'w'.
        path: Ordered sequence of nodes forming a valid path.

    Returns:
        PathMetrics object with end-to-end quantum metrics.
    """
    if not isinstance(graph, nx.Graph):
        raise TypeError(f"Expected a networkx.Graph, got {type(graph).__name__}.")
    if len(path) < 2:
        raise ValueError(
            f"A network path must contain at least 2 nodes (1 link), but got {len(path)} node(s)."
        )

    link_params: list[float] = []
    total_dist = 0.0
    total_delay = 0.0
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        if u not in graph:
            raise KeyError(f"Node '{u}' does not exist in the network graph.")
        if v not in graph:
            raise KeyError(f"Node '{v}' does not exist in the network graph.")
        if not graph.has_edge(u, v):
            raise ValueError(f"No direct link exists between node '{u}' and node '{v}'.")

        edge_data = graph[u][v]
        if "w" not in edge_data:
            raise KeyError(
                f"Edge ({u}, {v}) is missing required Werner parameter attribute 'w'."
            )
        link_params.append(edge_data["w"])
        d = float(edge_data.get("distance_km", 0.0))
        total_dist += d
        total_delay += float(edge_data.get("delay_ms", d * 0.005))

    base_metrics = path_metrics(link_params)
    return PathMetrics(
        werner_parameter=base_metrics.werner_parameter,
        bell_fidelity=base_metrics.bell_fidelity,
        average_teleportation_fidelity=base_metrics.average_teleportation_fidelity,
        num_hops=base_metrics.num_hops,
        total_distance_km=total_dist,
        total_delay_ms=total_delay,
    )


def create_topology() -> nx.Graph:
    """Construct the baseline 7-node quantum test network topology.

    The topology features 7 repeater/endpoint nodes:
        'A', 'B', 'C', 'D', 'E', 'F', 'G'
    connected by undirected quantum links with validated Werner parameters w_e in [0, 1].

    Topology Design Notes:
        1. Contains at least two distinct source-target pairs ('A'->'D' and 'A'->'G')
           where Shortest-Hop (BFS) and Quality-Aware (Dijkstra) select different routes:
           - A -> D:
               BFS shortest: ['A', 'C', 'D'] (2 hops, w = 0.70*0.70 = 0.490)
               Dijkstra quality: ['A', 'B', 'E', 'D'] (3 hops, w = 0.95^3 = 0.857)
           - A -> G:
               BFS shortest: ['A', 'C', 'D', 'G'] (3 hops, w = 0.70*0.70*0.88 = 0.431)
               Dijkstra quality: ['A', 'B', 'E', 'D', 'G'] (4 hops, w = 0.95^3 * 0.88 = 0.754)
        2. Edge attributes include:
           - 'w': Werner parameter in (0, 1]
           - 'weight': Additive Dijkstra cost -ln(w) for w > 0
           - 'bell_fidelity': Bell-state fidelity (1 + 3*w) / 4

    Returns:
        nx.Graph initialized with nodes and edge attributes.
    """
    g = nx.Graph(name="quantum_route_benchmark_7node")

    # Define nodes with explicit labels
    nodes = ["A", "B", "C", "D", "E", "F", "G"]
    g.add_nodes_from(nodes)

    # Undirected links: (u, v, Werner parameter w)
    edges = [
        ("A", "B", 0.95),
        ("B", "E", 0.95),
        ("E", "D", 0.95),
        ("A", "C", 0.70),
        ("C", "D", 0.70),
        ("B", "C", 0.60),
        ("E", "F", 0.90),
        ("F", "G", 0.92),
        ("D", "G", 0.88),
    ]

    for u, v, w in edges:
        w_val = validate_werner_parameter(w)
        # Cost for Dijkstra routing: -ln(w)
        weight = -math.log(w_val) if w_val > 0.0 else float("inf")
        fe = bell_state_fidelity(w_val)
        g.add_edge(
            u,
            v,
            w=w_val,
            werner_parameter=w_val,
            weight=weight,
            bell_fidelity=fe,
        )

    return g


def create_karnataka_topology() -> nx.Graph:
    """Construct the authentic Karnataka Regional Quantum Backbone Network (QR-012).

    Connects major institutional VTU academic and research centers across Karnataka
    with authentic geographic optical fiber route distances:
        - Belagavi (VTU Headquarters)
        - Hubballi (North Karnataka Tech Hub)
        - Davanagere (Central Textile & Educational Hub)
        - Shivamogga (Malnad Gateway)
        - Tumakuru (Industrial & Academic corridor)
        - Bengaluru (Capital & Quantum Computing Hub)

    Fiber propagation latency is modeled at the standard silica telecom delay of 5.0 μs/km.

    Returns:
        nx.Graph: NetworkX graph populated with geographic node coordinates, fiber distances (km),
                  propagation delays (ms), Werner link qualities, and logarithmic routing costs.
    """
    g = nx.Graph(name="karnataka_quantum_backbone")

    # Node positions based on normalized Karnataka geographic coordinates
    nodes = {
        "Belagavi": {"pos": (15.8497, 74.4977), "region": "North"},
        "Hubballi": {"pos": (15.3647, 75.1240), "region": "North-Central"},
        "Davanagere": {"pos": (14.4644, 75.9218), "region": "Central"},
        "Shivamogga": {"pos": (13.9299, 75.5681), "region": "Malnad"},
        "Tumakuru": {"pos": (13.3379, 77.1173), "region": "South-Central"},
        "Bengaluru": {"pos": (12.9716, 77.5946), "region": "South"},
    }

    for name, attrs in nodes.items():
        g.add_node(name, **attrs)

    # Undirected links: (Source, Target, Distance in km, Werner quality parameter w)
    edges = [
        # Primary NH48 Highway Trunk Line
        ("Belagavi", "Hubballi", 95.0, 0.96),
        ("Hubballi", "Davanagere", 145.0, 0.92),
        ("Davanagere", "Tumakuru", 195.0, 0.88),
        ("Tumakuru", "Bengaluru", 70.0, 0.98),
        # Western / Malnad Alternate Routes
        ("Hubballi", "Shivamogga", 190.0, 0.86),
        ("Davanagere", "Shivamogga", 85.0, 0.94),
        ("Shivamogga", "Tumakuru", 170.0, 0.89),
        # Express Long-Haul Bypass (higher loss, but fewer intermediate hops)
        ("Davanagere", "Bengaluru", 260.0, 0.78),
    ]

    for u, v, dist_km, w in edges:
        w_val = validate_werner_parameter(w)
        weight = -math.log(w_val) if w_val > 0.0 else float("inf")
        fe = bell_state_fidelity(w_val)
        delay_ms = dist_km * 0.005  # 5 microseconds per km = 0.005 ms/km

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


def create_ring_topology(
    num_nodes: int = 6,
    default_w: float = 0.90,
    default_distance_km: float = 50.0,
) -> nx.Graph:
    """Construct a parametric Ring quantum network topology.

    Args:
        num_nodes: Total number of repeater nodes on the ring (minimum 3).
        default_w: Default Werner parameter for each link in (0, 1].
        default_distance_km: Distance in km between adjacent ring nodes.

    Returns:
        nx.Graph: Connected ring topology.

    Raises:
        ValueError: If num_nodes < 3 or default_w outside (0, 1].
    """
    if num_nodes < 3:
        raise ValueError(f"Ring topology requires at least 3 nodes, got {num_nodes}.")
    w_val = validate_werner_parameter(default_w)

    g = nx.Graph(name=f"quantum_ring_{num_nodes}")
    node_names = [f"R{i}" for i in range(num_nodes)]
    g.add_nodes_from(node_names)

    delay_ms = default_distance_km * 0.005
    weight = -math.log(w_val) if w_val > 0.0 else float("inf")
    fe = bell_state_fidelity(w_val)

    for i in range(num_nodes):
        u = node_names[i]
        v = node_names[(i + 1) % num_nodes]
        g.add_edge(
            u,
            v,
            w=w_val,
            werner_parameter=w_val,
            distance_km=float(default_distance_km),
            delay_ms=float(delay_ms),
            weight=weight,
            bell_fidelity=fe,
        )

    return g


def create_star_topology(
    num_spokes: int = 5,
    hub_name: str = "Hub",
    default_w: float = 0.92,
    default_distance_km: float = 25.0,
) -> nx.Graph:
    """Construct a parametric Star quantum network topology centered around a quantum router hub.

    Args:
        num_spokes: Number of spoke client nodes connected to the central hub (minimum 1).
        hub_name: Identifier for the central quantum switch/router node.
        default_w: Werner parameter for spoke links.
        default_distance_km: Radial distance in km from hub to each client.

    Returns:
        nx.Graph: Star topology with central hub.

    Raises:
        ValueError: If num_spokes < 1 or default_w outside (0, 1].
    """
    if num_spokes < 1:
        raise ValueError(f"Star topology requires at least 1 spoke, got {num_spokes}.")
    w_val = validate_werner_parameter(default_w)

    g = nx.Graph(name=f"quantum_star_{num_spokes}")
    g.add_node(hub_name, is_hub=True)

    delay_ms = default_distance_km * 0.005
    weight = -math.log(w_val) if w_val > 0.0 else float("inf")
    fe = bell_state_fidelity(w_val)

    for i in range(num_spokes):
        client = f"Client_{i + 1}"
        g.add_node(client, is_hub=False)
        g.add_edge(
            hub_name,
            client,
            w=w_val,
            werner_parameter=w_val,
            distance_km=float(default_distance_km),
            delay_ms=float(delay_ms),
            weight=weight,
            bell_fidelity=fe,
        )

    return g


def create_grid_topology(
    rows: int = 3,
    cols: int = 3,
    default_w: float = 0.90,
    default_distance_km: float = 30.0,
) -> nx.Graph:
    """Construct a 2D Mesh/Grid quantum repeater network topology.

    Args:
        rows: Number of grid rows (minimum 2).
        cols: Number of grid columns (minimum 2).
        default_w: Werner parameter for grid edges.
        default_distance_km: Distance in km between adjacent grid vertices.

    Returns:
        nx.Graph: 2D lattice quantum network.

    Raises:
        ValueError: If rows < 2, cols < 2, or default_w outside (0, 1].
    """
    if rows < 2 or cols < 2:
        raise ValueError(f"Grid topology requires at least 2x2 nodes, got {rows}x{cols}.")
    w_val = validate_werner_parameter(default_w)

    g = nx.Graph(name=f"quantum_grid_{rows}x{cols}")
    delay_ms = default_distance_km * 0.005
    weight = -math.log(w_val) if w_val > 0.0 else float("inf")
    fe = bell_state_fidelity(w_val)

    for r in range(rows):
        for c in range(cols):
            node_id = f"N_{r}_{c}"
            g.add_node(node_id, row=r, col=c)

    # Horizontal and vertical links
    for r in range(rows):
        for c in range(cols):
            curr = f"N_{r}_{c}"
            # Connect right
            if c + 1 < cols:
                right = f"N_{r}_{c + 1}"
                g.add_edge(
                    curr,
                    right,
                    w=w_val,
                    werner_parameter=w_val,
                    distance_km=float(default_distance_km),
                    delay_ms=float(delay_ms),
                    weight=weight,
                    bell_fidelity=fe,
                )
            # Connect down
            if r + 1 < rows:
                down = f"N_{r + 1}_{c}"
                g.add_edge(
                    curr,
                    down,
                    w=w_val,
                    werner_parameter=w_val,
                    distance_km=float(default_distance_km),
                    delay_ms=float(delay_ms),
                    weight=weight,
                    bell_fidelity=fe,
                )

    return g
