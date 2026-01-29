"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InvoiceData } from "@/lib/storage";

const CURRENCIES: Record<string, string> = {
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  CAD: "C$",
  AUD: "A$",
  INR: "\u20B9",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      const response = await fetch("/api/invoices");
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.map((inv: InvoiceData) => ({
          ...inv,
          issueDate: new Date(inv.issueDate),
          dueDate: inv.dueDate ? new Date(inv.dueDate) : undefined,
        })));
      }
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteInvoice(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      setInvoices(invoices.filter((inv) => inv.id !== id));
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  }

  async function duplicateInvoice(invoice: InvoiceData, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      // Get next invoice number
      const numResponse = await fetch("/api/invoices?action=next-number");
      const { invoiceNumber } = await numResponse.json();

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoice,
          id: undefined,
          invoiceNumber,
          status: "draft",
          issueDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        loadInvoices();
      }
    } catch (error) {
      console.error("Failed to duplicate invoice:", error);
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = CURRENCIES[currency] || "$";
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredInvoices = filter === "all"
    ? invoices
    : invoices.filter((inv) => inv.status === filter);

  const stats = {
    total: invoices.length,
    draft: invoices.filter((inv) => inv.status === "draft").length,
    sent: invoices.filter((inv) => inv.status === "sent").length,
    paid: invoices.filter((inv) => inv.status === "paid").length,
    overdue: invoices.filter((inv) => inv.status === "overdue").length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0),
  };

  if (loading) {
    return (
      <div className="invoices-page">
        <div className="loading">Loading invoices...</div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="invoices-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <a href="/" className="back-link">← Back to Pages</a>
          <h1>Invoices</h1>
          <p className="subtitle">Create and manage invoices</p>
        </div>
        <button onClick={() => router.push("/invoices/new")} className="create-btn">
          + New Invoice
        </button>
      </header>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.paid}</div>
          <div className="stat-label">Paid</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.sent + stats.overdue}</div>
          <div className="stat-label">Outstanding</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-value">${stats.paidAmount.toFixed(2)}</div>
          <div className="stat-label">Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({stats.total})
        </button>
        <button
          className={`filter-btn ${filter === "draft" ? "active" : ""}`}
          onClick={() => setFilter("draft")}
        >
          Draft ({stats.draft})
        </button>
        <button
          className={`filter-btn ${filter === "sent" ? "active" : ""}`}
          onClick={() => setFilter("sent")}
        >
          Sent ({stats.sent})
        </button>
        <button
          className={`filter-btn ${filter === "paid" ? "active" : ""}`}
          onClick={() => setFilter("paid")}
        >
          Paid ({stats.paid})
        </button>
        <button
          className={`filter-btn ${filter === "overdue" ? "active" : ""}`}
          onClick={() => setFilter("overdue")}
        >
          Overdue ({stats.overdue})
        </button>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <h2>{filter === "all" ? "No invoices yet" : `No ${filter} invoices`}</h2>
          <p>
            {filter === "all"
              ? "Create your first invoice to get started"
              : `You don't have any ${filter} invoices`}
          </p>
          {filter === "all" && (
            <button onClick={() => router.push("/invoices/new")} className="create-btn large">
              Create Invoice
            </button>
          )}
        </div>
      ) : (
        <div className="invoices-table">
          <div className="table-header">
            <div className="col-number">Invoice #</div>
            <div className="col-customer">Customer</div>
            <div className="col-date">Issue Date</div>
            <div className="col-due">Due Date</div>
            <div className="col-amount">Amount</div>
            <div className="col-status">Status</div>
            <div className="col-actions"></div>
          </div>

          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="table-row"
              onClick={() => router.push(`/invoices/${invoice.id}`)}
            >
              <div className="col-number">
                <span className="invoice-number">{invoice.invoiceNumber}</span>
              </div>
              <div className="col-customer">
                <div className="customer-name">{invoice.customerName}</div>
                {invoice.customerCompany && (
                  <div className="customer-company">{invoice.customerCompany}</div>
                )}
              </div>
              <div className="col-date">{formatDate(invoice.issueDate)}</div>
              <div className="col-due">{formatDate(invoice.dueDate)}</div>
              <div className="col-amount">
                {formatCurrency(invoice.total, invoice.currency)}
              </div>
              <div className="col-status">
                <span className={`status-badge ${invoice.status}`}>{invoice.status}</span>
              </div>
              <div className="col-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/invoices/preview/${invoice.id}`, "_blank");
                  }}
                  className="action-btn"
                  title="Preview"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  onClick={(e) => duplicateInvoice(invoice, e)}
                  className="action-btn"
                  title="Duplicate"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
                <button
                  onClick={(e) => deleteInvoice(invoice.id, e)}
                  className="action-btn delete"
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .invoices-page {
    min-height: 100vh;
    background: #f9fafb;
    padding: 32px;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50vh;
    color: #6b7280;
    font-size: 16px;
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .back-link {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .back-link:hover {
    color: #374151;
  }

  .page-header h1 {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .subtitle {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
  }

  .create-btn {
    padding: 10px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .create-btn:hover {
    background: #2563eb;
  }

  .create-btn.large {
    padding: 14px 28px;
    font-size: 16px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto 24px;
  }

  .stat-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
  }

  .stat-card.highlight {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    color: white;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
  }

  .stat-card.highlight .stat-value {
    color: white;
  }

  .stat-label {
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
  }

  .stat-card.highlight .stat-label {
    color: rgba(255, 255, 255, 0.8);
  }

  .filters {
    display: flex;
    gap: 8px;
    max-width: 1200px;
    margin: 0 auto 24px;
  }

  .filter-btn {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .filter-btn:hover {
    border-color: #d1d5db;
  }

  .filter-btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
    max-width: 1200px;
    margin: 0 auto;
  }

  .empty-icon {
    color: #d1d5db;
    margin-bottom: 24px;
  }

  .empty-state h2 {
    font-size: 20px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
  }

  .empty-state p {
    color: #6b7280;
    margin: 0 0 24px 0;
  }

  .invoices-table {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    max-width: 1200px;
    margin: 0 auto;
  }

  .table-header, .table-row {
    display: grid;
    grid-template-columns: 140px 1fr 120px 120px 120px 100px 100px;
    gap: 12px;
    padding: 16px 20px;
    align-items: center;
  }

  .table-header {
    background: #f9fafb;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .table-row {
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row:hover {
    background: #f9fafb;
  }

  .invoice-number {
    font-weight: 600;
    color: #111827;
  }

  .customer-name {
    font-weight: 500;
    color: #111827;
  }

  .customer-company {
    font-size: 12px;
    color: #6b7280;
  }

  .col-date, .col-due {
    color: #6b7280;
    font-size: 14px;
  }

  .col-amount {
    font-weight: 600;
    color: #111827;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 4px;
    text-transform: capitalize;
  }

  .status-badge.draft { background: #f3f4f6; color: #6b7280; }
  .status-badge.sent { background: #dbeafe; color: #1d4ed8; }
  .status-badge.paid { background: #d1fae5; color: #065f46; }
  .status-badge.overdue { background: #fee2e2; color: #dc2626; }
  .status-badge.cancelled { background: #fef3c7; color: #92400e; }

  .col-actions {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
  }

  .action-btn {
    padding: 8px;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .action-btn.delete:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
  }

  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .table-header, .table-row {
      grid-template-columns: 1fr 1fr 100px 80px;
    }

    .col-date, .col-due {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .invoices-page {
      padding: 16px;
    }

    .stats-grid {
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .filters {
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .table-header {
      display: none;
    }

    .table-row {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }
`;
