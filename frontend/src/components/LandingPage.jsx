import React from 'react';

export default function LandingPage({ onEnter, onLogin }) {
  return (
    <div style={{
      width: '100vw', minHeight: '100vh', background: '#0f172a', color: 'white',
      fontFamily: 'Inter, sans-serif', overflowX: 'hidden'
    }}>
      {/* 1. HEADER */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 8%', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>🇨🇲 Cameroon Health Intel</span>
        </div>
        <nav style={{ display: 'flex', gap: '30px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>
          <a href="#solutions" style={{ textDecoration: 'none', color: 'inherit' }}>Solutions B2B</a>
          <a href="#tarifs" style={{ textDecoration: 'none', color: 'inherit' }}>Tarifs</a>
          <a href="#apropos" style={{ textDecoration: 'none', color: 'inherit' }}>À propos</a>
        </nav>
        <button
          onClick={onLogin}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
            border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '14px',
            fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
          }}
        >
          Accéder au Portail
        </button>
      </header>

      {/* 2. HERO SECTION */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: '100px 10% 80px 10%',
        background: 'radial-gradient(circle at top, rgba(16,185,129,0.15) 0%, transparent 60%)'
      }}>
        <span style={{
          background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)',
          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '20px'
        }}>
          VERSION 2.0 (PORTAIL B2B SAAS)
        </span>
        <h1 style={{
          fontSize: '48px', fontWeight: '800', lineHeight: '1.2', maxWidth: '800px', margin: '0 0 20px 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Pilotez la santé publique et vos implantations commerciales au Cameroun
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '600px', margin: '0 0 35px 0', lineHeight: '1.6' }}>
          La plateforme géo-décisionnelle de référence pour croiser structures sanitaires, logistique, épidémiologie et opportunités de marché.
        </p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={onLogin}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
              border: 'none', padding: '14px 28px', borderRadius: '8px', fontSize: '16px',
              fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 20px rgba(16,185,129,0.3)'
            }}
          >
            Lancer la Démo
          </button>
          <a
            href="#solutions"
            style={{
              background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
              padding: '14px 28px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold',
              cursor: 'pointer', textDecoration: 'none', display: 'inline-block'
            }}
          >
            Découvrir les Solutions
          </a>
        </div>
      </section>

      {/* 3. SOLUTIONS SECTION */}
      <section id="solutions" style={{ padding: '80px 8%' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Solutions Décisionnelles Clés en Main</h2>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>5 axes commerciaux conçus pour les directions de santé, distributeurs et investisseurs privés.</p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px', maxWidth: '1200px', margin: '0 auto'
        }}>
          {/* Card 1 */}
          <div className="landing-card" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            padding: '25px', borderRadius: '12px', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '30px', marginBottom: '15px' }}>🔍</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Score d'Opportunité (Géo-Marketing)</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Identifiez les meilleurs emplacements pour de nouvelles pharmacies ou cliniques en mesurant la demande et la concurrence à moins de 5 km.
            </p>
          </div>

          {/* Card 2 */}
          <div className="landing-card" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            padding: '25px', borderRadius: '12px', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '30px', marginBottom: '15px' }}>🚚</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Logistique & Supply Chain</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Optimisez l'approvisionnement des points de santé au départ des grands hubs de distribution en fonction du rayon d'action.
            </p>
          </div>

          {/* Card 3 */}
          <div className="landing-card" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            padding: '25px', borderRadius: '12px', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '30px', marginBottom: '15px' }}>📄</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Audits de Territoire Premium</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Générez instantanément des rapports d'audit de 10 pages complets en format PDF A4 à l'échelle d'un district ou d'une région.
            </p>
          </div>

          {/* Card 4 */}
          <div className="landing-card" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            padding: '25px', borderRadius: '12px', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '30px', marginBottom: '15px' }}>🦠</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Alertes Épidémiologiques Live</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Visualisez la propagation des alertes sanitaires (Paludisme, Choléra, Mpox, Méningite) simulées en temps réel sur le territoire.
            </p>
          </div>

          {/* Card 5 */}
          <div className="landing-card" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            padding: '25px', borderRadius: '12px', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '30px', marginBottom: '15px' }}>✏️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Outils de Dessin Collaboratifs</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Annotez la carte en direct, dessinez des zones d'intervention et exportez vos données sous format JSON standard.
            </p>
          </div>
        </div>
      </section>

      {/* 4. TARIFS SECTION */}
      <section id="tarifs" style={{ padding: '80px 8%', background: '#0b0f19' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Des Plans Adaptés à Vos Objectifs</h2>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>Une structure tarifaire pensée pour tous les acteurs de l'écosystème santé.</p>
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
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', margin: '0 0 10px 0' }}>Accès Public</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>Gratuit</div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Pour l'exploration générale des données.</p>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '30px' }}>
              <li>Visualisation des Régions & FOSA</li>
              <li>Filtres de base</li>
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
              ONG / Santé
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', margin: '0 0 10px 0' }}>Professionnel</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>99 000 FCFA <span style={{ fontSize: '14px', color: '#94a3b8' }}>/mois</span></div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Pour les projets de santé et gestion épidémique.</p>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '30px' }}>
              <li>Toutes les fonctionnalités de base</li>
              <li>Alertes Épidémiologiques Live</li>
              <li>Outils Collaboratifs de Dessin</li>
              <li>Exportations d'Annotations JSON</li>
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
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b', margin: '0 0 10px 0' }}>Investisseur / B2B</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>Sur Mesure</div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Pour les répartiteurs et investisseurs privés.</p>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '30px' }}>
              <li>Algorithme Géo-marketing</li>
              <li>Calcul de Rayons Logistiques</li>
              <li>Audits PDF Premium de 10 pages</li>
              <li>Données d'Opportunité Privées</li>
            </ul>
            <button onClick={onLogin} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
              Contacter les Ventes
            </button>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer style={{
        padding: '40px 8%', borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '20px',
        fontSize: '13px', color: '#64748b'
      }}>
        <div>© 2026 Cameroon Health Intelligence. Tous droits réservés.</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>contact@cameroon-health-intel.cm</span>
          <span>Mentions Légales</span>
        </div>
      </footer>
    </div>
  );
}
