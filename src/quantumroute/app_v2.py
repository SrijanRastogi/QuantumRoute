"""QuantumRoute UI V2 — Modern Quantum Network Simulator.

Clean, high-performance Streamlit entry point built on an isolated branch.
Preserves the existing scientific engine and modules directly.
"""

from __future__ import annotations

import sys
import os

# Ensure src directory is in sys.path
_src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)

import streamlit as st
import numpy as np
import networkx as nx

from quantumroute.routing import (
    find_shortest_hop_route,
    find_quality_aware_route,
    find_multi_metric_route,
    RouteResult,
)
from quantumroute.teleport import prepare_input_state
from quantumroute.ui_v2.theme import apply_theme
from quantumroute.ui_v2.topologies import (
    TOPOLOGY_PRESETS,
    DEFAULT_TOPOLOGY_KEY,
    get_topology,
)
from quantumroute.ui_v2.network_view import render_network_graph
from quantumroute.ui_v2.components import (
    render_header,
    render_nav_tabs,
    render_route_metrics_card,
    render_selected_route_card,
    render_comparison_section,
)


def init_page_config() -> None:
    """Initialize page metadata, layout, and visual theme."""
    st.set_page_config(
        page_title="QuantumRoute™ | Quantum Network Simulator",
        page_icon="⚛",
        layout="wide",
        initial_sidebar_state="expanded",
    )
    apply_theme()


def render_sidebar(nodes_list: list[str]) -> dict:
    """Render slim left navigation rail with presets and quantum state input."""
    with st.sidebar:
        st.markdown(
            """
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1.0rem;">
                <span style="font-size:1.1rem;">🧭</span>
                <span style="font-weight:700; color:#f8fafc; font-size:1.0rem;">Navigation Rail</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        perspective = st.radio(
            "Platform Perspective",
            options=["Explore Mode (Guided)", "Research Mode (Deep Controls)"],
            index=0,
            help="Toggle between guided visual exploration and advanced research controls",
        )

        st.markdown("---")
        st.markdown(
            """
            <div style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.4rem;">
                <span style="color:#38bdf8;">🌐</span>
                <span style="font-weight:600; color:#f8fafc; font-size:0.88rem;">Network Presets</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        preset_keys = list(TOPOLOGY_PRESETS.keys())
        selected_preset = st.selectbox(
            "Topology Preset",
            options=preset_keys,
            index=preset_keys.index(DEFAULT_TOPOLOGY_KEY),
            label_visibility="collapsed",
        )

        st.markdown("---")
        st.markdown(
            """
            <div style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.4rem;">
                <span style="color:#a855f7;">📐</span>
                <span style="font-weight:600; color:#f8fafc; font-size:0.88rem;">Input Quantum State |ψ⟩</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        cardinal_choice = st.selectbox(
            "Cardinal Preset",
            options=["Custom", "|0⟩ (North Pole)", "|1⟩ (South Pole)", "|+⟩ (+X Axis)", "|-⟩ (-X Axis)", "|+i⟩ (+Y Axis)", "|-i⟩ (-Y Axis)"],
            index=0,
        )

        # Preset angles
        preset_angles = {
            "|0⟩ (North Pole)": (0.0, 0.0),
            "|1⟩ (South Pole)": (np.pi, 0.0),
            "|+⟩ (+X Axis)": (np.pi / 2.0, 0.0),
            "|-⟩ (-X Axis)": (np.pi / 2.0, np.pi),
            "|+i⟩ (+Y Axis)": (np.pi / 2.0, np.pi / 2.0),
            "|-i⟩ (-Y Axis)": (np.pi / 2.0, 3.0 * np.pi / 2.0),
        }

        if cardinal_choice != "Custom":
            theta_val, phi_val = preset_angles[cardinal_choice]
            theta = st.slider("Polar Angle θ (rad)", 0.0, float(np.pi), float(theta_val), 0.05, disabled=True)
            phi = st.slider("Azimuthal Angle φ (rad)", 0.0, float(2.0 * np.pi), float(phi_val), 0.05, disabled=True)
        else:
            theta = st.slider("Polar Angle θ (rad)", 0.0, float(np.pi), 1.05, 0.05)
            phi = st.slider("Azimuthal Angle φ (rad)", 0.0, float(2.0 * np.pi), 0.79, 0.05)

        with st.expander("📌 Scientific Governance & Invariants", expanded=False):
            st.html(
                """
                <div style="font-size:0.75rem; color:#94a3b8; line-height:1.4;">
                <b>1. Werner Product Rule:</b><br>
                w<sub>path</sub> = ∏ w<sub>e</sub> (Never multiply fidelities directly).<br><br>
                <b>2. Dijkstra Formulation:</b><br>
                Additive edge cost c<sub>e</sub> = -ln(w<sub>e</sub>). Zero-entanglement links (w=0) excluded.<br><br>
                <b>3. Coherent Corrections:</b><br>
                Deferred measurement receiver extraction avoids state collapse.
                </div>
                """
            )

        return {
            "perspective": perspective,
            "preset": selected_preset,
            "theta": theta,
            "phi": phi,
        }


def main() -> None:
    """Main application loop."""
    init_page_config()
    render_header()
    active_tab = render_nav_tabs("Network & Routing")

    # Load initial graph for sidebar choices
    graph = get_topology(DEFAULT_TOPOLOGY_KEY)
    all_nodes = list(graph.nodes)

    sidebar_settings = render_sidebar(all_nodes)
    current_preset = sidebar_settings["preset"]

    # Refresh topology if preset changed in sidebar
    if current_preset != DEFAULT_TOPOLOGY_KEY:
        graph = get_topology(current_preset)
        all_nodes = list(graph.nodes)

    # 3-Column Desktop Grid for Network Screen
    col_config, col_graph, col_metrics = st.columns([1.0, 1.85, 1.15], gap="medium")

    # --- LEFT COLUMN: Compact Configuration ---
    with col_config:
        st.html(
            """
            <div style="background:#111622; border:1px solid #1e2638; border-radius:10px; padding:0.75rem 1.0rem; margin-bottom:0.75rem;">
                <div style="font-size:0.95rem; font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.45rem;">
                    ⚙️ Network Configuration
                </div>
            </div>
            """
        )

        st.caption(f"Active Topology: **{current_preset}**")

        # Pick default source & destination
        src_default_idx = all_nodes.index("Alice") if "Alice" in all_nodes else 0
        target_default_idx = all_nodes.index("Bob") if "Bob" in all_nodes else (len(all_nodes) - 1)

        source_node = st.selectbox(
            "🔵 Source Node (Alice)",
            options=all_nodes,
            index=src_default_idx,
            key="v2_src_node",
        )

        remaining_targets = [n for n in all_nodes if n != source_node]
        tgt_idx = 0
        if "Bob" in remaining_targets:
            tgt_idx = remaining_targets.index("Bob")
        elif target_default_idx < len(remaining_targets):
            tgt_idx = target_default_idx

        target_node = st.selectbox(
            "🟠 Destination Node (Bob)",
            options=remaining_targets,
            index=tgt_idx,
            key="v2_tgt_node",
        )

        routing_strategy = st.radio(
            "Routing Algorithm",
            options=["Quality-Aware (Dijkstra)", "Shortest-Hop (BFS)", "Multi-Metric (α trade-off)"],
            index=0,
            key="v2_routing_strat",
        )

        strategy_key_map = {
            "Quality-Aware (Dijkstra)": "quality_aware",
            "Shortest-Hop (BFS)": "shortest_hop",
            "Multi-Metric (α trade-off)": "multi_metric",
        }
        active_strat_key = strategy_key_map[routing_strategy]

        alpha_val = 0.35
        with st.expander("⚙️ Advanced Parameters", expanded=False):
            alpha_val = st.slider(
                "Multi-Metric Weight (α)",
                min_value=0.0,
                max_value=1.0,
                value=0.35,
                step=0.05,
                help="0.0 = Pure Fidelity (Dijkstra), 1.0 = Pure Distance/Delay, 0.35 = Balanced Pareto",
            )
            st.caption("Standard Telecom Latency: 5.0 µs/km")

        st.button("▶ Update Route", type="primary", use_container_width=True)

    # Calculate routes using scientific engine
    bfs_res: RouteResult | None = None
    dijkstra_res: RouteResult | None = None
    multimetric_res: RouteResult | None = None

    try:
        bfs_res = find_shortest_hop_route(graph, source_node, target_node)
    except (nx.NetworkXNoPath, KeyError, ValueError):
        bfs_res = None

    try:
        dijkstra_res = find_quality_aware_route(graph, source_node, target_node)
    except (nx.NetworkXNoPath, KeyError, ValueError):
        dijkstra_res = None

    try:
        multimetric_res = find_multi_metric_route(graph, source_node, target_node, alpha=alpha_val)
    except (nx.NetworkXNoPath, KeyError, ValueError):
        multimetric_res = None

    # Determine currently selected route for graph display
    selected_res = dijkstra_res
    if active_strat_key == "shortest_hop":
        selected_res = bfs_res
    elif active_strat_key == "multi_metric":
        selected_res = multimetric_res

    selected_path = selected_res.path if selected_res else []

    # --- CENTER COLUMN: Large Interactive Graph ---
    with col_graph:
        st.html(
            """
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem; background:#111622; border:1px solid #1e2638; border-radius:10px 10px 0 0; padding:0.6rem 1.0rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span style="font-size:1.1rem; color:#818cf8;">⚛</span>
                    <div>
                        <div style="font-weight:700; color:#f8fafc; font-size:0.95rem;">Network & Routing Canvas</div>
                        <div style="font-size:0.75rem; color:#94a3b8;">Interactive quantum network simulation and routing analysis</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:0.75rem; font-size:0.75rem;">
                    <span style="color:#34d399; font-weight:600;">● Active</span>
                    <span style="color:#94a3b8;">Experiment: <b>NET-001</b></span>
                </div>
            </div>
            """
        )

        fig = render_network_graph(
            graph=graph,
            selected_path=selected_path,
            source=source_node,
            target=target_node,
            strategy_label=routing_strategy,
        )
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    # --- RIGHT COLUMN: Route Metrics & Selected Route ---
    with col_metrics:
        if selected_res is not None:
            baseline_w = bfs_res.werner_parameter if bfs_res is not None else 0.490
            render_route_metrics_card(selected_res, baseline_w=baseline_w)
            render_selected_route_card(selected_res, graph_data=graph)
        else:
            st.error(f"No usable quantum path exists between {source_node} and {target_node}.")

    # --- BOTTOM ROW: 3-Algorithm Comparison ---
    render_comparison_section(
        bfs_route=bfs_res,
        dijkstra_route=dijkstra_res,
        multimetric_route=multimetric_res,
        active_strategy=active_strat_key,
        alpha=alpha_val,
    )


if __name__ == "__main__":
    main()
