/**
 * Storage Types and Utilities
 *
 * Provides types for stored data like invoices
 */

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  amount: number; // Alias for total, used by invoice editor
  taxRate?: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";

  // Customer info
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerTaxId?: string;
  customerCompany?: string;

  // Company info (legacy names)
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyTaxId?: string;
  companyLogo?: string;

  // Business info (alternative naming used by invoice editor)
  businessName?: string;
  businessAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessLogo?: string;

  // Dates
  issueDate: Date;
  dueDate?: Date;
  paidDate?: Date;

  // Line items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: "none" | "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  total: number;

  // Currency
  currency: string;
  currencySymbol: string;

  // Additional
  notes?: string;
  terms?: string;
  paymentInstructions?: string;
  templateId?: string;
  template?: string; // Template style: 'modern', 'classic', 'minimal'
  accentColor?: string; // Accent color for invoice styling

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Local storage helpers for invoices (client-side)
 * In production, these would connect to an API
 */
export const invoiceStorage = {
  getAll(): InvoiceData[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem("invoices");
    return data ? JSON.parse(data) : [];
  },

  get(id: string): InvoiceData | null {
    const invoices = this.getAll();
    return invoices.find((inv) => inv.id === id) || null;
  },

  save(invoice: InvoiceData): void {
    if (typeof window === "undefined") return;
    const invoices = this.getAll();
    const index = invoices.findIndex((inv) => inv.id === invoice.id);
    if (index >= 0) {
      invoices[index] = invoice;
    } else {
      invoices.push(invoice);
    }
    localStorage.setItem("invoices", JSON.stringify(invoices));
  },

  delete(id: string): void {
    if (typeof window === "undefined") return;
    const invoices = this.getAll().filter((inv) => inv.id !== id);
    localStorage.setItem("invoices", JSON.stringify(invoices));
  },

  generateNumber(): string {
    const invoices = this.getAll();
    const year = new Date().getFullYear();
    const count = invoices.filter((inv) =>
      inv.invoiceNumber.startsWith(`INV-${year}`)
    ).length;
    return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
  },
};

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(invoice: Partial<InvoiceData>): {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
} {
  const lineItems = invoice.lineItems || [];
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  let discountAmount = 0;
  if (invoice.discountType === "percentage" && invoice.discountValue) {
    discountAmount = (subtotal * invoice.discountValue) / 100;
  } else if (invoice.discountType === "fixed" && invoice.discountValue) {
    discountAmount = invoice.discountValue;
  }

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = invoice.taxRate ? (taxableAmount * invoice.taxRate) / 100 : 0;
  const total = taxableAmount + taxAmount;

  return {
    subtotal,
    taxAmount,
    discountAmount,
    total,
  };
}
