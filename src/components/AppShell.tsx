import { type ReactNode, useState } from 'react';
import Logo from '../components/logotext.png';
import { ThemeToggle } from './ThemeToggle';
import { LayoutDashboard, Users, Briefcase, CalendarDays, Wallet, LogOut, Shield, LineChart, MoreHorizontal, X } from 'lucide-react';

export type PageId = 'dashboard' | 'clients' | 'projects' | 'schedule' | 'finance' | 'trading' | 'admin';

interface AppShellProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onSignOut: () => void;
  userEmail: string;
  children: ReactNode;
}

const navItems: { id: PageId; label: string; icon: typeof LayoutDashboard; mobile: boolean }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, mobile: true },
  { id: 'clients', label: 'Clients', icon: Users, mobile: true },
  { id: 'projects', label: 'Projects', icon: Briefcase, mobile: true },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays, mobile: true },
  { id: 'finance', label: 'Finance', icon: Wallet, mobile: true },
  { id: 'trading', label: 'Trading', icon: LineChart, mobile: false },
  { id: 'admin', label: 'Admin', icon: Shield, mobile: false },
];

const primaryMobile = navItems.filter((n) => n.mobile);
const overflowMobile = navItems.filter((n) => !n.mobile);

export function AppShell({ currentPage, onNavigate, onSignOut, userEmail, children }: AppShellProps) {
  const initials = userEmail.slice(0, 2).toUpperCase();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleNavigate = (page: PageId) => {
    onNavigate(page);
    setMoreOpen(false);
  };

  const isOverflowActive = overflowMobile.some((n) => n.id === currentPage);

  return (
    <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-text dark:text-dark-text flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card fixed h-screen">
        <div className="h-16 flex items-center px-5 border-b border-light-border dark:border-dark-border">
          <img src={Logo} alt="QuanTech logo" className="h-30 w-auto" />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`sidebar-item w-full text-left ${
                  active
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    : 'text-light-secondary dark:text-dark-secondary hover:bg-light-canvas dark:hover:bg-dark-canvas hover:text-light-text dark:hover:text-dark-text'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{userEmail}</div>
              <div className="text-xs text-light-secondary dark:text-dark-secondary">Administrator</div>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="sidebar-item w-full text-left text-light-secondary dark:text-dark-secondary hover:text-red-500 mt-1"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen w-full min-w-0">
        {/* Mobile header */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-light-border dark:border-dark-border bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-md sticky top-0 z-40">
          <img src={Logo} alt="QuanTech logo" className="h-8 w-auto" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onSignOut}
              className="p-2.5 rounded-lg border border-light-border dark:border-dark-border text-light-secondary dark:text-dark-secondary min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-light-border dark:border-dark-border bg-light-card/60 dark:bg-dark-card/60 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary">
            <span className="font-medium capitalize">{navItems.find((n) => n.id === currentPage)?.label}</span>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8 min-w-0">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-md border-t border-light-border dark:border-dark-border z-50 safe-bottom">
        <div className="flex items-stretch justify-around max-w-lg mx-auto">
          {primaryMobile.map((item) => {
            const active = currentPage === item.id;
            return (
              <TabButton key={item.id} active={active} label={item.label} Icon={item.icon} onClick={() => handleNavigate(item.id)} />
            );
          })}
          <TabButton
            active={isOverflowActive}
            label="More"
            Icon={MoreHorizontal}
            onClick={() => setMoreOpen(true)}
          />
        </div>
      </nav>

      {/* More sheet (mobile overflow nav) */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMoreOpen(false)} />
          <div className="relative w-full bg-light-card dark:bg-dark-card rounded-t-2xl border border-light-border dark:border-dark-border shadow-2xl animate-slide-up safe-bottom">
            <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border">
              <h2 className="text-lg font-bold">More</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-lg hover:bg-light-canvas dark:hover:bg-dark-canvas min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3 grid grid-cols-1 gap-1">
              {overflowMobile.map((item) => {
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`sidebar-item min-h-[48px] ${
                      active
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'text-light-secondary dark:text-dark-secondary hover:bg-light-canvas dark:hover:bg-dark-canvas'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={() => { onSignOut(); setMoreOpen(false); }}
                className="sidebar-item min-h-[48px] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  label,
  Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  Icon: typeof LayoutDashboard;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 min-h-[60px] py-1.5 px-1 transition-colors ${
        active ? 'text-violet-600 dark:text-violet-400' : 'text-light-secondary dark:text-dark-secondary'
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} />
      <span className="text-[10px] font-medium truncate w-full text-center">{label}</span>
    </button>
  );
}
