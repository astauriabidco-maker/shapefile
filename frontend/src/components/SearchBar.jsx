import React, { useState, useEffect, useRef } from 'react';

// Bounding boxes approximatives des régions
const REGION_BOUNDS = {
  'Adamaoua':      [[6.0, 11.5], [8.5, 15.5]],
  'Centre':        [[2.5, 10.5], [6.5, 14.0]],
  'Est':           [[2.0, 13.5], [6.5, 16.2]],
  'Extreme Nord':  [[10.0, 13.5], [13.1, 15.5]],
  'Littoral':      [[3.5, 9.2],  [5.0, 10.8]],
  'Nord':          [[7.5, 12.5], [10.2, 15.0]],
  'North West':    [[5.5, 9.8],  [7.2, 11.0]],
  'Ouest':         [[4.8, 9.8],  [6.2, 11.2]],
  'Sud':           [[1.7, 10.0], [3.5, 14.5]],
  'South West':    [[4.0, 8.4],  [6.0, 10.0]],
};

export default function SearchBar({ geoData, onZoom }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }

    const term = q.toLowerCase();
    const found = [];

    // Search regions (from bounds)
    Object.keys(REGION_BOUNDS).forEach(name => {
      if (name.toLowerCase().includes(term)) {
        found.push({ type: 'Région', name, bounds: REGION_BOUNDS[name] });
      }
    });

    // Search in point layers for matching names
    const pointLayers = [
      { key: 'formations_sanitaires', label: 'FOSA',       nameField: 'Name1' },
      { key: 'pharmacies',            label: 'Pharmacie',   nameField: 'Name' },
      { key: 'ecoles',                label: 'École',       nameField: 'NAME' },
      { key: 'marches',               label: 'Marché',      nameField: 'NAME' },
      { key: 'localites',             label: 'Localité',    nameField: null },
    ];

    pointLayers.forEach(({ key, label, nameField }) => {
      if (!geoData[key]) return;
      const feats = geoData[key].features;
      for (let i = 0; i < feats.length && found.length < 30; i++) {
        const p = feats[i].properties || {};
        const name = p[nameField] || p.NOM || p.Nom || p.nom || p.NAME || p.Name1 || '';
        if (name.toLowerCase().includes(term)) {
          const coords = feats[i].geometry?.coordinates;
          if (coords) {
            found.push({
              type: label,
              name: name,
              region: p.Nom_Region || p.REGION || '',
              point: [coords[1], coords[0]],
            });
          }
        }
      }
    });

    setResults(found.slice(0, 20));
    setOpen(found.length > 0);
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    setOpen(false);
    if (item.bounds) {
      onZoom(item.bounds);
    } else if (item.point) {
      // Zoom to point with a tight bounding box (~2km around)
      const [lat, lng] = item.point;
      onZoom([[lat - 0.02, lng - 0.02], [lat + 0.02, lng + 0.02]]);
    }
  };

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher un lieu, hôpital, école…"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); setResults([]); setOpen(false); }}>✕</button>
        )}
      </div>

      {open && (
        <div className="search-results">
          {results.map((item, i) => (
            <button
              key={i}
              className="search-result-item"
              onClick={() => handleSelect(item)}
            >
              <span className="search-result-type">{item.type}</span>
              <span className="search-result-name">{item.name}</span>
              {item.region && <span className="search-result-region">{item.region}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
