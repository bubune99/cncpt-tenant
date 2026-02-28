'use client';

import { Button } from '../../ui/button';
import { Pencil, Check, Plus, RotateCcw } from 'lucide-react';

interface DashboardToolbarProps {
  editing: boolean;
  onToggleEdit: () => void;
  onAddWidget: () => void;
  onResetLayout: () => void;
}

export default function DashboardToolbar({
  editing,
  onToggleEdit,
  onAddWidget,
  onResetLayout,
}: DashboardToolbarProps) {
  return (
    <div className="flex items-center gap-2" data-help-key="admin.dashboard.toolbar">
      {editing && (
        <>
          <Button variant="outline" size="sm" onClick={onAddWidget} data-help-key="admin.dashboard.add-widget">
            <Plus className="h-4 w-4 mr-1" />
            Add Widget
          </Button>
          <Button variant="outline" size="sm" onClick={onResetLayout} data-help-key="admin.dashboard.reset-layout">
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Layout
          </Button>
        </>
      )}
      <Button
        variant={editing ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleEdit}
        data-help-key="admin.dashboard.customize"
      >
        {editing ? (
          <>
            <Check className="h-4 w-4 mr-1" />
            Done
          </>
        ) : (
          <>
            <Pencil className="h-4 w-4 mr-1" />
            Customize
          </>
        )}
      </Button>
    </div>
  );
}
