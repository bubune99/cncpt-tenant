/**
 * Atlas Customer Owner Greeting
 * Hand-set note from the shop owner with tilted signature.
 * Uses --wl-* tokens exclusively.
 */

interface OwnerGreetingProps {
  readonly ownerName: string;
  readonly ownerInitial: string;
  readonly message: string;
  readonly show?: boolean;
}

export function OwnerGreeting({ ownerName, ownerInitial, message, show = true }: OwnerGreetingProps) {
  if (!show) return null;

  return (
    <div
      style={{
        background: 'var(--wl-surface)',
        border: '1px solid var(--wl-rule)',
        borderRadius: 'var(--wl-radius)',
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent left rule */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 3,
          background: 'var(--wl-accent)',
        }}
      />

      <div
        style={{
          fontFamily: 'var(--wl-font-mono)',
          fontSize: 10,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--wl-text-soft)',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--wl-accent)',
            color: 'var(--wl-accent-fg)',
            fontFamily: 'var(--wl-font-display)',
            fontStyle: 'italic',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            flexShrink: 0,
          }}
        >
          {ownerInitial}
        </span>
        A note from {ownerName}
      </div>

      <p
        style={{
          fontFamily: 'var(--wl-font-display)',
          fontStyle: 'italic',
          fontSize: 16,
          lineHeight: 1.45,
          color: 'var(--wl-text)',
          margin: '0 0 10px',
        }}
      >
        {message}
      </p>

      <div
        style={{
          marginTop: 12,
          fontFamily: "'DM Serif Display', 'Spectral', serif",
          fontStyle: 'italic',
          fontSize: 22,
          color: 'var(--wl-accent)',
          transform: 'rotate(-2deg)',
          display: 'inline-block',
        }}
      >
        {ownerName} —
      </div>
    </div>
  );
}
