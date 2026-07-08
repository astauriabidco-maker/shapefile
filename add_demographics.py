import json

regions_data = {
    "Extrême-Nord": {"population": 5000000, "area_km2": 34263, "urbanisation": 25.0},
    "Centre": {"population": 4800000, "area_km2": 68953, "urbanisation": 70.0},
    "Littoral": {"population": 4300000, "area_km2": 20248, "urbanisation": 90.0},
    "Nord": {"population": 3000000, "area_km2": 66090, "urbanisation": 35.0},
    "Ouest": {"population": 2100000, "area_km2": 13892, "urbanisation": 45.0},
    "Nord-Ouest": {"population": 2100000, "area_km2": 17300, "urbanisation": 40.0},
    "Sud-Ouest": {"population": 1800000, "area_km2": 25410, "urbanisation": 38.0},
    "Adamaoua": {"population": 1400000, "area_km2": 63701, "urbanisation": 30.0},
    "Est": {"population": 1200000, "area_km2": 109002, "urbanisation": 32.0},
    "Sud": {"population": 900000, "area_km2": 47191, "urbanisation": 35.0}
}

file_path = "backend/data/regions.geojson"
with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for feature in data.get("features", []):
    props = feature["properties"]
    # Adjust depending on actual property name in geojson (e.g. 'Nom_Region', 'NAME_1', etc.)
    # Let's find the region name
    name = props.get("Nom_Region") or props.get("NAME_1") or props.get("region")
    
    # Try to match name
    matched_key = None
    if name:
        for k in regions_data.keys():
            if k.lower() in name.lower() or name.lower() in k.lower():
                matched_key = k
                break
    
    if matched_key:
        pop = regions_data[matched_key]["population"]
        area = regions_data[matched_key]["area_km2"]
        props["population_estimee"] = pop
        props["densite_km2"] = round(pop / area, 2)
        props["taux_urbanisation"] = regions_data[matched_key]["urbanisation"]
    else:
        print(f"Warning: could not match region name {name}")

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)

print("Demographic data added successfully.")
