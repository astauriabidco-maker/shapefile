from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
import json

app = FastAPI(title="Cameroon Health GIS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

@app.get("/")
def read_root():
    return {"message": "Welcome to Cameroon Health GIS API"}

@app.get("/api/geojson/{layer_name}")
def get_geojson(layer_name: str):
    file_path = DATA_DIR / f"{layer_name}.geojson"
    if file_path.exists():
        return FileResponse(file_path)
    return {"error": "Layer not found"}, 404

@app.get("/api/live-alerts")
def get_live_alerts():
    file_path = DATA_DIR / "epidemiology_alerts.geojson"
    if file_path.exists():
        return FileResponse(file_path, media_type="application/geo+json")
    return {"error": "Epidemiology data not found. Run the simulator first."}, 404

@app.get("/api/routing")
def get_routing():
    file_path = DATA_DIR / "routing_zones.geojson"
    if file_path.exists():
        return FileResponse(file_path, media_type="application/geo+json")
    return {"error": "Routing data not found. Run the routing simulator first."}, 404

@app.get("/api/stats")
def get_stats():
    # Placeholder for dashboard statistics
    # In a full implementation, we'd process the Excel files here
    return {
        "total_formations_sanitaires": 4500,
        "total_pharmacies": 1200,
        "total_ecoles": 25000,
        "regions": 10
    }
