'use client';

import { useEffect, useRef, useCallback, ReactNode, createElement } from 'react';
import type { AdminWidgetConfig } from '@/lib/cms/dashboard/types';

// Minimal GridStack type surface
interface GS {
  removeAll: (remove?: boolean) => void;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  off: (event: string) => void;
  destroy: (remove?: boolean) => void;
  setStatic: (val: boolean) => void;
  getGridItems: () => HTMLElement[];
}

interface GridStackWrapperProps {
  widgets: AdminWidgetConfig[];
  editing: boolean;
  onChange: (updated: AdminWidgetConfig[]) => void;
  renderWidget: (widget: AdminWidgetConfig) => ReactNode;
}

export default function GridStackWrapper({
  widgets,
  editing,
  onChange,
  renderWidget,
}: GridStackWrapperProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const gsRef = useRef<GS | null>(null);
  const widgetsRef = useRef(widgets);
  widgetsRef.current = widgets;

  useEffect(() => {
    gsRef.current?.setStatic(!editing);
  }, [editing]);

  const handleChange = useCallback(() => {
    if (!gsRef.current) return;
    const items = gsRef.current.getGridItems();
    const updated = widgetsRef.current.map((w) => {
      const el = items.find((item) => item.getAttribute('gs-id') === w.id);
      if (!el) return w;
      return {
        ...w,
        x: parseInt(el.getAttribute('gs-x') || '0', 10),
        y: parseInt(el.getAttribute('gs-y') || '0', 10),
        w: parseInt(el.getAttribute('gs-w') || '6', 10),
        h: parseInt(el.getAttribute('gs-h') || '3', 10),
      };
    });
    onChange(updated);
  }, [onChange]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!gridRef.current || gsRef.current) return;

      const { GridStack } = await import('gridstack');
      // @ts-expect-error -- CSS module import has no type declarations
      await import('gridstack/dist/gridstack.min.css');

      if (!mounted || !gridRef.current) return;

      const grid = GridStack.init(
        {
          column: 12,
          cellHeight: 70,
          margin: 8,
          animate: true,
          staticGrid: !editing,
          float: false,
        } as Record<string, unknown>,
        gridRef.current
      ) as unknown as GS;

      gsRef.current = grid;
      grid.on('change', handleChange);
    }

    init();

    return () => {
      mounted = false;
      if (gsRef.current) {
        gsRef.current.off('change');
        gsRef.current.destroy(false);
        gsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleWidgets = widgets.filter((w) => w.visible);

  return (
    <div ref={gridRef} className="grid-stack">
      {visibleWidgets.map((widget) =>
        // Use createElement to pass gs-* attributes without TS complaints
        createElement(
          'div',
          {
            key: widget.id,
            className: 'grid-stack-item',
            'gs-id': widget.id,
            'gs-x': String(widget.x),
            'gs-y': String(widget.y),
            'gs-w': String(widget.w),
            'gs-h': String(widget.h),
            'gs-min-w': '3',
            'gs-min-h': '2',
            'data-help-key': `admin.dashboard.${widget.type}`,
          },
          <div className="grid-stack-item-content">
            {renderWidget(widget)}
          </div>
        )
      )}
    </div>
  );
}
