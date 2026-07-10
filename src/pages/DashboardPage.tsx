import { useEffect, useState } from 'react';
import { Users, Briefcase, FileText, DollarSign, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate, type Client, type Project, type Invoice, type LedgerEntry } from '../lib/types';

const statusColors: Record<string, string> = {
  Scoping: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'On Hold': 'bg-slate-500/10 text-slate-500',
  Completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

export function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }, { data: i }, { data: l }] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('ledger_entries').select('*').order('date', { ascending: false }),
      ]);
      setClients(c ?? []);
      setProjects(p ?? []);
      setInvoices(i ?? []);
      setLedger(l ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-light-secondary dark:text-dark-secondary">Loading dashboard...</div>
      </div>
    );
  }

  const activeClients = clients.filter((c) => c.status === 'Active').length;
  const activeProjects = projects.filter((p) => p.status === 'Active').length;
  const outstandingInvoices = invoices.filter((i) => i.status === 'Sent' || i.status === 'Overdue');
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalRevenue = ledger.filter((l) => l.type === 'Income').reduce((sum, l) => sum + l.amount, 0);

  const metrics = [
    { label: 'Active Clients', value: activeClients.toString(), icon: Users, change: `${clients.length} total`, positive: true },
    { label: 'Current Projects', value: activeProjects.toString(), icon: Briefcase, change: `${projects.length} total`, positive: true },
    { label: 'Outstanding Invoices', value: formatCurrency(outstandingTotal), icon: FileText, change: `${outstandingInvoices.length} pending`, positive: false },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, change: 'All-time', positive: true },
  ];

  const recentActivity = ledger.slice(0, 5);
  const recentProjects = projects.slice(0, 4);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <m.icon size={20} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${m.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-light-secondary dark:text-dark-secondary'}`}>
                {m.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {m.change}
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{m.value}</div>
            <div className="text-sm text-light-secondary dark:text-dark-secondary">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Financial Activity */}
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Recent Financial Activity</h2>
            <span className="text-xs text-light-secondary dark:text-dark-secondary">Last 5 entries</span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-sm text-light-secondary dark:text-dark-secondary">No activity yet.</div>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3 border-b border-light-border dark:border-dark-border last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.type === 'Income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                      {entry.type === 'Income' ? (
                        <ArrowDownRight size={16} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpRight size={16} className="text-rose-600 dark:text-rose-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{entry.description || entry.category}</div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary">
                        {entry.category} · {formatDate(entry.date)}
                      </div>
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

        {/* Recent Projects */}
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Project Pipeline</h2>
            <span className="text-xs text-light-secondary dark:text-dark-secondary">{projects.length} total</span>
          </div>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 text-sm text-light-secondary dark:text-dark-secondary">No projects yet.</div>
          ) : (
            <div className="space-y-1">
              {recentProjects.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-light-border dark:border-dark-border last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      {p.status === 'Completed' ? (
                        <CheckCircle2 size={18} className="text-blue-500" />
                      ) : p.status === 'Active' ? (
                        <Circle size={18} className="text-emerald-500" fill="currentColor" fillOpacity={0.2} />
                      ) : p.status === 'Scoping' ? (
                        <Clock size={18} className="text-amber-500" />
                      ) : (
                        <Circle size={18} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary truncate">
                        {p.client_name} · {p.timeline || 'No timeline'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${statusColors[p.status]}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
