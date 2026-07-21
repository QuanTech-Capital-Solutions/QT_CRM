import { useState } from 'react';
import { Plus, X, Wallet, Pencil, Trash2, Building2, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency, type TradingAccount, type AccountStatus } from '../../lib/types';
import { calcAccountMetrics, formatPct } from '../../lib/tradingUtils';
import type { Trade } from '../../lib/types';

interface AccountsManagerProps {
  accounts: TradingAccount[];
  trades: Trade[];
  onRefresh: () => void;
  selectedAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
}

const statusColors: Record<AccountStatus, string> = {
  Active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Paused: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Closed: 'bg-slate-500/10 text-slate-500',
};

export function AccountsManager({ accounts, trades, onRefresh, selectedAccountId, onSelectAccount }: AccountsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TradingAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TradingAccount | null>(null);

  const handleSave = async (data: Record<string, string | boolean>) => {
    setSubmitting(true);
    const payload = {
      name: data.name as string,
      broker: (data.broker as string) || null,
      account_number: (data.account_number as string) || null,
      currency: (data.currency as string) || 'USD',
      starting_balance: Number(data.starting_balance) || 0,
      current_balance: Number(data.current_balance) || 0,
      is_prop: !!data.is_prop,
      status: (data.status as AccountStatus) || 'Active',
      notes: (data.notes as string) || null,
    };
    if (editing) {
      const { error } = await supabase.from('trading_accounts').update(payload).eq('id', editing.id);
      setSubmitting(false);
      if (!error) { setShowForm(false); setEditing(null); onRefresh(); }
    } else {
      const { error } = await supabase.from('trading_accounts').insert(payload);
      setSubmitting(false);
      if (!error) { setShowForm(false); onRefresh(); }
    }
  };

  const handleDelete = async (account: TradingAccount) => {
    const { error } = await supabase.from('trading_accounts').delete().eq('id', account.id);
    if (!error) {
      setConfirmDelete(null);
      if (selectedAccountId === account.id) onSelectAccount(null);
      onRefresh();
    }
  };

  const filteredAccounts = selectedAccountId
    ? accounts.filter((a) => a.id === selectedAccountId)
    : accounts;

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Accounts</h1>
          <p className="text-sm text-light-secondary dark:text-dark-secondary mt-1">
            {accounts.length} accounts · {accounts.filter((a) => a.is_prop).length} prop firm
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20"
        >
          <Plus size={16} />
          New Account
        </button>
      </div>

      {selectedAccountId && (
        <button
          onClick={() => onSelectAccount(null)}
          className="mb-4 text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          ← Show all accounts
        </button>
      )}

      {accounts.length === 0 ? (
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-12 text-center">
          <Wallet size={32} className="text-light-secondary dark:text-dark-secondary mx-auto mb-3 opacity-40" />
          <p className="text-sm text-light-secondary dark:text-dark-secondary mb-4">No trading accounts yet.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary bg-violet-600 text-white hover:bg-violet-700 mx-auto">
            <Plus size={15} />
            Create your first account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acct) => {
            const am = calcAccountMetrics(acct, trades);
            return (
              <div
                key={acct.id}
                className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5 hover:border-violet-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${acct.is_prop ? 'bg-amber-500/10' : 'bg-violet-500/10'}`}>
                      <Wallet size={20} className={acct.is_prop ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{acct.name}</div>
                      {acct.is_prop && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Prop Firm</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[acct.status]}`}>
                    {acct.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <div className="text-xs text-light-secondary dark:text-dark-secondary">Current Balance</div>
                    <div className="text-2xl font-bold">{formatCurrency(acct.current_balance)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-light-border dark:border-dark-border">
                    <div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary">P&L</div>
                      <div className={`text-sm font-semibold ${am.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatPct(am.pnlPct)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary">Win Rate</div>
                      <div className="text-sm font-semibold">{am.winRate.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary">Trades</div>
                      <div className="text-sm font-semibold">{am.tradeCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-light-secondary dark:text-dark-secondary">Open</div>
                      <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">{am.openCount}</div>
                    </div>
                  </div>
                </div>

                {acct.broker && (
                  <div className="flex items-center gap-1.5 text-xs text-light-secondary dark:text-dark-secondary mb-3">
                    <Building2 size={12} />
                    {acct.broker}{acct.account_number ? ` · #${acct.account_number}` : ''}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-light-border dark:border-dark-border">
                  <button
                    onClick={() => onSelectAccount(acct.id)}
                    className="flex-1 btn-secondary justify-center text-xs border-light-border dark:border-dark-border hover:bg-light-canvas dark:hover:bg-dark-canvas"
                  >
                    <TrendingUp size={13} />
                    View Trades
                  </button>
                  <button
                    onClick={() => { setEditing(acct); setShowForm(true); }}
                    className="p-2 rounded-lg text-light-secondary dark:text-dark-secondary hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/5 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(acct)}
                    className="p-2 rounded-lg text-light-secondary dark:text-dark-secondary hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <AccountForm
          account={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
          submitting={submitting}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-sm bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="text-lg font-bold">Delete Account</h2>
            </div>
            <p className="text-sm text-light-secondary dark:text-dark-secondary mb-6">
              Delete <strong className="text-light-text dark:text-dark-text">{confirmDelete.name}</strong>? All trades in this account will also be deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="btn-primary flex-1 justify-center bg-rose-600 text-white hover:bg-rose-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const currencies = ['USD', 'ZAR', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

function AccountForm({ account, onClose, onSave, submitting }: {
  account: TradingAccount | null;
  onClose: () => void;
  onSave: (data: Record<string, string | boolean>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    name: account?.name ?? '',
    broker: account?.broker ?? '',
    account_number: account?.account_number ?? '',
    currency: account?.currency ?? 'USD',
    starting_balance: account?.starting_balance?.toString() ?? '',
    current_balance: account?.current_balance?.toString() ?? '',
    is_prop: account?.is_prop ?? false,
    status: account?.status ?? 'Active' as AccountStatus,
    notes: account?.notes ?? '',
  });

  const set = (field: string, value: string | boolean) => setForm((f) => ({ ...f, [field]: value }));
  const inputCls = 'input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border';
  const labelCls = 'block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-light-card dark:bg-dark-card border-l border-light-border dark:border-dark-border h-full overflow-y-auto animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border sticky top-0 bg-light-card dark:bg-dark-card">
          <h2 className="text-lg font-bold">{account ? 'Edit Account' : 'New Account'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors">
            <X size={18} />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
          <div>
            <label className={labelCls}>Account Name</label>
            <input className={inputCls} required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="FTMO Challenge 100K" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Broker</label>
              <input className={inputCls} value={form.broker} onChange={(e) => set('broker', e.target.value)} placeholder="IC Markets" />
            </div>
            <div>
              <label className={labelCls}>Account #</label>
              <input className={inputCls} value={form.account_number} onChange={(e) => set('account_number', e.target.value)} placeholder="12345678" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Currency</label>
              <select className={inputCls} value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                {currencies.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value as AccountStatus)}>
                <option>Active</option>
                <option>Paused</option>
                <option>Closed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Starting Balance</label>
              <input type="number" step="0.01" className={inputCls} value={form.starting_balance} onChange={(e) => set('starting_balance', e.target.value)} placeholder="100000" />
            </div>
            <div>
              <label className={labelCls}>Current Balance</label>
              <input type="number" step="0.01" className={inputCls} value={form.current_balance} onChange={(e) => set('current_balance', e.target.value)} placeholder="100000" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_prop} onChange={(e) => set('is_prop', e.target.checked)} className="w-4 h-4 rounded border-light-border dark:border-dark-border text-violet-600 focus:ring-violet-500/20" />
              <span className="text-sm">Prop firm account</span>
            </label>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Account rules, drawdown limits, etc." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'Saving...' : account ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
