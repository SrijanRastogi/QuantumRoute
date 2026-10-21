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
    """
    werner_parameter: float
    bell_fidelity: float
    average_teleportation_fidelity: float
    num_hops: int


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

    return path_metrics(link_params)


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
