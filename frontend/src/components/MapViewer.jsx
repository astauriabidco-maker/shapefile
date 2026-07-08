import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchBar from './SearchBar';
import RegionLabels from './RegionLabels';
import DrawingTools from './DrawingTools';

let heatLayerRef = null;

const regionStyle   = { fillColor: '#0A5C36', weight: 2,   color: 'white', fillOpacity: 0.12 };
const aireSanteStyle= { fillColor: '#F2A900', weight: 1,   color: '#333',  fillOpacity: 0.1  };
const defaultDistrictStyle = { fillColor: '#0056B3', weight: 1.5, color: '#0056B3', fillOpacity: 0.08 };

const getFetchUrl = (key) => {
  if (key === 'routing') return 'http://localhost:8000/api/routing';
  if (key === 'live-alerts') return 'http://localhost:8000/api/live-alerts';
  if (key === 'demographics') return 'http://localhost:8000/api/geojson/regions'; // Demographics use regions geojson
  return `http://localhost:8000/api/geojson/${key}`;
};

const API_BASE = 'http://localhost:8000/api/geojson';

const FOSA_TYPE_COLORS = {
  'HD': '#c0392b', 'HG': '#c0392b', 'HR': '#c0392b', 'Hopital': '#c0392b',
  'CMA': '#e67e22', 'HC': '#e67e22',
  'CS': '#0056B3', 'CSI': '#0056B3',
  'Clinique': '#8e44ad', 'Polyclinique': '#8e44ad',
  'Cabinet Medical': '#16a085',
  'Dispensaire': '#2ecc71', 'Poste de sante': '#2ecc71',
};

function fosaColor(type) { return FOSA_TYPE_COLORS[type] || '#0056B3'; }

function MapEventsHandler({ onBoundsChange, onZoomChange }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => {
      onBoundsChange(map.getBounds());
      if (onZoomChange) onZoomChange(map.getZoom());
    }
  });
  useEffect(() => { 
    onBoundsChange(map.getBounds()); 
    if (onZoomChange) onZoomChange(map.getZoom());
  }, []); // eslint-disable-line
  return null;
}

function ZoomController({ zoomTarget }) {
  const map = useMap();
  useEffect(() => {
    if (zoomTarget) map.fitBounds(zoomTarget, { padding: [40, 40], animate: true });
  }, [map, zoomTarget]);
  return null;
}

function HeatmapLayer({ data, show }) {
  const map = useMap();
  useEffect(() => {
    if (!window.L?.heatLayer) return;
    if (heatLayerRef) { map.removeLayer(heatLayerRef); heatLayerRef = null; }
    if (show && data?.features) {
      const pts = data.features
        .filter(f => f.geometry?.type === 'Point')
        .map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0], 0.5]);
      heatLayerRef = window.L.heatLayer(pts, {
        radius: 25, blur: 20, maxZoom: 10,
        gradient: { 0.0: 'blue', 0.5: 'yellow', 1.0: 'red' },
      }).addTo(map);
    }
    return () => { if (heatLayerRef) { map.removeLayer(heatLayerRef); heatLayerRef = null; } };
  }, [map, data, show]);
  return null;
}

function applyFilters(geoData, layerKey, filters) {
  if (!geoData[layerKey]) return null;
  const all = geoData[layerKey];
  let filtered = { ...all, features: all.features };

  if (filters.region) {
    filtered = {
      ...filtered,
      features: filtered.features.filter(f => {
        const r = f.properties?.Nom_Region || f.properties?.REGION || '';
        return r.toLowerCase().includes(filters.region.toLowerCase());
      }),
    };
  }

  if (layerKey === 'formations_sanitaires') {
    filtered = {
      ...filtered,
      features: filtered.features.filter(f => {
        const type   = f.properties?.Type   || '';
        const statut = f.properties?.Statut || '';
        return filters.fosaTypes.includes(type) && filters.fosaStatuts.includes(statut);
      }),
    };
  }

  if (layerKey === 'ecoles') {
    filtered = {
      ...filtered,
      features: filtered.features.filter(f => {
        const type = f.properties?.TYPE || '';
        return filters.ecoleTypes.some(k => type.toLowerCase().includes(k.toLowerCase()));
      }),
    };
  }

  if (layerKey === 'pharmacies') {
    filtered = {
      ...filtered,
      features: filtered.features.filter(f =>
        filters.pharmaTypes.includes(f.properties?.type || f.properties?.Type || '')
      ),
    };
  }

  if (layerKey === 'lieux_culte') {
    filtered = {
      ...filtered,
      features: filtered.features.filter(f =>
        filters.culteTypes.includes(f.properties?.Type || '')
      ),
    };
  }

  return filtered;
}

export default function MapViewer({
  activeLayers, heatmapLayer, filters, onVisibleDataUpdate, zoomTarget,
  geomarketingActive, geomarketingType, highlightDistrict,
  routingActive, routingSource, routingRadius,
  epidemioActive, epidemioDisease, epidemioLevel, onEpidemioData,
  collabActive, drawMode, drawColor, drawLabel, drawnItems, onDrawnItemsChange, eraseAll
}) {
  const [geoData, setGeoData] = useState({});
  const [loading, setLoading] = useState(false);
  const [localZoomTarget, setLocalZoomTarget] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(6);
  const currentBounds = useRef(null);

  useEffect(() => {
    if (!document.getElementById('leaflet-heat-script')) {
      const s = document.createElement('script');
      s.id = 'leaflet-heat-script';
      s.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
      document.head.appendChild(s);
    }
  }, []);

  const updateVisibleStats = useCallback((bounds, data, activeFilters) => {
    if (!bounds || !data) return;
    const stats = { fosa_list: [], formations_sanitaires: 0, pharmacies: 0, ecoles: 0, zones_blanches: 0 };

    const isVisible = (f) => {
      if (f.geometry?.type === 'Point') {
        const [lng, lat] = f.geometry.coordinates;
        return bounds.contains([lat, lng]);
      }
      return false;
    };

    const check = (key, statKey, listKey) => {
      if (!activeLayers[key] || !data[key]) return;
      const filtered = applyFilters(data, key, activeFilters);
      if (!filtered) return;
      filtered.features.forEach(f => {
        if (isVisible(f)) {
          stats[statKey]++;
          if (listKey) stats[listKey].push(f.properties);
        }
      });
    };

    check('formations_sanitaires', 'formations_sanitaires', 'fosa_list');
    check('pharmacies', 'pharmacies', null);
    check('ecoles', 'ecoles', null);
    check('zones_blanches', 'zones_blanches', null);

    onVisibleDataUpdate(stats);
  }, [activeLayers, onVisibleDataUpdate]);

  useEffect(() => {
    const allKeys = [...new Set([
      ...Object.keys(activeLayers).filter(k => activeLayers[k]), 
      heatmapLayer,
      geomarketingActive ? 'geomarketing' : null,
      routingActive ? 'routing' : null,
      epidemioActive ? 'live-alerts' : null,
    ].filter(Boolean))];
    const toFetch = allKeys.filter(k => !geoData[k]);
    if (!toFetch.length) {
      updateVisibleStats(currentBounds.current, geoData, filters);
      return;
    }
    setLoading(true);
    Promise.all(toFetch.map(k => fetch(getFetchUrl(k)).then(r => r.ok ? r.json() : null).catch(() => null)))
      .then(results => {
        const nd = { ...geoData };
        results.forEach((d, i) => { if (d) nd[toFetch[i]] = d; });
        setGeoData(nd);
        setLoading(false);
        updateVisibleStats(currentBounds.current, nd, filters);
      });
  }, [activeLayers, heatmapLayer, geomarketingActive, routingActive, epidemioActive]); // eslint-disable-line

  useEffect(() => {
    updateVisibleStats(currentBounds.current, geoData, filters);
  }, [filters, updateVisibleStats, geoData]);

  // Sync epidemiology alerts to parent state for counts/dashboard
  useEffect(() => {
    if (onEpidemioData && geoData['live-alerts']) {
      let alerts = geoData['live-alerts'].features || [];
      if (epidemioDisease) {
        alerts = alerts.filter(f => f.properties.disease === epidemioDisease);
      }
      if (epidemioLevel && epidemioLevel !== 'Toutes') {
        alerts = alerts.filter(f => f.properties.severity === epidemioLevel);
      }
      onEpidemioData(alerts);
    }
  }, [geoData['live-alerts'], epidemioDisease, epidemioLevel, onEpidemioData]);

  const handleBoundsChange = useCallback((bounds) => {
    currentBounds.current = bounds;
    updateVisibleStats(bounds, geoData, filters);
  }, [geoData, filters, updateVisibleStats]);

  const makePopup = (feature) => {
    const p = feature.properties || {};
    let html = '<div style="font-family:Inter,sans-serif;font-size:13px;line-height:1.7;">';
    const rows = [
      ['Nom',          p.Name1 || p.NAME || p.NOM || p.Name || p.nom],
      ['Type',         p.Type  || p.TYPE || p.type],
      ['Statut',       p.Statut],
      ['Région',       p.Nom_Region || p.REGION],
      ['District',     p.District_S],
      ['Département',  p.Nom_Dept],
      ['Aire de santé',p.Nom_AS],
      ['Population Est.', p.population_estimee ? `${p.population_estimee.toLocaleString()} hab.` : null],
      ['Densité',       p.densite_km2 ? `${p.densite_km2} hab/km²` : null],
      ['Urbanisation',  p.taux_urbanisation ? `${p.taux_urbanisation}%` : null],
      ['Distance FOSA',p.dist_fosa_km ? `${p.dist_fosa_km} km` : null],
      ['FOSA proche',  p.fosa_proche],
    ];
    rows.forEach(([label, val]) => {
      if (val) html += `<span style="color:#64748b;font-size:11px">${label}</span><br/><b>${val}</b><br/>`;
    });
    html += '</div>';
    return html;
  };

  const onEach = (feature, layer) => layer.bindPopup(makePopup(feature));
  const circle = (color, r = 4) => (feat, latlng) => L.circleMarker(latlng, { radius: r, fillColor: color, color: '#fff', weight: 1, fillOpacity: 0.85 });
  const fd = (key) => activeLayers[key] ? applyFilters(geoData, key, filters) : null;

  const getOpportunityClass = (score) => {
    if (score >= 75) return 'green';
    if (score >= 50) return 'yellow';
    if (score >= 25) return 'orange';
    return 'red';
  };
  
  const getOpportunityColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#fbbf24';
    if (score >= 25) return '#f97316';
    return '#ef4444';
  };

  const makeGeomarketingPopup = (feature) => {
    const p = feature.properties;
    const score = geomarketingType === 'pharmacie' ? p.sc_pharma : p.sc_clinique;
    const colorClass = getOpportunityClass(score);
    const labelType = geomarketingType === 'pharmacie' ? 'Pharmacie' : 'Clinique / Cabinet';
    const nearestComp = geomarketingType === 'pharmacie' ? p.nearest_ph : p.nearest_fo;
    const distComp = geomarketingType === 'pharmacie' ? p.d_pharma : p.d_fosa;
    
    return `
      <div class="geomarketing-popup">
        <h4 style="margin: 0 0 6px 0; font-size: 14px; color: var(--primary);">${p.nom || 'Localité'}</h4>
        <div class="geomarketing-score-badge ${colorClass}">
          Score Implantation : ${score}/100
        </div>
        <div class="geomarketing-metric-row">
          <span style="color: var(--text-muted);">Commerce cible:</span>
          <span class="geomarketing-metric-val">${labelType}</span>
        </div>
        <div class="geomarketing-metric-row">
          <span style="color: var(--text-muted);">Concurrent proche:</span>
          <span class="geomarketing-metric-val" title="${nearestComp}">${nearestComp ? nearestComp.substring(0, 15) : 'Aucun'}</span>
        </div>
        <div class="geomarketing-metric-row">
          <span style="color: var(--text-muted);">Distance concurrent:</span>
          <span class="geomarketing-metric-val">${distComp} km</span>
        </div>
        <div class="geomarketing-metric-row">
          <span style="color: var(--text-muted);">Écoles (5km):</span>
          <span class="geomarketing-metric-val">${p.schools_5k}</span>
        </div>
        <div class="geomarketing-metric-row">
          <span style="color: var(--text-muted);">Marchés (5km):</span>
          <span class="geomarketing-metric-val">${p.markets_5k}</span>
        </div>
      </div>
    `;
  };

  const getDistrictStyle = (feature) => {
    if (!highlightDistrict) return defaultDistrictStyle;
    
    // Check if the highlighted area is this district
    const isTargetDistrict = feature.properties.District_S === highlightDistrict || feature.properties.DISTRICT === highlightDistrict || feature.properties.DISTRICT_S === highlightDistrict;
    
    // Check if the highlighted area is actually the region that this district belongs to
    const isTargetRegion = feature.properties.Nom_Region === highlightDistrict || feature.properties.REGION === highlightDistrict;
    
    if (isTargetDistrict || isTargetRegion) {
      return { fillColor: 'transparent', weight: 4, color: '#10b981', fillOpacity: 0.1 };
    }
    return { fillColor: '#000', weight: 1, color: '#333', fillOpacity: 0.85 };
  };

  const getDemographicsColor = (density) => {
    if (!density) return '#e2e8f0'; // gris par défaut
    if (density > 200) return '#083344'; // cyan-950
    if (density > 100) return '#0e7490'; // cyan-700
    if (density > 50)  return '#06b6d4'; // cyan-500
    if (density > 20)  return '#67e8f9'; // cyan-300
    return '#cffafe'; // cyan-100
  };

  const getRegionStyle = (feature) => {
    if (heatmapLayer === 'demographics') {
      const density = feature.properties.densite_km2;
      return { 
        fillColor: getDemographicsColor(density), 
        weight: 1, 
        color: '#ffffff', 
        fillOpacity: 0.8 
      };
    }
    
    if (highlightDistrict) {
      const isTarget = feature.properties.Nom_Region === highlightDistrict || feature.properties.REGION === highlightDistrict || feature.properties.Region === highlightDistrict;
      if (isTarget) {
         return { fillColor: 'transparent', weight: 4, color: '#10b981', fillOpacity: 0.1 };
      }
      return { fillColor: 'transparent', weight: 1, color: 'rgba(255,255,255,0.2)', fillOpacity: 0 };
    }
    return regionStyle;
  };

  const makeRoutingPopup = (feat) => {
    const p = feat.properties;
    return `
      <div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.6;">
        <h4 style="margin:0 0 5px 0;color:#0A5C36;font-size:13px;">${p.name}</h4>
        <b>Dépôt de départ:</b> ${p.hub}<br/>
        <b>Distance estimée:</b> ${parseFloat(p.distance_km).toFixed(1)} km<br/>
        <b>Capacité d'accès:</b> <span style="color:${p.color};font-weight:bold;">${p.score}/100</span>
      </div>
    `;
  };

  const makeEpidemioPopup = (feat) => {
    const p = feat.properties;
    return `
      <div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.6;">
        <h4 style="margin:0 0 5px 0;color:#ef4444;font-size:13px;">🦠 Signalement Épidémie</h4>
        <b>Zone :</b> ${p.nom || 'Inconnue'}<br/>
        <b>Maladie :</b> <span style="font-weight:bold;color:#ef4444;">${p.disease}</span><br/>
        <b>Cas actifs :</b> ${p.cases}<br/>
        <b>Niveau d'alerte :</b> <span style="font-weight:bold;">${p.severity}</span>
      </div>
    `;
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {loading && <div className="loading-overlay"><div className="spinner" />Chargement…</div>}

      {geomarketingActive && currentZoom < 9 && (
        <div style={{
          position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px 16px',
          borderRadius: '20px', zIndex: 1000, fontSize: '12px', fontWeight: '500'
        }}>
          🔍 Rapprochez-vous (zoom) pour voir les scores d'opportunité
        </div>
      )}

      <SearchBar geoData={geoData} onZoom={setLocalZoomTarget} />

      <MapContainer
        bounds={[[1.65, 8.4], [13.1, 16.2]]} zoomSnap={0.5}
        style={{ height: '100%', width: '100%' }} zoomControl={false}
      >
        <MapEventsHandler onBoundsChange={handleBoundsChange} onZoomChange={setCurrentZoom} />
        <ZoomController zoomTarget={zoomTarget || localZoomTarget} />

        <TileLayer attribution='&copy; OSM' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {/* Polygons */}
        {(activeLayers.regions || heatmapLayer === 'demographics') && (geoData.regions || geoData.demographics) && 
          <GeoJSON 
            key={heatmapLayer === 'demographics' ? 'demographics' : 'regions'}
            data={geoData.regions || geoData.demographics}       
            style={getRegionStyle}    
            onEachFeature={onEach} 
          />
        }
        {(activeLayers.districts_sante || highlightDistrict) && geoData.districts_sante && (
          <GeoJSON 
            key={highlightDistrict || 'districts'} 
            data={geoData.districts_sante} 
            style={getDistrictStyle} 
            onEachFeature={onEach} 
          />
        )}
        {activeLayers.aires_sante   && geoData.aires_sante   && <GeoJSON data={geoData.aires_sante}   style={aireSanteStyle} onEachFeature={onEach} />}

        {/* FOSA — colored by type */}
        {fd('formations_sanitaires')?.features.length > 0 && (
          <GeoJSON
            key={JSON.stringify(filters.fosaTypes) + JSON.stringify(filters.fosaStatuts) + filters.region}
            data={fd('formations_sanitaires')}
            pointToLayer={(feat, latlng) =>
              L.circleMarker(latlng, {
                radius: 5,
                fillColor: fosaColor(feat.properties?.Type),
                color: '#fff', weight: 1, fillOpacity: 0.9,
              })
            }
            onEachFeature={onEach}
          />
        )}

        {/* Pharmacies / Labos — colored by type */}
        {fd('pharmacies')?.features.length > 0 && (
          <GeoJSON
            key={'pharma' + JSON.stringify(filters.pharmaTypes) + filters.region}
            data={fd('pharmacies')}
            pointToLayer={(feat, latlng) => {
              const t = feat.properties?.type || feat.properties?.Type || '';
              return L.circleMarker(latlng, { radius: 4, fillColor: t === 'Pharmacie' ? '#F2A900' : '#16a085', color: '#fff', weight: 1, fillOpacity: 0.9 });
            }}
            onEachFeature={onEach}
          />
        )}

        {/* Écoles — colored by level */}
        {fd('ecoles')?.features.length > 0 && (
          <GeoJSON
            key={'ecoles' + JSON.stringify(filters.ecoleTypes) + filters.region}
            data={fd('ecoles')}
            pointToLayer={(feat, latlng) => {
              const t = (feat.properties?.TYPE || '').toLowerCase();
              const col = t.includes('university') ? '#8e44ad' : t.includes('secondary') ? '#e67e22' : t.includes('primary') ? '#0056B3' : '#128C54';
              return L.circleMarker(latlng, { radius: 3, fillColor: col, color: '#fff', weight: 1, fillOpacity: 0.8 });
            }}
            onEachFeature={onEach}
          />
        )}

        {/* Lieux de Culte */}
        {fd('lieux_culte')?.features.length > 0 && (
          <GeoJSON
            key={'culte' + JSON.stringify(filters.culteTypes) + filters.region}
            data={fd('lieux_culte')}
            pointToLayer={(feat, latlng) => {
              const t = feat.properties?.Type || '';
              return L.circleMarker(latlng, { radius: 3, fillColor: t === 'Eglise' ? '#8e44ad' : '#e67e22', color: '#fff', weight: 1, fillOpacity: 0.8 });
            }}
            onEachFeature={onEach}
          />
        )}

        {activeLayers.marches    && geoData.marches    && <GeoJSON key={'marches'+filters.region}   data={fd('marches')    || geoData.marches}   pointToLayer={circle('#e67e22')} onEachFeature={onEach} />}
        {activeLayers.localites  && geoData.localites  && <GeoJSON key={'loc'+filters.region}        data={fd('localites')  || geoData.localites}  pointToLayer={circle('#7f8c8d', 2)} onEachFeature={onEach} />}

        {/* Déserts médicaux */}
        {activeLayers.zones_blanches && geoData.zones_blanches && (
          <GeoJSON
            data={geoData.zones_blanches}
            pointToLayer={(_, latlng) => L.circleMarker(latlng, { radius: 5, fillColor: '#e74c3c', color: '#c0392b', weight: 1.5, fillOpacity: 0.75 })}
            onEachFeature={onEach}
          />
        )}

        {/* Region Count Labels Overlay */}
        {activeLayers.regions && geoData.regions && (
          <RegionLabels
            regionsGeo={geoData.regions}
            pointsGeo={fd('formations_sanitaires') || fd('ecoles') || fd('pharmacies')}
            show={activeLayers.regions}
          />
        )}

        {/* Geomarketing Layer */}
        {geomarketingActive && currentZoom >= 9 && geoData.geomarketing && (
          <GeoJSON
            key={'geomarketing' + geomarketingType}
            data={geoData.geomarketing}
            pointToLayer={(feat, latlng) => {
              const score = geomarketingType === 'pharmacie' ? feat.properties.sc_pharma : feat.properties.sc_clinique;
              return L.circleMarker(latlng, {
                radius: 6,
                fillColor: getOpportunityColor(score),
                color: '#fff',
                weight: 1.5,
                fillOpacity: 0.9,
              });
            }}
            onEachFeature={(feat, layer) => layer.bindPopup(makeGeomarketingPopup(feat))}
          />
        )}

        {/* Routing Supply Chain Layer */}
        {routingActive && geoData.routing && (
          <GeoJSON
            key={'routing' + routingSource + routingRadius}
            data={{
              ...geoData.routing,
              features: geoData.routing.features.filter(f => {
                if (!routingSource) return true;
                const matchesHub = f.properties.hub.toLowerCase().includes(routingSource.split(' ')[0].toLowerCase());
                if (!matchesHub) return false;
                const distLimit = parseInt(routingRadius);
                return f.properties.distance_km <= distLimit;
              })
            }}
            pointToLayer={(feat, latlng) => L.circleMarker(latlng, {
              radius: 5,
              fillColor: feat.properties.color || '#94a3b8',
              color: '#fff', weight: 1, fillOpacity: 0.85,
            })}
            onEachFeature={(feat, layer) => layer.bindPopup(makeRoutingPopup(feat))}
          />
        )}

        {/* Epidemiology Alerts Layer */}
        {epidemioActive && geoData['live-alerts'] && (
          <GeoJSON
            key={'epidemio' + epidemioDisease + epidemioLevel}
            data={{
              ...geoData['live-alerts'],
              features: geoData['live-alerts'].features.filter(f => {
                const matchesDisease = f.properties.disease === epidemioDisease;
                const matchesLevel = epidemioLevel === 'Toutes' || f.properties.severity === epidemioLevel;
                return matchesDisease && matchesLevel;
              })
            }}
            pointToLayer={(feat, latlng) => {
              const sev = feat.properties.severity;
              const color = sev === 'Critique' ? '#ef4444' : sev === 'Élevé' ? '#f97316' : '#3b82f6';
              const cases = feat.properties.cases || 10;
              const size = Math.max(7, Math.min(22, cases / 8));
              return L.circleMarker(latlng, {
                radius: size,
                fillColor: color,
                color: '#fff', weight: 2, fillOpacity: 0.7,
              });
            }}
            onEachFeature={(feat, layer) => layer.bindPopup(makeEpidemioPopup(feat))}
          />
        )}

        {/* Drawing & Collaborative Tools component */}
        <DrawingTools
          active={collabActive}
          drawMode={drawMode}
          label={drawLabel}
          selectedColor={drawColor}
          onItemsChange={onDrawnItemsChange}
          eraseAll={eraseAll}
        />

        {/* Heatmap */}
        {heatmapLayer && geoData[heatmapLayer] && <HeatmapLayer data={geoData[heatmapLayer]} show />}
      </MapContainer>
    </div>
  );
}
