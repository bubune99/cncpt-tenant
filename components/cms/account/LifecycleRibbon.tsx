/**
 * Atlas Customer Lifecycle Ribbon
 * Shows the customer's relationship stage with the shop.
 * Uses --wl-* tokens exclusively.
 */

/** API enum values from /api/cms/account/summary → lifecycleStage */
export type LifecycleStage = 'NEW' | 'RETURNING' | 'LOYAL' | 'VIP' | 'LAPSED' | 'CHURNED';

/** Internal display stage — maps API enum to ribbon position */
type DisplayStage = 'new' | 'returning' | 'loyal' | 'vip' | 'lapsed';

type StepState = 'done' | 'now' | 'future';

interface LifecycleStep {
  readonly key: DisplayStage;
  readonly label: string;
  readonly sub: string;
  readonly state: StepState;
}

export interface LifecycleRibbonProps {
  readonly current?: LifecycleStage;
  readonly memberSince?: string;
}

/** Map API enum → display stage order position */
const STAGE_TO_DISPLAY: Record<LifecycleStage, DisplayStage> = {
  NEW:       'new',
  RETURNING: 'returning',
  LOYAL:     'loyal',
  VIP:       'vip',
  LAPSED:    'lapsed',
  CHURNED:   'lapsed', // treat churned same as lapsed for display
};

const ORDER: readonly DisplayStage[] = ['new', 'returning', 'loyal', 'vip', 'lapsed'];

const META: Record<DisplayStage, string> = {
  new:       'since joining',
  returning: 'after 3 orders',
  loyal:     'you are here',
  vip:       'top customer',
  lapsed:    'we miss you',
};

function getSteps(current: LifecycleStage): readonly LifecycleStep[] {
  const displayStage = STAGE_TO_DISPLAY[current];
  const currentIdx = ORDER.indexOf(displayStage);

  return ORDER.map((key, idx) => {
    let state: StepState;
    if (idx < currentIdx) state = 'done';
    else if (idx === currentIdx) state = 'now';
    else state = 'future';

    return {
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      sub: META[key],
      state,
    };
  });
}

export function LifecycleRibbon({ current = 'LOYAL', memberSince }: LifecycleRibbonProps) {
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
