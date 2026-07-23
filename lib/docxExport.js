const COULEUR_INK = '16213A';
const COULEUR_GRIS_CLAIR = 'F7F6F2';

/**
 * Génère un document Word avec un titre, un sous-titre optionnel, et une ou
 * plusieurs sections tabulaires.
 * sections : [{ titre, colonnes: [...], lignes: [[...]] }]
 */
export async function exporterWord(nomFichier, { titre, sousTitre, sections }) {
  const {
    Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
    HeadingLevel, WidthType, AlignmentType, ShadingType,
  } = await import('docx');

  function ligneEnTete(colonnes) {
    return new TableRow({
      tableHeader: true,
      children: colonnes.map((texte) => new TableCell({
        shading: { type: ShadingType.SOLID, color: COULEUR_INK, fill: COULEUR_INK },
        children: [new Paragraph({
          children: [new TextRun({ text: String(texte), bold: true, color: 'FFFFFF', size: 20 })],
        })],
      })),
    });
  }

  function ligneDonnee(valeurs, alternee) {
    return new TableRow({
      children: valeurs.map((texte) => new TableCell({
        shading: alternee ? { type: ShadingType.SOLID, color: COULEUR_GRIS_CLAIR, fill: COULEUR_GRIS_CLAIR } : undefined,
        children: [new Paragraph({
          children: [new TextRun({ text: String(texte ?? ''), size: 20 })],
        })],
      })),
    });
  }

  function construireTableau(colonnes, lignes) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        ligneEnTete(colonnes),
        ...lignes.map((l, i) => ligneDonnee(l, i % 2 === 1)),
      ],
    });
  }

  const children = [
    new Paragraph({
      text: titre,
      heading: HeadingLevel.TITLE,
    }),
  ];

  if (sousTitre) {
    children.push(new Paragraph({
      children: [new TextRun({ text: sousTitre, italics: true, color: '6B7280' })],
      spacing: { after: 300 },
    }));
  }

  sections.forEach((section) => {
    if (section.titre) {
      children.push(new Paragraph({
        text: section.titre,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }));
    }
    if (section.lignes.length === 0) {
      children.push(new Paragraph({ text: 'Aucune donnée.', italics: true }));
    } else {
      children.push(construireTableau(section.colonnes, section.lignes));
      children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }
  });

  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({
      text: `Généré le ${new Date().toLocaleDateString('fr-FR')} — Gestion Église`,
      size: 16,
      color: '9CA3AF',
    })],
  }));

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
