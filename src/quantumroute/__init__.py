"""QuantumRoute — Noise-Aware Quantum Communication & Entanglement-Based Teleportation.

Quantum D Clan · VTU-QFF-HC-0126
VTU-Qiskit Fall Fest 2026
"""

from quantumroute.teleport import (
    input_state,
    prepare_input_state,
    create_bell_pair,
    build_teleportation_circuit,
    extract_bob_density_matrix,
    calculate_state_fidelity,
    teleport_rho,
)
from quantumroute.noise import (
    make_depolarizing_channel,
    get_analytical_depolarizing_fidelity,
    get_werner_parameter_from_noise,
    depolarizing_noise_sweep,
)
from quantumroute.network import (
    PathMetrics,
    validate_werner_parameter,
    bell_state_fidelity,
    calculate_predicted_path_fidelity,
    calculate_average_teleportation_fidelity,
    path_parameter,
    path_metrics,
    calculate_path_werner_parameter,
    calculate_path_metrics,
    create_topology,
)
from quantumroute.routing import (
    RouteResult,
    find_shortest_hop_route,
    find_quality_aware_route,
    shortest_hop_path,
    quality_aware_path,
    compare_routes,
    exhaustive_quality_route,
)

__version__ = "0.1.0"

__all__ = [
    # Teleportation core
    "input_state",
    "prepare_input_state",
    "create_bell_pair",
    "build_teleportation_circuit",
    "extract_bob_density_matrix",
    "calculate_state_fidelity",
    "teleport_rho",
    # Noise model
    "make_depolarizing_channel",
    "get_analytical_depolarizing_fidelity",
    "get_werner_parameter_from_noise",
    "depolarizing_noise_sweep",
    # Network and Werner model
    "PathMetrics",
    "validate_werner_parameter",
    "bell_state_fidelity",
    "calculate_predicted_path_fidelity",
    "calculate_average_teleportation_fidelity",
    "path_parameter",
    "path_metrics",
    "calculate_path_werner_parameter",
    "calculate_path_metrics",
    "create_topology",
    # Routing algorithms
    "RouteResult",
    "find_shortest_hop_route",
    "find_quality_aware_route",
    "shortest_hop_path",
    "quality_aware_path",
    "compare_routes",
    "exhaustive_quality_route",
]
