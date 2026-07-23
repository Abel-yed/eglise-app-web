import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatDate } from '../lib/format';
import { exporterExcel, formatDateExport } from '../lib/excelExport';
import { exporterPDF } from '../lib/pdfExport';
import { exporterWord } from '../lib/docxExport';
import ExportButtons from '../components/ExportButtons';
import {
  PageHeader, StatCard, Card, SectionTitle, Button,
  Field, fieldStyle, EmptyState, LoadingState, Badge, IconButton,
} from '../components/ui';

export default function Effectifs() {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState('');
  const [filtre, setFiltre] = useState('Tous');
  const [recherche, setRecherche] = useState('');

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState('Homme');
  const [categorie, setCategorie] = useState('Adulte');
  const [telephone, setTelephone] = useState('');
  const [fonction, setFonction] = useState('');

  const charger = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('membres')
      .select('*')
      .order('nom', { ascending: true });

    if (error) {
      setErreur('Impossible de charger le registre des membres.');
    } else {
      setMembres(data);
      setErreur('');
    }
    setLoading(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ajouter = async () => {
    if (!nom || !prenom) {
      alert('Nom et prénom obligatoires.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('membres').insert({
      nom, prenom, sexe, categorie, telephone, fonction,
    });

    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      setNom(''); setPrenom(''); setTelephone(''); setFonction('');
      setSexe('Homme'); setCategorie('Adulte');
      await charger();
    }
    setSaving(false);
  };

  const toggleActif = async (m) => {
    const { error } = await supabase.from('membres').update({ actif: !m.actif }).eq('id', m.id);
    if (!error) {
      setMembres((prev) => prev.map((x) => (x.id === m.id ? { ...x, actif: !x.actif } : x)));
    }
  };

  const supprimer = async (id) => {
    if (!confirm('Retirer définitivement ce membre du registre ?')) return;
    const { error } = await supabase.from('membres').delete().eq('id', id);
    if (error) {
      alert('Erreur lors de la suppression : ' + error.message);
    } else {
      setMembres((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const stats = useMemo(() => {
    const actifs = membres.filter((m) => m.actif);
    return {
      total: actifs.length,
      hommes: actifs.filter((m) => m.sexe === 'Homme').length,
      femmes: actifs.filter((m) => m.sexe === 'Femme').length,
      jeunes: actifs.filter((m) => m.categorie === 'Jeune').length,
      enfants: actifs.filter((m) => m.categorie === 'Enfant').length,
    };
  }, [membres]);

  const listeAffichee = useMemo(() => {
    return membres.filter((m) => {
      const matchFiltre = filtre === 'Tous' || m.categorie === filtre;
      const q = recherche.trim().toLowerCase();
      const matchRecherche = !q || `${m.nom} ${m.prenom}`.toLowerCase().includes(q);
      return matchFiltre && matchRecherche;
    });
  }, [membres, filtre, recherche]);

  const exporter = () => {
    const lignes = listeAffichee.map((m) => ({
      Nom: m.nom, Prénom: m.prenom, Sexe: m.sexe, 'Catégorie': m.categorie,
      Téléphone: m.telephone || '', Fonction: m.fonction || '',
      'Date d\'adhésion': formatDateExport(m.date_adhesion), Statut: m.actif ? 'Actif' : 'Inactif',
    }));
    exporterExcel(`effectifs-export-${new Date().toISOString().split('T')[0]}.xlsx`, [
      { nom: 'Effectifs', lignes, largeurs: [16, 16, 8, 10, 14, 18, 14, 10] },
    ]);
  };

  const lignesTableau = () => listeAffichee.map((m) => [
    `${m.nom} ${m.prenom}`, m.sexe, m.categorie, m.fonction || '—',
    formatDateExport(m.date_adhesion), m.actif ? 'Actif' : 'Inactif',
  ]);

  const exporterEnPDF = () => {
    exporterPDF(`effectifs-export-${new Date().toISOString().split('T')[0]}.pdf`, {
      titre: "Effectifs de l'église",
      sousTitre: `${stats.total} membre(s) actif(s) — ${stats.hommes} hommes, ${stats.femmes} femmes`,
      sections: [{
        colonnes: ['Nom', 'Sexe', 'Catégorie', 'Fonction', 'Adhésion', 'Statut'],
        lignes: lignesTableau(),
      }],
    });
  };

  const exporterEnWord = () => {
    exporterWord(`effectifs-export-${new Date().toISOString().split('T')[0]}.docx`, {
      titre: "Effectifs de l'église",
      sousTitre: `${stats.total} membre(s) actif(s) — ${stats.hommes} hommes, ${stats.femmes} femmes`,
      sections: [{
        colonnes: ['Nom', 'Sexe', 'Catégorie', 'Fonction', 'Adhésion', 'Statut'],
        lignes: lignesTableau(),
      }],
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <PageHeader
          eyebrow="Communauté"
          title="Effectifs de l'église"
          description="Le registre des membres, avec répartition par sexe, âge et statut d'engagement."
        />
        <ExportButtons onExcel={exporter} onPDF={exporterEnPDF} onWord={exporterEnWord} disabled={membres.length === 0} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        <StatCard label="Membres actifs" value={stats.total} tone="ink" />
        <StatCard label="Hommes" value={stats.hommes} tone="success" />
        <StatCard label="Femmes" value={stats.femmes} tone="gold" />
        <StatCard label="Jeunes" value={stats.jeunes} tone="info" />
        <StatCard label="Enfants" value={stats.enfants} tone="danger" />
      </div>

      <Card style={{ marginBottom: '28px' }}>
        <SectionTitle>Ajouter un membre</SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Nom">
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} style={fieldStyle} />
          </Field>
          <Field label="Prénom">
            <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} style={fieldStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Sexe">
            <select value={sexe} onChange={(e) => setSexe(e.target.value)} style={fieldStyle}>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </select>
          </Field>
          <Field label="Catégorie">
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} style={fieldStyle}>
              <option value="Adulte">Adulte</option>
              <option value="Jeune">Jeune</option>
              <option value="Enfant">Enfant</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Téléphone (optionnel)">
            <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} style={fieldStyle} />
          </Field>
          <Field label="Fonction (optionnelle)">
            <input type="text" placeholder="ex : Diacre, Chorale…" value={fonction} onChange={(e) => setFonction(e.target.value)} style={fieldStyle} />
          </Field>
        </div>

        <Button onClick={ajouter} variant="primary" disabled={saving} style={{ width: '100%', marginTop: '4px' }}>
          {saving ? 'Enregistrement…' : 'Ajouter au registre'}
        </Button>
      </Card>

      <SectionTitle>Registre ({listeAffichee.length})</SectionTitle>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher un membre…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ ...fieldStyle, marginBottom: 0, maxWidth: '260px' }}
        />
        {['Tous', 'Adulte', 'Jeune', 'Enfant'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: filtre === f ? 'var(--color-ink)' : '#EEEDE7',
              color: filtre === f ? 'white' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {erreur && <p style={{ color: 'var(--color-danger)' }}>{erreur}</p>}
      {loading && <LoadingState label="Chargement du registre…" />}

      {!loading && listeAffichee.length === 0 && (
        <EmptyState icon="👥" title="Aucun membre trouvé" description="Ajustez vos filtres ou ajoutez un nouveau membre." />
      )}

      {!loading && listeAffichee.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#F7F6F2', textAlign: 'left' }}>
                  <Th>Nom</Th>
                  <Th>Sexe</Th>
                  <Th>Catégorie</Th>
                  <Th>Fonction</Th>
                  <Th>Adhésion</Th>
                  <Th>Statut</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {listeAffichee.map((m) => (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <Td>
                      <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{m.nom} {m.prenom}</div>
                      {m.telephone && <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{m.telephone}</div>}
                    </Td>
                    <Td>{m.sexe}</Td>
                    <Td>{m.categorie}</Td>
                    <Td>{m.fonction || '—'}</Td>
                    <Td>{formatDate(m.date_adhesion)}</Td>
                    <Td>
                      <button
                        onClick={() => toggleActif(m)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                        title="Changer le statut"
                      >
                        <Badge tone={m.actif ? 'success' : 'danger'}>{m.actif ? 'Actif' : 'Inactif'}</Badge>
                      </button>
                    </Td>
                    <Td>
                      <IconButton onClick={() => supprimer(m.id)} title="Retirer du registre" />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th style={{ padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>{children}</th>;
}
function Td({ children }) {
  return <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>{children}</td>;
}
