"""Physical Optical Fiber Attenuation and Quantum Memory Decoherence Channels (QR-009).

This module bridges abstract Werner link parameters to realistic optical telecom physics
and physical atomic/solid-state quantum memory relaxation times:
    1. Optical Telecom Fiber Attenuation:
       Standard telecom silica fiber (SMF-28) at 1550 nm (C-band) exhibits an attenuation
       coefficient:
           alpha = 0.2 dB/km
       The transmittance eta(L) over distance L in km is:
           eta(L) = 10^(-alpha * L / 10)
       Taking into account single-photon detector dark count probability p_dark, the signal
       coincidence to noise coincidence ratio yields the effective Werner visibility parameter:
           w(L) = eta(L) / (eta(L) + 2 * p_dark)

    2. Quantum Memory Relaxation & Dephasing (T1, T2):
       Intermediate repeater memories hold quantum states during classical feedforward signaling
       intervals tau.
       - T1: Longitudinal energy relaxation / photon emission time.
       - T2: Transverse dephasing time, physically bounded by T2 <= 2 * T1.
       Modeled via Kraus representations of Amplitude Damping and Phase Damping channels
       using Qiskit Aer.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any
import numpy as np
from qiskit.quantum_info import Kraus
from qiskit_aer.noise import (
    amplitude_damping_error,
    phase_damping_error,
    thermal_relaxation_error,
)

# Standard telecom optical fiber attenuation in silica at 1550 nm (illustrative model default)
DEFAULT_ALPHA_DB_PER_KM = 0.20

# Standard superconducting single-photon detector (SNSPD) dark count probability per gate
DEFAULT_P_DARK = 1e-5

# Default optical coupling and detector efficiency (eta_coupling)
DEFAULT_COUPLING_EFFICIENCY = 1.0

# Default raw entanglement source visibility / Werner parameter
DEFAULT_RAW_VISIBILITY = 0.98

# Speed of light in single-mode optical fiber (refractive index n ≈ 1.468)
# v = c / n ≈ 204,360 km/s ≈ 0.20436 km/μs => latency ≈ 4.89 μs/km ≈ 5.0 μs/km
FIBER_LATENCY_MS_PER_KM = 0.005


@dataclass(frozen=True)
class FiberLinkPhysics:
    """Physical characteristics of an optical fiber quantum communication link.

    Attributes:
        length_km: Fiber physical distance in kilometers.
        alpha_db_per_km: Attenuation coefficient in dB/km (default: 0.20 dB/km).
        p_dark: Detector dark count probability per coincidence window.
        attenuation_db: Total channel loss in decibels.
        transmittance: Fiber transmission probability eta_fiber in (0.0, 1.0].
        werner_parameter: Resulting Werner visibility parameter w in (0.0, 1.0].
        propagation_delay_ms: Classical propagation delay in milliseconds.
        coupling_efficiency: Optical coupling and detector efficiency in (0.0, 1.0].
        total_transmittance: Total transmission probability eta_total = eta_coupling * eta_fiber.
    """
    length_km: float
    alpha_db_per_km: float
    p_dark: float
    attenuation_db: float
    transmittance: float
    werner_parameter: float
    propagation_delay_ms: float
    coupling_efficiency: float = 1.0
    total_transmittance: float = 0.0


@dataclass(frozen=True)
class PathPhysicsReport:
    """Comprehensive physical report for an end-to-end multi-hop quantum communication path.

    Clearly decouples photon transmission probability from conditional entanglement quality.
    """
    num_hops: int
    total_distance_km: float
    total_attenuation_db: float
    path_success_probability: float  # P_success = prod(eta_total_e)
    conditional_werner_w: float      # w_path = prod(w_e)
    conditional_bell_fidelity: float # (1 + 3 * w_path) / 4
    conditional_teleport_fidelity: float # (1 + w_path) / 2
    total_propagation_delay_ms: float
    memory_decay_factor: float       # exp(-tau / T2)
    werner_with_memory: float        # w_path * memory_decay
    fidelity_with_memory: float      # (1 + 3 * w_with_mem) / 4
    hop_transmittances: tuple[float, ...]
    hop_werner_params: tuple[float, ...]
    model_assumptions: dict[str, str]


def validate_physical_distance(length_km: float) -> float:
    """Validate that distance length_km is a non-negative real number.

    Args:
        length_km: Physical distance in kilometers.

    Returns:
        Validated float distance.

    Raises:
        TypeError: If length_km is boolean or non-numeric.
        ValueError: If length_km < 0.
    """
    if isinstance(length_km, bool) or not isinstance(length_km, (int, float)):
        raise TypeError(f"Fiber distance must be a real number, got {type(length_km).__name__}.")
    l_float = float(length_km)
    if l_float < 0.0:
        raise ValueError(f"Fiber distance cannot be negative, got {l_float}.")
    return l_float


def validate_attenuation_coefficient(alpha_db_per_km: float) -> float:
    """Validate that attenuation rate is a non-negative real number."""
    if isinstance(alpha_db_per_km, bool) or not isinstance(alpha_db_per_km, (int, float)):
        raise TypeError(f"Alpha must be a real number, got {type(alpha_db_per_km).__name__}.")
    alpha_val = float(alpha_db_per_km)
    if alpha_val < 0.0:
        raise ValueError(f"Alpha cannot be negative, got {alpha_val}.")
    return alpha_val


def validate_efficiency(eff: float, name: str = "Efficiency") -> float:
    """Validate that efficiency is a real probability in [0.0, 1.0]."""
    if isinstance(eff, bool) or not isinstance(eff, (int, float)):
        raise TypeError(f"{name} must be a real number, got {type(eff).__name__}.")
    eff_val = float(eff)
    if not (0.0 <= eff_val <= 1.0):
        raise ValueError(f"{name} must be in [0.0, 1.0], got {eff_val}.")
    return eff_val


def calculate_fiber_attenuation_db(
    length_km: float,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
) -> float:
    """Calculate the total attenuation in decibels over a fiber span.

    Formula:
        Loss_dB = alpha * L

    Args:
        length_km: Distance in km.
        alpha_db_per_km: Attenuation rate in dB/km (default: 0.20 dB/km illustrative telecom model).

    Returns:
        Total attenuation in dB.
    """
    l_val = validate_physical_distance(length_km)
    alpha_val = validate_attenuation_coefficient(alpha_db_per_km)
    return alpha_val * l_val


def calculate_fiber_transmittance(
    length_km: float,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
) -> float:
    """Calculate optical transmission probability eta_fiber(L) through silica fiber.

    Formula:
        eta_fiber(L) = 10^(-alpha * L / 10)

    Benchmark Values:
        L = 0 km   => eta = 1.00 (100% transmission)
        L = 50 km  => eta = 0.10 (10 dB loss, 10% transmission)
        L = 100 km => eta = 0.01 (20 dB loss, 1% transmission)

    Args:
        length_km: Distance in km.
        alpha_db_per_km: Attenuation coefficient in dB/km.

    Returns:
        Transmittance eta in [0.0, 1.0].
    """
    loss_db = calculate_fiber_attenuation_db(length_km, alpha_db_per_km)
    eta = 10.0 ** (-loss_db / 10.0)
    return float(np.clip(eta, 0.0, 1.0))


def calculate_total_transmittance(
    length_km: float,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
    coupling_efficiency: float = DEFAULT_COUPLING_EFFICIENCY,
) -> float:
    """Calculate total transmission probability eta_total = eta_coupling * eta_fiber.

    Args:
        length_km: Fiber distance in km.
        alpha_db_per_km: Attenuation rate in dB/km.
        coupling_efficiency: Combined fiber-coupling and detector efficiency in [0.0, 1.0].

    Returns:
        Total single-photon transmission probability in [0.0, 1.0].
    """
    eta_fiber = calculate_fiber_transmittance(length_km, alpha_db_per_km)
    c_eff = validate_efficiency(coupling_efficiency, "Coupling efficiency")
    eta_total = c_eff * eta_fiber
    return float(np.clip(eta_total, 0.0, 1.0))


def calculate_conditional_werner_parameter(
    eta_total: float,
    p_dark: float = DEFAULT_P_DARK,
    raw_visibility: float = DEFAULT_RAW_VISIBILITY,
) -> float:
    """Calculate conditional Werner quality under the simplified dark-count heuristic.

    SIMPLIFIED / ILLUSTRATIVE MODEL ASSUMPTIONS:
    1. Conditioned on herald detection: evaluates Werner parameter w given photon arrival.
    2. SNR heuristic: w(eta) = raw_visibility * [eta / (eta + 2 * p_dark)].
    3. If p_dark == 0.0, loss does not degrade conditional state quality (w = raw_visibility).
    4. Pedagogical model: Illustrates SNR degradation near the detector noise floor;
       not a universal detector or heralding model.

    Args:
        eta_total: Total transmission probability in [0.0, 1.0].
        p_dark: Detector dark count probability per coincidence window.
        raw_visibility: Intrinsic entanglement source quality in (0.0, 1.0].

    Returns:
        Conditional Werner parameter w in [0.0, 1.0].
    """
    eta_val = validate_efficiency(eta_total, "Total transmittance")
    if isinstance(p_dark, bool) or not isinstance(p_dark, (int, float)):
        raise TypeError("Dark count probability must be a real number.")
    p_dark_val = float(p_dark)
    if not (0.0 <= p_dark_val < 1.0):
        raise ValueError(f"Dark count probability must be in [0.0, 1.0), got {p_dark_val}.")
    raw_vis = validate_efficiency(raw_visibility, "Raw visibility")

    if eta_val <= 0.0:
        return 0.0
    if p_dark_val <= 0.0:
        return raw_vis

    denom = eta_val + 2.0 * p_dark_val
    if denom <= 0.0:
        return 0.0

    w = raw_vis * (eta_val / denom)
    return float(np.clip(w, 0.0, 1.0))


def fiber_distance_to_werner_parameter(
    length_km: float,
    p_dark: float = DEFAULT_P_DARK,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
    dark_count_prob: float | None = None,
) -> float:
    """Derive effective link Werner parameter w from physical fiber attenuation and dark counts.

    Illustrative heuristic model: w(L) = eta(L) / (eta(L) + 2 * p_dark).
    """
    if dark_count_prob is not None:
        p_dark = dark_count_prob

    eta = calculate_fiber_transmittance(length_km, alpha_db_per_km)
    return calculate_conditional_werner_parameter(eta, p_dark=p_dark, raw_visibility=1.0)


def calculate_path_success_probability(
    link_transmittances: Any,
) -> float:
    """Calculate end-to-end path success probability under the independent single-shot model.

    Formula:
        P_success_path = product(eta_total_e)

    EXPLICIT MODEL ASSUMPTIONS:
    1. Independent link attempts: Each link generates entanglement independently.
    2. Single-shot / unbuffered: All links must succeed within the same round/cycle.
    3. Does not assume quantum memory multiplexing or asynchronous repeaters.

    Args:
        link_transmittances: Sequence of link transmission probabilities in [0.0, 1.0].

    Returns:
        Path success probability in [0.0, 1.0].
    """
    if not link_transmittances:
        return 1.0

    prob = 1.0
    for idx, eta in enumerate(link_transmittances):
        eta_val = validate_efficiency(eta, f"Link transmittance at index {idx}")
        prob *= eta_val

    return float(np.clip(prob, 0.0, 1.0))


def calculate_path_conditional_werner(
    link_werner_params: Any,
) -> float:
    """Calculate end-to-end conditional Werner parameter w_path = product(w_e).

    Under PLAN.md §5.2 assumptions (Werner-form links, ideal swapping, ideal feedforward).
    """
    if not link_werner_params:
        return 1.0

    w_path = 1.0
    for idx, w in enumerate(link_werner_params):
        w_val = validate_efficiency(w, f"Link Werner parameter at index {idx}")
        w_path *= w_val

    return float(np.clip(w_path, 0.0, 1.0))


def calculate_memory_decay_factor(
    waiting_time_ms: float,
    t2_ms: float = 2.0,
) -> float:
    """Calculate simplified memory dephasing decay factor exp(-tau / T2).

    ASSUMPTION:
    Qubits are stored in quantum memories for waiting time tau_wait during classical
    signaling roundtrip. Pure dephasing contracts Werner parameter by exp(-tau / T2).

    Args:
        waiting_time_ms: Memory storage time in milliseconds (>= 0).
        t2_ms: Transverse dephasing time in milliseconds (> 0).

    Returns:
        Decay factor in (0.0, 1.0].
    """
    if isinstance(waiting_time_ms, bool) or not isinstance(waiting_time_ms, (int, float)):
        raise TypeError("Waiting time must be a real number.")
    if isinstance(t2_ms, bool) or not isinstance(t2_ms, (int, float)):
        raise TypeError("T2 must be a real number.")

    tau = float(waiting_time_ms)
    t2 = float(t2_ms)
    if tau < 0.0:
        raise ValueError(f"Waiting time cannot be negative, got {tau}.")
    if t2 <= 0.0:
        raise ValueError(f"T2 must be positive, got {t2}.")

    decay = math.exp(-tau / t2)
    return float(np.clip(decay, 0.0, 1.0))


def evaluate_fiber_link(
    length_km: float,
    p_dark: float = DEFAULT_P_DARK,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
    coupling_efficiency: float = DEFAULT_COUPLING_EFFICIENCY,
    raw_visibility: float = DEFAULT_RAW_VISIBILITY,
) -> FiberLinkPhysics:
    """Compute comprehensive physical metrics for an optical fiber link.

    Args:
        length_km: Distance in km.
        p_dark: Dark count probability.
        alpha_db_per_km: Attenuation in dB/km (default 0.20 dB/km illustrative model).
        coupling_efficiency: Fiber coupling efficiency (default 1.0).
        raw_visibility: Intrinsic source visibility (default 0.98).

    Returns:
        FiberLinkPhysics: Structured physical report.
    """
    l_val = validate_physical_distance(length_km)
    loss_db = calculate_fiber_attenuation_db(l_val, alpha_db_per_km)
    eta_fiber = calculate_fiber_transmittance(l_val, alpha_db_per_km)
    eta_total = calculate_total_transmittance(l_val, alpha_db_per_km, coupling_efficiency)
    w = calculate_conditional_werner_parameter(eta_total, p_dark, raw_visibility)
    delay_ms = l_val * FIBER_LATENCY_MS_PER_KM

    return FiberLinkPhysics(
        length_km=l_val,
        alpha_db_per_km=alpha_db_per_km,
        p_dark=p_dark,
        attenuation_db=loss_db,
        transmittance=eta_fiber,
        werner_parameter=w,
        propagation_delay_ms=delay_ms,
        coupling_efficiency=coupling_efficiency,
        total_transmittance=eta_total,
    )


def evaluate_physical_path(
    hop_distances_km: Any,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
    coupling_efficiency: float = DEFAULT_COUPLING_EFFICIENCY,
    p_dark: float = DEFAULT_P_DARK,
    raw_visibility: float = DEFAULT_RAW_VISIBILITY,
    t2_ms: float = 2.0,
    use_decoupled_werner: bool = False,
    override_hop_w: Any = None,
) -> PathPhysicsReport:
    """Evaluate end-to-end physical metrics for a multi-hop quantum communication path.

    Clearly separates:
    1. Transmission probability: product(eta_total_e) under independent single-shot model.
    2. Conditional Werner quality: product(w_e) conditioned on link establishment.
    3. Memory dephasing: exp(-tau_wait / T2) during classical propagation delay.
    """
    distances = [validate_physical_distance(d) for d in hop_distances_km]
    num_hops = len(distances)
    total_distance = float(sum(distances))
    total_loss_db = float(sum(calculate_fiber_attenuation_db(d, alpha_db_per_km) for d in distances))

    transmittances: list[float] = []
    werner_params: list[float] = []

    for idx, d in enumerate(distances):
        eta_tot = calculate_total_transmittance(d, alpha_db_per_km, coupling_efficiency)
        transmittances.append(eta_tot)

        if override_hop_w is not None and idx < len(override_hop_w):
            w_val = validate_efficiency(override_hop_w[idx], f"Override Werner parameter at hop {idx}")
        elif use_decoupled_werner:
            w_val = raw_visibility
        else:
            w_val = calculate_conditional_werner_parameter(eta_tot, p_dark, raw_visibility)
        werner_params.append(w_val)

    p_success = calculate_path_success_probability(transmittances)
    w_cond = calculate_path_conditional_werner(werner_params)
    fe_cond = (1.0 + 3.0 * w_cond) / 4.0
    ftel_cond = (1.0 + w_cond) / 2.0

    total_delay_ms = total_distance * FIBER_LATENCY_MS_PER_KM
    mem_decay = calculate_memory_decay_factor(total_delay_ms, t2_ms=t2_ms)
    w_with_mem = float(np.clip(w_cond * mem_decay, 0.0, 1.0))
    fe_with_mem = (1.0 + 3.0 * w_with_mem) / 4.0

    assumptions = {
        "fiber_attenuation": f"Configured {alpha_db_per_km:.2f} dB/km illustrative telecom silica model.",
        "path_success": "Independent single-shot attempt model: P_success = product(eta_total_e).",
        "conditional_werner": "Werner link composition: w_path = product(w_e) conditioned on heralded establishment.",
        "memory_decoherence": f"Simplified dephasing over roundtrip delay ({total_delay_ms:.2f} ms) with T2={t2_ms:.2f} ms.",
    }

    return PathPhysicsReport(
        num_hops=num_hops,
        total_distance_km=total_distance,
        total_attenuation_db=total_loss_db,
        path_success_probability=p_success,
        conditional_werner_w=w_cond,
        conditional_bell_fidelity=fe_cond,
        conditional_teleport_fidelity=ftel_cond,
        total_propagation_delay_ms=total_delay_ms,
        memory_decay_factor=mem_decay,
        werner_with_memory=w_with_mem,
        fidelity_with_memory=fe_with_mem,
        hop_transmittances=tuple(transmittances),
        hop_werner_params=tuple(werner_params),
        model_assumptions=assumptions,
    )


def werner_parameter_to_max_distance(
    target_w: float,
    p_dark: float = DEFAULT_P_DARK,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
) -> float:
    """Calculate the maximum allowable unrepeatered fiber distance to achieve target Werner parameter.

    Inversion of w(L) = eta / (eta + 2 * p_dark):
        eta * (1 - w) = 2 * w * p_dark
        eta = 2 * w * p_dark / (1 - w)
        L = -10 / alpha * log10(eta)

    Args:
        target_w: Minimum required Werner parameter in (0.0, 1.0).
        p_dark: Dark count probability.
        alpha_db_per_km: Attenuation in dB/km.

    Returns:
        Maximum unrepeatered distance in km.

    Raises:
        ValueError: If target_w <= 0.0 or target_w >= 1.0.
    """
    if isinstance(target_w, bool) or not isinstance(target_w, (int, float)):
        raise TypeError(f"Target w must be a real number, got {type(target_w).__name__}.")
    w_val = float(target_w)
    if not (0.0 < w_val < 1.0):
        raise ValueError(f"Target Werner parameter must be strictly inside (0.0, 1.0), got {w_val}.")

    if p_dark <= 0.0:
        # Ideal noiseless detector: infinite reach for any target w < 1.0
        return float("inf")

    eta_required = (2.0 * w_val * p_dark) / (1.0 - w_val)
    if eta_required >= 1.0:
        return 0.0

    max_dist = -10.0 / alpha_db_per_km * math.log10(eta_required)
    return float(max(0.0, max_dist))


# ==============================================================================
# Quantum Memory Decoherence Channels (T1, T2)
# ==============================================================================

def make_amplitude_damping_channel(gamma: float) -> Kraus:
    """Construct an Amplitude Damping channel representing photon loss / energy relaxation (T1).

    Kraus Operators:
        K_0 = [[1, 0], [0, sqrt(1 - gamma)]]
        K_1 = [[0, sqrt(gamma)], [0, 0]]

    Args:
        gamma: Damping probability parameter in [0.0, 1.0].

    Returns:
        Kraus: Qiskit Kraus channel operator.

    Raises:
        ValueError: If gamma not in [0.0, 1.0].
    """
    if isinstance(gamma, bool) or not isinstance(gamma, (int, float)):
        raise TypeError(f"Gamma must be a real number, got {type(gamma).__name__}.")
    g_val = float(gamma)
    if not (0.0 <= g_val <= 1.0):
        raise ValueError(f"Amplitude damping gamma must be in [0.0, 1.0], got {g_val}.")

    error = amplitude_damping_error(g_val)
    return Kraus(error)


def make_phase_damping_channel(lambda_param: float) -> Kraus:
    """Construct a Phase Damping channel representing pure dephasing (T2).

    Kraus Operators:
        K_0 = [[1, 0], [0, sqrt(1 - lambda)]]
        K_1 = [[0, 0], [0, sqrt(lambda)]]

    Args:
        lambda_param: Dephasing probability parameter in [0.0, 1.0].

    Returns:
        Kraus: Qiskit Kraus channel operator.

    Raises:
        ValueError: If lambda_param not in [0.0, 1.0].
    """
    if isinstance(lambda_param, bool) or not isinstance(lambda_param, (int, float)):
        raise TypeError(f"Lambda must be a real number, got {type(lambda_param).__name__}.")
    l_val = float(lambda_param)
    if not (0.0 <= l_val <= 1.0):
        raise ValueError(f"Phase damping lambda must be in [0.0, 1.0], got {l_val}.")

    error = phase_damping_error(l_val)
    return Kraus(error)


def make_quantum_memory_channel(
    storage_time_us: float,
    t1_us: float = 1000.0,
    t2_us: float = 500.0,
) -> Kraus:
    """Construct a physical quantum memory decoherence channel over storage interval storage_time_us.

    Physical Constraint:
        T2 <= 2 * T1 must strictly hold for any physical quantum system.

    Decoherence Rates:
        gamma_1 = 1 - exp(-tau / T1)
        gamma_phi = 1 - exp(-tau / T_phi) where 1/T_phi = 1/T2 - 1/(2*T1)

    Args:
        storage_time_us: Memory hold time in microseconds (tau >= 0).
        t1_us: Longitudinal relaxation time in microseconds (T1 > 0).
        t2_us: Transverse dephasing time in microseconds (0 < T2 <= 2*T1).

    Returns:
        Kraus: Qiskit thermal relaxation channel modeling combined T1 and T2 effects.

    Raises:
        ValueError: If parameters violate physical bounds or T2 > 2*T1.
    """
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) for v in [storage_time_us, t1_us, t2_us]):
        raise TypeError("Memory time parameters must be real numbers.")

    tau = float(storage_time_us)
    t1 = float(t1_us)
    t2 = float(t2_us)

    if tau < 0.0:
        raise ValueError(f"Storage time tau cannot be negative, got {tau}.")
    if t1 <= 0.0:
        raise ValueError(f"Relaxation time T1 must be positive, got {t1}.")
    if t2 <= 0.0:
        raise ValueError(f"Dephasing time T2 must be positive, got {t2}.")
    if t2 > 2.0 * t1 + 1e-9:
        raise ValueError(
            f"Physical violation: T2 ({t2} μs) cannot exceed 2 * T1 (2 * {t1} = {2 * t1} μs)."
        )

    # Use Qiskit Aer's thermal relaxation error model
    error = thermal_relaxation_error(t1=t1, t2=t2, time=tau)
    return Kraus(error)
