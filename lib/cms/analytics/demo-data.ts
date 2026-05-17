/**
 * Atlas Analytics — demo / placeholder data
 * Used when no real data is available (new tenant, build-time, etc.)
 * Mirrors the data shapes from atlas-analytics-charts.jsx / atlas-analytics-dashboard.jsx
 */

export interface ChannelData {
  readonly name: string;
  readonly value: number;
  readonly color: string;
  readonly pct: number;
}

export interface ProductRow {
  readonly name: string;
  readonly sku: string;
  readonly units: number;
  readonly rev: number;
  readonly pct: number;
}

export interface FunnelStep {
  readonly label: string;
  readonly v: number;
  /** CSS class key for colour: s1-s5 */
  readonly colorCls: string;
  readonly pct: number;
}

export interface ActivityItem {
  readonly kind: 'order' | 'stock' | 'sign' | 'review';
  readonly text: string;
  readonly when: string;
  /** Dot colour class key */
  readonly cls: 'moss' | 'accent' | 'gold' | 'ink';
}

export interface AlertItem {
  readonly title: string;
  readonly sub: string;
  /** Bar accent: '' = accent, 'gold', 'moss' */
  readonly bar: '' | 'gold' | 'moss';
  readonly cta: string;
}

export const DEMO_DATA = {
  revenue30: [
    520, 480, 610, 690, 590, 720, 840, 760, 690, 880,
    920, 870, 980, 1040, 960, 880, 1120, 1180, 1080, 1240,
    1320, 1290, 1380, 1420, 1480, 1380, 1520, 1640, 1580, 1720,
  ] as readonly number[],

  prevRevenue30: [
    420, 480, 510, 540, 520, 580, 620, 590, 540, 610,
    640, 680, 720, 740, 720, 760, 800, 780, 740, 820,
    860, 880, 900, 940, 960, 1020, 1080, 1100, 1080, 1140,
  ] as readonly number[],

  ordersDays: [
    14, 12, 18, 22, 19, 24, 28, 24, 19, 28,
    32, 30, 36, 38, 34, 30, 41, 44, 38, 46,
    49, 47, 52, 54, 56, 52, 58, 62, 60, 66,
  ] as readonly number[],

  aovDays: [22, 23, 21, 24, 25, 24, 26, 25, 27, 26] as readonly number[],

  convDays: [1.4, 1.5, 1.6, 1.5, 1.7, 1.6, 1.8, 1.7, 1.85, 1.84] as readonly number[],

  days: [
    'Apr 17', '18', '19', '20', '21', '22', '23', '24', '25', '26',
    '27', '28', '29', '30', 'May 1', '2', '3', '4', '5', '6',
    '7', '8', '9', '10', '11', '12', '13', '14', '15', '16',
  ] as readonly string[],

  channels: [
    { name: 'Direct',     value: 4820, color: '#1a1410', pct: 38 },
    { name: 'Newsletter', value: 3210, color: '#8b2c1f', pct: 25 },
    { name: 'Organic',    value: 2240, color: '#b58730', pct: 18 },
    { name: 'Social',     value: 1680, color: '#4f5e3a', pct: 13 },
    { name: 'Referral',   value:  860, color: '#2a4a73', pct:  6 },
  ] as readonly ChannelData[],

  topProducts: [
    { name: 'Marigold quilted jacket',   sku: 'JKT-MQ-*',       units: 142, rev: 21016, pct: 100 },
    { name: 'Dahlia tee',                sku: 'SHIRT-DAH',       units: 218, rev: 6976,  pct: 47  },
    { name: 'Marigold dye kit',          sku: 'KIT-DYE-MAR',     units: 96,  rev: 4608,  pct: 32  },
    { name: 'Marigold dye field guide',  sku: 'PDF-DYE-GUIDE',   units: 218, rev: 5232,  pct: 36  },
    { name: 'Indigo scarf',              sku: 'SCRF-IND',        units: 64,  rev: 3072,  pct: 21  },
    { name: 'Moss towel',                sku: 'TWL-MSS',         units: 102, rev: 1836,  pct: 12  },
  ] as readonly ProductRow[],

  funnel: [
    { label: 'Visits',       v: 12402, colorCls: 's2', pct: 100  },
    { label: 'Product view', v:  6840, colorCls: 's1', pct: 55   },
    { label: 'Add to cart',  v:  1420, colorCls: 's3', pct: 12   },
    { label: 'Checkout',     v:   480, colorCls: 's4', pct: 3.9  },
    { label: 'Purchase',     v:   228, colorCls: 's5', pct: 1.84 },
  ] as readonly FunnelStep[],

  activity: [
    { kind: 'order',  text: 'Order #4827 · $158.00 · Marigold jacket M',       when: '2m',  cls: 'moss'   },
    { kind: 'order',  text: 'Order #4826 · $48.00 · Dye kit',                  when: '5m',  cls: 'moss'   },
    { kind: 'stock',  text: 'Marigold jacket M-MAR went out of stock',          when: '12m', cls: 'accent' },
    { kind: 'sign',   text: '4 new newsletter subscribers',                     when: '18m', cls: 'gold'   },
    { kind: 'order',  text: 'Order #4825 · $24.00 · Field guide PDF',           when: '24m', cls: 'moss'   },
    { kind: 'review', text: 'Sara L. left a 5★ review on Dahlia tee',           when: '38m', cls: 'ink'    },
    { kind: 'order',  text: 'Order #4824 · $218 · Studio essentials box',       when: '52m', cls: 'moss'   },
  ] as readonly ActivityItem[],

  alerts: [
    { title: 'Marigold jacket · M-Marigold sold out',  sub: '3rd time in 30d · 41 sold last batch',         bar: '',     cta: 'restock'     },
    { title: 'Newsletter unsubscribes up 22%',         sub: '412 in last 7d · vs 338 prior 7d',              bar: 'gold', cta: 'investigate' },
    { title: '3 abandoned carts above $200',           sub: 'Last 24h · total $846 · save & email?',         bar: 'gold', cta: 'recover'     },
    { title: 'Series 06 newsletter scheduled',         sub: 'Sat 17 May 09:00 · 4,820 recipients',           bar: 'moss', cta: 'review'      },
  ] as readonly AlertItem[],
} as const;
