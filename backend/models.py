"""Shared data models and graph override utilities for QuantumRoute V2 backend."""

from __future__ import annotations

import math
from typing import Optional, List
from pydantic import BaseModel, Field
import networkx as nx
from fastapi import HTTPException


class LinkOverride(BaseModel):
    """Configuration override for a specific network link."""
    source: str = Field(..., description="First endpoint of the link")
    target: str = Field(..., description="Second endpoint of the link")
    distance_km: Optional[float] = Field(
        None, 
        gt=0.0, 
        le=50000.0, 
        description="Physical fiber distance in km (must be strictly positive)"
    )
    w: Optional[float] = Field(
        None, 
        ge=0.0, 
        le=1.0, 
        description="Werner quality parameter w_e in [0.0, 1.0]"
    )


def apply_link_overrides(graph: nx.Graph, overrides: Optional[List[LinkOverride]]) -> nx.Graph:
    """Apply validated link overrides (distance, Werner quality) to a NetworkX graph.
    
    Updates:
    - distance_km
    - delay_ms = distance_km * 0.005 (5.0 µs/km standard propagation delay)
    - w and werner_parameter
    - bell_fidelity = (1 + 3*w) / 4
    - weight = -ln(w) if w > 0 else inf (for Dijkstra logarithmic routing)
    """
    if not overrides:
        return graph

    for ov in overrides:
        u, v = ov.source, ov.target
        if not graph.has_edge(u, v):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot override non-existent link ({u}, {v}) in topology."
            )
        edata = graph[u][v]
        if ov.distance_km is not None:
            if ov.distance_km <= 0.0:
                raise HTTPException(status_code=400, detail=f"Distance must be positive, got {ov.distance_km}")
            dist = float(ov.distance_km)
            edata["distance_km"] = dist
            edata["delay_ms"] = dist * 0.005  # 5.0 µs/km = 0.005 ms/km
            
        if ov.w is not None:
            if not (0.0 <= ov.w <= 1.0):
                raise HTTPException(status_code=400, detail=f"Werner parameter w must be in [0.0, 1.0], got {ov.w}")
            w_val = float(ov.w)
            edata["w"] = w_val
            edata["werner_parameter"] = w_val
            edata["bell_fidelity"] = (1.0 + 3.0 * w_val) / 4.0
            if w_val > 0.0:
                edata["weight"] = -math.log(w_val)
            else:
                edata["weight"] = float("inf")

    return graph
