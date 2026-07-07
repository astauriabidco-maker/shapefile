import { useEffect } from 'react';

/**
 * EpidemiologyControls
 * Props:
 *   active            {boolean}   – whether the epidemiology layer is enabled
 *   onToggle          {function}  – called when the toggle switch changes
 *   disease           {string}    – currently selected disease
 *   onDiseaseChange   {function}  – called with new disease string
 *   alertLevel        {string}    – currently selected alert level filter
 *   onAlertLevelChange{function}  – called with new alert level string
 *   alertsData        {Array}     – array of GeoJSON alert features
 */
export default function EpidemiologyControls({
  active,
  onToggle,
  disease,
  onDiseaseChange,
  alertLevel,
  onAlertLevelChange,
  alertsData = [],
}) {
  /* ─── Inject pulse-dot keyframe animation once ─────────────────────────── */
  useEffect(() => {
    const STYLE_ID = 'epidemio-pulse-style';
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes epidemioPulse {
        0%   { transform: scale(1);   opacity: 1; }
        50%  { transform: scale(1.6); opacity: 0.4; }
        100% { transform: scale(1);   opacity: 1; }
      }
      .pulse-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #e53e3e;
        display: inline-block;
        animation: epidemioPulse 1.4s ease-in-out infinite;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById(STYLE_ID);
      if (el) el.remove();
    };
  }, []);

  /* ─── Derived stats ─────────────────────────────────────────────────────── */
  const totalCases = alertsData.reduce(
    (sum, f) => sum + (f?.properties?.cases ?? 0),
    0
  );

  /* ─── Inline styles ─────────────────────────────────────────────────────── */
  const styles = {
    panel: { marginBottom: '12px' },
    toggleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '10px',
    },
    toggleLabel: { fontSize: '13px', color: '#e2e8f0', fontWeight: 500 },
    switchLabel: {
      position: 'relative',
      display: 'inline-block',
      width: '40px',
      height: '22px',
    },
    switchInput: { opacity: 0, width: 0, height: 0 },
    select: {
      width: '100%',
      padding: '6px 8px',
      borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.08)',
      color: '#e2e8f0',
      fontSize: '12px',
      cursor: 'pointer',
      marginBottom: '8px',
      outline: 'none',
    },
    fieldLabel: {
      fontSize: '11px',
      color: '#a0aec0',
      marginBottom: '3px',
      display: 'block',
    },
    liveRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      marginTop: '10px',
      marginBottom: '10px',
    },
    liveText: {
      fontSize: '11px',
      color: active ? '#fc8181' : '#718096',
      fontStyle: 'italic',
    },
    statsBox: {
      background: 'rgba(229,62,62,0.12)',
      border: '1px solid rgba(229,62,62,0.3)',
      borderRadius: '6px',
      padding: '7px 10px',
      fontSize: '12px',
      color: '#feb2b2',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statsBadge: {
      background: '#e53e3e',
      color: '#fff',
      borderRadius: '10px',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 700,
    },
  };

  /* Slider track & knob (pseudo-element replacement via inline style) */
  const sliderBase = {
    position: 'absolute',
    cursor: 'pointer',
    top: 0, left: 0, right: 0, bottom: 0,
    background: active ? '#e53e3e' : 'rgba(255,255,255,0.2)',
    borderRadius: '22px',
    transition: 'background 0.3s',
  };
  const knob = {
    position: 'absolute',
    height: '16px',
    width: '16px',
    left: active ? '21px' : '3px',
    bottom: '3px',
    background: '#fff',
    borderRadius: '50%',
    transition: 'left 0.3s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  };

  return (
    <div className="layer-controls" style={styles.panel}>

      {/* ── Header ── */}
      <div className="filter-section-header">
        🦠 Alertes Épidémio (Live)
      </div>

      {/* ── Toggle switch ── */}
      <div style={styles.toggleRow}>
        <span style={styles.toggleLabel}>Activer la couche</span>
        <label
          className="switch"
          style={styles.switchLabel}
          title={active ? 'Désactiver' : 'Activer'}
        >
          <input
            type="checkbox"
            checked={active}
            onChange={onToggle}
            style={styles.switchInput}
            aria-label="Activer la couche épidémiologique"
          />
          <span className="slider" style={sliderBase}>
            <span style={knob} />
          </span>
        </label>
      </div>

      {/* ── Disease dropdown ── */}
      <label style={styles.fieldLabel} htmlFor="epi-disease-select">
        Maladie surveillée
      </label>
      <select
        id="epi-disease-select"
        style={styles.select}
        value={disease}
        onChange={(e) => onDiseaseChange(e.target.value)}
        disabled={!active}
      >
        {['Paludisme', 'Choléra', 'Mpox', 'Méningite'].map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* ── Alert level dropdown ── */}
      <label style={styles.fieldLabel} htmlFor="epi-level-select">
        Niveau d&apos;alerte
      </label>
      <select
        id="epi-level-select"
        style={styles.select}
        value={alertLevel}
        onChange={(e) => onAlertLevelChange(e.target.value)}
        disabled={!active}
      >
        {['Toutes', 'Critique', 'Élevé', 'Modéré'].map((lvl) => (
          <option key={lvl} value={lvl}>{lvl}</option>
        ))}
      </select>

      {/* ── Live pulse dot + label ── */}
      <div style={styles.liveRow}>
        {active && <span className="pulse-dot" aria-hidden="true" />}
        <span style={styles.liveText}>
          {active ? 'Données simulées en temps réel' : 'Couche désactivée'}
        </span>
      </div>

      {/* ── Stats: alert count ── */}
      {active && (
        <div style={styles.statsBox}>
          <span>Alertes chargées</span>
          <span style={styles.statsBadge}>{alertsData.length}</span>
        </div>
      )}

      {/* ── Stats: total cases ── */}
      {active && totalCases > 0 && (
        <div
          style={{
            ...styles.statsBox,
            marginTop: '6px',
            background: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(251,191,36,0.3)',
            color: '#fef3c7',
          }}
        >
          <span>Cas totaux (filtrés)</span>
          <span style={{ ...styles.statsBadge, background: '#d97706' }}>
            {totalCases.toLocaleString('fr-FR')}
          </span>
        </div>
      )}
    </div>
  );
}
