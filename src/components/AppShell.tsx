import { type ReactNode } from 'react';
import Logo from "./logotext.png";
import { ThemeToggle } from './ThemeToggle';
import { LayoutDashboard, Users, Briefcase, Wallet, LogOut, Shield, LineChart } from 'lucide-react';

export type PageId = 'dashboard' | 'clients' | 'projects' | 'finance' | 'trading' | 'admin';

interface AppShellProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onSignOut: () => void;
  userEmail: string;
  children: ReactNode;
}

const navItems: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'projects', label: 'Projects', icon: Briefcase },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'trading', label: 'Trading', icon: LineChart },
  { id: 'admin', label: 'Admin', icon: Shield },
];

export function AppShell({ currentPage, onNavigate, onSignOut, userEmail, children }: AppShellProps) {
  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-text dark:text-dark-text flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card fixed h-screen">
        <div className="h-16 flex items-center px-5 border-b border-light-border dark:border-dark-border">
          <img src={Logo} alt="Logo" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
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
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-light-border dark:border-dark-border bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-md sticky top-0 z-40">
          <img src={Logo} alt="QuanTech logo" className="h-20 w-auto" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg border border-light-border dark:border-dark-border text-light-secondary dark:text-dark-secondary"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-light-border dark:border-dark-border bg-light-card/60 dark:bg-dark-card/60 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary">
            {/*<Menu size={16} />   - Removed cause it doesnt look neat*/}
            <span className="font-medium capitalize">{navItems.find((n) => n.id === currentPage)?.label}</span>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-light-card/90 dark:bg-dark-card/90 backdrop-blur-md border-t border-light-border dark:border-dark-border flex items-center justify-around z-50">
        {navItems.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                active ? 'text-violet-600 dark:text-violet-400' : 'text-light-secondary dark:text-dark-secondary'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
