# QuantumRoute — 3-Minute Video Demonstration Script (`docs/DEMO_SCRIPT.md`)

**Event:** VTU-QFF Hackathon — VTU-Qiskit Fall Fest 2026  
**Team:** Quantum D Clan (`VTU-QFF-HC-0126`)  
**Project:** **QuantumRoute ⚛️** — Noise-Aware Quantum Communication & Entanglement Routing  
**Target Duration:** 2 minutes 45 seconds – 3 minutes 00 seconds  

---

## 🎬 Narrative Breakdown & Speaker Timing

```text
[0:00 - 0:45] Yuvaraj B Sutar  : Problem Statement, Teleportation Core & Noise Model
[0:45 - 1:30] Srijan Rastogi   : Werner Network Model & Quality-Aware Routing Engine
[1:30 - 2:35] Veeresh M A      : Live Streamlit Demo, Validation Harness & Classical Boundary
[2:35 - 3:00] All Members      : Scientific Rigor, Limitations & Closing
```

---

### Part 1: Problem Statement & Quantum Teleportation (0:00 – 0:45)
**Speaker:** Yuvaraj B Sutar (`Team Lead / Quantum Core`)  
**Screen Visual:** Title slide showing project name, team ID (`VTU-QFF-HC-0126`), followed by Qiskit teleportation circuit diagram.

> *"Hello everyone! We are Quantum D Clan, presenting **QuantumRoute**, a noise-aware quantum communication simulator built with Qiskit for the VTU-Qiskit Fall Fest 2026.*  
>  
> *In classical networks, routing is typically governed by shortest-hop paths. But in distributed quantum networks, shared entanglement degrades rapidly due to environmental noise. Selecting a route purely by hop count often routes payloads through low-fidelity links, destroying fragile quantum states.*  
>  
> *To investigate this, we built a mathematically exact simulator for single-qubit quantum teleportation using Qiskit Aer. We implemented ADR-002 deferred-measurement coherent corrections and integrated a calibrated depolarizing noise channel. We verified that single-qubit teleportation fidelity under link noise follows the exact Horodecki relation: $F = 1 - p/2$."*

---

### Part 2: Werner Network Model & Routing Engine (0:45 – 1:30)
**Speaker:** Srijan Rastogi (`Network & Routing Lead`)  
**Screen Visual:** Slide/animation showing the 7-node benchmark quantum topology with edge weights $w_e$ and Dijkstra logarithmic mapping.

> *"To extend this to networks, we model each distributed quantum link as an isotropic Werner state: $\rho_W(w) = w|\Phi^+\rangle\langle\Phi^+| + (1-w)\frac{I_4}{4}$, characterized by Werner parameter $w_e \in (0, 1]$.*  
>  
> *Under projective Bell measurements and entanglement swapping, the end-to-end path parameter composes multiplicatively: $w_{\text{path}} = \prod w_e$.*  
>  
> *Crucially, direct multiplication of Bell fidelities is mathematically invalid. Instead, we mapped route quality optimization to Dijkstra's algorithm by assigning additive edge weights: $c_e = -\ln(w_e)$. Since $w_e \le 1$, edge costs are strictly non-negative. On our 7-node benchmark network, we proved that quality-aware routing selects longer, cleaner paths (such as $A \rightarrow B \rightarrow E \rightarrow D$) over shorter, degraded paths ($A \rightarrow C \rightarrow D$), drastically increasing end-to-end fidelity."*

---

### Part 3: Live Interactive Demo & Validation Harness (1:30 – 2:35)
**Speaker:** Veeresh M A (`Validation & Dashboard Lead`)  
**Screen Visual:** Full-screen screen-recording of the running Streamlit dashboard (`streamlit run src/quantumroute/app.py`).

> *"I'm Veeresh, and I led the validation harness and the interactive Streamlit Dashboard 2.0.*  
>  
> *[Show Tab 1: Multi-Topology Routing]*  
> *Here on the dashboard, we select Source Node 'A' and Destination Node 'D'. Notice the live comparison: BFS selects the 2-hop route with an end-to-end Werner parameter of 0.49 and Bell fidelity of 61.7%. Meanwhile, our Quality-Aware Dijkstra engine routes through 3 hops, achieving a Werner parameter of 0.857 and a Bell fidelity of 89.3%—a massive 27.6% boost in state preservation! We can also switch to the Karnataka Quantum Backbone to balance fidelity against optical propagation delay.*  
>  
> *[Show Tab 2: 3D Bloch Sphere & State Tomography]*  
> *In Tab 2, we visualize input and output states on both 2D meridian planes and a 3D Bloch sphere, demonstrating Bloch radius contraction under depolarizing noise and finite-shot Pauli tomography.*  
>  
> *[Show Tab 3: Swapping & Validation Harness]*  
> *Under Tasks QR-006 and QR-011, our validation harness compares analytical formulas directly against full Qiskit Aer density-matrix circuit simulations across 1-hop to 4-hop swapping chains. Every single case passes within strict numerical tolerance $\Delta \le 10^{-4}$.*  
>  
> *[Show Tabs 4 & 5: Fiber Physics, Distillation & Hardware Exporter]*  
> *Tabs 4 and 5 showcase physical optical fiber attenuation at 1550 nm, BBPSSW entanglement distillation rescuing sub-threshold links, and one-click OpenQASM 3.0 export for IBM Quantum physical QPUs."*

---

### Part 4: Conclusion & Testing Rigor (2:35 – 3:00)
**Speaker:** Yuvaraj B Sutar & All  
**Screen Visual:** Terminal showing `pytest -v` output (`91 passed in 6.93s`) and GitHub repository view.

> *"To ensure complete reproducibility, our entire codebase is tested under pytest with 91 automated unit tests passing at 100% in under 7 seconds. We do not claim physical quantum hardware execution—this is a local-first, scientifically defensible simulator designed to model link noise and quality-optimal routing.*  
>  
> *Thank you to VTU, IBM Quantum, and the Qiskit Fall Fest team!"*
