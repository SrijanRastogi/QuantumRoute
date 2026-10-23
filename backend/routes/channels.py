"""Milestone 3: Physical Channels Lab API Routes.

Provides endpoints connecting optical-fiber transmission loss, coupling efficiency,
and memory dephasing to quantum-network routing and teleportation experiments.

Distinguishes:
1. Transmission probability: eta_total = eta_coupling * 10^(-alpha * L / 10).
2. Conditional entanglement quality: Werner parameter w given heralded link establishment.
3. End-to-end path success probability: product(eta_total_e) under independent single-shot attempts.
4. End-to-end conditional fidelity: w_path = product(w_e) and Horodecki teleportation fidelity.
5. Quantum memory dephasing: exp(-tau_wait / T2) during classical propagation delay.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional
import numpy as np
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from quantumroute.physics import (
    DEFAULT_ALPHA_DB_PER_KM,
    DEFAULT_COUPLING_EFFICIENCY,
    DEFAULT_P_DARK,
    DEFAULT_RAW_VISIBILITY,
    FIBER_LATENCY_MS_PER_KM,
    calculate_fiber_attenuation_db,
    calculate_fiber_transmittance,
    calculate_total_transmittance,
    calculate_conditional_werner_parameter,
    calculate_path_success_probability,
    calculate_path_conditional_werner,
    calculate_memory_decay_factor,
    evaluate_fiber_link,
    evaluate_physical_path,
)
from quantumroute.ui_v2.topologies import get_topology
from quantumroute.routing import (
    find_shortest_hop_route,
    find_quality_aware_route,
    find_multi_metric_route,
)

router = APIRouter(prefix="/api/channels", tags=["channels"])


from pydantic import BaseModel, ConfigDict, Field


class ChannelLinkRequest(BaseModel):
    """Request to calculate physical transmission and conditional entanglement quality for a single link."""
    distance_km: float = Field(50.0, ge=0.0, le=500.0, description="Fiber length in kilometers")
    alpha_db_per_km: float = Field(DEFAULT_ALPHA_DB_PER_KM, ge=0.0, le=5.0, description="Fiber attenuation in dB/km")
    coupling_efficiency: float = Field(0.85, ge=0.0, le=1.0, description="Optical coupling and detector efficiency")
    p_dark: float = Field(DEFAULT_P_DARK, ge=0.0, lt=0.5, description="Detector dark count probability per coincidence gate")
    raw_visibility: float = Field(DEFAULT_RAW_VISIBILITY, ge=0.0, le=1.0, description="Intrinsic source Werner parameter")
    use_decoupled_werner: bool = Field(False, description="Whether to decouple Werner quality from loss entirely")


class ChannelSweepRequest(BaseModel):
    """Request to sweep distance and observe transmission loss vs conditional quality."""
    max_distance_km: float = Field(100.0, ge=5.0, le=300.0, description="Maximum sweep distance in km")
    num_points: int = Field(25, ge=5, le=101, description="Number of sample points")
    alpha_db_per_km: float = Field(DEFAULT_ALPHA_DB_PER_KM, ge=0.0, le=5.0)
    coupling_efficiency: float = Field(0.85, ge=0.0, le=1.0)
    p_dark: float = Field(DEFAULT_P_DARK, ge=0.0, lt=0.5)
    raw_visibility: float = Field(DEFAULT_RAW_VISIBILITY, ge=0.0, le=1.0)


class HopInput(BaseModel):
    """Individual hop definition for a physical path evaluation."""
    model_config = ConfigDict(populate_by_name=True)

    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    distance_km: float = Field(..., ge=0.0)
    w: Optional[float] = Field(None, ge=0.0, le=1.0)
    alpha_db_per_km: Optional[float] = Field(None, ge=0.0)
    coupling_efficiency: Optional[float] = Field(None, ge=0.0, le=1.0)


class ChannelPathRequest(BaseModel):
    """Request to evaluate multi-hop path transmission and conditional fidelity."""
    hops: List[HopInput] = Field(..., min_length=1, description="List of connected hops in path order")
    alpha_db_per_km: float = Field(DEFAULT_ALPHA_DB_PER_KM, ge=0.0, le=5.0)
    coupling_efficiency: float = Field(0.85, ge=0.0, le=1.0)
    p_dark: float = Field(DEFAULT_P_DARK, ge=0.0, lt=0.5)
    raw_visibility: float = Field(DEFAULT_RAW_VISIBILITY, ge=0.0, le=1.0)
    t2_memory_us: float = Field(2000.0, ge=1.0, le=1000000.0, description="Memory coherence time T2 in microseconds")
    use_decoupled_werner: bool = Field(False)


class RouteCompareRequest(BaseModel):
    """Request to compare routing strategies under physical loss and conditional quality."""
    topology: str = Field("Generic Mesh (6 nodes · 10 links)")
    source: str = Field("Alice")
    target: str = Field("Bob")
    alpha_db_per_km: float = Field(DEFAULT_ALPHA_DB_PER_KM, ge=0.0, le=5.0)
    coupling_efficiency: float = Field(0.85, ge=0.0, le=1.0)
    p_dark: float = Field(DEFAULT_P_DARK, ge=0.0, lt=0.5)
    raw_visibility: float = Field(DEFAULT_RAW_VISIBILITY, ge=0.0, le=1.0)
    t2_memory_us: float = Field(2000.0, ge=1.0)


@router.get("/defaults")
def get_channel_defaults() -> Dict[str, Any]:
    """Return default physical channel simulation constants and model documentation."""
    return {
        "alpha_db_per_km": DEFAULT_ALPHA_DB_PER_KM,
        "coupling_efficiency": 0.85,
        "p_dark": DEFAULT_P_DARK,
        "raw_visibility": DEFAULT_RAW_VISIBILITY,
        "t2_memory_us": 2000.0,
        "latency_ms_per_km": FIBER_LATENCY_MS_PER_KM,
        "presets": [
            {
                "id": "telecom_standard",
                "label": "Standard Telecom Silica (SMF-28 @ 1550 nm)",
                "alpha_db_per_km": 0.20,
                "description": "Standard single-mode telecom fiber operating in the low-loss C-band (1550 nm). Illustrative standard baseline.",
            },
            {
                "id": "ultra_low_loss",
                "label": "Ultra-Low Loss Silica (1550 nm)",
                "alpha_db_per_km": 0.16,
                "description": "Pure silica-core low-attenuation fiber used in submarine and transcontinental optical trunks.",
            },
            {
                "id": "telecom_1310",
                "label": "O-Band Telecom Fiber (1310 nm)",
                "alpha_db_per_km": 0.35,
                "description": "Zero-dispersion optical wavelength band with higher Rayleigh scattering attenuation.",
            },
            {
                "id": "short_reach",
                "label": "Metropolitan High-Coupling Link",
                "alpha_db_per_km": 0.22,
                "description": "Typical urban optical distribution network link with patch panels and splice loss allowances.",
            },
        ],
        "assumptions": {
            "transmission_model": "eta_fiber(L) = 10^(-alpha * L / 10). Total transmittance eta_total = eta_coupling * eta_fiber.",
            "conditional_werner": "Conditional quality w describes post-selected Bell states given heralded photon arrival. Loss does NOT directly twirl state into white noise.",
            "dark_count_heuristic": "Simplified SNR heuristic: w(eta) = raw_vis * [eta / (eta + 2 * p_dark)]. Illustrates SNR collapse near dark count floor.",
            "path_success": "P_success_path = product(eta_total_e) under independent single-shot attempt model.",
            "memory_decay": "Simplified dephasing over propagation delay: w_mem = exp(-tau_wait / T2).",
        },
    }


@router.post("/link")
def evaluate_link_endpoint(req: ChannelLinkRequest) -> Dict[str, Any]:
    """Evaluate physical transmission probability and conditional Werner quality for a single link."""
    d = float(req.distance_km)
    alpha = float(req.alpha_db_per_km)
    coupling = float(req.coupling_efficiency)
    p_dark = float(req.p_dark)
    raw_vis = float(req.raw_visibility)

    loss_db = calculate_fiber_attenuation_db(d, alpha)
    eta_fiber = calculate_fiber_transmittance(d, alpha)
    eta_total = calculate_total_transmittance(d, alpha, coupling)

    if req.use_decoupled_werner:
        w_cond = raw_vis
    else:
        w_cond = calculate_conditional_werner_parameter(eta_total, p_dark, raw_vis)

    fe_cond = (1.0 + 3.0 * w_cond) / 4.0
    ftel_cond = (1.0 + w_cond) / 2.0
    delay_ms = d * FIBER_LATENCY_MS_PER_KM
    expected_attempts = (1.0 / eta_total) if eta_total > 1e-12 else float("inf")

    return {
        "distance_km": d,
        "alpha_db_per_km": alpha,
        "coupling_efficiency": coupling,
        "attenuation_db": round(loss_db, 4),
        "transmittance_fiber": round(eta_fiber, 6),
        "transmittance_total": round(eta_total, 6),
        "propagation_delay_ms": round(delay_ms, 4),
        "conditional_werner_w": round(w_cond, 6),
        "conditional_bell_fidelity": round(fe_cond, 6),
        "conditional_teleport_fidelity": round(ftel_cond, 6),
        "expected_attempts": round(expected_attempts, 2) if not math.isinf(expected_attempts) else None,
        "is_decoupled": req.use_decoupled_werner,
        "worked_example": {
            "step1_attenuation": f"Loss (dB) = {alpha:.2f} dB/km × {d:.1f} km = {loss_db:.2f} dB",
            "step2_transmittance": f"η_fiber = 10^(-{loss_db:.2f}/10) = {eta_fiber:.4f} ({eta_fiber * 100:.2f}%)",
            "step3_total": f"η_total = {coupling:.2f} (coupling) × {eta_fiber:.4f} = {eta_total:.4f} ({eta_total * 100:.2f}%)",
            "step4_quality": (
                f"w_cond = {raw_vis:.2f} (constant decoupled quality)"
                if req.use_decoupled_werner
                else f"w_cond = {raw_vis:.2f} × [{eta_total:.4f} / ({eta_total:.4f} + 2×{p_dark:.1e})] = {w_cond:.4f}"
            ),
            "step5_fidelity": f"F_e = (1 + 3×{w_cond:.4f})/4 = {fe_cond:.4f} | F_tel = (1 + {w_cond:.4f})/2 = {ftel_cond:.4f}",
        },
    }


@router.post("/sweep")
def distance_sweep_endpoint(req: ChannelSweepRequest) -> Dict[str, Any]:
    """Execute distance parameter sweep demonstrating transmission loss vs conditional quality."""
    distances = np.linspace(0.0, req.max_distance_km, req.num_points).tolist()
    points: List[Dict[str, Any]] = []

    for d in distances:
        d_val = float(d)
        loss_db = calculate_fiber_attenuation_db(d_val, req.alpha_db_per_km)
        eta_fiber = calculate_fiber_transmittance(d_val, req.alpha_db_per_km)
        eta_total = calculate_total_transmittance(d_val, req.alpha_db_per_km, req.coupling_efficiency)

        w_heuristic = calculate_conditional_werner_parameter(eta_total, req.p_dark, req.raw_visibility)
        w_decoupled = req.raw_visibility

        fe_heuristic = (1.0 + 3.0 * w_heuristic) / 4.0
        fe_decoupled = (1.0 + 3.0 * w_decoupled) / 4.0

        points.append({
            "distance_km": round(d_val, 2),
            "attenuation_db": round(loss_db, 2),
            "eta_fiber": round(eta_fiber, 6),
            "eta_total": round(eta_total, 6),
            "transmission_percent": round(eta_total * 100.0, 3),
            "w_heuristic": round(w_heuristic, 4),
            "w_decoupled": round(w_decoupled, 4),
            "bell_fidelity_heuristic": round(fe_heuristic, 4),
            "bell_fidelity_decoupled": round(fe_decoupled, 4),
            "delay_ms": round(d_val * FIBER_LATENCY_MS_PER_KM, 3),
        })

    return {
        "alpha_db_per_km": req.alpha_db_per_km,
        "coupling_efficiency": req.coupling_efficiency,
        "raw_visibility": req.raw_visibility,
        "p_dark": req.p_dark,
        "points": points,
        "takeaway": (
            "Notice the critical physical contrast: Transmission probability eta_total drops exponentially with distance (loss), "
            "while conditional entanglement quality w remains high until photon counts drop near the detector dark count floor."
        ),
    }


@router.post("/path")
def evaluate_path_endpoint(req: ChannelPathRequest) -> Dict[str, Any]:
    """Evaluate end-to-end path transmission probability and conditional fidelity."""
    distances = [h.distance_km for h in req.hops]
    hop_alphas = [h.alpha_db_per_km if h.alpha_db_per_km is not None else req.alpha_db_per_km for h in req.hops]
    hop_couplings = [h.coupling_efficiency if h.coupling_efficiency is not None else req.coupling_efficiency for h in req.hops]

    hop_transmittances: List[float] = []
    hop_werner_params: List[float] = []
    hop_breakdown: List[Dict[str, Any]] = []

    for idx, h in enumerate(req.hops):
        d = h.distance_km
        alpha = hop_alphas[idx]
        coupling = hop_couplings[idx]

        loss_db = calculate_fiber_attenuation_db(d, alpha)
        eta_tot = calculate_total_transmittance(d, alpha, coupling)
        hop_transmittances.append(eta_tot)

        if h.w is not None:
            w_val = float(h.w)
        elif req.use_decoupled_werner:
            w_val = req.raw_visibility
        else:
            w_val = calculate_conditional_werner_parameter(eta_tot, req.p_dark, req.raw_visibility)
        hop_werner_params.append(w_val)

        delay = d * FIBER_LATENCY_MS_PER_KM

        hop_breakdown.append({
            "hop_index": idx + 1,
            "from": h.from_node,
            "to": h.to_node,
            "distance_km": d,
            "alpha_db_per_km": alpha,
            "loss_db": round(loss_db, 2),
            "transmittance_total": round(eta_tot, 6),
            "transmission_pct": round(eta_tot * 100.0, 3),
            "werner_w": round(w_val, 4),
            "bell_fidelity": round((1.0 + 3.0 * w_val) / 4.0, 4),
            "delay_ms": round(delay, 3),
        })

    p_success_path = calculate_path_success_probability(hop_transmittances)
    w_cond_path = calculate_path_conditional_werner(hop_werner_params)
    fe_cond_path = (1.0 + 3.0 * w_cond_path) / 4.0
    ftel_cond_path = (1.0 + w_cond_path) / 2.0

    total_dist = sum(distances)
    total_loss_db = sum(h["loss_db"] for h in hop_breakdown)
    total_delay_ms = total_dist * FIBER_LATENCY_MS_PER_KM

    t2_ms = req.t2_memory_us / 1000.0
    mem_decay = calculate_memory_decay_factor(total_delay_ms, t2_ms=t2_ms)
    w_with_mem = float(np.clip(w_cond_path * mem_decay, 0.0, 1.0))
    fe_with_mem = (1.0 + 3.0 * w_with_mem) / 4.0
    ftel_with_mem = (1.0 + w_with_mem) / 2.0

    return {
        "num_hops": len(req.hops),
        "total_distance_km": round(total_dist, 2),
        "total_attenuation_db": round(total_loss_db, 2),
        "path_success_probability": round(p_success_path, 8),
        "path_success_percent": round(p_success_path * 100.0, 6),
        "conditional_werner_w": round(w_cond_path, 6),
        "conditional_bell_fidelity": round(fe_cond_path, 6),
        "conditional_teleport_fidelity": round(ftel_cond_path, 6),
        "total_propagation_delay_ms": round(total_delay_ms, 3),
        "memory_effects": {
            "t2_memory_us": req.t2_memory_us,
            "memory_decay_factor": round(mem_decay, 6),
            "werner_with_memory": round(w_with_mem, 6),
            "bell_fidelity_with_memory": round(fe_with_mem, 6),
            "teleport_fidelity_with_memory": round(ftel_with_mem, 6),
        },
        "hops": hop_breakdown,
        "assumptions": {
            "independence": "Independent single-shot attempt model: P_success = product(eta_total_e).",
            "werner_composition": "Ideal entanglement swapping with post-selection: w_path = product(w_e).",
            "memory_model": f"Simplified roundtrip holding model: w_eff = w_path * exp(-tau_wait / T2) with tau_wait={total_delay_ms:.2f} ms.",
        },
    }


@router.post("/compare-routes")
def compare_physical_routes_endpoint(req: RouteCompareRequest) -> Dict[str, Any]:
    """Compare routing strategies under physical loss and conditional quality."""
    try:
        topo = get_topology(req.topology)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load topology: {str(e)}")

    if req.source not in topo.nodes or req.target not in topo.nodes:
        raise HTTPException(status_code=400, detail="Source or destination not found in topology.")
    if req.source == req.target:
        raise HTTPException(status_code=400, detail="Source and destination must be distinct.")

    # Calculate routes
    r_bfs = find_shortest_hop_route(topo, req.source, req.target)
    r_quality = find_quality_aware_route(topo, req.source, req.target)
    r_multi = find_multi_metric_route(topo, req.source, req.target, alpha=0.35)

    def _eval_route(route_obj, name: str) -> Optional[Dict[str, Any]]:
        if route_obj is None or not route_obj.path or len(route_obj.path) < 2:
            return None

        path_nodes = route_obj.path
        hop_distances: List[float] = []
        hop_werner_list: List[float] = []

        for i in range(len(path_nodes) - 1):
            u, v = path_nodes[i], path_nodes[i + 1]
            edge_data = topo.get_edge_data(u, v) or {}
            d = float(edge_data.get("distance_km", 20.0))
            w = float(edge_data.get("w", 0.95))
            hop_distances.append(d)
            hop_werner_list.append(w)

        report = evaluate_physical_path(
            hop_distances_km=hop_distances,
            alpha_db_per_km=req.alpha_db_per_km,
            coupling_efficiency=req.coupling_efficiency,
            p_dark=req.p_dark,
            raw_visibility=req.raw_visibility,
            t2_ms=req.t2_memory_us / 1000.0,
            override_hop_w=hop_werner_list,
        )

        return {
            "strategy": name,
            "path": path_nodes,
            "num_hops": report.num_hops,
            "total_distance_km": round(report.total_distance_km, 2),
            "total_attenuation_db": round(report.total_attenuation_db, 2),
            "path_success_probability": round(report.path_success_probability, 8),
            "conditional_werner_w": round(report.conditional_werner_w, 4),
            "conditional_bell_fidelity": round(report.conditional_bell_fidelity, 4),
            "conditional_teleport_fidelity": round(report.conditional_teleport_fidelity, 4),
            "total_delay_ms": round(report.total_propagation_delay_ms, 3),
            "fidelity_with_memory": round(report.fidelity_with_memory, 4),
        }

    bfs_eval = _eval_route(r_bfs, "Minimum Hops (BFS)")
    quality_eval = _eval_route(r_quality, "Quality-Aware (Dijkstra)")
    multi_eval = _eval_route(r_multi, "Multi-Metric (α=0.35)")

    return {
        "topology": req.topology,
        "source": req.source,
        "target": req.target,
        "routes": {
            "shortest_hop": bfs_eval,
            "quality_aware": quality_eval,
            "multi_metric": multi_eval,
        },
        "scientific_insight": (
            "Crucial insight: Minimum-hop routing minimizes the number of repeaters, but if its hops are longer in distance, "
            "it can suffer significantly worse photon transmission probability than a multi-hop route with shorter individual spans. "
            "Quality-aware routing optimizes conditional Bell fidelity, while shortest-distance routing maximizes photon transmission yield."
        ),
    }
