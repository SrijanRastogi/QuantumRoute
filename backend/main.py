"""QuantumRoute V2 FastAPI Application Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.network import router as network_router
from backend.routes.simulate import router as simulate_router
from backend.routes.experiments import router as experiments_router

app = FastAPI(
    title="QuantumRoute™ V2 Scientific API",
    description="Quantum communication network simulation and routing engine API",
    version="2.0.0",
)

# Enable CORS for Vite frontend running on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(network_router)
app.include_router(simulate_router)
app.include_router(experiments_router)


@app.get("/api/health")
def health_check():
    """Health check endpoint for QuantumRoute V2 backend."""
    return {
        "status": "healthy",
        "service": "QuantumRoute V2 API",
        "version": "2.0.0",
        "engine": "Qiskit 1.4.6 / Qiskit Aer 0.18.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
