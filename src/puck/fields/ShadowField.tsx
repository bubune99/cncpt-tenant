"use client";

interface ShadowOption {
  value: string;
  label: string;
  shadow: string;
}

interface ShadowFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const shadowOptions: ShadowOption[] = [
  { value: "none", label: "None", shadow: "none" },
  { value: "sm", label: "Small", shadow: "0 1px 2px rgba(0,0,0,0.05)" },
  { value: "md", label: "Medium", shadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)" },
  { value: "lg", label: "Large", shadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)" },
  { value: "xl", label: "Extra Large", shadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" },
  { value: "2xl", label: "2XL", shadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
];

export function ShadowField({ value, onChange }: ShadowFieldProps) {
  return (
    <div className="shadow-field">
      <div className="shadow-options">
        {shadowOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`shadow-option ${value === option.value ? "active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            <div
              className="shadow-preview"
              style={{ boxShadow: option.shadow }}
            />
            <span className="shadow-label">{option.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        .shadow-field {
          padding: 8px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .shadow-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .shadow-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 8px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .shadow-option:hover {
          border-color: #d1d5db;
        }

        .shadow-option.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .shadow-preview {
          width: 40px;
          height: 24px;
          background: white;
          border-radius: 4px;
        }

        .shadow-label {
          font-size: 10px;
          font-weight: 500;
          color: #6b7280;
        }

        .shadow-option.active .shadow-label {
          color: #3b82f6;
        }
      `}</style>
    </div>
  );
}

// Export shadow value to CSS helper
export function getShadowCSS(value: string): string {
  const option = shadowOptions.find((o) => o.value === value);
  return option?.shadow || "none";
}
