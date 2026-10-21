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
from quantumroute.physics import (
    FiberLinkPhysics,
    calculate_fiber_attenuation_db,
    calculate_fiber_transmittance,
    fiber_distance_to_werner_parameter,
    evaluate_fiber_link,
    werner_parameter_to_max_distance,
    make_amplitude_damping_channel,
    make_phase_damping_channel,
    make_quantum_memory_channel,
)
from quantumroute.purification import (
    PurificationResult,
    bbpssw_success_probability,
    bbpssw_output_fidelity,
    bbpssw_output_werner_parameter,
    build_bbpssw_circuit,
    project_matching_parity,
    twirl_to_werner_state,
    simulate_bbpssw_step,
    simulate_multi_round_bbpssw,
)
from quantumroute.tomography import (
    TomographyResult,
    pauli_matrices,
    exact_bloch_vector,
    reconstruct_density_matrix,
    build_tomography_circuits,
    execute_tomography,
    sample_density_matrix_tomography,
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
    create_karnataka_topology,
    create_ring_topology,
    create_star_topology,
    create_grid_topology,
)
from quantumroute.routing import (
    RouteResult,
    find_shortest_hop_route,
    find_quality_aware_route,
    find_multi_metric_route,
    compare_multi_metric_routes,
    shortest_hop_path,
    quality_aware_path,
    compare_routes,
    exhaustive_quality_route,
)
from quantumroute.swapping import (
    create_werner_density_matrix,
    build_n_hop_swapping_circuit,
    simulate_swapping_chain,
    calculate_end_to_end_bell_fidelity,
)
from quantumroute.validate import (
    ValidationResult,
    compare_model_and_simulation,
    compare_predicted_vs_simulated,
    validate_noise_model,
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
    # Optical fiber & memory physics
    "FiberLinkPhysics",
    "calculate_fiber_attenuation_db",
    "calculate_fiber_transmittance",
    "fiber_distance_to_werner_parameter",
    "evaluate_fiber_link",
    "werner_parameter_to_max_distance",
    "make_amplitude_damping_channel",
    "make_phase_damping_channel",
    "make_quantum_memory_channel",
    # Entanglement purification (BBPSSW)
    "PurificationResult",
    "bbpssw_success_probability",
    "bbpssw_output_fidelity",
    "bbpssw_output_werner_parameter",
    "build_bbpssw_circuit",
    "project_matching_parity",
    "twirl_to_werner_state",
    "simulate_bbpssw_step",
    "simulate_multi_round_bbpssw",
    # Quantum state tomography
    "TomographyResult",
    "pauli_matrices",
    "exact_bloch_vector",
    "reconstruct_density_matrix",
    "build_tomography_circuits",
    "execute_tomography",
    "sample_density_matrix_tomography",
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
    "create_karnataka_topology",
    "create_ring_topology",
    "create_star_topology",
    "create_grid_topology",
    # Routing algorithms
    "RouteResult",
    "find_shortest_hop_route",
    "find_quality_aware_route",
    "find_multi_metric_route",
    "compare_multi_metric_routes",
    "shortest_hop_path",
    "quality_aware_path",
    "compare_routes",
    "exhaustive_quality_route",
    # Entanglement swapping simulation
    "create_werner_density_matrix",
    "build_n_hop_swapping_circuit",
    "simulate_swapping_chain",
    "calculate_end_to_end_bell_fidelity",
    # Validation harness
    "ValidationResult",
    "compare_model_and_simulation",
    "compare_predicted_vs_simulated",
    "validate_noise_model",
]
