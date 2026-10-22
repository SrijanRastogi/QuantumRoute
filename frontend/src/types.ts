/**
 * QuantumRoute V2 Data Types & Interfaces
 */

export interface NetworkNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: string;
  role: 'source' | 'destination' | 'relay' | 'hub';
  is_hub?: boolean;
}

export interface NetworkEdge {
  source: string;
  target: string;
  w: number;
  bell_fidelity: number;
  distance_km: number;
  delay_ms: number;
}

export interface LinkOverride {
  source: string;
  target: string;
  distance_km?: number;
  w?: number;
}

export interface NetworkGraphData {
  name: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface RouteDetail {
  path: string[];
  num_hops: number;
  werner_parameter: number;
  bell_fidelity: number;
  average_teleportation_fidelity: number;
  total_distance_km: number;
  total_delay_ms: number;
  cost: number;
  strategy: string;
}

export interface HopBreakdown {
  from: string;
  to: string;
  distance_km: number;
  w: number;
  delay_ms: number;
}

export interface RouteResponse {
  selected_strategy: string;
  selected_route: RouteDetail | null;
  hops_breakdown: HopBreakdown[];
  werner_improvement_pct: number;
  comparison: {
    shortest_hop: RouteDetail | null;
    quality_aware: RouteDetail | null;
    multi_metric: RouteDetail | null;
  };
}

export interface SimulationResult {
  status: string;
  path: string[];
  num_hops: number;
  link_qualities?: number[];
  total_distance_km: number;
  theoretical: {
    path_werner_w: number;
    bell_fidelity: number;
    average_teleportation_fidelity: number;
  };
  circuit_simulation: {
    simulated_bell_fidelity: number;
    state_fidelity: number;
    fidelity_error_delta: number;
    qubits_evolved: number;
    engine: string;
  };
  bloch_vectors: {
    input: { x: number; y: number; z: number };
    output: { x: number; y: number; z: number };
  };
}

export interface EducationalExplanation {
  for_beginners: {
    headline: string;
    concept: string;
    key_takeaway: string;
  };
  scientific_invariants: string[];
}

export interface StatePreset {
  id: string;
  symbol: string;
  label: string;
  theta: number;
  phi: number;
  bloch_vector: [number, number, number];
  basis: string;
  description: string;
}

export interface StatePrepResponse {
  theta: number;
  phi: number;
  bloch_vector: [number, number, number];
  bloch_radius: number;
  purity: number;
  density_matrix: {
    real: number[][];
    imag: number[][];
  };
  amplitudes: {
    alpha: [number, number];
    beta: [number, number];
  };
  formula: string;
}

export interface CartesianStateResponse {
  x: number;
  y: number;
  z: number;
  radius: number;
  is_valid: boolean;
  validation_message: string | null;
  theta: number;
  phi: number;
  normalized: [number, number, number];
  is_mixed: boolean;
  purity: number;
  density_matrix: {
    real: number[][];
    imag: number[][];
  };
  amplitudes: {
    alpha: [number, number];
    beta: [number, number];
  };
  formula: string;
}

export interface GuidedStep {
  step: number;
  title: string;
  qubit: string;
  detail: string;
  bloch_coords?: [number, number, number] | null;
}

export interface TomographyData {
  shots: number;
  empirical_bloch_vector: [number, number, number];
  empirical_radius: number;
  empirical_fidelity: number | null;
  purity: number;
  std_errors: {
    x: number;
    y: number;
    z: number;
  };
  density_matrix: {
    real: number[][];
    imag: number[][];
  };
}

export interface TeleportExperimentResponse {
  input_state: {
    theta: number;
    phi: number;
    bloch_vector: [number, number, number];
    bloch_radius: number;
    density_matrix: {
      real: number[][];
      imag: number[][];
    };
  };
  noise_parameter: number;
  werner_parameter: number;
  bell_fidelity: number;
  output_state: {
    bloch_vector: [number, number, number];
    bloch_radius: number;
    purity: number;
    density_matrix: {
      real: number[][];
      imag: number[][];
    };
  };
  metrics: {
    state_fidelity: number;
    theoretical_fidelity: number;
    fidelity_discrepancy: number;
    classical_threshold: number;
    has_quantum_advantage: boolean;
  };
  circuit: {
    num_qubits: number;
    depth: number;
    ops_count: Record<string, number>;
    qasm: string;
  };
  guided_steps: GuidedStep[];
  tomography: TomographyData | null;
}

export interface NoiseSweepPoint {
  noise_p: number;
  werner_w: number;
  bell_fidelity: number;
  state_fidelity: number;
  theoretical_fidelity: number;
  discrepancy: number;
  bloch_radius: number;
  purity: number;
  has_quantum_advantage: boolean;
}

export interface NoiseSweepResponse {
  theta: number;
  phi: number;
  classical_threshold: number;
  max_discrepancy: number;
  points: NoiseSweepPoint[];
  explanation: string;
}
