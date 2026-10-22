/**
 * QuantumRoute V2 API Client
 */

import type {
  NetworkGraphData,
  RouteResponse,
  SimulationResult,
  EducationalExplanation,
} from './types';

const API_BASE_URL = 'http://localhost:8000/api';

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

