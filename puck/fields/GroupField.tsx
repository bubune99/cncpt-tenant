"use client";

import { GroupConfig, defaultGroupConfig } from "../animations/types";

interface GroupFieldProps {
  value: Partial<GroupConfig>;
  onChange: (value: Partial<GroupConfig>) => void;
  componentId?: string;
}

export function GroupField({ value, onChange, componentId }: GroupFieldProps) {
  const config = { ...defaultGroupConfig, ...value };

  const updateConfig = (updates: Partial<GroupConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="group-field">
      {/* Group Parent Toggle */}
      <div className="field-row toggle-row">
        <label>Group Container</label>
        <button
          className={`toggle-btn ${config.isGroupParent ? "active" : ""}`}
          onClick={() => updateConfig({
            isGroupParent: !config.isGroupParent,
            groupId: !config.isGroupParent ? `group-${Date.now()}` : undefined
          })}
        >
          {config.isGroupParent ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
              </svg>
              GROUP
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
              </svg>
              SINGLE
            </>
          )}
        </button>
      </div>

      {config.isGroupParent && (
        <>
          {/* Group ID Display */}
          <div className="field-group">
            <label>Group ID</label>
            <input
              type="text"
              value={config.groupId || ""}
              onChange={(e) => updateConfig({ groupId: e.target.value })}
              placeholder="Enter group identifier"
              className="group-id-input"
            />
            <span className="helper-text">Use this ID to reference this group</span>
          </div>

          {/* Collapse Toggle */}
          <div className="field-row">
            <label>Collapsed in Outline</label>
            <button
              className={`toggle-btn small ${config.collapsed ? "active" : ""}`}
              onClick={() => updateConfig({ collapsed: !config.collapsed })}
            >
              {config.collapsed ? "YES" : "NO"}
            </button>
          </div>

          {/* Group Children Count */}
          {config.groupChildren && config.groupChildren.length > 0 && (
            <div className="field-group children-info">
              <label>Group Members</label>
              <div className="children-count">
                <span className="count">{config.groupChildren.length}</span>
                <span className="label">components in this group</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Group Assignment (for non-parent components) */}
      {!config.isGroupParent && (
        <div className="field-group">
          <label>Assign to Group</label>
          <input
            type="text"
            value={config.groupId || ""}
            onChange={(e) => updateConfig({ groupId: e.target.value || undefined })}
            placeholder="Enter group ID to join"
            className="group-id-input"
          />
          <span className="helper-text">Enter a group ID to add this component to an existing group</span>
        </div>
      )}

      <style>{`
        .group-field {
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 13px;
        }

        .field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .field-row label {
          font-weight: 500;
          color: #374151;
        }

        .toggle-row {
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          background: #e5e7eb;
          color: #6b7280;
        }

        .toggle-btn.small {
          padding: 4px 12px;
          font-size: 11px;
        }

        .toggle-btn.active {
          background: #8b5cf6;
          color: white;
        }

        .field-group {
          margin: 12px 0;
        }

        .field-group label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .group-id-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          font-family: monospace;
        }

        .group-id-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .helper-text {
          display: block;
          margin-top: 6px;
          font-size: 11px;
          color: #9ca3af;
        }

        .children-info {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
        }

        .children-count {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .children-count .count {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #8b5cf6;
          color: white;
          border-radius: 50%;
          font-weight: 600;
        }

        .children-count .label {
          color: #6b7280;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
