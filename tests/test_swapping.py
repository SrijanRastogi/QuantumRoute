"""Unit tests for circuit-level multi-hop entanglement swapping (QR-005)."""

import pytest
import numpy as np

from quantumroute.swapping import (
    create_werner_density_matrix,
    simulate_swapping_chain,
    calculate_end_to_end_bell_fidelity,
)


def test_werner_density_matrix_properties():
    """Verify trace normalization, Hermiticity, and positive semi-definiteness of Werner states."""
    for w in [1.0, 0.75, 0.5, 0.25, 0.0]:
        dm = create_werner_density_matrix(w)
        # Trace normalization
        assert np.isclose(np.trace(dm.data), 1.0, atol=1e-7)
        # Hermiticity
        assert np.allclose(dm.data, dm.data.conj().T, atol=1e-7)
        # Positive semi-definiteness
        eigvals = np.linalg.eigvalsh(dm.data)
        assert np.all(eigvals >= -1e-7)


def test_werner_density_matrix_boundary_fidelity():
    """Verify Bell-state fidelity: F_e = (1 + 3w) / 4."""
    # Ideal Bell pair (w = 1.0) => F_e = 1.0
    dm_pure = create_werner_density_matrix(1.0)
    assert np.isclose(calculate_end_to_end_bell_fidelity(dm_pure), 1.0, atol=1e-6)

    # Completely mixed (w = 0.0) => F_e = 0.25
    dm_mixed = create_werner_density_matrix(0.0)
    assert np.isclose(calculate_end_to_end_bell_fidelity(dm_mixed), 0.25, atol=1e-6)


def test_single_hop_swapping_chain():
    """A 1-hop chain (no repeaters) directly yields the link Werner state."""
    w = 0.82
    dm = simulate_swapping_chain([w])
    fid = calculate_end_to_end_bell_fidelity(dm)
    expected_fid = (1.0 + 3.0 * w) / 4.0
    assert np.isclose(fid, expected_fid, atol=1e-5)


def test_two_hop_swapping_chain():
    """A 2-hop chain performs 1 intermediate Bell measurement and coherent correction.

    Under ideal projective measurements: w_path = w1 * w2.
    """
    w1 = 0.90
    w2 = 0.80
    dm = simulate_swapping_chain([w1, w2])
    fid = calculate_end_to_end_bell_fidelity(dm)
    expected_w = w1 * w2
    expected_fid = (1.0 + 3.0 * expected_w) / 4.0
    assert np.isclose(fid, expected_fid, atol=1e-4)


def test_three_hop_swapping_chain():
    """A 3-hop chain performs 2 intermediate Bell measurements and corrections."""
    w1 = 0.95
    w2 = 0.90
    w3 = 0.85
    dm = simulate_swapping_chain([w1, w2, w3])
    fid = calculate_end_to_end_bell_fidelity(dm)
    expected_w = w1 * w2 * w3
    expected_fid = (1.0 + 3.0 * expected_w) / 4.0
    assert np.isclose(fid, expected_fid, atol=1e-4)


def test_swapping_parameter_validation():
    """Verify that invalid inputs to swapping simulation raise ValueError."""
    with pytest.raises(ValueError):
        simulate_swapping_chain([])

    with pytest.raises(ValueError):
        simulate_swapping_chain([-0.1])

    with pytest.raises(ValueError):
        simulate_swapping_chain([1.2])
