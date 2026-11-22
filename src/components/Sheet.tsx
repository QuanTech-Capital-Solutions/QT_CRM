import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Responsive modal: full-screen bottom-sheet on mobile (<md), centered
 * modal on desktop. Prevents body scroll while open.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-light-card dark:bg-dark-card md:rounded-xl rounded-t-2xl border border-light-border dark:border-dark-border shadow-2xl flex flex-col max-h-[92vh] md:max-h-[90vh] animate-slide-up md:animate-scale-in">
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-light-border dark:border-dark-border bg-light-border dark:bg-dark-border" />
        </div>
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-light-border dark:border-dark-border">
          <h2 className="text-lg font-bold truncate pr-2">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-light-canvas dark:hover:bg-dark-canvas transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5">{children}</div>
        {footer && (
          <div className="px-5 md:px-6 py-4 border-t border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card md:rounded-b-xl sticky bottom-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
