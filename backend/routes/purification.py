"""Milestone 4: Entanglement Purification Lab API Routes.

Provides endpoints for the two-pair BBPSSW recurrence protocol:
- Analytical before/after fidelity and success probability calculations.
- Raw Bell-diagonal output coefficients vs twirled Werner parameter.
- Parametric fidelity sweeps across the [0.25, 1.0] domain.
- Finite-shot Qiskit Aer simulation with proper accepted-sample uncertainty accounting.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from quantumroute.purification import (
    calculate_bbpssw_analytical,
    simulate_bbpssw_density_matrix,
    simulate_bbpssw_shots,
    validate_werner_w,
    validate_bell_fidelity,
    werner_w_to_fidelity,
    fidelity_to_werner_w,
    fidelity_to_average_teleportation,
)

router = APIRouter(prefix="/api/purification", tags=["purification"])


# ==============================================================================
# Pydantic Schemas
# ==============================================================================


class PurificationEvaluateRequest(BaseModel):
    """Request to evaluate single-round BBPSSW purification."""

    model_config = ConfigDict(populate_by_name=True)

    werner_w: Optional[float] = Field(
        None, ge=0.0, le=1.0, description="Input Werner parameter in [0.0, 1.0]"
    )
    bell_fidelity: Optional[float] = Field(
        None, ge=0.25, le=1.0, description="Input Bell fidelity in [0.25, 1.0]"
    )
    apply_twirling: bool = Field(
        True, description="Whether to apply idealized bilateral Clifford twirling"
    )


class PurificationEvaluateResponse(BaseModel):
    """Complete evaluation report for single-round BBPSSW purification."""

    model_config = ConfigDict(populate_by_name=True)

    input_werner_w: float
    input_bell_fidelity: float
    input_teleport_fidelity: float

    success_probability: float
    output_bell_coefficients: Dict[str, float]
    output_bell_fidelity: float
    output_werner_w_twirled: float
    output_teleport_fidelity: float

    fidelity_gain: float
    is_purified: bool
    expected_raw_pairs_consumed: float
    threshold_fidelity: float = 0.50
    threshold_werner_w: float = 1.0 / 3.0

    apply_twirling: bool
    worked_example: Dict[str, str]


class PurificationSweepPoint(BaseModel):
    """Single point in parametric purification recurrence sweep."""

    model_config = ConfigDict(populate_by_name=True)

    fidelity_in: float
    werner_w_in: float
    fidelity_out: float
    werner_w_out: float
    success_probability: float
    expected_pairs: float
    is_purified: bool


class PurificationSweepRequest(BaseModel):
    """Request to generate recurrence curve sweep."""

    model_config = ConfigDict(populate_by_name=True)

    min_fidelity: float = Field(0.25, ge=0.25, le=0.99)
    max_fidelity: float = Field(1.00, ge=0.26, le=1.00)
    num_points: int = Field(50, ge=10, le=200)


class PurificationSweepResponse(BaseModel):
    """Parametric purification sweep response."""

    model_config = ConfigDict(populate_by_name=True)

    points: List[PurificationSweepPoint]
    threshold_fidelity: float = 0.50


class PurificationShotsRequest(BaseModel):
    """Request for finite-shot Qiskit Aer purification trial."""

    model_config = ConfigDict(populate_by_name=True)

    werner_w: Optional[float] = Field(None, ge=0.0, le=1.0)
    bell_fidelity: Optional[float] = Field(None, ge=0.25, le=1.0)
    shots: int = Field(4096, ge=100, le=50000)
    seed: Optional[int] = Field(42, description="Random seed for reproducibility")


class PurificationShotsResponse(BaseModel):
    """Finite-shot simulation response with accepted-sample uncertainty accounting."""

    model_config = ConfigDict(populate_by_name=True)

    input_werner_w: float
    input_bell_fidelity: float
    total_attempts: int
    accepted_attempts: int

    estimated_success_probability: float
    success_probability_uncertainty: float

    estimated_output_fidelity: Optional[float]
    output_fidelity_uncertainty: Optional[float]
    estimated_bell_coefficients: Dict[str, float]

    expected_raw_pairs_consumed_estimate: Optional[float]
    fidelity_reliable: bool
    warning_message: Optional[str]

    analytical_success_probability: float
    analytical_output_fidelity: float
    analytical_expected_raw_pairs: float


# ==============================================================================
# Helper for Input Resolving
# ==============================================================================


def _resolve_input_w(werner_w: Optional[float], bell_fidelity: Optional[float]) -> float:
    """Resolve and validate Werner w from request, rejecting missing or conflicting inputs."""
    if werner_w is None and bell_fidelity is None:
        raise HTTPException(
            status_code=400,
            detail="Must provide either 'werner_w' in [0.0, 1.0] or 'bell_fidelity' in [0.25, 1.0].",
        )

    if werner_w is not None and bell_fidelity is not None:
        expected_f = (1.0 + 3.0 * werner_w) / 4.0
        if abs(bell_fidelity - expected_f) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Conflicting inputs: werner_w={werner_w:.4f} corresponds to fidelity "
                    f"{expected_f:.4f}, which does not match provided bell_fidelity={bell_fidelity:.4f}."
                ),
            )
        return float(werner_w)

    if werner_w is not None:
        try:
            return validate_werner_w(werner_w)
        except (TypeError, ValueError) as err:
            raise HTTPException(status_code=400, detail=str(err))

    try:
        f_val = validate_bell_fidelity(bell_fidelity)  # type: ignore[arg-type]
        return fidelity_to_werner_w(f_val)
    except (TypeError, ValueError) as err:
        raise HTTPException(status_code=400, detail=str(err))


# ==============================================================================
# API Endpoints
# ==============================================================================


@router.get("/defaults")
def get_purification_defaults() -> Dict[str, Any]:
    """Return default presets, fixed points, and scientific assumptions for BBPSSW purification."""
    return {
        "default_werner_w": 0.80,
        "default_bell_fidelity": 0.85,
        "threshold_fidelity": 0.50,
        "threshold_werner_w": 1.0 / 3.0,
        "fixed_point_mixed_fidelity": 0.25,
        "fixed_point_ideal_fidelity": 1.00,
        "presets": [
            {
                "id": "sub_threshold",
                "label": "Sub-Threshold (F = 0.40)",
                "werner_w": 0.20,
                "bell_fidelity": 0.40,
                "description": "F < 0.50: Purification strictly degrades the state toward maximally mixed I/4.",
            },
            {
                "id": "threshold",
                "label": "Classical Threshold (F = 0.50)",
                "werner_w": 1.0 / 3.0,
                "bell_fidelity": 0.50,
                "description": "F = 0.50: Fixed point boundary where output fidelity equals input fidelity.",
            },
            {
                "id": "moderate_link",
                "label": "Standard Telecom Link (F = 0.70)",
                "werner_w": 0.60,
                "bell_fidelity": 0.70,
                "description": "Typical noisy Bell link after fiber distribution (w = 0.60).",
            },
            {
                "id": "high_quality",
                "label": "High-Quality Link (F = 0.85)",
                "werner_w": 0.80,
                "bell_fidelity": 0.85,
                "description": "Near-ideal link demonstrating significant fidelity enhancement to F' ≈ 0.884.",
            },
            {
                "id": "near_ideal",
                "label": "Near-Ideal Pair (F = 0.95)",
                "werner_w": 0.9333,
                "bell_fidelity": 0.95,
                "description": "High fidelity state showing high acceptance rate P_succ ≈ 93.6%.",
            },
        ],
        "scientific_assumptions": {
            "protocol": "BBPSSW two-pair recurrence protocol (Bennett et al. PRL 76, 722 (1996)).",
            "target_state": "Canonical symmetric Bell pair |Φ+⟩ = (|00⟩ + |11⟩) / √2.",
            "qubit_allocation": "Pair 1 on (A1, B1) retained; Pair 2 on (A2, B2) sacrificed.",
            "gates_and_detectors": "Ideal local CNOT operations and ideal computational-basis detectors.",
            "parity_rule": "Acceptance conditioned strictly on matching measurement bits m_A == m_B.",
            "twirling_assumption": (
                "Idealized bilateral twirling maps the post-selected Bell-diagonal state to isotropic "
                "Werner form while preserving target Bell fidelity. In physical systems, twirling requires "
                "correlated random classical coordination and local Clifford gates with finite physical errors."
            ),
            "resource_cost": (
                "Each attempt strictly consumes 2 raw input pairs. Under independent Bernoulli trials, "
                "expected input pairs consumed per successful output pair is exactly E[N] = 2 / P_succ."
            ),
        },
    }


@router.post("/evaluate", response_model=PurificationEvaluateResponse)
def evaluate_purification(req: PurificationEvaluateRequest) -> PurificationEvaluateResponse:
    """Evaluate single-round BBPSSW purification for a given Werner quality or Bell fidelity."""
    w_val = _resolve_input_w(req.werner_w, req.bell_fidelity)
    ana = calculate_bbpssw_analytical(w_val)

    # Step-by-step worked numerical calculation breakdown
    f_in = ana.input_bell_fidelity
    p_succ = ana.success_probability
    f_out = ana.output_bell_fidelity
    w_out = ana.output_werner_w_twirled
    e_n = ana.expected_raw_pairs_consumed

    c1 = ana.output_bell_coefficients["Phi+"]
    c2 = ana.output_bell_coefficients["Phi-"]
    c3 = ana.output_bell_coefficients["Psi+"]
    c4 = ana.output_bell_coefficients["Psi-"]

    worked_example = {
        "step1_input": (
            f"Input Werner parameter w = {w_val:.4f} corresponds to initial Bell fidelity "
            f"F_in = (1 + 3w)/4 = {f_in:.4f} and Horodecki average teleportation fidelity F_tel = {ana.input_teleport_fidelity:.4f}."
        ),
        "step2_bilateral_cnot": (
            "Alice applies local CNOT(A1 -> A2) and Bob applies local CNOT(B1 -> B2). "
            "Both measure sacrificed qubits A2 and B2 in the Z basis, accepting iff m_A == m_B."
        ),
        "step3_success_probability": (
            f"Success probability P_succ = (w^2 + 1)/2 = ({w_val:.4f}^2 + 1)/2 = {p_succ:.6f} "
            f"({(p_succ * 100):.2f}% acceptance yield)."
        ),
        "step4_output_coefficients": (
            f"Raw Bell-diagonal output coefficients: c1 (|Φ+⟩) = {c1:.4f}, c2 (|Φ-⟩) = {c2:.4f}, "
            f"c3 (|Ψ+⟩) = {c3:.4f}, c4 (|Ψ-⟩) = {c4:.4f}. Notice c2 > c3 = c4 (anisotropic phase error)."
        ),
        "step5_purified_fidelity": (
            f"Output Bell fidelity F_out = c1 = {f_out:.6f}. Fidelity gain ΔF = {ana.fidelity_gain:+.6f} "
            f"({'SUCCESS: Purified' if ana.is_purified else 'FAILED: Sub-threshold degradation'})."
        ),
        "step6_resource_cost": (
            f"Expected raw input pairs consumed per successful output: E[N] = 2 / P_succ = "
            f"2 / {p_succ:.4f} = {e_n:.2f} pairs."
        ),
    }

    return PurificationEvaluateResponse(
        input_werner_w=ana.input_werner_w,
        input_bell_fidelity=ana.input_bell_fidelity,
        input_teleport_fidelity=ana.input_teleport_fidelity,
        success_probability=ana.success_probability,
        output_bell_coefficients=ana.output_bell_coefficients,
        output_bell_fidelity=ana.output_bell_fidelity,
        output_werner_w_twirled=ana.output_werner_w_twirled,
        output_teleport_fidelity=ana.output_teleport_fidelity,
        fidelity_gain=ana.fidelity_gain,
        is_purified=ana.is_purified,
        expected_raw_pairs_consumed=ana.expected_raw_pairs_consumed,
        threshold_fidelity=ana.threshold_fidelity,
        threshold_werner_w=ana.threshold_werner_w,
        apply_twirling=req.apply_twirling,
        worked_example=worked_example,
    )


@router.post("/sweep", response_model=PurificationSweepResponse)
def sweep_purification(req: PurificationSweepRequest) -> PurificationSweepResponse:
    """Generate parametric BBPSSW purification curves across the fidelity spectrum."""
    if req.min_fidelity >= req.max_fidelity:
        raise HTTPException(
            status_code=400,
            detail=f"min_fidelity ({req.min_fidelity}) must be strictly less than max_fidelity ({req.max_fidelity}).",
        )

    f_vals = np.linspace(req.min_fidelity, req.max_fidelity, req.num_points)
    points: List[PurificationSweepPoint] = []

    for f in f_vals:
        w_in = fidelity_to_werner_w(float(f))
        res = calculate_bbpssw_analytical(w_in)
        points.append(
            PurificationSweepPoint(
                fidelity_in=float(f),
                werner_w_in=w_in,
                fidelity_out=res.output_bell_fidelity,
                werner_w_out=res.output_werner_w_twirled,
                success_probability=res.success_probability,
                expected_pairs=res.expected_raw_pairs_consumed,
                is_purified=res.is_purified,
            )
        )

    return PurificationSweepResponse(points=points, threshold_fidelity=0.50)


@router.post("/simulate-shots", response_model=PurificationShotsResponse)
def simulate_purification_shots(req: PurificationShotsRequest) -> PurificationShotsResponse:
    """Run finite-shot Qiskit Aer simulation with proper accepted-sample uncertainty accounting."""
    w_val = _resolve_input_w(req.werner_w, req.bell_fidelity)
    shot_res = simulate_bbpssw_shots(w_val, shots=req.shots, seed=req.seed)
    ana = calculate_bbpssw_analytical(w_val)

    return PurificationShotsResponse(
        input_werner_w=shot_res.input_werner_w,
        input_bell_fidelity=shot_res.input_bell_fidelity,
        total_attempts=shot_res.total_attempts,
        accepted_attempts=shot_res.accepted_attempts,
        estimated_success_probability=shot_res.estimated_success_probability,
        success_probability_uncertainty=shot_res.success_probability_uncertainty,
        estimated_output_fidelity=shot_res.estimated_output_fidelity,
        output_fidelity_uncertainty=shot_res.output_fidelity_uncertainty,
        estimated_bell_coefficients=shot_res.estimated_bell_coefficients,
        expected_raw_pairs_consumed_estimate=shot_res.expected_raw_pairs_consumed_estimate,
        fidelity_reliable=shot_res.fidelity_reliable,
        warning_message=shot_res.warning_message,
        analytical_success_probability=ana.success_probability,
        analytical_output_fidelity=ana.output_bell_fidelity,
        analytical_expected_raw_pairs=ana.expected_raw_pairs_consumed,
    )
