import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, Check, Clock, Flag, Users as UsersIcon, Briefcase, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Project, type Client, type ProjectTask, type CalendarEvent, type CalendarEventType, type TaskPriority } from '../lib/types';
import { Sheet } from '../components/Sheet';
import {
  toISODate, parseISODate, isSameDay, addDays, startOfWeek, startOfMonth,
  weekdayShort, weekdayMin, monthNames,
  eventTypeColors, projectColor, TASK_PRIORITIES,
} from '../lib/dateUtils';

type CalendarView = 'agenda' | 'month';

interface AgendaItem {
  id: string;
  title: string;
  date: Date;
  type: CalendarEventType | 'deadline' | 'task-due';
  subtitle?: string;
  time?: string | null;
  allDay: boolean;
  isCompleted: boolean;
  color: string;
  eventId?: string;
  taskId?: string;
}

export function CalendarPage() {
  const [view, setView] = useState<CalendarView>('agenda');
  const [anchor, setAnchor] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CalendarEvent | null>(null);

  const fetchData = async () => {
    const [{ data: e }, { data: p }, { data: c }, { data: t }] = await Promise.all([
      supabase.from('calendar_events').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('project_tasks').select('*'),
    ]);
    setEvents(e ?? []);
    setProjects(p ?? []);
    setClients(c ?? []);
    setTasks(t ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Build unified agenda items from events + project deadlines + task due dates
  const allItems = useMemo<AgendaItem[]>(() => {
    const items: AgendaItem[] = [];
    // Manual events
    events.forEach((ev) => {
      items.push({
        id: ev.id,
        title: ev.title,
        date: parseISODate(ev.start_date),
        type: ev.event_type,
        subtitle: ev.client_name ?? undefined,
        time: ev.start_time,
        allDay: ev.all_day,
        isCompleted: ev.is_completed,
        color: ev.color ?? eventTypeColors[ev.event_type].dot,
        eventId: ev.id,
      });
    });
    // Project deadlines (auto)
    projects.filter((p) => p.deadline && p.status !== 'Completed').forEach((p) => {
      items.push({
        id: `dl-${p.id}`,
        title: `Deadline: ${p.name}`,
        date: parseISODate(p.deadline!),
        type: 'deadline',
        subtitle: p.client_name,
        allDay: true,
        isCompleted: false,
        color: 'bg-rose-500',
      });
    });
    // Task due dates (auto)
    tasks.filter((t) => t.due_date).forEach((t) => {
      const proj = projects.find((p) => p.id === t.project_id);
      items.push({
        id: `task-${t.id}`,
        title: t.title,
        date: parseISODate(t.due_date!),
        type: 'task-due',
        subtitle: proj?.name,
        allDay: true,
        isCompleted: t.is_completed,
        color: projectColor(t.project_id),
        taskId: t.id,
      });
    });
    return items;
  }, [events, projects, tasks]);

  const itemsOn = (d: Date) => allItems.filter((it) => isSameDay(it.date, d)).sort((a, b) => {
    // all-day items after timed
    if (a.allDay && !b.allDay) return 1;
    if (!a.allDay && b.allDay) return -1;
    return (a.time ?? '').localeCompare(b.time ?? '');
  });

  const toggleItem = async (item: AgendaItem) => {
    if (item.eventId) {
      await supabase.from('calendar_events').update({ is_completed: !item.isCompleted }).eq('id', item.eventId);
    } else if (item.taskId) {
      await supabase.from('project_tasks').update({ is_completed: !item.isCompleted }).eq('id', item.taskId);
    }
    fetchData();
  };

  const deleteEvent = async (eventId: string) => {
    await supabase.from('calendar_events').delete().eq('id', eventId);
    setConfirmDelete(null);
    fetchData();
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEditingTask(null);
    setSelectedDate(parseISODate(ev.start_date));
    setShowForm(true);
  };

  const openTaskEdit = (task: ProjectTask) => {
    setEditingTask(task);
  };

  const editAgendaItem = (item: AgendaItem) => {
    if (item.eventId) {
      const event = events.find((candidate) => candidate.id === item.eventId);
      if (event) openEdit(event);
    } else if (item.taskId) {
      const task = tasks.find((candidate) => candidate.id === item.taskId);
      if (task) openTaskEdit(task);
    }
  };

  const openAdd = (d: Date) => {
    setEditingEvent(null);
    setEditingTask(null);
    setSelectedDate(d);
    setShowForm(true);
  };

  // Week strip dates
  const weekStart = startOfWeek(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // 3-day agenda (mobile) / 7-day agenda (desktop)
  const agendaDays = view === 'agenda'
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [];

  // Month grid
  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const monthGrid = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const today = new Date();
  const goToToday = () => setAnchor(new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-light-secondary dark:text-dark-secondary">Loading calendar…</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-sm text-light-secondary dark:text-dark-secondary mt-0.5 truncate">
            {monthNames[anchor.getMonth()]} {anchor.getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={goToToday} className="px-3 py-2 rounded-lg border border-light-border dark:border-dark-border text-xs font-medium hover:bg-light-canvas dark:hover:bg-dark-canvas min-h-[40px]">
            Today
          </button>
          <div className="flex items-center rounded-lg border border-light-border dark:border-dark-border p-0.5">
            <button onClick={() => setView('agenda')} className={`px-2.5 py-1.5 rounded-md text-xs font-medium min-h-[36px] flex items-center gap-1 ${view === 'agenda' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'text-light-secondary dark:text-dark-secondary'}`}>
              <Clock size={13} /> <span className="hidden sm:inline">Agenda</span>
            </button>
            <button onClick={() => setView('month')} className={`px-2.5 py-1.5 rounded-md text-xs font-medium min-h-[36px] flex items-center gap-1 ${view === 'month' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'text-light-secondary dark:text-dark-secondary'}`}>
              <LayoutGrid size={13} /> <span className="hidden sm:inline">Month</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week strip (horizontal scrollable) */}
      <div className="mb-5 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <div className="flex gap-2 min-w-max md:min-w-0 md:justify-between pb-1">
          {weekDays.map((d) => {
            const isToday = isSameDay(d, today);
            const isSelected = isSameDay(d, anchor);
            const count = itemsOn(d).length;
            return (
              <button
                key={d.toISOString()}
                onClick={() => setAnchor(new Date(d))}
                className={`flex flex-col items-center justify-center rounded-xl border w-14 h-16 flex-shrink-0 transition-all min-w-[56px] ${
                  isSelected ? 'bg-violet-600 text-white border-violet-600' : isToday ? 'border-violet-500/40 bg-violet-500/5' : 'border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card'
                }`}
              >
                <span className={`text-[10px] font-medium uppercase ${isSelected ? 'text-white/70' : 'text-light-secondary dark:text-dark-secondary'}`}>
                  {weekdayMin[d.getDay()]}
                </span>
                <span className={`text-lg font-bold ${isToday && !isSelected ? 'text-violet-600 dark:text-violet-400' : ''}`}>{d.getDate()}</span>
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${count > 0 ? (isSelected ? 'bg-white' : 'bg-violet-500') : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setAnchor(addDays(anchor, view === 'month' ? -30 : -7))} className="p-2 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-canvas dark:hover:bg-dark-canvas min-w-[40px] min-h-[40px] flex items-center justify-center">
          <ChevronLeft size={16} />
        </button>
        <button onClick={() => setAnchor(addDays(anchor, view === 'month' ? 30 : 7))} className="p-2 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-canvas dark:hover:bg-dark-canvas min-w-[40px] min-h-[40px] flex items-center justify-center">
          <ChevronRight size={16} />
        </button>
        <span className="text-sm font-medium ml-1">
          {view === 'month' ? `${monthNames[anchor.getMonth()]} ${anchor.getFullYear()}` : `Week of ${monthNames[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()}`}
        </span>
      </div>

      {/* Content */}
      {view === 'agenda' ? (
        <AgendaView
          days={agendaDays}
          itemsOn={itemsOn}
          onToggle={toggleItem}
          onEdit={editAgendaItem}
          onRequestDelete={(item) => {
            const event = events.find((candidate) => candidate.id === item.eventId);
            if (event) setConfirmDelete(event);
          }}
          onAddDay={(d) => openAdd(d)}
        />
      ) : (
        <MonthView grid={monthGrid} anchor={anchor} itemsOn={itemsOn} onDayClick={(d) => { setAnchor(d); openAdd(d); }} onToggle={toggleItem} />
      )}

      {/* Floating Add button */}
      <button
        onClick={() => { setSelectedDate(anchor); setShowForm(true); }}
        className="fixed right-5 bottom-24 md:bottom-8 z-40 w-14 h-14 rounded-full bg-violet-600 text-white shadow-xl shadow-violet-600/30 flex items-center justify-center hover:bg-violet-700 active:scale-95 transition-all"
        aria-label="Add event or task"
      >
        <Plus size={24} />
      </button>

      {showForm && (
        <EventForm
          event={editingEvent}
          date={selectedDate ?? anchor}
          projects={projects}
          clients={clients}
          onClose={() => { setShowForm(false); setSelectedDate(null); setEditingEvent(null); }}
          onSaved={fetchData}
        />
      )}

      {editingTask && (
        <TaskScheduleForm
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={() => { setEditingTask(null); fetchData(); }}
        />
      )}

      {confirmDelete && (
        <DeleteEventConfirm event={confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={() => deleteEvent(confirmDelete.id)} />
      )}
    </div>
  );
}

/* ── Agenda View ───────────────────────────── */

function AgendaView({ days, itemsOn, onToggle, onEdit, onRequestDelete, onAddDay }: {
  days: Date[];
  itemsOn: (d: Date) => AgendaItem[];
  onToggle: (item: AgendaItem) => void;
  onEdit: (item: AgendaItem) => void;
  onRequestDelete: (item: AgendaItem) => void;
  onAddDay: (d: Date) => void;
}) {
  const today = new Date();
  return (
    <div className="space-y-5">
      {days.map((d) => {
        const items = itemsOn(d);
        const isToday = isSameDay(d, today);
        return (
          <div key={d.toISOString()}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isToday ? 'text-violet-600 dark:text-violet-400' : ''}`}>
                  {weekdayShort[d.getDay()]}, {monthNames[d.getMonth()].slice(0, 3)} {d.getDate()}
                </span>
                {isToday && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">Today</span>}
              </div>
              <button onClick={() => onAddDay(d)} className="p-1.5 rounded-lg text-light-secondary dark:text-dark-secondary hover:text-violet-600 hover:bg-violet-500/10 min-w-[36px] min-h-[36px] flex items-center justify-center">
                <Plus size={15} />
              </button>
            </div>
            {items.length === 0 ? (
              <div className="text-xs text-light-secondary dark:text-dark-secondary py-3 pl-1">Nothing scheduled</div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <AgendaItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => onToggle(item)}
                    onEdit={item.eventId || item.taskId ? () => onEdit(item) : undefined}
                    onRequestDelete={item.eventId ? () => onRequestDelete(item) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AgendaItemRow({ item, onToggle, onEdit, onRequestDelete }: { item: AgendaItem; onToggle: () => void; onEdit?: () => void; onRequestDelete?: () => void }) {
  const meta = getItemMeta(item);
  const isTask = item.type === 'task' || item.type === 'task-due';
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${item.isCompleted ? 'opacity-60' : ''} ${meta.bg} border-transparent`}>
      {isTask ? (
        <button
          onClick={onToggle}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all min-w-[44px] min-h-[44px] md:min-w-[24px] md:min-h-[24px] ${item.isCompleted ? 'bg-violet-600 border-violet-600 text-white' : 'border-light-border dark:border-dark-border hover:border-violet-500'}`}
          aria-label="Toggle complete"
        >
          {item.isCompleted && <Check size={14} strokeWidth={3} />}
        </button>
      ) : (
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ml-1.5 ${item.color}`} />
      )}
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium truncate ${item.isCompleted ? 'line-through' : ''}`}>{item.title}</div>
        <div className="flex items-center gap-2 text-xs text-light-secondary dark:text-dark-secondary">
          {item.time && !item.allDay && <span className="inline-flex items-center gap-0.5"><Clock size={11} /> {item.time}</span>}
          {item.subtitle && <span className="truncate">{item.subtitle}</span>}
          <span className="inline-flex items-center gap-0.5">{meta.icon} {meta.label}</span>
        </div>
      </div>
      {onEdit && (
        <button onClick={onEdit} className="p-1.5 rounded text-light-secondary dark:text-dark-secondary hover:text-violet-600 dark:hover:text-violet-400 min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0" aria-label="Edit">
          <Pencil size={14} />
        </button>
      )}
      {onRequestDelete && (
        <button onClick={onRequestDelete} className="p-1.5 rounded text-light-secondary dark:text-dark-secondary hover:text-rose-600 min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0" aria-label="Delete">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function getItemMeta(item: AgendaItem): { bg: string; label: string; icon: ReactNode } {
  switch (item.type) {
    case 'meeting':
      return { bg: 'bg-sky-500/5', label: 'Meeting', icon: <UsersIcon size={11} /> };
    case 'task':
      return { bg: 'bg-violet-500/5', label: 'Task', icon: <Flag size={11} /> };
    case 'task-due':
      return { bg: 'bg-violet-500/5', label: 'Task Due', icon: <Flag size={11} /> };
    case 'deadline':
      return { bg: 'bg-rose-500/5', label: 'Deadline', icon: <Briefcase size={11} /> };
    default:
      return { bg: 'bg-slate-500/5', label: 'Event', icon: <CalendarDays size={11} /> };
  }
}

/* ── Month View ────────────────────────────── */

function MonthView({ grid, anchor, itemsOn, onDayClick, onToggle }: {
  grid: Date[];
  anchor: Date;
  itemsOn: (d: Date) => AgendaItem[];
  onDayClick: (d: Date) => void;
  onToggle: (item: AgendaItem) => void;
}) {
  const today = new Date();
  return (
    <div className="card border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-light-border dark:border-dark-border">
        {weekdayMin.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold uppercase py-2 text-light-secondary dark:text-dark-secondary">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((d, i) => {
          const inMonth = d.getMonth() === anchor.getMonth();
          const isToday = isSameDay(d, today);
          const items = itemsOn(d).slice(0, 3);
          const total = itemsOn(d).length;
          return (
            <div
              key={i}
              className={`min-h-[72px] md:min-h-[96px] border-r border-b border-light-border dark:border-dark-border p-1 ${inMonth ? 'bg-light-card dark:bg-dark-card' : 'bg-light-canvas/50 dark:bg-dark-canvas/30'} cursor-pointer hover:bg-violet-500/5 transition-colors`}
              onClick={() => onDayClick(d)}
            >
              <div className={`text-xs font-medium text-right mb-1 ${!inMonth ? 'text-light-secondary dark:text-dark-secondary opacity-50' : isToday ? 'text-violet-600 dark:text-violet-400 font-bold' : ''}`}>
                {d.getDate()}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => { e.stopPropagation(); if (item.type === 'task' || item.type === 'task-due') onToggle(item); }}
                    className={`flex items-center gap-1 text-[10px] rounded px-1 py-0.5 truncate ${item.isCompleted ? 'opacity-50 line-through' : ''} ${getItemMeta(item).bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.color}`} />
                    <span className="truncate">{item.title}</span>
                  </div>
                ))}
                {total > 3 && <div className="text-[10px] text-light-secondary dark:text-dark-secondary px-1">+{total - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Event Form ────────────────────────────── */

function TaskScheduleForm({ task, onClose, onSaved }: {
  task: ProjectTask;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    due_date: task.due_date ?? '',
    priority: task.priority,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    setError('');
    const { error: updateError } = await supabase.from('project_tasks').update({
      title: form.title.trim(),
      description: form.description || null,
      due_date: form.due_date || null,
      priority: form.priority,
    }).eq('id', task.id);
    setSubmitting(false);
    if (updateError) { setError(updateError.message); return; }
    onSaved();
  };

  const footer = (
    <div className="flex gap-3">
      <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border">Cancel</button>
      <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 justify-center bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
        {submitting ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );

  return (
    <Sheet open onClose={onClose} title="Edit Scheduled Task" footer={footer}>
      <div className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">{error}</div>}
        <div>
          <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Title</label>
          <input
            className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Description (optional)</label>
          <textarea
            rows={2}
            className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Due date</label>
          <input
            type="date"
            className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Priority</label>
          <select
            className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
          >
            {TASK_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </div>
      </div>
    </Sheet>
  );
}

function EventForm({ event, date, projects, clients, onClose, onSaved }: {
  event: CalendarEvent | null;
  date: Date;
  projects: Project[];
  clients: Client[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    event_type: event?.event_type ?? 'meeting' as CalendarEventType,
    start_date: event?.start_date ?? toISODate(date),
    start_time: event?.start_time ?? '',
    end_time: event?.end_time ?? '',
    all_day: event?.all_day ?? true,
    client_name: event?.client_name ?? '',
    project_id: event?.project_id ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const clientProjects = projects.filter((project) => !form.client_name || project.client_name === form.client_name);

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      event_type: form.event_type,
      start_date: form.start_date,
      start_time: form.all_day ? null : (form.start_time || null),
      end_time: form.all_day ? null : (form.end_time || null),
      all_day: form.all_day,
      client_name: form.client_name || null,
      project_id: form.project_id || null,
    };
    const { error: err } = event
      ? await supabase.from('calendar_events').update(payload).eq('id', event.id)
      : await supabase.from('calendar_events').insert(payload);
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  };

  const footer = (
    <div className="flex gap-3">
      <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border">Cancel</button>
      <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 justify-center bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
        {submitting ? 'Saving…' : event ? 'Save Changes' : 'Add to Calendar'}
      </button>
    </div>
  );

  return (
    <Sheet open onClose={onClose} title={event ? 'Edit Event / Task' : 'Add Event / Task'} footer={footer}>
      <div className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">{error}</div>}

        {/* Type selector */}
        <div>
          <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Type</label>
          <div className="grid grid-cols-4 gap-2">
            {(['meeting', 'task', 'deadline', 'custom'] as CalendarEventType[]).map((t) => {
              const meta = eventTypeColors[t];
              const active = form.event_type === t;
              return (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, event_type: t })}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[11px] font-medium transition-all min-h-[44px] ${active ? `${meta.bg} border-current` : 'border-light-border dark:border-dark-border text-light-secondary dark:text-dark-secondary'}`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Title</label>
          <input
            className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border"
            placeholder="e.g. Client kickoff call"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Description (optional)</label>
          <textarea rows={2} className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Date</label>
          <input type="date" className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>

        {/* All day toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">All day</label>
          <button
            onClick={() => setForm({ ...form, all_day: !form.all_day })}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.all_day ? 'bg-violet-600' : 'bg-light-border dark:bg-dark-border'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.all_day ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {!form.all_day && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Start Time</label>
              <input type="time" className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">End Time</label>
              <input type="time" className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Link to Client (optional)</label>
          <select
            className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border"
            value={form.client_name}
            onChange={(e) => {
              const clientName = e.target.value;
              setForm((current) => ({
                ...current,
                client_name: clientName,
                project_id: !clientName || projects.find((project) => project.id === current.project_id)?.client_name === clientName
                  ? current.project_id
                  : '',
              }));
            }}
          >
            <option value="">None</option>
            {clients.map((c) => <option key={c.id} value={c.company_name}>{c.company_name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">Link to Project (optional)</label>
          <select
            className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border"
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
          >
            <option value="">{clientProjects.length ? 'None' : form.client_name ? 'No projects linked to this client' : 'No projects available'}</option>
            {clientProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>
      </div>
    </Sheet>
  );
}

function DeleteEventConfirm({ event, onCancel, onConfirm }: { event: CalendarEvent; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onCancel} />
      <div className="relative w-full md:max-w-sm bg-light-card dark:bg-dark-card md:rounded-xl rounded-t-2xl border border-light-border dark:border-dark-border shadow-2xl p-6 animate-slide-up md:animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-lg font-bold">Delete Event</h2>
        </div>
        <p className="text-sm text-light-secondary dark:text-dark-secondary mb-6">
          Delete <strong className="text-light-text dark:text-dark-text">{event.title}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border">Cancel</button>
          <button onClick={onConfirm} className="btn-primary flex-1 justify-center bg-rose-600 text-white hover:bg-rose-700">Delete</button>
        </div>
      </div>
    </div>
  );
}
