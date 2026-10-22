"""Automated tests for QuantumRoute V2 FastAPI Backend.

Verifies API endpoints, routing calculations, and real Qiskit circuit simulation integration.
"""

from fastapi.testclient import TestClient
from backend.main import app
from quantumroute.ui_v2.topologies import DEFAULT_TOPOLOGY_KEY

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "2.0.0"
    assert "engine" in data


def test_get_topologies_list():
    response = client.get("/api/network/topologies")
    assert response.status_code == 200
    data = response.json()
    assert "presets" in data
    assert "default" in data
    assert len(data["presets"]) >= 4
    assert DEFAULT_TOPOLOGY_KEY in data["presets"]


def test_get_topology_details():
    response = client.get(f"/api/network/topologies/{DEFAULT_TOPOLOGY_KEY}")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    node_ids = [n["id"] for n in data["nodes"]]
    assert "Alice" in node_ids
    assert "Bob" in node_ids
    assert len(data["edges"]) == 10


def test_route_calculation_endpoints():
    payload = {
        "topology": DEFAULT_TOPOLOGY_KEY,
        "source": "Alice",
        "target": "Bob",
        "strategy": "quality_aware",
        "alpha": 0.35,
    }
    # Test quality-aware
    resp_qa = client.post("/api/network/route", json=payload)
    assert resp_qa.status_code == 200
    d_qa = resp_qa.json()
    assert d_qa["selected_strategy"] == "quality_aware"
    assert d_qa["selected_route"]["path"] == ["Alice", "Repeater A", "Repeater D", "Bob"]
    assert d_qa["selected_route"]["werner_parameter"] == 0.8574
    assert d_qa["selected_route"]["bell_fidelity"] == 0.8930
    assert d_qa["selected_route"]["num_hops"] == 3

    # Test shortest-hop (BFS)
    payload["strategy"] = "shortest_hop"
    resp_sh = client.post("/api/network/route", json=payload)
    assert resp_sh.status_code == 200
    d_sh = resp_sh.json()
    assert d_sh["selected_strategy"] == "shortest_hop"
    assert d_sh["selected_route"]["path"] == ["Alice", "Repeater B", "Bob"]
    assert d_sh["selected_route"]["num_hops"] == 2
    assert d_sh["selected_route"]["werner_parameter"] == 0.4900

    # Comparison check
    comp = d_sh["comparison"]
    assert "shortest_hop" in comp
    assert "quality_aware" in comp
    assert "multi_metric" in comp
    assert comp["shortest_hop"]["num_hops"] == 2
    assert comp["quality_aware"]["num_hops"] == 3


def test_explain_endpoint():
    response = client.get("/api/network/explain")
    assert response.status_code == 200
    data = response.json()
    assert "for_beginners" in data
    assert "scientific_invariants" in data
    assert "headline" in data["for_beginners"]
    assert len(data["scientific_invariants"]) == 3


def test_simulate_real_qiskit_circuit():
    payload = {
        "path": ["Alice", "Repeater B", "Bob"],
        "topology": DEFAULT_TOPOLOGY_KEY,
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["num_hops"] == 2
    circ = data["circuit_simulation"]
    # Scientific invariant verification: theoretical model matches circuit simulation within 1e-6
    assert circ["fidelity_error_delta"] < 1e-6
    assert circ["qubits_evolved"] == 4  # 2 hops = 4 qubits (2 Bell pairs)
    assert circ["simulated_bell_fidelity"] == 0.6175
