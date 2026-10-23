"""State Analysis & Tomography API Router (QR-008).

Provides Pauli quantum state tomography with finite-shot Aer execution
and Stokes inversion for single-qubit density matrix reconstruction.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from qiskit import QuantumCircuit
from qiskit.quantum_info import DensityMatrix, Kraus
from quantumroute.teleport import prepare_input_state
from quantumroute.noise import depolarizing_error
from quantumroute.tomography import (
    execute_tomography,
    exact_bloch_vector,
)

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

PRESET_STATES: Dict[str, Tuple[float, float, str]] = {
    "zero": (0.0, 0.0, "|0⟩ (North Pole)"),
    "one": (math.pi, 0.0, "|1⟩ (South Pole)"),
    "plus": (math.pi / 2.0, 0.0, "|+⟩ (X-axis)"),
    "minus": (math.pi / 2.0, math.pi, "|-⟩ (-X-axis)"),
    "plus_i": (math.pi / 2.0, math.pi / 2.0, "|+i⟩ (Y-axis)"),
    "minus_i": (math.pi / 2.0, 3.0 * math.pi / 2.0, "|-i⟩ (-Y-axis)"),
}


class TomographyRequest(BaseModel):
    """Request payload for quantum state tomography."""

    preset: Optional[str] = Field("plus", description="Preset state label: zero, one, plus, minus, plus_i, minus_i, or custom")
    theta: Optional[float] = Field(None, ge=0.0, le=math.pi, description="Custom polar angle θ in [0, π]")
    phi: Optional[float] = Field(None, ge=0.0, le=2.0 * math.pi, description="Custom azimuthal angle φ in [0, 2π]")
    shots: int = Field(2048, ge=64, le=16384, description="Number of finite measurement shots per Pauli basis")
    depolarizing_p: float = Field(0.0, ge=0.0, le=1.0, description="Depolarizing channel error probability p ∈ [0, 1]")
    seed: Optional[int] = Field(42, description="Random seed for simulator reproducibility")


class TomographyResponse(BaseModel):
    """Response payload containing reconstructed density matrix and Bloch vector."""

    state_label: str
    theta: float
    phi: float
    shots: int
    depolarizing_p: float
    # Reconstructed Bloch vector
    rx: float
    ry: float
    rz: float
    bloch_radius: float
    # Theoretical Bloch vector
    theoretical_rx: float
    theoretical_ry: float
    theoretical_rz: float
    # Statistical uncertainties
    std_err_x: float
    std_err_y: float
    std_err_z: float
    # Metrics
    fidelity_with_target: float
    purity: float
    # Reconstructed 2x2 Density Matrix
    density_matrix_real: List[List[float]]
    density_matrix_imag: List[List[float]]


@router.get("/presets")
def get_presets():
    """List available canonical pure state presets for tomography."""
    return {
        "presets": [
            {"id": pid, "label": meta[2], "theta": meta[0], "phi": meta[1]}
            for pid, meta in PRESET_STATES.items()
        ]
    }


@router.post("/tomography", response_model=TomographyResponse)
def run_state_tomography(req: TomographyRequest) -> TomographyResponse:
    """Run finite-shot Pauli state tomography on single-qubit quantum state."""
    # Determine theta and phi
    if req.preset and req.preset.lower() in PRESET_STATES:
        th, ph, label = PRESET_STATES[req.preset.lower()]
    elif req.theta is not None and req.phi is not None:
        th = float(req.theta)
        ph = float(req.phi)
        label = f"Custom State (θ={th:.2f}, φ={ph:.2f})"
    else:
        th, ph, label = PRESET_STATES["plus"]

    try:
        # Build state preparation circuit
        qc = QuantumCircuit(1, name="state_prep")
        qc.ry(th, 0)
        qc.p(ph, 0)

        # Apply depolarizing noise if requested
        if req.depolarizing_p > 1e-9:
            k_depol = Kraus(depolarizing_error(req.depolarizing_p, 1))
            qc.append(k_depol, [0])

        # Target pure state density matrix
        target_sv = prepare_input_state(th, ph)
        target_dm = DensityMatrix(target_sv)
        th_rx, th_ry, th_rz = exact_bloch_vector(target_dm)

        # If noise was added, scale theoretical Bloch vector by (1 - p)
        if req.depolarizing_p > 1e-9:
            scale = 1.0 - req.depolarizing_p
            th_rx *= scale
            th_ry *= scale
            th_rz *= scale

        # Execute tomography
        tomo_res = execute_tomography(
            circuit=qc,
            target_qubit=0,
            shots=req.shots,
            seed=req.seed,
            target_density_matrix=target_dm,
        )

        dm_data = tomo_res.reconstructed_density_matrix.data

        return TomographyResponse(
            state_label=label,
            theta=th,
            phi=ph,
            shots=req.shots,
            depolarizing_p=req.depolarizing_p,
            rx=tomo_res.rx,
            ry=tomo_res.ry,
            rz=tomo_res.rz,
            bloch_radius=tomo_res.bloch_radius,
            theoretical_rx=float(th_rx),
            theoretical_ry=float(th_ry),
            theoretical_rz=float(th_rz),
            std_err_x=tomo_res.std_err_x,
            std_err_y=tomo_res.std_err_y,
            std_err_z=tomo_res.std_err_z,
            fidelity_with_target=float(tomo_res.fidelity_with_target or 1.0),
            purity=float(tomo_res.purity),
            density_matrix_real=np.real(dm_data).tolist(),
            density_matrix_imag=np.imag(dm_data).tolist(),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Tomography simulation failed: {str(exc)}"
        )
