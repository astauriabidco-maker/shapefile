import React, { useState } from 'react';

const REGIONS = ['Adamaoua', 'Centre', 'Est', 'Extreme Nord', 'Littoral', 'Nord', 'North West', 'Ouest', 'South West', 'Sud'];

const FOSA_TYPES = ['CMA', 'CS', 'CSI', 'Cabinet Medical', 'Clinique', 'Dispensaire', 'HC', 'HD', 'HG', 'HR', 'Hopital', 'Polyclinique', 'Poste de sante'];
const FOSA_STATUTS = ['Public', 'Prive Confessionnel', 'Prive laic'];

const ECOLE_TYPES = [
  { key: 'Nursery', label: 'Maternelle' },
  { key: 'Primary', label: 'Primaire' },
  { key: 'Secondary', label: 'Secondaire' },
  { key: 'University And Higher And Institute', label: 'Supérieur' },
];

const PHARMA_TYPES = ['Pharmacie', 'Laboratoire'];
const CULTE_TYPES = ['Eglise', 'Mosquee'];

const STATUT_COLORS = {
  'Public': '#0A5C36',
  'Prive Confessionnel': '#F2A900',
  'Prive laic': '#0056B3',
};

const FOSA_TYPE_COLORS = {
  'HD': '#c0392b', 'HG': '#c0392b', 'HR': '#c0392b', 'Hopital': '#c0392b',
  'CMA': '#e67e22', 'HC': '#e67e22',
  'CS': '#0056B3', 'CSI': '#0056B3',
  'Clinique': '#8e44ad', 'Polyclinique': '#8e44ad',
  'Cabinet Medical': '#16a085',
  'Dispensaire': '#2ecc71', 'Poste de sante': '#2ecc71',
};

export default function FilterPanel({ filters, onChange }) {
  const [open, setOpen] = useState(false);

  const toggle = (key, value, current) => {
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const toggleAll = (key, allValues, current) => {
    onChange({ ...filters, [key]: current.length === allValues.length ? [] : [...allValues] });
  };

  const activeCount = () => {
    let n = 0;
    if (filters.region) n++;
    if (filters.fosaTypes.length < FOSA_TYPES.length) n++;
    if (filters.fosaStatuts.length < FOSA_STATUTS.length) n++;
    if (filters.ecoleTypes.length < ECOLE_TYPES.length) n++;
    if (filters.pharmaTypes.length < PHARMA_TYPES.length) n++;
    if (filters.culteTypes.length < CULTE_TYPES.length) n++;
    return n;
  };

  const count = activeCount();

  return (
    <div className="filter-panel-wrapper">
      {/* Toggle button */}
      <button className={`filter-toggle ${count > 0 ? 'filter-toggle--active' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>⚙️ Filtres avancés</span>
        {count > 0 && <span className="filter-badge">{count}</span>}
        <span className="filter-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="filter-body">

          {/* Filtre Région */}
          <div className="filter-section">
            <label className="filter-section-title">🌍 Région</label>
            <select
              className="heatmap-select"
              value={filters.region || ''}
              onChange={e => onChange({ ...filters, region: e.target.value || null })}
            >
              <option value="">Toutes les régions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* FOSA — Type */}
          <div className="filter-section">
            <div className="filter-section-header">
              <label className="filter-section-title">🏥 Type FOSA</label>
              <button className="filter-link" onClick={() => toggleAll('fosaTypes', FOSA_TYPES, filters.fosaTypes)}>
                {filters.fosaTypes.length === FOSA_TYPES.length ? 'Aucun' : 'Tous'}
              </button>
            </div>
            <div className="badge-group">
              {FOSA_TYPES.map(t => (
                <button
                  key={t}
                  className={`badge ${filters.fosaTypes.includes(t) ? 'badge--active' : ''}`}
                  style={filters.fosaTypes.includes(t) ? { background: FOSA_TYPE_COLORS[t] || '#0A5C36', borderColor: FOSA_TYPE_COLORS[t] || '#0A5C36' } : {}}
                  onClick={() => toggle('fosaTypes', t, filters.fosaTypes)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* FOSA — Statut */}
          <div className="filter-section">
            <div className="filter-section-header">
              <label className="filter-section-title">🏛️ Statut FOSA</label>
              <button className="filter-link" onClick={() => toggleAll('fosaStatuts', FOSA_STATUTS, filters.fosaStatuts)}>
                {filters.fosaStatuts.length === FOSA_STATUTS.length ? 'Aucun' : 'Tous'}
              </button>
            </div>
            <div className="badge-group">
              {FOSA_STATUTS.map(s => (
                <button
                  key={s}
                  className={`badge ${filters.fosaStatuts.includes(s) ? 'badge--active' : ''}`}
                  style={filters.fosaStatuts.includes(s) ? { background: STATUT_COLORS[s], borderColor: STATUT_COLORS[s] } : {}}
                  onClick={() => toggle('fosaStatuts', s, filters.fosaStatuts)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Écoles — Niveau */}
          <div className="filter-section">
            <div className="filter-section-header">
              <label className="filter-section-title">🎓 Niveau scolaire</label>
              <button className="filter-link" onClick={() => toggleAll('ecoleTypes', ECOLE_TYPES.map(e => e.key), filters.ecoleTypes)}>
                {filters.ecoleTypes.length === ECOLE_TYPES.length ? 'Aucun' : 'Tous'}
              </button>
            </div>
            <div className="badge-group">
              {ECOLE_TYPES.map(({ key, label }) => (
                <button
                  key={key}
                  className={`badge ${filters.ecoleTypes.includes(key) ? 'badge--active badge--green' : ''}`}
                  onClick={() => toggle('ecoleTypes', key, filters.ecoleTypes)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Pharmacies / Labos */}
          <div className="filter-section">
            <label className="filter-section-title">💊 Pharmacies & Labos</label>
            <div className="badge-group">
              {PHARMA_TYPES.map(t => (
                <button
                  key={t}
                  className={`badge ${filters.pharmaTypes.includes(t) ? 'badge--active badge--yellow' : ''}`}
                  onClick={() => toggle('pharmaTypes', t, filters.pharmaTypes)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Lieux de Culte */}
          <div className="filter-section">
            <label className="filter-section-title">⛪ Lieux de Culte</label>
            <div className="badge-group">
              {CULTE_TYPES.map(t => (
                <button
                  key={t}
                  className={`badge ${filters.culteTypes.includes(t) ? 'badge--active badge--purple' : ''}`}
                  onClick={() => toggle('culteTypes', t, filters.culteTypes)}
                >
                  {t === 'Eglise' ? '⛪ Église' : '🕌 Mosquée'}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button className="filter-reset" onClick={() => onChange(defaultFilters())}>
            ↺ Réinitialiser tous les filtres
          </button>
        </div>
      )}
    </div>
  );
}

export function defaultFilters() {
  return {
    region: null,
    fosaTypes: ['CMA', 'CS', 'CSI', 'Cabinet Medical', 'Clinique', 'Dispensaire', 'HC', 'HD', 'HG', 'HR', 'Hopital', 'Polyclinique', 'Poste de sante'],
    fosaStatuts: ['Public', 'Prive Confessionnel', 'Prive laic'],
    ecoleTypes: ['Nursery', 'Primary', 'Secondary', 'University And Higher And Institute'],
    pharmaTypes: ['Pharmacie', 'Laboratoire'],
    culteTypes: ['Eglise', 'Mosquee'],
  };
}
