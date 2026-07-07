import geopandas as gpd
import pandas as pd
import numpy as np
import os
from pathlib import Path
from scipy.spatial import cKDTree

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = Path("/Users/user/Downloads/Shapefile 2023")
OUTPUT_DIR = BASE_DIR / "backend" / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# CRS de projection métrique adapté pour le Cameroun (UTM Zone 32N)
METRIC_CRS = "EPSG:32632"
BUFFER_RADIUS_METERS = 5000.0  # 5 km

def main():
    print("Chargement et projection des données...")
    
    # 1. Localités (les cibles d'implantation)
    loc_gdf = gpd.read_file(RAW_DATA_DIR / "POI_2022" / "Localite_2022.shp")
    loc_gdf = loc_gdf.to_crs(METRIC_CRS)
    
    # 2. Concurrents
    pharma_gdf = gpd.read_file(RAW_DATA_DIR / "POI_2022" / "Laboratoire_pharmacie_2022.shp")
    pharma_gdf = pharma_gdf.to_crs(METRIC_CRS)
    
    fosa_gdf = gpd.read_file(RAW_DATA_DIR / "POI_2022" / "Formation_sanitaire_2022.shp")
    fosa_gdf = fosa_gdf.to_crs(METRIC_CRS)
    
    # 3. Facteurs de demande / trafic
    schools_gdf = gpd.read_file(RAW_DATA_DIR / "POI_2022" / "Ecoles_2022.shp")
    schools_gdf = schools_gdf.to_crs(METRIC_CRS)
    
    markets_gdf = gpd.read_file(RAW_DATA_DIR / "POI_2022" / "Marche_2022.shp")
    markets_gdf = markets_gdf.to_crs(METRIC_CRS)

    # Extraire les coordonnées X/Y
    loc_coords = np.array([[geom.x, geom.y] for geom in loc_gdf.geometry])
    pharma_coords = np.array([[geom.x, geom.y] for geom in pharma_gdf.geometry])
    fosa_coords = np.array([[geom.x, geom.y] for geom in fosa_gdf.geometry])
    school_coords = np.array([[geom.x, geom.y] for geom in schools_gdf.geometry])
    market_coords = np.array([[geom.x, geom.y] for geom in markets_gdf.geometry])

    print("Calcul des arbres KD-Tree pour la concurrence...")
    # Plus proche concurrent
    tree_pharma = cKDTree(pharma_coords)
    dist_pharma, idx_pharma = tree_pharma.query(loc_coords, k=1)
    
    tree_fosa = cKDTree(fosa_coords)
    dist_fosa, idx_fosa = tree_fosa.query(loc_coords, k=1)

    print("Calcul des arbres KD-Tree pour la demande (écoles, marchés)...")
    # Densité (nombre de points dans un rayon de 5km)
    tree_schools = cKDTree(school_coords)
    schools_count = np.array([len(idx) for idx in tree_schools.query_ball_point(loc_coords, r=BUFFER_RADIUS_METERS)])
    
    tree_markets = cKDTree(market_coords)
    markets_count = np.array([len(idx) for idx in tree_markets.query_ball_point(loc_coords, r=BUFFER_RADIUS_METERS)])

    print("Calcul des scores géo-marketing...")
    
    # --- CALCUL PHARMACIE ---
    # Demande : cap à 10 écoles (+25 pts max) et 2 marchés (+25 pts max)
    demand_pharma = (np.minimum(schools_count, 10) * 2.5) + (np.minimum(markets_count, 2) * 12.5)
    # Concurrence : max 50 pts si dist >= 5km, sinon proportionnel
    competition_pharma = np.minimum(dist_pharma / BUFFER_RADIUS_METERS, 1.0) * 50.0
    score_pharma = np.round(demand_pharma + competition_pharma).astype(int)

    # --- CALCUL CLINIQUE/FOSA ---
    # Demande : même indicateur de trafic
    demand_fosa = (np.minimum(schools_count, 10) * 2.5) + (np.minimum(markets_count, 2) * 12.5)
    # Concurrence : max 50 pts si dist >= 5km, sinon proportionnel
    competition_fosa = np.minimum(dist_fosa / BUFFER_RADIUS_METERS, 1.0) * 50.0
    score_fosa = np.round(demand_fosa + competition_fosa).astype(int)

    # Enregistrer les résultats dans le GDF localités
    results_df = loc_gdf.copy()
    
    # Nettoyage des colonnes pour limiter la taille du GeoJSON final
    cols_to_keep = ['geometry']
    for name_col in ['Nom', 'NOM', 'NAME', 'VILLAGE']:
        if name_col in results_df.columns:
            cols_to_keep.append(name_col)
            results_df['nom'] = results_df[name_col]
            break
    if 'nom' not in results_df.columns:
        results_df['nom'] = "Localité inconnue"
    cols_to_keep.append('nom')
    
    # Ajout des métadonnées géomarketing
    results_df['sc_pharma'] = score_pharma
    results_df['sc_clinique'] = score_fosa
    results_df['d_pharma'] = np.round(dist_pharma / 1000.0, 2)  # en km
    results_df['d_fosa'] = np.round(dist_fosa / 1000.0, 2)      # en km
    results_df['schools_5k'] = schools_count
    results_df['markets_5k'] = markets_count
    
    # Obtenir le nom du concurrent le plus proche
    results_df['nearest_ph'] = pharma_gdf.iloc[idx_pharma]['Name'].values if 'Name' in pharma_gdf.columns else 'Pharmacie anonyme'
    results_df['nearest_fo'] = fosa_gdf.iloc[idx_fosa]['Name1'].values if 'Name1' in fosa_gdf.columns else 'FOSA anonyme'

    cols_to_keep.extend(['sc_pharma', 'sc_clinique', 'd_pharma', 'd_fosa', 'schools_5k', 'markets_5k', 'nearest_ph', 'nearest_fo'])
    results_df = results_df[cols_to_keep]

    # Convertir en EPSG:4326 pour Leaflet
    print("Reprojection en EPSG:4326...")
    results_df = results_df.to_crs("EPSG:4326")

    output_path = OUTPUT_DIR / "geomarketing.geojson"
    results_df.to_file(output_path, driver="GeoJSON")
    print(f"-> Succès! geomarketing.geojson créé ({os.path.getsize(output_path)/1024/1024:.2f} MB)")

if __name__ == "__main__":
    main()
