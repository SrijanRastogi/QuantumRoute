"""Network topology and routing API endpoints for QuantumRoute V2."""

from __future__ import annotations

import sys
import os

# Ensure src is in python path
_src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src"))
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)

import networkx as nx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from quantumroute.ui_v2.topologies import (
    TOPOLOGY_PRESETS,
    DEFAULT_TOPOLOGY_KEY,
    get_topology,
)
from quantumroute.routing import (
    find_shortest_hop_route,
    find_quality_aware_route,
    find_multi_metric_route,
    RouteResult,
)

from backend.models import LinkOverride, apply_link_overrides

router = APIRouter(prefix="/api/network", tags=["Network & Routing"])


class RouteRequest(BaseModel):
    topology: str = Field(default=DEFAULT_TOPOLOGY_KEY, description="Topology preset name")
    source: str = Field(default="Alice", description="Source node name")
    target: str = Field(default="Bob", description="Target destination node name")
    strategy: str = Field(default="quality_aware", description="Strategy: quality_aware, shortest_hop, multi_metric")
    alpha: float = Field(default=0.35, ge=0.0, le=1.0, description="Multi-metric balance factor")
    link_overrides: Optional[List[LinkOverride]] = Field(default=None, description="Custom link distance or Werner overrides")


class CustomGraphRequest(BaseModel):
    topology: str = Field(default=DEFAULT_TOPOLOGY_KEY, description="Topology preset name")
    link_overrides: Optional[List[LinkOverride]] = Field(default=None, description="Custom link overrides")


def _serialize_graph(g: nx.Graph) -> Dict[str, Any]:
    """Serialize NetworkX graph to JSON-compatible dictionary."""
    nodes = []
    for node, data in g.nodes(data=True):
        pos = data.get("pos", (0.0, 0.0))
        nodes.append({
            "id": node,
            "label": str(node),
            "x": float(pos[0]),
            "y": float(pos[1]),
            "type": data.get("type", "repeater"),
            "role": data.get("role", "relay"),
            "is_hub": data.get("is_hub", False),
        })

    edges = []
    for u, v, data in g.edges(data=True):
        edges.append({
            "source": str(u),
            "target": str(v),
            "w": float(data.get("w", data.get("werner_parameter", 1.0))),
            "bell_fidelity": float(data.get("bell_fidelity", (1.0 + 3.0 * data.get("w", 1.0)) / 4.0)),
            "distance_km": float(data.get("distance_km", 50.0)),
            "delay_ms": float(data.get("delay_ms", 0.25)),
        })

    return {
        "name": g.name if hasattr(g, "name") else "quantum_network",
        "nodes": nodes,
        "edges": edges,
    }


def _serialize_route(res: Optional[RouteResult]) -> Optional[Dict[str, Any]]:
    if res is None:
        return None
    return {
        "path": [str(n) for n in res.path],
        "num_hops": int(res.num_hops),
        "werner_parameter": round(float(res.werner_parameter), 4),
        "bell_fidelity": round(float(res.bell_fidelity), 4),
        "average_teleportation_fidelity": round(float(res.average_teleportation_fidelity), 4),
        "total_distance_km": round(float(res.total_distance_km), 1),
        "total_delay_ms": round(float(res.total_delay_ms), 3),
        "cost": round(float(res.cost), 4),
        "strategy": res.strategy,
    }


@router.get("/topologies")
def list_topologies() -> Dict[str, Any]:
    """Return available network topology presets."""
    return {
        "presets": list(TOPOLOGY_PRESETS.keys()),
        "default": DEFAULT_TOPOLOGY_KEY,
    }


@router.get("/topologies/{preset_name}")
def get_topology_by_name(preset_name: str) -> Dict[str, Any]:
    """Retrieve full graph structure for a specific preset."""
    if preset_name not in TOPOLOGY_PRESETS:
        raise HTTPException(status_code=404, detail=f"Topology preset '{preset_name}' not found.")
    g = get_topology(preset_name)
    return _serialize_graph(g)


@router.post("/custom_graph")
def get_custom_graph(req: CustomGraphRequest) -> Dict[str, Any]:
    """Retrieve graph structure with custom link overrides applied."""
    if req.topology not in TOPOLOGY_PRESETS:
        raise HTTPException(status_code=404, detail=f"Topology preset '{req.topology}' not found.")
    g = get_topology(req.topology)
    g = apply_link_overrides(g, req.link_overrides)
    return _serialize_graph(g)


@router.post("/route")
def calculate_routes(req: RouteRequest) -> Dict[str, Any]:
    """Calculate and compare Shortest-Hop, Quality-Aware, and Multi-Metric routes."""
    if req.topology not in TOPOLOGY_PRESETS:
        raise HTTPException(status_code=404, detail=f"Topology '{req.topology}' not found.")

    g = get_topology(req.topology)
    # Apply user-customized link overrides if provided
    g = apply_link_overrides(g, req.link_overrides)

    if req.source not in g:
        raise HTTPException(status_code=400, detail=f"Source node '{req.source}' not in network.")
    if req.target not in g:
        raise HTTPException(status_code=400, detail=f"Target node '{req.target}' not in network.")
    if req.source == req.target:
        raise HTTPException(status_code=400, detail="Source and destination nodes must be distinct.")

    # 1. Shortest Hop (BFS)
    try:
        bfs_res = find_shortest_hop_route(g, req.source, req.target)
    except (nx.NetworkXNoPath, KeyError, ValueError):
        bfs_res = None

    # 2. Quality Aware (Dijkstra)
    try:
        dijk_res = find_quality_aware_route(g, req.source, req.target)
    except (nx.NetworkXNoPath, KeyError, ValueError):
        dijk_res = None

    # 3. Multi Metric (α)
    try:
        multi_res = find_multi_metric_route(g, req.source, req.target, alpha=req.alpha)
    except (nx.NetworkXNoPath, KeyError, ValueError):
        multi_res = None

    # Selected route based on user choice
    selected_res = dijk_res
    if req.strategy == "shortest_hop":
        selected_res = bfs_res
    elif req.strategy == "multi_metric":
        selected_res = multi_res

    # Breakdown of hops for selected route
    hops_breakdown = []
    if selected_res is not None and len(selected_res.path) >= 2:
        for i in range(len(selected_res.path) - 1):
            u, v = selected_res.path[i], selected_res.path[i + 1]
            edata = g.get_edge_data(u, v, default={})
            hops_breakdown.append({
                "from": str(u),
                "to": str(v),
                "distance_km": float(edata.get("distance_km", 0.0)),
                "w": float(edata.get("w", edata.get("werner_parameter", 1.0))),
                "delay_ms": float(edata.get("delay_ms", 0.0)),
            })

    # Baseline comparison (Werner % improvement over BFS)
    improvement_pct = 0.0
    if selected_res and bfs_res and bfs_res.werner_parameter > 0:
        improvement_pct = round(
            ((selected_res.werner_parameter - bfs_res.werner_parameter) / bfs_res.werner_parameter) * 100.0,
            1,
        )

    return {
        "selected_strategy": req.strategy,
        "selected_route": _serialize_route(selected_res),
        "hops_breakdown": hops_breakdown,
        "werner_improvement_pct": improvement_pct,
        "comparison": {
            "shortest_hop": _serialize_route(bfs_res),
            "quality_aware": _serialize_route(dijk_res),
            "multi_metric": _serialize_route(multi_res),
        },
    }


@router.get("/explain")
def get_explanation(source: str = "Alice", target: str = "Bob", preset: str = DEFAULT_TOPOLOGY_KEY) -> Dict[str, Any]:
    """Provide plain-language educational explanations for teenagers and deep scientific rules for researchers."""
    return {
        "for_beginners": {
            "headline": "Why did Quality-Aware routing take a detour?",
            "concept": (
                f"Imagine sending a fragile glass sculpture. Shortest-Hop (BFS) chooses the path with the fewest stops, "
                f"even if it has to travel over bumpy dirt roads (noisy quantum channels). "
                f"Quality-Aware (Dijkstra) chooses smooth, high-quality paved highways (high-entanglement links), "
                f"even if it takes one extra repeater stop! By multiplying Werner qualities (w_path = w1 * w2 * w3), "
                f"we guarantee the teleported state arrives in Bob's hands with maximum fidelity."
            ),
            "key_takeaway": "More hops on clean channels is often far better than fewer hops on noisy channels!",
        },
        "scientific_invariants": [
            "Werner Product Rule: w_path = ∏ w_e. State fidelities (F_e) must NEVER be multiplied directly.",
            "Dijkstra formulation: Additive edge costs c_e = -ln(w_e) for w_e > 0. Edges with w_e = 0 have zero entanglement and are excluded.",
            "Deferred Measurement: Coherent feedforward corrections CX and CZ preserve state coherence prior to receiver subsystem extraction.",
        ],
    }
