"""QuantumRoute ⚛️ — Dashboard 2.0 (QR-014).

Noise-Aware Quantum Communication, Entanglement Swapping & Quality-Optimal Routing Simulator.
Features:
    1. Multi-Topology Switcher: 7-Node Benchmark, Karnataka Quantum Backbone, Ring, Star, Grid.
    2. Multi-Metric Routing: Quantum Quality vs. Optical Fiber Signaling Latency.
    3. Dual-Mode Bloch Sphere: 2D Orthogonal Projections (WebGL-Free) & 3D Interactive Sphere.
    4. Finite-Shot Pauli Quantum State Tomography (QR-013).
    5. Physical Telecom Fiber Attenuation & BBPSSW Purification Engine (QR-009 & QR-010).
    6. OpenQASM 3.0 & Qiskit Python Exporter for IBM Quantum hardware submission.
"""

import os
import sys

# Prevent OpenMP / libgomp static TLS allocation segfault on Linux in threaded environments
_preload = os.environ.get("LD_PRELOAD", "")
if "libgomp" not in _preload:
    _src = os.path.dirname(os.path.abspath(__file__))
    _root = os.path.abspath(os.path.join(_src, "..", ".."))
    _aer_libs = os.path.join(_root, ".venv", "lib", "python3.14", "site-packages", "qiskit_aer.libs")
    _target = None
    if os.path.isdir(_aer_libs):
        for _f in os.listdir(_aer_libs):
            if _f.startswith("libgomp") and ".so" in _f:
                _target = os.path.join(_aer_libs, _f)
                break
    if _target:
        os.environ["LD_PRELOAD"] = f"{_target} {_preload}".strip()
        os.execv(sys.executable, [sys.executable] + sys.argv)

# Ensure the 'src' directory is in sys.path when launched directly via `streamlit run src/quantumroute/app.py`
_src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)

import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import networkx as nx
from qiskit import qasm3
from qiskit.quantum_info import DensityMatrix

from quantumroute.network import (
    create_topology,
    create_karnataka_topology,
    create_ring_topology,
    create_star_topology,
    create_grid_topology,
)
from quantumroute.routing import (
    find_shortest_hop_route,
    find_quality_aware_route,
    find_multi_metric_route,
)
from quantumroute.teleport import (
    prepare_input_state,
    build_teleportation_circuit,
    calculate_state_fidelity,
)
from quantumroute.physics import (
    calculate_fiber_attenuation_db,
    calculate_fiber_transmittance,
    fiber_distance_to_werner_parameter,
)
from quantumroute.purification import (
    simulate_multi_round_bbpssw,
)
from quantumroute.tomography import (
    exact_bloch_vector,
    sample_density_matrix_tomography,
)
from quantumroute.validate import (
    compare_model_and_simulation,
    DOCUMENTED_ASSUMPTIONS,
)


# Configure page
st.set_page_config(
    page_title="QuantumRoute ⚛️ Dashboard 2.0",
    page_icon="⚛️",
    layout="wide",
    initial_sidebar_state="expanded",
)


def get_topology_node_positions(graph: nx.Graph, topo_name: str) -> dict:
    """Compute 2D coordinates for rendering graph nodes cleanly."""
    if topo_name == "7-Node Benchmark Topology":
        return {
            "A": (0.0, 1.0),
            "B": (1.0, 2.0),
            "C": (1.0, 0.0),
            "E": (2.0, 2.0),
            "D": (2.0, 0.0),
            "F": (3.0, 2.0),
            "G": (3.0, 0.0),
        }
    if topo_name == "Karnataka Quantum Backbone":
        return {
            "Belagavi": (0.5, 3.5),
            "Hubballi": (1.2, 2.7),
            "Davanagere": (1.8, 1.8),
            "Shivamogga": (1.1, 1.3),
            "Tumakuru": (2.4, 0.9),
            "Bengaluru": (3.0, 0.4),
        }
    # For parametric topologies, use deterministic spring layout
    return nx.spring_layout(graph, seed=42)


def render_network_graph(
    graph: nx.Graph,
    topo_name: str,
    highlighted_paths: dict = None,
    title="Quantum Network Topology",
):
    """Plot network topology using Plotly with customizable highlighted paths."""
    pos = get_topology_node_positions(graph, topo_name)

    # Add default pos for any missing nodes
    for n in graph.nodes:
        if n not in pos:
            pos[n] = (float(np.random.rand() * 3), float(np.random.rand() * 3))

    highlight_edges = {}
    if highlighted_paths:
        for p_name, (p_nodes, p_color) in highlighted_paths.items():
            edges = set()
            if p_nodes and len(p_nodes) > 1:
                for i in range(len(p_nodes) - 1):
                    edges.add((p_nodes[i], p_nodes[i + 1]))
                    edges.add((p_nodes[i + 1], p_nodes[i]))
            highlight_edges[p_name] = (edges, p_color)

    fig = go.Figure()

    # Base edges
    base_x, base_y = [], []
    edge_text_x, edge_text_y, edge_text = [], []

    for u, v, d in graph.edges(data=True):
        x0, y0 = pos[u]
        x1, y1 = pos[v]
        w_val = d.get("w", 1.0)
        dist_km = d.get("distance_km", None)

        base_x.extend([x0, x1, None])
        base_y.extend([y0, y1, None])

        edge_text_x.append((x0 + x1) / 2.0)
        edge_text_y.append((y0 + y1) / 2.0)
        lbl = f"w={w_val:.2f}"
        if dist_km is not None:
            lbl += f" ({dist_km:.0f}km)"
        edge_text.append(lbl)

    fig.add_trace(go.Scatter(
        x=base_x, y=base_y,
        line=dict(width=1.8, color="#334155"),
        hoverinfo="none",
        mode="lines",
        name="Fiber Link",
    ))

    # Highlighted routes
    for p_name, (edges_set, p_color) in highlight_edges.items():
        hx, hy = [], []
        for u, v in edges_set:
            x0, y0 = pos[u]
            x1, y1 = pos[v]
            hx.extend([x0, x1, None])
            hy.extend([y0, y1, None])
        if hx:
            fig.add_trace(go.Scatter(
                x=hx, y=hy,
                line=dict(width=4.5, color=p_color),
                hoverinfo="none",
                mode="lines",
                name=p_name,
            ))

    # Edge labels
    fig.add_trace(go.Scatter(
        x=edge_text_x, y=edge_text_y,
        mode="text",
        text=edge_text,
        textposition="middle center",
        textfont=dict(size=10, color="#94A3B8"),
        hoverinfo="none",
        showlegend=False,
    ))

    # Nodes
    node_x, node_y, node_labels = [], [], []
    for n in graph.nodes:
        x, y = pos[n]
        node_x.append(x)
        node_y.append(y)
        node_labels.append(str(n))

    fig.add_trace(go.Scatter(
        x=node_x, y=node_y,
        mode="markers+text",
        text=node_labels,
        textposition="top center",
        marker=dict(
            size=22,
            color="#0284C7",
            line=dict(width=2.5, color="#38BDF8"),
        ),
        textfont=dict(size=13, color="#F8FAFC", family="Arial Black"),
        hoverinfo="text",
        name="Quantum Repeater Node",
    ))

    fig.update_layout(
        title=dict(text=title, font=dict(size=16, color="#F8FAFC")),
        showlegend=True,
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        margin=dict(l=15, r=15, t=40, b=15),
        plot_bgcolor="#0B132B",
        paper_bgcolor="#0B132B",
        legend=dict(font=dict(color="#CBD5E1")),
    )
    return fig


def render_2d_bloch_plane(
    val_h: float,
    val_v: float,
    ideal_h: float,
    ideal_v: float,
    h_label: str = "X",
    v_label: str = "Z",
    top_lbl: str = "|0⟩",
    bot_lbl: str = "|1⟩",
    right_lbl: str = "|+⟩",
    left_lbl: str = "|-⟩",
    title: str = "X-Z Meridian Plane",
) -> go.Figure:
    """Render a 2D cross-section of the Bloch sphere (100% WebGL-free SVG/Canvas)."""
    theta = np.linspace(0, 2.0 * np.pi, 120)
    fig = go.Figure()

    # Outer unit sphere cross-section
    fig.add_trace(go.Scatter(
        x=np.cos(theta), y=np.sin(theta),
        mode="lines",
        line=dict(color="#38BDF8", width=2),
        name="Bloch Surface (Pure States)",
    ))

    # Inner contracted radius circle
    radius = float(np.sqrt(val_h ** 2 + val_v ** 2))
    if radius < 0.98:
        fig.add_trace(go.Scatter(
            x=radius * np.cos(theta), y=radius * np.sin(theta),
            mode="lines",
            line=dict(color="#F43F5E", width=1.5, dash="dot"),
            name=f"Contraction r={radius:.2f}",
        ))

    # Axes
    fig.add_shape(type="line", x0=-1.15, y0=0, x1=1.15, y1=0, line=dict(color="#475569", width=1))
    fig.add_shape(type="line", x0=0, y0=-1.15, x1=0, y1=1.15, line=dict(color="#475569", width=1))

    # Pole labels
    fig.add_trace(go.Scatter(
        x=[0, 0, 1.15, -1.15],
        y=[1.15, -1.15, 0, 0],
        mode="text",
        text=[top_lbl, bot_lbl, right_lbl, left_lbl],
        textfont=dict(size=11, color="#94A3B8"),
        showlegend=False,
    ))

    # Ideal state vector (Green)
    fig.add_trace(go.Scatter(
        x=[0, ideal_h], y=[0, ideal_v],
        mode="lines+markers",
        line=dict(color="#10B981", width=3.5),
        marker=dict(size=[0, 8], color="#10B981"),
        name="Ideal Pure State",
    ))

    # Measured state vector (Rose / Orange)
    fig.add_trace(go.Scatter(
        x=[0, val_h], y=[0, val_v],
        mode="lines+markers",
        line=dict(color="#F43F5E", width=4),
        marker=dict(size=[0, 9], color="#F43F5E"),
        name="Measured State",
    ))

    fig.update_layout(
        title=dict(text=title, font=dict(size=14, color="#F8FAFC")),
        xaxis=dict(range=[-1.3, 1.3], showgrid=False, zeroline=False, title=h_label),
        yaxis=dict(range=[-1.3, 1.3], showgrid=False, zeroline=False, title=v_label, scaleanchor="x", scaleratio=1),
        plot_bgcolor="#0B132B",
        paper_bgcolor="#0B132B",
        font=dict(color="#CBD5E1"),
        margin=dict(l=10, r=10, t=35, b=10),
    )
    return fig


def render_3d_bloch_sphere(
    rx: float,
    ry: float,
    rz: float,
    ideal_rx: float,
    ideal_ry: float,
    ideal_rz: float,
    title: str = "Interactive 3D Bloch Sphere",
) -> go.Figure:
    """Render an interactive 3D Bloch sphere with input and reconstructed state vectors."""
    u = np.linspace(0, 2.0 * np.pi, 24)
    v = np.linspace(0, np.pi, 14)
    x_s = np.outer(np.cos(u), np.sin(v))
    y_s = np.outer(np.sin(u), np.sin(v))
    z_s = np.outer(np.ones(np.size(u)), np.cos(v))

    fig = go.Figure()

    # Translucent Bloch surface
    fig.add_trace(go.Surface(
        x=x_s, y=y_s, z=z_s,
        opacity=0.10,
        colorscale=[[0, "#38BDF8"], [1, "#818CF8"]],
        showscale=False,
        hoverinfo="none",
        name="Bloch Sphere Surface",
    ))

    # Coordinate axes
    axis_coords = [
        ([-1.1, 1.1], [0, 0], [0, 0], "#64748B"),
        ([0, 0], [-1.1, 1.1], [0, 0], "#64748B"),
        ([0, 0], [0, 0], [-1.1, 1.1], "#64748B"),
    ]
    for ax_x, ax_y, ax_z, ax_color in axis_coords:
        fig.add_trace(go.Scatter3d(
            x=ax_x, y=ax_y, z=ax_z,
            mode="lines",
            line=dict(color=ax_color, width=3),
            hoverinfo="none",
            showlegend=False,
        ))

    # Axis pole labels
    poles_x = [0, 0, 1.15, -1.15, 0, 0]
    poles_y = [0, 0, 0, 0, 1.15, -1.15]
    poles_z = [1.15, -1.15, 0, 0, 0, 0]
    poles_txt = ["|0⟩ (+Z)", "|1⟩ (-Z)", "|+⟩ (+X)", "|-⟩ (-X)", "|+i⟩ (+Y)", "|-i⟩ (-Y)"]
    fig.add_trace(go.Scatter3d(
        x=poles_x, y=poles_y, z=poles_z,
        mode="text",
        text=poles_txt,
        textfont=dict(size=10, color="#94A3B8"),
        showlegend=False,
    ))

    # Ideal pure input state vector (Green)
    fig.add_trace(go.Scatter3d(
        x=[0, ideal_rx], y=[0, ideal_ry], z=[0, ideal_rz],
        mode="lines+markers",
        line=dict(color="#10B981", width=6),
        marker=dict(size=[0, 8], color="#10B981"),
        name="Input Pure State |ψ⟩",
    ))

    # Reconstructed / Noisy state vector (Magenta / Orange)
    fig.add_trace(go.Scatter3d(
        x=[0, rx], y=[0, ry], z=[0, rz],
        mode="lines+markers",
        line=dict(color="#F43F5E", width=7),
        marker=dict(size=[0, 9], color="#F43F5E"),
        name="Measured State ρ",
    ))

    fig.update_layout(
        title=dict(text=title, font=dict(size=16, color="#F8FAFC")),
        scene=dict(
            aspectmode="cube",
            xaxis=dict(showbackground=False, showgrid=False, zeroline=False, title="X"),
            yaxis=dict(showbackground=False, showgrid=False, zeroline=False, title="Y"),
            zaxis=dict(showbackground=False, showgrid=False, zeroline=False, title="Z"),
            camera=dict(eye=dict(x=1.5, y=1.5, z=1.2)),
        ),
        margin=dict(l=10, r=10, t=40, b=10),
        paper_bgcolor="#0B132B",
        legend=dict(font=dict(color="#CBD5E1")),
    )
    return fig


@st.cache_data
def get_cached_validation_table():
    """Cache Qiskit Aer multi-hop swapping simulations to prevent thread segfaults."""
    g_bench = create_topology()
    test_paths = [
        ("1-Hop Direct Link (A ➔ C)", ["A", "C"]),
        ("2-Hop BFS Path (A ➔ C ➔ D)", ["A", "C", "D"]),
        ("3-Hop Quality Path (A ➔ B ➔ E ➔ D)", ["A", "B", "E", "D"]),
        ("4-Hop Scalable Chain (A ➔ B ➔ E ➔ D ➔ G)", ["A", "B", "E", "D", "G"]),
    ]
    rows = []
    for name, p in test_paths:
        try:
            res_val = compare_model_and_simulation(g_bench, p)
            rows.append({
                "Repeater Chain": name,
                "Hops": res_val.hop_count,
                "w (Analytical)": f"{res_val.w_analytical:.4f}",
                "F_Bell (Predicted)": f"{res_val.f_bell_predicted:.5f}",
                "F_Bell (Circuit Sim)": f"{res_val.f_bell_simulated:.5f}",
                "Numerical Error |Δ|": f"{res_val.bell_delta:.2e}",
                "Tolerance": f"{res_val.tolerance:.0e}",
                "Advantage (>2/3)": "✅ Yes" if res_val.beats_classical else "❌ No",
                "Status": f"🟢 {res_val.status}",
            })
        except Exception as err:
            rows.append({
                "Repeater Chain": name,
                "Hops": len(p) - 1,
                "w (Analytical)": "N/A",
                "F_Bell (Predicted)": "N/A",
                "F_Bell (Circuit Sim)": "N/A",
                "Numerical Error |Δ|": str(err),
                "Tolerance": "1e-4",
                "Advantage (>2/3)": "N/A",
                "Status": "⚠️ Error",
            })
    return rows


def main():
    # Banner
    st.markdown(
        """
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0B132B 100%); padding: 22px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #38BDF8;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="color: #38BDF8; margin: 0; font-size: 2.2rem; font-weight: 800;">QuantumRoute ⚛️ Dashboard 2.0</h1>
                    <p style="color: #CBD5E1; font-size: 1.05rem; margin-top: 6px; margin-bottom: 0;">
                        Noise-Aware Quantum Communication, Teleportation & Quality-Optimal Routing Simulator
                    </p>
                </div>
                <div style="text-align: right;">
                    <span style="background: #0284C7; color: #FFFFFF; padding: 4px 12px; border-radius: 9999px; font-size: 0.82rem; font-weight: 700;">VTU-QFF-HC-0126</span>
                    <br/><span style="color: #38BDF8; font-size: 0.85rem; font-weight: 600;">Quantum D Clan</span>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # --- SIDEBAR CONFIGURATION ---
    st.sidebar.title("🎛️ Simulation Engine")

    # 1. Topology Switcher
    topo_option = st.sidebar.selectbox(
        "🌐 Network Topology Preset",
        [
            "Karnataka Quantum Backbone",
            "7-Node Benchmark Topology",
            "Parametric Ring Network",
            "Parametric Star Network",
            "Parametric Grid Network",
        ],
        index=0,
    )

    if topo_option == "Karnataka Quantum Backbone":
        graph = create_karnataka_topology()
    elif topo_option == "7-Node Benchmark Topology":
        graph = create_topology()
    elif topo_option == "Parametric Ring Network":
        ring_n = st.sidebar.slider("Ring Nodes", min_value=4, max_value=12, value=6)
        graph = create_ring_topology(ring_n)
    elif topo_option == "Parametric Star Network":
        star_n = st.sidebar.slider("Star Spokes", min_value=3, max_value=8, value=5)
        graph = create_star_topology(star_n)
    else:
        g_rows = st.sidebar.slider("Grid Rows", min_value=2, max_value=4, value=2)
        g_cols = st.sidebar.slider("Grid Columns", min_value=2, max_value=4, value=3)
        graph = create_grid_topology(g_rows, g_cols)

    nodes = sorted(list(graph.nodes))

    # 2. Input State Angles
    st.sidebar.markdown("---")
    st.sidebar.subheader("📐 Input Quantum State |ψ⟩")
    state_preset = st.sidebar.selectbox("Cardinal Preset", ["Custom", "|0⟩", "|1⟩", "|+⟩", "|-⟩", "|+i⟩", "|-i⟩"])

    if state_preset == "|0⟩":
        theta_val, phi_val = 0.0, 0.0
    elif state_preset == "|1⟩":
        theta_val, phi_val = float(np.pi), 0.0
    elif state_preset == "|+⟩":
        theta_val, phi_val = float(np.pi / 2.0), 0.0
    elif state_preset == "|-⟩":
        theta_val, phi_val = float(np.pi / 2.0), float(np.pi)
    elif state_preset == "|+i⟩":
        theta_val, phi_val = float(np.pi / 2.0), float(np.pi / 2.0)
    elif state_preset == "|-i⟩":
        theta_val, phi_val = float(np.pi / 2.0), float(3.0 * np.pi / 2.0)
    else:
        theta_val = st.sidebar.slider("Polar Angle θ", 0.0, float(np.pi), float(np.pi / 3.0), 0.05)
        phi_val = st.sidebar.slider("Azimuthal Angle φ", 0.0, float(2.0 * np.pi), float(np.pi / 4.0), 0.05)

    # 3. Tomography Engine Setting
    st.sidebar.markdown("---")
    st.sidebar.subheader("🔬 Tomography & Measurement")
    tomo_mode = st.sidebar.radio(
        "Measurement Engine",
        ["Exact Density Matrix", "Finite-Shot Pauli Tomography (QR-013)"],
    )
    shot_count = 4096
    if tomo_mode == "Finite-Shot Pauli Tomography (QR-013)":
        shot_count = st.sidebar.select_slider(
            "Finite Shots per Basis",
            options=[256, 1024, 4096, 8192, 16384],
            value=4096,
        )

    # 4. Multi-Metric Alpha Slider (if distance data present)
    alpha_metric = 0.5
    has_distances = any("distance_km" in d for _, _, d in graph.edges(data=True))
    if has_distances:
        st.sidebar.markdown("---")
        st.sidebar.subheader("⚖️ Multi-Metric Routing")
        alpha_metric = st.sidebar.slider(
            "Trade-off Factor α (0=Fidelity, 1=Latency)",
            min_value=0.0,
            max_value=1.0,
            value=0.35,
            step=0.05,
            help="Balancing quantum Werner quality preservation vs. optical fiber propagation delay (5 µs/km).",
        )

    with st.sidebar.expander("📌 Scientific Governance"):
        for asm in DOCUMENTED_ASSUMPTIONS:
            st.markdown(f"- {asm}")

    # Tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "🌐 Multi-Topology Routing",
        "🔮 3D Bloch Sphere & Tomography (QR-013)",
        "🔬 Swapping & Validation Harness (QR-006)",
        "⚡ Optical Fiber & BBPSSW Distillation",
        "📜 OpenQASM 3.0 Hardware Exporter",
    ])

    # --- TAB 1: MULTI-TOPOLOGY ROUTING ---
    with tab1:
        st.subheader("1. Topology Selection & Multi-Metric Entanglement Routing")
        st.markdown(
            f"Active Topology: **{topo_option}** ({len(graph.nodes)} nodes, {len(graph.edges)} links)."
        )

        col_src, col_dst = st.columns(2)
        with col_src:
            src_node = st.selectbox("Source Node (Alice)", nodes, index=0)
        with col_dst:
            default_dst_idx = len(nodes) - 1 if len(nodes) > 1 else 0
            dst_node = st.selectbox("Destination Node (Bob)", nodes, index=default_dst_idx)

        if src_node == dst_node:
            st.warning("Please choose distinct source and destination nodes.")
        else:
            try:
                route_bfs = find_shortest_hop_route(graph, src_node, dst_node)
                route_qual = find_quality_aware_route(graph, src_node, dst_node)
                route_multi = None
                if has_distances:
                    route_multi = find_multi_metric_route(graph, src_node, dst_node, alpha=alpha_metric)

                col_r1, col_r2, col_r3 = st.columns(3 if has_distances else 2)

                with col_r1:
                    st.markdown("#### ⚡ Shortest-Hop (BFS)")
                    st.info(f"**Path:** {' ➔ '.join(route_bfs.path)} ({route_bfs.num_hops} hops)")
                    st.metric("Path Werner w", f"{route_bfs.werner_parameter:.4f}")
                    st.metric("Bell Fidelity Fe", f"{route_bfs.bell_fidelity:.4f}")
                    st.metric("Avg Teleport Fidelity", f"{route_bfs.average_teleportation_fidelity:.4f}")

                with col_r2:
                    st.markdown("#### 🎯 Quality-Aware (Dijkstra)")
                    st.success(f"**Path:** {' ➔ '.join(route_qual.path)} ({route_qual.num_hops} hops)")
                    st.metric("Path Werner w", f"{route_qual.werner_parameter:.4f}")
                    st.metric("Bell Fidelity Fe", f"{route_qual.bell_fidelity:.4f}")
                    st.metric("Avg Teleport Fidelity", f"{route_qual.average_teleportation_fidelity:.4f}")

                if has_distances and route_multi:
                    with col_r3:
                        st.markdown(f"#### ⚖️ Multi-Metric (α={alpha_metric:.2f})")
                        st.warning(f"**Path:** {' ➔ '.join(route_multi.path)} ({route_multi.num_hops} hops)")
                        st.metric("Path Werner w", f"{route_multi.werner_parameter:.4f}")
                        st.metric("Propagation Latency", f"{route_multi.total_latency_us:.1f} µs")
                        st.metric("Total Distance", f"{route_multi.total_distance_km:.0f} km")

                # Route visualizer
                path_vis_choice = st.radio(
                    "Display route on topology map:",
                    ["Quality-Aware Route", "Shortest-Hop Route", "Multi-Metric Route"] if has_distances else ["Quality-Aware Route", "Shortest-Hop Route"],
                    horizontal=True,
                )

                paths_to_highlight = {}
                if path_vis_choice == "Quality-Aware Route":
                    paths_to_highlight["Quality-Aware (Dijkstra)"] = (route_qual.path, "#10B981")
                elif path_vis_choice == "Shortest-Hop Route":
                    paths_to_highlight["Shortest-Hop (BFS)"] = (route_bfs.path, "#00F0FF")
                elif has_distances and route_multi:
                    paths_to_highlight[f"Multi-Metric (α={alpha_metric})"] = (route_multi.path, "#F59E0B")

                fig_map = render_network_graph(
                    graph,
                    topo_name=topo_option,
                    highlighted_paths=paths_to_highlight,
                    title=f"{topo_option} — {path_vis_choice}",
                )
                st.plotly_chart(fig_map)

            except Exception as e:
                st.error(f"Routing calculation failed: {e}")

    # --- TAB 2: BLOCH SPHERE & TOMOGRAPHY (QR-013 & QR-014) ---
    with tab2:
        st.subheader("2. Interactive Bloch Sphere & Pauli State Tomography")
        st.markdown(
            """
            This module (Tasks **QR-013** & **QR-014**) reconstructs Bob's received quantum state via **Pauli-basis linear Stokes inversion**:
            $$\\rho = \\frac{1}{2}\\left(I + \\langle X \\rangle \\sigma_x + \\langle Y \\rangle \\sigma_y + \\langle Z \\rangle \\sigma_z\\right)$$
            """
        )

        psi_pure = prepare_input_state(theta_val, phi_val)
        ideal_rx = float(np.sin(theta_val) * np.cos(phi_val))
        ideal_ry = float(np.sin(theta_val) * np.sin(phi_val))
        ideal_rz = float(np.cos(theta_val))
        ideal_dm = DensityMatrix(psi_pure)

        noise_lambda = st.slider("Test Depolarizing Channel Noise (λ)", 0.0, 1.0, 0.20, 0.05)

        # Depolarized state
        i2 = np.eye(2, dtype=complex) / 2.0
        noisy_dm = DensityMatrix((1.0 - noise_lambda) * ideal_dm.data + noise_lambda * i2)

        if tomo_mode == "Exact Density Matrix":
            rx_meas, ry_meas, rz_meas = exact_bloch_vector(noisy_dm)
            tomo_fidelity = float(calculate_state_fidelity(noisy_dm, ideal_dm))
            purity = float(np.real(np.trace(noisy_dm.data @ noisy_dm.data)))
            bloch_radius = float(np.sqrt(rx_meas ** 2 + ry_meas ** 2 + rz_meas ** 2))
            std_err = (0.0, 0.0, 0.0)
        else:
            tomo_res = sample_density_matrix_tomography(
                noisy_dm,
                shots=shot_count,
                seed=42,
                target_density_matrix=ideal_dm,
            )
            rx_meas, ry_meas, rz_meas = tomo_res.rx, tomo_res.ry, tomo_res.rz
            tomo_fidelity = tomo_res.fidelity_with_target
            purity = tomo_res.purity
            bloch_radius = tomo_res.bloch_radius
            std_err = (tomo_res.std_err_x, tomo_res.std_err_y, tomo_res.std_err_z)

        # Bloch View Mode Toggle
        bloch_view_mode = st.radio(
            "Visualization Mode:",
            [
                "🎨 2D Cross-Sections (WebGL-Free & Robust)",
                "🌐 3D Interactive Sphere (Requires WebGL)",
            ],
            horizontal=True,
        )

        col_b1, col_b2 = st.columns([1.3, 1.0])

        with col_b1:
            if bloch_view_mode == "🎨 2D Cross-Sections (WebGL-Free & Robust)":
                col_plane1, col_plane2 = st.columns(2)
                with col_plane1:
                    fig_xz = render_2d_bloch_plane(
                        val_h=rx_meas, val_v=rz_meas,
                        ideal_h=ideal_rx, ideal_v=ideal_rz,
                        h_label="X", v_label="Z",
                        top_lbl="|0⟩", bot_lbl="|1⟩", right_lbl="|+⟩", left_lbl="|-⟩",
                        title="X-Z Meridian Plane (|0⟩ / |1⟩)",
                    )
                    st.plotly_chart(fig_xz)

                with col_plane2:
                    fig_xy = render_2d_bloch_plane(
                        val_h=rx_meas, val_v=ry_meas,
                        ideal_h=ideal_rx, ideal_v=ideal_ry,
                        h_label="X", v_label="Y",
                        top_lbl="|+i⟩", bot_lbl="|-i⟩", right_lbl="|+⟩", left_lbl="|-⟩",
                        title="X-Y Equatorial Plane (Phase φ)",
                    )
                    st.plotly_chart(fig_xy)
            else:
                try:
                    fig_bloch3d = render_3d_bloch_sphere(
                        rx=rx_meas,
                        ry=ry_meas,
                        rz=rz_meas,
                        ideal_rx=ideal_rx,
                        ideal_ry=ideal_ry,
                        ideal_rz=ideal_rz,
                        title=f"3D Bloch Sphere — {tomo_mode}",
                    )
                    st.plotly_chart(fig_bloch3d)
                except Exception as ex:
                    st.warning(f"3D WebGL rendering unavailable ({ex}). Please use 2D Cross-Sections view above.")

        with col_b2:
            st.markdown("#### 📊 Tomographic Observables & Purity")
            st.metric("Tomographic State Fidelity F", f"{tomo_fidelity:.4f}")
            st.metric("Bloch Sphere Radius ||r||", f"{bloch_radius:.4f} (Ideal: 1.000)")
            st.metric("State Purity Tr(ρ²)", f"{purity:.4f}")

            df_pauli = pd.DataFrame([
                {"Observable": "⟨X⟩", "Exact Value": f"{ideal_rx * (1.0 - noise_lambda):.4f}", "Sampled Value": f"{rx_meas:.4f}", "Std Error (±1σ)": f"±{std_err[0]:.4f}"},
                {"Observable": "⟨Y⟩", "Exact Value": f"{ideal_ry * (1.0 - noise_lambda):.4f}", "Sampled Value": f"{ry_meas:.4f}", "Std Error (±1σ)": f"±{std_err[1]:.4f}"},
                {"Observable": "⟨Z⟩", "Exact Value": f"{ideal_rz * (1.0 - noise_lambda):.4f}", "Sampled Value": f"{rz_meas:.4f}", "Std Error (±1σ)": f"±{std_err[2]:.4f}"},
            ])
            st.table(df_pauli)

            if noise_lambda > 0:
                st.caption(
                    f"Notice that noise contracts the Bloch vector radius by a factor of (1 - λ) = {1.0 - noise_lambda:.2f}, "
                    "pulling the pure surface vector toward the mixed-state origin."
                )

    # --- TAB 3: SWAPPING & VALIDATION (QR-006 & QR-011) ---
    with tab3:
        st.subheader("3. Circuit Swapping Simulation vs. Analytical Werner Model (QR-006 & QR-011)")
        st.markdown(
            "Rigorous verification comparing analytical $w_{\\text{path}} = \\prod w_e$ against exact $2N$-qubit Qiskit Aer circuit simulations."
        )

        try:
            val_rows = get_cached_validation_table()
            st.table(pd.DataFrame(val_rows))
            st.caption("All simulations executed with ADR-002 coherent feedforward and partial trace extraction on Qiskit Aer.")
        except Exception as e:
            st.error(f"Validation simulation failed: {e}")

    # --- TAB 4: FIBER OPTICS & BBPSSW DISTILLATION (QR-009 & QR-010) ---
    with tab4:
        st.subheader("4. Physical Optical Fiber Attenuation & BBPSSW Distillation")
        st.markdown(
            "Bridge theoretical Werner parameters to **real telecom fiber optics at 1550 nm** and **quantum entanglement distillation**."
        )

        col_f1, col_f2 = st.columns(2)

        with col_f1:
            st.markdown("#### 📡 Physical Fiber Attenuation Channel")
            f_dist = st.slider("Link Fiber Distance (km)", 0.0, 150.0, 45.0, 5.0)
            p_dark = st.slider("Detector Dark Count Probability", 0.0, 0.01, 0.001, 0.0005, format="%.4f")

            att_db = calculate_fiber_attenuation_db(f_dist)
            trans_eta = calculate_fiber_transmittance(f_dist)
            w_physical = fiber_distance_to_werner_parameter(f_dist, p_dark=p_dark)
            f_bell_phys = (1.0 + 3.0 * w_physical) / 4.0

            st.metric("Optical Loss @ 1550 nm (0.2 dB/km)", f"{att_db:.2f} dB")
            st.metric("Photon Transmission Probability η", f"{trans_eta:.4%}")
            st.metric("Effective Werner Parameter w(L)", f"{w_physical:.4f}")
            st.metric("Direct Bell Fidelity Fe", f"{f_bell_phys:.4f}")

        with col_f2:
            st.markdown("#### 🧪 BBPSSW Entanglement Purification Protocol (QR-010)")
            st.markdown(
                "When link fidelity degrades ($F < 0.85$), execute **BBPSSW bilateral CNOT distillation** on auxiliary Bell pairs to rescue fidelity:"
            )

            rounds = st.slider("Purification Cascading Rounds", 0, 3, 1)
            dist_res = simulate_multi_round_bbpssw(f_bell_phys, rounds=rounds, input_is_fidelity=True)

            st.metric("Purified Bell Fidelity F'", f"{dist_res.purified_fidelity:.4f}", delta=f"{dist_res.fidelity_gain:+.4f}")
            st.metric("Cumulative Success Probability", f"{dist_res.success_probability:.2%}")
            st.metric("Raw Bell Pairs Consumed", f"{dist_res.pairs_consumed}")

            if dist_res.fidelity_gain > 0:
                st.success(f"Distillation achieved! Fidelity increased by {dist_res.fidelity_gain:.2%} using {dist_res.pairs_consumed} raw pairs.")
            elif dist_res.initial_fidelity <= 0.5:
                st.error("Input fidelity is below distillation threshold (F ≤ 0.5); purification cannot distill unentangled states.")

    # --- TAB 5: OPENQASM 3.0 EXPORTER (QR-014) ---
    with tab5:
        st.subheader("5. OpenQASM 3.0 & IBM Quantum Hardware Exporter")
        st.markdown(
            "Export executable quantum circuits to submit directly to **IBM Quantum physical QPUs** (`ibm_brisbane`, `ibm_kyoto`) or local Qiskit runtimes."
        )

        qc_export = build_teleportation_circuit(psi_pure)
        qasm_str = qasm3.dumps(qc_export)

        st.code(qasm_str, language="qasm3")

        st.download_button(
            label="💾 Download OpenQASM 3.0 (.qasm)",
            data=qasm_str,
            file_name="quantumroute_teleportation.qasm",
            mime="text/plain",
        )

        python_snippet = f"""# QuantumRoute — Qiskit Python Submission Script
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import numpy as np

# Prepared State: theta={theta_val:.4f}, phi={phi_val:.4f}
qc = QuantumCircuit(3)
qc.ry({theta_val:.4f}, 0)
qc.rz({phi_val:.4f}, 0)

# Entangled Bell Pair between Alice (q1) and Bob (q2)
qc.h(1)
qc.cx(1, 2)

# Bell measurement on Alice's qubits
qc.cx(0, 1)
qc.h(0)

# Coherent feedforward corrections (ADR-002)
qc.cx(1, 2)
qc.cz(0, 2)

# Run simulation
sim = AerSimulator()
print("Circuit depth:", qc.depth())
print("Gate counts:", qc.count_ops())
"""
        st.markdown("#### 🐍 Standalone Qiskit Python Script")
        st.code(python_snippet, language="python")

        st.download_button(
            label="💾 Download Qiskit Script (.py)",
            data=python_snippet,
            file_name="quantumroute_job.py",
            mime="text/x-python",
        )


if __name__ == "__main__":
    main()
