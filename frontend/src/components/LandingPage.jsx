import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000/api';

// ─────────────────────────────────────────────────────────────────────────────
// MINI WIDGET : Géo-Marketing — top opportunités pharmacies + cliniques
// ─────────────────────────────────────────────────────────────────────────────
function GeoMarketingWidget() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/geojson/geomarketing`)
      .then(r => r.json())
      .then(data => {
        const sorted = [...data.features]
          .sort((a, b) => (b.properties.sc_pharma || 0) - (a.properties.sc_pharma || 0))
          .slice(0, 5)
          .map(f => ({
            nom: f.properties.nom || '—',
            sc_pharma: Math.round(f.properties.sc_pharma || 0),
            sc_clinique: Math.round(f.properties.sc_clinique || 0),
          }));
        setRows(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const Bar = ({ val, color }) => (
    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${val}%`, height: '100%', background: color, transition: 'width 1s ease' }} />
    </div>
  );

  return (
    <div style={widgetBox}>
      <div style={widgetTitle}>🏆 Top 5 — Score d'Opportunité d'Implantation</div>
      {loading ? <Loader /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#cbd5e1' }}>
                <span style={{ fontWeight: '600', color: '#fff' }}>{r.nom}</span>
                <span>💊 {r.sc_pharma}/100 &nbsp;🏥 {r.sc_clinique}/100</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Bar val={r.sc_pharma} color="#10b981" />
                <Bar val={r.sc_clinique} color="#3b82f6" />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '11px', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '2px', display: 'inline-block' }} />Pharmacie</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '2px', display: 'inline-block' }} />Clinique</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI WIDGET : Supply Chain — couverture par Hub logistique
// ─────────────────────────────────────────────────────────────────────────────
function RoutingWidget() {
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/routing`)
      .then(r => r.json())
      .then(data => {
        const hubStats = {};
        data.features.forEach(f => {
          const h = f.properties.hub;
          if (!hubStats[h]) hubStats[h] = { total: 0, optimal: 0, feasible: 0, difficult: 0 };
          hubStats[h].total++;
          const d = f.properties.distance_km;
          if (d < 20) hubStats[h].optimal++;
          else if (d <= 50) hubStats[h].feasible++;
          else hubStats[h].difficult++;
        });
        const result = Object.entries(hubStats).map(([name, s]) => ({
          name,
          total: s.total,
          optPct: Math.round((s.optimal / s.total) * 100),
          feaPct: Math.round((s.feasible / s.total) * 100),
          difPct: Math.round((s.difficult / s.total) * 100),
        }));
        setHubs(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={widgetBox}>
      <div style={widgetTitle}>🗺️ Couverture par Hub — {hubs.reduce((s, h) => s + h.total, 0).toLocaleString()} FOSA analysées</div>
      {loading ? <Loader /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hubs.map((h, i) => (
            <div key={i} style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#cbd5e1' }}>
                <span style={{ fontWeight: '600', color: '#fff' }}>{h.name.split('(')[0].trim()}</span>
                <span style={{ color: '#64748b' }}>{h.total} pts desservis</span>
              </div>
              <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${h.optPct}%`, background: '#10b981' }} title={`Optimal: ${h.optPct}%`} />
                <div style={{ width: `${h.feaPct}%`, background: '#fbbf24' }} title={`Faisable: ${h.feaPct}%`} />
                <div style={{ width: `${h.difPct}%`, background: '#ef4444' }} title={`Difficile: ${h.difPct}%`} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '10px', color: '#64748b' }}>
                <span style={{ color: '#10b981' }}>✓ {h.optPct}% opt.</span>
                <span style={{ color: '#fbbf24' }}>~ {h.feaPct}% faisable</span>
                <span style={{ color: '#ef4444' }}>✕ {h.difPct}% difficile</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI WIDGET : Audit Premium — KPIs d'un vrai district
// ─────────────────────────────────────────────────────────────────────────────
function AuditWidget() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/geojson/formations_sanitaires`).then(r => r.json()).catch(() => null),
      fetch(`${API}/geojson/pharmacies`).then(r => r.json()).catch(() => null),
      fetch(`${API}/geojson/zones_blanches`).then(r => r.json()).catch(() => null),
      fetch(`${API}/geojson/districts_sante`).then(r => r.json()).catch(() => null),
    ]).then(([fosa, pharma, zones, districts]) => {
      // Pick first district from dataset and gather its stats
      const district = districts?.features?.[0]?.properties?.Nom_District || 'Yaoundé Centre';
      const region = districts?.features?.[0]?.properties?.Nom_Region || 'Centre';
      const fosaCount = fosa?.features?.length || 0;
      const pharmaCount = pharma?.features?.length || 0;
      const zoneCount = zones?.features?.length || 0;
      const districtCount = districts?.features?.length || 0;
      setKpis({ district, region, fosaCount, pharmaCount, zoneCount, districtCount });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={widgetBox}>
      <div style={widgetTitle}>📋 Rapport d'Audit — Données Réelles du Territoire</div>
      {loading ? <Loader /> : kpis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '6px', padding: '8px 12px', color: '#10b981', fontWeight: 'bold' }}>
            🗺️ Échantillon : {kpis.districtCount} Districts — Région {kpis.region}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <KpiBox label="Formations sanitaires" value={kpis.fosaCount.toLocaleString()} color="#3b82f6" emoji="🏥" />
            <KpiBox label="Pharmacies & Labos" value={kpis.pharmaCount.toLocaleString()} color="#f59e0b" emoji="💊" />
            <KpiBox label="Déserts médicaux" value={kpis.zoneCount.toLocaleString()} color="#ef4444" emoji="⚠️" />
            <KpiBox label="Districts cartographiés" value={kpis.districtCount.toLocaleString()} color="#8b5cf6" emoji="📍" />
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            → Génération d'un rapport PDF complet de 10 pages disponible en 1 clic
          </div>
        </div>
      )}
    </div>
  );
}

function KpiBox({ label, value, color, emoji }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}20`, borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color }}>{emoji} {value}</div>
      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI WIDGET : Épidémiologie Live — foyers actifs par maladie
// ─────────────────────────────────────────────────────────────────────────────
function EpidemioWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const DISEASES = ['Paludisme', 'Choléra', 'Mpox', 'Méningite'];
  const SEV_COLORS = { Critique: '#ef4444', 'Élevé': '#f97316', Modéré: '#3b82f6' };
  const DISEASE_EMOJIS = { Paludisme: '🦟', Choléra: '💧', Mpox: '🔴', Méningite: '🧠' };

  useEffect(() => {
    fetch(`${API}/live-alerts`)
      .then(r => r.json())
      .then(gj => {
        const stats = { total: gj.features.length, totalCases: 0 };
        DISEASES.forEach(d => { stats[d] = { count: 0, cases: 0 }; });
        gj.features.forEach(f => {
          const d = f.properties.disease;
          const sev = f.properties.severity;
          const cases = f.properties.cases || 0;
          if (stats[d]) { stats[d].count++; stats[d].cases += cases; }
          stats.totalCases += cases;
          stats[`sev_${sev}`] = (stats[`sev_${sev}`] || 0) + 1;
        });
        setData(stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={widgetBox}>
      <div style={{ ...widgetTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
          background: '#ef4444', boxShadow: '0 0 6px #ef4444',
          animation: 'landing-pulse 1.5s infinite'
        }} />
        🦠 Foyers Actifs — Données de Surveillance Temps Réel
      </div>
      {loading ? <Loader /> : data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444' }}>{data.total}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Foyers signalés</div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f59e0b' }}>{data.totalCases.toLocaleString()}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Cas cumulés</div>
            </div>
          </div>
          {DISEASES.map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              <span style={{ fontSize: '16px' }}>{DISEASE_EMOJIS[d]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#cbd5e1' }}>
                  <span style={{ fontWeight: '600' }}>{d}</span>
                  <span style={{ color: '#94a3b8' }}>{(data[d] || {}).count || 0} foyers — {(data[d] || {}).cases || 0} cas</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${((data[d]?.count || 0) / data.total) * 100}%`, height: '100%', background: d === 'Paludisme' ? '#10b981' : d === 'Choléra' ? '#3b82f6' : d === 'Mpox' ? '#f97316' : '#8b5cf6', transition: 'width 1s' }} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            {['Critique', 'Élevé', 'Modéré'].map(s => (
              <span key={s} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: `${SEV_COLORS[s]}18`, color: SEV_COLORS[s], border: `1px solid ${SEV_COLORS[s]}30` }}>
                {s}: {data[`sev_${s}`] || 0}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI WIDGET : Outils Collaboratifs — couverture géographique des données
// ─────────────────────────────────────────────────────────────────────────────
function CollabWidget() {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const LAYER_DEFS = [
    { key: 'regions', label: 'Régions administratives', emoji: '🗺️', color: '#10b981' },
    { key: 'districts_sante', label: 'Districts de Santé', emoji: '📌', color: '#3b82f6' },
    { key: 'formations_sanitaires', label: 'Formations Sanitaires', emoji: '🏥', color: '#f59e0b' },
    { key: 'pharmacies', label: 'Pharmacies & Labos', emoji: '💊', color: '#8b5cf6' },
    { key: 'ecoles', label: 'Établissements scolaires', emoji: '🏫', color: '#f97316' },
  ];

  useEffect(() => {
    Promise.all(
      LAYER_DEFS.map(l =>
        fetch(`${API}/geojson/${l.key}`)
          .then(r => r.json())
          .then(gj => ({ ...l, count: gj.features?.length || 0 }))
          .catch(() => ({ ...l, count: 0 }))
      )
    ).then(results => {
      setLayers(results);
    }).finally(() => setLoading(false));
  }, []);

  const total = layers.reduce((s, l) => s + l.count, 0);
  const max = Math.max(...layers.map(l => l.count), 1);

  return (
    <div style={widgetBox}>
      <div style={widgetTitle}>🗂️ Couches annotables — {total.toLocaleString()} objets géographiques</div>
      {loading ? <Loader /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          {layers.map((l, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#cbd5e1' }}>
                <span>{l.emoji} {l.label}</span>
                <span style={{ color: l.color, fontWeight: 'bold' }}>{l.count.toLocaleString()}</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(l.count / max) * 100}%`, height: '100%', background: l.color, opacity: 0.8, transition: 'width 1.2s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '6px', padding: '8px', background: 'rgba(139,92,246,0.06)', borderRadius: '6px', fontSize: '11px', color: '#94a3b8', border: '1px solid rgba(139,92,246,0.1)' }}>
            ✏️ Chacune de ces couches peut être annotée, délimitée et exportée par vos équipes collaborateurs.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
const widgetBox = {
  marginTop: '20px', background: 'rgba(15,23,42,0.7)',
  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px',
};
const widgetTitle = {
  fontSize: '13px', fontWeight: '700', color: '#10b981', marginBottom: '12px',
};
const Loader = () => (
  <div style={{ color: '#64748b', fontSize: '12px', padding: '10px 0' }}>
    Chargement des données réelles…
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const SOLUTIONS = [
  {
    icon: '🔍',
    title: 'Géo-Marketing Prédictif',
    desc: "Notre algorithme spatial croise la densité de demande (écoles, marchés) et l'absence de concurrents dans un rayon de 5 km pour vous proposer les meilleurs emplacements d'implantation au Cameroun.",
    widget: <GeoMarketingWidget />,
    tag: 'Pharmacies & Cliniques',
    tagColor: '#10b981',
  },
  {
    icon: '🚚',
    title: 'Supply Chain & Itinéraires',
    desc: "Optimisez vos tournées de livraison médicale au départ de vos 4 hubs nationaux. Identifiez les zones difficiles à plus de 50 km pour planifier vos ressources logistiques.",
    widget: <RoutingWidget />,
    tag: 'Laborex · Ubipharm · CENAME',
    tagColor: '#f59e0b',
  },
  {
    icon: '📄',
    title: 'Audits de Territoire PDF',
    desc: "En un clic, compilez un rapport d'audit de territoire de 10 pages : cartographie HD, inventaire des FOSA, indice de densité, déserts médicaux et opportunités identifiées pour un district ou une région.",
    widget: <AuditWidget />,
    tag: 'ONG · Cabinets de Conseil · Bailleurs',
    tagColor: '#8b5cf6',
  },
  {
    icon: '🦠',
    title: 'Épidémiologie Live',
    desc: "Visualisez en temps réel la progression des foyers infectieux. Filtrez par maladie et niveau de sévérité pour orienter les équipes de réponse épidémique vers les zones prioritaires.",
    widget: <EpidemioWidget />,
    tag: 'OMS · UNICEF · Croix-Rouge',
    tagColor: '#ef4444',
  },
  {
    icon: '✏️',
    title: 'Workspace Collaboratif',
    desc: "Dessinez des zones d'intervention directement sur la carte, annotez les infrastructures avec votre équipe et exportez vos travaux au format JSON standard pour intégration dans vos SIG.",
    widget: <CollabWidget />,
    tag: 'Équipes Terrain · Planification',
    tagColor: '#3b82f6',
  },
];

export default function LandingPage({ onEnter, onLogin }) {
  const [showGdprModal, setShowGdprModal] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(null);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent_health_intel');
    if (consent) setCookieConsent(consent);

    // Inject pulse animation CSS
    if (!document.getElementById('landing-anim')) {
      const style = document.createElement('style');
      style.id = 'landing-anim';
      style.textContent = `
        @keyframes landing-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleCookieConsent = (type) => {
    localStorage.setItem('cookie_consent_health_intel', type);
    setCookieConsent(type);
  };

  return (
    <div style={{
      width: '100vw', minHeight: '100vh', background: '#0f172a', color: 'white',
      fontFamily: 'Inter, sans-serif', overflowX: 'hidden', position: 'relative'
    }}>

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 8%', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' }}>
            CAMEROON HEALTH <span style={{ color: '#10b981' }}>INTEL</span>
          </span>
        </div>
        <nav style={{ display: 'flex', gap: '30px', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>
          {['#solutions:Solutions B2B', '#tarifs:Grille Tarifaire', '#charte:Conformité RGPD'].map(item => {
            const [href, label] = item.split(':');
            return (
              <a key={href} href={href} style={{ textDecoration: 'none', color: 'inherit' }}
                onMouseOver={e => e.target.style.color = '#fff'}
                onMouseOut={e => e.target.style.color = '#94a3b8'}>
                {label}
              </a>
            );
          })}
        </nav>
        <button onClick={onLogin} style={{
          background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
          border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px',
          fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
        }}>
          Accéder au Portail
        </button>
      </header>

      {/* ── HERO ── */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: '100px 10% 80px 10%',
        background: 'radial-gradient(circle at top, rgba(16,185,129,0.18) 0%, transparent 60%)'
      }}>
        <span style={{
          background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)',
          padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', marginBottom: '25px',
          letterSpacing: '1px'
        }}>
          DONNÉES RÉELLES · DÉCISIONS SOUVERAINES
        </span>
        <h1 style={{
          fontSize: '52px', fontWeight: '800', lineHeight: '1.15', maxWidth: '850px', margin: '0 0 24px 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          La Plateforme Géo-Décisionnelle de Référence pour le Secteur Santé au Cameroun
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '650px', margin: '0 0 40px 0', lineHeight: '1.65' }}>
          6 157 formations sanitaires · 26 000 localités · 10 régions · Supply Chain, Épidémiologie et Géo-marketing en un seul outil souverain.
        </p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={onLogin} style={{
            background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
            border: 'none', padding: '15px 30px', borderRadius: '8px', fontSize: '15px',
            fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 22px rgba(16,185,129,0.4)'
          }}>
            Lancer le Portail Démo
          </button>
          <a href="#solutions" style={{
            background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
            padding: '15px 30px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold',
            cursor: 'pointer', textDecoration: 'none', display: 'inline-block'
          }}>
            Voir les Données Réelles →
          </a>
        </div>
      </section>

      {/* ── SOLUTIONS AVEC WIDGETS DONNÉES RÉELLES ── */}
      <section id="solutions" style={{ padding: '80px 8%', background: '#0b0f19' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 12px 0' }}>5 Solutions · 5 Preuves par les Données</h2>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Chaque panneau ci-dessous est alimenté en direct par nos pipelines spatiaux réels.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          {SOLUTIONS.map((sol, i) => (
            <div key={i} className="landing-card" style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              padding: '28px', borderRadius: '14px', transition: 'all 0.3s', display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{sol.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{sol.title}</h3>
                <span style={{
                  fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px',
                  background: `${sol.tagColor}18`, color: sol.tagColor, border: `1px solid ${sol.tagColor}30`
                }}>
                  {sol.tag}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.65', margin: 0, flex: 1 }}>{sol.desc}</p>
              {sol.widget}
              <button onClick={onLogin} style={{
                marginTop: '15px', width: '100%', padding: '9px', borderRadius: '7px',
                border: `1px solid ${sol.tagColor}30`, background: `${sol.tagColor}08`,
                color: sol.tagColor, cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = `${sol.tagColor}15`}
              onMouseOut={e => e.currentTarget.style.background = `${sol.tagColor}08`}
              >
                Explorer cette solution →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── TARIFS ── */}
      <section id="tarifs" style={{ padding: '80px 8%', background: '#0f172a' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Plans et Abonnements</h2>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>Une tarification claire conforme aux exigences de souveraineté des données.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
          {[
            {
              name: 'Consultation', price: 'Gratuit', cible: 'Exploration & visualisation',
              color: '#10b981', items: ['Régions, Districts & FOSA', 'Filtres avancés par type', 'Recherche de localités'],
              cta: 'Commencer', outline: true
            },
            {
              name: 'Professionnel', price: '99 000 FCFA/mois', cible: 'ONG · Directions de santé',
              color: '#10b981', items: ['Épidémiologie Live', 'Outils collaboratifs', 'Exports d\'annotations'],
              cta: 'Essai Gratuit', badge: 'SOCIÉTÉS / ONG', highlight: true
            },
            {
              name: 'B2B & Distribution', price: 'Sur Mesure', cible: 'Répartiteurs · Investisseurs',
              color: '#f59e0b', items: ['Score d\'implantation (géo-marketing)', 'Calcul d\'itinéraires Supply Chain', 'Rapports PDF 10 pages + SLA 24/7'],
              cta: 'Contacter les Ventes', outline: true
            }
          ].map((plan, i) => (
            <div key={i} style={{
              flex: '1 1 300px', maxWidth: '320px', background: '#0b0f19',
              border: plan.highlight ? `2px solid ${plan.color}` : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px', padding: '30px', position: 'relative',
              boxShadow: plan.highlight ? `0 10px 30px ${plan.color}18` : 'none'
            }}>
              {plan.badge && <span style={{
                position: 'absolute', top: '-12px', right: '20px', background: plan.color, color: 'white',
                fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '10px'
              }}>{plan.badge}</span>}
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: plan.color, margin: '0 0 8px 0' }}>{plan.name}</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>{plan.price}</div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '18px' }}>{plan.cible}</p>
              <ul style={{ paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.9', marginBottom: '25px' }}>
                {plan.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
              <button onClick={onLogin} style={{
                width: '100%', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                border: plan.outline ? `1px solid ${plan.color}` : 'none',
                background: plan.highlight ? `linear-gradient(135deg, ${plan.color}, #059669)` : 'transparent',
                color: plan.highlight ? 'white' : plan.color
              }}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── RGPD ── */}
      <section id="charte" style={{ padding: '80px 8%', background: '#0b0f19', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 20px 0' }}>🛡️ Charte de Protection des Données (RGPD & Souveraineté)</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>
            Conformité aux normes du <strong>RGPD</strong> et à la <strong>Loi camerounaise n° 2010/012</strong> sur la cybersécurité. Hébergement souverain. Aucune donnée nominative de patient traitée.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              { t: '1. Hébergement Souverain', c: 'Données hébergées au Cameroun. Infrastructure sous gouvernance nationale.' },
              { t: '2. Vie Privée', c: 'Aucune donnée nominative. Toutes les statistiques sont agrégées par localité ou district.' },
              { t: '3. Droit d\'Accès', c: 'Chaque utilisateur peut consulter, modifier ou supprimer ses annotations collaboratives.' },
              { t: '4. Conservation des Logs', c: 'Journaux de connexion conservés 6 mois pour sécurité, puis purgés automatiquement.' },
            ].map((item, i) => (
              <div key={i}>
                <h4 style={{ color: '#10b981', margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>{item.t}</h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>{item.c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '60px 8% 40px 8%', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#080d17', color: '#94a3b8', fontSize: '13px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '50px' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>Cameroon Health Intel</h4>
            <p style={{ lineHeight: '1.6', fontSize: '13px' }}>La plateforme géo-décisionnelle souveraine pour le secteur de la santé au Cameroun.</p>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Solutions B2B</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Géo-marketing Clinique', 'Supply Chain Logistique', 'Audits de Territoire PDF', 'Alerte Épidémies Live', 'Workspace Collaboratif'].map(s => (
                <li key={s}><a href="#solutions" style={{ color: 'inherit', textDecoration: 'none' }}>{s}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Mentions Légales & RGPD</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Politique de Confidentialité', 'Mentions Cyber-sécurité', 'Gestion des Cookies'].map(s => (
                <li key={s}><span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowGdprModal(true)}>{s}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Contact & Hubs</h4>
            <p style={{ lineHeight: '1.7', margin: 0 }}>
              contact@cameroon-health-intel.cm<br />
              <strong>Dépôt Central Yaoundé</strong> — Quartier Mvan<br />
              <strong>Dépôt Littoral Douala</strong> — Zone Bassa
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
          <span>© 2026 Cameroon Health Intelligence. Tous droits réservés.</span>
          <span>Dernière mise à jour : Juillet 2026</span>
        </div>
      </footer>

      {/* ── MODAL RGPD ── */}
      {showGdprModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200
        }} onClick={() => setShowGdprModal(false)}>
          <div style={{
            width: '100%', maxWidth: '560px', background: '#1e293b', border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '30px', color: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>🛡️ Politique de Protection des Données</h3>
              <button onClick={() => setShowGdprModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>Conformément au <strong>RGPD</strong> et à la <strong>Loi camerounaise n° 2010/012</strong> :</p>
              <p>• Aucune donnée nominative de patient n'est importée dans le SIG.</p>
              <p>• Hébergement souverain sur le territoire camerounais.</p>
              <p>• Droit d'accès, de rectification et de suppression garanti pour chaque utilisateur.</p>
              <p>• Logs de connexion conservés 6 mois à des fins de sécurité, puis purgés automatiquement.</p>
            </div>
            <button onClick={() => setShowGdprModal(false)} style={{
              marginTop: '20px', background: '#10b981', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
            }}>Fermer</button>
          </div>
        </div>
      )}

      {/* ── COOKIE CONSENT ── */}
      {!cookieConsent && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '20px', maxWidth: '480px',
          background: 'rgba(30,41,59,0.97)', backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 150
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '15px' }}>
            <span style={{ fontSize: '22px' }}>🍪</span>
            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}>
              <strong>Traceurs techniques uniquement</strong><br />
              Aucun cookie publicitaire tiers. Conformité RGPD complète.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => handleCookieConsent('refuse')} style={{
              background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
              padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
            }}>Refuser</button>
            <button onClick={() => handleCookieConsent('accept')} style={{
              background: '#10b981', color: 'white', border: 'none',
              padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
            }}>Accepter</button>
          </div>
        </div>
      )}
    </div>
  );
}
