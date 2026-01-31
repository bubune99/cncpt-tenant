"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InvoiceData } from '@/lib/cms/storage";

const CURRENCIES: Record<string, string> = {
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  CAD: "C$",
  AUD: "A$",
  INR: "\u20B9",
};

export default function InvoicePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId === "new") {
      setLoading(false);
      return;
    }

    fetch(`/api/invoices?id=${invoiceId}`)
      .then((res) => res.json())
      .then((data) => {
        setInvoice({
          ...data,
          issueDate: new Date(data.issueDate),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        });
      })
      .catch(() => router.push("/invoices"))
      .finally(() => setLoading(false));
  }, [invoiceId, router]);

  const formatCurrency = (amount: number) => {
    const symbol = CURRENCIES[invoice?.currency || "USD"] || "$";
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="preview-page">
        <div className="loading">Loading invoice...</div>
        <style>{styles}</style>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="preview-page">
        <div className="error">
          <h2>Invoice Not Found</h2>
          <p>Save the invoice first to preview it.</p>
          <button onClick={() => router.back()}>Go Back</button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  const accentColor = invoice.accentColor || "#3b82f6";

  return (
    <div className="preview-page">
      {/* Header Bar */}
      <div className="preview-header">
        <div className="header-left">
          <button onClick={() => router.push("/invoices")} className="back-btn">
            ← Back
          </button>
          <span className="invoice-number">Invoice {invoice.invoiceNumber}</span>
        </div>
        <div className="header-right">
          <button onClick={() => router.push(`/invoices/${invoiceId}`)} className="edit-btn">
            Edit
          </button>
          <button
            onClick={() => window.open(`/api/invoices/pdf?id=${invoiceId}`, "_blank")}
            className="download-btn"
          >
            Download PDF
          </button>
          <button onClick={() => window.print()} className="print-btn">
            Print
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="preview-container">
        <div className={`invoice-document template-${invoice.template}`} style={{ "--accent-color": accentColor } as React.CSSProperties}>
          {/* Header */}
          <div className="invoice-header">
            <div className="business-info">
              {invoice.businessLogo && (
                <img src={invoice.businessLogo} alt="Logo" className="business-logo" />
              )}
              <div className="business-name">{invoice.businessName || "Your Business"}</div>
              {invoice.businessAddress && (
                <div className="business-address">{invoice.businessAddress}</div>
              )}
              {invoice.businessEmail && <div>{invoice.businessEmail}</div>}
              {invoice.businessPhone && <div>{invoice.businessPhone}</div>}
            </div>
            <div className="invoice-title-section">
              <h1 className="invoice-title">INVOICE</h1>
              <div className="invoice-meta">
                <div className="meta-row">
                  <span className="meta-label">Invoice #</span>
                  <span className="meta-value">{invoice.invoiceNumber}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Issue Date</span>
                  <span className="meta-value">{formatDate(invoice.issueDate)}</span>
                </div>
                {invoice.dueDate && (
                  <div className="meta-row">
                    <span className="meta-label">Due Date</span>
                    <span className="meta-value">{formatDate(invoice.dueDate)}</span>
                  </div>
                )}
                <div className="meta-row status-row">
                  <span className="meta-label">Status</span>
                  <span className={`status-badge ${invoice.status}`}>{invoice.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="bill-to-section">
            <div className="section-label">Bill To</div>
            <div className="customer-info">
              <div className="customer-name">{invoice.customerName}</div>
              {invoice.customerCompany && <div>{invoice.customerCompany}</div>}
              {invoice.customerAddress && <div>{invoice.customerAddress}</div>}
              {invoice.customerEmail && <div>{invoice.customerEmail}</div>}
              {invoice.customerPhone && <div>{invoice.customerPhone}</div>}
            </div>
          </div>

          {/* Line Items */}
          <div className="items-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th className="col-description">Description</th>
                  <th className="col-qty">Qty</th>
                  <th className="col-price">Unit Price</th>
                  <th className="col-amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.lineItems || []).map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="col-description">{item.description}</td>
                    <td className="col-qty">{item.quantity}</td>
                    <td className="col-price">{formatCurrency(item.unitPrice)}</td>
                    <td className="col-amount">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="totals-section">
            <div className="totals-table">
              <div className="total-row">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="total-row discount">
                  <span>
                    Discount
                    {invoice.discountType === "percentage" && ` (${invoice.discountValue}%)`}
                  </span>
                  <span>-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="total-row tax">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="notes-section">
              {invoice.notes && (
                <div className="notes-block">
                  <div className="notes-label">Notes</div>
                  <div className="notes-content">{invoice.notes}</div>
                </div>
              )}
              {invoice.terms && (
                <div className="notes-block">
                  <div className="notes-label">Terms & Conditions</div>
                  <div className="notes-content">{invoice.terms}</div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="invoice-footer">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .preview-page {
    min-height: 100vh;
    background: #374151;
  }

  .loading, .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: white;
    gap: 16px;
  }

  .error h2 {
    margin: 0;
  }

  .error button {
    padding: 8px 16px;
    background: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: #1f2937;
    border-bottom: 1px solid #4b5563;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-btn {
    padding: 8px 12px;
    font-size: 14px;
    color: #9ca3af;
    background: none;
    border: none;
    cursor: pointer;
  }

  .back-btn:hover {
    color: white;
  }

  .invoice-number {
    color: white;
    font-size: 14px;
    font-weight: 500;
  }

  .header-right {
    display: flex;
    gap: 12px;
  }

  .edit-btn, .print-btn, .download-btn {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
  }

  .edit-btn {
    background: #4b5563;
    border: none;
    color: white;
  }

  .edit-btn:hover {
    background: #6b7280;
  }

  .download-btn {
    background: #10b981;
    border: none;
    color: white;
  }

  .download-btn:hover {
    background: #059669;
  }

  .print-btn {
    background: #3b82f6;
    border: none;
    color: white;
  }

  .print-btn:hover {
    background: #2563eb;
  }

  .preview-container {
    padding: 32px;
    display: flex;
    justify-content: center;
  }

  .invoice-document {
    width: 100%;
    max-width: 800px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }

  /* Modern Template */
  .template-modern .invoice-header {
    display: flex;
    justify-content: space-between;
    padding: 40px;
    background: linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 80%, black) 100%);
    color: white;
  }

  .template-modern .business-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
  }

  .template-modern .business-name {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .template-modern .invoice-title-section {
    text-align: right;
  }

  .template-modern .invoice-title {
    font-size: 36px;
    font-weight: 700;
    margin: 0 0 16px 0;
    letter-spacing: 2px;
  }

  .template-modern .invoice-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
  }

  .template-modern .meta-row {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .template-modern .meta-label {
    opacity: 0.8;
  }

  .template-modern .meta-value {
    font-weight: 500;
    min-width: 120px;
  }

  /* Classic Template */
  .template-classic .invoice-header {
    display: flex;
    justify-content: space-between;
    padding: 40px;
    border-bottom: 3px solid var(--accent-color);
  }

  .template-classic .business-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: #374151;
  }

  .template-classic .business-name {
    font-size: 24px;
    font-weight: 700;
    color: var(--accent-color);
    margin-bottom: 8px;
  }

  .template-classic .invoice-title-section {
    text-align: right;
  }

  .template-classic .invoice-title {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 3px;
  }

  .template-classic .invoice-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
  }

  .template-classic .meta-row {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .template-classic .meta-label {
    color: #6b7280;
  }

  .template-classic .meta-value {
    font-weight: 600;
    color: #111827;
    min-width: 120px;
  }

  /* Minimal Template */
  .template-minimal .invoice-header {
    display: flex;
    justify-content: space-between;
    padding: 40px;
  }

  .template-minimal .business-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: #6b7280;
  }

  .template-minimal .business-name {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }

  .template-minimal .invoice-title-section {
    text-align: right;
  }

  .template-minimal .invoice-title {
    font-size: 28px;
    font-weight: 300;
    color: #111827;
    margin: 0 0 16px 0;
    letter-spacing: 4px;
  }

  .template-minimal .invoice-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }

  .template-minimal .meta-row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .template-minimal .meta-label {
    color: #9ca3af;
  }

  .template-minimal .meta-value {
    color: #374151;
    min-width: 100px;
  }

  /* Common Sections */
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 4px;
  }

  .status-badge.draft { background: rgba(107, 114, 128, 0.2); color: #6b7280; }
  .status-badge.sent { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
  .status-badge.paid { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .status-badge.overdue { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
  .status-badge.cancelled { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }

  .template-modern .status-badge {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .bill-to-section {
    padding: 24px 40px;
    background: #f9fafb;
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9ca3af;
    margin-bottom: 8px;
  }

  .customer-info {
    font-size: 14px;
    color: #374151;
    line-height: 1.6;
  }

  .customer-name {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .items-section {
    padding: 24px 40px;
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
  }

  .items-table th {
    padding: 12px 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
    text-align: left;
    border-bottom: 2px solid #e5e7eb;
  }

  .items-table td {
    padding: 16px 8px;
    font-size: 14px;
    color: #374151;
    border-bottom: 1px solid #f3f4f6;
  }

  .items-table .col-qty,
  .items-table .col-price,
  .items-table .col-amount {
    text-align: right;
    width: 100px;
  }

  .items-table .col-amount {
    font-weight: 500;
  }

  .totals-section {
    padding: 24px 40px;
    display: flex;
    justify-content: flex-end;
  }

  .totals-table {
    width: 280px;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
    color: #374151;
  }

  .total-row.discount {
    color: #10b981;
  }

  .total-row.grand-total {
    padding-top: 12px;
    margin-top: 8px;
    border-top: 2px solid #e5e7eb;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }

  .template-modern .total-row.grand-total span:last-child {
    color: var(--accent-color);
  }

  .notes-section {
    padding: 24px 40px;
    background: #f9fafb;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .notes-block {
    font-size: 14px;
  }

  .notes-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9ca3af;
    margin-bottom: 8px;
  }

  .notes-content {
    color: #6b7280;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .invoice-footer {
    padding: 24px 40px;
    text-align: center;
    color: #9ca3af;
    font-size: 14px;
    border-top: 1px solid #e5e7eb;
  }

  /* Print Styles */
  @media print {
    .preview-header {
      display: none;
    }

    .preview-page {
      background: white;
    }

    .preview-container {
      padding: 0;
    }

    .invoice-document {
      box-shadow: none;
      border-radius: 0;
      max-width: 100%;
    }
  }
`;
