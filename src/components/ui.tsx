import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export function Btn({
  children,
  onClick,
  disabled,
  variant = 'default',
  className,
  title,
  size = 'md',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger' | 'ghost' | 'gold';
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants: Record<string, string> = {
    default: 'bg-slate-700/80 hover:bg-slate-600 text-slate-100 border-slate-500/40',
    primary: 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400/50 font-semibold',
    gold: 'bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 border-amber-300/60 font-bold',
    danger: 'bg-rose-700/90 hover:bg-rose-600 text-white border-rose-400/40',
    ghost: 'bg-transparent hover:bg-white/10 text-slate-200 border-white/15',
  };
  const sizes: Record<string, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-lg border shadow-sm transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
  footer,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className={cn(
          'flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-amber-700/40 bg-[#131e29] shadow-2xl',
          wide ? 'max-w-5xl' : 'max-w-xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-amber-700/30 bg-gradient-to-r from-amber-900/40 to-transparent px-4 py-3">
          <h2 className="text-lg font-bold tracking-wide text-amber-100">{title}</h2>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-300 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 text-slate-200">{children}</div>
        {footer && <div className="border-t border-amber-700/30 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Bar({ value, max, color = 'bg-emerald-500' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%` }} />
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-slate-200', className)}>{children}</span>;
}
