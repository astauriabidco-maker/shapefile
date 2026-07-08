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
    <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${val}%`, height: '100%', background: color, transition: 'width 1s ease' }} />
    </div>
  );

  return (
    <div style={widgetBox}>
      <div style={widgetTitle}>Top 5 — Score d'Opportunité d'Implantation</div>
      {loading ? <Loader /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#475569' }}>
                <span style={{ fontWeight: '600', color: '#0F172A' }}>{r.nom}</span>
                <span>💊 {r.sc_pharma}/100 &nbsp;🏥 {r.sc_clinique}/100</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Bar val={r.sc_pharma} color="#059669" />
                <Bar val={r.sc_clinique} color="#0284C7" />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '11px', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#059669', borderRadius: '2px', display: 'inline-block' }} />Pharmacie</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#0284C7', borderRadius: '2px', display: 'inline-block' }} />Clinique</span>
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
      <div style={widgetTitle}>Couverture par Hub logistique — {hubs.reduce((s, h) => s + h.total, 0).toLocaleString()} FOSA</div>
      {loading ? <Loader /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hubs.map((h, i) => (
            <div key={i} style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#475569' }}>
                <span style={{ fontWeight: '600', color: '#0F172A' }}>{h.name.split('(')[0].trim()}</span>
                <span style={{ color: '#64748b' }}>{h.total} pts desservis</span>
              </div>
              <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: '#F1F5F9' }}>
                <div style={{ width: `${h.optPct}%`, background: '#059669' }} title={`Optimal: ${h.optPct}%`} />
                <div style={{ width: `${h.feaPct}%`, background: '#F59E0B' }} title={`Faisable: ${h.feaPct}%`} />
                <div style={{ width: `${h.difPct}%`, background: '#DC2626' }} title={`Difficile: ${h.difPct}%`} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '10px', color: '#64748b' }}>
                <span style={{ color: '#059669' }}>✓ {h.optPct}% opt.</span>
                <span style={{ color: '#D97706' }}>~ {h.feaPct}% faisable</span>
                <span style={{ color: '#DC2626' }}>✕ {h.difPct}% difficile</span>
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
      <div style={widgetTitle}>Rapport d'Audit — Données Réelles du Territoire</div>
      {loading ? <Loader /> : kpis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '6px', padding: '8px 12px', color: '#0284C7', fontWeight: 'bold' }}>
            Échantillon : {kpis.districtCount} Districts — Région {kpis.region}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <KpiBox label="Formations sanitaires" value={kpis.fosaCount.toLocaleString()} color="#0284C7" emoji="🏥" />
            <KpiBox label="Pharmacies & Labos" value={kpis.pharmaCount.toLocaleString()} color="#D97706" emoji="💊" />
            <KpiBox label="Déserts médicaux" value={kpis.zoneCount.toLocaleString()} color="#DC2626" emoji="⚠️" />
            <KpiBox label="Districts cartographiés" value={kpis.districtCount.toLocaleString()} color="#7C3AED" emoji="📍" />
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
    <div style={{ background: '#FFFFFF', border: `1px solid #E2E8F0`, borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color }}>{emoji} {value}</div>
      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{label}</div>
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
  const SEV_COLORS = { Critique: '#DC2626', 'Élevé': '#EA580C', Modéré: '#0284C7' };
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
          background: '#DC2626',
          animation: 'landing-pulse-light 1.5s infinite'
        }} />
        Foyers Actifs — Données de Surveillance Temps Réel
      </div>
      {loading ? <Loader /> : data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#DC2626' }}>{data.total}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Foyers signalés</div>
            </div>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#D97706' }}>{data.totalCases.toLocaleString()}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Cas cumulés</div>
            </div>
          </div>
          {DISEASES.map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '16px' }}>{DISEASE_EMOJIS[d]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#475569' }}>
                  <span style={{ fontWeight: '600', color: '#0F172A' }}>{d}</span>
                  <span style={{ color: '#64748b' }}>{(data[d] || {}).count || 0} foyers — {(data[d] || {}).cases || 0} cas</span>
                </div>
                <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${((data[d]?.count || 0) / data.total) * 100}%`, height: '100%', background: d === 'Paludisme' ? '#059669' : d === 'Choléra' ? '#0284C7' : d === 'Mpox' ? '#EA580C' : '#7C3AED', transition: 'width 1s' }} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            {['Critique', 'Élevé', 'Modéré'].map(s => (
              <span key={s} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${SEV_COLORS[s]}10`, color: SEV_COLORS[s], border: `1px solid ${SEV_COLORS[s]}30`, fontWeight: '600' }}>
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
    { key: 'regions', label: 'Régions administratives', emoji: '🗺️', color: '#059669' },
    { key: 'districts_sante', label: 'Districts de Santé', emoji: '📌', color: '#0284C7' },
    { key: 'formations_sanitaires', label: 'Formations Sanitaires', emoji: '🏥', color: '#D97706' },
    { key: 'pharmacies', label: 'Pharmacies & Labos', emoji: '💊', color: '#7C3AED' },
    { key: 'ecoles', label: 'Établissements scolaires', emoji: '🏫', color: '#EA580C' },
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
      <div style={widgetTitle}>Couches annotables — {total.toLocaleString()} objets géographiques</div>
      {loading ? <Loader /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          {layers.map((l, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#475569' }}>
                <span>{l.emoji} {l.label}</span>
                <span style={{ color: l.color, fontWeight: 'bold' }}>{l.count.toLocaleString()}</span>
              </div>
              <div style={{ height: '5px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(l.count / max) * 100}%`, height: '100%', background: l.color, opacity: 0.8, transition: 'width 1.2s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '6px', padding: '8px', background: '#F8FAFC', borderRadius: '6px', fontSize: '11px', color: '#475569', border: '1px solid #E2E8F0' }}>
            Chacune de ces couches peut être annotée, délimitée et exportée par vos équipes collaborateurs.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
const widgetBox = {
  marginTop: '20px', 
  background: '#FFFFFF',
  border: '1px solid #E2E8F0', 
  borderRadius: '8px', 
  padding: '20px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
};
const widgetTitle = {
  fontSize: '14px', fontWeight: '700', color: '#1E3A8A', marginBottom: '16px',
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
    desc: "Notre algorithme spatial croise la densité de demande et l'absence de concurrents pour vous proposer les meilleurs emplacements d'implantation au Cameroun.",
    widget: <GeoMarketingWidget />,
    tag: 'Pharmacies & Cliniques',
    tagColor: '#059669',
  },
  {
    icon: '🚚',
    title: 'Supply Chain & Itinéraires',
    desc: "Optimisez vos tournées de livraison médicale au départ de vos hubs nationaux. Identifiez les zones difficiles pour planifier vos ressources logistiques.",
    widget: <RoutingWidget />,
    tag: 'Laborex · Ubipharm · CENAME',
    tagColor: '#D97706',
  },
  {
    icon: '📄',
    title: 'Audits de Territoire PDF',
    desc: "En un clic, compilez un rapport d'audit de territoire de 10 pages : cartographie HD, inventaire des FOSA, indice de densité et déserts médicaux.",
    widget: <AuditWidget />,
    tag: 'ONG · Cabinets de Conseil · Bailleurs',
    tagColor: '#7C3AED',
  },
  {
    icon: '🦠',
    title: 'Épidémiologie Live',
    desc: "Visualisez en temps réel la progression des foyers infectieux. Filtrez par maladie et niveau de sévérité pour orienter les équipes de réponse.",
    widget: <EpidemioWidget />,
    tag: 'OMS · UNICEF · Croix-Rouge',
    tagColor: '#DC2626',
  },
  {
    icon: '✏️',
    title: 'Workspace Collaboratif',
    desc: "Dessinez des zones d'intervention directement sur la carte, annotez les infrastructures et exportez vos travaux au format JSON standard pour vos SIG.",
    widget: <CollabWidget />,
    tag: 'Équipes Terrain · Planification',
    tagColor: '#0284C7',
  },
];

export default function LandingPage({ onEnter, onLogin }) {
  const [showGdprModal, setShowGdprModal] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(null);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent_health_intel');
    if (consent) setCookieConsent(consent);

    if (!document.getElementById('landing-anim-light')) {
      const style = document.createElement('style');
      style.id = 'landing-anim-light';
      style.textContent = `
        @keyframes landing-pulse-light {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
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
      width: '100vw', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A',
      fontFamily: 'Inter, sans-serif', overflowX: 'hidden', position: 'relative'
    }}>

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 8%', borderBottom: '1px solid #E2E8F0',
        background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>C</span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', color: '#1E3A8A' }}>
            CAMEROON HEALTH INTEL
          </span>
        </div>
        <nav style={{ display: 'flex', gap: '30px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
          {['#solutions:Solutions B2B', '#tarifs:Grille Tarifaire', '#charte:Conformité RGPD'].map(item => {
            const [href, label] = item.split(':');
            return (
              <a key={href} href={href} style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}
                onMouseOver={e => e.target.style.color = '#1E3A8A'}
                onMouseOut={e => e.target.style.color = '#475569'}>
                {label}
              </a>
            );
          })}
        </nav>
        <button onClick={onLogin} style={{
          background: '#0284C7', color: 'white',
          border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '14px',
          fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s'
        }}
        onMouseOver={e => e.target.style.background = '#0369A1'}
        onMouseOut={e => e.target.style.background = '#0284C7'}>
          Accéder au Portail
        </button>
      </header>

      {/* ── HERO ── */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: '100px 10% 80px 10%', background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0'
      }}>
        <span style={{
          background: '#EFF6FF', color: '#1E3A8A', border: '1px solid #BFDBFE',
          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '30px',
          letterSpacing: '0.5px'
        }}>
          DONNÉES RÉELLES · DÉCISIONS SOUVERAINES
        </span>
        <h1 style={{
          fontSize: '48px', fontWeight: '800', lineHeight: '1.2', maxWidth: '850px', margin: '0 0 24px 0',
          color: '#0F172A'
        }}>
          La Plateforme Géo-Décisionnelle de Référence pour le Secteur Santé au Cameroun
        </h1>
        <p style={{ fontSize: '18px', color: '#475569', maxWidth: '700px', margin: '0 0 40px 0', lineHeight: '1.6' }}>
          6 157 formations sanitaires · 26 000 localités · 10 régions.<br />
          L'outil institutionnel complet pour la Supply Chain, l'Épidémiologie et le Géo-marketing de la santé.
        </p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={onLogin} style={{
            background: '#1E3A8A', color: 'white',
            border: 'none', padding: '14px 28px', borderRadius: '6px', fontSize: '15px',
            fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s'
          }}
          onMouseOver={e => e.target.style.background = '#172554'}
          onMouseOut={e => e.target.style.background = '#1E3A8A'}>
            Lancer le Portail Démo
          </button>
          <a href="#solutions" style={{
            background: '#FFFFFF', color: '#1E3A8A', border: '1px solid #CBD5E1',
            padding: '14px 28px', borderRadius: '6px', fontSize: '15px', fontWeight: '600',
            cursor: 'pointer', textDecoration: 'none', display: 'inline-block', transition: 'background 0.2s'
          }}
          onMouseOver={e => e.target.style.background = '#F8FAFC'}
          onMouseOut={e => e.target.style.background = '#FFFFFF'}>
            Voir les Données Réelles →
          </a>
        </div>
      </section>

      {/* ── SOLUTIONS ── */}
      <section id="solutions" style={{ padding: '80px 8%' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0', color: '#1E3A8A' }}>5 Solutions · 5 Preuves par les Données</h2>
          <p style={{ color: '#475569', fontSize: '16px' }}>
            Chaque composant ci-dessous est alimenté en direct par nos pipelines de données réelles.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          {SOLUTIONS.map((sol, i) => (
            <div key={i} style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0',
              padding: '30px', borderRadius: '12px', display: 'flex', flexDirection: 'column',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>{sol.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#0F172A' }}>{sol.title}</h3>
              </div>
              <span style={{
                display: 'inline-block', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '4px',
                background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', marginBottom: '16px', alignSelf: 'flex-start'
              }}>
                Cible : {sol.tag}
              </span>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px 0', flex: 1 }}>{sol.desc}</p>
              {sol.widget}
              <button onClick={onLogin} style={{
                marginTop: '20px', width: '100%', padding: '12px', borderRadius: '6px',
                border: `1px solid ${sol.tagColor}`, background: '#FFFFFF',
                color: sol.tagColor, cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.background = sol.tagColor; e.currentTarget.style.color = '#FFF'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = sol.tagColor; }}
              >
                Explorer cette solution →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── TARIFS ── */}
      <section id="tarifs" style={{ padding: '80px 8%', background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0', color: '#1E3A8A' }}>Licences et Abonnements</h2>
          <p style={{ color: '#475569', fontSize: '16px' }}>Une tarification claire conforme aux exigences de souveraineté des données.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
          {[
            {
              name: 'Consultation', price: 'Gratuit', cible: 'Exploration & visualisation',
              color: '#64748B', items: ['Régions, Districts & FOSA', 'Filtres avancés par type', 'Recherche de localités'],
              cta: 'Commencer', outline: true
            },
            {
              name: 'Professionnel', price: '99 000 FCFA/mois', cible: 'ONG · Directions de santé',
              color: '#0284C7', items: ['Épidémiologie Live', 'Outils collaboratifs', 'Exports d\'annotations'],
              cta: 'Essai Gratuit', badge: 'STANDARD', highlight: true
            },
            {
              name: 'Institutionnel & B2B', price: 'Sur Mesure', cible: 'Répartiteurs · Investisseurs · Ministères',
              color: '#1E3A8A', items: ['Score d\'implantation (géo-marketing)', 'Calcul d\'itinéraires Supply Chain', 'Rapports PDF 10 pages + SLA 24/7'],
              cta: 'Contacter l\'Équipe', outline: false, solid: true
            }
          ].map((plan, i) => (
            <div key={i} style={{
              flex: '1 1 300px', maxWidth: '320px', background: '#FFFFFF',
              border: plan.highlight || plan.solid ? `2px solid ${plan.color}` : '1px solid #E2E8F0',
              borderRadius: '8px', padding: '30px', position: 'relative',
              boxShadow: plan.highlight || plan.solid ? `0 10px 25px rgba(0,0,0,0.05)` : 'none'
            }}>
              {plan.badge && <span style={{
                position: 'absolute', top: '-12px', right: '20px', background: plan.color, color: 'white',
                fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '4px'
              }}>{plan.badge}</span>}
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: plan.color, margin: '0 0 8px 0' }}>{plan.name}</h3>
              <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px', color: '#0F172A' }}>{plan.price}</div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>{plan.cible}</p>
              <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#475569', lineHeight: '1.8', marginBottom: '30px' }}>
                {plan.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
              <button onClick={onLogin} style={{
                width: '100%', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
                border: plan.outline ? `1px solid ${plan.color}` : 'none',
                background: plan.highlight || plan.solid ? plan.color : 'transparent',
                color: plan.highlight || plan.solid ? 'white' : plan.color,
                transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >{plan.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── RGPD ── */}
      <section id="charte" style={{ padding: '80px 8%', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 20px 0', color: '#1E3A8A' }}>Politique de Souveraineté & Données</h2>
          <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', marginBottom: '30px' }}>
            La plateforme est développée dans le strict respect des normes du <strong>RGPD</strong> européen et de la <strong>Loi camerounaise n° 2010/012</strong> relative à la cybersécurité et la cybercriminalité.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
            {[
              { t: '1. Hébergement Souverain', c: 'Infrastructures d\'hébergement localisées sur le territoire national. Garantie de souveraineté des données sanitaires.' },
              { t: '2. Anonymisation Stricte', c: 'Aucune donnée patient nominative n\'est collectée ni traitée. Les agrégats sont statistiques et géographiques exclusivement.' },
              { t: '3. Traçabilité & Audits', c: 'Traçabilité complète des accès B2B. Journaux de connexion conservés 6 mois à des fins de sécurité informatique.' },
              { t: '4. Interopérabilité Standardisée', c: 'Exports au format GeoJSON standard ouvert, facilitant l\'intégration avec les Systèmes d\'Information Sanitaire existants (DHIS2).' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ color: '#0F172A', margin: '0 0 10px 0', fontSize: '15px', fontWeight: '700' }}>{item.t}</h4>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>{item.c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '60px 8% 40px 8%', background: '#0F172A', color: '#94A3B8', fontSize: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '50px', marginBottom: '50px' }}>
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Cameroon Health Intel</h4>
            <p style={{ lineHeight: '1.6', fontSize: '14px' }}>Système d'Information Géographique Souverain d'aide à la décision pour le secteur de la santé au Cameroun.</p>
          </div>
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Solutions Institutionnelles</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Géo-marketing Clinique', 'Supply Chain Logistique', 'Audits de Territoire PDF', 'Alerte Épidémies Live', 'Workspace Collaboratif'].map(s => (
                <li key={s}><a href="#solutions" style={{ color: 'inherit', textDecoration: 'none' }}>{s}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Conformité Légale</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Politique de Confidentialité', 'Mentions Cyber-sécurité', 'Gestion des Cookies'].map(s => (
                <li key={s}><span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowGdprModal(true)}>{s}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Direction & Opérations</h4>
            <p style={{ lineHeight: '1.7', margin: 0 }}>
              contact@cameroon-health-intel.cm<br /><br />
              <strong>Bureau Central</strong> — Yaoundé, Cameroun<br />
              <strong>Département SIG</strong> — Douala
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}>
          <span>© 2026 Cameroon Health Intelligence. Tous droits réservés.</span>
          <span>Version 2.4 — Déploiement Sécurisé</span>
        </div>
      </footer>

      {/* ── MODAL RGPD ── */}
      {showGdprModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200
        }} onClick={() => setShowGdprModal(false)}>
          <div style={{
            width: '100%', maxWidth: '600px', background: '#FFFFFF', border: '1px solid #E2E8F0',
            borderRadius: '12px', padding: '32px', color: '#0F172A', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#1E3A8A' }}>Politique de Traitement des Données</h3>
              <button onClick={() => setShowGdprModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#475569', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p>Conformément au <strong>RGPD européen</strong> et à la <strong>Loi n° 2010/012 du Cameroun</strong> :</p>
              <p>• Les requêtes cartographiques sont anonymisées et ne comportent aucune Information Médicale Personnelle (IMP).</p>
              <p>• L'infrastructure matérielle est hébergée sur le territoire de la République du Cameroun pour assurer la souveraineté complète.</p>
              <p>• Vous disposez d'un droit inaliénable d'accès, de rectification et de suppression des données collaboratives liées à votre structure.</p>
              <p>• Les journaux d'accès techniques sont conservés de manière chiffrée pendant une durée stricte de 6 mois pour des audits de sécurité.</p>
            </div>
            <button onClick={() => setShowGdprModal(false)} style={{
              marginTop: '24px', background: '#1E3A8A', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer',
              width: '100%'
            }}>Fermer le document</button>
          </div>
        </div>
      )}

      {/* ── COOKIE CONSENT ── */}
      {!cookieConsent && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '24px', maxWidth: '450px',
          background: '#FFFFFF', border: '1px solid #E2E8F0',
          borderRadius: '8px', padding: '20px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', zIndex: 150
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#475569' }}>
              <strong style={{ color: '#0F172A' }}>Cookies techniques sécurisés</strong><br />
              L'application utilise uniquement des cookies de session pour maintenir la connexion sécurisée. Aucun traçage publicitaire n'est effectué.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => handleCookieConsent('refuse')} style={{
              background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0',
              padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
            }}>Refuser l'accès</button>
            <button onClick={() => handleCookieConsent('accept')} style={{
              background: '#0284C7', color: 'white', border: 'none',
              padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
            }}>Accepter & Continuer</button>
          </div>
        </div>
      )}
    </div>
  );
}
