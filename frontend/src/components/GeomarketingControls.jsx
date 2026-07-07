import React from 'react';

export default function GeomarketingControls({ active, type, onToggle, onTypeChange }) {
  return (
    <div className="layer-controls geomarketing-controls-panel">
      <div className="filter-section-header">
        <h3>🔍 Aide à l'Implantation</h3>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={active} 
            onChange={(e) => onToggle(e.target.checked)} 
          />
          <span className="slider" style={active ? { backgroundColor: '#10b981' } : {}} />
        </label>
      </div>
      
      {active && (
        <div className="geomarketing-settings" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label className="filter-section-title" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Type de Commerce Cible
            </label>
            <select 
              className="heatmap-select" 
              value={type} 
              onChange={(e) => onTypeChange(e.target.value)}
              style={{ marginTop: '4px' }}
            >
              <option value="pharmacie">💊 Pharmacie</option>
              <option value="clinique">🏥 Clinique / Cabinet Médical</option>
            </select>
          </div>

          <div className="geomarketing-legend" style={{ 
            fontSize: '11px', 
            background: 'rgba(0,0,0,0.02)', 
            padding: '10px', 
            borderRadius: '8px', 
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '2px' }}>Légende d'Opportunité :</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span><b>75 - 100</b> : Exceptionnelle (Vert)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }} />
              <span><b>50 - 74</b> : Favorable (Jaune)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
              <span><b>25 - 49</b> : Faible (Orange)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <span><b>0 - 24</b> : À risque (Rouge)</span>
            </div>
          </div>
          
          <p className="heatmap-hint" style={{ fontSize: '10px' }}>
            * Zoomez sur la carte (niveau 9+) pour faire apparaître les points d'opportunités sur les localités.
          </p>
        </div>
      )}
    </div>
  );
}
