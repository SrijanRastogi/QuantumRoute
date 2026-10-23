/**
 * Quantum Coordinate Transformation & Validation Utilities.
 *
 * Implements:
 * 1. Spherical (θ, φ) <-> Cartesian (x, y, z) bijective mapping.
 * 2. Stable pole handling convention: for z ≈ ±1, φ is set to 0.0.
 * 3. Validation of pure states (x² + y² + z² = 1 within floating tolerance).
 * 4. Validation of mixed states (x² + y² + z² ≤ 1).
 * 5. Explicit unit-sphere normalization.
 * 6. Reconstruction of single-qubit density matrix ρ and purity γ.
 */

export interface SphericalCoordinates {
  theta: number; // Polar angle in [0, π]
  phi: number;   // Azimuthal angle in [0, 2π)
  radius: number;
}

export interface CartesianCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface CoordinateValidationResult {
  isValid: boolean;
  radius: number;
  error: string | null;
  normalized: [number, number, number];
}

/**
 * Convert spherical angles (θ, φ) to Cartesian Bloch vector [x, y, z] on the unit sphere.
 */
export function sphericalToCartesian(theta: number, phi: number, radius: number = 1.0): [number, number, number] {
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const x = radius * sinTheta * cosPhi;
  const y = radius * sinTheta * sinPhi;
  const z = radius * cosTheta;

  // Clean numerical precision artifacts near 0
  const clean = (val: number) => (Math.abs(val) < 1e-10 ? 0.0 : val);

  return [clean(x), clean(y), clean(z)];
}

/**
 * Convert Cartesian Bloch vector (x, y, z) to spherical angles (θ, φ).
 * Implements stable pole convention: at the poles (z ≈ ±1 or r_xy < 1e-7), φ is 0.0.
 */
export function cartesianToSpherical(x: number, y: number, z: number): SphericalCoordinates {
  const radius = Math.sqrt(x * x + y * y + z * z);

  if (radius < 1e-12) {
    return { theta: 0.0, phi: 0.0, radius: 0.0 };
  }

  // Normalize for angle calculation
  const normZ = Math.max(-1.0, Math.min(1.0, z / radius));
  const normX = x / radius;
  const normY = y / radius;
  const rXY = Math.hypot(normX, normY);

  const theta = Math.acos(normZ);

  // Stable pole convention:
  // If z is at North pole (+Z, |0⟩) or South pole (-Z, |1⟩), φ is mathematically undefined.
  // Conventionally set φ = 0.0.
  let phi = 0.0;
  if (normZ >= 1.0 - 1e-6 || normZ <= -1.0 + 1e-6 || rXY < 1e-6) {
    phi = 0.0;
  } else {
    phi = Math.atan2(normY, normX);
    if (phi < 0.0) {
      phi += 2.0 * Math.PI;
    }
  }

  return { theta, phi, radius };
}

/**
 * Validate Cartesian Bloch coordinates for pure or mixed states.
 * Tolerance: ±0.01 for floating-point unit sphere constraints.
 */
export function validateCartesianCoordinates(
  x: number,
  y: number,
  z: number,
  isMixedMode: boolean = false,
  tolerance: number = 0.01
): CoordinateValidationResult {
  if (isNaN(x) || isNaN(y) || isNaN(z) || !isFinite(x) || !isFinite(y) || !isFinite(z)) {
    return {
      isValid: false,
      radius: 0.0,
      error: 'Coordinates must be valid finite numbers.',
      normalized: [0.0, 0.0, 1.0],
    };
  }

  const radius = Math.sqrt(x * x + y * y + z * z);

  // Compute normalized vector
  let normalized: [number, number, number] = [0.0, 0.0, 1.0];
  if (radius > 1e-12) {
    normalized = [x / radius, y / radius, z / radius];
  }

  if (!isMixedMode) {
    const isUnit = Math.abs(radius - 1.0) <= tolerance;
    return {
      isValid: isUnit,
      radius,
      error: isUnit
        ? null
        : `Pure states require x² + y² + z² = 1.0 (current radius ||r|| = ${radius.toFixed(3)}).`,
      normalized,
    };
  } else {
    const isPhysical = radius <= 1.0 + tolerance;
    return {
      isValid: isPhysical,
      radius,
      error: isPhysical
        ? null
        : `Physical states cannot exceed the Bloch sphere radius 1.0 (current radius ||r|| = ${radius.toFixed(3)}).`,
      normalized,
    };
  }
}

/**
 * Reconstruct single-qubit density matrix ρ via linear Stokes inversion:
 * ρ = 0.5 * (I + x σ_x + y σ_y + z σ_z)
 */
export function reconstructDensityMatrixFromBloch(x: number, y: number, z: number) {
  const real = [
    [0.5 * (1.0 + z), 0.5 * x],
    [0.5 * x, 0.5 * (1.0 - z)],
  ];
  const imag = [
    [0.0, -0.5 * y],
    [0.5 * y, 0.0],
  ];

  const radius = Math.sqrt(x * x + y * y + z * z);
  const purity = 0.5 * (1.0 + radius * radius);

  return { real, imag, purity };
}

/**
 * Compute state amplitudes for a pure state specified by (θ, φ):
 * |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩
 */
export function computePureAmplitudes(theta: number, phi: number) {
  const alpha = Math.cos(theta / 2.0);
  const sinHalf = Math.sin(theta / 2.0);
  const betaRe = Math.cos(phi) * sinHalf;
  const betaIm = Math.sin(phi) * sinHalf;

  return {
    alpha: [alpha, 0.0] as [number, number],
    beta: [betaRe, betaIm] as [number, number],
    formula: `|ψ⟩ = ${alpha.toFixed(3)}|0⟩ + (${betaRe.toFixed(3)} + ${betaIm.toFixed(3)}i)|1⟩`,
  };
}
