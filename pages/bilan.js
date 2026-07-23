import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatFCFA } from '../lib/format';
import { exporterExcel, formatDateExport } from '../lib/excelExport';
import { exporterPDF } from '../lib/pdfExport';
import { exporterWord } from '../lib/docxExport';
import ExportButtons from '../components/ExportButtons';
import { PageHeader, StatCard, Card, SectionTitle, LoadingState, EmptyState, fieldStyle } from '../components/ui';

const MOIS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function Bilan() {
  const [caisse, setCaisse] = useState([]);
  const [banque, setBanque] = useState([]);
  const [predications, setPredications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());

  const charger = useCallback(async () => {
    setLoading(true);
    const [resCaisse, resBanque, resPred] = await Promise.all([
      supabase.from('caisse').select('*').order('date', { ascending: true }),
      supabase.from('banque').select('*').order('date', { ascending: true }),
      supabase.from('predications').select('*').order('date', { ascending: true }),
    ]);

    if (resCaisse.error || resBanque.error || resPred.error) {
      setErreur('Impossible de charger les données du bilan.');
    } else {
      setCaisse(resCaisse.data);
      setBanque(resBanque.data);
      setPredications(resPred.data);
      setErreur('');
    }
    setLoading(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // Liste des années disponibles dans les données, pour peupler le sélecteur
  const anneesDisponibles = useMemo(() => {
    const set = new Set([new Date().getFullYear()]);
    [...caisse, ...banque, ...predications].forEach((item) => {
      if (item.date) set.add(new Date(item.date).getFullYear());
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [caisse, banque, predications]);

  const caisseAnnee = useMemo(() => caisse.filter((t) => new Date(t.date).getFullYear() === Number(annee)), [caisse, annee]);
  const banqueAnnee = useMemo(() => banque.filter((t) => new Date(t.date).getFullYear() === Number(annee)), [banque, annee]);
  const predicationsAnnee = useMemo(() => predications.filter((p) => new Date(p.date).getFullYear() === Number(annee)), [predications, annee]);

  const totaux = useMemo(() => {
    const totalEntrees = caisseAnnee.filter((t) => t.type === 'entree').reduce((s, t) => s + Number(t.montant), 0);
    const totalSorties = caisseAnnee.filter((t) => t.type === 'sortie').reduce((s, t) => s + Number(t.montant), 0);
    const soldeCaisse = totalEntrees - totalSorties;

    const totalDepots = banqueAnnee.filter((t) => t.type === 'depot').reduce((s, t) => s + Number(t.montant), 0);
    const totalRetraits = banqueAnnee.filter((t) => t.type === 'retrait').reduce((s, t) => s + Number(t.montant), 0);
    const soldeBanque = totalDepots - totalRetraits;

    const soldeGlobal = soldeCaisse + soldeBanque;

    return { totalEntrees, totalSorties, soldeCaisse, totalDepots, totalRetraits, soldeBanque, soldeGlobal };
  }, [caisseAnnee, banqueAnnee]);

  const effectifsAnnee = useMemo(() => {
    return {
      total: predicationsAnnee.reduce((s, p) => s + p.total, 0),
      hommes: predicationsAnnee.reduce((s, p) => s + p.hommes, 0),
      femmes: predicationsAnnee.reduce((s, p) => s + p.femmes, 0),
      enfants: predicationsAnnee.reduce((s, p) => s + p.enfants, 0),
      jeunes: predicationsAnnee.reduce((s, p) => s + p.jeunes, 0),
      cultes: predicationsAnnee.length,
    };
  }, [predicationsAnnee]);

  const parCategorie = useMemo(() => {
    const map = {};
    caisseAnnee.forEach((t) => {
      if (!map[t.categorie]) map[t.categorie] = { entree: 0, sortie: 0 };
      map[t.categorie][t.type] += Number(t.montant);
    });
    return Object.entries(map)
      .map(([categorie, v]) => ({ categorie, ...v, total: v.entree + v.sortie }))
      .sort((a, b) => b.total - a.total);
  }, [caisseAnnee]);

  const parMois = useMemo(() => {
    const map = {};
    for (let i = 0; i < 12; i++) map[i] = { mois: i, entree: 0, sortie: 0 };
    caisseAnnee.forEach((t) => {
      const m = new Date(t.date).getMonth();
      map[m][t.type] += Number(t.montant);
    });
    return Object.values(map);
  }, [caisseAnnee]);

  const maxMois = Math.max(1, ...parMois.map((m) => Math.max(m.entree, m.sortie)));
  const maxCategorie = Math.max(1, ...parCategorie.map((c) => c.total));

  const exporter = () => {
    const resume = [
      { Rubrique: 'Solde global', Montant: totaux.soldeGlobal },
      { Rubrique: 'Solde caisse', Montant: totaux.soldeCaisse },
      { Rubrique: 'Solde banque', Montant: totaux.soldeBanque },
      { Rubrique: 'Recettes (caisse)', Montant: totaux.totalEntrees },
      { Rubrique: 'Dépenses (caisse)', Montant: totaux.totalSorties },
      { Rubrique: 'Dépôts (banque)', Montant: totaux.totalDepots },
      { Rubrique: 'Retraits (banque)', Montant: totaux.totalRetraits },
    ];

    const categories = parCategorie.map((c) => ({
      'Catégorie': c.categorie,
      Entrées: c.entree,
      Sorties: c.sortie,
      Total: c.total,
    }));

    const mensuel = parMois.map((m) => ({
      Mois: MOIS_LABELS[m.mois],
      Entrées: m.entree,
      Sorties: m.sortie,
    }));

    const effectifs = [
      { Rubrique: 'Cultes tenus', Valeur: effectifsAnnee.cultes },
      { Rubrique: 'Total cumulé', Valeur: effectifsAnnee.total },
      { Rubrique: 'Hommes', Valeur: effectifsAnnee.hommes },
      { Rubrique: 'Femmes', Valeur: effectifsAnnee.femmes },
      { Rubrique: 'Enfants', Valeur: effectifsAnnee.enfants },
      { Rubrique: 'Jeunes', Valeur: effectifsAnnee.jeunes },
    ];

    const detailCaisse = caisseAnnee.map((t) => ({
      Date: formatDateExport(t.date),
      Type: t.type === 'entree' ? 'Entrée' : 'Sortie',
      'Catégorie': t.categorie,
      Montant: Number(t.montant),
      Description: t.description || '',
    }));

    const detailBanque = banqueAnnee.map((t) => ({
      Date: formatDateExport(t.date),
      Type: t.type === 'depot' ? 'Dépôt' : 'Retrait',
      Montant: Number(t.montant),
      Description: t.description || '',
    }));

    exporterExcel(`bilan-${annee}.xlsx`, [
      { nom: 'Résumé', lignes: resume, largeurs: [26, 14] },
      { nom: 'Catégories (caisse)', lignes: categories, largeurs: [26, 12, 12, 12] },
      { nom: 'Évolution mensuelle', lignes: mensuel, largeurs: [10, 12, 12] },
      { nom: 'Effectifs', lignes: effectifs, largeurs: [20, 12] },
      { nom: 'Détail caisse', lignes: detailCaisse, largeurs: [12, 10, 26, 12, 40] },
      { nom: 'Détail banque', lignes: detailBanque, largeurs: [12, 10, 12, 40] },
    ]);
  };

  const sectionsRapport = () => [
    {
      titre: 'Résumé financier',
      colonnes: ['Rubrique', 'Montant'],
      lignes: [
        ['Solde global', formatFCFA(totaux.soldeGlobal)],
        ['Solde caisse', formatFCFA(totaux.soldeCaisse)],
        ['Solde banque', formatFCFA(totaux.soldeBanque)],
        ['Recettes (caisse)', formatFCFA(totaux.totalEntrees)],
        ['Dépenses (caisse)', formatFCFA(totaux.totalSorties)],
        ['Dépôts (banque)', formatFCFA(totaux.totalDepots)],
        ['Retraits (banque)', formatFCFA(totaux.totalRetraits)],
      ],
    },
    {
      titre: 'Répartition par catégorie (caisse)',
      colonnes: ['Catégorie', 'Entrées', 'Sorties', 'Total'],
      lignes: parCategorie.map((c) => [c.categorie, formatFCFA(c.entree), formatFCFA(c.sortie), formatFCFA(c.total)]),
    },
    {
      titre: 'Évolution mensuelle',
      colonnes: ['Mois', 'Entrées', 'Sorties'],
      lignes: parMois.map((m) => [MOIS_LABELS[m.mois], formatFCFA(m.entree), formatFCFA(m.sortie)]),
    },
    {
      titre: 'Effectifs des prédications',
      colonnes: ['Rubrique', 'Valeur'],
      lignes: [
        ['Cultes tenus', effectifsAnnee.cultes],
        ['Total cumulé', effectifsAnnee.total],
        ['Hommes', effectifsAnnee.hommes],
        ['Femmes', effectifsAnnee.femmes],
        ['Enfants', effectifsAnnee.enfants],
        ['Jeunes', effectifsAnnee.jeunes],
      ],
    },
  ];

  const exporterEnPDF = () => {
    exporterPDF(`bilan-${annee}.pdf`, {
      titre: `Bilan de l'exercice ${annee}`,
      sousTitre: `Solde global : ${formatFCFA(totaux.soldeGlobal)}`,
      sections: sectionsRapport(),
    });
  };

  const exporterEnWord = () => {
    exporterWord(`bilan-${annee}.docx`, {
      titre: `Bilan de l'exercice ${annee}`,
      sousTitre: `Solde global : ${formatFCFA(totaux.soldeGlobal)}`,
      sections: sectionsRapport(),
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <PageHeader
          eyebrow="Finances"
          title={`Bilan de l'exercice ${annee}`}
          description="Vue d'ensemble consolidée de la caisse, du compte bancaire et de la fréquentation de l'église."
        />
        <ExportButtons
          onExcel={exporter}
          onPDF={exporterEnPDF}
          onWord={exporterEnWord}
          disabled={loading || caisseAnnee.length === 0}
        />
      </div>

      <div style={{ marginBottom: '24px', maxWidth: '200px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
          Année de l'exercice
        </label>
        <select value={annee} onChange={(e) => setAnnee(Number(e.target.value))} style={fieldStyle}>
          {anneesDisponibles.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {erreur && <p style={{ color: 'var(--color-danger)' }}>{erreur}</p>}
      {loading && <LoadingState label="Calcul du bilan…" />}

      {!loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <StatCard label="Solde global" value={formatFCFA(totaux.soldeGlobal)} tone="ink" />
            <StatCard label="Solde caisse" value={formatFCFA(totaux.soldeCaisse)} tone="info" />
            <StatCard label="Solde banque" value={formatFCFA(totaux.soldeBanque)} tone="gold" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <StatCard label="Recettes (caisse)" value={formatFCFA(totaux.totalEntrees)} tone="success" />
            <StatCard label="Dépenses (caisse)" value={formatFCFA(totaux.totalSorties)} tone="danger" />
            <StatCard label="Dépôts (banque)" value={formatFCFA(totaux.totalDepots)} tone="success" />
            <StatCard label="Retraits (banque)" value={formatFCFA(totaux.totalRetraits)} tone="danger" />
          </div>

          <Card style={{ marginBottom: '28px' }}>
            <SectionTitle>Évolution mensuelle (caisse) — {annee}</SectionTitle>
            {caisseAnnee.length === 0 ? (
              <EmptyState icon="📊" title="Pas encore de données" description={`Aucune transaction de caisse enregistrée en ${annee}.`} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '200px', padding: '0 4px', overflowX: 'auto' }}>
                {parMois.map((m, i) => (
                  <div key={i} style={{ flex: '1 0 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '160px' }}>
                      <div
                        title={`Entrées : ${formatFCFA(m.entree)}`}
                        style={{
                          width: '13px',
                          height: `${(m.entree / maxMois) * 160}px`,
                          background: 'var(--color-success)',
                          borderRadius: '4px 4px 0 0',
                          minHeight: m.entree > 0 ? '3px' : 0,
                        }}
                      />
                      <div
                        title={`Sorties : ${formatFCFA(m.sortie)}`}
                        style={{
                          width: '13px',
                          height: `${(m.sortie / maxMois) * 160}px`,
                          background: 'var(--color-danger)',
                          borderRadius: '4px 4px 0 0',
                          minHeight: m.sortie > 0 ? '3px' : 0,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                      {MOIS_LABELS[m.mois]}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '18px', marginTop: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--color-success)', borderRadius: '2px', marginRight: '6px' }} />Entrées</span>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--color-danger)', borderRadius: '2px', marginRight: '6px' }} />Sorties</span>
            </div>
          </Card>

          <Card style={{ marginBottom: '28px' }}>
            <SectionTitle>Répartition par catégorie (caisse) — {annee}</SectionTitle>
            {parCategorie.length === 0 ? (
              <EmptyState icon="🗂️" title="Pas encore de données" description="Les catégories apparaîtront ici dès la première transaction." />
            ) : (
              <div>
                {parCategorie.map((c) => (
                  <div key={c.categorie} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{c.categorie}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{formatFCFA(c.total)}</span>
                    </div>
                    <div style={{ background: '#EEEDE7', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(c.total / maxCategorie) * 100}%`,
                          height: '100%',
                          background: c.entree >= c.sortie ? 'var(--color-success)' : 'var(--color-danger)',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Effectifs cumulés des prédications — {annee}</SectionTitle>
            {predicationsAnnee.length === 0 ? (
              <EmptyState icon="👥" title={`Aucune prédication en ${annee}`} description="Les effectifs apparaîtront ici dès la première prédication enregistrée." />
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '4px' }}>
                  {effectifsAnnee.total} <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--color-text-muted)' }}>participants cumulés sur {effectifsAnnee.cultes} culte{effectifsAnnee.cultes > 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '16px' }}>
                  <StatCard label="Hommes" value={effectifsAnnee.hommes} tone="success" />
                  <StatCard label="Femmes" value={effectifsAnnee.femmes} tone="gold" />
                  <StatCard label="Enfants" value={effectifsAnnee.enfants} tone="danger" />
                  <StatCard label="Jeunes" value={effectifsAnnee.jeunes} tone="info" />
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
