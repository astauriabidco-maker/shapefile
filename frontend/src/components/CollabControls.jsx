import React, { useState } from 'react';

const PRESET_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];

export default function CollabControls({
  active, onToggle, drawnItems = [], onDelete, onExport,
  selectedColor, onColorChange, label, onLabelChange, drawMode, onModeChange,
}) {
  return (
    <div className="layer-controls">
      <div className="filter-section-header">
        <h3>✏️ Outils Collaboratifs</h3>
        <label className="switch">
          <input type="checkbox" checked={active} onChange={(e) => onToggle(e.target.checked)} />
          <span className="slider" style={active ? { backgroundColor: '#8e44ad' } : {}} />
        </label>
      </div>

      {active && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          {/* Drawing mode */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => onModeChange('marker')}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: '6px', border: '2px solid',
                borderColor: drawMode === 'marker' ? '#8e44ad' : '#e2e8f0',
                background: drawMode === 'marker' ? '#f3e8ff' : 'white',
                cursor: 'pointer', fontSize: '12px', fontWeight: '600',
              }}>
              📍 Marqueur
            </button>
            <button
              onClick={() => onModeChange('polygon')}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: '6px', border: '2px solid',
                borderColor: drawMode === 'polygon' ? '#8e44ad' : '#e2e8f0',
                background: drawMode === 'polygon' ? '#f3e8ff' : 'white',
                cursor: 'pointer', fontSize: '12px', fontWeight: '600',
              }}>
              ⬟ Polygone
            </button>
          </div>

          {/* Color picker */}
          <div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 5px 0' }}>Couleur :</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {PRESET_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => onColorChange(c)}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', background: c,
                    cursor: 'pointer',
                    border: selectedColor === c ? '3px solid #1e293b' : '2px solid white',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Label input */}
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="Nom de la zone..."
            style={{
              padding: '7px 10px', borderRadius: '6px', border: '1px solid #e2e8f0',
              fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none',
            }}
          />

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
            {drawMode === 'marker' ? '📍 Cliquez sur la carte pour placer un marqueur.' : '⬟ Cliquez pour ajouter des points, double-cliquez pour fermer la zone.'}
          </p>

          {/* Drawn items list */}
          {drawnItems.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0' }}>
                {drawnItems.length} annotation(s) :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                {drawnItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', background: '#f8fafc', borderRadius: '4px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: item.type === 'marker' ? '50%' : '2px', background: item.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label || 'Sans nom'}</span>
                    <button onClick={() => onDelete(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px', lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export button */}
          {drawnItems.length > 0 && (
            <button
              onClick={onExport}
              style={{
                background: 'transparent', border: '1.5px solid #8e44ad', color: '#8e44ad',
                padding: '7px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
              }}>
              ⬇ Exporter les annotations (JSON)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
