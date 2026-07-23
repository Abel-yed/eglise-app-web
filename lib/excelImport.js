/**
 * Lit un fichier Excel (.xlsx / .xls) et retourne un tableau d'objets,
 * une ligne = un objet, les clés étant les en-têtes de colonnes.
 */
export async function lireFichierExcel(file) {
  const XLSX = await import('xlsx');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const feuille = workbook.Sheets[workbook.SheetNames[0]];
        const lignes = XLSX.utils.sheet_to_json(feuille, { defval: '' });
        resolve(lignes);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsArrayBuffer(file);
  });
}

function normaliserTexte(v) {
  return String(v ?? '').trim();
}

function normaliserDate(valeur) {
  if (!valeur) return null;
  // Cas 1 : Excel a déjà converti la cellule en objet Date (grâce à cellDates: true)
  if (valeur instanceof Date && !isNaN(valeur)) {
    return valeur.toISOString().split('T')[0];
  }
  const texte = normaliserTexte(valeur);
  // Cas 2 : format jj/mm/aaaa ou jj-mm-aaaa
  const matchFr = texte.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (matchFr) {
    const [, j, m, a] = matchFr;
    return `${a}-${m.padStart(2, '0')}-${j.padStart(2, '0')}`;
  }
  // Cas 3 : déjà au format aaaa-mm-jj
  const matchIso = texte.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (matchIso) {
    const [, a, m, j] = matchIso;
    return `${a}-${m.padStart(2, '0')}-${j.padStart(2, '0')}`;
  }
  return null;
}

function normaliserMontant(valeur) {
  if (typeof valeur === 'number') return valeur;
  const texte = normaliserTexte(valeur).replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = parseFloat(texte);
  return isNaN(n) ? null : n;
}

const CATEGORIES_RECETTES = [
  'Offrandes volontaires', 'Dîme', 'Vœux', 'Fête de moisson', 'Ventes aux enchères', 'Dons', 'Autres recettes',
];
const CATEGORIES_DEPENSES = [
  'Électricité', 'Eau', 'Loyer', 'Motivation Pasteur', 'Mensualités', 'Autres dépenses',
];

/**
 * Convertit les lignes brutes d'un Excel "Caisse" en lignes prêtes pour Supabase.
 * Colonnes attendues (insensibles à la casse) : Date, Type, Catégorie, Montant, Description
 */
export function normaliserLignesCaisse(lignes) {
  return lignes.map((ligne, index) => {
    const get = (cle) => {
      const trouve = Object.keys(ligne).find((k) => k.trim().toLowerCase() === cle);
      return trouve ? ligne[trouve] : '';
    };

    const date = normaliserDate(get('date'));
    const typeBrut = normaliserTexte(get('type')).toLowerCase();
    const type = ['entree', 'entrée', 'recette'].includes(typeBrut) ? 'entree'
      : ['sortie', 'depense', 'dépense'].includes(typeBrut) ? 'sortie'
      : null;
    const categorie = normaliserTexte(get('categorie') || get('catégorie'));
    const montant = normaliserMontant(get('montant'));
    const description = normaliserTexte(get('description'));

    const erreurs = [];
    if (!date) erreurs.push('date invalide');
    if (!type) erreurs.push("type invalide (attendu : Entrée / Sortie)");
    if (!categorie) erreurs.push('catégorie manquante');
    if (montant === null || montant < 0) erreurs.push('montant invalide');

    return {
      ligne: index + 2, // +2 : ligne 1 = en-têtes dans le fichier Excel
      valide: erreurs.length === 0,
      erreurs,
      donnees: { date, type, categorie, montant, description },
    };
  });
}

/**
 * Convertit les lignes brutes d'un Excel "Banque" en lignes prêtes pour Supabase.
 * Colonnes attendues (insensibles à la casse) : Date, Type, Montant, Description
 */
export function normaliserLignesBanque(lignes) {
  return lignes.map((ligne, index) => {
    const get = (cle) => {
      const trouve = Object.keys(ligne).find((k) => k.trim().toLowerCase() === cle);
      return trouve ? ligne[trouve] : '';
    };

    const date = normaliserDate(get('date'));
    const typeBrut = normaliserTexte(get('type')).toLowerCase();
    const type = ['depot', 'dépôt', 'depôt'].includes(typeBrut) ? 'depot'
      : ['retrait'].includes(typeBrut) ? 'retrait'
      : null;
    const montant = normaliserMontant(get('montant'));
    const description = normaliserTexte(get('description'));

    const erreurs = [];
    if (!date) erreurs.push('date invalide');
    if (!type) erreurs.push('type invalide (attendu : Dépôt / Retrait)');
    if (montant === null || montant < 0) erreurs.push('montant invalide');

    return {
      ligne: index + 2,
      valide: erreurs.length === 0,
      erreurs,
      donnees: { date, type, montant, description },
    };
  });
}

export { CATEGORIES_RECETTES, CATEGORIES_DEPENSES };
