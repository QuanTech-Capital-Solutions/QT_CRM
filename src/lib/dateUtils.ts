import { type ProjectStatus, type TaskPriority, type CalendarEventType } from './types';

export const PROJECT_STATUSES: ProjectStatus[] = ['Not Started', 'In Progress', 'Review', 'Completed'];
export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];

export const statusColors: Record<ProjectStatus, string> = {
  'Not Started': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  'In Progress': 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  Review: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

export const priorityColors: Record<TaskPriority, string> = {
  Low: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  High: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export const eventTypeColors: Record<CalendarEventType, { bg: string; dot: string; label: string }> = {
  meeting: { bg: 'bg-sky-500/10 border-sky-500/30', dot: 'bg-sky-500', label: 'Meeting' },
  task: { bg: 'bg-violet-500/10 border-violet-500/30', dot: 'bg-violet-500', label: 'Task' },
  deadline: { bg: 'bg-rose-500/10 border-rose-500/30', dot: 'bg-rose-500', label: 'Deadline' },
  custom: { bg: 'bg-slate-500/10 border-slate-500/30', dot: 'bg-slate-500', label: 'Event' },
};

/** YYYY-MM-DD for local date (avoids UTC offset issues). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  return new Date(s + 'T00:00:00');
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - day);
  return r;
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Days from today (negative = past). Uses date-only comparison. */
export function daysFromToday(iso: string | null): number | null {
  if (!iso) return null;
  const target = parseISODate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / 86400000);
}

export function urgencyLabel(iso: string | null): { text: string; tone: 'overdue' | 'today' | 'soon' | 'later' | 'none' } {
  const days = daysFromToday(iso);
  if (days === null) return { text: 'No due date', tone: 'none' };
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'overdue' };
  if (days === 0) return { text: 'Due today', tone: 'today' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'soon' };
  if (days <= 7) return { text: `Due in ${days}d`, tone: 'soon' };
  return { text: `Due in ${days}d`, tone: 'later' };
}

export const urgencyToneColors: Record<string, string> = {
  overdue: 'text-rose-600 dark:text-rose-400',
  today: 'text-amber-600 dark:text-amber-400',
  soon: 'text-sky-600 dark:text-sky-400',
  later: 'text-light-secondary dark:text-dark-secondary',
  none: 'text-light-secondary dark:text-dark-secondary',
};

export const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const weekdayMin = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Stable color assigned per project id for calendar color-coding. */
const PROJECT_PALETTE = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-pink-500',
];

export function projectColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PROJECT_PALETTE[Math.abs(hash) % PROJECT_PALETTE.length];
}

export function computeProgress(tasks: { is_completed: boolean }[]): number {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.is_completed).length / tasks.length) * 100);
}
