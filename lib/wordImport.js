/**
 * Lit un fichier Word (.docx) et retourne le premier tableau trouvé,
 * sous forme de tableau d'objets (même format que la lecture Excel) :
 * la première ligne du tableau Word est utilisée comme en-têtes.
 */
export async function lireFichierWord(file) {
  const mammoth = (await import('mammoth/mammoth.browser')).default;
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

  const parser = new DOMParser();
  const docHtml = parser.parseFromString(html, 'text/html');
  const table = docHtml.querySelector('table');

  if (!table) {
    throw new Error(
      "Aucun tableau trouvé dans ce document Word. Le document doit contenir un tableau avec une ligne d'en-têtes (Date, Type, Montant, etc.)."
    );
  }

  const lignesHtml = Array.from(table.querySelectorAll('tr'));
  if (lignesHtml.length < 2) {
    throw new Error('Le tableau trouvé ne contient pas de lignes de données.');
  }

  const entetes = Array.from(lignesHtml[0].querySelectorAll('td, th')).map((c) => c.textContent.trim());

  const lignes = lignesHtml.slice(1).map((tr) => {
    const cellules = Array.from(tr.querySelectorAll('td, th')).map((c) => c.textContent.trim());
    const obj = {};
    entetes.forEach((entete, i) => {
      obj[entete] = cellules[i] ?? '';
    });
    return obj;
  }).filter((obj) => Object.values(obj).some((v) => v !== ''));

  return lignes;
}
