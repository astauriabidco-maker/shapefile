import React, { useState, useEffect } from 'react';

export function getFavorites() {
  try {
    const data = localStorage.getItem('chi_favorites');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function addFavorite(name, type = 'district') {
  try {
    const favs = getFavorites();
    if (!favs.some(f => f.name === name)) {
      favs.push({ name, type, addedAt: Date.now() });
      localStorage.setItem('chi_favorites', JSON.stringify(favs));
      // Dispatch custom event to update MyDashboard
      window.dispatchEvent(new Event('chi_favorites_updated'));
    }
  } catch (e) {}
}

export default function MyDashboard({ currentView, onFocusFavorite, onAddFavorite }) {
  const [favorites, setFavorites] = useState([]);

  const loadFavorites = () => setFavorites(getFavorites());

  useEffect(() => {
    loadFavorites();
    window.addEventListener('chi_favorites_updated', loadFavorites);
    return () => window.removeEventListener('chi_favorites_updated', loadFavorites);
  }, []);

  const removeFavorite = (name) => {
    try {
      const favs = favorites.filter(f => f.name !== name);
      localStorage.setItem('chi_favorites', JSON.stringify(favs));
      setFavorites(favs);
    } catch (e) {}
  };

  return (
    <div className="layer-controls" style={{ marginBottom: '15px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>⭐</span> Mes Territoires Surveillés
      </h3>
      
      {favorites.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#94a3b8', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', textAlign: 'center' }}>
          Épinglez un district ou une région pour le surveiller ici.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {favorites.map((f, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
              padding: '8px', borderRadius: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ 
                  display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', 
                  background: f.type === 'region' ? '#10b981' : '#3b82f6' 
                }} />
                <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>{f.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => onFocusFavorite && onFocusFavorite(f)}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                  title="Voir sur la carte"
                >
                  Voir →
                </button>
                <button 
                  onClick={() => removeFavorite(f.name)}
                  style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                  title="Supprimer"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {currentView && !favorites.some(f => f.name === currentView) && (
        <button 
          onClick={() => {
            if (onAddFavorite) onAddFavorite(currentView);
            else addFavorite(currentView, 'district');
          }}
          style={{
            width: '100%', marginTop: '10px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
            border: '1px dashed rgba(59,130,246,0.3)', padding: '6px', borderRadius: '6px',
            fontSize: '11px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          + Épingler {currentView}
        </button>
      )}
    </div>
  );
}
