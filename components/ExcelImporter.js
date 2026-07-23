import { useState, useRef } from 'react';
import { lireFichierExcel } from '../lib/excelImport';
import { lireFichierWord } from '../lib/wordImport';
import { Card, SectionTitle, Button, Badge } from './ui';

/**
 * Composant générique d'import Excel (.xlsx) ou Word (.docx contenant un tableau).
 * - normaliser(lignesBrutes) : transforme les lignes du fichier en { valide, erreurs, donnees }
 * - onConfirmer(lignesValides) : reçoit les objets prêts pour l'insertion Supabase
 * - modeleHref : lien vers le fichier modèle Excel téléchargeable
 */
export default function ExcelImporter({ titre, description, normaliser, onConfirmer, modeleHref }) {
  const [lignes, setLignes] = useState(null);
  const [nomFichier, setNomFichier] = useState('');
  const [analyse, setAnalyse] = useState(false);
  const [importEnCours, setImportEnCours] = useState(false);
  const [erreurFichier, setErreurFichier] = useState('');
  const inputRef = useRef(null);

  const gererFichier = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErreurFichier('');
    setNomFichier(file.name);
    setAnalyse(true);
    try {
      const estWord = /\.docx?$/i.test(file.name);
      const brut = estWord ? await lireFichierWord(file) : await lireFichierExcel(file);
      if (brut.length === 0) {
        setErreurFichier('Le fichier est vide.');
        setLignes(null);
      } else {
        setLignes(normaliser(brut));
      }
    } catch (err) {
      setErreurFichier(err.message || "Impossible de lire ce fichier. Vérifiez qu'il s'agit bien d'un fichier Excel (.xlsx) ou Word (.docx) contenant un tableau.");
      setLignes(null);
    }
    setAnalyse(false);
  };

  const reinitialiser = () => {
    setLignes(null);
    setNomFichier('');
    setErreurFichier('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const lignesValides = lignes?.filter((l) => l.valide) ?? [];
  const lignesInvalides = lignes?.filter((l) => !l.valide) ?? [];

  const confirmer = async () => {
    setImportEnCours(true);
    await onConfirmer(lignesValides.map((l) => l.donnees));
    setImportEnCours(false);
    reinitialiser();
  };

  return (
    <Card style={{ marginBottom: '28px' }}>
      <SectionTitle>{titre}</SectionTitle>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '-8px', marginBottom: '16px' }}>
        {description}
      </p>

      {modeleHref && (
        <a
          href={modeleHref}
          download
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: 'var(--color-info)',
            marginBottom: '16px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          ⬇️ Télécharger le modèle Excel
        </a>
      )}
      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '-8px', marginBottom: '10px' }}>
        Formats acceptés : Excel (.xlsx) ou Word (.docx contenant un tableau avec les mêmes colonnes).
      </p>

      <div style={{ marginBottom: '12px' }}>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.docx,.doc"
          onChange={gererFichier}
          style={{ fontSize: '14px' }}
        />
      </div>

      {analyse && <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Lecture du fichier…</p>}
      {erreurFichier && <p style={{ color: 'var(--color-danger)', fontSize: '14px' }}>{erreurFichier}</p>}

      {lignes && !analyse && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <Badge tone="success">{lignesValides.length} ligne{lignesValides.length > 1 ? 's' : ''} valide{lignesValides.length > 1 ? 's' : ''}</Badge>
            {lignesInvalides.length > 0 && (
              <Badge tone="danger">{lignesInvalides.length} ligne{lignesInvalides.length > 1 ? 's' : ''} ignorée{lignesInvalides.length > 1 ? 's' : ''}</Badge>
            )}
          </div>

          {lignesInvalides.length > 0 && (
            <div
              style={{
                background: 'var(--color-danger-soft)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: '14px',
                fontSize: '13px',
                color: 'var(--color-danger)',
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            >
              {lignesInvalides.map((l) => (
                <div key={l.ligne} style={{ marginBottom: '4px' }}>
                  Ligne {l.ligne} : {l.erreurs.join(', ')}
                </div>
              ))}
            </div>
          )}

          {lignesValides.length > 0 ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={confirmer} variant="success" disabled={importEnCours}>
                {importEnCours ? 'Import en cours…' : `Importer ${lignesValides.length} ligne${lignesValides.length > 1 ? 's' : ''}`}
              </Button>
              <Button onClick={reinitialiser} variant="ghost" disabled={importEnCours}>
                Annuler
              </Button>
            </div>
          ) : (
            <Button onClick={reinitialiser} variant="ghost">Choisir un autre fichier</Button>
          )}
        </div>
      )}
    </Card>
  );
}
