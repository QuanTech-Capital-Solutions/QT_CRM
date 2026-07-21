import type { Trade, TradingAccount } from '../lib/types';

export interface PortfolioMetrics {
  totalBalance: number;
  totalStarting: number;
  totalPnl: number;
  totalPnlPct: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  avgR: number;
  bestTrade: number;
  worstTrade: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';
}

export function calcPortfolioMetrics(trades: Trade[], accounts: TradingAccount[]): PortfolioMetrics {
  const totalBalance = accounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  const totalStarting = accounts.reduce((s, a) => s + (a.starting_balance || 0), 0);
  const totalPnl = totalBalance - totalStarting;
  const totalPnlPct = totalStarting > 0 ? (totalPnl / totalStarting) * 100 : 0;

  const closed = trades.filter((t) => t.status !== 'Open');
  const open = trades.filter((t) => t.status === 'Open');
  const wins = closed.filter((t) => t.status === 'Win');
  const losses = closed.filter((t) => t.status === 'Loss');
  const breakevens = closed.filter((t) => t.status === 'Breakeven');

  const totalProfit = wins.reduce((s, t) => s + (t.pnl || 0), 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0));
  const avgWin = wins.length > 0 ? totalProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

  const rValues = closed.filter((t) => t.r_multiple != null).map((t) => t.r_multiple!);
  const avgR = rValues.length > 0 ? rValues.reduce((s, r) => s + r, 0) / rValues.length : 0;

  const pnls = closed.map((t) => t.pnl || 0);
  const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
  const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;

  const sorted = [...closed].sort((a, b) => {
    const da = new Date(a.exit_date || a.created_at).getTime();
    const db = new Date(b.exit_date || b.created_at).getTime();
    return db - da;
  });

  let streak = 0;
  let streakType: 'win' | 'loss' | 'none' = 'none';
  for (const t of sorted) {
    if (t.status === 'Win') {
      if (streakType === 'win') streak++;
      else { streak = 1; streakType = 'win'; }
    } else if (t.status === 'Loss') {
      if (streakType === 'loss') streak++;
      else { streak = 1; streakType = 'loss'; }
    }
  }

  return {
    totalBalance,
    totalStarting,
    totalPnl,
    totalPnlPct,
    totalTrades: trades.length,
    openTrades: open.length,
    closedTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    totalProfit,
    totalLoss,
    avgWin,
    avgLoss,
    profitFactor,
    avgR,
    bestTrade,
    worstTrade,
    currentStreak: streak,
    streakType,
  };
}

export interface AccountMetrics {
  pnl: number;
  pnlPct: number;
  tradeCount: number;
  openCount: number;
  winRate: number;
  wins: number;
  losses: number;
}

export function calcAccountMetrics(account: TradingAccount, trades: Trade[]): AccountMetrics {
  const acctTrades = trades.filter((t) => t.account_id === account.id);
  const closed = acctTrades.filter((t) => t.status !== 'Open');
  const wins = closed.filter((t) => t.status === 'Win');
  const losses = closed.filter((t) => t.status === 'Loss');
  const pnl = (account.current_balance || 0) - (account.starting_balance || 0);
  const pnlPct = account.starting_balance > 0 ? (pnl / account.starting_balance) * 100 : 0;

  return {
    pnl,
    pnlPct,
    tradeCount: acctTrades.length,
    openCount: acctTrades.filter((t) => t.status === 'Open').length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    wins: wins.length,
    losses: losses.length,
  };
}

export function formatPnl(value: number, currency = 'USD'): string {
  const symbol = currency === 'ZAR' ? 'R' : '$';
  return `${value >= 0 ? '+' : ''}${symbol}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPnlShort(value: number, currency = 'USD'): string {
  const symbol = currency === 'ZAR' ? 'R' : '$';
  const abs = Math.abs(value);
  const formatted = abs >= 1000 ? abs.toLocaleString('en-US', { maximumFractionDigits: 0 }) : abs.toFixed(2);
  return `${value >= 0 ? '+' : '-'}${symbol}${formatted}`;
}

export function formatR(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}R`;
}

export function formatPips(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}p`;
}

export function formatPct(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}
