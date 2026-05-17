'use client';

/**
 * Atlas Customer Account Dashboard Home (D1)
 * Lifecycle ribbon + bricks + recent orders + owner greeting.
 * Uses --wl-* tokens exclusively.
 */

import Link from 'next/link';
import useSWR from 'swr';
import { LifecycleRibbon, type LifecycleStage } from '@/components/cms/account/LifecycleRibbon';
import { AccountBricks } from '@/components/cms/account/AccountBricks';
import { OwnerGreeting } from '@/components/cms/account/OwnerGreeting';
import { OrderStatusPill } from '@/components/cms/account/OrderStatusPill';
import { useCustomerOrders } from '@/components/cms/account-dashboard/hooks';

// ---------- Types -------------------------------------------------------

interface AccountSummaryData {
  readonly storeCredit: number;
  readonly loyaltyPoints: number;
  readonly activeSubs: number;
  readonly openOrders: number;
  readonly lifecycleStage: LifecycleStage;
}

interface AccountSummaryResponse {
  readonly success: boolean;
  readonly data: AccountSummaryData;
}

// ---------- Fetcher -----------------------------------------------------

const fetcher = async (url: string): Promise<AccountSummaryResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json() as Promise<AccountSummaryResponse>;
};

// ---------- Hook --------------------------------------------------------

function useAccountSummary() {
  const { data, error, isLoading } = useSWR<AccountSummaryResponse>(
    '/api/cms/account/summary',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );

  return {
    summary: data?.data ?? null,
    isLoading,
    isError: !!error,
  };
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AccountHomePage() {
  const { orders, isLoading } = useCustomerOrders({ limit: 3 });
  const { summary, isLoading: summaryLoading, isError: summaryError } = useAccountSummary();

  return (
    <div>
      {/* Page head */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 18,
          paddingBottom: 18,
          borderBottom: '1px solid var(--wl-rule)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10.5,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--wl-text-soft)',
              marginBottom: 6,
            }}
          >
            <Link href="/" style={{ color: 'var(--wl-text-soft)', textDecoration: 'none' }}>Store</Link>
            <span style={{ color: 'var(--wl-text-faint)', margin: '0 6px' }}>/</span>
            <span style={{ color: 'var(--wl-text)' }}>Account</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontWeight: 500,
              fontSize: 38,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Welcome back
          </h1>
          <div
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontStyle: 'italic',
              color: 'var(--wl-text-soft)',
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Your account overview.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            paddingTop: 12,
            flexShrink: 0,
          }}
        >
          <Link
            href="/account/orders"
            style={{
              fontFamily: 'var(--wl-font-body)',
              fontSize: 12,
              padding: '5px 10px',
              border: '1px solid var(--wl-rule)',
              color: 'var(--wl-text-soft)',
              borderRadius: 'var(--wl-radius-sm)',
              textDecoration: 'none',
              background: 'transparent',
            }}
          >
            Order help
          </Link>
          <Link
            href="/shop"
            style={{
              fontFamily: 'var(--wl-font-body)',
              fontSize: 12,
              padding: '5px 10px',
              background: 'var(--wl-text)',
              color: 'var(--wl-bg)',
              border: '1px solid var(--wl-text)',
              borderRadius: 'var(--wl-radius-sm)',
              textDecoration: 'none',
            }}
          >
            Continue shopping →
          </Link>
        </div>
      </div>

      {/* Lifecycle + greeting */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 18,
          marginTop: 18,
        }}
      >
        {/* Left: lifecycle + bricks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 10,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: 'var(--wl-text-faint)',
                }}
              >
                Your journey
              </span>
            </div>
            {summaryLoading ? (
              <div
                style={{
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--wl-text-faint)',
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 11,
                  letterSpacing: '.06em',
                }}
              >
                Loading…
              </div>
            ) : summaryError || !summary ? (
              <div
                style={{
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--wl-text-soft)',
                  fontFamily: 'var(--wl-font-display)',
                  fontStyle: 'italic',
                  fontSize: 13,
                }}
              >
                Could not load account status.
              </div>
            ) : (
              <LifecycleRibbon current={summary.lifecycleStage} />
            )}
          </div>

          {summaryLoading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--wl-surface)',
                    border: '1px solid var(--wl-rule)',
                    borderRadius: 'var(--wl-radius)',
                    padding: '14px 16px',
                    height: 72,
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
          ) : (
            <AccountBricks
              storeCredit={summary?.storeCredit ?? 0}
              loyaltyPts={summary?.loyaltyPoints ?? 0}
              activeSubs={summary?.activeSubs ?? 0}
              openOrders={summary?.openOrders ?? 0}
            />
          )}
        </div>

        {/* Right: greeting */}
        <OwnerGreeting
          ownerName="Marisol"
          ownerInitial="M"
          message="Hi — thanks for shopping with us. We hope you love everything you've ordered. Don't hesitate to reach out if you need anything."
          show={true}
        />
      </div>

      {/* Recent orders */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontWeight: 500,
              fontSize: 22,
              letterSpacing: '-0.015em',
              margin: 0,
              lineHeight: 1,
            }}
          >
            Recent orders{' '}
            <span
              style={{
                fontFamily: 'var(--wl-font-display)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--wl-text-soft)',
                letterSpacing: 0,
              }}
            >
              last 90 days
            </span>
          </h2>
          <Link
            href="/account/orders"
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 11,
              color: 'var(--wl-accent)',
              textDecoration: 'none',
              letterSpacing: '.02em',
            }}
          >
            See all →
          </Link>
        </div>

        <div
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            padding: '4px 16px',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--wl-text-faint)' }}>
              Loading orders…
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--wl-font-display)',
                  fontStyle: 'italic',
                  color: 'var(--wl-text-soft)',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                You haven&apos;t placed any orders yet.
              </div>
              <Link
                href="/shop"
                style={{
                  display: 'inline-block',
                  marginTop: 10,
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 11,
                  color: 'var(--wl-accent)',
                  textDecoration: 'none',
                  letterSpacing: '.04em',
                }}
              >
                Start shopping →
              </Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Order', 'Placed', 'Status', 'Total', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 9.5,
                        letterSpacing: '.12em',
                        textTransform: 'uppercase',
                        color: 'var(--wl-text-faint)',
                        textAlign: h === 'Total' ? 'right' : 'left',
                        padding: '8px 10px',
                        borderBottom: '1px solid var(--wl-rule)',
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    style={{ borderBottom: '1px solid var(--wl-rule-soft)' }}
                  >
                    <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          fontFamily: 'var(--wl-font-mono)',
                          fontWeight: 600,
                        }}
                      >
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          fontFamily: 'var(--wl-font-display)',
                          fontStyle: 'italic',
                          color: 'var(--wl-text-soft)',
                          fontSize: 13,
                        }}
                      >
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                      <OrderStatusPill status={order.status} />
                    </td>
                    <td
                      style={{
                        padding: '12px 10px',
                        verticalAlign: 'middle',
                        textAlign: 'right',
                        fontFamily: 'var(--wl-font-mono)',
                      }}
                    >
                      {formatCurrency(order.total)}
                    </td>
                    <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                      <Link
                        href={`/account/orders/${order.id}`}
                        style={{
                          fontFamily: 'var(--wl-font-mono)',
                          fontSize: 11,
                          color: 'var(--wl-accent)',
                          textDecoration: 'none',
                        }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Three-up preview: subs / wishlist / returns */}
      <div
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
        }}
      >
        {/* Subscriptions preview */}
        <div
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            padding: 'var(--wl-card-pad)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2
              style={{
                fontFamily: 'var(--wl-font-display)',
                fontWeight: 500,
                fontSize: 17,
                margin: 0,
              }}
            >
              Subscriptions
            </h2>
            <Link
              href="/account/subscriptions"
              style={{
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 11,
                color: 'var(--wl-accent)',
                textDecoration: 'none',
              }}
            >
              manage →
            </Link>
          </div>
          <div
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--wl-text-soft)',
              lineHeight: 1.5,
            }}
          >
            No active subscriptions. Browse the shop to find recurring products.
          </div>
        </div>

        {/* Wishlist preview */}
        <div
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            padding: 'var(--wl-card-pad)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2
              style={{
                fontFamily: 'var(--wl-font-display)',
                fontWeight: 500,
                fontSize: 17,
                margin: 0,
              }}
            >
              Wishlist
            </h2>
            <Link
              href="/account/wishlist"
              style={{
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 11,
                color: 'var(--wl-accent)',
                textDecoration: 'none',
              }}
            >
              view all →
            </Link>
          </div>
          <div
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--wl-text-soft)',
              lineHeight: 1.5,
            }}
          >
            Nothing saved yet. Heart an item on the shop to add it here.
          </div>
        </div>

        {/* Returns */}
        <div
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            padding: 'var(--wl-card-pad)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2
              style={{
                fontFamily: 'var(--wl-font-display)',
                fontWeight: 500,
                fontSize: 17,
                margin: 0,
              }}
            >
              Returns
            </h2>
            <Link
              href="/account/returns"
              style={{
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 11,
                color: 'var(--wl-accent)',
                textDecoration: 'none',
              }}
            >
              start a return →
            </Link>
          </div>
          <div
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--wl-text-soft)',
              lineHeight: 1.5,
            }}
          >
            No open returns. Items from the last 30 days are eligible.
          </div>
        </div>
      </div>
    </div>
  );
}
