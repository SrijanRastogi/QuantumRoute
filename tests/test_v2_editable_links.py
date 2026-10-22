"""Automated tests for QuantumRoute V2 Milestone 1.2: Editable Network Links.

Verifies:
- Distance override updates total path distance and propagation delay.
- Werner quality parameter w_e override updates path Werner parameter and fidelities.
- Routing changes dynamically based on link quality edits.
- Backend Qiskit simulation utilizes edited link parameters.
- Validation rejects invalid distances (<= 0) and out-of-range Werner parameters.
"""

import pytest
import math
import numpy as np
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_distance_edit_updates_distance_and_delay():
    """Verify editing distance updates total distance and delay without altering Werner fidelity."""
    # Base route: Alice -> Repeater A -> Repeater D -> Bob
    # Default distances: 120 + 180 + 210 = 510 km; delay = 2.55 ms
    payload = {
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "source": "Alice",
        "target": "Bob",
        "strategy": "quality_aware",
        "link_overrides": [
            {
                "source": "Alice",
                "target": "Repeater A",
                "distance_km": 200.0,  # +80 km
            }
        ]
    }
    resp = client.post("/api/network/route", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    sel = data["selected_route"]
    
    # New distance: 200 + 180 + 210 = 590 km
    assert sel["total_distance_km"] == 590.0
    # Delay: 590 * 0.005 = 2.95 ms
    assert sel["total_delay_ms"] == 2.95
    # Werner fidelity should remain unchanged (0.95^3 = 0.8574)
    assert sel["werner_parameter"] == 0.8574


def test_werner_quality_edit_updates_fidelities():
    """Verify editing link Werner quality updates path Werner parameter and fidelities."""
    payload = {
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "source": "Alice",
        "target": "Bob",
        "strategy": "quality_aware",
        "link_overrides": [
            {
                "source": "Alice",
                "target": "Repeater A",
                "w": 0.90,  # reduced from 0.95
            }
        ]
    }
    resp = client.post("/api/network/route", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    sel = data["selected_route"]
    
    # New path Werner parameter: 0.90 * 0.95 * 0.95 = 0.81225
    expected_w = round(0.90 * 0.95 * 0.95, 4)
    assert abs(sel["werner_parameter"] - expected_w) <= 0.0001
    
    expected_fe = round((1.0 + 3.0 * expected_w) / 4.0, 4)
    assert abs(sel["bell_fidelity"] - expected_fe) <= 0.0001
    
    expected_ftel = round((1.0 + expected_w) / 2.0, 4)
    assert abs(sel["average_teleportation_fidelity"] - expected_ftel) <= 0.0001


def test_link_quality_edit_flips_dijkstra_route():
    """Verify that improving a bottleneck link causes Dijkstra to reroute."""
    # In Generic Mesh, Shortest-Hop (BFS) is Alice -> Repeater B -> Bob (2 hops, w=0.70*0.70=0.4900)
    # Default Quality-Aware is Alice -> Repeater A -> Repeater D -> Bob (3 hops, w=0.8574)
    # If we boost Alice <-> Repeater B and Repeater B <-> Bob to w=0.99,
    # then the 2-hop route achieves w = 0.99 * 0.99 = 0.9801 > 0.8574.
    # Dijkstra must now pick Alice -> Repeater B -> Bob!
    payload = {
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "source": "Alice",
        "target": "Bob",
        "strategy": "quality_aware",
        "link_overrides": [
            {"source": "Alice", "target": "Repeater B", "w": 0.99},
            {"source": "Repeater B", "target": "Bob", "w": 0.99},
        ]
    }
    resp = client.post("/api/network/route", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    sel = data["selected_route"]
    
    # Dijkstra should now take the 2-hop path via Repeater B!
    assert sel["path"] == ["Alice", "Repeater B", "Bob"]
    assert sel["num_hops"] == 2
    assert sel["werner_parameter"] == 0.9801


def test_simulation_with_link_overrides():
    """Verify Qiskit circuit simulation incorporates edited link qualities."""
    payload = {
        "path": ["Alice", "Repeater B", "Bob"],
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "link_overrides": [
            {"source": "Alice", "target": "Repeater B", "w": 0.80},
            {"source": "Repeater B", "target": "Bob", "w": 0.80},
        ]
    }
    resp = client.post("/api/simulate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    
    # Expected qualities: 0.80, 0.80
    assert data["link_qualities"] == [0.80, 0.80]
    expected_w = 0.80 * 0.80  # 0.6400
    assert data["theoretical"]["path_werner_w"] == 0.6400
    expected_fe = (1.0 + 3.0 * 0.64) / 4.0  # 0.7300
    assert data["theoretical"]["bell_fidelity"] == 0.7300
    
    # Real Qiskit Aer simulation matches edited theoretical expectation within 1e-6
    sim = data["circuit_simulation"]
    assert sim["simulated_bell_fidelity"] == 0.7300
    assert sim["fidelity_error_delta"] < 1e-6


def test_invalid_link_override_validation():
    """Verify that negative distances, out-of-range Werner qualities, and non-existent links are rejected."""
    # 1. Negative distance
    p1 = {
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "source": "Alice",
        "target": "Bob",
        "link_overrides": [{"source": "Alice", "target": "Repeater A", "distance_km": -50.0}]
    }
    assert client.post("/api/network/route", json=p1).status_code == 422
    
    # 2. Werner parameter > 1.0
    p2 = {
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "source": "Alice",
        "target": "Bob",
        "link_overrides": [{"source": "Alice", "target": "Repeater A", "w": 1.5}]
    }
    assert client.post("/api/network/route", json=p2).status_code == 422
    
    # 3. Non-existent link
    p3 = {
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "source": "Alice",
        "target": "Bob",
        "link_overrides": [{"source": "Alice", "target": "Bob", "w": 0.95}]
    }
    resp3 = client.post("/api/network/route", json=p3)
    assert resp3.status_code == 400
    assert "Cannot override non-existent link" in resp3.json()["detail"]
