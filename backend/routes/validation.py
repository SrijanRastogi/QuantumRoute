"""Validation Engine API Router (QR-006).

Exposes analytical-versus-simulation validation harness to verify Werner path
composition and noise models against Qiskit Aer simulation.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
import networkx as nx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from quantumroute.validate import (
    compare_model_and_simulation,
    validate_noise_model,
    DOCUMENTED_ASSUMPTIONS,
    ValidationResult,
)
from quantumroute.swapping import simulate_swapping_chain, calculate_end_to_end_bell_fidelity
from quantumroute.network import calculate_average_teleportation_fidelity

router = APIRouter(prefix="/api/validation", tags=["validation"])


class CustomValidationRequest(BaseModel):
    """Request to validate a custom multi-hop path."""

    path_name: str = Field("Custom Multi-Hop Path", description="Descriptive path label")
    link_werner_parameters: List[float] = Field(
        ...,
        min_length=1,
        max_length=8,
        description="List of link Werner parameters w_e ∈ [0, 1] for each hop",
    )
    tolerance: float = Field(
        1e-4,
        gt=0.0,
        le=0.1,
        description="Maximum permissible absolute fidelity delta |F_analytical - F_simulated|",
    )


class ValidationBenchmarkItem(BaseModel):
    """Individual benchmark test result comparing analytical prediction against circuit simulation."""

    test_id: str
    name: str
    description: str
    hop_count: int
    link_werner_parameters: List[float]
    w_analytical: float
    f_bell_predicted: float
    f_bell_simulated: float
    f_tel_predicted: float
    f_tel_simulated: float
    bell_delta: float
    tolerance: float
    is_valid: bool
    status: str
    beats_classical: bool
    circuit_qubits: int


class NoiseValidationPoint(BaseModel):
    """Single data point in depolarizing noise model validation sweep."""

    p: float
    f_theory: float
    f_sim: float
    delta: float
    is_valid: bool
    beats_classical: bool


class BenchmarkSuiteResponse(BaseModel):
    """Full benchmark suite execution summary."""

    timestamp: str
    tolerance: float
    overall_status: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    max_observed_residual: float
    benchmarks: List[ValidationBenchmarkItem]
    noise_sweep: List[NoiseValidationPoint]
    assumptions: List[str]


@router.get("/benchmarks", response_model=BenchmarkSuiteResponse)
def run_validation_benchmarks(
    tolerance: float = Query(1e-4, ge=1e-8, le=1e-2, description="Comparison tolerance")
) -> BenchmarkSuiteResponse:
    """Run standard multi-hop Werner path and depolarizing noise validation benchmarks."""
    import datetime

    # Standard benchmark suites across varying hop counts
    test_cases = [
        {
            "id": "hop_1_standard",
            "name": "1-Hop Direct Entanglement Link",
            "desc": "Single Bell pair link with moderate Werner noise",
            "weights": [0.90],
        },
        {
            "id": "hop_2_repeater",
            "name": "2-Hop Repeater Chain (Alice ➔ R1 ➔ Bob)",
            "desc": "Single intermediate entanglement swapping operation",
            "weights": [0.92, 0.88],
        },
        {
            "id": "hop_3_chain",
            "name": "3-Hop Repeater Chain (Alice ➔ R1 ➔ R2 ➔ Bob)",
            "desc": "Two intermediate entanglement swapping operations",
            "weights": [0.95, 0.90, 0.85],
        },
        {
            "id": "hop_4_deep",
            "name": "4-Hop Deep Network Chain (4 Repeater Links)",
            "desc": "Three intermediate entanglement swapping stages",
            "weights": [0.98, 0.95, 0.92, 0.90],
        },
        {
            "id": "hop_2_high_loss",
            "name": "2-Hop Degraded High-Loss Links",
            "desc": "Low Werner parameters testing boundary threshold behavior",
            "weights": [0.60, 0.55],
        },
    ]

    benchmark_items: List[ValidationBenchmarkItem] = []
    max_res = 0.0

    for tc in test_cases:
        weights = tc["weights"]
        n_hops = len(weights)
        
        # Build ephemeral NetworkX line graph
        G = nx.Graph()
        nodes = [f"N{i}" for i in range(n_hops + 1)]
        for i in range(n_hops):
            G.add_edge(nodes[i], nodes[i + 1], w=weights[i])

        # Execute validated comparison engine
        val_res: ValidationResult = compare_model_and_simulation(G, nodes, tolerance=tolerance)
        delta = float(val_res.bell_delta)
        if delta > max_res:
            max_res = delta

        benchmark_items.append(
            ValidationBenchmarkItem(
                test_id=tc["id"],
                name=tc["name"],
                description=tc["desc"],
                hop_count=n_hops,
                link_werner_parameters=weights,
                w_analytical=val_res.w_analytical,
                f_bell_predicted=val_res.f_bell_predicted,
                f_bell_simulated=val_res.f_bell_simulated,
                f_tel_predicted=val_res.f_tel_predicted,
                f_tel_simulated=val_res.f_tel_simulated,
                bell_delta=delta,
                tolerance=tolerance,
                is_valid=val_res.is_valid,
                status=val_res.status,
                beats_classical=val_res.beats_classical,
                circuit_qubits=2 * n_hops,
            )
        )

    # Run Depolarizing Noise Sweep
    noise_records = validate_noise_model(tolerance=tolerance)
    noise_points = [
        NoiseValidationPoint(
            p=r["p"],
            f_theory=r["f_theory"],
            f_sim=r["f_sim"],
            delta=r["delta"],
            is_valid=r["is_valid"],
            beats_classical=r["beats_classical"],
        )
        for r in noise_records
    ]

    total_benchmarks = len(benchmark_items)
    passed_benchmarks = sum(1 for b in benchmark_items if b.is_valid)
    overall_status = "ALL_PASSED" if passed_benchmarks == total_benchmarks else "FAILED"

    return BenchmarkSuiteResponse(
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        tolerance=tolerance,
        overall_status=overall_status,
        total_tests=total_benchmarks,
        passed_tests=passed_benchmarks,
        failed_tests=total_benchmarks - passed_benchmarks,
        max_observed_residual=max_res,
        benchmarks=benchmark_items,
        noise_sweep=noise_points,
        assumptions=list(DOCUMENTED_ASSUMPTIONS),
    )


@router.post("/custom", response_model=ValidationBenchmarkItem)
def run_custom_validation(req: CustomValidationRequest) -> ValidationBenchmarkItem:
    """Validate a custom path specified by explicit Werner parameters."""
    for w in req.link_werner_parameters:
        if not (0.0 <= w <= 1.0):
            raise HTTPException(
                status_code=400,
                detail=f"Werner parameter w={w} out of bounds. All w must be in [0.0, 1.0].",
            )

    n_hops = len(req.link_werner_parameters)
    G = nx.Graph()
    nodes = [f"Node_{i}" for i in range(n_hops + 1)]
    for i in range(n_hops):
        G.add_edge(nodes[i], nodes[i + 1], w=req.link_werner_parameters[i])

    try:
        val_res = compare_model_and_simulation(G, nodes, tolerance=req.tolerance)
        return ValidationBenchmarkItem(
            test_id="custom_user_path",
            name=req.path_name,
            description=f"User-specified {n_hops}-hop custom route",
            hop_count=n_hops,
            link_werner_parameters=req.link_werner_parameters,
            w_analytical=val_res.w_analytical,
            f_bell_predicted=val_res.f_bell_predicted,
            f_bell_simulated=val_res.f_bell_simulated,
            f_tel_predicted=val_res.f_tel_predicted,
            f_tel_simulated=val_res.f_tel_simulated,
            bell_delta=val_res.bell_delta,
            tolerance=req.tolerance,
            is_valid=val_res.is_valid,
            status=val_res.status,
            beats_classical=val_res.beats_classical,
            circuit_qubits=2 * n_hops,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Custom validation execution failed: {str(exc)}"
        )
