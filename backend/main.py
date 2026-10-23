"""QuantumRoute V2 FastAPI Application Entry Point."""

import os
import sys

# Ensure src directory is in sys.path
_src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.routes.network import router as network_router
from backend.routes.simulate import router as simulate_router
from backend.routes.experiments import router as experiments_router
from backend.routes.channels import router as channels_router
from backend.routes.purification import router as purification_router
from backend.routes.qasm import router as qasm_router
from backend.routes.validation import router as validation_router
from backend.routes.analysis import router as analysis_router

app = FastAPI(
    title="QuantumRoute™ V2 Scientific API",
    description="Quantum communication network simulation and routing engine API",
    version="2.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all scientific API routers under /api
app.include_router(network_router)
app.include_router(simulate_router)
app.include_router(experiments_router)
app.include_router(channels_router)
app.include_router(purification_router)
app.include_router(qasm_router)
app.include_router(validation_router)
app.include_router(analysis_router)


@app.get("/api/health")
def health_check():
    """Health check endpoint for QuantumRoute V2 backend."""
    return {
        "status": "healthy",
        "service": "QuantumRoute V2 API",
        "version": "2.0.0",
        "engine": "Qiskit 1.4.6 / Qiskit Aer 0.18.0",
    }


# Static assets & SPA fallback (Method A - Single Unified Full-Stack Service)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend build not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
