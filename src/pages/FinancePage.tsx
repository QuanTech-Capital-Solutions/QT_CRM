import { useEffect, useState } from 'react';
import { Plus, FileText, CheckCircle2, ArrowUpRight, ArrowDownRight, Banknote, TrendingUp, TrendingDown, Eye, Printer, Settings, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate, type Invoice, type LedgerEntry, type Client, type Project, type CompanySettings, type InvoiceStatus, type LedgerType } from '../lib/types';
import { InvoiceCreator } from '../components/invoice/InvoiceCreator';
import { InvoiceTemplate } from '../components/invoice/InvoiceTemplate';
import { CompanySettingsForm } from '../components/invoice/CompanySettingsForm';

const invoiceStatusColors: Record<InvoiceStatus, string> = {
  Draft: 'bg-slate-500/10 text-slate-500',
  Sent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Overdue: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

type Tab = 'invoices' | 'ledger' | 'settings';

export function FinancePage() {
  const [tab, setTab] = useState<Tab>('invoices');
  const [showCreator, setShowCreator] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteInvoice, setConfirmDeleteInvoice] = useState<Invoice | null>(null);
  const [ledgerModal, setLedgerModal] = useState<{ mode: 'create' | 'edit'; entry: LedgerEntry | null } | null>(null);
  const [confirmDeleteLedger, setConfirmDeleteLedger] = useState<LedgerEntry | null>(null);

  const fetchData = async () => {
    const [{ data: inv }, { data: led }, { data: comp }] = await Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('ledger_entries').select('*').order('date', { ascending: false }),
      supabase.from('company_settings').select('*').maybeSingle(),
    ]);
    setInvoices(inv ?? []);
    setLedger(led ?? []);
    setCompany(comp ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    supabase.from('clients').select('*').then(({ data }) => setClients(data ?? []));
    supabase.from('projects').select('*').then(({ data }) => setProjects(data ?? []));
  }, []);

  const markAsPaid = async (id: string) => {
    const { error } = await supabase.from('invoices').update({ status: 'Paid' }).eq('id', id);
    if (!error) setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: 'Paid' as InvoiceStatus } : inv));
  };

  const handleSaveInvoice = async (data: Omit<Invoice, 'id' | 'user_id' | 'created_at'>) => {
    setSaving(true);
    if (editingInvoice) {
      const { error } = await supabase.from('invoices').update(data).eq('id', editingInvoice.id);
      setSaving(false);
      if (!error) { setShowCreator(false); setEditingInvoice(null); fetchData(); }
    } else {
      const { error } = await supabase.from('invoices').insert(data);
      setSaving(false);
      if (!error) { setShowCreator(false); fetchData(); }
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
    if (!error) {
      setConfirmDeleteInvoice(null);
      setViewInvoice(null);
      fetchData();
    }
  };

  const handleSaveLedger = async (formData: Record<string, string>) => {
    const payload = {
      type: formData.type as LedgerType,
      category: formData.category,
      description: formData.description || null,
      amount: Number(formData.amount) || 0,
      date: formData.date,
    };
    if (ledgerModal?.mode === 'edit' && ledgerModal.entry) {
      const { error } = await supabase.from('ledger_entries').update(payload).eq('id', ledgerModal.entry.id);
      if (!error) { setLedgerModal(null); fetchData(); }
    } else {
      const { error } = await supabase.from('ledger_entries').insert(payload);
      if (!error) { setLedgerModal(null); fetchData(); }
    }
  };

  const handleDeleteLedger = async (entry: LedgerEntry) => {
    const { error } = await supabase.from('ledger_entries').delete().eq('id', entry.id);
    if (!error) { setConfirmDeleteLedger(null); fetchData(); }
  };

  const totalIncome = ledger.filter((l) => l.type === 'Income').reduce((s, l) => s + l.amount, 0);
  const totalExpenses = ledger.filter((l) => l.type === 'Expense').reduce((s, l) => s + l.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  const selectedClient = (inv: Invoice) => clients.find((c) => c.company_name === inv.client_name);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-light-secondary dark:text-dark-secondary">Loading finance data...</div>;
  }

  if (showCreator) {
    return (
      <InvoiceCreator
        clients={clients}
        projects={projects}
        company={company}
        invoiceCount={invoices.length}
        editingInvoice={editingInvoice}
        onClose={() => { setShowCreator(false); setEditingInvoice(null); }}
        onSave={handleSaveInvoice}
        saving={saving}
      />
    );
  }

  if (viewInvoice) {
    const cl = selectedClient(viewInvoice);
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 dark:bg-gray-900 animate-fade-in">
        <div className="flex items-center justify-between px-6 h-16 bg-light-card dark:bg-dark-card border-b border-light-border dark:border-dark-border flex-shrink-0 no-print">
          <button onClick={() => setViewInvoice(null)} className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary hover:text-light-text dark:hover:text-dark-text transition-colors">
            <ArrowUpRight size={16} className="rotate-[225deg]" />
            Back to Finance
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{viewInvoice.invoice_number}</span>
            <button
              onClick={() => { setEditingInvoice(viewInvoice); setViewInvoice(null); setShowCreator(true); }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
            >
              <Pencil size={13} />
              Edit
            </button>
            <button
              onClick={() => setConfirmDeleteInvoice(viewInvoice)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
            >
              <Trash2 size={13} />
              Delete
            </button>
            <button
              onClick={() => window.print()}
              className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20"
            >
              <Printer size={15} />
              Print / Export PDF
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl">
            <InvoiceTemplate
              invoice={viewInvoice}
              company={company}
              clientEmail={cl?.email}
              clientPhone={cl?.phone ?? undefined}
            />
          </div>
        </div>
        {confirmDeleteInvoice && (
          <DeleteConfirmModal
            title="Delete Invoice"
            name={confirmDeleteInvoice.invoice_number}
            onCancel={() => setConfirmDeleteInvoice(null)}
            onConfirm={() => handleDeleteInvoice(confirmDeleteInvoice)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-sm text-light-secondary dark:text-dark-secondary mt-1">Invoices, cash flow, and company settings</p>
        </div>
        {tab === 'invoices' && (
          <button onClick={() => { setEditingInvoice(null); setShowCreator(true); }} className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20">
            <Plus size={16} />
            Create Invoice
          </button>
        )}
        {tab === 'ledger' && (
          <button onClick={() => setLedgerModal({ mode: 'create', entry: null })} className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20">
            <Plus size={16} />
            Add Entry
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Income', value: formatCurrency(totalIncome), icon: TrendingUp, cls: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Total Expenses', value: formatCurrency(totalExpenses), icon: TrendingDown, cls: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Net Cash Flow', value: formatCurrency(netCashFlow), icon: Banknote, cls: 'text-light-text dark:text-dark-text', bg: 'bg-violet-500/10' },
        ].map((m) => (
          <div key={m.label} className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center`}>
                <m.icon size={18} className={m.cls} />
              </div>
              <span className="text-sm text-light-secondary dark:text-dark-secondary">{m.label}</span>
            </div>
            <div className={`text-2xl font-bold ${m.cls}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-light-border dark:border-dark-border">
        {([
          { id: 'invoices' as Tab, label: 'Invoices', icon: FileText },
          { id: 'ledger' as Tab, label: 'Financial Ledger', icon: ArrowUpRight },
          { id: 'settings' as Tab, label: 'Settings', icon: Settings },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-light-secondary dark:text-dark-secondary hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Invoices tab */}
      {tab === 'invoices' && (
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Invoice #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden md:table-cell">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden lg:table-cell">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden sm:table-cell">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="text-sm font-medium">{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{inv.client_name}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell text-light-secondary dark:text-dark-secondary">{inv.project_name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell text-light-secondary dark:text-dark-secondary">
                      {inv.due_date ? formatDate(inv.due_date) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${invoiceStatusColors[inv.status]}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setViewInvoice(inv)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          <Eye size={13} />
                          View
                        </button>
                        <button
                          onClick={() => { setEditingInvoice(inv); setShowCreator(true); }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => markAsPaid(inv.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <CheckCircle2 size={13} />
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDeleteInvoice(inv)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoices.length === 0 && (
            <div className="text-center py-16">
              <FileText size={32} className="text-light-secondary dark:text-dark-secondary mx-auto mb-3 opacity-40" />
              <p className="text-sm text-light-secondary dark:text-dark-secondary mb-4">No invoices yet.</p>
              <button onClick={() => setShowCreator(true)} className="btn-primary bg-violet-600 text-white hover:bg-violet-700 mx-auto">
                <Plus size={15} />
                Create your first invoice
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ledger tab */}
      {tab === 'ledger' && (
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden md:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden sm:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${entry.type === 'Income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                          {entry.type === 'Income'
                            ? <ArrowDownRight size={14} className="text-emerald-600 dark:text-emerald-400" />
                            : <ArrowUpRight size={14} className="text-rose-600 dark:text-rose-400" />}
                        </div>
                        <span className="text-sm font-medium">{entry.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{entry.category}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell text-light-secondary dark:text-dark-secondary">{entry.description || '—'}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${entry.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {entry.type === 'Income' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell text-light-secondary dark:text-dark-secondary">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setLedgerModal({ mode: 'edit', entry })}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteLedger(entry)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ledger.length === 0 && (
            <div className="text-center py-12 text-sm text-light-secondary dark:text-dark-secondary">No ledger entries yet. Click "Add Entry" to create one.</div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <CompanySettingsForm settings={company} onSaved={(s) => setCompany(s)} />
      )}

      {/* Invoice delete confirmation */}
      {confirmDeleteInvoice && (
        <DeleteConfirmModal
          title="Delete Invoice"
          name={confirmDeleteInvoice.invoice_number}
          onCancel={() => setConfirmDeleteInvoice(null)}
          onConfirm={() => handleDeleteInvoice(confirmDeleteInvoice)}
        />
      )}

      {/* Ledger form modal */}
      {ledgerModal && (
        <LedgerForm
          mode={ledgerModal.mode}
          entry={ledgerModal.entry}
          onClose={() => setLedgerModal(null)}
          onSave={handleSaveLedger}
        />
      )}

      {/* Ledger delete confirmation */}
      {confirmDeleteLedger && (
        <DeleteConfirmModal
          title="Delete Ledger Entry"
          name={confirmDeleteLedger.category}
          onCancel={() => setConfirmDeleteLedger(null)}
          onConfirm={() => handleDeleteLedger(confirmDeleteLedger)}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({ title, name, onCancel, onConfirm }: { title: string; name: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl p-6 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <p className="text-sm text-light-secondary dark:text-dark-secondary mb-6">
          Are you sure you want to delete <strong className="text-light-text dark:text-dark-text">{name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border hover:bg-light-canvas dark:hover:bg-dark-canvas">Cancel</button>
          <button onClick={onConfirm} className="btn-primary flex-1 justify-center bg-rose-600 text-white hover:bg-rose-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

function LedgerForm({ mode, entry, onClose, onSave }: { mode: 'create' | 'edit'; entry: LedgerEntry | null; onClose: () => void; onSave: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    type: entry?.type ?? 'Income' as LedgerType,
    category: entry?.category ?? '',
    description: entry?.description ?? '',
    amount: entry?.amount?.toString() ?? '',
    date: entry?.date ?? new Date().toISOString().slice(0, 10),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border sticky top-0 bg-light-card dark:bg-dark-card">
          <h2 className="text-lg font-bold">{mode === 'edit' ? 'Edit Entry' : 'Add Ledger Entry'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors">
            <X size={18} />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Type</label>
            <select className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LedgerType })}>
              <option>Income</option>
              <option>Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Category</label>
            <input className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Consulting, Software, Travel..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Description</label>
            <textarea rows={2} className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Amount (R)</label>
              <input type="number" step="0.01" className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Date</label>
              <input type="date" className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border hover:bg-light-canvas dark:hover:bg-dark-canvas">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center bg-violet-600 text-white hover:bg-violet-700">
              {mode === 'edit' ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
