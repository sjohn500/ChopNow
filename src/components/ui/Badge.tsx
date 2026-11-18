import { ReactNode } from 'react';

export type BadgeVariant =
  | 'peach'
  | 'mango'
  | 'coral'
  | 'success'
  | 'error'
  | 'pending'
  | 'accepted'
  | 'delivered';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_MAP: Record<BadgeVariant, string> = {
  peach: 'bg-primary-soft text-text-primary',
  mango: 'bg-accent text-text-primary',
  coral: 'bg-primary text-white',
  success: 'bg-success text-white',
  error: 'bg-error text-white',
  pending: 'bg-accent text-text-primary',
  accepted: 'bg-primary text-white',
  delivered: 'bg-success text-white',
};

export function Badge({
  variant = 'peach',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${VARIANT_MAP[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
