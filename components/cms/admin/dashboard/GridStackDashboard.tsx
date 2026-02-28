'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { AdminWidgetConfig, AdminDashboardLayout } from '@/lib/cms/dashboard/types';
import { ADMIN_WIDGET_REGISTRY, getDefaultAdminLayout } from '@/lib/cms/dashboard/widgets';
import GridStackWrapper from './GridStackWrapper';
import DashboardToolbar from './DashboardToolbar';
import WidgetPicker from './WidgetPicker';
import MetricsGridWidget from './widgets/MetricsGridWidget';
import RevenueChartWidget from './widgets/RevenueChartWidget';
import OrderVolumeWidget from './widgets/OrderVolumeWidget';
import TrafficChartWidget from './widgets/TrafficChartWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import RecentOrdersWidget from './widgets/RecentOrdersWidget';
import ContentStatsWidget from './widgets/ContentStatsWidget';
import { Loader2 } from 'lucide-react';

function renderWidgetContent(widget: AdminWidgetConfig, editing: boolean) {
  switch (widget.type) {
    case 'metrics-overview':
      return <MetricsGridWidget editing={editing} />;
    case 'revenue-chart':
      return <RevenueChartWidget editing={editing} />;
    case 'order-volume':
      return <OrderVolumeWidget editing={editing} />;
    case 'traffic-chart':
      return <TrafficChartWidget editing={editing} />;
    case 'quick-actions':
      return <QuickActionsWidget editing={editing} />;
    case 'recent-orders':
      return <RecentOrdersWidget editing={editing} />;
    case 'content-stats':
      return <ContentStatsWidget editing={editing} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Widget: {widget.type}
        </div>
      );
  }
}

export default function GridStackDashboard() {
  const [layout, setLayout] = useState<AdminDashboardLayout | null>(null);
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load layout on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cms/admin/dashboard/layout');
        if (res.ok) {
          const data = await res.json();
          setLayout(data);
        } else {
          setLayout(getDefaultAdminLayout());
        }
      } catch {
        setLayout(getDefaultAdminLayout());
      }
    }
    load();
  }, []);

  // Debounced save
  const saveLayout = useCallback((newLayout: AdminDashboardLayout) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/cms/admin/dashboard/layout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLayout),
        });
      } catch (err) {
        console.error('Failed to save layout:', err);
      }
    }, 1000);
  }, []);

  const handleChange = useCallback(
    (updatedWidgets: AdminWidgetConfig[]) => {
      setLayout((prev) => {
        if (!prev) return prev;
        const next = { ...prev, widgets: updatedWidgets };
        saveLayout(next);
        return next;
      });
    },
    [saveLayout]
  );

  const handleToggleWidget = useCallback(
    (widgetType: string, visible: boolean) => {
      setLayout((prev) => {
        if (!prev) return prev;
        const existing = prev.widgets.find((w) => w.type === widgetType);
        let widgets: AdminWidgetConfig[];

        if (existing) {
          widgets = prev.widgets.map((w) =>
            w.type === widgetType ? { ...w, visible } : w
          );
        } else {
          // Add new widget with defaults from registry
          const meta = ADMIN_WIDGET_REGISTRY[widgetType as keyof typeof ADMIN_WIDGET_REGISTRY];
          if (!meta) return prev;
          const maxY = Math.max(...prev.widgets.map((w) => w.y + w.h), 0);
          widgets = [
            ...prev.widgets,
            {
              id: `w-${widgetType}-${Date.now()}`,
              type: meta.type,
              title: meta.title,
              x: 0,
              y: maxY,
              w: meta.defaultW,
              h: meta.defaultH,
              visible: true,
            },
          ];
        }

        const next = { ...prev, widgets };
        saveLayout(next);
        return next;
      });
    },
    [saveLayout]
  );

  const handleResetLayout = useCallback(() => {
    const defaults = getDefaultAdminLayout();
    setLayout(defaults);
    saveLayout(defaults);
  }, [saveLayout]);

  if (!layout) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div data-help-key="admin.dashboard">
      <div className="flex items-center justify-between mb-4">
        <div data-help-key="admin.dashboard.heading">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {editing
              ? 'Drag and resize widgets to customize your layout'
              : 'Your admin overview'}
          </p>
        </div>
        <DashboardToolbar
          editing={editing}
          onToggleEdit={() => setEditing((e) => !e)}
          onAddWidget={() => setPickerOpen(true)}
          onResetLayout={handleResetLayout}
        />
      </div>

      <GridStackWrapper
        widgets={layout.widgets}
        editing={editing}
        onChange={handleChange}
        renderWidget={(widget) => renderWidgetContent(widget, editing)}
      />

      <WidgetPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        activeWidgets={layout.widgets}
        onToggleWidget={handleToggleWidget}
      />
    </div>
  );
}
