"""Unit and integration tests for physical optical fiber attenuation and quantum memory decoherence (QR-009)."""

import math
import pytest
import numpy as np
from qiskit.quantum_info import Kraus, Operator

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


def test_fiber_attenuation_and_transmittance_benchmarks():
    """Verify silica optical fiber loss and transmittance at 1550 nm benchmarks."""
    # L = 0 km => 0 dB loss, 100% transmission
    assert calculate_fiber_attenuation_db(0.0) == 0.0
    assert calculate_fiber_transmittance(0.0) == 1.0

    # L = 50 km => 10 dB loss, exactly 10% transmission (eta = 0.10)
    loss_50 = calculate_fiber_attenuation_db(50.0, alpha_db_per_km=0.20)
    assert abs(loss_50 - 10.0) < 1e-12
    eta_50 = calculate_fiber_transmittance(50.0, alpha_db_per_km=0.20)
    assert abs(eta_50 - 0.10) < 1e-12

    # L = 100 km => 20 dB loss, exactly 1% transmission (eta = 0.01)
    loss_100 = calculate_fiber_attenuation_db(100.0, alpha_db_per_km=0.20)
    assert abs(loss_100 - 20.0) < 1e-12
    eta_100 = calculate_fiber_transmittance(100.0, alpha_db_per_km=0.20)
    assert abs(eta_100 - 0.01) < 1e-12

    # Validation errors
    with pytest.raises(ValueError, match="cannot be negative"):
        calculate_fiber_attenuation_db(-10.0)

    with pytest.raises(TypeError, match="must be a real number"):
        calculate_fiber_transmittance("50km")  # type: ignore

    with pytest.raises(TypeError, match="must be a real number"):
        calculate_fiber_transmittance(True)  # type: ignore


def test_fiber_distance_to_werner_parameter_model():
    """Verify effective Werner parameter derived from physical fiber transmittance and dark counts."""
    # Zero distance, zero dark counts => ideal Werner state (w = 1.0)
    w_ideal = fiber_distance_to_werner_parameter(0.0, p_dark=0.0)
    assert abs(w_ideal - 1.0) < 1e-12

    # L = 50 km (eta = 0.10), p_dark = 1e-3 => w = 0.10 / (0.10 + 0.002) = 0.10 / 0.102 ≈ 0.980392
    eta_50 = 0.10
    expected_w_50 = eta_50 / (eta_50 + 2.0 * 1e-3)
    w_50 = fiber_distance_to_werner_parameter(50.0, p_dark=1e-3, alpha_db_per_km=0.20)
    assert abs(w_50 - expected_w_50) < 1e-6

    # Long distance attenuation: as L increases, w degrades toward 0
    w_200 = fiber_distance_to_werner_parameter(200.0, p_dark=1e-4)
    w_300 = fiber_distance_to_werner_parameter(300.0, p_dark=1e-4)
    assert 0.0 <= w_300 < w_200 < 0.50

    # Parameter validation
    with pytest.raises(ValueError, match="Dark count probability must be in"):
        fiber_distance_to_werner_parameter(50.0, p_dark=-1e-4)

    with pytest.raises(ValueError, match="Dark count probability must be in"):
        fiber_distance_to_werner_parameter(50.0, p_dark=1.0)


def test_werner_parameter_to_max_distance_inversion():
    """Verify analytical mathematical inversion between target Werner parameter and maximum distance."""
    p_dark = 1e-5
    alpha = 0.20

    for target_w in [0.50, 0.75, 0.90, 0.95, 0.99]:
        max_dist = werner_parameter_to_max_distance(target_w, p_dark=p_dark, alpha_db_per_km=alpha)
        assert max_dist > 0.0

        # Round-trip verification: evaluating w at max_dist must match target_w
        computed_w = fiber_distance_to_werner_parameter(max_dist, p_dark=p_dark, alpha_db_per_km=alpha)
        assert abs(computed_w - target_w) < 1e-6

    # Out of range target w
    with pytest.raises(ValueError, match="strictly inside"):
        werner_parameter_to_max_distance(0.0)

    with pytest.raises(ValueError, match="strictly inside"):
        werner_parameter_to_max_distance(1.0)


def test_fiber_link_physics_dataclass():
    """Verify FiberLinkPhysics structured report integrity and immutability."""
    report = evaluate_fiber_link(80.0, p_dark=1e-4, alpha_db_per_km=0.20)
    assert isinstance(report, FiberLinkPhysics)
    assert report.length_km == 80.0
    assert report.attenuation_db == 16.0  # 80 * 0.2
    assert abs(report.transmittance - 10.0 ** (-1.6)) < 1e-12
    # Latency: 80 km * 0.005 ms/km = 0.40 ms
    assert abs(report.propagation_delay_ms - 0.40) < 1e-12

    # Dataclass is frozen (immutable)
    with pytest.raises(Exception):
        report.length_km = 90.0  # type: ignore


def test_amplitude_damping_channel_properties():
    """Verify Kraus operator completeness for Amplitude Damping channel (photon loss / T1)."""
    for gamma in [0.0, 0.25, 0.50, 0.75, 1.0]:
        kraus = make_amplitude_damping_channel(gamma)
        assert isinstance(kraus, Kraus)

        # Completeness relation: sum K_i^dagger K_i = I_2
        identity_sum = np.zeros((2, 2), dtype=complex)
        for k_mat in kraus.data:
            identity_sum += k_mat.conj().T @ k_mat
        assert np.allclose(identity_sum, np.eye(2), atol=1e-7)

    # Invalid gamma values
    with pytest.raises(ValueError, match="must be in"):
        make_amplitude_damping_channel(-0.1)

    with pytest.raises(ValueError, match="must be in"):
        make_amplitude_damping_channel(1.1)


def test_phase_damping_channel_properties():
    """Verify Kraus operator completeness for Phase Damping channel (pure dephasing / T2)."""
    for lambda_param in [0.0, 0.2, 0.5, 0.8, 1.0]:
        kraus = make_phase_damping_channel(lambda_param)
        assert isinstance(kraus, Kraus)

        # Completeness relation: sum K_i^dagger K_i = I_2
        identity_sum = np.zeros((2, 2), dtype=complex)
        for k_mat in kraus.data:
            identity_sum += k_mat.conj().T @ k_mat
        assert np.allclose(identity_sum, np.eye(2), atol=1e-7)

    # Invalid lambda parameter
    with pytest.raises(ValueError, match="must be in"):
        make_phase_damping_channel(-0.5)

    with pytest.raises(ValueError, match="must be in"):
        make_phase_damping_channel(1.5)


def test_quantum_memory_channel_physical_bounds():
    """Verify physical bounds of quantum memory decoherence channel (T2 <= 2*T1)."""
    # Valid physical parameters: T1 = 1000 μs, T2 = 800 μs (T2 <= 2*T1 holds)
    kraus = make_quantum_memory_channel(storage_time_us=50.0, t1_us=1000.0, t2_us=800.0)
    assert isinstance(kraus, Kraus)

    # Verify Kraus completeness
    identity_sum = np.zeros((2, 2), dtype=complex)
    for k_mat in kraus.data:
        identity_sum += k_mat.conj().T @ k_mat
    assert np.allclose(identity_sum, np.eye(2), atol=1e-6)

    # Physical violation: T2 > 2*T1 must raise ValueError (fundamental quantum limit)
    with pytest.raises(ValueError, match="Physical violation: T2"):
        make_quantum_memory_channel(storage_time_us=10.0, t1_us=500.0, t2_us=1200.0)  # 1200 > 2*500

    # Negative storage time raises ValueError
    with pytest.raises(ValueError, match="cannot be negative"):
        make_quantum_memory_channel(storage_time_us=-5.0, t1_us=1000.0, t2_us=500.0)

    # Zero or negative T1/T2 raises ValueError
    with pytest.raises(ValueError, match="must be positive"):
        make_quantum_memory_channel(storage_time_us=10.0, t1_us=0.0, t2_us=500.0)
