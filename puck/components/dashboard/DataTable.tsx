"use client";

import { ComponentConfig } from "@puckeditor/core";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import {
  AnimationConfig,
  LockConfig,
  GroupConfig,
  defaultAnimationConfig,
  defaultLockConfig,
  defaultGroupConfig,
} from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { GroupField } from "../../fields/GroupField";

interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface TableRow {
  [key: string]: string | number | boolean;
}

export interface DataTableProps {
  title?: string;
  columns: string; // JSON string of columns
  rows: string; // JSON string of rows
  striped: boolean;
  hoverable: boolean;
  compact: boolean;
  backgroundColor: string;
  headerBackground: string;
  textColor: string;
  borderColor: string;
  borderRadius: string;
  shadow: "none" | "sm" | "md" | "lg";
  showPagination: boolean;
  rowsPerPage: number;
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  puck?: { isEditing?: boolean };
}

const shadowStyles = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
};

const defaultColumns: TableColumn[] = [
  { key: "name", label: "Name", align: "left" },
  { key: "email", label: "Email", align: "left" },
  { key: "status", label: "Status", align: "center" },
  { key: "amount", label: "Amount", align: "right" },
];

const defaultRows: TableRow[] = [
  { name: "John Doe", email: "john@example.com", status: "Active", amount: "$1,200" },
  { name: "Jane Smith", email: "jane@example.com", status: "Pending", amount: "$850" },
  { name: "Bob Wilson", email: "bob@example.com", status: "Active", amount: "$2,100" },
  { name: "Alice Brown", email: "alice@example.com", status: "Inactive", amount: "$450" },
];

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    Active: { bg: "#dcfce7", text: "#16a34a" },
    Pending: { bg: "#fef3c7", text: "#d97706" },
    Inactive: { bg: "#fee2e2", text: "#dc2626" },
  };

  const style = colors[status] || { bg: "#f3f4f6", text: "#6b7280" };

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {status}
    </span>
  );
};

export const DataTable = ({
  title,
  columns,
  rows,
  striped,
  hoverable,
  compact,
  backgroundColor,
  headerBackground,
  textColor,
  borderColor,
  borderRadius,
  shadow,
  showPagination,
  rowsPerPage,
  animation,
  lock,
  puck,
}: DataTableProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;

  let parsedColumns: TableColumn[];
  let parsedRows: TableRow[];

  try {
    parsedColumns = JSON.parse(columns);
  } catch {
    parsedColumns = defaultColumns;
  }

  try {
    parsedRows = JSON.parse(rows);
  } catch {
    parsedRows = defaultRows;
  }

  const cellPadding = compact ? "10px 12px" : "14px 16px";

  const content = (
    <div
      style={{
        position: "relative",
        backgroundColor,
        borderRadius,
        boxShadow: shadowStyles[shadow],
        border: `1px solid ${borderColor}`,
        overflow: "hidden",
      }}
    >
      {isEditing && isLocked && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#ef4444",
            color: "white",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            zIndex: 10,
          }}
        >
          🔒
        </div>
      )}

      {/* Title */}
      {title && (
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: textColor,
            }}
          >
            {title}
          </h3>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: headerBackground }}>
              {parsedColumns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: cellPadding,
                    textAlign: col.align || "left",
                    fontWeight: 600,
                    color: textColor,
                    borderBottom: `1px solid ${borderColor}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsedRows.slice(0, showPagination ? rowsPerPage : undefined).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: striped && rowIndex % 2 === 1 ? headerBackground : backgroundColor,
                  transition: hoverable ? "background-color 0.15s ease" : undefined,
                }}
                onMouseEnter={(e) => {
                  if (hoverable) {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = headerBackground;
                  }
                }}
                onMouseLeave={(e) => {
                  if (hoverable) {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                      striped && rowIndex % 2 === 1 ? headerBackground : backgroundColor;
                  }
                }}
              >
                {parsedColumns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: cellPadding,
                      textAlign: col.align || "left",
                      color: textColor,
                      borderBottom: `1px solid ${borderColor}`,
                    }}
                  >
                    {col.key === "status" ? (
                      <StatusBadge status={String(row[col.key])} />
                    ) : (
                      String(row[col.key] ?? "")
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && parsedRows.length > rowsPerPage && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderTop: `1px solid ${borderColor}`,
            backgroundColor: headerBackground,
          }}
        >
          <span style={{ fontSize: "13px", color: textColor, opacity: 0.7 }}>
            Showing 1-{Math.min(rowsPerPage, parsedRows.length)} of {parsedRows.length} rows
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                border: `1px solid ${borderColor}`,
                borderRadius: "6px",
                background: backgroundColor,
                color: textColor,
                cursor: "pointer",
              }}
            >
              Previous
            </button>
            <button
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                border: `1px solid ${borderColor}`,
                borderRadius: "6px",
                background: backgroundColor,
                color: textColor,
                cursor: "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (animation?.enabled && !isEditing) {
    return (
      <AnimatedWrapper animation={animation} isEditing={isEditing}>
        {content}
      </AnimatedWrapper>
    );
  }

  return content;
};

export const DataTableConfig: ComponentConfig<DataTableProps> = {
  label: "Data Table",
  defaultProps: {
    title: "Recent Transactions",
    columns: JSON.stringify(defaultColumns),
    rows: JSON.stringify(defaultRows),
    striped: true,
    hoverable: true,
    compact: false,
    backgroundColor: "#ffffff",
    headerBackground: "#f9fafb",
    textColor: "#1a1a1a",
    borderColor: "#e5e7eb",
    borderRadius: "12px",
    shadow: "sm",
    showPagination: true,
    rowsPerPage: 5,
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
  },
  fields: {
    title: {
      type: "text",
      label: "Table Title",
    },
    columns: {
      type: "textarea",
      label: "Columns (JSON)",
    },
    rows: {
      type: "textarea",
      label: "Rows (JSON)",
    },
    striped: {
      type: "radio",
      label: "Striped Rows",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    hoverable: {
      type: "radio",
      label: "Hoverable Rows",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    compact: {
      type: "radio",
      label: "Compact Mode",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    headerBackground: {
      type: "text",
      label: "Header Background",
    },
    textColor: {
      type: "text",
      label: "Text Color",
    },
    borderColor: {
      type: "text",
      label: "Border Color",
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "0px" },
        { label: "Small", value: "8px" },
        { label: "Medium", value: "12px" },
        { label: "Large", value: "16px" },
      ],
    },
    shadow: {
      type: "select",
      label: "Shadow",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    showPagination: {
      type: "radio",
      label: "Show Pagination",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    rowsPerPage: {
      type: "select",
      label: "Rows Per Page",
      options: [
        { label: "5", value: 5 },
        { label: "10", value: 10 },
        { label: "15", value: 15 },
        { label: "20", value: 20 },
      ],
    },
    animation: {
      type: "custom",
      label: "Animation",
      render: ({ value, onChange }) => (
        <AnimationField value={value || defaultAnimationConfig} onChange={onChange} />
      ),
    },
    lock: {
      type: "custom",
      label: "Lock",
      render: ({ value, onChange }) => (
        <LockField value={value || defaultLockConfig} onChange={onChange} />
      ),
    },
    group: {
      type: "custom",
      label: "Group",
      render: ({ value, onChange }) => (
        <GroupField value={value || defaultGroupConfig} onChange={onChange} />
      ),
    },
  },
  render: DataTable,
};
