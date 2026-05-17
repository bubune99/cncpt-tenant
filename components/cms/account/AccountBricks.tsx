/**
 * Atlas Customer Account Bricks
 * At-a-glance metric tiles: credit, loyalty, subs, open orders.
 * Uses --wl-* tokens exclusively.
 */

interface Brick {
  readonly label: string;
  readonly value: string;
  readonly delta: string;
  readonly accent?: boolean;
  readonly up?: boolean;
}

interface AccountBricksProps {
  readonly storeCredit?: string;
  readonly loyaltyPts?: number;
  readonly activeSubs?: number;
  readonly openOrders?: number;
}

export function AccountBricks({
  storeCredit = '$0.00',
  loyaltyPts = 0,
  activeSubs = 0,
  openOrders = 0,
}: AccountBricksProps) {
  const bricks: readonly Brick[] = [
    { label: 'store credit', value: storeCredit, delta: 'from returns', accent: true },
    { label: 'loyalty pts',  value: String(loyaltyPts), delta: 'points balance' },
    { label: 'active subs',  value: String(activeSubs), delta: 'subscriptions' },
    { label: 'open orders',  value: String(openOrders), delta: openOrders > 0 ? 'in transit' : 'all delivered', up: openOrders > 0 },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}
    >
      {bricks.map((brick) => (
        <div
          key={brick.label}
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--wl-text-soft)',
            }}
          >
            {brick.label}
          </span>
          <span
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontSize: 28,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: brick.accent ? 'var(--wl-accent)' : 'var(--wl-text)',
            }}
          >
            {brick.value}
          </span>
          <span
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontStyle: 'italic',
              fontSize: 12,
              color: brick.up ? 'var(--wl-success)' : 'var(--wl-text-soft)',
            }}
          >
            {brick.delta}
          </span>
        </div>
      ))}
    </div>
  );
}
