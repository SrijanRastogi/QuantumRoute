"""Streamlit Interactive Dashboard for QuantumRoute (QR-007)."""

import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import networkx as nx

from quantumroute.network import create_topology, calculate_path_metrics
from quantumroute.routing import shortest_hop_path, quality_aware_path
from quantumroute.validate import (
    compare_model_and_simulation,
    validate_noise_model,
    DOCUMENTED_ASSUMPTIONS,
)
from quantumroute.noise import get_analytical_depolarizing_fidelity as theoretical_depolarizing_fidelity


# Configure page
st.set_page_config(
    page_title="QuantumRoute ⚛️",
    page_icon="⚛️",
    layout="wide",
    initial_sidebar_state="expanded",
)


def render_network_graph(graph: nx.Graph, highlighted_path=None, title="Quantum Network Topology"):
    """Plot network topology using Plotly."""
    pos = {
        "A": (0.0, 1.0),
        "B": (1.0, 2.0),
        "C": (1.0, 0.0),
        "E": (2.0, 2.0),
        "D": (2.0, 0.0),
        "F": (3.0, 2.0),
        "G": (3.0, 0.0),
    }

    # Add default pos for any missing nodes
    for n in graph.nodes:
        if n not in pos:
            pos[n] = (np.random.rand() * 4, np.random.rand())

    # Build path edges set
    path_edges = set()
    if highlighted_path and len(highlighted_path) > 1:
        for i in range(len(highlighted_path) - 1):
            u, v = highlighted_path[i], highlighted_path[i + 1]
            path_edges.add((u, v))
            path_edges.add((v, u))

    edge_x, edge_y = [], []
    highlight_x, highlight_y = [], []
    edge_text_x, edge_text_y, edge_text = [], []

    for u, v, d in graph.edges(data=True):
        x0, y0 = pos[u]
        x1, y1 = pos[v]
        w_val = d.get("w", 1.0)
        if (u, v) in path_edges:
            highlight_x.extend([x0, x1, None])
            highlight_y.extend([y0, y1, None])
        else:
            edge_x.extend([x0, x1, None])
            edge_y.extend([y0, y1, None])

        edge_text_x.append((x0 + x1) / 2.0)
        edge_text_y.append((y0 + y1) / 2.0)
        edge_text.append(f"w={w_val:.2f}")

    fig = go.Figure()

    # Standard edges
    fig.add_trace(go.Scatter(
        x=edge_x, y=edge_y,
        line=dict(width=1.5, color="#4A5568"),
        hoverinfo="none",
        mode="lines",
        name="Network Link",
    ))

    # Highlighted active path
    if highlight_x:
        fig.add_trace(go.Scatter(
            x=highlight_x, y=highlight_y,
            line=dict(width=4.0, color="#00F0FF"),
            hoverinfo="none",
            mode="lines",
            name="Selected Path",
        ))

    # Edge labels
    fig.add_trace(go.Scatter(
        x=edge_text_x, y=edge_text_y,
        mode="text",
        text=edge_text,
        textposition="middle center",
        textfont=dict(size=11, color="#CBD5E0"),
        hoverinfo="none",
        showlegend=False,
    ))

    # Nodes
    node_x, node_y, node_colors, node_labels = [], [], [], []
    for n in graph.nodes:
        x, y = pos[n]
        node_x.append(x)
        node_y.append(y)
        node_labels.append(str(n))
        if highlighted_path and n in highlighted_path:
            node_colors.append("#00F0FF")
        else:
            node_colors.append("#A0AEC0")

    fig.add_trace(go.Scatter(
        x=node_x, y=node_y,
        mode="markers+text",
        text=node_labels,
        textposition="top center",
        marker=dict(
            size=22,
            color=node_colors,
            line=dict(width=2, color="#1A202C"),
        ),
        textfont=dict(size=14, color="#FFFFFF", family="Arial Black"),
        hoverinfo="text",
        name="Quantum Repeater / Node",
    ))

    fig.update_layout(
        title=dict(text=title, font=dict(size=16, color="#FFFFFF")),
        showlegend=True,
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        margin=dict(l=20, r=20, t=40, b=20),
        plot_bgcolor="#0F172A",
        paper_bgcolor="#0F172A",
        legend=dict(font=dict(color="#CBD5E0")),
    )
    return fig


def main():
    st.markdown(
        """
        <div style="background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #312E81;">
            <h1 style="color: #38BDF8; margin: 0; font-size: 2.3rem;">QuantumRoute ⚛️</h1>
            <p style="color: #94A3B8; font-size: 1.1rem; margin-top: 8px; margin-bottom: 0;">
                Noise-Aware Quantum Communication, Entanglement Swapping & Quality-Optimal Routing Simulator
            </p>
            <div style="margin-top: 12px; display: flex; gap: 16px;">
                <span style="background: #312E81; color: #E0E7FF; padding: 4px 12px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600;">Team: Quantum D Clan</span>
                <span style="background: #312E81; color: #E0E7FF; padding: 4px 12px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600;">ID: VTU-QFF-HC-0126</span>
                <span style="background: #065F46; color: #D1FAE5; padding: 4px 12px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600;">Tier: Both</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Sidebar
    st.sidebar.title("Configuration & Governance")
    st.sidebar.markdown(
        """
        **Track:** Quantum Communication & Networking  
        **Simulator:** Qiskit Aer (Exact Density Matrix)  
        **Classical Bound:** $F_{\\text{tel,avg}} \\le 2/3 \\approx 0.667$  
        """
    )

    with st.sidebar.expander("📌 Scientific Assumptions", expanded=False):
        for asm in DOCUMENTED_ASSUMPTIONS:
            st.markdown(f"- {asm}")

    st.sidebar.markdown("---")
    st.sidebar.markdown("**Team Roster:**")
    st.sidebar.markdown("- **Yuvaraj B Sutar** (Lead; Quantum Core)")
    st.sidebar.markdown("- **Srijan Rastogi** (Network & Routing Lead)")
    st.sidebar.markdown("- **Veeresh M A** (Validation & Dashboard Lead)")

    # Main Tabs
    tab1, tab2, tab3 = st.tabs([
        "🌐 Routing & Topology Comparison",
        "🔬 Model vs. Circuit Validation (QR-006)",
        "📊 Noise Sweeps & Classical Threshold",
    ])

    net = create_topology()
    nodes = sorted(list(net.nodes))

    # --- TAB 1: ROUTING COMPARISON ---
    with tab1:
        st.subheader("1. End-to-End Entanglement Routing Comparison")
        st.markdown(
            "Compare naive **Shortest-Hop Routing (BFS)** against **Quality-Aware Routing (Dijkstra with $c_e = -\\ln(w_e)$)**."
        )

        col_src, col_dst = st.columns(2)
        with col_src:
            src_node = st.selectbox("Source Node", nodes, index=0)
        with col_dst:
            dst_node = st.selectbox("Destination Node", nodes, index=nodes.index("D") if "D" in nodes else 1)

        if src_node == dst_node:
            st.warning("Please select distinct source and destination nodes.")
            return

        try:
            bfs_path = shortest_hop_path(net, src_node, dst_node)
            dijkstra_path = quality_aware_path(net, src_node, dst_node)

            res_bfs = compare_model_and_simulation(net, bfs_path)
            res_dijkstra = compare_model_and_simulation(net, dijkstra_path)

            col_res1, col_res2 = st.columns(2)

            with col_res1:
                st.markdown("#### ⚡ Shortest-Hop (BFS)")
                st.info(f"**Path:** {' ➔ '.join(bfs_path)} ({res_bfs.hop_count} hops)")
                m1, m2, m3 = st.columns(3)
                m1.metric("Werner $w_{\\text{path}}$", f"{res_bfs.w_analytical:.4f}")
                m2.metric("Bell Fidelity $F_e$", f"{res_bfs.f_bell_simulated:.4f}")
                m3.metric("Teleport $F_{\\text{tel}}$", f"{res_bfs.f_tel_simulated:.4f}")

            with col_res2:
                st.markdown("#### 🎯 Quality-Aware (Dijkstra)")
                st.success(f"**Path:** {' ➔ '.join(dijkstra_path)} ({res_dijkstra.hop_count} hops)")
                m4, m5, m6 = st.columns(3)
                m4.metric("Werner $w_{\\text{path}}$", f"{res_dijkstra.w_analytical:.4f}")
                m5.metric("Bell Fidelity $F_e$", f"{res_dijkstra.f_bell_simulated:.4f}")
                m6.metric("Teleport $F_{\\text{tel}}$", f"{res_dijkstra.f_tel_simulated:.4f}")

            # Routing insight callout
            if res_dijkstra.hop_count > res_bfs.hop_count and res_dijkstra.f_bell_simulated > res_bfs.f_bell_simulated:
                st.success(
                    f"💡 **Key Discovery:** Quality-Aware routing chooses a longer path ({res_dijkstra.hop_count} hops vs {res_bfs.hop_count} hops) "
                    f"to bypass noisy links, boosting end-to-end fidelity from **{res_bfs.f_bell_simulated:.2%}** to **{res_dijkstra.f_bell_simulated:.2%}**!"
                )

            # Visualizer
            path_choice = st.radio("Visualize path on topology:", ["Quality-Aware Route", "Shortest-Hop Route"], horizontal=True)
            active_p = dijkstra_path if path_choice == "Quality-Aware Route" else bfs_path
            fig_net = render_network_graph(net, highlighted_path=active_p, title=f"Topology — Active: {path_choice}")
            st.plotly_chart(fig_net, use_container_width=True)

        except Exception as e:
            st.error(f"Routing calculation error: {e}")

    # --- TAB 2: VALIDATION HARNESS (QR-006) ---
    with tab2:
        st.subheader("2. Predicted vs. Circuit-Simulated Validation Harness")
        st.markdown(
            """
            This module (Task **QR-006**) enforces strict numerical validation comparing analytical Werner-state 
            product formulas against full Qiskit Aer quantum circuit simulations of entanglement swapping chains.
            """
        )

        # Benchmark cases
        benchmarks = [
            ("1-Hop Link (A ➔ C)", ["A", "C"]),
            ("2-Hop BFS Shortest (A ➔ C ➔ D)", ["A", "C", "D"]),
            ("3-Hop Dijkstra Quality (A ➔ B ➔ E ➔ D)", ["A", "B", "E", "D"]),
            ("4-Hop Dijkstra Quality (A ➔ B ➔ E ➔ D ➔ G)", ["A", "B", "E", "D", "G"]),
        ]

        table_rows = []
        for name, p in benchmarks:
            val = compare_model_and_simulation(net, p)
            table_rows.append({
                "Benchmark Case": name,
                "Hops": val.hop_count,
                "w (Analytical)": f"{val.w_analytical:.4f}",
                "F_Bell (Predicted)": f"{val.f_bell_predicted:.5f}",
                "F_Bell (Simulated)": f"{val.f_bell_simulated:.5f}",
                "Delta (|Δ|)": f"{val.bell_delta:.2e}",
                "Tolerance": f"{val.tolerance:.0e}",
                "Quantum Advantage (>2/3)": "✅ Yes" if val.beats_classical else "❌ No",
                "Validation Status": f"🟢 {val.status}",
            })

        df_bench = pd.DataFrame(table_rows)
        st.table(df_bench)

        st.caption(
            "Numerical tolerance: Δ ≤ 1e-4. Simulation executed via Qiskit Aer density-matrix simulator with exact partial trace."
        )

    # --- TAB 3: NOISE SWEEPS & CLASSICAL BOUND ---
    with tab3:
        st.subheader("3. Depolarizing Noise Sweep & Classical Boundary")
        st.markdown(
            """
            Investigate the effect of depolarizing noise parameter $\\lambda \\in [0, 1]$ on single-qubit teleportation.
            - **Theoretical Fidelity:** $F = 1 - \\lambda / 2$
            - **Classical Threshold:** $F = 2/3 \\approx 0.667$. Below this line, entanglement is separable and classical teleportation suffices.
            """
        )

        user_lambda = st.slider("Select Link Depolarizing Noise (λ)", min_value=0.0, max_value=1.0, value=0.20, step=0.05)
        f_user_theory = theoretical_depolarizing_fidelity(user_lambda)
        st.metric(
            f"Fidelity at λ={user_lambda:.2f}",
            f"{f_user_theory:.4f}",
            delta=f"{'Quantum Advantage' if f_user_theory > (2.0 / 3.0) else 'Classical Limit'}",
        )

        sweep_data = validate_noise_model()
        df_sweep = pd.DataFrame(sweep_data)

        fig_sweep = go.Figure()

        # Theoretical line
        fig_sweep.add_trace(go.Scatter(
            x=df_sweep["lambda"],
            y=df_sweep["f_theory"],
            mode="lines",
            name="Analytical Theory (F = 1 - λ/2)",
            line=dict(color="#38BDF8", width=3),
        ))

        # Simulated scatter
        fig_sweep.add_trace(go.Scatter(
            x=df_sweep["lambda"],
            y=df_sweep["f_sim"],
            mode="markers",
            name="Qiskit Aer Circuit Simulation",
            marker=dict(size=8, color="#F43F5E", symbol="circle-open"),
        ))

        # Classical limit horizontal line
        fig_sweep.add_hline(
            y=2.0 / 3.0,
            line_dash="dash",
            line_color="#EAB308",
            annotation_text="Classical Bound (2/3 ≈ 0.667)",
            annotation_position="bottom right",
            annotation_font=dict(color="#EAB308", size=12),
        )

        # Selected user point
        fig_sweep.add_trace(go.Scatter(
            x=[user_lambda],
            y=[f_user_theory],
            mode="markers",
            name=f"Current λ={user_lambda:.2f}",
            marker=dict(size=14, color="#10B981", symbol="diamond"),
        ))

        fig_sweep.update_layout(
            title="Teleportation Fidelity vs. Depolarizing Noise Strength (λ)",
            xaxis_title="Depolarizing Parameter λ",
            yaxis_title="State Fidelity F",
            yaxis=dict(range=[0.45, 1.05]),
            plot_bgcolor="#0F172A",
            paper_bgcolor="#0F172A",
            font=dict(color="#CBD5E0"),
            legend=dict(font=dict(color="#CBD5E0")),
            margin=dict(l=40, r=40, t=50, b=40),
        )

        st.plotly_chart(fig_sweep, use_container_width=True)


if __name__ == "__main__":
    main()
