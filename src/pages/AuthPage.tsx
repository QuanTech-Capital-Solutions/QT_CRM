import { useState } from 'react';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthPageProps {
  onBack: () => void;
}

export function AuthPage({ onBack }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-text dark:text-dark-text flex flex-col">
      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary hover:text-light-text dark:hover:text-dark-text transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <ThemeToggle />
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-light-secondary dark:text-dark-secondary">
              {mode === 'signin' ? 'Sign in to your QT workspace' : 'Start managing your CRM with QT'}
            </p>
          </div>

	{!isSupabaseConfigured && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-600 	dark:text-rose-400">
              <strong>Supabase not configured.</strong> Set <code>VITE_SUPABASE_URL</code> and <code>	VITE_SUPABASE_ANON_KEY</code> in your deployment environment, then redeploy.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-secondary dark:text-dark-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@quantech.io"
                  className="input-field bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border text-light-text dark:text-dark-text placeholder:text-light-secondary dark:placeholder:text-dark-secondary focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-secondary dark:text-dark-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border text-light-text dark:text-dark-text placeholder:text-light-secondary dark:placeholder:text-dark-secondary focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-light-secondary dark:text-dark-secondary hover:text-light-text dark:hover:text-dark-text transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signin' && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20 disabled:opacity-60"
            >
              {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
              className="text-sm text-light-secondary dark:text-dark-secondary hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <span className="text-violet-600 dark:text-violet-400 font-medium">
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </span>
            </button>
          </div>

          <p className="text-center text-xs text-light-secondary dark:text-dark-secondary mt-6">
            QuanTech Capital Solutions — Internal Platform
          </p>
        </div>
      </div>
    </div>
  );
}
