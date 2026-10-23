# QuantumRoute ⚛️
### Noise-Aware Quantum Communication & Entanglement-Based Teleportation

**Quantum D Clan** · `VTU-QFF-HC-0126` · **Tier: Both**  
VTU-Qiskit Fall Fest 2026 Hackathon · VTU Belagavi

| Detail | Information |
|---|---|
| Team | Quantum D Clan |
| Team ID | VTU-QFF-HC-0126 |
| Track | Quantum Communication & Networking |
| Repository | `vtu-hc-quantum-d-clan` |
| Organisation | `vtu-qiskit-fall-fest-2026` |
| Project | QuantumRoute |
| Status | ✅ QuantumRoute V2 Complete & Verified (138/138 Tests Passing) |
| Core Technology | Python, Qiskit, Qiskit Aer, FastAPI, React, Three.js, TypeScript |

---

## 📌 Table of Contents

- [Team Members](#-team-members-github-ids)
- [Problem Statement](#-problem-statement)
- [Proposed Solution](#-proposed-solution)
- [Approach & Architecture](#-approach--architecture)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [How to Run](#-how-to-run)
- [How to Push Code](#-how-to-push-code)
- [Submission Checklist](#-submission-checklist)
- [Resources](#-resources)
- [License](#-license)

---

## 👥 Team Members (GitHub IDs)


| # | Name | GitHub Username | Role |
|---|---|---|---|
| 1 | Yuvaraj B Sutar | YUVA56-gomu | Team Lead |
| 2 | Srijan Rastogi | SrijanRastogi | Developer |
| 3 | Veeresh M A | Veeresh23-06 | Developer |

---

## ❓ Problem Statement

**Problem:** Reliable quantum communication requires the transfer of quantum information while preserving the properties of quantum states. Noise affecting distributed entangled states can reduce teleportation fidelity, while selecting a communication path based only on hop count may overlook differences in link quality.

**Why it matters:** Understanding how noise and entanglement quality influence end-to-end communication is important when studying future quantum networks. A simulator can help users investigate these effects before attempting more complex network implementations.

**Track / Category:** Quantum Communication & Networking — VTU-Qiskit Fall Fest 2026.

---

## 💡 Proposed Solution

**Solution:** QuantumRoute is a Qiskit-based simulator designed to investigate noise-aware quantum communication using entanglement-based teleportation. It will compare ideal and noisy teleportation, model entanglement distribution across small network topologies, and compare shortest-hop routing with quality-aware routing.

**Key idea:** Combine Qiskit circuit simulation with an analytical Werner-state network model, then validate the model against circuit-based results where the assumptions permit.

**Why this works:** The project connects quantum circuit behaviour with network-level decisions. By measuring teleportation fidelity under controlled noise and evaluating alternative routes, QuantumRoute aims to demonstrate how link quality can influence simulated end-to-end communication reliability.

### Implementation status & capabilities

- [x] **Environment & setup (QR-000):** Verified Python 3.12.14 virtual environment with Qiskit 1.4.6, Qiskit Aer 0.18.0, NumPy 2.5.4, SciPy 1.18.1, and pytest 9.1.1.
- [x] **Quantum teleportation (QR-001):** Implemented and verified single-link teleportation circuit (`src/quantumroute/teleport.py`) with deferred-measurement coherent corrections and receiver subsystem extraction. Tested across cardinal states and 25 pseudo-random Bloch sphere states ($F \ge 0.9999$).
- [x] **Noise experiments (QR-002):** Implemented and verified depolarizing noise channel on distributed link qubit (`src/quantumroute/noise.py`, `src/quantumroute/experiments.py`). Validated theoretical curve $F = 1 - p/2$ across 21 points in $p \in [0, 1]$ ($\Delta < 1.3 \times 10^{-15}$).
- [x] **Quantum network model (QR-003):** Implemented and verified Werner-state link mechanics and path composition product rule ($w_{\text{path}} = \prod w_e$, $F_{e,\text{path}} = (1+3w_{\text{path}})/4$, $F_{\text{tel,avg}} = (2F_{e,\text{path}}+1)/3$) on a standard 7-node benchmark topology (`src/quantumroute/network.py`). Verified that Bell fidelities must never be directly multiplied.
- [x] **Quality-aware routing (QR-004):** Implemented and verified BFS shortest-hop and Dijkstra quality-aware ($-\ln(w_e)$) routing algorithms (`src/quantumroute/routing.py`). Proved Dijkstra matches brute-force exhaustive simple-path enumeration across all 21 node pairs. Verified benchmark divergence cases ('A'->'D' and 'A'->'G') where Dijkstra selects longer paths with substantially higher Werner parameter and state fidelity.
- [x] **Circuit-level entanglement swapping (QR-005):** Implemented and verified multi-hop quantum circuit simulation with Werner pairs and coherent feedforward corrections (`src/quantumroute/swapping.py`).
- [x] **Model validation harness (QR-006):** Analytical predictions vs. circuit-simulated validation harness (`src/quantumroute/validate.py`).
- [x] **Interactive dashboard (QR-007):** Streamlit interactive UI application (`src/quantumroute/app.py`).
- [x] **Arbitrary N-hop circuit compiler (QR-011):** Scalable 2N-qubit dynamic circuit generation with coherent feedforward across arbitrary repeater chains, verified for 4-hop and 5-hop exact simulations (`src/quantumroute/swapping.py`).
- [x] **Real-world telecom topologies & multi-metric routing (QR-012):** Authentic Karnataka Quantum Backbone with realistic fiber distances and dual-metric routing balancing quantum fidelity vs. classical signaling propagation latency (`src/quantumroute/network.py`, `src/quantumroute/routing.py`).
- [x] **Physical fiber attenuation & T1/T2 decoherence (QR-009):** Realistic silica optical fiber attenuation ($\alpha = 0.2\text{ dB/km}$ at $1550\text{ nm}$), dark count SNR scaling, and $T_1/T_2$ memory relaxation channels (`src/quantumroute/physics.py`).
- [x] **BBPSSW entanglement purification (QR-010):** 4-qubit bilateral CNOT quantum distillation protocol with parity post-selection and multi-round cascading, strictly enhancing Bell fidelity for any entangled input ($F > 0.5$) (`src/quantumroute/purification.py`).
- [x] **Quantum state tomography (QR-013):** Realistic Pauli basis ($X, Y, Z$) measurement engine with finite shots on Qiskit Aer and linear Stokes density-matrix reconstruction with physical projection (`src/quantumroute/tomography.py`).
- [x] **Interactive Dashboard 2.0 (QR-014):** 3D Plotly Bloch sphere visualizer, multi-topology switcher (Karnataka Backbone, Ring, Star, Grid), multi-metric routing, and one-click OpenQASM 3.0 / Qiskit hardware export (`src/quantumroute/app.py`).

---

## 🧩 Approach & Architecture

QuantumRoute is designed as a small, local-first Python application. The initial implementation prioritizes scientific correctness and reproducible experiments before dashboard polish.

### 1. Input

Users will configure:

- A quantum input state.
- Network topology and candidate communication paths.
- Link-quality parameters for the selected network model.
- Noise parameters for controlled experiments.

### 2. Quantum circuit simulation

Qiskit will be used to construct the single-link teleportation circuit. Qiskit Aer and Qiskit's quantum-information tools will support simulation and fidelity calculations.

The initial validation sequence is:

1. Verify ideal teleportation.
2. Introduce depolarizing noise.
3. Measure output-state fidelity.
4. Compare simulated results with the relevant analytical prediction.

### 3. Network modelling

The network model will represent links using Werner-state parameters under explicitly documented assumptions.

For a link with Werner parameter \(w\), its Bell-state fidelity is

\[
F_e=\frac{1+3w}{4}
\]

For a path of independent Werner-state links with idealized entanglement swapping, the planned analytical model uses

\[
w_{\text{path}}=\prod_{e\in\text{path}}w_e
\]

and estimates the end-to-end Bell-state fidelity as

\[
F_{e,\text{path}}=\frac{1+3w_{\text{path}}}{4}
\]

The corresponding average teleportation fidelity for the resulting two-qubit resource state is

\[
F_{\text{tel,avg}}=\frac{2F_{e,\text{path}}+1}{3}
\]

These expressions depend on the model assumptions, including Werner-state links and idealized swapping operations. They are not universal formulas for arbitrary noisy quantum networks.

### 4. Routing

QuantumRoute plans to compare two strategies:

- **Shortest-hop routing:** Select a route with the fewest links.
- **Quality-aware routing:** Minimize an additive path cost based on the Werner parameters:

\[
c_e=-\ln(w_e),\qquad w_e>0
\]

Dijkstra's algorithm can minimize the total cost, which is equivalent to maximizing the product of positive link parameters under this model.

The implementation will validate the routing results against small-network reference cases before claiming correctness.

### 5. Output and visualization

The planned dashboard will display:

- Network topology and selected routes.
- Link-quality and noise settings.
- Teleportation fidelity.
- Analytical predictions versus simulated results.
- Route hop count and model-based quality metrics.

### Architecture overview

```text
User Configuration
        |
        v
Network & Experiment Setup
        |
        +----------------------+
        |                      |
        v                      v
Quantum Teleportation     Network Model
Circuit & Noise           Werner Links
        |                 & Entanglement
        |                 Swapping Model
        v                      |
State Fidelity                v
Calculation              Routing Engine
        |                      |
        +-----------+----------+
                    |
                    v
           Validation & Metrics
                    |
                    v
          Interactive Dashboard
```

**Scientific scope:** The MVP is a simulator and analytical study. It does not claim to model all real-world fibre loss, quantum-memory decoherence, noisy repeater operations, purification protocols, or physical quantum hardware.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python |
| Quantum SDK | Qiskit |
| Quantum simulation | Qiskit Aer |
| Quantum-state analysis | `qiskit.quantum_info` |
| Network modelling | NetworkX |
| Numerical computation | NumPy |
| Interactive dashboard | Streamlit |
| Visualization | Plotly and/or Matplotlib |
| Testing | pytest |
| Environment | Python virtual environment, VS Code |
| Version control | Git and GitHub |

*Dependency versions will be pinned after the supported Python environment and package installation are verified. Additional libraries will be introduced only when required.*

---

## 📁 Project Structure

The following is the planned structure. Files and features may remain pending until their corresponding implementation tasks are completed.

```text
vtu-hc-quantum-d-clan/
├── README.md
├── PLAN.md
├── AGENTS.md
├── ARCHITECTURE.md
├── DECISIONS.md
├── TASKS.md
├── TESTING.md
├── requirements.txt
├── .gitignore
├── LICENSE
├── src/
│   └── quantumroute/
│       ├── __init__.py
│       ├── teleport.py       # Teleportation circuit
│       ├── noise.py          # Noise configuration
│       ├── network.py        # Network and Werner model
│       ├── swapping.py       # Entanglement-swapping logic
│       ├── routing.py        # Route selection algorithms
│       ├── validate.py       # Model and circuit validation
│       └── app.py            # Streamlit dashboard
├── tests/
│   ├── test_teleport.py
│   ├── test_noise.py
│   ├── test_network.py
│   ├── test_routing.py
│   └── test_validate.py
├── notebooks/
│   └── exploration.ipynb
└── docs/
    └── experiments.md
```

Large generated datasets and environment-specific files should not be committed unnecessarily. The structure may be adjusted when implementation demonstrates a concrete need.

---

## 🚀 How to Run

**Status:** All Phase 1 milestones (QR-000 through QR-007) and Phase 2 competitive upgrades (QR-009 through QR-014) are implemented and verified. The automated test suite passes with 100% success rate (91/91 passing tests).

### Prerequisites

- Python 3.12 (supported and verified via `.venv`).
- Git.
- Official repository clone.

### 1. Clone the official repository

```bash
git clone https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-quantum-d-clan.git
cd vtu-hc-quantum-d-clan
```

### 2. Create a virtual environment

**Windows PowerShell (using `uv` or `py`)**

```powershell
# Using uv (fastest):
uv venv .venv --python 3.12
.\.venv\Scripts\Activate.ps1

# Or using standard python:
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS**

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run tests & build validation

Execute the complete automated test suite (verifying QR-000 through QR-014 plus V2 backend API, 3D Bloch sphere, coordinate editor, editable links, and network regression tests):

```bash
pytest -v
```

All 138 tests execute with 100% clean pass rate.

Verify the frontend production build:

```bash
cd frontend
npm run build
```

### 5. Run the application

#### Option A: QuantumRoute V2 Interactive Web Platform (Recommended)

1. **Launch the FastAPI backend server:**
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
2. **Launch the React + Three.js frontend application:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open your browser to `http://localhost:5173` to explore the interactive Network Lab, editable link parameters, and the 3D WebGL Bloch Sphere with real-time Cartesian/spherical coordinate editing.

#### Option B: Standalone Streamlit Dashboard 2.0

Launch locally via Streamlit:

```bash
streamlit run src/quantumroute/app.py
```

Or via the application forwarder:

```bash
streamlit run app/streamlit_app.py
```

---

## 🔁 How to Push Code

Follow the organizers' Git & Collaboration Handbook and any additional instructions provided to the team.

### Configure Git

Run once if Git identity is not already configured:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Use the email associated with your GitHub account or another appropriate Git commit email.

### Everyday workflow

Check your current state before making changes:

```bash
git status
git branch --show-current
git remote -v
```

After the official repository has been cloned and the correct remote verified, create a branch for your task:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/your-task
```

Review and test your changes before committing:

```bash
git diff
python -m pytest -q
git add README.md
git commit -m "docs: update QuantumRoute README"
git push -u origin feature/your-task
```

Open a Pull Request on GitHub and follow the team's review process.

**Important:** Do not push directly to `main` unless the organizers explicitly authorize it. Confirm the required branching and review workflow with the organizers, especially because the official submission deadline is strict.

### Commit message convention

| Prefix | Meaning |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `test:` | Tests added or fixed |
| `refactor:` | Code restructuring |
| `chore:` | Configuration or dependency maintenance |

### Collaboration guidelines

- Pull or otherwise synchronize with the official repository before starting work.
- Work on clearly assigned tasks and use branches when required.
- Commit small, meaningful changes.
- Review diffs before committing.
- Never commit credentials, tokens, or local environment files.
- Never report tests as passing unless they have actually run.
- Keep scientific assumptions and implementation documentation synchronized.
- Follow the organizers' repository and submission rules over generic GitHub workflow advice.

---

## ✅ Submission Checklist

### Project and repository

- [x] README updated with the final project details.
- [x] All team members and GitHub usernames listed.
- [x] Official track and problem statement confirmed.
- [x] Dependencies verified in a clean environment.
- [x] Quantum teleportation circuit implemented and tested.
- [x] Noise experiments implemented and validated.
- [x] Network model and routing algorithms tested.
- [x] Analytical predictions compared with simulated results.
- [x] Final source code committed to the official team repository.
- [x] Latest implementation and tests verified (138/138 passing tests across 19 test suites).
- [X] Demo screenshot or video linked in the README.
### Final submission

Demo video link : https://youtu.be/qE4gO08JjBI
PPT link : https://docs.google.com/presentation/d/17JAiyRgHKtqlCZXcxpjOMX49EzltU_sR/edit?usp=sharing&ouid=110928778499635314096&rtpof=true&sd=true
Deployment Link: https://quantumroute-gazw.onrender.com
**Repository visibility:** The organizers' repository is currently the official team repository. Do not make it public or change its access settings unless the organizers explicitly require and authorize that change. Confirm the final visibility requirement before submission.

*All checklist items remain pending until individually completed and verified.*

---

## 📚 Resources

| Resource | Link |
|---|---|
| Qiskit documentation | https://docs.quantum.ibm.com/ |
| Qiskit Runtime documentation | https://quantum.cloud.ibm.com/docs/ |
| Qiskit Aer simulator guide | https://docs.quantum.ibm.com/guides/simulator |
| IBM Quantum Platform | https://quantum.cloud.ibm.com/ |
| Qiskit learning resources | https://qiskit.qotlabs.org/learning/ |
| GitHub documentation | https://docs.github.com/ |

Use these resources to verify API behaviour, circuit construction, simulation options, and installation requirements. Cite external references in project documentation when they materially support technical claims.

---

## 📄 License

Released under the MIT License. See [LICENSE](LICENSE) for details.

---

**Quantum D Clan** · Team ID `VTU-QFF-HC-0126` · Tier Both  
Built with ⚛️ Qiskit for the VTU-Qiskit Fall Fest 2026 Hackathon.

[⬆ Back to Top](#quantumroute-)
