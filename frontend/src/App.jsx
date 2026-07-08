import React, { useState, useRef, useCallback } from 'react';
import MapViewer from './components/MapViewer';
import Dashboard from './components/Dashboard';
import ExportButton from './components/ExportButton';
import FilterPanel, { defaultFilters } from './components/FilterPanel';
import GeomarketingControls from './components/GeomarketingControls';
import PremiumReportGenerator from './components/PremiumReportGenerator';
import RoutingControls from './components/RoutingControls';
import EpidemiologyControls from './components/EpidemiologyControls';
import CollabControls from './components/CollabControls';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';

import DailyBrief from './components/DailyBrief';
import MyDashboard from './components/MyDashboard';
import TrendsBanner from './components/TrendsBanner';
import ProfileBadge from './components/ProfileBadge';

const LAYER_CONFIG = [
  { key: 'regions',                label: 'Régions',                         color: '#0A5C36', type: 'polygon' },
  { key: 'districts_sante',       label: 'Districts de Santé',              color: '#0056B3', type: 'polygon' },
  { key: 'aires_sante',           label: 'Aires de Santé',                  color: '#F2A900', type: 'polygon' },
  { key: 'formations_sanitaires', label: 'Formations Sanitaires (FOSA)',    color: '#0056B3', type: 'point' },
  { key: 'pharmacies',            label: 'Pharmacies & Labos',              color: '#F2A900', type: 'point' },
  { key: 'zones_blanches',        label: '🔴 Déserts Médicaux',             color: '#e74c3c', type: 'point' },
  { key: 'marches',               label: 'Marchés',                         color: '#e67e22', type: 'point' },
  { key: 'lieux_culte',           label: 'Lieux de Culte',                  color: '#8e44ad', type: 'point' },
  { key: 'localites',             label: 'Localités',                       color: '#7f8c8d', type: 'point' },
  { key: 'ecoles',                label: 'Écoles',                          color: '#128C54', type: 'point' },
];

const HEATMAP_OPTIONS = [
  { value: '',                      label: 'Aucune' },
  { value: 'formations_sanitaires', label: 'Densité FOSA' },
  { value: 'pharmacies',            label: 'Densité Pharmacies' },
  { value: 'ecoles',                label: 'Densité Écoles' },
  { value: 'marches',               label: 'Densité Marchés' },
  { value: 'lieux_culte',           label: 'Densité Lieux de Culte' },
  { value: 'demographics',          label: '🗺️ Densité Démographique' },
];

function App() {
  const [layers, setLayers] = useState({
    regions: true,
    formations_sanitaires: true,
    zones_blanches: false,
    districts_sante: false,
    aires_sante: false,
    pharmacies: false,
    marches: false,
    lieux_culte: false,
    localites: false,
    ecoles: false,
  });

  const [heatmapLayer, setHeatmapLayer] = useState('');
  const [filters, setFilters] = useState(defaultFilters());
  const [visibleStats, setVisibleStats] = useState({
    fosa_list: [], formations_sanitaires: 0, pharmacies: 0, ecoles: 0, zones_blanches: 0,
  });
  const [zoomTarget, setZoomTarget] = useState(null);
  const [geomarketingActive, setGeomarketingActive] = useState(false);
  const [geomarketingType, setGeomarketingType] = useState('pharmacie');
  const [highlightDistrict, setHighlightDistrict] = useState('');
  // Routing state
  const [routingActive, setRoutingActive] = useState(false);
  const [routingSource, setRoutingSource] = useState('');
  const [routingRadius, setRoutingRadius] = useState('50 km');
  // Epidemiology state
  const [epidemioActive, setEpidemioActive] = useState(false);
  const [epidemioDisease, setEpidemioDisease] = useState('Paludisme');
  const [epidemioLevel, setEpidemioLevel] = useState('Toutes');
  const [epidemioData, setEpidemioData] = useState([]);
  // Collab state
  const [collabActive, setCollabActive] = useState(false);
  const [drawMode, setDrawMode] = useState('marker');
  const [drawColor, setDrawColor] = useState('#e74c3c');
  const [drawLabel, setDrawLabel] = useState('');
  const [drawnItems, setDrawnItems] = useState([]);
  const [eraseAll, setEraseAll] = useState(false);
  const [view, setView] = useState('landing'); // 'landing' | 'login' | 'app'
  const mapRef = useRef(null);

  const toggleLayer = (key) => setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const handleZoomToRegion = useCallback((bounds) => {
    setZoomTarget([...bounds]);
  }, []);

  if (view === 'landing') {
    return <LandingPage onLogin={() => setView('login')} onEnter={() => setView('app')} />;
  }

  if (view === 'login') {
    return <LoginScreen onLogin={() => setView('app')} onBack={() => setView('landing')} />;
  }

  const exploreDistrictDuJour = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/geojson/districts_sante');
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const rand = data.features[Math.floor(Math.random() * data.features.length)];
        const name = rand.properties.Nom_District || 'Inconnu';
        setHighlightDistrict(name);
        setLayers(prev => ({ ...prev, districts_sante: true }));
      }
    } catch(e) {}
  };

  return (
    <div className="app-container" ref={mapRef}>
      {/* Map (background) */}
      <div className="map-container">
        <MapViewer
          activeLayers={layers}
          heatmapLayer={heatmapLayer}
          filters={filters}
          onVisibleDataUpdate={setVisibleStats}
          zoomTarget={zoomTarget}
          geomarketingActive={geomarketingActive}
          geomarketingType={geomarketingType}
          highlightDistrict={highlightDistrict}
          routingActive={routingActive}
          routingSource={routingSource}
          routingRadius={routingRadius}
          epidemioActive={epidemioActive}
          epidemioDisease={epidemioDisease}
          epidemioLevel={epidemioLevel}
          onEpidemioData={setEpidemioData}
          collabActive={collabActive}
          drawMode={drawMode}
          drawColor={drawColor}
          drawLabel={drawLabel}
          drawnItems={drawnItems}
          onDrawnItemsChange={setDrawnItems}
          eraseAll={eraseAll}
        />
        {/* Trends Banner at the bottom of the map */}
        <TrendsBanner />
      </div>

      {/* Floating Sidebar */}
      <div className="sidebar glass-panel">
        <div className="header" style={{ position: 'relative' }}>
          <h1>Cameroon Health<br />Intelligence</h1>
          <p>Plateforme Géo-Décisionnelle · 2022</p>
          <button 
            onClick={() => setView('landing')}
            style={{
              position: 'absolute', top: '5px', right: '5px', background: 'rgba(231, 76, 60, 0.1)',
              color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.2)', padding: '4px 8px',
              borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Quitter
          </button>
        </div>

        <DailyBrief onExplore={(type, data) => {
          if (type === 'geomarketing') {
             setGeomarketingActive(true);
             setZoomTarget(data.geometry.coordinates);
          } else if (type === 'alerts') {
             setEpidemioActive(true);
             setEpidemioDisease(data.disease);
          } else if (type === 'zones_blanches') {
             setLayers(prev => ({ ...prev, zones_blanches: true }));
             setZoomTarget(data.geometry.coordinates);
          }
        }} />

        <ProfileBadge />
        
        <MyDashboard 
          currentView={highlightDistrict} 
          onFocusFavorite={(f) => {
            setHighlightDistrict(f.name);
            setLayers(prev => ({ ...prev, districts_sante: true }));
          }} 
        />

        <div style={{ padding: '0 10px 15px 10px' }}>
          <button onClick={exploreDistrictDuJour} style={{
            width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3b82f6',
            background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer',
            display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center'
          }}>
            <span>🎲</span> Découvrir le District du Jour
          </button>
        </div>

        {/* Dashboard (BI) */}
        <Dashboard visibleStats={visibleStats} onZoomToRegion={handleZoomToRegion} />

        {/* Advanced Filters */}
        <FilterPanel filters={filters} onChange={setFilters} />

        {/* Geomarketing */}
        <GeomarketingControls 
          active={geomarketingActive} 
          type={geomarketingType}
          onToggle={setGeomarketingActive}
          onTypeChange={setGeomarketingType}
        />

        {/* Audit Premium */}
        <PremiumReportGenerator 
          mapRef={mapRef} 
          onHighlight={setHighlightDistrict} 
          onZoom={handleZoomToRegion} 
        />

        {/* Routing Logistique */}
        <RoutingControls
          active={routingActive}
          onToggle={setRoutingActive}
          onCalculate={(src, radius) => { setRoutingSource(src); setRoutingRadius(radius); }}
        />

        {/* Épidémiologie Live */}
        <EpidemiologyControls
          active={epidemioActive}
          onToggle={setEpidemioActive}
          disease={epidemioDisease}
          onDiseaseChange={setEpidemioDisease}
          alertLevel={epidemioLevel}
          onAlertLevelChange={setEpidemioLevel}
          alertsData={epidemioData}
        />

        {/* Outils Collaboratifs */}
        <CollabControls
          active={collabActive}
          onToggle={setCollabActive}
          drawnItems={drawnItems}
          onDelete={(i) => setDrawnItems(prev => prev.filter((_, idx) => idx !== i))}
          onExport={() => {
            const blob = new Blob([JSON.stringify(drawnItems, null, 2)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = `annotations_${Date.now()}.json`; a.click();
          }}
          selectedColor={drawColor}
          onColorChange={setDrawColor}
          label={drawLabel}
          onLabelChange={setDrawLabel}
          drawMode={drawMode}
          onModeChange={(mode) => { setDrawMode(mode); setEraseAll(false); }}
        />

        {/* Layer Toggles */}
        <div className="layer-controls">
          <h3>Couches de Données</h3>
          <div className="toggle-group">
            {LAYER_CONFIG.map(({ key, label, color }) => (
              <label key={key} className="toggle-label">
                <div className="switch">
                  <input type="checkbox" checked={!!layers[key]} onChange={() => toggleLayer(key)} />
                  <span className="slider" style={layers[key] ? { backgroundColor: color } : {}} />
                </div>
                <span className="dot" style={{ background: color }} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Heatmap Control */}
        <div className="layer-controls">
          <h3>🔥 Carte de Chaleur</h3>
          <select
            className="heatmap-select"
            value={heatmapLayer}
            onChange={(e) => setHeatmapLayer(e.target.value)}
          >
            {HEATMAP_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {heatmapLayer && (
            <p className="heatmap-hint">
              Rouge = forte concentration · Bleu = faible concentration
            </p>
          )}
        </div>

        {/* Export */}
        <ExportButton mapRef={mapRef} />
      </div>
    </div>
  );
}

export default App;
