'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../ui/sheet';
import { Switch } from '../../ui/switch';
import { ADMIN_WIDGET_REGISTRY } from '@/lib/cms/dashboard/widgets';
import type { AdminWidgetConfig, AdminWidgetCategory } from '@/lib/cms/dashboard/types';

interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeWidgets: AdminWidgetConfig[];
  onToggleWidget: (widgetType: string, visible: boolean) => void;
}

const CATEGORY_LABELS: Record<AdminWidgetCategory, string> = {
  overview: 'Overview',
  analytics: 'Analytics',
  actions: 'Actions',
  data: 'Data',
};

export default function WidgetPicker({
  open,
  onOpenChange,
  activeWidgets,
  onToggleWidget,
}: WidgetPickerProps) {
  const allWidgets = Object.values(ADMIN_WIDGET_REGISTRY);
  const categories = ['overview', 'analytics', 'actions', 'data'] as AdminWidgetCategory[];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add / Remove Widgets</SheetTitle>
          <SheetDescription>
            Toggle widgets to show or hide them on your dashboard.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {categories.map((cat) => {
            const widgets = allWidgets.filter((w) => w.category === cat);
            if (widgets.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="space-y-3">
                  {widgets.map((meta) => {
                    const active = activeWidgets.find(
                      (w) => w.type === meta.type
                    );
                    const isVisible = active?.visible ?? false;
                    return (
                      <div
                        key={meta.type}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{meta.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {meta.description}
                          </p>
                        </div>
                        <Switch
                          checked={isVisible}
                          onCheckedChange={(checked) =>
                            onToggleWidget(meta.type, checked)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
