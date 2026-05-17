/**
 * Atlas Customer Lifecycle Ribbon
 * Shows the customer's relationship stage with the shop.
 * Uses --wl-* tokens exclusively.
 */

type LifecycleStage = 'new' | 'repeat' | 'regular' | 'loyal' | 'vip';
type StepState = 'done' | 'now' | 'future';

interface LifecycleStep {
  readonly key: LifecycleStage;
  readonly label: string;
  readonly sub: string;
  readonly state: StepState;
}

interface LifecycleRibbonProps {
  readonly current?: LifecycleStage;
  readonly memberSince?: string;
}

function getSteps(current: LifecycleStage): readonly LifecycleStep[] {
  const ORDER: readonly LifecycleStage[] = ['new', 'repeat', 'regular', 'loyal', 'vip'];
  const currentIdx = ORDER.indexOf(current);

  const META: Record<LifecycleStage, string> = {
    new:     'since joining',
    repeat:  'after 3 orders',
    regular: 'after 6 orders',
    loyal:   'you are here',
    vip:     '3 orders away',
  };

  return ORDER.map((key, idx) => {
    let state: StepState;
    if (idx < currentIdx) state = 'done';
    else if (idx === currentIdx) state = 'now';
    else state = 'future';

    return { key, label: key.charAt(0).toUpperCase() + key.slice(1), sub: META[key], state };
  });
}

export function LifecycleRibbon({ current = 'loyal', memberSince }: LifecycleRibbonProps) {
  const steps = getSteps(current);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {memberSince && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--wl-text-faint)',
            }}
          >
            Since {memberSince}
          </span>
        </div>
      )}
      <div
        aria-label="Your relationship with the shop"
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: 'var(--wl-surface-2)',
          border: '1px solid var(--wl-rule)',
          borderRadius: 'var(--wl-radius)',
          padding: 4,
          gap: 2,
        }}
      >
        {steps.map((step) => (
          <div
            key={step.key}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 'var(--wl-radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              background: step.state === 'now' ? 'var(--wl-accent)' : 'transparent',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 9.5,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: step.state === 'now'
                  ? 'var(--wl-accent-fg)'
                  : step.state === 'done'
                    ? 'var(--wl-text)'
                    : 'var(--wl-text-faint)',
                fontWeight: step.state === 'now' ? 600 : 400,
              }}
            >
              {step.state === 'done' && '✓ '}{step.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--wl-font-display)',
                fontStyle: step.state === 'now' ? 'normal' : 'italic',
                fontSize: 12,
                color: step.state === 'now'
                  ? 'rgba(255,255,255,.85)'
                  : 'var(--wl-text-faint)',
              }}
            >
              {step.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
