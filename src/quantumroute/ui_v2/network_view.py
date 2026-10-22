"""Interactive Plotly network graph visualization for QuantumRoute UI V2.

Renders deterministic, high-contrast, publication-grade interactive network graphs
with active-route glows, node role indicators, and clear fiber link legends.
"""

from __future__ import annotations

from typing import Sequence, Any
import networkx as nx
import plotly.graph_objects as go

from quantumroute.ui_v2.theme import (
    COLOR_BG_DARK,
    COLOR_PANEL_BG,
    COLOR_BORDER,
    COLOR_ACTIVE_ROUTE,
    COLOR_ACTIVE_GLOW,
    COLOR_INACTIVE_EDGE,
    COLOR_SOURCE,
    COLOR_DESTINATION,
    COLOR_REPEATER,
    COLOR_HUB,
    COLOR_TEXT_PRIMARY,
    COLOR_TEXT_SECONDARY,
    COLOR_TEXT_MUTED,
)


def render_network_graph(
    graph: nx.Graph,
    selected_path: Sequence[Any] | None = None,
    source: Any | None = None,
    target: Any | None = None,
    strategy_label: str = "Quality-Aware (Dijkstra)",
) -> go.Figure:
    """Render an interactive Plotly graph of the quantum network.

    Args:
        graph: NetworkX graph with node positions and link attributes.
        selected_path: Sequence of nodes in the active route.
        source: Source node identifier.
        target: Destination node identifier.
        strategy_label: Human-readable name of the active routing algorithm.

    Returns:
        Plotly Figure configured with dark charcoal theme and glowing active route.
    """
    fig = go.Figure()

    # Determine node positions deterministically
    pos_dict = {}
    for node, data in graph.nodes(data=True):
        if "pos" in data:
            pos_dict[node] = data["pos"]

    # Fallback to deterministic spring layout if positions are missing
    if len(pos_dict) != len(graph.nodes):
        pos_dict = nx.spring_layout(graph, seed=42, k=1.2)

    # Separate edges into active and inactive
    path_edges = set()
    if selected_path and len(selected_path) >= 2:
        for i in range(len(selected_path) - 1):
            u, v = selected_path[i], selected_path[i + 1]
            path_edges.add((u, v))
            path_edges.add((v, u))

    # 1. Background / Inactive Fiber Links
    inactive_x, inactive_y = [], []
    edge_hover_texts = []
    hover_x, hover_y = [], []

    for u, v, data in graph.edges(data=True):
        if (u, v) not in path_edges:
            x0, y0 = pos_dict[u]
            x1, y1 = pos_dict[v]
            inactive_x.extend([x0, x1, None])
            inactive_y.extend([y0, y1, None])

            # Midpoint for hover tooltip
            mid_x, mid_y = (x0 + x1) / 2.0, (y0 + y1) / 2.0
            hover_x.append(mid_x)
            hover_y.append(mid_y)
            w = data.get("w", data.get("werner_parameter", 1.0))
            fe = data.get("bell_fidelity", (1.0 + 3.0 * w) / 4.0)
            dist = data.get("distance_km", 0.0)
            edge_hover_texts.append(
                f"<b>Link:</b> {u} ↔ {v}<br>"
                f"<b>Distance:</b> {dist:.1f} km<br>"
                f"<b>Werner w:</b> {w:.4f}<br>"
                f"<b>Bell Fidelity Fe:</b> {fe:.4f}"
            )

    fig.add_trace(
        go.Scatter(
            x=inactive_x,
            y=inactive_y,
            mode="lines",
            line=dict(color=COLOR_INACTIVE_EDGE, width=1.8),
            hoverinfo="none",
            name="Available Fiber Link",
            showlegend=True,
        )
    )

    # Invisible midpoints for link hover
    if hover_x:
        fig.add_trace(
            go.Scatter(
                x=hover_x,
                y=hover_y,
                mode="markers",
                marker=dict(size=4, color="rgba(0,0,0,0)"),
                text=edge_hover_texts,
                hoverinfo="text",
                showlegend=False,
            )
        )

    # 2. Active Route Glow Layer (Subtle outer halo)
    if selected_path and len(selected_path) >= 2:
        active_x, active_y = [], []
        active_tooltips = []
        act_mid_x, act_mid_y = [], []

        for i in range(len(selected_path) - 1):
            u, v = selected_path[i], selected_path[i + 1]
            x0, y0 = pos_dict[u]
            x1, y1 = pos_dict[v]
            active_x.extend([x0, x1, None])
            active_y.extend([y0, y1, None])

            edata = graph.get_edge_data(u, v, default={})
            w = edata.get("w", edata.get("werner_parameter", 1.0))
            dist = edata.get("distance_km", 0.0)
            delay = edata.get("delay_ms", dist * 0.005)
            act_mid_x.append((x0 + x1) / 2.0)
            act_mid_y.append((y0 + y1) / 2.0)
            active_tooltips.append(
                f"<b>Active Hop:</b> {u} ➔ {v}<br>"
                f"<b>Hop Distance:</b> {dist:.1f} km<br>"
                f"<b>Hop Werner w:</b> {w:.4f}<br>"
                f"<b>Hop Latency:</b> {delay:.2f} ms"
            )

        # Outer soft glow
        fig.add_trace(
            go.Scatter(
                x=active_x,
                y=active_y,
                mode="lines",
                line=dict(color="rgba(199, 210, 254, 0.28)", width=9),
                hoverinfo="none",
                showlegend=False,
            )
        )

        # Core active crisp route
        fig.add_trace(
            go.Scatter(
                x=active_x,
                y=active_y,
                mode="lines",
                line=dict(color=COLOR_ACTIVE_ROUTE, width=3.8),
                hoverinfo="none",
                name=f"Selected Route ({strategy_label})",
                showlegend=True,
            )
        )

        # Active edge midpoint tooltips
        fig.add_trace(
            go.Scatter(
                x=act_mid_x,
                y=act_mid_y,
                mode="markers",
                marker=dict(size=6, color="#ffffff"),
                text=active_tooltips,
                hoverinfo="text",
                showlegend=False,
            )
        )

    # 3. Nodes Layer
    node_x, node_y = [], []
    node_colors = []
    node_line_colors = []
    node_sizes = []
    node_tooltips = []
    node_labels = []

    for node, data in graph.nodes(data=True):
        x, y = pos_dict[node]
        node_x.append(x)
        node_y.append(y)
        node_labels.append(node)

        # Determine node styling by role
        if node == source or data.get("role") == "source" or (source is None and node == "Alice"):
            node_colors.append("#0284c7")
            node_line_colors.append(COLOR_SOURCE)
            node_sizes.append(26)
            role_text = "Source Endpoint (Alice)"
        elif node == target or data.get("role") == "destination" or (target is None and node == "Bob"):
            node_colors.append("#b45309")
            node_line_colors.append(COLOR_DESTINATION)
            node_sizes.append(26)
            role_text = "Destination Endpoint (Bob)"
        elif data.get("type") == "hub" or data.get("is_hub", False):
            node_colors.append("#4338ca")
            node_line_colors.append(COLOR_HUB)
            node_sizes.append(24)
            role_text = "Quantum Router Hub"
        else:
            node_colors.append("#0f172a")
            node_line_colors.append(COLOR_REPEATER)
            node_sizes.append(22)
            role_text = "Quantum Repeater Node"

        in_route = "Yes (Traversed)" if (selected_path and node in selected_path) else "No (Idle)"
        node_tooltips.append(
            f"<b>Node:</b> {node}<br>"
            f"<b>Role:</b> {role_text}<br>"
            f"<b>In Active Route:</b> {in_route}"
        )

    # Draw nodes
    fig.add_trace(
        go.Scatter(
            x=node_x,
            y=node_y,
            mode="markers+text",
            text=node_labels,
            textposition="top center",
            textfont=dict(color=COLOR_TEXT_PRIMARY, size=11, family="sans-serif"),
            marker=dict(
                size=node_sizes,
                color=node_colors,
                line=dict(color=node_line_colors, width=2.5),
            ),
            hoverinfo="text",
            hovertext=node_tooltips,
            name="Quantum Repeater Node",
            showlegend=False,
        )
    )

    # Dummy legend entries for clear visual explanation
    fig.add_trace(
        go.Scatter(
            x=[None],
            y=[None],
            mode="markers",
            marker=dict(size=11, color=COLOR_SOURCE, line=dict(color="#ffffff", width=1)),
            name="Alice (Source)",
            showlegend=True,
        )
    )
    fig.add_trace(
        go.Scatter(
            x=[None],
            y=[None],
            mode="markers",
            marker=dict(size=11, color=COLOR_DESTINATION, line=dict(color="#ffffff", width=1)),
            name="Bob (Destination)",
            showlegend=True,
        )
    )

    # Compute bounding limits for comfortable framing
    all_x = [pos[0] for pos in pos_dict.values()]
    all_y = [pos[1] for pos in pos_dict.values()]
    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    dx = max(max_x - min_x, 100.0)
    dy = max(max_y - min_y, 100.0)

    # Figure Layout Styling
    fig.update_layout(
        plot_bgcolor="#090d16",
        paper_bgcolor="#090d16",
        margin=dict(l=20, r=20, t=25, b=35),
        height=480,
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.12,
            xanchor="center",
            x=0.5,
            font=dict(color=COLOR_TEXT_SECONDARY, size=11),
            bgcolor="rgba(17, 22, 34, 0.8)",
            bordercolor=COLOR_BORDER,
            borderwidth=1,
        ),
        xaxis=dict(
            showgrid=False,
            zeroline=False,
            showticklabels=False,
            range=[min_x - dx * 0.15, max_x + dx * 0.15],
        ),
        yaxis=dict(
            showgrid=False,
            zeroline=False,
            showticklabels=False,
            range=[min_y - dy * 0.20, max_y + dy * 0.25],
        ),
        hoverlabel=dict(
            bgcolor=COLOR_PANEL_BG,
            bordercolor=COLOR_BORDER,
            font=dict(color=COLOR_TEXT_PRIMARY, size=11),
        ),
        annotations=[
            # Scale Indicator
            dict(
                text="0 &nbsp; 25 &nbsp; 50 &nbsp; 75 &nbsp; 100 km<br>├────┼────┼────┤",
                align="left",
                showarrow=False,
                xref="paper",
                yref="paper",
                x=0.03,
                y=0.04,
                font=dict(color=COLOR_TEXT_MUTED, size=9, family="monospace"),
            ),
            # Compass North Indicator
            dict(
                text="▲<br><b>N</b>",
                align="center",
                showarrow=False,
                xref="paper",
                yref="paper",
                x=0.97,
                y=0.95,
                font=dict(color=COLOR_TEXT_MUTED, size=11),
            ),
        ],
    )

    return fig
