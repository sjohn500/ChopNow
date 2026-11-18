import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon, error, id, className = '', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold text-text-primary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-secondary">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={`min-h-[46px] w-full rounded-[14px] border bg-surface text-sm text-text-primary transition-all duration-150 placeholder:text-text-secondary/75 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none ${
            icon ? 'pr-4 pl-10' : 'px-4'
          } ${
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-border-soft'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs font-medium text-error">{error}</p>
      )}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  id,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold text-text-primary"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full rounded-[14px] border bg-surface p-3.5 text-sm text-text-primary transition-all duration-150 placeholder:text-text-secondary/75 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none ${
          error ? 'border-error focus:border-error focus:ring-error/20' : 'border-border-soft'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs font-medium text-error">{error}</p>
      )}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({
  label,
  id,
  className = '',
  children,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold text-text-primary"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={`min-h-[46px] w-full rounded-[14px] border border-border-soft bg-surface px-3.5 text-sm font-medium text-text-primary transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
