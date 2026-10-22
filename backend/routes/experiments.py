"""Guided Quantum Experiments API Route for QuantumRoute V2.

Provides endpoints for:
1. Preset single-qubit quantum states (|0>, |1>, |+>, |->, |+i>, |-i>).
2. Custom single-qubit state evaluation (theta, phi) via Statevector and Bloch coordinates.
3. Actual Qiskit teleportation circuit execution with optional depolarizing noise and finite-shot tomography.
4. Theoretical and simulated depolarizing noise sweeps across the Werner parameter space.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional
import numpy as np
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from quantumroute.teleport import (
    prepare_input_state,
    build_teleportation_circuit,
    extract_bob_density_matrix,
    calculate_state_fidelity,
)
from quantumroute.noise import (
    get_analytical_depolarizing_fidelity,
    get_werner_parameter_from_noise,
)
from quantumroute.tomography import (
    exact_bloch_vector,
    execute_tomography,
    reconstruct_density_matrix,
)
from qiskit.quantum_info import DensityMatrix

router = APIRouter(prefix="/api/experiments", tags=["experiments"])

# Canonical preset states definitions
PRESET_STATES: List[Dict[str, Any]] = [
    {
        "id": "zero",
        "symbol": "|0⟩",
        "label": "Ground State |0⟩",
        "theta": 0.0,
        "phi": 0.0,
        "bloch_vector": [0.0, 0.0, 1.0],
        "basis": "Computational Basis (Z+)",
        "description": "North pole of the Bloch sphere. Standard computational basis ground state |0⟩. Pure state with Pauli-Z expectation value +1.",
    },
    {
        "id": "one",
        "symbol": "|1⟩",
        "label": "Excited State |1⟩",
        "theta": float(np.pi),
        "phi": 0.0,
        "bloch_vector": [0.0, 0.0, -1.0],
        "basis": "Computational Basis (Z-)",
        "description": "South pole of the Bloch sphere. Standard computational basis excited state |1⟩. Pure state with Pauli-Z expectation value -1.",
    },
    {
        "id": "plus",
        "symbol": "|+⟩",
        "label": "Superposition |+⟩",
        "theta": float(np.pi / 2.0),
        "phi": 0.0,
        "bloch_vector": [1.0, 0.0, 0.0],
        "basis": "Hadamard / Pauli-X Basis (X+)",
        "description": "Equator on +X axis. Equal superposition (|0⟩ + |1⟩)/√2 created by applying a Hadamard gate to |0⟩. Zero relative phase.",
    },
    {
        "id": "minus",
        "symbol": "|-⟩",
        "label": "Phase Flip |-⟩",
        "theta": float(np.pi / 2.0),
        "phi": float(np.pi),
        "bloch_vector": [-1.0, 0.0, 0.0],
        "basis": "Hadamard / Pauli-X Basis (X-)",
        "description": "Equator on -X axis. Equal superposition (|0⟩ - |1⟩)/√2 created by applying H followed by Z. Relative phase of π radians (180°).",
    },
    {
        "id": "plus_i",
        "symbol": "|+i⟩",
        "label": "Circular |+i⟩",
        "theta": float(np.pi / 2.0),
        "phi": float(np.pi / 2.0),
        "bloch_vector": [0.0, 1.0, 0.0],
        "basis": "Circular / Pauli-Y Basis (Y+)",
        "description": "Equator on +Y axis. Superposition (|0⟩ + i|1⟩)/√2 with a +π/2 (90°) relative phase. Eigenstate of Pauli-Y with eigenvalue +1.",
    },
    {
        "id": "minus_i",
        "symbol": "|-i⟩",
        "label": "Circular |-i⟩",
        "theta": float(np.pi / 2.0),
        "phi": float(3.0 * np.pi / 2.0),
        "bloch_vector": [0.0, -1.0, 0.0],
        "basis": "Circular / Pauli-Y Basis (Y-)",
        "description": "Equator on -Y axis. Superposition (|0⟩ - i|1⟩)/√2 with a 3π/2 (-90°) relative phase. Eigenstate of Pauli-Y with eigenvalue -1.",
    },
]


class StatePrepRequest(BaseModel):
    """Request to prepare and characterize a pure single-qubit quantum state."""
    theta: float = Field(..., ge=-1e-4, le=math.pi + 1e-4, description="Polar angle in radians [0, π]")
    phi: float = Field(..., ge=-1e-4, le=2.0 * math.pi + 1e-4, description="Azimuthal angle in radians [0, 2π]")


class TeleportExperimentRequest(BaseModel):
    """Request to run actual Qiskit teleportation circuit with optional noise."""
    theta: float = Field(0.0, ge=-1e-4, le=math.pi + 1e-4, description="Polar angle in radians [0, π]")
    phi: float = Field(0.0, ge=-1e-4, le=2.0 * math.pi + 1e-4, description="Azimuthal angle in radians [0, 2π]")
    noise_p: float = Field(0.0, ge=0.0, le=1.0, description="Depolarizing noise parameter p in [0.0, 1.0]")
    shots: Optional[int] = Field(None, ge=100, le=50000, description="Optional finite shots for Pauli state tomography")


class NoiseSweepRequest(BaseModel):
    """Request to run a parameter sweep of depolarizing noise."""
    theta: float = Field(0.0, ge=-1e-4, le=math.pi + 1e-4)
    phi: float = Field(0.0, ge=-1e-4, le=2.0 * math.pi + 1e-4)
    p_min: float = Field(0.0, ge=0.0, le=1.0)
    p_max: float = Field(0.75, ge=0.0, le=1.0)
    num_points: int = Field(16, ge=4, le=51)


def _format_dm(dm: DensityMatrix) -> Dict[str, List[List[float]]]:
    """Helper to format a 2x2 DensityMatrix into serializable real and imaginary parts."""
    arr = dm.data
    real_part = [[float(np.real(arr[r, c])) for c in range(2)] for r in range(2)]
    imag_part = [[float(np.imag(arr[r, c])) for c in range(2)] for r in range(2)]
    return {"real": real_part, "imag": imag_part}


@router.get("/presets")
def get_presets() -> List[Dict[str, Any]]:
    """Return the list of all supported canonical single-qubit preset states."""
    return PRESET_STATES


@router.post("/state")
def prepare_state_endpoint(req: StatePrepRequest) -> Dict[str, Any]:
    """Evaluate and characterize a pure single-qubit quantum state from (theta, phi)."""
    # Clamp small numerical tolerances
    theta = float(np.clip(req.theta, 0.0, np.pi))
    phi = float(np.clip(req.phi, 0.0, 2.0 * np.pi))

    try:
        sv = prepare_input_state(theta, phi)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to prepare state: {str(e)}")

    dm = DensityMatrix(sv)
    rx, ry, rz = exact_bloch_vector(dm)
    alpha = sv.data[0]
    beta = sv.data[1]

    return {
        "theta": theta,
        "phi": phi,
        "bloch_vector": [float(rx), float(ry), float(rz)],
        "bloch_radius": float(np.sqrt(rx ** 2 + ry ** 2 + rz ** 2)),
        "purity": 1.0,
        "density_matrix": _format_dm(dm),
        "amplitudes": {
            "alpha": [float(np.real(alpha)), float(np.imag(alpha))],
            "beta": [float(np.real(beta)), float(np.imag(beta))],
        },
        "formula": f"|ψ⟩ = {alpha.real:.3f}|0⟩ + ({beta.real:.3f} + {beta.imag:.3f}i)|1⟩",
    }


class CartesianStateRequest(BaseModel):
    """Request to evaluate and validate a state given Cartesian coordinates (x, y, z)."""
    x: float = Field(..., description="Pauli-X expectation value")
    y: float = Field(..., description="Pauli-Y expectation value")
    z: float = Field(..., description="Pauli-Z expectation value")
    is_mixed: bool = Field(False, description="Allow mixed states with norm <= 1.0")


@router.post("/cartesian")
def prepare_cartesian_state_endpoint(req: CartesianStateRequest) -> Dict[str, Any]:
    """Evaluate, validate, and characterize a quantum state from Cartesian coordinates (x, y, z)."""
    x, y, z = float(req.x), float(req.y), float(req.z)

    if math.isnan(x) or math.isnan(y) or math.isnan(z) or math.isinf(x) or math.isinf(y) or math.isinf(z):
        raise HTTPException(status_code=400, detail="Coordinates must be finite real numbers.")

    r = float(np.sqrt(x ** 2 + y ** 2 + z ** 2))

    # Calculate normalized coordinates
    if r > 1e-12:
        norm_x, norm_y, norm_z = x / r, y / r, z / r
    else:
        norm_x, norm_y, norm_z = 0.0, 0.0, 1.0

    # Spherical angles derivation
    theta = float(np.arccos(np.clip(norm_z, -1.0, 1.0)))

    # Stable pole handling convention:
    # At poles (|0> or |1>), phi is mathematically undefined; convention is phi = 0.0
    if norm_z >= 1.0 - 1e-6 or norm_z <= -1.0 + 1e-6 or math.hypot(norm_x, norm_y) < 1e-6:
        phi = 0.0
    else:
        phi = float(np.arctan2(norm_y, norm_x))
        if phi < 0.0:
            phi += 2.0 * math.pi

    # Validation
    if not req.is_mixed:
        is_valid = bool(abs(r - 1.0) <= 0.01)
        error_msg = None if is_valid else f"Pure states require x² + y² + z² = 1 (current norm: {r:.4f})."
    else:
        is_valid = bool(r <= 1.005)
        error_msg = None if is_valid else f"Physical density matrices require norm ≤ 1.0 (current norm: {r:.4f})."

    # Reconstruct density matrix
    dm = reconstruct_density_matrix(x, y, z, physical_projection=True if r > 1.0 else False)
    purity = float(np.real(dm.purity()))

    # Amplitudes calculation (for pure state or normalized equivalent)
    alpha = float(np.cos(theta / 2.0))
    beta_re = float(np.cos(phi) * np.sin(theta / 2.0))
    beta_im = float(np.sin(phi) * np.sin(theta / 2.0))

    return {
        "x": x,
        "y": y,
        "z": z,
        "radius": r,
        "is_valid": is_valid,
        "validation_message": error_msg,
        "theta": theta,
        "phi": phi,
        "normalized": [norm_x, norm_y, norm_z],
        "is_mixed": req.is_mixed,
        "purity": purity,
        "density_matrix": _format_dm(dm),
        "amplitudes": {
            "alpha": [alpha, 0.0],
            "beta": [beta_re, beta_im],
        },
        "formula": f"|ψ⟩ = {alpha:.3f}|0⟩ + ({beta_re:.3f} + {beta_im:.3f}i)|1⟩",
    }


@router.post("/teleport")
def run_teleport_experiment(req: TeleportExperimentRequest) -> Dict[str, Any]:
    """Execute the actual Qiskit teleportation circuit and return computed quantum metrics.
    
    Performs:
    1. Input pure state preparation: |ψ(θ, φ)⟩ on q0.
    2. Shared Bell pair generation: |Φ+⟩ on (q1, q2).
    3. Link noise insertion: Depolarizing error p on q2 (Werner link w = 1 - p).
    4. Alice's Bell-basis measurement and coherent feedforward corrections (CX, CZ).
    5. Subsystem extraction: Traces out Alice's qubits (q0, q1) to obtain Bob's exact reduced state on q2.
    6. Optional finite-shot Pauli state tomography (4096 shots) to demonstrate finite-shot statistical noise.
    """
    theta = float(np.clip(req.theta, 0.0, np.pi))
    phi = float(np.clip(req.phi, 0.0, 2.0 * np.pi))
    noise_p = float(np.clip(req.noise_p, 0.0, 1.0))

    try:
        # Step 1: Input reference state
        target_sv = prepare_input_state(theta, phi)
        target_dm = DensityMatrix(target_sv)
        rx_in, ry_in, rz_in = exact_bloch_vector(target_dm)

        # Step 2 & 3: Qiskit 3-qubit teleportation circuit
        link_noise = noise_p if noise_p > 0.0 else None
        circuit = build_teleportation_circuit((theta, phi), link_error=link_noise)

        # Step 4: Extract Bob's exact reduced density matrix via partial trace
        rho_bob = extract_bob_density_matrix(circuit)
        rx_out, ry_out, rz_out = exact_bloch_vector(rho_bob)
        radius_out = float(np.sqrt(rx_out ** 2 + ry_out ** 2 + rz_out ** 2))
        purity_out = float(np.real(rho_bob.purity()))

        # Step 5: Fidelity calculations
        simulated_fidelity = calculate_state_fidelity(target_dm, rho_bob)
        theoretical_fidelity = get_analytical_depolarizing_fidelity(noise_p)
        discrepancy = abs(simulated_fidelity - theoretical_fidelity)

        werner_w = get_werner_parameter_from_noise(noise_p)
        bell_fidelity = (1.0 + 3.0 * werner_w) / 4.0

        # Step 6: Circuit metadata
        ops_dict = dict(circuit.count_ops())
        qasm_str = ""
        try:
            from qiskit import qasm2
            qasm_str = qasm2.dumps(circuit)
        except Exception:
            qasm_str = str(circuit)

        # Step 7: Optional finite-shot tomography for educational contrast
        tomography_data = None
        if req.shots is not None and req.shots > 0:
            shots_val = int(req.shots)
            tomo_res = execute_tomography(
                circuit,
                target_qubit=2,
                shots=shots_val,
                seed=42,
                target_density_matrix=target_dm,
            )
            tomography_data = {
                "shots": shots_val,
                "empirical_bloch_vector": [float(tomo_res.rx), float(tomo_res.ry), float(tomo_res.rz)],
                "empirical_radius": float(tomo_res.bloch_radius),
                "empirical_fidelity": float(tomo_res.fidelity_with_target) if tomo_res.fidelity_with_target else None,
                "purity": float(tomo_res.purity),
                "std_errors": {
                    "x": float(tomo_res.std_err_x),
                    "y": float(tomo_res.std_err_y),
                    "z": float(tomo_res.std_err_z),
                },
                "density_matrix": _format_dm(tomo_res.reconstructed_density_matrix),
            }

        # Step 8: Guided 5-step breakdown
        guided_steps = [
            {
                "step": 1,
                "title": "State Preparation",
                "qubit": "q0 (Alice)",
                "detail": f"Prepared pure state |ψ⟩ at polar angle θ={theta:.3f} rad ({theta * 180 / np.pi:.1f}°), azimuthal angle φ={phi:.3f} rad ({phi * 180 / np.pi:.1f}°).",
                "bloch_coords": [round(rx_in, 4), round(ry_in, 4), round(rz_in, 4)],
            },
            {
                "step": 2,
                "title": "Entanglement Distribution & Link Noise",
                "qubit": "q1 (Alice) & q2 (Bob)",
                "detail": f"Created canonical Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2 via H(q1) and CX(q1, q2). Link depolarizing noise p={noise_p:.3f} yielded Werner parameter w={werner_w:.3f} and Bell fidelity Fe={bell_fidelity:.3f}.",
                "bloch_coords": None,
            },
            {
                "step": 3,
                "title": "Alice's Bell-State Measurement",
                "qubit": "q0 & q1 (Alice)",
                "detail": "Alice applied CNOT(q0 → q1) and Hadamard H(q0), projecting her two qubits into the Bell basis and entangling the message with the shared channel.",
                "bloch_coords": None,
            },
            {
                "step": 4,
                "title": "Coherent Feedforward Corrections",
                "qubit": "q2 (Bob)",
                "detail": "In accordance with ADR-002, coherent feedforward corrections CX(q1, q2) and CZ(q0, q2) map Alice's measurement outcomes directly onto Bob's qubit without mid-circuit collapse, reproducing the exact post-correction quantum ensemble.",
                "bloch_coords": None,
            },
            {
                "step": 5,
                "title": "Subsystem Reconstruction & Verification",
                "qubit": "q2 (Bob)",
                "detail": f"Tracing out Alice's qubits leaves Bob's state with fidelity F={simulated_fidelity:.4f}. Theoretical prediction F_theo = 1 - p/2 = {theoretical_fidelity:.4f}. {'Quantum teleportation advantage holds (F > 2/3).' if simulated_fidelity > 2.0 / 3.0 else 'Classical limit reached (F ≤ 2/3): quantum entanglement advantage lost.'}",
                "bloch_coords": [round(rx_out, 4), round(ry_out, 4), round(rz_out, 4)],
            },
        ]

        return {
            "input_state": {
                "theta": theta,
                "phi": phi,
                "bloch_vector": [float(rx_in), float(ry_in), float(rz_in)],
                "bloch_radius": 1.0,
                "density_matrix": _format_dm(target_dm),
            },
            "noise_parameter": noise_p,
            "werner_parameter": werner_w,
            "bell_fidelity": bell_fidelity,
            "output_state": {
                "bloch_vector": [float(rx_out), float(ry_out), float(rz_out)],
                "bloch_radius": radius_out,
                "purity": purity_out,
                "density_matrix": _format_dm(rho_bob),
            },
            "metrics": {
                "state_fidelity": float(simulated_fidelity),
                "theoretical_fidelity": float(theoretical_fidelity),
                "fidelity_discrepancy": float(discrepancy),
                "classical_threshold": 2.0 / 3.0,
                "has_quantum_advantage": bool(simulated_fidelity > (2.0 / 3.0)),
            },
            "circuit": {
                "num_qubits": 3,
                "depth": circuit.depth(),
                "ops_count": ops_dict,
                "qasm": qasm_str,
            },
            "guided_steps": guided_steps,
            "tomography": tomography_data,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Teleportation experiment failed: {str(e)}")


@router.post("/noise-sweep")
def run_noise_sweep(req: NoiseSweepRequest) -> Dict[str, Any]:
    """Execute a parameter sweep of depolarizing noise across the Werner parameter space.
    
    Computes both the theoretical prediction (F = 1 - p/2) and exact Qiskit simulated state fidelity
    for the selected state, returning points for responsive chart visualization.
    """
    if req.p_min >= req.p_max:
        raise HTTPException(status_code=400, detail="p_min must be strictly less than p_max")
    
    theta = float(np.clip(req.theta, 0.0, np.pi))
    phi = float(np.clip(req.phi, 0.0, 2.0 * np.pi))
    target_sv = prepare_input_state(theta, phi)
    target_dm = DensityMatrix(target_sv)

    p_values = np.linspace(req.p_min, req.p_max, req.num_points).tolist()
    points: List[Dict[str, Any]] = []

    for p in p_values:
        p_val = float(p)
        theo_f = float(get_analytical_depolarizing_fidelity(p_val))
        werner_w = float(get_werner_parameter_from_noise(p_val))
        bell_f = float((1.0 + 3.0 * werner_w) / 4.0)

        # Simulation
        qc = build_teleportation_circuit((theta, phi), link_error=p_val)
        rho_bob = extract_bob_density_matrix(qc)
        sim_f = float(calculate_state_fidelity(target_dm, rho_bob))
        rx, ry, rz = exact_bloch_vector(rho_bob)
        radius = float(np.sqrt(rx ** 2 + ry ** 2 + rz ** 2))
        purity = float(np.real(rho_bob.purity()))

        points.append({
            "noise_p": p_val,
            "werner_w": werner_w,
            "bell_fidelity": bell_f,
            "state_fidelity": sim_f,
            "theoretical_fidelity": theo_f,
            "discrepancy": abs(sim_f - theo_f),
            "bloch_radius": radius,
            "purity": purity,
            "has_quantum_advantage": bool(sim_f > 2.0 / 3.0),
        })

    max_discrepancy = max(pt["discrepancy"] for pt in points) if points else 0.0

    return {
        "theta": theta,
        "phi": phi,
        "classical_threshold": 2.0 / 3.0,
        "max_discrepancy": float(max_discrepancy),
        "points": points,
        "explanation": (
            "Depolarizing noise on the distributed entangled link shrinks Bob's received Bloch vector "
            "isotropically: r_out = (1 - p) * r_in. The state fidelity degrades linearly as F(p) = 1 - p / 2. "
            "When noise parameter p > 2/3 (≈ 0.667), fidelity falls below the classical measure-and-prepare "
            "threshold F_classical = 2/3, terminating genuine quantum advantage."
        ),
    }
