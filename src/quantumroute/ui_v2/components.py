"""UI components for QuantumRoute V2 dashboard.

Implements modular components:
- Top header with brand, simulation status, and team badge.
- Navigation rail and tabs.
- Route metrics summary panel.
- Selected route breadcrumb breakdown.
- Tri-algorithm comparison cards (BFS, Dijkstra, Multi-Metric).
"""

from __future__ import annotations

import textwrap
import streamlit as st
from typing import Sequence, Any

from quantumroute.routing import RouteResult


def render_header() -> None:
    """Render top application brand banner and simulation state indicator."""
    header_html = """
    <div class="qr-header-container">
        <div class="qr-brand">
            <div class="qr-logo-icon">⚛</div>
            <div>
                <div class="qr-title">QuantumRoute<span class="qr-title-tm">™</span></div>
                <div class="qr-subtitle">Quantum Network Simulator</div>
            </div>
        </div>
        <div class="qr-header-controls">
            <div class="qr-search-mock">
                <span>🔍 Search topologies, experiments, or nodes...</span>
                <span class="qr-kbd">ctrl k</span>
            </div>
            <div class="qr-status-pill">
                <span class="qr-status-dot"></span>
                <span>Simulation Ready</span>
            </div>
        </div>
    </div>
    <div class="qr-subbar">
        <div>📅 Oct 22, 2026 · Simulation Engine Active</div>
        <div class="qr-team-badge">
            <span class="qr-team-initials">QD</span>
            <span>Quantum D Clan · VTU-QFF-HC-0126</span>
        </div>
    </div>
    """
    st.html(header_html)


def render_nav_tabs(active_tab: str = "Network & Routing") -> str:
    """Render navigation bar tabs matching the reference interface."""
    tabs = [
        ("⚛ Network & Routing", "Network & Routing"),
        ("🧪 Quantum Experiments", "Experiments"),
        ("🔬 State Analysis", "Analysis"),
        ("📡 Channels & Purification", "Channels"),
        ("💻 OpenQASM Export", "QASM"),
        ("📊 Validation & Results", "Results"),
    ]

    tab_items = []
    for label, key in tabs:
        active_class = "qr-nav-tab-active" if key == active_tab else ""
        tab_items.append(f'<span class="qr-nav-tab-item {active_class}">{label}</span>')

    tabs_html = f'<div class="qr-nav-tabs">{"".join(tab_items)}</div>'
    st.html(tabs_html)
    return active_tab


def render_route_metrics_card(route: RouteResult, baseline_w: float = 0.490) -> None:
    """Render Route Metrics card in the right column."""
    w = route.werner_parameter
    fe = route.bell_fidelity
    ftel = route.average_teleportation_fidelity
    hops = route.num_hops
    dist = route.total_distance_km
    delay = route.total_delay_ms

    # Werner improvement relative to baseline if applicable
    delta_w_pct = ((w - baseline_w) / baseline_w * 100.0) if baseline_w > 0 else 0.0
    delta_w_str = f"+{delta_w_pct:.1f}%" if delta_w_pct > 0 else f"{delta_w_pct:.1f}%"

    html = f"""
    <div class="qr-card">
        <div class="qr-card-header">
            <div class="qr-card-title">⚖️ Route Metrics (Selected Algorithm)</div>
        </div>
        <div class="qr-metric-grid">
            <div class="qr-metric-box">
                <div class="qr-metric-label">Path Werner w</div>
                <div class="qr-metric-val">
                    {w:.4f}
                    <span class="qr-metric-badge-up">{delta_w_str} ↑</span>
                </div>
            </div>
            <div class="qr-metric-box">
                <div class="qr-metric-label">Bell Fidelity F<sub>e</sub></div>
                <div class="qr-metric-val">
                    {fe:.4f}
                    <span class="qr-metric-badge-up">↑</span>
                </div>
            </div>
            <div class="qr-metric-box">
                <div class="qr-metric-label">Avg. Teleport Fidelity</div>
                <div class="qr-metric-val">
                    {ftel:.4f}
                    <span class="qr-metric-badge-up">↑</span>
                </div>
            </div>
            <div class="qr-metric-box">
                <div class="qr-metric-label">Hop Count</div>
                <div class="qr-metric-val">{hops} <span style="font-size:0.8rem; font-weight:normal; color:#94a3b8;">hops</span></div>
            </div>
            <div class="qr-metric-box">
                <div class="qr-metric-label">Total Distance</div>
                <div class="qr-metric-val">{dist:.0f} <span style="font-size:0.8rem; font-weight:normal; color:#94a3b8;">km</span></div>
            </div>
            <div class="qr-metric-box">
                <div class="qr-metric-label">Estimated Delay</div>
                <div class="qr-metric-val">{delay:.2f} <span style="font-size:0.8rem; font-weight:normal; color:#94a3b8;">ms</span></div>
            </div>
        </div>
    </div>
    """
    st.html(html)


def render_selected_route_card(route: RouteResult, graph_data: Any = None) -> None:
    """Render Selected Route breakdown card with chain arrows and hop distances."""
    path = route.path
    arrow_chain = " ➔ ".join([f"<span>{node}</span>" for node in path])

    sublinks = []
    if graph_data is not None and len(path) >= 2:
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            edata = graph_data.get_edge_data(u, v, default={})
            dist = edata.get("distance_km", 0.0)
            sublinks.append(f"● {u} — {dist:.0f} km — ● {v}")
    sublinks_str = " &nbsp;|&nbsp; ".join(sublinks) if sublinks else "Direct link composition"

    html = f"""
    <div class="qr-card">
        <div class="qr-card-header">
            <div class="qr-card-title">🗺️ Selected Route</div>
        </div>
        <div class="qr-route-chain">
            {arrow_chain}
        </div>
        <div class="qr-route-sublinks">
            {sublinks_str}
        </div>
    </div>
    """
    st.html(html)


def render_comparison_section(
    bfs_route: RouteResult | None,
    dijkstra_route: RouteResult | None,
    multimetric_route: RouteResult | None,
    active_strategy: str = "quality_aware",
    alpha: float = 0.35,
) -> None:
    """Render the 3-column algorithm comparison section at the bottom."""
    st.html(
        """
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:1.25rem; margin-bottom:0.6rem;">
            <div>
                <span style="font-size:1.0rem; font-weight:700; color:#f8fafc;">⚖️ Routing Algorithm Comparison</span>
                <span style="font-size:0.78rem; color:#94a3b8; margin-left:0.65rem;">Compare routing strategies for the selected source and destination</span>
            </div>
            <div style="font-size:0.74rem; color:#64748b;">
                All values computed using the current quantum network model
            </div>
        </div>
        """
    )

    # Helper to generate SVG sparkline
    def _sparkline(points: Sequence[float], color: str) -> str:
        w, h = 90, 24
        min_v, max_v = min(points), max(points)
        diff = max_v - min_v if max_v != min_v else 1.0
        coords = []
        for i, pt in enumerate(points):
            x = (i / (len(points) - 1)) * (w - 6) + 3
            y = h - ((pt - min_v) / diff) * (h - 8) - 4
            coords.append(f"{x:.1f},{y:.1f}")
        polyline = " ".join(coords)
        return (
            f'<svg width="{w}" height="{h}" style="vertical-align:middle;">'
            f'<polyline fill="none" stroke="{color}" stroke-width="2" points="{polyline}"/>'
            f'</svg>'
        )

    # 1. Shortest-Hop (BFS)
    bfs_active_cls = "qr-algo-card-active" if active_strategy == "shortest_hop" else ""
    if bfs_route is not None:
        bfs_path_str = " ➔ ".join(bfs_route.path)
        bfs_spark = _sparkline([0.5, 0.6, 0.49], "#ef4444")
        bfs_html = textwrap.dedent(f"""
        <div class="qr-algo-card {bfs_active_cls}">
            <div class="qr-algo-header">
                <div class="qr-algo-title" style="color:#f87171;">⚡ Shortest-Hop (BFS)</div>
                <div class="qr-pill-bfs">Minimum Hops</div>
            </div>
            <div class="qr-algo-path">Path: <b>{bfs_path_str}</b></div>
            <div class="qr-algo-stats">
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Hops</span>
                    <span class="qr-algo-stat-val">{bfs_route.num_hops}</span>
                </div>
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Werner w</span>
                    <span class="qr-algo-stat-val">{bfs_route.werner_parameter:.4f}</span>
                </div>
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Bell F<sub>e</sub></span>
                    <span class="qr-algo-stat-val">{bfs_route.bell_fidelity:.4f}</span>
                </div>
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Avg Tel</span>
                    <span class="qr-algo-stat-val">{bfs_route.average_teleportation_fidelity:.4f}</span>
                </div>
            </div>
            <div class="qr-algo-footer">
                <span>Dist: <b>{bfs_route.total_distance_km:.0f} km</b> | Delay: <b>{bfs_route.total_delay_ms:.2f} ms</b></span>
                {bfs_spark}
            </div>
        </div>
        """)
    else:
        bfs_html = '<div class="qr-algo-card">No route available</div>'

    # 2. Quality-Aware (Dijkstra)
    dijkstra_active_cls = "qr-algo-card-active" if active_strategy == "quality_aware" else ""
    if dijkstra_route is not None:
        dijkstra_path_str = " ➔ ".join(dijkstra_route.path)
        dijk_spark = _sparkline([0.7, 0.8, 0.8574], "#38bdf8")
        dijkstra_html = textwrap.dedent(f"""
        <div class="qr-algo-card {dijkstra_active_cls}">
            <div class="qr-algo-header">
                <div class="qr-algo-title" style="color:#38bdf8;">★ Quality-Aware (Dijkstra)</div>
                <div class="qr-pill-dijkstra">Best Fidelity ✓</div>
            </div>
            <div class="qr-algo-path">Path: <b>{dijkstra_path_str}</b></div>
            <div class="qr-algo-stats">
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Hops</span>
                    <span class="qr-algo-stat-val">{dijkstra_route.num_hops}</span>
                </div>
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Werner w</span>
                    <span class="qr-algo-stat-val">{dijkstra_route.werner_parameter:.4f}</span>
                </div>
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Bell F<sub>e</sub></span>
                    <span class="qr-algo-stat-val">{dijkstra_route.bell_fidelity:.4f}</span>
                </div>
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Avg Tel</span>
                    <span class="qr-algo-stat-val">{dijkstra_route.average_teleportation_fidelity:.4f}</span>
                </div>
            </div>
            <div class="qr-algo-footer">
                <span>Dist: <b>{dijkstra_route.total_distance_km:.0f} km</b> | Delay: <b>{dijkstra_route.total_delay_ms:.2f} ms</b></span>
                {dijk_spark}
            </div>
        </div>
        """)
    else:
        dijkstra_html = '<div class="qr-algo-card">No route available</div>'

    # 3. Multi-Metric (α trade-off)
    multi_active_cls = "qr-algo-card-active" if active_strategy == "multi_metric" else ""
    if multimetric_route is not None:
        multi_path_str = " ➔ ".join(multimetric_route.path)
        multi_spark = _sparkline([0.65, 0.78, 0.8216], "#a855f7")
        multimetric_html = textwrap.dedent(f"""
        <div class="qr-algo-card {multi_active_cls}">
            <div class="qr-algo-header">
                <div class="qr-algo-title" style="color:#c084fc;">⚖️ Multi-Metric (α = {alpha:.2f})</div>
                <div class="qr-pill-multimetric">Balanced</div>
            </div>
            <div class="qr-algo-path">Path: <b>{multi_path_str}</b></div>
            <div class="qr-algo-stats">
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Hops</span>
                    <span class="qr-algo-stat-val">{multimetric_route.num_hops}</span>
                </div>
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Werner w</span>
                    <span class="qr-algo-stat-val">{multimetric_route.werner_parameter:.4f}</span>
                </div>
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Bell F<sub>e</sub></span>
                    <span class="qr-algo-stat-val">{multimetric_route.bell_fidelity:.4f}</span>
                </div>
                <div class="qr-algo-stat-item">
                    <span class="qr-algo-stat-label">Avg Tel</span>
                    <span class="qr-algo-stat-val">{multimetric_route.average_teleportation_fidelity:.4f}</span>
                </div>
            </div>
            <div class="qr-algo-footer">
                <span>Dist: <b>{multimetric_route.total_distance_km:.0f} km</b> | Delay: <b>{multimetric_route.total_delay_ms:.2f} ms</b></span>
                {multi_spark}
            </div>
        </div>
        """)
    else:
        multimetric_html = '<div class="qr-algo-card">No route available</div>'

    grid_html = textwrap.dedent(f"""
    <div class="qr-algo-grid">
    {bfs_html}
    {dijkstra_html}
    {multimetric_html}
    </div>
    """)
    st.html(grid_html)
