"""
epidemiology_simulator.py
─────────────────────────
Axe 4 – Couplage avec Données Dynamiques Réelles (Santé Connectée)

Reads localites.geojson, randomly selects 50 localities (seed=42), assigns
epidemiological attributes, and writes epidemiology_alerts.geojson.

Usage:
    python data_pipeline/epidemiology_simulator.py
"""

import os
import numpy as np
import geopandas as gpd

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR  = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data')
INPUT_FILE  = os.path.join(BASE_DIR, 'localites.geojson')
OUTPUT_FILE = os.path.join(BASE_DIR, 'epidemiology_alerts.geojson')

# ── Constants ──────────────────────────────────────────────────────────────────
DISEASES   = ['Paludisme', 'Choléra', 'Mpox', 'Méningite']
SEVERITIES = ['Critique', 'Élevé', 'Modéré']
N_SAMPLES  = 50
RNG_SEED   = 42


def main():
    # ── 1. Load source layer ───────────────────────────────────────────────────
    if not os.path.isfile(INPUT_FILE):
        raise FileNotFoundError(
            f"Source file not found: {INPUT_FILE}\n"
            "Make sure localites.geojson is present in backend/data/."
        )

    gdf = gpd.read_file(INPUT_FILE)
    print(f"[INFO] Loaded {len(gdf)} localities from {INPUT_FILE}")

    # ── 2. Sample N localities deterministically ───────────────────────────────
    np.random.seed(RNG_SEED)
    n = min(N_SAMPLES, len(gdf))
    sample_idx = np.random.choice(gdf.index, size=n, replace=False)
    sample_gdf = gdf.loc[sample_idx].copy().reset_index(drop=True)
    print(f"[INFO] Sampled {n} localities (seed={RNG_SEED})")

    # ── 3. Assign epidemiological attributes ───────────────────────────────────
    sample_gdf['disease']  = np.random.choice(DISEASES,   size=n)
    sample_gdf['severity'] = np.random.choice(SEVERITIES, size=n)
    sample_gdf['cases']    = np.random.randint(10, 201,   size=n)   # [10, 200]
    sample_gdf['week']     = np.random.randint(1, 5,      size=n)   # [1,  4]

    # ── 4. Ensure geometry is valid (use centroid for non-Point layers) ────────
    if sample_gdf.geometry.geom_type.isin(['Polygon', 'MultiPolygon']).any():
        sample_gdf['geometry'] = sample_gdf.geometry.centroid
        print("[INFO] Converted polygon geometries to centroids")

    # ── 5. Write output ────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    sample_gdf.to_file(OUTPUT_FILE, driver='GeoJSON')
    print(f"[OK]   Wrote {n} alert features → {OUTPUT_FILE}")

    # ── 6. Quick summary ───────────────────────────────────────────────────────
    print("\n── Breakdown by disease ──────────────────────────────────")
    for disease, grp in sample_gdf.groupby('disease'):
        print(f"  {disease:12s}: {len(grp):3d} alerts | "
              f"{grp['cases'].sum():6d} cases total")

    print("\n── Breakdown by severity ─────────────────────────────────")
    for sev, grp in sample_gdf.groupby('severity'):
        print(f"  {sev:10s}: {len(grp):3d} alerts | "
              f"max {grp['cases'].max():3d} cases")


if __name__ == '__main__':
    main()
