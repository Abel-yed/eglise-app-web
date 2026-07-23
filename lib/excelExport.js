/**
 * Génère et télécharge un fichier Excel à partir d'une ou plusieurs feuilles.
 * feuilles : [{ nom: 'Caisse', lignes: [{...}, {...}] }, ...]
 */
export async function exporterExcel(nomFichier, feuilles) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  feuilles.forEach(({ nom, lignes, largeurs }) => {
    const ws = XLSX.utils.json_to_sheet(lignes);
    if (largeurs) {
      ws['!cols'] = largeurs.map((w) => ({ wch: w }));
    }
    XLSX.utils.book_append_sheet(wb, ws, nom.substring(0, 31)); // limite Excel : 31 caractères
  });
  XLSX.writeFile(wb, nomFichier);
}

export function formatDateExport(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const jj = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${jj}/${mm}/${d.getFullYear()}`;
}
