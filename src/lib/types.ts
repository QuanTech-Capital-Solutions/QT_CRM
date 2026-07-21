export type ClientStatus = 'Active' | 'Prospect' | 'On Hold';
export type ProjectStatus = 'Scoping' | 'Active' | 'On Hold' | 'Completed';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';
export type LedgerType = 'Income' | 'Expense';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  primary_contact: string;
  email: string;
  phone: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  client_name: string;
  status: ProjectStatus;
  cost_estimate: number;
  timeline: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  project_name: string | null;
  amount: number;
  due_date: string | null;
  invoice_date: string;
  status: InvoiceStatus;
  line_items: LineItem[];
  include_vat: boolean;
  notes: string | null;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  user_id: string;
  type: LedgerType;
  category: string;
  description: string | null;
  amount: number;
  date: string;
  created_at: string;
}

export interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  company_tagline: string | null;
  company_address: string;
  company_phone: string;
  company_email: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_code: string;
  logo_data_url: string | null;
  created_at: string;
}

export const formatCurrency = (amount: number) =>
  `R ${new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

export const formatDate = (dateStr: string) =>
  new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const calcInvoiceTotals = (items: LineItem[], includeVat: boolean) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const vat = includeVat ? subtotal * 0.15 : 0;
  const total = subtotal + vat;
  return { subtotal, vat, total };
};

export interface AdminProfile {
  id: string;
  full_name: string;
  title: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type AccountStatus = 'Active' | 'Paused' | 'Closed';
export type TradeDirection = 'Long' | 'Short';
export type TradeStatus = 'Open' | 'Win' | 'Loss' | 'Breakeven';
export type IctSession = 'Asia' | 'London' | 'New York' | 'London Close';
export type IctSetupType =
  | 'FVG Entry' | 'Order Block' | 'Breaker Block' | 'Liquidity Sweep'
  | 'BOS/CHoCH' | 'Premium/Discount' | 'OB + FVG' | 'Power of Three'
  | 'Judas Swing' | 'Silver Bullet' | 'Turtle Soup' | 'Other';

export const ICT_SETUP_TYPES: IctSetupType[] = [
  'FVG Entry', 'Order Block', 'Breaker Block', 'Liquidity Sweep',
  'BOS/CHoCH', 'Premium/Discount', 'OB + FVG', 'Power of Three',
  'Judas Swing', 'Silver Bullet', 'Turtle Soup', 'Other',
];

export const ICT_SESSIONS: IctSession[] = ['Asia', 'London', 'New York', 'London Close'];

export interface TradingAccount {
  id: string;
  user_id: string;
  name: string;
  broker: string | null;
  account_number: string | null;
  currency: string;
  starting_balance: number;
  current_balance: number;
  is_prop: boolean;
  status: AccountStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  lot_size: number | null;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  pnl: number;
  pnl_pips: number | null;
  r_multiple: number | null;
  entry_date: string | null;
  exit_date: string | null;
  session: IctSession | null;
  htf_bias: string | null;
  entry_reason: string | null;
  setup_type: IctSetupType | null;
  notes: string | null;
  screenshot_url: string | null;
  created_at: string;
}
