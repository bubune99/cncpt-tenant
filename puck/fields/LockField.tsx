"use client";

import { useState } from "react";
import { LockConfig, defaultLockConfig } from "../animations/types";

interface LockFieldProps {
  value: Partial<LockConfig>;
  onChange: (value: Partial<LockConfig>) => void;
}

export function LockField({ value, onChange }: LockFieldProps) {
  const config = { ...defaultLockConfig, ...value };
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState(config.password || "");

  const updateConfig = (updates: Partial<LockConfig>) => {
    onChange({ ...config, ...updates });
  };

  const lockTypes: Array<{ value: LockConfig["lockType"]; label: string; description: string }> = [
    { value: "full", label: "Full Lock", description: "Prevents all editing" },
    { value: "position", label: "Position", description: "Lock position only" },
    { value: "content", label: "Content", description: "Lock text/content only" },
    { value: "style", label: "Style", description: "Lock styling only" },
  ];

  return (
    <div className="lock-field">
      {/* Lock Toggle */}
      <div className="field-row toggle-row">
        <label>Lock Component</label>
        <button
          className={`toggle-btn ${config.isLocked ? "active locked" : ""}`}
          onClick={() => updateConfig({ isLocked: !config.isLocked })}
        >
          {config.isLocked ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              LOCKED
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
              </svg>
              UNLOCKED
            </>
          )}
        </button>
      </div>

      {config.isLocked && (
        <>
          {/* Lock Type */}
          <div className="field-group">
            <label>Lock Type</label>
            <div className="lock-type-grid">
              {lockTypes.map((type) => (
                <button
                  key={type.value}
                  className={`lock-type-btn ${config.lockType === type.value ? "active" : ""}`}
                  onClick={() => updateConfig({ lockType: type.value })}
                  title={type.description}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Password Protection */}
          <div className="field-group">
            <label>Password Protection (Optional)</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password to protect"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onBlur={() => updateConfig({ password: passwordInput || undefined })}
              />
              <button
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                )}
              </button>
            </div>
            <span className="helper-text">Set a password to prevent accidental unlocking</span>
          </div>
        </>
      )}

      <style>{`
        .lock-field {
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

        .toggle-btn.active {
          background: #3b82f6;
          color: white;
        }

        .toggle-btn.locked {
          background: #ef4444;
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

        .lock-type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .lock-type-btn {
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .lock-type-btn:hover {
          border-color: #d1d5db;
          color: #374151;
        }

        .lock-type-btn.active {
          background: #fef2f2;
          border-color: #ef4444;
          color: #ef4444;
        }

        .password-field {
          display: flex;
          gap: 8px;
        }

        .password-field input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
        }

        .toggle-visibility {
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          color: #6b7280;
        }

        .toggle-visibility:hover {
          background: #f9fafb;
        }

        .helper-text {
          display: block;
          margin-top: 6px;
          font-size: 11px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
