const COULEUR_INK = [22, 33, 58];
const COULEUR_OR = [176, 138, 46];

/**
 * Génère un PDF avec un titre, un sous-titre optionnel, et une ou plusieurs
 * sections tabulaires. sections : [{ titre, colonnes: [...], lignes: [[...]] }]
 */
export async function exporterPDF(nomFichier, { titre, sousTitre, sections }) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margeGauche = 40;
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COULEUR_INK);
  doc.text(titre, margeGauche, y);
  y += 22;

  if (sousTitre) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(110, 110, 110);
    doc.text(sousTitre, margeGauche, y);
    y += 20;
  }

  sections.forEach((section, idx) => {
    if (y > 740) {
      doc.addPage();
      y = 50;
    }
    if (section.titre) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...COULEUR_INK);
      doc.text(section.titre, margeGauche, y);
      y += 10;
    }

    autoTable(doc, {
      startY: y + 6,
      head: [section.colonnes],
      body: section.lignes,
      margin: { left: margeGauche, right: margeGauche },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: COULEUR_INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 246, 242] },
      theme: 'grid',
    });

    y = doc.lastAutoTable.finalY + 26;
  });

  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Gestion Église — page ${i}/${pages} — généré le ${new Date().toLocaleDateString('fr-FR')}`,
      margeGauche,
      812
    );
  }

  doc.save(nomFichier);
}
