"""Validation harness comparing analytical Werner path predictions with circuit simulations (QR-006)."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Sequence, Any
import numpy as np
import networkx as nx

from quantumroute.network import (
    calculate_path_metrics,
    bell_state_fidelity,
    calculate_average_teleportation_fidelity,
)
from quantumroute.swapping import (
    simulate_swapping_chain,
    calculate_end_to_end_bell_fidelity,
)
from quantumroute.noise import (
    make_depolarizing_channel,
    get_analytical_depolarizing_fidelity,
)
from quantumroute.teleport import (
    prepare_input_state,
    calculate_state_fidelity,
    teleport_rho,
)


DOCUMENTED_ASSUMPTIONS = [
    "Isotropic Werner-state link representation: ρ_W(w) = w |Φ+⟩⟨Φ+| + (1-w)(I_4/4)",
    "Projective Bell-state measurements at intermediate repeater nodes",
    "Ideal coherent feedforward corrections (ADR-002 deferred measurement)",
    "Negligible quantum memory decoherence during swapping intervals",
    "Independent, uncorrelated noise across different physical links",
]


@dataclass(frozen=True)
class ValidationResult:
    """Structured report comparing analytical model against quantum circuit simulation."""
    path: list[Any]
    hop_count: int
    link_werner_parameters: list[float]
    w_analytical: float
    f_bell_predicted: float
    f_bell_simulated: float
    f_tel_predicted: float
    f_tel_simulated: float
    bell_delta: float
    tolerance: float
    is_valid: bool
    classical_limit: float
    beats_classical: bool
    assumptions: list[str]
    status: str

    def to_dict(self) -> dict[str, Any]:
        """Convert result to dictionary representation."""
        return asdict(self)


def compare_model_and_simulation(
    graph: nx.Graph,
    path: Sequence[Any],
    tolerance: float = 1e-4,
) -> ValidationResult:
    """Compare analytical Werner-model predictions against quantum circuit simulation.

    Args:
        graph: NetworkX graph with edge attribute 'w'.
        path: Ordered list of nodes forming a valid simple path.
        tolerance: Maximum acceptable absolute difference between analytical and simulated fidelity.

    Returns:
        ValidationResult: Detailed comparison report.

    Raises:
        ValueError: If path has fewer than 2 nodes or edges lack valid 'w'.
        KeyError: If a node or edge does not exist in graph.
    """
    if len(path) < 2:
        raise ValueError(f"Path must contain at least 2 nodes (source and destination), got {path}")

    # Extract edge Werner parameters along the path
    link_w: list[float] = []
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        if not graph.has_edge(u, v):
            raise ValueError(f"Graph does not contain edge between {u} and {v}.")
        edge_data = graph.get_edge_data(u, v)
        if "w" not in edge_data:
            raise KeyError(f"Edge ({u}, {v}) missing Werner parameter 'w'.")
        w_val = float(edge_data["w"])
        if not (0.0 <= w_val <= 1.0):
            raise ValueError(f"Invalid Werner parameter on edge ({u}, {v}): {w_val}")
        link_w.append(w_val)

    # 1. Analytical Evaluation via quantumroute.network
    metrics = calculate_path_metrics(graph, path)
    w_pred = float(metrics.werner_parameter)
    f_bell_pred = float(metrics.bell_fidelity)
    f_tel_pred = float(metrics.average_teleportation_fidelity)

    # 2. Quantum Circuit Simulation via quantumroute.swapping
    end_to_end_dm = simulate_swapping_chain(link_w)
    f_bell_sim = float(calculate_end_to_end_bell_fidelity(end_to_end_dm))
    f_tel_sim = float(calculate_average_teleportation_fidelity(f_bell_sim))

    # 3. Precision Validation & Delta Comparison
    bell_delta = float(abs(f_bell_pred - f_bell_sim))
    is_valid = bool(bell_delta <= tolerance)
    status = "PASSED" if is_valid else "DISCREPANCY"
    classical_bound = 2.0 / 3.0
    beats_classical = bool(f_tel_sim > classical_bound)

    return ValidationResult(
        path=list(path),
        hop_count=len(link_w),
        link_werner_parameters=link_w,
        w_analytical=w_pred,
        f_bell_predicted=f_bell_pred,
        f_bell_simulated=f_bell_sim,
        f_tel_predicted=f_tel_pred,
        f_tel_simulated=f_tel_sim,
        bell_delta=bell_delta,
        tolerance=tolerance,
        is_valid=is_valid,
        classical_limit=classical_bound,
        beats_classical=beats_classical,
        assumptions=list(DOCUMENTED_ASSUMPTIONS),
        status=status,
    )


def compare_predicted_vs_simulated(
    graph: nx.Graph,
    path: Sequence[Any],
    tolerance: float = 1e-4,
) -> dict[str, Any]:
    """Compatibility dictionary wrapper for compare_model_and_simulation."""
    result = compare_model_and_simulation(graph, path, tolerance)
    return result.to_dict()


def validate_noise_model(
    p_sweep: Sequence[float] = None,
    tolerance: float = 1e-4,
) -> list[dict[str, Any]]:
    """Validate depolarizing noise channel simulation against theoretical fidelity:

    Theory: F = 1 - p / 2
    """
    if p_sweep is None:
        p_sweep = np.linspace(0.0, 1.0, 21)

    records = []
    # Test on arbitrary pure state |+⟩ = (|0⟩ + |1⟩)/√2 (θ = π/2, φ = 0)
    theta = np.pi / 2.0
    phi = 0.0
    target_sv = prepare_input_state(theta, phi)

    for p in p_sweep:
        p_float = float(p)
        f_theory = float(get_analytical_depolarizing_fidelity(p_float))

        # Execute teleportation with depolarizing link noise
        noise_channel = make_depolarizing_channel(p_float)
        rho_bob = teleport_rho(theta, phi, link_error=noise_channel)
        f_sim = float(calculate_state_fidelity(target_sv, rho_bob))

        delta = float(abs(f_theory - f_sim))
        records.append({
            "p": p_float,
            "f_theory": f_theory,
            "f_sim": f_sim,
            "delta": delta,
            "is_valid": bool(delta <= tolerance),
            "classical_bound": 2.0 / 3.0,
            "beats_classical": bool(f_sim > (2.0 / 3.0)),
        })

    return records
