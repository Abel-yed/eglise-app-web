/**
 * Composants d'interface partagés.
 * Centraliser ces éléments évite la duplication de styles inline
 * et garantit une identité visuelle cohérente sur tout le site.
 */

export function PageHeader({ eyebrow, title, description }) {
  return (
    <header style={{ marginBottom: '32px' }}>
      {eyebrow && (
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            marginBottom: '6px',
          }}
        >
          {eyebrow}
        </div>
      )}
      <h1 style={{ fontSize: '32px', fontWeight: 600 }}>{title}</h1>
      {description && (
        <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '15px', maxWidth: '620px' }}>
          {description}
        </p>
      )}
    </header>
  );
}

export function StatCard({ label, value, tone = 'ink' }) {
  const tones = {
    ink: { bg: 'var(--color-ink)', fg: 'var(--color-text-inverse)' },
    gold: { bg: 'var(--color-gold)', fg: '#2A2110' },
    success: { bg: 'var(--color-success)', fg: 'var(--color-text-inverse)' },
    danger: { bg: 'var(--color-danger)', fg: 'var(--color-text-inverse)' },
    info: { bg: 'var(--color-info)', fg: 'var(--color-text-inverse)' },
  };
  const t = tones[tone] || tones.ink;

  return (
    <div
      style={{
        background: t.bg,
        color: t.fg,
        borderRadius: 'var(--radius-md)',
        padding: '18px 20px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: 0.85 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600, marginTop: '6px' }}>
        {value}
      </div>
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <h3
      style={{
        fontSize: '18px',
        fontWeight: 600,
        margin: '0 0 16px',
        color: 'var(--color-ink)',
      }}
    >
      {children}
    </h3>
  );
}

const baseButton = {
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
  padding: '11px 18px',
  transition: 'opacity 0.15s ease, transform 0.05s ease',
};

export function Button({ children, onClick, variant = 'primary', type = 'button', style, disabled }) {
  const variants = {
    primary: { background: 'var(--color-ink)', color: 'var(--color-text-inverse)' },
    gold: { background: 'var(--color-gold)', color: '#2A2110' },
    success: { background: 'var(--color-success)', color: 'var(--color-text-inverse)' },
    danger: { background: 'var(--color-danger)', color: 'var(--color-text-inverse)' },
    ghost: { background: 'transparent', color: 'var(--color-ink)', border: '1px solid var(--color-border)' },
    subtle: { background: '#EEEDE7', color: 'var(--color-ink)' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseButton,
        ...variants[variant],
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
    </button>
  );
}

export function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            ...baseButton,
            flex: 1,
            background: value === opt.value ? opt.color : '#EEEDE7',
            color: value === opt.value ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export const fieldStyle = {
  width: '100%',
  padding: '11px 12px',
  marginBottom: '12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: '15px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
};

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

export function EmptyState({ icon = '🗂️', title, description }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: 'var(--color-text-muted)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontWeight: 600, color: 'var(--color-ink)', marginBottom: '4px' }}>{title}</div>
      {description && <div style={{ fontSize: '14px' }}>{description}</div>}
    </div>
  );
}

export function Badge({ children, tone = 'info' }) {
  const tones = {
    success: { bg: 'var(--color-success-soft)', fg: 'var(--color-success)' },
    danger: { bg: 'var(--color-danger-soft)', fg: 'var(--color-danger)' },
    info: { bg: 'var(--color-info-soft)', fg: 'var(--color-info)' },
    gold: { bg: 'var(--color-gold-soft)', fg: '#7A5B14' },
  };
  const t = tones[tone] || tones.info;
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        fontSize: '12px',
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: '999px',
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}

export function ListRow({ children, tone }) {
  const tones = {
    success: 'var(--color-success-soft)',
    danger: 'var(--color-danger-soft)',
    neutral: '#FBFAF7',
  };
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        marginBottom: '8px',
        background: tones[tone] || tones.neutral,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        flexWrap: 'wrap',
        gap: '10px',
      }}
    >
      {children}
    </div>
  );
}

export function IconButton({ onClick, label = '🗑️', title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '17px',
        padding: '4px 6px',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--color-danger)',
      }}
    >
      {label}
    </button>
  );
}

export function LoadingState({ label = 'Chargement…' }) {
  return (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      {label}
    </div>
  );
}
