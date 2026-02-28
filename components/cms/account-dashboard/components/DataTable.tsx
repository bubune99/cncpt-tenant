"use client";

import React from "react";

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
}: DataTableProps) => {
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

  return (
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
};
