import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatFCFA, formatDateCourte } from '../lib/format';
import { normaliserLignesCaisse } from '../lib/excelImport';
import { exporterExcel, formatDateExport } from '../lib/excelExport';
import { exporterPDF } from '../lib/pdfExport';
import { exporterWord } from '../lib/docxExport';
import ExcelImporter from '../components/ExcelImporter';
import ExportButtons from '../components/ExportButtons';
import {
  PageHeader, StatCard, Card, SectionTitle, Button, ToggleGroup,
  Field, fieldStyle, EmptyState, ListRow, IconButton, LoadingState, Badge,
} from '../components/ui';

const CATEGORIES_RECETTES = [
  'Offrandes volontaires', 'Dîme', 'Vœux', 'Fête de moisson', 'Ventes aux enchères', 'Dons', 'Autres recettes',
];
const CATEGORIES_DEPENSES = [
  'Électricité', 'Eau', 'Loyer', 'Motivation Pasteur', 'Mensualités', 'Autres dépenses',
];

export default function Caisse() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState('');

  const [type, setType] = useState('entree');
  const [montant, setMontant] = useState('');
  const [categorie, setCategorie] = useState('');
  const [description, setDescription] = useState('');

  const charger = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('caisse')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      setErreur("Impossible de charger le journal de caisse.");
    } else {
      setTransactions(data);
      setErreur('');
    }
    setLoading(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ajouter = async () => {
    if (!montant || !categorie) {
      alert('Veuillez remplir le montant et la catégorie.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('caisse').insert({
      type,
      montant: Number(montant),
      categorie,
      description,
    });

    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      setMontant('');
      setCategorie('');
      setDescription('');
      await charger();
    }
    setSaving(false);
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    const { error } = await supabase.from('caisse').delete().eq('id', id);
    if (error) {
      alert('Erreur lors de la suppression : ' + error.message);
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const exporter = () => {
    const lignes = transactions.map((t) => ({
      Date: formatDateExport(t.date),
      Type: t.type === 'entree' ? 'Entrée' : 'Sortie',
      'Catégorie': t.categorie,
      Montant: Number(t.montant),
      Description: t.description || '',
    }));
    exporterExcel(`caisse-export-${new Date().toISOString().split('T')[0]}.xlsx`, [
      { nom: 'Caisse', lignes, largeurs: [12, 10, 26, 12, 40] },
    ]);
  };

  const exporterEnPDF = () => {
    exporterPDF(`caisse-export-${new Date().toISOString().split('T')[0]}.pdf`, {
      titre: 'Journal de caisse',
      sousTitre: `Entrées : ${formatFCFA(totalEntrees)}   •   Sorties : ${formatFCFA(totalSorties)}   •   Solde : ${formatFCFA(solde)}`,
      sections: [{
        colonnes: ['Date', 'Type', 'Catégorie', 'Montant', 'Description'],
        lignes: transactions.map((t) => [
          formatDateExport(t.date),
          t.type === 'entree' ? 'Entrée' : 'Sortie',
          t.categorie,
          formatFCFA(t.montant),
          t.description || '',
        ]),
      }],
    });
  };

  const exporterEnWord = () => {
    exporterWord(`caisse-export-${new Date().toISOString().split('T')[0]}.docx`, {
      titre: 'Journal de caisse',
      sousTitre: `Entrées : ${formatFCFA(totalEntrees)} — Sorties : ${formatFCFA(totalSorties)} — Solde : ${formatFCFA(solde)}`,
      sections: [{
        colonnes: ['Date', 'Type', 'Catégorie', 'Montant', 'Description'],
        lignes: transactions.map((t) => [
          formatDateExport(t.date),
          t.type === 'entree' ? 'Entrée' : 'Sortie',
          t.categorie,
          formatFCFA(t.montant),
          t.description || '',
        ]),
      }],
    });
  };

  const importerLignes = async (lignesValides) => {
    const { error } = await supabase.from('caisse').insert(lignesValides);
    if (error) {
      alert("Erreur lors de l'import : " + error.message);
    } else {
      await charger();
      alert(`${lignesValides.length} transaction(s) importée(s) avec succès.`);
    }
  };

  const totalEntrees = transactions.filter((t) => t.type === 'entree').reduce((s, t) => s + Number(t.montant), 0);
  const totalSorties = transactions.filter((t) => t.type === 'sortie').reduce((s, t) => s + Number(t.montant), 0);
  const solde = totalEntrees - totalSorties;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <PageHeader
          eyebrow="Finances"
          title="Journal de caisse"
          description="Suivez les offrandes, dons et dépenses courantes de l'église au jour le jour."
        />
        <ExportButtons
          onExcel={exporter}
          onPDF={exporterEnPDF}
          onWord={exporterEnWord}
          disabled={transactions.length === 0}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        <StatCard label="Entrées" value={formatFCFA(totalEntrees)} tone="success" />
        <StatCard label="Sorties" value={formatFCFA(totalSorties)} tone="danger" />
        <StatCard label="Solde" value={formatFCFA(solde)} tone={solde >= 0 ? 'info' : 'gold'} />
      </div>

      <Card style={{ marginBottom: '28px' }}>
        <SectionTitle>Nouvelle transaction</SectionTitle>

        <ToggleGroup
          value={type}
          onChange={(v) => { setType(v); setCategorie(''); }}
          options={[
            { value: 'entree', label: '↓ Entrée', color: 'var(--color-success)' },
            { value: 'sortie', label: '↑ Sortie', color: 'var(--color-danger)' },
          ]}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Catégorie">
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} style={fieldStyle}>
              <option value="">— Choisir —</option>
              {(type === 'entree' ? CATEGORIES_RECETTES : CATEGORIES_DEPENSES).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Montant (FCFA)">
            <input type="number" min="0" placeholder="0" value={montant} onChange={(e) => setMontant(e.target.value)} style={fieldStyle} />
          </Field>
        </div>

        <Field label="Description (optionnelle)">
          <textarea placeholder="Précisions..." value={description} onChange={(e) => setDescription(e.target.value)} rows="2" style={fieldStyle} />
        </Field>

        <Button onClick={ajouter} variant="primary" disabled={saving} style={{ width: '100%', marginTop: '4px' }}>
          {saving ? 'Enregistrement…' : 'Enregistrer la transaction'}
        </Button>
      </Card>

      <ExcelImporter
        titre="Importer depuis Excel ou Word"
        description="Colonnes attendues : Date (jj/mm/aaaa), Type (Entrée ou Sortie), Catégorie, Montant, Description (facultative)."
        normaliser={normaliserLignesCaisse}
        onConfirmer={importerLignes}
        modeleHref="/modeles/modele-caisse.xlsx"
      />

      <SectionTitle>Historique ({transactions.length})</SectionTitle>

      {erreur && <p style={{ color: 'var(--color-danger)' }}>{erreur}</p>}
      {loading && <LoadingState label="Chargement du journal…" />}

      {!loading && transactions.length === 0 && (
        <EmptyState icon="💰" title="Aucune transaction" description="Ajoutez votre première entrée ou sortie ci-dessus." />
      )}

      {!loading && transactions.map((t) => (
        <ListRow key={t.id} tone={t.type === 'entree' ? 'success' : 'danger'}>
          <div>
            <div style={{ fontWeight: 600 }}>{t.categorie}</div>
            {t.description && <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{t.description}</div>}
            <div style={{ marginTop: '4px' }}>
              <Badge tone="info">{formatDateCourte(t.date)}</Badge>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontWeight: 700, fontSize: '17px', color: t.type === 'entree' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {t.type === 'entree' ? '+' : '-'}{formatFCFA(t.montant)}
            </span>
            <IconButton onClick={() => supprimer(t.id)} title="Supprimer" />
          </div>
        </ListRow>
      ))}
    </div>
  );
}
