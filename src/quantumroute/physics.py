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

# Standard telecom optical fiber attenuation in silica at 1550 nm
DEFAULT_ALPHA_DB_PER_KM = 0.20

# Standard superconducting single-photon detector (SNSPD) dark count probability per gate
DEFAULT_P_DARK = 1e-5

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
        transmittance: Transmission probability eta in (0.0, 1.0].
        werner_parameter: Resulting Werner visibility parameter w in (0.0, 1.0].
        propagation_delay_ms: Classical propagation delay in milliseconds.
    """
    length_km: float
    alpha_db_per_km: float
    p_dark: float
    attenuation_db: float
    transmittance: float
    werner_parameter: float
    propagation_delay_ms: float


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


def calculate_fiber_attenuation_db(
    length_km: float,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
) -> float:
    """Calculate the total attenuation in decibels over a fiber span.

    Formula:
        Loss_dB = alpha * L

    Args:
        length_km: Distance in km.
        alpha_db_per_km: Attenuation rate in dB/km.

    Returns:
        Total attenuation in dB.
    """
    l_val = validate_physical_distance(length_km)
    if isinstance(alpha_db_per_km, bool) or not isinstance(alpha_db_per_km, (int, float)):
        raise TypeError(f"Alpha must be a real number, got {type(alpha_db_per_km).__name__}.")
    alpha_val = float(alpha_db_per_km)
    if alpha_val < 0.0:
        raise ValueError(f"Alpha cannot be negative, got {alpha_val}.")
    return alpha_val * l_val


def calculate_fiber_transmittance(
    length_km: float,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
) -> float:
    """Calculate optical transmission probability eta(L) through silica fiber.

    Formula:
        eta(L) = 10^(-alpha * L / 10)

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
    # Transmission probability: 10^(-Loss / 10)
    eta = 10.0 ** (-loss_db / 10.0)
    return float(np.clip(eta, 0.0, 1.0))


def fiber_distance_to_werner_parameter(
    length_km: float,
    p_dark: float = DEFAULT_P_DARK,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
    dark_count_prob: float | None = None,
) -> float:
    """Derive effective link Werner parameter w from physical fiber attenuation and dark counts.

    Model:
        w(L) = eta(L) / (eta(L) + 2 * p_dark)

    Physical Interpretation:
        As length L increases, transmission eta decreases exponentially.
        When eta drops close to the detector dark count floor 2*p_dark, the signal
        visibility w degrades toward the completely mixed state (w -> 0).

    Args:
        length_km: Distance in km.
        p_dark: Dark count probability per gate.
        alpha_db_per_km: Attenuation coefficient in dB/km.
        dark_count_prob: Optional alias for p_dark for API flexibility.

    Returns:
        Effective Werner parameter w in [0.0, 1.0].

    Raises:
        ValueError: If p_dark < 0 or p_dark >= 1.
    """
    if dark_count_prob is not None:
        p_dark = dark_count_prob

    if isinstance(p_dark, bool) or not isinstance(p_dark, (int, float)):
        raise TypeError(f"Dark count probability must be a real number, got {type(p_dark).__name__}.")
    p_dark_val = float(p_dark)
    if not (0.0 <= p_dark_val < 1.0):
        raise ValueError(f"Dark count probability must be in [0.0, 1.0), got {p_dark_val}.")

    eta = calculate_fiber_transmittance(length_km, alpha_db_per_km)
    denominator = eta + 2.0 * p_dark_val
    if denominator <= 0.0:
        return 0.0

    w = eta / denominator
    return float(np.clip(w, 0.0, 1.0))


def evaluate_fiber_link(
    length_km: float,
    p_dark: float = DEFAULT_P_DARK,
    alpha_db_per_km: float = DEFAULT_ALPHA_DB_PER_KM,
) -> FiberLinkPhysics:
    """Compute comprehensive physical metrics for an optical fiber link.

    Args:
        length_km: Distance in km.
        p_dark: Dark count probability.
        alpha_db_per_km: Attenuation in dB/km.

    Returns:
        FiberLinkPhysics: Immutable structured physical report.
    """
    l_val = validate_physical_distance(length_km)
    loss_db = calculate_fiber_attenuation_db(l_val, alpha_db_per_km)
    eta = calculate_fiber_transmittance(l_val, alpha_db_per_km)
    w = fiber_distance_to_werner_parameter(l_val, p_dark, alpha_db_per_km)
    delay_ms = l_val * FIBER_LATENCY_MS_PER_KM

    return FiberLinkPhysics(
        length_km=l_val,
        alpha_db_per_km=alpha_db_per_km,
        p_dark=p_dark,
        attenuation_db=loss_db,
        transmittance=eta,
        werner_parameter=w,
        propagation_delay_ms=delay_ms,
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
