import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  variant?: 'sand' | 'cream' | 'white';
}

const PADDING_MAP = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6 md:p-7',
};

const VARIANT_MAP = {
  sand: 'bg-primary-soft/94 backdrop-blur-md border border-border-soft/85',
  cream: 'bg-bg/92 backdrop-blur-md border border-border-soft',
  white: 'bg-surface/95 backdrop-blur-md border border-border-soft/80',
};

export function Card({
  children,
  padding = 'md',
  interactive = false,
  variant = 'sand',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`soft-card-shadow rounded-[16px] text-text-primary transition-all duration-200 ${VARIANT_MAP[variant]} ${
        interactive ? 'hover:-translate-y-0.5' : ''
      } ${PADDING_MAP[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
