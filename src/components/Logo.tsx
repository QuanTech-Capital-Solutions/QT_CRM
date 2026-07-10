import { Hexagon } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = {
    sm: { box: 'w-7 h-7', icon: 16, text: 'text-base' },
    md: { box: 'w-9 h-9', icon: 20, text: 'text-lg' },
    lg: { box: 'w-12 h-12', icon: 28, text: 'text-2xl' },
  };
  const d = dimensions[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${d.box} rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20`}>
        <Hexagon size={d.icon} className="text-white" fill="white" fillOpacity={0.15} />
      </div>
      <span className={`${d.text} font-bold tracking-tight text-light-text dark:text-dark-text`}>
        QT
      </span>
    </div>
  );
}
