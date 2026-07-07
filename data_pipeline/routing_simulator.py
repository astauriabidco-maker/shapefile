"""
routing_simulator.py
--------------------
Axe 2 — Optimisation Logistique de Distribution (Supply Chain)

Reads FOSA point data, assigns each point to its nearest distribution hub,
computes straight-line distance using the haversine formula via GeoPandas
projected CRS, and writes routing_zones.geojson with delivery scoring.

Output fields per feature:
    name         – facility name (from FOSA properties)
    hub          – nearest hub name
    distance_km  – distance to that hub in kilometres (2 d.p.)
    score        – 100 (< 20 km) | 60 (20–50 km) | 20 (> 50 km)
    color        – 'green' | 'yellow' | 'red'
"""

import math
import json
from pathlib import Path

import geopandas as gpd
from shapely.geometry import Point

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).resolve().parent.parent / "backend" / "data"
FOSA_PATH = DATA_DIR / "formations_sanitaires.geojson"
PHARMA_PATH = DATA_DIR / "pharmacies.geojson"
OUTPUT_PATH = DATA_DIR / "routing_zones.geojson"

# ---------------------------------------------------------------------------
# Hub definitions  (lon, lat  →  WGS-84)
# ---------------------------------------------------------------------------
HUBS = {
    "Yaoundé (Dépôt Central)": {"lon": 11.502, "lat": 3.848},
    "Douala (Hub Littoral)":    {"lon":  9.741, "lat": 4.061},
    "Bafoussam (Hub Ouest)":    {"lon": 10.421, "lat": 5.478},
    "Ngaoundéré (Hub Nord)":   {"lon": 13.584, "lat": 7.328},
}

# ---------------------------------------------------------------------------
# Haversine helper
# ---------------------------------------------------------------------------
EARTH_R_KM = 6_371.0


def haversine_km(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Return great-circle distance in km between two (lon, lat) points."""
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    return 2 * EARTH_R_KM * math.asin(math.sqrt(a))


# ---------------------------------------------------------------------------
# Scoring / colour rules
# ---------------------------------------------------------------------------
def score_and_color(distance_km: float):
    if distance_km < 20:
        return 100, "green"
    elif distance_km <= 50:
        return 60, "yellow"
    else:
        return 20, "red"


# ---------------------------------------------------------------------------
# Nearest hub lookup
# ---------------------------------------------------------------------------
def nearest_hub(lon: float, lat: float):
    """Return (hub_name, distance_km) for the closest hub."""
    best_name, best_dist = None, float("inf")
    for hub_name, coords in HUBS.items():
        d = haversine_km(lon, lat, coords["lon"], coords["lat"])
        if d < best_dist:
            best_dist = d
            best_name = hub_name
    return best_name, best_dist


# ---------------------------------------------------------------------------
# Name extraction helper
# ---------------------------------------------------------------------------
def extract_name(props: dict) -> str:
    """Try common field names for the facility name."""
    for key in ("nom", "name", "NAME", "NOM", "libelle", "LIBELLE", "label", "LABEL"):
        val = props.get(key)
        if val and str(val).strip():
            return str(val).strip()
    return "Inconnu"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print(f"[routing_simulator] Reading FOSA data from: {FOSA_PATH}")
    fosa_gdf = gpd.read_file(FOSA_PATH)

    # Keep only point geometries; drop nulls
    fosa_gdf = fosa_gdf[fosa_gdf.geometry.notnull()].copy()
    fosa_gdf = fosa_gdf[fosa_gdf.geometry.geom_type == "Point"].copy()

    # Ensure WGS-84
    if fosa_gdf.crs is None:
        fosa_gdf = fosa_gdf.set_crs(epsg=4326)
    else:
        fosa_gdf = fosa_gdf.to_crs(epsg=4326)

    print(f"[routing_simulator] {len(fosa_gdf)} FOSA points loaded.")

    features = []
    for _, row in fosa_gdf.iterrows():
        geom = row.geometry
        lon, lat = geom.x, geom.y

        hub_name, dist_km = nearest_hub(lon, lat)
        score, color = score_and_color(dist_km)
        name = extract_name(row.to_dict())

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(lon, 6), round(lat, 6)],
            },
            "properties": {
                "name":        name,
                "hub":         hub_name,
                "distance_km": round(dist_km, 2),
                "score":       score,
                "color":       color,
            },
        })

    geojson_out = {
        "type": "FeatureCollection",
        "features": features,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(geojson_out, fh, ensure_ascii=False, indent=2)

    # Summary stats
    total = len(features)
    greens  = sum(1 for f in features if f["properties"]["color"] == "green")
    yellows = sum(1 for f in features if f["properties"]["color"] == "yellow")
    reds    = sum(1 for f in features if f["properties"]["color"] == "red")

    print(f"\n[routing_simulator] Done — {total} features written to:")
    print(f"  {OUTPUT_PATH}")
    print(f"\nDelivery zone summary:")
    print(f"  🟢 Optimale  (< 20 km) : {greens:>5}  ({greens/total*100:.1f}%)")
    print(f"  🟡 Faisable (20-50 km) : {yellows:>5}  ({yellows/total*100:.1f}%)")
    print(f"  🔴 Difficile (> 50 km) : {reds:>5}  ({reds/total*100:.1f}%)")


if __name__ == "__main__":
    main()
