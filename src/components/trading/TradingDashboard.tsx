import { TrendingUp, TrendingDown, Wallet, Target, Award, Flame, ArrowUpRight, ArrowDownRight, Activity, Zap } from 'lucide-react';
import type { Trade, TradingAccount } from '../../lib/types';
import { calcPortfolioMetrics, calcAccountMetrics, formatPnl, formatPnlShort, formatPct, formatR } from '../../lib/tradingUtils';
import { formatCurrency } from '../../lib/types';

interface DashboardProps {
  accounts: TradingAccount[];
  trades: Trade[];
  onSelectAccount: (id: string) => void;
  onGoToTrades: () => void;
}

export function TradingDashboard({ accounts, trades, onSelectAccount, onGoToTrades }: DashboardProps) {
  const m = calcPortfolioMetrics(trades, accounts);

  const statCards = [
    {
      label: 'Total Portfolio Balance',
      value: formatCurrency(m.totalBalance),
      sub: `${formatPct(m.totalPnlPct)} all-time`,
      icon: Wallet,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
      valueColor: m.totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Net P&L',
      value: formatPnl(m.totalPnl),
      sub: `${m.closedTrades} closed trades`,
      icon: m.totalPnl >= 0 ? TrendingUp : TrendingDown,
      iconBg: m.totalPnl >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10',
      iconColor: m.totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      valueColor: m.totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Win Rate',
      value: `${m.winRate.toFixed(1)}%`,
      sub: `${m.wins}W / ${m.losses}L / ${m.breakevens}BE`,
      icon: Target,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      valueColor: 'text-light-text dark:text-dark-text',
    },
    {
      label: 'Profit Factor',
      value: m.profitFactor === Infinity ? '∞' : m.profitFactor.toFixed(2),
      sub: `Avg ${formatR(m.avgR)}`,
      icon: Activity,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      valueColor: 'text-light-text dark:text-dark-text',
    },
  ];

  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.entry_date || b.created_at).getTime() - new Date(a.entry_date || a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-6xl space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                <s.icon size={18} className={s.iconColor} />
              </div>
              <span className="text-xs text-light-secondary dark:text-dark-secondary">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold ${s.valueColor}`}>{s.value}</div>
            <div className="text-xs text-light-secondary dark:text-dark-secondary mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Trades', value: m.openTrades, icon: Zap, cls: 'text-blue-600 dark:text-blue-400' },
          { label: 'Avg Win', value: formatPnlShort(m.avgWin), icon: ArrowUpRight, cls: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Avg Loss', value: formatPnlShort(m.avgLoss), icon: ArrowDownRight, cls: 'text-rose-600 dark:text-rose-400' },
          { label: 'Best Trade', value: formatPnlShort(m.bestTrade), icon: Award, cls: 'text-emerald-600 dark:text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon size={14} className={s.cls} />
              <span className="text-xs text-light-secondary dark:text-dark-secondary">{s.label}</span>
            </div>
            <div className={`text-lg font-bold ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Streak banner */}
      {m.currentStreak > 0 && (
        <div className={`card p-4 flex items-center gap-3 ${m.streakType === 'win' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
          <Flame size={20} className={m.streakType === 'win' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} />
          <div>
            <span className="text-sm font-semibold">
              {m.currentStreak} trade {m.streakType} streak
            </span>
            <span className="text-xs text-light-secondary dark:text-dark-secondary ml-2">
              {m.streakType === 'win' ? 'Keep it going!' : 'Review your process.'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts overview */}
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Managed Accounts</h2>
            <span className="text-xs text-light-secondary dark:text-dark-secondary">{accounts.length} accounts</span>
          </div>
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-sm text-light-secondary dark:text-dark-secondary">
                <Wallet size={28} className="mx-auto mb-2 opacity-40" />
                No accounts yet. Add one to start tracking.
              </div>
            ) : accounts.map((acct) => {
              const am = calcAccountMetrics(acct, trades);
              return (
                <button
                  key={acct.id}
                  onClick={() => onSelectAccount(acct.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-light-canvas dark:bg-dark-canvas border border-light-border dark:border-dark-border hover:border-violet-500/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${acct.is_prop ? 'bg-amber-500/10' : 'bg-violet-500/10'}`}>
                      <Wallet size={16} className={acct.is_prop ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{acct.name}</div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary">
                        {acct.broker || 'No broker'} · {am.tradeCount} trades · {am.openCount} open
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold">{formatCurrency(acct.current_balance)}</div>
                    <div className={`text-xs font-medium ${am.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatPct(am.pnlPct)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent trades */}
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent Trades</h2>
            <button onClick={onGoToTrades} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {recentTrades.length === 0 ? (
              <div className="text-center py-8 text-sm text-light-secondary dark:text-dark-secondary">
                <Activity size={28} className="mx-auto mb-2 opacity-40" />
                No trades yet.
              </div>
            ) : recentTrades.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-light-canvas dark:bg-dark-canvas border border-light-border dark:border-dark-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                    t.direction === 'Long' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                  }`}>
                    {t.direction === 'Long'
                      ? <ArrowUpRight size={14} className="text-emerald-600 dark:text-emerald-400" />
                      : <ArrowDownRight size={14} className="text-rose-600 dark:text-rose-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.symbol}</div>
                    <div className="text-xs text-light-secondary dark:text-dark-secondary">
                      {t.setup_type || 'No setup'} · {t.session || 'No session'}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {t.status === 'Open' ? (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Open</span>
                  ) : (
                    <div className={`text-sm font-semibold ${t.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatPnlShort(t.pnl)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
