"use client";

import { useState, useMemo } from "react";
import { TimelineConfig, TimelineEntry, AnimationConfig } from "../animations/types";
import { allAnimationPresets } from "../animations/presets";

interface TimelineFieldProps {
  value: TimelineConfig | undefined;
  onChange: (value: TimelineConfig) => void;
  /** Available component IDs to target */
  availableTargets?: { id: string; label: string }[];
  label?: string;
}

interface TimelineVisualizationItem {
  startTime: number;
  duration: number;
  endTime: number;
  entry: TimelineEntry;
  index: number;
}

const TRIGGERS = [
  { value: "onLoad", label: "On Load" },
  { value: "onScroll", label: "On Scroll" },
  { value: "onClick", label: "On Click" },
] as const;

const START_AT_OPTIONS = [
  { value: "previous", label: "After Previous" },
  { value: "0", label: "At Start (0s)" },
  { value: "+=0", label: "With Previous" },
] as const;

function createDefaultTimeline(): TimelineConfig {
  return {
    id: `timeline-${Date.now()}`,
    name: "New Timeline",
    sequence: [],
    loop: false,
    autoPlay: true,
    trigger: "onScroll",
  };
}

function createDefaultEntry(): TimelineEntry {
  return {
    target: "",
    animation: {
      type: "fade",
      duration: 0.5,
      delay: 0,
      easing: "easeOut",
    },
    startAt: "previous",
  };
}

export function TimelineField({
  value,
  onChange,
  availableTargets = [],
  label,
}: TimelineFieldProps) {
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const config = value || createDefaultTimeline();

  const handleChange = (updates: Partial<TimelineConfig>) => {
    onChange({ ...config, ...updates });
  };

  const handleEntryChange = (index: number, updates: Partial<TimelineEntry>) => {
    const newSequence = [...config.sequence];
    newSequence[index] = { ...newSequence[index], ...updates };
    handleChange({ sequence: newSequence });
  };

  const addEntry = () => {
    const newEntry = createDefaultEntry();
    if (availableTargets.length > 0) {
      newEntry.target = availableTargets[0].id;
    }
    handleChange({ sequence: [...config.sequence, newEntry] });
    setSelectedEntryIndex(config.sequence.length);
  };

  const removeEntry = (index: number) => {
    const newSequence = config.sequence.filter((_: TimelineEntry, i: number) => i !== index);
    handleChange({ sequence: newSequence });
    if (selectedEntryIndex === index) {
      setSelectedEntryIndex(null);
    }
  };

  const moveEntry = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= config.sequence.length) return;

    const newSequence = [...config.sequence];
    [newSequence[index], newSequence[newIndex]] = [
      newSequence[newIndex],
      newSequence[index],
    ];
    handleChange({ sequence: newSequence });
    setSelectedEntryIndex(newIndex);
  };

  // Calculate visual timeline representation
  const timelineVisualization = useMemo(() => {
    let currentTime = 0;
    return config.sequence.map((entry: TimelineEntry, index: number) => {
      const startTime = parseStartTime(entry.startAt, currentTime);
      const duration = entry.animation.duration || 0.5;
      const endTime = startTime + duration;
      currentTime = endTime;
      return { startTime, duration, endTime, entry, index };
    });
  }, [config.sequence]);

  const totalDuration = Math.max(
    ...timelineVisualization.map((t: TimelineVisualizationItem) => t.endTime),
    1
  );

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* Timeline Name & Basic Settings */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Timeline name"
          value={config.name || ""}
          onChange={(e) => handleChange({ name: e.target.value })}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Settings */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trigger</label>
              <select
                value={config.trigger}
                onChange={(e) =>
                  handleChange({ trigger: e.target.value as TimelineConfig["trigger"] })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={config.autoPlay}
                  onChange={(e) => handleChange({ autoPlay: e.target.checked })}
                  className="w-4 h-4"
                />
                Auto Play
              </label>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={!!config.loop}
                  onChange={(e) => handleChange({ loop: e.target.checked })}
                  className="w-4 h-4"
                />
                Loop
              </label>
            </div>
          </div>

          {/* Visual Timeline */}
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2">
              Timeline ({totalDuration.toFixed(1)}s)
            </div>
            <div className="relative h-16 bg-gray-200 rounded">
              {timelineVisualization.map(({ startTime, duration, entry, index }: TimelineVisualizationItem) => {
                const left = (startTime / totalDuration) * 100;
                const width = (duration / totalDuration) * 100;
                const target = availableTargets.find((t) => t.id === entry.target);

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedEntryIndex(index)}
                    className={`absolute top-2 h-12 rounded cursor-pointer transition-all ${
                      selectedEntryIndex === index
                        ? "ring-2 ring-blue-500 bg-blue-500"
                        : "bg-blue-400 hover:bg-blue-500"
                    }`}
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 2)}%`,
                    }}
                    title={`${target?.label || entry.target}: ${duration}s`}
                  >
                    <div className="px-1 text-xs text-white truncate">
                      {target?.label || entry.target || `Entry ${index + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Time markers */}
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>0s</span>
              <span>{(totalDuration / 2).toFixed(1)}s</span>
              <span>{totalDuration.toFixed(1)}s</span>
            </div>
          </div>

          {/* Entry List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Animation Sequence
              </span>
              <button
                onClick={addEntry}
                className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Add
              </button>
            </div>

            {config.sequence.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 rounded">
                No animations in timeline. Click "Add" to create one.
              </div>
            ) : (
              <div className="space-y-2">
                {config.sequence.map((entry: TimelineEntry, index: number) => (
                  <EntryEditor
                    key={index}
                    entry={entry}
                    index={index}
                    isSelected={selectedEntryIndex === index}
                    onSelect={() => setSelectedEntryIndex(index)}
                    onChange={(updates) => handleEntryChange(index, updates)}
                    onRemove={() => removeEntry(index)}
                    onMove={(dir) => moveEntry(index, dir)}
                    availableTargets={availableTargets}
                    canMoveUp={index > 0}
                    canMoveDown={index < config.sequence.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface EntryEditorProps {
  entry: TimelineEntry;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<TimelineEntry>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  availableTargets: { id: string; label: string }[];
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function EntryEditor({
  entry,
  index,
  isSelected,
  onSelect,
  onChange,
  onRemove,
  onMove,
  availableTargets,
  canMoveUp,
  canMoveDown,
}: EntryEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const entrancePresets = allAnimationPresets.filter(
    (p) => p.category === "entrance"
  );

  return (
    <div
      className={`border rounded-lg p-2 ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle / Index */}
        <span className="text-xs text-gray-400 w-5">{index + 1}</span>

        {/* Target Select */}
        <select
          value={entry.target}
          onChange={(e) => onChange({ target: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="">Select target...</option>
          {availableTargets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Start At */}
        <select
          value={formatStartAt(entry.startAt)}
          onChange={(e) => onChange({ startAt: parseStartAtValue(e.target.value) })}
          onClick={(e) => e.stopPropagation()}
          className="w-28 px-2 py-1 text-sm border border-gray-300 rounded"
        >
          {START_AT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Move Buttons */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMove("up");
          }}
          disabled={!canMoveUp}
          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMove("down");
          }}
          disabled={!canMoveDown}
          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
        >
          ↓
        </button>

        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? "−" : "+"}
        </button>

        {/* Remove */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-red-400 hover:text-red-600"
        >
          ×
        </button>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
          {/* Preset Selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Animation Preset</label>
            <select
              value=""
              onChange={(e) => {
                const preset = entrancePresets.find((p) => p.id === e.target.value);
                if (preset) {
                  onChange({
                    animation: {
                      ...entry.animation,
                      ...preset.config,
                    },
                  });
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="">Apply preset...</option>
              {entrancePresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration & Delay */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Duration (s)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={entry.animation.duration || 0.5}
                onChange={(e) =>
                  onChange({
                    animation: {
                      ...entry.animation,
                      duration: parseFloat(e.target.value),
                    },
                  })
                }
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Delay (s)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={entry.animation.delay || 0}
                onChange={(e) =>
                  onChange({
                    animation: {
                      ...entry.animation,
                      delay: parseFloat(e.target.value),
                    },
                  })
                }
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Label (optional)</label>
            <input
              type="text"
              placeholder="e.g., 'Hero enters'"
              value={entry.label || ""}
              onChange={(e) => onChange({ label: e.target.value || undefined })}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function parseStartTime(startAt: TimelineEntry["startAt"], currentTime: number): number {
  if (typeof startAt === "number") return startAt;
  if (startAt === "previous") return currentTime;

  const match = String(startAt).match(/^([+-])=(\d+\.?\d*)$/);
  if (match) {
    const sign = match[1] === "+" ? 1 : -1;
    const offset = parseFloat(match[2]);
    return currentTime + sign * offset;
  }

  return currentTime;
}

function formatStartAt(startAt: TimelineEntry["startAt"]): string {
  if (typeof startAt === "number") return String(startAt);
  if (startAt === "previous") return "previous";
  return String(startAt);
}

function parseStartAtValue(value: string): TimelineEntry["startAt"] {
  if (value === "previous") return "previous";
  if (value.startsWith("+=") || value.startsWith("-=")) {
    return value as `+=${number}` | `-=${number}`;
  }
  const num = parseFloat(value);
  if (!isNaN(num)) return num;
  return "previous";
}

export default TimelineField;
