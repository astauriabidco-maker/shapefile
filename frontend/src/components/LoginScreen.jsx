import React, { useState } from 'react';

export default function LoginScreen({ onLogin, onBack }) {
  const [email, setEmail] = useState('demo@cameroon-health.cm');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
      backgroundImage: 'radial-gradient(circle at center, rgba(10,92,54,0.15) 0%, rgba(30,41,59,0.95) 100%), url("https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=80")',
      backgroundSize: 'cover', backgroundPosition: 'center', fontFamily: 'Inter, sans-serif'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '400px', padding: '30px', borderRadius: '16px',
        border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', gap: '20px', color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>Portail Décisionnel</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>Connectez-vous pour accéder au SIG</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Adresse E-mail</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{
                padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Mot de Passe</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              style={{
                padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '14px'
              }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              padding: '12px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
              fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)', marginTop: '5px',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
            }}
          >
            {loading ? 'Authentification...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            ← Retour à l'accueil
          </button>
          <span style={{ color: '#64748b' }}>Version 2.0 (B2B SaaS)</span>
        </div>
      </div>
    </div>
  );
}
