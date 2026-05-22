/**
 * Atlas Analytics — Widget registry for the 5-frame atlas dashboard
 *
 * Extends the existing AdminWidgetMeta/AdminWidgetType system with
 * Atlas-specific chart types and layout helpers.
 *
 * Existing exports from ./widgets and ./types are preserved unchanged.
 */

// ─── Atlas widget kinds (superset of AdminWidgetType) ────────────────────────

export type AtlasWidgetKind =
  | 'KPI'
  | 'LINE'
  | 'AREA'
  | 'BAR'
  | 'DONUT'
  | 'TABLE'
  | 'FUNNEL'
  | 'FEED'
  | 'HEAT'
  | 'MAP';

/** Minimum colour palette keys for Atlas widgets */
export type AtlasColorKey = 'accent' | 'moss' | 'gold' | 'ink' | 'indigo';

/** A colour-coded field chip: metric (Σ), dimension (▭), filter (⚑) */
export type ChipRole = 'metric' | 'dimension' | 'filter';

export interface FieldChip {
  readonly role: ChipRole;
  readonly label: string;
}

/** One filter condition in the query builder */
export interface FilterCondition {
  readonly field: string;
  readonly op: string;
  readonly value: string;
}

/** A single widget's query definition */
export interface WidgetQuery {
  readonly from: string;
  readonly metrics: readonly FieldChip[];
  readonly groupBy: readonly FieldChip[];
  readonly filters: readonly FilterCondition[];
}

// ─── Atlas widget instance ────────────────────────────────────────────────────

export interface AtlasWidgetInstance {
  /** Unique widget ID */
  readonly id: string;
  /** Chart kind */
  readonly kind: AtlasWidgetKind;
  /** Tile title */
  readonly title: string;
  /** Optional subtitle shown in the widget head */
  readonly subtitle?: string;
  /** Grid column span (1-12) */
  readonly w: number;
  /** Grid row span (1-5) */
  readonly h: number;
  /** Grid column start (0-indexed) */
  readonly x: number;
  /** Grid row start (0-indexed) */
  readonly y: number;
  /** Primary colour key */
  readonly colorKey: AtlasColorKey;
  /** Optional query backing this widget */
  readonly query?: WidgetQuery;
}

// ─── Atlas dashboard layout ───────────────────────────────────────────────────

export interface AtlasDashboardLayout {
  readonly version: number;
  /** Widgets ordered by y then x */
  readonly widgets: readonly AtlasWidgetInstance[];
}

// ─── Default F1 view layout (mirrors the design prototype) ───────────────────

export const DEFAULT_ATLAS_LAYOUT: AtlasDashboardLayout = {
  version: 1,
  widgets: [
    { id: 'kpi-revenue',   kind: 'KPI',    title: 'Revenue · 30d',     subtitle: undefined, w: 3, h: 2, x: 0,  y: 0, colorKey: 'accent' },
    { id: 'kpi-orders',    kind: 'KPI',    title: 'Orders',            subtitle: undefined, w: 3, h: 2, x: 3,  y: 0, colorKey: 'moss'   },
    { id: 'kpi-aov',       kind: 'KPI',    title: 'AOV',               subtitle: undefined, w: 3, h: 2, x: 6,  y: 0, colorKey: 'gold'   },
    { id: 'kpi-conv',      kind: 'KPI',    title: 'Conv. rate',        subtitle: undefined, w: 3, h: 2, x: 9,  y: 0, colorKey: 'ink'    },
    { id: 'revenue-line',  kind: 'LINE',   title: 'Revenue',           subtitle: 'last 30 days · daily', w: 8, h: 3, x: 0, y: 2, colorKey: 'accent' },
    { id: 'channels-donut',kind: 'DONUT',  title: 'By channel',        subtitle: undefined, w: 4, h: 3, x: 8,  y: 2, colorKey: 'ink'    },
    { id: 'top-products',  kind: 'TABLE',  title: 'Top products',      subtitle: 'by revenue', w: 5, h: 3, x: 0, y: 5, colorKey: 'accent' },
    { id: 'conversion',    kind: 'FUNNEL', title: 'Conversion funnel', subtitle: 'visits → purchase · 30d', w: 4, h: 3, x: 5, y: 5, colorKey: 'accent' },
    { id: 'alerts',        kind: 'FEED',   title: 'Needs attention',   subtitle: undefined, w: 3, h: 3, x: 9,  y: 5, colorKey: 'accent' },
  ],
};

// ─── Widget kind metadata (palette labels, icons) ────────────────────────────

export interface AtlasWidgetMeta {
  readonly kind: AtlasWidgetKind;
  readonly label: string;
  readonly desc: string;
  /** Default grid w × h */
  readonly defaultW: number;
  readonly defaultH: number;
}

export const ATLAS_WIDGET_REGISTRY: Readonly<Record<AtlasWidgetKind, AtlasWidgetMeta>> = {
  KPI:    { kind: 'KPI',    label: 'KPI',     desc: 'single number + spark',  defaultW: 3, defaultH: 2 },
  LINE:   { kind: 'LINE',   label: 'Line',    desc: 'over time',              defaultW: 8, defaultH: 3 },
  AREA:   { kind: 'AREA',   label: 'Area',    desc: 'stacked or single',      defaultW: 8, defaultH: 3 },
  BAR:    { kind: 'BAR',    label: 'Bar',     desc: 'categorical',            defaultW: 6, defaultH: 3 },
  DONUT:  { kind: 'DONUT',  label: 'Donut',   desc: 'breakdown',              defaultW: 4, defaultH: 3 },
  TABLE:  { kind: 'TABLE',  label: 'Table',   desc: 'top-N · sortable',       defaultW: 6, defaultH: 3 },
  FUNNEL: { kind: 'FUNNEL', label: 'Funnel',  desc: 'step conversion',        defaultW: 4, defaultH: 3 },
  FEED:   { kind: 'FEED',   label: 'Feed',    desc: 'live events',            defaultW: 3, defaultH: 3 },
  HEAT:   { kind: 'HEAT',   label: 'Heatmap', desc: 'time × intensity',       defaultW: 8, defaultH: 3 },
  MAP:    { kind: 'MAP',    label: 'Map',     desc: 'geographic',             defaultW: 8, defaultH: 4 },
};

/** Build an immutable updated layout (never mutates the input). */
export function updateWidgetInLayout(
  layout: AtlasDashboardLayout,
  widgetId: string,
  patch: Partial<Omit<AtlasWidgetInstance, 'id'>>
): AtlasDashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.map((w) =>
      w.id === widgetId ? { ...w, ...patch } : w
    ),
  };
}

/** Remove a widget and return a new layout. */
export function removeWidgetFromLayout(
  layout: AtlasDashboardLayout,
  widgetId: string
): AtlasDashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.filter((w) => w.id !== widgetId),
  };
}

/** Add a widget and return a new layout. */
export function addWidgetToLayout(
  layout: AtlasDashboardLayout,
  widget: AtlasWidgetInstance
): AtlasDashboardLayout {
  return {
    ...layout,
    widgets: [...layout.widgets, widget],
  };
}
