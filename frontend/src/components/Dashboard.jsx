import React, { useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Legend
} from 'recharts';

const COLORS_GREEN = ['#0A5C36', '#128C54', '#1aab6d', '#20b2aa', '#2ecc8f'];
const COLORS_PIE   = ['#0A5C36', '#0056B3', '#F2A900', '#e74c3c', '#8e44ad'];

// Bounding boxes approximatives des régions du Cameroun [Sud, Ouest, Nord, Est] -> [lat_min, lng_min, lat_max, lng_max]
const REGION_BOUNDS = {
  'Adamaoua':    [[6.0, 11.5], [8.5, 15.5]],
  'Centre':      [[2.5, 10.5], [6.5, 14.0]],
  'Est':         [[2.0, 13.5], [6.5, 16.2]],
  'Extrême-Nord':[[10.0, 13.5], [13.1, 15.5]],
  'Littoral':    [[3.5, 9.2],  [5.0, 10.8]],
  'Nord':        [[7.5, 12.5], [10.2, 15.0]],
  'Nord-Ouest':  [[5.5, 9.8],  [7.2, 11.0]],
  'Ouest':       [[4.8, 9.8],  [6.2, 11.2]],
  'Sud':         [[1.7, 10.0], [3.5, 14.5]],
  'Sud-Ouest':   [[4.0, 8.4],  [6.0, 10.0]],
};

function findRegionBounds(regionName) {
  const key = Object.keys(REGION_BOUNDS).find(k =>
    regionName && regionName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? REGION_BOUNDS[key] : null;
}

export default function Dashboard({ visibleStats, onZoomToRegion }) {
  const { regionData, statutData } = useMemo(() => {
    const rCounts = {};
    const sCounts = {};
    if (visibleStats.fosa_list) {
      visibleStats.fosa_list.forEach(f => {
        const region = f.Nom_Region || f.REGION || 'Inconnu';
        rCounts[region] = (rCounts[region] || 0) + 1;

        let statut = String(f.Statut || 'Inconnu').toUpperCase();
        let displayStatut = 'Autre';
        if (statut.includes('PUBLIC')) displayStatut = 'Public';
        else if (statut.includes('PRIV')) displayStatut = 'Privé';
        else if (statut.includes('CONFESSIONNEL')) displayStatut = 'Confessionnel';
        sCounts[displayStatut] = (sCounts[displayStatut] || 0) + 1;
      });
    }

    const sortedRegions = Object.keys(rCounts)
      .map(k => ({ name: k, value: rCounts[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const sortedStatuts = Object.keys(sCounts)
      .map(k => ({ name: k, value: sCounts[k] }));

    return { regionData: sortedRegions, statutData: sortedStatuts };
  }, [visibleStats.fosa_list]);

  const handleBarClick = useCallback((data) => {
    if (!data || !onZoomToRegion) return;
    const bounds = findRegionBounds(data.name);
    if (bounds) onZoomToRegion(bounds);
  }, [onZoomToRegion]);

  return (
    <div className="dashboard-container">
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <h3>FOSA (Vue)</h3>
          <div className="value">{(visibleStats.formations_sanitaires || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card blue">
          <h3>Pharmacies (Vue)</h3>
          <div className="value">{(visibleStats.pharmacies || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #128C54, #20b2aa)' }}>
          <h3>Écoles (Vue)</h3>
          <div className="value">{(visibleStats.ecoles || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #e74c3c, #e67e22)', color: '#fff' }}>
          <h3>Déserts Médicaux</h3>
          <div className="value">{(visibleStats.zones_blanches || 0).toLocaleString()}</div>
        </div>
      </div>

      {visibleStats.formations_sanitaires > 0 ? (
        <>
          {/* Chart 1 : Régions (cliquable) */}
          <div className="chart-container">
            <h3 className="chart-title">
              Répartition par Région
              <span className="chart-hint">Cliquer = Zoomer</span>
            </h3>
            <ResponsiveContainer width="100%" height="78%">
              <BarChart
                data={regionData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                onClick={({ activePayload }) => activePayload && handleBarClick(activePayload[0].payload)}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
                <Tooltip
                  cursor={{ fill: 'rgba(10,92,54,0.06)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  formatter={(v) => [v, 'FOSA']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14} style={{ cursor: 'pointer' }}>
                  {regionData.map((_, i) => (
                    <Cell key={i} fill={COLORS_GREEN[i % COLORS_GREEN.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2 : Statut Public / Privé */}
          <div className="chart-container">
            <h3 className="chart-title">Statut (Public / Privé)</h3>
            <ResponsiveContainer width="100%" height="78%">
              <PieChart>
                <Pie
                  data={statutData}
                  cx="45%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={48}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statutData.map((_, i) => (
                    <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px', boxShadow: '0 4px 6px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="chart-empty">
          Activez "Formations Sanitaires" et naviguez sur la carte pour voir les analyses.
        </p>
      )}
    </div>
  );
}
