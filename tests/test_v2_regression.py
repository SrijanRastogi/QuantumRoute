"""Backend regression tests for QuantumRoute V2 Milestone 1.1.

Verifies:
- All supported topologies support BFS, Dijkstra, and Multi-Metric routing.
- Simulation-to-route consistency: link Werner parameters are extracted and used.
- Scientific fidelity invariants: F_e = (1+3w)/4, F_tel_avg = (1+w)/2.
- Error handling on invalid/disconnected routes and identical endpoints.
"""

import pytest
import math
import numpy as np
from fastapi.testclient import TestClient
from backend.main import app
from quantumroute.ui_v2.topologies import TOPOLOGY_PRESETS, get_topology

client = TestClient(app)


def test_all_topologies_routing_consistency():
    """Verify that BFS, Dijkstra, and Multi-Metric routing succeed on all supported topologies."""
    for preset_name in TOPOLOGY_PRESETS.keys():
        g = get_topology(preset_name)
        nodes = list(g.nodes())
        assert len(nodes) >= 2, f"Topology {preset_name} has fewer than 2 nodes"
        
        # Select Alice and Bob if present, else first and last nodes
        src = "Alice" if "Alice" in nodes else nodes[0]
        dst = "Bob" if "Bob" in nodes else nodes[-1]
        
        payload = {
            "topology": preset_name,
            "source": src,
            "target": dst,
            "strategy": "quality_aware",
            "alpha": 0.35,
        }
        resp = client.post("/api/network/route", json=payload)
        assert resp.status_code == 200, f"Routing failed for {preset_name}: {resp.text}"
        data = resp.json()
        
        # Check comparison results
        comp = data["comparison"]
        assert "shortest_hop" in comp
        assert "quality_aware" in comp
        assert "multi_metric" in comp
        
        # Check invariants for each resolved route
        for strat_name, route_res in comp.items():
            if route_res is not None:
                w = route_res["werner_parameter"]
                fe = route_res["bell_fidelity"]
                ftel = route_res["average_teleportation_fidelity"]
                
                # Invariant 1: 0 <= w <= 1
                assert 0.0 <= w <= 1.0
                
                # Invariant 2: F_e = (1 + 3w)/4 within roundoff (4 decimals)
                expected_fe = round((1.0 + 3.0 * w) / 4.0, 4)
                assert abs(fe - expected_fe) <= 0.0002, f"Bell fidelity mismatch on {preset_name} {strat_name}"
                
                # Invariant 3: F_tel_avg = (1 + w)/2 = (2F_e + 1)/3
                expected_ftel = round((1.0 + w) / 2.0, 4)
                assert abs(ftel - expected_ftel) <= 0.0002, f"Teleportation fidelity mismatch on {preset_name} {strat_name}"
                
                # Invariant 4: num_hops matches path length - 1
                assert route_res["num_hops"] == len(route_res["path"]) - 1


def test_simulation_receives_selected_route_and_parameters():
    """Verify simulation receives exact path, extracts true link qualities, and executes Qiskit circuit."""
    path = ["Alice", "Repeater A", "Repeater D", "Bob"]
    payload = {
        "path": path,
        "topology": "Generic Mesh (6 nodes · 10 links)",
    }
    resp = client.post("/api/simulate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["path"] == path
    assert data["num_hops"] == 3
    assert len(data["link_qualities"]) == 3
    
    # In Generic Mesh: Alice-A (0.95), A-D (0.95), D-Bob (0.95)
    expected_qualities = [0.95, 0.95, 0.95]
    assert data["link_qualities"] == expected_qualities
    
    expected_w = float(np.prod(expected_qualities))
    assert round(data["theoretical"]["path_werner_w"], 4) == round(expected_w, 4)
    
    # Qiskit circuit simulation output check
    sim = data["circuit_simulation"]
    assert sim["qubits_evolved"] == 6  # 3 hops = 6 qubits
    assert abs(sim["simulated_bell_fidelity"] - data["theoretical"]["bell_fidelity"]) < 1e-6
    assert sim["fidelity_error_delta"] < 1e-6


def test_invalid_simulation_routes_return_clear_errors():
    """Verify disconnected or non-existent edges in simulation request fail cleanly."""
    # Alice to Bob directly has no link in Generic Mesh
    payload = {
        "path": ["Alice", "Bob"],
        "topology": "Generic Mesh (6 nodes · 10 links)",
    }
    resp = client.post("/api/simulate", json=payload)
    assert resp.status_code == 400
    assert "Edge (Alice, Bob) does not exist" in resp.json()["detail"]


def test_route_calculation_error_handling():
    """Verify route calculation handles identical source and target cleanly."""
    payload = {
        "topology": "Generic Mesh (6 nodes · 10 links)",
        "source": "Alice",
        "target": "Alice",
        "strategy": "quality_aware",
    }
    resp = client.post("/api/network/route", json=payload)
    assert resp.status_code == 400
    assert "distinct" in resp.json()["detail"]
