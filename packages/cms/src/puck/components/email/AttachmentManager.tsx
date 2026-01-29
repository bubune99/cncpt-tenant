"use client";

import { useState, useEffect } from "react";
import { EmailAttachment } from "@/lib/email-attachments";

interface AttachmentManagerProps {
  attachments: EmailAttachment[];
  onChange: (attachments: EmailAttachment[]) => void;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
}

export function AttachmentManager({ attachments, onChange }: AttachmentManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string>("");
  const [useVariable, setUseVariable] = useState(false);
  const [variableKey, setVariableKey] = useState("order.id");

  useEffect(() => {
    // Load available invoices
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => setInvoices(data))
      .catch(console.error);
  }, []);

  const addAttachment = () => {
    if (useVariable) {
      const newAttachment: EmailAttachment = {
        id: `att-${Date.now()}`,
        name: `Invoice-{{${variableKey}}}.pdf`,
        type: "invoice",
        sourceType: "invoice",
        useVariable: true,
        variableKey,
      };
      onChange([...attachments, newAttachment]);
    } else if (selectedInvoice) {
      const invoice = invoices.find((inv) => inv.id === selectedInvoice);
      if (invoice) {
        const newAttachment: EmailAttachment = {
          id: `att-${Date.now()}`,
          name: `Invoice-${invoice.invoiceNumber}.pdf`,
          type: "invoice",
          sourceType: "invoice",
          sourceId: invoice.id,
        };
        onChange([...attachments, newAttachment]);
      }
    }

    setIsAdding(false);
    setSelectedInvoice("");
    setUseVariable(false);
  };

  const removeAttachment = (id: string) => {
    onChange(attachments.filter((att) => att.id !== id));
  };

  const updateAttachmentName = (id: string, name: string) => {
    onChange(
      attachments.map((att) => (att.id === id ? { ...att, name } : att))
    );
  };

  return (
    <div className="attachment-manager">
      <div className="section-header">
        <h4>Attachments</h4>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="add-btn">
            + Add Attachment
          </button>
        )}
      </div>

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="attachment-list">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-item">
              <div className="attachment-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="attachment-info">
                <input
                  type="text"
                  value={attachment.name}
                  onChange={(e) => updateAttachmentName(attachment.id, e.target.value)}
                  className="attachment-name"
                />
                <span className="attachment-type">
                  {attachment.useVariable ? (
                    <span className="variable-badge">Dynamic: {`{{${attachment.variableKey}}}`}</span>
                  ) : (
                    `Invoice PDF`
                  )}
                </span>
              </div>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="remove-btn"
                title="Remove"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Attachment Form */}
      {isAdding && (
        <div className="add-form">
          <div className="form-header">
            <h5>Add Invoice Attachment</h5>
            <button onClick={() => setIsAdding(false)} className="cancel-btn">
              Cancel
            </button>
          </div>

          <div className="form-content">
            <div className="toggle-row">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={useVariable}
                  onChange={(e) => setUseVariable(e.target.checked)}
                />
                Use dynamic variable
              </label>
              <span className="toggle-hint">
                Attach invoice based on email data
              </span>
            </div>

            {useVariable ? (
              <div className="form-group">
                <label>Variable Key</label>
                <select
                  value={variableKey}
                  onChange={(e) => setVariableKey(e.target.value)}
                >
                  <option value="order.id">Order ID</option>
                  <option value="invoice.id">Invoice ID</option>
                  <option value="customer.invoiceId">Customer Invoice ID</option>
                </select>
                <p className="hint">
                  The invoice will be attached based on this variable when sending
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label>Select Invoice</label>
                <select
                  value={selectedInvoice}
                  onChange={(e) => setSelectedInvoice(e.target.value)}
                >
                  <option value="">Choose an invoice...</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.customerName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={addAttachment}
              disabled={!useVariable && !selectedInvoice}
              className="confirm-btn"
            >
              Add Attachment
            </button>
          </div>
        </div>
      )}

      {attachments.length === 0 && !isAdding && (
        <p className="empty-hint">No attachments added</p>
      )}

      <style>{`
        .attachment-manager {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .section-header h4 {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .add-btn {
          padding: 6px 12px;
          font-size: 12px;
          color: #3b82f6;
          background: #eff6ff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .add-btn:hover {
          background: #dbeafe;
        }

        .attachment-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .attachment-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .attachment-icon {
          color: #6b7280;
        }

        .attachment-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .attachment-name {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          border: none;
          background: transparent;
          padding: 0;
        }

        .attachment-name:focus {
          outline: none;
          background: white;
          padding: 4px 8px;
          margin: -4px -8px;
          border-radius: 4px;
          border: 1px solid #3b82f6;
        }

        .attachment-type {
          font-size: 11px;
          color: #9ca3af;
        }

        .variable-badge {
          background: #eef2ff;
          color: #6366f1;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }

        .remove-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: #9ca3af;
          background: none;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .remove-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .add-form {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          margin-top: 8px;
        }

        .form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .form-header h5 {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .cancel-btn {
          font-size: 12px;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
        }

        .form-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .toggle-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
        }

        .toggle-hint {
          font-size: 11px;
          color: #9ca3af;
          margin-left: 22px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }

        .form-group select {
          padding: 8px 10px;
          font-size: 13px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          background: white;
        }

        .hint {
          font-size: 11px;
          color: #9ca3af;
          margin: 0;
        }

        .confirm-btn {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: white;
          background: #3b82f6;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          align-self: flex-start;
        }

        .confirm-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .confirm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-hint {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
          text-align: center;
          padding: 12px;
        }
      `}</style>
    </div>
  );
}

export default AttachmentManager;
