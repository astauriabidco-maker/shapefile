import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Overlays count labels at the centroid of each region polygon.
 * Props:
 *   regionsGeo  - GeoJSON FeatureCollection (regions polygons)
 *   pointsGeo   - GeoJSON FeatureCollection (the points to count, e.g. FOSA)
 *   show         - boolean, whether to display
 *   label        - string label for tooltip (e.g. "FOSA")
 */
export default function RegionLabels({ regionsGeo, pointsGeo, show }) {
  const map = useMap();
  const layerGroupRef = useRef(null);

  useEffect(() => {
    // Clean up previous labels
    if (layerGroupRef.current) {
      map.removeLayer(layerGroupRef.current);
      layerGroupRef.current = null;
    }

    if (!show || !regionsGeo || !pointsGeo) return;

    const group = L.layerGroup();

    // Pre-compute: count points per region
    const counts = {};
    regionsGeo.features.forEach(f => {
      const name = f.properties?.REGION || f.properties?.Nom_Region || f.properties?.NOM_REG || '';
      counts[name] = 0;
    });

    pointsGeo.features.forEach(f => {
      const region = f.properties?.Nom_Region || f.properties?.REGION || '';
      if (region in counts) {
        counts[region]++;
      }
    });

    // Create label markers at each region centroid
    regionsGeo.features.forEach(feature => {
      const name = feature.properties?.REGION || feature.properties?.Nom_Region || feature.properties?.NOM_REG || '';
      const count = counts[name] || 0;

      // Compute centroid from the geometry
      let centroid;
      try {
        const geoLayer = L.geoJSON(feature);
        centroid = geoLayer.getBounds().getCenter();
      } catch (e) {
        return;
      }

      if (!centroid) return;

      const icon = L.divIcon({
        className: 'region-label-icon',
        html: `
          <div class="region-label">
            <span class="region-label-count">${count.toLocaleString()}</span>
            <span class="region-label-name">${name}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker(centroid, { icon, interactive: false });
      group.addLayer(marker);
    });

    group.addTo(map);
    layerGroupRef.current = group;

    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
    };
  }, [map, regionsGeo, pointsGeo, show]);

  return null;
}
