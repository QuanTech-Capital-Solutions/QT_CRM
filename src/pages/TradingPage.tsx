import { useEffect, useState, useCallback } from 'react';
import { LineChart, Wallet, ListChecks, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Trade, type TradingAccount } from '../lib/types';
import { TradingDashboard } from '../components/trading/TradingDashboard';
import { AccountsManager } from '../components/trading/AccountsManager';
import { TradesManager } from '../components/trading/TradesManager';
import { TradingAnalytics } from '../components/trading/TradingAnalytics';

type Tab = 'dashboard' | 'accounts' | 'trades' | 'analytics';

export function TradingPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: acctData }, { data: tradeData }] = await Promise.all([
      supabase.from('trading_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('trades').select('*').order('entry_date', { ascending: false, nullsFirst: false }),
    ]);
    setAccounts(acctData ?? []);
    setTrades(tradeData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectAccount = (id: string | null) => {
    setSelectedAccountId(id);
    setTab(id ? 'trades' : 'accounts');
  };

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LineChart },
    { id: 'accounts' as Tab, label: 'Accounts', icon: Wallet },
    { id: 'trades' as Tab, label: 'Trades', icon: ListChecks },
    { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3 },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-light-secondary dark:text-dark-secondary">Loading trading data...</div>;
  }

  return (
    <div>
      {/* Module header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <LineChart size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Module</h1>
        </div>
        <p className="text-sm text-light-secondary dark:text-dark-secondary">ICT Smart Money Concepts strategy tracker</p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-6 border-b border-light-border dark:border-dark-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-light-secondary dark:text-dark-secondary hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <TradingDashboard
          accounts={accounts}
          trades={trades}
          onSelectAccount={handleSelectAccount}
          onGoToTrades={() => setTab('trades')}
        />
      )}
      {tab === 'accounts' && (
        <AccountsManager
          accounts={accounts}
          trades={trades}
          onRefresh={fetchData}
          selectedAccountId={selectedAccountId}
          onSelectAccount={handleSelectAccount}
        />
      )}
      {tab === 'trades' && (
        <TradesManager
          trades={trades}
          accounts={accounts}
          onRefresh={fetchData}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
        />
      )}
      {tab === 'analytics' && (
        <TradingAnalytics trades={trades} accounts={accounts} />
      )}
    </div>
  );
}
