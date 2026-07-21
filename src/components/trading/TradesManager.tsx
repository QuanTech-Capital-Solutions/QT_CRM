import { useState, useMemo } from 'react';
import { Plus, X, Pencil, Trash2, ArrowUpRight, ArrowDownRight, Filter, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  type Trade, type TradingAccount, type TradeDirection, type TradeStatus,
  type IctSession, type IctSetupType,
  ICT_SETUP_TYPES, ICT_SESSIONS,
} from '../../lib/types';
import { formatPnlShort, formatR } from '../../lib/tradingUtils';

interface TradesManagerProps {
  trades: Trade[];
  accounts: TradingAccount[];
  onRefresh: () => void;
  selectedAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
}

const statusColors: Record<TradeStatus, string> = {
  Open: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Win: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Loss: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  Breakeven: 'bg-slate-500/10 text-slate-500',
};

export function TradesManager({ trades, accounts, onRefresh, selectedAccountId, onSelectAccount }: TradesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Trade | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TradeStatus | 'All'>('All');
  const [filterSetup, setFilterSetup] = useState<IctSetupType | 'All'>('All');

  const accountMap = useMemo(() => {
    const map = new Map<string, TradingAccount>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const filtered = trades
    .filter((t) => selectedAccountId ? t.account_id === selectedAccountId : true)
    .filter((t) => filterStatus === 'All' ? true : t.status === filterStatus)
    .filter((t) => filterSetup === 'All' ? true : t.setup_type === filterSetup)
    .filter((t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (t.entry_reason || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.notes || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.entry_date || b.created_at).getTime() - new Date(a.entry_date || a.created_at).getTime());

  const handleSave = async (data: Record<string, string | null>) => {
    setSubmitting(true);
    const payload = {
      account_id: data.account_id as string,
      symbol: (data.symbol as string).toUpperCase(),
      direction: data.direction as TradeDirection,
      status: data.status as TradeStatus,
      lot_size: data.lot_size ? Number(data.lot_size) : null,
      entry_price: data.entry_price ? Number(data.entry_price) : null,
      exit_price: data.exit_price ? Number(data.exit_price) : null,
      stop_loss: data.stop_loss ? Number(data.stop_loss) : null,
      take_profit: data.take_profit ? Number(data.take_profit) : null,
      pnl: data.pnl ? Number(data.pnl) : 0,
      pnl_pips: data.pnl_pips ? Number(data.pnl_pips) : null,
      r_multiple: data.r_multiple ? Number(data.r_multiple) : null,
      entry_date: (data.entry_date as string) || null,
      exit_date: (data.exit_date as string) || null,
      session: data.session || null,
      htf_bias: data.htf_bias || null,
      entry_reason: data.entry_reason || null,
      setup_type: data.setup_type || null,
      notes: data.notes || null,
    };
    if (editing) {
      const { error } = await supabase.from('trades').update(payload).eq('id', editing.id);
      setSubmitting(false);
      if (!error) { setShowForm(false); setEditing(null); onRefresh(); }
    } else {
      const { error } = await supabase.from('trades').insert(payload);
      setSubmitting(false);
      if (!error) { setShowForm(false); onRefresh(); }
    }
  };

  const handleDelete = async (trade: Trade) => {
    const { error } = await supabase.from('trades').delete().eq('id', trade.id);
    if (!error) { setConfirmDelete(null); onRefresh(); }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trades</h1>
          <p className="text-sm text-light-secondary dark:text-dark-secondary mt-1">
            {filtered.length} trades{selectedAccountId ? ` in ${accountMap.get(selectedAccountId)?.name}` : ''}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          disabled={accounts.length === 0}
          className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20 disabled:opacity-50"
        >
          <Plus size={16} />
          Log Trade
        </button>
      </div>

      {selectedAccountId && (
        <button
          onClick={() => onSelectAccount(null)}
          className="mb-4 text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          ← Show all trades
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-secondary dark:text-dark-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by symbol, reason, or notes..."
            className="input-field bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TradeStatus | 'All')}
          className="input-field bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border sm:w-36"
        >
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="Win">Win</option>
          <option value="Loss">Loss</option>
          <option value="Breakeven">Breakeven</option>
        </select>
        <select
          value={filterSetup}
          onChange={(e) => setFilterSetup(e.target.value as IctSetupType | 'All')}
          className="input-field bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border sm:w-44"
        >
          <option value="All">All Setups</option>
          {ICT_SETUP_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-12 text-center">
          <Filter size={32} className="text-light-secondary dark:text-dark-secondary mx-auto mb-3 opacity-40" />
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            {trades.length === 0 ? 'No trades logged yet. Click "Log Trade" to start.' : 'No trades match your filters.'}
          </p>
        </div>
      ) : (
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Symbol</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden md:table-cell">Account</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Dir</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden lg:table-cell">Setup</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden sm:table-cell">Session</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden xl:table-cell">Entry</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden xl:table-cell">Exit</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary hidden lg:table-cell">R</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">P&L</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-light-secondary dark:text-dark-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const acct = accountMap.get(t.account_id);
                  return (
                    <tr key={t.id} className="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold">{t.symbol}</div>
                        {t.entry_date && (
                          <div className="text-xs text-light-secondary dark:text-dark-secondary">{new Date(t.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell text-light-secondary dark:text-dark-secondary">{acct?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1 text-xs font-medium ${t.direction === 'Long' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {t.direction === 'Long' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {t.direction}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs hidden lg:table-cell text-light-secondary dark:text-dark-secondary">{t.setup_type || '—'}</td>
                      <td className="px-4 py-3 text-xs hidden sm:table-cell text-light-secondary dark:text-dark-secondary">{t.session || '—'}</td>
                      <td className="px-4 py-3 text-sm hidden xl:table-cell text-light-secondary dark:text-dark-secondary">{t.entry_price ?? '—'}</td>
                      <td className="px-4 py-3 text-sm hidden xl:table-cell text-light-secondary dark:text-dark-secondary">{t.exit_price ?? '—'}</td>
                      <td className={`px-4 py-3 text-sm font-medium hidden lg:table-cell ${(t.r_multiple || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatR(t.r_multiple)}
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold ${t.status === 'Open' ? 'text-light-secondary dark:text-dark-secondary' : (t.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}`}>
                        {t.status === 'Open' ? '—' : formatPnlShort(t.pnl)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[t.status]}`}>{t.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditing(t); setShowForm(true); }}
                            className="p-1.5 rounded-lg text-light-secondary dark:text-dark-secondary hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/5 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(t)}
                            className="p-1.5 rounded-lg text-light-secondary dark:text-dark-secondary hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <TradeForm
          trade={editing}
          accounts={accounts}
          defaultAccountId={selectedAccountId}
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
              <h2 className="text-lg font-bold">Delete Trade</h2>
            </div>
            <p className="text-sm text-light-secondary dark:text-dark-secondary mb-6">
              Delete <strong className="text-light-text dark:text-dark-text">{confirmDelete.symbol} {confirmDelete.direction}</strong>? This cannot be undone.
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

const symbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'AUDUSD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'NAS100', 'US30', 'SPX500', 'BTCUSD', 'ETHUSD', 'WTI'];

function TradeForm({ trade, accounts, defaultAccountId, onClose, onSave, submitting }: {
  trade: Trade | null;
  accounts: TradingAccount[];
  defaultAccountId: string | null;
  onClose: () => void;
  onSave: (data: Record<string, string | null>) => void;
  submitting: boolean;
}) {
  const toLocalInput = (iso: string | null | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    account_id: trade?.account_id ?? defaultAccountId ?? accounts[0]?.id ?? '',
    symbol: trade?.symbol ?? '',
    direction: trade?.direction ?? 'Long' as TradeDirection,
    status: trade?.status ?? 'Open' as TradeStatus,
    lot_size: trade?.lot_size?.toString() ?? '',
    entry_price: trade?.entry_price?.toString() ?? '',
    exit_price: trade?.exit_price?.toString() ?? '',
    stop_loss: trade?.stop_loss?.toString() ?? '',
    take_profit: trade?.take_profit?.toString() ?? '',
    pnl: trade?.pnl?.toString() ?? '',
    pnl_pips: trade?.pnl_pips?.toString() ?? '',
    r_multiple: trade?.r_multiple?.toString() ?? '',
    entry_date: toLocalInput(trade?.entry_date),
    exit_date: toLocalInput(trade?.exit_date),
    session: trade?.session ?? '' as IctSession | '',
    htf_bias: trade?.htf_bias ?? '',
    entry_reason: trade?.entry_reason ?? '',
    setup_type: trade?.setup_type ?? '' as IctSetupType | '',
    notes: trade?.notes ?? '',
  });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const inputCls = 'input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border text-sm';
  const labelCls = 'block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5';

  const [sectionIct, setSectionIct] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-light-card dark:bg-dark-card border-l border-light-border dark:border-dark-border h-full overflow-y-auto animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border sticky top-0 bg-light-card dark:bg-dark-card z-10">
          <h2 className="text-lg font-bold">{trade ? 'Edit Trade' : 'Log Trade'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors">
            <X size={18} />
          </button>
        </div>
        <form className="p-6 space-y-5" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
          {/* Core fields */}
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Account</label>
              <select className={inputCls} required value={form.account_id} onChange={(e) => set('account_id', e.target.value)}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Symbol</label>
                <input className={inputCls} required list="symbols" value={form.symbol} onChange={(e) => set('symbol', e.target.value)} placeholder="XAUUSD" />
                <datalist id="symbols">
                  {symbols.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Direction</label>
                <select className={inputCls} value={form.direction} onChange={(e) => set('direction', e.target.value)}>
                  <option>Long</option>
                  <option>Short</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option>Open</option>
                  <option>Win</option>
                  <option>Loss</option>
                  <option>Breakeven</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Lot Size</label>
                <input type="number" step="0.01" className={inputCls} value={form.lot_size} onChange={(e) => set('lot_size', e.target.value)} placeholder="0.50" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Entry</label>
                <input type="number" step="any" className={inputCls} value={form.entry_price} onChange={(e) => set('entry_price', e.target.value)} placeholder="2045.50" />
              </div>
              <div>
                <label className={labelCls}>Stop Loss</label>
                <input type="number" step="any" className={inputCls} value={form.stop_loss} onChange={(e) => set('stop_loss', e.target.value)} placeholder="2040.00" />
              </div>
              <div>
                <label className={labelCls}>Take Profit</label>
                <input type="number" step="any" className={inputCls} value={form.take_profit} onChange={(e) => set('take_profit', e.target.value)} placeholder="2060.00" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Exit Price</label>
              <input type="number" step="any" className={inputCls} value={form.exit_price} onChange={(e) => set('exit_price', e.target.value)} placeholder="Leave empty if still open" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Entry Date/Time</label>
                <input type="datetime-local" className={inputCls} value={form.entry_date} onChange={(e) => set('entry_date', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Exit Date/Time</label>
                <input type="datetime-local" className={inputCls} value={form.exit_date} onChange={(e) => set('exit_date', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="border-t border-light-border dark:border-dark-border pt-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-light-secondary dark:text-dark-secondary">Results</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>P&L ($)</label>
                <input type="number" step="0.01" className={inputCls} value={form.pnl} onChange={(e) => set('pnl', e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Pips</label>
                <input type="number" step="0.1" className={inputCls} value={form.pnl_pips} onChange={(e) => set('pnl_pips', e.target.value)} placeholder="0.0" />
              </div>
              <div>
                <label className={labelCls}>R Multiple</label>
                <input type="number" step="0.01" className={inputCls} value={form.r_multiple} onChange={(e) => set('r_multiple', e.target.value)} placeholder="2.00" />
              </div>
            </div>
          </div>

          {/* ICT SMC fields */}
          <div className="border-t border-light-border dark:border-dark-border pt-4 space-y-4">
            <button
              type="button"
              onClick={() => setSectionIct(!sectionIct)}
              className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-widest text-light-secondary dark:text-dark-secondary"
            >
              ICT Smart Money Concepts
              <span className="text-light-secondary dark:text-dark-secondary">{sectionIct ? '−' : '+'}</span>
            </button>
            {sectionIct && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Session</label>
                    <select className={inputCls} value={form.session} onChange={(e) => set('session', e.target.value)}>
                      <option value="">Select...</option>
                      {ICT_SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Setup Type</label>
                    <select className={inputCls} value={form.setup_type} onChange={(e) => set('setup_type', e.target.value)}>
                      <option value="">Select setup...</option>
                      {ICT_SETUP_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>HTF Bias / POI</label>
                  <input className={inputCls} value={form.htf_bias} onChange={(e) => set('htf_bias', e.target.value)} placeholder="Bullish H1 OB + FVG, D1 BOS" />
                </div>
                <div>
                  <label className={labelCls}>Entry Reason</label>
                  <textarea rows={2} className={`${inputCls} resize-none`} value={form.entry_reason} onChange={(e) => set('entry_reason', e.target.value)} placeholder="Why did you take this trade? What was your confluence?" />
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          <div className="border-t border-light-border dark:border-dark-border pt-4">
            <label className={labelCls}>Review Notes</label>
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Post-trade review: what went well, what to improve..." />
          </div>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-light-card dark:bg-dark-card -mx-6 px-6 py-4 border-t border-light-border dark:border-dark-border">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center border-light-border dark:border-dark-border">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'Saving...' : trade ? 'Save Changes' : 'Log Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
