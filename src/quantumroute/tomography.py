"""Pauli-basis Quantum State Tomography with Finite-Shot Simulation.

Implements realistic single-qubit quantum state tomography via Pauli measurements
(X, Y, Z) executed on Qiskit Aer with finite shots.

The single-qubit density matrix is reconstructed via linear Stokes inversion:
    ρ = (I + r_x σ_x + r_y σ_y + r_z σ_z) / 2

Key Capabilities:
    - Transpiles and executes X (H + Meas), Y (S† + H + Meas), and Z (Meas) circuits.
    - Simulates realistic finite-shot variance O(1 / √shots).
    - Ensures physical validity via eigenvalue / Bloch-vector projection if shot noise
      momentarily pushes ||r|| > 1.
    - Evaluates tomographic purity, empirical state fidelity, and statistical confidence intervals.
"""

from dataclasses import dataclass
from typing import Dict, Optional, Tuple
import numpy as np
from qiskit import ClassicalRegister, QuantumCircuit, transpile
from qiskit.quantum_info import DensityMatrix, state_fidelity
from qiskit_aer import AerSimulator


@dataclass(frozen=True)
class TomographyResult:
    """Immutable data record summarizing Pauli quantum state tomography."""

    rx: float
    ry: float
    rz: float
    bloch_vector: Tuple[float, float, float]
    bloch_radius: float
    reconstructed_density_matrix: DensityMatrix
    shots: int
    fidelity_with_target: Optional[float]
    purity: float
    std_err_x: float
    std_err_y: float
    std_err_z: float


def pauli_matrices() -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return the three standard 2x2 Pauli spin matrices (σ_x, σ_y, σ_z)."""
    sigma_x = np.array([[0.0, 1.0], [1.0, 0.0]], dtype=complex)
    sigma_y = np.array([[0.0, -1.0j], [1.0j, 0.0]], dtype=complex)
    sigma_z = np.array([[1.0, 0.0], [0.0, -1.0]], dtype=complex)
    return sigma_x, sigma_y, sigma_z


def _validate_single_qubit_dm(rho: DensityMatrix) -> None:
    """Validate that density matrix is single-qubit (dimension 2)."""
    if not isinstance(rho, DensityMatrix):
        raise TypeError(f"Expected DensityMatrix, got {type(rho).__name__}")
    if rho.dim != 2:
        raise ValueError(f"Expected single-qubit DensityMatrix of dimension 2, got {rho.dim}")


def _validate_real_number(val: float, name: str) -> float:
    """Validate real float value, strictly rejecting booleans and non-reals."""
    if isinstance(val, bool) or not isinstance(val, (int, float)):
        raise TypeError(f"{name} must be a real number, got {type(val).__name__}")
    return float(val)


def _validate_shots(shots: int) -> int:
    """Validate shots parameter."""
    if isinstance(shots, bool) or not isinstance(shots, int):
        raise TypeError(f"shots must be an integer, got {type(shots).__name__}")
    if shots <= 0:
        raise ValueError(f"shots must be a positive integer, got {shots}")
    return shots


def exact_bloch_vector(rho: DensityMatrix) -> Tuple[float, float, float]:
    """Extract exact Pauli expectation values (r_x, r_y, r_z) from single-qubit state.

    Formulas:
        r_x = Tr(ρ σ_x) = 2 Re(ρ_01)
        r_y = Tr(ρ σ_y) = -2 Im(ρ_01)
        r_z = Tr(ρ σ_z) = ρ_00 - ρ_11

    Args:
        rho: Single-qubit DensityMatrix.

    Returns:
        Tuple of (r_x, r_y, r_z).
    """
    _validate_single_qubit_dm(rho)
    data = rho.data
    rx = float(2.0 * np.real(data[0, 1]))
    ry = float(-2.0 * np.imag(data[0, 1]))
    rz = float(np.real(data[0, 0] - data[1, 1]))
    return rx, ry, rz


def reconstruct_density_matrix(
    rx: float,
    ry: float,
    rz: float,
    physical_projection: bool = True,
) -> DensityMatrix:
    """Reconstruct single-qubit density matrix via linear Stokes inversion.

    ρ = (I + r_x σ_x + r_y σ_y + r_z σ_z) / 2
      = 0.5 * [[1 + r_z,       r_x - i r_y],
               [r_x + i r_y,   1 - r_z    ]]

    If physical_projection is True and ||r|| > 1.0 (due to finite-shot noise),
    rescales r to the sphere surface ||r|| = 1.0 to preserve positive semi-definiteness.

    Args:
        rx: Pauli-X expectation value.
        ry: Pauli-Y expectation value.
        rz: Pauli-Z expectation value.
        physical_projection: Whether to project non-physical states back to the Bloch ball.

    Returns:
        Normalized single-qubit DensityMatrix.
    """
    rx = _validate_real_number(rx, "rx")
    ry = _validate_real_number(ry, "ry")
    rz = _validate_real_number(rz, "rz")

    radius = float(np.sqrt(rx ** 2 + ry ** 2 + rz ** 2))
    if physical_projection and radius > 1.0:
        rx /= radius
        ry /= radius
        rz /= radius

    mat = 0.5 * np.array(
        [
            [1.0 + rz, rx - 1.0j * ry],
            [rx + 1.0j * ry, 1.0 - rz],
        ],
        dtype=complex,
    )
    return DensityMatrix(mat)


def build_tomography_circuits(
    circuit: QuantumCircuit,
    target_qubit: int = 0,
) -> Dict[str, QuantumCircuit]:
    """Generate the 3 Pauli measurement circuits for a designated target qubit.

    For basis B in {X, Y, Z}:
        - Basis Z: Measure target directly in computational basis.
        - Basis X: Apply H on target, then measure.
        - Basis Y: Apply S† followed by H on target, then measure.

    Args:
        circuit: Base QuantumCircuit preparing the quantum state.
        target_qubit: Index of qubit to be measured.

    Returns:
        Dictionary mapping {'X': qc_x, 'Y': qc_y, 'Z': qc_z}.
    """
    if isinstance(target_qubit, bool) or not isinstance(target_qubit, int):
        raise TypeError(f"target_qubit must be an integer, got {type(target_qubit).__name__}")
    if not (0 <= target_qubit < circuit.num_qubits):
        raise ValueError(
            f"target_qubit index {target_qubit} out of bounds for circuit with {circuit.num_qubits} qubits"
        )

    circuits: Dict[str, QuantumCircuit] = {}

    for basis in ("X", "Y", "Z"):
        qc = circuit.copy()
        cr = ClassicalRegister(1, name=f"meas_{basis.lower()}")
        qc.add_register(cr)

        if basis == "X":
            qc.h(target_qubit)
        elif basis == "Y":
            qc.sdg(target_qubit)
            qc.h(target_qubit)

        qc.measure(target_qubit, cr[0])
        circuits[basis] = qc

    return circuits


def execute_tomography(
    circuit: QuantumCircuit,
    target_qubit: int,
    shots: int = 4096,
    seed: Optional[int] = None,
    noise_model=None,
    target_density_matrix: Optional[DensityMatrix] = None,
) -> TomographyResult:
    """Execute finite-shot Pauli tomography on a target qubit of a QuantumCircuit.

    Args:
        circuit: QuantumCircuit to be characterized.
        target_qubit: Target qubit index on which tomography is performed.
        shots: Number of finite shots per Pauli measurement basis (default 4096).
        seed: Random seed for deterministic simulation reproducibility.
        noise_model: Optional Qiskit Aer noise model.
        target_density_matrix: Optional ideal reference state to evaluate fidelity.

    Returns:
        TomographyResult dataclass.
    """
    shots = _validate_shots(shots)
    circuits = build_tomography_circuits(circuit, target_qubit)

    sim = AerSimulator(noise_model=noise_model)

    expectations: Dict[str, float] = {}
    std_errors: Dict[str, float] = {}

    for basis in ("X", "Y", "Z"):
        transpiled_qc = transpile(circuits[basis], sim)
        job = sim.run(transpiled_qc, shots=shots, seed_simulator=seed)
        counts = job.result().get_counts()

        # Count bit outcomes on the classical register
        # Classical register has 1 bit, count keys are '0' or '1'
        n0 = 0
        n1 = 0
        for bitstring, count in counts.items():
            # In Qiskit, registers can format as spaces or single bit
            # Extract the measurement outcome for the classical register
            bit = bitstring.split()[0] if " " in bitstring else bitstring
            # The last added register is the first bit in Qiskit bitstring order
            if bit[0] == "0":
                n0 += count
            else:
                n1 += count

        exp_val = (n0 - n1) / shots
        exp_val = float(np.clip(exp_val, -1.0, 1.0))
        expectations[basis] = exp_val

        # Standard error of the sample mean for binomial observable in [-1, 1]:
        # Var(B) = 1 - <B>^2, SE = sqrt(Var(B) / N)
        var_b = max(0.0, 1.0 - exp_val ** 2)
        std_errors[basis] = float(np.sqrt(var_b / shots))

    rx = expectations["X"]
    ry = expectations["Y"]
    rz = expectations["Z"]

    bloch_radius = float(np.sqrt(rx ** 2 + ry ** 2 + rz ** 2))
    rho_reconstructed = reconstruct_density_matrix(rx, ry, rz, physical_projection=True)

    # Purity = Tr(ρ^2) = (1 + ||r||^2) / 2
    clamped_radius = min(1.0, bloch_radius)
    purity = float((1.0 + clamped_radius ** 2) / 2.0)

    fidelity = None
    if target_density_matrix is not None:
        _validate_single_qubit_dm(target_density_matrix)
        fidelity = float(np.real(state_fidelity(rho_reconstructed, target_density_matrix)))

    return TomographyResult(
        rx=rx,
        ry=ry,
        rz=rz,
        bloch_vector=(rx, ry, rz),
        bloch_radius=bloch_radius,
        reconstructed_density_matrix=rho_reconstructed,
        shots=shots,
        fidelity_with_target=fidelity,
        purity=purity,
        std_err_x=std_errors["X"],
        std_err_y=std_errors["Y"],
        std_err_z=std_errors["Z"],
    )


def sample_density_matrix_tomography(
    rho: DensityMatrix,
    shots: int = 4096,
    seed: Optional[int] = None,
    target_density_matrix: Optional[DensityMatrix] = None,
) -> TomographyResult:
    """Sample Pauli measurements directly from a single-qubit density matrix.

    Generates exact binomial finite-shot variance without transpiling circuits,
    ideal for high-performance sweeps and statistical validation.

    Args:
        rho: Single-qubit state to be sampled.
        shots: Measurement shots per basis.
        seed: Random seed for reproducibility.
        target_density_matrix: Optional reference state for fidelity evaluation.

    Returns:
        TomographyResult dataclass.
    """
    shots = _validate_shots(shots)
    _validate_single_qubit_dm(rho)
    rx_exact, ry_exact, rz_exact = exact_bloch_vector(rho)

    rng = np.random.default_rng(seed)

    expectations: Dict[str, float] = {}
    std_errors: Dict[str, float] = {}

    exact_vals = {"X": rx_exact, "Y": ry_exact, "Z": rz_exact}

    for basis in ("X", "Y", "Z"):
        exp_exact = exact_vals[basis]
        # Probability of outcome 0 (+1 eigenvalue): p0 = (1 + <B>) / 2
        p0 = (1.0 + exp_exact) / 2.0
        p0 = float(np.clip(p0, 0.0, 1.0))

        # Sample binomial counts
        n0 = int(rng.binomial(n=shots, p=p0))
        n1 = shots - n0

        sampled_exp = (n0 - n1) / shots
        expectations[basis] = float(np.clip(sampled_exp, -1.0, 1.0))

        var_b = max(0.0, 1.0 - sampled_exp ** 2)
        std_errors[basis] = float(np.sqrt(var_b / shots))

    rx = expectations["X"]
    ry = expectations["Y"]
    rz = expectations["Z"]

    bloch_radius = float(np.sqrt(rx ** 2 + ry ** 2 + rz ** 2))
    rho_reconstructed = reconstruct_density_matrix(rx, ry, rz, physical_projection=True)

    clamped_radius = min(1.0, bloch_radius)
    purity = float((1.0 + clamped_radius ** 2) / 2.0)

    fidelity = None
    ref_state = target_density_matrix if target_density_matrix is not None else rho
    fidelity = float(np.real(state_fidelity(rho_reconstructed, ref_state)))

    return TomographyResult(
        rx=rx,
        ry=ry,
        rz=rz,
        bloch_vector=(rx, ry, rz),
        bloch_radius=bloch_radius,
        reconstructed_density_matrix=rho_reconstructed,
        shots=shots,
        fidelity_with_target=fidelity,
        purity=purity,
        std_err_x=std_errors["X"],
        std_err_y=std_errors["Y"],
        std_err_z=std_errors["Z"],
    )
