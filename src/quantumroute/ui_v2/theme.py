"""Theme tokens, custom CSS styles, and visual identity for QuantumRoute UI V2.

Adheres strictly to the visual reference:
- Near-black charcoal canvas (#070a10).
- Graphite panels (#111622) with crisp subtle borders (#1e2638).
- Sharp white typography with slate secondary labels.
- Glowing lavender/white active routes.
- Electric blue source & repeater accents.
- Amber destination indicator.
- Muted red Shortest-Hop & Purple Multi-Metric comparison aesthetics.
"""

from __future__ import annotations

import streamlit as st

# Color Palette Constants
COLOR_BG_DARK = "#070a10"
COLOR_PANEL_BG = "#111622"
COLOR_PANEL_ALT = "#151c2a"
COLOR_BORDER = "#1e2638"
COLOR_BORDER_LIGHT = "#2a3449"

COLOR_TEXT_PRIMARY = "#f8fafc"
COLOR_TEXT_SECONDARY = "#94a3b8"
COLOR_TEXT_MUTED = "#64748b"

COLOR_ACTIVE_ROUTE = "#f1f5f9"
COLOR_ACTIVE_GLOW = "#c7d2fe"
COLOR_INACTIVE_EDGE = "#2d3748"

COLOR_SOURCE = "#38bdf8"        # Electric Blue
COLOR_DESTINATION = "#f59e0b"   # Amber
COLOR_REPEATER = "#60a5fa"      # Soft Blue
COLOR_HUB = "#818cf8"           # Indigo Hub

COLOR_BFS_RED = "#ef4444"       # Muted Red for Shortest-Hop
COLOR_DIJKSTRA_BLUE = "#38bdf8" # Cyan/Blue for Quality-Aware
COLOR_MULTIMETRIC_PURPLE = "#a855f7" # Purple for Multi-Metric


V2_CUSTOM_CSS = f"""
<style>
/* Root Streamlit App Container */
.stApp {{
    background-color: {COLOR_BG_DARK};
    color: {COLOR_TEXT_PRIMARY};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}}

/* Main Block Padding */
.main .block-container {{
    max-width: 1520px;
    padding-top: 1.0rem;
    padding-bottom: 2.5rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
}}

/* Header Banner & Brand bar */
.qr-header-container {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    background: {COLOR_PANEL_BG};
    border: 1px solid {COLOR_BORDER};
    border-radius: 10px;
    margin-bottom: 0.85rem;
}}

.qr-brand {{
    display: flex;
    align-items: center;
    gap: 0.85rem;
}}

.qr-logo-icon {{
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    border-radius: 8px;
    color: #ffffff;
    font-size: 1.35rem;
    box-shadow: 0 0 12px rgba(168, 85, 247, 0.4);
}}

.qr-title {{
    font-size: 1.25rem;
    font-weight: 700;
    color: {COLOR_TEXT_PRIMARY};
    letter-spacing: -0.02em;
    line-height: 1.2;
}}

.qr-title-tm {{
    font-size: 0.7rem;
    vertical-align: super;
    color: #a855f7;
}}

.qr-subtitle {{
    font-size: 0.78rem;
    color: {COLOR_TEXT_SECONDARY};
    font-weight: 400;
}}

.qr-header-controls {{
    display: flex;
    align-items: center;
    gap: 0.75rem;
}}

.qr-search-mock {{
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #0b0f19;
    border: 1px solid {COLOR_BORDER};
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    color: {COLOR_TEXT_MUTED};
    font-size: 0.8rem;
}}

.qr-kbd {{
    background: #1e2638;
    color: {COLOR_TEXT_SECONDARY};
    border-radius: 4px;
    padding: 0.1rem 0.35rem;
    font-size: 0.7rem;
}}

.qr-status-pill {{
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
    border-radius: 20px;
    padding: 0.3rem 0.8rem;
    font-size: 0.78rem;
    font-weight: 600;
}}

.qr-status-dot {{
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
}}

/* Team info bar below header */
.qr-subbar {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.25rem 0.5rem 0.75rem 0.5rem;
    color: {COLOR_TEXT_MUTED};
    font-size: 0.78rem;
}}

.qr-team-badge {{
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: {COLOR_PANEL_BG};
    border: 1px solid {COLOR_BORDER};
    border-radius: 6px;
    padding: 0.2rem 0.6rem;
    color: {COLOR_TEXT_SECONDARY};
}}

.qr-team-initials {{
    background: #2563eb;
    color: #ffffff;
    font-weight: bold;
    border-radius: 4px;
    padding: 0.1rem 0.35rem;
    font-size: 0.7rem;
}}

/* Top Navigation Tabs Bar */
.qr-nav-tabs {{
    display: flex;
    gap: 0.4rem;
    background: transparent;
    border-bottom: 1px solid {COLOR_BORDER};
    margin-bottom: 1rem;
    padding-bottom: 0.2rem;
}}

.qr-nav-tab-item {{
    padding: 0.55rem 1.0rem;
    font-size: 0.84rem;
    font-weight: 500;
    color: {COLOR_TEXT_SECONDARY};
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease-in-out;
}}

.qr-nav-tab-active {{
    color: #ffffff;
    font-weight: 600;
    border-bottom: 2px solid #818cf8;
    background: rgba(129, 140, 248, 0.08);
    border-radius: 6px 6px 0 0;
}}

/* Graphite Panels & Cards */
.qr-card {{
    background: {COLOR_PANEL_BG};
    border: 1px solid {COLOR_BORDER};
    border-radius: 10px;
    padding: 1.15rem;
    margin-bottom: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}}

.qr-card-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.85rem;
    padding-bottom: 0.45rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}}

.qr-card-title {{
    font-size: 0.95rem;
    font-weight: 600;
    color: {COLOR_TEXT_PRIMARY};
    display: flex;
    align-items: center;
    gap: 0.45rem;
}}

/* Route Metrics Grid */
.qr-metric-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
}}

.qr-metric-box {{
    background: #0c101a;
    border: 1px solid {COLOR_BORDER};
    border-radius: 8px;
    padding: 0.75rem 0.85rem;
}}

.qr-metric-label {{
    font-size: 0.72rem;
    color: {COLOR_TEXT_SECONDARY};
    font-weight: 500;
    margin-bottom: 0.25rem;
}}

.qr-metric-val {{
    font-size: 1.35rem;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
}}

.qr-metric-badge-up {{
    font-size: 0.72rem;
    font-weight: 600;
    color: #34d399;
}}

/* Selected Route Breadcrumb Card */
.qr-route-chain {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    background: #0c101a;
    border: 1px solid {COLOR_BORDER};
    border-radius: 8px;
    padding: 0.75rem 1.0rem;
    font-size: 0.88rem;
    font-weight: 600;
    color: #ffffff;
}}

.qr-route-arrow {{
    color: {COLOR_TEXT_MUTED};
    font-size: 0.85rem;
}}

.qr-route-sublinks {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.6rem;
    font-size: 0.75rem;
    color: {COLOR_TEXT_SECONDARY};
}}

/* Algorithm Comparison Section */
.qr-algo-grid {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.0rem;
    margin-top: 0.5rem;
}}

.qr-algo-card {{
    background: {COLOR_PANEL_BG};
    border: 1px solid {COLOR_BORDER};
    border-radius: 10px;
    padding: 1.0rem;
    transition: transform 0.15s ease, border-color 0.15s ease;
}}

.qr-algo-card:hover {{
    border-color: {COLOR_BORDER_LIGHT};
}}

.qr-algo-card-active {{
    border: 1px solid rgba(129, 140, 248, 0.45);
    background: linear-gradient(180deg, #131929 0%, #111622 100%);
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.12);
}}

.qr-algo-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
}}

.qr-algo-title {{
    font-size: 0.88rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}}

.qr-pill-bfs {{
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #f87171;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
}}

.qr-pill-dijkstra {{
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
}}

.qr-pill-multimetric {{
    background: rgba(168, 85, 247, 0.15);
    border: 1px solid rgba(168, 85, 247, 0.4);
    color: #c084fc;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
}}

.qr-algo-path {{
    font-size: 0.78rem;
    color: {COLOR_TEXT_PRIMARY};
    margin-bottom: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}}

.qr-algo-stats {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
    background: #0a0e18;
    border: 1px solid {COLOR_BORDER};
    border-radius: 6px;
    padding: 0.55rem 0.45rem;
    text-align: center;
    margin-bottom: 0.65rem;
}}

.qr-algo-stat-item {{
    display: flex;
    flex-direction: column;
}}

.qr-algo-stat-label {{
    font-size: 0.65rem;
    color: {COLOR_TEXT_MUTED};
    font-weight: 500;
}}

.qr-algo-stat-val {{
    font-size: 0.85rem;
    font-weight: 700;
    color: #ffffff;
}}

.qr-algo-footer {{
    font-size: 0.72rem;
    color: {COLOR_TEXT_MUTED};
    display: flex;
    align-items: center;
    justify-content: space-between;
}}

/* Streamlit Widget Restyling */
div[data-baseweb="select"] > div {{
    background-color: #0b0f19 !important;
    border: 1px solid {COLOR_BORDER} !important;
    border-radius: 6px !important;
    color: #ffffff !important;
}}

div[data-testid="stSidebar"] {{
    background-color: #090c14 !important;
    border-right: 1px solid {COLOR_BORDER} !important;
}}

.stButton > button {{
    background: #1e2638 !important;
    color: #f8fafc !important;
    border: 1px solid #2a3449 !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    transition: all 0.15s ease !important;
}}

.stButton > button:hover {{
    background: #28334b !important;
    border-color: #3b4b6d !important;
    color: #ffffff !important;
}}

/* Primary Action Button */
.stButton > button[kind="primary"] {{
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
    border: none !important;
    box-shadow: 0 0 12px rgba(124, 58, 237, 0.35) !important;
}}

/* Hide unnecessary default Streamlit elements */
#MainMenu {{visibility: hidden;}}
footer {{visibility: hidden;}}
header {{visibility: hidden;}}
</style>
"""


def apply_theme() -> None:
    """Inject QuantumRoute UI V2 styles into the active Streamlit app."""
    st.html(V2_CUSTOM_CSS)
