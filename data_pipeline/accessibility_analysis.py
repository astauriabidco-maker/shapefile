"""
Analyse d'accessibilité aux soins de santé au Cameroun.

Ce script calcule pour chaque localité (village/ville) :
  - la distance à la formation sanitaire la plus proche (en km)
  - si elle est en "désert médical" (distance > seuil)

Résultats exportés :
  - localites_avec_distance.geojson : toutes les localités avec leur distance
  - zones_blanches.geojson          : uniquement les localités en désert médical
"""

import geopandas as gpd
import numpy as np
from pathlib import Path
from scipy.spatial import cKDTree

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = Path("/Users/user/Downloads/Shapefile 2023")
OUTPUT_DIR = BASE_DIR / "backend" / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Seuil de désert médical en km
DESERT_THRESHOLD_KM = 10.0


def haversine_km(lon1, lat1, lon2, lat2):
    """Distance en km entre deux points (degrés décimaux)."""
    R = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))


def main():
    print("Chargement des Localités...")
    localites_path = RAW_DATA_DIR / "POI_2022" / "Localite_2022.shp"
    if not localites_path.exists():
        print(f"ERREUR : Fichier introuvable : {localites_path}")
        return

    localites = gpd.read_file(localites_path)
    if localites.crs and localites.crs.to_epsg() != 4326:
        localites = localites.to_crs(epsg=4326)
    elif not localites.crs:
        localites.set_crs(epsg=4326, inplace=True)

    print(f"  -> {len(localites)} localités chargées.")

    print("Chargement des Formations Sanitaires...")
    fosa_path = RAW_DATA_DIR / "POI_2022" / "Formation_sanitaire_2022.shp"
    if not fosa_path.exists():
        print(f"ERREUR : Fichier introuvable : {fosa_path}")
        return

    fosa = gpd.read_file(fosa_path)
    if fosa.crs and fosa.crs.to_epsg() != 4326:
        fosa = fosa.to_crs(epsg=4326)
    elif not fosa.crs:
        fosa.set_crs(epsg=4326, inplace=True)

    print(f"  -> {len(fosa)} FOSA chargées.")

    # Extraire les coordonnées
    loc_coords = np.array([[geom.x, geom.y] for geom in localites.geometry])
    fosa_coords = np.array([[geom.x, geom.y] for geom in fosa.geometry])

    print("Calcul des distances (KD-Tree)...")
    # Utilise un KD-Tree pour trouver le voisin le plus proche efficacement
    tree = cKDTree(fosa_coords)
    distances_deg, indices = tree.query(loc_coords, k=1)

    # Convertir la distance angulaire en km (approximation rapide)
    # Pour un résultat plus précis on utilise haversine sur chaque paire
    print("Conversion des distances en km...")
    distances_km = np.array([
        haversine_km(
            loc_coords[i, 0], loc_coords[i, 1],
            fosa_coords[indices[i], 0], fosa_coords[indices[i], 1]
        )
        for i in range(len(loc_coords))
    ])

    # Ajouter les colonnes de résultats
    localites = localites.copy()
    localites['dist_fosa_km'] = np.round(distances_km, 2)
    localites['fosa_proche'] = fosa.iloc[indices]['Name1'].values if 'Name1' in fosa.columns else 'N/A'
    localites['desert_medical'] = localites['dist_fosa_km'] > DESERT_THRESHOLD_KM

    # Export : toutes les localités avec la distance
    out_all = OUTPUT_DIR / "localites_avec_distance.geojson"
    # On garde seulement les colonnes utiles pour limiter la taille
    cols = [c for c in ['geometry', 'dist_fosa_km', 'fosa_proche', 'desert_medical'] 
            if c in localites.columns or c == 'geometry']
    # Ajouter colonnes nom si disponibles
    for nom_col in ['Nom', 'NOM', 'NAME', 'VILLAGE']:
        if nom_col in localites.columns:
            cols.insert(1, nom_col)
            break
    localites[cols].to_file(out_all, driver="GeoJSON")
    print(f"  -> Sauvegardé : localites_avec_distance.geojson")

    # Export : uniquement les zones blanches
    zones_blanches = localites[localites['desert_medical'] == True][cols]
    out_blanc = OUTPUT_DIR / "zones_blanches.geojson"
    zones_blanches.to_file(out_blanc, driver="GeoJSON")
    nb_deserts = len(zones_blanches)
    pct = nb_deserts / len(localites) * 100
    print(f"  -> Sauvegardé : zones_blanches.geojson")
    print(f"\n=== RÉSULTATS ===")
    print(f"Total localités       : {len(localites)}")
    print(f"Déserts médicaux      : {nb_deserts} ({pct:.1f}%)")
    print(f"Seuil utilisé         : {DESERT_THRESHOLD_KM} km")
    print(f"Distance moy. à FOSA  : {distances_km.mean():.1f} km")
    print(f"Distance max à FOSA   : {distances_km.max():.1f} km")
    print("=================")


if __name__ == "__main__":
    main()
