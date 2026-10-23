# QuantumRoute V2 — Frontend Application

Interactive React + TypeScript + Vite + Three.js quantum network simulator and 3D Bloch sphere explorer.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5173`. Make sure the FastAPI backend is running on `http://localhost:8000`.

### 3. Production Build
```bash
npm run build
```
Type checks via `tsc -b` and produces optimized bundles in `dist/`.

## Architecture & Features

- **3D Bloch Sphere Explorer:** Interactive Three.js WebGL visualization (`BlochSphere.tsx`) with orbit drag controls, camera reset, latitude/meridian grids, and dual vectors (cyan input state, magenta post-noise state).
- **Cartesian Coordinate Editor:** Live synchronized $X, Y, Z$ inputs, pure state unit constraint validation ($x^2+y^2+z^2=1.0$), explicit unit normalization, and mixed state ($||r|| \le 1.0$) mode.
- **Interactive Network Lab:** Canvas-based topology editor with click-to-edit link distances and Werner quality parameters, Dijkstra quality routing, and multi-metric comparison.
- **Scientific Teleportation Simulator:** Real-time state tomography, density matrix extraction, and fidelity sweeps powered by Qiskit Aer.
