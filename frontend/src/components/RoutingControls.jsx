import { useState } from 'react';

const SOURCES = [
  'Yaoundé (Dépôt Central)',
  'Douala (Hub Littoral)',
  'Bafoussam (Hub Ouest)',
  'Ngaoundéré (Hub Nord)',
];

const RADII = ['20 km', '50 km', '100 km'];

export default function RoutingControls({ active, onToggle, onCalculate }) {
  const [source, setSource] = useState(SOURCES[0]);
  const [radius, setRadius] = useState(RADII[1]);

  const handleCalculate = () => {
    if (typeof onCalculate === 'function') {
      onCalculate(source, radius);
    }
  };

  return (
    <div className="layer-controls" style={{ minWidth: 260 }}>
      {/* Header row */}
      <div
        className="filter-section-header"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.97rem', letterSpacing: '0.01em' }}>
          🚚 Optimisation Logistique
        </span>

        {/* Toggle switch */}
        <label className="switch" style={{ marginLeft: 10, flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={!!active}
            onChange={() => typeof onToggle === 'function' && onToggle()}
          />
          <span className="slider" />
        </label>
      </div>

      {/* Controls */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Source dropdown */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 600,
              marginBottom: 4,
              opacity: 0.75,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Point de départ
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={!active}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.12)',
              color: 'inherit',
              fontSize: '0.85rem',
              cursor: active ? 'pointer' : 'not-allowed',
              opacity: active ? 1 : 0.5,
              outline: 'none',
            }}
          >
            {SOURCES.map((s) => (
              <option key={s} value={s} style={{ color: '#111', background: '#fff' }}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Radius dropdown */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 600,
              marginBottom: 4,
              opacity: 0.75,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Rayon de couverture
          </label>
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            disabled={!active}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.12)',
              color: 'inherit',
              fontSize: '0.85rem',
              cursor: active ? 'pointer' : 'not-allowed',
              opacity: active ? 1 : 0.5,
              outline: 'none',
            }}
          >
            {RADII.map((r) => (
              <option key={r} value={r} style={{ color: '#111', background: '#fff' }}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Calculate button */}
        <button
          onClick={handleCalculate}
          disabled={!active}
          style={{
            marginTop: 2,
            padding: '8px 0',
            borderRadius: 8,
            border: 'none',
            background: active
              ? 'linear-gradient(135deg, #1a6b3c 0%, #27ae60 100%)'
              : 'rgba(255,255,255,0.12)',
            color: active ? '#fff' : 'rgba(255,255,255,0.4)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: active ? 'pointer' : 'not-allowed',
            letterSpacing: '0.03em',
            transition: 'background 0.25s ease, color 0.25s ease',
            boxShadow: active ? '0 2px 10px rgba(39,174,96,0.35)' : 'none',
          }}
        >
          Calculer Itinéraire
        </button>
      </div>

      {/* Legend — only when active */}
      {active && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <p
            style={{
              margin: '0 0 8px 0',
              fontSize: '0.75rem',
              fontWeight: 700,
              opacity: 0.65,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Légende
          </p>

          {[
            { dot: '#27ae60', label: 'Livraison optimale', sub: '< 20 km' },
            { dot: '#f39c12', label: 'Livraison faisable', sub: '20 – 50 km' },
            { dot: '#e74c3c', label: 'Zone difficile', sub: '> 50 km' },
          ].map(({ dot, label, sub }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: dot,
                  flexShrink: 0,
                  boxShadow: `0 0 4px ${dot}99`,
                }}
              />
              <span style={{ fontSize: '0.82rem' }}>
                {label}{' '}
                <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>({sub})</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
