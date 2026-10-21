"""Reproducible experiment runners and parameter sweeps.

This module exposes standard experiment routines for depolarizing noise sweeps
and theoretical fidelity benchmarks according to ARCHITECTURE.md §3.2.
"""

from __future__ import annotations

from typing import Sequence, Any
from quantumroute.noise import (
    depolarizing_noise_sweep as _noise_sweep,
    get_analytical_depolarizing_fidelity as _get_analytical_fidelity,
    make_depolarizing_channel,
    get_werner_parameter_from_noise,
)


def depolarizing_noise_sweep(
    param_range: Sequence[float] | None = None,
    input_states: Sequence[tuple[float, float]] | None = None,
    seed: int = 42,
    tolerance: float = 1e-4,
) -> dict[str, Any]:
    """Execute a reproducible depolarizing noise sweep across a parameter grid.

    Delegates to quantumroute.noise.depolarizing_noise_sweep.
    """
    return _noise_sweep(
        param_range=param_range,
        input_states=input_states,
        seed=seed,
        tolerance=tolerance,
    )


def get_analytical_depolarizing_fidelity(
    lambda_param: float,
    input_state: Any = None,
) -> float:
    """Evaluate closed-form theoretical fidelity for a given depolarizing parameter.

    Note: In the isotropic Werner link model, the theoretical fidelity
    is invariant across all input states: F_theo = 1.0 - lambda_param / 2.0.

    Args:
        lambda_param: Depolarizing noise parameter in [0.0, 1.0].
        input_state: Optional input state (ignored due to isotropy).

    Returns:
        Theoretical fidelity in [0.5, 1.0].
    """
    return _get_analytical_fidelity(lambda_param)


__all__ = [
    "depolarizing_noise_sweep",
    "get_analytical_depolarizing_fidelity",
    "make_depolarizing_channel",
    "get_werner_parameter_from_noise",
]
