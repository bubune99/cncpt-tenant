"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { InvoiceData, InvoiceLineItem } from '@/lib/cms/storage";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "\u20AC", name: "Euro" },
  { code: "GBP", symbol: "\u00A3", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "INR", symbol: "\u20B9", name: "Indian Rupee" },
];

const TEMPLATES = [
  { id: "modern", name: "Modern", description: "Clean and contemporary" },
  { id: "classic", name: "Classic", description: "Traditional professional" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant" },
];

const defaultInvoice: Partial<InvoiceData> = {
  status: "draft",
  issueDate: new Date(),
  lineItems: [],
  subtotal: 0,
  taxRate: 0,
  taxAmount: 0,
  discountType: "none",
  discountValue: 0,
  discountAmount: 0,
  total: 0,
  currency: "USD",
  template: "modern",
  accentColor: "#3b82f6",
  customerName: "",
};

export default function InvoiceEditorPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const isNew = invoiceId === "new";

  const [invoice, setInvoice] = useState<Partial<InvoiceData>>(defaultInvoice);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "items" | "settings">("details");

  useEffect(() => {
    if (!isNew) {
      loadInvoice();
    } else {
      // Get next invoice number for new invoices
      fetch("/api/invoices?action=next-number")
        .then((res) => res.json())
        .then((data) => {
          setInvoice((prev) => ({ ...prev, invoiceNumber: data.invoiceNumber }));
        });
    }
  }, [invoiceId, isNew]);

  async function loadInvoice() {
    try {
      const response = await fetch(`/api/invoices?id=${invoiceId}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice({
          ...data,
          issueDate: new Date(data.issueDate),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        });
      } else {
        router.push("/invoices");
      }
    } catch (error) {
      console.error("Failed to load invoice:", error);
    } finally {
      setLoading(false);
    }
  }

  const calculateTotals = useCallback((items: InvoiceLineItem[], taxRate: number, discountType: string, discountValue: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = subtotal * (discountValue / 100);
    } else if (discountType === "fixed") {
      discountAmount = discountValue;
    }

    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const total = taxableAmount + taxAmount;

    return { subtotal, taxAmount, discountAmount, total };
  }, []);

  const updateInvoice = useCallback((updates: Partial<InvoiceData>) => {
    setInvoice((prev) => {
      const updated = { ...prev, ...updates };

      // Recalculate totals if relevant fields changed
      if ("lineItems" in updates || "taxRate" in updates || "discountType" in updates || "discountValue" in updates) {
        const totals = calculateTotals(
          updated.lineItems || [],
          updated.taxRate || 0,
          updated.discountType || "none",
          updated.discountValue || 0
        );
        return { ...updated, ...totals };
      }

      return updated;
    });
  }, [calculateTotals]);

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      total: 0,
    };
    updateInvoice({ lineItems: [...(invoice.lineItems || []), newItem] });
  };

  const updateLineItem = (id: string, updates: Partial<InvoiceLineItem>) => {
    const items = (invoice.lineItems || []).map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      updated.amount = updated.quantity * updated.unitPrice;
      return updated;
    });
    updateInvoice({ lineItems: items });
  };

  const removeLineItem = (id: string) => {
    updateInvoice({
      lineItems: (invoice.lineItems || []).filter((item) => item.id !== id),
    });
  };

  async function saveInvoice() {
    setSaving(true);
    try {
      const method = isNew ? "POST" : "PUT";
      const body = {
        ...invoice,
        id: isNew ? `inv-${Date.now()}` : invoiceId,
        issueDate: invoice.issueDate?.toISOString(),
        dueDate: invoice.dueDate?.toISOString(),
      };

      const response = await fetch("/api/invoices", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const saved = await response.json();
        if (isNew) {
          router.push(`/invoices/${saved.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to save invoice:", error);
    } finally {
      setSaving(false);
    }
  }

  const getCurrencySymbol = () => {
    return CURRENCIES.find((c) => c.code === invoice.currency)?.symbol || "$";
  };

  const formatCurrency = (amount: number) => {
    return `${getCurrencySymbol()}${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="invoice-editor">
        <div className="loading">Loading invoice...</div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="invoice-editor">
      {/* Header */}
      <header className="editor-header">
        <div className="header-left">
          <button onClick={() => router.push("/invoices")} className="back-btn">
            ← Back to Invoices
          </button>
          <h1>{isNew ? "New Invoice" : `Invoice ${invoice.invoiceNumber}`}</h1>
          <span className={`status-badge ${invoice.status}`}>{invoice.status}</span>
        </div>
        <div className="header-right">
          <button
            onClick={() => window.open(`/invoices/preview/${isNew ? "new" : invoiceId}`, "_blank")}
            className="preview-btn"
            disabled={isNew && !invoice.customerName}
          >
            Preview
          </button>
          <button onClick={saveInvoice} disabled={saving} className="save-btn">
            {saving ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "details" ? "active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
        <button
          className={`tab ${activeTab === "items" ? "active" : ""}`}
          onClick={() => setActiveTab("items")}
        >
          Line Items
        </button>
        <button
          className={`tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="editor-content">
        {activeTab === "details" && (
          <div className="tab-content">
            <div className="form-grid">
              {/* Invoice Info */}
              <div className="form-section">
                <h3>Invoice Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Invoice Number</label>
                    <input
                      type="text"
                      value={invoice.invoiceNumber || ""}
                      onChange={(e) => updateInvoice({ invoiceNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={invoice.status}
                      onChange={(e) => updateInvoice({ status: e.target.value as InvoiceData["status"] })}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Issue Date</label>
                    <input
                      type="date"
                      value={invoice.issueDate?.toISOString().split("T")[0] || ""}
                      onChange={(e) => updateInvoice({ issueDate: new Date(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={invoice.dueDate?.toISOString().split("T")[0] || ""}
                      onChange={(e) => updateInvoice({ dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                    />
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="form-section">
                <h3>Your Business</h3>
                <div className="form-group">
                  <label>Business Name</label>
                  <input
                    type="text"
                    value={invoice.businessName || ""}
                    onChange={(e) => updateInvoice({ businessName: e.target.value })}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={invoice.businessEmail || ""}
                      onChange={(e) => updateInvoice({ businessEmail: e.target.value })}
                      placeholder="email@company.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={invoice.businessPhone || ""}
                      onChange={(e) => updateInvoice({ businessPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={invoice.businessAddress || ""}
                    onChange={(e) => updateInvoice({ businessAddress: e.target.value })}
                    placeholder="123 Business St, City, State 12345"
                    rows={2}
                  />
                </div>
              </div>

              {/* Customer Info */}
              <div className="form-section">
                <h3>Bill To</h3>
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    value={invoice.customerName || ""}
                    onChange={(e) => updateInvoice({ customerName: e.target.value })}
                    placeholder="Customer Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={invoice.customerCompany || ""}
                    onChange={(e) => updateInvoice({ customerCompany: e.target.value })}
                    placeholder="Customer Company"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={invoice.customerEmail || ""}
                      onChange={(e) => updateInvoice({ customerEmail: e.target.value })}
                      placeholder="customer@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={invoice.customerPhone || ""}
                      onChange={(e) => updateInvoice({ customerPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={invoice.customerAddress || ""}
                    onChange={(e) => updateInvoice({ customerAddress: e.target.value })}
                    placeholder="Customer address"
                    rows={2}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={invoice.notes || ""}
                    onChange={(e) => updateInvoice({ notes: e.target.value })}
                    placeholder="Notes for the customer (e.g., Thank you for your business!)"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Terms & Conditions</label>
                  <textarea
                    value={invoice.terms || ""}
                    onChange={(e) => updateInvoice({ terms: e.target.value })}
                    placeholder="Payment terms and conditions"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "items" && (
          <div className="tab-content">
            <div className="items-section">
              <div className="items-header">
                <h3>Line Items</h3>
                <button onClick={addLineItem} className="add-item-btn">
                  + Add Item
                </button>
              </div>

              <div className="items-table">
                <div className="table-header">
                  <div className="col-description">Description</div>
                  <div className="col-qty">Qty</div>
                  <div className="col-price">Unit Price</div>
                  <div className="col-amount">Amount</div>
                  <div className="col-actions"></div>
                </div>

                {(invoice.lineItems || []).length === 0 ? (
                  <div className="empty-items">
                    <p>No items added yet</p>
                    <button onClick={addLineItem} className="add-item-btn secondary">
                      + Add your first item
                    </button>
                  </div>
                ) : (
                  (invoice.lineItems || []).map((item) => (
                    <div key={item.id} className="table-row">
                      <div className="col-description">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-qty">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="col-price">
                        <div className="price-input">
                          <span className="currency">{getCurrencySymbol()}</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="col-amount">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="col-actions">
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="delete-btn"
                          title="Remove item"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="totals-section">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal || 0)}</span>
                </div>

                <div className="totals-row discount-row">
                  <div className="discount-controls">
                    <span>Discount</span>
                    <select
                      value={invoice.discountType}
                      onChange={(e) => updateInvoice({ discountType: e.target.value as InvoiceData["discountType"] })}
                    >
                      <option value="none">None</option>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                    {invoice.discountType !== "none" && (
                      <input
                        type="number"
                        value={invoice.discountValue || 0}
                        onChange={(e) => updateInvoice({ discountValue: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step={invoice.discountType === "percentage" ? "1" : "0.01"}
                        className="discount-input"
                      />
                    )}
                    {invoice.discountType === "percentage" && <span>%</span>}
                  </div>
                  <span>-{formatCurrency(invoice.discountAmount || 0)}</span>
                </div>

                <div className="totals-row tax-row">
                  <div className="tax-controls">
                    <span>Tax Rate</span>
                    <input
                      type="number"
                      value={invoice.taxRate || 0}
                      onChange={(e) => updateInvoice({ taxRate: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.1"
                      className="tax-input"
                    />
                    <span>%</span>
                  </div>
                  <span>{formatCurrency(invoice.taxAmount || 0)}</span>
                </div>

                <div className="totals-row total-row">
                  <span>Total</span>
                  <span className="total-amount">{formatCurrency(invoice.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="tab-content">
            <div className="settings-grid">
              <div className="form-section">
                <h3>Currency</h3>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={invoice.currency}
                    onChange={(e) => updateInvoice({ currency: e.target.value })}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Template</h3>
                <div className="template-options">
                  {TEMPLATES.map((template) => (
                    <label
                      key={template.id}
                      className={`template-option ${invoice.template === template.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={invoice.template === template.id}
                        onChange={(e) => updateInvoice({ template: e.target.value as InvoiceData["template"] })}
                      />
                      <div className="template-preview" data-template={template.id}></div>
                      <div className="template-info">
                        <span className="template-name">{template.name}</span>
                        <span className="template-desc">{template.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Accent Color</h3>
                <div className="form-group">
                  <div className="color-picker">
                    <input
                      type="color"
                      value={invoice.accentColor || "#3b82f6"}
                      onChange={(e) => updateInvoice({ accentColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={invoice.accentColor || "#3b82f6"}
                      onChange={(e) => updateInvoice({ accentColor: e.target.value })}
                      className="color-text"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .invoice-editor {
    min-height: 100vh;
    background: #f9fafb;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: #6b7280;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-btn {
    padding: 8px 12px;
    font-size: 14px;
    color: #6b7280;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
  }

  .back-btn:hover {
    background: #f3f4f6;
  }

  .editor-header h1 {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .status-badge {
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

  .header-right {
    display: flex;
    gap: 12px;
  }

  .preview-btn, .save-btn {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .preview-btn {
    background: white;
    border: 1px solid #e5e7eb;
    color: #374151;
  }

  .preview-btn:hover:not(:disabled) {
    background: #f9fafb;
  }

  .save-btn {
    background: #3b82f6;
    border: none;
    color: white;
  }

  .save-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .save-btn:disabled, .preview-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tabs {
    display: flex;
    gap: 0;
    padding: 0 24px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }

  .tab {
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tab:hover {
    color: #374151;
  }

  .tab.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }

  .editor-content {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .tab-content {
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .form-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
  }

  .form-section h3 {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  /* Items Tab */
  .items-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }

  .items-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  .items-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .add-item-btn {
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    color: #3b82f6;
    background: #eff6ff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .add-item-btn:hover {
    background: #dbeafe;
  }

  .add-item-btn.secondary {
    background: white;
    border: 1px dashed #d1d5db;
    color: #6b7280;
  }

  .items-table {
    padding: 0;
  }

  .table-header, .table-row {
    display: grid;
    grid-template-columns: 1fr 80px 120px 100px 40px;
    gap: 12px;
    padding: 12px 20px;
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
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row input {
    width: 100%;
    padding: 8px 10px;
    font-size: 14px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  .table-row input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .price-input {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .price-input .currency {
    color: #9ca3af;
    font-size: 14px;
  }

  .price-input input {
    width: 80px;
  }

  .col-amount {
    font-weight: 500;
    color: #374151;
  }

  .delete-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #9ca3af;
    background: none;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .delete-btn:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .empty-items {
    padding: 40px 20px;
    text-align: center;
    color: #9ca3af;
  }

  .empty-items p {
    margin: 0 0 16px 0;
  }

  .totals-section {
    padding: 20px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }

  .totals-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    font-size: 14px;
    color: #374151;
  }

  .discount-row, .tax-row {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 12px;
    margin-bottom: 8px;
  }

  .discount-controls, .tax-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .discount-controls select,
  .discount-input,
  .tax-input {
    padding: 4px 8px;
    font-size: 13px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    width: auto;
  }

  .discount-input, .tax-input {
    width: 60px;
  }

  .total-row {
    font-size: 16px;
    font-weight: 600;
    padding-top: 12px;
    border-top: 2px solid #e5e7eb;
  }

  .total-amount {
    color: #3b82f6;
  }

  /* Settings Tab */
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .template-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .template-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .template-option:hover {
    border-color: #d1d5db;
  }

  .template-option.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .template-option input {
    display: none;
  }

  .template-preview {
    width: 48px;
    height: 48px;
    background: #f3f4f6;
    border-radius: 4px;
  }

  .template-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .template-name {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .template-desc {
    font-size: 12px;
    color: #9ca3af;
  }

  .color-picker {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .color-picker input[type="color"] {
    width: 48px;
    height: 48px;
    padding: 0;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
  }

  .color-picker .color-text {
    width: 100px;
    padding: 8px 12px;
  }

  @media (max-width: 768px) {
    .form-grid, .settings-grid {
      grid-template-columns: 1fr;
    }

    .table-header, .table-row {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .table-header {
      display: none;
    }
  }
`;
