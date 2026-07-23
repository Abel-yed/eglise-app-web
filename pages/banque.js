import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatFCFA, formatDateCourte } from '../lib/format';
import { normaliserLignesBanque } from '../lib/excelImport';
import { exporterExcel, formatDateExport } from '../lib/excelExport';
import { exporterPDF } from '../lib/pdfExport';
import { exporterWord } from '../lib/docxExport';
import ExcelImporter from '../components/ExcelImporter';
import ExportButtons from '../components/ExportButtons';
import {
  PageHeader, StatCard, Card, SectionTitle, Button, ToggleGroup,
  Field, fieldStyle, EmptyState, ListRow, IconButton, LoadingState, Badge,
} from '../components/ui';

export default function Banque() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState('');

  const [type, setType] = useState('depot');
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');

  const charger = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banque')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      setErreur('Impossible de charger les transactions bancaires.');
    } else {
      setTransactions(data);
      setErreur('');
    }
    setLoading(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ajouter = async () => {
    if (!montant) {
      alert('Veuillez entrer un montant.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('banque').insert({
      type,
      montant: Number(montant),
      description,
    });

    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      setMontant('');
      setDescription('');
      await charger();
    }
    setSaving(false);
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    const { error } = await supabase.from('banque').delete().eq('id', id);
    if (error) {
      alert('Erreur lors de la suppression : ' + error.message);
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const exporter = () => {
    const lignes = transactions.map((t) => ({
      Date: formatDateExport(t.date),
      Type: t.type === 'depot' ? 'Dépôt' : 'Retrait',
      Montant: Number(t.montant),
      Description: t.description || '',
    }));
    exporterExcel(`banque-export-${new Date().toISOString().split('T')[0]}.xlsx`, [
      { nom: 'Banque', lignes, largeurs: [12, 10, 12, 40] },
    ]);
  };

  const exporterEnPDF = () => {
    exporterPDF(`banque-export-${new Date().toISOString().split('T')[0]}.pdf`, {
      titre: 'Compte bancaire',
      sousTitre: `Dépôts : ${formatFCFA(totalDepots)}   •   Retraits : ${formatFCFA(totalRetraits)}   •   Solde : ${formatFCFA(solde)}`,
      sections: [{
        colonnes: ['Date', 'Type', 'Montant', 'Description'],
        lignes: transactions.map((t) => [
          formatDateExport(t.date),
          t.type === 'depot' ? 'Dépôt' : 'Retrait',
          formatFCFA(t.montant),
          t.description || '',
        ]),
      }],
    });
  };

  const exporterEnWord = () => {
    exporterWord(`banque-export-${new Date().toISOString().split('T')[0]}.docx`, {
      titre: 'Compte bancaire',
      sousTitre: `Dépôts : ${formatFCFA(totalDepots)} — Retraits : ${formatFCFA(totalRetraits)} — Solde : ${formatFCFA(solde)}`,
      sections: [{
        colonnes: ['Date', 'Type', 'Montant', 'Description'],
        lignes: transactions.map((t) => [
          formatDateExport(t.date),
          t.type === 'depot' ? 'Dépôt' : 'Retrait',
          formatFCFA(t.montant),
          t.description || '',
        ]),
      }],
    });
  };

  const importerLignes = async (lignesValides) => {
    const { error } = await supabase.from('banque').insert(lignesValides);
    if (error) {
      alert("Erreur lors de l'import : " + error.message);
    } else {
      await charger();
      alert(`${lignesValides.length} transaction(s) importée(s) avec succès.`);
    }
  };

  const totalDepots = transactions.filter((t) => t.type === 'depot').reduce((s, t) => s + Number(t.montant), 0);
  const totalRetraits = transactions.filter((t) => t.type === 'retrait').reduce((s, t) => s + Number(t.montant), 0);
  const solde = totalDepots - totalRetraits;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <PageHeader
          eyebrow="Finances"
          title="Compte bancaire"
          description="Suivez les dépôts et retraits effectués sur le compte bancaire de l'église."
        />
        <ExportButtons
          onExcel={exporter}
          onPDF={exporterEnPDF}
          onWord={exporterEnWord}
          disabled={transactions.length === 0}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        <StatCard label="Solde actuel" value={formatFCFA(solde)} tone="info" />
        <StatCard label="Total dépôts" value={formatFCFA(totalDepots)} tone="success" />
        <StatCard label="Total retraits" value={formatFCFA(totalRetraits)} tone="danger" />
      </div>

      <Card style={{ marginBottom: '28px' }}>
        <SectionTitle>Nouvelle transaction bancaire</SectionTitle>

        <ToggleGroup
          value={type}
          onChange={setType}
          options={[
            { value: 'depot', label: '↓ Dépôt', color: 'var(--color-success)' },
            { value: 'retrait', label: '↑ Retrait', color: 'var(--color-danger)' },
          ]}
        />

        <Field label="Montant (FCFA)">
          <input type="number" min="0" placeholder="0" value={montant} onChange={(e) => setMontant(e.target.value)} style={fieldStyle} />
        </Field>

        <Field label="Description (ex : dépôt de la dîme, retrait pour loyer…)">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="2" style={fieldStyle} />
        </Field>

        <Button
          onClick={ajouter}
          variant={type === 'depot' ? 'success' : 'danger'}
          disabled={saving}
          style={{ width: '100%', marginTop: '4px' }}
        >
          {saving ? 'Enregistrement…' : type === 'depot' ? 'Enregistrer le dépôt' : 'Enregistrer le retrait'}
        </Button>
      </Card>

      <ExcelImporter
        titre="Importer depuis Excel ou Word"
        description="Colonnes attendues : Date (jj/mm/aaaa), Type (Dépôt ou Retrait), Montant, Description (facultative)."
        normaliser={normaliserLignesBanque}
        onConfirmer={importerLignes}
        modeleHref="/modeles/modele-banque.xlsx"
      />

      <SectionTitle>Historique ({transactions.length})</SectionTitle>

      {erreur && <p style={{ color: 'var(--color-danger)' }}>{erreur}</p>}
      {loading && <LoadingState label="Chargement des transactions…" />}

      {!loading && transactions.length === 0 && (
        <EmptyState icon="🏦" title="Aucune transaction bancaire" description="Ajoutez un dépôt ou un retrait ci-dessus." />
      )}

      {!loading && transactions.map((t) => (
        <ListRow key={t.id} tone={t.type === 'depot' ? 'success' : 'danger'}>
          <div>
            <div style={{ fontWeight: 600 }}>{t.type === 'depot' ? 'Dépôt' : 'Retrait'}</div>
            {t.description && <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{t.description}</div>}
            <div style={{ marginTop: '4px' }}>
              <Badge tone="info">{formatDateCourte(t.date)}</Badge>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontWeight: 700, fontSize: '17px', color: t.type === 'depot' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {t.type === 'depot' ? '+' : '-'}{formatFCFA(t.montant)}
            </span>
            <IconButton onClick={() => supprimer(t.id)} title="Supprimer" />
          </div>
        </ListRow>
      ))}
    </div>
  );
}
