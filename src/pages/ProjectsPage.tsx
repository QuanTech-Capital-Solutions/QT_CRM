import { useEffect, useState } from 'react';
import { Plus, X, Briefcase, Calendar, DollarSign, User, ArrowLeft, Pencil, Trash2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate, type Project, type Client, type ProjectStatus } from '../lib/types';

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
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

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

  const handleUpdate = async (formData: Record<string, string>) => {
    if (!editingProject) return;
    setSubmitting(true);
    const { error } = await supabase.from('projects').update({
      name: formData.name,
      description: formData.description || null,
      client_name: formData.client_name,
      status: formData.status || 'Scoping',
      cost_estimate: Number(formData.cost_estimate) || 0,
      timeline: formData.timeline || null,
    }).eq('id', editingProject.id);
    setSubmitting(false);
    if (!error) {
      setShowModal(false);
      setEditingProject(null);
      fetchProjects();
    }
  };

  const handleDelete = async (project: Project) => {
    const { error } = await supabase.from('projects').delete().eq('id', project.id);
    if (!error) {
      setConfirmDelete(null);
      setSelectedProject(null);
      fetchProjects();
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setSelectedProject(null);
    setShowModal(true);
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
            onClick={() => { setEditingProject(null); setShowModal(true); }}
            className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20"
          >
            <Plus size={16} />
            Create Project
          </button>
        </div>
      </div>

      {/* Detail view */}
      {selectedProject ? (
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedProject(null)}
              className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              <ArrowLeft size={16} />
              Back to projects
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEdit(selectedProject)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(selectedProject)}
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
                <Briefcase size={24} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedProject.name}</h2>
                <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border mt-1 ${statusColors[selectedProject.status]}`}>
                  {selectedProject.status}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <User size={16} className="text-light-secondary dark:text-dark-secondary" />
              <span className="text-sm">{selectedProject.client_name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-light-secondary dark:text-dark-secondary" />
              <span className="text-sm">{selectedProject.timeline || 'No timeline'}</span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign size={16} className="text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium">{formatCurrency(selectedProject.cost_estimate)}</span>
            </div>
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-light-secondary dark:text-dark-secondary" />
              <span className="text-sm text-light-secondary dark:text-dark-secondary">Created {formatDate(selectedProject.created_at)}</span>
            </div>
          </div>
          {selectedProject.description && (
            <div className="p-4 rounded-lg bg-light-canvas dark:bg-dark-canvas border border-light-border dark:border-dark-border">
              <div className="text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1">Description</div>
              <p className="text-sm">{selectedProject.description}</p>
            </div>
          )}
        </div>
      ) : view === 'board' ? (
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
                    <div
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-4 hover:border-violet-500/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                            className="p-1 rounded text-light-secondary dark:text-dark-secondary hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
                            className="p-1 rounded text-light-secondary dark:text-dark-secondary hover:text-rose-600 dark:hover:text-rose-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
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
                  <th className="text-right px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors">
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedProject(p)}>
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
                    <td className="px-4 py-3 text-sm hidden md:table-cell cursor-pointer" onClick={() => setSelectedProject(p)}>{p.client_name}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell text-light-secondary dark:text-dark-secondary cursor-pointer" onClick={() => setSelectedProject(p)}>{p.timeline || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium cursor-pointer" onClick={() => setSelectedProject(p)}>{formatCurrency(p.cost_estimate)}</td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedProject(p)}>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
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
          {projects.length === 0 && (
            <div className="text-center py-12 text-sm text-light-secondary dark:text-dark-secondary">No projects yet. Create your first project!</div>
          )}
        </div>
      )}

      {showModal && (
        <ProjectForm
          project={editingProject}
          clients={clients}
          onClose={() => { setShowModal(false); setEditingProject(null); }}
          onSubmit={editingProject ? handleUpdate : handleCreate}
          submitting={submitting}
        />
      )}

      {confirmDelete && (
        <DeleteConfirm
          project={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}

function DeleteConfirm({ project, onCancel, onConfirm }: { project: Project; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl p-6 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-lg font-bold">Delete Project</h2>
        </div>
        <p className="text-sm text-light-secondary dark:text-dark-secondary mb-6">
          Are you sure you want to delete <strong className="text-light-text dark:text-dark-text">{project.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border hover:bg-light-canvas dark:hover:bg-dark-canvas">Cancel</button>
          <button onClick={onConfirm} className="btn-primary flex-1 justify-center bg-rose-600 text-white hover:bg-rose-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

function ProjectForm({ project, clients, onClose, onSubmit, submitting }: { project: Project | null; clients: Client[]; onClose: () => void; onSubmit: (data: Record<string, string>) => void; submitting: boolean }) {
  const [form, setForm] = useState({
    name: project?.name ?? '',
    description: project?.description ?? '',
    client_name: project?.client_name ?? '',
    status: project?.status ?? 'Scoping' as ProjectStatus,
    cost_estimate: project?.cost_estimate?.toString() ?? '',
    timeline: project?.timeline ?? '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border sticky top-0 bg-light-card dark:bg-dark-card">
          <h2 className="text-lg font-bold">{project ? 'Edit Project' : 'Create Project'}</h2>
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
              {submitting ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
