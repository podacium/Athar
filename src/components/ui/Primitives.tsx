import React, { useState } from 'react';
import { Leaf, X } from 'lucide-react';
import { cn } from '../../lib/api.ts';
import { useApp } from '../../context/AppContext.tsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-[#1B4D3E] text-white hover:bg-[#143B2F] border border-transparent',
    secondary:
      'bg-[#F2EFE9] text-[#17211C] hover:bg-[#E5E1D8] border border-[#E5E1D8]',
    outline:
      'bg-transparent text-[#17211C] hover:bg-[#F2EFE9] border border-[#D4CFC3]',
    ghost: 'bg-transparent text-[#52615A] hover:text-[#17211C] hover:bg-[#F2EFE9]/70',
    danger: 'bg-[#B91C1C] text-white hover:bg-[#991B1B] border border-transparent',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-sm min-h-[46px]',
  };

  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-md border border-[#D4CFC3] bg-white px-3.5 py-2 text-sm text-[#17211C] placeholder:text-[#7A8780] min-h-[42px] transition-colors focus:border-[#1B4D3E]',
        className
      )}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-md border border-[#D4CFC3] bg-white px-3 py-2 text-sm text-[#17211C] min-h-[42px] transition-colors focus:border-[#1B4D3E]',
        className
      )}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-md border border-[#D4CFC3] bg-white px-3.5 py-2.5 text-sm text-[#17211C] placeholder:text-[#7A8780] transition-colors focus:border-[#1B4D3E]',
        className
      )}
    />
  );
}

export function SafeImage({
  src,
  alt,
  className,
  fallbackTitle,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-[#F2EFE9] text-[#52615A] p-6 text-center',
          className
        )}
      >
        <Leaf className="w-8 h-8 text-[#4A7C59] mb-2" aria-hidden="true" />
        <span className="text-xs font-medium">{fallbackTitle || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function ToastViewport() {
  const { toasts } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 end-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto rounded-md border px-4 py-3 text-sm shadow-md bg-white',
            toast.type === 'error'
              ? 'border-[#B91C1C]/30 text-[#991B1B]'
              : toast.type === 'info'
                ? 'border-[#D4CFC3] text-[#17211C]'
                : 'border-[#1B4D3E]/30 text-[#1B4D3E]'
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = true,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
    >
      <div className="w-full max-w-md rounded-lg border border-[#E5E1D8] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-[#17211C]">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="text-[#52615A] hover:text-[#17211C] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-[#52615A] leading-relaxed">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
