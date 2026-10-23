"""QR-000: Environment and Qiskit Aer smoke tests."""

import pytest
import numpy as np
import qiskit
import qiskit_aer
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator


def test_required_package_imports():
    """Verify that all required quantum, graph, and numerical libraries import cleanly."""
    import networkx
    assert hasattr(qiskit, "__version__"), "Qiskit must have __version__"
    assert hasattr(qiskit_aer, "__version__"), "Qiskit Aer must have __version__"
    assert hasattr(np, "__version__"), "NumPy must have __version__"
    assert hasattr(pytest, "__version__"), "pytest must have __version__"
    assert hasattr(networkx, "__version__"), "NetworkX must have __version__"


def test_aer_simulator_smoke():
    """Execute a minimal Bell-state simulation to verify Qiskit Aer functionality."""
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0, 1)
    qc.save_statevector()

    sim = AerSimulator(method="statevector")
    result = sim.run(qc).result()
    assert result.success, "Aer simulation failed"

    sv = result.get_statevector()
    # Bell state |Phi+> = 1/sqrt(2) (|00> + |11>)
    expected_prob_00 = abs(sv[0]) ** 2
    expected_prob_11 = abs(sv[3]) ** 2
    np.testing.assert_allclose(expected_prob_00, 0.5, atol=1e-6)
    np.testing.assert_allclose(expected_prob_11, 0.5, atol=1e-6)
