import { useEffect, useState } from 'react';
import { Plus, X, Briefcase, Calendar, DollarSign, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, type Project, type Client, type ProjectStatus } from '../lib/types';

const statusColors: Record<ProjectStatus, string> = {
  Scoping: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'On Hold': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  Completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
};

const columns: { status: ProjectStatus; label: string }[] = [
  { status: 'Scoping', label: 'Scoping' },
  { status: 'Active', label: 'Active' },
  { status: 'On Hold', label: 'On Hold' },
  { status: 'Completed', label: 'Completed' },
];

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    supabase.from('clients').select('*').then(({ data }) => setClients(data ?? []));
  }, []);

  const handleCreate = async (formData: Record<string, string>) => {
    setSubmitting(true);
    const { error } = await supabase.from('projects').insert({
      name: formData.name,
      description: formData.description || null,
      client_name: formData.client_name,
      status: formData.status || 'Scoping',
      cost_estimate: Number(formData.cost_estimate) || 0,
      timeline: formData.timeline || null,
    });
    setSubmitting(false);
    if (!error) {
      setShowModal(false);
      fetchProjects();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-light-secondary dark:text-dark-secondary">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-light-secondary dark:text-dark-secondary mt-1">
            {projects.length} total · {projects.filter((p) => p.status === 'Active').length} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-light-border dark:border-dark-border p-0.5">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'board' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'text-light-secondary dark:text-dark-secondary'}`}
            >
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'text-light-secondary dark:text-dark-secondary'}`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20"
          >
            <Plus size={16} />
            Create Project
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colProjects = projects.filter((p) => p.status === col.status);
            return (
              <div key={col.status} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColors[col.status].split(' ')[0]}`}></span>
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <span className="text-xs text-light-secondary dark:text-dark-secondary">{colProjects.length}</span>
                </div>
                <div className="space-y-3">
                  {colProjects.map((p) => (
                    <div key={p.id} className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-4 hover:border-violet-500/30 transition-colors cursor-pointer">
                      <div className="text-sm font-semibold mb-1">{p.name}</div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary mb-3 line-clamp-2">{p.description || 'No description'}</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-light-secondary dark:text-dark-secondary">
                          <User size={12} />
                          {p.client_name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-light-secondary dark:text-dark-secondary">
                          <Calendar size={12} />
                          {p.timeline || 'No timeline'}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-light-text dark:text-dark-text">
                          <DollarSign size={12} className="text-violet-600 dark:text-violet-400" />
                          {formatCurrency(p.cost_estimate)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colProjects.length === 0 && (
                    <div className="text-center py-8 text-xs text-light-secondary dark:text-dark-secondary border border-dashed border-light-border dark:border-dark-border rounded-lg">
                      No projects
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden md:table-cell">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden lg:table-cell">Timeline</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Estimate</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <Briefcase size={16} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-xs text-light-secondary dark:text-dark-secondary truncate md:hidden">{p.client_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{p.client_name}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell text-light-secondary dark:text-dark-secondary">{p.timeline || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(p.cost_estimate)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[p.status]}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {projects.length === 0 && (
            <div className="text-center py-12 text-sm text-light-secondary dark:text-dark-secondary">No projects yet. Create your first project!</div>
          )}
        </div>
      )}

      {showModal && (
        <ProjectForm
          clients={clients}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
          submitting={submitting}
        />
      )}
    </div>
  );
}

function ProjectForm({ clients, onClose, onSubmit, submitting }: { clients: Client[]; onClose: () => void; onSubmit: (data: Record<string, string>) => void; submitting: boolean }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    client_name: '',
    status: 'Scoping' as ProjectStatus,
    cost_estimate: '',
    timeline: '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border sticky top-0 bg-light-card dark:bg-dark-card">
          <h2 className="text-lg font-bold">Create Project</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors">
            <X size={18} />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Project Name</label>
            <input className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Description</label>
            <textarea rows={3} className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Client</label>
            <select className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })}>
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Cost Estimate</label>
              <input type="number" className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.cost_estimate} onChange={(e) => setForm({ ...form, cost_estimate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Timeline</label>
              <input className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" placeholder="Q1 2025" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Status</label>
            <select className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
              <option>Scoping</option>
              <option>Active</option>
              <option>On Hold</option>
              <option>Completed</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border hover:bg-light-canvas dark:hover:bg-dark-canvas">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
