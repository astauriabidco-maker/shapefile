import React, { useState } from 'react';

export default function ExportButton({ mapRef }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Dynamically load libraries if not present
      const loadScript = (src, id) => new Promise((resolve) => {
        if (document.getElementById(id)) return resolve();
        const s = document.createElement('script');
        s.id = id;
        s.src = src;
        s.onload = resolve;
        document.head.appendChild(s);
      });

      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas-script');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf-script');

      // eslint-disable-next-line no-undef
      const canvas = await window.html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 1.5,
        logging: false,
      });

      // eslint-disable-next-line no-undef
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Header
      pdf.setFillColor(10, 92, 54);
      pdf.rect(0, 0, pageW, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cameroon Health Intelligence — Plateforme Géo-Décisionnelle 2022', 10, 12);

      // Map image
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const mapH = pageH - 28;
      pdf.addImage(imgData, 'JPEG', 0, 18, pageW, mapH);

      // Footer
      pdf.setFillColor(30, 41, 59);
      pdf.rect(0, pageH - 8, pageW, 8, 'F');
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const now = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
      pdf.text(`Exporté le ${now}  ·  Données : Shapefile Cameroun 2022`, 10, pageH - 2.5);

      pdf.save(`cameroon-health-map-${Date.now()}.pdf`);
    } catch (err) {
      console.error('Erreur export PDF:', err);
      alert('Erreur lors de la génération du PDF. Vérifiez la console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="export-btn" onClick={handleExport} disabled={loading}>
      {loading ? (
        <>
          <div className="spinner-small" /> Génération…
        </>
      ) : (
        <>
          📄 Exporter la Carte (PDF)
        </>
      )}
    </button>
  );
}
