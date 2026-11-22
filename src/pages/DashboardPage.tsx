import { useEffect, useState } from 'react';
import { Users, Briefcase, FileText, DollarSign, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Circle, CalendarClock, AlertTriangle, ListChecks } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate, type Client, type Project, type Invoice, type LedgerEntry, type ProjectTask } from '../lib/types';
import { statusColors, urgencyLabel, urgencyToneColors, daysFromToday, computeProgress, toISODate } from '../lib/dateUtils';

export function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }, { data: i }, { data: l }, { data: t }] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('ledger_entries').select('*').order('date', { ascending: false }),
        supabase.from('project_tasks').select('*').order('due_date', { ascending: true }),
      ]);
      setClients(c ?? []);
      setProjects(p ?? []);
      setInvoices(i ?? []);
      setLedger(l ?? []);
      setTasks(t ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-light-secondary dark:text-dark-secondary">Loading dashboard…</div>
      </div>
    );
  }

  const activeClients = clients.filter((c) => c.status === 'Active').length;
  const activeProjects = projects.filter((p) => p.status === 'In Progress' || p.status === 'Review').length;
  const outstandingInvoices = invoices.filter((i) => i.status === 'Sent' || i.status === 'Overdue');
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalRevenue = ledger.filter((l) => l.type === 'Income').reduce((sum, l) => sum + l.amount, 0);

  const metrics = [
    { label: 'Active Clients', value: activeClients.toString(), icon: Users, change: `${clients.length} total`, positive: true },
    { label: 'Active Projects', value: activeProjects.toString(), icon: Briefcase, change: `${projects.length} total`, positive: true },
    { label: 'Outstanding Invoices', value: formatCurrency(outstandingTotal), icon: FileText, change: `${outstandingInvoices.length} pending`, positive: false },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, change: 'All-time', positive: true },
  ];

  // Urgency-based lists
  const tasksByProject = tasks.reduce<Record<string, ProjectTask[]>>((acc, t) => {
    (acc[t.project_id] ??= []).push(t);
    return acc;
  }, {});

  const upcomingDeadlines = projects
    .filter((p) => p.deadline && p.status !== 'Completed')
    .map((p) => ({ project: p, days: daysFromToday(p.deadline)! }))
    .filter((x) => x.days !== null)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const overdueTasks = tasks.filter((t) => !t.is_completed && t.due_date && daysFromToday(t.due_date)! < 0);
  const dueSoonTasks = tasks
    .filter((t) => !t.is_completed && t.due_date && daysFromToday(t.due_date)! >= 0 && daysFromToday(t.due_date)! <= 7)
    .sort((a, b) => (daysFromToday(a.due_date)! - daysFromToday(b.due_date)!))
    .slice(0, 6);

  const recentActivity = ledger.slice(0, 5);
  const sortedProjects = [...projects].sort((a, b) => {
    const statusRank = (status: Project['status']) =>
      status === 'Completed' ? 2 : status === 'Review' ? 1 : 0;
    const statusOrder = statusRank(a.status) - statusRank(b.status);
    if (statusOrder !== 0) return statusOrder;

    if (a.deadline && b.deadline && a.deadline !== b.deadline) {
      return a.deadline.localeCompare(b.deadline);
    }
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;

    const aProgress = computeProgress(tasksByProject[a.id] ?? []);
    const bProgress = computeProgress(tasksByProject[b.id] ?? []);
    return bProgress - aProgress || a.name.localeCompare(b.name);
  });
  const dashboardProjects = sortedProjects.slice(0, 8);
  const todayISO = toISODate(new Date());

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-light-secondary dark:text-dark-secondary mt-1">Your business at a glance — {formatDate(todayISO)}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-4 md:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <m.icon size={20} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${m.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-light-secondary dark:text-dark-secondary'}`}>
                {m.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span className="hidden sm:inline">{m.change}</span>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold mb-1 break-words">{m.value}</div>
            <div className="text-xs md:text-sm text-light-secondary dark:text-dark-secondary">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Urgent items row */}
      {(overdueTasks.length > 0 || upcomingDeadlines.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Overdue tasks */}
          <div className="card border-rose-500/20 dark:border-rose-500/20 bg-rose-500/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400" />
              <h2 className="text-base font-semibold">Overdue Tasks</h2>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium ml-auto">{overdueTasks.length}</span>
            </div>
            {overdueTasks.length === 0 ? (
              <div className="text-sm text-light-secondary dark:text-dark-secondary py-4">Nothing overdue. You're all caught up!</div>
            ) : (
              <div className="space-y-2">
                {overdueTasks.slice(0, 5).map((t) => {
                  const proj = projects.find((p) => p.id === t.project_id);
                  return (
                    <div key={t.id} className="flex items-center gap-3 py-2">
                      <Clock size={14} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-light-secondary dark:text-dark-secondary truncate">{proj?.name ?? '—'} · {urgencyLabel(t.due_date).text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming deadlines */}
          <div className="card border-amber-500/20 dark:border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock size={18} className="text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-semibold">Project Deadlines</h2>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium ml-auto">{upcomingDeadlines.length}</span>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-sm text-light-secondary dark:text-dark-secondary py-4">No upcoming deadlines.</div>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map(({ project, days }) => (
                  <div key={project.id} className="flex items-center gap-3 py-2">
                    <Briefcase size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{project.name}</div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary truncate">{project.client_name}</div>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${urgencyToneColors[urgencyLabel(project.deadline).tone]}`}>
                      {urgencyLabel(project.deadline).text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Due this week + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Tasks due this week */}
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListChecks size={18} className="text-violet-600 dark:text-violet-400" />
              <h2 className="text-base font-semibold">Tasks Due This Week</h2>
            </div>
            <span className="text-xs text-light-secondary dark:text-dark-secondary">{dueSoonTasks.length}</span>
          </div>
          {dueSoonTasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-light-secondary dark:text-dark-secondary">No tasks due in the next 7 days.</div>
          ) : (
            <div className="space-y-1">
              {dueSoonTasks.map((t) => {
                const proj = projects.find((p) => p.id === t.project_id);
                const urg = urgencyLabel(t.due_date);
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3 border-b border-light-border dark:border-dark-border last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Circle size={14} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary truncate">{proj?.name ?? '—'}</div>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${urgencyToneColors[urg.tone]}`}>{urg.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Financial Activity */}
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Recent Financial Activity</h2>
            <span className="text-xs text-light-secondary dark:text-dark-secondary">Last 5</span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-sm text-light-secondary dark:text-dark-secondary">No activity yet.</div>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3 border-b border-light-border dark:border-dark-border last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.type === 'Income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                      {entry.type === 'Income' ? <ArrowDownRight size={16} className="text-emerald-600 dark:text-emerald-400" /> : <ArrowUpRight size={16} className="text-rose-600 dark:text-rose-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{entry.description || entry.category}</div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary">{entry.category} · {formatDate(entry.date)}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold flex-shrink-0 ml-3 ${entry.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {entry.type === 'Income' ? '+' : '-'}{formatCurrency(entry.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Pipeline */}
      <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Project Pipeline</h2>
          <span className="text-xs text-light-secondary dark:text-dark-secondary">{projects.length} total</span>
        </div>
        {dashboardProjects.length === 0 ? (
          <div className="text-center py-8 text-sm text-light-secondary dark:text-dark-secondary">No projects yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dashboardProjects.map((p) => {
              const pTasks = tasksByProject[p.id] ?? [];
              const progress = computeProgress(pTasks);
              return (
                <div key={p.id} className="flex items-start gap-3 min-w-0 p-3 rounded-lg border border-light-border dark:border-dark-border">
                  <div className="flex-shrink-0 pt-0.5">
                    {p.status === 'Completed' ? <CheckCircle2 size={18} className="text-emerald-500" /> : p.status === 'In Progress' ? <Circle size={18} className="text-violet-500" fill="currentColor" fillOpacity={0.2} /> : p.status === 'Review' ? <Clock size={18} className="text-amber-500" /> : <Circle size={18} className="text-slate-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-light-secondary dark:text-dark-secondary truncate">{p.client_name}</div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-light-secondary dark:text-dark-secondary mb-1">
                        <span>Progress</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div
                        className="h-1.5 w-full rounded-full bg-light-canvas dark:bg-dark-canvas overflow-hidden"
                        role="progressbar"
                        aria-label={`${p.name} completion`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                      >
                        <div className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 max-w-[90px] truncate ${statusColors[p.status]}`}>{p.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
