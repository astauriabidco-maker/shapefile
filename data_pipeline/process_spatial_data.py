import geopandas as gpd
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = Path("/Users/user/Downloads/Shapefile 2023")
OUTPUT_DIR = BASE_DIR / "backend" / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SIMPLIFY_TOLERANCE_POLYGON = 0.005

def process_shapefile(shapefile_path, output_name, simplify=False):
    print(f"Traitement de {shapefile_path.name}...")
    try:
        gdf = gpd.read_file(shapefile_path)
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)
        elif not gdf.crs:
            gdf.set_crs(epsg=4326, inplace=True)
        if simplify and not gdf.empty:
            gdf['geometry'] = gdf['geometry'].simplify(SIMPLIFY_TOLERANCE_POLYGON, preserve_topology=True)
        output_path = OUTPUT_DIR / f"{output_name}.geojson"
        gdf.to_file(output_path, driver="GeoJSON")
        print(f"  -> Sauvegardé : {output_name}.geojson ({os.path.getsize(output_path) / 1024 / 1024:.2f} MB)")
        return True
    except Exception as e:
        print(f"  -> Erreur : {e}")
        return False

def main():
    polygons = [
        (RAW_DATA_DIR / "BD_2022" / "Regions_2022.shp", "regions"),
        (RAW_DATA_DIR / "BD_2022" / "Departement_2022.shp", "departements"),
        (RAW_DATA_DIR / "BD_2022" / "Commune_arrondissement_2022.shp", "communes"),
        (RAW_DATA_DIR / "BD_2022" / "District_sante_2022.shp", "districts_sante"),
        (RAW_DATA_DIR / "BD_2022" / "Aire_sante_2022.shp", "aires_sante"),
    ]
    points = [
        (RAW_DATA_DIR / "POI_2022" / "Formation_sanitaire_2022.shp", "formations_sanitaires"),
        (RAW_DATA_DIR / "POI_2022" / "Laboratoire_pharmacie_2022.shp", "pharmacies"),
        (RAW_DATA_DIR / "POI_2022" / "Ecoles_2022.shp", "ecoles"),
        # Nouvelles couches
        (RAW_DATA_DIR / "POI_2022" / "Marche_2022.shp", "marches"),
        (RAW_DATA_DIR / "POI_2022" / "Lieux_culte_2022.shp", "lieux_culte"),
        (RAW_DATA_DIR / "POI_2022" / "Localite_2022.shp", "localites"),
    ]

    for shp_path, name in polygons:
        if shp_path.exists():
            process_shapefile(shp_path, name, simplify=True)
        else:
            print(f"Introuvable : {shp_path}")

    for shp_path, name in points:
        if shp_path.exists():
            process_shapefile(shp_path, name, simplify=False)
        else:
            print(f"Introuvable : {shp_path}")

    print("\nTraitement terminé.")

if __name__ == "__main__":
    main()
