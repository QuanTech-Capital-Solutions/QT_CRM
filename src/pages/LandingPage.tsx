import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { ArrowRight, TrendingUp, Shield, Layers, Zap, Users, Building2 } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
}

const services = [
  { icon: TrendingUp, title: 'Financial Technology Consulting', desc: 'Strategic guidance on payment systems, lending platforms, and fintech infrastructure for modern capital markets.' },
  { icon: Shield, title: 'Capital Solutions Advisory', desc: 'End-to-end advisory for capital raising, treasury management, and financial structuring tailored to your growth stage.' },
  { icon: Layers, title: 'Project Scoping & Architecture', desc: 'Technical architecture, system design, and project scoping that de-risks complex builds before a single line of code.' },
];

const stats = [
  { value: '40+', label: 'Clients Served' },
  { value: '120+', label: 'Projects Delivered' },
  { value: '8', label: 'Industries Covered' },
  { value: '$200M+', label: 'Capital Structured' },
];

export function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-text dark:text-dark-text">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-light-canvas/80 dark:bg-dark-canvas/80 border-b border-light-border dark:border-dark-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={onSignIn}
              className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20"
            >
              Sign In
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-medium mb-6">
            <Zap size={12} />
            Tech Consultation for Capital Markets
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-balance mb-6">
            Technology that powers{' '}
            <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
              capital solutions
            </span>
          </h1>
          <p className="text-lg text-light-secondary dark:text-dark-secondary leading-relaxed mb-8 max-w-2xl">
            QuanTech Capital Solutions helps financial firms architect, build, and scale the technology
            that runs their capital. From payment rails to risk engines, we turn complex financial
            problems into elegant, shipping software.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onSignIn}
              className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20"
            >
              Sign In to QT
              <ArrowRight size={16} />
            </button>
            <a
              href="#services"
              className="btn-secondary border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-light-card dark:hover:bg-dark-card"
            >
              Explore Services
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <div className="text-3xl md:text-4xl font-bold text-violet-600 dark:text-violet-400 mb-1">
                  {s.value}
                </div>
                <div className="text-sm text-light-secondary dark:text-dark-secondary">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">What we do</h2>
          <p className="text-light-secondary dark:text-dark-secondary max-w-xl">
            Three core practices that help financial firms move from concept to production.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-6 hover:border-violet-500/40 transition-colors duration-200"
            >
              <div className="w-11 h-11 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
                <s.icon size={22} className="text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-light-secondary dark:text-dark-secondary leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-10 md:p-16 text-center">
          <Users size={32} className="text-white/80 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to architect your next financial system?
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Sign in to the QT platform to manage clients, projects, and finances — all in one place.
          </p>
          <button
            onClick={onSignIn}
            className="btn-primary bg-white text-violet-700 hover:bg-white/90 shadow-lg"
          >
            Sign In to QT
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-light-border dark:border-dark-border">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm text-light-secondary dark:text-dark-secondary">
              QuanTech Capital Solutions
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary">
            <Building2 size={14} />
            <span>contact@quantech.io</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
