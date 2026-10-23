/**
 * QuantumRoute V2 API Client
 */

import type {
  NetworkGraphData,
  RouteResponse,
  SimulationResult,
  EducationalExplanation,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchTopologies(): Promise<{ presets: string[]; default: string }> {
  const res = await fetch(`${API_BASE_URL}/network/topologies`);
  if (!res.ok) throw new Error('Failed to fetch topologies');
  return res.json();
}

export async function fetchTopologyGraph(presetName: string): Promise<NetworkGraphData> {
  const encoded = encodeURIComponent(presetName);
  const res = await fetch(`${API_BASE_URL}/network/topologies/${encoded}`);
  if (!res.ok) throw new Error(`Failed to fetch topology: ${presetName}`);
  return res.json();
}

export async function calculateRoute(params: {
  topology: string;
  source: string;
  target: string;
  strategy: string;
  alpha?: number;
  link_overrides?: Array<{ source: string; target: string; distance_km?: number; w?: number }>;
}): Promise<RouteResponse> {
  const res = await fetch(`${API_BASE_URL}/network/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Route calculation failed' }));
    throw new Error(err.detail || 'Route calculation failed');
  }
  return res.json();
}

export async function runSimulation(params: {
  path: string[];
  topology: string;
  theta?: number;
  phi?: number;
  link_overrides?: Array<{ source: string; target: string; distance_km?: number; w?: number }>;
}): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Simulation execution failed' }));
    throw new Error(err.detail || 'Simulation execution failed');
  }
  return res.json();
}

export async function fetchExplanation(params?: {
  source?: string;
  target?: string;
  preset?: string;
}): Promise<EducationalExplanation> {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE_URL}/network/explain?${query}`);
  if (!res.ok) throw new Error('Failed to fetch explanation');
  return res.json();
}

export async function fetchStatePresets(): Promise<import('./types').StatePreset[]> {
  const res = await fetch(`${API_BASE_URL}/experiments/presets`);
  if (!res.ok) throw new Error('Failed to fetch state presets');
  return res.json();
}

export async function prepareCustomState(
  theta: number,
  phi: number
): Promise<import('./types').StatePrepResponse> {
  const res = await fetch(`${API_BASE_URL}/experiments/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theta, phi }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to prepare state' }));
    throw new Error(err.detail || 'Failed to prepare state');
  }
  return res.json();
}

export async function prepareCartesianState(
  x: number,
  y: number,
  z: number,
  is_mixed: boolean = false
): Promise<import('./types').CartesianStateResponse> {
  const res = await fetch(`${API_BASE_URL}/experiments/cartesian`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x, y, z, is_mixed }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to evaluate cartesian state' }));
    throw new Error(err.detail || 'Failed to evaluate cartesian state');
  }
  return res.json();
}

export async function runTeleportExperiment(params: {
  theta: number;
  phi: number;
  noise_p: number;
  shots?: number;
}): Promise<import('./types').TeleportExperimentResponse> {
  const res = await fetch(`${API_BASE_URL}/experiments/teleport`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Experiment execution failed' }));
    throw new Error(err.detail || 'Experiment execution failed');
  }
  return res.json();
}

export async function runNoiseSweep(params: {
  theta: number;
  phi: number;
  p_min?: number;
  p_max?: number;
  num_points?: number;
}): Promise<import('./types').NoiseSweepResponse> {
  const res = await fetch(`${API_BASE_URL}/experiments/noise-sweep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Noise sweep failed' }));
    throw new Error(err.detail || 'Noise sweep failed');
  }
  return res.json();
}

export async function fetchChannelDefaults(): Promise<import('./types').ChannelDefaults> {
  const res = await fetch(`${API_BASE_URL}/channels/defaults`);
  if (!res.ok) {
    throw new Error('Failed to load physical channel defaults');
  }
  return res.json();
}

export async function evaluatePhysicalLink(params: {
  distance_km: number;
  alpha_db_per_km?: number;
  coupling_efficiency?: number;
  p_dark?: number;
  raw_visibility?: number;
  use_decoupled_werner?: boolean;
}): Promise<import('./types').PhysicalLinkResponse> {
  const res = await fetch(`${API_BASE_URL}/channels/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Link evaluation failed' }));
    throw new Error(err.detail || 'Link evaluation failed');
  }
  return res.json();
}

export async function fetchDistanceSweep(params: {
  max_distance_km?: number;
  num_points?: number;
  alpha_db_per_km?: number;
  coupling_efficiency?: number;
  p_dark?: number;
  raw_visibility?: number;
}): Promise<import('./types').PhysicalSweepResponse> {
  const res = await fetch(`${API_BASE_URL}/channels/sweep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Distance sweep failed' }));
    throw new Error(err.detail || 'Distance sweep failed');
  }
  return res.json();
}

export async function evaluatePhysicalPath(params: {
  hops: Array<{
    from: string;
    to: string;
    distance_km: number;
    w?: number;
    alpha_db_per_km?: number;
    coupling_efficiency?: number;
  }>;
  alpha_db_per_km?: number;
  coupling_efficiency?: number;
  p_dark?: number;
  raw_visibility?: number;
  t2_memory_us?: number;
  use_decoupled_werner?: boolean;
}): Promise<import('./types').PhysicalPathResponse> {
  const res = await fetch(`${API_BASE_URL}/channels/path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Path evaluation failed' }));
    throw new Error(err.detail || 'Path evaluation failed');
  }
  return res.json();
}

export async function comparePhysicalRoutes(params: {
  topology: string;
  source: string;
  target: string;
  alpha_db_per_km?: number;
  coupling_efficiency?: number;
  p_dark?: number;
  raw_visibility?: number;
  t2_memory_us?: number;
}): Promise<import('./types').PhysicalRouteCompareResponse> {
  const res = await fetch(`${API_BASE_URL}/channels/compare-routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Route comparison failed' }));
    throw new Error(err.detail || 'Route comparison failed');
  }
  return res.json();
}

// ==============================================================================
// Milestone 4: Entanglement Purification API Client
// ==============================================================================

export async function fetchPurificationDefaults(): Promise<import('./types').PurificationDefaults> {
  const res = await fetch(`${API_BASE_URL}/purification/defaults`);
  if (!res.ok) {
    throw new Error('Failed to fetch purification defaults');
  }
  return res.json();
}

export async function evaluatePurification(params: {
  werner_w?: number;
  bell_fidelity?: number;
  apply_twirling?: boolean;
}): Promise<import('./types').PurificationEvaluateResponse> {
  const res = await fetch(`${API_BASE_URL}/purification/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Purification evaluation failed' }));
    throw new Error(err.detail || 'Purification evaluation failed');
  }
  return res.json();
}

export async function fetchPurificationSweep(params?: {
  min_fidelity?: number;
  max_fidelity?: number;
  num_points?: number;
}): Promise<import('./types').PurificationSweepResponse> {
  const res = await fetch(`${API_BASE_URL}/purification/sweep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Purification sweep failed' }));
    throw new Error(err.detail || 'Purification sweep failed');
  }
  return res.json();
}

export async function simulatePurificationShots(params: {
  werner_w?: number;
  bell_fidelity?: number;
  shots?: number;
  seed?: number;
}): Promise<import('./types').PurificationShotsResponse> {
  const res = await fetch(`${API_BASE_URL}/purification/simulate-shots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Finite-shot simulation failed' }));
    throw new Error(err.detail || 'Finite-shot simulation failed');
  }
  return res.json();
}

// ==============================================================================
// Phase 3: QASM Export, Validation, and State Analysis API Calls
// ==============================================================================

export async function fetchSupportedCircuits(): Promise<{ supported_circuits: import('./types').QasmCircuitOption[] }> {
  const res = await fetch(`${API_BASE_URL}/qasm/circuits`);
  if (!res.ok) {
    throw new Error('Failed to load supported circuits');
  }
  return res.json();
}

export async function exportQasm(params: import('./types').QasmExportRequest): Promise<import('./types').QasmExportResponse> {
  const res = await fetch(`${API_BASE_URL}/qasm/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'QASM export failed' }));
    throw new Error(err.detail || 'QASM export failed');
  }
  return res.json();
}

export async function fetchValidationBenchmarks(tolerance = 1e-4): Promise<import('./types').BenchmarkSuiteResponse> {
  const res = await fetch(`${API_BASE_URL}/validation/benchmarks?tolerance=${tolerance}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch validation benchmarks' }));
    throw new Error(err.detail || 'Failed to fetch validation benchmarks');
  }
  return res.json();
}

export async function runCustomValidation(params: {
  path_name?: string;
  link_werner_parameters: number[];
  tolerance?: number;
}): Promise<import('./types').ValidationBenchmarkItem> {
  const res = await fetch(`${API_BASE_URL}/validation/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Custom validation failed' }));
    throw new Error(err.detail || 'Custom validation failed');
  }
  return res.json();
}

export async function fetchAnalysisPresets(): Promise<{ presets: import('./types').AnalysisPreset[] }> {
  const res = await fetch(`${API_BASE_URL}/analysis/presets`);
  if (!res.ok) {
    throw new Error('Failed to load analysis presets');
  }
  return res.json();
}

export async function runStateTomography(params: import('./types').TomographyRequest): Promise<import('./types').TomographyResponse> {
  const res = await fetch(`${API_BASE_URL}/analysis/tomography`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Tomography analysis failed' }));
    throw new Error(err.detail || 'Tomography analysis failed');
  }
  return res.json();
}



