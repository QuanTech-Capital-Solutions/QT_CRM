import { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2, Check, Calendar, Flag, ListChecks } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Project, type ProjectTask, type TaskPriority, formatDate } from '../lib/types';
import { TASK_PRIORITIES, priorityColors, urgencyLabel, urgencyToneColors, computeProgress } from '../lib/dateUtils';

interface Props {
  project: Project;
  tasks: ProjectTask[];
  onChange: () => void;
}

export function ProjectChecklist({ project, tasks, onChange }: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const sorted = [...tasks].sort((a, b) => a.sort_order - b.sort_order);
  const progress = computeProgress(tasks);
  const completed = tasks.filter((t) => t.is_completed).length;

  const addTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    const maxOrder = tasks.reduce((m, t) => Math.max(m, t.sort_order), -1);
    const { error } = await supabase.from('project_tasks').insert({
      project_id: project.id,
      title,
      sort_order: maxOrder + 1,
    });
    setAdding(false);
    if (!error) {
      setNewTitle('');
      onChange();
    }
  };

  const toggle = async (task: ProjectTask) => {
    await supabase.from('project_tasks').update({ is_completed: !task.is_completed }).eq('id', task.id);
    onChange();
  };

  const move = async (task: ProjectTask, dir: -1 | 1) => {
    const idx = sorted.findIndex((t) => t.id === task.id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;
    await Promise.all([
      supabase.from('project_tasks').update({ sort_order: swapWith.sort_order }).eq('id', task.id),
      supabase.from('project_tasks').update({ sort_order: task.sort_order }).eq('id', swapWith.id),
    ]);
    onChange();
  };

  const remove = async (task: ProjectTask) => {
    await supabase.from('project_tasks').delete().eq('id', task.id);
    onChange();
  };

  const updateField = async (task: ProjectTask, field: keyof ProjectTask, value: unknown) => {
    await supabase.from('project_tasks').update({ [field]: value }).eq('id', task.id);
    onChange();
  };

  return (
    <div className="card border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListChecks size={18} className="text-violet-600 dark:text-violet-400" />
          <h3 className="text-base font-semibold">Steps & Checklist</h3>
        </div>
        <span className="text-xs text-light-secondary dark:text-dark-secondary font-medium">
          {completed}/{tasks.length} done · {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-2 w-full rounded-full bg-light-canvas dark:bg-dark-canvas border border-light-border dark:border-dark-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quick add */}
      <div className="flex gap-2 mb-4">
        <input
          className="input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border flex-1"
          placeholder="Add a step and press Enter…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
          disabled={adding}
        />
        <button
          onClick={addTask}
          disabled={adding || !newTitle.trim()}
          className="btn-primary bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 px-3"
          aria-label="Add step"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Task list */}
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-sm text-light-secondary dark:text-dark-secondary border border-dashed border-light-border dark:border-dark-border rounded-lg">
          No steps yet. Add your first action item above.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((task, idx) => {
            const urg = urgencyLabel(task.due_date);
            return (
              <div
                key={task.id}
                className={`group flex items-start gap-2 p-3 rounded-lg border transition-colors ${
                  task.is_completed
                    ? 'bg-light-canvas/60 dark:bg-dark-canvas/40 border-light-border dark:border-dark-border'
                    : 'bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border'
                }`}
              >
                {/* Check */}
                <button
                  onClick={() => toggle(task)}
                  className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all min-w-[44px] min-h-[44px] md:min-w-[24px] md:min-h-[24px] ${
                    task.is_completed
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-light-border dark:border-dark-border hover:border-violet-500'
                  }`}
                  aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {task.is_completed && <Check size={14} strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className={`bg-transparent text-sm font-medium outline-none flex-1 min-w-0 ${
                        task.is_completed ? 'line-through text-light-secondary dark:text-dark-secondary' : 'text-light-text dark:text-dark-text'
                      }`}
                      defaultValue={task.title}
                      onBlur={(e) => { if (e.target.value !== task.title) updateField(task, 'title', e.target.value); }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {/* Priority */}
                    <select
                      value={task.priority}
                      onChange={(e) => updateField(task, 'priority', e.target.value)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border outline-none cursor-pointer ${priorityColors[task.priority as TaskPriority]}`}
                    >
                      {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {/* Due date */}
                    <label className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-light-border dark:border-dark-border text-light-secondary dark:text-dark-secondary cursor-pointer">
                      <Calendar size={11} />
                      <input
                        type="date"
                        value={task.due_date ?? ''}
                        onChange={(e) => updateField(task, 'due_date', e.target.value || null)}
                        className="bg-transparent outline-none text-[11px] text-light-secondary dark:text-dark-secondary"
                      />
                      {!task.due_date && <span className="text-[11px]">Set date</span>}
                    </label>
                    {task.due_date && (
                      <span className={`text-[11px] font-medium ${urgencyToneColors[urg.tone]}`}>
                        {urg.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reorder + delete (desktop hover / always on mobile) */}
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => move(task, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded text-light-secondary dark:text-dark-secondary hover:text-violet-600 disabled:opacity-30 min-w-[36px] min-h-[36px] md:min-w-[20px] md:min-h-[20px] flex items-center justify-center"
                    aria-label="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => move(task, 1)}
                    disabled={idx === sorted.length - 1}
                    className="p-1 rounded text-light-secondary dark:text-dark-secondary hover:text-violet-600 disabled:opacity-30 min-w-[36px] min-h-[36px] md:min-w-[20px] md:min-h-[20px] flex items-center justify-center"
                    aria-label="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => remove(task)}
                    className="p-1 rounded text-light-secondary dark:text-dark-secondary hover:text-rose-600 min-w-[36px] min-h-[36px] md:min-w-[20px] md:min-h-[20px] flex items-center justify-center"
                    aria-label="Delete step"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { computeProgress };
