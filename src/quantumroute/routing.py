"""Routing algorithms for quantum repeater communication networks.

This module provides route selection algorithms across quantum networks modeled
under isotropic Werner link distributions:
    1. Shortest-Hop (BFS) Routing:
       Selects the route minimizing total edge count (hop count), representing the
       classical network routing baseline.
    2. Quality-Aware (Dijkstra) Routing:
       Selects the route maximizing end-to-end Werner parameter w_path = prod(w_e).
       Since maximizing prod(w_e) is mathematically equivalent to minimizing:
           sum_{e in path} -ln(w_e)
       this is implemented as Dijkstra's shortest-path algorithm using additive edge
       costs c_e = -ln(w_e) for positive link parameters w_e in (0.0, 1.0].

Edge Handling & Zero-Quality Links (w = 0):
-------------------------------------------
Links with w_e = 0 supply a completely mixed state I_4 / 4 with zero entanglement.
In accordance with PLAN.md §5.2 and ARCHITECTURE.md §3.4:
    - Zero-quality edges (w = 0) have undefined/infinite logarithmic cost -ln(0) = +inf.
    - Quality-aware routing excludes zero-quality edges from the searchable topology.
    - If every path between source and target contains at least one zero-quality link,
      quality-aware routing raises networkx.NetworkXNoPath indicating that no usable
      positive-entanglement route exists.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Sequence, Any, Hashable, Iterator
import networkx as nx

from quantumroute.network import (
    PathMetrics,
    calculate_path_metrics,
    validate_werner_parameter,
    calculate_path_werner_parameter,
)


@dataclass(frozen=True)
class RouteResult:
    """Structured result returned by route discovery algorithms.

    Attributes:
        path: List of nodes traversed from source to target.
        num_hops: Number of edge hops (len(path) - 1).
        werner_parameter: End-to-end Werner parameter w_path = prod(w_e).
        bell_fidelity: Predicted end-to-end Bell-state fidelity (1 + 3*w_path) / 4.
        average_teleportation_fidelity: Predicted single-qubit teleportation fidelity.
        cost: Cumulative logarithmic routing cost sum(-ln(w_e)) or composite cost.
        strategy: Routing strategy identifier ("shortest_hop", "quality_aware", or "multi_metric").
        total_distance_km: Total optical fiber path length in kilometers.
        total_delay_ms: Total classical signaling propagation delay in milliseconds.
    """
    path: list[Any]
    num_hops: int
    werner_parameter: float
    bell_fidelity: float
    average_teleportation_fidelity: float
    cost: float
    strategy: str
    total_distance_km: float = 0.0
    total_delay_ms: float = 0.0

    @property
    def hop_count(self) -> int:
        """Alias for num_hops for interoperability."""
        return self.num_hops

    @property
    def total_latency_us(self) -> float:
        """Total classical signaling propagation latency in microseconds."""
        return self.total_delay_ms * 1000.0

    @property
    def metrics(self) -> PathMetrics:
        """Expose PathMetrics dataclass for downstream validation."""
        return PathMetrics(
            path=tuple(self.path),
            hop_count=self.num_hops,
            path_werner_parameter=self.werner_parameter,
            predicted_bell_fidelity=self.bell_fidelity,
            average_teleportation_fidelity=self.average_teleportation_fidelity,
            routing_cost=self.cost,
        )

    def __iter__(self) -> Iterator[Any]:
        return iter(self.path)

    def __len__(self) -> int:
        return len(self.path)

    def __getitem__(self, index: int) -> Any:
        return self.path[index]


def _validate_endpoints(graph: nx.Graph, source: Hashable, target: Hashable) -> None:
    """Validate that graph is valid and source/target nodes exist and are distinct."""
    if not isinstance(graph, nx.Graph):
        raise TypeError(f"Expected a networkx.Graph, got {type(graph).__name__}.")
    if source not in graph:
        raise KeyError(f"Source node '{source}' does not exist in the network graph.")
    if target not in graph:
        raise KeyError(f"Target node '{target}' does not exist in the network graph.")
    if source == target:
        raise ValueError(
            f"Source and target nodes must be distinct; cannot route from '{source}' to itself."
        )


def _edge_weight_func(u: Hashable, v: Hashable, edge_data: dict[str, Any]) -> float:
    """Evaluate additive Dijkstra weight c_e = -ln(w) for edge."""
    w = edge_data.get("w", edge_data.get("werner_parameter", None))
    if w is None:
        raise KeyError(f"Edge ({u}, {v}) lacks required Werner parameter attribute 'w'.")
    w_val = validate_werner_parameter(w)
    if w_val <= 0.0:
        return float("inf")
    return -math.log(w_val)


def find_shortest_hop_route(
    graph: nx.Graph,
    source: Hashable,
    target: Hashable,
    exclude_zero_quality: bool = False,
) -> RouteResult:
    """Find the path minimizing total edge hop count using Breadth-First Search (BFS).

    Args:
        graph: NetworkX graph with edge attribute 'w'.
        source: Starting node identifier.
        target: Destination node identifier.
        exclude_zero_quality: If True, restricts search to edges with w > 0.
            Defaults to False (topological shortest hop).

    Returns:
        RouteResult containing path, hop count, and evaluated quantum metrics.

    Raises:
        TypeError: If graph is not a networkx.Graph.
        KeyError: If source or target node does not exist in graph.
        ValueError: If source == target.
        networkx.NetworkXNoPath: If no path connects source and target.
    """
    _validate_endpoints(graph, source, target)

    search_graph = graph
    if exclude_zero_quality:
        search_graph = nx.subgraph_view(
            graph,
            filter_edge=lambda u, v: graph[u][v].get("w", graph[u][v].get("werner_parameter", 0.0)) > 0.0,
        )

    try:
        path = nx.shortest_path(search_graph, source=source, target=target)
    except nx.NetworkXNoPath as err:
        raise nx.NetworkXNoPath(
            f"No route exists between '{source}' and '{target}' in the network."
        ) from err

    metrics: PathMetrics = calculate_path_metrics(graph, path)
    cost = -math.log(metrics.werner_parameter) if metrics.werner_parameter > 0.0 else float("inf")

    return RouteResult(
        path=path,
        num_hops=metrics.num_hops,
        werner_parameter=metrics.werner_parameter,
        bell_fidelity=metrics.bell_fidelity,
        average_teleportation_fidelity=metrics.average_teleportation_fidelity,
        cost=cost,
        strategy="shortest_hop",
        total_distance_km=metrics.total_distance_km,
        total_delay_ms=metrics.total_delay_ms,
    )


def find_quality_aware_route(
    graph: nx.Graph,
    source: Hashable,
    target: Hashable,
) -> RouteResult:
    """Find the route maximizing end-to-end Werner parameter using Dijkstra's algorithm.

    Formulation:
        Minimizes sum(-ln(w_e)) over edges with w_e in (0.0, 1.0].
        Edges with w_e = 0.0 have zero entanglement and are excluded from candidate routes.

    Args:
        graph: NetworkX graph with edge attribute 'w'.
        source: Starting node identifier.
        target: Destination node identifier.

    Returns:
        RouteResult containing path, hop count, and evaluated quantum metrics.

    Raises:
        TypeError: If graph is not a networkx.Graph.
        KeyError: If source or target node does not exist in graph.
        ValueError: If source == target.
        networkx.NetworkXNoPath: If no positive-quality path connects source and target.
    """
    _validate_endpoints(graph, source, target)

    # Filter out unusable zero-entanglement links (w <= 0)
    usable_graph = nx.subgraph_view(
        graph,
        filter_edge=lambda u, v: graph[u][v].get("w", graph[u][v].get("werner_parameter", 0.0)) > 0.0,
    )

    if not nx.has_path(usable_graph, source, target):
        raise nx.NetworkXNoPath(
            f"No usable quantum path with positive entanglement (w > 0) exists between '{source}' and '{target}'."
        )

    try:
        path = nx.dijkstra_path(usable_graph, source=source, target=target, weight=_edge_weight_func)
    except nx.NetworkXNoPath as err:
        raise nx.NetworkXNoPath(
            f"No usable quantum path with positive entanglement (w > 0) exists between '{source}' and '{target}'."
        ) from err

    metrics: PathMetrics = calculate_path_metrics(graph, path)
    cost = -math.log(metrics.werner_parameter) if metrics.werner_parameter > 0.0 else float("inf")

    return RouteResult(
        path=path,
        num_hops=metrics.num_hops,
        werner_parameter=metrics.werner_parameter,
        bell_fidelity=metrics.bell_fidelity,
        average_teleportation_fidelity=metrics.average_teleportation_fidelity,
        cost=cost,
        strategy="quality_aware",
        total_distance_km=metrics.total_distance_km,
        total_delay_ms=metrics.total_delay_ms,
    )


def shortest_hop_path(graph: nx.Graph, source: Hashable, target: Hashable) -> list[Any]:
    """Return the node list of the BFS shortest-hop route matching INTERFACES.md."""
    return find_shortest_hop_route(graph, source, target).path


def quality_aware_path(graph: nx.Graph, source: Hashable, target: Hashable) -> list[Any]:
    """Return the node list of the Dijkstra quality-aware route matching INTERFACES.md."""
    return find_quality_aware_route(graph, source, target).path


def compare_routes(
    graph: nx.Graph,
    source: Hashable,
    target: Hashable,
) -> dict[str, RouteResult]:
    """Evaluate and compare both Shortest-Hop (BFS) and Quality-Aware (Dijkstra) routes.

    Args:
        graph: NetworkX graph with edge attribute 'w'.
        source: Starting node identifier.
        target: Destination node identifier.

    Returns:
        Dictionary mapping strategy names ("shortest_hop", "quality_aware") to RouteResults.
    """
    bfs_res = find_shortest_hop_route(graph, source, target)
    dijkstra_res = find_quality_aware_route(graph, source, target)
    return {
        "shortest_hop": bfs_res,
        "quality_aware": dijkstra_res,
    }


def exhaustive_quality_route(
    graph: nx.Graph,
    source: Hashable,
    target: Hashable,
) -> list[Any]:
    """Find the path maximizing w_path by exhaustively searching all simple paths.

    Used for validating Dijkstra correctness on small-to-medium networks.

    Args:
        graph: NetworkX graph.
        source: Starting node identifier.
        target: Destination node identifier.

    Returns:
        Node list of the optimal path.

    Raises:
        networkx.NetworkXNoPath: If no path with w > 0 exists.
    """
    _validate_endpoints(graph, source, target)
    usable_graph = nx.subgraph_view(
        graph,
        filter_edge=lambda u, v: graph[u][v].get("w", graph[u][v].get("werner_parameter", 0.0)) > 0.0,
    )

    all_paths = list(nx.all_simple_paths(usable_graph, source, target))
    if not all_paths:
        raise nx.NetworkXNoPath(
            f"No usable path with w > 0 exists between '{source}' and '{target}'."
        )

    best_path = None
    best_w = -1.0
    for p in all_paths:
        w_val = calculate_path_werner_parameter(graph, p)
        if w_val > best_w:
            best_w = w_val
            best_path = p

    assert best_path is not None
    return best_path


def find_multi_metric_route(
    graph: nx.Graph,
    source: Hashable,
    target: Hashable,
    alpha: float = 0.5,
) -> RouteResult:
    """Find a route balancing quantum entanglement fidelity vs. classical propagation delay (QR-012).

    Multi-Objective Cost Formulation:
        For each candidate link e in the positive-entanglement topology:
            c_fidelity(e) = -ln(w_e)
            c_delay(e) = delay_ms(e) [or distance_km * 0.005 ms]
            Cost(e) = (1 - alpha) * c_fidelity(e) + alpha * c_delay(e)

    Behavior across alpha in [0.0, 1.0]:
        - alpha = 0.0: Pure Quality-Aware routing (maximizes end-to-end Werner parameter).
        - alpha = 1.0: Pure Minimum-Latency routing (minimizes fiber propagation delay).
        - 0.0 < alpha < 1.0: Balanced Pareto-optimal trade-off.

    Args:
        graph: NetworkX graph with edge attribute 'w' and optional 'distance_km' / 'delay_ms'.
        source: Starting node identifier.
        target: Destination node identifier.
        alpha: Multi-objective weighting factor in [0.0, 1.0]. Defaults to 0.5.

    Returns:
        RouteResult: Containing optimal path, metrics, latency, and distance.

    Raises:
        TypeError: If graph is not a networkx.Graph or alpha is non-numeric/boolean.
        ValueError: If alpha is outside [0.0, 1.0] or source == target.
        KeyError: If source or target does not exist in graph.
        networkx.NetworkXNoPath: If no positive-quality path connects source and target.
    """
    _validate_endpoints(graph, source, target)

    if isinstance(alpha, bool) or not isinstance(alpha, (int, float)):
        raise TypeError(f"Weight parameter alpha must be a real number, got {type(alpha).__name__}.")
    alpha_val = float(alpha)
    if not (0.0 <= alpha_val <= 1.0):
        raise ValueError(f"Weight parameter alpha must be in [0.0, 1.0], got {alpha_val}.")

    # Exclude links with w <= 0
    usable_graph = nx.subgraph_view(
        graph,
        filter_edge=lambda u, v: graph[u][v].get("w", graph[u][v].get("werner_parameter", 0.0)) > 0.0,
    )

    if not nx.has_path(usable_graph, source, target):
        raise nx.NetworkXNoPath(
            f"No usable quantum path with positive entanglement (w > 0) exists between '{source}' and '{target}'."
        )

    def _composite_weight_func(u: Hashable, v: Hashable, edge_data: dict[str, Any]) -> float:
        w = edge_data.get("w", edge_data.get("werner_parameter", None))
        if w is None:
            raise KeyError(f"Edge ({u}, {v}) lacks required Werner parameter attribute 'w'.")
        w_val = validate_werner_parameter(w)
        if w_val <= 0.0:
            return float("inf")

        c_fidelity = -math.log(w_val)
        dist_km = float(edge_data.get("distance_km", 0.0))
        c_delay = float(edge_data.get("delay_ms", dist_km * 0.005))

        return (1.0 - alpha_val) * c_fidelity + alpha_val * c_delay

    try:
        path = nx.dijkstra_path(usable_graph, source=source, target=target, weight=_composite_weight_func)
    except nx.NetworkXNoPath as err:
        raise nx.NetworkXNoPath(
            f"No usable quantum path with positive entanglement exists between '{source}' and '{target}'."
        ) from err

    metrics: PathMetrics = calculate_path_metrics(graph, path)

    # Compute composite cost for the chosen path
    composite_cost = 0.0
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        composite_cost += _composite_weight_func(u, v, graph[u][v])

    return RouteResult(
        path=path,
        num_hops=metrics.num_hops,
        werner_parameter=metrics.werner_parameter,
        bell_fidelity=metrics.bell_fidelity,
        average_teleportation_fidelity=metrics.average_teleportation_fidelity,
        cost=composite_cost,
        strategy=f"multi_metric_alpha_{alpha_val:.2f}",
        total_distance_km=metrics.total_distance_km,
        total_delay_ms=metrics.total_delay_ms,
    )


def compare_multi_metric_routes(
    graph: nx.Graph,
    source: Hashable,
    target: Hashable,
    alphas: Sequence[float] = (0.0, 0.25, 0.5, 0.75, 1.0),
) -> dict[str, RouteResult]:
    """Evaluate multi-metric routes across a range of fidelity-latency trade-off parameters.

    Args:
        graph: NetworkX graph.
        source: Starting node identifier.
        target: Destination node identifier.
        alphas: Sequence of alpha values to sweep over in [0.0, 1.0].

    Returns:
        Dictionary mapping alpha labels to their corresponding RouteResult objects.
    """
    results = {}
    for a in alphas:
        key = f"alpha_{float(a):.2f}"
        results[key] = find_multi_metric_route(graph, source, target, alpha=a)
    return results
