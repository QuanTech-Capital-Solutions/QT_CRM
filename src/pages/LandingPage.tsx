import Logo from '../components/fulllogo.png';
import { ThemeToggle } from '../components/ThemeToggle';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
}

export function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-text dark:text-dark-text flex flex-col justify-between p-6">
      {/* Top Header Controls */}
      <header className="flex justify-end max-w-5xl w-full mx-auto">
        <ThemeToggle />
      </header>

      {/* Main Welcome Card */}
      <main className="flex-1 flex items-center justify-center -mt-10">
        <div className="max-w-md w-full text-center space-y-6 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border p-8 md:p-10 rounded-2xl shadow-xl">
          {/* Centered Large Logo */}
          <div className="flex justify-center">
            <img src={Logo} alt="QuanTech logo" className="h-full w-auto" />
          </div>

          {/* Welcome Text */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-light-secondary dark:text-dark-secondary leading-relaxed">
              QuanTech Capital Solutions Portal
            </p>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              onClick={onSignIn}
              className="btn-primary w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <span>Sign In</span>
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-light-secondary dark:text-dark-secondary py-4">
        &copy; {new Date().getFullYear()} QuanTech Capital Solutions
      </footer>
    </div>
  );
}