import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export default function DrawingTools({ active, drawMode, label, selectedColor, onItemsChange, eraseAll }) {
  const map = useMap();
  const featureGroupRef = useRef(null);
  const polygonPointsRef = useRef([]);
  const tempPolylineRef = useRef(null);
  const drawnItemsRef = useRef([]);

  // Initialize FeatureGroup
  useEffect(() => {
    const fg = L.featureGroup().addTo(map);
    featureGroupRef.current = fg;
    return () => { fg.remove(); };
  }, [map]);

  // Erase all when triggered
  useEffect(() => {
    if (eraseAll && featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      polygonPointsRef.current = [];
      if (tempPolylineRef.current) { map.removeLayer(tempPolylineRef.current); tempPolylineRef.current = null; }
      drawnItemsRef.current = [];
      onItemsChange([]);
    }
  }, [eraseAll]);

  // Reset polygon points when switching mode
  useEffect(() => {
    polygonPointsRef.current = [];
    if (tempPolylineRef.current) { map.removeLayer(tempPolylineRef.current); tempPolylineRef.current = null; }
  }, [drawMode]);

  useMapEvents({
    click(e) {
      if (!active) return;
      const { lat, lng } = e.latlng;

      if (drawMode === 'marker') {
        const markerLabel = label || 'Marqueur';
        const marker = L.circleMarker([lat, lng], {
          radius: 8, fillColor: selectedColor, color: '#fff',
          weight: 2, fillOpacity: 0.9,
        }).bindPopup(`<b style="color:${selectedColor}">${markerLabel}</b>`);
        featureGroupRef.current.addLayer(marker);
        drawnItemsRef.current = [...drawnItemsRef.current, { type: 'marker', latlng: [lat, lng], label: markerLabel, color: selectedColor }];
        onItemsChange([...drawnItemsRef.current]);
      }

      if (drawMode === 'polygon') {
        polygonPointsRef.current = [...polygonPointsRef.current, [lat, lng]];
        // Update preview polyline
        if (tempPolylineRef.current) map.removeLayer(tempPolylineRef.current);
        if (polygonPointsRef.current.length >= 2) {
          tempPolylineRef.current = L.polyline(polygonPointsRef.current, {
            color: selectedColor, weight: 2, dashArray: '6,4', opacity: 0.8,
          }).addTo(map);
        }
      }
    },
    dblclick(e) {
      if (!active || drawMode !== 'polygon') return;
      const pts = polygonPointsRef.current;
      if (pts.length >= 3) {
        const zoneLabel = label || 'Zone';
        if (tempPolylineRef.current) { map.removeLayer(tempPolylineRef.current); tempPolylineRef.current = null; }
        const polygon = L.polygon(pts, {
          fillColor: selectedColor, color: selectedColor,
          weight: 2, fillOpacity: 0.25,
        }).bindPopup(`<b style="color:${selectedColor}">${zoneLabel}</b>`);
        featureGroupRef.current.addLayer(polygon);
        drawnItemsRef.current = [...drawnItemsRef.current, { type: 'polygon', points: [...pts], label: zoneLabel, color: selectedColor }];
        onItemsChange([...drawnItemsRef.current]);
        polygonPointsRef.current = [];
      }
    },
  });

  return null;
}
