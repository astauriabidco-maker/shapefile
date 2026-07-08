import React, { useState, useEffect } from 'react';

const BADGES = [
  { id: 'pioneer', icon: '⭐', label: 'Pionnier', desc: 'Premier accès à la plateforme', condition: (act) => act.sessions >= 1 },
  { id: 'explorer', icon: '🗺️', label: 'Explorateur', desc: '3 sessions de connexion', condition: (act) => act.sessions >= 3 },
  { id: 'analyst', icon: '🔬', label: 'Analyste', desc: '1 rapport PDF généré', condition: (act) => act.reports >= 1 },
  { id: 'sentinel', icon: '🚨', label: 'Sentinelle', desc: '5 alertes épidémiques consultées', condition: (act) => act.alerts >= 5 },
  { id: 'expert', icon: '🏆', label: 'Expert', desc: '10 sessions de connexion', condition: (act) => act.sessions >= 10 },
];

export function trackActivity(type) {
  try {
    const data = localStorage.getItem('chi_activity');
    const act = data ? JSON.parse(data) : { sessions: 1, districts: [], reports: 0, alerts: 0 };
    
    if (type === 'report') act.reports++;
    else if (type === 'alert') act.alerts++;
    else if (type.startsWith('district:')) {
      const d = type.split(':')[1];
      if (!act.districts.includes(d)) act.districts.push(d);
    }
    else if (type === 'session') act.sessions++;

    localStorage.setItem('chi_activity', JSON.stringify(act));
    window.dispatchEvent(new Event('chi_activity_updated'));
  } catch (e) {}
}

export default function ProfileBadge({ activityRef }) {
  const [activity, setActivity] = useState({ sessions: 0, districts: [], reports: 0, alerts: 0 });

  const loadActivity = () => {
    try {
      const data = localStorage.getItem('chi_activity');
      if (data) setActivity(JSON.parse(data));
      else {
        // Init session
        trackActivity('session');
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadActivity();
    // Auto-increment session on first mount if not done recently, simple version: just do it once per load
    trackActivity('session');
    
    window.addEventListener('chi_activity_updated', loadActivity);
    return () => window.removeEventListener('chi_activity_updated', loadActivity);
  }, []);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '10px',
      padding: '12px',
      marginBottom: '15px'
    }}>
      <h3 style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Mon Profil d'Activité
      </h3>
      
      <div style={{ fontSize: '13px', color: '#fff', marginBottom: '10px' }}>
        🔗 {activity.sessions} sessions · {activity.districts.length} districts explorés
      </div>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {BADGES.map(b => {
          const unlocked = b.condition(activity);
          return (
            <div 
              key={b.id}
              title={`${b.label} : ${b.desc}${unlocked ? ' (Débloqué)' : ' 🔒'}`}
              style={{
                fontSize: '20px',
                opacity: unlocked ? 1 : 0.2,
                filter: unlocked ? 'none' : 'grayscale(100%)',
                cursor: 'help',
                position: 'relative'
              }}
            >
              {b.icon}
              {!unlocked && <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: '10px' }}>🔒</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
