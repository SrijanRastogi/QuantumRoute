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

export interface ChannelPreset {
  id: string;
  label: string;
  alpha_db_per_km: number;
  description: string;
}

export interface ChannelDefaults {
  alpha_db_per_km: number;
  coupling_efficiency: number;
  p_dark: number;
  raw_visibility: number;
  t2_memory_us: number;
  latency_ms_per_km: number;
  presets: ChannelPreset[];
  assumptions: Record<string, string>;
}

export interface PhysicalLinkWorkedExample {
  step1_attenuation: string;
  step2_transmittance: string;
  step3_total: string;
  step4_quality: string;
  step5_fidelity: string;
}

export interface PhysicalLinkResponse {
  distance_km: number;
  alpha_db_per_km: number;
  coupling_efficiency: number;
  attenuation_db: number;
  transmittance_fiber: number;
  transmittance_total: number;
  propagation_delay_ms: number;
  conditional_werner_w: number;
  conditional_bell_fidelity: number;
  conditional_teleport_fidelity: number;
  expected_attempts: number | null;
  is_decoupled: boolean;
  worked_example: PhysicalLinkWorkedExample;
}

export interface PhysicalSweepPoint {
  distance_km: number;
  attenuation_db: number;
  eta_fiber: number;
  eta_total: number;
  transmission_percent: number;
  w_heuristic: number;
  w_decoupled: number;
  bell_fidelity_heuristic: number;
  bell_fidelity_decoupled: number;
  delay_ms: number;
}

export interface PhysicalSweepResponse {
  alpha_db_per_km: number;
  coupling_efficiency: number;
  raw_visibility: number;
  p_dark: number;
  points: PhysicalSweepPoint[];
  takeaway: string;
}

export interface PhysicalPathHop {
  hop_index: number;
  from: string;
  to: string;
  distance_km: number;
  alpha_db_per_km: number;
  loss_db: number;
  transmittance_total: number;
  transmission_pct: number;
  werner_w: number;
  bell_fidelity: number;
  delay_ms: number;
}

export interface PhysicalPathResponse {
  num_hops: number;
  total_distance_km: number;
  total_attenuation_db: number;
  path_success_probability: number;
  path_success_percent: number;
  conditional_werner_w: number;
  conditional_bell_fidelity: number;
  conditional_teleport_fidelity: number;
  total_propagation_delay_ms: number;
  memory_effects: {
    t2_memory_us: number;
    memory_decay_factor: number;
    werner_with_memory: number;
    bell_fidelity_with_memory: number;
    teleport_fidelity_with_memory: number;
  };
  hops: PhysicalPathHop[];
  assumptions: Record<string, string>;
}

export interface PhysicalRouteEval {
  strategy: string;
  path: string[];
  num_hops: number;
  total_distance_km: number;
  total_attenuation_db: number;
  path_success_probability: number;
  conditional_werner_w: number;
  conditional_bell_fidelity: number;
  conditional_teleport_fidelity: number;
  total_delay_ms: number;
  fidelity_with_memory: number;
}

export interface PhysicalRouteCompareResponse {
  topology: string;
  source: string;
  target: string;
  routes: {
    shortest_hop: PhysicalRouteEval | null;
    quality_aware: PhysicalRouteEval | null;
    multi_metric: PhysicalRouteEval | null;
  };
  scientific_insight: string;
}

// ==============================================================================
// Milestone 4: Entanglement Purification Interfaces
// ==============================================================================

export interface PurificationPreset {
  id: string;
  label: string;
  werner_w: number;
  bell_fidelity: number;
  description: string;
}

export interface PurificationDefaults {
  default_werner_w: number;
  default_bell_fidelity: number;
  threshold_fidelity: number;
  threshold_werner_w: number;
  fixed_point_mixed_fidelity: number;
  fixed_point_ideal_fidelity: number;
  presets: PurificationPreset[];
  scientific_assumptions: Record<string, string>;
}

export interface PurificationEvaluateResponse {
  input_werner_w: number;
  input_bell_fidelity: number;
  input_teleport_fidelity: number;
  success_probability: number;
  output_bell_coefficients: {
    'Phi+': number;
    'Phi-': number;
    'Psi+': number;
    'Psi-': number;
  };
  output_bell_fidelity: number;
  output_werner_w_twirled: number;
  output_teleport_fidelity: number;
  fidelity_gain: number;
  is_purified: boolean;
  expected_raw_pairs_consumed: number;
  threshold_fidelity: number;
  threshold_werner_w: number;
  apply_twirling: boolean;
  worked_example: Record<string, string>;
}

export interface PurificationSweepPoint {
  fidelity_in: number;
  werner_w_in: number;
  fidelity_out: number;
  werner_w_out: number;
  success_probability: number;
  expected_pairs: number;
  is_purified: boolean;
}

export interface PurificationSweepResponse {
  points: PurificationSweepPoint[];
  threshold_fidelity: number;
}

export interface PurificationShotsResponse {
  input_werner_w: number;
  input_bell_fidelity: number;
  total_attempts: number;
  accepted_attempts: number;
  estimated_success_probability: number;
  success_probability_uncertainty: number;
  estimated_output_fidelity: number | null;
  output_fidelity_uncertainty: number | null;
  estimated_bell_coefficients: {
    'Phi+': number;
    'Phi-': number;
    'Psi+': number;
    'Psi-': number;
  };
  expected_raw_pairs_consumed_estimate: number | null;
  fidelity_reliable: boolean;
  warning_message: string | null;
  analytical_success_probability: number;
  analytical_output_fidelity: number;
  analytical_expected_raw_pairs: number;
}

// ==============================================================================
// Phase 3: QASM, Validation, and State Analysis Types
// ==============================================================================

export interface QasmCircuitOption {
  id: string;
  label: string;
}

export interface QasmExportRequest {
  circuit_type: string;
  theta?: number;
  phi?: number;
  werner_w?: number;
  idealized?: boolean;
}

export interface QasmExportResponse {
  circuit_type: string;
  circuit_name: string;
  description: string;
  qasm: string;
  qubit_count: number;
  classical_bit_count: number;
  depth: number;
  gate_count: Record<string, number>;
  is_valid: boolean;
  is_idealized: boolean;
  omitted_channel_notes?: string | null;
  validation_notes: string[];
  loads_parsed?: boolean | null;
}

export interface ValidationBenchmarkItem {
  test_id: string;
  name: string;
  description: string;
  hop_count: number;
  link_werner_parameters: number[];
  w_analytical: number;
  f_bell_predicted: number;
  f_bell_simulated: number;
  f_tel_predicted: number;
  f_tel_simulated: number;
  bell_delta: number;
  tolerance: number;
  is_valid: boolean;
  status: string;
  beats_classical: boolean;
  circuit_qubits: number;
}

export interface NoiseValidationPoint {
  p: number;
  f_theory: number;
  f_sim: number;
  delta: number;
  is_valid: boolean;
  beats_classical: boolean;
}

export interface BenchmarkSuiteResponse {
  timestamp: string;
  tolerance: number;
  overall_status: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  max_observed_residual: number;
  benchmarks: ValidationBenchmarkItem[];
  noise_sweep: NoiseValidationPoint[];
  assumptions: string[];
}

export interface AnalysisPreset {
  id: string;
  label: string;
  theta: number;
  phi: number;
}

export interface TomographyRequest {
  preset?: string;
  theta?: number;
  phi?: number;
  shots?: number;
  depolarizing_p?: number;
  seed?: number;
}

export interface TomographyResponse {
  state_label: string;
  theta: number;
  phi: number;
  shots: number;
  depolarizing_p: number;
  rx: number;
  ry: number;
  rz: number;
  bloch_radius: number;
  theoretical_rx: number;
  theoretical_ry: number;
  theoretical_rz: number;
  std_err_x: number;
  std_err_y: number;
  std_err_z: number;
  fidelity_with_target: number;
  purity: number;
  density_matrix_real: number[][];
  density_matrix_imag: number[][];
}


