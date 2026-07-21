import { useMemo } from 'react';
import { BarChart3, TrendingUp, Target, Activity, Award, AlertTriangle } from 'lucide-react';
import type { Trade } from '../../lib/types';
import { calcPortfolioMetrics, formatPnl, formatR } from '../../lib/tradingUtils';

interface AnalyticsProps {
  trades: Trade[];
  accounts: { id: string; name: string }[];
}

interface GroupStat {
  name: string;
  count: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
  avgR: number;
}

function groupStats(trades: Trade[], keyFn: (t: Trade) => string | null | undefined): GroupStat[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades.filter((x) => x.status !== 'Open')) {
    const key = keyFn(t);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return Array.from(groups.entries())
    .map(([name, ts]) => {
      const wins = ts.filter((t) => t.status === 'Win').length;
      const losses = ts.filter((t) => t.status === 'Loss').length;
      const pnl = ts.reduce((s, t) => s + (t.pnl || 0), 0);
      const rs = ts.filter((t) => t.r_multiple != null).map((t) => t.r_multiple!);
      return {
        name,
        count: ts.length,
        wins,
        losses,
        winRate: ts.length > 0 ? (wins / ts.length) * 100 : 0,
        pnl,
        avgR: rs.length > 0 ? rs.reduce((s, r) => s + r, 0) / rs.length : 0,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function TradingAnalytics({ trades }: AnalyticsProps) {
  const m = useMemo(() => calcPortfolioMetrics(trades, []), [trades]);

  const bySetup = useMemo(() => groupStats(trades, (t) => t.setup_type), [trades]);
  const bySession = useMemo(() => groupStats(trades, (t) => t.session), [trades]);
  const bySymbol = useMemo(() => groupStats(trades, (t) => t.symbol), [trades]);

  const maxCount = Math.max(...bySetup.map((s) => s.count), ...bySession.map((s) => s.count), 1);

  if (m.closedTrades === 0) {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Analytics</h1>
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-12 text-center">
          <BarChart3 size={32} className="text-light-secondary dark:text-dark-secondary mx-auto mb-3 opacity-40" />
          <p className="text-sm text-light-secondary dark:text-dark-secondary">No closed trades yet. Analytics will appear once you log trades.</p>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Win Rate', value: `${m.winRate.toFixed(1)}%`, icon: Target, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Profit Factor', value: m.profitFactor === Infinity ? '∞' : m.profitFactor.toFixed(2), icon: Activity, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Avg R', value: formatR(m.avgR), icon: TrendingUp, color: m.avgR >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', bg: m.avgR >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
    { label: 'Total P&L', value: formatPnl(m.totalProfit - m.totalLoss), icon: Award, color: (m.totalProfit - m.totalLoss) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', bg: 'bg-violet-500/10' },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-light-secondary dark:text-dark-secondary mt-1">Performance breakdown by setup, session, and instrument</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon size={15} className={s.color} />
              </div>
              <span className="text-xs text-light-secondary dark:text-dark-secondary">{s.label}</span>
            </div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Setup breakdown */}
      <BreakdownCard title="Performance by Setup Type" stats={bySetup} maxCount={maxCount} />

      {/* Session breakdown */}
      <BreakdownCard title="Performance by Session" stats={bySession} maxCount={maxCount} />

      {/* Symbol breakdown */}
      <BreakdownCard title="Performance by Instrument" stats={bySymbol} maxCount={maxCount} />

      {/* Win/Loss summary */}
      <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
        <h2 className="text-sm font-semibold mb-4">Trade Distribution</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Wins', value: m.wins, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' },
            { label: 'Losses', value: m.losses, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500' },
            { label: 'Breakeven', value: m.breakevens, color: 'text-slate-500', bg: 'bg-slate-400' },
            { label: 'Open', value: m.openTrades, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-light-secondary dark:text-dark-secondary mt-1">{s.label}</div>
              <div className="mt-2 h-1.5 rounded-full bg-light-canvas dark:bg-dark-canvas overflow-hidden">
                <div
                  className={`h-full ${s.bg}`}
                  style={{ width: `${m.totalTrades > 0 ? (s.value / m.totalTrades) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk metrics */}
      <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
        <h2 className="text-sm font-semibold mb-4">Risk & Reward</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Metric label="Avg Win" value={formatPnl(m.avgWin)} positive />
          <Metric label="Avg Loss" value={formatPnl(-m.avgLoss)} negative />
          <Metric label="Best Trade" value={formatPnl(m.bestTrade)} positive />
          <Metric label="Worst Trade" value={formatPnl(m.worstTrade)} negative />
          <Metric label="Total Profit" value={formatPnl(m.totalProfit)} positive />
          <Metric label="Total Loss" value={formatPnl(-m.totalLoss)} negative />
        </div>
      </div>

      {m.currentStreak >= 3 && m.streakType === 'loss' && (
        <div className="card border-rose-500/30 bg-rose-500/5 p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
          <div>
            <span className="text-sm font-semibold">{m.currentStreak} losses in a row</span>
            <span className="text-xs text-light-secondary dark:text-dark-secondary ml-2">Consider stepping back and reviewing your process.</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  const color = positive ? 'text-emerald-600 dark:text-emerald-400' : negative ? 'text-rose-600 dark:text-rose-400' : 'text-light-text dark:text-dark-text';
  return (
    <div>
      <div className="text-xs text-light-secondary dark:text-dark-secondary mb-1">{label}</div>
      <div className={`text-sm font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function BreakdownCard({ title, stats, maxCount }: { title: string; stats: GroupStat[]; maxCount: number }) {
  return (
    <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {stats.length === 0 ? (
        <p className="text-sm text-light-secondary dark:text-dark-secondary">No data available.</p>
      ) : (
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{s.name}</span>
                <div className="flex items-center gap-4 text-xs text-light-secondary dark:text-dark-secondary">
                  <span>{s.count} trades</span>
                  <span className={`font-medium ${s.winRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {s.winRate.toFixed(0)}% WR
                  </span>
                  <span className={`font-semibold ${s.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatPnl(s.pnl)}
                  </span>
                  <span className={`font-medium ${(s.avgR || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatR(s.avgR)}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-light-canvas dark:bg-dark-canvas overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${(s.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
