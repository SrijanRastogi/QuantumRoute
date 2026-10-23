"""Depolarizing noise module and theoretical verification.

This module models single-qubit depolarizing noise on distributed entanglement resources
and provides exact analytical comparisons based on the Werner-state representation.

Mathematical Model & Convention:
--------------------------------
1. Qiskit Depolarizing Channel Convention:
   The channel returned by `qiskit_aer.noise.depolarizing_error(p, 1)` acts on a 1-qubit
   density matrix rho as:
       E(rho) = (1 - p) * rho + p * (I_2 / 2)
   Its Pauli-twirl decomposition is:
       E(rho) = (1 - 3p/4) * rho + (p/4) * (X rho X + Y rho Y + Z rho Z)
   where:
       p in [0.0, 1.0] is the depolarizing error parameter.

2. Entangled Resource State (Werner Link):
   When this single-qubit channel is applied to the distributed qubit (Bob's qubit q2)
   of the canonical Bell state |Phi+> = (|00> + |11>) / sqrt(2), the resulting 2-qubit
   shared state is:
       rho_link = (I tensor E)(|Phi+><Phi+|)
                = (1 - p) * |Phi+><Phi+| + p * (I_4 / 4)
   This is identically an isotropic Werner state rho_W(w) with Werner parameter:
       w = 1 - p
   with Bell-state fidelity:
       F_e = <Phi+| rho_W |Phi+> = (1 + 3w) / 4 = 1 - 3p/4

3. Single-Qubit Teleportation Under Werner Link Noise:
   Teleporting an arbitrary pure input state |psi> across this noisy Bell pair produces
   Bob's reduced density matrix:
       rho_Bob = w * |psi><psi| + (1 - w) * (I_2 / 2)
               = (1 - p) * |psi><psi| + p * (I_2 / 2)
   The state fidelity is:
       F(|psi>, rho_Bob) = <psi| rho_Bob |psi>
                         = w + (1 - w)/2 = (1 + w) / 2 = 1 - p / 2
   This closed-form formula matches the Horodecki average fidelity:
       F_tel,avg = (2 * F_e + 1) / 3 = 1 - p / 2
   and is invariant across all input states |psi> on the Bloch sphere.
"""

from __future__ import annotations

import numpy as np
from typing import Sequence, Any
from qiskit.quantum_info import Kraus, Statevector
from qiskit_aer.noise import depolarizing_error


def make_depolarizing_channel(p: float) -> Kraus:
    """Create a single-qubit depolarizing channel as a Qiskit Kraus operator.

    Channel definition:
        E(rho) = (1 - p) * rho + p * (I / 2)
        Probabilities: P_I = 1 - 3p/4, P_X = P_Y = P_Z = p/4.

    Args:
        p: Depolarizing probability parameter, must be in [0.0, 1.0].

    Returns:
        Kraus quantum channel operator that can be appended to a QuantumCircuit.

    Raises:
        TypeError: If p is a boolean or not a real number.
        ValueError: If p is outside the valid probability interval [0.0, 1.0].
    """
    if isinstance(p, bool) or not isinstance(p, (int, float)):
        raise TypeError(
            f"Depolarizing parameter p must be a real number, got {type(p).__name__}."
        )
    if not (0.0 <= p <= 1.0):
        raise ValueError(
            f"Depolarizing parameter p must be in [0.0, 1.0], but got {p}."
        )

    q_error = depolarizing_error(p, 1)
    return Kraus(q_error)


def get_analytical_depolarizing_fidelity(p: float) -> float:
    """Compute the exact theoretical teleportation fidelity under depolarizing link noise.

    Formula:
        F_theory(p) = 1.0 - p / 2.0 = (1.0 + w) / 2.0
    where w = 1.0 - p is the equivalent Werner link parameter.

    Boundary values:
        p = 0.0 -> F = 1.0 (ideal teleportation)
        p = 2/3 -> F = 2/3 (~0.6667, classical measure-and-prepare threshold)
        p = 1.0 -> F = 0.5 (completely mixed state I/2)

    Args:
        p: Depolarizing probability parameter in [0.0, 1.0].

    Returns:
        Theoretical state fidelity in [0.5, 1.0].

    Raises:
        TypeError: If p is a boolean or not a real number.
        ValueError: If p is outside [0.0, 1.0].
    """
    if isinstance(p, bool) or not isinstance(p, (int, float)):
        raise TypeError(
            f"Depolarizing parameter p must be a real number, got {type(p).__name__}."
        )
    if not (0.0 <= p <= 1.0):
        raise ValueError(
            f"Depolarizing parameter p must be in [0.0, 1.0], but got {p}."
        )
    return 1.0 - p / 2.0


def get_werner_parameter_from_noise(p: float) -> float:
    """Return the equivalent isotropic Werner state parameter w = 1 - p.

    Args:
        p: Depolarizing probability parameter in [0.0, 1.0].

    Returns:
        Werner parameter w in [0.0, 1.0].

    Raises:
        TypeError: If p is a boolean or not a real number.
        ValueError: If p is outside [0.0, 1.0].
    """
    if isinstance(p, bool) or not isinstance(p, (int, float)):
        raise TypeError(
            f"Depolarizing parameter p must be a real number, got {type(p).__name__}."
        )
    if not (0.0 <= p <= 1.0):
        raise ValueError(
            f"Depolarizing parameter p must be in [0.0, 1.0], but got {p}."
        )
    return 1.0 - p


def depolarizing_noise_sweep(
    param_range: Sequence[float] | None = None,
    input_states: Sequence[tuple[float, float]] | None = None,
    seed: int = 42,
    tolerance: float = 1e-4,
) -> dict[str, Any]:
    """Execute a reproducible depolarizing noise sweep and validate against theoretical predictions.

    Args:
        param_range: Sequence of p values in [0.0, 1.0]. Defaults to 21 points
            from 0.0 to 1.0 in steps of 0.05.
        input_states: Sequence of (theta, phi) tuples. Defaults to a representative
            ensemble including cardinal states and arbitrary Bloch sphere points.
        seed: Random seed for deterministic reproducibility.
        tolerance: Maximum acceptable absolute discrepancy |F_sim - F_theo|.

    Returns:
        Dictionary containing:
            - 'p_values': list of noise parameter values
            - 'theoretical_fidelities': list of analytical predictions
            - 'simulated_fidelities': list of average simulated fidelities
            - 'absolute_errors': list of absolute discrepancies
            - 'max_error': maximum error across the sweep
            - 'tolerance': declared numerical tolerance
            - 'classical_threshold': 2.0 / 3.0 reference boundary
            - 'passed': boolean indicating whether all errors <= tolerance
    """
    from quantumroute.teleport import (
        prepare_input_state,
        teleport_rho,
        calculate_state_fidelity,
    )

    if param_range is None:
        param_range = np.linspace(0.0, 1.0, 21).tolist()

    if input_states is None:
        # Default test ensemble: cardinal states + deterministic random points
        rng = np.random.default_rng(seed)
        cardinal_angles = [
            (0.0, 0.0),          # |0>
            (np.pi, 0.0),        # |1>
            (np.pi / 2, 0.0),    # |+>
            (np.pi / 2, np.pi),  # |->
            (np.pi / 2, np.pi / 2),      # |i>
            (np.pi / 2, 3 * np.pi / 2),  # |-i>
        ]
        random_thetas = rng.uniform(0.1, np.pi - 0.1, 4)
        random_phis = rng.uniform(0.0, 2 * np.pi, 4)
        random_angles = list(zip(random_thetas, random_phis))
        input_states = cardinal_angles + random_angles

    p_list = [float(p) for p in param_range]
    theo_list: list[float] = []
    sim_list: list[float] = []
    abs_errors: list[float] = []

    for p in p_list:
        theo_f = get_analytical_depolarizing_fidelity(p)
        theo_list.append(theo_f)

        state_fidelities: list[float] = []
        for theta, phi in input_states:
            target_sv = prepare_input_state(theta, phi)
            rho_bob = teleport_rho(theta, phi, link_error=p)
            f = calculate_state_fidelity(target_sv, rho_bob)
            state_fidelities.append(f)

        avg_sim_f = float(np.mean(state_fidelities))
        sim_list.append(avg_sim_f)
        abs_errors.append(abs(avg_sim_f - theo_f))

    max_err = float(max(abs_errors)) if abs_errors else 0.0
    passed = bool(max_err <= tolerance)

    return {
        "p_values": p_list,
        "theoretical_fidelities": theo_list,
        "simulated_fidelities": sim_list,
        "absolute_errors": abs_errors,
        "max_error": max_err,
        "tolerance": tolerance,
        "classical_threshold": 2.0 / 3.0,
        "passed": passed,
    }
