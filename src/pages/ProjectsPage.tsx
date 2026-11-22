import { useEffect, useState } from 'react';
import { Plus, X, Briefcase, Calendar, DollarSign, User, ArrowLeft, Pencil, Trash2, FileText, ListChecks } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate, type Project, type Client, type ProjectStatus, type ProjectTask } from '../lib/types';
import { PROJECT_STATUSES, statusColors, urgencyLabel, urgencyToneColors, daysFromToday, computeProgress } from '../lib/dateUtils';
import { Sheet } from '../components/Sheet';
import { ProjectChecklist } from '../components/ProjectChecklist';

const columns: { status: ProjectStatus; label: string }[] = [
  { status: 'Not Started', label: 'Not Started' },
  { status: 'In Progress', label: 'In Progress' },
  { status: 'Review', label: 'Review' },
  { status: 'Completed', label: 'Completed' },
];

interface ProjectsPageProps {
  openProjectId?: string | null;
  onProjectOpened?: () => void;
}

export function ProjectsPage({ openProjectId = null, onProjectOpened }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasksByProject, setTasksByProject] = useState<Record<string, ProjectTask[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  const fetchAll = async () => {
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('project_tasks').select('*'),
    ]);
    setProjects(p ?? []);
    const byProj: Record<string, ProjectTask[]> = {};
    (t ?? []).forEach((task) => {
      if (!byProj[task.project_id]) byProj[task.project_id] = [];
      byProj[task.project_id].push(task);
    });
    setTasksByProject(byProj);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    supabase.from('clients').select('*').then(({ data }) => setClients(data ?? []));
  }, []);

  useEffect(() => {
    if (loading || !openProjectId) return;
    const project = projects.find((item) => item.id === openProjectId);
    if (project) {
      setSelectedProject(project);
      setView('list');
    }
    onProjectOpened?.();
  }, [loading, onProjectOpened, openProjectId, projects]);

  const handleCreate = async (formData: Record<string, string>) => {
    setSubmitting(true);
    const { error } = await supabase.from('projects').insert({
      name: formData.name,
      description: formData.description || null,
      client_name: formData.client_name,
      status: (formData.status || 'Not Started') as ProjectStatus,
      cost_estimate: Number(formData.cost_estimate) || 0,
      timeline: formData.timeline || null,
      deadline: formData.deadline || null,
    });
    setSubmitting(false);
    if (!error) { setShowModal(false); fetchAll(); }
  };

  const handleUpdate = async (formData: Record<string, string>) => {
    if (!editingProject) return;
    setSubmitting(true);
    const { error } = await supabase.from('projects').update({
      name: formData.name,
      description: formData.description || null,
      client_name: formData.client_name,
      status: (formData.status || 'Not Started') as ProjectStatus,
      cost_estimate: Number(formData.cost_estimate) || 0,
      timeline: formData.timeline || null,
      deadline: formData.deadline || null,
    }).eq('id', editingProject.id);
    setSubmitting(false);
    if (!error) {
      setShowModal(false); setEditingProject(null); fetchAll();
      if (selectedProject?.id === editingProject.id) {
        setSelectedProject({ ...selectedProject, name: formData.name, status: (formData.status || 'Not Started') as ProjectStatus, deadline: formData.deadline || null });
      }
    }
  };

  const handleDelete = async (project: Project) => {
    const { error } = await supabase.from('projects').delete().eq('id', project.id);
    if (!error) { setConfirmDelete(null); setSelectedProject(null); fetchAll(); }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setSelectedProject(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-light-secondary dark:text-dark-secondary">Loading projects…</div>
      </div>
    );
  }

  const selectedTasks = selectedProject ? (tasksByProject[selectedProject.id] ?? []) : [];

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-light-secondary dark:text-dark-secondary mt-1">
            {projects.length} total · {projects.filter((p) => p.status === 'In Progress' || p.status === 'Review').length} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-light-border dark:border-dark-border p-0.5">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[36px] ${view === 'board' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'text-light-secondary dark:text-dark-secondary'}`}
            >Board</button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[36px] ${view === 'list' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'text-light-secondary dark:text-dark-secondary'}`}
            >List</button>
          </div>
          <button
            onClick={() => { setEditingProject(null); setShowModal(true); }}
            className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Create Project</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Detail view */}
      {selectedProject ? (
        <div className="space-y-5 animate-fade-in">
          <div className="card border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedProject(null)}
                className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary hover:text-light-text dark:hover:text-dark-text transition-colors min-h-[44px]"
              >
                <ArrowLeft size={16} />
                Back to projects
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(selectedProject)} className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline min-h-[44px] px-2">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => setConfirmDelete(selectedProject)} className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline min-h-[44px] px-2">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Briefcase size={24} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold break-words">{selectedProject.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[selectedProject.status]}`}>
                    {selectedProject.status}
                  </span>
                  {selectedProject.deadline && (
                    <DeadlineBadge deadline={selectedProject.deadline} />
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <User size={16} className="text-light-secondary dark:text-dark-secondary flex-shrink-0" />
                <span className="text-sm truncate">{selectedProject.client_name}</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <Calendar size={16} className="text-light-secondary dark:text-dark-secondary flex-shrink-0" />
                <span className="text-sm">{selectedProject.deadline ? formatDate(selectedProject.deadline) : (selectedProject.timeline || 'No timeline')}</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <DollarSign size={16} className="text-violet-600 dark:text-violet-400 flex-shrink-0" />
                <span className="text-sm font-medium">{formatCurrency(selectedProject.cost_estimate)}</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={16} className="text-light-secondary dark:text-dark-secondary flex-shrink-0" />
                <span className="text-sm text-light-secondary dark:text-dark-secondary">Created {formatDate(selectedProject.created_at)}</span>
              </div>
            </div>
            {selectedProject.description && (
              <div className="p-4 rounded-lg bg-light-canvas dark:bg-dark-canvas border border-light-border dark:border-dark-border">
                <div className="text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1">Description</div>
                <p className="text-sm whitespace-pre-wrap">{selectedProject.description}</p>
              </div>
            )}
          </div>

          {/* Steps & Checklist */}
          <ProjectChecklist project={selectedProject} tasks={selectedTasks} onChange={fetchAll} />
        </div>
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colProjects = projects.filter((p) => p.status === col.status);
            return (
              <div key={col.status} className="space-y-3 min-w-0">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColors[col.status].split(' ')[0]}`}></span>
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <span className="text-xs text-light-secondary dark:text-dark-secondary">{colProjects.length}</span>
                </div>
                <div className="space-y-3">
                  {colProjects.map((p) => {
                    const tasks = tasksByProject[p.id] ?? [];
                    const progress = computeProgress(tasks);
                    return (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        tasks={tasks}
                        progress={progress}
                        onClick={() => setSelectedProject(p)}
                        onEdit={() => openEdit(p)}
                        onDelete={() => setConfirmDelete(p)}
                      />
                    );
                  })}
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
        <ListView projects={projects} tasksByProject={tasksByProject} onSelect={setSelectedProject} onEdit={openEdit} onDelete={setConfirmDelete} />
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

function DeadlineBadge({ deadline }: { deadline: string }) {
  const urg = urgencyLabel(deadline);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-light-border dark:border-dark-border ${urgencyToneColors[urg.tone]}`}>
      <Calendar size={11} />
      {urg.text}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-light-canvas dark:bg-dark-canvas border border-light-border dark:border-dark-border overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${value === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-500 to-indigo-500'}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function ProjectCard({ project, tasks, progress, onClick, onEdit, onDelete }: {
  project: Project;
  tasks: ProjectTask[];
  progress: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-4 hover:border-violet-500/30 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-1 gap-2">
        <div className="text-sm font-semibold break-words min-w-0 flex-1">{project.name}</div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded text-light-secondary dark:text-dark-secondary hover:text-violet-600 dark:hover:text-violet-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 flex items-center justify-center">
            <Pencil size={12} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded text-light-secondary dark:text-dark-secondary hover:text-rose-600 md:opacity-0 md:group-hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 flex items-center justify-center">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <div className="text-xs text-light-secondary dark:text-dark-secondary mb-3 line-clamp-2 break-words">{project.description || 'No description'}</div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-light-secondary dark:text-dark-secondary flex items-center gap-1">
            <ListChecks size={11} /> {tasks.filter((t) => t.is_completed).length}/{tasks.length}
          </span>
          <span className="text-[11px] font-semibold">{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-light-secondary dark:text-dark-secondary min-w-0">
          <User size={12} className="flex-shrink-0" />
          <span className="truncate">{project.client_name}</span>
        </div>
        {project.deadline ? (
          <div className={`flex items-center gap-2 text-xs font-medium ${urgencyToneColors[urgencyLabel(project.deadline).tone]}`}>
            <Calendar size={12} className="flex-shrink-0" />
            {urgencyLabel(project.deadline).text}
          </div>
        ) : project.timeline ? (
          <div className="flex items-center gap-2 text-xs text-light-secondary dark:text-dark-secondary">
            <Calendar size={12} className="flex-shrink-0" />
            {project.timeline}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ListView({ projects, tasksByProject, onSelect, onEdit, onDelete }: {
  projects: Project[];
  tasksByProject: Record<string, ProjectTask[]>;
  onSelect: (p: Project) => void;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card text-center py-12 text-sm text-light-secondary dark:text-dark-secondary">
        No projects yet. Create your first project!
      </div>
    );
  }
  return (
    <>
      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        {projects.map((p) => {
          const tasks = tasksByProject[p.id] ?? [];
          const progress = computeProgress(tasks);
          return (
            <div key={p.id} className="card border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card p-4" onClick={() => onSelect(p)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-light-secondary dark:text-dark-secondary truncate">{p.client_name}</div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${statusColors[p.status]}`}>{p.status}</span>
              </div>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-light-secondary dark:text-dark-secondary">{tasks.filter((t) => t.is_completed).length}/{tasks.length} steps</span>
                  <span className="text-[11px] font-semibold">{progress}%</span>
                </div>
                <ProgressBar value={progress} />
              </div>
              <div className="flex items-center justify-between text-xs text-light-secondary dark:text-dark-secondary">
                <span className="font-medium text-light-text dark:text-dark-text">{formatCurrency(p.cost_estimate)}</span>
                {p.deadline && <span className={urgencyToneColors[urgencyLabel(p.deadline).tone]}>{urgencyLabel(p.deadline).text}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Project</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Progress</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Deadline</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Estimate</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const tasks = tasksByProject[p.id] ?? [];
                const progress = computeProgress(tasks);
                return (
                  <tr key={p.id} className="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors cursor-pointer" onClick={() => onSelect(p)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <Briefcase size={16} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{p.client_name}</td>
                    <td className="px-4 py-3">
                      <div className="w-28">
                        <div className="text-[11px] font-medium mb-1">{progress}% · {tasks.filter((t) => t.is_completed).length}/{tasks.length}</div>
                        <ProgressBar value={progress} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {p.deadline ? <span className={urgencyToneColors[urgencyLabel(p.deadline).tone]}>{urgencyLabel(p.deadline).text}</span> : <span className="text-light-secondary dark:text-dark-secondary">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(p.cost_estimate)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => onEdit(p)} className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => onDelete(p)} className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function DeleteConfirm({ project, onCancel, onConfirm }: { project: Project; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onCancel} />
      <div className="relative w-full md:max-w-sm bg-light-card dark:bg-dark-card md:rounded-xl rounded-t-2xl border border-light-border dark:border-dark-border shadow-2xl p-6 animate-slide-up md:animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-lg font-bold">Delete Project</h2>
        </div>
        <p className="text-sm text-light-secondary dark:text-dark-secondary mb-6">
          Are you sure you want to delete <strong className="text-light-text dark:text-dark-text">{project.name}</strong>? This will also remove all checklist steps. This action cannot be undone.
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
    status: project?.status ?? 'Not Started' as ProjectStatus,
    cost_estimate: project?.cost_estimate?.toString() ?? '',
    timeline: project?.timeline ?? '',
    deadline: project?.deadline ?? '',
  });

  const footer = (
    <div className="flex gap-3">
      <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border hover:bg-light-canvas dark:hover:bg-dark-canvas">Cancel</button>
      <button type="submit" form="project-form" disabled={submitting} className="btn-primary flex-1 justify-center bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
        {submitting ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}
      </button>
    </div>
  );

  return (
    <Sheet open onClose={onClose} title={project ? 'Edit Project' : 'Create Project'} footer={footer}>
      <form id="project-form" className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
        <Field label="Project Name">
          <input className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Description">
          <textarea rows={3} className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Client">
          <select className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })}>
            <option value="">Select a client…</option>
            {clients.map((c) => <option key={c.id}>{c.company_name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cost Estimate">
            <input type="number" className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.cost_estimate} onChange={(e) => setForm({ ...form, cost_estimate: e.target.value })} />
          </Field>
          <Field label="Deadline">
            <input type="date" className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
        </div>
        <Field label="Timeline (free text)">
          <input className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" placeholder="e.g. Q1 2026" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} />
        </Field>
        <Field label="Status">
          <select className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </form>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}
