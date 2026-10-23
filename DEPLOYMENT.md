# QuantumRoute ⚛️ — Live Deployment Guide (`DEPLOYMENT.md`)

**Project:** QuantumRoute™ — Noise-Aware Quantum Communication & Entanglement-Based Teleportation  
**Team:** Quantum D Clan (`VTU-QFF-HC-0126`)  
**Hackathon:** VTU-Qiskit Fall Fest 2026 · VTU Belagavi  
**Live Production URL:** 🌐 [https://quantumroute-gazw.onrender.com](https://quantumroute-gazw.onrender.com)

---

## 🚀 Live Application Access

The entire unified QuantumRoute V2 platform is live and publicly accessible:

```
🔗 Live Application: https://quantumroute-gazw.onrender.com
🏥 Health Check:    https://quantumroute-gazw.onrender.com/api/health
```

Anyone opening this single link can access both the landing page, educational showcase, and the complete quantum simulation workstation without installing any local software.

---

## 🌐 Deployed Features & Workstations

The deployed instance runs the unified full-stack architecture combining the **React 19 + Three.js frontend** and the **FastAPI + Qiskit 1.4+ backend**:

### 1. Landing Page (`/`)
- **Quantum Hero Canvas:** Interactive 3D particle and entanglement field visualizer built with Three.js.
- **Product Overview & Features:** Visual walkthrough of the classical routing fallacy, Horodecki thresholds, and quality-aware Dijkstra routing.
- **One-Click Simulator Access:** Direct entry point into the live simulation workstation.

### 2. Live Simulator & Research Labs (`/simulator`)
- 🌐 **Network Lab:** Interactive topology graph (Karnataka Quantum Backbone, 7-Node Benchmark, Ring, Star, Grid), dynamic link Werner parameter overrides, and live routing comparison (BFS vs Quality-Aware Dijkstra vs Multi-Metric).
- 🧪 **Experiments Lab:** Single-qubit state preparation ($|\psi\rangle = \cos(\theta/2)|0\rangle + e^{i\phi}\sin(\theta/2)|1\rangle$), 3D Plotly Bloch sphere projection, and depolarizing noise sweeps.
- 🔬 **State Analysis Lab:** Finite-shot Pauli basis tomography ($X, Y, Z$), Stokes vector inversion, and output density matrix purity tracking.
- 📡 **Channels Lab:** Realistic silica fiber attenuation ($\alpha = 0.2\text{ dB/km}$ at $1550\text{ nm}$), transmittance loss, and SNR bounds.
- ✨ **Purification Lab:** 4-qubit bilateral CNOT BBPSSW quantum distillation protocol, parity post-selection, and multi-round fidelity enhancement.
- 💻 **OpenQASM Export Lab:** Instant compilation and export of verified circuits to OpenQASM 3.0 for execution on IBM Quantum hardware.
- ✅ **Validation Lab:** Automated comparison between theoretical Werner algebra predictions and exact Qiskit Aer density-matrix circuit simulations.
- 📖 **Documentation & ADRs:** Full architectural decision records and scientific invariants.

---

## 🏗️ Architecture & Deployment Overview

```
                      User Browser
                           │
                           ▼ HTTPS (Port 443)
       ┌────────────────────────────────────────────────────────┐
       │     Render Cloud Host (quantumroute-gazw.onrender.com) │
       │                                                        │
       │   ┌────────────────────────────────────────────────┐   │
       │   │  Uvicorn + FastAPI Unified Server (Port 8000)  │   │
       │   └──────────────────────┬─────────────────────────┘   │
       │                          │                             │
       │          ┌───────────────┴───────────────┐             │
       │          ▼                               ▼             │
       │   Static Files (SPA)             Scientific API        │
       │   (frontend/dist/)               (/api/...)            │
       │   • React 19 + Vite 8            • /api/network/route  │
       │   • Three.js 3D Visualizer       • /api/simulate       │
       │   • Landing & 8 Labs             • /api/channels       │
       │                                  • /api/purification   │
       │                                  • /api/tomography     │
       │                                  • /api/qasm           │
       │                                  • /api/health         │
       │                                          │             │
       │                                          ▼             │
       │                                  Qiskit 1.4.6          │
       │                                  Qiskit Aer 0.18.0     │
       │                                  NetworkX 3.7+         │
       └────────────────────────────────────────────────────────┘
```

---

## 🧪 Verification & Health Check

You can verify the backend status and quantum engine version by querying the health endpoint:

```bash
curl -s https://quantumroute-gazw.onrender.com/api/health
```

Expected JSON response:
```json
{
  "status": "healthy",
  "service": "QuantumRoute V2 API",
  "version": "2.0.0",
  "engine": "Qiskit 1.4.6 / Qiskit Aer 0.18.0"
}
```

---

## 👥 Hackathon Submission Details

- **Project:** QuantumRoute™
- **Team:** Quantum D Clan
- **Team ID:** `VTU-QFF-HC-0126`
- **Institution:** Visvesvaraya Technological University (VTU) Belagavi
- **Repository:** `https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-quantum-d-clan`
- **Live Link:** `https://quantumroute-gazw.onrender.com`
