import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Accueil', icon: '🏠' },
  { href: '/caisse', label: 'Caisse', icon: '💰' },
  { href: '/banque', label: 'Banque', icon: '🏦' },
  { href: '/bilan', label: 'Bilan', icon: '📊' },
  { href: '/predications', label: 'Prédications', icon: '📖' },
  { href: '/effectifs', label: 'Effectifs', icon: '👥' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav
        style={{
          background: 'var(--color-ink)',
          padding: '0 24px',
          boxShadow: 'var(--shadow-md)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>⛪</span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                color: '#FBFAF7',
                fontWeight: 600,
                fontSize: '18px',
                letterSpacing: '0.01em',
              }}
            >
              Gestion Église
            </span>
          </Link>

          {/* Navigation desktop */}
          <div style={{ display: 'none', gap: '4px' }} className="nav-desktop">
            {navItems.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                  <span
                    style={{
                      padding: '9px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: active ? 'rgba(176, 138, 46, 0.18)' : 'transparent',
                      color: active ? 'var(--color-gold)' : '#D8DCE6',
                      fontWeight: active ? 600 : 500,
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Bouton menu mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="nav-toggle"
            aria-label="Ouvrir le menu"
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 'var(--radius-sm)',
              color: '#FBFAF7',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ☰
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {menuOpen && (
          <div className="nav-mobile" style={{ paddingBottom: '12px' }}>
            {navItems.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                  <div
                    style={{
                      padding: '12px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: active ? 'rgba(176, 138, 46, 0.18)' : 'transparent',
                      color: active ? 'var(--color-gold)' : '#D8DCE6',
                      fontWeight: active ? 600 : 500,
                      fontSize: '15px',
                    }}
                  >
                    {item.icon} {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '20px',
          color: 'var(--color-text-muted)',
          fontSize: '13px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        © {new Date().getFullYear()} Gestion Église — Tous droits réservés
      </footer>

      <style jsx global>{`
        @media (min-width: 860px) {
          .nav-desktop {
            display: flex !important;
          }
          .nav-toggle {
            display: none !important;
          }
        }
        @media (max-width: 859px) {
          .nav-mobile {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
