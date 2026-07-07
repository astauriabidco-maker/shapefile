import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000/api/geojson';

const getBounds = (feature) => {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  const extractCoords = (coords) => {
    if (typeof coords[0] === 'number') {
      minLng = Math.min(minLng, coords[0]); maxLng = Math.max(maxLng, coords[0]);
      minLat = Math.min(minLat, coords[1]); maxLat = Math.max(maxLat, coords[1]);
    } else { coords.forEach(extractCoords); }
  };
  if (feature.geometry?.coordinates) { extractCoords(feature.geometry.coordinates); return [[minLat, minLng], [maxLat, maxLng]]; }
  return null;
};

const loadScript = (src, id) => new Promise((resolve) => {
  if (document.getElementById(id)) return resolve();
  const s = document.createElement('script'); s.id = id; s.src = src; s.onload = resolve;
  document.head.appendChild(s);
});

const matchArea = (props, level, selectedArea) => {
  if (level === 'district') return props.DISTRICT_S === selectedArea || props.District_S === selectedArea;
  return props.Nom_Region === selectedArea || props.REGION === selectedArea || props.Region === selectedArea || props.NOM_REGION === selectedArea;
};

export default function PremiumReportGenerator({ mapRef, onHighlight, onZoom }) {
  const [level, setLevel] = useState('district');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [allData, setAllData] = useState({});

  // Load territory list
  useEffect(() => {
    const layer = level === 'district' ? 'districts_sante' : 'regions';
    fetch(`${API}/${layer}`).then(r => r.json()).then(data => {
      setGeoData(data);
      const list = data.features.map(f => {
        if (level === 'district') return f.properties.DISTRICT_S || f.properties.District_S;
        return f.properties.Nom_Region || f.properties.REGION || f.properties.Region;
      }).filter(Boolean).sort();
      setAreas([...new Set(list)]);
      setSelectedArea(''); onHighlight('');
    }).catch(console.error);
  }, [level]);

  // Preload all stats data for the report
  useEffect(() => {
    const layers = ['formations_sanitaires', 'pharmacies', 'ecoles', 'zones_blanches', 'geomarketing'];
    Promise.all(layers.map(l => fetch(`${API}/${l}`).then(r => r.json()).catch(() => null)))
      .then(results => {
        const d = {};
        results.forEach((data, i) => { if (data) d[layers[i]] = data; });
        setAllData(d);
      });
  }, []);

  const handleSelect = (e) => {
    const val = e.target.value; setSelectedArea(val); onHighlight(val);
    if (val && geoData) {
      const feature = geoData.features.find(f => matchArea(f.properties, level, val));
      if (feature) { const bounds = getBounds(feature); if (bounds) onZoom(bounds); }
    }
  };

  const drawPageHeader = (pdf, pageW, title, color = '#0A5C36') => {
    pdf.setFillColor(...hexToRgb(color));
    pdf.rect(0, 0, pageW, 14, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.text('CAMEROON HEALTH INTELLIGENCE', 10, 9);
    pdf.text(title, pageW / 2, 9, { align: 'center' });
  };

  const drawPageFooter = (pdf, pageW, pageH, pageNum, totalPages) => {
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, pageH - 10, pageW, 10, 'F');
    pdf.setTextColor(180, 180, 180); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text('Document confidentiel · Usage professionnel', 10, pageH - 4);
    pdf.text(`Page ${pageNum} / ${totalPages}`, pageW - 25, pageH - 4);
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const drawKpiBox = (pdf, x, y, w, h, label, value, color = '#0A5C36') => {
    pdf.setFillColor(245, 248, 252); pdf.rect(x, y, w, h, 'F');
    pdf.setDrawColor(...hexToRgb(color)); pdf.setLineWidth(0.8);
    pdf.rect(x, y, w, h, 'S');
    pdf.setFontSize(22); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...hexToRgb(color));
    pdf.text(String(value), x + w / 2, y + h * 0.55, { align: 'center' });
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139);
    pdf.text(label, x + w / 2, y + h * 0.80, { align: 'center' });
  };

  const handleGenerate = async () => {
    if (!selectedArea) return;
    setLoading(true);
    const titleLabel = level === 'district' ? 'District' : 'Région';
    try {
      await new Promise(r => setTimeout(r, 1500));
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas-script');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf-script');

      // Capture the map
      // eslint-disable-next-line no-undef
      const canvas = await window.html2canvas(mapRef.current.querySelector('.map-container'), {
        useCORS: true, allowTaint: true, scale: 1.5, logging: false,
      });

      // eslint-disable-next-line no-undef
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const TOTAL_PAGES = 10;

      // --- PAGE 1 : COUVERTURE ---
      pdf.setFillColor(10, 92, 54);
      pdf.rect(0, 0, pageW, pageH, 'F');
      // Decorative bar
      pdf.setFillColor(242, 169, 0);
      pdf.rect(0, pageH * 0.6, pageW, 4, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11); pdf.setFont('helvetica', 'normal');
      pdf.text('CAMEROON HEALTH INTELLIGENCE', pageW / 2, 40, { align: 'center' });
      pdf.setFontSize(36); pdf.setFont('helvetica', 'bold');
      pdf.text("RAPPORT D'AUDIT", pageW / 2, 100, { align: 'center' });
      pdf.text('SANITAIRE', pageW / 2, 120, { align: 'center' });
      pdf.setFontSize(18); pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(242, 169, 0);
      pdf.text(titleLabel.toUpperCase() + ' DE', pageW / 2, 145, { align: 'center' });
      pdf.setFontSize(24); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
      pdf.text(selectedArea.toUpperCase(), pageW / 2, 162, { align: 'center' });
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(200, 220, 200);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 220, { align: 'center' });
      pdf.text('Document confidentiel · Usage professionnel', pageW / 2, 228, { align: 'center' });

      // --- PAGE 2 : RÉSUMÉ EXÉCUTIF + KPIs ---
      pdf.addPage();
      drawPageHeader(pdf, pageW, 'RÉSUMÉ EXÉCUTIF');
      pdf.setTextColor(30, 41, 59); pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
      pdf.text('2. Résumé Exécutif & Indicateurs Clés', 15, 28);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139);
      pdf.text(`Périmètre : ${titleLabel} de ${selectedArea} · Données : Cameroun 2022`, 15, 36);
      pdf.setDrawColor(200, 200, 200); pdf.line(15, 40, pageW - 15, 40);

      // Compute KPIs
      const countFeatures = (layer) => {
        if (!allData[layer]) return '—';
        return allData[layer].features.filter(f => matchArea(f.properties, level, selectedArea)).length;
      };
      const kpiW = (pageW - 35) / 2; const kpiH = 28;
      drawKpiBox(pdf, 15, 50, kpiW, kpiH, 'Formations Sanitaires (FOSA)', countFeatures('formations_sanitaires'), '#0056B3');
      drawKpiBox(pdf, 15 + kpiW + 5, 50, kpiW, kpiH, 'Pharmacies & Labos', countFeatures('pharmacies'), '#F2A900');
      drawKpiBox(pdf, 15, 88, kpiW, kpiH, 'Écoles', countFeatures('ecoles'), '#128C54');
      drawKpiBox(pdf, 15 + kpiW + 5, 88, kpiW, kpiH, 'Déserts Médicaux', countFeatures('zones_blanches'), '#e74c3c');

      pdf.setTextColor(30, 41, 59); pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
      pdf.text('Conclusions Préliminaires', 15, 132);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(60, 60, 60);
      const fosaCount = countFeatures('formations_sanitaires');
      const desertCount = countFeatures('zones_blanches');
      pdf.text(`• Le ${titleLabel.toLowerCase()} de ${selectedArea} compte ${fosaCount} formation(s) sanitaire(s) actives.`, 15, 142);
      pdf.text(`• ${desertCount} localité(s) sont identifiées comme déserts médicaux (> 5 km d'un FOSA).`, 15, 152);
      pdf.text('• Une intervention prioritaire est recommandée pour les zones à faible accessibilité.', 15, 162);
      pdf.text('• Le potentiel d\'investissement privé (pharmacies, cliniques) est évalué en Annexe.', 15, 172);
      drawPageFooter(pdf, pageW, pageH, 2, TOTAL_PAGES);

      // --- PAGE 3 : CARTOGRAPHIE HD ---
      pdf.addPage();
      drawPageHeader(pdf, pageW, 'CARTOGRAPHIE');
      pdf.setTextColor(30, 41, 59); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text(`3. Cartographie Haute Résolution — ${selectedArea}`, 15, 24);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgW = pageW - 30; const imgH = (canvas.height * imgW) / canvas.width;
      const clampedH = Math.min(imgH, pageH - 50);
      pdf.addImage(imgData, 'JPEG', 15, 30, imgW, clampedH);
      pdf.setFontSize(8); pdf.setTextColor(100, 100, 100);
      pdf.text('Fond de carte : CartoDB Voyager · Données : Shapefiles Cameroun 2022', 15, 30 + clampedH + 5);
      drawPageFooter(pdf, pageW, pageH, 3, TOTAL_PAGES);

      // --- PAGE 4 : ANALYSE INFRASTRUCTURES ---
      pdf.addPage();
      drawPageHeader(pdf, pageW, 'ANALYSE DES INFRASTRUCTURES');
      pdf.setTextColor(30, 41, 59); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text('4. Répartition des Formations Sanitaires par Type', 15, 25);
      pdf.setDrawColor(200, 200, 200); pdf.line(15, 30, pageW - 15, 30);
      const typeCounts = {};
      if (allData.formations_sanitaires) {
        allData.formations_sanitaires.features
          .filter(f => matchArea(f.properties, level, selectedArea))
          .forEach(f => {
            const t = f.properties.Type || f.properties.TYPE || 'Autre';
            typeCounts[t] = (typeCounts[t] || 0) + 1;
          });
      }
      const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 41, 59);
      pdf.text('Type d\'Infrastructure', 15, 40); pdf.text('Nombre', pageW - 40, 40);
      pdf.line(15, 43, pageW - 15, 43);
      pdf.setFont('helvetica', 'normal');
      typeEntries.forEach(([type, count], i) => {
        const y = 50 + i * 9;
        if (y > pageH - 20) return;
        pdf.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
        pdf.rect(15, y - 5, pageW - 30, 8, 'F');
        pdf.setTextColor(30, 41, 59); pdf.text(type, 17, y);
        pdf.setFont('helvetica', 'bold'); pdf.text(String(count), pageW - 38, y); pdf.setFont('helvetica', 'normal');
        pdf.setDrawColor(220, 220, 220); pdf.line(15, y + 3, pageW - 15, y + 3);
      });
      drawPageFooter(pdf, pageW, pageH, 4, TOTAL_PAGES);

      // --- PAGE 5 : DÉSERTS MÉDICAUX ---
      pdf.addPage();
      drawPageHeader(pdf, pageW, 'ZONES À RISQUE');
      pdf.setTextColor(30, 41, 59); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text('5. Analyse des Déserts Médicaux', 15, 25);
      pdf.setFillColor(255, 235, 238); pdf.rect(15, 32, pageW - 30, 18, 'F');
      pdf.setFillColor(231, 76, 60); pdf.rect(15, 32, 4, 18, 'F');
      pdf.setTextColor(231, 76, 60); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.text(`${desertCount} Localité(s) identifiée(s) en Désert Médical`, 25, 39);
      pdf.setTextColor(100, 116, 139); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
      pdf.text('Définition : localité à plus de 5 km de tout établissement de santé', 25, 46);
      pdf.setTextColor(30, 41, 59); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.text('Recommandations Prioritaires', 15, 65);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(60, 60, 60);
      pdf.text('1. Déploiement de Cases de Santé Communautaires dans les zones les plus isolées.', 15, 76);
      pdf.text('2. Mise en place de cliniques mobiles ciblant les localités > 10 km d\'un FOSA.', 15, 86);
      pdf.text('3. Formation d\'Agents de Santé Communautaires (ASC) au niveau village.', 15, 96);
      pdf.text('4. Partenariat avec ONG pour financement de postes de santé prioritaires.', 15, 106);
      drawPageFooter(pdf, pageW, pageH, 5, TOTAL_PAGES);

      // --- PAGE 6 : OPPORTUNITÉS GÉO-MARKETING ---
      pdf.addPage();
      drawPageHeader(pdf, pageW, 'OPPORTUNITÉS INVESTISSEMENT');
      pdf.setTextColor(30, 41, 59); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text('6. Score d\'Opportunité Géo-Marketing', 15, 25);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139);
      pdf.text('Top 5 des localités recommandées pour une nouvelle implantation commerciale', 15, 33);
      pdf.setDrawColor(200, 200, 200); pdf.line(15, 37, pageW - 15, 37);
      const gmFeatures = allData.geomarketing
        ? allData.geomarketing.features
            .filter(f => matchArea(f.properties, level, selectedArea))
            .sort((a, b) => (b.properties.sc_pharma || 0) - (a.properties.sc_pharma || 0))
            .slice(0, 8)
        : [];
      pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 41, 59);
      const c1 = 15, c2 = 80, c3 = 130, c4 = 165;
      pdf.text('Localité', c1, 45); pdf.text('Score Pharmacie', c2, 45); pdf.text('Score Clinique', c3, 45); pdf.text('Catégorie', c4, 45);
      pdf.line(15, 48, pageW - 15, 48);
      pdf.setFont('helvetica', 'normal');
      gmFeatures.forEach((f, i) => {
        const y = 56 + i * 9; const p = f.properties;
        const score = p.sc_pharma || 0;
        const cat = score >= 75 ? 'Excellent' : score >= 50 ? 'Favorable' : 'Faible';
        const catColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
        pdf.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
        pdf.rect(15, y - 5, pageW - 30, 8, 'F');
        pdf.setTextColor(30, 41, 59);
        pdf.text((p.nom || 'N/A').substring(0, 25), c1, y);
        pdf.text(String(p.sc_pharma || '—'), c2 + 10, y);
        pdf.text(String(p.sc_clinique || '—'), c3 + 10, y);
        pdf.setTextColor(...hexToRgb(catColor)); pdf.setFont('helvetica', 'bold');
        pdf.text(cat, c4, y); pdf.setFont('helvetica', 'normal');
      });
      if (gmFeatures.length === 0) {
        pdf.setTextColor(150, 150, 150); pdf.text('Aucune donnée géo-marketing disponible pour cette zone.', 15, 60);
      }
      drawPageFooter(pdf, pageW, pageH, 6, TOTAL_PAGES);

      // --- PAGES 7-8 : LISTE DES FOSA ---
      const fosaList = allData.formations_sanitaires
        ? allData.formations_sanitaires.features.filter(f => matchArea(f.properties, level, selectedArea))
        : [];
      const perPage = 28;
      const chunks = [];
      for (let i = 0; i < Math.min(fosaList.length, perPage * 2); i += perPage) chunks.push(fosaList.slice(i, i + perPage));
      if (chunks.length === 0) chunks.push([]);

      chunks.forEach((chunk, chunkIdx) => {
        pdf.addPage();
        drawPageHeader(pdf, pageW, 'ANNEXE A — LISTE DES FOSA');
        pdf.setTextColor(30, 41, 59); pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
        pdf.text(`7. Inventaire des Formations Sanitaires (${chunkIdx === 0 ? '1/2' : '2/2'})`, 15, 25);
        pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
        pdf.text('#', 15, 35); pdf.text('Nom', 22, 35); pdf.text('Type', 95, 35); pdf.text('Statut', 125, 35); pdf.text('District', 160, 35);
        pdf.line(15, 38, pageW - 15, 38);
        pdf.setFont('helvetica', 'normal');
        chunk.forEach((f, i) => {
          const y = 44 + i * 7; const p = f.properties;
          pdf.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
          pdf.rect(15, y - 4, pageW - 30, 6, 'F');
          pdf.setTextColor(30, 41, 59);
          pdf.text(String(chunkIdx * perPage + i + 1), 15, y);
          pdf.text((p.Name1 || p.NAME || p.nom || 'N/A').substring(0, 30), 22, y);
          pdf.text((p.Type || '—').substring(0, 12), 95, y);
          pdf.text((p.Statut || '—').substring(0, 15), 125, y);
          pdf.text((p.DISTRICT_S || p.District_S || '—').substring(0, 18), 160, y);
        });
        if (chunk.length === 0) { pdf.setTextColor(150, 150, 150); pdf.text('Aucun FOSA trouvé pour cette zone.', 15, 50); }
        drawPageFooter(pdf, pageW, pageH, 7 + chunkIdx, TOTAL_PAGES);
      });

      // --- PAGE 9 : MÉTHODOLOGIE ---
      pdf.addPage();
      drawPageHeader(pdf, pageW, 'ANNEXE B — MÉTHODOLOGIE');
      pdf.setTextColor(30, 41, 59); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text('9. Sources de Données & Méthodologie', 15, 25);
      const methodLines = [
        ['Sources Géographiques', 'Shapefiles administratifs Cameroun (Régions, Départements, Districts de Santé, Aires de Santé)'],
        ['Formations Sanitaires', 'Base de données FOSA du Ministère de la Santé, données 2022'],
        ['Pharmacies', 'Registre des Officines — Direction de la Pharmacie et du Médicament'],
        ['Écoles', 'Annuaire Statistique de l\'Éducation — MINESEC Cameroun'],
        ['Marchés & Localités', 'Recensement Général de la Population et de l\'Habitat (RGPH) 2005'],
        ['Déserts Médicaux', 'Calcul de distance euclidienne, seuil à 5 km. Via arbre KD spatial (scipy).'],
        ['Géo-Marketing', 'Score composite : Demande (50 pts) + Concurrence (50 pts), pré-calculé sur 26 000 localités.'],
        ['Outil de Rapport', 'Cameroon Health Intelligence Platform v2.0 — React + FastAPI + GeoPandas'],
      ];
      let gy = 38;
      methodLines.forEach(([key, val]) => {
        pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(10, 92, 54);
        pdf.text(key + ' :', 15, gy);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(val, pageW - 70);
        pdf.text(lines, 70, gy);
        gy += lines.length * 6 + 4;
      });
      drawPageFooter(pdf, pageW, pageH, 9, TOTAL_PAGES);

      // --- PAGE 10 : PAGE LÉGALE ---
      pdf.addPage();
      drawPageHeader(pdf, pageW, 'INFORMATIONS LÉGALES');
      pdf.setTextColor(30, 41, 59); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text('10. Mentions Légales & Contact', 15, 25);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(80, 80, 80);
      const legal = [
        'Ce rapport a été généré automatiquement par la Plateforme Cameroon Health Intelligence.',
        'Les données présentées sont issues de sources publiques et officielles du Gouvernement du Cameroun.',
        'Toute reproduction ou diffusion de ce document sans autorisation préalable est interdite.',
        '',
        'Les calculs de déserts médicaux et scores géo-marketing sont des estimations à visée décisionnelle.',
        'Ils ne constituent pas un avis médical ou un engagement contractuel.',
        '',
        '© 2024 Cameroon Health Intelligence — Tous droits réservés.',
      ];
      legal.forEach((line, i) => { pdf.text(line, 15, 38 + i * 8); });
      pdf.setFillColor(10, 92, 54); pdf.rect(0, pageH - 50, pageW, 50, 'F');
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
      pdf.text('Cameroon Health Intelligence', pageW / 2, pageH - 35, { align: 'center' });
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
      pdf.text('Plateforme Géo-Décisionnelle · Données Santé · Géo-Marketing', pageW / 2, pageH - 25, { align: 'center' });
      pdf.setTextColor(242, 169, 0);
      pdf.text('contact@cameroon-health-intel.cm', pageW / 2, pageH - 14, { align: 'center' });

      pdf.save(`Audit_Premium_10p_${selectedArea.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du PDF : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layer-controls premium-report-panel">
      <div className="filter-section-header">
        <h3>📄 Audit Premium (10 pages)</h3>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
        Rapport complet : cartographie HD, KPIs, FOSA, déserts médicaux, géo-marketing.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '15px', fontSize: '13px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input type="radio" name="auditLevel" value="district" checked={level === 'district'} onChange={() => setLevel('district')} />
            District
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input type="radio" name="auditLevel" value="region" checked={level === 'region'} onChange={() => setLevel('region')} />
            Région
          </label>
        </div>
        <select value={selectedArea} onChange={handleSelect}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0', width: '100%', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
          <option value="">-- Sélectionner {level === 'district' ? 'un District' : 'une Région'} --</option>
          {areas.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button onClick={handleGenerate} disabled={!selectedArea || loading}
          style={{
            background: selectedArea ? 'linear-gradient(135deg, #0A5C36, #128C54)' : '#94a3b8',
            color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px',
            cursor: selectedArea ? 'pointer' : 'not-allowed', fontWeight: 'bold',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            boxShadow: selectedArea ? '0 4px 12px rgba(10,92,54,0.3)' : 'none',
            transition: 'all 0.2s',
          }}>
          {loading ? (
            <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Génération en cours...</>
          ) : '📋 Générer l\'Audit (10 pages)'}
        </button>
      </div>
    </div>
  );
}
