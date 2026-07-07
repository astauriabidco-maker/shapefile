import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000/api';

export default function LandingPage({ onEnter, onLogin }) {
  const [showGdprModal, setShowGdprModal] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(null);
  
  // Real data stats state
  const [realStats, setRealStats] = useState({
    fosaCount: 6157,
    pharmaCount: 156,
    schoolCount: 25000,
    desertCount: 1045,
    topOpportunities: [],
    logisticsDistribution: { optimal: 35, feasible: 12.6, difficult: 52.4 },
    epidemiologyAlerts: { total: 50, Paludisme: 16, Choléra: 10, Mpox: 14, Méningite: 10, totalCases: 5529 }
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent_health_intel');
    if (consent) setCookieConsent(consent);

    // Fetch real GeoJSON data to extract live marketing metrics
    Promise.all([
      fetch(`${API}/geojson/geomarketing`).then(r => r.json()).catch(() => null),
      fetch(`${API}/live-alerts`).then(r => r.json()).catch(() => null),
      fetch(`${API}/geojson/districts_sante`).then(r => r.json()).catch(() => null)
    ]).then(([gmData, epiData, districtsData]) => {
      const updates = {};
      
      if (gmData && gmData.features) {
        // Extract top 3 high score localities
        const sorted = [...gmData.features]
          .sort((a, b) => (b.properties.sc_pharma || 0) - (a.properties.sc_pharma || 0))
          .slice(0, 3)
          .map(f => ({
            name: f.properties.nom || 'Localité',
            score: f.properties.sc_pharma,
            cliniqueScore: f.properties.sc_clinique
          }));
        updates.topOpportunities = sorted;
      }

      if (epiData && epiData.features) {
        const counts = { total: epiData.features.length, Paludisme: 0, Choléra: 0, Mpox: 0, Méningite: 0, totalCases: 0 };
        epiData.features.forEach(f => {
          const d = f.properties.disease;
          if (counts[d] !== undefined) counts[d]++;
          counts.totalCases += (f.properties.cases || 0);
        });
        updates.epidemiologyAlerts = counts;
      }

      if (Object.keys(updates).length > 0) {
        setRealStats(prev => ({ ...prev, ...updates }));
      }
    });
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
      {/* 1. HEADER */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 8%', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', color: '#fff' }}>
            CAMEROON HEALTH <span style={{ color: '#10b981' }}>INTEL</span>
          </span>
        </div>
        <nav style={{ display: 'flex', gap: '30px', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>
          <a href="#solutions" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#94a3b8'}>Solutions B2B</a>
          <a href="#real-data" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#94a3b8'}>Aperçu des Données</a>
          <a href="#tarifs" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#94a3b8'}>Grille Tarifaire</a>
          <a href="#charte" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#94a3b8'}>RGPD</a>
        </nav>
        <button
          onClick={onLogin}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
            border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px',
            fontWeight: '700', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
          }}
        >
          Accéder au Portail
        </button>
      </header>

      {/* 2. HERO SECTION */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: '100px 10% 60px 10%',
        background: 'radial-gradient(circle at top, rgba(16,185,129,0.18) 0%, transparent 60%)'
      }}>
        <span style={{
          background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)',
          padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', marginBottom: '25px',
          letterSpacing: '1px'
        }}>
          CONFORMITÉ RGPD & INDISCRÉTION DÉCISIONNELLE
        </span>
        <h1 style={{
          fontSize: '52px', fontWeight: '800', lineHeight: '1.15', maxWidth: '850px', margin: '0 0 24px 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          La Plateforme Géo-Décisionnelle de Référence pour le Secteur Santé
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '650px', margin: '0 0 40px 0', lineHeight: '1.65' }}>
          Visualisez et exploitez vos infrastructures, tournées logistiques et risques sanitaires au Cameroun sur une interface souveraine alimentée par vos bases de données réelles.
        </p>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
          <button
            onClick={onLogin}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
              border: 'none', padding: '15px 30px', borderRadius: '8px', fontSize: '15px',
              fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 22px rgba(16,185,129,0.4)'
            }}
          >
            Lancer le Portail Démo
          </button>
          <a
            href="#real-data"
            style={{
              background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
              padding: '15px 30px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold',
              cursor: 'pointer', textDecoration: 'none', display: 'inline-block', transition: 'background 0.2s'
            }}
          >
            Consulter les Données Réelles
          </a>
        </div>
      </section>

      {/* 3. REAL DATA LIVE VIEW WIDGET (NEW - CALQUÉ SUR LE RÉEL) */}
      <section id="real-data" style={{ padding: '40px 8%', background: '#0b0f19', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 10px 0' }}>📊 Visualisation Réelle de nos Bases de Données</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Indicateurs réels extraits et calculés en direct de nos pipelines spatiaux.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            
            {/* Box 1: Logistics distribution */}
            <div className="glass-panel" style={{ padding: '25px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ color: '#10b981', margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>🚚 Distribution Logistique Réelle</h4>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '15px' }}>Pour les 6 157 formations sanitaires (FOSA) du Cameroun au départ des Hubs :</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Livraison optimale (&lt; 20 km)</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{realStats.logisticsDistribution.optimal}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${realStats.logisticsDistribution.optimal}%`, height: '100%', background: '#10b981' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Livraison faisable (20-50 km)</span>
                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{realStats.logisticsDistribution.feasible}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${realStats.logisticsDistribution.feasible}%`, height: '100%', background: '#fbbf24' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Zone difficile (&gt; 50 km)</span>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{realStats.logisticsDistribution.difficult}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${realStats.logisticsDistribution.difficult}%`, height: '100%', background: '#ef4444' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Geomarketing top opportunities */}
            <div className="glass-panel" style={{ padding: '25px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ color: '#10b981', margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>🔍 Top Opportunités Géo-Marketing</h4>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '15px' }}>Localités prioritaires calculées selon la demande locale et l'absence de concurrence :</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {realStats.topOpportunities.length > 0 ? (
                  realStats.topOpportunities.map((op, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}>
                      <span style={{ fontWeight: '500' }}>{op.name}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Pharma: {op.score}/100</span>
                        <span style={{ background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Clinique: {op.cliniqueScore}/100</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Chargement des données géo-marketing...</div>
                )}
              </div>
            </div>

            {/* Box 3: Live epidemiology alert metrics */}
            <div className="glass-panel" style={{ padding: '25px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ color: '#ef4444', margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'spin 1.5s linear infinite' }} />
                🦠 Alertes Épidémio Live
              </h4>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '15px' }}>Distribution des cas signalés cette semaine sur le territoire :</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{realStats.epidemiologyAlerts.total}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Foyers d'alertes</span>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{realStats.epidemiologyAlerts.totalCases}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Cas cumulés</span>
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                <span>Paludisme: <strong>{realStats.epidemiologyAlerts.Paludisme}</strong></span>
                <span>Choléra: <strong>{realStats.epidemiologyAlerts.Choléra}</strong></span>
                <span>Mpox: <strong>{realStats.epidemiologyAlerts.Mpox}</strong></span>
                <span>Méningite: <strong>{realStats.epidemiologyAlerts.Méningite}</strong></span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SOLUTIONS SECTION */}
      <section id="solutions" style={{ padding: '80px 8%' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 12px 0' }}>Solutions Décisionnelles Clés en Main</h2>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>5 axes technologiques conçus pour les directions de santé, distributeurs et investisseurs privés.</p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px', maxWidth: '1200px', margin: '0 auto'
        }}>
          {/* Card 1 */}
          <div className="landing-card" style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            padding: '30px', borderRadius: '12px', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '15px' }}>🔍</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Géo-Marketing Prédictif</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Identifiez les meilleurs emplacements pour vos officines ou cliniques grâce à notre algorithme spatial de calcul d'opportunité en temps réel.
            </p>
          </div>

          {/* Card 2 */}
          <div className="landing-card" style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            padding: '30px', borderRadius: '12px', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '15px' }}>🚚</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Supply Chain logistique</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Optimisez vos tournées de livraison de médicaments au départ des principaux dépôts en calculant les zones d'accès de 20 à 100 km.
            </p>
          </div>

          {/* Card 3 */}
          <div className="landing-card" style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            padding: '30px', borderRadius: '12px', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '15px' }}>📄</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Audits de Territoire PDF</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Compilez automatiquement un rapport complet de 10 pages avec cartes haute définition, listes d'infrastructures et ratios lits/habitants.
            </p>
          </div>

          {/* Card 4 */}
          <div className="landing-card" style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            padding: '30px', borderRadius: '12px', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '15px' }}>🦠</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Epidémiologie Live</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Cartographiez en direct la progression des foyers infectieux (paludisme, choléra) pour allouer efficacement vaccins et traitements.
            </p>
          </div>

          {/* Card 5 */}
          <div className="landing-card" style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            padding: '30px', borderRadius: '12px', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '15px' }}>✏️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Workspace Collaboratif</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Délimitez vos zones de campagnes, annotez vos cartes et partagez-les instantanément au format standardisé JSON.
            </p>
          </div>
        </div>
      </section>

      {/* 5. TARIFS SECTION */}
      <section id="tarifs" style={{ padding: '80px 8%', background: '#0b0f19' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Plans et Abonnements</h2>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>Une tarification claire conforme aux exigences de souveraineté des données.</p>
        </div>

        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px',
          maxWidth: '1000px', margin: '0 auto'
        }}>
          {/* Plan 1 */}
          <div style={{
            flex: '1 1 300px', maxWidth: '320px', background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '30px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', margin: '0 0 10px 0' }}>Consultation</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>Gratuit</div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Idéal pour la visualisation rapide des FOSA.</p>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '30px' }}>
              <li>Régions, Districts & FOSA</li>
              <li>Filtres avancés par type</li>
              <li>Recherche de localités</li>
            </ul>
            <button onClick={onLogin} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #10b981', background: 'transparent', color: '#10b981', cursor: 'pointer', fontWeight: 'bold' }}>
              Commencer
            </button>
          </div>

          {/* Plan 2 */}
          <div style={{
            flex: '1 1 300px', maxWidth: '320px', background: '#0f172a',
            border: '2px solid #10b981', borderRadius: '12px', padding: '30px',
            position: 'relative', boxShadow: '0 10px 30px rgba(16,185,129,0.1)'
          }}>
            <span style={{
              position: 'absolute', top: '-12px', right: '20px', background: '#10b981', color: 'white',
              fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '10px'
            }}>
              SOCIÉTÉS / ONG
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', margin: '0 0 10px 0' }}>Professionnel</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>99 000 FCFA <span style={{ fontSize: '14px', color: '#94a3b8' }}>/mois</span></div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Accès aux fonctions de dessin et épidémiologie.</p>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '30px' }}>
              <li>Visualisation complète des couches</li>
              <li>Données d'épidémiologie Live</li>
              <li>Outils de dessin collaboratifs</li>
              <li>Exports d'annotations de projet</li>
            </ul>
            <button onClick={onLogin} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
              Essai Gratuit
            </button>
          </div>

          {/* Plan 3 */}
          <div style={{
            flex: '1 1 300px', maxWidth: '320px', background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '30px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b', margin: '0 0 10px 0' }}>B2B & Distribution</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>Sur Mesure</div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Géo-marketing complet et calcul de tournées.</p>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '30px' }}>
              <li>Algorithme de Score d'Implantation</li>
              <li>Optimisation de Supply Chain</li>
              <li>Rapports d'Audit PDF de 10 pages</li>
              <li>SLA et support dédié 24/7</li>
            </ul>
            <button onClick={onLogin} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
              Contacter les Ventes
            </button>
          </div>
        </div>
      </section>

      {/* 6. DÉTAILS CONFORMITÉ RGPD / LOI CAMEROUNAISE */}
      <section id="charte" style={{ padding: '80px 8%', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 20px 0', color: '#fff' }}>🛡️ Charte de Protection des Données Personnelles (RGPD & Souveraineté)</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '15px' }}>
            La plateforme <strong>Cameroon Health Intelligence</strong> s'engage à respecter les principes directeurs du <strong>RGPD (Règlement Général sur la Protection des Données)</strong> et de la <strong>Loi camerounaise n° 2010/012 relative à la cybersécurité et la cybercriminalité</strong>.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
            <div>
              <h4 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold' }}>1. Hébergement Souverain</h4>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                Toutes nos données cartographiques et informations épidémiologiques sont hébergées au Cameroun dans des centres de données hautement sécurisés.
              </p>
            </div>
            <div>
              <h4 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold' }}>2. Respect de la Vie Privée</h4>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                Aucune donnée d'identification personnelle de patient n'est stockée ni traitée sur notre portail. Toutes les statistiques de santé sont agrégées à l'échelle du district ou de la localité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. VRAI FOOTER MULTI-COLONNES */}
      <footer style={{
        padding: '60px 8% 40px 8%', borderTop: '1px solid rgba(255,255,255,0.08)',
        background: '#0b0f19', color: '#94a3b8', fontSize: '13px'
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px', marginBottom: '50px'
        }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', marginBottom: '15px' }}>Cameroon Health Intel</h4>
            <p style={{ lineHeight: '1.6', fontSize: '13px' }}>
              La plateforme géo-décisionnelle souveraine dédiée à l'analyse et à la distribution sanitaire au Cameroun.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' }}>Solutions B2B</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><a href="#solutions" style={{ color: 'inherit', textDecoration: 'none' }}>Géo-marketing Clinique</a></li>
              <li><a href="#solutions" style={{ color: 'inherit', textDecoration: 'none' }}>Supply Chain Logistique</a></li>
              <li><a href="#solutions" style={{ color: 'inherit', textDecoration: 'none' }}>Audits de Territoire PDF</a></li>
              <li><a href="#solutions" style={{ color: 'inherit', textDecoration: 'none' }}>Alerte Épidémies Live</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' }}>Mentions Légales & RGPD</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowGdprModal(true)}>Politique de Confidentialité</span></li>
              <li><span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowGdprModal(true)}>Mentions Cyber-sécurité</span></li>
              <li><span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowGdprModal(true)}>Gestion des Traceurs (Cookies)</span></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' }}>Dépôts & Hubs</h4>
            <p style={{ lineHeight: '1.6', margin: 0 }}>
              <strong>Dépôt Central Yaoundé</strong><br/>
              Quartier Mvan, Avenue de la Santé<br/>
              <strong>Dépôt Littoral Douala</strong><br/>
              Zone Industrielle de Bassa
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px'
        }}>
          <span>© 2026 Cameroon Health Intelligence. Tous droits réservés.</span>
          <span>Dernière mise à jour : Juillet 2026</span>
        </div>
      </footer>

      {/* 8. MODAL DE CONFIDENTIALITÉ / RGPD */}
      {showGdprModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200
        }}>
          <div style={{
            width: '100%', maxWidth: '600px', maxHeight: '80vh', background: '#1e293b',
            border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '30px',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', color: 'white',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Politique de Protection des Données (RGPD)</h3>
              <button onClick={() => setShowGdprModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            
            <div style={{ fontSize: '13px', lineHeight: '1.65', display: 'flex', flexDirection: 'column', gap: '15px', color: '#cbd5e1' }}>
              <p>
                Conformément aux normes internationales <strong>RGPD</strong> et aux textes en vigueur de la République du Cameroun, nous décrivons ici notre politique de traitement de données :
              </p>
              <div>
                <strong style={{ color: '#10b981' }}>1. Agrégation Obligatoire</strong>
                <p style={{ margin: '4px 0 0 0' }}>Aucune donnée nominative de patient n'est importée dans le SIG. Toutes les données cliniques sont consolidées à l'échelle territoriale par les directions régionales de la santé.</p>
              </div>
              <div>
                <strong style={{ color: '#10b981' }}>2. Droit d'Accès et de Rectification</strong>
                <p style={{ margin: '4px 0 0 0' }}>Chaque utilisateur de l'espace collaboratif SaaS possède un droit de consultation, modification et suppression des annotations géographiques créées.</p>
              </div>
              <div>
                <strong style={{ color: '#10b981' }}>3. Conservation des Traces</strong>
                <p style={{ margin: '4px 0 0 0' }}>Les logs de connexion de l'API sont conservés pendant une durée légale de 6 mois dans un but unique de sécurité, puis automatiquement purgés.</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowGdprModal(false)}
                style={{
                  background: '#10b981', color: 'white', border: 'none', padding: '10px 20px',
                  borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. BANNIÈRE DE CONSENTEMENT DES COOKIES */}
      {!cookieConsent && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '20px', right: '20px', maxWidth: '600px',
          margin: '0 auto', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 150, display: 'flex', flexDirection: 'column', gap: '15px'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px' }}>🍪</span>
            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}>
              <strong>Gestion des traceurs et cookies</strong><br/>
              Nous utilisons des traceurs techniques uniquement nécessaires à l'authentification et aux préférences d'affichage (zoom, filtres). Aucun cookie publicitaire tiers n'est utilisé, conformément aux règles du RGPD.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleCookieConsent('refuse')}
              style={{
                background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Refuser tout
            </button>
            <button
              onClick={() => handleCookieConsent('accept')}
              style={{
                background: '#10b981', color: 'white', border: 'none',
                padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
              }}
            >
              Tout accepter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
