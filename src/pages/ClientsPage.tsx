import { useEffect, useState } from 'react';
import { Plus, X, Search, ChevronDown, ChevronUp, Mail, Phone, Building2, ArrowLeft, Briefcase, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate, type Client, type Project, type ClientStatus } from '../lib/types';

const statusColors: Record<ClientStatus, string> = {
  Active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Prospect: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'On Hold': 'bg-slate-500/10 text-slate-500',
};

type SortKey = 'company_name' | 'primary_contact' | 'email' | 'status' | 'created_at';

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('company_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
    supabase.from('projects').select('*').then(({ data }) => setProjects(data ?? []));
  }, []);

  const filtered = clients
    .filter((c) =>
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.primary_contact.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    ) : null;

  const clientProjects = selectedClient
    ? projects.filter((p) => p.client_name === selectedClient.company_name)
    : [];

  const handleCreate = async (formData: Record<string, string>) => {
    setSubmitting(true);
    const { error } = await supabase.from('clients').insert({
      company_name: formData.company_name,
      primary_contact: formData.primary_contact,
      email: formData.email,
      phone: formData.phone || null,
      status: formData.status || 'Prospect',
      notes: formData.notes || null,
    });
    setSubmitting(false);
    if (!error) {
      setShowForm(false);
      fetchClients();
    }
  };

  const handleUpdate = async (formData: Record<string, string>) => {
    if (!editingClient) return;
    setSubmitting(true);
    const { error } = await supabase.from('clients').update({
      company_name: formData.company_name,
      primary_contact: formData.primary_contact,
      email: formData.email,
      phone: formData.phone || null,
      status: formData.status || 'Prospect',
      notes: formData.notes || null,
    }).eq('id', editingClient.id);
    setSubmitting(false);
    if (!error) {
      setEditingClient(null);
      setShowForm(false);
      fetchClients();
    }
  };

  const handleDelete = async (client: Client) => {
    const { error } = await supabase.from('clients').delete().eq('id', client.id);
    if (!error) {
      setConfirmDelete(null);
      setSelectedClient(null);
      fetchClients();
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setSelectedClient(null);
    setShowForm(true);
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-light-secondary dark:text-dark-secondary mt-1">
            {clients.length} total · {clients.filter((c) => c.status === 'Active').length} active
          </p>
        </div>
        <button
          onClick={() => { setEditingClient(null); setShowForm(true); }}
          className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20"
        >
          <Plus size={16} />
          New Client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-secondary dark:text-dark-secondary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients by name, contact, or email..."
          className="input-field bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-sm text-light-secondary dark:text-dark-secondary">Loading clients...</div>
      ) : selectedClient ? (
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedClient(null)}
              className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              <ArrowLeft size={16} />
              Back to clients
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEdit(selectedClient)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(selectedClient)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Building2 size={24} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedClient.company_name}</h2>
                <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${statusColors[selectedClient.status]}`}>
                  {selectedClient.status}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-light-secondary dark:text-dark-secondary" />
              <span className="text-sm">{selectedClient.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-light-secondary dark:text-dark-secondary" />
              <span className="text-sm">{selectedClient.phone || 'No phone'}</span>
            </div>
          </div>
          {selectedClient.notes && (
            <div className="mb-6 p-4 rounded-lg bg-light-canvas dark:bg-dark-canvas border border-light-border dark:border-dark-border">
              <div className="text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1">Notes</div>
              <p className="text-sm">{selectedClient.notes}</p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Briefcase size={16} />
              Associated Projects ({clientProjects.length})
            </h3>
            {clientProjects.length > 0 ? (
              <div className="space-y-2">
                {clientProjects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-light-canvas dark:bg-dark-canvas border border-light-border dark:border-dark-border">
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary">{p.timeline || 'No timeline'}</div>
                    </div>
                    <div className="text-sm font-semibold">{formatCurrency(p.cost_estimate)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-light-secondary dark:text-dark-secondary">No projects yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border">
                  {(['company_name', 'primary_contact', 'email'] as SortKey[]).map((key) => (
                    <th key={key} className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary cursor-pointer hover:text-light-text dark:hover:text-dark-text" onClick={() => handleSort(key)}>
                      <span className="flex items-center gap-1 capitalize">{key.replace('_', ' ')} <SortIcon col={key} /></span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden lg:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary cursor-pointer hover:text-light-text dark:hover:text-dark-text" onClick={() => handleSort('status')}>
                    <span className="flex items-center gap-1">Status <SortIcon col="status" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden md:table-cell cursor-pointer hover:text-light-text dark:hover:text-dark-text" onClick={() => handleSort('created_at')}>
                    <span className="flex items-center gap-1">Created <SortIcon col="created_at" /></span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors"
                  >
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedClient(c)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <Building2 size={16} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="text-sm font-medium">{c.company_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => setSelectedClient(c)}>{c.primary_contact}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell text-light-secondary dark:text-dark-secondary cursor-pointer" onClick={() => setSelectedClient(c)}>{c.email}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell text-light-secondary dark:text-dark-secondary">{c.phone || '—'}</td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedClient(c)}>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell text-light-secondary dark:text-dark-secondary">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(c); }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-light-secondary dark:text-dark-secondary">
              {clients.length === 0 ? 'No clients yet. Create your first client!' : 'No clients found.'}
            </div>
          )}
        </div>
      )}

      {/* Slide-in form */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
          onSubmit={editingClient ? handleUpdate : handleCreate}
          submitting={submitting}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <DeleteConfirm
          client={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}

function DeleteConfirm({ client, onCancel, onConfirm }: { client: Client; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl p-6 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-lg font-bold">Delete Client</h2>
        </div>
        <p className="text-sm text-light-secondary dark:text-dark-secondary mb-6">
          Are you sure you want to delete <strong className="text-light-text dark:text-dark-text">{client.company_name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border hover:bg-light-canvas dark:hover:bg-dark-canvas">Cancel</button>
          <button onClick={onConfirm} className="btn-primary flex-1 justify-center bg-rose-600 text-white hover:bg-rose-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

function ClientForm({ client, onClose, onSubmit, submitting }: { client: Client | null; onClose: () => void; onSubmit: (data: Record<string, string>) => void; submitting: boolean }) {
  const [form, setForm] = useState({
    company_name: client?.company_name ?? '',
    primary_contact: client?.primary_contact ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    status: client?.status ?? 'Prospect' as ClientStatus,
    notes: client?.notes ?? '',
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-light-card dark:bg-dark-card border-l border-light-border dark:border-dark-border h-full overflow-y-auto animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border sticky top-0 bg-light-card dark:bg-dark-card">
          <h2 className="text-lg font-bold">{client ? 'Edit Client' : 'New Client'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors">
            <X size={18} />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Company Name</label>
            <input className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Primary Contact</label>
            <input className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" required value={form.primary_contact} onChange={(e) => setForm({ ...form, primary_contact: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Email</label>
            <input type="email" className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Phone</label>
            <input className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Status</label>
            <select className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
              <option>Prospect</option>
              <option>Active</option>
              <option>On Hold</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Notes</label>
            <textarea rows={3} className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border hover:bg-light-canvas dark:hover:bg-dark-canvas">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'Saving...' : client ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
