"use client";

interface BorderRadiusOption {
  value: string;
  label: string;
}

interface BorderRadiusFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const radiusOptions: BorderRadiusOption[] = [
  { value: "0px", label: "None" },
  { value: "4px", label: "XS" },
  { value: "8px", label: "SM" },
  { value: "12px", label: "MD" },
  { value: "16px", label: "LG" },
  { value: "24px", label: "XL" },
  { value: "9999px", label: "Full" },
];

export function BorderRadiusField({ value, onChange }: BorderRadiusFieldProps) {
  return (
    <div className="border-radius-field">
      <div className="radius-options">
        {radiusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`radius-option ${value === option.value ? "active" : ""}`}
            onClick={() => onChange(option.value)}
            title={option.value}
          >
            <div
              className="radius-preview"
              style={{ borderRadius: option.value }}
            />
            <span className="radius-label">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="custom-radius">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Custom (e.g., 20px)"
          className="custom-input"
        />
      </div>

      <style>{`
        .border-radius-field {
          padding: 8px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .radius-options {
          display: flex;
          gap: 6px;
          margin-bottom: 8px;
        }

        .radius-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 4px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .radius-option:hover {
          border-color: #d1d5db;
        }

        .radius-option.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .radius-preview {
          width: 24px;
          height: 24px;
          background: #3b82f6;
        }

        .radius-label {
          font-size: 9px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
        }

        .radius-option.active .radius-label {
          color: #3b82f6;
        }

        .custom-radius {
          display: flex;
          gap: 8px;
        }

        .custom-input {
          flex: 1;
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
