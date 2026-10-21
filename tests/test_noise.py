"""QR-002: Unit and integration tests for depolarizing noise channel and sweeps.

Verifies:
    1. Zero noise (p=0.0) reproduces ideal teleportation (F >= 0.9999).
    2. Complete depolarization (p=1.0) reproduces fully mixed boundary (F = 0.5).
    3. Depolarizing noise sweep across 21 points in [0.0, 1.0] matches analytical
       formula F_theory = 1 - p/2 within numerical tolerance (|delta| <= 10^-4).
    4. Classical threshold crossing at p = 2/3 (F = 2/3 ~ 0.6667).
    5. Parameter validation: out-of-range parameters (p < 0, p > 1) raise ValueError.
    6. Equivalence with the isotropic Werner link model w = 1 - p.
    7. State-invariance of fidelity under isotropic depolarizing channel.
"""

import pytest
import numpy as np

from quantumroute.teleport import (
    prepare_input_state,
    teleport_rho,
    calculate_state_fidelity,
)
from quantumroute.noise import (
    make_depolarizing_channel,
    get_analytical_depolarizing_fidelity,
    get_werner_parameter_from_noise,
    depolarizing_noise_sweep,
)
from quantumroute.experiments import (
    depolarizing_noise_sweep as exp_sweep,
    get_analytical_depolarizing_fidelity as exp_get_analytical,
)


def test_zero_noise_reproduces_ideal():
    """Verify that zero noise p=0.0 reproduces ideal teleportation fidelity >= 0.9999."""
    for theta, phi in [(0.0, 0.0), (np.pi / 2, 0.0), (1.23, 0.45)]:
        psi_target = prepare_input_state(theta, phi)
        rho_bob = teleport_rho(theta, phi, link_error=0.0)
        fid = calculate_state_fidelity(psi_target, rho_bob)
        assert abs(fid - 1.0) < 1e-6, f"Fidelity {fid} at p=0.0 is not ~ 1.0"


def test_complete_depolarization_bound():
    """Verify that p=1.0 yields Bob's state as the maximally mixed state I/2 (F = 0.5)."""
    theta, phi = 0.75, 1.35
    psi_target = prepare_input_state(theta, phi)
    rho_bob = teleport_rho(theta, phi, link_error=1.0)

    # Bob's density matrix must be I/2 = [[0.5, 0], [0, 0.5]]
    np.testing.assert_allclose(
        rho_bob.data,
        np.array([[0.5, 0.0], [0.0, 0.5]], dtype=complex),
        atol=1e-6,
    )

    fid = calculate_state_fidelity(psi_target, rho_bob)
    assert abs(fid - 0.5) < 1e-6, f"Expected fidelity 0.5 for p=1.0, got {fid}"


def test_classical_threshold_point():
    """Verify that p = 2/3 yields fidelity exactly equal to the classical 2/3 boundary."""
    p_threshold = 2.0 / 3.0
    theo_fid = get_analytical_depolarizing_fidelity(p_threshold)
    assert abs(theo_fid - (2.0 / 3.0)) < 1e-12

    theta, phi = 0.6, 2.1
    psi_target = prepare_input_state(theta, phi)
    rho_bob = teleport_rho(theta, phi, link_error=p_threshold)
    sim_fid = calculate_state_fidelity(psi_target, rho_bob)

    assert abs(sim_fid - (2.0 / 3.0)) < 1e-6, (
        f"Simulated fidelity {sim_fid} != 2/3 at classical threshold"
    )


def test_depolarizing_sweep_curve():
    """Sweep p in [0.0, 1.0] in steps of 0.05 and verify agreement with analytical formula."""
    p_grid = np.linspace(0.0, 1.0, 21).tolist()
    theta, phi = 1.1, 0.9
    psi_target = prepare_input_state(theta, phi)

    max_delta = 0.0
    for p in p_grid:
        theo_f = get_analytical_depolarizing_fidelity(p)
        rho_bob = teleport_rho(theta, phi, link_error=p)
        sim_f = calculate_state_fidelity(psi_target, rho_bob)
        delta = abs(sim_f - theo_f)
        if delta > max_delta:
            max_delta = delta

        # Numerical tolerance constraint from TASKS.md (epsilon <= 10^-4)
        assert delta <= 1e-4, f"Discrepancy {delta:.2e} > 1e-4 at p={p}"

    assert max_delta < 1e-6, f"Max delta across sweep {max_delta:.2e} exceeded 1e-6"


def test_noise_parameter_validation():
    """Verify that invalid noise parameters raise ValueError or TypeError."""
    # Out of range numbers raise ValueError
    invalid_params = [-0.1, -1.0, 1.0001, 2.0]
    for p in invalid_params:
        with pytest.raises(ValueError, match="must be in"):
            make_depolarizing_channel(p)
        with pytest.raises(ValueError, match="must be in"):
            get_analytical_depolarizing_fidelity(p)
        with pytest.raises(ValueError, match="must be in"):
            get_werner_parameter_from_noise(p)

    # Boolean or non-numeric types raise TypeError
    for bad_val in [True, False, "0.5", None]:
        with pytest.raises(TypeError, match="must be a real number"):
            make_depolarizing_channel(bad_val)  # type: ignore
        with pytest.raises(TypeError, match="must be a real number"):
            get_analytical_depolarizing_fidelity(bad_val)  # type: ignore
        with pytest.raises(TypeError, match="must be a real number"):
            get_werner_parameter_from_noise(bad_val)  # type: ignore

    # Valid boundaries must succeed
    ch_0 = make_depolarizing_channel(0.0)
    assert ch_0 is not None
    ch_1 = make_depolarizing_channel(1.0)
    assert ch_1 is not None


def test_werner_parameter_relationship():
    """Verify the exact relationship between depolarizing parameter p and Werner parameter w.

    In the isotropic Werner link model:
        w = 1 - p
        F_e = (1 + 3w) / 4 = 1 - 3p/4
        F_tel,avg = (2*F_e + 1) / 3 = 1 - p/2
    """
    for p in [0.0, 0.25, 0.5, 0.75, 1.0]:
        w = get_werner_parameter_from_noise(p)
        assert abs(w - (1.0 - p)) < 1e-12

        # Bell state fidelity
        F_e = (1.0 + 3.0 * w) / 4.0
        # Teleportation average fidelity
        F_tel = (2.0 * F_e + 1.0) / 3.0
        # Must match 1 - p/2
        assert abs(F_tel - (1.0 - p / 2.0)) < 1e-12


def test_state_invariance_under_isotropic_noise():
    """Verify that teleportation fidelity under isotropic depolarizing noise is invariant to input state."""
    p = 0.35
    theo_f = get_analytical_depolarizing_fidelity(p)

    states = [
        (0.0, 0.0),          # |0>
        (np.pi, 0.0),        # |1>
        (np.pi / 2, 0.0),    # |+>
        (np.pi / 2, np.pi),  # |->
        (np.pi / 3, np.pi / 4),
        (2.1, 3.4),
    ]

    for theta, phi in states:
        psi = prepare_input_state(theta, phi)
        rho_bob = teleport_rho(theta, phi, link_error=p)
        sim_f = calculate_state_fidelity(psi, rho_bob)
        assert abs(sim_f - theo_f) < 1e-6, (
            f"State-invariance violated for state ({theta}, {phi}): sim={sim_f}, theo={theo_f}"
        )


def test_sweep_helper_and_experiments_interoperability():
    """Verify the depolarizing_noise_sweep helper and experiments.py module integration."""
    sweep_res = depolarizing_noise_sweep(seed=42)
    assert sweep_res["passed"] is True
    assert sweep_res["max_error"] <= 1e-4
    assert len(sweep_res["p_values"]) == 21
    assert sweep_res["classical_threshold"] == 2.0 / 3.0

    # Test experiments module re-export
    exp_res = exp_sweep(seed=42)
    assert exp_res["passed"] is True
    assert exp_get_analytical(0.4) == get_analytical_depolarizing_fidelity(0.4)
