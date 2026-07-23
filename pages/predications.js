import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatDate } from '../lib/format';
import { exporterExcel, formatDateExport } from '../lib/excelExport';
import { exporterPDF } from '../lib/pdfExport';
import { exporterWord } from '../lib/docxExport';
import ExportButtons from '../components/ExportButtons';
import {
  PageHeader, StatCard, Card, SectionTitle, Button,
  Field, fieldStyle, EmptyState, LoadingState,
} from '../components/ui';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function Predications() {
  const [predications, setPredications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState('');

  const [date, setDate] = useState(todayISO());
  const [predicateur, setPredicateur] = useState('');
  const [theme, setTheme] = useState('');
  const [textes, setTextes] = useState('');
  const [hommes, setHommes] = useState(0);
  const [femmes, setFemmes] = useState(0);
  const [enfants, setEnfants] = useState(0);
  const [jeunes, setJeunes] = useState(0);

  const charger = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('predications')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      setErreur('Impossible de charger le registre des prédications.');
    } else {
      setPredications(data);
      setErreur('');
    }
    setLoading(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ajouter = async () => {
    if (!predicateur || !theme) {
      alert('Prédicateur et thème obligatoires.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('predications').insert({
      date,
      predicateur,
      theme,
      textes,
      hommes: Number(hommes) || 0,
      femmes: Number(femmes) || 0,
      enfants: Number(enfants) || 0,
      jeunes: Number(jeunes) || 0,
    });

    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      setPredicateur('');
      setTheme('');
      setTextes('');
      setHommes(0); setFemmes(0); setEnfants(0); setJeunes(0);
      await charger();
    }
    setSaving(false);
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer cette prédication ?')) return;
    const { error } = await supabase.from('predications').delete().eq('id', id);
    if (error) {
      alert('Erreur lors de la suppression : ' + error.message);
    } else {
      setPredications((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const totalGeneral = predications.reduce((s, p) => s + p.total, 0);
  const totalHommes = predications.reduce((s, p) => s + p.hommes, 0);
  const totalFemmes = predications.reduce((s, p) => s + p.femmes, 0);
  const totalEnfants = predications.reduce((s, p) => s + p.enfants, 0);
  const totalJeunes = predications.reduce((s, p) => s + p.jeunes, 0);
  const totalFormulaire = Number(hommes || 0) + Number(femmes || 0) + Number(enfants || 0) + Number(jeunes || 0);

  const lignesExport = () => predications.map((p) => ({
    Date: formatDateExport(p.date),
    'Prédicateur': p.predicateur,
    'Thème': p.theme,
    'Textes bibliques': p.textes || '',
    Hommes: p.hommes,
    Femmes: p.femmes,
    Enfants: p.enfants,
    Jeunes: p.jeunes,
    Total: p.total,
  }));

  const exporter = () => {
    exporterExcel(`predications-export-${new Date().toISOString().split('T')[0]}.xlsx`, [
      { nom: 'Prédications', lignes: lignesExport(), largeurs: [12, 20, 28, 20, 9, 9, 9, 9, 9] },
    ]);
  };

  const exporterEnPDF = () => {
    exporterPDF(`predications-export-${new Date().toISOString().split('T')[0]}.pdf`, {
      titre: 'Registre des prédications',
      sousTitre: `Cumul total : ${totalGeneral} participants sur ${predications.length} culte(s)`,
      sections: [{
        colonnes: ['Date', 'Prédicateur', 'Thème', 'H', 'F', 'E', 'J', 'Total'],
        lignes: predications.map((p) => [
          formatDateExport(p.date), p.predicateur, p.theme, p.hommes, p.femmes, p.enfants, p.jeunes, p.total,
        ]),
      }],
    });
  };

  const exporterEnWord = () => {
    exporterWord(`predications-export-${new Date().toISOString().split('T')[0]}.docx`, {
      titre: 'Registre des prédications',
      sousTitre: `Cumul total : ${totalGeneral} participants sur ${predications.length} culte(s)`,
      sections: [{
        colonnes: ['Date', 'Prédicateur', 'Thème', 'H', 'F', 'E', 'J', 'Total'],
        lignes: predications.map((p) => [
          formatDateExport(p.date), p.predicateur, p.theme, p.hommes, p.femmes, p.enfants, p.jeunes, p.total,
        ]),
      }],
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <PageHeader
          eyebrow="Vie spirituelle"
          title="Registre des prédications"
          description="Gardez une trace des cultes, des orateurs et de la fréquentation."
        />
        <ExportButtons onExcel={exporter} onPDF={exporterEnPDF} onWord={exporterEnWord} disabled={predications.length === 0} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        <StatCard label="Cumul total" value={totalGeneral} tone="info" />
        <StatCard label="Hommes" value={totalHommes} tone="success" />
        <StatCard label="Femmes" value={totalFemmes} tone="gold" />
        <StatCard label="Enfants" value={totalEnfants} tone="danger" />
        <StatCard label="Jeunes" value={totalJeunes} tone="ink" />
      </div>

      <Card style={{ marginBottom: '28px' }}>
        <SectionTitle>Nouvelle prédication</SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle} />
          </Field>
          <Field label="Prédicateur">
            <input type="text" placeholder="Nom" value={predicateur} onChange={(e) => setPredicateur(e.target.value)} style={fieldStyle} />
          </Field>
        </div>

        <Field label="Thème">
          <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} style={fieldStyle} />
        </Field>

        <Field label="Textes bibliques">
          <input type="text" placeholder="ex : Jean 3:16" value={textes} onChange={(e) => setTextes(e.target.value)} style={fieldStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '6px' }}>
          <Field label="Hommes">
            <input type="number" min="0" value={hommes} onChange={(e) => setHommes(e.target.value)} style={fieldStyle} />
          </Field>
          <Field label="Femmes">
            <input type="number" min="0" value={femmes} onChange={(e) => setFemmes(e.target.value)} style={fieldStyle} />
          </Field>
          <Field label="Enfants">
            <input type="number" min="0" value={enfants} onChange={(e) => setEnfants(e.target.value)} style={fieldStyle} />
          </Field>
          <Field label="Jeunes">
            <input type="number" min="0" value={jeunes} onChange={(e) => setJeunes(e.target.value)} style={fieldStyle} />
          </Field>
        </div>

        <div style={{ textAlign: 'center', margin: '14px 0', fontSize: '15px', color: 'var(--color-text-muted)' }}>
          Effectif total : <strong style={{ color: 'var(--color-ink)' }}>{totalFormulaire}</strong> personnes
        </div>

        <Button onClick={ajouter} variant="primary" disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Enregistrement…' : 'Enregistrer la prédication'}
        </Button>
      </Card>

      <SectionTitle>Historique ({predications.length})</SectionTitle>

      {erreur && <p style={{ color: 'var(--color-danger)' }}>{erreur}</p>}
      {loading && <LoadingState label="Chargement du registre…" />}

      {!loading && predications.length === 0 && (
        <EmptyState icon="📖" title="Aucune prédication enregistrée" description="Ajoutez la première prédication ci-dessus." />
      )}

      {!loading && predications.map((p) => (
        <Card key={p.id} style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-ink)' }}>{p.theme}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{p.predicateur}{p.textes ? ` — ${p.textes}` : ''}</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>📅 {formatDate(p.date)}</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--color-info)', color: 'white', padding: '8px 14px', borderRadius: 'var(--radius-sm)', height: 'fit-content' }}>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>TOTAL</div>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>{p.total}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '14px' }}>
            <MiniStat label="Hommes" value={p.hommes} />
            <MiniStat label="Femmes" value={p.femmes} />
            <MiniStat label="Enfants" value={p.enfants} />
            <MiniStat label="Jeunes" value={p.jeunes} />
          </div>

          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <Button variant="ghost" onClick={() => supprimer(p.id)} style={{ color: 'var(--color-danger)' }}>
              🗑️ Supprimer
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ background: '#F7F6F2', borderRadius: 'var(--radius-sm)', padding: '8px', textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{value}</div>
    </div>
  );
}
