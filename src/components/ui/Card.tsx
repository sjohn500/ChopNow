import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const PADDING_MAP = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6 md:p-7',
};

export function Card({
  children,
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`soft-card-shadow rounded-[16px] bg-surface text-text-primary transition-all duration-200 ${
        interactive ? 'hover:-translate-y-0.5' : ''
      } ${PADDING_MAP[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
