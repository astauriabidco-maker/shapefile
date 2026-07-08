import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000/api';

export default function DailyBrief({ onExplore }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/geojson/zones_blanches`).then(r => r.json()).catch(() => null),
      fetch(`${API}/live-alerts`).then(r => r.json()).catch(() => null),
      fetch(`${API}/geojson/geomarketing`).then(r => r.json()).catch(() => null),
      fetch(`${API}/geojson/formations_sanitaires`).then(r => r.json()).catch(() => null),
      fetch(`${API}/geojson/pharmacies`).then(r => r.json()).catch(() => null),
    ]).then(([zonesData, alertsData, gmData, fosaData, pharmaData]) => {
      
      const seed = new Date().getDate();
      const option = seed % 5;
      
      let selectedInsight = null;

      if (option === 0 && zonesData?.features?.length > 0) {
         const z = zonesData.features[seed % zonesData.features.length];
         selectedInsight = {
             type: 'zones_blanches',
             title: 'Désert Médical',
             value: z.properties.nom || 'Zone non identifiée',
             subtitle: `Situé à ${Math.round(z.properties.distance_hopital_km || 0)} km de l'hôpital le plus proche.`,
             data: z
         };
      } else if (option === 1 && alertsData?.features?.length > 0) {
          const counts = {};
          alertsData.features.forEach(f => {
              const d = f.properties.disease;
              counts[d] = (counts[d] || 0) + (f.properties.cases || 0);
          });
          const topDisease = Object.keys(counts).sort((a,b) => counts[b] - counts[a])[0];
          selectedInsight = {
              type: 'alerts',
              title: 'Alerte Épidémique',
              value: topDisease,
              subtitle: `${counts[topDisease]} cas signalés récemment.`,
              data: { disease: topDisease }
          };
      } else if (option === 2 && gmData?.features?.length > 0) {
          const top = [...gmData.features].sort((a,b) => (b.properties.sc_pharma||0) - (a.properties.sc_pharma||0))[0];
          selectedInsight = {
              type: 'geomarketing',
              title: 'Top Opportunité',
              value: top.properties.nom,
              subtitle: `Score pharmacie de ${Math.round(top.properties.sc_pharma)}/100`,
              data: top
          };
      } else if (option === 3 && fosaData?.features?.length > 0) {
          selectedInsight = {
              type: 'fosa',
              title: 'Infrastructures',
              value: fosaData.features.length.toLocaleString(),
              subtitle: `Formations sanitaires répertoriées sur le territoire.`,
              data: null
          };
      } else {
          // Fallback or option 4
          const pCount = pharmaData?.features?.length || 0;
          selectedInsight = {
              type: 'pharma',
              title: 'Réseau Pharmaceutique',
              value: pCount.toLocaleString(),
              subtitle: `Pharmacies et laboratoires actifs.`,
              data: null
          };
      }
      
      setInsight(selectedInsight);
      setLoading(false);
    });
  }, []);

  const today = new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'});

  return (
    <div style={{
      background: 'rgba(16,185,129,0.05)',
      border: '1px solid rgba(16,185,129,0.15)',
      borderRadius: '12px',
      padding: '16px',
      fontFamily: 'Inter, sans-serif',
      marginBottom: '15px'
    }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
        ✨ Briefing du {today}
      </div>
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
           <div className="skeleton-pulse" style={{ height: '28px', width: '60%', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}></div>
           <div className="skeleton-pulse" style={{ height: '14px', width: '80%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}></div>
        </div>
      ) : insight ? (
        <div>
           <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>{insight.title}</div>
           <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', lineHeight: '1.2', margin: '4px 0' }}>
             {insight.value}
           </div>
           <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>
             {insight.subtitle}
           </div>
           {insight.data && onExplore && (
             <button 
               onClick={() => onExplore(insight.type, insight.data)}
               style={{
                 background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                 color: '#10b981', padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                 cursor: 'pointer', fontWeight: 'bold'
               }}>
               Explorer →
             </button>
           )}
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>Données indisponibles</div>
      )}
    </div>
  );
}
