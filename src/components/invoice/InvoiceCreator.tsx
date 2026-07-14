import { useState, useId } from 'react';
import { Plus, Trash2, Eye, Printer, ArrowLeft, Info } from 'lucide-react';
import { type Client, type Project, type Invoice, type CompanySettings, type LineItem, type InvoiceStatus, calcInvoiceTotals, formatCurrency } from '../../lib/types';
import { InvoiceTemplate } from './InvoiceTemplate';

interface InvoiceCreatorProps {
  clients: Client[];
  projects: Project[];
  company: CompanySettings | null;
  invoiceCount: number;
  editingInvoice?: Invoice | null;
  onClose: () => void;
  onSave: (data: Omit<Invoice, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  saving: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);
const thirtyDaysOut = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

function newLineItem(uid: string): LineItem {
  return { id: uid, description: '', quantity: 1, unit_price: 0 };
}

export function InvoiceCreator({ clients, projects, company, invoiceCount, editingInvoice, onClose, onSave, saving }: InvoiceCreatorProps) {
  const uid = useId();
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  const [invoiceNumber, setInvoiceNumber] = useState(editingInvoice?.invoice_number ?? `QT-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(3, '0')}`);
  const [invoiceDate, setInvoiceDate] = useState(editingInvoice?.invoice_date ?? today());
  const [dueDate, setDueDate] = useState(editingInvoice?.due_date ?? thirtyDaysOut());
  const [clientName, setClientName] = useState(editingInvoice?.client_name ?? '');
  const [projectName, setProjectName] = useState(editingInvoice?.project_name ?? '');
  const [status, setStatus] = useState<InvoiceStatus>(editingInvoice?.status ?? 'Draft');
  const [includeVat, setIncludeVat] = useState(editingInvoice?.include_vat ?? false);
  const [notes, setNotes] = useState(editingInvoice?.notes ?? '');
  const [items, setItems] = useState<LineItem[]>(editingInvoice?.line_items ?? [newLineItem(`${uid}-0`)]);
  const [counter, setCounter] = useState(editingInvoice?.line_items?.length ?? 1);

  const addItem = () => {
    setItems((prev) => [...prev, newLineItem(`${uid}-${counter}`)]);
    setCounter((c) => c + 1);
  };
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id: string, field: keyof LineItem, value: string | number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const { subtotal, vat, total } = calcInvoiceTotals(items, includeVat);

  const selectedClient = clients.find((c) => c.company_name === clientName);

  const previewInvoice: Invoice = {
    id: 'preview',
    user_id: '',
    invoice_number: invoiceNumber || 'QT-XXXX-XXX',
    client_name: clientName || 'Client Name',
    project_name: projectName || null,
    amount: total,
    invoice_date: invoiceDate,
    due_date: dueDate || null,
    status,
    line_items: items,
    include_vat: includeVat,
    notes: notes || null,
    created_at: '',
  };

  const handleSave = async () => {
    await onSave({
      invoice_number: invoiceNumber,
      client_name: clientName,
      project_name: projectName || null,
      amount: total,
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      status,
      line_items: items,
      include_vat: includeVat,
      notes: notes || null,
    });
  };

  const handlePrint = () => window.print();

  const inputCls = 'input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border text-sm';
  const labelCls = 'block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5';

  const FormPanel = (
    <div className="overflow-y-auto h-full px-6 py-6 space-y-6">
      {/* Invoice meta */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-light-secondary dark:text-dark-secondary mb-3">Invoice Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Invoice Number</label>
            <input className={inputCls} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
              <option>Draft</option>
              <option>Sent</option>
              <option>Paid</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Invoice Date</label>
            <input type="date" className={inputCls} value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Due Date</label>
            <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Client & project */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-light-secondary dark:text-dark-secondary mb-3">Bill To</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Client</label>
            <select className={inputCls} value={clientName} onChange={(e) => setClientName(e.target.value)} required>
              <option value="">Select a client...</option>
              {clients.map((c) => <option key={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Project (optional)</label>
            <select className={inputCls} value={projectName} onChange={(e) => setProjectName(e.target.value)}>
              <option value="">No project</option>
              {projects.filter((p) => !clientName || p.client_name === clientName).map((p) => (
                <option key={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-light-secondary dark:text-dark-secondary">Line Items</h3>
          <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
            <Plus size={13} />
            Add Item
          </button>
        </div>

        <div className="space-y-2">
          {/* Header */}
          <div className="text-xs font-medium text-light-secondary dark:text-dark-secondary px-1" style={{ gridTemplateColumns: '1fr 70px 120px 120px 32px' }}>
            <span>Description</span>
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="flex flex-col gap-1.5" style={{ gridTemplateColumns: '1fr 70px 120px 120px 32px' }}>
              <input
                className={inputCls}
                placeholder={`Item ${idx + 1} description`}
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              />
            </div>
            ))
          }

          <div className="grid gap-1 items-end text-xs font-medium text-light-secondary dark:text-dark-secondary px-1" style={{ gridTemplateColumns: '1fr 70px 120px 120px 32px' }}>
            {/*<span>Description</span>*/}
            <span className="text-center">Qty</span>
            <span className="text-right">Unit Price (R)</span>
            <span className="text-right">Amount</span>
            <span></span>
          </div>

          {/*{items.map((item, idx) => ( - original code*/}
          {items.map((item) => (
            <div key={item.id} className="grid gap-1 items-center" style={{ gridTemplateColumns: '1fr 70px 120px 120px 32px' }}>
              {/*<input
                className={inputCls}
                placeholder={`Item ${idx + 1} description`}
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              />*/}
              
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={`${inputCls} text-center`}
                value={item.quantity}
                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                className={`${inputCls} text-right`}
                value={item.unit_price}
                onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
              />
              <div className={`${inputCls} text-right bg-light-canvas/50 dark:bg-dark-canvas/50 text-light-secondary dark:text-dark-secondary cursor-default`}>
                {formatCurrency(item.quantity * item.unit_price)}
              </div>

              <button
                type="button"
                onClick={() => items.length > 1 ? removeItem(item.id) : undefined}
                disabled={items.length === 1}
                className="p-1.5 rounded-lg text-light-secondary dark:text-dark-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Totals summary */}
        <div className="mt-4 p-4 rounded-lg bg-light-canvas dark:bg-dark-canvas border border-light-border dark:border-dark-border space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={includeVat} onChange={(e) => setIncludeVat(e.target.checked)} className="w-4 h-4 accent-violet-600" />
              <span className="text-light-secondary dark:text-dark-secondary">Include VAT (15%)</span>
            </label>
          </div>
          <div className="border-t border-light-border dark:border-dark-border pt-2 space-y-1">
            <div className="flex justify-between text-sm text-light-secondary dark:text-dark-secondary">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {includeVat && (
              <div className="flex justify-between text-sm text-light-secondary dark:text-dark-secondary">
                <span>VAT (15%)</span><span>{formatCurrency(vat)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-light-text dark:text-dark-text pt-1 border-t border-light-border dark:border-dark-border">
              <span>Total</span><span className="text-violet-600 dark:text-violet-400">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-light-secondary dark:text-dark-secondary mb-3">Notes</h3>
        <textarea
          rows={3}
          className={`${inputCls} resize-none w-full`}
          placeholder="Payment terms, thank-you note, or any other information..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Company settings hint */}
      {!company?.company_name && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Info size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            No company details configured. Go to Finance → Settings to add your logo, address, and banking details.
          </p>
        </div>
      )}

      {/* Mobile save */}
      <div className="pb-4 flex gap-3 lg:hidden">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border">Cancel</button>
        <button type="button" onClick={handleSave} disabled={!clientName || saving} className="btn-primary flex-1 justify-center bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Invoice'}
        </button>
      </div>
    </div>
  );

  const PreviewPanel = (
    <div className="overflow-y-auto h-full bg-gray-100 dark:bg-gray-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-light-secondary dark:text-dark-secondary">Live Preview</span>
        <button
          type="button"
          onClick={handlePrint}
          className="btn-primary bg-violet-600 text-white hover:bg-violet-700 text-xs"
        >
          <Printer size={14} />
          Print / Export PDF
        </button>
      </div>
      <div className="rounded-xl overflow-hidden shadow-2xl">
        <InvoiceTemplate invoice={previewInvoice} company={company} clientEmail={selectedClient?.email} clientPhone={selectedClient?.phone ?? undefined} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-light-card dark:bg-dark-card animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-light-border dark:border-dark-border flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary hover:text-light-text dark:hover:text-dark-text transition-colors">
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to Finance</span>
          </button>
          <div className="hidden sm:block w-px h-5 bg-light-border dark:bg-dark-border" />
          <h1 className="text-base font-bold">{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</h1>
        </div>

        {/* Mobile tab toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileTab('form')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mobileTab === 'form' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'text-light-secondary dark:text-dark-secondary'}`}
          >
            Form
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mobileTab === 'preview' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'text-light-secondary dark:text-dark-secondary'}`}
          >
            <Eye size={13} />
            Preview
          </button>
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-3">
          <button type="button" onClick={onClose} className="btn-secondary border-light-border dark:border-dark-border">Cancel</button>
          <button type="button" onClick={handleSave} disabled={!clientName || saving} className="btn-primary bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Form — hidden on mobile when preview tab active */}
        <div className={`w-full lg:w-[480px] border-r border-light-border dark:border-dark-border flex-shrink-0 ${mobileTab === 'preview' ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}>
          {FormPanel}
        </div>

        {/* Preview — hidden on mobile when form tab active */}
        <div className={`flex-1 ${mobileTab === 'form' ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}>
          {PreviewPanel}
        </div>
      </div>
    </div>
  );
}
