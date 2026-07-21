import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { formatFCFA } from '../lib/format';
import { PageHeader, StatCard, Card, LoadingState } from '../components/ui';

const MENU = [
  { href: '/caisse', icon: '💰', title: 'Journal de caisse', desc: 'Entrées, sorties, catégories' },
  { href: '/banque', icon: '🏦', title: 'Compte bancaire', desc: 'Dépôts et retraits' },
  { href: '/bilan', icon: '📊', title: 'Bilan financier', desc: 'Vue consolidée et graphiques' },
  { href: '/predications', icon: '📖', title: 'Prédications', desc: 'Thèmes, orateurs, effectifs' },
  { href: '/effectifs', icon: '👥', title: 'Effectifs', desc: 'Registre des membres' },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ solde: 0, effectifTotal: 0, membresActifs: 0 });

  useEffect(() => {
    let annule = false;

    async function charger() {
      const [caisseRes, banqueRes, predRes, membresRes] = await Promise.all([
        supabase.from('caisse').select('type, montant'),
        supabase.from('banque').select('type, montant'),
        supabase.from('predications').select('total'),
        supabase.from('membres').select('id, actif'),
      ]);

      if (annule) return;

      const soldeCaisse = (caisseRes.data || []).reduce(
        (s, t) => s + (t.type === 'entree' ? Number(t.montant) : -Number(t.montant)), 0
      );
      const soldeBanque = (banqueRes.data || []).reduce(
        (s, t) => s + (t.type === 'depot' ? Number(t.montant) : -Number(t.montant)), 0
      );
      const effectifTotal = (predRes.data || []).reduce((s, p) => s + p.total, 0);
      const membresActifs = (membresRes.data || []).filter((m) => m.actif).length;

      setStats({ solde: soldeCaisse + soldeBanque, effectifTotal, membresActifs });
      setLoading(false);
    }

    charger();
    return () => { annule = true; };
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Tableau de bord"
        title="Gestion de l'église"
        description="Une vue d'ensemble des finances, de la vie spirituelle et de la communauté."
      />

      {loading ? (
        <LoadingState label="Chargement du tableau de bord…" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '36px' }}>
          <StatCard label="Solde global" value={formatFCFA(stats.solde)} tone="ink" />
          <StatCard label="Membres actifs" value={stats.membresActifs} tone="info" />
          <StatCard label="Fréquentation cumulée" value={stats.effectifTotal} tone="gold" />
        </div>
      )}

      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Accès rapide</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        {MENU.map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <Card
              style={{
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{item.icon}</div>
              <div style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '16px', marginBottom: '4px' }}>
                {item.title}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{item.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
