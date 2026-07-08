import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000/api';

export default function TrendsBanner() {
  const [stats, setStats] = useState({ activeAlerts: 0, cases: 0, criticalDisease: '', criticalFoyers: 0, zonesBlanches: 0 });

  useEffect(() => {
    // Inject animation style
    if (!document.getElementById('chi-ticker-style')) {
      const style = document.createElement('style');
      style.id = 'chi-ticker-style';
      style.innerHTML = `
        @keyframes scroll-x {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .ticker-container {
          display: flex;
          white-space: nowrap;
          animation: scroll-x 25s linear infinite;
        }
        .ticker-container:hover {
          animation-play-state: paused;
        }
      `;
      document.head.appendChild(style);
    }

    Promise.all([
      fetch(`${API}/live-alerts`).then(r => r.json()).catch(() => null),
      fetch(`${API}/geojson/zones_blanches`).then(r => r.json()).catch(() => null)
    ]).then(([alertsData, zonesData]) => {
      let activeAlerts = 0;
      let cases = 0;
      const diseaseCounts = {};
      
      if (alertsData && alertsData.features) {
        activeAlerts = alertsData.features.length;
        alertsData.features.forEach(f => {
          cases += (f.properties.cases || 0);
          const d = f.properties.disease;
          diseaseCounts[d] = (diseaseCounts[d] || 0) + 1;
        });
      }
      
      const criticalDisease = Object.keys(diseaseCounts).sort((a,b) => diseaseCounts[b] - diseaseCounts[a])[0] || 'Aucune';
      const criticalFoyers = diseaseCounts[criticalDisease] || 0;
      
      const zonesBlanches = zonesData?.features?.length || 0;

      setStats({ activeAlerts, cases, criticalDisease, criticalFoyers, zonesBlanches });
    });
  }, []);

  return (
    <div style={{
      position: 'sticky', bottom: 0, left: 0, right: 0, height: '36px',
      background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', overflow: 'hidden', zIndex: 1000,
      fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#94a3b8', backdropFilter: 'blur(10px)'
    }}>
      <div className="ticker-container" style={{ display: 'flex', gap: '50px', paddingLeft: '100%' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>🦠 Tendance Épidémique :</span>
          <span>{stats.activeAlerts} foyers actifs</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          <span>+{stats.cases} cas cette semaine</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 Alerte Majeure :</span>
          <span>{stats.criticalDisease}</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          <span>{stats.criticalFoyers} foyers de haute intensité</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>⚠️ Infrastructures :</span>
          <span>{stats.zonesBlanches} déserts médicaux critiques nécessitant une intervention</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>📈 Géo-Marketing :</span>
          <span>Mise à jour des scores d'opportunité effectuée il y a 2h</span>
        </div>

      </div>
    </div>
  );
}
